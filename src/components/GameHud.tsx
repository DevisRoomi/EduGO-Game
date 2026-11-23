import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Crown,
  Flame,
  Magnet,
  Music,
  Pause,
  Shield,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { GameMode, HudSnapshot, PlayerStats } from '../game/types';
import { RUNNER_PALETTES } from '../game/models';

interface GameHudProps {
  hud: HudSnapshot;
  mode: GameMode;
  sfxMuted: boolean;
  bgmMuted: boolean;
  onToggleSfx: () => void;
  onToggleBgm: () => void;
  onPause: () => void;
  onTouchMove: (slot: 1 | 2, dir: -1 | 1) => void;
  onSelectLane: (slot: 1 | 2, lane: 0 | 1 | 2) => void;
  onTouchJump: (slot: 1 | 2) => void;
}

function formatTimer(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const ActivePowerupBar: React.FC<{ player: PlayerStats; compact?: boolean }> = ({
  player,
  compact = false,
}) => {
  if (!player.hasShield && !player.magnetActive && !player.feverActive) {
    return null;
  }
  return (
    <div className={`${compact ? 'mt-1' : 'mt-1.5'} flex flex-wrap items-center gap-1`}>
      {player.feverActive && (
        <span className="inline-flex items-center gap-0.5 rounded-md border border-slate-900 bg-amber-300 px-1.5 py-0.5 text-[10px] font-extrabold text-slate-900">
          <Flame className="h-3 w-3 text-rose-600" />
          FEVER 2x
        </span>
      )}
      {player.hasShield && (
        <span className="inline-flex items-center gap-0.5 rounded-md border border-slate-900 bg-sky-200 px-1.5 py-0.5 text-[10px] font-extrabold text-sky-950">
          <Shield className="h-3 w-3 text-sky-700" />
          Perisai
        </span>
      )}
      {player.magnetActive && (
        <span className="inline-flex items-center gap-0.5 rounded-md border border-slate-900 bg-rose-200 px-1.5 py-0.5 text-[10px] font-extrabold text-rose-950">
          <Magnet className="h-3 w-3 text-rose-700" />
          Magnet
        </span>
      )}
    </div>
  );
};

const OPTION_STYLES = [
  {
    letter: 'A',
    base: 'border-blue-600 bg-blue-50 text-blue-950',
    active: 'border-slate-900 bg-blue-600 text-white shadow-[0_3px_0_#0F172A]',
    badgeBase: 'bg-blue-600 text-white',
    badgeActive: 'bg-white text-blue-700',
  },
  {
    letter: 'B',
    base: 'border-amber-600 bg-amber-50 text-amber-950',
    active: 'border-slate-900 bg-amber-400 text-slate-950 shadow-[0_3px_0_#0F172A]',
    badgeBase: 'bg-amber-500 text-slate-950',
    badgeActive: 'bg-slate-900 text-amber-300',
  },
  {
    letter: 'C',
    base: 'border-emerald-600 bg-emerald-50 text-emerald-950',
    active: 'border-slate-900 bg-emerald-600 text-white shadow-[0_3px_0_#0F172A]',
    badgeBase: 'bg-emerald-600 text-white',
    badgeActive: 'bg-white text-emerald-700',
  },
] as const;

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  mode,
  sfxMuted,
  bgmMuted,
  onToggleSfx,
  onToggleBgm,
  onPause,
  onTouchMove,
  onSelectLane,
  onTouchJump,
}) => {
  const isMulti = mode === 'onlineMulti';
  const myRankIndex = hud.standings.findIndex((s) => s.id === hud.localPlayerId);
  const myRank = myRankIndex >= 0 ? myRankIndex + 1 : 1;
  const totalPlayers = Math.max(hud.standings.length, 2);

  // Compact live standings (top 4 + local player if ranked 5+)
  const topStandings = hud.standings.slice(0, 4);
  const showSelfFooter = isMulti && myRank > 4 && myRankIndex >= 0;

  const p1Hex = `#${RUNNER_PALETTES[hud.p1.colorIndex % RUNNER_PALETTES.length].jersey
    .toString(16)
    .padStart(6, '0')}`;

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between px-3 pt-[max(22px,calc(env(safe-area-inset-top)+14px))] pb-[max(14px,calc(env(safe-area-inset-bottom)+10px))] md:p-4">
      {/* Top Perimeter Clusters — safe-area mobile 2-row header + 3-column desktop perimeter */}
      <div className="flex flex-col gap-1.5 md:grid md:grid-cols-[1fr_auto_1fr] md:items-start md:gap-4">
        {/* Mobile-Only Safe 2-Row Top HUD (Never clips or squishes on 360px–430px screens) */}
        <div className="flex flex-col gap-1.5 md:hidden" data-testid="mobile-top-hud">
          {/* Row 1: Timer + Gate Indicator on left, Spacious 40x40 Utility Buttons on right */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 rounded-xl border-2 border-slate-900 bg-slate-900 px-3 py-1.5 text-white shadow-[0_3px_0_rgba(15,23,42,0.35)]">
              <span className="text-[10px] font-bold tracking-wider text-amber-300">WAKTU</span>
              <span
                data-testid="mobile-race-timer"
                className={`font-num text-base font-bold leading-none ${
                  hud.timeRemaining <= 15 ? 'text-rose-400' : 'text-white'
                }`}
              >
                {formatTimer(hud.timeRemaining)}
              </span>
            </div>

            <div className="pointer-events-auto flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onPause();
                }}
                aria-label="Jeda balapan"
                className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-slate-900 bg-[#FFFDF5] text-slate-900 shadow-[0_3px_0_#0F172A] active:translate-y-0.5"
              >
                <Pause className="h-4 w-4" />
              </button>
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onToggleBgm();
                }}
                aria-label={bgmMuted ? 'Nyalakan musik latar' : 'Matikan musik latar'}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 border-slate-900 shadow-[0_3px_0_#0F172A] active:translate-y-0.5 ${
                  bgmMuted ? 'bg-slate-200 text-slate-500' : 'bg-[#FFFDF5] text-slate-900'
                }`}
              >
                <Music className="h-4 w-4" />
              </button>
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onToggleSfx();
                }}
                aria-label={sfxMuted ? 'Nyalakan efek suara' : 'Matikan efek suara'}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 border-slate-900 shadow-[0_3px_0_#0F172A] active:translate-y-0.5 ${
                  sfxMuted ? 'bg-slate-200 text-slate-500' : 'bg-[#FFFDF5] text-slate-900'
                }`}
              >
                {sfxMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Row 2: Compact 2-Column Score Bar with Progress & Active Power-ups */}
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded-xl border-2 border-slate-900 bg-[#FFFDF5]/95 px-2.5 py-1.5 shadow-[0_3px_0_#0F172A]">
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full border border-slate-900"
                    style={{ backgroundColor: p1Hex }}
                    aria-hidden="true"
                  />
                  <span className="truncate text-xs font-extrabold text-slate-900">
                    {isMulti ? `#${myRank} ${hud.p1.name}` : hud.p1.name}
                  </span>
                </div>
                <span className="font-num shrink-0 text-base font-bold leading-none text-slate-900">
                  {hud.p1.score}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-rose-100">
                <div
                  className="h-full origin-left bg-rose-500 transition-transform duration-150"
                  style={{ transform: `scaleX(${Math.max(0.04, hud.p1.progress)})` }}
                />
              </div>
              <ActivePowerupBar player={hud.p1} compact />
            </div>

            <div className="rounded-xl border-2 border-slate-900 bg-[#FFFDF5]/95 px-2.5 py-1.5 shadow-[0_3px_0_#0F172A]">
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full border border-slate-900 bg-sky-500"
                    aria-hidden="true"
                  />
                  <span className="truncate text-xs font-extrabold text-slate-800">
                    {isMulti
                      ? hud.standings[0]?.id === hud.localPlayerId
                        ? `Top #1/${totalPlayers}`
                        : `#1 ${hud.standings[0]?.name || ''}`
                      : hud.p2.name}
                  </span>
                </div>
                <span className="font-num shrink-0 text-base font-bold leading-none text-slate-900">
                  {isMulti ? (hud.standings[0]?.score ?? hud.p2.score) : hud.p2.score}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-sky-100">
                <div
                  className="h-full origin-left bg-sky-500 transition-transform duration-150"
                  style={{
                    transform: `scaleX(${Math.max(
                      0.04,
                      isMulti ? (hud.standings[0]?.progress ?? hud.p2.progress) : hud.p2.progress,
                    )})`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Top-Left: Player 1 (or Local Player in Multi-Device) Score Cluster */}
        <div className="hidden flex-col items-start gap-1.5 md:flex">
          <div className="w-full min-w-[205px] max-w-[255px] rounded-xl border-[3px] border-slate-900 bg-[#FFFDF5]/95 px-3.5 py-2 shadow-[0_4px_0_#0F172A]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 truncate">
                <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" fill={p1Hex} stroke="#0F172A" strokeWidth="2.2" />
                  <text x="12" y="16" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="700">
                    {isMulti ? `#${myRank}` : '1'}
                  </text>
                </svg>
                <span className="truncate text-xs font-extrabold text-slate-900">
                  {hud.p1.name}
                  {isMulti ? ' (Kamu)' : ''}
                </span>
              </div>
              <span className="shrink-0 text-[11px] font-bold text-rose-700">
                {hud.p1.streak > 1 ? `Streak ${hud.p1.streak}x` : `${hud.p1.correctCount} benar`}
              </span>
            </div>

            <div className="mt-1 flex items-baseline justify-between gap-3">
              <span
                data-testid="p1-score"
                className="font-num text-2xl font-bold leading-none text-slate-900"
              >
                {hud.p1.score}
              </span>
              <span className="font-num shrink-0 text-xs font-bold text-slate-600">
                {Math.round(hud.p1.progress * 100)}% · {hud.p1.boostActive ? 'BOOST!' : `${hud.p1.speed} km/j`}
              </span>
            </div>

            {/* Progress Track Bar */}
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-rose-100">
              <div
                className="h-full origin-left bg-rose-500 transition-transform duration-150"
                style={{ transform: `scaleX(${Math.max(0.03, hud.p1.progress)})` }}
              />
            </div>

            <ActivePowerupBar player={hud.p1} />
          </div>

          {hud.p1Feedback && (
            <div
              className={`rounded-lg border-2 border-slate-900 px-2.5 py-1 text-xs font-bold shadow-[0_3px_0_#0F172A] ${
                hud.p1Feedback.correct ? 'bg-emerald-300 text-slate-900' : 'bg-amber-200 text-slate-900'
              }`}
            >
              <div>{hud.p1Feedback.message}</div>
              {hud.p1Feedback.correctAnswerText && (
                <div className="text-[11px] font-semibold text-slate-800">
                  Benar: {hud.p1Feedback.correctAnswerText}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center: Desktop Countdown Timer + Interactive Responsive Active Question Card */}
        <div className="flex w-full flex-col items-center gap-1.5 md:gap-2">
          <div className="hidden items-center gap-3 rounded-xl border-[3px] border-slate-900 bg-slate-900 px-4 py-1.5 text-white shadow-[0_4px_0_rgba(15,23,42,0.35)] md:flex">
            <span className="text-[11px] font-bold tracking-wider text-amber-300">WAKTU</span>
            <span
              data-testid="race-timer"
              className={`font-num text-xl font-bold leading-none ${
                hud.timeRemaining <= 15 ? 'text-rose-400' : 'text-white'
              }`}
            >
              {formatTimer(hud.timeRemaining)}
            </span>
          </div>

          {hud.activeQuestion && (
            <div
              data-testid="active-question-banner"
              className="w-full max-w-[560px] rounded-2xl border-[3px] border-slate-900 bg-[#FFFDF5]/96 px-3 py-2 text-center shadow-[0_4px_0_#0F172A] sm:px-4 sm:py-2.5"
            >
              <div className="mb-1 flex items-center justify-center gap-2 text-[11px] font-bold text-slate-500">
                <span>
                  Gerbang {hud.activeQuestion.index + 1} / {hud.activeQuestion.total}
                </span>
                <span aria-hidden="true">·</span>
                <span>{hud.activeQuestion.subject}</span>
              </div>
              <p className="font-display text-sm font-bold leading-snug text-slate-900 sm:text-lg">
                {hud.activeQuestion.prompt}
              </p>

              {/* Tappable A / B / C Answer Cards — highlights active player lane! */}
              <div className="pointer-events-auto mt-1.5 grid grid-cols-3 gap-1 text-left text-[11px] font-bold sm:mt-2 sm:gap-1.5 sm:text-xs">
                {OPTION_STYLES.map((style, idx) => {
                  const isAligned = hud.p1Lane === idx;
                  const laneIdx = idx as 0 | 1 | 2;
                  return (
                    <button
                      key={style.letter}
                      type="button"
                      tabIndex={-1}
                      data-testid={`lane-option-${style.letter}`}
                      onPointerDown={(e) => {
                        e.preventDefault();
                        onSelectLane(1, laneIdx);
                      }}
                      className={`flex min-h-[40px] items-center gap-1 rounded-xl border-2 px-1.5 py-1 text-left transition-transform active:scale-[0.98] sm:gap-1.5 sm:px-2 sm:py-1.5 ${
                        isAligned ? style.active : style.base
                      }`}
                    >
                      <span
                        className={`font-display flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] font-bold sm:h-5 sm:w-5 sm:rounded-md sm:text-xs ${
                          isAligned ? style.badgeActive : style.badgeBase
                        }`}
                      >
                        {style.letter}
                      </span>
                      <span className="line-clamp-2 break-words leading-tight">
                        {hud.activeQuestion!.options[idx]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mobile Feedback Toast right under Question Card */}
          {hud.p1Feedback && (
            <div
              className={`rounded-xl border-2 border-slate-900 px-3 py-1 text-center text-xs font-extrabold shadow-[0_3px_0_#0F172A] md:hidden ${
                hud.p1Feedback.correct ? 'bg-emerald-300 text-slate-900' : 'bg-amber-200 text-slate-900'
              }`}
            >
              <span>{hud.p1Feedback.message}</span>
              {hud.p1Feedback.correctAnswerText && (
                <span className="ml-1.5 font-semibold text-slate-800">
                  (Benar: {hud.p1Feedback.correctAnswerText})
                </span>
              )}
            </div>
          )}

          {/* Subtle Left/Right Neighbor Indicator in Multi-Device Mode */}
          {isMulti && (hud.leftRivalName || hud.rightRivalName) && (
            <div className="hidden items-center gap-3 rounded-lg bg-slate-900/75 px-3 py-1 text-[11px] font-bold text-white md:flex">
              {hud.leftRivalName && <span>← Kiri: {hud.leftRivalName}</span>}
              {hud.leftRivalName && hud.rightRivalName && <span aria-hidden="true">·</span>}
              {hud.rightRivalName && <span>Kanan: {hud.rightRivalName} →</span>}
            </div>
          )}
        </div>

        {/* Desktop Top-Right: P2 Score Card (Local/Bot) OR Live Standings (Multi-Device) + Utility Buttons */}
        <div className="hidden flex-col items-end gap-1.5 md:flex">
          <div className="flex items-start gap-2">
            {isMulti ? (
              <div
                aria-label="Klasemen Sementara"
                className="w-[225px] rounded-xl border-[3px] border-slate-900 bg-[#FFFDF5]/95 px-3 py-2 shadow-[0_4px_0_#0F172A]"
              >
                <div className="mb-1 flex items-center justify-between text-[11px] font-extrabold text-slate-600">
                  <span className="flex items-center gap-1 text-slate-900">
                    <Crown className="h-3.5 w-3.5 text-amber-500" />
                    Klasemen ({totalPlayers})
                  </span>
                  <span className="font-num text-indigo-700">Kamu #{myRank}</span>
                </div>
                <ol className="space-y-1">
                  {topStandings.map((player, idx) => {
                    const isMe = player.id === hud.localPlayerId;
                    const pal = RUNNER_PALETTES[player.colorIndex % RUNNER_PALETTES.length];
                    return (
                      <li
                        key={player.id}
                        className={`flex items-center justify-between gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-bold ${
                          isMe ? 'bg-amber-200/90 text-slate-900' : 'text-slate-800'
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span className="font-num w-4 text-[11px] font-extrabold text-slate-500">
                            {idx + 1}.
                          </span>
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full border border-slate-900"
                            style={{ backgroundColor: `#${pal.jersey.toString(16).padStart(6, '0')}` }}
                            aria-hidden="true"
                          />
                          <span className="truncate">{player.name}</span>
                        </div>
                        <span className="font-num shrink-0 font-extrabold text-slate-900">
                          {player.score}
                        </span>
                      </li>
                    );
                  })}
                  {showSelfFooter && (
                    <li className="mt-1 flex items-center justify-between gap-1.5 border-t border-slate-200 pt-1 text-xs font-bold text-indigo-900">
                      <span className="truncate">
                        #{myRank} {hud.p1.name} (Kamu)
                      </span>
                      <span className="font-num shrink-0 font-extrabold">{hud.p1.score}</span>
                    </li>
                  )}
                </ol>
              </div>
            ) : (
              <div className="w-full min-w-[205px] max-w-[255px] rounded-xl border-[3px] border-slate-900 bg-[#FFFDF5]/95 px-3.5 py-2 shadow-[0_4px_0_#0F172A]">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" fill="#0EA5E9" stroke="#0F172A" strokeWidth="2.2" />
                      <text x="12" y="16" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="700">
                        2
                      </text>
                    </svg>
                    <span className="truncate text-xs font-extrabold text-slate-900">{hud.p2.name}</span>
                  </div>
                  <span className="shrink-0 text-[11px] font-bold text-sky-700">
                    {hud.p2.streak > 1 ? `Streak ${hud.p2.streak}x` : `${hud.p2.correctCount} benar`}
                  </span>
                </div>

                <div className="mt-1 flex items-baseline justify-between gap-3">
                  <span
                    data-testid="p2-score"
                    className="font-num text-2xl font-bold leading-none text-slate-900"
                  >
                    {hud.p2.score}
                  </span>
                  <span className="font-num shrink-0 text-xs font-bold text-slate-600">
                    {Math.round(hud.p2.progress * 100)}% · {hud.p2.boostActive ? 'BOOST!' : `${hud.p2.speed} km/j`}
                  </span>
                </div>

                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-sky-100">
                  <div
                    className="h-full origin-left bg-sky-500 transition-transform duration-150"
                    style={{ transform: `scaleX(${Math.max(0.03, hud.p2.progress)})` }}
                  />
                </div>

                <ActivePowerupBar player={hud.p2} />
              </div>
            )}

            {/* Square Utility Icon Buttons: Pause, BGM, SFX */}
            <div className="pointer-events-auto flex flex-col gap-1.5">
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onPause();
                }}
                aria-label="Jeda balapan"
                className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-slate-900 bg-[#FFFDF5] text-slate-900 shadow-[0_3px_0_#0F172A] hover:bg-amber-100"
              >
                <Pause className="h-4 w-4" />
              </button>
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onToggleBgm();
                }}
                aria-label={bgmMuted ? 'Nyalakan musik latar' : 'Matikan musik latar'}
                title={bgmMuted ? 'Musik: Mati' : 'Musik: Nyala'}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 border-slate-900 shadow-[0_3px_0_#0F172A] hover:bg-amber-100 ${
                  bgmMuted ? 'bg-slate-200 text-slate-500' : 'bg-[#FFFDF5] text-slate-900'
                }`}
              >
                <Music className="h-4 w-4" />
              </button>
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onToggleSfx();
                }}
                aria-label={sfxMuted ? 'Nyalakan efek suara' : 'Matikan efek suara'}
                title={sfxMuted ? 'SFX: Mati' : 'SFX: Nyala'}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 border-slate-900 shadow-[0_3px_0_#0F172A] hover:bg-amber-100 ${
                  sfxMuted ? 'bg-slate-200 text-slate-500' : 'bg-[#FFFDF5] text-slate-900'
                }`}
              >
                {sfxMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {!isMulti && hud.p2Feedback && (
            <div
              className={`rounded-lg border-2 border-slate-900 px-2.5 py-1 text-xs font-bold shadow-[0_3px_0_#0F172A] ${
                hud.p2Feedback.correct ? 'bg-emerald-300 text-slate-900' : 'bg-amber-200 text-slate-900'
              }`}
            >
              <div>{hud.p2Feedback.message}</div>
              {hud.p2Feedback.correctAnswerText && (
                <div className="text-[11px] font-semibold text-slate-800">
                  Benar: {hud.p2Feedback.correctAnswerText}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Countdown Center Banner (only during 3-2-1 countdown) */}
      {hud.phase === 'countdown' && (
        <div className="flex flex-1 items-center justify-center">
          <div className="font-display hud-stroke text-8xl font-bold text-amber-300 drop-shadow-[0_8px_0_rgba(15,23,42,0.5)]">
            {hud.countdownValue > 0 ? hud.countdownValue : 'MULAI!'}
          </div>
        </div>
      )}

      {/* Bottom Touch Controls for Tablet/Phone + Subtle Keyboard Reminder on Desktop */}
      <div className="flex items-end justify-between">
        <div className="pointer-events-auto flex w-full items-center justify-between gap-2 md:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              tabIndex={-1}
              onPointerDown={() => onTouchMove(1, -1)}
              aria-label="Pindah jalur kiri"
              className="flex h-[52px] w-[54px] items-center justify-center rounded-2xl border-[3px] border-slate-900 bg-[#FFFDF5]/95 text-slate-900 shadow-[0_4px_0_#0F172A] active:translate-y-0.5"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              tabIndex={-1}
              onPointerDown={() => onTouchMove(1, 1)}
              aria-label="Pindah jalur kanan"
              className="flex h-[52px] w-[54px] items-center justify-center rounded-2xl border-[3px] border-slate-900 bg-[#FFFDF5]/95 text-slate-900 shadow-[0_4px_0_#0F172A] active:translate-y-0.5"
            >
              <ArrowRight className="h-6 w-6" />
            </button>
          </div>

          <span className="pointer-events-none rounded-lg bg-slate-900/75 px-2 py-1 text-center text-[10px] font-bold text-white">
            Geser / Tap A·B·C
          </span>

          <button
            type="button"
            tabIndex={-1}
            onPointerDown={() => onTouchJump(1)}
            aria-label="Lompat"
            className="font-display flex h-[52px] items-center gap-1.5 rounded-2xl border-[3px] border-slate-900 bg-amber-300 px-4 text-base font-bold text-slate-900 shadow-[0_4px_0_#0F172A] active:translate-y-0.5"
          >
            <ArrowUp className="h-5 w-5" />
            Lompat
          </button>
        </div>

        <div className="hidden w-full justify-center md:flex">
          <span className="rounded-lg bg-slate-900/75 px-3.5 py-1 text-xs font-semibold text-white">
            {mode === 'local2p'
              ? 'P1: A/D Jalur · W Lompat  |  P2: ←/→ Jalur · ↑ Lompat'
              : 'A/D atau ←/→ Pindah Jalur · W / ↑ / Spasi Lompat Rintangan'}
          </span>
        </div>
      </div>
    </div>
  );
};
