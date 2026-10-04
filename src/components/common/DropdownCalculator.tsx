import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Calculator,
  X,
  Copy,
  Check,
  PlusCircle,
  RotateCcw,
  History,
  Delete,
} from 'lucide-react';
import { formatMoney } from '../../utils/formatters';

interface CalculationHistoryItem {
  id: string;
  expression: string;
  result: number;
  time: string;
}

interface DropdownCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  currencySymbol?: string;
  onUseInTransaction?: (amount: number) => void;
  positionMode?: 'absolute' | 'fixed';
}

export const DropdownCalculator: React.FC<DropdownCalculatorProps> = ({
  isOpen,
  onClose,
  currencySymbol = '$',
  onUseInTransaction,
  positionMode = 'absolute',
}) => {
  const [displayValue, setDisplayValue] = useState<string>('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState<boolean>(false);
  const [expression, setExpression] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [history, setHistory] = useState<CalculationHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('nexa_calc_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const popoverRef = useRef<HTMLDivElement>(null);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nexa_calc_history', JSON.stringify(history.slice(0, 15)));
    } catch {
      // ignore
    }
  }, [history]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('[data-calculator-trigger]')) {
        return;
      }
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle number input
  const inputDigit = useCallback((digit: string) => {
    if (waitingForOperand) {
      setDisplayValue(digit);
      setWaitingForOperand(false);
    } else {
      setDisplayValue((prev) => (prev === '0' ? digit : prev + digit));
    }
  }, [waitingForOperand]);

  // Handle decimal dot
  const inputDot = useCallback(() => {
    if (waitingForOperand) {
      setDisplayValue('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!displayValue.includes('.')) {
      setDisplayValue((prev) => prev + '.');
    }
  }, [waitingForOperand, displayValue]);

  // Handle clear
  const clearAll = useCallback(() => {
    setDisplayValue('0');
    setPrevValue(null);
    setOperation(null);
    setWaitingForOperand(false);
    setExpression('');
  }, []);

  // Handle backspace
  const backspace = useCallback(() => {
    if (waitingForOperand) return;
    setDisplayValue((prev) => {
      if (prev.length <= 1 || (prev.length === 2 && prev.startsWith('-'))) {
        return '0';
      }
      return prev.slice(0, -1);
    });
  }, [waitingForOperand]);

  // Handle sign invert (+/-)
  const toggleSign = useCallback(() => {
    const val = parseFloat(displayValue);
    if (!isNaN(val)) {
      setDisplayValue(String(-val));
    }
  }, [displayValue]);

  // Handle percentage (%)
  const inputPercent = useCallback(() => {
    const currentValue = parseFloat(displayValue);
    if (isNaN(currentValue)) return;

    if (prevValue !== null && operation) {
      // Percentage of previous value, e.g. 200 + 15% = 200 + 30
      const percentVal = (prevValue * currentValue) / 100;
      setDisplayValue(String(Number(percentVal.toFixed(4))));
    } else {
      const fixed = currentValue / 100;
      setDisplayValue(String(Number(fixed.toFixed(6))));
    }
  }, [displayValue, prevValue, operation]);

  // Calculate binary operation
  const performCalculation = (left: number, right: number, op: string): number => {
    switch (op) {
      case '+':
        return left + right;
      case '-':
        return left - right;
      case '×':
      case '*':
        return left * right;
      case '÷':
      case '/':
        return right !== 0 ? left / right : 0;
      default:
        return right;
    }
  };

  // Perform operation (+, -, *, /)
  const performOperation = useCallback((nextOperation: string) => {
    const inputValue = parseFloat(displayValue);

    if (prevValue === null) {
      setPrevValue(inputValue);
      setExpression(`${inputValue} ${nextOperation}`);
    } else if (operation) {
      const currentValue = prevValue || 0;
      const result = performCalculation(currentValue, inputValue, operation);
      const rounded = Number(result.toFixed(4));

      setPrevValue(rounded);
      setDisplayValue(String(rounded));
      setExpression(`${rounded} ${nextOperation}`);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  }, [displayValue, prevValue, operation]);

  // Equals (=)
  const handleEquals = useCallback(() => {
    if (prevValue === null || operation === null) return;

    const inputValue = parseFloat(displayValue);
    const result = performCalculation(prevValue, inputValue, operation);
    const rounded = Number(result.toFixed(4));

    const fullExp = `${prevValue} ${operation} ${inputValue}`;
    setExpression(`${fullExp} =`);
    setDisplayValue(String(rounded));
    setPrevValue(null);
    setOperation(null);
    setWaitingForOperand(true);

    // Record into history
    const newItem: CalculationHistoryItem = {
      id: `calc_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      expression: fullExp,
      result: rounded,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setHistory((prev) => [newItem, ...prev.slice(0, 14)]);
  }, [prevValue, operation, displayValue]);

  // Copy to clipboard
  const handleCopy = useCallback(() => {
    const num = parseFloat(displayValue);
    if (!isNaN(num)) {
      navigator.clipboard.writeText(String(num));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [displayValue]);

  // Transfer to new movement modal
  const handleUseInMovement = useCallback(() => {
    const num = Math.abs(parseFloat(displayValue));
    if (!isNaN(num) && num > 0) {
      if (onUseInTransaction) {
        onUseInTransaction(num);
      }
      onClose();
    }
  }, [displayValue, onUseInTransaction, onClose]);

  // Keyboard support when open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if target is an input outside
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        inputDigit(e.key);
      } else if (e.key === '.' || e.key === ',') {
        e.preventDefault();
        inputDot();
      } else if (e.key === '+') {
        e.preventDefault();
        performOperation('+');
      } else if (e.key === '-') {
        e.preventDefault();
        performOperation('-');
      } else if (e.key === '*') {
        e.preventDefault();
        performOperation('×');
      } else if (e.key === '/') {
        e.preventDefault();
        performOperation('÷');
      } else if (e.key === '%') {
        e.preventDefault();
        inputPercent();
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        backspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, inputDigit, inputDot, performOperation, inputPercent, handleEquals, backspace, onClose]);

  if (!isOpen) return null;

  const currentParsed = parseFloat(displayValue);
  const isValidNumber = !isNaN(currentParsed);

  return (
    <div
      ref={popoverRef}
      className={`${
        positionMode === 'fixed'
          ? 'fixed top-14 sm:top-16 right-3 sm:right-6 md:right-10 z-50'
          : 'absolute right-0 top-full mt-2 z-50'
      } w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl shadow-slate-950/90 overflow-hidden animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md`}
      role="dialog"
      aria-label="Calculadora financiera"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Calculator className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span className="text-xs font-bold text-white tracking-wide">
            Calculadora
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            title={showHistory ? 'Ocultar historial' : 'Ver historial'}
            className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
              showHistory
                ? 'bg-amber-500/20 text-amber-300'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Cerrar calculadora (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Screen / Display */}
      <div className="p-3.5 bg-slate-950/70 border-b border-slate-800/80 text-right">
        {/* Expression */}
        <div className="h-5 text-[11px] font-mono text-slate-400 truncate">
          {expression || '\u00A0'}
        </div>
        {/* Main Value */}
        <div className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight truncate select-all">
          {displayValue}
        </div>
        {/* Formatted Currency preview */}
        {isValidNumber && (
          <div className="text-[10px] font-mono text-emerald-400/90 pt-0.5 truncate">
            {formatMoney(Math.round(currentParsed * 100), currencySymbol)}
          </div>
        )}
      </div>

      {/* Collapsible History Drawer */}
      {showHistory && (
        <div className="max-h-40 overflow-y-auto p-2.5 bg-slate-950/90 border-b border-slate-800 space-y-1.5 scrollbar-thin">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold px-1 pb-1 border-b border-slate-800/60">
            <span>Últimos Cálculos</span>
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => setHistory([])}
                className="text-rose-400 hover:text-rose-300 cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="text-[11px] text-slate-500 text-center py-2 italic">
              Sin operaciones recientes
            </p>
          ) : (
            history.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setDisplayValue(String(item.result));
                  setExpression(`${item.expression} =`);
                  setWaitingForOperand(true);
                  setShowHistory(false);
                }}
                className="w-full text-left p-1.5 rounded-lg hover:bg-slate-800/80 transition flex items-center justify-between text-xs cursor-pointer group"
              >
                <span className="font-mono text-slate-400 text-[11px] truncate max-w-[170px]">
                  {item.expression} =
                </span>
                <span className="font-mono font-bold text-amber-300 group-hover:text-amber-200">
                  {item.result}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {/* Keypad Grid */}
      <div className="p-2.5 grid grid-cols-4 gap-1.5 bg-slate-900/90">
        {/* Row 1 */}
        <button
          type="button"
          onClick={clearAll}
          className="h-10 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 font-bold text-xs transition cursor-pointer flex items-center justify-center border border-slate-700/50"
          title="Borrar todo (Clear)"
        >
          AC
        </button>
        <button
          type="button"
          onClick={backspace}
          className="h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition cursor-pointer flex items-center justify-center border border-slate-700/50"
          title="Retroceso"
        >
          <Delete className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={inputPercent}
          className="h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition cursor-pointer flex items-center justify-center border border-slate-700/50"
        >
          %
        </button>
        <button
          type="button"
          onClick={() => performOperation('÷')}
          className={`h-10 rounded-xl font-bold text-sm transition cursor-pointer flex items-center justify-center border ${
            operation === '÷'
              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
              : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border-amber-500/30'
          }`}
        >
          ÷
        </button>

        {/* Row 2 */}
        <button
          type="button"
          onClick={() => inputDigit('7')}
          className="h-10 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-white font-semibold text-sm transition cursor-pointer flex items-center justify-center border border-slate-750"
        >
          7
        </button>
        <button
          type="button"
          onClick={() => inputDigit('8')}
          className="h-10 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-white font-semibold text-sm transition cursor-pointer flex items-center justify-center border border-slate-750"
        >
          8
        </button>
        <button
          type="button"
          onClick={() => inputDigit('9')}
          className="h-10 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-white font-semibold text-sm transition cursor-pointer flex items-center justify-center border border-slate-750"
        >
          9
        </button>
        <button
          type="button"
          onClick={() => performOperation('×')}
          className={`h-10 rounded-xl font-bold text-sm transition cursor-pointer flex items-center justify-center border ${
            operation === '×'
              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
              : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border-amber-500/30'
          }`}
        >
          ×
        </button>

        {/* Row 3 */}
        <button
          type="button"
          onClick={() => inputDigit('4')}
          className="h-10 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-white font-semibold text-sm transition cursor-pointer flex items-center justify-center border border-slate-750"
        >
          4
        </button>
        <button
          type="button"
          onClick={() => inputDigit('5')}
          className="h-10 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-white font-semibold text-sm transition cursor-pointer flex items-center justify-center border border-slate-750"
        >
          5
        </button>
        <button
          type="button"
          onClick={() => inputDigit('6')}
          className="h-10 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-white font-semibold text-sm transition cursor-pointer flex items-center justify-center border border-slate-750"
        >
          6
        </button>
        <button
          type="button"
          onClick={() => performOperation('-')}
          className={`h-10 rounded-xl font-bold text-sm transition cursor-pointer flex items-center justify-center border ${
            operation === '-'
              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
              : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border-amber-500/30'
          }`}
        >
          −
        </button>

        {/* Row 4 */}
        <button
          type="button"
          onClick={() => inputDigit('1')}
          className="h-10 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-white font-semibold text-sm transition cursor-pointer flex items-center justify-center border border-slate-750"
        >
          1
        </button>
        <button
          type="button"
          onClick={() => inputDigit('2')}
          className="h-10 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-white font-semibold text-sm transition cursor-pointer flex items-center justify-center border border-slate-750"
        >
          2
        </button>
        <button
          type="button"
          onClick={() => inputDigit('3')}
          className="h-10 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-white font-semibold text-sm transition cursor-pointer flex items-center justify-center border border-slate-750"
        >
          3
        </button>
        <button
          type="button"
          onClick={() => performOperation('+')}
          className={`h-10 rounded-xl font-bold text-sm transition cursor-pointer flex items-center justify-center border ${
            operation === '+'
              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
              : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border-amber-500/30'
          }`}
        >
          +
        </button>

        {/* Row 5 */}
        <button
          type="button"
          onClick={toggleSign}
          className="h-10 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white font-semibold text-xs transition cursor-pointer flex items-center justify-center border border-slate-750"
          title="Cambiar signo (+/-)"
        >
          ±
        </button>
        <button
          type="button"
          onClick={() => inputDigit('0')}
          className="h-10 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-white font-semibold text-sm transition cursor-pointer flex items-center justify-center border border-slate-750"
        >
          0
        </button>
        <button
          type="button"
          onClick={inputDot}
          className="h-10 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-white font-semibold text-sm transition cursor-pointer flex items-center justify-center border border-slate-750"
        >
          .
        </button>
        <button
          type="button"
          onClick={handleEquals}
          className="h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base transition cursor-pointer flex items-center justify-center shadow-md shadow-amber-500/30 border border-amber-400"
          title="Calcular resultado (=)"
        >
          =
        </button>
      </div>

      {/* Action Footer */}
      <div className="p-2.5 bg-slate-950 border-t border-slate-800/80 flex items-center gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition cursor-pointer border border-slate-700"
          title="Copiar resultado al portapapeles"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-bold">¡Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copiar</span>
            </>
          )}
        </button>

        {onUseInTransaction && (
          <button
            type="button"
            onClick={handleUseInMovement}
            disabled={!isValidNumber || currentParsed <= 0}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold text-white transition cursor-pointer shadow-md shadow-blue-600/30 border border-blue-500"
            title="Abrir formulario de nuevo movimiento con este monto"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Usar en Mov.</span>
          </button>
        )}
      </div>
    </div>
  );
};
