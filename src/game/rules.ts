import type {
  GameMode,
  HatStyle,
  PaceLevel,
  PlayerStats,
  Question,
  RemotePlayerState,
  WorldTheme,
} from './types';

export interface WorldThemeMeta {
  id: WorldTheme;
  label: string;
  shortLabel: string;
  description: string;
  accentHex: string;
  skyBgHex: string;
}

export const WORLD_META: Record<WorldTheme, WorldThemeMeta> = {
  taman: {
    id: 'taman',
    label: 'Taman Nusantara',
    shortLabel: 'Taman',
    description: 'Padang hijau cerah, pinus zamrud, kincir angin & balon udara',
    accentHex: '#16A34A',
    skyBgHex: '#87CEFA',
  },
  pantai: {
    id: 'pantai',
    label: 'Pantai Tropis',
    shortLabel: 'Pantai',
    description: 'Laut pirus berkilau, pasir emas, pohon kelapa & mercusuar',
    accentHex: '#0284C7',
    skyBgHex: '#5CD6FF',
  },
  salju: {
    id: 'salju',
    label: 'Lembah Salju',
    shortLabel: 'Salju',
    description: 'Salju lembut berjatuhan, pinus es, pondok kayu & manusia salju',
    accentHex: '#2563EB',
    skyBgHex: '#C7E4FA',
  },
  angkasa: {
    id: 'angkasa',
    label: 'Kota Angkasa',
    shortLabel: 'Angkasa',
    description: 'Langit bintang kosmik, cincin cahaya, planet bercincin & roket',
    accentHex: '#7C3AED',
    skyBgHex: '#1E1B4B',
  },
};

export interface HatStyleMeta {
  id: HatStyle;
  label: string;
  shortLabel: string;
}

export const HAT_META: Record<HatStyle, HatStyleMeta> = {
  sport: { id: 'sport', label: 'Topi Olahraga', shortLabel: 'Topi' },
  astronaut: { id: 'astronaut', label: 'Helm Astronot', shortLabel: 'Astronot' },
  bunny: { id: 'bunny', label: 'Telinga Kelinci', shortLabel: 'Kelinci' },
  graduation: { id: 'graduation', label: 'Topi Wisuda', shortLabel: 'Wisuda' },
  starCrown: { id: 'starCrown', label: 'Mahkota Bintang', shortLabel: 'Bintang' },
};

export interface PaceMetrics {
  id: PaceLevel;
  label: string;
  hint: string;
  baseSpeed: number;
  firstGateZ: number;
  gateSpacing: number;
  finishBuffer: number;
  roundDurationSec: number;
  questionPreviewDistance: number;
}

export const SPEED_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export function getPaceLevelNumber(pace: PaceLevel): number {
  if (pace === 'santai') return 3;
  if (pace === 'normal') return 5;
  if (pace === 'cepat') return 8;
  const num = parseInt(pace.replace('level', ''), 10);
  return Number.isFinite(num) && num >= 1 && num <= 10 ? num : 5;
}

export function getPaceFromLevel(lvl: number): PaceLevel {
  const clamped = Math.max(1, Math.min(10, Math.round(lvl)));
  return `level${clamped}` as PaceLevel;
}

export const PACE_CONFIGS: Record<PaceLevel, PaceMetrics> = {
  level1: {
    id: 'level1',
    label: 'Level 1 · Super Santai',
    hint: 'Sangat pelan · ~8,8 detik per soal (Pemula)',
    baseSpeed: 7.5,
    firstGateZ: 56,
    gateSpacing: 68,
    finishBuffer: 42,
    roundDurationSec: 135,
    questionPreviewDistance: 58,
  },
  level2: {
    id: 'level2',
    label: 'Level 2 · Santai Pemula',
    hint: 'Lari santai · ~8,0 detik per soal',
    baseSpeed: 8.0,
    firstGateZ: 55,
    gateSpacing: 66,
    finishBuffer: 41,
    roundDurationSec: 130,
    questionPreviewDistance: 57,
  },
  level3: {
    id: 'level3',
    label: 'Level 3 · Santai Nyaman',
    hint: 'Santai nyaman · ~7,5 detik per soal (Kelas 1–3)',
    baseSpeed: 8.6,
    firstGateZ: 54,
    gateSpacing: 64,
    finishBuffer: 40,
    roundDurationSec: 125,
    questionPreviewDistance: 56,
  },
  level4: {
    id: 'level4',
    label: 'Level 4 · Pelan Teratur',
    hint: 'Pelan sedang · ~6,4 detik per soal',
    baseSpeed: 9.6,
    firstGateZ: 53,
    gateSpacing: 61,
    finishBuffer: 39,
    roundDurationSec: 118,
    questionPreviewDistance: 53,
  },
  level5: {
    id: 'level5',
    label: 'Level 5 · Normal Seimbang',
    hint: 'Standar seimbang · ~5,5 detik per soal',
    baseSpeed: 10.6,
    firstGateZ: 52,
    gateSpacing: 58,
    finishBuffer: 38,
    roundDurationSec: 110,
    questionPreviewDistance: 50,
  },
  level6: {
    id: 'level6',
    label: 'Level 6 · Sedang Gesit',
    hint: 'Sedikit menantang · ~4,8 detik per soal',
    baseSpeed: 11.4,
    firstGateZ: 50,
    gateSpacing: 55,
    finishBuffer: 36,
    roundDurationSec: 104,
    questionPreviewDistance: 48,
  },
  level7: {
    id: 'level7',
    label: 'Level 7 · Cepat Tanggap',
    hint: 'Lari cepat · ~4,2 detik per soal',
    baseSpeed: 12.4,
    firstGateZ: 48,
    gateSpacing: 52,
    finishBuffer: 35,
    roundDurationSec: 96,
    questionPreviewDistance: 46,
  },
  level8: {
    id: 'level8',
    label: 'Level 8 · Gesit Kilat',
    hint: 'Tantangan kilat · ~3,8 detik per soal',
    baseSpeed: 13.4,
    firstGateZ: 46,
    gateSpacing: 50,
    finishBuffer: 34,
    roundDurationSec: 90,
    questionPreviewDistance: 44,
  },
  level9: {
    id: 'level9',
    label: 'Level 9 · Super Kilat',
    hint: 'Refleks juara · ~3,2 detik per soal',
    baseSpeed: 14.6,
    firstGateZ: 44,
    gateSpacing: 46,
    finishBuffer: 32,
    roundDurationSec: 84,
    questionPreviewDistance: 42,
  },
  level10: {
    id: 'level10',
    label: 'Level 10 · Turbo Juara',
    hint: 'Kecepatan puncak · ~2,7 detik per soal (Ekstrem)',
    baseSpeed: 16.0,
    firstGateZ: 42,
    gateSpacing: 43,
    finishBuffer: 30,
    roundDurationSec: 76,
    questionPreviewDistance: 40,
  },
  // Aliases for backward compatibility
  santai: {
    id: 'santai',
    label: 'Level 3 · Santai',
    hint: 'Lari pelan · ~7,5 detik per soal (cocok Kelas 1–3)',
    baseSpeed: 8.6,
    firstGateZ: 54,
    gateSpacing: 64,
    finishBuffer: 40,
    roundDurationSec: 125,
    questionPreviewDistance: 56,
  },
  normal: {
    id: 'normal',
    label: 'Level 5 · Normal',
    hint: 'Seimbang · ~5,5 detik per soal (nyaman dibaca)',
    baseSpeed: 10.6,
    firstGateZ: 52,
    gateSpacing: 58,
    finishBuffer: 38,
    roundDurationSec: 110,
    questionPreviewDistance: 50,
  },
  cepat: {
    id: 'cepat',
    label: 'Level 8 · Cepat',
    hint: 'Tantangan kilat · ~3,8 detik per soal',
    baseSpeed: 13.4,
    firstGateZ: 46,
    gateSpacing: 50,
    finishBuffer: 34,
    roundDurationSec: 90,
    questionPreviewDistance: 44,
  },
};

export const POWERUP_CONFIG = {
  magnetDurationSec: 7.0,
  magnetPullRadius: 11.5,
  feverStreakThreshold: 3,
  feverScoreMultiplier: 2,
  feverSpeedBonus: 1.12,
} as const;

export const TRACK_CONFIG = {
  gateCount: 10,
  firstGateZ: PACE_CONFIGS.normal.firstGateZ,
  gateSpacing: PACE_CONFIGS.normal.gateSpacing,
  finishBuffer: PACE_CONFIGS.normal.finishBuffer,
  roundDurationSec: PACE_CONFIGS.normal.roundDurationSec,
  laneSpacing: 2.35,
  // Camera looks from -Z toward +Z, so +X is screen-left and -X is screen-right
  p1TrackCenterX: 5.4,
  p2TrackCenterX: -5.4,
  // For multi-device 3-track focus view: Local player at X=0 (center), Left rival at +9.6, Right rival at -9.6
  multiTrackOffset: 9.6,
  baseSpeed: PACE_CONFIGS.normal.baseSpeed,
  boostSpeedMultiplier: 1.52,
  boostDurationSec: 2.5,
  stumbleSpeedMultiplier: 0.62,
  stumbleDurationSec: 1.3,
  obstacleStumbleDurationSec: 0.9,
  jumpVelocity: 11.4,
  gravity: 28.0,
  hurdleClearanceY: 0.95,
  questionPreviewDistance: PACE_CONFIGS.normal.questionPreviewDistance,
} as const;

export function getFinishLineZ(pace: PaceLevel = 'normal'): number {
  const m = PACE_CONFIGS[pace];
  return m.firstGateZ + (TRACK_CONFIG.gateCount - 1) * m.gateSpacing + m.finishBuffer;
}

export const FINISH_LINE_Z = getFinishLineZ('normal');

export function getGateZ(gateIndex: number, pace: PaceLevel = 'normal'): number {
  const m = PACE_CONFIGS[pace];
  return m.firstGateZ + gateIndex * m.gateSpacing;
}

export function getLaneWorldX(
  playerSlot: 1 | 2,
  laneIndex: number,
  customCenterX?: number,
): number {
  const center =
    customCenterX !== undefined
      ? customCenterX
      : playerSlot === 1
        ? TRACK_CONFIG.p1TrackCenterX
        : TRACK_CONFIG.p2TrackCenterX;
  // Lane 0 (A) is screen-left (+laneSpacing), Lane 1 (B) is center, Lane 2 (C) is screen-right (-laneSpacing)
  return center - (laneIndex - 1) * TRACK_CONFIG.laneSpacing;
}

export function shuffleQuestions(
  pool: Question[],
  rng: () => number = Math.random,
): Question[] {
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildRaceDeck(
  pool: Question[],
  count: number = TRACK_CONFIG.gateCount,
  rng: () => number = Math.random,
): Question[] {
  if (pool.length === 0) return [];
  const deck: Question[] = [];
  while (deck.length < count) {
    const batch = shuffleQuestions(pool, rng);
    for (const q of batch) {
      if (deck.length >= count) break;
      deck.push(q);
    }
  }
  return deck;
}

export interface GateEvaluation {
  correct: boolean;
  pointsDelta: number;
  nextStreak: number;
  boostTimer: number;
  stumbleTimer: number;
  shieldConsumed: boolean;
  feverActive: boolean;
}

export function evaluateGateAnswer(
  chosenLane: number,
  correctIndex: 0 | 1 | 2,
  currentStreak: number,
  hasShield: boolean = false,
): GateEvaluation {
  const correct = chosenLane === correctIndex;
  if (correct) {
    const nextStreak = currentStreak + 1;
    const streakBonus = Math.min(nextStreak - 1, 5) * 25;
    const feverActive = nextStreak >= POWERUP_CONFIG.feverStreakThreshold;
    const multiplier = feverActive ? POWERUP_CONFIG.feverScoreMultiplier : 1;
    return {
      correct: true,
      pointsDelta: (100 + streakBonus) * multiplier,
      nextStreak,
      boostTimer: TRACK_CONFIG.boostDurationSec,
      stumbleTimer: 0,
      shieldConsumed: false,
      feverActive,
    };
  }
  if (hasShield) {
    return {
      correct: false,
      pointsDelta: 0,
      nextStreak: currentStreak,
      boostTimer: 0,
      stumbleTimer: 0,
      shieldConsumed: true,
      feverActive: currentStreak >= POWERUP_CONFIG.feverStreakThreshold,
    };
  }
  return {
    correct: false,
    pointsDelta: 0,
    nextStreak: 0,
    boostTimer: 0,
    stumbleTimer: TRACK_CONFIG.stumbleDurationSec,
    shieldConsumed: false,
    feverActive: false,
  };
}

export interface ObstacleEvaluation {
  hit: boolean;
  clearedBonus: number;
  stumbleTimer: number;
  shieldConsumed: boolean;
}

export function evaluateObstacleEncounter(
  playerLane: number,
  playerY: number,
  obstacleLane: number,
  obstacleType: 'hurdle' | 'cone',
  hasShield: boolean = false,
): ObstacleEvaluation {
  if (playerLane !== obstacleLane) {
    return { hit: false, clearedBonus: 0, stumbleTimer: 0, shieldConsumed: false };
  }
  const requiredHeight = obstacleType === 'hurdle' ? TRACK_CONFIG.hurdleClearanceY : 0.85;
  if (playerY >= requiredHeight) {
    return {
      hit: false,
      clearedBonus: 20,
      stumbleTimer: 0,
      shieldConsumed: false,
    };
  }
  if (hasShield) {
    return {
      hit: false,
      clearedBonus: 10,
      stumbleTimer: 0,
      shieldConsumed: true,
    };
  }
  return {
    hit: true,
    clearedBonus: 0,
    stumbleTimer: TRACK_CONFIG.obstacleStumbleDurationSec,
    shieldConsumed: false,
  };
}

export function computeEffectiveSpeed(
  baseSpeed: number,
  boostTimer: number,
  stumbleTimer: number,
  gateIndex: number,
  feverActive: boolean = false,
): number {
  const rampSpeed = baseSpeed + Math.min(gateIndex, 10) * 0.22;
  const feverFactor = feverActive ? POWERUP_CONFIG.feverSpeedBonus : 1;
  if (stumbleTimer > 0) {
    return rampSpeed * TRACK_CONFIG.stumbleSpeedMultiplier;
  }
  if (boostTimer > 0) {
    return rampSpeed * TRACK_CONFIG.boostSpeedMultiplier * feverFactor;
  }
  return rampSpeed * feverFactor;
}

export function comparePlayersRank(
  a: Pick<PlayerStats, 'score' | 'correctCount' | 'distance' | 'finishTime'>,
  b: Pick<PlayerStats, 'score' | 'correctCount' | 'distance' | 'finishTime'>,
): number {
  if (b.score !== a.score) return b.score - a.score;
  if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
  if (Math.abs(b.distance - a.distance) > 1.5) return b.distance - a.distance;
  if (a.finishTime !== null && b.finishTime !== null && a.finishTime !== b.finishTime) {
    return a.finishTime - b.finishTime;
  }
  return 0;
}

export function rankPlayers<
  T extends Pick<PlayerStats, 'score' | 'correctCount' | 'distance' | 'finishTime'>,
>(players: T[]): T[] {
  return [...players].sort(comparePlayersRank);
}

export function determineRaceWinner(
  p1: Pick<PlayerStats, 'score' | 'correctCount' | 'distance' | 'finishTime'>,
  p2: Pick<PlayerStats, 'score' | 'correctCount' | 'distance' | 'finishTime'>,
): 'p1' | 'p2' | 'draw' {
  const cmp = comparePlayersRank(p1, p2);
  if (cmp < 0) return 'p1';
  if (cmp > 0) return 'p2';
  return 'draw';
}

/**
 * For 3-8 player multi-device races, picks at most 2 neighboring rivals to display
 * on the local player's Left and Right tracks so the screen stays focused and clutter-free.
 */
export function selectNeighborRivals(
  localZ: number,
  localPlayerId: string,
  remotes: RemotePlayerState[],
): { left: RemotePlayerState | null; right: RemotePlayerState | null } {
  const others = remotes.filter((r) => r.playerId !== localPlayerId);
  if (others.length === 0) return { left: null, right: null };
  if (others.length === 1) return { left: others[0], right: null };

  const sortedByProximity = [...others].sort(
    (a, b) => Math.abs(a.z - localZ) - Math.abs(b.z - localZ),
  );
  const twoClosest = sortedByProximity.slice(0, 2);
  twoClosest.sort((a, b) => b.z - a.z || b.score - a.score);
  return {
    left: twoClosest[0] || null,
    right: twoClosest[1] || null,
  };
}

export function computeBotTargetLane(
  correctIndex: 0 | 1 | 2,
  accuracy: number = 0.72,
  rng: () => number = Math.random,
): number {
  if (rng() < accuracy) {
    return correctIndex;
  }
  const wrongLanes = ([0, 1, 2] as const).filter((lane) => lane !== correctIndex);
  return wrongLanes[Math.floor(rng() * wrongLanes.length)];
}

function escapeSafeCsvCell(value: string | number): string {
  const raw = String(value);
  // Neutralize spreadsheet formula injection characters at start of cell
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  if (safe.includes(',') || safe.includes('"') || safe.includes('\n')) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function exportRaceReportToCsv(
  standings: PlayerStats[],
  meta: {
    gradeLabel: string;
    subjectLabel: string;
    worldLabel: string;
    dateIso?: string;
  },
): string {
  const header = [
    'Peringkat',
    'Nama Siswa',
    'Skor Akhir',
    'Jawaban Benar',
    'Jawaban Salah',
    'Akurasi (%)',
    'Streak Terbaik',
    'Bintang',
    'Jarak (m)',
    'Kelas',
    'Materi',
    'Dunia',
    'Tanggal',
  ].join(',');

  const dateStr = meta.dateIso || new Date().toISOString().slice(0, 10);
  const rows = standings.map((player, index) => {
    const totalAnswered = player.correctCount + player.wrongCount;
    const accuracy =
      totalAnswered > 0 ? Math.round((player.correctCount / totalAnswered) * 100) : 0;
    return [
      index + 1,
      player.name,
      player.score,
      player.correctCount,
      player.wrongCount,
      accuracy,
      player.bestStreak,
      player.starsCollected,
      player.distance,
      meta.gradeLabel,
      meta.subjectLabel,
      meta.worldLabel,
      dateStr,
    ]
      .map(escapeSafeCsvCell)
      .join(',');
  });

  // Prefix UTF-8 BOM so Microsoft Excel opens Indonesian characters cleanly
  return `\uFEFF${[header, ...rows].join('\n')}`;
}

export interface CameraFraming {
  isPortrait: boolean;
  focusX: number;
  camBack: number;
  camHeight: number;
  camLookY: number;
  camLookZOffset: number;
  fov: number;
}

/**
 * Computes responsive 3D camera framing so portrait phones focus directly on
 * the player's own 3-lane track (hero runner large above touch controls, giant
 * readable A/B/C gates), while landscape/desktop preserves the full broadcast view.
 */
export function computeCameraFraming(
  aspect: number,
  mode: GameMode,
  p1TrackCenterX: number,
  anyBoost: boolean,
  anyFever: boolean,
): CameraFraming {
  const safeAspect = Number.isFinite(aspect) && aspect > 0.2 ? aspect : 1.6;
  const isPortrait = safeAspect < 0.85;
  const speedFovLift = anyFever ? 7 : anyBoost ? 5 : 0;

  if (isPortrait) {
    // Narrow portrait phones: lock directly onto the player's track (never center grass)
    const basePortraitFov = Math.max(64, Math.min(74, 70 + (0.5 - safeAspect) * 14));
    return {
      isPortrait: true,
      focusX: p1TrackCenterX,
      camBack: 12.6,
      camHeight: 5.6,
      camLookY: 2.0,
      camLookZOffset: 18,
      fov: basePortraitFov + speedFovLift,
    };
  }

  // Landscape / tablet / desktop framing
  if (mode === 'local2p') {
    return {
      isPortrait: false,
      focusX: 0,
      camBack: 14.5,
      camHeight: 8.8,
      camLookY: 2.3,
      camLookZOffset: 20,
      fov: 56 + speedFovLift + (anyFever ? 2 : anyBoost ? 2 : 0),
    };
  }

  if (mode === 'onlineMulti') {
    return {
      isPortrait: false,
      focusX: 0,
      camBack: 12.2,
      camHeight: 7.4,
      camLookY: 2.3,
      camLookZOffset: 20,
      fov: 56 + speedFovLift + (anyFever ? 2 : anyBoost ? 2 : 0),
    };
  }

  // soloBot on landscape: favor P1 while keeping Bot Bima visible alongside
  return {
    isPortrait: false,
    focusX: p1TrackCenterX * 0.72,
    camBack: 11.4,
    camHeight: 6.9,
    camLookY: 2.2,
    camLookZOffset: 20,
    fov: 56 + speedFovLift + (anyFever ? 2 : anyBoost ? 2 : 0),
  };
}

