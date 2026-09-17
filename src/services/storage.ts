import {
  Account,
  CreditCard,
  Transaction,
  Category,
  Budget,
  ItemBudget,
  InstallmentPurchase,
  Loan,
  LoanExtraPayment,
  Subscription,
  ServiceItem,
  InitialPosition,
  MonthlyClose,
  AppSettings,
  GroceryItem,
  PlanNote,
  QuickTemplate,
  SavingsAccount,
} from '../types';

const DB_NAME = 'NexaFinanceDB';
const DB_VERSION = 6;

export interface NexaFullBackup {
  version: number;
  appName: string;
  exportDate: string;
  data: {
    accounts: Account[];
    savingsAccounts?: SavingsAccount[];
    creditCards: CreditCard[];
    transactions: Transaction[];
    categories: Category[];
    budgets: Budget[];
    itemBudgets?: ItemBudget[];
    groceryItems?: GroceryItem[];
    planNotes?: PlanNote[];
    quickTemplates?: QuickTemplate[];
    installmentPurchases: InstallmentPurchase[];
    loans: Loan[];
    loanPayments: LoanExtraPayment[];
    subscriptions: Subscription[];
    services: ServiceItem[];
    initialPosition: InitialPosition | null;
    monthlyCloses: MonthlyClose[];
    appSettings: AppSettings;
  };
}

class NexaStorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB no está disponible en este navegador'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        const storeNames = [
          'accounts',
          'savingsAccounts',
          'creditCards',
          'transactions',
          'categories',
          'budgets',
          'itemBudgets',
          'groceryItems',
          'planNotes',
          'quickTemplates',
          'installmentPurchases',
          'loans',
          'loanPayments',
          'subscriptions',
          'services',
          'initialPosition',
          'monthlyCloses',
          'appSettings',
        ];

        storeNames.forEach((store) => {
          if (!db.objectStoreNames.contains(store)) {
            if (store === 'initialPosition' || store === 'appSettings') {
              db.createObjectStore(store, { keyPath: 'id' });
            } else {
              const objStore = db.createObjectStore(store, { keyPath: 'id' });
              if (store === 'transactions') {
                objStore.createIndex('date', 'date', { unique: false });
                objStore.createIndex('status', 'status', { unique: false });
                objStore.createIndex('type', 'type', { unique: false });
              }
            }
          }
        });
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve((request.result as T[]) || []);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn(`IndexedDB fallback for getAll(${storeName}):`, err);
      const raw = localStorage.getItem(`nexa_${storeName}`);
      return raw ? JSON.parse(raw) : [];
    }
  }

  async put<T extends { id: string }>(storeName: string, item: T): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(item);
        request.onsuccess = () => {
          // Keep a synchronous mirror in localStorage for critical items
          if (storeName === 'appSettings' || storeName === 'initialPosition') {
            localStorage.setItem(`nexa_${storeName}`, JSON.stringify(item));
          }
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn(`IndexedDB fallback for put(${storeName}):`, err);
      const items = await this.getAll<T>(storeName);
      const idx = items.findIndex((i) => i.id === item.id);
      if (idx >= 0) items[idx] = item;
      else items.push(item);
      localStorage.setItem(`nexa_${storeName}`, JSON.stringify(items));
    }
  }

  async putBatch<T extends { id: string }>(storeName: string, items: T[]): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        items.forEach((item) => store.put(item));
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (err) {
      console.warn(`IndexedDB fallback for putBatch(${storeName}):`, err);
      localStorage.setItem(`nexa_${storeName}`, JSON.stringify(items));
    }
  }

  async delete(storeName: string, id: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn(`IndexedDB fallback for delete(${storeName}):`, err);
      const items = await this.getAll<{ id: string }>(storeName);
      const filtered = items.filter((i) => i.id !== id);
      localStorage.setItem(`nexa_${storeName}`, JSON.stringify(filtered));
    }
  }

  async clearStore(storeName: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      localStorage.removeItem(`nexa_${storeName}`);
    }
  }

  async clearAll(): Promise<void> {
    const storeNames = [
      'accounts',
      'creditCards',
      'transactions',
      'categories',
      'budgets',
      'itemBudgets',
      'groceryItems',
      'planNotes',
      'quickTemplates',
      'installmentPurchases',
      'loans',
      'loanPayments',
      'subscriptions',
      'services',
      'initialPosition',
      'monthlyCloses',
    ];
    for (const name of storeNames) {
      await this.clearStore(name);
    }
  }

  async exportFullBackup(): Promise<NexaFullBackup> {
    const [
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
      initialPositions,
      monthlyCloses,
      settingsList,
      savingsAccounts,
    ] = await Promise.all([
      this.getAll<Account>('accounts'),
      this.getAll<CreditCard>('creditCards'),
      this.getAll<Transaction>('transactions'),
      this.getAll<Category>('categories'),
      this.getAll<Budget>('budgets'),
      this.getAll<ItemBudget>('itemBudgets'),
      this.getAll<GroceryItem>('groceryItems'),
      this.getAll<PlanNote>('planNotes'),
      this.getAll<QuickTemplate>('quickTemplates'),
      this.getAll<InstallmentPurchase>('installmentPurchases'),
      this.getAll<Loan>('loans'),
      this.getAll<LoanExtraPayment>('loanPayments'),
      this.getAll<Subscription>('subscriptions'),
      this.getAll<ServiceItem>('services'),
      this.getAll<InitialPosition>('initialPosition'),
      this.getAll<MonthlyClose>('monthlyCloses'),
      this.getAll<AppSettings>('appSettings'),
      this.getAll<SavingsAccount>('savingsAccounts'),
    ]);

    const backup: NexaFullBackup = {
      version: 6,
      appName: 'NEXA Finance',
      exportDate: new Date().toISOString(),
      data: {
        accounts,
        savingsAccounts,
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
        initialPosition: initialPositions[0] || null,
        monthlyCloses,
        appSettings: settingsList[0] || {
          id: 'app_settings',
          currency: 'USD',
          currencySymbol: '$',
          currencyCode: 'USD',
          dateFormat: 'DD/MM/YYYY',
          firstDayOfWeek: 1,
          encryptionEnabled: true,
          budgetAlertThreshold: 80,
          theme: 'fintech-dark',
          liquidityStartDate: '2026-09-15',
        },
      },
    };

    return backup;
  }

  async importFullBackup(backup: NexaFullBackup): Promise<boolean> {
    if (!backup || !backup.data || backup.appName !== 'NEXA Finance') {
      throw new Error('El archivo de respaldo no es válido para NEXA Finance');
    }

    // Create automatic safety snapshot in localStorage before importing
    try {
      const current = await this.exportFullBackup();
      localStorage.setItem('nexa_pre_import_snapshot', JSON.stringify(current));
    } catch {
      // ignore
    }

    // Clear and restore
    await this.clearAll();

    const { data } = backup;
    if (data.accounts?.length) await this.putBatch('accounts', data.accounts);
    if (data.savingsAccounts?.length) await this.putBatch('savingsAccounts', data.savingsAccounts);
    if (data.creditCards?.length) await this.putBatch('creditCards', data.creditCards);
    if (data.transactions?.length) await this.putBatch('transactions', data.transactions);
    if (data.categories?.length) await this.putBatch('categories', data.categories);
    if (data.budgets?.length) await this.putBatch('budgets', data.budgets);
    if (data.itemBudgets?.length) await this.putBatch('itemBudgets', data.itemBudgets);
    if (data.groceryItems?.length) await this.putBatch('groceryItems', data.groceryItems);
    if (data.planNotes?.length) await this.putBatch('planNotes', data.planNotes);
    if (data.quickTemplates?.length) await this.putBatch('quickTemplates', data.quickTemplates);
    if (data.installmentPurchases?.length)
      await this.putBatch('installmentPurchases', data.installmentPurchases);
    if (data.loans?.length) await this.putBatch('loans', data.loans);
    if (data.loanPayments?.length) await this.putBatch('loanPayments', data.loanPayments);
    if (data.subscriptions?.length) await this.putBatch('subscriptions', data.subscriptions);
    if (data.services?.length) await this.putBatch('services', data.services);
    if (data.initialPosition) await this.put('initialPosition', data.initialPosition);
    if (data.monthlyCloses?.length) await this.putBatch('monthlyCloses', data.monthlyCloses);
    if (data.appSettings) await this.put('appSettings', data.appSettings);

    return true;
  }
}

export const storage = new NexaStorageService();
