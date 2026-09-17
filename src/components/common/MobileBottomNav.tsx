import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  LayoutDashboard,
  PiggyBank,
  BarChart3,
  ArrowLeftRight,
  Menu,
  Plus,
  X,
  Sparkles,
  TrendingDown,
  TrendingUp,
  CreditCard,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const MobileBottomNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setIsNewTxOpen,
    setIsMobileMenuOpen,
    setIsAffordabilityOpen,
    setEditingTransaction,
    todayStr,
  } = useFinance();

  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);

  const mainNavItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'ahorros', label: 'Ahorros', icon: PiggyBank },
    // Center is the Floating Plus button
    { id: 'flujo', label: 'Flujo', icon: BarChart3 },
    { id: 'movimientos', label: 'Movs', icon: ArrowLeftRight },
  ];

  const handleQuickAction = (actionType: 'gasto' | 'ingreso' | 'aporte' | 'simulador') => {
    setIsFabMenuOpen(false);
    if (actionType === 'simulador') {
      setIsAffordabilityOpen(true);
      return;
    }

    if (actionType === 'aporte') {
      setActiveTab('ahorros');
      setIsNewTxOpen(true);
      return;
    }

    setEditingTransaction(null);
    setIsNewTxOpen(true);
  };

  return (
    <>
      {/* Floating Speed-Dial Backdrop & Menu */}
      <AnimatePresence>
        {isFabMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFabMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.92 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="fixed bottom-22 left-4 right-4 bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 shadow-2xl z-50 md:hidden max-w-sm mx-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Acción Rápida
                </span>
                <button
                  onClick={() => setIsFabMenuOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  id="mobile-quick-expense-btn"
                  onClick={() => handleQuickAction('gasto')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 active:scale-95 transition cursor-pointer text-center"
                >
                  <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mb-1.5 text-rose-400">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-white">Nuevo Gasto</span>
                  <span className="text-[10px] text-slate-400">Salida o compra</span>
                </button>

                <button
                  id="mobile-quick-income-btn"
                  onClick={() => handleQuickAction('ingreso')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 active:scale-95 transition cursor-pointer text-center"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-1.5 text-emerald-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-white">Nuevo Ingreso</span>
                  <span className="text-[10px] text-slate-400">Salario o cobro</span>
                </button>

                <button
                  id="mobile-quick-savings-btn"
                  onClick={() => handleQuickAction('aporte')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 active:scale-95 transition cursor-pointer text-center"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-1.5 text-amber-400">
                    <PiggyBank className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-white">Aporte a Ahorro</span>
                  <span className="text-[10px] text-slate-400">Guardar a meta</span>
                </button>

                <button
                  id="mobile-quick-afford-btn"
                  onClick={() => handleQuickAction('simulador')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 active:scale-95 transition cursor-pointer text-center"
                >
                  <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center mb-1.5 text-sky-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-white">¿Puedo pagarlo?</span>
                  <span className="text-[10px] text-slate-400">Simulador de compra</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Bottom Sticky Bar */}
      <nav
        id="mobile-bottom-nav"
        className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/90 px-2 py-1.5 shadow-[0_-8px_20px_rgba(0,0,0,0.5)]"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
      >
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {/* Tab 1: Inicio */}
          <button
            id="mobile-nav-dashboard"
            onClick={() => {
              setActiveTab('dashboard');
              setIsFabMenuOpen(false);
            }}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer min-w-[54px] ${
              activeTab === 'dashboard'
                ? 'text-blue-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Inicio</span>
            {activeTab === 'dashboard' && (
              <span className="w-1 h-1 bg-blue-500 rounded-full mt-0.5" />
            )}
          </button>

          {/* Tab 2: Ahorros */}
          <button
            id="mobile-nav-ahorros"
            onClick={() => {
              setActiveTab('ahorros');
              setIsFabMenuOpen(false);
            }}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer min-w-[54px] ${
              activeTab === 'ahorros'
                ? 'text-blue-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PiggyBank className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Ahorros</span>
            {activeTab === 'ahorros' && (
              <span className="w-1 h-1 bg-blue-500 rounded-full mt-0.5" />
            )}
          </button>

          {/* Center: Prominent Action Button (+) */}
          <div className="relative -top-3 flex items-center justify-center">
            <button
              id="mobile-nav-fab"
              onClick={() => setIsFabMenuOpen((prev) => !prev)}
              aria-label="Nuevo movimiento"
              className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white shadow-lg shadow-blue-600/40 flex items-center justify-center border-2 border-slate-950 active:scale-90 transition-transform cursor-pointer"
            >
              <motion.div
                animate={{ rotate: isFabMenuOpen ? 45 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </motion.div>
            </button>
          </div>

          {/* Tab 3: Flujo */}
          <button
            id="mobile-nav-flujo"
            onClick={() => {
              setActiveTab('flujo');
              setIsFabMenuOpen(false);
            }}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer min-w-[54px] ${
              activeTab === 'flujo'
                ? 'text-blue-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Flujo</span>
            {activeTab === 'flujo' && (
              <span className="w-1 h-1 bg-blue-500 rounded-full mt-0.5" />
            )}
          </button>

          {/* Tab 4: Más (Drawer Menu) */}
          <button
            id="mobile-nav-more"
            onClick={() => {
              setIsMobileMenuOpen(true);
              setIsFabMenuOpen(false);
            }}
            className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer min-w-[54px] text-slate-400 hover:text-slate-200"
          >
            <Menu className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Más</span>
          </button>
        </div>
      </nav>
    </>
  );
};
