import React from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Header } from './components/common/Header';
import { NavigationBar } from './components/common/NavigationBar';
import { MonthStrip } from './components/common/MonthStrip';
import { NewTransactionModal } from './components/common/NewTransactionModal';
import { AffordabilityModal } from './components/common/AffordabilityModal';
import { RenderGuideModal } from './components/common/RenderGuideModal';

import { DashboardView } from './components/views/DashboardView';
import { DailyCashFlowView } from './components/views/DailyCashFlowView';
import { MultiMonthProjectionView } from './components/views/MultiMonthProjectionView';
import { TransactionsView } from './components/views/TransactionsView';
import { BudgetView } from './components/views/BudgetView';
import { DetailedMonthlyBudgetView } from './components/views/DetailedMonthlyBudgetView';
import { GroceryView } from './components/views/GroceryView';
import { NotesView } from './components/views/NotesView';
import { CreditCardsView } from './components/views/CreditCardsView';
import { InstallmentsView } from './components/views/InstallmentsView';
import { LoansView } from './components/views/LoansView';
import { SubscriptionsView } from './components/views/SubscriptionsView';
import { ServicesView } from './components/views/ServicesView';
import { CalendarView } from './components/views/CalendarView';
import { AccountsView } from './components/views/AccountsView';
import { ReportsView } from './components/views/ReportsView';
import { AffordabilityView } from './components/views/AffordabilityView';
import { SettingsView } from './components/views/SettingsView';

const MainAppContent: React.FC = () => {
  const { activeTab, isLoading } = useFinance();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'flujo':
        return <DailyCashFlowView />;
      case 'proyeccion-anual':
        return <MultiMonthProjectionView />;
      case 'movimientos':
        return <TransactionsView />;
      case 'presupuesto':
        return <BudgetView />;
      case 'tabla-mensual':
        return <DetailedMonthlyBudgetView />;
      case 'super':
        return <GroceryView />;
      case 'notas':
        return <NotesView />;
      case 'tarjetas':
        return <CreditCardsView />;
      case 'cuotas':
        return <InstallmentsView />;
      case 'prestamos':
        return <LoansView />;
      case 'suscripciones':
        return <SubscriptionsView />;
      case 'servicios':
        return <ServicesView />;
      case 'calendario':
        return <CalendarView />;
      case 'cuentas':
        return <AccountsView />;
      case 'reportes':
        return <ReportsView />;
      case 'simulador':
        return <AffordabilityView />;
      case 'configuracion':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white font-sans antialiased">
      {/* Top Application Bar */}
      <Header />

      {/* Main Feature Tabs Navigation */}
      <NavigationBar />

      {/* Interactive Monthly Timeline Selector */}
      <MonthStrip />

      {/* Main Dynamic Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400 font-medium">
              Iniciando motor financiero NEXA en almacenamiento local...
            </span>
          </div>
        ) : (
          renderActiveView()
        )}
      </main>

      {/* Global Application Modals */}
      <NewTransactionModal />
      <AffordabilityModal />
      <RenderGuideModal />

      {/* Fintech Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white tracking-wider">NEXA FINANCE</span>
            <span>•</span>
            <span>Motor de Proyección Diaria de Liquidez</span>
          </div>
          <div>
            100% Local-First en IndexedDB • Sin costos recurrentes • Listo para Render.com
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <MainAppContent />
    </FinanceProvider>
  );
}
