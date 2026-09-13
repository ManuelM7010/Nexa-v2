export type AccountType = 'efectivo' | 'banco';
export type PaymentMethodType = 'efectivo' | 'banco' | 'tarjeta_credito';
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
  | 'movimiento_planificado';

export type TransactionStatus = 'planificado' | 'realizado' | 'cancelado';
export type FrequencyType = 'diario' | 'semanal' | 'quincenal' | 'mensual' | 'anual';

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
}

export interface DailyCashFlowItem {
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  startingBalance: number; // cents
  realizedIncome: number;
  projectedIncome: number;
  realizedExpense: number;
  projectedExpense: number;
  obligations: number;
  endDayRealBalance: number;
  endDayProjectedBalance: number;
  variation: number; // Real - Proyectado
  events: Transaction[];
  hasRisk: boolean;
  isNegative: boolean;
  isToday: boolean;
}

export interface AlertItem {
  id: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  date?: string;
  actionUrl?: string;
}
