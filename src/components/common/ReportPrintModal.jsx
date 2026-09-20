import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateProdi } from '../../firebase/firestoreService';
import { 
  Printer, 
  Download, 
  X, 
  Award, 
  GraduationCap, 
  CheckCircle2, 
  Edit2,
  Save,
  Check,
  RotateCcw,
  UserCheck
} from 'lucide-react';

export default function ReportPrintModal({
  isOpen,
  onClose,
  type = 'KHS', // 'KHS' | 'GRADEBOOK'
  student,
  prodis = [],
  mks = [],
  activeTa,
  khsRows = [],
  totalSks = 0,
  ipkSemester = '0.00',
  totalSksXBobot = 0,
  rataKetercapaianCpmk = 0,
  classData,
  enrolledRows = [],
  onDownloadCSV
}) {
  const { user, isAdmin, isBaa } = useAuth();
  const canEditKaprodi = isAdmin || isBaa;

  // Resolusi Program Studi yang akurat (Mata Kuliah / Kelas / Mahasiswa)
  const targetProdi = (() => {
    const list = prodis || [];
    if (list.length === 0) return null;

    if (type === 'GRADEBOOK' && classData) {
      // 1. Cek relasi dari Mata Kuliah (mks)
      const mk = (mks || []).find(m => 
        (classData.mataKuliahId && m.id === classData.mataKuliahId) ||
        (classData.kodeMk && m.kodeMk?.toUpperCase() === classData.kodeMk.toUpperCase()) ||
        (classData.namaMk && m.namaMk?.toLowerCase() === classData.namaMk.toLowerCase())
      );

      // 2. Deteksi akurat berbasis Kode MK atau Nama MK (Akuntansi vs Manajemen)
      const kode = (classData.kodeMk || mk?.kodeMk || '').toUpperCase();
      const nama = (classData.namaMk || mk?.namaMk || '').toLowerCase();

      if (kode.startsWith('AKT') || kode.startsWith('AK') || nama.includes('akuntan')) {
        const akt = list.find(p => p.namaProdi?.toLowerCase().includes('akuntansi') || p.id?.includes('akuntansi') || p.kodeProdi === '62201');
        if (akt) return akt;
      }

      if (kode.startsWith('MNJ') || kode.startsWith('BIS') || kode.startsWith('MGT') || kode.startsWith('MAN') || kode.startsWith('STA') || kode.startsWith('SIM') || nama.includes('manajemen') || nama.includes('bisnis')) {
        const mnj = list.find(p => p.namaProdi?.toLowerCase().includes('manajemen') || p.id?.includes('manajemen') || p.kodeProdi === '61201');
        if (mnj) return mnj;
      }

      if (mk?.prodiId) {
        const found = list.find(p => p.id === mk.prodiId);
        if (found) return found;
      }

      // 3. Cek langsung dari id prodi pada kelas jika ada
      if (classData.prodiId) {
        const found = list.find(p => p.id === classData.prodiId);
        if (found) return found;
      }
      if (classData.prodi) {
        const found = list.find(p => p.namaProdi?.toLowerCase() === classData.prodi.toLowerCase() || p.id === classData.prodi);
        if (found) return found;
      }
    }

    if (type === 'KHS') {
      // 1. Deteksi dari mata kuliah di KHS jika ada
      if (khsRows && khsRows.length > 0) {
        const aktCount = khsRows.filter(r => (r.kodeMk || '').toUpperCase().startsWith('AKT') || (r.kodeMk || '').toUpperCase().startsWith('AK') || (r.namaMk || '').toLowerCase().includes('akuntansi')).length;
        const mnjCount = khsRows.filter(r => (r.kodeMk || '').toUpperCase().startsWith('MNJ') || (r.kodeMk || '').toUpperCase().startsWith('BIS') || (r.namaMk || '').toLowerCase().includes('manajemen')).length;
        if (aktCount > 0 && aktCount >= mnjCount) {
          const akt = list.find(p => p.namaProdi?.toLowerCase().includes('akuntansi') || p.id?.includes('akuntansi') || p.kodeProdi === '62201');
          if (akt) return akt;
        } else if (mnjCount > 0 && mnjCount > aktCount) {
          const mnj = list.find(p => p.namaProdi?.toLowerCase().includes('manajemen') || p.id?.includes('manajemen') || p.kodeProdi === '61201');
          if (mnj) return mnj;
        }
      }

      // 2. Cek prodiId mahasiswa
      if (student?.prodiId) {
        const found = list.find(p => p.id === student.prodiId);
        if (found) return found;
      }

      // 3. Cek nama prodi mahasiswa
      if (student?.prodi) {
        const stdProdiLower = student.prodi.toLowerCase();
        const found = list.find(p => 
          p.namaProdi?.toLowerCase() === stdProdiLower || 
          p.id?.toLowerCase() === stdProdiLower ||
          (stdProdiLower.includes('akuntansi') && p.namaProdi?.toLowerCase().includes('akuntansi')) ||
          (stdProdiLower.includes('manajemen') && p.namaProdi?.toLowerCase().includes('manajemen'))
        );
        if (found) return found;
      }
    }

    // Default fallback
    return list[0];
  })();

  const isAkuntansi = Boolean(
    targetProdi?.namaProdi?.toLowerCase().includes('akuntansi') || 
    targetProdi?.id?.includes('akuntansi') ||
    targetProdi?.kodeProdi === '62201' ||
    (type === 'GRADEBOOK' && (
      (classData?.kodeMk || '').toUpperCase().startsWith('AKT') ||
      (classData?.kodeMk || '').toUpperCase().startsWith('AK') ||
      (classData?.namaMk || '').toLowerCase().includes('akuntan')
    ))
  );

  const officialKaprodi = isAkuntansi ? {
    nama: 'Hj. Nurul Fadhilah, S.E., M.Ak., Ak., CA',
    nuptk: '1124018201',
    namaProdi: 'S1 Akuntansi'
  } : {
    nama: 'Dr. H. Muhammad Ramli, S.E., M.M.',
    nuptk: '1102046801',
    namaProdi: 'S1 Manajemen'
  };

  const studentProdiName = targetProdi?.namaProdi || officialKaprodi.namaProdi;

  // State Pejabat Ketua Program Studi yang dapat diedit manual
  const [kaprodiName, setKaprodiName] = useState(officialKaprodi.nama);
  const [kaprodiNip, setKaprodiNip] = useState(officialKaprodi.nuptk);
  const [isEditingKaprodi, setIsEditingKaprodi] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState('');

  useEffect(() => {
    let resolvedName = officialKaprodi.nama;
    let resolvedNip = officialKaprodi.nuptk;

    if (targetProdi) {
      if (isAkuntansi) {
        if (targetProdi.namaKaprodi && !targetProdi.namaKaprodi.includes('Ramli')) {
          resolvedName = targetProdi.namaKaprodi;
        }
        if (targetProdi.nuptkKaprodi && targetProdi.nuptkKaprodi !== '1102046801') {
          resolvedNip = targetProdi.nuptkKaprodi;
        }
      } else {
        if (targetProdi.namaKaprodi && !targetProdi.namaKaprodi.includes('Fadhilah')) {
          resolvedName = targetProdi.namaKaprodi;
        }
        if (targetProdi.nuptkKaprodi && targetProdi.nuptkKaprodi !== '1124018201') {
          resolvedNip = targetProdi.nuptkKaprodi;
        }
      }
    }

    setKaprodiName(resolvedName);
    setKaprodiNip(resolvedNip);
  }, [targetProdi, isAkuntansi, isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSaveKaprodiMaster = async () => {
    if (!targetProdi?.id) return;
    setIsSaving(true);
    try {
      await updateProdi(targetProdi.id, {
        namaKaprodi: kaprodiName,
        nuptkKaprodi: kaprodiNip
      }, user);
      setSaveFeedback('Berhasil disimpan ke Master Program Studi!');
      setTimeout(() => setSaveFeedback(''), 4000);
    } catch (err) {
      console.error(err);
      setSaveFeedback('Gagal menyimpan data.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetKaprodi = () => {
    setKaprodiName(officialKaprodi.nama);
    setKaprodiNip(officialKaprodi.nuptk);
  };

  const currentDateFormatted = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  // Perhitungan statistik untuk Buku Nilai Kelas
  const totalStudents = enrolledRows.length;
  const passedStudents = enrolledRows.filter(r => r.status === 'LULUS').length;
  const passRate = totalStudents > 0 ? Math.round((passedStudents / totalStudents) * 100) : 0;
  const avgScore = totalStudents > 0 
    ? (enrolledRows.reduce((acc, curr) => acc + (parseFloat(curr.akhir) || 0), 0) / totalStudents).toFixed(1)
    : '0.0';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex justify-center p-2 sm:p-4 md:p-6 print:p-0">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col my-auto overflow-hidden print:border-none print:shadow-none print:rounded-none print:max-w-none">
        
        {/* BAR KONTROL ATAS (HANYA MUNCUL DI LAYAR, DISEMBUNYIKAN SAAT PRINT) */}
        <div className="no-print bg-slate-900 text-white px-5 py-3.5 flex flex-wrap justify-between items-center gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-800 text-amber-300">
              {type === 'KHS' ? <GraduationCap className="w-5 h-5" /> : <Award className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span>{type === 'KHS' ? 'Cetak Kartu Hasil Studi (KHS)' : 'Cetak Daftar Nilai Akhir Perkuliahan (DPNA)'}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Bagian Administrasi Akademik (BAA)
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Format dokumen baku Bagian Administrasi Akademik (BAA) siap cetak printer atau simpan sebagai PDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tombol Edit Pejabat Kaprodi untuk Admin / BAA / Penilai */}
            <button
              onClick={() => setIsEditingKaprodi(!isEditingKaprodi)}
              type="button"
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                isEditingKaprodi 
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow' 
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-400/30'
              }`}
              title="Ubah Pejabat Ketua Program Studi untuk Laporan Ini"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{isEditingKaprodi ? 'Tutup Edit Kaprodi' : 'Edit Kaprodi'}</span>
            </button>

            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang (Print / PDF)</span>
            </button>

            {onDownloadCSV && (
              <button
                onClick={onDownloadCSV}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
                title="Unduh format spreadsheet CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Unduh CSV</span>
              </button>
            )}

            <button
              onClick={onClose}
              type="button"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              title="Tutup Pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PANEL EDIT PEJABAT KAPRODI (NO-PRINT: MUNCUL KETIKA DIBUKA OLEH ADMIN / BAA) */}
        {isEditingKaprodi && (
          <div className="no-print bg-amber-50 border-b border-amber-200 p-4 text-xs animate-in slide-in-from-top duration-150">
            <div className="max-w-3xl mx-auto space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-amber-950">
                  <UserCheck className="w-4 h-4 text-amber-700" />
                  <span>Pengaturan Pejabat Pengesahan: Ketua Program Studi ({targetProdi?.namaProdi || 'Prodi'})</span>
                </div>
                <span className="text-[11px] text-amber-800">
                  Perubahan nama dan NUPTK/NIP langsung tampil di dokumen cetak
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Nama Lengkap & Gelar Ketua Program Studi
                  </label>
                  <input
                    type="text"
                    value={kaprodiName}
                    onChange={e => setKaprodiName(e.target.value)}
                    placeholder="contoh: Dr. H. Muhammad Ramli, S.E., M.M."
                    className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-900 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    NUPTK / NIP Kaprodi
                  </label>
                  <input
                    type="text"
                    value={kaprodiNip}
                    onChange={e => setKaprodiNip(e.target.value)}
                    placeholder="contoh: 1102046801"
                    className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 font-mono text-slate-900 shadow-sm"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetKaprodi}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-amber-100 rounded-lg transition-colors text-[11px]"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset ke Standar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingKaprodi(false)}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg font-semibold transition-colors text-[11px]"
                  >
                    <Check className="w-3 h-3" />
                    Terapkan pada Dokumen Ini
                  </button>
                </div>

                {canEditKaprodi && (
                  <button
                    type="button"
                    onClick={handleSaveKaprodiMaster}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-800 hover:bg-brand-900 text-white rounded-lg font-bold shadow-sm transition-colors text-[11px]"
                    title="Simpan permanen agar otomatis digunakan untuk cetakan berikutnya"
                  >
                    <Save className="w-3.5 h-3.5 text-amber-300" />
                    {isSaving ? 'Menyimpan...' : 'Simpan Permanen ke Master Prodi'}
                  </button>
                )}
              </div>

              {saveFeedback && (
                <div className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {saveFeedback}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CONTAINER LEMBAR DOKUMEN CETAK (ID: printable-report) */}
        <div id="printable-report" className="p-6 sm:p-10 text-slate-900 bg-white font-sans text-xs leading-relaxed max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0">
          
          {/* KOP SURAT RESMI LEMBAGA SESUAI FORMAT BAKU STIENAS */}
          <div className="mb-5 font-serif text-black select-none">
            {/* Bagian Atas: Logo & Header Lembaga */}
            <div className="flex items-center gap-4 pb-1">
              <div className="w-24 h-24 shrink-0 flex items-center justify-center">
                <img 
                  src={`${import.meta.env.BASE_URL}logo-stienas.png`} 
                  alt="Logo STIENAS Banjarmasin" 
                  className="w-24 h-24 object-contain"
                />
              </div>
              <div className="flex-1 text-center pr-2">
                <h2 className="text-sm sm:text-base font-bold uppercase tracking-wide leading-tight text-black">
                  YAYASAN PENDIDIKAN BANDARMASIH
                </h2>
                <h1 className="text-base sm:text-lg font-black uppercase tracking-tight leading-tight mt-0.5 text-black">
                  SEKOLAH TINGGI ILMU EKONOMI NASIONAL
                </h1>
                <h1 className="text-base sm:text-lg font-black uppercase tracking-tight leading-tight text-black">
                  (STIENAS) BANJARMASIN
                </h1>
                <p className="text-xs sm:text-sm font-bold uppercase tracking-wide text-black mt-0.5">
                  BAGIAN ADMINISTRASI AKADEMIK (BAA)
                </p>
                <div className="text-[10px] sm:text-[11px] font-bold leading-tight mt-1.5 space-y-0.5 px-1 text-black">
                  <div className="flex justify-between items-center">
                    <span>TERAKREDITASI SK. NO. : 501/DE/A.5/AR.10/VII/2023</span>
                    <span>PROGRAM STUDI: AKUNTANSI</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>TERAKREDITASI SK. NO. : 1318/DE/A.5/AR.10/VI/2024</span>
                    <span>PROGRAM STUDI: MANAJEMEN</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Garis Horizontal Pembatas Pertama */}
            <div className="border-t-[1.5px] border-black w-full my-1" />

            {/* Bagian Alamat, Kontak, Email, dan Website */}
            <div className="text-center text-[10.5px] leading-tight py-0.5 text-black">
              <p>
                JL. Mayjend.  Soetoyo S No. 126 Kota Banjarmasin, Kalimantan Selatan 70114 Telp. 0511- 4364563
              </p>
              <p className="mt-0.5">
                email: info@stienas-ypb.a.c.id website: stienas-ypb.ac.id
              </p>
            </div>

            {/* Garis Horizontal Pembatas Kedua */}
            <div className="border-b-[1.5px] border-black w-full mt-1" />
          </div>

          {/* =========================================================================
              TAMPILAN 1: KARTU HASIL STUDI (KHS) MAHASISWA
             ========================================================================= */}
          {type === 'KHS' && (
            <div className="space-y-4">
              {/* JUDUL DOKUMEN */}
              <div className="text-center space-y-0.5">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
                  BAGIAN ADMINISTRASI AKADEMIK (BAA)
                </p>
                <h2 className="text-sm sm:text-base font-black uppercase tracking-widest text-slate-950 underline decoration-slate-900 decoration-2 underline-offset-4">
                  Kartu Hasil Studi (KHS) Mahasiswa
                </h2>
                <p className="text-[11px] font-bold text-slate-700">
                  Tahun Akademik {activeTa?.namaTa || '2026/2027 Ganjil'}
                </p>
              </div>

              {/* IDENTITAS MAHASISWA */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs print:bg-transparent print:border-slate-400">
                <div className="flex">
                  <span className="w-28 text-slate-500 print:text-slate-800">Nama Mahasiswa</span>
                  <span className="font-bold text-slate-900">: {student?.name || '-'}</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-slate-500 print:text-slate-800">Program Studi</span>
                  <span className="font-bold text-slate-900">: {studentProdiName}</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-slate-500 print:text-slate-800">NIM</span>
                  <span className="font-bold font-mono text-slate-900">: {student?.nim || '-'}</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-slate-500 print:text-slate-800">Jenjang / Angkatan</span>
                  <span className="font-bold text-slate-900">: S1 (Strata Satu) / {student?.tahunMasuk || student?.angkatan || '2023'}</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-slate-500 print:text-slate-800">Semester Aktif</span>
                  <span className="font-bold text-slate-900">: Semester {student?.semester || '5'} ({activeTa?.namaTa || 'Ganjil'})</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-slate-500 print:text-slate-800">Tahun Akademik</span>
                  <span className="font-bold text-slate-900">: {activeTa?.namaTa || '2026/2027 Ganjil'}</span>
                </div>
              </div>

              {/* TABEL KHS RESMI */}
              <div className="border border-slate-900 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 border-b border-slate-900 font-bold text-center print:bg-slate-100">
                      <th className="p-1.5 border-r border-slate-400 w-8">No</th>
                      <th className="p-1.5 border-r border-slate-400 w-16">Kode MK</th>
                      <th className="p-1.5 border-r border-slate-400 text-left">Mata Kuliah</th>
                      <th className="p-1.5 border-r border-slate-400 w-10">SKS</th>
                      <th className="p-1.5 border-r border-slate-400 text-left">Dosen Pengampu</th>
                      <th className="p-1.5 border-r border-slate-400 w-12">Nilai Akhir</th>
                      <th className="p-1.5 border-r border-slate-400 w-12">Huruf Mutu</th>
                      <th className="p-1.5 border-r border-slate-400 w-12">Bobot (K)</th>
                      <th className="p-1.5 border-r border-slate-400 w-14">SKS x K</th>
                      <th className="p-1.5 border-r border-slate-400 w-16">CPMK (OBE)</th>
                      <th className="p-1.5 w-16">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {khsRows.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="p-6 text-center text-slate-500 italic">
                          Belum ada mata kuliah yang terdaftar atau dinilai pada semester ini.
                        </td>
                      </tr>
                    ) : (
                      khsRows.map((row, idx) => {
                        const sksNum = Number(row.sks) || 0;
                        const bobotNum = parseFloat(String(row.bobot).replace(',', '.')) || 0;
                        const sksXBobotRow = (sksNum * bobotNum).toFixed(2);
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 print:hover:bg-transparent">
                            <td className="p-1.5 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
                            <td className="p-1.5 border-r border-slate-300 text-center font-mono font-bold">{row.kodeMk}</td>
                            <td className="p-1.5 border-r border-slate-300 font-semibold">{row.namaMk}</td>
                            <td className="p-1.5 border-r border-slate-300 text-center font-mono">{row.sks}</td>
                            <td className="p-1.5 border-r border-slate-300 text-slate-700">{row.dosen}</td>
                            <td className="p-1.5 border-r border-slate-300 text-center font-bold font-mono">{row.nilaiAkhir}</td>
                            <td className="p-1.5 border-r border-slate-300 text-center font-extrabold font-mono">{row.gradeLabel}</td>
                            <td className="p-1.5 border-r border-slate-300 text-center font-mono">{row.bobot}</td>
                            <td className="p-1.5 border-r border-slate-300 text-center font-mono font-bold">{sksXBobotRow}</td>
                            <td className="p-1.5 border-r border-slate-300 text-center">
                              <span className="font-bold font-mono">{row.cpmkPercent}</span>
                            </td>
                            <td className="p-1.5 text-center font-bold">
                              <span className={row.status === 'LULUS' ? 'text-emerald-700' : 'text-amber-700'}>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {khsRows.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-100 font-bold border-t-2 border-slate-900 print:bg-slate-100">
                        <td colSpan={3} className="p-2 text-right border-r border-slate-400 uppercase tracking-wide text-slate-800">
                          Total Beban &amp; Akumulasi Nilai:
                        </td>
                        <td className="p-2 border-r border-slate-400 text-center font-mono font-black text-sm">
                          {totalSks} SKS
                        </td>
                        <td colSpan={4} className="p-2 border-r border-slate-400 text-right text-slate-700">
                          Total Mutu ($SKS \times Bobot$):
                        </td>
                        <td className="p-2 border-r border-slate-400 text-center font-mono font-black text-sm">
                          {totalSksXBobot.toFixed(2)}
                        </td>
                        <td colSpan={2} className="p-2 text-center text-[10px] text-slate-600">
                          Rata-rata CPMK: <strong>{rataKetercapaianCpmk}%</strong>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* REKAPITULASI INDEKS PRESTASI & PRESTASI OBE */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl border border-slate-300 bg-slate-50 text-center print:bg-transparent print:border-slate-400">
                <div>
                  <div className="text-[10px] text-slate-600 font-semibold uppercase">Total SKS Diambil</div>
                  <div className="text-base font-black text-slate-900">{totalSks} SKS</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-600 font-semibold uppercase">Indeks Prestasi Semester (IPS)</div>
                  <div className="text-base font-black text-brand-900">{ipkSemester} / 4.00</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-600 font-semibold uppercase">Rata-rata CPMK OBE</div>
                  <div className="text-base font-black text-emerald-800">{rataKetercapaianCpmk}% (Tuntas)</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-600 font-semibold uppercase">Beban SKS Maksimal Berikutnya</div>
                  <div className="text-base font-black text-slate-900">
                    {parseFloat(ipkSemester) >= 3.0 ? '24 SKS' : parseFloat(ipkSemester) >= 2.5 ? '21 SKS' : '18 SKS'}
                  </div>
                </div>
              </div>

              {/* KETERANGAN KONVERSI NILAI OBE */}
              <div className="p-2.5 rounded-lg border border-slate-200 text-[9px] text-slate-600 space-y-1">
                <div className="font-bold text-slate-800 uppercase tracking-wide">Pedoman Konversi Nilai &amp; Mutu Akademik (OBE):</div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 text-center font-mono">
                  <div className="p-1 bg-slate-100 rounded">A : 80-100 (4.00)</div>
                  <div className="p-1 bg-slate-100 rounded">B+: 75-79 (3.50)</div>
                  <div className="p-1 bg-slate-100 rounded">B : 70-74 (3.00)</div>
                  <div className="p-1 bg-slate-100 rounded">C+: 65-69 (2.50)</div>
                  <div className="p-1 bg-slate-100 rounded">C : 60-64 (2.00)</div>
                  <div className="p-1 bg-slate-100 rounded">D : 50-59 (1.00)</div>
                  <div className="p-1 bg-slate-100 rounded">E : 0-49 (0.00)</div>
                  <div className="p-1 bg-slate-100 rounded">T : Tunda</div>
                </div>
              </div>

              {/* BLOK TANDA TANGAN PENGESAHAN */}
              <div className="pt-6 grid grid-cols-2 text-center text-xs break-inside-avoid">
                <div className="space-y-16">
                  <div>
                    <p className="text-[10px] text-slate-500">Mahasiswa Yang Bersangkutan,</p>
                    <p className="font-bold text-slate-900">Pemohon Hasil Studi</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 underline">{student?.name || 'Mahasiswa'}</p>
                    <p className="text-[10px] text-slate-500 font-mono">NIM: {student?.nim || '-'}</p>
                  </div>
                </div>

                <div className="space-y-16">
                  <div>
                    <p className="text-[10px] text-slate-500">Banjarmasin, {currentDateFormatted}</p>
                    <p className="font-bold text-slate-900 flex items-center justify-center gap-1">
                      <span>Ketua Program Studi {studentProdiName}</span>
                      {canEditKaprodi && (
                        <button
                          type="button"
                          onClick={() => setIsEditingKaprodi(true)}
                          className="no-print text-amber-600 hover:text-amber-800 text-[10px] font-normal"
                          title="Klik untuk ubah nama Kaprodi"
                        >
                          (✏️ ubah)
                        </button>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 underline">{kaprodiName}</p>
                    <p className="text-[10px] text-slate-500 font-mono">NUPTK/NIP: {kaprodiNip}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAMPILAN 2: DAFTAR NILAI AKHIR (DPNA) KELAS OLEH DOSEN
             ========================================================================= */}
          {type === 'GRADEBOOK' && (
            <div className="space-y-4">
              {/* JUDUL DOKUMEN */}
              <div className="text-center space-y-0.5">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
                  BAGIAN ADMINISTRASI AKADEMIK (BAA)
                </p>
                <h2 className="text-sm sm:text-base font-black uppercase tracking-widest text-slate-950 underline decoration-slate-900 decoration-2 underline-offset-4">
                  Daftar Peserta & Nilai Akhir (DPNA) OBE
                </h2>
                <p className="text-[11px] font-bold text-slate-700">
                  Laporan Hasil Evaluasi Pembelajaran Semester {classData?.namaTa || '2026/2027 Ganjil'}
                </p>
              </div>

              {/* IDENTITAS KELAS PERKULIAHAN */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs print:bg-transparent print:border-slate-400">
                <div className="flex">
                  <span className="w-28 text-slate-500 print:text-slate-800">Mata Kuliah</span>
                  <span className="font-bold text-slate-900">: {classData?.kodeMk} - {classData?.namaMk} ({classData?.sks || 3} SKS)</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-slate-500 print:text-slate-800">Kelas / Ruang</span>
                  <span className="font-bold text-slate-900">: Kelas {classData?.namaKelas || 'A'} / {classData?.ruang || 'Lab / R-201'}</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-slate-500 print:text-slate-800">Dosen Pengampu</span>
                  <span className="font-bold text-slate-900">: {classData?.namaDosen || 'Dosen Pengampu'}</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-slate-500 print:text-slate-800">Jadwal Kuliah</span>
                  <span className="font-bold text-slate-900">: {classData?.hari || 'Senin'}, {classData?.jamMulai || '08:00'} - {classData?.jamSelesai || '10:30'} WITA</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-slate-500 print:text-slate-800">Tahun Akademik</span>
                  <span className="font-bold text-slate-900">: {classData?.namaTa || activeTa?.namaTa || '2026/2027 Ganjil'}</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-slate-500 print:text-slate-800">Program Studi</span>
                  <span className="font-bold text-slate-900">: {studentProdiName}</span>
                </div>
              </div>

              {/* TABEL BUKU NILAI KELAS OBE */}
              <div className="border border-slate-900 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 border-b border-slate-900 font-bold text-center print:bg-slate-100">
                      <th className="p-1.5 border-r border-slate-400 w-8">No</th>
                      <th className="p-1.5 border-r border-slate-400 w-24">NIM</th>
                      <th className="p-1.5 border-r border-slate-400 text-left">Nama Mahasiswa</th>
                      <th className="p-1.5 border-r border-slate-400 w-12">Tugas (20%)</th>
                      <th className="p-1.5 border-r border-slate-400 w-12">Kuis (15%)</th>
                      <th className="p-1.5 border-r border-slate-400 w-12">UTS (30%)</th>
                      <th className="p-1.5 border-r border-slate-400 w-12">UAS (35%)</th>
                      <th className="p-1.5 border-r border-slate-400 w-12">Nilai Akhir</th>
                      <th className="p-1.5 border-r border-slate-400 w-12">Huruf Mutu</th>
                      <th className="p-1.5 border-r border-slate-400 w-12">Bobot</th>
                      <th className="p-1.5 border-r border-slate-400 w-14">CPMK</th>
                      <th className="p-1.5 w-16">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {enrolledRows.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="p-6 text-center text-slate-500 italic">
                          Belum ada mahasiswa yang terdaftar di kelas perkuliahan ini.
                        </td>
                      </tr>
                    ) : (
                      enrolledRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 print:hover:bg-transparent">
                          <td className="p-1.5 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
                          <td className="p-1.5 border-r border-slate-300 text-center font-mono font-bold">{row.nim}</td>
                          <td className="p-1.5 border-r border-slate-300 font-semibold">{row.nama}</td>
                          <td className="p-1.5 border-r border-slate-300 text-center font-mono">{row.tugas}</td>
                          <td className="p-1.5 border-r border-slate-300 text-center font-mono">{row.kuis}</td>
                          <td className="p-1.5 border-r border-slate-300 text-center font-mono">{row.uts}</td>
                          <td className="p-1.5 border-r border-slate-300 text-center font-mono">{row.uas}</td>
                          <td className="p-1.5 border-r border-slate-300 text-center font-bold font-mono">{row.akhir}</td>
                          <td className="p-1.5 border-r border-slate-300 text-center font-extrabold font-mono">{row.huruf}</td>
                          <td className="p-1.5 border-r border-slate-300 text-center font-mono">{row.bobot}</td>
                          <td className="p-1.5 border-r border-slate-300 text-center font-mono">{row.cpmkPercent}</td>
                          <td className="p-1.5 text-center font-bold">
                            <span className={row.status === 'LULUS' ? 'text-emerald-700' : 'text-amber-700'}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* STATISTIK HASIL BELAJAR KELAS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl border border-slate-300 bg-slate-50 text-center print:bg-transparent print:border-slate-400">
                <div>
                  <div className="text-[10px] text-slate-600 font-semibold uppercase">Total Peserta Kelas</div>
                  <div className="text-base font-black text-slate-900">{totalStudents} Mahasiswa</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-600 font-semibold uppercase">Nilai Rata-rata Kelas</div>
                  <div className="text-base font-black text-brand-900">{avgScore} / 100</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-600 font-semibold uppercase">Tingkat Kelulusan</div>
                  <div className="text-base font-black text-emerald-800">{passRate}% ({passedStudents} Mhs)</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-600 font-semibold uppercase">Standar Kurikulum</div>
                  <div className="text-base font-black text-brand-900">OBE &amp; 16 Sesi RPS</div>
                </div>
              </div>

              {/* BLOK TANDA TANGAN RESMI DOSEN */}
              <div className="pt-6 grid grid-cols-2 text-center text-xs break-inside-avoid">
                <div className="space-y-16">
                  <div>
                    <p className="text-[10px] text-slate-500">Mengetahui,</p>
                    <p className="font-bold text-slate-900 flex items-center justify-center gap-1">
                      <span>Ketua Program Studi {studentProdiName}</span>
                      {canEditKaprodi && (
                        <button
                          type="button"
                          onClick={() => setIsEditingKaprodi(true)}
                          className="no-print text-amber-600 hover:text-amber-800 text-[10px] font-normal"
                          title="Klik untuk ubah nama Kaprodi"
                        >
                          (✏️ ubah)
                        </button>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 underline">{kaprodiName}</p>
                    <p className="text-[10px] text-slate-500 font-mono">NUPTK/NIP: {kaprodiNip}</p>
                  </div>
                </div>

                <div className="space-y-16">
                  <div>
                    <p className="text-[10px] text-slate-500">Banjarmasin, {currentDateFormatted}</p>
                    <p className="font-bold text-slate-900">Dosen Pengampu Mata Kuliah</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 underline">{classData?.namaDosen || 'Dosen Pengampu'}</p>
                    <p className="text-[10px] text-slate-500 font-mono">NUPTK/NIP: {classData?.dosenNidn || classData?.dosenNuptk || '1105087301'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CATATAN RESMI FOOTER */}
          <div className="mt-8 pt-2 border-t border-slate-200 text-[9px] text-slate-400 flex justify-between items-center print:text-slate-500">
            <span>Dicetak secara otomatis melalui Sistem LMS &amp; Bagian Administrasi Akademik (BAA) STIE Nasional Banjarmasin. Dokumen ini sah dan diakui secara digital.</span>
            <span>Halaman 1 / 1</span>
          </div>

        </div>

      </div>
    </div>
  );
}
