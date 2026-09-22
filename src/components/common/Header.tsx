import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Plus,
  Server,
  Calendar,
  Sparkles,
  WifiOff,
  Search,
  Eye,
  EyeOff,
  Bell,
  Menu,
} from 'lucide-react';
import { formatDateEs } from '../../utils/formatters';

export const Header: React.FC = () => {
  const {
    todayStr,
    setIsNewTxOpen,
    setIsAffordabilityOpen,
    setIsRenderGuideOpen,
    isPrivacyMode,
    togglePrivacyMode,
    setIsQuickSearchOpen,
    setIsAlertsOpen,
    setIsMobileMenuOpen,
    financialAlerts,
  } = useFinance();

  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [privacyToast, setPrivacyToast] = useState<string | null>(null);

  const handleTogglePrivacy = () => {
    togglePrivacyMode();
    const willBePrivate = !isPrivacyMode;
    setPrivacyToast(
      willBePrivate
        ? '👁️‍🗨️ Modo Privacidad ACTIVO: Saldos difuminados ($ ••••)'
        : '👁️ Modo Privacidad DESACTIVADO: Saldos visibles'
    );
    setTimeout(() => {
      setPrivacyToast(null);
    }, 2200);
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const alertCount = financialAlerts.length;
  const hasDangerAlerts = financialAlerts.some((a) => a.type === 'danger');

  return (
    <header className="w-full bg-slate-950/90 border-b border-slate-900 px-3 sm:px-6 py-2.5 sm:py-3.5 backdrop-blur-md sticky top-0 z-20">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 p-0.5 shadow-lg shadow-blue-500/20 flex-shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <span className="text-base sm:text-lg font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">
                NX
              </span>
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1 truncate">
                NEXA <span className="text-blue-400 font-light">FINANCE</span>
              </h1>
              {isOnline ? (
                <span
                  title="Modo local-first sincronizado"
                  className="hidden sm:inline-flex text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 items-center gap-1 flex-shrink-0"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Offline Ready</span>
                </span>
              ) : (
                <span
                  title="Modo 100% Offline: Datos en almacenamiento local"
                  className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 flex-shrink-0"
                >
                  <WifiOff className="w-3 h-3 text-amber-400" />
                  <span className="hidden sm:inline">Offline</span>
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium truncate hidden xs:block">
              Daily Cash Flow & Ahorros
            </p>
          </div>
        </div>

        {/* Center: Today's date banner (hidden on small mobile to give room to actions) */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-900/90 border border-slate-800/80 px-3 py-1.5 rounded-xl">
          <Calendar className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          <span className="text-xs text-slate-400 font-medium">Hoy:</span>
          <span className="text-xs font-semibold text-white">
            {formatDateEs(todayStr, { withDayName: true, withYear: true })}
          </span>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Universal Quick Search button */}
          <button
            id="btn-header-search"
            onClick={() => setIsQuickSearchOpen(true)}
            className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 text-xs font-medium cursor-pointer transition active:scale-95"
            title="Búsqueda rápida (Ctrl+K o Cmd+K)"
          >
            <Search className="w-4 h-4 text-sky-400" />
            <span className="hidden md:inline">Buscar</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-slate-800 border border-slate-700 rounded">
              ⌘K
            </kbd>
          </button>

          {/* Privacy Camouflage Mode toggle */}
          <button
            id="btn-header-privacy"
            onClick={handleTogglePrivacy}
            className={`flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl border text-xs font-semibold cursor-pointer transition active:scale-95 ${
              isPrivacyMode
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm shadow-amber-500/10'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title={
              isPrivacyMode
                ? 'Modo Privacidad Activo: Los saldos están difuminados. Haz clic para mostrarlos.'
                : 'Activar Modo Privacidad (ocultar saldos en lugares públicos)'
            }
          >
            {isPrivacyMode ? (
              <EyeOff className="w-4 h-4 text-amber-400" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            <span className="hidden xl:inline">
              {isPrivacyMode ? 'Privado' : 'Modo Privacidad'}
            </span>
          </button>

          {/* Financial Alerts Bell */}
          <button
            id="btn-header-alerts"
            onClick={() => setIsAlertsOpen(true)}
            className="relative p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs font-medium cursor-pointer transition active:scale-95 flex items-center gap-1.5"
            title="Centro de Alertas Financieras"
          >
            <Bell
              className={`w-4 h-4 ${
                hasDangerAlerts
                  ? 'text-rose-400 animate-bounce'
                  : alertCount > 0
                  ? 'text-amber-400'
                  : 'text-slate-400'
              }`}
            />
            {alertCount > 0 && (
              <span
                className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center text-white ${
                  hasDangerAlerts ? 'bg-rose-500' : 'bg-amber-500'
                }`}
              >
                {alertCount}
              </span>
            )}
            <span className="hidden xl:inline">Alertas</span>
          </button>

          {/* Affordability simulator trigger (desktop/tablet) */}
          <button
            id="btn-open-affordability"
            onClick={() => setIsAffordabilityOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700/60 transition cursor-pointer"
            title="Analizador financiero: ¿Puedo pagarlo sin arriesgar liquidez?"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">¿Puedo pagarlo?</span>
            <span className="md:hidden">Simular</span>
          </button>

          {/* Render.com deployment guide (desktop) */}
          <button
            id="btn-open-render-guide"
            onClick={() => setIsRenderGuideOpen(true)}
            className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-sky-300 border border-sky-500/30 transition cursor-pointer"
            title="Guía de despliegue para Render.com"
          >
            <Server className="w-3.5 h-3.5 text-sky-400" />
            <span>Render</span>
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* + New Transaction CTA */}
          <button
            id="btn-new-transaction"
            onClick={() => setIsNewTxOpen(true)}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Nuevo movimiento</span>
            <span className="sm:hidden">Nuevo</span>
          </button>

          {/* Mobile drawer toggle button */}
          <button
            id="btn-open-mobile-menu"
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 cursor-pointer active:scale-95"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Floating Privacy Mode Notice Toast */}
      {privacyToast && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 px-4 py-2 rounded-full bg-slate-900/95 border border-amber-500/50 text-amber-300 text-xs font-bold shadow-2xl backdrop-blur-md flex items-center gap-2 pointer-events-none transition">
          <span>{privacyToast}</span>
        </div>
      )}
    </header>
  );
};
