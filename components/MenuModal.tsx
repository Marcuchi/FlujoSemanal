
import React from 'react';
import { X, LayoutGrid, Scale, BookUser, Banknote, Database } from 'lucide-react';
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

  const handleResetClick = () => {
    const password = window.prompt("Introduce la contraseña para reiniciar la semana:");
    if (password === "secreta") {
      onReset();
      onClose();
    } else if (password !== null) {
      alert("Contraseña incorrecta.");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden relative">
        
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Menú Principal</h2>
          <p className="text-slate-400 text-sm mb-8">Selecciona una aplicación.</p>

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
                  <p className="text-xs text-slate-400">Gestión de tesoro y movimientos</p>
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
                  <p className="text-xs text-slate-400">Gestión de cuentas</p>
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

            {/* Cheques App */}
            <button 
              onClick={() => handleAppClick('CHEQUES')}
              className={`group flex items-center justify-between p-4 rounded-xl border transition-all ${
                currentApp === 'CHEQUES' 
                  ? 'bg-violet-600/10 border-violet-500/50 hover:bg-violet-600/20' 
                  : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg shadow-lg ${currentApp === 'CHEQUES' ? 'bg-violet-600 text-white shadow-violet-900/50' : 'bg-slate-700 text-slate-400'}`}>
                  <Banknote size={24} />
                </div>
                <div className="text-left">
                  <h3 className={`font-bold transition-colors ${currentApp === 'CHEQUES' ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>Cheques en Cartera</h3>
                  <p className="text-xs text-slate-400">Listado de cheques y vencimientos</p>
                </div>
              </div>
              {currentApp === 'CHEQUES' && (
                <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold px-2 py-1 bg-violet-950/50 rounded border border-violet-900/50">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                  </span>
                  ACTIVO
                </div>
              )}
            </button>

             {/* General Data App */}
             <button 
              onClick={() => handleAppClick('GENERAL_DATA')}
              className={`group flex items-center justify-between p-4 rounded-xl border transition-all ${
                currentApp === 'GENERAL_DATA' 
                  ? 'bg-cyan-600/10 border-cyan-500/50 hover:bg-cyan-600/20' 
                  : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg shadow-lg ${currentApp === 'GENERAL_DATA' ? 'bg-cyan-600 text-white shadow-cyan-900/50' : 'bg-slate-700 text-slate-400'}`}>
                  <Database size={24} />
                </div>
                <div className="text-left">
                  <h3 className={`font-bold transition-colors ${currentApp === 'GENERAL_DATA' ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>Datos Generales</h3>
                  <p className="text-xs text-slate-400">Clientes, Proveedores y Empleados</p>
                </div>
              </div>
              {currentApp === 'GENERAL_DATA' && (
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold px-2 py-1 bg-cyan-950/50 rounded border border-cyan-900/50">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                  ACTIVO
                </div>
              )}
            </button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-800">
             <button 
               onClick={handleResetClick}
               className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-red-500/50 hover:bg-red-950/10 transition-colors group flex items-center justify-center gap-2"
             >
               <span className="text-slate-400 group-hover:text-red-400 font-bold text-sm">Reiniciar Semana Actual</span>
             </button>
             <p className="text-center text-[10px] text-slate-600 mt-2">Requiere contraseña</p>
          </div>

        </div>

      </div>
    </div>
  );
};
