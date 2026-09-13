import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { ServiceItem } from '../../types';
import { formatMoney, dollarsToCents, centsToDollars } from '../../utils/formatters';
import {
  Zap,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const ServicesView: React.FC = () => {
  const {
    services,
    accounts,
    creditCards,
    saveService,
    deleteService,
    updateServiceMonthlyRecord,
    selectedYear,
    selectedMonth,
    settings,
  } = useFinance();

  const currentMonthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);

  // Form state
  const [company, setCompany] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [budgetedAmountStr, setBudgetedAmountStr] = useState('');
  const [estimatedDay, setEstimatedDay] = useState(20);
  const [paymentMethodType, setPaymentMethodType] = useState<'banco' | 'efectivo' | 'tarjeta_credito'>('banco');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [creditCardId, setCreditCardId] = useState(creditCards[0]?.id || '');

  // Quick edit monthly bill state
  const [billingServiceId, setBillingServiceId] = useState<string | null>(null);
  const [actualAmountStr, setActualAmountStr] = useState('');

  const openNewModal = () => {
    setEditingService(null);
    setCompany('');
    setServiceName('');
    setBudgetedAmountStr('40');
    setEstimatedDay(20);
    setPaymentMethodType('banco');
    setAccountId(accounts[0]?.id || '');
    setCreditCardId(creditCards[0]?.id || '');
    setIsModalOpen(true);
  };

  const openEditModal = (srv: ServiceItem) => {
    setEditingService(srv);
    setCompany(srv.company);
    setServiceName(srv.serviceName);
    setBudgetedAmountStr(centsToDollars(srv.budgetedAmount).toFixed(2));
    setEstimatedDay(srv.estimatedDay);
    setPaymentMethodType(srv.paymentMethodType);
    setAccountId(srv.accountId || accounts[0]?.id || '');
    setCreditCardId(srv.creditCardId || creditCards[0]?.id || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !serviceName.trim()) return;

    await saveService({
      id: editingService?.id,
      company: company.trim(),
      serviceName: serviceName.trim(),
      budgetedAmount: dollarsToCents(budgetedAmountStr || 0),
      estimatedDay,
      paymentMethodType,
      accountId: paymentMethodType === 'banco' || paymentMethodType === 'efectivo' ? accountId : undefined,
      creditCardId: paymentMethodType === 'tarjeta_credito' ? creditCardId : undefined,
    });

    setIsModalOpen(false);
  };

  const handleUpdateBill = async (srvId: string) => {
    const actCents = dollarsToCents(actualAmountStr || 0);
    await updateServiceMonthlyRecord(srvId, currentMonthKey, {
      actualAmount: actCents > 0 ? actCents : undefined,
      status: 'pendiente',
    });
    setBillingServiceId(null);
    setActualAmountStr('');
  };

  const handleTogglePaid = async (srv: ServiceItem) => {
    const currentRec = srv.monthlyRecords?.[currentMonthKey];
    const isPaid = currentRec?.status === 'pagado';
    await updateServiceMonthlyRecord(srv.id, currentMonthKey, {
      status: isPaid ? 'pendiente' : 'pagado',
    });
  };

  const totalBudgeted = services.reduce((acc, s) => {
    const rec = s.monthlyRecords?.[currentMonthKey];
    return acc + (rec?.budgetedAmount || s.budgetedAmount);
  }, 0);

  const totalReal = services.reduce((acc, s) => {
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

        <button
          onClick={openNewModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white shadow-md shadow-blue-600/30 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Servicio</span>
        </button>
      </div>

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

          return (
            <div
              key={srv.id}
              className="rounded-2xl bg-slate-900 border border-slate-800 p-4.5 shadow-xl space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{srv.serviceName}</h3>
                  <span className="text-xs text-slate-400">{srv.company}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(srv)}
                    className="p-1 rounded text-slate-400 hover:text-white"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteService(srv.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-400"
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

              {/* Variance & Due day */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Vence: Día {srv.estimatedDay}</span>
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

              {/* Status and Action button */}
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

                {isEditingThisBill ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.01"
                      autoFocus
                      value={actualAmountStr}
                      onChange={(e) => setActualAmountStr(e.target.value)}
                      placeholder="Monto"
                      className="w-16 bg-slate-950 border border-blue-500 rounded px-1.5 py-0.5 text-xs text-white"
                    />
                    <button
                      onClick={() => handleUpdateBill(srv.id)}
                      className="px-2 py-0.5 bg-blue-600 rounded text-[10px] text-white font-bold"
                    >
                      OK
                    </button>
                    <button
                      onClick={() => setBillingServiceId(null)}
                      className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px] text-slate-300"
                    >
                      X
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setBillingServiceId(srv.id);
                      setActualAmountStr(actual !== undefined ? centsToDollars(actual).toFixed(2) : centsToDollars(budgeted).toFixed(2));
                    }}
                    className="text-[11px] text-blue-400 hover:underline font-semibold"
                  >
                    {actual !== undefined ? 'Modificar factura' : 'Ingresar factura'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add/Edit Service */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100">
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
                  <label className="block text-slate-300 mb-1 font-semibold">Día de Vencimiento</label>
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

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Medio de Pago</label>
                <select
                  value={paymentMethodType}
                  onChange={(e) => setPaymentMethodType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="banco">Cuenta Bancaria</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta_credito">Tarjeta de Crédito</option>
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
