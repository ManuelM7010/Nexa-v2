import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Loan } from '../../types';
import { formatMoney, dollarsToCents, centsToDollars, formatDateEs } from '../../utils/formatters';
import { NexaFinancialEngine } from '../../services/financialEngine';
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
  CheckCircle2,
  Clock,
  Check,
  CreditCard as CreditCardIcon,
  Sparkles,
} from 'lucide-react';

export const LoansView: React.FC = () => {
  const {
    loans,
    accounts,
    creditCards,
    saveLoan,
    deleteLoan,
    registerLoanExtraPayment,
    settings,
    todayStr,
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [expandedScheduleId, setExpandedScheduleId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [lender, setLender] = useState('');
  const [originalAmountStr, setOriginalAmountStr] = useState('');
  const [remainingBalanceStr, setRemainingBalanceStr] = useState('');
  const [installmentStr, setInstallmentStr] = useState('');
  const [paymentDay, setPaymentDay] = useState(28);
  const [startDate, setStartDate] = useState('');
  const [totalInstallments, setTotalInstallments] = useState(24);
  const [paymentMethodType, setPaymentMethodType] = useState<'banco' | 'tarjeta_credito'>('banco');
  const [creditCardId, setCreditCardId] = useState(creditCards[0]?.id || '');
  const [preferredAccountId, setPreferredAccountId] = useState(accounts[0]?.id || '');
  const [isExtrafinanciamiento, setIsExtrafinanciamiento] = useState(false);
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
    setStartDate(todayStr);
    setTotalInstallments(24);
    setPaymentMethodType('banco');
    setCreditCardId(creditCards[0]?.id || '');
    setPreferredAccountId(accounts.find((a) => a.type === 'banco')?.id || accounts[0]?.id || '');
    setIsExtrafinanciamiento(false);
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
    setStartDate(loan.startDate || '');
    setTotalInstallments(
      loan.totalInstallments || (loan.paymentsMadeCount || 0) + (loan.remainingInstallmentsCount || 24)
    );
    const isTdc = loan.paymentMethodType === 'tarjeta_credito' || !!loan.creditCardId;
    setPaymentMethodType(isTdc ? 'tarjeta_credito' : 'banco');
    setCreditCardId(loan.creditCardId || creditCards[0]?.id || '');
    setPreferredAccountId(
      loan.preferredAccountId || accounts.find((a) => a.type === 'banco')?.id || accounts[0]?.id || ''
    );
    setIsExtrafinanciamiento(loan.isExtrafinanciamiento ?? isTdc);
    setNotes(loan.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !originalAmountStr) return;

    const isTdc = paymentMethodType === 'tarjeta_credito';
    const selectedCard = isTdc ? creditCards.find((c) => c.id === creditCardId) : null;
    const finalLender = lender.trim() || (selectedCard ? selectedCard.bank : 'Entidad Bancaria');

    await saveLoan({
      id: editingLoan?.id,
      name: name.trim(),
      lender: finalLender,
      originalAmount: dollarsToCents(originalAmountStr),
      remainingBalance: dollarsToCents(remainingBalanceStr || originalAmountStr),
      installmentAmount: dollarsToCents(installmentStr || 100),
      paymentDay,
      startDate: startDate.trim() || undefined,
      totalInstallments: Number(totalInstallments) || 24,
      paymentMethodType,
      creditCardId: isTdc ? creditCardId : undefined,
      preferredAccountId: !isTdc ? preferredAccountId : undefined,
      isExtrafinanciamiento: isTdc ? true : isExtrafinanciamiento,
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
  const totalRemainingLoan = loans.reduce((acc, l) => {
    const s = NexaFinancialEngine.getLoanStatus(l, todayStr);
    return acc + s.remainingBalance;
  }, 0);
  const totalInstallmentMonthly = loans.reduce((acc, l) => {
    const s = NexaFinancialEngine.getLoanStatus(l, todayStr);
    return acc + (!s.isCompleted ? l.installmentAmount : 0);
  }, 0);

  const extrafinancingLoans = loans.filter(
    (l) => l.paymentMethodType === 'tarjeta_credito' || !!l.creditCardId
  );
  const extrafinancingRemaining = extrafinancingLoans.reduce((acc, l) => {
    const s = NexaFinancialEngine.getLoanStatus(l, todayStr);
    return acc + s.remainingBalance;
  }, 0);
  const extrafinancingMonthly = extrafinancingLoans.reduce((acc, l) => {
    const s = NexaFinancialEngine.getLoanStatus(l, todayStr);
    return acc + (!s.isCompleted ? l.installmentAmount : 0);
  }, 0);

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
            Control de préstamos bancarios y extrafinanciamientos en tarjeta de crédito. Amortización exacta sin afectar el límite de compras en TDC.
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
          <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">
            Deuda Pendiente Total
          </span>
          <div className="text-2xl font-black text-rose-400 font-mono">
            {formatMoney(totalRemainingLoan, settings.currencySymbol)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Saldo acumulado en {loans.length} pasivo(s)
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
          <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">
            Cuota Mensual Comprometida
          </span>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {formatMoney(totalInstallmentMonthly, settings.currencySymbol)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Total debitado o cargado a TDC este mes
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-amber-500/20 bg-amber-950/10 p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase text-amber-400 block">
              Extrafinanciamientos TDC
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {extrafinancingLoans.length}
            </span>
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">
            {formatMoney(extrafinancingMonthly, settings.currencySymbol)}
            <span className="text-xs text-amber-400/80 font-normal ml-1">/mes</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Saldo: {formatMoney(extrafinancingRemaining, settings.currencySymbol)} (no bloquea cupo TDC)
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
          <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">
            Monto Original Prestado
          </span>
          <div className="text-2xl font-black text-white font-mono">
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
          const status = NexaFinancialEngine.getLoanStatus(loan, todayStr);
          const schedule = NexaFinancialEngine.getLoanSchedule(loan);
          const amortized = Math.max(0, loan.originalAmount - status.remainingBalance);
          const progressPct =
            loan.originalAmount > 0 ? Math.round((amortized / loan.originalAmount) * 100) : 0;
          const isTdc = loan.paymentMethodType === 'tarjeta_credito' || !!loan.creditCardId;
          const card = isTdc ? creditCards.find((c) => c.id === loan.creditCardId) : null;
          const account = accounts.find((a) => a.id === loan.preferredAccountId);
          const isExpanded = expandedScheduleId === loan.id;

          return (
            <div
              key={loan.id}
              className={`rounded-2xl bg-slate-900 border p-5 shadow-xl space-y-4 transition ${
                status.isCompleted ? 'border-emerald-500/40 bg-slate-900/90' : 'border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-white">{loan.name}</h3>
                    {isTdc && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        <CreditCardIcon className="w-3 h-3" />
                        Extrafinanciamiento TDC
                      </span>
                    )}
                    {status.isCompleted ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        Liquidado ({status.totalInstallments}/{status.totalInstallments})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        <Clock className="w-3 h-3" />
                        En Curso ({status.paidCount}/{status.totalInstallments})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
                    <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>{loan.lender}</span>
                    {isTdc ? (
                      <span className="flex items-center gap-1 text-amber-300 font-medium">
                        • <CreditCardIcon className="w-3 h-3 text-amber-400" />
                        Cobro mensual en {card ? card.name : 'Tarjeta de Crédito'} (no afecta límite de compras)
                      </span>
                    ) : account ? (
                      <span>• Débito en {account.name}</span>
                    ) : null}
                  </div>
                  {loan.notes && (
                    <div className="text-[11px] text-slate-400 bg-slate-950/60 border border-slate-800/80 rounded-lg px-2.5 py-1 mt-1.5 flex items-center gap-1.5">
                      <span className="text-amber-400/80 font-semibold text-[10px] uppercase tracking-wider">Nota:</span>
                      <span>{loan.notes}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(loan)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteLoan(loan.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                    title="Eliminar"
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
                    <span
                      className={`text-2xl font-black font-mono ${
                        status.isCompleted ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {formatMoney(status.remainingBalance, settings.currencySymbol)}
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
                  <span>
                    {status.paidCount} de {status.totalInstallments} cuotas ({progressPct}% amortizado)
                  </span>
                  <span>Día de cobro: {loan.paymentDay} de cada mes</span>
                </div>
              </div>

              {/* Extra Payment CTA (Requirement 16) */}
              {!status.isCompleted && (
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
              )}

              {/* Schedule Accordion */}
              {schedule.length > 0 && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setExpandedScheduleId(isExpanded ? null : loan.id)}
                    className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{isExpanded ? 'Ocultar calendario de pagos' : `Ver calendario de las ${schedule.length} cuotas`}</span>
                  </button>

                  {isExpanded && (
                    <div className="mt-2 max-h-40 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                      {schedule.map((inst) => {
                        const isPaid = inst.date <= todayStr;
                        return (
                          <div
                            key={inst.installmentNumber}
                            className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg ${
                              isPaid ? 'bg-slate-900/60 text-slate-300' : 'bg-slate-900 text-slate-100 font-medium'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              {isPaid ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <span className="w-3.5 h-3.5 rounded-full border border-slate-600 inline-block" />
                              )}
                              <span>
                                Cuota {inst.installmentNumber}/{inst.totalInstallments}
                              </span>
                            </span>
                            <span className="text-slate-400 font-mono text-[11px]">
                              {formatDateEs(inst.date, { withDayName: false })}
                            </span>
                            <span className="font-mono font-bold text-amber-300">
                              {formatMoney(inst.amount, settings.currencySymbol)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white mb-4">
              {editingLoan ? 'Editar Préstamo' : 'Registrar Nuevo Préstamo'}
            </h3>

            <form onSubmit={handleSaveLoan} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Nombre del Préstamo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Extrafinanciamiento Línea Blanca, Préstamo Personal..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              {/* Selector de Método de Pago / Modalidad */}
              <div>
                <label className="block text-slate-300 mb-1.5 font-semibold">
                  Método de Pago / Modalidad de Cobro
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethodType('banco');
                      setIsExtrafinanciamiento(false);
                    }}
                    className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 cursor-pointer ${
                      paymentMethodType === 'banco'
                        ? 'bg-blue-600/15 border-blue-500 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <Building2
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        paymentMethodType === 'banco' ? 'text-blue-400' : 'text-slate-500'
                      }`}
                    />
                    <div>
                      <div className="font-bold text-xs text-white">Cuenta Bancaria</div>
                      <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                        Débito directo en cuenta corriente o ahorros
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethodType('tarjeta_credito');
                      setIsExtrafinanciamiento(true);
                      if (creditCards.length > 0 && !creditCardId) {
                        setCreditCardId(creditCards[0].id);
                      }
                      if ((!lender || lender === 'Entidad Bancaria') && creditCards.length > 0) {
                        const targetCard = creditCards.find((c) => c.id === creditCardId) || creditCards[0];
                        if (targetCard) setLender(targetCard.bank);
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 cursor-pointer ${
                      paymentMethodType === 'tarjeta_credito'
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <CreditCardIcon
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        paymentMethodType === 'tarjeta_credito' ? 'text-amber-400' : 'text-slate-500'
                      }`}
                    />
                    <div>
                      <div className="font-bold text-xs text-amber-300">Tarjeta de Crédito</div>
                      <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                        Extrafinanciamiento (no afecta cupo de compras)
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Conditional Account vs Credit Card Selector */}
              {paymentMethodType === 'tarjeta_credito' ? (
                <div className="space-y-2 p-3 rounded-xl bg-amber-950/20 border border-amber-500/30">
                  <div className="flex items-center justify-between">
                    <label className="block text-amber-300 font-semibold">
                      Tarjeta de Crédito de Cobro
                    </label>
                    <span className="text-[10px] text-amber-400 font-mono">Carga mensual a TDC</span>
                  </div>

                  {creditCards.length === 0 ? (
                    <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                      No tienes tarjetas de crédito registradas. Ve al módulo de <strong>Tarjetas</strong> para agregar una tarjeta primero.
                    </div>
                  ) : (
                    <select
                      value={creditCardId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setCreditCardId(id);
                        const c = creditCards.find((card) => card.id === id);
                        if (c && (!lender || lender === 'Entidad Bancaria' || creditCards.some((other) => other.bank === lender))) {
                          setLender(c.bank);
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                    >
                      {creditCards.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} — {c.bank} (Límite: {formatMoney(c.limit, settings.currencySymbol)})
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Extrafinanciamiento Explanation Box */}
                  <div className="flex items-start gap-2 pt-1 text-[11px] text-amber-200/90 leading-relaxed">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong>Extrafinanciamiento Bancario:</strong> La cuota mensual se incluirá en el estado de cuenta mensual de la tarjeta de crédito para ser pagada con la tarjeta, pero el monto total del préstamo <strong>no reduce ni bloquea tu límite disponible para compras</strong>.
                    </div>
                  </div>

                  <label className="flex items-center gap-2 pt-1 text-[11px] text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isExtrafinanciamiento}
                      onChange={(e) => setIsExtrafinanciamiento(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-400"
                    />
                    <span>Extrafinanciamiento activo (no afecta límite de compra de la TDC)</span>
                  </label>
                </div>
              ) : (
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Cuenta Bancaria de Débito</label>
                  <select
                    value={preferredAccountId}
                    onChange={(e) => setPreferredAccountId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.bankName || a.type}) — Saldo: {formatMoney(a.initialBalance, settings.currencySymbol)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Entidad Prestamista / Banco</label>
                <input
                  type="text"
                  value={lender}
                  onChange={(e) => setLender(e.target.value)}
                  placeholder="Ej. BAC Credomatic, Banco Cuscatlán, Banco Promerica..."
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Día de Pago / Cobro en el Mes</label>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Fecha Primera Cuota</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Total de Cuotas (Plazo)</label>
                  <input
                    type="number"
                    min="1"
                    max="360"
                    value={totalInstallments}
                    onChange={(e) => setTotalInstallments(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-center font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Notas u Observaciones (Opcional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Extrafinanciamiento tasa cero a 24 meses..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-md cursor-pointer"
                >
                  {editingLoan ? 'Actualizar Préstamo' : 'Guardar Préstamo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
