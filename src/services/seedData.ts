import {
  Account,
  CreditCard,
  Category,
  Budget,
  ItemBudget,
  InstallmentPurchase,
  Loan,
  Subscription,
  ServiceItem,
  InitialPosition,
  Transaction,
  AppSettings,
} from '../types';

export function getDefaultQuickTemplates(): import('../types').QuickTemplate[] {
  return [
    {
      id: 'tmpl_cafe',
      name: 'Café / Desayuno',
      type: 'gasto',
      amount: 350, // $3.50
      categoryId: 'cat_alimentacion',
      paymentMethod: 'efectivo',
      notes: 'Café o snack matutino',
      icon: 'Coffee',
      color: '#f59e0b',
      usageCount: 0,
    },
    {
      id: 'tmpl_almuerzo',
      name: 'Almuerzo / Menú del día',
      type: 'gasto',
      amount: 750, // $7.50
      categoryId: 'cat_alimentacion',
      paymentMethod: 'tarjeta_credito',
      notes: 'Comida diaria',
      icon: 'Utensils',
      color: '#3b82f6',
      usageCount: 0,
    },
    {
      id: 'tmpl_gasolina',
      name: 'Gasolina Semanal',
      type: 'gasto',
      amount: 3000, // $30.00
      categoryId: 'cat_transporte',
      paymentMethod: 'tarjeta_credito',
      notes: 'Combustible',
      icon: 'Fuel',
      color: '#10b981',
      usageCount: 0,
    },
    {
      id: 'tmpl_farmacia',
      name: 'Farmacia / Salud',
      type: 'gasto',
      amount: 1500, // $15.00
      categoryId: 'cat_salud',
      paymentMethod: 'banco',
      notes: 'Medicamentos menores',
      icon: 'Pill',
      color: '#ec4899',
      usageCount: 0,
    },
    {
      id: 'tmpl_super_rapido',
      name: 'Compra exprés súper',
      type: 'gasto',
      amount: 2000, // $20.00
      categoryId: 'cat_alimentacion',
      paymentMethod: 'tarjeta_credito',
      notes: 'Pan, leche, fruta rápida',
      icon: 'ShoppingBag',
      color: '#8b5cf6',
      usageCount: 0,
    },
  ];
}

export function getDefaultCategories(): Category[] {
  return [
    {
      id: 'cat_salario',
      name: 'Salario & Nómina',
      type: 'ingreso',
      icon: 'Briefcase',
      color: '#10b981',
      subcategories: ['Salario Quincenal', 'Bonificaciones', 'Horas Extras'],
    },
    {
      id: 'cat_negocio',
      name: 'Negocio & Freelance',
      type: 'ingreso',
      icon: 'TrendingUp',
      color: '#059669',
      subcategories: ['Consultoría', 'Ventas', 'Proyectos'],
    },
    {
      id: 'cat_otros_ingresos',
      name: 'Otros Ingresos',
      type: 'ingreso',
      icon: 'DollarSign',
      color: '#34d399',
      subcategories: ['Reembolsos', 'Intereses', 'Regalos'],
    },
    {
      id: 'cat_alimentacion',
      name: 'Alimentación & Supermercado',
      type: 'gasto',
      icon: 'ShoppingCart',
      color: '#3b82f6',
      subcategories: ['Supermercado', 'Restaurantes', 'Cafeterías', 'Delivery'],
    },
    {
      id: 'cat_vivienda',
      name: 'Vivienda & Hogar',
      type: 'gasto',
      icon: 'Home',
      color: '#6366f1',
      subcategories: ['Alquiler', 'Mantenimiento', 'Mobiliario'],
    },
    {
      id: 'cat_servicios',
      name: 'Servicios Básicos',
      type: 'gasto',
      icon: 'Zap',
      color: '#0ea5e9',
      subcategories: ['Electricidad', 'Agua', 'Internet Residencial', 'Telefonía Celular'],
    },
    {
      id: 'cat_transporte',
      name: 'Transporte & Auto',
      type: 'gasto',
      icon: 'Car',
      color: '#f59e0b',
      subcategories: ['Gasolina', 'Mantenimiento Vehicular', 'Parqueos', 'Uber/Taxi'],
    },
    {
      id: 'cat_suscripciones',
      name: 'Suscripciones Digitales',
      type: 'gasto',
      icon: 'Tv',
      color: '#8b5cf6',
      subcategories: ['Streaming Video', 'Streaming Música', 'Software/Cloud'],
    },
    {
      id: 'cat_deuda_tarjetas',
      name: 'Tarjetas & Préstamos',
      type: 'gasto',
      icon: 'CreditCard',
      color: '#ef4444',
      subcategories: ['Pago Tarjeta', 'Cuota Préstamo', 'Abono a Capital'],
    },
    {
      id: 'cat_salud',
      name: 'Salud & Bienestar',
      type: 'gasto',
      icon: 'Activity',
      color: '#ec4899',
      subcategories: ['Farmacia', 'Consultas Médicas', 'Gimnasio'],
    },
    {
      id: 'cat_entretenimiento',
      name: 'Entretenimiento & Ocio',
      type: 'gasto',
      icon: 'Film',
      color: '#14b8a6',
      subcategories: ['Cine & Eventos', 'Viajes & Salidas', 'Hobbies'],
    },
    {
      id: 'cat_educacion',
      name: 'Educación & Cursos',
      type: 'gasto',
      icon: 'BookOpen',
      color: '#84cc16',
      subcategories: ['Cursos Online', 'Libros', 'Capacitaciones'],
    },
  ];
}

export function getDefaultAppSettings(): AppSettings {
  return {
    id: 'app_settings',
    currency: 'USD',
    currencySymbol: '$',
    currencyCode: 'USD',
    dateFormat: 'DD/MM/YYYY',
    firstDayOfWeek: 1,
    encryptionEnabled: true,
    budgetAlertThreshold: 80,
    theme: 'fintech-dark',
  };
}

export function generateDemoSeedData(): {
  accounts: Account[];
  creditCards: CreditCard[];
  categories: Category[];
  budgets: Budget[];
  itemBudgets: ItemBudget[];
  installmentPurchases: InstallmentPurchase[];
  loans: Loan[];
  subscriptions: Subscription[];
  services: ServiceItem[];
  initialPosition: InitialPosition;
  transactions: Transaction[];
} {
  const categories = getDefaultCategories();

  const accounts: Account[] = [
    {
      id: 'acc_efectivo',
      name: 'Efectivo Personal',
      type: 'efectivo',
      initialBalance: 10000, // $100.00
      initialDate: '2026-09-12',
      isActive: true,
      color: '#10b981',
      createdAt: '2026-09-12T00:00:00.000Z',
      updatedAt: '2026-09-12T00:00:00.000Z',
    },
    {
      id: 'acc_bac',
      name: 'Cuenta Corriente BAC',
      type: 'banco',
      bankName: 'BAC Credomatic',
      initialBalance: 85000, // $850.00
      initialDate: '2026-09-12',
      isActive: true,
      color: '#2563eb',
      createdAt: '2026-09-12T00:00:00.000Z',
      updatedAt: '2026-09-12T00:00:00.000Z',
    },
    {
      id: 'acc_agricola',
      name: 'Cuenta Ahorro Agrícola',
      type: 'banco',
      bankName: 'Banco Agrícola',
      initialBalance: 30000, // $300.00
      initialDate: '2026-09-12',
      isActive: true,
      color: '#0284c7',
      createdAt: '2026-09-12T00:00:00.000Z',
      updatedAt: '2026-09-12T00:00:00.000Z',
    },
  ];

  const creditCards: CreditCard[] = [
    {
      id: 'card_bac',
      name: 'BAC Visa Signature',
      bank: 'BAC Credomatic',
      limit: 200000, // $2,000.00
      initialUsedBalance: 42000, // $420.00 used
      cutOffDay: 20,
      paymentDueDay: 5,
      usualPaymentDay: 4,
      color: '#dc2626',
      isActive: true,
      createdAt: '2026-09-12T00:00:00.000Z',
      updatedAt: '2026-09-12T00:00:00.000Z',
    },
    {
      id: 'card_x',
      name: 'Mastercard Black Agrícola',
      bank: 'Banco Agrícola',
      limit: 150000, // $1,500.00
      initialUsedBalance: 15000, // $150.00 used
      cutOffDay: 15,
      paymentDueDay: 30,
      usualPaymentDay: 29,
      color: '#4f46e5',
      isActive: true,
      createdAt: '2026-09-12T00:00:00.000Z',
      updatedAt: '2026-09-12T00:00:00.000Z',
    },
  ];

  const loans: Loan[] = [
    {
      id: 'loan_auto',
      name: 'Préstamo Personal / Vehículo',
      lender: 'BAC Credomatic',
      originalAmount: 500000, // $5,000.00
      remainingBalance: 320000, // $3,200.00
      installmentAmount: 14000, // $140.00
      frequency: 'mensual',
      paymentDay: 28,
      remainingInstallmentsCount: 23,
      paymentsMadeCount: 13,
      nextPaymentDate: '2026-09-28',
      preferredAccountId: 'acc_bac',
      notes: 'Cuota fija mensual debitada de cuenta BAC',
      createdAt: '2026-09-12T00:00:00.000Z',
      updatedAt: '2026-09-12T00:00:00.000Z',
    },
  ];

  const installmentPurchases: InstallmentPurchase[] = [
    {
      id: 'inst_laptop',
      concept: 'Laptop Trabajo Dell XPS',
      purchaseDate: '2026-05-15',
      totalAmount: 60000, // $600.00
      creditCardId: 'card_bac',
      totalInstallments: 12,
      installmentAmount: 5000, // $50.00 / mes
      firstPaymentDate: '2026-06-05',
      frequency: 'mensual',
      paidInstallmentsCount: 4, // 4 pagadas
      remainingInstallmentsCount: 8, // 8 restantes
      pendingBalance: 40000, // $400.00 pendiente
      notes: 'Compra sin intereses en Siman a 12 meses',
      createdAt: '2026-09-12T00:00:00.000Z',
      updatedAt: '2026-09-12T00:00:00.000Z',
    },
  ];

  const subscriptions: Subscription[] = [
    {
      id: 'sub_netflix',
      concept: 'Netflix 4K Premium',
      amount: 1599, // $15.99
      billingDay: 20,
      frequency: 'mensual',
      paymentMethodType: 'tarjeta_credito',
      creditCardId: 'card_bac',
      categoryId: 'cat_suscripciones',
      status: 'activa',
      monthlyExceptions: {},
      createdAt: '2026-09-12T00:00:00.000Z',
      updatedAt: '2026-09-12T00:00:00.000Z',
    },
    {
      id: 'sub_spotify',
      concept: 'Spotify Plan Familiar',
      amount: 599, // $5.99
      billingDay: 26,
      frequency: 'mensual',
      paymentMethodType: 'tarjeta_credito',
      creditCardId: 'card_x',
      categoryId: 'cat_suscripciones',
      status: 'activa',
      monthlyExceptions: {
        '2026-12': { paused: true, overrideAmount: 0 }, // Ejemplo del prompt: Spotify pausado en Dic $0
      },
      notes: 'Pausado en diciembre por regalo corporativo',
      createdAt: '2026-09-12T00:00:00.000Z',
      updatedAt: '2026-09-12T00:00:00.000Z',
    },
    {
      id: 'sub_gym',
      concept: 'Membresía Gimnasio SmartFit',
      amount: 3500, // $35.00
      billingDay: 17,
      frequency: 'mensual',
      paymentMethodType: 'banco',
      accountId: 'acc_bac',
      categoryId: 'cat_salud',
      status: 'activa',
      monthlyExceptions: {},
      createdAt: '2026-09-12T00:00:00.000Z',
      updatedAt: '2026-09-12T00:00:00.000Z',
    },
  ];

  const services: ServiceItem[] = [
    {
      id: 'srv_energia',
      company: 'AES Clesa / Delsur',
      serviceName: 'Energía Eléctrica Residencial',
      budgetedAmount: 4500, // $45.00
      estimatedDay: 22,
      paymentMethodType: 'banco',
      accountId: 'acc_bac',
      categoryId: 'cat_servicios',
      monthlyRecords: {
        '2026-09': {
          budgetedAmount: 4500,
          actualAmount: 4250, // $42.50
          status: 'pendiente',
        },
      },
      createdAt: '2026-09-12T00:00:00.000Z',
      updatedAt: '2026-09-12T00:00:00.000Z',
    },
    {
      id: 'srv_internet',
      company: 'Claro Telecom',
      serviceName: 'Internet Fibra 200 Mbps',
      budgetedAmount: 3800, // $38.00
      estimatedDay: 16,
      paymentMethodType: 'banco',
      accountId: 'acc_bac',
      categoryId: 'cat_servicios',
      monthlyRecords: {
        '2026-09': {
          budgetedAmount: 3800,
          actualAmount: 3800,
          status: 'pendiente',
        },
      },
      createdAt: '2026-09-12T00:00:00.000Z',
      updatedAt: '2026-09-12T00:00:00.000Z',
    },
    {
      id: 'srv_agua',
      company: 'ANDA',
      serviceName: 'Agua Potable',
      budgetedAmount: 1200, // $12.00
      estimatedDay: 24,
      paymentMethodType: 'efectivo',
      accountId: 'acc_efectivo',
      categoryId: 'cat_servicios',
      monthlyRecords: {
        '2026-09': {
          budgetedAmount: 1200,
          actualAmount: 1120,
          status: 'pendiente',
        },
      },
      createdAt: '2026-09-12T00:00:00.000Z',
      updatedAt: '2026-09-12T00:00:00.000Z',
    },
  ];

  const initialPosition: InitialPosition = {
    id: 'pos_inicial_principal',
    startDate: '2026-09-12',
    cashBalance: 10000, // $100.00
    bankBalances: {
      acc_bac: 85000, // $850.00
      acc_agricola: 30000, // $300.00
    },
    cardBalances: {
      card_bac: 42000, // $420.00
      card_x: 15000, // $150.00
    },
    loanBalances: {
      loan_auto: 320000, // $3,200.00
    },
    initialized: true,
    updatedAt: '2026-09-12T00:00:00.000Z',
  };

  const budgets: Budget[] = [
    {
      id: 'bgt_alim_sep26',
      year: 2026,
      month: 9,
      categoryId: 'cat_alimentacion',
      budgetedAmount: 35000, // $350.00
      notes: 'Presupuesto mensual para despensa y compras de casa',
    },
    {
      id: 'bgt_trans_sep26',
      year: 2026,
      month: 9,
      categoryId: 'cat_transporte',
      budgetedAmount: 10000, // $100.00
      notes: 'Gasolina y mantenimiento',
    },
    {
      id: 'bgt_entret_sep26',
      year: 2026,
      month: 9,
      categoryId: 'cat_entretenimiento',
      budgetedAmount: 8000, // $80.00
      notes: 'Salidas y ocio',
    },
    {
      id: 'bgt_serv_sep26',
      year: 2026,
      month: 9,
      categoryId: 'cat_servicios',
      budgetedAmount: 10000, // $100.00
      notes: 'Agua, luz, internet',
    },
    {
      id: 'bgt_salud_sep26',
      year: 2026,
      month: 9,
      categoryId: 'cat_salud',
      budgetedAmount: 5000, // $50.00
    },
  ];

  // Movements matching prompt scenario:
  // Sep 12: hoy (posicion inicial $850 banco, $100 cash)
  // Sep 13: Gasto $25
  // Sep 14: Ingreso Quincena $685
  // Sep 15: Gasto $120, Obligacion $350
  const transactions: Transaction[] = [
    {
      id: 'tx_demo_sep13_combustible',
      date: '2026-09-13',
      expectedDate: '2026-09-13',
      realDate: '2026-09-13',
      concept: 'Gasolina Estación Texaco',
      notes: 'Llenado semanal de combustible',
      type: 'gasto',
      categoryId: 'cat_transporte',
      subcategoryId: 'Gasolina',
      amount: 2500, // $25.00
      paymentMethodType: 'efectivo',
      accountId: 'acc_efectivo',
      status: 'planificado',
      createdAt: '2026-09-12T00:00:00.000Z',
      updatedAt: '2026-09-12T00:00:00.000Z',
    },
    {
      id: 'tx_demo_sep14_quincena',
      date: '2026-09-14',
      expectedDate: '2026-09-14',
      realDate: '2026-09-14',
      concept: 'Pago 1ra Quincena Septiembre',
      notes: 'Nómina depositada en cuenta BAC',
      type: 'ingreso',
      categoryId: 'cat_salario',
      subcategoryId: 'Salario Quincenal',
      amount: 68500, // $685.00
      paymentMethodType: 'banco',
      accountId: 'acc_bac',
      status: 'planificado',
      createdAt: '2026-09-12T00:00:00.000Z',
      updatedAt: '2026-09-12T00:00:00.000Z',
    },
    {
      id: 'tx_demo_sep15_super',
      date: '2026-09-15',
      expectedDate: '2026-09-15',
      realDate: '2026-09-15',
      concept: 'Supermercado Super Selectos',
      notes: 'Compra quincenal de víveres',
      type: 'gasto',
      categoryId: 'cat_alimentacion',
      subcategoryId: 'Supermercado',
      amount: 12000, // $120.00
      paymentMethodType: 'banco',
      accountId: 'acc_bac',
      status: 'planificado',
      createdAt: '2026-09-12T00:00:00.000Z',
      updatedAt: '2026-09-12T00:00:00.000Z',
    },
    {
      id: 'tx_demo_sep15_obligacion',
      date: '2026-09-15',
      expectedDate: '2026-09-15',
      realDate: '2026-09-15',
      concept: 'Liquidación Pago Obligación Financiera',
      notes: 'Pago programado de compromiso quincenal',
      type: 'pago_tarjeta',
      categoryId: 'cat_deuda_tarjetas',
      amount: 35000, // $350.00
      paymentMethodType: 'banco',
      accountId: 'acc_bac',
      creditCardId: 'card_bac',
      status: 'planificado',
      createdAt: '2026-09-12T00:00:00.000Z',
      updatedAt: '2026-09-12T00:00:00.000Z',
    },
    {
      id: 'tx_demo_sep18_almuerzo',
      date: '2026-09-18',
      expectedDate: '2026-09-18',
      concept: 'Almuerzo Restaurante Don Li',
      notes: 'Salida de viernes con colegas',
      type: 'gasto',
      categoryId: 'cat_alimentacion',
      subcategoryId: 'Restaurantes',
      amount: 2200, // $22.00
      paymentMethodType: 'tarjeta_credito',
      creditCardId: 'card_bac',
      status: 'planificado',
      createdAt: '2026-09-12T00:00:00.000Z',
      updatedAt: '2026-09-12T00:00:00.000Z',
    },
    {
      id: 'tx_demo_sep29_quincena2',
      date: '2026-09-29',
      expectedDate: '2026-09-29',
      concept: 'Pago 2da Quincena Septiembre',
      notes: 'Cierre de nómina mensual',
      type: 'ingreso',
      categoryId: 'cat_salario',
      subcategoryId: 'Salario Quincenal',
      amount: 68500, // $685.00
      paymentMethodType: 'banco',
      accountId: 'acc_bac',
      status: 'planificado',
      createdAt: '2026-09-12T00:00:00.000Z',
      updatedAt: '2026-09-12T00:00:00.000Z',
    },
  ];

  const itemBudgets: ItemBudget[] = [
    {
      id: 'ibgt_demo_walmart',
      year: 2026,
      month: 9,
      name: 'Supermercado Walmart',
      type: 'gasto',
      categoryId: 'cat_alimentacion',
      budgetedAmount: 22000, // $220.00
      projectedAmount: 22000,
      notes: 'Compras de despensa para el mes',
      createdAt: '2026-09-12T00:00:00.000Z',
      updatedAt: '2026-09-12T00:00:00.000Z',
    },
    {
      id: 'ibgt_demo_renta',
      year: 2026,
      month: 9,
      name: 'Renta Apartamento',
      type: 'gasto',
      categoryId: 'cat_vivienda',
      budgetedAmount: 35000, // $350.00
      projectedAmount: 35000,
      notes: 'Alquiler mensual con dueño directo',
      createdAt: '2026-09-12T00:00:00.000Z',
      updatedAt: '2026-09-12T00:00:00.000Z',
    },
    {
      id: 'ibgt_demo_gasolina',
      year: 2026,
      month: 9,
      name: 'Gasolina Puma',
      type: 'gasto',
      categoryId: 'cat_transporte',
      budgetedAmount: 6000, // $60.00
      projectedAmount: 6000,
      notes: 'Combustible mensual para traslados',
      createdAt: '2026-09-12T00:00:00.000Z',
      updatedAt: '2026-09-12T00:00:00.000Z',
    },
    {
      id: 'ibgt_demo_restaurantes',
      year: 2026,
      month: 9,
      name: 'Almuerzo Restaurante Don Li',
      type: 'gasto',
      categoryId: 'cat_alimentacion',
      budgetedAmount: 5000, // $50.00
      projectedAmount: 5000,
      notes: 'Salidas y comidas fuera de casa',
      createdAt: '2026-09-12T00:00:00.000Z',
      updatedAt: '2026-09-12T00:00:00.000Z',
    },
    {
      id: 'ibgt_demo_quincena1',
      year: 2026,
      month: 9,
      name: 'Pago 1ra Quincena Septiembre',
      type: 'ingreso',
      categoryId: 'cat_salario',
      budgetedAmount: 68500, // $685.00
      projectedAmount: 68500,
      notes: 'Nómina quincenal esperada',
      createdAt: '2026-09-12T00:00:00.000Z',
      updatedAt: '2026-09-12T00:00:00.000Z',
    },
    {
      id: 'ibgt_demo_quincena2',
      year: 2026,
      month: 9,
      name: 'Pago 2da Quincena Septiembre',
      type: 'ingreso',
      categoryId: 'cat_salario',
      budgetedAmount: 68500, // $685.00
      projectedAmount: 68500,
      notes: 'Nómina quincenal esperada',
      createdAt: '2026-09-12T00:00:00.000Z',
      updatedAt: '2026-09-12T00:00:00.000Z',
    },
  ];

  return {
    accounts,
    creditCards,
    categories,
    budgets,
    itemBudgets,
    installmentPurchases,
    loans,
    subscriptions,
    services,
    initialPosition,
    transactions,
  };
}
