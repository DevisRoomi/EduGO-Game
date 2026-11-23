import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Crown, Download, Home, RotateCcw } from 'lucide-react';
import type { HudSnapshot } from '../game/types';
import { RUNNER_PALETTES } from '../game/models';
import { exportRaceReportToCsv } from '../game/rules';

interface WinnerModalProps {
  hud: HudSnapshot;
  gradeLabel: string;
  subjectLabel: string;
  worldLabel: string;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  color: string;
  angle: number;
  vAngle: number;
  tilt: number;
  vTilt: number;
}

interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

const CELEBRATION_COLORS = [
  '#FACC15',
  '#F43F5E',
  '#0EA5E9',
  '#10B981',
  '#A855F7',
  '#F97316',
  '#FFFFFF',
];

const VictoryParticlesCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const confetti: ConfettiPiece[] = [];
    const sparks: SparkParticle[] = [];

    const spawnFireworkBurst = (originX: number, originY: number) => {
      const paletteA = CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)];
      const paletteB = CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)];
      const count = 34;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.16;
        const speed = 110 + Math.random() * 195;
        sparks.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 35,
          life: 0,
          maxLife: 0.95 + Math.random() * 0.55,
          size: 3.2 + Math.random() * 3.4,
          color: i % 2 === 0 ? paletteA : paletteB,
        });
      }
      // Scatter extra confetti ribbons from the burst
      for (let i = 0; i < 12; i++) {
        confetti.push({
          x: originX + (Math.random() - 0.5) * 30,
          y: originY + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 190,
          vy: -80 - Math.random() * 160,
          w: 7 + Math.random() * 6,
          h: 4 + Math.random() * 4,
          color: CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)],
          angle: Math.random() * Math.PI * 2,
          vAngle: (Math.random() - 0.5) * 8,
          tilt: Math.random() * Math.PI,
          vTilt: 3 + Math.random() * 5,
        });
      }
    };

    // Initial celebratory shower around left & right of modal
    for (let i = 0; i < 72; i++) {
      confetti.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.65 - 40,
        vx: (Math.random() - 0.5) * 70,
        vy: 55 + Math.random() * 105,
        w: 8 + Math.random() * 6,
        h: 4 + Math.random() * 4,
        color: CELEBRATION_COLORS[i % CELEBRATION_COLORS.length],
        angle: Math.random() * Math.PI * 2,
        vAngle: (Math.random() - 0.5) * 6,
        tilt: Math.random() * Math.PI,
        vTilt: 2.5 + Math.random() * 4,
      });
    }

    spawnFireworkBurst(width * 0.18, height * 0.24);
    spawnFireworkBurst(width * 0.82, height * 0.24);
    spawnFireworkBurst(width * 0.5, height * 0.14);

    if (prefersReducedMotion) {
      ctx.clearRect(0, 0, width, height);
      for (const c of confetti) {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.angle);
        ctx.fillStyle = c.color;
        ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
        ctx.restore();
      }
      return () => window.removeEventListener('resize', resize);
    }

    let rafId = 0;
    let lastTs = performance.now();
    let burstTimer = 0.65;

    const tick = (now: number) => {
      const dt = Math.min((now - lastTs) / 1000, 0.05);
      lastTs = now;

      ctx.clearRect(0, 0, width, height);

      burstTimer -= dt;
      if (burstTimer <= 0) {
        burstTimer = 0.72 + Math.random() * 0.55;
        // Aim fireworks primarily around the perimeter flanking the winner modal
        const pickSide = Math.random();
        const bx =
          pickSide < 0.42
            ? width * (0.08 + Math.random() * 0.18)
            : pickSide < 0.84
              ? width * (0.74 + Math.random() * 0.18)
              : width * (0.3 + Math.random() * 0.4);
        const by = height * (0.12 + Math.random() * 0.32);
        spawnFireworkBurst(bx, by);
      }

      // Update & draw firework sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life += dt;
        if (s.life >= s.maxLife) {
          sparks.splice(i, 1);
          continue;
        }
        s.vx *= 0.965;
        s.vy = s.vy * 0.965 + 210 * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;

        const alpha = Math.max(0, 1 - s.life / s.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * (0.4 + alpha * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }

      // Update & draw tumbling confetti ribbons
      ctx.globalAlpha = 0.95;
      for (let i = confetti.length - 1; i >= 0; i--) {
        const c = confetti[i];
        c.vx *= 0.99;
        c.vy = Math.min(c.vy + 145 * dt, 220);
        c.x += c.vx * dt + Math.sin(c.tilt) * 28 * dt;
        c.y += c.vy * dt;
        c.angle += c.vAngle * dt;
        c.tilt += c.vTilt * dt;

        if (c.y > height + 30) {
          if (confetti.length > 95) {
            confetti.splice(i, 1);
            continue;
          }
          c.y = -18;
          c.x = Math.random() * width;
          c.vy = 55 + Math.random() * 90;
          c.vx = (Math.random() - 0.5) * 65;
        }

        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.angle);
        const scaleY = Math.max(0.22, Math.abs(Math.cos(c.tilt)));
        ctx.scale(1, scaleY);
        ctx.fillStyle = c.color;
        ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-testid="victory-particles-canvas"
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
};

export const WinnerModal: React.FC<WinnerModalProps> = ({
  hud,
  gradeLabel,
  subjectLabel,
  worldLabel,
  onPlayAgain,
  onMainMenu,
}) => {
  const [showReview, setShowReview] = useState(false);

  const handleDownloadCsv = () => {
    const csv = exportRaceReportToCsv(hud.standings, {
      gradeLabel,
      subjectLabel,
      worldLabel,
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateSlug = new Date().toISOString().slice(0, 10);
    link.download = `rekap-nilai-lari-pintar-${dateSlug}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const isMultiStandings = hud.standings.length > 2;
  const winnerHeading =
    hud.winner === 'draw'
      ? 'Hasil Seri Hebat!'
      : hud.winnerName
        ? `Juara: ${hud.winnerName}!`
        : hud.winner === 'p1'
          ? `Juara: ${hud.p1.name}!`
          : `Juara: ${hud.p2.name}!`;

  const answeredRows = hud.answerHistory.filter(
    (item) => item.p1Choice !== null || item.p2Choice !== null,
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="winner-heading"
      className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/60 p-4"
    >
      {/* Celebratory Fireworks & Confetti Particle Layer */}
      <VictoryParticlesCanvas />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border-[3px] border-slate-900 bg-[#FFFDF5] shadow-[0_10px_0_#0F172A]">
        {/* Celebratory Banner */}
        <div className="flex flex-col items-center border-b-2 border-slate-200 bg-amber-300 px-6 py-4 text-center">
          <svg
            viewBox="0 0 80 72"
            className="mb-1.5 h-14 w-14 drop-shadow-[0_4px_0_rgba(15,23,42,0.3)]"
            aria-hidden="true"
          >
            <path
              d="M20 12 H60 V28 C60 40 51 48 40 48 C29 48 20 40 20 28 Z"
              fill="#FACC15"
              stroke="#0F172A"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <path
              d="M20 18 H10 C10 29 14 35 22 36 M60 18 H70 C70 29 66 35 58 36"
              fill="none"
              stroke="#0F172A"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <rect x="35" y="48" width="10" height="10" fill="#F59E0B" stroke="#0F172A" strokeWidth="3.5" />
            <rect x="24" y="58" width="32" height="10" rx="3" fill="#0F172A" />
            <path
              d="M40 20 L43 27 L50 28 L45 33 L46 40 L40 36 L34 40 L35 33 L30 28 L37 27 Z"
              fill="#FFFDF5"
            />
          </svg>
          <h2 id="winner-heading" className="font-display text-3xl font-bold text-slate-900">
            {winnerHeading}
          </h2>
          <p className="mt-0.5 text-sm font-semibold text-slate-800">
            Balapan selesai! Lihat peringkat skor dan ringkasan kunci jawaban di bawah.
          </p>
        </div>

        {/* Scrollable Stats / Multi-Player Podium & Optional Answer Review */}
        <div className="flex-1 overflow-y-auto p-5">
          {isMultiStandings ? (
            <div className="space-y-3">
              {/* Top 3 Podium Cards */}
              <div className="grid gap-2.5 sm:grid-cols-3">
                {hud.standings.slice(0, 3).map((player, idx) => {
                  const isMe = player.id === hud.localPlayerId;
                  const medalBg =
                    idx === 0
                      ? 'border-amber-500 bg-amber-50'
                      : idx === 1
                        ? 'border-slate-400 bg-slate-50'
                        : 'border-orange-400 bg-orange-50/70';
                  const rankLabel = idx === 0 ? 'JUARA 1' : idx === 1 ? 'JUARA 2' : 'JUARA 3';
                  const pal = RUNNER_PALETTES[player.colorIndex % RUNNER_PALETTES.length];
                  return (
                    <div key={player.id} className={`rounded-xl border-[3px] p-3.5 ${medalBg}`}>
                      <div className="flex items-center justify-between gap-1">
                        <span className="flex items-center gap-1 text-xs font-extrabold text-slate-900">
                          {idx === 0 && <Crown className="h-4 w-4 text-amber-500" />}
                          {rankLabel}
                        </span>
                        <span
                          className="h-3 w-3 rounded-full border border-slate-900"
                          style={{ backgroundColor: `#${pal.jersey.toString(16).padStart(6, '0')}` }}
                          aria-hidden="true"
                        />
                      </div>
                      <div className="font-display mt-1 truncate text-lg font-bold text-slate-900">
                        {player.name}
                        {isMe ? ' (Kamu)' : ''}
                      </div>
                      <div className="font-num mt-1 text-3xl font-bold text-slate-900">
                        {player.score}
                      </div>
                      <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-1.5 text-[11px] font-bold text-slate-600">
                        <span>{player.correctCount} benar</span>
                        <span>{player.distance}m</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Remaining Ranks (#4 - #8) */}
              {hud.standings.length > 3 && (
                <ol className="space-y-1.5">
                  {hud.standings.slice(3).map((player, offset) => {
                    const rank = offset + 4;
                    const isMe = player.id === hud.localPlayerId;
                    return (
                      <li
                        key={player.id}
                        className={`flex items-center justify-between rounded-xl border-2 px-3.5 py-2 text-xs font-bold ${
                          isMe
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-950'
                            : 'border-slate-200 bg-white text-slate-800'
                        }`}
                      >
                        <span>
                          #{rank} {player.name}
                          {isMe ? ' (Kamu)' : ''}
                        </span>
                        <span className="font-num text-sm font-extrabold text-slate-900">
                          {player.score} poin · {player.correctCount} benar
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Player 1 Card */}
              <div
                className={`rounded-xl border-[3px] p-4 ${
                  hud.winner === 'p1'
                    ? 'border-rose-600 bg-rose-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg font-bold text-slate-900">{hud.p1.name}</span>
                  <span className="text-xs font-extrabold text-rose-700">
                    {hud.winner === 'p1' ? 'JUARA 1' : 'PEMAIN 1'}
                  </span>
                </div>
                <div className="font-num mt-2 text-4xl font-bold text-slate-900">{hud.p1.score}</div>
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-200 pt-2.5 text-center">
                  <div>
                    <div className="font-num text-base font-bold text-emerald-700">{hud.p1.correctCount}</div>
                    <div className="text-[11px] font-semibold text-slate-600">Benar</div>
                  </div>
                  <div>
                    <div className="font-num text-base font-bold text-amber-700">{hud.p1.bestStreak}x</div>
                    <div className="text-[11px] font-semibold text-slate-600">Streak</div>
                  </div>
                  <div>
                    <div className="font-num text-base font-bold text-slate-800">{hud.p1.distance}m</div>
                    <div className="text-[11px] font-semibold text-slate-600">Jarak</div>
                  </div>
                </div>
              </div>

              {/* Player 2 Card */}
              <div
                className={`rounded-xl border-[3px] p-4 ${
                  hud.winner === 'p2'
                    ? 'border-sky-600 bg-sky-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg font-bold text-slate-900">{hud.p2.name}</span>
                  <span className="text-xs font-extrabold text-sky-700">
                    {hud.winner === 'p2' ? 'JUARA 1' : 'PEMAIN 2'}
                  </span>
                </div>
                <div className="font-num mt-2 text-4xl font-bold text-slate-900">{hud.p2.score}</div>
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-200 pt-2.5 text-center">
                  <div>
                    <div className="font-num text-base font-bold text-emerald-700">{hud.p2.correctCount}</div>
                    <div className="text-[11px] font-semibold text-slate-600">Benar</div>
                  </div>
                  <div>
                    <div className="font-num text-base font-bold text-amber-700">{hud.p2.bestStreak}x</div>
                    <div className="text-[11px] font-semibold text-slate-600">Streak</div>
                  </div>
                  <div>
                    <div className="font-num text-base font-bold text-slate-800">{hud.p2.distance}m</div>
                    <div className="text-[11px] font-semibold text-slate-600">Jarak</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Expandable Review Jawaban */}
          {answeredRows.length > 0 && (
            <div className="mt-4">
              <button
                type="button"
                aria-expanded={showReview}
                onClick={() => setShowReview((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 hover:border-slate-900"
              >
                <span>Review Kunci Jawaban ({answeredRows.length} gerbang dilewati)</span>
                {showReview ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showReview && (
                <ul className="mt-2 space-y-1.5">
                  {answeredRows.map((row) => (
                    <li
                      key={row.questionIndex}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                    >
                      <p className="font-bold text-slate-900">
                        {row.questionIndex + 1}. {row.prompt}
                      </p>
                      <p className="mt-0.5 font-semibold text-emerald-700">
                        Jawaban Benar: {row.correctOption}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-t-2 border-slate-200 bg-white px-5 py-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onMainMenu}
              className="flex items-center gap-1.5 rounded-xl border-2 border-slate-300 px-3.5 py-2.5 text-sm font-bold text-slate-700 hover:border-slate-900 hover:text-slate-900"
            >
              <Home className="h-4 w-4" />
              Menu Utama
            </button>
            <button
              type="button"
              data-testid="download-csv-report"
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 rounded-xl border-2 border-slate-900 bg-amber-300 px-3.5 py-2.5 text-sm font-bold text-slate-900 shadow-[0_3px_0_#0F172A] hover:bg-amber-200"
            >
              <Download className="h-4 w-4" />
              Unduh Rekap (.CSV)
            </button>
          </div>
          <button
            type="button"
            data-start="true"
            onClick={onPlayAgain}
            className="font-display flex flex-1 items-center justify-center gap-2 rounded-xl border-[3px] border-slate-900 bg-emerald-400 px-6 py-2.5 text-lg font-bold text-slate-900 shadow-[0_4px_0_#0F172A] hover:bg-emerald-300 sm:flex-none"
          >
            <RotateCcw className="h-5 w-5" />
            Main Lagi
          </button>
        </div>
      </div>
    </div>
  );
};
