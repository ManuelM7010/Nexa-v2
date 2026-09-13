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
      if (filterPayment !== 'all' && tx.paymentMethodType !== filterPayment) {
        return false;
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
    if (tx.paymentMethodType === 'efectivo') return 'Efectivo';
    if (tx.paymentMethodType === 'tarjeta_credito') {
      const card = creditCards.find((c) => c.id === tx.creditCardId);
      return card ? card.name : 'Tarjeta de Crédito';
    }
    const acc = accounts.find((a) => a.id === tx.accountId);
    return acc ? acc.name : 'Cuenta Bancaria';
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Bar: Search, Filters & Action CTA */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
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

          {/* New Transaction Button */}
          <button
            onClick={() => setIsNewTxOpen(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white shadow-md shadow-blue-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Movimiento</span>
          </button>
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros:</span>
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
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">Todos los medios de pago</option>
            <option value="banco">Cuentas Bancarias</option>
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta_credito">Tarjetas de Crédito</option>
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
              className="text-blue-400 hover:underline ml-auto font-medium"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Dynamic Summary bar for filtered results */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] text-slate-400 border-t border-slate-800/60">
          <div className="flex items-center gap-3">
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

      {/* Movements Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-3">Fecha</th>
                <th className="py-3 px-4">Concepto / Detalle</th>
                <th className="py-3 px-3">Categoría</th>
                <th className="py-3 px-3">Medio de Pago</th>
                <th className="py-3 px-4 text-right">Monto</th>
                <th className="py-3 px-4 text-center">Acciones</th>
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
