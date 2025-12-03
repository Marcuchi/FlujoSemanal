

export interface Transaction {
  id: string;
  title: string;
  amount: number;
}

export interface DayData {
  id: string;
  name: string;
  incomes: Transaction[];
  deliveries: Transaction[]; 
  expenses: Transaction[];
  salaries: Transaction[]; // New subgroup for Adelantos/Sueldos
  toBox: Transaction[];
  manualInitialAmount?: number;
  initialBoxAmount?: number; // New field for Monday's Initial Box
}

export type TransactionType = 'incomes' | 'deliveries' | 'expenses' | 'salaries' | 'toBox';

export interface HistoryItem extends Transaction {
  deletedAt: string; // ISO Date string
  originalDayId: string;
  originalType: TransactionType;
}

export type WeekData = Record<string, DayData>;

// --- KILOS APP TYPES ---

// New Simplified Data Structure for Text Grid
// Key = Row Identifier (e.g., 'client_Amilcar', 'public_0')
// Value = Array of strings (12 columns)
export type KilosWeekData = Record<string, string[]>;

export const KILOS_CLIENTS_LIST = [
  'Amilcar',
  'Diego Malageño',
  'Reina Alba',
  'Nico',
  'Merlo',
  'Sahar',
  'Ledesma',
  'Tomas',
  'Sanchez',
  'Ortega',
  'Alexis',
  'Fratelli'
];

export const KILOS_ZONES_LIST = [
  'Alta Gracia',
  'Calera',
  'Centro Garbino',
  'Carlos Paz',
  'Gran Cordoba',
  'Malvinas'
];

export const KILOS_ZONES_DEV_LIST = [
  'Alta Gracia',
  'Calera',
  'Carlos Paz',
  'Garbino',
  'Gaston',
  'Gral',
  'Malvinas'
];

// --- CURRENT ACCOUNTS (CC) TYPES ---

export interface CCTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  crates?: number;      // Cantidad Cajones
  price?: number;       // Precio x Cajon
  delivery: number;     // Haber (Paga)
  debit: number;        // Debe (Calculated: crates * price)
}

export interface CCAccountData {
  transactions: CCTransaction[];
}

export type CCData = Record<string, CCAccountData>;

// --- CHEQUES APP TYPES ---

export interface Cheque {
  id: string;
  date: string; // Fecha de ingreso/registro
  bank: string;
  number: string;
  amount: number;
  paymentDate: string; // Fecha de Cobro
  holder: string; // Titular
  deliveredBy: string; // Quien Entrego
}

// --- GENERAL DATA APP TYPES ---

export interface GeneralItem {
  id: string;
  name: string;
  }

export interface Client {
  id: string;
  name: string;
  cuil: string;
  phone: string;
  location: string;
}

export interface Supplier {
  id: string;
  name: string;
  product: string;
  price: number;
  phone: string;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  cuil: string;
  address: string;
  startDate: string; // YYYY-MM-DD
  birthDate: string; // YYYY-MM-DD
  phone: string;
}

export interface GeneralData {
  clients: Client[];
  suppliers: Supplier[];
  employees: Employee[];
}

export interface Note {
  id: string;
  content: string;
  createdAt: string;
}

export type AppMode = 'FLOW' | 'KILOS' | 'CC' | 'CHEQUES' | 'GENERAL_DATA';

export const DAYS_OF_WEEK = [
  { id: 'monday', name: 'Lunes' },
  { id: 'tuesday', name: 'Martes' },
  { id: 'wednesday', name: 'Miércoles' },
  { id: 'thursday', name: 'Jueves' },
  { id: 'friday', name: 'Viernes' },
  { id: 'saturday', name: 'Sábado' },
];