/**
 * Modul Perhitungan Buku Nilai (Gradebook) & Standar OBE
 * STIE Nasional Banjarmasin
 * 
 * Sesuai Standar Kurikulum Berbasis Luaran (Outcome-Based Education / OBE):
 * 1. Komponen Penilaian Asesmen Otentik:
 *    - Nilai Akhir = (20% * Tugas) + (15% * Kuis) + (30% * UTS) + (35% * UAS)
 * 2. Ambang Batas Pemenuhan CPMK/CPL OBE = Minimal 70.00% (Grade B / B+ / A)
 * 3. Skala Huruf Mutu & Bobot Nilai (Sesuai Standar Akademik STIE):
 *    - A  (4,00) : Nilai >= 85
 *    - B+ (3,50) : Nilai 75.00 - 84.99
 *    - B  (3,00) : Nilai 70.00 - 74.99 (Ambang batas ketercapaian CPMK OBE)
 *    - C+ (2,50) : Nilai 65.00 - 69.99
 *    - C  (2,00) : Nilai 55.00 - 64.99
 *    - D  (1,00) : Nilai 45.00 - 54.99 (Lulus Bersyarat)
 *    - E  (0,00) : Nilai < 45 (Tidak Lulus / Gagal)
 *    - T  (0,00) : Tunda / Tertunda (Komponen Tugas/Ujian Belum Lengkap)
 */

export const OBE_BENCHMARK_PERCENT = 70;

// Opsi Huruf Mutu & Bobot persis sesuai urutan dropdown pada sistem akademik
export const GRADE_OPTIONS = [
  { value: 'A', label: 'A (4,00)', bobot: 4.0, letter: 'A', minScore: 85, defaultScore: 90 },
  { value: 'B', label: 'B (3,00)', bobot: 3.0, letter: 'B', minScore: 70, defaultScore: 72 },
  { value: 'B+', label: 'B+ (3,50)', bobot: 3.5, letter: 'B+', minScore: 75, defaultScore: 80 },
  { value: 'C', label: 'C (2,00)', bobot: 2.0, letter: 'C', minScore: 55, defaultScore: 60 },
  { value: 'C+', label: 'C+ (2,50)', bobot: 2.5, letter: 'C+', minScore: 65, defaultScore: 67 },
  { value: 'D', label: 'D (1,00)', bobot: 1.0, letter: 'D', minScore: 45, defaultScore: 50 },
  { value: 'E', label: 'E (0,00)', bobot: 0.0, letter: 'E', minScore: 0, defaultScore: 35 },
  { value: 'T', label: 'T (0,00)', bobot: 0.0, letter: 'T', minScore: 0, defaultScore: 0 }
];

// Peta detail atribut huruf mutu
export const GRADE_DETAILS = {
  'A': {
    letter: 'A',
    bobot: 4.0,
    label: 'A (4,00)',
    status: 'LULUS (Sangat Baik / Unggul)',
    cpmkStatus: 'Sangat Memuaskan (Target Tercapai Penuh)',
    cpmkPassed: true,
    cpmkColor: 'text-emerald-800 bg-emerald-50 border-emerald-300'
  },
  'B+': {
    letter: 'B+',
    bobot: 3.5,
    label: 'B+ (3,50)',
    status: 'LULUS (Baik Sekali)',
    cpmkStatus: 'Memuaskan (Target Tercapai)',
    cpmkPassed: true,
    cpmkColor: 'text-teal-800 bg-teal-50 border-teal-300'
  },
  'B': {
    letter: 'B',
    bobot: 3.0,
    label: 'B (3,00)',
    status: 'LULUS (Baik / Standar OBE)',
    cpmkStatus: 'Cukup Memuaskan (Target OBE Terpenuhi)',
    cpmkPassed: true,
    cpmkColor: 'text-blue-800 bg-blue-50 border-blue-300'
  },
  'C+': {
    letter: 'C+',
    bobot: 2.5,
    label: 'C+ (2,50)',
    status: 'LULUS (Cukup Baik)',
    cpmkStatus: 'Belum Memenuhi Ambang Batas OBE (< 70%)',
    cpmkPassed: false,
    cpmkColor: 'text-cyan-800 bg-cyan-50 border-cyan-300'
  },
  'C': {
    letter: 'C',
    bobot: 2.0,
    label: 'C (2,00)',
    status: 'LULUS (Cukup)',
    cpmkStatus: 'Perlu Penguatan / Remedial OBE',
    cpmkPassed: false,
    cpmkColor: 'text-amber-800 bg-amber-50 border-amber-300'
  },
  'D': {
    letter: 'D',
    bobot: 1.0,
    label: 'D (1,00)',
    status: 'LULUS BERSYARAT (Kurang)',
    cpmkStatus: 'Tidak Memenuhi Target Luaran OBE',
    cpmkPassed: false,
    cpmkColor: 'text-orange-800 bg-orange-50 border-orange-300'
  },
  'E': {
    letter: 'E',
    bobot: 0.0,
    label: 'E (0,00)',
    status: 'TIDAK LULUS (Gagal)',
    cpmkStatus: 'Tidak Lulus Standar CPMK / CPL',
    cpmkPassed: false,
    cpmkColor: 'text-rose-800 bg-rose-50 border-rose-300'
  },
  'T': {
    letter: 'T',
    bobot: 0.0,
    label: 'T (0,00)',
    status: 'TERTUNDA (Komponen Belum Lengkap)',
    cpmkStatus: 'Tertunda (Menunggu Kelengkapan Tugas/Ujian)',
    cpmkPassed: false,
    cpmkColor: 'text-purple-800 bg-purple-50 border-purple-300'
  }
};

/**
 * Kalkulasi Nilai Akhir & Konversi ke Huruf Mutu Standar OBE
 * @param {number} tugas - Nilai Tugas (20%)
 * @param {number} kuis - Nilai Kuis (15%)
 * @param {number} uts - Nilai UTS (30%)
 * @param {number} uas - Nilai UAS (35%)
 * @param {string|null} overrideGrade - Huruf mutu jika di-override manual oleh dosen
 */
export function calculateFinalGrade(tugas = 0, kuis = 0, uts = 0, uas = 0, overrideGrade = null) {
  const t = Number(tugas) || 0;
  const k = Number(kuis) || 0;
  const ut = Number(uts) || 0;
  const ua = Number(uas) || 0;

  const finalScore = (0.20 * t) + (0.15 * k) + (0.30 * ut) + (0.35 * ua);
  const roundedScore = Math.round(finalScore * 100) / 100;

  // Jika ada override grade manual dari dropdown dosen
  if (overrideGrade && overrideGrade !== 'AUTO' && GRADE_DETAILS[overrideGrade]) {
    const detail = GRADE_DETAILS[overrideGrade];
    return {
      nilaiTugas: t,
      nilaiKuis: k,
      nilaiUts: ut,
      nilaiUas: ua,
      nilaiAkhir: overrideGrade === 'T' ? 0 : roundedScore,
      nilaiHuruf: detail.letter,
      ipk: detail.bobot,
      gradeLabel: detail.label,
      statusKelulusan: detail.status,
      cpmkPassed: detail.cpmkPassed,
      cpmkStatus: detail.cpmkStatus,
      cpmkColor: detail.cpmkColor,
      isTunda: overrideGrade === 'T',
      isOverridden: true
    };
  }

  // Kalkulasi otomatis berdasarkan ambang batas skor OBE
  let letter = 'E';
  if (roundedScore >= 85) {
    letter = 'A';
  } else if (roundedScore >= 75) {
    letter = 'B+';
  } else if (roundedScore >= 70) {
    letter = 'B';
  } else if (roundedScore >= 65) {
    letter = 'C+';
  } else if (roundedScore >= 55) {
    letter = 'C';
  } else if (roundedScore >= 45) {
    letter = 'D';
  } else {
    letter = 'E';
  }

  const detail = GRADE_DETAILS[letter] || GRADE_DETAILS['E'];

  return {
    nilaiTugas: t,
    nilaiKuis: k,
    nilaiUts: ut,
    nilaiUas: ua,
    nilaiAkhir: roundedScore,
    nilaiHuruf: letter,
    ipk: detail.bobot,
    gradeLabel: detail.label,
    statusKelulusan: detail.status,
    cpmkPassed: detail.cpmkPassed,
    cpmkStatus: detail.cpmkStatus,
    cpmkColor: detail.cpmkColor,
    isTunda: false,
    isOverridden: false
  };
}

/**
 * Mendapatkan style badge warna berdasarkan huruf mutu
 */
export function getGradeBadgeColor(letter) {
  switch (letter) {
    case 'A': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    case 'B+': return 'bg-teal-100 text-teal-800 border-teal-300';
    case 'B': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'C+': return 'bg-cyan-100 text-cyan-800 border-cyan-300';
    case 'C': return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'D': return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'E': return 'bg-rose-100 text-rose-800 border-rose-300';
    case 'T': return 'bg-purple-100 text-purple-800 border-purple-300';
    default: return 'bg-slate-100 text-slate-800 border-slate-300';
  }
}

/**
 * Format huruf dan bobot e.g. "A (4,00)", "B+ (3,50)", "T (0,00)"
 */
export function formatGradeWithBobot(letter, customIpk) {
  if (!letter) return '-';
  if (GRADE_DETAILS[letter]) {
    return GRADE_DETAILS[letter].label;
  }
  const bobotStr = (customIpk !== undefined && customIpk !== null ? Number(customIpk) : 0)
    .toFixed(2)
    .replace('.', ',');
  return `${letter} (${bobotStr})`;
}
