import React from 'react';
import { Download, Upload, RotateCcw, PieChart as PieChartIcon, History } from 'lucide-react';
import { ref, onValue, set } from 'firebase/database';
import { db } from './firebaseConfig';
import { DAYS_OF_WEEK, WeekData, DayData, HistoryItem } from './types';
import { DayCard } from './components/DayCard';
import { Summary } from './components/Summary';
import { WeeklyReportModal } from './components/WeeklyReportModal';
import { HistoryModal } from './components/HistoryModal';
import { exportToCSV, parseCSV } from './utils';

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
  const [weekData, setWeekData] = React.useState<WeekData>(createInitialState());
  const [history, setHistory] = React.useState<HistoryItem[]>([]);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isOfflineMode, setIsOfflineMode] = React.useState(false);
  const [showReport, setShowReport] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);

  // Data Loading Effect
  React.useEffect(() => {
    if (db) {
      // 1. Week Data Listener
      const weekRef = ref(db!, 'weekData');
      const unsubscribeWeek = onValue(weekRef, (snapshot) => {
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
              salaries: dayData.salaries || [], // Load salaries
              toBox: dayData.toBox || [],
              manualInitialAmount: dayData.manualInitialAmount,
              initialBoxAmount: dayData.initialBoxAmount // Load Initial Box
            };
          });
          setWeekData(sanitizedData);
        } else {
          const initial = createInitialState();
          set(ref(db!, 'weekData'), JSON.parse(JSON.stringify(initial)));
          setWeekData(initial);
        }
      });

      // 2. History Listener
      const historyRef = ref(db!, 'history');
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
      const saved = localStorage.getItem('weekData');
      const savedHistory = localStorage.getItem('history');
      if (saved) {
        try {
          setWeekData(JSON.parse(saved));
        } catch (e) { console.error(e); }
      }
      if (savedHistory) {
         try {
             setHistory(JSON.parse(savedHistory));
         } catch (e) { console.error(e); }
      }
    }
  }, []);

  const saveWeekData = (newData: WeekData) => {
    // Sanitize data before saving (remove undefineds)
    const cleanData = JSON.parse(JSON.stringify(newData));
    
    // Explicitly handle fields that might be undefined to ensure they are null in Firebase (to delete them)
    // or just rely on JSON.stringify stripping undefined. 
    // For Firebase, it's safer to ensure the structure is valid.
    
    if (db) {
      set(ref(db!, 'weekData'), cleanData).catch(console.error);
      setWeekData(newData); 
    } else {
      setWeekData(newData);
      localStorage.setItem('weekData', JSON.stringify(newData));
    }
  };

  const saveHistory = (newHistory: HistoryItem[]) => {
      if (db) {
          const cleanHistory = JSON.parse(JSON.stringify(newHistory));
          set(ref(db!, 'history'), cleanHistory).catch(console.error);
          setHistory(newHistory);
      } else {
          setHistory(newHistory);
          localStorage.setItem('history', JSON.stringify(newHistory));
      }
  };

  const handleUpdateDay = (updatedDay: DayData) => {
    const newWeekData = { ...weekData, [updatedDay.id]: updatedDay };
    saveWeekData(newWeekData);
  };

  const handleAddToHistory = (item: HistoryItem) => {
      const newHistory = [...history, item];
      saveHistory(newHistory);
  };

  const handleRestoreHistory = (item: HistoryItem) => {
      // 1. Remove from history
      const newHistory = history.filter(i => i.id !== item.id);
      saveHistory(newHistory);

      // 2. Restore to Day
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
    const msg = db 
      ? "¿Estás seguro de reiniciar la semana? Esto borrará TODOS los datos (incluido historial) en la NUBE." 
      : "¿Estás seguro de reiniciar la semana? Esto borrará los datos LOCALES.";
      
    if (window.confirm(msg)) {
      const emptyState = createInitialState();
      
      if (db) {
          set(ref(db!, 'weekData'), JSON.parse(JSON.stringify(emptyState)));
          set(ref(db!, 'history'), []);
      } else {
          localStorage.removeItem('weekData');
          localStorage.removeItem('history');
      }
      
      window.location.reload();
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

  const totals = React.useMemo(() => (Object.values(weekData) as DayData[]).reduce(
    (acc, day) => {
      if (!day) return acc;
      const dayIncome = day.incomes?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
      const dayDeliveries = day.deliveries?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
      const dayExpense = day.expenses?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
      const daySalaries = day.salaries?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
      const dayToBox = day.toBox?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
      const initialBox = day.initialBoxAmount || 0; // Add initial box to total

      return {
        income: acc.income + dayIncome + dayDeliveries,
        expense: acc.expense + dayExpense + daySalaries, // Include salaries in total expense
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
        
        // Subtract salaries in balance
        currentBalance = effectiveInitial + income + deliveries - expense - salaries - toBox;
      }
    }
    return balances;
  }, [weekData]);

  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden text-slate-100">
      <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

      <WeeklyReportModal isOpen={showReport} onClose={() => setShowReport(false)} weekData={weekData} />
      <HistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} history={history} onRestore={handleRestoreHistory} />

      <header className="bg-slate-900 border-b border-slate-800 shadow-md flex-none z-20">
        <div className="max-w-full px-4 py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <img 
                src="https://avicolaalpina.com.ar/wp-content/uploads/2025/04/logoCompleto0.png" 
                alt="Avícola Alpina" 
                className="h-12 w-auto object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div>
                <h1 className="text-xl font-bold text-slate-100 leading-tight flex items-center gap-2">
                  Flujo<span className="text-indigo-400">Semanal</span>
                  {isOfflineMode && <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded ml-2 border border-slate-600">MODO LOCAL</span>}
                </h1>
                <p className="text-xs text-slate-400 hidden sm:block">Avícola Alpina</p>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto no-scrollbar mx-4">
               <Summary totalIncome={totals.income} totalExpense={totals.expense} netTotal={netTotal} totalToBox={totals.toBox} />
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
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

              <button type="button" onClick={handleReset} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-300 bg-red-950/30 hover:bg-red-900/50 hover:text-red-200 rounded-lg transition-colors border border-red-900/50">
                <RotateCcw size={14} />
                <span className="hidden lg:inline">Reiniciar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-x-auto overflow-y-hidden bg-slate-950 p-4">
        <div className="flex h-full gap-4 min-w-max pb-2">
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
      </main>
    </div>
  );
};

export default App;