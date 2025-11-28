import React from 'react';
import { Download, Upload } from 'lucide-react';
import { DAYS_OF_WEEK, WeekData, DayData } from './types';
import { DayCard } from './components/DayCard';
import { Summary } from './components/Summary';
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
  const [weekData, setWeekData] = React.useState<WeekData>(() => {
    const saved = localStorage.getItem('flowTrackData');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Simple validation to check structure
        const sampleDay = Object.values(parsed)[0] as any;
        if (!sampleDay || !Array.isArray(sampleDay.incomes)) {
           return createInitialState();
        }
        return parsed;
      } catch (e) {
        console.error("Failed to parse saved data", e);
        return createInitialState();
      }
    }
    return createInitialState();
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    localStorage.setItem('flowTrackData', JSON.stringify(weekData));
  }, [weekData]);

  const handleUpdateDay = (updatedDay: DayData) => {
    setWeekData((prev) => ({
      ...prev,
      [updatedDay.id]: updatedDay,
    }));
  };

  const handleExport = () => {
    exportToCSV(weekData);
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
        if (window.confirm('Esto sobrescribirá los datos actuales. ¿Deseas continuar?')) {
          setWeekData(parsedData);
        }
      } else {
        alert('Error al leer el archivo CSV. Verifique el formato.');
      }
      // Clear input so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const totals = React.useMemo(() => (Object.values(weekData) as DayData[]).reduce(
    (acc, day) => {
      const dayIncome = day.incomes.reduce((sum, item) => sum + item.amount, 0);
      const dayExpense = day.expenses.reduce((sum, item) => sum + item.amount, 0);
      const dayToBox = day.toBox.reduce((sum, item) => sum + item.amount, 0);
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
      balances[day.id] = currentBalance;
      const data = weekData[day.id];
      if (data) {
        const income = data.incomes.reduce((s, t) => s + t.amount, 0);
        const expense = data.expenses.reduce((s, t) => s + t.amount, 0);
        const toBox = data.toBox.reduce((s, t) => s + t.amount, 0);
        currentBalance = currentBalance + income - expense - toBox;
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

      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 shadow-md flex-none z-20">
        <div className="max-w-full px-4 py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <img 
                src="https://avicolaalpina.com.ar/wp-content/uploads/2025/04/logoCompleto0.png" 
                alt="Avícola Alpina Logo" 
                className="h-12 w-auto rounded-lg bg-white p-1 shadow-md shadow-indigo-900/20"
              />
              <div>
                <h1 className="text-xl font-bold text-slate-100 leading-tight">Flujo<span className="text-indigo-400">Semanal</span></h1>
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