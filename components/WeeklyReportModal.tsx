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
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#84cc16'
];

export const WeeklyReportModal: React.FC<WeeklyReportModalProps> = ({ isOpen, onClose, weekData }) => {
  // Grouping Logic
  const processData = (type: 'incomes' | 'expenses') => {
    const grouped: Record<string, number> = {};
    
    Object.values(weekData).forEach((day: DayData) => {
      day[type].forEach((t) => {
        if (t.amount > 0 && t.title.trim() !== '') {
          // Normalize title (lowercase, trim)
          const key = t.title.trim().toLowerCase();
          grouped[key] = (grouped[key] || 0) + t.amount;
        }
      });
    });

    // Convert to array and sort
    return Object.entries(grouped)
      .map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);
  };

  const incomesData = React.useMemo(() => processData('incomes'), [weekData]);
  const expensesData = React.useMemo(() => processData('expenses'), [weekData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PieChart 
              data={incomesData} 
              title="Distribución de Ingresos" 
              emptyMessage="No hay ingresos registrados esta semana."
            />
            <PieChart 
              data={expensesData} 
              title="Distribución de Egresos" 
              emptyMessage="No hay egresos registrados esta semana."
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