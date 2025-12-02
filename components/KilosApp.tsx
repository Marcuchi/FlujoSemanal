
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
  
  // Standard Days
  DAYS_OF_WEEK.forEach((day) => {
    state[day.id] = {
      id: day.id,
      public: [],
      drivers: DRIVERS_LIST.reduce((acc, curr) => ({ ...acc, [curr]: 0 }), {}),
      drivers_in: DRIVERS_LIST.reduce((acc, curr) => ({ ...acc, [curr]: 0 }), {}),
      routes_out: ROUTES_LIST.reduce((acc, curr) => ({ ...acc, [curr]: 0 }), {}),
      routes_in: ROUTES_LIST.reduce((acc, curr) => ({ ...acc, [curr]: 0 }), {}),
      camera_plus: 0,
      camera_minus: 0
    };
  });

  // Next Monday Column (stored as a pseudo-day 'next_monday')
  state['next_monday'] = {
      id: 'next_monday',
      public: [],
      drivers: DRIVERS_LIST.reduce((acc, curr) => ({ ...acc, [curr]: 0 }), {}),
      drivers_in: DRIVERS_LIST.reduce((acc, curr) => ({ ...acc, [curr]: 0 }), {}),
      routes_out: ROUTES_LIST.reduce((acc, curr) => ({ ...acc, [curr]: 0 }), {}),
      routes_in: ROUTES_LIST.reduce((acc, curr) => ({ ...acc, [curr]: 0 }), {}),
      camera_plus: 0,
      camera_minus: 0
  };

  return state;
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('es-AR').format(value);
};

interface InputCellProps {
  value?: number;
  onChange: (val: string) => void;
  colorClass?: string;
  bgClass?: string; // Additional override if needed
}

const InputCell: React.FC<InputCellProps> = ({ 
  value, 
  onChange, 
  colorClass = "text-slate-200 focus:border-blue-500",
  bgClass = "" 
}) => (
    <input 
        type="number" 
        value={(value ?? 0) === 0 ? '' : value}
        onChange={(e) => onChange(e.target.value)}
        placeholder=""
        className={`w-full bg-transparent border border-transparent hover:border-slate-400 focus:border-blue-500/50 rounded-sm px-1 py-1 text-center ${colorClass} focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all font-mono text-sm h-full ${bgClass}`}
    />
);

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
          
          const keys = [...DAYS_OF_WEEK.map(d => d.id), 'next_monday'];

          keys.forEach(dayId => {
            const d = val[dayId] || {};
            merged[dayId] = {
              id: dayId,
              public: Array.isArray(d.public) ? d.public : [],
              drivers: { ...initial[dayId].drivers, ...(d.drivers || {}) },
              drivers_in: { ...initial[dayId].drivers_in, ...(d.drivers_in || {}) },
              routes_out: { ...initial[dayId].routes_out, ...(d.routes_out || {}) },
              routes_in: { ...initial[dayId].routes_in, ...(d.routes_in || {}) },
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

  const handleDeepChange = (dayId: string, category: 'drivers' | 'drivers_in' | 'routes_out' | 'routes_in', key: string, value: string) => {
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

  // Public Row Handlers
  const handlePublicRowChange = (dayId: string, index: number, value: string) => {
      const num = parseFloat(value) || 0;
      const currentList = [...data[dayId].public];
      // Pad array if needed
      while (currentList.length <= index) currentList.push(0);
      currentList[index] = num;
      
      const updatedDay = { ...data[dayId], public: currentList };
      saveData({ ...data, [dayId]: updatedDay });
  };

  const addPublicRow = () => {
      const newData = { ...data };
      [...DAYS_OF_WEEK.map(d => d.id), 'next_monday'].forEach(dayId => {
          const list = [...newData[dayId].public];
          list.push(0);
          newData[dayId] = { ...newData[dayId], public: list };
      });
      saveData(newData);
  };

  const removePublicRow = (index: number) => {
      const newData = { ...data };
      [...DAYS_OF_WEEK.map(d => d.id), 'next_monday'].forEach(dayId => {
          const list = [...newData[dayId].public];
          list.splice(index, 1);
          newData[dayId] = { ...newData[dayId], public: list };
      });
      saveData(newData);
  };

  // --- Calculations ---

  const getDayTotal = (day: KilosDayData) => {
      const totalPublic = day.public.reduce((a: number, b: number) => a + b, 0);
      
      const totalDriversOut = (Object.values(day.drivers) as number[]).reduce((a: number, b: number) => a + b, 0);
      const totalDriversIn = (Object.values(day.drivers_in || {}) as number[]).reduce((a: number, b: number) => a + b, 0);
      
      const totalRoutesOut = (Object.values(day.routes_out) as number[]).reduce((a: number, b: number) => a + b, 0);
      const totalRoutesIn = (Object.values(day.routes_in) as number[]).reduce((a: number, b: number) => a + b, 0); 
      
      // Total = (Public + DriversOut + RoutesOut + CameraPlus) - (DriversIn + RoutesIn + CameraMinus)
      return (totalPublic + totalDriversOut + totalRoutesOut + day.camera_plus) - (totalDriversIn + totalRoutesIn + day.camera_minus);
  };

  // Helper to get sum of specific column type (Out or In)
  // 'OUT': Public + DriversOut + RoutesOut + CameraPlus
  // 'IN': DriversIn + RoutesIn + CameraMinus (Returned as positive magnitude)
  const getColumnVal = (dayId: string, type: 'OUT' | 'IN' | 'NET') => {
      const day = data[dayId];
      if (!day) return 0;

      if (type === 'NET') return getDayTotal(day);
      
      if (type === 'OUT') {
          const pub = day.public.reduce((a: number, b: number) => a + b, 0);
          const drv = (Object.values(day.drivers) as number[]).reduce((a: number, b: number) => a + b, 0);
          const rts = (Object.values(day.routes_out) as number[]).reduce((a: number, b: number) => a + b, 0);
          return pub + drv + rts + day.camera_plus;
      } else {
          const drv = (Object.values(day.drivers_in || {}) as number[]).reduce((a: number, b: number) => a + b, 0);
          const rts = (Object.values(day.routes_in) as number[]).reduce((a: number, b: number) => a + b, 0);
          return drv + rts + day.camera_minus;
      }
  };

  const getRowTotal = (category: string, key?: string | number) => {
      // Only sum Mon-Sat for the grand total row, ignore next_monday
      return (Object.values(data) as KilosDayData[])
          .filter(d => d.id !== 'next_monday')
          .reduce((acc: number, day: KilosDayData) => {
              if (category === 'public' && typeof key === 'number') {
                  return acc + (day.public[key] || 0);
              }
              if (category === 'camera_plus') return acc + day.camera_plus;
              if (category === 'camera_minus') return acc + day.camera_minus;
              
              if (category === 'drivers_out') return acc + (day.drivers[key as string] || 0);
              if (category === 'drivers_in') return acc + (day.drivers_in?.[key as string] || 0);
              
              if (category === 'routes_out') return acc + (day.routes_out[key as string] || 0);
              if (category === 'routes_in') return acc + (day.routes_in[key as string] || 0);
              
              return acc;
          }, 0);
  };

  const grandTotal = (Object.values(data) as KilosDayData[])
    .filter(d => d.id !== 'next_monday')
    .reduce((acc, day) => acc + getDayTotal(day), 0);

  // Determine how many public rows to render (max of all days including next mon)
  const maxPublicRows = React.useMemo(() => {
     const lengths = (Object.values(data) as KilosDayData[]).map(d => d.public.length);
     return Math.max(1, ...lengths);
  }, [data]);

  // STYLES
  const COL_HIGHLIGHT = "bg-slate-800";
  const COL_STANDARD = "bg-slate-900";
  
  // Stronger borders
  const BORDER_CLASS = "border-r border-slate-500";

  if (loading) return <div className="text-white p-8 animate-pulse">Cargando Tabla de Kilos...</div>;

  return (
    <div className="flex flex-col h-full bg-slate-950 p-2 sm:p-4 overflow-hidden">
        <div className="bg-slate-900 rounded-xl border border-slate-500 shadow-2xl overflow-hidden flex flex-col h-full max-w-full mx-auto w-full">
            
            <div className="p-4 border-b border-slate-500 bg-slate-900/50 flex justify-between items-center">
                <h2 className="text-lg sm:text-xl font-bold text-orange-400 uppercase tracking-wide flex items-center gap-2">
                    Control de Kilos
                </h2>
                <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-500 shadow-lg">
                    <span className="text-xs text-slate-400 uppercase font-bold mr-2">Neto Semanal</span>
                    <span className="text-xl font-mono font-bold text-white">{formatNumber(grandTotal)} kg</span>
                </div>
            </div>

            <div className="overflow-auto flex-1 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-30 shadow-md">
                        <tr className="bg-slate-950 border-b border-slate-500">
                            <th className={`p-3 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[150px] ${BORDER_CLASS} sticky left-0 bg-slate-900 z-40`}>Categoría</th>
                            
                            {/* Lunes (Standard) */}
                            <th className={`p-2 text-xs font-bold text-slate-300 uppercase text-center ${BORDER_CLASS} bg-slate-900 min-w-[80px]`}>
                                Lunes
                            </th>

                            {/* Martes - Sabado (Double Columns) */}
                            {DAYS_OF_WEEK.slice(1).map(day => (
                                <React.Fragment key={day.id}>
                                    {/* Col 1: Highlighted (Salida) */}
                                    <th className={`p-2 text-xs font-bold text-slate-300 uppercase text-center ${BORDER_CLASS} min-w-[80px] ${COL_HIGHLIGHT}`}>
                                        {day.name}
                                    </th>
                                    {/* Col 2: Standard (Entrada) */}
                                    <th className={`p-2 text-xs font-bold text-slate-300 uppercase text-center ${BORDER_CLASS} min-w-[80px] ${COL_STANDARD}`}>
                                        {day.name}
                                    </th>
                                </React.Fragment>
                            ))}

                            {/* Lunes Next (Highlighted) */}
                            <th className={`p-2 text-xs font-bold text-slate-300 uppercase text-center ${BORDER_CLASS} min-w-[80px] ${COL_HIGHLIGHT}`}>
                                Lunes
                            </th>
                            
                            <th className="p-3 text-xs font-bold text-orange-400 uppercase tracking-wider text-right min-w-[80px] bg-slate-900/90 z-40 sticky right-0">Total</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y divide-slate-500`}>
                        
                        {/* --- CÁMARA (Top) --- */}
                        <tr className="bg-slate-800/50"><td colSpan={14} className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900/80 sticky left-0">Ajustes Cámara</td></tr>
                        
                        {/* Cámara ++ (OUT columns only: Lunes, Col 1, Next Mon) */}
                        <tr className="hover:bg-amber-950/10 transition-colors">
                            <td className={`p-2 pl-4 text-sm text-amber-300 font-medium ${BORDER_CLASS} sticky left-0 bg-slate-900 z-20`}>
                                Cámara ++
                            </td>
                            {/* Lunes */}
                            <td className={`${BORDER_CLASS} ${COL_STANDARD}`}>
                                <InputCell value={data['monday'].camera_plus} onChange={(v) => handleSimpleChange('monday', 'camera_plus', v)} colorClass="text-amber-200" />
                            </td>
                            {/* Tue-Sat */}
                            {DAYS_OF_WEEK.slice(1).map(day => (
                                <React.Fragment key={day.id}>
                                    <td className={`${BORDER_CLASS} ${COL_HIGHLIGHT}`}>
                                        <InputCell value={data[day.id].camera_plus} onChange={(v) => handleSimpleChange(day.id, 'camera_plus', v)} colorClass="text-amber-200" />
                                    </td>
                                    <td className={`${BORDER_CLASS} ${COL_STANDARD}`}>
                                        <div className="w-full h-full bg-slate-900/30 border-transparent"></div>
                                    </td>
                                </React.Fragment>
                            ))}
                            {/* Next Mon */}
                            <td className={`${BORDER_CLASS} ${COL_HIGHLIGHT}`}>
                                <InputCell value={data['next_monday'].camera_plus} onChange={(v) => handleSimpleChange('next_monday', 'camera_plus', v)} colorClass="text-slate-400" />
                            </td>
                            
                            <td className="p-2 text-right font-mono text-slate-400 bg-slate-900/20 sticky right-0 z-20">
                                {formatNumber(getRowTotal('camera_plus'))}
                            </td>
                        </tr>

                        {/* Cámara -- (IN columns only: Lunes, Col 2, Next Mon) */}
                        <tr className="hover:bg-purple-950/10 transition-colors">
                            <td className={`p-2 pl-4 text-sm text-purple-300 font-medium ${BORDER_CLASS} sticky left-0 bg-slate-900 z-20`}>
                                Cámara --
                            </td>
                            {/* Lunes (ENABLED NOW) */}
                            <td className={`${BORDER_CLASS} ${COL_STANDARD}`}>
                                <InputCell value={data['monday'].camera_minus} onChange={(v) => handleSimpleChange('monday', 'camera_minus', v)} colorClass="text-purple-200" />
                            </td>
                            {/* Tue-Sat (Col 1 Blocked, Col 2 Enabled) */}
                            {DAYS_OF_WEEK.slice(1).map(day => (
                                <React.Fragment key={day.id}>
                                    <td className={`${BORDER_CLASS} ${COL_HIGHLIGHT}`}>
                                         <div className="w-full h-full bg-slate-900/30 border-transparent"></div>
                                    </td>
                                    <td className={`${BORDER_CLASS} ${COL_STANDARD}`}>
                                         <InputCell value={data[day.id].camera_minus} onChange={(v) => handleSimpleChange(day.id, 'camera_minus', v)} colorClass="text-purple-200" />
                                    </td>
                                </React.Fragment>
                            ))}
                            {/* Next Mon (ENABLED NOW) */}
                            <td className={`${BORDER_CLASS} ${COL_HIGHLIGHT}`}>
                                <InputCell value={data['next_monday'].camera_minus} onChange={(v) => handleSimpleChange('next_monday', 'camera_minus', v)} colorClass="text-slate-400" />
                            </td>

                            <td className="p-2 text-right font-mono text-slate-400 bg-slate-900/20 sticky right-0 z-20">
                                {formatNumber(getRowTotal('camera_minus'))}
                            </td>
                        </tr>

                        {/* Spacer */}
                        <tr className="bg-slate-950 h-2"><td colSpan={14}></td></tr>

                        {/* --- PÚBLICO (OUT columns only) --- */}
                        <tr className="bg-emerald-950/20 border-b border-emerald-900/30">
                            <td colSpan={14} className={`px-0 py-0 sticky left-0 bg-slate-900 z-20 p-0 ${BORDER_CLASS}`}>
                                <div className="flex items-center justify-between px-3 py-1 bg-slate-900/80 w-full min-w-[150px]">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Público</span>
                                    <button onClick={addPublicRow} className="flex items-center gap-1 text-[10px] bg-emerald-900/50 hover:bg-emerald-800 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800/50 transition-colors"><Plus size={10} /> Agregar</button>
                                </div>
                            </td>
                        </tr>

                        {Array.from({ length: maxPublicRows }).map((_, rowIndex) => (
                            <tr key={`public-row-${rowIndex}`} className="bg-emerald-950/5 hover:bg-emerald-900/10 transition-colors group">
                                <td className={`p-2 pl-4 text-sm font-bold text-emerald-400 ${BORDER_CLASS} sticky left-0 bg-slate-900 z-20 border-l-4 border-l-emerald-500/0`}>
                                    <div className="flex items-center justify-between group-hover:border-l-emerald-500">
                                        <span>Público</span>
                                        <button onClick={() => removePublicRow(rowIndex)} className="opacity-0 group-hover:opacity-100 p-1 text-rose-500 hover:text-rose-300 hover:bg-rose-900/20 rounded transition-all"><Trash2 size={12} /></button>
                                    </div>
                                </td>
                                
                                {/* Lunes */}
                                <td className={`${BORDER_CLASS} ${COL_STANDARD}`}>
                                    <InputCell value={data['monday'].public[rowIndex] || 0} onChange={(v) => handlePublicRowChange('monday', rowIndex, v)} colorClass="text-emerald-300" />
                                </td>

                                {/* Tue-Sat */}
                                {DAYS_OF_WEEK.slice(1).map(day => (
                                    <React.Fragment key={day.id}>
                                        <td className={`${BORDER_CLASS} ${COL_HIGHLIGHT}`}>
                                             <InputCell value={data[day.id].public[rowIndex] || 0} onChange={(v) => handlePublicRowChange(day.id, rowIndex, v)} colorClass="text-emerald-300" />
                                        </td>
                                        <td className={`${BORDER_CLASS} ${COL_STANDARD}`}>
                                            <div className="w-full h-full bg-slate-900/10"></div>
                                        </td>
                                    </React.Fragment>
                                ))}
                                
                                {/* Next Mon */}
                                <td className={`${BORDER_CLASS} ${COL_HIGHLIGHT}`}>
                                    <InputCell value={data['next_monday'].public[rowIndex] || 0} onChange={(v) => handlePublicRowChange('next_monday', rowIndex, v)} colorClass="text-slate-400" />
                                </td>

                                <td className="p-2 text-right font-mono font-bold text-emerald-300/70 bg-slate-900/30 sticky right-0 z-20">
                                    {formatNumber(getRowTotal('public', rowIndex))}
                                </td>
                            </tr>
                        ))}

                        {/* Spacer */}
                        <tr className="bg-slate-950 h-2"><td colSpan={14}></td></tr>

                        {/* --- CHOFERES - REPARTO ONLY (OUT columns only) --- */}
                        <tr className="bg-slate-800/50"><td colSpan={14} className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900/80 sticky left-0 border-l-4 border-l-blue-500">Choferes - Reparto</td></tr>
                        {DRIVERS_LIST.map(driver => (
                            <tr key={`out-${driver}`} className="hover:bg-slate-800/30 transition-colors">
                                <td className={`p-2 pl-4 text-sm text-slate-300 font-medium ${BORDER_CLASS} sticky left-0 bg-slate-900 z-20`}>
                                    {driver}
                                </td>
                                
                                {/* Lunes (Out) */}
                                <td className={`${BORDER_CLASS} ${COL_STANDARD}`}>
                                    <InputCell value={data['monday'].drivers[driver]} onChange={(v) => handleDeepChange('monday', 'drivers', driver, v)} colorClass="text-blue-200" />
                                </td>

                                {/* Tue-Sat (Out | Empty In) */}
                                {DAYS_OF_WEEK.slice(1).map(day => (
                                    <React.Fragment key={day.id}>
                                        <td className={`${BORDER_CLASS} ${COL_HIGHLIGHT}`}>
                                            <InputCell value={data[day.id].drivers[driver]} onChange={(v) => handleDeepChange(day.id, 'drivers', driver, v)} colorClass="text-blue-200" />
                                        </td>
                                        <td className={`${BORDER_CLASS} ${COL_STANDARD}`}>
                                            <div className="w-full h-full bg-slate-900/10"></div>
                                        </td>
                                    </React.Fragment>
                                ))}

                                {/* Next Mon (Out) */}
                                <td className={`${BORDER_CLASS} ${COL_HIGHLIGHT}`}>
                                    <InputCell value={data['next_monday'].drivers[driver]} onChange={(v) => handleDeepChange('next_monday', 'drivers', driver, v)} colorClass="text-slate-400" />
                                </td>

                                <td className="p-2 text-right font-mono text-slate-400 bg-slate-900/20 sticky right-0 z-20">
                                    {formatNumber(getRowTotal('drivers_out', driver))}
                                </td>
                            </tr>
                        ))}

                        <tr className="bg-slate-950 h-2"><td colSpan={14}></td></tr>

                        {/* --- CHOFERES - DEVOLUCIÓN (IN) - NEW SECTION --- */}
                        <tr className="bg-slate-800/50"><td colSpan={14} className="px-3 py-1 text-[10px] font-bold text-rose-500 uppercase tracking-widest bg-slate-900/80 sticky left-0 border-l-4 border-l-rose-500">Choferes - Devolución</td></tr>
                        {DRIVERS_LIST.map(driver => (
                            <tr key={`in-${driver}`} className="hover:bg-rose-950/5 transition-colors">
                                <td className={`p-2 pl-4 text-sm text-rose-300 font-medium ${BORDER_CLASS} sticky left-0 bg-slate-900 z-20`}>{driver}</td>
                                
                                {/* Lunes (ENABLED NOW) */}
                                <td className={`${BORDER_CLASS} ${COL_STANDARD}`}><InputCell value={data['monday'].drivers_in?.[driver]} onChange={(v) => handleDeepChange('monday', 'drivers_in', driver, v)} colorClass="text-rose-300" bgClass="bg-rose-950/20" /></td>
                                
                                {/* Tue-Sat (Col 1 Blocked, Col 2 Enabled) */}
                                {DAYS_OF_WEEK.slice(1).map(day => (
                                    <React.Fragment key={day.id}>
                                        <td className={`${BORDER_CLASS} ${COL_HIGHLIGHT}`}><div className="w-full h-full bg-slate-900/10"></div></td>
                                        <td className={`${BORDER_CLASS} ${COL_STANDARD}`}><InputCell value={data[day.id].drivers_in?.[driver]} onChange={(v) => handleDeepChange(day.id, 'drivers_in', driver, v)} colorClass="text-rose-300" bgClass="bg-rose-950/20" /></td>
                                    </React.Fragment>
                                ))}
                                
                                {/* Next Mon (ENABLED NOW) */}
                                <td className={`${BORDER_CLASS} ${COL_HIGHLIGHT}`}><InputCell value={data['next_monday'].drivers_in?.[driver]} onChange={(v) => handleDeepChange('next_monday', 'drivers_in', driver, v)} colorClass="text-slate-400" /></td>
                                
                                <td className="p-2 text-right font-mono text-rose-400/70 bg-slate-900/20 sticky right-0 z-20">-{formatNumber(getRowTotal('drivers_in', driver))}</td>
                            </tr>
                        ))}

                        <tr className="bg-slate-950 h-2"><td colSpan={14}></td></tr>

                        {/* --- ZONAS REPARTO (OUT columns only) --- */}
                        <tr className="bg-slate-800/50"><td colSpan={14} className="px-3 py-1 text-[10px] font-bold text-sky-500 uppercase tracking-widest bg-slate-900/80 sticky left-0 border-l-4 border-l-sky-500">Zonas - Reparto</td></tr>
                        {ROUTES_LIST.map(route => (
                            <tr key={`out-${route}`} className="hover:bg-slate-800/30 transition-colors">
                                <td className={`p-2 pl-4 text-sm text-sky-300 font-medium ${BORDER_CLASS} sticky left-0 bg-slate-900 z-20`}>{route}</td>
                                
                                {/* Lunes */}
                                <td className={`${BORDER_CLASS} ${COL_STANDARD}`}><InputCell value={data['monday'].routes_out[route]} onChange={(v) => handleDeepChange('monday', 'routes_out', route, v)} colorClass="text-sky-200" /></td>
                                
                                {/* Tue-Sat */}
                                {DAYS_OF_WEEK.slice(1).map(day => (
                                    <React.Fragment key={day.id}>
                                        <td className={`${BORDER_CLASS} ${COL_HIGHLIGHT}`}><InputCell value={data[day.id].routes_out[route]} onChange={(v) => handleDeepChange(day.id, 'routes_out', route, v)} colorClass="text-sky-200" /></td>
                                        <td className={`${BORDER_CLASS} ${COL_STANDARD}`}><div className="w-full h-full bg-slate-900/10"></div></td>
                                    </React.Fragment>
                                ))}
                                
                                {/* Next Mon */}
                                <td className={`${BORDER_CLASS} ${COL_HIGHLIGHT}`}><InputCell value={data['next_monday'].routes_out[route]} onChange={(v) => handleDeepChange('next_monday', 'routes_out', route, v)} colorClass="text-slate-400" /></td>
                                
                                <td className="p-2 text-right font-mono text-sky-400/70 bg-slate-900/20 sticky right-0 z-20">{formatNumber(getRowTotal('routes_out', route))}</td>
                            </tr>
                        ))}

                        <tr className="bg-slate-950 h-2"><td colSpan={14}></td></tr>

                        {/* --- ZONAS DEVOLUCIÓN (IN columns only) --- */}
                        <tr className="bg-slate-800/50"><td colSpan={14} className="px-3 py-1 text-[10px] font-bold text-rose-500 uppercase tracking-widest bg-slate-900/80 sticky left-0 border-l-4 border-l-rose-500">Zonas - Devolución</td></tr>
                        {ROUTES_LIST.map(route => (
                            <tr key={`in-${route}`} className="hover:bg-rose-950/5 transition-colors">
                                <td className={`p-2 pl-4 text-sm text-rose-300 font-medium ${BORDER_CLASS} sticky left-0 bg-slate-900 z-20`}>{route}</td>
                                
                                {/* Lunes (ENABLED NOW) */}
                                <td className={`${BORDER_CLASS} ${COL_STANDARD}`}><InputCell value={data['monday'].routes_in[route]} onChange={(v) => handleDeepChange('monday', 'routes_in', route, v)} colorClass="text-rose-300" bgClass="bg-rose-950/20" /></td>
                                
                                {/* Tue-Sat */}
                                {DAYS_OF_WEEK.slice(1).map(day => (
                                    <React.Fragment key={day.id}>
                                        <td className={`${BORDER_CLASS} ${COL_HIGHLIGHT}`}><div className="w-full h-full bg-slate-900/10"></div></td>
                                        <td className={`${BORDER_CLASS} ${COL_STANDARD}`}><InputCell value={data[day.id].routes_in[route]} onChange={(v) => handleDeepChange(day.id, 'routes_in', route, v)} colorClass="text-rose-300" bgClass="bg-rose-950/20" /></td>
                                    </React.Fragment>
                                ))}
                                
                                {/* Next Mon (ENABLED NOW) */}
                                <td className={`${BORDER_CLASS} ${COL_HIGHLIGHT}`}><InputCell value={data['next_monday'].routes_in[route]} onChange={(v) => handleDeepChange('next_monday', 'routes_in', route, v)} colorClass="text-slate-400" /></td>
                                
                                <td className="p-2 text-right font-mono text-rose-400/70 bg-slate-900/20 sticky right-0 z-20">-{formatNumber(getRowTotal('routes_in', route))}</td>
                            </tr>
                        ))}

                    </tbody>
                    <tfoot className="sticky bottom-0 z-40 shadow-[0_-5px_10px_rgba(0,0,0,0.3)]">
                         <tr className="bg-slate-900 font-bold border-t border-slate-700">
                            <td className={`p-4 text-slate-400 text-xs uppercase tracking-wider sticky left-0 bg-slate-900 ${BORDER_CLASS} z-50`}>
                                Sumatoria Pares
                            </td>
                            
                            {/* Par 1: Lunes + Martes(Out) */}
                            <td colSpan={2} className={`p-2 text-center font-mono text-base ${BORDER_CLASS} border-slate-800/50 text-white`}>
                                {formatNumber(getColumnVal('monday', 'NET') + getColumnVal('tuesday', 'OUT'))}
                            </td>

                            {/* Par 2: Martes(In) + Miercoles(Out) */}
                            <td colSpan={2} className={`p-2 text-center font-mono text-base ${BORDER_CLASS} border-slate-800/50 text-white`}>
                                {formatNumber(getColumnVal('tuesday', 'IN') + getColumnVal('wednesday', 'OUT'))}
                            </td>

                            {/* Par 3: Miercoles(In) + Jueves(Out) */}
                            <td colSpan={2} className={`p-2 text-center font-mono text-base ${BORDER_CLASS} border-slate-800/50 text-white`}>
                                {formatNumber(getColumnVal('wednesday', 'IN') + getColumnVal('thursday', 'OUT'))}
                            </td>

                            {/* Par 4: Jueves(In) + Viernes(Out) */}
                            <td colSpan={2} className={`p-2 text-center font-mono text-base ${BORDER_CLASS} border-slate-800/50 text-white`}>
                                {formatNumber(getColumnVal('thursday', 'IN') + getColumnVal('friday', 'OUT'))}
                            </td>

                            {/* Par 5: Viernes(In) + Sabado(Out) */}
                            <td colSpan={2} className={`p-2 text-center font-mono text-base ${BORDER_CLASS} border-slate-800/50 text-white`}>
                                {formatNumber(getColumnVal('friday', 'IN') + getColumnVal('saturday', 'OUT'))}
                            </td>
                            
                            {/* Par 6: Sabado(In) + NextMon(Out) */}
                            <td colSpan={2} className={`p-2 text-center font-mono text-base ${BORDER_CLASS} border-slate-800/50 text-white`}>
                                {formatNumber(getColumnVal('saturday', 'IN') + getColumnVal('next_monday', 'NET'))}
                            </td>

                            <td className="p-4 text-right font-mono text-orange-400 text-lg bg-slate-900/90 sticky right-0 z-50">
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
