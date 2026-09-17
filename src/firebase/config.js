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

// Default configuration placeholder (Mendukung .env maupun default)
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForPreviewPurposeOnly12345",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "lms-stienas.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "lms-stienas",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "lms-stienas.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef123456"
};

// Ambil konfigurasi dari localStorage jika ada, atau fallback ke DEFAULT
export function getSavedFirebaseConfig() {
  try {
    const saved = localStorage.getItem('STIE_LMS_FIREBASE_CONFIG');
    if (saved) {
      return JSON.parse(saved);
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
