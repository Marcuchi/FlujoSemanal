
import React from 'react';
import { ref, onValue, set } from 'firebase/database';
import { Database } from 'firebase/database';
import { Plus, X, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
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

// --- Subcomponent for Public Cell (List Management) ---
const PublicCell = ({ 
    values = [], 
    onChange 
}: { 
    values: number[], 
    onChange: (newValues: number[]) => void 
}) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [isAdding, setIsAdding] = React.useState(false);
    const [tempValue, setTempValue] = React.useState('');
    const inputRef = React.useRef<HTMLInputElement>(null);

    const total = values.reduce((acc, curr) => acc + curr, 0);

    const handleAdd = () => {
        const val = parseFloat(tempValue);
        if (!isNaN(val) && val !== 0) {
            onChange([...values, val]);
            setTempValue('');
            setIsAdding(false);
        } else {
            setIsAdding(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleAdd();
        if (e.key === 'Escape') setIsAdding(false);
    };

    const handleDelete = (index: number) => {
        const newValues = [...values];
        newValues.splice(index, 1);
        onChange(newValues);
    };

    return (
        <div className="relative h-full min-h-[40px] flex items-center justify-end px-2 group">
            {/* Display Total */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="font-mono font-bold text-emerald-300 hover:text-emerald-100 mr-2 text-right w-full"
            >
                {formatNumber(total)}
            </button>

            {/* Quick Add Button */}
            <button 
                onClick={() => { setIsAdding(true); setTimeout(() => inputRef.current?.focus(), 50); }}
                className="p-1 rounded bg-emerald-900/50 text-emerald-400 hover:bg-emerald-800 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <Plus size={12} />
            </button>

            {/* Add Input Popup */}
            {isAdding && (
                <div className="absolute right-0 top-0 z-20 flex items-center bg-slate-800 rounded border border-emerald-500 shadow-lg p-1">
                    <input
                        ref={inputRef}
                        type="number"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleAdd} // Auto save on blur
                        className="w-16 bg-slate-900 text-white text-xs p-1 rounded border-none outline-none text-right"
                        placeholder="Kg"
                    />
                </div>
            )}

            {/* List Details Popup */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-1 z-30 bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-40 overflow-hidden animate-in fade-in zoom-in duration-100">
                    <div className="bg-slate-900 px-3 py-2 border-b border-slate-700 flex justify-between items-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Detalle</span>
                        <button onClick={() => setIsOpen(false)}><X size={14} className="text-slate-500 hover:text-white"/></button>
                    </div>
                    <div className="max-h-40 overflow-y-auto p-1 custom-scrollbar">
                        {values.length === 0 ? (
                            <div className="text-xs text-slate-500 text-center py-2">Sin registros</div>
                        ) : (
                            values.map((v, i) => (
                                <div key={i} className="flex justify-between items-center px-2 py-1.5 hover:bg-slate-700/50 rounded">
                                    <span className="font-mono text-emerald-300 text-xs">{formatNumber(v)}</span>
                                    <button onClick={() => handleDelete(i)} className="text-rose-400 hover:text-rose-200"><Trash2 size={12}/></button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
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
          // Merge with initial state to ensure all fields exist (in case of schema update)
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

  const handlePublicChange = (dayId: string, newValues: number[]) => {
      const updatedDay = { ...data[dayId], public: newValues };
      saveData({ ...data, [dayId]: updatedDay });
  };

  const handleDeepChange = (dayId: string, category: 'drivers' | 'routes_out' | 'routes_in', key: string, value: string) => {
      const num = parseFloat(value) || 0;
      const updatedCategory = { ...data[dayId][category], [key]: num };
      const updatedDay = { ...data[dayId], [category]: updatedCategory };
      saveData({ ...data, [dayId]: updatedDay });
  };

  const handleSimpleChange = (dayId: string, field: 'camera_plus' | 'camera_minus', value: string) => {
      const num = parseFloat(value) || 0;
      const updatedDay = { ...data[dayId], [field]: num };
      saveData({ ...data, [dayId]: updatedDay });
  };

  // --- Calculations ---

  const getDayTotal = (day: KilosDayData) => {
      const totalPublic = day.public.reduce((a, b) => a + b, 0);
      const totalDrivers = Object.values(day.drivers).reduce((a, b) => a + b, 0);
      const totalRoutesOut = Object.values(day.routes_out).reduce((a, b) => a + b, 0);
      const totalRoutesIn = Object.values(day.routes_in).reduce((a, b) => a + b, 0); // Logic: This should subtract
      
      // Total = (Public + Drivers + Routes Out + Camera Plus) - Routes In - Camera Minus
      return (totalPublic + totalDrivers + totalRoutesOut + day.camera_plus) - totalRoutesIn - day.camera_minus;
  };

  const getRowTotal = (category: string, key?: string) => {
      return (Object.values(data) as KilosDayData[]).reduce((acc, day) => {
          if (category === 'public') {
              return acc + day.public.reduce((a, b) => a + b, 0);
          }
          if (category === 'camera_plus') return acc + day.camera_plus;
          if (category === 'camera_minus') return acc + day.camera_minus;
          
          // For Record types
          if (category === 'drivers') return acc + (day.drivers[key!] || 0);
          if (category === 'routes_out') return acc + (day.routes_out[key!] || 0);
          if (category === 'routes_in') return acc + (day.routes_in[key!] || 0);
          
          return acc;
      }, 0);
  };

  const grandTotal = (Object.values(data) as KilosDayData[]).reduce((acc, day) => acc + getDayTotal(day), 0);

  if (loading) return <div className="text-white p-8 animate-pulse">Cargando Tabla de Kilos...</div>;

  const InputCell = ({ value, onChange, colorClass = "text-slate-200 focus:border-blue-500", bgClass = "bg-slate-900/50" }: any) => (
      <input 
          type="number" 
          value={value === 0 ? '' : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          className={`w-full ${bgClass} border border-slate-700/50 rounded px-2 py-1 text-right ${colorClass} focus:outline-none transition-all font-mono text-sm`}
      />
  );

  return (
    <div className="flex flex-col h-full bg-slate-950 p-2 sm:p-4 overflow-hidden">
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-full max-w-full mx-auto w-full">
            
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                <h2 className="text-lg sm:text-xl font-bold text-orange-400 uppercase tracking-wide flex items-center gap-2">
                    Control de Kilos
                </h2>
                <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 shadow-lg">
                    <span className="text-xs text-slate-400 uppercase font-bold mr-2">Neto Semanal</span>
                    <span className="text-xl font-mono font-bold text-white">{formatNumber(grandTotal)} kg</span>
                </div>
            </div>

            <div className="overflow-auto flex-1 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-20 shadow-md">
                        <tr className="bg-slate-950 border-b border-slate-800">
                            <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[180px] border-r border-slate-800 sticky left-0 bg-slate-950 z-30">Concepto</th>
                            {DAYS_OF_WEEK.map(day => (
                                <th key={day.id} className="p-3 text-xs font-bold text-slate-300 uppercase tracking-wider text-right min-w-[100px] border-r border-slate-800/50">
                                    {day.name}
                                </th>
                            ))}
                            <th className="p-3 text-xs font-bold text-orange-400 uppercase tracking-wider text-right min-w-[100px] bg-slate-900/90">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        
                        {/* --- PÚBLICO (Primera Fila) --- */}
                        <tr className="bg-emerald-950/10 hover:bg-emerald-900/10 transition-colors">
                            <td className="p-3 font-bold text-emerald-400 text-sm border-r border-slate-800 sticky left-0 bg-slate-900 z-10 border-l-4 border-l-emerald-500">
                                Público (Particulares)
                            </td>
                            {DAYS_OF_WEEK.map(day => (
                                <td key={day.id} className="p-1 border-r border-slate-800/30">
                                    <PublicCell 
                                        values={data[day.id].public} 
                                        onChange={(newVal) => handlePublicChange(day.id, newVal)} 
                                    />
                                </td>
                            ))}
                            <td className="p-3 text-right font-mono font-bold text-emerald-300 bg-slate-900/30">
                                {formatNumber(getRowTotal('public'))}
                            </td>
                        </tr>

                        {/* Spacer */}
                        <tr className="bg-slate-950 h-2"><td colSpan={8}></td></tr>

                        {/* --- CHOFERES --- */}
                        <tr className="bg-slate-800/50"><td colSpan={8} className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900/80 sticky left-0">Choferes</td></tr>
                        {DRIVERS_LIST.map(driver => (
                            <tr key={driver} className="hover:bg-slate-800/30 transition-colors">
                                <td className="p-2 pl-6 text-sm text-slate-300 font-medium border-r border-slate-800 sticky left-0 bg-slate-900 z-10">
                                    {driver}
                                </td>
                                {DAYS_OF_WEEK.map(day => (
                                    <td key={day.id} className="p-1 border-r border-slate-800/30">
                                        <InputCell 
                                            value={data[day.id].drivers[driver]} 
                                            onChange={(v: string) => handleDeepChange(day.id, 'drivers', driver, v)} 
                                            colorClass="text-blue-200 focus:border-blue-500"
                                        />
                                    </td>
                                ))}
                                <td className="p-2 text-right font-mono text-slate-400 bg-slate-900/20">
                                    {formatNumber(getRowTotal('drivers', driver))}
                                </td>
                            </tr>
                        ))}

                        {/* Spacer */}
                        <tr className="bg-slate-950 h-2"><td colSpan={8}></td></tr>

                        {/* --- REPARTO ZONAS --- */}
                        <tr className="bg-slate-800/50"><td colSpan={8} className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900/80 sticky left-0">Zonas (Salidas)</td></tr>
                        {ROUTES_LIST.map(route => (
                            <tr key={`out-${route}`} className="hover:bg-slate-800/30 transition-colors">
                                <td className="p-2 pl-6 text-sm text-sky-300 font-medium border-r border-slate-800 sticky left-0 bg-slate-900 z-10">
                                    {route}
                                </td>
                                {DAYS_OF_WEEK.map(day => (
                                    <td key={day.id} className="p-1 border-r border-slate-800/30">
                                        <InputCell 
                                            value={data[day.id].routes_out[route]} 
                                            onChange={(v: string) => handleDeepChange(day.id, 'routes_out', route, v)} 
                                            colorClass="text-sky-200 focus:border-sky-500"
                                        />
                                    </td>
                                ))}
                                <td className="p-2 text-right font-mono text-slate-400 bg-slate-900/20">
                                    {formatNumber(getRowTotal('routes_out', route))}
                                </td>
                            </tr>
                        ))}

                        {/* Spacer */}
                        <tr className="bg-slate-950 h-2"><td colSpan={8}></td></tr>

                        {/* --- DEVOLUCION ZONAS --- */}
                        <tr className="bg-slate-800/50"><td colSpan={8} className="px-3 py-1 text-[10px] font-bold text-rose-500 uppercase tracking-widest bg-slate-900/80 sticky left-0">Devoluciones (Entradas)</td></tr>
                        {ROUTES_LIST.map(route => (
                            <tr key={`in-${route}`} className="hover:bg-rose-950/10 transition-colors">
                                <td className="p-2 pl-6 text-sm text-rose-300 font-medium border-r border-slate-800 sticky left-0 bg-slate-900 z-10">
                                    {route}
                                </td>
                                {DAYS_OF_WEEK.map(day => (
                                    <td key={day.id} className="p-1 border-r border-slate-800/30">
                                        <div className="relative">
                                            <InputCell 
                                                value={data[day.id].routes_in[route]} 
                                                onChange={(v: string) => handleDeepChange(day.id, 'routes_in', route, v)} 
                                                colorClass="text-rose-300 focus:border-rose-500"
                                                bgClass="bg-rose-950/20"
                                            />
                                            {/* Visual indicator of substraction */}
                                            {data[day.id].routes_in[route] > 0 && <span className="absolute left-1 top-1 text-rose-600 text-[10px] font-bold">-</span>}
                                        </div>
                                    </td>
                                ))}
                                <td className="p-2 text-right font-mono text-rose-400 bg-slate-900/20">
                                    - {formatNumber(getRowTotal('routes_in', route))}
                                </td>
                            </tr>
                        ))}

                        {/* Spacer */}
                        <tr className="bg-slate-950 h-2"><td colSpan={8}></td></tr>

                        {/* --- CÁMARA --- */}
                        <tr className="bg-slate-800/50"><td colSpan={8} className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900/80 sticky left-0">Ajustes Cámara</td></tr>
                        
                        {/* Cámara ++ */}
                        <tr className="hover:bg-amber-950/10 transition-colors">
                            <td className="p-2 pl-6 text-sm text-amber-300 font-medium border-r border-slate-800 sticky left-0 bg-slate-900 z-10">
                                Cámara ++ (Agrega)
                            </td>
                            {DAYS_OF_WEEK.map(day => (
                                <td key={day.id} className="p-1 border-r border-slate-800/30">
                                    <InputCell 
                                        value={data[day.id].camera_plus} 
                                        onChange={(v: string) => handleSimpleChange(day.id, 'camera_plus', v)} 
                                        colorClass="text-amber-200 focus:border-amber-500"
                                    />
                                </td>
                            ))}
                            <td className="p-2 text-right font-mono text-slate-400 bg-slate-900/20">
                                {formatNumber(getRowTotal('camera_plus'))}
                            </td>
                        </tr>

                        {/* Cámara -- */}
                        <tr className="hover:bg-purple-950/10 transition-colors">
                            <td className="p-2 pl-6 text-sm text-purple-300 font-medium border-r border-slate-800 sticky left-0 bg-slate-900 z-10">
                                Cámara -- (Resta)
                            </td>
                            {DAYS_OF_WEEK.map(day => (
                                <td key={day.id} className="p-1 border-r border-slate-800/30">
                                    <div className="relative">
                                        <InputCell 
                                            value={data[day.id].camera_minus} 
                                            onChange={(v: string) => handleSimpleChange(day.id, 'camera_minus', v)} 
                                            colorClass="text-purple-200 focus:border-purple-500"
                                        />
                                        {data[day.id].camera_minus > 0 && <span className="absolute left-1 top-1 text-purple-600 text-[10px] font-bold">-</span>}
                                    </div>
                                </td>
                            ))}
                            <td className="p-2 text-right font-mono text-slate-400 bg-slate-900/20">
                                - {formatNumber(getRowTotal('camera_minus'))}
                            </td>
                        </tr>

                    </tbody>
                    <tfoot className="sticky bottom-0 z-20 shadow-[0_-5px_10px_rgba(0,0,0,0.3)]">
                         <tr className="bg-slate-900 font-bold border-t border-slate-700">
                            <td className="p-4 text-slate-400 text-xs uppercase tracking-wider sticky left-0 bg-slate-900 border-r border-slate-800">Total Neto Día</td>
                            {DAYS_OF_WEEK.map(day => {
                                const total = getDayTotal(data[day.id]);
                                return (
                                    <td key={day.id} className={`p-4 text-right font-mono text-base border-r border-slate-800/50 ${total < 0 ? 'text-rose-500' : 'text-white'}`}>
                                        {formatNumber(total)}
                                    </td>
                                );
                            })}
                            <td className="p-4 text-right font-mono text-orange-400 text-lg bg-slate-900/90">
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
