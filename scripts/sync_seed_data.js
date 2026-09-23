import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const cfg = {
  apiKey: 'AIzaSyDITlobzgm52tNwHUa7j5Z070DY4vJOJBw',
  authDomain: 'lms-stienas.firebaseapp.com',
  projectId: 'lms-stienas',
  storageBucket: 'lms-stienas.firebasestorage.app',
  messagingSenderId: '1039609038510',
  appId: '1:1039609038510:web:18536257413fe47b448f3f'
};

const app = initializeApp(cfg);
const db = getFirestore(app);

async function run() {
  console.log('Fetching live Firestore collections...');
  const [usersSnap, classesSnap, mkSnap, taSnap, prodiSnap, fakSnap] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'kelas_kuliah')),
    getDocs(collection(db, 'mata_kuliah')),
    getDocs(collection(db, 'tahun_akademik')),
    getDocs(collection(db, 'prodi')),
    getDocs(collection(db, 'fakultas'))
  ]);

  const users = usersSnap.docs.map(d => {
    const u = d.data();
    const id = d.id;
    return {
      uid: id,
      id: id,
      email: u.email || '',
      ...(u.aliasEmail ? { aliasEmail: u.aliasEmail } : {}),
      name: u.name || '',
      role: u.role || 'MAHASISWA',
      username: u.username || (u.email ? u.email.split('@')[0] : id),
      password: u.role === 'SUPER_ADMIN' ? 'admin126' : (u.role === 'ADMIN_AKADEMIK' ? 'akademik123' : (u.role === 'DOSEN' ? 'stienas2026' : 'mhs123')),
      nim: u.nim ? String(u.nim).trim() : '',
      nidn: u.nidn ? String(u.nidn).trim() : '',
      ...(u.angkatan ? { angkatan: Number(u.angkatan) } : {}),
      ...(u.semester ? { semester: Number(u.semester) } : {}),
      ...(u.prodiId ? { prodiId: u.prodiId } : {}),
      phone: u.phone || '',
      isActive: u.isActive !== undefined ? u.isActive : true,
      avatarUrl: u.avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(u.name || 'User') + '&background=1e3a8a&color=fff'
    };
  });

  const roleOrder = { SUPER_ADMIN: 1, ADMIN_AKADEMIK: 2, DOSEN: 3, MAHASISWA: 4 };
  users.sort((a, b) => (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99));

  const fakultas = [
    { id: 'feb', kodeFakultas: 'STIE', namaFakultas: 'STIE Nasional Banjarmasin' }
  ];

  const prodi = [
    { 
      id: 'prodi-s1-manajemen', 
      kodeProdi: '61201', 
      namaProdi: 'S1 Manajemen', 
      jenjang: 'S1', 
      fakultasId: 'feb',
      namaKaprodi: 'Rizki Amalia Afriana, SE., MM.',
      nuptkKaprodi: '1102046801'
    },
    { 
      id: 'prodi-s1-akuntansi', 
      kodeProdi: '62201', 
      namaProdi: 'S1 Akuntansi', 
      jenjang: 'S1', 
      fakultasId: 'feb',
      namaKaprodi: 'Ruslidan Agustina, SE., MSA.',
      nuptkKaprodi: '1124018201'
    }
  ];

  const ta = taSnap.docs.map(d => {
    const t = d.data();
    return {
      id: d.id,
      kodeTa: t.kodeTa || d.id.replace('ta-', ''),
      namaTa: t.namaTa || (t.kodeTa === '20261' ? '2026/2027 Ganjil' : '2025/2026 Genap'),
      semesterTipe: t.semesterTipe || (t.kodeTa?.endsWith('1') ? 'GANJIL' : 'GENAP'),
      isActive: Boolean(t.isActive)
    };
  });

  const mks = mkSnap.docs.map(d => {
    const m = d.data();
    return {
      id: d.id,
      kodeMk: m.kodeMk || '',
      namaMk: m.namaMk || '',
      sks: Number(m.sks || 2),
      semesterDefault: Number(m.semesterDefault || 1),
      prodiId: m.prodiId || 'prodi-s1-manajemen',
      dosenId: m.dosenId || '',
      ...(m.cpl ? { cpl: m.cpl } : {}),
      ...(m.cpmk ? { cpmk: m.cpmk } : {})
    };
  });

  const classes = classesSnap.docs.map(d => {
    const c = d.data();
    const id = d.id;
    return {
      id: id,
      mataKuliahId: c.mataKuliahId || '',
      namaMk: c.namaMk || '',
      kodeMk: c.kodeMk || '',
      sks: Number(c.sks || 2),
      semester: Number(c.semester || 1),
      tahunAkademikId: c.tahunAkademikId || 'ta-20261',
      namaTa: c.namaTa || '2026/2027 Ganjil',
      dosenId: c.dosenId || '',
      namaDosen: c.namaDosen || '',
      dosenNidn: c.dosenNidn || '',
      dosenEmail: c.dosenEmail || '',
      namaKelas: c.namaKelas || 'A',
      ruang: c.ruang || 'Ruang Kuliah',
      hari: c.hari || 'Senin',
      jam: c.jam || '08:00 - 10:30 WITA',
      kuota: Number(c.kuota || 40),
      status: c.status || 'OPEN',
      progressPercentage: Number(c.progressPercentage || 0),
      enrolledStudents: Array.isArray(c.enrolledStudents) ? c.enrolledStudents : [],
      meetings: Array.isArray(c.meetings) && c.meetings.length > 0 ? c.meetings : [],
      grades: c.grades || {}
    };
  });

  console.log(`Summary: ${users.length} Users, ${classes.length} Classes, ${mks.length} MKs, ${ta.length} TAs`);

  const fileContent = `/**
 * Seed Data Awal STIE Nasional Banjarmasin
 * Disinkronkan langsung dari Cloud Firestore lms-stienas
 */

export const INITIAL_FAKULTAS = ${JSON.stringify(fakultas, null, 2)};

export const INITIAL_PRODI = ${JSON.stringify(prodi, null, 2)};

export const INITIAL_TA = ${JSON.stringify(ta, null, 2)};

export const INITIAL_USERS = ${JSON.stringify(users, null, 2)};

export const INITIAL_MK = ${JSON.stringify(mks, null, 2)};

/**
 * Generator 16 Pertemuan Otomatis sesuai Standar Kurikulum OBE
 */
export function generateDefault16Meetings(namaMk = 'Mata Kuliah') {
  const meetings = [];
  for (let i = 1; i <= 16; i++) {
    let judul = '';
    let deskripsi = '';
    let isExam = false;
    let examType = null;
    let subCpmk = \`Sub-CPMK \${i}: Mampu menganalisis konsep teoritis dan studi kasus bisnis modul \${i} secara sistematis.\`;

    if (i === 8) {
      judul = \`Pertemuan 8: Evaluasi Tengah Semester (UTS - Asesmen CPMK 1 & 2)\`;
      deskripsi = 'Evaluasi ketercapaian CPMK 1 dan CPMK 2 berbasis rubrik penilaian kinerja analitik. Pengerjaan soal studi kasus mandiri.';
      subCpmk = 'Asesmen Ketercapaian CPMK-1 & CPMK-2 (Evaluasi Tengah Semester)';
      isExam = true;
      examType = 'UTS';
    } else if (i === 16) {
      judul = \`Pertemuan 16: Evaluasi Akhir Semester (UAS - Asesmen Komprehensif OBE)\`;
      deskripsi = 'Evaluasi komprehensif luaran pembelajaran mencakup seluruh CPMK (CPMK-1, CPMK-2, CPMK-3). Portofolio evaluasi akhir semester.';
      subCpmk = 'Asesmen Komprehensif Seluruh CPMK & Pemenuhan CPL (Evaluasi Akhir Semester)';
      isExam = true;
      examType = 'UAS';
    } else if (i < 8) {
      judul = \`Pertemuan \${i}: Pokok Bahasan Teori & Konsep \${i}\`;
      deskripsi = \`Pembahasan modul ajar pertemuan ke-\${i} berbasis kurikulum OBE. Mahasiswa mengunduh modul RPS, menyimak penjelasan, dan mengisi presensi.\`;
    } else {
      judul = \`Pertemuan \${i}: Analisis Kasus & Implementasi \${i}\`;
      deskripsi = \`Pendalaman materi aplikatif dan studi kasus bisnis pertemuan ke-\${i} berbasis rubrik OBE. Dilengkapi dengan lembar tugas studi kasus mandiri.\`;
    }

    meetings.push({
      pertemuanKe: i,
      judul,
      deskripsi,
      subCpmk,
      indikatorObe: 'Ketepatan analisis komparatif, penguasaan metodologi, dan penalaran argumentatif (Skala 0–100)',
      tanggal: new Date(Date.now() + (i - 1) * 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      videoType: i === 1 ? 'YOUTUBE' : 'MEET',
      videoUrl: i === 1 ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' : '',
      zoomMeetingUrl: i % 2 === 0 ? 'https://meet.google.com/abc-stie-nas' : '',
      isPublished: true,
      isExam,
      examType,
      materials: i === 1 ? [
        {
          id: \`mat-1-1\`,
          judul: \`RPS Kurikulum OBE & Silabus (Link Drive)\`,
          fileUrl: 'https://drive.google.com/drive/folders/stie-nasional-lms',
          isLink: true,
          isGoogleDrive: true,
          uploadedAt: new Date().toISOString()
        }
      ] : [],
      hasTask: i % 2 !== 0 && !isExam,
      isOpen: true,
      isTaskOpen: true,
      taskTitle: i % 2 !== 0 && !isExam ? \`Tugas Analisis Studi Kasus OBE Pertemuan \${i}\` : '',
      taskDeadline: new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    });
  }
  return meetings;
}

export const INITIAL_CLASSES = ${JSON.stringify(classes, null, 2)};

export const INITIAL_AUDIT_LOGS = [];
`;

  fs.writeFileSync('./src/utils/seedData.js', fileContent, 'utf8');
  console.log('✓ Successfully synchronized live Firestore data to src/utils/seedData.js');
}

run().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
