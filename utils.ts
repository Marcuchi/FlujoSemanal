import { WeekData, DAYS_OF_WEEK, DayData, Transaction, TransactionType } from './types';

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

export const exportToCSV = (data: WeekData) => {
  const headers = ['DayID', 'DayName', 'Type', 'Title', 'Amount'];
  const rows: string[] = [headers.join(',')];

  Object.values(data).forEach((day) => {
    // Process Incomes
    day.incomes.forEach(t => {
      rows.push(`${day.id},${day.name},incomes,"${t.title.replace(/"/g, '""')}",${t.amount}`);
    });
    // Process Expenses
    day.expenses.forEach(t => {
      rows.push(`${day.id},${day.name},expenses,"${t.title.replace(/"/g, '""')}",${t.amount}`);
    });
    // Process ToBox
    day.toBox.forEach(t => {
      rows.push(`${day.id},${day.name},toBox,"${t.title.replace(/"/g, '""')}",${t.amount}`);
    });
  });

  const csvContent = "data:text/csv;charset=utf-8," + rows.join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute("download", `flujo_semanal_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const parseCSV = (csvText: string): WeekData | null => {
  try {
    // Robust CSV parser state machine
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;
    
    // Normalize newlines
    const text = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            // Escaped quote
            currentField += '"';
            i++; // Skip next quote
          } else {
            // End of quotes
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
    // Push last row if exists
    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField);
      rows.push(currentRow);
    }

    if (rows.length < 2) return null; // Header + 1 row minimum

    // Initialize empty structure
    const newState: WeekData = {};
    DAYS_OF_WEEK.forEach(d => {
      newState[d.id] = {
        id: d.id,
        name: d.name,
        incomes: [],
        expenses: [],
        toBox: []
      };
    });

    // Skip header (index 0)
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i];
      if (cols.length < 5) continue;

      const [dayId, , type, title, amountStr] = cols;
      
      // Clean up inputs just in case
      const cleanDayId = dayId.trim();
      const cleanType = type.trim();
      // Only parse if dayId is valid
      if (!newState[cleanDayId]) continue;

      const amount = parseFloat(amountStr) || 0;

      const transaction: Transaction = {
        id: generateId() + Math.random().toString(36).substring(2), // Ensure unique ID on import
        title: title, // Parser handles unquoting
        amount: amount
      };

      if (cleanType === 'incomes') newState[cleanDayId].incomes.push(transaction);
      else if (cleanType === 'expenses') newState[cleanDayId].expenses.push(transaction);
      else if (cleanType === 'toBox') newState[cleanDayId].toBox.push(transaction);
    }
    return newState;
  } catch (error) {
    console.error("Error parsing CSV", error);
    return null;
  }
};