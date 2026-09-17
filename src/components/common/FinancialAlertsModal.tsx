import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const FinancialAlertsModal: React.FC = () => {
  const {
    isAlertsOpen,
    setIsAlertsOpen,
    financialAlerts,
    setActiveTab,
  } = useFinance();

  const [filter, setFilter] = useState<'todas' | 'danger' | 'warning' | 'success'>('todas');

  if (!isAlertsOpen) return null;

  const filteredAlerts = financialAlerts.filter((a) => {
    if (filter === 'todas') return true;
    return a.type === filter || a.severity === filter;
  });

  const handleAction = (targetTab?: string) => {
    if (targetTab) {
      setActiveTab(targetTab);
    }
    setIsAlertsOpen(false);
  };

  const getAlertStyles = (type: string) => {
    switch (type) {
      case 'danger':
        return {
          badgeBg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
          icon: AlertCircle,
          iconColor: 'text-rose-400',
          cardBorder: 'border-rose-900/40 bg-rose-950/10',
          btnText: 'Revisar Sobregiro',
        };
      case 'warning':
        return {
          badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
          icon: AlertTriangle,
          iconColor: 'text-amber-400',
          cardBorder: 'border-amber-900/40 bg-amber-950/10',
          btnText: 'Atender Alerta',
        };
      case 'success':
        return {
          badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
          icon: CheckCircle2,
          iconColor: 'text-emerald-400',
          cardBorder: 'border-emerald-900/40 bg-emerald-950/10',
          btnText: 'Ver Progreso',
        };
      default:
        return {
          badgeBg: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
          icon: Info,
          iconColor: 'text-blue-400',
          cardBorder: 'border-blue-900/40 bg-blue-950/10',
          btnText: 'Ver Detalle',
        };
    }
  };

  const dangerCount = financialAlerts.filter((a) => a.type === 'danger').length;
  const warningCount = financialAlerts.filter((a) => a.type === 'warning').length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsAlertsOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Centro de Alertas Financieras
                  {financialAlerts.length > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {financialAlerts.length}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400">
                  Detección en tiempo real de liquidez, límites y compromisos
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAlertsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Pills */}
          <div className="px-4 sm:px-5 py-2.5 border-b border-slate-800/80 bg-slate-900/60 flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              onClick={() => setFilter('todas')}
              className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition whitespace-nowrap ${
                filter === 'todas'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
              }`}
            >
              Todas ({financialAlerts.length})
            </button>
            <button
              onClick={() => setFilter('danger')}
              className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition whitespace-nowrap ${
                filter === 'danger'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
              }`}
            >
              Críticas ({dangerCount})
            </button>
            <button
              onClick={() => setFilter('warning')}
              className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition whitespace-nowrap ${
                filter === 'warning'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
              }`}
            >
              Advertencias ({warningCount})
            </button>
          </div>

          {/* Alerts List */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
            {financialAlerts.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400 mb-3" />
                <p className="text-base font-bold text-white">¡Todo en orden!</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  No tienes advertencias activas ni saldos proyectados en riesgo para este período.
                </p>
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <p className="text-sm">No hay alertas en esta categoría.</p>
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const styles = getAlertStyles(alert.type);
                const Icon = styles.icon;
                return (
                  <div
                    key={alert.id}
                    className={`p-3.5 rounded-xl border transition ${styles.cardBorder} hover:brightness-105`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border ${styles.badgeBg}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-bold text-white truncate">
                            {alert.title}
                          </h4>
                          {alert.date && (
                            <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                              {alert.date}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {alert.message}
                        </p>

                        {alert.targetTab && (
                          <div className="mt-3 flex justify-end">
                            <button
                              onClick={() => handleAction(alert.targetTab)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer active:scale-95 transition"
                            >
                              <span>{styles.btnText}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Las alertas se calculan con base en tu flujo diario y presupuestos</span>
            <button
              onClick={() => setIsAlertsOpen(false)}
              className="text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
