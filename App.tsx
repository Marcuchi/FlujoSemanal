
import React from 'react';
import { Download, Upload, PieChart as PieChartIcon, History, ChevronLeft, ChevronRight, Calendar, Menu, LayoutGrid, Scale, BookUser } from 'lucide-react';
import { ref, onValue, set, get, child } from 'firebase/database';
import { db } from './firebaseConfig';
import { DAYS_OF_WEEK, WeekData, DayData, HistoryItem, AppMode } from './types';
import { DayCard } from './components/DayCard';
import { Summary } from './components/Summary';
import { WeeklyReportModal } from './components/WeeklyReportModal';
import { HistoryModal } from './components/HistoryModal';
import { WeekPickerModal } from './components/WeekPickerModal';
import { MenuModal } from './components/MenuModal';
import { KilosApp } from './components/KilosApp';
import { CurrentAccountsApp } from './components/CurrentAccountsApp';
import { exportToCSV, parseCSV, getWeekKey, getWeekRangeLabel, addWeeks, getMonday } from './utils';

const createInitialState = (): WeekData => {
  const state: WeekData = {};
  DAYS_OF_WEEK.forEach((day) => {
    state[day.id] = {
      id: day.id,
      name: day.name,
      incomes: [],
      deliveries: [],
      expenses: [],
      salaries: [], // Init salaries
      toBox: [],
    };
  });
  return state;
};

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [weekData, setWeekData] = React.useState<WeekData>(createInitialState());
  const [history, setHistory] = React.useState<HistoryItem[]>([]);
  const [currentApp, setCurrentApp] = React.useState<AppMode>('FLOW');
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isOfflineMode, setIsOfflineMode] = React.useState(false);
  const [showReport, setShowReport] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);
  const [showWeekPicker, setShowWeekPicker] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  // Derived week key (e.g., "2024-04-15")
  const currentWeekKey = React.useMemo(() => getWeekKey(currentDate), [currentDate]);

  // --- Data Loading Effect (Only for Flow App currently, Kilos has internal loading) ---
  React.useEffect(() => {
    // Only fetch Flow data if current app is FLOW to allow Kilos to manage its own listeners if preferred
    // However, to keep totals available or mixed, we can keep fetching. 
    // For now, let's keep the existing flow data logic active always to prevent state loss on switch
    if (db) {
      setLoading(true);

      // Check for migration from root to specific week
      // This runs only once or when weekKey changes, but we want to check old data format first
      const rootRef = ref(db!);
      
      // We listen to the specific week node
      const weekDataRef = ref(db!, `weeks/${currentWeekKey}/data`);
      const historyRef = ref(db!, `weeks/${currentWeekKey}/history`);

      // 1. Migration Logic (Check if data exists in old 'weekData' root and move it to current week)
      // This effectively "adopts" the existing data into the current week view
      get(child(rootRef, 'weekData')).then((snapshot) => {
        if (snapshot.exists()) {
           // We found orphan data in root! Let's check if our current week is empty
           get(weekDataRef).then((weekSnap) => {
             if (!weekSnap.exists()) {
                // Current week is empty, but we have root data. Move it here.
                const oldData = snapshot.val();
                set(weekDataRef, oldData);
                // Also move history if exists
                get(child(rootRef, 'history')).then((histSnap) => {
                  if (histSnap.exists()) {
                    set(historyRef, histSnap.val());
                    set(ref(db!, 'history'), null); // Delete old root history
                  }
                });
                set(ref(db!, 'weekData'), null); // Delete old root data
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
          // No data for this week yet
          setWeekData(createInitialState());
        }
        setLoading(false);
      });

      // 3. History Listener
      const unsubscribeHistory = onValue(historyRef, (snapshot) => {
          const data = snapshot.val();
          setHistory(data || []);
      });

      return () => {
        unsubscribeWeek();
        unsubscribeHistory();
      };
    } else {
      // LocalStorage Fallback (Simplified for offline)
      setIsOfflineMode(true);
      // We use the weekKey in localStorage key to allow offline navigation too
      const saved = localStorage.getItem(`weekData_${currentWeekKey}`);
      const savedHistory = localStorage.getItem(`history_${currentWeekKey}`);
      
      if (saved) {
        try {
          setWeekData(JSON.parse(saved));
        } catch (e) { console.error(e); }
      } else {
        setWeekData(createInitialState());
      }

      if (savedHistory) {
         try {
             setHistory(JSON.parse(savedHistory));
         } catch (e) { console.error(e); }
      } else {
        setHistory([]);
      }
      setLoading(false);
    }
  }, [currentDate, currentWeekKey]);

  // --- Save Functions ---

  const saveWeekData = (newData: WeekData) => {
    const cleanData = JSON.parse(JSON.stringify(newData));
    if (db) {
      set(ref(db!, `weeks/${currentWeekKey}/data`), cleanData).catch(console.error);
      setWeekData(newData); // Optimistic update
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

  const handleExport = () => {
    exportToCSV(weekData, history);
  };

  const handleReset = () => {
    // If we are in Kilos App, reset Kilos data
    if (currentApp === 'KILOS') {
        const msg = "Reiniciar borrará los datos de KILOS de esta semana. ¿Seguro?";
        if (window.confirm(msg)) {
            if (db) {
                set(ref(db!, `weeks/${currentWeekKey}/kilos`), null);
            } else {
                localStorage.removeItem(`kilos_${currentWeekKey}`);
            }
            // KilosApp component listens to this via firebase, so we might need to force update if local
            window.location.reload(); 
        }
        return;
    }

    // Default Flow Reset
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
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const result = parseCSV(text);
      if (result) {
        if (window.confirm('Esto sobrescribirá datos actuales. ¿Continuar?')) {
          saveWeekData(result.weekData);
          saveHistory(result.history);
        }
      } else {
        alert('Error al leer el archivo CSV.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  // --- Calculations ---

  const totals = React.useMemo(() => (Object.values(weekData) as DayData[]).reduce(
    (acc, day) => {
      if (!day) return acc;
      const dayIncome = day.incomes?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
      const dayDeliveries = day.deliveries?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
      const dayExpense = day.expenses?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
      const daySalaries = day.salaries?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
      const dayToBox = day.toBox?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
      const initialBox = day.initialBoxAmount || 0; 

      return {
        income: acc.income + dayIncome + dayDeliveries,
        expense: acc.expense + dayExpense + daySalaries, 
        toBox: acc.toBox + dayToBox + initialBox,
      };
    },
    { income: 0, expense: 0, toBox: 0 }
  ), [weekData]);

  const netTotal = totals.income - totals.expense;

  const runningBalances = React.useMemo(() => {
    const balances: Record<string, number> = {};
    let currentBalance = 0;

    for (const day of DAYS_OF_WEEK) {
      const data = weekData[day.id];
      const effectiveInitial = data?.manualInitialAmount ?? currentBalance;
      balances[day.id] = currentBalance; // Balance available at start of day
      
      if (data) {
        const income = data.incomes?.reduce((s, t) => s + (t.amount || 0), 0) || 0;
        const deliveries = data.deliveries?.reduce((s, t) => s + (t.amount || 0), 0) || 0;
        const expense = data.expenses?.reduce((s, t) => s + (t.amount || 0), 0) || 0;
        const salaries = data.salaries?.reduce((s, t) => s + (t.amount || 0), 0) || 0;
        const toBox = data.toBox?.reduce((s, t) => s + (t.amount || 0), 0) || 0;
        
        // Final balance of the day, used for next day's initial
        currentBalance = effectiveInitial + income + deliveries - expense - salaries - toBox;
      }
    }
    // Store Saturday closing balance for "next week" calculation logic
    balances['saturday_close'] = currentBalance;
    return balances;
  }, [weekData]);

  // --- Navigation & Logic ---

  const handlePrevWeek = () => {
    setCurrentDate(addWeeks(currentDate, -1));
  };

  const handleNextWeek = () => {
    const nextDate = addWeeks(currentDate, 1);
    const nextWeekKey = getWeekKey(nextDate);

    // If online, check if next week exists. If not, carry over balances.
    if (db) {
        const nextWeekRef = ref(db!, `weeks/${nextWeekKey}/data`);
        get(nextWeekRef).then((snapshot) => {
            if (!snapshot.exists()) {
                // Determine carry-over amounts from current week
                // 1. Office Balance: Saturday Closing Balance
                const carryOverOffice = runningBalances['saturday_close'] || 0;
                
                // 2. Box Balance: Total Accumulated Box
                const carryOverBox = totals.toBox;

                // Create new state with these initial values for Monday
                const newState = createInitialState();
                newState['monday'].manualInitialAmount = carryOverOffice;
                newState['monday'].initialBoxAmount = carryOverBox;

                set(nextWeekRef, JSON.parse(JSON.stringify(newState)));
            }
            // Navigate regardless (state listener will pick up the new data)
            setCurrentDate(nextDate);
        });
    } else {
        // Offline mode: just navigate
        setCurrentDate(nextDate);
    }
  };

  const handleDateSelect = (date: Date) => {
    setCurrentDate(date);
    setShowWeekPicker(false);
  };

  const getHeaderContent = () => {
      if (currentApp === 'KILOS') {
          return <>Control<span className="text-orange-400">Kilos</span></>;
      }
      if (currentApp === 'CC') {
          return <>Cuentas<span className="text-emerald-400">Corrientes</span></>;
      }
      return <>Flujo<span className="text-indigo-400">Semanal</span></>;
  };

  const Header = () => (
      <header className="bg-slate-900 border-b border-slate-800 shadow-md flex-none z-20">
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
                  {isOfflineMode && <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded ml-2 border border-slate-600">MODO LOCAL</span>}
                </h1>
                <p className="text-xs text-slate-400 hidden sm:block">Avícola Alpina</p>
              </div>
            </div>

            {currentApp === 'FLOW' && (
                <div className="flex-1 overflow-x-auto no-scrollbar mx-4">
                   <Summary totalIncome={totals.income} totalExpense={totals.expense} netTotal={netTotal} totalToBox={totals.toBox} />
                </div>
            )}
            
            {currentApp !== 'FLOW' && <div className="flex-1"></div>}
            
            <div className="flex items-center gap-2 flex-shrink-0">
              
              {currentApp === 'FLOW' && (
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

                      <button type="button" onClick={handleImportClick} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-colors border border-slate-700">
                        <Upload size={14} />
                        <span className="hidden lg:inline">Importar</span>
                      </button>

                      <button type="button" onClick={handleExport} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-colors border border-slate-700">
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

  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden text-slate-100">
      <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

      <WeeklyReportModal isOpen={showReport} onClose={() => setShowReport(false)} weekData={weekData} />
      <HistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} history={history} onRestore={handleRestoreHistory} />
      <MenuModal 
        isOpen={showMenu} 
        onClose={() => setShowMenu(false)} 
        onReset={handleReset} 
        currentApp={currentApp}
        onSwitchApp={setCurrentApp}
      />

      <Header />

      {/* Week Navigation Bar (Shared) */}
      {currentApp !== 'CC' && (
        <div className="bg-slate-900/80 border-b border-slate-800 flex items-center justify-center py-2 relative z-50 backdrop-blur-sm flex-none">
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
                  className="flex items-center gap-2 text-sm font-medium text-slate-200 hover:text-white px-2 py-1 rounded hover:bg-slate-700/50 transition-colors"
              >
                  <Calendar size={14} className={currentApp === 'FLOW' ? "text-indigo-400" : (currentApp === 'KILOS' ? "text-orange-400" : "text-emerald-400")} />
                  <span>{getWeekRangeLabel(currentDate)}</span>
              </button>
              
              <WeekPickerModal 
                isOpen={showWeekPicker} 
                onClose={() => setShowWeekPicker(false)} 
                currentDate={currentDate}
                onSelectDate={handleDateSelect}
              />

              <button 
                  onClick={handleNextWeek}
                  className="p-1 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
                  title="Siguiente Semana"
              >
                  <ChevronRight size={20} />
              </button>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-hidden relative">
        {loading && (
             <div className="absolute inset-0 bg-slate-950/80 z-50 flex items-center justify-center">
                 <div className={`w-8 h-8 border-4 border-t-transparent rounded-full animate-spin ${currentApp === 'FLOW' ? 'border-indigo-500' : 'border-emerald-500'}`}></div>
             </div>
        )}
        
        {currentApp === 'FLOW' && (
            <div className="flex h-full gap-4 min-w-max pb-2 p-4 overflow-x-auto">
              {DAYS_OF_WEEK.map((dayDef) => (
                <DayCard
                  key={dayDef.id}
                  dayData={weekData[dayDef.id]}
                  onUpdate={handleUpdateDay}
                  previousBalance={runningBalances[dayDef.id]}
                  onAddToHistory={handleAddToHistory}
                />
              ))}
            </div>
        )}

        {currentApp === 'KILOS' && (
            <KilosApp db={db} weekKey={currentWeekKey} />
        )}

        {currentApp === 'CC' && (
            <CurrentAccountsApp db={db} />
        )}
      </main>
    </div>
  );
};

export default App;
