
import React from 'react';
import { Download, Upload, PieChart as PieChartIcon, History, ChevronLeft, ChevronRight, Calendar, Menu, LayoutGrid, Scale, BookUser, Banknote, Database, StickyNote, ZoomIn, ZoomOut, Truck, MapPin, ArrowRight, X } from 'lucide-react';
import { ref, onValue, set, get, child } from 'firebase/database';
import { db } from './firebaseConfig';
import { DAYS_OF_WEEK, WeekData, DayData, HistoryItem, AppMode } from './types';
import { DayCard } from './components/DayCard';
import { Summary } from './components/Summary';
import { WeeklyReportModal } from './components/WeeklyReportModal';
import { HistoryModal } from './components/HistoryModal';
import { WeekPickerModal } from './components/WeekPickerModal';
import { MenuModal } from './components/MenuModal';
import { ExportModal } from './components/ExportModal';
import { ImportModal } from './components/ImportModal';
import { KilosApp } from './components/KilosApp';
import { CurrentAccountsApp } from './components/CurrentAccountsApp';
import { ChequesApp } from './components/ChequesApp';
import { GeneralDataApp } from './components/GeneralDataApp';
import { DeliveryApp } from './components/DeliveryApp';
import { TrackingApp } from './components/TrackingApp';
import { exportToCSV, exportMonthToCSV, parseCSV, parseMonthCSV, getWeekKey, getWeekRangeLabel, addWeeks, getMonday, generateId } from './utils';

// --- LANDING SCREEN COMPONENT ---

interface LandingScreenProps {
  onEnter: (zone?: string, restricted?: boolean) => void;
}

const LandingScreen: React.FC<LandingScreenProps> = ({ onEnter }) => {
  const [showRepartos, setShowRepartos] = React.useState(false);
  
  // Password State
  const [showPassword, setShowPassword] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState(false);

  const repartosList = [
    { id: 'malvinas', label: 'Malvinas' },
    { id: 'flores', label: 'Flores' },
    { id: 'rodolfo', label: 'Rodolfo' },
    { id: 'garbino', label: 'Garbino' },
  ];

  const handleGeneralClick = () => {
    setShowPassword(true);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'alpinito') {
      onEnter(undefined, false); // Not restricted
    } else {
      setError(true);
      setPassword('');
    }
  };

  const closePasswordModal = () => {
    setShowPassword(false);
    setError(false);
    setPassword('');
  };

  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Password Modal */}
      {showPassword && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative">
              <button 
                onClick={closePasswordModal}
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
              >
                <X size={20} />
              </button>
              
              <div className="flex flex-col items-center mb-6">
                 <div className="p-3 bg-indigo-900/30 rounded-full border border-indigo-500/30 mb-3">
                    <LayoutGrid size={24} className="text-indigo-400" />
                 </div>
                 <h3 className="text-xl font-bold text-white">Acceso General</h3>
                 <p className="text-sm text-slate-400">Ingrese contraseña de administrador</p>
              </div>
              
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                   <input
                     type="password"
                     autoFocus
                     value={password}
                     onChange={(e) => { setPassword(e.target.value); setError(false); }}
                     placeholder="Contraseña"
                     className={`w-full bg-slate-950 border ${error ? 'border-rose-500' : 'border-slate-700'} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors text-center tracking-widest`}
                   />
                   {error && <p className="text-xs text-rose-500 mt-2 font-medium text-center">Contraseña incorrecta</p>}
                </div>
                <button 
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-indigo-900/20"
                >
                  Ingresar
                </button>
              </form>
           </div>
        </div>
      )}

      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-3xl"></div>
      </div>

      <div className="z-10 w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
        
        <div className="text-center space-y-2">
          <img 
            src="https://avicolaalpina.com.ar/wp-content/uploads/2025/04/logoCompleto0.png" 
            alt="Avícola Alpina" 
            className="h-20 w-auto mx-auto object-contain mb-4 drop-shadow-lg"
          />
          <h1 className="text-3xl font-bold text-white tracking-tight">Bienvenido</h1>
          <p className="text-slate-400 text-sm">Selecciona el área de trabajo</p>
        </div>

        <div className="grid gap-4">
          
          {/* General Button */}
          <button
            onClick={handleGeneralClick}
            className="group relative flex items-center p-5 bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-2xl transition-all shadow-xl hover:shadow-indigo-900/20"
          >
            <div className="h-12 w-12 bg-slate-800 rounded-full flex items-center justify-center mr-4 group-hover:bg-indigo-600 transition-colors">
              <LayoutGrid size={24} className="text-slate-400 group-hover:text-white" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-xl font-bold text-slate-200 group-hover:text-white">General</h3>
              <p className="text-xs text-slate-500 group-hover:text-slate-400">Administración completa</p>
            </div>
            <ArrowRight className="text-slate-700 group-hover:text-indigo-400 transition-colors" />
          </button>

          {/* Repartos Button */}
          <div className="relative">
             <button
              onClick={() => setShowRepartos(!showRepartos)}
              className={`w-full group relative flex items-center p-5 bg-slate-900 border border-slate-800 hover:border-emerald-500 rounded-2xl transition-all shadow-xl hover:shadow-emerald-900/20 z-20 ${showRepartos ? 'border-emerald-500/50 bg-slate-800' : ''}`}
            >
              <div className="h-12 w-12 bg-slate-800 rounded-full flex items-center justify-center mr-4 group-hover:bg-emerald-600 transition-colors">
                <Truck size={24} className="text-slate-400 group-hover:text-white" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-xl font-bold text-slate-200 group-hover:text-white">Repartos</h3>
                <p className="text-xs text-slate-500 group-hover:text-slate-400">Gestión por zonas</p>
              </div>
              <div className={`transform transition-transform duration-300 ${showRepartos ? 'rotate-90' : ''}`}>
                 <ArrowRight className="text-slate-700 group-hover:text-emerald-400 transition-colors" />
              </div>
            </button>

            {/* Repartos Dropdown List */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showRepartos ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-2 space-y-1">
                  {repartosList.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onEnter(item.label, true)} // Restricted mode
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-800 group transition-colors"
                    >
                      <div className="flex items-center gap-3">
                         <MapPin size={16} className="text-emerald-500" />
                         <span className="text-slate-300 font-medium group-hover:text-white">{item.label}</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-600 group-hover:text-emerald-400" />
                    </button>
                  ))}
                </div>
            </div>
          </div>

        </div>
      </div>
      
      <div className="absolute bottom-4 text-center">
        <p className="text-[10px] text-slate-600">Avícola Alpina v1.0.1</p>
      </div>
    </div>
  );
};

// --- APP COMPONENT ---

const createInitialState = (): WeekData => {
  const state: WeekData = {};
  DAYS_OF_WEEK.forEach((day) => {
    state[day.id] = {
      id: day.id,
      name: day.name,
      incomes: [],
      deliveries: [],
      expenses: [],
      salaries: [],
      toBox: [],
    };
  });
  return state;
};

// Helper to calculate the closing balance of a week data object (Office)
const calculateWeeklyBalance = (data: WeekData, startBalance: number = 0): number => {
    let balance = data['monday']?.manualInitialAmount !== undefined 
        ? data['monday']!.manualInitialAmount! 
        : startBalance;
    
    DAYS_OF_WEEK.forEach(day => {
        const d = data[day.id];
        if (!d) return;
        
        if (d.manualInitialAmount !== undefined) {
             balance = d.manualInitialAmount;
        }
        
        const income = d.incomes?.reduce((acc, t) => acc + t.amount, 0) || 0;
        const deliveries = d.deliveries?.reduce((acc, t) => acc + t.amount, 0) || 0;
        const expenses = d.expenses?.reduce((acc, t) => acc + t.amount, 0) || 0;
        const salaries = d.salaries?.reduce((acc, t) => acc + t.amount, 0) || 0;
        
        let treasuryToOffice = 0;
        let officeToTreasury = 0;

        if (d.toBox) {
            d.toBox.forEach(t => {
                const title = t.title.trim().toLowerCase();
                if (title === 'oficina') {
                    treasuryToOffice += t.amount;
                } else if (title === 'tesoro') {
                    officeToTreasury += t.amount;
                }
            });
        }
        
        balance = balance + income + deliveries - expenses - salaries + treasuryToOffice - officeToTreasury;
    });
    return balance;
};

// Helper to calculate the closing Treasury total of a week
const calculateWeeklyTreasury = (data: WeekData, startBalance: number = 0): number => {
    let balance = 0;
    
    // Determine start balance for Treasury
    if (data['monday']?.initialBoxAmount !== undefined) {
        balance = data['monday'].initialBoxAmount;
    } else {
        balance = startBalance;
    }

    Object.values(data).forEach(day => {
        if (day.toBox) {
            day.toBox.forEach(t => {
                const title = t.title.trim().toLowerCase();
                if (title === 'oficina') {
                    // Returns to office, subtract from Treasury
                    balance -= t.amount;
                } else { 
                    // "Tesoro" OR Generic items: Add to Treasury
                    balance += t.amount;
                }
            });
        }
    });
    return balance;
};

const App: React.FC = () => {
  const [appStarted, setAppStarted] = React.useState(false);
  const [activeZone, setActiveZone] = React.useState<string | undefined>(undefined);
  const [isRestrictedMode, setIsRestrictedMode] = React.useState(false); // New State for mode

  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [weekData, setWeekData] = React.useState<WeekData>(createInitialState());
  const [history, setHistory] = React.useState<HistoryItem[]>([]);
  const [currentApp, setCurrentApp] = React.useState<AppMode>('FLOW');
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = React.useState<'WEEK' | 'MONTH'>('WEEK');

  const [isOfflineMode, setIsOfflineMode] = React.useState(false);
  const [showReport, setShowReport] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);
  const [showWeekPicker, setShowWeekPicker] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);
  const [showExportModal, setShowExportModal] = React.useState(false);
  const [showImportModal, setShowImportModal] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  
  // State for Zoom Level
  const [zoomLevel, setZoomLevel] = React.useState(90);

  // State for Previous Week's Close (for Automatic Monday Initial Office)
  const [prevWeekClose, setPrevWeekClose] = React.useState(0);
  // State for Previous Week's Treasury Total (for Automatic Monday Initial Treasury)
  const [prevWeekTreasury, setPrevWeekTreasury] = React.useState(0);

  // Derived week key (e.g., "2024-04-15")
  const currentWeekKey = React.useMemo(() => getWeekKey(currentDate), [currentDate]);

  // --- Zoom Logic ---
  React.useEffect(() => {
    const savedZoom = localStorage.getItem('app_zoom_level');
    if (savedZoom) {
      setZoomLevel(parseInt(savedZoom, 10));
    }
  }, []);

  React.useEffect(() => {
    if (appStarted) {
       document.documentElement.style.fontSize = `${zoomLevel}%`;
       localStorage.setItem('app_zoom_level', zoomLevel.toString());
    }
  }, [zoomLevel, appStarted]);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 5, 150));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 5, 30));

  // --- Data Loading Effect ---
  React.useEffect(() => {
    if (!appStarted) return; // Only load if app started

    if (db) {
      setLoading(true);

      const rootRef = ref(db!, `weeks`);
      const weekDataRef = ref(db!, `weeks/${currentWeekKey}/data`);
      const historyRef = ref(db!, `weeks/${currentWeekKey}/history`);

      // 1. Migration Logic
      const globalRootRef = ref(db!);
      get(child(globalRootRef, 'weekData')).then((snapshot) => {
        if (snapshot.exists()) {
           get(weekDataRef).then((weekSnap) => {
             if (!weekSnap.exists()) {
                const oldData = snapshot.val();
                set(weekDataRef, oldData);
                get(child(globalRootRef, 'history')).then((histSnap) => {
                  if (histSnap.exists()) {
                    set(historyRef, histSnap.val());
                    set(ref(db!, 'history'), null);
                  }
                });
                set(ref(db!, 'weekData'), null);
             }
           });
        }
      });

      // 2. Week Data Listener
      const unsubscribeWeek = onValue(weekDataRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const sanitizedData: WeekData = {};
          DAYS_OF_WEEK.forEach((day) => {
            const dayData = data[day.id] || {};
            sanitizedData[day.id] = {
              id: day.id,
              name: day.name,
              incomes: dayData.incomes || [],
              deliveries: dayData.deliveries || [],
              expenses: dayData.expenses || [],
              salaries: dayData.salaries || [],
              toBox: dayData.toBox || [],
              manualInitialAmount: dayData.manualInitialAmount,
              initialBoxAmount: dayData.initialBoxAmount
            };
          });
          setWeekData(sanitizedData);
        } else {
          setWeekData(createInitialState());
        }
        setLoading(false);
      });

      // 3. History Listener
      const unsubscribeHistory = onValue(historyRef, (snapshot) => {
          const data = snapshot.val();
          setHistory(data || []);
      });

      // 4. Load Previous Week Data for "Automatic" Calculation (Office & Treasury)
      const prevWeekKey = getWeekKey(addWeeks(currentDate, -1));
      const prevPrevWeekKey = getWeekKey(addWeeks(currentDate, -2));

      get(ref(db!, `weeks/${prevWeekKey}/data`)).then((snap) => {
          if (snap.exists()) {
              const prevData = snap.val();
              
              // --- Office Balance Logic ---
              if (prevData['monday']?.manualInitialAmount === undefined) {
                  get(ref(db!, `weeks/${prevPrevWeekKey}/data`)).then((snap2) => {
                      let startOfPrev = 0;
                      if (snap2.exists()) {
                          startOfPrev = calculateWeeklyBalance(snap2.val(), 0); 
                      }
                      setPrevWeekClose(calculateWeeklyBalance(prevData, startOfPrev));
                  }).catch(() => {
                      setPrevWeekClose(calculateWeeklyBalance(prevData, 0));
                  });
              } else {
                  setPrevWeekClose(calculateWeeklyBalance(prevData, 0));
              }

              // --- Treasury Balance Logic ---
              if (prevData['monday']?.initialBoxAmount === undefined) {
                  get(ref(db!, `weeks/${prevPrevWeekKey}/data`)).then((snap2) => {
                      let startTreasuryPrev = 0;
                      if (snap2.exists()) {
                          startTreasuryPrev = calculateWeeklyTreasury(snap2.val(), 0);
                      }
                      setPrevWeekTreasury(calculateWeeklyTreasury(prevData, startTreasuryPrev));
                  }).catch(() => {
                      setPrevWeekTreasury(calculateWeeklyTreasury(prevData, 0));
                  });
              } else {
                  setPrevWeekTreasury(calculateWeeklyTreasury(prevData, 0));
              }

          } else {
              setPrevWeekClose(0);
              setPrevWeekTreasury(0);
          }
      }).catch(() => {
          setPrevWeekClose(0);
          setPrevWeekTreasury(0);
      });

      return () => {
        unsubscribeWeek();
        unsubscribeHistory();
      };
    } else {
      // LocalStorage Fallback
      setIsOfflineMode(true);
      const saved = localStorage.getItem(`weekData_${currentWeekKey}`);
      const savedHistory = localStorage.getItem(`history_${currentWeekKey}`);
      
      if (saved) {
        try { setWeekData(JSON.parse(saved)); } catch (e) { console.error(e); }
      } else {
        setWeekData(createInitialState());
      }

      if (savedHistory) {
         try { setHistory(JSON.parse(savedHistory)); } catch (e) { console.error(e); }
      } else {
        setHistory([]);
      }

      // Load Previous Week Local
      const prevWeekKey = getWeekKey(addWeeks(currentDate, -1));
      const prevPrevWeekKey = getWeekKey(addWeeks(currentDate, -2));
      const savedPrev = localStorage.getItem(`weekData_${prevWeekKey}`);
      
      if (savedPrev) {
          try {
             const prevData = JSON.parse(savedPrev);
             const savedPrevPrev = localStorage.getItem(`weekData_${prevPrevWeekKey}`);
             const prevPrevData = savedPrevPrev ? JSON.parse(savedPrevPrev) : null;

             // Office
             if (prevData['monday']?.manualInitialAmount === undefined) {
                 let startOfPrev = 0;
                 if (prevPrevData) {
                     startOfPrev = calculateWeeklyBalance(prevPrevData, 0);
                 }
                 setPrevWeekClose(calculateWeeklyBalance(prevData, startOfPrev));
             } else {
                 setPrevWeekClose(calculateWeeklyBalance(prevData, 0));
             }

             // Treasury
             if (prevData['monday']?.initialBoxAmount === undefined) {
                 let startTreasuryPrev = 0;
                 if (prevPrevData) {
                    startTreasuryPrev = calculateWeeklyTreasury(prevPrevData, 0);
                 }
                 setPrevWeekTreasury(calculateWeeklyTreasury(prevData, startTreasuryPrev));
             } else {
                 setPrevWeekTreasury(calculateWeeklyTreasury(prevData, 0));
             }

          } catch { 
              setPrevWeekClose(0); 
              setPrevWeekTreasury(0);
          }
      } else {
          setPrevWeekClose(0);
          setPrevWeekTreasury(0);
      }

      setLoading(false);
    }
  }, [currentDate, currentWeekKey, currentApp, appStarted]);

  // --- Save Functions ---

  const saveWeekData = (newData: WeekData) => {
    const cleanData = JSON.parse(JSON.stringify(newData));
    if (db) {
      set(ref(db!, `weeks/${currentWeekKey}/data`), cleanData).catch(console.error);
      setWeekData(newData);
    } else {
      setWeekData(newData);
      localStorage.setItem(`weekData_${currentWeekKey}`, JSON.stringify(newData));
    }
  };

  const saveHistory = (newHistory: HistoryItem[]) => {
      if (db) {
          const cleanHistory = JSON.parse(JSON.stringify(newHistory));
          set(ref(db!, `weeks/${currentWeekKey}/history`), cleanHistory).catch(console.error);
          setHistory(newHistory);
      } else {
          setHistory(newHistory);
          localStorage.setItem(`history_${currentWeekKey}`, JSON.stringify(newHistory));
      }
  };

  // --- Handlers ---

  const handleUpdateDay = (updatedDay: DayData) => {
    const newWeekData = { ...weekData, [updatedDay.id]: updatedDay };
    saveWeekData(newWeekData);
  };

  const handleAddToHistory = (item: HistoryItem) => {
      const newHistory = [...history, item];
      saveHistory(newHistory);
  };

  const handleRestoreHistory = (item: HistoryItem) => {
      const newHistory = history.filter(i => i.id !== item.id);
      saveHistory(newHistory);
      const { originalDayId, originalType, deletedAt, ...transaction } = item;
      const day = weekData[originalDayId];
      if (day) {
          const newDay = { 
              ...day, 
              [originalType]: [...day[originalType], transaction] 
          };
          handleUpdateDay(newDay);
      }
  };

  const handleExportWeek = () => {
    exportToCSV(weekData, history);
  };

  const handleExportMonth = async () => {
    if (!db) {
        alert("La exportación mensual requiere conexión.");
        return;
    }
    setLoading(true);
    try {
        const monthYear = currentDate.toLocaleDateString('es-AR', { month: '2-digit', year: 'numeric' });
        const [month, year] = monthYear.split('/');
        
        const weeksToFetch: string[] = [];
        let iterDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        iterDate = getMonday(iterDate);

        for (let i = 0; i < 6; i++) {
            const key = getWeekKey(iterDate);
            const keyMonth = iterDate.getMonth() + 1;
            const targetMonth = parseInt(month);
            
            if (keyMonth === targetMonth || iterDate.getMonth() + 1 === targetMonth) {
                weeksToFetch.push(key);
            }
            
            iterDate = addWeeks(iterDate, 1);
            if (iterDate.getMonth() + 1 > targetMonth && targetMonth !== 12) {
                 if (iterDate.getDate() > 7) break; 
            }
        }
        
        const uniqueKeys = Array.from(new Set(weeksToFetch));
        const monthlyData: Record<string, WeekData> = {};

        await Promise.all(uniqueKeys.map(async (key) => {
             const snap = await get(ref(db!, `weeks/${key}/data`));
             if (snap.exists()) {
                 monthlyData[key] = snap.val();
             }
        }));

        const monthName = currentDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
        exportMonthToCSV(monthName, monthlyData);

    } catch (error) {
        console.error("Export failed", error);
        alert("Error al exportar el mes.");
    }
    setLoading(false);
  };

  const handleReset = () => {
    if (currentApp === 'KILOS') {
        const msg = "Reiniciar borrará los datos de KILOS de esta semana. ¿Seguro?";
        if (window.confirm(msg)) {
            if (db) {
                set(ref(db!, `weeks/${currentWeekKey}/kilos`), null);
            } else {
                localStorage.removeItem(`kilos_${currentWeekKey}`);
            }
            window.location.reload(); 
        }
        return;
    }

    const msg = db 
      ? `¿Estás seguro de reiniciar la semana actual (${getWeekRangeLabel(currentDate)})? Esto borrará los datos de esta semana.` 
      : "Reiniciar borrará los datos LOCALES de esta semana.";
      
    if (window.confirm(msg)) {
      const emptyState = createInitialState();
      if (db) {
          set(ref(db!, `weeks/${currentWeekKey}/data`), JSON.parse(JSON.stringify(emptyState)));
          set(ref(db!, `weeks/${currentWeekKey}/history`), []);
      } else {
          localStorage.removeItem(`weekData_${currentWeekKey}`);
          localStorage.removeItem(`history_${currentWeekKey}`);
      }
      setWeekData(emptyState);
      setHistory([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      
      if (importMode === 'WEEK') {
          const result = parseCSV(text);
          if (result) {
            if (window.confirm('Esto sobrescribirá datos actuales de esta semana. ¿Continuar?')) {
              saveWeekData(result.weekData);
              saveHistory(result.history);
            }
          } else {
            alert('Error al leer el archivo CSV de Semana.');
          }
      } else {
          // Import Month
          const result = parseMonthCSV(text);
          if (result) {
             const keys = Object.keys(result);
             if (window.confirm(`Se han detectado datos de ${keys.length} semanas. ¿Importar y sobrescribir estas semanas?`)) {
                 setLoading(true);
                 if (db) {
                     await Promise.all(keys.map(key => 
                         set(ref(db!, `weeks/${key}/data`), JSON.parse(JSON.stringify(result[key])))
                     ));
                     alert("Importación mensual completada.");
                     if (keys.includes(currentWeekKey)) {
                         setWeekData(result[currentWeekKey]);
                     }
                 } else {
                     keys.forEach(key => {
                         localStorage.setItem(`weekData_${key}`, JSON.stringify(result[key]));
                     });
                     if (keys.includes(currentWeekKey)) {
                         setWeekData(result[currentWeekKey]);
                     }
                     alert("Importación local completada.");
                 }
                 setLoading(false);
             }
          } else {
              alert('Error al leer el archivo CSV Mensual. Asegúrate de usar un archivo generado por "Exportar Mes Completo".');
          }
      }

      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleImportClick = (mode: 'WEEK' | 'MONTH') => {
      setImportMode(mode);
      fileInputRef.current?.click();
  };

  // --- Calculations ---

  const totals = React.useMemo(() => (Object.values(weekData) as DayData[]).reduce(
    (acc, day) => {
      if (!day) return acc;
      const dayIncome = day.incomes?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
      const dayDeliveries = day.deliveries?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
      const dayExpense = day.expenses?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
      const daySalaries = day.salaries?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
      
      let dayTreasuryAdd = 0;
      let dayTreasurySub = 0;

      if (day.toBox) {
        day.toBox.forEach(item => {
            const t = item.title.trim().toLowerCase();
            if (t === 'oficina') {
                dayTreasurySub += item.amount;
            } else {
                // "Tesoro" OR Generic items: Add to Treasury
                dayTreasuryAdd += item.amount;
            }
        });
      }
      
      // Treasury Initial logic:
      // For Monday, if manual is set, use it. If not, use calculated prevWeekTreasury.
      // For other days, initialBoxAmount should generally be 0 or undefined, but we keep the property check.
      let initialBox = 0;
      if (day.id === 'monday') {
           initialBox = day.initialBoxAmount !== undefined ? day.initialBoxAmount : prevWeekTreasury;
      } else {
           initialBox = day.initialBoxAmount || 0;
      }

      return {
        income: acc.income + dayIncome + dayDeliveries,
        expense: acc.expense + dayExpense + daySalaries, 
        toBox: acc.toBox + dayTreasuryAdd - dayTreasurySub + initialBox,
      };
    },
    { income: 0, expense: 0, toBox: 0 }
  ), [weekData, prevWeekTreasury]);

  const netTotal = totals.income - totals.expense;

  const runningBalances = React.useMemo(() => {
    const balances: Record<string, number> = {};
    let currentBalance = prevWeekClose; 

    for (const day of DAYS_OF_WEEK) {
      const data = weekData[day.id];
      const effectiveInitial = data?.manualInitialAmount !== undefined ? data.manualInitialAmount : currentBalance;
      
      balances[day.id] = currentBalance;
      
      if (data) {
        const income = data.incomes?.reduce((s, t) => s + (t.amount || 0), 0) || 0;
        const deliveries = data.deliveries?.reduce((s, t) => s + (t.amount || 0), 0) || 0;
        const expense = data.expenses?.reduce((s, t) => s + (t.amount || 0), 0) || 0;
        const salaries = data.salaries?.reduce((s, t) => s + (t.amount || 0), 0) || 0;
        
        let treasuryToOffice = 0;
        let officeToTreasury = 0;

        if (data.toBox) {
            data.toBox.forEach(t => {
                const title = t.title.trim().toLowerCase();
                if (title === 'oficina') {
                    treasuryToOffice += t.amount;
                } else if (title === 'tesoro') {
                    officeToTreasury += t.amount;
                }
            });
        }

        currentBalance = effectiveInitial + income + deliveries - expense - salaries + treasuryToOffice - officeToTreasury;
      }
    }
    balances['saturday_close'] = currentBalance;
    return balances;
  }, [weekData, prevWeekClose]);

  // --- Navigation & Logic ---

  const handlePrevWeek = () => setCurrentDate(addWeeks(currentDate, -1));

  const handleNextWeek = () => {
    const nextDate = addWeeks(currentDate, 1);
    setCurrentDate(nextDate);
  };

  const handleDateSelect = (date: Date) => {
    setCurrentDate(date);
    setShowWeekPicker(false);
  };

  const getAppName = () => {
      switch(currentApp) {
          case 'FLOW': return 'Flujo Semanal';
          case 'KILOS': return 'Control de Kilos';
          case 'CC': return 'Cuentas Corrientes';
          case 'CHEQUES': return 'Cheques en Cartera';
          case 'GENERAL_DATA': return 'Datos Generales';
          case 'TRACKING': return 'Seguimiento Satelital';
          default: return 'Flujo Semanal';
      }
  };

  const getHeaderContent = () => {
      if (currentApp === 'KILOS') {
          return <>Control<span className="text-orange-400">Kilos</span></>;
      }
      if (currentApp === 'CC') {
          return <>Cuentas<span className="text-emerald-400">Corrientes</span></>;
      }
      if (currentApp === 'CHEQUES') {
          return <>Cheques<span className="text-violet-400">Cartera</span></>;
      }
      if (currentApp === 'GENERAL_DATA') {
          return <>Datos<span className="text-cyan-400">Generales</span></>;
      }
      if (currentApp === 'TRACKING') {
          return <>Seguimiento<span className="text-blue-400">Satelital</span></>;
      }
      if (activeZone) {
          return <>Planilla<span className="text-emerald-400">Reparto</span></>;
      }
      return <>Flujo<span className="text-indigo-400">Semanal</span></>;
  };

  const Header = () => (
      <header className="bg-slate-900 border-b border-slate-800 shadow-md flex-none z-20 print:hidden">
        <div className="max-w-full px-4 py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <img 
                src="https://avicolaalpina.com.ar/wp-content/uploads/2025/04/logoCompleto0.png" 
                alt="Avícola Alpina" 
                className={`h-12 w-auto object-contain transition-all ${currentApp !== 'FLOW' ? 'grayscale opacity-80' : ''}`}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div>
                <h1 className="text-xl font-bold text-slate-100 leading-tight flex items-center gap-2">
                  {getHeaderContent()}
                  {activeZone && <span className="text-xs bg-emerald-900/50 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 ml-2 uppercase tracking-wide">{activeZone}</span>}
                  {isOfflineMode && <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded ml-2 border border-slate-600">MODO LOCAL</span>}
                </h1>
                <p className="text-xs text-slate-400 hidden sm:block">Avícola Alpina</p>
              </div>
            </div>

            {currentApp === 'FLOW' && !activeZone && (
                <div className="flex-1 overflow-x-auto no-scrollbar mx-4">
                   <Summary totalIncome={totals.income} totalExpense={totals.expense} netTotal={netTotal} totalToBox={totals.toBox} />
                </div>
            )}
            
            {currentApp !== 'FLOW' && <div className="flex-1"></div>}
            {currentApp === 'FLOW' && activeZone && <div className="flex-1"></div>}
            
            <div className="flex items-center gap-2 flex-shrink-0">
              
              {/* Zoom Controls */}
              <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 mr-2">
                <button 
                    type="button"
                    onClick={handleZoomOut} 
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-l-lg transition-colors border-r border-slate-700/50" 
                    title="Reducir tamaño"
                >
                    <ZoomOut size={14} />
                </button>
                <div className="w-9 text-center text-[10px] font-mono font-bold text-slate-500 select-none">
                    {zoomLevel}%
                </div>
                <button 
                    type="button"
                    onClick={handleZoomIn} 
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-r-lg transition-colors border-l border-slate-700/50" 
                    title="Aumentar tamaño"
                >
                    <ZoomIn size={14} />
                </button>
              </div>

              {currentApp === 'FLOW' && !activeZone && (
                  <>
                      <button 
                        type="button"
                        onClick={() => setShowReport(true)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-100 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm shadow-indigo-900/50"
                      >
                        <PieChartIcon size={14} />
                        <span className="hidden lg:inline">Informe Semanal</span>
                      </button>

                      <button 
                        type="button"
                        onClick={() => setShowHistory(true)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-colors border border-slate-700 relative"
                      >
                        <History size={14} />
                        <span className="hidden lg:inline">Historial</span>
                        {history.length > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] text-white">
                                {history.length}
                            </span>
                        )}
                      </button>

                      <button type="button" onClick={() => setShowImportModal(true)} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-colors border border-slate-700">
                        <Upload size={14} />
                        <span className="hidden lg:inline">Importar</span>
                      </button>

                      <button type="button" onClick={() => setShowExportModal(true)} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-colors border border-slate-700">
                        <Download size={14} />
                        <span className="hidden lg:inline">Exportar</span>
                      </button>
                  </>
              )}

              <button type="button" onClick={() => setShowMenu(true)} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-colors border border-slate-700">
                <Menu size={14} />
                <span className="hidden lg:inline">Menú</span>
              </button>
            </div>
          </div>
        </div>
      </header>
  );

  const handleEnterApp = (zone?: string, restricted?: boolean) => {
    setActiveZone(zone);
    setIsRestrictedMode(!!restricted);
    setAppStarted(true);
  };

  if (!appStarted) {
    return <LandingScreen onEnter={handleEnterApp} />;
  }

  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden text-slate-100">
      <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

      <WeeklyReportModal isOpen={showReport} onClose={() => setShowReport(false)} weekData={weekData} />
      <HistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} history={history} onRestore={handleRestoreHistory} />
      <ExportModal 
        isOpen={showExportModal} 
        onClose={() => setShowExportModal(false)} 
        onExportWeek={handleExportWeek}
        onExportMonth={handleExportMonth}
        isOffline={!db}
      />
      <ImportModal 
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportWeek={() => handleImportClick('WEEK')}
        onImportMonth={() => handleImportClick('MONTH')}
      />
      <MenuModal 
        isOpen={showMenu} 
        onClose={() => setShowMenu(false)} 
        currentApp={currentApp}
        onSwitchApp={setCurrentApp}
        onSelectZone={setActiveZone}
        activeZone={activeZone}
        isRestrictedMode={isRestrictedMode}
      />

      <Header />

      {currentApp === 'FLOW' && !activeZone && (
        <div className="bg-slate-900/80 border-b border-slate-800 flex items-center justify-center py-2 relative z-40 backdrop-blur-sm flex-none">
          <div className="flex items-center gap-6 bg-slate-800/50 px-4 py-1.5 rounded-full border border-slate-700/50 relative">
              <button 
                  onClick={handlePrevWeek}
                  className="p-1 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
                  title="Semana Anterior"
              >
                  <ChevronLeft size={20} />
              </button>
              
              <button 
                  onClick={() => setShowWeekPicker(!showWeekPicker)}
                  className="text-sm font-bold text-slate-200 hover:text-indigo-400 transition-colors flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 cursor-pointer min-w-[140px] justify-center"
              >
                  <Calendar size={14} className="text-indigo-500" />
                  {getWeekRangeLabel(currentDate)}
              </button>

              <button 
                  onClick={handleNextWeek}
                  className="p-1 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
                  title="Semana Siguiente"
              >
                  <ChevronRight size={20} />
              </button>
              
              <WeekPickerModal 
                  isOpen={showWeekPicker} 
                  onClose={() => setShowWeekPicker(false)} 
                  currentDate={currentDate} 
                  onSelectDate={handleDateSelect} 
              />
          </div>
        </div>
      )}

      <main className="flex-1 overflow-x-auto overflow-y-hidden bg-slate-950 relative z-0">
        {currentApp === 'FLOW' && !activeZone && (
            <div className="h-full flex flex-row p-4 gap-4 w-full">
                {DAYS_OF_WEEK.map((day) => (
                    <DayCard 
                        key={day.id} 
                        dayData={weekData[day.id]} 
                        onUpdate={handleUpdateDay}
                        previousBalance={runningBalances[day.id]}
                        prevWeekTreasury={prevWeekTreasury}
                        onAddToHistory={handleAddToHistory}
                    />
                ))}
            </div>
        )}
        
        {currentApp === 'FLOW' && activeZone && (
            <DeliveryApp db={db} zoneName={activeZone} isRestricted={isRestrictedMode} />
        )}

        {currentApp === 'KILOS' && <KilosApp db={db} weekKey={currentWeekKey} />}
        {currentApp === 'CC' && <CurrentAccountsApp db={db} />}
        {currentApp === 'CHEQUES' && <ChequesApp db={db} />}
        {currentApp === 'GENERAL_DATA' && <GeneralDataApp db={db} />}
        {currentApp === 'TRACKING' && <TrackingApp />}
      </main>
    </div>
  );
};

export default App;
