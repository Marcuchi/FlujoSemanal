import React from 'react';
import { Wallet } from 'lucide-react';
import { formatCurrency } from '../utils';

interface SummaryProps {
  totalIncome: number;
  totalExpense: number;
  totalToBox: number;
  netTotal: number;
}

const SummaryItem = ({ label, value, icon: Icon, colorClass }: { label: string; value: number; icon: any; colorClass: string; }) => (
  <div className="flex items-center gap-3 bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700/50">
    <Icon className={colorClass} size={24} strokeWidth={1.5} />
    <div>
      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest leading-none mb-1">{label}</div>
      <div className="text-xl font-black text-slate-100 font-mono tracking-tighter leading-none">{formatCurrency(value)}</div>
    </div>
  </div>
);

export const Summary: React.FC<SummaryProps> = ({ totalToBox }) => {
  return (
    <div className="flex flex-row items-center justify-center md:justify-start">
      <SummaryItem label="Total en Tesoro" value={totalToBox} icon={Wallet} colorClass="text-indigo-400" />
    </div>
  );
};