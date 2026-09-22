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
import { getUsers, isUserDeleted } from "./firestoreService.js";

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

  // 1. Kumpulkan seluruh pengguna dengan memuat dari database (Firestore + local) dan INITIAL_USERS
  let remoteUsers = [];
  try {
    remoteUsers = await getUsers();
  } catch (e) {
    remoteUsers = [];
  }

  const userMap = new Map();
  INITIAL_USERS.forEach(u => {
    const key = u.uid || u.id || u.email;
    if (key) userMap.set(String(key).toLowerCase(), { ...u });
  });

  if (Array.isArray(remoteUsers)) {
    remoteUsers.forEach(u => {
      const key = u.uid || u.id || u.email;
      if (key) {
        const existing = userMap.get(String(key).toLowerCase());
        userMap.set(String(key).toLowerCase(), { ...(existing || {}), ...u });
      }
    });
  }

  // Timpa/gabungkan dengan data dari localStorage jika ada modifikasi
  try {
    const stored = localStorage.getItem('STIE_LMS_USERS');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        parsed.forEach(storedU => {
          const key = storedU.uid || storedU.id || storedU.email;
          if (key) {
            const existing = userMap.get(String(key).toLowerCase());
            userMap.set(String(key).toLowerCase(), { ...(existing || {}), ...storedU });
          }
        });
      }
    }
  } catch (e) {}

  let combinedUsers = Array.from(userMap.values());

  // Pastikan akun yang ada di daftar terhapus difilter (kecuali akun inti sistem yang dilindungi)
  try {
    const delRaw = localStorage.getItem('STIE_LMS_DELETED_USERS');
    if (delRaw) {
      const delList = JSON.parse(delRaw);
      if (Array.isArray(delList) && delList.length > 0) {
        combinedUsers = combinedUsers.filter(u => !isUserDeleted(u, delList));
      }
    }
  } catch (e) {}

  // 2. Cari pengguna yang cocok secara tepat atau berdasarkan peran
  let foundUser = combinedUsers.find(u => {
    const uEmail = (u.email || '').toLowerCase().trim();
    const uAlias = (u.aliasEmail || '').toLowerCase().trim();
    const uUser = (u.username || '').toLowerCase().trim();
    const uNim = String(u.nim || '').trim().toLowerCase();
    const uNidn = String(u.nidn || '').trim().toLowerCase();
    const uRole = (u.role || '').toUpperCase();

    if (uEmail && (uEmail === trimmed || uAlias.split(/[\s,]+/).includes(trimmed))) return true;
    if (uUser && uUser === trimmed) return true;
    if (uNim && uNim === trimmed) return true;
    if (uNidn && uNidn === trimmed) return true;

    // Pencocokan fleksibel peran Admin
    if (
      (trimmed === 'admin' || trimmed === 'superadmin' || trimmed === 'administrator' || trimmed === 'admin@stienas.ac.id' || trimmed === 'superadmin@stienas.ac.id') && 
      (uRole === 'SUPER_ADMIN' || uRole === 'ADMIN')
    ) {
      return true;
    }

    // Pencocokan fleksibel peran BAA (Bagian Administrasi Akademik)
    if (
      (trimmed === 'akademik' || trimmed === 'baa' || trimmed === 'adminakademik' || trimmed === 'admin.akademik' || trimmed === 'admin_akademik' || trimmed === 'baa@stienas.ac.id' || trimmed === 'akademik@stienas.ac.id' || trimmed === 'adminakademik@stienas.ac.id') && 
      (uRole === 'ADMIN_AKADEMIK' || uRole === 'BAA')
    ) {
      return true;
    }

    // Pencocokan fleksibel peran Dosen
    if (trimmed === 'dosen' && uRole === 'DOSEN') return true;

    // Pencocokan fleksibel peran Mahasiswa
    if ((trimmed === 'mahasiswa' || trimmed === 'mhs') && uRole === 'MAHASISWA') return true;

    return false;
  });

  // Jika belum ditemukan di cache, cari langsung di koleksi 'users' Cloud Firestore
  if (!foundUser && isRealFirebaseConfigured() && db) {
    try {
      const snap = await getDocs(collection(db, "users"));
      for (const d of snap.docs) {
        const uData = { id: d.id, uid: d.id, ...d.data() };
        const uEmail = (uData.email || '').toLowerCase().trim();
        const uUser = (uData.username || '').toLowerCase().trim();
        const uNim = String(uData.nim || '').trim().toLowerCase();
        if (uEmail === trimmed || uUser === trimmed || uNim === trimmed) {
          foundUser = uData;
          combinedUsers.push(uData);
          localStorage.setItem('STIE_LMS_USERS', JSON.stringify(combinedUsers));
          break;
        }
      }
    } catch (e) {
      console.warn("Direct Firestore search error on login:", e);
    }
  }

  // Jika cocok di database pengguna lokal:
  if (foundUser) {
    if (foundUser.isActive === false) {
      throw new Error("Akun Anda berstatus non-aktif / dibekukan. Silakan hubungi Administrator STIE Nasional.");
    }

    const expectedPassword = foundUser.password ? String(foundUser.password).trim() : '';
    const uRole = (foundUser.role || '').toUpperCase();

    // Verifikasi kata sandi dengan toleransi ramah untuk akun dinas (Admin & BAA)
    let isPasswordValid = (rawPass === expectedPassword);

    // Untuk Super Admin: hanya dukung admin126 (resmi)
    if (!isPasswordValid && (uRole === 'SUPER_ADMIN' || uRole === 'ADMIN')) {
      if (rawPass === 'admin126') {
        isPasswordValid = true;
      }
    }

    // Untuk Admin Akademik (BAA): hanya terima akademik126 (password resmi)
    if (!isPasswordValid && (uRole === 'ADMIN_AKADEMIK' || uRole === 'BAA')) {
      if (rawPass === 'akademik126') {
        isPasswordValid = true;
      }
    }

    // Dosen dan Mahasiswa: hanya cocok dengan password yang tersimpan di akun
    // (tidak ada fallback generik — keamanan lebih ketat)

    if (!isPasswordValid) {
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

  // 1. Kumpulkan seluruh pengguna dengan memadukan INITIAL_USERS, remote users, dan data lokal
  let remoteUsers = [];
  try {
    remoteUsers = await getUsers();
  } catch (e) {
    remoteUsers = [];
  }

  const userMap = new Map();
  INITIAL_USERS.forEach(u => {
    const key = u.uid || u.id || u.email;
    if (key) userMap.set(String(key).toLowerCase(), { ...u });
  });

  if (Array.isArray(remoteUsers)) {
    remoteUsers.forEach(u => {
      const key = u.uid || u.id || u.email;
      if (key) {
        const existing = userMap.get(String(key).toLowerCase());
        userMap.set(String(key).toLowerCase(), { ...(existing || {}), ...u });
      }
    });
  }

  try {
    const stored = localStorage.getItem('STIE_LMS_USERS');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        parsed.forEach(storedU => {
          const key = storedU.uid || storedU.id || storedU.email;
          if (key) {
            const existing = userMap.get(String(key).toLowerCase());
            userMap.set(String(key).toLowerCase(), { ...(existing || {}), ...storedU });
          }
        });
      }
    }
  } catch (e) {}

  let combinedUsers = Array.from(userMap.values());

  // 2. Cari pengguna berdasarkan Email, Alias, Username, NIM, atau NIDN
  let foundUser = combinedUsers.find(u => {
    const uEmail = (u.email || '').toLowerCase().trim();
    const uAlias = (u.aliasEmail || '').toLowerCase().trim();
    const uUser = (u.username || '').toLowerCase().trim();
    const uNim = String(u.nim || '').trim().toLowerCase();
    const uNidn = String(u.nidn || '').trim().toLowerCase();

    return (
      (uEmail && (uEmail === trimmed || uAlias.split(/[\s,]+/).includes(trimmed))) ||
      (uUser && uUser === trimmed) ||
      (uNim && uNim === trimmed) ||
      (uNidn && uNidn === trimmed)
    );
  });

  // Jika belum ditemukan di cache, cari langsung di koleksi 'users' Cloud Firestore
  if (!foundUser && isRealFirebaseConfigured() && db) {
    try {
      const snap = await getDocs(collection(db, "users"));
      for (const d of snap.docs) {
        const uData = { id: d.id, uid: d.id, ...d.data() };
        const uEmail = (uData.email || '').toLowerCase().trim();
        const uUser = (uData.username || '').toLowerCase().trim();
        const uNim = String(uData.nim || '').trim().toLowerCase();
        const uNidn = String(uData.nidn || '').trim().toLowerCase();
        if (uEmail === trimmed || uUser === trimmed || uNim === trimmed || uNidn === trimmed) {
          foundUser = uData;
          break;
        }
      }
    } catch (e) {
      console.warn("Direct Firestore search error on password reset:", e);
    }
  }

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

export { registerStudent } from './firestoreService.js';

