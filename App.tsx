import React from 'react';
import { Download, Upload, PieChart as PieChartIcon, History, ChevronLeft, ChevronRight, Calendar, Menu, LayoutGrid, Scale, BookUser, Banknote, Database, StickyNote } from 'lucide-react';
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
import { exportToCSV, exportMonthToCSV, parseCSV, parseMonthCSV, getWeekKey, getWeekRangeLabel, addWeeks, getMonday, generateId } from './utils';

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

const App: React.FC = () => {
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
  const [loadedWeekKey, setLoadedWeekKey] = React.useState<string | null>(null);

  // Derived week key (e.g., "2024-04-15")
  const currentWeekKey = React.useMemo(() => getWeekKey(currentDate), [currentDate]);

  // --- Data Loading Effect ---
  React.useEffect(() => {
    if (db) {
      setLoading(true);
      setLoadedWeekKey(null);

      const rootRef = ref(db!, `weeks`);
      const weekDataRef = ref(db!, `weeks/${currentWeekKey}/data`);
      const historyRef = ref(db!, `weeks/${currentWeekKey}/history`);

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
              manualInitialModified: dayData.manualInitialModified,
              systemInitialOffice: dayData.systemInitialOffice,
              initialBoxAmount: dayData.initialBoxAmount,
              initialBoxModified: dayData.initialBoxModified,
              systemInitialBox: dayData.systemInitialBox
            };
          });
          setWeekData(sanitizedData);
        } else {
          setWeekData(createInitialState());
        }
        setLoadedWeekKey(currentWeekKey);
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

      setLoadedWeekKey(currentWeekKey);
      setLoading(false);
    }
  }, [currentDate, currentWeekKey, currentApp]);

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

  // --- Retrospective Sync Effect ---
  React.useEffect(() => {
    if (loading || currentApp !== 'FLOW' || loadedWeekKey !== currentWeekKey) return;

    const syncFromPrevious = async () => {
        const prevDate = addWeeks(currentDate, -1);
        const prevWeekKey = getWeekKey(prevDate);
        let prevData: WeekData | null = null;

        if (db) {
            const snap = await get(ref(db, `weeks/${prevWeekKey}/data`));
            if (snap.exists()) prevData = snap.val();
        } else {
            const saved = localStorage.getItem(`weekData_${prevWeekKey}`);
            if (saved) prevData = JSON.parse(saved);
        }

        let prevOfficeClose = 0;
        let prevTreasury = 0;

        if (prevData) {
            let currentBalance = 0;
            for (const day of DAYS_OF_WEEK) {
                const d = prevData[day.id];
                const effInitial = d?.manualInitialAmount ?? currentBalance;
                
                if (d) {
                    const inc = d.incomes?.reduce((s:number, t:any)=>s+(t.amount||0),0)||0;
                    const del = d.deliveries?.reduce((s:number, t:any)=>s+(t.amount||0),0)||0;
                    const exp = d.expenses?.reduce((s:number, t:any)=>s+(t.amount||0),0)||0;
                    const sal = d.salaries?.reduce((s:number, t:any)=>s+(t.amount||0),0)||0;
                    const tob = d.toBox?.reduce((s:number, t:any)=>s+(t.amount||0),0)||0;
                    currentBalance = effInitial + inc + del - exp - sal - tob;
                }
            }
            prevOfficeClose = currentBalance;

            Object.values(prevData).forEach((d: any) => {
                const tob = d.toBox?.reduce((s:number, t:any)=>s+(t.amount||0),0)||0;
                prevTreasury += tob;
                if (d.id === 'monday') prevTreasury += (d.initialBoxAmount || 0);
            });
        }

        const currentMonday = weekData['monday'];
        if (!currentMonday) return; 

        let needsUpdate = false;
        const updatedMonday = { ...currentMonday };

        if (updatedMonday.systemInitialOffice !== prevOfficeClose) {
            updatedMonday.systemInitialOffice = prevOfficeClose;
            needsUpdate = true;
        }
        if (updatedMonday.systemInitialBox !== prevTreasury) {
            updatedMonday.systemInitialBox = prevTreasury;
            needsUpdate = true;
        }

        if (!updatedMonday.manualInitialModified && updatedMonday.manualInitialAmount !== prevOfficeClose) {
            updatedMonday.manualInitialAmount = prevOfficeClose;
            needsUpdate = true;
        }
        if (!updatedMonday.initialBoxModified && updatedMonday.initialBoxAmount !== prevTreasury) {
            updatedMonday.initialBoxAmount = prevTreasury;
            needsUpdate = true;
        }

        if (needsUpdate) {
            handleUpdateDay(updatedMonday);
        }
    };

    syncFromPrevious();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeekKey, loading, currentApp, loadedWeekKey]); 

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
      balances[day.id] = currentBalance;
      
      if (data) {
        const income = data.incomes?.reduce((s, t) => s + (t.amount || 0), 0) || 0;
        const deliveries = data.deliveries?.reduce((s, t) => s + (t.amount || 0), 0) || 0;
        const expense = data.expenses?.reduce((s, t) => s + (t.amount || 0), 0) || 0;
        const salaries = data.salaries?.reduce((s, t) => s + (t.amount || 0), 0) || 0;
        const toBox = data.toBox?.reduce((s, t) => s + (t.amount || 0), 0) || 0;
        currentBalance = effectiveInitial + income + deliveries - expense - salaries - toBox;
      }
    }
    balances['saturday_close'] = currentBalance;
    return balances;
  }, [weekData]);

  // --- Navigation ---

  const handlePrevWeek = () => setCurrentDate(addWeeks(currentDate, -1));

  const handleNextWeek = () => {
    const nextDate = addWeeks(currentDate, 1);
    setCurrentDate(nextDate);
  };

  const handleDateSelect = (date: Date) => {
    setCurrentDate(date);
    setShowWeekPicker(false);
  };

  const getHeaderContent = () => {
      if (currentApp === 'KILOS') {
          return <>Control<span className="text-orange-400 dark:text-orange-400">Kilos</span></>;
      }
      if (currentApp === 'CC') {
          return <>Cuentas<span className="text-emerald-500 dark:text-emerald-400">Corrientes</span></>;
      }
      if (currentApp === 'CHEQUES') {
          return <>Cheques<span className="text-violet-500 dark:text-violet-400">Cartera</span></>;
      }
      if (currentApp === 'GENERAL_DATA') {
          return <>Datos<span className="text-cyan-500 dark:text-cyan-400">Generales</span></>;
      }
      return <>Flujo<span className="text-indigo-500 dark:text-indigo-400">Semanal</span></>;
  };

  const Header = () => (
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm flex-none z-20 transition-colors duration-300">
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
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-tight flex items-center gap-2">
                  {getHeaderContent()}
                  {isOfflineMode && <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded ml-2 border border-slate-300 dark:border-slate-600">MODO LOCAL</span>}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Avícola Alpina</p>
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
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm shadow-indigo-200 dark:shadow-indigo-900/50"
                      >
                        <PieChartIcon size={14} />
                        <span className="hidden lg:inline">Informe Semanal</span>
                      </button>

                      <button 
                        type="button"
                        onClick={() => setShowHistory(true)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors border border-slate-200 dark:border-slate-700 relative"
                      >
                        <History size={14} />
                        <span className="hidden lg:inline">Historial</span>
                        {history.length > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] text-white">
                                {history.length}
                            </span>
                        )}
                      </button>

                      <button type="button" onClick={() => setShowImportModal(true)} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors border border-slate-200 dark:border-slate-700">
                        <Upload size={14} />
                        <span className="hidden lg:inline">Importar</span>
                      </button>

                      <button type="button" onClick={() => setShowExportModal(true)} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors border border-slate-200 dark:border-slate-700">
                        <Download size={14} />
                        <span className="hidden lg:inline">Exportar</span>
                      </button>
                  </>
              )}

              <button type="button" onClick={() => setShowMenu(true)} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors border border-slate-200 dark:border-slate-700">
                <Menu size={14} />
                <span className="hidden lg:inline">Menú</span>
              </button>
            </div>
          </div>
        </div>
      </header>
  );

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 transition-colors duration-300">
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
        onReset={handleReset} 
        currentApp={currentApp}
        onSwitchApp={setCurrentApp}
        db={db}
      />

      <Header />

      {currentApp !== 'CC' && currentApp !== 'CHEQUES' && currentApp !== 'GENERAL_DATA' && (
        <div className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-center py-2 relative z-40 backdrop-blur-sm flex-none transition-colors duration-300">
          <div className="flex items-center gap-6 bg-white dark:bg-slate-800/50 px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-700/50 relative shadow-sm">
              <button 
                  onClick={handlePrevWeek}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                  title="Semana Anterior"
              >
                  <ChevronLeft size={20} />
              </button>
              
              <button 
                  onClick={() => setShowWeekPicker(!showWeekPicker)}
                  className="text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer min-w-[140px] justify-center"
              >
                  <Calendar size={14} className="text-indigo-500" />
                  {getWeekRangeLabel(currentDate)}
              </button>

              <button 
                  onClick={handleNextWeek}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
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

      <main className="flex-1 overflow-x-auto overflow-y-hidden bg-slate-100 dark:bg-slate-950 relative z-0 transition-colors duration-300">
        {currentApp === 'FLOW' && (
            <div className="h-full flex flex-row p-4 gap-4 w-full">
                {DAYS_OF_WEEK.map((day) => (
                    <DayCard 
                        key={day.id} 
                        dayData={weekData[day.id]} 
                        onUpdate={handleUpdateDay}
                        previousBalance={runningBalances[day.id]}
                        onAddToHistory={handleAddToHistory}
                    />
                ))}
            </div>
        )}
        {currentApp === 'KILOS' && <KilosApp db={db} weekKey={currentWeekKey} />}
        {currentApp === 'CC' && <CurrentAccountsApp db={db} />}
        {currentApp === 'CHEQUES' && <ChequesApp db={db} />}
        {currentApp === 'GENERAL_DATA' && <GeneralDataApp db={db} />}
      </main>
    </div>
  );
};

export default App;