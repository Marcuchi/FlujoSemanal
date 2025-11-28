import React from 'react';
import { Trash2 } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionInputProps {
  transaction: Transaction;
  onChange: (id: string, field: keyof Transaction, value: string | number) => void;
  onRemove: (id: string) => void;
  placeholderTitle?: string;
  colorClass: string;
}

export const TransactionInput: React.FC<TransactionInputProps> = ({
  transaction,
  onChange,
  onRemove,
  placeholderTitle,
  colorClass
}) => {
  return (
    <div className="flex gap-2 items-center mb-1 group last:mb-0">
      <input
        type="text"
        value={transaction.title}
        onChange={(e) => onChange(transaction.id, 'title', e.target.value)}
        placeholder={placeholderTitle || "Descripción"}
        className="flex-1 text-xs border-b border-transparent group-hover:border-slate-200 focus:border-slate-400 bg-transparent py-1 px-1 focus:outline-none transition-colors text-slate-700 placeholder-slate-300"
      />
      <div className="relative w-20 flex-none">
        <span className={`absolute left-0 top-1 text-[10px] font-semibold opacity-50 ${colorClass}`}>$</span>
        <input
          type="number"
          min="0"
          value={transaction.amount === 0 ? '' : transaction.amount}
          onChange={(e) => onChange(transaction.id, 'amount', parseFloat(e.target.value) || 0)}
          placeholder="0"
          className="w-full text-right text-xs border-b border-slate-100 group-hover:border-slate-200 focus:border-slate-400 bg-transparent py-1 px-1 focus:outline-none transition-colors font-mono text-slate-700"
        />
      </div>
      <button
        onClick={() => onRemove(transaction.id)}
        className="flex-none w-5 h-5 flex items-center justify-center text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded hover:bg-red-50"
        title="Eliminar"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
};