import { initializeApp } from "firebase/app";
import { getDatabase, Database } from "firebase/database";

// Safely access import.meta.env to avoid TS errors when vite types are missing
const env = (import.meta as any).env || {};

// Usamos las credenciales proporcionadas como fallback si las variables de entorno fallan
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyCzTLdEB7KXCqubD_2FWiK60r6A1v31JtQ",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "peladero-9a6a5.firebaseapp.com",
  databaseURL: env.VITE_FIREBASE_DATABASE_URL || "https://peladero-9a6a5-default-rtdb.firebaseio.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "peladero-9a6a5",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "peladero-9a6a5.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "767650562696",
  appId: env.VITE_FIREBASE_APP_ID || "1:767650562696:web:e8d9b1a0e9fb02b238553d",
  measurementId: "G-G1ZLFEZ9RX"
};

let db: Database | null = null;

try {
  // Intentamos inicializar Firebase
  const app = initializeApp(firebaseConfig);
  db = getDatabase(app);
} catch (error) {
  console.error("Error inicializando Firebase. La aplicación funcionará en modo Local Storage.", error);
  // db se mantiene como null, lo que activará el fallback en App.tsx
}

export { db };