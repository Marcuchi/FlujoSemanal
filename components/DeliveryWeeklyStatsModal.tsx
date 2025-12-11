
import React from 'react';
import { Database, ref, get } from 'firebase/database';
import { X, BarChart3, Users, Calendar } from 'lucide-react';
import { DeliveryRow } from '../types';
import { getMonday, formatCurrency } from '../utils';

interface DeliveryWeeklyStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  db: Database | null;
  zoneName: string;
  currentDate: string; // YYYY-MM-DD
}

const DAYS_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export const DeliveryWeeklyStatsModal: React.FC<DeliveryWeeklyStatsModalProps> = ({ 
  isOpen, 
  onClose, 
  db, 
  zoneName, 
  currentDate 
}) => {
  const [loading, setLoading] = React.useState(true);
  const [dailyTotals, setDailyTotals] = React.useState<number[]>([]);
  const [clientTotals, setClientTotals] = React.useState<{name: string, total: number}[]>([]);
  const [weekLabel, setWeekLabel] = React.useState('');

  React.useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      
      // 1. Calculate dates for the week (Mon-Sat)
      const [y, m, d] = currentDate.split('-').map(Number);
      const currentObj = new Date(y, m - 1, d);
      const monday = getMonday(currentObj);
      
      // Set label
      const saturday = new Date(monday);
      saturday.setDate(monday.getDate() + 5);
      setWeekLabel(`${monday.getDate()}/${monday.getMonth()+1} - ${saturday.getDate()}/${saturday.getMonth()+1}`);

      const dateStrings: string[] = [];
      for (let i = 0; i < 6; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        const yStr = date.getFullYear();
        const mStr = String(date.getMonth() + 1).padStart(2, '0');
        const dStr = String(date.getDate()).padStart(2, '0');
        dateStrings.push(`${yStr}-${mStr}-${dStr}`);
      }

      // 2. Fetch data for each day
      const daySums = new Array(6).fill(0);
      const clientMap = new Map<string, number>();

      for (let i = 0; i < 6; i++) {
        const dateStr = dateStrings[i];
        let rows: DeliveryRow[] = [];

        if (db) {
          const snapshot = await get(ref(db, `deliveries/${zoneName}/${dateStr}`));
          if (snapshot.exists()) {
            rows = snapshot.val() as DeliveryRow[];
          }
        } else {
          const saved = localStorage.getItem(`deliveries/${zoneName}/${dateStr}`);
          if (saved) {
            try { rows = JSON.parse(saved); } catch (e) {}
          }
        }

        // 3. Aggregate Data
        if (rows && rows.length > 0) {
          let dayTotal = 0;
          rows.forEach(row => {
            const weight = Number(row.weight) || 0;
            const name = row.client ? row.client.trim() : 'Sin Nombre';
            
            if (weight > 0) {
              dayTotal += weight;
              
              // Normalize name key but keep display name
              const nameKey = name.toLowerCase();
              const currentClientTotal = clientMap.get(nameKey) || 0;
              clientMap.set(nameKey, currentClientTotal + weight);
              
              // Store original name casing if not stored, or update if exists (simplified)
              // (Mapping logic handled by consistent key usage)
            }
          });
          daySums[i] = dayTotal;
        }
      }

      setDailyTotals(daySums);

      // 4. Process Client List
      // We need to map back from keys to capitalized names. 
      // Since we didn't store a separate map, we'll iterate the map entries 
      // and uppercase the first letter for display.
      const clientsArray = Array.from(clientMap.entries()).map(([key, total]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1), 
        total
      }));
      
      // Sort by total weight desc
      clientsArray.sort((a, b) => b.total - a.total);
      setClientTotals(clientsArray);

      setLoading(false);
    };

    fetchData();
  }, [isOpen, db, zoneName, currentDate]);

  if (!isOpen) return null;

  const maxDaily = Math.max(...dailyTotals, 1); // Avoid division by zero

  const formatKg = (val: number) => new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
  const formatDecimalKg = (val: number) => new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-900/50">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <BarChart3 className="text-indigo-400" size={24} />
              Estadísticas Semanales
            </h2>
            <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                <span className="font-bold text-emerald-400 uppercase">{zoneName}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Calendar size={12}/> {weekLabel}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-950">
          {loading ? (
             <div className="flex items-center justify-center h-64 text-indigo-400 animate-pulse">Calculando datos...</div>
          ) : (
             <div className="flex flex-col lg:flex-row gap-8">
                
                {/* Left: Bar Chart */}
                <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-lg flex flex-col">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <BarChart3 size={16} /> Kilos por Día
                    </h3>
                    
                    <div className="flex-1 relative flex pt-6 pb-2">
                        {/* Y-Axis Labels */}
                        <div className="flex flex-col justify-between text-[10px] text-slate-500 font-mono pr-3 text-right w-12 flex-shrink-0 h-64 py-1">
                            <span>{formatKg(maxDaily)}</span>
                            <span>{formatKg(maxDaily * 0.75)}</span>
                            <span>{formatKg(maxDaily * 0.5)}</span>
                            <span>{formatKg(maxDaily * 0.25)}</span>
                            <span>0</span>
                        </div>

                        {/* Chart Area */}
                        <div className="relative flex-1 h-64 border-l border-b border-slate-700 pl-2">
                            
                            {/* Grid Lines */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-1 pl-2">
                                <div className="border-t border-slate-800 border-dashed w-full h-0"></div>
                                <div className="border-t border-slate-800 border-dashed w-full h-0"></div>
                                <div className="border-t border-slate-800 border-dashed w-full h-0"></div>
                                <div className="border-t border-slate-800 border-dashed w-full h-0"></div>
                                <div className="border-t border-slate-800 border-dashed w-full h-0"></div>
                            </div>

                            {/* Bars Container */}
                            <div className="absolute inset-0 flex items-end justify-between gap-2 px-2 pb-1">
                                {dailyTotals.map((total, idx) => {
                                    const percentage = (total / maxDaily) * 100;
                                    const isMax = total === maxDaily && total > 0;
                                    
                                    return (
                                        <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative z-10">
                                            
                                            {/* Value Label */}
                                            <div 
                                                className={`absolute -top-6 text-xs font-bold transition-all duration-300 mb-1 whitespace-nowrap z-20 
                                                    ${isMax 
                                                        ? 'text-emerald-400 opacity-100 scale-110' 
                                                        : 'text-slate-400 opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0'
                                                    }`}
                                            >
                                                {formatKg(total)}
                                            </div>

                                            {/* Bar */}
                                            <div 
                                                className={`w-full max-w-[40px] rounded-t-sm transition-all duration-700 ease-out relative min-h-[4px]
                                                    ${isMax 
                                                        ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]' 
                                                        : 'bg-gradient-to-t from-indigo-600 to-indigo-400 hover:from-indigo-500 hover:to-indigo-300 opacity-80 hover:opacity-100'
                                                    }
                                                `}
                                                style={{ height: `${percentage}%` }}
                                            >
                                            </div>
                                            
                                            {/* X-Axis Label */}
                                            <div className={`mt-2 text-[10px] sm:text-xs font-bold uppercase transition-colors
                                                ${isMax ? 'text-emerald-500' : 'text-slate-500'}
                                            `}>
                                                {DAYS_LABELS[idx]}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-bold uppercase">Total Semana</span>
                        <span className="text-xl font-mono font-bold text-indigo-400">
                            {formatDecimalKg(dailyTotals.reduce((a, b) => a + b, 0))} <span className="text-sm text-slate-500">kg</span>
                        </span>
                    </div>
                </div>

                {/* Right: Client List */}
                <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-lg flex flex-col h-[500px] lg:h-auto">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Users size={16} /> Top Clientes (Kg)
                    </h3>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                        {clientTotals.length === 0 ? (
                            <div className="text-center text-slate-500 italic py-10">Sin movimientos esta semana</div>
                        ) : (
                            <div className="space-y-2">
                                {clientTotals.map((client, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 border border-transparent hover:border-slate-700 transition-all group">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <span className={`text-xs font-mono font-bold w-6 h-6 flex items-center justify-center rounded-full ${idx < 3 ? 'bg-indigo-900 text-indigo-300' : 'bg-slate-800 text-slate-500'}`}>
                                                {idx + 1}
                                            </span>
                                            <span className="text-sm font-medium text-slate-300 truncate group-hover:text-white capitalize">
                                                {client.name}
                                            </span>
                                        </div>
                                        <div className="text-sm font-mono font-bold text-emerald-400">
                                            {formatDecimalKg(client.total)} kg
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

             </div>
          )}
        </div>
      </div>
    </div>
  );
};
