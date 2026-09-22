import React, { useState } from 'react';
import { Plus, Zap, Banknote } from 'lucide-react';
import { motion } from 'motion/react';
import { QuickStreetExpenseModal } from './QuickStreetExpenseModal';
import { useFinance } from '../../context/FinanceContext';

export const MobileQuickExpenseFAB: React.FC = () => {
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
  const { setIsNewTxOpen } = useFinance();

  return (
    <>
      {/* Floating Action Button (Thumb zone: bottom-right above mobile nav bar) */}
      <div
        id="container-quick-fab"
        className="fixed bottom-20 right-3.5 z-30 md:hidden flex flex-col items-end pointer-events-none"
      >
        <motion.button
          id="btn-mobile-street-fab"
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => setIsQuickModalOpen(true)}
          className="pointer-events-auto flex items-center gap-1.5 pl-3 pr-3.5 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 text-white shadow-xl shadow-emerald-500/25 border border-white/20 active:scale-95 transition cursor-pointer group"
          title="Registrar gasto de calle en 5 segundos"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Plus className="w-4 h-4 stroke-[3]" />
          </div>
          <span className="text-xs font-black tracking-tight flex items-center gap-1">
            Gasto Rápido
            <span className="text-[10px] bg-black/25 px-1.5 py-0.2 rounded-full font-bold">5s</span>
          </span>
        </motion.button>
      </div>

      {/* 5-second Quick Street Expense Modal / Bottom Sheet */}
      <QuickStreetExpenseModal
        isOpen={isQuickModalOpen}
        onClose={() => setIsQuickModalOpen(false)}
        onOpenFullModal={() => {
          setIsQuickModalOpen(false);
          setIsNewTxOpen(true);
        }}
      />
    </>
  );
};
