import React, { useState, useMemo } from 'react';
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
  Building2,
  CreditCard,
  Layers,
  Wallet,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CalculatorButton } from '../common/CalculatorButton';

export const DailyCashFlowView: React.FC = () => {
  const {
    dailyCashFlow,
    selectedMonth,
    selectedYear,
    settings,
    accounts,
    categories,
    creditCards,
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

  // Detail Modal breakdown data
  const [expenseDetailFilter, setExpenseDetailFilter] = useState<'all' | 'tarjeta' | 'prestamo' | 'servicio' | 'suscripcion' | 'otros'>('all');

  const allMonthMovements = useMemo(() => {
    const list: any[] = [];
    dailyCashFlow.forEach((d) => {
      const movs = d.movements || d.events || [];
      movs.forEach((m) => {
        list.push({ ...m, dayDate: d.date, dayName: d.dayName });
      });
    });
    return list;
  }, [dailyCashFlow]);

  const monthInflows = useMemo(() => {
    return allMonthMovements.filter((m) => m.type === 'ingreso' || m.type === 'retiro_ahorro');
  }, [allMonthMovements]);

  const monthOutflows = useMemo(() => {
    return allMonthMovements.filter((m) => m.type !== 'ingreso' && m.type !== 'retiro_ahorro');
  }, [allMonthMovements]);

  const filteredMonthOutflows = useMemo(() => {
    if (expenseDetailFilter === 'all') return monthOutflows;
    if (expenseDetailFilter === 'tarjeta') {
      return monthOutflows.filter(
        (m) =>
          m.type === 'pago_tarjeta' ||
          m.origin?.startsWith('pago_tarjeta:') ||
          m.origin?.startsWith('cuota:') ||
          m.installmentPurchaseId
      );
    }
    if (expenseDetailFilter === 'prestamo') {
      return monthOutflows.filter(
        (m) => m.type === 'cuota_prestamo' || m.origin?.startsWith('prestamo:') || m.loanId
      );
    }
    if (expenseDetailFilter === 'servicio') {
      return monthOutflows.filter((m) => m.type === 'servicio' || m.origin?.startsWith('servicio:'));
    }
    if (expenseDetailFilter === 'suscripcion') {
      return monthOutflows.filter((m) => m.type === 'suscripcion' || m.origin?.startsWith('suscripcion:'));
    }
    return monthOutflows.filter(
      (m) =>
        m.type !== 'pago_tarjeta' &&
        !m.origin?.startsWith('pago_tarjeta:') &&
        !m.origin?.startsWith('cuota:') &&
        !m.installmentPurchaseId &&
        m.type !== 'cuota_prestamo' &&
        !m.origin?.startsWith('prestamo:') &&
        !m.loanId &&
        m.type !== 'servicio' &&
        !m.origin?.startsWith('servicio:') &&
        m.type !== 'suscripcion' &&
        !m.origin?.startsWith('suscripcion:')
    );
  }, [monthOutflows, expenseDetailFilter]);

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
          <CalculatorButton label="Calculadora" title="Abrir calculadora rápida de flujo diario" />

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
        <div id="starting-liquidity-banner" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900 border border-blue-900/60 text-xs shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0 font-bold text-sm">
              15
            </div>
            <div>
              <div className="text-white font-semibold flex items-center gap-2">
                <span>Punto de partida de liquidez: 15 de Septiembre de 2026</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold border border-blue-500/30">Oficial</span>
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
                ? `Saldo Inicial (${liquidityStartDate.slice(8)} ${MONTH_NAMES_SHORT_ES[Number(liquidityStartDate.slice(5, 7)) - 1] || 'Inicio'})`
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
              {isStartMonth ? `Inicio: ${formatDateEs(liquidityStartDate, { withDayName: false, withYear: false })}` : 'Heredado del mes previo'}
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
          className="bg-slate-900/90 border border-blue-900/50 hover:border-blue-400/60 rounded-2xl p-4 relative overflow-hidden shadow-sm cursor-pointer transition active:scale-[0.99] group"
        >
          <div className="flex items-center justify-between text-xs text-blue-300 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Saldo Final Estimado</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">Continuo ✓</span>
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
              ? 'border-rose-500/50 hover:border-rose-400'
              : lowestLiquidityDay.finalBalance < 15000
              ? 'border-amber-500/50 hover:border-amber-400'
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
              className="w-full max-w-2xl bg-slate-900 border-t sm:border border-slate-700/80 rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 text-slate-100 max-h-[90vh] overflow-y-auto flex flex-col"
            >
              {/* Mobile drag handle */}
              <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto mb-3 sm:hidden cursor-grab" />

              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
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
                      {selectedKpiCard === 'initial' && 'Detalle del Saldo Inicial & Cuentas'}
                      {selectedKpiCard === 'income' && `Ingresos del Mes (${monthInflows.length} movimientos)`}
                      {selectedKpiCard === 'expense' && `Gastos & Obligaciones (${monthOutflows.length} movimientos)`}
                      {selectedKpiCard === 'final' && 'Saldo de Cierre & Cascada de Continuidad'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {selectedKpiCard === 'lowest' && 'Revisa el día con el balance más ajustado de tu flujo proyectado'}
                      {selectedKpiCard === 'initial' && 'Composición de tesorería y cuentas al inicio del periodo'}
                      {selectedKpiCard === 'income' && 'Entradas planificadas y cobradas para este mes'}
                      {selectedKpiCard === 'expense' && 'Salidas clasificadas por compromisos fijos, cuotas y compras'}
                      {selectedKpiCard === 'final' && 'Balance matemático exacto que transfiere como apertura al siguiente mes'}
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
                {/* 1. INITIAL BALANCE CARD DETAIL */}
                {selectedKpiCard === 'initial' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">
                          Saldo Total de Apertura ({isStartMonth ? `Desde ${liquidityStartDate}` : 'Día 1'})
                        </span>
                        <span className="text-2xl font-black font-mono text-white">
                          {formatMoney(monthInitialBalance, settings.currencySymbol)}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-mono font-medium self-start sm:self-auto">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                        {isStartMonth ? 'Punto de Partida Oficial' : 'Heredado del mes anterior'}
                      </span>
                    </div>

                    {/* Breakdown by Account */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">
                        Composición por Cuentas Bancarias & Efectivo Activo
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto">
                        {accounts
                          .filter((a) => a.isActive)
                          .map((acc) => (
                            <div
                              key={acc.id}
                              className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-blue-400 shrink-0">
                                  {acc.type === 'banco' ? (
                                    <Building2 className="w-4 h-4" />
                                  ) : (
                                    <Wallet className="w-4 h-4 text-emerald-400" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <span className="font-bold text-white block text-xs truncate">
                                    {acc.name}
                                  </span>
                                  <span className="text-[10px] text-slate-400 capitalize">
                                    {acc.bank || (acc.type === 'banco' ? 'Cuenta Bancaria' : 'Efectivo')}
                                  </span>
                                </div>
                              </div>
                              <span className="font-mono font-bold text-slate-100 text-xs shrink-0">
                                {formatMoney(acc.initialBalance, settings.currencySymbol)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-xs leading-relaxed flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <span>
                        {isStartMonth
                          ? 'Septiembre de 2026 marca el punto oficial de inicio de tu sistema financiero en VALORA. Los saldos de tus cuentas bancarias y efectivo quedan registrados con fecha 15 de Septiembre.'
                          : 'El saldo de apertura de este mes coincide exactamente con el saldo de cierre del mes anterior, garantizando continuidad matemática absoluta en tu tesorería sin desfases.'}
                      </span>
                    </div>
                  </div>
                )}

                {/* 2. INCOME CARD DETAIL */}
                {selectedKpiCard === 'income' && (
                  <div className="space-y-3">
                    {/* Top Totals Pill Header */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total Entradas</span>
                        <span className="text-base font-bold font-mono text-emerald-400">
                          +{formatMoney(totalMonthIncome, settings.currencySymbol)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-emerald-400 block font-semibold uppercase">Ya Realizados</span>
                        <span className="text-base font-bold font-mono text-emerald-300">
                          +{formatMoney(totalRealIn, settings.currencySymbol)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Planificados</span>
                        <span className="text-base font-bold font-mono text-slate-200">
                          +{formatMoney(totalPlannedIn, settings.currencySymbol)}
                        </span>
                      </div>
                    </div>

                    {/* Itemized List */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-1">
                        <span>Listado de Entradas ({monthInflows.length})</span>
                        <span>Monto / Estado</span>
                      </div>
                      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                        {monthInflows.length === 0 ? (
                          <div className="p-6 text-center text-slate-500 bg-slate-950 rounded-xl border border-slate-850">
                            No hay ingresos registrados ni planificados para este mes.
                          </div>
                        ) : (
                          monthInflows.map((m) => (
                            <div
                              key={m.id}
                              className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between gap-3 text-xs transition"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <button
                                  onClick={() => toggleTransactionStatus(m.id)}
                                  className={`p-1 rounded transition cursor-pointer shrink-0 ${
                                    m.status === 'realizado'
                                      ? 'text-emerald-400 bg-emerald-500/10'
                                      : 'text-slate-500 hover:text-emerald-400'
                                  }`}
                                  title={m.status === 'realizado' ? 'Marcar como planificado' : 'Marcar como realizado'}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <div className="min-w-0">
                                  <div className="font-bold text-white truncate flex items-center gap-1.5">
                                    <span>{m.concept}</span>
                                    {m.notes && (
                                      <span className="text-[10px] text-slate-400 font-normal truncate">
                                        ({m.notes})
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                    <span className="font-mono text-slate-300">
                                      {m.dayDate ? `${m.dayDate.slice(8)} ${MONTH_NAMES_SHORT_ES[Number(m.dayDate.slice(5, 7)) - 1]}` : ''}
                                    </span>
                                    <span>•</span>
                                    <span className="capitalize">{m.paymentMethodType || 'Banco'}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <div className="text-right">
                                  <span className="font-mono font-bold text-emerald-400 block text-xs">
                                    +{formatMoney(m.amount, settings.currencySymbol)}
                                  </span>
                                  <span
                                    className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                                      m.status === 'realizado'
                                        ? 'bg-emerald-500/15 text-emerald-300'
                                        : 'bg-amber-500/15 text-amber-300'
                                    }`}
                                  >
                                    {m.status === 'realizado' ? 'Realizado' : 'Planificado'}
                                  </span>
                                </div>
                                <button
                                  onClick={() => {
                                    setSelectedKpiCard(null);
                                    setEditingTransaction(m);
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-[11px] cursor-pointer"
                                  title="Editar movimiento"
                                >
                                  Editar
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. EXPENSES & OBLIGATIONS CARD DETAIL */}
                {selectedKpiCard === 'expense' && (
                  <div className="space-y-3">
                    {/* Top Totals Pill Header */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total Salidas</span>
                        <span className="text-base font-bold font-mono text-rose-400">
                          -{formatMoney(totalMonthExpense, settings.currencySymbol)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-rose-400 block font-semibold uppercase">Ya Realizados</span>
                        <span className="text-base font-bold font-mono text-rose-300">
                          -{formatMoney(totalRealOut, settings.currencySymbol)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Pendientes</span>
                        <span className="text-base font-bold font-mono text-slate-200">
                          -{formatMoney(totalPlannedOut, settings.currencySymbol)}
                        </span>
                      </div>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                      {[
                        { id: 'all', label: `Todos (${monthOutflows.length})` },
                        { id: 'tarjeta', label: 'Tarjetas / Pagos' },
                        { id: 'prestamo', label: 'Préstamos' },
                        { id: 'servicio', label: 'Servicios' },
                        { id: 'suscripcion', label: 'Suscripciones' },
                        { id: 'otros', label: 'Otros Gastos' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setExpenseDetailFilter(tab.id as any)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                            expenseDetailFilter === tab.id
                              ? 'bg-rose-600/30 border-rose-500 text-rose-200'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Itemized List */}
                    <div className="space-y-1.5">
                      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                        {filteredMonthOutflows.length === 0 ? (
                          <div className="p-6 text-center text-slate-500 bg-slate-950 rounded-xl border border-slate-850">
                            No hay gastos ni compromisos bajo esta categoría para este mes.
                          </div>
                        ) : (
                          filteredMonthOutflows.map((m) => (
                            <div
                              key={m.id}
                              className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between gap-3 text-xs transition"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <button
                                  onClick={() => toggleTransactionStatus(m.id)}
                                  className={`p-1 rounded transition cursor-pointer shrink-0 ${
                                    m.status === 'realizado'
                                      ? 'text-emerald-400 bg-emerald-500/10'
                                      : 'text-slate-500 hover:text-rose-400'
                                  }`}
                                  title={m.status === 'realizado' ? 'Marcar como pendiente' : 'Marcar como pagado/realizado'}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <div className="min-w-0">
                                  <div className="font-bold text-white truncate flex items-center gap-1.5">
                                    <span>{m.concept}</span>
                                    {m.notes && (
                                      <span className="text-[10px] text-slate-400 font-normal truncate">
                                        ({m.notes})
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                    <span className="font-mono text-slate-300">
                                      {m.dayDate ? `${m.dayDate.slice(8)} ${MONTH_NAMES_SHORT_ES[Number(m.dayDate.slice(5, 7)) - 1]}` : ''}
                                    </span>
                                    <span>•</span>
                                    <span className="capitalize">{m.paymentMethodType?.replace('_', ' ') || 'Gasto'}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <div className="text-right">
                                  <span className="font-mono font-bold text-rose-400 block text-xs">
                                    -{formatMoney(m.amount, settings.currencySymbol)}
                                  </span>
                                  <span
                                    className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                                      m.status === 'realizado'
                                        ? 'bg-emerald-500/15 text-emerald-300'
                                        : 'bg-amber-500/15 text-amber-300'
                                    }`}
                                  >
                                    {m.status === 'realizado' ? 'Realizado' : 'Planificado'}
                                  </span>
                                </div>
                                <button
                                  onClick={() => {
                                    setSelectedKpiCard(null);
                                    setEditingTransaction(m);
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-[11px] cursor-pointer"
                                  title="Editar movimiento"
                                >
                                  Editar
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. FINAL BALANCE WATERFALL DETAIL */}
                {selectedKpiCard === 'final' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">
                          Saldo Final Estimado al Cierre del Mes
                        </span>
                        <span
                          className={`text-2xl font-black font-mono ${
                            monthFinalBalance < 0 ? 'text-rose-400' : 'text-blue-300'
                          }`}
                        >
                          {formatMoney(monthFinalBalance, settings.currencySymbol)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Resultado Neto Mensual:</span>
                        <span
                          className={`font-mono font-bold text-sm ${
                            totalMonthIncome - totalMonthExpense >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {totalMonthIncome - totalMonthExpense >= 0 ? '+' : ''}
                          {formatMoney(totalMonthIncome - totalMonthExpense, settings.currencySymbol)}
                        </span>
                      </div>
                    </div>

                    {/* Arithmetic Waterfall Card */}
                    <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide block border-b border-slate-850 pb-1.5">
                        Cascada de Continuidad Matemática de Tesorería
                      </span>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-300">(+) Saldo Inicial de Apertura:</span>
                        <span className="font-mono font-bold text-white">
                          +{formatMoney(monthInitialBalance, settings.currencySymbol)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-emerald-400">
                        <span>(+) Total de Ingresos (Planificados + Realizados):</span>
                        <span className="font-mono font-bold">
                          +{formatMoney(totalMonthIncome, settings.currencySymbol)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-rose-400">
                        <span>(-) Total Salidas & Compromisos (Planificados + Realizados):</span>
                        <span className="font-mono font-bold">
                          -{formatMoney(totalMonthExpense, settings.currencySymbol)}
                        </span>
                      </div>
                      <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-xs font-bold">
                        <span className="text-white">(=) Saldo Final Proyectado de Cierre:</span>
                        <span
                          className={`font-mono text-sm ${
                            monthFinalBalance < 0 ? 'text-rose-400' : 'text-blue-300'
                          }`}
                        >
                          {formatMoney(monthFinalBalance, settings.currencySymbol)}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs leading-relaxed flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Garantía de Continuidad Activa:</strong> Este saldo final se transfiere de forma íntegra e instantánea como el <strong>Saldo Inicial</strong> del día 1 del siguiente mes, eliminando descuadres entre periodos.
                      </span>
                    </div>
                  </div>
                )}

                {/* 5. LOWEST LIQUIDITY DAY DETAIL */}
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
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center">
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block uppercase font-semibold">Apertura Día</span>
                          <span className="font-mono font-bold text-slate-200 text-xs">
                            {formatMoney(lowestLiquidityDay.initialBalance, settings.currencySymbol)}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-emerald-400 block uppercase font-semibold">Ingresos Día</span>
                          <span className="font-mono font-bold text-emerald-300 text-xs">
                            +{formatMoney((lowestLiquidityDay.plannedIncome || 0) + (lowestLiquidityDay.realIncome || 0), settings.currencySymbol)}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-rose-400 block uppercase font-semibold">Gastos Día</span>
                          <span className="font-mono font-bold text-rose-300 text-xs">
                            -{formatMoney((lowestLiquidityDay.plannedExpense || 0) + (lowestLiquidityDay.realExpense || 0), settings.currencySymbol)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Specific movements occurring on this lowest day */}
                    {((lowestLiquidityDay.movements || lowestLiquidityDay.events) || []).length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide block">
                          Movimientos Programados en este Día ({((lowestLiquidityDay.movements || lowestLiquidityDay.events) || []).length})
                        </span>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {((lowestLiquidityDay.movements || lowestLiquidityDay.events) || []).map((m: any) => (
                            <div
                              key={m.id}
                              className="p-2.5 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-between text-xs"
                            >
                              <div className="min-w-0 pr-2">
                                <span className="font-bold text-white block truncate">{m.concept}</span>
                                <span className="text-[10px] text-slate-400 capitalize">{m.paymentMethodType || 'Gasto'}</span>
                              </div>
                              <div className="text-right shrink-0">
                                <span
                                  className={`font-mono font-bold ${
                                    m.type === 'ingreso' ? 'text-emerald-400' : 'text-rose-400'
                                  }`}
                                >
                                  {m.type === 'ingreso' ? '+' : '-'}
                                  {formatMoney(m.amount, settings.currencySymbol)}
                                </span>
                                <span className="block text-[9px] text-slate-400 capitalize">{m.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 space-y-1">
                      <div className="font-semibold flex items-center gap-1.5 text-xs">
                        <Info className="w-4 h-4 text-amber-400" />
                        <span>Recomendación de Tesorería</span>
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
              </div>

              {/* Close Button */}
              <div className="pt-2 border-t border-slate-800">
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
