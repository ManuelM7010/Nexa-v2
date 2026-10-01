import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { CreditCard, CreditCardStatement, Transaction } from '../../types';
import { NexaFinancialEngine } from '../../services/financialEngine';
import {
  formatMoney,
  centsToDollars,
  dollarsToCents,
  MONTH_NAMES_ES,
  formatPeriodEs,
  formatDateEs,
} from '../../utils/formatters';
import {
  FileSpreadsheet,
  CreditCard as CreditCardIcon,
  Calendar,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Plus,
  ShieldCheck,
  Building2,
  DollarSign,
  Tag,
  Receipt,
  Layers,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  CalendarRange,
  TrendingDown,
  TrendingUp,
  ArrowUpDown,
  Sparkles,
  ExternalLink,
  Edit2,
  X,
  PieChart,
  ArrowLeftRight,
} from 'lucide-react';

export const CreditCardStatementsView: React.FC = () => {
  const {
    creditCards,
    transactions,
    installmentPurchases,
    loans,
    categories,
    accounts,
    saveTransaction,
    selectedYear,
    selectedMonth,
    setSelectedYear,
    setSelectedMonth,
    settings,
    todayStr,
    setActiveTab,
    setIsNewTxOpen,
    setEditingTransaction,
    openNewTransactionModal,
  } = useFinance();

  // Top view mode switcher: 'cortes' (Estados de Cuenta TDDC Oficiales) vs 'rango_calendario' (Consulta por Rango de Fechas Calendario)
  const [statementViewMode, setStatementViewMode] = useState<'cortes' | 'rango_calendario'>('cortes');

  // Calendar Date Range state
  const [rangeCardId, setRangeCardId] = useState<string>(
    creditCards[0]?.id || 'all'
  );
  const [rangeStartDate, setRangeStartDate] = useState<string>('2026-08-01');
  const [rangeEndDate, setRangeEndDate] = useState<string>(todayStr || '2026-09-27');
  const [rangeSearch, setRangeSearch] = useState<string>('');
  const [rangeTypeFilter, setRangeTypeFilter] = useState<'cargos' | 'abonos' | 'todos'>('cargos');
  const [rangeStatusFilter, setRangeStatusFilter] = useState<'todos' | 'realizado' | 'planificado'>('todos');

  // Active Card filter (empty string = All cards overview)
  const [selectedCardId, setSelectedCardId] = useState<string>(
    creditCards[0]?.id || ''
  );

  // Quick Pay Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmountStr, setPayAmountStr] = useState('');
  const [payDate, setPayDate] = useState(todayStr);
  const [payCycleKey, setPayCycleKey] = useState('');
  const [payAccountId, setPayAccountId] = useState(
    accounts.find((a) => a.type === 'banco')?.id || accounts[0]?.id || ''
  );
  const [payCardTarget, setPayCardTarget] = useState<CreditCard | null>(null);

  // If creditCards changed and selected card not in list, pick first
  const activeCards = useMemo(() => creditCards.filter((c) => c.isActive), [creditCards]);

  const currentCard = useMemo(
    () => activeCards.find((c) => c.id === selectedCardId) || activeCards[0] || null,
    [activeCards, selectedCardId]
  );

  const liquidityStartDate = settings.liquidityStartDate || '2026-09-15';

  // Generate statement for selected card and month
  const statement: CreditCardStatement | null = useMemo(() => {
    if (!currentCard) return null;
    return NexaFinancialEngine.generateCreditCardStatement(
      currentCard,
      selectedYear,
      selectedMonth,
      transactions,
      installmentPurchases,
      todayStr,
      loans,
      liquidityStartDate
    );
  }, [currentCard, selectedYear, selectedMonth, transactions, installmentPurchases, todayStr, loans, liquidityStartDate]);

  // Statements for all cards for global summary
  const allStatements: CreditCardStatement[] = useMemo(() => {
    return NexaFinancialEngine.generateAllCardStatements(
      activeCards,
      selectedYear,
      selectedMonth,
      transactions,
      installmentPurchases,
      todayStr,
      loans,
      liquidityStartDate
    );
  }, [activeCards, selectedYear, selectedMonth, transactions, installmentPurchases, todayStr, loans, liquidityStartDate]);

  // Aggregate totals
  const totalGlobalTDDC = useMemo(() => {
    return allStatements.reduce((acc, st) => acc + st.totalDueAtCutOff, 0);
  }, [allStatements]);

  const totalGlobalLimit = useMemo(() => {
    return activeCards.reduce((acc, c) => acc + c.limit, 0);
  }, [activeCards]);

  const totalGlobalAvailable = useMemo(() => {
    return Math.max(0, totalGlobalLimit - totalGlobalTDDC);
  }, [totalGlobalLimit, totalGlobalTDDC]);

  // Calendar Range Filtered Transactions
  const rangeTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        // Is credit card related
        const isCard =
          tx.paymentMethodType === 'tarjeta_credito' ||
          !!tx.creditCardId ||
          tx.type === 'pago_tarjeta' ||
          tx.type === 'cuota_tarjeta';

        if (!isCard) return false;

        // Card match
        if (rangeCardId !== 'all') {
          if (tx.creditCardId !== rangeCardId) return false;
        }

        // Date range match (inclusive)
        if (rangeStartDate && tx.date < rangeStartDate) return false;
        if (rangeEndDate && tx.date > rangeEndDate) return false;

        // Type filter
        if (rangeTypeFilter === 'cargos') {
          // Cargos / Compras / Cuotas (not abonos/pagos)
          if (tx.type === 'pago_tarjeta') return false;
        } else if (rangeTypeFilter === 'abonos') {
          // Solo abonos / pagos a la tarjeta
          if (tx.type !== 'pago_tarjeta') return false;
        }

        // Status filter
        if (rangeStatusFilter !== 'todos' && tx.status !== rangeStatusFilter) {
          return false;
        }

        // Search query
        if (rangeSearch.trim()) {
          const q = rangeSearch.toLowerCase();
          const matchesConcept = (tx.concept || '').toLowerCase().includes(q);
          const matchesNotes = (tx.notes || '').toLowerCase().includes(q);
          const cat = categories.find((c) => c.id === tx.categoryId);
          const matchesCat = cat ? (cat.name || '').toLowerCase().includes(q) : false;
          if (!matchesConcept && !matchesNotes && !matchesCat) return false;
        }

        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [
    transactions,
    rangeCardId,
    rangeStartDate,
    rangeEndDate,
    rangeTypeFilter,
    rangeStatusFilter,
    rangeSearch,
    categories,
  ]);

  // Aggregate Metrics for Calendar Range
  const calendarMetrics = useMemo(() => {
    const allInRange = transactions.filter((tx) => {
      const isCard =
        tx.paymentMethodType === 'tarjeta_credito' ||
        !!tx.creditCardId ||
        tx.type === 'pago_tarjeta' ||
        tx.type === 'cuota_tarjeta';
      if (!isCard) return false;
      if (rangeCardId !== 'all' && tx.creditCardId !== rangeCardId) return false;
      if (rangeStartDate && tx.date < rangeStartDate) return false;
      if (rangeEndDate && tx.date > rangeEndDate) return false;
      return true;
    });

    let totalCargosCents = 0;
    let totalAbonosCents = 0;
    let cargosCount = 0;
    let abonosCount = 0;
    let maxCargoTx: Transaction | null = null;
    const catMap = new Map<string, { id: string; name: string; color: string; totalCents: number; count: number }>();

    allInRange.forEach((tx) => {
      if (tx.type === 'pago_tarjeta') {
        totalAbonosCents += tx.amount;
        abonosCount += 1;
      } else {
        totalCargosCents += tx.amount;
        cargosCount += 1;
        if (!maxCargoTx || tx.amount > maxCargoTx.amount) {
          maxCargoTx = tx;
        }

        // Category aggregation
        const cat = categories.find((c) => c.id === tx.categoryId);
        const catId = cat ? cat.id : 'sin_categoria';
        const catName = cat ? cat.name : 'General / Sin Categoría';
        const catColor = cat ? cat.color : '#64748b';
        const current = catMap.get(catId) || { id: catId, name: catName, color: catColor, totalCents: 0, count: 0 };
        current.totalCents += tx.amount;
        current.count += 1;
        catMap.set(catId, current);
      }
    });

    const avgCargoCents = cargosCount > 0 ? Math.round(totalCargosCents / cargosCount) : 0;
    const netVariationCents = totalCargosCents - totalAbonosCents;
    const categoryList = Array.from(catMap.values()).sort((a, b) => b.totalCents - a.totalCents);

    return {
      totalCargosCents,
      totalAbonosCents,
      netVariationCents,
      cargosCount,
      abonosCount,
      avgCargoCents,
      maxCargoTx,
      categoryList,
    };
  }, [transactions, rangeCardId, rangeStartDate, rangeEndDate, categories]);

  // Export CSV for Calendar Date Range
  const handleExportRangeCSV = () => {
    const targetCardObj = activeCards.find((c) => c.id === rangeCardId);
    const cardTitle = targetCardObj ? `${targetCardObj.name} (${targetCardObj.bank})` : 'Todas las Tarjetas';

    const headers = [
      'Fecha',
      'Tarjeta',
      'Banco',
      'Concepto / Comercio',
      'Categoría',
      'Tipo de Cargo',
      'Monto ($)',
      'Estado',
      'Notas',
    ];

    const rows = rangeTransactions.map((tx) => {
      const card = activeCards.find((c) => c.id === tx.creditCardId);
      const cat = categories.find((c) => c.id === tx.categoryId);
      const isPayment = tx.type === 'pago_tarjeta';
      return [
        tx.date,
        `"${(card?.name || 'Tarjeta de Crédito').replace(/"/g, '""')}"`,
        `"${(card?.bank || '').replace(/"/g, '""')}"`,
        `"${(tx.concept || '').replace(/"/g, '""')}"`,
        `"${(cat?.name || 'General').replace(/"/g, '""')}"`,
        `"${isPayment ? 'Abono / Pago TDC' : tx.installmentPurchaseId ? 'Cuota a Plazos' : 'Compra / Cargo Regular'}"`,
        (centsToDollars(tx.amount) * (isPayment ? -1 : 1)).toFixed(2),
        `"${tx.status === 'realizado' ? 'Confirmado' : 'Planificado'}"`,
        `"${(tx.notes || '').replace(/"/g, '""')}"`,
      ];
    });

    const summaryLines = [
      ['REPORTE DE CARGOS A TARJETA DE CREDITO POR RANGO CALENDARIO'],
      ['Tarjeta / Alcance', cardTitle],
      ['Rango de Fechas Calendario', `${rangeStartDate} al ${rangeEndDate}`],
      ['Total Cargos / Compras ($)', centsToDollars(calendarMetrics.totalCargosCents).toFixed(2)],
      ['Total Abonos / Pagos ($)', centsToDollars(calendarMetrics.totalAbonosCents).toFixed(2)],
      ['Variación Neta ($)', centsToDollars(calendarMetrics.netVariationCents).toFixed(2)],
      ['Transacciones Listadas', rangeTransactions.length.toString()],
      [],
      headers,
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      summaryLines.map((e) => e.join(',')).join('\n') +
      '\n' +
      rows.map((e) => e.join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const filenameCard = targetCardObj ? targetCardObj.name.replace(/\s+/g, '_') : 'Todas_TDC';
    link.setAttribute(
      'download',
      `Cargos_TDC_${filenameCard}_${rangeStartDate}_al_${rangeEndDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedYear(selectedYear - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedYear(selectedYear + 1);
      setSelectedMonth(1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleOpenPayModal = (card: CreditCard, defaultAmountCents?: number, defaultCycleKey?: string) => {
    setPayCardTarget(card);
    const remaining = statement && statement.cardId === card.id ? (statement.remainingDue ?? statement.totalDueAtCutOff) : 0;
    const initialAmount = defaultAmountCents !== undefined ? defaultAmountCents : remaining;
    setPayAmountStr(initialAmount > 0 ? centsToDollars(initialAmount).toFixed(2) : '');
    setPayDate(todayStr);
    const targetCycle = defaultCycleKey || (statement && statement.cardId === card.id ? statement.cycleKey : NexaFinancialEngine.determinePaymentCycleKey(card, todayStr));
    setPayCycleKey(targetCycle);
    setIsPayModalOpen(true);
  };

  const handleExecutePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payCardTarget) return;

    const amountCents = dollarsToCents(payAmountStr);
    if (amountCents <= 0) return;

    await saveTransaction({
      concept: `Abono Tarjeta: ${payCardTarget.name} (${payCardTarget.bank})`,
      amount: amountCents,
      date: payDate,
      type: 'pago_tarjeta',
      paymentMethodType: 'banco',
      accountId: payAccountId,
      creditCardId: payCardTarget.id,
      creditCardCycleKey: payCycleKey || undefined,
      status: 'realizado',
      origin: `pago_tarjeta:${payCardTarget.id}`,
      notes: payCycleKey ? `Abono aplicado al corte ${payCycleKey}` : 'Abono a tarjeta de crédito',
    });

    setIsPayModalOpen(false);
    setPayAmountStr('');
    setPayCardTarget(null);
  };

  const handleExportCSV = () => {
    if (!statement) return;

    const headers = ['Fecha', 'Concepto', 'Tipo', 'Categoria', 'Monto (USD)', 'Estado'];
    const rows = statement.transactions.map((t) => {
      const cat = categories.find((c) => c.id === t.categoryId);
      return [
        t.date,
        `"${(t.concept || '').replace(/"/g, '""')}"`,
        t.type,
        `"${(cat?.name || 'General').replace(/"/g, '""')}"`,
        centsToDollars(t.amount).toFixed(2),
        t.status,
      ];
    });

    // Summary lines
    const summaryLines = [
      [],
      ['ESTADO DE CUENTA - TARJETA DE CREDITO'],
      ['Tarjeta', statement.cardName],
      ['Banco', statement.bank],
      ['Periodo', statement.cycleLabel],
      ['Rango del Ciclo', `${statement.cycleStartDate} al ${statement.cycleEndDate}`],
      ['Fecha Limite de Pago', statement.paymentDueDate],
      ['Limite de Credito', centsToDollars(statement.limit).toFixed(2)],
      ['Total TDDC / Saldo al Corte', centsToDollars(statement.totalDueAtCutOff).toFixed(2)],
      ['Credito Disponible', centsToDollars(statement.availableCredit).toFixed(2)],
      ['Pago Minimo Sugerido', centsToDollars(statement.minimumPayment).toFixed(2)],
      [],
      headers,
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      summaryLines.map((e) => e.join(',')).join('\n') +
      '\n' +
      rows.map((e) => e.join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Estado_de_Cuenta_${statement.cardName.replace(/\s+/g, '_')}_${statement.cycleKey}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (activeCards.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-rose-400" />
              <span>Estados de Cuenta (TDDC)</span>
            </h2>
            <p className="text-xs text-slate-400">
              Control de corte mensual, total facturado y detalle de compras a crédito
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-4">
          <CreditCardIcon className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No tienes tarjetas de crédito registradas</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Registra tus tarjetas de crédito con su límite, día de corte y día de pago para generar
            automáticamente sus estados de cuenta y desglose de gastos.
          </p>
          <button
            onClick={() => setActiveTab('tarjetas')}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition"
          >
            Ir a Tarjetas de Crédito
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top View Mode Selector: Cortes Oficiales vs Consulta Rango Calendario */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl no-print">
        <button
          onClick={() => setStatementViewMode('cortes')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
            statementViewMode === 'cortes'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-transparent'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-rose-400" />
          <span>Estados de Cuenta por Corte (TDDC Oficial)</span>
        </button>

        <button
          onClick={() => setStatementViewMode('rango_calendario')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
            statementViewMode === 'rango_calendario'
              ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm shadow-blue-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-transparent'
          }`}
        >
          <CalendarRange className="w-4 h-4 text-sky-400" />
          <span>Consulta de Cargos por Rango Calendario</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] bg-sky-500/20 text-sky-300 border border-sky-500/30 uppercase font-black">
            Sin Cortes
          </span>
        </button>
      </div>

      {statementViewMode === 'cortes' ? (
        <>
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl no-print">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileSpreadsheet className="w-5 h-5 text-rose-400" />
                <h2 className="text-base font-bold text-white">
                  Estados de Cuenta TDDC & Detalle de Gastos
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Total de Deuda de Tarjeta de Crédito (TDDC) según fechas de corte y detalle de compras
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Month Selector Controls */}
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                  title="Mes anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 font-bold text-white min-w-[130px] text-center">
                  {MONTH_NAMES_ES[selectedMonth - 1]} {selectedYear}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                  title="Mes siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
                title="Exportar a CSV / Excel"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">CSV</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold transition cursor-pointer"
                title="Imprimir o guardar como PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir / PDF</span>
              </button>
            </div>
          </div>

      {/* Prior to Liquidity Start Notification */}
      {`${selectedYear}-${String(selectedMonth).padStart(2, '0')}` < liquidityStartDate.slice(0, 7) && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs">
          <Clock className="w-5 h-5 flex-shrink-0 text-amber-400" />
          <div>
            <p className="font-bold text-amber-200">
              Corte anterior a la fecha oficial de inicio de liquidez ({formatDateEs(liquidityStartDate, { withYear: true })})
            </p>
            <p className="text-amber-300/80 mt-0.5">
              Por configuración del sistema, las cuotas, suscripciones y gastos de meses anteriores no se cobran ni generan deudas en estados de cuenta previos al inicio de liquidez. Solo computan consumos y pagos a partir de dicha fecha.
            </p>
          </div>
        </div>
      )}

      {/* Global TDDC Summary Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Total TDDC Facturado (Todas las Tarjetas)
          </span>
          <div className="text-2xl font-black text-rose-400">
            {formatMoney(totalGlobalTDDC, settings.currencySymbol)}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Suma de saldos exigibles al corte en {MONTH_NAMES_ES[selectedMonth - 1]} {selectedYear}
          </span>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Línea de Crédito Total Otorgada
          </span>
          <div className="text-2xl font-black text-white">
            {formatMoney(totalGlobalLimit, settings.currencySymbol)}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Capacidad crediticia en {activeCards.length} tarjetas activas
          </span>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Crédito Total Disponible
          </span>
          <div className="text-2xl font-black text-sky-400">
            {formatMoney(totalGlobalAvailable, settings.currencySymbol)}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {totalGlobalLimit > 0
              ? `${Math.round((totalGlobalAvailable / totalGlobalLimit) * 100)}% de línea disponible`
              : '100%'}
          </span>
        </div>
      </div>

      {/* Card Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none no-print">
        {activeCards.map((card) => {
          const isSelected = card.id === currentCard?.id;
          const cardStmt = allStatements.find((s) => s.cardId === card.id);
          const cardRemaining = cardStmt ? (cardStmt.remainingDue ?? cardStmt.totalDueAtCutOff) : 0;
          const isFullyPaid = cardStmt?.status === 'pagado';

          return (
            <button
              key={card.id}
              onClick={() => setSelectedCardId(card.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/50 shadow-sm'
                  : 'bg-slate-900 text-slate-300 hover:text-white border-slate-800 hover:bg-slate-850'
              }`}
            >
              <CreditCardIcon className="w-4 h-4 text-rose-400" />
              <span>{card.name}</span>
              <span
                className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${
                  isFullyPaid
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : isSelected
                    ? 'bg-rose-500/30 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isFullyPaid ? '✓ Liquidado' : formatMoney(cardRemaining, settings.currencySymbol)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Detailed Card Statement View */}
      {statement && currentCard && (
        <div className="space-y-6">
          {/* Statement Document Card */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
            {/* Statement Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-black text-white">{statement.cardName}</h3>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {statement.bank}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                          statement.status === 'pagado'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : statement.status === 'parcial'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : statement.status === 'cortado'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                        }`}
                      >
                        {statement.status === 'pagado'
                          ? '✓ Liquidado / Sin Saldo'
                          : statement.status === 'parcial'
                          ? `⚡ Abono Parcial (${formatMoney(statement.totalPayments || 0, settings.currencySymbol)} abonado)`
                          : statement.status === 'cortado'
                          ? '● Cortado (Pendiente de Pago)'
                          : '⚡ Ciclo en Curso'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Periodo del corte: <strong className="text-slate-100">{formatPeriodEs(statement.cycleStartDate, statement.cycleEndDate)}</strong>{' '}
                      <span className="text-slate-500">({statement.cycleStartDate} al {statement.cycleEndDate})</span>
                      <span className="ml-2 text-slate-400">· Corte: día {statement.cutOffDay}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 no-print">
                  <button
                    onClick={() => handleOpenPayModal(currentCard, statement.remainingDue !== undefined ? statement.remainingDue : statement.totalDueAtCutOff, statement.cycleKey)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/30 cursor-pointer"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>
                      {statement.status === 'pagado'
                        ? 'Registrar Abono Adicional'
                        : (statement.totalPayments || 0) > 0
                        ? `Pagar Restante (${formatMoney(statement.remainingDue, settings.currencySymbol)})`
                        : 'Abonar / Pagar TDDC'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Statement Key Financial Parameters */}
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-800 bg-slate-950/60 text-xs">
              <div className="p-4 space-y-1">
                <span className="text-slate-400 font-semibold block text-[11px]">
                  TOTAL TDDC (Facturado al Corte)
                </span>
                <div className="text-xl font-black text-rose-400">
                  {formatMoney(statement.totalDueAtCutOff, settings.currencySymbol)}
                </div>
                {(statement.totalPayments || 0) > 0 ? (
                  <span className="text-[10px] text-amber-400 font-medium block">
                    Abonado: -{formatMoney(statement.totalPayments || 0, settings.currencySymbol)}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500">Monto total facturado</span>
                )}
              </div>

              <div className="p-4 space-y-1">
                <span className="text-slate-400 font-semibold block text-[11px]">
                  Saldo Pendiente de Pago
                </span>
                <div className={`text-xl font-black ${statement.remainingDue === 0 ? 'text-emerald-400' : 'text-amber-300'}`}>
                  {formatMoney(statement.remainingDue !== undefined ? statement.remainingDue : statement.totalDueAtCutOff, settings.currencySymbol)}
                </div>
                <span className="text-[10px] text-slate-500">
                  {statement.remainingDue === 0 ? '✓ Totalmente cubierto' : 'Monto exigible restante'}
                </span>
              </div>

              <div className="p-4 space-y-1">
                <span className="text-slate-400 font-semibold block text-[11px]">
                  Fecha Límite de Pago
                </span>
                <div className="text-base font-bold text-sky-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-sky-400" />
                  <span>{statement.paymentDueDate}</span>
                </div>
                <span className="text-[10px] text-slate-500">Día {currentCard.paymentDueDay} del mes</span>
              </div>

              <div className="p-4 space-y-1">
                <span className="text-slate-400 font-semibold block text-[11px]">
                  Límite / Crédito Disponible
                </span>
                <div className="text-base font-bold text-white">
                  {formatMoney(statement.availableCredit, settings.currencySymbol)}
                </div>
                <span className="text-[10px] text-slate-500">
                  De {formatMoney(statement.limit, settings.currencySymbol)} autorizado
                </span>
              </div>
            </div>

            {/* Cycle Arithmetic Breakdown Bar */}
            <div className="p-4 bg-slate-900 border-t border-b border-slate-800 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Saldo Inicial:</span>
                  <span className="font-mono font-bold text-white">
                    {formatMoney(statement.previousCycleBalance, settings.currencySymbol)}
                  </span>
                </div>
                <span className="text-slate-600 font-black">+</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Compras del Mes:</span>
                  <span className="font-mono font-bold text-rose-400">
                    +{formatMoney(statement.totalPurchases, settings.currencySymbol)}
                  </span>
                </div>
                <span className="text-slate-600 font-black">-</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Abonos Aplicados:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    -{formatMoney(statement.totalPayments || 0, settings.currencySymbol)}
                  </span>
                </div>
                <span className="text-slate-600 font-black">=</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-200">Saldo Pendiente:</span>
                  <span className={`font-mono font-black text-sm ${statement.remainingDue === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {formatMoney(statement.remainingDue !== undefined ? statement.remainingDue : statement.totalDueAtCutOff, settings.currencySymbol)}
                  </span>
                </div>
              </div>
            </div>

            {/* Itemized Transactions Section (Detalle de Gastos) */}
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-blue-400" />
                    <span>Detalle de Consumos y Movimientos del Periodo</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Consumos comprendidos del <strong className="text-slate-300">{statement.cycleStartDate}</strong> al{' '}
                    <strong className="text-slate-300">{statement.cycleEndDate}</strong> (desde el día siguiente al corte anterior hasta la fecha de corte)
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">
                  {statement.transactions.length} movimientos
                </span>
              </div>

              {statement.transactions.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-xs font-semibold text-white">
                    No se registraron consumos en este ciclo de facturación
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Todos los gastos que registres con método "Tarjeta de Crédito ({statement.cardName})" dentro
                    del periodo del corte aparecerán automáticamente aquí.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                        <th className="py-3 px-4">Fecha</th>
                        <th className="py-3 px-4">Concepto / Comercio</th>
                        <th className="py-3 px-3">Categoría</th>
                        <th className="py-3 px-3">Tipo / Origen</th>
                        <th className="py-3 px-3 text-right">Monto</th>
                        <th className="py-3 px-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {statement.transactions.map((tx) => {
                        const cat = categories.find((c) => c.id === tx.categoryId);
                        const isPayment = tx.type === 'pago_tarjeta';

                        return (
                          <tr
                            key={tx.id}
                            className={`hover:bg-slate-850/60 transition ${
                              isPayment ? 'bg-emerald-950/10' : ''
                            }`}
                          >
                            <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                              {tx.date}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-white">{tx.concept}</div>
                              {tx.notes && (
                                <div className="text-[10px] text-slate-400 mt-0.5">{tx.notes}</div>
                              )}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              {cat ? (
                                <span
                                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                                  style={{
                                    borderColor: `${cat.color || '#3b82f6'}40`,
                                    backgroundColor: `${cat.color || '#3b82f6'}15`,
                                    color: cat.color || '#60a5fa',
                                  }}
                                >
                                  <span
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: cat.color || '#3b82f6' }}
                                  />
                                  <span>{cat.name}</span>
                                </span>
                              ) : (
                                <span className="text-slate-500 text-[10px]">General</span>
                              )}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                                  isPayment
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : tx.installmentPurchaseId || tx.origin?.startsWith('cuota:')
                                    ? 'bg-purple-500/20 text-purple-300'
                                    : 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {isPayment
                                  ? 'Abono / Pago'
                                  : tx.installmentPurchaseId || tx.origin?.startsWith('cuota:')
                                  ? 'Cuota a Plazos'
                                  : 'Compra Regular'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold whitespace-nowrap">
                              <span className={isPayment ? 'text-emerald-400' : 'text-rose-400'}>
                                {isPayment ? '-' : '+'}
                                {formatMoney(tx.amount, settings.currencySymbol)}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  tx.status === 'realizado'
                                    ? 'bg-emerald-500/15 text-emerald-400'
                                    : 'bg-amber-500/15 text-amber-400'
                                }`}
                              >
                                {tx.status === 'realizado' ? 'Confirmado' : 'Planificado'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Installment purchases section for this card */}
            {installmentPurchases.filter((ip) => {
              if (ip.creditCardId !== currentCard.id) return false;
              const status = NexaFinancialEngine.getInstallmentPurchaseStatus(ip, statement.cycleEndDate);
              return !status.isCompleted || (status.lastInstallmentDate && status.lastInstallmentDate >= statement.cycleStartDate);
            }).length > 0 && (
              <div className="p-5 bg-slate-950/40 border-t border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-purple-300 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>Compras a Cuotas Vinculadas a Esta Tarjeta</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {installmentPurchases
                    .filter((ip) => {
                      if (ip.creditCardId !== currentCard.id) return false;
                      const status = NexaFinancialEngine.getInstallmentPurchaseStatus(ip, statement.cycleEndDate);
                      return !status.isCompleted || (status.lastInstallmentDate && status.lastInstallmentDate >= statement.cycleStartDate);
                    })
                    .map((ip) => {
                      const status = NexaFinancialEngine.getInstallmentPurchaseStatus(ip, statement.cycleEndDate);
                      const isChargedInThisCycle = statement.transactions.some(
                        (tx) => tx.installmentPurchaseId === ip.id || (tx.origin && tx.origin.startsWith(`cuota:${ip.id}`))
                      );
                      return (
                        <div
                          key={ip.id}
                          className={`p-3 rounded-xl border flex items-center justify-between ${
                            status.isCompleted
                              ? 'bg-emerald-950/20 border-emerald-800/40'
                              : 'bg-slate-900 border-slate-800'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white block">{ip.concept}</span>
                              {status.isCompleted ? (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  Finalizada ({status.totalInstallments}/{status.totalInstallments})
                                </span>
                              ) : isChargedInThisCycle ? (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  Cuota en este corte
                                </span>
                              ) : null}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              Cuota: {formatMoney(ip.installmentAmount, settings.currencySymbol)} • {status.paidCount} de {status.totalInstallments} pagadas
                              {status.isCompleted ? ' (Plan liquidado)' : ` (${status.remainingCount} restantes)`}
                            </span>
                          </div>
                          <div className="text-right font-mono">
                            <span className="text-[11px] text-slate-400 block">Saldo Pendiente:</span>
                            <span className={`font-bold ${status.isCompleted ? 'text-emerald-400' : 'text-purple-400'}`}>
                              {formatMoney(status.pendingBalance, settings.currencySymbol)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      </>
    ) : (
      /* Comprehensive Calendar Date Range View (Sin Cortes) */
      <div className="space-y-6">
        {/* Header & Controls for Calendar Date Range */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl no-print">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CalendarRange className="w-5 h-5 text-sky-400" />
              <h2 className="text-base font-bold text-white">
                Consulta de Cargos por Rango Calendario
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Sin Cortes
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Visualiza compras, cargos y abonos entre fechas calendario exactas para cualquier tarjeta de crédito
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportRangeCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
              title="Exportar reporte de rango a CSV / Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold transition cursor-pointer"
              title="Imprimir o guardar como PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>

            <button
              onClick={() => openNewTransactionModal({ type: 'gasto', categoryId: 'cat_alimentacion' })}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nuevo Cargo TDC</span>
            </button>
          </div>
        </div>

        {/* Card Selector & Calendar Date Range Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 no-print shadow-xl">
          {/* Card Selection Tabs */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              1. Selecciona la Tarjeta de Crédito:
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setRangeCardId('all')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 ${
                  rangeCardId === 'all'
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800 hover:bg-slate-850'
                }`}
              >
                <CreditCardIcon className="w-3.5 h-3.5" />
                <span>Todas las Tarjetas ({activeCards.length})</span>
              </button>

              {activeCards.map((card) => {
                const isSelected = rangeCardId === card.id;
                return (
                  <button
                    key={card.id}
                    onClick={() => setRangeCardId(card.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
                        : 'bg-slate-950 text-slate-300 hover:text-white border-slate-800 hover:bg-slate-850'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: card.color || '#ef4444' }}
                    />
                    <span>{card.name}</span>
                    <span className="text-[10px] text-slate-400">({card.bank})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Range Pickers & Preset Chips */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                2. Rango de Fechas Calendario:
              </label>

              {/* Exact user examples and quick presets */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[10px] text-slate-400 font-semibold mr-1 shrink-0">
                  Acceso Rápido:
                </span>
                <button
                  onClick={() => {
                    setRangeStartDate('2026-08-01');
                    setRangeEndDate('2026-09-15');
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium whitespace-nowrap transition cursor-pointer ${
                    rangeStartDate === '2026-08-01' && rangeEndDate === '2026-09-15'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-slate-950 text-slate-300 hover:text-white border-slate-800 hover:bg-slate-850'
                  }`}
                  title="Ejemplo explícito: 01 de Agosto al 15 de Septiembre"
                >
                  📌 01 Ago - 15 Sep
                </button>

                <button
                  onClick={() => {
                    setRangeStartDate('2026-08-01');
                    setRangeEndDate(todayStr || '2026-09-27');
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium whitespace-nowrap transition cursor-pointer ${
                    rangeStartDate === '2026-08-01' && rangeEndDate === (todayStr || '2026-09-27')
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-slate-950 text-slate-300 hover:text-white border-slate-800 hover:bg-slate-850'
                  }`}
                  title="Ejemplo explícito: 01 de Agosto hasta hoy (27 de Septiembre)"
                >
                  ⚡ 01 Ago - 27 Sep (Hoy)
                </button>

                <button
                  onClick={() => {
                    setRangeStartDate('2026-09-01');
                    setRangeEndDate(todayStr || '2026-09-27');
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium whitespace-nowrap transition cursor-pointer ${
                    rangeStartDate === '2026-09-01' && rangeEndDate === (todayStr || '2026-09-27')
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-slate-950 text-slate-300 hover:text-white border-slate-800 hover:bg-slate-850'
                  }`}
                >
                  Mes a Hoy (01-27 Sep)
                </button>

                <button
                  onClick={() => {
                    setRangeStartDate('2026-09-01');
                    setRangeEndDate('2026-09-30');
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium whitespace-nowrap transition cursor-pointer ${
                    rangeStartDate === '2026-09-01' && rangeEndDate === '2026-09-30'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-slate-950 text-slate-300 hover:text-white border-slate-800 hover:bg-slate-850'
                  }`}
                >
                  Septiembre Completo
                </button>

                <button
                  onClick={() => {
                    setRangeStartDate('2026-08-01');
                    setRangeEndDate('2026-08-31');
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium whitespace-nowrap transition cursor-pointer ${
                    rangeStartDate === '2026-08-01' && rangeEndDate === '2026-08-31'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-slate-950 text-slate-300 hover:text-white border-slate-800 hover:bg-slate-850'
                  }`}
                >
                  Agosto Completo
                </button>

                <button
                  onClick={() => {
                    setRangeStartDate('2026-01-01');
                    setRangeEndDate('2026-12-31');
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium whitespace-nowrap transition cursor-pointer ${
                    rangeStartDate === '2026-01-01' && rangeEndDate === '2026-12-31'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-slate-950 text-slate-300 hover:text-white border-slate-800 hover:bg-slate-850'
                  }`}
                >
                  Todo 2026
                </button>
              </div>
            </div>

            {/* Date Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="text-xs text-slate-400 font-medium shrink-0">Desde:</span>
                <input
                  type="date"
                  value={rangeStartDate}
                  onChange={(e) => setRangeStartDate(e.target.value)}
                  className="bg-transparent text-xs text-white focus:outline-none w-full font-mono cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="text-xs text-slate-400 font-medium shrink-0">Hasta:</span>
                <input
                  type="date"
                  value={rangeEndDate}
                  onChange={(e) => setRangeEndDate(e.target.value)}
                  className="bg-transparent text-xs text-white focus:outline-none w-full font-mono cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Executive KPI Metric Cards for the Calendar Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Total Cargos */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Total Cargos al Corte Calendario
              </span>
              <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-rose-400 tracking-tight font-mono">
              {formatMoney(calendarMetrics.totalCargosCents, settings.currencySymbol)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {calendarMetrics.cargosCount} compras o cargos en el rango
            </span>
          </div>

          {/* KPI 2: Total Abonos */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Abonos / Pagos Realizados
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-400 tracking-tight font-mono">
              {formatMoney(calendarMetrics.totalAbonosCents, settings.currencySymbol)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {calendarMetrics.abonosCount} abonos aplicados en el rango
            </span>
          </div>

          {/* KPI 3: Saldo Neto Generado */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Flujo Neto en Tarjeta
              </span>
              <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <ArrowUpDown className="w-4 h-4" />
              </div>
            </div>
            <div
              className={`text-2xl font-black tracking-tight font-mono ${
                calendarMetrics.netVariationCents > 0
                  ? 'text-amber-300'
                  : calendarMetrics.netVariationCents < 0
                  ? 'text-emerald-400'
                  : 'text-white'
              }`}
            >
              {calendarMetrics.netVariationCents > 0 ? '+' : ''}
              {formatMoney(calendarMetrics.netVariationCents, settings.currencySymbol)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {calendarMetrics.netVariationCents > 0
                ? 'Incremento de saldo exigible'
                : calendarMetrics.netVariationCents < 0
                ? 'Reducción de saldo exigible'
                : 'Balance neutro en periodo'}
            </span>
          </div>

          {/* KPI 4: Promedio & Mayor Cargo */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Ticket Promedio
              </span>
              <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-purple-300 tracking-tight font-mono">
              {formatMoney(calendarMetrics.avgCargoCents, settings.currencySymbol)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block truncate">
              {calendarMetrics.maxCargoTx
                ? `Mayor: ${calendarMetrics.maxCargoTx.concept} (${formatMoney(calendarMetrics.maxCargoTx.amount, settings.currencySymbol)})`
                : 'Sin cargos en el rango'}
            </span>
          </div>
        </div>

        {/* Category Spending Breakdown in Selected Calendar Window */}
        {calendarMetrics.categoryList.length > 0 && (
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Distribución de Cargos por Categoría ({rangeStartDate} al {rangeEndDate})
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {calendarMetrics.categoryList.length} categorías activas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {calendarMetrics.categoryList.map((cat) => {
                const pct =
                  calendarMetrics.totalCargosCents > 0
                    ? Math.round((cat.totalCents / calendarMetrics.totalCargosCents) * 100)
                    : 0;
                return (
                  <div
                    key={cat.id}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between gap-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-xs font-semibold text-white truncate">
                          {cat.name}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-rose-400 shrink-0">
                        {formatMoney(cat.totalCents, settings.currencySymbol)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{cat.count} {cat.count === 1 ? 'cargo' : 'cargos'}</span>
                      <span className="font-mono font-bold text-slate-300">{pct}% del total</span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-850 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(2, pct))}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Itemized Transactions Section */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
          {/* Filters Bar */}
          <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={rangeSearch}
                onChange={(e) => setRangeSearch(e.target.value)}
                placeholder="Buscar por concepto, comercio o notas..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
              />
              {rangeSearch && (
                <button
                  onClick={() => setRangeSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Type & Status Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-xs">
                <button
                  onClick={() => setRangeTypeFilter('cargos')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    rangeTypeFilter === 'cargos'
                      ? 'bg-rose-500/20 text-rose-300 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Solo Cargos
                </button>
                <button
                  onClick={() => setRangeTypeFilter('abonos')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    rangeTypeFilter === 'abonos'
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Solo Abonos
                </button>
                <button
                  onClick={() => setRangeTypeFilter('todos')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    rangeTypeFilter === 'todos'
                      ? 'bg-sky-500/20 text-sky-300 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Todos ({rangeTransactions.length})
                </button>
              </div>

              <select
                value={rangeStatusFilter}
                onChange={(e) => setRangeStatusFilter(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="todos">Todos los Estados</option>
                <option value="realizado">Solo Confirmados</option>
                <option value="planificado">Solo Planificados</option>
              </select>
            </div>
          </div>

          {/* Table Content */}
          {rangeTransactions.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 mx-auto">
                <CreditCardIcon className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">
                No se encontraron movimientos en este rango calendario
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No hay compras o abonos para la tarjeta seleccionada entre el{' '}
                <strong className="text-slate-200">{rangeStartDate}</strong> y el{' '}
                <strong className="text-slate-200">{rangeEndDate}</strong>.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => {
                    setRangeStartDate('2026-08-01');
                    setRangeEndDate(todayStr || '2026-09-27');
                    setRangeCardId('all');
                    setRangeSearch('');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
                >
                  Restablecer a 01 Ago - Hoy
                </button>
                <button
                  onClick={() => openNewTransactionModal({ type: 'gasto', categoryId: 'cat_alimentacion' })}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer"
                >
                  + Registrar Cargo Ahora
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Concepto / Comercio</th>
                    <th className="py-3 px-3">Tarjeta / Banco</th>
                    <th className="py-3 px-3">Categoría</th>
                    <th className="py-3 px-3">Tipo</th>
                    <th className="py-3 px-3 text-right">Monto</th>
                    <th className="py-3 px-3 text-center">Estado</th>
                    <th className="py-3 px-3 text-center no-print">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {rangeTransactions.map((tx) => {
                    const card = activeCards.find((c) => c.id === tx.creditCardId);
                    const cat = categories.find((c) => c.id === tx.categoryId);
                    const isPayment = tx.type === 'pago_tarjeta';

                    return (
                      <tr
                        key={tx.id}
                        className={`hover:bg-slate-850/60 transition ${
                          isPayment ? 'bg-emerald-950/10' : ''
                        }`}
                      >
                        {/* Fecha */}
                        <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                          {tx.date}
                        </td>

                        {/* Concepto & Comercio */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{tx.concept}</span>
                            {tx.installmentPurchaseId && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                                Cuota
                              </span>
                            )}
                          </div>
                          {tx.notes && (
                            <div className="text-[10px] text-slate-400 mt-0.5">{tx.notes}</div>
                          )}
                        </td>

                        {/* Tarjeta & Banco */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {card ? (
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: card.color || '#ef4444' }}
                              />
                              <div>
                                <span className="font-semibold text-slate-200 block text-xs">
                                  {card.name}
                                </span>
                                <span className="text-[10px] text-slate-400 block">{card.bank}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">Tarjeta de Crédito</span>
                          )}
                        </td>

                        {/* Categoría */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {cat ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                              style={{
                                borderColor: `${cat.color || '#3b82f6'}40`,
                                backgroundColor: `${cat.color || '#3b82f6'}15`,
                                color: cat.color || '#60a5fa',
                              }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: cat.color || '#3b82f6' }}
                              />
                              <span>{cat.name}</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[10px]">General</span>
                          )}
                        </td>

                        {/* Tipo */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                              isPayment
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : tx.installmentPurchaseId || tx.origin?.startsWith('cuota:')
                                ? 'bg-purple-500/20 text-purple-300'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {isPayment
                              ? 'Abono / Pago'
                              : tx.installmentPurchaseId || tx.origin?.startsWith('cuota:')
                              ? 'Cuota a Plazos'
                              : 'Compra Regular'}
                          </span>
                        </td>

                        {/* Monto */}
                        <td className="py-3 px-3 text-right font-mono font-bold whitespace-nowrap">
                          <span className={isPayment ? 'text-emerald-400' : 'text-rose-400'}>
                            {isPayment ? '-' : '+'}
                            {formatMoney(tx.amount, settings.currencySymbol)}
                          </span>
                        </td>

                        {/* Estado */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              tx.status === 'realizado'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-amber-500/15 text-amber-400'
                            }`}
                          >
                            {tx.status === 'realizado' ? 'Confirmado' : 'Planificado'}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="py-3 px-3 text-center whitespace-nowrap no-print">
                          <button
                            onClick={() => {
                              setEditingTransaction(tx);
                              setIsNewTxOpen(true);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                            title="Editar o corregir este movimiento"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Table Summary Footer */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-slate-400">
                  Mostrando <strong className="text-white">{rangeTransactions.length}</strong> movimientos en el rango del{' '}
                  <strong className="text-white">{rangeStartDate}</strong> al{' '}
                  <strong className="text-white">{rangeEndDate}</strong>
                </span>

                <div className="flex items-center gap-4 text-xs font-mono font-bold">
                  <div>
                    <span className="text-slate-400 font-sans font-normal mr-1.5">Total en Pantalla:</span>
                    <span className="text-rose-400">
                      {formatMoney(
                        rangeTransactions.reduce((acc, t) => acc + (t.type === 'pago_tarjeta' ? -t.amount : t.amount), 0),
                        settings.currencySymbol
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )}

      {/* Quick Pay Modal */}
      {isPayModalOpen && payCardTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto no-print">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Liquidar Estado de Cuenta TDDC</h3>
                  <p className="text-[11px] text-slate-400">
                    {payCardTarget.name} ({payCardTarget.bank})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecutePayment} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Monto a Abonar / Pagar ({settings.currencySymbol}) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={payAmountStr}
                    onChange={(e) => setPayAmountStr(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                    placeholder="0.00"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {statement && statement.remainingDue !== undefined && statement.remainingDue > 0 && statement.remainingDue < statement.totalDueAtCutOff && (
                      <button
                        type="button"
                        onClick={() => {
                          setPayAmountStr(centsToDollars(statement.remainingDue).toFixed(2));
                        }}
                        className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-[10px] font-bold"
                      >
                        Restante ({formatMoney(statement.remainingDue, settings.currencySymbol)})
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (statement) {
                          setPayAmountStr(centsToDollars(statement.totalDueAtCutOff).toFixed(2));
                        }
                      }}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-bold"
                    >
                      100% Corte
                    </button>
                  </div>
                </div>
              </div>

              {/* Fecha en que se efectúa el pago (Afecta liquidez este día) */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Fecha del Abono / Pago (Impacto en Liquidez) *
                </label>
                <input
                  type="date"
                  required
                  value={payDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setPayDate(newDate);
                    if (payCardTarget && !payCycleKey) {
                      setPayCycleKey(NexaFinancialEngine.determinePaymentCycleKey(payCardTarget, newDate));
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Esta fecha define el día exacto en que se descontará de tu <strong>flujo diario de liquidez</strong>.
                </p>
              </div>

              {/* Corte / Ciclo que amortizará en el Estado de Cuenta */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-semibold">
                    Corte / Ciclo a Amortizar en el Estado de Cuenta *
                  </label>
                  <span className="text-[10px] text-sky-400">Reduce deuda de este corte</span>
                </div>
                <select
                  value={payCycleKey}
                  onChange={(e) => setPayCycleKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                >
                  {NexaFinancialEngine.getAvailableBillingCycles(payCardTarget, payDate).map((c) => (
                    <option key={c.cycleKey} value={c.cycleKey}>
                      {c.cycleLabel} {c.isDefault ? '⭐ [Corte sugerido]' : ''}
                    </option>
                  ))}
                  <option value="">Automático según fecha del pago</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Puedes adelantar abonos antes de la fecha límite o abonar en cualquier día, afectando este corte específico.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Cuenta Bancaria de Origen (Débito) *
                </label>
                <select
                  value={payAccountId}
                  onChange={(e) => setPayAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.bankName || acc.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Live Contextual Dual Impact Box */}
              <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 space-y-1.5 text-[11px]">
                <div className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                  Resumen de Aplicación Contable:
                </div>
                <div className="flex items-center justify-between text-rose-400">
                  <span>📉 Flujo Diario (Liquidez):</span>
                  <span className="font-bold font-mono">Resta el día {payDate || 'hoy'}</span>
                </div>
                <div className="flex items-center justify-between text-emerald-400">
                  <span>💳 Estado de Cuenta TDDC:</span>
                  <span className="font-bold font-mono">
                    Amortiza {payCycleKey ? `Corte ${payCycleKey}` : 'Corte por fecha'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar Abono</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
