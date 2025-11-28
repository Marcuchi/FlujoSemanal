import React from 'react';
import { ArrowUpCircle, ArrowDownCircle, Wallet, Scale } from 'lucide-react';
import { formatCurrency } from '../utils';

interface SummaryProps {
  totalIncome: number;
  totalExpense: number;
  totalToBox: number;
  netTotal: number;
}

const SummaryItem = ({ label, value, icon: Icon, colorClass }: { label: string; value: number; icon: any; colorClass: string; }) => (
  <div className="flex items-center gap-3">
    <Icon className={colorClass} size={24} strokeWidth={1.5} />
    <div>
      <div className="text-xs text-slate-400 uppercase font-semibold tracking-wider">{label}</div>
      <div className="text-base font-bold text-slate-100 font-mono tracking-tighter">{formatCurrency(value)}</div>
    </div>
  </div>
);

export const Summary: React.FC<SummaryProps> = ({ totalIncome, totalExpense, totalToBox, netTotal }) => {
  return (
    <div className="flex flex-row gap-6 md:gap-10 overflow-x-auto no-scrollbar items-center justify-center md:justify-start">
      <SummaryItem label="Ingresos Totales" value={totalIncome} icon={ArrowUpCircle} colorClass="text-emerald-400" />
      <div className="h-8 w-px bg-slate-700 hidden sm:block"></div>
      <SummaryItem label="Egresos Totales" value={totalExpense} icon={ArrowDownCircle} colorClass="text-rose-400" />
      <div className="h-8 w-px bg-slate-700 hidden sm:block"></div>
      <SummaryItem label="Ingresos Totales Netos" value={netTotal} icon={Scale} colorClass="text-cyan-400" />
      <div className="h-8 w-px bg-slate-700 hidden sm:block"></div>
      <SummaryItem label="Total en Caja" value={totalToBox} icon={Wallet} colorClass="text-indigo-400" />
    </div>
  );
};