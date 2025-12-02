
import React from 'react';
import { Trash2, Edit2, Check, X, ArrowLeftRight } from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { formatCurrency } from '../utils';

interface TransactionItemProps {
  transaction: Transaction;
  type: TransactionType;
  onUpdate: (id: string, updates: Partial<Transaction>) => void;
  onRemove: (id: string) => void;
  onMove?: (id: string) => void; 
}

const formatNumberInput = (value: number): string => {
  if (value === 0 && !Object.is(value, -0)) return '';
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
  onRemove,
  onMove
}) => {
  const isBox = type === 'toBox';
  // Check for 'Tesoro' as default title instead of 'Caja'
  const isNew = transaction.amount === 0 && (transaction.title === '' || (isBox && (transaction.title === 'Caja' || transaction.title === 'Tesoro')));
  const [isEditing, setIsEditing] = React.useState(isNew);
  
  const [tempTitle, setTempTitle] = React.useState(transaction.title);
  const [tempAmount, setTempAmount] = React.useState(transaction.amount);
  const [inputValue, setInputValue] = React.useState(formatNumberInput(transaction.amount));

  const titleInputRef = React.useRef<HTMLInputElement>(null);
  const amountInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isEditing) {
      if (isBox && (tempTitle === 'Caja' || tempTitle === 'Tesoro')) {
        amountInputRef.current?.focus();
      } else {
        titleInputRef.current?.focus();
      }
    }
  }, [isEditing, isBox, tempTitle]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    const allowNegative = type === 'toBox';
    const hasNegative = allowNegative && val.includes('-');
    
    const digits = val.replace(/\D/g, '');
    
    if (digits === '') {
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
      if (hasNegative) {
          numVal = -numVal;
      }
      setTempAmount(numVal);
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
    switch (type) {
      case 'incomes': return { 
        indicator: 'bg-emerald-500', 
        hoverBg: 'hover:bg-emerald-900/60', 
        textAmount: 'text-emerald-300',
        textTitle: 'text-emerald-100',
        subtle: 'text-emerald-500'
      };
      case 'deliveries': return { 
        indicator: 'bg-teal-400', 
        hoverBg: 'hover:bg-teal-900/60', 
        textAmount: 'text-teal-300', 
        textTitle: 'text-teal-100', 
        subtle: 'text-teal-500' 
      };
      case 'expenses': return { 
        indicator: 'bg-rose-500', 
        hoverBg: 'hover:bg-rose-900/60', 
        textAmount: 'text-rose-300',
        textTitle: 'text-rose-100',
        subtle: 'text-rose-500'
      };
      case 'salaries': return { 
        indicator: 'bg-amber-500', 
        hoverBg: 'hover:bg-amber-900/60', 
        textAmount: 'text-amber-300',
        textTitle: 'text-amber-100',
        subtle: 'text-amber-500'
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
          className="w-full text-xl font-medium border-b border-slate-600 focus:border-indigo-400 focus:outline-none py-1 bg-transparent text-slate-100 placeholder-slate-500"
        />
        <div className="flex items-center justify-between gap-2">
          <div className="relative flex-1">
            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-lg font-semibold text-slate-500">$</span>
            <input
              ref={amountInputRef}
              type="text"
              inputMode="numeric"
              value={inputValue}
              onChange={handleAmountChange}
              onKeyDown={handleKeyDown}
              onFocus={(e) => e.target.select()}
              placeholder="0"
              className="w-full text-right text-xl font-mono border-b border-slate-600 focus:border-indigo-400 focus:outline-none py-1 pl-5 bg-transparent text-slate-100 placeholder-slate-500"
            />
          </div>
          <div className="flex items-center gap-1">
             <button type="button" onClick={handleCancel} className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"><X size={18} /></button>
             <button type="submit" className="p-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-sm"><Check size={18} /></button>
          </div>
        </div>
      </form>
    );
  }

  // Determine if move button should be shown
  const showMoveButton = (type === 'incomes' || type === 'deliveries' || type === 'expenses' || type === 'salaries') && onMove;
  
  let moveButtonTitle = '';
  if (type === 'incomes') moveButtonTitle = 'Mover a Repartos';
  else if (type === 'deliveries') moveButtonTitle = 'Mover a General';
  else if (type === 'expenses') moveButtonTitle = 'Mover a Adelantos/Sueldos';
  else if (type === 'salaries') moveButtonTitle = 'Mover a Gastos';

  return (
    <div className={`group relative p-2.5 rounded-lg ${theme.hoverBg} bg-black/20 transition-colors flex items-center justify-between border border-transparent hover:border-white/5`}>
      <div className="flex items-center gap-3 overflow-hidden">
        <span className={`w-1.5 h-6 rounded-full ${theme.indicator} flex-shrink-0`}></span>
        <span className={`text-lg ${theme.textTitle} truncate font-medium`}>{transaction.title || <i className={theme.subtle}>Sin descripción</i>}</span>
      </div>
      
      <span className={`text-xl font-mono font-bold ${theme.textAmount} whitespace-nowrap`}>
        {formatCurrency(transaction.amount)}
      </span>

      <div className="absolute inset-0 bg-slate-900/90 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-end gap-2 px-2 border border-slate-700">
        
        {showMoveButton && (
           <button 
             onClick={() => onMove?.(transaction.id)} 
             className="p-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors shadow-sm border border-slate-600" 
             title={moveButtonTitle}
           >
             <ArrowLeftRight size={16} />
           </button>
        )}

        <button onClick={() => setIsEditing(true)} className="p-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-white transition-colors shadow-sm border border-slate-600" title="Modificar"><Edit2 size={16} /></button>
        <button onClick={() => onRemove(transaction.id)} className="p-1.5 rounded-md bg-rose-900 hover:bg-rose-800 text-white transition-colors shadow-sm border border-rose-950" title="Eliminar"><Trash2 size={16} /></button>
      </div>
    </div>
  );
};
