import React from 'react';
import { Download, Upload, RotateCcw, PieChart as PieChartIcon } from 'lucide-react';
import { ref, onValue, set } from 'firebase/database';
import { db } from './firebaseConfig';
import { DAYS_OF_WEEK, WeekData, DayData } from './types';
import { DayCard } from './components/DayCard';
import { Summary } from './components/Summary';
import { WeeklyReportModal } from './components/WeeklyReportModal';
import { exportToCSV, parseCSV } from './utils';

// Initial state creator
const createInitialState = (): WeekData => {
  const state: WeekData = {};
  DAYS_OF_WEEK.forEach((day) => {
    state[day.id] = {
      id: day.id,
      name: day.name,
      incomes: [],
      expenses: [],
      toBox: [],
    };
  });
  return state;
};

const App: React.FC = () => {
  const [weekData, setWeekData] = React.useState<WeekData>(createInitialState());
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isOfflineMode, setIsOfflineMode] = React.useState(false);
  const [showReport, setShowReport] = React.useState(false);

  // Data Loading Effect (Hybrid: Cloud or Local)
  React.useEffect(() => {
    if (db) {
      // --- MODO NUBE (Firebase) ---
      const dataRef = ref(db, 'weekData');
      
      const unsubscribe = onValue(dataRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const sanitizedData: WeekData = {};
          DAYS_OF_WEEK.forEach((day) => {
            const dayData = data[day.id] || {};
            sanitizedData[day.id] = {
              id: day.id,
              name: day.name,
              incomes: dayData.incomes || [],
              expenses: dayData.expenses || [],
              toBox: dayData.toBox || [],
              manualInitialAmount: dayData.manualInitialAmount
            };
          });
          setWeekData(sanitizedData);
        } else {
          // Inicializar DB si está vacía
          const initial = createInitialState();
          // Limpiamos undefined antes de guardar
          set(ref(db, 'weekData'), JSON.parse(JSON.stringify(initial)));
          setWeekData(initial);
        }
      }, (error) => {
        console.error("Error leyendo Firebase:", error);
        // Fallback opcional si falla la lectura a pesar de tener objeto db
      });

      return () => unsubscribe();
    } else {
      // --- MODO LOCAL (LocalStorage) ---
      setIsOfflineMode(true);
      const saved = localStorage.getItem('weekData');
      if (saved) {
        try {
          setWeekData(JSON.parse(saved));
        } catch (e) {
          console.error("Error parsing local storage", e);
        }
      }
    }
  }, []);

  // Helper para guardar datos (abstrae la lógica Nube vs Local)
  const saveWeekData = (newData: WeekData) => {
    if (db) {
      // Guardar en Firebase
      // IMPORTANTE: Firebase SDK lanza error crítico si encuentra valores 'undefined'.
      // JSON.stringify elimina automáticamente las claves con valor undefined.
      // JSON.parse reconstruye el objeto limpio y seguro para enviar.
      const cleanData = JSON.parse(JSON.stringify(newData));

      set(ref(db, 'weekData'), cleanData).catch(err => {
        console.error("Error guardando en Firebase", err);
      });
      // Actualizamos estado local optimísticamente
      setWeekData(newData); 
    } else {
      // Guardar en LocalStorage
      setWeekData(newData);
      localStorage.setItem('weekData', JSON.stringify(newData));
    }
  };

  const handleUpdateDay = (updatedDay: DayData) => {
    // Calculamos el nuevo estado completo basado en el estado anterior
    const newWeekData = {
      ...weekData,
      [updatedDay.id]: updatedDay
    };
    saveWeekData(newWeekData);
  };

  const handleExport = () => {
    exportToCSV(weekData);
  };

  const handleReset = () => {
    const msg = db 
      ? "¿Estás seguro de reiniciar la semana? Esto borrará los datos en la NUBE para todos." 
      : "¿Estás seguro de reiniciar la semana? Esto borrará los datos LOCALES.";
      
    if (window.confirm(msg)) {
      const emptyState = createInitialState();
      saveWeekData(emptyState);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsedData = parseCSV(text);
      if (parsedData) {
        const msg = db 
          ? 'Esto sobrescribirá los datos actuales en la NUBE. ¿Continuar?' 
          : 'Esto sobrescribirá los datos LOCALES. ¿Continuar?';
          
        if (window.confirm(msg)) {
          saveWeekData(parsedData);
        }
      } else {
        alert('Error al leer el archivo CSV. Verifique el formato.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const totals = React.useMemo(() => (Object.values(weekData) as DayData[]).reduce(
    (acc, day) => {
      if (!day) return acc;
      const dayIncome = day.incomes?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
      const dayExpense = day.expenses?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
      const dayToBox = day.toBox?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
      return {
        income: acc.income + dayIncome,
        expense: acc.expense + dayExpense,
        toBox: acc.toBox + dayToBox,
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
        const expense = data.expenses?.reduce((s, t) => s + (t.amount || 0), 0) || 0;
        const toBox = data.toBox?.reduce((s, t) => s + (t.amount || 0), 0) || 0;
        
        currentBalance = effectiveInitial + income - expense - toBox;
      }
    }
    return balances;
  }, [weekData]);

  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden text-slate-100">
      <input 
        type="file" 
        accept=".csv" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />

      <WeeklyReportModal 
        isOpen={showReport} 
        onClose={() => setShowReport(false)} 
        weekData={weekData} 
      />

      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 shadow-md flex-none z-20">
        <div className="max-w-full px-4 py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <img 
                src="https://avicolaalpina.com.ar/wp-content/uploads/2025/04/logoCompleto0.png" 
                alt="Avícola Alpina" 
                className="h-12 w-auto rounded-lg bg-white p-1 shadow-md shadow-indigo-900/20"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
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
               <Summary 
                totalIncome={totals.income}
                totalExpense={totals.expense}
                netTotal={netTotal}
                totalToBox={totals.toBox}
              />
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
                onClick={handleImportClick}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-colors border border-slate-700"
              >
                <Upload size={14} />
                <span className="hidden lg:inline">Importar</span>
              </button>

              <button 
                type="button"
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-colors border border-slate-700"
              >
                <Download size={14} />
                <span className="hidden lg:inline">Exportar</span>
              </button>

              <button 
                type="button"
                onClick={handleReset}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-300 bg-red-950/30 hover:bg-red-900/50 hover:text-red-200 rounded-lg transition-colors border border-red-900/50"
              >
                <RotateCcw size={14} />
                <span className="hidden lg:inline">Reiniciar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Horizontal Scroll */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden bg-slate-950 p-4">
        <div className="flex h-full gap-4 min-w-max pb-2">
          {DAYS_OF_WEEK.map((dayDef) => (
            <DayCard
              key={dayDef.id}
              dayData={weekData[dayDef.id]}
              onUpdate={handleUpdateDay}
              previousBalance={runningBalances[dayDef.id]}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default App;