import React from 'react';
import { X, Calendar, Layers } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportWeek: () => void;
  onImportMonth: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImportWeek, onImportMonth }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden relative">
        
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
            <Layers size={24} className="text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">Importar Datos</h2>
          <p className="text-sm text-slate-400 mb-8">Selecciona el tipo de archivo que vas a subir.</p>

          <div className="space-y-3">
            <button 
              onClick={() => { onImportWeek(); onClose(); }}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-700 group-hover:bg-emerald-600 rounded-lg text-slate-300 group-hover:text-white transition-colors">
                    <Calendar size={18} />
                </div>
                <div className="text-left">
                    <div className="text-sm font-bold text-slate-200">Semana Individual</div>
                    <div className="text-xs text-slate-500">Sobrescribe la semana actual</div>
                </div>
              </div>
            </button>

            <button 
              onClick={() => { onImportMonth(); onClose(); }}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-700 group-hover:bg-emerald-600 rounded-lg text-slate-300 group-hover:text-white transition-colors">
                    <Layers size={18} />
                </div>
                <div className="text-left">
                    <div className="text-sm font-bold text-slate-200">Mes Completo</div>
                    <div className="text-xs text-slate-500">Carga múltiples semanas</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};