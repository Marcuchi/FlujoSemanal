
import React from 'react';
import { X, LayoutGrid, RotateCcw, ArrowRight, Scale, BookUser } from 'lucide-react';
import { AppMode } from '../types';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReset: () => void;
  currentApp: AppMode;
  onSwitchApp: (app: AppMode) => void;
}

export const MenuModal: React.FC<MenuModalProps> = ({ isOpen, onClose, onReset, currentApp, onSwitchApp }) => {
  if (!isOpen) return null;

  const handleAppClick = (app: AppMode) => {
    onSwitchApp(app);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden relative">
        
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Menú Principal</h2>
          <p className="text-slate-400 text-sm mb-8">Selecciona una aplicación o acción.</p>

          <div className="grid gap-4">
            {/* Flow App */}
            <button 
              onClick={() => handleAppClick('FLOW')}
              className={`group flex items-center justify-between p-4 rounded-xl border transition-all ${
                currentApp === 'FLOW' 
                  ? 'bg-indigo-600/10 border-indigo-500/50 hover:bg-indigo-600/20' 
                  : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg shadow-lg ${currentApp === 'FLOW' ? 'bg-indigo-600 text-white shadow-indigo-900/50' : 'bg-slate-700 text-slate-400'}`}>
                  <LayoutGrid size={24} />
                </div>
                <div className="text-left">
                  <h3 className={`font-bold transition-colors ${currentApp === 'FLOW' ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>Flujo Semanal</h3>
                  <p className="text-xs text-slate-400">Gestión de caja y movimientos</p>
                </div>
              </div>
              {currentApp === 'FLOW' && (
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold px-2 py-1 bg-indigo-950/50 rounded border border-indigo-900/50">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  ACTIVO
                </div>
              )}
            </button>

            {/* Kilos App */}
            <button 
              onClick={() => handleAppClick('KILOS')}
              className={`group flex items-center justify-between p-4 rounded-xl border transition-all ${
                currentApp === 'KILOS' 
                  ? 'bg-orange-600/10 border-orange-500/50 hover:bg-orange-600/20' 
                  : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg shadow-lg ${currentApp === 'KILOS' ? 'bg-orange-600 text-white shadow-orange-900/50' : 'bg-slate-700 text-slate-400'}`}>
                  <Scale size={24} />
                </div>
                <div className="text-left">
                  <h3 className={`font-bold transition-colors ${currentApp === 'KILOS' ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>Control de Kilos</h3>
                  <p className="text-xs text-slate-400">Particulares, Reparto y Devoluciones</p>
                </div>
              </div>
              {currentApp === 'KILOS' && (
                <div className="flex items-center gap-2 text-orange-400 text-xs font-semibold px-2 py-1 bg-orange-950/50 rounded border border-orange-900/50">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                  </span>
                  ACTIVO
                </div>
              )}
            </button>

            {/* Cuentas Corrientes App */}
            <button 
              onClick={() => handleAppClick('CC')}
              className={`group flex items-center justify-between p-4 rounded-xl border transition-all ${
                currentApp === 'CC' 
                  ? 'bg-emerald-600/10 border-emerald-500/50 hover:bg-emerald-600/20' 
                  : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg shadow-lg ${currentApp === 'CC' ? 'bg-emerald-600 text-white shadow-emerald-900/50' : 'bg-slate-700 text-slate-400'}`}>
                  <BookUser size={24} />
                </div>
                <div className="text-left">
                  <h3 className={`font-bold transition-colors ${currentApp === 'CC' ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>Cuentas Corrientes</h3>
                  <p className="text-xs text-slate-400">Nico, Amilcar, Alexis, Oviedo, Bravo</p>
                </div>
              </div>
              {currentApp === 'CC' && (
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold px-2 py-1 bg-emerald-950/50 rounded border border-emerald-900/50">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  ACTIVO
                </div>
              )}
            </button>

          </div>

          <div className="mt-8 pt-6 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Zona de Peligro</h3>
            
            <button 
              onClick={() => {
                onReset();
                onClose();
              }}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-red-950/20 border border-red-900/30 hover:bg-red-900/30 hover:border-red-800/50 transition-colors group"
            >
               <div className="flex items-center gap-3">
                 <div className="p-2 rounded bg-red-900/20 text-red-400 group-hover:text-red-300">
                    <RotateCcw size={18} />
                 </div>
                 <div className="text-left">
                    <div className="text-sm font-semibold text-red-400 group-hover:text-red-300">Reiniciar {currentApp === 'FLOW' ? 'Semana' : 'Tabla'} Actual</div>
                    <div className="text-[10px] text-red-500/60">Borra todos los datos de la vista actual</div>
                 </div>
               </div>
               <ArrowRight size={16} className="text-red-900 group-hover:text-red-500 transition-colors" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
