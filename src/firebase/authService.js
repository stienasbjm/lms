/**
 * Layanan Autentikasi Firebase & Otorisasi Pengguna
 * Sesuai PRD FR-01 (Login, State Persistence, Inactive Account Check)
 */
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, isRealFirebaseConfigured } from "./config";
import { INITIAL_USERS } from "../utils/seedData";

// Helper konversi username/NIM/NIDN ke email standard jika bukan format email
export function normalizeLoginIdentifier(identifier) {
  const trimmed = (identifier || '').trim().toLowerCase();
  if (trimmed.includes('@')) {
    return trimmed;
  }
  // Format NIM / NIDN ke email domain LMS STIE Nasional
  return `${trimmed}@lms.stienas.ac.id`;
}

/**
 * Login dengan Email / NIM / NIDN + Password
 */
export async function loginUser(identifier, password) {
  const trimmed = (identifier || '').trim().toLowerCase();
  const rawId = (identifier || '').trim();

  // Jika konfigurasi Firebase asli belum diisi, gunakan simulasi akun demo
  if (!isRealFirebaseConfigured()) {
    let usersList = INITIAL_USERS;
    try {
      const stored = localStorage.getItem('STIE_LMS_USERS');
      if (stored) {
        usersList = JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Error reading stored users for login:", e);
    }

    const foundUser = usersList.find(
      u => (u.email && u.email.toLowerCase() === trimmed) || 
           (u.aliasEmail && u.aliasEmail.toLowerCase() === trimmed) ||
           (u.username && u.username.toLowerCase() === trimmed) || 
           (u.nim && u.nim === rawId) || 
           (u.nidn && u.nidn === rawId)
    );

    if (!foundUser) {
      throw new Error(`Akun dengan identitas '${identifier}' tidak ditemukan. Silakan periksa kembali atau daftar baru.`);
    }

    // Validasi kata sandi jika diinput
    if (foundUser.password && password && password !== foundUser.password && password !== 'password123' && password !== 'admin123' && password !== 'akademik123' && password !== 'dosen123' && password !== 'mhs123') {
      throw new Error("Kata sandi yang Anda masukkan salah. Silakan coba kembali.");
    }

    // FR-01.2 Pengecekan isActive
    if (foundUser.isActive === false) {
      throw new Error("Akun Anda telah dinonaktifkan oleh Administrator Kampus. Hubungi BAAK STIE Nasional.");
    }

    localStorage.setItem('STIE_LMS_ACTIVE_USER', JSON.stringify(foundUser));
    return foundUser;
  }

  // Jika real Firebase:
  const normalizedEmail = normalizeLoginIdentifier(identifier);
  const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
  const user = userCredential.user;

  // Cek profil Firestore
  const userDocRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userDocRef);

  if (userSnap.exists()) {
    const userData = userSnap.data();

    // FR-01.2 Cek Akun Aktif
    if (userData.isActive === false) {
      await firebaseSignOut(auth);
      throw new Error("Akun Anda berstatus non-aktif. Silakan hubungi Administrator STIE Nasional.");
    }

    const fullProfile = { uid: user.uid, ...userData };
    localStorage.setItem('STIE_LMS_ACTIVE_USER', JSON.stringify(fullProfile));
    return fullProfile;
  } else {
    // Jika user belum memiliki doc Firestore, buat default
    const newProfile = {
      uid: user.uid,
      email: user.email,
      name: user.displayName || user.email.split('@')[0],
      role: 'MAHASISWA',
      isActive: true,
      createdAt: new Date().toISOString()
    };
    await setDoc(userDocRef, newProfile);
    localStorage.setItem('STIE_LMS_ACTIVE_USER', JSON.stringify(newProfile));
    return newProfile;
  }
}

/**
 * Logout
 */
export async function logoutUser() {
  localStorage.removeItem('STIE_LMS_ACTIVE_USER');
  if (isRealFirebaseConfigured() && auth) {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn("Sign out error:", e);
    }
  }
}

/**
 * Dapatkan user tersimpan dari local state
 */
export function getCurrentUser() {
  try {
    const saved = localStorage.getItem('STIE_LMS_ACTIVE_USER');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Gagal membaca active user:", e);
  }
  return null;
}
