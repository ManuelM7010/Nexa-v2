import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { CreditCard } from '../../types';
import { formatMoney, dollarsToCents, centsToDollars } from '../../utils/formatters';
import {
  CreditCard as CreditCardIcon,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Plus,
  ArrowRight,
  TrendingDown,
  Clock,
  Sparkles,
  Edit2,
  Trash2,
} from 'lucide-react';

export const CreditCardsView: React.FC = () => {
  const {
    creditCards,
    saveCreditCard,
    deleteCreditCard,
    saveTransaction,
    accounts,
    todayStr,
    settings,
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [limitStr, setLimitStr] = useState('');
  const [usedStr, setUsedStr] = useState('');
  const [cutOffDay, setCutOffDay] = useState(20);
  const [paymentDueDay, setPaymentDueDay] = useState(5);
  const [usualPaymentDay, setUsualPaymentDay] = useState(4);

  // Quick Payment state
  const [paymentCardId, setPaymentCardId] = useState<string | null>(null);
  const [paymentAmountStr, setPaymentAmountStr] = useState('');
  const [paymentAccountId, setPaymentAccountId] = useState(accounts[0]?.id || '');

  const openNewCardModal = () => {
    setEditingCard(null);
    setName('');
    setBank('');
    setLimitStr('1500');
    setUsedStr('0');
    setCutOffDay(15);
    setPaymentDueDay(30);
    setUsualPaymentDay(29);
    setIsModalOpen(true);
  };

  const openEditModal = (card: CreditCard) => {
    setEditingCard(card);
    setName(card.name);
    setBank(card.bank);
    setLimitStr(centsToDollars(card.limit).toFixed(2));
    setUsedStr(centsToDollars(card.initialUsedBalance).toFixed(2));
    setCutOffDay(card.cutOffDay);
    setPaymentDueDay(card.paymentDueDay);
    setUsualPaymentDay(card.usualPaymentDay || card.paymentDueDay - 1);
    setIsModalOpen(true);
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !limitStr) return;

    await saveCreditCard({
      id: editingCard?.id,
      name: name.trim(),
      bank: bank.trim() || 'Banco',
      limit: dollarsToCents(limitStr),
      initialUsedBalance: dollarsToCents(usedStr || 0),
      cutOffDay,
      paymentDueDay,
      usualPaymentDay,
    });

    setIsModalOpen(false);
  };

  const handleExecutePayment = async (card: CreditCard) => {
    const payCents = dollarsToCents(paymentAmountStr || 0);
    if (payCents <= 0) return;

    // Create payment transaction
    await saveTransaction({
      concept: `Pago Tarjeta ${card.name}`,
      amount: payCents,
      date: todayStr,
      type: 'pago_tarjeta',
      paymentMethodType: 'banco',
      accountId: paymentAccountId,
      creditCardId: card.id,
      status: 'realizado',
      notes: `Liquidación de deuda de tarjeta. Descontado de cuenta bancaria.`,
    });

    // Reduce used balance on card
    await saveCreditCard({
      ...card,
      initialUsedBalance: Math.max(0, card.initialUsedBalance - payCents),
    });

    setPaymentCardId(null);
    setPaymentAmountStr('');
  };

  const totalLimit = creditCards.reduce((acc, c) => acc + c.limit, 0);
  const totalUsed = creditCards.reduce((acc, c) => acc + c.initialUsedBalance, 0);
  const totalAvailable = Math.max(0, totalLimit - totalUsed);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Aggregated Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CreditCardIcon className="w-5 h-5 text-rose-400" />
            <h2 className="text-base font-bold text-white">Tarjetas de Crédito & Ciclos Financieros</h2>
          </div>
          <p className="text-xs text-slate-400">
            Separación estricta entre compras a crédito (pasivos) y liquidación de banco (efectivo)
          </p>
        </div>

        <button
          onClick={openNewCardModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white shadow-md shadow-blue-600/30 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Tarjeta</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
          <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">
            Límite Total de Crédito
          </span>
          <div className="text-2xl font-black text-white">
            {formatMoney(totalLimit, settings.currencySymbol)}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
          <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">
            Deuda Acumulada Utilizada
          </span>
          <div className="text-2xl font-black text-rose-400">
            {formatMoney(totalUsed, settings.currencySymbol)}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
          <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">
            Crédito Disponible Total
          </span>
          <div className="text-2xl font-black text-sky-400">
            {formatMoney(totalAvailable, settings.currencySymbol)}
          </div>
        </div>
      </div>

      {/* Credit Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {creditCards.map((card) => {
          const usedPct = card.limit > 0 ? Math.round((card.initialUsedBalance / card.limit) * 100) : 0;
          const available = Math.max(0, card.limit - card.initialUsedBalance);
          const isHighUsage = usedPct >= 80;
          const isPayingThis = paymentCardId === card.id;

          return (
            <div
              key={card.id}
              className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4 relative overflow-hidden"
            >
              {/* Card visual header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{card.name}</h3>
                    {isHighUsage && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Alerta &gt;80%
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">{card.bank}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(card)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                    title="Editar tarjeta"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteCreditCard(card.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                    title="Eliminar tarjeta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Limit, Used, Available Bars */}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">Deuda Utilizada:</span>
                    <span className="text-xl font-black text-rose-400">
                      {formatMoney(card.initialUsedBalance, settings.currencySymbol)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Disponible:</span>
                    <span className="text-base font-bold text-sky-400">
                      {formatMoney(available, settings.currencySymbol)}
                    </span>
                  </div>
                </div>

                {/* Usage progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isHighUsage ? 'bg-rose-500' : usedPct > 50 ? 'bg-amber-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(100, usedPct)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>{usedPct}% del límite consumido</span>
                  <span>Límite: {formatMoney(card.limit, settings.currencySymbol)}</span>
                </div>
              </div>

              {/* Dates and Billing Cycle (Requirement 14) */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">DÍA DE CORTE</span>
                  <span className="font-bold text-white">Día {card.cutOffDay}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">LÍMITE DE PAGO</span>
                  <span className="font-bold text-rose-300">Día {card.paymentDueDay}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">PAGO HABITUAL</span>
                  <span className="font-bold text-emerald-300">Día {card.usualPaymentDay || card.paymentDueDay - 1}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div>
                {isPayingThis ? (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <span className="text-xs font-bold text-white block">
                      Registrar Liquidación / Abono a Tarjeta
                    </span>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Monto a Pagar</label>
                        <input
                          type="number"
                          step="0.01"
                          value={paymentAmountStr}
                          onChange={(e) => setPaymentAmountStr(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Cuenta Bancaria</label>
                        <select
                          value={paymentAccountId}
                          onChange={(e) => setPaymentAccountId(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        >
                          {accounts.filter((a) => a.type === 'banco').map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPaymentAmountStr(centsToDollars(card.initialUsedBalance).toFixed(2))}
                        className="text-[10px] px-2 py-1 rounded bg-slate-800 text-blue-300 hover:text-white"
                      >
                        Pago total ({formatMoney(card.initialUsedBalance, settings.currencySymbol)})
                      </button>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setPaymentCardId(null)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleExecutePayment(card)}
                        className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                      >
                        Confirmar Pago
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setPaymentCardId(card.id);
                      setPaymentAmountStr(centsToDollars(card.initialUsedBalance).toFixed(2));
                    }}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Pagar / Liquidar Tarjeta</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add/Edit Card */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100">
            <h3 className="text-base font-bold text-white mb-4">
              {editingCard ? 'Editar Tarjeta de Crédito' : 'Nueva Tarjeta de Crédito'}
            </h3>

            <form onSubmit={handleSaveCard} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Nombre de la Tarjeta</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Visa Signature, Mastercard Oro..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Banco Emisor</label>
                <input
                  type="text"
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  placeholder="Ej. BAC Credomatic, Banco Agrícola..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Límite ({settings.currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={limitStr}
                    onChange={(e) => setLimitStr(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Saldo Usado ({settings.currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={usedStr}
                    onChange={(e) => setUsedStr(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Día de Corte</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={cutOffDay}
                    onChange={(e) => setCutOffDay(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-white text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Límite de Pago</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={paymentDueDay}
                    onChange={(e) => setPaymentDueDay(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-white text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Pago Habitual</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={usualPaymentDay}
                    onChange={(e) => setUsualPaymentDay(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-white text-center font-bold"
                  />
                </div>
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
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-md shadow-blue-600/30"
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
