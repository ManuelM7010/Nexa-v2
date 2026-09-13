import React from 'react';
import { useOnlineStatus } from '../../hooks/usePWAInstall';
import { WifiOff, Database } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="offline-banner"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-500/90 backdrop-blur border border-amber-400/50 px-4 py-2.5 text-xs font-semibold text-slate-950 shadow-2xl animate-in slide-in-from-bottom duration-300"
    >
      <div className="flex items-center gap-1.5">
        <WifiOff className="w-4 h-4 text-slate-950 stroke-[2.5]" />
        <span>Modo Offline</span>
      </div>
      <div className="h-3 w-px bg-slate-950/30" />
      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-900">
        <Database className="w-3.5 h-3.5" />
        <span>Tus datos están guardados en IndexedDB local</span>
      </div>
    </div>
  );
};
