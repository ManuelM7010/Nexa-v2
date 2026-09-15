import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  Account,
  CreditCard,
  Transaction,
  Category,
  Budget,
  ItemBudget,
  DetailedBudgetItem,
  InstallmentPurchase,
  Loan,
  LoanExtraPayment,
  Subscription,
  ServiceItem,
  InitialPosition,
  MonthlyClose,
  AppSettings,
  DailyCashFlowItem,
  GroceryItem,
  PlanNote,
  QuickTemplate,
} from '../types';
import { storage, NexaFullBackup } from '../services/storage';
import {
  NexaFinancialEngine,
  BudgetAnalysisItem,
  ExecutiveSummary,
  MonthProjection,
} from '../services/financialEngine';
import {
  getDefaultCategories,
  getDefaultAppSettings,
  getDefaultQuickTemplates,
  generateDemoSeedData,
} from '../services/seedData';
import { getTodayDateStr } from '../utils/formatters';

interface FinanceContextType {
  // Navigation & Date
  selectedYear: number;
  selectedMonth: number; // 1-12
  setSelectedYear: (year: number) => void;
  setSelectedMonth: (month: number) => void;
  setSelectedPeriod: (year: number, month: number) => void;
  todayStr: string;

  // Active View Tab
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Modals & Triggers
  isNewTxOpen: boolean;
  setIsNewTxOpen: (open: boolean) => void;
  editingTransaction: Transaction | null;
  setEditingTransaction: (tx: Transaction | null) => void;
  isAffordabilityOpen: boolean;
  setIsAffordabilityOpen: (open: boolean) => void;
  isRenderGuideOpen: boolean;
  setIsRenderGuideOpen: (open: boolean) => void;

  // Entities
  accounts: Account[];
  creditCards: CreditCard[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  itemBudgets: ItemBudget[];
  groceryItems: GroceryItem[];
  planNotes: PlanNote[];
  quickTemplates: QuickTemplate[];
  installmentPurchases: InstallmentPurchase[];
  loans: Loan[];
  loanPayments: LoanExtraPayment[];
  subscriptions: Subscription[];
  services: ServiceItem[];
  initialPosition: InitialPosition | null;
  monthlyCloses: MonthlyClose[];
  settings: AppSettings;
  isLoading: boolean;

  // Calculated Engine Data
  dailyCashFlow: DailyCashFlowItem[];
  budgetAnalysis: BudgetAnalysisItem[];
  detailedBudget: DetailedBudgetItem[];
  executiveSummary: ExecutiveSummary;
  allMonthTransactions: Transaction[];
  annualProjection: MonthProjection[];

  // CRUD Actions
  saveTransaction: (tx: Partial<Transaction> & { concept: string; amount: number; date: string }) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  duplicateTransaction: (id: string) => Promise<void>;
  toggleTransactionStatus: (id: string) => Promise<void>;

  saveAccount: (acc: Partial<Account> & { name: string }) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;

  saveCreditCard: (card: Partial<CreditCard> & { name: string; limit: number }) => Promise<void>;
  deleteCreditCard: (id: string) => Promise<void>;

  saveCategory: (cat: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  saveBudget: (budget: Budget) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;

  saveItemBudget: (
    itemData: Partial<ItemBudget> & {
      name: string;
      budgetedAmount: number;
      type?: 'gasto' | 'ingreso';
      categoryId?: string;
    }
  ) => Promise<void>;
  deleteItemBudget: (id: string) => Promise<void>;

  // Grocery (Súper) Module Actions
  saveGroceryItem: (
    itemData: Partial<GroceryItem> & { name: string; quantity: number }
  ) => Promise<void>;
  deleteGroceryItem: (id: string) => Promise<void>;
  toggleGroceryItemPurchased: (id: string) => Promise<void>;
  copyGroceryListToMonth: (
    fromYear: number,
    fromMonth: number,
    toYear: number,
    toMonth: number
  ) => Promise<{ copiedCount: number }>;
  clearGroceryMonth: (year: number, month: number) => Promise<void>;

  // Plan Notes Module Actions (Scratchpad / Notas de planes & futuros gastos sin impacto financiero)
  savePlanNote: (noteData: Partial<PlanNote> & { title: string }) => Promise<void>;
  deletePlanNote: (id: string) => Promise<void>;
  togglePlanNoteCompleted: (id: string) => Promise<void>;

  // Quick Templates (Gastos Frecuentes / Transacciones Rápidas)
  saveQuickTemplate: (template: Partial<QuickTemplate> & { name: string; amount: number; categoryId: string }) => Promise<void>;
  deleteQuickTemplate: (id: string) => Promise<void>;
  executeQuickTemplate: (templateId: string, customAmount?: number) => Promise<Transaction>;

  saveInstallmentPurchase: (item: Partial<InstallmentPurchase> & { concept: string; totalAmount: number }) => Promise<void>;
  deleteInstallmentPurchase: (id: string) => Promise<void>;

  saveLoan: (loan: Partial<Loan> & { name: string; originalAmount: number }) => Promise<void>;
  deleteLoan: (id: string) => Promise<void>;
  registerLoanExtraPayment: (loanId: string, amount: number, accountId: string, notes?: string) => Promise<void>;

  saveSubscription: (sub: Partial<Subscription> & { concept: string; amount: number }) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
  toggleSubscriptionMonthlyPause: (subId: string, monthKey: string) => Promise<void>;

  saveService: (srv: Partial<ServiceItem> & { company: string; serviceName: string }) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  updateServiceMonthlyRecord: (
    serviceId: string,
    monthKey: string,
    data: { actualAmount?: number; status?: 'pendiente' | 'pagado'; paidDate?: string }
  ) => Promise<void>;

  updateInitialPosition: (pos: InitialPosition) => Promise<void>;
  closeCurrentMonth: (notes?: string) => Promise<void>;
  reopenMonth: (year: number, month: number) => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;

  // Data Lifecycle & Backup
  loadDemoData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  startFromScratch: () => Promise<void>;
  exportBackup: () => Promise<NexaFullBackup>;
  importBackup: (backup: NexaFullBackup) => Promise<boolean>;
  exportBackupJSON: () => Promise<void>;
  importBackupJSON: (jsonStr: string) => Promise<boolean>;
  exportTransactionsCSV: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current real date of the day
  const todayStr = getTodayDateStr();
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(9); // September

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isNewTxOpen, setIsNewTxOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isAffordabilityOpen, setIsAffordabilityOpen] = useState(false);
  const [isRenderGuideOpen, setIsRenderGuideOpen] = useState(false);

  // Storage entities
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [itemBudgets, setItemBudgets] = useState<ItemBudget[]>([]);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [planNotes, setPlanNotes] = useState<PlanNote[]>([]);
  const [quickTemplates, setQuickTemplates] = useState<QuickTemplate[]>([]);
  const [installmentPurchases, setInstallmentPurchases] = useState<InstallmentPurchase[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanPayments, setLoanPayments] = useState<LoanExtraPayment[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [initialPosition, setInitialPosition] = useState<InitialPosition | null>(null);
  const [monthlyCloses, setMonthlyCloses] = useState<MonthlyClose[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getDefaultAppSettings());
  const [isLoading, setIsLoading] = useState(true);

  // Load from storage on mount
  const loadAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      const isCleanSlate = typeof window !== 'undefined' && localStorage.getItem('nexa_clean_slate') === 'true';

      const [
        accList,
        cardList,
        txList,
        catList,
        bgtList,
        itemBgtList,
        groceryList,
        notesList,
        tmplList,
        instList,
        loanList,
        payList,
        subList,
        srvList,
        posList,
        closeList,
        stgList,
      ] = await Promise.all([
        storage.getAll<Account>('accounts'),
        storage.getAll<CreditCard>('creditCards'),
        storage.getAll<Transaction>('transactions'),
        storage.getAll<Category>('categories'),
        storage.getAll<Budget>('budgets'),
        storage.getAll<ItemBudget>('itemBudgets'),
        storage.getAll<GroceryItem>('groceryItems'),
        storage.getAll<PlanNote>('planNotes'),
        storage.getAll<QuickTemplate>('quickTemplates'),
        storage.getAll<InstallmentPurchase>('installmentPurchases'),
        storage.getAll<Loan>('loans'),
        storage.getAll<LoanExtraPayment>('loanPayments'),
        storage.getAll<Subscription>('subscriptions'),
        storage.getAll<ServiceItem>('services'),
        storage.getAll<InitialPosition>('initialPosition'),
        storage.getAll<MonthlyClose>('monthlyCloses'),
        storage.getAll<AppSettings>('appSettings'),
      ]);

      if (!isCleanSlate && accList.length === 0 && posList.length === 0 && txList.length === 0) {
        // First run: load default categories and initial position, or demo data
        const demo = generateDemoSeedData();
        await storage.putBatch('categories', demo.categories);
        await storage.putBatch('accounts', demo.accounts);
        await storage.putBatch('creditCards', demo.creditCards);
        await storage.putBatch('budgets', demo.budgets);
        if (demo.itemBudgets?.length) await storage.putBatch('itemBudgets', demo.itemBudgets);
        await storage.putBatch('installmentPurchases', demo.installmentPurchases);
        await storage.putBatch('loans', demo.loans);
        await storage.putBatch('subscriptions', demo.subscriptions);
        await storage.putBatch('services', demo.services);
        await storage.put('initialPosition', demo.initialPosition);
        await storage.putBatch('transactions', demo.transactions);
        await storage.put('appSettings', getDefaultAppSettings());

        const defaultTemplates = getDefaultQuickTemplates();
        await storage.putBatch('quickTemplates', defaultTemplates);

        setCategories(demo.categories);
        setAccounts(demo.accounts);
        setCreditCards(demo.creditCards);
        setBudgets(demo.budgets);
        setItemBudgets(demo.itemBudgets || []);
        setGroceryItems([]);
        setPlanNotes([]);
        setQuickTemplates(defaultTemplates);
        setInstallmentPurchases(demo.installmentPurchases);
        setLoans(demo.loans);
        setSubscriptions(demo.subscriptions);
        setServices(demo.services);
        setInitialPosition(demo.initialPosition);
        setTransactions(demo.transactions);
        setSettings(getDefaultAppSettings());
      } else {
        // If templates is empty in existing DB, seed with default quick templates for convenience
        let loadedTemplates = tmplList;
        if (!isCleanSlate && tmplList.length === 0) {
          const defaultTemplates = getDefaultQuickTemplates();
          await storage.putBatch('quickTemplates', defaultTemplates);
          loadedTemplates = defaultTemplates;
        }

        setAccounts(accList);
        setCreditCards(cardList);
        setTransactions(txList);
        setCategories(catList.length > 0 ? catList : getDefaultCategories());
        setBudgets(bgtList);
        setItemBudgets(itemBgtList);
        setGroceryItems(groceryList || []);
        setPlanNotes(notesList || []);
        setQuickTemplates(loadedTemplates || []);
        setInstallmentPurchases(instList);
        setLoans(loanList);
        setLoanPayments(payList);
        setSubscriptions(subList);
        setServices(srvList);
        setInitialPosition(posList[0] || null);
        setMonthlyCloses(closeList);
        if (stgList[0]) setSettings(stgList[0]);
      }
    } catch (err) {
      console.error('Error loading NEXA data from IndexedDB:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const setSelectedPeriod = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  // Generate synthetic projected events for selected period
  const projectedEvents = useMemo(() => {
    return NexaFinancialEngine.generateProjectedEvents(selectedYear, selectedMonth, {
      subscriptions,
      services,
      installmentPurchases,
      loans,
      creditCards,
      accounts,
      existingTransactions: transactions,
    });
  }, [
    selectedYear,
    selectedMonth,
    subscriptions,
    services,
    installmentPurchases,
    loans,
    creditCards,
    accounts,
    transactions,
  ]);

  // Merge explicit transactions with generated projections
  const allMonthTransactions = useMemo(() => {
    const monthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    const explicitMonthTxs = transactions.filter((t) => t.date.startsWith(monthKey));
    const combined = [...explicitMonthTxs, ...projectedEvents];
    return combined.sort((a, b) => a.date.localeCompare(b.date));
  }, [selectedYear, selectedMonth, transactions, projectedEvents]);

  // Daily Cash Flow calculation
  const dailyCashFlow = useMemo(() => {
    const monthStartStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
    const priorTransactions = transactions.filter((t) => t.date < monthStartStr);
    const fullTransactionsForCashFlow = [...priorTransactions, ...allMonthTransactions];

    return NexaFinancialEngine.calculateDailyCashFlow(
      selectedYear,
      selectedMonth,
      todayStr,
      initialPosition,
      accounts,
      fullTransactionsForCashFlow
    );
  }, [selectedYear, selectedMonth, todayStr, initialPosition, accounts, transactions, allMonthTransactions]);

  // Deep Budget vs Real Analysis
  const budgetAnalysis = useMemo(() => {
    return NexaFinancialEngine.calculateBudgetAnalysis(
      selectedYear,
      selectedMonth,
      categories,
      budgets,
      allMonthTransactions
    );
  }, [selectedYear, selectedMonth, categories, budgets, allMonthTransactions]);

  // Detailed Itemized Budget (Gasto por Gasto e Ingreso por Ingreso)
  const detailedBudget = useMemo(() => {
    return NexaFinancialEngine.calculateDetailedBudget(
      selectedYear,
      selectedMonth,
      itemBudgets,
      allMonthTransactions,
      categories,
      subscriptions,
      services
    );
  }, [
    selectedYear,
    selectedMonth,
    itemBudgets,
    allMonthTransactions,
    categories,
    subscriptions,
    services,
  ]);

  // Executive Summary
  const executiveSummary = useMemo(() => {
    return NexaFinancialEngine.calculateExecutiveSummary(
      selectedYear,
      selectedMonth,
      todayStr,
      accounts,
      creditCards,
      loans,
      dailyCashFlow,
      allMonthTransactions,
      budgetAnalysis
    );
  }, [
    selectedYear,
    selectedMonth,
    todayStr,
    accounts,
    creditCards,
    loans,
    dailyCashFlow,
    allMonthTransactions,
    budgetAnalysis,
  ]);

  // 12-Month Multi-Month Cash Flow & Net Savings Projection
  const annualProjection = useMemo(() => {
    return NexaFinancialEngine.calculateAnnualProjection(
      selectedYear,
      selectedMonth,
      executiveSummary.currentRealCashBalance,
      {
        accounts,
        creditCards,
        categories,
        budgets,
        itemBudgets,
        subscriptions,
        services,
        installmentPurchases,
        loans,
        transactions,
      }
    );
  }, [
    selectedYear,
    selectedMonth,
    executiveSummary.currentRealCashBalance,
    accounts,
    creditCards,
    categories,
    budgets,
    itemBudgets,
    subscriptions,
    services,
    installmentPurchases,
    loans,
    transactions,
  ]);

  // --- Actions ---

  const saveTransaction = async (
    txData: Partial<Transaction> & { concept: string; amount: number; date: string }
  ) => {
    const isNew = !txData.id;
    const now = new Date().toISOString();
    const id = txData.id || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newTx: Transaction = {
      id,
      date: txData.date,
      expectedDate: txData.expectedDate || txData.date,
      realDate: txData.status === 'realizado' ? txData.realDate || txData.date : undefined,
      concept: txData.concept,
      notes: txData.notes,
      type: txData.type || 'gasto',
      categoryId: txData.categoryId,
      subcategoryId: txData.subcategoryId,
      amount: txData.amount,
      paymentMethodType: txData.paymentMethodType || 'banco',
      accountId: txData.accountId,
      creditCardId: txData.creditCardId,
      transferToAccountId: txData.transferToAccountId,
      status: txData.status || 'planificado',
      origin: txData.origin || 'manual',
      createdAt: txData.createdAt || now,
      updatedAt: now,
    };

    await storage.put('transactions', newTx);
    setTransactions((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newTx;
        return copy;
      }
      return [newTx, ...prev];
    });
  };

  const deleteTransaction = async (id: string) => {
    await storage.delete('transactions', id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const duplicateTransaction = async (id: string) => {
    const found = transactions.find((t) => t.id === id);
    if (!found) return;
    const now = new Date().toISOString();
    const copy: Transaction = {
      ...found,
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      concept: `${found.concept} (Copia)`,
      status: 'planificado',
      createdAt: now,
      updatedAt: now,
    };
    await storage.put('transactions', copy);
    setTransactions((prev) => [copy, ...prev]);
  };

  const toggleTransactionStatus = async (id: string) => {
    const found = transactions.find((t) => t.id === id);
    if (!found) return;
    const nextStatus = found.status === 'realizado' ? 'planificado' : 'realizado';
    const updated: Transaction = {
      ...found,
      status: nextStatus,
      realDate: nextStatus === 'realizado' ? found.realDate || todayStr : undefined,
      updatedAt: new Date().toISOString(),
    };
    await storage.put('transactions', updated);
    setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
  };

  const saveAccount = async (accData: Partial<Account> & { name: string }) => {
    const now = new Date().toISOString();
    const id = accData.id || `acc_${Date.now()}`;
    const newAcc: Account = {
      id,
      name: accData.name,
      type: accData.type || 'banco',
      bankName: accData.bankName,
      initialBalance: accData.initialBalance || 0,
      initialDate: accData.initialDate || todayStr,
      isActive: accData.isActive !== undefined ? accData.isActive : true,
      color: accData.color || '#2563eb',
      createdAt: accData.createdAt || now,
      updatedAt: now,
    };
    await storage.put('accounts', newAcc);
    setAccounts((prev) => {
      const idx = prev.findIndex((a) => a.id === id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newAcc;
        return copy;
      }
      return [...prev, newAcc];
    });
  };

  const deleteAccount = async (id: string) => {
    await storage.delete('accounts', id);
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  const saveCreditCard = async (cardData: Partial<CreditCard> & { name: string; limit: number }) => {
    const now = new Date().toISOString();
    const id = cardData.id || `card_${Date.now()}`;
    const newCard: CreditCard = {
      id,
      name: cardData.name,
      bank: cardData.bank || 'Banco',
      limit: cardData.limit,
      initialUsedBalance: cardData.initialUsedBalance || 0,
      cutOffDay: cardData.cutOffDay || 15,
      paymentDueDay: cardData.paymentDueDay || 30,
      usualPaymentDay: cardData.usualPaymentDay,
      color: cardData.color || '#dc2626',
      isActive: cardData.isActive !== undefined ? cardData.isActive : true,
      createdAt: cardData.createdAt || now,
      updatedAt: now,
    };
    await storage.put('creditCards', newCard);
    setCreditCards((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newCard;
        return copy;
      }
      return [...prev, newCard];
    });
  };

  const deleteCreditCard = async (id: string) => {
    await storage.delete('creditCards', id);
    setCreditCards((prev) => prev.filter((c) => c.id !== id));
  };

  const saveCategory = async (cat: Category) => {
    await storage.put('categories', cat);
    setCategories((prev) => {
      const idx = prev.findIndex((c) => c.id === cat.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = cat;
        return copy;
      }
      return [...prev, cat];
    });
  };

  const deleteCategory = async (id: string) => {
    await storage.delete('categories', id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const saveBudget = async (bgt: Budget) => {
    await storage.put('budgets', bgt);
    setBudgets((prev) => {
      const idx = prev.findIndex((b) => b.id === bgt.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = bgt;
        return copy;
      }
      return [...prev, bgt];
    });
  };

  const deleteBudget = async (id: string) => {
    await storage.delete('budgets', id);
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  };

  const saveItemBudget = async (
    itemData: Partial<ItemBudget> & {
      name: string;
      budgetedAmount: number;
      type?: 'gasto' | 'ingreso';
      categoryId?: string;
    }
  ) => {
    const now = new Date().toISOString();
    const id =
      itemData.id ||
      `ibgt_${selectedYear}_${selectedMonth}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newItem: ItemBudget = {
      id,
      year: itemData.year || selectedYear,
      month: itemData.month || selectedMonth,
      name: itemData.name.trim(),
      type: itemData.type || 'gasto',
      categoryId: itemData.categoryId || categories[0]?.id || 'general',
      budgetedAmount: Math.round(itemData.budgetedAmount),
      projectedAmount:
        itemData.projectedAmount !== undefined
          ? Math.round(itemData.projectedAmount)
          : Math.round(itemData.budgetedAmount),
      notes: itemData.notes,
      createdAt: itemData.createdAt || now,
      updatedAt: now,
    };

    await storage.put('itemBudgets', newItem);
    setItemBudgets((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = newItem;
        return next;
      }
      return [...prev, newItem];
    });
  };

  const deleteItemBudget = async (id: string) => {
    await storage.delete('itemBudgets', id);
    setItemBudgets((prev) => prev.filter((b) => b.id !== id));
  };

  const saveInstallmentPurchase = async (
    itemData: Partial<InstallmentPurchase> & { concept: string; totalAmount: number }
  ) => {
    const now = new Date().toISOString();
    const id = itemData.id || `inst_${Date.now()}`;
    const totalInstallments = itemData.totalInstallments || 12;
    const paid = itemData.paidInstallmentsCount || 0;
    const remaining = totalInstallments - paid;
    const installmentAmount =
      itemData.installmentAmount || Math.round(itemData.totalAmount / totalInstallments);
    const pendingBalance = itemData.pendingBalance !== undefined ? itemData.pendingBalance : remaining * installmentAmount;

    const newItem: InstallmentPurchase = {
      id,
      concept: itemData.concept,
      purchaseDate: itemData.purchaseDate || todayStr,
      totalAmount: itemData.totalAmount,
      creditCardId: itemData.creditCardId || creditCards[0]?.id || '',
      totalInstallments,
      installmentAmount,
      firstPaymentDate: itemData.firstPaymentDate || todayStr,
      frequency: itemData.frequency || 'mensual',
      paidInstallmentsCount: paid,
      remainingInstallmentsCount: remaining,
      pendingBalance,
      notes: itemData.notes,
      createdAt: itemData.createdAt || now,
      updatedAt: now,
    };
    await storage.put('installmentPurchases', newItem);
    setInstallmentPurchases((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newItem;
        return copy;
      }
      return [...prev, newItem];
    });
  };

  const deleteInstallmentPurchase = async (id: string) => {
    await storage.delete('installmentPurchases', id);
    setInstallmentPurchases((prev) => prev.filter((i) => i.id !== id));
  };

  const saveLoan = async (loanData: Partial<Loan> & { name: string; originalAmount: number }) => {
    const now = new Date().toISOString();
    const id = loanData.id || `loan_${Date.now()}`;
    const newLoan: Loan = {
      id,
      name: loanData.name,
      lender: loanData.lender || 'Entidad Financiera',
      originalAmount: loanData.originalAmount,
      remainingBalance:
        loanData.remainingBalance !== undefined ? loanData.remainingBalance : loanData.originalAmount,
      installmentAmount: loanData.installmentAmount || 10000,
      frequency: loanData.frequency || 'mensual',
      paymentDay: loanData.paymentDay || 28,
      remainingInstallmentsCount: loanData.remainingInstallmentsCount || 24,
      paymentsMadeCount: loanData.paymentsMadeCount || 0,
      nextPaymentDate: loanData.nextPaymentDate || `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-28`,
      preferredAccountId: loanData.preferredAccountId,
      notes: loanData.notes,
      createdAt: loanData.createdAt || now,
      updatedAt: now,
    };
    await storage.put('loans', newLoan);
    setLoans((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newLoan;
        return copy;
      }
      return [...prev, newLoan];
    });
  };

  const deleteLoan = async (id: string) => {
    await storage.delete('loans', id);
    setLoans((prev) => prev.filter((l) => l.id !== id));
  };

  const registerLoanExtraPayment = async (
    loanId: string,
    amount: number,
    accountId: string,
    notes?: string
  ) => {
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) return;

    const newPayment: LoanExtraPayment = {
      id: `pay_${Date.now()}`,
      loanId,
      date: todayStr,
      amount,
      accountId,
      notes: notes || 'Abono extraordinario a capital',
      createdAt: new Date().toISOString(),
    };

    // Update loan balance directly
    const updatedLoan: Loan = {
      ...loan,
      remainingBalance: Math.max(0, loan.remainingBalance - amount),
      updatedAt: new Date().toISOString(),
    };

    // Create a realized transaction deducting from bank
    const tx: Transaction = {
      id: `tx_${Date.now()}`,
      date: todayStr,
      expectedDate: todayStr,
      realDate: todayStr,
      concept: `Abono a capital: ${loan.name}`,
      notes,
      type: 'cuota_prestamo',
      amount,
      paymentMethodType: 'banco',
      accountId,
      loanId,
      status: 'realizado',
      origin: `abono_prestamo:${loanId}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await storage.put('loanPayments', newPayment);
    await storage.put('loans', updatedLoan);
    await storage.put('transactions', tx);

    setLoanPayments((prev) => [newPayment, ...prev]);
    setLoans((prev) => prev.map((l) => (l.id === loanId ? updatedLoan : l)));
    setTransactions((prev) => [tx, ...prev]);
  };

  const saveSubscription = async (
    subData: Partial<Subscription> & { concept: string; amount: number }
  ) => {
    const now = new Date().toISOString();
    const id = subData.id || `sub_${Date.now()}`;
    const newSub: Subscription = {
      id,
      concept: subData.concept,
      amount: subData.amount,
      billingDay: subData.billingDay || 15,
      frequency: subData.frequency || 'mensual',
      paymentMethodType: subData.paymentMethodType || 'tarjeta_credito',
      accountId: subData.accountId,
      creditCardId: subData.creditCardId,
      categoryId: subData.categoryId || 'cat_suscripciones',
      status: subData.status || 'activa',
      monthlyExceptions: subData.monthlyExceptions || {},
      notes: subData.notes,
      createdAt: subData.createdAt || now,
      updatedAt: now,
    };
    await storage.put('subscriptions', newSub);
    setSubscriptions((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newSub;
        return copy;
      }
      return [...prev, newSub];
    });
  };

  const deleteSubscription = async (id: string) => {
    await storage.delete('subscriptions', id);
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
  };

  const toggleSubscriptionMonthlyPause = async (subId: string, monthKey: string) => {
    const sub = subscriptions.find((s) => s.id === subId);
    if (!sub) return;

    const currentEx = sub.monthlyExceptions?.[monthKey];
    const isPaused = !currentEx?.paused;

    const updatedSub: Subscription = {
      ...sub,
      monthlyExceptions: {
        ...sub.monthlyExceptions,
        [monthKey]: {
          ...currentEx,
          paused: isPaused,
          overrideAmount: isPaused ? 0 : sub.amount,
        },
      },
      updatedAt: new Date().toISOString(),
    };

    await storage.put('subscriptions', updatedSub);
    setSubscriptions((prev) => prev.map((s) => (s.id === subId ? updatedSub : s)));
  };

  const saveService = async (
    srvData: Partial<ServiceItem> & { company: string; serviceName: string }
  ) => {
    const now = new Date().toISOString();
    const id = srvData.id || `srv_${Date.now()}`;
    const newSrv: ServiceItem = {
      id,
      company: srvData.company,
      serviceName: srvData.serviceName,
      budgetedAmount: srvData.budgetedAmount || 3000,
      estimatedDay: srvData.estimatedDay || 20,
      paymentMethodType: srvData.paymentMethodType || 'banco',
      accountId: srvData.accountId,
      creditCardId: srvData.creditCardId,
      categoryId: srvData.categoryId || 'cat_servicios',
      monthlyRecords: srvData.monthlyRecords || {},
      notes: srvData.notes,
      createdAt: srvData.createdAt || now,
      updatedAt: now,
    };
    await storage.put('services', newSrv);
    setServices((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newSrv;
        return copy;
      }
      return [...prev, newSrv];
    });
  };

  const deleteService = async (id: string) => {
    await storage.delete('services', id);
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const updateServiceMonthlyRecord = async (
    serviceId: string,
    monthKey: string,
    data: { actualAmount?: number; status?: 'pendiente' | 'pagado'; paidDate?: string }
  ) => {
    const srv = services.find((s) => s.id === serviceId);
    if (!srv) return;

    const existingRecord = srv.monthlyRecords?.[monthKey] || {
      budgetedAmount: srv.budgetedAmount,
      status: 'pendiente',
    };

    const updatedRecord = {
      ...existingRecord,
      ...data,
    };

    const updatedSrv: ServiceItem = {
      ...srv,
      monthlyRecords: {
        ...srv.monthlyRecords,
        [monthKey]: updatedRecord,
      },
      updatedAt: new Date().toISOString(),
    };

    await storage.put('services', updatedSrv);
    setServices((prev) => prev.map((s) => (s.id === serviceId ? updatedSrv : s)));
  };

  const updateInitialPosition = async (pos: InitialPosition) => {
    const updated: InitialPosition = {
      ...pos,
      updatedAt: new Date().toISOString(),
    };
    await storage.put('initialPosition', updated);
    setInitialPosition(updated);
  };

  const closeCurrentMonth = async (notes?: string) => {
    const monthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    const closeItem: MonthlyClose = {
      id: monthKey,
      year: selectedYear,
      month: selectedMonth,
      isClosed: true,
      closedAt: new Date().toISOString(),
      plannedIncome: executiveSummary.totalPlannedIncome,
      realIncome: executiveSummary.totalRealizedIncome,
      plannedExpense: executiveSummary.totalPlannedExpense,
      realExpense: executiveSummary.totalRealizedExpense,
      plannedSavings: executiveSummary.netPlannedSavings,
      realSavings: executiveSummary.netRealSavings,
      variation: executiveSummary.netRealSavings - executiveSummary.netPlannedSavings,
      initialDebt: executiveSummary.totalDebt,
      finalDebt: executiveSummary.totalDebt,
      initialBalance: executiveSummary.currentRealCashBalance,
      finalBalance: executiveSummary.currentRealCashBalance,
      notes,
    };

    await storage.put('monthlyCloses', closeItem);
    setMonthlyCloses((prev) => {
      const idx = prev.findIndex((c) => c.id === monthKey);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = closeItem;
        return copy;
      }
      return [...prev, closeItem];
    });
  };

  const reopenMonth = async (year: number, month: number) => {
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    await storage.delete('monthlyCloses', monthKey);
    setMonthlyCloses((prev) => prev.filter((c) => c.id !== monthKey));
  };

  // Grocery (Súper) Module Actions
  const saveGroceryItem = async (
    itemData: Partial<GroceryItem> & { name: string; quantity: number }
  ) => {
    const id = itemData.id || `grocery_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`;
    const now = new Date().toISOString();
    const existing = groceryItems.find((g) => g.id === id);

    const item: GroceryItem = {
      id,
      year: itemData.year ?? selectedYear,
      month: itemData.month ?? selectedMonth,
      name: itemData.name.trim(),
      category: itemData.category || 'Granos y Despensa',
      unit: itemData.unit || 'unid',
      quantity: Math.max(0.01, itemData.quantity),
      projectedPrice: Math.max(0, itemData.projectedPrice ?? existing?.projectedPrice ?? 0),
      realPrice: Math.max(0, itemData.realPrice ?? existing?.realPrice ?? 0),
      isPurchased: itemData.isPurchased ?? existing?.isPurchased ?? false,
      notes: itemData.notes ?? existing?.notes,
      supermarket: itemData.supermarket ?? existing?.supermarket,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    await storage.put('groceryItems', item);
    setGroceryItems((prev) => {
      const idx = prev.findIndex((g) => g.id === id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = item;
        return copy;
      }
      return [...prev, item];
    });
  };

  const deleteGroceryItem = async (id: string) => {
    await storage.delete('groceryItems', id);
    setGroceryItems((prev) => prev.filter((g) => g.id !== id));
  };

  const toggleGroceryItemPurchased = async (id: string) => {
    const target = groceryItems.find((g) => g.id === id);
    if (!target) return;
    const updated: GroceryItem = {
      ...target,
      isPurchased: !target.isPurchased,
      updatedAt: new Date().toISOString(),
    };
    await storage.put('groceryItems', updated);
    setGroceryItems((prev) => prev.map((g) => (g.id === id ? updated : g)));
  };

  const copyGroceryListToMonth = async (
    fromYear: number,
    fromMonth: number,
    toYear: number,
    toMonth: number
  ): Promise<{ copiedCount: number }> => {
    const source = groceryItems.filter((g) => g.year === fromYear && g.month === fromMonth);
    if (source.length === 0) return { copiedCount: 0 };

    const newItems: GroceryItem[] = source.map((g) => {
      // The real price paid in the source month becomes the projected price for the new month!
      const effectiveProjected = g.realPrice > 0 ? g.realPrice : g.projectedPrice;
      return {
        id: `grocery_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
        year: toYear,
        month: toMonth,
        name: g.name,
        category: g.category,
        unit: g.unit,
        quantity: g.quantity,
        projectedPrice: effectiveProjected,
        realPrice: 0,
        isPurchased: false,
        notes: g.notes,
        supermarket: g.supermarket,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    await storage.putBatch('groceryItems', newItems);
    setGroceryItems((prev) => [...prev, ...newItems]);
    return { copiedCount: newItems.length };
  };

  const clearGroceryMonth = async (year: number, month: number) => {
    const itemsToRemove = groceryItems.filter((g) => g.year === year && g.month === month);
    for (const item of itemsToRemove) {
      await storage.delete('groceryItems', item.id);
    }
    setGroceryItems((prev) => prev.filter((g) => !(g.year === year && g.month === month)));
  };

  // Plan Notes Module (Scratchpad / Notas de planes & futuros gastos sin impacto financiero)
  const savePlanNote = async (noteData: Partial<PlanNote> & { title: string }) => {
    const id = noteData.id || `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const existing = planNotes.find((n) => n.id === id);

    const note: PlanNote = {
      id,
      title: noteData.title.trim(),
      description: noteData.description?.trim() || '',
      category: noteData.category || 'general',
      priority: noteData.priority || 'media',
      targetDate: noteData.targetDate?.trim() || undefined,
      estimatedAmount:
        noteData.estimatedAmount !== undefined ? Math.max(0, Math.round(noteData.estimatedAmount)) : undefined,
      url: noteData.url?.trim() || undefined,
      isCompleted: noteData.isCompleted ?? existing?.isCompleted ?? false,
      color: noteData.color || existing?.color || undefined,
      tags: noteData.tags || existing?.tags || [],
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    await storage.put('planNotes', note);
    setPlanNotes((prev) => {
      const idx = prev.findIndex((n) => n.id === id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = note;
        return copy;
      }
      return [note, ...prev];
    });
  };

  const deletePlanNote = async (id: string) => {
    await storage.delete('planNotes', id);
    setPlanNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const togglePlanNoteCompleted = async (id: string) => {
    const target = planNotes.find((n) => n.id === id);
    if (!target) return;
    const updated: PlanNote = {
      ...target,
      isCompleted: !target.isCompleted,
      updatedAt: new Date().toISOString(),
    };
    await storage.put('planNotes', updated);
    setPlanNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
  };

  // Quick Templates Actions (Gastos Frecuentes / Registro Rápido)
  const saveQuickTemplate = async (
    templateData: Partial<QuickTemplate> & { name: string; amount: number; categoryId: string }
  ) => {
    const id = templateData.id || `tmpl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const template: QuickTemplate = {
      id,
      name: templateData.name.trim(),
      type: templateData.type || 'gasto',
      amount: Math.round(templateData.amount),
      categoryId: templateData.categoryId,
      paymentMethod: templateData.paymentMethod || 'efectivo',
      accountId: templateData.accountId,
      creditCardId: templateData.creditCardId,
      notes: templateData.notes?.trim() || undefined,
      icon: templateData.icon || 'Zap',
      color: templateData.color || '#3b82f6',
      usageCount: templateData.usageCount || 0,
    };

    await storage.put('quickTemplates', template);
    setQuickTemplates((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = template;
        return copy;
      }
      return [template, ...prev];
    });
  };

  const deleteQuickTemplate = async (id: string) => {
    await storage.delete('quickTemplates', id);
    setQuickTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const executeQuickTemplate = async (templateId: string, customAmount?: number): Promise<Transaction> => {
    const template = quickTemplates.find((t) => t.id === templateId);
    if (!template) throw new Error('Plantilla rápida no encontrada');

    const effectiveAmount = customAmount !== undefined ? Math.round(customAmount) : template.amount;

    // Pick payment target
    let effectiveAccountId = template.accountId;
    let effectiveCardId = template.creditCardId;

    if (template.paymentMethod === 'banco' && !effectiveAccountId) {
      effectiveAccountId = accounts.find((a) => a.type === 'banco')?.id || accounts[0]?.id;
    } else if (template.paymentMethod === 'efectivo' && !effectiveAccountId) {
      effectiveAccountId = accounts.find((a) => a.type === 'efectivo')?.id || accounts[0]?.id;
    } else if (template.paymentMethod === 'tarjeta_credito' && !effectiveCardId) {
      effectiveCardId = creditCards[0]?.id;
    }

    const newTx: Transaction = {
      id: `tx_quick_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: todayStr,
      concept: template.name,
      notes: template.notes ? `${template.notes} (Registro rápido)` : 'Registro rápido con plantilla',
      type: template.type,
      amount: effectiveAmount,
      categoryId: template.categoryId,
      paymentMethodType: template.paymentMethod,
      accountId: effectiveAccountId,
      creditCardId: effectiveCardId,
      status: 'realizado',
      origin: `quick_template:${template.id}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Increment usage counter
    const updatedTemplate: QuickTemplate = {
      ...template,
      usageCount: (template.usageCount || 0) + 1,
    };

    await storage.put('transactions', newTx);
    await storage.put('quickTemplates', updatedTemplate);

    setTransactions((prev) => [newTx, ...prev]);
    setQuickTemplates((prev) => prev.map((t) => (t.id === templateId ? updatedTemplate : t)));

    return newTx;
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    await storage.put('appSettings', updated);
    setSettings(updated);
  };

  const loadDemoData = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nexa_clean_slate');
    }
    await storage.clearAll();
    const demo = generateDemoSeedData();
    await storage.putBatch('categories', demo.categories);
    await storage.putBatch('accounts', demo.accounts);
    await storage.putBatch('creditCards', demo.creditCards);
    await storage.putBatch('budgets', demo.budgets);
    if (demo.itemBudgets?.length) await storage.putBatch('itemBudgets', demo.itemBudgets);
    await storage.putBatch('installmentPurchases', demo.installmentPurchases);
    await storage.putBatch('loans', demo.loans);
    await storage.putBatch('subscriptions', demo.subscriptions);
    await storage.putBatch('services', demo.services);
    await storage.put('initialPosition', demo.initialPosition);
    await storage.putBatch('transactions', demo.transactions);
    await storage.put('appSettings', getDefaultAppSettings());

    setCategories(demo.categories);
    setAccounts(demo.accounts);
    setCreditCards(demo.creditCards);
    setBudgets(demo.budgets);
    setItemBudgets(demo.itemBudgets || []);
    setGroceryItems([]);
    setInstallmentPurchases(demo.installmentPurchases);
    setLoans(demo.loans);
    setSubscriptions(demo.subscriptions);
    setServices(demo.services);
    setInitialPosition(demo.initialPosition);
    setTransactions(demo.transactions);
    setSettings(getDefaultAppSettings());
    setSelectedYear(2026);
    setSelectedMonth(9);
  };

  const clearAllData = async () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexa_clean_slate', 'true');
    }
    await storage.clearAll();
    const defaultCats = getDefaultCategories();
    const defaultStgs = getDefaultAppSettings();
    await storage.putBatch('categories', defaultCats);
    await storage.put('appSettings', defaultStgs);

    const emptyPos: InitialPosition = {
      id: 'pos_inicial_principal',
      startDate: todayStr,
      cashBalance: 0,
      bankBalances: {},
      cardBalances: {},
      loanBalances: {},
      initialized: true,
      updatedAt: new Date().toISOString(),
    };
    await storage.put('initialPosition', emptyPos);

    setAccounts([]);
    setCreditCards([]);
    setTransactions([]);
    setCategories(defaultCats);
    setBudgets([]);
    setItemBudgets([]);
    setGroceryItems([]);
    setInstallmentPurchases([]);
    setLoans([]);
    setLoanPayments([]);
    setSubscriptions([]);
    setServices([]);
    setInitialPosition(emptyPos);
    setMonthlyCloses([]);
    setSettings(defaultStgs);
  };

  const startFromScratch = clearAllData;

  const exportBackup = async (): Promise<NexaFullBackup> => {
    return storage.exportFullBackup();
  };

  const importBackup = async (backup: NexaFullBackup): Promise<boolean> => {
    const success = await storage.importFullBackup(backup);
    if (success) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('nexa_clean_slate');
      }
      await loadAllData();
    }
    return success;
  };

  const exportBackupJSON = async (): Promise<void> => {
    const backup = await storage.exportFullBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexa-finance-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importBackupJSON = async (jsonStr: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(jsonStr) as NexaFullBackup;
      const ok = await storage.importFullBackup(parsed);
      if (ok) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('nexa_clean_slate');
        }
        await loadAllData();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error al importar archivo de respaldo JSON:', err);
      return false;
    }
  };

  const exportTransactionsCSV = async (): Promise<void> => {
    const txs = await storage.getAll<Transaction>('transactions');
    const cats = await storage.getAll<Category>('categories');
    const catMap = new Map(cats.map((c) => [c.id, c.name]));

    const headers = [
      'ID',
      'Fecha',
      'Concepto',
      'Tipo',
      'Categoría',
      'Monto',
      'Estado',
      'Medio de Pago',
      'Notas',
    ];
    const rows = txs.map((tx) => [
      tx.id,
      tx.date,
      `"${(tx.concept || '').replace(/"/g, '""')}"`,
      tx.type,
      `"${catMap.get(tx.categoryId || '') || ''}"`,
      (tx.amount / 100).toFixed(2),
      tx.status,
      tx.paymentMethodType,
      `"${(tx.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexa-movimientos-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <FinanceContext.Provider
      value={{
        selectedYear,
        selectedMonth,
        setSelectedYear,
        setSelectedMonth,
        setSelectedPeriod,
        todayStr,
        activeTab,
        setActiveTab,
        isNewTxOpen,
        setIsNewTxOpen,
        editingTransaction,
        setEditingTransaction,
        isAffordabilityOpen,
        setIsAffordabilityOpen,
        isRenderGuideOpen,
        setIsRenderGuideOpen,
        accounts,
        creditCards,
        transactions,
        categories,
        budgets,
        itemBudgets,
        groceryItems,
        planNotes,
        quickTemplates,
        installmentPurchases,
        loans,
        loanPayments,
        subscriptions,
        services,
        initialPosition,
        monthlyCloses,
        settings,
        isLoading,
        dailyCashFlow,
        budgetAnalysis,
        detailedBudget,
        executiveSummary,
        allMonthTransactions,
        annualProjection,
        saveTransaction,
        deleteTransaction,
        duplicateTransaction,
        toggleTransactionStatus,
        saveAccount,
        deleteAccount,
        saveCreditCard,
        deleteCreditCard,
        saveCategory,
        deleteCategory,
        saveBudget,
        deleteBudget,
        saveItemBudget,
        deleteItemBudget,
        saveGroceryItem,
        deleteGroceryItem,
        toggleGroceryItemPurchased,
        copyGroceryListToMonth,
        clearGroceryMonth,
        savePlanNote,
        deletePlanNote,
        togglePlanNoteCompleted,
        saveQuickTemplate,
        deleteQuickTemplate,
        executeQuickTemplate,
        saveInstallmentPurchase,
        deleteInstallmentPurchase,
        saveLoan,
        deleteLoan,
        registerLoanExtraPayment,
        saveSubscription,
        deleteSubscription,
        toggleSubscriptionMonthlyPause,
        saveService,
        deleteService,
        updateServiceMonthlyRecord,
        updateInitialPosition,
        closeCurrentMonth,
        reopenMonth,
        updateSettings,
        loadDemoData,
        clearAllData,
        startFromScratch,
        exportBackup,
        importBackup,
        exportBackupJSON,
        importBackupJSON,
        exportTransactionsCSV,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance debe usarse dentro de un FinanceProvider');
  }
  return context;
};
