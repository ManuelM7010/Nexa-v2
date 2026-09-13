import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Plus,
  HelpCircle,
  Server,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { formatDateEs } from '../../utils/formatters';

export const Header: React.FC = () => {
  const {
    todayStr,
    setIsNewTxOpen,
    setIsAffordabilityOpen,
    setIsRenderGuideOpen,
  } = useFinance();

  return (
    <header className="w-full bg-slate-950/80 border-b border-slate-900 px-4 sm:px-6 py-3.5 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 p-0.5 shadow-lg shadow-blue-500/20 flex-shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <span className="text-lg font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">
                NX
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                NEXA <span className="text-blue-400 font-light">FINANCE</span>
              </h1>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Local-First
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Personal Finance & Daily Cash Flow
            </p>
          </div>
        </div>

        {/* Center: Today's date banner */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800/80 px-3 py-1.5 rounded-xl self-start md:self-auto">
          <Calendar className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          <span className="text-xs text-slate-300 font-medium">Hoy:</span>
          <span className="text-xs font-semibold text-white">
            {formatDateEs(todayStr, { withDayName: true, withYear: true })}
          </span>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Affordability simulator trigger */}
          <button
            id="btn-open-affordability"
            onClick={() => setIsAffordabilityOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700/60 transition cursor-pointer"
            title="Analizador financiero: ¿Puedo pagarlo sin arriesgar liquidez?"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">¿Puedo pagarlo?</span>
            <span className="sm:hidden">Simulador</span>
          </button>

          {/* Render.com deployment guide */}
          <button
            id="btn-open-render-guide"
            onClick={() => setIsRenderGuideOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-sky-300 border border-sky-500/30 transition cursor-pointer"
            title="Ver parámetros y paso a paso para desplegar en Render.com"
          >
            <Server className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Guía Render</span>
            <span className="sm:hidden">Render</span>
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* + New Transaction CTA */}
          <button
            id="btn-new-transaction"
            onClick={() => setIsNewTxOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo movimiento</span>
          </button>
        </div>
      </div>
    </header>
  );
};
