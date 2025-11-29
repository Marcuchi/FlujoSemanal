
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

export const DRIVERS_LIST = [
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
  'Alexis'
];

export const ROUTES_LIST = [
  'Alta Gracia',
  'Calera',
  'Centro Garbino',
  'Carlos Paz',
  'Gran Cordoba',
  'Malvinas'
];

export interface KilosDayData {
  id: string;
  // Particulares (Array to allow multiple entries)
  public: number[]; 
  // Choferes (Keyed by driver name)
  drivers: Record<string, number>;
  // Reparto Zonas (Keyed by route name)
  routes_out: Record<string, number>;
  // Devolución Zonas (Keyed by route name)
  routes_in: Record<string, number>;
  // Camara
  camera_plus: number;
  camera_minus: number;
}

export type KilosWeekData = Record<string, KilosDayData>;

// --- CURRENT ACCOUNTS (CC) TYPES ---

export interface CCTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  delivery: number; // Entrega (Paga)
  debit: number;    // Debe (Saca/Deuda aumenta)
}

export interface CCAccountData {
  initialBalance: number;
  transactions: CCTransaction[];
}

export type CCData = Record<string, CCAccountData>;

export type AppMode = 'FLOW' | 'KILOS' | 'CC';

export const DAYS_OF_WEEK = [
  { id: 'monday', name: 'Lunes' },
  { id: 'tuesday', name: 'Martes' },
  { id: 'wednesday', name: 'Miércoles' },
  { id: 'thursday', name: 'Jueves' },
  { id: 'friday', name: 'Viernes' },
  { id: 'saturday', name: 'Sábado' },
];
