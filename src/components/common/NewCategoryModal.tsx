import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Category } from '../../types';
import { X, Tag, Plus, Check, Edit2 } from 'lucide-react';

interface NewCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: Category | null;
  defaultType?: 'gasto' | 'ingreso';
  onCategoryCreated?: (newCategory: Category) => void;
  onCategorySaved?: (savedCategory: Category) => void;
}

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#14b8a6', // teal
  '#f97316', // orange
  '#6366f1', // indigo
];

export const NewCategoryModal: React.FC<NewCategoryModalProps> = ({
  isOpen,
  onClose,
  categoryToEdit,
  defaultType = 'gasto',
  onCategoryCreated,
  onCategorySaved,
}) => {
  const { saveCategory, categories } = useFinance();

  const [name, setName] = useState('');
  const [type, setType] = useState<'gasto' | 'ingreso'>(defaultType);
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [subcategoriesStr, setSubcategoriesStr] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name);
      setType(categoryToEdit.type);
      setColor(categoryToEdit.color || PRESET_COLORS[0]);
      setSubcategoriesStr((categoryToEdit.subcategories || []).join(', '));
      setError(null);
    } else {
      setName('');
      setType(defaultType);
      setColor(PRESET_COLORS[0]);
      setSubcategoriesStr('');
      setError(null);
    }
  }, [categoryToEdit, defaultType, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('El nombre de la categoría es requerido.');
      return;
    }

    // Check duplicate (excluding the category itself if editing)
    const exists = categories.some(
      (c) =>
        c.name.toLowerCase() === trimmedName.toLowerCase() &&
        c.type === type &&
        (!categoryToEdit || c.id !== categoryToEdit.id)
    );
    if (exists) {
      setError(`Ya existe una categoría de ${type} con el nombre "${trimmedName}".`);
      return;
    }

    const subcategories = subcategoriesStr
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const catId = categoryToEdit?.id || `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const savedCategory: Category = {
      id: catId,
      name: trimmedName,
      type,
      color,
      icon: categoryToEdit?.icon || (type === 'ingreso' ? 'TrendingUp' : 'Tag'),
      subcategories,
    };

    await saveCategory(savedCategory);
    if (onCategorySaved) {
      onCategorySaved(savedCategory);
    } else if (onCategoryCreated) {
      onCategoryCreated(savedCategory);
    }

    setName('');
    setSubcategoriesStr('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              {categoryToEdit ? <Edit2 className="w-4 h-4" /> : <Tag className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {categoryToEdit ? 'Editar Categoría' : 'Nueva Categoría'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {categoryToEdit
                  ? 'Modifica el nombre, tipo, color o subcategorías'
                  : 'Personaliza tus ingresos y gastos'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Tipo de Categoría */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Tipo de Flujo *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('gasto')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                  type === 'gasto'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                    : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
                }`}
              >
                <span>🔴 Gasto / Egreso</span>
              </button>
              <button
                type="button"
                onClick={() => setType('ingreso')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                  type === 'ingreso'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
                }`}
              >
                <span>🟢 Ingreso</span>
              </button>
            </div>
          </div>

          {/* Nombre de la Categoría */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Nombre de la Categoría *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Ej. Mascotas, Educación, Inversiones, Salud..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Selector de Color */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Color Identificador
            </label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full transition flex items-center justify-center cursor-pointer ${
                    color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Subcategorías Opcionales */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Subcategorías (opcional, separadas por coma)
            </label>
            <input
              type="text"
              value={subcategoriesStr}
              onChange={(e) => setSubcategoriesStr(e.target.value)}
              placeholder="Ej: Veterinario, Comida de perro, Medicinas"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer shadow-md shadow-blue-600/30 flex items-center gap-1.5"
            >
              {categoryToEdit ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{categoryToEdit ? 'Actualizar Categoría' : 'Guardar Categoría'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
