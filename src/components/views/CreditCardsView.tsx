import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { CreditCard } from '../../types';
import { formatMoney, dollarsToCents, centsToDollars } from '../../utils/formatters';
import { NexaFinancialEngine } from '../../services/financialEngine';
import {
  CreditCard as CreditCardIcon,
  AlertTriangle,
  Calendar,
  Plus,
  ArrowRight,
  Edit2,
  Trash2,
  FileSpreadsheet,
  Image as ImageIcon,
  Search,
  Globe,
  Sparkles,
  Check,
  X,
} from 'lucide-react';
import { CalculatorButton } from '../common/CalculatorButton';
import {
  DigitalCreditCard,
  BANK_PRESETS,
  BANK_REGIONS,
  BankRegion,
  getBankPreset,
  getInternetBankLogoUrl,
} from '../common/DigitalCreditCard';

export const CreditCardsView: React.FC = () => {
  const {
    creditCards,
    transactions,
    saveCreditCard,
    deleteCreditCard,
    saveTransaction,
    accounts,
    todayStr,
    settings,
    setActiveTab,
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [bankLogoKey, setBankLogoKey] = useState<string>('bac');
  const [bankLogoUrl, setBankLogoUrl] = useState<string>('');
  const [bankFilterRegion, setBankFilterRegion] = useState<BankRegion>('todos');
  const [bankSearchQuery, setBankSearchQuery] = useState<string>('');
  const [network, setNetwork] = useState<'visa' | 'mastercard' | 'amex'>('visa');
  const [last4Digits, setLast4Digits] = useState<string>('');
  const [limitStr, setLimitStr] = useState('');
  const [usedStr, setUsedStr] = useState('');
  const [cutOffDay, setCutOffDay] = useState(20);
  const [paymentDueDay, setPaymentDueDay] = useState(5);
  const [usualPaymentDay, setUsualPaymentDay] = useState(4);

  // Filtered bank presets for selection
  const filteredBankPresets = useMemo(() => {
    return BANK_PRESETS.filter((preset) => {
      const matchesRegion = bankFilterRegion === 'todos' || preset.region === bankFilterRegion;
      const q = bankSearchQuery.toLowerCase().trim();
      if (!q) return matchesRegion;
      const matchesSearch =
        preset.name.toLowerCase().includes(q) ||
        preset.country.toLowerCase().includes(q) ||
        preset.aliases.some((a) => a.toLowerCase().includes(q));
      return matchesRegion && matchesSearch;
    });
  }, [bankFilterRegion, bankSearchQuery]);

  // Quick Payment state
  const [paymentCardId, setPaymentCardId] = useState<string | null>(null);
  const [paymentAmountStr, setPaymentAmountStr] = useState('');
  const [paymentAccountId, setPaymentAccountId] = useState(accounts[0]?.id || '');

  const openNewCardModal = () => {
    setEditingCard(null);
    setName('Visa Signature');
    setBank('BAC Credomatic');
    setBankLogoKey('bac');
    setBankLogoUrl('');
    setBankFilterRegion('todos');
    setBankSearchQuery('');
    setNetwork('visa');
    setLast4Digits('8842');
    setLimitStr('1500');
    setUsedStr('0');
    setCutOffDay(15);
    setPaymentDueDay(30);
    setUsualPaymentDay(29);
    setIsModalOpen(true);
  };

  const openEditModal = (card: CreditCard) => {
    setEditingCard(card);
    setName(card.name);
    setBank(card.bank);
    setBankLogoKey(card.bankLogoKey || getBankPreset(card.bank).id);
    setBankLogoUrl(card.bankLogoUrl || '');
    setBankFilterRegion('todos');
    setBankSearchQuery('');
    setNetwork(card.network || 'visa');
    setLast4Digits(card.last4Digits || '');
    setLimitStr(centsToDollars(card.limit).toFixed(2));
    setUsedStr(centsToDollars(card.initialUsedBalance).toFixed(2));
    setCutOffDay(card.cutOffDay);
    setPaymentDueDay(card.paymentDueDay);
    setUsualPaymentDay(card.usualPaymentDay || card.paymentDueDay - 1);
    setIsModalOpen(true);
  };

  const handleSelectBankPreset = (presetId: string) => {
    const p = BANK_PRESETS.find((item) => item.id === presetId);
    if (!p) return;
    setBankLogoKey(p.id);
    setBank(p.name);
    setNetwork(p.defaultNetwork);
    if (!name || name === 'Visa Signature' || name === 'Mastercard Black' || name === 'Tarjeta de Crédito') {
      setName(`${p.defaultNetwork === 'visa' ? 'Visa' : 'Mastercard'} ${p.name.split(' ')[0]}`);
    }
  };

  const handleBankNameChange = (newBank: string) => {
    setBank(newBank);
    // Auto-detect preset if typing bank name
    const detected = getBankPreset(newBank);
    if (detected) {
      setBankLogoKey(detected.id);
    }
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !limitStr) return;

    await saveCreditCard({
      id: editingCard?.id,
      name: name.trim(),
      bank: bank.trim() || 'Banco',
      bankLogoKey,
      bankLogoUrl: bankLogoUrl.trim() || undefined,
      network,
      last4Digits: last4Digits.trim() || undefined,
      limit: dollarsToCents(limitStr),
      initialUsedBalance: dollarsToCents(usedStr || 0),
      cutOffDay,
      paymentDueDay,
      usualPaymentDay,
    });

    setIsModalOpen(false);
  };

  const handleExecutePayment = async (card: CreditCard) => {
    const payCents = dollarsToCents(paymentAmountStr || 0);
    if (payCents <= 0) return;

    // Create payment transaction
    const targetCycle = NexaFinancialEngine.determinePaymentCycleKey(card, todayStr);
    await saveTransaction({
      concept: `Pago Tarjeta ${card.name}`,
      amount: payCents,
      date: todayStr,
      type: 'pago_tarjeta',
      paymentMethodType: 'banco',
      accountId: paymentAccountId,
      creditCardId: card.id,
      creditCardCycleKey: targetCycle,
      status: 'realizado',
      origin: `pago_tarjeta:${card.id}`,
      notes: `Liquidación de deuda de tarjeta (${targetCycle}). Descontado de cuenta bancaria.`,
    });

    setPaymentCardId(null);
    setPaymentAmountStr('');
  };

  const liquidityStart = settings.liquidityStartDate || '2026-09-15';

  const cardBalances = creditCards.map((c) => ({
    card: c,
    ...NexaFinancialEngine.calculateCardCurrentBalance(c, transactions, undefined, liquidityStart),
  }));

  const totalLimit = creditCards.reduce((acc, c) => acc + c.limit, 0);
  const totalUsed = cardBalances.reduce((acc, cb) => acc + cb.balance, 0);
  const totalAvailable = Math.max(0, totalLimit - totalUsed);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Aggregated Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CreditCardIcon className="w-5 h-5 text-rose-400" />
            <h2 className="text-base font-bold text-white">Tarjetas de Crédito & Billetera Digital</h2>
          </div>
          <p className="text-xs text-slate-400">
            Tarjetas digitales con logos de bancos oficiales, ciclos de corte y control estricto de deuda
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <CalculatorButton label="Calc" title="Abrir calculadora financiera rápida" />
          <button
            onClick={() => setActiveTab('estados-cuenta')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700/60 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-rose-400" />
            <span>Estados de Cuenta</span>
          </button>
          <button
            onClick={openNewCardModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md shadow-blue-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Tarjeta</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
          <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">
            Límite Total de Crédito
          </span>
          <div className="text-2xl font-black text-white font-mono">
            {formatMoney(totalLimit, settings.currencySymbol)}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
          <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">
            Deuda Acumulada Utilizada
          </span>
          <div className="text-2xl font-black text-rose-400 font-mono">
            {formatMoney(totalUsed, settings.currencySymbol)}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
          <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">
            Crédito Disponible Total
          </span>
          <div className="text-2xl font-black text-sky-400 font-mono">
            {formatMoney(totalAvailable, settings.currencySymbol)}
          </div>
        </div>
      </div>

      {/* Credit Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {creditCards.map((card) => {
          const { balance: currentBalance, available, usagePercentage: usedPct } =
            NexaFinancialEngine.calculateCardCurrentBalance(card, transactions, undefined, liquidityStart);
          const isHighUsage = usedPct >= 80;
          const isPayingThis = paymentCardId === card.id;

          return (
            <div
              key={card.id}
              className="rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 shadow-2xl space-y-4 relative overflow-hidden flex flex-col justify-between"
            >
              {/* Realistic Digital Card Representation with Authentic Bank Logo */}
              <div className="relative">
                <DigitalCreditCard
                  card={card}
                  balance={currentBalance}
                  available={available}
                  currencySymbol={settings.currencySymbol}
                />

                {/* Top-Right Quick Edit/Delete Overlays */}
                <div className="absolute top-3 right-3 flex items-center gap-1 z-20">
                  <button
                    onClick={() => openEditModal(card)}
                    className="p-1.5 rounded-xl bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/20 transition cursor-pointer shadow-lg"
                    title="Editar tarjeta y diseño de banco"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteCreditCard(card.id)}
                    className="p-1.5 rounded-xl bg-black/60 hover:bg-rose-950/90 text-white hover:text-rose-300 backdrop-blur-md border border-white/20 transition cursor-pointer shadow-lg"
                    title="Eliminar tarjeta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Limit, Used, Available Bars */}
              <div className="space-y-2 pt-2">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Deuda Utilizada (TDDC):</span>
                    <span className="text-xl font-black text-rose-400 font-mono">
                      {formatMoney(currentBalance, settings.currencySymbol)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-medium">Disponible:</span>
                    <span className="text-base font-bold text-sky-400 font-mono">
                      {formatMoney(available, settings.currencySymbol)}
                    </span>
                  </div>
                </div>

                {/* Usage progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isHighUsage ? 'bg-rose-500' : usedPct > 50 ? 'bg-amber-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(100, usedPct)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>{usedPct}% del límite consumido</span>
                  <span>Límite: {formatMoney(card.limit, settings.currencySymbol)}</span>
                </div>
              </div>

              {/* Dates and Billing Cycle */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">DÍA DE CORTE</span>
                  <span className="font-bold text-white">Día {card.cutOffDay}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">LÍMITE DE PAGO</span>
                  <span className="font-bold text-rose-300">Día {card.paymentDueDay}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">PAGO HABITUAL</span>
                  <span className="font-bold text-emerald-300">Día {card.usualPaymentDay || card.paymentDueDay - 1}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-1">
                {isPayingThis ? (
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <span className="text-xs font-bold text-white block">
                      Registrar Liquidación / Abono a Tarjeta
                    </span>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Monto a Pagar</label>
                        <input
                          type="number"
                          step="0.01"
                          value={paymentAmountStr}
                          onChange={(e) => setPaymentAmountStr(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Cuenta de Origen</label>
                        <select
                          value={paymentAccountId}
                          onChange={(e) => setPaymentAccountId(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                        >
                          {accounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setPaymentCardId(null)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-slate-400 hover:text-white"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleExecutePayment(card)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-sm"
                      >
                        Confirmar Pago
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => setActiveTab('estados-cuenta')}
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-200 transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-700/60"
                      title="Ver Estado de Cuenta y Detalle de Gastos"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-rose-400" />
                      <span>Estado de Cuenta</span>
                    </button>

                    <button
                      onClick={() => {
                        setPaymentCardId(card.id);
                        setPaymentAmountStr(centsToDollars(currentBalance).toFixed(2));
                      }}
                      className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/25"
                    >
                      <span>Liquidar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add/Edit Card */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-6 text-slate-100 my-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CreditCardIcon className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold text-white">
                  {editingCard ? 'Editar Tarjeta de Crédito Digital' : 'Nueva Tarjeta de Crédito Digital'}
                </h3>
              </div>
              <span className="text-xs text-slate-400">Personaliza banco, logo y diseño</span>
            </div>

            {/* LIVE DIGITAL CARD PREVIEW */}
            <div>
              <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Vista Previa de Tarjeta Digital
              </span>
              <DigitalCreditCard
                card={{
                  id: editingCard?.id || 'preview_card',
                  name: name.trim() || 'Nombre de Tarjeta',
                  bank: bank.trim() || 'Banco Emisor',
                  bankLogoKey,
                  bankLogoUrl: bankLogoUrl.trim() || undefined,
                  network,
                  last4Digits: last4Digits.trim() || '4589',
                  limit: dollarsToCents(limitStr || 0),
                  initialUsedBalance: dollarsToCents(usedStr || 0),
                  cutOffDay,
                  paymentDueDay,
                  usualPaymentDay,
                  isActive: true,
                  createdAt: '',
                  updatedAt: '',
                }}
                compact
                currencySymbol={settings.currencySymbol}
              />
            </div>

            <form onSubmit={handleSaveCard} className="space-y-4 text-xs">
              {/* Bank Preset Selection Catalog & Region Tabs */}
              <div className="space-y-2 p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-slate-200 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Pila de Bancos y Logos Oficiales ({filteredBankPresets.length})</span>
                  </label>

                  {/* Search input for banks */}
                  <div className="relative w-full sm:w-56">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={bankSearchQuery}
                      onChange={(e) => setBankSearchQuery(e.target.value)}
                      placeholder="Buscar banco o país..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-7 py-1 text-xs text-white placeholder-slate-500 focus:border-cyan-500/50"
                    />
                    {bankSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setBankSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Region Category Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {BANK_REGIONS.map((reg) => (
                    <button
                      key={reg.id}
                      type="button"
                      onClick={() => setBankFilterRegion(reg.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition cursor-pointer shrink-0 ${
                        bankFilterRegion === reg.id
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                          : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-850 border border-slate-800/80'
                      }`}
                    >
                      {reg.name}
                    </button>
                  ))}
                </div>

                {/* Bank Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1 bg-slate-900/40 rounded-xl border border-slate-800/60">
                  {filteredBankPresets.map((preset) => {
                    const isSelected = bankLogoKey === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectBankPreset(preset.id)}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition cursor-pointer text-center relative ${
                          isSelected
                            ? 'bg-blue-600/25 border-cyan-400 text-white ring-1 ring-cyan-400/50 shadow-md'
                            : 'bg-slate-900 border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-850'
                        }`}
                        title={`${preset.name} (${preset.country})`}
                      >
                        <div className="h-6 flex items-center justify-center scale-90">
                          {preset.renderLogo('h-6')}
                        </div>
                        <div className="w-full">
                          <span className="text-[10px] font-bold block truncate text-slate-200">
                            {preset.name}
                          </span>
                          <span className="text-[8px] text-slate-500 block truncate">
                            {preset.country}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Internet Logo Option & Clearbit / Web Sync */}
                <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-800/80 text-[11px]">
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-sky-400" />
                    <span className="text-slate-300 font-medium">Logo desde Internet:</span>
                    {bankLogoUrl ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Usando imagen web
                      </span>
                    ) : (
                      <span className="text-slate-500">Usando logo vectorial oficial</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {(() => {
                      const curPreset = BANK_PRESETS.find((p) => p.id === bankLogoKey);
                      const suggestedDomain = curPreset?.webDomain || (bank ? `${bank.toLowerCase().replace(/\s+/g, '')}.com` : '');
                      if (!suggestedDomain) return null;
                      const internetUrl = getInternetBankLogoUrl(suggestedDomain);
                      return (
                        <>
                          {bankLogoUrl ? (
                            <button
                              type="button"
                              onClick={() => setBankLogoUrl('')}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition"
                            >
                              Volver a Logo Vectorial
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setBankLogoUrl(internetUrl)}
                              className="px-2.5 py-1 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 font-semibold transition flex items-center gap-1.5"
                            >
                              <Globe className="w-3 h-3" />
                              <span>Cargar logo web ({suggestedDomain})</span>
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Form Input Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Nombre de la Tarjeta</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Visa Signature, Mastercard Black..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Banco Emisor</label>
                  <input
                    type="text"
                    value={bank}
                    onChange={(e) => handleBankNameChange(e.target.value)}
                    placeholder="Ej. BAC Credomatic, Santander, BBVA..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium"
                  />
                </div>
              </div>

              {/* Network, Last 4 digits & Custom Logo URL */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Red de Pago</label>
                  <select
                    value={network}
                    onChange={(e) => setNetwork(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold cursor-pointer"
                  >
                    <option value="visa">Visa</option>
                    <option value="mastercard">Mastercard</option>
                    <option value="amex">American Express</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Últimos 4 Dígitos</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={last4Digits}
                    onChange={(e) => setLast4Digits(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ej. 4589"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold text-center"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                    <span>Logo Web (URL opcional)</span>
                  </label>
                  <input
                    type="url"
                    value={bankLogoUrl}
                    onChange={(e) => setBankLogoUrl(e.target.value)}
                    placeholder="https://...logo.png"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-[11px]"
                  />
                </div>
              </div>

              {/* Limits and initial balance */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Límite de Crédito ({settings.currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={limitStr}
                    onChange={(e) => setLimitStr(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Deuda Inicial Usada ({settings.currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={usedStr}
                    onChange={(e) => setUsedStr(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                  />
                </div>
              </div>

              {/* Billing Cycle Days */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Día de Corte</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={cutOffDay}
                    onChange={(e) => setCutOffDay(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-white text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Límite de Pago</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={paymentDueDay}
                    onChange={(e) => setPaymentDueDay(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-white text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Pago Habitual</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={usualPaymentDay}
                    onChange={(e) => setUsualPaymentDay(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-white text-center font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer hover:bg-slate-750"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
                >
                  Guardar Tarjeta Digital
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
