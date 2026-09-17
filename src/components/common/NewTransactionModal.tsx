import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { TransactionType, PaymentMethodType, TransactionStatus } from '../../types';
import { formatMoney, dollarsToCents, centsToDollars, getTodayDateStr } from '../../utils/formatters';
import { X, ArrowRight, AlertCircle, CheckCircle, Plus, Zap } from 'lucide-react';
import { NewCategoryModal } from './NewCategoryModal';

export const NewTransactionModal: React.FC = () => {
  const {
    isNewTxOpen,
    setIsNewTxOpen,
    editingTransaction,
    setEditingTransaction,
    accounts,
    creditCards,
    savingsAccounts,
    categories,
    quickTemplates,
    todayStr,
    saveTransaction,
    settings,
  } = useFinance();

  const isOpen = isNewTxOpen || !!editingTransaction;

  const [concept, setConcept] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [date, setDate] = useState(getTodayDateStr());
  const [type, setType] = useState<TransactionType>('gasto');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethodType, setPaymentMethodType] = useState<PaymentMethodType>('banco');
  const [accountId, setAccountId] = useState('');
  const [creditCardId, setCreditCardId] = useState('');
  const [transferToAccountId, setTransferToAccountId] = useState('');
  const [savingsAccountId, setSavingsAccountId] = useState('');
  const [status, setStatus] = useState<TransactionStatus>('planificado');
  const [notes, setNotes] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  useEffect(() => {
    if (editingTransaction) {
      setConcept(editingTransaction.concept);
      setAmountStr(centsToDollars(editingTransaction.amount).toFixed(2));
      setDate(editingTransaction.date);
      setType(editingTransaction.type);
      setCategoryId(editingTransaction.categoryId || '');
      setPaymentMethodType(editingTransaction.paymentMethodType);
      setAccountId(editingTransaction.accountId || '');
      setCreditCardId(editingTransaction.creditCardId || '');
      setTransferToAccountId(editingTransaction.transferToAccountId || '');
      setSavingsAccountId(editingTransaction.savingsAccountId || savingsAccounts[0]?.id || '');
      setStatus(editingTransaction.status);
      setNotes(editingTransaction.notes || '');
    } else {
      setConcept('');
      setAmountStr('');
      setDate(getTodayDateStr());
      setType('gasto');
      const defaultCat = categories.find((c) => c.type === 'gasto')?.id || '';
      setCategoryId(defaultCat);
      setPaymentMethodType('banco');
      setAccountId(accounts.find((a) => a.type === 'banco')?.id || accounts[0]?.id || '');
      setCreditCardId(creditCards[0]?.id || '');
      setTransferToAccountId(accounts[1]?.id || '');
      setSavingsAccountId(savingsAccounts[0]?.id || '');
      setStatus('planificado');
      setNotes('');
    }
  }, [editingTransaction, isNewTxOpen, todayStr, categories, accounts, creditCards, savingsAccounts]);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsNewTxOpen(false);
    setEditingTransaction(null);
  };

  const parsedAmountCents = dollarsToCents(amountStr || 0);

  // Dynamic Contextual Balances
  const selectedAccount = accounts.find((a) => a.id === accountId);
  const selectedCash = accounts.find((a) => a.type === 'efectivo');
  const selectedCreditCard = creditCards.find((c) => c.id === creditCardId);

  // Calculate dynamic feedback
  let balanceBefore = 0;
  let balanceAfter = 0;
  let cardLimit = 0;
  let cardUsedBefore = 0;
  let cardUsedAfter = 0;
  let cardAvailBefore = 0;
  let cardAvailAfter = 0;

  if (paymentMethodType === 'efectivo' && selectedCash) {
    balanceBefore = selectedCash.initialBalance;
    balanceAfter = type === 'ingreso' ? balanceBefore + parsedAmountCents : balanceBefore - parsedAmountCents;
  } else if (paymentMethodType === 'banco' && selectedAccount) {
    balanceBefore = selectedAccount.initialBalance;
    balanceAfter = type === 'ingreso' ? balanceBefore + parsedAmountCents : balanceBefore - parsedAmountCents;
  } else if (paymentMethodType === 'tarjeta_credito' && selectedCreditCard) {
    cardLimit = selectedCreditCard.limit;
    cardUsedBefore = selectedCreditCard.initialUsedBalance;
    cardAvailBefore = Math.max(0, cardLimit - cardUsedBefore);
    if (type === 'pago_tarjeta') {
      cardUsedAfter = Math.max(0, cardUsedBefore - parsedAmountCents);
    } else {
      cardUsedAfter = cardUsedBefore + parsedAmountCents;
    }
    cardAvailAfter = Math.max(0, cardLimit - cardUsedAfter);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim()) return;
    if (parsedAmountCents <= 0) return;

    await saveTransaction({
      id: editingTransaction ? editingTransaction.id : undefined,
      concept: concept.trim(),
      amount: parsedAmountCents,
      date,
      type,
      categoryId: (type === 'transferencia' || type === 'aporte_ahorro' || type === 'retiro_ahorro') ? undefined : categoryId || undefined,
      paymentMethodType: type === 'gasto_desde_ahorro' ? 'ahorros' : paymentMethodType,
      accountId: (paymentMethodType === 'tarjeta_credito' || type === 'gasto_desde_ahorro') ? undefined : accountId,
      creditCardId: paymentMethodType === 'tarjeta_credito' ? creditCardId : undefined,
      transferToAccountId: type === 'transferencia' ? transferToAccountId : undefined,
      savingsAccountId: (type === 'aporte_ahorro' || type === 'retiro_ahorro' || type === 'gasto_desde_ahorro') ? savingsAccountId : undefined,
      status,
      notes: notes.trim() || undefined,
      origin: editingTransaction?.origin || 'manual',
    });

    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white">
              {editingTransaction ? 'Editar Movimiento' : 'Nuevo Movimiento Financiero'}
            </h2>
            <p className="text-xs text-slate-400">
              Registra o modifica un evento con impacto en tu liquidez
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Quick template auto-fill presets */}
          {!editingTransaction && quickTemplates.length > 0 && (
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">
                  Autocompletar con plantilla frecuente
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {quickTemplates.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => {
                      setConcept(tmpl.name);
                      setAmountStr(centsToDollars(tmpl.amount).toFixed(2));
                      setType(tmpl.type);
                      setCategoryId(tmpl.categoryId);
                      setPaymentMethodType(tmpl.paymentMethod);
                      if (tmpl.paymentMethod === 'tarjeta_credito' && tmpl.creditCardId) {
                        setCreditCardId(tmpl.creditCardId);
                      } else if (tmpl.accountId) {
                        setAccountId(tmpl.accountId);
                      }
                      if (tmpl.notes) setNotes(tmpl.notes);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-blue-900/30 border border-slate-800 hover:border-blue-500/40 text-xs text-slate-200 transition cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tmpl.color || '#3b82f6' }} />
                    <span className="font-medium">{tmpl.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatMoney(tmpl.amount, settings.currencySymbol)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Movement Type buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tipo de Operación
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { id: 'gasto', label: 'Gasto' },
                { id: 'ingreso', label: 'Ingreso' },
                { id: 'pago_tarjeta', label: 'Pago Tarjeta' },
                { id: 'transferencia', label: 'Transferencia' },
                { id: 'aporte_ahorro', label: 'Aporte Ahorro' },
                { id: 'retiro_ahorro', label: 'Retiro Ahorro' },
                { id: 'gasto_desde_ahorro', label: 'Gasto con Ahorro' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    const newType = t.id as TransactionType;
                    setType(newType);
                    if (newType === 'pago_tarjeta') {
                      setPaymentMethodType('banco');
                    } else if (newType === 'gasto_desde_ahorro') {
                      setPaymentMethodType('ahorros');
                    } else if (paymentMethodType === 'ahorros') {
                      setPaymentMethodType('banco');
                    }
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition cursor-pointer text-center ${
                    type === t.id
                      ? t.id === 'aporte_ahorro'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                        : t.id === 'retiro_ahorro'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                        : t.id === 'gasto_desde_ahorro'
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-900/30'
                        : 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                      : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Concept & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Concepto / Descripción *
              </label>
              <input
                type="text"
                required
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Ej. Supermercado, Salario quincenal, Gasolina..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Monto ({settings.currencySymbol}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-semibold placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Date & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Fecha del Movimiento *
                </label>
                <button
                  type="button"
                  onClick={() => setDate(getTodayDateStr())}
                  className="text-[11px] font-bold text-blue-400 hover:text-blue-300 transition cursor-pointer"
                  title="Establecer fecha de hoy"
                >
                  Hoy
                </button>
              </div>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Estado de Ejecución *
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setStatus('planificado')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                    status === 'planificado'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Planificado</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('realizado')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                    status === 'realizado'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Realizado</span>
                </button>
              </div>
            </div>
          </div>

          {/* Category (for gasto, ingreso, gasto_desde_ahorro) */}
          {(type === 'gasto' || type === 'ingreso' || type === 'gasto_desde_ahorro') && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Categoría
                </label>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer transition"
                >
                  <Plus className="w-3 h-3" />
                  <span>Nueva Categoría</span>
                </button>
              </div>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.type === 'ingreso' ? '🟢' : '🔴'} {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Special Selectors for APORTE A AHORRO */}
          {type === 'aporte_ahorro' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cuenta Bancaria de Origen *
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatMoney(a.initialBalance, settings.currencySymbol)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Fondo de Ahorro Destino *
                </label>
                <select
                  value={savingsAccountId}
                  onChange={(e) => setSavingsAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  {savingsAccounts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Special Selectors for RETIRO AHORRO (HACIA LIQUIDEZ) */}
          {type === 'retiro_ahorro' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Fondo de Ahorro de Origen *
                </label>
                <select
                  value={savingsAccountId}
                  onChange={(e) => setSavingsAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  {savingsAccounts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cuenta Bancaria Destino (Liquidez) *
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatMoney(a.initialBalance, settings.currencySymbol)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Special Selectors for GASTO DESDE AHORRO */}
          {type === 'gasto_desde_ahorro' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Fondo de Ahorro a Debitar *
              </label>
              <select
                value={savingsAccountId}
                onChange={(e) => setSavingsAccountId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                {savingsAccounts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Standard Payment Method / Account Selection (for ordinary types) */}
          {type !== 'aporte_ahorro' && type !== 'retiro_ahorro' && type !== 'gasto_desde_ahorro' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Medio de Pago / Cuenta
                </label>
                <select
                  value={paymentMethodType}
                  onChange={(e) => {
                    const val = e.target.value as PaymentMethodType;
                    setPaymentMethodType(val);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="banco">Cuenta Bancaria</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta_credito">Tarjeta de Crédito</option>
                </select>
              </div>

              {paymentMethodType === 'banco' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Cuenta Origen
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    {accounts
                      .filter((a) => a.type === 'banco')
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({formatMoney(a.initialBalance, settings.currencySymbol)})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {paymentMethodType === 'tarjeta_credito' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tarjeta de Crédito
                  </label>
                  <select
                    value={creditCardId}
                    onChange={(e) => setCreditCardId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    {creditCards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Disp: {formatMoney(c.limit - c.initialUsedBalance, settings.currencySymbol)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {type === 'transferencia' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Cuenta Destino
                  </label>
                  <select
                    value={transferToAccountId}
                    onChange={(e) => setTransferToAccountId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    {accounts
                      .filter((a) => a.id !== accountId)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* DYNAMIC CONTEXTUAL FEEDBACK BOX */}
          <div className="rounded-xl bg-slate-950 border border-slate-800/80 p-3.5 text-xs">
            <span className="font-bold text-slate-300 block mb-1.5 uppercase tracking-wider text-[10px]">
              Impacto Inmediato en Liquidez & Ahorros
            </span>

            {type === 'aporte_ahorro' && (
              <div className="text-emerald-400 flex items-center justify-between">
                <span>Descuenta de tu banco ordinario: <strong className="text-rose-400">-{formatMoney(parsedAmountCents, settings.currencySymbol)}</strong></span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                <span>Suma a tu fondo de ahorro: <strong className="text-emerald-400">+{formatMoney(parsedAmountCents, settings.currencySymbol)}</strong></span>
              </div>
            )}

            {type === 'retiro_ahorro' && (
              <div className="text-blue-400 flex items-center justify-between">
                <span>Resta de tu fondo de ahorro: <strong className="text-rose-400">-{formatMoney(parsedAmountCents, settings.currencySymbol)}</strong></span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                <span>Restaura liquidez en banco: <strong className="text-emerald-400">+{formatMoney(parsedAmountCents, settings.currencySymbol)}</strong></span>
              </div>
            )}

            {type === 'gasto_desde_ahorro' && (
              <div className="text-amber-400 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Debita únicamente de fondo de ahorro: <strong className="text-amber-300">-{formatMoney(parsedAmountCents, settings.currencySymbol)}</strong></span>
                  <span className="text-emerald-400 font-bold text-[11px]">Cero impacto en liquidez ordinaria (0.00)</span>
                </div>
              </div>
            )}

            {type !== 'aporte_ahorro' && type !== 'retiro_ahorro' && type !== 'gasto_desde_ahorro' && paymentMethodType === 'efectivo' && (
              <div className="flex items-center justify-between text-slate-300">
                <span>Efectivo disponible: <strong className="text-white">{formatMoney(balanceBefore, settings.currencySymbol)}</strong></span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                <span>Restante después: <strong className={balanceAfter < 0 ? 'text-rose-400' : 'text-emerald-400'}>{formatMoney(balanceAfter, settings.currencySymbol)}</strong></span>
              </div>
            )}

            {type !== 'aporte_ahorro' && type !== 'retiro_ahorro' && type !== 'gasto_desde_ahorro' && paymentMethodType === 'banco' && (
              <div className="flex items-center justify-between text-slate-300">
                <span>Saldo en cuenta: <strong className="text-white">{formatMoney(balanceBefore, settings.currencySymbol)}</strong></span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                <span>Saldo posterior: <strong className={balanceAfter < 0 ? 'text-rose-400' : 'text-emerald-400'}>{formatMoney(balanceAfter, settings.currencySymbol)}</strong></span>
              </div>
            )}

            {type !== 'aporte_ahorro' && type !== 'retiro_ahorro' && type !== 'gasto_desde_ahorro' && paymentMethodType === 'tarjeta_credito' && (
              <div className="space-y-1 text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Crédito disponible antes: <strong className="text-white">{formatMoney(cardAvailBefore, settings.currencySymbol)}</strong></span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  <span>Crédito disponible después: <strong className={cardAvailAfter < 0 ? 'text-rose-400' : 'text-sky-400'}>{formatMoney(cardAvailAfter, settings.currencySymbol)}</strong></span>
                </div>
                <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-900 flex justify-between">
                  <span>Deuda en tarjeta después: <strong className="text-amber-400">{formatMoney(cardUsedAfter, settings.currencySymbol)}</strong></span>
                  <span className="italic text-slate-300">Nota: No descuenta de tu banco hoy</span>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Comentario / Notas (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles adicionales, proveedor, etc."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition"
            >
              {editingTransaction ? 'Guardar Cambios' : 'Registrar Movimiento'}
            </button>
          </div>
        </form>
      </div>

      <NewCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        defaultType={type === 'ingreso' ? 'ingreso' : 'gasto'}
        onCategoryCreated={(newCat) => {
          setCategoryId(newCat.id);
        }}
      />
    </div>
  );
};
