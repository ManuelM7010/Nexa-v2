import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  formatMoney,
  formatDateEs,
  centsToDollars,
} from '../../utils/formatters';
import {
  Wallet,
  TrendingUp,
  CreditCard,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  Landmark,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

export const DashboardView: React.FC = () => {
  const {
    executiveSummary,
    dailyCashFlow,
    selectedMonth,
    selectedYear,
    settings,
    setActiveTab,
    setIsNewTxOpen,
    setIsAffordabilityOpen,
    allMonthTransactions,
    toggleTransactionStatus,
  } = useFinance();

  // Prepare chart data from daily cash flow
  const chartData = dailyCashFlow.map((day) => ({
    date: day.date.slice(8), // '12', '13', etc.
    fullDate: day.date,
    dayName: day.dayNameShort,
    balance: centsToDollars(day.finalBalance),
    isToday: day.isToday,
    isPast: day.isPast,
    income: centsToDollars(day.totalIncome),
    expense: centsToDollars(day.totalExpense),
  }));

  // Next 5 upcoming movements
  const upcomingTransactions = allMonthTransactions
    .filter((t) => t.status === 'planificado')
    .slice(0, 6);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. EXECUTIVE SUMMARY CARDS (Core Fintech Dashboard) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Real Current Liquidity */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 relative overflow-hidden shadow-lg shadow-black/20">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Liquidez Real Hoy
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {formatMoney(executiveSummary.currentRealCashBalance, settings.currencySymbol)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            Bancos ({formatMoney(executiveSummary.bankBalance, settings.currencySymbol)}) + Efectivo ({formatMoney(executiveSummary.cashBalance, settings.currencySymbol)})
          </p>
        </div>

        {/* Card 2: Projected End-of-Month Liquidity */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 relative overflow-hidden shadow-lg shadow-black/20">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Liquidez Proyectada Cierre
            </span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-black tracking-tight ${
              executiveSummary.projectedEndBalance < 0
                ? 'text-rose-400'
                : 'text-sky-300'
            }`}
          >
            {formatMoney(executiveSummary.projectedEndBalance, settings.currencySymbol)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Saldo al día {dailyCashFlow[dailyCashFlow.length - 1]?.date.slice(8) || 30}</span>
            <span className={executiveSummary.lowestProjectedBalance < 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
              Mín: {formatMoney(executiveSummary.lowestProjectedBalance, settings.currencySymbol)}
            </span>
          </p>
        </div>

        {/* Card 3: Free Cash After Obligations */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 relative overflow-hidden shadow-lg shadow-black/20">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Disponible Libre Real
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-black tracking-tight ${
              executiveSummary.freeCashAfterObligations < 0
                ? 'text-rose-400'
                : 'text-emerald-400'
            }`}
          >
            {formatMoney(executiveSummary.freeCashAfterObligations, settings.currencySymbol)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Tras descontar {formatMoney(executiveSummary.upcomingObligationsCommitted, settings.currencySymbol)} en obligaciones próximas
          </p>
        </div>

        {/* Card 4: Total Debt Outstanding */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 relative overflow-hidden shadow-lg shadow-black/20">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Deuda Total Externa
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-400 tracking-tight">
            {formatMoney(executiveSummary.totalDebt, settings.currencySymbol)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Tarjetas: {formatMoney(executiveSummary.creditCardDebt, settings.currencySymbol)}</span>
            <span>Préstamos: {formatMoney(executiveSummary.loanDebt, settings.currencySymbol)}</span>
          </p>
        </div>
      </div>

      {/* 2. SECONDARY METRICS ROW: Planned vs Real Month Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Ingresos */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" /> Ingresos del Mes
            </span>
            <span className="text-[11px] font-bold text-emerald-400">
              {Math.round(
                executiveSummary.totalPlannedIncome > 0
                  ? (executiveSummary.totalRealizedIncome / executiveSummary.totalPlannedIncome) * 100
                  : 0
              )}
              % cobrado
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-xs text-slate-500 block">Realizado:</span>
              <span className="text-lg font-bold text-white">
                {formatMoney(executiveSummary.totalRealizedIncome, settings.currencySymbol)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Planificado:</span>
              <span className="text-sm font-semibold text-slate-400">
                {formatMoney(executiveSummary.totalPlannedIncome, settings.currencySymbol)}
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  executiveSummary.totalPlannedIncome > 0
                    ? (executiveSummary.totalRealizedIncome / executiveSummary.totalPlannedIncome) * 100
                    : 0
                )}%`,
              }}
            />
          </div>
        </div>

        {/* Gastos */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <ArrowDownRight className="w-4 h-4 text-rose-400" /> Gastos del Mes
            </span>
            <span className="text-[11px] font-bold text-slate-300">
              {Math.round(
                executiveSummary.totalPlannedExpense > 0
                  ? (executiveSummary.totalRealizedExpense / executiveSummary.totalPlannedExpense) * 100
                  : 0
              )}
              % ejecutado
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-xs text-slate-500 block">Realizado:</span>
              <span className="text-lg font-bold text-white">
                {formatMoney(executiveSummary.totalRealizedExpense, settings.currencySymbol)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Planificado:</span>
              <span className="text-sm font-semibold text-slate-400">
                {formatMoney(executiveSummary.totalPlannedExpense, settings.currencySymbol)}
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-rose-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  executiveSummary.totalPlannedExpense > 0
                    ? (executiveSummary.totalRealizedExpense / executiveSummary.totalPlannedExpense) * 100
                    : 0
                )}%`,
              }}
            />
          </div>
        </div>

        {/* Ahorro Neto Estimado */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-sky-400" /> Ahorro Neto Estimado
            </span>
            <span className="text-[11px] font-semibold text-sky-400">Cierre mensual</span>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-xs text-slate-500 block">Real hasta hoy:</span>
              <span
                className={`text-lg font-bold ${
                  executiveSummary.netRealSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatMoney(executiveSummary.netRealSavings, settings.currencySymbol)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Proyectado:</span>
              <span
                className={`text-sm font-semibold ${
                  executiveSummary.netPlannedSavings >= 0 ? 'text-sky-300' : 'text-rose-400'
                }`}
              >
                {formatMoney(executiveSummary.netPlannedSavings, settings.currencySymbol)}
              </span>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400">
            Diferencia de ahorro: {formatMoney(executiveSummary.netRealSavings - executiveSummary.netPlannedSavings, settings.currencySymbol)}
          </div>
        </div>
      </div>

      {/* 3. CHART: Daily Cash Flow Evolution Curve */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              Curva de Liquidez Diaria — Septiembre {selectedYear}
            </h3>
            <p className="text-xs text-slate-400">
              Proyección día por día considerando ingresos, gastos y cuotas comprometidas
            </p>
          </div>
          <button
            onClick={() => setActiveTab('flujo')}
            className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
          >
            <span>Ver tabla detallada</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="liquidityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tickLine={false}
                tick={{ fontSize: 11 }}
                tickFormatter={(val) => `Día ${val}`}
              />
              <YAxis
                stroke="#64748b"
                tickLine={false}
                tick={{ fontSize: 11 }}
                tickFormatter={(val) => `$${val}`}
                domain={['auto', 'auto']}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 shadow-2xl text-xs space-y-1">
                        <div className="font-bold text-white border-b border-slate-800 pb-1 flex items-center justify-between gap-4">
                          <span>{data.fullDate} ({data.dayName})</span>
                          {data.isToday && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px]">
                              Hoy
                            </span>
                          )}
                        </div>
                        <div className="text-sky-400 font-bold text-sm">
                          Saldo Disponible: ${data.balance.toFixed(2)}
                        </div>
                        {data.income > 0 && (
                          <div className="text-emerald-400">
                            + Ingresos: ${data.income.toFixed(2)}
                          </div>
                        )}
                        {data.expense > 0 && (
                          <div className="text-rose-400">
                            - Salidas: ${data.expense.toFixed(2)}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#liquidityGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. TWO COLUMNS: Active Financial Alerts & Upcoming Commitments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Alerts & Critical Diagnostics (Requirement 31 & 33) */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Alertas Financieras & Diagnóstico
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">
              {executiveSummary.criticalAlerts.length} avisos
            </span>
          </div>

          <div className="space-y-2.5">
            {executiveSummary.criticalAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3.5 rounded-xl border flex items-start gap-3 transition ${
                  alert.severity === 'danger'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                    : alert.severity === 'warning'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                    : 'bg-blue-500/10 border-blue-500/30 text-blue-200'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {alert.severity === 'danger' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                  {alert.severity === 'warning' && <Clock className="w-4 h-4 text-amber-400" />}
                  {alert.severity === 'info' && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white">{alert.title}</div>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={() => setIsAffordabilityOpen(true)}
              className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-sky-400 flex items-center justify-center gap-2 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Simular nuevo gasto antes de comprometerlo</span>
            </button>
          </div>
        </div>

        {/* Upcoming 5 Planned Movements */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              Próximos Compromisos Planificados
            </h3>
            <button
              onClick={() => setActiveTab('movimientos')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
            >
              Ver todos
            </button>
          </div>

          <div className="divide-y divide-slate-800/80">
            {upcomingTransactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No hay compromisos pendientes para este mes.
              </div>
            ) : (
              upcomingTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-850/50 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      onClick={() => toggleTransactionStatus(tx.id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-slate-800 transition"
                      title="Marcar como realizado"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {tx.concept}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>{formatDateEs(tx.date, { withDayName: false })}</span>
                        <span>•</span>
                        <span className="capitalize">{tx.paymentMethodType.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span
                      className={`text-xs font-bold ${
                        tx.type === 'ingreso' ? 'text-emerald-400' : 'text-slate-100'
                      }`}
                    >
                      {tx.type === 'ingreso' ? '+' : '-'}
                      {formatMoney(tx.amount, settings.currencySymbol)}
                    </span>
                    <span className="block text-[10px] text-amber-400 font-medium">
                      Planificado
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => setIsNewTxOpen(true)}
            className="w-full py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-xs font-bold text-blue-300 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>+ Programar nuevo movimiento</span>
          </button>
        </div>
      </div>
    </div>
  );
};
