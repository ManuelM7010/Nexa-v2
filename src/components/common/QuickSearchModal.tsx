import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Search,
  X,
  ArrowRight,
  CreditCard,
  Wallet,
  PiggyBank,
  LayoutDashboard,
  Calendar,
  FileSpreadsheet,
  Layers,
  Landmark,
  Tv,
  Zap,
  PieChart,
  ShoppingCart,
  StickyNote,
  Sparkles,
  Settings,
  ArrowLeftRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { formatMoney, formatDateEs } from '../../utils/formatters';
import { motion, AnimatePresence } from 'motion/react';

export const QuickSearchModal: React.FC = () => {
  const {
    isQuickSearchOpen,
    setIsQuickSearchOpen,
    transactions,
    accounts,
    creditCards,
    savingsAccounts,
    categories,
    setActiveTab,
    setEditingTransaction,
    setIsNewTxOpen,
    settings,
  } = useFinance();

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsQuickSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isQuickSearchOpen) {
        setIsQuickSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQuickSearchOpen, setIsQuickSearchOpen]);

  useEffect(() => {
    if (isQuickSearchOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
    }
  }, [isQuickSearchOpen]);

  // App Views / Navigation items available for search
  const searchableViews = useMemo(
    () => [
      { id: 'dashboard', label: 'Dashboard General', keywords: 'inicio balance liquidez patrimonio kpi', icon: LayoutDashboard },
      { id: 'ahorros', label: 'Ahorros & Metas', keywords: 'fondo metas ahorro simulador retiro alcancia', icon: PiggyBank },
      { id: 'flujo', label: 'Flujo Diario de Caja', keywords: 'calendario dia a dia saldos proyeccion banco', icon: ArrowLeftRight },
      { id: 'proyeccion-anual', label: 'Proyección 12 Meses', keywords: 'anual horizonte futuro meses finanzas', icon: Calendar },
      { id: 'movimientos', label: 'Movimientos & Transacciones', keywords: 'historial gastos ingresos lista auditoria', icon: ArrowLeftRight },
      { id: 'presupuesto', label: 'Presupuesto por Categorías', keywords: 'limite categoria metas gasto mensual', icon: PieChart },
      { id: 'tarjetas', label: 'Tarjetas de Crédito', keywords: 'tarjeta limite corte pago disponible visa mastercard', icon: CreditCard },
      { id: 'estados-cuenta', label: 'Estados de Cuenta TDDC', keywords: 'corte mes anterior interes sin intereses saldo', icon: FileSpreadsheet },
      { id: 'cuotas', label: 'Compras a Cuotas', keywords: 'meses intereses diferido cuota restante', icon: Layers },
      { id: 'prestamos', label: 'Préstamos & Amortización', keywords: 'credito cuota banco deuda capital interes', icon: Landmark },
      { id: 'suscripciones', label: 'Suscripciones Recurrentes', keywords: 'netflix spotify streaming membresia mensual', icon: Tv },
      { id: 'servicios', label: 'Servicios Básicos', keywords: 'luz agua internet telefono electricidad', icon: Zap },
      { id: 'super', label: 'Súper & Compras', keywords: 'despensa comida supermercado lista compras', icon: ShoppingCart },
      { id: 'notas', label: 'Notas & Planes', keywords: 'borrador ideas compras futuras notas scratchpad', icon: StickyNote },
      { id: 'simulador', label: '¿Puedo pagarlo? (Simulador)', keywords: 'simulador evaluar comprar impacto liquidez', icon: Sparkles },
      { id: 'cuentas', label: 'Cuentas & Medios de Pago', keywords: 'bancos efectivo saldos iniciales billetera', icon: Wallet },
      { id: 'configuracion', label: 'Backup & Configuración', keywords: 'ajustes exportar importar reset moneda json', icon: Settings },
    ],
    []
  );

  // Filtered results
  const q = query.trim().toLowerCase();

  const matchingViews = useMemo(() => {
    if (!q) return [];
    return searchableViews.filter(
      (v) => v.label.toLowerCase().includes(q) || v.keywords.toLowerCase().includes(q)
    );
  }, [q, searchableViews]);

  const matchingTransactions = useMemo(() => {
    if (!q) return [];
    const catMap = new Map<string, string>(categories.map((c) => [c.id, c.name.toLowerCase()]));
    return transactions
      .filter((t) => {
        const conceptMatch = t.concept.toLowerCase().includes(q);
        const catName = t.categoryId ? catMap.get(t.categoryId) || '' : '';
        const catMatch = catName.includes(q);
        const amountDollars = (t.amount / 100).toFixed(2);
        const amountMatch = amountDollars.includes(q);
        const dateMatch = t.date.includes(q);
        return conceptMatch || catMatch || amountMatch || dateMatch;
      })
      .slice(0, 10);
  }, [q, transactions, categories]);

  const matchingAccounts = useMemo(() => {
    if (!q) return [];
    const matchedAccs = accounts.filter(
      (a) => a.name.toLowerCase().includes(q) || (a.bankName && a.bankName.toLowerCase().includes(q))
    );
    const matchedCards = creditCards.filter(
      (c) => c.name.toLowerCase().includes(q) || c.bank.toLowerCase().includes(q)
    );
    const matchedSavings = savingsAccounts.filter((s) => s.name.toLowerCase().includes(q));

    return { matchedAccs, matchedCards, matchedSavings };
  }, [q, accounts, creditCards, savingsAccounts]);

  const handleSelectView = (viewId: string) => {
    setActiveTab(viewId);
    setIsQuickSearchOpen(false);
  };

  const handleSelectTransaction = (tx: (typeof transactions)[0]) => {
    setEditingTransaction(tx);
    setIsNewTxOpen(true);
    setIsQuickSearchOpen(false);
  };

  if (!isQuickSearchOpen) return null;

  const totalResults =
    matchingViews.length +
    matchingTransactions.length +
    matchingAccounts.matchedAccs.length +
    matchingAccounts.matchedCards.length +
    matchingAccounts.matchedSavings.length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-20 px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsQuickSearchOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-10"
        >
          {/* Search Header Input */}
          <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-950/40">
            <Search className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar movimientos, cuentas, tarjetas, categorías o vistas..."
              className="w-full bg-transparent text-sm sm:text-base text-white placeholder:text-slate-500 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 text-slate-400 hover:text-white rounded-md mr-1.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700 rounded-md">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <div className="max-h-[65vh] overflow-y-auto p-3 space-y-4">
            {!q && (
              <div className="py-8 text-center text-slate-400">
                <Search className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-slate-300">Búsqueda rápida en NEXA</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                  Escribe un concepto (ej. "Salario", "Uber", "Super"), una tarjeta, una meta o el nombre de una vista.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4 max-w-md mx-auto">
                  {['Ahorros', 'Tarjetas', 'Presupuesto', 'Flujo Diario', 'Súper'].map((suggest) => (
                    <button
                      key={suggest}
                      onClick={() => setQuery(suggest)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60 cursor-pointer"
                    >
                      {suggest}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {q && totalResults === 0 && (
              <div className="py-8 text-center text-slate-400">
                <p className="text-sm font-semibold text-slate-300">Sin resultados para "{query}"</p>
                <p className="text-xs text-slate-500 mt-1">
                  Verifica la ortografía o intenta buscar un término más amplio.
                </p>
              </div>
            )}

            {/* Matching Views / Modules */}
            {matchingViews.length > 0 && (
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1.5">
                  Vistas & Secciones ({matchingViews.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {matchingViews.map((v) => {
                    const Icon = v.icon;
                    return (
                      <button
                        key={v.id}
                        onClick={() => handleSelectView(v.id)}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-750 text-left transition cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-white block truncate">
                            {v.label}
                          </span>
                          <span className="text-[10px] text-slate-400">Ir a módulo</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Matching Accounts & Cards */}
            {(matchingAccounts.matchedAccs.length > 0 ||
              matchingAccounts.matchedCards.length > 0 ||
              matchingAccounts.matchedSavings.length > 0) && (
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1.5">
                  Cuentas, Tarjetas & Fondos
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {matchingAccounts.matchedAccs.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => handleSelectView('cuentas')}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-750 text-left transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Wallet className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <div>
                          <span className="text-xs font-semibold text-white block">{a.name}</span>
                          <span className="text-[10px] text-slate-400">
                            {a.bankName || (a.type === 'banco' ? 'Banco' : 'Efectivo')}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-400">
                        {formatMoney(a.initialBalance, settings.currencySymbol)}
                      </span>
                    </button>
                  ))}

                  {matchingAccounts.matchedCards.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelectView('tarjetas')}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-750 text-left transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="w-4 h-4 text-sky-400 flex-shrink-0" />
                        <div>
                          <span className="text-xs font-semibold text-white block">{c.name}</span>
                          <span className="text-[10px] text-slate-400">{c.bank}</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-sky-400">
                        Lím: {formatMoney(c.limit, settings.currencySymbol)}
                      </span>
                    </button>
                  ))}

                  {matchingAccounts.matchedSavings.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectView('ahorros')}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-750 text-left transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <PiggyBank className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <div>
                          <span className="text-xs font-semibold text-white block">{s.name}</span>
                          <span className="text-[10px] text-slate-400">{s.category}</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-amber-400">
                        {formatMoney(s.currentBalance, settings.currencySymbol)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Matching Transactions */}
            {matchingTransactions.length > 0 && (
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1.5">
                  Movimientos encontrados ({matchingTransactions.length})
                </span>
                <div className="space-y-1.5">
                  {matchingTransactions.map((tx) => (
                    <button
                      key={tx.id}
                      onClick={() => handleSelectTransaction(tx)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-750 text-left transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            tx.type === 'ingreso'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-rose-500/15 text-rose-400'
                          }`}
                        >
                          {tx.type === 'ingreso' ? (
                            <TrendingUp className="w-3.5 h-3.5" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-white block truncate">
                            {tx.concept}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatDateEs(tx.date)} • {tx.paymentMethodType} • {tx.status}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 ml-2">
                        <span
                          className={`text-xs font-bold block ${
                            tx.type === 'ingreso' ? 'text-emerald-400' : 'text-slate-200'
                          }`}
                        >
                          {tx.type === 'ingreso' ? '+' : '-'}
                          {formatMoney(tx.amount, settings.currencySymbol)}
                        </span>
                        <span className="text-[9px] text-blue-400 opacity-0 group-hover:opacity-100 transition">
                          Editar ✎
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Presiona ESC para cerrar</span>
            <span>NEXA Fast Search</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
