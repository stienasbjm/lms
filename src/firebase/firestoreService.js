/**
 * Layanan Firestore Terpadu (CRUD & Real-Time Sync)
 * Mendukung mode Real Firebase BaaS dan Local Persistent Fallback/Demo
 * Sesuai skema data NoSQL PRD Bagian 5
 */
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  writeBatch, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, isRealFirebaseConfigured } from "./config";
import { 
  INITIAL_FAKULTAS, 
  INITIAL_PRODI, 
  INITIAL_TA, 
  INITIAL_USERS, 
  INITIAL_MK, 
  INITIAL_CLASSES, 
  INITIAL_AUDIT_LOGS,
  generateDefault16Meetings 
} from "../utils/seedData";
import { calculateFinalGrade } from "../utils/gradeCalculator";

// Key Penyimpanan LocalStorage untuk mode Demo / Cepat
export const STORAGE_KEYS = {
  FAKULTAS: 'STIE_LMS_FAKULTAS',
  PRODI: 'STIE_LMS_PRODI',
  TA: 'STIE_LMS_TA',
  USERS: 'STIE_LMS_USERS',
  MK: 'STIE_LMS_MK',
  CLASSES: 'STIE_LMS_CLASSES',
  LOGS: 'STIE_LMS_AUDIT_LOGS'
};

export const DATA_SYNC_EVENT = 'stie_data_sync';

export function notifyDataChange(key, value) {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent(DATA_SYNC_EVENT, { detail: { key, value } }));
    } catch (e) {
      console.warn("Event dispatch error:", e);
    }
  }
}
export const emitDataSync = notifyDataChange;

export function subscribeToDataSync(callback) {
  if (typeof window === 'undefined') return () => {};
  const handleCustom = (e) => callback(e.detail || {});
  const handleStorage = (e) => callback({ key: e.key, value: e.newValue });

  window.addEventListener(DATA_SYNC_EVENT, handleCustom);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(DATA_SYNC_EVENT, handleCustom);
    window.removeEventListener('storage', handleStorage);
  };
}

export function getCollectionName(key) {
  switch (key) {
    case STORAGE_KEYS.FAKULTAS: return 'fakultas';
    case STORAGE_KEYS.PRODI: return 'prodi';
    case STORAGE_KEYS.TA: return 'tahun_akademik';
    case STORAGE_KEYS.USERS: return 'users';
    case STORAGE_KEYS.MK: return 'mata_kuliah';
    case STORAGE_KEYS.CLASSES: return 'kelas_kuliah';
    case STORAGE_KEYS.LOGS: return 'audit_logs';
    default: return null;
  }
}

export async function getLocal(key, initial) {
  let localItems = [];
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      localItems = JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Storage read error:", e);
  }

  let fbLoaded = false;
  if (isRealFirebaseConfigured() && db) {
    const colName = getCollectionName(key);
    if (colName) {
      try {
        const snap = await getDocs(collection(db, colName));
        if (!snap.empty) {
          const remoteItems = snap.docs.map(d => {
            const data = d.data();
            if (!data.uid && !data.id) {
               data.id = d.id;
            }
            if (data.id && !data.uid) {
               data.uid = data.id;
            }
            if (data.uid && !data.id) {
               data.id = data.uid;
            }
            return data;
          });

          let deletedIds = [];
          if (key === STORAGE_KEYS.USERS) {
            try {
              const delRaw = localStorage.getItem('STIE_LMS_DELETED_USERS');
              if (delRaw) deletedIds = JSON.parse(delRaw);
            } catch(e) {}
            // Pastikan akun yang telah dihapus permanen masuk ke filter
            const permanentDeleted = [
              'user-mhs-1789716217109', 
              'user-mhs-1789715558398',
              'user-mhs-1',
              'user-mhs-2',
              'user-mhs-3',
              'user-mahasiswa-1789742014560'
            ];
            permanentDeleted.forEach(pid => {
              if (!deletedIds.includes(pid)) deletedIds.push(pid);
            });
          } else if (key === STORAGE_KEYS.CLASSES) {
            try {
              const delRaw = localStorage.getItem('STIE_LMS_DELETED_CLASSES');
              if (delRaw) deletedIds = JSON.parse(delRaw);
            } catch(e) {}
          } else if (key === STORAGE_KEYS.TA) {
            try {
              const delRaw = localStorage.getItem('STIE_LMS_DELETED_TA');
              if (delRaw) deletedIds = JSON.parse(delRaw);
            } catch(e) {}
          } else if (key === STORAGE_KEYS.MK) {
            try {
              const delRaw = localStorage.getItem('STIE_LMS_DELETED_MK');
              if (delRaw) deletedIds = JSON.parse(delRaw);
            } catch(e) {}
          }

          // Gabungkan remoteItems dan localItems (pertahankan data lokal baru yang belum sempat tersinkron)
          let finalItems = remoteItems;
          if (Array.isArray(localItems) && localItems.length > 0) {
            const itemMap = new Map();
            // Masukkan data lokal terlebih dahulu
            localItems.forEach(item => {
              const id = item.uid || item.id || item.email || item.kodeMk || item.kodeTa;
              if (id) itemMap.set(String(id), item);
            });
            // Update / gabungkan dengan data dari Firestore
            remoteItems.forEach(item => {
              const id = item.uid || item.id || item.email || item.kodeMk || item.kodeTa;
              if (id) {
                const existing = itemMap.get(String(id));
                itemMap.set(String(id), { ...(existing || {}), ...item });
              }
            });
            finalItems = Array.from(itemMap.values());
          }

          if (deletedIds.length > 0) {
            finalItems = finalItems.filter(item => {
              const id = String(item.uid || item.id || '');
              return !deletedIds.includes(id);
            });
          }

          localStorage.setItem(key, JSON.stringify(finalItems));
          fbLoaded = true;
          return finalItems;
        }
      } catch(e) {
        console.warn("Firestore getLocal error:", e);
      }
    }
  }

  // Ambil daftar ID yang dihapus untuk fallback local
  let localDeletedIds = [];
  if (key === STORAGE_KEYS.USERS) {
    try {
      const delRaw = localStorage.getItem('STIE_LMS_DELETED_USERS');
      if (delRaw) localDeletedIds = JSON.parse(delRaw);
    } catch(e) {}
    const permanentDeleted = [
      'user-mhs-1789716217109', 
      'user-mhs-1789715558398',
      'user-mhs-1',
      'user-mhs-2',
      'user-mhs-3',
      'user-mahasiswa-1789742014560'
    ];
    permanentDeleted.forEach(pid => {
      if (!localDeletedIds.includes(pid)) localDeletedIds.push(pid);
    });
  } else if (key === STORAGE_KEYS.CLASSES) {
    try {
      const delRaw = localStorage.getItem('STIE_LMS_DELETED_CLASSES');
      if (delRaw) localDeletedIds = JSON.parse(delRaw);
    } catch(e) {}
  } else if (key === STORAGE_KEYS.TA) {
    try {
      const delRaw = localStorage.getItem('STIE_LMS_DELETED_TA');
      if (delRaw) localDeletedIds = JSON.parse(delRaw);
    } catch(e) {}
  } else if (key === STORAGE_KEYS.MK) {
    try {
      const delRaw = localStorage.getItem('STIE_LMS_DELETED_MK');
      if (delRaw) localDeletedIds = JSON.parse(delRaw);
    } catch(e) {}
  }

  if (Array.isArray(localItems) && localItems.length > 0) {
    if (localDeletedIds.length > 0) {
      localItems = localItems.filter(item => !localDeletedIds.includes(String(item.id || item.uid || '')));
    }
    return localItems;
  }
  const cleanInitial = (localDeletedIds.length > 0 && Array.isArray(initial))
    ? initial.filter(item => !localDeletedIds.includes(String(item.id || item.uid || '')))
    : initial;
  await setLocal(key, cleanInitial);
  return cleanInitial;
}

export async function setLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyDataChange(key, value);
    
    if (isRealFirebaseConfigured() && db) {
      const colName = getCollectionName(key);
      if (colName && Array.isArray(value)) {
        try {
          const batch = writeBatch(db);
          let count = 0;
          
          value.forEach(item => {
            const id = item.uid || item.id;
            if (id) {
              const cleanItem = JSON.parse(JSON.stringify(item));
              batch.set(doc(db, colName, String(id)), cleanItem, { merge: true });
              count++;
            }
          });
          
          if (count > 0 && count <= 500) {
             await batch.commit();
          } else if (count > 500) {
             console.warn("Batch size exceeds 500, skipping sync.");
          }
        } catch (batchErr) {
          console.warn("Firestore setLocal batch sync warning:", batchErr);
        }
      }
    }
  } catch (e) {
    console.warn("Storage write error:", e);
  }
}

// Inisialisasi awal localStorage
export async function initializeLocalStore() {
  await getLocal(STORAGE_KEYS.FAKULTAS, INITIAL_FAKULTAS);
  await getLocal(STORAGE_KEYS.PRODI, INITIAL_PRODI);
  
  // Pastikan Semester / TA yang dihapus tidak dibangkitkan
  let deletedTaIds = [];
  try {
    const delRaw = localStorage.getItem('STIE_LMS_DELETED_TA');
    if (delRaw) deletedTaIds = JSON.parse(delRaw);
  } catch(e) {}
  const existingTa = await getLocal(STORAGE_KEYS.TA, INITIAL_TA);
  const cleanTa = existingTa.filter(t => !deletedTaIds.includes(String(t.id)));
  if (cleanTa.length !== existingTa.length) {
    await setLocal(STORAGE_KEYS.TA, cleanTa);
  }

  await getLocal(STORAGE_KEYS.USERS, INITIAL_USERS);

  // Pastikan Mata Kuliah yang baru disertakan dan yang dihapus tidak dibangkitkan
  let deletedMkIds = [];
  try {
    const delRaw = localStorage.getItem('STIE_LMS_DELETED_MK');
    if (delRaw) deletedMkIds = JSON.parse(delRaw);
  } catch(e) {}
  const existingMks = await getLocal(STORAGE_KEYS.MK, INITIAL_MK);
  const missingMks = INITIAL_MK.filter(imk =>
    !existingMks.some(emk => String(emk.id) === String(imk.id) || emk.kodeMk === imk.kodeMk) &&
    !deletedMkIds.includes(String(imk.id))
  );
  const combinedMks = (missingMks.length > 0 ? [...existingMks, ...missingMks] : existingMks)
    .filter(m => !deletedMkIds.includes(String(m.id)));
  await setLocal(STORAGE_KEYS.MK, combinedMks);
  
  // Bersihkan materi dummy lama yang memiliki raw.githubusercontent.com dan sertakan kelas baru jika ada
  let deletedClassIds = [];
  try {
    const delRaw = localStorage.getItem('STIE_LMS_DELETED_CLASSES');
    if (delRaw) deletedClassIds = JSON.parse(delRaw);
  } catch(e) {}

  const existingClasses = await getLocal(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  const missingInitial = INITIAL_CLASSES.filter(ic => 
    !existingClasses.some(ec => String(ec.id) === String(ic.id)) &&
    !deletedClassIds.includes(String(ic.id))
  );
  const combinedClasses = missingInitial.length > 0 ? [...existingClasses, ...missingInitial] : existingClasses;

  const cleanedClasses = combinedClasses
    .filter(cls => !deletedClassIds.includes(String(cls.id)))
    .map(cls => ({
      ...cls,
      meetings: (cls.meetings || []).map(m => ({
        ...m,
        materials: (m.materials || []).filter(mat => 
          !mat.judul?.includes('Slide Materi Pertemuan 2') &&
          !(mat.fileUrl || '').includes('raw.githubusercontent.com')
        )
      }))
    }));
  await setLocal(STORAGE_KEYS.CLASSES, cleanedClasses);

  await getLocal(STORAGE_KEYS.LOGS, INITIAL_AUDIT_LOGS);
}
initializeLocalStore().catch(console.error);

/* =========================================================================
   1. AUDIT LOGS (FR-08.2)
   ========================================================================= */
export async function logAudit(user, action, details) {
  const logItem = {
    id: `log-${Date.now()}`,
    userId: user?.uid || 'anonymous',
    userName: user?.name || user?.email || 'System',
    role: user?.role || 'UNKNOWN',
    action,
    details,
    timestamp: new Date().toISOString()
  };

  const logs = await getLocal(STORAGE_KEYS.LOGS, INITIAL_AUDIT_LOGS);
  logs.unshift(logItem);
  await setLocal(STORAGE_KEYS.LOGS, logs.slice(0, 200));

  if (isRealFirebaseConfigured() && db) {
    try {
      await addDoc(collection(db, "audit_logs"), {
        ...logItem,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.warn("Audit log to Firestore error:", e);
    }
  }
}

export async function getAuditLogs() {
  if (isRealFirebaseConfigured() && db) {
    try {
      const q = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn("Firestore audit logs read failed, fallback to local:", e);
    }
  }
  return await getLocal(STORAGE_KEYS.LOGS, INITIAL_AUDIT_LOGS);
}

/* =========================================================================
   2. MASTER DATA (FR-02)
   ========================================================================= */
export async function getFakultas() {
  return await getLocal(STORAGE_KEYS.FAKULTAS, INITIAL_FAKULTAS);
}

export async function getProdi() {
  const list = await getLocal(STORAGE_KEYS.PRODI, INITIAL_PRODI);
  let hasCorrection = false;
  const corrected = list.map(item => {
    const isAkt = item.id === 'prodi-s1-akuntansi' || item.namaProdi?.toLowerCase().includes('akuntansi') || item.kodeProdi === '62201';
    const isMnj = item.id === 'prodi-s1-manajemen' || item.namaProdi?.toLowerCase().includes('manajemen') || item.kodeProdi === '61201';

    let namaKaprodi = item.namaKaprodi;
    let nuptkKaprodi = item.nuptkKaprodi || item.nidnKaprodi;

    if (isAkt) {
      if (!namaKaprodi || namaKaprodi.includes('Ramli') || !nuptkKaprodi || nuptkKaprodi === '1102046801') {
        namaKaprodi = 'Hj. Nurul Fadhilah, S.E., M.Ak., Ak., CA';
        nuptkKaprodi = '1124018201';
        hasCorrection = true;
      }
    } else if (isMnj) {
      if (!namaKaprodi || namaKaprodi.includes('Fadhilah') || !nuptkKaprodi || nuptkKaprodi === '1124018201') {
        namaKaprodi = 'Dr. H. Muhammad Ramli, S.E., M.M.';
        nuptkKaprodi = '1102046801';
        hasCorrection = true;
      }
    }

    return {
      ...item,
      namaKaprodi: namaKaprodi || (isAkt ? 'Hj. Nurul Fadhilah, S.E., M.Ak., Ak., CA' : 'Dr. H. Muhammad Ramli, S.E., M.M.'),
      nuptkKaprodi: nuptkKaprodi || (isAkt ? '1124018201' : '1102046801')
    };
  });

  if (hasCorrection) {
    await setLocal(STORAGE_KEYS.PRODI, corrected);
  }

  return corrected;
}

export async function updateProdi(prodiId, updateData, user) {
  const list = await getProdi();
  const updated = list.map(item => {
    if (item.id === prodiId) {
      return { ...item, ...updateData };
    }
    return item;
  });
  await setLocal(STORAGE_KEYS.PRODI, updated);
  if (user) {
    await logAudit(user, 'UPDATE_PRODI', `Mengubah data Kaprodi / Program Studi ID: ${prodiId} (${updateData.namaKaprodi || ''})`);
  }
  return updated;
}

export async function getTahunAkademik() {
  return await getLocal(STORAGE_KEYS.TA, INITIAL_TA);
}

export async function setTahunAkademikActive(taId, user) {
  const list = await getLocal(STORAGE_KEYS.TA, INITIAL_TA);
  const updated = list.map(item => ({
    ...item,
    isActive: item.id === taId
  }));
  await setLocal(STORAGE_KEYS.TA, updated);
  await logAudit(user, 'UPDATE_TA', `Mengaktifkan Tahun Akademik ID: ${taId}`);
  return updated;
}

export async function addTahunAkademik(taData, user) {
  const list = await getLocal(STORAGE_KEYS.TA, INITIAL_TA);
  const newTa = {
    ...taData,
    id: taData.id || `ta-${Date.now()}`,
    isActive: taData.isActive || false,
    status: taData.isActive ? 'DIBUKA' : 'DITUTUP'
  };
  if (newTa.isActive) {
    list.forEach(t => {
      t.isActive = false;
      t.status = 'DITUTUP';
    });
  }
  list.unshift(newTa);
  await setLocal(STORAGE_KEYS.TA, list);
  await logAudit(user, 'CREATE_TA', `Membuka/Menambahkan Semester Baru: ${newTa.namaTa} (${newTa.kodeTa})`);
  return list;
}

export async function toggleTahunAkademikStatus(taId, user) {
  const list = await getLocal(STORAGE_KEYS.TA, INITIAL_TA);
  let targetTa = list.find(t => t.id === taId);
  if (!targetTa) return list;

  const willBeActive = !targetTa.isActive;
  const updated = list.map(item => {
    if (item.id === taId) {
      return {
        ...item,
        isActive: willBeActive,
        status: willBeActive ? 'DIBUKA' : 'DITUTUP'
      };
    }
    // Jika semester taId dibuka/diaktifkan, semester lainnya dinonaktifkan (ditutup)
    if (willBeActive) {
      return {
        ...item,
        isActive: false,
        status: 'DITUTUP'
      };
    }
    return item;
  });

  await setLocal(STORAGE_KEYS.TA, updated);
  await logAudit(
    user, 
    willBeActive ? 'BUKA_SEMESTER' : 'TUTUP_SEMESTER', 
    `${willBeActive ? 'Membuka' : 'Menutup'} Semester / Tahun Akademik: ${targetTa.namaTa} (${targetTa.kodeTa})`
  );
  return updated;
}

export async function deleteTahunAkademik(taId, user) {
  if (!taId) throw new Error("ID Semester tidak valid");
  const list = await getLocal(STORAGE_KEYS.TA, INITIAL_TA);
  const target = list.find(t => String(t.id) === String(taId));
  const updated = list.filter(t => String(t.id) !== String(taId));

  // 1. Catat ke STIE_LMS_DELETED_TA agar tidak ter-resurrect
  try {
    const delRaw = localStorage.getItem('STIE_LMS_DELETED_TA') || '[]';
    const delList = JSON.parse(delRaw);
    const targetIdStr = String(taId);
    if (!delList.includes(targetIdStr)) {
      delList.push(targetIdStr);
      localStorage.setItem('STIE_LMS_DELETED_TA', JSON.stringify(delList));
    }
  } catch (e) {}

  // 2. Hapus langsung dokumen di Cloud Firestore koleksi 'tahun_akademik'
  if (isRealFirebaseConfigured() && db) {
    try {
      await deleteDoc(doc(db, "tahun_akademik", String(taId)));
    } catch (e) {
      console.warn("Direct Firestore deleteTahunAkademik warning:", e);
    }
  }

  await setLocal(STORAGE_KEYS.TA, updated);
  await logAudit(user, 'DELETE_TA', `Menghapus Semester: ${target?.namaTa || taId}`);
  return updated;
}

export async function getMataKuliah() {
  return await getLocal(STORAGE_KEYS.MK, INITIAL_MK);
}

export async function addMataKuliah(mkData, user) {
  const list = await getLocal(STORAGE_KEYS.MK, INITIAL_MK);
  const newMk = {
    ...mkData,
    id: `mk-${Date.now()}`
  };
  list.push(newMk);
  await setLocal(STORAGE_KEYS.MK, list);
  await logAudit(user, 'CREATE_MK', `Menambahkan Mata Kuliah ${newMk.kodeMk} - ${newMk.namaMk}`);
  return newMk;
}

export async function updateMataKuliah(mkId, updatedData, user) {
  const list = await getLocal(STORAGE_KEYS.MK, INITIAL_MK);
  const updated = list.map(item => {
    if (item.id === mkId) {
      return { ...item, ...updatedData };
    }
    return item;
  });
  await setLocal(STORAGE_KEYS.MK, updated);

  // Jika BAA memperbarui penugasan Dosen pada Mata Kuliah, sinkronkan ke seluruh kelas perkuliahan terkait
  if (updatedData.dosenId) {
    try {
      const [users, currentClasses] = await Promise.all([
        getLocal(STORAGE_KEYS.USERS, INITIAL_USERS),
        getLocal(STORAGE_KEYS.CLASSES, INITIAL_CLASSES)
      ]);
      const targetDosen = users.find(u => u.uid === updatedData.dosenId || u.id === updatedData.dosenId);
      if (targetDosen) {
        const syncedClasses = currentClasses.map(c => {
          if (c.mataKuliahId === mkId || c.kodeMk === updatedData.kodeMk) {
            return {
              ...c,
              dosenId: targetDosen.uid || targetDosen.id,
              namaDosen: targetDosen.name || c.namaDosen,
              dosenNidn: targetDosen.nidn || c.dosenNidn || '',
              dosenEmail: targetDosen.email || c.dosenEmail || ''
            };
          }
          return c;
        });
        await setLocal(STORAGE_KEYS.CLASSES, syncedClasses);
        notifyDataChange(STORAGE_KEYS.CLASSES, syncedClasses);
      }
    } catch (syncErr) {
      console.warn("Gagal sinkronisasi kelas dari update mata kuliah:", syncErr);
    }
  }

  await logAudit(user, 'UPDATE_MK', `Memperbarui Mata Kuliah ${updatedData.kodeMk || ''} - ${updatedData.namaMk || ''}`);
  return updated;
}

export async function deleteMataKuliah(mkId, user) {
  if (!mkId) throw new Error("ID Mata Kuliah tidak valid");
  const list = await getLocal(STORAGE_KEYS.MK, INITIAL_MK);
  const target = list.find(m => String(m.id) === String(mkId));
  const updated = list.filter(m => String(m.id) !== String(mkId));

  // 1. Catat ke STIE_LMS_DELETED_MK agar tidak ter-resurrect
  try {
    const delRaw = localStorage.getItem('STIE_LMS_DELETED_MK') || '[]';
    const delList = JSON.parse(delRaw);
    const targetIdStr = String(mkId);
    if (!delList.includes(targetIdStr)) {
      delList.push(targetIdStr);
      localStorage.setItem('STIE_LMS_DELETED_MK', JSON.stringify(delList));
    }
  } catch (e) {}

  // 2. Hapus langsung dokumen di Cloud Firestore koleksi 'mata_kuliah'
  if (isRealFirebaseConfigured() && db) {
    try {
      await deleteDoc(doc(db, "mata_kuliah", String(mkId)));
    } catch (e) {
      console.warn("Direct Firestore deleteMataKuliah warning:", e);
    }
  }

  await setLocal(STORAGE_KEYS.MK, updated);
  await logAudit(user, 'DELETE_MK', `Menghapus Mata Kuliah: ${target?.namaMk || mkId} (${target?.kodeMk || ''})`);
  return updated;
}

export async function getUsers() {
  return await getLocal(STORAGE_KEYS.USERS, INITIAL_USERS);
}

export async function createUser(userData, currentUser) {
  const list = await getLocal(STORAGE_KEYS.USERS, INITIAL_USERS);
  const currentRole = (currentUser?.role || '').toUpperCase();
  const isSuperAdmin = currentRole === 'SUPER_ADMIN' || currentRole === 'ADMIN';
  const isBaa = currentRole === 'ADMIN_AKADEMIK' || currentRole === 'AKADEMIK' || currentRole === 'BAA';

  const role = (userData.role || 'MAHASISWA').toUpperCase();

  // Validasi otoritas BAA vs Super Admin
  if (isBaa && !isSuperAdmin) {
    if (role !== 'DOSEN' && role !== 'MAHASISWA') {
      throw new Error("Bagian Akademik (BAA) hanya memiliki wewenang mengelola akun Dosen dan Mahasiswa.");
    }
  }

  // Cek duplikasi email / username / NIM
  const targetEmail = (userData.email || '').trim().toLowerCase();
  const emailExists = list.some(u => (u.email || '').trim().toLowerCase() === targetEmail);
  if (emailExists) {
    throw new Error(`Email ${userData.email} sudah terdaftar dalam sistem.`);
  }

  const newUid = `user-${role.toLowerCase()}-${Date.now()}`;
  const defaultPassword = role === 'DOSEN' ? 'dosen123' : 'stienas2026';
  const newUser = {
    uid: newUid,
    id: newUid,
    name: (userData.name || 'Pengguna Baru').trim(),
    email: targetEmail,
    username: (userData.username || targetEmail.split('@')[0] || newUid).trim(),
    password: userData.password ? userData.password.trim() : defaultPassword,
    role: role,
    nim: role === 'MAHASISWA' ? (userData.nim ? String(userData.nim).replace(/\D/g, '') : '') : '',
    nidn: role === 'DOSEN' ? (userData.nidn ? String(userData.nidn).trim() : '') : '',
    angkatan: role === 'MAHASISWA' ? (userData.angkatan ? Number(userData.angkatan) : 2026) : null,
    prodiId: userData.prodiId || 'prodi-s1-manajemen',
    phone: (userData.phone || '').trim(),
    isActive: userData.isActive !== undefined ? userData.isActive : true,
    avatarUrl: userData.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&background=1e3a8a&color=fff`,
    createdAt: new Date().toISOString()
  };

  // Bersihkan dari daftar terhapus jika pernah tercatat
  try {
    const delRaw = localStorage.getItem('STIE_LMS_DELETED_USERS');
    if (delRaw) {
      const delList = JSON.parse(delRaw).filter(id => id !== newUid && id !== newUser.email);
      localStorage.setItem('STIE_LMS_DELETED_USERS', JSON.stringify(delList));
    }
  } catch (e) {}

  // Direct Firestore write attempt jika online
  if (isRealFirebaseConfigured() && db) {
    try {
      const cleanFbDoc = JSON.parse(JSON.stringify(newUser));
      await setDoc(doc(db, "users", newUid), cleanFbDoc, { merge: true });
    } catch (e) {
      console.warn("Direct Firestore createUser setDoc warning (data tetap tersimpan di lokal):", e);
    }
  }

  // Sisipkan di posisi pertama agar langsung muncul di paling atas tabel
  list.unshift(newUser);
  await setLocal(STORAGE_KEYS.USERS, list);
  await logAudit(
    currentUser, 
    'CREATE_USER', 
    `Menambahkan akun baru: ${newUser.name} (${newUser.email}) sebagai ${newUser.role}`
  );
  return newUser;
}

export async function updateUser(uid, userData, currentUser) {
  const list = await getLocal(STORAGE_KEYS.USERS, INITIAL_USERS);
  const target = list.find(u => u.uid === uid || u.id === uid);
  if (!target) throw new Error("Pengguna tidak ditemukan.");

  const currentRole = (currentUser?.role || '').toUpperCase();
  const isSuperAdmin = currentRole === 'SUPER_ADMIN' || currentRole === 'ADMIN';
  const isBaa = currentRole === 'ADMIN_AKADEMIK' || currentRole === 'AKADEMIK' || currentRole === 'BAA';

  // Proteksi hak akses BAA
  if (isBaa && !isSuperAdmin) {
    const targetRole = (target.role || '').toUpperCase();
    if (targetRole === 'SUPER_ADMIN' || targetRole === 'ADMIN_AKADEMIK') {
      throw new Error("Bagian Akademik (BAA) tidak diizinkan mengubah akun Administrator atau sesama BAA.");
    }
    if (userData.role && (userData.role || '').toUpperCase() !== 'DOSEN' && (userData.role || '').toUpperCase() !== 'MAHASISWA') {
      throw new Error("Bagian Akademik (BAA) hanya dapat mengatur peran Dosen atau Mahasiswa.");
    }
  }

  const cleanUserData = { ...userData };
  if (cleanUserData.role) {
    cleanUserData.role = (cleanUserData.role || '').toUpperCase();
  }
  if (cleanUserData.nim !== undefined) {
    cleanUserData.nim = String(cleanUserData.nim || '').replace(/\D/g, '');
  }
  if (!cleanUserData.password || cleanUserData.password.trim() === '') {
    delete cleanUserData.password;
  } else {
    cleanUserData.password = cleanUserData.password.trim();
  }

  // Update langsung ke Firestore jika online
  if (isRealFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, "users", String(uid)), cleanUserData, { merge: true });
    } catch (e) {
      console.warn("Direct Firestore updateUser setDoc warning:", e);
    }
  }

  const updated = list.map(u => {
    if (u.uid === uid || u.id === uid) {
      return {
        ...u,
        ...cleanUserData,
        uid: u.uid || uid,
        id: u.id || uid
      };
    }
    return u;
  });

  await setLocal(STORAGE_KEYS.USERS, updated);
  await logAudit(
    currentUser, 
    'UPDATE_USER', 
    `Memperbarui profil akun: ${target.name} (${target.email})${cleanUserData.password ? ' [Termasuk Reset Kata Sandi]' : ''}`
  );
  return updated;
}

export async function deleteUser(uid, currentUser) {
  const list = await getLocal(STORAGE_KEYS.USERS, INITIAL_USERS);
  const target = list.find(u => u.uid === uid || u.id === uid);
  if (!target) throw new Error("Pengguna tidak ditemukan.");

  if (target.uid === currentUser?.uid || target.id === currentUser?.uid) {
    throw new Error("Anda tidak dapat menghapus akun Anda sendiri.");
  }

  const currentRole = (currentUser?.role || '').toUpperCase();
  const isSuperAdmin = currentRole === 'SUPER_ADMIN' || currentRole === 'ADMIN';
  const isBaa = currentRole === 'ADMIN_AKADEMIK' || currentRole === 'AKADEMIK' || currentRole === 'BAA';

  // Proteksi hak akses BAA
  if (isBaa && !isSuperAdmin) {
    const targetRole = (target.role || '').toUpperCase();
    if (targetRole === 'SUPER_ADMIN' || targetRole === 'ADMIN_AKADEMIK') {
      throw new Error("Bagian Akademik (BAA) tidak diizinkan menghapus akun Administrator atau sesama BAA.");
    }
  }

  // Tandai di STIE_LMS_DELETED_USERS agar tidak dibangkitkan kembali oleh Firestore getLocal
  try {
    const delRaw = localStorage.getItem('STIE_LMS_DELETED_USERS') || '[]';
    const delList = JSON.parse(delRaw);
    if (!delList.includes(uid)) {
      delList.push(uid);
      localStorage.setItem('STIE_LMS_DELETED_USERS', JSON.stringify(delList));
    }
  } catch (e) {}

  if (isRealFirebaseConfigured() && db) {
    try {
      await deleteDoc(doc(db, "users", String(uid)));
    } catch (e) {
      console.warn("Direct Firestore deleteUser deleteDoc warning:", e);
    }
  }

  const updated = list.filter(u => u.uid !== uid && u.id !== uid);
  await setLocal(STORAGE_KEYS.USERS, updated);

  // Bersihkan juga mahasiswa dari seluruh kelas perkuliahan (enrolledStudents, grades, attendances)
  try {
    const classList = await getLocal(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    let classModified = false;
    classList.forEach(c => {
      if (Array.isArray(c.enrolledStudents) && c.enrolledStudents.includes(uid)) {
        c.enrolledStudents = c.enrolledStudents.filter(id => id !== uid);
        classModified = true;
      }
      if (c.grades && c.grades[uid]) {
        delete c.grades[uid];
        classModified = true;
      }
    });
    if (classModified) {
      await setLocal(STORAGE_KEYS.CLASSES, classList);
    }
  } catch (e) {
    console.warn("Clean classes on deleteUser error:", e);
  }

  await logAudit(
    currentUser, 
    'DELETE_USER', 
    `Menghapus akun: ${target.name} (${target.email} - ${target.role})`
  );
  return updated;
}

export async function resetUserPassword(uid, newPassword, currentUser) {
  const list = await getLocal(STORAGE_KEYS.USERS, INITIAL_USERS);
  const target = list.find(u => u.uid === uid);
  if (!target) throw new Error("Pengguna tidak ditemukan.");

  const currentRole = (currentUser?.role || '').toUpperCase();
  const isSuperAdmin = currentRole === 'SUPER_ADMIN' || currentRole === 'ADMIN';
  const isBaa = currentRole === 'ADMIN_AKADEMIK' || currentRole === 'AKADEMIK' || currentRole === 'BAA';

  // Proteksi hak akses BAA
  if (isBaa && !isSuperAdmin) {
    if (target.role === 'SUPER_ADMIN' || target.role === 'ADMIN_AKADEMIK') {
      throw new Error("Bagian Akademik (BAA) tidak diizinkan mereset kata sandi Administrator.");
    }
  }

  const passwordToSet = (newPassword && newPassword.trim()) || 'stienas2026';
  const updated = list.map(u => {
    if (u.uid === uid) {
      return { ...u, password: passwordToSet };
    }
    return u;
  });

  await setLocal(STORAGE_KEYS.USERS, updated);
  await logAudit(
    currentUser, 
    'RESET_PASSWORD', 
    `Mereset kata sandi akun: ${target.name} (${target.email})`
  );
  return passwordToSet;
}

export async function registerStudent(studentData) {
  const list = await getLocal(STORAGE_KEYS.USERS, INITIAL_USERS);
  const emailClean = (studentData.email || '').trim().toLowerCase();

  const exists = list.some(u => u.email?.toLowerCase() === emailClean);
  if (exists) {
    throw new Error(`Email ${studentData.email} sudah terdaftar. Silakan gunakan email lain atau langsung masuk.`);
  }

  const newUid = `user-mhs-${Date.now()}`;
  const newStudent = {
    uid: newUid,
    name: studentData.name || 'Mahasiswa Baru',
    email: emailClean,
    username: emailClean.split('@')[0],
    password: (studentData.password && studentData.password.trim()) || 'mhs2026',
    role: 'MAHASISWA',
    nim: studentData.nim ? String(studentData.nim).replace(/\D/g, '') : `261011${Math.floor(100 + Math.random() * 900)}`,
    angkatan: studentData.angkatan || 2026,
    prodiId: studentData.prodiId || 'prodi-s1-manajemen',
    phone: studentData.phone || '',
    isActive: true,
    avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(studentData.name)}&background=1e3a8a&color=fff`,
    createdAt: new Date().toISOString()
  };

  list.push(newStudent);
  await setLocal(STORAGE_KEYS.USERS, list);
  await logAudit(
    newStudent, 
    'REGISTER_STUDENT', 
    `Mahasiswa mendaftar mandiri: ${newStudent.name} (${newStudent.nim})`
  );
  return newStudent;
}

export async function toggleUserActive(uid, user) {
  const list = await getLocal(STORAGE_KEYS.USERS, INITIAL_USERS);
  let statusChangedTo = false;
  const target = list.find(u => u.uid === uid);
  if (!target) return list;

  const currentRole = (user?.role || '').toUpperCase();
  const isSuperAdmin = currentRole === 'SUPER_ADMIN' || currentRole === 'ADMIN';
  const isBaa = currentRole === 'ADMIN_AKADEMIK' || currentRole === 'AKADEMIK' || currentRole === 'BAA';

  if (isBaa && !isSuperAdmin && (target.role === 'SUPER_ADMIN' || target.role === 'ADMIN_AKADEMIK')) {
    throw new Error("Bagian Akademik (BAA) tidak diizinkan mengubah status Administrator.");
  }

  const updated = list.map(u => {
    if (u.uid === uid) {
      statusChangedTo = !u.isActive;
      return { ...u, isActive: !u.isActive };
    }
    return u;
  });
  await setLocal(STORAGE_KEYS.USERS, updated);
  await logAudit(user, 'TOGGLE_USER_STATUS', `Mengubah status user ${target.name} menjadi ${statusChangedTo ? 'AKTIF' : 'NON-AKTIF'}`);
  return updated;
}

export async function batchImportData(type, items, user) {
  if (type === 'MATA_KULIAH') {
    const current = await getLocal(STORAGE_KEYS.MK, INITIAL_MK);
    const updated = [...current, ...items.map(i => ({ ...i, id: i.id || `mk-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` }))];
    await setLocal(STORAGE_KEYS.MK, updated);
  } else if (type === 'DOSEN' || type === 'MAHASISWA') {
    const current = await getLocal(STORAGE_KEYS.USERS, INITIAL_USERS);
    const updated = [...current, ...items.map(i => ({ 
      ...i, 
      nim: type === 'MAHASISWA' && i.nim ? String(i.nim).replace(/\D/g, '') : i.nim,
      uid: i.uid || `user-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      role: type === 'DOSEN' ? 'DOSEN' : 'MAHASISWA',
      isActive: true 
    }))];
    await setLocal(STORAGE_KEYS.USERS, updated);
  }
  await logAudit(user, 'BATCH_IMPORT', `Impor massal ${items.length} data tipe ${type}`);
  return true;
}

/* =========================================================================
   3. KELAS KULIAH & 16 PERTEMUAN (FR-03)
   ========================================================================= */

/**
 * Helper untuk memvalidasi apakah suatu kelas perkuliahan ditugaskan kepada Dosen tertentu oleh BAA
 */
export function isClassAssignedToLecturer(cls, lecturer, mks = []) {
  if (!cls || !lecturer) return false;
  const lecturerUid = lecturer.uid ? String(lecturer.uid).trim() : '';
  const lecturerId = lecturer.id ? String(lecturer.id).trim() : '';
  const lecturerNidn = lecturer.nidn ? String(lecturer.nidn).trim() : '';
  const lecturerEmail = lecturer.email ? String(lecturer.email).trim().toLowerCase() : '';
  const lecturerName = lecturer.name ? String(lecturer.name).trim().toLowerCase() : '';

  const classDosenId = cls.dosenId ? String(cls.dosenId).trim() : '';
  const classDosenNidn = cls.dosenNidn ? String(cls.dosenNidn).trim() : '';
  const classDosenEmail = cls.dosenEmail ? String(cls.dosenEmail).trim().toLowerCase() : '';
  const classDosenName = cls.namaDosen ? String(cls.namaDosen).trim().toLowerCase() : '';

  // 1. Cocokkan langsung berdasarkan data pengajar di kelas
  if (classDosenId && (classDosenId === lecturerUid || classDosenId === lecturerId)) return true;
  if (lecturerNidn && (classDosenId === lecturerNidn || classDosenNidn === lecturerNidn)) return true;
  if (lecturerEmail && (classDosenId === lecturerEmail || classDosenEmail === lecturerEmail)) return true;
  if (classDosenName && lecturerName && classDosenName === lecturerName) return true;

  // 2. Cocokkan berdasarkan penugasan Mata Kuliah oleh BAA di Master Data Kurikulum
  if (Array.isArray(mks) && mks.length > 0) {
    const matchedMk = mks.find(m => 
      (cls.mataKuliahId && m.id === cls.mataKuliahId) || 
      (cls.kodeMk && m.kodeMk === cls.kodeMk)
    );
    if (matchedMk) {
      const mkDosenId = matchedMk.dosenId ? String(matchedMk.dosenId).trim() : '';
      const mkDosenNidn = matchedMk.dosenNidn ? String(matchedMk.dosenNidn).trim() : '';
      const mkDosenEmail = matchedMk.dosenEmail ? String(matchedMk.dosenEmail).trim().toLowerCase() : '';
      const mkDosenName = matchedMk.namaDosen ? String(matchedMk.namaDosen).trim().toLowerCase() : '';

      if (mkDosenId && (mkDosenId === lecturerUid || mkDosenId === lecturerId)) return true;
      if (lecturerNidn && (mkDosenId === lecturerNidn || mkDosenNidn === lecturerNidn)) return true;
      if (lecturerEmail && (mkDosenId === lecturerEmail || mkDosenEmail === lecturerEmail)) return true;
      if (mkDosenName && lecturerName && mkDosenName === lecturerName) return true;
    }
  }

  return false;
}

export async function getClasses() {
  return await getLocal(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
}

export async function getClassById(classId) {
  const list = await getLocal(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  return list.find(c => c.id === classId) || null;
}

export async function createClass(classData, user) {
  const list = await getLocal(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  const classId = `kelas-${Date.now()}`;
  
  // FR-03.2 Otomatis generate 16 pertemuan
  const meetings = generateDefault16Meetings(classData.namaMk || 'Mata Kuliah');

  const newClass = {
    id: classId,
    ...classData,
    progressPercentage: 0,
    enrolledStudents: [],
    meetings,
    grades: {},
    createdAt: new Date().toISOString()
  };

  list.push(newClass);
  // Bersihkan dari daftar kelas yang terhapus jika ID digunakan kembali
  try {
    const delRaw = localStorage.getItem('STIE_LMS_DELETED_CLASSES');
    if (delRaw) {
      const delList = JSON.parse(delRaw).filter(id => id !== String(classId));
      localStorage.setItem('STIE_LMS_DELETED_CLASSES', JSON.stringify(delList));
    }
  } catch (e) {}
  await setLocal(STORAGE_KEYS.CLASSES, list);

  await logAudit(user, 'CREATE_CLASS', `Membuka kelas ${newClass.namaMk} (${newClass.namaKelas}) dengan otomatisasi 16 pertemuan.`);
  return newClass;
}

export async function updateClass(classId, classData, user) {
  const list = await getLocal(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  const index = list.findIndex(c => c.id === classId);
  if (index === -1) throw new Error("Kelas perkuliahan tidak ditemukan");

  const currentRole = (user?.role || '').toUpperCase();
  const isSuperAdmin = currentRole === 'SUPER_ADMIN' || currentRole === 'ADMIN';
  const isBaa = currentRole === 'ADMIN_AKADEMIK' || currentRole === 'AKADEMIK' || currentRole === 'BAA';
  if (!isSuperAdmin && !isBaa) {
    throw new Error("Hanya Administrator dan BAA yang memiliki wewenang mengubah data kelas perkuliahan.");
  }

  list[index] = {
    ...list[index],
    ...classData
  };

  await setLocal(STORAGE_KEYS.CLASSES, list);

  if (isRealFirebaseConfigured() && db) {
    try {
      const classDocRef = doc(db, "kelas_kuliah", String(classId));
      await setDoc(classDocRef, list[index], { merge: true });
    } catch (e) {
      console.warn("Firestore updateClass sync error:", e);
    }
  }

  await logAudit(user, 'UPDATE_CLASS', `Memperbarui data kelas ${list[index].namaMk} (${list[index].namaKelas})`);
  return list[index];
}

export async function deleteClass(classId, user) {
  if (!classId) throw new Error("ID kelas perkuliahan tidak valid");

  const list = await getLocal(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  const target = list.find(c => String(c.id) === String(classId) || String(c.uid || '') === String(classId));
  if (!target) throw new Error("Kelas perkuliahan tidak ditemukan");

  let activeUser = user;
  if (!activeUser?.role) {
    try {
      const stored = localStorage.getItem('STIE_LMS_ACTIVE_USER');
      if (stored) activeUser = JSON.parse(stored);
    } catch (e) {}
  }

  const currentRole = (activeUser?.role || '').toUpperCase();
  const isSuperAdmin = currentRole === 'SUPER_ADMIN' || currentRole === 'ADMIN';
  const isBaa = currentRole === 'ADMIN_AKADEMIK' || currentRole === 'AKADEMIK' || currentRole === 'BAA' || isSuperAdmin;
  if (!isSuperAdmin && !isBaa) {
    throw new Error("Hanya Administrator dan Bagian Administrasi Akademik (BAA) yang memiliki wewenang menghapus kelas perkuliahan.");
  }

  // 1. Simpan ke STIE_LMS_DELETED_CLASSES agar tidak dibangkitkan kembali oleh Firestore getLocal atau re-seed
  try {
    const delRaw = localStorage.getItem('STIE_LMS_DELETED_CLASSES') || '[]';
    const delList = JSON.parse(delRaw);
    const targetIdStr = String(classId);
    if (!delList.includes(targetIdStr)) {
      delList.push(targetIdStr);
      localStorage.setItem('STIE_LMS_DELETED_CLASSES', JSON.stringify(delList));
    }
  } catch (e) {
    console.warn("LocalStorage save deleted class error:", e);
  }

  // 2. Hapus langsung dokumen di Cloud Firestore koleksi 'kelas_kuliah' (Bukan 'classes')
  if (isRealFirebaseConfigured() && db) {
    try {
      await deleteDoc(doc(db, "kelas_kuliah", String(classId)));
    } catch (e) {
      console.warn("Firestore deleteClass direct deleteDoc error:", e);
    }
  }

  // 3. Update localStorage dan kirim event sinkronisasi real-time
  const updated = list.filter(c => String(c.id) !== String(classId) && String(c.uid || '') !== String(classId));
  await setLocal(STORAGE_KEYS.CLASSES, updated);

  // 4. Catat riwayat ke Audit Logs
  await logAudit(activeUser, 'DELETE_CLASS', `Menghapus kelas perkuliahan: ${target.namaMk} (${target.namaKelas})`);
  return true;
}

export async function enrollStudent(classId, mhsId, user, options = {}) {
  const [list, mks, users] = await Promise.all([
    getLocal(STORAGE_KEYS.CLASSES, INITIAL_CLASSES),
    getLocal(STORAGE_KEYS.MK, INITIAL_MK),
    getLocal(STORAGE_KEYS.USERS, INITIAL_USERS)
  ]);
  const classItem = list.find(c => String(c.id) === String(classId) || String(c.uid || '') === String(classId));
  if (!classItem) throw new Error("Kelas perkuliahan tidak ditemukan");

  const actorRole = (user?.role || '').toUpperCase();
  const isActorAdminOrBaa = actorRole === 'SUPER_ADMIN' || actorRole === 'ADMIN' || actorRole === 'ADMIN_AKADEMIK' || actorRole === 'AKADEMIK' || actorRole === 'BAA';

  // Pengecekan kuota (Admin/BAA dapat memiliki opsi bypass kuota jika diberikan izin dispensasi)
  const currentCount = (classItem.enrolledStudents || []).length;
  const maxQuota = Number(classItem.kuota || 40);
  if (!options.bypassQuota && currentCount >= maxQuota) {
    throw new Error(`Kuota kelas telah penuh (${currentCount}/${maxQuota} mahasiswa)! Hubungi Bagian Akademik (BAA).`);
  }

  if ((classItem.enrolledStudents || []).includes(mhsId)) {
    throw new Error("Mahasiswa sudah terdaftar di kelas ini");
  }

  // Validasi Prasyarat Semester & Kesesuaian Prodi KRS Mahasiswa
  // Jika dioperasikan oleh Admin/BAA dengan dispensasi (options.bypassRestrictions atau isActorAdminOrBaa), lewati pembatasan jika opsi aktif
  const student = users.find(u => String(u.uid || u.id) === String(mhsId)) || user;
  const mk = mks.find(m => String(m.id) === String(classItem.mataKuliahId) || m.kodeMk === classItem.kodeMk);

  if (!options.bypassRestrictions && !isActorAdminOrBaa && student && mk) {
    const studentSemester = student.semester ? Number(student.semester) : (
      student.angkatan ? Math.max(1, ((2026 - Number(student.angkatan)) * 2) + 1) : 1
    );
    const courseSemester = Number(mk.semesterDefault || 1);

    if (studentSemester < courseSemester) {
      throw new Error(`Pengambilan kelas ditolak: Mata kuliah "${mk.namaMk}" dialokasikan untuk Semester ${courseSemester}. Anda saat ini berada di Semester ${studentSemester} (Angkatan ${student.angkatan || '-'}).`);
    }

    if (student.prodiId && mk.prodiId && student.prodiId !== mk.prodiId) {
      throw new Error(`Pengambilan kelas ditolak: Mata kuliah "${mk.namaMk}" dialokasikan khusus untuk Program Studi lain.`);
    }
  }

  if (!classItem.enrolledStudents) classItem.enrolledStudents = [];
  classItem.enrolledStudents.push(mhsId);
  await setLocal(STORAGE_KEYS.CLASSES, list);

  const studentLabel = student?.name ? `${student.name} (${student.nim || student.username || mhsId})` : mhsId;
  const controllerPrefix = isActorAdminOrBaa 
    ? `${actorRole === 'SUPER_ADMIN' || actorRole === 'ADMIN' ? 'Super Admin' : 'Admin BAA'} (${user?.name || 'Admin'}) mendaftarkan secara manual` 
    : 'Mahasiswa mandiri mendaftar';
  await logAudit(user, 'ENROLL_STUDENT', `${controllerPrefix} mahasiswa ${studentLabel} ke kelas ${classItem.namaMk} (${classItem.namaKelas || '-'})`);
  return classItem;
}

export async function unenrollStudent(classId, mhsId, user) {
  const [list, users] = await Promise.all([
    getLocal(STORAGE_KEYS.CLASSES, INITIAL_CLASSES),
    getLocal(STORAGE_KEYS.USERS, INITIAL_USERS)
  ]);
  const classItem = list.find(c => String(c.id) === String(classId) || String(c.uid || '') === String(classId));
  if (!classItem) throw new Error("Kelas perkuliahan tidak ditemukan");

  if (!classItem.enrolledStudents || !classItem.enrolledStudents.includes(mhsId)) {
    throw new Error("Mahasiswa tidak terdaftar dalam kelas ini");
  }

  classItem.enrolledStudents = classItem.enrolledStudents.filter(id => String(id) !== String(mhsId));
  await setLocal(STORAGE_KEYS.CLASSES, list);

  const student = users.find(u => String(u.uid || u.id) === String(mhsId));
  const studentLabel = student?.name ? `${student.name} (${student.nim || student.username || mhsId})` : mhsId;
  const actorRole = (user?.role || '').toUpperCase();
  const isActorAdmin = actorRole === 'SUPER_ADMIN' || actorRole === 'ADMIN';
  const roleName = isActorAdmin ? 'Super Admin' : (actorRole === 'DOSEN' ? 'Dosen Pengampu' : 'Admin BAA');

  await logAudit(user, 'UNENROLL_STUDENT', `${roleName} (${user?.name || 'Pengontrol'}) mengeluarkan mahasiswa ${studentLabel} dari kelas ${classItem.namaMk} (${classItem.namaKelas || '-'})`);
  return classItem;
}

export async function updateMeeting(classId, meetingNumber, updateFields, user) {
  const list = await getLocal(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  const classItem = list.find(c => c.id === classId);
  if (!classItem) throw new Error("Kelas tidak ditemukan");

  const meetingIndex = classItem.meetings.findIndex(m => m.pertemuanKe === Number(meetingNumber));
  if (meetingIndex === -1) throw new Error("Pertemuan tidak ditemukan");

  classItem.meetings[meetingIndex] = {
    ...classItem.meetings[meetingIndex],
    ...updateFields
  };

  await setLocal(STORAGE_KEYS.CLASSES, list);
  await logAudit(user, 'UPDATE_MEETING', `Memperbarui Pertemuan ${meetingNumber} kelas ${classItem.namaMk}`);
  return classItem.meetings[meetingIndex];
}

/* =========================================================================
   4. BAHAN AJAR & VIDEO MEDIA (FR-04)
   ========================================================================= */
export async function addMeetingMaterial(classId, meetingNumber, materialData, user) {
  const list = await getLocal(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  const classItem = list.find(c => c.id === classId);
  if (!classItem) throw new Error("Kelas tidak ditemukan");

  const meeting = classItem.meetings.find(m => m.pertemuanKe === Number(meetingNumber));
  if (!meeting) throw new Error("Pertemuan tidak ditemukan");

  if (!meeting.materials) meeting.materials = [];
  const newMaterial = {
    id: `mat-${Date.now()}`,
    ...materialData,
    uploadedAt: new Date().toISOString()
  };
  meeting.materials.push(newMaterial);

  await setLocal(STORAGE_KEYS.CLASSES, list);
  await logAudit(user, 'UPLOAD_MATERIAL', `Sematkan materi "${newMaterial.judul}" pada Pertemuan ${meetingNumber} kelas ${classItem.namaMk}`);
  return newMaterial;
}

export async function deleteMeetingMaterial(classId, meetingNumber, materialId, user) {
  const list = await getLocal(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  const classItem = list.find(c => c.id === classId);
  if (!classItem) throw new Error("Kelas tidak ditemukan");

  const meeting = classItem.meetings.find(m => m.pertemuanKe === Number(meetingNumber));
  if (!meeting) throw new Error("Pertemuan tidak ditemukan");

  meeting.materials = (meeting.materials || []).filter(m => m.id !== materialId);

  await setLocal(STORAGE_KEYS.CLASSES, list);
  await logAudit(user, 'DELETE_MATERIAL', `Menghapus materi ID ${materialId} pada Pertemuan ${meetingNumber} kelas ${classItem.namaMk}`);
  return true;
}

/* =========================================================================
   5. PRESENSI PERTEMUAN (FR-05)
   ========================================================================= */
export async function saveMeetingAttendance(classId, meetingNumber, attendances, user) {
  const list = await getLocal(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  const classItem = list.find(c => c.id === classId);
  if (!classItem) throw new Error("Kelas tidak ditemukan");

  const meeting = classItem.meetings.find(m => m.pertemuanKe === Number(meetingNumber));
  if (!meeting) throw new Error("Pertemuan tidak ditemukan");

  meeting.attendances = attendances;
  await setLocal(STORAGE_KEYS.CLASSES, list);
  await logAudit(user, 'INPUT_ATTENDANCE', `Input presensi pertemuan ${meetingNumber} kelas ${classItem.namaMk}`);
  return attendances;
}

/* =========================================================================
   6. PENGUMPULAN TUGAS & PENILAIAN (FR-06)
   ========================================================================= */
export async function submitAssignment(classId, meetingNumber, submissionData, user) {
  const list = await getLocal(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  const classItem = list.find(c => c.id === classId);
  if (!classItem) throw new Error("Kelas tidak ditemukan");

  const meeting = classItem.meetings.find(m => m.pertemuanKe === Number(meetingNumber));
  if (!meeting) throw new Error("Pertemuan tidak ditemukan");

  if (!meeting.submissions) meeting.submissions = {};
  meeting.submissions[user.uid] = {
    ...submissionData,
    mahasiswaId: user.uid,
    mahasiswaName: user.name || user.email,
    nim: user.nim || user.username,
    submittedAt: new Date().toISOString()
  };

  await setLocal(STORAGE_KEYS.CLASSES, list);
  await logAudit(user, 'SUBMIT_TASK', `Mahasiswa ${user.name} mengumpulkan tugas Pertemuan ${meetingNumber}`);
  return meeting.submissions[user.uid];
}

export async function gradeSubmission(classId, meetingNumber, mhsId, nilai, feedback, user) {
  const list = await getLocal(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  const classItem = list.find(c => c.id === classId);
  if (!classItem) throw new Error("Kelas tidak ditemukan");

  const meeting = classItem.meetings.find(m => m.pertemuanKe === Number(meetingNumber));
  if (!meeting || !meeting.submissions || !meeting.submissions[mhsId]) {
    throw new Error("Pengumpulan tugas tidak ditemukan");
  }

  meeting.submissions[mhsId].nilai = Number(nilai);
  meeting.submissions[mhsId].catatanDosen = feedback;
  meeting.submissions[mhsId].gradedAt = new Date().toISOString();

  await setLocal(STORAGE_KEYS.CLASSES, list);
  await logAudit(user, 'GRADE_TASK', `Memberikan nilai ${nilai} untuk tugas mahasiswa ${mhsId} pertemuan ${meetingNumber}`);
  return meeting.submissions[mhsId];
}

/* =========================================================================
   7. BUKU NILAI OTOMATIS (GRADEBOOK) (FR-07)
   ========================================================================= */
export async function updateStudentGrade(classId, mhsId, scores, user) {
  const list = await getLocal(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  const classItem = list.find(c => c.id === classId);
  if (!classItem) throw new Error("Kelas tidak ditemukan");

  const overrideGrade = scores.overrideGrade || (scores.isOverridden ? scores.nilaiHuruf : null);

  const calculated = calculateFinalGrade(
    scores.nilaiTugas,
    scores.nilaiKuis,
    scores.nilaiUts,
    scores.nilaiUas,
    overrideGrade
  );

  const usersList = await getLocal(STORAGE_KEYS.USERS, INITIAL_USERS);
  const mhs = usersList.find(u => u.uid === mhsId) || {};

  classItem.grades[mhsId] = {
    mhsId,
    nama: mhs.name || 'Mahasiswa',
    nim: mhs.nim || mhs.username || '-',
    ...calculated
  };

  await setLocal(STORAGE_KEYS.CLASSES, list);
  await logAudit(user, 'UPDATE_GRADE', `Memperbarui nilai akhir OBE mahasiswa ${mhs.name || mhsId} di kelas ${classItem.namaMk}: ${calculated.gradeLabel || calculated.nilaiHuruf}`);
  return classItem.grades[mhsId];
}

/* =========================================================================
   8. LAPORAN SKOR KEAKTIFAN DOSEN (FR-08.1)
   Skor = (Total Materi * 2) + (Total Presensi * 1) + (Total Tugas Dinilai * 3)
   ========================================================================= */
export async function calculateLecturersActivityScores() {
  const users = await getLocal(STORAGE_KEYS.USERS, INITIAL_USERS);
  const lecturers = users.filter(u => u.role === 'DOSEN');
  const classes = await getLocal(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);

  return lecturers.map(dosen => {
    const dosenClasses = classes.filter(c => isClassAssignedToLecturer(c, dosen));
    let totalMateri = 0;
    let totalPresensi = 0;
    let totalTugasDinilai = 0;

    dosenClasses.forEach(cls => {
      (cls.meetings || []).forEach(m => {
        totalMateri += (m.materials || []).length;
        if (m.attendances && Object.keys(m.attendances).length > 0) {
          totalPresensi += 1;
        }
        if (m.submissions) {
          Object.values(m.submissions).forEach(sub => {
            if (sub.nilai !== undefined && sub.nilai !== null) {
              totalTugasDinilai += 1;
            }
          });
        }
      });
    });

    const score = (totalMateri * 2) + (totalPresensi * 1) + (totalTugasDinilai * 3);

    return {
      dosenId: dosen.uid,
      namaDosen: dosen.name,
      nidn: dosen.nidn || '-',
      email: dosen.email,
      totalKelas: dosenClasses.length,
      totalMateri,
      totalPresensi,
      totalTugasDinilai,
      totalScore: score
    };
  });
}

/* =========================================================================
   9. ATUR MEDIA PERKULIAHAN DARING PER PERTEMUAN
   ========================================================================= */
export async function updateMeetingMedia(classId, meetingNumber, mediaData, user) {
  const list = await getLocal(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  const classItem = list.find(c => c.id === classId);
  if (!classItem) throw new Error("Kelas tidak ditemukan");

  const meeting = classItem.meetings.find(m => m.pertemuanKe === Number(meetingNumber));
  if (!meeting) throw new Error("Pertemuan tidak ditemukan");

  meeting.videoType = mediaData.videoType; // 'GOOGLE_MEET' | 'ZOOM' | 'YOUTUBE' | 'MP4'
  meeting.videoUrl = mediaData.videoUrl || '';
  meeting.zoomMeetingUrl = mediaData.zoomMeetingUrl || '';
  meeting.googleMeetUrl = mediaData.googleMeetUrl || '';
  meeting.mediaTitle = mediaData.mediaTitle || '';

  await setLocal(STORAGE_KEYS.CLASSES, list);
  await logAudit(user, 'UPDATE_MEDIA', `Mengatur tautan media daring (${mediaData.videoType}) pada Pertemuan ${meetingNumber} kelas ${classItem.namaMk}`);
  return meeting;
}

/* =========================================================================
   10. SINKRONISASI DATABASE CLOUD FIRESTORE LANGSUNG (SUPER ADMIN)
   ========================================================================= */
export async function syncCollectionsToLiveFirestore(onProgress) {
  if (!db) {
    throw new Error("Objek database Firestore belum terinisialisasi. Periksa kredensial Firebase Anda.");
  }

  const batch = writeBatch(db);
  const logs = [];

  const updateStatus = (msg) => {
    logs.push(msg);
    if (onProgress) onProgress(msg, logs);
  };

  updateStatus("Memulai proses sinkronisasi koleksi ke Cloud Firestore...");

  // 1. Users
  const users = await getLocal(STORAGE_KEYS.USERS, INITIAL_USERS);
  for (const u of users) {
    const userRef = doc(db, "users", u.uid);
    batch.set(userRef, {
      uid: u.uid,
      name: u.name,
      email: u.email,
      role: u.role,
      username: u.username || '',
      nim: u.nim || '',
      nidn: u.nidn || '',
      isActive: u.isActive !== false,
      createdAt: serverTimestamp()
    }, { merge: true });
  }
  updateStatus(`Menyiapkan ${users.length} dokumen koleksi 'users'...`);

  // 2. Tahun Akademik
  const tas = await getLocal(STORAGE_KEYS.TA, INITIAL_TA);
  for (const t of tas) {
    const taRef = doc(db, "tahun_akademik", t.id);
    batch.set(taRef, t, { merge: true });
  }
  updateStatus(`Menyiapkan ${tas.length} dokumen koleksi 'tahun_akademik'...`);

  // 3. Prodi
  const prodis = await getLocal(STORAGE_KEYS.PRODI, INITIAL_PRODI);
  for (const p of prodis) {
    const prodiRef = doc(db, "prodi", p.id);
    batch.set(prodiRef, p, { merge: true });
  }
  updateStatus(`Menyiapkan ${prodis.length} dokumen koleksi 'prodi'...`);

  // 4. Mata Kuliah
  const mks = await getLocal(STORAGE_KEYS.MK, INITIAL_MK);
  for (const m of mks) {
    const mkRef = doc(db, "mata_kuliah", m.id);
    batch.set(mkRef, m, { merge: true });
  }
  updateStatus(`Menyiapkan ${mks.length} dokumen koleksi 'mata_kuliah'...`);

  // 5. Kelas Kuliah
  const classes = await getLocal(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  for (const c of classes) {
    const classRef = doc(db, "kelas_kuliah", c.id);
    batch.set(classRef, {
      id: c.id,
      mataKuliahId: c.mataKuliahId,
      namaMk: c.namaMk,
      kodeMk: c.kodeMk,
      sks: c.sks,
      namaKelas: c.namaKelas,
      dosenId: c.dosenId,
      namaDosen: c.namaDosen,
      kuota: c.kuota || 40,
      status: c.status || 'OPEN',
      hari: c.hari || 'Senin',
      jam: c.jam || '08:00 WITA',
      ruang: c.ruang || 'Lab',
      enrolledStudents: c.enrolledStudents || [],
      updatedAt: serverTimestamp()
    }, { merge: true });
  }
  updateStatus(`Menyiapkan ${classes.length} dokumen koleksi 'kelas_kuliah' beserta 16 pertemuan...`);

  // Eksekusi Batch Commit
  await batch.commit();
  updateStatus("✅ Commit batch ke Cloud Firestore BERHASIL! Seluruh koleksi dan data tersinkronisasi.");

  return { success: true, logs };
}

