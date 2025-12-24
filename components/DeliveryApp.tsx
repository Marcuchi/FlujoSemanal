import React from 'react';
import { Database, ref, onValue, set, get, query, orderByKey, limitToLast, endAt } from 'firebase/database';
import { Calendar, Plus, Trash2, MapPin, Calculator, Printer, ChevronDown, ChevronUp, History, X, Clock, Receipt, Wallet, Coins, AlertCircle, BarChart3, Package, Scale, DollarSign, ArrowUpRight } from 'lucide-react';
import { DeliveryRow, DeliveryHistoryLog, DeliveryExpense } from '../types';
import { generateId } from '../utils';
import { DayPickerModal } from './DayPickerModal';
import { DeliveryWeeklyStatsModal } from './DeliveryWeeklyStatsModal';

interface DeliveryAppProps {
  db: Database | null;
  zoneName: string;
  isRestricted?: boolean;
}

const PRODUCT_CATEGORIES = ['Pollo', 'Pechuga y Muslo'];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDecimal = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(value);
};

// --- Improved Numeric Input ---
const NumericInput = ({ 
    value, 
    onChange, 
    placeholder = "0",
    className = "",
    disabled = false,
    isCurrency = false
  }: { 
    value: number, 
    onChange: (val: number) => void,
    placeholder?: string,
    className?: string,
    disabled?: boolean,
    isCurrency?: boolean
  }) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [localValue, setLocalValue] = React.useState(value === 0 ? '' : value.toString());

    const alignment = className.includes('text-left') ? 'justify-start text-left' : 
                      className.includes('text-right') ? 'justify-end text-right' : 'justify-center text-center';

    React.useEffect(() => {
         if (isEditing) {
             setLocalValue(value === 0 ? '' : value.toString());
         }
    }, [isEditing, value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === '' || /^\d*\.?\d*$/.test(val)) {
            setLocalValue(val);
        }
    };

    const commitValue = () => {
        setIsEditing(false);
        if (localValue === '') {
            if (value !== 0) onChange(0);
        } else {
            const num = parseFloat(localValue);
            if (!isNaN(num) && num !== value) {
                onChange(num);
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
        }
    };

    let displayValue: string | number = value === 0 ? '-' : value;
    if (isCurrency && value !== 0) displayValue = formatCurrency(value);
    if (isCurrency && value === 0) displayValue = '-';

    if (disabled) {
        return (
            <div className={`w-full h-full flex items-center px-1 ${alignment} ${className} opacity-80`}>
                {displayValue}
            </div>
        );
    }

    if (!isEditing) {
        return (
            <div 
                onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                className={`w-full h-full flex items-center px-1 cursor-text ${alignment} ${className} hover:bg-slate-50 transition-colors print:px-0`}
            >
                {displayValue}
            </div>
        );
    }

    return (
        <input
            autoFocus
            type="text"
            inputMode="decimal"
            placeholder={placeholder}
            value={localValue}
            onChange={handleChange}
            onBlur={commitValue}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className={`bg-transparent w-full h-full px-1 focus:outline-none focus:bg-indigo-50 transition-all placeholder-slate-400 print:placeholder-transparent ${className}`}
        />
    );
};

// --- TextInput (Commits on Blur) ---
const TextInput = ({ 
    value, 
    onChange, 
    placeholder = "",
    className = "",
    disabled = false
  }: { 
    value: string, 
    onChange: (val: string) => void,
    placeholder?: string,
    className?: string,
    disabled?: boolean
  }) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [localValue, setLocalValue] = React.useState(value);

    React.useEffect(() => {
         if (isEditing) {
             setLocalValue(value);
         }
    }, [isEditing, value]);

    const commitValue = () => {
        setIsEditing(false);
        if (localValue !== value) {
            onChange(localValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
        }
    };

    if (disabled) {
         return (
            <div className={`w-full h-full flex items-center px-2 ${className} opacity-80 truncate`}>
                {value || <span className="text-slate-300 italic font-normal print:hidden">{placeholder}</span>}
            </div>
        );
    }

    if (!isEditing) {
        return (
            <div 
                onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                className={`w-full h-full flex items-center px-2 cursor-text ${className} hover:bg-slate-50 transition-colors truncate print:px-0 print:whitespace-nowrap print:overflow-hidden print:h-full`}
            >
                {value || <span className="text-slate-300 italic font-normal print:hidden">{placeholder}</span>}
            </div>
        );
    }

    return (
        <input
            autoFocus
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={commitValue}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            placeholder={placeholder}
            className={`bg-transparent w-full h-full px-2 focus:outline-none focus:bg-indigo-50 transition-all ${className}`}
        />
    );
};

// --- ProductSelect (Dropdown for Article) ---
const ProductSelect = ({ 
    value, 
    onChange, 
    className = ""
  }: { 
    value: string, 
    onChange: (val: string) => void,
    className?: string
  }) => {
    const [isEditing, setIsEditing] = React.useState(false);
    
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onChange(e.target.value);
        setIsEditing(false);
    };

    if (!isEditing) {
        return (
            <div 
                onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                className={`w-full h-full flex items-center px-2 cursor-pointer ${className} hover:bg-slate-50 transition-colors truncate print:px-0`}
            >
                {value || <span className="text-slate-300 italic font-normal text-xs print:hidden">Seleccionar...</span>}
            </div>
        );
    }

    return (
        <select
            autoFocus
            value={value}
            onChange={handleChange}
            onBlur={() => setIsEditing(false)}
            onClick={(e) => e.stopPropagation()}
            className={`w-full h-full px-1 bg-white focus:outline-none focus:bg-indigo-50 transition-all ${className}`}
        >
            <option value="">Seleccionar...</option>
            {PRODUCT_CATEGORIES.map(cat => (
                 <option key={cat} value={cat}>{cat}</option>
            ))}
        </select>
    );
};

export const DeliveryApp: React.FC<DeliveryAppProps> = ({ db, zoneName, isRestricted = false }) => {
  const getLocalDateString = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
  };

  const [currentDate, setCurrentDate] = React.useState(getLocalDateString(new Date()));
  const [rows, setRows] = React.useState<DeliveryRow[]>([]);
  const [expenses, setExpenses] = React.useState<DeliveryExpense[]>([]);
  const [history, setHistory] = React.useState<DeliveryHistoryLog[]>([]);
  const [metadata, setMetadata] = React.useState({ loadedChicken: 0, returnedChicken: 0 });
  const [loading, setLoading] = React.useState(true);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [showHistoryModal, setShowHistoryModal] = React.useState(false);
  const [showStatsModal, setShowStatsModal] = React.useState(false);

  const isCompact = ['garbino', 'flores'].includes(zoneName.toLowerCase());
  const rowHeight = isCompact ? 'h-8' : 'h-10';
  const fontSize = 'text-sm';
  const headerFontSize = 'text-xs sm:text-sm';
  const cellPadding = 'px-2';

  const getDefaultClients = (zone: string) => {
      const z = zone.toLowerCase();
      if (z === 'malvinas') return ["Carnes Cordoba", "Macarena", "Oviedo", "Pablo Sahar", "Colon Federico", "Eric Colon", "La Rivieri", "Cipruz", "Ochetti Paola"];
      if (z === 'rodolfo') return ["La Vida", "Fratelli", "Bodereau", "Zoe", "Kevin", "Tomas", "Ale", "Zipoli", "HP Juan B Justo", "Mafequin", "Medrano", "Nilda"];
      if (z === 'garbino') return ["Fazzio", "Machuca", "Fede Garbino", "Mauri- II Carelo", "NIC", "San Agustin", "HG Centro", "Vaca Polleria", "Vaca Carniceria", "Olmos", "Luisa"];
      if (z === 'flores') return ["Diego Malagueño", "Lammoglia", "Antolufe", "Susana", "Los Hermanos", "Ricardo", "Natural Mystic", "Fernando", "Marcela", "Seba Geiser", "Leo", "De Todo", "La Boutique", "Melina", "Vale", "Omar", "Carnes Dante"];
      return [];
  };

  const initializeRowsWithPreviousData = async (zone: string, currentDayStr: string) => {
      const defaultNames = getDefaultClients(zone);
      const [y, m, d] = currentDayStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      date.setDate(date.getDate() - 1);
      const yesterdayStr = getLocalDateString(date);
      const rowsMap = new Map<string, DeliveryRow>();

      defaultNames.forEach(name => {
          const normName = name.trim().toLowerCase();
          rowsMap.set(normName, { id: generateId() + Math.random().toString(36).substring(7), client: name, product: '', weight: 0, price: 0, prevBalance: 0, payment: 0 });
      });

      let prevRows: DeliveryRow[] = [];
      if (db) {
          try {
              const deliveriesRef = ref(db, `deliveries/${zone}`);
              const q = query(deliveriesRef, orderByKey(), endAt(yesterdayStr), limitToLast(1));
              const snapshot = await get(q);
              if (snapshot.exists()) {
                  prevRows = Object.values(snapshot.val())[0] as DeliveryRow[];
              }
          } catch (e) { console.error(e); }
      } else {
          const prefix = `deliveries/${zone}/`;
          let maxDate = "";
          for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith(prefix)) {
                  const datePart = key.replace(prefix, "");
                  if (datePart <= yesterdayStr && (maxDate === "" || datePart > maxDate)) maxDate = datePart;
              }
          }
          if (maxDate) {
              const saved = localStorage.getItem(`${prefix}${maxDate}`);
              if (saved) try { prevRows = JSON.parse(saved); } catch (e) {}
          }
      }

      if (prevRows.length > 0) {
          prevRows.forEach(prev => {
              const prevEndBalance = (prev.weight * prev.price) + prev.prevBalance - prev.payment;
              const normName = prev.client.trim().toLowerCase();
              if (rowsMap.has(normName)) {
                  rowsMap.get(normName)!.prevBalance = prevEndBalance;
              } else if (Math.abs(prevEndBalance) > 0.1) {
                  rowsMap.set(normName, { id: generateId() + Math.random().toString(36).substring(7), client: prev.client, product: '', weight: 0, price: 0, prevBalance: prevEndBalance, payment: 0, isNew: true });
              }
          });
      }
      return Array.from(rowsMap.values());
  };

  React.useEffect(() => {
    const dataKey = `deliveries/${zoneName}/${currentDate}`;
    const expensesKey = `delivery_expenses/${zoneName}/${currentDate}`;
    const historyKey = `deliveries_history/${zoneName}/${currentDate}`;
    const metaKey = `deliveries_metadata/${zoneName}/${currentDate}`;
    setLoading(true);

    if (db) {
      const unsubscribeData = onValue(ref(db, dataKey), async (snapshot) => {
        if (snapshot.exists()) setRows(snapshot.val());
        else setRows(await initializeRowsWithPreviousData(zoneName, currentDate));
      });
      const unsubscribeExpenses = onValue(ref(db, expensesKey), (snap) => setExpenses(snap.val() || []));
      const unsubscribeHistory = onValue(ref(db, historyKey), (snap) => setHistory(snap.val() ? Object.values(snap.val()) : []));
      const unsubscribeMeta = onValue(ref(db, metaKey), (snap) => setMetadata(snap.val() || { loadedChicken: 0, returnedChicken: 0 }));
      setLoading(false);
      return () => { unsubscribeData(); unsubscribeExpenses(); unsubscribeHistory(); unsubscribeMeta(); };
    } else {
      const loadLocal = async () => {
          const lRows = localStorage.getItem(dataKey);
          if (lRows) setRows(JSON.parse(lRows));
          else setRows(await initializeRowsWithPreviousData(zoneName, currentDate));
          setExpenses(JSON.parse(localStorage.getItem(expensesKey) || '[]'));
          setHistory(JSON.parse(localStorage.getItem(historyKey) || '[]'));
          setMetadata(JSON.parse(localStorage.getItem(metaKey) || '{"loadedChicken":0,"returnedChicken":0}'));
          setLoading(false);
      };
      loadLocal();
    }
  }, [db, zoneName, currentDate]);

  const saveData = (newRows: DeliveryRow[]) => {
    const dataKey = `deliveries/${zoneName}/${currentDate}`;
    if (db) set(ref(db, dataKey), newRows);
    else { setRows(newRows); localStorage.setItem(dataKey, JSON.stringify(newRows)); }
  };

  const saveExpenses = (newExpenses: DeliveryExpense[]) => {
      const expensesKey = `delivery_expenses/${zoneName}/${currentDate}`;
      if (db) set(ref(db, expensesKey), newExpenses);
      else { setExpenses(newExpenses); localStorage.setItem(expensesKey, JSON.stringify(newExpenses)); }
  };

  const logHistory = (description: string) => {
    const newLog = { id: generateId(), timestamp: new Date().toISOString(), description, user: isRestricted ? 'Reparto' : 'General' };
    const newHistory = [newLog, ...history];
    if (db) set(ref(db, `deliveries_history/${zoneName}/${currentDate}`), newHistory);
    else { setHistory(newHistory); localStorage.setItem(`deliveries_history/${zoneName}/${currentDate}`, JSON.stringify(newHistory)); }
  };

  const handleRowChange = (id: string, field: keyof DeliveryRow, value: any) => {
    saveData(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const addExpense = () => {
    const newExpense: DeliveryExpense = {
      id: generateId(),
      description: '',
      amount: 0
    };
    saveExpenses([...expenses, newExpense]);
  };

  const updateExpense = (id: string, field: keyof DeliveryExpense, value: any) => {
    const newExpenses = expenses.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    );
    saveExpenses(newExpenses);
  };

  const removeExpense = (id: string) => {
    if (window.confirm("¿Eliminar gasto?")) {
      const newExpenses = expenses.filter(exp => exp.id !== id);
      saveExpenses(newExpenses);
    }
  };

  const saveMetadata = (newMeta: typeof metadata) => {
    const metaKey = `deliveries_metadata/${zoneName}/${currentDate}`;
    if (db) set(ref(db, metaKey), newMeta);
    else { setMetadata(newMeta); localStorage.setItem(metaKey, JSON.stringify(newMeta)); }
  };

  const addRow = () => saveData([...rows, { id: generateId(), client: '', product: '', weight: 0, price: 0, prevBalance: 0, payment: 0, isNew: true }]);
  const removeRow = (id: string) => { if(window.confirm("¿Eliminar fila?")) { logHistory(`Eliminado: ${rows.find(r => r.id === id)?.client || 'Sin nombre'}`); saveData(rows.filter(r => r.id !== id)); } };

  const totalWeight = rows.reduce((acc, row) => acc + (row.weight || 0), 0);
  const totalPayment = rows.reduce((acc, row) => acc + (row.payment || 0), 0);
  const totalSold = rows.reduce((acc, row) => acc + ((row.weight || 0) * (row.price || 0)), 0);
  const totalPrevBalance = rows.reduce((acc, row) => acc + (row.prevBalance || 0), 0);
  const totalExpenses = expenses.reduce((acc, exp) => acc + (exp.amount || 0), 0);
  const finalBalance = rows.reduce((acc, row) => acc + ((row.weight * row.price) + row.prevBalance - row.payment), 0);
  const cashBalance = totalPayment - totalExpenses;
  const shrinkage = (metadata.loadedChicken - metadata.returnedChicken) - totalWeight;

  const toggleRow = (id: string) => setExpandedId(expandedId === id ? null : id);

  if (loading) return <div className="text-emerald-400 p-8 animate-pulse text-center">Cargando Planilla...</div>;

  return (
    <div className="h-full flex flex-col bg-slate-100 overflow-hidden print:overflow-visible print:h-auto print:bg-white">
      <DeliveryWeeklyStatsModal isOpen={showStatsModal} onClose={() => setShowStatsModal(false)} db={db} zoneName={zoneName} currentDate={currentDate} />

      {/* Top Bar */}
      <div className="flex-none bg-white border-b border-slate-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4 print:hidden z-10">
         <div className="flex items-center gap-4">
             <div className="relative">
                <button onClick={() => !isRestricted && setShowDatePicker(!showDatePicker)} className={`flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold border border-slate-300 transition-colors ${isRestricted ? 'cursor-default opacity-80' : ''}`}>
                    <Calendar size={18} className="text-emerald-600" />
                    {(() => { const [y, m, d] = currentDate.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }); })()}
                    {!isRestricted && <ChevronDown size={14} />}
                </button>
                <DayPickerModal isOpen={showDatePicker} onClose={() => setShowDatePicker(false)} currentDate={new Date(currentDate + 'T12:00:00')} onSelectDate={(d) => { setCurrentDate(getLocalDateString(d)); setShowDatePicker(false); }} />
             </div>
             <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                <MapPin size={16} /> <span className="font-semibold uppercase">{zoneName}</span>
             </div>
         </div>
         <div className="flex items-center gap-3">
             {!isRestricted && (
                 <>
                    <button onClick={() => setShowStatsModal(true)} className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors border border-slate-200">
                        <BarChart3 size={18} className="text-indigo-600" /> <span className="hidden sm:inline">Estadísticas</span>
                    </button>
                    <button onClick={() => setShowHistoryModal(true)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"><History size={20} /></button>
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 rounded-lg font-semibold transition-colors shadow-sm"><Printer size={18} /> <span className="hidden sm:inline">Imprimir</span></button>
                 </>
             )}
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar print:overflow-visible print:h-auto">
          <div className="max-w-7xl mx-auto p-4 md:p-8 print:p-0 print:max-w-none print:w-full">
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 print:hidden mb-6">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><p className="text-xs text-slate-500 font-bold uppercase">Total Kg</p><p className="text-2xl font-bold text-slate-700">{formatDecimal(totalWeight)} <span className="text-sm font-normal text-slate-400">kg</span></p></div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><p className="text-xs text-slate-500 font-bold uppercase">Total Vendido</p><p className="text-2xl font-bold text-slate-700">{formatCurrency(totalSold)}</p></div>
                <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm"><p className="text-xs text-emerald-600 font-bold uppercase">Total Entregado</p><p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalPayment)}</p></div>
                <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm"><p className="text-xs text-rose-500 font-bold uppercase">Gastos</p><p className="text-2xl font-bold text-rose-500">{formatCurrency(totalExpenses)}</p></div>
                <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm ring-1 ring-indigo-500/20"><div className="flex items-center gap-2 mb-1"><Coins size={14} className="text-indigo-500" /><p className="text-xs text-indigo-600 font-bold uppercase">Efectivo</p></div><p className="text-2xl font-bold text-indigo-600">{formatCurrency(cashBalance)}</p></div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
                <div className="overflow-x-auto print:overflow-visible">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 print:border-slate-300">
                                <th className={`${cellPadding} py-1 text-left ${headerFontSize} font-black text-black sm:text-slate-600 uppercase tracking-wider border-r border-slate-200`}>Cliente</th>
                                <th className={`${cellPadding} py-1 text-left ${headerFontSize} font-bold text-slate-600 uppercase tracking-wider w-36 border-r border-slate-200 hidden md:table-cell`}>Articulo</th>
                                <th className={`${cellPadding} py-1 text-right ${headerFontSize} font-bold text-slate-600 uppercase tracking-wider w-20 border-r border-slate-200 hidden md:table-cell`}>Kg</th>
                                <th className={`${cellPadding} py-1 text-right ${headerFontSize} font-bold text-slate-600 uppercase tracking-wider w-24 border-r border-slate-200 hidden md:table-cell`}>Precio</th>
                                <th className={`${cellPadding} py-1 text-right ${headerFontSize} font-bold text-slate-600 uppercase tracking-wider w-28 border-r border-slate-200 hidden md:table-cell`}>Subtotal</th>
                                <th className={`${cellPadding} py-1 text-right ${headerFontSize} font-bold text-slate-600 uppercase tracking-wider w-28 border-r border-slate-200 whitespace-nowrap hidden md:table-cell`}>Saldo Ant</th>
                                <th className={`${cellPadding} py-1 text-right ${headerFontSize} font-bold text-emerald-600 uppercase tracking-wider w-28 border-r border-slate-200`}>Entrega</th>
                                <th className={`${cellPadding} py-1 text-right ${headerFontSize} font-bold text-slate-600 uppercase tracking-wider w-28`}>Saldo</th>
                                <th className="px-2 py-1 w-10 print:hidden"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 print:divide-slate-200">
                            {rows.map((row, index) => {
                                const subtotal = (row.weight || 0) * (row.price || 0);
                                const balance = subtotal + (row.prevBalance || 0) - (row.payment || 0);
                                const isExpanded = expandedId === row.id;
                                
                                return (
                                    <React.Fragment key={row.id}>
                                        <tr 
                                            onClick={() => toggleRow(row.id)}
                                            className={`hover:bg-slate-50 group cursor-pointer md:cursor-default ${index % 2 === 1 ? 'bg-slate-50/50' : ''}`}
                                        >
                                            <td className={`border-r border-slate-100 print:border-slate-200 ${rowHeight}`}>
                                                <div className="flex items-center gap-2">
                                                    <span className="md:hidden">
                                                        {isExpanded ? <ChevronUp size={14} className="text-black" /> : <ChevronDown size={14} className="text-black" />}
                                                    </span>
                                                    <TextInput value={row.client} onChange={(v) => handleRowChange(row.id, 'client', v)} className={`font-black text-black sm:font-bold sm:text-slate-800 ${fontSize}`} disabled={isRestricted && !row.isNew} />
                                                </div>
                                            </td>
                                            <td className={`border-r border-slate-100 print:border-slate-200 ${rowHeight} hidden md:table-cell`}>
                                                <ProductSelect value={row.product} onChange={(v) => handleRowChange(row.id, 'product', v)} className={`${fontSize} text-slate-700 font-medium`} />
                                            </td>
                                            <td className={`border-r border-slate-100 print:border-slate-200 ${rowHeight} hidden md:table-cell`}>
                                                <NumericInput value={row.weight} onChange={(v) => handleRowChange(row.id, 'weight', v)} className={`text-slate-700 text-right font-mono ${fontSize} font-medium`} />
                                            </td>
                                            <td className={`border-r border-slate-100 print:border-slate-200 ${rowHeight} hidden md:table-cell`}>
                                                <NumericInput value={row.price} onChange={(v) => handleRowChange(row.id, 'price', v)} className={`text-slate-700 text-right font-mono ${fontSize} font-medium`} isCurrency />
                                            </td>
                                            <td className={`border-r border-slate-100 print:border-slate-200 ${rowHeight} ${cellPadding} text-right hidden md:table-cell`}>
                                                <span className={`${fontSize} font-mono text-slate-600`}>{subtotal > 0 ? formatCurrency(subtotal) : '-'}</span>
                                            </td>
                                            <td className={`border-r border-slate-100 print:border-slate-200 ${rowHeight} hidden md:table-cell`}>
                                                 <NumericInput value={row.prevBalance} onChange={(v) => handleRowChange(row.id, 'prevBalance', v)} className={`text-slate-600 text-right font-mono ${fontSize} font-medium`} isCurrency disabled={isRestricted} />
                                            </td>
                                            <td className={`border-r border-slate-100 print:border-slate-200 ${rowHeight} bg-emerald-50/30`}>
                                                 <NumericInput value={row.payment} onChange={(v) => handleRowChange(row.id, 'payment', v)} className={`text-emerald-700 font-bold text-right font-mono ${fontSize}`} isCurrency />
                                            </td>
                                            <td className={`${rowHeight} ${cellPadding} text-right`}>
                                                <span className={`${fontSize} font-mono font-bold ${balance > 0 ? 'text-rose-600' : 'text-slate-500'}`}>{balance !== 0 ? formatCurrency(balance) : '-'}</span>
                                            </td>
                                            <td className="print:hidden px-1 text-center">
                                                {!isRestricted && <button onClick={() => removeRow(row.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>}
                                            </td>
                                        </tr>
                                        {/* Mobile Expansion List */}
                                        {isExpanded && (
                                            <tr className="md:hidden bg-slate-50/80 animate-in slide-in-from-top-1 duration-200">
                                                <td colSpan={10} className="p-4 border-b border-slate-200">
                                                    <div className="grid grid-cols-1 gap-3 text-sm">
                                                        <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                                                            <div className="flex items-center gap-2 text-black font-black uppercase text-[10px]"><Package size={14}/> Artículo</div>
                                                            <div className="flex-1 h-8 ml-4 border rounded bg-white">
                                                                <ProductSelect value={row.product} onChange={(v) => handleRowChange(row.id, 'product', v)} className="text-black font-black" />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                                                            <div className="flex items-center gap-2 text-black font-black uppercase text-[10px]"><Scale size={14}/> Kilos</div>
                                                            <div className="w-24 h-8 border rounded bg-white">
                                                                <NumericInput value={row.weight} onChange={(v) => handleRowChange(row.id, 'weight', v)} className="font-mono text-right font-black text-black" />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                                                            <div className="flex items-center gap-2 text-black font-black uppercase text-[10px]"><DollarSign size={14}/> Precio</div>
                                                            <div className="w-32 h-8 border rounded bg-white">
                                                                <NumericInput value={row.price} onChange={(v) => handleRowChange(row.id, 'price', v)} isCurrency className="font-mono text-right font-black text-black" />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                                                            <div className="flex items-center gap-2 text-black font-black uppercase text-[10px]"><ArrowUpRight size={14}/> Subtotal</div>
                                                            <div className="font-mono font-black text-black">{formatCurrency(subtotal)}</div>
                                                        </div>
                                                        <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                                                            <div className="flex items-center gap-2 text-black font-black uppercase text-[10px]"><History size={14}/> Saldo Ant</div>
                                                            <div className="w-32 h-8 border rounded bg-slate-50">
                                                                <NumericInput value={row.prevBalance} onChange={(v) => handleRowChange(row.id, 'prevBalance', v)} isCurrency disabled={isRestricted} className="font-mono text-right font-black text-black" />
                                                            </div>
                                                        </div>
                                                        {!isRestricted && (
                                                            <div className="flex justify-end pt-2">
                                                                <button onClick={(e) => { e.stopPropagation(); removeRow(row.id); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold">
                                                                    <Trash2 size={14}/> Eliminar Fila
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                            
                            {/* Footer */}
                            <tr className="border-t-2 border-slate-400 print:border-slate-600">
                                <td className={`${cellPadding} py-2 text-right font-bold text-slate-700 border-r border-slate-300 bg-slate-100 uppercase tracking-wider ${headerFontSize}`}></td>
                                <td className="hidden md:table-cell border-r border-slate-300 bg-slate-50"></td>
                                <td className="hidden md:table-cell border-r border-slate-300 bg-slate-50"></td>
                                <td className="hidden md:table-cell border-r border-slate-300 bg-slate-50"></td>
                                <td className={`${cellPadding} py-2 text-right font-bold text-slate-800 border-r border-slate-300 bg-slate-50 ${headerFontSize} hidden md:table-cell`}>{formatCurrency(totalSold)}</td>
                                <td className={`${cellPadding} py-2 text-right font-bold text-slate-800 border-r border-slate-300 bg-slate-50 ${headerFontSize} hidden md:table-cell`}>{formatCurrency(totalPrevBalance)}</td>
                                <td className={`${cellPadding} py-2 text-right font-bold text-emerald-700 border-r border-slate-300 bg-emerald-50 ${headerFontSize}`}>{formatCurrency(totalPayment)}</td>
                                <td className={`${cellPadding} py-2 text-right font-bold text-slate-900 bg-slate-50 ${headerFontSize}`}>{formatCurrency(finalBalance)}</td>
                                <td className="print:hidden"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Screen Metadata */}
            <div className="print:hidden mt-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-6 items-center">
                 <div className="flex items-center gap-2"><span className="text-xs font-bold text-slate-500 uppercase">Cargado (kg):</span><div className="w-24 h-10 bg-slate-50 rounded border border-slate-300"><NumericInput value={metadata.loadedChicken} onChange={(v) => saveMetadata({...metadata, loadedChicken: v})} className="font-bold text-slate-700 text-base" /></div></div>
                 <div className="flex items-center gap-2"><span className="text-xs font-bold text-slate-500 uppercase">Devolución (kg):</span><div className="w-24 h-10 bg-slate-50 rounded border border-slate-300"><NumericInput value={metadata.returnedChicken} onChange={(v) => saveMetadata({...metadata, returnedChicken: v})} className="font-bold text-slate-700 text-base" /></div></div>
                 <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 h-10"><AlertCircle size={16} className="text-slate-400" /><span className="text-xs font-bold text-slate-500 uppercase">Merma:</span><span className={`font-mono font-bold text-lg ${shrinkage > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>{formatDecimal(shrinkage)} kg</span></div>
            </div>

            <div className="mt-4 print:hidden"><button onClick={addRow} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors shadow-lg"><Plus size={18} /> Agregar Cliente</button></div>

            {/* Expenses Card */}
            <div className="mt-8 print:mt-4 flex flex-col md:flex-row print:flex-row gap-8 print:gap-4 items-start justify-between break-inside-avoid">
                <div className="flex-1 w-full max-w-2xl bg-white rounded-lg border border-slate-200 print:border-black overflow-hidden shadow-sm">
                    <div className="flex justify-between items-center px-4 py-2 bg-slate-50 print:bg-gray-100 border-b border-slate-200 print:border-black"><h3 className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2"><Receipt size={16} /> Gastos</h3><button onClick={addExpense} className="text-xs flex items-center gap-1 bg-white hover:bg-slate-100 px-2 py-1 rounded border border-slate-300 transition-colors text-black print:hidden"><Plus size={12} /> Agregar</button></div>
                    <table className="w-full text-left border-collapse">
                         <thead><tr className="border-b border-slate-200 print:border-black"><th className="px-3 py-2 text-left text-xs font-bold text-slate-600 uppercase border-r border-slate-200">Descripción</th><th className="px-3 py-2 text-right text-xs font-bold text-slate-600 uppercase w-28">Monto</th><th className="w-8 print:hidden"></th></tr></thead>
                         <tbody className="divide-y divide-slate-100">{expenses.map((exp) => (<tr key={exp.id} className="group hover:bg-slate-50"><td className="border-r border-slate-200 h-9"><TextInput value={exp.description} onChange={(v) => updateExpense(exp.id, 'description', v)} placeholder="Descripción..." className="text-sm text-slate-800 font-medium" /></td><td className="h-9 bg-rose-50/30 print:bg-transparent"><NumericInput value={exp.amount} onChange={(v) => updateExpense(exp.id, 'amount', v)} className="text-right text-sm font-mono text-rose-700 print:text-black font-bold" isCurrency /></td><td className="text-center print:hidden">{!isRestricted && <button onClick={() => removeExpense(exp.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>}</td></tr>))}{expenses.length === 0 && (<tr><td colSpan={2} className="px-3 py-6 text-center text-slate-400 text-xs italic">Sin gastos registrados</td><td className="print:hidden"></td></tr>)}</tbody>
                         <tfoot className="border-t border-slate-200 bg-slate-50"><tr><td className="px-3 py-2 text-right text-xs font-bold text-slate-600 border-r border-slate-200 uppercase">Total Gastos</td><td className="px-3 py-2 text-right text-sm font-black text-rose-600 font-mono">{formatCurrency(totalExpenses)}</td><td className="print:hidden"></td></tr></tfoot>
                    </table>
                </div>
                <div className="w-full md:w-auto flex-none"><div className="border border-slate-200 print:border-black rounded-lg overflow-hidden bg-white shadow-sm min-w-[200px]"><div className="bg-slate-50 px-4 py-2 border-b border-slate-200 text-center"><span className="text-sm font-black text-slate-700 uppercase tracking-wider">Saldo Efectivo</span></div><div className="p-4 flex items-center justify-center"><span className="text-3xl font-black font-mono text-indigo-600 print:text-black">{formatCurrency(cashBalance)}</span></div></div></div>
            </div>
          </div>
      </div>

      {showHistoryModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"><div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]"><div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50"><h3 className="font-bold text-slate-700 flex items-center gap-2"><History size={18} /> Historial</h3><button onClick={() => setShowHistoryModal(false)} className="p-1 hover:bg-slate-200 rounded text-slate-500"><X size={20} /></button></div><div className="flex-1 overflow-y-auto p-4 custom-scrollbar">{history.length === 0 ? (<p className="text-center text-slate-400 italic text-sm">No hay registros.</p>) : (<div className="space-y-3">{history.map(log => (<div key={log.id} className="text-sm border-l-2 border-slate-300 pl-3 py-1"><div className="flex justify-between items-start mb-1"><div className="flex items-center gap-2 text-xs text-slate-400"><Clock size={10} />{new Date(log.timestamp).toLocaleString('es-AR')}</div><span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${log.user === 'General' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>{log.user}</span></div><p className="text-slate-700">{log.description}</p></div>))}</div>)}</div></div></div>
      )}
    </div>
  );
};
