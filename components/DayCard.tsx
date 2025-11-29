import React from 'react';
import { Plus, Archive, TrendingUp, TrendingDown, Briefcase, History, Wallet, RotateCcw, Edit2, Check, X, Truck } from 'lucide-react';
import { DayData, Transaction, TransactionType, HistoryItem } from '../types';
import { TransactionItem } from './TransactionItem';
import { formatCurrency, generateId } from '../utils';

interface DayCardProps {
  dayData: DayData;
  onUpdate: (updatedDay: DayData) => void;
  previousBalance: number;
  onAddToHistory: (item: HistoryItem) => void;
}

export const DayCard: React.FC<DayCardProps> = ({ dayData, onUpdate, previousBalance = 0, onAddToHistory }) => {
  
  if (!dayData) return null;

  const [isEditingInitial, setIsEditingInitial] = React.useState(false);
  const [tempInitial, setTempInitial] = React.useState('');
  
  const isManualInitial = dayData.manualInitialAmount !== undefined;
  const effectiveInitialAmount = isManualInitial ? dayData.manualInitialAmount! : previousBalance;

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

  const handleRemoveTransaction = (type: TransactionType, id: string) => {
    const itemToRemove = dayData[type].find(t => t.id === id);
    const isGhost = itemToRemove && itemToRemove.amount === 0 && (itemToRemove.title === '' || (type === 'toBox' && itemToRemove.title === 'Caja'));

    if (itemToRemove && !isGhost) {
      const historyItem: HistoryItem = {
        ...itemToRemove,
        deletedAt: new Date().toISOString(),
        originalDayId: dayData.id,
        originalType: type
      };
      onAddToHistory(historyItem);
    }

    const updatedList = dayData[type].filter((t) => t.id !== id);
    onUpdate({ ...dayData, [type]: updatedList });
  };

  const handleMoveTransaction = (currentType: TransactionType, id: string) => {
     if (currentType !== 'incomes' && currentType !== 'deliveries') return;

     const targetType = currentType === 'incomes' ? 'deliveries' : 'incomes';
     const itemToMove = dayData[currentType].find(t => t.id === id);

     if (!itemToMove) return;

     // Remove from source
     const newSourceList = dayData[currentType].filter(t => t.id !== id);
     
     // Add to target
     const newTargetList = [...dayData[targetType], itemToMove];

     onUpdate({
         ...dayData,
         [currentType]: newSourceList,
         [targetType]: newTargetList
     });
  };

  const saveInitialAmount = () => {
    const val = parseFloat(tempInitial.replace(/\./g, '').replace(/,/g, '.'));
    if (!isNaN(val)) {
      onUpdate({ ...dayData, manualInitialAmount: val });
    }
    setIsEditingInitial(false);
  };

  const resetInitialAmount = () => {
    onUpdate({ ...dayData, manualInitialAmount: undefined });
  };

  const startEditingInitial = () => {
    const formatted = new Intl.NumberFormat('es-AR').format(effectiveInitialAmount);
    setTempInitial(formatted);
    setIsEditingInitial(true);
  };

  const handleInitialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const digits = val.replace(/\D/g, ''); 
    
    if (digits === '') {
      setTempInitial('');
      return;
    }

    const numVal = parseInt(digits, 10);
    if (!isNaN(numVal)) {
      const formatted = new Intl.NumberFormat('es-AR').format(numVal);
      setTempInitial(formatted);
    }
  };

  const handleInitialKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveInitialAmount();
    if (e.key === 'Escape') setIsEditingInitial(false);
  };

  const totalIncome = React.useMemo(() => dayData.incomes.reduce((acc, curr) => acc + curr.amount, 0), [dayData.incomes]);
  const totalDeliveries = React.useMemo(() => dayData.deliveries.reduce((acc, curr) => acc + curr.amount, 0), [dayData.deliveries]);
  const totalExpense = React.useMemo(() => dayData.expenses.reduce((acc, curr) => acc + curr.amount, 0), [dayData.expenses]);
  const totalToBox = React.useMemo(() => dayData.toBox.reduce((acc, curr) => acc + curr.amount, 0), [dayData.toBox]);
  
  const totalOficina = effectiveInitialAmount + totalIncome + totalDeliveries - totalExpense - totalToBox;

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
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex-none relative">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wide flex-1 pl-1">{dayData.name}</h2>
        </div>
        <div className="space-y-1.5">
          <MetricDisplay label="Oficina" value={totalOficina} icon={Briefcase} colorClass="text-blue-400" borderClass="border-blue-900/30 bg-blue-950/20" />
          <MetricDisplay label="Caja" value={totalToBox} icon={Wallet} colorClass="text-indigo-400" borderClass="border-indigo-900/30 bg-indigo-950/20" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-950 custom-scrollbar">
        
        {/* Monto Inicial */}
        <div className="rounded-lg bg-slate-800/40 border border-slate-700/50 overflow-hidden shadow-sm">
           <div className="flex justify-between items-center px-3 py-2 bg-slate-800 border-b border-slate-700">
             <h3 className="font-bold text-xs text-slate-300 uppercase flex items-center gap-1.5 tracking-wider">
               <History size={14} className="text-slate-400"/> 
               Monto Inicial
             </h3>
             {isManualInitial && !isEditingInitial && (
                <button onClick={resetInitialAmount} title="Restaurar a Automático" className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-blue-400 transition-colors">
                  <RotateCcw size={12} />
                </button>
             )}
           </div>
           <div className="p-2">
             {isEditingInitial ? (
                <div className="flex items-center gap-2">
                   <div className="relative flex-1">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        autoFocus
                        value={tempInitial} 
                        onChange={handleInitialChange}
                        onKeyDown={handleInitialKeyDown}
                        className="w-full bg-slate-900 border border-indigo-500 rounded px-2 pl-4 py-1 text-sm font-mono text-white focus:outline-none"
                      />
                   </div>
                   <button onClick={saveInitialAmount} className="p-1 bg-indigo-600 rounded text-white"><Check size={14}/></button>
                   <button onClick={() => setIsEditingInitial(false)} className="p-1 bg-slate-700 rounded text-slate-300"><X size={14}/></button>
                </div>
             ) : (
                <div onClick={startEditingInitial} className={`cursor-pointer p-2 rounded border border-transparent hover:border-slate-600 hover:bg-slate-800 transition-all flex justify-between items-center group ${isManualInitial ? 'bg-slate-800/50' : ''}`}>
                  <span className={`text-xs ${isManualInitial ? 'text-indigo-300 font-medium' : 'text-slate-500 italic'}`}>
                    {isManualInitial ? 'Manual' : 'Automático'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-semibold text-sm ${isManualInitial ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {formatCurrency(effectiveInitialAmount)}
                    </span>
                    <Edit2 size={12} className="opacity-0 group-hover:opacity-100 text-slate-500" />
                  </div>
                </div>
             )}
           </div>
        </div>

        {/* Ingresos & Repartos Container */}
        <div className="rounded-lg bg-emerald-950/40 border border-emerald-900/50 overflow-hidden shadow-sm">
          <div className="flex justify-between items-center px-3 py-2 bg-emerald-950 border-b border-emerald-900">
            <h3 className="font-bold text-xs text-emerald-200 uppercase flex items-center gap-1.5 tracking-wider">
              <TrendingUp size={14} className="text-emerald-400"/> 
              Ingresos
            </h3>
          </div>
          
          <div className="p-2 space-y-2">
            
            {/* Ventas Mostrador -> Renamed to General */}
            <div>
              <div className="flex justify-between items-center mb-1 px-1">
                <span className="text-[10px] uppercase font-bold text-emerald-500/80 tracking-wide">General</span>
                <button onClick={() => handleAddTransaction('incomes')} className="p-0.5 rounded bg-emerald-900/50 hover:bg-emerald-800 text-emerald-200 border border-emerald-800/50 transition-colors">
                  <Plus size={12} />
                </button>
              </div>
              <div className="space-y-1">
                {dayData.incomes.map(t => (
                    <TransactionItem 
                        key={t.id} 
                        transaction={t} 
                        type="incomes" 
                        onUpdate={(id, u) => handleUpdateTransaction('incomes', id, u)} 
                        onRemove={(id) => handleRemoveTransaction('incomes', id)}
                        onMove={(id) => handleMoveTransaction('incomes', id)} 
                    />
                ))}
                {dayData.incomes.length === 0 && <p className="text-[10px] text-emerald-600/30 text-center italic py-1">Sin ventas</p>}
              </div>
            </div>
            
            <div className="h-px bg-emerald-900/30 mx-1"></div>

            {/* Repartos */}
            <div>
              <div className="flex justify-between items-center mb-1 px-1">
                <span className="text-[10px] uppercase font-bold text-teal-500/80 tracking-wide flex items-center gap-1">
                   <Truck size={10} /> Repartos
                </span>
                <button onClick={() => handleAddTransaction('deliveries')} className="p-0.5 rounded bg-teal-900/50 hover:bg-teal-800 text-teal-200 border border-teal-800/50 transition-colors">
                  <Plus size={12} />
                </button>
              </div>
              <div className="space-y-1">
                {dayData.deliveries.map(t => (
                    <TransactionItem 
                        key={t.id} 
                        transaction={t} 
                        type="deliveries" 
                        onUpdate={(id, u) => handleUpdateTransaction('deliveries', id, u)} 
                        onRemove={(id) => handleRemoveTransaction('deliveries', id)}
                        onMove={(id) => handleMoveTransaction('deliveries', id)} 
                    />
                ))}
                {dayData.deliveries.length === 0 && <p className="text-[10px] text-teal-600/30 text-center italic py-1">Sin repartos</p>}
              </div>
            </div>

          </div>
        </div>

        {/* Egresos */}
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

        {/* A Caja */}
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