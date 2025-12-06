

import React from 'react';
import { Database, ref, onValue, set } from 'firebase/database';
import { Calendar, Plus, Trash2, MapPin, Calculator, Printer, ChevronDown, History, X, Clock, Receipt } from 'lucide-react';
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
            <div className={`w-full h-full flex items-center px-2 ${alignment} ${className}`}>
                {displayValue}
            </div>
        );
    }

    if (!isEditing) {
        return (
            <div 
                onClick={() => setIsEditing(true)}
                className={`w-full h-full flex items-center px-2 cursor-text ${alignment} ${className} hover:bg-slate-50 transition-colors print:px-0`}
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
            className={`bg-transparent w-full h-full px-2 focus:outline-none focus:bg-indigo-50 transition-all placeholder-slate-400 print:placeholder-transparent ${className}`}
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
                className={`w-full h-full flex items-center px-3 cursor-text ${className} hover:bg-slate-50 transition-colors truncate print:px-0 print:whitespace-normal print:overflow-visible print:h-auto`}
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
            className={`bg-transparent w-full h-full px-3 focus:outline-none focus:bg-indigo-50 transition-all ${className}`}
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
                className={`w-full h-full flex items-center px-3 cursor-pointer ${className} hover:bg-slate-50 transition-colors truncate print:px-0`}
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
            className={`w-full h-full px-2 bg-white focus:outline-none focus:bg-indigo-50 transition-all ${className}`}
        >
            <option value="">Seleccionar...</option>
            {PRODUCT_CATEGORIES.map(cat => (
                 <option key={cat} value={cat}>{cat}</option>
            ))}
        </select>
    );
};

export const DeliveryApp: React.FC<DeliveryAppProps> = ({ db, zoneName, isRestricted = false }) => {
  const [currentDate, setCurrentDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = React.useState<DeliveryRow[]>([]);
  const [expenses, setExpenses] = React.useState<DeliveryExpense[]>([]);
  const [history, setHistory] = React.useState<DeliveryHistoryLog[]>([]);
  const [metadata, setMetadata] = React.useState({ loadedChicken: 0, returnedChicken: 0 });
  const [loading, setLoading] = React.useState(true);
  
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [showHistoryModal, setShowHistoryModal] = React.useState(false);

  React.useEffect(() => {
    if (isRestricted) {
        setCurrentDate(new Date().toISOString().slice(0, 10));
    }
  }, [isRestricted]);

  // Load Data, History, Metadata and Expenses
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
           setRows(val as DeliveryRow[]);
        } else {
           if (zoneName.toLowerCase() === 'malvinas') {
               const initRows = MALVINAS_CLIENTS.map(name => ({
                   id: generateId() + Math.random().toString(36).substring(7),
                   client: name,
                   product: '',
                   weight: 0,
                   price: 0,
                   prevBalance: 0,
                   payment: 0
               }));
               const extraRows = Array(4).fill(null).map(() => ({
                   id: generateId() + Math.random().toString(36).substring(7),
                   client: '',
                   product: '',
                   weight: 0,
                   price: 0,
                   prevBalance: 0,
                   payment: 0
               }));
               setRows([...initRows, ...extraRows]);
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
      }
    } else {
       // Local Storage
       const savedData = localStorage.getItem(dataKey);
       if (savedData) {
           try { setRows(JSON.parse(savedData)); } catch (e) { setRows([]); }
       } else {
           if (zoneName.toLowerCase() === 'malvinas') {
               const initRows = MALVINAS_CLIENTS.map(name => ({
                   id: generateId() + Math.random().toString(36).substring(7),
                   client: name,
                   product: '',
                   weight: 0,
                   price: 0,
                   prevBalance: 0,
                   payment: 0
               }));
               const extraRows = Array(4).fill(null).map(() => ({
                   id: generateId() + Math.random().toString(36).substring(7),
                   client: '',
                   product: '',
                   weight: 0,
                   price: 0,
                   prevBalance: 0,
                   payment: 0
               }));
               setRows([...initRows, ...extraRows]);
           } else {
               setRows([]);
           }
       }

       const savedExpenses = localStorage.getItem(expensesKey);
       if (savedExpenses) {
           try { setExpenses(JSON.parse(savedExpenses)); } catch { setExpenses([]); }
       } else {
           setExpenses([]);
       }

       const savedHistory = localStorage.getItem(historyKey);
       if (savedHistory) {
           try { setHistory(JSON.parse(savedHistory)); } catch (e) { setHistory([]); }
       } else {
           setHistory([]);
       }

       const savedMeta = localStorage.getItem(metaKey);
       if (savedMeta) {
           try { setMetadata(JSON.parse(savedMeta)); } catch { setMetadata({ loadedChicken: 0, returnedChicken: 0 }); }
       } else {
           setMetadata({ loadedChicken: 0, returnedChicken: 0 });
       }

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

  const saveHistory = (newHistory: DeliveryHistoryLog[]) => {
      const historyKey = `deliveries_history/${zoneName}/${currentDate}`;
      if (db) {
          set(ref(db, historyKey), newHistory);
      } else {
          setHistory(newHistory);
          localStorage.setItem(historyKey, JSON.stringify(newHistory));
      }
  };

  const updateMetadata = (field: 'loadedChicken' | 'returnedChicken', value: number) => {
      const newMeta = { ...metadata, [field]: value };
      setMetadata(newMeta);
      const metaKey = `deliveries_metadata/${zoneName}/${currentDate}`;
      if (db) {
          set(ref(db, metaKey), newMeta);
      } else {
          localStorage.setItem(metaKey, JSON.stringify(newMeta));
      }
  };

  const logChange = (description: string) => {
      const newLog: DeliveryHistoryLog = {
          id: generateId(),
          timestamp: new Date().toISOString(),
          description
      };
      saveHistory([...history, newLog]);
  };

  const handleUpdateRow = (id: string, field: keyof DeliveryRow, value: string | number) => {
      // Find row to log changes
      const oldRow = rows.find(r => r.id === id);
      if (oldRow) {
          const oldValue = oldRow[field];
          if (oldValue !== value) {
              const fieldLabels: Record<string, string> = { 
                  client: 'Cliente', 
                  product: 'Artículo', 
                  weight: 'Kilos', 
                  price: 'Precio', 
                  prevBalance: 'Saldo Ant.', 
                  payment: 'Entrega' 
              };
              const label = fieldLabels[field as string] || field;
              
              const clientName = oldRow.client ? oldRow.client : '(Sin Nombre)';
              const fromVal = oldValue === '' || oldValue === 0 ? '-' : oldValue;
              const toVal = value === '' || value === 0 ? '-' : value;

              logChange(`${clientName}: Modificó ${label} de "${fromVal}" a "${toVal}"`);
          }
      }

      const updatedRows = rows.map(r => {
          if (r.id === id) {
              return { ...r, [field]: value };
          }
          return r;
      });
      saveData(updatedRows);
  };

  const handleDeleteRow = (id: string) => {
      const rowToDelete = rows.find(r => r.id === id);
      if(window.confirm('¿Eliminar esta fila?')) {
          if (rowToDelete) {
             const name = rowToDelete.client || '(Sin Nombre)';
             logChange(`Eliminó la fila de: ${name}`);
          }
          const updatedRows = rows.filter(r => r.id !== id);
          saveData(updatedRows);
      }
  };

  // --- Expenses Handlers ---

  const handleAddExpense = () => {
      const newExpense: DeliveryExpense = {
          id: generateId(),
          description: '',
          amount: 0
      };
      saveExpenses([...expenses, newExpense]);
  };

  const handleUpdateExpense = (id: string, field: keyof DeliveryExpense, value: string | number) => {
      const updatedExpenses = expenses.map(e => {
          if (e.id === id) return { ...e, [field]: value };
          return e;
      });
      saveExpenses(updatedExpenses);
  };

  const handleDeleteExpense = (id: string) => {
      if (window.confirm('¿Eliminar este gasto?')) {
          const updatedExpenses = expenses.filter(e => e.id !== id);
          saveExpenses(updatedExpenses);
      }
  };

  const handleDateSelect = (date: Date) => {
      const offset = date.getTimezoneOffset();
      const adjustedDate = new Date(date.getTime() - (offset*60*1000));
      setCurrentDate(adjustedDate.toISOString().split('T')[0]);
      setShowDatePicker(false);
  };

  const totalSubtotal = rows.reduce((acc, r) => acc + (r.weight * r.price), 0);
  const totalPayment = rows.reduce((acc, r) => acc + r.payment, 0);
  const totalPrevBalance = rows.reduce((acc, r) => acc + r.prevBalance, 0);
  const totalCurrentBalance = rows.reduce((acc, r) => {
      const sub = r.weight * r.price;
      return acc + (sub + r.prevBalance - r.payment);
  }, 0);

  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalCash = totalPayment - totalExpenses;

  const formatDateForDisplay = (isoDate: string) => {
      if (!isoDate) return '';
      const [year, month, day] = isoDate.split('-');
      const date = new Date(parseInt(year), parseInt(month)-1, parseInt(day));
      return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' });
  };

  const sortedHistory = [...history].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // --- Category Summary Logic ---
  const summaryStats = React.useMemo(() => {
      return PRODUCT_CATEGORIES.map(category => {
          const categoryRows = rows.filter(r => r.product === category);
          const totalWeight = categoryRows.reduce((sum, r) => sum + r.weight, 0);
          const totalMoney = categoryRows.reduce((sum, r) => sum + (r.weight * r.price), 0);
          
          const ppp = totalWeight > 0 ? totalMoney / totalWeight : 0;
          
          return {
              category,
              totalWeight,
              ppp,
              totalMoney
          };
      });
  }, [rows]);

  const totalSummaryWeight = summaryStats.reduce((acc, curr) => acc + curr.totalWeight, 0);
  const totalSummaryMoney = summaryStats.reduce((acc, curr) => acc + curr.totalMoney, 0);
  const totalSummaryPPP = totalSummaryWeight > 0 ? totalSummaryMoney / totalSummaryWeight : 0;

  // --- Shrinkage Calculations ---
  const mermaTotal = metadata.loadedChicken - metadata.returnedChicken - totalSummaryWeight;
  const estimatedCrates = metadata.loadedChicken > 0 ? metadata.loadedChicken / 20 : 0;
  const mermaPorCajon = estimatedCrates > 0 ? mermaTotal / estimatedCrates : 0;

  // --- Equivalent Balance in Crates Calculation (Approximation) ---
  // Using Global PPP to estimate debt in crates: Debt / (PPP * 20kg per crate)
  const equivalentCratesBalance = (totalSummaryPPP > 0) ? (totalCurrentBalance / (totalSummaryPPP * 20)) : 0;

  return (
    <div className="h-full flex flex-col bg-slate-950 p-2 sm:p-6 md:overflow-hidden overflow-y-auto print:bg-white print:p-0 print:h-auto print:overflow-visible">
        
        {/* History Modal (Screen Only) */}
        {showHistoryModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 print:hidden">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
                    <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900/50">
                        <div className="flex items-center gap-2">
                            <History className="text-indigo-400" size={20} />
                            <h2 className="text-xl font-bold text-slate-100">Historial de Cambios</h2>
                        </div>
                        <button onClick={() => setShowHistoryModal(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                         {sortedHistory.length === 0 ? (
                             <div className="text-center text-slate-500 italic py-10">No hay movimientos registrados.</div>
                         ) : (
                             <div className="space-y-3">
                                 {sortedHistory.map((item) => (
                                     <div key={item.id} className="bg-slate-800/50 border border-slate-700/50 p-3 rounded-lg">
                                         <div className="flex items-center gap-2 mb-1">
                                             <Clock size={12} className="text-slate-500" />
                                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                {new Date(item.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                             </span>
                                         </div>
                                         <p className="text-sm text-slate-200">{item.description}</p>
                                     </div>
                                 ))}
                             </div>
                         )}
                    </div>
                </div>
            </div>
        )}

        {/* --- PRINT HEADER (Hidden on Screen) --- */}
        <div className="hidden print:flex flex-row border-2 border-black mb-2 font-bold text-sm leading-none">
            <div className="bg-neutral-600 text-white p-2 w-[20%] text-center flex items-center justify-center border-r border-black print-color-adjust-exact">PLANILLA DE REPARTO</div>
            <div className="p-2 w-[30%] text-center border-r border-black flex items-center justify-center uppercase bg-white">{zoneName}</div>
            <div className="bg-neutral-600 text-white p-2 w-[15%] text-center flex items-center justify-center border-r border-black print-color-adjust-exact">FECHA</div>
            <div className="p-2 w-[35%] text-center flex items-center justify-center uppercase bg-white">{formatDateForDisplay(currentDate)}</div>
        </div>

        {/* --- SCREEN HEADER (Hidden on Print) --- */}
        <div className="flex-none flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-md print:hidden relative z-30 shrink-0">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-900/30 border border-emerald-500/30 rounded-lg">
                    <MapPin className="text-emerald-400" size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white uppercase tracking-wider">Planilla de Reparto</h2>
                    <p className="text-sm font-bold text-emerald-400 uppercase">{zoneName}</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {!isRestricted && (
                    <>
                        <button 
                            onClick={() => setShowHistoryModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors"
                            title="Ver Historial"
                        >
                            <History size={18} />
                            <span className="text-sm font-bold hidden sm:inline">Historial</span>
                        </button>
                        <button 
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
                            title="Imprimir Planilla"
                        >
                            <Printer size={18} />
                            <span className="text-sm font-bold hidden sm:inline">Imprimir</span>
                        </button>
                    </>
                )}
                <div className="relative">
                    {isRestricted ? (
                         <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-full border border-slate-800">
                            <Calendar className="text-slate-400" size={18} />
                            <span className="text-white text-sm font-bold capitalize">{formatDateForDisplay(currentDate)}</span>
                         </div>
                    ) : (
                         <>
                             <button 
                                onClick={() => setShowDatePicker(!showDatePicker)}
                                className="flex items-center gap-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-full border border-slate-700 transition-all text-sm font-bold text-slate-200 hover:text-white group"
                             >
                                <Calendar size={16} className="text-indigo-400 group-hover:text-indigo-300" />
                                <span className="capitalize">{formatDateForDisplay(currentDate)}</span>
                                <ChevronDown size={14} className={`text-slate-500 transition-transform ${showDatePicker ? 'rotate-180' : ''}`} />
                             </button>

                             <DayPickerModal 
                                isOpen={showDatePicker} 
                                onClose={() => setShowDatePicker(false)} 
                                currentDate={new Date(currentDate + 'T12:00:00')} 
                                onSelectDate={handleDateSelect} 
                             />
                         </>
                    )}
                </div>
            </div>
        </div>

        {/* --- MAIN TABLE --- */}
        <div className="flex flex-col bg-white rounded-xl border border-slate-300 shadow-xl overflow-hidden z-0 shrink-0 h-[65vh] md:h-auto md:flex-1 md:min-h-0 print:shadow-none print:border-none print:rounded-none print:block print:h-auto print:overflow-visible">
            <div className="overflow-auto custom-scrollbar flex-1 relative bg-slate-50 print:bg-transparent print:overflow-visible">
                <table className="w-full border-collapse min-w-[1000px] print:min-w-0 print:text-[10px] print:leading-tight">
                    <thead className="sticky top-0 z-20 bg-slate-100 text-xs font-bold text-slate-600 uppercase tracking-wider shadow-sm print:static print:shadow-none print:bg-neutral-600 print:text-white print:border-2 print:border-black print-color-adjust-exact">
                        <tr>
                            <th className="p-3 border-b border-r border-slate-300 w-12 text-center print:border-black print:text-white print:p-1">N°</th>
                            <th className="p-3 border-b border-r border-slate-300 text-left w-48 print:border-black print:text-white print:p-1">NOMBRE</th>
                            <th className="p-3 border-b border-r border-slate-300 text-left w-32 print:border-black print:text-white print:p-1">ARTÍCULO</th>
                            <th className="p-3 border-b border-r border-slate-300 text-center w-20 print:border-black print:text-white print:p-1">CANTIDAD</th>
                            <th className="p-3 border-b border-r border-slate-300 text-center w-20 print:border-black print:text-white print:p-1">$</th>
                            <th className="p-3 border-b border-r border-slate-300 text-right w-24 bg-slate-200 print:bg-transparent print:border-black print:text-white print:p-1">SUBTOT</th>
                            <th className="p-3 border-b border-r border-slate-300 text-right w-24 print:border-black print:text-white print:p-1">SALD ANT</th>
                            <th className="p-3 border-b border-r border-slate-300 text-right w-24 text-emerald-700 print:text-white print:border-black print:p-1">ENTREGA</th>
                            <th className="p-3 border-b border-slate-300 text-right w-24 bg-slate-200 text-indigo-700 print:bg-transparent print:text-white print:border-black print:p-1">SALD ACT</th>
                            <th className="p-3 border-b border-slate-300 w-10 print:hidden"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white print:bg-transparent">
                        {rows.map((row, index) => {
                            const subtotal = row.weight * row.price;
                            const currentBalance = subtotal + row.prevBalance - row.payment;

                            return (
                                <tr key={row.id} className="group hover:bg-indigo-50/30 transition-colors border-b border-slate-200 last:border-0 print:border-b print:border-black print:hover:bg-transparent print:h-6">
                                    <td className="p-0 border-r border-slate-200 h-10 print:border-black print:h-auto text-center font-mono text-slate-500 print:text-black">
                                        {index + 400} {/* Example index offset */}
                                    </td>
                                    <td className="p-0 border-r border-slate-200 print:border-black h-10 print:h-auto">
                                        <TextInput 
                                            value={row.client}
                                            onChange={(v) => handleUpdateRow(row.id, 'client', v)}
                                            placeholder="Nombre"
                                            className="text-base sm:text-sm font-medium text-slate-800 print:text-black uppercase print:text-[10px]"
                                        />
                                    </td>
                                    <td className="p-0 border-r border-slate-200 print:border-black h-10 print:h-auto">
                                        <ProductSelect 
                                            value={row.product}
                                            onChange={(v) => handleUpdateRow(row.id, 'product', v)}
                                            className="text-base sm:text-sm text-slate-600 print:text-black print:text-[10px]"
                                        />
                                    </td>
                                    <td className="p-0 border-r border-slate-200 h-10 print:border-black print:h-auto">
                                        <NumericInput 
                                            value={row.weight} 
                                            onChange={(v) => handleUpdateRow(row.id, 'weight', v)}
                                            className="text-slate-800 font-mono text-base sm:text-sm print:text-black text-center print:text-[10px]"
                                        />
                                    </td>
                                    <td className="p-0 border-r border-slate-200 h-10 print:border-black print:h-auto">
                                        <NumericInput 
                                            value={row.price} 
                                            onChange={(v) => handleUpdateRow(row.id, 'price', v)}
                                            className="text-slate-800 font-mono text-base sm:text-sm print:text-black text-center print:text-[10px]"
                                            isCurrency
                                        />
                                    </td>
                                    <td className="p-3 border-r border-slate-200 text-right bg-slate-50 font-mono font-bold text-slate-700 text-base sm:text-sm print:bg-transparent print:text-black print:border-black print:p-1 print:text-[10px]">
                                        {formatCurrency(subtotal)}
                                    </td>
                                    <td className="p-0 border-r border-slate-200 h-10 print:border-black print:h-auto">
                                        {isRestricted ? (
                                             <div className="w-full h-full flex items-center justify-end px-3 text-slate-600 font-mono text-base sm:text-sm print:text-black print:p-1 print:text-[10px]">
                                                {formatCurrency(row.prevBalance)}
                                             </div>
                                        ) : (
                                            <NumericInput 
                                                value={row.prevBalance} 
                                                onChange={(v) => handleUpdateRow(row.id, 'prevBalance', v)}
                                                className="text-slate-600 font-mono text-base sm:text-sm print:text-black text-right print:text-[10px]"
                                                isCurrency
                                            />
                                        )}
                                    </td>
                                    <td className="p-0 border-r border-slate-200 h-10 bg-emerald-50/30 print:bg-transparent print:border-black print:h-auto">
                                        <NumericInput 
                                            value={row.payment} 
                                            onChange={(v) => handleUpdateRow(row.id, 'payment', v)}
                                            className="text-emerald-700 font-bold font-mono text-base sm:text-sm print:text-black text-right print:text-[10px]"
                                            isCurrency
                                        />
                                    </td>
                                    <td className="p-3 text-right bg-slate-50 font-mono font-bold text-indigo-700 text-base sm:text-sm border-r border-slate-200 print:bg-transparent print:text-black print:border-black print:p-1 print:text-[10px]">
                                        {formatCurrency(currentBalance)}
                                    </td>
                                    <td className="p-0 text-center print:hidden">
                                        <button 
                                            onClick={() => handleDeleteRow(row.id)}
                                            className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    {/* Screen Footer (Hidden on Print) */}
                    <tfoot className="sticky bottom-0 z-20 bg-slate-800 text-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] print:hidden">
                        <tr className="text-xs font-bold uppercase tracking-wider">
                            <td colSpan={5} className="p-3 text-right border-r border-slate-600">Totales</td>
                            <td className="p-3 text-right border-r border-slate-600 font-mono text-amber-300">{formatCurrency(totalSubtotal)}</td>
                            <td className="p-3 text-right border-r border-slate-600 font-mono">{formatCurrency(totalPrevBalance)}</td>
                            <td className="p-3 text-right border-r border-slate-600 font-mono text-emerald-300">{formatCurrency(totalPayment)}</td>
                            <td className="p-3 text-right font-mono text-indigo-300 border-r border-slate-600">{formatCurrency(totalCurrentBalance)}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>

        {/* --- PRINT FOOTER GRID (Hidden on Screen) --- */}
        <div className="hidden print:grid grid-cols-[60%_40%] gap-4 mt-2 text-[10px]">
             
             {/* Left Column: Summary + Expenses */}
             <div className="flex flex-col gap-4">
                
                {/* Summary Table */}
                <table className="w-full border-collapse border-2 border-black">
                    <thead className="bg-neutral-600 text-white print-color-adjust-exact">
                        <tr>
                            <th className="border-r border-b border-black p-1 text-center">Cantidades Por Artículo</th>
                            <th className="border-r border-b border-black p-1 text-center">PPP</th>
                            <th className="border-b border-black p-1 text-center">Subtotales</th>
                        </tr>
                    </thead>
                    <tbody>
                         {summaryStats.map((stat) => (
                            <tr key={stat.category} className="border-b border-black">
                                <td className="border-r border-black p-1 pl-2">{stat.category}</td>
                                <td className="border-r border-black p-1 text-center">{formatCurrency(stat.ppp)}</td>
                                <td className="p-1 text-right pr-2">{formatCurrency(stat.totalMoney)}</td>
                            </tr>
                        ))}
                        {/* Placeholder rows to match look if needed */}
                         {summaryStats.length < 5 && Array(5 - summaryStats.length).fill(null).map((_, i) => (
                             <tr key={i} className="border-b border-black h-5">
                                 <td className="border-r border-black"></td>
                                 <td className="border-r border-black"></td>
                                 <td></td>
                             </tr>
                         ))}
                         <tr className="bg-neutral-600 text-white font-bold border-b border-black print-color-adjust-exact">
                             <td className="border-r border-black p-1 pl-2">Total de Pollo</td>
                             <td className="border-r border-black p-1 text-center font-bold bg-yellow-300 text-black print-color-adjust-exact">{formatDecimal(totalSummaryWeight)}</td>
                             <td className="p-1 text-right pr-2">Precio: {formatCurrency(totalSummaryPPP)}</td>
                         </tr>
                         <tr className="bg-neutral-600 text-white font-bold print-color-adjust-exact">
                             <td className="border-r border-black p-1 pl-2">Cant. Congelados</td>
                             <td className="border-r border-black p-1 text-center bg-yellow-300 text-black print-color-adjust-exact">0</td>
                             <td className="p-1 text-right pr-2">Total Congelados: $0</td>
                         </tr>
                    </tbody>
                </table>

                {/* Expenses Table */}
                <table className="w-full border-collapse border-2 border-black">
                     <thead className="bg-red-600 text-white print-color-adjust-exact">
                         <tr>
                             <th colSpan={3} className="border-b border-black p-1 text-center">CUADRO DE GASTOS</th>
                         </tr>
                         <tr className="bg-white text-black border-b border-black">
                             <th className="border-r border-black p-1 w-8">N°</th>
                             <th className="border-r border-black p-1">Detalle</th>
                             <th className="p-1 w-24">Monto</th>
                         </tr>
                     </thead>
                     <tbody>
                         {expenses.length > 0 ? expenses.map((exp, idx) => (
                             <tr key={exp.id} className="border-b border-black">
                                 <td className="border-r border-black p-1 text-center">{idx + 1}</td>
                                 <td className="border-r border-black p-1">{exp.description}</td>
                                 <td className="p-1 text-right">{formatCurrency(exp.amount)}</td>
                             </tr>
                         )) : Array(3).fill(null).map((_, i) => (
                             <tr key={i} className="border-b border-black h-5">
                                 <td className="border-r border-black"></td>
                                 <td className="border-r border-black"></td>
                                 <td className="border-r border-black"></td>
                             </tr>
                         ))}
                         {/* Fill empty rows to maintain height */}
                         {expenses.length < 3 && Array(3 - expenses.length).fill(null).map((_, i) => (
                             <tr key={`empty-${i}`} className="border-b border-black h-5">
                                 <td className="border-r border-black"></td>
                                 <td className="border-r border-black"></td>
                                 <td></td>
                             </tr>
                         ))}
                     </tbody>
                     <tfoot>
                         <tr>
                             <td colSpan={2} className="border-r border-black p-1 text-right font-bold"></td>
                             <td className="p-1 text-right font-bold">{formatCurrency(totalExpenses)}</td>
                         </tr>
                     </tfoot>
                </table>

             </div>

             {/* Right Column: Stats + Shrinkage + Cash */}
             <div className="flex flex-col gap-4">
                 
                 {/* Top Stats Grid */}
                 <table className="w-full border-collapse border-2 border-black text-center font-bold">
                     <thead className="bg-neutral-600 text-white print-color-adjust-exact">
                         <tr>
                             <th className="border-r border-black p-1">Σ Sald Ant</th>
                             <th className="border-r border-black p-1">TOTAL</th>
                             <th className="p-1">Σ Sald Act</th>
                         </tr>
                     </thead>
                     <tbody>
                         <tr className="border-b border-black bg-white text-black">
                             <td className="border-r border-black p-1">{formatCurrency(totalPrevBalance)}</td>
                             <td className="border-r border-black p-1">{formatCurrency(totalPayment)}</td>
                             <td className="p-1">{formatCurrency(totalCurrentBalance)}</td>
                         </tr>
                     </tbody>
                 </table>

                 {/* Shrinkage & Equivalents */}
                 <table className="w-full border-collapse border-2 border-black text-center bg-neutral-600 text-white font-bold print-color-adjust-exact">
                     <tbody>
                         <tr className="border-b border-black">
                             <td className="border-r border-black p-1">Saldo Equivalente En Cajones</td>
                             <td className="p-1 bg-white text-red-600 print-color-adjust-exact">{formatDecimal(equivalentCratesBalance)}</td>
                         </tr>
                         <tr className="border-b border-black">
                             <td className="border-r border-black p-1">Kg Pollo Cargados</td>
                             <td className="p-1">Merma x Caj</td>
                         </tr>
                         <tr className="border-b border-black bg-white text-black">
                             <td className="border-r border-black p-1">{formatDecimal(metadata.loadedChicken)}</td>
                             <td className="p-1">{formatDecimal(mermaPorCajon)}</td>
                         </tr>
                         <tr className="border-b border-black">
                             <td className="border-r border-black p-1">Kg Pollo Devueltos</td>
                             <td className="p-1">Merma Total (Kg)</td>
                         </tr>
                         <tr className="bg-white text-black">
                             <td className="border-r border-black p-1">{formatDecimal(metadata.returnedChicken)}</td>
                             <td className="p-1">{formatDecimal(mermaTotal)}</td>
                         </tr>
                     </tbody>
                 </table>

                 {/* Cash Box */}
                 <div className="mt-auto flex border-2 border-black text-xl font-bold">
                     <div className="w-1/2 bg-yellow-300 p-2 text-center flex items-center justify-center border-r border-black print-color-adjust-exact">Efectivo</div>
                     <div className="w-1/2 bg-yellow-300 p-2 text-center flex items-center justify-center print-color-adjust-exact">{formatCurrency(totalCash)}</div>
                 </div>

             </div>
        </div>


        {/* --- SCREEN ONLY: Summaries & Expenses Grid Container --- */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 shrink-0 auto-rows-start print:hidden pb-4 md:pb-0">
            
            {/* 1. Category Summary */}
            <div className="bg-white rounded-xl border border-slate-300 shadow-md overflow-hidden w-full">
                <table className="w-full border-collapse">
                    <thead className="bg-slate-100 text-xs font-bold text-slate-600 uppercase tracking-wider">
                        <tr>
                            <th className="p-3 text-left border-r border-slate-300">Categoría</th>
                            <th className="p-3 text-center border-r border-slate-300">Kg</th>
                            <th className="p-3 text-center border-r border-slate-300">P.P.P.</th>
                            <th className="p-3 text-right">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {summaryStats.map((stat) => (
                            <tr key={stat.category} className="text-sm">
                                <td className="p-3 font-medium text-slate-800 border-r border-slate-200">{stat.category}</td>
                                <td className="p-3 text-center font-mono text-slate-600 border-r border-slate-200">{formatDecimal(stat.totalWeight)}</td>
                                <td className="p-3 text-center font-mono text-slate-600 border-r border-slate-200">{formatCurrency(stat.ppp)}</td>
                                <td className="p-3 text-right font-mono font-bold text-slate-800">{formatCurrency(stat.totalMoney)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="font-bold text-slate-800 bg-white border-t-2 border-slate-300">
                        <tr className="text-sm">
                            <td className="p-3 border-r border-slate-200">Total Pollo</td>
                            <td className="p-3 text-center border-r border-slate-200 font-mono">{formatDecimal(totalSummaryWeight)}</td>
                            <td className="p-3 border-r border-slate-200 text-right">Precio</td>
                            <td className="p-3 text-right font-mono">{formatCurrency(totalSummaryPPP)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* 2. Shrinkage Control Table */}
            <div className="bg-white rounded-xl border border-slate-300 shadow-md overflow-hidden w-full">
                <table className="w-full border-collapse">
                    <thead className="bg-slate-100 text-xs font-bold text-slate-600 uppercase tracking-wider">
                        <tr>
                            <th className="p-3 text-left border-r border-slate-300" colSpan={2}>Control de Mermas</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                        <tr>
                            <td className="p-3 font-medium text-slate-800 border-r border-slate-200">Kg Pollo Cargados</td>
                            <td className="p-0 h-10 w-32 bg-indigo-50/50">
                                <NumericInput 
                                    value={metadata.loadedChicken} 
                                    onChange={(v) => updateMetadata('loadedChicken', v)}
                                    className="text-slate-800 font-mono text-center font-bold text-base sm:text-sm"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="p-3 font-medium text-slate-800 border-r border-slate-200">Kg Pollo Devueltos</td>
                            <td className="p-0 h-10 w-32 bg-indigo-50/50">
                                <NumericInput 
                                    value={metadata.returnedChicken} 
                                    onChange={(v) => updateMetadata('returnedChicken', v)}
                                    className="text-slate-800 font-mono text-center font-bold text-base sm:text-sm"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="p-3 font-medium text-slate-800 border-r border-slate-200">Merma por Cajón (x20)</td>
                            <td className="p-3 text-center font-mono font-bold text-slate-600">
                                {formatDecimal(mermaPorCajon)}
                            </td>
                        </tr>
                        <tr>
                            <td className="p-3 font-bold text-slate-800 border-r border-slate-200">Merma Total</td>
                            <td className={`p-3 text-center font-mono font-bold ${mermaTotal < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {formatDecimal(mermaTotal)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* 3. Expenses Table (Cuadro de Gastos) */}
            <div className="bg-white rounded-xl border border-slate-300 shadow-md overflow-hidden w-full">
                <div className="p-3 bg-slate-100 border-b border-slate-300 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                        <Receipt size={16}/> Cuadro de Gastos
                    </h3>
                    <button onClick={handleAddExpense} className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-indigo-600 transition-colors">
                        <Plus size={16} />
                    </button>
                </div>
                <table className="w-full border-collapse">
                    <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <tr>
                            <th className="p-3 text-left border-r border-slate-200">Descripción</th>
                            <th className="p-3 text-right w-32 border-r border-slate-200">Monto</th>
                            <th className="p-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                        {expenses.length === 0 ? (
                            <tr><td colSpan={3} className="p-4 text-center text-slate-400 italic">Sin gastos registrados.</td></tr>
                        ) : (
                            expenses.map(expense => (
                                <tr key={expense.id} className="group hover:bg-slate-50">
                                    <td className="p-0 border-r border-slate-200 h-10">
                                        <TextInput 
                                            value={expense.description}
                                            onChange={(v) => handleUpdateExpense(expense.id, 'description', v)}
                                            placeholder="Descripción del gasto"
                                            className="text-slate-700 text-base sm:text-sm"
                                        />
                                    </td>
                                    <td className="p-0 border-r border-slate-200 h-10">
                                        <NumericInput 
                                            value={expense.amount}
                                            onChange={(v) => handleUpdateExpense(expense.id, 'amount', v)}
                                            className="text-slate-800 font-mono text-right text-base sm:text-sm"
                                            isCurrency
                                        />
                                    </td>
                                    <td className="p-0 text-center">
                                        <button 
                                            onClick={() => handleDeleteExpense(expense.id)}
                                            className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    <tfoot className="bg-slate-100 text-xs font-bold uppercase border-t border-slate-300">
                        <tr>
                            <td className="p-3 text-right border-r border-slate-300 text-slate-600">Total Gastos</td>
                            <td className="p-3 text-right font-mono text-rose-600 border-r border-slate-300">{formatCurrency(totalExpenses)}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

        </div>

    </div>
  );
};
