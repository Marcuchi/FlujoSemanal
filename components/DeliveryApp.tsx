
import React from 'react';
import { Database, ref, onValue, set } from 'firebase/database';
import { Calendar, Plus, Trash2, MapPin, Calculator, Printer, ChevronDown, History, X, Clock, Receipt, Wallet, Coins, AlertCircle } from 'lucide-react';
import { DeliveryRow, DeliveryHistoryLog, DeliveryExpense } from '../types';
import { generateId } from '../utils';
import { DayPickerModal } from './DayPickerModal';

interface DeliveryAppProps {
  db: Database | null;
  zoneName: string;
  isRestricted?: boolean;
}

const MALVINAS_CLIENTS = [
  "Agustin Malvinas", "Ale Malvinas", "Arriola", "Marcos Castro", "Baldo", 
  "Carlos Patria", "Pedro Cochabamba", "Carnes Walter", "Carolina Anacreonte", 
  "Cecilia V. Retiro", "Centro Comunitario", "Chavez", "Claudia Yapeyu", 
  "Dominguez", "Doña Chocha", "El Indio", "Fabrica de Pastas", "Nestor", 
  "Fany", "Carnes Cordoba", "Gabriel Cofico", "Gabriel Nuevo", "Baldo", 
  "Inspector Vaca", "Lorena Gaboto", "Polleria El Angel", "Macarena", 
  "Marcela", "Marcos Suipacha", "Matias Chino", "Matias Lopez", "Sol", 
  "La Boqueria", "Oviedo", "Polaco", "Polleria Serapio", "Pablo Sahar", 
  "Ric Cervantes", "Colon B", "Colon Federico", "Eric Colon", "Carlos Eco", 
  "Baigorri 133", "Carnes Emanuel", "La Rivieri", "Cipruz", "Jorge Salcedo", 
  "Ruta 20", "Ochetti Paola", "Don segundo", "El Dani"
];

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
            <div className={`w-full h-full flex items-center px-1 ${alignment} ${className}`}>
                {displayValue}
            </div>
        );
    }

    if (!isEditing) {
        return (
            <div 
                onClick={() => setIsEditing(true)}
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
            className={`bg-transparent w-full h-full px-1 focus:outline-none focus:bg-indigo-50 transition-all placeholder-slate-400 print:placeholder-transparent ${className}`}
        />
    );
};

// --- TextInput (Commits on Blur) ---
const TextInput = ({ 
    value, 
    onChange, 
    placeholder = "",
    className = ""
  }: { 
    value: string, 
    onChange: (val: string) => void,
    placeholder?: string,
    className?: string
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

    if (!isEditing) {
        return (
            <div 
                onClick={() => setIsEditing(true)}
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
                onClick={() => setIsEditing(true)}
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
  // Fix timezone issue by initializing with local date manually
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
  
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [showHistoryModal, setShowHistoryModal] = React.useState(false);

  React.useEffect(() => {
    if (isRestricted) {
        setCurrentDate(getLocalDateString(new Date()));
    }
  }, [isRestricted]);

  const isEmptyRow = (r: DeliveryRow) => {
      return (!r.client || r.client.trim() === '') && 
             (!r.product || r.product === '') && 
             (!r.weight || r.weight === 0) && 
             (!r.price || r.price === 0) && 
             (!r.prevBalance || r.prevBalance === 0) && 
             (!r.payment || r.payment === 0);
  };

  // Load Data
  React.useEffect(() => {
    const dataKey = `deliveries/${zoneName}/${currentDate}`;
    const expensesKey = `delivery_expenses/${zoneName}/${currentDate}`;
    const historyKey = `deliveries_history/${zoneName}/${currentDate}`;
    const metaKey = `deliveries_metadata/${zoneName}/${currentDate}`;
    
    setLoading(true);

    if (db) {
      // 1. Data Listener
      const deliveryRef = ref(db, dataKey);
      const unsubscribeData = onValue(deliveryRef, (snapshot) => {
        const val = snapshot.val();
        if (val) {
           const loadedRows = val as DeliveryRow[];
           // Filter "ghost" empty rows if not Malvinas
           if (zoneName.toLowerCase() !== 'malvinas') {
               setRows(loadedRows.filter(r => !isEmptyRow(r)));
           } else {
               setRows(loadedRows);
           }
        } else {
           if (zoneName.toLowerCase() === 'malvinas') {
               // Only actual clients, no extra empty rows
               const initRows = MALVINAS_CLIENTS.map(name => ({
                   id: generateId() + Math.random().toString(36).substring(7),
                   client: name,
                   product: '',
                   weight: 0,
                   price: 0,
                   prevBalance: 0,
                   payment: 0
               }));
               setRows(initRows);
           } else {
               setRows([]);
           }
        }
      });

      // 2. Expenses Listener
      const expensesRef = ref(db, expensesKey);
      const unsubscribeExpenses = onValue(expensesRef, (snapshot) => {
          const val = snapshot.val();
          setExpenses(val ? (val as DeliveryExpense[]) : []);
      });

      // 3. History Listener
      const historyRef = ref(db, historyKey);
      const unsubscribeHistory = onValue(historyRef, (snapshot) => {
          const val = snapshot.val();
          setHistory(val ? (Object.values(val) as DeliveryHistoryLog[]) : []);
      });

      // 4. Metadata Listener
      const metaRef = ref(db, metaKey);
      const unsubscribeMeta = onValue(metaRef, (snapshot) => {
          const val = snapshot.val();
          if (val) setMetadata(val);
          else setMetadata({ loadedChicken: 0, returnedChicken: 0 });
      });

      setLoading(false);

      return () => {
        unsubscribeData();
        unsubscribeExpenses();
        unsubscribeHistory();
        unsubscribeMeta();
      };
    } else {
      // Local Storage Fallback
      const loadedRows = localStorage.getItem(dataKey);
      const loadedExpenses = localStorage.getItem(expensesKey);
      const loadedHistory = localStorage.getItem(historyKey);
      const loadedMeta = localStorage.getItem(metaKey);
      
      if (loadedRows) {
          const parsed = JSON.parse(loadedRows);
          if (zoneName.toLowerCase() !== 'malvinas') {
               setRows(parsed.filter((r: DeliveryRow) => !isEmptyRow(r)));
           } else {
               setRows(parsed);
           }
      }
      else if (zoneName.toLowerCase() === 'malvinas') {
           const initRows = MALVINAS_CLIENTS.map(name => ({
               id: generateId() + Math.random().toString(36).substring(7),
               client: name,
               product: '',
               weight: 0,
               price: 0,
               prevBalance: 0,
               payment: 0
           }));
           setRows(initRows);
      } else {
          setRows([]);
      }

      if (loadedExpenses) setExpenses(JSON.parse(loadedExpenses));
      else setExpenses([]);

      if (loadedHistory) setHistory(JSON.parse(loadedHistory));
      else setHistory([]);
      
      if (loadedMeta) setMetadata(JSON.parse(loadedMeta));
      else setMetadata({ loadedChicken: 0, returnedChicken: 0 });

      setLoading(false);
    }
  }, [db, zoneName, currentDate]);

  const saveData = (newRows: DeliveryRow[]) => {
    const dataKey = `deliveries/${zoneName}/${currentDate}`;
    if (db) {
      set(ref(db, dataKey), newRows);
    } else {
      setRows(newRows);
      localStorage.setItem(dataKey, JSON.stringify(newRows));
    }
  };

  const saveExpenses = (newExpenses: DeliveryExpense[]) => {
      const expensesKey = `delivery_expenses/${zoneName}/${currentDate}`;
      if (db) {
          set(ref(db, expensesKey), newExpenses);
      } else {
          setExpenses(newExpenses);
          localStorage.setItem(expensesKey, JSON.stringify(newExpenses));
      }
  };

  const logHistory = (description: string) => {
    const newLog: DeliveryHistoryLog = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        description
    };
    const newHistory = [newLog, ...history];
    const historyKey = `deliveries_history/${zoneName}/${currentDate}`;
    
    if (db) {
        set(ref(db, historyKey), newHistory);
    } else {
        setHistory(newHistory);
        localStorage.setItem(historyKey, JSON.stringify(newHistory));
    }
  };

  const saveMetadata = (newMeta: typeof metadata) => {
      const metaKey = `deliveries_metadata/${zoneName}/${currentDate}`;
      if (db) {
          set(ref(db, metaKey), newMeta);
      } else {
          setMetadata(newMeta);
          localStorage.setItem(metaKey, JSON.stringify(newMeta));
      }
  };

  const handleRowChange = (id: string, field: keyof DeliveryRow, value: any) => {
    const oldRow = rows.find(r => r.id === id);
    if (!oldRow) return;

    const newRows = rows.map(row => {
      if (row.id === id) {
        const updated = { ...row, [field]: value };
        return updated;
      }
      return row;
    });
    saveData(newRows);
  };

  const addRow = () => {
    const newRow: DeliveryRow = {
      id: generateId(),
      client: '',
      product: '',
      weight: 0,
      price: 0,
      prevBalance: 0,
      payment: 0
    };
    saveData([...rows, newRow]);
  };

  const removeRow = (id: string) => {
      if(window.confirm("¿Eliminar fila?")) {
          const rowToDelete = rows.find(r => r.id === id);
          if (rowToDelete) logHistory(`Eliminado cliente: ${rowToDelete.client || 'Sin nombre'}`);
          saveData(rows.filter(r => r.id !== id));
      }
  };

  // Expense Handlers
  const addExpense = () => {
      const newExp: DeliveryExpense = {
          id: generateId(),
          description: '',
          amount: 0
      };
      saveExpenses([...expenses, newExp]);
  };

  const updateExpense = (id: string, field: keyof DeliveryExpense, value: any) => {
      const newExpenses = expenses.map(e => e.id === id ? { ...e, [field]: value } : e);
      saveExpenses(newExpenses);
  };

  const removeExpense = (id: string) => {
      if(window.confirm("¿Eliminar gasto?")) {
          saveExpenses(expenses.filter(e => e.id !== id));
      }
  };

  // Calculations
  const totalWeight = rows.reduce((acc, row) => acc + (row.weight || 0), 0);
  const totalPayment = rows.reduce((acc, row) => acc + (row.payment || 0), 0);
  const totalSold = rows.reduce((acc, row) => acc + ((row.weight || 0) * (row.price || 0)), 0);
  const totalExpenses = expenses.reduce((acc, exp) => acc + (exp.amount || 0), 0);
  
  const finalBalance = rows.reduce((acc, row) => {
      const subtotal = (row.weight || 0) * (row.price || 0);
      const rowBal = subtotal + (row.prevBalance || 0) - (row.payment || 0);
      return acc + rowBal;
  }, 0);

  const cashBalance = totalPayment - totalExpenses;
  
  const netLoad = (metadata.loadedChicken || 0) - (metadata.returnedChicken || 0);
  const shrinkage = netLoad - totalWeight;

  const handlePrint = () => {
      window.print();
  };

  if (loading) return <div className="text-emerald-400 p-8 animate-pulse text-center">Cargando Planilla...</div>;

  return (
    <div className="h-full flex flex-col bg-slate-100 overflow-hidden print:overflow-visible print:h-auto print:bg-white">
      <style>{`
        @media print {
            @page {
                size: A4;
                margin: 5mm;
            }
            body, #root, .bg-slate-950, .bg-slate-100, .bg-white {
                background-color: white !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                font-family: sans-serif;
            }
            .no-print {
                display: none !important;
            }
            /* Aggressively remove all background colors in print */
            [class*="bg-"] {
                background-color: white !important;
            }
            * {
                box-shadow: none !important;
                text-shadow: none !important;
                overflow: visible !important;
            }
            /* Table Styling for Excel-like look */
            table {
                border-collapse: collapse !important;
                width: 100%;
                background-color: white !important;
            }
            tr {
                height: 20px !important; 
            }
            th, td {
                border: 1px solid #000 !important;
                padding: 0px 2px !important;
                background-color: white !important;
                color: black !important;
                font-size: 11px !important; 
                line-height: 1.1 !important;
                height: 20px !important; 
            }
            /* Force all text black in print */
            th *, td *, div, span, p, h1, h2, h3, h4, input, select {
                color: #000000 !important;
            }
            thead th {
                background-color: white !important;
                color: #000000 !important;
                font-weight: bold !important;
                font-size: 10px !important; 
            }
        }
      `}</style>

      {/* Top Bar - Controls */}
      <div className="flex-none bg-white border-b border-slate-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4 print:hidden z-10">
         <div className="flex items-center gap-4">
             <div className="relative">
                <button 
                    onClick={() => !isRestricted && setShowDatePicker(!showDatePicker)}
                    className={`flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold border border-slate-300 transition-colors ${isRestricted ? 'cursor-default opacity-80' : ''}`}
                >
                    <Calendar size={18} className="text-emerald-600" />
                    {(() => {
                        const [y, m, d] = currentDate.split('-').map(Number);
                        const dateObj = new Date(y, m - 1, d);
                        return dateObj.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
                    })()}
                    {!isRestricted && <ChevronDown size={14} />}
                </button>
                <DayPickerModal 
                    isOpen={showDatePicker} 
                    onClose={() => setShowDatePicker(false)} 
                    currentDate={new Date(currentDate + 'T12:00:00')} 
                    onSelectDate={(d) => {
                        setCurrentDate(getLocalDateString(d));
                        setShowDatePicker(false);
                    }}
                />
             </div>
             
             <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                <MapPin size={16} />
                <span className="font-semibold uppercase">{zoneName}</span>
             </div>
         </div>

         <div className="flex items-center gap-3">
             <button 
                onClick={() => setShowHistoryModal(true)}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors relative"
                title="Historial de cambios"
             >
                <History size={20} />
             </button>
             <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 rounded-lg font-semibold transition-colors shadow-sm"
             >
                <Printer size={18} />
                <span className="hidden sm:inline">Imprimir</span>
             </button>
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar print:overflow-visible print:h-auto">
          
          <div className="max-w-7xl mx-auto p-4 md:p-8 print:p-0 print:max-w-none print:w-full">
            
            {/* Summary Cards (Screen Only) */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 print:hidden mb-6">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500 font-bold uppercase">Total Kg Entregados</p>
                    <p className="text-2xl font-bold text-slate-700">{formatDecimal(totalWeight)} <span className="text-sm font-normal text-slate-400">kg</span></p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500 font-bold uppercase">Total Vendido</p>
                    <p className="text-2xl font-bold text-slate-700">{formatCurrency(totalSold)}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                    <p className="text-xs text-emerald-600 font-bold uppercase">Total Entregado</p>
                    <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalPayment)}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm">
                    <p className="text-xs text-rose-500 font-bold uppercase">Gastos</p>
                    <p className="text-2xl font-bold text-rose-500">{formatCurrency(totalExpenses)}</p>
                </div>
                 <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm ring-1 ring-indigo-500/20">
                    <div className="flex items-center gap-2 mb-1">
                        <Coins size={14} className="text-indigo-500" />
                        <p className="text-xs text-indigo-600 font-bold uppercase">Efectivo</p>
                    </div>
                    <p className="text-2xl font-bold text-indigo-600">{formatCurrency(cashBalance)}</p>
                </div>
            </div>

            {/* Print Header (Visible only in print) */}
            <div className="hidden print:block mb-1">
                 <div className="flex justify-between items-end pb-1 mb-1 border-b border-black">
                     <div>
                         <h1 className="text-lg font-bold text-black uppercase tracking-tight leading-none">Planilla de Reparto</h1>
                         <div className="flex items-center gap-4 mt-1">
                             <div className="flex items-center gap-1">
                                 <span className="font-bold text-black text-xs">ZONA:</span>
                                 <span className="text-base font-bold text-black uppercase leading-none">{zoneName}</span>
                             </div>
                             <div className="w-px h-3 bg-black"></div>
                             <div className="flex items-center gap-1">
                                 <span className="font-bold text-black text-xs">FECHA:</span>
                                 <span className="text-base font-bold text-black leading-none">
                                     {(() => {
                                        const [y, m, d] = currentDate.split('-').map(Number);
                                        const dateObj = new Date(y, m - 1, d);
                                        return dateObj.toLocaleDateString('es-AR');
                                    })()}
                                 </span>
                             </div>
                         </div>
                     </div>
                     <div className="text-right">
                         <div className="text-xs font-bold text-black uppercase">Avícola Alpina</div>
                     </div>
                 </div>
                 
                 {/* Metadata Section (Compact) */}
                 <div className="flex gap-4 mb-2 text-xs">
                     <div className="flex items-center gap-1">
                         <span className="font-bold text-black uppercase">Cargado:</span>
                         <span className="font-mono font-bold text-black">{formatDecimal(metadata.loadedChicken)} kg</span>
                     </div>
                     <div className="flex items-center gap-1">
                         <span className="font-bold text-black uppercase">Devolución:</span>
                         <span className="font-mono font-bold text-black">{formatDecimal(metadata.returnedChicken)} kg</span>
                     </div>
                     <div className="flex items-center gap-1">
                         <span className="font-bold text-black uppercase">Merma:</span>
                         <span className="font-mono font-bold text-black">{formatDecimal(shrinkage)} kg</span>
                     </div>
                 </div>
            </div>

            {/* Metadata Inputs (Screen only) */}
            <div className="print:hidden bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-wrap gap-6 items-center">
                 <div className="flex items-center gap-2">
                     <span className="text-xs font-bold text-slate-500 uppercase">Pollo Cargado (kg):</span>
                     <div className="w-24 h-10 bg-slate-50 rounded border border-slate-300">
                        <NumericInput 
                            value={metadata.loadedChicken} 
                            onChange={(v) => saveMetadata({...metadata, loadedChicken: v})} 
                            className="font-bold text-slate-700 text-base"
                        />
                     </div>
                 </div>
                 <div className="flex items-center gap-2">
                     <span className="text-xs font-bold text-slate-500 uppercase">Devolución (kg):</span>
                     <div className="w-24 h-10 bg-slate-50 rounded border border-slate-300">
                        <NumericInput 
                            value={metadata.returnedChicken} 
                            onChange={(v) => saveMetadata({...metadata, returnedChicken: v})} 
                            className="font-bold text-slate-700 text-base"
                        />
                     </div>
                 </div>
                 <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 h-10">
                     <AlertCircle size={16} className="text-slate-400" />
                     <span className="text-xs font-bold text-slate-500 uppercase">Merma:</span>
                     <span className={`font-mono font-bold text-lg ${shrinkage > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                         {formatDecimal(shrinkage)} kg
                     </span>
                 </div>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden print:shadow-none print:border-none print:rounded-none print:overflow-visible">
                <div className="overflow-x-auto print:overflow-visible">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 print:bg-white print:border-black">
                                <th className="px-2 py-1 text-left text-base print:text-[10px] print:py-0 font-bold text-slate-600 print:text-black uppercase tracking-wider border-r border-slate-200 print:border-black">Cliente</th>
                                <th className="px-2 py-1 text-left text-base print:text-[10px] print:py-0 font-bold text-slate-600 print:text-black uppercase tracking-wider w-36 print:w-24 border-r border-slate-200 print:border-black">Articulo</th>
                                <th className="px-2 py-1 text-right text-base print:text-[10px] print:py-0 font-bold text-slate-600 print:text-black uppercase tracking-wider w-20 print:w-12 border-r border-slate-200 print:border-black">Kg</th>
                                <th className="px-2 py-1 text-right text-base print:text-[10px] print:py-0 font-bold text-slate-600 print:text-black uppercase tracking-wider w-24 print:w-14 border-r border-slate-200 print:border-black">Precio</th>
                                <th className="px-2 py-1 text-right text-base print:text-[10px] print:py-0 font-bold text-slate-600 print:text-black uppercase tracking-wider w-28 print:w-16 border-r border-slate-200 print:border-black">Subtotal</th>
                                <th className="px-2 py-1 text-right text-base print:text-[10px] print:py-0 font-bold text-slate-600 print:text-black uppercase tracking-wider w-28 print:w-16 border-r border-slate-200 print:border-black whitespace-nowrap">Saldo Ant</th>
                                <th className="px-2 py-1 text-right text-base print:text-[10px] print:py-0 font-bold text-emerald-600 print:text-black uppercase tracking-wider w-28 print:w-16 border-r border-slate-200 print:border-black">Entrega</th>
                                <th className="px-2 py-1 text-right text-base print:text-[10px] print:py-0 font-bold text-slate-600 print:text-black uppercase tracking-wider w-28 print:w-16">Saldo</th>
                                <th className="px-2 py-1 w-10 print:hidden"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                            {rows.map((row, index) => {
                                const subtotal = (row.weight || 0) * (row.price || 0);
                                const balance = subtotal + (row.prevBalance || 0) - (row.payment || 0);
                                const isAlternate = index % 2 === 1;
                                
                                return (
                                    <tr key={row.id} className={`hover:bg-slate-50 print:hover:bg-transparent group ${isAlternate ? 'print:bg-transparent' : ''}`}>
                                        <td className="border-r border-slate-100 print:border-black h-11 print:h-[20px]">
                                            <TextInput 
                                                value={row.client} 
                                                onChange={(v) => handleRowChange(row.id, 'client', v)} 
                                                className="font-bold text-slate-800 text-base print:text-[11px] print:text-black print:leading-none"
                                            />
                                        </td>
                                        <td className="border-r border-slate-100 print:border-black h-11 print:h-[20px]">
                                            <ProductSelect 
                                                value={row.product} 
                                                onChange={(v) => handleRowChange(row.id, 'product', v)} 
                                                className="text-base text-slate-700 font-medium print:text-[11px] print:text-black print:leading-none"
                                            />
                                        </td>
                                        <td className="border-r border-slate-100 print:border-black h-11 print:h-[20px]">
                                            <NumericInput 
                                                value={row.weight} 
                                                onChange={(v) => handleRowChange(row.id, 'weight', v)} 
                                                className="text-slate-700 text-right font-mono text-base font-medium print:text-[11px] print:text-black print:leading-none"
                                            />
                                        </td>
                                        <td className="border-r border-slate-100 print:border-black h-11 print:h-[20px]">
                                            <NumericInput 
                                                value={row.price} 
                                                onChange={(v) => handleRowChange(row.id, 'price', v)} 
                                                className="text-slate-700 text-right font-mono text-base font-medium print:text-[11px] print:text-black print:leading-none"
                                                isCurrency
                                            />
                                        </td>
                                        <td className="border-r border-slate-100 print:border-black h-11 print:h-[20px] px-2 text-right">
                                            <span className="text-base font-mono text-slate-600 print:text-[11px] print:text-black print:leading-none">
                                                {subtotal > 0 ? formatCurrency(subtotal) : '-'}
                                            </span>
                                        </td>
                                        <td className="border-r border-slate-100 print:border-black h-11 print:h-[20px]">
                                             <NumericInput 
                                                value={row.prevBalance} 
                                                onChange={(v) => handleRowChange(row.id, 'prevBalance', v)} 
                                                className="text-slate-600 text-right font-mono text-base font-medium print:text-[11px] print:text-black print:leading-none"
                                                isCurrency
                                            />
                                        </td>
                                        <td className="border-r border-slate-100 print:border-black h-11 print:h-[20px] bg-emerald-50/30 print:bg-transparent">
                                             <NumericInput 
                                                value={row.payment} 
                                                onChange={(v) => handleRowChange(row.id, 'payment', v)} 
                                                className="text-emerald-700 print:text-black font-bold text-right font-mono text-base print:text-[11px] print:leading-none"
                                                isCurrency
                                            />
                                        </td>
                                        <td className="h-11 print:h-[20px] px-2 text-right print:border print:border-black">
                                            <span className={`text-base font-mono font-bold print:text-[11px] print:text-black print:leading-none ${balance > 0 ? 'text-rose-600 print:text-black' : 'text-slate-500'}`}>
                                                {balance !== 0 ? formatCurrency(balance) : '-'}
                                            </span>
                                        </td>
                                        <td className="print:hidden px-1 text-center">
                                            <button 
                                                onClick={() => removeRow(row.id)}
                                                className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            
                            {/* Footer Totals Row */}
                            <tr className="border-t-2 border-slate-400 print:border-black">
                                <td colSpan={4} className="px-2 py-2 print:py-[1px] text-right font-bold text-slate-700 border-r border-slate-300 bg-slate-100 print:bg-white uppercase tracking-wider text-base print:text-[11px] print:text-black print:border-black">TOTALES</td>
                                <td className="px-2 py-2 print:py-[1px] text-right font-bold text-slate-800 border-r border-slate-300 bg-slate-50 print:bg-white text-base print:text-[11px] print:text-black print:border-black">{formatCurrency(totalSold)}</td>
                                <td className="px-2 py-2 print:py-[1px] text-right font-bold text-slate-800 border-r border-slate-300 bg-slate-50 print:bg-white text-base print:text-[11px] print:text-black print:border-black">-</td>
                                <td className="px-2 py-2 print:py-[1px] text-right font-bold text-emerald-700 print:text-black border-r border-slate-300 bg-emerald-50 print:bg-white text-base print:text-[11px] print:border-black">{formatCurrency(totalPayment)}</td>
                                <td className="px-2 py-2 print:py-[1px] text-right font-bold text-slate-900 bg-slate-50 print:bg-white text-base print:text-[11px] print:text-black print:border-black">{formatCurrency(finalBalance)}</td>
                                <td className="print:hidden"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Row Button (Screen) */}
            <div className="mt-4 print:hidden">
                <button 
                    onClick={addRow}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors shadow-lg shadow-indigo-500/20"
                >
                    <Plus size={18} /> Agregar Cliente
                </button>
            </div>

            {/* Expenses Section & Print Summary */}
            <div className="mt-8 print:mt-1 flex flex-col md:flex-row gap-8 print:gap-4 break-inside-avoid">
                
                {/* Expenses Table (Screen & Print adapted) */}
                <div className="flex-1 print:hidden">
                    <div className="flex justify-between items-center mb-2">
                         <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                            <Receipt size={16} /> Gastos
                         </h3>
                         <button onClick={addExpense} className="text-xs flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded border border-slate-300 transition-colors text-black">
                             <Plus size={12} /> Agregar
                         </button>
                    </div>
                    
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                             <thead>
                                <tr className="bg-slate-100 border-b border-slate-300">
                                    <th className="px-2 py-1 text-left text-sm font-semibold text-slate-600 uppercase border-r border-slate-300">Descripción</th>
                                    <th className="px-2 py-1 text-right text-sm font-semibold text-slate-600 uppercase w-24">Monto</th>
                                    <th className="w-8"></th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-100">
                                 {expenses.map((exp, index) => (
                                     <tr key={exp.id} className="group hover:bg-slate-50">
                                         <td className="border-r border-slate-100 h-10">
                                             <TextInput 
                                                value={exp.description}
                                                onChange={(v) => updateExpense(exp.id, 'description', v)}
                                                placeholder="Descripción del gasto"
                                                className="text-base text-slate-700"
                                             />
                                         </td>
                                         <td className="h-10 bg-rose-50/30">
                                             <NumericInput 
                                                value={exp.amount}
                                                onChange={(v) => updateExpense(exp.id, 'amount', v)}
                                                className="text-right text-base font-mono text-rose-600 font-medium"
                                                isCurrency
                                             />
                                         </td>
                                         <td className="text-center">
                                             <button onClick={() => removeExpense(exp.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100">
                                                 <Trash2 size={12} />
                                             </button>
                                         </td>
                                     </tr>
                                 ))}
                                 {expenses.length === 0 && (
                                     <tr>
                                         <td colSpan={2} className="px-2 py-4 text-center text-slate-400 text-sm italic">Sin gastos</td>
                                         <td></td>
                                     </tr>
                                 )}
                             </tbody>
                             <tfoot className="border-t border-slate-300 bg-slate-50">
                                 <tr>
                                     <td className="px-2 py-1 text-right text-sm font-bold text-slate-600 border-r border-slate-300">TOTAL</td>
                                     <td className="px-2 py-1 text-right text-sm font-bold text-rose-600 font-mono">{formatCurrency(totalExpenses)}</td>
                                     <td></td>
                                 </tr>
                             </tfoot>
                        </table>
                    </div>
                </div>

                {/* Print-only Footer: Expenses & Summary */}
                <div className="hidden print:flex flex-row gap-4 w-full text-[11px]">
                    {/* Expenses Table */}
                    <div className="flex-1">
                        <div className="font-bold mb-1">GASTOS</div>
                        <table className="w-full border-collapse border border-black">
                            <tbody>
                                {expenses.map(e => (
                                    <tr key={e.id}>
                                        <td className="border border-black px-1">{e.description}</td>
                                        <td className="border border-black px-1 text-right w-16">{formatCurrency(e.amount)}</td>
                                    </tr>
                                ))}
                                <tr>
                                    <td className="border border-black px-1 font-bold text-right">TOTAL GASTOS</td>
                                    <td className="border border-black px-1 font-bold text-right">{formatCurrency(totalExpenses)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Final Summary Table */}
                    <div className="w-48">
                        <div className="font-bold mb-1">RESUMEN</div>
                        <table className="w-full border-collapse border border-black">
                            <tbody>
                                <tr>
                                    <td className="border border-black px-1">Total Vendido</td>
                                    <td className="border border-black px-1 text-right">{formatCurrency(totalSold)}</td>
                                </tr>
                                <tr>
                                    <td className="border border-black px-1">Total Entrega</td>
                                    <td className="border border-black px-1 text-right">{formatCurrency(totalPayment)}</td>
                                </tr>
                                <tr>
                                    <td className="border border-black px-1">Total Gastos</td>
                                    <td className="border border-black px-1 text-right">{formatCurrency(totalExpenses)}</td>
                                </tr>
                                <tr>
                                    <td className="border border-black px-1 font-bold">EFECTIVO</td>
                                    <td className="border border-black px-1 font-bold text-right">{formatCurrency(cashBalance)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Screen-only Summary Footer */}
                <div className="w-full md:w-64 print:hidden">
                    <div className="bg-slate-50 border border-slate-300 rounded overflow-hidden">
                         <div className="flex justify-between items-center p-3 bg-indigo-50 border-t-2 border-slate-300">
                             <span className="text-sm font-extrabold text-indigo-700 uppercase">EFECTIVO</span>
                             <span className="text-lg font-bold font-mono text-indigo-700">{formatCurrency(cashBalance)}</span>
                        </div>
                    </div>
                </div>

            </div>

          </div>
      </div>

      {/* History Modal */}
      {showHistoryModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
                  <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-slate-700 flex items-center gap-2">
                          <History size={18} /> Historial de Cambios
                      </h3>
                      <button onClick={() => setShowHistoryModal(false)} className="p-1 hover:bg-slate-200 rounded text-slate-500">
                          <X size={20} />
                      </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                      {history.length === 0 ? (
                          <p className="text-center text-slate-400 italic text-sm">No hay registros recientes.</p>
                      ) : (
                          <div className="space-y-3">
                              {history.map(log => (
                                  <div key={log.id} className="text-sm border-l-2 border-slate-300 pl-3 py-1">
                                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                                          <Clock size={10} />
                                          {new Date(log.timestamp).toLocaleString('es-AR')}
                                      </div>
                                      <p className="text-slate-700">{log.description}</p>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
