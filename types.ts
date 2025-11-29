export interface Transaction {
  id: string;
  title: string;
  amount: number;
}

export interface DayData {
  id: string;
  name: string;
  incomes: Transaction[];
  deliveries: Transaction[]; // New subgroup for Repartos
  expenses: Transaction[];
  toBox: Transaction[];
  manualInitialAmount?: number;
}

export type TransactionType = 'incomes' | 'deliveries' | 'expenses' | 'toBox';

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