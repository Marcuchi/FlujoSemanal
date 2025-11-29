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
    <div className="flex flex-col h-full bg-slate-900/50 rounded-xl border border-slate-800 p-4">
      <h3 className="text-sm font-bold text-slate-200 mb-4 uppercase tracking-wider text-center">{title}</h3>
      
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* SVG Chart */}
        <div className="w-40 h-40 flex-shrink-0">
          <svg viewBox="-1 -1 2 2" className="transform -rotate-90 w-full h-full drop-shadow-xl">
            {slices}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex-1 w-full space-y-2 overflow-y-auto max-h-48 custom-scrollbar pr-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-xs group">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-300 truncate font-medium group-hover:text-white transition-colors capitalize">
                  {item.name}
                </span>
              </div>
              <div className="flex gap-3">
                 <span className="text-slate-500 font-mono">
                  {((item.value / total) * 100).toFixed(1)}%
                </span>
                <span className="text-slate-200 font-mono font-bold">
                  {formatCurrency(item.value)}
                </span>
              </div>
            </div>
          ))}
          <div className="pt-2 mt-2 border-t border-slate-700/50 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400">TOTAL</span>
            <span className="text-sm font-bold text-white font-mono">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};