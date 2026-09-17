export type AccountType = 'efectivo' | 'banco';
export type PaymentMethodType = 'efectivo' | 'banco' | 'tarjeta_credito' | 'ahorros';
export type TransactionType =
  | 'ingreso'
  | 'gasto'
  | 'transferencia'
  | 'pago_tarjeta'
  | 'cuota_tarjeta'
  | 'cuota_prestamo'
  | 'suscripcion'
  | 'servicio'
  | 'ajuste'
  | 'movimiento_planificado'
  | 'aporte_ahorro'
  | 'retiro_ahorro'
  | 'gasto_desde_ahorro';

export type TransactionStatus = 'planificado' | 'realizado' | 'cancelado';
export type FrequencyType = 'diario' | 'semanal' | 'quincenal' | 'mensual' | 'anual';

export type SavingsCategory =
  | 'emergencia'
  | 'meta'
  | 'inversion'
  | 'viaje'
  | 'vehiculo'
  | 'hogar'
  | 'retiro'
  | 'educacion'
  | 'general';

export interface SavingsAccount {
  id: string;
  name: string;
  targetAmount: number; // in cents (optional, 0 if no target)
  initialBalance: number; // in cents
  currentBalance: number; // in cents
  color: string;
  icon: string;
  category: SavingsCategory;
  targetDate?: string; // YYYY-MM-DD
  notes?: string;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  bankName?: string;
  initialBalance: number; // in cents
  initialDate: string; // YYYY-MM-DD (e.g. 2026-09-12)
  isActive: boolean;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreditCard {
  id: string;
  name: string;
  bank: string;
  limit: number; // in cents
  initialUsedBalance: number; // in cents at start date
  cutOffDay: number; // 1-31
  paymentDueDay: number; // 1-31
  usualPaymentDay?: number; // 1-31
  color?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'ingreso' | 'gasto';
  icon: string;
  color: string;
  subcategories: string[];
}

export interface Budget {
  id: string;
  year: number;
  month: number; // 1-12
  categoryId: string;
  subcategoryId?: string;
  budgetedAmount: number; // in cents
  notes?: string;
}

export interface ItemBudget {
  id: string;
  year: number;
  month: number; // 1-12
  name: string; // Specific item or concept, e.g. "Supermercado", "Renta", "Salario Principal"
  type: 'gasto' | 'ingreso';
  categoryId: string;
  budgetedAmount: number; // in cents
  projectedAmount?: number; // in cents (optional custom override)
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DetailedBudgetItem {
  id: string;
  name: string;
  type: 'gasto' | 'ingreso';
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  budgetedAmount: number; // in cents
  projectedAmount: number; // in cents (real + planned pending)
  realAmount: number; // in cents (executed transactions)
  plannedPendingAmount: number; // in cents (planned pending)
  variation: number; // in cents (for expense: budget - real; for income: real - budget)
  variationPct: number; // %
  executionPct: number; // %
  status: 'favorable' | 'en_meta' | 'alerta' | 'sobregiro' | 'sin_presupuesto';
  transactions: Transaction[];
  isCustom: boolean;
  itemBudgetId?: string;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  expectedDate?: string; // YYYY-MM-DD
  realDate?: string; // YYYY-MM-DD
  concept: string;
  notes?: string;
  type: TransactionType;
  categoryId?: string;
  subcategoryId?: string;
  amount: number; // in cents
  paymentMethodType: PaymentMethodType;
  accountId?: string; // For cash/bank
  creditCardId?: string; // For credit cards
  transferToAccountId?: string; // For transfers
  savingsAccountId?: string; // For savings deposits, withdrawals, or direct expenses from savings
  status: TransactionStatus;
  origin?: string; // e.g. 'manual', 'suscripcion:xyz', 'prestamo:abc', 'cuota:123'
  recurrenceId?: string;
  obligationId?: string;
  installmentPurchaseId?: string;
  loanId?: string;
  budgetId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InstallmentPurchase {
  id: string;
  concept: string;
  purchaseDate: string; // YYYY-MM-DD
  totalAmount: number; // in cents
  creditCardId: string;
  totalInstallments: number;
  installmentAmount: number; // in cents
  firstPaymentDate: string; // YYYY-MM-DD
  frequency: FrequencyType;
  paidInstallmentsCount: number; // e.g. 4
  remainingInstallmentsCount: number; // e.g. 8
  pendingBalance: number; // in cents (e.g. 40000)
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Loan {
  id: string;
  name: string;
  lender: string;
  originalAmount: number; // in cents
  remainingBalance: number; // in cents
  installmentAmount: number; // in cents
  frequency: FrequencyType;
  paymentDay: number; // Day of month
  remainingInstallmentsCount: number;
  paymentsMadeCount: number;
  nextPaymentDate: string; // YYYY-MM-DD
  startDate?: string; // YYYY-MM-DD
  totalInstallments?: number;
  preferredAccountId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoanExtraPayment {
  id: string;
  loanId: string;
  date: string;
  amount: number; // in cents
  accountId: string;
  notes?: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  concept: string;
  amount: number; // in cents
  billingDay: number; // 1-31
  frequency: FrequencyType;
  paymentMethodType: PaymentMethodType;
  accountId?: string;
  creditCardId?: string;
  categoryId: string;
  status: 'activa' | 'pausada' | 'cancelada';
  monthlyExceptions: Record<string, { paused?: boolean; overrideAmount?: number }>; // key: YYYY-MM
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceItem {
  id: string;
  company: string;
  serviceName: string;
  budgetedAmount: number; // in cents
  actualAmount?: number; // in cents
  estimatedDay: number; // 1-31
  realDay?: number;
  paymentMethodType: PaymentMethodType;
  accountId?: string;
  creditCardId?: string;
  categoryId: string;
  monthlyRecords: Record<
    string,
    {
      budgetedAmount: number;
      actualAmount?: number;
      paidDate?: string;
      status: 'pendiente' | 'pagado';
    }
  >; // key: YYYY-MM
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InitialPosition {
  id: string;
  startDate: string; // YYYY-MM-DD (e.g. 2026-09-12)
  cashBalance: number; // in cents
  bankBalances: Record<string, number>; // accountId -> cents
  cardBalances: Record<string, number>; // cardId -> used cents
  loanBalances: Record<string, number>; // loanId -> pending cents
  initialized: boolean;
  updatedAt: string;
}

export interface MonthlyClose {
  id: string; // key: YYYY-MM
  year: number;
  month: number;
  isClosed: boolean;
  closedAt?: string;
  plannedIncome: number;
  realIncome: number;
  plannedExpense: number;
  realExpense: number;
  plannedSavings: number;
  realSavings: number;
  variation: number;
  initialDebt: number;
  finalDebt: number;
  initialBalance: number;
  finalBalance: number;
  notes?: string;
}

export interface GroceryItem {
  id: string;
  year: number;
  month: number;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  projectedPrice: number; // in cents (precio unitario estimado)
  realPrice: number; // in cents (precio unitario real pagado)
  isPurchased: boolean;
  notes?: string;
  supermarket?: string;
  createdAt: string;
  updatedAt: string;
}

export type PlanNoteCategory = 'futuro_gasto' | 'compra_deseada' | 'plan_meta' | 'recordatorio' | 'general';
export type PlanNotePriority = 'baja' | 'media' | 'alta';

export interface PlanNote {
  id: string;
  title: string;
  description?: string;
  category: PlanNoteCategory;
  priority: PlanNotePriority;
  targetDate?: string; // Optional target date YYYY-MM-DD or timeframe (e.g. "Q4 2026", "Noviembre")
  estimatedAmount?: number; // in cents (purely informative, NOT in financial totals)
  url?: string;
  isCompleted: boolean;
  color?: string; // Hex or color tag
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface QuickTemplate {
  id: string;
  name: string;
  type: 'gasto' | 'ingreso';
  amount: number; // in cents
  categoryId: string;
  paymentMethod: PaymentMethodType;
  accountId?: string;
  creditCardId?: string;
  notes?: string;
  icon?: string;
  color?: string;
  usageCount?: number;
}

export interface AppSettings {
  id: string;
  currency: string;
  currencySymbol: string;
  currencyCode?: string;
  dateFormat: 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY';
  firstDayOfWeek: 0 | 1; // 0: Domingo, 1: Lunes
  encryptionEnabled: boolean;
  budgetAlertThreshold: number; // default 80%
  theme: 'fintech-dark' | 'fintech-light';
  liquidityStartDate: string; // YYYY-MM-DD (e.g. '2026-09-15')
}

export interface DailyCashFlowItem {
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  dayName?: string;
  dayNameShort?: string;
  startingBalance: number; // cents
  initialBalance?: number;
  realizedIncome: number;
  realIncome?: number;
  projectedIncome: number;
  plannedIncome?: number;
  totalIncome?: number;
  realizedExpense: number;
  realExpense?: number;
  projectedExpense: number;
  plannedExpense?: number;
  totalExpense?: number;
  obligations: number;
  endDayRealBalance: number;
  endDayProjectedBalance: number;
  finalBalance?: number;
  variation: number; // Real - Proyectado
  events: Transaction[];
  movements: Transaction[];
  status: 'healthy' | 'positive' | 'low' | 'negative';
  hasRisk: boolean;
  isNegative: boolean;
  isToday: boolean;
  isPast?: boolean;
}

export interface AlertItem {
  id: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  severity?: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  date?: string;
  actionUrl?: string;
}

export interface CreditCardStatement {
  cardId: string;
  cardName: string;
  bank: string;
  cycleKey: string; // e.g. "2026-09"
  cycleLabel: string; // e.g. "Corte 20 Sep 2026"
  cycleStartDate: string; // YYYY-MM-DD
  cycleEndDate: string; // YYYY-MM-DD
  cutOffDay: number;
  paymentDueDate: string; // YYYY-MM-DD
  limit: number; // in cents
  totalPurchases: number; // in cents (charges during this cycle)
  totalPayments: number; // in cents (payments during this cycle)
  previousCycleBalance: number; // in cents
  totalDueAtCutOff: number; // in cents (Total TDDC / Saldo al corte)
  availableCredit: number; // in cents (limit - totalDueAtCutOff)
  minimumPayment: number; // in cents (suggested min payment)
  cashPaymentNoInterest: number; // in cents (100% of balance to avoid interest)
  transactions: Transaction[]; // Itemized expenses and charges of this cycle
  isCurrentCycle: boolean;
  status: 'en_curso' | 'cortado' | 'pagado';
}
