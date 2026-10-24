import React, { useEffect, useState } from 'react';
import { RotateCcw, X, CheckCircle2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

export const UndoToast: React.FC = () => {
  const { lastUndo, performUndo, dismissUndo } = useFinance();
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!lastUndo) {
      setProgress(100);
      return;
    }

    const duration = 8000; // 8 seconds
    const interval = 50;
    const step = (interval / duration) * 100;
    setProgress(100);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          dismissUndo();
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [lastUndo, dismissUndo]);

  if (!lastUndo) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-50 max-w-sm w-[calc(100vw-24px)] sm:w-auto animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="rounded-2xl bg-slate-900 border border-blue-500/40 p-4 shadow-2xl relative overflow-hidden backdrop-blur-md text-white space-y-3">
        {/* Animated Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-white truncate">
                {lastUndo.description}
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <span>¿Fue un error?</span>
                <kbd className="hidden sm:inline-block px-1 py-0.2 rounded bg-slate-800 border border-slate-700 text-[9px] font-mono text-slate-300">
                  Ctrl+Z
                </kbd>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={performUndo}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Deshacer</span>
            </button>

            <button
              type="button"
              onClick={dismissUndo}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Descartar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
