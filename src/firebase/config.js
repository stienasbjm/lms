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

// Default configuration placeholder
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDummyKeyForPreviewPurposeOnly12345",
  authDomain: "lms-stienas.firebaseapp.com",
  projectId: "lms-stienas",
  storageBucket: "lms-stienas.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
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
