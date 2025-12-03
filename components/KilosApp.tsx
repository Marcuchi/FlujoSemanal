
import React from 'react';
import { ref, onValue, set } from 'firebase/database';
import { Database } from 'firebase/database';
import { KilosWeekData, KILOS_CLIENTS_LIST, KILOS_ZONES_LIST, KILOS_ZONES_DEV_LIST } from '../types';
import { Moon, Sun } from 'lucide-react';

interface KilosAppProps {
  db: Database | null;
  weekKey: string;
}

// --- CONFIGURATION ---

const COLUMNS = [
  { label: 'Lunes' },
  { label: 'Martes' },
  { label: 'Martes' },
  { label: 'Miércoles' },
  { label: 'Miércoles' },
  { label: 'Jueves' },
  { label: 'Jueves' },
  { label: 'Viernes' },
  { label: 'Viernes' },
  { label: 'Sábado' },
  { label: 'Sábado' },
  { label: 'Lunes' },
];

// Styles
const CELL_BORDER = "border-r border-b border-slate-200"; 
const HEADER_CELL = "sticky top-0 z-30 bg-slate-50 text-slate-500 font-semibold text-[10px] sm:text-xs uppercase tracking-wider border-b border-slate-300 shadow-sm";
const STICKY_COL_STYLE = "sticky left-0 z-20 bg-slate-50 border-r border-slate-300 text-slate-700 font-bold text-xs uppercase p-2 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]";
const CELL_INPUT = "w-full h-full bg-transparent text-center text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 font-mono font-medium transition-all";
const TOTAL_CELL = "font-mono font-bold text-center text-xs p-2 border-r border-slate-600 last:border-r-0";

// --- HELPERS ---

const parseVal = (val: string) => {
  if (!val) return 0;
  if (/[a-zA-ZñÑáéíóúÁÉÍÓÚ]/.test(val)) return 0;
  let clean = val.replace(/[^\d.,-]/g, '');
  clean = clean.replace(/\./g, '');
  clean = clean.replace(/,/g, '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

const SeparatorRow = () => (
  <tr>
    <td className="sticky left-0 z-10 bg-slate-100 border-b border-slate-200 h-1 border-r border-slate-300"></td>
    <td colSpan={COLUMNS.length + 2} className="bg-slate-100 border-b border-slate-200 h-1"></td>
  </tr>
);

// --- SUB-COMPONENTS ---

interface TextGridRowProps {
  rowKey: string;
  label: string;
  data: KilosWeekData;
  onUpdate: (rowKey: string, colIndex: number, value: string) => void;
  colorClass?: string;
  blackColumns: boolean[];
}

const TextGridRow: React.FC<TextGridRowProps> = React.memo(({ rowKey, label, data, onUpdate, colorClass, blackColumns }) => {
  const rowValues = data[rowKey] || Array(COLUMNS.length).fill('');
  const totalRow = rowValues.reduce((acc, curr) => acc + parseVal(curr), 0);

  return (
    <tr className="group hover:bg-slate-50 transition-colors">
      {/* Sticky Row Label */}
      <td className={`${STICKY_COL_STYLE} ${CELL_BORDER} ${colorClass || ''}`}>
        <div className="flex items-center h-full truncate">
          {label}
        </div>
      </td>
      
      {/* Input Cells */}
      {COLUMNS.map((col, index) => {
        const isBlack = blackColumns[index];
        return (
          <td 
            key={index} 
            className={`${CELL_BORDER} p-0 h-10 min-w-[70px] relative transition-colors ${isBlack ? 'bg-slate-900' : 'bg-white group-hover:bg-slate-50'}`}
          >
            <input
              type="text"
              value={rowValues[index] || ''}
              onChange={(e) => onUpdate(rowKey, index, e.target.value)}
              className={`${CELL_INPUT} ${isBlack ? 'text-emerald-400 focus:bg-slate-800' : 'text-slate-700 focus:bg-white'}`}
            />
          </td>
        );
      })}

      {/* Spacer */}
      <td className="w-4 bg-slate-100 border-none"></td>

      {/* Row Total Cell */}
      <td className={`${CELL_BORDER} p-0 h-10 min-w-[80px] bg-slate-50`}>
        <div className="w-full h-full flex items-center justify-center text-xs font-mono font-bold text-slate-800">
          {totalRow === 0 ? '-' : new Intl.NumberFormat('es-AR').format(totalRow)}
        </div>
      </td>
    </tr>
  );
});

// --- MAIN COMPONENT ---

export const KilosApp: React.FC<KilosAppProps> = ({ db, weekKey }) => {
  const [data, setData] = React.useState<KilosWeekData>({});
  const [loading, setLoading] = React.useState(true);
  const [blackColumns, setBlackColumns] = React.useState<boolean[]>(Array(COLUMNS.length).fill(false));

  const toggleColumn = (idx: number) => {
    setBlackColumns(prev => {
        const next = [...prev];
        next[idx] = !next[idx];
        return next;
    });
  };

  React.useEffect(() => {
    if (db) {
      setLoading(true);
      const kilosRef = ref(db, `weeks/${weekKey}/kilos_v2`); 
      const unsubscribe = onValue(kilosRef, (snapshot) => {
        const val = snapshot.val();
        if (val) setData(val);
        else setData({});
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      const saved = localStorage.getItem(`kilos_v2_${weekKey}`);
      if (saved) {
        try { setData(JSON.parse(saved)); } catch (e) { setData({}); }
      } else {
        setData({});
      }
      setLoading(false);
    }
  }, [db, weekKey]);

  const saveData = (newData: KilosWeekData) => {
    if (db) {
      set(ref(db, `weeks/${weekKey}/kilos_v2`), newData);
    } else {
      setData(newData);
      localStorage.setItem(`kilos_v2_${weekKey}`, JSON.stringify(newData));
    }
  };

  const handleUpdate = React.useCallback((rowKey: string, colIndex: number, value: string) => {
    setData(prev => {
      const currentRows = prev[rowKey] ? [...prev[rowKey]] : Array(COLUMNS.length).fill('');
      while (currentRows.length < COLUMNS.length) currentRows.push('');
      currentRows[colIndex] = value;
      const newData = { ...prev, [rowKey]: currentRows };
      saveData(newData);
      return newData;
    });
  }, [db, weekKey]);

  // --- TOTALS CALCULATION ---
  const columnTotals = React.useMemo(() => {
      const totals = Array(COLUMNS.length).fill(0);
      const allKeys = [
          'camara_plus', 'camara_minus',
          'public_0', 'public_1', 'public_2', 'public_3',
          ...KILOS_CLIENTS_LIST.map(c => `client_${c}`),
          ...KILOS_ZONES_LIST.map(z => `zone_${z}`),
          ...KILOS_ZONES_DEV_LIST.map(z => `zone_dev_${z}`)
      ];

      allKeys.forEach(key => {
          const row = data[key];
          if (row) {
              row.forEach((val, colIndex) => {
                  if (colIndex < totals.length) {
                      totals[colIndex] += parseVal(val);
                  }
              });
          }
      });
      return totals;
  }, [data]);

  const pairedTotals = React.useMemo(() => {
    const paired = [];
    for (let i = 0; i < columnTotals.length; i += 2) {
      const sum = columnTotals[i] + (columnTotals[i + 1] || 0);
      paired.push(sum);
    }
    return paired;
  }, [columnTotals]);

  const grandTotal = columnTotals.reduce((a, b) => a + b, 0);

  if (loading) return <div className="text-white p-8 animate-pulse text-center">Cargando Planilla...</div>;

  return (
    <div className="flex flex-col h-full bg-slate-950 p-2 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col h-full w-full relative">
        
        {/* Table Header Wrapper */}
        <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center flex-none z-40 relative">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
            Control de Kilos
          </h2>
        </div>

        {/* Scrollable Area */}
        <div className="overflow-auto flex-1 custom-scrollbar bg-slate-50 relative">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th className={`${HEADER_CELL} sticky left-0 z-50 min-w-[140px] bg-slate-100 border-r border-slate-300 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]`}>
                  <div className="h-full flex items-center justify-center p-2">Concepto</div>
                </th>
                {COLUMNS.map((col, idx) => {
                  const isBlack = blackColumns[idx];
                  return (
                    <th 
                      key={idx} 
                      className={`${HEADER_CELL} min-w-[70px] ${isBlack ? '!bg-slate-900 !text-slate-300' : ''}`}
                    >
                      <div className="flex flex-col items-center justify-between py-2 gap-1 h-full">
                         <button 
                          onClick={() => toggleColumn(idx)}
                          className={`p-1 rounded-full transition-all duration-200 ${isBlack ? 'bg-slate-700 text-yellow-400 hover:bg-slate-600' : 'bg-slate-200 text-slate-400 hover:bg-slate-300 hover:text-slate-600'}`}
                          title={isBlack ? "Cambiar a Blanco" : "Cambiar a Negro"}
                        >
                          {isBlack ? <Sun size={12} /> : <Moon size={12} />}
                        </button>
                        <span>{col.label}</span>
                      </div>
                    </th>
                  );
                })}
                
                {/* Spacer Header */}
                <th className="w-4 bg-slate-100 border-b border-slate-300"></th>
                
                {/* Total Header */}
                <th className={`${HEADER_CELL} min-w-[80px] bg-slate-800 text-slate-200 border-l border-slate-700`}>
                  Total
                </th>
              </tr>
            </thead>
            
            <tbody className="bg-white">
              {/* --- CAMARA --- */}
              <TextGridRow rowKey="camara_plus" label="Cámara (+)" data={data} onUpdate={handleUpdate} blackColumns={blackColumns} colorClass="!text-amber-700" />
              <TextGridRow rowKey="camara_minus" label="Cámara (-)" data={data} onUpdate={handleUpdate} blackColumns={blackColumns} colorClass="!text-purple-700" />

              {/* --- PUBLICO --- */}
              <SeparatorRow />
              {[0, 1, 2, 3].map(i => (
                <TextGridRow 
                    key={`public_${i}`} 
                    rowKey={`public_${i}`} 
                    label="Público" 
                    data={data} 
                    onUpdate={handleUpdate}
                    blackColumns={blackColumns} 
                    colorClass="!text-emerald-700" 
                />
              ))}

              {/* --- CLIENTES --- */}
              <SeparatorRow />
              <tr>
                  <td className={`${STICKY_COL_STYLE} bg-slate-100 text-blue-800 tracking-widest text-[10px]`}>CLIENTES</td>
                  <td colSpan={COLUMNS.length + 2} className="bg-slate-100 border-b border-slate-200"></td>
              </tr>
              {KILOS_CLIENTS_LIST.map(client => (
                <React.Fragment key={`client_${client}`}>
                    <TextGridRow 
                        rowKey={`client_${client}`} 
                        label={client} 
                        data={data} 
                        onUpdate={handleUpdate}
                        blackColumns={blackColumns} 
                        colorClass="!text-blue-700"
                    />
                    {(client === 'Nico' || client === 'Sanchez') && <SeparatorRow />}
                </React.Fragment>
              ))}

              {/* --- ZONAS --- */}
              <SeparatorRow />
              <tr>
                  <td className={`${STICKY_COL_STYLE} bg-slate-100 text-sky-800 tracking-widest text-[10px]`}>ZONAS</td>
                  <td colSpan={COLUMNS.length + 2} className="bg-slate-100 border-b border-slate-200"></td>
              </tr>
              {KILOS_ZONES_LIST.map(zone => (
                <React.Fragment key={`zone_${zone}`}>
                    <TextGridRow 
                        rowKey={`zone_${zone}`} 
                        label={zone} 
                        data={data} 
                        onUpdate={handleUpdate}
                        blackColumns={blackColumns} 
                        colorClass="!text-sky-700"
                    />
                    {zone === 'Centro Garbino' && <SeparatorRow />}
                </React.Fragment>
              ))}

              {/* --- ZONAS DEVOLUCION --- */}
              <SeparatorRow />
              <tr>
                  <td className={`${STICKY_COL_STYLE} bg-slate-100 text-rose-800 tracking-widest text-[10px]`}>DEVOLUCIÓN</td>
                  <td colSpan={COLUMNS.length + 2} className="bg-slate-100 border-b border-slate-200"></td>
              </tr>
              {KILOS_ZONES_DEV_LIST.map(zone => (
                <React.Fragment key={`zone_dev_${zone}`}>
                    <TextGridRow 
                        rowKey={`zone_dev_${zone}`} 
                        label={zone} 
                        data={data} 
                        onUpdate={handleUpdate}
                        blackColumns={blackColumns} 
                        colorClass="!text-rose-700"
                    />
                    {zone === 'Gaston' && <SeparatorRow />}
                </React.Fragment>
              ))}
            </tbody>

            {/* --- TOTALES FOOTER --- */}
            <tfoot className="sticky bottom-0 z-40">
               <tr className="bg-slate-800 text-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)]">
                    <td className="sticky left-0 z-50 bg-slate-800 border-r border-slate-600 p-2 text-right font-bold text-xs uppercase tracking-wider shadow-[4px_0_8px_-4px_rgba(0,0,0,0.5)]">
                        TOTALES
                    </td>
                    
                    {pairedTotals.map((total, idx) => (
                        <td key={idx} colSpan={2} className={TOTAL_CELL}>
                             {total === 0 ? '-' : new Intl.NumberFormat('es-AR').format(total)}
                        </td>
                    ))}
                    
                    <td className="w-4 bg-slate-800 border-none"></td>
                    <td className="p-2 min-w-[80px] bg-slate-900 text-emerald-400 font-mono font-bold text-center text-xs border-l border-slate-700">
                         {grandTotal === 0 ? '-' : new Intl.NumberFormat('es-AR').format(grandTotal)}
                    </td>
               </tr>
            </tfoot>

          </table>
        </div>
      </div>
    </div>
  );
};
