import React from 'react';
import { Printer, Download, X, Award, GraduationCap, CheckCircle2, Building2 } from 'lucide-react';

export default function ReportPrintModal({
  isOpen,
  onClose,
  type = 'KHS', // 'KHS' | 'GRADEBOOK'
  student,
  prodis = [],
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
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDateFormatted = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const prodiObj = prodis.find(p => p.id === student?.prodiId);
  const studentProdiName = prodiObj ? prodiObj.namaProdi : 'S1 Manajemen';

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
                  Resmi STIE Nasional
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Format dokumen baku siap cetak printer atau simpan sebagai PDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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

        {/* CONTAINER LEMBAR DOKUMEN CETAK (ID: printable-report) */}
        <div id="printable-report" className="p-6 sm:p-10 text-slate-900 bg-white font-sans text-xs leading-relaxed max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0">
          
          {/* KOP SURAT RESMI LEMBAGA */}
          <div className="border-b-4 border-double border-slate-900 pb-3 mb-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 shrink-0 rounded-2xl bg-brand-900 text-amber-400 flex flex-col items-center justify-center font-black border-2 border-brand-800 shadow-sm print:shadow-none">
                <Building2 className="w-8 h-8" />
                <span className="text-[8px] tracking-tighter uppercase font-bold text-white">STIENAS</span>
              </div>
              <div className="flex-1 text-center pr-12">
                <h1 className="text-base sm:text-lg font-extrabold uppercase tracking-wide text-slate-950">
                  Sekolah Tinggi Ilmu Ekonomi (STIE) Nasional Banjarmasin
                </h1>
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mt-0.5">
                  Bagian Administrasi Akademik & Pengelolaan Kurikulum OBE
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Jl. Mayjen Sutoyo S. No. 126, Teluk Dalam, Banjarmasin, Kalimantan Selatan 70117
                </p>
                <p className="text-[9px] text-slate-500 italic">
                  Laman: www.stienas-bjm.ac.id • Email: akademik@stienas-bjm.ac.id • Telp: (0511) 3353287
                </p>
              </div>
            </div>
          </div>

          {/* =========================================================================
              TAMPILAN 1: KARTU HASIL STUDI (KHS) MAHASISWA
             ========================================================================= */}
          {type === 'KHS' && (
            <div className="space-y-4">
              {/* JUDUL DOKUMEN */}
              <div className="text-center space-y-0.5">
                <h2 className="text-sm sm:text-base font-black uppercase tracking-widest text-slate-950 underline decoration-slate-900 decoration-2 underline-offset-4">
                  Kartu Hasil Studi (KHS) Mahasiswa
                </h2>
                <p className="text-[11px] font-bold text-slate-700">
                  Tahun Akademik: {activeTa?.namaTa || '2026/2027 Ganjil'}
                </p>
              </div>

              {/* IDENTITAS MAHASISWA */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs print:bg-transparent print:border-slate-400">
                <div className="flex">
                  <span className="w-28 text-slate-500 print:text-slate-800">Nama Mahasiswa</span>
                  <span className="font-bold text-slate-900">: {student?.name || 'Mahasiswa'}</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-slate-500 print:text-slate-800">Program Studi</span>
                  <span className="font-semibold text-slate-900">: {studentProdiName}</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-slate-500 print:text-slate-800">Nomor Induk (NIM)</span>
                  <span className="font-bold font-mono text-slate-900">: {student?.nim || '-'}</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-slate-500 print:text-slate-800">Tahun Masuk / Smt</span>
                  <span className="font-semibold text-slate-900">
                    : Angkatan {student?.angkatan || 2026} (Semester {student?.semester || 1})
                  </span>
                </div>
              </div>

              {/* TABEL NILAI KHS */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-300 text-[11px] print:text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300 print:bg-slate-200">
                      <th className="border border-slate-300 p-2 text-center w-8">No</th>
                      <th className="border border-slate-300 p-2 w-20 text-center">Kode MK</th>
                      <th className="border border-slate-300 p-2">Mata Kuliah Kurikulum OBE</th>
                      <th className="border border-slate-300 p-2 text-center w-12">SKS</th>
                      <th className="border border-slate-300 p-2 text-center w-14">Nilai</th>
                      <th className="border border-slate-300 p-2 text-center w-14">Huruf</th>
                      <th className="border border-slate-300 p-2 text-center w-14">Bobot</th>
                      <th className="border border-slate-300 p-2 text-center w-16">Mutu (KxN)</th>
                      <th className="border border-slate-300 p-2 text-center w-24">Capaian OBE</th>
                      <th className="border border-slate-300 p-2 text-center w-20">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {khsRows.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="border border-slate-300 p-4 text-center text-slate-500 italic">
                          Belum ada kelas perkuliahan atau nilai yang terdaftar pada semester ini.
                        </td>
                      </tr>
                    ) : (
                      khsRows.map((row, idx) => {
                        const kxn = (row.sks * row.bobot).toFixed(2);
                        return (
                          <tr key={row.id || idx} className="hover:bg-slate-50">
                            <td className="border border-slate-300 p-1.5 text-center font-medium">{idx + 1}</td>
                            <td className="border border-slate-300 p-1.5 text-center font-mono font-bold text-slate-800">{row.kodeMk}</td>
                            <td className="border border-slate-300 p-1.5 font-semibold text-slate-900">
                              {row.namaMk}
                              <span className="text-[9px] text-slate-500 block font-normal">Dosen: {row.dosen} (Kelas {row.namaKelas})</span>
                            </td>
                            <td className="border border-slate-300 p-1.5 text-center font-semibold">{row.sks}</td>
                            <td className="border border-slate-300 p-1.5 text-center font-mono">{row.nilaiAkhir}</td>
                            <td className="border border-slate-300 p-1.5 text-center font-bold">{row.huruf}</td>
                            <td className="border border-slate-300 p-1.5 text-center">{row.bobot.toFixed(2)}</td>
                            <td className="border border-slate-300 p-1.5 text-center font-mono font-semibold">{kxn}</td>
                            <td className="border border-slate-300 p-1.5 text-center">
                              <span className="font-semibold text-slate-900">{row.cpmkPercent}</span>
                              <span className="text-[9px] text-slate-500 block">{row.cpmkStatus}</span>
                            </td>
                            <td className="border border-slate-300 p-1.5 text-center font-bold">
                              <span className={row.status === 'LULUS' ? 'text-emerald-700' : 'text-rose-700'}>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-400 print:bg-slate-200">
                      <td colSpan={3} className="border border-slate-300 p-2 text-right">TOTAL BEBAN STUDI & MUTU:</td>
                      <td className="border border-slate-300 p-2 text-center text-brand-900">{totalSks} SKS</td>
                      <td colSpan={3} className="border border-slate-300 p-2"></td>
                      <td className="border border-slate-300 p-2 text-center font-mono">{totalSksXBobot.toFixed(2)}</td>
                      <td className="border border-slate-300 p-2 text-center font-bold">{rataKetercapaianCpmk}%</td>
                      <td className="border border-slate-300 p-2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* STATISTIK AKADEMIK & INDEKS PRESTASI */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-brand-50 border border-brand-200 rounded-xl print:bg-slate-50 print:border-slate-300">
                <div className="text-center">
                  <div className="text-[10px] text-slate-600 font-semibold uppercase">Total SKS Diambil</div>
                  <div className="text-base font-black text-brand-900">{totalSks} SKS</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-slate-600 font-semibold uppercase">Total SKS x Bobot</div>
                  <div className="text-base font-black text-brand-900">{totalSksXBobot.toFixed(2)}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-slate-600 font-semibold uppercase">Indeks Prestasi Semester (IPS)</div>
                  <div className="text-base font-black text-emerald-800">{ipkSemester} / 4.00</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-slate-600 font-semibold uppercase">Ketercapaian Luaran OBE</div>
                  <div className="text-base font-black text-brand-900">{rataKetercapaianCpmk}% Terpenuhi</div>
                </div>
              </div>

              {/* KETERANGAN SKALA NILAI */}
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-[9px] text-slate-500 leading-tight">
                <strong>Pedoman Konversi Nilai Mutu STIE Nasional:</strong> A = 4.00 (≥85) • A- = 3.75 (80-84) • B+ = 3.50 (75-79) • B = 3.00 (70-74) • B- = 2.75 (65-69) • C+ = 2.50 (60-64) • C = 2.00 (55-59) • D = 1.00 (45-54) • E = 0.00 (&lt;45).
              </div>

              {/* BLOK TANDA TANGAN */}
              <div className="pt-6 grid grid-cols-3 text-center text-xs break-inside-avoid">
                <div className="space-y-16">
                  <div>
                    <p className="text-[10px] text-slate-500">Mengetahui,</p>
                    <p className="font-bold text-slate-900">Dosen Pembimbing Akademik</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 underline">Dra. Hj. Siti Rahmah, M.Si.</p>
                    <p className="text-[10px] text-slate-500 font-mono">NIDN: 1105087301</p>
                  </div>
                </div>

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
                    <p className="font-bold text-slate-900">Ketua Program Studi</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 underline">Dr. H. Muhammad Ramli, S.E., M.M.</p>
                    <p className="text-[10px] text-slate-500 font-mono">NIDN: 1102046801</p>
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
                  <span className="font-semibold text-slate-900">: Kelas {classData?.namaKelas || 'A'} • {classData?.ruang || 'Lab'}</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-slate-500 print:text-slate-800">Dosen Pengampu</span>
                  <span className="font-bold text-slate-900">: {classData?.namaDosen || '-'}</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-slate-500 print:text-slate-800">Jadwal Kuliah</span>
                  <span className="font-semibold text-slate-900">: {classData?.hari || 'Senin'}, {classData?.jam || '08:00 WITA'}</span>
                </div>
              </div>

              {/* TABEL NILAI SELURUH MAHASISWA */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-300 text-[11px] print:text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300 print:bg-slate-200">
                      <th className="border border-slate-300 p-2 text-center w-8">No</th>
                      <th className="border border-slate-300 p-2 w-24 text-center">NIM</th>
                      <th className="border border-slate-300 p-2">Nama Lengkap Mahasiswa</th>
                      <th className="border border-slate-300 p-2 text-center w-14">Tugas (20%)</th>
                      <th className="border border-slate-300 p-2 text-center w-14">Kuis (15%)</th>
                      <th className="border border-slate-300 p-2 text-center w-14">UTS (30%)</th>
                      <th className="border border-slate-300 p-2 text-center w-14">UAS (35%)</th>
                      <th className="border border-slate-300 p-2 text-center w-14">Akhir</th>
                      <th className="border border-slate-300 p-2 text-center w-14">Huruf</th>
                      <th className="border border-slate-300 p-2 text-center w-14">Bobot</th>
                      <th className="border border-slate-300 p-2 text-center w-24">Luaran CPMK</th>
                      <th className="border border-slate-300 p-2 text-center w-20">Kelulusan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrolledRows.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="border border-slate-300 p-4 text-center text-slate-500 italic">
                          Belum ada mahasiswa yang terdaftar di kelas perkuliahan ini.
                        </td>
                      </tr>
                    ) : (
                      enrolledRows.map((row, idx) => (
                        <tr key={row.nim || idx} className="hover:bg-slate-50">
                          <td className="border border-slate-300 p-1.5 text-center font-medium">{idx + 1}</td>
                          <td className="border border-slate-300 p-1.5 text-center font-mono font-bold text-slate-800">{row.nim}</td>
                          <td className="border border-slate-300 p-1.5 font-semibold text-slate-900">{row.nama}</td>
                          <td className="border border-slate-300 p-1.5 text-center font-mono">{row.tugas}</td>
                          <td className="border border-slate-300 p-1.5 text-center font-mono">{row.kuis}</td>
                          <td className="border border-slate-300 p-1.5 text-center font-mono">{row.uts}</td>
                          <td className="border border-slate-300 p-1.5 text-center font-mono">{row.uas}</td>
                          <td className="border border-slate-300 p-1.5 text-center font-mono font-bold text-brand-900">{row.akhir}</td>
                          <td className="border border-slate-300 p-1.5 text-center font-black">{row.huruf}</td>
                          <td className="border border-slate-300 p-1.5 text-center font-mono">{row.bobot}</td>
                          <td className="border border-slate-300 p-1.5 text-center">
                            <span className="font-semibold text-slate-900">{row.cpmkPercent}</span>
                            <span className="text-[9px] text-slate-500 block">{row.cpmkStatus}</span>
                          </td>
                          <td className="border border-slate-300 p-1.5 text-center font-bold">
                            <span className={row.status === 'LULUS' ? 'text-emerald-700' : 'text-rose-700'}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* REKAPITULASI STATISTIK KELAS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-brand-50 border border-brand-200 rounded-xl print:bg-slate-50 print:border-slate-300">
                <div className="text-center">
                  <div className="text-[10px] text-slate-600 font-semibold uppercase">Peserta Terdaftar</div>
                  <div className="text-base font-black text-brand-900">{totalStudents} Mahasiswa</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-slate-600 font-semibold uppercase">Rata-rata Kelas</div>
                  <div className="text-base font-black text-brand-900">{avgScore} / 100</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-slate-600 font-semibold uppercase">Tingkat Kelulusan</div>
                  <div className="text-base font-black text-emerald-800">{passRate}% ({passedStudents} Mhs)</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-slate-600 font-semibold uppercase">Standar Kurikulum</div>
                  <div className="text-base font-black text-brand-900">OBE &amp; 16 Sesi RPS</div>
                </div>
              </div>

              {/* BLOK TANDA TANGAN RESMI DOSEN */}
              <div className="pt-6 grid grid-cols-2 text-center text-xs break-inside-avoid">
                <div className="space-y-16">
                  <div>
                    <p className="text-[10px] text-slate-500">Mengetahui,</p>
                    <p className="font-bold text-slate-900">Ketua Program Studi</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 underline">Dr. H. Muhammad Ramli, S.E., M.M.</p>
                    <p className="text-[10px] text-slate-500 font-mono">NIDN: 1102046801</p>
                  </div>
                </div>

                <div className="space-y-16">
                  <div>
                    <p className="text-[10px] text-slate-500">Banjarmasin, {currentDateFormatted}</p>
                    <p className="font-bold text-slate-900">Dosen Pengampu Mata Kuliah</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 underline">{classData?.namaDosen || 'Dosen Pengampu'}</p>
                    <p className="text-[10px] text-slate-500 font-mono">NIDN: {classData?.dosenNidn || '1105087301'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CATATAN RESMI FOOTER */}
          <div className="mt-8 pt-2 border-t border-slate-200 text-[9px] text-slate-400 flex justify-between items-center print:text-slate-500">
            <span>Dicetak secara otomatis melalui Sistem LMS &amp; Akademik STIE Nasional Banjarmasin. Dokumen ini sah dan diakui secara digital.</span>
            <span>Halaman 1 / 1</span>
          </div>

        </div>

      </div>
    </div>
  );
}
