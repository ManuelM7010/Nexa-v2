import {
  Account,
  CreditCard,
  CreditCardStatement,
  Transaction,
  Category,
  Budget,
  ItemBudget,
  DetailedBudgetItem,
  InstallmentPurchase,
  Loan,
  Subscription,
  ServiceItem,
  InitialPosition,
  DailyCashFlowItem,
  AlertItem,
} from '../types';
import { daysInMonth, MONTH_NAMES_ES, addDays } from '../utils/formatters';

export interface BudgetAnalysisItem {
  categoryId: string;
  categoryName: string;
  categoryType: 'gasto' | 'ingreso';
  categoryColor: string;
  categoryIcon: string;
  category: Category;
  budgetedAmount: number; // cents
  realAmount: number; // cents
  realSpent: number; // cents alias
  plannedPendingAmount: number; // cents
  plannedPendingSpent: number; // cents alias
  projectedTotalAmount: number; // cents
  totalProjected: number; // cents alias
  variation: number; // real vs budgeted (or projected vs budgeted)
  percentUsed: number;
  executionPercentage: number; // alias
  availableAmount: number; // budgeted - real
  availableBalance: number; // alias
  status: 'ahorro' | 'en_presupuesto' | 'alerta' | 'sobregiro' | 'normal' | 'warning' | 'exceeded';
  transactions: Transaction[];
}

export interface ExecutiveSummary {
  currentRealCashBalance: number; // Cash + Banks actual
  bankBalance: number;
  cashBalance: number;
  projectedEndPeriodBalance: number;
  projectedEndBalance: number;
  lowestProjectedBalance: number;
  totalRealizedIncome: number;
  totalPlannedIncome: number;
  totalRealizedExpense: number;
  totalPlannedExpense: number;
  netRealSavings: number; // Realized Income - Realized Expense
  netPlannedSavings: number; // Planned Income - Planned Expense
  upcomingObligationsCommitted: number; // next 15-30 days
  totalDebt: number; // Cards used balance + Loans pending balance
  creditCardDebt: number;
  loanDebt: number;
  freeAvailableCash: number; // Current real cash - upcoming obligations committed
  freeCashAfterObligations: number;
  todayIncome: number;
  todayExpense: number;
  todayObligations: number;
  todayTransactions: Transaction[];
  thisWeekObligations: Transaction[];
  alerts: AlertItem[];
  criticalAlerts: AlertItem[];
}

export interface MonthProjection {
  year: number;
  month: number;
  monthKey: string;
  monthName: string;
  openingBalance: number; // in cents
  projectedIncome: number; // in cents
  projectedExpense: number; // in cents
  fixedObligations: number; // loans + subs + services + installment purchases
  discretionaryBudget: number; // item budgets / categories
  closingBalance: number; // opening + income - expense
  netSavings: number; // income - expense
  savingsRate: number; // percentage
  status: 'saludable' | 'ajustado' | 'deficit';
  loansDueCount: number;
}

/**
 * Main Financial Engine
 * Centralized, authoritative calculation for NEXA Finance
 */
export class NexaFinancialEngine {
  /**
   * Generates all dynamic future financial transactions based on:
   * - Subscriptions
   * - Services
   * - Installment Purchases
   * - Loan Installments
   * Merges them with explicit Transactions without duplicating.
   */
  static generateProjectedEvents(
    year: number,
    month: number,
    data: {
      subscriptions: Subscription[];
      services: ServiceItem[];
      installmentPurchases: InstallmentPurchase[];
      loans: Loan[];
      creditCards: CreditCard[];
      accounts: Account[];
      existingTransactions: Transaction[];
    }
  ): Transaction[] {
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const generated: Transaction[] = [];
    const daysCount = daysInMonth(year, month);

    // 1. Subscriptions
    for (const sub of data.subscriptions) {
      if (sub.status === 'cancelada') continue;

      const exception = sub.monthlyExceptions?.[monthKey];
      if (exception?.paused) continue;

      const subAmount = exception?.overrideAmount !== undefined ? exception.overrideAmount : sub.amount;
      if (subAmount <= 0) continue;

      const billingDay = Math.min(sub.billingDay, daysCount);
      const dateStr = `${monthKey}-${String(billingDay).padStart(2, '0')}`;

      // Check if user already registered an explicit/realized transaction for this
      const hasDuplicate = data.existingTransactions.some(
        (t) => t.date.startsWith(monthKey) && t.origin === `suscripcion:${sub.id}`
      );

      if (!hasDuplicate) {
        generated.push({
          id: `gen_sub_${sub.id}_${monthKey}`,
          date: dateStr,
          expectedDate: dateStr,
          concept: `Suscripción: ${sub.concept}`,
          type: 'suscripcion',
          categoryId: sub.categoryId,
          amount: subAmount,
          paymentMethodType: sub.paymentMethodType,
          accountId: sub.accountId,
          creditCardId: sub.creditCardId,
          status: 'planificado',
          origin: `suscripcion:${sub.id}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // 2. Services / Utilities
    for (const srv of data.services) {
      const record = srv.monthlyRecords?.[monthKey];
      const srvAmount = record?.budgetedAmount !== undefined ? record.budgetedAmount : srv.budgetedAmount;
      const actualAmount = record?.actualAmount;
      const isPaid = record?.status === 'pagado';

      const estimatedDay = Math.min(srv.estimatedDay, daysCount);
      const dateStr = record?.paidDate || `${monthKey}-${String(estimatedDay).padStart(2, '0')}`;

      const hasDuplicate = data.existingTransactions.some(
        (t) => t.date.startsWith(monthKey) && t.origin === `servicio:${srv.id}`
      );

      if (!hasDuplicate) {
        generated.push({
          id: `gen_srv_${srv.id}_${monthKey}`,
          date: dateStr,
          expectedDate: `${monthKey}-${String(estimatedDay).padStart(2, '0')}`,
          realDate: isPaid ? dateStr : undefined,
          concept: `Servicio: ${srv.company} - ${srv.serviceName}`,
          type: 'servicio',
          categoryId: srv.categoryId,
          amount: actualAmount || srvAmount,
          paymentMethodType: srv.paymentMethodType,
          accountId: srv.accountId,
          creditCardId: srv.creditCardId,
          status: isPaid ? 'realizado' : 'planificado',
          origin: `servicio:${srv.id}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // 3. Loans
    for (const loan of data.loans) {
      if (loan.remainingBalance <= 0 || loan.remainingInstallmentsCount <= 0) continue;

      const paymentDay = Math.min(loan.paymentDay, daysCount);
      const dateStr = `${monthKey}-${String(paymentDay).padStart(2, '0')}`;

      const hasDuplicate = data.existingTransactions.some(
        (t) => t.date.startsWith(monthKey) && t.origin === `prestamo:${loan.id}`
      );

      if (!hasDuplicate) {
        generated.push({
          id: `gen_loan_${loan.id}_${monthKey}`,
          date: dateStr,
          expectedDate: dateStr,
          concept: `Cuota Préstamo: ${loan.name} (${loan.lender})`,
          type: 'cuota_prestamo',
          amount: loan.installmentAmount,
          paymentMethodType: 'banco',
          accountId: loan.preferredAccountId || data.accounts[0]?.id,
          status: 'planificado',
          loanId: loan.id,
          origin: `prestamo:${loan.id}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // 4. Credit Card Payment Obligations (from card cut-off/payment dates)
    // Date guard: If monthKey < '2026-09', all credit card payments are 0.00 as requested by the user
    // ("todos lo pagos de tarjteas de agosto hacia a tras será 0.00, porque comenzaré a meter data a partir de mi situacion en Septiembre.")
    if (monthKey >= '2026-09') {
      for (const card of data.creditCards) {
        if (!card.isActive) continue;

        const payDay = Math.min(card.usualPaymentDay || card.paymentDueDay, daysCount);
        const dateStr = `${monthKey}-${String(payDay).padStart(2, '0')}`;

        // Determine cycle closing month & year for payments due in this month (year, month)
        let closingYear = year;
        let closingMonth = month;
        if (card.paymentDueDay <= card.cutOffDay) {
          // Billing cycle ended in the previous month
          closingMonth = month - 1;
          if (closingMonth < 1) {
            closingMonth = 12;
            closingYear = year - 1;
          }
        }
        const { cycleStartDate, cycleEndDate } = NexaFinancialEngine.getBillingCycleDates(card, closingYear, closingMonth);

        let chargesAmount = 0;

        // In the starting month (September 2026), include the initial balance configured by the user
        if (monthKey === '2026-09' && card.initialUsedBalance > 0) {
          chargesAmount += card.initialUsedBalance;
        }

        // Add expenses made on this card within this billing cycle (from day after previous cut-off to current cut-off day)
        const cycleExpenses = data.existingTransactions.filter((tx) => {
          if (tx.status === 'cancelado') return false;
          if (tx.creditCardId !== card.id) return false;
          if (tx.paymentMethodType !== 'tarjeta_credito') return false;
          if (tx.type === 'pago_tarjeta') return false;
          return tx.date >= cycleStartDate && tx.date <= cycleEndDate;
        });

        const cycleExpensesSum = cycleExpenses.reduce((sum, tx) => sum + tx.amount, 0);
        chargesAmount += cycleExpensesSum;

        // Add active installment purchase quotas on this card for this month
        if (data.installmentPurchases) {
          data.installmentPurchases.forEach((ip) => {
            if (ip.creditCardId === card.id && ip.pendingBalance > 0) {
              const alreadyIncluded = cycleExpenses.some((tx) => tx.origin === `cuota:${ip.id}`);
              if (!alreadyIncluded) {
                chargesAmount += ip.installmentAmount;
              }
            }
          });
        }

        // Deduct payments and abonos made to this card for this billing cycle:
        // Includes abonos made during the cycle (e.g., Aug 20 for cycle Aug 13 - Sep 12)
        // as well as explicit payments made up to the payment month
        const monthEndStr = `${monthKey}-${String(daysCount).padStart(2, '0')}`;
        const cyclePayments = data.existingTransactions.filter((tx) => {
          if (tx.status === 'cancelado') return false;
          if (tx.creditCardId !== card.id) return false;
          if (tx.type !== 'pago_tarjeta') return false;
          if (tx.id.startsWith('gen_')) return false; // Only count explicit user payments
          return tx.date >= cycleStartDate && tx.date <= monthEndStr;
        });

        const cyclePaymentsSum = cyclePayments.reduce((sum, tx) => sum + tx.amount, 0);

        // Net remaining payment after taking into account all abonos
        const remainingPayment = Math.max(0, chargesAmount - cyclePaymentsSum);

        if (remainingPayment > 0) {
          generated.push({
            id: `gen_card_pay_${card.id}_${monthKey}`,
            date: dateStr,
            expectedDate: dateStr,
            concept: `Pago Tarjeta: ${card.name} (${card.bank})`,
            type: 'pago_tarjeta',
            amount: remainingPayment,
            paymentMethodType: 'banco',
            accountId: data.accounts.find((a) => a.type === 'banco')?.id || data.accounts[0]?.id,
            creditCardId: card.id,
            status: 'planificado',
            origin: `pago_tarjeta:${card.id}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }

    return generated;
  }

  /**
   * Calculates Daily Cash Flow Day-by-Day for the selected month or date range.
   * Starts from the cumulative initial position.
   */
  static calculateDailyCashFlow(
    year: number,
    month: number,
    todayStr: string,
    initialPos: InitialPosition | null,
    accounts: Account[],
    allTransactions: Transaction[]
  ): DailyCashFlowItem[] {
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const daysInCurrentMonth = daysInMonth(year, month);
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    // 1. Calculate Starting Balance at the beginning of this month:
    // Base cash balance from accounts/initial position
    let cumulativeCash = 0;
    accounts.forEach((acc) => {
      if (acc.isActive) cumulativeCash += acc.initialBalance;
    });

    const monthStartStr = `${monthKey}-01`;

    // Incorporate all transactions prior to the 1st of this month
    allTransactions.forEach((tx) => {
      if (tx.status === 'cancelado') return;
      if (tx.date < monthStartStr) {
        // Transfers between user cash/bank accounts do not alter total cash
        if (tx.type === 'transferencia') return;

        // Card purchases DO NOT alter bank cash! Only pagos de tarjeta from cash/bank do
        if (tx.paymentMethodType === 'tarjeta_credito' && tx.type !== 'pago_tarjeta') {
          return;
        }

        if (tx.type === 'ingreso') {
          cumulativeCash += tx.amount;
        } else {
          // Expenses, subscriptions, utilities, card payments, loan payments paid from cash/bank
          cumulativeCash -= tx.amount;
        }
      }
    });

    const dailyItems: DailyCashFlowItem[] = [];
    let runningProjectedBalance = cumulativeCash;
    let runningRealBalance = cumulativeCash;

    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dayStr = String(d).padStart(2, '0');
      const dateStr = `${monthKey}-${dayStr}`;
      const [y, m, dayNum] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, dayNum);
      const dayOfWeek = dayNames[dateObj.getDay()];

      const dayStartProjected = runningProjectedBalance;

      // Filter events for this day
      const dayTxs = allTransactions.filter((tx) => tx.date === dateStr && tx.status !== 'cancelado');

      let realizedIncome = 0;
      let projectedIncome = 0;
      let realizedExpense = 0;
      let projectedExpense = 0;
      let obligations = 0;

      dayTxs.forEach((tx) => {
        // Card purchases do not deduct cash now; they are deferred obligations
        const isCashOutflow =
          tx.paymentMethodType !== 'tarjeta_credito' || tx.type === 'pago_tarjeta';

        const isObligation =
          tx.type === 'pago_tarjeta' ||
          tx.type === 'cuota_tarjeta' ||
          tx.type === 'cuota_prestamo' ||
          tx.type === 'suscripcion' ||
          tx.type === 'servicio';

        if (tx.type === 'ingreso') {
          if (tx.status === 'realizado') {
            realizedIncome += tx.amount;
          } else {
            projectedIncome += tx.amount;
          }
        } else if (tx.type !== 'transferencia') {
          if (isObligation) {
            obligations += tx.amount;
          }

          if (isCashOutflow) {
            if (tx.status === 'realizado') {
              realizedExpense += tx.amount;
            } else {
              projectedExpense += tx.amount;
            }
          }
        }
      });

      // Total projected inflows & outflows
      const totalDayInflow = realizedIncome + projectedIncome;
      const totalDayOutflow = realizedExpense + projectedExpense;

      runningProjectedBalance += totalDayInflow - totalDayOutflow;

      // If day is past or today, apply realized
      if (dateStr <= todayStr) {
        runningRealBalance += realizedIncome - realizedExpense;
      } else {
        runningRealBalance = runningProjectedBalance;
      }

      const isNegative = runningProjectedBalance < 0;
      const hasRisk = isNegative || runningProjectedBalance < 10000; // less than $100
      const status: 'healthy' | 'positive' | 'low' | 'negative' = isNegative
        ? 'negative'
        : hasRisk
        ? 'low'
        : 'positive';

      dailyItems.push({
        date: dateStr,
        dayOfWeek,
        dayName: dayOfWeek,
        dayNameShort: dayOfWeek.slice(0, 3),
        startingBalance: dayStartProjected,
        initialBalance: dayStartProjected,
        realizedIncome,
        realIncome: realizedIncome,
        projectedIncome,
        plannedIncome: projectedIncome,
        totalIncome: totalDayInflow,
        realizedExpense,
        realExpense: realizedExpense,
        projectedExpense,
        plannedExpense: projectedExpense,
        totalExpense: totalDayOutflow,
        obligations,
        endDayRealBalance: runningRealBalance,
        endDayProjectedBalance: runningProjectedBalance,
        finalBalance: runningProjectedBalance,
        variation: runningRealBalance - runningProjectedBalance,
        events: dayTxs,
        movements: dayTxs,
        status,
        hasRisk,
        isNegative,
        isToday: dateStr === todayStr,
        isPast: dateStr < todayStr,
      });
    }

    return dailyItems;
  }

  /**
   * Generates deep Budget vs Real Analysis for the selected month
   */
  static calculateBudgetAnalysis(
    year: number,
    month: number,
    categories: Category[],
    budgets: Budget[],
    allMonthTransactions: Transaction[]
  ): BudgetAnalysisItem[] {
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const relevantTxs = allMonthTransactions.filter(
      (tx) => tx.date.startsWith(monthKey) && tx.status !== 'cancelado' && tx.type !== 'transferencia'
    );

    const expenseCategories = categories.filter((c) => c.type === 'gasto');

    return expenseCategories.map((cat) => {
      const catBudgets = budgets.filter(
        (b) => b.year === year && b.month === month && b.categoryId === cat.id
      );
      const budgetedAmount = catBudgets.reduce((acc, b) => acc + b.budgetedAmount, 0);

      const catTxs = relevantTxs.filter((tx) => tx.categoryId === cat.id);

      let realAmount = 0;
      let plannedPendingAmount = 0;

      catTxs.forEach((tx) => {
        if (tx.status === 'realizado') {
          realAmount += tx.amount;
        } else if (tx.status === 'planificado') {
          plannedPendingAmount += tx.amount;
        }
      });

      const projectedTotal = realAmount + plannedPendingAmount;
      const variation = budgetedAmount - realAmount; // positive = savings, negative = overrun
      const percentUsed =
        budgetedAmount > 0 ? Math.round((realAmount / budgetedAmount) * 100) : realAmount > 0 ? 100 : 0;

      let status: BudgetAnalysisItem['status'] = 'normal';
      if (budgetedAmount > 0 && realAmount > budgetedAmount) {
        status = 'exceeded';
      } else if (budgetedAmount > 0 && percentUsed >= 80) {
        status = 'warning';
      } else if (realAmount < budgetedAmount && budgetedAmount > 0) {
        status = 'ahorro';
      }

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        categoryType: cat.type,
        categoryColor: cat.color,
        categoryIcon: cat.icon,
        category: cat,
        budgetedAmount,
        realAmount,
        realSpent: realAmount,
        plannedPendingAmount,
        plannedPendingSpent: plannedPendingAmount,
        projectedTotalAmount: projectedTotal,
        totalProjected: projectedTotal,
        variation,
        percentUsed,
        executionPercentage: percentUsed,
        availableAmount: Math.max(0, budgetedAmount - realAmount),
        availableBalance: budgetedAmount - realAmount,
        status,
        transactions: catTxs,
      };
    });
  }

  /**
   * Calculates Itemized / Detailed Budget (Gasto por Gasto e Ingreso por Ingreso)
   */
  static calculateDetailedBudget(
    year: number,
    month: number,
    itemBudgets: ItemBudget[],
    allMonthTransactions: Transaction[],
    categories: Category[],
    subscriptions: Subscription[],
    services: ServiceItem[]
  ): DetailedBudgetItem[] {
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const itemMap = new Map<string, DetailedBudgetItem>();

    const getCat = (catId?: string, fallbackType: 'gasto' | 'ingreso' = 'gasto') => {
      const found = categories.find((c) => c.id === catId);
      if (found) return found;
      return {
        id: 'general',
        name: 'General',
        type: fallbackType,
        color: fallbackType === 'ingreso' ? '#10b981' : '#3b82f6',
        icon: 'Tag',
        subcategories: [],
      };
    };

    // 1. Register explicit user-defined item budgets for this period
    const activeItemBudgets = (itemBudgets || []).filter(
      (ib) => ib.year === year && ib.month === month
    );

    activeItemBudgets.forEach((ib) => {
      const cat = getCat(ib.categoryId, ib.type);
      const key = ib.name.trim().toLowerCase();
      itemMap.set(key, {
        id: ib.id,
        name: ib.name,
        type: ib.type,
        categoryId: cat.id,
        categoryName: cat.name,
        categoryColor: cat.color,
        categoryIcon: cat.icon,
        budgetedAmount: ib.budgetedAmount,
        projectedAmount: ib.projectedAmount || ib.budgetedAmount,
        realAmount: 0,
        plannedPendingAmount: 0,
        variation: 0,
        variationPct: 0,
        executionPct: 0,
        status: 'favorable',
        transactions: [],
        isCustom: true,
        itemBudgetId: ib.id,
      });
    });

    // 2. Include active subscriptions for this month as line items
    (subscriptions || []).forEach((sub) => {
      const isPaused = sub.monthlyExceptions?.[monthKey]?.paused || sub.status === 'cancelada';
      if (isPaused) return;
      const subAmount = sub.monthlyExceptions?.[monthKey]?.overrideAmount ?? sub.amount;
      const key = sub.concept.trim().toLowerCase();

      if (!itemMap.has(key)) {
        const cat = getCat(sub.categoryId, 'gasto');
        itemMap.set(key, {
          id: `sub_${sub.id}`,
          name: sub.concept,
          type: 'gasto',
          categoryId: cat.id,
          categoryName: cat.name,
          categoryColor: cat.color,
          categoryIcon: cat.icon,
          budgetedAmount: subAmount,
          projectedAmount: subAmount,
          realAmount: 0,
          plannedPendingAmount: 0,
          variation: 0,
          variationPct: 0,
          executionPct: 0,
          status: 'favorable',
          transactions: [],
          isCustom: false,
        });
      } else {
        // If an explicit item budget exists but was set to 0, default to subscription amount
        const existing = itemMap.get(key)!;
        if (existing.budgetedAmount === 0) {
          existing.budgetedAmount = subAmount;
        }
      }
    });

    // 3. Include monthly services as line items
    (services || []).forEach((srv) => {
      const record = srv.monthlyRecords?.[monthKey];
      const srvAmount = record?.budgetedAmount ?? srv.budgetedAmount;
      const srvName = `${srv.company} - ${srv.serviceName}`;
      const key = srvName.trim().toLowerCase();
      const altKey = srv.company.trim().toLowerCase();

      const targetKey = itemMap.has(key) ? key : itemMap.has(altKey) ? altKey : key;

      if (!itemMap.has(targetKey)) {
        const cat = getCat(srv.categoryId, 'gasto');
        itemMap.set(targetKey, {
          id: `srv_${srv.id}`,
          name: srvName,
          type: 'gasto',
          categoryId: cat.id,
          categoryName: cat.name,
          categoryColor: cat.color,
          categoryIcon: cat.icon,
          budgetedAmount: srvAmount,
          projectedAmount: srvAmount,
          realAmount: 0,
          plannedPendingAmount: 0,
          variation: 0,
          variationPct: 0,
          executionPct: 0,
          status: 'favorable',
          transactions: [],
          isCustom: false,
        });
      }
    });

    // 4. Map and accumulate all transactions for this month
    const validTxs = (allMonthTransactions || []).filter(
      (tx) => (tx.type === 'gasto' || tx.type === 'ingreso') && tx.date.startsWith(monthKey)
    );

    validTxs.forEach((tx) => {
      const cleanConcept = tx.concept.trim();
      const txKey = cleanConcept.toLowerCase();

      // Look for match: exact key or contains key
      let matchedItem: DetailedBudgetItem | undefined = itemMap.get(txKey);

      if (!matchedItem) {
        for (const [key, item] of itemMap.entries()) {
          if (txKey.includes(key) || key.includes(txKey)) {
            matchedItem = item;
            break;
          }
        }
      }

      // If still not found, create an unbudgeted line item for this concept
      if (!matchedItem) {
        const txType = tx.type as 'gasto' | 'ingreso';
        const cat = getCat(tx.categoryId, txType);
        matchedItem = {
          id: `tx_line_${cleanConcept.replace(/\s+/g, '_')}_${txType}`,
          name: cleanConcept,
          type: txType,
          categoryId: cat.id,
          categoryName: cat.name,
          categoryColor: cat.color,
          categoryIcon: cat.icon,
          budgetedAmount: 0,
          projectedAmount: 0,
          realAmount: 0,
          plannedPendingAmount: 0,
          variation: 0,
          variationPct: 0,
          executionPct: 0,
          status: 'sin_presupuesto',
          transactions: [],
          isCustom: false,
        };
        itemMap.set(txKey, matchedItem);
      }

      matchedItem.transactions.push(tx);

      if (tx.status === 'realizado') {
        matchedItem.realAmount += tx.amount;
      } else if (tx.status === 'planificado') {
        matchedItem.plannedPendingAmount += tx.amount;
      }
    });

    // 5. Final calculations: Projected, Variation, Percentages & Status
    const results: DetailedBudgetItem[] = Array.from(itemMap.values()).map((item) => {
      const projected = item.realAmount + item.plannedPendingAmount;
      const finalProjected = projected > 0 ? projected : item.projectedAmount;

      let variation = 0;
      let executionPct = 0;
      let variationPct = 0;
      let status: DetailedBudgetItem['status'] = 'favorable';

      if (item.type === 'gasto') {
        // For expense: positive variation = savings (budgeted > real), negative = overrun
        variation = item.budgetedAmount - item.realAmount;
        executionPct =
          item.budgetedAmount > 0
            ? Math.round((item.realAmount / item.budgetedAmount) * 100)
            : item.realAmount > 0
            ? 100
            : 0;
        variationPct =
          item.budgetedAmount > 0
            ? Math.round(((item.budgetedAmount - item.realAmount) / item.budgetedAmount) * 100)
            : 0;

        if (item.budgetedAmount === 0) {
          status = 'sin_presupuesto';
        } else if (item.realAmount > item.budgetedAmount) {
          status = 'sobregiro';
        } else if (executionPct >= 80) {
          status = 'alerta';
        } else {
          status = 'favorable';
        }
      } else {
        // For income: positive variation = surplus (real > budgeted), negative = deficit
        variation = item.realAmount - item.budgetedAmount;
        executionPct =
          item.budgetedAmount > 0
            ? Math.round((item.realAmount / item.budgetedAmount) * 100)
            : item.realAmount > 0
            ? 100
            : 0;
        variationPct =
          item.budgetedAmount > 0
            ? Math.round(((item.realAmount - item.budgetedAmount) / item.budgetedAmount) * 100)
            : 0;

        if (item.budgetedAmount === 0) {
          status = 'sin_presupuesto';
        } else if (item.realAmount >= item.budgetedAmount) {
          status = 'favorable';
        } else {
          status = 'en_meta';
        }
      }

      return {
        ...item,
        projectedAmount: finalProjected,
        variation,
        executionPct,
        variationPct,
        status,
      };
    });

    // Sort: Gastos first, then Ingresos. Inside each group, sort by higher of budgeted or real amount
    return results.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'gasto' ? -1 : 1;
      }
      const valA = Math.max(a.budgetedAmount, a.realAmount);
      const valB = Math.max(b.budgetedAmount, b.realAmount);
      return valB - valA;
    });
  }

  /**
   * Generates Executive Summary & Today's State
   */
  static calculateExecutiveSummary(
    year: number,
    month: number,
    todayStr: string,
    accounts: Account[],
    creditCards: CreditCard[],
    loans: Loan[],
    dailyFlow: DailyCashFlowItem[],
    allTransactions: Transaction[],
    budgetItems: BudgetAnalysisItem[]
  ): ExecutiveSummary {
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;

    // Real cash balance right now (cash accounts + bank accounts + realized transactions up to today)
    let currentRealCashBalance = 0;
    let bankBalance = 0;
    let cashBalance = 0;

    accounts.forEach((acc) => {
      if (acc.isActive) {
        currentRealCashBalance += acc.initialBalance;
        if (acc.type === 'efectivo') {
          cashBalance += acc.initialBalance;
        } else {
          bankBalance += acc.initialBalance;
        }
      }
    });

    allTransactions.forEach((tx) => {
      if (tx.status !== 'realizado') return;
      if (tx.date <= todayStr) {
        if (tx.type === 'transferencia') return;
        if (tx.paymentMethodType === 'tarjeta_credito' && tx.type !== 'pago_tarjeta') return;

        const targetAccount = accounts.find((a) => a.id === tx.accountId);
        const isCash = targetAccount ? targetAccount.type === 'efectivo' : false;

        if (tx.type === 'ingreso') {
          currentRealCashBalance += tx.amount;
          if (isCash) cashBalance += tx.amount;
          else bankBalance += tx.amount;
        } else {
          currentRealCashBalance -= tx.amount;
          if (isCash) cashBalance -= tx.amount;
          else bankBalance -= tx.amount;
        }
      }
    });

    // Month totals
    const monthTxs = allTransactions.filter(
      (tx) => tx.date.startsWith(monthKey) && tx.status !== 'cancelado' && tx.type !== 'transferencia'
    );

    let totalRealizedIncome = 0;
    let totalPlannedIncome = 0;
    let totalRealizedExpense = 0;
    let totalPlannedExpense = 0;

    monthTxs.forEach((tx) => {
      if (tx.type === 'ingreso') {
        if (tx.status === 'realizado') totalRealizedIncome += tx.amount;
        else totalPlannedIncome += tx.amount;
      } else {
        if (tx.status === 'realizado') totalRealizedExpense += tx.amount;
        else totalPlannedExpense += tx.amount;
      }
    });

    // Debt Breakdown: Credit cards used + Loans remaining
    let creditCardDebt = 0;
    creditCards.forEach((c) => {
      if (c.isActive) {
        creditCardDebt += NexaFinancialEngine.calculateCardCurrentBalance(c, allTransactions).balance;
      }
    });

    let loanDebt = 0;
    loans.forEach((l) => {
      loanDebt += l.remainingBalance;
    });

    const totalDebt = creditCardDebt + loanDebt;

    // End of period projected balance & lowest projected balance
    const lastDay = dailyFlow && dailyFlow.length > 0 ? dailyFlow[dailyFlow.length - 1] : undefined;
    const projectedEndPeriodBalance = lastDay ? lastDay.endDayProjectedBalance : currentRealCashBalance;
    const projectedEndBalance = projectedEndPeriodBalance;

    let lowestProjectedBalance = currentRealCashBalance;
    if (dailyFlow && dailyFlow.length > 0) {
      lowestProjectedBalance = Math.min(...dailyFlow.map((d) => d.endDayProjectedBalance));
    }

    // Upcoming committed obligations in next 15 days from today
    const in15Days = new Date(todayStr);
    in15Days.setDate(in15Days.getDate() + 15);
    const in15DaysStr = in15Days.toISOString().split('T')[0];

    let upcomingObligationsCommitted = 0;
    const thisWeekObligations: Transaction[] = [];

    allTransactions.forEach((tx) => {
      if (tx.status !== 'cancelado' && tx.date >= todayStr && tx.date <= in15DaysStr) {
        const isObligation =
          tx.type === 'pago_tarjeta' ||
          tx.type === 'cuota_tarjeta' ||
          tx.type === 'cuota_prestamo' ||
          tx.type === 'suscripcion' ||
          tx.type === 'servicio';

        if (isObligation) {
          upcomingObligationsCommitted += tx.amount;
          thisWeekObligations.push(tx);
        }
      }
    });

    thisWeekObligations.sort((a, b) => a.date.localeCompare(b.date));

    // Today's stats
    const todayTransactions = allTransactions.filter(
      (tx) => tx.date === todayStr && tx.status !== 'cancelado'
    );

    let todayIncome = 0;
    let todayExpense = 0;
    let todayObligations = 0;

    todayTransactions.forEach((tx) => {
      if (tx.type === 'ingreso') todayIncome += tx.amount;
      else {
        todayExpense += tx.amount;
        if (
          tx.type === 'pago_tarjeta' ||
          tx.type === 'cuota_prestamo' ||
          tx.type === 'suscripcion' ||
          tx.type === 'servicio'
        ) {
          todayObligations += tx.amount;
        }
      }
    });

    // Free available cash after committed obligations
    const freeAvailableCash = currentRealCashBalance - upcomingObligationsCommitted;
    const freeCashAfterObligations = freeAvailableCash;

    // Alerts generation
    const alerts: AlertItem[] = [];

    // 1. Negative balance check in projections
    const negativeDay = dailyFlow.find((d) => d.isNegative && d.date >= todayStr);
    if (negativeDay) {
      alerts.push({
        id: `alert_neg_${negativeDay.date}`,
        type: 'danger',
        title: 'Saldo proyectado insuficiente',
        message: `El día ${negativeDay.date} tu saldo proyectado caería a -$${(
          Math.abs(negativeDay.endDayProjectedBalance) / 100
        ).toFixed(2)}. Revisa tus compromisos para evitar sobregiro.`,
        date: negativeDay.date,
      });
    }

    // 2. Low liquidity warning
    if (
      currentRealCashBalance > 0 &&
      upcomingObligationsCommitted > 0 &&
      upcomingObligationsCommitted / currentRealCashBalance >= 0.8
    ) {
      alerts.push({
        id: 'alert_low_liquidity',
        type: 'warning',
        title: 'Liquidez ajustada',
        message: `Tus obligaciones próximas de $${(upcomingObligationsCommitted / 100).toFixed(
          2
        )} representan más del 80% de tu saldo disponible.`,
      });
    }

    // 3. Over-budget alerts
    budgetItems.forEach((b) => {
      if (b.status === 'sobregiro') {
        alerts.push({
          id: `alert_overbudget_${b.categoryId}`,
          type: 'danger',
          title: `Sobregiro en ${b.categoryName}`,
          message: `Has gastado $${(b.realAmount / 100).toFixed(2)} de un presupuesto de $${(
            b.budgetedAmount / 100
          ).toFixed(2)} (${b.percentUsed}%).`,
        });
      } else if (b.status === 'alerta') {
        alerts.push({
          id: `alert_nearlimit_${b.categoryId}`,
          type: 'warning',
          title: `Cerca del límite en ${b.categoryName}`,
          message: `Has consumido el ${b.percentUsed}% de tu presupuesto ($${(
            b.realAmount / 100
          ).toFixed(2)} de $${(b.budgetedAmount / 100).toFixed(2)}).`,
        });
      }
    });

    // 4. Positive improvement alert
    if (totalRealizedIncome - totalRealizedExpense > 0 && totalRealizedIncome > 0) {
      alerts.push({
        id: 'alert_positive_savings',
        type: 'success',
        title: 'Ahorro positivo acumulado',
        message: `Llevas un ahorro neto realizado de $${(
          (totalRealizedIncome - totalRealizedExpense) /
          100
        ).toFixed(2)} en este período.`,
      });
    }

    alerts.forEach((a) => {
      if (!a.severity) a.severity = a.type;
    });
    const criticalAlerts = alerts;

    return {
      currentRealCashBalance,
      bankBalance,
      cashBalance,
      projectedEndPeriodBalance,
      projectedEndBalance,
      lowestProjectedBalance,
      totalRealizedIncome,
      totalPlannedIncome,
      totalRealizedExpense,
      totalPlannedExpense,
      netRealSavings: totalRealizedIncome - totalRealizedExpense,
      netPlannedSavings: totalPlannedIncome - totalPlannedExpense,
      upcomingObligationsCommitted,
      totalDebt,
      creditCardDebt,
      loanDebt,
      freeAvailableCash,
      freeCashAfterObligations,
      todayIncome,
      todayExpense,
      todayObligations,
      todayTransactions,
      thisWeekObligations,
      alerts,
      criticalAlerts,
    };
  }

  /**
   * Affordability Simulator ("¿Puedo pagarlo?")
   * Tests whether an arbitrary planned expense can be absorbed without breaking liquidity
   */
  static simulateAffordability(
    amountCents: number,
    paymentMethod: 'efectivo' | 'banco' | 'tarjeta_credito',
    currentRealCash: number,
    upcomingCommittedObligations: number,
    creditCard?: CreditCard
  ): {
    canAfford: boolean;
    status: 'safe' | 'tight' | 'danger';
    statusLabel: string;
    balanceBefore: number;
    balanceAfter: number;
    balanceAfterObligations: number;
    explanation: string;
    cardBeforeCredit?: number;
    cardAfterCredit?: number;
  } {
    if (paymentMethod === 'tarjeta_credito' && creditCard) {
      const availableBefore = creditCard.limit - creditCard.initialUsedBalance;
      const availableAfter = availableBefore - amountCents;
      const canAfford = availableAfter >= 0;

      return {
        canAfford,
        status: canAfford ? (availableAfter < creditCard.limit * 0.15 ? 'tight' : 'safe') : 'danger',
        statusLabel: !canAfford
          ? '🔴 Límite de tarjeta insuficiente'
          : availableAfter < creditCard.limit * 0.15
          ? '🟠 Crédito disponible ajustado'
          : '🟢 Compra realizable con tarjeta',
        balanceBefore: currentRealCash,
        balanceAfter: currentRealCash, // Banco no disminuye hoy con tarjeta
        balanceAfterObligations: currentRealCash - upcomingCommittedObligations,
        explanation: canAfford
          ? `La compra de $${(amountCents / 100).toFixed(
              2
            )} ocupará crédito de la tarjeta ${creditCard.name}, dejando $${(
              availableAfter / 100
            ).toFixed(2)} de crédito disponible. Recuerda que deberás pagar esto en la fecha de pago.`
          : `El crédito disponible en ${creditCard.name} ($${(
              availableBefore / 100
            ).toFixed(2)}) es menor al monto solicitado ($${(amountCents / 100).toFixed(2)}).`,
        cardBeforeCredit: availableBefore,
        cardAfterCredit: availableAfter,
      };
    }

    // Cash or bank payment
    const balanceBefore = currentRealCash;
    const balanceAfter = balanceBefore - amountCents;
    const balanceAfterObligations = balanceAfter - upcomingCommittedObligations;

    let status: 'safe' | 'tight' | 'danger' = 'safe';
    let statusLabel = '🟢 Puede realizarse';
    let explanation = '';

    if (balanceAfter < 0) {
      status = 'danger';
      statusLabel = '🔴 Riesgo de saldo negativo directo';
      explanation = `No tienes suficiente saldo disponible hoy ($${(balanceBefore / 100).toFixed(
        2
      )}) para cubrir este gasto de $${(amountCents / 100).toFixed(2)}.`;
    } else if (balanceAfterObligations < 0) {
      status = 'danger';
      statusLabel = '🔴 Riesgo de saldo insuficiente para obligaciones';
      explanation = `Aunque tienes $${(balanceAfter / 100).toFixed(
        2
      )} restantes inmediatos, tus compromisos próximos suman $${(
        upcomingCommittedObligations / 100
      ).toFixed(2)}, dejando un faltante de $${(Math.abs(balanceAfterObligations) / 100).toFixed(2)}.`;
    } else if (balanceAfterObligations < 5000) {
      status = 'tight';
      statusLabel = '🟠 Liquidez muy ajustada';
      explanation = `El gasto es posible, pero después de cubrir tus obligaciones próximas te quedarían únicamente $${(
        balanceAfterObligations / 100
      ).toFixed(2)} de reserva libre.`;
    } else {
      status = 'safe';
      statusLabel = '🟢 Puede realizarse con holgura';
      explanation = `El gasto es viable. Después de pagar tus compromisos próximos conservarás un remanente libre de $${(
        balanceAfterObligations / 100
      ).toFixed(2)}.`;
    }

    return {
      canAfford: status !== 'danger',
      status,
      statusLabel,
      balanceBefore,
      balanceAfter,
      balanceAfterObligations,
      explanation,
    };
  }

  /**
   * Calculates a 12-Month Multi-Month Cash Flow & Net Savings Projection
   * starting from a given year & month.
   */
  static calculateAnnualProjection(
    startYear: number,
    startMonth: number,
    initialCashCents: number,
    data: {
      accounts: Account[];
      creditCards: CreditCard[];
      categories: Category[];
      budgets: Budget[];
      itemBudgets: ItemBudget[];
      subscriptions: Subscription[];
      services: ServiceItem[];
      installmentPurchases: InstallmentPurchase[];
      loans: Loan[];
      transactions: Transaction[];
    }
  ): MonthProjection[] {
    const projections: MonthProjection[] = [];
    let runningBalance = initialCashCents;
    const catMap = new Map(data.categories.map((c) => [c.id, c.type]));

    for (let i = 0; i < 12; i++) {
      let curMonth = startMonth + i;
      let curYear = startYear;
      while (curMonth > 12) {
        curMonth -= 12;
        curYear += 1;
      }

      const monthKey = `${curYear}-${String(curMonth).padStart(2, '0')}`;
      const monthName = MONTH_NAMES_ES[curMonth - 1] || `Mes ${curMonth}`;

      // 1. Explicit transactions recorded for this future/past month
      const monthTxs = data.transactions.filter((t) => t.date.startsWith(monthKey));

      // 2. Projected fixed events for this month
      const projectedEvents = NexaFinancialEngine.generateProjectedEvents(curYear, curMonth, {
        subscriptions: data.subscriptions,
        services: data.services,
        installmentPurchases: data.installmentPurchases,
        loans: data.loans,
        creditCards: data.creditCards,
        accounts: data.accounts,
        existingTransactions: data.transactions,
      });

      const combined = [...monthTxs, ...projectedEvents];

      // Income
      let monthIncome = 0;
      for (const tx of combined) {
        if (tx.type === 'ingreso') {
          monthIncome += tx.amount;
        }
      }

      // If no explicit income is scheduled in future months, estimate from recurring itemBudgets/budgets
      if (monthIncome === 0) {
        const incomeBudgets = data.itemBudgets.filter(
          (b) => b.type === 'ingreso' && (b.year === curYear ? b.month === curMonth : true)
        );
        if (incomeBudgets.length > 0) {
          monthIncome = incomeBudgets.reduce((acc, b) => acc + (b.projectedAmount || b.budgetedAmount), 0);
        } else {
          // fallback to baseline monthly planned income from start month transactions or general income budget
          const defaultIncomeBudget = data.budgets
            .filter((b) => catMap.get(b.categoryId) === 'ingreso')
            .reduce((acc, b) => acc + b.budgetedAmount, 0);
          monthIncome = defaultIncomeBudget;
        }
      }

      // Fixed obligations
      let fixedObligations = 0;
      let loansDueCount = 0;

      for (const tx of combined) {
        if (['cuota_prestamo', 'suscripcion', 'servicio', 'pago_tarjeta', 'cuota_tarjeta'].includes(tx.type)) {
          fixedObligations += tx.amount;
          if (tx.type === 'cuota_prestamo') loansDueCount++;
        }
      }

      // Discretionary expenses (regular spending, itemBudgets or general budgets)
      let discretionaryExpenses = 0;
      const explicitDiscretionary = combined.filter((t) => t.type === 'gasto');
      discretionaryExpenses = explicitDiscretionary.reduce((sum, t) => sum + t.amount, 0);

      // If future month has low or no manual discretionary entries, project from regular expense budgets
      const baseExpenseBudgets = data.budgets
        .filter((b) => catMap.get(b.categoryId) === 'gasto')
        .reduce((sum, b) => sum + b.budgetedAmount, 0);

      if (discretionaryExpenses < baseExpenseBudgets && baseExpenseBudgets > 0) {
        discretionaryExpenses = baseExpenseBudgets;
      }

      const totalExpense = fixedObligations + discretionaryExpenses;
      const openingBalance = runningBalance;
      const closingBalance = openingBalance + monthIncome - totalExpense;
      const netSavings = monthIncome - totalExpense;
      const savingsRate = monthIncome > 0 ? Math.round((netSavings / monthIncome) * 100) : 0;

      let status: 'saludable' | 'ajustado' | 'deficit' = 'saludable';
      if (closingBalance < 0) {
        status = 'deficit';
      } else if (closingBalance < 10000 || savingsRate < 5) {
        status = 'ajustado';
      }

      projections.push({
        year: curYear,
        month: curMonth,
        monthKey,
        monthName: `${monthName} ${curYear}`,
        openingBalance,
        projectedIncome: monthIncome,
        projectedExpense: totalExpense,
        fixedObligations,
        discretionaryBudget: discretionaryExpenses,
        closingBalance,
        netSavings,
        savingsRate,
        status,
        loansDueCount,
      });

      // Update running balance for next month's opening
      runningBalance = closingBalance;
    }

    return projections;
  }

  /**
   * Calculates the current dynamic balance and available limit of a credit card
   */
  static calculateCardCurrentBalance(
    card: CreditCard,
    allTransactions: Transaction[],
    asOfDate?: string
  ): { balance: number; available: number; usagePercentage: number } {
    let balance = card.initialUsedBalance || 0;

    allTransactions.forEach((tx) => {
      if (tx.status === 'cancelado') return;
      if (tx.creditCardId !== card.id) return;
      if (asOfDate && tx.date > asOfDate) return;

      if (tx.paymentMethodType === 'tarjeta_credito' && tx.type !== 'pago_tarjeta') {
        balance += tx.amount;
      } else if (tx.type === 'pago_tarjeta') {
        balance = Math.max(0, balance - tx.amount);
      }
    });

    const available = Math.max(0, card.limit - balance);
    const usagePercentage = card.limit > 0 ? Math.round((balance / card.limit) * 100) : 0;

    return {
      balance,
      available,
      usagePercentage,
    };
  }

  /**
   * Calculates the exact start and end dates for a credit card billing cycle.
   * By banking rules and user specification:
   * A cycle with cut-off day X in month M:
   * - cycleEndDate: Cut-off day X of month M (e.g. 12 de septiembre: 2026-09-12)
   * - cycleStartDate: Exactly 1 day after previous cut-off date (e.g. 13 de agosto: 2026-08-13)
   *   (i.e. From August 13 to September 12, not August 12 to September 12).
   */
  static getBillingCycleDates(
    card: { cutOffDay: number },
    year: number,
    month: number
  ): {
    cycleStartDate: string;
    cycleEndDate: string;
    cutOffDayActual: number;
    prevCutOffDate: string;
  } {
    const cycleMonthDays = daysInMonth(year, month);
    const cutOffDayActual = Math.min(card.cutOffDay, cycleMonthDays);
    const cycleEndDate = `${year}-${String(month).padStart(2, '0')}-${String(cutOffDayActual).padStart(2, '0')}`;

    // Previous cycle cutoff (1 month before)
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear = year - 1;
    }
    const prevMonthDays = daysInMonth(prevYear, prevMonth);
    const prevCutOffActual = Math.min(card.cutOffDay, prevMonthDays);
    const prevCutOffDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(prevCutOffActual).padStart(2, '0')}`;

    // The cycle starts exactly 1 day after the previous cutoff date
    // e.g. If previous cutoff was 2026-08-12, cycle begins on 2026-08-13 and ends on 2026-09-12.
    const cycleStartDate = addDays(prevCutOffDate, 1);

    return {
      cycleStartDate,
      cycleEndDate,
      cutOffDayActual,
      prevCutOffDate,
    };
  }

  /**
   * Generates a complete Credit Card Billing Statement (Estado de Cuenta)
   * for a given card and billing cycle month (year, month).
   */
  static generateCreditCardStatement(
    card: CreditCard,
    year: number,
    month: number,
    allTransactions: Transaction[],
    installmentPurchases: InstallmentPurchase[] = [],
    todayStr: string = new Date().toISOString().split('T')[0]
  ): CreditCardStatement {
    const { cycleStartDate, cycleEndDate, cutOffDayActual } = NexaFinancialEngine.getBillingCycleDates(card, year, month);

    // Payment due date
    let payYear = year;
    let payMonth = month;
    if (card.paymentDueDay <= card.cutOffDay) {
      payMonth = month + 1;
      if (payMonth > 12) {
        payMonth = 1;
        payYear = year + 1;
      }
    }
    const payMonthDays = daysInMonth(payYear, payMonth);
    const payDayActual = Math.min(card.paymentDueDay, payMonthDays);
    const paymentDueDate = `${payYear}-${String(payMonth).padStart(2, '0')}-${String(payDayActual).padStart(2, '0')}`;

    // Transactions inside this billing cycle (from day after previous cut-off to current cut-off day)
    const cycleTxs = allTransactions.filter((tx) => {
      if (tx.creditCardId !== card.id) return false;
      if (tx.status === 'cancelado') return false;
      return tx.date >= cycleStartDate && tx.date <= cycleEndDate;
    });

    // Expenses / Purchases
    const purchaseTxs = cycleTxs.filter(
      (tx) => tx.paymentMethodType === 'tarjeta_credito' && tx.type !== 'pago_tarjeta'
    );
    let purchasesSum = purchaseTxs.reduce((sum, tx) => sum + tx.amount, 0);

    // Active Installment Purchases for this card that apply to this cycle
    const cycleMonthKey = `${year}-${String(month).padStart(2, '0')}`;
    installmentPurchases.forEach((ip) => {
      if (ip.creditCardId === card.id && ip.pendingBalance > 0) {
        const alreadyInCycle = purchaseTxs.some((tx) => tx.origin === `cuota:${ip.id}`);
        if (!alreadyInCycle) {
          purchasesSum += ip.installmentAmount;
        }
      }
    });

    // Payments in this cycle
    const paymentTxs = cycleTxs.filter((tx) => tx.type === 'pago_tarjeta');
    const paymentsSum = paymentTxs.reduce((sum, tx) => sum + tx.amount, 0);

    // Prior cycle balance (for September 2026, include initialUsedBalance if any)
    let previousCycleBalance = 0;
    if (cycleMonthKey === '2026-09') {
      previousCycleBalance = card.initialUsedBalance || 0;
    }

    const totalDueAtCutOff = Math.max(0, previousCycleBalance + purchasesSum - paymentsSum);
    const availableCredit = Math.max(0, card.limit - totalDueAtCutOff);
    const minimumPayment = totalDueAtCutOff > 0 ? Math.min(totalDueAtCutOff, Math.max(2500, Math.round(totalDueAtCutOff * 0.05))) : 0;
    const cashPaymentNoInterest = totalDueAtCutOff;

    let status: 'en_curso' | 'cortado' | 'pagado' = 'en_curso';
    if (totalDueAtCutOff === 0) {
      status = 'pagado';
    } else if (todayStr > cycleEndDate) {
      status = 'cortado';
    } else {
      status = 'en_curso';
    }

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const cycleLabel = `Corte ${cutOffDayActual} de ${monthNames[month - 1]} ${year}`;

    return {
      cardId: card.id,
      cardName: card.name,
      bank: card.bank,
      cycleKey: cycleMonthKey,
      cycleLabel,
      cycleStartDate,
      cycleEndDate,
      cutOffDay: card.cutOffDay,
      paymentDueDate,
      limit: card.limit,
      totalPurchases: purchasesSum,
      totalPayments: paymentsSum,
      previousCycleBalance,
      totalDueAtCutOff,
      availableCredit,
      minimumPayment,
      cashPaymentNoInterest,
      transactions: cycleTxs.sort((a, b) => b.date.localeCompare(a.date)),
      isCurrentCycle: todayStr >= cycleStartDate && todayStr <= cycleEndDate,
      status,
    };
  }

  /**
   * Generates statements for all active cards for a given month
   */
  static generateAllCardStatements(
    creditCards: CreditCard[],
    year: number,
    month: number,
    allTransactions: Transaction[],
    installmentPurchases: InstallmentPurchase[] = [],
    todayStr: string = new Date().toISOString().split('T')[0]
  ): CreditCardStatement[] {
    return creditCards
      .filter((c) => c.isActive)
      .map((c) =>
        NexaFinancialEngine.generateCreditCardStatement(
          c,
          year,
          month,
          allTransactions,
          installmentPurchases,
          todayStr
        )
      );
  }
}
