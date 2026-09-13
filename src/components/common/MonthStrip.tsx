import React, { useRef } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { MONTH_NAMES_SHORT_ES, MONTH_NAMES_ES } from '../../utils/formatters';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';

export const MonthStrip: React.FC = () => {
  const {
    selectedYear,
    selectedMonth,
    setSelectedYear,
    setSelectedMonth,
    setSelectedPeriod,
    monthlyCloses,
  } = useFinance();

  const scrollRef = useRef<HTMLDivElement>(null);

  const years = [2026, 2027, 2028, 2029, 2030];

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      if (selectedYear > 2026) {
        setSelectedPeriod(selectedYear - 1, 12);
      }
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      if (selectedYear < 2030) {
        setSelectedPeriod(selectedYear + 1, 1);
      }
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -260 : 260;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full bg-slate-900/90 border-y border-slate-800/80 backdrop-blur sticky top-0 z-30 px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Year selector & active title */}
        <div className="flex items-center justify-between md:justify-start gap-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-blue-400" />
            <select
              id="select-active-year"
              aria-label="Seleccionar año"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 text-sm font-bold text-white rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {years.map((y) => (
                <option key={y} value={y} className="bg-slate-900 text-white">
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs font-semibold text-slate-300">
            Período: <span className="text-blue-400 font-bold">{MONTH_NAMES_ES[selectedMonth - 1]} {selectedYear}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              disabled={selectedYear === 2026 && selectedMonth === 1}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              disabled={selectedYear === 2030 && selectedMonth === 12}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Horizontal Scrolling month strip from 2026 up to 2030 */}
        <div className="relative flex items-center min-w-0 flex-1 md:max-w-2xl">
          <button
            onClick={() => handleScroll('left')}
            className="hidden sm:flex p-1 text-slate-400 hover:text-white bg-slate-900/90 rounded-l transition"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <div
            ref={scrollRef}
            className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 px-1 scroll-smooth w-full"
          >
            {years.map((y) => (
              <div key={y} className="flex items-center gap-1 flex-shrink-0">
                <span className="text-[10px] font-bold text-slate-300 px-1.5 py-0.5 bg-slate-950 rounded border border-slate-800">
                  {y}
                </span>
                {MONTH_NAMES_SHORT_ES.map((shortName, idx) => {
                  const m = idx + 1;
                  const isSelected = selectedYear === y && selectedMonth === m;
                  const monthKey = `${y}-${String(m).padStart(2, '0')}`;
                  const isClosed = monthlyCloses.some((c) => c.id === monthKey && c.isClosed);
                  const isInitial = y === 2026 && m === 9; // Sep 2026

                  return (
                    <button
                      key={`${y}-${m}`}
                      id={`btn-month-${y}-${m}`}
                      onClick={() => setSelectedPeriod(y, m)}
                      className={`relative px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50 ring-1 ring-blue-400'
                          : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800/60'
                      }`}
                    >
                      <span>{shortName}</span>
                      {isClosed && (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" title="Mes cerrado" />
                      )}
                      {isInitial && !isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" title="Mes de inicio" />
                      )}
                    </button>
                  );
                })}
                <div className="w-px h-4 bg-slate-800 mx-1" />
              </div>
            ))}
          </div>

          <button
            onClick={() => handleScroll('right')}
            className="hidden sm:flex p-1 text-slate-400 hover:text-white bg-slate-900/90 rounded-r transition"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
