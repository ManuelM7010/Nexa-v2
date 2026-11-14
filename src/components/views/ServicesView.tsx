import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { ServiceItem } from '../../types';
import { formatMoney, dollarsToCents, centsToDollars, formatDateEs, daysInMonth } from '../../utils/formatters';
import {
  Zap,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  Tag,
  Calendar,
  CreditCard,
  Building2,
  RotateCcw,
} from 'lucide-react';
import { CalculatorButton } from '../common/CalculatorButton';
import { NewCategoryModal } from '../common/NewCategoryModal';

export const ServicesView: React.FC = () => {
  const {
    services,
    accounts,
    creditCards,
    categories,
    saveService,
    deleteService,
    updateServiceMonthlyRecord,
    selectedYear,
    selectedMonth,
    settings,
  } = useFinance();

  const currentMonthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const liquidityStart = settings.liquidityStartDate || '2026-09-15';
  const isPriorToStartMonth = currentMonthKey < liquidityStart.slice(0, 7);

  const getDefaultServiceDate = (estimatedDay: number) => {
    const maxD = daysInMonth(selectedYear, selectedMonth);
    const day = Math.min(Math.max(1, estimatedDay || 20), maxD);
    return `${currentMonthKey}-${String(day).padStart(2, '0')}`;
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);

  // Form state
  const [company, setCompany] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [budgetedAmountStr, setBudgetedAmountStr] = useState('');
  const [estimatedDay, setEstimatedDay] = useState(20);
  const [monthCustomDateStr, setMonthCustomDateStr] = useState('');
  const [paymentMethodType, setPaymentMethodType] = useState<'banco' | 'efectivo' | 'tarjeta_credito'>('banco');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [creditCardId, setCreditCardId] = useState(creditCards[0]?.id || '');
  const [categoryId, setCategoryId] = useState('cat_servicios');
  const [isIndefinite, setIsIndefinite] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');

  // Quick edit monthly bill & date state
  const [billingServiceId, setBillingServiceId] = useState<string | null>(null);
  const [actualAmountStr, setActualAmountStr] = useState('');
  const [customDateStr, setCustomDateStr] = useState('');

  const openNewModal = () => {
    setEditingService(null);
    setCompany('');
    setServiceName('');
    setBudgetedAmountStr('40');
    setEstimatedDay(20);
    setMonthCustomDateStr('');
    setPaymentMethodType('banco');
    setAccountId(accounts.find((a) => a.type === 'banco')?.id || accounts[0]?.id || '');
    setCreditCardId(creditCards[0]?.id || '');
    setCategoryId('cat_servicios');
    setIsIndefinite(true);
    setStartDate('');
    setEndDate('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (srv: ServiceItem) => {
    setEditingService(srv);
    setCompany(srv.company);
    setServiceName(srv.serviceName);
    setBudgetedAmountStr(centsToDollars(srv.budgetedAmount).toFixed(2));
    setEstimatedDay(srv.estimatedDay);
    const rec = srv.monthlyRecords?.[currentMonthKey];
    setMonthCustomDateStr(rec?.customDate || rec?.paidDate || '');
    const method = srv.paymentMethodType || 'banco';
    setPaymentMethodType(method);
    const matchingAccs = accounts.filter((a) =>
      method === 'efectivo' ? a.type === 'efectivo' : a.type === 'banco'
    );
    const validAccount =
      (srv.accountId && accounts.some((a) => a.id === srv.accountId) ? srv.accountId : '') ||
      matchingAccs[0]?.id ||
      accounts[0]?.id ||
      '';
    setAccountId(validAccount);
    const validCard =
      (srv.creditCardId && creditCards.some((c) => c.id === srv.creditCardId) ? srv.creditCardId : '') ||
      creditCards[0]?.id ||
      '';
    setCreditCardId(validCard);
    setCategoryId(srv.categoryId || 'cat_servicios');
    setIsIndefinite(srv.isIndefinite !== false);
    setStartDate(srv.startDate || '');
    setEndDate(srv.endDate || '');
    setNotes(srv.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !serviceName.trim()) return;

    const existingRecords = editingService?.monthlyRecords ? { ...editingService.monthlyRecords } : undefined;
    if (editingService && existingRecords !== undefined) {
      const defDate = getDefaultServiceDate(estimatedDay);
      const prevRec = existingRecords[currentMonthKey];
      if (monthCustomDateStr && monthCustomDateStr !== defDate) {
        existingRecords[currentMonthKey] = {
          budgetedAmount: prevRec?.budgetedAmount ?? dollarsToCents(budgetedAmountStr || 0),
          actualAmount: prevRec?.actualAmount,
          status: prevRec?.status || 'pendiente',
          paidDate: prevRec?.status === 'pagado' ? monthCustomDateStr : prevRec?.paidDate,
          customDate: monthCustomDateStr,
        };
      } else if (prevRec) {
        existingRecords[currentMonthKey] = {
          ...prevRec,
          customDate: undefined,
        };
      }
    }

    await saveService({
      id: editingService?.id,
      company: company.trim(),
      serviceName: serviceName.trim(),
      budgetedAmount: dollarsToCents(budgetedAmountStr || 0),
      estimatedDay,
      paymentMethodType,
      accountId: paymentMethodType === 'banco' || paymentMethodType === 'efectivo' ? accountId : undefined,
      creditCardId: paymentMethodType === 'tarjeta_credito' ? creditCardId : undefined,
      categoryId,
      isIndefinite,
      startDate: !isIndefinite && startDate ? startDate : undefined,
      endDate: !isIndefinite && endDate ? endDate : undefined,
      monthlyRecords: existingRecords,
      notes: notes.trim() || undefined,
    });

    setIsModalOpen(false);
  };

  const handleUpdateBill = async (srv: ServiceItem) => {
    const actCents = dollarsToCents(actualAmountStr || 0);
    const defDate = getDefaultServiceDate(srv.estimatedDay);
    const isPaid = srv.monthlyRecords?.[currentMonthKey]?.status === 'pagado';
    const nextCustomDate = customDateStr && customDateStr !== defDate ? customDateStr : undefined;

    await updateServiceMonthlyRecord(srv.id, currentMonthKey, {
      actualAmount: actCents > 0 ? actCents : undefined,
      customDate: nextCustomDate,
      paidDate: isPaid ? (nextCustomDate || defDate) : undefined,
      status: srv.monthlyRecords?.[currentMonthKey]?.status || 'pendiente',
    });
    setBillingServiceId(null);
    setActualAmountStr('');
    setCustomDateStr('');
  };

  const handleTogglePaid = async (srv: ServiceItem) => {
    const currentRec = srv.monthlyRecords?.[currentMonthKey];
    const isPaid = currentRec?.status === 'pagado';
    await updateServiceMonthlyRecord(srv.id, currentMonthKey, {
      status: isPaid ? 'pendiente' : 'pagado',
    });
  };

  const totalBudgeted = isPriorToStartMonth
    ? 0
    : services.reduce((acc, s) => {
        const rec = s.monthlyRecords?.[currentMonthKey];
        return acc + (rec?.budgetedAmount || s.budgetedAmount);
      }, 0);

  const totalReal = isPriorToStartMonth
    ? 0
    : services.reduce((acc, s) => {
        const rec = s.monthlyRecords?.[currentMonthKey];
        return acc + (rec?.actualAmount !== undefined ? rec.actualAmount : s.budgetedAmount);
      }, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-white">Servicios Básicos & Hogar</h2>
          </div>
          <p className="text-xs text-slate-400">
            Control de facturación de servicios con estimación presupuestada vs valor real facturado
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <CalculatorButton label="Calculadora" title="Abrir calculadora rápida de servicios" />

          <button
            onClick={openNewModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white shadow-md shadow-blue-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Servicio</span>
          </button>
        </div>
      </div>

      {/* Prior to start notice banner */}
      {isPriorToStartMonth && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs">
          <Clock className="w-5 h-5 flex-shrink-0 text-amber-400" />
          <div>
            <p className="font-bold text-amber-200">
              Mes anterior a la fecha oficial de inicio de liquidez ({formatDateEs(liquidityStart, { withYear: true })})
            </p>
            <p className="text-amber-300/80 mt-0.5">
              Los gastos fijos y servicios no generan pagos ni afectan cuentas en meses previos al inicio oficial de tu sistema financiero.
            </p>
          </div>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
          <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">
            Total Presupuestado ({currentMonthKey})
          </span>
          <div className="text-2xl font-black text-white">
            {formatMoney(totalBudgeted, settings.currencySymbol)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Estimación base para servicios
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
          <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">
            Total Facturado / Proyectado
          </span>
          <div
            className={`text-2xl font-black ${
              totalReal > totalBudgeted ? 'text-amber-400' : 'text-sky-400'
            }`}
          >
            {formatMoney(totalReal, settings.currencySymbol)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Diferencia vs presupuesto: {formatMoney(totalReal - totalBudgeted, settings.currencySymbol)}
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((srv) => {
          const rec = srv.monthlyRecords?.[currentMonthKey];
          const budgeted = rec?.budgetedAmount || srv.budgetedAmount;
          const actual = rec?.actualAmount;
          const isPaid = rec?.status === 'pagado';
          const variance = actual !== undefined ? actual - budgeted : 0;
          const isEditingThisBill = billingServiceId === srv.id;
          const defaultDate = getDefaultServiceDate(srv.estimatedDay);
          const effectiveDate = rec?.customDate || rec?.paidDate || defaultDate;
          const hasCustomDate = Boolean(rec?.customDate && rec.customDate !== defaultDate);
          const linkedCard = creditCards.find((c) => c.id === srv.creditCardId);
          const linkedAccount = accounts.find((a) => a.id === srv.accountId);

          return (
            <div
              key={srv.id}
              className="rounded-2xl bg-slate-900 border border-slate-800 p-4.5 shadow-xl space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-white">{srv.serviceName}</h3>
                    {srv.isIndefinite !== false ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                        ♾️ Indefinido
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/15 text-purple-300 border border-purple-500/20">
                        📅 {srv.startDate ? srv.startDate.slice(5) : 'Inicio'} a {srv.endDate ? srv.endDate.slice(5) : 'Fin'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-slate-400">{srv.company}</span>
                    {srv.paymentMethodType === 'tarjeta_credito' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-rose-300">
                        <CreditCard className="w-3 h-3 text-rose-400" />
                        <span>{linkedCard ? linkedCard.name : 'Tarjeta'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-blue-300">
                        <Building2 className="w-3 h-3 text-blue-400" />
                        <span>{linkedAccount ? linkedAccount.name : srv.paymentMethodType === 'efectivo' ? 'Efectivo' : 'Banco'}</span>
                      </span>
                    )}
                    {(() => {
                      const cat = categories.find((c) => c.id === srv.categoryId);
                      return cat ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-sky-300 border border-slate-700/60">
                          <Tag className="w-2.5 h-2.5 text-sky-400" />
                          <span>{cat.name}</span>
                        </span>
                      ) : null;
                    })()}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(srv)}
                    className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                    title="Editar servicio"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteService(srv.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-400 cursor-pointer"
                    title="Eliminar servicio"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Budget vs Actual row */}
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">PRESUPUESTADO</span>
                  <span className="font-bold text-slate-300 font-mono">
                    {formatMoney(budgeted, settings.currencySymbol)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">FACTURA REAL</span>
                  <span
                    className={`font-bold font-mono ${
                      actual !== undefined ? 'text-white' : 'text-slate-500 italic'
                    }`}
                  >
                    {actual !== undefined
                      ? formatMoney(actual, settings.currencySymbol)
                      : 'Por recibir'}
                  </span>
                </div>
              </div>

              {/* Variance & Effective Date */}
              <div className="flex items-center justify-between text-xs gap-2 flex-wrap">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-sky-400" />
                  <span>Fecha: <strong className="text-slate-200">{formatDateEs(effectiveDate, { withDayName: false })}</strong></span>
                  {hasCustomDate ? (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[9px] font-bold">
                      Ajustada
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500">(Día {srv.estimatedDay})</span>
                  )}
                </span>
                {actual !== undefined && (
                  <span
                    className={`text-[11px] font-bold ${
                      variance > 0
                        ? 'text-rose-400'
                        : variance < 0
                        ? 'text-emerald-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {variance > 0 ? `+${formatMoney(variance, settings.currencySymbol)}` : formatMoney(variance, settings.currencySymbol)}
                  </span>
                )}
              </div>

              {/* Status and Inline Date/Amount Editor */}
              {isEditingThisBill ? (
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Monto Real</label>
                      <input
                        type="number"
                        step="0.01"
                        autoFocus
                        value={actualAmountStr}
                        onChange={(e) => setActualAmountStr(e.target.value)}
                        placeholder="Monto"
                        className="w-full bg-slate-950 border border-blue-500/60 rounded-lg px-2 py-1 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Fecha Registro / Corte</label>
                      <input
                        type="date"
                        value={customDateStr}
                        onChange={(e) => setCustomDateStr(e.target.value)}
                        className="w-full bg-slate-950 border border-blue-500/60 rounded-lg px-2 py-1 text-xs text-white"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    {customDateStr !== defaultDate ? (
                      <button
                        type="button"
                        onClick={() => setCustomDateStr(defaultDate)}
                        className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-amber-300 cursor-pointer"
                        title="Restaurar al día habitual"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restaurar fecha</span>
                      </button>
                    ) : (
                      <span />
                    )}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setBillingServiceId(null)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] text-slate-300 font-semibold cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateBill(srv)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-lg text-[10px] text-white font-bold cursor-pointer"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleTogglePaid(srv)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${
                      isPaid
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{isPaid ? 'Pagado' : 'Pendiente'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setBillingServiceId(srv.id);
                      setActualAmountStr(actual !== undefined ? centsToDollars(actual).toFixed(2) : centsToDollars(budgeted).toFixed(2));
                      setCustomDateStr(effectiveDate);
                    }}
                    className="text-[11px] text-blue-400 hover:underline font-semibold cursor-pointer"
                  >
                    {actual !== undefined || hasCustomDate ? 'Ajustar fecha / factura' : 'Ajustar fecha / factura'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Add/Edit Service */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100">
            <h3 className="text-base font-bold text-white mb-4">
              {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Empresa / Proveedor</label>
                <input
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Ej. AES Delsur, Claro, ANDA..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Tipo de Servicio</label>
                <input
                  type="text"
                  required
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="Ej. Energía Eléctrica, Agua Potable, Internet Fibra..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Monto Estimado ({settings.currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={budgetedAmountStr}
                    onChange={(e) => setBudgetedAmountStr(e.target.value)}
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
                    value={estimatedDay}
                    onChange={(e) => setEstimatedDay(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-center font-bold"
                  />
                </div>
              </div>

              {editingService && (
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-semibold text-sky-300">
                      Fecha específica en {currentMonthKey} (opcional para corte TDC)
                    </label>
                    {monthCustomDateStr && (
                      <button
                        type="button"
                        onClick={() => setMonthCustomDateStr('')}
                        className="text-[10px] text-slate-400 hover:text-amber-300 cursor-pointer"
                      >
                        Usar día {estimatedDay}
                      </button>
                    )}
                  </div>
                  <input
                    type="date"
                    value={monthCustomDateStr || getDefaultServiceDate(estimatedDay)}
                    onChange={(e) => setMonthCustomDateStr(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Medio de Pago</label>
                <select
                  value={paymentMethodType}
                  onChange={(e) => {
                    const nextType = e.target.value as 'banco' | 'efectivo' | 'tarjeta_credito';
                    setPaymentMethodType(nextType);
                    if (nextType === 'tarjeta_credito') {
                      if (!creditCardId || !creditCards.some((c) => c.id === creditCardId)) {
                        setCreditCardId(creditCards[0]?.id || '');
                      }
                    } else {
                      const matching = accounts.filter((a) =>
                        nextType === 'efectivo' ? a.type === 'efectivo' : a.type === 'banco'
                      );
                      if (matching.length > 0 && !matching.some((a) => a.id === accountId)) {
                        setAccountId(matching[0].id);
                      } else if (!accountId && accounts[0]) {
                        setAccountId(accounts[0].id);
                      }
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="banco">Cuenta Bancaria</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta_credito">Tarjeta de Crédito</option>
                </select>

                {paymentMethodType === 'tarjeta_credito' ? (
                  <div className="mt-2">
                    <label className="block text-[11px] text-slate-400 mb-1">Tarjeta de Crédito</label>
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
                  </div>
                ) : (
                  <div className="mt-2">
                    <label className="block text-[11px] text-slate-400 mb-1">
                      {paymentMethodType === 'efectivo' ? 'Caja / Cuenta de Efectivo' : 'Cuenta Bancaria'}
                    </label>
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
                  </div>
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
                  <option value="cat_servicios">🔴 Servicios Básicos & Hogar</option>
                  {categories
                    .filter((c) => c.type === 'gasto' && c.id !== 'cat_servicios')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        🔴 {c.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Duración / Proyección del Servicio */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="block text-slate-300 font-semibold text-xs">Duración & Proyección</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsIndefinite(true)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      isIndefinite
                        ? 'bg-blue-600/25 border-blue-500 text-blue-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>♾️ Indefinido</span>
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
                  placeholder="Nº de contrato, clave, etc."
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
