
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
  onAddToHistory: (item: HistoryItem) => void;
}

export const DayCard: React.FC<DayCardProps> = ({ dayData, onUpdate, previousBalance = 0, onAddToHistory }) => {
  
  if (!dayData) return null;

  const [showReport, setShowReport] = React.useState(false);
  const [isEditingInitial, setIsEditingInitial] = React.useState(false);
  const [tempInitial, setTempInitial] = React.useState('');
  
  // Specific state for Monday's Initial Box
  const [isEditingBoxInitial, setIsEditingBoxInitial] = React.useState(false);
  const [tempBoxInitial, setTempBoxInitial] = React.useState('');

  const isManualInitial = dayData.manualInitialAmount !== undefined;
  const effectiveInitialAmount = isManualInitial ? dayData.manualInitialAmount! : previousBalance;
  const isMonday = dayData.id === 'monday';
  const effectiveBoxInitial = isMonday ? (dayData.initialBoxAmount || 0) : 0;

  const handleAddTransaction = (type: TransactionType) => {
    const newTransaction: Transaction = {
      id: generateId(),
      title: type === 'toBox' ? 'Tesoro' : '', 
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
    const isGhost = itemToRemove && itemToRemove.amount === 0 && (itemToRemove.title === '' || (type === 'toBox' && (itemToRemove.title === 'Caja' || itemToRemove.title === 'Tesoro')));

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
     let targetType: TransactionType;

     if (currentType === 'incomes') targetType = 'deliveries';
     else if (currentType === 'deliveries') targetType = 'incomes';
     else if (currentType === 'expenses') targetType = 'salaries';
     else if (currentType === 'salaries') targetType = 'expenses';
     else return;

     const itemToMove = dayData[currentType].find(t => t.id === id);
     if (!itemToMove) return;

     const newSourceList = dayData[currentType].filter(t => t.id !== id);
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

  const saveBoxInitial = () => {
      const val = parseFloat(tempBoxInitial.replace(/\./g, '').replace(/,/g, '.'));
      if (!isNaN(val)) {
        onUpdate({ ...dayData, initialBoxAmount: val });
      } else if (tempBoxInitial === '') {
        onUpdate({ ...dayData, initialBoxAmount: 0 });
      }
      setIsEditingBoxInitial(false);
  };

  const startEditingBoxInitial = () => {
      const formatted = new Intl.NumberFormat('es-AR').format(effectiveBoxInitial);
      setTempBoxInitial(formatted);
      setIsEditingBoxInitial(true);
  };

  const handleBoxInitialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      const digits = val.replace(/\D/g, '');
      
      if (digits === '') {
        setTempBoxInitial('');
        return;
      }
      
      const numVal = parseInt(digits, 10);
      if (!isNaN(numVal)) {
        const formatted = new Intl.NumberFormat('es-AR').format(numVal);
        setTempBoxInitial(formatted);
      }
  };

  const handleBoxInitialKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') saveBoxInitial();
      if (e.key === 'Escape') setIsEditingBoxInitial(false);
  };


  const totalIncome = React.useMemo(() => dayData.incomes.reduce((acc, curr) => acc + curr.amount, 0), [dayData.incomes]);
  const totalDeliveries = React.useMemo(() => dayData.deliveries.reduce((acc, curr) => acc + curr.amount, 0), [dayData.deliveries]);
  const totalExpense = React.useMemo(() => dayData.expenses.reduce((acc, curr) => acc + curr.amount, 0), [dayData.expenses]);
  const totalSalaries = React.useMemo(() => dayData.salaries.reduce((acc, curr) => acc + curr.amount, 0), [dayData.salaries]);
  
  // Revised Logic for "A Tesoro" (toBox)
  // 1. "oficina": Transfers FROM Treasury TO Office. (+Office, -Treasury)
  // 2. "tesoro": Transfers FROM Office TO Treasury. (-Office, +Treasury)
  // 3. Generic/Other: External addition to Treasury. (No effect on Office, +Treasury)
  
  const { treasuryAddition, treasuryToOfficeTransfer, officeToTreasuryTransfer } = React.useMemo(() => {
    return dayData.toBox.reduce((acc, curr) => {
      const t = curr.title.trim().toLowerCase();
      
      if (t === 'oficina') {
        // Transfer FROM Treasury TO Office
        acc.treasuryToOfficeTransfer += curr.amount;
      } else if (t === 'tesoro') {
        // Transfer FROM Office TO Treasury
        acc.officeToTreasuryTransfer += curr.amount;
      } else {
        // Just added to Treasury (does not affect Office balance)
        acc.treasuryAddition += curr.amount;
      }
      return acc;
    }, { treasuryAddition: 0, treasuryToOfficeTransfer: 0, officeToTreasuryTransfer: 0 });
  }, [dayData.toBox]);
  
  // Office Total:
  // Initial + Income - Expenses - Salaries + (From Treasury "Oficina") - (To Treasury "Tesoro")
  const totalOficina = effectiveInitialAmount + totalIncome + totalDeliveries - totalExpense - totalSalaries + treasuryToOfficeTransfer - officeToTreasuryTransfer;

  // Treasury Total:
  // Initial Box + All Additions ("Tesoro" + Generic) - Transfers Back to Office ("Oficina")
  const totalToBoxWithInitial = effectiveBoxInitial + treasuryAddition + officeToTreasuryTransfer - treasuryToOfficeTransfer;

  const MetricDisplay = ({ label, value, icon: Icon, colorClass, borderClass }: { label: string; value: number; icon: any; colorClass: string; borderClass?: string }) => (
    <div className={`flex items-center justify-between p-3 rounded-lg bg-slate-800 border ${borderClass || 'border-slate-700'}`}>
      <div className="flex items-center gap-2">
        <Icon size={22} className={colorClass} />
        <span className="text-lg font-bold text-slate-400">{label}</span>
      </div>
      <span className={`text-2xl font-bold font-mono ${colorClass}`}>{formatCurrency(value)}</span>
    </div>
  );

  return (
    <section className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 flex flex-col w-[380px] h-full overflow-hidden flex-shrink-0">
      
      <DailyReportModal 
        isOpen={showReport} 
        onClose={() => setShowReport(false)} 
        dayData={dayData} 
      />

      <div className="p-4 bg-slate-900 border-b border-slate-800 flex-none relative">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-slate-100 uppercase tracking-wide pl-1">{dayData.name}</h2>
              <button 
                onClick={() => setShowReport(true)}
                className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors"
                title="Informe Diario"
              >
                 <PieChartIcon size={24} />
              </button>
          </div>
        </div>
        <div className="space-y-3">
          <MetricDisplay label="Oficina" value={totalOficina} icon={Briefcase} colorClass="text-blue-400" borderClass="border-blue-900/30 bg-blue-950/20" />
          <MetricDisplay label="Tesoro" value={totalToBoxWithInitial} icon={Wallet} colorClass="text-indigo-400" borderClass="border-indigo-900/30 bg-indigo-950/20" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950 custom-scrollbar">
        
        {/* Oficina Inicial */}
        <div className="rounded-lg bg-slate-800/40 border border-slate-700/50 overflow-hidden shadow-sm">
           <div className="flex justify-between items-center px-4 py-3 bg-slate-800 border-b border-slate-700">
             <h3 className="font-bold text-xl text-slate-300 uppercase flex items-center gap-2 tracking-wider">
               <History size={20} className="text-slate-400"/> 
               Oficina Inicial
             </h3>
             {isManualInitial && !isEditingInitial && (
                <button onClick={resetInitialAmount} title="Restaurar a Automático" className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-blue-400 transition-colors">
                  <RotateCcw size={18} />
                </button>
             )}
           </div>
           <div className="p-3">
             {isEditingInitial ? (
                <div className="flex items-center gap-2">
                   <div className="relative flex-1">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-lg">$</span>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        autoFocus
                        value={tempInitial} 
                        onChange={handleInitialChange}
                        onKeyDown={handleInitialKeyDown}
                        className="w-full bg-slate-900 border border-indigo-500 rounded px-2 pl-6 py-2 text-2xl font-mono text-white focus:outline-none"
                      />
                   </div>
                   <button onClick={saveInitialAmount} className="p-2 bg-indigo-600 rounded text-white"><Check size={20}/></button>
                   <button onClick={() => setIsEditingInitial(false)} className="p-2 bg-slate-700 rounded text-slate-300"><X size={20}/></button>
                </div>
             ) : (
                <div onClick={startEditingInitial} className={`cursor-pointer p-3 rounded border border-transparent hover:border-slate-600 hover:bg-slate-800 transition-all flex justify-between items-center group ${isManualInitial ? 'bg-slate-800/50' : ''}`}>
                  <span className={`text-lg ${isManualInitial ? 'text-indigo-300 font-medium' : 'text-slate-500 italic'}`}>
                    {isManualInitial ? 'Manual' : 'Automático'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-bold text-2xl ${isManualInitial ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {formatCurrency(effectiveInitialAmount)}
                    </span>
                    <Edit2 size={18} className="opacity-0 group-hover:opacity-100 text-slate-500" />
                  </div>
                </div>
             )}
           </div>
        </div>

        {/* Monday Specific: Tesoro Inicial */}
        {isMonday && (
            <div className="rounded-lg bg-slate-800/40 border border-slate-700/50 overflow-hidden shadow-sm">
                <div className="flex justify-between items-center px-4 py-3 bg-slate-800 border-b border-slate-700">
                  <h3 className="font-bold text-xl text-indigo-300 uppercase flex items-center gap-2 tracking-wider">
                    <Archive size={20} className="text-indigo-400"/> 
                    Tesoro Inicial
                  </h3>
                </div>
                <div className="p-3">
                  {isEditingBoxInitial ? (
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-lg">$</span>
                            <input 
                              type="text" 
                              inputMode="numeric"
                              autoFocus
                              value={tempBoxInitial} 
                              onChange={handleBoxInitialChange}
                              onKeyDown={handleBoxInitialKeyDown}
                              className="w-full bg-slate-900 border border-indigo-500 rounded px-2 pl-6 py-2 text-2xl font-mono text-white focus:outline-none"
                            />
                        </div>
                        <button onClick={saveBoxInitial} className="p-2 bg-indigo-600 rounded text-white"><Check size={20}/></button>
                        <button onClick={() => setIsEditingBoxInitial(false)} className="p-2 bg-slate-700 rounded text-slate-300"><X size={20}/></button>
                      </div>
                  ) : (
                      <div onClick={startEditingBoxInitial} className="cursor-pointer p-3 rounded border border-transparent hover:border-slate-600 hover:bg-slate-800 transition-all flex justify-between items-center group bg-slate-800/50">
                        <span className="text-lg text-indigo-300 font-medium">
                          Valor Inicial
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-2xl text-indigo-200">
                            {formatCurrency(effectiveBoxInitial)}
                          </span>
                          <Edit2 size={18} className="opacity-0 group-hover:opacity-100 text-slate-500" />
                        </div>
                      </div>
                  )}
                </div>
            </div>
        )}

        {/* Ingresos & Repartos Container */}
        <div className="rounded-lg bg-emerald-950/40 border border-emerald-900/50 overflow-hidden shadow-sm">
          <div className="flex justify-between items-center px-4 py-3 bg-emerald-950 border-b border-emerald-900">
            <h3 className="font-bold text-xl text-emerald-200 uppercase flex items-center gap-2 tracking-wider">
              <TrendingUp size={20} className="text-emerald-400"/> 
              Ingresos
            </h3>
            <span className="text-lg font-mono font-bold text-emerald-300 bg-emerald-900/60 px-3 py-1 rounded border border-emerald-800/50">
              {formatCurrency(totalIncome + totalDeliveries)}
            </span>
          </div>
          
          <div className="p-3 space-y-4">
            
            {/* General */}
            <div>
              <div className="flex justify-between items-center mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-base uppercase font-extrabold text-emerald-500/80 tracking-wide">General</span>
                  <span className="text-base font-mono font-bold text-emerald-400/90">{formatCurrency(totalIncome)}</span>
                </div>
                <button onClick={() => handleAddTransaction('incomes')} className="p-1.5 rounded bg-emerald-900/50 hover:bg-emerald-800 text-emerald-200 border border-emerald-800/50 transition-colors">
                  <Plus size={18} />
                </button>
              </div>
              <div className="space-y-2">
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
                {dayData.incomes.length === 0 && <p className="text-base text-emerald-600/30 text-center italic py-2">Sin ventas</p>}
              </div>
            </div>
            
            <div className="h-px bg-emerald-900/30 mx-1"></div>

            {/* Repartos */}
            <div>
              <div className="flex justify-between items-center mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-base uppercase font-extrabold text-teal-500/80 tracking-wide flex items-center gap-1">
                     <Truck size={16} /> Repartos
                  </span>
                  <span className="text-base font-mono font-bold text-teal-400/90">{formatCurrency(totalDeliveries)}</span>
                </div>
                <button onClick={() => handleAddTransaction('deliveries')} className="p-1.5 rounded bg-teal-900/50 hover:bg-teal-800 text-teal-200 border border-teal-800/50 transition-colors">
                  <Plus size={18} />
                </button>
              </div>
              <div className="space-y-2">
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
                {dayData.deliveries.length === 0 && <p className="text-base text-teal-600/30 text-center italic py-2">Sin repartos</p>}
              </div>
            </div>

          </div>
        </div>

        {/* Egresos & Salaries Container */}
        <div className="rounded-lg bg-rose-950/40 border border-rose-900/50 overflow-hidden shadow-sm">
          <div className="flex justify-between items-center px-4 py-3 bg-rose-950 border-b border-rose-900">
            <h3 className="font-bold text-xl text-rose-200 uppercase flex items-center gap-2 tracking-wider">
              <TrendingDown size={20} className="text-rose-400"/> 
              Egresos
            </h3>
            <span className="text-lg font-mono font-bold text-rose-300 bg-rose-900/60 px-3 py-1 rounded border border-rose-800/50">
                {formatCurrency(totalExpense + totalSalaries)}
            </span>
          </div>

          <div className="p-3 space-y-4">
            
            {/* Gastos */}
            <div>
              <div className="flex justify-between items-center mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-base uppercase font-extrabold text-rose-500/80 tracking-wide">Gastos</span>
                  <span className="text-base font-mono font-bold text-rose-400/90">{formatCurrency(totalExpense)}</span>
                </div>
                <button onClick={() => handleAddTransaction('expenses')} className="p-1.5 rounded bg-rose-900/50 hover:bg-rose-800 text-rose-200 border border-rose-800/50 transition-colors">
                  <Plus size={18} />
                </button>
              </div>
              <div className="space-y-2">
                {dayData.expenses.map(t => (
                    <TransactionItem 
                        key={t.id} 
                        transaction={t} 
                        type="expenses" 
                        onUpdate={(id, u) => handleUpdateTransaction('expenses', id, u)} 
                        onRemove={(id) => handleRemoveTransaction('expenses', id)} 
                        onMove={(id) => handleMoveTransaction('expenses', id)}
                    />
                ))}
                {dayData.expenses.length === 0 && <p className="text-base text-rose-600/40 text-center italic py-2">Sin gastos</p>}
              </div>
            </div>

            <div className="h-px bg-rose-900/30 mx-1"></div>

             {/* Adelantos/Sueldos */}
             <div>
              <div className="flex justify-between items-center mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-base uppercase font-extrabold text-amber-500/80 tracking-wide flex items-center gap-1">
                     <Users size={16} /> Adelantos/Sueldos
                  </span>
                  <span className="text-base font-mono font-bold text-amber-400/90">{formatCurrency(totalSalaries)}</span>
                </div>
                <button onClick={() => handleAddTransaction('salaries')} className="p-1.5 rounded bg-amber-900/50 hover:bg-amber-800 text-amber-200 border border-amber-800/50 transition-colors">
                  <Plus size={18} />
                </button>
              </div>
              <div className="space-y-2">
                {dayData.salaries.map(t => (
                    <TransactionItem 
                        key={t.id} 
                        transaction={t} 
                        type="salaries" 
                        onUpdate={(id, u) => handleUpdateTransaction('salaries', id, u)} 
                        onRemove={(id) => handleRemoveTransaction('salaries', id)} 
                        onMove={(id) => handleMoveTransaction('salaries', id)}
                    />
                ))}
                {dayData.salaries.length === 0 && <p className="text-base text-amber-600/40 text-center italic py-2">Sin adelantos</p>}
              </div>
            </div>

          </div>
        </div>

        {/* A Tesoro */}
        <div className="rounded-lg bg-indigo-950/40 border border-indigo-900/50 overflow-hidden shadow-sm">
          <div className="flex justify-between items-center px-4 py-3 bg-indigo-950 border-b border-indigo-900">
            <h3 className="font-bold text-xl text-indigo-200 uppercase flex items-center gap-2 tracking-wider">
              <div className="flex items-center gap-1.5">
                <Archive size={20} className="text-indigo-400"/> 
                A Tesoro
              </div>
              <span className="text-lg font-mono font-bold text-indigo-300 bg-indigo-900/60 px-3 py-1 rounded border border-indigo-800/50">
                {formatCurrency(totalToBoxWithInitial)}
              </span>
            </h3>
            <button onClick={() => handleAddTransaction('toBox')} className="p-1.5 rounded bg-indigo-900 hover:bg-indigo-800 text-indigo-100 transition-colors border border-indigo-800">
              <Plus size={18} />
            </button>
          </div>
          <div className="p-3 space-y-2 min-h-[3rem]">
            {dayData.toBox.map(t => <TransactionItem key={t.id} transaction={t} type="toBox" onUpdate={(id, u) => handleUpdateTransaction('toBox', id, u)} onRemove={(id) => handleRemoveTransaction('toBox', id)} />)}
            {dayData.toBox.length === 0 && <p className="text-base text-indigo-600/40 text-center italic py-2">0.00</p>}
          </div>
        </div>

      </div>
    </section>
  );
};
