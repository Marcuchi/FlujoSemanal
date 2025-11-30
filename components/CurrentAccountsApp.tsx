
import React from 'react';
import { Database, ref, onValue, set } from 'firebase/database';
import { ArrowLeft, Plus, Trash2, Edit2, Save, X, DollarSign, Calendar, FileText, ArrowUpDown, AlertTriangle } from 'lucide-react';
import { CCData, CCAccountData, CCTransaction } from '../types';
import { generateId } from '../utils';

interface CurrentAccountsAppProps {
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

export const CurrentAccountsApp: React.FC<CurrentAccountsAppProps> = ({ db }) => {
  const [data, setData] = React.useState<CCData>({});
  const [selectedAccount, setSelectedAccount] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Sorting State
  const [sortNewest, setSortNewest] = React.useState(true);

  // Dashboard State
  const [isDeleteMode, setIsDeleteMode] = React.useState(false);

  // New Transaction State
  const [newDate, setNewDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [newDesc, setNewDesc] = React.useState('');
  
  // Input Display States (for formatting)
  const [deliveryDisplay, setDeliveryDisplay] = React.useState('');
  const [debitDisplay, setDebitDisplay] = React.useState('');
  // Raw numeric values for logic
  const [rawDelivery, setRawDelivery] = React.useState(0);
  const [rawDebit, setRawDebit] = React.useState(0);
  
  // Edit Initial Balance State
  const [isEditingInitial, setIsEditingInitial] = React.useState(false);
  const [tempInitial, setTempInitial] = React.useState('');

  // Load Data (Global Listener)
  React.useEffect(() => {
    if (db) {
      setLoading(true);
      const ccRef = ref(db, `current_accounts`);
      
      const unsubscribe = onValue(ccRef, (snapshot) => {
        const val = snapshot.val();
        if (val) {
           setData(val);
        } else {
           setData({});
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
       // Local Storage Fallback
       const saved = localStorage.getItem('current_accounts');
       if (saved) {
           try { setData(JSON.parse(saved)); } catch (e) { setData({}); }
       }
       setLoading(false);
    }
  }, [db]);

  const saveData = (newData: CCData) => {
      if (db) {
          set(ref(db, `current_accounts`), newData);
      } else {
          setData(newData);
          localStorage.setItem('current_accounts', JSON.stringify(newData));
      }
  };

  const getAccountData = (name: string): CCAccountData => {
      return data[name] || { initialBalance: 0, transactions: [] };
  };

  const calculateBalance = (account: CCAccountData) => {
      let balance = account.initialBalance || 0;
      if (account.transactions) {
          account.transactions.forEach(t => {
              balance = balance + (t.debit || 0) - (t.delivery || 0);
          });
      }
      return balance;
  };

  // --- Handlers ---

  const handleCreateAccount = () => {
      const name = window.prompt("Nombre de la nueva cuenta:");
      if (!name || name.trim() === "") return;
      
      if (data[name]) {
          alert("Esa cuenta ya existe.");
          return;
      }
      
      saveData({ ...data, [name]: { initialBalance: 0, transactions: [] } });
  };

  const handleDeleteAccount = (name: string) => {
      if (window.confirm(`¿Estás seguro de eliminar permanentemente la cuenta "${name}"?`)) {
          const newData = { ...data };
          delete newData[name];
          saveData(newData);
      }
  };

  const handleUpdateInitial = () => {
      if (!selectedAccount) return;
      const digits = tempInitial.replace(/\D/g, '');
      const num = parseInt(digits, 10) || 0;
      
      const currentAccount = getAccountData(selectedAccount);
      const updatedAccount = { ...currentAccount, initialBalance: num };
      
      saveData({ ...data, [selectedAccount]: updatedAccount });
      setIsEditingInitial(false);
  };

  const handleInitialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      const digits = val.replace(/\D/g, '');
      if (digits === '') {
          setTempInitial('');
          return;
      }
      const num = parseInt(digits, 10);
      const formatted = new Intl.NumberFormat('es-AR').format(num);
      setTempInitial(formatted);
  };

  const handleMoneyInput = (e: React.ChangeEvent<HTMLInputElement>, setDisplay: Function, setRaw: Function) => {
      const val = e.target.value;
      const digits = val.replace(/\D/g, '');
      
      if (digits === '') {
          setDisplay('');
          setRaw(0);
          return;
      }
      
      const num = parseInt(digits, 10);
      if (!isNaN(num)) {
          const formatted = new Intl.NumberFormat('es-AR').format(num);
          setDisplay(formatted);
          setRaw(num);
      }
  };

  const handleAddTransaction = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedAccount) return;

      const transaction: CCTransaction = {
          id: generateId(),
          date: newDate,
          description: newDesc,
          delivery: rawDelivery,
          debit: rawDebit
      };

      const currentAccount = getAccountData(selectedAccount);
      const updatedTransactions = [...(currentAccount.transactions || []), transaction];
      
      const updatedAccount = { ...currentAccount, transactions: updatedTransactions };
      
      saveData({ ...data, [selectedAccount]: updatedAccount });

      // Reset Form
      setNewDesc('');
      setDeliveryDisplay('');
      setRawDelivery(0);
      setDebitDisplay('');
      setRawDebit(0);
  };

  const handleRemoveTransaction = (id: string) => {
      if (!selectedAccount) return;
      if (!window.confirm('¿Eliminar este movimiento?')) return;

      const currentAccount = getAccountData(selectedAccount);
      const updatedTransactions = currentAccount.transactions.filter(t => t.id !== id);
      
      saveData({ ...data, [selectedAccount]: { ...currentAccount, transactions: updatedTransactions } });
  };

  if (loading) return <div className="text-emerald-400 p-8 animate-pulse text-center">Cargando Cuentas...</div>;

  // --- VIEW 1: DASHBOARD (List of Accounts) ---
  if (!selectedAccount) {
      const accountNames = Object.keys(data).sort();
      
      return (
        <div className="h-full flex flex-col bg-slate-950 p-4 sm:p-8 overflow-y-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 max-w-5xl mx-auto w-full gap-4">
                <h2 className="text-2xl font-bold text-emerald-400 uppercase tracking-widest text-center sm:text-left">Cuentas Corrientes</h2>
                
                {/* Delete Mode Toggle */}
                <div className="flex items-center gap-3 bg-slate-900 p-2 rounded-xl border border-slate-800 shadow-sm">
                    <span className={`text-xs font-bold uppercase tracking-wider ${isDeleteMode ? 'text-rose-400' : 'text-slate-500'}`}>
                        {isDeleteMode ? 'Modo Eliminar' : 'Gestión'}
                    </span>
                    <button 
                        onClick={() => setIsDeleteMode(!isDeleteMode)}
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out relative ${isDeleteMode ? 'bg-rose-900' : 'bg-slate-700'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isDeleteMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
                {accountNames.map(name => {
                    const accData = getAccountData(name);
                    const balance = calculateBalance(accData);
                    const hasTransactions = (accData.transactions || []).length > 0;
                    const canDelete = !hasTransactions;

                    // Logic for card interaction based on mode
                    if (isDeleteMode) {
                        if (canDelete) {
                            // DELETABLE STATE
                            return (
                                <button 
                                    key={name}
                                    onClick={() => handleDeleteAccount(name)}
                                    className="bg-rose-950/20 border-2 border-dashed border-rose-500/50 hover:bg-rose-900/30 hover:border-rose-400 transition-all rounded-2xl p-6 flex flex-col items-center justify-center gap-4 group cursor-pointer animate-pulse"
                                >
                                    <div className="h-16 w-16 rounded-full bg-rose-900/50 border border-rose-700 flex items-center justify-center">
                                        <Trash2 size={32} className="text-rose-400" />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-lg font-bold text-rose-300 line-through decoration-rose-500">{name}</h3>
                                        <p className="text-xs text-rose-400 font-bold mt-2">ELIMINAR CUENTA VACÍA</p>
                                    </div>
                                </button>
                            );
                        } else {
                            // LOCKED STATE (Protected)
                            return (
                                <div 
                                    key={name}
                                    className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 opacity-40 cursor-not-allowed grayscale"
                                >
                                    <div className="h-16 w-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                                        <span className="text-2xl font-bold text-slate-600">{name.charAt(0)}</span>
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-lg font-bold text-slate-500">{name}</h3>
                                        <p className="text-xs text-slate-600 mt-1 flex items-center justify-center gap-1">
                                            <AlertTriangle size={10} /> Contiene datos
                                        </p>
                                    </div>
                                </div>
                            );
                        }
                    }

                    // NORMAL STATE
                    return (
                        <button 
                            key={name}
                            onClick={() => setSelectedAccount(name)}
                            className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800 transition-all rounded-2xl p-6 flex flex-col items-center justify-center gap-4 group shadow-lg"
                        >
                            <div className="h-16 w-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="text-2xl font-bold text-slate-400 group-hover:text-emerald-400">{name.charAt(0)}</span>
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-bold text-slate-200">{name}</h3>
                                <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Saldo Actual</p>
                                <p className={`text-2xl font-mono font-bold mt-1 ${balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    {formatCurrency(balance)}
                                </p>
                            </div>
                        </button>
                    );
                })}

                {/* Create New Account Button (Hide in Delete Mode) */}
                {!isDeleteMode && (
                    <button 
                        onClick={handleCreateAccount}
                        className="bg-slate-900/50 border border-dashed border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 transition-all rounded-2xl p-6 flex flex-col items-center justify-center gap-4 group shadow-lg"
                    >
                        <div className="h-16 w-16 rounded-full bg-slate-800/50 border border-slate-700/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus size={32} className="text-slate-500 group-hover:text-emerald-400" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-slate-300 group-hover:text-emerald-300">Agregar Cuenta Corriente</h3>
                        </div>
                    </button>
                )}
            </div>
        </div>
      );
  }

  // --- VIEW 2: DETAIL (Specific Account Ledger) ---
  const accountData = getAccountData(selectedAccount);
  
  // Calculate running balance chronologically FIRST
  let runningBalance = accountData.initialBalance || 0;
  const transactionsWithBalance = (accountData.transactions || []).map(t => {
      runningBalance = runningBalance + (t.debit || 0) - (t.delivery || 0);
      return { ...t, balanceAfter: runningBalance };
  });

  // Then handle display order
  const displayTransactions = sortNewest 
      ? [...transactionsWithBalance].reverse() 
      : [...transactionsWithBalance];

  return (
    <div className="h-full flex flex-col bg-slate-950">
        
        {/* Top Bar */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center gap-4 shadow-md z-20">
            <button 
                onClick={() => setSelectedAccount(null)}
                className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors border border-transparent hover:border-slate-700"
            >
                <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-bold text-emerald-400 uppercase tracking-wider flex-1">
                Cuenta: <span className="text-white">{selectedAccount}</span>
            </h2>
            <div className="bg-slate-950 px-4 py-2 rounded-lg border border-slate-800 flex flex-col items-end">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Saldo Total</span>
                <span className={`font-mono font-bold ${calculateBalance(accountData) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {formatCurrency(calculateBalance(accountData))}
                </span>
            </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-6 custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Initial Balance Card */}
                <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-bold text-slate-300 uppercase">Deuda Inicial / Histórica</h4>
                        <p className="text-xs text-slate-500">Saldo inicial antes de los movimientos registrados.</p>
                    </div>
                    
                    {isEditingInitial ? (
                        <div className="flex items-center gap-2">
                             <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-emerald-500/50 text-xs">$</span>
                                <input 
                                    type="text" 
                                    inputMode="numeric"
                                    value={tempInitial} 
                                    onChange={handleInitialChange}
                                    className="bg-slate-950 border border-emerald-500/50 rounded px-2 pl-5 py-1 text-right text-emerald-400 w-32 focus:outline-none font-mono"
                                    autoFocus
                                />
                             </div>
                             <button onClick={handleUpdateInitial} className="p-1.5 bg-emerald-600 rounded text-white"><Save size={16}/></button>
                             <button onClick={() => setIsEditingInitial(false)} className="p-1.5 bg-slate-700 rounded text-slate-300"><X size={16}/></button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                             <span className="text-xl font-mono font-bold text-white">{formatCurrency(accountData.initialBalance || 0)}</span>
                             <button 
                                onClick={() => { 
                                    const val = accountData.initialBalance || 0;
                                    setTempInitial(new Intl.NumberFormat('es-AR').format(val)); 
                                    setIsEditingInitial(true); 
                                }}
                                className="p-1.5 hover:bg-slate-800 rounded text-slate-500 hover:text-emerald-400 transition-colors"
                             >
                                <Edit2 size={16} />
                             </button>
                        </div>
                    )}
                </div>

                {/* Add Transaction Form (Now at Top) */}
                <form onSubmit={handleAddTransaction} className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
                    <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">Nuevo Movimiento</h3>
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative">
                            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                            <input 
                                type="date" 
                                required
                                value={newDate}
                                onChange={e => setNewDate(e.target.value)}
                                className="w-full md:w-auto bg-slate-950 border border-slate-700 rounded-lg py-2 pl-8 pr-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                        <div className="relative flex-1">
                            <FileText className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                            <input 
                                type="text" 
                                placeholder="Descripción..."
                                required
                                value={newDesc}
                                onChange={e => setNewDesc(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-8 pr-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3 md:w-64">
                            <div className="relative">
                                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 text-emerald-500" size={12} />
                                <input 
                                    type="text" 
                                    inputMode="numeric"
                                    placeholder="Entrega"
                                    value={deliveryDisplay}
                                    onChange={(e) => handleMoneyInput(e, setDeliveryDisplay, setRawDelivery)}
                                    className="w-full bg-slate-950 border border-emerald-900/50 rounded-lg py-2 pl-6 pr-2 text-sm text-emerald-300 placeholder-emerald-900/50 focus:border-emerald-500 focus:outline-none font-mono"
                                />
                            </div>
                            <div className="relative">
                                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 text-rose-500" size={12} />
                                <input 
                                    type="text" 
                                    inputMode="numeric"
                                    placeholder="Debe"
                                    value={debitDisplay}
                                    onChange={(e) => handleMoneyInput(e, setDebitDisplay, setRawDebit)}
                                    className="w-full bg-slate-950 border border-rose-900/50 rounded-lg py-2 pl-6 pr-2 text-sm text-rose-300 placeholder-rose-900/50 focus:border-rose-500 focus:outline-none font-mono"
                                />
                            </div>
                        </div>
                        <button 
                            type="submit"
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-2 rounded-lg transition-colors flex items-center justify-center shadow-lg shadow-emerald-900/20"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                </form>

                {/* Transactions Table */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950 border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="p-4 cursor-pointer hover:text-emerald-400 flex items-center gap-2 select-none" onClick={() => setSortNewest(!sortNewest)}>
                                        Fecha
                                        <ArrowUpDown size={14} className={sortNewest ? "text-emerald-500" : "text-slate-600"} />
                                    </th>
                                    <th className="p-4">Descripción</th>
                                    <th className="p-4 text-right text-emerald-500">Entrega (Paga)</th>
                                    <th className="p-4 text-right text-rose-500">Debe (Saca)</th>
                                    <th className="p-4 text-right text-white bg-slate-900/50">Deuda</th>
                                    <th className="p-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {displayTransactions.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-800/30 transition-colors group">
                                        <td className="p-3 text-sm text-slate-300 whitespace-nowrap font-mono">{t.date.split('-').reverse().join('/')}</td>
                                        <td className="p-3 text-sm text-white font-medium">{t.description}</td>
                                        <td className="p-3 text-right font-mono text-emerald-400">
                                            {t.delivery > 0 ? formatCurrency(t.delivery) : '-'}
                                        </td>
                                        <td className="p-3 text-right font-mono text-rose-400">
                                            {t.debit > 0 ? formatCurrency(t.debit) : '-'}
                                        </td>
                                        <td className="p-3 text-right font-mono font-bold text-slate-200 bg-slate-900/30">
                                            {formatCurrency(t.balanceAfter)}
                                        </td>
                                        <td className="p-3 text-center">
                                            <button 
                                                onClick={() => handleRemoveTransaction(t.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-rose-500 hover:bg-rose-950/30 rounded transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {(!accountData.transactions || accountData.transactions.length === 0) && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-slate-500 italic">No hay movimientos registrados.</td>
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
