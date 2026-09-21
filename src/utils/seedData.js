/**
 * Seed Data Awal STIE Nasional Banjarmasin
 * Memenuhi PRD untuk pengujian instan, master data akademik, dan simulasi perkuliahan.
 */

export const INITIAL_FAKULTAS = [
  { id: 'feb', kodeFakultas: 'STIE', namaFakultas: 'STIE Nasional Banjarmasin' }
];

export const INITIAL_PRODI = [
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

export const INITIAL_TA = [
  { id: 'ta-20261', kodeTa: '20261', namaTa: '2026/2027 Ganjil', semesterTipe: 'GANJIL', isActive: true },
  { id: 'ta-20252', kodeTa: '20252', namaTa: '2025/2026 Genap', semesterTipe: 'GENAP', isActive: false }
];

export const INITIAL_USERS = [
  {
    uid: 'user-admin-1',
    id: 'user-admin-1',
    email: 'admin@stienas.ac.id',
    aliasEmail: 'superadmin@stienas.ac.id',
    name: 'Administrator Sistem (Super Admin)',
    role: 'SUPER_ADMIN',
    username: 'admin',
    password: 'admin126',
    phone: '08115001234',
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    uid: 'user-admin-2',
    id: 'user-admin-2',
    email: 'akademik@stienas.ac.id',
    aliasEmail: 'adminakademik@stienas.ac.id, baa@stienas.ac.id',
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
    id: 'user-dosen-1',
    email: 'mohdaribjm@gmail.com',
    name: 'Drs. H. Mohdari, M.Si.',
    role: 'DOSEN',
    nidn: '196307041991031003',
    username: 'dosen',
    password: 'dosen123',
    phone: '081348003344',
    prodiId: 'prodi-s1-manajemen',
    isActive: true,
    avatarUrl: 'https://ui-avatars.com/api/?name=Drs.+H.+Mohdari%2C+M.Si.&background=1e3a8a&color=fff'
  },
  {
    uid: 'user-dosen-1789698585944',
    id: 'user-dosen-1789698585944',
    email: 'arief@stienas-ypb.ac.id',
    name: 'Arief Rahman, M. Pd.',
    role: 'DOSEN',
    nidn: '9248769670130333',
    username: 'arief',
    password: 'stienas2026',
    phone: '081234567890',
    prodiId: 'prodi-s1-akuntansi',
    isActive: true,
    avatarUrl: 'https://ui-avatars.com/api/?name=Arief+Rahman%2C+M.+Pd.&background=1e3a8a&color=fff'
  },
  {
    uid: 'user-dosen-1789742932417',
    id: 'user-dosen-1789742932417',
    email: 'waket1@stienas-ypb.ac.id',
    name: 'Rara Gustiana, SE., M.Ak.',
    role: 'DOSEN',
    nidn: '7436769670230283',
    username: 'waket1',
    password: 'stienas126',
    phone: '081398765432',
    prodiId: 'prodi-s1-akuntansi',
    isActive: true,
    avatarUrl: 'https://ui-avatars.com/api/?name=Rara%20Gustiana%2C%20SE.%2C%20M.Ak.&background=1e3a8a&color=fff'
  },
  {
    uid: 'user-dosen-1789782310180',
    id: 'user-dosen-1789782310180',
    email: 'mailiana.01@gmail.com',
    name: 'Mailiana, SE., MM.',
    role: 'DOSEN',
    nidn: '197505012005012003',
    username: 'mailiana.01',
    password: 'dosen123',
    phone: '081255667788',
    prodiId: 'prodi-s1-manajemen',
    isActive: true,
    avatarUrl: 'https://ui-avatars.com/api/?name=Mailiana%2C%20SE.%2C%20MM.&background=1e3a8a&color=fff'
  },
  {
    uid: 'user-dosen-2',
    id: 'user-dosen-2',
    email: 'rakhmiridhawati51@gmail.com',
    name: 'Hj. Rakhmi Ridhawati, M.Si.',
    role: 'DOSEN',
    nidn: '2437751652230112',
    username: '1112047802',
    password: 'stienas2026',
    phone: '081348112233',
    prodiId: 'prodi-s1-akuntansi',
    isActive: true,
    avatarUrl: 'https://ui-avatars.com/api/?name=Hj.+Rakhmi+Ridhawati%2C+M.Si.&background=1e3a8a&color=fff'
  },
  {
    uid: 'user-mhs-1789798197871',
    id: 'user-mhs-1789798197871',
    email: 'nadiayuni16@gmail.com',
    name: 'Nadia Yuni Tri Astika',
    role: 'MAHASISWA',
    nim: '251011152',
    angkatan: 2025,
    semester: 3,
    prodiId: 'prodi-s1-manajemen',
    username: 'nadiayuni16',
    password: 'Nadia250696',
    phone: '081234567891',
    isActive: true,
    avatarUrl: 'https://ui-avatars.com/api/?name=Nadia%20Yuni%20Tri%20Astika&background=1e3a8a&color=fff'
  },
  {
    uid: 'user-mhs-1789800818486',
    id: 'user-mhs-1789800818486',
    email: 'dellapuspita2436@gmail.com',
    name: 'Siti Della Puspita',
    role: 'MAHASISWA',
    nim: '20251111631',
    angkatan: 2025,
    semester: 3,
    prodiId: 'prodi-s1-manajemen',
    username: 'dellapuspita2436',
    password: 'dellapuspita',
    phone: '081234567892',
    isActive: true,
    avatarUrl: 'https://ui-avatars.com/api/?name=Siti%20Della%20Puspita&background=1e3a8a&color=fff'
  },
  {
    uid: 'user-mhs-1789801049377',
    id: 'user-mhs-1789801049377',
    email: 'muhammadarifzairullah@gmail.com',
    name: 'Muhammad Arif Zairullah',
    role: 'MAHASISWA',
    nim: '20251111611',
    angkatan: 2025,
    semester: 3,
    prodiId: 'prodi-s1-manajemen',
    username: 'muhammadarifzairullah',
    password: '180672',
    phone: '081234567893',
    isActive: true,
    avatarUrl: 'https://ui-avatars.com/api/?name=MUHAMMAD%20ARIF%20ZAIRULLAH&background=1e3a8a&color=fff'
  },
  {
    uid: 'user-mhs-1789801227932',
    id: 'user-mhs-1789801227932',
    email: 'ayung006@gmail.com',
    name: 'Wahyu Kurniawan',
    role: 'MAHASISWA',
    nim: '20251111600',
    angkatan: 2025,
    semester: 3,
    prodiId: 'prodi-s1-manajemen',
    username: 'ayung006',
    password: 'Wahyu1996',
    phone: '081234567894',
    isActive: true,
    avatarUrl: 'https://ui-avatars.com/api/?name=Wahyu%20Kurniawan&background=1e3a8a&color=fff'
  },
  {
    uid: 'user-mhs-1789806444944',
    id: 'user-mhs-1789806444944',
    email: 'raby79279@gmail.com',
    name: 'Rabiyah',
    role: 'MAHASISWA',
    nim: '20251111644',
    angkatan: 2025,
    semester: 3,
    prodiId: 'prodi-s1-manajemen',
    username: 'raby79279',
    password: 'Cantik124',
    phone: '08115003124',
    isActive: true,
    avatarUrl: 'https://ui-avatars.com/api/?name=Rabiyah&background=1e3a8a&color=fff'
  },
  {
    uid: 'user-mhs-1789909513563',
    id: 'user-mhs-1789909513563',
    email: 'siti@gmail.com',
    name: 'Siti Rahmah',
    role: 'MAHASISWA',
    nim: '262011547',
    angkatan: 2026,
    semester: 1,
    prodiId: 'prodi-s1-akuntansi',
    username: 'siti',
    password: 'mhs123',
    phone: '081234567895',
    isActive: true,
    avatarUrl: 'https://ui-avatars.com/api/?name=Siti%20Rahmah&background=1e3a8a&color=fff'
  }
];

export const INITIAL_MK = [
  {
    id: 'mk-1789698531514',
    kodeMk: 'MNJ 306',
    namaMk: 'Pendidikan Agama Islam',
    sks: 2,
    semesterDefault: 1,
    prodiId: 'prodi-s1-manajemen',
    dosenId: 'user-dosen-1789698585944',
    kurikulum: 'Kurikulum OBE (Outcome-Based Education)',
    cpl: ['CPL-1 (Etika & Sikap Religius)'],
    cpmk: ['CPMK-1: Mampu memahami landasan moral dan etika dalam kehidupan berbangsa dan berorganisasi']
  },
  {
    id: 'mk-1789717276799',
    kodeMk: 'MNJ210',
    namaMk: 'Database Manajemen System',
    sks: 2,
    semesterDefault: 3,
    prodiId: 'prodi-s1-manajemen',
    dosenId: 'user-dosen-1789698585944',
    kurikulum: 'Kurikulum OBE (Outcome-Based Education)',
    cpl: ['CPL-2 (Teknologi Informasi & Pengolahan Data)'],
    cpmk: ['CPMK-1: Menguasai perancangan Entity Relationship Diagram (ERD) dan Structured Query Language (SQL)']
  },
  {
    id: 'mk-1789743638747',
    kodeMk: 'AKT512',
    namaMk: 'Komputer Akuntansi',
    sks: 2,
    semesterDefault: 3,
    prodiId: 'prodi-s1-akuntansi',
    dosenId: 'user-dosen-1789742932417',
    kurikulum: 'Kurikulum OBE (Outcome-Based Education)',
    cpl: ['CPL-2 (Aplikasi Sistem Akuntansi Terkomputerisasi)'],
    cpmk: ['CPMK-1: Mengoperasikan aplikasi software komputer akuntansi untuk penyusunan laporan keuangan']
  },
  {
    id: 'mk-1789782623627',
    kodeMk: 'MNJ239',
    namaMk: 'Matematika Ekonomi',
    sks: 2,
    semesterDefault: 1,
    prodiId: 'prodi-s1-manajemen',
    dosenId: 'user-dosen-1789782310180',
    kurikulum: 'Kurikulum OBE (Outcome-Based Education)',
    cpl: ['CPL-2 (Analisis Kuantitatif Ekonomi)'],
    cpmk: ['CPMK-1: Mampu memodelkan fungsi matematis pada fungsi permintaan, penawaran, dan keseimbangan pasar']
  },
  {
    id: 'mk-mnj-101',
    kodeMk: 'MNJ101',
    namaMk: 'Pengantar Manajemen',
    sks: 3,
    semesterDefault: 1,
    prodiId: 'prodi-s1-manajemen',
    dosenId: 'user-dosen-1789782310180',
    kurikulum: 'Kurikulum OBE (Outcome-Based Education)',
    cpl: ['CPL-1 (Kepemimpinan & Etika Organisasi)', 'CPL-2 (Prinsip Dasar Manajemen Bisnis)'],
    cpmk: [
      'CPMK-1: Memahami fungsi fundamental manajemen POAC (Planning, Organizing, Actuating, Controlling)',
      'CPMK-2: Mampu menganalisis dinamika lingkungan bisnis dan pengambilan keputusan manajerial'
    ]
  },
  {
    id: 'mk-bis-101',
    kodeMk: 'BIS101',
    namaMk: 'Pengantar Bisnis & Kewirausahaan',
    sks: 3,
    semesterDefault: 1,
    prodiId: 'prodi-s1-manajemen',
    dosenId: 'user-dosen-2',
    kurikulum: 'Kurikulum OBE (Outcome-Based Education)',
    cpl: ['CPL-1 (Etika Bisnis)', 'CPL-3 (Inovasi & Model Bisnis)'],
    cpmk: [
      'CPMK-1: Menguasai ekosistem bisnis modern, kepemilikan usaha, dan tanggung jawab sosial',
      'CPMK-2: Mampu menyusun Business Model Canvas (BMC) untuk ide rintisan usaha baru'
    ]
  },
  {
    id: 'mk-akt-101',
    kodeMk: 'AKT101',
    namaMk: 'Pengantar Akuntansi I',
    sks: 3,
    semesterDefault: 1,
    prodiId: 'prodi-s1-akuntansi',
    dosenId: 'user-dosen-1',
    kurikulum: 'Kurikulum OBE (Outcome-Based Education)',
    cpl: ['CPL-1 (Integritas Profesi Akuntan)', 'CPL-2 (Siklus Akuntansi Dasar SAK)'],
    cpmk: [
      'CPMK-1: Mampu mencatat jurnal transaksi keuangan dan buku besar perusahaan jasa dan dagang',
      'CPMK-2: Mampu menyusun laporan keuangan neraca saldo dan kertas kerja penyesuaian'
    ]
  },
  {
    id: 'mk-mnj-301',
    kodeMk: 'MNJ301',
    namaMk: 'Manajemen Keuangan I',
    sks: 3,
    semesterDefault: 5,
    prodiId: 'prodi-s1-manajemen',
    dosenId: 'user-dosen-1',
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
    dosenId: 'user-dosen-1789742932417',
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
    dosenId: 'user-dosen-1',
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
    dosenId: 'user-dosen-1789742932417',
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
      isOpen: true,
      isTaskOpen: true,
      taskTitle: i % 2 !== 0 && !isExam ? `Tugas Analisis Studi Kasus OBE Pertemuan ${i}` : '',
      taskDeadline: new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    });
  }
  return meetings;
}

export const INITIAL_CLASSES = [
  {
    id: 'kelas-1789740488313',
    mataKuliahId: 'mk-1789717276799',
    namaMk: 'Database Manajemen System',
    kodeMk: 'MNJ210',
    sks: 2,
    semester: 3,
    tahunAkademikId: 'ta-20261',
    namaTa: '2026/2027 Ganjil',
    dosenId: 'user-dosen-1789698585944',
    namaDosen: 'Arief Rahman, M. Pd.',
    dosenNidn: '9248769670130333',
    dosenEmail: 'arief@stienas-ypb.ac.id',
    namaKelas: 'A',
    ruang: 'Lab Komputer 301',
    hari: 'Senin',
    jam: '10:45 - 12:15 WITA',
    kuota: 40,
    status: 'OPEN',
    progressPercentage: 20,
    enrolledStudents: [
      'user-mhs-1789798197871',
      'user-mhs-1789800818486',
      'user-mhs-1789801049377',
      'user-mhs-1789801227932',
      'user-mhs-1789806444944'
    ],
    meetings: generateDefault16Meetings('Database Manajemen System'),
    grades: {}
  },
  {
    id: 'kelas-akt-101-a',
    mataKuliahId: 'mk-akt-101',
    namaMk: 'Pengantar Akuntansi I',
    kodeMk: 'AKT101',
    sks: 3,
    semester: 1,
    tahunAkademikId: 'ta-20261',
    namaTa: '2026/2027 Ganjil',
    dosenId: 'user-dosen-1',
    namaDosen: 'Drs. H. Mohdari, M.Si.',
    dosenNidn: '196307041991031003',
    dosenEmail: 'mohdaribjm@gmail.com',
    namaKelas: 'A',
    ruang: 'Ruang Teori 103',
    hari: 'Rabu',
    jam: '08:00 - 10:30 WITA',
    kuota: 35,
    status: 'OPEN',
    progressPercentage: 10,
    enrolledStudents: ['user-mhs-1789909513563'],
    meetings: generateDefault16Meetings('Pengantar Akuntansi I'),
    grades: {}
  },
  {
    id: 'kelas-1789735769581',
    mataKuliahId: 'mk-1789698531514',
    namaMk: 'Pendidikan Agama Islam',
    kodeMk: 'MNJ 306',
    sks: 2,
    semester: 1,
    tahunAkademikId: 'ta-20261',
    namaTa: '2026/2027 Ganjil',
    dosenId: 'user-dosen-1789698585944',
    namaDosen: 'Arief Rahman, M. Pd.',
    dosenNidn: '9248769670130333',
    dosenEmail: 'arief@stienas-ypb.ac.id',
    namaKelas: 'A',
    ruang: 'Ruang Teori 104',
    hari: 'Jumat',
    jam: '08:00 - 09:30 WITA',
    kuota: 40,
    status: 'OPEN',
    progressPercentage: 10,
    enrolledStudents: ['user-mhs-1789909513563'],
    meetings: generateDefault16Meetings('Pendidikan Agama Islam'),
    grades: {}
  },
  {
    id: 'kelas-1789743726814',
    mataKuliahId: 'mk-1789743638747',
    namaMk: 'Komputer Akuntansi',
    kodeMk: 'AKT512',
    sks: 2,
    semester: 3,
    tahunAkademikId: 'ta-20261',
    namaTa: '2026/2027 Ganjil',
    dosenId: 'user-dosen-1789742932417',
    namaDosen: 'Rara Gustiana, SE., M.Ak.',
    dosenNidn: '7436769670230283',
    dosenEmail: 'waket1@stienas-ypb.ac.id',
    namaKelas: 'A',
    ruang: 'Lab Komputer 302',
    hari: 'Kamis',
    jam: '10:45 - 12:15 WITA',
    kuota: 35,
    status: 'OPEN',
    progressPercentage: 10,
    enrolledStudents: [],
    meetings: generateDefault16Meetings('Komputer Akuntansi'),
    grades: {}
  },
  {
    id: 'kelas-1789782668728',
    mataKuliahId: 'mk-1789782623627',
    namaMk: 'Matematika Ekonomi',
    kodeMk: 'MNJ239',
    sks: 2,
    semester: 1,
    tahunAkademikId: 'ta-20261',
    namaTa: '2026/2027 Ganjil',
    dosenId: 'user-dosen-1789782310180',
    namaDosen: 'Mailiana, SE., MM.',
    dosenNidn: '197505012005012003',
    dosenEmail: 'mailiana.01@gmail.com',
    namaKelas: 'NRG',
    ruang: 'Ruang Teori 105',
    hari: 'Rabu',
    jam: '10:45 - 12:15 WITA',
    kuota: 40,
    status: 'OPEN',
    progressPercentage: 10,
    enrolledStudents: ['user-mhs-1789909513563'],
    meetings: generateDefault16Meetings('Matematika Ekonomi'),
    grades: {}
  },
  {
    id: 'kelas-bis-101-a',
    mataKuliahId: 'mk-bis-101',
    namaMk: 'Pengantar Bisnis & Kewirausahaan',
    kodeMk: 'BIS101',
    sks: 3,
    semester: 1,
    tahunAkademikId: 'ta-20261',
    namaTa: '2026/2027 Ganjil',
    dosenId: 'user-dosen-2',
    namaDosen: 'Hj. Rakhmi Ridhawati, M.Si.',
    dosenNidn: '2437751652230112',
    dosenEmail: 'rakhmiridhawati51@gmail.com',
    namaKelas: 'A',
    ruang: 'Ruang Teori 102',
    hari: 'Selasa',
    jam: '10:45 - 13:15 WITA',
    kuota: 40,
    status: 'OPEN',
    progressPercentage: 0,
    enrolledStudents: [],
    meetings: generateDefault16Meetings('Pengantar Bisnis & Kewirausahaan'),
    grades: {}
  },
  {
    id: 'kelas-mnj-101-a',
    mataKuliahId: 'mk-mnj-101',
    namaMk: 'Pengantar Manajemen',
    kodeMk: 'MNJ101',
    sks: 3,
    semester: 1,
    tahunAkademikId: 'ta-20261',
    namaTa: '2026/2027 Ganjil',
    dosenId: 'user-dosen-1789782310180',
    namaDosen: 'Mailiana, SE., MM.',
    dosenNidn: '197505012005012003',
    dosenEmail: 'mailiana.01@gmail.com',
    namaKelas: 'A',
    ruang: 'Ruang Teori 101',
    hari: 'Senin',
    jam: '08:00 - 10:30 WITA',
    kuota: 40,
    status: 'OPEN',
    progressPercentage: 10,
    enrolledStudents: [],
    meetings: generateDefault16Meetings('Pengantar Manajemen'),
    grades: {}
  },
  {
    id: 'kelas-sta-201-a',
    mataKuliahId: 'mk-sta-201',
    namaMk: 'Statistika Ekonomi & Bisnis',
    kodeMk: 'STA201',
    sks: 3,
    semester: 3,
    tahunAkademikId: 'ta-20261',
    namaTa: '2026/2027 Ganjil',
    dosenId: 'user-dosen-1',
    namaDosen: 'Drs. H. Mohdari, M.Si.',
    dosenNidn: '196307041991031003',
    dosenEmail: 'mohdaribjm@gmail.com',
    namaKelas: 'A',
    ruang: 'Lab Statistik 204',
    hari: 'Kamis',
    jam: '08:00 - 10:30 WITA',
    kuota: 40,
    status: 'OPEN',
    progressPercentage: 30,
    enrolledStudents: [
      'user-mhs-1789798197871',
      'user-mhs-1789800818486',
      'user-mhs-1789801049377',
      'user-mhs-1789801227932',
      'user-mhs-1789806444944'
    ],
    meetings: generateDefault16Meetings('Statistika Ekonomi & Bisnis'),
    grades: {}
  },
  {
    id: 'kelas-akt-202-a',
    mataKuliahId: 'mk-akt-202',
    namaMk: 'Pengantar Akuntansi II',
    kodeMk: 'AKT202',
    sks: 3,
    semester: 3,
    tahunAkademikId: 'ta-20261',
    namaTa: '2026/2027 Ganjil',
    dosenId: 'user-dosen-1789742932417',
    namaDosen: 'Rara Gustiana, SE., M.Ak.',
    dosenNidn: '7436769670230283',
    dosenEmail: 'waket1@stienas-ypb.ac.id',
    namaKelas: 'A',
    ruang: 'Ruang Teori 103',
    hari: 'Rabu',
    jam: '10:45 - 13:15 WITA',
    kuota: 35,
    status: 'OPEN',
    progressPercentage: 18,
    enrolledStudents: [],
    meetings: generateDefault16Meetings('Pengantar Akuntansi II'),
    grades: {}
  },
  {
    id: 'kelas-sim-401-a',
    mataKuliahId: 'mk-sim-401',
    namaMk: 'Sistem Informasi Manajemen',
    kodeMk: 'SIM401',
    sks: 3,
    semester: 5,
    tahunAkademikId: 'ta-20261',
    namaTa: '2026/2027 Ganjil',
    dosenId: 'user-dosen-1789742932417',
    namaDosen: 'Rara Gustiana, SE., M.Ak.',
    dosenNidn: '7436769670230283',
    dosenEmail: 'waket1@stienas-ypb.ac.id',
    namaKelas: 'A',
    ruang: 'Lab Komputer 301',
    hari: 'Jumat',
    jam: '08:30 - 11:00 WITA',
    kuota: 35,
    status: 'OPEN',
    progressPercentage: 20,
    enrolledStudents: [],
    meetings: generateDefault16Meetings('Sistem Informasi Manajemen'),
    grades: {}
  },
  {
    id: 'kelas-mnj-301-a',
    mataKuliahId: 'mk-mnj-301',
    namaMk: 'Manajemen Keuangan I',
    kodeMk: 'MNJ301',
    sks: 3,
    semester: 5,
    tahunAkademikId: 'ta-20261',
    namaTa: '2026/2027 Ganjil',
    dosenId: 'user-dosen-1',
    namaDosen: 'Drs. H. Mohdari, M.Si.',
    dosenNidn: '196307041991031003',
    dosenEmail: 'mohdaribjm@gmail.com',
    namaKelas: 'A',
    ruang: 'Lab Keuangan 201',
    hari: 'Senin',
    jam: '08:00 - 10:30 WITA',
    kuota: 40,
    status: 'OPEN',
    progressPercentage: 25,
    enrolledStudents: [],
    meetings: generateDefault16Meetings('Manajemen Keuangan I'),
    grades: {}
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
    details: 'Memperbarui buku nilai kelas perkuliahan.',
    timestamp: new Date(Date.now() - 3600000).toISOString()
  }
];
