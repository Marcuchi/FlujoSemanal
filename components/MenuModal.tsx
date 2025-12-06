
import React from 'react';
import { X, LayoutGrid, Scale, BookUser, Banknote, Database, Truck, ChevronRight, MapPin } from 'lucide-react';
import { AppMode } from '../types';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentApp: AppMode;
  onSwitchApp: (app: AppMode) => void;
  onSelectZone: (zone?: string) => void;
  activeZone?: string;
  isRestrictedMode: boolean;
}

export const MenuModal: React.FC<MenuModalProps> = ({ 
  isOpen, 
  onClose, 
  currentApp, 
  onSwitchApp, 
  onSelectZone,
  activeZone,
  isRestrictedMode
}) => {
  const [showRepartos, setShowRepartos] = React.useState(false);

  if (!isOpen) return null;

  const handleAppClick = (app: AppMode) => {
    onSwitchApp(app);
    if (app === 'FLOW') {
        onSelectZone(undefined);
    }
    onClose();
  };

  const handleZoneClick = (zoneLabel: string) => {
      onSwitchApp('FLOW');
      onSelectZone(zoneLabel);
      onClose();
  };

  const repartosList = [
    { id: 'malvinas', label: 'Malvinas' },
    { id: 'flores', label: 'Flores' },
    { id: 'rodolfo', label: 'Rodolfo' },
    { id: 'garbino', label: 'Garbino' },
  ];

  // Logic: The menu is only restricted if the User entered via "Repartos" (isRestrictedMode is true).
  // If they entered via "General", they see the full menu even if a zone is active.
  const isRestricted = isRestrictedMode;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-slate-100 mb-2">
            {isRestricted ? 'Zonas de Reparto' : 'Menú Principal'}
          </h2>
          <p className="text-slate-400 text-sm mb-8">
            {isRestricted ? `Zona actual: ${activeZone}` : 'Selecciona una aplicación.'}
          </p>

          <div className="grid gap-4">
            
            {/* --- GENERAL APPS (HIDDEN IN RESTRICTED MODE) --- */}
            {!isRestricted && (
                <button 
                onClick={() => handleAppClick('FLOW')}
                className={`group flex items-center justify-between p-4 rounded-xl border transition-all ${
                    currentApp === 'FLOW' && !activeZone
                    ? 'bg-indigo-600/10 border-indigo-500/50 hover:bg-indigo-600/20' 
                    : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
                }`}
                >
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg shadow-lg ${currentApp === 'FLOW' && !activeZone ? 'bg-indigo-600 text-white shadow-indigo-900/50' : 'bg-slate-700 text-slate-400'}`}>
                    <LayoutGrid size={24} />
                    </div>
                    <div className="text-left">
                    <h3 className={`font-bold transition-colors ${currentApp === 'FLOW' && !activeZone ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>Flujo Semanal</h3>
                    <p className="text-xs text-slate-400">Gestión General</p>
                    </div>
                </div>
                {currentApp === 'FLOW' && !activeZone && (
                    <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold px-2 py-1 bg-indigo-950/50 rounded border border-indigo-900/50">
                    ACTIVO
                    </div>
                )}
                </button>
            )}

            {/* --- REPARTOS SECTION --- */}
            {isRestricted ? (
                // Restricted Mode: Direct List of Zones
                <div className="space-y-3">
                   {repartosList.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleZoneClick(item.label)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all group ${
                            activeZone === item.label 
                            ? 'bg-emerald-900/20 border-emerald-500/50' 
                            : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-emerald-500/50'
                        }`}
                      >
                         <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${activeZone === item.label ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400 group-hover:text-emerald-400'}`}>
                               <MapPin size={24} />
                            </div>
                            <span className={`font-bold text-lg ${activeZone === item.label ? 'text-emerald-100' : 'text-slate-300 group-hover:text-emerald-100'}`}>
                                {item.label}
                            </span>
                         </div>
                         {activeZone === item.label && (
                            <div className="text-xs text-emerald-400 font-bold px-2 py-1 bg-emerald-950/50 rounded border border-emerald-900">
                                ACTUAL
                            </div>
                         )}
                      </button>
                   ))}
                </div>
            ) : (
                // General Mode: Dropdown
                <div className={`rounded-xl border transition-all overflow-hidden ${showRepartos || activeZone ? 'bg-slate-800 border-emerald-500/50' : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'}`}>
                    <button 
                    onClick={() => setShowRepartos(!showRepartos)}
                    className="w-full flex items-center justify-between p-4"
                    >
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg shadow-lg ${showRepartos || activeZone ? 'bg-emerald-600 text-white shadow-emerald-900/50' : 'bg-slate-700 text-slate-400'}`}>
                            <Truck size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className={`font-bold transition-colors ${showRepartos || activeZone ? 'text-white' : 'text-slate-300'}`}>Repartos</h3>
                            <p className="text-xs text-slate-400">
                                {activeZone ? `Zona: ${activeZone}` : 'Seleccionar zona'}
                            </p>
                        </div>
                    </div>
                    <div className={`transform transition-transform duration-200 ${showRepartos ? 'rotate-90 text-emerald-400' : 'text-slate-500'}`}>
                        <ChevronRight size={20} />
                    </div>
                    </button>
                    
                    {showRepartos && (
                    <div className="px-4 pb-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
                        {repartosList.map((item) => (
                            <button
                            key={item.id}
                            onClick={() => handleZoneClick(item.label)}
                            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors group ${activeZone === item.label ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-slate-900/50 border-slate-700 hover:border-emerald-500/50'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <MapPin size={16} className={activeZone === item.label ? 'text-emerald-400' : 'text-slate-500 group-hover:text-emerald-400'} />
                                    <span className={activeZone === item.label ? 'text-emerald-100 font-bold' : 'text-slate-300 group-hover:text-emerald-100 font-medium'}>{item.label}</span>
                                </div>
                                {activeZone === item.label && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                            </button>
                        ))}
                    </div>
                    )}
                </div>
            )}

            {/* --- OTHER APPS (HIDDEN IN RESTRICTED MODE) --- */}
            {!isRestricted && (
                <>
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
                        ACTIVO
                        </div>
                    )}
                    </button>
                </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
