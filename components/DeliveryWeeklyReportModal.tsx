
import React from 'react';
import { Database, ref, get } from 'firebase/database';
import { X, BarChart3, Loader2 } from 'lucide-react';
import { DeliveryRow } from '../types';
import { getMonday, formatCurrency } from '../utils';

interface DeliveryWeeklyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  db: Database | null;
  zoneName: string;
  currentDate: Date; // To determine the week
}

interface DailyTotal {
  dayName: string;
  dateStr: string;
  totalWeight: number;
}

const SHORT_DAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

export const DeliveryWeeklyReportModal: React.FC<DeliveryWeeklyReportModalProps> = ({ 
  isOpen, 
  onClose, 
  db, 
  zoneName,
  currentDate 
}) => {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<DailyTotal[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      fetchWeeklyData();
    }
  }, [isOpen, zoneName, currentDate, db]);

  const fetchWeeklyData = async () => {
    setLoading(true);
    const monday = getMonday(currentDate);
    const weekData: DailyTotal[] = [];

    // Loop Monday (1) to Saturday (6)
    const promises = [];
    
    for (let i = 1; i <= 6; i++) {
        const d = new Date(monday);
        const dayOffset = i - 1; 
        d.setDate(monday.getDate() + dayOffset);
        
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        const dayLabel = SHORT_DAYS[i]; // L, M, M, J, V, S

        promises.push(
            fetchDayData(dateStr).then(total => ({
                dayName: dayLabel,
                dateStr,
                totalWeight: total
            }))
        );
    }

    const results = await Promise.all(promises);
    setData(results);
    setLoading(false);
  };

  const fetchDayData = async (dateStr: string): Promise<number> => {
      const path = `deliveries/${zoneName}/${dateStr}`;
      
      if (db) {
          try {
              const snapshot = await get(ref(db, path));
              if (snapshot.exists()) {
                  const rows = snapshot.val() as DeliveryRow[];
                  return rows.reduce((acc, row) => acc + (row.weight || 0), 0);
              }
          } catch (e) {
              console.error(e);
          }
      } else {
          // Local Storage
          const saved = localStorage.getItem(path);
          if (saved) {
              try {
                  const rows = JSON.parse(saved) as DeliveryRow[];
                  return rows.reduce((acc, row) => acc + (row.weight || 0), 0);
              } catch (e) { }
          }
      }
      return 0;
  };

  if (!isOpen) return null;

  const maxVal = Math.max(...data.map(d => d.totalWeight), 1); 
  const totalWeekWeight = data.reduce((acc, d) => acc + d.totalWeight, 0);

  // Round max for Y-axis scale to nice number
  const ceilMax = Math.ceil(maxVal / 100) * 100; 

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <BarChart3 className="text-indigo-600" /> Informe Semanal
              </h2>
              <p className="text-sm text-slate-500 font-medium">Zona: <span className="text-indigo-600 font-bold uppercase">{zoneName}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto">
            
            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 text-indigo-500">
                    <Loader2 size={48} className="animate-spin mb-4" />
                    <p className="font-medium">Calculando totales...</p>
                </div>
            ) : (
                <div className="flex flex-col h-full">
                    
                    {/* Summary Badge */}
                    <div className="flex justify-end mb-6">
                        <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl text-right">
                            <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Total Semana</p>
                            <p className="text-2xl font-black text-indigo-700 font-mono">
                                {new Intl.NumberFormat('es-AR').format(totalWeekWeight)} <span className="text-sm text-indigo-400">kg</span>
                            </p>
                        </div>
                    </div>

                    {/* Chart Layout */}
                    <div className="flex h-[350px]">
                        
                        {/* Y-Axis Labels */}
                        <div className="flex flex-col justify-between items-end pr-3 py-4 text-xs font-bold text-slate-400 font-mono h-full w-12 border-r border-slate-100">
                            <span>{Math.round(ceilMax)}</span>
                            <span>{Math.round(ceilMax * 0.75)}</span>
                            <span>{Math.round(ceilMax * 0.5)}</span>
                            <span>{Math.round(ceilMax * 0.25)}</span>
                            <span>0</span>
                        </div>

                        {/* Chart Area */}
                        <div className="flex-1 flex items-end gap-2 sm:gap-6 pl-4 pb-0 relative border-b border-slate-200">
                            
                            {/* Grid Lines (Background) */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none py-4 z-0 opacity-50">
                                <div className="border-t border-dashed border-slate-200 w-full h-0"></div>
                                <div className="border-t border-dashed border-slate-200 w-full h-0"></div>
                                <div className="border-t border-dashed border-slate-200 w-full h-0"></div>
                                <div className="border-t border-dashed border-slate-200 w-full h-0"></div>
                                <div className="border-t border-slate-200 w-full h-0"></div> {/* Base line */}
                            </div>

                            {data.map((item, idx) => {
                                const percentage = (item.totalWeight / ceilMax) * 100;
                                const isZero = item.totalWeight === 0;
                                
                                return (
                                    <div key={idx} className="flex-1 flex flex-col items-center group relative z-10 h-full justify-end">
                                        
                                        {/* Value Tooltip (Always visible if space permits, or simpler on hover) */}
                                        <div className={`mb-2 text-xs font-bold font-mono transition-all transform group-hover:scale-110 ${isZero ? 'opacity-0' : 'text-slate-600'}`}>
                                            {isZero ? '' : Math.round(item.totalWeight)}
                                        </div>
                                        
                                        {/* Bar */}
                                        <div 
                                            style={{ height: `${isZero ? 2 : percentage}%` }} 
                                            className={`w-full max-w-[60px] rounded-t-lg transition-all duration-700 ease-out relative overflow-hidden ${
                                                isZero 
                                                ? 'bg-slate-100' 
                                                : 'bg-indigo-500 hover:bg-indigo-600 shadow-md shadow-indigo-200'
                                            }`}
                                        >
                                            {!isZero && (
                                                <div className="absolute top-0 left-0 w-full h-1 bg-white/20"></div>
                                            )}
                                        </div>
                                        
                                        {/* X-Axis Label */}
                                        <div className="absolute -bottom-8 text-xs font-bold text-slate-500 uppercase">
                                            {item.dayName}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    
                    {/* Legend / Axis Title */}
                    <div className="mt-8 text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Días de la Semana</p>
                    </div>

                </div>
            )}

        </div>
      </div>
    </div>
  );
};
