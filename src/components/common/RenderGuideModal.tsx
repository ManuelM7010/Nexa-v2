import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  X,
  Server,
  GitBranch,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  HardDrive,
  Zap,
} from 'lucide-react';

export const RenderGuideModal: React.FC = () => {
  const { isRenderGuideOpen, setIsRenderGuideOpen } = useFinance();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isRenderGuideOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const renderParameters = [
    { label: 'Tipo de Servicio en Render', value: 'Static Site', key: 'type' },
    { label: 'Name (Nombre del Proyecto)', value: 'nexa-finance', key: 'name' },
    { label: 'Branch (Rama)', value: 'main', key: 'branch' },
    { label: 'Build Command', value: 'npm run build', key: 'build' },
    { label: 'Publish Directory', value: 'dist', key: 'publish' },
    { label: 'Plan Tier', value: 'Free ($0/mes para siempre)', key: 'tier' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Despliegue Gratuito en Render.com
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                  100% Free
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Paso a paso exacto para alojar NEXA Finance como PWA estática sin costos recurrentes
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsRenderGuideOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5 mt-4 text-xs">
          {/* Parámetros Críticos (Tabla directa para copiar) */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Parámetros para Render.com
            </h3>
            <div className="rounded-xl bg-slate-950 border border-slate-800 divide-y divide-slate-800/60 overflow-hidden">
              {renderParameters.map((param) => (
                <div
                  key={param.key}
                  className="flex items-center justify-between px-3.5 py-2.5 hover:bg-slate-900/60 transition"
                >
                  <span className="text-slate-400 font-medium">{param.label}:</span>
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-sky-300 font-mono font-semibold">
                      {param.value}
                    </code>
                    {param.key !== 'type' && param.key !== 'tier' && (
                      <button
                        onClick={() => copyToClipboard(param.value, param.key)}
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                        title="Copiar al portapapeles"
                      >
                        {copiedKey === param.key ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Guía Paso a Paso */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-blue-400" /> Paso a Paso desde GitHub hasta Producción
            </h3>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="font-bold text-white block mb-1">
                  1. Crear Repositorio en GitHub
                </span>
                <p className="text-slate-400 mb-2 leading-relaxed">
                  Crea un repositorio en GitHub (puede ser público o privado, ej. <code>nexa-finance</code>) y sube el código fuente:
                </p>
                <div className="bg-slate-900 p-2.5 rounded-lg font-mono text-[11px] text-slate-300 space-y-1">
                  <div>git init</div>
                  <div>git add .</div>
                  <div>git commit -m "feat: NEXA Finance complete PWA"</div>
                  <div>git branch -M main</div>
                  <div>git remote add origin https://github.com/TU_USUARIO/nexa-finance.git</div>
                  <div>git push -u origin main</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="font-bold text-white block mb-1">
                  2. Conectar en Render.com
                </span>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed">
                  <li>Inicia sesión o crea cuenta gratuita en <strong>dashboard.render.com</strong>.</li>
                  <li>Haz clic en el botón azul <strong>«New +»</strong> en la esquina superior derecha.</li>
                  <li>Selecciona la opción <strong>«Static Site»</strong>.</li>
                  <li>Conecta tu cuenta de GitHub y selecciona el repositorio <strong>nexa-finance</strong>.</li>
                </ol>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="font-bold text-white block mb-1">
                  3. Configuración de Construcción en Render
                </span>
                <p className="text-slate-400 mb-2">
                  Verifica que los campos coincidan exactamente con estos valores:
                </p>
                <ul className="space-y-1 text-slate-300">
                  <li>• <strong>Branch:</strong> <code className="text-sky-300">main</code></li>
                  <li>• <strong>Build Command:</strong> <code className="text-sky-300">npm run build</code></li>
                  <li>• <strong>Publish Directory:</strong> <code className="text-sky-300">dist</code></li>
                  <li>• <strong>Auto-Deploy:</strong> Yes (se actualiza automáticamente en cada git push).</li>
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="font-bold text-white block mb-1">
                  4. Despliegue y Certificado SSL
                </span>
                <p className="text-slate-400 leading-relaxed">
                  Haz clic en <strong>«Create Static Site»</strong>. Render compilará tu aplicación en ~45 segundos y te asignará una URL segura gratuita como <code>https://nexa-finance.onrender.com</code> con HTTPS y soporte completo para PWA (instalable en iPhone, Android, Mac y Windows).
                </p>
              </div>
            </div>
          </div>

          {/* Garantía Arquitectónica Local-First */}
          <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-800/40 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-300 leading-relaxed">
              <strong className="text-blue-300 block mb-0.5">Seguridad & Privacidad Total:</strong>
              Render solo aloja los archivos estáticos HTML/JS/CSS. Tus saldos, cuentas, movimientos y configuraciones se guardan <strong>exclusivamente en tu dispositivo (IndexedDB)</strong>. Ningún dato financiero se envía a servidores externos ni incurrirás jamás en costos de base de datos.
            </div>
          </div>

          {/* Footer close */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              onClick={() => setIsRenderGuideOpen(false)}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white transition cursor-pointer"
            >
              Listo, entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
