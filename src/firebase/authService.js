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
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { auth, db, isRealFirebaseConfigured } from "./config.js";
import { INITIAL_USERS } from "../utils/seedData.js";

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

  // 1. Kumpulkan seluruh pengguna: gabungkan INITIAL_USERS dengan data dari Firestore (jika ada) dan localStorage
  let combinedUsers = [...INITIAL_USERS];
  try {
    let fbUsers = [];
    let fbLoaded = false;
    if (isRealFirebaseConfigured() && db) {
       try {
         const snap = await getDocs(collection(db, "users"));
          if (!snap.empty) {
            fbUsers = snap.docs.map(d => {
              const data = d.data();
              if (!data.uid && !data.id) data.id = d.id;
              return data;
            });
            const storedRaw = localStorage.getItem('STIE_LMS_USERS');
            let mergedUsers = fbUsers;
            if (storedRaw) {
              try {
                const localParsed = JSON.parse(storedRaw);
                const map = new Map();
                localParsed.forEach(u => {
                  const id = u.uid || u.id || u.email;
                  if (id) map.set(String(id), u);
                });
                fbUsers.forEach(u => {
                  const id = u.uid || u.id || u.email;
                  if (id) {
                    const ex = map.get(String(id));
                    map.set(String(id), { ...(ex || {}), ...u });
                  }
                });
                mergedUsers = Array.from(map.values());
              } catch(e) {}
            }
            localStorage.setItem('STIE_LMS_USERS', JSON.stringify(mergedUsers));
            fbLoaded = true;
          }
       } catch(e) { console.warn(e); }
    }
    
    const stored = localStorage.getItem('STIE_LMS_USERS');
    let parsedUsers = fbLoaded ? fbUsers : (stored ? JSON.parse(stored) : []);
    
    if (!fbLoaded && parsedUsers.length > 0 && isRealFirebaseConfigured() && db) {
       try {
         const { writeBatch, doc } = await import("firebase/firestore");
         const batch = writeBatch(db);
         parsedUsers.forEach(u => {
           const id = u.uid || u.id;
           if (id) batch.set(doc(db, "users", String(id)), u, { merge: true });
         });
         await batch.commit();
       } catch(e) { console.warn("Failed to push local users to FB", e); }
    }

    if (parsedUsers.length > 0) {
      if (Array.isArray(parsedUsers)) {
        parsedUsers.forEach(storedU => {
          const idx = combinedUsers.findIndex(u => 
            u.uid === storedU.uid || 
            (u.email && storedU.email && u.email.toLowerCase() === storedU.email.toLowerCase())
          );
          // Jika ada akun admin di localStorage yang masih memakai password usang admin123, otomatis mutakhirkan ke admin126
          if ((storedU.username === 'admin' || storedU.role === 'SUPER_ADMIN') && storedU.password === 'admin123') {
            storedU.password = 'admin126';
          }

          if (idx >= 0) {
            combinedUsers[idx] = { 
              ...combinedUsers[idx], 
              ...storedU,
              // Prioritaskan password dari data yang disimpan/diubah oleh Admin/BAA
              password: storedU.password !== undefined && storedU.password !== '' 
                ? storedU.password 
                : combinedUsers[idx].password,
              // Hormati status keaktifan akun dari data tersimpan
              isActive: storedU.isActive !== undefined ? storedU.isActive : combinedUsers[idx].isActive 
            };
          } else {
            combinedUsers.push({ ...storedU });
          }
        });
      }
    }
  } catch (e) {
    console.warn("Gagal membaca STIE_LMS_USERS:", e);
  }

  // Filter keluar seluruh akun yang telah dihapus permanen dari sistem
  try {
    const delRaw = localStorage.getItem('STIE_LMS_DELETED_USERS');
    if (delRaw) {
      const delList = JSON.parse(delRaw);
      if (Array.isArray(delList) && delList.length > 0) {
        combinedUsers = combinedUsers.filter(u => {
          const uid = String(u.uid || '');
          const id = String(u.id || '');
          const email = String(u.email || '').toLowerCase().trim();
          const username = String(u.username || '').toLowerCase().trim();
          const nim = String(u.nim || '').trim();
          const nidn = String(u.nidn || '').trim();

          // Rabiyah selalu dilindungi
          if (uid === 'user-mhs-1789806444944' || id === 'user-mhs-1789806444944' || email === 'raby79279@gmail.com' || nim === '20251111644') {
            return true;
          }

          if (uid && delList.includes(uid)) return false;
          if (id && delList.includes(id)) return false;
          if (email && delList.includes(email)) return false;
          if (username && delList.includes(username)) return false;
          if (nim && delList.includes(nim)) return false;
          if (nidn && delList.includes(nidn)) return false;
          return true;
        });
      }
    }
  } catch (e) {}

  // 2. Cari pengguna yang cocok secara tepat (Email, Alias Email, Username, NIM, NIDN, atau kata kunci peran)
  let foundUser = combinedUsers.find(u => 
    (u.email && u.email.toLowerCase() === trimmed) ||
    (u.aliasEmail && u.aliasEmail.toLowerCase() === trimmed) ||
    (u.username && u.username.toLowerCase() === trimmed) ||
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

  // 1. Kumpulkan seluruh pengguna untuk menemukan email terdaftar
  let combinedUsers = [...INITIAL_USERS];
  try {
    const stored = localStorage.getItem('STIE_LMS_USERS');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        parsed.forEach(storedU => {
          const idx = combinedUsers.findIndex(u => 
            u.uid === storedU.uid || 
            (u.email && storedU.email && u.email.toLowerCase() === storedU.email.toLowerCase())
          );
          if (idx >= 0) combinedUsers[idx] = { ...combinedUsers[idx], ...storedU };
          else combinedUsers.push(storedU);
        });
      }
    }
  } catch (e) {
    console.warn("Gagal membaca pengguna lokal:", e);
  }

  // Filter keluar seluruh akun yang telah terhapus
  try {
    const delRaw = localStorage.getItem('STIE_LMS_DELETED_USERS');
    if (delRaw) {
      const delList = JSON.parse(delRaw);
      if (Array.isArray(delList) && delList.length > 0) {
        combinedUsers = combinedUsers.filter(u => {
          const uid = String(u.uid || '');
          const id = String(u.id || '');
          const email = String(u.email || '').toLowerCase().trim();
          if (uid && delList.includes(uid)) return false;
          if (id && delList.includes(id)) return false;
          if (email && delList.includes(email)) return false;
          return true;
        });
      }
    }
  } catch (e) {}

  // 2. Cari pengguna berdasarkan Email, Alias, Username, NIM, atau NIDN
  const foundUser = combinedUsers.find(u => 
    (u.email && u.email.toLowerCase() === trimmed) ||
    (u.aliasEmail && u.aliasEmail.toLowerCase() === trimmed) ||
    (u.username && u.username.toLowerCase() === trimmed) ||
    (u.nim && String(u.nim).trim().toLowerCase() === trimmed) ||
    (u.nidn && String(u.nidn).trim().toLowerCase() === trimmed)
  );

  let targetEmail = null;
  if (foundUser && foundUser.email) {
    targetEmail = foundUser.email.trim();
  } else if (trimmed.includes('@')) {
    targetEmail = trimmed;
  }

  if (!targetEmail) {
    throw new Error(`Akun dengan identitas '${identifier}' tidak ditemukan dalam basis data LMS STIE Nasional.`);
  }

  if (foundUser && foundUser.isActive === false) {
    throw new Error("Akun ini dalam status non-aktif / dibekukan. Silakan hubungi Bagian Administrasi Akademik (BAA).");
  }

  let sentViaFirebase = false;

  // 3. Kirim reset password via Firebase Auth jika terkonfigurasi
  if (isRealFirebaseConfigured() && auth) {
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
    sentViaFirebase
  };
}

