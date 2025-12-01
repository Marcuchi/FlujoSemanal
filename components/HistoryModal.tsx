import React from 'react';
import { X, RotateCcw, Trash2, Calendar, ArrowRight } from 'lucide-react';
import { HistoryItem, DAYS_OF_WEEK } from '../types';
import { formatCurrency } from '../utils';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onRestore: (item: HistoryItem) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, history, onRestore }) => {
  if (!isOpen) return null;

  // Sort by deletedAt desc (newest deleted first)
  const sortedHistory = [...history].sort((a, b) => 
    new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
  );

  const getDayName = (id: string) => DAYS_OF_WEEK.find(d => d.id === id)?.name || id;
  
  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'incomes': return { label: 'Ingreso', color: 'text-emerald-400' };
      case 'deliveries': return { label: 'Reparto', color: 'text-teal-400' };
      case 'expenses': return { label: 'Gasto', color: 'text-rose-400' };
      case 'salaries': return { label: 'Adelanto', color: 'text-amber-400' };
      case 'toBox': return { label: 'A Caja', color: 'text-indigo-400' };
      default: return { label: 'Item', color: 'text-slate-400' };
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Trash2 className="text-