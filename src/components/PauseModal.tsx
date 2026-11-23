import React from 'react';
import { Home, Play, RotateCcw } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onMainMenu,
}) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
      className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/60 p-4"
    >
      <div className="w-full max-w-sm rounded-2xl border-[3px] border-slate-900 bg-[#FFFDF5] p-6 text-center shadow-[0_10px_0_#0F172A]">
        <h2 id="pause-title" className="font-display text-3xl font-bold text-slate-900">
          Balapan Dijeda
        </h2>
        <p className="mt-1 text-sm font-medium text-slate-600">
          Tarik napas dulu, lalu lanjutkan menjawab gerbang soal!
        </p>

        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="font-display flex w-full items-center justify-center gap-2 rounded-xl border-[3px] border-slate-900 bg-emerald-400 px-5 py-3 text-lg font-bold text-slate-900 shadow-[0_4px_0_#0F172A] hover:bg-emerald-300"
          >
            <Play className="h-5 w-5 fill-slate-900" />
            Lanjutkan
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-900 bg-amber-300 px-4 py-2.5 text-sm font-bold text-slate-900 shadow-[0_3px_0_#0F172A] hover:bg-amber-200"
          >
            <RotateCcw className="h-4 w-4" />
            Ulangi Balapan
          </button>
          <button
            type="button"
            onClick={onMainMenu}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:border-slate-900 hover:text-slate-900"
          >
            <Home className="h-4 w-4" />
            Menu Utama
          </button>
        </div>
      </div>
    </div>
  );
};
