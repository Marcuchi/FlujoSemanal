

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
  public_in?: number[]; // Added for cross-column editing 
  // Choferes (Keyed by driver name)
  drivers: Record<string, number>; // Out
  drivers_in: Record<string, number>; // In (Returns)
  // Reparto Zonas (Keyed by route name)
  routes_out: Record<string, number>;
  // Devolución Zonas (Keyed by route name)
  routes_in: Record<string, number>;
  // Camara
  camera_plus: number;
  camera_plus_in?: number; // Added for cross-column editing
  camera_minus: number;
  camera_minus_out?: number; // Added for cross-column editing
}

export interface KilosWeekData {
  [key: string]: KilosDayData;
}

// --- CURRENT ACCOUNTS (CC) TYPES ---

export interface CCTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  delivery: number; // Entrega (Paga)
  debit: number;    // Debe (Saca/Deuda aumenta)
  type?: 'REGULAR' | 'TEMPORARY'; // Ignored in UI now, but kept for data compatibility
}

export interface CCAccountData {
  initialBalance: number;
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
