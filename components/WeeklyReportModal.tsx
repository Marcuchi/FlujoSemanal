
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

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const StatCard = ({ label, value, icon: Icon, colorClass }: { label: string; value: number; icon: any; colorClass: string; }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4 shadow-lg">
    <div className={`p-3 rounded-full bg-opacity-10 ${colorClass.replace('text', 'bg').replace('-400', '-500')}`}>
      <Icon className={colorClass} size={24} />
    </div>
    <div>
      <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">{label}</div>
      <div className={`text-xl font-mono font-bold ${colorClass}`}>{formatCurrency(value)}</div>
    </div>
  </div>
);

export const WeeklyReportModal: React.FC<WeeklyReportModalProps> = ({ isOpen, onClose, weekData, totalIncome, totalExpense, netTotal }) => {
  if (!isOpen) return null;

  const processData = (dataType: 'incomes' | 'deliveries' | 'expenses') => {
    const grouped: Record<string, number> = {};
    Object.values(weekData).forEach((day: DayData) => {
      day[dataType]?.forEach((t) => {
        if (t.amount > 0 && t.title.trim() !== '') {
          const key = t.title.trim().toLowerCase();
          grouped[key] = (grouped[key] || 0) + t.amount;
        }
      });
    });
    const sorted = Object.entries(grouped).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const top5 = sorted.slice(0, 5).map((item, idx) => ({ ...item, color: COLORS[idx % COLORS.length] }));
    const othersList = sorted.slice(5).map(item => ({ name: item.name, value: item.value }));
    if (othersList.length > 0) {
      top5.push({ name: 'Otros', value: othersList.reduce((a, b) => a + b.value, 0), color: '#475569' });
    }
    return { data: top5, othersList };
  };

  const getSalariesList = () => {
    const grouped: Record<string, number> = {};
    Object.values(weekData).forEach((day: DayData) => {
      day.salaries?.forEach((t) => {
        if (t.amount > 0 && t.title.trim() !== '') {
          const key = t.title.trim().toLowerCase();
          grouped[key] = (grouped[key] || 0) + t.amount;
        }
      });
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  };

  const incomesResult = React.useMemo(() => processData('incomes'), [weekData]);
  const deliveriesResult = React.useMemo(() => processData('deliveries'), [weekData]);
  const expensesResult = React.useMemo(() => processData('expenses'), [weekData]);
  const salariesList = React.useMemo(() => getSalariesList(), [weekData]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-[90vw] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2"><FileText className="text-indigo-400" size={20} /><h2 className="text-xl font-bold text-slate-100">Informe Semanal</h2></div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <StatCard label="Ingresos Totales" value={totalIncome} icon={ArrowUpCircle} colorClass="text-emerald-400" />
             <StatCard label="Egresos Totales" value={totalExpense} icon={ArrowDownCircle} colorClass="text-rose-400" />
             <StatCard label="Saldo Neto" value={netTotal} icon={Scale} colorClass="text-cyan-400" />
          </div>

          <div className="h-px bg-slate-800 w-full"></div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <PieChart data={incomesResult.data} title="Top 5 General" emptyMessage="Sin ingresos registrados." othersList={incomesResult.othersList} />
            <PieChart data={deliveriesResult.data} title="Top 5 Repartos" emptyMessage="Sin repartos registrados." othersList={deliveriesResult.othersList} />
            <PieChart data={expensesResult.data} title="Top 5 Egresos" emptyMessage="Sin gastos registrados." othersList={expensesResult.othersList} />
            
            <div className="flex flex-col h-full bg-slate-900/50 rounded-xl border border-slate-800 p-5">
              <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-amber-200 uppercase flex items-center gap-2"><Users size={16} /> Adelantos</h3>
                <span className="text-lg font-mono font-bold text-amber-100 bg-amber-900/30 px-3 py-1 rounded-lg border border-amber-900/50">{formatCurrency(salariesList.reduce((a, b) => a + b.value, 0))}</span>
              </div>
              <div className="flex-1 overflow-y-auto max-h-64 custom-scrollbar">
                {salariesList.length === 0 ? <p className="text-slate-500 italic text-center py-10">Sin adelantos.</p> : salariesList.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 border-b border-slate-800 last:border-0 hover:bg-slate-800/30 transition-colors">
                    <span className="text-slate-300 capitalize">{item.name}</span>
                    <span className="text-amber-300 font-mono font-bold">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-lg">Cerrar</button>
        </div>
      </div>
    </div>
  );
};
