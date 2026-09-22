import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { NexaFinancialEngine } from '../../services/financialEngine';
import { formatMoney, dollarsToCents } from '../../utils/formatters';
import { X, Sparkles, CheckCircle2, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';

export const AffordabilityModal: React.FC = () => {
  const {
    isAffordabilityOpen,
    setIsAffordabilityOpen,
    executiveSummary,
    creditCards,
    settings,
    saveTransaction,
    todayStr,
  } = useFinance();

  const [amountStr, setAmountStr] = useState('200');
  const [concept, setConcept] = useState('Compra o gasto propuesto');
  const [paymentMethod, setPaymentMethod] = useState<'banco' | 'efectivo' | 'tarjeta_credito'>('banco');
  const [selectedCardId, setSelectedCardId] = useState(creditCards[0]?.id || '');
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  if (!isAffordabilityOpen) return null;

  const amountCents = dollarsToCents(amountStr || 0);
  const selectedCard = creditCards.find((c) => c.id === selectedCardId);

  const simulation = NexaFinancialEngine.simulateAffordability(
    amountCents,
    paymentMethod,
    executiveSummary.currentRealCashBalance,
    executiveSummary.upcomingObligationsCommitted,
    selectedCard
  );

  const handleRegisterAsPlanned = async () => {
    if (amountCents <= 0) return;
    await saveTransaction({
      concept: concept.trim() || 'Gasto analizado',
      amount: amountCents,
      date: todayStr,
      type: 'gasto',
      paymentMethodType: paymentMethod,
      creditCardId: paymentMethod === 'tarjeta_credito' ? selectedCardId : undefined,
      status: 'planificado',
      notes: `Registrado desde simulador "¿Puedo pagarlo?". Estado: ${simulation.statusLabel}`,
    });
    setRegisteredSuccess(true);
    setTimeout(() => {
      setRegisteredSuccess(false);
      setIsAffordabilityOpen(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-slate-900 border-t sm:border border-slate-800 shadow-2xl p-5 sm:p-6 text-slate-100 max-h-[92vh] sm:max-h-[90vh] flex flex-col my-0 sm:my-8 overflow-y-auto">
        {/* Mobile Drag Indicator Handle */}
        <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto mb-3 sm:hidden cursor-grab" />

        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">¿Puedo pagarlo?</h2>
              <p className="text-xs text-slate-400">
                Simula el impacto de un gasto contra tus obligaciones futuras
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAffordabilityOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mt-4">
          {/* Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ¿Qué deseas comprar o gastar?
              </label>
              <input
                type="text"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Ej. Salida especial, celular nuevo, mueble..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Monto ({settings.currencySymbol})
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Medio con el que pagarías
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'banco', label: 'Cuenta Banco' },
                { id: 'efectivo', label: 'Efectivo' },
                { id: 'tarjeta_credito', label: 'Tarjeta Crédito' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold text-center transition cursor-pointer ${
                    paymentMethod === m.id
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {paymentMethod === 'tarjeta_credito' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tarjeta a utilizar
              </label>
              <select
                value={selectedCardId}
                onChange={(e) => setSelectedCardId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                {creditCards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Límite: {formatMoney(c.limit, settings.currencySymbol)} | Disp:{' '}
                    {formatMoney(c.limit - c.initialUsedBalance, settings.currencySymbol)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* SIMULATION RESULTS CARD */}
          <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-900">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Resultado de Viabilidad
              </span>
              <div
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                  simulation.status === 'safe'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : simulation.status === 'tight'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}
              >
                {simulation.status === 'safe' && <CheckCircle2 className="w-3.5 h-3.5" />}
                {simulation.status === 'tight' && <AlertTriangle className="w-3.5 h-3.5" />}
                {simulation.status === 'danger' && <XCircle className="w-3.5 h-3.5" />}
                <span>{simulation.statusLabel}</span>
              </div>
            </div>

            {/* Step-by-step numbers breakdown (Requirement 32) */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Saldo disponible actual (Bancos + Efectivo):</span>
                <strong className="text-white">
                  {formatMoney(simulation.balanceBefore, settings.currencySymbol)}
                </strong>
              </div>

              <div className="flex justify-between text-slate-300">
                <span>Monto del gasto propuesto:</span>
                <strong className="text-rose-400">
                  -{formatMoney(amountCents, settings.currencySymbol)}
                </strong>
              </div>

              <div className="flex justify-between text-slate-300 font-semibold pt-1 border-t border-slate-900">
                <span>Saldo posterior al gasto:</span>
                <strong
                  className={
                    simulation.balanceAfter < 0 ? 'text-rose-400' : 'text-slate-100'
                  }
                >
                  {formatMoney(simulation.balanceAfter, settings.currencySymbol)}
                </strong>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Obligaciones próximas comprometidas (15 días):</span>
                <strong className="text-amber-400">
                  -{formatMoney(
                    executiveSummary.upcomingObligationsCommitted,
                    settings.currencySymbol
                  )}
                </strong>
              </div>

              <div className="flex justify-between text-xs font-bold pt-2 border-t border-slate-800">
                <span>Saldo posterior a obligaciones:</span>
                <strong
                  className={
                    simulation.balanceAfterObligations < 0
                      ? 'text-rose-400'
                      : simulation.balanceAfterObligations < 5000
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }
                >
                  {formatMoney(
                    simulation.balanceAfterObligations,
                    settings.currencySymbol
                  )}
                </strong>
              </div>
            </div>

            {/* Explanatory notes */}
            <p className="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
              {simulation.explanation}
            </p>
          </div>

          {/* Action to schedule as planned */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400">
              ¿Deseas agregarlo a tus planes?
            </span>
            <button
              onClick={handleRegisterAsPlanned}
              disabled={amountCents <= 0 || registeredSuccess}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-xs font-bold text-white transition flex items-center gap-1.5"
            >
              {registeredSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>¡Planificado!</span>
                </>
              ) : (
                <>
                  <span>Programar en calendario</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
