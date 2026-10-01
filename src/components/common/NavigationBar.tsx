import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  CalendarDays,
  CreditCard,
  Layers,
  Landmark,
  Tv,
  Zap,
  BarChart3,
  Wallet,
  Settings,
  Sparkles,
  Table,
  ShoppingCart,
  StickyNote,
  LineChart,
  FileSpreadsheet,
  PiggyBank,
  ChevronLeft,
  ChevronRight,
  Keyboard,
} from 'lucide-react';

export const NavigationBar: React.FC = () => {
  const { activeTab, setActiveTab } = useFinance();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ahorros', label: 'Ahorros & Metas', icon: PiggyBank },
    { id: 'flujo', label: 'Flujo Diario', icon: BarChart3 },
    { id: 'proyeccion-anual', label: 'Proyección 12M', icon: LineChart },
    { id: 'movimientos', label: 'Movimientos', icon: ArrowLeftRight },
    { id: 'presupuesto', label: 'Presupuesto', icon: PieChart },
    { id: 'tabla-mensual', label: 'Tabla Mensual (Detalle)', icon: Table },
    { id: 'super', label: 'Súper (Compras)', icon: ShoppingCart },
    { id: 'notas', label: 'Notas & Planes', icon: StickyNote },
    { id: 'tarjetas', label: 'Tarjetas', icon: CreditCard },
    { id: 'estados-cuenta', label: 'Estados de Cuenta (TDDC)', icon: FileSpreadsheet },
    { id: 'cuotas', label: 'Compras a Cuotas', icon: Layers },
    { id: 'prestamos', label: 'Préstamos', icon: Landmark },
    { id: 'suscripciones', label: 'Suscripciones', icon: Tv },
    { id: 'servicios', label: 'Servicios', icon: Zap },
    { id: 'calendario', label: 'Calendario', icon: CalendarDays },
    { id: 'cuentas', label: 'Cuentas & Medios', icon: Wallet },
    { id: 'reportes', label: 'Análisis & Cierre', icon: BarChart3 },
    { id: 'simulador', label: '¿Puedo pagarlo?', icon: Sparkles },
    { id: 'configuracion', label: 'Backup & Config', icon: Settings },
  ];

  // Update left/right scrollability indicators
  const checkScrollability = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  }, []);

  useEffect(() => {
    checkScrollability();
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, [checkScrollability]);

  // Ensure active tab is smoothly scrolled into view when changed
  useEffect(() => {
    const activeEl = document.getElementById(`nav-tab-${activeTab}`);
    if (activeEl && scrollRef.current) {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
      setTimeout(checkScrollability, 350);
    }
  }, [activeTab, checkScrollability]);

  // Carousel scroll by distance
  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const offset = direction === 'left' ? -320 : 320;
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    setTimeout(checkScrollability, 300);
  };

  // Navigate module by module (Previous / Next)
  const goToNextModule = useCallback(() => {
    const currentIndex = navItems.findIndex((item) => item.id === activeTab);
    const nextIndex = currentIndex < navItems.length - 1 ? currentIndex + 1 : 0;
    setActiveTab(navItems[nextIndex].id);
  }, [activeTab, navItems, setActiveTab]);

  const goToPrevModule = useCallback(() => {
    const currentIndex = navItems.findIndex((item) => item.id === activeTab);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : navItems.length - 1;
    setActiveTab(navItems[prevIndex].id);
  }, [activeTab, navItems, setActiveTab]);

  // Global keyboard shortcuts: Alt + ArrowLeft / Alt + ArrowRight
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in form controls
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevModule();
      } else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        goToNextModule();
      } else if (!isInput && document.activeElement?.closest('#main-nav-bar')) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          goToPrevModule();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          goToNextModule();
        } else if (e.key === 'Home') {
          e.preventDefault();
          setActiveTab(navItems[0].id);
        } else if (e.key === 'End') {
          e.preventDefault();
          setActiveTab(navItems[navItems.length - 1].id);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [goToPrevModule, goToNextModule, navItems, setActiveTab]);

  // Mouse wheel conversion (vertical wheel -> horizontal scroll)
  const handleWheel = (e: React.WheelEvent) => {
    if (scrollRef.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      scrollRef.current.scrollLeft += e.deltaY;
      checkScrollability();
    }
  };

  return (
    <nav
      id="main-nav-bar"
      aria-label="Barra de módulos"
      className="hidden md:block w-full bg-slate-950/95 border-b border-slate-800/80 px-2 sm:px-4 backdrop-blur-md sticky top-0 z-40 select-none"
    >
      <div className="max-w-7xl mx-auto flex items-center gap-1.5 py-1.5 relative">
        {/* Left Carousel Arrow Button */}
        <button
          type="button"
          onClick={() => handleScroll('left')}
          disabled={!canScrollLeft}
          aria-label="Desplazar módulos a la izquierda"
          title="Desplazar a la izquierda (o usa Alt + ← para el módulo anterior)"
          className={`p-1.5 rounded-xl border transition-all flex items-center justify-center shrink-0 z-20 ${
            canScrollLeft
              ? 'bg-slate-900 border-slate-700/80 text-slate-200 hover:text-white hover:bg-slate-800 hover:border-blue-500/50 shadow-md cursor-pointer active:scale-95'
              : 'bg-slate-950/60 border-slate-800/30 text-slate-700 opacity-30 cursor-not-allowed'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Left Fade Gradient Mask */}
        {canScrollLeft && (
          <div className="pointer-events-none absolute left-8 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-950 to-transparent z-10" />
        )}

        {/* Scrollable Tabs Track */}
        <div
          ref={scrollRef}
          onScroll={checkScrollability}
          onWheel={handleWheel}
          tabIndex={0}
          role="tablist"
          aria-orientation="horizontal"
          className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-none py-1 scroll-smooth focus:outline-none"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                role="tab"
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex-shrink-0 ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/40 shadow-sm shadow-blue-500/10 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 transition-colors ${
                    isActive ? 'text-blue-400' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Fade Gradient Mask */}
        {canScrollRight && (
          <div className="pointer-events-none absolute right-12 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-950 to-transparent z-10" />
        )}

        {/* Right Controls: Arrow Button & Keyboard Shortcut Hint */}
        <div className="flex items-center gap-1.5 shrink-0 z-20">
          <button
            type="button"
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            aria-label="Desplazar módulos a la derecha"
            title="Desplazar a la derecha (o usa Alt + → para el módulo siguiente)"
            className={`p-1.5 rounded-xl border transition-all flex items-center justify-center shrink-0 ${
              canScrollRight
                ? 'bg-slate-900 border-slate-700/80 text-slate-200 hover:text-white hover:bg-slate-800 hover:border-blue-500/50 shadow-md cursor-pointer active:scale-95'
                : 'bg-slate-950/60 border-slate-800/30 text-slate-700 opacity-30 cursor-not-allowed'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span
            className="hidden xl:inline-flex items-center gap-1 text-[10px] text-slate-400 font-mono px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 select-none"
            title="Usa Alt + Flecha Izquierda / Derecha para cambiar de módulo directamente desde el teclado"
          >
            <Keyboard className="w-3 h-3 text-blue-400" />
            <span>Alt + ← / →</span>
          </span>
        </div>
      </div>
    </nav>
  );
};
