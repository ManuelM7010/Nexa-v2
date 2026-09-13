import React, { useRef, useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Settings,
  Download,
  Upload,
  FileSpreadsheet,
  Trash2,
  RefreshCw,
  Sparkles,
  Server,
  ShieldCheck,
  HardDrive,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { dollarsToCents, centsToDollars } from '../../utils/formatters';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    exportBackupJSON,
    importBackupJSON,
    exportTransactionsCSV,
    loadDemoData,
    clearAllData,
    setIsRenderGuideOpen,
  } = useFinance();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isConfirmReset, setIsConfirmReset] = useState(false);

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
    </div>
  );
};
