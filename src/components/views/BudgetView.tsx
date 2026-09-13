import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatMoney, dollarsToCents, centsToDollars } from '../../utils/formatters';
import {
  PieChart,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit2,
  TrendingUp,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export const BudgetView: React.FC = () => {
  const {
    budgetAnalysis,
    categories,
    budgets,
    saveBudget,
    selectedYear,
    selectedMonth,
    settings,
  } = useFinance();

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [budgetInput, setBudgetInput] = useState('');

  const expenseCategories = categories.filter((c) => c.type === 'gasto');

  const totalBudgeted = budgetAnalysis.reduce((acc, item) => acc + item.budgetedAmount, 0);
  const totalRealSpent = budgetAnalysis.reduce((acc, item) => acc + item.realSpent, 0);
  const totalProjectedSpent = budgetAnalysis.reduce((acc, item) => acc + item.totalProjected, 0);

  const overallExecutionPct = totalBudgeted > 0 ? Math.round((totalRealSpent / totalBudgeted) * 100) : 0;

  const handleOpenEdit = (categoryId: string, currentBudget: number) => {
    setEditingCategoryId(categoryId);
    setBudgetInput(currentBudget > 0 ? centsToDollars(currentBudget).toFixed(2) : '');
  };

  const handleSaveBudget = async (categoryId: string) => {
    const existing = budgets.find(
      (b) => b.categoryId === categoryId && b.year === selectedYear && b.month === selectedMonth
    );
    const amountCents = dollarsToCents(budgetInput || 0);

    const bgtItem = {
      id: existing ? existing.id : `bgt_${categoryId}_${selectedYear}_${selectedMonth}`,
      year: selectedYear,
      month: selectedMonth,
      categoryId,
      budgetedAmount: amountCents,
    };

    await saveBudget(bgtItem);
    setEditingCategoryId(null);
  };

  // Chart data for Budget vs Real
  const chartData = budgetAnalysis
    .filter((b) => b.budgetedAmount > 0 || (b.realSpent || b.realAmount || 0) > 0)
    .map((b) => {
      const catName = b.category?.name || b.categoryName || 'General';
      return {
        name: catName.split(' ')[0], // Short name
        fullName: catName,
        Presupuestado: centsToDollars(b.budgetedAmount),
        Real: centsToDollars(b.realSpent || b.realAmount || 0),
        Proyectado: centsToDollars(b.totalProjected || b.projectedTotalAmount || 0),
      };
    });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
          <div className="text-xs font-semibold uppercase text-slate-400 mb-1">
            Presupuesto Asignado Total
          </div>
          <div className="text-2xl font-black text-white">
            {formatMoney(totalBudgeted, settings.currencySymbol)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Límite objetivo para {expenseCategories.length} categorías de gasto
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
          <div className="text-xs font-semibold uppercase text-slate-400 mb-1">
            Gasto Real Acumulado
          </div>
          <div className="text-2xl font-black text-blue-400">
            {formatMoney(totalRealSpent, settings.currencySymbol)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {overallExecutionPct}% del presupuesto total consumido a la fecha
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
          <div className="text-xs font-semibold uppercase text-slate-400 mb-1">
            Gasto Total Proyectado
          </div>
          <div
            className={`text-2xl font-black ${
              totalProjectedSpent > totalBudgeted ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {formatMoney(totalProjectedSpent, settings.currencySymbol)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {totalProjectedSpent > totalBudgeted
              ? `Sobrepaso proyectado de ${formatMoney(totalProjectedSpent - totalBudgeted, settings.currencySymbol)}`
              : `Margen proyectado restante: ${formatMoney(totalBudgeted - totalProjectedSpent, settings.currencySymbol)}`}
          </p>
        </div>
      </div>

      {/* Comparative Bar Chart */}
      {chartData.length > 0 && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Comparativa Visual: Presupuesto vs Gasto Real vs Proyectado
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Monitorea el cumplimiento por categoría en dólares
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 shadow-2xl text-xs space-y-1">
                          <div className="font-bold text-white border-b border-slate-800 pb-1">
                            {data.fullName}
                          </div>
                          <div className="text-slate-300">Presupuestado: ${data.Presupuestado.toFixed(2)}</div>
                          <div className="text-blue-400 font-bold">Gasto Real: ${data.Real.toFixed(2)}</div>
                          <div className="text-amber-400">Total Proyectado: ${data.Proyectado.toFixed(2)}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar dataKey="Presupuestado" fill="#475569" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Real" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Proyectado" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detailed Categories Table (Requirement 12) */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-400" />
              Presupuesto por Categoría & Alertas de Cumplimiento
            </h3>
            <p className="text-xs text-slate-400">
              Control preventivo al 80% y alerta crítica al superar el 100%
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-3 text-right">Presupuesto</th>
                <th className="py-3 px-3 text-right">Gasto Real</th>
                <th className="py-3 px-3 text-right">Pendiente Plan.</th>
                <th className="py-3 px-3 text-right">Total Proyectado</th>
                <th className="py-3 px-3 text-right">Saldo Disponible</th>
                <th className="py-3 px-4">Progreso / Alerta</th>
                <th className="py-3 px-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {budgetAnalysis.map((item) => {
                const catId = item.category?.id || item.categoryId;
                const catName = item.category?.name || item.categoryName || 'General';
                const isEditing = editingCategoryId === catId;

                return (
                  <tr key={catId} className="hover:bg-slate-850/60 transition">
                    {/* Category Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{catName}</div>
                    </td>

                    {/* Presupuesto */}
                    <td className="py-3.5 px-3 text-right font-mono font-semibold text-white">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          autoFocus
                          value={budgetInput}
                          onChange={(e) => setBudgetInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveBudget(catId);
                            if (e.key === 'Escape') setEditingCategoryId(null);
                          }}
                          className="w-24 bg-slate-950 border border-blue-500 rounded px-2 py-1 text-right text-white focus:outline-none"
                        />
                      ) : (
                        formatMoney(item.budgetedAmount, settings.currencySymbol)
                      )}
                    </td>

                    {/* Gasto Real */}
                    <td className="py-3.5 px-3 text-right font-mono text-blue-400 font-bold">
                      {formatMoney(item.realSpent || item.realAmount || 0, settings.currencySymbol)}
                    </td>

                    {/* Pendiente Planificado */}
                    <td className="py-3.5 px-3 text-right font-mono text-slate-400">
                      {formatMoney(item.plannedPendingSpent || item.plannedPendingAmount || 0, settings.currencySymbol)}
                    </td>

                    {/* Total Proyectado */}
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-200">
                      {formatMoney(item.totalProjected || item.projectedTotalAmount || 0, settings.currencySymbol)}
                    </td>

                    {/* Saldo Disponible */}
                    <td className="py-3.5 px-3 text-right font-mono font-bold">
                      <span
                        className={
                          (item.availableBalance ?? item.availableAmount ?? 0) < 0
                            ? 'text-rose-400'
                            : (item.availableBalance ?? item.availableAmount ?? 0) < 2000
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }
                      >
                        {formatMoney(item.availableBalance ?? item.availableAmount ?? 0, settings.currencySymbol)}
                      </span>
                    </td>

                    {/* Progress Bar & Alert */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1.5 min-w-[140px]">
                        <div className="flex items-center justify-between text-[10px]">
                          <span
                            className={`font-bold ${
                              (item.status === 'exceeded' || item.status === 'sobregiro')
                                ? 'text-rose-400'
                                : (item.status === 'warning' || item.status === 'alerta')
                                ? 'text-amber-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {item.executionPercentage ?? item.percentUsed ?? 0}%
                          </span>

                          {(item.status === 'exceeded' || item.status === 'sobregiro') && (
                            <span className="flex items-center gap-1 text-rose-400 font-bold">
                              <AlertCircle className="w-3 h-3" /> Sobrepasado
                            </span>
                          )}
                          {(item.status === 'warning' || item.status === 'alerta') && (
                            <span className="flex items-center gap-1 text-amber-400 font-semibold">
                              <AlertTriangle className="w-3 h-3" /> Alerta 80%
                            </span>
                          )}
                          {(item.status === 'normal' || item.status === 'en_presupuesto') && item.budgetedAmount > 0 && (
                            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                              <CheckCircle2 className="w-3 h-3" /> Normal
                            </span>
                          )}
                        </div>

                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              (item.status === 'exceeded' || item.status === 'sobregiro')
                                ? 'bg-rose-500'
                                : (item.status === 'warning' || item.status === 'alerta')
                                ? 'bg-amber-500'
                                : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(100, item.executionPercentage ?? item.percentUsed ?? 0)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleSaveBudget(catId)}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold"
                          >
                            OK
                          </button>
                          <button
                            onClick={() => setEditingCategoryId(null)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px]"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenEdit(catId, item.budgetedAmount)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title="Asignar o modificar presupuesto"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
