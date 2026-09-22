import React, { useState, useEffect } from 'react';
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
  Volume2,
  Smartphone,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
  isNotificationSupported,
} from '../../utils/notificationService';

export const FinancialAlertsModal: React.FC = () => {
  const {
    isAlertsOpen,
    setIsAlertsOpen,
    financialAlerts,
    setActiveTab,
  } = useFinance();

  const [filter, setFilter] = useState<'todas' | 'danger' | 'warning' | 'success'>('todas');
  const [notifPermission, setNotifPermission] = useState<string>('default');
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    if (isAlertsOpen) {
      setNotifPermission(getNotificationPermission());
    }
  }, [isAlertsOpen]);

  if (!isAlertsOpen) return null;

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotifPermission(granted ? 'granted' : 'denied');
    if (granted) {
      setTestResult('¡Notificaciones activadas en este dispositivo!');
      setTimeout(() => setTestResult(null), 3000);
    }
  };

  const handleTestNotification = async () => {
    const res = await sendTestNotification();
    setTestResult(res.message);
    setNotifPermission(getNotificationPermission());
    setTimeout(() => setTestResult(null), 4000);
  };

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
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsAlertsOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
        />

        {/* Modal Window / Mobile Bottom Sheet */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-xl bg-slate-900 border-t sm:border border-slate-700/80 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh] sm:max-h-[85vh]"
        >
          {/* Mobile Drag Indicator Handle */}
          <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto my-2.5 sm:hidden cursor-grab" />

          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Centro de Alertas & Notificaciones
                  {financialAlerts.length > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {financialAlerts.length}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400">
                  Detección en tiempo real de liquidez, límites y recordatorios
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

          {/* Browser / Device Local Notification Bar */}
          {isNotificationSupported() && (
            <div className="px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <span className="text-slate-300">
                  Avisos en este dispositivo:
                </span>
                {notifPermission === 'granted' ? (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 text-[10px]">
                    <Check className="w-3 h-3" />
                    Activas ($0 local)
                  </span>
                ) : (
                  <span className="text-slate-400 text-[11px]">
                    {notifPermission === 'denied' ? 'Bloqueadas en navegador' : 'Sin activar'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {notifPermission !== 'granted' && (
                  <button
                    onClick={handleEnableNotifications}
                    className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] transition cursor-pointer"
                  >
                    Activar en mi Celular / PC
                  </button>
                )}
                <button
                  onClick={handleTestNotification}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
                >
                  <Volume2 className="w-3 h-3 text-amber-400" />
                  <span>Probar aviso</span>
                </button>
              </div>
            </div>
          )}

          {testResult && (
            <div className="px-4 py-1.5 bg-blue-900/40 border-b border-blue-500/30 text-blue-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <span>{testResult}</span>
            </div>
          )}

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
            <span>Alertas y avisos 100% locales en tu navegador • Sin suscripciones</span>
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

