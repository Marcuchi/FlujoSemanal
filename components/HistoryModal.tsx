
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
      case 'toBox': return { label: 'A Tesoro', color: 'text-indigo-400' };
      default: return { label: 'Item', color: 'text-slate-400' };
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Trash2 className="text-red-400" size={20} />
            <h2 className="text-xl font-bold text-slate-100">Historial (Papelera)</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
           {sortedHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500 italic">
                <Trash2 size={48} className="mb-2 opacity-20" />
                No hay elementos eliminados recientemente.
              </div>
           ) : (
             <div className="divide-y divide-slate-800">
               {sortedHistory.map((item) => {
                 const typeInfo = getTypeLabel(item.originalType);
                 return (
                   <div key={item.id} className="p-4 hover:bg-slate-900/50 transition-colors flex items-center justify-between group">
                      
                      <div className="flex items-center gap-4 overflow-hidden">
                          <div className={`w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-700`}>
                             <span className="text-xs font-bold text-slate-400">{getDayName(item.originalDayId).substring(0, 2)}</span>
                          </div>
                          <div className="min-w-0">
                              <h4 className="text-slate-200 font-medium truncate">{item.title || <span className="italic text-slate-600">Sin título</span>}</h4>
                              <div className="flex items-center gap-2 text-xs">
                                  <span className={`font-bold ${typeInfo.color}`}>{typeInfo.label}</span>
                                  <span className="text-slate-600">•</span>
                                  <span className="text-slate-500 flex items-center gap-1">
                                    <Calendar size={10} />
                                    {formatDate(item.deletedAt)}
                                  </span>
                              </div>
                          </div>
                      </div>

                      <div className="flex items-center gap-4 pl-4">
                          <span className="font-mono font-bold text-slate-300">{formatCurrency(item.amount)}</span>
                          <button 
                            onClick={() => onRestore(item)}
                            className="p-2 bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-lg transition-all border border-slate-700 hover:border-indigo-500 group-hover:shadow-lg"
                            title="Restaurar"
                          >
                             <RotateCcw size={16} />
                          </button>
                      </div>

                   </div>
                 );
               })}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
