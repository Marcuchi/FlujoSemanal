
import React from 'react';
import { ref, onValue, set } from 'firebase/database';
import { Database } from 'firebase/database';
import { KilosWeekData, KILOS_CLIENTS_LIST, KILOS_ZONES_LIST, KILOS_ZONES_DEV_LIST } from '../types';

interface KilosAppProps {
  db: Database | null;
  weekKey: string;
}

// --- CONFIGURATION ---

// Sombreado solicitado:
// Lunes (0): No shaded
// Martes (1): Shaded (Primera aparición)
// Martes (2): No shaded
// ...
// Lunes (11): Shaded (Segunda aparición)
const COLUMNS = [
  { label: 'Lunes', shaded: false },      // 0
  { label: 'Martes', shaded: true },      // 1 (Primera aparición)
  { label: 'Martes', shaded: false },     // 2
  { label: 'Miércoles', shaded: true },   // 3 (Primera aparición)
  { label: 'Miércoles', shaded: false },  // 4
  { label: 'Jueves', shaded: true },      // 5 (Primera aparición)
  { label: 'Jueves', shaded: false },     // 6
  { label: 'Viernes', shaded: true },     // 7 (Primera aparición)
  { label: 'Viernes', shaded: false },    // 8
  { label: 'Sábado', shaded: true },      // 9 (Primera aparición)
  { label: 'Sábado', shaded: false },     // 10
  { label: 'Lunes', shaded: true },       // 11 (Segunda aparición de lunes en la grilla)
];

// Styles
const CELL_BORDER = "border border-slate-500"; 
const HEADER_STYLE = "p-2 text-[10px] sm:text-xs font-bold text-slate-300 uppercase text-center bg-slate-900 tracking-tighter";
const CELL_INPUT = "w-full h-full bg-transparent text-center text-sm text-slate-200 focus:outline-none focus:bg-indigo-900/30 font-mono font-medium";
const LABEL_CELL = "p-2 text-xs font-bold text-slate-300 uppercase bg-slate-900 sticky left-0 z-10 border-r-2 border-r-slate-500 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]";
const SUM_CELL = "w-full h-full flex items-center justify-center text-xs font-mono font-bold text-slate-400 bg-slate-950/50";
const TOTAL_ROW_STYLE = "bg-slate-800 font-bold text-slate-100";

// --- HELPERS ---

// Parsea el valor a float, si es texto devuelve 0 para la suma
const parseVal = (val: string) => {
  if (!val) return 0;
  // Reemplazar coma por punto para parseo y eliminar caracteres no numéricos excepto punto y coma y menos
  const clean = val.replace(/,/g, '.').replace(/[^\d.-]/g, '');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

// --- SUB-COMPONENTS ---

interface TextGridRowProps {
  rowKey: string;
  label: string;
  data: KilosWeekData;
  onUpdate: (rowKey: string, colIndex: number, value: string) => void;
  colorClass?: string;
}

const TextGridRow: React.FC<TextGridRowProps> = React.memo(({ rowKey, label, data, onUpdate, colorClass = "text-slate-400" }) => {
  const rowValues = data[rowKey] || Array(COLUMNS.length).fill('');

  // Calcular sumatoria total de la fila
  const totalRow = rowValues.reduce((acc, curr) => acc + parseVal(curr), 0);

  return (
    <tr className="hover:bg-white/5 transition-colors">
      <td className={`${CELL_BORDER} ${LABEL_CELL} ${colorClass}`}>
        {label}
      </td>
      
      {/* Celdas de Input */}
      {COLUMNS.map((col, index) => (
        <td 
          key={index} 
          className={`${CELL_BORDER} p-0 h-9 min-w-[70px] relative ${col.shaded ? 'bg-slate-800/60' : 'bg-slate-900'}`}
        >
          <input
            type="text"
            value={rowValues[index] || ''}
            onChange={(e) => onUpdate(rowKey, index, e.target.value)}
            className={CELL_INPUT}
          />
        </td>
      ))}

      {/* Separador Visual */}
      <td className="w-6 bg-slate-950 border-none"></td>

      {/* Celda de Sumatoria Total */}
      <td className={`${CELL_BORDER} p-0 h-9 min-w-[80px] bg-slate-900 border-slate-600`}>
        <div className={`${SUM_CELL} text-emerald-400`}>
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

  // --- LOADING & SAVING ---
  
  React.useEffect(() => {
    if (db) {
      setLoading(true);
      const kilosRef = ref(db, `weeks/${weekKey}/kilos_v2`); 
      const unsubscribe = onValue(kilosRef, (snapshot) => {
        const val = snapshot.val();
        if (val) {
          setData(val);
        } else {
          setData({});
        }
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

  // --- CALCULATE COLUMN TOTALS ---
  const columnTotals = React.useMemo(() => {
      const totals = Array(COLUMNS.length).fill(0);
      
      // Lista de todas las keys que usamos en la tabla
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

  const grandTotal = columnTotals.reduce((a, b) => a + b, 0);

  if (loading) return <div className="text-white p-8 animate-pulse">Cargando Planilla...</div>;

  return (
    <div className="flex flex-col h-full bg-slate-950 p-2 sm:p-4 overflow-hidden">
      <div className="bg-slate-900 rounded-xl border border-slate-600 shadow-2xl overflow-hidden flex flex-col h-full w-full">
        
        <div className="p-4 border-b border-slate-600 bg-slate-900/50 flex justify-between items-center flex-none">
          <h2 className="text-lg sm:text-xl font-bold text-orange-400 uppercase tracking-wide">Control de Kilos</h2>
        </div>

        <div className="overflow-auto flex-1 custom-scrollbar bg-slate-950">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-30 shadow-md">
              <tr>
                <th className={`${CELL_BORDER} ${HEADER_STYLE} min-w-[140px] sticky left-0 z-40 border-r-2 border-r-slate-500`}>
                  Concepto
                </th>
                {COLUMNS.map((col, idx) => (
                  <th key={idx} className={`${CELL_BORDER} ${HEADER_STYLE} min-w-[70px] ${col.shaded ? 'bg-slate-800' : ''}`}>
                    {col.label}
                  </th>
                ))}
                
                {/* Header para la Sumatoria */}
                <th className="w-6 bg-slate-950 border-none p-0"></th>
                <th className={`${CELL_BORDER} ${HEADER_STYLE} min-w-[80px] bg-slate-800 text-emerald-400`}>
                  Total
                </th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-800">
              {/* --- CAMARA --- */}
              <tr><td colSpan={COLUMNS.length + 3} className="p-1 bg-slate-950 border border-slate-600"></td></tr>
              <TextGridRow rowKey="camara_plus" label="Cámara (+)" data={data} onUpdate={handleUpdate} colorClass="text-amber-200" />
              <TextGridRow rowKey="camara_minus" label="Cámara (-)" data={data} onUpdate={handleUpdate} colorClass="text-purple-200" />

              {/* --- PUBLICO --- */}
              <tr><td colSpan={COLUMNS.length + 3} className="p-1 bg-slate-950 border border-slate-600"></td></tr>
              {[0, 1, 2, 3].map(i => (
                <TextGridRow 
                    key={`public_${i}`} 
                    rowKey={`public_${i}`} 
                    label="Público" 
                    data={data} 
                    onUpdate={handleUpdate} 
                    colorClass="text-emerald-300" 
                />
              ))}

              {/* --- CLIENTES --- */}
              <tr><td colSpan={COLUMNS.length + 3} className="bg-slate-800 text-xs font-bold text-blue-400 uppercase p-2 border border-slate-600 sticky left-0 z-20 shadow-md mt-2">Clientes</td></tr>
              {KILOS_CLIENTS_LIST.map(client => (
                <TextGridRow 
                    key={`client_${client}`} 
                    rowKey={`client_${client}`} 
                    label={client} 
                    data={data} 
                    onUpdate={handleUpdate} 
                    colorClass="text-blue-200"
                />
              ))}

              {/* --- ZONAS --- */}
              <tr><td colSpan={COLUMNS.length + 3} className="bg-slate-800 text-xs font-bold text-sky-400 uppercase p-2 border border-slate-600 sticky left-0 z-20 shadow-md mt-2">Zonas</td></tr>
              {KILOS_ZONES_LIST.map(zone => (
                <TextGridRow 
                    key={`zone_${zone}`} 
                    rowKey={`zone_${zone}`} 
                    label={zone} 
                    data={data} 
                    onUpdate={handleUpdate} 
                    colorClass="text-sky-200"
                />
              ))}

              {/* --- ZONAS DEVOLUCION --- */}
              <tr><td colSpan={COLUMNS.length + 3} className="bg-slate-800 text-xs font-bold text-rose-400 uppercase p-2 border border-slate-600 sticky left-0 z-20 shadow-md mt-2">Zonas Devolución</td></tr>
              {KILOS_ZONES_DEV_LIST.map(zone => (
                <TextGridRow 
                    key={`zone_dev_${zone}`} 
                    rowKey={`zone_dev_${zone}`} 
                    label={zone} 
                    data={data} 
                    onUpdate={handleUpdate} 
                    colorClass="text-rose-300"
                />
              ))}

              {/* --- TOTALES VERTICALES --- */}
               <tr><td colSpan={COLUMNS.length + 3} className="p-2 bg-slate-950 border border-slate-600"></td></tr>
               <tr className="border-t-2 border-slate-400">
                    <td className={`${CELL_BORDER} ${LABEL_CELL} text-white bg-slate-800`}>
                        TOTALES
                    </td>
                    {columnTotals.map((total, idx) => (
                        <td key={idx} className={`${CELL_BORDER} ${TOTAL_ROW_STYLE} text-center text-xs p-1`}>
                             {total === 0 ? '-' : new Intl.NumberFormat('es-AR').format(total)}
                        </td>
                    ))}
                    <td className="w-6 bg-slate-950 border-none"></td>
                    <td className={`${CELL_BORDER} ${TOTAL_ROW_STYLE} text-center text-xs p-1 bg-emerald-900 text-emerald-100`}>
                         {grandTotal === 0 ? '-' : new Intl.NumberFormat('es-AR').format(grandTotal)}
                    </td>
               </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
