import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Loan } from '../../types';
import { formatMoney, dollarsToCents, centsToDollars } from '../../utils/formatters';
import {
  Landmark,
  Plus,
  Calendar,
  Building2,
  Trash2,
  Edit2,
  Coins,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';

export const LoansView: React.FC = () => {
  const {
    loans,
    accounts,
    saveLoan,
    deleteLoan,
    registerLoanExtraPayment,
    settings,
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [lender, setLender] = useState('');
  const [originalAmountStr, setOriginalAmountStr] = useState('');
  const [remainingBalanceStr, setRemainingBalanceStr] = useState('');
  const [installmentStr, setInstallmentStr] = useState('');
  const [paymentDay, setPaymentDay] = useState(28);
  const [preferredAccountId, setPreferredAccountId] = useState(accounts[0]?.id || '');
  const [notes, setNotes] = useState('');

  // Extra Payment modal state
  const [extraPaymentLoan, setExtraPaymentLoan] = useState<Loan | null>(null);
  const [extraAmountStr, setExtraAmountStr] = useState('');
  const [extraAccountId, setExtraAccountId] = useState(accounts[0]?.id || '');
  const [extraNotes, setExtraNotes] = useState('');

  const openNewModal = () => {
    setEditingLoan(null);
    setName('');
    setLender('');
    setOriginalAmountStr('5000');
    setRemainingBalanceStr('3200');
    setInstallmentStr('140');
    setPaymentDay(28);
    setPreferredAccountId(accounts[0]?.id || '');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (loan: Loan) => {
    setEditingLoan(loan);
    setName(loan.name);
    setLender(loan.lender);
    setOriginalAmountStr(centsToDollars(loan.originalAmount).toFixed(2));
    setRemainingBalanceStr(centsToDollars(loan.remainingBalance).toFixed(2));
    setInstallmentStr(centsToDollars(loan.installmentAmount).toFixed(2));
    setPaymentDay(loan.paymentDay);
    setPreferredAccountId(loan.preferredAccountId || accounts[0]?.id || '');
    setNotes(loan.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !originalAmountStr) return;

    await saveLoan({
      id: editingLoan?.id,
      name: name.trim(),
      lender: lender.trim() || 'Entidad Bancaria',
      originalAmount: dollarsToCents(originalAmountStr),
      remainingBalance: dollarsToCents(remainingBalanceStr || originalAmountStr),
      installmentAmount: dollarsToCents(installmentStr || 100),
      paymentDay,
      preferredAccountId,
      notes: notes.trim() || undefined,
    });

    setIsModalOpen(false);
  };

  const handleExecuteExtraPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraPaymentLoan || !extraAmountStr) return;

    const amountCents = dollarsToCents(extraAmountStr);
    if (amountCents <= 0) return;

    await registerLoanExtraPayment(
      extraPaymentLoan.id,
      amountCents,
      extraAccountId,
      extraNotes.trim() || 'Abono extraordinario a capital'
    );

    setExtraPaymentLoan(null);
    setExtraAmountStr('');
    setExtraNotes('');
  };

  const totalOriginalLoan = loans.reduce((acc, l) => acc + l.originalAmount, 0);
  const totalRemainingLoan = loans.reduce((acc, l) => acc + l.remainingBalance, 0);
  const totalInstallmentMonthly = loans.reduce((acc, l) => acc + l.installmentAmount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Landmark className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Préstamos & Pasivos Financieros</h2>
          </div>
          <p className="text-xs text-slate-400">
            Control de amortización de préstamos bancarios, cuotas fijas y abonos extraordinarios a capital
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white shadow-md shadow-blue-600/30 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Préstamo</span>
        </button>
      </div>

      {/* Aggregate Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
          <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">
            Deuda Pendiente Total
          </span>
          <div className="text-2xl font-black text-rose-400">
            {formatMoney(totalRemainingLoan, settings.currencySymbol)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Capital remanente por liquidar
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
          <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">
            Cuota Mensual Comprometida
          </span>
          <div className="text-2xl font-black text-amber-400">
            {formatMoney(totalInstallmentMonthly, settings.currencySymbol)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Descontada mensualmente de bancos
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
          <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">
            Monto Original Prestado
          </span>
          <div className="text-2xl font-black text-white">
            {formatMoney(totalOriginalLoan, settings.currencySymbol)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Amortizado:{' '}
            {formatMoney(Math.max(0, totalOriginalLoan - totalRemainingLoan), settings.currencySymbol)}
          </p>
        </div>
      </div>

      {/* Loan Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {loans.map((loan) => {
          const amortized = Math.max(0, loan.originalAmount - loan.remainingBalance);
          const progressPct =
            loan.originalAmount > 0 ? Math.round((amortized / loan.originalAmount) * 100) : 0;
          const account = accounts.find((a) => a.id === loan.preferredAccountId);

          return (
            <div
              key={loan.id}
              className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">{loan.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>{loan.lender}</span>
                    {account && <span>• Débito en {account.name}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(loan)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteLoan(loan.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Balances & Cuota */}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">Saldo Pendiente:</span>
                    <span className="text-2xl font-black text-rose-400 font-mono">
                      {formatMoney(loan.remainingBalance, settings.currencySymbol)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Cuota Mensual:</span>
                    <span className="text-lg font-bold text-amber-400 font-mono">
                      {formatMoney(loan.installmentAmount, settings.currencySymbol)}
                    </span>
                  </div>
                </div>

                {/* Amortization Bar */}
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
                  <span>{progressPct}% amortizado a capital</span>
                  <span>Día de cobro: {loan.paymentDay} de cada mes</span>
                </div>
              </div>

              {/* Extra Payment CTA (Requirement 16) */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    setExtraPaymentLoan(loan);
                    setExtraAmountStr('200');
                    setExtraAccountId(loan.preferredAccountId || accounts[0]?.id || '');
                  }}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Coins className="w-4 h-4" />
                  <span>+ Registrar Abono Extraordinario a Capital</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Abono a Capital */}
      {extraPaymentLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100">
            <h3 className="text-base font-bold text-white mb-2">
              Abono Extraordinario a Capital
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Préstamo: <strong>{extraPaymentLoan.name}</strong>. Saldo actual:{' '}
              {formatMoney(extraPaymentLoan.remainingBalance, settings.currencySymbol)}
            </p>

            <form onSubmit={handleExecuteExtraPayment} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Monto del Abono ({settings.currencySymbol})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={extraAmountStr}
                  onChange={(e) => setExtraAmountStr(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Cuenta Bancaria de Débito</label>
                <select
                  value={extraAccountId}
                  onChange={(e) => setExtraAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  {accounts.filter((a) => a.type === 'banco').map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatMoney(a.initialBalance, settings.currencySymbol)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Notas</label>
                <input
                  type="text"
                  value={extraNotes}
                  onChange={(e) => setExtraNotes(e.target.value)}
                  placeholder="Ej. Abono por bono de productividad..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setExtraPaymentLoan(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white shadow-md"
                >
                  Confirmar Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add/Edit Loan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100">
            <h3 className="text-base font-bold text-white mb-4">
              {editingLoan ? 'Editar Préstamo' : 'Registrar Nuevo Préstamo'}
            </h3>

            <form onSubmit={handleSaveLoan} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Nombre del Préstamo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Préstamo Personal, Crédito Vehículo..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Entidad Prestamista</label>
                <input
                  type="text"
                  value={lender}
                  onChange={(e) => setLender(e.target.value)}
                  placeholder="Ej. BAC Credomatic, Banco Cuscatlán..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Monto Original ({settings.currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={originalAmountStr}
                    onChange={(e) => setOriginalAmountStr(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Saldo Pendiente ({settings.currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={remainingBalanceStr}
                    onChange={(e) => setRemainingBalanceStr(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Cuota Mensual ({settings.currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={installmentStr}
                    onChange={(e) => setInstallmentStr(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Día de Pago en el Mes</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={paymentDay}
                    onChange={(e) => setPaymentDay(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-center font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Cuenta Bancaria de Débito</label>
                <select
                  value={preferredAccountId}
                  onChange={(e) => setPreferredAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  {accounts.filter((a) => a.type === 'banco').map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
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
