import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  getClasses, 
  updateStudentGrade, 
  getUsers, 
  getTahunAkademik, 
  getMataKuliah,
  subscribeToDataSync,
  isClassAssignedToLecturer 
} from '../firebase/firestoreService';
import { 
  calculateFinalGrade, 
  getGradeBadgeColor, 
  GRADE_OPTIONS, 
  formatGradeWithBobot,
  GRADE_DETAILS,
  OBE_BENCHMARK_PERCENT 
} from '../utils/gradeCalculator';
import { showSuccessAlert, showErrorAlert } from '../utils/alert';
import { exportToCSV } from '../utils/csvExporter';
import { 
  Award, 
  Download, 
  BookOpen, 
  Edit3, 
  Clock, 
  Calculator,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  User,
  Check,
  AlertCircle,
  Lock,
  Calendar
} from 'lucide-react';

export default function GradebookPage({ initialClassId }) {
  const { user, isAdmin, isDosen, isMahasiswa } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(initialClassId || '');
  const [usersList, setUsersList] = useState([]);
  const [tas, setTas] = useState([]);
  const [mks, setMks] = useState([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit Modal State (Dosen / Admin)
  const [editingStudent, setEditingStudent] = useState(null);
  const [overrideGrade, setOverrideGrade] = useState('AUTO'); // 'AUTO' atau 'A', 'B', 'B+', 'C', 'C+', 'D', 'E', 'T'
  const [scoresForm, setScoresForm] = useState({
    nilaiTugas: 80,
    nilaiKuis: 80,
    nilaiUts: 80,
    nilaiUas: 80
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [cls, usrs, tList, mList] = await Promise.all([
        getClasses(),
        getUsers(),
        getTahunAkademik(),
        getMataKuliah()
      ]);
      setClasses(cls);
      setUsersList(usrs);
      setTas(tList);
      setMks(mList);

      const activeTa = tList.find(t => t.isActive) || tList[0];
      const targetSemId = selectedSemesterId || activeTa?.id || 'ALL';
      if (!selectedSemesterId && activeTa) {
        setSelectedSemesterId(activeTa.id);
      }

      // 1. Filter kelas penugasan BAA untuk Dosen
      const available = isDosen 
        ? cls.filter(c => isClassAssignedToLecturer(c, user, mList))
        : cls;

      // 2. Filter kelas berdasarkan semester
      const semTarget = tList.find(t => t.id === targetSemId);
      const semFiltered = targetSemId && targetSemId !== 'ALL'
        ? available.filter(c => c.tahunAkademikId === targetSemId || (semTarget && c.namaTa === semTarget.namaTa))
        : available;

      if (initialClassId && available.some(c => c.id === initialClassId)) {
        setSelectedClassId(initialClassId);
        const targetC = available.find(c => c.id === initialClassId);
        if (targetC?.tahunAkademikId) {
          setSelectedSemesterId(targetC.tahunAkademikId);
        }
      } else if (semFiltered.length > 0 && (!selectedClassId || !semFiltered.some(c => c.id === selectedClassId))) {
        setSelectedClassId(semFiltered[0].id);
      } else if (semFiltered.length === 0 && available.length > 0 && (!selectedClassId || !available.some(c => c.id === selectedClassId))) {
        setSelectedClassId(available[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToDataSync(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [user]);

  const activeTa = tas.find(t => t.isActive);
  const selectedTa = tas.find(t => t.id === selectedSemesterId);

  // Filter kelas Dosen sesuai penugasan BAA
  const myAssignedClasses = isDosen 
    ? classes.filter(c => isClassAssignedToLecturer(c, user, mks))
    : classes;

  // Filter kelas sesuai semester yang dipilih
  const displayedClasses = myAssignedClasses.filter(c => {
    if (selectedSemesterId && selectedSemesterId !== 'ALL') {
      return c.tahunAkademikId === selectedSemesterId || (selectedTa && c.namaTa === selectedTa.namaTa);
    }
    return true;
  });

  const selectedClass = displayedClasses.find(c => c.id === selectedClassId) || displayedClasses[0];
  const selectedClassTa = tas.find(t => t.id === selectedClass?.tahunAkademikId || t.namaTa === selectedClass?.namaTa);
  const isClassTaActive = selectedClassTa ? selectedClassTa.isActive : false;
  const isDosenOfClass = isDosen && isClassAssignedToLecturer(selectedClass, user, mks);
  const canEditGrades = isAdmin ? true : (isDosenOfClass && isClassTaActive);

  // Handler ganti semester
  const handleSemesterChange = (newSemId) => {
    setSelectedSemesterId(newSemId);
    const targetSem = tas.find(t => t.id === newSemId);
    const classesInSem = myAssignedClasses.filter(c => {
      if (newSemId && newSemId !== 'ALL') {
        return c.tahunAkademikId === newSemId || (targetSem && c.namaTa === targetSem.namaTa);
      }
      return true;
    });
    if (classesInSem.length > 0) {
      setSelectedClassId(classesInSem[0].id);
    } else {
      setSelectedClassId('');
    }
  };

  const handleOpenEdit = (mhsId, existingGrade) => {
    if (!canEditGrades) {
      showErrorAlert("Akses Penilaian Ditutup", "Tahun akademik untuk kelas ini telah ditutup oleh Bagian Akademik (BAA). Dosen tidak dapat mengubah nilai.");
      return;
    }
    const rawGrade = existingGrade || {};
    setEditingStudent({ mhsId, ...rawGrade });
    setOverrideGrade(rawGrade.overrideGrade || (rawGrade.isOverridden ? rawGrade.nilaiHuruf : 'AUTO'));
    setScoresForm({
      nilaiTugas: rawGrade.nilaiTugas || 0,
      nilaiKuis: rawGrade.nilaiKuis || 0,
      nilaiUts: rawGrade.nilaiUts || 0,
      nilaiUas: rawGrade.nilaiUas || 0
    });
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    if (!editingStudent || !selectedClassId) return;

    if (!canEditGrades) {
      showErrorAlert("Akses Penilaian Ditutup", "Tahun akademik untuk kelas ini telah ditutup oleh Bagian Akademik (BAA). Dosen tidak dapat mengubah nilai.");
      return;
    }

    try {
      const isManual = overrideGrade !== 'AUTO';
      await updateStudentGrade(
        selectedClassId, 
        editingStudent.mhsId, 
        {
          ...scoresForm,
          overrideGrade: isManual ? overrideGrade : null,
          isOverridden: isManual
        }, 
        user
      );
      setEditingStudent(null);
      showSuccessAlert(
        'Nilai OBE Berhasil Disimpan',
        `Nilai mahasiswa ${editingStudent.nama || ''} telah diperbarui dengan mutu ${isManual ? formatGradeWithBobot(overrideGrade) : 'kalkulasi otomatis'}.`
      );
      await loadData();
    } catch (err) {
      showErrorAlert("Gagal", err.message);
    }
  };

  // Ubah cepat nilai mutu langsung dari dropdown tabel kelas
  const handleQuickChangeGrade = async (mhsId, rawGrade, newGradeLetter) => {
    if (!selectedClassId) return;
    if (!canEditGrades) {
      showErrorAlert("Akses Penilaian Ditutup", "Tahun akademik untuk kelas ini telah ditutup oleh Bagian Akademik (BAA). Dosen tidak dapat mengubah nilai.");
      return;
    }
    try {
      await updateStudentGrade(
        selectedClassId,
        mhsId,
        {
          nilaiTugas: rawGrade?.nilaiTugas || 0,
          nilaiKuis: rawGrade?.nilaiKuis || 0,
          nilaiUts: rawGrade?.nilaiUts || 0,
          nilaiUas: rawGrade?.nilaiUas || 0,
          overrideGrade: newGradeLetter,
          isOverridden: true
        },
        user
      );
      showSuccessAlert(
        'Nilai Mutu Berhasil Diubah',
        `Nilai mutu mahasiswa berhasil diubah ke ${formatGradeWithBobot(newGradeLetter)}.`
      );
      await loadData();
    } catch (err) {
      showErrorAlert('Gagal', err.message);
    }
  };

  // -------------------------------------------------------------
  // LOGIKA KHUSUS MAHASISWA: REKAP KHS HANYA UNTUK SEMESTER AKTIF BAA
  // -------------------------------------------------------------
  const myEnrolledClasses = classes.filter(c => {
    const isEnrolled = (c.enrolledStudents || []).includes(user?.uid);
    if (!isEnrolled) return false;
    // Mahasiswa hanya melihat nilai pada semester yang aktif dibuka oleh BAA
    if (activeTa) {
      return c.tahunAkademikId === activeTa.id || c.namaTa === activeTa.namaTa;
    }
    return false;
  });

  // Kalkulasi total SKS dan IPK Mahasiswa
  let totalSks = 0;
  let totalSksXBobot = 0;

  const myKhsRows = myEnrolledClasses.map((cls, idx) => {
    const rawGrade = (cls.grades && cls.grades[user.uid]) || {};
    const calculated = calculateFinalGrade(
      rawGrade.nilaiTugas || 0,
      rawGrade.nilaiKuis || 0,
      rawGrade.nilaiUts || 0,
      rawGrade.nilaiUas || 0,
      rawGrade.overrideGrade || (rawGrade.isOverridden ? rawGrade.nilaiHuruf : null)
    );

    const sks = cls.sks || 3;
    totalSks += sks;
    totalSksXBobot += (sks * calculated.ipk);

    return {
      no: idx + 1,
      id: cls.id,
      kodeMk: cls.kodeMk,
      namaMk: cls.namaMk,
      sks: sks,
      namaKelas: cls.namaKelas,
      dosen: cls.namaDosen,
      tugas: calculated.nilaiTugas,
      kuis: calculated.nilaiKuis,
      uts: calculated.nilaiUts,
      uas: calculated.nilaiUas,
      nilaiAkhir: calculated.nilaiAkhir,
      huruf: calculated.nilaiHuruf,
      bobot: calculated.ipk,
      gradeLabel: calculated.gradeLabel,
      status: calculated.statusKelulusan,
      cpmkPercent: `${calculated.nilaiAkhir}%`,
      cpmkStatus: calculated.cpmkStatus,
      cpmkColor: calculated.cpmkColor,
      cpmkPassed: calculated.cpmkPassed,
      isTunda: calculated.isTunda
    };
  });

  const ipkSemester = totalSks > 0 ? (totalSksXBobot / totalSks).toFixed(2) : '0.00';
  const rataKetercapaianCpmk = myKhsRows.length > 0 
    ? Math.round(myKhsRows.reduce((acc, curr) => acc + parseFloat(curr.cpmkPercent), 0) / myKhsRows.length) 
    : 0;

  // Ekspor CSV untuk Mahasiswa (KHS Pribadi Berstandar OBE)
  const handleExportMyKHS = () => {
    const headers = [
      { key: 'no', label: 'No' },
      { key: 'kodeMk', label: 'Kode MK' },
      { key: 'namaMk', label: 'Mata Kuliah' },
      { key: 'sks', label: 'SKS' },
      { key: 'namaKelas', label: 'Kelas' },
      { key: 'dosen', label: 'Dosen Pengampu' },
      { key: 'tugas', label: 'Tugas (20%)' },
      { key: 'kuis', label: 'Kuis (15%)' },
      { key: 'uts', label: 'UTS (30%)' },
      { key: 'uas', label: 'UAS (35%)' },
      { key: 'nilaiAkhir', label: 'Nilai Akhir' },
      { key: 'gradeLabel', label: 'Huruf Mutu & Bobot' },
      { key: 'bobot', label: 'Bobot Mutu' },
      { key: 'cpmkPercent', label: 'Ketercapaian CPMK (OBE)' },
      { key: 'cpmkStatus', label: 'Status Luaran OBE' },
      { key: 'status', label: 'Status Kelulusan' }
    ];
    exportToCSV(`KHS_OBE_${user.nim || 'Mahasiswa'}_STIE_Nasional`, headers, myKhsRows);
  };

  // Ekspor CSV untuk Dosen/Admin per Kelas
  const handleExportClassCSV = () => {
    if (!selectedClass) return;

    const enrolledMhs = (selectedClass.enrolledStudents || []).map(mhsId => {
      const u = usersList.find(usr => usr.uid === mhsId) || {};
      const rawGrade = (selectedClass.grades && selectedClass.grades[mhsId]) || {};
      const g = calculateFinalGrade(
        rawGrade.nilaiTugas || 0,
        rawGrade.nilaiKuis || 0,
        rawGrade.nilaiUts || 0,
        rawGrade.nilaiUas || 0,
        rawGrade.overrideGrade || (rawGrade.isOverridden ? rawGrade.nilaiHuruf : null)
      );
      return {
        nim: u.nim || u.username || '-',
        nama: u.name || '-',
        tugas: g.nilaiTugas || 0,
        kuis: g.nilaiKuis || 0,
        uts: g.nilaiUts || 0,
        uas: g.nilaiUas || 0,
        akhir: g.nilaiAkhir || 0,
        huruf: g.gradeLabel || g.nilaiHuruf || 'E',
        bobot: g.ipk.toFixed(2).replace('.', ','),
        cpmkPercent: `${g.nilaiAkhir}%`,
        cpmkStatus: g.cpmkStatus,
        status: g.statusKelulusan || 'TIDAK LULUS'
      };
    });

    const headers = [
      { key: 'nim', label: 'NIM' },
      { key: 'nama', label: 'Nama Mahasiswa' },
      { key: 'tugas', label: 'Tugas (20%)' },
      { key: 'kuis', label: 'Kuis (15%)' },
      { key: 'uts', label: 'UTS (30%)' },
      { key: 'uas', label: 'UAS (35%)' },
      { key: 'akhir', label: 'Nilai Akhir' },
      { key: 'huruf', label: 'Huruf Mutu & Bobot' },
      { key: 'bobot', label: 'Bobot Mutu' },
      { key: 'cpmkPercent', label: 'Ketercapaian CPMK (OBE)' },
      { key: 'cpmkStatus', label: 'Status Luaran OBE' },
      { key: 'status', label: 'Status Kelulusan' }
    ];

    exportToCSV(`Buku_Nilai_OBE_${selectedClass.kodeMk}_Kelas_${selectedClass.namaKelas}`, headers, enrolledMhs);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-xs text-slate-500">
        <Clock className="w-5 h-5 animate-spin mr-2 text-brand-600" />
        Memuat data Buku Nilai / KHS...
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: KHUSUS MAHASISWA (KHS LENGKAP TANPA DROPDOWN PILIH KELAS)
  // =========================================================================
  if (isMahasiswa) {
    if (!activeTa) {
      return (
        <div className="min-h-[360px] flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-rose-200 p-8 max-w-md text-center shadow-lg space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">Semester Perkuliahan Ditutup</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Saat ini belum ada Tahun Akademik / Semester yang dibuka oleh Bagian Administrasi Akademik (BAA). Kartu Hasil Studi (KHS) dan rekapitulasi penilaian berjalan tidak dapat diakses hingga semester baru resmi dibuka oleh BAA.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        
        {/* Header Mahasiswa */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-brand-700" />
              Kartu Hasil Studi (KHS) Mahasiswa
            </h2>
            <p className="text-xs text-slate-500">
              Rekapitulasi resmi seluruh kelas dan nilai mata kuliah yang Anda tempuh pada semester ini
            </p>
          </div>

          <button
            onClick={handleExportMyKHS}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow transition-colors"
          >
            <Download className="w-4 h-4" />
            Cetak / Unduh KHS (CSV)
          </button>
        </div>

        {/* Profil Mahasiswa Banner */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center space-x-3.5">
            <img 
              src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Mhs')}&background=1e3a8a&color=fff`}
              alt={user.name} 
              className="w-12 h-12 rounded-full object-cover border-2 border-brand-200 shadow-sm"
            />
            <div>
              <h3 className="font-extrabold text-base text-slate-900">{user.name}</h3>
              <div className="text-xs text-slate-500 flex flex-wrap gap-2 mt-0.5">
                <span>NIM: <strong className="font-mono text-slate-800">{user.nim || '221011001'}</strong></span>
                <span>•</span>
                <span>Program Studi: <strong className="text-slate-800">S1 Manajemen</strong></span>
                <span>•</span>
                <span>Semester: <strong className="text-slate-800">5 (Ganjil)</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs bg-brand-50 text-brand-900 px-3 py-1.5 rounded-xl border border-brand-200">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="font-bold">TA {activeTa.namaTa} (Aktif BAA)</span>
          </div>
        </div>

        {/* Ringkasan Statistik KHS & Portofolio OBE */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 font-medium">Mata Kuliah Diambil</div>
            <div className="text-2xl font-black text-brand-900 mt-1">{myKhsRows.length} MK</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Seluruh Kelas Terdaftar</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 font-medium">Total Beban SKS</div>
            <div className="text-2xl font-black text-blue-700 mt-1">{totalSks} SKS</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Beban Semester Ini</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 font-medium">IPK Semester Sementara</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{ipkSemester}</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Skala Maksimal 4.00</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 font-medium">Rata-rata Capaian CPMK (OBE)</div>
            <div className="text-2xl font-black text-purple-800 mt-1">{rataKetercapaianCpmk}%</div>
            <div className="text-[10px] text-purple-600 font-semibold mt-0.5">Target Luaran OBE ≥ 70% Terpenuhi</div>
          </div>
        </div>

        {/* Banner Portofolio Kurikulum OBE (Outcome-Based Education) */}
        <div className="bg-gradient-to-r from-brand-900 to-slate-900 rounded-2xl p-5 text-white shadow-md border border-brand-800">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-white/10">
            <div>
              <span className="text-[10px] font-bold tracking-widest uppercase bg-gold-400/20 text-gold-300 px-2.5 py-0.5 rounded-full border border-gold-400/30">
                Portofolio Capaian OBE Mahasiswa
              </span>
              <h3 className="font-bold text-base mt-1">Pemenuhan Capaian Pembelajaran Lulusan (CPL)</h3>
            </div>
            <span className="text-xs text-slate-300">Standar Akreditasi Internasional & LAMEMBA</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4 text-xs">
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="text-slate-400 text-[11px]">CPL-01: Sikap & Etika</div>
              <div className="text-base font-bold text-emerald-400 mt-0.5">92% (Tercapai)</div>
              <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="text-slate-400 text-[11px]">CPL-02: Teori & Konsep</div>
              <div className="text-base font-bold text-blue-400 mt-0.5">88% (Tercapai)</div>
              <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-blue-400 h-full rounded-full" style={{ width: '88%' }}></div>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="text-slate-400 text-[11px]">CPL-03: Analisis Kasus</div>
              <div className="text-base font-bold text-amber-400 mt-0.5">85% (Tercapai)</div>
              <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="text-slate-400 text-[11px]">CPL-04: Keputusan Manajerial</div>
              <div className="text-base font-bold text-purple-400 mt-0.5">89% (Tercapai)</div>
              <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-purple-400 h-full rounded-full" style={{ width: '89%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabel KHS Lengkap Seluruh Kelas Berstandar OBE */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
            <span className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-brand-700" />
              Daftar Nilai Lengkap & Ketercapaian Luaran OBE ({myKhsRows.length} Kelas)
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Bobot Asesmen: Tugas (20%) • Kuis (15%) • UTS (30%) • UAS (35%)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5 text-center">No</th>
                  <th className="p-3.5">Kode MK</th>
                  <th className="p-3.5">Nama Mata Kuliah</th>
                  <th className="p-3.5 text-center">SKS</th>
                  <th className="p-3.5">Dosen Pengampu</th>
                  <th className="p-3.5 text-center">Tugas (20%)</th>
                  <th className="p-3.5 text-center">Kuis (15%)</th>
                  <th className="p-3.5 text-center">UTS (30%)</th>
                  <th className="p-3.5 text-center">UAS (35%)</th>
                  <th className="p-3.5 text-center">Nilai Akhir</th>
                  <th className="p-3.5 text-center">Huruf</th>
                  <th className="p-3.5 text-center">Bobot</th>
                  <th className="p-3.5 text-center">Capaian CPMK (OBE)</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myKhsRows.length === 0 ? (
                  <tr>
                    <td colSpan="14" className="p-8 text-center text-slate-400 italic">
                      Anda belum terdaftar pada mata kuliah apapun pada semester ini.
                    </td>
                  </tr>
                ) : (
                  myKhsRows.map(row => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 text-center font-mono text-slate-500">{row.no}</td>
                      <td className="p-3.5 font-mono font-bold text-brand-900">{row.kodeMk}</td>
                      <td className="p-3.5 font-bold text-slate-900">
                        {row.namaMk}
                        <span className="ml-1.5 text-[10px] font-medium text-slate-400 font-mono">(Kelas {row.namaKelas})</span>
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-700">{row.sks}</td>
                      <td className="p-3.5 text-slate-600">{row.dosen}</td>
                      <td className="p-3.5 text-center font-mono text-slate-700">{row.tugas}</td>
                      <td className="p-3.5 text-center font-mono text-slate-700">{row.kuis}</td>
                      <td className="p-3.5 text-center font-mono text-slate-700">{row.uts}</td>
                      <td className="p-3.5 text-center font-mono text-slate-700">{row.uas}</td>
                      <td className="p-3.5 text-center font-mono font-extrabold text-sm text-brand-900">
                        {row.nilaiAkhir}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-xs border inline-flex items-center gap-1 ${getGradeBadgeColor(row.huruf)}`}>
                          {row.gradeLabel || formatGradeWithBobot(row.huruf, row.bobot)}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-800 font-mono">
                        {row.bobot.toFixed(2).replace('.', ',')}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${row.cpmkColor}`}>
                            {row.cpmkPercent} {row.cpmkPassed ? '✓' : row.isTunda ? '⏳' : '✗'}
                          </span>
                          <span className="text-[9px] text-slate-500 mt-0.5 max-w-[120px] text-center truncate" title={row.cpmkStatus}>
                            {row.cpmkStatus}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          row.cpmkPassed
                            ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                            : row.isTunda
                            ? 'text-purple-700 bg-purple-50 border border-purple-200'
                            : 'text-amber-700 bg-amber-50 border border-amber-200'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    );
  }

  // =========================================================================
  // VIEW 2: UNTUK DOSEN & ADMIN (PILIH KELAS & KELOLA BUKU NILAI)
  // =========================================================================
  const enrolledStudents = (selectedClass?.enrolledStudents || []).map(mhsId => {
    const u = usersList.find(usr => usr.uid === mhsId) || {};
    const rawGrade = (selectedClass.grades && selectedClass.grades[mhsId]) || {};
    const grade = calculateFinalGrade(
      rawGrade.nilaiTugas || 0,
      rawGrade.nilaiKuis || 0,
      rawGrade.nilaiUts || 0,
      rawGrade.nilaiUas || 0,
      rawGrade.overrideGrade || (rawGrade.isOverridden ? rawGrade.nilaiHuruf : null)
    );
    return {
      mhsId,
      user: u,
      grade,
      rawGrade
    };
  });

  const previewCalc = calculateFinalGrade(
    scoresForm.nilaiTugas,
    scoresForm.nilaiKuis,
    scoresForm.nilaiUts,
    scoresForm.nilaiUas,
    overrideGrade
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-brand-700" />
            Buku Nilai (Gradebook) OBE & Asesmen Otentik
          </h2>
          <p className="text-xs text-slate-500">
            Penilaian berbasis Capaian Pembelajaran Mata Kuliah (CPMK) • Standar Kurikulum OBE STIE Nasional
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportClassCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow transition-colors"
          >
            <Download className="w-4 h-4" />
            Ekspor Nilai OBE (CSV)
          </button>
        </div>
      </div>

      {/* Selektor Semester BAA (Tahun Akademik) & Sinkronisasi Penugasan Dosen */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-700 shrink-0" />
          <span className="font-semibold text-slate-700">Tahun Akademik / Semester BAA:</span>
          <select
            value={selectedSemesterId}
            onChange={e => handleSemesterChange(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 font-bold bg-white text-slate-800"
          >
            <option value="ALL">Semua Semester ({tas.length} Periode)</option>
            {tas.map(ta => (
              <option key={ta.id} value={ta.id}>
                {ta.namaTa} {ta.isActive ? '• [DIBUKA / Semester Berjalan]' : '• [DITUTUP / Arsip]'}
              </option>
            ))}
          </select>
        </div>

        {/* Indikator Lencana Penugasan BAA */}
        {isDosen && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-900 shadow-sm">
            <BookOpen className="w-4 h-4 text-blue-700" />
            <span>Kelas Penugasan BAA: {displayedClasses.length} Kelas</span>
          </div>
        )}
      </div>

      {/* Class Selector Bar (Khusus Dosen / Admin) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <BookOpen className="w-4 h-4 text-brand-700" />
          <span className="font-semibold text-slate-700">Pilih Kelas Kuliah:</span>
          <select
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            disabled={displayedClasses.length === 0}
            className="px-3 py-1.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-white font-semibold text-brand-900 min-w-[280px]"
          >
            {displayedClasses.length === 0 ? (
              <option value="">(Belum ada kelas yang didaftarkan BAA pada semester ini)</option>
            ) : (
              displayedClasses.map(c => {
                const cTa = tas.find(t => t.id === c.tahunAkademikId || t.namaTa === c.namaTa);
                const isCActive = cTa ? cTa.isActive : false;
                return (
                  <option key={c.id} value={c.id}>
                    {c.kodeMk} - {c.namaMk} (Kelas {c.namaKelas}) {isCActive ? '• [DIBUKA / Aktif BAA]' : '• [DITUTUP BAA]'}
                  </option>
                );
              })
            )}
          </select>
        </div>

        <div className="text-slate-500 text-[11px] font-medium">
          {selectedClass ? (
            <>Dosen: <strong className="text-slate-800">{selectedClass.namaDosen}</strong> • {selectedClass.sks} SKS • <span className="text-brand-700 font-bold">16 Sesi RPS OBE</span></>
          ) : (
            <span className="text-amber-700 font-medium">Belum ada kelas penugasan BAA untuk semester ini</span>
          )}
        </div>
      </div>

      {/* Banner jika belum ada kelas penugasan BAA untuk semester ini */}
      {displayedClasses.length === 0 && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm mb-1">
            Belum Ada Kelas Penugasan BAA
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {isDosen
              ? `Belum ada kelas perkuliahan yang didaftarkan atau ditugaskan oleh Bagian Administrasi Akademik (BAA) kepada akun Anda untuk periode ${selectedTa ? selectedTa.namaTa : 'semester ini'}. Silakan berkoordinasi dengan BAA untuk penjadwalan mengajar dan pembukaan buku nilai.`
              : `Belum ada kelas perkuliahan yang dijadwalkan oleh Bagian Akademik (BAA) untuk periode ${selectedTa ? selectedTa.namaTa : 'semester ini'}.`}
          </p>
        </div>
      )}

      {/* Peringatan jika semester kelas ini ditutup oleh BAA */}
      {selectedClass && !isClassTaActive && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-800 shadow-sm animate-in fade-in">
          <Lock className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <span className="font-bold text-sm block mb-0.5">Semester Perkuliahan Ditutup oleh BAA</span>
            Tahun akademik untuk kelas <strong>{selectedClass?.namaMk} ({selectedClass?.namaKelas})</strong> saat ini berstatus <strong>DITUTUP</strong>. Penilaian berada dalam status arsip terkunci (read-only) dan tidak dapat diubah oleh dosen pengampu.
          </div>
        </div>
      )}

      {/* OBE Assessment Rubric & CPMK Alignment Card */}
      {selectedClass && (
        <>
          <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gold-400/20 text-gold-300 border border-gold-400/30 uppercase">
              Matriks Asesmen Otentik OBE
            </span>
            <span className="font-bold">Pemetaan Bobot Penilaian ke Capaian Pembelajaran:</span>
          </div>
          <div className="text-[11px] text-emerald-400 font-bold">
            Target Ketercapaian Ambang Batas Minimal: ≥ 70% (Lulus Standar OBE)
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px]">
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
            <div className="font-bold text-amber-400">Tugas (20%) - Formatif</div>
            <div className="text-slate-300 text-[10px] mt-0.5">Sub-CPMK: Analisis Studi Kasus & Portofolio Drive</div>
          </div>
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
            <div className="font-bold text-blue-400">Kuis (15%) - Formatif</div>
            <div className="text-slate-300 text-[10px] mt-0.5">Sub-CPMK: Penguasaan Konsep & Teori Dasar</div>
          </div>
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
            <div className="font-bold text-purple-400">UTS (30%) - Sumatif</div>
            <div className="text-slate-300 text-[10px] mt-0.5">CPMK-1 & 2: Evaluasi Menyeluruh Tengah Semester (P8)</div>
          </div>
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
            <div className="font-bold text-emerald-400">UAS (35%) - Proyek Akhir</div>
            <div className="text-slate-300 text-[10px] mt-0.5">CPMK-3: Laporan Komprehensif & Capstone Bisnis (P16)</div>
          </div>
        </div>
      </div>

      {/* Grade Table with OBE CPMK Columns */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">NIM</th>
                <th className="p-3.5">Nama Mahasiswa</th>
                <th className="p-3.5 text-center">Tugas (20%)</th>
                <th className="p-3.5 text-center">Kuis (15%)</th>
                <th className="p-3.5 text-center">UTS (30%)</th>
                <th className="p-3.5 text-center">UAS (35%)</th>
                <th className="p-3.5 text-center">Nilai Akhir</th>
                <th className="p-3.5 text-center">Mutu / Bobot</th>
                <th className="p-3.5 text-center">Capaian CPMK (%)</th>
                <th className="p-3.5 text-center">Status</th>
                {canEditGrades && <th className="p-3.5 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enrolledStudents.length === 0 ? (
                <tr>
                  <td colSpan="11" className="p-8 text-center text-slate-400 italic">
                    Belum ada mahasiswa yang terdaftar di kelas perkuliahan ini.
                  </td>
                </tr>
              ) : (
                enrolledStudents.map(item => {
                  const g = item.grade;
                  const cpmkPercent = g.nilaiAkhir || 0;

                  return (
                    <tr key={item.mhsId} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-700">
                        {item.user.nim || item.user.username || '-'}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-900">
                        {item.user.name}
                      </td>
                      <td className="p-3.5 text-center font-mono text-slate-700">{g.nilaiTugas}</td>
                      <td className="p-3.5 text-center font-mono text-slate-700">{g.nilaiKuis}</td>
                      <td className="p-3.5 text-center font-mono text-slate-700">{g.nilaiUts}</td>
                      <td className="p-3.5 text-center font-mono text-slate-700">{g.nilaiUas}</td>
                      <td className="p-3.5 text-center font-mono font-bold text-base text-brand-900">
                        {g.nilaiAkhir}
                      </td>
                      <td className="p-3.5 text-center">
                        {canEditGrades ? (
                          <div className="inline-flex items-center">
                            <select
                              value={g.nilaiHuruf}
                              onChange={(e) => handleQuickChangeGrade(item.mhsId, item.rawGrade, e.target.value)}
                              className={`px-2.5 py-1 rounded-lg font-bold text-xs border shadow-sm cursor-pointer outline-none focus:ring-2 focus:ring-brand-500 transition-all ${getGradeBadgeColor(g.nilaiHuruf)}`}
                              title="Ubah Nilai Mutu & Bobot Mahasiswa"
                            >
                              {GRADE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value} className="bg-white text-slate-900 font-semibold">
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-full font-bold text-xs border ${getGradeBadgeColor(g.nilaiHuruf)}`}>
                            {g.gradeLabel || formatGradeWithBobot(g.nilaiHuruf, g.ipk)}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            g.cpmkPassed 
                              ? 'text-emerald-800 bg-emerald-50 border-emerald-300' 
                              : g.isTunda
                              ? 'text-purple-700 bg-purple-50 border-purple-200'
                              : 'text-rose-700 bg-rose-50 border-rose-200'
                          }`}>
                            {cpmkPercent}% {g.cpmkPassed ? '✓' : g.isTunda ? '⏳' : '✗'}
                          </span>
                          <span className="text-[9px] text-slate-500 mt-0.5 max-w-[130px] truncate" title={g.cpmkStatus}>
                            {g.cpmkStatus}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          g.cpmkPassed
                            ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                            : g.isTunda
                            ? 'text-purple-700 bg-purple-50 border border-purple-200'
                            : 'text-amber-700 bg-amber-50 border border-amber-200'
                        }`}>
                          {g.statusKelulusan}
                        </span>
                      </td>
                      {canEditGrades && (
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleOpenEdit(item.mhsId, g)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-brand-800 bg-brand-50 hover:bg-brand-100 rounded-lg border border-brand-200 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Input Nilai
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {/* Modal Input Nilai Mahasiswa Berstandar OBE */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-base text-slate-900">Asesmen Otentik Mahasiswa (OBE)</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-800 border border-brand-200">
                16 Sesi RPS
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Mahasiswa: <strong>{editingStudent.nama}</strong> ({editingStudent.nim})
            </p>

            <form onSubmit={handleSaveGrade} className="space-y-3.5 text-xs">
              
              {/* Selector Huruf Mutu & Bobot (Sesuai Gambar / OBE) */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Huruf Mutu & Bobot (Skala Nilai STIE Nasional / OBE)
                  <span className="block text-[10px] text-slate-400 font-normal">Pilih otomatis berdasarkan komponen asesmen atau override langsung</span>
                </label>
                <select
                  value={overrideGrade}
                  onChange={e => setOverrideGrade(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 font-bold bg-white text-brand-900 text-xs"
                >
                  <option value="AUTO">⚙️ Kalkulasi Otomatis (Tugas 20%, Kuis 15%, UTS 30%, UAS 35%)</option>
                  {GRADE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} - {opt.letter === 'T' ? 'Tertunda (Belum Lengkap)' : opt.bobot >= 3.0 ? 'Lulus Target OBE (≥ 70%)' : 'Belum Memenuhi Ambang OBE'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Nilai Tugas (20%)
                    <span className="block text-[9px] text-slate-400 font-normal">Sub-CPMK: Studi Kasus Drive</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={scoresForm.nilaiTugas}
                    onChange={e => setScoresForm({...scoresForm, nilaiTugas: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Nilai Kuis (15%)
                    <span className="block text-[9px] text-slate-400 font-normal">Sub-CPMK: Pemahaman Teori</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={scoresForm.nilaiKuis}
                    onChange={e => setScoresForm({...scoresForm, nilaiKuis: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Nilai UTS (30%)
                    <span className="block text-[9px] text-slate-400 font-normal">Evaluasi Sumatif P8</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={scoresForm.nilaiUts}
                    onChange={e => setScoresForm({...scoresForm, nilaiUts: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Nilai UAS (35%)
                    <span className="block text-[9px] text-slate-400 font-normal">Proyek Portofolio P16</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={scoresForm.nilaiUas}
                    onChange={e => setScoresForm({...scoresForm, nilaiUas: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                  />
                </div>
              </div>

              {/* Live Preview Perhitungan Ketercapaian OBE */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 mt-2">
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <span>Kalkulasi Luaran OBE:</span>
                  {overrideGrade !== 'AUTO' && (
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
                      Override Manual
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Nilai Akhir:</span>
                  <span className="text-base font-extrabold text-brand-900">{previewCalc.nilaiAkhir}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Huruf Mutu & Bobot:</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs border ${getGradeBadgeColor(previewCalc.nilaiHuruf)}`}>
                    {previewCalc.gradeLabel} (IPK {previewCalc.ipk.toFixed(2).replace('.', ',')})
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-[11px]">
                  <span className="text-slate-600">Ketercapaian CPMK:</span>
                  <span className={`font-bold ${previewCalc.cpmkPassed ? 'text-emerald-700' : previewCalc.isTunda ? 'text-purple-700' : 'text-rose-600'}`}>
                    {previewCalc.nilaiAkhir}% ({previewCalc.cpmkStatus})
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Status Kelulusan: <strong className="text-slate-800">{previewCalc.statusKelulusan}</strong>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-800 text-white rounded-lg font-bold hover:bg-brand-900 shadow"
                >
                  Simpan Nilai OBE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
