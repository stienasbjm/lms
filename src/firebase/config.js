/**
 * Inisialisasi Firebase Modular SDK v10/v11
 * Mendukung konfigurasi real Firebase & dynamic storage config via UI / localStorage.
 */
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  browserLocalPersistence, 
  setPersistence 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Default configuration resmi Firebase LMS STIE Nasional Banjarmasin
const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyDITlobzgm52tNwHUa7j5Z070DY4vJOJBw",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "lms-stienas.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "lms-stienas",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "lms-stienas.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1039609038510",
  appId: env.VITE_FIREBASE_APP_ID || "1:1039609038510:web:18536257413fe47b448f3f"
};

// Ambil konfigurasi dari localStorage jika ada, atau fallback ke DEFAULT resmi
export function getSavedFirebaseConfig() {
  try {
    const saved = localStorage.getItem('STIE_LMS_FIREBASE_CONFIG');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.apiKey && !parsed.apiKey.includes('DummyKey')) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Gagal membaca konfigurasi Firebase dari localStorage:", e);
  }
  return DEFAULT_FIREBASE_CONFIG;
}

export function saveFirebaseConfig(config) {
  try {
    localStorage.setItem('STIE_LMS_FIREBASE_CONFIG', JSON.stringify(config));
    window.location.reload();
  } catch (e) {
    console.error("Gagal menyimpan konfigurasi Firebase:", e);
  }
}

export function isRealFirebaseConfigured() {
  const cfg = getSavedFirebaseConfig();
  return cfg.apiKey && !cfg.apiKey.includes('DummyKey');
}

const currentConfig = getSavedFirebaseConfig();

let app;
let auth;
let db;
let storage;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(currentConfig);
  auth = getAuth(app);
  // Pastikan browser persistence aktif sesuai FR-01.3
  setPersistence(auth, browserLocalPersistence).catch(err => {
    console.warn("Persistence set warning:", err);
  });
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.warn("Firebase initialization warning (menggunakan mode fallback):", error);
}

export { app, auth, db, storage };
