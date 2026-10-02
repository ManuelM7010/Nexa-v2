import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { SavingsAccount, SavingsCategory } from '../../types';
import { NexaFinancialEngine } from '../../services/financialEngine';
import {
  formatMoney,
  dollarsToCents,
  centsToDollars,
  formatDisplayDate,
  MONTH_NAMES_ES,
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
  Wallet,
  DollarSign,
  Coins,
  Landmark,
  Gem,
  CreditCard,
  Award,
  Trophy,
  Flag,
  Bike,
  Compass,
  Rocket,
  Anchor,
  Heart,
  Sun,
  Coffee,
  Gift,
  Smartphone,
  GraduationCap,
  BookOpen,
  Briefcase,
  Building2,
  Dumbbell,
  Watch,
  Music,
  ChevronLeft,
  ChevronRight,
  Search,
  Tag,
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

export interface CustomSavingsCategoryItem {
  id: string;
  name: string;
  color: string;
  icon: string;
}

const DEFAULT_SAVINGS_CATEGORIES: CustomSavingsCategoryItem[] = [
  { id: 'emergencia', name: 'Fondo de Emergencia', color: '#10b981', icon: 'ShieldCheck' },
  { id: 'meta', name: 'Meta Financiera', color: '#6366f1', icon: 'Target' },
  { id: 'inversion', name: 'Inversión / Oportunidad', color: '#f59e0b', icon: 'TrendingUp' },
  { id: 'viaje', name: 'Viaje / Vacaciones', color: '#0ea5e9', icon: 'Plane' },
  { id: 'vivienda', name: 'Vivienda / Hogar', color: '#06b6d4', icon: 'Home' },
  { id: 'vehiculo', name: 'Vehículo / Auto', color: '#3b82f6', icon: 'Car' },
  { id: 'tecnologia', name: 'Tecnología / Equipos', color: '#8b5cf6', icon: 'Laptop' },
  { id: 'educacion', name: 'Educación / Cursos', color: '#f97316', icon: 'GraduationCap' },
  { id: 'salud', name: 'Salud & Bienestar', color: '#ec4899', icon: 'Heart' },
  { id: 'retiro', name: 'Retiro / Largo Plazo', color: '#a855f7', icon: 'Landmark' },
  { id: 'negocio', name: 'Negocio / Emprendimiento', color: '#14b8a6', icon: 'Briefcase' },
  { id: 'general', name: 'Ahorro General', color: '#64748b', icon: 'PiggyBank' },
];

const AVAILABLE_ICONS = [
  { id: 'ShieldCheck', label: 'Escudo / Protección', category: 'Seguridad' },
  { id: 'Target', label: 'Diana / Meta', category: 'Metas' },
  { id: 'Trophy', label: 'Trofeo / Éxito', category: 'Metas' },
  { id: 'Award', label: 'Medalla / Logro', category: 'Metas' },
  { id: 'Flag', label: 'Bandera / Hito', category: 'Metas' },
  { id: 'Sparkles', label: 'Estrellas / Sueño', category: 'Metas' },
  { id: 'PiggyBank', label: 'Alcancía / Ahorro', category: 'Finanzas' },
  { id: 'Wallet', label: 'Billetera', category: 'Finanzas' },
  { id: 'DollarSign', label: 'Dólar / Dinero', category: 'Finanzas' },
  { id: 'Coins', label: 'Monedas', category: 'Finanzas' },
  { id: 'TrendingUp', label: 'Gráfico Crecimiento', category: 'Finanzas' },
  { id: 'Landmark', label: 'Banco / Patrimonio', category: 'Finanzas' },
  { id: 'Gem', label: 'Diamante / Riqueza', category: 'Finanzas' },
  { id: 'CreditCard', label: 'Tarjeta', category: 'Finanzas' },
  { id: 'Plane', label: 'Avión / Viajes', category: 'Viajes' },
  { id: 'Car', label: 'Auto / Vehículo', category: 'Transporte' },
  { id: 'Bike', label: 'Bicicleta / Movilidad', category: 'Transporte' },
  { id: 'Compass', label: 'Brújula / Explorar', category: 'Viajes' },
  { id: 'Rocket', label: 'Cohete / Despegue', category: 'Metas' },
  { id: 'Anchor', label: 'Ancla / Seguridad', category: 'Seguridad' },
  { id: 'Home', label: 'Casa / Hogar', category: 'Hogar' },
  { id: 'Heart', label: 'Corazón / Salud', category: 'Salud' },
  { id: 'Sun', label: 'Sol / Vacaciones', category: 'Viajes' },
  { id: 'Coffee', label: 'Café / Estilo de vida', category: 'Vida' },
  { id: 'Gift', label: 'Regalo / Festividades', category: 'Hogar' },
  { id: 'ShoppingBag', label: 'Compras / Gustos', category: 'Hogar' },
  { id: 'Laptop', label: 'Computadora / Tecnología', category: 'Tecnología' },
  { id: 'Smartphone', label: 'Celular / Gadget', category: 'Tecnología' },
  { id: 'GraduationCap', label: 'Graduación / Educación', category: 'Educación' },
  { id: 'BookOpen', label: 'Libro / Estudio', category: 'Educación' },
  { id: 'Briefcase', label: 'Maletín / Emprendimiento', category: 'Trabajo' },
  { id: 'Building2', label: 'Edificio / Inmuebles', category: 'Hogar' },
  { id: 'Dumbbell', label: 'Mancuerna / Fitness', category: 'Salud' },
  { id: 'Watch', label: 'Reloj / Tiempo', category: 'Vida' },
  { id: 'Music', label: 'Música / Pasatiempo', category: 'Vida' },
];

const SAVINGS_CATEGORIES_STORAGE_KEY = 'nexa_custom_savings_categories';

const ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  PiggyBank,
  Wallet,
  DollarSign,
  TrendingUp,
  Coins,
  Landmark,
  Gem,
  CreditCard,
  ShieldCheck,
  Target,
  Award,
  Trophy,
  Flag,
  Sparkles,
  Plane,
  Car,
  Bike,
  Compass,
  Rocket,
  Anchor,
  Home,
  Heart,
  Sun,
  Coffee,
  Gift,
  ShoppingBag,
  Laptop,
  Smartphone,
  GraduationCap,
  BookOpen,
  Briefcase,
  Building2,
  Dumbbell,
  Watch,
  Music,
};

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
    selectedYear,
    selectedMonth,
    setSelectedYear,
    setSelectedMonth,
    saveSavingsAccount,
    deleteSavingsAccount,
    transferToSavings,
    withdrawFromSavings,
    spendFromSavings,
  } = useFinance();

  const monthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const monthName = MONTH_NAMES_ES[selectedMonth - 1] || 'Mes';
  const daysInSelectedMonth = new Date(selectedYear, selectedMonth, 0).getDate();

  // Mode Selection
  const [activeMode, setActiveMode] = useState<SavingsViewMode>('tarjetas');

  // Custom Categories state with localStorage persistence
  const [customCategories, setCustomCategories] = useState<CustomSavingsCategoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(SAVINGS_CATEGORIES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = [...DEFAULT_SAVINGS_CATEGORIES];
          parsed.forEach((cat: CustomSavingsCategoryItem) => {
            if (!merged.some((m) => m.id === cat.id)) {
              merged.push(cat);
            }
          });
          return merged;
        }
      }
    } catch (e) {
      console.error('Error loading custom savings categories', e);
    }
    return DEFAULT_SAVINGS_CATEGORIES;
  });

  // New Category Modal states
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366f1');
  const [newCatIcon, setNewCatIcon] = useState('Target');

  // Visual Icon Picker state
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [iconSearchQuery, setIconSearchQuery] = useState('');
  const [iconCategoryFilter, setIconCategoryFilter] = useState('all');

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
  const [accountCategory, setAccountCategory] = useState<string>('general');
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

  // Calculate Month-Aware balances per savings account (strictly aware of selected month!)
  const accountsWithCalculations = useMemo(() => {
    return savingsAccounts.map((sav) => {
      const stats = NexaFinancialEngine.calculateSavingsAccountMonthlyStats(
        sav,
        transactions,
        selectedYear,
        selectedMonth,
        todayStr
      );
      return {
        ...sav,
        ...stats,
        // for backward compatibility with existing sub-tabs (table, movements, charts):
        currentBalance: stats.accumulatedAtSelectedMonth,
        progressPercentage: stats.progressAtSelectedMonth,
        totalContributed: stats.monthContributions,
        totalWithdrawn: stats.monthWithdrawals,
        totalSpent: stats.monthSpent,
      };
    });
  }, [savingsAccounts, transactions, selectedYear, selectedMonth, todayStr]);

  // Dynamic Aggregate totals evaluated at the selected month
  const totalAccumulatedAtSelectedMonth = useMemo(() => {
    return accountsWithCalculations.reduce((acc, s) => acc + s.accumulatedAtSelectedMonth, 0);
  }, [accountsWithCalculations]);

  const totalMonthContributions = useMemo(() => {
    return accountsWithCalculations.reduce((acc, s) => acc + s.monthContributions, 0);
  }, [accountsWithCalculations]);

  const totalRemainingAtSelectedMonth = useMemo(() => {
    return accountsWithCalculations.reduce((acc, s) => acc + s.remainingAtSelectedMonth, 0);
  }, [accountsWithCalculations]);

  const totalTarget = useMemo(() => {
    return accountsWithCalculations.reduce((acc, s) => acc + s.targetAmount, 0);
  }, [accountsWithCalculations]);

  const totalFinalProjected = useMemo(() => {
    return accountsWithCalculations.reduce((acc, s) => acc + s.finalProjectedBalance, 0);
  }, [accountsWithCalculations]);

  const globalProgressAtSelectedMonth =
    totalTarget > 0 ? Math.min(100, Math.round((totalAccumulatedAtSelectedMonth / totalTarget) * 100)) : 100;

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
  const openTransferModal = (savingsId?: string, defaultDate?: string) => {
    const targetId = savingsId || savingsAccounts[0]?.id || '';
    setSelectedSavingsId(targetId);
    setTransferSourceAccId(accounts.find((a) => a.type === 'banco')?.id || accounts[0]?.id || '');
    setTransferAmountStr('');
    setTransferConcept('');
    setTransferNotes('');
    const dateUsed = defaultDate || (monthKey === todayStr.slice(0, 7) ? todayStr : `${monthKey}-01`);
    setTransferDate(dateUsed);
    setIsTransferModalOpen(true);
  };

  const openWithdrawModal = (savingsId?: string) => {
    const targetId = savingsId || savingsAccounts[0]?.id || '';
    setSelectedSavingsId(targetId);
    setWithdrawTargetAccId(accounts.find((a) => a.type === 'banco')?.id || accounts[0]?.id || '');
    setWithdrawAmountStr('');
    setWithdrawConcept('');
    setWithdrawNotes('');
    const dateUsed = monthKey === todayStr.slice(0, 7) ? todayStr : `${monthKey}-01`;
    setWithdrawDate(dateUsed);
    setIsWithdrawModalOpen(true);
  };

  const openSpendModal = (savingsId?: string) => {
    const targetId = savingsId || savingsAccounts[0]?.id || '';
    setSelectedSavingsId(targetId);
    setSpendAmountStr('');
    setSpendConcept('');
    setSpendCategoryId(categories.find((c) => c.type === 'gasto')?.id || '');
    setSpendNotes('');
    const dateUsed = monthKey === todayStr.slice(0, 7) ? todayStr : `${monthKey}-01`;
    setSpendDate(dateUsed);
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
    setIconPickerOpen(false);
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
      category: accountCategory as SavingsCategory,
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

  const handleCreateCustomCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const id = newCatName.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') + '_' + Date.now();
    const newCat: CustomSavingsCategoryItem = {
      id,
      name: newCatName.trim(),
      color: newCatColor,
      icon: newCatIcon,
    };
    const updated = [...customCategories, newCat];
    setCustomCategories(updated);
    try {
      localStorage.setItem(SAVINGS_CATEGORIES_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Error saving custom category', err);
    }
    setAccountCategory(id);
    setAccountColor(newCatColor);
    setAccountIcon(newCatIcon);
    setIsNewCategoryModalOpen(false);
    setNewCatName('');
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = dollarsToCents(transferAmountStr || '0');
    if (amount <= 0 || !transferSourceAccId || !selectedSavingsId) return;

    const status = transferDate > todayStr ? 'planificado' : 'realizado';

    await transferToSavings(
      transferSourceAccId,
      selectedSavingsId,
      amount,
      transferConcept.trim() || undefined,
      transferDate,
      transferNotes.trim() || undefined,
      status
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
    const IconCmp = ICON_COMPONENTS[iconName] || PiggyBank;
    return <IconCmp className={className} />;
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
                Ahorros & Metas Financieras
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Separado de Liquidez Ordinaria
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Proyecta metas, programa aportes mensuales y visualiza el avance exacto mes a mes de tus fondos de reserva
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
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-md shadow-purple-900/30 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Meta / Fondo</span>
          </button>
        </div>
      </div>

      {/* Month Navigation Strip for Goals & Savings Progress */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                Mes Seleccionado para Metas y Avance
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  monthKey === todayStr.slice(0, 7)
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : monthKey > todayStr.slice(0, 7)
                    ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {monthKey === todayStr.slice(0, 7)
                  ? 'Mes Actual'
                  : monthKey > todayStr.slice(0, 7)
                  ? 'Proyección Futura'
                  : 'Histórico'}
              </span>
            </div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>{monthName} {selectedYear}</span>
              <span className="text-xs font-normal text-slate-400">
                (El avance de cada meta se evalúa hasta el {daysInSelectedMonth} de {monthName})
              </span>
            </h2>
          </div>
        </div>

        {/* Quick Month Navigation Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => {
              if (selectedMonth === 1) {
                setSelectedYear(selectedYear - 1);
                setSelectedMonth(12);
              } else {
                setSelectedMonth(selectedMonth - 1);
              }
            }}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Mes anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              const [nowY, nowM] = todayStr.split('-').map(Number);
              setSelectedYear(nowY);
              setSelectedMonth(nowM);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
              monthKey === todayStr.slice(0, 7)
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/30'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Mes Actual (Hoy)
          </button>

          <button
            onClick={() => {
              if (selectedMonth === 12) {
                setSelectedYear(selectedYear + 1);
                setSelectedMonth(1);
              } else {
                setSelectedMonth(selectedMonth + 1);
              }
            }}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Mes siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards: Dynamic Month Perspective & Consolidated Wealth */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Total Acumulado en Fondos al Mes Seleccionado */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider text-emerald-400">
              Acumulado a {monthName.slice(0, 3)}
            </span>
            <PiggyBank className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {formatMoney(totalAccumulatedAtSelectedMonth, settings.currencySymbol)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>Meta: {formatMoney(totalTarget, settings.currencySymbol)}</span>
            <span className="font-bold text-emerald-400 font-mono">{globalProgressAtSelectedMonth}%</span>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${globalProgressAtSelectedMonth}%` }}
            />
          </div>
        </div>

        {/* Card 2: Aportes en este Mes Seleccionado */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-purple-500/30 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-purple-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">
              Aporte de {monthName.slice(0, 3)}
            </span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-300 font-mono">
            +{formatMoney(totalMonthContributions, settings.currencySymbol)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            <span>Aportes planificados/reales en el mes</span>
          </div>
        </div>

        {/* Card 3: Monto Pendiente Restante al Mes */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">
              Faltante a la Meta
            </span>
            <Target className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            {formatMoney(totalRemainingAtSelectedMonth, settings.currencySymbol)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            <span>Por acumular desde {monthName}</span>
          </div>
        </div>

        {/* Card 4: Liquidez Ordinaria (Banco/Caja) */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">
              Liquidez Ordinaria
            </span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {formatMoney(executiveSummary.currentRealCashBalance, settings.currencySymbol)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>Disponible inmediato</span>
            <span className="text-blue-400 font-medium">Flujo Operativo</span>
          </div>
        </div>

        {/* Card 5: Patrimonio Líquido Total en el Mes */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">
              Patrimonio Líquido
            </span>
            <ShieldCheck className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {formatMoney(totalAccumulatedAtSelectedMonth + executiveSummary.currentRealCashBalance, settings.currencySymbol)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            <span>Ahorros a {monthName} + Liquidez</span>
          </div>
        </div>

        {/* Card 6: Proyección Final Planificada */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">
              Proyección Final Total
            </span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-300 font-mono">
            {formatMoney(totalFinalProjected, settings.currencySymbol)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            <span>Con todos los aportes futuros</span>
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

      {/* MODE 1: TARJETAS DE METAS Y FONDOS (DINÁMICAS SEGÚN EL MES SELECCIONADO) */}
      {activeMode === 'tarjetas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {accountsWithCalculations.map((account) => {
            const isAchievedAtSelectedMonth = account.isGoalReachedAtSelectedMonth;
            const remainingAtSelectedMonth = account.remainingAtSelectedMonth;
            const progress = account.progressAtSelectedMonth;
            const monthContribution = account.monthContributions;

            // Target date calculations relative to selected month
            let monthsLeftToTarget: number | null = null;
            let suggestedMonthlyContribution = 0;
            if (account.targetDate) {
              const [tY, tM] = account.targetDate.split('-').map(Number);
              monthsLeftToTarget = (tY - selectedYear) * 12 + (tM - selectedMonth);
              if (monthsLeftToTarget > 0 && remainingAtSelectedMonth > 0) {
                suggestedMonthlyContribution = Math.ceil(remainingAtSelectedMonth / monthsLeftToTarget);
              }
            }

            // Quick monthly progression generator for the goal (5 months progression centered around selectedMonth)
            const projectionPills = [-1, 0, 1, 2, 3].map((offset) => {
              let pM = selectedMonth + offset;
              let pY = selectedYear;
              while (pM > 12) {
                pM -= 12;
                pY += 1;
              }
              while (pM < 1) {
                pM += 12;
                pY -= 1;
              }
              const pDays = new Date(pY, pM, 0).getDate();
              const pKey = `${pY}-${String(pM).padStart(2, '0')}`;
              const pMonthEnd = `${pKey}-${String(pDays).padStart(2, '0')}`;

              // Calculate accumulated up to pMonthEnd
              let pAcc = account.initialBalance;
              let pMonthAporte = 0;
              transactions.forEach((tx) => {
                if (tx.status === 'cancelado' || tx.savingsAccountId !== account.id) return;
                if (tx.date <= pMonthEnd) {
                  if (tx.type === 'aporte_ahorro') pAcc += tx.amount;
                  else if (tx.type === 'retiro_ahorro' || tx.type === 'gasto_desde_ahorro') pAcc -= tx.amount;
                }
                if (tx.date.startsWith(pKey) && tx.type === 'aporte_ahorro') {
                  pMonthAporte += tx.amount;
                }
              });
              pAcc = Math.max(0, pAcc);
              const pPct =
                account.targetAmount > 0
                  ? Math.min(100, Math.round((pAcc / account.targetAmount) * 100))
                  : 100;
              return {
                year: pY,
                month: pM,
                monthNameShort: MONTH_NAMES_ES[pM - 1]?.slice(0, 3) || '',
                accumulated: pAcc,
                contribution: pMonthAporte,
                percentage: pPct,
                isCurrentSelected: pY === selectedYear && pM === selectedMonth,
              };
            });

            return (
              <div
                key={account.id}
                id={`savings-card-${account.id}`}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between relative hover:border-slate-700 transition space-y-4"
              >
                <div>
                  {/* Top Header with Custom Category and Icon */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0"
                        style={{
                          backgroundColor: `${account.color}25`,
                          color: account.color,
                          borderColor: `${account.color}50`,
                          borderWidth: 1,
                        }}
                      >
                        {renderCategoryIcon(account.icon, 'w-6 h-6')}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white line-clamp-1">{account.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md"
                            style={{ backgroundColor: `${account.color}20`, color: account.color }}
                          >
                            {customCategories.find((c) => c.id === account.category)?.name || account.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openAccountModal(account)}
                        title="Editar fondo"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(account.id, account.name)}
                        title="Eliminar fondo"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Dual Month-Aware Cards inside the Goal Card:
                      1. Saldo Acumulado a este Mes Seleccionado
                      2. Aporte en este Mes Seleccionado */}
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {/* Sub-Card 1: Acumulado al Mes */}
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                        <span className="font-semibold uppercase tracking-wider">
                          Acumulado a {monthName.slice(0, 3)}
                        </span>
                        {isAchievedAtSelectedMonth && (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        )}
                      </div>
                      <div className="text-lg font-black text-white font-mono">
                        {formatMoney(account.accumulatedAtSelectedMonth, settings.currencySymbol)}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Saldo al {daysInSelectedMonth} {monthName}
                      </span>
                    </div>

                    {/* Sub-Card 2: Aporte del Mes */}
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-purple-500/20">
                      <div className="flex items-center justify-between text-[10px] text-purple-400 mb-0.5">
                        <span className="font-semibold uppercase tracking-wider">
                          Aporte {monthName.slice(0, 3)}
                        </span>
                        <Sparkles className="w-3 h-3 text-purple-400" />
                      </div>
                      <div
                        className={`text-lg font-black font-mono ${
                          monthContribution > 0 ? 'text-emerald-400' : 'text-slate-400'
                        }`}
                      >
                        {monthContribution > 0 ? `+${formatMoney(monthContribution, settings.currencySymbol)}` : '$0.00'}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        {monthContribution > 0 ? 'Aporte en el mes' : 'Sin aporte en el mes'}
                      </span>
                    </div>
                  </div>

                  {/* Goal Progress Bar & Metrics */}
                  {account.targetAmount > 0 && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-1.5">
                        <span className="font-medium text-slate-300">
                          Meta: {formatMoney(account.targetAmount, settings.currencySymbol)}
                        </span>
                        <span className="font-black text-white px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px]">
                          {progress}% a {monthName}
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: account.color,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                        <span>
                          Falta: <strong className="text-white font-mono">{formatMoney(remainingAtSelectedMonth, settings.currencySymbol)}</strong>
                        </span>
                        {account.targetDate && (
                          <span className="flex items-center gap-1 text-slate-300">
                            <Calendar className="w-3 h-3 text-blue-400" /> {formatDisplayDate(account.targetDate)}
                          </span>
                        )}
                      </div>

                      {/* Smart Monthly Target Pace */}
                      {monthsLeftToTarget !== null && monthsLeftToTarget > 0 && remainingAtSelectedMonth > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">
                            Faltan {monthsLeftToTarget} {monthsLeftToTarget === 1 ? 'mes' : 'meses'}
                          </span>
                          <span className="font-mono text-purple-300 font-semibold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                            Sugerido: {formatMoney(suggestedMonthlyContribution, settings.currencySymbol)}/mes
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Interactive Month-by-Month Progress Strip */}
                  <div className="mt-3">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1.5">
                      Evolución Mensual (Haz clic en un mes para ver su avance):
                    </span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {projectionPills.map((pill) => (
                        <button
                          key={`${pill.year}-${pill.month}`}
                          onClick={() => {
                            setSelectedYear(pill.year);
                            setSelectedMonth(pill.month);
                          }}
                          className={`p-1.5 rounded-lg border text-center transition cursor-pointer ${
                            pill.isCurrentSelected
                              ? 'bg-purple-600/20 border-purple-500 text-purple-200 ring-1 ring-purple-500/40 shadow-sm'
                              : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          <span className="text-[10px] block font-bold capitalize">
                            {pill.monthNameShort}
                          </span>
                          <span className="text-[9px] font-mono text-slate-300 block truncate">
                            {formatMoney(pill.accumulated, settings.currencySymbol)}
                          </span>
                          <span
                            className={`text-[8px] font-bold block ${
                              pill.percentage >= 100 ? 'text-emerald-400' : 'text-slate-400'
                            }`}
                          >
                            {pill.percentage}%
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reference to Real Balance Today and Total Future Planned */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 px-1">
                    <span>
                      Saldo real hoy: <strong className="text-slate-200 font-mono">{formatMoney(account.currentRealBalance, settings.currencySymbol)}</strong>
                    </span>
                    <span>
                      Proyección final: <strong className="text-indigo-300 font-mono">{formatMoney(account.finalProjectedBalance, settings.currencySymbol)}</strong>
                    </span>
                  </div>
                </div>

                {/* Card Quick Action Buttons */}
                <div className="grid grid-cols-3 gap-1.5 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => {
                      const dateUsed = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
                      openTransferModal(account.id, dateUsed);
                    }}
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
                    {formatMoney(totalAccumulatedAtSelectedMonth, settings.currencySymbol)}
                  </td>
                  <td className="p-3 text-right font-mono text-white">
                    {formatMoney(totalTarget, settings.currencySymbol)}
                  </td>
                  <td className="p-3 text-center font-mono text-purple-400">
                    {globalProgressAtSelectedMonth}%
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
                  {formatMoney(totalAccumulatedAtSelectedMonth, settings.currencySymbol)}
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

              <div className="space-y-3">
                {/* Category Selection with "+ Nueva Categoría" */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Categoría
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setNewCatName('');
                        setNewCatColor(accountColor);
                        setNewCatIcon(accountIcon);
                        setIsNewCategoryModalOpen(true);
                      }}
                      className="flex items-center gap-1 text-[11px] font-bold text-purple-400 hover:text-purple-300 transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Nueva Categoría</span>
                    </button>
                  </div>
                  <select
                    value={accountCategory}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAccountCategory(val);
                      const catObj = customCategories.find((c) => c.id === val);
                      if (catObj) {
                        setAccountColor(catObj.color);
                        setAccountIcon(catObj.icon);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {customCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Interactive Visual Icon Picker */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Icono Identificador
                    </label>
                    <button
                      type="button"
                      onClick={() => setIconPickerOpen(!iconPickerOpen)}
                      className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
                    >
                      {iconPickerOpen ? 'Ocultar selector' : 'Explorar iconos'}
                    </button>
                  </div>

                  {/* Chosen Icon Preview */}
                  <div
                    onClick={() => setIconPickerOpen(!iconPickerOpen)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shadow-md"
                        style={{ backgroundColor: `${accountColor}25`, color: accountColor }}
                      >
                        {renderCategoryIcon(accountIcon, 'w-5 h-5')}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          {AVAILABLE_ICONS.find((i) => i.id === accountIcon)?.label || accountIcon}
                        </span>
                        <span className="text-[10px] text-slate-400">Clic para cambiar icono</span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      {iconPickerOpen ? '▲' : '▼'}
                    </span>
                  </div>

                  {/* Expanded Visual Icon Picker Grid */}
                  {iconPickerOpen && (
                    <div className="mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                      {/* Search & Category Filter */}
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                          <input
                            type="text"
                            placeholder="Buscar icono..."
                            value={iconSearchQuery}
                            onChange={(e) => setIconSearchQuery(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Icon category chips */}
                      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5 text-[10px]">
                        {['all', 'Finanzas', 'Metas', 'Seguridad', 'Viajes', 'Transporte', 'Hogar', 'Tecnología', 'Educación', 'Salud', 'Vida'].map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setIconCategoryFilter(cat)}
                            className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition cursor-pointer ${
                              iconCategoryFilter === cat
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-900 text-slate-400 hover:text-white'
                            }`}
                          >
                            {cat === 'all' ? 'Todos' : cat}
                          </button>
                        ))}
                      </div>

                      {/* Icons Grid */}
                      <div className="grid grid-cols-7 gap-1.5 max-h-40 overflow-y-auto p-1 bg-slate-900/50 rounded-lg border border-slate-800/80">
                        {AVAILABLE_ICONS.filter((i) => {
                          const matchesSearch =
                            !iconSearchQuery.trim() ||
                            i.label.toLowerCase().includes(iconSearchQuery.toLowerCase()) ||
                            i.id.toLowerCase().includes(iconSearchQuery.toLowerCase());
                          const matchesCat =
                            iconCategoryFilter === 'all' || i.category === iconCategoryFilter;
                          return matchesSearch && matchesCat;
                        }).map((icon) => (
                          <button
                            key={icon.id}
                            type="button"
                            onClick={() => {
                              setAccountIcon(icon.id);
                              setIconPickerOpen(false);
                            }}
                            className={`p-2 rounded-lg flex flex-col items-center justify-center transition cursor-pointer ${
                              accountIcon === icon.id
                                ? 'bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-500'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                            title={icon.label}
                          >
                            {renderCategoryIcon(icon.id, 'w-4 h-4')}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
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

      {/* MODAL 5: NUEVA CATEGORÍA DE AHORRO PERSONALIZADA */}
      {isNewCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-purple-500/30 shadow-2xl p-6 text-slate-100 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-purple-400 font-bold">
                <Tag className="w-5 h-5" />
                <span>Crear Nueva Categoría de Ahorro</span>
              </div>
              <button
                onClick={() => setIsNewCategoryModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomCategory} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nombre de la Categoría *
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Ej. Boda, Negocio Propio, Gimnasio, Cursos..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Color Representativo
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {['#6366f1', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#f97316', '#14b8a6', '#ef4444'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewCatColor(c)}
                      className={`w-7 h-7 rounded-full transition cursor-pointer ${
                        newCatColor === c ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Icono por Defecto
                </label>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 mb-2">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
                    style={{ backgroundColor: `${newCatColor}25`, color: newCatColor }}
                  >
                    {renderCategoryIcon(newCatIcon, 'w-5 h-5')}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {AVAILABLE_ICONS.find((i) => i.id === newCatIcon)?.label || newCatIcon}
                    </span>
                    <span className="text-[10px] text-slate-400">Icono seleccionado</span>
                  </div>
                </div>

                {/* Quick Icon Selector for Category */}
                <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1.5 bg-slate-950/60 rounded-xl border border-slate-800">
                  {AVAILABLE_ICONS.map((icon) => (
                    <button
                      key={icon.id}
                      type="button"
                      onClick={() => setNewCatIcon(icon.id)}
                      className={`p-2 rounded-lg flex flex-col items-center justify-center transition cursor-pointer ${
                        newCatIcon === icon.id
                          ? 'bg-purple-600/30 text-purple-300 ring-1 ring-purple-500'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                      title={icon.label}
                    >
                      {renderCategoryIcon(icon.id, 'w-4 h-4')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-md shadow-purple-900/40 cursor-pointer"
                >
                  Guardar Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
