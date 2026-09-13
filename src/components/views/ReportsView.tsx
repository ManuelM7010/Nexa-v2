import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatMoney, MONTH_NAMES_ES } from '../../utils/formatters';
import {
  BarChart3,
  Lock,
  Unlock,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Calendar,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const {
    selectedYear,
    selectedMonth,
    executiveSummary,
    monthlyCloses,
    closeCurrentMonth,
    reopenMonth,
    settings,
  } = useFinance();

  const [closeNotes, setCloseNotes] = useState('');
  const [isConfirmingClose, setIsConfirmingClose] = useState(false);

  const monthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const currentMonthClose = monthlyCloses.find((c) => c.id === monthKey && c.isClosed);

  const handleExecuteClose = async () => {
    await closeCurrentMonth(closeNotes.trim() || undefined);
    setIsConfirmingClose(false);
    setCloseNotes('');
  };

  const handleReopen = async (year: number, month: number) => {
    await reopenMonth(year, month);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-white">
              Cierre Contable Mensual & Continuidad
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Consolida los resultados del período y traslada saldos con trazabilidad estricta
          </p>
        </div>

        <div>
          {currentMonthClose ? (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Mes Cerrado</span>
              </span>
              <button
                onClick={() => handleReopen(selectedYear, selectedMonth)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Reabrir mes</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsConfirmingClose(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white shadow-md shadow-blue-600/30 transition cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Cerrar {MONTH_NAMES_ES[selectedMonth - 1]} {selectedYear}</span>
            </button>
          )}
        </div>
      </div>

      {/* Current Month Close Summary Card (Requirement 20) */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            Balance de Cierre — {MONTH_NAMES_ES[selectedMonth - 1]} {selectedYear}
          </h3>
          <span className="text-xs text-slate-400">
            {currentMonthClose ? 'Resultados auditados guardados' : 'Vista preliminar en vivo'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Ingresos Plan vs Real */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
            <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] block">
              Ingresos del Período
            </span>
            <div className="flex justify-between">
              <span className="text-slate-400">Planificado:</span>
              <span className="font-mono text-slate-200">
                {formatMoney(executiveSummary.totalPlannedIncome, settings.currencySymbol)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Realizado:</span>
              <span className="font-mono font-bold text-emerald-400">
                {formatMoney(executiveSummary.totalRealizedIncome, settings.currencySymbol)}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-800 text-[11px] flex justify-between font-semibold">
              <span className="text-slate-400">Diferencia:</span>
              <span
                className={
                  executiveSummary.totalRealizedIncome >= executiveSummary.totalPlannedIncome
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }
              >
                {formatMoney(
                  executiveSummary.totalRealizedIncome - executiveSummary.totalPlannedIncome,
                  settings.currencySymbol
                )}
              </span>
            </div>
          </div>

          {/* Gastos Plan vs Real */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
            <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] block">
              Gastos del Período
            </span>
            <div className="flex justify-between">
              <span className="text-slate-400">Planificado:</span>
              <span className="font-mono text-slate-200">
                {formatMoney(executiveSummary.totalPlannedExpense, settings.currencySymbol)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Realizado:</span>
              <span className="font-mono font-bold text-rose-400">
                {formatMoney(executiveSummary.totalRealizedExpense, settings.currencySymbol)}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-800 text-[11px] flex justify-between font-semibold">
              <span className="text-slate-400">Ahorro en gasto:</span>
              <span
                className={
                  executiveSummary.totalPlannedExpense >= executiveSummary.totalRealizedExpense
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }
              >
                {formatMoney(
                  executiveSummary.totalPlannedExpense - executiveSummary.totalRealizedExpense,
                  settings.currencySymbol
                )}
              </span>
            </div>
          </div>

          {/* Ahorro Neto & Saldo */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
            <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] block">
              Resultado Neto & Liquidez Final
            </span>
            <div className="flex justify-between">
              <span className="text-slate-400">Ahorro Neto Real:</span>
              <span className="font-mono font-bold text-sky-400">
                {formatMoney(executiveSummary.netRealSavings, settings.currencySymbol)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Deuda Total Final:</span>
              <span className="font-mono text-rose-300">
                {formatMoney(executiveSummary.totalDebt, settings.currencySymbol)}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-800 text-[11px] flex justify-between font-bold">
              <span className="text-slate-300">Saldo Disponible Final:</span>
              <span className="text-white font-mono">
                {formatMoney(executiveSummary.currentRealCashBalance, settings.currencySymbol)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Histórico de Cierres Anteriores */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white">Historial de Meses Cerrados</h3>
        </div>

        {monthlyCloses.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Aún no has cerrado ningún mes. Al cerrar un período, quedará registrado aquí de forma inmutable.
          </div>
        ) : (
          <div className="divide-y divide-slate-800 text-xs">
            {monthlyCloses.map((c) => (
              <div key={c.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>
                      {MONTH_NAMES_ES[c.month - 1]} {c.year}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Cerrado
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Ingresos: {formatMoney(c.realIncome, settings.currencySymbol)} • Gastos:{' '}
                    {formatMoney(c.realExpense, settings.currencySymbol)} • Ahorro:{' '}
                    {formatMoney(c.realSavings, settings.currencySymbol)}
                  </div>
                  {c.notes && (
                    <div className="text-[11px] text-slate-500 italic mt-0.5">{c.notes}</div>
                  )}
                </div>

                <button
                  onClick={() => handleReopen(c.year, c.month)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Reabrir
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Confirm Close Month */}
      {isConfirmingClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 space-y-4">
            <h3 className="text-base font-bold text-white">
              Cerrar {MONTH_NAMES_ES[selectedMonth - 1]} {selectedYear}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Al cerrar este mes se guardará una instantánea de ingresos, gastos, ahorro neto y deudas.
              Los saldos de bancos y efectivo continuarán disponibles para el próximo mes. Podrás reabrirlo en cualquier momento si necesitas corregir datos.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Comentarios / Conclusiones del mes (Opcional)
              </label>
              <textarea
                rows={2}
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                placeholder="Ej. Cumplí la meta de ahorro, gasto médico imprevisto de $120..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsConfirmingClose(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteClose}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white"
              >
                Confirmar Cierre de Mes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
