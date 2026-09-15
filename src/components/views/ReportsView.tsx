import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatMoney, MONTH_NAMES_ES } from '../../utils/formatters';
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
  Award,
  Sparkles,
  Printer,
  FileSpreadsheet,
  Download,
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
    exportTransactionsCSV,
    settings,
  } = useFinance();

  const [closeNotes, setCloseNotes] = useState('');
  const [isConfirmingClose, setIsConfirmingClose] = useState(false);

  const monthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const currentMonthClose = monthlyCloses.find((c) => c.id === monthKey && c.isClosed);

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
      .filter((item) => item.actualSpent > 0)
      .map((item, idx) => ({
        name: item.categoryName,
        value: item.actualSpent / 100, // in dollars for chart display
        cents: item.actualSpent,
        percentage: ((item.actualSpent / totalSpent) * 100).toFixed(1),
        color: CHART_COLORS[idx % CHART_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [budgetAnalysis, executiveSummary.totalRealizedExpense]);

  // 2. Análisis de Presupuesto vs Real ("¿Dónde se ahorró vs dónde hubo sobrecosto?")
  const budgetComparisonData = useMemo(() => {
    return budgetAnalysis
      .filter((item) => item.budgetedAmount > 0 || item.actualSpent > 0)
      .map((item) => {
        const ahorro = item.budgetedAmount - item.actualSpent;
        return {
          name: item.categoryName.length > 14 ? `${item.categoryName.substring(0, 12)}...` : item.categoryName,
          fullName: item.categoryName,
          presupuestado: item.budgetedAmount / 100,
          real: item.actualSpent / 100,
          ahorro: ahorro / 100,
          ahorroCents: ahorro,
          presupuestadoCents: item.budgetedAmount,
          realCents: item.actualSpent,
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
      .filter((tx) => tx.type === 'gasto')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((tx) => ({
        ...tx,
        categoryName: catMap.get(tx.categoryId || '') || 'Sin categoría',
      }));
  }, [allMonthTransactions, categories]);

  // 4. Distribución por Medio de Pago (Efectivo vs Bancos/Débito vs Tarjetas de Crédito)
  const paymentMethodData = useMemo(() => {
    let cash = 0;
    let bank = 0;
    let credit = 0;

    allMonthTransactions
      .filter((tx) => tx.type === 'gasto')
      .forEach((tx) => {
        if (tx.paymentMethodType === 'efectivo') cash += tx.amount;
        else if (tx.paymentMethodType === 'tarjeta_credito') credit += tx.amount;
        else bank += tx.amount;
      });

    const total = cash + bank + credit;
    if (total === 0) return [];

    return [
      { name: 'Tarjetas de Crédito', value: credit / 100, cents: credit, color: '#f59e0b', icon: CreditCard },
      { name: 'Cuentas & Débito', value: bank / 100, cents: bank, color: '#3b82f6', icon: Wallet },
      { name: 'Efectivo', value: cash / 100, cents: cash, color: '#10b981', icon: Coins },
    ].filter((m) => m.cents > 0);
  }, [allMonthTransactions]);

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1">
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
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const pData = payload[0]?.payload;
      if (!pData) return null;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1">
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
          </div>
          <p className="text-xs text-slate-400">
            Auditoría de variaciones, gráficos de concentración de gastos, ahorro por categoría y cierre formal de período.
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
                <span>Mes Auditado</span>
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

      {/* KPI Cards: Resumen Ejecutivo del Cierre */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Ingresos Plan vs Real */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
              Ingresos del Período
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-950/40 text-emerald-400 font-semibold border border-emerald-900/40">
              Entradas
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Planificado:</span>
            <span className="font-mono text-slate-300 font-medium">
              {formatMoney(executiveSummary.totalPlannedIncome, settings.currencySymbol)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Realizado:</span>
            <span className="font-mono font-bold text-emerald-400">
              {formatMoney(executiveSummary.totalRealizedIncome, settings.currencySymbol)}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-800 text-xs flex justify-between font-semibold">
            <span className="text-slate-400">Diferencia:</span>
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

        {/* Gastos Plan vs Real */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
              Gastos del Período
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-950/40 text-rose-400 font-semibold border border-rose-900/40">
              Salidas
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Planificado:</span>
            <span className="font-mono text-slate-300 font-medium">
              {formatMoney(executiveSummary.totalPlannedExpense, settings.currencySymbol)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Realizado:</span>
            <span className="font-mono font-bold text-rose-400">
              {formatMoney(executiveSummary.totalRealizedExpense, settings.currencySymbol)}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-800 text-xs flex justify-between font-semibold">
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

        {/* Ahorro Neto & Saldo */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
              Resultado Neto & Liquidez
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-sky-950/40 text-sky-400 font-semibold border border-sky-900/40">
              Balance
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Ahorro Neto Real:</span>
            <span className="font-mono font-bold text-sky-400">
              {formatMoney(executiveSummary.netRealSavings, settings.currencySymbol)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Deuda Total Activa:</span>
            <span className="font-mono text-amber-300 font-medium">
              {formatMoney(executiveSummary.totalDebt, settings.currencySymbol)}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-800 text-xs flex justify-between font-bold">
            <span className="text-slate-300">Saldo Disponible Final:</span>
            <span className="text-white font-mono">
              {formatMoney(executiveSummary.currentRealCashBalance, settings.currencySymbol)}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Section: Pie Chart & Bar Chart (User Request) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Pastel de Gastos por Categoría ("¿En qué se gastó más?") */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
          <div className="border-b border-slate-800 pb-3 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-pink-400" />
              <h3 className="text-sm font-bold text-white">
                ¿En qué se gastó más? — Concentración por Categoría
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Gráfico de Pastel</span>
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
                    >
                      {expensesByCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend and top breakdown table */}
              <div className="mt-4 pt-4 border-t border-slate-800 space-y-2 max-h-48 overflow-y-auto pr-1">
                {expensesByCategoryData.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between text-xs hover:bg-slate-800/40 p-1.5 rounded-lg transition"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-slate-300 truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 font-mono">
                      <span className="text-slate-400 text-[11px]">{item.percentage}%</span>
                      <span className="font-bold text-white">
                        {formatMoney(item.cents, settings.currencySymbol)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Gráfico 2: Presupuesto vs Gasto Real ("¿Dónde se ahorró vs dónde hubo sobrecosto?") */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
          <div className="border-b border-slate-800 pb-3 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">
                ¿Dónde se ahorró? — Presupuestado vs. Real
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-semibold">
              <span className="flex items-center gap-1 text-blue-400">
                <span className="w-2 h-2 rounded bg-blue-500 inline-block" /> Presupuesto
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2 h-2 rounded bg-rose-500 inline-block" /> Gasto Real
              </span>
            </div>
          </div>

          {budgetComparisonData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 text-xs text-center">
              <BarChart3 className="w-10 h-10 mb-2 opacity-30" />
              <span>No hay presupuestos ni gastos asignados a categorías.</span>
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
                    <Bar dataKey="presupuestado" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="real" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Highlights: Top Ahorros y Top Desviaciones */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800 text-xs">
                {/* Categorías con mayor ahorro */}
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/30 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                    <Award className="w-3.5 h-3.5" />
                    <span>Mayores Ahorros Logrados</span>
                  </div>
                  {topSavingsCategories.length === 0 ? (
                    <span className="text-slate-400 text-[11px] block">No hubo ahorro este mes.</span>
                  ) : (
                    topSavingsCategories.map((c) => (
                      <div key={c.fullName} className="flex justify-between text-[11px]">
                        <span className="text-slate-300 truncate pr-2">{c.fullName}</span>
                        <span className="font-mono font-bold text-emerald-400 shrink-0">
                          +{formatMoney(c.ahorroCents, settings.currencySymbol)}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Categorías con sobrecosto */}
                <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/30 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-rose-400 font-bold text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Mayores Sobregiros</span>
                  </div>
                  {topOverspentCategories.length === 0 ? (
                    <span className="text-slate-400 text-[11px] block">
                      ¡Excelente! Ninguna categoría sobrepasó el límite.
                    </span>
                  ) : (
                    topOverspentCategories.map((c) => (
                      <div key={c.fullName} className="flex justify-between text-[11px]">
                        <span className="text-slate-300 truncate pr-2">{c.fullName}</span>
                        <span className="font-mono font-bold text-rose-400 shrink-0">
                          {formatMoney(c.ahorroCents, settings.currencySymbol)}
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

      {/* Additional Analysis: Top Individual Expenses & Payment Method Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 5 Gastos Individuales del Mes */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-amber-400" />
              <span>Top 5 Mayores Salidas Individuales del Mes</span>
            </h3>
            <span className="text-[11px] text-slate-400">Impacto puntual en liquidez</span>
          </div>

          {topIndividualExpenses.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No hay movimientos de gasto registrados en este período.
            </div>
          ) : (
            <div className="divide-y divide-slate-800 text-xs">
              {topIndividualExpenses.map((tx, idx) => (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-white">{tx.concept}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{tx.categoryName}</span>
                        <span>•</span>
                        <span>{tx.date}</span>
                        <span>•</span>
                        <span className="capitalize">{tx.paymentMethodType.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="font-mono font-bold text-rose-400 text-sm shrink-0">
                    {formatMoney(tx.amount, settings.currencySymbol)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Distribución por Medio de Pago */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-sky-400" />
              <span>Medios de Pago Utilizados</span>
            </h3>
          </div>

          {paymentMethodData.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              Sin datos de medios de pago en este mes.
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              {paymentMethodData.map((m) => {
                const Icon = m.icon;
                const totalSpent = executiveSummary.totalRealizedExpense;
                const pct = totalSpent > 0 ? Math.round((m.cents / totalSpent) * 100) : 0;

                return (
                  <div key={m.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-slate-300 font-medium">
                        <Icon className="w-4 h-4" style={{ color: m.color }} />
                        <span>{m.name}</span>
                      </div>
                      <div className="font-mono text-white font-bold">
                        {formatMoney(m.cents, settings.currencySymbol)} ({pct}%)
                      </div>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
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

      {/* Histórico de Cierres Anteriores */}
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
