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
      onUpdate({ ...dayData, manualInitialAmount: val, manualInitialModified: true });
    }
    setIsEditingInitial(false);
  };

  const resetInitialAmount = () => {
    const restoreVal = dayData.systemInitialOffice !== undefined ? dayData.systemInitialOffice : 0;
    onUpdate({ ...dayData, manualInitialAmount: restoreVal, manualInitialModified: false });
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

  // ----- Box Initial Handlers (Monday Only) -----

  const saveBoxInitial = () => {
      const val = parseFloat(tempBoxInitial.replace(/\./g, '').replace(/,/g, '.'));
      if (!isNaN(val)) {
        onUpdate({ ...dayData, initialBoxAmount: val, initialBoxModified: true });
      } else if (tempBoxInitial === '') {
        onUpdate({ ...dayData, initialBoxAmount: 0, initialBoxModified: true });
      }
      setIsEditingBoxInitial(false);
  };

  const resetBoxInitial = () => {
      const restoreVal = dayData.systemInitialBox !== undefined ? dayData.systemInitialBox : 0;
      onUpdate({ ...dayData, initialBoxAmount: restoreVal, initialBoxModified: false });
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
  const totalToBox = React.useMemo(() => dayData.toBox.reduce((acc, curr) => acc + curr.amount, 0), [dayData.toBox]);
  
  const totalOficina = effectiveInitialAmount + totalIncome + totalDeliveries - totalExpense - totalSalaries - totalToBox;
  const totalToBoxWithInitial = totalToBox + effectiveBoxInitial;

  const MetricDisplay = ({ label, value, icon: Icon, colorClass, borderClass, bgClass }: { label: string; value: number; icon: any; colorClass: string; borderClass: string; bgClass: string }) => (
    <div className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${bgClass} ${borderClass}`}>
      <div className="flex items-center gap-2">
        <Icon size={14} className={colorClass} />
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <span className={`text-sm font-bold font-mono ${colorClass}`}>{formatCurrency(value)}</span>
    </div>
  );

  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 flex flex-col w-[340px] h-full overflow-hidden flex-shrink-0 transition-colors duration-300">
      
      <DailyReportModal 
        isOpen={showReport} 
        onClose={() => setShowReport(false)} 
        dayData={dayData} 
      />

      <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-none relative transition-colors duration-300">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide pl-1">{dayData.name}</h2>
              <button 
                onClick={() => setShowReport(true)}
                className="p-1 text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                title="Informe Diario"
              >
                 <PieChartIcon size={16} />
              </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <MetricDisplay 
             label="Oficina" 
             value={totalOficina} 
             icon={Briefcase} 
             colorClass="text-blue-600 dark:text-blue-400" 
             borderClass="border-blue-200 dark:border-blue-900/30"
             bgClass="bg-blue-50 dark:bg-blue-950/20"
          />
          <MetricDisplay 
             label="Tesoro" 
             value={totalToBoxWithInitial} 
             icon={Wallet} 
             colorClass="text-indigo-600 dark:text-indigo-400" 
             borderClass="border-indigo-200 dark:border-indigo-900/30"
             bgClass="bg-indigo-50 dark:bg-indigo-950/20"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50 dark:bg-slate-950 custom-scrollbar transition-colors duration-300">
        
        {/* Oficina Inicial */}
        <div className="rounded-lg bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 overflow-hidden shadow-sm">
           <div className="flex justify-between items-center px-3 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
             <h3 className="font-bold text-xs text-slate-500 dark:text-slate-300 uppercase flex items-center gap-1.5 tracking-wider">
               <History size={14} className="text-slate-500 dark:text-slate-400"/> 
               Oficina Inicial
             </h3>
             {isManualInitial && !isEditingInitial && (
                <button onClick={resetInitialAmount} title="Restaurar a Automático" className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
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
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-indigo-500 rounded px-2 pl-4 py-1 text-sm font-mono text-slate-900 dark:text-white focus:outline-none"
                      />
                   </div>
                   <button onClick={saveInitialAmount} className="p-1 bg-indigo-600 rounded text-white"><Check size={14}/></button>
                   <button onClick={() => setIsEditingInitial(false)} className="p-1 bg-slate-300 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300"><X size={14}/></button>
                </div>
             ) : (
                <div onClick={startEditingInitial} className={`cursor-pointer p-2 rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex justify-between items-center group ${isManualInitial ? 'bg-indigo-50/50 dark:bg-slate-800/50' : ''}`}>
                  <span className={`text-xs ${isManualInitial ? 'text-indigo-600 dark:text-indigo-300 font-medium' : 'text-slate-500 italic'}`}>
                    {isManualInitial ? 'Manual' : 'Automático'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-semibold text-sm ${isManualInitial ? 'text-indigo-700 dark:text-indigo-200' : 'text-slate-600 dark:text-slate-400'}`}>
                      {formatCurrency(effectiveInitialAmount)}
                    </span>
                    <Edit2 size={12} className="opacity-0 group-hover:opacity-100 text-slate-400" />
                  </div>
                </div>
             )}
           </div>
        </div>

        {/* Tesoro Inicial (Monday) */}
        {isMonday && (
            <div className="rounded-lg bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 overflow-hidden shadow-sm">
                <div className="flex justify-between items-center px-3 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-xs text-indigo-600 dark:text-indigo-300 uppercase flex items-center gap-1.5 tracking-wider">
                    <Archive size={14} className="text-indigo-500 dark:text-indigo-400"/> 
                    Tesoro Inicial
                  </h3>
                  {dayData.initialBoxModified && !isEditingBoxInitial && (
                    <button onClick={resetBoxInitial} title="Restaurar a Automático" className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                      <RotateCcw size={12} />
                    </button>
                  )}
                </div>
                <div className="p-2">
                  {isEditingBoxInitial ? (
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                            <input 
                              type="text" 
                              inputMode="numeric"
                              autoFocus
                              value={tempBoxInitial} 
                              onChange={handleBoxInitialChange}
                              onKeyDown={handleBoxInitialKeyDown}
                              className="w-full bg-slate-50 dark:bg-slate-900 border border-indigo-500 rounded px-2 pl-4 py-1 text-sm font-mono text-slate-900 dark:text-white focus:outline-none"
                            />
                        </div>
                        <button onClick={saveBoxInitial} className="p-1 bg-indigo-600 rounded text-white"><Check size={14}/></button>
                        <button onClick={() => setIsEditingBoxInitial(false)} className="p-1 bg-slate-300 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300"><X size={14}/></button>
                      </div>
                  ) : (
                      <div onClick={startEditingBoxInitial} className={`cursor-pointer p-2 rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex justify-between items-center group ${dayData.initialBoxModified ? 'bg-indigo-50/50 dark:bg-slate-800/50' : ''}`}>
                        <span className={`text-xs ${dayData.initialBoxModified ? 'text-indigo-600 dark:text-indigo-300 font-medium' : 'text-slate-500 italic'}`}>
                          {dayData.initialBoxModified ? 'Manual' : 'Automático'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-semibold text-sm ${dayData.initialBoxModified ? 'text-indigo-700 dark:text-indigo-200' : 'text-indigo-600 dark:text-indigo-200'}`}>
                            {formatCurrency(effectiveBoxInitial)}
                          </span>
                          <Edit2 size={12} className="opacity-0 group-hover:opacity-100 text-slate-400" />
                        </div>
                      </div>
                  )}
                </div>
            </div>
        )}

        {/* Ingresos & Repartos Container */}
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 overflow-hidden shadow-sm">
          <div className="flex justify-between items-center px-3 py-2 bg-emerald-100 dark:bg-emerald-950 border-b border-emerald-200 dark:border-emerald-900">
            <h3 className="font-bold text-xs text-emerald-700 dark:text-emerald-200 uppercase flex items-center gap-1.5 tracking-wider">
              <TrendingUp size={14} className="text-emerald-600 dark:text-emerald-400"/> 
              Ingresos
              <span className="ml-2 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-200/50 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/50">
                {formatCurrency(totalIncome + totalDeliveries)}
              </span>
            </h3>
          </div>
          
          <div className="p-2 space-y-2">
            
            {/* General */}
            <div>
              <div className="flex justify-between items-center mb-1 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-extrabold text-emerald-600/80 dark:text-emerald-500/80 tracking-wide">General</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400/90">{formatCurrency(totalIncome)}</span>
                </div>
                <button onClick={() => handleAddTransaction('incomes')} className="p-0.5 rounded bg-emerald-200/50 dark:bg-emerald-900/50 hover:bg-emerald-300/50 dark:hover:bg-emerald-800 text-emerald-700 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/50 transition-colors">
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
                {dayData.incomes.length === 0 && <p className="text-[10px] text-emerald-400 dark:text-emerald-600/30 text-center italic py-1">Sin ventas</p>}
              </div>
            </div>
            
            <div className="h-px bg-emerald-200/50 dark:bg-emerald-900/30 mx-1"></div>

            {/* Repartos */}
            <div>
              <div className="flex justify-between items-center mb-1 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-extrabold text-teal-600/80 dark:text-teal-500/80 tracking-wide flex items-center gap-1">
                     <Truck size={12} /> Repartos
                  </span>
                  <span className="text-[10px] font-mono font-bold text-teal-600 dark:text-teal-400/90">{formatCurrency(totalDeliveries)}</span>
                </div>
                <button onClick={() => handleAddTransaction('deliveries')} className="p-0.5 rounded bg-teal-200/50 dark:bg-teal-900/50 hover:bg-teal-300/50 dark:hover:bg-teal-800 text-teal-700 dark:text-teal-200 border border-teal-200 dark:border-teal-800/50 transition-colors">
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
                {dayData.deliveries.length === 0 && <p className="text-[10px] text-teal-400 dark:text-teal-600/30 text-center italic py-1">Sin repartos</p>}
              </div>
            </div>

          </div>
        </div>

        {/* Egresos & Salaries Container */}
        <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 overflow-hidden shadow-sm">
          <div className="flex justify-between items-center px-3 py-2 bg-rose-100 dark:bg-rose-950 border-b border-rose-200 dark:border-rose-900">
            <h3 className="font-bold text-xs text-rose-700 dark:text-rose-200 uppercase flex items-center gap-1.5 tracking-wider">
              <TrendingDown size={14} className="text-rose-600 dark:text-rose-400"/> 
              Egresos
              <span className="ml-2 text-[10px] font-mono font-bold text-rose-700 dark:text-rose-300 bg-rose-200/50 dark:bg-rose-900/60 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800/50">
                {formatCurrency(totalExpense + totalSalaries)}
              </span>
            </h3>
          </div>

          <div className="p-2 space-y-2">
            
            {/* Gastos */}
            <div>
              <div className="flex justify-between items-center mb-1 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-extrabold text-rose-600/80 dark:text-rose-500/80 tracking-wide">Gastos</span>
                  <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400/90">{formatCurrency(totalExpense)}</span>
                </div>
                <button onClick={() => handleAddTransaction('expenses')} className="p-0.5 rounded bg-rose-200/50 dark:bg-rose-900/50 hover:bg-rose-300/50 dark:hover:bg-rose-800 text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-800/50 transition-colors">
                  <Plus size={12} />
                </button>
              </div>
              <div className="space-y-1">
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
                {dayData.expenses.length === 0 && <p className="text-[10px] text-rose-400 dark:text-rose-600/40 text-center italic py-1">Sin gastos</p>}
              </div>
            </div>

            <div className="h-px bg-rose-200/50 dark:bg-rose-900/30 mx-1"></div>

             {/* Adelantos/Sueldos */}
             <div>
              <div className="flex justify-between items-center mb-1 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-extrabold text-amber-600/80 dark:text-amber-500/80 tracking-wide flex items-center gap-1">
                     <Users size={12} /> Adelantos/Sueldos
                  </span>
                  <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400/90">{formatCurrency(totalSalaries)}</span>
                </div>
                <button onClick={() => handleAddTransaction('salaries')} className="p-0.5 rounded bg-amber-200/50 dark:bg-amber-900/50 hover:bg-amber-300/50 dark:hover:bg-amber-800 text-amber-700 dark:text-amber-200 border border-amber-200 dark:border-amber-800/50 transition-colors">
                  <Plus size={12} />
                </button>
              </div>
              <div className="space-y-1">
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
                {dayData.salaries.length === 0 && <p className="text-[10px] text-amber-400 dark:text-amber-600/40 text-center italic py-1">Sin adelantos</p>}
              </div>
            </div>

          </div>
        </div>

        {/* A Tesoro */}
        <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 overflow-hidden shadow-sm">
          <div className="flex justify-between items-center px-3 py-2 bg-indigo-100 dark:bg-indigo-950 border-b border-indigo-200 dark:border-indigo-900">
            <h3 className="font-bold text-xs text-indigo-700 dark:text-indigo-200 uppercase flex items-center gap-1.5 tracking-wider">
              <div className="flex items-center gap-1.5">
                <Archive size={14} className="text-indigo-600 dark:text-indigo-400"/> 
                A Tesoro
              </div>
              <span className="ml-2 text-[10px] font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-200/50 dark:bg-indigo-900/60 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800/50">
                {formatCurrency(totalToBoxWithInitial)}
              </span>
            </h3>
            <button onClick={() => handleAddTransaction('toBox')} className="p-1 rounded bg-indigo-600 dark:bg-indigo-900 hover:bg-indigo-500 dark:hover:bg-indigo-800 text-white transition-colors border border-indigo-500 dark:border-indigo-800">
              <Plus size={14} />
            </button>
          </div>
          <div className="p-2 space-y-1 min-h-[3rem]">
            {dayData.toBox.map(t => <TransactionItem key={t.id} transaction={t} type="toBox" onUpdate={(id, u) => handleUpdateTransaction('toBox', id, u)} onRemove={(id) => handleRemoveTransaction('toBox', id)} />)}
            {dayData.toBox.length === 0 && <p className="text-[10px] text-indigo-400 dark:text-indigo-600/40 text-center italic py-2">0.00</p>}
          </div>
        </div>

      </div>
    </section>
  );
};