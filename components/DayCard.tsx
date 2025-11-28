import React from 'react';
import { Plus, Archive, TrendingUp, TrendingDown, Briefcase, History, Wallet } from 'lucide-react';
import { DayData, Transaction, TransactionType } from '../types';
import { TransactionItem } from './TransactionItem';
import { formatCurrency, generateId } from '../utils';

interface DayCardProps {
  dayData: DayData;
  onUpdate: (updatedDay: DayData) => void;
  previousBalance?: number;
}

export const DayCard: React.FC<DayCardProps> = ({ dayData, onUpdate, previousBalance = 0 }) => {
  
  const handleAddTransaction = (type: TransactionType) => {
    const newTransaction: Transaction = {
      id: generateId(),
      title: type === 'toBox' ? 'Caja' : '',
      amount: 0,
    };
    onUpdate({
      ...dayData,
      [type]: [...dayData[type], newTransaction],
    });
  };

  const handleUpdateTransaction = (
    type: TransactionType,
    id: string,
    updates: Partial<Transaction>
  ) => {
    const updatedList = dayData[type].map((t) =>
      t.id === id ? { ...t, ...updates } : t
    );
    onUpdate({ ...dayData, [type]: updatedList });
  };

  const handleRemoveTransaction = (type: TransactionType, id:string) => {
    const updatedList = dayData[type].filter((t) => t.id !== id);
    onUpdate({ ...dayData, [type]: updatedList });
  };

  const totalIncome = React.useMemo(() => dayData.incomes.reduce((acc, curr) => acc + curr.amount, 0), [dayData.incomes]);
  const totalExpense = React.useMemo(() => dayData.expenses.reduce((acc, curr) => acc + curr.amount, 0), [dayData.expenses]);
  const totalToBox = React.useMemo(() => dayData.toBox.reduce((acc, curr) => acc + curr.amount, 0), [dayData.toBox]);
  
  const totalOficina = previousBalance + totalIncome - totalExpense - totalToBox;
  const showInitialAmount = dayData.id !== 'monday' && previousBalance > 0;

  const MetricDisplay = ({ label, value, icon: Icon, colorClass, borderClass }: { label: string; value: number; icon: any; colorClass: string; borderClass?: string }) => (
    <div className={`flex items-center justify-between p-2 rounded-lg bg-slate-800 border ${borderClass || 'border-slate-700'}`}>
      <div className="flex items-center gap-2">
        <Icon size={14} className={colorClass} />
        <span className="text-xs font-semibold text-slate-400">{label}</span>
      </div>
      <span className={`text-sm font-bold font-mono ${colorClass}`}>{formatCurrency(value)}</span>
    </div>
  );

  return (
    <section className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 flex flex-col w-[340px] h-full overflow-hidden flex-shrink-0">
      {/* Day Header */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex-none relative">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wide flex-1 pl-1">{dayData.name}</h2>
        </div>
        <div className="space-y-1.5">
          {showInitialAmount && (
            <div className="flex justify-between items-center px-2 py-1 bg-slate-800 rounded text-xs text-slate-400 border border-slate-700">
              <span className="flex items-center gap-1"><History size={12}/> Inicial</span>
              <span className="font-mono text-slate-300">{formatCurrency(previousBalance)}</span>
            </div>
          )}
          <MetricDisplay label="Oficina" value={totalOficina} icon={Briefcase} colorClass="text-blue-400" borderClass="border-blue-900/30 bg-blue-950/20" />
          <MetricDisplay label="Caja" value={totalToBox} icon={Wallet} colorClass="text-indigo-400" borderClass="border-indigo-900/30 bg-indigo-950/20" />
        </div>
      </div>

      {/* Content Columns - Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-950 custom-scrollbar">
        
        {/* Incomes Container - Dark Mode */}
        <div className="rounded-lg bg-emerald-950/40 border border-emerald-900/50 overflow-hidden shadow-sm">
          <div className="flex justify-between items-center px-3 py-2 bg-emerald-950 border-b border-emerald-900">
            <h3 className="font-bold text-xs text-emerald-200 uppercase flex items-center gap-1.5 tracking-wider">
              <TrendingUp size={14} className="text-emerald-400"/> 
              Ingresos
            </h3>
            <button onClick={() => handleAddTransaction('incomes')} className="p-1 rounded bg-emerald-900 hover:bg-emerald-800 text-emerald-100 transition-colors border border-emerald-800">
              <Plus size={14} />
            </button>
          </div>
          <div className="p-2 space-y-1 min-h-[3rem]">
            {dayData.incomes.map(t => <TransactionItem key={t.id} transaction={t} type="incomes" onUpdate={(id, u) => handleUpdateTransaction('incomes', id, u)} onRemove={(id) => handleRemoveTransaction('incomes', id)} />)}
             {dayData.incomes.length === 0 && <p className="text-[10px] text-emerald-600/40 text-center italic py-2">Sin ingresos registrados</p>}
          </div>
        </div>

        {/* Expenses Container - Dark Mode */}
        <div className="rounded-lg bg-rose-950/40 border border-rose-900/50 overflow-hidden shadow-sm">
          <div className="flex justify-between items-center px-3 py-2 bg-rose-950 border-b border-rose-900">
            <h3 className="font-bold text-xs text-rose-200 uppercase flex items-center gap-1.5 tracking-wider">
              <TrendingDown size={14} className="text-rose-400"/> 
              Egresos
            </h3>
            <button onClick={() => handleAddTransaction('expenses')} className="p-1 rounded bg-rose-900 hover:bg-rose-800 text-rose-100 transition-colors border border-rose-800">
              <Plus size={14} />
            </button>
          </div>
          <div className="p-2 space-y-1 min-h-[3rem]">
            {dayData.expenses.map(t => <TransactionItem key={t.id} transaction={t} type="expenses" onUpdate={(id, u) => handleUpdateTransaction('expenses', id, u)} onRemove={(id) => handleRemoveTransaction('expenses', id)} />)}
             {dayData.expenses.length === 0 && <p className="text-[10px] text-rose-600/40 text-center italic py-2">Sin egresos registrados</p>}
          </div>
        </div>

        {/* To Box Container - Dark Mode */}
        <div className="rounded-lg bg-indigo-950/40 border border-indigo-900/50 overflow-hidden shadow-sm">
          <div className="flex justify-between items-center px-3 py-2 bg-indigo-950 border-b border-indigo-900">
            <h3 className="font-bold text-xs text-indigo-200 uppercase flex items-center gap-1.5 tracking-wider">
              <Archive size={14} className="text-indigo-400"/> 
              A Caja
            </h3>
            <button onClick={() => handleAddTransaction('toBox')} className="p-1 rounded bg-indigo-900 hover:bg-indigo-800 text-indigo-100 transition-colors border border-indigo-800">
              <Plus size={14} />
            </button>
          </div>
          <div className="p-2 space-y-1 min-h-[3rem]">
            {dayData.toBox.map(t => <TransactionItem key={t.id} transaction={t} type="toBox" onUpdate={(id, u) => handleUpdateTransaction('toBox', id, u)} onRemove={(id) => handleRemoveTransaction('toBox', id)} />)}
            {dayData.toBox.length === 0 && <p className="text-[10px] text-indigo-600/40 text-center italic py-2">0.00</p>}
          </div>
        </div>

      </div>
    </section>
  );
};