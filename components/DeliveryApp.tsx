
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
  "Carnes Cordoba",
  "Macarena",
  "Oviedo",
  "Pablo Sahar",
  "Colon Federico",
  "Eric Colon",
  "La Rivieri",
  "Cipruz",
  "Ochetti Paola"
];

const RODOLFO_CLIENTS = [
  "La Vida", "Fratelli", "Bodereau", "Greco", "Zoe", "Policiales", 
  "Polleria Quilpo", "Giacon", "Panadero", "Kevin", "Tomas", "Ale", 
  "Zipoli", "Bustos", "H Granja JB Justo", "Jaquelin", "Mafequin", 
  "Medrano", "Nilda", "Fragueiro"
];

const GARBINO_CLIENTS = [
  "Fazzio", "Alejandro", "Andres Nueva", "Machuca", "Bar Ricota", "Bar Torroija", 
  "Bonina", "Ciacci", "El Pollo Verdulero", "Mafalda", "Luisa", "Gluttony", 
  "Gonzalo", "Hermanas Dominicas", "Hiper Granja Centro", "Jorge Av. Roca", 
  "Fede Garbino", "La Aldea", "La Granja", "La Piaina", "La Tradicion", 
  "Mandarina", "Mariano Cnel Olmedo", "Mario Tozzini", "Martha", "Mauri II Carmelo", 
  "Mercadito Poeta", "Mirian", "Nahuel Bohedo", "NIC", "Ocaña", "Olmos", 
  "Pavelaneda", "Pablo Sahar", "Pablo Sol de Mayo", "Paola Rio Segundo", "Petty", 
  "Quality", "Rodeo", "Salta Bar", "Visionari", "Carmen Cochabamba", "Carmelo", 
  "H Granja Pech", "Garbino Polleria", "Romina", "San Agustin", "Club de la Carne", 
  "Vaca Polleria", "Vaca Carniceria", "Nicolas Trejo"
];

const FLORES_CLIENTS = [
  "Diego Malagueño", "Lammoglia", "Matias Anizacate", "Antolufe", "Susana", 
  "Luz", "Ceci Anizacate", "Los Hermanos", "Ricardo", "Melina", 
  "Omar", "Popollo", "Vale", "Carnes Dante", "Natural Mystic", 
  "Fernando", "Marcela", "S Roque", "Seba Geiser", "Leo", 
  "De Todo", "La Boutique"
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

    const isMalvinas = zoneName.toLowerCase() === 'malvinas';
    const isRodolfo = zoneName.toLowerCase() === 'rodolfo';
    const isGarbino = zoneName.toLowerCase() === 'garbino';
    const isFlores = zoneName.toLowerCase() === 'flores';

    if (db) {
      // 1. Data Listener
      const deliveryRef = ref(db, dataKey);
      const unsubscribeData = onValue(deliveryRef, (snapshot) => {
        const val = snapshot.val();
        if (val) {
           const loadedRows = val as DeliveryRow[];
           // Filter "ghost" empty rows if not Malvinas, Rodolfo, Garbino or Flores
           if (!isMalvinas && !isRodolfo && !isGarbino && !isFlores) {
               setRows(loadedRows.filter(r => !isEmptyRow(r)));
           } else {
               setRows(loadedRows);
           }
        } else {
           if (isMalvinas) {
               // Init Malvinas
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
           } else if (isRodolfo) {
               // Init Rodolfo
               const initRows = RODOLFO_CLIENTS.map(name => ({
                   id: generateId() + Math.random().toString(36).substring(7),
                   client: name,
                   product: '',
                   weight: 0,
                   price: 0,
                   prevBalance: 0,
                   payment: 0
               }));
               setRows(initRows);
           } else if (isGarbino) {
               // Init Garbino
               const initRows = GARBINO_CLIENTS.map(name => ({
                   id: generateId() + Math.random().toString(36).substring(7),
                   client: name,
                   product: '',
                   weight: 0,
                   price: 0,
                   prevBalance: 0,
                   payment: 0
               }));
               setRows(initRows);
           } else if (isFlores) {
               // Init Flores
               const initRows = FLORES_CLIENTS.map(name => ({
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
          if (!isMalvinas && !isRodolfo && !isGarbino && !isFlores) {
               setRows(parsed.filter((r: DeliveryRow) => !isEmptyRow(r)));
           } else {
               setRows(parsed);
           }
      }
      else if (isMalvinas) {
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
      }
      else if (isRodolfo) {
           const initRows = RODOLFO_CLIENTS.map(name => ({
               id: generateId() + Math.random().toString(36).substring(7),
               client: name,
               product: '',
               weight: 0,
               price: 0,
               prevBalance: 0,
               payment: 0
           }));
           setRows(initRows);
      } 
      else if (isGarbino) {
           const initRows = GARBINO_CLIENTS.map(name => ({
               id: generateId() + Math.random().toString(36).substring(7),
               client: name,
               product: '',
               weight: 0,
               price: 0,
               prevBalance: 0,
               payment: 0
           }));
           setRows(initRows);
      }
      else if (isFlores) {
           const initRows = FLORES_CLIENTS.map(name => ({
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
  const totalPrevBalance = rows.reduce((acc, row) => acc + (row.prevBalance || 0), 0);
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
                /* LEFT MARGIN 25mm FOR HOLE PUNCHING, 10mm others */
                margin: 5mm 5mm 5mm 25mm;
            }
            body {
                background-color: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            /* Hide UI Elements */
            .no-print, button, header, .z-50, .print\\:hidden {
                display: none !important;
            }
            
            /* Expand Containers for Print */
            #root, .h-full, .overflow-y-auto, .overflow-x-auto, .flex-col {
                height: auto !important;
                overflow: visible !important;
                display: block !important;
            }

            /* Scale content to fit A4 width without cutting */
            .max-w-7xl {
                max-width: none !important;
                width: 100% !important;
                transform: scale(0.95); /* Slight shrink to be safe */
                transform-origin: top left;
            }

            /* --- PRESERVE SCREEN COLORS --- */
            /* Ensure background colors print */
            [class*="bg-"] {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            
            /* --- FORCE BLACK TEXT IN PRINT --- */
            * {
                color: #000000 !important;
            }

            /* Table Layout */
            table {
                width: 100% !important;
                table-layout: fixed !important;
                border-collapse: collapse !important;
            }
            
            /* Table Cells: Keep borders but make sure they are visible */
            th, td {
                padding: 1px 2px !important;
                /* Use a slightly darker border for print clarity, or keep original if preferred */
                border-color: #000000 !important; 
                font-size: 10px !important;
                white-space: nowrap !important;
                overflow: hidden !important;
            }

            /* Row heights */
            tr {
                height: 18px !important;
                page-break-inside: avoid;
            }

            /* Specific Column Widths (Percentages for A4) */
            th:nth-child(1) { width: 22% !important; } /* Cliente */
            th:nth-child(2) { width: 14% !important; } /* Articulo */
            th:nth-child(3) { width: 9% !important; }  /* Kg */
            th:nth-child(4) { width: 10% !important; } /* Precio */
            th:nth-child(5) { width: 11% !important; } /* Sub */
            th:nth-child(6) { width: 11% !important; } /* Ant */
            th:nth-child(7) { width: 11% !important; } /* Ent */
            th:nth-child(8) { width: 10% !important; } /* Saldo */
            th:nth-child(9) { display: none !important; } /* Action */
            td:nth-child(9) { display: none !important; }

            /* Flatten Inputs visually but keep values */
            input, select {
                border: none !important;
                background: transparent !important;
                padding: 0 !important;
                margin: 0 !important;
                box-shadow: none !important;
                width: 100% !important;
                font-size: inherit !important;
                font-family: inherit !important;
                color: inherit !important;
                -webkit-appearance: none !important;
                appearance: none !important;
            }
            /* Hide placeholders */
            ::placeholder {
                color: transparent !important;
            }
            /* Hide select arrow */
            select {
                background-image: none !important;
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

            {/* Print Header (Visible only in print) - Restored Style */}
            <div className="hidden print:block mb-4">
                 <div className="flex justify-between items-center pb-4 border-b-2 border-slate-800">
                     <div className="flex items-center gap-4">
                         <div className="flex flex-col">
                             <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Planilla de Reparto</h1>
                             <span className="text-sm text-slate-500 font-bold uppercase tracking-widest">Avícola Alpina</span>
                         </div>
                     </div>
                     
                     <div className="flex gap-4">
                         <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg">
                             <MapPin size={18} className="text-slate-800" />
                             <span className="text-lg font-bold text-slate-900 uppercase">{zoneName}</span>
                         </div>
                         <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg">
                             <Calendar size={18} className="text-slate-800" />
                             <span className="text-lg font-bold text-slate-900">
                                 {(() => {
                                    const [y, m, d] = currentDate.split('-').map(Number);
                                    const dateObj = new Date(y, m - 1, d);
                                    return dateObj.toLocaleDateString('es-AR');
                                })()}
                             </span>
                         </div>
                     </div>
                 </div>
                 
                 {/* Metadata Section */}
                 <div className="flex gap-6 mt-4 text-sm">
                     <div className="flex items-center gap-2">
                         <span className="font-bold text-slate-500 uppercase">Cargado:</span>
                         <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 rounded border border-slate-200">{formatDecimal(metadata.loadedChicken)} kg</span>
                     </div>
                     <div className="flex items-center gap-2">
                         <span className="font-bold text-slate-500 uppercase">Devolución:</span>
                         <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 rounded border border-slate-200">{formatDecimal(metadata.returnedChicken)} kg</span>
                     </div>
                     <div className="flex items-center gap-2">
                         <span className="font-bold text-slate-500 uppercase">Merma:</span>
                         <span className={`font-mono font-bold px-2 rounded border ${shrinkage > 0 ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                            {formatDecimal(shrinkage)} kg
                         </span>
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
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-2 py-1 text-left text-base font-bold text-slate-600 uppercase tracking-wider border-r border-slate-200">Cliente</th>
                                <th className="px-2 py-1 text-left text-base font-bold text-slate-600 uppercase tracking-wider w-36 border-r border-slate-200">Articulo</th>
                                <th className="px-2 py-1 text-right text-base font-bold text-slate-600 uppercase tracking-wider w-20 border-r border-slate-200">Kg</th>
                                <th className="px-2 py-1 text-right text-base font-bold text-slate-600 uppercase tracking-wider w-24 border-r border-slate-200">Precio</th>
                                <th className="px-2 py-1 text-right text-base font-bold text-slate-600 uppercase tracking-wider w-28 border-r border-slate-200">Subtotal</th>
                                <th className="px-2 py-1 text-right text-base font-bold text-slate-600 uppercase tracking-wider w-28 border-r border-slate-200 whitespace-nowrap">Saldo Ant</th>
                                <th className="px-2 py-1 text-right text-base font-bold text-emerald-600 uppercase tracking-wider w-28 border-r border-slate-200">Entrega</th>
                                <th className="px-2 py-1 text-right text-base font-bold text-slate-600 uppercase tracking-wider w-28">Saldo</th>
                                <th className="px-2 py-1 w-10 print:hidden"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rows.map((row, index) => {
                                const subtotal = (row.weight || 0) * (row.price || 0);
                                const balance = subtotal + (row.prevBalance || 0) - (row.payment || 0);
                                const isAlternate = index % 2 === 1;
                                
                                return (
                                    <tr key={row.id} className={`hover:bg-slate-50 group ${isAlternate ? 'bg-slate-50/50' : ''}`}>
                                        <td className="border-r border-slate-100 h-11">
                                            <TextInput 
                                                value={row.client} 
                                                onChange={(v) => handleRowChange(row.id, 'client', v)} 
                                                className="font-bold text-slate-800 text-base"
                                            />
                                        </td>
                                        <td className="border-r border-slate-100 h-11">
                                            <ProductSelect 
                                                value={row.product} 
                                                onChange={(v) => handleRowChange(row.id, 'product', v)} 
                                                className="text-base text-slate-700 font-medium"
                                            />
                                        </td>
                                        <td className="border-r border-slate-100 h-11">
                                            <NumericInput 
                                                value={row.weight} 
                                                onChange={(v) => handleRowChange(row.id, 'weight', v)} 
                                                className="text-slate-700 text-right font-mono text-base font-medium"
                                            />
                                        </td>
                                        <td className="border-r border-slate-100 h-11">
                                            <NumericInput 
                                                value={row.price} 
                                                onChange={(v) => handleRowChange(row.id, 'price', v)} 
                                                className="text-slate-700 text-right font-mono text-base font-medium"
                                                isCurrency
                                            />
                                        </td>
                                        <td className="border-r border-slate-100 h-11 px-2 text-right">
                                            <span className="text-base font-mono text-slate-600">
                                                {subtotal > 0 ? formatCurrency(subtotal) : '-'}
                                            </span>
                                        </td>
                                        <td className="border-r border-slate-100 h-11">
                                             <NumericInput 
                                                value={row.prevBalance} 
                                                onChange={(v) => handleRowChange(row.id, 'prevBalance', v)} 
                                                className="text-slate-600 text-right font-mono text-base font-medium"
                                                isCurrency
                                            />
                                        </td>
                                        <td className="border-r border-slate-100 h-11 bg-emerald-50/30">
                                             <NumericInput 
                                                value={row.payment} 
                                                onChange={(v) => handleRowChange(row.id, 'payment', v)} 
                                                className="text-emerald-700 font-bold text-right font-mono text-base"
                                                isCurrency
                                            />
                                        </td>
                                        <td className="h-11 px-2 text-right">
                                            <span className={`text-base font-mono font-bold ${balance > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
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
                            <tr className="border-t-2 border-slate-400">
                                <td colSpan={4} className="px-2 py-2 text-right font-bold text-slate-700 border-r border-slate-300 bg-slate-100 uppercase tracking-wider text-base"></td>
                                
                                <td className="px-2 py-2 text-right font-bold text-slate-800 border-r border-slate-300 bg-slate-50 text-base">{formatCurrency(totalSold)}</td>
                                <td className="px-2 py-2 text-right font-bold text-slate-800 border-r border-slate-300 bg-slate-50 text-base">
                                    <div className="flex items-center justify-end gap-1">
                                        <span className="text-[8px] font-normal text-slate-500 uppercase hidden print:block whitespace-nowrap">Σ Ant</span>
                                        <span>{formatCurrency(totalPrevBalance)}</span>
                                    </div>
                                </td>
                                <td className="px-2 py-2 text-right font-bold text-emerald-700 border-r border-slate-300 bg-emerald-50 text-base">
                                    <div className="flex items-center justify-end gap-1">
                                        <span className="text-[8px] font-normal text-slate-500 uppercase hidden print:block whitespace-nowrap">Σ Ent</span>
                                        <span>{formatCurrency(totalPayment)}</span>
                                    </div>
                                </td>
                                <td className="px-2 py-2 text-right font-bold text-slate-900 bg-slate-50 text-base">
                                    <div className="flex items-center justify-end gap-1">
                                        <span className="text-[8px] font-normal text-slate-500 uppercase hidden print:block whitespace-nowrap">Σ Saldo</span>
                                        <span>{formatCurrency(finalBalance)}</span>
                                    </div>
                                </td>
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
            <div className="mt-8 print:mt-6 flex flex-col md:flex-row gap-8 print:gap-4 break-inside-avoid">
                
                {/* Expenses Table (Screen & Print adapted) */}
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                         <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                            <Receipt size={16} /> Gastos
                         </h3>
                         <button onClick={addExpense} className="text-xs flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded border border-slate-300 transition-colors text-black print:hidden">
                             <Plus size={12} /> Agregar
                         </button>
                    </div>
                    
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                             <thead>
                                <tr className="bg-slate-100 border-b border-slate-300">
                                    <th className="px-2 py-1 text-left text-sm font-semibold text-slate-600 uppercase border-r border-slate-300">Descripción</th>
                                    <th className="px-2 py-1 text-right text-sm font-semibold text-slate-600 uppercase w-24">Monto</th>
                                    <th className="w-8 print:hidden"></th>
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
                                         <td className="text-center print:hidden">
                                             <button onClick={() => removeExpense(exp.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100">
                                                 <Trash2 size={12} />
                                             </button>
                                         </td>
                                     </tr>
                                 ))}
                                 {expenses.length === 0 && (
                                     <tr>
                                         <td colSpan={2} className="px-2 py-4 text-center text-slate-400 text-sm italic">Sin gastos</td>
                                         <td className="print:hidden"></td>
                                     </tr>
                                 )}
                             </tbody>
                             <tfoot className="border-t border-slate-300 bg-slate-50">
                                 <tr>
                                     <td className="px-2 py-1 text-right text-sm font-bold text-slate-600 border-r border-slate-300">TOTAL</td>
                                     <td className="px-2 py-1 text-right text-sm font-bold text-rose-600 font-mono">{formatCurrency(totalExpenses)}</td>
                                     <td className="print:hidden"></td>
                                 </tr>
                             </tfoot>
                        </table>
                    </div>
                </div>

                {/* Final Summary Table (Printed version of the top cards) */}
                <div className="w-full md:w-64 print:w-56 break-inside-avoid flex flex-col justify-start print:items-end">
                    <div className="bg-slate-50 border-2 border-slate-300 print:border-slate-800 rounded print:rounded-xl overflow-hidden mb-2 w-full">
                         <div className="flex print:flex-col justify-between items-center p-3 bg-indigo-50 print:bg-slate-100 border-t-2 border-slate-300 print:border-slate-800">
                             <span className="text-sm font-extrabold text-indigo-700 print:text-slate-600 uppercase print:tracking-widest">Saldo Efectivo</span>
                             <span className="text-lg font-bold font-mono text-indigo-700 print:text-slate-900 print:text-2xl print:font-black">{formatCurrency(cashBalance)}</span>
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
