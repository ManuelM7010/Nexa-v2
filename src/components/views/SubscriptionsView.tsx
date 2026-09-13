import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Subscription } from '../../types';
import { formatMoney, dollarsToCents, centsToDollars } from '../../utils/formatters';
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
  CheckCircle2,
} from 'lucide-react';

export const SubscriptionsView: React.FC = () => {
  const {
    subscriptions,
    creditCards,
    accounts,
    categories,
    saveSubscription,
    deleteSubscription,
    toggleSubscriptionMonthlyPause,
    selectedYear,
    selectedMonth,
    settings,
  } = useFinance();

  const currentMonthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);

  // Form state
  const [concept, setConcept] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [billingDay, setBillingDay] = useState(15);
  const [paymentMethodType, setPaymentMethodType] = useState<'tarjeta_credito' | 'banco'>('tarjeta_credito');
  const [creditCardId, setCreditCardId] = useState(creditCards[0]?.id || '');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [categoryId, setCategoryId] = useState('cat_suscripciones');
  const [notes, setNotes] = useState('');

  const openNewModal = () => {
    setEditingSub(null);
    setConcept('');
    setAmountStr('');
    setBillingDay(15);
    setPaymentMethodType('tarjeta_credito');
    setCreditCardId(creditCards[0]?.id || '');
    setAccountId(accounts[0]?.id || '');
    setCategoryId('cat_suscripciones');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (sub: Subscription) => {
    setEditingSub(sub);
    setConcept(sub.concept);
    setAmountStr(centsToDollars(sub.amount).toFixed(2));
    setBillingDay(sub.billingDay);
    setPaymentMethodType(sub.paymentMethodType === 'banco' ? 'banco' : 'tarjeta_credito');
    setCreditCardId(sub.creditCardId || creditCards[0]?.id || '');
    setAccountId(sub.accountId || accounts[0]?.id || '');
    setCategoryId(sub.categoryId);
    setNotes(sub.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim() || !amountStr) return;

    await saveSubscription({
      id: editingSub?.id,
      concept: concept.trim(),
      amount: dollarsToCents(amountStr),
      billingDay,
      paymentMethodType,
      creditCardId: paymentMethodType === 'tarjeta_credito' ? creditCardId : undefined,
      accountId: paymentMethodType === 'banco' ? accountId : undefined,
      categoryId,
      notes: notes.trim() || undefined,
    });

    setIsModalOpen(false);
  };

  // Calculate monthly total and annual projected
  const activeMonthlyTotal = subscriptions.reduce((acc, s) => {
    const isPaused = s.monthlyExceptions?.[currentMonthKey]?.paused || s.status !== 'activa';
    return isPaused ? acc : acc + s.amount;
  }, 0);

  const annualProjected = activeMonthlyTotal * 12;

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

        <button
          onClick={openNewModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white shadow-md shadow-blue-600/30 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Suscripción</span>
        </button>
      </div>

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
          const isPausedThisMonth = sub.monthlyExceptions?.[currentMonthKey]?.paused;
          const card = creditCards.find((c) => c.id === sub.creditCardId);
          const acc = accounts.find((a) => a.id === sub.accountId);

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
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>{sub.concept}</span>
                    {isPausedThisMonth && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        Pausada este mes
                      </span>
                    )}
                  </h3>
                  <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                    {sub.paymentMethodType === 'tarjeta_credito' ? (
                      <>
                        <CreditCard className="w-3.5 h-3.5 text-rose-400" />
                        <span>{card ? card.name : 'Tarjeta'}</span>
                      </>
                    ) : (
                      <>
                        <Building2 className="w-3.5 h-3.5 text-blue-400" />
                        <span>{acc ? acc.name : 'Banco'}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(sub)}
                    className="p-1 rounded text-slate-400 hover:text-white"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteSubscription(sub.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Amount and Billing Day */}
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">MONTO HABITUAL</span>
                  <span
                    className={`text-xl font-black font-mono ${
                      isPausedThisMonth ? 'line-through text-slate-500' : 'text-purple-300'
                    }`}
                  >
                    {formatMoney(sub.amount, settings.currencySymbol)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-semibold">DÍA DE COBRO</span>
                  <span className="text-xs font-bold text-white">Día {sub.billingDay}</span>
                </div>
              </div>

              {/* Pause this month button (Requirement 17: Pausa mensual puntual) */}
              <div className="pt-2 border-t border-slate-800/80">
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
            </div>
          );
        })}
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100">
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
                  <label className="block text-slate-300 mb-1 font-semibold">Día de Cobro (1-31)</label>
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

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Medio de Pago</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethodType('tarjeta_credito')}
                    className={`py-1.5 rounded-lg font-semibold ${
                      paymentMethodType === 'tarjeta_credito'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    Tarjeta de Crédito
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethodType('banco')}
                    className={`py-1.5 rounded-lg font-semibold ${
                      paymentMethodType === 'banco'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    Cuenta Bancaria
                  </button>
                </div>

                {paymentMethodType === 'tarjeta_credito' ? (
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
                ) : (
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                )}
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
    </div>
  );
};
