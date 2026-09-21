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
} from 'lucide-react';

export const CreditCardStatementsView: React.FC = () => {
  const {
    creditCards,
    transactions,
    installmentPurchases,
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
  } = useFinance();

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

  // Generate statement for selected card and month
  const statement: CreditCardStatement | null = useMemo(() => {
    if (!currentCard) return null;
    return NexaFinancialEngine.generateCreditCardStatement(
      currentCard,
      selectedYear,
      selectedMonth,
      transactions,
      installmentPurchases,
      todayStr
    );
  }, [currentCard, selectedYear, selectedMonth, transactions, installmentPurchases, todayStr]);

  // Statements for all cards for global summary
  const allStatements: CreditCardStatement[] = useMemo(() => {
    return NexaFinancialEngine.generateAllCardStatements(
      activeCards,
      selectedYear,
      selectedMonth,
      transactions,
      installmentPurchases,
      todayStr
    );
  }, [activeCards, selectedYear, selectedMonth, transactions, installmentPurchases, todayStr]);

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
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
              title="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-bold text-white min-w-[130px] text-center">
              {MONTH_NAMES_ES[selectedMonth - 1]} {selectedYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
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
