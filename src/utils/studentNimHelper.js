/**
 * Helper Perhitungan NIM, Angkatan, dan Semester Mahasiswa STIE Nasional
 * Tahun Akademik Acuan: TA 2026/2027 Ganjil (Tahun Berjalan 2026)
 */

export const ANGKATAN_OPTIONS = [
  { tahun: 2026, label: 'Angkatan 2026 (Semester 1 / Mahasiswa Baru)' },
  { tahun: 2025, label: 'Angkatan 2025 (Semester 3 / Tingkat II)' },
  { tahun: 2024, label: 'Angkatan 2024 (Semester 5 / Tingkat III)' },
  { tahun: 2023, label: 'Angkatan 2023 (Semester 7 / Tingkat IV)' },
  { tahun: 2022, label: 'Angkatan 2022 (Semester 9 / Semester Akhir - Skripsi)' },
  { tahun: 2021, label: 'Angkatan 2021 (Semester 11 / Perpanjangan)' }
];

export const PRODI_NIM_PREFIX = {
  'prodi-s1-manajemen': '1011',
  'prodi-s1-akuntansi': '2011',
  '61201': '1011',
  '62201': '2011'
};

/**
 * Menghitung Angkatan dan Semester aktif dari NIM atau tahun angkatan yang dipilih
 * @param {string} nim - Nomor Induk Mahasiswa (misal: "241011088" atau "221011001")
 * @param {number|string} customAngkatan - Tahun angkatan manual jika belum ada NIM
 */
export function calculateAcademicStanding(nim, customAngkatan) {
  let angkatan = customAngkatan ? parseInt(customAngkatan, 10) : null;
  const cleanNim = (nim || '').trim();

  // Ekstraksi 2 digit pertama NIM jika tersedia (contoh: '24' -> 2024)
  if (cleanNim.length >= 2) {
    const twoDigits = parseInt(cleanNim.substring(0, 2), 10);
    if (!isNaN(twoDigits) && twoDigits >= 10 && twoDigits <= 30) {
      angkatan = 2000 + twoDigits;
    }
  }

  // Default jika tidak terdeteksi
  if (!angkatan || isNaN(angkatan)) {
    angkatan = 2024;
  }

  // Perhitungan Semester pada Tahun Akademik Aktif: 2026/2027 Semester GANJIL
  const currentAcademicYear = 2026;
  const isGanjil = true;
  const selisihTahun = currentAcademicYear - angkatan;
  
  // Rumus: Selisih tahun * 2 + (1 jika Ganjil, 2 jika Genap)
  let semester = (selisihTahun * 2) + (isGanjil ? 1 : 2);
  if (semester < 1) semester = 1;

  let tingkat = 'Tingkat I';
  let badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';

  if (semester === 1) {
    tingkat = 'Mahasiswa Baru (Tingkat I)';
    badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-300';
  } else if (semester === 3) {
    tingkat = 'Tingkat II (Madya)';
    badgeColor = 'bg-blue-50 text-blue-800 border-blue-300';
  } else if (semester === 5) {
    tingkat = 'Tingkat III (Utama)';
    badgeColor = 'bg-indigo-50 text-indigo-800 border-indigo-300';
  } else if (semester === 7) {
    tingkat = 'Tingkat IV (Senior)';
    badgeColor = 'bg-purple-50 text-purple-800 border-purple-300';
  } else {
    tingkat = 'Tingkat Akhir (Tugas Akhir / Skripsi)';
    badgeColor = 'bg-amber-50 text-amber-800 border-amber-300';
  }

  return {
    nim: cleanNim,
    angkatan,
    semester,
    semesterText: `Semester ${semester} (${isGanjil ? 'Ganjil' : 'Genap'})`,
    tingkat,
    badgeColor,
    infoLengkap: `Angkatan ${angkatan} • Semester ${semester} (${isGanjil ? 'Ganjil' : 'Genap'}) • ${tingkat}`
  };
}

/**
 * Generate contoh NIM otomatis berdasarkan Angkatan dan Prodi
 * Contoh: Angkatan 2024 + S1 Manajemen -> 241011 + random 3 digit
 */
export function generateSuggestedNim(angkatan, prodiId) {
  const year2Digits = String(angkatan || 2024).slice(-2);
  const prodiCode = PRODI_NIM_PREFIX[prodiId] || '1011';
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `${year2Digits}${prodiCode}${randomSuffix}`;
}
