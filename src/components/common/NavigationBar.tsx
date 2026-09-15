import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  CalendarDays,
  CreditCard,
  Layers,
  Landmark,
  Tv,
  Zap,
  BarChart3,
  Wallet,
  Settings,
  Sparkles,
  Table,
  ShoppingCart,
  StickyNote,
  LineChart,
} from 'lucide-react';

export const NavigationBar: React.FC = () => {
  const { activeTab, setActiveTab } = useFinance();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'flujo', label: 'Flujo Diario', icon: BarChart3 },
    { id: 'proyeccion-anual', label: 'Proyección 12M', icon: LineChart },
    { id: 'movimientos', label: 'Movimientos', icon: ArrowLeftRight },
    { id: 'presupuesto', label: 'Presupuesto', icon: PieChart },
    { id: 'tabla-mensual', label: 'Tabla Mensual (Detalle)', icon: Table },
    { id: 'super', label: 'Súper (Compras)', icon: ShoppingCart },
    { id: 'notas', label: 'Notas & Planes', icon: StickyNote },
    { id: 'tarjetas', label: 'Tarjetas', icon: CreditCard },
    { id: 'cuotas', label: 'Compras a Cuotas', icon: Layers },
    { id: 'prestamos', label: 'Préstamos', icon: Landmark },
    { id: 'suscripciones', label: 'Suscripciones', icon: Tv },
    { id: 'servicios', label: 'Servicios', icon: Zap },
    { id: 'calendario', label: 'Calendario', icon: CalendarDays },
    { id: 'cuentas', label: 'Cuentas & Medios', icon: Wallet },
    { id: 'reportes', label: 'Análisis & Cierre', icon: BarChart3 },
    { id: 'simulador', label: '¿Puedo pagarlo?', icon: Sparkles },
    { id: 'configuracion', label: 'Backup & Config', icon: Settings },
  ];

  return (
    <nav className="w-full bg-slate-950 border-b border-slate-800/80 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto scrollbar-none py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex-shrink-0 ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
