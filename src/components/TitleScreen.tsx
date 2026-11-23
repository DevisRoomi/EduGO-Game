import React, { useState } from 'react';
import {
  BookOpen,
  Check,
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
import { HAT_META, PACE_CONFIGS, WORLD_META } from '../game/rules';
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
const PACE_KEYS: PaceLevel[] = ['santai', 'normal', 'cepat'];
const WORLD_KEYS: WorldTheme[] = ['taman', 'pantai', 'salju', 'angkasa'];
const HAT_KEYS: HatStyle[] = ['sport', 'astronaut', 'bunny', 'graduation', 'starCrown'];

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

  const shareUrl = room
    ? `${window.location.origin}${window.location.pathname}?room=${room.code}`
    : '';

  const handleCopyInvite = () => {
    if (!shareUrl) return;
    navigator.clipboard?.writeText(shareUrl).catch(() => {});
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 1800);
  };

  const cycleP2Hat = () => {
    const idx = HAT_KEYS.indexOf(p2Hat);
    onSelectP2Hat(HAT_KEYS[(idx + 1) % HAT_KEYS.length]);
  };

  const isGuestLocked = Boolean(room && !room.isHost);
  const canStartOnline = Boolean(room && room.isHost && room.members.length >= 2);
  const poolCount =
    subject === 'custom'
      ? customCount
      : getQuestionPool(subject, [], grade).length;

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between px-3 pt-[max(20px,calc(env(safe-area-inset-top)+12px))] pb-[max(12px,calc(env(safe-area-inset-bottom)+8px))] sm:p-5">
      {/* Top Row: Bespoke SVG Emblem over Sky Negative Space + BGM & SFX Toggles */}
      <div className="flex items-start justify-between gap-3">
        <div className="pointer-events-auto flex flex-col items-start">
          <svg
            viewBox="0 0 460 108"
            className="h-14 w-auto drop-shadow-[0_6px_0_rgba(15,23,42,0.28)] sm:h-20"
            role="img"
            aria-label="Lari Pintar 3D — Balapan Edukasi SD Kelas 1 sampai 6"
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

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleBgm}
            aria-label={bgmMuted ? 'Nyalakan musik latar' : 'Matikan musik latar'}
            title={bgmMuted ? 'Musik Latar: Mati' : 'Musik Latar: Nyala'}
            className={`flex h-11 items-center gap-1.5 rounded-xl border-2 border-slate-900 px-3 text-xs font-bold shadow-[0_4px_0_#0F172A] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 ${
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
            title={sfxMuted ? 'Efek Suara: Mati' : 'Efek Suara: Nyala'}
            className={`flex h-11 items-center gap-1.5 rounded-xl border-2 border-slate-900 px-3 text-xs font-bold shadow-[0_4px_0_#0F172A] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 ${
              sfxMuted ? 'bg-slate-200 text-slate-600' : 'bg-[#FFFDF5] text-slate-900'
            }`}
          >
            {sfxMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            <span className="hidden sm:inline">{sfxMuted ? 'SFX Mati' : 'SFX'}</span>
          </button>
        </div>
      </div>

      {/* Main Docked Setup Card on Left Side — leaves center/right 3D world open */}
      <div className="my-auto flex flex-col items-start justify-center py-1">
        <section
          aria-label="Pengaturan Balapan"
          className="pointer-events-auto max-h-[calc(100dvh-144px)] w-full max-w-[505px] overflow-y-auto rounded-2xl border-[3px] border-slate-900 bg-[#FFFDF5]/95 p-3 shadow-[0_8px_0_rgba(15,23,42,0.9)] sm:max-h-[calc(100dvh-132px)] sm:p-4"
        >
          {/* 1. Mode Selector */}
          <div className="mb-2.5">
            <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600">
              <span>Mode Bermain</span>
              <span>
                {mode === 'local2p'
                  ? '1 Layar · 2 Pemain'
                  : mode === 'onlineMulti'
                    ? '2–8 Perangkat · Scan QR / Link'
                    : 'Latihan Lawan Bot'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-200/80 p-1">
              {(
                [
                  { id: 'local2p', label: '2P Lokal' },
                  { id: 'onlineMulti', label: 'Multi-Perangkat' },
                  { id: 'soloBot', label: '1P vs Bot' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={Boolean(room)}
                  onClick={() => onSelectMode(item.id)}
                  className={`whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-slate-900 disabled:opacity-60 ${
                    mode === item.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-white/70 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. 3D World Theme Selector (Live Preview!) */}
          <div className="mb-2.5">
            <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1">
                <Globe2 className="h-3.5 w-3.5 text-sky-600" />
                Tema Dunia 3D
              </span>
              <span className="text-[11px] font-bold text-slate-800">{WORLD_META[worldTheme].label}</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {WORLD_KEYS.map((key) => {
                const active = worldTheme === key;
                const meta = WORLD_META[key];
                return (
                  <button
                    key={key}
                    type="button"
                    data-testid={`world-btn-${key}`}
                    disabled={isGuestLocked}
                    onClick={() => onSelectWorld(key)}
                    style={active ? { backgroundColor: meta.accentHex } : undefined}
                    className={`whitespace-nowrap rounded-lg border-2 px-2 py-1.5 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-slate-900 disabled:opacity-60 ${
                      active
                        ? 'border-slate-900 text-white shadow-[0_2px_0_#0F172A]'
                        : 'border-slate-300 bg-white text-slate-800 hover:border-slate-900'
                    }`}
                  >
                    {meta.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Grade Level Selector (Kelas 1 - Kelas 5-6 SD) */}
          <div className="mb-2.5">
            <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5 text-indigo-600" />
                Tingkat Kelas SD
              </span>
              <span className="text-indigo-700">{GRADE_META[grade].label}</span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {GRADE_KEYS.map((key) => {
                const active = grade === key;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={isGuestLocked}
                    onClick={() => onSelectGrade(key)}
                    className={`whitespace-nowrap rounded-lg border-2 px-1 py-1 text-[11px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-slate-900 disabled:opacity-60 sm:px-1.5 sm:text-xs ${
                      active
                        ? 'border-slate-900 bg-indigo-600 text-white shadow-[0_2px_0_#0F172A]'
                        : 'border-slate-300 bg-white text-slate-800 hover:border-slate-900'
                    }`}
                  >
                    {GRADE_META[key].shortLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Subject Selector + Pace Compact Grid */}
          <div className="mb-2.5">
            <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600">
              <span>Pilih Materi</span>
              <span>
                {subject === 'custom'
                  ? `${customCount} soal custom`
                  : `${poolCount} soal acak`}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {SUBJECT_KEYS.map((key) => {
                const active = subject === key;
                const meta = SUBJECT_META[key];
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={isGuestLocked}
                    onClick={() => onSelectSubject(key)}
                    style={active ? { backgroundColor: meta.color } : undefined}
                    className={`whitespace-nowrap rounded-lg border-2 px-2.5 py-1 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-slate-900 disabled:opacity-60 ${
                      active
                        ? 'border-slate-900 text-white shadow-[0_2px_0_#0F172A]'
                        : 'border-slate-300 bg-white text-slate-800 hover:border-slate-900'
                    }`}
                  >
                    {meta.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Pace / Speed Selector */}
          <div className="mb-2.5">
            <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1">
                <Gauge className="h-3.5 w-3.5 text-emerald-700" />
                Kecepatan Lari &amp; Soal
              </span>
              <span className="text-[11px] font-semibold text-emerald-800">
                {PACE_CONFIGS[pace].hint.split('·')[1]?.trim() || PACE_CONFIGS[pace].hint}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {PACE_KEYS.map((key) => {
                const active = pace === key;
                const cfg = PACE_CONFIGS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={isGuestLocked}
                    onClick={() => onSelectPace(key)}
                    className={`whitespace-nowrap rounded-lg border-2 px-2.5 py-1 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-slate-900 disabled:opacity-60 ${
                      active
                        ? 'border-slate-900 bg-emerald-500 text-white shadow-[0_2px_0_#0F172A]'
                        : 'border-slate-300 bg-white text-slate-800 hover:border-slate-900'
                    }`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Runner Hat Accessory Picker (Live 3D Preview!) */}
          <div className="mb-2.5">
            <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                {mode === 'local2p' ? 'Aksesori Pelari 1' : 'Aksesori Pelari Kamu'}
              </span>
              <span className="text-[11px] font-bold text-amber-800">{HAT_META[p1Hat].label}</span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {HAT_KEYS.map((key) => {
                const active = p1Hat === key;
                return (
                  <button
                    key={key}
                    type="button"
                    data-testid={`hat-btn-${key}`}
                    onClick={() => onSelectP1Hat(key)}
                    className={`whitespace-nowrap rounded-lg border-2 px-1.5 py-1 text-[11px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-slate-900 ${
                      active
                        ? 'border-slate-900 bg-amber-400 text-slate-900 shadow-[0_2px_0_#0F172A]'
                        : 'border-slate-300 bg-white text-slate-800 hover:border-slate-900'
                    }`}
                  >
                    {HAT_META[key].shortLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 7. Player Names (Local 2P / Solo Bot) */}
          {mode !== 'onlineMulti' && (
            <div className="mb-3 grid grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="p1-name" className="mb-0.5 block text-xs font-bold text-rose-700">
                  Pemain 1 (Kiri)
                </label>
                <input
                  id="p1-name"
                  type="text"
                  maxLength={18}
                  value={p1Name}
                  onChange={(e) => onChangeP1Name(e.target.value)}
                  className="w-full rounded-lg border-2 border-slate-300 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-900 focus:border-rose-500 focus:outline-none"
                />
              </div>
              <div>
                <div className="mb-0.5 flex items-center justify-between gap-1">
                  <label htmlFor="p2-name" className="text-xs font-bold text-sky-700">
                    {mode === 'soloBot' ? 'Lawan Bot' : 'Pemain 2'}
                  </label>
                  <button
                    type="button"
                    onClick={cycleP2Hat}
                    className="rounded border border-sky-300 bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold text-sky-800 hover:border-slate-900"
                    title="Ganti topi Pemain 2"
                  >
                    Topi: {HAT_META[p2Hat].shortLabel}
                  </button>
                </div>
                <input
                  id="p2-name"
                  type="text"
                  maxLength={18}
                  value={mode === 'soloBot' ? 'Bot Bima' : p2Name}
                  disabled={mode === 'soloBot'}
                  onChange={(e) => onChangeP2Name(e.target.value)}
                  className="w-full rounded-lg border-2 border-slate-300 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-900 focus:border-sky-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>
            </div>
          )}

          {/* 7b. Multi-Device Room Panel (2..8 Perangkat via QR Code / Link / Wi-Fi) */}
          {mode === 'onlineMulti' && (
            <div className="mb-3 rounded-xl border-2 border-slate-200 bg-sky-50/80 p-2.5">
              {!room ? (
                <div className="space-y-2">
                  <div>
                    <label htmlFor="online-player-name" className="mb-0.5 block text-xs font-bold text-slate-700">
                      Nama Pelari Kamu
                    </label>
                    <input
                      id="online-player-name"
                      type="text"
                      maxLength={18}
                      value={p1Name}
                      onChange={(e) => onChangeP1Name(e.target.value)}
                      placeholder="Contoh: Raka"
                      className="w-full rounded-lg border-2 border-slate-300 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-900 focus:border-sky-600 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={onCreateRoom}
                      className="flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border-2 border-slate-900 bg-amber-400 px-3 py-2 text-xs font-bold text-slate-900 shadow-[0_3px_0_#0F172A] hover:bg-amber-300"
                    >
                      <Users className="h-4 w-4" />
                      Buat Ruang (2–8)
                    </button>
                    <div className="flex flex-1 items-center gap-1.5">
                      <input
                        type="text"
                        aria-label="Kode Ruang"
                        maxLength={6}
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        placeholder="KODE"
                        className="font-num w-24 rounded-lg border-2 border-slate-300 bg-white px-2 py-2 text-center text-xs font-bold uppercase text-slate-900 focus:border-sky-600 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => onJoinRoom(joinCode)}
                        disabled={joinCode.trim().length < 3}
                        className="whitespace-nowrap rounded-lg border-2 border-slate-900 bg-sky-500 px-3 py-2 text-xs font-bold text-white shadow-[0_3px_0_#0F172A] hover:bg-sky-400 disabled:opacity-50"
                      >
                        Gabung
                      </button>
                    </div>
                  </div>
                  <p className="flex items-start gap-1.5 text-[11px] font-medium leading-snug text-slate-600">
                    <Wifi className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-700" />
                    Bisa main hingga 8 perangkat via Wi-Fi/internet! Buat ruang untuk menampilkan QR Code proyektor &amp; link langsung.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="block text-[11px] font-bold text-slate-600">
                        Kode Ruang ({room.members.length}/{room.maxPlayers} Pemain)
                      </span>
                      <span
                        data-testid="room-code-value"
                        className="font-num text-2xl font-bold tracking-widest text-slate-900"
                      >
                        {room.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleCopyInvite}
                        className="flex items-center gap-1 whitespace-nowrap rounded-lg border-2 border-slate-900 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 hover:bg-slate-100"
                      >
                        {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiedLink ? 'Tersalin' : 'Salin Link'}
                      </button>
                      <button
                        type="button"
                        onClick={onLeaveRoom}
                        className="whitespace-nowrap rounded-lg border-2 border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:border-slate-900 hover:text-slate-900"
                      >
                        Keluar
                      </button>
                    </div>
                  </div>

                  {/* Classroom QR Code + Projector Modal Trigger */}
                  <QrCodeDisplay url={shareUrl} code={room.code} />

                  {/* Direct Link Box */}
                  <div className="flex items-center gap-1.5 rounded-lg border border-sky-200 bg-white px-2.5 py-1 text-[11px] text-slate-700">
                    <Link2 className="h-3.5 w-3.5 shrink-0 text-sky-600" />
                    <span className="truncate font-mono">{shareUrl}</span>
                  </div>

                  {/* Live Member Roster (2..8 players) */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {room.members.map((member) => {
                      const palette = RUNNER_PALETTES[member.colorIndex % RUNNER_PALETTES.length];
                      const isMe = member.id === room.myPlayerId;
                      return (
                        <div
                          key={member.id}
                          className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-bold ${
                            isMe
                              ? 'border-slate-900 bg-amber-100 text-slate-900'
                              : 'border-slate-200 bg-white text-slate-800'
                          }`}
                        >
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full border border-slate-900"
                            style={{ backgroundColor: `#${palette.jersey.toString(16).padStart(6, '0')}` }}
                            aria-hidden="true"
                          />
                          <span className="truncate">{member.name}</span>
                          <span className="ml-auto text-[10px] font-semibold text-slate-500">
                            {HAT_META[member.hatStyle || 'sport']?.shortLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {roomError && (
                <p role="alert" className="mt-2 text-xs font-bold text-rose-600">
                  {roomError}
                </p>
              )}
            </div>
          )}

          {/* Action Row: Primary Start CTA + Teacher Question Studio */}
          <div className="flex flex-wrap items-center gap-2">
            {mode !== 'onlineMulti' ? (
              <button
                type="button"
                data-start="true"
                onClick={onStartLocal}
                className="font-display flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border-[3px] border-slate-900 bg-emerald-400 px-5 py-2.5 text-lg font-bold text-slate-900 shadow-[0_4px_0_#0F172A] transition-transform hover:-translate-y-0.5 hover:bg-emerald-300 active:translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
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
                className="font-display flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border-[3px] border-slate-900 bg-emerald-400 px-5 py-2.5 text-lg font-bold text-slate-900 shadow-[0_4px_0_#0F172A] transition-transform hover:-translate-y-0.5 hover:bg-emerald-300 active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Play className="h-5 w-5 fill-slate-900" />
                {room && !room.isHost ? 'Menunggu Host...' : 'Mulai Balapan'}
              </button>
            )}

            <button
              type="button"
              onClick={onOpenTeacherStudio}
              className="flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border-[3px] border-slate-900 bg-amber-300 px-3.5 py-2.5 text-sm font-bold text-slate-900 shadow-[0_4px_0_#0F172A] transition-transform hover:-translate-y-0.5 hover:bg-amber-200 active:translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              <BookOpen className="h-4 w-4" />
              Soal Guru
            </button>
          </div>
        </section>
      </div>

      {/* Bottom Safe Margin: Single Flat Control-Hint Line */}
      <div className="pointer-events-none flex justify-center">
        <p className="rounded-lg bg-slate-900/80 px-4 py-1 text-center text-xs font-semibold text-white">
          {mode === 'local2p'
            ? 'P1: A/D Jalur · W Lompat  |  P2: ←/→ Jalur · ↑ Lompat  |  Streak 3x = FEVER 2x Poin!'
            : 'A/D atau ←/→ Jalur · W/↑/Spasi Lompat  |  Ambil Perisai & Magnet · Streak 3x = FEVER 2x!'}
        </p>
      </div>
    </div>
  );
};
