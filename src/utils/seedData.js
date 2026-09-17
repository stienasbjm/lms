/**
 * Seed Data Awal STIE Nasional Banjarmasin
 * Memenuhi PRD untuk pengujian instan, master data akademik, dan simulasi perkuliahan.
 */

export const INITIAL_FAKULTAS = [
  { id: 'feb', kodeFakultas: 'STIE', namaFakultas: 'STIE Nasional Banjarmasin' }
];

export const INITIAL_PRODI = [
  { id: 'prodi-s1-manajemen', kodeProdi: '61201', namaProdi: 'S1 Manajemen', jenjang: 'S1', fakultasId: 'feb' },
  { id: 'prodi-s1-akuntansi', kodeProdi: '62201', namaProdi: 'S1 Akuntansi', jenjang: 'S1', fakultasId: 'feb' }
];

export const INITIAL_TA = [
  { id: 'ta-20261', kodeTa: '20261', namaTa: '2026/2027 Ganjil', semesterTipe: 'GANJIL', isActive: true },
  { id: 'ta-20252', kodeTa: '20252', namaTa: '2025/2026 Genap', semesterTipe: 'GENAP', isActive: false }
];

export const INITIAL_USERS = [
  {
    uid: 'user-admin-1',
    email: 'admin@stienas.ac.id',
    aliasEmail: 'superadmin@stienas.ac.id',
    name: 'Administrator Sistem (Super Admin)',
    role: 'SUPER_ADMIN',
    username: 'admin',
    password: 'admin123',
    phone: '08115001234',
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    uid: 'user-admin-2',
    email: 'akademik@stienas.ac.id',
    aliasEmail: 'adminakademik@stienas.ac.id',
    name: 'Admin Bagian Akademik (BAA)',
    role: 'ADMIN_AKADEMIK',
    username: 'akademik',
    password: 'akademik123',
    phone: '08125102345',
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    uid: 'user-dosen-1',
    email: 'dosen@stienas.ac.id',
    aliasEmail: 'dosen.akuntansi@lms.stienas.ac.id',
    name: 'Dr. H. Muhammad Ramli, S.E., M.M.',
    role: 'DOSEN',
    nidn: '1105087501',
    username: 'dosen',
    password: 'dosen123',
    phone: '081348003344',
    prodiId: 'prodi-s1-akuntansi',
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  },
  {
    uid: 'user-dosen-2',
    email: 'dosen.manajemen@lms.stienas.ac.id',
    name: 'Dra. Hj. Siti Rahmah, M.Si.',
    role: 'DOSEN',
    nidn: '1112047802',
    username: '1112047802',
    password: 'dosen123',
    phone: '081348112233',
    prodiId: 'prodi-s1-manajemen',
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  {
    uid: 'user-mhs-1',
    email: 'mahasiswa@stienas.ac.id',
    aliasEmail: '221011001@lms.stienas.ac.id',
    name: 'Ahmad Fadillah',
    role: 'MAHASISWA',
    nim: '221011001',
    username: 'mahasiswa',
    password: 'mhs123',
    phone: '082155667788',
    prodiId: 'prodi-s1-manajemen',
    semester: 5,
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'
  },
  {
    uid: 'user-mhs-2',
    email: '221011002@lms.stienas.ac.id',
    name: 'Nurul Hidayah',
    role: 'MAHASISWA',
    nim: '221011002',
    username: '221011002',
    phone: '082155998877',
    prodiId: 'prodi-s1-manajemen',
    semester: 5,
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
  },
  {
    uid: 'user-mhs-3',
    email: '221011003@lms.stienas.ac.id',
    name: 'Muhammad Rifky',
    role: 'MAHASISWA',
    nim: '221011003',
    username: '221011003',
    phone: '082155112233',
    prodiId: 'prodi-s1-akuntansi',
    semester: 5,
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_MK = [
  {
    id: 'mk-mnj-301',
    kodeMk: 'MNJ301',
    namaMk: 'Manajemen Keuangan I',
    sks: 3,
    semesterDefault: 5,
    prodiId: 'prodi-s1-manajemen',
    dosenId: 'user-dosen-2',
    kurikulum: 'Kurikulum OBE (Outcome-Based Education)',
    cpl: ['CPL-1 (Etika & Sikap)', 'CPL-2 (Konsep Teori Finansial)', 'CPL-3 (Analisis Keputusan Bisnis)'],
    cpmk: [
      'CPMK-1: Menguasai prinsip nilai waktu uang dan analisis rasio keuangan',
      'CPMK-2: Mampu merumuskan penganggaran modal investasi (Capital Budgeting)',
      'CPMK-3: Mampu mengelola struktur modal dan manajemen risiko portofolio'
    ]
  },
  {
    id: 'mk-akt-202',
    kodeMk: 'AKT202',
    namaMk: 'Pengantar Akuntansi II',
    sks: 3,
    semesterDefault: 3,
    prodiId: 'prodi-s1-akuntansi',
    dosenId: 'user-dosen-1',
    kurikulum: 'Kurikulum OBE (Outcome-Based Education)',
    cpl: ['CPL-1 (Integritas Profesi)', 'CPL-2 (Standar Akuntansi SAK)', 'CPL-3 (Pelaporan Keuangan)'],
    cpmk: [
      'CPMK-1: Mampu mencatat transaksi liabilitas dan ekuitas korporasi sesuai SAK',
      'CPMK-2: Mampu menyusun laporan arus kas dan rekonsiliasi bank',
      'CPMK-3: Mampu menganalisis pos-pos pelaporan keuangan dan pengungkapan'
    ]
  },
  {
    id: 'mk-sta-201',
    kodeMk: 'STA201',
    namaMk: 'Statistika Ekonomi & Bisnis',
    sks: 3,
    semesterDefault: 3,
    prodiId: 'prodi-s1-manajemen',
    dosenId: 'user-dosen-2',
    kurikulum: 'Kurikulum OBE (Outcome-Based Education)',
    cpl: ['CPL-2 (Kuantitatif & Data Analitik)', 'CPL-4 (Pengambilan Keputusan Manajerial)'],
    cpmk: [
      'CPMK-1: Mampu mengolah data statistik deskriptif dan probabilitas bisnis',
      'CPMK-2: Mampu melakukan uji hipotesis dan estimasi regresi data ekonomi'
    ]
  },
  {
    id: 'mk-sim-401',
    kodeMk: 'SIM401',
    namaMk: 'Sistem Informasi Manajemen',
    sks: 3,
    semesterDefault: 5,
    prodiId: 'prodi-s1-manajemen',
    dosenId: 'user-dosen-1',
    kurikulum: 'Kurikulum OBE (Outcome-Based Education)',
    cpl: ['CPL-2 (Teknologi Informasi & Data)', 'CPL-4 (Transformasi Digital Bisnis)'],
    cpmk: [
      'CPMK-1: Mampu merancang alur sistem informasi manajemen korporasi',
      'CPMK-2: Mampu mengevaluasi tata kelola enterprise resource planning (ERP)'
    ]
  }
];

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
    let subCpmk = `Sub-CPMK ${i}: Mampu menganalisis konsep teoritis dan studi kasus bisnis modul ${i} secara sistematis.`;

    if (i === 8) {
      judul = `Pertemuan 8: Evaluasi Tengah Semester (UTS - Asesmen CPMK 1 & 2)`;
      deskripsi = 'Evaluasi ketercapaian CPMK 1 dan CPMK 2 berbasis rubrik penilaian kinerja analitik. Pengerjaan soal studi kasus mandiri.';
      subCpmk = 'Asesmen Ketercapaian CPMK-1 & CPMK-2 (Evaluasi Tengah Semester)';
      isExam = true;
      examType = 'UTS';
    } else if (i === 16) {
      judul = `Pertemuan 16: Evaluasi Akhir Semester (UAS - Asesmen Komprehensif OBE)`;
      deskripsi = 'Evaluasi komprehensif luaran pembelajaran mencakup seluruh CPMK (CPMK-1, CPMK-2, CPMK-3). Portofolio evaluasi akhir semester.';
      subCpmk = 'Asesmen Komprehensif Seluruh CPMK & Pemenuhan CPL (Evaluasi Akhir Semester)';
      isExam = true;
      examType = 'UAS';
    } else if (i < 8) {
      judul = `Pertemuan ${i}: Pokok Bahasan Teori & Konsep ${i}`;
      deskripsi = `Pembahasan modul ajar pertemuan ke-${i} berbasis kurikulum OBE. Mahasiswa mengunduh modul RPS, menyimak penjelasan, dan mengisi presensi.`;
    } else {
      judul = `Pertemuan ${i}: Analisis Kasus & Implementasi ${i}`;
      deskripsi = `Pendalaman materi aplikatif dan studi kasus bisnis pertemuan ke-${i} berbasis rubrik OBE. Dilengkapi dengan lembar tugas studi kasus mandiri.`;
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
          id: `mat-1-1`,
          judul: `RPS Kurikulum OBE & Silabus (Link Drive)`,
          fileUrl: 'https://drive.google.com/drive/folders/stie-nasional-lms',
          isLink: true,
          isGoogleDrive: true,
          uploadedAt: new Date().toISOString()
        }
      ] : [],
      hasTask: i % 2 !== 0 && !isExam,
      taskTitle: i % 2 !== 0 && !isExam ? `Tugas Analisis Studi Kasus OBE Pertemuan ${i}` : '',
      taskDeadline: new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    });
  }
  return meetings;
}

export const INITIAL_CLASSES = [
  {
    id: 'kelas-mnj-301-a',
    mataKuliahId: 'mk-mnj-301',
    namaMk: 'Manajemen Keuangan I',
    kodeMk: 'MNJ301',
    sks: 3,
    tahunAkademikId: 'ta-20261',
    namaTa: '2026/2027 Ganjil',
    dosenId: 'user-dosen-2',
    namaDosen: 'Dra. Hj. Siti Rahmah, M.Si.',
    namaKelas: 'A',
    ruang: 'Lab Keuangan 201',
    hari: 'Senin',
    jam: '08:00 - 10:30 WITA',
    kuota: 40,
    status: 'OPEN',
    progressPercentage: 25,
    enrolledStudents: ['user-mhs-1', 'user-mhs-2'],
    meetings: generateDefault16Meetings('Manajemen Keuangan I'),
    grades: {
      'user-mhs-1': {
        mhsId: 'user-mhs-1',
        nama: 'Ahmad Fadillah',
        nim: '221011001',
        nilaiTugas: 85,
        nilaiKuis: 80,
        nilaiUts: 88,
        nilaiUas: 90,
        nilaiAkhir: 86.9,
        nilaiHuruf: 'A'
      },
      'user-mhs-2': {
        mhsId: 'user-mhs-2',
        nama: 'Nurul Hidayah',
        nim: '221011002',
        nilaiTugas: 75,
        nilaiKuis: 78,
        nilaiUts: 72,
        nilaiUas: 80,
        nilaiAkhir: 76.3,
        nilaiHuruf: 'B+'
      }
    }
  },
  {
    id: 'kelas-akt-202-a',
    mataKuliahId: 'mk-akt-202',
    namaMk: 'Pengantar Akuntansi II',
    kodeMk: 'AKT202',
    sks: 3,
    tahunAkademikId: 'ta-20261',
    namaTa: '2026/2027 Ganjil',
    dosenId: 'user-dosen-1',
    namaDosen: 'Dr. H. Muhammad Ramli, S.E., M.M.',
    namaKelas: 'A',
    ruang: 'Ruang Teori 103',
    hari: 'Rabu',
    jam: '10:45 - 13:15 WITA',
    kuota: 35,
    status: 'OPEN',
    progressPercentage: 18,
    enrolledStudents: ['user-mhs-1', 'user-mhs-3'],
    meetings: generateDefault16Meetings('Pengantar Akuntansi II'),
    grades: {
      'user-mhs-1': {
        mhsId: 'user-mhs-1',
        nama: 'Ahmad Fadillah',
        nim: '221011001',
        nilaiTugas: 88,
        nilaiKuis: 84,
        nilaiUts: 86,
        nilaiUas: 90,
        nilaiAkhir: 87.5,
        nilaiHuruf: 'A'
      },
      'user-mhs-3': {
        mhsId: 'user-mhs-3',
        nama: 'Muhammad Rifky',
        nim: '221011003',
        nilaiTugas: 90,
        nilaiKuis: 85,
        nilaiUts: 82,
        nilaiUas: 88,
        nilaiAkhir: 86.15,
        nilaiHuruf: 'A'
      }
    }
  },
  {
    id: 'kelas-sta-201-a',
    mataKuliahId: 'mk-sta-201',
    namaMk: 'Statistika Ekonomi & Bisnis',
    kodeMk: 'STA201',
    sks: 3,
    tahunAkademikId: 'ta-20261',
    namaTa: '2026/2027 Ganjil',
    dosenId: 'user-dosen-2',
    namaDosen: 'Dra. Hj. Siti Rahmah, M.Si.',
    namaKelas: 'A',
    ruang: 'Lab Statistik 204',
    hari: 'Kamis',
    jam: '08:00 - 10:30 WITA',
    kuota: 40,
    status: 'OPEN',
    progressPercentage: 30,
    enrolledStudents: ['user-mhs-1', 'user-mhs-2'],
    meetings: generateDefault16Meetings('Statistika Ekonomi & Bisnis'),
    grades: {
      'user-mhs-1': {
        mhsId: 'user-mhs-1',
        nama: 'Ahmad Fadillah',
        nim: '221011001',
        nilaiTugas: 82,
        nilaiKuis: 76,
        nilaiUts: 80,
        nilaiUas: 84,
        nilaiAkhir: 81.2,
        nilaiHuruf: 'B+'
      }
    }
  },
  {
    id: 'kelas-eko-102-b',
    mataKuliahId: 'mk-eko-102',
    namaMk: 'Pengantar Ekonomi Makro',
    kodeMk: 'EKO102',
    sks: 3,
    tahunAkademikId: 'ta-20252',
    namaTa: '2025/2026 Genap',
    dosenId: 'user-dosen-1',
    namaDosen: 'Dr. H. Muhammad Ramli, S.E., M.M.',
    namaKelas: 'B',
    ruang: 'Ruang Teori 102',
    hari: 'Selasa',
    jam: '13:30 - 16:00 WITA',
    kuota: 35,
    status: 'CLOSED',
    progressPercentage: 100,
    enrolledStudents: ['user-mhs-1'],
    meetings: generateDefault16Meetings('Pengantar Ekonomi Makro'),
    grades: {
      'user-mhs-1': {
        mhsId: 'user-mhs-1',
        nama: 'Ahmad Fadillah',
        nim: '221011001',
        nilaiTugas: 85,
        nilaiKuis: 85,
        nilaiUts: 85,
        nilaiUas: 85,
        nilaiAkhir: 85.0,
        nilaiHuruf: 'A'
      }
    }
  }
];

export const INITIAL_AUDIT_LOGS = [
  {
    id: 'log-01',
    userId: 'user-admin-1',
    userName: 'Super Administrator LMS',
    role: 'SUPER_ADMIN',
    action: 'SYSTEM_INIT',
    details: 'Inisialisasi sistem LMS STIE Nasional Banjarmasin arsitektur Serverless Jamstack.',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'log-02',
    userId: 'user-dosen-2',
    userName: 'Dra. Hj. Siti Rahmah, M.Si.',
    role: 'DOSEN',
    action: 'CREATE_CLASS',
    details: 'Membuka kelas baru MNJ301 - Manajemen Keuangan I Kelas A dengan 16 pertemuan otomatis.',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'log-03',
    userId: 'user-dosen-2',
    userName: 'Dra. Hj. Siti Rahmah, M.Si.',
    role: 'DOSEN',
    action: 'UPDATE_GRADE',
    details: 'Memperbarui buku nilai mahasiswa Ahmad Fadillah (NIM: 221011001).',
    timestamp: new Date(Date.now() - 3600000).toISOString()
  }
];
