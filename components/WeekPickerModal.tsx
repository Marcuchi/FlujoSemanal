import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getMonday, getWeekKey } from '../utils';

interface WeekPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: Date;
  onSelectDate: (date: Date) => void;
}

export const WeekPickerModal: React.FC<WeekPickerModalProps> = ({ isOpen, onClose, currentDate, onSelectDate }) => {
  if (!isOpen) return null;

  const [viewDate, setViewDate] = React.useState(new Date(currentDate));
  const [hoveredWeekKey, setHoveredWeekKey] = React.useState<string | null>(null);

  // Reset view when opening
  React.useEffect(() => {
    if (isOpen) {
      setViewDate(new Date(currentDate));
    }
  }, [isOpen, currentDate]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // Adjust to get Monday as start (1 = Monday, 7 = Sunday)
    let startDay = firstDayOfMonth.getDay(); 
    if (startDay === 0) startDay = 7; 
    
    const days = [];
    
    // Previous month days
    for (let i = 1; i < startDay; i++) {
        const d = new Date(year, month, 1 - (startDay - i));
        days.push({ date: d, isCurrentMonth: false });
    }
    
    // Current month days
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
        const d = new Date(year, month, i);
        days.push({ date: d, isCurrentMonth: true });
    }
    
    // Next month days to fill grid (42 cells usually covers all cases)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i);
        days.push({ date: d, isCurrentMonth: false });
    }
    
    return days;
  };

  const days = getDaysInMonth(viewDate);
  const currentWeekKey = getWeekKey(currentDate);

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getFullYear() === d2.getFullYear();
  };

  const today = new Date();

  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-40 animate-in fade-in zoom-in duration-200">
        <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 w-72">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors">
                    <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-bold text-slate-200 capitalize select-none">
                    {viewDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={nextMonth} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors">
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 mb-2">
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => (
                    <div key={d} className="text-center text-xs font-bold text-slate-500 select-none">{d}</div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-y-1" onMouseLeave={() => setHoveredWeekKey(null)}>
                {days.map((dayObj, idx) => {
                    const dayWeekKey = getWeekKey(dayObj.date);
                    const isSelectedWeek = dayWeekKey === currentWeekKey;
                    const isHoveredWeek = dayWeekKey === hoveredWeekKey;
                    const isToday = isSameDay(dayObj.date, today);
                    
                    // Determine rounded corners for the "row/week" highlighting effect
                    const isMonday = idx % 7 === 0;
                    const isSunday = idx % 7 === 6;

                    return (
                        <button
                            key={idx}
                            onClick={() => onSelectDate(dayObj.date)}
                            onMouseEnter={() => setHoveredWeekKey(dayWeekKey)}
                            className={`
                                h-8 w-full text-xs flex items-center justify-center relative transition-colors
                                ${!dayObj.isCurrentMonth ? 'text-slate-600' : 'text-slate-300'}
                                ${isSelectedWeek ? 'bg-indigo-600 text-white' : ''}
                                ${!isSelectedWeek && isHoveredWeek ? 'bg-slate-800 text-slate-200' : ''}
                                ${isMonday ? 'rounded-l-lg' : ''}
                                ${isSunday ? 'rounded-r-lg' : ''}
                            `}
                        >
                            <span className={`relative z-10 ${isToday && !isSelectedWeek ? 'text-indigo-400 font-bold' : ''}`}>
                                {dayObj.date.getDate()}
                            </span>
                            
                            {/* Dot for today */}
                            {isToday && !isSelectedWeek && (
                                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-500"></span>
                            )}
                        </button>
                    );
                })}
            </div>
            
            {/* Close */}
            <div className="mt-3 pt-3 border-t border-slate-800 flex justify-center">
                 <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Cerrar</button>
            </div>
        </div>
    </div>
  );
};