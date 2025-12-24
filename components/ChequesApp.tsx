import React from 'react';
import { Database, ref, onValue, set } from 'firebase/database';
import { Plus, Minus, Trash2, Calendar, DollarSign, User, CreditCard, ArrowDown, Building2, ArrowUp, ArrowUpDown, X, Check, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [showForm, setShowForm] = React.useState(false);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

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
      setShowForm(false); 
  };

  const handleDeleteCheque = (id: string) => {
      if (window.confirm("¿Eliminar este cheque de la lista?")) {
          const updatedList = cheques.filter(c => c.id !== id);
          saveCheques(updatedList);
          if (expandedId === id) setExpandedId(null);
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
              const aValue = (a[sortConfig.key!] || '').toString().toLowerCase();
              const bValue = (b[sortConfig.key!] || '').toString().toLowerCase();

              if (sortConfig.key === 'amount') {
                  const numA = Number(a.amount) || 0;
                  const numB = Number(b.amount) || 0;
                  return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
              }

              if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
              if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
              return 0;
          });
      }
      return sortableItems;
  }, [cheques, sortConfig]);

  if (loading) return <div className="text-violet-400 p-8 animate-pulse text-center">Cargando Cheques...</div>;

  const SortIcon = ({ column }: { column: SortKey }) => {
      if (sortConfig.key !== column) return <ArrowUpDown size={14} className="text-slate-700 opacity-50 group-hover:opacity-100" />;
      if (sortConfig.direction === 'asc') return <ArrowUp size={14} className="text-violet-400" />;
      return <ArrowDown size={14} className="text-violet-400" />;
  };

  const ThSortable = ({ label, column, alignRight = false, hiddenOnMobile = false }: { label: string, column: SortKey, alignRight?: boolean, hiddenOnMobile?: boolean }) => (
      <th 
          className={`p-4 cursor-pointer hover:bg-slate-800 transition-colors select-none group ${alignRight ? 'text-right' : 'text-left'} ${hiddenOnMobile ? 'hidden md:table-cell' : ''}`}
          onClick={(e) => { e.stopPropagation(); handleSort(column); }}
      >
          <div className={`flex items-center gap-2 ${alignRight ? 'justify-end' : 'justify-start'}`}>
              <span className={sortConfig.key === column ? 'text-violet-300' : 'text-slate-500 group-hover:text-slate-300'}>{label}</span>
              <SortIcon column={column} />
          </div>
      </th>
  );

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950">
        
        {/* Top Header / Stats */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 shadow-md z-20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-violet-400 uppercase tracking-wider flex items-center gap-2">
                <CreditCard size={24} /> Cheques en Cartera
            </h2>
            <div className="bg-slate-950 px-6 py-3 rounded-xl border border-violet-900/50 flex flex-col items-end shadow-lg shadow-violet-900/10 w-full sm:w-auto">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Total Cartera</span>
                <span className="text-2xl font-mono font-bold text-violet-300">
                    {formatCurrency(totalAmount)}
                </span>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 sm:p-6 custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Collapsable Add Form */}
                <div className={`bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg transition-all ${showForm ? 'border-violet-500/50' : ''}`}>
                    <button 
                        onClick={() => setShowForm(!showForm)}
                        className={`w-full flex items-center justify-between p-5 ${showForm ? 'bg-slate-800/50' : 'hover:bg-slate-800/30'} transition-colors`}
                    >
                        <div className="flex items-center gap-3">
                            <Plus size={20} className={showForm ? 'text-violet-400' : 'text-slate-500'} />
                            <h3 className={`text-sm font-bold uppercase tracking-widest ${showForm ? 'text-slate-100' : 'text-slate-400'}`}>Nuevo Cheque</h3>
                        </div>
                        {showForm ? <Minus className="text-slate-500" /> : <Plus className="text-slate-500" />}
                    </button>

                    {showForm && (
                        <form onSubmit={handleAddCheque} className="p-5 border-t border-slate-800 animate-in slide-in-from-top-2 duration-200">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                
                                <div className="relative">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Fecha Registro</span>
                                    <div className="relative">
                                        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                        <input 
                                            type="date" 
                                            required
                                            value={formData.date}
                                            onChange={e => setFormData({...formData, date: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-8 pr-3 text-sm text-white focus:border-violet-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                 <div className="relative">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Banco</span>
                                    <div className="relative">
                                        <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                        <input 
                                            type="text" 
                                            placeholder="Nombre del Banco"
                                            required
                                            value={formData.bank}
                                            onChange={e => setFormData({...formData, bank: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-8 pr-3 text-sm text-white focus:border-violet-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                 <div className="relative">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">N° Cheque</span>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            placeholder="00000000"
                                            required
                                            value={formData.number}
                                            onChange={e => setFormData({...formData, number: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-sm text-white focus:border-violet-500 focus:outline-none font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="relative">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Monto</span>
                                    <div className="relative">
                                        <DollarSign className="absolute left-1 top-1/2 -translate-y-1/2 text-violet-500" size={14} />
                                        <input 
                                            type="text" 
                                            inputMode="numeric"
                                            placeholder="0"
                                            required
                                            value={amountDisplay}
                                            onChange={handleAmountInput}
                                            className="w-full bg-slate-950 border border-violet-900/50 rounded-lg py-2 pl-6 pr-2 text-sm text-violet-300 font-mono focus:border-violet-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="relative">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Fecha Cobro</span>
                                    <div className="relative">
                                        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                        <input 
                                            type="date" 
                                            required
                                            value={formData.paymentDate}
                                            onChange={e => setFormData({...formData, paymentDate: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-8 pr-3 text-sm text-white focus:border-violet-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="relative">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Titular</span>
                                    <div className="relative">
                                        <User className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                        <input 
                                            type="text" 
                                            placeholder="Nombre Titular"
                                            value={formData.holder}
                                            onChange={e => setFormData({...formData, holder: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-8 pr-3 text-sm text-white focus:border-violet-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                 <div className="relative">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Entregado Por</span>
                                    <div className="relative">
                                        <ArrowDown className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                        <input 
                                            type="text" 
                                            placeholder="¿Quién lo entregó?"
                                            value={formData.deliveredBy}
                                            onChange={e => setFormData({...formData, deliveredBy: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-8 pr-3 text-sm text-white focus:border-violet-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-end">
                                    <button 
                                        type="submit"
                                        className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center shadow-lg shadow-violet-900/20"
                                    >
                                        <Plus size={20} /> Guardar Cheque
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                {/* Tabla */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950 border-b border-slate-800 text-xs font-bold uppercase tracking-wider">
                                    <ThSortable label="F. Registro" column="date" />
                                    <ThSortable label="F. Cobro" column="paymentDate" hiddenOnMobile />
                                    <ThSortable label="Banco" column="bank" hiddenOnMobile />
                                    <ThSortable label="Número" column="number" hiddenOnMobile />
                                    <ThSortable label="Titular" column="holder" hiddenOnMobile />
                                    <ThSortable label="Entregado Por" column="deliveredBy" />
                                    <ThSortable label="Monto" column="amount" alignRight />
                                    <th className="p-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {sortedCheques.map((c) => {
                                    const isExpanded = expandedId === c.id;
                                    return (
                                        <React.Fragment key={c.id}>
                                            <tr 
                                                onClick={() => toggleExpand(c.id)}
                                                className={`hover:bg-slate-800/30 transition-colors group cursor-pointer ${isExpanded ? 'bg-slate-800/20' : ''}`}
                                            >
                                                <td className="p-3 text-sm text-slate-400 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <span className="md:hidden">
                                                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                        </span>
                                                        {formatDate(c.date)}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-sm text-white font-bold whitespace-nowrap hidden md:table-cell">{formatDate(c.paymentDate)}</td>
                                                <td className="p-3 text-sm text-slate-300 font-medium hidden md:table-cell">{c.bank}</td>
                                                <td className="p-3 text-sm text-slate-300 font-mono hidden md:table-cell">{c.number}</td>
                                                <td className="p-3 text-sm text-slate-300 hidden md:table-cell">{c.holder}</td>
                                                <td className="p-3 text-sm text-slate-300">{c.deliveredBy}</td>
                                                <td className="p-3 text-right font-mono font-bold text-violet-300 bg-slate-900/30">
                                                    {formatCurrency(c.amount)}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteCheque(c.id); }}
                                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-rose-500 hover:bg-rose-950/30 rounded transition-all"
                                                        title="Eliminar Cheque"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                            {/* Expandable row for mobile/all screens when clicked */}
                                            {isExpanded && (
                                                <tr className="bg-slate-900/40 animate-in slide-in-from-top-1 duration-200">
                                                    <td colSpan={8} className="p-4">
                                                        <div className="grid grid-cols-1 gap-3 text-sm">
                                                            <div className="flex justify-between border-b border-slate-800 pb-1">
                                                                <span className="text-slate-500 uppercase font-bold text-[10px]">F. Cobro</span>
                                                                <span className="text-white font-bold">{formatDate(c.paymentDate)}</span>
                                                            </div>
                                                            <div className="flex justify-between border-b border-slate-800 pb-1">
                                                                <span className="text-slate-500 uppercase font-bold text-[10px]">Banco</span>
                                                                <span className="text-slate-300">{c.bank}</span>
                                                            </div>
                                                            <div className="flex justify-between border-b border-slate-800 pb-1">
                                                                <span className="text-slate-500 uppercase font-bold text-[10px]">N° Cheque</span>
                                                                <span className="text-slate-300 font-mono">{c.number}</span>
                                                            </div>
                                                            <div className="flex justify-between border-b border-slate-800 pb-1">
                                                                <span className="text-slate-500 uppercase font-bold text-[10px]">Titular</span>
                                                                <span className="text-slate-300">{c.holder}</span>
                                                            </div>
                                                            <div className="md:hidden flex justify-end pt-2">
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteCheque(c.id); }}
                                                                    className="flex items-center gap-2 text-rose-500 text-xs font-bold px-3 py-1.5 bg-rose-500/10 rounded border border-rose-500/20"
                                                                >
                                                                    <Trash2 size={14} /> Eliminar
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
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