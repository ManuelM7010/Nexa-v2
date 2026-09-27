import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Category } from '../../types';
import {
  formatMoney,
  dollarsToCents,
  centsToDollars,
  daysInMonth,
  MONTH_NAMES_ES,
} from '../../utils/formatters';
import {
  PieChart as PieChartIcon,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Flame,
  ShieldCheck,
  ShieldAlert,
  BarChart3,
  LineChart as LineChartIcon,
  Search,
  Filter,
  X,
  ArrowUpDown,
  Sparkles,
  Wallet,
  ArrowRight,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { NewCategoryModal } from '../common/NewCategoryModal';

export const BudgetView: React.FC = () => {
  const {
    budgetAnalysis,
    categories,
    budgets,
    saveBudget,
    selectedYear,
    selectedMonth,
    settings,
    allMonthTransactions,
    todayStr,
  } = useFinance();

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [budgetInput, setBudgetInput] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryToEditModal, setCategoryToEditModal] = useState<Category | null>(null);

  // Active chart view tab
  const [activeChartTab, setActiveChartTab] = useState<
    'comparative' | 'distribution' | 'velocity' | 'variance'
  >('comparative');

  // Distribution chart toggle (real vs budget)
  const [pieMode, setPieMode] = useState<'real' | 'budget'>('real');

  // Table filters & sorting
  const [tableSearch, setTableSearch] = useState('');
  const [tableStatusFilter, setTableStatusFilter] = useState<'all' | 'normal' | 'warning' | 'exceeded'>('all');
  const [tableSortBy, setTableSortBy] = useState<'name' | 'budget' | 'real' | 'available' | 'pct'>('pct');
  const [tableSortAsc, setTableSortAsc] = useState(false);

  const expenseCategories = categories.filter((c) => c.type === 'gasto');

  // Global Totals
  const totalBudgeted = useMemo(
    () => budgetAnalysis.reduce((acc, item) => acc + item.budgetedAmount, 0),
    [budgetAnalysis]
  );
  const totalRealSpent = useMemo(
    () => budgetAnalysis.reduce((acc, item) => acc + item.realSpent, 0),
    [budgetAnalysis]
  );
  const totalProjectedSpent = useMemo(
    () => budgetAnalysis.reduce((acc, item) => acc + item.totalProjected, 0),
    [budgetAnalysis]
  );
  const totalAvailableReal = totalBudgeted - totalRealSpent;
  const projectedMargin = totalBudgeted - totalProjectedSpent;

  const overallExecutionPct = totalBudgeted > 0 ? Math.round((totalRealSpent / totalBudgeted) * 100) : 0;

  // Time & velocity calculations
  const totalDays = useMemo(() => daysInMonth(selectedYear, selectedMonth), [selectedYear, selectedMonth]);
  const currentDay = useMemo(() => {
    if (todayStr) {
      const [y, m, d] = todayStr.split('-').map(Number);
      if (y === selectedYear && m === selectedMonth) {
        return Math.min(totalDays, Math.max(1, d));
      }
    }
    return totalDays;
  }, [todayStr, selectedYear, selectedMonth, totalDays]);

  const timeProgressPct = Math.min(100, Math.round((currentDay / totalDays) * 100));
  const paceDelta = overallExecutionPct - timeProgressPct; // Negative = good (spending slower than time)

  const avgDailySpent = currentDay > 0 ? Math.round(totalRealSpent / currentDay) : 0;
  const remainingDays = Math.max(1, totalDays - currentDay);
  const suggestedDailySpend = Math.max(0, Math.round(Math.max(0, totalAvailableReal) / remainingDays));

  // Category counts by health status
  const budgetedCategories = useMemo(
    () => budgetAnalysis.filter((b) => b.budgetedAmount > 0),
    [budgetAnalysis]
  );
  const inBudgetCount = useMemo(
    () =>
      budgetAnalysis.filter(
        (b) => b.status === 'normal' || b.status === 'en_presupuesto' || b.status === 'ahorro'
      ).length,
    [budgetAnalysis]
  );
  const warningCount = useMemo(
    () => budgetAnalysis.filter((b) => b.status === 'warning' || b.status === 'alerta').length,
    [budgetAnalysis]
  );
  const exceededCount = useMemo(
    () => budgetAnalysis.filter((b) => b.status === 'exceeded' || b.status === 'sobregiro').length,
    [budgetAnalysis]
  );
  const totalOverrunCents = useMemo(() => {
    return budgetAnalysis
      .filter((b) => (b.availableBalance ?? b.availableAmount ?? 0) < 0)
      .reduce((acc, b) => acc + Math.abs(b.availableBalance ?? b.availableAmount ?? 0), 0);
  }, [budgetAnalysis]);

  // Stressed category
  const mostStressedCat = useMemo(() => {
    const list = [...budgetAnalysis].filter(
      (b) => b.budgetedAmount > 0 || (b.realSpent || b.realAmount || 0) > 0
    );
    if (list.length === 0) return null;
    list.sort(
      (a, b) =>
        (b.executionPercentage ?? b.percentUsed ?? 0) - (a.executionPercentage ?? a.percentUsed ?? 0)
    );
    const top = list[0];
    return {
      name: top.category?.name || top.categoryName || 'General',
      pct: top.executionPercentage ?? top.percentUsed ?? 0,
      real: top.realSpent || top.realAmount || 0,
      budget: top.budgetedAmount,
      available: top.availableBalance ?? top.availableAmount ?? 0,
    };
  }, [budgetAnalysis]);

  // Top 3 highest spending categories
  const topSpentCategories = useMemo(() => {
    return [...budgetAnalysis]
      .filter((b) => (b.realSpent || b.realAmount || 0) > 0)
      .sort((a, b) => (b.realSpent || b.realAmount || 0) - (a.realSpent || a.realAmount || 0))
      .slice(0, 3)
      .map((b) => ({
        id: b.category?.id || b.categoryId,
        name: b.category?.name || b.categoryName || 'General',
        color: b.category?.color || b.categoryColor || '#3b82f6',
        real: b.realSpent || b.realAmount || 0,
        budget: b.budgetedAmount,
        pct: b.executionPercentage ?? b.percentUsed ?? 0,
        status: b.status,
      }));
  }, [budgetAnalysis]);

  const projectedSavingsPct =
    totalBudgeted > 0 ? Math.max(0, Math.round((projectedMargin / totalBudgeted) * 100)) : 0;

  // Chart data: Budget vs Real vs Projected
  const chartData = useMemo(() => {
    return budgetAnalysis
      .filter((b) => b.budgetedAmount > 0 || (b.realSpent || b.realAmount || 0) > 0)
      .map((b) => {
        const catName = b.category?.name || b.categoryName || 'General';
        return {
          name: catName.length > 12 ? catName.substring(0, 10) + '...' : catName,
          fullName: catName,
          Presupuestado: centsToDollars(b.budgetedAmount),
          Real: centsToDollars(b.realSpent || b.realAmount || 0),
          Proyectado: centsToDollars(b.totalProjected || b.projectedTotalAmount || 0),
        };
      });
  }, [budgetAnalysis]);

  // Pie Chart: Distribution by Category
  const pieDataReal = useMemo(() => {
    return budgetAnalysis
      .filter((b) => (b.realSpent || b.realAmount || 0) > 0)
      .map((b) => {
        const cat = categories.find((c) => c.id === (b.category?.id || b.categoryId));
        return {
          name: b.category?.name || b.categoryName || 'General',
          value: centsToDollars(b.realSpent || b.realAmount || 0),
          color: cat?.color || b.categoryColor || '#3b82f6',
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [budgetAnalysis, categories]);

  const pieDataBudget = useMemo(() => {
    return budgetAnalysis
      .filter((b) => b.budgetedAmount > 0)
      .map((b) => {
        const cat = categories.find((c) => c.id === (b.category?.id || b.categoryId));
        return {
          name: b.category?.name || b.categoryName || 'General',
          value: centsToDollars(b.budgetedAmount),
          color: cat?.color || b.categoryColor || '#3b82f6',
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [budgetAnalysis, categories]);

  // Velocity Curve Data (Cumulative daily spending vs Linear budget trajectory)
  const velocityCurveData = useMemo(() => {
    const data = [];
    let runningSpend = 0;

    const dailyExpensesMap = new Map<number, number>();
    (allMonthTransactions || []).forEach((tx) => {
      const isExpense =
        tx.type === 'gasto' ||
        tx.type === 'cuota_tarjeta' ||
        tx.type === 'cuota_prestamo' ||
        tx.type === 'suscripcion' ||
        tx.type === 'servicio';
      if (isExpense && tx.date) {
        const dayNum = parseInt(tx.date.split('-')[2], 10);
        if (!isNaN(dayNum)) {
          dailyExpensesMap.set(dayNum, (dailyExpensesMap.get(dayNum) || 0) + tx.amount);
        }
      }
    });

    const totalBudgetDollars = centsToDollars(totalBudgeted);

    for (let day = 1; day <= totalDays; day++) {
      const idealLinear = totalBudgetDollars > 0 ? (day / totalDays) * totalBudgetDollars : 0;
      const dayExpenseCents = dailyExpensesMap.get(day) || 0;

      let realCumulative: number | null = null;
      if (day <= currentDay) {
        runningSpend += dayExpenseCents;
        realCumulative = centsToDollars(runningSpend);
      }

      data.push({
        day: `Día ${day}`,
        dayNum: day,
        MetaLineal: parseFloat(idealLinear.toFixed(2)),
        GastoRealAcumulado: realCumulative !== null ? parseFloat(realCumulative.toFixed(2)) : null,
      });
    }

    return data;
  }, [allMonthTransactions, totalDays, currentDay, totalBudgeted]);

  // Variance Data (Available Margin vs Overrun)
  const varianceData = useMemo(() => {
    return budgetAnalysis
      .filter((b) => b.budgetedAmount > 0 || (b.realSpent || b.realAmount || 0) > 0)
      .map((b) => {
        const catName = b.category?.name || b.categoryName || 'General';
        const available = centsToDollars(b.availableBalance ?? b.availableAmount ?? 0);
        return {
          name: catName.length > 12 ? catName.substring(0, 10) + '...' : catName,
          fullName: catName,
          Disponible: available >= 0 ? available : 0,
          Sobregiro: available < 0 ? Math.abs(available) : 0,
          availableRaw: available,
        };
      })
      .sort((a, b) => a.availableRaw - b.availableRaw);
  }, [budgetAnalysis]);

  // Handlers for in-line edit
  const handleOpenEdit = (categoryId: string, currentBudget: number) => {
    setEditingCategoryId(categoryId);
    setBudgetInput(currentBudget > 0 ? centsToDollars(currentBudget).toFixed(2) : '');
  };

  const handleSaveBudget = async (categoryId: string) => {
    const existing = budgets.find(
      (b) => b.categoryId === categoryId && b.year === selectedYear && b.month === selectedMonth
    );
    const amountCents = dollarsToCents(budgetInput || 0);

    const bgtItem = {
      id: existing ? existing.id : `bgt_${categoryId}_${selectedYear}_${selectedMonth}`,
      year: selectedYear,
      month: selectedMonth,
      categoryId,
      budgetedAmount: amountCents,
    };

    await saveBudget(bgtItem);
    setEditingCategoryId(null);
  };

  // Filtered & sorted table list
  const filteredTableList = useMemo(() => {
    return budgetAnalysis
      .filter((item) => {
        const catName = item.category?.name || item.categoryName || '';
        // Text filter
        if (tableSearch.trim()) {
          const q = tableSearch.toLowerCase();
          if (!catName.toLowerCase().includes(q)) return false;
        }
        // Status filter
        if (tableStatusFilter === 'normal') {
          return item.status === 'normal' || item.status === 'en_presupuesto' || item.status === 'ahorro';
        }
        if (tableStatusFilter === 'warning') {
          return item.status === 'warning' || item.status === 'alerta';
        }
        if (tableStatusFilter === 'exceeded') {
          return item.status === 'exceeded' || item.status === 'sobregiro';
        }
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (tableSortBy === 'name') {
          const nameA = a.category?.name || a.categoryName || '';
          const nameB = b.category?.name || b.categoryName || '';
          diff = nameA.localeCompare(nameB);
        } else if (tableSortBy === 'budget') {
          diff = a.budgetedAmount - b.budgetedAmount;
        } else if (tableSortBy === 'real') {
          diff = (a.realSpent || a.realAmount || 0) - (b.realSpent || b.realAmount || 0);
        } else if (tableSortBy === 'available') {
          diff = (a.availableBalance ?? a.availableAmount ?? 0) - (b.availableBalance ?? b.availableAmount ?? 0);
        } else if (tableSortBy === 'pct') {
          diff = (a.executionPercentage ?? a.percentUsed ?? 0) - (b.executionPercentage ?? b.percentUsed ?? 0);
        }
        return tableSortAsc ? diff : -diff;
      });
  }, [budgetAnalysis, tableSearch, tableStatusFilter, tableSortBy, tableSortAsc]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <PieChartIcon className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">
              Análisis & Control de Presupuesto Mensual
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
              {MONTH_NAMES_ES[selectedMonth - 1]} {selectedYear}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Monitorea el cumplimiento por categoría, ritmo de consumo diario y márgenes proyectados
          </p>
        </div>

        <button
          onClick={() => setIsCategoryModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/20 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Categoría</span>
        </button>
      </div>

      {/* Row 1: Primary Allocation & Execution Cards (4 KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Presupuesto Asignado Total */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Presupuesto Total
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight">
            {formatMoney(totalBudgeted, settings.currencySymbol)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{budgetedCategories.length} de {expenseCategories.length} con meta</span>
            <span className="font-mono text-slate-300">100% Meta</span>
          </div>
        </div>

        {/* Card 2: Gasto Real Acumulado */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Gasto Real Acumulado
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-400 font-mono tracking-tight">
            {formatMoney(totalRealSpent, settings.currencySymbol)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>
              {overallExecutionPct}% consumido (Día {currentDay}/{totalDays})
            </span>
            <span
              className={`font-mono font-bold ${
                paceDelta > 5 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {paceDelta > 0 ? `+${paceDelta}% ritmo` : `${paceDelta}% ritmo`}
            </span>
          </div>
        </div>

        {/* Card 3: Saldo Disponible Real */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Margen Disponible Real
            </span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                totalAvailableReal < 0
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              }`}
            >
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-black font-mono tracking-tight ${
              totalAvailableReal < 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {formatMoney(totalAvailableReal, settings.currencySymbol)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totalAvailableReal < 0
              ? 'Sobregiro real sobre la meta total'
              : 'Presupuesto no consumido al momento'}
          </div>
        </div>

        {/* Card 4: Gasto Total Proyectado */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Cierre Mensual Estimado
            </span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                projectedMargin < 0
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                  : 'bg-sky-500/15 border-sky-500/30 text-sky-400'
              }`}
            >
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-black font-mono tracking-tight ${
              projectedMargin < 0 ? 'text-rose-400' : 'text-sky-300'
            }`}
          >
            {formatMoney(totalProjectedSpent, settings.currencySymbol)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Real + Planificado pendiente</span>
            <span
              className={`font-mono font-bold ${
                projectedMargin < 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {projectedMargin >= 0
                ? `Margen +${formatMoney(projectedMargin, settings.currencySymbol)}`
                : `Exceso ${formatMoney(Math.abs(projectedMargin), settings.currencySymbol)}`}
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Secondary Health, Velocity & Strategic Cards (4 KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 5: Semáforo de Cumplimiento */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 relative overflow-hidden shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Semáforo de Categorías
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-center gap-2 py-1">
            <div className="flex-1 bg-slate-950/70 p-2 rounded-xl border border-slate-800 text-center">
              <span className="text-base font-black text-emerald-400 font-mono block">
                {inBudgetCount}
              </span>
              <span className="text-[9px] text-slate-400 uppercase font-semibold">En Meta</span>
            </div>
            <div className="flex-1 bg-slate-950/70 p-2 rounded-xl border border-slate-800 text-center">
              <span className="text-base font-black text-amber-400 font-mono block">
                {warningCount}
              </span>
              <span className="text-[9px] text-slate-400 uppercase font-semibold">Alerta 80%</span>
            </div>
            <div className="flex-1 bg-slate-950/70 p-2 rounded-xl border border-slate-800 text-center">
              <span className="text-base font-black text-rose-400 font-mono block">
                {exceededCount}
              </span>
              <span className="text-[9px] text-slate-400 uppercase font-semibold">Excedidas</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            {exceededCount > 0
              ? `Sobregiro acumulado: ${formatMoney(totalOverrunCents, settings.currencySymbol)}`
              : '100% de categorías dentro del límite'}
          </div>
        </div>

        {/* Card 6: Ritmo Diario de Gasto (Burn Rate) */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 relative overflow-hidden shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Ritmo de Gasto Diario
            </span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-300 font-mono tracking-tight">
              {formatMoney(avgDailySpent, settings.currencySymbol)}
              <span className="text-xs font-normal text-slate-400 ml-1">/ día real</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Límite sugerido restante:{' '}
              <strong className="text-white font-mono">
                {formatMoney(suggestedDailySpend, settings.currencySymbol)} / día
              </strong>
            </div>
          </div>
          <div className="text-[10px] text-slate-400">
            Quedan {remainingDays} días en el mes para mantener la meta
          </div>
        </div>

        {/* Card 7: Categoría con Mayor Tensión */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 relative overflow-hidden shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Mayor Tensión de Gasto
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <div className="text-lg font-black text-white truncate">
              {mostStressedCat ? mostStressedCat.name : 'Sin categorías'}
            </div>
            <div className="flex items-center justify-between mt-1 text-xs">
              <span className="font-mono font-bold text-rose-400">
                {mostStressedCat ? `${mostStressedCat.pct}% consumido` : '0%'}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {mostStressedCat
                  ? formatMoney(mostStressedCat.real, settings.currencySymbol)
                  : '$0.00'}
              </span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            {mostStressedCat && mostStressedCat.available < 0
              ? `Excedido por ${formatMoney(Math.abs(mostStressedCat.available), settings.currencySymbol)}`
              : mostStressedCat
              ? `Margen disponible: ${formatMoney(mostStressedCat.available, settings.currencySymbol)}`
              : 'En rango'}
          </div>
        </div>

        {/* Card 8: Tasa de Ahorro Presupuestario */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 relative overflow-hidden shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Ahorro Proyectado en Meta
            </span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
              {formatMoney(Math.max(0, projectedMargin), settings.currencySymbol)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>{projectedSavingsPct}% de tasa de reserva</span>
              <span className="text-emerald-400 font-mono font-bold">
                {projectedMargin > 0 ? '✓ Superávit' : 'Equilibrado'}
              </span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400">
            Margen de holgura que se convertirá en ahorro neto al fin de mes
          </div>
        </div>
      </div>

      {/* Top 3 Highest Spending Categories Quick Ranking Bar */}
      {topSpentCategories.length > 0 && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-2.5 shadow-lg">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <div className="flex items-center gap-2 text-white">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Top 3 Rubros con Mayor Concentración de Gasto Real</span>
            </div>
            <span className="text-[11px] text-slate-400 font-normal">
              Representan{' '}
              <strong className="text-white">
                {totalRealSpent > 0
                  ? Math.round(
                      (topSpentCategories.reduce((acc, c) => acc + c.real, 0) / totalRealSpent) * 100
                    )
                  : 0}
                %
              </strong>{' '}
              del gasto total
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {topSpentCategories.map((top, idx) => (
              <div
                key={top.id}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between gap-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-black text-slate-300">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-bold text-white truncate">{top.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-400 shrink-0">
                    {formatMoney(top.real, settings.currencySymbol)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>
                    Meta: {formatMoney(top.budget, settings.currencySymbol)}
                  </span>
                  <span
                    className={`font-mono font-bold ${
                      top.pct > 100
                        ? 'text-rose-400'
                        : top.pct >= 80
                        ? 'text-amber-400'
                        : 'text-slate-300'
                    }`}
                  >
                    {top.pct}% usado
                  </span>
                </div>

                <div className="w-full bg-slate-850 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      top.pct > 100
                        ? 'bg-rose-500'
                        : top.pct >= 80
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(100, top.pct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Multi-Chart Visual Analytics Section */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
        {/* Chart Selector Tabs Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <span>Visualización Gráfica del Presupuesto</span>
            </h3>
            <p className="text-xs text-slate-400">
              Explora diferentes perspectivas analíticas para comprender tus hábitos de gasto
            </p>
          </div>

          {/* Chart View Mode Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-xl overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveChartTab('comparative')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeChartTab === 'comparative'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Comparativa (Barras)</span>
            </button>

            <button
              onClick={() => setActiveChartTab('distribution')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeChartTab === 'distribution'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <PieChartIcon className="w-3.5 h-3.5" />
              <span>Distribución (Torta)</span>
            </button>

            <button
              onClick={() => setActiveChartTab('velocity')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeChartTab === 'velocity'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span>Ritmo Día a Día (Burn Rate)</span>
            </button>

            <button
              onClick={() => setActiveChartTab('variance')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeChartTab === 'variance'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Desviaciones (Márgenes)</span>
            </button>
          </div>
        </div>

        {/* Chart View 1: Comparative Bar Chart */}
        {activeChartTab === 'comparative' && (
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
              <span>Comparación directa por rubro en dólares</span>
              <div className="flex items-center gap-4 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-slate-600 inline-block" />
                  <span>Presupuestado</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block" />
                  <span>Gasto Real</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" />
                  <span>Proyectado</span>
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 shadow-2xl text-xs space-y-1">
                            <div className="font-bold text-white border-b border-slate-800 pb-1">
                              {data.fullName}
                            </div>
                            <div className="text-slate-300">
                              Presupuestado: ${data.Presupuestado.toFixed(2)}
                            </div>
                            <div className="text-blue-400 font-bold">
                              Gasto Real: ${data.Real.toFixed(2)}
                            </div>
                            <div className="text-amber-400">
                              Total Proyectado: ${data.Proyectado.toFixed(2)}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="Presupuestado" fill="#475569" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Real" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Proyectado" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Chart View 2: Distribution Pie / Donut Chart */}
        {activeChartTab === 'distribution' && (
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
              <span>Distribución porcentual por categorías</span>
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-0.5 rounded-lg text-xs">
                <button
                  onClick={() => setPieMode('real')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                    pieMode === 'real'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Gasto Real (${centsToDollars(totalRealSpent).toFixed(2)})
                </button>
                <button
                  onClick={() => setPieMode('budget')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                    pieMode === 'budget'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Presupuesto Asignado (${centsToDollars(totalBudgeted).toFixed(2)})
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={pieMode === 'real' ? pieDataReal : pieDataBudget}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                      stroke="#0f172a"
                      strokeWidth={2}
                    >
                      {(pieMode === 'real' ? pieDataReal : pieDataBudget).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0];
                          const total = pieMode === 'real' ? totalRealSpent : totalBudgeted;
                          const pct = total > 0 ? Math.round(((Number(item.value) * 100) / total) * 100) : 0;
                          return (
                            <div className="rounded-xl bg-slate-950 border border-slate-800 p-2.5 shadow-2xl text-xs space-y-0.5">
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: item.payload?.color }}
                                />
                                <span>{item.name}</span>
                              </div>
                              <div className="text-sky-400 font-mono font-bold">
                                ${Number(item.value).toFixed(2)}
                              </div>
                              <div className="text-[10px] text-slate-400">{pct}% de participación</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>

              {/* Category Breakdown legend list */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {(pieMode === 'real' ? pieDataReal : pieDataBudget).map((item) => {
                  const total = pieMode === 'real' ? centsToDollars(totalRealSpent) : centsToDollars(totalBudgeted);
                  const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                  return (
                    <div
                      key={item.name}
                      className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-semibold text-white truncate">{item.name}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-slate-200 mr-2">
                          ${item.value.toFixed(2)}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Chart View 3: Daily Spend Velocity Curve (Burn Rate vs Linear Target) */}
        {activeChartTab === 'velocity' && (
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
              <span>
                Trayectoria del gasto acumulado día a día vs avance lineal ideal del mes
              </span>
              <div className="flex items-center gap-4 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-slate-500 inline-block" />
                  <span>Meta Lineal Teórica</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block" />
                  <span>Gasto Real Acumulado</span>
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={velocityCurveData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="dayNum"
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `D${v}`}
                  />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 shadow-2xl text-xs space-y-1">
                            <div className="font-bold text-white border-b border-slate-800 pb-1">
                              {item.day} de {MONTH_NAMES_ES[selectedMonth - 1]}
                            </div>
                            <div className="text-slate-400">
                              Límite Teórico Lineal: ${item.MetaLineal.toFixed(2)}
                            </div>
                            {item.GastoRealAcumulado !== null ? (
                              <div className="text-blue-400 font-bold">
                                Gasto Real Acumulado: ${item.GastoRealAcumulado.toFixed(2)}
                              </div>
                            ) : (
                              <div className="text-slate-500 italic">Día futuro sin ejecutar</div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="MetaLineal"
                    stroke="#64748b"
                    strokeDasharray="4 4"
                    fill="none"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="GastoRealAcumulado"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#velocityGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              💡 Si la curva azul está <strong>por debajo</strong> de la línea punteada gris, tu ritmo de gasto está controlado y generarás ahorro al cierre.
            </p>
          </div>
        )}

        {/* Chart View 4: Variance Analysis (Disponible vs Sobregiro) */}
        {activeChartTab === 'variance' && (
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
              <span>Márgenes restantes disponibles vs excesos sobre el presupuesto</span>
              <div className="flex items-center gap-4 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />
                  <span>Disponible (Superávit)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" />
                  <span>Sobregiro (Exceso)</span>
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={varianceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const isOver = data.availableRaw < 0;
                        return (
                          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 shadow-2xl text-xs space-y-1">
                            <div className="font-bold text-white border-b border-slate-800 pb-1">
                              {data.fullName}
                            </div>
                            {isOver ? (
                              <div className="text-rose-400 font-bold">
                                Exceso sobre presupuesto: ${data.Sobregiro.toFixed(2)}
                              </div>
                            ) : (
                              <div className="text-emerald-400 font-bold">
                                Margen disponible restante: ${data.Disponible.toFixed(2)}
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="Disponible" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Sobregiro" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Categories Table with Search & Smart Filtering */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-blue-400" />
              <span>Presupuesto por Categoría & Alertas de Cumplimiento</span>
            </h3>
            <p className="text-xs text-slate-400">
              Control preventivo al 80% y alerta crítica al superar el 100%
            </p>
          </div>

          {/* Search & Status Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Filtrar categoría..."
                className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 w-36 sm:w-44"
              />
              {tableSearch && (
                <button
                  onClick={() => setTableSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <select
              value={tableStatusFilter}
              onChange={(e) => setTableStatusFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">Todas ({budgetAnalysis.length})</option>
              <option value="normal">En Meta ({inBudgetCount})</option>
              <option value="warning">Alerta 80% ({warningCount})</option>
              <option value="exceeded">Sobregiro ({exceededCount})</option>
            </select>

            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nueva</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th
                  onClick={() => {
                    if (tableSortBy === 'name') setTableSortAsc(!tableSortAsc);
                    else {
                      setTableSortBy('name');
                      setTableSortAsc(true);
                    }
                  }}
                  className="py-3 px-4 cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Categoría</span>
                    {tableSortBy === 'name' && (
                      <ArrowUpDown className="w-3 h-3 text-blue-400" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => {
                    if (tableSortBy === 'budget') setTableSortAsc(!tableSortAsc);
                    else {
                      setTableSortBy('budget');
                      setTableSortAsc(false);
                    }
                  }}
                  className="py-3 px-3 text-right cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Presupuesto</span>
                    {tableSortBy === 'budget' && (
                      <ArrowUpDown className="w-3 h-3 text-blue-400" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => {
                    if (tableSortBy === 'real') setTableSortAsc(!tableSortAsc);
                    else {
                      setTableSortBy('real');
                      setTableSortAsc(false);
                    }
                  }}
                  className="py-3 px-3 text-right cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Gasto Real</span>
                    {tableSortBy === 'real' && (
                      <ArrowUpDown className="w-3 h-3 text-blue-400" />
                    )}
                  </div>
                </th>
                <th className="py-3 px-3 text-right">Pendiente Plan.</th>
                <th className="py-3 px-3 text-right">Total Proyectado</th>
                <th
                  onClick={() => {
                    if (tableSortBy === 'available') setTableSortAsc(!tableSortAsc);
                    else {
                      setTableSortBy('available');
                      setTableSortAsc(true);
                    }
                  }}
                  className="py-3 px-3 text-right cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Saldo Disponible</span>
                    {tableSortBy === 'available' && (
                      <ArrowUpDown className="w-3 h-3 text-blue-400" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => {
                    if (tableSortBy === 'pct') setTableSortAsc(!tableSortAsc);
                    else {
                      setTableSortBy('pct');
                      setTableSortAsc(false);
                    }
                  }}
                  className="py-3 px-4 cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Progreso / Alerta</span>
                    {tableSortBy === 'pct' && (
                      <ArrowUpDown className="w-3 h-3 text-blue-400" />
                    )}
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredTableList.map((item) => {
                const catId = item.category?.id || item.categoryId;
                const catName = item.category?.name || item.categoryName || 'General';
                const isEditing = editingCategoryId === catId;

                return (
                  <tr key={catId} className="hover:bg-slate-850/60 transition group">
                    {/* Category Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              item.category?.color || item.categoryColor || '#3b82f6',
                          }}
                        />
                        <div className="font-bold text-white truncate max-w-[160px] sm:max-w-none">
                          {catName}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const foundCat =
                              categories.find((c) => c.id === catId) || item.category || null;
                            setCategoryToEditModal(foundCat);
                            setIsCategoryModalOpen(true);
                          }}
                          className="opacity-0 group-hover:opacity-100 hover:opacity-100 text-slate-500 hover:text-blue-400 p-1 rounded transition cursor-pointer"
                          title={`Editar categoría "${catName}"`}
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    {/* Presupuesto */}
                    <td className="py-3.5 px-3 text-right font-mono font-semibold text-white">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          autoFocus
                          value={budgetInput}
                          onChange={(e) => setBudgetInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveBudget(catId);
                            if (e.key === 'Escape') setEditingCategoryId(null);
                          }}
                          className="w-24 bg-slate-950 border border-blue-500 rounded px-2 py-1 text-right text-white focus:outline-none"
                        />
                      ) : (
                        formatMoney(item.budgetedAmount, settings.currencySymbol)
                      )}
                    </td>

                    {/* Gasto Real */}
                    <td className="py-3.5 px-3 text-right font-mono text-blue-400 font-bold">
                      {formatMoney(item.realSpent || item.realAmount || 0, settings.currencySymbol)}
                    </td>

                    {/* Pendiente Planificado */}
                    <td className="py-3.5 px-3 text-right font-mono text-slate-400">
                      {formatMoney(
                        item.plannedPendingSpent || item.plannedPendingAmount || 0,
                        settings.currencySymbol
                      )}
                    </td>

                    {/* Total Proyectado */}
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-200">
                      {formatMoney(
                        item.totalProjected || item.projectedTotalAmount || 0,
                        settings.currencySymbol
                      )}
                    </td>

                    {/* Saldo Disponible */}
                    <td className="py-3.5 px-3 text-right font-mono font-bold">
                      <span
                        className={
                          (item.availableBalance ?? item.availableAmount ?? 0) < 0
                            ? 'text-rose-400'
                            : (item.availableBalance ?? item.availableAmount ?? 0) < 2000
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }
                      >
                        {formatMoney(
                          item.availableBalance ?? item.availableAmount ?? 0,
                          settings.currencySymbol
                        )}
                      </span>
                    </td>

                    {/* Progress Bar & Alert */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1.5 min-w-[130px]">
                        <div className="flex items-center justify-between text-[10px]">
                          <span
                            className={`font-bold font-mono ${
                              item.status === 'exceeded' || item.status === 'sobregiro'
                                ? 'text-rose-400'
                                : item.status === 'warning' || item.status === 'alerta'
                                ? 'text-amber-400'
                                : 'text-slate-300'
                            }`}
                          >
                            {item.executionPercentage ?? item.percentUsed ?? 0}%
                          </span>

                          {(item.status === 'exceeded' || item.status === 'sobregiro') && (
                            <span className="flex items-center gap-1 text-rose-400 font-bold">
                              <AlertCircle className="w-3 h-3" /> Sobrepasado
                            </span>
                          )}
                          {(item.status === 'warning' || item.status === 'alerta') && (
                            <span className="flex items-center gap-1 text-amber-400 font-semibold">
                              <AlertTriangle className="w-3 h-3" /> Alerta 80%
                            </span>
                          )}
                          {(item.status === 'normal' || item.status === 'en_presupuesto') &&
                            item.budgetedAmount > 0 && (
                              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                                <CheckCircle2 className="w-3 h-3" /> En Meta
                              </span>
                            )}
                        </div>

                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              item.status === 'exceeded' || item.status === 'sobregiro'
                                ? 'bg-rose-500'
                                : item.status === 'warning' || item.status === 'alerta'
                                ? 'bg-amber-500'
                                : 'bg-blue-500'
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                item.executionPercentage ?? item.percentUsed ?? 0
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleSaveBudget(catId)}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold cursor-pointer"
                          >
                            OK
                          </button>
                          <button
                            onClick={() => setEditingCategoryId(null)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] cursor-pointer"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenEdit(catId, item.budgetedAmount)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                          title="Asignar o modificar presupuesto"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer Totals */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-400">
            Mostrando <strong className="text-white">{filteredTableList.length}</strong> de{' '}
            <strong className="text-white">{budgetAnalysis.length}</strong> categorías de gasto
          </span>

          <div className="flex items-center gap-5 text-xs font-mono font-bold">
            <div>
              <span className="text-slate-400 font-sans font-normal mr-1.5">Presupuesto:</span>
              <span className="text-white">
                {formatMoney(
                  filteredTableList.reduce((acc, i) => acc + i.budgetedAmount, 0),
                  settings.currencySymbol
                )}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-sans font-normal mr-1.5">Gasto Real:</span>
              <span className="text-blue-400">
                {formatMoney(
                  filteredTableList.reduce((acc, i) => acc + (i.realSpent || i.realAmount || 0), 0),
                  settings.currencySymbol
                )}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-sans font-normal mr-1.5">Disponible:</span>
              <span
                className={
                  filteredTableList.reduce(
                    (acc, i) => acc + (i.availableBalance ?? i.availableAmount ?? 0),
                    0
                  ) < 0
                    ? 'text-rose-400'
                    : 'text-emerald-400'
                }
              >
                {formatMoney(
                  filteredTableList.reduce(
                    (acc, i) => acc + (i.availableBalance ?? i.availableAmount ?? 0),
                    0
                  ),
                  settings.currencySymbol
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      <NewCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setCategoryToEditModal(null);
        }}
        categoryToEdit={categoryToEditModal}
        defaultType="gasto"
      />
    </div>
  );
};
