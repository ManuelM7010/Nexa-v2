import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatMoney, formatDateEs, MONTH_NAMES_SHORT_ES } from '../../utils/formatters';
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
  Sparkles,
  TrendingDown,
  ShieldAlert,
  X,
  ArrowRight,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  const [selectedKpiCard, setSelectedKpiCard] = useState<'initial' | 'income' | 'expense' | 'final' | 'lowest' | null>(null);

  const liquidityStartDate = settings.liquidityStartDate || '2026-09-15';
  const monthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const isStartMonth = liquidityStartDate.startsWith(monthKey);
  const startDayItem = dailyCashFlow.find((d) => d.date === liquidityStartDate);

  // Active days considering the liquidity start date (2026-09-15)
  const activeDaysForAnalysis = isStartMonth
    ? dailyCashFlow.filter((d) => d.date >= liquidityStartDate)
    : dailyCashFlow;

  // Day with lowest liquidity
  const lowestLiquidityDay = activeDaysForAnalysis.length > 0
    ? activeDaysForAnalysis.reduce((lowest, current) => {
        if (!lowest) return current;
        return current.finalBalance < lowest.finalBalance ? current : lowest;
      }, activeDaysForAnalysis[0])
    : null;

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

  // For the start month, the active opening balance is the balance on liquidityStartDate
  const monthInitialBalance = isStartMonth && startDayItem
    ? (startDayItem.initialBalance ?? startDayItem.startingBalance)
    : (dailyCashFlow[0]?.initialBalance || 0);

  const monthFinalBalance = dailyCashFlow[dailyCashFlow.length - 1]?.finalBalance || 0;
  const totalPlannedIn = dailyCashFlow.reduce((acc, d) => acc + (d.plannedIncome ?? d.projectedIncome), 0);
  const totalRealIn = dailyCashFlow.reduce((acc, d) => acc + (d.realIncome ?? d.realizedIncome), 0);
  const totalPlannedOut = dailyCashFlow.reduce((acc, d) => acc + (d.plannedExpense ?? d.projectedExpense), 0);
  const totalRealOut = dailyCashFlow.reduce((acc, d) => acc + (d.realExpense ?? d.realizedExpense), 0);
  const totalMonthIncome = totalPlannedIn + totalRealIn;
  const totalMonthExpense = totalPlannedOut + totalRealOut;

  const scrollToDay = (dateStr: string) => {
    setExpandedDay(dateStr);
    setTimeout(() => {
      const el = document.getElementById(`row-day-${dateStr}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

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

      {/* Starting Period Informative Banner */}
      {isStartMonth && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-blue-950/40 border border-blue-800/60 text-xs shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0 font-bold text-sm">
              15
            </div>
            <div>
              <div className="text-white font-semibold flex items-center gap-2">
                <span>Punto de partida de liquidez: 15 de Septiembre de 2026</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono font-bold">Oficial</span>
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Los saldos bancarios y efectivo inician oficialmente el 15 de septiembre. Los días 1 al 14 se preservan como histórico previo con balance en $0.00.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-500/10 border border-blue-400/20 text-blue-300 font-mono text-[11px] shrink-0 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              Continuidad activa
            </span>
          </div>
        </div>
      )}

      {/* Continuity & Executive Balance Cards (5 Interactive Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Card 1: Saldo Inicial */}
        <div
          onClick={() => setSelectedKpiCard('initial')}
          className="bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-4 relative overflow-hidden shadow-sm cursor-pointer transition active:scale-[0.99] group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              {isStartMonth
                ? `Saldo Inicial (${liquidityStartDate.slice(8)} ${MONTH_NAMES_SHORT_ES[selectedMonth - 1] || 'Sep'})`
                : 'Saldo Inicial (Día 1)'}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono">
              {isStartMonth ? 'Punto de Partida' : 'Mes Anterior'}
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-white group-hover:text-blue-300 transition">
            {formatMoney(monthInitialBalance, settings.currencySymbol)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <span className="truncate">
              {isStartMonth ? 'Inicio oficial 15 Sep' : 'Heredado del mes previo'}
            </span>
            <span className="text-[10px] text-blue-400 group-hover:underline">Detalle</span>
          </div>
        </div>

        {/* Card 2: Ingresos Totales */}
        <div
          onClick={() => setSelectedKpiCard('income')}
          className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 relative overflow-hidden shadow-sm cursor-pointer transition active:scale-[0.99] group"
        >
          <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Ingresos del Mes</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            +{formatMoney(totalMonthIncome, settings.currencySymbol)}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span>R: <strong className="text-emerald-300 font-semibold">{formatMoney(totalRealIn, settings.currencySymbol)}</strong></span>
            <span>•</span>
            <span>P: <strong className="text-slate-300 font-semibold">{formatMoney(totalPlannedIn, settings.currencySymbol)}</strong></span>
            <span className="text-[10px] text-emerald-400 group-hover:underline ml-1">Ver</span>
          </div>
        </div>

        {/* Card 3: Egresos y Obligaciones */}
        <div
          onClick={() => setSelectedKpiCard('expense')}
          className="bg-slate-900/90 border border-slate-800 hover:border-rose-500/50 rounded-2xl p-4 relative overflow-hidden shadow-sm cursor-pointer transition active:scale-[0.99] group"
        >
          <div className="flex items-center justify-between text-xs text-rose-400 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Gastos & Obligaciones</span>
            <ArrowDownRight className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-400">
            -{formatMoney(totalMonthExpense, settings.currencySymbol)}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span>R: <strong className="text-rose-300 font-semibold">{formatMoney(totalRealOut, settings.currencySymbol)}</strong></span>
            <span>•</span>
            <span>P: <strong className="text-slate-300 font-semibold">{formatMoney(totalPlannedOut, settings.currencySymbol)}</strong></span>
            <span className="text-[10px] text-rose-400 group-hover:underline ml-1">Ver</span>
          </div>
        </div>

        {/* Card 4: Saldo Final / Apertura Mes Siguiente */}
        <div
          onClick={() => setSelectedKpiCard('final')}
          className="bg-slate-900/90 border border-blue-900/50 hover:border-blue-400/60 rounded-2xl p-4 relative overflow-hidden shadow-sm bg-gradient-to-br from-blue-950/20 to-slate-900 cursor-pointer transition active:scale-[0.99] group"
        >
          <div className="flex items-center justify-between text-xs text-blue-300 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Saldo Final Estimado</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">Continuo ✓</span>
          </div>
          <div className={`text-xl font-bold font-mono ${monthFinalBalance < 0 ? 'text-rose-400' : 'text-blue-300'}`}>
            {formatMoney(monthFinalBalance, settings.currencySymbol)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-emerald-400/90 mt-1 font-medium">
            <span className="truncate">Apertura mes prox.</span>
            <span className="text-[10px] text-blue-400 group-hover:underline">Detalle</span>
          </div>
        </div>

        {/* Card 5: Día de Menor Liquidez (Punto Crítico) ⭐ */}
        <div
          onClick={() => {
            setSelectedKpiCard('lowest');
            if (lowestLiquidityDay) {
              scrollToDay(lowestLiquidityDay.date);
            }
          }}
          className={`bg-slate-900/90 border rounded-2xl p-4 relative overflow-hidden shadow-sm cursor-pointer transition active:scale-[0.99] group ${
            !lowestLiquidityDay
              ? 'border-slate-800'
              : lowestLiquidityDay.finalBalance < 0
              ? 'border-rose-500/50 bg-gradient-to-br from-rose-950/25 to-slate-900 hover:border-rose-400'
              : lowestLiquidityDay.finalBalance < 15000
              ? 'border-amber-500/50 bg-gradient-to-br from-amber-950/25 to-slate-900 hover:border-amber-400'
              : 'border-slate-800 hover:border-sky-500/50'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1 text-amber-400">
              <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
              Menor Liquidez
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                !lowestLiquidityDay
                  ? 'bg-slate-800 text-slate-400'
                  : lowestLiquidityDay.finalBalance < 0
                  ? 'bg-rose-500/20 text-rose-300'
                  : lowestLiquidityDay.finalBalance < 15000
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              {!lowestLiquidityDay
                ? 'N/A'
                : lowestLiquidityDay.finalBalance < 0
                ? 'Alerta Déficit'
                : lowestLiquidityDay.finalBalance < 15000
                ? 'Punto Crítico'
                : 'Suelo Seguro'}
            </span>
          </div>

          <div
            className={`text-xl font-bold font-mono ${
              !lowestLiquidityDay
                ? 'text-white'
                : lowestLiquidityDay.finalBalance < 0
                ? 'text-rose-400'
                : lowestLiquidityDay.finalBalance < 15000
                ? 'text-amber-400'
                : 'text-sky-300'
            }`}
          >
            {lowestLiquidityDay
              ? formatMoney(lowestLiquidityDay.finalBalance, settings.currencySymbol)
              : '$0.00'}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <span className="font-medium text-slate-300 truncate">
              {lowestLiquidityDay ? (
                <>Día {lowestLiquidityDay.date.slice(8)} ({lowestLiquidityDay.dayName})</>
              ) : (
                'Sin datos'
              )}
            </span>
            <span className="text-[10px] text-amber-400 group-hover:underline flex items-center gap-0.5 shrink-0">
              <span>Ver día</span>
              <ArrowDownRight className="w-3 h-3" />
            </span>
          </div>
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
                const isPriorToStart = day.date < liquidityStartDate;
                const isStartDay = day.date === liquidityStartDate;

                return (
                  <React.Fragment key={day.date}>
                    <tr
                      id={`row-day-${day.date}`}
                      className={`hover:bg-slate-850/60 transition ${
                        isStartDay
                          ? 'bg-blue-950/30 border-l-4 border-l-blue-400'
                          : day.isToday
                          ? 'bg-blue-950/20 border-l-4 border-l-blue-500'
                          : day.date === lowestLiquidityDay?.date
                          ? 'bg-amber-950/20 border-l-4 border-l-amber-400 ring-1 ring-amber-500/30'
                          : day.status === 'negative'
                          ? 'bg-rose-950/15'
                          : day.status === 'low'
                          ? 'bg-amber-950/10'
                          : isPriorToStart
                          ? 'opacity-70 bg-slate-950/25'
                          : ''
                      }`}
                    >
                      {/* Date */}
                      <td className="py-3.5 px-4 font-semibold text-white whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${isStartDay ? 'text-blue-400 font-extrabold' : day.date === lowestLiquidityDay?.date ? 'text-amber-300 font-extrabold' : ''}`}>
                            {day.date.slice(8)}
                          </span>
                          <div>
                            <div className="capitalize text-slate-200 flex items-center gap-1.5">
                              <span>{day.dayName}</span>
                              {isStartDay && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 uppercase tracking-wider">
                                  Inicio
                                </span>
                              )}
                              {day.date === lowestLiquidityDay?.date && !isPriorToStart && (
                                <span
                                  className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider flex items-center gap-0.5"
                                  title="Día con menor saldo de liquidez proyectado del mes"
                                >
                                  <TrendingDown className="w-2.5 h-2.5 text-amber-400" />
                                  Menor Liquidez
                                </span>
                              )}
                            </div>
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
                        {isPriorToStart ? (
                          <span className="text-slate-500 italic">$0.00</span>
                        ) : isStartDay ? (
                          <span className="text-blue-300 font-bold">
                            {formatMoney(day.initialBalance, settings.currencySymbol)}
                          </span>
                        ) : (
                          formatMoney(day.initialBalance, settings.currencySymbol)
                        )}
                      </td>

                      {/* Ingresos Planificados */}
                      <td className="py-3.5 px-3 text-right text-emerald-400/80 font-mono">
                        {(day.plannedIncome || 0) > 0 ? `+${formatMoney(day.plannedIncome, settings.currencySymbol)}` : '—'}
                      </td>

                      {/* Ingresos Reales */}
                      <td className="py-3.5 px-3 text-right text-emerald-400 font-mono font-bold">
                        {(day.realIncome || 0) > 0 ? `+${formatMoney(day.realIncome, settings.currencySymbol)}` : '—'}
                      </td>

                      {/* Gastos Planificados */}
                      <td className="py-3.5 px-3 text-right text-rose-400/80 font-mono">
                        {(day.plannedExpense || 0) > 0 ? `-${formatMoney(day.plannedExpense, settings.currencySymbol)}` : '—'}
                      </td>

                      {/* Gastos Reales */}
                      <td className="py-3.5 px-3 text-right text-rose-400 font-mono font-bold">
                        {(day.realExpense || 0) > 0 ? `-${formatMoney(day.realExpense, settings.currencySymbol)}` : '—'}
                      </td>

                      {/* Saldo Final */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-sm">
                        {isPriorToStart ? (
                          <span className="text-slate-500 italic">$0.00</span>
                        ) : (
                          <span
                            className={
                              day.finalBalance < 0
                                ? 'text-rose-400'
                                : day.finalBalance < 15000
                                ? 'text-amber-400'
                                : isStartDay
                                ? 'text-blue-300'
                                : 'text-white'
                            }
                          >
                            {formatMoney(day.finalBalance, settings.currencySymbol)}
                          </span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isStartDay ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/40 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                            Inicio Liquidez
                          </span>
                        ) : isPriorToStart ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700/60">
                            Previo al 15 Sep
                          </span>
                        ) : day.status === 'positive' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Saludable
                          </span>
                        ) : day.status === 'low' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <AlertTriangle className="w-3 h-3" /> Bajo
                          </span>
                        ) : day.status === 'negative' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <XCircle className="w-3 h-3" /> Negativo
                          </span>
                        ) : null}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {hasMovements && (
                            <button
                              onClick={() => setExpandedDay(isExpanded ? null : day.date)}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 transition text-[11px] cursor-pointer"
                              title="Ver detalles de movimientos"
                            >
                              <span>{dayMovements.length}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => openNewTransactionModal({ date: day.date })}
                            className="p-1 rounded bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white transition cursor-pointer"
                            title={`Registrar movimiento para ${formatDateEs(day.date)}`}
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

      {/* Interactive Bottom Sheet (Mobile) / Centered Modal (PC) for Card Details */}
      <AnimatePresence>
        {selectedKpiCard && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-lg bg-slate-900 border-t sm:border border-slate-700/80 rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 text-slate-100 max-h-[90vh] overflow-y-auto flex flex-col"
            >
              {/* Mobile drag handle */}
              <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto mb-3 sm:hidden cursor-grab" />

              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      selectedKpiCard === 'lowest'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : selectedKpiCard === 'income'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : selectedKpiCard === 'expense'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {selectedKpiCard === 'lowest' && <TrendingDown className="w-5 h-5" />}
                    {selectedKpiCard === 'income' && <ArrowUpRight className="w-5 h-5" />}
                    {selectedKpiCard === 'expense' && <ArrowDownRight className="w-5 h-5" />}
                    {selectedKpiCard === 'initial' && <Calendar className="w-5 h-5" />}
                    {selectedKpiCard === 'final' && <CheckCircle2 className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {selectedKpiCard === 'lowest' && 'Día de Menor Liquidez (Punto Crítico)'}
                      {selectedKpiCard === 'initial' && 'Saldo Inicial y Punto de Partida'}
                      {selectedKpiCard === 'income' && 'Ingresos Proyectados vs Realizados'}
                      {selectedKpiCard === 'expense' && 'Gastos y Compromisos del Mes'}
                      {selectedKpiCard === 'final' && 'Saldo de Cierre y Proyección Continua'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Análisis detallado para la toma de decisiones financieras
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedKpiCard(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="py-4 space-y-4 text-xs">
                {selectedKpiCard === 'lowest' && lowestLiquidityDay && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Fecha Crítica:</span>
                        <span className="font-bold text-white text-sm">
                          {formatDateEs(lowestLiquidityDay.date, { withDayName: true, withYear: true })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Saldo Mínimo Proyectado:</span>
                        <span
                          className={`font-mono font-bold text-base ${
                            lowestLiquidityDay.finalBalance < 0
                              ? 'text-rose-400'
                              : lowestLiquidityDay.finalBalance < 15000
                              ? 'text-amber-400'
                              : 'text-sky-300'
                          }`}
                        >
                          {formatMoney(lowestLiquidityDay.finalBalance, settings.currencySymbol)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-center">
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-emerald-400 block uppercase font-semibold">Ingresos Día</span>
                          <span className="font-mono font-bold text-emerald-300">
                            +{formatMoney((lowestLiquidityDay.plannedIncome || 0) + (lowestLiquidityDay.realIncome || 0), settings.currencySymbol)}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-rose-400 block uppercase font-semibold">Gastos Día</span>
                          <span className="font-mono font-bold text-rose-300">
                            -{formatMoney((lowestLiquidityDay.plannedExpense || 0) + (lowestLiquidityDay.realExpense || 0), settings.currencySymbol)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 space-y-1">
                      <div className="font-semibold flex items-center gap-1.5 text-xs">
                        <Info className="w-4 h-4 text-amber-400" />
                        <span>Recomendación de Liquidez</span>
                      </div>
                      <p className="text-[11px] text-amber-200/90 leading-relaxed">
                        {lowestLiquidityDay.finalBalance < 0
                          ? '⚠️ En este día tu saldo proyectado cae por debajo de cero. Te sugerimos reprogramar pagos no urgentes o transferir fondos antes de esta fecha para evitar comisiones por mora o sobregiro.'
                          : lowestLiquidityDay.finalBalance < 15000
                          ? 'Tu colchón de efectivo en este punto es ajustado. Evita realizar gastos discrecionales o compras impulsivas en los días previos a esta fecha.'
                          : '✓ Tu saldo se mantiene por encima del umbral mínimo de seguridad en todo momento. Tu flujo del mes es sostenible.'}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedKpiCard(null);
                        scrollToDay(lowestLiquidityDay.date);
                      }}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition cursor-pointer"
                    >
                      <span>Ir a este día en la tabla diaria</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {selectedKpiCard === 'initial' && (
                  <div className="space-y-3">
                    <p className="text-slate-300 leading-relaxed">
                      {isStartMonth
                        ? 'Septiembre de 2026 marca el punto oficial de inicio de tu sistema financiero en NEXA. Los saldos de tus cuentas bancarias y efectivo quedan registrados con fecha 15 de Septiembre.'
                        : 'El saldo de apertura de este mes coincide exactamente con el saldo de cierre del mes anterior, garantizando continuidad matemática absoluta en tu tesorería.'}
                    </p>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                      <span className="text-slate-400">Saldo Apertura Activo:</span>
                      <span className="font-mono font-bold text-white text-sm">
                        {formatMoney(monthInitialBalance, settings.currencySymbol)}
                      </span>
                    </div>
                  </div>
                )}

                {selectedKpiCard === 'income' && (
                  <div className="space-y-3">
                    <p className="text-slate-300 leading-relaxed">
                      Total de entradas programadas y registradas para el mes. El motor actualiza el flujo conforme marcas los movimientos como realizados.
                    </p>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Ingresos Ya Realizados:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          +{formatMoney(totalRealIn, settings.currencySymbol)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Ingresos Aún Planificados:</span>
                        <span className="font-mono font-bold text-slate-200">
                          +{formatMoney(totalPlannedIn, settings.currencySymbol)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-slate-800 pt-2 font-bold">
                        <span className="text-white">Total Entradas:</span>
                        <span className="font-mono text-emerald-400">
                          +{formatMoney(totalMonthIncome, settings.currencySymbol)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedKpiCard === 'expense' && (
                  <div className="space-y-3">
                    <p className="text-slate-300 leading-relaxed">
                      Total de salidas proyectadas que incluyen tus compromisos fijos, cuotas de préstamos, suscripciones y gastos del día a día.
                    </p>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Gastos Ya Realizados:</span>
                        <span className="font-mono font-bold text-rose-400">
                          -{formatMoney(totalRealOut, settings.currencySymbol)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Compromisos Pendientes:</span>
                        <span className="font-mono font-bold text-slate-200">
                          -{formatMoney(totalPlannedOut, settings.currencySymbol)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-slate-800 pt-2 font-bold">
                        <span className="text-white">Total Salidas:</span>
                        <span className="font-mono text-rose-400">
                          -{formatMoney(totalMonthExpense, settings.currencySymbol)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedKpiCard === 'final' && (
                  <div className="space-y-3">
                    <p className="text-slate-300 leading-relaxed">
                      Saldo proyectado al último día del mes. Este monto se transfiere automáticamente como saldo de apertura del día 1 del siguiente mes.
                    </p>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Saldo Cierre Proyectado:</span>
                        <span
                          className={`font-mono font-bold text-sm ${
                            monthFinalBalance < 0 ? 'text-rose-400' : 'text-blue-300'
                          }`}
                        >
                          {formatMoney(monthFinalBalance, settings.currencySymbol)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Resultado Neto del Mes:</span>
                        <span
                          className={`font-mono font-bold ${
                            totalMonthIncome - totalMonthExpense >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {totalMonthIncome - totalMonthExpense >= 0 ? '+' : ''}
                          {formatMoney(totalMonthIncome - totalMonthExpense, settings.currencySymbol)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="pt-2">
                <button
                  onClick={() => setSelectedKpiCard(null)}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
