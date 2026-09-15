import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { QuickTemplate, PaymentMethodType, TransactionType } from '../../types';
import { formatMoney, centsToDollars, dollarsToCents } from '../../utils/formatters';
import {
  Zap,
  Plus,
  Trash2,
  CheckCircle2,
  Coffee,
  Fuel,
  ShoppingCart,
  Utensils,
  Car,
  Wifi,
  Gift,
  Heart,
  DollarSign,
  X,
  CreditCard as CardIcon,
  Wallet,
  Coins,
  ArrowRight,
} from 'lucide-react';

const ICON_OPTIONS = [
  { name: 'Zap', icon: Zap },
  { name: 'Coffee', icon: Coffee },
  { name: 'Fuel', icon: Fuel },
  { name: 'ShoppingCart', icon: ShoppingCart },
  { name: 'Utensils', icon: Utensils },
  { name: 'Car', icon: Car },
  { name: 'Wifi', icon: Wifi },
  { name: 'Gift', icon: Gift },
  { name: 'Heart', icon: Heart },
  { name: 'DollarSign', icon: DollarSign },
];

const COLOR_OPTIONS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#64748b', // slate
];

const getIconComponent = (iconName?: string) => {
  switch (iconName) {
    case 'Coffee':
      return Coffee;
    case 'Fuel':
      return Fuel;
    case 'ShoppingCart':
      return ShoppingCart;
    case 'Utensils':
      return Utensils;
    case 'Car':
      return Car;
    case 'Wifi':
      return Wifi;
    case 'Gift':
      return Gift;
    case 'Heart':
      return Heart;
    case 'DollarSign':
      return DollarSign;
    case 'Zap':
    default:
      return Zap;
  }
};

interface QuickExpenseTemplatesProps {
  onSuccess?: (message: string) => void;
  compact?: boolean;
}

export const QuickExpenseTemplates: React.FC<QuickExpenseTemplatesProps> = ({
  onSuccess,
  compact = false,
}) => {
  const {
    quickTemplates,
    categories,
    accounts,
    creditCards,
    settings,
    saveQuickTemplate,
    deleteQuickTemplate,
    executeQuickTemplate,
  } = useFinance();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [executedTemplateId, setExecutedTemplateId] = useState<string | null>(null);
  const [customAmountModalTmpl, setCustomAmountModalTmpl] = useState<QuickTemplate | null>(null);
  const [customAmountStr, setCustomAmountStr] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [type, setType] = useState<TransactionType>('gasto');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('efectivo');
  const [accountId, setAccountId] = useState('');
  const [creditCardId, setCreditCardId] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Zap');
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const [notes, setNotes] = useState('');

  const openCreateForm = () => {
    setEditingId(null);
    setName('');
    setAmountStr('');
    setType('gasto');
    setCategoryId(categories.find((c) => c.type === 'gasto')?.id || categories[0]?.id || '');
    setPaymentMethod('efectivo');
    setAccountId(accounts.find((a) => a.type === 'efectivo')?.id || accounts[0]?.id || '');
    setCreditCardId(creditCards[0]?.id || '');
    setSelectedIcon('Zap');
    setSelectedColor('#3b82f6');
    setNotes('');
    setIsFormOpen(true);
  };

  const handleEdit = (tmpl: QuickTemplate) => {
    setEditingId(tmpl.id);
    setName(tmpl.name);
    setAmountStr(centsToDollars(tmpl.amount).toFixed(2));
    setType(tmpl.type);
    setCategoryId(tmpl.categoryId);
    setPaymentMethod(tmpl.paymentMethod);
    setAccountId(tmpl.accountId || '');
    setCreditCardId(tmpl.creditCardId || '');
    setSelectedIcon(tmpl.icon || 'Zap');
    setSelectedColor(tmpl.color || '#3b82f6');
    setNotes(tmpl.notes || '');
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const cents = dollarsToCents(amountStr || 0);
    if (cents <= 0) return;

    await saveQuickTemplate({
      id: editingId || undefined,
      name: name.trim(),
      amount: cents,
      type,
      categoryId: categoryId || categories[0]?.id || 'general',
      paymentMethod,
      accountId: paymentMethod === 'tarjeta_credito' ? undefined : accountId || undefined,
      creditCardId: paymentMethod === 'tarjeta_credito' ? creditCardId || undefined : undefined,
      icon: selectedIcon,
      color: selectedColor,
      notes: notes.trim() || undefined,
    });

    setIsFormOpen(false);
    if (onSuccess) onSuccess('Plantilla guardada con éxito');
  };

  const handleQuickExecute = async (tmpl: QuickTemplate) => {
    try {
      await executeQuickTemplate(tmpl.id);
      setExecutedTemplateId(tmpl.id);
      setTimeout(() => setExecutedTemplateId(null), 2000);
      if (onSuccess) {
        onSuccess(`"${tmpl.name}" registrado: -${formatMoney(tmpl.amount, settings.currencySymbol)}`);
      }
    } catch (err) {
      console.error('Error executing quick template:', err);
    }
  };

  const handleExecuteWithCustomAmount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAmountModalTmpl) return;
    const cents = dollarsToCents(customAmountStr || 0);
    if (cents <= 0) return;

    try {
      await executeQuickTemplate(customAmountModalTmpl.id, cents);
      const tmplName = customAmountModalTmpl.name;
      setCustomAmountModalTmpl(null);
      setCustomAmountStr('');
      if (onSuccess) {
        onSuccess(`"${tmplName}" registrado con monto ajustado: -${formatMoney(cents, settings.currencySymbol)}`);
      }
    } catch (err) {
      console.error('Error executing custom quick template:', err);
    }
  };

  const sortedTemplates = [...quickTemplates].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));

  return (
    <div className="space-y-3">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Gastos Frecuentes & Registro Rápido (1-Click)
          </h3>
        </div>

        <button
          onClick={openCreateForm}
          className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-2.5 py-1 rounded-lg transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nueva plantilla</span>
        </button>
      </div>

      {/* Grid of quick action buttons */}
      {sortedTemplates.length === 0 ? (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center text-xs text-slate-400">
          No hay plantillas frecuentes creadas. Haz clic en "+ Nueva plantilla" para crear accesos rápidos (ej. Café diario, Almuerzo, Gasolina).
        </div>
      ) : (
        <div
          className={
            compact
              ? 'grid grid-cols-2 sm:grid-cols-4 gap-2'
              : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5'
          }
        >
          {sortedTemplates.map((tmpl) => {
            const IconComp = getIconComponent(tmpl.icon);
            const isExecuted = executedTemplateId === tmpl.id;
            const category = categories.find((c) => c.id === tmpl.categoryId);

            return (
              <div
                key={tmpl.id}
                className={`relative group rounded-xl border p-3 flex flex-col justify-between transition-all ${
                  isExecuted
                    ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-900/20 scale-[0.98]'
                    : 'bg-slate-900/90 hover:bg-slate-850 border-slate-800 hover:border-slate-700 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${tmpl.color || '#3b82f6'}20`, color: tmpl.color || '#3b82f6' }}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{tmpl.name}</h4>
                      <p className="text-[10px] text-slate-400 truncate">
                        {category?.name || 'General'} • {tmpl.paymentMethod === 'tarjeta_credito' ? 'Tarjeta' : tmpl.paymentMethod === 'banco' ? 'Banco' : 'Efectivo'}
                      </p>
                    </div>
                  </div>

                  {/* Actions for editing / deleting */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(tmpl)}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 text-[10px]"
                      title="Editar plantilla"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => deleteQuickTemplate(tmpl.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 text-[10px]"
                      title="Eliminar plantilla"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Amount and 1-Click Action */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-1">
                  <div>
                    <span className="text-xs font-bold font-mono text-white">
                      {formatMoney(tmpl.amount, settings.currencySymbol)}
                    </span>
                    {tmpl.usageCount ? (
                      <span className="block text-[9px] text-slate-300 font-medium">
                        {tmpl.usageCount} usos
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Button for custom amount */}
                    <button
                      type="button"
                      onClick={() => {
                        setCustomAmountModalTmpl(tmpl);
                        setCustomAmountStr(centsToDollars(tmpl.amount).toFixed(2));
                      }}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold transition cursor-pointer"
                      title="Registrar con otro monto"
                    >
                      ± Monto
                    </button>

                    {/* Instant 1-Click execute */}
                    <button
                      type="button"
                      onClick={() => handleQuickExecute(tmpl)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer active:scale-95 ${
                        isExecuted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/30'
                      }`}
                      title={`Registrar hoy por ${formatMoney(tmpl.amount, settings.currencySymbol)}`}
                    >
                      {isExecuted ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>¡Listo!</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3 h-3" />
                          <span>Registrar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Custom Amount for quick template */}
      {customAmountModalTmpl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Registrar {customAmountModalTmpl.name}
                </h3>
              </div>
              <button
                onClick={() => setCustomAmountModalTmpl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteWithCustomAmount} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Monto a registrar hoy ({settings.currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  autoFocus
                  value={customAmountStr}
                  onChange={(e) => setCustomAmountStr(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-base font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Monto habitual: {formatMoney(customAmountModalTmpl.amount, settings.currencySymbol)}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCustomAmountModalTmpl(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white flex items-center gap-1"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Confirmar registro</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create or Edit Quick Template */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">
                {editingId ? 'Editar Plantilla Rápida' : 'Nueva Plantilla de Gasto Frecuente'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nombre del gasto / actividad *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Café matutino, Almuerzo laboral, Taxi..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Monto habitual ({settings.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Categoría *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Medio de Pago Habitual *
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'efectivo', label: 'Efectivo', icon: Coins },
                    { id: 'banco', label: 'Banco / Débito', icon: Wallet },
                    { id: 'tarjeta_credito', label: 'T. Crédito', icon: CardIcon },
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as PaymentMethodType)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                          paymentMethod === m.id
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {paymentMethod !== 'tarjeta_credito' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Cuenta asociada
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">(Cuenta predeterminada de efectivo/banco)</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.type})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tarjeta de crédito asociada
                  </label>
                  <select
                    value={creditCardId}
                    onChange={(e) => setCreditCardId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {creditCards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.bank})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Icon & Color selector */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Icono
                  </label>
                  <div className="grid grid-cols-5 gap-1">
                    {ICON_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.name}
                          type="button"
                          onClick={() => setSelectedIcon(opt.name)}
                          className={`p-1.5 rounded-lg flex items-center justify-center transition ${
                            selectedIcon === opt.name
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Color
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        className={`h-7 rounded-lg transition border-2 ${
                          selectedColor === c ? 'border-white scale-105' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nota o detalle predeterminado (Opcional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Tienda de la esquina, Gasolinera habitual..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md shadow-blue-900/30"
                >
                  {editingId ? 'Guardar Cambios' : 'Crear Plantilla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
