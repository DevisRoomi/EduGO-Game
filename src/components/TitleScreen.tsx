import React, { useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronRight,
  Copy,
  Gauge,
  Globe2,
  GraduationCap,
  Link2,
  Music,
  Play,
  Sparkles,
  Users,
  Volume2,
  VolumeX,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import type {
  GameMode,
  GradeLevel,
  HatStyle,
  PaceLevel,
  RoomStatePayload,
  SubjectId,
  WorldTheme,
} from '../game/types';
import { GRADE_META, SUBJECT_META, getQuestionPool } from '../game/questions';
import {
  HAT_META,
  PACE_CONFIGS,
  SPEED_LEVELS,
  WORLD_META,
  getPaceFromLevel,
  getPaceLevelNumber,
} from '../game/rules';
import { RUNNER_PALETTES } from '../game/models';
import { QrCodeDisplay } from './QrCodeDisplay';

interface TitleScreenProps {
  grade: GradeLevel;
  onSelectGrade: (g: GradeLevel) => void;
  pace: PaceLevel;
  onSelectPace: (p: PaceLevel) => void;
  worldTheme: WorldTheme;
  onSelectWorld: (w: WorldTheme) => void;
  subject: SubjectId;
  onSelectSubject: (s: SubjectId) => void;
  mode: GameMode;
  onSelectMode: (m: GameMode) => void;
  p1Name: string;
  p2Name: string;
  onChangeP1Name: (name: string) => void;
  onChangeP2Name: (name: string) => void;
  p1Hat: HatStyle;
  p2Hat: HatStyle;
  onSelectP1Hat: (hat: HatStyle) => void;
  onSelectP2Hat: (hat: HatStyle) => void;
  customCount: number;
  sfxMuted: boolean;
  bgmMuted: boolean;
  onToggleSfx: () => void;
  onToggleBgm: () => void;
  onStartLocal: () => void;
  onOpenTeacherStudio: () => void;
  // Multi-device room controls (2..8 devices)
  room: RoomStatePayload | null;
  roomError: string | null;
  wsConnected: boolean;
  initialJoinCode: string;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onLeaveRoom: () => void;
  onStartRoomRace: () => void;
}

const GRADE_KEYS: GradeLevel[] = ['kelas1', 'kelas2', 'kelas3', 'kelas4', 'kelas56'];
const SUBJECT_KEYS: SubjectId[] = ['matematika', 'ipas', 'bahasa', 'campuran', 'custom'];
const WORLD_KEYS: WorldTheme[] = ['taman', 'pantai', 'salju', 'angkasa'];
const HAT_KEYS: HatStyle[] = ['sport', 'astronaut', 'bunny', 'graduation', 'starCrown'];

const GRADE_AGE_MAP: Record<GradeLevel, string> = {
  kelas1: 'Usia 6–7 thn',
  kelas2: 'Usia 7–8 thn',
  kelas3: 'Usia 8–9 thn',
  kelas4: 'Usia 9–10 thn',
  kelas56: 'Usia 10–12 thn',
};

type ActiveModal = 'none' | 'speed' | 'subject' | 'grade' | 'world' | 'hat1' | 'hat2';

export const TitleScreen: React.FC<TitleScreenProps> = ({
  grade,
  onSelectGrade,
  pace,
  onSelectPace,
  worldTheme,
  onSelectWorld,
  subject,
  onSelectSubject,
  mode,
  onSelectMode,
  p1Name,
  p2Name,
  onChangeP1Name,
  onChangeP2Name,
  p1Hat,
  p2Hat,
  onSelectP1Hat,
  onSelectP2Hat,
  customCount,
  sfxMuted,
  bgmMuted,
  onToggleSfx,
  onToggleBgm,
  onStartLocal,
  onOpenTeacherStudio,
  room,
  roomError,
  initialJoinCode,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onStartRoomRace,
}) => {
  const [joinCode, setJoinCode] = useState(initialJoinCode);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>('none');

  const currentLevelNum = getPaceLevelNumber(pace);

  const shareUrl = room
    ? `${window.location.origin}${window.location.pathname}?room=${room.code}`
    : '';

  const handleCopyInvite = () => {
    if (!shareUrl) return;
    navigator.clipboard?.writeText(shareUrl).catch(() => {});
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 1800);
  };

  const isGuestLocked = Boolean(room && !room.isHost);
  const canStartOnline = Boolean(room && room.isHost && room.members.length >= 2);
  const poolCount =
    subject === 'custom'
      ? customCount
      : getQuestionPool(subject, [], grade).length;

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between px-3 pt-[max(16px,calc(env(safe-area-inset-top)+10px))] pb-[max(10px,calc(env(safe-area-inset-bottom)+8px))] sm:p-5">
      {/* Top Header Row: Emblem + Audio Toggles */}
      <div className="flex items-start justify-between gap-3">
        <div className="pointer-events-auto flex flex-col items-start">
          <svg
            viewBox="0 0 460 108"
            className="h-12 w-auto drop-shadow-[0_5px_0_rgba(15,23,42,0.28)] sm:h-16"
            role="img"
            aria-label="Lari Pintar 3D — Balapan Edukasi SD"
          >
            <path
              d="M18 22 L428 14 L444 54 L424 88 L22 94 L8 56 Z"
              fill="#FFFDF5"
              stroke="#0F172A"
              strokeWidth="6"
              strokeLinejoin="round"
            />
            <path d="M24 26 L136 24 L126 88 L26 90 L14 57 Z" fill="#F43F5E" />
            <circle cx="72" cy="57" r="26" fill="#FACC15" stroke="#0F172A" strokeWidth="4.5" />
            <path
              d="M72 39 L77 51 L90 52 L80 60 L83 73 L72 66 L61 73 L64 60 L54 52 L67 51 Z"
              fill="#FFFDF5"
              stroke="#0F172A"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <text
              x="148"
              y="62"
              fill="#0F172A"
              fontFamily="Fredoka, sans-serif"
              fontWeight="700"
              fontSize="40"
              letterSpacing="-0.5"
            >
              LARI PINTAR
            </text>
            <rect
              x="384"
              y="26"
              width="46"
              height="36"
              rx="10"
              fill="#0EA5E9"
              stroke="#0F172A"
              strokeWidth="3.5"
            />
            <text
              x="407"
              y="52"
              textAnchor="middle"
              fill="#FFFFFF"
              fontFamily="Fredoka, sans-serif"
              fontWeight="700"
              fontSize="24"
            >
              3D
            </text>
            <text
              x="150"
              y="83"
              fill="#475569"
              fontFamily="Plus Jakarta Sans, sans-serif"
              fontWeight="700"
              fontSize="13.5"
              letterSpacing="0.4"
            >
              BALAPAN EDUKASI SD KELAS 1–6
            </text>
          </svg>
        </div>

        {/* Music & Sound Toggles */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleBgm}
            aria-label={bgmMuted ? 'Nyalakan musik latar' : 'Matikan musik latar'}
            title={bgmMuted ? 'Musik: Mati' : 'Musik: Nyala'}
            className={`flex h-10 items-center gap-1.5 rounded-xl border-2 border-slate-900 px-3 text-xs font-bold shadow-[0_3px_0_#0F172A] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 ${
              bgmMuted ? 'bg-slate-200 text-slate-600' : 'bg-[#FFFDF5] text-slate-900'
            }`}
          >
            <Music className="h-4 w-4" />
            <span className="hidden sm:inline">{bgmMuted ? 'Musik Mati' : 'Musik'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleSfx}
            aria-label={sfxMuted ? 'Aktifkan efek suara' : 'Matikan efek suara'}
            title={sfxMuted ? 'SFX: Mati' : 'SFX: Nyala'}
            className={`flex h-10 items-center gap-1.5 rounded-xl border-2 border-slate-900 px-3 text-xs font-bold shadow-[0_3px_0_#0F172A] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 ${
              sfxMuted ? 'bg-slate-200 text-slate-600' : 'bg-[#FFFDF5] text-slate-900'
            }`}
          >
            {sfxMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            <span className="hidden sm:inline">{sfxMuted ? 'SFX Mati' : 'SFX'}</span>
          </button>
        </div>
      </div>

      {/* Main Clean Setup Card: Compact, Minimal & Spacious */}
      <div className="my-auto flex flex-col items-start justify-center py-1">
        <section
          aria-label="Pengaturan Balapan"
          className="pointer-events-auto w-full max-w-[460px] rounded-2xl border-[3px] border-slate-900 bg-[#FFFDF5]/95 p-3.5 shadow-[0_8px_0_rgba(15,23,42,0.9)] backdrop-blur-sm sm:p-4"
        >
          {/* 1. Mode Selector Tabs */}
          <div className="mb-3">
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-200/90 p-1">
              {(
                [
                  { id: 'local2p', label: '👥 2P Lokal' },
                  { id: 'onlineMulti', label: '🌐 Mabar HP/WiFi' },
                  { id: 'soloBot', label: '🤖 1P vs Bot' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={Boolean(room)}
                  onClick={() => onSelectMode(item.id)}
                  className={`rounded-lg py-1.5 text-center text-xs font-bold transition-all disabled:opacity-50 ${
                    mode === item.id
                      ? 'border border-slate-900 bg-slate-900 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-white/70 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Four Interactive Setting Tiles (2x2 Grid) */}
          <div className="mb-3 grid grid-cols-2 gap-2">
            {/* Tile 1: Materi */}
            <button
              type="button"
              disabled={isGuestLocked}
              onClick={() => setActiveModal('subject')}
              className="flex flex-col items-start justify-between rounded-xl border-2 border-slate-900 bg-amber-50 p-2.5 text-left shadow-[0_3px_0_#0F172A] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-60"
            >
              <div className="flex w-full items-center justify-between text-[11px] font-bold text-amber-900">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5 text-amber-600" />
                  Materi
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-amber-500" />
              </div>
              <div className="mt-1 font-display text-sm font-bold text-slate-900 truncate w-full">
                {SUBJECT_META[subject].label}
              </div>
              <span className="text-[10px] font-semibold text-slate-600">
                {subject === 'custom' ? `${customCount} soal guru` : `${poolCount} soal`}
              </span>
            </button>

            {/* Tile 2: Kelas SD */}
            <button
              type="button"
              disabled={isGuestLocked}
              onClick={() => setActiveModal('grade')}
              className="flex flex-col items-start justify-between rounded-xl border-2 border-slate-900 bg-indigo-50 p-2.5 text-left shadow-[0_3px_0_#0F172A] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-60"
            >
              <div className="flex w-full items-center justify-between text-[11px] font-bold text-indigo-900">
                <span className="flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5 text-indigo-600" />
                  Kelas SD
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-indigo-500" />
              </div>
              <div className="mt-1 font-display text-sm font-bold text-slate-900 truncate w-full">
                {GRADE_META[grade].shortLabel}
              </div>
              <span className="text-[10px] font-semibold text-slate-600">
                {GRADE_AGE_MAP[grade]}
              </span>
            </button>

            {/* Tile 3: Kecepatan Lari & Soal (Level 1–10) */}
            <button
              type="button"
              disabled={isGuestLocked}
              onClick={() => setActiveModal('speed')}
              className="flex flex-col items-start justify-between rounded-xl border-2 border-slate-900 bg-emerald-50 p-2.5 text-left shadow-[0_3px_0_#0F172A] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-60"
            >
              <div className="flex w-full items-center justify-between text-[11px] font-bold text-emerald-900">
                <span className="flex items-center gap-1">
                  <Gauge className="h-3.5 w-3.5 text-emerald-600" />
                  Kecepatan
                </span>
                <span className="rounded bg-emerald-600 px-1.5 py-0.2 text-[10px] font-black text-white">
                  Lvl {currentLevelNum}
                </span>
              </div>
              <div className="mt-1 font-display text-sm font-bold text-slate-900 truncate w-full">
                {PACE_CONFIGS[pace].label.split('·')[1]?.trim() || PACE_CONFIGS[pace].label}
              </div>
              <span className="text-[10px] font-semibold text-emerald-800">
                {currentLevelNum <= 3 ? 'Santai' : currentLevelNum <= 6 ? 'Normal' : 'Cepat Kilat'}
              </span>
            </button>

            {/* Tile 4: Tema Dunia 3D */}
            <button
              type="button"
              disabled={isGuestLocked}
              onClick={() => setActiveModal('world')}
              className="flex flex-col items-start justify-between rounded-xl border-2 border-slate-900 bg-sky-50 p-2.5 text-left shadow-[0_3px_0_#0F172A] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-60"
            >
              <div className="flex w-full items-center justify-between text-[11px] font-bold text-sky-900">
                <span className="flex items-center gap-1">
                  <Globe2 className="h-3.5 w-3.5 text-sky-600" />
                  Dunia 3D
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-sky-500" />
              </div>
              <div className="mt-1 font-display text-sm font-bold text-slate-900 truncate w-full">
                {WORLD_META[worldTheme].shortLabel}
              </div>
              <span className="text-[10px] font-semibold text-slate-600">
                {WORLD_META[worldTheme].label}
              </span>
            </button>
          </div>

          {/* 3. Player Identity Section */}
          {mode !== 'onlineMulti' ? (
            <div className="mb-3 rounded-xl border-2 border-slate-200 bg-white/80 p-2.5">
              <div className="grid grid-cols-2 gap-2">
                {/* Player 1 */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-rose-700">Pemain 1 (Kiri)</span>
                    <button
                      type="button"
                      onClick={() => setActiveModal('hat1')}
                      className="rounded border border-amber-300 bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-800 hover:border-slate-900"
                      title="Ganti Topi"
                    >
                      Topi: {HAT_META[p1Hat].shortLabel}
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={16}
                    value={p1Name}
                    onChange={(e) => onChangeP1Name(e.target.value)}
                    className="w-full rounded-lg border-2 border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-900 focus:border-rose-500 focus:outline-none"
                    placeholder="Nama P1"
                  />
                </div>

                {/* Player 2 or Bot */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-sky-700">
                      {mode === 'soloBot' ? 'Lawan' : 'Pemain 2 (Kanan)'}
                    </span>
                    {mode !== 'soloBot' && (
                      <button
                        type="button"
                        onClick={() => setActiveModal('hat2')}
                        className="rounded border border-sky-300 bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-800 hover:border-slate-900"
                        title="Ganti Topi"
                      >
                        Topi: {HAT_META[p2Hat].shortLabel}
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    maxLength={16}
                    value={mode === 'soloBot' ? 'Bot Bima' : p2Name}
                    disabled={mode === 'soloBot'}
                    onChange={(e) => onChangeP2Name(e.target.value)}
                    className="w-full rounded-lg border-2 border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-900 focus:border-sky-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                    placeholder="Nama P2"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Multi-Device Room View */
            <div className="mb-3 rounded-xl border-2 border-slate-200 bg-sky-50/90 p-2.5">
              {!room ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label htmlFor="online-player-name" className="mb-0.5 block text-[11px] font-bold text-slate-700">
                        Nama Kamu:
                      </label>
                      <input
                        id="online-player-name"
                        type="text"
                        maxLength={18}
                        value={p1Name}
                        onChange={(e) => onChangeP1Name(e.target.value)}
                        placeholder="Nama kamu..."
                        className="w-full rounded-lg border-2 border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-900 focus:border-sky-600 focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveModal('hat1')}
                      className="mt-4 rounded-lg border-2 border-slate-900 bg-amber-300 px-2 py-1 text-xs font-bold text-slate-900 shadow-[0_2px_0_#0F172A]"
                    >
                      Topi: {HAT_META[p1Hat].shortLabel}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={onCreateRoom}
                      className="flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border-2 border-slate-900 bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-900 shadow-[0_2px_0_#0F172A] hover:bg-amber-300"
                    >
                      <Users className="h-3.5 w-3.5" />
                      Buat Ruang (2–8)
                    </button>
                    <div className="flex flex-1 items-center gap-1">
                      <input
                        type="text"
                        aria-label="Kode Ruang"
                        maxLength={6}
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        placeholder="KODE"
                        className="font-num w-20 rounded-lg border-2 border-slate-300 bg-white px-1.5 py-1.5 text-center text-xs font-bold uppercase text-slate-900 focus:border-sky-600 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => onJoinRoom(joinCode)}
                        disabled={joinCode.trim().length < 3}
                        className="whitespace-nowrap rounded-lg border-2 border-slate-900 bg-sky-500 px-2.5 py-1.5 text-xs font-bold text-white shadow-[0_2px_0_#0F172A] hover:bg-sky-400 disabled:opacity-50"
                      >
                        Gabung
                      </button>
                    </div>
                  </div>
                  <p className="flex items-center gap-1 text-[10px] font-semibold text-slate-600">
                    <Wifi className="h-3 w-3 text-sky-600" />
                    P2P WebRTC: Bisa mabar langsung via Wi-Fi atau internet HP!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-600">
                        Kode Ruang ({room.members.length}/{room.maxPlayers} Pemain)
                      </span>
                      <span
                        data-testid="room-code-value"
                        className="font-num text-xl font-bold tracking-widest text-slate-900"
                      >
                        {room.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleCopyInvite}
                        className="flex items-center gap-1 whitespace-nowrap rounded-lg border border-slate-900 bg-white px-2 py-1 text-xs font-bold text-slate-900 hover:bg-slate-100"
                      >
                        {copiedLink ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        {copiedLink ? 'Tersalin' : 'Salin'}
                      </button>
                      <button
                        type="button"
                        onClick={onLeaveRoom}
                        className="whitespace-nowrap rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-bold text-slate-600 hover:border-slate-900 hover:text-slate-900"
                      >
                        Keluar
                      </button>
                    </div>
                  </div>

                  {/* QR Code Proyektor */}
                  <QrCodeDisplay url={shareUrl} code={room.code} />

                  {/* Member Roster */}
                  <div className="grid grid-cols-2 gap-1">
                    {room.members.map((member) => {
                      const palette = RUNNER_PALETTES[member.colorIndex % RUNNER_PALETTES.length];
                      const isMe = member.id === room.myPlayerId;
                      return (
                        <div
                          key={member.id}
                          className={`flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-xs font-bold ${
                            isMe
                              ? 'border-slate-900 bg-amber-100 text-slate-900'
                              : 'border-slate-200 bg-white text-slate-800'
                          }`}
                        >
                          <span
                            className="h-2 w-2 shrink-0 rounded-full border border-slate-900"
                            style={{ backgroundColor: `#${palette.jersey.toString(16).padStart(6, '0')}` }}
                            aria-hidden="true"
                          />
                          <span className="truncate">{member.name}</span>
                          <span className="ml-auto text-[9px] font-semibold text-slate-500">
                            {HAT_META[member.hatStyle || 'sport']?.shortLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {roomError && (
                <p role="alert" className="mt-1 text-xs font-bold text-rose-600">
                  {roomError}
                </p>
              )}
            </div>
          )}

          {/* 4. Action Buttons: Big Green Start CTA + Studio Guru */}
          <div className="flex items-center gap-2">
            {mode !== 'onlineMulti' ? (
              <button
                type="button"
                data-start="true"
                onClick={onStartLocal}
                className="font-display flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border-[3px] border-slate-900 bg-emerald-400 px-4 py-2.5 text-base font-bold text-slate-900 shadow-[0_4px_0_#0F172A] transition-transform hover:-translate-y-0.5 hover:bg-emerald-300 active:translate-y-0.5"
              >
                <Play className="h-5 w-5 fill-slate-900" />
                Mulai Balapan
              </button>
            ) : (
              <button
                type="button"
                data-start="true"
                disabled={!canStartOnline}
                onClick={onStartRoomRace}
                className="font-display flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border-[3px] border-slate-900 bg-emerald-400 px-4 py-2.5 text-base font-bold text-slate-900 shadow-[0_4px_0_#0F172A] transition-transform hover:-translate-y-0.5 hover:bg-emerald-300 active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Play className="h-5 w-5 fill-slate-900" />
                {room && !room.isHost ? 'Menunggu Host...' : 'Mulai Balapan'}
              </button>
            )}

            <button
              type="button"
              onClick={onOpenTeacherStudio}
              className="flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border-[3px] border-slate-900 bg-amber-300 px-3 py-2.5 text-xs font-bold text-slate-900 shadow-[0_4px_0_#0F172A] transition-transform hover:-translate-y-0.5 hover:bg-amber-200 active:translate-y-0.5"
            >
              <BookOpen className="h-4 w-4" />
              Soal Guru
            </button>
          </div>
        </section>
      </div>

      {/* Bottom Hint */}
      <div className="pointer-events-none flex justify-center">
        <p className="rounded-lg bg-slate-900/80 px-3.5 py-1 text-center text-xs font-semibold text-white">
          {mode === 'local2p'
            ? 'P1: A/D Jalur · W Lompat  |  P2: ←/→ Jalur · ↑ Lompat'
            : 'Gunakan A/D atau ←/→ untuk Ganti Jalur · W / Spasi untuk Lompat'}
        </p>
      </div>

      {/* ========================================================= */}
      {/* MODAL DIALOGS: Clean, focused, child-friendly popups       */}
      {/* ========================================================= */}

      {/* MODAL: KECEPATAN (LEVEL 1 - 10) */}
      {activeModal === 'speed' && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border-[3px] border-slate-900 bg-[#FFFDF5] shadow-[0_10px_0_#0F172A]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-200 bg-emerald-400 px-4 py-3 text-slate-900">
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                <div>
                  <h3 className="font-display text-base font-bold">Pilih Level Kecepatan (1–10)</h3>
                  <p className="text-[11px] font-semibold text-emerald-950">
                    Atur kecepatan pelari & waktu membaca soal di gerbang
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal('none')}
                className="rounded-lg border-2 border-slate-900 bg-white p-1 text-slate-900 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body: 10 Speed Levels grouped nicely */}
            <div className="space-y-3 overflow-y-auto p-4">
              {/* Group 1: Santai (Level 1..3) */}
              <div>
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Zona Santai · Cocok Kelas 1–3 / Belajar Santai
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((lvl) => {
                    const key = getPaceFromLevel(lvl);
                    const cfg = PACE_CONFIGS[key];
                    const isSelected = currentLevelNum === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => {
                          onSelectPace(key);
                          setActiveModal('none');
                        }}
                        className={`flex flex-col items-center justify-center rounded-xl border-2 p-2 text-center transition-all ${
                          isSelected
                            ? 'border-slate-900 bg-emerald-500 text-white shadow-[0_3px_0_#0F172A]'
                            : 'border-slate-300 bg-white text-slate-800 hover:border-slate-900 hover:bg-emerald-50'
                        }`}
                      >
                        <span className="font-display text-lg font-bold">Lvl {lvl}</span>
                        <span className="text-[10px] font-semibold">{cfg.hint.split('·')[1]?.trim() || '~8 dtk'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Group 2: Normal (Level 4..6) */}
              <div>
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-amber-800">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  Zona Normal · Seimbang & Nyaman Dibaca (Standar)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[4, 5, 6].map((lvl) => {
                    const key = getPaceFromLevel(lvl);
                    const cfg = PACE_CONFIGS[key];
                    const isSelected = currentLevelNum === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => {
                          onSelectPace(key);
                          setActiveModal('none');
                        }}
                        className={`flex flex-col items-center justify-center rounded-xl border-2 p-2 text-center transition-all ${
                          isSelected
                            ? 'border-slate-900 bg-amber-400 text-slate-900 shadow-[0_3px_0_#0F172A]'
                            : 'border-slate-300 bg-white text-slate-800 hover:border-slate-900 hover:bg-amber-50'
                        }`}
                      >
                        <div className="flex items-center gap-1 font-display text-lg font-bold">
                          Lvl {lvl}
                          {lvl === 5 && <span className="text-[11px]">★</span>}
                        </div>
                        <span className="text-[10px] font-semibold">{cfg.hint.split('·')[1]?.trim() || '~5,5 dtk'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Group 3: Cepat (Level 7..10) */}
              <div>
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-rose-800">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  Zona Cepat &amp; Kilat · Tantangan Refleks Ekstrem
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {[7, 8, 9, 10].map((lvl) => {
                    const key = getPaceFromLevel(lvl);
                    const cfg = PACE_CONFIGS[key];
                    const isSelected = currentLevelNum === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => {
                          onSelectPace(key);
                          setActiveModal('none');
                        }}
                        className={`flex flex-col items-center justify-center rounded-xl border-2 p-2 text-center transition-all ${
                          isSelected
                            ? 'border-slate-900 bg-rose-500 text-white shadow-[0_3px_0_#0F172A]'
                            : 'border-slate-300 bg-white text-slate-800 hover:border-slate-900 hover:bg-rose-50'
                        }`}
                      >
                        <div className="flex items-center gap-0.5 font-display text-base font-bold">
                          Lvl {lvl}
                          {lvl === 10 && <Zap className="h-3 w-3 fill-amber-300 text-amber-300" />}
                        </div>
                        <span className="text-[9px] font-semibold">{cfg.hint.split('·')[1]?.trim() || '~3 dtk'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t-2 border-slate-200 bg-slate-100 p-3 text-center">
              <button
                type="button"
                onClick={() => setActiveModal('none')}
                className="w-full rounded-xl border-2 border-slate-900 bg-white py-2 text-xs font-bold text-slate-800 shadow-[0_2px_0_#0F172A] hover:bg-slate-50"
              >
                Tutup &amp; Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MATERI SOAL */}
      {activeModal === 'subject' && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border-[3px] border-slate-900 bg-[#FFFDF5] shadow-[0_10px_0_#0F172A]">
            <div className="flex items-center justify-between border-b-2 border-slate-200 bg-amber-300 px-4 py-3 text-slate-900">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                <div>
                  <h3 className="font-display text-base font-bold">Pilih Materi Pelajaran</h3>
                  <p className="text-[11px] font-semibold text-slate-800">
                    Pilih kategori soal yang akan muncul di gerbang balapan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal('none')}
                className="rounded-lg border-2 border-slate-900 bg-white p-1 text-slate-900 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto p-4">
              {SUBJECT_KEYS.map((key) => {
                const isSelected = subject === key;
                const meta = SUBJECT_META[key];
                const count = key === 'custom' ? customCount : getQuestionPool(key, [], grade).length;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      onSelectSubject(key);
                      setActiveModal('none');
                    }}
                    className={`flex w-full items-center justify-between rounded-xl border-2 p-3 text-left transition-all ${
                      isSelected
                        ? 'border-slate-900 bg-amber-100 text-slate-900 shadow-[0_3px_0_#0F172A]'
                        : 'border-slate-300 bg-white text-slate-800 hover:border-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-display text-sm font-bold text-slate-900">{meta.label}</div>
                      <div className="text-xs text-slate-600">{meta.description}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-800">
                        {count} soal
                      </span>
                      {isSelected && <Check className="h-4 w-4 text-emerald-600" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TINGKAT KELAS SD */}
      {activeModal === 'grade' && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border-[3px] border-slate-900 bg-[#FFFDF5] shadow-[0_10px_0_#0F172A]">
            <div className="flex items-center justify-between border-b-2 border-slate-200 bg-indigo-500 px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                <div>
                  <h3 className="font-display text-base font-bold">Pilih Tingkat Kelas SD</h3>
                  <p className="text-[11px] font-semibold text-indigo-100">
                    Menyesuaikan kosakata dan tingkat kesulitan soal
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal('none')}
                className="rounded-lg border-2 border-slate-900 bg-white p-1 text-slate-900 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto p-4">
              {GRADE_KEYS.map((key) => {
                const isSelected = grade === key;
                const meta = GRADE_META[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      onSelectGrade(key);
                      setActiveModal('none');
                    }}
                    className={`flex w-full items-center justify-between rounded-xl border-2 p-3 text-left transition-all ${
                      isSelected
                        ? 'border-slate-900 bg-indigo-50 text-slate-900 shadow-[0_3px_0_#0F172A]'
                        : 'border-slate-300 bg-white text-slate-800 hover:border-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-display text-sm font-bold text-slate-900">{meta.label}</div>
                      <div className="text-xs text-slate-600">{meta.description}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-800">
                        {GRADE_AGE_MAP[key]}
                      </span>
                      {isSelected && <Check className="h-4 w-4 text-emerald-600" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TEMA DUNIA 3D */}
      {activeModal === 'world' && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border-[3px] border-slate-900 bg-[#FFFDF5] shadow-[0_10px_0_#0F172A]">
            <div className="flex items-center justify-between border-b-2 border-slate-200 bg-sky-400 px-4 py-3 text-slate-900">
              <div className="flex items-center gap-2">
                <Globe2 className="h-5 w-5" />
                <div>
                  <h3 className="font-display text-base font-bold">Pilih Arena Dunia 3D</h3>
                  <p className="text-[11px] font-semibold text-sky-950">
                    Latar visual 3D akan langsung berganti secara real-time
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal('none')}
                className="rounded-lg border-2 border-slate-900 bg-white p-1 text-slate-900 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 p-4">
              {WORLD_KEYS.map((key) => {
                const isSelected = worldTheme === key;
                const meta = WORLD_META[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      onSelectWorld(key);
                      setActiveModal('none');
                    }}
                    className={`flex flex-col items-center justify-center rounded-xl border-2 p-3 text-center transition-all ${
                      isSelected
                        ? 'border-slate-900 bg-sky-100 text-slate-900 shadow-[0_3px_0_#0F172A]'
                        : 'border-slate-300 bg-white text-slate-800 hover:border-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-display text-base font-bold text-slate-900">{meta.label}</span>
                    <span className="mt-1 text-[11px] text-slate-600">{meta.description}</span>
                    {isSelected && (
                      <span className="mt-2 flex items-center gap-1 text-xs font-bold text-sky-700">
                        <Check className="h-3.5 w-3.5" /> Terpilih
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TOPI PELARI (1 ATAU 2) */}
      {(activeModal === 'hat1' || activeModal === 'hat2') && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl border-[3px] border-slate-900 bg-[#FFFDF5] shadow-[0_10px_0_#0F172A]">
            <div className="flex items-center justify-between border-b-2 border-slate-200 bg-amber-400 px-4 py-3 text-slate-900">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <h3 className="font-display text-base font-bold">
                  Topi {activeModal === 'hat1' ? 'Pemain 1' : 'Pemain 2'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal('none')}
                className="rounded-lg border-2 border-slate-900 bg-white p-1 text-slate-900 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5 p-4">
              {HAT_KEYS.map((key) => {
                const currentHat = activeModal === 'hat1' ? p1Hat : p2Hat;
                const isSelected = currentHat === key;
                const meta = HAT_META[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      if (activeModal === 'hat1') onSelectP1Hat(key);
                      else onSelectP2Hat(key);
                      setActiveModal('none');
                    }}
                    className={`flex w-full items-center justify-between rounded-xl border-2 p-2.5 text-left transition-all ${
                      isSelected
                        ? 'border-slate-900 bg-amber-100 text-slate-900 shadow-[0_2px_0_#0F172A]'
                        : 'border-slate-300 bg-white text-slate-800 hover:border-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-display text-sm font-bold text-slate-900">{meta.label}</span>
                    {isSelected && <Check className="h-4 w-4 text-emerald-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
