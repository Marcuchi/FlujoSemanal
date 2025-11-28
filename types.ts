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
}

export type TransactionType = 'incomes' | 'expenses' | 'toBox';

export type WeekData = Record<string, DayData>;

export const DAYS_OF_WEEK = [
  { id: 'monday', name: 'Lunes' },
  { id: 'tuesday', name: 'Martes' },
  { id: 'wednesday', name: 'Miércoles' },
  { id: 'thursday', name: 'Jueves' },
  { id: 'friday', name: 'Viernes' },
  { id: 'saturday', name: 'Sábado' },
];