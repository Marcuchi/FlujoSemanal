import React from 'react';
import { Trash2, Edit2, Check, X } from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { formatCurrency } from '../utils';

interface TransactionItemProps {
  transaction: Transaction;
  type: TransactionType;
  onUpdate: (id: string, updates: Partial<Transaction>) => void;
  onRemove: (id: string) => void;
}

const formatNumberInput = (value: number): string => {
  if (value === 0 && !Object.is(value, -0)) return ''; // Don't show 0, allows placeholder. Handle -0 case if needed but usually 0 is enough.
  // Handle negative specifically for input display
  return new Intl.NumberFormat('es-AR').format(value);
};

const capitalizeFirstLetter = (string: string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  type,
  onUpdate,
  onRemove
}) => {
  const isBox = type === 'toBox';
  // Check if it's a new transaction: amount 0 and (title empty or title is 'Caja' for box items)
  const isNew = transaction.amount === 0 && (transaction.title === '' || (isBox && transaction.title === 'Caja'));
  const [isEditing, setIsEditing] = React.useState(isNew);
  
  const [tempTitle, setTempTitle] = React.useState(transaction.title);
  const [tempAmount, setTempAmount] = React.useState(transaction.amount);
  const [inputValue, setInputValue] = React.useState(formatNumberInput(transaction.amount));

  const titleInputRef = React.useRef<HTMLInputElement>(null);
  const amountInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isEditing) {
      // If it is 'Caja', focus on amount to save a step, otherwise focus title
      if (isBox && tempTitle === 'Caja') {
        amountInputRef.current?.focus();
      } else {
        titleInputRef.current?.focus();
      }
    }
  }, [isEditing, isBox, tempTitle]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // Only allow negative sign if type is 'toBox'
    const allowNegative = type === 'toBox';
    const hasNegative = allowNegative && val.includes('-');
    
    // Remove non-digit chars
    const digits = val.replace(/\D/g, '');
    
    if (digits === '') {
        // If user typed just '-' and allowed, show it
        if (hasNegative && val === '-') {
            setInputValue('-');
            setTempAmount(0);
            return;
        }
        setTempAmount(0);
        setInputValue('');
        return;
    }

    let numVal = parseInt(digits, 10);
    
    if (isNaN(numVal)) {
      setTempAmount(0);
      setInputValue('');
    } else {
      // Apply negative if strictly allowed and present
      if (hasNegative) {
          numVal = -numVal;
      }
      setTempAmount(numVal);
      // Format with dots, preserve negative sign visually
      const formatted = new Intl.NumberFormat('es-AR').format(Math.abs(numVal));
      setInputValue(hasNegative ? `-${formatted}` : formatted);
    }
  };

  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (tempTitle.trim() === '') {
      titleInputRef.current?.focus();
      return;
    }
    // Auto-capitalize first letter here
    const formattedTitle = capitalizeFirstLetter(tempTitle);
    
    onUpdate(transaction.id, { title: formattedTitle, amount: tempAmount });
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (isNew) onRemove(transaction.id);
    else {
      setTempTitle(transaction.title);
      setTempAmount(transaction.amount);
      setInputValue(formatNumberInput(transaction.amount));
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') handleCancel();
  };

  const getTheme = () => {
    // Themes adapted for Dark Backgrounds
    switch (type) {
      case 'incomes': return { 
        indicator: 'bg-emerald-500', 
        hoverBg: 'hover:bg-emerald-900/60', 
        textAmount: 'text-emerald-300',
        textTitle: 'text-emerald-100',
        subtle: 'text-emerald-500'
      };
      case 'expenses': return { 
        indicator: 'bg-rose-500', 
        hoverBg: 'hover:bg-rose-900/60', 
        textAmount: 'text-rose-300',
        textTitle: 'text-rose-100',
        subtle: 'text-rose-500'
      };
      case 'toBox': return { 
        indicator: 'bg-indigo-500', 
        hoverBg: 'hover:bg-indigo-900/60', 
        textAmount: 'text-indigo-300',
        textTitle: 'text-indigo-100',
        subtle: 'text-indigo-500'
      };
      default: return { 
        indicator: 'bg-slate-400', 
        hoverBg: 'hover:bg-slate-800', 
        textAmount: 'text-slate-300',
        textTitle: 'text-slate-100',
        subtle: 'text-slate-500'
      };
    }
  };
  const theme = getTheme();

  if (isEditing) {
    return (
      <form onSubmit={handleSave} className="p-2 rounded-lg border border-indigo-500/30 bg-slate-800 shadow-xl animate-in fade-in duration-200 z-10 relative space-y-2">
        <input
          ref={titleInputRef}
          type="text"
          value={tempTitle}
          onChange={(e) => setTempTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Descripción..."
          className="w-full text-sm font-medium border-b border-slate-600 focus:border-indigo-400 focus:outline-none py-1 bg-transparent text-slate-100 placeholder-slate-500"
        />
        <div className="flex items-center justify-between gap-2">
          <div className="relative flex-1">
            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">$</span>
            <input
              ref={amountInputRef}
              type="text"
              inputMode="numeric" // Changed to numeric to allow software keyboard on mobile
              value={inputValue}
              onChange={handleAmountChange}
              onKeyDown={handleKeyDown}
              onFocus={(e) => e.target.select()}
              placeholder="0"
              className="w-full text-right text-sm font-mono border-b border-slate-600 focus:border-indigo-400 focus:outline-none py-1 pl-5 bg-transparent text-slate-100 placeholder-slate-500"
            />
          </div>
          <div className="flex items-center gap-1">
             <button type="button" onClick={handleCancel} className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"><X size={16} /></button>
             <button type="submit" className="p-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-sm"><Check size={16} /></button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <div className={`group relative p-2 rounded-lg ${theme.hoverBg} bg-black/20 transition-colors flex items-center justify-between border border-transparent hover:border-white/5`}>
      <div className="flex items-center gap-2 overflow-hidden">
        <span className={`w-1 h-5 rounded-full ${theme.indicator} flex-shrink-0`}></span>
        <span className={`text-xs ${theme.textTitle} truncate font-medium`}>{transaction.title || <i className={theme.subtle}>Sin descripción</i>}</span>
      </div>
      
      <span className={`text-sm font-mono font-semibold ${theme.textAmount} whitespace-nowrap`}>
        {formatCurrency(transaction.amount)}
      </span>

      <div className="absolute inset-0 bg-slate-900/90 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-end gap-2 px-2 border border-slate-700">
        <button onClick={() => setIsEditing(true)} className="p-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-white transition-colors shadow-sm border border-slate-600" title="Modificar"><Edit2 size={14} /></button>
        <button onClick={() => onRemove(transaction.id)} className="p-1.5 rounded-md bg-rose-900 hover:bg-rose-800 text-white transition-colors shadow-sm border border-rose-950" title="Eliminar"><Trash2 size={14} /></button>
      </div>
    </div>
  );
};