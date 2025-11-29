import React from 'react';
import { X, FileText } from 'lucide-react';
import { WeekData, DayData } from '../types';
import { PieChart } from './PieChart';

interface WeeklyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekData: WeekData;
}

const COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'
];

export const WeeklyReportModal: React.FC<WeeklyReportModalProps> = ({ isOpen, onClose, weekData }) => {
  // Grouping Logic
  const processData = (dataType: 'incomes' | 'deliveries' | 'expenses') => {
    const grouped: Record<string, number> = {};
    
    Object.values(weekData).forEach((day: DayData) => {
      // Direct access to the specific array
      const list = day[dataType];

      list.forEach((t) => {
        if (t.amount > 0 && t.title.trim() !== '') {
          const key = t.title.trim().toLowerCase();
          grouped[key] = (grouped[key] || 0) + t.amount;
        }
      });
    });

    // Convert to array and sort
    const sorted = Object.entries(grouped)
      .map(([name, value]) => ({
        name,
        value
      }))
      .sort((a, b) => b.value - a.value);

    // Take top 5
    const top5 = sorted.slice(0, 5).map((item, index) => ({
      ...item,
      color: COLORS[index % COLORS.length]
    }));

    // Calculate "Others"
    const othersValue = sorted.slice(5).reduce((acc, curr) => acc + curr.value, 0);

    if (othersValue > 0) {
      top5.push({
        name: 'Otros',
        value: othersValue,
        color: '#475569' // slate-600
      });
    }

    return top5;
  };

  const incomesData = React.useMemo(() => processData('incomes'), [weekData]);
  const deliveriesData = React.useMemo(() => processData('deliveries'), [weekData]);
  const expensesData = React.useMemo(() => processData('expenses'), [weekData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <FileText className="text-indigo-400" size={20} />
            <h2 className="text-xl font-bold text-slate-100">Informe Semanal</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
          
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <PieChart 
              data={incomesData} 
              title="Top 5 General" 
              emptyMessage="No hay ingresos generales registrados."
            />
            <PieChart 
              data={deliveriesData} 
              title="Top 5 Repartos" 
              emptyMessage="No hay repartos registrados."
            />
            <PieChart 
              data={expensesData} 
              title="Top 5 Egresos" 
              emptyMessage="No hay egresos registrados."
            />
          </div>
        </div>

        {/* Footer Actions */}
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