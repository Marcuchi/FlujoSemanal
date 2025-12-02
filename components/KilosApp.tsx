
import React from 'react';
import { ref, onValue, set } from 'firebase/database';
import { Database } from 'firebase/database';
import { Plus, Trash2 } from 'lucide-react';
import { DAYS_OF_WEEK, KilosWeekData, KilosDayData, DRIVERS_LIST, ROUTES_LIST } from '../types';

interface KilosAppProps {
  db: Database | null;
  weekKey: string;
}

// --- CONSTANTS & STYLES ---

const COL_HIGHLIGHT = "bg-slate-800";
const COL_STANDARD = "bg-slate-900";
// Bordes gruesos
const BORDER_CLASS = "border-r border-slate-500";
const ROW_BORDER = "border-b border-slate-500";

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('es-AR').format(value);
};

// --- SUB-COMPONENTS (OUTSIDE TO FIX FOCUS) ---

interface InputCellProps {
  value?: number;
  onChange: (val: string) => void;
  colorClass?: string;
  bgClass?: string; 
}

const InputCell: React.FC<InputCellProps> = React.memo(({ 
  value, 
  onChange, 
  colorClass = "text-slate-200 focus:border-blue-500",
  bgClass = "" 
}) => {
    // Local state to prevent cursor jumping with decimal inputs
    const [localVal, setLocalVal] = React.useState(value === 0 ? '' : value?.toString() || '');

    React.useEffect(() => {
        if (parseFloat(localVal || '0') !== (value || 0)) {
            setLocalVal(value === 0 ? '' : value?.toString() || '');
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (/^[\d.,-]*$/.test(val)) {
            setLocalVal(val);
            const parsed = val.replace(',', '.');
            if (val === '' || val === '-' || !isNaN(parseFloat(parsed))) {
                onChange(parsed);
            }
        }
    };

    return (
        <input 
            type="text" 
            inputMode="decimal"
            value={localVal}
            onChange={handleChange}
            placeholder=""
            className={`w-full bg-transparent border border-transparent hover:border-slate-400 focus:border-blue-500/50 rounded-sm px-1 py-1 text-center ${colorClass} focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all font-mono text-sm h-full ${bgClass}`}
        />
    );
});

interface KilosRowProps {
    label: React.ReactNode; 
    rowType: 'OUT' | 'IN'; 
    dataPath: string[]; // Primary data path
    altDataPath?: string[]; // Alternate path for the "other" column (cross-wiring)
    colorClass: string;
    bgClass?: string;
    onDelete?: () => void;
    renderTotal?: boolean;
    data: KilosWeekData;
    onUpdate: (dayId: string, path: string[], value: string) => void;
}

const KilosRow: React.FC<KilosRowProps> = React.memo(({ 
    label, 
    rowType, 
    dataPath, 
    altDataPath,
    colorClass, 
    bgClass, 
    onDelete, 
    renderTotal = true,
    data,
    onUpdate
}) => {
    
    const getValue = (dayId: string, path: string[]) => {
        const d = data[dayId];
        if (!d || !path) return 0;
        const key1 = path[0];
        
        if (path.length === 1) return (d as any)[key1];
        if (path.length === 2) return (d as any)[key1][path[1]];
        if (path.length === 3) return (d as any)[key1][parseInt(path[2])] || 0;
        return 0;
    };

    const getRowSum = () => {
        const days = (Object.values(data) as KilosDayData[]).filter(d => d.id !== 'next_monday');
        return days.reduce((acc, day) => {
            let val = 0;
            // Sum only the primary dataPath for the row total
            const path = dataPath;
            const key1 = path[0];
            if (path.length === 1) val = (day as any)[key1];
            else if (path.length === 2) val = (day as any)[key1][path[1]];
            else if (path.length === 3) val = (day as any)[key1][parseInt(path[2])] || 0;
            return acc + (val || 0);
        }, 0);
    };

    return (
        <tr className={`hover:bg-slate-800/30 transition-colors ${bgClass || ''}`}>
            <td className={`p-2 pl-4 text-sm font-medium ${BORDER_CLASS} ${ROW_BORDER} sticky left-0 bg-slate-900 z-20 ${colorClass}`}>
                <div className="flex items-center justify-between">
                    {label}
                    {onDelete && (
                        <button onClick={onDelete} className="text-rose-500 hover:text-rose-300 p-1"><Trash2 size={12} /></button>
                    )}
                </div>
            </td>

            {/* LUNES (Single Col) - Uses Main Path */}
            <td className={`${BORDER_CLASS} ${ROW_BORDER} ${COL_STANDARD}`}>
                <InputCell value={getValue('monday', dataPath)} onChange={v => onUpdate('monday', dataPath, v)} colorClass={colorClass} />
            </td>

            {/* MARTES - SABADO (Double Cols) */}
            {DAYS_OF_WEEK.slice(1).map(day => (
                <React.Fragment key={day.id}>
                    {/* Col 1 (Blue/Out) */}
                    <td className={`${BORDER_CLASS} ${ROW_BORDER} ${COL_HIGHLIGHT}`}>
                        {rowType === 'OUT' ? (
                            // Row is OUT, Col is OUT -> Primary
                            <InputCell value={getValue(day.id, dataPath)} onChange={v => onUpdate(day.id, dataPath, v)} colorClass={colorClass} />
                        ) : (
                            // Row is IN, Col is OUT -> Secondary (Alt Path)
                            <InputCell value={getValue(day.id, altDataPath || [])} onChange={v => altDataPath && onUpdate(day.id, altDataPath, v)} colorClass="text-slate-500" />
                        )}
                    </td>
                    {/* Col 2 (Red/In) */}
                    <td className={`${BORDER_CLASS} ${ROW_BORDER} ${COL_STANDARD}`}>
                        {rowType === 'IN' ? (
                            // Row is IN, Col is IN -> Primary
                            <InputCell value={getValue(day.id, dataPath)} onChange={v => onUpdate(day.id, dataPath, v)} colorClass={colorClass} />
                        ) : (
                            // Row is OUT, Col is IN -> Secondary (Alt Path)
                            <InputCell value={getValue(day.id, altDataPath || [])} onChange={v => altDataPath && onUpdate(day.id, altDataPath, v)} colorClass="text-slate-500" />
                        )}
                    </td>
                </React.Fragment>
            ))}

            {/* NEXT MONDAY (Single Col) */}
            <td className={`${BORDER_CLASS} ${ROW_BORDER} ${COL_HIGHLIGHT}`}>
                <InputCell value={getValue('next_monday', dataPath)} onChange={v => onUpdate('next_monday', dataPath, v)} colorClass="text-slate-400" />
            </td>

            {/* TOTAL */}
            <td className={`p-2 text-right font-mono text-slate-400 bg-slate-900/20 sticky right-0 z-20 ${ROW_BORDER}`}>
                {renderTotal && <span>{formatNumber(getRowSum())}</span>}
            </td>
        </tr>
    );
});

// --- MAIN COMPONENT ---

const createInitialKilosState = (): KilosWeekData => {
  const state: KilosWeekData = {};
  [...DAYS_OF_WEEK.map(d => d.id), 'next_monday'].forEach((dayId) => {
    state[dayId] = {
      id: dayId,
      public: [],
      public_in: [],
      drivers: DRIVERS_LIST.reduce((acc, curr) => ({ ...acc, [curr]: 0 }), {}),
      drivers_in: DRIVERS_LIST.reduce((acc, curr) => ({ ...acc, [curr]: 0 }), {}),
      routes_out: ROUTES_LIST.reduce((acc, curr) => ({ ...acc, [curr]: 0 }), {}),
      routes_in: ROUTES_LIST.reduce((acc, curr) => ({ ...acc, [curr]: 0 }), {}),
      camera_plus: 0,
      camera_plus_in: 0,
      camera_minus: 0,
      camera_minus_out: 0
    };
  });
  return state;
};

export const KilosApp: React.FC<KilosAppProps> = ({ db, weekKey }) => {
  const [data, setData] = React.useState<KilosWeekData>(createInitialKilosState());
  const [loading, setLoading] = React.useState(true);

  // --- LOADING & SAVING ---
  
  React.useEffect(() => {
    if (db) {
      setLoading(true);
      const kilosRef = ref(db, `weeks/${weekKey}/kilos`);
      const unsubscribe = onValue(kilosRef, (snapshot) => {
        const val = snapshot.val();
        if (val) {
          const initial = createInitialKilosState();
          const merged: KilosWeekData = {};
          Object.keys(initial).forEach(dayId => {
            const d = val[dayId] || {};
            merged[dayId] = {
              id: dayId,
              public: Array.isArray(d.public) ? d.public : [],
              public_in: Array.isArray(d.public_in) ? d.public_in : [],
              drivers: { ...initial[dayId].drivers, ...(d.drivers || {}) },
              drivers_in: { ...initial[dayId].drivers_in, ...(d.drivers_in || {}) },
              routes_out: { ...initial[dayId].routes_out, ...(d.routes_out || {}) },
              routes_in: { ...initial[dayId].routes_in, ...(d.routes_in || {}) },
              camera_plus: Number(d.camera_plus) || 0,
              camera_plus_in: Number(d.camera_plus_in) || 0,
              camera_minus: Number(d.camera_minus) || 0,
              camera_minus_out: Number(d.camera_minus_out) || 0,
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
        try { setData(JSON.parse(saved)); } catch (e) { setData(createInitialKilosState()); }
      } else {
        setData(createInitialKilosState());
      }
      setLoading(false);
    }
  }, [db, weekKey]);

  const saveData = (newData: KilosWeekData) => {
    if (db) {
      set(ref(db, `weeks/${weekKey}/kilos`), newData);
    } else {
      setData(newData);
      localStorage.setItem(`kilos_${weekKey}`, JSON.stringify(newData));
    }
  };

  const handleUpdate = React.useCallback((dayId: string, path: string[], value: string) => {
      const num = parseFloat(value) || 0;
      
      setData(prevData => {
          const newData = { ...prevData };
          const updatedDay = { ...newData[dayId] };

          const key1 = path[0];
          if (path.length === 1) {
              // @ts-ignore
              updatedDay[key1] = num;
          } else if (path.length === 2) {
              // @ts-ignore
              updatedDay[key1] = { ...updatedDay[key1], [path[1]]: num };
          } else if (path.length === 3) {
              const arrKey = path[0]; 
              const idx = parseInt(path[2]);
              // @ts-ignore
              const newArr = [...(updatedDay[arrKey] || [])];
              while (newArr.length <= idx) newArr.push(0);
              newArr[idx] = num;
              // @ts-ignore
              updatedDay[arrKey] = newArr;
          }
          
          newData[dayId] = updatedDay;
          if (db) set(ref(db, `weeks/${weekKey}/kilos`), newData);
          else localStorage.setItem(`kilos_${weekKey}`, JSON.stringify(newData));

          return newData;
      });
  }, [db, weekKey]);

  const addPublicRow = () => {
      setData(prev => {
          const newData = { ...prev };
          Object.keys(newData).forEach(dayId => {
              newData[dayId] = { 
                  ...newData[dayId], 
                  public: [...newData[dayId].public, 0],
                  public_in: [...(newData[dayId].public_in || []), 0] 
              };
          });
          saveData(newData);
          return newData;
      });
  };

  const removePublicRow = (index: number) => {
      if (window.confirm("¿Eliminar esta fila de público?")) {
        setData(prev => {
            const newData = { ...prev };
            Object.keys(newData).forEach(dayId => {
                const arr = [...newData[dayId].public];
                arr.splice(index, 1);
                
                const arrIn = [...(newData[dayId].public_in || [])];
                arrIn.splice(index, 1);

                newData[dayId] = { ...newData[dayId], public: arr, public_in: arrIn };
            });
            saveData(newData);
            return newData;
        });
      }
  };

  // --- CALCULATIONS ---

  const getDayNet = (dayId: string) => {
      const d = data[dayId];
      if (!d) return 0;
      
      const publicOut = d.public.reduce((a, b) => a + b, 0);
      const publicIn = (d.public_in || []).reduce((a, b) => a + b, 0);
      
      const driversOut = (Object.values(d.drivers) as number[]).reduce((a, b) => a + b, 0);
      const driversIn = (Object.values(d.drivers_in) as number[]).reduce((a, b) => a + b, 0);
      
      const routesOut = (Object.values(d.routes_out) as number[]).reduce((a, b) => a + b, 0);
      const routesIn = (Object.values(d.routes_in) as number[]).reduce((a, b) => a + b, 0);
      
      const camPlus = (d.camera_plus || 0);
      const camPlusIn = (d.camera_plus_in || 0);
      const camMinus = (d.camera_minus || 0);
      const camMinusOut = (d.camera_minus_out || 0);

      // NET = (All Outs) - (All Ins)
      // Outs: public, drivers, routes_out, camera_plus, camera_minus_out
      // Ins: public_in, drivers_in, routes_in, camera_minus, camera_plus_in
      
      const totalOut = publicOut + driversOut + routesOut + camPlus + camMinusOut;
      const totalIn = publicIn + driversIn + routesIn + camMinus + camPlusIn;

      return totalOut - totalIn;
  };

  const getColumnSum = (dayId: string, type: 'OUT' | 'IN') => {
      const d = data[dayId];
      if (!d) return 0;
      if (type === 'OUT') {
          const publicOut = d.public.reduce((a, b) => a + b, 0);
          const driversOut = (Object.values(d.drivers) as number[]).reduce((a, b) => a + b, 0);
          const routesOut = (Object.values(d.routes_out) as number[]).reduce((a, b) => a + b, 0);
          return publicOut + driversOut + routesOut + (d.camera_plus || 0) + (d.camera_minus_out || 0);
      } else {
          const publicIn = (d.public_in || []).reduce((a, b) => a + b, 0);
          const driversIn = (Object.values(d.drivers_in) as number[]).reduce((a, b) => a + b, 0);
          const routesIn = (Object.values(d.routes_in) as number[]).reduce((a, b) => a + b, 0);
          return publicIn + driversIn + routesIn + (d.camera_minus || 0) + (d.camera_plus_in || 0);
      }
  };

  const grandTotal = (Object.values(data) as KilosDayData[])
      .filter(d => d.id !== 'next_monday')
      .reduce((acc, d) => acc + getDayNet(d.id), 0);

  const maxPublicRows = React.useMemo(() => {
      const lengths = (Object.values(data) as KilosDayData[]).map(d => d.public.length);
      return Math.max(1, ...lengths);
  }, [data]);

  if (loading) return <div className="text-white p-8 animate-pulse">Cargando Tabla de Kilos...</div>;

  return (
    <div className="flex flex-col h-full bg-slate-950 p-2 sm:p-4 overflow-hidden">
        <div className="bg-slate-900 rounded-xl border border-slate-500 shadow-2xl overflow-hidden flex flex-col h-full max-w-full mx-auto w-full">
            
            <div className="p-4 border-b border-slate-500 bg-slate-900/50 flex justify-between items-center">
                <h2 className="text-lg sm:text-xl font-bold text-orange-400 uppercase tracking-wide flex items-center gap-2">Control de Kilos</h2>
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
                            <th className={`p-2 text-xs font-bold text-slate-300 uppercase text-center ${BORDER_CLASS} bg-slate-900 min-w-[80px]`}>Lunes</th>
                            {DAYS_OF_WEEK.slice(1).map(day => (
                                <React.Fragment key={day.id}>
                                    <th className={`p-2 text-xs font-bold text-slate-300 uppercase text-center ${BORDER_CLASS} min-w-[80px] ${COL_HIGHLIGHT}`}>{day.name}</th>
                                    <th className={`p-2 text-xs font-bold text-slate-300 uppercase text-center ${BORDER_CLASS} min-w-[80px] ${COL_STANDARD}`}>{day.name}</th>
                                </React.Fragment>
                            ))}
                            <th className={`p-2 text-xs font-bold text-slate-300 uppercase text-center ${BORDER_CLASS} min-w-[80px] ${COL_HIGHLIGHT}`}>Lunes</th>
                            <th className="p-3 text-xs font-bold text-orange-400 uppercase tracking-wider text-right min-w-[80px] bg-slate-900/90 z-40 sticky right-0">Total</th>
                        </tr>
                    </thead>
                    
                    <tbody className={`divide-y divide-slate-500`}>
                        
                        <tr className="bg-slate-800/50"><td colSpan={14} className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900/80 sticky left-0">Ajustes Cámara</td></tr>
                        
                        <KilosRow 
                            label="Cámara ++" 
                            rowType="OUT" 
                            dataPath={['camera_plus']} 
                            altDataPath={['camera_plus_in']} 
                            colorClass="text-amber-200" bgClass="hover:bg-amber-950/10" data={data} onUpdate={handleUpdate} 
                        />
                        <KilosRow 
                            label="Cámara --" 
                            rowType="IN" 
                            dataPath={['camera_minus']} 
                            altDataPath={['camera_minus_out']} 
                            colorClass="text-purple-200" bgClass="hover:bg-purple-950/10" data={data} onUpdate={handleUpdate} 
                        />

                        <tr className="bg-emerald-950/20 border-b border-emerald-900/30">
                            <td colSpan={14} className={`px-0 py-0 sticky left-0 bg-slate-900 z-20 p-0 ${BORDER_CLASS}`}>
                                <div className="flex items-center justify-between px-3 py-1 bg-slate-900/80 w-full min-w-[150px]">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Público</span>
                                    <button onClick={addPublicRow} className="flex items-center gap-1 text-[10px] bg-emerald-900/50 hover:bg-emerald-800 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800/50 transition-colors"><Plus size={10} /> Agregar</button>
                                </div>
                            </td>
                        </tr>
                        {Array.from({ length: maxPublicRows }).map((_, idx) => (
                            <KilosRow 
                                key={`public-${idx}`}
                                label={<span>Público</span>}
                                rowType="OUT"
                                dataPath={['public', 'row', idx.toString()]}
                                altDataPath={['public_in', 'row', idx.toString()]}
                                colorClass="text-emerald-300"
                                bgClass="bg-emerald-950/5 hover:bg-emerald-900/10"
                                onDelete={() => removePublicRow(idx)}
                                data={data} 
                                onUpdate={handleUpdate}
                            />
                        ))}

                        <tr className="bg-slate-950 h-2"><td colSpan={14}></td></tr>

                        <tr className="bg-slate-800/50"><td colSpan={14} className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900/80 sticky left-0 border-l-4 border-l-blue-500">Choferes - Reparto</td></tr>
                        {DRIVERS_LIST.map(driver => (
                            <KilosRow key={`drv-out-${driver}`} label={driver} rowType="OUT" dataPath={['drivers', driver]} altDataPath={['drivers_in', driver]} colorClass="text-blue-200" data={data} onUpdate={handleUpdate} />
                        ))}

                        <tr className="bg-slate-950 h-2"><td colSpan={14}></td></tr>

                        <tr className="bg-slate-800/50"><td colSpan={14} className="px-3 py-1 text-[10px] font-bold text-rose-500 uppercase tracking-widest bg-slate-900/80 sticky left-0 border-l-4 border-l-rose-500">Choferes - Devolución</td></tr>
                        {DRIVERS_LIST.map(driver => (
                            <KilosRow key={`drv-in-${driver}`} label={driver} rowType="IN" dataPath={['drivers_in', driver]} altDataPath={['drivers', driver]} colorClass="text-rose-300" bgClass="hover:bg-rose-950/5" data={data} onUpdate={handleUpdate} />
                        ))}

                        <tr className="bg-slate-950 h-2"><td colSpan={14}></td></tr>

                        <tr className="bg-slate-800/50"><td colSpan={14} className="px-3 py-1 text-[10px] font-bold text-sky-500 uppercase tracking-widest bg-slate-900/80 sticky left-0 border-l-4 border-l-sky-500">Zonas - Reparto</td></tr>
                        {ROUTES_LIST.map(route => (
                            <KilosRow key={`rt-out-${route}`} label={route} rowType="OUT" dataPath={['routes_out', route]} altDataPath={['routes_in', route]} colorClass="text-sky-200" data={data} onUpdate={handleUpdate} />
                        ))}

                        <tr className="bg-slate-950 h-2"><td colSpan={14}></td></tr>

                        <tr className="bg-slate-800/50"><td colSpan={14} className="px-3 py-1 text-[10px] font-bold text-rose-500 uppercase tracking-widest bg-slate-900/80 sticky left-0 border-l-4 border-l-rose-500">Zonas - Devolución</td></tr>
                        {ROUTES_LIST.map(route => (
                            <KilosRow key={`rt-in-${route}`} label={route} rowType="IN" dataPath={['routes_in', route]} altDataPath={['routes_out', route]} colorClass="text-rose-300" bgClass="hover:bg-rose-950/5" data={data} onUpdate={handleUpdate} />
                        ))}

                    </tbody>

                    {/* FOOTER */}
                    <tfoot className="sticky bottom-0 z-40 shadow-[0_-5px_10px_rgba(0,0,0,0.3)]">
                         <tr className="bg-slate-900 font-bold border-t border-slate-700">
                            <td className={`p-4 text-slate-400 text-xs uppercase tracking-wider sticky left-0 bg-slate-900 ${BORDER_CLASS} z-50`}>
                                Sumatoria Pares
                            </td>
                            <td colSpan={2} className={`p-2 text-center font-mono text-base ${BORDER_CLASS} border-slate-800/50 text-white`}>
                                {formatNumber(getDayNet('monday') + getColumnSum('tuesday', 'OUT'))}
                            </td>
                            <td colSpan={2} className={`p-2 text-center font-mono text-base ${BORDER_CLASS} border-slate-800/50 text-white`}>
                                {formatNumber(getColumnSum('tuesday', 'IN') + getColumnSum('wednesday', 'OUT'))}
                            </td>
                            <td colSpan={2} className={`p-2 text-center font-mono text-base ${BORDER_CLASS} border-slate-800/50 text-white`}>
                                {formatNumber(getColumnSum('wednesday', 'IN') + getColumnSum('thursday', 'OUT'))}
                            </td>
                            <td colSpan={2} className={`p-2 text-center font-mono text-base ${BORDER_CLASS} border-slate-800/50 text-white`}>
                                {formatNumber(getColumnSum('thursday', 'IN') + getColumnSum('friday', 'OUT'))}
                            </td>
                            <td colSpan={2} className={`p-2 text-center font-mono text-base ${BORDER_CLASS} border-slate-800/50 text-white`}>
                                {formatNumber(getColumnSum('friday', 'IN') + getColumnSum('saturday', 'OUT'))}
                            </td>
                            <td colSpan={2} className={`p-2 text-center font-mono text-base ${BORDER_CLASS} border-slate-800/50 text-white`}>
                                {formatNumber(getColumnSum('saturday', 'IN') + getDayNet('next_monday'))}
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
