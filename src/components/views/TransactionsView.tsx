import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction, TransactionType, TransactionStatus, PaymentMethodType } from '../../types';
import { formatMoney, formatDateEs } from '../../utils/formatters';
import {
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  Trash2,
  Copy,
  Edit2,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  CreditCard,
  Building2,
  Wallet,
  Pin,
  Maximize2,
  Minimize2,
} from 'lucide-react';

export const TransactionsView: React.FC = () => {
  const {
    allMonthTransactions,
    categories,
    accounts,
    creditCards,
    settings,
    setIsNewTxOpen,
    setEditingTransaction,
    deleteTransaction,
    duplicateTransaction,
    toggleTransactionStatus,
  } = useFinance();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [isTableScrollFixed, setIsTableScrollFixed] = useState(true);

  const filteredTransactions = useMemo(() => {
    return allMonthTransactions.filter((tx) => {
      // Search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesConcept = tx.concept.toLowerCase().includes(term);
        const matchesNotes = tx.notes?.toLowerCase().includes(term);
        if (!matchesConcept && !matchesNotes) return false;
      }
      // Type
      if (filterType !== 'all' && tx.type !== filterType) {
        return false;
      }
      // Category filter
      if (filterCategory !== 'all') {
        if (filterCategory === 'uncategorized' && tx.categoryId) return false;
        if (filterCategory !== 'uncategorized' && tx.categoryId !== filterCategory) return false;
      }
      // Status
      if (filterStatus !== 'all' && tx.status !== filterStatus) {
        return false;
      }
      // Payment method
      if (filterPayment !== 'all') {
        if (filterPayment === 'banco' || filterPayment === 'type:banco') {
          // Bank accounts: transactions via bank or that involve an account
          const isBank = tx.paymentMethodType === 'banco' || (!!tx.accountId && tx.paymentMethodType !== 'tarjeta_credito');
          if (!isBank) return false;
        } else if (filterPayment === 'tarjeta_credito' || filterPayment === 'type:tarjeta_credito') {
          // Credit cards: purchases made with card or payments applied to card
          const isCard = tx.paymentMethodType === 'tarjeta_credito' || !!tx.creditCardId;
          if (!isCard) return false;
        } else if (filterPayment === 'efectivo' || filterPayment === 'type:efectivo') {
          if (tx.paymentMethodType !== 'efectivo') return false;
        } else if (filterPayment.startsWith('account:')) {
          const targetAccId = filterPayment.replace('account:', '');
          const matchesAccount = tx.accountId === targetAccId || tx.transferToAccountId === targetAccId;
          if (!matchesAccount) return false;
        } else if (filterPayment.startsWith('card:')) {
          const targetCardId = filterPayment.replace('card:', '');
          const matchesCard = tx.creditCardId === targetCardId;
          if (!matchesCard) return false;
        }
      }
      return true;
    });
  }, [allMonthTransactions, searchTerm, filterType, filterCategory, filterStatus, filterPayment]);

  // Quick stats of filtered transactions
  const filteredStats = useMemo(() => {
    let totalExpense = 0;
    let totalIncome = 0;
    let executedCount = 0;
    let pendingCount = 0;

    filteredTransactions.forEach((tx) => {
      if (tx.type === 'gasto') {
        totalExpense += tx.amount;
      } else if (tx.type === 'ingreso') {
        totalIncome += tx.amount;
      }
      if (tx.status === 'realizado') {
        executedCount++;
      } else {
        pendingCount++;
      }
    });

    return {
      count: filteredTransactions.length,
      totalExpense,
      totalIncome,
      net: totalIncome - totalExpense,
      executedCount,
      pendingCount,
    };
  }, [filteredTransactions]);

  const getCategoryName = (catId?: string) => {
    if (!catId) return 'General';
    const cat = categories.find((c) => c.id === catId);
    return cat ? cat.name : 'General';
  };

  const getPaymentName = (tx: Transaction) => {
    if (tx.type === 'pago_tarjeta') {
      const card = creditCards.find((c) => c.id === tx.creditCardId);
      const acc = accounts.find((a) => a.id === tx.accountId);
      return card ? `Pago: ${card.name}` : (acc ? acc.name : 'Pago Tarjeta');
    }
    if (tx.paymentMethodType === 'efectivo') return 'Efectivo';
    if (tx.paymentMethodType === 'tarjeta_credito') {
      const card = creditCards.find((c) => c.id === tx.creditCardId);
      return card ? card.name : 'Tarjeta de Crédito';
    }
    const acc = accounts.find((a) => a.id === tx.accountId);
    return acc ? acc.name : 'Cuenta Bancaria';
  };

  const isAccountActive =
    filterPayment === 'banco' || filterPayment === 'type:banco' || filterPayment.startsWith('account:');
  const isCardActive =
    filterPayment === 'tarjeta_credito' ||
    filterPayment === 'type:tarjeta_credito' ||
    filterPayment.startsWith('card:');
  const isCashActive = filterPayment === 'efectivo' || filterPayment === 'type:efectivo';

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Bar: Search, Filters & Action CTA (Sticky / Frozen Panel) */}
      <div className="sticky top-0 z-30 pt-1 pb-1.5 bg-slate-950/95 backdrop-blur-md">
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3 shadow-xl shadow-slate-950/80">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por concepto, notas o comercio..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Toggle Freeze / Sticky Mode */}
              <button
                type="button"
                onClick={() => setIsTableScrollFixed(!isTableScrollFixed)}
                title={
                  isTableScrollFixed
                    ? 'Encabezado fijo activo (solo se mueve la lista de abajo). Clic para expandir vista completa'
                    : 'Vista expandida activa. Clic para fijar encabezado y hacer scroll solo en los movimientos'
                }
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  isTableScrollFixed
                    ? 'bg-blue-600/15 border-blue-500/40 text-blue-300 hover:bg-blue-600/25 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Pin className={`w-3.5 h-3.5 ${isTableScrollFixed ? 'text-blue-400 fill-blue-400/30' : 'text-slate-500'}`} />
                <span>{isTableScrollFixed ? 'Encabezado Freeze' : 'Modo Libre'}</span>
              </button>

              {/* New Transaction Button */}
              <button
                onClick={() => setIsNewTxOpen(true)}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white shadow-md shadow-blue-600/30 transition cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Movimiento</span>
              </button>
            </div>
          </div>

        {/* Quick Payment Method Filter Pills */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <span>Medio de Pago:</span>
            </span>
            <button
              type="button"
              onClick={() => setFilterPayment('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filterPayment === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFilterPayment(filterPayment.startsWith('account:') ? filterPayment : 'banco')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                isAccountActive
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Cuentas Bancarias</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                {accounts.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setFilterPayment(filterPayment.startsWith('card:') ? filterPayment : 'tarjeta_credito')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                isCardActive
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 text-rose-400" />
              <span>Tarjetas de Crédito</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                {creditCards.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setFilterPayment('efectivo')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                isCashActive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Efectivo</span>
            </button>
          </div>

          {/* Sub-filter chips: Select a specific account ("una u otra") */}
          {isAccountActive && accounts.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-blue-950/20 border border-blue-900/30 rounded-xl text-xs">
              <span className="text-[11px] font-semibold text-blue-300/80 mr-1 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-blue-400" />
                <span>Filtrar cuenta:</span>
              </span>
              <button
                type="button"
                onClick={() => setFilterPayment('banco')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  filterPayment === 'banco'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                Todas las cuentas
              </button>
              {accounts.map((acc) => {
                const isSelected = filterPayment === `account:${acc.id}`;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setFilterPayment(`account:${acc.id}`)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow-sm'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>{acc.name}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                      ({acc.bank})
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Sub-filter chips: Select a specific credit card ("una u otra") */}
          {isCardActive && creditCards.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-rose-950/20 border border-rose-900/30 rounded-xl text-xs">
              <span className="text-[11px] font-semibold text-rose-300/80 mr-1 flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-rose-400" />
                <span>Filtrar tarjeta:</span>
              </span>
              <button
                type="button"
                onClick={() => setFilterPayment('tarjeta_credito')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  filterPayment === 'tarjeta_credito'
                    ? 'bg-rose-600 text-white font-bold'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                Todas las tarjetas
              </button>
              {creditCards.map((card) => {
                const isSelected = filterPayment === `card:${card.id}`;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setFilterPayment(`card:${card.id}`)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                      isSelected
                        ? 'bg-rose-600 text-white font-bold shadow-sm'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>{card.name}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-rose-200' : 'text-slate-400'}`}>
                      ({card.bank})
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Otros Filtros:</span>
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">Todos los tipos</option>
            <option value="gasto">Gastos</option>
            <option value="ingreso">Ingresos</option>
            <option value="pago_tarjeta">Pagos de Tarjeta</option>
            <option value="cuota_prestamo">Cuotas Préstamo</option>
            <option value="transferencia">Transferencias</option>
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none cursor-pointer max-w-[200px] truncate"
          >
            <option value="all">Todas las categorías</option>
            <optgroup label="Gastos">
              {categories
                .filter((c) => c.type === 'gasto')
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </optgroup>
            <optgroup label="Ingresos">
              {categories
                .filter((c) => c.type === 'ingreso')
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </optgroup>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">Todos los estados</option>
            <option value="planificado">Planificados</option>
            <option value="realizado">Realizados</option>
          </select>

          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none cursor-pointer max-w-[220px] truncate"
          >
            <option value="all">Todos los medios de pago</option>
            <optgroup label="── Por tipo de medio ──">
              <option value="banco">🏦 Cuentas Bancarias (Todas)</option>
              <option value="tarjeta_credito">💳 Tarjetas de Crédito (Todas)</option>
              <option value="efectivo">💵 Efectivo</option>
            </optgroup>
            {accounts.length > 0 && (
              <optgroup label="── Cuentas Bancarias (Específicas) ──">
                {accounts.map((acc) => (
                  <option key={acc.id} value={`account:${acc.id}`}>
                    🏦 {acc.name} ({acc.bank})
                  </option>
                ))}
              </optgroup>
            )}
            {creditCards.length > 0 && (
              <optgroup label="── Tarjetas de Crédito (Específicas) ──">
                {creditCards.map((card) => (
                  <option key={card.id} value={`card:${card.id}`}>
                    💳 {card.name} ({card.bank})
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          {(searchTerm ||
            filterType !== 'all' ||
            filterCategory !== 'all' ||
            filterStatus !== 'all' ||
            filterPayment !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterCategory('all');
                setFilterStatus('all');
                setFilterPayment('all');
              }}
              className="text-blue-400 hover:underline ml-auto font-medium cursor-pointer"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Dynamic Summary bar for filtered results */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] text-slate-400 border-t border-slate-800/60">
          <div className="flex items-center gap-3 flex-wrap">
            <span>
              Mostrando <strong className="text-white">{filteredStats.count}</strong> movimientos
            </span>
            <span className="text-slate-600">•</span>
            <span>
              <span className="text-emerald-400 font-semibold">{filteredStats.executedCount}</span> realizados
            </span>
            <span className="text-slate-600">•</span>
            <span>
              <span className="text-amber-400 font-semibold">{filteredStats.pendingCount}</span> planificados
            </span>
            {filterPayment !== 'all' && (
              <>
                <span className="text-slate-600">•</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  <span>Filtrando por:</span>
                  <strong className="text-white">
                    {filterPayment === 'banco' && 'Todas las Cuentas Bancarias'}
                    {filterPayment === 'tarjeta_credito' && 'Todas las Tarjetas de Crédito'}
                    {filterPayment === 'efectivo' && 'Efectivo'}
                    {filterPayment.startsWith('account:') && (accounts.find((a) => a.id === filterPayment.replace('account:', ''))?.name || 'Cuenta')}
                    {filterPayment.startsWith('card:') && (creditCards.find((c) => c.id === filterPayment.replace('card:', ''))?.name || 'Tarjeta')}
                  </strong>
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            {filteredStats.totalExpense > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Total Gastos:</span>
                <span className="text-rose-400 font-bold">
                  -{formatMoney(filteredStats.totalExpense, settings.currencySymbol)}
                </span>
              </div>
            )}
            {filteredStats.totalIncome > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Total Ingresos:</span>
                <span className="text-emerald-400 font-bold">
                  +{formatMoney(filteredStats.totalIncome, settings.currencySymbol)}
                </span>
              </div>
            )}
            {(filteredStats.totalExpense > 0 || filteredStats.totalIncome > 0) && (
              <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
                <span className="text-slate-400">Neto:</span>
                <span
                  className={`font-bold ${
                    filteredStats.net >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {filteredStats.net >= 0 ? '+' : ''}
                  {formatMoney(filteredStats.net, settings.currencySymbol)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Movements Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div
          className={`overflow-auto ${
            isTableScrollFixed
              ? 'max-h-[calc(100vh-360px)] min-h-[360px]'
              : ''
          }`}
        >
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800 shadow-sm">
              <tr>
                <th className="py-3 px-4 bg-slate-950">Estado</th>
                <th className="py-3 px-3 bg-slate-950">Fecha</th>
                <th className="py-3 px-4 bg-slate-950">Concepto / Detalle</th>
                <th className="py-3 px-3 bg-slate-950">Categoría</th>
                <th className="py-3 px-3 bg-slate-950">Medio de Pago</th>
                <th className="py-3 px-4 bg-slate-950 text-right">Monto</th>
                <th className="py-3 px-4 bg-slate-950 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No se encontraron movimientos registrados para este mes con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isIncome = tx.type === 'ingreso';
                  const isCardPayment = tx.type === 'pago_tarjeta';

                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-slate-850/60 transition ${
                        tx.status === 'realizado' ? 'bg-slate-900/40' : ''
                      }`}
                    >
                      {/* Status Toggle Button */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleTransactionStatus(tx.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${
                            tx.status === 'realizado'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-emerald-500/20'
                          }`}
                          title="Clic para alternar entre Realizado y Planificado"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{tx.status === 'realizado' ? 'Realizado' : 'Planificado'}</span>
                        </button>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-300">
                        {formatDateEs(tx.date, { withDayName: false })}
                      </td>

                      {/* Concept */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{tx.concept}</span>
                          {tx.origin?.startsWith('sub:') && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              Suscripción
                            </span>
                          )}
                          {tx.origin?.startsWith('srv:') && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                              Servicio
                            </span>
                          )}
                          {tx.origin?.startsWith('inst:') && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              Cuota
                            </span>
                          )}
                        </div>
                        {tx.notes && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                            {tx.notes}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-400">
                        {getCategoryName(tx.categoryId)}
                      </td>

                      {/* Payment Method */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          {tx.paymentMethodType === 'tarjeta_credito' && (
                            <CreditCard className="w-3.5 h-3.5 text-rose-400" />
                          )}
                          {tx.paymentMethodType === 'banco' && (
                            <Building2 className="w-3.5 h-3.5 text-blue-400" />
                          )}
                          {tx.paymentMethodType === 'efectivo' && (
                            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          <span className="truncate max-w-[130px]">{getPaymentName(tx)}</span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold text-sm">
                        <span
                          className={
                            isIncome
                              ? 'text-emerald-400'
                              : isCardPayment
                              ? 'text-sky-400'
                              : 'text-slate-100'
                          }
                        >
                          {isIncome ? '+' : '-'}
                          {formatMoney(tx.amount, settings.currencySymbol)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditingTransaction(tx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                            title="Editar movimiento"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => duplicateTransaction(tx.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition cursor-pointer"
                            title="Duplicar movimiento"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteTransaction(tx.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
