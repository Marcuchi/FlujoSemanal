import React from 'react';
import { X, FileText, Users, ArrowUpCircle, ArrowDownCircle, Scale } from 'lucide-react';
import { WeekData, DayData } from '../types';
import { PieChart } from './PieChart';
import { formatCurrency } from '../utils';

interface WeeklyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekData: WeekData;
  totalIncome: number;
  totalExpense: number;
  netTotal: number;
}

const COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'
];

const SummaryCard = ({ label, value, icon: Icon, colorClass, borderClass }: { label: string, value: number, icon: any, colorClass: string, borderClass: string }) => (
  <div className={`flex-1 bg-slate-900/50 border ${borderClass} rounded-2xl p-4 flex flex-col items-center justify-center shadow-lg`}>
    <Icon className={`${colorClass} mb-2`} size={28} strokeWidth={1.5} />
    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{label}</span>
    <span className={`text-2xl font-black font-mono ${colorClass}`}>{formatCurrency(value)}</span>
  </div>
);

export const WeeklyReportModal: React.FC<WeeklyReportModalProps> = ({ isOpen, onClose, weekData, totalIncome, totalExpense, netTotal }) => {
  
  // Logic for Pie Charts (Top 5 + Others)
  const processData = (dataType: 'incomes' | 'deliveries' | 'expenses') => {
    const grouped: Record<string, number> = {};
    
    Object.values(weekData).forEach((day: DayData) => {
      const list = day[dataType];
      list.forEach((t) => {
        if (t.amount > 0 && t.title.trim() !== '') {
          const key = t.title.trim().toLowerCase();
          grouped[key] = (grouped[key] || 0) + t.amount;
        }
      });
    });

    const sorted = Object.entries(grouped)
      .map(([name, value]) => ({
        name,
        value
      }))
      .sort((a, b) => b.value - a.value);

    const top5 = sorted.slice(0, 5).map((item, index) => ({
      ...item,
      color: COLORS[index % COLORS.length]
    }));

    const othersValue = sorted.slice(5).reduce((acc, curr) => acc + curr.value, 0);
    const othersList = sorted.slice(5).map(item => ({ name: item.name, value: item.value }));

    if (othersValue > 0) {
      top5.push({
        name: 'Otros',
        value: othersValue,
        color: '#475569' // slate-600
      });
    }

    return { data: top5, othersList };
  };

  // Logic for Salaries List (All items, grouped by name)
  const getSalariesList = () => {
    const grouped: Record<string, number> = {};
    
    Object.values(weekData).forEach((day: DayData) => {
      const list = day.salaries;
      list.forEach((t) => {
        if (t.amount > 0 && t.title.trim() !== '') {
          const key = t.title.trim().toLowerCase();
          grouped[key] = (grouped[key] || 0) + t.amount;
        }
      });
    });

    // Return full list sorted by amount
    return Object.entries(grouped)
      .map(([name, value]) => ({
        name,
        value
      }))
      .sort((a, b) => b.value - a.value);
  };

  const incomesResult = React.useMemo(() => processData('incomes'), [weekData]);
  const deliveriesResult = React.useMemo(() => processData('deliveries'), [weekData]);
  const expensesResult = React.useMemo(() => processData('expenses'), [weekData]);
  const salariesList = React.useMemo(() => getSalariesList(), [weekData]);

  const totalSalaries = salariesList.reduce((acc, item) => acc + item.value, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-[95vw] max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-900/50 rounded-xl border border-indigo-500/30">
              <FileText className="text-indigo-400" size={24} />
            </div>
            <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tight">Balance Semanal</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar bg-slate-950">
          
          {/* General Indices Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SummaryCard 
              label="Ingresos Totales" 
              value={totalIncome} 
              icon={ArrowUpCircle} 
              colorClass="text-emerald-400" 
              borderClass="border-emerald-500/20" 
            />
            <SummaryCard 
              label="Egresos Totales" 
              value={totalExpense} 
              icon={ArrowDownCircle} 
              colorClass="text-rose-400" 
              borderClass="border-rose-500/20" 
            />
            <SummaryCard 
              label="Total Neto" 
              value={netTotal} 
              icon={Scale} 
              colorClass="text-cyan-400" 
              borderClass="border-cyan-500/20" 
            />
          </div>

          <div className="h-px bg-slate-800 w-full"></div>

          {/* Charts Row - 2x2 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-8">
            <PieChart 
              data={incomesResult.data} 
              title="Distribución Ingresos Gral" 
              emptyMessage="No hay ingresos generales registrados."
              othersList={incomesResult.othersList}
            />
            <PieChart 
              data={deliveriesResult.data} 
              title="Distribución Repartos" 
              emptyMessage="No hay repartos registrados."
              othersList={deliveriesResult.othersList}
            />
            <PieChart 
              data={expensesResult.data} 
              title="Distribución Gastos" 
              emptyMessage="No hay gastos registrados."
              othersList={expensesResult.othersList}
            />
            
            {/* Custom List for Salaries */}
            <div className="flex flex-col h-full bg-slate-900/50 rounded-2xl border border-slate-800 p-6 shadow-lg">
              <div className="flex flex-row justify-between items-center mb-6 border-b border-slate-800 pb-4">
                <h3 className="text-sm font-black text-amber-200 uppercase tracking-wider flex items-center gap-2">
                   <Users size={18} /> Detalle Adelantos
                </h3>
                <span className="text-xl font-mono font-bold text-amber-100 bg-amber-900/30 px-4 py-1.5 rounded-xl border border-amber-900/50 shadow-sm">
                  {formatCurrency(totalSalaries)}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto max-h-80 custom-scrollbar pr-2">
                {salariesList.length === 0 ? (
                   <div className="flex flex-col items-center justify-center h-full text-slate-500 italic py-10">
                      No hay adelantos registrados.
                   </div>
                ) : (
                  <div className="space-y-2">
                    {salariesList.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-800/40 rounded-xl transition-all border-b border-slate-800/50 last:border-0 group">
                         <div className="flex items-center gap-4">
                           <span className="text-xs font-mono text-slate-500 w-6 font-bold">{idx + 1}.</span>
                           <span className="text-slate-200 font-bold capitalize truncate group-hover:text-amber-200">{item.name}</span>
                         </div>
                         <span className="text-amber-400 font-mono font-black text-base">
                            {formatCurrency(item.value)}
                         </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/80 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black uppercase tracking-widest rounded-xl transition-all border border-slate-700 active:scale-95"
          >
            Cerrar Informe
          </button>
        </div>

      </div>
    </div>
  );
};