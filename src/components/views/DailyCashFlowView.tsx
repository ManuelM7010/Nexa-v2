import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatMoney, formatDateEs } from '../../utils/formatters';
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Filter,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const DailyCashFlowView: React.FC = () => {
  const {
    dailyCashFlow,
    selectedMonth,
    selectedYear,
    settings,
    setIsNewTxOpen,
    setEditingTransaction,
    openNewTransactionModal,
    toggleTransactionStatus,
  } = useFinance();

  const [filterMode, setFilterMode] = useState<'all' | 'with_movements' | 'alerts_only'>('all');
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const filteredDays = dailyCashFlow.filter((day) => {
    const dayMovements = day.movements || day.events || [];
    if (filterMode === 'with_movements') {
      return dayMovements.length > 0;
    }
    if (filterMode === 'alerts_only') {
      return day.status === 'low' || day.status === 'negative';
    }
    return true;
  });

  const monthInitialBalance = dailyCashFlow[0]?.initialBalance || 0;
  const monthFinalBalance = dailyCashFlow[dailyCashFlow.length - 1]?.finalBalance || 0;
  const totalPlannedIn = dailyCashFlow.reduce((acc, d) => acc + d.projectedIncome, 0);
  const totalRealIn = dailyCashFlow.reduce((acc, d) => acc + d.realizedIncome, 0);
  const totalPlannedOut = dailyCashFlow.reduce((acc, d) => acc + d.projectedExpense, 0);
  const totalRealOut = dailyCashFlow.reduce((acc, d) => acc + d.realizedExpense, 0);
  const totalMonthIncome = totalPlannedIn + totalRealIn;
  const totalMonthExpense = totalPlannedOut + totalRealOut;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            Flujo de Caja & Liquidez Diaria
          </h2>
          <p className="text-xs text-slate-400">
            Proyección matemática diaria del saldo disponible en efectivo y cuentas bancarias con continuidad estricta mes a mes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos los días ({dailyCashFlow.length})
            </button>
            <button
              onClick={() => setFilterMode('with_movements')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                filterMode === 'with_movements'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Con movimientos
            </button>
            <button
              onClick={() => setFilterMode('alerts_only')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                filterMode === 'alerts_only'
                  ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Solo alertas
            </button>
          </div>
        </div>
      </div>

      {/* Continuity & Executive Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Saldo Inicial */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Saldo Inicial (Día 1)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono">Mes Anterior</span>
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {formatMoney(monthInitialBalance, settings.currencySymbol)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Coincide con saldo final del mes previo</span>
          </p>
        </div>

        {/* Card 2: Ingresos Totales */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Ingresos del Mes</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            +{formatMoney(totalMonthIncome, settings.currencySymbol)}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 font-mono">
            <span>Real: <strong className="text-emerald-300 font-semibold">{formatMoney(totalRealIn, settings.currencySymbol)}</strong></span>
            <span>•</span>
            <span>Plan: <strong className="text-slate-300 font-semibold">{formatMoney(totalPlannedIn, settings.currencySymbol)}</strong></span>
          </div>
        </div>

        {/* Card 3: Egresos y Obligaciones */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-xs text-rose-400 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Gastos & Obligaciones</span>
            <ArrowDownRight className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-400">
            -{formatMoney(totalMonthExpense, settings.currencySymbol)}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 font-mono">
            <span>Real: <strong className="text-rose-300 font-semibold">{formatMoney(totalRealOut, settings.currencySymbol)}</strong></span>
            <span>•</span>
            <span>Plan: <strong className="text-slate-300 font-semibold">{formatMoney(totalPlannedOut, settings.currencySymbol)}</strong></span>
          </div>
        </div>

        {/* Card 4: Saldo Final / Apertura Mes Siguiente */}
        <div className="bg-slate-900/90 border border-blue-900/50 rounded-2xl p-4 relative overflow-hidden shadow-sm bg-gradient-to-br from-blue-950/20 to-slate-900">
          <div className="flex items-center justify-between text-xs text-blue-300 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Saldo Final del Mes</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">Continuo ✓</span>
          </div>
          <div className={`text-xl font-bold font-mono ${monthFinalBalance < 0 ? 'text-rose-400' : 'text-blue-300'}`}>
            {formatMoney(monthFinalBalance, settings.currencySymbol)}
          </div>
          <p className="text-[11px] text-emerald-400/90 mt-1 font-medium">
            Saldo de apertura del mes siguiente
          </p>
        </div>
      </div>

      {/* Main Daily Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Fecha & Día</th>
                <th className="py-3 px-3 text-right">Saldo Inicial</th>
                <th className="py-3 px-3 text-right text-emerald-400">Ingresos Plan.</th>
                <th className="py-3 px-3 text-right text-emerald-300">Ingresos Real.</th>
                <th className="py-3 px-3 text-right text-rose-400">Gastos Plan.</th>
                <th className="py-3 px-3 text-right text-rose-300">Gastos Real.</th>
                <th className="py-3 px-4 text-right">Saldo Final</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredDays.map((day) => {
                const dayMovements = day.movements || day.events || [];
                const isExpanded = expandedDay === day.date;
                const hasMovements = dayMovements.length > 0;

                return (
                  <React.Fragment key={day.date}>
                    <tr
                      className={`hover:bg-slate-850/60 transition ${
                        day.isToday
                          ? 'bg-blue-950/20 border-l-4 border-l-blue-500'
                          : day.status === 'negative'
                          ? 'bg-rose-950/15'
                          : day.status === 'low'
                          ? 'bg-amber-950/10'
                          : ''
                      }`}
                    >
                      {/* Date */}
                      <td className="py-3.5 px-4 font-semibold text-white whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{day.date.slice(8)}</span>
                          <div>
                            <div className="capitalize text-slate-200">{day.dayName}</div>
                            {day.isToday && (
                              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                                Hoy
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Saldo Inicial */}
                      <td className="py-3.5 px-3 text-right text-slate-400 font-mono">
                        {formatMoney(day.initialBalance, settings.currencySymbol)}
                      </td>

                      {/* Ingresos Planificados */}
                      <td className="py-3.5 px-3 text-right text-emerald-400/80 font-mono">
                        {day.plannedIncome > 0 ? `+${formatMoney(day.plannedIncome, settings.currencySymbol)}` : '—'}
                      </td>

                      {/* Ingresos Reales */}
                      <td className="py-3.5 px-3 text-right text-emerald-400 font-mono font-bold">
                        {day.realIncome > 0 ? `+${formatMoney(day.realIncome, settings.currencySymbol)}` : '—'}
                      </td>

                      {/* Gastos Planificados */}
                      <td className="py-3.5 px-3 text-right text-rose-400/80 font-mono">
                        {day.plannedExpense > 0 ? `-${formatMoney(day.plannedExpense, settings.currencySymbol)}` : '—'}
                      </td>

                      {/* Gastos Reales */}
                      <td className="py-3.5 px-3 text-right text-rose-400 font-mono font-bold">
                        {day.realExpense > 0 ? `-${formatMoney(day.realExpense, settings.currencySymbol)}` : '—'}
                      </td>

                      {/* Saldo Final */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-sm">
                        <span
                          className={
                            day.finalBalance < 0
                              ? 'text-rose-400'
                              : day.finalBalance < 15000
                              ? 'text-amber-400'
                              : 'text-white'
                          }
                        >
                          {formatMoney(day.finalBalance, settings.currencySymbol)}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {day.status === 'positive' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Saludable
                          </span>
                        )}
                        {day.status === 'low' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <AlertTriangle className="w-3 h-3" /> Bajo
                          </span>
                        )}
                        {day.status === 'negative' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <XCircle className="w-3 h-3" /> Negativo
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {hasMovements && (
                            <button
                              onClick={() => setExpandedDay(isExpanded ? null : day.date)}
                              className="p-1.5 rounded-lg text-blue-400 hover:bg-slate-800 transition flex items-center gap-0.5"
                              title="Ver movimientos del día"
                            >
                              <span className="text-[10px] font-bold">{dayMovements.length}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => {
                              openNewTransactionModal({ date: day.date });
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="Agregar movimiento en este día"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* EXPANDABLE ROW: Movements on this day */}
                    {isExpanded && hasMovements && (
                      <tr className="bg-slate-950/90 border-y border-slate-800">
                        <td colSpan={9} className="p-4">
                          <div className="rounded-xl bg-slate-900 border border-slate-800 p-3 space-y-2">
                            <div className="text-xs font-bold text-slate-300 flex items-center justify-between border-b border-slate-800 pb-2">
                              <span>Movimientos programados para {formatDateEs(day.date)}:</span>
                              <span className="text-[11px] text-slate-400">
                                {dayMovements.length} operaciones
                              </span>
                            </div>

                            <div className="divide-y divide-slate-800/60">
                              {dayMovements.map((m) => (
                                <div
                                  key={m.id}
                                  className="py-2.5 flex items-center justify-between gap-3 text-xs"
                                >
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => toggleTransactionStatus(m.id)}
                                      className={`p-1 rounded transition ${
                                        m.status === 'realizado'
                                          ? 'text-emerald-400'
                                          : 'text-slate-500 hover:text-emerald-400'
                                      }`}
                                      title={m.status === 'realizado' ? 'Realizado' : 'Planificado'}
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                    </button>
                                    <div>
                                      <div className="font-bold text-white flex items-center gap-2">
                                        <span>{m.concept}</span>
                                        {m.notes && (
                                          <span className="text-[10px] text-slate-400 font-normal">
                                            ({m.notes})
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                                        <span className="capitalize">{m.type.replace('_', ' ')}</span>
                                        <span>•</span>
                                        <span className="capitalize">
                                          {m.paymentMethodType.replace('_', ' ')}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <div className="text-right">
                                      <span
                                        className={`font-mono font-bold ${
                                          m.type === 'ingreso' ? 'text-emerald-400' : 'text-slate-100'
                                        }`}
                                      >
                                        {m.type === 'ingreso' ? '+' : '-'}
                                        {formatMoney(m.amount, settings.currencySymbol)}
                                      </span>
                                      <span
                                        className={`block text-[10px] font-semibold ${
                                          m.status === 'realizado'
                                            ? 'text-emerald-400'
                                            : 'text-amber-400'
                                        }`}
                                      >
                                        {m.status === 'realizado' ? 'Realizado' : 'Planificado'}
                                      </span>
                                    </div>

                                    <button
                                      onClick={() => setEditingTransaction(m)}
                                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition cursor-pointer"
                                    >
                                      Editar
                                    </button>
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
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
