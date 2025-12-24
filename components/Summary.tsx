
import React from 'react';
import { Wallet } from 'lucide-react';
import { formatCurrency } from '../utils';

interface SummaryProps {
  totalToBox: number;
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

export const Summary: React.FC<SummaryProps> = ({ totalToBox }) => {
  return (
    <div className="flex flex-row gap-6 md:gap-10 overflow-x-auto no-scrollbar items-center justify-center md:justify-start">
      <SummaryItem label="Total en Tesoro" value={totalToBox} icon={Wallet} colorClass="text-indigo-400" />
    </div>
  );
};
