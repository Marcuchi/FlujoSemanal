

import React from 'react';
import { Database, ref, onValue, set } from 'firebase/database';
import { ArrowLeft, Plus, Trash2, ArrowUpDown, Calculator, DollarSign, Calendar, Package } from 'lucide-react';
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
  
  // Inputs
  const [quantity, setQuantity] = React.useState(''); // Cantidad de cajones
  const [priceDisplay, setPriceDisplay] = React.useState(''); // Precio visual
  const [rawPrice, setRawPrice] = React.useState(0); // Precio numérico

  const [deliveryDisplay, setDeliveryDisplay] = React.useState(''); // Haber visual
  const [rawDelivery, setRawDelivery] = React.useState(0); // Haber numérico
  
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
      return data[name] || { transactions: [] };
  };

  const calculateBalance = (account: CCAccountData) => {
      let balance = 0;
      if (account.transactions) {
          account.transactions.forEach(t => {
              balance = balance + (t.debit || 0) - (t.delivery || 0);
          });
      }
      return balance;
  };

  // --- Handlers ---
  const handleCreateAccount = () => {
      const name = window.prompt(`Nombre de la nueva cuenta:`);
      if (!name || name.trim() === "") return;
      
      if (data[name]) {
          alert("Esa cuenta ya existe.");
          return;
      }
      
      saveData({ 
          ...data, 
          [name]: { 
              transactions: []
          } 
      });
  };

  const handleDeleteAccount = (name: string) => {
      if (window.confirm(`¿Estás seguro de eliminar permanentemente la cuenta "${name}"?`)) {
          const newData = { ...data };
          delete newData[name];
          saveData(newData);
      }
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

  const handleQuantityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val === '' || /^\d+$/.test(val)) {
          setQuantity(val);
      }
  };

  const handleAddTransaction = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedAccount) return;

      const qty = parseInt(quantity, 10) || 0;
      
      // Calculate Debit automatically
      const calculatedDebit = qty * rawPrice;
      
      // Auto-generate description or leave empty based on transaction type
      let desc = '';
      if (qty > 0 && rawPrice > 0) {
          desc = `${qty} cajones`;
      } else if (rawDelivery > 0) {
          desc = 'Pago / Entrega';
      }

      const transaction: CCTransaction = {
          id: generateId(),
          date: newDate,
          description: desc,
          quantity: qty > 0 ? qty : undefined,
          price: rawPrice > 0 ? rawPrice : undefined,
          delivery: rawDelivery,
          debit: calculatedDebit
      };

      const currentAccount = getAccountData(selectedAccount);
      const updatedTransactions = [...(currentAccount.transactions || []), transaction];
      
      const updatedAccount = { ...currentAccount, transactions: updatedTransactions };
      
      saveData({ ...data, [selectedAccount]: updatedAccount });

      // Reset Form
      setQuantity('');
      setPriceDisplay('');
      setRawPrice(0);
      setDeliveryDisplay('');
      setRawDelivery(0);
  };

  const handleRemoveTransaction = (id: string) => {
      if (!selectedAccount) return;
      if (!window.confirm('¿Eliminar este movimiento?')) return;

      const currentAccount = getAccountData(selectedAccount);
      const updatedTransactions = currentAccount.transactions.filter(t => t.id !== id);
      
      saveData({ ...data, [selectedAccount]: { ...currentAccount, transactions: updatedTransactions } });
  };

  // Calculated values for the form preview
  const currentQty = parseInt(quantity, 10) || 0;
  const currentDebit = currentQty * rawPrice;

  if (loading) return <div className="text-emerald-500 p-8 animate-pulse text-center">Cargando Cuentas...</div>;

  // --- VIEW 1: DASHBOARD (List of Accounts) ---
  if (!selectedAccount) {
      const allAccounts = Object.keys(data).sort();
      
      const renderAccountCard = (name: string) => {
        const accData = getAccountData(name);
        const balance = calculateBalance(accData);
        const hasTransactions = (accData.transactions || []).length > 0;
        const canDelete = !hasTransactions;

        if (isDeleteMode) {
            if (canDelete) {
                // DELETABLE STATE
                return (
                    <button 
                        key={name}
                        onClick={() => handleDeleteAccount(name)}
                        className="bg-rose-50 dark:bg-rose-950/20 border-2 border-dashed border-rose-400 dark:border-rose-500/50 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all rounded-2xl p-6 flex flex-col items-center justify-center gap-4 group cursor-pointer animate-pulse"
                    >
                        <div className="h-16 w-16 rounded-full bg-rose-200 dark:bg-rose-900/50 border border-rose-300 dark:border-rose-700 flex items-center justify-center">
                            <Trash2 size={32} className="text-rose-600 dark:text-rose-400" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-rose-700 dark:text-rose-300 line-through decoration-rose-500">{name}</h3>
                            <p className="text-xs text-rose-600 dark:text-rose-400 font-bold mt-2">ELIMINAR</p>
                        </div>
                    </button>
                );
            } else {
                // LOCKED STATE
                return (
                    <div 
                        key={name}
                        className="bg-slate-100 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 opacity-40 cursor-not-allowed grayscale"
                    >
                        <div className="h-16 w-16 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center">
                            <span className="text-2xl font-bold text-slate-500 dark:text-slate-600">{name.charAt(0)}</span>
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-slate-500">{name}</h3>
                            <p className="text-xs text-slate-500 mt-1">Contiene datos</p>
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
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all rounded-2xl p-6 flex flex-col items-center justify-center gap-4 group shadow-lg"
            >
                <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-2xl font-bold text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">{name.charAt(0)}</span>
                </div>
                <div className="text-center">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{name}</h3>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Saldo Actual</p>
                    <p className={`text-2xl font-mono font-bold mt-1 ${balance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {formatCurrency(balance)}
                    </p>
                </div>
            </button>
        );
      };

      return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 overflow-y-auto transition-colors duration-300">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 max-w-6xl mx-auto w-full gap-4">
                <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest text-center sm:text-left">Cuentas Corrientes</h2>
                
                {/* Delete Mode Toggle */}
                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className={`text-xs font-bold uppercase tracking-wider ${isDeleteMode ? 'text-rose-500' : 'text-slate-500'}`}>
                        {isDeleteMode ? 'Modo Eliminar' : 'Gestión'}
                    </span>
                    <button 
                        onClick={() => setIsDeleteMode(!isDeleteMode)}
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out relative ${isDeleteMode ? 'bg-rose-500 dark:bg-rose-900' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isDeleteMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                </div>
            </div>
            
            <div className="max-w-6xl mx-auto w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {allAccounts.map(name => renderAccountCard(name))}
                    
                    {!isDeleteMode && (
                        <button 
                            onClick={handleCreateAccount}
                            className="bg-white/50 dark:bg-slate-900/50 border border-dashed border-slate-300 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500/50 hover:bg-white dark:hover:bg-slate-900 transition-all rounded-2xl p-6 flex flex-col items-center justify-center gap-4 group shadow-lg min-h-[200px]"
                        >
                            <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Plus size={32} className="text-slate-400 group-hover:text-emerald-500" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-300">Agregar Cuenta</h3>
                            </div>
                        </button>
                    )}
                </div>
            </div>
        </div>
      );
  }

  // --- VIEW 2: DETAIL (Specific Account Ledger) ---
  const accountData = getAccountData(selectedAccount);
  
  // Calculate running balance chronologically FIRST
  let runningBalance = 0;
  const transactionsWithBalance = (accountData.transactions || []).map(t => {
      runningBalance = runningBalance + (t.debit || 0) - (t.delivery || 0);
      return { ...t, balanceAfter: runningBalance };
  });

  // Then handle display order
  const displayTransactions = sortNewest 
      ? [...transactionsWithBalance].reverse() 
      : [...transactionsWithBalance];

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        
        {/* Top Bar */}
        <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm z-20">
            <button 
                onClick={() => setSelectedAccount(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors border border-transparent"
            >
                <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-bold uppercase tracking-wider flex-1 text-emerald-600 dark:text-emerald-400">
                Cuenta: <span className="text-slate-800 dark:text-white">{selectedAccount}</span>
            </h2>
            <div className="bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col items-end">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Saldo Total</span>
                <span className={`font-mono font-bold ${calculateBalance(accountData) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {formatCurrency(calculateBalance(accountData))}
                </span>
            </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-6 custom-scrollbar">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Add Transaction Form - Redesigned */}
                <form onSubmit={handleAddTransaction} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-lg">
                    <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-emerald-600 dark:text-emerald-400">Nuevo Movimiento</h3>
                    
                    <div className="flex flex-col xl:flex-row gap-3 items-end">
                        
                        {/* Fecha */}
                        <div className="relative w-full xl:w-auto">
                            <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">Fecha</label>
                            <div className="relative">
                                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input 
                                    type="date" 
                                    required
                                    value={newDate}
                                    onChange={e => setNewDate(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-8 pr-3 text-sm text-slate-700 dark:text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                        </div>

                        {/* Cantidad Cajones */}
                        <div className="relative w-full xl:w-32">
                            <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">Cant. Cajones</label>
                            <div className="relative">
                                <Package className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input 
                                    type="text" 
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={quantity}
                                    onChange={handleQuantityInput}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-8 pr-3 text-sm text-slate-700 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
                                />
                            </div>
                        </div>

                        {/* Precio Unitario */}
                        <div className="relative w-full xl:w-36">
                            <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">Precio x Cajón</label>
                            <div className="relative">
                                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                                <input 
                                    type="text" 
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={priceDisplay}
                                    onChange={(e) => handleMoneyInput(e, setPriceDisplay, setRawPrice)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-6 pr-2 text-sm text-slate-700 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
                                />
                            </div>
                        </div>

                        {/* DEBE (Calculado) - Read Only Preview */}
                        <div className="relative w-full xl:w-40 opacity-75">
                             <label className="text-[10px] text-rose-500/80 font-bold uppercase mb-1 block flex items-center gap-1"><Calculator size={10}/> Total Compra (Debe)</label>
                             <div className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-sm font-mono text-rose-600 dark:text-rose-400 text-right font-bold h-[38px] flex items-center justify-end">
                                 {formatCurrency(currentDebit)}
                             </div>
                        </div>

                        {/* HABER (Pago) */}
                        <div className="relative w-full xl:w-40 ml-0 xl:ml-4">
                             <label className="text-[10px] text-emerald-500/80 font-bold uppercase mb-1 block">Haber (Paga)</label>
                             <div className="relative">
                                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 text-emerald-500" size={12} />
                                <input 
                                    type="text" 
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={deliveryDisplay}
                                    onChange={(e) => handleMoneyInput(e, setDeliveryDisplay, setRawDelivery)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-emerald-200 dark:border-emerald-900/50 rounded-lg py-2 pl-6 pr-2 text-sm font-mono focus:outline-none text-emerald-700 dark:text-emerald-300 placeholder-emerald-800/20 dark:placeholder-emerald-900/50 focus:border-emerald-500 font-bold"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit"
                            className="w-full xl:w-auto text-white font-bold p-2.5 rounded-lg transition-colors flex items-center justify-center shadow-lg bg-emerald-600 hover:bg-emerald-500 shadow-emerald-200 dark:shadow-emerald-900/20 mt-2 xl:mt-0"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                </form>

                {/* Transactions Table */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="p-4 cursor-pointer flex items-center gap-2 select-none hover:text-emerald-500" onClick={() => setSortNewest(!sortNewest)}>
                                        Fecha
                                        <ArrowUpDown size={14} className={sortNewest ? "text-emerald-500" : "text-slate-400"} />
                                    </th>
                                    <th className="p-4 text-center">Cant.</th>
                                    <th className="p-4 text-right">Precio Unit.</th>
                                    <th className="p-4 text-right text-rose-600 dark:text-rose-500 bg-rose-50/50 dark:bg-rose-900/10">Debe (Compra)</th>
                                    <th className="p-4 text-right text-emerald-600 dark:text-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10">Haber (Paga)</th>
                                    <th className="p-4 text-right text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900/50">Deuda (Saldo)</th>
                                    <th className="p-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {displayTransactions.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                        <td className="p-3 text-sm text-slate-700 dark:text-white whitespace-nowrap font-mono">{t.date.split('-').reverse().join('/')}</td>
                                        
                                        {/* Cantidad */}
                                        <td className="p-3 text-sm text-center text-slate-700 dark:text-slate-300">
                                            {t.quantity ? (
                                                <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                                    {t.quantity}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        
                                        {/* Precio Unitario */}
                                        <td className="p-3 text-sm text-right text-slate-600 dark:text-slate-400 font-mono">
                                            {t.price ? formatCurrency(t.price) : '-'}
                                        </td>

                                        {/* Debe */}
                                        <td className="p-3 text-right font-mono text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-900/5 font-medium">
                                            {t.debit > 0 ? formatCurrency(t.debit) : <span className="text-slate-300 dark:text-slate-600">-</span>}
                                        </td>

                                        {/* Haber */}
                                        <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/5 font-medium">
                                            {t.delivery > 0 ? formatCurrency(t.delivery) : <span className="text-slate-300 dark:text-slate-600">-</span>}
                                        </td>

                                        {/* Saldo */}
                                        <td className="p-3 text-right font-mono font-bold text-slate-800 dark:text-white bg-slate-50/50 dark:bg-slate-900/30">
                                            {formatCurrency(t.balanceAfter)}
                                        </td>

                                        <td className="p-3 text-center">
                                            <button 
                                                onClick={() => handleRemoveTransaction(t.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/30 rounded transition-all"
                                                title="Eliminar movimiento"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {(!accountData.transactions || accountData.transactions.length === 0) && (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-slate-500 italic">No hay movimientos registrados.</td>
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