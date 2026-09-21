import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatMoney, centsToDollars, MONTH_NAMES_ES } from '../../utils/formatters';
import { MonthProjection } from '../../services/financialEngine';
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
  X,
  ChevronRight,
  Sliders,
  Sparkles,
  RefreshCw,
  LayoutGrid,
  Table as TableIcon,
  LineChart as LineChartIcon,
  CreditCard,
  Layers,
  ExternalLink,
  Zap,
  HelpCircle,
  Clock,
  ArrowRight,
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
import { motion, AnimatePresence } from 'motion/react';

type ViewMode = 'cards' | 'table' | 'charts';
type KpiDetailType = 'ahorro' | 'cierre' | 'ingresos' | 'gastos' | 'critico' | 'salud' | null;

export const MultiMonthProjectionView: React.FC = () => {
  const {
    annualProjection,
    settings,
    selectedYear,
    selectedMonth,
    setSelectedYear,
    setSelectedMonth,
    setActiveTab,
    loans,
    installmentPurchases,
    subscriptions,
    services,
  } = useFinance();

  // View mode switcher: Cards (default touch/visual), Table (tabular analysis), Charts (graphs)
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  // Interactive Scenario Simulator States ("What-If" Projections)
  const [incomeDeltaPercent, setIncomeDeltaPercent] = useState<number>(0); // e.g. -10 to +10%
  const [discretionaryCutPercent, setDiscretionaryCutPercent] = useState<number>(0); // e.g. 0 to 20%
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);

  // Drilldown modals / drawers
  const [selectedKpi, setSelectedKpi] = useState<KpiDetailType>(null);
  const [selectedMonthModal, setSelectedMonthModal] = useState<MonthProjection | null>(null);

  // Base Summary calculation
  const summary = useMemo(() => {
    if (!annualProjection.length) return null;
    const totalIncome = annualProjection.reduce((acc, m) => acc + m.projectedIncome, 0);
    const totalExpense = annualProjection.reduce((acc, m) => acc + m.projectedExpense, 0);
    const totalFixed = annualProjection.reduce((acc, m) => acc + m.fixedObligations, 0);
    const totalDiscretionary = annualProjection.reduce((acc, m) => acc + m.discretionaryBudget, 0);
    const totalSavings = totalIncome - totalExpense;
    const lowestClosing = Math.min(...annualProjection.map((m) => m.closingBalance));
    const lowestMonth = annualProjection.find((m) => m.closingBalance === lowestClosing);
    const highestClosing = Math.max(...annualProjection.map((m) => m.closingBalance));
    const highestMonth = annualProjection.find((m) => m.closingBalance === highestClosing);
    const finalBalance = annualProjection[annualProjection.length - 1]?.closingBalance || 0;
    const monthsInDeficit = annualProjection.filter((m) => m.status === 'deficit').length;
    const averageSavingsRate =
      totalIncome > 0 ? Math.round((totalSavings / totalIncome) * 100) : 0;
    const monthlyAverageIncome = Math.round(totalIncome / annualProjection.length);
    const monthlyAverageExpense = Math.round(totalExpense / annualProjection.length);

    // Initial starting liquidity (opening balance of month 1)
    const initialLiquidity = annualProjection[0]?.openingBalance || 0;
    const netGrowth = finalBalance - initialLiquidity;
    const growthPercent =
      initialLiquidity > 0 ? Math.round((netGrowth / initialLiquidity) * 100) : 0;

    return {
      totalIncome,
      totalExpense,
      totalFixed,
      totalDiscretionary,
      totalSavings,
      lowestClosing,
      lowestMonth,
      highestClosing,
      highestMonth,
      finalBalance,
      monthsInDeficit,
      averageSavingsRate,
      monthlyAverageIncome,
      monthlyAverageExpense,
      initialLiquidity,
      netGrowth,
      growthPercent,
    };
  }, [annualProjection]);

  // Simulated Scenario Calculation (What-If)
  const simulatedData = useMemo(() => {
    if (!annualProjection.length) return null;
    let running = annualProjection[0]?.openingBalance || 0;
    let simTotalSavings = 0;

    const list = annualProjection.map((m) => {
      const simIncome = Math.round(m.projectedIncome * (1 + incomeDeltaPercent / 100));
      const simDiscretionary = Math.round(
        m.discretionaryBudget * (1 - discretionaryCutPercent / 100)
      );
      const simExpense = m.fixedObligations + simDiscretionary;
      const simNet = simIncome - simExpense;
      const simClosing = running + simNet;
      simTotalSavings += simNet;
      running = simClosing;

      return {
        ...m,
        simIncome,
        simExpense,
        simNet,
        simClosing,
      };
    });

    const simFinalBalance = list[list.length - 1]?.simClosing || 0;
    const baseFinalBalance = annualProjection[annualProjection.length - 1]?.closingBalance || 0;
    const deltaFinal = simFinalBalance - baseFinalBalance;

    return {
      list,
      simFinalBalance,
      deltaFinal,
      simTotalSavings,
    };
  }, [annualProjection, incomeDeltaPercent, discretionaryCutPercent]);

  // Debt relief milestones within the 12-month window
  const debtReliefMilestones = useMemo(() => {
    if (!annualProjection.length) return [];
    const milestones: {
      type: 'prestamo' | 'cuota';
      title: string;
      freedMonthlyCents: number;
      targetMonthIndex: number;
      targetMonthName: string;
    }[] = [];

    // Check loans
    loans.forEach((l) => {
      const remaining = l.remainingInstallmentsCount || 0;
      if (remaining > 0 && remaining <= 12) {
        const m = annualProjection[remaining - 1];
        if (m) {
          milestones.push({
            type: 'prestamo',
            title: `Préstamo: ${l.name}`,
            freedMonthlyCents: l.installmentAmount,
            targetMonthIndex: remaining - 1,
            targetMonthName: m.monthName,
          });
        }
      }
    });

    // Check installment purchases
    installmentPurchases.forEach((ip) => {
      const remaining = ip.remainingInstallmentsCount || 0;
      if (remaining > 0 && remaining <= 12) {
        const m = annualProjection[remaining - 1];
        if (m) {
          milestones.push({
            type: 'cuota',
            title: `Cuotas: ${ip.concept}`,
            freedMonthlyCents: ip.installmentAmount,
            targetMonthIndex: remaining - 1,
            targetMonthName: m.monthName,
          });
        }
      }
    });

    return milestones.sort((a, b) => a.targetMonthIndex - b.targetMonthIndex);
  }, [annualProjection, loans, installmentPurchases]);

  // Chart data
  const chartData = useMemo(() => {
    return (simulatedData?.list || annualProjection).map((m: any) => ({
      name: m.monthName.split(' ')[0], // 'Ene', 'Feb', etc.
      fullName: m.monthName,
      year: m.year,
      month: m.month,
      ingresos: centsToDollars(m.simIncome ?? m.projectedIncome),
      gastos: centsToDollars(m.simExpense ?? m.projectedExpense),
      ahorroNeto: centsToDollars(m.simNet ?? m.netSavings),
      saldoFinal: centsToDollars(m.simClosing ?? m.closingBalance),
      obligacionesFijas: centsToDollars(m.fixedObligations),
      gastosDiscrecionales: centsToDollars(m.discretionaryBudget),
      ingresosCents: m.simIncome ?? m.projectedIncome,
      gastosCents: m.simExpense ?? m.projectedExpense,
      ahorroCents: m.simNet ?? m.netSavings,
      saldoFinalCents: m.simClosing ?? m.closingBalance,
    }));
  }, [annualProjection, simulatedData]);

  // Quick navigation helper
  const handleJumpToMonth = (m: MonthProjection, targetTab: string) => {
    setSelectedYear(m.year);
    setSelectedMonth(m.month);
    setActiveTab(targetTab);
    setSelectedMonthModal(null);
  };

  const CustomProjectionTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      if (!data) return null;
      return (
        <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 backdrop-blur-md">
          <div className="font-bold text-white flex items-center justify-between gap-3 mb-1 border-b border-slate-800 pb-1">
            <span>{data.fullName}</span>
            <span className="text-[10px] text-blue-400 font-semibold">Tocar para explorar</span>
          </div>
          <div className="flex justify-between gap-4 text-emerald-400 font-semibold">
            <span>Ingresos Proyectados:</span>
            <span className="font-mono">{formatMoney(data.ingresosCents, settings.currencySymbol)}</span>
          </div>
          <div className="flex justify-between gap-4 text-rose-400 font-semibold">
            <span>Gastos Totales:</span>
            <span className="font-mono">{formatMoney(data.gastosCents, settings.currencySymbol)}</span>
          </div>
          <div className="flex justify-between gap-4 text-slate-300">
            <span>• Compromisos Fijos:</span>
            <span className="font-mono">{formatMoney(data.obligacionesFijas * 100, settings.currencySymbol)}</span>
          </div>
          <div className="flex justify-between gap-4 text-slate-300">
            <span>• Presupuesto Variable:</span>
            <span className="font-mono">{formatMoney(data.gastosDiscrecionales * 100, settings.currencySymbol)}</span>
          </div>
          <div className="flex justify-between gap-4 font-semibold text-amber-300">
            <span>Ahorro del Mes:</span>
            <span className="font-mono">{formatMoney(data.ahorroCents, settings.currencySymbol)}</span>
          </div>
          <div className="pt-1.5 border-t border-slate-800 flex justify-between gap-4 font-bold">
            <span className="text-sky-300">Saldo Cierre Estimado:</span>
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
      {/* 1. VIEW HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-5 h-5 text-blue-400" />
            <h2 className="text-base sm:text-lg font-black text-white">
              Proyección Multimes & Flujo Anual (12 Meses Vista)
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Simulador predictivo integral de tesorería y acumulación patrimonial. Modela automáticamente vencimientos de préstamos, cuotas, suscripciones y capacidad real de ahorro mes a mes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Simulator Trigger */}
          <button
            onClick={() => setIsSimulatorOpen(!isSimulatorOpen)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer ${
              isSimulatorOpen || incomeDeltaPercent !== 0 || discretionaryCutPercent !== 0
                ? 'bg-blue-600 text-white shadow-blue-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <Sliders className="w-4 h-4 text-blue-300" />
            <span>Simulador de Escenarios</span>
            {(incomeDeltaPercent !== 0 || discretionaryCutPercent !== 0) && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vista de Tarjetas Interactivas de los 12 Meses"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tarjetas 12M</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vista de Tabla Analítica"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Planilla</span>
            </button>
            <button
              onClick={() => setViewMode('charts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'charts'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vista de Gráficos de Tendencia"
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Gráficos</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. INTERACTIVE WHAT-IF SIMULATOR DRAWER (IF OPEN OR ACTIVE) */}
      <AnimatePresence>
        {isSimulatorOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Simulador Interactivo de Sensibilidad ("What-If")
                    </h3>
                    <p className="text-xs text-slate-400">
                      Ajusta variables en tiempo real para visualizar el impacto futuro sobre tu liquidez y ahorro al mes 12.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {(incomeDeltaPercent !== 0 || discretionaryCutPercent !== 0) && (
                    <button
                      onClick={() => {
                        setIncomeDeltaPercent(0);
                        setDiscretionaryCutPercent(0);
                      }}
                      className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-medium px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Restablecer
                    </button>
                  )}
                  <button
                    onClick={() => setIsSimulatorOpen(false)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Control 1: Income Variation */}
                <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-300">Variación de Ingresos:</span>
                    <span className={`font-mono font-bold ${incomeDeltaPercent > 0 ? 'text-emerald-400' : incomeDeltaPercent < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                      {incomeDeltaPercent > 0 ? `+${incomeDeltaPercent}%` : `${incomeDeltaPercent}%`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[-10, -5, 0, 5, 10].map((val) => (
                      <button
                        key={val}
                        onClick={() => setIncomeDeltaPercent(val)}
                        className={`flex-1 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                          incomeDeltaPercent === val
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {val > 0 ? `+${val}%` : `${val}%`}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Modela aumentos salariales o escenarios de menores ventas.
                  </p>
                </div>

                {/* Control 2: Discretionary Expense Reduction */}
                <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-300">Recorte de Gastos Variables:</span>
                    <span className={`font-mono font-bold ${discretionaryCutPercent > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {discretionaryCutPercent > 0 ? `-${discretionaryCutPercent}%` : '0%'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[0, 5, 10, 15, 20].map((val) => (
                      <button
                        key={val}
                        onClick={() => setDiscretionaryCutPercent(val)}
                        className={`flex-1 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                          discretionaryCutPercent === val
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {val === 0 ? '0%' : `-${val}%`}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Ajuste selectivo en ocio, compras flexibles y presupuestos no esenciales.
                  </p>
                </div>

                {/* Simulated Outcome Preview */}
                {simulatedData && (
                  <div className="space-y-1 bg-blue-950/30 p-3.5 rounded-xl border border-blue-500/20 flex flex-col justify-center">
                    <span className="text-[11px] font-semibold text-blue-300">
                      Saldo al Cierre del Mes 12 (Simulado):
                    </span>
                    <div className="text-xl font-black text-white font-mono flex items-baseline gap-2">
                      <span>{formatMoney(simulatedData.simFinalBalance, settings.currencySymbol)}</span>
                      {simulatedData.deltaFinal !== 0 && (
                        <span
                          className={`text-xs font-bold ${
                            simulatedData.deltaFinal > 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          ({simulatedData.deltaFinal > 0 ? '+' : ''}
                          {formatMoney(simulatedData.deltaFinal, settings.currencySymbol)})
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Ahorro neto acumulado en el año: {formatMoney(simulatedData.simTotalSavings, settings.currencySymbol)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. INTERACTIVE KPI CARDS STRIP (CLICKABLE WITH RICH DATA DISCOVERY) */}
      {summary && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-400">
              Métricas Clave del Horizonte (Toca cualquier tarjeta para ver su análisis)
            </span>
            <span className="text-[11px] text-blue-400 flex items-center gap-1 font-medium">
              <Zap className="w-3 h-3" />
              6 Tarjetas Interactivas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {/* Card 1: Cumulative Net Savings */}
            <motion.div
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedKpi('ahorro')}
              className="rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 p-4 relative overflow-hidden shadow-lg shadow-black/20 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Ahorro Neto 12M
                </span>
                <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition">
                  <PiggyBank className="w-4 h-4" />
                </div>
              </div>
              <div
                className={`text-xl font-black tracking-tight ${
                  summary.totalSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatMoney(summary.totalSavings, settings.currencySymbol)}
              </div>
              <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                <span>Tasa Media: <strong className="text-white">{summary.averageSavingsRate}%</strong></span>
                <span className="text-emerald-400 group-hover:translate-x-0.5 transition font-semibold">Ver ↗</span>
              </div>
            </motion.div>

            {/* Card 2: Projected End-of-Period Balance */}
            <motion.div
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedKpi('cierre')}
              className="rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 p-4 relative overflow-hidden shadow-lg shadow-black/20 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Saldo Final Mes 12
                </span>
                <div className="p-1.5 rounded-xl bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20 transition">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div
                className={`text-xl font-black tracking-tight ${
                  summary.finalBalance >= 0 ? 'text-sky-300' : 'text-rose-400'
                }`}
              >
                {formatMoney(summary.finalBalance, settings.currencySymbol)}
              </div>
              <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                <span className={summary.netGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {summary.netGrowth >= 0 ? `+${summary.growthPercent}%` : `${summary.growthPercent}%`} vs inicio
                </span>
                <span className="text-sky-400 group-hover:translate-x-0.5 transition font-semibold">Ver ↗</span>
              </div>
            </motion.div>

            {/* Card 3: Total Projected Income */}
            <motion.div
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedKpi('ingresos')}
              className="rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 p-4 relative overflow-hidden shadow-lg shadow-black/20 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Ingresos Totales
                </span>
                <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-black text-white tracking-tight">
                {formatMoney(summary.totalIncome, settings.currencySymbol)}
              </div>
              <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                <span>Prom: {formatMoney(summary.monthlyAverageIncome, settings.currencySymbol)}/m</span>
                <span className="text-emerald-400 group-hover:translate-x-0.5 transition font-semibold">Ver ↗</span>
              </div>
            </motion.div>

            {/* Card 4: Total Projected Expenses & Obligations */}
            <motion.div
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedKpi('gastos')}
              className="rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-rose-500/50 p-4 relative overflow-hidden shadow-lg shadow-black/20 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Gastos Anuales
                </span>
                <div className="p-1.5 rounded-xl bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20 transition">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-black text-rose-400 tracking-tight">
                {formatMoney(summary.totalExpense, settings.currencySymbol)}
              </div>
              <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                <span>Fijos: {Math.round((summary.totalFixed / (summary.totalExpense || 1)) * 100)}%</span>
                <span className="text-rose-400 group-hover:translate-x-0.5 transition font-semibold">Ver ↗</span>
              </div>
            </motion.div>

            {/* Card 5: Critical Cash Level */}
            <motion.div
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedKpi('critico')}
              className="rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 p-4 relative overflow-hidden shadow-lg shadow-black/20 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Mes Más Crítico
                </span>
                <div
                  className={`p-1.5 rounded-xl ${
                    summary.lowestClosing < 0
                      ? 'bg-rose-500/10 text-rose-400'
                      : 'bg-amber-500/10 text-amber-400'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div
                className={`text-xl font-black tracking-tight ${
                  summary.lowestClosing < 0 ? 'text-rose-400' : 'text-amber-300'
                }`}
              >
                {formatMoney(summary.lowestClosing, settings.currencySymbol)}
              </div>
              <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                <span className="truncate">{summary.lowestMonth?.monthName.split(' ')[0] || 'N/A'}</span>
                <span className="text-amber-400 group-hover:translate-x-0.5 transition font-semibold">Ver ↗</span>
              </div>
            </motion.div>

            {/* Card 6: Annual Viability & Health */}
            <motion.div
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedKpi('salud')}
              className="rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 p-4 relative overflow-hidden shadow-lg shadow-black/20 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Sostenibilidad
                </span>
                <div className="p-1.5 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-black tracking-tight">
                {summary.monthsInDeficit === 0 ? (
                  <span className="text-emerald-400">100% Sostenible</span>
                ) : (
                  <span className="text-rose-400">{12 - summary.monthsInDeficit}/12 Meses</span>
                )}
              </div>
              <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                <span>{summary.monthsInDeficit === 0 ? 'Sin meses rojos' : 'Requiere ajuste'}</span>
                <span className="text-blue-400 group-hover:translate-x-0.5 transition font-semibold">Ver ↗</span>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* 4. DEBT RELIEF MILESTONES (WHEN OBLIGATIONS ARE FREED UP) */}
      {debtReliefMilestones.length > 0 && (
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4.5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Hitos de Desendeudamiento & Liberación de Flujo Mensual
                </h4>
                <p className="text-[11px] text-slate-400">
                  Fechas donde finalizan préstamos o cuotas activas, aumentando tu liquidez disponible
                </p>
              </div>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              {debtReliefMilestones.length} {debtReliefMilestones.length === 1 ? 'liberación prevista' : 'liberaciones previstas'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {debtReliefMilestones.map((milestone, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <span>{milestone.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    Finaliza en: <strong className="text-sky-300">{milestone.targetMonthName}</strong>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Flujo Liberado</span>
                  <span className="font-mono font-bold text-emerald-400">
                    +{formatMoney(milestone.freedMonthlyCents, settings.currencySymbol)}/m
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. MAIN CONTENT BASED ON SELECTED VIEW MODE */}
      {viewMode === 'cards' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5 text-blue-400" />
              Horizonte de 12 Meses (Tarjetas Individuales Desplegables)
            </span>
            <span className="text-[11px] text-slate-400">
              Toca <strong className="text-white">"Ver Detalle"</strong> en cualquier mes para desglosar sus números
            </span>
          </div>

          {/* Responsive Card Grid: 1 col on mobile, 2 on sm, 3 on lg, 4 on xl */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {annualProjection.map((m, idx) => {
              const isCurrent = idx === 0;
              const savingsRatio = m.projectedIncome > 0 ? Math.min(100, Math.max(0, (m.netSavings / m.projectedIncome) * 100)) : 0;

              return (
                <motion.div
                  key={m.monthKey}
                  whileHover={{ y: -3 }}
                  className={`rounded-2xl bg-slate-900/90 border transition-all p-4.5 shadow-xl flex flex-col justify-between relative overflow-hidden ${
                    m.status === 'deficit'
                      ? 'border-rose-500/40 hover:border-rose-400'
                      : m.status === 'ajustado'
                      ? 'border-amber-500/30 hover:border-amber-400'
                      : isCurrent
                      ? 'border-blue-500/50 hover:border-blue-400 shadow-blue-500/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top Badge & Month */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-white">{m.monthName}</span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
                            Actual
                          </span>
                        )}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.status === 'deficit'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : m.status === 'ajustado'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {m.status === 'deficit'
                          ? 'Déficit'
                          : m.status === 'ajustado'
                          ? 'Ajustado'
                          : 'Saludable'}
                      </span>
                    </div>

                    {/* Opening to Closing Balances */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 mb-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Saldo Inicial</span>
                        <span className="font-mono font-semibold text-slate-300">
                          {formatMoney(m.openingBalance, settings.currencySymbol)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block">Saldo Cierre</span>
                        <span
                          className={`font-mono font-bold ${
                            m.closingBalance >= 0 ? 'text-sky-300' : 'text-rose-400'
                          }`}
                        >
                          {formatMoney(m.closingBalance, settings.currencySymbol)}
                        </span>
                      </div>
                    </div>

                    {/* Inflows & Outflows */}
                    <div className="space-y-1.5 text-xs mb-3">
                      <div className="flex justify-between items-center text-emerald-400">
                        <span className="flex items-center gap-1 text-slate-400">
                          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> Ingresos
                        </span>
                        <span className="font-mono font-bold">
                          +{formatMoney(m.projectedIncome, settings.currencySymbol)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-rose-400">
                        <span className="flex items-center gap-1 text-slate-400">
                          <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" /> Gastos Totales
                        </span>
                        <span className="font-mono font-bold">
                          -{formatMoney(m.projectedExpense, settings.currencySymbol)}
                        </span>
                      </div>

                      {/* Fixed vs Discretionary breakdown pill */}
                      <div className="flex justify-between items-center text-[10px] text-slate-400 pl-4 border-l border-slate-800">
                        <span>• Fijos (crédito/cuotas):</span>
                        <span className="font-mono text-amber-300">{formatMoney(m.fixedObligations, settings.currencySymbol)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 pl-4 border-l border-slate-800">
                        <span>• Presupuesto variable:</span>
                        <span className="font-mono text-slate-300">{formatMoney(m.discretionaryBudget, settings.currencySymbol)}</span>
                      </div>
                    </div>

                    {/* Net Savings & Savings Bar */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-1.5 mb-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-semibold">Ahorro Neto:</span>
                        <span
                          className={`font-mono font-black ${
                            m.netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {m.netSavings >= 0 ? '+' : ''}
                          {formatMoney(m.netSavings, settings.currencySymbol)} ({m.savingsRate}%)
                        </span>
                      </div>
                      {/* Mini visual savings bar */}
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            m.netSavings >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.max(5, savingsRatio)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action button: Opens month modal */}
                  <button
                    onClick={() => setSelectedMonthModal(m)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition border border-slate-700/60 cursor-pointer"
                  >
                    <span>Ver Detalle del Mes</span>
                    <ChevronRight className="w-3.5 h-3.5 text-blue-400" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'table' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-blue-400" />
                Planilla Detallada de Proyección Mes a Mes
              </h3>
              <p className="text-xs text-slate-400">
                Haz click en cualquier fila para inspeccionar el desglose o abrir ese mes en el Flujo Diario / Presupuesto
              </p>
            </div>
            <span className="text-[11px] text-slate-400">12 Meses en Secuencia</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Mes</th>
                  <th className="py-3 px-4 text-right">Saldo Inicial</th>
                  <th className="py-3 px-4 text-right text-emerald-400">Ingresos (+)</th>
                  <th className="py-3 px-4 text-right text-amber-400">Obligaciones Fijas</th>
                  <th className="py-3 px-4 text-right text-slate-300">Presup. Variable</th>
                  <th className="py-3 px-4 text-right text-rose-400">Gasto Total (-)</th>
                  <th className="py-3 px-4 text-right">Ahorro Neto</th>
                  <th className="py-3 px-4 text-right">Tasa Ahorro</th>
                  <th className="py-3 px-4 text-right font-bold text-white">Saldo Cierre</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {annualProjection.map((m, idx) => (
                  <tr
                    key={m.monthKey}
                    onClick={() => setSelectedMonthModal(m)}
                    className={`hover:bg-blue-950/30 transition cursor-pointer ${
                      idx === 0 ? 'bg-blue-950/15' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                      <span>{m.monthName}</span>
                      {idx === 0 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          Actual
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
                    <td className="py-3 px-4 text-right font-mono text-slate-400">
                      {formatMoney(m.discretionaryBudget, settings.currencySymbol)}
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
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.status === 'deficit'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : m.status === 'ajustado'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {m.status === 'deficit'
                          ? 'Déficit'
                          : m.status === 'ajustado'
                          ? 'Ajustado'
                          : 'Saludable'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMonthModal(m);
                        }}
                        className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                        title="Ver detalle"
                      >
                        <ChevronRight className="w-4 h-4 text-blue-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'charts' && (
        <div className="space-y-6">
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
        </div>
      )}

      {/* 6. MODAL 1: RICH DETAIL FOR A SPECIFIC MONTH */}
      <AnimatePresence>
        {selectedMonthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>{selectedMonthModal.monthName}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          selectedMonthModal.status === 'deficit'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : selectedMonthModal.status === 'ajustado'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {selectedMonthModal.status === 'deficit'
                          ? 'Riesgo de Déficit'
                          : selectedMonthModal.status === 'ajustado'
                          ? 'Ajustado'
                          : 'Saludable'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Radiografía financiera completa de ingresos, compromisos y cierre
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedMonthModal(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4 text-xs">
                {/* Balance Flow Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Saldo Apertura</span>
                    <span className="font-mono font-bold text-slate-200">
                      {formatMoney(selectedMonthModal.openingBalance, settings.currencySymbol)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-400 uppercase tracking-wider block">Ingresos (+)</span>
                    <span className="font-mono font-bold text-emerald-400">
                      +{formatMoney(selectedMonthModal.projectedIncome, settings.currencySymbol)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-400 uppercase tracking-wider block">Gastos (-)</span>
                    <span className="font-mono font-bold text-rose-400">
                      -{formatMoney(selectedMonthModal.projectedExpense, settings.currencySymbol)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-sky-400 uppercase tracking-wider block">Saldo Cierre</span>
                    <span
                      className={`font-mono font-black ${
                        selectedMonthModal.closingBalance >= 0 ? 'text-sky-300' : 'text-rose-400'
                      }`}
                    >
                      {formatMoney(selectedMonthModal.closingBalance, settings.currencySymbol)}
                    </span>
                  </div>
                </div>

                {/* Breakdown Details */}
                <div className="space-y-2 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Desglose de Gastos & Compromisos</span>
                    <span className="text-slate-400 font-normal">
                      Total: {formatMoney(selectedMonthModal.projectedExpense, settings.currencySymbol)}
                    </span>
                  </h4>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-300 font-medium">1. Obligaciones Fijas (Préstamos, Cuotas, Suscripciones):</span>
                    <span className="font-mono font-bold text-amber-300">
                      {formatMoney(selectedMonthModal.fixedObligations, settings.currencySymbol)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-300 font-medium">2. Presupuesto Variable / Gastos Discrecionales:</span>
                    <span className="font-mono font-bold text-slate-200">
                      {formatMoney(selectedMonthModal.discretionaryBudget, settings.currencySymbol)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-slate-300 font-medium">3. Ahorro Neto Proyectado del Mes:</span>
                    <span
                      className={`font-mono font-black ${
                        selectedMonthModal.netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {selectedMonthModal.netSavings >= 0 ? '+' : ''}
                      {formatMoney(selectedMonthModal.netSavings, settings.currencySymbol)} ({selectedMonthModal.savingsRate}%)
                    </span>
                  </div>
                </div>

                {/* Recommendations or Status Banner */}
                {selectedMonthModal.status === 'deficit' ? (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-xs text-rose-200">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      Atención: Riesgo de déficit proyectado en este mes
                    </div>
                    <p className="text-[11px] text-rose-300/90 leading-relaxed">
                      Se prevé que los egresos superen la liquidez disponible por {formatMoney(Math.abs(selectedMonthModal.closingBalance), settings.currencySymbol)}. Te recomendamos postergar compras a cuotas o transferir colchón de ahorro previamente.
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-xs text-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Mes Financieramente Estable
                    </div>
                    <p className="text-[11px] text-emerald-300/90 leading-relaxed">
                      Todas las obligaciones proyectadas quedan cubiertas, manteniendo un margen de maniobra de {formatMoney(selectedMonthModal.closingBalance, settings.currencySymbol)}.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer with Direct Module Jump Buttons */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">
                  Explorar este mes en otros módulos:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleJumpToMonth(selectedMonthModal, 'flujo')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <span>Flujo Diario</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleJumpToMonth(selectedMonthModal, 'presupuesto')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700 cursor-pointer"
                  >
                    <span>Presupuesto</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleJumpToMonth(selectedMonthModal, 'tabla-mensual')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700 cursor-pointer"
                  >
                    <span>Planilla</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. MODAL 2: RICH ANALYSIS FOR CLICKED KPI CARD */}
      <AnimatePresence>
        {selectedKpi && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-5 space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {selectedKpi === 'ahorro' && 'Análisis de Ahorro Neto Anual'}
                      {selectedKpi === 'cierre' && 'Análisis de Acumulación & Cierre (Mes 12)'}
                      {selectedKpi === 'ingresos' && 'Análisis de Capacidad de Ingresos'}
                      {selectedKpi === 'gastos' && 'Estructura de Gastos & Compromisos Fijos'}
                      {selectedKpi === 'critico' && 'Evaluación del Punto Crítico de Liquidez'}
                      {selectedKpi === 'salud' && 'Diagnóstico de Sostenibilidad Anual'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Desglose explicativo para toma de decisiones patrimoniales
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedKpi(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content by KPI */}
              <div className="space-y-3 text-xs text-slate-300">
                {selectedKpi === 'ahorro' && (
                  <div className="space-y-3">
                    <p className="leading-relaxed">
                      El ahorro neto acumulado de <strong className="text-emerald-400 font-mono">{formatMoney(summary?.totalSavings || 0, settings.currencySymbol)}</strong> representa la diferencia entre todos los ingresos previstos y todos los compromisos fijos y discrecionales en 12 meses.
                    </p>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Ahorro Promedio Mensual:</span>
                        <span className="font-mono font-bold text-white">
                          {formatMoney(Math.round((summary?.totalSavings || 0) / 12), settings.currencySymbol)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tasa Media de Ahorro:</span>
                        <span className="font-mono font-bold text-emerald-400">{summary?.averageSavingsRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Mes con Mayor Superávit:</span>
                        <span className="font-semibold text-sky-300">{summary?.highestMonth?.monthName || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedKpi === 'cierre' && (
                  <div className="space-y-3">
                    <p className="leading-relaxed">
                      Tu colchón acumulado al mes 12 se proyecta en <strong className="text-sky-300 font-mono">{formatMoney(summary?.finalBalance || 0, settings.currencySymbol)}</strong>, partiendo de una liquidez de apertura de <span className="font-mono text-slate-200">{formatMoney(summary?.initialLiquidity || 0, settings.currencySymbol)}</span>.
                    </p>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Crecimiento Neto de Tesorería:</span>
                        <span className={`font-mono font-bold ${(summary?.netGrowth || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {(summary?.netGrowth || 0) >= 0 ? '+' : ''}{formatMoney(summary?.netGrowth || 0, settings.currencySymbol)} ({summary?.growthPercent}%)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Meses de Gastos Cubiertos:</span>
                        <span className="font-mono font-bold text-white">
                          {((summary?.finalBalance || 0) / (summary?.monthlyAverageExpense || 1)).toFixed(1)} meses
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedKpi === 'ingresos' && (
                  <div className="space-y-3">
                    <p className="leading-relaxed">
                      Se proyecta percibir un total de <strong className="text-white font-mono">{formatMoney(summary?.totalIncome || 0, settings.currencySymbol)}</strong> en el año, con una media mensual de <span className="font-mono text-emerald-400">{formatMoney(summary?.monthlyAverageIncome || 0, settings.currencySymbol)}</span>.
                    </p>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Mes de Mayor Ingreso:</span>
                        <span className="font-semibold text-emerald-400">{summary?.highestMonth?.monthName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Ingreso Mínimo Mensual Previsto:</span>
                        <span className="font-mono font-bold text-slate-200">
                          {formatMoney(Math.min(...annualProjection.map((m) => m.projectedIncome)), settings.currencySymbol)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedKpi === 'gastos' && (
                  <div className="space-y-3">
                    <p className="leading-relaxed">
                      El gasto anual proyectado es de <strong className="text-rose-400 font-mono">{formatMoney(summary?.totalExpense || 0, settings.currencySymbol)}</strong>. De este total:
                    </p>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Compromisos Fijos (Préstamos, cuotas, suscripciones):</span>
                        <span className="font-mono font-bold text-amber-300">
                          {formatMoney(summary?.totalFixed || 0, settings.currencySymbol)} ({Math.round(((summary?.totalFixed || 0) / (summary?.totalExpense || 1)) * 100)}%)
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Presupuesto Variable Discrecional:</span>
                        <span className="font-mono font-bold text-slate-200">
                          {formatMoney(summary?.totalDiscretionary || 0, settings.currencySymbol)} ({Math.round(((summary?.totalDiscretionary || 0) / (summary?.totalExpense || 1)) * 100)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedKpi === 'critico' && (
                  <div className="space-y-3">
                    <p className="leading-relaxed">
                      El punto más ajustado de liquidez ocurrirá en <strong className="text-amber-300">{summary?.lowestMonth?.monthName}</strong> con un saldo de cierre estimado de <span className={`font-mono font-bold ${(summary?.lowestClosing || 0) < 0 ? 'text-rose-400' : 'text-amber-300'}`}>{formatMoney(summary?.lowestClosing || 0, settings.currencySymbol)}</span>.
                    </p>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      {(summary?.lowestClosing || 0) < 0
                        ? '⚠️ Al proyectar saldo negativo, se recomienda renegociar pagos o planificar una reserva previa para evitar cargos por sobregiro o mora.'
                        : '✓ Tu saldo se mantiene siempre positivo a lo largo de los 12 meses, lo que confirma un margen de seguridad sano.'}
                    </p>
                  </div>
                )}

                {selectedKpi === 'salud' && (
                  <div className="space-y-3">
                    <p className="leading-relaxed">
                      {summary?.monthsInDeficit === 0
                        ? 'Tu flujo financiero a 12 meses cuenta con una calificación de sostenibilidad óptima (100%), ya que ningún mes proyecta caer en saldo rojo.'
                        : `Se detectaron ${summary?.monthsInDeficit} meses con riesgo de déficit. Ajustando gastos variables en el simulador puedes identificar alternativas de equilibrio.`}
                    </p>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-slate-400 text-[11px] block">Acción recomendada:</span>
                      <span className="text-white font-medium text-[11px]">
                        Utiliza el botón superior "Simulador de Escenarios" para probar recortes de 5% a 10% en gastos variables y asegurar tus metas patrimoniales.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Close button */}
              <div className="pt-2">
                <button
                  onClick={() => setSelectedKpi(null)}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
                >
                  Entendido / Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
