import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  LayoutDashboard,
  PiggyBank,
  BarChart3,
  LineChart,
  ArrowLeftRight,
  PieChart,
  Table,
  ShoppingCart,
  StickyNote,
  CreditCard,
  FileSpreadsheet,
  Layers,
  Landmark,
  Tv,
  Zap,
  CalendarDays,
  Wallet,
  Sparkles,
  Settings,
  X,
  Search,
  Eye,
  EyeOff,
  Bell,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MenuGroup {
  title: string;
  items: {
    id: string;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[];
}

export const MobileMenuDrawer: React.FC = () => {
  const {
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    activeTab,
    setActiveTab,
    isPrivacyMode,
    togglePrivacyMode,
    setIsQuickSearchOpen,
    setIsAlertsOpen,
    financialAlerts,
  } = useFinance();

  if (!isMobileMenuOpen) return null;

  const menuGroups: MenuGroup[] = [
    {
      title: 'Cuentas & Liquidez',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard Principal',
          description: 'Resumen ejecutivo de liquidez y patrimonio',
          icon: LayoutDashboard,
        },
        {
          id: 'ahorros',
          label: 'Ahorros & Metas',
          description: 'Fondos, metas de ahorro y simulador',
          icon: PiggyBank,
          badge: 'Nuevo',
        },
        {
          id: 'flujo',
          label: 'Flujo Diario de Caja',
          description: 'Calendario día por día de saldos bancarios',
          icon: BarChart3,
        },
        {
          id: 'proyeccion-anual',
          label: 'Proyección 12 Meses',
          description: 'Crecimiento de liquidez y ahorro anual',
          icon: LineChart,
        },
        {
          id: 'movimientos',
          label: 'Historial de Movimientos',
          description: 'Buscador, filtros y auditoría detallada',
          icon: ArrowLeftRight,
        },
        {
          id: 'cuentas',
          label: 'Cuentas & Medios de Pago',
          description: 'Bancos, efectivo y saldos iniciales',
          icon: Wallet,
        },
      ],
    },
    {
      title: 'Tarjetas & Créditos',
      items: [
        {
          id: 'tarjetas',
          label: 'Tarjetas de Crédito',
          description: 'Límites, consumos y fechas de corte',
          icon: CreditCard,
        },
        {
          id: 'estados-cuenta',
          label: 'Estados de Cuenta (TDDC)',
          description: 'Cortes mensuales y saldo sin intereses',
          icon: FileSpreadsheet,
        },
        {
          id: 'cuotas',
          label: 'Compras a Cuotas',
          description: 'Meses sin intereses y pagos diferidos',
          icon: Layers,
        },
        {
          id: 'prestamos',
          label: 'Préstamos & Amortización',
          description: 'Saldos pendientes y abonos a capital',
          icon: Landmark,
        },
      ],
    },
    {
      title: 'Presupuesto & Gastos',
      items: [
        {
          id: 'presupuesto',
          label: 'Presupuesto Mensual',
          description: 'Metas de gasto por categoría y límites',
          icon: PieChart,
        },
        {
          id: 'tabla-mensual',
          label: 'Tabla Mensual Detallada',
          description: 'Matriz consolidada de gastos e ingresos',
          icon: Table,
        },
        {
          id: 'super',
          label: 'Súper (Compras del Hogar)',
          description: 'Lista de despensa con cálculo de costos',
          icon: ShoppingCart,
        },
        {
          id: 'suscripciones',
          label: 'Suscripciones Recurrentes',
          description: 'Streaming, software y membresías',
          icon: Tv,
        },
        {
          id: 'servicios',
          label: 'Servicios Básicos',
          description: 'Agua, luz, internet y telefonía',
          icon: Zap,
        },
      ],
    },
    {
      title: 'Planificación & Ajustes',
      items: [
        {
          id: 'simulador',
          label: '¿Puedo pagarlo?',
          description: 'Evaluador de impacto de compras grandes',
          icon: Sparkles,
        },
        {
          id: 'notas',
          label: 'Notas & Planes',
          description: 'Ideas y gastos futuros sin impacto',
          icon: StickyNote,
        },
        {
          id: 'calendario',
          label: 'Calendario Financiero',
          description: 'Vistas mensuales de pagos y cobros',
          icon: CalendarDays,
        },
        {
          id: 'reportes',
          label: 'Análisis & Cierre Mensual',
          description: 'Gráficos comparativos y balance final',
          icon: BarChart3,
        },
        {
          id: 'configuracion',
          label: 'Backup & Configuración',
          description: 'Ajustes de liquidez, moneda y respaldos',
          icon: Settings,
        },
      ],
    },
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const alertCount = financialAlerts.length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
        />

        {/* Slide-up Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative bg-slate-950 border-t border-slate-800 rounded-t-3xl max-h-[88vh] flex flex-col shadow-2xl z-10 overflow-hidden"
        >
          {/* Top Grabber */}
          <div className="pt-3 pb-2 flex items-center justify-center">
            <div className="w-12 h-1.5 bg-slate-800 rounded-full" />
          </div>

          {/* Drawer Header */}
          <div className="px-5 pb-3 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Menú de Navegación
              </h2>
              <p className="text-xs text-slate-400">Todos los módulos financieros</p>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Utility Bar in Menu */}
          <div className="px-5 py-3 bg-slate-900/60 border-b border-slate-800/80 grid grid-cols-3 gap-2">
            {/* Quick Search */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsQuickSearchOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/60 text-xs font-semibold cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-sky-400" />
              <span>Buscar</span>
            </button>

            {/* Privacy Mode Toggle */}
            <button
              onClick={togglePrivacyMode}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                isPrivacyMode
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-slate-800 border-slate-700/60 text-slate-300 hover:text-white'
              }`}
            >
              {isPrivacyMode ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>Privado</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span>Visible</span>
                </>
              )}
            </button>

            {/* Alerts Center */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsAlertsOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/60 text-xs font-semibold cursor-pointer relative"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Alertas</span>
              {alertCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                  {alertCount}
                </span>
              )}
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 pb-12">
            {menuGroups.map((group) => (
              <div key={group.title} className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
                  {group.title}
                </h3>
                <div className="grid grid-cols-1 gap-1.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        id={`mobile-drawer-${item.id}`}
                        onClick={() => handleSelectTab(item.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl transition cursor-pointer text-left ${
                          isActive
                            ? 'bg-blue-600/15 border border-blue-500/40 text-blue-400 shadow-sm'
                            : 'bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              isActive
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm font-semibold ${
                                  isActive ? 'text-white' : 'text-slate-200'
                                }`}
                              >
                                {item.label}
                              </span>
                              {item.badge && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-1">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
