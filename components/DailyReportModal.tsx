
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-[90vw] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-