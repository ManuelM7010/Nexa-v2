import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { SavingsAccount, SavingsCategory } from '../../types';
import { NexaFinancialEngine } from '../../services/financialEngine';
import {
  formatMoney,
  dollarsToCents,
  centsToDollars,
  formatDisplayDate,
} from '../../utils/formatters';
import {
  PiggyBank,
  Plus,
  ArrowRightLeft,
  ArrowDownLeft,
  ShoppingBag,
  TrendingUp,
  ShieldCheck,
  Plane,
  Home,
  Car,
  Laptop,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Clock,
  Sparkles,
  BarChart3,
  PieChart as PieChartIcon,
  Table as TableIcon,
  LayoutGrid,
  History,
  Calculator,
  Edit2,
  Trash2,
  X,
  Target,
  ArrowUpRight,
  HelpCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

type SavingsViewMode = 'tarjetas' | 'tabla' | 'movimientos' | 'graficos' | 'simulador';

export const SavingsView: React.FC = () => {
  const {
    savingsAccounts,
    accounts,
    transactions,
    categories,
    settings,
    todayStr,
    executiveSummary,
    saveSavingsAccount,
    deleteSavingsAccount,
    transferToSavings,
    withdrawFromSavings,
    spendFromSavings,
  } = useFinance();

  // Mode Selection
  const [activeMode, setActiveMode] = useState<SavingsViewMode>('tarjetas');

  // Modals state
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SavingsAccount | null>(null);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isSpendModalOpen, setIsSpendModalOpen] = useState(false);

  // Pre-selected target for modals
  const [selectedSavingsId, setSelectedSavingsId] = useState<string>('');

  // Form states for Transfer (Bank -> Savings)
  const [transferSourceAccId, setTransferSourceAccId] = useState<string>('');
  const [transferAmountStr, setTransferAmountStr] = useState('');
  const [transferConcept, setTransferConcept] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [transferDate, setTransferDate] = useState(todayStr);

  // Form states for Withdraw (Savings -> Bank)
  const [withdrawTargetAccId, setWithdrawTargetAccId] = useState<string>('');
  const [withdrawAmountStr, setWithdrawAmountStr] = useState('');
  const [withdrawConcept, setWithdrawConcept] = useState('');
  const [withdrawNotes, setWithdrawNotes] = useState('');
  const [withdrawDate, setWithdrawDate] = useState(todayStr);

  // Form states for Spend from Savings
  const [spendAmountStr, setSpendAmountStr] = useState('');
  const [spendConcept, setSpendConcept] = useState('');
  const [spendCategoryId, setSpendCategoryId] = useState('');
  const [spendNotes, setSpendNotes] = useState('');
  const [spendDate, setSpendDate] = useState(todayStr);

  // Form states for Account creation/edit
  const [accountName, setAccountName] = useState('');
  const [accountCategory, setAccountCategory] = useState<SavingsCategory>('general');
  const [accountTargetAmountStr, setAccountTargetAmountStr] = useState('');
  const [accountInitialBalanceStr, setAccountInitialBalanceStr] = useState('');
  const [accountTargetDate, setAccountTargetDate] = useState('');
  const [accountColor, setAccountColor] = useState('#10b981');
  const [accountIcon, setAccountIcon] = useState('ShieldCheck');
  const [accountNotes, setAccountNotes] = useState('');

  // Simulator states
  const [simGoalAmountStr, setSimGoalAmountStr] = useState('1500');
  const [simCurrentSavedStr, setSimCurrentSavedStr] = useState('300');
  const [simTargetMonthsStr, setSimTargetMonthsStr] = useState('6');

  // Calculate balances per savings account
  const accountsWithCalculations = useMemo(() => {
    return savingsAccounts.map((sav) => {
      const stats = NexaFinancialEngine.calculateSavingsAccountBalance(sav, transactions);
      return {
        ...sav,
        ...stats,
      };
    });
  }, [savingsAccounts, transactions]);

  // Aggregate totals
  const totalSavings = useMemo(() => {
    return accountsWithCalculations.reduce((acc, s) => acc + s.currentBalance, 0);
  }, [accountsWithCalculations]);

  const totalTarget = useMemo(() => {
    return accountsWithCalculations.reduce((acc, s) => acc + s.targetAmount, 0);
  }, [accountsWithCalculations]);

  const globalProgress = totalTarget > 0 ? Math.min(100, Math.round((totalSavings / totalTarget) * 100)) : 100;

  // Filter savings transactions
  const savingsTransactions = useMemo(() => {
    return transactions
      .filter(
        (tx) =>
          tx.status !== 'cancelado' &&
          (tx.type === 'aporte_ahorro' ||
            tx.type === 'retiro_ahorro' ||
            tx.type === 'gasto_desde_ahorro')
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions]);

  // Timeline data for AreaChart
  const evolutionData = useMemo(() => {
    return NexaFinancialEngine.getSavingsEvolutionTimeline(savingsAccounts, transactions);
  }, [savingsAccounts, transactions]);

  // Distribution data for PieChart
  const distributionData = useMemo(() => {
    return accountsWithCalculations
      .filter((s) => s.currentBalance > 0)
      .map((s) => ({
        name: s.name,
        value: s.currentBalance / 100,
        color: s.color,
      }));
  }, [accountsWithCalculations]);

  // Comparative Movements (Aportes vs Retiros vs Gastos)
  const movementTotals = useMemo(() => {
    let aportes = 0;
    let retiros = 0;
    let gastos = 0;

    savingsTransactions.forEach((tx) => {
      if (tx.type === 'aporte_ahorro') aportes += tx.amount;
      if (tx.type === 'retiro_ahorro') retiros += tx.amount;
      if (tx.type === 'gasto_desde_ahorro') gastos += tx.amount;
    });

    return [
      { name: 'Aportes a Ahorro (+)', amount: aportes / 100, fill: '#10b981' },
      { name: 'Retiros a Liquidez (-)', amount: retiros / 100, fill: '#3b82f6' },
      { name: 'Gastos con Ahorro (-)', amount: gastos / 100, fill: '#f59e0b' },
    ];
  }, [savingsTransactions]);

  // Open modals with defaults
  const openTransferModal = (savingsId?: string) => {
    const targetId = savingsId || savingsAccounts[0]?.id || '';
    setSelectedSavingsId(targetId);
    setTransferSourceAccId(accounts.find((a) => a.type === 'banco')?.id || accounts[0]?.id || '');
    setTransferAmountStr('');
    setTransferConcept('');
    setTransferNotes('');
    setTransferDate(todayStr);
    setIsTransferModalOpen(true);
  };

  const openWithdrawModal = (savingsId?: string) => {
    const targetId = savingsId || savingsAccounts[0]?.id || '';
    setSelectedSavingsId(targetId);
    setWithdrawTargetAccId(accounts.find((a) => a.type === 'banco')?.id || accounts[0]?.id || '');
    setWithdrawAmountStr('');
    setWithdrawConcept('');
    setWithdrawNotes('');
    setWithdrawDate(todayStr);
    setIsWithdrawModalOpen(true);
  };

  const openSpendModal = (savingsId?: string) => {
    const targetId = savingsId || savingsAccounts[0]?.id || '';
    setSelectedSavingsId(targetId);
    setSpendAmountStr('');
    setSpendConcept('');
    setSpendCategoryId(categories.find((c) => c.type === 'gasto')?.id || '');
    setSpendNotes('');
    setSpendDate(todayStr);
    setIsSpendModalOpen(true);
  };

  const openAccountModal = (account?: SavingsAccount) => {
    if (account) {
      setEditingAccount(account);
      setAccountName(account.name);
      setAccountCategory(account.category);
      setAccountTargetAmountStr(centsToDollars(account.targetAmount).toFixed(2));
      setAccountInitialBalanceStr(centsToDollars(account.initialBalance).toFixed(2));
      setAccountTargetDate(account.targetDate || '');
      setAccountColor(account.color);
      setAccountIcon(account.icon);
      setAccountNotes(account.notes || '');
    } else {
      setEditingAccount(null);
      setAccountName('');
      setAccountCategory('general');
      setAccountTargetAmountStr('1000.00');
      setAccountInitialBalanceStr('0.00');
      setAccountTargetDate('');
      setAccountColor('#10b981');
      setAccountIcon('ShieldCheck');
      setAccountNotes('');
    }
    setIsAccountModalOpen(true);
  };

  // Handlers
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim()) return;

    const targetAmount = dollarsToCents(accountTargetAmountStr || '0');
    const initialBalance = dollarsToCents(accountInitialBalanceStr || '0');

    await saveSavingsAccount({
      id: editingAccount ? editingAccount.id : undefined,
      name: accountName.trim(),
      category: accountCategory,
      targetAmount,
      initialBalance,
      targetDate: accountTargetDate || undefined,
      color: accountColor,
      icon: accountIcon,
      notes: accountNotes.trim() || undefined,
      isArchived: editingAccount?.isArchived || false,
    });

    setIsAccountModalOpen(false);
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = dollarsToCents(transferAmountStr || '0');
    if (amount <= 0 || !transferSourceAccId || !selectedSavingsId) return;

    await transferToSavings(
      transferSourceAccId,
      selectedSavingsId,
      amount,
      transferConcept.trim() || undefined,
      transferDate,
      transferNotes.trim() || undefined
    );

    setIsTransferModalOpen(false);
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = dollarsToCents(withdrawAmountStr || '0');
    if (amount <= 0 || !withdrawTargetAccId || !selectedSavingsId) return;

    await withdrawFromSavings(
      selectedSavingsId,
      withdrawTargetAccId,
      amount,
      withdrawConcept.trim() || undefined,
      withdrawDate,
      withdrawNotes.trim() || undefined
    );

    setIsWithdrawModalOpen(false);
  };

  const handleSpendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = dollarsToCents(spendAmountStr || '0');
    if (amount <= 0 || !spendConcept.trim() || !selectedSavingsId) return;

    await spendFromSavings(
      selectedSavingsId,
      amount,
      spendConcept.trim(),
      spendCategoryId || undefined,
      spendDate,
      spendNotes.trim() || undefined
    );

    setIsSpendModalOpen(false);
  };

  const handleDeleteAccount = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar el fondo de ahorro "${name}"?`)) {
      await deleteSavingsAccount(id);
    }
  };

  // Helper icon renderer
  const renderCategoryIcon = (iconName: string, className = 'w-5 h-5') => {
    switch (iconName) {
      case 'ShieldCheck':
        return <ShieldCheck className={className} />;
      case 'Plane':
        return <Plane className={className} />;
      case 'TrendingUp':
        return <TrendingUp className={className} />;
      case 'Home':
        return <Home className={className} />;
      case 'Car':
        return <Car className={className} />;
      case 'Laptop':
        return <Laptop className={className} />;
      default:
        return <PiggyBank className={className} />;
    }
  };

  // Simulator calculations
  const simGoal = Math.max(0, parseFloat(simGoalAmountStr) || 0);
  const simCurrent = Math.max(0, parseFloat(simCurrentSavedStr) || 0);
  const simMonths = Math.max(1, parseInt(simTargetMonthsStr) || 1);
  const simRemaining = Math.max(0, simGoal - simCurrent);
  const simMonthlyRequired = simRemaining / simMonths;
  const simBiweeklyRequired = simMonthlyRequired / 2;

  return (
    <div className="space-y-6">
      {/* Header & Global Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                Ahorros & Fondos de Reserva
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Separado de Liquidez Ordinaria
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Pasa dinero entre tu banco y fondos de ahorro, reintegra para liquidez o gasta directo sin tocar tu flujo operativo
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => openTransferModal()}
            id="btn-savings-transfer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-900/30 cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Aportar a Ahorro</span>
          </button>

          <button
            onClick={() => openWithdrawModal()}
            id="btn-savings-withdraw"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-900/30 cursor-pointer"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Retirar para Liquidez</span>
          </button>

          <button
            onClick={() => openSpendModal()}
            id="btn-savings-spend"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-md shadow-amber-900/30 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Pagar con Ahorro</span>
          </button>

          <button
            onClick={() => openAccountModal()}
            id="btn-savings-new-account"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Meta / Fondo</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Segregation & Consolidated Wealth */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total in Savings */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">Total en Fondos de Ahorro</span>
            <PiggyBank className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {formatMoney(totalSavings, settings.currencySymbol)}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{savingsAccounts.length} fondos activos configurados</span>
          </div>
        </div>

        {/* Ordinary Liquidity */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">Liquidez Ordinaria (Banco/Caja)</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {formatMoney(executiveSummary.currentRealCashBalance, settings.currencySymbol)}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>Disponible inmediato</span>
            <span className="text-blue-400 font-medium">Flujo Operativo</span>
          </div>
        </div>

        {/* Total Liquid Wealth (Consolidated) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-emerald-300 mb-1">
            <span className="font-semibold uppercase tracking-wider">Patrimonio Líquido Total</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {formatMoney(executiveSummary.totalLiquidWealth, settings.currencySymbol)}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            <span>Liquidez ordinaria + Fondos de Ahorro</span>
          </div>
        </div>

        {/* Global Progress towards Goals */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">Progreso Meta Consolidada</span>
            <Target className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-purple-400 font-mono">
              {globalProgress}%
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Meta: {formatMoney(totalTarget, settings.currencySymbol)}
            </div>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${globalProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Mode Navigation Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          {[
            { id: 'tarjetas', label: 'Metas & Fondos (Tarjetas)', icon: LayoutGrid },
            { id: 'tabla', label: 'Resumen Tabular & Auditoría', icon: TableIcon },
            { id: 'movimientos', label: 'Historial de Movimientos', icon: History },
            { id: 'graficos', label: 'Gráficos & Métricas', icon: BarChart3 },
            { id: 'simulador', label: 'Simulador de Aportes', icon: Calculator },
          ].map((mode) => {
            const Icon = mode.icon;
            const isActive = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                id={`savings-mode-${mode.id}`}
                onClick={() => setActiveMode(mode.id as SavingsViewMode)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
          <span>Los gastos con ahorro no afectan la liquidez ordinaria</span>
        </div>
      </div>

      {/* MODE 1: TARJETAS DE METAS Y FONDOS */}
      {activeMode === 'tarjetas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {accountsWithCalculations.map((account) => {
            const remaining = Math.max(0, account.targetAmount - account.currentBalance);
            const isAchieved = account.targetAmount > 0 && account.currentBalance >= account.targetAmount;

            return (
              <div
                key={account.id}
                id={`savings-card-${account.id}`}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between relative hover:border-slate-700 transition"
              >
                <div>
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                        style={{ backgroundColor: `${account.color}25`, color: account.color }}
                      >
                        {renderCategoryIcon(account.icon)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white line-clamp-1">{account.name}</h3>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          {account.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openAccountModal(account)}
                        title="Editar fondo"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(account.id, account.name)}
                        title="Eliminar fondo"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Balance Display */}
                  <div className="mt-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-400">Balance Acumulado</span>
                      {isAchieved && (
                        <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> ¡Meta Alcanzada!
                        </span>
                      )}
                    </div>
                    <div className="text-2xl font-black text-white font-mono mt-0.5">
                      {formatMoney(account.currentBalance, settings.currencySymbol)}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {account.targetAmount > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-1">
                        <span>Meta: {formatMoney(account.targetAmount, settings.currencySymbol)}</span>
                        <span className="font-bold text-white">{account.progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${account.progressPercentage}%`,
                            backgroundColor: account.color,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                        <span>Falta: {formatMoney(remaining, settings.currencySymbol)}</span>
                        {account.targetDate && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <Calendar className="w-3 h-3" /> {formatDisplayDate(account.targetDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Stats breakdown */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-[11px]">
                    <div className="bg-slate-950/60 rounded-lg p-2 border border-slate-800/50">
                      <div className="text-slate-400 text-[10px]">Aportado</div>
                      <div className="font-semibold text-emerald-400 font-mono truncate">
                        +{formatMoney(account.totalContributed, settings.currencySymbol)}
                      </div>
                    </div>
                    <div className="bg-slate-950/60 rounded-lg p-2 border border-slate-800/50">
                      <div className="text-slate-400 text-[10px]">A Liquidez</div>
                      <div className="font-semibold text-blue-400 font-mono truncate">
                        -{formatMoney(account.totalWithdrawn, settings.currencySymbol)}
                      </div>
                    </div>
                    <div className="bg-slate-950/60 rounded-lg p-2 border border-slate-800/50">
                      <div className="text-slate-400 text-[10px]">Gastado</div>
                      <div className="font-semibold text-amber-400 font-mono truncate">
                        -{formatMoney(account.totalSpent, settings.currencySymbol)}
                      </div>
                    </div>
                  </div>

                  {account.notes && (
                    <p className="text-xs text-slate-400 mt-3 italic line-clamp-2 bg-slate-950/40 p-2 rounded-lg border border-slate-800/40">
                      "{account.notes}"
                    </p>
                  )}
                </div>

                {/* Card Quick Action Buttons */}
                <div className="grid grid-cols-3 gap-1.5 mt-5 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => openTransferModal(account.id)}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Aportar</span>
                  </button>
                  <button
                    onClick={() => openWithdrawModal(account.id)}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-bold transition cursor-pointer"
                  >
                    <ArrowDownLeft className="w-3 h-3" />
                    <span>Retirar</span>
                  </button>
                  <button
                    onClick={() => openSpendModal(account.id)}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 text-xs font-bold transition cursor-pointer"
                  >
                    <ShoppingBag className="w-3 h-3" />
                    <span>Gastar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODE 2: TABLA DETALLADA Y AUDITORÍA */}
      {activeMode === 'tabla' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-emerald-400" />
              Auditoría y Desglose de Fondos de Ahorro
            </h2>
            <span className="text-xs text-slate-400">
              Cálculo estricto: Saldo = Inicial + Aportes - Retiros a Liquidez - Gastos Directos
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Fondo / Meta</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3 text-right">Saldo Inicial</th>
                  <th className="p-3 text-right text-emerald-400">Aportes (+)</th>
                  <th className="p-3 text-right text-blue-400">Retiros a Banco (-)</th>
                  <th className="p-3 text-right text-amber-400">Gastos Directos (-)</th>
                  <th className="p-3 text-right font-bold text-white">Saldo Actual</th>
                  <th className="p-3 text-right">Meta Objetivo</th>
                  <th className="p-3 text-center">% Avance</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {accountsWithCalculations.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-800/50 transition">
                    <td className="p-3">
                      <div className="flex items-center gap-2 font-bold text-white">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: acc.color }} />
                        <span>{acc.name}</span>
                      </div>
                    </td>
                    <td className="p-3 capitalize text-slate-400">{acc.category}</td>
                    <td className="p-3 text-right font-mono text-slate-400">
                      {formatMoney(acc.initialBalance, settings.currencySymbol)}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-400 font-semibold">
                      +{formatMoney(acc.totalContributed, settings.currencySymbol)}
                    </td>
                    <td className="p-3 text-right font-mono text-blue-400 font-semibold">
                      -{formatMoney(acc.totalWithdrawn, settings.currencySymbol)}
                    </td>
                    <td className="p-3 text-right font-mono text-amber-400 font-semibold">
                      -{formatMoney(acc.totalSpent, settings.currencySymbol)}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-300 font-black text-sm">
                      {formatMoney(acc.currentBalance, settings.currencySymbol)}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-400">
                      {acc.targetAmount > 0 ? formatMoney(acc.targetAmount, settings.currencySymbol) : 'Sin meta'}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-white font-mono">
                        {acc.progressPercentage}%
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openTransferModal(acc.id)}
                          title="Aportar"
                          className="p-1 rounded hover:bg-slate-800 text-emerald-400"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openWithdrawModal(acc.id)}
                          title="Retirar a banco"
                          className="p-1 rounded hover:bg-slate-800 text-blue-400"
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openSpendModal(acc.id)}
                          title="Gastar desde ahorro"
                          className="p-1 rounded hover:bg-slate-800 text-amber-400"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-950 font-bold border-t-2 border-slate-700">
                <tr>
                  <td className="p-3 text-white" colSpan={2}>
                    Totales Consolidados
                  </td>
                  <td className="p-3 text-right font-mono text-slate-400">
                    {formatMoney(
                      accountsWithCalculations.reduce((acc, s) => acc + s.initialBalance, 0),
                      settings.currencySymbol
                    )}
                  </td>
                  <td className="p-3 text-right font-mono text-emerald-400">
                    +{formatMoney(
                      accountsWithCalculations.reduce((acc, s) => acc + s.totalContributed, 0),
                      settings.currencySymbol
                    )}
                  </td>
                  <td className="p-3 text-right font-mono text-blue-400">
                    -{formatMoney(
                      accountsWithCalculations.reduce((acc, s) => acc + s.totalWithdrawn, 0),
                      settings.currencySymbol
                    )}
                  </td>
                  <td className="p-3 text-right font-mono text-amber-400">
                    -{formatMoney(
                      accountsWithCalculations.reduce((acc, s) => acc + s.totalSpent, 0),
                      settings.currencySymbol
                    )}
                  </td>
                  <td className="p-3 text-right font-mono text-emerald-300 text-sm">
                    {formatMoney(totalSavings, settings.currencySymbol)}
                  </td>
                  <td className="p-3 text-right font-mono text-white">
                    {formatMoney(totalTarget, settings.currencySymbol)}
                  </td>
                  <td className="p-3 text-center font-mono text-purple-400">
                    {globalProgress}%
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* MODE 3: HISTORIAL DE MOVIMIENTOS DE AHORRO */}
      {activeMode === 'movimientos' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-400" />
                Auditoría de Movimientos en Fondos de Ahorro
              </h2>
              <p className="text-xs text-slate-400">
                Registro de aportes, reintegros para liquidez bancaria y gastos directos desde ahorro
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400 font-medium">
              {savingsTransactions.length} operaciones registradas
            </span>
          </div>

          {savingsTransactions.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <PiggyBank className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-white">No hay movimientos de ahorro registrados aún</p>
              <p className="text-xs text-slate-400 mt-1">
                Realiza tu primer aporte desde una cuenta bancaria con el botón superior "Aportar a Ahorro".
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Tipo de Operación</th>
                    <th className="p-3">Concepto & Notas</th>
                    <th className="p-3">Fondo de Ahorro</th>
                    <th className="p-3">Cuenta Bancaria / Origen</th>
                    <th className="p-3 text-right">Monto</th>
                    <th className="p-3 text-center">Impacto en Liquidez</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {savingsTransactions.map((tx) => {
                    const savAccount = savingsAccounts.find((s) => s.id === tx.savingsAccountId);
                    const bankAccount = accounts.find((a) => a.id === tx.accountId);

                    let badgeColor = '';
                    let badgeLabel = '';
                    let liquidityImpactText = '';
                    let liquidityBadgeClass = '';

                    if (tx.type === 'aporte_ahorro') {
                      badgeColor = 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
                      badgeLabel = 'Aporte a Ahorro';
                      liquidityImpactText = 'Descuenta de banco (-)';
                      liquidityBadgeClass = 'text-red-400 bg-red-500/10 border-red-500/20';
                    } else if (tx.type === 'retiro_ahorro') {
                      badgeColor = 'bg-blue-500/15 text-blue-400 border border-blue-500/30';
                      badgeLabel = 'Retiro a Liquidez';
                      liquidityImpactText = 'Suma a banco (+)';
                      liquidityBadgeClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                    } else {
                      badgeColor = 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
                      badgeLabel = 'Gasto con Ahorro';
                      liquidityImpactText = 'Sin impacto en liquidez (0)';
                      liquidityBadgeClass = 'text-slate-400 bg-slate-800 border-slate-700';
                    }

                    return (
                      <tr key={tx.id} className="hover:bg-slate-800/50 transition">
                        <td className="p-3 font-mono text-slate-400 whitespace-nowrap">
                          {formatDisplayDate(tx.date)}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}`}>
                            {badgeLabel}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-white">{tx.concept}</div>
                          {tx.notes && <div className="text-slate-400 text-[11px] truncate max-w-xs">{tx.notes}</div>}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 font-medium text-white">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: savAccount?.color || '#10b981' }}
                            />
                            <span>{savAccount?.name || 'Fondo General'}</span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-400">
                          {tx.type === 'gasto_desde_ahorro' ? (
                            <span className="text-slate-500 italic">Pago con Ahorro</span>
                          ) : (
                            bankAccount?.name || 'Cuenta Bancaria'
                          )}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-sm whitespace-nowrap">
                          <span
                            className={
                              tx.type === 'aporte_ahorro'
                                ? 'text-emerald-400'
                                : tx.type === 'retiro_ahorro'
                                ? 'text-blue-400'
                                : 'text-amber-400'
                            }
                          >
                            {formatMoney(tx.amount, settings.currencySymbol)}
                          </span>
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${liquidityBadgeClass}`}>
                            {liquidityImpactText}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODE 4: GRÁFICOS Y MÉTRICAS */}
      {activeMode === 'graficos' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Timeline Evolution */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Evolución Acumulada de Fondos de Ahorro
                  </h3>
                  <p className="text-xs text-slate-400">Crecimiento del capital ahorrado a lo largo del tiempo</p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {formatMoney(totalSavings, settings.currencySymbol)}
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={evolutionData}>
                    <defs>
                      <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickFormatter={(v) => `$${(v / 100).toFixed(0)}`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                      formatter={(val: number) => [formatMoney(val, settings.currencySymbol), 'Total Ahorros']}
                    />
                    <Area
                      type="monotone"
                      dataKey="totalSavings"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#savingsGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Asset Distribution */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-purple-400" />
                    Distribución por Metas & Fondos
                  </h3>
                  <p className="text-xs text-slate-400">Composición porcentual de tus reservas</p>
                </div>
              </div>

              <div className="h-64 w-full flex items-center justify-center">
                {distributionData.length === 0 ? (
                  <div className="text-xs text-slate-400">Sin saldos acumulados aún</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributionData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                      >
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || '#10b981'} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                        formatter={(val: number) => [formatMoney(val * 100, settings.currencySymbol), 'Saldo']}
                      />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Chart 3: Movements Comparison */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                  Comparativa de Flujos de Ahorro: Entradas vs Salidas
                </h3>
                <p className="text-xs text-slate-400">
                  Aportes a Ahorro (+) frente a Retiros para dar Liquidez (-) y Gastos pagados con Ahorro (-)
                </p>
              </div>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={movementTotals}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickFormatter={(v) => `$${v.toFixed(0)}`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                    formatter={(val: number) => [formatMoney(val * 100, settings.currencySymbol), 'Total']}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* MODE 5: SIMULADOR DE APORTES */}
      {activeMode === 'simulador' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-3xl mx-auto">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Simulador de Metas & Ritmo de Ahorro</h2>
              <p className="text-xs text-slate-400">
                Calcula exactamente cuánto debes aportar cada quincena o mes para alcanzar tus metas
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Meta Objetivo ({settings.currencySymbol})
              </label>
              <input
                type="number"
                min="1"
                value={simGoalAmountStr}
                onChange={(e) => setSimGoalAmountStr(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Ahorrado Actualmente ({settings.currencySymbol})
              </label>
              <input
                type="number"
                min="0"
                value={simCurrentSavedStr}
                onChange={(e) => setSimCurrentSavedStr(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Plazo Deseado (Meses)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={simTargetMonthsStr}
                onChange={(e) => setSimTargetMonthsStr(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Results Display */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <div>
              <div className="text-xs text-slate-400">Capital Faltante</div>
              <div className="text-xl font-bold text-white font-mono mt-1">
                {formatMoney(dollarsToCents(simRemaining), settings.currencySymbol)}
              </div>
            </div>

            <div className="border-y sm:border-y-0 sm:border-x border-slate-800 py-3 sm:py-0">
              <div className="text-xs text-purple-400 font-semibold uppercase tracking-wider">Aporte Quincenal</div>
              <div className="text-2xl font-black text-purple-400 font-mono mt-1">
                {formatMoney(dollarsToCents(simBiweeklyRequired), settings.currencySymbol)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Cada 15 días</div>
            </div>

            <div>
              <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Aporte Mensual</div>
              <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
                {formatMoney(dollarsToCents(simMonthlyRequired), settings.currencySymbol)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">1 vez al mes</div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: APORTAR A AHORRO (BANCO -> AHORRO) */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <ArrowRightLeft className="w-4 h-4" />
                <span>Aportar a Fondo de Ahorro</span>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              Se descontará el monto de tu cuenta bancaria y se sumará a la cuenta de ahorro seleccionada.
            </p>

            <form onSubmit={handleTransferSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cuenta Bancaria de Origen *
                </label>
                <select
                  required
                  value={transferSourceAccId}
                  onChange={(e) => setTransferSourceAccId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.bankName || acc.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Fondo de Ahorro de Destino *
                </label>
                <select
                  required
                  value={selectedSavingsId}
                  onChange={(e) => setSelectedSavingsId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {savingsAccounts.map((sav) => (
                    <option key={sav.id} value={sav.id}>
                      {sav.name} ({sav.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Monto ({settings.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={transferAmountStr}
                    onChange={(e) => setTransferAmountStr(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-bold font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Concepto / Etiqueta
                </label>
                <input
                  type="text"
                  value={transferConcept}
                  onChange={(e) => setTransferConcept(e.target.value)}
                  placeholder="Ej. Aporte Quincenal Fondo Emergencia"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notas Adicionales
                </label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="Opcional..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-900/40"
                >
                  Confirmar Aporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RETIRAR A LIQUIDEZ (AHORRO -> BANCO) */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-blue-400 font-bold">
                <ArrowDownLeft className="w-4 h-4" />
                <span>Reintegrar Ahorro para Dar Liquidez</span>
              </div>
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              Se descontará del fondo de ahorro y se depositará en tu cuenta bancaria para restaurar liquidez disponible.
            </p>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Fondo de Ahorro de Origen *
                </label>
                <select
                  required
                  value={selectedSavingsId}
                  onChange={(e) => setSelectedSavingsId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {savingsAccounts.map((sav) => (
                    <option key={sav.id} value={sav.id}>
                      {sav.name} ({sav.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cuenta Bancaria de Destino *
                </label>
                <select
                  required
                  value={withdrawTargetAccId}
                  onChange={(e) => setWithdrawTargetAccId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.bankName || acc.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Monto ({settings.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={withdrawAmountStr}
                    onChange={(e) => setWithdrawAmountStr(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-bold font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={withdrawDate}
                    onChange={(e) => setWithdrawDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Concepto / Motivo de Reintegro
                </label>
                <input
                  type="text"
                  value={withdrawConcept}
                  onChange={(e) => setWithdrawConcept(e.target.value)}
                  placeholder="Ej. Cobertura de imprevisto o compromiso mensual"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-900/40"
                >
                  Reintegrar a Liquidez
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: GASTAR DESDE AHORRO (DIRECTO, SIN AFECTAR LIQUIDEZ) */}
      {isSpendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <ShoppingBag className="w-4 h-4" />
                <span>Pagar Gasto desde Fondos de Ahorro</span>
              </div>
              <button
                onClick={() => setIsSpendModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mt-3 text-xs text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
              <span>
                <strong>Regla de oro:</strong> Este gasto descuenta únicamente del fondo de ahorro seleccionado.
                <strong> No afecta tu liquidez bancaria ordinaria</strong> ni reduce tus cuentas operativas.
              </span>
            </div>

            <form onSubmit={handleSpendSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Fondo de Ahorro a Debitar *
                </label>
                <select
                  required
                  value={selectedSavingsId}
                  onChange={(e) => setSelectedSavingsId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {savingsAccounts.map((sav) => (
                    <option key={sav.id} value={sav.id}>
                      {sav.name} ({sav.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Descripción del Gasto *
                </label>
                <input
                  type="text"
                  required
                  value={spendConcept}
                  onChange={(e) => setSpendConcept(e.target.value)}
                  placeholder="Ej. Reserva hotel vacaciones, Reparación médica..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Monto ({settings.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={spendAmountStr}
                    onChange={(e) => setSpendAmountStr(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-bold font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={spendDate}
                    onChange={(e) => setSpendDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Categoría Presupuestaria
                </label>
                <select
                  value={spendCategoryId}
                  onChange={(e) => setSpendCategoryId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSpendModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-md shadow-amber-900/40"
                >
                  Efectuar Gasto con Ahorro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CREAR / EDITAR CUENTA O META DE AHORRO */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <PiggyBank className="w-5 h-5" />
                <span>{editingAccount ? 'Editar Fondo de Ahorro' : 'Nuevo Fondo / Meta de Ahorro'}</span>
              </div>
              <button
                onClick={() => setIsAccountModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nombre del Fondo o Meta *
                </label>
                <input
                  type="text"
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Ej. Fondo de Emergencia, Vacaciones Fin de Año..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Categoría
                  </label>
                  <select
                    value={accountCategory}
                    onChange={(e) => setAccountCategory(e.target.value as SavingsCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="emergencia">Fondo de Emergencia</option>
                    <option value="viaje">Viaje / Vacaciones</option>
                    <option value="inversion">Inversión / Oportunidad</option>
                    <option value="vivienda">Vivienda / Hogar</option>
                    <option value="vehiculo">Vehículo / Transporte</option>
                    <option value="tecnologia">Tecnología / Equipos</option>
                    <option value="retiro">Retiro / Largo Plazo</option>
                    <option value="general">Ahorro General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Icono
                  </label>
                  <select
                    value={accountIcon}
                    onChange={(e) => setAccountIcon(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="ShieldCheck">Escudo (Seguridad / Emergencia)</option>
                    <option value="Plane">Avión (Viaje)</option>
                    <option value="TrendingUp">Gráfico Crecimiento (Inversión)</option>
                    <option value="Home">Casa (Hogar / Vivienda)</option>
                    <option value="Car">Auto (Vehículo)</option>
                    <option value="Laptop">Computadora (Tecnología)</option>
                    <option value="PiggyBank">Alcancía (General)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Meta Objetivo ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={accountTargetAmountStr}
                    onChange={(e) => setAccountTargetAmountStr(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Balance Inicial ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={accountInitialBalanceStr}
                    onChange={(e) => setAccountInitialBalanceStr(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Fecha Objetivo
                  </label>
                  <input
                    type="date"
                    value={accountTargetDate}
                    onChange={(e) => setAccountTargetDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Color Identificador
                </label>
                <div className="flex items-center gap-2">
                  {['#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAccountColor(c)}
                      className={`w-7 h-7 rounded-full transition cursor-pointer ${
                        accountColor === c ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notas / Propósito del fondo
                </label>
                <textarea
                  rows={2}
                  value={accountNotes}
                  onChange={(e) => setAccountNotes(e.target.value)}
                  placeholder="Detalles sobre las reglas o propósito de este ahorro..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-900/40"
                >
                  {editingAccount ? 'Guardar Cambios' : 'Crear Fondo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
