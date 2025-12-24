
import React from 'react';
import { Plus, Archive, TrendingUp, TrendingDown, Briefcase, History, Wallet, RotateCcw, Edit2, Check, X, Truck, Users } from 'lucide-react';
import { DayData, Transaction, TransactionType, HistoryItem } from '../types';
import { TransactionItem } from './TransactionItem';
import { formatCurrency, generateId } from '../utils';
import { DailyReportModal } from './DailyReportModal';
import { PieChart as PieChartIcon } from 'lucide-react';

interface DayCardProps {
  dayData: DayData;
  onUpdate: (updatedDay: DayData) => void;
  previousBalance: number;
  prevWeekTreasury?: number;
  onAddToHistory: (item: HistoryItem) => void;
  isFullScreen?: boolean;
}

export const DayCard: React.FC<DayCardProps> = ({ 
  dayData, 
  onUpdate, 
  previousBalance = 0, 
  prevWeekTreasury = 0, 
  onAddToHistory, 
  isFullScreen = false 
}) => {
  if (!dayData) return null;

  const [showReport, setShowReport] = React.useState(false);
  const [isEditingInitial, setIsEditingInitial] = React.useState(false);
  const [tempInitial, setTempInitial] = React.useState('');
  const [isEditingBoxInitial, setIsEditingBoxInitial] = React.useState(false);
  const [tempBoxInitial, setTempBoxInitial] = React.useState('');

  const isManualInitial = dayData.manualInitialAmount !== undefined;
  const effectiveInitialAmount = isManualInitial ? dayData.manualInitialAmount! : previousBalance;
  const isMonday = dayData.id === 'monday';
  const isManualBoxInitial = dayData.initialBoxAmount !== undefined;
  const effectiveBoxInitial = isMonday ? (isManualBoxInitial ? dayData.initialBoxAmount! : prevWeekTreasury) : 0;

  const handleAddTransaction = (type: TransactionType) => {
    onUpdate({ ...dayData, [type]: [...dayData[type], { id: generateId(), title: type === 'toBox' ? 'Tesoro' : '', amount: 0 }] });
  };

  const handleUpdateTransaction = (type: TransactionType, id: string, updates: Partial<Transaction>) => {
    onUpdate({ ...dayData, [type]: dayData[type].map((t) => t.id === id ? { ...t, ...updates } : t) });
  };

  const handleRemoveTransaction = (type: TransactionType, id: string) => {
    const item = dayData[type].find(t => t.id === id);
    if (item && item.amount !== 0) onAddToHistory({ ...item, deletedAt: new Date().toISOString(), originalDayId: dayData.id, originalType: type });
    onUpdate({ ...dayData, [type]: dayData[type].filter((t) => t.id !== id) });
  };

  const totalIncome = dayData.incomes.reduce((acc, curr) => acc + curr.amount, 0);
  const totalDeliveries = dayData.deliveries.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = dayData.expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalSalaries = dayData.salaries.reduce((acc, curr) => acc + curr.amount, 0);
  
  const { treasuryToOfficeTransfer, officeToTreasuryTransfer } = dayData.toBox.reduce((acc, curr) => {
    const t = curr.title.trim().toLowerCase();
    if (t === 'oficina') acc.treasuryToOfficeTransfer += curr.amount;
    else if (t === 'tesoro') acc.officeToTreasuryTransfer += curr.amount;
    return acc;
  }, { treasuryToOfficeTransfer: 0, officeToTreasuryTransfer: 0 });
  
  const totalOficina = effectiveInitialAmount + totalIncome + totalDeliveries - totalExpense - totalSalaries + treasuryToOfficeTransfer - officeToTreasuryTransfer;
  const treasuryDayFlow = officeToTreasuryTransfer - treasuryToOfficeTransfer;

  const MetricDisplay = ({ label, value, icon: Icon, colorClass, borderClass }: { label: string; value: number; icon: any; colorClass: string; borderClass?: string }) => (
    <div className={`flex items-center justify-between p-4 rounded-xl bg-slate-800 border ${borderClass || 'border-slate-700'} shadow-inner`}>
      <div className="flex items-center gap-3">
        <Icon size={24} className={colorClass} />
        <span className="text-xl font-bold text-slate-400">{label}</span>
      </div>
      <span className={`text-2xl font-bold font-mono ${colorClass}`}>{formatCurrency(value)}</span>
    </div>
  );

  return (
    <section className={`bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 flex flex-col h-full overflow-hidden flex-shrink-0 transition-all ${isFullScreen ? 'w-full max-w-7xl mx-auto' : 'w-[380px]'}`}>
      <DailyReportModal isOpen={showReport} onClose={() => setShowReport(false)} dayData={dayData} />
      
      <div className="p-5 bg-slate-900 border-b border-slate-800 flex-none">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
              <h2 className={`font-bold text-slate-100 uppercase tracking-tighter ${isFullScreen ? 'text-5xl' : 'text-3xl'}`}>{dayData.name}</h2>
              <button onClick={() => setShowReport(true)} className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-all"><PieChartIcon size={28} /></button>
          </div>
        </div>
        <div className={`grid gap-4 ${isFullScreen ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <MetricDisplay label="Oficina" value={totalOficina} icon={Briefcase} colorClass="text-blue-400" borderClass="border-blue-900/30 bg-blue-950/20" />
          <MetricDisplay label="Tesoro" value={treasuryDayFlow} icon={Wallet} colorClass="text-indigo-400" borderClass="border-indigo-900/30 bg-indigo-950/20" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-slate-950 custom-scrollbar">
        <div className={`grid gap-6 ${isFullScreen ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
            
            {/* Oficina Inicial */}
            <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 overflow-hidden shadow-md">
                <div className="flex justify-between items-center px-4 py-3 bg-slate-800 border-b border-slate-700">
                    <h3 className="font-bold text-slate-300 uppercase flex items-center gap-2 tracking-widest text-xs"><History size={16} /> Oficina Inicial</h3>
                    {isManualInitial && <button onClick={() => onUpdate({...dayData, manualInitialAmount: undefined})} className="text-slate-500 hover:text-blue-400"><RotateCcw size={14} /></button>}
                </div>
                <div className="p-4">
                    {isEditingInitial ? (
                        <div className="flex gap-2">
                            <input autoFocus type="number" className="bg-slate-950 border border-indigo-500 rounded p-2 w-full font-mono text-xl" value={tempInitial} onChange={e => setTempInitial(e.target.value)} onKeyDown={e => e.key === 'Enter' && (onUpdate({...dayData, manualInitialAmount: parseFloat(tempInitial)}), setIsEditingInitial(false))} />
                            <button onClick={() => {onUpdate({...dayData, manualInitialAmount: parseFloat(tempInitial)}); setIsEditingInitial(false)}} className="bg-indigo-600 p-2 rounded"><Check size={18}/></button>
                        </div>
                    ) : (
                        <div onClick={() => (setTempInitial(effectiveInitialAmount.toString()), setIsEditingInitial(true))} className="cursor-pointer group flex justify-between items-center p-2 rounded hover:bg-slate-800">
                            <span className="text-xs text-slate-500 font-bold uppercase">{isManualInitial ? 'Manual' : 'Auto'}</span>
                            <span className="text-2xl font-mono font-bold text-slate-200">{formatCurrency(effectiveInitialAmount)}</span>
                        </div>
                    )}
                </div>
            </div>

            {isMonday && (
                <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 overflow-hidden shadow-md">
                    <div className="flex justify-between items-center px-4 py-3 bg-slate-800 border-b border-slate-700">
                        <h3 className="font-bold text-indigo-300 uppercase flex items-center gap-2 tracking-widest text-xs"><Archive size={16} /> Tesoro Inicial</h3>
                        {isManualBoxInitial && <button onClick={() => onUpdate({...dayData, initialBoxAmount: undefined})} className="text-slate-500 hover:text-indigo-400"><RotateCcw size={14} /></button>}
                    </div>
                    <div className="p-4">
                        {isEditingBoxInitial ? (
                            <div className="flex gap-2">
                                <input autoFocus type="number" className="bg-slate-950 border border-indigo-500 rounded p-2 w-full font-mono text-xl" value={tempBoxInitial} onChange={e => setTempBoxInitial(e.target.value)} onKeyDown={e => e.key === 'Enter' && (onUpdate({...dayData, initialBoxAmount: parseFloat(tempBoxInitial)}), setIsEditingBoxInitial(false))} />
                                <button onClick={() => {onUpdate({...dayData, initialBoxAmount: parseFloat(tempBoxInitial)}); setIsEditingBoxInitial(false)}} className="bg-indigo-600 p-2 rounded"><Check size={18}/></button>
                            </div>
                        ) : (
                            <div onClick={() => (setTempBoxInitial(effectiveBoxInitial.toString()), setIsEditingBoxInitial(true))} className="cursor-pointer group flex justify-between items-center p-2 rounded hover:bg-slate-800">
                                <span className="text-xs text-slate-500 font-bold uppercase">{isManualBoxInitial ? 'Manual' : 'Auto'}</span>
                                <span className="text-2xl font-mono font-bold text-slate-200">{formatCurrency(effectiveBoxInitial)}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="rounded-xl bg-emerald-950/20 border border-emerald-900/30 overflow-hidden shadow-md">
                <div className="px-4 py-3 bg-emerald-900/40 border-b border-emerald-900/30 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-widest flex items-center gap-2"><TrendingUp size={16}/> Ingresos</h3>
                    <button onClick={() => handleAddTransaction('incomes')} className="p-1.5 bg-emerald-600 rounded text-white hover:bg-emerald-500"><Plus size={16}/></button>
                </div>
                <div className="p-3 space-y-2">
                    {dayData.incomes.map(t => <TransactionItem key={t.id} transaction={t} type="incomes" onUpdate={(id, u) => handleUpdateTransaction('incomes', id, u)} onRemove={(id) => handleRemoveTransaction('incomes', id)} />)}
                    {dayData.deliveries.map(t => <TransactionItem key={t.id} transaction={t} type="deliveries" onUpdate={(id, u) => handleUpdateTransaction('deliveries', id, u)} onRemove={(id) => handleRemoveTransaction('deliveries', id)} />)}
                </div>
            </div>

            <div className="rounded-xl bg-rose-950/20 border border-rose-900/30 overflow-hidden shadow-md">
                <div className="px-4 py-3 bg-rose-900/40 border-b border-rose-900/30 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-rose-300 uppercase tracking-widest flex items-center gap-2"><TrendingDown size={16}/> Egresos</h3>
                    <button onClick={() => handleAddTransaction('expenses')} className="p-1.5 bg-rose-600 rounded text-white hover:bg-rose-500"><Plus size={16}/></button>
                </div>
                <div className="p-3 space-y-2">
                    {dayData.expenses.map(t => <TransactionItem key={t.id} transaction={t} type="expenses" onUpdate={(id, u) => handleUpdateTransaction('expenses', id, u)} onRemove={(id) => handleRemoveTransaction('expenses', id)} />)}
                    {dayData.salaries.map(t => <TransactionItem key={t.id} transaction={t} type="salaries" onUpdate={(id, u) => handleUpdateTransaction('salaries', id, u)} onRemove={(id) => handleRemoveTransaction('salaries', id)} />)}
                </div>
            </div>

            <div className="rounded-xl bg-indigo-950/20 border border-indigo-900/30 overflow-hidden shadow-md">
                <div className="px-4 py-3 bg-indigo-900/40 border-b border-indigo-900/30 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-2"><Archive size={16}/> A Tesoro</h3>
                    <button onClick={() => handleAddTransaction('toBox')} className="p-1.5 bg-indigo-600 rounded text-white hover:bg-indigo-500"><Plus size={16}/></button>
                </div>
                <div className="p-3 space-y-2">
                    {dayData.toBox.map(t => <TransactionItem key={t.id} transaction={t} type="toBox" onUpdate={(id, u) => handleUpdateTransaction('toBox', id, u)} onRemove={(id) => handleRemoveTransaction('toBox', id)} />)}
                </div>
            </div>

        </div>
      </div>
    </section>
  );
};
