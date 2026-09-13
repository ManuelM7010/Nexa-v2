import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { DetailedBudgetItem, ItemBudget } from '../../types';
import { formatMoney, dollarsToCents, centsToDollars, getMonthNameEs } from '../../utils/formatters';
import {
  Table,
  Plus,
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
  X,
  Layers,
  HelpCircle,
} from 'lucide-react';

export const DetailedMonthlyBudgetView: React.FC = () => {
  const {
    detailedBudget,
    categories,
    itemBudgets,
    saveItemBudget,
    deleteItemBudget,
    selectedYear,
    selectedMonth,
    settings,
    allMonthTransactions,
  } = useFinance();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'gasto' | 'ingreso'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'variation' | 'budget' | 'real' | 'name'>('variation');

  // Expanded row IDs (to see individual transaction events)
  const [expandedItemIds, setExpandedItemIds] = useState<Set<string>>(new Set());

  // Modal State for New/Edit Item Budget
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState<{
    id?: string;
    name: string;
    type: 'gasto' | 'ingreso';
    categoryId: string;
    budgetedDollars: string;
    projectedDollars: string;
    notes: string;
  }>({
    name: '',
    type: 'gasto',
    categoryId: '',
    budgetedDollars: '',
    projectedDollars: '',
    notes: '',
  });

  // Modal State for Quick Inline Edit
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineBudget, setInlineBudget] = useState('');
  const [inlineProjected, setInlineProjected] = useState('');

  // Unbudgeted suggestions modal
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);

  // Month label
  const monthName = `${getMonthNameEs(selectedMonth)} ${selectedYear}`;

  // Toggle row expansion
  const toggleRowExpansion = (id: string) => {
    setExpandedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return detailedBudget
      .filter((item) => {
        // Search
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchName = item.name.toLowerCase().includes(term);
          const matchCategory = item.categoryName.toLowerCase().includes(term);
          if (!matchName && !matchCategory) return false;
        }

        // Type
        if (filterType !== 'all' && item.type !== filterType) {
          return false;
        }

        // Category
        if (filterCategory !== 'all' && item.categoryId !== filterCategory) {
          return false;
        }

        // Status
        if (filterStatus !== 'all') {
          if (filterStatus === 'sobregiro' && item.status !== 'sobregiro') return false;
          if (filterStatus === 'alerta' && item.status !== 'alerta') return false;
          if (filterStatus === 'favorable' && item.status !== 'favorable' && item.status !== 'en_meta') return false;
          if (filterStatus === 'sin_presupuesto' && item.status !== 'sin_presupuesto') return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'budget') {
          return b.budgetedAmount - a.budgetedAmount;
        }
        if (sortBy === 'real') {
          return b.realAmount - a.realAmount;
        }
        // Variation default: greatest negative deviation (losses/overruns) first, or absolute divergence
        return Math.abs(b.variation) - Math.abs(a.variation);
      });
  }, [detailedBudget, searchTerm, filterType, filterCategory, filterStatus, sortBy]);

  // Executive KPI summary calculations
  const kpis = useMemo(() => {
    let totalExpenseBudget = 0;
    let totalExpenseReal = 0;
    let totalExpenseProjected = 0;

    let totalIncomeBudget = 0;
    let totalIncomeReal = 0;
    let totalIncomeProjected = 0;

    detailedBudget.forEach((item) => {
      if (item.type === 'gasto') {
        totalExpenseBudget += item.budgetedAmount;
        totalExpenseReal += item.realAmount;
        totalExpenseProjected += item.projectedAmount;
      } else {
        totalIncomeBudget += item.budgetedAmount;
        totalIncomeReal += item.realAmount;
        totalIncomeProjected += item.projectedAmount;
      }
    });

    const expenseVariation = totalExpenseBudget - totalExpenseReal; // positive = savings
    const incomeVariation = totalIncomeReal - totalIncomeBudget; // positive = surplus

    const budgetedNet = totalIncomeBudget - totalExpenseBudget;
    const realNet = totalIncomeReal - totalExpenseReal;
    const projectedNet = totalIncomeProjected - totalExpenseProjected;

    return {
      totalExpenseBudget,
      totalExpenseReal,
      totalExpenseProjected,
      expenseVariation,
      totalIncomeBudget,
      totalIncomeReal,
      totalIncomeProjected,
      incomeVariation,
      budgetedNet,
      realNet,
      projectedNet,
    };
  }, [detailedBudget]);

  // Unbudgeted active items that appeared in transactions
  const unbudgetedTransactions = useMemo(() => {
    return detailedBudget.filter((item) => item.status === 'sin_presupuesto' && item.realAmount > 0);
  }, [detailedBudget]);

  // Open Modal to create new item budget
  const handleOpenNewModal = (prefill?: Partial<ItemBudget>) => {
    setModalItem({
      id: prefill?.id,
      name: prefill?.name || '',
      type: prefill?.type || 'gasto',
      categoryId: prefill?.categoryId || categories[0]?.id || '',
      budgetedDollars: prefill?.budgetedAmount ? centsToDollars(prefill.budgetedAmount).toString() : '',
      projectedDollars: prefill?.projectedAmount ? centsToDollars(prefill.projectedAmount).toString() : '',
      notes: prefill?.notes || '',
    });
    setIsModalOpen(true);
  };

  // Open Modal to edit existing item budget
  const handleOpenEditModal = (item: DetailedBudgetItem) => {
    const existing = itemBudgets.find(
      (b) =>
        b.id === item.itemBudgetId ||
        (b.name.toLowerCase() === item.name.toLowerCase() &&
          b.year === selectedYear &&
          b.month === selectedMonth)
    );

    setModalItem({
      id: existing?.id,
      name: item.name,
      type: item.type,
      categoryId: item.categoryId,
      budgetedDollars: item.budgetedAmount > 0 ? centsToDollars(item.budgetedAmount).toFixed(2) : '',
      projectedDollars:
        item.projectedAmount > 0 ? centsToDollars(item.projectedAmount).toFixed(2) : '',
      notes: existing?.notes || '',
    });
    setIsModalOpen(true);
  };

  // Save Modal
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalItem.name.trim()) return;

    const bgtCents = dollarsToCents(modalItem.budgetedDollars || 0);
    const prjCents = modalItem.projectedDollars
      ? dollarsToCents(modalItem.projectedDollars)
      : bgtCents;

    await saveItemBudget({
      id: modalItem.id,
      year: selectedYear,
      month: selectedMonth,
      name: modalItem.name.trim(),
      type: modalItem.type,
      categoryId: modalItem.categoryId || categories[0]?.id,
      budgetedAmount: bgtCents,
      projectedAmount: prjCents,
      notes: modalItem.notes,
    });

    setIsModalOpen(false);
  };

  // Inline edit handler
  const handleStartInlineEdit = (item: DetailedBudgetItem) => {
    setInlineEditingId(item.id);
    setInlineBudget(item.budgetedAmount > 0 ? centsToDollars(item.budgetedAmount).toFixed(2) : '');
    setInlineProjected(
      item.projectedAmount > 0 ? centsToDollars(item.projectedAmount).toFixed(2) : ''
    );
  };

  const handleSaveInlineEdit = async (item: DetailedBudgetItem) => {
    const bgtCents = dollarsToCents(inlineBudget || 0);
    const prjCents = inlineProjected ? dollarsToCents(inlineProjected) : bgtCents;

    const existing = itemBudgets.find(
      (b) =>
        b.id === item.itemBudgetId ||
        (b.name.toLowerCase() === item.name.toLowerCase() &&
          b.year === selectedYear &&
          b.month === selectedMonth)
    );

    await saveItemBudget({
      id: existing?.id,
      year: selectedYear,
      month: selectedMonth,
      name: item.name,
      type: item.type,
      categoryId: item.categoryId,
      budgetedAmount: bgtCents,
      projectedAmount: prjCents,
    });

    setInlineEditingId(null);
  };

  // CSV Export of monthly table
  const handleExportCSV = () => {
    const headers = [
      'Tipo',
      'Concepto/Gasto',
      'Categoria',
      'Presupuestado',
      'Proyectado',
      'Real Ejecutado',
      'Pendiente Planificado',
      'Variacion Absoluta',
      'Variacion Porcentaje',
      'Ejecucion Porcentaje',
      'Estado',
    ];

    const rows = detailedBudget.map((item) => [
      item.type === 'gasto' ? 'Gasto' : 'Ingreso',
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.categoryName.replace(/"/g, '""')}"`,
      centsToDollars(item.budgetedAmount).toFixed(2),
      centsToDollars(item.projectedAmount).toFixed(2),
      centsToDollars(item.realAmount).toFixed(2),
      centsToDollars(item.plannedPendingAmount).toFixed(2),
      centsToDollars(item.variation).toFixed(2),
      `${item.variationPct}%`,
      `${item.executionPct}%`,
      item.status,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `nexa_presupuesto_detallado_${selectedYear}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Main Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Table className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                Tabla Mensual de Presupuesto Detallado
              </h1>
              <p className="text-xs text-slate-400">
                Gasto por gasto e ingreso por ingreso: Presupuesto vs. Proyección vs. Real y variación en {monthName}.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {unbudgetedTransactions.length > 0 && (
            <button
              onClick={() => setIsSuggestionsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 text-xs font-semibold transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{unbudgetedTransactions.length} Sin Presupuestar</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-semibold border border-slate-700 transition cursor-pointer"
            title="Exportar a archivo CSV para Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => handleOpenNewModal()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Gasto / Ingreso Presupuestado</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Gastos, Ingresos, y Balance Neto */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Gastos Totales */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Gastos del Mes
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Gasto a Gasto</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center py-1">
            <div className="bg-slate-950/60 rounded-xl p-2 border border-slate-800/50">
              <span className="text-[10px] text-slate-400 block mb-0.5">Presupuestado</span>
              <span className="text-xs font-bold text-white">
                {formatMoney(kpis.totalExpenseBudget, settings.currencySymbol)}
              </span>
            </div>
            <div className="bg-slate-950/60 rounded-xl p-2 border border-slate-800/50">
              <span className="text-[10px] text-slate-400 block mb-0.5">Proyección</span>
              <span className="text-xs font-bold text-amber-300">
                {formatMoney(kpis.totalExpenseProjected, settings.currencySymbol)}
              </span>
            </div>
            <div className="bg-slate-950/60 rounded-xl p-2 border border-slate-800/50">
              <span className="text-[10px] text-slate-400 block mb-0.5">Real Ejecutado</span>
              <span className="text-xs font-bold text-rose-400">
                {formatMoney(kpis.totalExpenseReal, settings.currencySymbol)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs">
            <span className="text-slate-400">Variación Gastos:</span>
            <span
              className={`font-bold flex items-center gap-1 ${
                kpis.expenseVariation >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {kpis.expenseVariation >= 0 ? (
                <>
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Ahorro +{formatMoney(kpis.expenseVariation, settings.currencySymbol)}</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Exceso -{formatMoney(Math.abs(kpis.expenseVariation), settings.currencySymbol)}</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Ingresos Totales */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Ingresos del Mes
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Ingreso a Ingreso</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center py-1">
            <div className="bg-slate-950/60 rounded-xl p-2 border border-slate-800/50">
              <span className="text-[10px] text-slate-400 block mb-0.5">Presupuestado</span>
              <span className="text-xs font-bold text-white">
                {formatMoney(kpis.totalIncomeBudget, settings.currencySymbol)}
              </span>
            </div>
            <div className="bg-slate-950/60 rounded-xl p-2 border border-slate-800/50">
              <span className="text-[10px] text-slate-400 block mb-0.5">Proyección</span>
              <span className="text-xs font-bold text-blue-300">
                {formatMoney(kpis.totalIncomeProjected, settings.currencySymbol)}
              </span>
            </div>
            <div className="bg-slate-950/60 rounded-xl p-2 border border-slate-800/50">
              <span className="text-[10px] text-slate-400 block mb-0.5">Real Recibido</span>
              <span className="text-xs font-bold text-emerald-400">
                {formatMoney(kpis.totalIncomeReal, settings.currencySymbol)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs">
            <span className="text-slate-400">Variación Ingresos:</span>
            <span
              className={`font-bold flex items-center gap-1 ${
                kpis.incomeVariation >= 0 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {kpis.incomeVariation >= 0 ? (
                <>
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Superávit +{formatMoney(kpis.incomeVariation, settings.currencySymbol)}</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Déficit -{formatMoney(Math.abs(kpis.incomeVariation), settings.currencySymbol)}</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Balance Neto */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Balance Neto Período
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Ingresos - Gastos</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center py-1">
            <div className="bg-slate-950/60 rounded-xl p-2 border border-slate-800/50">
              <span className="text-[10px] text-slate-400 block mb-0.5">Neto Presupuestado</span>
              <span
                className={`text-xs font-bold ${
                  kpis.budgetedNet >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatMoney(kpis.budgetedNet, settings.currencySymbol)}
              </span>
            </div>
            <div className="bg-slate-950/60 rounded-xl p-2 border border-slate-800/50">
              <span className="text-[10px] text-slate-400 block mb-0.5">Neto Real Actual</span>
              <span
                className={`text-xs font-bold ${
                  kpis.realNet >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatMoney(kpis.realNet, settings.currencySymbol)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs">
            <span className="text-slate-400">Neto Proyectado al Cierre:</span>
            <span
              className={`font-bold ${
                kpis.projectedNet >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatMoney(kpis.projectedNet, settings.currencySymbol)}
            </span>
          </div>
        </div>
      </div>

      {/* Filters, Search & Sort Control Bar */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar gasto o ingreso específico..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Quick Segmented Type Selector */}
          <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({detailedBudget.length})
            </button>
            <button
              onClick={() => setFilterType('gasto')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filterType === 'gasto'
                  ? 'bg-rose-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Solo Gastos ({detailedBudget.filter((i) => i.type === 'gasto').length})
            </button>
            <button
              onClick={() => setFilterType('ingreso')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filterType === 'ingreso'
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Solo Ingresos ({detailedBudget.filter((i) => i.type === 'ingreso').length})
            </button>
          </div>
        </div>

        {/* Dropdowns row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros:</span>
          </div>

          {/* Category Dropdown */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none cursor-pointer max-w-[200px] truncate"
          >
            <option value="all">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type === 'gasto' ? 'Gasto' : 'Ingreso'})
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">Todos los estados</option>
            <option value="sobregiro">Con Sobregiro (Excedido)</option>
            <option value="alerta">En Alerta (≥ 80%)</option>
            <option value="favorable">Dentro de Presupuesto / En Meta</option>
            <option value="sin_presupuesto">Sin Presupuesto previo</option>
          </select>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-slate-500 font-medium">Ordenar:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="variation">Mayor Desviación / Variación</option>
              <option value="budget">Mayor Presupuesto</option>
              <option value="real">Mayor Gasto/Ingreso Real</option>
              <option value="name">Alfabético por Nombre</option>
            </select>
          </div>

          {(searchTerm || filterType !== 'all' || filterCategory !== 'all' || filterStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterCategory('all');
                setFilterStatus('all');
              }}
              className="text-blue-400 hover:underline font-medium"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Main Detailed Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead className="bg-slate-950/90 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 w-9"></th>
                <th className="py-3 px-3">Gasto / Ingreso Individual</th>
                <th className="py-3 px-3">Categoría</th>
                <th className="py-3 px-3 text-right">Presupuestado</th>
                <th className="py-3 px-3 text-right">Proyección</th>
                <th className="py-3 px-3 text-right">Real Ejecutado</th>
                <th className="py-3 px-3 text-right">Pendiente</th>
                <th className="py-3 px-3 text-right">Variación ($)</th>
                <th className="py-3 px-3 text-center w-36">% Ejecución</th>
                <th className="py-3 px-3 text-center">Estado</th>
                <th className="py-3 px-4 text-center w-20">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    <Table className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
                    <p className="text-sm font-semibold text-slate-400">
                      No se encontraron gastos o ingresos con los filtros seleccionados
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Puedes agregar un nuevo concepto presupuestado con el botón superior.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isExpanded = expandedItemIds.has(item.id);
                  const isInline = inlineEditingId === item.id;
                  const isExpense = item.type === 'gasto';

                  return (
                    <React.Fragment key={item.id}>
                      <tr
                        className={`hover:bg-slate-800/40 transition group ${
                          isExpanded ? 'bg-slate-800/25' : ''
                        }`}
                      >
                        {/* Expand transactions accordion button */}
                        <td className="py-3 px-2 text-center">
                          {item.transactions.length > 0 && (
                            <button
                              onClick={() => toggleRowExpansion(item.id)}
                              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                              title={`${isExpanded ? 'Ocultar' : 'Ver'} ${item.transactions.length} movimientos`}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 text-blue-400" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </td>

                        {/* Concept Name */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`p-1.5 rounded-lg text-[10px] font-bold ${
                                isExpense
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}
                            >
                              {isExpense ? (
                                <ArrowDownRight className="w-3.5 h-3.5" />
                              ) : (
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              )}
                            </span>
                            <div>
                              <div className="font-semibold text-white flex items-center gap-1.5">
                                <span>{item.name}</span>
                                {item.isCustom && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-300 font-normal">
                                    Personalizado
                                  </span>
                                )}
                              </div>
                              {item.transactions.length > 0 && (
                                <span className="text-[10px] text-slate-500">
                                  {item.transactions.length} movimiento(s) registrado(s)
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border"
                            style={{
                              backgroundColor: `${item.categoryColor || '#3b82f6'}15`,
                              borderColor: `${item.categoryColor || '#3b82f6'}30`,
                              color: item.categoryColor || '#60a5fa',
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: item.categoryColor || '#3b82f6' }}
                            />
                            <span>{item.categoryName}</span>
                          </span>
                        </td>

                        {/* Presupuestado */}
                        <td className="py-3 px-3 text-right">
                          {isInline ? (
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-slate-500 text-xs">$</span>
                              <input
                                type="number"
                                step="0.01"
                                value={inlineBudget}
                                onChange={(e) => setInlineBudget(e.target.value)}
                                className="w-20 bg-slate-950 border border-blue-500 rounded px-1.5 py-0.5 text-xs text-white text-right focus:outline-none"
                                autoFocus
                              />
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartInlineEdit(item)}
                              className="font-bold text-white hover:text-blue-400 hover:underline cursor-pointer group-hover:bg-slate-800/80 px-1.5 py-0.5 rounded transition"
                              title="Haz clic para editar presupuesto"
                            >
                              {item.budgetedAmount > 0
                                ? formatMoney(item.budgetedAmount, settings.currencySymbol)
                                : <span className="text-slate-500 italic font-normal">$0.00 (fijar)</span>}
                            </button>
                          )}
                        </td>

                        {/* Proyección */}
                        <td className="py-3 px-3 text-right">
                          {isInline ? (
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-slate-500 text-xs">$</span>
                              <input
                                type="number"
                                step="0.01"
                                value={inlineProjected}
                                onChange={(e) => setInlineProjected(e.target.value)}
                                placeholder="Proy"
                                className="w-20 bg-slate-950 border border-amber-500 rounded px-1.5 py-0.5 text-xs text-amber-300 text-right focus:outline-none"
                              />
                            </div>
                          ) : (
                            <span className="font-semibold text-amber-300">
                              {formatMoney(item.projectedAmount, settings.currencySymbol)}
                            </span>
                          )}
                        </td>

                        {/* Real Ejecutado */}
                        <td className="py-3 px-3 text-right">
                          <span
                            className={`font-bold ${
                              isExpense
                                ? item.realAmount > 0
                                  ? 'text-rose-400'
                                  : 'text-slate-500'
                                : item.realAmount > 0
                                ? 'text-emerald-400'
                                : 'text-slate-500'
                            }`}
                          >
                            {formatMoney(item.realAmount, settings.currencySymbol)}
                          </span>
                        </td>

                        {/* Pendiente Planificado */}
                        <td className="py-3 px-3 text-right text-slate-400">
                          {item.plannedPendingAmount > 0 ? (
                            <span className="text-amber-400/90 font-medium">
                              {formatMoney(item.plannedPendingAmount, settings.currencySymbol)}
                            </span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>

                        {/* Variación */}
                        <td className="py-3 px-3 text-right">
                          {item.budgetedAmount === 0 ? (
                            <span className="text-slate-500 italic">No fijado</span>
                          ) : (
                            <div className="font-bold flex flex-col items-end">
                              <span
                                className={`${
                                  (isExpense && item.variation >= 0) || (!isExpense && item.variation >= 0)
                                    ? 'text-emerald-400'
                                    : 'text-rose-400'
                                }`}
                              >
                                {item.variation >= 0 ? '+' : ''}
                                {formatMoney(item.variation, settings.currencySymbol)}
                              </span>
                              <span className="text-[10px] text-slate-500 font-normal">
                                {item.variationPct >= 0 ? '+' : ''}
                                {item.variationPct}%
                              </span>
                            </div>
                          )}
                        </td>

                        {/* % Ejecución & Progress Bar */}
                        <td className="py-3 px-3 text-center">
                          <div className="w-full space-y-1">
                            <div className="flex justify-between items-center text-[10px] px-0.5">
                              <span className="text-slate-400 font-medium">{item.executionPct}%</span>
                              <span className="text-slate-500 text-[9px]">
                                {item.budgetedAmount > 0
                                  ? `${formatMoney(item.realAmount, settings.currencySymbol)} de ${formatMoney(
                                      item.budgetedAmount,
                                      settings.currencySymbol
                                    )}`
                                  : 'Sin meta'}
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isExpense
                                    ? item.executionPct > 100
                                      ? 'bg-rose-500'
                                      : item.executionPct >= 80
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                    : item.executionPct >= 100
                                    ? 'bg-emerald-500'
                                    : 'bg-blue-500'
                                }`}
                                style={{ width: `${Math.min(100, item.executionPct)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Estado / Semáforo */}
                        <td className="py-3 px-3 text-center">
                          {item.status === 'sobregiro' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              <AlertCircle className="w-3 h-3" />
                              Sobregiro
                            </span>
                          )}
                          {item.status === 'alerta' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <AlertTriangle className="w-3 h-3" />
                              Alerta ≥80%
                            </span>
                          )}
                          {item.status === 'favorable' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              En Meta
                            </span>
                          )}
                          {item.status === 'en_meta' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              Recibido
                            </span>
                          )}
                          {item.status === 'sin_presupuesto' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-normal bg-slate-800 text-slate-400 border border-slate-700">
                              Sin presupuesto
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center">
                          {isInline ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleSaveInlineEdit(item)}
                                className="p-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer"
                                title="Guardar"
                              >
                                OK
                              </button>
                              <button
                                onClick={() => setInlineEditingId(null)}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs transition cursor-pointer"
                                title="Cancelar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEditModal(item)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                                title="Editar presupuesto detallado"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {item.itemBudgetId && (
                                <button
                                  onClick={() => deleteItemBudget(item.itemBudgetId!)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                                  title="Eliminar presupuesto personalizado"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>

                      {/* Sub-row: Transactions Details for this item */}
                      {isExpanded && (
                        <tr className="bg-slate-950/70 border-b border-slate-800">
                          <td colSpan={11} className="py-3 px-6">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold border-b border-slate-800/80 pb-1.5">
                                <span>Movimientos vinculados a "{item.name}"</span>
                                <span className="text-slate-500">
                                  {item.transactions.length} transacción(es) en este mes
                                </span>
                              </div>

                              <div className="divide-y divide-slate-900 text-xs">
                                {item.transactions.map((tx) => (
                                  <div
                                    key={tx.id}
                                    className="py-1.5 flex items-center justify-between gap-4 text-slate-300 hover:text-white transition"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`inline-block w-2 h-2 rounded-full ${
                                          tx.status === 'realizado' ? 'bg-emerald-500' : 'bg-amber-500'
                                        }`}
                                      />
                                      <span className="text-slate-400 text-[11px] font-mono">
                                        {tx.date}
                                      </span>
                                      <span className="font-medium text-white">{tx.concept}</span>
                                      {tx.notes && (
                                        <span className="text-slate-500 text-[11px]">({tx.notes})</span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-3">
                                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                                        {tx.status === 'realizado' ? 'Realizado' : 'Planificado'}
                                      </span>
                                      <span
                                        className={`font-bold ${
                                          tx.type === 'gasto' ? 'text-rose-400' : 'text-emerald-400'
                                        }`}
                                      >
                                        {tx.type === 'gasto' ? '-' : '+'}
                                        {formatMoney(tx.amount, settings.currencySymbol)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New / Edit Item Budget */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/20">
                  <Edit2 className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    {modalItem.id ? 'Editar Presupuesto de Gasto / Ingreso' : 'Definir Presupuesto Individual'}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Mes: {monthName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              {/* Type selector */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1.5">Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalItem({ ...modalItem, type: 'gasto' })}
                    className={`py-2 px-3 rounded-xl font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      modalItem.type === 'gasto'
                        ? 'bg-rose-500/15 border-rose-500/40 text-rose-400 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    <span>Gasto Individual</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalItem({ ...modalItem, type: 'ingreso' })}
                    className={`py-2 px-3 rounded-xl font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      modalItem.type === 'ingreso'
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Ingreso Individual</span>
                  </button>
                </div>
              </div>

              {/* Concept Name */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Nombre del Gasto o Ingreso <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={modalItem.name}
                  onChange={(e) => setModalItem({ ...modalItem, name: e.target.value })}
                  placeholder="Ej. Supermercado Walmart, Renta, Gasolina, Netflix..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Categoría General</label>
                <select
                  value={modalItem.categoryId}
                  onChange={(e) => setModalItem({ ...modalItem, categoryId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs cursor-pointer"
                >
                  {categories
                    .filter((c) => c.type === modalItem.type)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Presupuesto & Proyeccion */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Monto Presupuestado ($) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={modalItem.budgetedDollars}
                      onChange={(e) =>
                        setModalItem({ ...modalItem, budgetedDollars: e.target.value })
                      }
                      placeholder="0.00"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Monto Proyectado ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={modalItem.projectedDollars}
                      onChange={(e) =>
                        setModalItem({ ...modalItem, projectedDollars: e.target.value })
                      }
                      placeholder="Igual al presupuesto"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Opcional: estimación esperada.
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Notas / Justificación</label>
                <input
                  type="text"
                  value={modalItem.notes}
                  onChange={(e) => setModalItem({ ...modalItem, notes: e.target.value })}
                  placeholder="Detalles sobre este gasto o ingreso planificado..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-600/30 transition cursor-pointer"
                >
                  Guardar Presupuesto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Unbudgeted items quick suggestions */}
      {isSuggestionsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/20">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Movimientos del Mes sin Presupuesto Fijado
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Fija una meta para tener un control exacto de tus gastos e ingresos
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSuggestionsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-800 text-xs space-y-2 pr-1">
              {unbudgetedTransactions.map((item) => (
                <div key={item.id} className="pt-2 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-white block">{item.name}</span>
                    <span className="text-[11px] text-slate-400">
                      Gastado/Recibido: <strong className="text-rose-400">{formatMoney(item.realAmount, settings.currencySymbol)}</strong>
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setIsSuggestionsOpen(false);
                      handleOpenNewModal({
                        name: item.name,
                        type: item.type,
                        categoryId: item.categoryId,
                        budgetedAmount: item.realAmount,
                        projectedAmount: item.realAmount,
                      });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white font-semibold transition cursor-pointer"
                  >
                    + Fijar Presupuesto
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 text-right">
              <button
                onClick={() => setIsSuggestionsOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition cursor-pointer text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
