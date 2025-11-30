import { WeekData, DAYS_OF_WEEK, DayData, Transaction, TransactionType, HistoryItem } from './types';

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// --- Date & Week Helpers ---

export const getMonday = (d: Date): Date => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const getWeekKey = (date: Date): string => {
  const monday = getMonday(date);
  const year = monday.getFullYear();
  // Simple week identifier: Year-Month-DayOfMonday (e.g. 2024-04-15)
  // This ensures unique keys per week and is readable
  const m = (monday.getMonth() + 1).toString().padStart(2, '0');
  const d = monday.getDate().toString().padStart(2, '0');
  return `${year}-${m}-${d}`;
};

export const getWeekRangeLabel = (date: Date): string => {
  const monday = getMonday(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  // remove trailing dots from short months if browser adds them, though 'es-AR' usually doesn't
  const start = monday.toLocaleDateString('es-AR', options).replace('.', '');
  const end = sunday.toLocaleDateString('es-AR', options).replace('.', '');
  const year = monday.getFullYear();

  return `${start} - ${end} ${year}`;
};

export const addWeeks = (date: Date, weeks: number): Date => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + (weeks * 7));
  return newDate;
};

// --- CSV Helpers ---

export const exportToCSV = (data: WeekData, history: HistoryItem[] = [], filenamePrefix: string = 'flujo_semanal') => {
  const headers = ['DayID', 'DayName', 'Type', 'Title', 'Amount', 'Metadata']; 
  const rows: string[] = [headers.join(',')];

  // 1. Export Week Data
  Object.values(data).forEach((day) => {
    if (day.manualInitialAmount !== undefined) {
       rows.push(`${day.id},${day.name},initial,"Monto Inicial Manual",${day.manualInitialAmount},`);
    }

    // Export Monday's Initial Box if exists
    if (day.id === 'monday' && day.initialBoxAmount !== undefined) {
       rows.push(`${day.id},${day.name},initialBox,"Caja Inicial",${day.initialBoxAmount},`);
    }

    const addRows = (list: Transaction[], type: string) => {
        list.forEach(t => {
            rows.push(`${day.id},${day.name},${type},"${t.title.replace(/"/g, '""')}",${t.amount},`);
        });
    };

    addRows(day.incomes, 'incomes');
    addRows(day.deliveries, 'deliveries');
    addRows(day.expenses, 'expenses');
    addRows(day.salaries, 'salaries'); // Export Salaries
    addRows(day.toBox, 'toBox');
  });

  // 2. Export History
  if (history.length > 0) {
      rows.push(''); // Spacer
      rows.push('---HISTORY---');
      history.forEach(h => {
          const metadata = `${h.deletedAt}|${h.originalType}|${h.originalDayId}`;
          rows.push(`${h.originalDayId},HISTORY,history,"${h.title.replace(/"/g, '""')}",${h.amount},"${metadata}"`);
      });
  }

  downloadCSV(rows.join("\n"), `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`);
};

export const exportMonthToCSV = (monthLabel: string, weeksData: Record<string, WeekData>) => {
    const headers = ['WeekStart', 'DayID', 'DayName', 'Category', 'Title', 'Amount'];
    const rows: string[] = [headers.join(',')];

    Object.entries(weeksData).forEach(([weekKey, weekData]) => {
        Object.values(weekData).forEach((day) => {
            // Helpers
            const addRow = (type: string, title: string, amount: number) => {
                rows.push(`${weekKey},${day.id},${day.name},${type},"${title.replace(/"/g, '""')}",${amount}`);
            };

            // Initials
            if (day.manualInitialAmount !== undefined) addRow('Initial Office', 'Monto Inicial Manual', day.manualInitialAmount);
            if (day.id === 'monday' && day.initialBoxAmount !== undefined) addRow('Initial Box', 'Caja Inicial', day.initialBoxAmount);

            // Transactions
            day.incomes.forEach(t => addRow('Ingresos (General)', t.title, t.amount));
            day.deliveries.forEach(t => addRow('Ingresos (Reparto)', t.title, t.amount));
            day.expenses.forEach(t => addRow('Egresos (Gastos)', t.title, t.amount));
            day.salaries.forEach(t => addRow('Egresos (Sueldos)', t.title, t.amount));
            day.toBox.forEach(t => addRow('A Caja', t.title, t.amount));
        });
    });

    downloadCSV(rows.join("\n"), `flujo_mensual_${monthLabel}.csv`);
};

const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob(["\uFEFF" + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const parseCSV = (csvText: string): { weekData: WeekData, history: HistoryItem[] } | null => {
  try {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;
    
    const text = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            currentField += '"';
            i++; 
          } else {
            inQuotes = false;
          }
        } else {
          currentField += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          currentRow.push(currentField);
          currentField = '';
        } else if (char === '\n') {
          currentRow.push(currentField);
          rows.push(currentRow);
          currentRow = [];
          currentField = '';
        } else {
          currentField += char;
        }
      }
    }
    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField);
      rows.push(currentRow);
    }

    if (rows.length < 2) return null;

    const newState: WeekData = {};
    const newHistory: HistoryItem[] = [];
    
    DAYS_OF_WEEK.forEach(d => {
      newState[d.id] = {
        id: d.id,
        name: d.name,
        incomes: [],
        deliveries: [],
        expenses: [],
        salaries: [], // Init salaries
        toBox: []
      };
    });

    let isHistorySection = false;

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i];
      if (cols.length === 0 || (cols.length === 1 && cols[0] === '')) continue;
      
      if (cols[0] && cols[0].includes('---HISTORY---')) {
          isHistorySection = true;
          continue;
      }

      if (cols.length < 5) continue;

      const [dayId, , type, title, amountStr, metadata] = cols;
      const cleanDayId = dayId.trim();
      const cleanType = type.trim();
      const amount = parseFloat(amountStr) || 0;

      if (isHistorySection || cleanType === 'history') {
          if (metadata) {
              const [deletedAt, originalType, originalDayId] = metadata.split('|');
              if (deletedAt && originalType) {
                  newHistory.push({
                      id: generateId() + Math.random().toString(36).substring(2),
                      title: title,
                      amount: amount,
                      deletedAt: deletedAt,
                      originalType: originalType as TransactionType,
                      originalDayId: originalDayId || cleanDayId
                  });
              }
          }
      } else {
          if (!newState[cleanDayId]) continue;

          if (cleanType === 'initial') {
            newState[cleanDayId].manualInitialAmount = amount;
            continue;
          }

          if (cleanType === 'initialBox') {
            newState[cleanDayId].initialBoxAmount = amount;
            continue;
          }

          const transaction: Transaction = {
            id: generateId() + Math.random().toString(36).substring(2),
            title: title,
            amount: amount
          };

          if (cleanType === 'incomes') newState[cleanDayId].incomes.push(transaction);
          else if (cleanType === 'deliveries') newState[cleanDayId].deliveries.push(transaction);
          else if (cleanType === 'expenses') newState[cleanDayId].expenses.push(transaction);
          else if (cleanType === 'salaries') newState[cleanDayId].salaries.push(transaction); // Parse salaries
          else if (cleanType === 'toBox') newState[cleanDayId].toBox.push(transaction);
      }
    }
    return { weekData: newState, history: newHistory };
  } catch (error) {
    console.error("Error parsing CSV", error);
    return null;
  }
};