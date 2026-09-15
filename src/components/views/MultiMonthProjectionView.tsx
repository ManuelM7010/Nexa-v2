import React, { useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatMoney, centsToDollars } from '../../utils/formatters';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Landmark,
  PiggyBank,
  CheckCircle2,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

export const MultiMonthProjectionView: React.FC = () => {
  const { annualProjection, settings, selectedYear, selectedMonth } = useFinance();

  // Metrics summary
  const summary = useMemo(() => {
    if (!annualProjection.length) return null;
    const totalIncome = annualProjection.reduce((acc, m) => acc + m.projectedIncome, 0);
    const totalExpense = annualProjection.reduce((acc, m) => acc + m.projectedExpense, 0);
    const totalSavings = totalIncome - totalExpense;
    const lowestClosing = Math.min(...annualProjection.map((m) => m.closingBalance));
    const highestClosing = Math.max(...annualProjection.map((m) => m.closingBalance));
    const finalBalance = annualProjection[annualProjection.length - 1]?.closingBalance || 0;
    const monthsInDeficit = annualProjection.filter((m) => m.status === 'deficit').length;
    const averageSavingsRate =
      totalIncome > 0 ? Math.round((totalSavings / totalIncome) * 100) : 0;

    return {
      totalIncome,
      totalExpense,
      totalSavings,
      lowestClosing,
      highestClosing,
      finalBalance,
      monthsInDeficit,
      averageSavingsRate,
    };
  }, [annualProjection]);

  // Chart data
  const chartData = useMemo(() => {
    return annualProjection.map((m) => ({
      name: m.monthName.split(' ')[0], // 'Ene', 'Feb', etc.
      fullName: m.monthName,
      ingresos: centsToDollars(m.projectedIncome),
      gastos: centsToDollars(m.projectedExpense),
      ahorroNeto: centsToDollars(m.netSavings),
      saldoFinal: centsToDollars(m.closingBalance),
      obligacionesFijas: centsToDollars(m.fixedObligations),
      gastosDiscrecionales: centsToDollars(m.discretionaryBudget),
      ingresosCents: m.projectedIncome,
      gastosCents: m.projectedExpense,
      ahorroCents: m.netSavings,
      saldoFinalCents: m.closingBalance,
    }));
  }, [annualProjection]);

  const CustomProjectionTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      if (!data) return null;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1.5">
          <div className="font-bold text-white mb-1">{data.fullName}</div>
          <div className="flex justify-between gap-4 text-emerald-400 font-semibold">
            <span>Ingresos Proyectados:</span>
            <span className="font-mono">{formatMoney(data.ingresosCents, settings.currencySymbol)}</span>
          </div>
          <div className="flex justify-between gap-4 text-rose-400 font-semibold">
            <span>Gastos Totales:</span>
            <span className="font-mono">{formatMoney(data.gastosCents, settings.currencySymbol)}</span>
          </div>
          <div className="flex justify-between gap-4 text-slate-300">
            <span>Obligaciones fijas:</span>
            <span className="font-mono">{formatMoney(data.obligacionesFijas * 100, settings.currencySymbol)}</span>
          </div>
          <div className="flex justify-between gap-4 text-slate-300">
            <span>Discrecional:</span>
            <span className="font-mono">{formatMoney(data.gastosDiscrecionales * 100, settings.currencySymbol)}</span>
          </div>
          <div className="pt-1.5 border-t border-slate-800 flex justify-between gap-4 font-bold">
            <span className="text-sky-300">Saldo Estimado Cierre:</span>
            <span
              className={`font-mono ${
                data.saldoFinalCents >= 0 ? 'text-sky-300' : 'text-rose-400'
              }`}
            >
              {formatMoney(data.saldoFinalCents, settings.currencySymbol)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">
              Proyección Multimes & Flujo Anual (12 Meses Vista)
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Simulación prospectiva de tesorería y ahorro neto para los próximos 12 meses.
            Calcula automáticamente el vencimiento de préstamos, compras a cuotas, suscripciones recurrentes y capacidad de acumulación patrimonial.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
            Horizonte: 12 Meses Dinámicos
          </span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Cumulative Net Savings */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 relative overflow-hidden shadow-lg shadow-black/20">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Ahorro Neto en 12 Meses
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <PiggyBank className="w-4 h-4" />
              </div>
            </div>
            <div
              className={`text-2xl font-black tracking-tight ${
                summary.totalSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatMoney(summary.totalSavings, settings.currencySymbol)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Tasa promedio de ahorro proyectada: <strong className="text-white">{summary.averageSavingsRate}%</strong>
            </p>
          </div>

          {/* Card 2: Projected End-of-Period Balance */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 relative overflow-hidden shadow-lg shadow-black/20">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Saldo al Cierre del Año
              </span>
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div
              className={`text-2xl font-black tracking-tight ${
                summary.finalBalance >= 0 ? 'text-sky-300' : 'text-rose-400'
              }`}
            >
              {formatMoney(summary.finalBalance, settings.currencySymbol)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Colchón acumulado al mes 12
            </p>
          </div>

          {/* Card 3: Lowest Cash Level */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 relative overflow-hidden shadow-lg shadow-black/20">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Punto Más Ajustado
              </span>
              <div
                className={`p-2 rounded-xl ${
                  summary.lowestClosing < 0
                    ? 'bg-rose-500/10 text-rose-400'
                    : 'bg-amber-500/10 text-amber-400'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div
              className={`text-2xl font-black tracking-tight ${
                summary.lowestClosing < 0 ? 'text-rose-400' : 'text-amber-300'
              }`}
            >
              {formatMoney(summary.lowestClosing, settings.currencySymbol)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {summary.lowestClosing < 0
                ? '⚠️ Se prevé déficit en algún mes futuro'
                : 'Mínimo saldo de seguridad en la curva'}
            </p>
          </div>

          {/* Card 4: Months in Deficit */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 relative overflow-hidden shadow-lg shadow-black/20">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Viabilidad Anual
              </span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white tracking-tight">
              {summary.monthsInDeficit === 0 ? (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-6 h-6" /> 100% Sostenible
                </span>
              ) : (
                <span className="text-rose-400">
                  {summary.monthsInDeficit} {summary.monthsInDeficit === 1 ? 'mes en riesgo' : 'meses en riesgo'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {summary.monthsInDeficit === 0
                ? 'Ningún mes proyecta saldo rojo'
                : 'Se sugiere recortar gastos o reprogramar pagos'}
            </p>
          </div>
        </div>
      )}

      {/* Chart 1: Evolution of Cash & Net Savings */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-400" />
              Evolución del Saldo de Tesorería Acumulado (12 Meses)
            </h3>
            <p className="text-xs text-slate-400">
              Proyección del saldo final disponible mes a mes tras cubrir todas las obligaciones
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              />
              <Tooltip content={<CustomProjectionTooltip />} />
              <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="saldoFinal"
                stroke="#38bdf8"
                strokeWidth={3}
                dot={{ r: 4, fill: '#38bdf8' }}
                activeDot={{ r: 6, fill: '#60a5fa' }}
                name="Saldo Final Acumulado"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Income vs Expenses Bars */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              Ingresos Proyectados vs Gastos Totales por Mes
            </h3>
            <p className="text-xs text-slate-400">
              Comparativa entre capacidad de generación de ingresos y salida total de dinero
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              />
              <Tooltip content={<CustomProjectionTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gastos" name="Gastos Totales" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Multi-Month Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">
              Planilla Detallada de Proyección Mes a Mes
            </h3>
            <p className="text-xs text-slate-400">
              Desglose de saldo inicial, ingresos, cuotas fijas, gastos y saldo acumulado
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Mes</th>
                <th className="py-3 px-4 text-right">Saldo Inicial</th>
                <th className="py-3 px-4 text-right text-emerald-400">Ingresos (+)</th>
                <th className="py-3 px-4 text-right text-amber-400">Obligaciones Fijas</th>
                <th className="py-3 px-4 text-right text-rose-400">Gasto Total (-)</th>
                <th className="py-3 px-4 text-right">Ahorro Neto</th>
                <th className="py-3 px-4 text-right">Tasa Ahorro</th>
                <th className="py-3 px-4 text-right font-bold text-white">Saldo Cierre</th>
                <th className="py-3 px-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {annualProjection.map((m, idx) => (
                <tr
                  key={m.monthKey}
                  className={`hover:bg-slate-800/40 transition ${
                    idx === 0 ? 'bg-blue-950/15' : ''
                  }`}
                >
                  <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                    <span>{m.monthName}</span>
                    {idx === 0 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        Mes actual
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-300">
                    {formatMoney(m.openingBalance, settings.currencySymbol)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-400">
                    +{formatMoney(m.projectedIncome, settings.currencySymbol)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-amber-300">
                    {formatMoney(m.fixedObligations, settings.currencySymbol)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-rose-400">
                    -{formatMoney(m.projectedExpense, settings.currencySymbol)}
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-mono font-bold ${
                      m.netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {m.netSavings >= 0 ? '+' : ''}
                    {formatMoney(m.netSavings, settings.currencySymbol)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-300">
                    {m.savingsRate}%
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-mono font-bold text-sm ${
                      m.closingBalance >= 0 ? 'text-sky-300' : 'text-rose-400'
                    }`}
                  >
                    {formatMoney(m.closingBalance, settings.currencySymbol)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {m.status === 'deficit' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        Déficit
                      </span>
                    ) : m.status === 'ajustado' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Ajustado
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Saludable
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
