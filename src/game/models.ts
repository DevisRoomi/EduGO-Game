import * as THREE from 'three';
import type { HatStyle, PowerupType, Question, WorldTheme } from './types';
import { TRACK_CONFIG } from './rules';
import { WORLD_CONFIGS } from './worlds';

export interface RunnerRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  headGroup: THREE.Group;
  hatGroups: Record<HatStyle, THREE.Group>;
  currentHat: HatStyle;
  crownGroup: THREE.Group;
  shieldBubble: THREE.Mesh;
  magnetRing: THREE.Mesh;
  namePlate: THREE.Mesh;
  namePlateCanvas: HTMLCanvasElement;
  namePlateTexture: THREE.CanvasTexture;
  currentLabel: string;
  shadowDisc: THREE.Mesh;
  boostRing: THREE.Mesh;
  hitFlashMaterials: THREE.MeshStandardMaterial[];
  jerseyMat: THREE.MeshStandardMaterial;
  capMat: THREE.MeshStandardMaterial;
  backpackMat: THREE.MeshStandardMaterial;
}

export interface GateVisual {
  group: THREE.Group;
  z: number;
  questionIndex: number;
  p1Curtains: THREE.Mesh[];
  p2Curtains: THREE.Mesh[];
  p1Triggered: boolean;
  p2Triggered: boolean;
}

export interface ObstacleVisual {
  group: THREE.Group;
  playerSlot: 1 | 2;
  lane: number;
  z: number;
  type: 'hurdle' | 'cone';
  resolved: boolean;
}

export interface StarVisual {
  mesh: THREE.Mesh;
  playerSlot: 1 | 2;
  lane: number;
  z: number;
  baseX: number;
  collected: boolean;
}

export interface PowerupVisual {
  group: THREE.Group;
  playerSlot: 1 | 2;
  lane: number;
  z: number;
  type: PowerupType;
  collected: boolean;
}

export const RUNNER_PALETTES = [
  { jersey: 0xf43f5e, shorts: 0x1e293b, cap: 0xfb923c, backpack: 0xfacc15, shoe: 0xe11d48, skin: 0xf6c39b },
  { jersey: 0x0ea5e9, shorts: 0x1e293b, cap: 0x10b981, backpack: 0xf472b6, shoe: 0x0284c7, skin: 0xeab68b },
  { jersey: 0x8b5cf6, shorts: 0x1e293b, cap: 0xfacc15, backpack: 0x38bdf8, shoe: 0x6d28d9, skin: 0xf3be96 },
  { jersey: 0x10b981, shorts: 0x1e293b, cap: 0xf43f5e, backpack: 0xfde047, shoe: 0x059669, skin: 0xe5ae83 },
  { jersey: 0xf59e0b, shorts: 0x1e293b, cap: 0x3b82f6, backpack: 0xfb7185, shoe: 0xd97706, skin: 0xf6c39b },
  { jersey: 0xec4899, shorts: 0x1e293b, cap: 0x2dd4bf, backpack: 0xfacc15, shoe: 0xdb2777, skin: 0xeab68b },
  { jersey: 0x14b8a6, shorts: 0x1e293b, cap: 0xf97316, backpack: 0xa78bfa, shoe: 0x0d9488, skin: 0xf3be96 },
  { jersey: 0x6366f1, shorts: 0x1e293b, cap: 0x34d399, backpack: 0xfbbf24, shoe: 0x4f46e5, skin: 0xe5ae83 },
] as const;

let cachedContactShadowTex: THREE.CanvasTexture | null = null;

export function getContactShadowTexture(): THREE.CanvasTexture {
  if (cachedContactShadowTex) return cachedContactShadowTex;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(15, 23, 42, 0.55)');
  grad.addColorStop(0.55, 'rgba(15, 23, 42, 0.25)');
  grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedContactShadowTex = tex;
  return tex;
}

export function createTrackTexture(
  primaryHex: string,
  stripeHex: string,
  maxAniso: number,
  repeatY: number = 68,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = primaryHex;
  ctx.fillRect(0, 0, 512, 512);

  ctx.fillStyle = stripeHex;
  ctx.fillRect(171, 0, 170, 512);

  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  for (let i = 0; i < 420; i++) {
    const x = (i * 97) % 512;
    const y = (i * 53) % 512;
    ctx.fillRect(x, y, 3, 3);
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 14, 512);
  ctx.fillRect(498, 0, 14, 512);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  for (let y = 16; y < 512; y += 64) {
    ctx.fillRect(168, y, 8, 36);
    ctx.fillRect(336, y, 8, 36);
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(226, 280);
  ctx.lineTo(256, 235);
  ctx.lineTo(286, 280);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, repeatY);
  tex.anisotropy = maxAniso;
  return tex;
}

export function createGrassTexture(maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#58C456';
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = '#4FB94E';
  ctx.fillRect(0, 0, 256, 128);

  ctx.fillStyle = '#74D96C';
  for (let i = 0; i < 80; i++) {
    ctx.fillRect((i * 43) % 256, (i * 71) % 256, 4, 4);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(18, 68);
  tex.anisotropy = maxAniso;
  return tex;
}

export function drawRunnerNameplate(
  canvas: HTMLCanvasElement,
  tex: THREE.CanvasTexture,
  label: string,
  accentHex: string,
): void {
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.beginPath();
  ctx.roundRect(8, 8, canvas.width - 16, canvas.height - 16, 22);
  ctx.fill();

  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(8, 8, canvas.width - 16, canvas.height - 16, 22);
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 34px Plus Jakarta Sans, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label.slice(0, 14), canvas.width / 2, canvas.height / 2 + 2, canvas.width - 36);
  tex.needsUpdate = true;
}

export function createRunnerRig(palette: {
  jersey: number;
  shorts: number;
  cap: number;
  backpack: number;
  shoe: number;
  skin: number;
  numberLabel: string;
  nameLabel?: string;
  hatStyle?: HatStyle;
}): RunnerRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const hitFlashMaterials: THREE.MeshStandardMaterial[] = [];

  const jerseyMat = new THREE.MeshStandardMaterial({
    color: palette.jersey,
    roughness: 0.78,
    metalness: 0.04,
    flatShading: true,
  });
  const shortsMat = new THREE.MeshStandardMaterial({
    color: palette.shorts,
    roughness: 0.82,
    metalness: 0.02,
    flatShading: true,
  });
  const capMat = new THREE.MeshStandardMaterial({
    color: palette.cap,
    roughness: 0.52,
    metalness: 0.08,
    flatShading: true,
  });
  const backpackMat = new THREE.MeshStandardMaterial({
    color: palette.backpack,
    roughness: 0.42,
    metalness: 0.14,
    flatShading: true,
  });
  const shoeMat = new THREE.MeshStandardMaterial({
    color: palette.shoe,
    roughness: 0.3,
    metalness: 0.12,
    flatShading: true,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: palette.skin,
    roughness: 0.68,
    metalness: 0.02,
    flatShading: true,
  });
  const whiteTrimMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.35,
    metalness: 0.08,
  });
  const darkEyeMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.15,
    metalness: 0.2,
  });

  hitFlashMaterials.push(jerseyMat, capMat, backpackMat);

  const buildLeg = (side: -1 | 1): THREE.Group => {
    const legPivot = new THREE.Group();
    legPivot.position.set(side * 0.21, 0.76, 0);

    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.34, 6), shortsMat);
    thigh.position.y = -0.17;
    thigh.castShadow = true;
    legPivot.add(thigh);

    const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.3, 6), skinMat);
    calf.position.y = -0.46;
    calf.castShadow = true;
    legPivot.add(calf);

    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.4), shoeMat);
    shoe.position.set(0, -0.67, 0.07);
    shoe.castShadow = true;
    legPivot.add(shoe);

    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.42), whiteTrimMat);
    sole.position.set(0, -0.73, 0.07);
    legPivot.add(sole);

    return legPivot;
  };

  const leftLeg = buildLeg(-1);
  const rightLeg = buildLeg(1);
  bodyGroup.add(leftLeg, rightLeg);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.31, 0.72, 7), jerseyMat);
  torso.position.y = 1.12;
  torso.castShadow = true;
  bodyGroup.add(torso);

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 6, 12), whiteTrimMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 1.46;
  bodyGroup.add(collar);

  const packGroup = new THREE.Group();
  packGroup.position.set(0, 1.16, -0.34);
  const packBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.56, 0.26), backpackMat);
  packBody.castShadow = true;
  packGroup.add(packBody);

  const badgeCanvas = document.createElement('canvas');
  badgeCanvas.width = 128;
  badgeCanvas.height = 128;
  const bCtx = badgeCanvas.getContext('2d')!;
  bCtx.fillStyle = '#FFFFFF';
  bCtx.beginPath();
  bCtx.roundRect(10, 10, 108, 108, 22);
  bCtx.fill();
  bCtx.fillStyle = '#0F172A';
  bCtx.font = 'bold 68px Fredoka, sans-serif';
  bCtx.textAlign = 'center';
  bCtx.textBaseline = 'middle';
  bCtx.fillText(palette.numberLabel, 64, 68);

  const badgeTex = new THREE.CanvasTexture(badgeCanvas);
  badgeTex.colorSpace = THREE.SRGBColorSpace;
  const badgeMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.34, 0.34),
    new THREE.MeshStandardMaterial({ map: badgeTex, roughness: 0.35 }),
  );
  badgeMesh.position.set(0, 0.02, -0.14);
  badgeMesh.rotation.y = Math.PI;
  packGroup.add(badgeMesh);

  const packPocket = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.1), whiteTrimMat);
  packPocket.position.set(0, -0.14, -0.14);
  packGroup.add(packPocket);
  bodyGroup.add(packGroup);

  const buildArm = (side: -1 | 1): THREE.Group => {
    const armPivot = new THREE.Group();
    armPivot.position.set(side * 0.44, 1.38, 0);

    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.24, 6), jerseyMat);
    sleeve.position.y = -0.1;
    sleeve.castShadow = true;
    armPivot.add(sleeve);

    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.34, 6), skinMat);
    forearm.position.y = -0.34;
    forearm.castShadow = true;
    armPivot.add(forearm);

    const hand = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 0), skinMat);
    hand.position.y = -0.52;
    armPivot.add(hand);

    return armPivot;
  };

  const leftArm = buildArm(-1);
  const rightArm = buildArm(1);
  bodyGroup.add(leftArm, rightArm);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.76, 0);

  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.36, 1), skinMat);
  head.castShadow = true;
  headGroup.add(head);

  // 5 Composite 3D Hats (toggleable live on Title Screen & during races!)
  const sportHat = new THREE.Group();
  const capDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.38, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.56),
    capMat,
  );
  capDome.position.y = 0.04;
  capDome.castShadow = true;
  const capBrim = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.07, 0.3), capMat);
  capBrim.position.set(0, 0.08, 0.28);
  capBrim.rotation.x = 0.12;
  const capButton = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), whiteTrimMat);
  capButton.position.y = 0.42;
  sportHat.add(capDome, capBrim, capButton);

  // 2. Astronaut Helmet
  const astronautHat = new THREE.Group();
  const astroShellMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.25,
    metalness: 0.18,
    flatShading: true,
  });
  const astroVisorMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.45,
    roughness: 0.12,
    metalness: 0.65,
  });
  const astroGoldMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.28,
    metalness: 0.55,
  });
  const astroDome = new THREE.Mesh(new THREE.SphereGeometry(0.47, 10, 8), astroShellMat);
  astroDome.position.y = 0.04;
  const astroVisor = new THREE.Mesh(
    new THREE.SphereGeometry(0.41, 10, 8, -Math.PI * 0.42, Math.PI * 0.84, Math.PI * 0.24, Math.PI * 0.44),
    astroVisorMat,
  );
  astroVisor.position.set(0, 0.04, 0.1);
  const astroRim = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.06, 6, 14), astroGoldMat);
  astroRim.rotation.x = Math.PI / 2;
  astroRim.position.y = -0.28;
  const leftPod = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.16, 8), astroGoldMat);
  leftPod.rotation.z = Math.PI / 2;
  leftPod.position.set(-0.47, 0.04, 0);
  const rightPod = leftPod.clone();
  rightPod.position.x = 0.47;
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.36, 6), astroShellMat);
  antenna.position.set(0.3, 0.48, -0.05);
  const antTip = new THREE.Mesh(
    new THREE.SphereGeometry(0.065, 6, 6),
    new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xf43f5e, emissiveIntensity: 0.8 }),
  );
  antTip.position.set(0.3, 0.68, -0.05);
  astronautHat.add(astroDome, astroVisor, astroRim, leftPod, rightPod, antenna, antTip);

  // 3. Cute Bunny Ears Headband
  const bunnyHat = new THREE.Group();
  const bunnyWhiteMat = new THREE.MeshStandardMaterial({ color: 0xfffdfd, roughness: 0.55, flatShading: true });
  const bunnyPinkMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.48, flatShading: true });
  const headband = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.055, 6, 14, Math.PI), bunnyPinkMat);
  headband.position.y = 0.12;
  bunnyHat.add(headband);
  [-1, 1].forEach((side) => {
    const earGroup = new THREE.Group();
    earGroup.position.set(side * 0.18, 0.44, -0.02);
    earGroup.rotation.z = side * -0.16;
    earGroup.rotation.x = -0.08;
    const outerEar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.58, 0.11), bunnyWhiteMat);
    outerEar.position.y = 0.24;
    const innerEar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.42, 0.06), bunnyPinkMat);
    innerEar.position.set(0, 0.22, 0.045);
    earGroup.add(outerEar, innerEar);
    bunnyHat.add(earGroup);
  });

  // 4. Graduation Mortarboard Cap
  const graduationHat = new THREE.Group();
  const gradDarkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.52, flatShading: true });
  const gradGoldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.28, metalness: 0.45 });
  const skullCap = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.37, 0.24, 8), gradDarkMat);
  skullCap.position.y = 0.26;
  const mortarBoard = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.06, 0.76), gradDarkMat);
  mortarBoard.position.y = 0.41;
  mortarBoard.rotation.y = Math.PI / 4;
  const topBtn = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), gradGoldMat);
  topBtn.position.y = 0.45;
  const tasselCord = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.035, 0.035), gradGoldMat);
  tasselCord.position.set(0.18, 0.44, 0.08);
  const tasselDrop = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.055, 0.34, 6), gradGoldMat);
  tasselDrop.position.set(0.34, 0.28, 0.1);
  graduationHat.add(skullCap, mortarBoard, topBtn, tasselCord, tasselDrop);

  // 5. Star Crown
  const starCrownHat = new THREE.Group();
  const royalGoldMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xd97706,
    emissiveIntensity: 0.24,
    roughness: 0.22,
    metalness: 0.6,
    flatShading: true,
  });
  const gemMat = new THREE.MeshStandardMaterial({
    color: 0xec4899,
    emissive: 0xdb2777,
    emissiveIntensity: 0.45,
    roughness: 0.15,
  });
  const tiaraBand = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.34, 0.16, 10), royalGoldMat);
  tiaraBand.position.y = 0.28;
  const starCrest = createStarMesh();
  starCrest.scale.setScalar(0.55);
  starCrest.position.set(0, 0.5, 0.24);
  const gemL = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 0), gemMat);
  gemL.position.set(-0.24, 0.34, 0.24);
  const gemR = gemL.clone();
  gemR.position.x = 0.24;
  starCrownHat.add(tiaraBand, starCrest, gemL, gemR);

  const hatGroups: Record<HatStyle, THREE.Group> = {
    sport: sportHat,
    astronaut: astronautHat,
    bunny: bunnyHat,
    graduation: graduationHat,
    starCrown: starCrownHat,
  };
  const initialHat: HatStyle = palette.hatStyle || 'sport';
  (Object.keys(hatGroups) as HatStyle[]).forEach((key) => {
    hatGroups[key].visible = key === initialHat;
    headGroup.add(hatGroups[key]);
  });

  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.048, 6, 6), darkEyeMat);
  leftEye.position.set(-0.13, 0.02, 0.33);
  const rightEye = leftEye.clone();
  rightEye.position.x = 0.13;
  headGroup.add(leftEye, rightEye);

  // Sculpted 3D Golden Leader Crown (floats cleanly above any hat on whoever is currently #1!)
  const crownGroup = new THREE.Group();
  crownGroup.position.set(0, 0.92, 0);
  const crownMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xd97706,
    emissiveIntensity: 0.32,
    roughness: 0.2,
    metalness: 0.65,
    flatShading: true,
  });
  const crownBand = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.16, 6), crownMat);
  crownGroup.add(crownBand);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 4), crownMat);
    spike.position.set(Math.cos(a) * 0.18, 0.15, Math.sin(a) * 0.18);
    crownGroup.add(spike);
  }
  crownGroup.visible = false;
  headGroup.add(crownGroup);

  bodyGroup.add(headGroup);

  // Translucent Blue Shield Power-Up Aura Bubble
  const shieldBubble = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.18, 1),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.55,
      transparent: true,
      opacity: 0.28,
      roughness: 0.1,
      metalness: 0.2,
      depthWrite: false,
    }),
  );
  shieldBubble.position.set(0, 1.28, 0);
  shieldBubble.visible = false;
  bodyGroup.add(shieldBubble);

  // Rotating Magenta Magnet Power-Up Field Ring
  const magnetRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.95, 0.06, 8, 22),
    new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 0.85,
      transparent: true,
      opacity: 0.88,
      roughness: 0.2,
    }),
  );
  magnetRing.rotation.x = Math.PI / 2;
  magnetRing.position.set(0, 1.15, 0);
  magnetRing.visible = false;
  bodyGroup.add(magnetRing);

  // Floating Nameplate above runner head (faces chase camera at -Z)
  const namePlateCanvas = document.createElement('canvas');
  namePlateCanvas.width = 280;
  namePlateCanvas.height = 76;
  const namePlateTexture = new THREE.CanvasTexture(namePlateCanvas);
  namePlateTexture.colorSpace = THREE.SRGBColorSpace;
  const initialLabel = palette.nameLabel || `P${palette.numberLabel}`;
  drawRunnerNameplate(
    namePlateCanvas,
    namePlateTexture,
    initialLabel,
    `#${palette.jersey.toString(16).padStart(6, '0')}`,
  );
  const namePlate = new THREE.Mesh(
    new THREE.PlaneGeometry(1.75, 0.48),
    new THREE.MeshBasicMaterial({
      map: namePlateTexture,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  namePlate.position.set(0, 2.95, 0);
  namePlate.rotation.y = Math.PI;
  bodyGroup.add(namePlate);

  // Contact shadow disc
  const shadowDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.68, 20),
    new THREE.MeshBasicMaterial({
      map: getContactShadowTexture(),
      transparent: true,
      depthWrite: false,
      opacity: 0.72,
    }),
  );
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.025;
  root.add(shadowDisc);

  // Boost / Fever halo ring
  const boostRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.84, 0.075, 8, 24),
    new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.4,
      transparent: true,
      opacity: 0,
    }),
  );
  boostRing.rotation.x = Math.PI / 2;
  boostRing.position.y = 0.14;
  root.add(boostRing);

  return {
    root,
    bodyGroup,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    headGroup,
    hatGroups,
    currentHat: initialHat,
    crownGroup,
    shieldBubble,
    magnetRing,
    namePlate,
    namePlateCanvas,
    namePlateTexture,
    currentLabel: initialLabel,
    shadowDisc,
    boostRing,
    hitFlashMaterials,
    jerseyMat,
    capMat,
    backpackMat,
  };
}

export function setRunnerHat(rig: RunnerRig, hat: HatStyle): void {
  if (rig.currentHat === hat) return;
  rig.currentHat = hat;
  (Object.keys(rig.hatGroups) as HatStyle[]).forEach((key) => {
    rig.hatGroups[key].visible = key === hat;
  });
}

function createAnswerSignTexture(
  letter: string,
  text: string,
  bgHex: string,
  badgeHex: string,
  maxAniso: number,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#FFFDF7';
  ctx.beginPath();
  ctx.roundRect(8, 8, 496, 240, 28);
  ctx.fill();

  ctx.strokeStyle = bgHex;
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.roundRect(12, 12, 488, 232, 26);
  ctx.stroke();

  ctx.fillStyle = bgHex;
  ctx.beginPath();
  ctx.roundRect(12, 12, 488, 78, [24, 24, 0, 0]);
  ctx.fill();

  ctx.fillStyle = badgeHex;
  ctx.beginPath();
  ctx.arc(64, 52, 28, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 40px Fredoka, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, 64, 54);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 34px Plus Jakarta Sans, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`JAWABAN ${letter}`, 110, 54);

  ctx.fillStyle = '#0F172A';
  const maxWidth = 446;
  let fontSize = text.length > 18 ? 42 : text.length > 11 ? 50 : 60;
  ctx.font = `800 ${fontSize}px Plus Jakarta Sans, sans-serif`;

  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  if (lines.length > 2) {
    fontSize = 36;
    ctx.font = `800 ${fontSize}px Plus Jakarta Sans, sans-serif`;
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const displayLines = lines.slice(0, 2);
  const startY = displayLines.length === 1 ? 166 : 144;
  displayLines.forEach((line, i) => {
    ctx.fillText(line, 256, startY + i * (fontSize + 8), maxWidth);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

const LANE_STYLES = [
  { letter: 'A', hex: '#2563EB', badge: '#DBEAFE', color3d: 0x3b82f6 },
  { letter: 'B', hex: '#D97706', badge: '#FEF3C7', color3d: 0xf59e0b },
  { letter: 'C', hex: '#059669', badge: '#D1FAE5', color3d: 0x10b981 },
] as const;

export function createQuestionGateSet(
  question: Question,
  questionIndex: number,
  z: number,
  maxAniso: number,
  trackCenters: number[],
): GateVisual {
  const group = new THREE.Group();
  group.position.set(0, 0, z);

  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0xfff8eb,
    roughness: 0.45,
    metalness: 0.08,
  });
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    roughness: 0.5,
    metalness: 0.1,
  });
  const beamMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.5,
    metalness: 0.25,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.25,
    metalness: 0.6,
  });

  const signTextures = question.options.map((opt, idx) =>
    createAnswerSignTexture(
      LANE_STYLES[idx].letter,
      opt,
      LANE_STYLES[idx].hex,
      LANE_STYLES[idx].badge,
      maxAniso,
    ),
  );

  const p1Curtains: THREE.Mesh[] = [];
  const p2Curtains: THREE.Mesh[] = [];

  const buildTrackPortal = (centerX: number, curtainsOut?: THREE.Mesh[]): void => {
    const halfSpan = TRACK_CONFIG.laneSpacing * 1.5 + 0.35;

    [-halfSpan, halfSpan].forEach((offsetX) => {
      const colBase = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.55, 0.68), baseMat);
      colBase.position.set(centerX + offsetX, 0.275, 0);
      colBase.castShadow = true;
      group.add(colBase);

      const colShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 4.4, 8), pillarMat);
      colShaft.position.set(centerX + offsetX, 2.75, 0);
      colShaft.castShadow = true;
      group.add(colShaft);

      const finial = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), goldMat);
      finial.position.set(centerX + offsetX, 5.15, 0);
      group.add(finial);
    });

    const topBeam = new THREE.Mesh(
      new THREE.BoxGeometry(halfSpan * 2 + 0.6, 0.42, 0.48),
      beamMat,
    );
    topBeam.position.set(centerX, 4.78, 0);
    topBeam.castShadow = true;
    group.add(topBeam);

    for (let lane = 0; lane < 3; lane++) {
      const laneX = centerX - (lane - 1) * TRACK_CONFIG.laneSpacing;
      const style = LANE_STYLES[lane];

      if (lane > 0) {
        const divX = laneX + TRACK_CONFIG.laneSpacing / 2;
        const divider = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 4.5, 6), pillarMat);
        divider.position.set(divX, 2.25, 0);
        group.add(divider);
      }

      const signBoard = new THREE.Mesh(
        new THREE.BoxGeometry(2.26, 1.22, 0.16),
        [
          beamMat,
          beamMat,
          beamMat,
          beamMat,
          beamMat,
          new THREE.MeshStandardMaterial({
            map: signTextures[lane],
            color: 0xffffff,
            roughness: 0.35,
            metalness: 0.05,
          }),
        ],
      );
      signBoard.position.set(laneX, 3.92, 0);
      group.add(signBoard);

      const curtainMat = new THREE.MeshStandardMaterial({
        color: style.color3d,
        emissive: style.color3d,
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.34,
        roughness: 0.25,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const curtain = new THREE.Mesh(new THREE.PlaneGeometry(2.05, 3.15), curtainMat);
      curtain.position.set(laneX, 1.62, 0);
      curtainsOut?.push(curtain);
      group.add(curtain);
    }
  };

  trackCenters.forEach((cx, idx) => {
    if (idx === 0) buildTrackPortal(cx, p1Curtains);
    else if (idx === 1) buildTrackPortal(cx, p2Curtains);
    else buildTrackPortal(cx);
  });

  // Gate number badge on outer or median post
  const numCanvas = document.createElement('canvas');
  numCanvas.width = 160;
  numCanvas.height = 160;
  const nCtx = numCanvas.getContext('2d')!;
  nCtx.fillStyle = '#FACC15';
  nCtx.beginPath();
  nCtx.arc(80, 80, 72, 0, Math.PI * 2);
  nCtx.fill();
  nCtx.strokeStyle = '#0F172A';
  nCtx.lineWidth = 10;
  nCtx.stroke();
  nCtx.fillStyle = '#0F172A';
  nCtx.font = 'bold 58px Fredoka, sans-serif';
  nCtx.textAlign = 'center';
  nCtx.textBaseline = 'middle';
  nCtx.fillText(`#${questionIndex + 1}`, 80, 84);
  const numTex = new THREE.CanvasTexture(numCanvas);
  numTex.colorSpace = THREE.SRGBColorSpace;

  const badgeX = trackCenters.length === 2 ? 0 : 4.8;
  const medianPost = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 3.4, 8), pillarMat);
  medianPost.position.set(badgeX, 1.7, 0);
  group.add(medianPost);

  const numDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 0.65, 0.16, 16),
    [
      goldMat,
      new THREE.MeshStandardMaterial({ map: numTex, color: 0xffffff, roughness: 0.3 }),
      new THREE.MeshStandardMaterial({ map: numTex, color: 0xffffff, roughness: 0.3 }),
    ],
  );
  numDisc.rotation.x = Math.PI / 2;
  numDisc.position.set(badgeX, 3.6, 0);
  group.add(numDisc);

  return {
    group,
    z,
    questionIndex,
    p1Curtains,
    p2Curtains,
    p1Triggered: false,
    p2Triggered: false,
  };
}

export function createObstacleModel(type: 'hurdle' | 'cone'): THREE.Group {
  const group = new THREE.Group();

  const whiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.38,
    metalness: 0.08,
  });
  const orangeMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    roughness: 0.48,
    metalness: 0.06,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.72,
    metalness: 0.18,
  });

  if (type === 'hurdle') {
    [-0.78, 0.78].forEach((x) => {
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.72), darkMat);
      foot.position.set(x, 0.06, 0);
      foot.castShadow = true;
      group.add(foot);

      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.96, 0.12), whiteMat);
      post.position.set(x, 0.54, 0);
      post.castShadow = true;
      group.add(post);
    });

    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.24, 0.14), orangeMat);
    bar.position.set(0, 0.88, 0);
    bar.castShadow = true;
    group.add(bar);

    [-0.45, 0, 0.45].forEach((sx) => {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.25, 0.15), whiteMat);
      stripe.position.set(sx, 0.88, 0);
      group.add(stripe);
    });
  } else {
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.12, 0.95), darkMat);
    base.position.y = 0.06;
    base.castShadow = true;
    group.add(base);

    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.38, 1.05, 8), orangeMat);
    cone.position.y = 0.62;
    cone.castShadow = true;
    group.add(cone);

    const ring1 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.16, 8), whiteMat);
    ring1.position.y = 0.76;
    group.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.32, 0.14, 8), whiteMat);
    ring2.position.y = 0.42;
    group.add(ring2);
  }

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(type === 'hurdle' ? 0.88 : 0.6, 14),
    new THREE.MeshBasicMaterial({
      map: getContactShadowTexture(),
      transparent: true,
      depthWrite: false,
      opacity: 0.55,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  group.add(shadow);

  return group;
}

let cachedStarGeo: THREE.ExtrudeGeometry | null = null;

export function createStarMesh(): THREE.Mesh {
  if (!cachedStarGeo) {
    const shape = new THREE.Shape();
    const outerR = 0.46;
    const innerR = 0.21;
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    cachedStarGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.14,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.04,
      bevelThickness: 0.04,
    });
    cachedStarGeo.center();
  }

  const mat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xd97706,
    emissiveIntensity: 0.25,
    roughness: 0.2,
    metalness: 0.55,
  });

  const mesh = new THREE.Mesh(cachedStarGeo, mat);
  mesh.castShadow = true;
  return mesh;
}

export function createPowerupModel(type: PowerupType): THREE.Group {
  const group = new THREE.Group();

  const orbitColor = type === 'shield' ? 0x38bdf8 : 0xf43f5e;
  const orbitRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.68, 0.06, 8, 20),
    new THREE.MeshStandardMaterial({
      color: orbitColor,
      emissive: orbitColor,
      emissiveIntensity: 0.7,
      roughness: 0.2,
    }),
  );
  orbitRing.rotation.x = Math.PI * 0.35;
  group.add(orbitRing);

  if (type === 'shield') {
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.45,
      roughness: 0.18,
      metalness: 0.35,
      flatShading: true,
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      roughness: 0.25,
      metalness: 0.55,
    });
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.48, 0), shieldMat);
    core.scale.set(0.95, 1.15, 0.52);
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.36), trimMat);
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.62, 0.36), trimMat);
    group.add(core, crossH, crossV);
  } else {
    const redMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xbe123c,
      emissiveIntensity: 0.38,
      roughness: 0.25,
      metalness: 0.3,
    });
    const silverMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.2,
      metalness: 0.7,
    });
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.11, 8, 16, Math.PI), redMat);
    arc.rotation.z = Math.PI;
    arc.position.y = 0.04;
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.28, 8), redMat);
    legL.position.set(-0.34, 0.18, 0);
    const legR = legL.clone();
    legR.position.x = 0.34;
    const tipL = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.16, 8), silverMat);
    tipL.position.set(-0.34, 0.38, 0);
    const tipR = tipL.clone();
    tipR.position.x = 0.34;
    group.add(arc, legL, legR, tipL, tipR);
  }

  return group;
}

export function createFinishArch(finishZ: number, maxAniso: number, halfWidth: number = 10.6): THREE.Group {
  const group = new THREE.Group();
  group.position.set(0, 0, finishZ);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const cell = 32;
  for (let y = 0; y < 128; y += cell) {
    for (let x = 0; x < 512; x += cell) {
      ctx.fillStyle = (x / cell + y / cell) % 2 === 0 ? '#0F172A' : '#FFFFFF';
      ctx.fillRect(x, y, cell, cell);
    }
  }
  ctx.fillStyle = '#FACC15';
  ctx.beginPath();
  ctx.roundRect(146, 22, 220, 84, 18);
  ctx.fill();
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 52px Fredoka, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('FINISH!', 256, 66);

  const bannerTex = new THREE.CanvasTexture(canvas);
  bannerTex.colorSpace = THREE.SRGBColorSpace;
  bannerTex.anisotropy = maxAniso;

  const towerMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.45, metalness: 0.1 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.25, metalness: 0.6 });

  [-halfWidth, halfWidth].forEach((x) => {
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 1.4), trimMat);
    base.position.set(x, 0.45, 0);
    group.add(base);

    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 6.2, 8), towerMat);
    tower.position.set(x, 3.6, 0);
    tower.castShadow = true;
    group.add(tower);

    const topCrown = new THREE.Mesh(new THREE.OctahedronGeometry(0.6, 0), goldMat);
    topCrown.position.set(x, 7.1, 0);
    group.add(topCrown);
  });

  const banner = new THREE.Mesh(
    new THREE.BoxGeometry(halfWidth * 2 + 0.4, 2.0, 0.4),
    [
      towerMat,
      towerMat,
      towerMat,
      towerMat,
      new THREE.MeshStandardMaterial({ map: bannerTex, color: 0xffffff, roughness: 0.35 }),
      new THREE.MeshStandardMaterial({ map: bannerTex, color: 0xffffff, roughness: 0.35 }),
    ],
  );
  banner.position.set(0, 5.7, 0);
  group.add(banner);

  const strip = new THREE.Mesh(
    new THREE.PlaneGeometry(halfWidth * 2, 2.2),
    new THREE.MeshStandardMaterial({ map: bannerTex, color: 0xffffff, roughness: 0.65 }),
  );
  strip.rotation.x = -Math.PI / 2;
  strip.position.y = 0.045;
  group.add(strip);

  return group;
}

function createWindmill(): { group: THREE.Group; blades: THREE.Group } {
  const group = new THREE.Group();
  const towerMat = new THREE.MeshStandardMaterial({ color: 0xfff8eb, roughness: 0.72, flatShading: true });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5, flatShading: true });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85, flatShading: true });
  const sailMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.65, flatShading: true });

  const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.75, 6.8, 7), towerMat);
  tower.position.y = 3.4;
  group.add(tower);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.5, 2.1, 7), roofMat);
  roof.position.y = 7.8;
  group.add(roof);

  const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.6, 0.25), woodMat);
  door.position.set(0, 0.8, -1.6);
  group.add(door);

  const blades = new THREE.Group();
  blades.position.set(0, 6.4, -1.35);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.5, 8), woodMat);
  hub.rotation.x = Math.PI / 2;
  blades.add(hub);

  for (let i = 0; i < 4; i++) {
    const arm = new THREE.Group();
    arm.rotation.z = (i * Math.PI) / 2;
    const spar = new THREE.Mesh(new THREE.BoxGeometry(0.16, 3.4, 0.12), woodMat);
    spar.position.y = 1.7;
    arm.add(spar);
    const sail = new THREE.Mesh(new THREE.BoxGeometry(0.85, 2.4, 0.06), sailMat);
    sail.position.set(0.42, 2.0, 0.04);
    arm.add(sail);
    blades.add(arm);
  }
  group.add(blades);
  return { group, blades };
}

export function buildTrackRibbons(
  isThreeTrack: boolean,
  trackLength: number,
  maxAniso: number,
  worldTheme: WorldTheme = 'taman',
): THREE.Group {
  const group = new THREE.Group();
  const trackWidth = TRACK_CONFIG.laneSpacing * 3 + 0.5;
  const fullTrackLen = trackLength + 80;
  const repeatY = Math.round(fullTrackLen / 8.5);
  const pal = WORLD_CONFIGS[worldTheme].trackPalette;

  const specs = isThreeTrack
    ? [
        { x: TRACK_CONFIG.multiTrackOffset, primary: pal.leftPrimary, stripe: pal.leftStripe },
        { x: 0, primary: pal.p1Primary, stripe: pal.p1Stripe },
        { x: -TRACK_CONFIG.multiTrackOffset, primary: pal.p2Primary, stripe: pal.p2Stripe },
      ]
    : [
        { x: TRACK_CONFIG.p1TrackCenterX, primary: pal.p1Primary, stripe: pal.p1Stripe },
        { x: TRACK_CONFIG.p2TrackCenterX, primary: pal.p2Primary, stripe: pal.p2Stripe },
      ];

  for (const s of specs) {
    const tex = createTrackTexture(s.primary, s.stripe, maxAniso, repeatY);
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(trackWidth, fullTrackLen),
      new THREE.MeshStandardMaterial({ map: tex, color: 0xffffff, roughness: 0.78, metalness: 0.02 }),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(s.x, 0.025, trackLength / 2 - 12);
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  return group;
}

export function populateParkWorld(
  scene: THREE.Scene,
  maxTrackLength: number,
  maxAniso: number,
): { clouds: THREE.Group[]; balloons: THREE.Group[]; windmillBlades: THREE.Group[] } {
  const grassTex = createGrassTexture(maxAniso);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(400, maxTrackLength + 280),
    new THREE.MeshStandardMaterial({
      map: grassTex,
      color: 0xffffff,
      roughness: 0.92,
      metalness: 0.0,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, maxTrackLength / 2);
  ground.receiveShadow = true;
  scene.add(ground);

  // Rolling low-poly hills along both flanks
  const hillGeo = new THREE.DodecahedronGeometry(1, 0);
  const hillMat = new THREE.MeshStandardMaterial({
    color: 0x43b551,
    roughness: 0.9,
    flatShading: true,
  });
  const hillCount = 46;
  const hills = new THREE.InstancedMesh(hillGeo, hillMat, hillCount);
  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();
  for (let i = 0; i < hillCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const zPos = -20 + (i / hillCount) * (maxTrackLength + 140);
    const xPos = side * (42 + ((i * 19) % 28));
    const sx = 13 + ((i * 7) % 10);
    const sy = 5 + ((i * 5) % 8);
    const sz = 14 + ((i * 11) % 12);
    dummy.position.set(xPos, sy * 0.25 - 1.2, zPos);
    dummy.scale.set(sx, sy, sz);
    dummy.rotation.set(0, (i * 0.7) % Math.PI, 0);
    dummy.updateMatrix();
    hills.setMatrixAt(i, dummy.matrix);
    tint.setHSL(0.32 + ((i % 4) - 1.5) * 0.015, 0.54, 0.42 + (i % 3) * 0.04);
    hills.setColorAt(i, tint);
  }
  hills.instanceMatrix.needsUpdate = true;
  if (hills.instanceColor) hills.instanceColor.needsUpdate = true;
  hills.computeBoundingSphere();
  scene.add(hills);

  // Instanced Low-Poly Pine Trees (outside 3-track boundary >= 18m from center)
  const treeCount = 140;
  const trunkMesh = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.28, 0.42, 2.2, 6),
    new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.88, flatShading: true }),
    treeCount,
  );
  const lowerCanopy = new THREE.InstancedMesh(
    new THREE.ConeGeometry(1.75, 2.7, 7),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.0,
      envMapIntensity: 0.22,
      flatShading: true,
    }),
    treeCount,
  );
  const upperCanopy = new THREE.InstancedMesh(
    new THREE.ConeGeometry(1.25, 2.1, 7),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.88,
      metalness: 0.0,
      envMapIntensity: 0.22,
      flatShading: true,
    }),
    treeCount,
  );

  for (let i = 0; i < treeCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const zPos = -18 + (i / treeCount) * (maxTrackLength + 100);
    const xPos = side * (17.5 + ((i * 31) % 24));
    const s = 0.85 + ((i * 17) % 30) / 100;

    dummy.position.set(xPos, 1.1 * s, zPos);
    dummy.scale.set(s, s, s);
    dummy.rotation.set(0, (i * 1.1) % Math.PI, 0);
    dummy.updateMatrix();
    trunkMesh.setMatrixAt(i, dummy.matrix);

    dummy.position.set(xPos, 2.9 * s, zPos);
    dummy.updateMatrix();
    lowerCanopy.setMatrixAt(i, dummy.matrix);

    dummy.position.set(xPos, 4.45 * s, zPos);
    dummy.updateMatrix();
    upperCanopy.setMatrixAt(i, dummy.matrix);

    tint.setHSL(0.34 + ((i % 5) - 2) * 0.022, 0.68, 0.26 + (i % 3) * 0.035);
    lowerCanopy.setColorAt(i, tint);
    tint.offsetHSL(0.015, 0.04, 0.05);
    upperCanopy.setColorAt(i, tint);
  }
  [trunkMesh, lowerCanopy, upperCanopy].forEach((m) => {
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
    scene.add(m);
  });

  // White park picket fence posts
  const fenceCount = 170;
  const fencePost = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.24, 1.05, 0.24),
    new THREE.MeshStandardMaterial({ color: 0xfffbf2, roughness: 0.6 }),
    fenceCount,
  );
  for (let i = 0; i < fenceCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const zPos = -10 + Math.floor(i / 2) * 8.5;
    dummy.position.set(side * 15.6, 0.525, zPos);
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    fencePost.setMatrixAt(i, dummy.matrix);
  }
  fencePost.instanceMatrix.needsUpdate = true;
  fencePost.computeBoundingSphere();
  scene.add(fencePost);

  // Animated cheerful windmills along the sunlit park hills!
  const windmillBlades: THREE.Group[] = [];
  const windmillPositions: Array<[number, number, number]> = [
    [25, 0, 62],
    [-27, 0, 175],
    [28, 0, 310],
    [-26, 0, 470],
    [25, 0, 600],
  ];
  windmillPositions.forEach(([wx, wy, wz]) => {
    const wm = createWindmill();
    wm.group.position.set(wx, wy, wz);
    wm.group.rotation.y = wx > 0 ? -0.32 : 0.32;
    scene.add(wm.group);
    windmillBlades.push(wm.blades);
  });

  // Drifting low-poly clouds
  const clouds: THREE.Group[] = [];
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.9,
    flatShading: true,
  });
  for (let i = 0; i < 18; i++) {
    const cloud = new THREE.Group();
    const p1 = new THREE.Mesh(new THREE.IcosahedronGeometry(2.6, 0), cloudMat);
    const p2 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.9, 0), cloudMat);
    p2.position.set(2.1, -0.35, 0.2);
    const p3 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.8, 0), cloudMat);
    p3.position.set(-2.0, -0.4, -0.2);
    cloud.add(p1, p2, p3);
    const scale = 1.2 + (i % 3) * 0.45;
    cloud.scale.set(scale * 1.3, scale * 0.72, scale);
    cloud.position.set(
      (i % 2 === 0 ? -1 : 1) * (15 + ((i * 9) % 34)),
      20 + (i % 4) * 4.5,
      18 + i * 42,
    );
    scene.add(cloud);
    clouds.push(cloud);
  }

  // Festive hot air balloons
  const balloons: THREE.Group[] = [];
  const balloonColors = [0xf43f5e, 0xf59e0b, 0x8b5cf6, 0x06b6d4, 0x10b981];
  const balloonCoords: Array<[number, number, number]> = [
    [-24, 16, 78],
    [26, 19, 138],
    [-28, 21, 290],
    [25, 18, 440],
    [-22, 17, 590],
  ];
  balloonCoords.forEach(([bx, by, bz], idx) => {
    const bGroup = new THREE.Group();
    const envMat = new THREE.MeshStandardMaterial({
      color: balloonColors[idx % balloonColors.length],
      roughness: 0.48,
      flatShading: true,
    });
    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0xfffbeb,
      roughness: 0.55,
      flatShading: true,
    });
    const basketMat = new THREE.MeshStandardMaterial({
      color: 0x92400e,
      roughness: 0.85,
      flatShading: true,
    });

    const envelope = new THREE.Mesh(new THREE.SphereGeometry(3.4, 10, 7), envMat);
    envelope.scale.set(1, 1.18, 1);
    bGroup.add(envelope);

    const band = new THREE.Mesh(new THREE.TorusGeometry(3.32, 0.35, 6, 12), stripeMat);
    band.rotation.x = Math.PI / 2;
    bGroup.add(band);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 0.75, 1.2, 8), stripeMat);
    neck.position.y = -3.8;
    bGroup.add(neck);

    const basket = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.0, 1.3), basketMat);
    basket.position.y = -5.4;
    bGroup.add(basket);

    bGroup.position.set(bx, by, bz);
    scene.add(bGroup);
    balloons.push(bGroup);
  });

  return { clouds, balloons, windmillBlades };
}
