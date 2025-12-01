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
       let metadata = day.manualInitialModified ? 'MODIFIED' : '';
       if (day.systemInitialOffice !== undefined) metadata += `|SYS:${day.systemInitialOffice}`;
       rows.push(`${day.id},${day.name},initial,"Oficina Inicial",${day.manualInitialAmount},"${metadata}"`);
    }

    // Export Monday's Initial Box if exists
    if (day.id === 'monday' && day.initialBoxAmount !== undefined) {
       let metadata = day.initialBoxModified ? 'MODIFIED' : '';
       if (day.systemInitialBox !== undefined) metadata += `|SYS:${day.systemInitialBox}`;
       rows.push(`${day.id},${day.name},initialBox,"Tesoro Inicial",${day.initialBoxAmount},"${metadata}"`);
    }

    const addRows = (list: Transaction[], type: string) => {
        if (!list) return;
        list.forEach(t => {
            rows.push(`${day.id},${day.name},${type},"${t.title.replace(/"/g, '""')}",${t.amount},`);
        });
    };

    addRows(day.incomes, 'incomes');
    addRows(day.deliveries, 'deliveries');
    addRows(day.expenses, 'expenses');
    addRows(day.salaries, 'salaries'); 
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
    // We add 'WeekKey' as first column to distinguish weeks
    const headers = ['WeekKey', 'DayID', 'DayName', 'Type', 'Title', 'Amount', 'Metadata'];
    const rows: string[] = [headers.join(',')];

    Object.entries(weeksData).forEach(([weekKey, weekData]) => {
        Object.values(weekData).forEach((day) => {
            // Helpers
            const addRow = (type: string, title: string, amount: number, metadata: string = '') => {
                rows.push(`${weekKey},${day.id},${day.name},${type},"${title.replace(/"/g, '""')}",${amount},"${metadata}"`);
            };

            // Initials
            if (day.manualInitialAmount !== undefined) {
                let meta = day.manualInitialModified ? 'MODIFIED' : '';
                if (day.systemInitialOffice !== undefined) meta += `|SYS:${day.systemInitialOffice}`;
                addRow('initial', 'Oficina Inicial', day.manualInitialAmount, meta);
            }
            if (day.id === 'monday' && day.initialBoxAmount !== undefined) {
                let meta = day.initialBoxModified ? 'MODIFIED' : '';
                if (day.systemInitialBox !== undefined) meta += `|SYS:${day.systemInitialBox}`;
                addRow('initialBox', 'Tesoro Inicial', day.initialBoxAmount, meta);
            }

            // Transactions
            (day.incomes || []).forEach(t => addRow('incomes', t.title, t.amount));
            (day.deliveries || []).forEach(t => addRow('deliveries', t.title, t.amount));
            (day.expenses || []).forEach(t => addRow('expenses', t.title, t.amount));
            (day.salaries || []).forEach(t => addRow('salaries', t.title, t.amount));
            (day.toBox || []).forEach(t => addRow('toBox', t.title, t.amount));
        });
    });

    downloadCSV(rows.join("\n"), `flujo_mensual_${monthLabel}.csv`);
};

export const parseMonthCSV = (csvText: string): Record<string, WeekData> | null => {
    try {
        const rows = parseCSVRows(csvText);
        if (rows.length < 2) return null;

        const monthlyData: Record<string, WeekData> = {};

        for (let i = 1; i < rows.length; i++) {
            const cols = rows[i];
            if (cols.length < 6) continue;

            const [weekKey, dayId, , type, title, amountStr, metadata] = cols;
            const amount = parseFloat(amountStr) || 0;

            // Initialize week if not exists
            if (!monthlyData[weekKey]) {
                monthlyData[weekKey] = createEmptyWeek();
            }

            const dayData = monthlyData[weekKey][dayId];
            if (!dayData) continue; 

             if (type === 'initial') {
                dayData.manualInitialAmount = amount;
                if (metadata) {
                    if (metadata.includes('MODIFIED')) dayData.manualInitialModified = true;
                    const sysMatch = metadata.match(/SYS:(\d+(\.\d+)?)/);
                    if (sysMatch) dayData.systemInitialOffice = parseFloat(sysMatch[1]);
                }
                continue;
             }
             if (type === 'initialBox') {
                dayData.initialBoxAmount = amount;
                if (metadata) {
                    if (metadata.includes('MODIFIED')) dayData.initialBoxModified = true;
                    const sysMatch = metadata.match(/SYS:(\d+(\.\d+)?)/);
                    if (sysMatch) dayData.systemInitialBox = parseFloat(sysMatch[1]);
                }
                continue;
             }

             const transaction: Transaction = {
                id: generateId() + Math.random().toString(36).substring(2),
                title: title,
                amount: amount
             };

             if (type === 'incomes') dayData.incomes.push(transaction);
             else if (type === 'deliveries') dayData.deliveries.push(transaction);
             else if (type === 'expenses') dayData.expenses.push(transaction);
             else if (type === 'salaries') dayData.salaries.push(transaction);
             else if (type === 'toBox') dayData.toBox.push(transaction);
        }

        return monthlyData;

    } catch (e) {
        console.error("Error parsing month CSV", e);
        return null;
    }
};

const createEmptyWeek = (): WeekData => {
    const state: WeekData = {};
    DAYS_OF_WEEK.forEach((day) => {
      state[day.id] = {
        id: day.id,
        name: day.name,
        incomes: [],
        deliveries: [],
        expenses: [],
        salaries: [],
        toBox: [],
      };
    });
    return state;
};

// Helper to handle CSV parsing logic (rows, quotes) centrally
const parseCSVRows = (csvText: string): string[][] => {
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
    return rows;
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
    const rows = parseCSVRows(csvText);
    if (rows.length < 2) return null;

    const newState = createEmptyWeek();
    const newHistory: HistoryItem[] = [];
    let isHistorySection = false;

    if (rows[0][0] === 'WeekKey') {
        return null;
    }

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i];
      if (cols.length === 0 || (cols.length === 1 && cols[0].trim() === '')) continue;

      if (cols[0] === '' && cols[1] === '---HISTORY---') {
          isHistorySection = true;
          continue;
      }

      if (isHistorySection) {
          if (cols.length < 6) continue;
          const [dayId, , type, title, amountStr, metadata] = cols;
          if (type !== 'history') continue;
          
          const [deletedAt, originalType, originalDayId] = (metadata || '').split('|');
          
          newHistory.push({
              id: generateId(),
              title: title,
              amount: parseFloat(amountStr) || 0,
              deletedAt: deletedAt || new Date().toISOString(),
              originalDayId: originalDayId || dayId,
              originalType: (originalType as TransactionType) || 'incomes'
          });

      } else {
          if (cols.length < 5) continue;
          const [dayId, , type, title, amountStr, metadata] = cols;
          const amount = parseFloat(amountStr) || 0;

          const dayData = newState[dayId];
          if (!dayData) continue;

          if (type === 'initial') {
            dayData.manualInitialAmount = amount;
            if (metadata) {
                if (metadata.includes('MODIFIED')) dayData.manualInitialModified = true;
                const sysMatch = metadata.match(/SYS:(\d+(\.\d+)?)/);
                if (sysMatch) dayData.systemInitialOffice = parseFloat(sysMatch[1]);
            }
            continue;
          }
          if (type === 'initialBox') {
            dayData.initialBoxAmount = amount;
            if (metadata) {
                if (metadata.includes('MODIFIED')) dayData.initialBoxModified = true;
                const sysMatch = metadata.match(/SYS:(\d+(\.\d+)?)/);
                if (sysMatch) dayData.systemInitialBox = parseFloat(sysMatch[1]);
            }
            continue;
          }

          const transaction: Transaction = {
            id: generateId() + Math.random().toString(36).substring(2),
            title: title,
            amount: amount,
          };

          if (type === 'incomes') dayData.incomes.push(transaction);
          else if (type === 'deliveries') dayData.deliveries.push(transaction);
          else if (type === 'expenses') dayData.expenses.push(transaction);
          else if (type === 'salaries') dayData.salaries.push(transaction);
          else if (type === 'toBox') dayData.toBox.push(transaction);
      }
    }

    return { weekData: newState, history: newHistory };
  } catch (e) {
    console.error("Error parsing CSV", e);
    return null;
  }
};