import React, { useRef, useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Category } from '../../types';
import {
  Settings,
  Download,
  Upload,
  FileSpreadsheet,
  Trash2,
  Edit2,
  RefreshCw,
  Sparkles,
  Server,
  ShieldCheck,
  HardDrive,
  Database,
  CheckCircle2,
  Tag,
  Plus,
  TrendingUp,
  TrendingDown,
  Calendar,
  Bell,
  Smartphone,
  Volume2,
  Check,
} from 'lucide-react';
import { dollarsToCents, centsToDollars, formatDateEs } from '../../utils/formatters';
import { NewCategoryModal } from '../common/NewCategoryModal';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
  isNotificationSupported,
  NotificationPreferences,
} from '../../utils/notificationService';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    categories,
    deleteCategory,
    exportBackupJSON,
    importBackupJSON,
    exportTransactionsCSV,
    loadDemoData,
    clearAllData,
    setIsRenderGuideOpen,
    todayStr,
    selectedYear,
    selectedMonth,
  } = useFinance();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isConfirmReset, setIsConfirmReset] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryModalType, setCategoryModalType] = useState<'gasto' | 'ingreso'>('gasto');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'gasto' | 'ingreso'>('all');

  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(getNotificationPreferences);
  const [notifPermission, setNotifPermission] = useState<string>('default');

  useEffect(() => {
    setNotifPermission(getNotificationPermission());
  }, []);

  const handleToggleNotifPermission = async () => {
    const granted = await requestNotificationPermission();
    setNotifPermission(granted ? 'granted' : 'denied');
    const updated = { ...notifPrefs, enabled: granted };
    setNotifPrefs(updated);
    saveNotificationPreferences(updated);
    if (granted) {
      showNotification('¡Notificaciones del navegador activadas con éxito!');
    }
  };

  const handleUpdateNotifPref = (key: keyof NotificationPreferences, val: boolean) => {
    const next = { ...notifPrefs, [key]: val };
    setNotifPrefs(next);
    saveNotificationPreferences(next);
    showNotification('Preferencia de notificación actualizada.');
  };

  const handleTriggerTest = async () => {
    const res = await sendTestNotification();
    setNotifPermission(getNotificationPermission());
    showNotification(res.message);
  };

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleExportJSON = async () => {
    await exportBackupJSON();
    showNotification('Copia de seguridad en formato JSON descargada correctamente.');
  };

  const handleExportCSV = async () => {
    await exportTransactionsCSV();
    showNotification('Reporte histórico exportado en formato CSV.');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const content = ev.target?.result as string;
      if (content) {
        const ok = await importBackupJSON(content);
        if (ok) {
          showNotification('¡Datos importados con éxito! La app se ha actualizado.');
        } else {
          alert('El archivo seleccionado no tiene un formato válido de respaldo de NEXA Finance.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleLoadDemo = async () => {
    if (window.confirm('¿Deseas cargar los datos de demostración? Esto incorporará cuentas, transacciones y obligaciones de prueba.')) {
      await loadDemoData();
      showNotification('Datos de demostración cargados satisfactoriamente.');
    }
  };

  const handleExecuteReset = async () => {
    await clearAllData();
    setIsConfirmReset(false);
    showNotification('¡Listo! Se han eliminado todos los datos de prueba. Ahora puedes comenzar a ingresar tus datos reales.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast */}
      {successMsg && (
        <div className="fixed top-20 right-6 z-50 rounded-xl bg-emerald-600 text-white px-4 py-3 shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">Configuración del Sistema & Datos</h2>
          </div>
          <p className="text-xs text-slate-400">
            Privacidad absoluta Local-First: tus datos viven en tu navegador mediante IndexedDB
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsConfirmReset(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Borrar Datos de Prueba</span>
          </button>

          <button
            onClick={() => setIsRenderGuideOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 text-xs font-bold transition cursor-pointer"
          >
            <Server className="w-4 h-4" />
            <span>Guía Render</span>
          </button>
        </div>
      </div>

      {/* Privacy & Architecture banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-900/40 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">
              Arquitectura Local-First de Confidencialidad Total
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              NEXA Finance fue diseñada para funcionar <strong>100% en tu dispositivo</strong> sin costos recurrentes, sin servidores centrales que almacenen tus datos y sin telemetría ni analítica invasiva. Tus estados de cuenta y transacciones no salen de tu máquina.
            </p>
          </div>
        </div>
      </div>

      {/* Regional / Display Settings */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <HardDrive className="w-4 h-4 text-blue-400" />
          <span>Preferencias Regionales y de Moneda</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Símbolo de Moneda</label>
            <input
              type="text"
              value={settings.currencySymbol}
              onChange={(e) => updateSettings({ currencySymbol: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Ej. $, €, £, Q, L</span>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Código de Moneda</label>
            <input
              type="text"
              value={settings.currencyCode}
              onChange={(e) => updateSettings({ currencyCode: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono uppercase"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Ej. USD, EUR, MXN, GTQ</span>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Inicio de Semana</label>
            <select
              value={settings.firstDayOfWeek}
              onChange={(e) => updateSettings({ firstDayOfWeek: Number(e.target.value) as 0 | 1 })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
            >
              <option value={1}>Lunes (Estándar financiero)</option>
              <option value={0}>Domingo</option>
            </select>
            <span className="text-[10px] text-slate-400 mt-1 block">Afecta el Calendario Mensual</span>
          </div>
        </div>
      </div>

      {/* Liquidity Calculation Starting Date Configuration */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Fecha de Inicio del Cálculo de Liquidez</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Control del punto de inicio para el cómputo de saldos y flujo de caja diario en cuentas
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span>Inicio: {formatDateEs(settings.liquidityStartDate || '2026-09-15', { withYear: true })}</span>
          </div>
        </div>

        <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 space-y-2.5">
          <p className="text-xs text-slate-300 leading-relaxed">
            El saldo configurado en tus cuentas bancarias y efectivo corresponde a tu dinero real disponible a partir de este día.
            Todos los cálculos de liquidez anteriores a esta fecha se computan estrictamente en <span className="font-mono text-emerald-400 font-bold">$0.00</span>.
          </p>
          <div className="flex items-start gap-2.5 text-[11px] text-slate-400 bg-slate-900/70 p-3 rounded-lg border border-slate-800">
            <span className="text-blue-400 font-bold text-xs shrink-0 mt-0.5">💡</span>
            <span>
              <strong>Estados de cuenta y aportes de meses previos:</strong> Los movimientos registrados con fecha anterior (por ejemplo, compras o aportes a tarjetas de crédito en agosto) se conservan para auditar y calcular con precisión los estados de cuenta de tus tarjetas, pero <strong>no afectan la liquidez bancaria</strong> ni reducen tus saldos antes del día de inicio.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end pt-1">
          <div>
            <label className="block text-slate-300 font-semibold text-xs mb-1.5">
              Día de Inicio de Liquidez (AAAA-MM-DD)
            </label>
            <input
              type="date"
              value={settings.liquidityStartDate || '2026-09-15'}
              onChange={(e) => {
                const newDate = e.target.value;
                if (newDate) {
                  updateSettings({ liquidityStartDate: newDate });
                  showNotification(`Inicio de cálculo de liquidez actualizado al ${newDate}`);
                }
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Cambia esta fecha en cualquier momento si deseas reiniciar el cómputo o proyectar a partir de otro día.
            </span>
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] text-slate-400 font-medium block">Accesos rápidos de configuración:</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  updateSettings({ liquidityStartDate: '2026-09-15' });
                  showNotification('Inicio de liquidez fijado al 15 de Septiembre 2026.');
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-white text-xs font-semibold transition cursor-pointer border border-slate-700"
              >
                15 de Septiembre 2026
              </button>
              <button
                type="button"
                onClick={() => {
                  updateSettings({ liquidityStartDate: todayStr });
                  showNotification(`Inicio de liquidez fijado a hoy (${todayStr}).`);
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition cursor-pointer border border-slate-700"
              >
                Hoy ({todayStr})
              </button>
              <button
                type="button"
                onClick={() => {
                  const firstDay = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
                  updateSettings({ liquidityStartDate: firstDay });
                  showNotification(`Inicio de liquidez fijado al 1ro de ${selectedYear}-${String(selectedMonth).padStart(2, '0')}.`);
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition cursor-pointer border border-slate-700"
              >
                1ro de este mes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Management Section */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-400" />
              <span>Gestor de Categorías</span>
            </h3>
            <p className="text-xs text-slate-400">
              Administra las categorías de ingresos y gastos utilizadas en presupuestos y movimientos
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  categoryFilter === 'all'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todas ({categories.length})
              </button>
              <button
                onClick={() => setCategoryFilter('gasto')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  categoryFilter === 'gasto'
                    ? 'bg-rose-500/20 text-rose-300 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Gastos ({categories.filter((c) => c.type === 'gasto').length})
              </button>
              <button
                onClick={() => setCategoryFilter('ingreso')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  categoryFilter === 'ingreso'
                    ? 'bg-emerald-500/20 text-emerald-300 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Ingresos ({categories.filter((c) => c.type === 'ingreso').length})
              </button>
            </div>

            <button
              onClick={() => {
                setEditingCategory(null);
                setCategoryModalType('gasto');
                setIsCategoryModalOpen(true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Categoría</span>
            </button>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {categories
            .filter((cat) => categoryFilter === 'all' || cat.type === categoryFilter)
            .map((cat) => (
              <div
                key={cat.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-2 hover:border-slate-700 transition"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div
                    className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5"
                    style={{ backgroundColor: cat.color || '#3b82f6' }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs text-white truncate">
                        {cat.name}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                          cat.type === 'ingreso'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {cat.type}
                      </span>
                    </div>
                    {cat.subcategories && cat.subcategories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {cat.subcategories.map((sub, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setEditingCategory(cat);
                      setIsCategoryModalOpen(true);
                    }}
                    className="text-slate-500 hover:text-blue-400 p-1 rounded-lg hover:bg-blue-500/10 transition cursor-pointer"
                    title="Editar categoría"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={async () => {
                      if (categories.length <= 1) {
                        alert('Debes mantener al menos una categoría en el sistema.');
                        return;
                      }
                      if (window.confirm(`¿Seguro que deseas eliminar la categoría "${cat.name}"?`)) {
                        await deleteCategory(cat.id);
                        showNotification(`Categoría "${cat.name}" eliminada.`);
                      }
                    }}
                    className="text-slate-600 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
                    title="Eliminar categoría"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Backup & Export / Import (Requirement 26) */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Database className="w-4 h-4 text-blue-400" />
          <span>Respaldo & Exportación de Datos</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Export JSON */}
          <button
            onClick={handleExportJSON}
            className="p-4 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-left space-y-2 transition group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition">
                <Download className="w-5 h-5" />
              </span>
              <span className="text-[10px] text-slate-400 font-mono">.JSON</span>
            </div>
            <div className="font-bold text-white text-xs">Descargar Respaldo Total</div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Genera una copia encriptable con todas tus cuentas, movimientos, tarjetas y presupuestos.
            </p>
          </button>

          {/* Import JSON */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-4 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-left space-y-2 transition group cursor-pointer"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition">
                <Upload className="w-5 h-5" />
              </span>
              <span className="text-[10px] text-slate-400 font-mono">.JSON</span>
            </div>
            <div className="font-bold text-white text-xs">Restaurar desde Respaldo</div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Carga un archivo de respaldo previo para sincronizar o migrar a un nuevo navegador o equipo.
            </p>
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="p-4 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-left space-y-2 transition group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-sky-500/10 text-sky-400 group-hover:scale-110 transition">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <span className="text-[10px] text-slate-400 font-mono">.CSV</span>
            </div>
            <div className="font-bold text-white text-xs">Exportar a Excel / CSV</div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Descarga la relación cronológica de movimientos para análisis en Excel, Google Sheets o PowerBI.
            </p>
          </button>
        </div>
      </div>

      {/* Local Web Notifications & Reminders (100% Free & Local-First) */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Avisos & Notificaciones en tu Dispositivo</span>
            </h3>
            <p className="text-xs text-slate-400">
              Notificaciones nativas en Celular o PC • Sin costos recurrentes ni servidores externos
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isNotificationSupported() ? (
              notifPermission === 'granted' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                  <Check className="w-3.5 h-3.5" />
                  <span>Activas en este navegador</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleToggleNotifPermission}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Activar Notificaciones
                </button>
              )
            ) : (
              <span className="text-xs text-slate-500">No soportado en este entorno</span>
            )}

            {isNotificationSupported() && (
              <button
                type="button"
                onClick={handleTriggerTest}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Probar Notificación</span>
              </button>
            )}
          </div>
        </div>

        <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 space-y-3">
          <p className="text-xs text-slate-300 leading-relaxed">
            Tu navegador emite alertas locales basadas en las fechas registradas en tus tarjetas y préstamos.
            No requiere correo, ni suscripciones pagas, ni enviar tus datos a la nube.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Pref 1: Corte de tarjetas */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="pref-card-cutoff"
                checked={notifPrefs.notifyCardCutoff}
                onChange={(e) => handleUpdateNotifPref('notifyCardCutoff', e.target.checked)}
                className="mt-0.5 rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="pref-card-cutoff" className="text-xs text-slate-300 cursor-pointer">
                <span className="font-bold text-white block">Corte de Tarjetas</span>
                Avisar 2 días antes del día de corte de tus tarjetas de crédito
              </label>
            </div>

            {/* Pref 2: Fecha límite de pago */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="pref-payment-due"
                checked={notifPrefs.notifyPaymentDue}
                onChange={(e) => handleUpdateNotifPref('notifyPaymentDue', e.target.checked)}
                className="mt-0.5 rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="pref-payment-due" className="text-xs text-slate-300 cursor-pointer">
                <span className="font-bold text-white block">Límite de Pagos</span>
                Avisar 3 días antes del vencimiento de cuotas o préstamos
              </label>
            </div>

            {/* Pref 3: Liquidez negativa */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="pref-neg-balance"
                checked={notifPrefs.notifyNegativeBalance}
                onChange={(e) => handleUpdateNotifPref('notifyNegativeBalance', e.target.checked)}
                className="mt-0.5 rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="pref-neg-balance" className="text-xs text-slate-300 cursor-pointer">
                <span className="font-bold text-white block">Alerta de Sobregiro</span>
                Aviso inmediato si una proyección proyecta saldo bancario negativo
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Data & Danger Zone */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Herramientas de Evaluación & Mantenimiento</span>
        </h3>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div>
            <div className="font-bold text-white text-xs">Cargar Datos de Demostración</div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Siembra cuentas, nóminas, tarjetas BAC, compras a cuotas, suscripciones de Spotify/Netflix y servicios básicos para evaluar el flujo diario proyectado.
            </p>
          </div>
          <button
            onClick={handleLoadDemo}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition cursor-pointer shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Cargar Datos Demo</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-rose-950/20 border border-rose-900/30">
          <div>
            <div className="font-bold text-rose-300 text-xs">Restablecer la Base de Datos</div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Borra completamente todos los registros locales de IndexedDB y reinicia la aplicación desde cero.
            </p>
          </div>
          <button
            onClick={() => setIsConfirmReset(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition cursor-pointer shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span>Borrar Todo</span>
          </button>
        </div>
      </div>

      {/* Modal Confirm Reset */}
      {isConfirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-rose-900/50 shadow-2xl p-6 text-slate-100 space-y-4">
            <h3 className="text-base font-bold text-rose-400">
              ¿Confirmas que deseas borrar todos los datos?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Esta acción eliminará de forma permanente todas tus cuentas, movimientos, tarjetas de crédito, préstamos y presupuestos de este navegador. Asegúrate de haber descargado un respaldo JSON si deseas conservar tu información.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsConfirmReset(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteReset}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white"
              >
                Sí, borrar todos los datos
              </button>
            </div>
          </div>
        </div>
      )}

      <NewCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        categoryToEdit={editingCategory}
        defaultType={categoryModalType}
        onCategoryCreated={(newCat) => {
          showNotification(`Categoría "${newCat.name}" creada con éxito.`);
        }}
        onCategorySaved={(savedCat) => {
          showNotification(`Categoría "${savedCat.name}" actualizada con éxito.`);
        }}
      />
    </div>
  );
};
