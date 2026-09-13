import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { InstallmentPurchase } from '../../types';
import { formatMoney, dollarsToCents, centsToDollars, formatDateEs } from '../../utils/formatters';
import {
  Layers,
  Plus,
  CreditCard,
  Calendar,
  CheckCircle2,
  Trash2,
  Edit2,
  Percent,
} from 'lucide-react';

export const InstallmentsView: React.FC = () => {
  const {
    installmentPurchases,
    creditCards,
    saveInstallmentPurchase,
    deleteInstallmentPurchase,
    settings,
    todayStr,
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InstallmentPurchase | null>(null);

  const [concept, setConcept] = useState('');
  const [totalAmountStr, setTotalAmountStr] = useState('');
  const [cardId, setCardId] = useState(creditCards[0]?.id || '');
  const [totalInstallments, setTotalInstallments] = useState(12);
  const [paidInstallments, setPaidInstallments] = useState(0);
  const [firstPaymentDate, setFirstPaymentDate] = useState(todayStr);
  const [notes, setNotes] = useState('');

  const openNewModal = () => {
    setEditingItem(null);
    setConcept('');
    setTotalAmountStr('');
    setCardId(creditCards[0]?.id || '');
    setTotalInstallments(12);
    setPaidInstallments(0);
    setFirstPaymentDate(todayStr);
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: InstallmentPurchase) => {
    setEditingItem(item);
    setConcept(item.concept);
    setTotalAmountStr(centsToDollars(item.totalAmount).toFixed(2));
    setCardId(item.creditCardId);
    setTotalInstallments(item.totalInstallments);
    setPaidInstallments(item.paidInstallmentsCount);
    setFirstPaymentDate(item.firstPaymentDate);
    setNotes(item.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim() || !totalAmountStr) return;

    const totalCents = dollarsToCents(totalAmountStr);
    const installmentCents = Math.round(totalCents / totalInstallments);
    const remainingCount = totalInstallments - paidInstallments;
    const pendingBalance = remainingCount * installmentCents;

    await saveInstallmentPurchase({
      id: editingItem?.id,
      concept: concept.trim(),
      totalAmount: totalCents,
      creditCardId: cardId,
      totalInstallments,
      installmentAmount: installmentCents,
      paidInstallmentsCount: paidInstallments,
      remainingInstallmentsCount: remainingCount,
      pendingBalance,
      firstPaymentDate,
      notes: notes.trim() || undefined,
    });

    setIsModalOpen(false);
  };

  const totalPendingDebt = installmentPurchases.reduce((acc, i) => acc + i.pendingBalance, 0);
  const totalMonthlyCommitment = installmentPurchases.reduce((acc, i) => acc + i.installmentAmount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Compras a Cuotas & Financiamientos</h2>
          </div>
          <p className="text-xs text-slate-400">
            Control de compras a plazo en tarjetas de crédito y calendarización automática de cuotas
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white shadow-md shadow-blue-600/30 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Compra a Cuotas</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
          <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">
            Saldo Pendiente Total en Cuotas
          </span>
          <div className="text-2xl font-black text-white">
            {formatMoney(totalPendingDebt, settings.currencySymbol)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Monto total comprometido en futuras cuotas
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
          <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">
            Compromiso Mensual de Cuotas
          </span>
          <div className="text-2xl font-black text-indigo-400">
            {formatMoney(totalMonthlyCommitment, settings.currencySymbol)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Suma de cuotas que vencen mensualmente
          </p>
        </div>
      </div>

      {/* Installment Items Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {installmentPurchases.map((item) => {
          const card = creditCards.find((c) => c.id === item.creditCardId);
          const progressPct =
            item.totalInstallments > 0
              ? Math.round((item.paidInstallmentsCount / item.totalInstallments) * 100)
              : 0;

          return (
            <div
              key={item.id}
              className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">{item.concept}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                    <span>{card ? card.name : 'Tarjeta'}</span>
                    {item.notes && <span>• {item.notes}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteInstallmentPurchase(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress and Numbers */}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">Cuota Mensual:</span>
                    <span className="text-xl font-black text-indigo-400">
                      {formatMoney(item.installmentAmount, settings.currencySymbol)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Saldo Restante:</span>
                    <span className="text-base font-bold text-white">
                      {formatMoney(item.pendingBalance, settings.currencySymbol)}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
                  <span>
                    {item.paidInstallmentsCount} de {item.totalInstallments} cuotas pagadas ({progressPct}%)
                  </span>
                  <span>{item.remainingInstallmentsCount} cuotas restantes</span>
                </div>
              </div>

              {/* Additional Meta info */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">MONTO ORIGINAL</span>
                  <span className="font-bold text-white font-mono">
                    {formatMoney(item.totalAmount, settings.currencySymbol)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">PRIMERA CUOTA</span>
                  <span className="font-bold text-slate-200">
                    {formatDateEs(item.firstPaymentDate, { withDayName: false })}
                  </span>
                </div>
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
              {editingItem ? 'Editar Compra a Cuotas' : 'Registrar Compra a Cuotas'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Concepto del Artículo / Compra</label>
                <input
                  type="text"
                  required
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder="Ej. Laptop Trabajo Dell, Smart TV, Mueble..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Monto Total ({settings.currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={totalAmountStr}
                    onChange={(e) => setTotalAmountStr(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Tarjeta Asociada</label>
                  <select
                    value={cardId}
                    onChange={(e) => setCardId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    {creditCards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Total de Cuotas</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    required
                    value={totalInstallments}
                    onChange={(e) => setTotalInstallments(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-center font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Cuotas Ya Pagadas</label>
                  <input
                    type="number"
                    min="0"
                    max={totalInstallments}
                    value={paidInstallments}
                    onChange={(e) => setPaidInstallments(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-center font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Fecha de Primera Cuota</label>
                <input
                  type="date"
                  required
                  value={firstPaymentDate}
                  onChange={(e) => setFirstPaymentDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Notas / Comercio</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Tienda Siman, sin intereses..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
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
