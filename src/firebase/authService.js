/**
 * Layanan Autentikasi Firebase & Otorisasi Pengguna
 * Sesuai PRD FR-01 (Login, State Persistence, Inactive Account Check)
 */
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged 
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

/**
 * Login dengan Email / NIM / NIDN + Password
 */
export async function loginUser(identifier, password) {
  const rawId = (identifier || '').trim();
  const trimmed = rawId.toLowerCase();
  const rawPass = (password || '').trim();

  if (!rawId) {
    throw new Error("Silakan masukkan Email, Username, NIM, atau NIDN Anda.");
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
           localStorage.setItem('STIE_LMS_USERS', JSON.stringify(fbUsers));
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
