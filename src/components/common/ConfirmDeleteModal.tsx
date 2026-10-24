import React from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert } from 'lucide-react';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  itemName: string;
  itemDetails?: string;
  itemTypeLabel?: string;
  itemIcon?: React.ReactNode;
  warningNote?: string;
  isDeleting?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  itemDetails,
  itemTypeLabel,
  itemIcon,
  warningNote,
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-md rounded-3xl bg-slate-900 border border-rose-500/30 p-6 shadow-2xl relative space-y-5 animate-in zoom-in-95 duration-200 overflow-hidden"
        style={{
          boxShadow: '0 20px 40px -15px rgba(225, 29, 72, 0.25)',
        }}
      >
        {/* Subtle decorative background glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-rose-500/10 blur-2xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shrink-0 shadow-inner">
              <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                {title}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Confirmación de seguridad requerida
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Cancelar y cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Item Summary Preview Card */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2 relative z-10">
          {itemTypeLabel && (
            <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full inline-block">
              {itemTypeLabel}
            </span>
          )}

          <div className="flex items-center gap-3">
            {itemIcon && (
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-700/60 text-slate-200 shrink-0">
                {itemIcon}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-white truncate">
                {itemName}
              </h4>
              {itemDetails && (
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {itemDetails}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Warning Explanatory Text */}
        <div className="flex items-start gap-2.5 text-xs text-slate-300 bg-rose-950/20 border border-rose-500/20 rounded-xl p-3 relative z-10">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {warningNote ||
              '¿Estás seguro de que deseas eliminar este elemento? Podrás revertir la acción inmediatamente con el botón Deshacer.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800/80 relative z-10">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
