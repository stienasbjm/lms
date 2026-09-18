/**
 * Helper Perhitungan NIM, Angkatan, dan Semester Mahasiswa STIE Nasional
 * Sesuai Aturan Akademik:
 * Mahasiswa baru Angkatan 2026 pada TA 2026/2027 Semester Ganjil masuk Semester 1 (bukan semester 3).
 * Angkatan 2025 -> Semester 3, Angkatan 2024 -> Semester 5, Angkatan 2023 -> Semester 7, dst.
 * Begitupun secara dinamis untuk semester genap maupun angkatan baru berikutnya (misal 2027).
 */

export const ANGKATAN_OPTIONS = [
  { tahun: 2027, semester: 1, label: 'Angkatan 2027 (Calon Mahasiswa Baru)' },
  { tahun: 2026, semester: 1, label: 'Angkatan 2026 (Semester 1 / Mahasiswa Baru)' },
  { tahun: 2025, semester: 3, label: 'Angkatan 2025 (Semester 3 / Tingkat II)' },
  { tahun: 2024, semester: 5, label: 'Angkatan 2024 (Semester 5 / Tingkat III)' },
  { tahun: 2023, semester: 7, label: 'Angkatan 2023 (Semester 7 / Tingkat IV)' },
  { tahun: 2022, semester: 9, label: 'Angkatan 2022 (Semester 9 / Semester Akhir - Skripsi)' },
  { tahun: 2021, semester: 11, label: 'Angkatan 2021 (Semester 11 / Perpanjangan)' },
  { tahun: 2020, semester: 13, label: 'Angkatan 2020 (Semester 13 / Perpanjangan)' }
];

export const PRODI_NIM_PREFIX = {
  'prodi-s1-manajemen': '1011',
  'prodi-s1-akuntansi': '2011',
  '61201': '1011',
  '62201': '2011'
};

/**
 * Mendapatkan Tahun Akademik Aktif dari LocalStorage / Default
 */
export function getActiveAcademicPeriod() {
  try {
    const rawTa = typeof window !== 'undefined' ? localStorage.getItem('STIE_LMS_TA') : null;
    if (rawTa) {
      const tas = JSON.parse(rawTa);
      if (Array.isArray(tas)) {
        const active = tas.find(t => t.isActive) || tas[0];
        if (active) {
          let year = 2026;
          let isGanjil = true;
          if (active.kodeTa && active.kodeTa.length >= 4) {
            year = parseInt(active.kodeTa.substring(0, 4), 10) || 2026;
            isGanjil = !active.kodeTa.endsWith('2');
          } else if (active.namaTa) {
            const match = active.namaTa.match(/(\d{4})/);
            if (match) year = parseInt(match[1], 10);
            isGanjil = active.namaTa.toLowerCase().includes('ganjil') || active.semesterTipe === 'GANJIL';
          }
          return {
            year,
            isGanjil,
            namaTa: active.namaTa || `${year}/${year + 1} ${isGanjil ? 'Ganjil' : 'Genap'}`
          };
        }
      }
    }
  } catch (e) {
    console.warn("Gagal membaca periode akademik aktif:", e);
  }
  return { year: 2026, isGanjil: true, namaTa: '2026/2027 Ganjil' };
}

/**
 * Menghitung Angkatan dan Semester aktif dari NIM atau tahun angkatan yang dipilih
 * @param {string} nim - Nomor Induk Mahasiswa (misal: "261011001" atau "241011088")
 * @param {number|string} customAngkatan - Tahun angkatan manual jika dipilih
 * @param {object} customTa - Periode TA opsional { year, isGanjil, namaTa }
 */
export function calculateAcademicStanding(nim, customAngkatan, customTa) {
  const period = customTa || getActiveAcademicPeriod();
  const currentAcademicYear = period.year;
  const isGanjil = period.isGanjil;

  let angkatan = null;
  if (customAngkatan) {
    const parsed = parseInt(customAngkatan, 10);
    if (!isNaN(parsed) && parsed >= 2000 && parsed <= 2100) {
      angkatan = parsed;
    }
  }

  const cleanNim = (nim || '').trim();
  // Ekstraksi 2 digit pertama NIM hanya jika customAngkatan belum diisi atau tidak valid
  if (!angkatan && cleanNim.length >= 2) {
    const twoDigits = parseInt(cleanNim.substring(0, 2), 10);
    if (!isNaN(twoDigits) && twoDigits >= 10 && twoDigits <= 40) {
      angkatan = 2000 + twoDigits;
    }
  }

  // Default jika tidak terdeteksi: gunakan tahun akademik berjalan (misal 2026)
  if (!angkatan || isNaN(angkatan)) {
    angkatan = currentAcademicYear;
  }

  // Perhitungan Semester Progresif:
  // Selisih = Tahun Akademik Aktif - Tahun Angkatan Masuk
  // Jika Angkatan 2026 masuk pada TA 2026/2027 Ganjil: selisih = 0 -> Semester 1
  // Jika TA 2026/2027 Genap: selisih = 0 -> Semester 2
  // Jika Angkatan 2025 pada TA 2026/2027 Ganjil: selisih = 1 -> Semester 3
  // Jika Angkatan 2024 pada TA 2026/2027 Ganjil: selisih = 2 -> Semester 5
  // Jika Angkatan 2027 (masa mendatang) pada TA 2027/2028 Ganjil: selisih = 0 -> Semester 1
  const selisihTahun = currentAcademicYear - angkatan;

  let semester = 1;
  if (selisihTahun <= 0) {
    semester = isGanjil ? 1 : 2;
  } else {
    semester = (selisihTahun * 2) + (isGanjil ? 1 : 2);
  }

  if (semester < 1) semester = 1;

  let tingkat = 'Tingkat I';
  let badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';

  if (semester === 1) {
    tingkat = 'Mahasiswa Baru (Tingkat I)';
    badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-300';
  } else if (semester === 2) {
    tingkat = 'Mahasiswa Baru Semester 2 (Tingkat I)';
    badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-300';
  } else if (semester === 3 || semester === 4) {
    tingkat = 'Tingkat II (Madya)';
    badgeColor = 'bg-blue-50 text-blue-800 border-blue-300';
  } else if (semester === 5 || semester === 6) {
    tingkat = 'Tingkat III (Utama)';
    badgeColor = 'bg-indigo-50 text-indigo-800 border-indigo-300';
  } else if (semester === 7 || semester === 8) {
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
 * Contoh: Angkatan 2026 + S1 Manajemen -> 261011 + random 3 digit
 */
export function generateSuggestedNim(angkatan, prodiId) {
  const year2Digits = String(angkatan || 2026).slice(-2);
  const prodiCode = PRODI_NIM_PREFIX[prodiId] || '1011';
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `${year2Digits}${prodiCode}${randomSuffix}`;
}
