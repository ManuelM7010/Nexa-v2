import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Subscription } from '../../types';
import { formatMoney, dollarsToCents, centsToDollars, formatDateEs, daysInMonth } from '../../utils/formatters';
import {
  Tv,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit2,
  Calendar,
  CreditCard,
  Building2,
  Clock,
  Tag,
  RotateCcw,
} from 'lucide-react';
import { CalculatorButton } from '../common/CalculatorButton';
import { NewCategoryModal } from '../common/NewCategoryModal';

export const SubscriptionsView: React.FC = () => {
  const {
    subscriptions,
    creditCards,
    accounts,
    categories,
    saveSubscription,
    deleteSubscription,
    toggleSubscriptionMonthlyPause,
    updateSubscriptionMonthlyException,
    selectedYear,
    selectedMonth,
    settings,
  } = useFinance();

  const currentMonthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const liquidityStart = settings.liquidityStartDate || '2026-09-15';
  const isPriorToStartMonth = currentMonthKey < liquidityStart.slice(0, 7);

  const getDefaultSubDate = (billingDay: number) => {
    const maxD = daysInMonth(selectedYear, selectedMonth);
    const day = Math.min(Math.max(1, billingDay || 15), maxD);
    return `${currentMonthKey}-${String(day).padStart(2, '0')}`;
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);

  // Form state
  const [concept, setConcept] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [billingDay, setBillingDay] = useState(15);
  const [monthOverrideDateStr, setMonthOverrideDateStr] = useState('');
  const [paymentMethodType, setPaymentMethodType] = useState<'tarjeta_credito' | 'banco' | 'efectivo'>('tarjeta_credito');
  const [creditCardId, setCreditCardId] = useState(creditCards[0]?.id || '');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [categoryId, setCategoryId] = useState('cat_suscripciones');
  const [isIndefinite, setIsIndefinite] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');

  // Inline quick override state for current month (date + amount)
  const [editingMonthSubId, setEditingMonthSubId] = useState<string | null>(null);
  const [overrideAmountStr, setOverrideAmountStr] = useState('');
  const [overrideDateStr, setOverrideDateStr] = useState('');

  const openNewModal = () => {
    setEditingSub(null);
    setConcept('');
    setAmountStr('');
    setBillingDay(15);
    setMonthOverrideDateStr('');
    setPaymentMethodType('tarjeta_credito');
    setCreditCardId(creditCards[0]?.id || '');
    setAccountId(accounts.find((a) => a.type === 'banco')?.id || accounts[0]?.id || '');
    setCategoryId('cat_suscripciones');
    setIsIndefinite(true);
    setStartDate('');
    setEndDate('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (sub: Subscription) => {
    setEditingSub(sub);
    setConcept(sub.concept);
    setAmountStr(centsToDollars(sub.amount).toFixed(2));
    setBillingDay(sub.billingDay);
    const ex = sub.monthlyExceptions?.[currentMonthKey];
    setMonthOverrideDateStr(ex?.overrideDate || '');
    const method = sub.paymentMethodType || 'tarjeta_credito';
    setPaymentMethodType(method);
    const validCard =
      (sub.creditCardId && creditCards.some((c) => c.id === sub.creditCardId) ? sub.creditCardId : '') ||
      creditCards[0]?.id ||
      '';
    setCreditCardId(validCard);
    const matchingAccs = accounts.filter((a) =>
      method === 'efectivo' ? a.type === 'efectivo' : a.type === 'banco'
    );
    const validAcc =
      (sub.accountId && accounts.some((a) => a.id === sub.accountId) ? sub.accountId : '') ||
      matchingAccs[0]?.id ||
      accounts[0]?.id ||
      '';
    setAccountId(validAcc);
    setCategoryId(sub.categoryId);
    setIsIndefinite(sub.isIndefinite !== false);
    setStartDate(sub.startDate || '');
    setEndDate(sub.endDate || '');
    setNotes(sub.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim() || !amountStr) return;

    const existingExceptions = editingSub?.monthlyExceptions ? { ...editingSub.monthlyExceptions } : undefined;
    if (editingSub && existingExceptions !== undefined) {
      const defDate = getDefaultSubDate(billingDay);
      const prevEx = existingExceptions[currentMonthKey];
      if (monthOverrideDateStr && monthOverrideDateStr !== defDate) {
        existingExceptions[currentMonthKey] = {
          ...prevEx,
          overrideDate: monthOverrideDateStr,
        };
      } else if (prevEx) {
        existingExceptions[currentMonthKey] = {
          ...prevEx,
          overrideDate: undefined,
        };
      }
    }

    await saveSubscription({
      id: editingSub?.id,
      concept: concept.trim(),
      amount: dollarsToCents(amountStr),
      billingDay,
      paymentMethodType,
      creditCardId: paymentMethodType === 'tarjeta_credito' ? creditCardId : undefined,
      accountId: paymentMethodType === 'banco' || paymentMethodType === 'efectivo' ? accountId : undefined,
      categoryId,
      isIndefinite,
      startDate: !isIndefinite && startDate ? startDate : undefined,
      endDate: !isIndefinite && endDate ? endDate : undefined,
      monthlyExceptions: existingExceptions,
      notes: notes.trim() || undefined,
    });

    setIsModalOpen(false);
  };

  const handleSaveMonthOverride = async (sub: Subscription) => {
    const defDate = getDefaultSubDate(sub.billingDay);
    const parsedCents = dollarsToCents(overrideAmountStr || 0);
    const nextAmount = parsedCents > 0 && parsedCents !== sub.amount ? parsedCents : undefined;
    const nextDate = overrideDateStr && overrideDateStr !== defDate ? overrideDateStr : undefined;

    await updateSubscriptionMonthlyException(sub.id, currentMonthKey, {
      paused: false,
      overrideAmount: nextAmount,
      overrideDate: nextDate,
    });
    setEditingMonthSubId(null);
    setOverrideAmountStr('');
    setOverrideDateStr('');
  };

  const handleResetMonthOverride = async (sub: Subscription) => {
    await updateSubscriptionMonthlyException(sub.id, currentMonthKey, {
      paused: false,
      overrideAmount: undefined,
      overrideDate: undefined,
    });
    setEditingMonthSubId(null);
    setOverrideAmountStr('');
    setOverrideDateStr('');
  };

  // Calculate monthly total and annual projected
  const activeMonthlyTotal = isPriorToStartMonth
    ? 0
    : subscriptions.reduce((acc, s) => {
        const ex = s.monthlyExceptions?.[currentMonthKey];
        const isPaused = ex?.paused || s.status !== 'activa';
        if (isPaused) return acc;
        return acc + (ex?.overrideAmount !== undefined ? ex.overrideAmount : s.amount);
      }, 0);

  const annualProjected = (isPriorToStartMonth
    ? subscriptions.reduce((acc, s) => (s.status === 'activa' ? acc + s.amount : acc), 0)
    : activeMonthlyTotal) * 12;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Tv className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-white">Suscripciones Digitales & Recurrentes</h2>
          </div>
          <p className="text-xs text-slate-400">
            Control de cargos fijos mensuales con posibilidad de pausar en meses específicos
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <CalculatorButton label="Calculadora" title="Abrir calculadora rápida de suscripciones" />

          <button
            onClick={openNewModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white shadow-md shadow-blue-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Suscripción</span>
          </button>
        </div>
      </div>

      {/* Notice if prior to start */}
      {isPriorToStartMonth && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs">
          <Clock className="w-5 h-5 flex-shrink-0 text-amber-400" />
          <div>
            <p className="font-bold text-amber-200">
              Mes anterior a la fecha oficial de inicio de liquidez ({formatDateEs(liquidityStart, { withYear: true })})
            </p>
            <p className="text-amber-300/80 mt-0.5">
              Las suscripciones no generan cobros en cuenta ni afectan los estados de cuenta en meses anteriores al inicio oficial de tu sistema.
            </p>
          </div>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
          <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">
            Costo en este Mes ({currentMonthKey})
          </span>
          <div className="text-2xl font-black text-purple-400">
            {formatMoney(activeMonthlyTotal, settings.currencySymbol)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Considera pausas activas para este mes
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
          <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">
            Costo Anual Proyectado
          </span>
          <div className="text-2xl font-black text-white">
            {formatMoney(annualProjected, settings.currencySymbol)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Proyección a 12 meses manteniendo las suscripciones actuales
          </p>
        </div>
      </div>

      {/* Subscriptions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subscriptions.map((sub) => {
          const ex = sub.monthlyExceptions?.[currentMonthKey];
          const isPausedThisMonth = ex?.paused;
          const card = creditCards.find((c) => c.id === sub.creditCardId);
          const acc = accounts.find((a) => a.id === sub.accountId);
          const defaultDate = getDefaultSubDate(sub.billingDay);
          const effectiveDate = ex?.overrideDate || defaultDate;
          const hasCustomDate = Boolean(ex?.overrideDate && ex.overrideDate !== defaultDate);
          const effectiveAmount = !isPausedThisMonth && ex?.overrideAmount !== undefined ? ex.overrideAmount : sub.amount;
          const hasCustomAmount = Boolean(!isPausedThisMonth && ex?.overrideAmount !== undefined && ex.overrideAmount !== sub.amount);
          const isEditingThisMonth = editingMonthSubId === sub.id;

          return (
            <div
              key={sub.id}
              className={`rounded-2xl border p-4.5 space-y-3 transition ${
                isPausedThisMonth
                  ? 'bg-slate-950/40 border-slate-800/50 opacity-70'
                  : 'bg-slate-900 border-slate-800 shadow-xl'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{sub.concept}</span>
                      {isPausedThisMonth && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          Pausada este mes
                        </span>
                      )}
                    </h3>
                    {sub.isIndefinite !== false ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                        ♾️ Indefinido
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/15 text-purple-300 border border-purple-500/20">
                        📅 {sub.startDate ? sub.startDate.slice(5) : 'Inicio'} a {sub.endDate ? sub.endDate.slice(5) : 'Fin'}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    {sub.paymentMethodType === 'tarjeta_credito' ? (
                      <>
                        <CreditCard className="w-3.5 h-3.5 text-rose-400" />
                        <span>{card ? card.name : 'Tarjeta'}</span>
                      </>
                    ) : (
                      <>
                        <Building2 className="w-3.5 h-3.5 text-blue-400" />
                        <span>{acc ? acc.name : sub.paymentMethodType === 'efectivo' ? 'Efectivo' : 'Banco'}</span>
                      </>
                    )}
                    {(() => {
                      const cat = categories.find((c) => c.id === sub.categoryId);
                      return cat ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-purple-300 border border-slate-700/60 ml-1">
                          <Tag className="w-2.5 h-2.5 text-purple-400" />
                          <span>{cat.name}</span>
                        </span>
                      ) : null;
                    })()}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(sub)}
                    className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                    title="Editar suscripción"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteSubscription(sub.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-400 cursor-pointer"
                    title="Eliminar suscripción"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Amount and Billing Date */}
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">
                    {hasCustomAmount ? `MONTO (${currentMonthKey})` : 'MONTO HABITUAL'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xl font-black font-mono ${
                        isPausedThisMonth ? 'line-through text-slate-500' : 'text-purple-300'
                      }`}
                    >
                      {formatMoney(effectiveAmount, settings.currencySymbol)}
                    </span>
                    {hasCustomAmount && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                        Ajustado
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-semibold">FECHA COBRO</span>
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-xs font-bold text-white">
                      {formatDateEs(effectiveDate, { withDayName: false })}
                    </span>
                    {hasCustomDate && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                        Ajustada
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Inline per-month date & amount adjustment */}
              {isEditingThisMonth ? (
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Monto ({currentMonthKey})</label>
                      <input
                        type="number"
                        step="0.01"
                        autoFocus
                        value={overrideAmountStr}
                        onChange={(e) => setOverrideAmountStr(e.target.value)}
                        className="w-full bg-slate-950 border border-purple-500/60 rounded-lg px-2 py-1 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Fecha Registro / Corte</label>
                      <input
                        type="date"
                        value={overrideDateStr}
                        onChange={(e) => setOverrideDateStr(e.target.value)}
                        className="w-full bg-slate-950 border border-purple-500/60 rounded-lg px-2 py-1 text-xs text-white"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    {(hasCustomDate || hasCustomAmount) ? (
                      <button
                        type="button"
                        onClick={() => handleResetMonthOverride(sub)}
                        className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-amber-300 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restaurar</span>
                      </button>
                    ) : (
                      <span />
                    )}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingMonthSubId(null)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] text-slate-300 font-semibold cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveMonthOverride(sub)}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded-lg text-[10px] text-white font-bold cursor-pointer"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMonthSubId(sub.id);
                      setOverrideAmountStr(centsToDollars(effectiveAmount).toFixed(2));
                      setOverrideDateStr(effectiveDate);
                    }}
                    className="w-full py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/25 transition cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    <span>Ajustar Fecha / Monto ({currentMonthKey})</span>
                  </button>

                  <button
                    onClick={() => toggleSubscriptionMonthlyPause(sub.id, currentMonthKey)}
                    className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      isPausedThisMonth
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30'
                        : 'bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {isPausedThisMonth ? (
                      <>
                        <Play className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Reanudar para {currentMonthKey}</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-3.5 h-3.5 text-amber-400" />
                        <span>Pausar solo en {currentMonthKey} ($0)</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100">
            <h3 className="text-base font-bold text-white mb-4">
              {editingSub ? 'Editar Suscripción' : 'Nueva Suscripción'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Servicio / Plataforma</label>
                <input
                  type="text"
                  required
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder="Ej. Netflix, Spotify, iCloud, Gimnasio..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Monto Mensual ({settings.currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Día Habitual (1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={billingDay}
                    onChange={(e) => setBillingDay(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-center font-bold"
                  />
                </div>
              </div>

              {editingSub && (
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-semibold text-purple-300">
                      Fecha específica en {currentMonthKey} (opcional para corte TDC)
                    </label>
                    {monthOverrideDateStr && (
                      <button
                        type="button"
                        onClick={() => setMonthOverrideDateStr('')}
                        className="text-[10px] text-slate-400 hover:text-amber-300 cursor-pointer"
                      >
                        Usar día {billingDay}
                      </button>
                    )}
                  </div>
                  <input
                    type="date"
                    value={monthOverrideDateStr || getDefaultSubDate(billingDay)}
                    onChange={(e) => setMonthOverrideDateStr(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Medio de Pago</label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethodType('tarjeta_credito');
                      if (!creditCardId || !creditCards.some((c) => c.id === creditCardId)) {
                        setCreditCardId(creditCards[0]?.id || '');
                      }
                    }}
                    className={`py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      paymentMethodType === 'tarjeta_credito'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    T. Crédito
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethodType('banco');
                      const bankAccs = accounts.filter((a) => a.type === 'banco');
                      if (bankAccs.length > 0 && !bankAccs.some((a) => a.id === accountId)) {
                        setAccountId(bankAccs[0].id);
                      } else if (!accountId && accounts[0]) {
                        setAccountId(accounts[0].id);
                      }
                    }}
                    className={`py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      paymentMethodType === 'banco'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    Cuenta Bancaria
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethodType('efectivo');
                      const cashAccs = accounts.filter((a) => a.type === 'efectivo');
                      if (cashAccs.length > 0 && !cashAccs.some((a) => a.id === accountId)) {
                        setAccountId(cashAccs[0].id);
                      } else if (!accountId && accounts[0]) {
                        setAccountId(accounts[0].id);
                      }
                    }}
                    className={`py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      paymentMethodType === 'efectivo'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    Efectivo
                  </button>
                </div>

                {paymentMethodType === 'tarjeta_credito' && (
                  <select
                    value={creditCardId}
                    onChange={(e) => setCreditCardId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    {creditCards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}

                {(paymentMethodType === 'banco' || paymentMethodType === 'efectivo') && (
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    {accounts
                      .filter((a) => (paymentMethodType === 'efectivo' ? a.type === 'efectivo' : a.type === 'banco'))
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    {accounts.filter((a) => (paymentMethodType === 'efectivo' ? a.type === 'efectivo' : a.type === 'banco')).length === 0 &&
                      accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                  </select>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-semibold text-xs">Categoría</label>
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Nueva Categoría</span>
                  </button>
                </div>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="cat_suscripciones">🔴 Suscripciones & Streaming</option>
                  {categories
                    .filter((c) => c.type === 'gasto' && c.id !== 'cat_suscripciones')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        🔴 {c.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Duración / Proyección de la Suscripción */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="block text-slate-300 font-semibold text-xs">Duración & Proyección</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsIndefinite(true)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      isIndefinite
                        ? 'bg-purple-600/25 border-purple-500 text-purple-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>♾️ Indefinida</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsIndefinite(false)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      !isIndefinite
                        ? 'bg-purple-600/25 border-purple-500 text-purple-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>📅 Rango de Fechas</span>
                  </button>
                </div>

                {isIndefinite ? (
                  <p className="text-[11px] text-slate-400">
                    Se proyectará automáticamente todos los meses de todos los años en tu Flujo Diario y Estado de Cuenta.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Fecha Inicial (Desde)</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Fecha Final (Hasta)</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <p className="text-[11px] text-purple-300 sm:col-span-2">
                      Solo se proyectará dentro de este periodo. Fuera de estas fechas no generará cobros ni afectará cuentas.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Notas / Comentarios (Opcional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles, usuario, etc."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-md"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nueva Categoría */}
      <NewCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        defaultType="gasto"
        onCategoryCreated={(newCat) => {
          setCategoryId(newCat.id);
        }}
      />
    </div>
  );
};
