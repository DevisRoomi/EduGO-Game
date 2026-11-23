import * as THREE from 'three';
import type { WorldTheme } from './types';

export interface WorldLightingConfig {
  skyHex: number;
  fogHex: number;
  fogNear: number;
  fogFar: number;
  hemiSky: number;
  hemiGround: number;
  hemiIntensity: number;
  sunColor: number;
  sunIntensity: number;
  rimColor: number;
  rimIntensity: number;
  exposure: number;
  trackPalette: {
    p1Primary: string;
    p1Stripe: string;
    p2Primary: string;
    p2Stripe: string;
    leftPrimary: string;
    leftStripe: string;
  };
}

export const WORLD_CONFIGS: Record<WorldTheme, WorldLightingConfig> = {
  taman: {
    skyHex: 0x87cefa,
    fogHex: 0xb6e3ff,
    fogNear: 68,
    fogFar: 250,
    hemiSky: 0xdbeafe,
    hemiGround: 0x4d7c0f,
    hemiIntensity: 0.88,
    sunColor: 0xfff4d6,
    sunIntensity: 1.55,
    rimColor: 0x93c5fd,
    rimIntensity: 0.45,
    exposure: 1.08,
    trackPalette: {
      p1Primary: '#E85D4A',
      p1Stripe: '#DE513E',
      p2Primary: '#2B8AE2',
      p2Stripe: '#227CD1',
      leftPrimary: '#10B981',
      leftStripe: '#0CA678',
    },
  },
  pantai: {
    skyHex: 0x5cd6ff,
    fogHex: 0xa5f3fc,
    fogNear: 74,
    fogFar: 265,
    hemiSky: 0xe0f2fe,
    hemiGround: 0xf59e0b,
    hemiIntensity: 0.95,
    sunColor: 0xfffbeb,
    sunIntensity: 1.65,
    rimColor: 0x38bdf8,
    rimIntensity: 0.5,
    exposure: 1.1,
    trackPalette: {
      p1Primary: '#F97316',
      p1Stripe: '#EA580C',
      p2Primary: '#0284C7',
      p2Stripe: '#0369A1',
      leftPrimary: '#14B8A6',
      leftStripe: '#0D9488',
    },
  },
  salju: {
    skyHex: 0xc7e4fa,
    fogHex: 0xdbeafe,
    fogNear: 64,
    fogFar: 235,
    hemiSky: 0xf0f9ff,
    hemiGround: 0x93c5fd,
    hemiIntensity: 1.05,
    sunColor: 0xfff7ed,
    sunIntensity: 1.45,
    rimColor: 0x60a5fa,
    rimIntensity: 0.52,
    exposure: 1.04,
    trackPalette: {
      p1Primary: '#E11D48',
      p1Stripe: '#BE123C',
      p2Primary: '#2563EB',
      p2Stripe: '#1D4ED8',
      leftPrimary: '#0D9488',
      leftStripe: '#0F766E',
    },
  },
  angkasa: {
    skyHex: 0x16123b,
    fogHex: 0x1e1b4b,
    fogNear: 78,
    fogFar: 270,
    hemiSky: 0xc4b5fd,
    hemiGround: 0x312e81,
    hemiIntensity: 1.15,
    sunColor: 0xfef3c7,
    sunIntensity: 1.55,
    rimColor: 0x38bdf8,
    rimIntensity: 0.72,
    exposure: 1.12,
    trackPalette: {
      p1Primary: '#EC4899',
      p1Stripe: '#DB2777',
      p2Primary: '#06B6D4',
      p2Stripe: '#0891B2',
      leftPrimary: '#8B5CF6',
      leftStripe: '#7C3AED',
    },
  },
};

export interface SnowParticleData {
  x: number;
  y: number;
  z: number;
  speedY: number;
  driftPhase: number;
  scale: number;
}

export interface WorldBundle {
  theme: WorldTheme;
  config: WorldLightingConfig;
  root: THREE.Group;
  clouds: THREE.Group[];
  balloons: THREE.Group[];
  windmillBlades: THREE.Group[];
  floaters: THREE.Object3D[];
  rings: THREE.Object3D[];
  snowMesh: THREE.InstancedMesh | null;
  snowData: SnowParticleData[];
}

function createTiledGroundTexture(
  baseHex: string,
  bandHex: string,
  speckHex: string,
  maxAniso: number,
  repeatX: number = 18,
  repeatY: number = 68,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = bandHex;
  ctx.fillRect(0, 0, 256, 128);

  ctx.fillStyle = speckHex;
  for (let i = 0; i < 84; i++) {
    ctx.fillRect((i * 43) % 256, (i * 71) % 256, 4, 4);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAniso;
  return tex;
}

function createSpaceDeckTexture(maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1E1B4B';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = 'rgba(99, 102, 241, 0.35)';
  ctx.lineWidth = 3;
  for (let i = 0; i <= 256; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(256, i);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(56, 189, 248, 0.38)';
  for (let i = 0; i < 16; i++) {
    ctx.fillRect(((i * 64) % 256) - 2, ((Math.floor(i / 4) * 64) % 256) - 2, 5, 5);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(20, 72);
  tex.anisotropy = maxAniso;
  return tex;
}

function createClouds(root: THREE.Group, tintHex: number, count: number): THREE.Group[] {
  const clouds: THREE.Group[] = [];
  const cloudMat = new THREE.MeshStandardMaterial({
    color: tintHex,
    roughness: 0.9,
    flatShading: true,
  });
  const p1Geo = new THREE.IcosahedronGeometry(2.6, 0);
  const p2Geo = new THREE.IcosahedronGeometry(1.9, 0);
  const p3Geo = new THREE.IcosahedronGeometry(1.8, 0);

  for (let i = 0; i < count; i++) {
    const cloud = new THREE.Group();
    const p1 = new THREE.Mesh(p1Geo, cloudMat);
    const p2 = new THREE.Mesh(p2Geo, cloudMat);
    p2.position.set(2.1, -0.35, 0.2);
    const p3 = new THREE.Mesh(p3Geo, cloudMat);
    p3.position.set(-2.0, -0.4, -0.2);
    cloud.add(p1, p2, p3);
    const scale = 1.15 + (i % 3) * 0.45;
    cloud.scale.set(scale * 1.3, scale * 0.72, scale);
    cloud.position.set(
      (i % 2 === 0 ? -1 : 1) * (15 + ((i * 9) % 34)),
      20 + (i % 4) * 4.5,
      18 + i * 42,
    );
    root.add(cloud);
    clouds.push(cloud);
  }
  return clouds;
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

function buildTamanWorld(root: THREE.Group, maxTrackLength: number, maxAniso: number): WorldBundle {
  const grassTex = createTiledGroundTexture('#58C456', '#4FB94E', '#74D96C', maxAniso);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(400, maxTrackLength + 280),
    new THREE.MeshStandardMaterial({ map: grassTex, color: 0xffffff, roughness: 0.92, metalness: 0 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, maxTrackLength / 2);
  ground.receiveShadow = true;
  root.add(ground);

  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();

  // Rolling hills
  const hillCount = 46;
  const hills = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(1, 0),
    new THREE.MeshStandardMaterial({ color: 0x43b551, roughness: 0.9, flatShading: true }),
    hillCount,
  );
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
  root.add(hills);

  // Pine trees
  const treeCount = 136;
  const trunkMesh = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.28, 0.42, 2.2, 6),
    new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.88, flatShading: true }),
    treeCount,
  );
  const lowerCanopy = new THREE.InstancedMesh(
    new THREE.ConeGeometry(1.75, 2.7, 7),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, envMapIntensity: 0.22, flatShading: true }),
    treeCount,
  );
  const upperCanopy = new THREE.InstancedMesh(
    new THREE.ConeGeometry(1.25, 2.1, 7),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88, envMapIntensity: 0.22, flatShading: true }),
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
    root.add(m);
  });

  // White fence posts
  const fenceCount = 160;
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
  root.add(fencePost);

  // Windmills
  const windmillBlades: THREE.Group[] = [];
  const windmillCoords: Array<[number, number, number]> = [
    [25, 0, 62],
    [-27, 0, 175],
    [28, 0, 310],
    [-26, 0, 470],
    [25, 0, 600],
  ];
  windmillCoords.forEach(([wx, wy, wz]) => {
    const wm = createWindmill();
    wm.group.position.set(wx, wy, wz);
    wm.group.rotation.y = wx > 0 ? -0.32 : 0.32;
    root.add(wm.group);
    windmillBlades.push(wm.blades);
  });

  // Balloons
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
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xfffbeb, roughness: 0.55, flatShading: true });
    const basketMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85, flatShading: true });

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
    root.add(bGroup);
    balloons.push(bGroup);
  });

  const clouds = createClouds(root, 0xffffff, 16);

  return {
    theme: 'taman',
    config: WORLD_CONFIGS.taman,
    root,
    clouds,
    balloons,
    windmillBlades,
    floaters: [],
    rings: [],
    snowMesh: null,
    snowData: [],
  };
}

function buildPantaiWorld(root: THREE.Group, maxTrackLength: number, maxAniso: number): WorldBundle {
  // Sparkling turquoise sea base
  const waterTex = createTiledGroundTexture('#0EA5E9', '#0284C7', '#BAE6FD', maxAniso, 22, 74);
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(460, maxTrackLength + 300),
    new THREE.MeshStandardMaterial({
      map: waterTex,
      color: 0xffffff,
      roughness: 0.25,
      metalness: 0.12,
    }),
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(0, -0.25, maxTrackLength / 2);
  root.add(sea);

  // Golden tropical beach causeway sandbar under tracks & shoreline
  const sandTex = createTiledGroundTexture('#FDE68A', '#FCD34D', '#FEF3C7', maxAniso, 6, 68);
  const sandBar = new THREE.Mesh(
    new THREE.BoxGeometry(46, 0.5, maxTrackLength + 240),
    new THREE.MeshStandardMaterial({
      map: sandTex,
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0,
    }),
  );
  sandBar.position.set(0, -0.25, maxTrackLength / 2);
  sandBar.receiveShadow = true;
  root.add(sandBar);

  // Foam shoreline strips on both sides of sandbar
  const foamMat = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, roughness: 0.65 });
  [-23.5, 23.5].forEach((fx) => {
    const foam = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.14, maxTrackLength + 240), foamMat);
    foam.position.set(fx, -0.1, maxTrackLength / 2);
    root.add(foam);
  });

  const dummy = new THREE.Object3D();

  // Instanced Tropical Palm Trees along beach sides
  const palmCount = 92;
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85, flatShading: true });
  const frondMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.72, flatShading: true });
  const coconutMat = new THREE.MeshStandardMaterial({ color: 0x713f12, roughness: 0.8, flatShading: true });

  const palmTrunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.24, 0.44, 5.4, 6), trunkMat, palmCount);
  const palmCrowns = new THREE.InstancedMesh(new THREE.ConeGeometry(2.6, 1.35, 6), frondMat, palmCount);
  const palmTops = new THREE.InstancedMesh(new THREE.ConeGeometry(1.85, 1.05, 6), frondMat, palmCount);
  const palmCoconuts = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.45, 0), coconutMat, palmCount);

  for (let i = 0; i < palmCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const zPos = -14 + (i / palmCount) * (maxTrackLength + 100);
    const xPos = side * (16.8 + ((i * 7) % 5.5));
    const s = 0.85 + ((i * 13) % 30) / 100;
    const lean = side * -0.14;

    dummy.position.set(xPos, 2.5 * s, zPos);
    dummy.scale.set(s, s, s);
    dummy.rotation.set(0, (i * 0.9) % Math.PI, lean);
    dummy.updateMatrix();
    palmTrunks.setMatrixAt(i, dummy.matrix);

    const topX = xPos - Math.sin(lean) * 2.5 * s;
    const topY = 5.1 * s;
    dummy.position.set(topX, topY, zPos);
    dummy.rotation.set(0, (i * 1.3) % Math.PI, 0);
    dummy.updateMatrix();
    palmCrowns.setMatrixAt(i, dummy.matrix);

    dummy.position.set(topX, topY + 0.8 * s, zPos);
    dummy.rotation.set(0, (i * 1.3 + 0.5) % Math.PI, 0);
    dummy.updateMatrix();
    palmTops.setMatrixAt(i, dummy.matrix);

    dummy.position.set(topX, topY - 0.55 * s, zPos);
    dummy.updateMatrix();
    palmCoconuts.setMatrixAt(i, dummy.matrix);
  }
  [palmTrunks, palmCrowns, palmTops, palmCoconuts].forEach((m) => {
    m.instanceMatrix.needsUpdate = true;
    root.add(m);
  });

  // Colorful Beach Umbrellas
  const umbrellaCount = 34;
  const poleMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45 });
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, flatShading: true });
  const umbrellaPoles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.08, 0.08, 2.6, 6), poleMat, umbrellaCount);
  const umbrellaCanopies = new THREE.InstancedMesh(new THREE.ConeGeometry(1.75, 0.85, 8), canopyMat, umbrellaCount);
  const umbrellaPalette = [0xf43f5e, 0xfacc15, 0x38bdf8, 0xa855f7, 0x10b981];
  const color = new THREE.Color();

  for (let i = 0; i < umbrellaCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const zPos = 8 + i * 21;
    const xPos = side * (16.4 + (i % 3) * 1.6);
    dummy.position.set(xPos, 1.3, zPos);
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, 0, side * 0.12);
    dummy.updateMatrix();
    umbrellaPoles.setMatrixAt(i, dummy.matrix);

    dummy.position.set(xPos - side * 0.14, 2.65, zPos);
    dummy.updateMatrix();
    umbrellaCanopies.setMatrixAt(i, dummy.matrix);

    color.setHex(umbrellaPalette[i % umbrellaPalette.length]);
    umbrellaCanopies.setColorAt(i, color);
  }
  umbrellaPoles.instanceMatrix.needsUpdate = true;
  umbrellaCanopies.instanceMatrix.needsUpdate = true;
  if (umbrellaCanopies.instanceColor) umbrellaCanopies.instanceColor.needsUpdate = true;
  root.add(umbrellaPoles, umbrellaCanopies);

  // Coastal Lighthouses & Bobbing Sailboats out in the turquoise ocean!
  const floaters: THREE.Object3D[] = [];
  const lighthouseRed = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5, flatShading: true });
  const lighthouseWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45, flatShading: true });
  const lanternGold = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.7,
    roughness: 0.2,
  });

  [
    [32, 0, 90],
    [-34, 0, 265],
    [33, 0, 460],
  ].forEach(([lx, ly, lz]) => {
    const lh = new THREE.Group();
    const island = new THREE.Mesh(
      new THREE.CylinderGeometry(4.2, 5.6, 1.4, 8),
      new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.9, flatShading: true }),
    );
    island.position.y = 0.2;
    lh.add(island);

    const b1 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.9, 3.0, 8), lighthouseRed);
    b1.position.y = 2.2;
    const b2 = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.5, 2.8, 8), lighthouseWhite);
    b2.position.y = 5.1;
    const b3 = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.25, 2.4, 8), lighthouseRed);
    b3.position.y = 7.7;
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 1.3, 8), lanternGold);
    lamp.position.y = 9.5;
    const cap = new THREE.Mesh(new THREE.ConeGeometry(1.35, 1.5, 8), lighthouseRed);
    cap.position.y = 10.9;
    lh.add(b1, b2, b3, lamp, cap);
    lh.position.set(lx, ly, lz);
    root.add(lh);
  });

  // Sailboats floating on sea
  const hullMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.5, flatShading: true });
  const sailMat = new THREE.MeshStandardMaterial({ color: 0xfffbeb, roughness: 0.55, flatShading: true });
  const mastMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 });

  [
    [-33, 0.2, 52],
    [35, 0.2, 165],
    [-37, 0.2, 345],
    [34, 0.2, 520],
  ].forEach(([sx, sy, sz], idx) => {
    const boat = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 5.2), hullMat);
    hull.position.y = 0.2;
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4.6, 6), mastMat);
    mast.position.y = 2.6;
    const sail = new THREE.Mesh(new THREE.ConeGeometry(1.8, 3.8, 3), sailMat);
    sail.position.set(0, 2.8, 0.3);
    boat.add(hull, mast, sail);
    boat.position.set(sx, sy, sz);
    boat.rotation.y = idx % 2 === 0 ? 0.35 : -0.35;
    root.add(boat);
    floaters.push(boat);
  });

  const clouds = createClouds(root, 0xffffff, 16);

  return {
    theme: 'pantai',
    config: WORLD_CONFIGS.pantai,
    root,
    clouds,
    balloons: [],
    windmillBlades: [],
    floaters,
    rings: [],
    snowMesh: null,
    snowData: [],
  };
}

function buildSaljuWorld(root: THREE.Group, maxTrackLength: number, maxAniso: number): WorldBundle {
  const snowTex = createTiledGroundTexture('#F1F5F9', '#E2E8F0', '#FFFFFF', maxAniso);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(420, maxTrackLength + 280),
    new THREE.MeshStandardMaterial({ map: snowTex, color: 0xffffff, roughness: 0.82, metalness: 0.04 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, maxTrackLength / 2);
  ground.receiveShadow = true;
  root.add(ground);

  const dummy = new THREE.Object3D();

  // Snow-capped Alpine Peaks flanking the valley
  const peakCount = 44;
  const peakMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.85, flatShading: true });
  const peakSnowMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.72, flatShading: true });
  const peakBases = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 6), peakMat, peakCount);
  const peakCaps = new THREE.InstancedMesh(new THREE.ConeGeometry(0.45, 0.42, 6), peakSnowMat, peakCount);

  for (let i = 0; i < peakCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const zPos = -20 + (i / peakCount) * (maxTrackLength + 160);
    const xPos = side * (46 + ((i * 19) % 26));
    const r = 12 + ((i * 7) % 10);
    const h = 18 + ((i * 11) % 18);

    dummy.position.set(xPos, h * 0.5 - 1, zPos);
    dummy.scale.set(r, h, r);
    dummy.rotation.set(0, (i * 0.7) % Math.PI, 0);
    dummy.updateMatrix();
    peakBases.setMatrixAt(i, dummy.matrix);

    dummy.position.set(xPos, h * 0.79 - 1, zPos);
    dummy.scale.set(r * 1.02, h * 1.02, r * 1.02);
    dummy.updateMatrix();
    peakCaps.setMatrixAt(i, dummy.matrix);
  }
  peakBases.instanceMatrix.needsUpdate = true;
  peakCaps.instanceMatrix.needsUpdate = true;
  root.add(peakBases, peakCaps);

  // Frosted Pine Trees
  const treeCount = 132;
  const trunks = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.28, 0.42, 2.2, 6),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.88, flatShading: true }),
    treeCount,
  );
  const lower = new THREE.InstancedMesh(
    new THREE.ConeGeometry(1.8, 2.7, 7),
    new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.82, flatShading: true }),
    treeCount,
  );
  const snowCap = new THREE.InstancedMesh(
    new THREE.ConeGeometry(1.38, 2.1, 7),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.65, flatShading: true }),
    treeCount,
  );

  for (let i = 0; i < treeCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const zPos = -18 + (i / treeCount) * (maxTrackLength + 100);
    const xPos = side * (17.5 + ((i * 29) % 24));
    const s = 0.85 + ((i * 17) % 30) / 100;

    dummy.position.set(xPos, 1.1 * s, zPos);
    dummy.scale.set(s, s, s);
    dummy.rotation.set(0, (i * 1.1) % Math.PI, 0);
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);

    dummy.position.set(xPos, 2.9 * s, zPos);
    dummy.updateMatrix();
    lower.setMatrixAt(i, dummy.matrix);

    dummy.position.set(xPos, 4.45 * s, zPos);
    dummy.updateMatrix();
    snowCap.setMatrixAt(i, dummy.matrix);
  }
  [trunks, lower, snowCap].forEach((m) => {
    m.instanceMatrix.needsUpdate = true;
    root.add(m);
  });

  // Cheerful Snowmen along track flanks!
  const whiteSnowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.65, flatShading: true });
  const carrotMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5, flatShading: true });
  const scarfMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.65, flatShading: true });
  const hatMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7, flatShading: true });

  [
    [16.5, 0, 26],
    [-16.5, 0, 74],
    [17, 0, 148],
    [-17, 0, 232],
    [16.8, 0, 340],
    [-16.8, 0, 455],
    [16.8, 0, 565],
  ].forEach(([sx, sy, sz]) => {
    const sm = new THREE.Group();
    const bot = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15, 1), whiteSnowMat);
    bot.position.y = 1.05;
    const mid = new THREE.Mesh(new THREE.IcosahedronGeometry(0.82, 1), whiteSnowMat);
    mid.position.y = 2.45;
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.16, 6, 12), scarfMat);
    scarf.rotation.x = Math.PI / 2;
    scarf.position.y = 3.05;
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.58, 1), whiteSnowMat);
    head.position.y = 3.5;
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.55, 6), carrotMat);
    nose.rotation.x = -Math.PI / 2;
    nose.position.set(0, 3.5, -0.68);
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.45, 0.68, 8), hatMat);
    hat.position.y = 4.25;
    sm.add(bot, mid, scarf, head, nose, hat);
    sm.position.set(sx, sy, sz);
    sm.rotation.y = sx > 0 ? -0.35 : 0.35;
    root.add(sm);
  });

  // Cozy Wooden Alpine Cabins with glowing warm windows
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85, flatShading: true });
  const roofSnowMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.65, flatShading: true });
  const warmWinMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.75,
    roughness: 0.25,
  });

  [
    [-25, 0, 115],
    [26, 0, 275],
    [-25, 0, 425],
  ].forEach(([cx, cy, cz]) => {
    const cabin = new THREE.Group();
    const walls = new THREE.Mesh(new THREE.BoxGeometry(5.6, 3.6, 5.2), woodMat);
    walls.position.y = 1.8;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(4.8, 2.8, 4), roofSnowMat);
    roof.position.y = 5.0;
    roof.rotation.y = Math.PI / 4;
    const win = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 0.2), warmWinMat);
    win.position.set(0, 2.0, -2.62);
    cabin.add(walls, roof, win);
    cabin.position.set(cx, cy, cz);
    cabin.rotation.y = cx > 0 ? -0.3 : 0.3;
    root.add(cabin);
  });

  // Instanced Falling Snowflakes (lightweight 140 flakes that follow the camera Z!)
  const snowCount = 140;
  const snowMesh = new THREE.InstancedMesh(
    new THREE.OctahedronGeometry(0.14, 0),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
    snowCount,
  );
  snowMesh.frustumCulled = false;
  const snowData: SnowParticleData[] = [];
  for (let i = 0; i < snowCount; i++) {
    const item: SnowParticleData = {
      x: (Math.random() - 0.5) * 46,
      y: 1 + Math.random() * 20,
      z: (Math.random() - 0.3) * 75,
      speedY: 2.2 + Math.random() * 2.6,
      driftPhase: Math.random() * Math.PI * 2,
      scale: 0.7 + Math.random() * 0.9,
    };
    snowData.push(item);
    dummy.position.set(item.x, item.y, item.z);
    dummy.scale.setScalar(item.scale);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    snowMesh.setMatrixAt(i, dummy.matrix);
  }
  snowMesh.instanceMatrix.needsUpdate = true;
  root.add(snowMesh);

  const clouds = createClouds(root, 0xf8fafc, 14);

  return {
    theme: 'salju',
    config: WORLD_CONFIGS.salju,
    root,
    clouds,
    balloons: [],
    windmillBlades: [],
    floaters: [],
    rings: [],
    snowMesh,
    snowData,
  };
}

function buildAngkasaWorld(root: THREE.Group, maxTrackLength: number, maxAniso: number): WorldBundle {
  // Glowing cyber-space deck floor
  const spaceTex = createSpaceDeckTexture(maxAniso);
  const deck = new THREE.Mesh(
    new THREE.PlaneGeometry(420, maxTrackLength + 280),
    new THREE.MeshStandardMaterial({
      map: spaceTex,
      color: 0xffffff,
      roughness: 0.6,
      metalness: 0.25,
    }),
  );
  deck.rotation.x = -Math.PI / 2;
  deck.position.set(0, -0.02, maxTrackLength / 2);
  deck.receiveShadow = true;
  root.add(deck);

  const dummy = new THREE.Object3D();

  // Instanced Starfield twinkling overhead
  const starCount = 240;
  const starField = new THREE.InstancedMesh(
    new THREE.OctahedronGeometry(0.32, 0),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
    starCount,
  );
  const starPalette = [0xffffff, 0xfef08a, 0x7dd3fc, 0xf0abfc];
  const color = new THREE.Color();
  for (let i = 0; i < starCount; i++) {
    const sideX = (Math.random() - 0.5) * 190;
    const heightY = 16 + Math.random() * 58;
    const zPos = -30 + Math.random() * (maxTrackLength + 180);
    const s = 0.5 + Math.random() * 1.4;
    dummy.position.set(sideX, heightY, zPos);
    dummy.scale.setScalar(s);
    dummy.rotation.set(i, i * 0.6, 0);
    dummy.updateMatrix();
    starField.setMatrixAt(i, dummy.matrix);
    color.setHex(starPalette[i % starPalette.length]);
    starField.setColorAt(i, color);
  }
  starField.instanceMatrix.needsUpdate = true;
  if (starField.instanceColor) starField.instanceColor.needsUpdate = true;
  root.add(starField);

  // Luminous Crystal Spires along the flanks
  const crystalCount = 96;
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x4f46e5,
    emissiveIntensity: 0.35,
    roughness: 0.25,
    metalness: 0.35,
    flatShading: true,
  });
  const crystals = new THREE.InstancedMesh(new THREE.OctahedronGeometry(1.2, 0), crystalMat, crystalCount);
  const crystalColors = [0x38bdf8, 0xa855f7, 0xec4899, 0x2dd4bf];
  for (let i = 0; i < crystalCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const zPos = -14 + (i / crystalCount) * (maxTrackLength + 110);
    const xPos = side * (17.5 + ((i * 23) % 24));
    const sy = 1.6 + ((i * 11) % 24) / 10;
    const sx = 0.7 + ((i * 7) % 10) / 12;
    dummy.position.set(xPos, sy * 1.0, zPos);
    dummy.scale.set(sx, sy, sx);
    dummy.rotation.set(0, (i * 0.8) % Math.PI, side * -0.14);
    dummy.updateMatrix();
    crystals.setMatrixAt(i, dummy.matrix);
    color.setHex(crystalColors[i % crystalColors.length]);
    crystals.setColorAt(i, color);
  }
  crystals.instanceMatrix.needsUpdate = true;
  if (crystals.instanceColor) crystals.instanceColor.needsUpdate = true;
  root.add(crystals);

  // Glowing Neon Energy Arches spanning high above the track!
  const rings: THREE.Object3D[] = [];
  const archColors = [0x38bdf8, 0xe879f9, 0xfacc15, 0x34d399];
  for (let i = 0; i < 11; i++) {
    const c = archColors[i % archColors.length];
    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(18.5, 0.36, 8, 28, Math.PI),
      new THREE.MeshStandardMaterial({
        color: c,
        emissive: c,
        emissiveIntensity: 0.85,
        roughness: 0.2,
      }),
    );
    arch.position.set(0, 0.2, 26 + i * 62);
    root.add(arch);
    rings.push(arch);
  }

  // Ringed Planets & Floating Rockets in the cosmic sky!
  const floaters: THREE.Object3D[] = [];
  const planetSpecs: Array<{ pos: [number, number, number]; r: number; body: number; ring: number }> = [
    { pos: [-32, 20, 75], r: 5.2, body: 0xf43f5e, ring: 0xfde047 },
    { pos: [36, 24, 185], r: 6.4, body: 0x38bdf8, ring: 0xc084fc },
    { pos: [-35, 22, 340], r: 5.8, body: 0x34d399, ring: 0xfb923c },
    { pos: [34, 21, 510], r: 6.0, body: 0xa855f7, ring: 0x38bdf8 },
  ];
  planetSpecs.forEach((spec) => {
    const pGroup = new THREE.Group();
    const sphere = new THREE.Mesh(
      new THREE.IcosahedronGeometry(spec.r, 1),
      new THREE.MeshStandardMaterial({
        color: spec.body,
        emissive: spec.body,
        emissiveIntensity: 0.16,
        roughness: 0.45,
        flatShading: true,
      }),
    );
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(spec.r * 1.55, spec.r * 0.16, 6, 22),
      new THREE.MeshStandardMaterial({
        color: spec.ring,
        emissive: spec.ring,
        emissiveIntensity: 0.35,
        roughness: 0.35,
        flatShading: true,
      }),
    );
    ring.rotation.x = Math.PI * 0.42;
    ring.rotation.y = 0.25;
    pGroup.add(sphere, ring);
    pGroup.position.set(...spec.pos);
    root.add(pGroup);
    floaters.push(pGroup);
  });

  // Low-poly Rockets hovering along the flanks
  const rocketWhite = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35, flatShading: true });
  const rocketRed = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.4, flatShading: true });
  const rocketGlass = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.55,
    roughness: 0.15,
  });
  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xf97316,
    emissiveIntensity: 0.9,
    roughness: 0.2,
  });

  [
    [24, 9, 120],
    [-25, 11, 255],
    [25, 10, 415],
  ].forEach(([rx, ry, rz]) => {
    const rocket = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 4.6, 8), rocketWhite);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.2, 8), rocketRed);
    nose.position.y = 3.4;
    const win = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 6), rocketGlass);
    win.position.set(0, 0.8, -1.0);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.85, 2.0, 6), flameMat);
    flame.rotation.x = Math.PI;
    flame.position.y = -3.2;
    for (let f = 0; f < 3; f++) {
      const a = (f * Math.PI * 2) / 3;
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.6, 1.2), rocketRed);
      fin.position.set(Math.cos(a) * 1.25, -1.5, Math.sin(a) * 1.25);
      fin.rotation.y = -a;
      rocket.add(fin);
    }
    rocket.add(body, nose, win, flame);
    rocket.position.set(rx, ry, rz);
    rocket.rotation.z = rx > 0 ? 0.18 : -0.18;
    root.add(rocket);
    floaters.push(rocket);
  });

  return {
    theme: 'angkasa',
    config: WORLD_CONFIGS.angkasa,
    root,
    clouds: [],
    balloons: [],
    windmillBlades: [],
    floaters,
    rings,
    snowMesh: null,
    snowData: [],
  };
}

export function createWorldBundle(
  theme: WorldTheme,
  maxTrackLength: number,
  maxAniso: number,
): WorldBundle {
  const root = new THREE.Group();
  if (theme === 'pantai') return buildPantaiWorld(root, maxTrackLength, maxAniso);
  if (theme === 'salju') return buildSaljuWorld(root, maxTrackLength, maxAniso);
  if (theme === 'angkasa') return buildAngkasaWorld(root, maxTrackLength, maxAniso);
  return buildTamanWorld(root, maxTrackLength, maxAniso);
}

export function disposeWorldBundle(bundle: WorldBundle | null): void {
  if (!bundle) return;
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();

  bundle.root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh) {
      if (mesh.geometry) geometries.add(mesh.geometry);
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((m) => {
        if (!m) return;
        materials.add(m);
        const std = m as THREE.MeshStandardMaterial;
        if (std.map) textures.add(std.map);
      });
    }
  });

  textures.forEach((t) => t.dispose());
  materials.forEach((m) => m.dispose());
  geometries.forEach((g) => g.dispose());
}
