import React from 'react';
import { formatCurrency } from '../utils';

interface DataItem {
  name: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: DataItem[];
  title: string;
  emptyMessage: string;
}

export const PieChart: React.FC<PieChartProps> = ({ data, title, emptyMessage }) => {
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

    // Handle single item case (full circle)
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

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-slate-900/50 rounded-xl border border-slate-800 h-full">
        <h3 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">{title}</h3>
        <p className="text-xs text-slate-600 italic">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900/50 rounded-xl border border-slate-800 p-5">
      
      {/* Header with Title and Total */}
      <div className="flex flex-row justify-between items-center mb-6 border-b border-slate-800 pb-3">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">{title}</h3>
        <span className="text-lg font-mono font-bold text-white bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 shadow-sm">
          {formatCurrency(total)}
        </span>
      </div>
      
      <div className="flex flex-col xl:flex-row items-center gap-8 flex-1">
        {/* SVG Chart - Increased size */}
        <div className="w-56 h-56 flex-shrink-0">
          <svg viewBox="-1 -1 2 2" className="transform -rotate-90 w-full h-full drop-shadow-2xl">
            {slices}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex-1 w-full space-y-3 overflow-y-auto max-h-64 custom-scrollbar pr-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-sm group p-1 hover:bg-slate-800/30 rounded transition-colors">
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm ring-2 ring-opacity-20 ring-white" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-300 truncate font-medium group-hover:text-white transition-colors capitalize">
                  {item.name}
                </span>
              </div>
              <div className="flex gap-4">
                 <span className="text-slate-500 font-mono text-xs pt-0.5">
                  {((item.value / total) * 100).toFixed(1)}%
                </span>
                <span className="text-slate-200 font-mono font-bold">
                  {formatCurrency(item.value)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};