import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Account, AccountType } from '../../types';
import { formatMoney, dollarsToCents, centsToDollars, formatDateEs, MONTH_NAMES_ES } from '../../utils/formatters';
import { NexaFinancialEngine } from '../../services/financialEngine';
import {
  Wallet,
  Building2,
  Smartphone,
  Plus,
  ArrowLeftRight,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Sparkles,
  Search,
  Check,
  Clock,
} from 'lucide-react';

export const AccountsView: React.FC = () => {
  const {
    accounts,
    saveAccount,
    deleteAccount,
    saveTransaction,
    transactions,
    executiveSummary,
    selectedYear,
    selectedMonth,
    isCurrentMonth,
    todayStr,
    settings,
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('banco');
  const [bankName, setBankName] = useState('');
  const [balanceStr, setBalanceStr] = useState('');

  // Internal transfer state
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [transferAmountStr, setTransferAmountStr] = useState('');
  const [transferDate, setTransferDate] = useState('');
  const [transferConcept, setTransferConcept] = useState('');

  // Expanded account for movements view
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null);
  const [movementSearch, setMovementSearch] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState<'all' | 'inflow' | 'outflow' | 'transfer'>('all');

  const monthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const monthName = MONTH_NAMES_ES[selectedMonth - 1] || 'Mes';

  const liquidityStart = settings.liquidityStartDate || '2026-09-15';
  const isPriorToStartMonth = monthKey < liquidityStart.slice(0, 7);

  // Calculate detailed monthly breakdown for each account based on selected month
  const accountSummaries = useMemo(() => {
    const map = new Map<string, ReturnType<typeof NexaFinancialEngine.getAccountMonthlyBreakdown>>();
    accounts.forEach((acc) => {
      const currentBal = executiveSummary.accountBalances?.[acc.id] ?? (isPriorToStartMonth ? 0 : acc.initialBalance);
      const breakdown = NexaFinancialEngine.getAccountMonthlyBreakdown(
        acc,
        selectedYear,
        selectedMonth,
        transactions,
        currentBal,
        accounts,
        liquidityStart
      );
      map.set(acc.id, breakdown);
    });
    return map;
  }, [accounts, executiveSummary.accountBalances, selectedYear, selectedMonth, transactions, liquidityStart, isPriorToStartMonth]);

  // Aggregate monthly flows
  const totalMonthInflows = useMemo(() => {
    let sum = 0;
    accountSummaries.forEach((summary) => {
      // Exclude transfers to avoid double counting internal liquidity shifts in aggregate total
      sum += summary.monthInflow - summary.transfersReceived;
    });
    return sum;
  }, [accountSummaries]);

  const totalMonthOutflows = useMemo(() => {
    let sum = 0;
    accountSummaries.forEach((summary) => {
      sum += summary.monthOutflow - summary.transfersSent;
    });
    return sum;
  }, [accountSummaries]);

  const openNewModal = () => {
    setEditingAccount(null);
    setName('');
    setType('banco');
    setBankName('');
    setBalanceStr('0');
    setIsModalOpen(true);
  };

  const openEditModal = (acc: Account) => {
    setEditingAccount(acc);
    setName(acc.name);
    setType(acc.type);
    setBankName(acc.bankName || '');
    setBalanceStr(centsToDollars(acc.initialBalance).toFixed(2));
    setIsModalOpen(true);
  };

  const handleOpenTransfer = (originAccountId?: string) => {
    const origin = originAccountId || accounts[0]?.id || '';
    const dest = accounts.find((a) => a.id !== origin)?.id || accounts[1]?.id || '';
    setFromAccountId(origin);
    setToAccountId(dest);
    setTransferAmountStr('');
    setTransferDate(isCurrentMonth ? todayStr : `${monthKey}-01`);
    setTransferConcept('');
    setIsTransferOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await saveAccount({
      id: editingAccount?.id,
      name: name.trim(),
      type,
      bankName: bankName.trim() || undefined,
      initialBalance: dollarsToCents(balanceStr || 0),
    });

    setIsModalOpen(false);
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountCents = dollarsToCents(transferAmountStr || 0);
    if (amountCents <= 0 || fromAccountId === toAccountId) return;

    const fromAcc = accounts.find((a) => a.id === fromAccountId);
    const toAcc = accounts.find((a) => a.id === toAccountId);
    const dateUsed = transferDate || (isCurrentMonth ? todayStr : `${monthKey}-01`);

    await saveTransaction({
      concept: transferConcept.trim() || `Transferencia: ${fromAcc?.name} -> ${toAcc?.name}`,
      amount: amountCents,
      date: dateUsed,
      type: 'transferencia',
      paymentMethodType: fromAcc?.type === 'efectivo' ? 'efectivo' : 'banco',
      accountId: fromAccountId,
      transferToAccountId: toAccountId,
      status: 'realizado',
      notes: `Transferencia entre cuentas propias realizada para el período ${monthName} ${selectedYear}`,
    });

    setIsTransferOpen(false);
    setTransferAmountStr('');
    setTransferConcept('');
  };

  const consolidatedLiquidity = executiveSummary.currentRealCashBalance;
  const isFuture = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}` > todayStr.slice(0, 7);
  const isPast = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}` < todayStr.slice(0, 7);

  const periodBadgeText = isPriorToStartMonth
    ? `Período Previo — Inicio: ${formatDateEs(liquidityStart, { withDayName: false })}`
    : isCurrentMonth
    ? `Período Actual — Saldo Real Hoy (${formatDateEs(todayStr, { withDayName: false })})`
    : isFuture
    ? `Período Futuro — Apertura ${monthName} ${selectedYear}`
    : `Período Pasado — Cierre ${monthName} ${selectedYear}`;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header with Month Context */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white">Cuentas Bancarias & Efectivo</h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
              <Calendar className="w-3 h-3" />
              {monthName} {selectedYear}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                isPriorToStartMonth
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : isCurrentMonth
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {periodBadgeText}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Administración de cuentas corrientes, ahorro y efectivo. Los saldos reflejan la liquidez real actualizada y los movimientos realizados en <strong>{monthName} {selectedYear}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleOpenTransfer()}
            disabled={accounts.length < 2}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
              accounts.length >= 2
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 shadow-md cursor-pointer'
                : 'bg-slate-900/50 text-slate-600 border-slate-800/50 cursor-not-allowed opacity-50'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-blue-400" />
            <span>Transferir entre cuentas</span>
          </button>

          <button
            onClick={openNewModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white shadow-md shadow-blue-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Cuenta</span>
          </button>
        </div>
      </div>

      {/* Prior to Liquidity Start Notice */}
      {isPriorToStartMonth && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs">
          <Clock className="w-5 h-5 flex-shrink-0 text-amber-400" />
          <div>
            <p className="font-bold text-amber-200">
              Mes anterior a la fecha oficial de inicio de liquidez ({formatDateEs(liquidityStart, { withYear: true })})
            </p>
            <p className="text-amber-300/80 mt-0.5">
              Por configuración del sistema, las cuotas, suscripciones y gastos fijos de meses previos no se muestran ni afectan la liquidez bancaria ni los estados de cuenta. Los saldos de tus cuentas y movimientos computan a partir del día de inicio de liquidez.
            </p>
          </div>
        </div>
      )}

      {/* Aggregate KPI Cards - Synchronized with Real Liquidity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Consolidado Total */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase text-slate-400">
              Liquidez Consolidada
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {executiveSummary.periodLabel || 'Actual'}
            </span>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {formatMoney(consolidatedLiquidity, settings.currencySymbol)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Suma exacta de tus {accounts.length} cuentas activas en {monthName}
          </p>
        </div>

        {/* Card 2: En Bancos */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase text-slate-400">
              En Cuentas Bancarias
            </span>
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400 font-mono">
            {formatMoney(executiveSummary.bankBalance, settings.currencySymbol)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Fondos en instituciones bancarias y billeteras
          </p>
        </div>

        {/* Card 3: En Efectivo */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase text-slate-400">
              En Efectivo
            </span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {formatMoney(executiveSummary.cashBalance, settings.currencySymbol)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Dinero físico disponible de inmediato
          </p>
        </div>

        {/* Card 4: Flujo Neto Cuentas en el Mes */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase text-slate-400">
              Flujo del Mes en Cuentas
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                totalMonthInflows >= totalMonthOutflows
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              {totalMonthInflows >= totalMonthOutflows ? 'Superávit' : 'Déficit'}
            </span>
          </div>
          <div
            className={`text-2xl font-black font-mono ${
              totalMonthInflows - totalMonthOutflows >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatMoney(totalMonthInflows - totalMonthOutflows, settings.currencySymbol)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            +{formatMoney(totalMonthInflows, settings.currencySymbol)} / -{formatMoney(totalMonthOutflows, settings.currencySymbol)}
          </p>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {accounts.map((acc) => {
          const summary = accountSummaries.get(acc.id);
          const currentBal = summary?.currentBalance ?? acc.initialBalance;
          const openingBal = summary?.openingBalance ?? acc.initialBalance;
          const monthIn = summary?.monthInflow ?? 0;
          const monthOut = summary?.monthOutflow ?? 0;
          const transfersIn = summary?.transfersReceived ?? 0;
          const transfersOut = summary?.transfersSent ?? 0;
          const movementsCount = summary?.movements.length ?? 0;
          const isExpanded = expandedAccountId === acc.id;

          const pctOfTotal =
            consolidatedLiquidity > 0
              ? Math.round((Math.max(0, currentBal) / consolidatedLiquidity) * 100)
              : 0;

          return (
            <div
              key={acc.id}
              className={`rounded-2xl bg-slate-900 border p-5 shadow-xl transition space-y-4 ${
                isExpanded ? 'border-blue-500/50 bg-slate-900/95 ring-1 ring-blue-500/30' : 'border-slate-800'
              }`}
            >
              {/* Account Card Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl ${
                      acc.type === 'efectivo'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                        : acc.type === 'billetera'
                        ? 'bg-purple-500/15 text-purple-400 border border-purple-500/25'
                        : 'bg-blue-500/15 text-blue-400 border border-blue-500/25'
                    }`}
                  >
                    {acc.type === 'efectivo' ? (
                      <Wallet className="w-5 h-5" />
                    ) : acc.type === 'billetera' ? (
                      <Smartphone className="w-5 h-5" />
                    ) : (
                      <Building2 className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{acc.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5 capitalize">
                      <span>{acc.type}</span>
                      {acc.bankName && <span>• {acc.bankName}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(acc)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                    title="Editar cuenta"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteAccount(acc.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                    title="Eliminar cuenta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Balance Display with % share */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
                    Saldo al corte ({monthName} {selectedYear})
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                    {pctOfTotal}% de liquidez
                  </span>
                </div>
                <div className="text-2xl font-black text-white font-mono">
                  {formatMoney(currentBal, settings.currencySymbol)}
                </div>
              </div>

              {/* Monthly Flow Breakdown */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px]">
                <div>
                  <span className="text-[10px] text-slate-500 block">Apertura</span>
                  <span className="font-mono font-semibold text-slate-300">
                    {formatMoney(openingBal, settings.currencySymbol)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-500/80 block">+ Entradas</span>
                  <span className="font-mono font-semibold text-emerald-400">
                    +{formatMoney(monthIn, settings.currencySymbol)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-rose-500/80 block">- Salidas</span>
                  <span className="font-mono font-semibold text-rose-400">
                    -{formatMoney(monthOut, settings.currencySymbol)}
                  </span>
                </div>
              </div>

              {/* Transfers indicator if any in this month */}
              {(transfersIn > 0 || transfersOut > 0) && (
                <div className="flex items-center justify-between text-[11px] px-2.5 py-1 rounded-lg bg-blue-950/30 border border-blue-500/20 text-blue-300 font-medium">
                  <span className="flex items-center gap-1">
                    <ArrowLeftRight className="w-3 h-3 text-blue-400" />
                    <span>Transferencias internas:</span>
                  </span>
                  <span className="font-mono text-[10px]">
                    {transfersIn > 0 ? `+${formatMoney(transfersIn, settings.currencySymbol)} ` : ''}
                    {transfersOut > 0 ? `-${formatMoney(transfersOut, settings.currencySymbol)}` : ''}
                  </span>
                </div>
              )}

              {/* Card Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleOpenTransfer(acc.id)}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-blue-400 flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-700/60"
                >
                  <ArrowLeftRight className="w-3 h-3" />
                  <span>Transferir</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setExpandedAccountId(isExpanded ? null : acc.id);
                    setMovementSearch('');
                    setMovementTypeFilter('all');
                  }}
                  className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer border ${
                    isExpanded
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700/60 hover:bg-slate-700'
                  }`}
                >
                  <span>{movementsCount} movs</span>
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {/* Expanded Movements View for This Account */}
              {isExpanded && summary && (
                <div className="pt-3 border-t border-slate-800 space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      Movimientos en {monthName} {selectedYear}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {summary.movements.length} registro(s)
                    </span>
                  </div>

                  {summary.movements.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center text-xs text-slate-400">
                      No hay ingresos, egresos ni transferencias registradas en esta cuenta durante {monthName} {selectedYear}.
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                      {summary.movements.map((mov) => {
                        const isInflow = mov.flowAmount > 0;
                        return (
                          <div
                            key={mov.id}
                            className="p-2 rounded-xl bg-slate-950/90 border border-slate-800/80 flex items-center justify-between text-xs"
                          >
                            <div className="space-y-0.5 min-w-0 flex-1 pr-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-slate-200 truncate block">
                                  {mov.concept}
                                </span>
                                {mov.isTransfer && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                    {mov.transferDirection === 'in' ? (
                                      <>
                                        <ArrowDownLeft className="w-2.5 h-2.5 text-emerald-400" />
                                        De: {mov.counterpartName}
                                      </>
                                    ) : (
                                      <>
                                        <ArrowUpRight className="w-2.5 h-2.5 text-rose-400" />
                                        A: {mov.counterpartName}
                                      </>
                                    )}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <span>{formatDateEs(mov.date, { withDayName: false })}</span>
                                <span>•</span>
                                <span className="capitalize">{mov.type.replace('_', ' ')}</span>
                                {mov.status === 'realizado' ? (
                                  <span className="text-emerald-400 font-semibold">• Realizado</span>
                                ) : (
                                  <span className="text-amber-400 font-semibold">• Planificado</span>
                                )}
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span
                                className={`font-mono font-bold block ${
                                  isInflow ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {isInflow ? '+' : ''}
                                {formatMoney(mov.flowAmount, settings.currencySymbol)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Add/Edit Account */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100">
            <h3 className="text-base font-bold text-white mb-2">
              {editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Configura tu cuenta bancaria, billetera o efectivo líquido
            </p>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Nombre de la Cuenta</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Cuenta Corriente BAC, Efectivo Billetera..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Tipo de Cuenta</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as AccountType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="banco">Banco</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="billetera">Billetera Digital</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    Saldo Inicial Apertura ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={balanceStr}
                    onChange={(e) => setBalanceStr(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
                💡 <strong>Aclaración:</strong> El saldo inicial representa la apertura inicial configurada. El saldo en cada mes se calcula de forma dinámica y continua con los ingresos, egresos y transferencias que se realicen.
              </div>

              {type !== 'efectivo' && (
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Nombre de la Institución Bancaria</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Ej. BAC Credomatic, Banco Cuscatlán, Promerica..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-md cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Transfer Between Accounts */}
      {isTransferOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-blue-400" />
              Transferencia Entre Cuentas Propias
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Mueve fondos entre tus cuentas o efectúa retiros de efectivo sin alterar tu patrimonio total
            </p>

            <form onSubmit={handleExecuteTransfer} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Cuenta Origen (De)</label>
                <select
                  value={fromAccountId}
                  onChange={(e) => {
                    const newFrom = e.target.value;
                    setFromAccountId(newFrom);
                    if (toAccountId === newFrom) {
                      const other = accounts.find((a) => a.id !== newFrom);
                      if (other) setToAccountId(other.id);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium"
                >
                  {accounts.map((a) => {
                    const bal = accountSummaries.get(a.id)?.currentBalance ?? a.initialBalance;
                    return (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatMoney(bal, settings.currencySymbol)})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Cuenta Destino (A)</label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium"
                >
                  {accounts
                    .filter((a) => a.id !== fromAccountId)
                    .map((a) => {
                      const bal = accountSummaries.get(a.id)?.currentBalance ?? a.initialBalance;
                      return (
                        <option key={a.id} value={a.id}>
                          {a.name} ({formatMoney(bal, settings.currencySymbol)})
                        </option>
                      );
                    })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Monto ({settings.currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={transferAmountStr}
                    onChange={(e) => setTransferAmountStr(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Fecha</label>
                  <input
                    type="date"
                    required
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              {/* Quick transfer buttons */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {[50, 100, 200, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTransferAmountStr(String(amt))}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-slate-300 cursor-pointer"
                  >
                    +${amt}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Concepto o Detalle (Opcional)</label>
                <input
                  type="text"
                  value={transferConcept}
                  onChange={(e) => setTransferConcept(e.target.value)}
                  placeholder="Ej. Retiro de cajero, traslado para compras..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTransferOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-md cursor-pointer"
                >
                  Transferir Fondos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
