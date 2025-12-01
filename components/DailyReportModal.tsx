
import React from 'react';
import { X, FileText, Users } from 'lucide-react';
import { DayData } from '../types';
import { PieChart } from './PieChart';
import { formatCurrency } from '../utils';

interface DailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayData: DayData;
}

const COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'
];

export const DailyReportModal: React.FC<DailyReportModalProps> = ({ isOpen, onClose, dayData }) => {
  
  const processData = (dataType: 'incomes' | 'deliveries' | 'expenses') => {
    const grouped: Record<string, number> = {};
    const list = dayData[dataType];

    list.forEach((t) => {
        if (t.amount > 0 && t.title.trim() !== '') {
          const key = t.title.trim().toLowerCase();
          grouped[key] = (grouped[key] || 0) + t.amount;
        }
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

    // List for "Others" drilldown
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

  const getSalariesList = () => {
    const grouped: Record<string, number> = {};
    const list = dayData.salaries;
    
    list.forEach((t) => {
        if (t.amount > 0 && t.title.trim() !== '') {
          const key = t.title.trim().toLowerCase();
          grouped[key] = (grouped[key] || 0) + t.amount;
        }
    });

    return Object.entries(grouped)
      .map(([name, value]) => ({
        name,
        value
      }))
      .sort((a, b) => b.value - a.value);
  };

  const incomesResult = React.useMemo(() => processData('incomes'), [dayData]);
  const deliveriesResult = React.useMemo(() => processData('deliveries'), [dayData]);
  const expensesResult = React.useMemo(() => processData('expenses'), [dayData]);
  const salariesList = React.useMemo(() => getSalariesList(), [dayData]);

  const totalSalaries = salariesList.reduce((acc, item) => acc + item.value, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-[90vw] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <FileText className="text-indigo-400" size={20} />
            <h2 className="text-xl font-bold text-slate-100">Informe Diario: {dayData.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-8">
            <PieChart 
              data={incomesResult.data}
              title="Top 5 General" 
              emptyMessage="No hay ingresos generales hoy."
              othersList={incomesResult.othersList}
            />
            <PieChart 
              data={deliveriesResult.data} 
              title="Top 5 Repartos" 
              emptyMessage="No hay repartos hoy."
              othersList={deliveriesResult.othersList}
            />
            <PieChart 
              data={expensesResult.data} 
              title="Top 5 Egresos" 
              emptyMessage="No hay gastos hoy."
              othersList={expensesResult.othersList}
            />
            
            <div className="flex flex-col h-full bg-slate-900/50 rounded-xl border border-slate-800 p-5">
              <div className="flex flex-row justify-between items-center mb-6 border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-amber-200 uppercase tracking-wider flex items-center gap-2">
                   <Users size={16} /> Detalle Adelantos
                </h3>
                <span className="text-lg font-mono font-bold text-amber-100 bg-amber-900/30 px-3 py-1 rounded-lg border border-amber-900/50 shadow-sm">
                  {formatCurrency(totalSalaries)}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto max-h-64 custom-scrollbar pr-2">
                {salariesList.length === 0 ? (
                   <div className="flex flex-col items-center justify-center h-full text-slate-500 italic">
                      No hay adelantos hoy.
                   </div>
                ) : (
                  <div className="space-y-2">
                    {salariesList.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 hover:bg-slate-800/30 rounded transition-colors border-b border-slate-800/50 last:border-0">
                         <div className="flex items-center gap-3">
                           <span className="text-xs font-mono text-slate-500 w-4">{idx + 1}.</span>
                           <span className="text-slate-300 font-medium capitalize truncate">{item.name}</span>
                         </div>
                         <span className="text-amber-300 font-mono font-bold text-sm">
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

        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
