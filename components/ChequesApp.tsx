import React from 'react';
import { Database, ref, onValue, set } from 'firebase/database';
import { Plus, Trash2, Calendar, DollarSign, User, CreditCard, ArrowDown, Building2, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Cheque } from '../types';
import { generateId } from '../utils';

interface ChequesAppProps {
  db: Database | null;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
};

type SortKey = keyof Cheque | null;
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

export const ChequesApp: React.FC<ChequesAppProps> = ({ db }) => {
  const [cheques, setCheques] = React.useState<Cheque[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Sorting State
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({ key: 'paymentDate', direction: 'asc' });

  // Form State
  const [formData, setFormData] = React.useState({
      date: new Date().toISOString().slice(0, 10),
      bank: '',
      number: '',
      amount: 0,
      paymentDate: '',
      holder: '',
      deliveredBy: ''
  });
  
  // Input Display for Amount
  const [amountDisplay, setAmountDisplay] = React.useState('');

  // Load Data
  React.useEffect(() => {
    if (db) {
      setLoading(true);
      const chequesRef = ref(db, `cheques`);
      const unsubscribe = onValue(chequesRef, (snapshot) => {
        const val = snapshot.val();
        if (val) {
           const list = Array.isArray(val) ? val : Object.values(val);
           setCheques(list as Cheque[]);
        } else {
           setCheques([]);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
       const saved = localStorage.getItem('cheques');
       if (saved) {
           try { setCheques(JSON.parse(saved)); } catch (e) { setCheques([]); }
       } else {
           setCheques([]);
       }
       setLoading(false);
    }
  }, [db]);

  const saveCheques = (newList: Cheque[]) => {
      if (db) {
          set(ref(db, `cheques`), newList);
      } else {
          setCheques(newList);
          localStorage.setItem('cheques', JSON.stringify(newList));
      }
  };

  const handleAmountInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      const digits = val.replace(/\D/g, '');
      
      if (digits === '') {
          setAmountDisplay('');
          setFormData(prev => ({ ...prev, amount: 0 }));
          return;
      }
      
      const num = parseInt(digits, 10);
      if (!isNaN(num)) {
          setAmountDisplay(new Intl.NumberFormat('es-AR').format(num));
          setFormData(prev => ({ ...prev, amount: num }));
      }
  };

  const handleAddCheque = (e: React.FormEvent) => {
      e.preventDefault();
      const newCheque: Cheque = {
          id: generateId(),
          ...formData
      };
      
      const updatedList = [...cheques, newCheque];
      saveCheques(updatedList);
      
      // Reset sensitive fields
      setFormData(prev => ({
          ...prev,
          bank: '',
          number: '',
          amount: 0,
          paymentDate: '',
          holder: '',
          deliveredBy: ''
      }));
      setAmountDisplay('');
  };

  const handleDeleteCheque = (id: string) => {
      if (window.confirm("¿Eliminar este cheque de la lista?")) {
          const updatedList = cheques.filter(c => c.id !== id);
          saveCheques(updatedList);
      }
  };

  const totalAmount = cheques.reduce((acc, c) => acc + c.amount, 0);

  // Sorting Logic
  const handleSort = (key: SortKey) => {
      let direction: SortDirection = 'asc';
      if (sortConfig.key === key && sortConfig.direction === 'asc') {
          direction = 'desc';
      }
      setSortConfig({ key, direction });
  };

  const sortedCheques = React.useMemo(() => {
      let sortableItems = [...cheques];
      if (sortConfig.key !== null) {
          sortableItems.sort((a, b) => {
              // @ts-ignore
              const aValue = a[sortConfig.key];
              // @ts-ignore
              const bValue = b[sortConfig.key];

              if (aValue < bValue) {
                  return sortConfig.direction === 'asc' ? -1 : 1;
              }
              if (aValue > bValue) {
                  return sortConfig.direction === 'asc' ? 1 : -1;
              }
              return 0;
          });
      }
      return sortableItems;
  }, [cheques, sortConfig]);

  if (loading) return <div className="text-violet-500 p-8 animate-pulse text-center">Cargando Cheques...</div>;

  const SortIcon = ({ column }: { column: SortKey }) => {
      if (sortConfig.key !== column) return <ArrowUpDown size={14} className="text-slate-400 opacity-50 group-hover:opacity-100" />;
      if (sortConfig.direction === 'asc') return <ArrowUp size={14} className="text-violet-500" />;
      return <ArrowDown size={14} className="text-violet-500" />;
  };

  const ThSortable = ({ label, column, alignRight = false }: { label: string, column: SortKey, alignRight?: boolean }) => (
      <th 
          className={`p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none group ${alignRight ? 'text-right' : 'text-left'}`}
          onClick={() => handleSort(column)}
      >
          <div className={`flex items-center gap-2 ${alignRight ? 'justify-end' : 'justify-start'}`}>
              <span className={sortConfig.key === column ? 'text-violet-600 dark:text-violet-300' : 'text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'}>{label}</span>
              <SortIcon column={column} />
          </div>
      </th>
  );

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        
        {/* Top Header / Stats */}
        <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm z-20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider flex items-center gap-2">
                <CreditCard size={24} /> Cheques en Cartera
            </h2>
            <div className="bg-slate-50 dark:bg-slate-950 px-6 py-3 rounded-xl border border-violet-200 dark:border-violet-900/50 flex flex-col items-end shadow-sm dark:shadow-violet-900/10">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Total Cartera</span>
                <span className="text-2xl font-mono font-bold text-violet-700 dark:text-violet-300">
                    {formatCurrency(totalAmount)}
                </span>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 sm:p-6 custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Formulario */}
                <form onSubmit={handleAddCheque} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Plus size={14} /> Agregar Cheque
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        
                        {/* Fecha Ingreso */}
                        <div className="relative">
                            <span className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Fecha Registro</span>
                            <div className="relative">
                                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input 
                                    type="date" 
                                    required
                                    value={formData.date}
                                    onChange={e => setFormData({...formData, date: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-8 pr-3 text-sm text-slate-700 dark:text-white focus:border-violet-500 focus:outline-none"
                                />
                            </div>
                        </div>

                         {/* Banco */}
                         <div className="relative">
                            <span className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Banco</span>
                            <div className="relative">
                                <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input 
                                    type="text" 
                                    placeholder="Nombre del Banco"
                                    required
                                    value={formData.bank}
                                    onChange={e => setFormData({...formData, bank: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-8 pr-3 text-sm text-slate-700 dark:text-white focus:border-violet-500 focus:outline-none"
                                />
                            </div>
                        </div>

                         {/* Número */}
                         <div className="relative">
                            <span className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">N° Cheque</span>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="00000000"
                                    required
                                    value={formData.number}
                                    onChange={e => setFormData({...formData, number: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-sm text-slate-700 dark:text-white focus:border-violet-500 focus:outline-none font-mono"
                                />
                            </div>
                        </div>

                        {/* Monto */}
                        <div className="relative">
                            <span className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Monto</span>
                            <div className="relative">
                                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 text-violet-500" size={14} />
                                <input 
                                    type="text" 
                                    inputMode="numeric"
                                    placeholder="0"
                                    required
                                    value={amountDisplay}
                                    onChange={handleAmountInput}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-violet-200 dark:border-violet-900/50 rounded-lg py-2 pl-6 pr-2 text-sm text-violet-700 dark:text-violet-300 font-mono focus:border-violet-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Fecha Cobro */}
                        <div className="relative">
                            <span className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Fecha Cobro</span>
                            <div className="relative">
                                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input 
                                    type="date" 
                                    required
                                    value={formData.paymentDate}
                                    onChange={e => setFormData({...formData, paymentDate: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-8 pr-3 text-sm text-slate-700 dark:text-white focus:border-violet-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Titular */}
                        <div className="relative">
                            <span className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Titular</span>
                            <div className="relative">
                                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input 
                                    type="text" 
                                    placeholder="Nombre Titular"
                                    value={formData.holder}
                                    onChange={e => setFormData({...formData, holder: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-8 pr-3 text-sm text-slate-700 dark:text-white focus:border-violet-500 focus:outline-none"
                                />
                            </div>
                        </div>

                         {/* Entregado Por */}
                         <div className="relative">
                            <span className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Entregado Por</span>
                            <div className="relative">
                                <ArrowDown className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input 
                                    type="text" 
                                    placeholder="¿Quién lo entregó?"
                                    value={formData.deliveredBy}
                                    onChange={e => setFormData({...formData, deliveredBy: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-8 pr-3 text-sm text-slate-700 dark:text-white focus:border-violet-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex items-end">
                            <button 
                                type="submit"
                                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center shadow-lg shadow-violet-200 dark:shadow-violet-900/20"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                    </div>
                </form>

                {/* Tabla */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider">
                                    <ThSortable label="F. Registro" column="date" />
                                    <ThSortable label="F. Cobro" column="paymentDate" />
                                    <ThSortable label="Banco" column="bank" />
                                    <ThSortable label="Número" column="number" />
                                    <ThSortable label="Titular" column="holder" />
                                    <ThSortable label="Entregado Por" column="deliveredBy" />
                                    <ThSortable label="Monto" column="amount" alignRight />
                                    <th className="p-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {sortedCheques.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                        <td className="p-3 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(c.date)}</td>
                                        <td className="p-3 text-sm text-slate-800 dark:text-white font-bold whitespace-nowrap">{formatDate(c.paymentDate)}</td>
                                        <td className="p-3 text-sm text-slate-700 dark:text-slate-300 font-medium">{c.bank}</td>
                                        <td className="p-3 text-sm text-slate-600 dark:text-slate-300 font-mono">{c.number}</td>
                                        <td className="p-3 text-sm text-slate-600 dark:text-slate-300">{c.holder}</td>
                                        <td className="p-3 text-sm text-slate-600 dark:text-slate-300">{c.deliveredBy}</td>
                                        <td className="p-3 text-right font-mono font-bold text-violet-600 dark:text-violet-300 bg-slate-50/50 dark:bg-slate-900/30">
                                            {formatCurrency(c.amount)}
                                        </td>
                                        <td className="p-3 text-center">
                                            <button 
                                                onClick={() => handleDeleteCheque(c.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/30 rounded transition-all"
                                                title="Eliminar Cheque"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {sortedCheques.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-slate-500 italic">No hay cheques registrados.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};