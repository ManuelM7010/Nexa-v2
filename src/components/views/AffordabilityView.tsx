import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { NexaFinancialEngine } from '../../services/financialEngine';
import { formatMoney, dollarsToCents } from '../../utils/formatters';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Building2,
  Wallet,
} from 'lucide-react';

export const AffordabilityView: React.FC = () => {
  const {
    executiveSummary,
    creditCards,
    settings,
    saveTransaction,
    todayStr,
  } = useFinance();

  const [amountStr, setAmountStr] = useState('250');
  const [concept, setConcept] = useState('Viaje fin de semana / Compra especial');
  const [paymentMethod, setPaymentMethod] = useState<'banco' | 'efectivo' | 'tarjeta_credito'>('banco');
  const [selectedCardId, setSelectedCardId] = useState(creditCards[0]?.id || '');
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

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
    }, 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">
              Simulador Financiero Inteligente: ¿Puedo pagarlo?
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Evalúa el impacto de cualquier compra antes de gastar un solo centavo sin comprometer tus obligaciones futuras
          </p>
        </div>
      </div>

      {/* Simulator Inputs Card */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Concepto del gasto o compra a evaluar
            </label>
            <input
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Ej. Teléfono nuevo, salida a cenar, curso, viaje..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Monto ({settings.currencySymbol})
            </label>
            <input
              type="number"
              step="0.01"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-base font-bold font-mono text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Method selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            ¿Cómo planificas pagar este gasto?
          </label>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('banco')}
              className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                paymentMethod === 'banco'
                  ? 'bg-blue-600/20 border-blue-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>Cuenta Bancaria</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('efectivo')}
              className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                paymentMethod === 'efectivo'
                  ? 'bg-emerald-600/20 border-emerald-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>Efectivo</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('tarjeta_credito')}
              className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                paymentMethod === 'tarjeta_credito'
                  ? 'bg-purple-600/20 border-purple-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <CreditCard className="w-4 h-4 text-purple-400" />
              <span>Tarjeta de Crédito</span>
            </button>
          </div>
        </div>

        {paymentMethod === 'tarjeta_credito' && (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Selecciona la tarjeta de crédito a utilizar:
            </label>
            <select
              value={selectedCardId}
              onChange={(e) => setSelectedCardId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            >
              {creditCards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Límite: {formatMoney(c.limit, settings.currencySymbol)} — Deuda actual:{' '}
                  {formatMoney(c.initialUsedBalance, settings.currencySymbol)})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Result Card (Requirement 21) */}
      <div
        className={`rounded-2xl border p-6 space-y-4 shadow-xl transition ${
          simulation.status === 'safe'
            ? 'bg-emerald-950/20 border-emerald-800/60'
            : simulation.status === 'tight'
            ? 'bg-amber-950/20 border-amber-800/60'
            : 'bg-rose-950/20 border-rose-800/60'
        }`}
      >
        <div className="flex items-center gap-3">
          {simulation.status === 'safe' && (
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          )}
          {simulation.status === 'tight' && (
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>
          )}
          {simulation.status === 'danger' && (
            <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <XCircle className="w-6 h-6" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">{simulation.statusLabel}</h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  simulation.status === 'safe'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : simulation.status === 'tight'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {simulation.status}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">{simulation.explanation}</p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-slate-400 block text-[10px] font-semibold">
              LIQUIDEZ REAL ACTUAL
            </span>
            <span className="text-sm font-bold text-white font-mono">
              {formatMoney(executiveSummary.currentRealCashBalance, settings.currencySymbol)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-slate-400 block text-[10px] font-semibold">
              OBLIGACIONES PENDIENTES
            </span>
            <span className="text-sm font-bold text-amber-400 font-mono">
              {formatMoney(executiveSummary.upcomingObligationsCommitted, settings.currencySymbol)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-slate-400 block text-[10px] font-semibold">
              MARGEN RESTANTE SIMULADO
            </span>
            <span
              className={`text-sm font-bold font-mono ${
                simulation.balanceAfterObligations < 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {formatMoney(simulation.balanceAfterObligations, settings.currencySymbol)}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={handleRegisterAsPlanned}
            disabled={amountCents <= 0 || registeredSuccess}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
          >
            {registeredSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>¡Registrado como Planificado en el Flujo!</span>
              </>
            ) : (
              <>
                <span>Agendar como gasto planificado en calendario</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
