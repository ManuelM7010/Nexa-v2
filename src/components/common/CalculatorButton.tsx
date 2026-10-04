import React from 'react';
import { Calculator } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

interface CalculatorButtonProps {
  className?: string;
  variant?: 'compact' | 'standard' | 'icon-only' | 'toolbar';
  label?: string;
  title?: string;
}

export const CalculatorButton: React.FC<CalculatorButtonProps> = ({
  className = '',
  variant = 'compact',
  label = 'Calculadora',
  title = 'Abrir calculadora rápida',
}) => {
  const { isCalculatorOpen, setIsCalculatorOpen } = useFinance();

  return (
    <button
      type="button"
      data-calculator-trigger="true"
      onClick={() => setIsCalculatorOpen(!isCalculatorOpen)}
      title={title}
      className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border text-xs font-semibold transition cursor-pointer whitespace-nowrap active:scale-95 ${
        isCalculatorOpen
          ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-sm shadow-amber-500/10'
          : 'bg-slate-900/90 hover:bg-slate-850 border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/40'
      } ${className}`}
    >
      <Calculator className={`w-3.5 h-3.5 flex-shrink-0 ${isCalculatorOpen ? 'text-amber-400' : 'text-amber-400/90'}`} />
      {variant !== 'icon-only' && (
        <span className={variant === 'compact' ? 'hidden sm:inline' : 'inline'}>{label}</span>
      )}
    </button>
  );
};
