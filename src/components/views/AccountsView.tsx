import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Account, AccountType } from '../../types';
import { formatMoney, dollarsToCents, centsToDollars } from '../../utils/formatters';
import {
  Wallet,
  Building2,
  Plus,
  ArrowLeftRight,
  Edit2,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

export const AccountsView: React.FC = () => {
  const {
    accounts,
    saveAccount,
    deleteAccount,
    saveTransaction,
    todayStr,
    settings,
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('banco');
  const [bankName, setBankName] = useState('');
  const [balanceStr, setBalanceStr] = useState('');

  // Internal transfer state
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || '');
  const [transferAmountStr, setTransferAmountStr] = useState('');

  const openNewModal = () => {
    setEditingAccount(null);
    setName('');
    setType('banco');
    setBankName('');
    setBalanceStr('0');
    setIsModalOpen(true);
  };

  const openEditModal = (acc: Account) => {
    setEditingAccount(acc);
    setName(acc.name);
    setType(acc.type);
    setBankName(acc.bankName || '');
    setBalanceStr(centsToDollars(acc.initialBalance).toFixed(2));
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await saveAccount({
      id: editingAccount?.id,
      name: name.trim(),
      type,
      bankName: bankName.trim() || undefined,
      initialBalance: dollarsToCents(balanceStr || 0),
    });

    setIsModalOpen(false);
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountCents = dollarsToCents(transferAmountStr || 0);
    if (amountCents <= 0 || fromAccountId === toAccountId) return;

    const fromAcc = accounts.find((a) => a.id === fromAccountId);
    const toAcc = accounts.find((a) => a.id === toAccountId);

    await saveTransaction({
      concept: `Transferencia: ${fromAcc?.name} -> ${toAcc?.name}`,
      amount: amountCents,
      date: todayStr,
      type: 'transferencia',
      paymentMethodType: fromAcc?.type === 'efectivo' ? 'efectivo' : 'banco',
      accountId: fromAccountId,
      transferToAccountId: toAccountId,
      status: 'realizado',
      notes: 'Transferencia interna entre cuentas propias',
    });

    setIsTransferOpen(false);
    setTransferAmountStr('');
  };

  const totalCashAndBanks = accounts.reduce((acc, a) => acc + a.initialBalance, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Cuentas Bancarias & Efectivo</h2>
          </div>
          <p className="text-xs text-slate-400">
            Administración de cuentas corrientes, de ahorro, billeteras y efectivo líquido
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTransferOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-blue-400" />
            <span>Transferir entre cuentas</span>
          </button>

          <button
            onClick={openNewModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white shadow-md shadow-blue-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Cuenta</span>
          </button>
        </div>
      </div>

      {/* Aggregate */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
        <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">
          Liquidez Consolidada en Cuentas y Efectivo
        </span>
        <div className="text-3xl font-black text-white">
          {formatMoney(totalCashAndBanks, settings.currencySymbol)}
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Suma directa de saldos disponibles hoy en tus {accounts.length} cuentas registradas
        </p>
      </div>

      {/* Accounts List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2.5 rounded-xl ${
                    acc.type === 'efectivo'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-blue-500/15 text-blue-400'
                  }`}
                >
                  {acc.type === 'efectivo' ? (
                    <Wallet className="w-5 h-5" />
                  ) : (
                    <Building2 className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{acc.name}</h3>
                  <span className="text-xs text-slate-400 capitalize">
                    {acc.type} {acc.bankName ? `• ${acc.bankName}` : ''}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(acc)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => deleteAccount(acc.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] text-slate-400 block font-semibold">SALDO DISPONIBLE</span>
              <span className="text-2xl font-black text-white font-mono">
                {formatMoney(acc.initialBalance, settings.currencySymbol)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100">
            <h3 className="text-base font-bold text-white mb-4">
              {editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Nombre de la Cuenta</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Cuenta Corriente BAC, Efectivo Billetera..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Tipo de Cuenta</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as AccountType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="banco">Banco</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="billetera">Billetera Digital</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Saldo ({settings.currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={balanceStr}
                    onChange={(e) => setBalanceStr(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
              </div>

              {type !== 'efectivo' && (
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Nombre de la Institución Bancaria</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Ej. BAC Credomatic, Banco Agrícola, Cuscatlán..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-md"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Transfer Between Accounts */}
      {isTransferOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100">
            <h3 className="text-base font-bold text-white mb-2">
              Transferencia Entre Cuentas Propias
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Mueve fondos entre tus cuentas o efectúa retiros de cajero sin alterar tu patrimonio total
            </p>

            <form onSubmit={handleExecuteTransfer} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Cuenta Origen (De)</label>
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatMoney(a.initialBalance, settings.currencySymbol)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Cuenta Destino (A)</label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  {accounts.filter((a) => a.id !== fromAccountId).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatMoney(a.initialBalance, settings.currencySymbol)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Monto a Transferir ({settings.currencySymbol})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={transferAmountStr}
                  onChange={(e) => setTransferAmountStr(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTransferOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-md"
                >
                  Transferir Fondos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
