import React from 'react';
import { X, LayoutGrid, Scale, BookUser, Banknote, Database, Sun, Moon, Download, Loader2, Upload } from 'lucide-react';
import { AppMode } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Database as DBRef, ref, get, set } from 'firebase/database';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReset: () => void;
  currentApp: AppMode;
  onSwitchApp: (app: AppMode) => void;
  db: DBRef | null;
}

export const MenuModal: React.FC<MenuModalProps> = ({ isOpen, onClose, currentApp, onSwitchApp, db }) => {
  const { theme, toggleTheme } = useTheme();
  const [downloading, setDownloading] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAppClick = (app: AppMode) => {
    onSwitchApp(app);
    onClose();
  };

  const verifyPasswordAndExecute = (action: () => void) => {
    const password = prompt("Ingrese contraseña de administrador:");
    if (password === "secreto") {
      action();
    } else {
      alert("Contraseña incorrecta.");
    }
  };

  const handleDownloadBackup = async () => {
    setDownloading(true);
    const backupData: any = { 
        timestamp: new Date().toISOString(),
        version: "1.0",
        source: db ? "firebase" : "local_storage" 
    };

    try {
        if (db) {
            // Firebase Mode - Fetch specific nodes to keep structure clean
            const promises = [
                get(ref(db, 'weeks')),
                get(ref(db, 'current_accounts')),
                get(ref(db, 'cheques')),
                get(ref(db, 'general_data'))
            ];

            const [weeksSnap, ccSnap, chequesSnap, genSnap] = await Promise.all(promises);
            
            backupData.weeks = weeksSnap.val();
            backupData.current_accounts = ccSnap.val();
            backupData.cheques = chequesSnap.val();
            backupData.general_data = genSnap.val();

        } else {
            // LocalStorage Mode - Scrape relevant keys
            const allKeys = Object.keys(localStorage);
            backupData.localStorageDump = {};
            
            allKeys.forEach(key => {
               if(key.startsWith('weekData_') || key.startsWith('history_') || key.startsWith('kilos_') || key === 'current_accounts' || key === 'cheques' || key === 'general_data') {
                   try {
                       backupData.localStorageDump[key] = JSON.parse(localStorage.getItem(key) || 'null');
                   } catch {
                       backupData.localStorageDump[key] = localStorage.getItem(key);
                   }
               }
            });
        }

        // Trigger Download
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup_completo_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (error) {
        console.error("Backup failed", error);
        alert("Error al generar el backup.");
    } finally {
        setDownloading(false);
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm("ADVERTENCIA CRÍTICA:\n\nEsta acción SOBRESCRIBIRÁ COMPLETAMENTE la base de datos actual con los datos del archivo seleccionado.\n\nEsta acción no se puede deshacer.\n\n¿Estás seguro de continuar?")) {
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
    }

    setImporting(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
        try {
            const json = JSON.parse(event.target?.result as string);
            
            if (db) {
                // Restore to Firebase
                const updates: any = {};
                // We use set on specific root nodes to avoid destroying auth/other metadata if it existed
                if (json.weeks) await set(ref(db, 'weeks'), json.weeks);
                if (json.current_accounts) await set(ref(db, 'current_accounts'), json.current_accounts);
                if (json.cheques) await set(ref(db, 'cheques'), json.cheques);
                if (json.general_data) await set(ref(db, 'general_data'), json.general_data);
                
            } else {
                // Restore to LocalStorage
                // First, clean up existing app data to prevent zombies
                const keysToRemove: string[] = [];
                for(let i=0; i<localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if(key && (key.startsWith('weekData_') || key.startsWith('history_') || key.startsWith('kilos_') || key === 'current_accounts' || key === 'cheques' || key === 'general_data')) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(k => localStorage.removeItem(k));

                // If backup has localStorageDump (from offline backup)
                if (json.localStorageDump) {
                    Object.entries(json.localStorageDump).forEach(([key, val]: [string, any]) => {
                         localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
                    });
                } else {
                    // Try to map Firebase structure to LocalStorage keys
                    if (json.current_accounts) localStorage.setItem('current_accounts', JSON.stringify(json.current_accounts));
                    if (json.cheques) localStorage.setItem('cheques', JSON.stringify(json.cheques));
                    if (json.general_data) localStorage.setItem('general_data', JSON.stringify(json.general_data));
                    
                    if (json.weeks) {
                        Object.entries(json.weeks).forEach(([weekKey, weekContent]: [string, any]) => {
                            if (weekContent.data) localStorage.setItem(`weekData_${weekKey}`, JSON.stringify(weekContent.data));
                            if (weekContent.history) localStorage.setItem(`history_${weekKey}`, JSON.stringify(weekContent.history));
                            if (weekContent.kilos) localStorage.setItem(`kilos_${weekKey}`, JSON.stringify(weekContent.kilos));
                        });
                    }
                }
            }

            alert("Restauración completada con éxito. La aplicación se reiniciará.");
            window.location.reload();

        } catch (error) {
            console.error("Import failed", error);
            alert("Error al importar el archivo. Asegúrese de que sea un backup válido.");
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    reader.readAsText(file);
  };

  const triggerImport = () => {
      verifyPasswordAndExecute(() => {
          fileInputRef.current?.click();
      });
  };

  const triggerDownload = () => {
      verifyPasswordAndExecute(() => {
          handleDownloadBackup();
      });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden relative transition-colors duration-300 max-h-[90vh] overflow-y-auto">
        
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="p-6 sm:p-8">
          <div className="flex justify-between items-center mb-8">
             <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Menú Principal</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Selecciona una aplicación.</p>
             </div>
             
             {/* Theme Toggle */}
             <button 
               onClick={toggleTheme}
               className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors mr-8"
               title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
             >
               {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
               <span className="text-xs font-semibold">{theme === 'dark' ? 'Oscuro' : 'Claro'}</span>
             </button>
          </div>

          <div className="grid gap-4">
            {/* Flow App */}
            <button 
              onClick={() => handleAppClick('FLOW')}
              className={`group flex items-center justify-between p-4 rounded-xl border transition-all ${
                currentApp === 'FLOW' 
                  ? 'bg-indigo-50 dark:bg-indigo-600/10 border-indigo-200 dark:border-indigo-500/50 hover:bg-indigo-100 dark:hover:bg-indigo-600/20' 
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg shadow-lg ${currentApp === 'FLOW' ? 'bg-indigo-600 text-white shadow-indigo-200 dark:shadow-indigo-900/50' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                  <LayoutGrid size={24} />
                </div>
                <div className="text-left">
                  <h3 className={`font-bold transition-colors ${currentApp === 'FLOW' ? 'text-indigo-700 dark:text-white' : 'text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'}`}>Flujo Semanal</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Gestión de caja y movimientos</p>
                </div>
              </div>
              {currentApp === 'FLOW' && (
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-semibold px-2 py-1 bg-indigo-100 dark:bg-indigo-950/50 rounded border border-indigo-200 dark:border-indigo-900/50">
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
                  ? 'bg-orange-50 dark:bg-orange-600/10 border-orange-200 dark:border-orange-500/50 hover:bg-orange-100 dark:hover:bg-orange-600/20' 
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg shadow-lg ${currentApp === 'KILOS' ? 'bg-orange-600 text-white shadow-orange-200 dark:shadow-orange-900/50' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                  <Scale size={24} />
                </div>
                <div className="text-left">
                  <h3 className={`font-bold transition-colors ${currentApp === 'KILOS' ? 'text-orange-700 dark:text-white' : 'text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'}`}>Control de Kilos</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Particulares, Reparto y Devoluciones</p>
                </div>
              </div>
              {currentApp === 'KILOS' && (
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 text-xs font-semibold px-2 py-1 bg-orange-100 dark:bg-orange-950/50 rounded border border-orange-200 dark:border-orange-900/50">
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
                  ? 'bg-emerald-50 dark:bg-emerald-600/10 border-emerald-200 dark:border-emerald-500/50 hover:bg-emerald-100 dark:hover:bg-emerald-600/20' 
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg shadow-lg ${currentApp === 'CC' ? 'bg-emerald-600 text-white shadow-emerald-200 dark:shadow-emerald-900/50' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                  <BookUser size={24} />
                </div>
                <div className="text-left">
                  <h3 className={`font-bold transition-colors ${currentApp === 'CC' ? 'text-emerald-700 dark:text-white' : 'text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'}`}>Cuentas Corrientes</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Gestión de cuentas</p>
                </div>
              </div>
              {currentApp === 'CC' && (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold px-2 py-1 bg-emerald-100 dark:bg-emerald-950/50 rounded border border-emerald-200 dark:border-emerald-900/50">
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
                  ? 'bg-violet-50 dark:bg-violet-600/10 border-violet-200 dark:border-violet-500/50 hover:bg-violet-100 dark:hover:bg-violet-600/20' 
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg shadow-lg ${currentApp === 'CHEQUES' ? 'bg-violet-600 text-white shadow-violet-200 dark:shadow-violet-900/50' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                  <Banknote size={24} />
                </div>
                <div className="text-left">
                  <h3 className={`font-bold transition-colors ${currentApp === 'CHEQUES' ? 'text-violet-700 dark:text-white' : 'text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'}`}>Cheques en Cartera</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Listado de cheques y vencimientos</p>
                </div>
              </div>
              {currentApp === 'CHEQUES' && (
                <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 text-xs font-semibold px-2 py-1 bg-violet-100 dark:bg-violet-950/50 rounded border border-violet-200 dark:border-violet-900/50">
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
                  ? 'bg-cyan-50 dark:bg-cyan-600/10 border-cyan-200 dark:border-cyan-500/50 hover:bg-cyan-100 dark:hover:bg-cyan-600/20' 
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg shadow-lg ${currentApp === 'GENERAL_DATA' ? 'bg-cyan-600 text-white shadow-cyan-200 dark:shadow-cyan-900/50' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                  <Database size={24} />
                </div>
                <div className="text-left">
                  <h3 className={`font-bold transition-colors ${currentApp === 'GENERAL_DATA' ? 'text-cyan-700 dark:text-white' : 'text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'}`}>Datos Generales</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Clientes, Proveedores y Empleados</p>
                </div>
              </div>
              {currentApp === 'GENERAL_DATA' && (
                <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 text-xs font-semibold px-2 py-1 bg-cyan-100 dark:bg-cyan-950/50 rounded border border-cyan-200 dark:border-cyan-900/50">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                  ACTIVO
                </div>
              )}
            </button>

          </div>

          <div className="my-6 border-t border-slate-200 dark:border-slate-800"></div>

          {/* Administration Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Administración</h3>
            
            <button 
                onClick={triggerDownload}
                disabled={downloading}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-700/50 transition-all group"
            >
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg shadow-sm bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        {downloading ? <Loader2 size={24} className="animate-spin"/> : <Download size={24} />}
                    </div>
                    <div className="text-left">
                        <h3 className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">Descargar BD Completa</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Backup de todas las aplicaciones</p>
                    </div>
                </div>
            </button>

            <div className="relative">
                <input 
                    type="file" 
                    accept=".json" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleImportBackup} 
                />
                <button 
                    onClick={triggerImport}
                    disabled={importing}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-200 dark:hover:border-emerald-700/50 transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg shadow-sm bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            {importing ? <Loader2 size={24} className="animate-spin"/> : <Upload size={24} />}
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">Importar BD Completa</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Restaurar desde archivo de backup</p>
                        </div>
                    </div>
                </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};