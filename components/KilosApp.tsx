import React from 'react';
import { ref, onValue, set } from 'firebase/database';
import { Database } from 'firebase/database';
import { Plus, Trash2 } from 'lucide-react';
import { DAYS_OF_WEEK, KilosWeekData, KilosDayData, DRIVERS_LIST, ROUTES_LIST } from '../types';

interface KilosAppProps {
  db: Database | null;
  weekKey: string;
}

// Initial state creation ensuring all objects/arrays exist
const createInitialKilosState = (): KilosWeekData => {
  const state: KilosWeekData = {};
  DAYS_OF_WEEK.forEach((day) => {
    state[day.id] = {
      id: day.id,
      public: [],
      drivers: DRIVERS_LIST.reduce((acc, curr) => ({ ...acc, [curr]: 0 }), {}),
      routes_out: ROUTES_LIST.reduce((acc, curr) => ({ ...acc, [curr]: 0 }), {}),
      routes_in: ROUTES_LIST.reduce((acc, curr) => ({ ...acc, [curr]: 0 }), {}),
      camera_plus: 0,
      camera_minus: 0
    };
  });
  return state;
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('es-AR').format(value);
};

const InputCell = ({ value, onChange, colorClass = "text-slate-700 dark:text-slate-200 focus:border-blue-500", bgClass = "bg-white dark:bg-slate-900/50" }: any) => {
  const [localValue, setLocalValue] = React.useState(value === 0 ? '' : String(value));

  React.useEffect(() => {
    const numericLocal = parseFloat(localValue.replace(/,/g, '.')) || 0;
    if (Math.abs(numericLocal - value) > 0.001) {
       setLocalValue(value === 0 ? '' : String(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^[-0-9.,]*$/.test(val)) {
        setLocalValue(val);
        onChange(val);
    }
  };

  const handleBlur = () => {
     setLocalValue(value === 0 ? '' : String(value));
  };

  return (
      <input 
          type="text" 
          inputMode="decimal"
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="0"
          className={`w-full ${bgClass} border border-slate-200 dark:border-slate-700/50 rounded px-2 py-1 text-right ${colorClass} focus:outline-none transition-all font-mono text-sm appearance-none shadow-sm focus:shadow-md focus:ring-1 focus:ring-opacity-50`}
      />
  );
};

export const KilosApp: React.FC<KilosAppProps> = ({ db, weekKey }) => {
  const [data, setData] = React.useState<KilosWeekData>(createInitialKilosState());
  const [loading, setLoading] = React.useState(true);

  // Load Data
  React.useEffect(() => {
    if (db) {
      setLoading(true);
      const kilosRef = ref(db, `weeks/${weekKey}/kilos`);
      
      const unsubscribe = onValue(kilosRef, (snapshot) => {
        const val = snapshot.val();
        if (val) {
          const initial = createInitialKilosState();
          const merged: KilosWeekData = {};
          
          DAYS_OF_WEEK.forEach(day => {
            const d = val[day.id] || {};
            merged[day.id] = {
              id: day.id,
              public: Array.isArray(d.public) ? d.public : [],
              drivers: { ...initial[day.id].drivers, ...(d.drivers || {}) },
              routes_out: { ...initial[day.id].routes_out, ...(d.routes_out || {}) },
              routes_in: { ...initial[day.id].routes_in, ...(d.routes_in || {}) },
              camera_plus: Number(d.camera_plus) || 0,
              camera_minus: Number(d.camera_minus) || 0,
            };
          });
          setData(merged);
        } else {
          setData(createInitialKilosState());
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      const saved = localStorage.getItem(`kilos_${weekKey}`);
      if (saved) {
        try {
          setData(JSON.parse(saved));
        } catch (e) { setData(createInitialKilosState()); }
      } else {
        setData(createInitialKilosState());
      }
      setLoading(false);
    }
  }, [db, weekKey]);

  // Save Data
  const saveData = (newData: KilosWeekData) => {
    if (db) {
      set(ref(db, `weeks/${weekKey}/kilos`), newData);
    } else {
      setData(newData);
      localStorage.setItem(`kilos_${weekKey}`, JSON.stringify(newData));
    }
  };

  // --- Handlers ---
  const handleDeepChange = (dayId: string, category: 'drivers' | 'routes_out' | 'routes_in', key: string, value: string) => {
      const normalized = value.replace(/,/g, '.');
      const num = parseFloat(normalized) || 0;
      const updatedCategory = { ...data[dayId][category], [key]: num };
      const updatedDay = { ...data[dayId], [category]: updatedCategory };
      saveData({ ...data, [dayId]: updatedDay });
  };

  const handleSimpleChange = (dayId: string, field: 'camera_plus' | 'camera_minus', value: string) => {
      const normalized = value.replace(/,/g, '.');
      const num = parseFloat(normalized) || 0;
      const updatedDay = { ...data[dayId], [field]: num };
      saveData({ ...data, [dayId]: updatedDay });
  };

  const handlePublicRowChange = (dayId: string, index: number, value: string) => {
      const normalized = value.replace(/,/g, '.');
      const num = parseFloat(normalized) || 0;
      const currentList = [...data[dayId].public];
      while (currentList.length <= index) currentList.push(0);
      currentList[index] = num;
      
      const updatedDay = { ...data[dayId], public: currentList };
      saveData({ ...data, [dayId]: updatedDay });
  };

  const addPublicRow = () => {
      const newData = { ...data };
      DAYS_OF_WEEK.forEach(day => {
          const list = [...newData[day.id].public];
          list.push(0);
          newData[day.id] = { ...newData[day.id], public: list };
      });
      saveData(newData);
  };

  const removePublicRow = (index: number) => {
      const newData = { ...data };
      DAYS_OF_WEEK.forEach(day => {
          const list = [...newData[day.id].public];
          list.splice(index, 1);
          newData[day.id] = { ...newData[day.id], public: list };
      });
      saveData(newData);
  };

  // --- Calculations ---
  const getDayTotal = (day: KilosDayData) => {
      const totalPublic = day.public.reduce((a, b) => a + b, 0);
      const totalDrivers = Object.values(day.drivers).reduce((a, b) => a + b, 0);
      const totalRoutesOut = Object.values(day.routes_out).reduce((a, b) => a + b, 0);
      const totalRoutesIn = Object.values(day.routes_in).reduce((a, b) => a + b, 0); 
      return (totalPublic + totalDrivers + totalRoutesOut + day.camera_plus) - totalRoutesIn - day.camera_minus;
  };

  const getRowTotal = (category: string, key?: string | number) => {
      return (Object.values(data) as KilosDayData[]).reduce((acc, day) => {
          if (category === 'public' && typeof key === 'number') {
              return acc + (day.public[key] || 0);
          }
          if (category === 'camera_plus') return acc + day.camera_plus;
          if (category === 'camera_minus') return acc + day.camera_minus;
          
          if (category === 'drivers') return acc + (day.drivers[key as string] || 0);
          if (category === 'routes_out') return acc + (day.routes_out[key as string] || 0);
          if (category === 'routes_in') return acc + (day.routes_in[key as string] || 0);
          
          return acc;
      }, 0);
  };

  const grandTotal = (Object.values(data) as KilosDayData[]).reduce((acc, day) => acc + getDayTotal(day), 0);

  const maxPublicRows = React.useMemo(() => {
     const lengths = (Object.values(data) as KilosDayData[]).map(d => d.public.length);
     return Math.max(1, ...lengths);
  }, [data]);

  if (loading) return <div className="text-slate-500 dark:text-slate-400 p-8 animate-pulse text-center">Cargando Tabla de Kilos...</div>;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 sm:p-4 overflow-hidden transition-colors duration-300">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col h-full max-w-full mx-auto w-full transition-colors duration-300">
            
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                <h2 className="text-lg sm:text-xl font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide flex items-center gap-2">
                    Control de Kilos
                </h2>
                <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold mr-2">Neto Semanal</span>
                    <span className="text-xl font-mono font-bold text-slate-800 dark:text-white">{formatNumber(grandTotal)} kg</span>
                </div>
            </div>

            <div className="overflow-auto flex-1 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-20 shadow-sm">
                        <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                            <th className="p-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider min-w-[180px] border-r border-slate-200 dark:border-slate-800 sticky left-0 bg-slate-50 dark:bg-slate-950 z-30 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Categoría</th>
                            {DAYS_OF_WEEK.map(day => (
                                <th key={day.id} className="p-3 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-right min-w-[100px] border-r border-slate-200 dark:border-slate-800/50">
                                    {day.name}
                                </th>
                            ))}
                            <th className="p-3 text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider text-right min-w-[100px] bg-slate-100 dark:bg-slate-900/90">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        
                        {/* --- CÁMARA (Top) --- */}
                        <tr className="bg-slate-100 dark:bg-slate-800/50"><td colSpan={8} className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-900/80 sticky left-0 z-10">Ajustes Cámara</td></tr>
                        
                        {/* Cámara ++ */}
                        <tr className="hover:bg-amber-50 dark:hover:bg-amber-950/10 transition-colors">
                            <td className="p-2 pl-6 text-sm text-amber-700 dark:text-amber-300 font-medium border-r border-slate-200 dark:border-slate-800 sticky left-0 bg-white dark:bg-slate-900 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                Cámara ++
                            </td>
                            {DAYS_OF_WEEK.map(day => (
                                <td key={day.id} className="p-1 border-r border-slate-100 dark:border-slate-800/30">
                                    <InputCell 
                                        value={data[day.id].camera_plus} 
                                        onChange={(v: string) => handleSimpleChange(day.id, 'camera_plus', v)} 
                                        colorClass="text-amber-700 dark:text-amber-200 focus:border-amber-500"
                                    />
                                </td>
                            ))}
                            <td className="p-2 text-right font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/20">
                                {formatNumber(getRowTotal('camera_plus'))}
                            </td>
                        </tr>

                        {/* Cámara -- */}
                        <tr className="hover:bg-purple-50 dark:hover:bg-purple-950/10 transition-colors">
                            <td className="p-2 pl-6 text-sm text-purple-700 dark:text-purple-300 font-medium border-r border-slate-200 dark:border-slate-800 sticky left-0 bg-white dark:bg-slate-900 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                Cámara --
                            </td>
                            {DAYS_OF_WEEK.map(day => (
                                <td key={day.id} className="p-1 border-r border-slate-100 dark:border-slate-800/30">
                                    <div className="relative">
                                        <InputCell 
                                            value={data[day.id].camera_minus} 
                                            onChange={(v: string) => handleSimpleChange(day.id, 'camera_minus', v)} 
                                            colorClass="text-purple-700 dark:text-purple-200 focus:border-purple-500"
                                        />
                                    </div>
                                </td>
                            ))}
                            <td className="p-2 text-right font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/20">
                                {formatNumber(getRowTotal('camera_minus'))}
                            </td>
                        </tr>

                        <tr className="bg-slate-50 dark:bg-slate-950 h-2"><td colSpan={8}></td></tr>

                        {/* --- PÚBLICO (Dynamic Rows) --- */}
                        <tr className="bg-emerald-50 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/30">
                            <td colSpan={8} className="px-0 py-0 sticky left-0 bg-white dark:bg-slate-900 z-10 p-0 border-r border-slate-200 dark:border-slate-800">
                                <div className="flex items-center justify-between px-3 py-1 bg-slate-100 dark:bg-slate-900/80 w-full">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Público</span>
                                    <button 
                                        onClick={addPublicRow}
                                        className="flex items-center gap-1 text-[10px] bg-emerald-100 dark:bg-emerald-900/50 hover:bg-emerald-200 dark:hover:bg-emerald-800 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/50 transition-colors"
                                    >
                                        <Plus size={10} /> Agregar Fila
                                    </button>
                                </div>
                            </td>
                        </tr>

                        {Array.from({ length: maxPublicRows }).map((_, rowIndex) => (
                            <tr key={`public-row-${rowIndex}`} className="bg-emerald-50/30 dark:bg-emerald-950/5 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors group">
                                <td className="p-2 pl-4 text-sm font-bold text-emerald-700 dark:text-emerald-400 border-r border-slate-200 dark:border-slate-800 sticky left-0 bg-white dark:bg-slate-900 z-10 border-l-4 border-l-transparent group-hover:border-l-emerald-500 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                    <div className="flex items-center justify-between">
                                        <span>Público</span>
                                        <button 
                                            onClick={() => removePublicRow(rowIndex)}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900/20 rounded transition-all"
                                            title="Eliminar fila"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </td>
                                {DAYS_OF_WEEK.map(day => (
                                    <td key={day.id} className="p-1 border-r border-slate-100 dark:border-slate-800/30">
                                        <InputCell 
                                            value={data[day.id].public[rowIndex] || 0} 
                                            onChange={(v: string) => handlePublicRowChange(day.id, rowIndex, v)} 
                                            colorClass="text-emerald-700 dark:text-emerald-300 focus:border-emerald-500"
                                            bgClass="bg-emerald-50/50 dark:bg-slate-900/30"
                                        />
                                    </td>
                                ))}
                                <td className="p-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-300/70 bg-slate-50 dark:bg-slate-900/30">
                                    {formatNumber(getRowTotal('public', rowIndex))}
                                </td>
                            </tr>
                        ))}

                        <tr className="bg-slate-50 dark:bg-slate-950 h-2"><td colSpan={8}></td></tr>

                        {/* --- CHOFERES --- */}
                        <tr className="bg-slate-100 dark:bg-slate-800/50"><td colSpan={8} className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-900/80 sticky left-0 z-10">Clientes</td></tr>
                        {DRIVERS_LIST.map(driver => (
                            <tr key={driver} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="p-2 pl-6 text-sm text-slate-700 dark:text-slate-300 font-medium border-r border-slate-200 dark:border-slate-800 sticky left-0 bg-white dark:bg-slate-900 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                    {driver}
                                </td>
                                {DAYS_OF_WEEK.map(day => (
                                    <td key={day.id} className="p-1 border-r border-slate-100 dark:border-slate-800/30">
                                        <InputCell 
                                            value={data[day.id].drivers[driver]} 
                                            onChange={(v: string) => handleDeepChange(day.id, 'drivers', driver, v)} 
                                            colorClass="text-blue-700 dark:text-blue-200 focus:border-blue-500"
                                        />
                                    </td>
                                ))}
                                <td className="p-2 text-right font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/20">
                                    {formatNumber(getRowTotal('drivers', driver))}
                                </td>
                            </tr>
                        ))}

                        <tr className="bg-slate-50 dark:bg-slate-950 h-2"><td colSpan={8}></td></tr>

                        {/* --- REPARTO ZONAS --- */}
                        <tr className="bg-slate-100 dark:bg-slate-800/50"><td colSpan={8} className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-900/80 sticky left-0 z-10">Zonas (Salidas)</td></tr>
                        {ROUTES_LIST.map(route => (
                            <tr key={`out-${route}`} className="hover:bg-sky-50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="p-2 pl-6 text-sm text-sky-700 dark:text-sky-300 font-medium border-r border-slate-200 dark:border-slate-800 sticky left-0 bg-white dark:bg-slate-900 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                    {route}
                                </td>
                                {DAYS_OF_WEEK.map(day => (
                                    <td key={day.id} className="p-1 border-r border-slate-100 dark:border-slate-800/30">
                                        <InputCell 
                                            value={data[day.id].routes_out[route]} 
                                            onChange={(v: string) => handleDeepChange(day.id, 'routes_out', route, v)} 
                                            colorClass="text-sky-700 dark:text-sky-200 focus:border-sky-500"
                                        />
                                    </td>
                                ))}
                                <td className="p-2 text-right font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/20">
                                    {formatNumber(getRowTotal('routes_out', route))}
                                </td>
                            </tr>
                        ))}

                        <tr className="bg-slate-50 dark:bg-slate-950 h-2"><td colSpan={8}></td></tr>

                        {/* --- DEVOLUCION ZONAS --- */}
                        <tr className="bg-slate-100 dark:bg-slate-800/50"><td colSpan={8} className="px-3 py-1 text-[10px] font-bold text-rose-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-900/80 sticky left-0 z-10">Devoluciones (Entradas)</td></tr>
                        {ROUTES_LIST.map(route => (
                            <tr key={`in-${route}`} className="hover:bg-rose-50 dark:hover:bg-rose-950/10 transition-colors">
                                <td className="p-2 pl-6 text-sm text-rose-700 dark:text-rose-300 font-medium border-r border-slate-200 dark:border-slate-800 sticky left-0 bg-white dark:bg-slate-900 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                    {route}
                                </td>
                                {DAYS_OF_WEEK.map(day => (
                                    <td key={day.id} className="p-1 border-r border-slate-100 dark:border-slate-800/30">
                                        <div className="relative">
                                            <InputCell 
                                                value={data[day.id].routes_in[route]} 
                                                onChange={(v: string) => handleDeepChange(day.id, 'routes_in', route, v)} 
                                                colorClass="text-rose-700 dark:text-rose-300 focus:border-rose-500"
                                                bgClass="bg-rose-50/50 dark:bg-rose-950/20"
                                            />
                                            {data[day.id].routes_in[route] > 0 && <span className="absolute left-1 top-1 text-rose-600 text-[10px] font-bold">-</span>}
                                        </div>
                                    </td>
                                ))}
                                <td className="p-2 text-right font-mono text-rose-600 dark:text-rose-400 bg-slate-50 dark:bg-slate-900/20">
                                    - {formatNumber(getRowTotal('routes_in', route))}
                                </td>
                            </tr>
                        ))}

                    </tbody>
                    <tfoot className="sticky bottom-0 z-20 shadow-[0_-5px_10px_rgba(0,0,0,0.1)] dark:shadow-[0_-5px_10px_rgba(0,0,0,0.3)]">
                         <tr className="bg-slate-100 dark:bg-slate-900 font-bold border-t border-slate-300 dark:border-slate-700">
                            <td className="p-4 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider sticky left-0 bg-slate-100 dark:bg-slate-900 border-r border-slate-300 dark:border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Total Neto Día</td>
                            {DAYS_OF_WEEK.map(day => {
                                const total = getDayTotal(data[day.id]);
                                return (
                                    <td key={day.id} className={`p-4 text-right font-mono text-base border-r border-slate-200 dark:border-slate-800/50 ${total < 0 ? 'text-rose-600 dark:text-rose-500' : 'text-slate-800 dark:text-white'}`}>
                                        {formatNumber(total)}
                                    </td>
                                );
                            })}
                            <td className="p-4 text-right font-mono text-orange-600 dark:text-orange-400 text-lg bg-slate-200 dark:bg-slate-900/90">
                                {formatNumber(grandTotal)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    </div>
  );
};