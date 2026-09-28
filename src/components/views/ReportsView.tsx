import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatMoney, centsToDollars, daysInMonth, MONTH_NAMES_ES } from '../../utils/formatters';
import {
  BarChart3,
  Lock,
  Unlock,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Calendar,
  PieChart as PieIcon,
  CreditCard,
  Wallet,
  Coins,
  ArrowUpRight,
  AlertTriangle,
  AlertCircle,
  Award,
  Sparkles,
  Printer,
  FileSpreadsheet,
  Download,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  ArrowUpDown,
  Layers,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Building2,
  Target,
  Percent,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  AreaChart,
  Area,
} from 'recharts';

const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#14b8a6', // teal
  '#6366f1', // indigo
  '#e11d48', // rose
  '#a855f7', // violet
  '#84cc16', // lime
];

export const ReportsView: React.FC = () => {
  const {
    selectedYear,
    selectedMonth,
    executiveSummary,
    budgetAnalysis,
    allMonthTransactions,
    categories,
    monthlyCloses,
    closeCurrentMonth,
    reopenMonth,
    settings,
    accounts,
    creditCards,
  } = useFinance();

  const [closeNotes, setCloseNotes] = useState('');
  const [isConfirmingClose, setIsConfirmingClose] = useState(false);

  // Active View Tab in the Visual Analytics Section
  const [activeTab, setActiveTab] = useState<'concentration' | 'daily_flow' | 'payment_methods'>('concentration');

  // Interactive Category & Payment Method Filters
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Table search & status filters
  const [tableSearch, setTableSearch] = useState('');
  const [tableStatusFilter, setTableStatusFilter] = useState<'all' | 'realizado' | 'planificado'>('all');

  const monthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const currentMonthClose = monthlyCloses.find((c) => c.id === monthKey && c.isClosed);

  const handleSelectCategory = (catName: string) => {
    if (selectedCategoryName?.toLowerCase() === catName.toLowerCase()) {
      // Toggle off
      setSelectedCategoryName(null);
    } else {
      setSelectedCategoryName(catName);
      // Auto-expand that category
      const found = categories.find((c) => c.name.toLowerCase() === catName.toLowerCase());
      if (found) {
        setExpandedCategories((prev) => ({ ...prev, [found.id]: true }));
      } else {
        const bgt = budgetAnalysis.find((b) => (b.category?.name || b.categoryName)?.toLowerCase() === catName.toLowerCase());
        if (bgt) {
          const id = bgt.category?.id || bgt.categoryId;
          setExpandedCategories((prev) => ({ ...prev, [id]: true }));
        }
      }
      // Scroll to table smoothly
      setTimeout(() => {
        const el = document.getElementById('audit-category-table');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  const toggleExpandCategory = (catId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const handleExecuteClose = async () => {
    await closeCurrentMonth(closeNotes.trim() || undefined);
    setIsConfirmingClose(false);
    setCloseNotes('');
  };

  const handleReopen = async (year: number, month: number) => {
    await reopenMonth(year, month);
  };

  // Export full monthly report in CSV/Excel formatted text
  const handleExportMonthCSV = () => {
    const monthName = MONTH_NAMES_ES[selectedMonth - 1];
    const headers = ['Fecha', 'Concepto', 'Tipo', 'Categoría', 'Monto', 'Estado', 'Medio de Pago', 'Notas'];
    const rows = allMonthTransactions.map((tx) => {
      const cat = categories.find((c) => c.id === tx.categoryId);
      return [
        tx.date,
        `"${(tx.concept || '').replace(/"/g, '""')}"`,
        tx.type,
        `"${cat?.name || 'General'}"`,
        (tx.amount / 100).toFixed(2),
        tx.status,
        tx.paymentMethodType,
        `"${(tx.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const summaryHeaders = [
      '',
      '',
      `"REPORTE MENSUAL NEXA FINANCE - ${monthName.toUpperCase()} ${selectedYear}"`,
      '',
      '',
      '',
      '',
      '',
    ];
    const kpiRows = [
      ['', 'Ingresos Realizados', (executiveSummary.totalRealizedIncome / 100).toFixed(2)],
      ['', 'Gastos Realizados', (executiveSummary.totalRealizedExpense / 100).toFixed(2)],
      ['', 'Ahorro Neto', (executiveSummary.netRealSavings / 100).toFixed(2)],
      ['', 'Saldo Bancos y Efectivo', (executiveSummary.currentRealCashBalance / 100).toFixed(2)],
      ['', 'Deuda Total', (executiveSummary.totalDebt / 100).toFixed(2)],
      [''],
    ];

    const csvContent =
      '\uFEFF' +
      summaryHeaders.join(',') +
      '\n' +
      kpiRows.map((r) => r.join(',')).join('\n') +
      headers.join(',') +
      '\n' +
      rows.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reporte_${monthName}_${selectedYear}_NexaFinance.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  // 1. Gastos por categoría para el Gráfico de Pastel ("¿En qué se gastó más?")
  const expensesByCategoryData = useMemo(() => {
    const totalSpent = executiveSummary.totalRealizedExpense;
    if (totalSpent === 0) return [];

    return budgetAnalysis
      .filter((item) => (item.realSpent || item.actualSpent || 0) > 0)
      .map((item, idx) => {
        const spent = item.realSpent || item.actualSpent || 0;
        const name = item.category?.name || item.categoryName || 'General';
        return {
          name,
          value: spent / 100, // dollars for recharts
          cents: spent,
          percentage: ((spent / totalSpent) * 100).toFixed(1),
          color: item.category?.color || CHART_COLORS[idx % CHART_COLORS.length],
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [budgetAnalysis, executiveSummary.totalRealizedExpense]);

  // 2. Análisis de Presupuesto vs Real ("¿Dónde se ahorró vs dónde hubo sobrecosto?")
  const budgetComparisonData = useMemo(() => {
    return budgetAnalysis
      .filter((item) => item.budgetedAmount > 0 || (item.realSpent || item.actualSpent || 0) > 0)
      .map((item) => {
        const spent = item.realSpent || item.actualSpent || 0;
        const ahorro = item.budgetedAmount - spent;
        const name = item.category?.name || item.categoryName || 'General';
        return {
          name: name.length > 14 ? `${name.substring(0, 12)}...` : name,
          fullName: name,
          presupuestado: item.budgetedAmount / 100,
          real: spent / 100,
          ahorro: ahorro / 100,
          ahorroCents: ahorro,
          presupuestadoCents: item.budgetedAmount,
          realCents: spent,
        };
      })
      .sort((a, b) => b.presupuestado - a.presupuestado);
  }, [budgetAnalysis]);

  // Categorías con mayor ahorro logrado
  const topSavingsCategories = useMemo(() => {
    return budgetComparisonData
      .filter((item) => item.ahorroCents > 0)
      .sort((a, b) => b.ahorroCents - a.ahorroCents)
      .slice(0, 4);
  }, [budgetComparisonData]);

  // Categorías con mayor sobrecosto / sobregiro
  const topOverspentCategories = useMemo(() => {
    return budgetComparisonData
      .filter((item) => item.ahorroCents < 0)
      .sort((a, b) => a.ahorroCents - b.ahorroCents) // most negative first
      .slice(0, 4);
  }, [budgetComparisonData]);

  // 3. Top 5 gastos individuales más grandes del mes
  const topIndividualExpenses = useMemo(() => {
    const catMap = new Map(categories.map((c) => [c.id, c.name]));
    return allMonthTransactions
      .filter((tx) => tx.type === 'gasto' || tx.type === 'cuota_tarjeta' || tx.type === 'servicio')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((tx) => ({
        ...tx,
        categoryName: catMap.get(tx.categoryId || '') || 'Sin categoría',
      }));
  }, [allMonthTransactions, categories]);

  // 4. Distribución por Medio de Pago
  const paymentMethodData = useMemo(() => {
    let cash = 0;
    let bank = 0;
    let credit = 0;

    allMonthTransactions
      .filter((tx) => tx.type === 'gasto' || tx.type === 'cuota_tarjeta' || tx.type === 'servicio' || tx.type === 'suscripcion')
      .forEach((tx) => {
        if (tx.paymentMethodType === 'efectivo') cash += tx.amount;
        else if (tx.paymentMethodType === 'tarjeta_credito') credit += tx.amount;
        else bank += tx.amount;
      });

    const total = cash + bank + credit;
    if (total === 0) return [];

    return [
      { key: 'tarjeta_credito', name: 'Tarjetas de Crédito', value: credit / 100, cents: credit, color: '#f59e0b', icon: CreditCard },
      { key: 'cuenta_bancaria', name: 'Cuentas & Débito', value: bank / 100, cents: bank, color: '#3b82f6', icon: Wallet },
      { key: 'efectivo', name: 'Efectivo', value: cash / 100, cents: cash, color: '#10b981', icon: Coins },
    ].filter((m) => m.cents > 0);
  }, [allMonthTransactions]);

  // 5. Daily Inflows vs Outflows Flow Data for Tab 2
  const dailyFlowData = useMemo(() => {
    const totalDays = daysInMonth(selectedYear, selectedMonth);
    const dayMap = new Map<number, { day: number; income: number; expense: number }>();

    for (let d = 1; d <= totalDays; d++) {
      dayMap.set(d, { day: d, income: 0, expense: 0 });
    }

    allMonthTransactions.forEach((tx) => {
      if (tx.status === 'cancelado' || tx.type === 'transferencia') return;
      if (!tx.date) return;
      const dayNum = parseInt(tx.date.split('-')[2], 10);
      if (dayMap.has(dayNum)) {
        const item = dayMap.get(dayNum)!;
        if (tx.type === 'ingreso' || tx.type === 'retiro_ahorro') {
          item.income += tx.amount;
        } else {
          item.expense += tx.amount;
        }
      }
    });

    return Array.from(dayMap.values()).map((d) => ({
      dayLabel: `Día ${d.day}`,
      dayNum: d.day,
      Ingresos: centsToDollars(d.income),
      Gastos: centsToDollars(d.expense),
      incomeCents: d.income,
      expenseCents: d.expense,
    }));
  }, [allMonthTransactions, selectedYear, selectedMonth]);

  // Financial Health Score Calculation (0 to 100)
  const healthScore = useMemo(() => {
    let score = 50; // base

    // Savings rate impact (+-25)
    if (executiveSummary.totalRealizedIncome > 0) {
      const savingsRate = executiveSummary.netRealSavings / executiveSummary.totalRealizedIncome;
      if (savingsRate >= 0.2) score += 25;
      else if (savingsRate >= 0.1) score += 15;
      else if (savingsRate >= 0) score += 5;
      else score -= 20; // Deficit
    }

    // Budget overruns impact (+-25)
    const overruns = budgetAnalysis.filter((b) => (b.availableBalance ?? b.availableAmount ?? 0) < 0).length;
    if (overruns === 0) score += 25;
    else if (overruns <= 2) score += 10;
    else score -= 15;

    return Math.max(10, Math.min(100, Math.round(score)));
  }, [executiveSummary, budgetAnalysis]);

  const scoreLabel =
    healthScore >= 80 ? 'Excelente Salud' : healthScore >= 60 ? 'Manejo Saludable' : 'Atención Requerida';
  const scoreColor =
    healthScore >= 80 ? 'text-emerald-400' : healthScore >= 60 ? 'text-amber-400' : 'text-rose-400';
  const scoreBadgeBg =
    healthScore >= 80
      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
      : healthScore >= 60
      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
      : 'bg-rose-500/10 border-rose-500/30 text-rose-400';

  // Filtered Categories for the Audit Table
  const filteredCategoryList = useMemo(() => {
    return budgetAnalysis
      .filter((b) => {
        const catName = b.category?.name || b.categoryName || '';

        // If interactive filter from chart is active
        if (selectedCategoryName) {
          if (catName.toLowerCase() !== selectedCategoryName.toLowerCase()) {
            return false;
          }
        }

        // Text search
        if (tableSearch.trim()) {
          const q = tableSearch.toLowerCase();
          const matchesCat = catName.toLowerCase().includes(q);
          const hasMatchingTx = allMonthTransactions.some(
            (tx) =>
              (tx.categoryId === (b.category?.id || b.categoryId)) &&
              (tx.concept?.toLowerCase().includes(q) || tx.notes?.toLowerCase().includes(q))
          );
          if (!matchesCat && !hasMatchingTx) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const spentA = a.realSpent || a.actualSpent || 0;
        const spentB = b.realSpent || b.actualSpent || 0;
        return spentB - spentA;
      });
  }, [budgetAnalysis, selectedCategoryName, tableSearch, allMonthTransactions]);

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1">
          <div className="font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
            <span>{data.name}</span>
          </div>
          <div className="font-mono text-emerald-400 font-bold">
            {formatMoney(data.cents, settings.currencySymbol)}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            Representa el {data.percentage}% del total gastado
          </div>
          <div className="text-[10px] text-blue-400 pt-1 font-semibold">
            Toca para filtrar y ver movimientos ↗
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const pData = payload[0]?.payload;
      if (!pData) return null;
      return (
        <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1">
          <div className="font-bold text-white mb-1">{pData.fullName}</div>
          <div className="flex justify-between gap-4 text-slate-300">
            <span>Presupuestado:</span>
            <span className="font-mono text-slate-100 font-bold">
              {formatMoney(pData.presupuestadoCents, settings.currencySymbol)}
            </span>
          </div>
          <div className="flex justify-between gap-4 text-slate-300">
            <span>Gasto Real:</span>
            <span className="font-mono text-rose-400 font-bold">
              {formatMoney(pData.realCents, settings.currencySymbol)}
            </span>
          </div>
          <div className="pt-1.5 border-t border-slate-800 flex justify-between gap-4">
            <span className="text-slate-400">
              {pData.ahorroCents >= 0 ? 'Ahorro generado:' : 'Sobrecosto:'}
            </span>
            <span
              className={`font-mono font-bold ${
                pData.ahorroCents >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {pData.ahorroCents >= 0 ? '+' : ''}
              {formatMoney(pData.ahorroCents, settings.currencySymbol)}
            </span>
          </div>
          <div className="text-[10px] text-blue-400 pt-1 font-semibold">
            Toca para filtrar y ver movimientos ↗
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-white">
              Cierre Contable & Análisis Visual del Mes — {MONTH_NAMES_ES[selectedMonth - 1]} {selectedYear}
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
              Auditoría
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Auditoría de variaciones, gráficos interactivos con desglose de movimientos y cierre formal de período
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Export to Excel / CSV */}
          <button
            onClick={handleExportMonthCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-semibold text-xs transition cursor-pointer"
            title="Descargar datos del mes formateados para Microsoft Excel o Google Sheets"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel / CSV</span>
          </button>

          {/* Printable / PDF Report */}
          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition cursor-pointer"
            title="Imprimir reporte formal o guardar como archivo PDF"
          >
            <Printer className="w-3.5 h-3.5 text-sky-400" />
            <span>Imprimir / PDF</span>
          </button>

          {currentMonthClose ? (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Mes Auditado & Cerrado</span>
              </span>
              <button
                onClick={() => handleReopen(selectedYear, selectedMonth)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Reabrir</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsConfirmingClose(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white shadow-md shadow-blue-600/30 transition cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Cerrar Mes</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards: Resumen Ejecutivo del Cierre & Score Financiero */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Score Financiero del Cierre */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              Índice de Cierre
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${scoreBadgeBg}`}>
              {scoreLabel}
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-black font-mono tracking-tight ${scoreColor}`}>
                {healthScore}
              </span>
              <span className="text-xs text-slate-500 font-mono">/ 100 pts</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  healthScore >= 80 ? 'bg-emerald-400' : healthScore >= 60 ? 'bg-amber-400' : 'bg-rose-400'
                }`}
                style={{ width: `${healthScore}%` }}
              />
            </div>
          </div>
          <div className="text-[10px] text-slate-400 flex justify-between">
            <span>Cumplimiento presupuestario</span>
            <span className="text-slate-300 font-semibold">
              {executiveSummary.totalRealizedIncome > 0
                ? `${Math.max(0, Math.round((executiveSummary.netRealSavings / executiveSummary.totalRealizedIncome) * 100))}% ahorro`
                : 'Sin ingresos'}
            </span>
          </div>
        </div>

        {/* Card 2: Ingresos Plan vs Real */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
              Ingresos del Período
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-950/40 text-emerald-400 font-semibold border border-emerald-900/40">
              Entradas
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
            {formatMoney(executiveSummary.totalRealizedIncome, settings.currencySymbol)}
          </div>
          <div className="text-xs text-slate-400 flex justify-between">
            <span>Meta planificada:</span>
            <span className="font-mono text-slate-300">
              {formatMoney(executiveSummary.totalPlannedIncome, settings.currencySymbol)}
            </span>
          </div>
          <div className="pt-1.5 border-t border-slate-800 text-[11px] flex justify-between font-semibold">
            <span className="text-slate-400">Variación:</span>
            <span
              className={
                executiveSummary.totalRealizedIncome >= executiveSummary.totalPlannedIncome
                  ? 'text-emerald-400'
                  : 'text-amber-400'
              }
            >
              {formatMoney(
                executiveSummary.totalRealizedIncome - executiveSummary.totalPlannedIncome,
                settings.currencySymbol
              )}
            </span>
          </div>
        </div>

        {/* Card 3: Gastos Plan vs Real */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
              Gastos del Período
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-950/40 text-rose-400 font-semibold border border-rose-900/40">
              Salidas
            </span>
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono tracking-tight">
            {formatMoney(executiveSummary.totalRealizedExpense, settings.currencySymbol)}
          </div>
          <div className="text-xs text-slate-400 flex justify-between">
            <span>Límite planificado:</span>
            <span className="font-mono text-slate-300">
              {formatMoney(executiveSummary.totalPlannedExpense, settings.currencySymbol)}
            </span>
          </div>
          <div className="pt-1.5 border-t border-slate-800 text-[11px] flex justify-between font-semibold">
            <span className="text-slate-400">Ahorro en gasto:</span>
            <span
              className={
                executiveSummary.totalPlannedExpense >= executiveSummary.totalRealizedExpense
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }
            >
              {formatMoney(
                executiveSummary.totalPlannedExpense - executiveSummary.totalRealizedExpense,
                settings.currencySymbol
              )}
            </span>
          </div>
        </div>

        {/* Card 4: Ahorro Neto & Liquidez */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
              Ahorro Neto & Cierre
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-sky-950/40 text-sky-400 font-semibold border border-sky-900/40">
              Balance
            </span>
          </div>
          <div
            className={`text-2xl font-black font-mono tracking-tight ${
              executiveSummary.netRealSavings >= 0 ? 'text-sky-300' : 'text-rose-400'
            }`}
          >
            {formatMoney(executiveSummary.netRealSavings, settings.currencySymbol)}
          </div>
          <div className="text-xs text-slate-400 flex justify-between">
            <span>Deuda Activa en Tarjetas/Préstamos:</span>
            <span className="font-mono text-amber-300 font-medium">
              {formatMoney(executiveSummary.totalDebt, settings.currencySymbol)}
            </span>
          </div>
          <div className="pt-1.5 border-t border-slate-800 text-[11px] flex justify-between font-bold">
            <span className="text-slate-300">Tesorería al cierre:</span>
            <span className="text-white font-mono">
              {formatMoney(executiveSummary.currentRealCashBalance, settings.currencySymbol)}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Hub with Interactive Mode Tabs */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" />
              <span>Análisis Gráfico Interactivo de Cierre</span>
            </h3>
            <p className="text-xs text-slate-400">
              Toca cualquier segmento o barra para filtrar la tabla de auditoría y desglosar sus movimientos
            </p>
          </div>

          {/* Perspective Selector Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('concentration')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeTab === 'concentration'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>Concentración & Presupuesto</span>
            </button>

            <button
              onClick={() => setActiveTab('daily_flow')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeTab === 'daily_flow'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Flujo Diario del Período</span>
            </button>

            <button
              onClick={() => setActiveTab('payment_methods')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeTab === 'payment_methods'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Medios de Pago & Top Gastos</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Concentration & Budget Comparison */}
        {activeTab === 'concentration' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico 1: Pastel de Gastos por Categoría */}
            <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-4 flex flex-col justify-between">
              <div className="border-b border-slate-800 pb-2.5 mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-pink-400" />
                  <h4 className="text-xs font-bold text-white">
                    Concentración de Gasto por Categoría
                  </h4>
                </div>
                <span className="text-[10px] text-blue-400 font-medium">Toca para filtrar ↗</span>
              </div>

              {expensesByCategoryData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500 text-xs text-center">
                  <PieIcon className="w-10 h-10 mb-2 opacity-30" />
                  <span>No hay gastos registrados en este mes para graficar.</span>
                </div>
              ) : (
                <div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expensesByCategoryData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={85}
                          innerRadius={50}
                          paddingAngle={2}
                          cursor="pointer"
                          onClick={(entry: any) => handleSelectCategory(String(entry.name))}
                        >
                          {expensesByCategoryData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              stroke={selectedCategoryName === entry.name ? '#ffffff' : '#0f172a'}
                              strokeWidth={selectedCategoryName === entry.name ? 3 : 1}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Interactive Legend List */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {expensesByCategoryData.map((item) => (
                      <div
                        key={item.name}
                        onClick={() => handleSelectCategory(item.name)}
                        className={`flex items-center justify-between text-xs p-2 rounded-lg cursor-pointer transition ${
                          selectedCategoryName?.toLowerCase() === item.name.toLowerCase()
                            ? 'bg-blue-950/80 border border-blue-500 text-white font-semibold'
                            : 'hover:bg-slate-900 border border-transparent text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="truncate">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0 font-mono">
                          <span className="text-slate-400 text-[11px]">{item.percentage}%</span>
                          <span className="font-bold text-white">
                            {formatMoney(item.cents, settings.currencySymbol)}
                          </span>
                          <span className="text-[10px] text-blue-400">↗</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Gráfico 2: Presupuesto vs Real */}
            <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-4 flex flex-col justify-between">
              <div className="border-b border-slate-800 pb-2.5 mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-white">
                    Presupuestado vs. Real por Rubro
                  </h4>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-semibold">
                  <span className="flex items-center gap-1 text-blue-400">
                    <span className="w-2 h-2 rounded bg-blue-500 inline-block" /> Meta
                  </span>
                  <span className="flex items-center gap-1 text-rose-400">
                    <span className="w-2 h-2 rounded bg-rose-500 inline-block" /> Real
                  </span>
                </div>
              </div>

              {budgetComparisonData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500 text-xs text-center">
                  <BarChart3 className="w-10 h-10 mb-2 opacity-30" />
                  <span>No hay presupuestos ni gastos asignados.</span>
                </div>
              ) : (
                <div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={budgetComparisonData.slice(0, 7)}
                        margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: '#94a3b8', fontSize: 10 }}
                          interval={0}
                          angle={-25}
                          textAnchor="end"
                        />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <Tooltip content={<CustomBarTooltip />} />
                        <Bar
                          dataKey="presupuestado"
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                          cursor="pointer"
                          onClick={(data: any) => handleSelectCategory(String(data.fullName))}
                        />
                        <Bar
                          dataKey="real"
                          fill="#f43f5e"
                          radius={[4, 4, 0, 0]}
                          cursor="pointer"
                          onClick={(data: any) => handleSelectCategory(String(data.fullName))}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Highlights: Top Ahorros y Top Desviaciones */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-800 text-xs">
                    {/* Top Ahorros */}
                    <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-900/30 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                        <Award className="w-3.5 h-3.5" />
                        <span>Mayores Ahorros</span>
                      </div>
                      {topSavingsCategories.length === 0 ? (
                        <span className="text-slate-400 text-[11px] block">No hubo ahorro este mes.</span>
                      ) : (
                        topSavingsCategories.map((c) => (
                          <div
                            key={c.fullName}
                            onClick={() => handleSelectCategory(c.fullName)}
                            className="flex justify-between text-[11px] cursor-pointer hover:text-white transition"
                          >
                            <span className="text-slate-300 truncate pr-2 hover:text-emerald-300">{c.fullName}</span>
                            <span className="font-mono font-bold text-emerald-400 shrink-0">
                              +{formatMoney(c.ahorroCents, settings.currencySymbol)} ↗
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Top Sobregiros */}
                    <div className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-900/30 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-rose-400 font-bold text-[11px]">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Mayores Sobregiros</span>
                      </div>
                      {topOverspentCategories.length === 0 ? (
                        <span className="text-slate-400 text-[11px] block">
                          ¡Excelente! Ninguna categoría sobrepasada.
                        </span>
                      ) : (
                        topOverspentCategories.map((c) => (
                          <div
                            key={c.fullName}
                            onClick={() => handleSelectCategory(c.fullName)}
                            className="flex justify-between text-[11px] cursor-pointer hover:text-white transition"
                          >
                            <span className="text-slate-300 truncate pr-2 hover:text-rose-300">{c.fullName}</span>
                            <span className="font-mono font-bold text-rose-400 shrink-0">
                              {formatMoney(c.ahorroCents, settings.currencySymbol)} ↗
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Daily Income vs Expenses Flow */}
        {activeTab === 'daily_flow' && (
          <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
              <span className="font-semibold text-white">
                Distribución de Entradas vs Salidas a lo largo de los días de {MONTH_NAMES_ES[selectedMonth - 1]}
              </span>
              <div className="flex items-center gap-4 text-[11px]">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> Ingresos
                </span>
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" /> Gastos
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyFlowData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="dayNum"
                    stroke="#64748b"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => `D${v}`}
                  />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="rounded-xl bg-slate-950 border border-slate-800 p-2.5 shadow-2xl text-xs space-y-1">
                            <div className="font-bold text-white border-b border-slate-800 pb-1">
                              {item.dayLabel} de {MONTH_NAMES_ES[selectedMonth - 1]}
                            </div>
                            <div className="text-emerald-400 font-mono font-bold">
                              Ingresos: {formatMoney(item.incomeCents, settings.currencySymbol)}
                            </div>
                            <div className="text-rose-400 font-mono font-bold">
                              Gastos: {formatMoney(item.expenseCents, settings.currencySymbol)}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="Ingresos" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Gastos" fill="#f43f5e" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-slate-400 italic">
              💡 Este gráfico identifica las fechas del mes donde ocurrieron las mayores salidas y entradas monetarias.
            </p>
          </div>
        )}

        {/* Tab 3: Payment Methods & Top Expenses */}
        {activeTab === 'payment_methods' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top 5 Gastos Individuales del Mes */}
            <div className="lg:col-span-2 rounded-xl bg-slate-950/60 border border-slate-800/80 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-amber-400" />
                  <span>Top 5 Mayores Salidas Individuales del Mes</span>
                </h4>
                <span className="text-[11px] text-slate-400">Impacto puntual en liquidez</span>
              </div>

              {topIndividualExpenses.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No hay movimientos de gasto registrados en este período.
                </div>
              ) : (
                <div className="divide-y divide-slate-800 text-xs">
                  {topIndividualExpenses.map((tx, idx) => (
                    <div
                      key={tx.id}
                      onClick={() => handleSelectCategory(tx.categoryName)}
                      className="py-2.5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-900/60 p-2 rounded-lg transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="font-semibold text-white hover:text-blue-300 transition">
                            {tx.concept}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span className="text-blue-400">{tx.categoryName}</span>
                            <span>•</span>
                            <span>{tx.date}</span>
                            <span>•</span>
                            <span className="capitalize">{tx.paymentMethodType.replace('_', ' ')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="font-mono font-bold text-rose-400 text-sm shrink-0 flex items-center gap-1.5">
                        <span>{formatMoney(tx.amount, settings.currencySymbol)}</span>
                        <span className="text-[10px] text-blue-400">↗</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Medios de Pago */}
            <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-sky-400" />
                  <span>Medios de Pago Utilizados</span>
                </h4>
              </div>

              {paymentMethodData.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  Sin datos de medios de pago en este mes.
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  {paymentMethodData.map((m) => {
                    const Icon = m.icon;
                    const totalSpent = executiveSummary.totalRealizedExpense;
                    const pct = totalSpent > 0 ? Math.round((m.cents / totalSpent) * 100) : 0;

                    return (
                      <div
                        key={m.name}
                        onClick={() => setSelectedPaymentFilter(selectedPaymentFilter === m.key ? null : m.key)}
                        className={`p-2.5 rounded-xl border transition cursor-pointer ${
                          selectedPaymentFilter === m.key
                            ? 'bg-blue-950/60 border-blue-500 shadow-md shadow-blue-500/20'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <div className="flex items-center gap-2 text-slate-300 font-medium">
                            <Icon className="w-4 h-4" style={{ color: m.color }} />
                            <span>{m.name}</span>
                          </div>
                          <div className="font-mono text-white font-bold">
                            {formatMoney(m.cents, settings.currencySymbol)} ({pct}%)
                          </div>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${pct}%`, backgroundColor: m.color }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 leading-relaxed">
                    Permite vigilar qué proporción de tus consumos dependió de crédito diferido frente a liquidez inmediata en cuentas y efectivo.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Category Audit Table with Full Movement Breakdown */}
      <div id="audit-category-table" className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Auditoría de Rubros & Desglose de Movimientos</span>
            </h3>
            <p className="text-xs text-slate-400">
              Despliega cada categoría para auditar cada transacción realizada o planificada con su cuenta o tarjeta
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
                placeholder="Buscar rubro o movimiento..."
                className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 w-44"
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
              <option value="all">Todos los estados</option>
              <option value="realizado">Solo Realizados</option>
              <option value="planificado">Solo Planificados</option>
            </select>
          </div>
        </div>

        {/* Active Filter Banner from Interactive Chart Selection */}
        {(selectedCategoryName || selectedPaymentFilter) && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-blue-950/40 border border-blue-500/40 flex items-center justify-between text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-blue-300 font-semibold flex-wrap">
              <Filter className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                Filtro interactivo:{' '}
                {selectedCategoryName && (
                  <strong className="text-white underline mr-2">Categoría: {selectedCategoryName}</strong>
                )}
                {selectedPaymentFilter && (
                  <strong className="text-white underline">Medio de Pago: {selectedPaymentFilter.replace('_', ' ')}</strong>
                )}
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedCategoryName(null);
                setSelectedPaymentFilter(null);
              }}
              className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-200 font-semibold transition cursor-pointer flex items-center gap-1 text-[11px] shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>Ver todas las categorías</span>
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Categoría & Desglose</th>
                <th className="py-3 px-3 text-right">Presupuesto</th>
                <th className="py-3 px-3 text-right">Gasto Real</th>
                <th className="py-3 px-3 text-right">Pendiente Plan.</th>
                <th className="py-3 px-3 text-right">Variación / Ahorro</th>
                <th className="py-3 px-4">Cumplimiento</th>
                <th className="py-3 px-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredCategoryList.map((item) => {
                const catId = item.category?.id || item.categoryId;
                const catName = item.category?.name || item.categoryName || 'General';
                const isExpanded = !!expandedCategories[catId];
                const isSelected = selectedCategoryName?.toLowerCase() === catName.toLowerCase();
                const realSpent = item.realSpent || item.actualSpent || 0;
                const plannedSpent = item.plannedPendingSpent || item.plannedPendingAmount || 0;
                const variance = item.budgetedAmount - realSpent;

                // Movements in this category matching tableStatusFilter and selectedPaymentFilter
                const categoryMovements = allMonthTransactions.filter((tx) => {
                  if (tx.categoryId !== catId) return false;
                  if (tx.type === 'transferencia') return false;
                  if (tableStatusFilter === 'realizado' && tx.status !== 'realizado') return false;
                  if (tableStatusFilter === 'planificado' && tx.status !== 'planificado') return false;
                  if (selectedPaymentFilter && tx.paymentMethodType !== selectedPaymentFilter) return false;
                  return true;
                });

                return (
                  <React.Fragment key={catId}>
                    <tr
                      className={`transition group ${
                        isSelected
                          ? 'bg-blue-950/40 border-l-2 border-l-blue-400'
                          : 'hover:bg-slate-850/60'
                      }`}
                    >
                      {/* Name & Toggle */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleExpandCategory(catId)}
                            className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                            title={isExpanded ? 'Ocultar desglose' : 'Ver desglose de movimientos'}
                          >
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                isExpanded ? 'rotate-180 text-blue-400' : 'text-slate-400'
                              }`}
                            />
                          </button>
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                item.category?.color || item.categoryColor || '#3b82f6',
                            }}
                          />
                          <div
                            onClick={() => toggleExpandCategory(catId)}
                            className="font-bold text-white truncate max-w-[160px] sm:max-w-none cursor-pointer hover:text-blue-300 transition flex items-center gap-1.5"
                          >
                            <span>{catName}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 font-mono font-normal">
                              {categoryMovements.length}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Presupuesto */}
                      <td className="py-3.5 px-3 text-right font-mono font-semibold text-white">
                        {formatMoney(item.budgetedAmount, settings.currencySymbol)}
                      </td>

                      {/* Real Spent */}
                      <td className="py-3.5 px-3 text-right font-mono text-rose-400 font-bold">
                        {formatMoney(realSpent, settings.currencySymbol)}
                      </td>

                      {/* Pending Planned */}
                      <td className="py-3.5 px-3 text-right font-mono text-slate-400">
                        {formatMoney(plannedSpent, settings.currencySymbol)}
                      </td>

                      {/* Variance */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold">
                        <span className={variance >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {variance >= 0 ? '+' : ''}
                          {formatMoney(variance, settings.currencySymbol)}
                        </span>
                      </td>

                      {/* Progress / Status */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5 min-w-[120px]">
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
                            {item.status === 'exceeded' || item.status === 'sobregiro' ? (
                              <span className="text-rose-400 font-bold flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Excedido
                              </span>
                            ) : item.status === 'warning' || item.status === 'alerta' ? (
                              <span className="text-amber-400 font-semibold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> 80%
                              </span>
                            ) : (
                              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> En meta
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
                                  : 'bg-emerald-500'
                              }`}
                              style={{
                                width: `${Math.min(100, item.executionPercentage ?? item.percentUsed ?? 0)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => toggleExpandCategory(catId)}
                          className={`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 mx-auto text-[11px] font-semibold ${
                            isExpanded
                              ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>{isExpanded ? 'Ocultar' : 'Desglosar'}</span>
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Category Movements Sub-Row */}
                    {isExpanded && (
                      <tr key={`${catId}-movements`} className="bg-slate-950/80 border-b border-slate-800">
                        <td colSpan={7} className="p-3 sm:p-4 pl-4 sm:pl-10">
                          <div className="rounded-xl bg-slate-900 border border-slate-800/80 p-3 sm:p-4 space-y-3 shadow-inner">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{
                                    backgroundColor:
                                      item.category?.color || item.categoryColor || '#3b82f6',
                                  }}
                                />
                                <span className="font-bold text-white text-xs">
                                  Desglose Auditor — {catName}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                                  {categoryMovements.length} {categoryMovements.length === 1 ? 'movimiento' : 'movimientos'}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-xs font-mono">
                                <span className="text-slate-400">
                                  Real:{' '}
                                  <strong className="text-rose-400">
                                    {formatMoney(realSpent, settings.currencySymbol)}
                                  </strong>
                                </span>
                                <span className="text-slate-400">
                                  Plan:{' '}
                                  <strong className="text-slate-300">
                                    {formatMoney(plannedSpent, settings.currencySymbol)}
                                  </strong>
                                </span>
                              </div>
                            </div>

                            {categoryMovements.length === 0 ? (
                              <div className="py-4 text-center text-slate-500 text-xs">
                                <p>No hay movimientos registrados en {catName} para este período.</p>
                              </div>
                            ) : (
                              <div className="divide-y divide-slate-800/60 max-h-72 overflow-y-auto pr-1">
                                {categoryMovements.map((tx) => {
                                  const card = tx.creditCardId
                                    ? creditCards.find((c) => c.id === tx.creditCardId)
                                    : null;
                                  const acc = tx.accountId
                                    ? accounts.find((a) => a.id === tx.accountId)
                                    : null;
                                  const isReal = tx.status === 'realizado';

                                  return (
                                    <div
                                      key={tx.id}
                                      className="py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-850/40 px-2 rounded-lg transition"
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        <span className="font-mono text-slate-400 text-[11px] shrink-0 flex items-center gap-1">
                                          <Calendar className="w-3 h-3 text-slate-500" />
                                          {tx.date}
                                        </span>
                                        <div className="min-w-0">
                                          <span className="font-semibold text-white truncate block">
                                            {tx.concept}
                                          </span>
                                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 flex-wrap">
                                            {card ? (
                                              <span className="flex items-center gap-1 text-amber-400 font-mono">
                                                <CreditCard className="w-3 h-3" />
                                                {card.name}
                                              </span>
                                            ) : acc ? (
                                              <span className="flex items-center gap-1 text-blue-400">
                                                <Building2 className="w-3 h-3" />
                                                {acc.name}
                                              </span>
                                            ) : (
                                              <span className="flex items-center gap-1 text-emerald-400">
                                                <Coins className="w-3 h-3" />
                                                Efectivo
                                              </span>
                                            )}
                                            {tx.notes && (
                                              <span className="text-slate-500 truncate max-w-xs italic">
                                                "{tx.notes}"
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-3 shrink-0">
                                        <span
                                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                            isReal
                                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                          }`}
                                        >
                                          {isReal ? 'Realizado' : 'Planificado'}
                                        </span>
                                        <span
                                          className={`font-mono font-bold text-sm ${
                                            tx.type === 'ingreso' ? 'text-emerald-400' : 'text-rose-400'
                                          }`}
                                        >
                                          {tx.type === 'ingreso' ? '+' : '-'}
                                          {formatMoney(tx.amount, settings.currencySymbol)}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Histórico de Cierres Anteriores Inmutables */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>Historial de Meses Cerrados Inmutables</span>
          </h3>
          <span className="text-xs text-slate-400">
            {monthlyCloses.length} período(s) cerrado(s)
          </span>
        </div>

        {monthlyCloses.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Aún no has cerrado ningún mes. Al cerrar un período, quedará registrado aquí de forma inmutable con su instantánea de resultados.
          </div>
        ) : (
          <div className="divide-y divide-slate-800 text-xs">
            {monthlyCloses.map((c) => (
              <div key={c.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>
                      {MONTH_NAMES_ES[c.month - 1]} {c.year}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Cerrado
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Ingresos: {formatMoney(c.realIncome, settings.currencySymbol)} • Gastos:{' '}
                    {formatMoney(c.realExpense, settings.currencySymbol)} • Ahorro Neto:{' '}
                    <span className={c.realSavings >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                      {formatMoney(c.realSavings, settings.currencySymbol)}
                    </span>
                  </div>
                  {c.notes && (
                    <div className="text-[11px] text-slate-400 italic mt-0.5">"{c.notes}"</div>
                  )}
                </div>

                <button
                  onClick={() => handleReopen(c.year, c.month)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Reabrir Período
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Confirm Close Month */}
      {isConfirmingClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 space-y-4">
            <h3 className="text-base font-bold text-white">
              Cerrar {MONTH_NAMES_ES[selectedMonth - 1]} {selectedYear}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Al cerrar este mes se guardará una instantánea definitiva de ingresos, gastos, ahorro neto y deudas.
              Los saldos de bancos y efectivo continuarán disponibles para el próximo mes. Podrás reabrirlo en cualquier momento si necesitas corregir datos.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Comentarios / Conclusiones del mes (Opcional)
              </label>
              <textarea
                rows={2}
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                placeholder="Ej. Cumplí la meta de ahorro, gasto médico imprevisto de $120..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800 text-xs">
              <button
                onClick={() => setIsConfirmingClose(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteClose}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-md shadow-blue-600/30"
              >
                Confirmar Cierre de Mes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
