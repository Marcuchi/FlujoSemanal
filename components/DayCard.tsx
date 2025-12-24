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
  isDailyView?: boolean;
}

export const DayCard: React.FC<DayCardProps> = ({ dayData, onUpdate, previousBalance = 0, prevWeekTreasury = 0, onAddToHistory, isDailyView = false }) => {
  
  if (!dayData) return null;

  const [showReport, setShowReport] = React.useState(false);
  const [isEditingInitial, setIsEditingInitial] = React.useState(false);
  const [tempInitial, setTempInitial] = React.useState('');
  
  const [isEditingBoxInitial, setIsEditingBoxInitial] = React.useState(false);
  const [tempBoxInitial, setTempBoxInitial] = React.useState('');

  // Estado para el formulario local de "Agregar"
  const [addingTo, setAddingTo] = React.useState<TransactionType | null>(null);

  const isManualInitial = dayData.manualInitialAmount !== undefined;
  const effectiveInitialAmount = isManualInitial ? dayData.manualInitialAmount! : previousBalance;
  const isMonday = dayData.id === 'monday';
  
  const isManualBoxInitial = dayData.initialBoxAmount !== undefined;
  const effectiveBoxInitial = isManualBoxInitial ? dayData.initialBoxAmount! : (isMonday ? prevWeekTreasury : 0);

  const handleStartAdd = (type: TransactionType) => {
    setAddingTo(type);
  };

  const handleConfirmAdd = (type: TransactionType, title: string, amount: number) => {
    const newTransaction: Transaction = {
      id: generateId(),
      title: title || (type === 'toBox' ? 'Tesoro' : ''),
      amount: amount,
    };
    onUpdate({
      ...dayData,
      [type]: [...dayData[type], newTransaction],
    });
    setAddingTo(null);
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
    if (itemToRemove) {
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

  const saveBoxInitial = () => {
      const val = parseFloat(tempBoxInitial.replace(/\./g, '').replace(/,/g, '.'));
      if (!isNaN(val)) {
        onUpdate({ ...dayData, initialBoxAmount: val });
      } else {
        onUpdate({ ...dayData, initialBoxAmount: undefined });
      }
      setIsEditingBoxInitial(false);
  };

  const startEditingBoxInitial = () => {
      const formatted = new Intl.NumberFormat('es-AR').format(effectiveBoxInitial);
      setTempBoxInitial(formatted);
      setIsEditingBoxInitial(true);
  };

  const totalIncome = React.useMemo(() => dayData.incomes.reduce((acc, curr) => acc + curr.amount, 0), [dayData.incomes]);
  const totalDeliveries = React.useMemo(() => dayData.deliveries.reduce((acc, curr) => acc + curr.amount, 0), [dayData.deliveries]);
  const totalExpense = React.useMemo(() => dayData.expenses.reduce((acc, curr) => acc + curr.amount, 0), [dayData.expenses]);
  const totalSalaries = React.useMemo(() => dayData.salaries.reduce((acc, curr) => acc + curr.amount, 0), [dayData.salaries]);
  
  const { treasuryAddition, treasuryToOfficeTransfer, officeToTreasuryTransfer } = React.useMemo(() => {
    return dayData.toBox.reduce((acc, curr) => {
      const t = curr.title.trim().toLowerCase();
      if (t === 'oficina') {
        acc.treasuryToOfficeTransfer += curr.amount;
      } else if (t === 'tesoro') {
        acc.officeToTreasuryTransfer += curr.amount;
      } else {
        acc.treasuryAddition += curr.amount;
      }
      return acc;
    }, { treasuryAddition: 0, treasuryToOfficeTransfer: 0, officeToTreasuryTransfer: 0 });
  }, [dayData.toBox]);
  
  const totalOficina = effectiveInitialAmount + totalIncome + totalDeliveries - totalExpense - totalSalaries + treasuryToOfficeTransfer - officeToTreasuryTransfer;
  const treasuryDayFlow = officeToTreasuryTransfer - treasuryToOfficeTransfer;

  const MetricDisplay = ({ label, value, icon: Icon, colorClass, borderClass }: { label: string; value: number; icon: any; colorClass: string; borderClass?: string }) => (
    <div className={`flex items-center justify-between p-3 rounded-lg bg-slate-800 border ${borderClass || 'border-slate-700'} flex-1`}>
      <div className="flex items-center gap-2">
        <Icon size={isDailyView ? 28 : 22} className={colorClass} />
        <span className={`${isDailyView ? 'text-xl' : 'text-lg'} font-bold text-slate-400`}>{label}</span>
      </div>
      <span className={`${isDailyView ? 'text-3xl' : 'text-2xl'} font-bold font-mono ${colorClass}`}>{formatCurrency(value)}</span>
    </div>
  );

  return (
    <section className={`bg-slate-900 rounded-xl shadow-lg border border-slate-800 flex flex-col ${isDailyView ? 'w-full min-h-[85vh] mb-8' : 'w-[380px] h-full flex-shrink-0'} overflow-hidden`}>
      
      <DailyReportModal isOpen={showReport} onClose={() => setShowReport(false)} dayData={dayData} />

      <div className={`p-4 bg-slate-900 border-b border-slate-800 flex-none relative`}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
              <h2 className={`${isDailyView ? 'text-4xl' : 'text-3xl'} font-bold text-slate-100 uppercase tracking-wide pl-1`}>{dayData.name}</h2>
              <button onClick={() => setShowReport(true)} className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors" title="Informe Diario">
                 <PieChartIcon size={isDailyView ? 30 : 24} />
              </button>
          </div>
        </div>
        {/* Mobile optimization: stacking metrics vertically on smartphones (md:flex-row fallback) */}
        <div className={`flex flex-col md:${isDailyView ? 'flex-row' : 'flex-col'} gap-3`}>
          <MetricDisplay label="Oficina" value={totalOficina} icon={Briefcase} colorClass="text-blue-400" borderClass="border-blue-900/30 bg-blue-950/20" />
          <MetricDisplay label="Tesoro" value={treasuryDayFlow} icon={Wallet} colorClass="text-indigo-400" borderClass="border-indigo-900/30 bg-indigo-950/20" />
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto p-4 bg-slate-950 custom-scrollbar`}>
        <div className={`${isDailyView ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6' : 'flex flex-col space-y-4'}`}>
          
          {/* SECTION: INICIALES */}
          <div className="flex flex-col gap-4">
            <h4 className={`text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-1 ${isDailyView ? 'block' : 'hidden'}`}>Iniciales</h4>
            
            <div className="rounded-lg bg-slate-800/40 border border-slate-700/50 overflow-hidden shadow-sm h-fit">
               <div className="flex justify-between items-center px-4 py-3 bg-slate-800 border-b border-slate-700">
                 <h3 className="font-bold text-xl text-slate-300 uppercase flex items-center gap-2 tracking-wider">
                   <History size={20} className="text-slate-400"/> Oficina Inicial
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
                          <input type="text" inputMode="numeric" autoFocus value={tempInitial} onChange={handleInitialChange} onKeyDown={(e) => e.key === 'Enter' && saveInitialAmount()} className="w-full bg-slate-950 border border-indigo-500 rounded px-2 pl-6 py-2 text-2xl font-mono text-white focus:outline-none" />
                       </div>
                       <button onClick={saveInitialAmount} className="p-2 bg-indigo-600 rounded text-white"><Check size={20}/></button>
                       <button onClick={() => setIsEditingInitial(false)} className="p-2 bg-slate-700 rounded text-slate-300"><X size={20}/></button>
                    </div>
                 ) : (
                    <div onClick={startEditingInitial} className={`cursor-pointer p-3 rounded border border-transparent hover:border-slate-600 hover:bg-slate-800 transition-all flex justify-between items-center group ${isManualInitial ? 'bg-slate-800/50' : ''}`}>
                      <span className={`text-lg ${isManualInitial ? 'text-indigo-300 font-medium' : 'text-slate-500 italic'}`}>{isManualInitial ? 'Manual' : 'Automático'}</span>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-bold text-2xl ${isManualInitial ? 'text-indigo-200' : 'text-slate-400'}`}>{formatCurrency(effectiveInitialAmount)}</span>
                        <Edit2 size={18} className="opacity-0 group-hover:opacity-100 text-slate-500" />
                      </div>
                    </div>
                 )}
               </div>
            </div>

            {isMonday ? (
                <div className="rounded-lg bg-slate-800/40 border border-slate-700/50 overflow-hidden shadow-sm h-fit">
                    <div className="flex justify-between items-center px-4 py-3 bg-slate-800 border-b border-slate-700">
                        <h3 className="font-bold text-xl text-indigo-300 uppercase flex items-center gap-2 tracking-wider">
                            <Archive size={20} className="text-indigo-400"/> Tesoro Inicial
                        </h3>
                        {isManualBoxInitial && !isEditingBoxInitial && (
                            <button onClick={() => onUpdate({ ...dayData, initialBoxAmount: undefined })} title="Restaurar a Automático" className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-indigo-400 transition-colors">
                                <RotateCcw size={18} />
                            </button>
                        )}
                    </div>
                    <div className="p-3">
                      {isEditingBoxInitial ? (
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-lg">$</span>
                                <input type="text" inputMode="numeric" autoFocus value={tempBoxInitial} onChange={(e) => {
                                    const digits = e.target.value.replace(/\D/g, '');
                                    if (digits === '') { setTempBoxInitial(''); return; }
                                    const numVal = parseInt(digits, 10);
                                    if (!isNaN(numVal)) setTempBoxInitial(new Intl.NumberFormat('es-AR').format(numVal));
                                }} onKeyDown={(e) => e.key === 'Enter' && saveBoxInitial()} className="w-full bg-slate-950 border border-indigo-500 rounded px-2 pl-6 py-2 text-2xl font-mono text-white focus:outline-none" />
                            </div>
                            <button onClick={saveBoxInitial} className="p-2 bg-indigo-600 rounded text-white"><Check size={20}/></button>
                            <button onClick={() => setIsEditingBoxInitial(false)} className="p-2 bg-slate-700 rounded text-slate-300"><X size={20}/></button>
                          </div>
                      ) : (
                          <div onClick={startEditingBoxInitial} className={`cursor-pointer p-3 rounded border border-transparent hover:border-slate-600 hover:bg-slate-800 transition-all flex justify-between items-center group ${isManualBoxInitial ? 'bg-slate-800/50' : ''}`}>
                             <span className={`text-lg ${isManualBoxInitial ? 'text-indigo-300 font-medium' : 'text-slate-500 italic'}`}>{isManualBoxInitial ? 'Manual' : 'Automático'}</span>
                            <div className="flex items-center gap-2">
                              <span className={`font-mono font-bold text-2xl ${isManualBoxInitial ? 'text-indigo-200' : 'text-slate-400'}`}>{formatCurrency(effectiveBoxInitial)}</span>
                              <Edit2 size={18} className="opacity-0 group-hover:opacity-100 text-slate-500" />
                            </div>
                          </div>
                      )}
                    </div>
                </div>
            ) : (isDailyView && !isMonday) ? (
                <div className="rounded-lg bg-slate-800/5 border border-slate-800/10 h-[130px] hidden lg:block shadow-inner"></div>
            ) : null}
          </div>

          {/* SECTION: INGRESOS */}
          <div className="flex flex-col gap-4">
            <h4 className={`text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-1 ${isDailyView ? 'block' : 'hidden'}`}>Ingresos</h4>
            <div className="rounded-lg bg-emerald-950/40 border border-emerald-900/50 overflow-hidden shadow-sm flex-1 h-fit">
              <div className="flex justify-between items-center px-4 py-3 bg-emerald-950 border-b border-emerald-900">
                <h3 className="font-bold text-xl text-emerald-200 uppercase flex items-center gap-2 tracking-wider">
                  <TrendingUp size={20} className="text-emerald-400"/> Ingresos
                </h3>
                <span className="text-lg font-mono font-bold text-emerald-300 bg-emerald-900/60 px-3 py-1 rounded border border-emerald-800/50">{formatCurrency(totalIncome + totalDeliveries)}</span>
              </div>
              <div className="p-3 space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base uppercase font-extrabold text-emerald-500/80 tracking-wide">General</span>
                      <span className="text-base font-mono font-bold text-emerald-400/90">{formatCurrency(totalIncome)}</span>
                    </div>
                    <button onClick={() => handleStartAdd('incomes')} className="p-1.5 rounded bg-emerald-900/50 hover:bg-emerald-800 text-emerald-200 border border-emerald-800/50 transition-colors">
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {dayData.incomes.map(t => <TransactionItem key={t.id} transaction={t} type="incomes" onUpdate={(id, u) => handleUpdateTransaction('incomes', id, u)} onRemove={(id) => handleRemoveTransaction('incomes', id)} onMove={(id) => handleMoveTransaction('incomes', id)} />)}
                    {addingTo === 'incomes' && <TransactionItem transaction={{id: 'new', title: '', amount: 0}} type="incomes" onUpdate={(_, u) => handleConfirmAdd('incomes', u.title || '', u.amount || 0)} onRemove={() => setAddingTo(null)} />}
                    {dayData.incomes.length === 0 && !addingTo && <p className="text-base text-emerald-600/30 text-center italic py-2">Sin ventas</p>}
                  </div>
                </div>
                <div className="h-px bg-emerald-900/30 mx-1"></div>
                <div>
                  <div className="flex justify-between items-center mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base uppercase font-extrabold text-teal-500/80 tracking-wide flex items-center gap-1"><Truck size={16} /> Repartos</span>
                      <span className="text-base font-mono font-bold text-teal-400/90">{formatCurrency(totalDeliveries)}</span>
                    </div>
                    <button onClick={() => handleStartAdd('deliveries')} className="p-1.5 rounded bg-teal-900/50 hover:bg-teal-800 text-teal-200 border border-teal-800/50 transition-colors">
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {dayData.deliveries.map(t => <TransactionItem key={t.id} transaction={t} type="deliveries" onUpdate={(id, u) => handleUpdateTransaction('deliveries', id, u)} onRemove={(id) => handleRemoveTransaction('deliveries', id)} onMove={(id) => handleMoveTransaction('deliveries', id)} />)}
                    {addingTo === 'deliveries' && <TransactionItem transaction={{id: 'new', title: '', amount: 0}} type="deliveries" onUpdate={(_, u) => handleConfirmAdd('deliveries', u.title || '', u.amount || 0)} onRemove={() => setAddingTo(null)} />}
                    {dayData.deliveries.length === 0 && !addingTo && <p className="text-base text-teal-600/30 text-center italic py-2">Sin repartos</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: EGRESOS */}
          <div className="flex flex-col gap-4">
            <h4 className={`text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-1 ${isDailyView ? 'block' : 'hidden'}`}>Egresos</h4>
            <div className="rounded-lg bg-rose-950/40 border border-rose-900/50 overflow-hidden shadow-sm flex-1 h-fit">
              <div className="flex justify-between items-center px-4 py-3 bg-rose-950 border-b border-rose-900">
                <h3 className="font-bold text-xl text-rose-200 uppercase flex items-center gap-2 tracking-wider">
                  <TrendingDown size={20} className="text-rose-400"/> Egresos
                </h3>
                <span className="text-lg font-mono font-bold text-rose-300 bg-rose-900/60 px-3 py-1 rounded border border-rose-800/50">{formatCurrency(totalExpense + totalSalaries)}</span>
              </div>
              <div className="p-3 space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base uppercase font-extrabold text-rose-500/80 tracking-wide">Gastos</span>
                      <span className="text-base font-mono font-bold text-rose-400/90">{formatCurrency(totalExpense)}</span>
                    </div>
                    <button onClick={() => handleStartAdd('expenses')} className="p-1.5 rounded bg-rose-900/50 hover:bg-rose-800 text-rose-200 border border-rose-800/50 transition-colors">
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {dayData.expenses.map(t => <TransactionItem key={t.id} transaction={t} type="expenses" onUpdate={(id, u) => handleUpdateTransaction('expenses', id, u)} onRemove={(id) => handleRemoveTransaction('expenses', id)} onMove={(id) => handleMoveTransaction('expenses', id)} />)}
                    {addingTo === 'expenses' && <TransactionItem transaction={{id: 'new', title: '', amount: 0}} type="expenses" onUpdate={(_, u) => handleConfirmAdd('expenses', u.title || '', u.amount || 0)} onRemove={() => setAddingTo(null)} />}
                    {dayData.expenses.length === 0 && !addingTo && <p className="text-base text-rose-600/40 text-center italic py-2">Sin gastos</p>}
                  </div>
                </div>
                <div className="h-px bg-rose-900/30 mx-1"></div>
                 <div>
                  <div className="flex justify-between items-center mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base uppercase font-extrabold text-amber-500/80 tracking-wide flex items-center gap-1"><Users size={16} /> Adelantos/Sueldos</span>
                      <span className="text-base font-mono font-bold text-amber-400/90">{formatCurrency(totalSalaries)}</span>
                    </div>
                    <button onClick={() => handleStartAdd('salaries')} className="p-1.5 rounded bg-amber-900/50 hover:bg-amber-800 text-amber-200 border border-amber-800/50 transition-colors">
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {dayData.salaries.map(t => <TransactionItem key={t.id} transaction={t} type="salaries" onUpdate={(id, u) => handleUpdateTransaction('salaries', id, u)} onRemove={(id) => handleRemoveTransaction('salaries', id)} onMove={(id) => handleMoveTransaction('salaries', id)} />)}
                    {addingTo === 'salaries' && <TransactionItem transaction={{id: 'new', title: '', amount: 0}} type="salaries" onUpdate={(_, u) => handleConfirmAdd('salaries', u.title || '', u.amount || 0)} onRemove={() => setAddingTo(null)} />}
                    {dayData.salaries.length === 0 && !addingTo && <p className="text-base text-amber-600/40 text-center italic py-2">Sin adelantos</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: A TESORO */}
          <div className="flex flex-col gap-4">
            <h4 className={`text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-1 ${isDailyView ? 'block' : 'hidden'}`}>A Tesoro</h4>
            <div className="rounded-lg bg-indigo-950/40 border border-indigo-900/50 overflow-hidden shadow-sm flex-1 h-fit">
              <div className="flex justify-between items-center px-4 py-3 bg-indigo-950 border-b border-indigo-900">
                <h3 className="font-bold text-xl text-indigo-200 uppercase flex items-center gap-2 tracking-wider">
                  <div className="flex items-center gap-1.5"><Archive size={20} className="text-indigo-400"/> A Tesoro</div>
                  <span className="text-lg font-mono font-bold text-indigo-300 bg-indigo-900/60 px-3 py-1 rounded border border-indigo-800/50">{formatCurrency(treasuryDayFlow)}</span>
                </h3>
                <button onClick={() => handleStartAdd('toBox')} className="p-1.5 rounded bg-indigo-900 hover:bg-indigo-800 text-indigo-100 transition-colors border border-indigo-800">
                  <Plus size={18} />
                </button>
              </div>
              <div className="p-3 space-y-2 min-h-[3rem]">
                {dayData.toBox.map(t => <TransactionItem key={t.id} transaction={t} type="toBox" onUpdate={(id, u) => handleUpdateTransaction('toBox', id, u)} onRemove={(id) => handleRemoveTransaction('toBox', id)} />)}
                {addingTo === 'toBox' && <TransactionItem transaction={{id: 'new', title: 'Tesoro', amount: 0}} type="toBox" onUpdate={(_, u) => handleConfirmAdd('toBox', u.title || '', u.amount || 0)} onRemove={() => setAddingTo(null)} />}
                {dayData.toBox.length === 0 && !addingTo && <p className="text-base text-indigo-600/40 text-center italic py-2">0.00</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};