/**
 * Layanan Autentikasi Firebase & Otorisasi Pengguna
 * Sesuai PRD FR-01 (Login, State Persistence, Inactive Account Check)
 */
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  sendPasswordResetEmail 
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { auth, db, isRealFirebaseConfigured } from "./config.js";
import { INITIAL_USERS } from "../utils/seedData.js";
import { getUsers } from "./firestoreService.js";

// Helper konversi username/NIM/NIDN ke email standard jika bukan format email
export function normalizeLoginIdentifier(identifier) {
  const trimmed = (identifier || '').trim().toLowerCase();
  if (trimmed.includes('@')) {
    return trimmed;
  }
  // Format NIM / NIDN ke email domain LMS STIE Nasional
  return `${trimmed}@lms.stienas.ac.id`;
}

// =========================================================================
// MEKANISME SESSION TIMEOUT & INACTIVITY TIMEOUT (15 MENIT)
// =========================================================================
export const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 Menit Inactive Timeout
export const WARNING_BEFORE_TIMEOUT_MS = 2 * 60 * 1000; // Peringatan 2 Menit sebelum timeout

export function recordUserActivity() {
  try {
    localStorage.setItem('STIE_LMS_LAST_ACTIVITY', Date.now().toString());
  } catch (e) {}
}

/**
 * Login dengan Email / NIM / NIDN + Password
 */
export async function loginUser(identifier, password) {
  const rawId = (identifier || '').trim();
  const trimmed = rawId.toLowerCase();
  const rawPass = (password || '').trim();

  if (!rawId) {
    throw new Error("Silakan masukkan Email, Username, NIM, atau NUPTK/NIP Anda.");
  }
  if (!rawPass) {
    throw new Error("Silakan masukkan kata sandi akun Anda.");
  }

  // 1. Kumpulkan seluruh pengguna dari getUsers() yang memadukan data cloud Firestore dan local storage secara terpadu
  let combinedUsers = [];
  try {
    combinedUsers = await getUsers();
  } catch (e) {
    console.warn("getUsers error during login:", e);
    const stored = localStorage.getItem('STIE_LMS_USERS');
    combinedUsers = stored ? JSON.parse(stored) : [...INITIAL_USERS];
  }

  // Jika ada akun admin di storage yang masih memakai password usang admin123, otomatis mutakhirkan ke admin126
  combinedUsers.forEach(u => {
    if ((u.username === 'admin' || u.role === 'SUPER_ADMIN') && u.password === 'admin123') {
      u.password = 'admin126';
    }
  });

  // 2. Cari pengguna yang cocok secara tepat (Email, Alias Email, Username, NIM, NIDN, atau kata kunci peran)
  let foundUser = combinedUsers.find(u => 
    (u.email && u.email.toLowerCase().trim() === trimmed) ||
    (u.aliasEmail && u.aliasEmail.toLowerCase().trim() === trimmed) ||
    (u.username && u.username.toLowerCase().trim() === trimmed) ||
    (u.nim && String(u.nim).trim().toLowerCase() === trimmed) ||
    (u.nidn && String(u.nidn).trim().toLowerCase() === trimmed) ||
    (trimmed === 'admin' && (u.role === 'SUPER_ADMIN' || u.role === 'ADMIN')) ||
    (trimmed === 'superadmin' && (u.role === 'SUPER_ADMIN' || u.role === 'ADMIN')) ||
    ((trimmed === 'akademik' || trimmed === 'baa') && (u.role === 'ADMIN_AKADEMIK' || u.role === 'BAA')) ||
    (trimmed === 'dosen' && u.role === 'DOSEN') ||
    (trimmed === 'mahasiswa' && u.role === 'MAHASISWA') ||
    (trimmed === 'mhs' && u.role === 'MAHASISWA')
  );

  // Jika cocok di database pengguna lokal:
  if (foundUser) {
    // A. Cek status keaktifan akun
    if (foundUser.isActive === false) {
      throw new Error("Akun Anda berstatus non-aktif / dibekukan. Silakan hubungi Administrator STIE Nasional.");
    }

    // B. Validasi kata sandi KETAT (Strict Password Verification):
    // Kata sandi HARUS tepat sesuai dengan data yang dibuat/diubah oleh Admin dan BAA.
    // Password usang seperti admin123 telah dihilangkan sepenuhnya karena telah diganti menjadi admin126.
    const expectedPassword = foundUser.password ? String(foundUser.password).trim() : '';

    if (!expectedPassword) {
      throw new Error("Akun ini belum memiliki kata sandi yang disetel. Silakan hubungi Administrator STIE Nasional.");
    }

    if (rawPass !== expectedPassword) {
      throw new Error("Kata sandi yang Anda masukkan salah. Silakan periksa kembali kata sandi akun Anda.");
    }

    // Password valid: Login berhasil
    const activeUser = {
      ...foundUser
    };

    localStorage.setItem('STIE_LMS_ACTIVE_USER', JSON.stringify(activeUser));
    recordUserActivity();
    localStorage.removeItem('STIE_LMS_SESSION_EXPIRED');
    return activeUser;
  }

  // 3. Jika tidak ditemukan di lokal dan Firebase asli dikonfigurasi:
  if (isRealFirebaseConfigured() && auth) {
    try {
      const normalizedEmail = normalizeLoginIdentifier(identifier);
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, rawPass);
      const user = userCredential.user;

      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.isActive === false) {
          await firebaseSignOut(auth);
          throw new Error("Akun Anda berstatus non-aktif. Silakan hubungi Administrator STIE Nasional.");
        }
        const fullProfile = { uid: user.uid, ...userData };
        localStorage.setItem('STIE_LMS_ACTIVE_USER', JSON.stringify(fullProfile));
        recordUserActivity();
        localStorage.removeItem('STIE_LMS_SESSION_EXPIRED');
        return fullProfile;
      } else {
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
        recordUserActivity();
        localStorage.removeItem('STIE_LMS_SESSION_EXPIRED');
        return newProfile;
      }
    } catch (fbErr) {
      console.warn("Firebase sign in error:", fbErr);
    }
  }

  throw new Error(`Akun dengan identitas '${identifier}' tidak ditemukan. Silakan periksa kembali atau pilih salah satu akun uji.`);
}

/**
 * Logout
 */
export async function logoutUser() {
  localStorage.removeItem('STIE_LMS_ACTIVE_USER');
  localStorage.removeItem('STIE_LMS_LAST_ACTIVITY');
  if (isRealFirebaseConfigured() && auth) {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn("Sign out error:", e);
    }
  }
}

/**
 * Dapatkan user tersimpan dari local state dengan validasi Session Inactivity Timeout
 */
export function getCurrentUser() {
  try {
    const saved = localStorage.getItem('STIE_LMS_ACTIVE_USER');
    if (!saved) return null;

    // Verifikasi batas waktu ketidakaktifan (Session Timeout 15 menit)
    const lastActivity = localStorage.getItem('STIE_LMS_LAST_ACTIVITY');
    if (lastActivity) {
      const elapsed = Date.now() - parseInt(lastActivity, 10);
      if (elapsed > SESSION_TIMEOUT_MS) {
        localStorage.removeItem('STIE_LMS_ACTIVE_USER');
        localStorage.removeItem('STIE_LMS_LAST_ACTIVITY');
        localStorage.setItem('STIE_LMS_SESSION_EXPIRED', 'true');
        return null;
      }
    } else {
      // Jika belum ada stempel aktivitas, catat saat ini
      recordUserActivity();
    }

    return JSON.parse(saved);
  } catch (e) {
    console.error("Gagal membaca active user:", e);
  }
  return null;
}

/**
 * Permintaan Reset Kata Sandi - Kirim tautan ke email resmi yang terdaftar
 * Mendukung pencarian berdasarkan Email, NIM, atau Username
 */
export async function requestPasswordReset(identifier) {
  const rawId = (identifier || '').trim();
  const trimmed = rawId.toLowerCase();

  if (!rawId) {
    throw new Error("Silakan masukkan alamat email, NIM, atau username akun Anda.");
  }

  // 1. Kumpulkan seluruh pengguna dari getUsers()
  let combinedUsers = [];
  try {
    combinedUsers = await getUsers();
  } catch (e) {
    console.warn("Gagal membaca pengguna dari getUsers():", e);
    const stored = localStorage.getItem('STIE_LMS_USERS');
    combinedUsers = stored ? JSON.parse(stored) : [...INITIAL_USERS];
  }

  // 2. Cari pengguna berdasarkan Email, Alias, Username, NIM, atau NIDN
  const foundUser = combinedUsers.find(u => 
    (u.email && u.email.toLowerCase().trim() === trimmed) ||
    (u.aliasEmail && u.aliasEmail.toLowerCase().trim() === trimmed) ||
    (u.username && u.username.toLowerCase().trim() === trimmed) ||
    (u.nim && String(u.nim).trim().toLowerCase() === trimmed) ||
    (u.nidn && String(u.nidn).trim().toLowerCase() === trimmed)
  );

  let targetEmail = null;
  if (foundUser && foundUser.email) {
    targetEmail = foundUser.email.trim();
  } else if (trimmed.includes('@')) {
    targetEmail = trimmed;
  }

  if (!foundUser && !targetEmail) {
    throw new Error(`Akun dengan identitas '${identifier}' tidak ditemukan dalam basis data LMS STIE Nasional.`);
  }

  if (foundUser && foundUser.isActive === false) {
    throw new Error("Akun ini dalam status non-aktif / dibekukan. Silakan hubungi Bagian Administrasi Akademik (BAA).");
  }

  let sentViaFirebase = false;

  // 3. Kirim reset password via Firebase Auth jika terkonfigurasi
  if (isRealFirebaseConfigured() && auth && targetEmail) {
    try {
      await sendPasswordResetEmail(auth, targetEmail);
      sentViaFirebase = true;
    } catch (fbErr) {
      console.warn("Firebase sendPasswordResetEmail notice:", fbErr.code || fbErr.message);
    }
  }

  // 4. Catat permintaan ke riwayat permintaan reset di localStorage agar Admin/BAA dapat memantau jika perlu
  try {
    const resetRequestsKey = 'STIE_LMS_RESET_REQUESTS';
    const rawReqs = localStorage.getItem(resetRequestsKey);
    const requests = rawReqs ? JSON.parse(rawReqs) : [];
    requests.unshift({
      id: `reset-${Date.now()}`,
      email: targetEmail,
      name: foundUser?.name || 'Pengguna LMS',
      identifierProvided: identifier,
      sentViaFirebase,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem(resetRequestsKey, JSON.stringify(requests.slice(0, 50)));
  } catch (e) {
    console.warn("Save reset request error:", e);
  }

  return {
    success: true,
    email: targetEmail,
    name: foundUser?.name || targetEmail,
    sentViaFirebase,
    foundUser: foundUser ? {
      uid: foundUser.uid || foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
      nim: foundUser.nim,
      role: foundUser.role
    } : null
  };
}

/**
 * Reset Kata Sandi Langsung secara Aman (Self-Service Direct Password Reset)
 * Digunakan jika layanan email Firebase eksternal tidak aktif atau kuota habis
 */
export async function directResetPassword(identifier, newPassword) {
  const rawId = (identifier || '').trim();
  const trimmed = rawId.toLowerCase();
  const cleanPass = (newPassword || '').trim();

  if (!rawId) {
    throw new Error("Identitas pengguna tidak boleh kosong.");
  }
  if (!cleanPass || cleanPass.length < 6) {
    throw new Error("Kata sandi baru minimal 6 karakter.");
  }

  let list = [];
  try {
    list = await getUsers();
  } catch (e) {
    const stored = localStorage.getItem('STIE_LMS_USERS');
    list = stored ? JSON.parse(stored) : [...INITIAL_USERS];
  }

  const target = list.find(u => 
    (u.email && u.email.toLowerCase().trim() === trimmed) ||
    (u.aliasEmail && u.aliasEmail.toLowerCase().trim() === trimmed) ||
    (u.username && u.username.toLowerCase().trim() === trimmed) ||
    (u.nim && String(u.nim).trim().toLowerCase() === trimmed) ||
    (u.nidn && String(u.nidn).trim().toLowerCase() === trimmed) ||
    (u.uid && String(u.uid) === rawId) ||
    (u.id && String(u.id) === rawId)
  );

  if (!target) {
    throw new Error(`Akun dengan identitas '${identifier}' tidak ditemukan dalam sistem.`);
  }

  const targetUid = target.uid || target.id;

  // Perbarui kata sandi di state lokal
  const updatedList = list.map(u => {
    if ((targetUid && (u.uid === targetUid || u.id === targetUid)) || (u.email && u.email.toLowerCase().trim() === target.email.toLowerCase().trim())) {
      return {
        ...u,
        password: cleanPass
      };
    }
    return u;
  });

  localStorage.setItem('STIE_LMS_USERS', JSON.stringify(updatedList));

  // Coba perbarui di Firestore jika online
  if (isRealFirebaseConfigured() && db && targetUid) {
    try {
      await updateDoc(doc(db, "users", String(targetUid)), { password: cleanPass });
    } catch (e) {
      console.warn("Direct Firestore directResetPassword updateDoc warning:", e);
    }
  }

  return {
    success: true,
    name: target.name,
    email: target.email,
    nim: target.nim
  };
}

