export type GradeLevel = 'kelas1' | 'kelas2' | 'kelas3' | 'kelas4' | 'kelas56';

export type PaceLevel = 'santai' | 'normal' | 'cepat';

export type WorldTheme = 'taman' | 'pantai' | 'salju' | 'angkasa';

export type HatStyle = 'sport' | 'astronaut' | 'bunny' | 'graduation' | 'starCrown';

export type PowerupType = 'shield' | 'magnet';

export type SubjectId =
  | 'matematika'
  | 'ipas'
  | 'bahasa'
  | 'campuran'
  | 'custom';

export type GameMode = 'local2p' | 'onlineMulti' | 'soloBot';

export type GamePhase = 'title' | 'countdown' | 'playing' | 'paused' | 'gameover';

export interface Question {
  id: string;
  subject: string;
  grade?: GradeLevel;
  prompt: string;
  options: [string, string, string];
  correctIndex: 0 | 1 | 2;
  explanation?: string;
}

export interface AnswerRecord {
  questionIndex: number;
  prompt: string;
  correctOption: string;
  p1Choice: number | null;
  p1Correct: boolean;
  p2Choice: number | null;
  p2Correct: boolean;
}

export interface PlayerStats {
  id: string;
  name: string;
  colorIndex: number;
  hatStyle: HatStyle;
  score: number;
  streak: number;
  bestStreak: number;
  correctCount: number;
  wrongCount: number;
  obstaclesCleared: number;
  starsCollected: number;
  distance: number;
  progress: number; // 0..1
  speed: number;
  boostActive: boolean;
  stumbleActive: boolean;
  hasShield: boolean;
  magnetActive: boolean;
  feverActive: boolean;
  finished: boolean;
  finishTime: number | null;
}

export interface ActiveQuestionView {
  index: number;
  total: number;
  prompt: string;
  options: [string, string, string];
  subject: string;
}

export interface GateFeedback {
  id: number;
  player: 1 | 2;
  correct: boolean;
  pointsDelta: number;
  message: string;
  correctAnswerText?: string;
}

export interface HudSnapshot {
  phase: GamePhase;
  countdownValue: number;
  timeRemaining: number;
  p1: PlayerStats;
  p2: PlayerStats;
  /** Current lane index (0=A, 1=B, 2=C) for instant HUD lane highlight */
  p1Lane: number;
  p2Lane: number;
  /** Full sorted leaderboard for all active players (2 in local/bot, 2..8 in multi-device) */
  standings: PlayerStats[];
  /** Local player's ID in multi-device mode */
  localPlayerId: string;
  /** Names of rivals currently shown on the left & right adjacent tracks in multi-device mode */
  leftRivalName: string | null;
  rightRivalName: string | null;
  activeQuestion: ActiveQuestionView | null;
  p1Feedback: GateFeedback | null;
  p2Feedback: GateFeedback | null;
  winner: 'p1' | 'p2' | 'draw' | null;
  winnerName: string | null;
  answerHistory: AnswerRecord[];
}

export interface RemotePlayerState {
  playerId: string;
  name: string;
  colorIndex: number;
  hatStyle: HatStyle;
  z: number;
  lane: number;
  y: number;
  speed: number;
  score: number;
  streak: number;
  bestStreak: number;
  correctCount: number;
  wrongCount: number;
  obstaclesCleared: number;
  starsCollected: number;
  boostActive: boolean;
  stumbleActive: boolean;
  hasShield: boolean;
  magnetActive: boolean;
  feverActive: boolean;
  finished: boolean;
  finishTime: number | null;
}

export interface RoomMemberInfo {
  id: string;
  name: string;
  slot: number; // 1..8
  colorIndex: number;
  hatStyle: HatStyle;
  isHost: boolean;
}

export interface RoomStatePayload {
  code: string;
  subject: SubjectId;
  grade: GradeLevel;
  pace: PaceLevel;
  worldTheme: WorldTheme;
  questionCount: number;
  status: 'waiting' | 'ready' | 'playing' | 'finished';
  maxPlayers: number;
  myPlayerId: string;
  isHost: boolean;
  members: RoomMemberInfo[];
}
