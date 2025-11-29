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

// CSV Helpers

export const exportToCSV = (data: WeekData, history: HistoryItem[] = []) => {
  const headers = ['DayID', 'DayName', 'Type', 'Title', 'Amount', 'Metadata']; 
  const rows: string[] = [headers.join(',')];

  // 1. Export Week Data
  Object.values(data).forEach((day) => {
    if (day.manualInitialAmount !== undefined) {
       rows.push(`${day.id},${day.name},initial,"Monto Inicial Manual",${day.manualInitialAmount},`);
    }

    const addRows = (list: Transaction[], type: string) => {
        list.forEach(t => {
            rows.push(`${day.id},${day.name},${type},"${t.title.replace(/"/g, '""')}",${t.amount},`);
        });
    };

    addRows(day.incomes, 'incomes');
    addRows(day.deliveries, 'deliveries'); // Export Deliveries
    addRows(day.expenses, 'expenses');
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

  const csvContent = rows.join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute("download", `flujo_semanal_${dateStr}.csv`);
  
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
        deliveries: [], // Init deliveries
        expenses: [],
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

          const transaction: Transaction = {
            id: generateId() + Math.random().toString(36).substring(2),
            title: title,
            amount: amount
          };

          if (cleanType === 'incomes') newState[cleanDayId].incomes.push(transaction);
          else if (cleanType === 'deliveries') newState[cleanDayId].deliveries.push(transaction); // Parse deliveries
          else if (cleanType === 'expenses') newState[cleanDayId].expenses.push(transaction);
          else if (cleanType === 'toBox') newState[cleanDayId].toBox.push(transaction);
      }
    }
    return { weekData: newState, history: newHistory };
  } catch (error) {
    console.error("Error parsing CSV", error);
    return null;
  }
};