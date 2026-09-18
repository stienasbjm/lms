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

export function getLocal(key, initial) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Storage read error:", e);
  }
  setLocal(key, initial);
  return initial;
}

export function setLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyDataChange(key, value);
  } catch (e) {
    console.warn("Storage write error:", e);
  }
}

// Inisialisasi awal localStorage
export function initializeLocalStore() {
  getLocal(STORAGE_KEYS.FAKULTAS, INITIAL_FAKULTAS);
  getLocal(STORAGE_KEYS.PRODI, INITIAL_PRODI);
  getLocal(STORAGE_KEYS.TA, INITIAL_TA);
  getLocal(STORAGE_KEYS.USERS, INITIAL_USERS);
  getLocal(STORAGE_KEYS.MK, INITIAL_MK);
  
  // Bersihkan materi dummy lama yang memiliki raw.githubusercontent.com
  const existingClasses = getLocal(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  const cleanedClasses = existingClasses.map(cls => ({
    ...cls,
    meetings: (cls.meetings || []).map(m => ({
      ...m,
      materials: (m.materials || []).filter(mat => 
        !mat.judul?.includes('Slide Materi Pertemuan 2') &&
        !(mat.fileUrl || '').includes('raw.githubusercontent.com')
      )
    }))
  }));
  setLocal(STORAGE_KEYS.CLASSES, cleanedClasses);

  getLocal(STORAGE_KEYS.LOGS, INITIAL_AUDIT_LOGS);
}
initializeLocalStore();

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

  const logs = getLocal(STORAGE_KEYS.LOGS, INITIAL_AUDIT_LOGS);
  logs.unshift(logItem);
  setLocal(STORAGE_KEYS.LOGS, logs.slice(0, 200));

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
  return getLocal(STORAGE_KEYS.LOGS, INITIAL_AUDIT_LOGS);
}

/* =========================================================================
   2. MASTER DATA (FR-02)
   ========================================================================= */
export async function getFakultas() {
  return getLocal(STORAGE_KEYS.FAKULTAS, INITIAL_FAKULTAS);
}

export async function getProdi() {
  return getLocal(STORAGE_KEYS.PRODI, INITIAL_PRODI);
}

export async function getTahunAkademik() {
  return getLocal(STORAGE_KEYS.TA, INITIAL_TA);
}

export async function setTahunAkademikActive(taId, user) {
  const list = getLocal(STORAGE_KEYS.TA, INITIAL_TA);
  const updated = list.map(item => ({
    ...item,
    isActive: item.id === taId
  }));
  setLocal(STORAGE_KEYS.TA, updated);
  await logAudit(user, 'UPDATE_TA', `Mengaktifkan Tahun Akademik ID: ${taId}`);
  return updated;
}

export async function addTahunAkademik(taData, user) {
  const list = getLocal(STORAGE_KEYS.TA, INITIAL_TA);
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
  setLocal(STORAGE_KEYS.TA, list);
  await logAudit(user, 'CREATE_TA', `Membuka/Menambahkan Semester Baru: ${newTa.namaTa} (${newTa.kodeTa})`);
  return list;
}

export async function toggleTahunAkademikStatus(taId, user) {
  const list = getLocal(STORAGE_KEYS.TA, INITIAL_TA);
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

  setLocal(STORAGE_KEYS.TA, updated);
  await logAudit(
    user, 
    willBeActive ? 'BUKA_SEMESTER' : 'TUTUP_SEMESTER', 
    `${willBeActive ? 'Membuka' : 'Menutup'} Semester / Tahun Akademik: ${targetTa.namaTa} (${targetTa.kodeTa})`
  );
  return updated;
}

export async function deleteTahunAkademik(taId, user) {
  const list = getLocal(STORAGE_KEYS.TA, INITIAL_TA);
  const target = list.find(t => t.id === taId);
  const updated = list.filter(t => t.id !== taId);
  setLocal(STORAGE_KEYS.TA, updated);
  await logAudit(user, 'DELETE_TA', `Menghapus Semester: ${target?.namaTa || taId}`);
  return updated;
}

export async function getMataKuliah() {
  return getLocal(STORAGE_KEYS.MK, INITIAL_MK);
}

export async function addMataKuliah(mkData, user) {
  const list = getLocal(STORAGE_KEYS.MK, INITIAL_MK);
  const newMk = {
    ...mkData,
    id: `mk-${Date.now()}`
  };
  list.push(newMk);
  setLocal(STORAGE_KEYS.MK, list);
  await logAudit(user, 'CREATE_MK', `Menambahkan Mata Kuliah ${newMk.kodeMk} - ${newMk.namaMk}`);
  return newMk;
}

export async function updateMataKuliah(mkId, updatedData, user) {
  const list = getLocal(STORAGE_KEYS.MK, INITIAL_MK);
  const updated = list.map(item => {
    if (item.id === mkId) {
      return { ...item, ...updatedData };
    }
    return item;
  });
  setLocal(STORAGE_KEYS.MK, updated);
  await logAudit(user, 'UPDATE_MK', `Memperbarui Mata Kuliah ${updatedData.kodeMk || ''} - ${updatedData.namaMk || ''}`);
  return updated;
}

export async function deleteMataKuliah(mkId, user) {
  const list = getLocal(STORAGE_KEYS.MK, INITIAL_MK);
  const target = list.find(m => m.id === mkId);
  const updated = list.filter(m => m.id !== mkId);
  setLocal(STORAGE_KEYS.MK, updated);
  await logAudit(user, 'DELETE_MK', `Menghapus Mata Kuliah: ${target?.namaMk || mkId} (${target?.kodeMk || ''})`);
  return updated;
}

export async function getUsers() {
  return getLocal(STORAGE_KEYS.USERS, INITIAL_USERS);
}

export async function createUser(userData, currentUser) {
  const list = getLocal(STORAGE_KEYS.USERS, INITIAL_USERS);
  const currentRole = (currentUser?.role || '').toUpperCase();
  const isSuperAdmin = currentRole === 'SUPER_ADMIN' || currentRole === 'ADMIN';
  const isBaa = currentRole === 'ADMIN_AKADEMIK' || currentRole === 'AKADEMIK' || currentRole === 'BAA';

  // Validasi otoritas BAA vs Super Admin
  if (isBaa && !isSuperAdmin) {
    if (userData.role !== 'DOSEN' && userData.role !== 'MAHASISWA') {
      throw new Error("Bagian Akademik (BAA) hanya memiliki wewenang mengelola akun Dosen dan Mahasiswa.");
    }
  }

  // Cek duplikasi email / username / NIM
  const emailExists = list.some(u => u.email?.toLowerCase() === (userData.email || '').trim().toLowerCase());
  if (emailExists) {
    throw new Error(`Email ${userData.email} sudah terdaftar dalam sistem.`);
  }

  const newUid = `user-${userData.role.toLowerCase()}-${Date.now()}`;
  const newUser = {
    uid: newUid,
    name: userData.name || 'Pengguna Baru',
    email: userData.email,
    username: userData.username || userData.email.split('@')[0],
    password: userData.password ? userData.password.trim() : 'stienas2026',
    role: userData.role,
    nim: userData.role === 'MAHASISWA' ? (userData.nim || '') : undefined,
    nidn: userData.role === 'DOSEN' ? (userData.nidn || '') : undefined,
    angkatan: userData.angkatan || undefined,
    prodiId: userData.prodiId || undefined,
    phone: userData.phone || '',
    isActive: userData.isActive !== undefined ? userData.isActive : true,
    avatarUrl: userData.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=1e3a8a&color=fff`,
    createdAt: new Date().toISOString()
  };

  list.push(newUser);
  setLocal(STORAGE_KEYS.USERS, list);
  await logAudit(
    currentUser, 
    'CREATE_USER', 
    `Menambahkan akun baru: ${newUser.name} (${newUser.email}) sebagai ${newUser.role}`
  );
  return newUser;
}

export async function updateUser(uid, userData, currentUser) {
  const list = getLocal(STORAGE_KEYS.USERS, INITIAL_USERS);
  const target = list.find(u => u.uid === uid);
  if (!target) throw new Error("Pengguna tidak ditemukan.");

  const currentRole = (currentUser?.role || '').toUpperCase();
  const isSuperAdmin = currentRole === 'SUPER_ADMIN' || currentRole === 'ADMIN';
  const isBaa = currentRole === 'ADMIN_AKADEMIK' || currentRole === 'AKADEMIK' || currentRole === 'BAA';

  // Proteksi hak akses BAA
  if (isBaa && !isSuperAdmin) {
    if (target.role === 'SUPER_ADMIN' || target.role === 'ADMIN_AKADEMIK') {
      throw new Error("Bagian Akademik (BAA) tidak diizinkan mengubah akun Administrator atau sesama BAA.");
    }
    if (userData.role && userData.role !== 'DOSEN' && userData.role !== 'MAHASISWA') {
      throw new Error("Bagian Akademik (BAA) hanya dapat mengatur peran Dosen atau Mahasiswa.");
    }
  }

  const cleanUserData = { ...userData };
  if (!cleanUserData.password || cleanUserData.password.trim() === '') {
    delete cleanUserData.password;
  } else {
    cleanUserData.password = cleanUserData.password.trim();
  }

  const updated = list.map(u => {
    if (u.uid === uid) {
      return {
        ...u,
        ...cleanUserData,
        uid: u.uid // Jangan ubah uid
      };
    }
    return u;
  });

  setLocal(STORAGE_KEYS.USERS, updated);
  await logAudit(
    currentUser, 
    'UPDATE_USER', 
    `Memperbarui profil akun: ${target.name} (${target.email})${cleanUserData.password ? ' [Termasuk Reset Kata Sandi]' : ''}`
  );
  return updated;
}

export async function deleteUser(uid, currentUser) {
  const list = getLocal(STORAGE_KEYS.USERS, INITIAL_USERS);
  const target = list.find(u => u.uid === uid);
  if (!target) throw new Error("Pengguna tidak ditemukan.");

  if (target.uid === currentUser?.uid) {
    throw new Error("Anda tidak dapat menghapus akun Anda sendiri.");
  }

  const currentRole = (currentUser?.role || '').toUpperCase();
  const isSuperAdmin = currentRole === 'SUPER_ADMIN' || currentRole === 'ADMIN';
  const isBaa = currentRole === 'ADMIN_AKADEMIK' || currentRole === 'AKADEMIK' || currentRole === 'BAA';

  // Proteksi hak akses BAA
  if (isBaa && !isSuperAdmin) {
    if (target.role === 'SUPER_ADMIN' || target.role === 'ADMIN_AKADEMIK') {
      throw new Error("Bagian Akademik (BAA) tidak diizinkan menghapus akun Administrator atau sesama BAA.");
    }
  }

  const updated = list.filter(u => u.uid !== uid);
  setLocal(STORAGE_KEYS.USERS, updated);
  await logAudit(
    currentUser, 
    'DELETE_USER', 
    `Menghapus akun: ${target.name} (${target.email} - ${target.role})`
  );
  return updated;
}

export async function resetUserPassword(uid, newPassword, currentUser) {
  const list = getLocal(STORAGE_KEYS.USERS, INITIAL_USERS);
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

  setLocal(STORAGE_KEYS.USERS, updated);
  await logAudit(
    currentUser, 
    'RESET_PASSWORD', 
    `Mereset kata sandi akun: ${target.name} (${target.email})`
  );
  return passwordToSet;
}

export async function registerStudent(studentData) {
  const list = getLocal(STORAGE_KEYS.USERS, INITIAL_USERS);
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
    nim: studentData.nim || `261011${Math.floor(100 + Math.random() * 900)}`,
    angkatan: studentData.angkatan || 2026,
    prodiId: studentData.prodiId || 'prodi-s1-manajemen',
    phone: studentData.phone || '',
    isActive: true,
    avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(studentData.name)}&background=1e3a8a&color=fff`,
    createdAt: new Date().toISOString()
  };

  list.push(newStudent);
  setLocal(STORAGE_KEYS.USERS, list);
  await logAudit(
    newStudent, 
    'REGISTER_STUDENT', 
    `Mahasiswa mendaftar mandiri: ${newStudent.name} (${newStudent.nim})`
  );
  return newStudent;
}

export async function toggleUserActive(uid, user) {
  const list = getLocal(STORAGE_KEYS.USERS, INITIAL_USERS);
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
  setLocal(STORAGE_KEYS.USERS, updated);
  await logAudit(user, 'TOGGLE_USER_STATUS', `Mengubah status user ${target.name} menjadi ${statusChangedTo ? 'AKTIF' : 'NON-AKTIF'}`);
  return updated;
}

export async function batchImportData(type, items, user) {
  if (type === 'MATA_KULIAH') {
    const current = getLocal(STORAGE_KEYS.MK, INITIAL_MK);
    const updated = [...current, ...items.map(i => ({ ...i, id: i.id || `mk-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` }))];
    setLocal(STORAGE_KEYS.MK, updated);
  } else if (type === 'DOSEN' || type === 'MAHASISWA') {
    const current = getLocal(STORAGE_KEYS.USERS, INITIAL_USERS);
    const updated = [...current, ...items.map(i => ({ 
      ...i, 
      uid: i.uid || `user-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      role: type === 'DOSEN' ? 'DOSEN' : 'MAHASISWA',
      isActive: true 
    }))];
    setLocal(STORAGE_KEYS.USERS, updated);
  }
  await logAudit(user, 'BATCH_IMPORT', `Impor massal ${items.length} data tipe ${type}`);
  return true;
}

/* =========================================================================
   3. KELAS KULIAH & 16 PERTEMUAN (FR-03)
   ========================================================================= */
export async function getClasses() {
  return getLocal(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
}

export async function getClassById(classId) {
  const list = getLocal(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  return list.find(c => c.id === classId) || null;
}

export async function createClass(classData, user) {
  const list = getLocal(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
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
  setLocal(STORAGE_KEYS.CLASSES, list);

  await logAudit(user, 'CREATE_CLASS', `Membuka kelas ${newClass.namaMk} (${newClass.namaKelas}) dengan otomatisasi 16 pertemuan.`);
  return newClass;
}

export async function enrollStudent(classId, mhsId, user) {
  const list = getLocal(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  const classItem = list.find(c => c.id === classId);
  if (!classItem) throw new Error("Kelas tidak ditemukan");

  // FR-03.3 Pengecekan kuota
  if (classItem.enrolledStudents.length >= (classItem.kuota || 40)) {
    throw new Error("Kuota kelas telah penuh!");
  }

  if (classItem.enrolledStudents.includes(mhsId)) {
    throw new Error("Mahasiswa sudah terdaftar di kelas ini");
  }

  classItem.enrolledStudents.push(mhsId);
  setLocal(STORAGE_KEYS.CLASSES, list);
  await logAudit(user, 'ENROLL_STUDENT', `Mendaftarkan mahasiswa ${mhsId} ke kelas ${classItem.namaMk}`);
  return classItem;
}

export async function updateMeeting(classId, meetingNumber, updateFields, user) {
  const list = getLocal(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  const classItem = list.find(c => c.id === classId);
  if (!classItem) throw new Error("Kelas tidak ditemukan");

  const meetingIndex = classItem.meetings.findIndex(m => m.pertemuanKe === Number(meetingNumber));
  if (meetingIndex === -1) throw new Error("Pertemuan tidak ditemukan");

  classItem.meetings[meetingIndex] = {
    ...classItem.meetings[meetingIndex],
    ...updateFields
  };

  setLocal(STORAGE_KEYS.CLASSES, list);
  await logAudit(user, 'UPDATE_MEETING', `Memperbarui Pertemuan ${meetingNumber} kelas ${classItem.namaMk}`);
  return classItem.meetings[meetingIndex];
}

/* =========================================================================
   4. BAHAN AJAR & VIDEO MEDIA (FR-04)
   ========================================================================= */
export async function addMeetingMaterial(classId, meetingNumber, materialData, user) {
  const list = getLocal(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
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

  setLocal(STORAGE_KEYS.CLASSES, list);
  await logAudit(user, 'UPLOAD_MATERIAL', `Sematkan materi "${newMaterial.judul}" pada Pertemuan ${meetingNumber} kelas ${classItem.namaMk}`);
  return newMaterial;
}

export async function deleteMeetingMaterial(classId, meetingNumber, materialId, user) {
  const list = getLocal(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  const classItem = list.find(c => c.id === classId);
  if (!classItem) throw new Error("Kelas tidak ditemukan");

  const meeting = classItem.meetings.find(m => m.pertemuanKe === Number(meetingNumber));
  if (!meeting) throw new Error("Pertemuan tidak ditemukan");

  meeting.materials = (meeting.materials || []).filter(m => m.id !== materialId);

  setLocal(STORAGE_KEYS.CLASSES, list);
  await logAudit(user, 'DELETE_MATERIAL', `Menghapus materi ID ${materialId} pada Pertemuan ${meetingNumber} kelas ${classItem.namaMk}`);
  return true;
}

/* =========================================================================
   5. PRESENSI PERTEMUAN (FR-05)
   ========================================================================= */
export async function saveMeetingAttendance(classId, meetingNumber, attendances, user) {
  const list = getLocal(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  const classItem = list.find(c => c.id === classId);
  if (!classItem) throw new Error("Kelas tidak ditemukan");

  const meeting = classItem.meetings.find(m => m.pertemuanKe === Number(meetingNumber));
  if (!meeting) throw new Error("Pertemuan tidak ditemukan");

  meeting.attendances = attendances;
  setLocal(STORAGE_KEYS.CLASSES, list);
  await logAudit(user, 'INPUT_ATTENDANCE', `Input presensi pertemuan ${meetingNumber} kelas ${classItem.namaMk}`);
  return attendances;
}

/* =========================================================================
   6. PENGUMPULAN TUGAS & PENILAIAN (FR-06)
   ========================================================================= */
export async function submitAssignment(classId, meetingNumber, submissionData, user) {
  const list = getLocal(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
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

  setLocal(STORAGE_KEYS.CLASSES, list);
  await logAudit(user, 'SUBMIT_TASK', `Mahasiswa ${user.name} mengumpulkan tugas Pertemuan ${meetingNumber}`);
  return meeting.submissions[user.uid];
}

export async function gradeSubmission(classId, meetingNumber, mhsId, nilai, feedback, user) {
  const list = getLocal(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  const classItem = list.find(c => c.id === classId);
  if (!classItem) throw new Error("Kelas tidak ditemukan");

  const meeting = classItem.meetings.find(m => m.pertemuanKe === Number(meetingNumber));
  if (!meeting || !meeting.submissions || !meeting.submissions[mhsId]) {
    throw new Error("Pengumpulan tugas tidak ditemukan");
  }

  meeting.submissions[mhsId].nilai = Number(nilai);
  meeting.submissions[mhsId].catatanDosen = feedback;
  meeting.submissions[mhsId].gradedAt = new Date().toISOString();

  setLocal(STORAGE_KEYS.CLASSES, list);
  await logAudit(user, 'GRADE_TASK', `Memberikan nilai ${nilai} untuk tugas mahasiswa ${mhsId} pertemuan ${meetingNumber}`);
  return meeting.submissions[mhsId];
}

/* =========================================================================
   7. BUKU NILAI OTOMATIS (GRADEBOOK) (FR-07)
   ========================================================================= */
export async function updateStudentGrade(classId, mhsId, scores, user) {
  const list = getLocal(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
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

  const usersList = getLocal(STORAGE_KEYS.USERS, INITIAL_USERS);
  const mhs = usersList.find(u => u.uid === mhsId) || {};

  classItem.grades[mhsId] = {
    mhsId,
    nama: mhs.name || 'Mahasiswa',
    nim: mhs.nim || mhs.username || '-',
    ...calculated
  };

  setLocal(STORAGE_KEYS.CLASSES, list);
  await logAudit(user, 'UPDATE_GRADE', `Memperbarui nilai akhir OBE mahasiswa ${mhs.name || mhsId} di kelas ${classItem.namaMk}: ${calculated.gradeLabel || calculated.nilaiHuruf}`);
  return classItem.grades[mhsId];
}

/* =========================================================================
   8. LAPORAN SKOR KEAKTIFAN DOSEN (FR-08.1)
   Skor = (Total Materi * 2) + (Total Presensi * 1) + (Total Tugas Dinilai * 3)
   ========================================================================= */
export async function calculateLecturersActivityScores() {
  const users = getLocal(STORAGE_KEYS.USERS, INITIAL_USERS);
  const lecturers = users.filter(u => u.role === 'DOSEN');
  const classes = getLocal(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);

  return lecturers.map(dosen => {
    const dosenClasses = classes.filter(c => c.dosenId === dosen.uid);
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
  const list = getLocal(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  const classItem = list.find(c => c.id === classId);
  if (!classItem) throw new Error("Kelas tidak ditemukan");

  const meeting = classItem.meetings.find(m => m.pertemuanKe === Number(meetingNumber));
  if (!meeting) throw new Error("Pertemuan tidak ditemukan");

  meeting.videoType = mediaData.videoType; // 'GOOGLE_MEET' | 'ZOOM' | 'YOUTUBE' | 'MP4'
  meeting.videoUrl = mediaData.videoUrl || '';
  meeting.zoomMeetingUrl = mediaData.zoomMeetingUrl || '';
  meeting.googleMeetUrl = mediaData.googleMeetUrl || '';
  meeting.mediaTitle = mediaData.mediaTitle || '';

  setLocal(STORAGE_KEYS.CLASSES, list);
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
  const users = getLocal(STORAGE_KEYS.USERS, INITIAL_USERS);
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
  const tas = getLocal(STORAGE_KEYS.TA, INITIAL_TA);
  for (const t of tas) {
    const taRef = doc(db, "tahun_akademik", t.id);
    batch.set(taRef, t, { merge: true });
  }
  updateStatus(`Menyiapkan ${tas.length} dokumen koleksi 'tahun_akademik'...`);

  // 3. Prodi
  const prodis = getLocal(STORAGE_KEYS.PRODI, INITIAL_PRODI);
  for (const p of prodis) {
    const prodiRef = doc(db, "prodi", p.id);
    batch.set(prodiRef, p, { merge: true });
  }
  updateStatus(`Menyiapkan ${prodis.length} dokumen koleksi 'prodi'...`);

  // 4. Mata Kuliah
  const mks = getLocal(STORAGE_KEYS.MK, INITIAL_MK);
  for (const m of mks) {
    const mkRef = doc(db, "mata_kuliah", m.id);
    batch.set(mkRef, m, { merge: true });
  }
  updateStatus(`Menyiapkan ${mks.length} dokumen koleksi 'mata_kuliah'...`);

  // 5. Kelas Kuliah
  const classes = getLocal(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
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

