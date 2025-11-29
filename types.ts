export interface Transaction {
  id: string;
  title: string;
  amount: number;
}

export interface DayData {
  id: string;
  name: string;
  incomes: Transaction[];
  expenses: Transaction[];
  toBox: Transaction[];
  manualInitialAmount?: number; // Optional: if present, overrides the calculated previous balance
}

export type TransactionType = 'incomes' | 'expenses' | 'toBox';

export interface HistoryItem extends Transaction {
  deletedAt: string; // ISO Date string
  originalDayId: string;
  originalType: TransactionType;
}

export type WeekData = Record<string, DayData>;

export const DAYS_OF_WEEK = [
  { id: 'monday', name: 'Lunes' },
  { id: 'tuesday', name: 'Martes' },
  { id: 'wednesday', name: 'Miércoles' },
  { id: 'thursday', name: 'Jueves' },
  { id: 'friday', name: 'Viernes' },
  { id: 'saturday', name: 'Sábado' },
];