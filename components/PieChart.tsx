import React from 'react';
import { formatCurrency } from '../utils';
import { ArrowLeft } from 'lucide-react';

interface DataItem {
  name: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: DataItem[];
  title: string;
  emptyMessage: string;
  othersList?: { name: string; value: number }[];
}

export const PieChart: React.FC<PieChartProps> = ({ data, title, emptyMessage, othersList }) => {
  const [showDetails, setShowDetails] = React.useState(false);
  const total = data.reduce((acc, item) => acc + item.value, 0);
  
  // Calculate paths
  let cumulativePercent = 0;

  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const slices = data.map((item) => {
    const startPercent = cumulativePercent;
    const percent = item.value / total;
    cumulativePercent += percent;
    const endPercent = cumulativePercent;

    if (percent === 1) {
      return (
        <circle r="1" cx="0" cy="0" fill={item.color} key={item.name} />
      );
    }

    const [startX, startY] = getCoordinatesForPercent(startPercent);
    const [endX, endY] = getCoordinatesForPercent(endPercent);

    const largeArcFlag = percent > 0.5 ? 1 : 0;

    const pathData = [
      `M ${startX} ${startY}`, // Move
      `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, // Arc
      `L 0 0`, // Line to center
    ].join(' ');

    return (
      <path d={pathData} fill={item.color} key={item.name} />
    );
  });

  // --- DETAILED LIST VIEW FOR 'OTHERS' ---
  if (showDetails && othersList && othersList.length > 0) {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-5 animate-in fade-in duration-200">
        <div className="flex flex-row justify-between items-center mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Detalle: Otros</h3>
          <button 
            onClick={() => setShowDetails(false)}
            className="text-xs flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors font-semibold"
          >
            <ArrowLeft size={14} /> Volver
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
           {othersList.map((item, idx) => (
             <div key={idx} className="flex justify-between items-center p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800/50 last:border-0">
                <span className="text-sm text-slate-600 dark:text-slate-300 capitalize">{item.name}</span>
                <span className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">{formatCurrency(item.value)}</span>
             </div>
           ))}
        </div>
        
        <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
            <span>Total Otros</span>
            <span className="font-mono">{formatCurrency(othersList.reduce((a,b) => a + b.value, 0))}</span>
        </div>
      </div>
    );
  }

  // --- STANDARD CHART VIEW ---
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 h-full">
        <h3 className="text-sm font-bold text-slate-400 dark:text-slate-400 mb-2 uppercase tracking-wider">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-600 italic">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
      
      {/* Header with Title and Total */}
      <div className="flex flex-row justify-between items-center mb-6 border-b border-slate-200 dark:border-slate-800 pb-3">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">{title}</h3>
        <span className="text-lg font-mono font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
          {formatCurrency(total)}
        </span>
      </div>
      
      <div className="flex flex-col xl:flex-row items-center gap-8 flex-1">
        {/* SVG Chart - Increased size */}
        <div className="w-56 h-56 flex-shrink-0">
          <svg viewBox="-1 -1 2 2" className="transform -rotate-90 w-full h-full drop-shadow-xl">
            {slices}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex-1 w-full space-y-3 overflow-y-auto max-h-64 custom-scrollbar pr-2">
          {data.map((item) => {
            const isOthers = item.name === 'Otros' && othersList && othersList.length > 0;
            return (
              <div 
                key={item.name} 
                onClick={() => isOthers ? setShowDetails(true) : undefined}
                className={`flex items-center justify-between text-sm group p-1 rounded transition-colors ${isOthers ? 'cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-500/30' : 'hover:bg-slate-100 dark:hover:bg-slate-800/30'}`}
                title={isOthers ? "Ver detalles" : ""}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm ring-2 ring-opacity-20 ring-white" style={{ backgroundColor: item.color }}></span>
                  <span className={`truncate font-medium capitalize transition-colors ${isOthers ? 'text-indigo-600 dark:text-indigo-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-200 underline decoration-dotted decoration-indigo-400' : 'text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                    {item.name}
                  </span>
                </div>
                <div className="flex gap-4">
                   <span className="text-slate-500 font-mono text-xs pt-0.5">
                    {((item.value / total) * 100).toFixed(1)}%
                  </span>
                  <span className={`font-mono font-bold ${isOthers ? 'text-indigo-700 dark:text-indigo-200' : 'text-slate-700 dark:text-slate-200'}`}>
                    {formatCurrency(item.value)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};