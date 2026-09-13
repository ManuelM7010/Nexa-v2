import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatMoney, formatDateEs } from '../../utils/formatters';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';

export const CalendarView: React.FC = () => {
  const {
    dailyCashFlow,
    selectedYear,
    selectedMonth,
    setSelectedMonth,
    setSelectedYear,
    setSelectedPeriod,
    settings,
    setIsNewTxOpen,
    toggleTransactionStatus,
  } = useFinance();

  const [selectedDayDetail, setSelectedDayDetail] = useState<string | null>(null);

  // Determine weekday offset for 1st day of month
  // Note: month 1-12 in JavaScript Date is 0-11
  const firstDayObj = new Date(selectedYear, selectedMonth - 1, 1);
  let startingWeekday = firstDayObj.getDay(); // 0 is Sunday, 1 is Monday
  // If firstDayOfWeek is 1 (Monday):
  if (settings.firstDayOfWeek === 1) {
    startingWeekday = startingWeekday === 0 ? 6 : startingWeekday - 1;
  }

  const weekHeaders = settings.firstDayOfWeek === 1
    ? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    : ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const emptyPrefixSlots = Array.from({ length: startingWeekday });

  const activeDayObj = dailyCashFlow.find((d) => d.date === selectedDayDetail);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">Calendario Financiero Mensual</h2>
          </div>
          <p className="text-xs text-slate-400">
            Vista integral de vencimientos, cobros y liquidez disponible día por día
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Saludable
            </span>
            <span className="flex items-center gap-1 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Saldo bajo
            </span>
            <span className="flex items-center gap-1 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-rose-400" /> Negativo
            </span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        {/* Day of week headers */}
        <div className="grid grid-cols-7 bg-slate-950/90 text-center py-2.5 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
          {weekHeaders.map((h, i) => (
            <div key={i}>{h}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-800/60 bg-slate-950/20">
          {/* Empty prefix slots */}
          {emptyPrefixSlots.map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[90px] bg-slate-950/40 p-1.5 opacity-30" />
          ))}

          {/* Actual days */}
          {dailyCashFlow.map((day) => {
            const hasMovements = day.movements.length > 0;
            const isSelected = selectedDayDetail === day.date;

            return (
              <div
                key={day.date}
                onClick={() => setSelectedDayDetail(day.date)}
                className={`min-h-[95px] p-2 flex flex-col justify-between cursor-pointer transition relative group ${
                  day.isToday
                    ? 'bg-blue-950/25 ring-1 ring-blue-500'
                    : isSelected
                    ? 'bg-slate-800/80 ring-1 ring-slate-500'
                    : 'hover:bg-slate-850/50'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold rounded px-1 ${
                      day.isToday
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 group-hover:text-white'
                    }`}
                  >
                    {day.date.slice(8)}
                  </span>

                  {/* Status dot */}
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      day.status === 'positive'
                        ? 'bg-emerald-400'
                        : day.status === 'low'
                        ? 'bg-amber-400'
                        : 'bg-rose-400 animate-pulse'
                    }`}
                  />
                </div>

                {/* Day Balance */}
                <div className="my-1">
                  <span
                    className={`text-[11px] font-mono font-bold block truncate ${
                      day.finalBalance < 0
                        ? 'text-rose-400'
                        : day.finalBalance < 15000
                        ? 'text-amber-400'
                        : 'text-slate-200'
                    }`}
                  >
                    {formatMoney(day.finalBalance, settings.currencySymbol)}
                  </span>
                </div>

                {/* Event Chips */}
                <div className="space-y-0.5">
                  {day.movements.slice(0, 2).map((m) => (
                    <div
                      key={m.id}
                      className={`text-[9px] truncate px-1 py-0.5 rounded font-medium ${
                        m.type === 'ingreso'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : m.type === 'pago_tarjeta'
                          ? 'bg-sky-500/20 text-sky-300'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {m.concept}
                    </div>
                  ))}
                  {day.movements.length > 2 && (
                    <span className="text-[9px] text-blue-400 font-semibold block">
                      +{day.movements.length - 2} más
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details Drawer / Modal */}
      {activeDayObj && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{formatDateEs(activeDayObj.date, { withDayName: true, withYear: true })}</span>
                {activeDayObj.isToday && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">
                    HOY
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Saldo proyectado al finalizar este día:{' '}
                <strong
                  className={
                    activeDayObj.finalBalance < 0 ? 'text-rose-400' : 'text-emerald-400'
                  }
                >
                  {formatMoney(activeDayObj.finalBalance, settings.currencySymbol)}
                </strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsNewTxOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Movimiento</span>
              </button>
              <button
                onClick={() => setSelectedDayDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List of movements on this day */}
          <div className="space-y-2">
            {activeDayObj.movements.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No hay movimientos registrados ni programados para este día.
              </p>
            ) : (
              activeDayObj.movements.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => toggleTransactionStatus(m.id)}
                      className="p-1 rounded text-slate-500 hover:text-emerald-400"
                    >
                      <CheckCircle2
                        className={`w-4 h-4 ${
                          m.status === 'realizado' ? 'text-emerald-400' : 'text-slate-600'
                        }`}
                      />
                    </button>
                    <div>
                      <div className="font-bold text-white">{m.concept}</div>
                      <div className="text-[11px] text-slate-400">
                        {m.paymentMethodType.replace('_', ' ')} • {m.status}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-mono font-bold ${
                        m.type === 'ingreso' ? 'text-emerald-400' : 'text-slate-100'
                      }`}
                    >
                      {m.type === 'ingreso' ? '+' : '-'}
                      {formatMoney(m.amount, settings.currencySymbol)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
