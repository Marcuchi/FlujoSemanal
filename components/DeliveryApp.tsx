

import React from 'react';
import { Database, ref, onValue, set } from 'firebase/database';
import { Calendar, Plus, Trash2, MapPin, Calculator, Printer, ChevronDown, History, X, Clock } from 'lucide-react';
import { DeliveryRow, DeliveryHistoryLog } from '../types';
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
                className={`w-full h-full flex items-center px-2 cursor-text ${alignment} ${className} hover:bg-slate-50 transition-colors`}
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
                className={`w-full h-full flex items-center px-3 cursor-text ${className} hover:bg-slate-50 transition-colors truncate`}
            >
                {value || <span className="text-slate-300 italic font-normal">{placeholder}</span>}
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
                className={`w-full h-full flex items-center px-3 cursor-pointer ${className} hover:bg-slate-50 transition-colors truncate`}
            >
                {value || <span className="text-slate-300 italic font-normal text-xs">Seleccionar...</span>}
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
  const [history, setHistory] = React.useState<DeliveryHistoryLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [showHistoryModal, setShowHistoryModal] = React.useState(false);

  React.useEffect(() => {
    if (isRestricted) {
        setCurrentDate(new Date().toISOString().slice(0, 10));
    }
  }, [isRestricted]);

  // Load Data and History
  React.useEffect(() => {
    const dataKey = `deliveries/${zoneName}/${currentDate}`;
    const historyKey = `deliveries_history/${zoneName}/${currentDate}`;
    
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

      // 2. History Listener
      const historyRef = ref(db, historyKey);
      const unsubscribeHistory = onValue(historyRef, (snapshot) => {
          const val = snapshot.val();
          setHistory(val ? (Object.values(val) as DeliveryHistoryLog[]) : []);
      });

      setLoading(false);
      return () => {
          unsubscribeData();
          unsubscribeHistory();
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

       const savedHistory = localStorage.getItem(historyKey);
       if (savedHistory) {
           try { setHistory(JSON.parse(savedHistory)); } catch (e) { setHistory([]); }
       } else {
           setHistory([]);
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

  const saveHistory = (newHistory: DeliveryHistoryLog[]) => {
      const historyKey = `deliveries_history/${zoneName}/${currentDate}`;
      if (db) {
          set(ref(db, historyKey), newHistory);
      } else {
          setHistory(newHistory);
          localStorage.setItem(historyKey, JSON.stringify(newHistory));
      }
  };

  const logChange = (description: string) => {
      const newLog: DeliveryHistoryLog = {
          id: generateId(),
          timestamp: new Date().toISOString(),
          description
      };
      // Keep sorted newest first implicitly if we prepend, but user wants sorted by time.
      // We will simply add to list and sort on render.
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

  const handleDateSelect = (date: Date) => {
      const offset = date.getTimezoneOffset();
      const adjustedDate = new Date(date.getTime() - (offset*60*1000));
      setCurrentDate(adjustedDate.toISOString().split('T')[0]);
      setShowDatePicker(false);
  };

  const totalSubtotal = rows.reduce((acc, r) => acc + (r.weight * r.price), 0);
  const totalPayment = rows.reduce((acc, r) => acc + r.payment, 0);
  const totalCurrentBalance = rows.reduce((acc, r) => {
      const sub = r.weight * r.price;
      return acc + (sub + r.prevBalance - r.payment);
  }, 0);

  const formatDateForDisplay = (isoDate: string) => {
      if (!isoDate) return '';
      const [year, month, day] = isoDate.split('-');
      const date = new Date(parseInt(year), parseInt(month)-1, parseInt(day));
      return date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
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

  return (
    <div className="h-full flex flex-col bg-slate-950 p-4 sm:p-6 overflow-hidden print:bg-white print:p-0 print:h-auto print:overflow-visible">
        
        {/* History Modal */}
        {showHistoryModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
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

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-md print:bg-transparent print:border-none print:shadow-none print:mb-2 print:p-0 relative z-30">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-900/30 border border-emerald-500/30 rounded-lg print:hidden">
                    <MapPin className="text-emerald-400" size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white uppercase tracking-wider print:text-black print:text-2xl">Planilla de Reparto</h2>
                    <p className="text-sm font-bold text-emerald-400 uppercase print:text-black print:text-lg">{zoneName}</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                
                {/* General Mode Actions */}
                {!isRestricted && (
                    <>
                        <button 
                            onClick={() => setShowHistoryModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors print:hidden"
                            title="Ver Historial"
                        >
                            <History size={18} />
                            <span className="text-sm font-bold hidden sm:inline">Historial</span>
                        </button>

                        <button 
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors print:hidden"
                            title="Imprimir Planilla"
                        >
                            <Printer size={18} />
                            <span className="text-sm font-bold hidden sm:inline">Imprimir</span>
                        </button>
                    </>
                )}

                <div className="relative">
                    {isRestricted ? (
                         <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-full border border-slate-800 print:border-none print:bg-transparent print:p-0">
                            <Calendar className="text-slate-400 print:hidden" size={18} />
                            <span className="text-white text-sm font-bold print:text-black capitalize">{formatDateForDisplay(currentDate)}</span>
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

        {/* Table Container */}
        <div className="flex-1 bg-white rounded-xl border border-slate-300 shadow-xl overflow-hidden flex flex-col print:shadow-none print:border-none print:rounded-none z-0">
            <div className="overflow-auto custom-scrollbar flex-1 relative bg-slate-50 print:bg-white print:overflow-visible">
                <table className="w-full border-collapse min-w-[1000px] print:min-w-0">
                    <thead className="sticky top-0 z-10 bg-slate-100 text-xs font-bold text-slate-600 uppercase tracking-wider shadow-sm print:static print:shadow-none print:bg-white print:text-black print:border-b-2 print:border-black">
                        <tr>
                            <th className="p-3 border-b border-r border-slate-300 text-left w-48 print:border-black print:text-black">Cliente</th>
                            <th className="p-3 border-b border-r border-slate-300 text-left w-48 print:border-black print:text-black">Artículo</th>
                            <th className="p-3 border-b border-r border-slate-300 text-center w-24 print:border-black print:text-black">Cant. Kg</th>
                            <th className="p-3 border-b border-r border-slate-300 text-center w-24 print:border-black print:text-black">Precio Kg</th>
                            <th className="p-3 border-b border-r border-slate-300 text-right w-32 bg-slate-200 print:bg-transparent print:border-black print:text-black">Subtotal</th>
                            <th className="p-3 border-b border-r border-slate-300 text-right w-32 print:border-black print:text-black">Saldo Ant.</th>
                            <th className="p-3 border-b border-r border-slate-300 text-right w-32 text-emerald-700 print:text-black print:border-black">Entrega</th>
                            <th className="p-3 border-b border-slate-300 text-right w-32 bg-slate-200 text-indigo-700 print:bg-transparent print:text-black print:border-black">Saldo Act.</th>
                            <th className="p-3 border-b border-slate-300 w-12 print:hidden"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {rows.map((row) => {
                            const subtotal = row.weight * row.price;
                            const currentBalance = subtotal + row.prevBalance - row.payment;

                            return (
                                <tr key={row.id} className="group hover:bg-indigo-50/30 transition-colors border-b border-slate-200 last:border-0 print:border-black print:hover:bg-transparent">
                                    <td className="p-0 border-r border-slate-200 print:border-black h-12">
                                        <TextInput 
                                            value={row.client}
                                            onChange={(v) => handleUpdateRow(row.id, 'client', v)}
                                            placeholder="Nombre Cliente"
                                            className="text-sm font-medium text-slate-800 print:text-black"
                                        />
                                    </td>
                                    <td className="p-0 border-r border-slate-200 print:border-black h-12">
                                        <ProductSelect 
                                            value={row.product}
                                            onChange={(v) => handleUpdateRow(row.id, 'product', v)}
                                            className="text-sm text-slate-600 print:text-black"
                                        />
                                    </td>
                                    <td className="p-0 border-r border-slate-200 h-12 print:border-black print:h-auto">
                                        <NumericInput 
                                            value={row.weight} 
                                            onChange={(v) => handleUpdateRow(row.id, 'weight', v)}
                                            className="text-slate-800 font-mono text-sm print:text-black text-center"
                                        />
                                    </td>
                                    <td className="p-0 border-r border-slate-200 h-12 print:border-black print:h-auto">
                                        <NumericInput 
                                            value={row.price} 
                                            onChange={(v) => handleUpdateRow(row.id, 'price', v)}
                                            className="text-slate-800 font-mono text-sm print:text-black text-center"
                                            isCurrency
                                        />
                                    </td>
                                    <td className="p-3 border-r border-slate-200 text-right bg-slate-50 font-mono font-bold text-slate-700 text-sm print:bg-transparent print:text-black print:border-black print:p-1">
                                        {formatCurrency(subtotal)}
                                    </td>
                                    <td className="p-0 border-r border-slate-200 h-12 print:border-black print:h-auto">
                                        {isRestricted ? (
                                             <div className="w-full h-full flex items-center justify-end px-3 text-slate-600 font-mono text-sm print:text-black print:p-1">
                                                {formatCurrency(row.prevBalance)}
                                             </div>
                                        ) : (
                                            <NumericInput 
                                                value={row.prevBalance} 
                                                onChange={(v) => handleUpdateRow(row.id, 'prevBalance', v)}
                                                className="text-slate-600 font-mono text-sm print:text-black text-right"
                                                isCurrency
                                            />
                                        )}
                                    </td>
                                    <td className="p-0 border-r border-slate-200 h-12 bg-emerald-50/30 print:bg-transparent print:border-black print:h-auto">
                                        <NumericInput 
                                            value={row.payment} 
                                            onChange={(v) => handleUpdateRow(row.id, 'payment', v)}
                                            className="text-emerald-700 font-bold font-mono text-sm print:text-black text-right"
                                            isCurrency
                                        />
                                    </td>
                                    <td className="p-3 text-right bg-slate-50 font-mono font-bold text-indigo-700 text-sm border-r border-slate-200 print:bg-transparent print:text-black print:border-black print:p-1">
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
                    <tfoot className="sticky bottom-0 z-20 bg-slate-800 text-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] print:static print:bg-transparent print:text-black print:shadow-none print:border-t-2 print:border-black">
                        <tr className="text-xs font-bold uppercase tracking-wider">
                            <td colSpan={4} className="p-3 text-right border-r border-slate-600 print:border-black">Totales</td>
                            <td className="p-3 text-right border-r border-slate-600 font-mono text-amber-300 print:text-black print:border-black">{formatCurrency(totalSubtotal)}</td>
                            <td className="p-3 border-r border-slate-600 print:border-black"></td>
                            <td className="p-3 text-right border-r border-slate-600 font-mono text-emerald-300 print:text-black print:border-black">{formatCurrency(totalPayment)}</td>
                            <td className="p-3 text-right font-mono text-indigo-300 border-r border-slate-600 print:text-black print:border-black">{formatCurrency(totalCurrentBalance)}</td>
                            <td className="print:hidden"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>

        {/* Summary Table by Category */}
        <div className="mt-6 bg-white rounded-xl border border-slate-300 shadow-md overflow-hidden max-w-lg print:mt-4 print:shadow-none print:border-black print:border print:rounded-none">
            <table className="w-full border-collapse">
                <thead className="bg-slate-100 text-xs font-bold text-slate-600 uppercase tracking-wider print:bg-white print:text-black print:border-b print:border-black">
                    <tr>
                        <th className="p-3 text-left border-r border-slate-300 print:border-black">Categoría</th>
                        <th className="p-3 text-center border-r border-slate-300 print:border-black">Cantidad Kg</th>
                        <th className="p-3 text-center border-r border-slate-300 print:border-black">P.P.P.</th>
                        <th className="p-3 text-right print:border-black">Subtotal</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 print:divide-black">
                    {summaryStats.map((stat) => (
                        <tr key={stat.category} className="text-sm print:text-black">
                            <td className="p-3 font-medium text-slate-800 border-r border-slate-200 print:border-black print:text-black">{stat.category}</td>
                            <td className="p-3 text-center font-mono text-slate-600 border-r border-slate-200 print:border-black print:text-black">{formatDecimal(stat.totalWeight)}</td>
                            <td className="p-3 text-center font-mono text-slate-600 border-r border-slate-200 print:border-black print:text-black">{formatCurrency(stat.ppp)}</td>
                            <td className="p-3 text-right font-mono font-bold text-slate-800 print:text-black">{formatCurrency(stat.totalMoney)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot className="font-bold text-slate-800 bg-white print:text-black border-t-2 border-slate-300 print:border-black">
                    <tr className="text-sm">
                        <td className="p-3 border-r border-slate-200 print:border-black">Total de Pollo</td>
                        <td className="p-3 text-center border-r border-slate-200 print:border-black font-mono">{formatDecimal(totalSummaryWeight)}</td>
                        <td className="p-3 border-r border-slate-200 print:border-black text-right">Precio</td>
                        <td className="p-3 text-right print:border-black font-mono">{formatCurrency(totalSummaryPPP)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>

    </div>
  );
};
