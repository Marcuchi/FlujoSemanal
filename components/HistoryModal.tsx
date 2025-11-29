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
      case 'expenses': return { label: 'Egreso', color: 'text-rose-400' };
      case 'toBox': return { label: 'A Caja', color: 'text-indigo-400' };
      default: return { label: 'Item', color: 'text-slate-400' };
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Trash2 className="text-slate-400" size={20} />
            <h2 className="text-xl font-bold text-slate-100">Papelera / Historial</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-950">
          {sortedHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3 py-10">
              <Trash2 size={48} className="opacity-20" />
              <p>No hay elementos eliminados recientemente.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedHistory.map((item) => {
                const typeInfo = getTypeLabel(item.originalType);
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors group">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                           {formatDate(item.deletedAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-200">
                        <span className="font-medium truncate">{item.title || "Sin descripción"}</span>
                        <ArrowRight size={12} className="text-slate-600"/>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar size={10} /> {getDayName(item.originalDayId)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="font-mono font-bold text-slate-200">{formatCurrency(item.amount)}</span>
                      <button 
                        onClick={() => onRestore(item)}
                        title="Restaurar"
                        className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/30 border border-slate-700 hover:border-emerald-900 transition-all"
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

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/50 text-center">
          <p className="text-[10px] text-slate-500">Los elementos se eliminan permanentemente al reiniciar la semana.</p>
        </div>

      </div>
    </div>
  );
};