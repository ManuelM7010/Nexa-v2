import React, { useState } from 'react';
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
  X,
  ExternalLink,
  Zap,
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
import { motion, AnimatePresence } from 'motion/react';
import { QuickExpenseTemplates } from '../common/QuickExpenseTemplates';

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
    accounts,
    creditCards,
    loans,
  } = useFinance();

  const [selectedCardModal, setSelectedCardModal] = useState<
    'liquidez' | 'cierre' | 'disponible' | 'deuda' | null
  >(null);

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
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-400">
            Resumen Ejecutivo del Mes
          </span>
          <span className="text-[11px] text-blue-400 flex items-center gap-1 font-medium">
            <Zap className="w-3 h-3" />
            Toca una tarjeta para ver su desglose
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Real Current Liquidity */}
          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedCardModal('liquidez')}
            className="rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 p-4 relative overflow-hidden shadow-lg shadow-black/20 cursor-pointer transition group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Liquidez Real Hoy
              </span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white tracking-tight privacy-blur">
              {formatMoney(executiveSummary.currentRealCashBalance, settings.currencySymbol)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between privacy-blur">
              <span className="flex items-center gap-1 truncate">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
                Bancos ({formatMoney(executiveSummary.bankBalance, settings.currencySymbol)}) + Efectivo ({formatMoney(executiveSummary.cashBalance, settings.currencySymbol)})
              </span>
              <span className="text-blue-400 group-hover:translate-x-0.5 transition font-semibold text-[10px] ml-1">Ver ↗</span>
            </p>
          </motion.div>

          {/* Card 2: Projected End-of-Month Liquidity */}
          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedCardModal('cierre')}
            className="rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 p-4 relative overflow-hidden shadow-lg shadow-black/20 cursor-pointer transition group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Liquidez Proyectada Cierre
              </span>
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20 transition">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div
              className={`text-2xl font-black tracking-tight privacy-blur ${
                executiveSummary.projectedEndBalance < 0
                  ? 'text-rose-400'
                  : 'text-sky-300'
              }`}
            >
              {formatMoney(executiveSummary.projectedEndBalance, settings.currencySymbol)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between privacy-blur">
              <span>Saldo al día {dailyCashFlow[dailyCashFlow.length - 1]?.date.slice(8) || 30}</span>
              <span className="text-sky-400 group-hover:translate-x-0.5 transition font-semibold text-[10px]">
                Mín: {formatMoney(executiveSummary.lowestProjectedBalance, settings.currencySymbol)} ↗
              </span>
            </p>
          </motion.div>

          {/* Card 3: Free Cash After Obligations */}
          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedCardModal('disponible')}
            className="rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 p-4 relative overflow-hidden shadow-lg shadow-black/20 cursor-pointer transition group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Disponible Libre Real
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div
              className={`text-2xl font-black tracking-tight privacy-blur ${
                executiveSummary.freeCashAfterObligations < 0
                  ? 'text-rose-400'
                  : 'text-emerald-400'
              }`}
            >
              {formatMoney(executiveSummary.freeCashAfterObligations, settings.currencySymbol)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between privacy-blur">
              <span className="truncate">
                Descontando {formatMoney(executiveSummary.upcomingObligationsCommitted, settings.currencySymbol)} pendientes
              </span>
              <span className="text-emerald-400 group-hover:translate-x-0.5 transition font-semibold text-[10px] ml-1">Ver ↗</span>
            </p>
          </motion.div>

          {/* Card 4: Total Debt Outstanding */}
          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedCardModal('deuda')}
            className="rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-rose-500/50 p-4 relative overflow-hidden shadow-lg shadow-black/20 cursor-pointer transition group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Deuda Total Externa
              </span>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20 transition">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-rose-400 tracking-tight privacy-blur">
              {formatMoney(executiveSummary.totalDebt, settings.currencySymbol)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between privacy-blur">
              <span>Tarjetas: {formatMoney(executiveSummary.creditCardDebt, settings.currencySymbol)}</span>
              <span className="text-rose-400 group-hover:translate-x-0.5 transition font-semibold text-[10px]">Ver ↗</span>
            </p>
          </motion.div>
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

      {/* QUICK EXPENSE TEMPLATES (1-Click Quick Add) */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-xl">
        <QuickExpenseTemplates />
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
              {(executiveSummary.criticalAlerts || executiveSummary.alerts || []).length} avisos
            </span>
          </div>

          <div className="space-y-2.5">
            {(executiveSummary.criticalAlerts || executiveSummary.alerts || []).length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <p className="text-xs text-slate-300 font-medium">Todo en orden</p>
                <p className="text-[11px] text-slate-500">No hay alertas de liquidez ni sobregiros proyectados.</p>
              </div>
            ) : (
              (executiveSummary.criticalAlerts || executiveSummary.alerts || []).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 transition ${
                    (alert.severity || alert.type) === 'danger'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                      : (alert.severity || alert.type) === 'warning'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                      : 'bg-blue-500/10 border-blue-500/30 text-blue-200'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {(alert.severity || alert.type) === 'danger' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                    {(alert.severity || alert.type) === 'warning' && <Clock className="w-4 h-4 text-amber-400" />}
                    {(alert.severity || alert.type) === 'info' && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white">{alert.title}</div>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{alert.message}</p>
                  </div>
                </div>
              ))
            )}
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

      {/* Drill-down Modal for Interactive Cards */}
      <AnimatePresence>
        {selectedCardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-5 space-y-4"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                    {selectedCardModal === 'liquidez' && <Wallet className="w-5 h-5" />}
                    {selectedCardModal === 'cierre' && <TrendingUp className="w-5 h-5" />}
                    {selectedCardModal === 'disponible' && <ShieldCheck className="w-5 h-5" />}
                    {selectedCardModal === 'deuda' && <CreditCard className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {selectedCardModal === 'liquidez' && 'Desglose de Liquidez Real Hoy'}
                      {selectedCardModal === 'cierre' && 'Proyección de Liquidez al Cierre'}
                      {selectedCardModal === 'disponible' && 'Disponible Libre vs Obligaciones'}
                      {selectedCardModal === 'deuda' && 'Estructura de Deuda Externa Vigente'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Detalle interactivo para control y conciliación financiera
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCardModal(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="space-y-3 text-xs text-slate-300">
                {selectedCardModal === 'liquidez' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="font-semibold text-slate-400">Total Tesorería Inmediata:</span>
                      <span className="font-mono font-black text-emerald-400 text-sm">
                        {formatMoney(executiveSummary.currentRealCashBalance, settings.currencySymbol)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                        Cuentas Bancarias y Efectivo
                      </span>
                      <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                        {accounts.map((acc) => {
                          const percent = executiveSummary.currentRealCashBalance > 0
                            ? Math.round((acc.initialBalance / executiveSummary.currentRealCashBalance) * 100)
                            : 0;
                          return (
                            <div
                              key={acc.id}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80"
                            >
                              <div className="space-y-0.5">
                                <span className="font-bold text-white block">{acc.name}</span>
                                <span className="text-[10px] text-slate-500 uppercase">{acc.type} {acc.bank ? `• ${acc.bank}` : ''}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-mono font-bold text-slate-100 block">
                                  {formatMoney(acc.initialBalance, settings.currencySymbol)}
                                </span>
                                <span className="text-[10px] text-slate-500">{percent}% de liquidez</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedCardModal(null);
                        setActiveTab('cuentas');
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-bold border border-blue-500/30 transition cursor-pointer"
                    >
                      <span>Gestionar Cuentas y Saldos</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {selectedCardModal === 'cierre' && (
                  <div className="space-y-3">
                    <p className="leading-relaxed">
                      El saldo estimado al último día del mes es de <strong className="font-mono text-sky-300 font-bold">{formatMoney(executiveSummary.projectedEndBalance, settings.currencySymbol)}</strong>.
                    </p>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Ingresos Planificados del Mes:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          +{formatMoney(executiveSummary.totalPlannedIncome, settings.currencySymbol)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Gastos & Salidas Planificadas:</span>
                        <span className="font-mono font-bold text-rose-400">
                          -{formatMoney(executiveSummary.totalPlannedExpense, settings.currencySymbol)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                        <span className="text-slate-400 font-semibold">Punto Mínimo del Mes:</span>
                        <span className={`font-mono font-bold ${executiveSummary.lowestProjectedBalance < 0 ? 'text-rose-400' : 'text-amber-300'}`}>
                          {formatMoney(executiveSummary.lowestProjectedBalance, settings.currencySymbol)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedCardModal(null);
                        setActiveTab('flujo');
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 font-bold border border-sky-500/30 transition cursor-pointer"
                    >
                      <span>Abrir Flujo de Caja Diario</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {selectedCardModal === 'disponible' && (
                  <div className="space-y-3">
                    <p className="leading-relaxed">
                      Tu margen de maniobra real hoy es de <strong className="font-mono text-emerald-400 font-bold">{formatMoney(executiveSummary.freeCashAfterObligations, settings.currencySymbol)}</strong>, calculado tras descontar las obligaciones inminentes ya comprometidas por <span className="font-mono text-amber-300">{formatMoney(executiveSummary.upcomingObligationsCommitted, settings.currencySymbol)}</span>.
                    </p>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-semibold">
                        Próximas Obligaciones Comprometidas
                      </span>
                      <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                        {allMonthTransactions
                          .filter((t) => t.status === 'planificado' && ['gasto', 'cuota_prestamo', 'pago_tarjeta', 'suscripcion', 'servicio'].includes(t.type))
                          .slice(0, 5)
                          .map((t) => (
                            <div key={t.id} className="flex justify-between items-center text-[11px] py-1 border-b border-slate-800/60 last:border-0">
                              <span className="text-white truncate max-w-[200px]">{t.concept}</span>
                              <span className="font-mono font-bold text-rose-400">-{formatMoney(t.amount, settings.currencySymbol)}</span>
                            </div>
                          ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedCardModal(null);
                        setActiveTab('calendario');
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold border border-emerald-500/30 transition cursor-pointer"
                    >
                      <span>Ver Calendario de Vencimientos</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {selectedCardModal === 'deuda' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="font-semibold text-slate-400">Deuda Total Externa:</span>
                      <span className="font-mono font-black text-rose-400 text-sm">
                        {formatMoney(executiveSummary.totalDebt, settings.currencySymbol)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                        Tarjetas de Crédito ({creditCards.length})
                      </span>
                      <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                        {creditCards.map((c) => {
                          const usedPercent = c.limit > 0 ? Math.round((c.initialUsedBalance / c.limit) * 100) : 0;
                          return (
                            <div key={c.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px]">
                              <div>
                                <span className="font-bold text-white block">{c.name}</span>
                                <span className="text-slate-500 text-[10px]">Uso: {usedPercent}%</span>
                              </div>
                              <div className="text-right">
                                <span className="font-mono font-bold text-rose-400">{formatMoney(c.initialUsedBalance, settings.currencySymbol)}</span>
                                <span className="text-[10px] text-slate-500 block">Límite: {formatMoney(c.limit, settings.currencySymbol)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => {
                          setSelectedCardModal(null);
                          setActiveTab('estados-cuenta');
                        }}
                        className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-bold border border-blue-500/30 transition cursor-pointer"
                      >
                        <span>Estados de Cuenta</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCardModal(null);
                          setActiveTab('prestamos');
                        }}
                        className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 transition cursor-pointer"
                      >
                        <span>Ver Préstamos</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
