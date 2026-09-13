import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { PlanNote, PlanNoteCategory, PlanNotePriority } from '../../types';
import { formatMoney, centsToDollars, dollarsToCents } from '../../utils/formatters';
import {
  StickyNote,
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Trash2,
  Edit2,
  Calendar,
  DollarSign,
  Tag,
  AlertCircle,
  ExternalLink,
  Filter,
  Sparkles,
  ShieldCheck,
  Check,
  X,
  Compass,
  ShoppingBag,
  ListTodo,
} from 'lucide-react';

const CATEGORY_CONFIG: Record<
  PlanNoteCategory,
  { label: string; icon: typeof StickyNote; colorClass: string; borderClass: string; bgClass: string }
> = {
  futuro_gasto: {
    label: 'Gasto Futuro',
    icon: DollarSign,
    colorClass: 'text-rose-400',
    borderClass: 'border-rose-500/30',
    bgClass: 'bg-rose-500/10',
  },
  compra_deseada: {
    label: 'Compra Deseada / Wishlist',
    icon: ShoppingBag,
    colorClass: 'text-amber-400',
    borderClass: 'border-amber-500/30',
    bgClass: 'bg-amber-500/10',
  },
  plan_meta: {
    label: 'Plan o Meta',
    icon: Compass,
    colorClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/30',
    bgClass: 'bg-emerald-500/10',
  },
  recordatorio: {
    label: 'Recordatorio',
    icon: ListTodo,
    colorClass: 'text-blue-400',
    borderClass: 'border-blue-500/30',
    bgClass: 'bg-blue-500/10',
  },
  general: {
    label: 'Nota General',
    icon: StickyNote,
    colorClass: 'text-indigo-400',
    borderClass: 'border-indigo-500/30',
    bgClass: 'bg-indigo-500/10',
  },
};

const PRIORITY_CONFIG: Record<PlanNotePriority, { label: string; badgeClass: string }> = {
  alta: {
    label: 'Alta',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  },
  media: {
    label: 'Media',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  baja: {
    label: 'Baja',
    badgeClass: 'bg-slate-700/50 text-slate-300 border-slate-600/40',
  },
};

const SAMPLE_NOTES = [
  {
    title: 'Cotizar renovación de seguro del vehículo',
    description: 'Revisar pólizas de Mapfre vs Allianz antes del vencimiento en Noviembre.',
    category: 'futuro_gasto' as PlanNoteCategory,
    priority: 'alta' as PlanNotePriority,
    targetDate: '2026-11-15',
    estimatedAmount: 48000, // $480.00
    tags: ['auto', 'seguro'],
  },
  {
    title: 'Monitor 27" 4K para oficina',
    description: 'Esperar descuentos de Black Friday. Comparar Dell UltraSharp con LG Ergo.',
    category: 'compra_deseada' as PlanNoteCategory,
    priority: 'media' as PlanNotePriority,
    targetDate: '2026-11-27',
    estimatedAmount: 35000, // $350.00
    url: 'https://amazon.com',
    tags: ['tecnologia', 'oficina'],
  },
  {
    title: 'Viaje familiar fin de año',
    description: 'Hacer itinerario de hospedaje y gasolina para 4 días en la montaña.',
    category: 'plan_meta' as PlanNoteCategory,
    priority: 'media' as PlanNotePriority,
    targetDate: '2026-12-20',
    estimatedAmount: 60000, // $600.00
    tags: ['viajes', 'familia'],
  },
];

export const NotesView: React.FC = () => {
  const { planNotes, savePlanNote, deletePlanNote, togglePlanNoteCompleted, settings } = useFinance();

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<PlanNote | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<PlanNoteCategory>('general');
  const [formPriority, setFormPriority] = useState<PlanNotePriority>('media');
  const [formTargetDate, setFormTargetDate] = useState('');
  const [formEstimatedAmount, setFormEstimatedAmount] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formTags, setFormTags] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Metrics (Purely informative, never added to real accounting)
  const metrics = useMemo(() => {
    const totalCount = planNotes.length;
    const completedCount = planNotes.filter((n) => n.isCompleted).length;
    const pendingCount = totalCount - completedCount;
    const informativeSum = planNotes.reduce((acc, curr) => acc + (curr.estimatedAmount || 0), 0);
    const pendingInformativeSum = planNotes
      .filter((n) => !n.isCompleted)
      .reduce((acc, curr) => acc + (curr.estimatedAmount || 0), 0);

    return {
      totalCount,
      completedCount,
      pendingCount,
      informativeSum,
      pendingInformativeSum,
    };
  }, [planNotes]);

  // Filtered notes list
  const filteredNotes = useMemo(() => {
    return planNotes.filter((note) => {
      const matchesSearch =
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (note.description && note.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (note.tags && note.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())));

      const matchesCat = selectedCategory === 'all' || note.category === selectedCategory;
      const matchesPriority = priorityFilter === 'all' || note.priority === priorityFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'pending' && !note.isCompleted) ||
        (statusFilter === 'completed' && note.isCompleted);

      return matchesSearch && matchesCat && matchesPriority && matchesStatus;
    });
  }, [planNotes, searchTerm, selectedCategory, priorityFilter, statusFilter]);

  const openNewModal = () => {
    setEditingNote(null);
    setFormTitle('');
    setFormDescription('');
    setFormCategory('general');
    setFormPriority('media');
    setFormTargetDate('');
    setFormEstimatedAmount('');
    setFormUrl('');
    setFormTags('');
    setIsModalOpen(true);
  };

  const openEditModal = (note: PlanNote) => {
    setEditingNote(note);
    setFormTitle(note.title);
    setFormDescription(note.description || '');
    setFormCategory(note.category);
    setFormPriority(note.priority);
    setFormTargetDate(note.targetDate || '');
    setFormEstimatedAmount(note.estimatedAmount ? centsToDollars(note.estimatedAmount).toString() : '');
    setFormUrl(note.url || '');
    setFormTags(note.tags ? note.tags.join(', ') : '');
    setIsModalOpen(true);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const parsedAmount = formEstimatedAmount.trim() ? dollarsToCents(parseFloat(formEstimatedAmount) || 0) : undefined;
    const parsedTags = formTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    await savePlanNote({
      id: editingNote?.id,
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      category: formCategory,
      priority: formPriority,
      targetDate: formTargetDate.trim() || undefined,
      estimatedAmount: parsedAmount,
      url: formUrl.trim() || undefined,
      tags: parsedTags,
      isCompleted: editingNote ? editingNote.isCompleted : false,
    });

    setIsModalOpen(false);
    showToast(editingNote ? 'Nota actualizada' : 'Nota guardada exitosamente');
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`¿Deseas eliminar la nota "${title}"?`)) {
      await deletePlanNote(id);
      showToast('Nota eliminada');
    }
  };

  const handleLoadSampleNotes = async () => {
    for (const sample of SAMPLE_NOTES) {
      await savePlanNote(sample);
    }
    showToast('Notas de ejemplo añadidas');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-blue-500/50 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-bottom-5">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header and Scope Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <StickyNote className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Listas & Notas de Planes</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {planNotes.length} {planNotes.length === 1 ? 'nota' : 'notas'}
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Espacio libre para anotar futuros gastos, planes, compras deseadas e ideas sin alterar tus balances, flujo diario ni presupuestos.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {planNotes.length === 0 && (
            <button
              onClick={handleLoadSampleNotes}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Cargar Ejemplos</span>
            </button>
          )}

          <button
            onClick={openNewModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Nota o Plan</span>
          </button>
        </div>
      </div>

      {/* Disclaimer Banner: 100% Non-Impact Isolation Guarantee */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-3.5 flex items-start gap-3 text-xs text-slate-300">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-white">Aislamiento Contable Total:</strong> Los montos estimados y fechas registradas en esta sección son <em>estrictamente informativos</em>. No descuentan saldo de tus cuentas ni se suman como egresos en tu flujo de caja hasta que decidas registrarlos como transacciones reales.
        </div>
      </div>

      {/* Metric Cards (Informative summary) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total de Notas
          </span>
          <div className="text-2xl font-bold font-mono text-white">
            {metrics.totalCount}
          </div>
          <p className="text-[11px] text-slate-400">
            {metrics.pendingCount} pendientes • {metrics.completedCount} listas o tachadas
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Gastos Pendientes Anotados
          </span>
          <div className="text-2xl font-bold font-mono text-indigo-400">
            {formatMoney(metrics.pendingInformativeSum, settings.currencySymbol)}
          </div>
          <p className="text-[11px] text-slate-400">
            Total informativo de lo que tienes en mente comprar o pagar
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Compras & Wishlist
          </span>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {planNotes.filter((n) => n.category === 'compra_deseada').length}
          </div>
          <p className="text-[11px] text-slate-400">
            Artículos o gadgets en lista de espera
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Planes & Metas
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {planNotes.filter((n) => n.category === 'plan_meta').length}
          </div>
          <p className="text-[11px] text-slate-400">
            Proyectos futuros sin fecha límite rígida
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, detalle o etiqueta..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Quick Filter Selectors */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">Todas las categorías</option>
            <option value="futuro_gasto">💸 Gasto Futuro</option>
            <option value="compra_deseada">🛍️ Compra Deseada (Wishlist)</option>
            <option value="plan_meta">🧭 Plan o Meta</option>
            <option value="recordatorio">📋 Recordatorio</option>
            <option value="general">📝 General</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">Todas las prioridades</option>
            <option value="alta">Prioridad Alta</option>
            <option value="media">Prioridad Media</option>
            <option value="baja">Prioridad Baja</option>
          </select>

          {/* Status Buttons */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                statusFilter === 'all' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                statusFilter === 'pending' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                statusFilter === 'completed' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tachadas
            </button>
          </div>
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
            <StickyNote className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              {planNotes.length === 0
                ? 'No tienes notas o planes registrados aún'
                : 'No se encontraron notas con el filtro seleccionado'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              {planNotes.length === 0
                ? 'Utiliza este apartado como tu libreta de borradores para anotar futuras compras, ideas de viajes o gastos previstos sin alterar tu presupuesto.'
                : 'Intenta limpiar el buscador o seleccionar "Todas las categorías".'}
            </p>
          </div>
          {planNotes.length === 0 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={openNewModal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Primera Nota</span>
              </button>
              <button
                onClick={handleLoadSampleNotes}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Cargar Ejemplos</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => {
            const catInfo = CATEGORY_CONFIG[note.category] || CATEGORY_CONFIG.general;
            const prioInfo = PRIORITY_CONFIG[note.priority] || PRIORITY_CONFIG.media;
            const CatIcon = catInfo.icon;

            return (
              <div
                key={note.id}
                className={`group rounded-2xl border p-4 shadow-lg transition-all duration-200 flex flex-col justify-between ${
                  note.isCompleted
                    ? 'bg-slate-900/50 border-slate-800/80 opacity-60'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:shadow-xl'
                }`}
              >
                <div>
                  {/* Card Header: Category + Priority + Checkbox */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${catInfo.bgClass} ${catInfo.colorClass} ${catInfo.borderClass}`}
                    >
                      <CatIcon className="w-3 h-3" />
                      <span>{catInfo.label}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${prioInfo.badgeClass}`}>
                        {prioInfo.label}
                      </span>

                      <button
                        onClick={() => togglePlanNoteCompleted(note.id)}
                        title={note.isCompleted ? 'Marcar como pendiente' : 'Tachar nota (completada)'}
                        className="text-slate-400 hover:text-emerald-400 transition cursor-pointer"
                      >
                        {note.isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-500 hover:text-emerald-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h3
                    className={`text-sm font-bold leading-snug mb-1.5 transition ${
                      note.isCompleted ? 'line-through text-slate-400' : 'text-white'
                    }`}
                  >
                    {note.title}
                  </h3>

                  {/* Description */}
                  {note.description && (
                    <p className="text-xs text-slate-300 leading-relaxed mb-3 whitespace-pre-line">
                      {note.description}
                    </p>
                  )}
                </div>

                <div>
                  {/* Meta Information: Estimated Amount & Target Date */}
                  <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                    {note.estimatedAmount !== undefined && note.estimatedAmount > 0 ? (
                      <div className="flex items-center gap-1 font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                        <DollarSign className="w-3 h-3" />
                        <span>{formatMoney(note.estimatedAmount, settings.currencySymbol)} (est.)</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Sin monto estimado</span>
                    )}

                    {note.targetDate && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{note.targetDate}</span>
                      </div>
                    )}
                  </div>

                  {/* Tags and Action Bar */}
                  <div className="mt-3 pt-2 flex items-center justify-between gap-2">
                    {/* Tags / URL */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {note.tags &&
                        note.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                      {note.url && (
                        <a
                          href={note.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded transition"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Enlace</span>
                        </a>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(note)}
                        title="Editar nota"
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(note.id, note.title)}
                        title="Eliminar nota"
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Note Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">
                  {editingNote ? 'Editar Nota o Plan' : 'Nueva Nota / Futuro Gasto'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveNote} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Título o Concepto *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ej: Cambio de llantas del carro, Regalo de aniversario..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Descripción / Detalles (opcional)
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Anota especificaciones, lugares donde viste el producto, enlaces o notas personales..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Categoría
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as PlanNoteCategory)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="futuro_gasto">💸 Gasto Futuro</option>
                    <option value="compra_deseada">🛍️ Compra Deseada (Wishlist)</option>
                    <option value="plan_meta">🧭 Plan o Meta</option>
                    <option value="recordatorio">📋 Recordatorio</option>
                    <option value="general">📝 General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Prioridad
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as PlanNotePriority)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="alta">🔴 Alta</option>
                    <option value="media">🟡 Media</option>
                    <option value="baja">⚪ Baja</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Monto Estimado ({settings.currencySymbol}) — Informativo
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formEstimatedAmount}
                    onChange={(e) => setFormEstimatedAmount(e.target.value)}
                    placeholder="0.00 (opcional)"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    No afecta cálculos ni presupuestos
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Fecha Objetivo o Horizonte
                  </label>
                  <input
                    type="date"
                    value={formTargetDate}
                    onChange={(e) => setFormTargetDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500 transition cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Enlace / URL de Referencia
                  </label>
                  <input
                    type="url"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Etiquetas (separadas por coma)
                  </label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="casa, auto, tecnologia"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer shadow-md shadow-blue-600/30"
                >
                  {editingNote ? 'Guardar Cambios' : 'Añadir Nota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
