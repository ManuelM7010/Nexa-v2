import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { PWAInstallButton } from './PWAInstallButton';
import { BrandLogo } from './BrandLogo';
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
  ArrowLeftRight,
  Sun,
  Moon,
  Calculator,
  RotateCcw,
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
    activeTab,
    setActiveTab,
    settings,
    toggleTheme,
    isCalculatorOpen,
    toggleCalculator,
    undoStack,
    performUndo,
    lastUndo,
  } = useFinance();

  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [privacyToast, setPrivacyToast] = useState<string | null>(null);
  const [themeToast, setThemeToast] = useState<string | null>(null);

  const handleToggleTheme = async () => {
    const isCurrentlyDark = settings.theme !== 'fintech-light';
    await toggleTheme();
    setThemeToast(
      isCurrentlyDark
        ? '☀️ Modo Claro ACTIVADO: Paleta luminosa y de alto contraste'
        : '🌙 Modo Oscuro ACTIVADO: Paleta oscura para baja fatiga visual'
    );
    setTimeout(() => {
      setThemeToast(null);
    }, 2200);
  };

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
          <BrandLogo size="md" />

          {isOnline ? (
            <span
              title="Modo local-first sincronizado"
              className="hidden xl:inline-flex text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 items-center gap-1 flex-shrink-0"
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

        {/* Center: Today's date banner (hidden on small mobile to give room to actions) */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-900/90 border border-slate-800/80 px-3 py-1.5 rounded-xl">
          <Calendar className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          <span className="text-xs text-slate-400 font-medium">Hoy:</span>
          <span className="text-xs font-semibold text-white">
            {formatDateEs(todayStr, { withDayName: true, withYear: true })}
          </span>
        </div>

        {/* Right: Quick actions organized in clean visual clusters */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Cluster 1: Productivity & System Tools (Desktop unified segmented bar) */}
          <div className="hidden md:flex items-center gap-0.5 bg-slate-900/90 border border-slate-800/80 rounded-2xl p-1 shadow-sm">
            {/* Universal Quick Search button */}
            <button
              id="btn-header-search"
              onClick={() => setIsQuickSearchOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium cursor-pointer transition active:scale-95"
              title="Búsqueda rápida (Ctrl+K o Cmd+K)"
            >
              <Search className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden xl:inline">Buscar</span>
              <kbd className="hidden 2xl:inline-block px-1.5 py-0.2 text-[9px] font-mono text-slate-400 bg-slate-800/80 border border-slate-700/60 rounded">
                ⌘K
              </kbd>
            </button>

            {/* Global Quick Calculator button */}
            <button
              id="btn-header-calculator"
              data-calculator-trigger="true"
              onClick={toggleCalculator}
              className={`p-1.5 rounded-xl text-xs font-semibold cursor-pointer transition active:scale-95 ${
                isCalculatorOpen
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'hover:bg-slate-800 text-slate-400 hover:text-amber-400'
              }`}
              title="Calculadora rápida de movimientos"
            >
              <Calculator className="w-4 h-4" />
            </button>

            {/* Privacy Camouflage Mode toggle */}
            <button
              id="btn-header-privacy"
              onClick={handleTogglePrivacy}
              className={`p-1.5 rounded-xl text-xs font-semibold cursor-pointer transition active:scale-95 ${
                isPrivacyMode
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title={
                isPrivacyMode
                  ? 'Modo Privacidad Activo: Los saldos están difuminados. Haz clic para mostrarlos.'
                  : 'Activar Modo Privacidad (ocultar saldos en público)'
              }
            >
              {isPrivacyMode ? (
                <EyeOff className="w-4 h-4 text-amber-400" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>

            {/* Financial Alerts Bell */}
            <button
              id="btn-header-alerts"
              onClick={() => setIsAlertsOpen(true)}
              className="relative p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-medium cursor-pointer transition active:scale-95 flex items-center"
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
                  className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center text-white ring-2 ring-slate-900 ${
                    hasDangerAlerts ? 'bg-rose-500' : 'bg-amber-500'
                  }`}
                >
                  {alertCount}
                </span>
              )}
            </button>
          </div>

          {/* Quick Mobile Search Button (Compact on phone) */}
          <button
            id="btn-header-search-mobile"
            onClick={() => setIsQuickSearchOpen(true)}
            className="md:hidden p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white active:scale-95 transition cursor-pointer"
            title="Buscar movimiento (Ctrl+K)"
          >
            <Search className="w-4 h-4 text-sky-400" />
          </button>

          {/* Global Undo (Deshacer) button - prominent when undo is available */}
          {undoStack.length > 0 && (
            <button
              id="btn-header-undo"
              onClick={performUndo}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/50 shadow-md shadow-blue-500/10 ring-1 ring-blue-500/30 text-xs font-semibold cursor-pointer transition active:scale-95 animate-pulse"
              title={`Deshacer: ${lastUndo?.description || 'última acción'} (Ctrl+Z)`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Deshacer</span>
              <span className="w-4 h-4 rounded-full bg-blue-500 text-[9px] font-bold text-white flex items-center justify-center shrink-0">
                {undoStack.length}
              </span>
            </button>
          )}

          {/* Light / Dark Mode Toggle */}
          <button
            id="btn-header-theme"
            onClick={handleToggleTheme}
            className={`flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl border text-xs font-semibold cursor-pointer transition active:scale-95 ${
              settings.theme === 'fintech-light'
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850'
            }`}
            title={
              settings.theme === 'fintech-light'
                ? 'Modo Claro activo. Clic para cambiar a Modo Oscuro'
                : 'Modo Oscuro activo. Clic para cambiar a Modo Claro'
            }
          >
            {settings.theme === 'fintech-light' ? (
              <Sun className="w-4 h-4 text-amber-500 fill-amber-500/20" />
            ) : (
              <Moon className="w-4 h-4 text-sky-400" />
            )}
            <span className="hidden xl:inline">
              {settings.theme === 'fintech-light' ? 'Claro' : 'Oscuro'}
            </span>
          </button>

          {/* Affordability simulator trigger (desktop/tablet) */}
          <button
            id="btn-open-affordability"
            onClick={() => setIsAffordabilityOpen(true)}
            className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-800 transition cursor-pointer"
            title="Analizador financiero: ¿Puedo pagarlo sin arriesgar liquidez?"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline">¿Puedo pagarlo?</span>
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* + New Transaction Primary CTA */}
          <button
            id="btn-new-transaction"
            onClick={() => setIsNewTxOpen(true)}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition cursor-pointer whitespace-nowrap"
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
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 px-4 py-2 rounded-full bg-slate-900/95 border border-amber-500/50 text-amber-300 text-xs font-bold shadow-2xl backdrop-blur-md flex items-center gap-2 pointer-events-none transition animate-in fade-in slide-in-from-top-2">
          <span>{privacyToast}</span>
        </div>
      )}

      {/* Floating Theme Change Toast */}
      {themeToast && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 px-4 py-2 rounded-full bg-slate-900/95 border border-blue-500/50 text-blue-300 text-xs font-bold shadow-2xl backdrop-blur-md flex items-center gap-2 pointer-events-none transition animate-in fade-in slide-in-from-top-2">
          <span>{themeToast}</span>
        </div>
      )}
    </header>
  );
};
