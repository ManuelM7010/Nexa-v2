import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { GroceryItem } from '../../types';
import { formatMoney, centsToDollars, dollarsToCents, MONTH_NAMES_ES } from '../../utils/formatters';
import {
  ShoppingCart,
  Plus,
  Copy,
  Trash2,
  Edit2,
  CheckCircle2,
  Circle,
  TrendingDown,
  TrendingUp,
  Search,
  Store,
  Sparkles,
  ArrowRight,
  Info,
  Calendar,
  X,
  ListPlus,
} from 'lucide-react';

const GROCERY_CATEGORIES = [
  'Granos y Despensa',
  'Lácteos y Huevos',
  'Carnes y Proteínas',
  'Frutas y Verduras',
  'Panadería y Desayuno',
  'Bebidas y Jugos',
  'Limpieza del Hogar',
  'Cuidado Personal',
  'Snacks y Golosinas',
  'Congelados',
  'Otros',
];

const COMMON_UNITS = ['unid', 'kg', 'lb', 'litro', 'paq', 'bolsa', 'lata', 'caja'];

const DEFAULT_SAMPLE_ITEMS = [
  { name: 'Leche entera 1L', category: 'Lácteos y Huevos', unit: 'litro', quantity: 6, projectedPrice: 150, realPrice: 150, supermarket: 'Supermercado Central' },
  { name: 'Huevos docena', category: 'Lácteos y Huevos', unit: 'paq', quantity: 2, projectedPrice: 320, realPrice: 340, supermarket: 'Supermercado Central' },
  { name: 'Arroz blanco 1kg', category: 'Granos y Despensa', unit: 'kg', quantity: 3, projectedPrice: 180, realPrice: 175, supermarket: 'Mercado Local' },
  { name: 'Frijoles negros 1kg', category: 'Granos y Despensa', unit: 'kg', quantity: 2, projectedPrice: 210, realPrice: 210, supermarket: 'Mercado Local' },
  { name: 'Pechuga de pollo fresca', category: 'Carnes y Proteínas', unit: 'kg', quantity: 3, projectedPrice: 650, realPrice: 620, supermarket: 'Carnicería' },
  { name: 'Plátanos y Manzanas', category: 'Frutas y Verduras', unit: 'kg', quantity: 2.5, projectedPrice: 400, realPrice: 450, supermarket: 'Fruver' },
  { name: 'Aceite vegetal 1L', category: 'Granos y Despensa', unit: 'litro', quantity: 2, projectedPrice: 380, realPrice: 390, supermarket: 'Supermercado Central' },
  { name: 'Detergente líquido ropa', category: 'Limpieza del Hogar', unit: 'unid', quantity: 1, projectedPrice: 850, realPrice: 850, supermarket: 'Supermercado Central' },
  { name: 'Papel higiénico pack x12', category: 'Limpieza del Hogar', unit: 'paq', quantity: 1, projectedPrice: 720, realPrice: 700, supermarket: 'Supermercado Central' },
  { name: 'Café molido gourmet', category: 'Panadería y Desayuno', unit: 'paq', quantity: 1, projectedPrice: 550, realPrice: 580, supermarket: 'Supermercado Central' },
];

export const GroceryView: React.FC = () => {
  const {
    selectedYear,
    selectedMonth,
    setSelectedPeriod,
    groceryItems,
    saveGroceryItem,
    deleteGroceryItem,
    toggleGroceryItemPurchased,
    copyGroceryListToMonth,
    clearGroceryMonth,
    settings,
  } = useFinance();

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'purchased'>('all');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copySourceMonth, setCopySourceMonth] = useState<number>(selectedMonth === 1 ? 12 : selectedMonth - 1);
  const [copySourceYear, setCopySourceYear] = useState<number>(selectedMonth === 1 ? selectedYear - 1 : selectedYear);
  const [notification, setNotification] = useState<string | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState(GROCERY_CATEGORIES[0]);
  const [formUnit, setFormUnit] = useState('unid');
  const [formQuantity, setFormQuantity] = useState('1');
  const [formProjectedPrice, setFormProjectedPrice] = useState('0');
  const [formRealPrice, setFormRealPrice] = useState('0');
  const [formSupermarket, setFormSupermarket] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Filter items for current selected month and year
  const currentMonthItems = useMemo(() => {
    return groceryItems.filter((item) => item.year === selectedYear && item.month === selectedMonth);
  }, [groceryItems, selectedYear, selectedMonth]);

  // Filtered displayed items
  const filteredItems = useMemo(() => {
    return currentMonthItems.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.supermarket && item.supermarket.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCat = categoryFilter === 'all' || item.category === categoryFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'pending' && !item.isPurchased) ||
        (statusFilter === 'purchased' && item.isPurchased);

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [currentMonthItems, searchTerm, categoryFilter, statusFilter]);

  // Aggregate Metrics for the month
  const metrics = useMemo(() => {
    let totalProjected = 0;
    let totalReal = 0;
    let purchasedCount = 0;

    currentMonthItems.forEach((item) => {
      const projSubtotal = Math.round(item.quantity * item.projectedPrice);
      totalProjected += projSubtotal;

      // Real spend is calculated if item has real price or is purchased
      const realSubtotal = Math.round(item.quantity * item.realPrice);
      totalReal += realSubtotal;

      if (item.isPurchased) {
        purchasedCount++;
      }
    });

    const diff = totalProjected - totalReal; // positive = saved money vs projection

    return {
      totalProjected,
      totalReal,
      diff,
      totalCount: currentMonthItems.length,
      purchasedCount,
      percentPurchased: currentMonthItems.length > 0 ? Math.round((purchasedCount / currentMonthItems.length) * 100) : 0,
    };
  }, [currentMonthItems]);

  const openAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategory(GROCERY_CATEGORIES[0]);
    setFormUnit('unid');
    setFormQuantity('1');
    setFormProjectedPrice('0');
    setFormRealPrice('0');
    setFormSupermarket('');
    setFormNotes('');
    setIsEditModalOpen(true);
  };

  const openEditModal = (item: GroceryItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormUnit(item.unit || 'unid');
    setFormQuantity(item.quantity.toString());
    setFormProjectedPrice(centsToDollars(item.projectedPrice).toString());
    setFormRealPrice(centsToDollars(item.realPrice).toString());
    setFormSupermarket(item.supermarket || '');
    setFormNotes(item.notes || '');
    setIsEditModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const qty = parseFloat(formQuantity) || 1;
    const projCents = dollarsToCents(parseFloat(formProjectedPrice) || 0);
    const realCents = dollarsToCents(parseFloat(formRealPrice) || 0);

    await saveGroceryItem({
      id: editingItem?.id,
      year: selectedYear,
      month: selectedMonth,
      name: formName.trim(),
      category: formCategory,
      unit: formUnit,
      quantity: qty,
      projectedPrice: projCents,
      realPrice: realCents,
      supermarket: formSupermarket.trim() || undefined,
      notes: formNotes.trim() || undefined,
      isPurchased: editingItem ? editingItem.isPurchased : realCents > 0,
    });

    setIsEditModalOpen(false);
    showToast(editingItem ? 'Artículo actualizado correctamente' : 'Producto agregado a la lista');
  };

  const handleQuickRealPriceChange = async (item: GroceryItem, valueStr: string) => {
    const val = parseFloat(valueStr);
    const newRealCents = isNaN(val) ? 0 : dollarsToCents(val);
    await saveGroceryItem({
      id: item.id,
      year: item.year,
      month: item.month,
      name: item.name,
      quantity: item.quantity,
      projectedPrice: item.projectedPrice,
      realPrice: newRealCents,
      isPurchased: newRealCents > 0 ? true : item.isPurchased,
    });
  };

  const handleExecuteCopy = async () => {
    const res = await copyGroceryListToMonth(copySourceYear, copySourceMonth, selectedYear, selectedMonth);
    setIsCopyModalOpen(false);
    if (res.copiedCount > 0) {
      showToast(`¡Listo! Se copiaron ${res.copiedCount} productos de ${MONTH_NAMES_ES[copySourceMonth - 1]} a ${MONTH_NAMES_ES[selectedMonth - 1]}, actualizando los precios proyectados con lo que pagaste.`);
    } else {
      alert(`No se encontraron artículos en ${MONTH_NAMES_ES[copySourceMonth - 1]} ${copySourceYear} para copiar.`);
    }
  };

  const handleLoadSampleData = async () => {
    for (const item of DEFAULT_SAMPLE_ITEMS) {
      await saveGroceryItem({
        year: selectedYear,
        month: selectedMonth,
        name: item.name,
        category: item.category,
        unit: item.unit,
        quantity: item.quantity,
        projectedPrice: item.projectedPrice,
        realPrice: item.realPrice,
        supermarket: item.supermarket,
        isPurchased: true,
      });
    }
    showToast('Lista de muestra para el súper cargada con éxito.');
  };

  const handleClearMonth = async () => {
    if (window.confirm(`¿Deseas vaciar toda la lista de compras de ${MONTH_NAMES_ES[selectedMonth - 1]} ${selectedYear}?`)) {
      await clearGroceryMonth(selectedYear, selectedMonth);
      showToast('Lista de compras del mes vaciada.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 rounded-xl bg-emerald-600 text-white px-4 py-3 shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">
              Gestión de Súper & Lista de Mercado — {MONTH_NAMES_ES[selectedMonth - 1]} {selectedYear}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              Módulo Independiente
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Registra tu compra mensual con montos reales y genera automáticamente la lista del siguiente mes con esos precios proyectados como guía de compra.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCopyModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold transition cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Generar desde otro mes</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Proyectado */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Presupuesto Proyectado
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {formatMoney(metrics.totalProjected, settings.currencySymbol)}
          </div>
          <p className="text-[11px] text-slate-400">
            Estimado con base en listas o compras previas
          </p>
        </div>

        {/* Total Real Pagado */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Real Pagado
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {formatMoney(metrics.totalReal, settings.currencySymbol)}
          </div>
          <p className="text-[11px] text-slate-400">
            Monto acumulado efectivamente gastado en caja
          </p>
        </div>

        {/* Variación / Ahorro */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Variación vs Presupuesto
          </div>
          <div className="flex items-center gap-1.5">
            {metrics.diff >= 0 ? (
              <TrendingDown className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingUp className="w-4 h-4 text-rose-400" />
            )}
            <span
              className={`text-xl font-bold font-mono ${
                metrics.diff >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatMoney(Math.abs(metrics.diff), settings.currencySymbol)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {metrics.diff >= 0 ? 'Ahorro a favor en compras' : 'Sobrecosto respecto a la proyección'}
          </p>
        </div>

        {/* Progreso de la Lista */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Progreso de Compra
          </div>
          <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
            <span className="font-bold text-white">
              {metrics.purchasedCount} de {metrics.totalCount} comprados
            </span>
            <span className="font-mono text-emerald-400 font-bold">{metrics.percentPurchased}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${metrics.percentPurchased}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Buscar por producto, supermercado o nota..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-white placeholder:text-slate-400 focus:outline-none"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
          >
            <option value="all">Todas las categorías</option>
            {GROCERY_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <div className="flex rounded-xl bg-slate-950 border border-slate-800 p-0.5">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({currentMonthItems.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setStatusFilter('purchased')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                statusFilter === 'purchased'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Comprados
            </button>
          </div>

          {currentMonthItems.length > 0 && (
            <button
              onClick={handleClearMonth}
              title="Vaciar lista del mes"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Table or Empty State */}
      {currentMonthItems.length === 0 ? (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              No hay productos registrados para {MONTH_NAMES_ES[selectedMonth - 1]} {selectedYear}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Puedes agregar artículos uno a uno, cargar una plantilla básica o generar la lista automáticamente a partir de un mes anterior con los precios reales pagados.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Primer Producto</span>
            </button>

            <button
              onClick={() => setIsCopyModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold transition cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar desde otro mes</span>
            </button>

            <button
              onClick={handleLoadSampleData}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Cargar lista típica de súper</span>
            </button>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-8 text-center text-xs text-slate-400">
          No se encontraron productos con el filtro aplicado.
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 w-10 text-center">Estado</th>
                  <th className="py-3 px-4">Artículo / Producto</th>
                  <th className="py-3 px-3">Categoría</th>
                  <th className="py-3 px-3 text-center">Cant / Unidad</th>
                  <th className="py-3 px-3 text-right">Precio Proy.</th>
                  <th className="py-3 px-3 text-right">Subtotal Proy.</th>
                  <th className="py-3 px-4 text-right">Precio Real Pagado</th>
                  <th className="py-3 px-3 text-right">Subtotal Real</th>
                  <th className="py-3 px-3 text-right">Variación</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredItems.map((item) => {
                  const projSubtotal = Math.round(item.quantity * item.projectedPrice);
                  const realSubtotal = Math.round(item.quantity * item.realPrice);
                  const itemDiff = projSubtotal - realSubtotal;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-800/40 transition ${
                        item.isPurchased ? 'bg-emerald-950/10' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleGroceryItemPurchased(item.id)}
                          title={item.isPurchased ? 'Marcar como pendiente' : 'Marcar como comprado'}
                          className="text-slate-400 hover:text-emerald-400 transition"
                        >
                          {item.isPurchased ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </td>

                      {/* Name & Supermarket / Notes */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span className={item.isPurchased ? 'line-through text-slate-400' : ''}>
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          {item.supermarket && (
                            <span className="flex items-center gap-1">
                              <Store className="w-3 h-3 text-sky-400" />
                              <span>{item.supermarket}</span>
                            </span>
                          )}
                          {item.notes && <span className="italic text-slate-400">"{item.notes}"</span>}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300">
                          {item.category}
                        </span>
                      </td>

                      {/* Quantity & Unit */}
                      <td className="py-3 px-3 text-center font-mono text-slate-300">
                        {item.quantity} {item.unit || 'unid'}
                      </td>

                      {/* Projected Unit Price */}
                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        {formatMoney(item.projectedPrice, settings.currencySymbol)}
                      </td>

                      {/* Projected Subtotal */}
                      <td className="py-3 px-3 text-right font-mono text-slate-300 font-semibold">
                        {formatMoney(projSubtotal, settings.currencySymbol)}
                      </td>

                      {/* Inline Editable Real Unit Price */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-slate-400 text-xs">{settings.currencySymbol}</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={centsToDollars(item.realPrice)}
                            onBlur={(e) => handleQuickRealPriceChange(item, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleQuickRealPriceChange(item, (e.target as HTMLInputElement).value);
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                            className="w-20 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg px-2 py-1 text-right text-xs font-mono font-bold text-white focus:outline-none"
                          />
                        </div>
                      </td>

                      {/* Real Subtotal */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                        {formatMoney(realSubtotal, settings.currencySymbol)}
                      </td>

                      {/* Variation */}
                      <td className="py-3 px-3 text-right font-mono text-[11px]">
                        {item.realPrice > 0 ? (
                          <span
                            className={
                              itemDiff >= 0
                                ? 'text-emerald-400 font-semibold'
                                : 'text-rose-400 font-semibold'
                            }
                          >
                            {itemDiff >= 0 ? '-' : '+'}
                            {formatMoney(Math.abs(itemDiff), settings.currencySymbol)}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(item)}
                            title="Editar artículo"
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteGroceryItem(item.id)}
                            title="Eliminar artículo"
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer Summary */}
          <div className="bg-slate-950/80 border-t border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-400">
              Mostrando {filteredItems.length} de {currentMonthItems.length} artículos en la lista
            </span>
            <div className="flex items-center gap-6 font-mono text-xs">
              <div>
                <span className="text-slate-400 mr-2">Total Proyectado:</span>
                <span className="text-white font-bold">
                  {formatMoney(metrics.totalProjected, settings.currencySymbol)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 mr-2">Total Real:</span>
                <span className="text-emerald-400 font-bold">
                  {formatMoney(metrics.totalReal, settings.currencySymbol)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Agregar / Editar Producto */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-400" />
                <span>{editingItem ? 'Editar Producto del Súper' : 'Agregar Producto al Súper'}</span>
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nombre del Producto / Artículo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Leche descremada, Huevos, Manzanas gala..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Categoría</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    {GROCERY_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Supermercado o Tienda</label>
                  <input
                    type="text"
                    placeholder="Ej. Walmart, La Torre, Mercado..."
                    value={formSupermarket}
                    onChange={(e) => setFormSupermarket(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Cantidad</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Unidad</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    {COMMON_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Precio Proy. ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formProjectedPrice}
                    onChange={(e) => setFormProjectedPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Precio Real ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formRealPrice}
                    onChange={(e) => setFormRealPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notas u Observaciones</label>
                <input
                  type="text"
                  placeholder="Ej. Comprar marca X o si está en oferta 2x1..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30"
                >
                  {editingItem ? 'Guardar Cambios' : 'Agregar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Generar lista desde otro mes */}
      {isCopyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Copy className="w-4 h-4 text-blue-400" />
                <span>Generar Lista desde Mes Anterior</span>
              </h3>
              <button
                onClick={() => setIsCopyModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Selecciona el mes origen (por ejemplo, Septiembre). Todos los artículos comprados se copiarán al mes actual (<strong>{MONTH_NAMES_ES[selectedMonth - 1]} {selectedYear}</strong>).
            </p>

            <div className="rounded-xl bg-blue-950/30 border border-blue-900/40 p-3 flex items-start gap-2.5 text-xs text-blue-200">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p>
                <strong>Regla de proyección inteligente:</strong> El monto real que pagaste en el mes origen se convertirá automáticamente en el <strong>precio proyectado</strong> para este nuevo mes, reseteando el precio real a cero para servirte de guía de compra.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mes de Origen</label>
                <select
                  value={copySourceMonth}
                  onChange={(e) => setCopySourceMonth(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  {MONTH_NAMES_ES.map((name, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Año de Origen</label>
                <input
                  type="number"
                  value={copySourceYear}
                  onChange={(e) => setCopySourceYear(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800 text-xs">
              <button
                onClick={() => setIsCopyModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteCopy}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-600/30"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Generar Lista</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
