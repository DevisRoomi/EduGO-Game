import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type {
  ActiveQuestionView,
  AnswerRecord,
  GameMode,
  GamePhase,
  GateFeedback,
  HatStyle,
  HudSnapshot,
  PaceLevel,
  PlayerStats,
  PowerupType,
  Question,
  RemotePlayerState,
  RoomMemberInfo,
  WorldTheme,
} from './types';
import {
  computeBotTargetLane,
  computeCameraFraming,
  computeEffectiveSpeed,
  determineRaceWinner,
  evaluateGateAnswer,
  evaluateObstacleEncounter,
  getFinishLineZ,
  getGateZ,
  getLaneWorldX,
  PACE_CONFIGS,
  POWERUP_CONFIG,
  rankPlayers,
  selectNeighborRivals,
  TRACK_CONFIG,
} from './rules';
import {
  buildTrackRibbons,
  createFinishArch,
  createObstacleModel,
  createPowerupModel,
  createQuestionGateSet,
  createRunnerRig,
  createStarMesh,
  drawRunnerNameplate,
  RUNNER_PALETTES,
  setRunnerHat,
  type GateVisual,
  type ObstacleVisual,
  type PowerupVisual,
  type RunnerRig,
  type StarVisual,
} from './models';
import { createWorldBundle, disposeWorldBundle, type WorldBundle } from './worlds';
import { soundEngine } from './sound';

interface RunnerSim {
  id: string;
  slot: 1 | 2;
  name: string;
  colorIndex: number;
  hatStyle: HatStyle;
  trackCenterX: number;
  lane: number;
  worldX: number;
  y: number;
  vy: number;
  z: number;
  speed: number;
  score: number;
  streak: number;
  bestStreak: number;
  correctCount: number;
  wrongCount: number;
  obstaclesCleared: number;
  starsCollected: number;
  boostTimer: number;
  stumbleTimer: number;
  hasShield: boolean;
  magnetTimer: number;
  feverActive: boolean;
  feverTrailTimer: number;
  hitFlashTimer: number;
  jumpBufferTimer: number;
  squashX: number;
  squashY: number;
  stridePhase: number;
  finished: boolean;
  finishTime: number | null;
  rig: RunnerRig;
}

interface Particle {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  scale: number;
  rot: number;
  color: THREE.Color;
}

export interface RaceStartOptions {
  mode: GameMode;
  pace: PaceLevel;
  worldTheme?: WorldTheme;
  p1Name: string;
  p2Name: string;
  p1Hat?: HatStyle;
  p2Hat?: HatStyle;
  deck: Question[];
  skipCountdown?: boolean;
  durationOverrideSec?: number;
  // For multi-device 2..8 players
  localPlayerId?: string;
  members?: RoomMemberInfo[];
}

export interface RaceEngineCallbacks {
  onHudUpdate: (snapshot: HudSnapshot) => void;
  onLocalPlayerSync?: (state: RemotePlayerState) => void;
}

const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _euler = new THREE.Euler();
const _scaleVec = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export class RaceEngine {
  private mountEl: HTMLElement;
  private callbacks: RaceEngineCallbacks;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean;
  private maxAniso: number;

  private phase: GamePhase = 'title';
  private mode: GameMode = 'local2p';
  private pace: PaceLevel = 'normal';
  private worldTheme: WorldTheme = 'taman';
  private p1PreviewHat: HatStyle = 'sport';
  private p2PreviewHat: HatStyle = 'sport';
  private activeFinishZ: number = getFinishLineZ('normal');
  private maxWorldLength: number = getFinishLineZ('santai') + 40;
  private localPlayerId: string = 'p1';

  private hemiLight: THREE.HemisphereLight;
  private sunLight: THREE.DirectionalLight;
  private rimLight: THREE.DirectionalLight;
  private worldBundle: WorldBundle | null = null;

  private deck: Question[] = [];
  private dynamicGroup: THREE.Group;
  private trackGroup: THREE.Group;
  private gates: GateVisual[] = [];
  private obstacles: ObstacleVisual[] = [];
  private stars: StarVisual[] = [];
  private powerups: PowerupVisual[] = [];

  private p1: RunnerSim;
  private p2: RunnerSim;
  // Extra 3rd runner rig strictly for Right Neighbor in 3..8 player multi-device mode
  private rightRivalRig: RunnerRig;
  private rightRivalX = -TRACK_CONFIG.multiTrackOffset;
  private rightRivalZ = 0;
  private rightRivalY = 0;
  private rightRivalStride = 0;

  private remotePeers: Map<string, RemotePlayerState> = new Map();
  private botDecisions: Map<number, number> = new Map();

  // Zero-GC particle pool (240 particles for gameplay bursts + victory fireworks!)
  private particles: Particle[] = [];
  private particleMesh: THREE.InstancedMesh;
  private particleCursor = 0;
  private fireworkTimer = 0;

  // Timing, camera feel & feedback
  private frameId = 0;
  private disposed = false;
  private lastTimeMs = 0;
  private titleClock = 0;
  private elapsedRaceSec = 0;
  private timeRemaining: number = PACE_CONFIGS.normal.roundDurationSec;
  private countdownTimer = 0;
  private lastCountdownInt = 0;
  private hitstopTimer = 0;
  private cameraTrauma = 0;
  private hudEmitTimer = 0;
  private syncEmitTimer = 0;
  private feedbackCounter = 0;
  private p1Feedback: GateFeedback | null = null;
  private p2Feedback: GateFeedback | null = null;
  private p1FeedbackTimer = 0;
  private p2FeedbackTimer = 0;
  private winner: 'p1' | 'p2' | 'draw' | null = null;
  private winnerName: string | null = null;
  private leftRivalName: string | null = null;
  private rightRivalName: string | null = null;
  private answerHistory: AnswerRecord[] = [];
  private finishGraceTimer = 0;

  private camPos = new THREE.Vector3(7.4, 7.4, -14.8);
  private camLook = new THREE.Vector3(5.6, 2.1, 18);

  private heldKeys = new Set<string>();
  private resizeObserver: ResizeObserver;
  private touchStartX: number | null = null;
  private touchStartY: number | null = null;

  constructor(mountEl: HTMLElement, callbacks: RaceEngineCallbacks) {
    this.mountEl = mountEl;
    this.callbacks = callbacks;
    this.isSoftwareGl = detectSoftwareWebGL();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87cefa);
    this.scene.fog = new THREE.Fog(0xb6e3ff, 68, 250);

    const width = Math.max(mountEl.clientWidth, 320);
    const height = Math.max(mountEl.clientHeight, 240);
    this.camera = new THREE.PerspectiveCamera(56, width / height, 0.2, 340);
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: this.isSoftwareGl,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.maxAniso = this.isSoftwareGl ? 1 : Math.min(this.renderer.capabilities.getMaxAnisotropy(), 8);

    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.setAttribute('data-testid', 'race-canvas');
    this.mountEl.appendChild(this.renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x4d7c0f, 0.88);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff4d6, 1.55);
    this.sunLight.position.set(24, 42, -16);
    if (!this.isSoftwareGl) {
      this.sunLight.castShadow = true;
      this.sunLight.shadow.mapSize.set(1024, 1024);
      this.sunLight.shadow.camera.near = 5;
      this.sunLight.shadow.camera.far = 140;
      this.sunLight.shadow.camera.left = -30;
      this.sunLight.shadow.camera.right = 30;
      this.sunLight.shadow.camera.top = 36;
      this.sunLight.shadow.camera.bottom = -36;
      this.sunLight.shadow.bias = -0.0005;
      this.sunLight.shadow.normalBias = 0.02;
    }
    this.scene.add(this.sunLight);

    this.rimLight = new THREE.DirectionalLight(0x93c5fd, 0.45);
    this.rimLight.position.set(-22, 16, 30);
    this.scene.add(this.rimLight);

    this.trackGroup = new THREE.Group();
    this.scene.add(this.trackGroup);

    this.dynamicGroup = new THREE.Group();
    this.scene.add(this.dynamicGroup);

    // Mount initial world theme (Taman Nusantara)
    this.applyWorldTheme('taman', false);

    // Runners
    const p1Rig = createRunnerRig({ ...RUNNER_PALETTES[0], numberLabel: '1', nameLabel: 'Raka', hatStyle: 'sport' });
    const p2Rig = createRunnerRig({ ...RUNNER_PALETTES[1], numberLabel: '2', nameLabel: 'Siti', hatStyle: 'sport' });
    this.rightRivalRig = createRunnerRig({ ...RUNNER_PALETTES[2], numberLabel: '3', nameLabel: 'Lawan', hatStyle: 'sport' });
    this.rightRivalRig.root.visible = false;
    this.scene.add(p1Rig.root, p2Rig.root, this.rightRivalRig.root);

    this.p1 = this.makeInitialRunner('p1', 1, 'Raka', 0, 'sport', TRACK_CONFIG.p1TrackCenterX, p1Rig);
    this.p2 = this.makeInitialRunner('p2', 2, 'Siti', 1, 'sport', TRACK_CONFIG.p2TrackCenterX, p2Rig);

    // 240 zero-GC pooled confetti & fireworks particles
    const particleCount = 240;
    const pGeo = new THREE.OctahedronGeometry(0.2, 0);
    const pMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.15,
      flatShading: true,
    });
    this.particleMesh = new THREE.InstancedMesh(pGeo, pMat, particleCount);
    this.particleMesh.frustumCulled = false;
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: -50,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 1,
        scale: 0,
        rot: 0,
        color: new THREE.Color(0xfacc15),
      });
      _mat4.makeScale(0, 0, 0);
      this.particleMesh.setMatrixAt(i, _mat4);
      this.particleMesh.setColorAt(i, this.particles[i].color);
    }
    this.particleMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.particleMesh);

    this.rebuildTracks(false, getFinishLineZ('normal'));
    this.buildPreviewTrack();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleWindowBlur);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.renderer.domElement.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    this.renderer.domElement.addEventListener('touchend', this.handleTouchEnd, { passive: true });

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.mountEl);

    this.lastTimeMs = performance.now();
    this.renderer.render(this.scene, this.camera);
    this.scheduleNextFrame();
  }

  private applyWorldTheme(theme: WorldTheme, rebuildTrackNow: boolean = true): void {
    this.worldTheme = theme;
    if (this.worldBundle) {
      this.scene.remove(this.worldBundle.root);
      disposeWorldBundle(this.worldBundle);
      this.worldBundle = null;
    }

    const bundle = createWorldBundle(theme, this.maxWorldLength, this.maxAniso);
    this.worldBundle = bundle;
    this.scene.add(bundle.root);

    const cfg = bundle.config;
    this.scene.background = new THREE.Color(cfg.skyHex);
    this.scene.fog = new THREE.Fog(cfg.fogHex, cfg.fogNear, cfg.fogFar);
    this.hemiLight.color.setHex(cfg.hemiSky);
    this.hemiLight.groundColor.setHex(cfg.hemiGround);
    this.hemiLight.intensity = cfg.hemiIntensity;
    this.sunLight.color.setHex(cfg.sunColor);
    this.sunLight.intensity = cfg.sunIntensity;
    this.rimLight.color.setHex(cfg.rimColor);
    this.rimLight.intensity = cfg.rimIntensity;
    this.renderer.toneMappingExposure = cfg.exposure;

    if (rebuildTrackNow) {
      this.rebuildTracks(this.mode === 'onlineMulti' && this.phase !== 'title', this.activeFinishZ);
    }
  }

  public setWorldTheme(theme: WorldTheme): void {
    if (this.worldTheme === theme && this.worldBundle) return;
    this.applyWorldTheme(theme, true);
    this.renderer.render(this.scene, this.camera);
  }

  public setPreviewHats(p1Hat: HatStyle, p2Hat: HatStyle): void {
    this.p1PreviewHat = p1Hat;
    this.p2PreviewHat = p2Hat;
    if (this.phase === 'title') {
      this.p1.hatStyle = p1Hat;
      this.p2.hatStyle = p2Hat;
      setRunnerHat(this.p1.rig, p1Hat);
      setRunnerHat(this.p2.rig, p2Hat);
      this.renderer.render(this.scene, this.camera);
    }
  }

  private applyRigPalette(rig: RunnerRig, colorIndex: number, nameLabel: string, hatStyle?: HatStyle): void {
    const pal = RUNNER_PALETTES[colorIndex % RUNNER_PALETTES.length];
    rig.jerseyMat.color.setHex(pal.jersey);
    rig.capMat.color.setHex(pal.cap);
    rig.backpackMat.color.setHex(pal.backpack);
    if (hatStyle) {
      setRunnerHat(rig, hatStyle);
    }
    if (rig.currentLabel !== nameLabel) {
      rig.currentLabel = nameLabel;
      drawRunnerNameplate(
        rig.namePlateCanvas,
        rig.namePlateTexture,
        nameLabel,
        `#${pal.jersey.toString(16).padStart(6, '0')}`,
      );
    }
  }

  private makeInitialRunner(
    id: string,
    slot: 1 | 2,
    name: string,
    colorIndex: number,
    hatStyle: HatStyle,
    trackCenterX: number,
    rig: RunnerRig,
  ): RunnerSim {
    const startX = getLaneWorldX(slot, 1, trackCenterX);
    rig.root.position.set(startX, 0, 0);
    rig.root.visible = true;
    rig.crownGroup.visible = false;
    rig.shieldBubble.visible = false;
    rig.magnetRing.visible = false;
    this.applyRigPalette(rig, colorIndex, name, hatStyle);
    return {
      id,
      slot,
      name,
      colorIndex,
      hatStyle,
      trackCenterX,
      lane: 1,
      worldX: startX,
      y: 0,
      vy: 0,
      z: 0,
      speed: PACE_CONFIGS[this.pace].baseSpeed,
      score: 0,
      streak: 0,
      bestStreak: 0,
      correctCount: 0,
      wrongCount: 0,
      obstaclesCleared: 0,
      starsCollected: 0,
      boostTimer: 0,
      stumbleTimer: 0,
      hasShield: false,
      magnetTimer: 0,
      feverActive: false,
      feverTrailTimer: 0,
      hitFlashTimer: 0,
      jumpBufferTimer: 0,
      squashX: 1,
      squashY: 1,
      stridePhase: slot === 1 ? 0 : Math.PI,
      finished: false,
      finishTime: null,
      rig,
    };
  }

  private clearGroup(g: THREE.Group): void {
    while (g.children.length > 0) {
      g.remove(g.children[0]);
    }
  }

  private rebuildTracks(isThreeTrack: boolean, finishZ: number): void {
    this.clearGroup(this.trackGroup);
    const ribbons = buildTrackRibbons(isThreeTrack, finishZ + 20, this.maxAniso, this.worldTheme);
    const finishArch = createFinishArch(finishZ, this.maxAniso, isThreeTrack ? 14.5 : 10.6);
    this.trackGroup.add(ribbons, finishArch);
  }

  private clearDynamicTrack(): void {
    this.clearGroup(this.dynamicGroup);
    this.gates = [];
    this.obstacles = [];
    this.stars = [];
    this.powerups = [];
  }

  private buildPreviewTrack(): void {
    this.clearDynamicTrack();
    const previewQ: Question = {
      id: 'preview-1',
      subject: 'Lari Pintar',
      prompt: 'Siap Balapan?',
      options: ['Cepat', 'Pintar', 'Juara'],
      correctIndex: 1,
    };
    const gate = createQuestionGateSet(previewQ, 0, 34, this.maxAniso, [
      TRACK_CONFIG.p1TrackCenterX,
      TRACK_CONFIG.p2TrackCenterX,
    ]);
    this.dynamicGroup.add(gate.group);
    this.gates.push(gate);

    const hurdle1 = createObstacleModel('hurdle');
    hurdle1.position.set(getLaneWorldX(1, 0), 0, 18);
    const hurdle2 = createObstacleModel('cone');
    hurdle2.position.set(getLaneWorldX(2, 2), 0, 21);
    this.dynamicGroup.add(hurdle1, hurdle2);
  }

  private buildRaceCourse(deck: Question[]): void {
    this.clearDynamicTrack();
    this.deck = deck;
    this.answerHistory = deck.map((q, idx) => ({
      questionIndex: idx,
      prompt: q.prompt,
      correctOption: q.options[q.correctIndex],
      p1Choice: null,
      p1Correct: false,
      p2Choice: null,
      p2Correct: false,
    }));
    this.botDecisions.clear();

    const isMulti = this.mode === 'onlineMulti';
    const trackCenters = isMulti
      ? [0, TRACK_CONFIG.multiTrackOffset, -TRACK_CONFIG.multiTrackOffset]
      : [TRACK_CONFIG.p1TrackCenterX, TRACK_CONFIG.p2TrackCenterX];

    deck.forEach((question, index) => {
      const gateZ = getGateZ(index, this.pace);
      const gate = createQuestionGateSet(question, index, gateZ, this.maxAniso, trackCenters);
      this.dynamicGroup.add(gate.group);
      this.gates.push(gate);

      this.botDecisions.set(index, computeBotTargetLane(question.correctIndex, 0.72));

      // Leave generous clear runway before each gate so kids can read & pick lanes calmly!
      const prevZ = index === 0 ? 14 : getGateZ(index - 1, this.pace) + 14;
      const midZ = prevZ + 11;
      const obsLane = (index * 2 + 1) % 3;
      const obsType: 'hurdle' | 'cone' = index % 2 === 0 ? 'hurdle' : 'cone';

      const obstacleTrackConfigs: Array<{ slot: 1 | 2; centerX: number }> = isMulti
        ? [{ slot: 1, centerX: 0 }]
        : [
            { slot: 1, centerX: TRACK_CONFIG.p1TrackCenterX },
            { slot: 2, centerX: TRACK_CONFIG.p2TrackCenterX },
          ];

      obstacleTrackConfigs.forEach(({ slot, centerX }) => {
        const obsModel = createObstacleModel(obsType);
        obsModel.position.set(getLaneWorldX(slot, obsLane, centerX), 0, midZ);
        this.dynamicGroup.add(obsModel);
        this.obstacles.push({
          group: obsModel,
          playerSlot: slot,
          lane: obsLane,
          z: midZ,
          type: obsType,
          resolved: false,
        });

        // Second obstacle on later gates only in Normal / Cepat pace (keep Santai extra kid-friendly!)
        if (index >= 4 && this.pace !== 'santai') {
          const secondLane = (obsLane + 1) % 3;
          const secondZ = midZ + 9;
          const obs2 = createObstacleModel(obsType === 'hurdle' ? 'cone' : 'hurdle');
          obs2.position.set(getLaneWorldX(slot, secondLane, centerX), 0, secondZ);
          this.dynamicGroup.add(obs2);
          this.obstacles.push({
            group: obs2,
            playerSlot: slot,
            lane: secondLane,
            z: secondZ,
            type: obsType === 'hurdle' ? 'cone' : 'hurdle',
            resolved: false,
          });
        }

        const starLane = (obsLane + 2) % 3;
        const starX = getLaneWorldX(slot, starLane, centerX);
        const starMesh = createStarMesh();
        starMesh.position.set(starX, 1.35, midZ + 3);
        this.dynamicGroup.add(starMesh);
        this.stars.push({
          mesh: starMesh,
          playerSlot: slot,
          lane: starLane,
          z: midZ + 3,
          baseX: starX,
          collected: false,
        });

        // Extra star trail on alternating gates so Magnet Bintang feels super rewarding!
        if (index % 2 === 1) {
          const bonusStarLane = (starLane + 1) % 3;
          const bonusX = getLaneWorldX(slot, bonusStarLane, centerX);
          const bonusStar = createStarMesh();
          bonusStar.position.set(bonusX, 1.35, midZ + 7.5);
          this.dynamicGroup.add(bonusStar);
          this.stars.push({
            mesh: bonusStar,
            playerSlot: slot,
            lane: bonusStarLane,
            z: midZ + 7.5,
            baseX: bonusX,
            collected: false,
          });
        }

        // Spawn Power-Ups (Shield & Magnet alternating on odd/early gates)
        if (index === 0 || index === 2 || index === 4 || index === 6 || index === 8) {
          const pType: PowerupType = index % 4 === 0 ? 'shield' : 'magnet';
          const pLane = (obsLane + 1) % 3;
          const pModel = createPowerupModel(pType);
          const pZ = Math.min(gateZ - 12, midZ + 12.5);
          pModel.position.set(getLaneWorldX(slot, pLane, centerX), 1.4, pZ);
          this.dynamicGroup.add(pModel);
          this.powerups.push({
            group: pModel,
            playerSlot: slot,
            lane: pLane,
            z: pZ,
            type: pType,
            collected: false,
          });
        }
      });
    });
  }

  public startRace(options: RaceStartOptions): void {
    this.mode = options.mode;
    this.pace = options.pace;
    if (options.worldTheme && options.worldTheme !== this.worldTheme) {
      this.applyWorldTheme(options.worldTheme, false);
    }
    const paceCfg = PACE_CONFIGS[this.pace];
    this.activeFinishZ = getFinishLineZ(this.pace);
    this.localPlayerId = options.localPlayerId || 'p1';

    this.remotePeers.clear();
    this.winner = null;
    this.winnerName = null;
    this.leftRivalName = null;
    this.rightRivalName = null;
    this.p1Feedback = null;
    this.p2Feedback = null;
    this.p1FeedbackTimer = 0;
    this.p2FeedbackTimer = 0;
    this.elapsedRaceSec = 0;
    this.timeRemaining = options.durationOverrideSec ?? paceCfg.roundDurationSec;
    this.hitstopTimer = 0;
    this.cameraTrauma = 0;
    this.finishGraceTimer = 0;
    this.fireworkTimer = 0;
    this.heldKeys.clear();

    const isMulti = this.mode === 'onlineMulti';
    this.rebuildTracks(isMulti, this.activeFinishZ);

    const p1Hat = options.p1Hat || this.p1PreviewHat;
    const p2Hat = options.p2Hat || this.p2PreviewHat;
    this.p1PreviewHat = p1Hat;
    this.p2PreviewHat = p2Hat;

    if (isMulti) {
      const meMember = options.members?.find((m) => m.id === this.localPlayerId);
      const myColor = meMember?.colorIndex ?? 0;
      const myName = meMember?.name || options.p1Name;
      const myHat = meMember?.hatStyle || p1Hat;

      // Local player always owns the centered track (x = 0)
      this.p1 = this.makeInitialRunner(this.localPlayerId, 1, myName, myColor, myHat, 0, this.p1.rig);
      // p2 rig acts as dynamic LEFT neighbor (+multiTrackOffset)
      this.p2 = this.makeInitialRunner(
        'left-rival',
        2,
        'Teman',
        1,
        'sport',
        TRACK_CONFIG.multiTrackOffset,
        this.p2.rig,
      );
      this.p2.rig.root.visible = false;
      this.rightRivalRig.root.visible = false;

      // Seed all remote room members so leaderboard immediately lists everyone!
      (options.members || []).forEach((m) => {
        if (m.id === this.localPlayerId) return;
        this.remotePeers.set(m.id, {
          playerId: m.id,
          name: m.name,
          colorIndex: m.colorIndex,
          hatStyle: m.hatStyle || 'sport',
          z: 0,
          lane: 1,
          y: 0,
          speed: paceCfg.baseSpeed,
          score: 0,
          streak: 0,
          bestStreak: 0,
          correctCount: 0,
          wrongCount: 0,
          obstaclesCleared: 0,
          starsCollected: 0,
          boostActive: false,
          stumbleActive: false,
          hasShield: false,
          magnetActive: false,
          feverActive: false,
          finished: false,
          finishTime: null,
        });
      });
    } else {
      this.rightRivalRig.root.visible = false;
      this.p1 = this.makeInitialRunner(
        'p1',
        1,
        options.p1Name,
        0,
        p1Hat,
        TRACK_CONFIG.p1TrackCenterX,
        this.p1.rig,
      );
      this.p2 = this.makeInitialRunner(
        'p2',
        2,
        options.p2Name,
        1,
        p2Hat,
        TRACK_CONFIG.p2TrackCenterX,
        this.p2.rig,
      );
    }

    this.buildRaceCourse(options.deck);

    const framing = computeCameraFraming(
      this.camera.aspect,
      this.mode,
      this.p1.trackCenterX,
      false,
      false,
    );
    this.camPos.set(framing.focusX, framing.camHeight, -framing.camBack);
    this.camLook.set(framing.focusX, framing.camLookY, framing.camLookZOffset);
    this.camera.fov = framing.fov;
    this.camera.updateProjectionMatrix();
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);

    if (options.skipCountdown) {
      this.phase = 'playing';
      this.countdownTimer = 0;
      document.body.dataset.state = 'playing';
      soundEngine.startBgm('normal');
    } else {
      this.phase = 'countdown';
      this.countdownTimer = 2.6;
      this.lastCountdownInt = 3;
      document.body.dataset.state = 'playing';
      soundEngine.stopBgm();
      soundEngine.playCountdownTick(false);
    }

    this.emitHudSnapshot();
  }

  public returnToTitle(): void {
    this.phase = 'title';
    this.winner = null;
    this.winnerName = null;
    this.heldKeys.clear();
    soundEngine.stopBgm();
    this.rightRivalRig.root.visible = false;
    this.rebuildTracks(false, getFinishLineZ(this.pace));
    this.p1 = this.makeInitialRunner('p1', 1, this.p1.name, 0, this.p1PreviewHat, TRACK_CONFIG.p1TrackCenterX, this.p1.rig);
    this.p2 = this.makeInitialRunner('p2', 2, this.p2.name, 1, this.p2PreviewHat, TRACK_CONFIG.p2TrackCenterX, this.p2.rig);
    this.buildPreviewTrack();
    document.body.dataset.state = 'title';
    this.emitHudSnapshot();
  }

  public setPaused(paused: boolean): void {
    if (paused && this.phase === 'playing') {
      this.phase = 'paused';
      this.heldKeys.clear();
      soundEngine.stopBgm();
      document.body.dataset.state = 'paused';
      this.emitHudSnapshot();
    } else if (!paused && this.phase === 'paused') {
      this.phase = 'playing';
      this.heldKeys.clear();
      this.lastTimeMs = performance.now();
      soundEngine.startBgm();
      document.body.dataset.state = 'playing';
      this.emitHudSnapshot();
    }
  }

  public applyPeerState(state: RemotePlayerState): void {
    if (this.mode !== 'onlineMulti') return;
    if (state.playerId === this.localPlayerId) return;
    this.remotePeers.set(state.playerId, state);
  }

  public removePeer(playerId: string): void {
    this.remotePeers.delete(playerId);
  }

  public triggerLaneMove(slot: 1 | 2, delta: -1 | 1): void {
    if (this.phase !== 'playing') return;
    if ((this.mode === 'onlineMulti' || this.mode === 'soloBot') && slot !== 1) return;

    const runner = slot === 1 ? this.p1 : this.p2;
    if (runner.finished) return;

    const nextLane = Math.max(0, Math.min(2, runner.lane + delta));
    if (nextLane !== runner.lane) {
      runner.lane = nextLane;
      soundEngine.playLaneSwitch();
      this.emitHudSnapshot();
    }
  }

  public setRunnerLane(slot: 1 | 2, lane: 0 | 1 | 2): void {
    if (this.phase !== 'playing') return;
    if ((this.mode === 'onlineMulti' || this.mode === 'soloBot') && slot !== 1) return;

    const runner = slot === 1 ? this.p1 : this.p2;
    if (runner.finished) return;

    const clamped = Math.max(0, Math.min(2, lane));
    if (clamped !== runner.lane) {
      runner.lane = clamped;
      soundEngine.playLaneSwitch();
      this.emitHudSnapshot();
    }
  }

  public triggerJump(slot: 1 | 2): void {
    if (this.phase !== 'playing') return;
    if ((this.mode === 'onlineMulti' || this.mode === 'soloBot') && slot !== 1) return;

    const runner = slot === 1 ? this.p1 : this.p2;
    if (runner.finished) return;
    runner.jumpBufferTimer = 0.14;
  }

  private handleTouchStart = (e: TouchEvent): void => {
    if (this.phase !== 'playing' || e.touches.length === 0) return;
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
  };

  private handleTouchEnd = (e: TouchEvent): void => {
    if (
      this.phase !== 'playing' ||
      this.touchStartX === null ||
      this.touchStartY === null ||
      e.changedTouches.length === 0
    ) {
      this.touchStartX = null;
      this.touchStartY = null;
      return;
    }

    const dx = e.changedTouches[0].clientX - this.touchStartX;
    const dy = e.changedTouches[0].clientY - this.touchStartY;
    this.touchStartX = null;
    this.touchStartY = null;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const swipeThreshold = 26;

    if (absX < swipeThreshold && absY < swipeThreshold) return;

    if (absX >= absY) {
      this.triggerLaneMove(1, dx > 0 ? 1 : -1);
    } else if (dy < -swipeThreshold) {
      this.triggerJump(1);
    }
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    const code = e.code;
    const isRepeat = this.heldKeys.has(code);
    this.heldKeys.add(code);

    if (this.phase !== 'playing' || isRepeat) return;

    if (this.mode === 'local2p') {
      if (code === 'KeyA') this.triggerLaneMove(1, -1);
      else if (code === 'KeyD') this.triggerLaneMove(1, 1);
      else if (code === 'KeyW') this.triggerJump(1);
      else if (code === 'ArrowLeft') {
        e.preventDefault();
        this.triggerLaneMove(2, -1);
      } else if (code === 'ArrowRight') {
        e.preventDefault();
        this.triggerLaneMove(2, 1);
      } else if (code === 'ArrowUp') {
        e.preventDefault();
        this.triggerJump(2);
      }
    } else {
      if (code === 'KeyA' || code === 'ArrowLeft') {
        e.preventDefault();
        this.triggerLaneMove(1, -1);
      } else if (code === 'KeyD' || code === 'ArrowRight') {
        e.preventDefault();
        this.triggerLaneMove(1, 1);
      } else if (code === 'KeyW' || code === 'ArrowUp' || code === 'Space') {
        e.preventDefault();
        this.triggerJump(1);
      }
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.heldKeys.delete(e.code);
    if (this.phase !== 'playing') return;
    if (e.code === 'KeyW' && this.p1.vy > 4.5) {
      this.p1.vy *= 0.55;
    }
    if (e.code === 'ArrowUp' && this.mode === 'local2p' && this.p2.vy > 4.5) {
      this.p2.vy *= 0.55;
    }
  };

  private handleWindowBlur = (): void => {
    this.heldKeys.clear();
  };

  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.heldKeys.clear();
    }
  };

  private handleResize(): void {
    if (this.disposed) return;
    const width = Math.max(this.mountEl.clientWidth, 320);
    const height = Math.max(this.mountEl.clientHeight, 240);
    this.camera.aspect = width / height;
    if (this.phase === 'playing' || this.phase === 'countdown') {
      const framing = computeCameraFraming(
        this.camera.aspect,
        this.mode,
        this.p1.trackCenterX,
        this.p1.boostTimer > 0,
        this.p1.feverActive,
      );
      this.camera.fov = framing.fov;
      const targetZ =
        this.mode === 'local2p' && !framing.isPortrait
          ? (this.p1.z + this.p2.z) * 0.5
          : this.p1.z;
      this.camPos.set(framing.focusX, framing.camHeight, targetZ - framing.camBack);
      this.camLook.set(framing.focusX, framing.camLookY, targetZ + framing.camLookZOffset);
      this.camera.position.copy(this.camPos);
      this.camera.lookAt(this.camLook);
    }
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.render(this.scene, this.camera);
  }

  private spawnParticles(
    x: number,
    y: number,
    z: number,
    count: number,
    colors: number[],
    fireworkMode: boolean = false,
  ): void {
    for (let i = 0; i < count; i++) {
      const p = this.particles[this.particleCursor];
      this.particleCursor = (this.particleCursor + 1) % this.particles.length;
      p.active = true;
      p.x = x + (Math.random() - 0.5) * (fireworkMode ? 0.5 : 0.8);
      p.y = y + Math.random() * (fireworkMode ? 0.5 : 0.7);
      p.z = z + (Math.random() - 0.5) * 0.6;

      if (fireworkMode) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const spd = 4.5 + Math.random() * 8.5;
        p.vx = Math.sin(phi) * Math.cos(theta) * spd;
        p.vy = Math.cos(phi) * spd + 3.5;
        p.vz = Math.sin(phi) * Math.sin(theta) * spd;
        p.maxLife = 0.9 + Math.random() * 0.65;
        p.scale = 0.85 + Math.random() * 1.1;
      } else {
        const angle = Math.random() * Math.PI * 2;
        const spd = 2.5 + Math.random() * 6.5;
        p.vx = Math.cos(angle) * spd;
        p.vy = 4 + Math.random() * 7;
        p.vz = Math.sin(angle) * spd + 3;
        p.maxLife = 0.45 + Math.random() * 0.45;
        p.scale = 0.7 + Math.random() * 0.9;
      }
      p.life = 0;
      p.rot = Math.random() * Math.PI;
      p.color.setHex(colors[i % colors.length]);
    }
  }

  private updateParticles(dt: number): void {
    let dirty = false;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      dirty = true;
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        _mat4.makeScale(0, 0, 0);
        this.particleMesh.setMatrixAt(i, _mat4);
        continue;
      }
      p.vy -= 14 * dt;
      p.x += p.vx * dt;
      p.y = Math.max(0.1, p.y + p.vy * dt);
      p.z += p.vz * dt;
      p.rot += 8 * dt;

      const s = p.scale * (1 - p.life / p.maxLife);
      _vec3A.set(p.x, p.y, p.z);
      _euler.set(p.rot, p.rot * 0.7, 0);
      _quat.setFromEuler(_euler);
      _scaleVec.set(s, s, s);
      _mat4.compose(_vec3A, _quat, _scaleVec);
      this.particleMesh.setMatrixAt(i, _mat4);
      this.particleMesh.setColorAt(i, p.color);
    }
    if (dirty) {
      this.particleMesh.instanceMatrix.needsUpdate = true;
      if (this.particleMesh.instanceColor) {
        this.particleMesh.instanceColor.needsUpdate = true;
      }
    }
  }

  private getCameraFocusX(): number {
    if (this.mode === 'onlineMulti') return this.p1.worldX * 0.35;
    if (this.mode === 'local2p') return 0;
    return this.p1.worldX * 0.65;
  }

  private updateBotAi(simDt: number): void {
    if (this.mode !== 'soloBot' || this.p2.finished) return;

    for (const obs of this.obstacles) {
      if (obs.playerSlot !== 2 || obs.resolved) continue;
      const dist = obs.z - this.p2.z;
      if (dist > 1.2 && dist < 8.5 && obs.lane === this.p2.lane) {
        if (this.p2.y <= 0.01 && Math.random() < 12 * simDt) {
          this.p2.jumpBufferTimer = 0.12;
        }
        return;
      }
    }

    for (const gate of this.gates) {
      if (gate.p2Triggered) continue;
      const dist = gate.z - this.p2.z;
      if (dist > 0 && dist < 26) {
        const targetLane = this.botDecisions.get(gate.questionIndex) ?? 1;
        if (this.p2.lane !== targetLane && dist < 22) {
          this.p2.lane = targetLane;
        }
        return;
      }
    }
  }

  private pushFeedback(slot: 1 | 2, fb: GateFeedback): void {
    if (slot === 1) {
      this.p1Feedback = fb;
      this.p1FeedbackTimer = 2.4;
    } else {
      this.p2Feedback = fb;
      this.p2FeedbackTimer = 2.4;
    }
  }

  private updateRunnerSimulation(runner: RunnerSim, simDt: number): void {
    if (runner.boostTimer > 0) runner.boostTimer = Math.max(0, runner.boostTimer - simDt);
    if (runner.stumbleTimer > 0) runner.stumbleTimer = Math.max(0, runner.stumbleTimer - simDt);
    if (runner.magnetTimer > 0) runner.magnetTimer = Math.max(0, runner.magnetTimer - simDt);
    if (runner.hitFlashTimer > 0) runner.hitFlashTimer = Math.max(0, runner.hitFlashTimer - simDt);
    if (runner.jumpBufferTimer > 0) runner.jumpBufferTimer = Math.max(0, runner.jumpBufferTimer - simDt);

    const paceCfg = PACE_CONFIGS[this.pace];
    const passedGates = this.gates.filter((g) => (runner.slot === 1 ? g.p1Triggered : g.p2Triggered)).length;
    const targetSpeed = runner.finished
      ? 0
      : computeEffectiveSpeed(
          paceCfg.baseSpeed,
          runner.boostTimer,
          runner.stumbleTimer,
          passedGates,
          runner.feverActive,
        );
    runner.speed = THREE.MathUtils.damp(runner.speed, targetSpeed, 7.5, simDt);
    runner.z += runner.speed * simDt;

    if (runner.jumpBufferTimer > 0 && runner.y <= 0.02) {
      runner.vy = TRACK_CONFIG.jumpVelocity;
      runner.jumpBufferTimer = 0;
      runner.squashX = 0.84;
      runner.squashY = 1.22;
      soundEngine.playJump();
      this.spawnParticles(runner.worldX, 0.2, runner.z, 5, [0xffffff, 0xfef08a]);
    }

    const wasAirborne = runner.y > 0.02;
    runner.vy -= TRACK_CONFIG.gravity * simDt;
    runner.y += runner.vy * simDt;
    if (runner.y <= 0) {
      runner.y = 0;
      runner.vy = 0;
      if (wasAirborne) {
        runner.squashX = 1.22;
        runner.squashY = 0.78;
      }
    }

    // Check answer gates
    for (const gate of this.gates) {
      const triggered = runner.slot === 1 ? gate.p1Triggered : gate.p2Triggered;
      if (triggered) continue;
      if (runner.z >= gate.z - 0.5) {
        if (runner.slot === 1) gate.p1Triggered = true;
        else gate.p2Triggered = true;

        const question = this.deck[gate.questionIndex];
        const wasFever = runner.feverActive;
        const evalRes = evaluateGateAnswer(
          runner.lane,
          question.correctIndex,
          runner.streak,
          runner.hasShield,
        );

        runner.score += evalRes.pointsDelta;
        runner.streak = evalRes.nextStreak;
        runner.bestStreak = Math.max(runner.bestStreak, runner.streak);
        runner.boostTimer = evalRes.boostTimer;
        runner.stumbleTimer = evalRes.stumbleTimer;
        runner.feverActive = evalRes.feverActive;
        if (evalRes.shieldConsumed) {
          runner.hasShield = false;
        }

        const record = this.answerHistory[gate.questionIndex];
        if (record) {
          if (runner.slot === 1) {
            record.p1Choice = runner.lane;
            record.p1Correct = evalRes.correct;
          } else {
            record.p2Choice = runner.lane;
            record.p2Correct = evalRes.correct;
          }
        }

        const curtains = runner.slot === 1 ? gate.p1Curtains : gate.p2Curtains;
        const hitCurtain = curtains[runner.lane];
        if (hitCurtain) hitCurtain.visible = false;

        let message = 'Kurang tepat!';
        if (evalRes.correct) {
          if (evalRes.feverActive && !wasFever) {
            message = `FEVER 2x AKTIF! +${evalRes.pointsDelta}`;
          } else if (evalRes.feverActive) {
            message = `FEVER 2x! +${evalRes.pointsDelta} · ${runner.streak}x`;
          } else if (runner.streak >= 2) {
            message = `Benar! +${evalRes.pointsDelta} · Streak ${runner.streak}x`;
          } else {
            message = `Benar! +${evalRes.pointsDelta} · Boost!`;
          }
        } else if (evalRes.shieldConsumed) {
          message = 'Perisai Melindungi! Streak Aman!';
        }

        this.pushFeedback(runner.slot, {
          id: ++this.feedbackCounter,
          player: runner.slot,
          correct: evalRes.correct,
          pointsDelta: evalRes.pointsDelta,
          message,
          correctAnswerText: evalRes.correct ? undefined : question.options[question.correctIndex],
        });

        if (evalRes.correct) {
          runner.correctCount += 1;
          if (evalRes.feverActive && !wasFever) {
            soundEngine.playFeverActivate();
            this.spawnParticles(runner.worldX, 1.8, gate.z, 32, [0xf43f5e, 0xfacc15, 0x34d399, 0x38bdf8, 0xa855f7]);
          } else {
            soundEngine.playCorrectGate(runner.streak);
            this.spawnParticles(runner.worldX, 1.5, gate.z, 24, [0xfacc15, 0x34d399, 0x38bdf8, 0xfb7185]);
          }
        } else if (evalRes.shieldConsumed) {
          runner.wrongCount += 1;
          soundEngine.playShieldBlock();
          this.spawnParticles(runner.worldX, 1.4, gate.z, 18, [0x38bdf8, 0xe0f2fe, 0xfacc15]);
        } else {
          runner.wrongCount += 1;
          runner.hitFlashTimer = 0.25;
          this.hitstopTimer = 0.045;
          this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.42);
          soundEngine.playWrongGate();
          this.spawnParticles(runner.worldX, 1.3, gate.z, 12, [0xf97316, 0xef4444, 0xfef08a]);
        }
        this.emitHudSnapshot();
      }
    }

    // Obstacles
    for (const obs of this.obstacles) {
      if (obs.playerSlot !== runner.slot || obs.resolved) continue;
      if (Math.abs(runner.z - obs.z) < 0.95) {
        const res = evaluateObstacleEncounter(
          runner.lane,
          runner.y,
          obs.lane,
          obs.type,
          runner.hasShield,
        );
        if (res.hit) {
          obs.resolved = true;
          runner.stumbleTimer = Math.max(runner.stumbleTimer, res.stumbleTimer);
          runner.hitFlashTimer = 0.22;
          this.hitstopTimer = 0.04;
          this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.35);
          soundEngine.playObstacleBump();
          obs.group.rotation.x = 1.25;
          obs.group.position.y = -0.15;
          this.spawnParticles(runner.worldX, 0.8, obs.z, 10, [0xf97316, 0xffffff]);
        } else if (res.shieldConsumed) {
          obs.resolved = true;
          runner.hasShield = false;
          runner.score += res.clearedBonus;
          obs.group.rotation.x = 1.35;
          obs.group.position.y = -0.2;
          soundEngine.playShieldBlock();
          this.spawnParticles(runner.worldX, 1.1, obs.z, 16, [0x38bdf8, 0xbae6fd, 0xffffff]);
          this.pushFeedback(runner.slot, {
            id: ++this.feedbackCounter,
            player: runner.slot,
            correct: true,
            pointsDelta: res.clearedBonus,
            message: 'Perisai Menahan Rintangan!',
          });
          this.emitHudSnapshot();
        } else if (res.clearedBonus > 0 && runner.z >= obs.z) {
          obs.resolved = true;
          runner.score += res.clearedBonus;
          runner.obstaclesCleared += 1;
          soundEngine.playStarPickup();
          this.spawnParticles(runner.worldX, runner.y + 0.5, obs.z, 7, [0x38bdf8, 0xfacc15]);
        }
      } else if (runner.z > obs.z + 1.4) {
        obs.resolved = true;
      }
    }

    // Track Power-Ups (Perisai & Magnet Bintang)
    for (const pu of this.powerups) {
      if (pu.playerSlot !== runner.slot || pu.collected) continue;
      if (Math.abs(runner.z - pu.z) < 1.3 && runner.lane === pu.lane) {
        pu.collected = true;
        pu.group.visible = false;
        soundEngine.playPowerupPickup(pu.type);
        if (pu.type === 'shield') {
          runner.hasShield = true;
          this.spawnParticles(runner.worldX, 1.4, pu.z, 16, [0x38bdf8, 0xe0f2fe, 0xfacc15]);
          this.pushFeedback(runner.slot, {
            id: ++this.feedbackCounter,
            player: runner.slot,
            correct: true,
            pointsDelta: 0,
            message: 'Perisai Aktif! Kebal 1 Kesalahan',
          });
        } else {
          runner.magnetTimer = POWERUP_CONFIG.magnetDurationSec;
          this.spawnParticles(runner.worldX, 1.4, pu.z, 16, [0xf43f5e, 0xfacc15, 0xffffff]);
          this.pushFeedback(runner.slot, {
            id: ++this.feedbackCounter,
            player: runner.slot,
            correct: true,
            pointsDelta: 0,
            message: 'Magnet Bintang Aktif (7d)!',
          });
        }
        this.emitHudSnapshot();
      }
    }

    // Golden stars (with Magnet Bintang attraction across all 3 lanes!)
    for (const star of this.stars) {
      if (star.playerSlot !== runner.slot || star.collected) continue;
      const dz = star.mesh.position.z - runner.z;
      const dx = star.mesh.position.x - runner.worldX;
      const distSq = dx * dx + dz * dz;

      if (runner.magnetTimer > 0 && dz > -1.5 && dz < POWERUP_CONFIG.magnetPullRadius) {
        star.mesh.position.x = THREE.MathUtils.damp(star.mesh.position.x, runner.worldX, 11, simDt);
        star.mesh.position.z = THREE.MathUtils.damp(star.mesh.position.z, runner.z + 0.35, 11, simDt);
        star.mesh.position.y = THREE.MathUtils.damp(star.mesh.position.y, runner.y + 1.25, 11, simDt);
      }

      const directPickup = Math.abs(runner.z - star.z) < 1.15 && runner.lane === star.lane;
      const magnetPickup = runner.magnetTimer > 0 && distSq < 2.25;
      if (directPickup || magnetPickup) {
        star.collected = true;
        star.mesh.visible = false;
        runner.score += runner.feverActive ? 30 : 15;
        runner.starsCollected += 1;
        soundEngine.playStarPickup();
        this.spawnParticles(runner.worldX, 1.4, runner.z, 8, [0xfacc15, 0xfef08a, 0xffffff]);
      }
    }

    // Finish line
    if (!runner.finished && runner.z >= this.activeFinishZ) {
      runner.finished = true;
      runner.finishTime = this.elapsedRaceSec;
      runner.score += 150;
      soundEngine.playVictoryFanfare();
      this.spawnParticles(runner.worldX, 2.5, this.activeFinishZ, 34, [0xfacc15, 0xf43f5e, 0x38bdf8, 0x10b981], true);
      this.emitHudSnapshot();
    }

    // Visual kinematics
    const targetX = getLaneWorldX(runner.slot, runner.lane, runner.trackCenterX);
    const prevX = runner.worldX;
    runner.worldX = THREE.MathUtils.damp(runner.worldX, targetX, 14, simDt);
    const lateralVel = (runner.worldX - prevX) / Math.max(simDt, 0.001);

    runner.squashX = THREE.MathUtils.damp(runner.squashX, 1, 12, simDt);
    runner.squashY = THREE.MathUtils.damp(runner.squashY, 1, 12, simDt);

    runner.stridePhase += runner.speed * simDt * 0.95;
    const strideAmp = runner.finished ? 0.1 : Math.min(0.85, runner.speed * 0.055);
    const swing = Math.sin(runner.stridePhase) * strideAmp;
    const bob = runner.y > 0.05 ? 0 : Math.abs(Math.cos(runner.stridePhase)) * 0.14;

    runner.rig.root.position.set(runner.worldX, 0, runner.z);
    runner.rig.bodyGroup.position.y = runner.y + bob;
    runner.rig.bodyGroup.scale.set(runner.squashX, runner.squashY, runner.squashX);
    runner.rig.bodyGroup.rotation.z = THREE.MathUtils.clamp(lateralVel * 0.025, -0.25, 0.25);
    runner.rig.bodyGroup.rotation.x =
      runner.boostTimer > 0 || runner.feverActive ? 0.22 : runner.stumbleTimer > 0 ? -0.18 : 0.08;

    runner.rig.leftLeg.rotation.x = swing;
    runner.rig.rightLeg.rotation.x = -swing;
    runner.rig.leftArm.rotation.x = -swing * 0.9;
    runner.rig.rightArm.rotation.x = swing * 0.9;

    const shadowScale = Math.max(0.45, 1 - runner.y * 0.18);
    runner.rig.shadowDisc.scale.set(shadowScale, shadowScale, 1);

    // Shield bubble & Magnet ring visuals
    runner.rig.shieldBubble.visible = runner.hasShield;
    if (runner.hasShield) {
      const pulse = 1 + Math.sin(this.titleClock * 5) * 0.05;
      runner.rig.shieldBubble.scale.setScalar(pulse);
      runner.rig.shieldBubble.rotation.y += simDt * 1.6;
    }

    runner.rig.magnetRing.visible = runner.magnetTimer > 0;
    if (runner.magnetTimer > 0) {
      runner.rig.magnetRing.rotation.z -= simDt * 6.5;
      runner.rig.magnetRing.position.y = 1.1 + Math.sin(this.titleClock * 7) * 0.12;
    }

    // Boost / Rainbow Fever Ring & Sparkle Trail
    const ringMat = runner.rig.boostRing.material as THREE.MeshStandardMaterial;
    const showRing = runner.boostTimer > 0 || runner.feverActive;
    ringMat.opacity = THREE.MathUtils.damp(ringMat.opacity, showRing ? 0.88 : 0, 10, simDt);
    runner.rig.boostRing.rotation.z += simDt * (runner.feverActive ? 9 : 6);
    if (runner.feverActive) {
      const hue = (this.titleClock * 0.85) % 1;
      ringMat.color.setHSL(hue, 0.95, 0.55);
      ringMat.emissive.setHSL(hue, 0.95, 0.45);
      runner.feverTrailTimer += simDt;
      if (runner.feverTrailTimer >= 0.09 && !runner.finished) {
        runner.feverTrailTimer = 0;
        this.spawnParticles(runner.worldX, runner.y + 0.55, runner.z - 0.5, 2, [
          0xf43f5e, 0xfacc15, 0x34d399, 0x38bdf8, 0xa855f7,
        ]);
      }
    } else {
      ringMat.color.setHex(0xfacc15);
      ringMat.emissive.setHex(0xf59e0b);
    }

    const flashIntensity = runner.hitFlashTimer > 0 ? 0.65 : 0;
    for (const mat of runner.rig.hitFlashMaterials) {
      mat.emissive.setHex(0xffffff);
      mat.emissiveIntensity = flashIntensity;
    }
  }

  private updateMultiDeviceNeighbors(simDt: number, leaderId: string): void {
    const peers = Array.from(this.remotePeers.values());
    const { left, right } = selectNeighborRivals(this.p1.z, this.localPlayerId, peers);

    this.leftRivalName = left ? left.name : null;
    this.rightRivalName = right ? right.name : null;

    // Left neighbor displayed on p2.rig at +multiTrackOffset
    if (left) {
      this.p2.rig.root.visible = true;
      this.applyRigPalette(this.p2.rig, left.colorIndex, left.name, left.hatStyle || 'sport');
      const targetX = getLaneWorldX(2, left.lane, TRACK_CONFIG.multiTrackOffset);
      this.p2.worldX = THREE.MathUtils.damp(this.p2.worldX, targetX, 12, simDt);
      this.p2.z = THREE.MathUtils.damp(this.p2.z, left.z, 10, simDt);
      this.p2.y = THREE.MathUtils.damp(this.p2.y, left.y, 12, simDt);
      this.p2.stridePhase += left.speed * simDt * 0.95;
      const swing = Math.sin(this.p2.stridePhase) * 0.65;
      this.p2.rig.root.position.set(this.p2.worldX, 0, this.p2.z);
      this.p2.rig.bodyGroup.position.y = this.p2.y + Math.abs(Math.cos(this.p2.stridePhase)) * 0.12;
      this.p2.rig.leftLeg.rotation.x = swing;
      this.p2.rig.rightLeg.rotation.x = -swing;
      this.p2.rig.leftArm.rotation.x = -swing * 0.85;
      this.p2.rig.rightArm.rotation.x = swing * 0.85;
      this.p2.rig.crownGroup.visible = left.playerId === leaderId && left.score > 0;
      this.p2.rig.shieldBubble.visible = Boolean(left.hasShield);
      this.p2.rig.magnetRing.visible = Boolean(left.magnetActive);
    } else {
      this.p2.rig.root.visible = false;
    }

    // Right neighbor displayed on rightRivalRig at -multiTrackOffset
    if (right) {
      this.rightRivalRig.root.visible = true;
      this.applyRigPalette(this.rightRivalRig, right.colorIndex, right.name, right.hatStyle || 'sport');
      const targetX = getLaneWorldX(2, right.lane, -TRACK_CONFIG.multiTrackOffset);
      this.rightRivalX = THREE.MathUtils.damp(this.rightRivalX, targetX, 12, simDt);
      this.rightRivalZ = THREE.MathUtils.damp(this.rightRivalZ, right.z, 10, simDt);
      this.rightRivalY = THREE.MathUtils.damp(this.rightRivalY, right.y, 12, simDt);
      this.rightRivalStride += right.speed * simDt * 0.95;
      const swing = Math.sin(this.rightRivalStride) * 0.65;
      this.rightRivalRig.root.position.set(this.rightRivalX, 0, this.rightRivalZ);
      this.rightRivalRig.bodyGroup.position.y =
        this.rightRivalY + Math.abs(Math.cos(this.rightRivalStride)) * 0.12;
      this.rightRivalRig.leftLeg.rotation.x = swing;
      this.rightRivalRig.rightLeg.rotation.x = -swing;
      this.rightRivalRig.leftArm.rotation.x = -swing * 0.85;
      this.rightRivalRig.rightArm.rotation.x = swing * 0.85;
      this.rightRivalRig.crownGroup.visible = right.playerId === leaderId && right.score > 0;
      this.rightRivalRig.shieldBubble.visible = Boolean(right.hasShield);
      this.rightRivalRig.magnetRing.visible = Boolean(right.magnetActive);
    } else {
      this.rightRivalRig.root.visible = false;
    }
  }

  private getActiveQuestion(): ActiveQuestionView | null {
    const previewDist = PACE_CONFIGS[this.pace].questionPreviewDistance;
    const leadZ = this.mode === 'local2p' ? Math.max(this.p1.z, this.p2.z) : this.p1.z;

    for (const gate of this.gates) {
      const done =
        this.mode === 'local2p' ? gate.p1Triggered && gate.p2Triggered : gate.p1Triggered;
      if (done) continue;
      if (gate.z - leadZ <= previewDist) {
        const q = this.deck[gate.questionIndex];
        if (!q) return null;
        return {
          index: gate.questionIndex,
          total: this.deck.length,
          prompt: q.prompt,
          options: q.options,
          subject: q.subject,
        };
      }
      break;
    }
    return null;
  }

  private toPlayerStats(r: RunnerSim): PlayerStats {
    return {
      id: r.id,
      name: r.name,
      colorIndex: r.colorIndex,
      hatStyle: r.hatStyle,
      score: Math.round(r.score),
      streak: r.streak,
      bestStreak: r.bestStreak,
      correctCount: r.correctCount,
      wrongCount: r.wrongCount,
      obstaclesCleared: r.obstaclesCleared,
      starsCollected: r.starsCollected,
      distance: Math.min(Math.round(r.z), Math.round(this.activeFinishZ)),
      progress: Math.min(1, Math.max(0, r.z / this.activeFinishZ)),
      speed: Math.round(r.speed * 3.6),
      boostActive: r.boostTimer > 0,
      stumbleActive: r.stumbleTimer > 0,
      hasShield: r.hasShield,
      magnetActive: r.magnetTimer > 0,
      feverActive: r.feverActive,
      finished: r.finished,
      finishTime: r.finishTime,
    };
  }

  private peerToPlayerStats(p: RemotePlayerState): PlayerStats {
    return {
      id: p.playerId,
      name: p.name,
      colorIndex: p.colorIndex,
      hatStyle: p.hatStyle || 'sport',
      score: Math.round(p.score),
      streak: p.streak,
      bestStreak: p.bestStreak,
      correctCount: p.correctCount,
      wrongCount: p.wrongCount,
      obstaclesCleared: p.obstaclesCleared,
      starsCollected: p.starsCollected,
      distance: Math.min(Math.round(p.z), Math.round(this.activeFinishZ)),
      progress: Math.min(1, Math.max(0, p.z / this.activeFinishZ)),
      speed: Math.round(p.speed * 3.6),
      boostActive: p.boostActive,
      stumbleActive: p.stumbleActive,
      hasShield: Boolean(p.hasShield),
      magnetActive: Boolean(p.magnetActive),
      feverActive: Boolean(p.feverActive),
      finished: p.finished,
      finishTime: p.finishTime,
    };
  }

  private buildStandings(): PlayerStats[] {
    const p1Stats = this.toPlayerStats(this.p1);
    if (this.mode === 'onlineMulti') {
      const all: PlayerStats[] = [p1Stats];
      for (const peer of this.remotePeers.values()) {
        all.push(this.peerToPlayerStats(peer));
      }
      return rankPlayers(all);
    }
    return rankPlayers([p1Stats, this.toPlayerStats(this.p2)]);
  }

  private emitHudSnapshot(): void {
    const standings = this.buildStandings();
    const p1Stats = this.toPlayerStats(this.p1);
    const p2Stats =
      this.mode === 'onlineMulti'
        ? standings.find((s) => s.id !== this.localPlayerId) || this.toPlayerStats(this.p2)
        : this.toPlayerStats(this.p2);

    this.callbacks.onHudUpdate({
      phase: this.phase,
      countdownValue: Math.ceil(this.countdownTimer),
      timeRemaining: Math.max(0, Math.ceil(this.timeRemaining)),
      p1: p1Stats,
      p2: p2Stats,
      p1Lane: this.p1.lane,
      p2Lane: this.p2.lane,
      standings,
      localPlayerId: this.localPlayerId,
      leftRivalName: this.leftRivalName,
      rightRivalName: this.rightRivalName,
      activeQuestion: this.phase === 'playing' ? this.getActiveQuestion() : null,
      p1Feedback: this.p1Feedback,
      p2Feedback: this.p2Feedback,
      winner: this.winner,
      winnerName: this.winnerName,
      answerHistory: this.answerHistory,
    });
  }

  private finishRace(): void {
    if (this.phase === 'gameover') return;
    this.phase = 'gameover';
    const standings = this.buildStandings();
    if (this.mode === 'onlineMulti') {
      const top = standings[0];
      const second = standings[1];
      if (top && second && top.score === second.score && top.correctCount === second.correctCount) {
        this.winner = 'draw';
        this.winnerName = null;
      } else if (top) {
        this.winner = top.id === this.localPlayerId ? 'p1' : 'p2';
        this.winnerName = top.name;
      }
    } else {
      this.winner = determineRaceWinner(this.toPlayerStats(this.p1), this.toPlayerStats(this.p2));
      this.winnerName =
        this.winner === 'p1' ? this.p1.name : this.winner === 'p2' ? this.p2.name : null;
    }

    document.body.dataset.state = 'gameover';
    soundEngine.stopBgm();
    soundEngine.playVictoryFanfare();

    // Launch immediate celebratory firework salvo around Finish Arch!
    const fireworkColors = [0xfacc15, 0xf43f5e, 0x38bdf8, 0x34d399, 0xa855f7, 0xfb923c];
    this.spawnParticles(0, 6.2, this.activeFinishZ - 2, 42, fireworkColors, true);
    this.spawnParticles(6, 5.4, this.activeFinishZ - 1, 28, fireworkColors, true);
    this.spawnParticles(-6, 5.4, this.activeFinishZ - 1, 28, fireworkColors, true);

    this.emitHudSnapshot();
  }

  private stepAmbientWorld(dt: number): void {
    const wb = this.worldBundle;
    if (wb) {
      for (let i = 0; i < wb.clouds.length; i++) {
        wb.clouds[i].position.x += Math.sin(this.titleClock * 0.25 + i) * dt * 0.35;
      }
      for (let i = 0; i < wb.balloons.length; i++) {
        wb.balloons[i].position.y += Math.sin(this.titleClock * 0.9 + i * 1.4) * dt * 0.55;
        wb.balloons[i].rotation.y += dt * 0.15;
      }
      for (let i = 0; i < wb.windmillBlades.length; i++) {
        wb.windmillBlades[i].rotation.z -= dt * (0.95 + (i % 2) * 0.25);
      }
      for (let i = 0; i < wb.floaters.length; i++) {
        wb.floaters[i].position.y += Math.sin(this.titleClock * 1.1 + i * 1.7) * dt * 0.45;
        wb.floaters[i].rotation.y += dt * 0.22;
      }
      if (wb.snowMesh && wb.snowData.length > 0) {
        const anchorZ = this.camera.position.z + 24;
        for (let i = 0; i < wb.snowData.length; i++) {
          const flake = wb.snowData[i];
          flake.y -= flake.speedY * dt;
          if (flake.y < 0.2) {
            flake.y = 18 + Math.random() * 6;
            flake.z = anchorZ + (Math.random() - 0.5) * 70;
          } else if (Math.abs(flake.z - anchorZ) > 42) {
            flake.z = anchorZ + (Math.random() - 0.5) * 70;
          }
          const driftX = flake.x + Math.sin(this.titleClock * 1.4 + flake.driftPhase) * 1.2;
          _vec3A.set(driftX, flake.y, flake.z);
          _euler.set(this.titleClock + i, this.titleClock * 0.7, 0);
          _quat.setFromEuler(_euler);
          _scaleVec.setScalar(flake.scale);
          _mat4.compose(_vec3A, _quat, _scaleVec);
          wb.snowMesh.setMatrixAt(i, _mat4);
        }
        wb.snowMesh.instanceMatrix.needsUpdate = true;
      }
    }

    for (let i = 0; i < this.stars.length; i++) {
      if (!this.stars[i].collected) {
        this.stars[i].mesh.rotation.y += dt * 2.4;
      }
    }
    for (let i = 0; i < this.powerups.length; i++) {
      const pu = this.powerups[i];
      if (!pu.collected) {
        pu.group.rotation.y += dt * 2.8;
        pu.group.position.y = 1.4 + Math.sin(this.titleClock * 4 + i) * 0.16;
      }
    }
  }

  private tick = (): void => {
    if (this.disposed) return;

    const nowMs = performance.now();
    const rawDt = (nowMs - this.lastTimeMs) / 1000;
    this.lastTimeMs = nowMs;
    const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

    this.titleClock += dt;
    this.stepAmbientWorld(dt);

    if (this.phase === 'title') {
      const isPortrait = this.camera.aspect < 0.85;
      const targetTitleFov = isPortrait ? 68 : 56;
      if (Math.abs(this.camera.fov - targetTitleFov) > 0.1) {
        this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetTitleFov, 8, dt);
        this.camera.updateProjectionMatrix();
      }
      if (isPortrait) {
        const camX = TRACK_CONFIG.p1TrackCenterX + Math.sin(this.titleClock * 0.35) * 1.1;
        const camY = 6.2 + Math.sin(this.titleClock * 0.45) * 0.4;
        const camZ = -11.5 + Math.cos(this.titleClock * 0.25) * 0.9;
        this.camera.position.set(camX, camY, camZ);
        this.camera.lookAt(TRACK_CONFIG.p1TrackCenterX, 2.0, 18);
      } else {
        const camX = 7.4 + Math.sin(this.titleClock * 0.28) * 2.2;
        const camY = 7.4 + Math.sin(this.titleClock * 0.45) * 0.6;
        const camZ = -14.8 + Math.cos(this.titleClock * 0.22) * 1.4;
        this.camera.position.set(camX, camY, camZ);
        this.camera.lookAt(5.6, 2.1, 18);
      }

      [this.p1, this.p2].forEach((r, idx) => {
        const t = this.titleClock * 6.5 + idx * Math.PI;
        r.rig.root.position.set(getLaneWorldX(r.slot, 1), 0, 2);
        r.rig.bodyGroup.position.y = Math.abs(Math.sin(t)) * 0.16;
        r.rig.leftLeg.rotation.x = Math.sin(t) * 0.45;
        r.rig.rightLeg.rotation.x = -Math.sin(t) * 0.45;
        r.rig.leftArm.rotation.x = -Math.sin(t) * 0.45;
        r.rig.rightArm.rotation.x = Math.sin(t) * 0.45;
      });
    } else if (this.phase === 'countdown') {
      this.countdownTimer -= dt;
      const nextInt = Math.ceil(this.countdownTimer);
      if (nextInt !== this.lastCountdownInt && nextInt >= 1) {
        this.lastCountdownInt = nextInt;
        soundEngine.playCountdownTick(false);
        this.emitHudSnapshot();
      }
      if (this.countdownTimer <= 0) {
        this.phase = 'playing';
        soundEngine.playCountdownTick(true);
        soundEngine.startBgm('normal');
        this.emitHudSnapshot();
      }
      [this.p1, this.p2].forEach((r) => {
        r.rig.bodyGroup.position.y = Math.abs(Math.sin(this.titleClock * 9)) * 0.1;
      });
      const cdFraming = computeCameraFraming(
        this.camera.aspect,
        this.mode,
        this.p1.trackCenterX,
        false,
        false,
      );
      this.camPos.x = THREE.MathUtils.damp(this.camPos.x, cdFraming.focusX, 8, dt);
      this.camPos.y = THREE.MathUtils.damp(this.camPos.y, cdFraming.camHeight, 8, dt);
      this.camPos.z = THREE.MathUtils.damp(this.camPos.z, -cdFraming.camBack, 8, dt);
      this.camLook.x = THREE.MathUtils.damp(this.camLook.x, cdFraming.focusX, 8, dt);
      this.camLook.y = THREE.MathUtils.damp(this.camLook.y, cdFraming.camLookY, 8, dt);
      this.camLook.z = THREE.MathUtils.damp(this.camLook.z, cdFraming.camLookZOffset, 8, dt);
      if (Math.abs(this.camera.fov - cdFraming.fov) > 0.05) {
        this.camera.fov = THREE.MathUtils.damp(this.camera.fov, cdFraming.fov, 8, dt);
        this.camera.updateProjectionMatrix();
      }
      this.camera.position.copy(this.camPos);
      this.camera.lookAt(this.camLook);
    } else if (this.phase === 'playing') {
      let simDt = dt;
      if (this.hitstopTimer > 0) {
        this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
        simDt = 0;
      }

      if (simDt > 0) {
        this.elapsedRaceSec += simDt;
        this.timeRemaining = Math.max(0, this.timeRemaining - simDt);

        if (this.mode === 'soloBot') {
          this.updateBotAi(simDt);
        }

        this.updateRunnerSimulation(this.p1, simDt);

        const standings = this.buildStandings();
        const leaderId = standings[0]?.score > 0 ? standings[0].id : '';

        if (this.mode === 'onlineMulti') {
          this.p1.rig.crownGroup.visible = leaderId === this.localPlayerId;
          this.updateMultiDeviceNeighbors(simDt, leaderId);
        } else {
          this.updateRunnerSimulation(this.p2, simDt);
          this.p1.rig.crownGroup.visible = leaderId === 'p1';
          this.p2.rig.crownGroup.visible = leaderId === 'p2';
        }

        // Dynamic BGM tempo (hurry <= 15s, fever when on 3x+ streak, normal otherwise)
        const anyFever =
          this.mode === 'local2p'
            ? this.p1.feverActive || this.p2.feverActive
            : this.p1.feverActive;
        if (this.timeRemaining <= 15) {
          soundEngine.setBgmMood('hurry');
        } else if (anyFever) {
          soundEngine.setBgmMood('fever');
        } else {
          soundEngine.setBgmMood('normal');
        }

        // Gentle crown bob
        [this.p1.rig, this.p2.rig, this.rightRivalRig].forEach((rig) => {
          if (rig.crownGroup.visible) {
            rig.crownGroup.rotation.y += simDt * 2.2;
            rig.crownGroup.position.y = 0.92 + Math.sin(this.titleClock * 5) * 0.06;
          }
        });

        if (this.p1FeedbackTimer > 0) {
          this.p1FeedbackTimer -= simDt;
          if (this.p1FeedbackTimer <= 0) this.p1Feedback = null;
        }
        if (this.p2FeedbackTimer > 0) {
          this.p2FeedbackTimer -= simDt;
          if (this.p2FeedbackTimer <= 0) this.p2Feedback = null;
        }

        // Finish triggers
        if (this.mode === 'onlineMulti') {
          const allFinished =
            this.p1.finished &&
            Array.from(this.remotePeers.values()).every((peer) => peer.finished);
          if (allFinished) {
            this.finishRace();
          } else if (this.p1.finished) {
            this.finishGraceTimer += simDt;
            if (this.finishGraceTimer >= 3.2) {
              this.finishRace();
            }
          } else if (this.timeRemaining <= 0) {
            this.finishRace();
          }
        } else {
          if (this.p1.finished && this.p2.finished) {
            this.finishRace();
          } else if (this.p1.finished || this.p2.finished) {
            this.finishGraceTimer += simDt;
            if (this.finishGraceTimer >= 3.2) {
              this.finishRace();
            }
          } else if (this.timeRemaining <= 0) {
            this.finishRace();
          }
        }
      }

      const anyBoost =
        this.mode === 'local2p'
          ? this.p1.boostTimer > 0 || this.p2.boostTimer > 0
          : this.p1.boostTimer > 0;
      const anyFeverFov =
        this.mode === 'local2p'
          ? this.p1.feverActive || this.p2.feverActive
          : this.p1.feverActive;

      const framing = computeCameraFraming(
        this.camera.aspect,
        this.mode,
        this.p1.trackCenterX,
        anyBoost,
        anyFeverFov,
      );
      const targetZ =
        this.mode === 'local2p' && !framing.isPortrait
          ? (this.p1.z + this.p2.z) * 0.5
          : this.p1.z;

      this.camPos.x = THREE.MathUtils.damp(this.camPos.x, framing.focusX, 6, dt);
      this.camPos.y = THREE.MathUtils.damp(this.camPos.y, framing.camHeight, 6, dt);
      this.camPos.z = THREE.MathUtils.damp(this.camPos.z, targetZ - framing.camBack, 7.5, dt);

      this.camLook.x = THREE.MathUtils.damp(this.camLook.x, framing.focusX, 7, dt);
      this.camLook.y = THREE.MathUtils.damp(this.camLook.y, framing.camLookY, 6, dt);
      this.camLook.z = THREE.MathUtils.damp(
        this.camLook.z,
        targetZ + framing.camLookZOffset,
        8,
        dt,
      );

      if (Math.abs(this.camera.fov - framing.fov) > 0.05) {
        this.camera.fov = THREE.MathUtils.damp(this.camera.fov, framing.fov, 7, dt);
        this.camera.updateProjectionMatrix();
      }

      this.cameraTrauma = Math.max(0, this.cameraTrauma - dt * 1.9);
      const shake = this.cameraTrauma * this.cameraTrauma * 0.45;
      _vec3B.set(
        this.camPos.x + (Math.random() - 0.5) * shake,
        this.camPos.y + (Math.random() - 0.5) * shake,
        this.camPos.z,
      );
      this.camera.position.copy(_vec3B);
      this.camera.lookAt(this.camLook);

      this.hudEmitTimer += dt;
      if (this.hudEmitTimer >= 0.125) {
        this.hudEmitTimer = 0;
        this.emitHudSnapshot();
      }

      if (this.mode === 'onlineMulti' && this.callbacks.onLocalPlayerSync) {
        this.syncEmitTimer += dt;
        if (this.syncEmitTimer >= 0.065) {
          this.syncEmitTimer = 0;
          this.callbacks.onLocalPlayerSync({
            playerId: this.localPlayerId,
            name: this.p1.name,
            colorIndex: this.p1.colorIndex,
            hatStyle: this.p1.hatStyle,
            z: this.p1.z,
            lane: this.p1.lane,
            y: this.p1.y,
            speed: this.p1.speed,
            score: this.p1.score,
            streak: this.p1.streak,
            bestStreak: this.p1.bestStreak,
            correctCount: this.p1.correctCount,
            wrongCount: this.p1.wrongCount,
            obstaclesCleared: this.p1.obstaclesCleared,
            starsCollected: this.p1.starsCollected,
            boostActive: this.p1.boostTimer > 0,
            stumbleActive: this.p1.stumbleTimer > 0,
            hasShield: this.p1.hasShield,
            magnetActive: this.p1.magnetTimer > 0,
            feverActive: this.p1.feverActive,
            finished: this.p1.finished,
            finishTime: this.p1.finishTime,
          });
        }
      }
    } else if (this.phase === 'gameover') {
      // Celebratory orbit around finish arch + periodic 3D fireworks bursts!
      const orbitX = Math.sin(this.titleClock * 0.48) * 10;
      this.camera.position.set(orbitX, 8.2, this.activeFinishZ - 17);
      this.camera.lookAt(0, 3.2, this.activeFinishZ);

      // Winner joyful bounce loop
      const winnerRig = this.winner === 'p2' && this.mode !== 'onlineMulti' ? this.p2.rig : this.p1.rig;
      winnerRig.root.position.z = this.activeFinishZ - 2;
      winnerRig.bodyGroup.position.y = Math.abs(Math.sin(this.titleClock * 7.5)) * 0.95;
      winnerRig.leftArm.rotation.x = -2.6;
      winnerRig.rightArm.rotation.x = -2.6;
      winnerRig.crownGroup.visible = true;

      this.fireworkTimer += dt;
      if (this.fireworkTimer >= 0.48) {
        this.fireworkTimer = 0;
        const fx = (Math.random() - 0.5) * 18;
        const fy = 4.5 + Math.random() * 5.2;
        const fz = this.activeFinishZ - 4 + Math.random() * 6;
        const palettes = [
          [0xfacc15, 0xfb923c, 0xffffff],
          [0xf43f5e, 0xf472b6, 0xfef08a],
          [0x38bdf8, 0x34d399, 0xffffff],
          [0xa855f7, 0xfacc15, 0x38bdf8],
        ];
        const chosen = palettes[Math.floor(Math.random() * palettes.length)];
        this.spawnParticles(fx, fy, fz, 32, chosen, true);
      }
    }

    this.updateParticles(dt);
    this.renderer.render(this.scene, this.camera);
    this.scheduleNextFrame();
  };

  private scheduleNextFrame(): void {
    if (this.disposed) return;
    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  public dispose(): void {
    this.disposed = true;
    soundEngine.stopBgm();
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.resizeObserver.disconnect();
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleWindowBlur);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.renderer.domElement.removeEventListener('touchstart', this.handleTouchStart);
    this.renderer.domElement.removeEventListener('touchend', this.handleTouchEnd);

    if (this.worldBundle) {
      this.scene.remove(this.worldBundle.root);
      disposeWorldBundle(this.worldBundle);
      this.worldBundle = null;
    }

    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose();
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => m?.dispose());
      }
    });

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.mountEl) {
      this.mountEl.removeChild(this.renderer.domElement);
    }
  }
}
