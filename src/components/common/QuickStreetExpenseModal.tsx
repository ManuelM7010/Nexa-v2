import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatMoney, dollarsToCents, getTodayDateStr } from '../../utils/formatters';
import {
  X,
  Zap,
  Coffee,
  Fuel,
  Utensils,
  ShoppingCart,
  Pill,
  Car,
  Store,
  Check,
  CreditCard as CardIcon,
  Banknote,
  Landmark,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuickPreset {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  categoryKeywords: string[];
}

const QUICK_PRESETS: QuickPreset[] = [
  { label: 'Comida / Almuerzo', icon: Utensils, categoryKeywords: ['alimentacion', 'comida', 'restaurante', 'almuerzo'] },
  { label: 'Café / Snack', icon: Coffee, categoryKeywords: ['cafe', 'snack', 'alimentacion', 'gustos'] },
  { label: 'Gasolina', icon: Fuel, categoryKeywords: ['transporte', 'gasolina', 'combustible', 'auto'] },
  { label: 'Supermercado', icon: ShoppingCart, categoryKeywords: ['supermercado', 'mercado', 'despensa', 'compras'] },
  { label: 'Transporte / Uber', icon: Car, categoryKeywords: ['transporte', 'uber', 'taxi', 'pasaje'] },
  { label: 'Farmacia / Salud', icon: Pill, categoryKeywords: ['salud', 'farmacia', 'medicina'] },
  { label: 'Tienda / Varios', icon: Store, categoryKeywords: ['varios', 'hogar', 'compras'] },
];

interface QuickStreetExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFullModal: () => void;
}

export const QuickStreetExpenseModal: React.FC<QuickStreetExpenseModalProps> = ({
  isOpen,
  onClose,
  onOpenFullModal,
}) => {
  const {
    saveTransaction,
    accounts,
    creditCards,
    categories,
    settings,
    todayStr,
  } = useFinance();

  const [amountStr, setAmountStr] = useState('');
  const [selectedConcept, setSelectedConcept] = useState('Comida / Almuerzo');
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'banco' | 'tarjeta_credito'>('efectivo');
  const [selectedAccountId, setSelectedAccountId] = useState(
    accounts.find((a) => a.type === 'efectivo')?.id || accounts[0]?.id || ''
  );
  const [selectedCardId, setSelectedCardId] = useState(creditCards[0]?.id || '');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const parsedCents = dollarsToCents(amountStr || 0);

  const addAmount = (increment: number) => {
    const current = parseFloat(amountStr || '0') || 0;
    const next = (current + increment).toFixed(2);
    setAmountStr(next);
  };

  const clearAmount = () => {
    setAmountStr('');
  };

  const handleQuickSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedCents <= 0) return;

    // Find closest category matching selectedConcept keywords
    const preset = QUICK_PRESETS.find((p) => p.label === selectedConcept);
    let matchedCatId = '';
    if (preset) {
      const found = categories.find((c) =>
        c.type === 'gasto' &&
        preset.categoryKeywords.some((kw) => c.name.toLowerCase().includes(kw))
      );
      if (found) matchedCatId = found.id;
    }
    if (!matchedCatId) {
      const defaultExpenseCat = categories.find((c) => c.type === 'gasto');
      if (defaultExpenseCat) matchedCatId = defaultExpenseCat.id;
    }

    await saveTransaction({
      concept: selectedConcept,
      amount: parsedCents,
      date: todayStr || getTodayDateStr(),
      type: 'gasto',
      categoryId: matchedCatId || undefined,
      paymentMethodType: paymentMethod,
      accountId: paymentMethod === 'tarjeta_credito' ? undefined : selectedAccountId,
      creditCardId: paymentMethod === 'tarjeta_credito' ? selectedCardId : undefined,
      status: 'planificado',
      notes: 'Registrado desde botón de gasto rápido de calle (5s)',
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setAmountStr('');
      onClose();
    }, 900);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0"
        />

        {/* Bottom Sheet / Modal Card */}
        <motion.div
          initial={{ y: 250, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 250, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="relative w-full max-w-lg bg-slate-900 border-t sm:border border-slate-700/80 rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 text-slate-100 z-10 max-h-[92vh] flex flex-col"
        >
          {/* Mobile Drag Indicator Handle */}
          <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto mb-3 sm:hidden cursor-grab" />

          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  Gasto Rápido de Calle
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                    5 seg
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Registra compras del día antes de que las olvides
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleQuickSave} className="space-y-4 mt-3 overflow-y-auto pr-1">
            {/* Amount Display and input */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Monto del Gasto
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">
                  {settings.currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  autoFocus
                  placeholder="0.00"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  className="w-full pl-10 pr-16 py-3 rounded-2xl bg-slate-950 border-2 border-slate-700/90 text-2xl font-mono font-black text-white text-center focus:border-blue-500 focus:outline-none"
                />
                {amountStr && (
                  <button
                    type="button"
                    onClick={clearAmount}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg bg-slate-800 text-xs text-slate-400 hover:text-white"
                  >
                    Borrar
                  </button>
                )}
              </div>

              {/* Quick increment pills for one-thumb entry */}
              <div className="flex items-center justify-between gap-1.5 pt-1">
                {[1, 5, 10, 20, 50].map((inc) => (
                  <button
                    key={inc}
                    type="button"
                    onClick={() => addAmount(inc)}
                    className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold border border-slate-700/70 active:scale-95 transition cursor-pointer"
                  >
                    +{settings.currencySymbol}{inc}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Categories with Icons */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                ¿En qué lo gastaste?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {QUICK_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const isSelected = selectedConcept === preset.label;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setSelectedConcept(preset.label)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition active:scale-95 cursor-pointer text-left ${
                        isSelected
                          ? 'bg-blue-600/25 border-blue-500 text-white shadow-sm shadow-blue-500/20'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                      <span className="truncate">{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                ¿Cómo lo pagaste?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {/* Cash */}
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('efectivo');
                    const cashAcc = accounts.find((a) => a.type === 'efectivo') || accounts[0];
                    if (cashAcc) setSelectedAccountId(cashAcc.id);
                  }}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition active:scale-95 cursor-pointer ${
                    paymentMethod === 'efectivo'
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Banknote className="w-5 h-5 mb-1" />
                  <span>Efectivo</span>
                </button>

                {/* Bank / Debit */}
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('banco');
                    const bankAcc = accounts.find((a) => a.type === 'banco') || accounts[0];
                    if (bankAcc) setSelectedAccountId(bankAcc.id);
                  }}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition active:scale-95 cursor-pointer ${
                    paymentMethod === 'banco'
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Landmark className="w-5 h-5 mb-1" />
                  <span>Banco / Débito</span>
                </button>

                {/* Credit Card */}
                <button
                  type="button"
                  disabled={creditCards.length === 0}
                  onClick={() => {
                    setPaymentMethod('tarjeta_credito');
                    if (creditCards[0]) setSelectedCardId(creditCards[0].id);
                  }}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition active:scale-95 cursor-pointer disabled:opacity-40 ${
                    paymentMethod === 'tarjeta_credito'
                      ? 'bg-rose-600/20 border-rose-500 text-rose-300'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CardIcon className="w-5 h-5 mb-1" />
                  <span>Tarjeta</span>
                </button>
              </div>

              {/* Sub-account selection if multiple */}
              {paymentMethod === 'tarjeta_credito' && creditCards.length > 1 && (
                <div className="pt-1">
                  <select
                    value={selectedCardId}
                    onChange={(e) => setSelectedCardId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  >
                    {creditCards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Disp: {formatMoney(Math.max(0, c.limit - c.initialUsedBalance), settings.currencySymbol)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {paymentMethod !== 'tarjeta_credito' && accounts.length > 1 && (
                <div className="pt-1">
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatMoney(a.initialBalance, settings.currencySymbol)})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={parsedCents <= 0 || isSuccess}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-40 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-98 transition cursor-pointer"
              >
                {isSuccess ? (
                  <>
                    <Check className="w-5 h-5 text-white animate-bounce" />
                    <span>¡Gasto Registrado con Éxito!</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 text-white" />
                    <span>
                      Registrar {parsedCents > 0 ? formatMoney(parsedCents, settings.currencySymbol) : 'Gasto'}
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFullModal();
                }}
                className="w-full py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>¿Necesitas cuotas, fecha distinta o recurrencia? Formulario Completo</span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
