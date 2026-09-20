import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  getClasses, 
  createClass, 
  updateClass,
  deleteClass,
  getMataKuliah, 
  getTahunAkademik, 
  getUsers,
  enrollStudent,
  subscribeToDataSync,
  isClassAssignedToLecturer
} from '../firebase/firestoreService';
import ManageClassStudentsModal from '../components/classes/ManageClassStudentsModal';
import { showSuccessToast, showErrorAlert, showConfirmDialog } from '../utils/alert';
import { 
  BookOpen, 
  Plus, 
  Users, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle, 
  ArrowRight,
  ShieldAlert,
  UserPlus,
  Filter,
  CheckCircle2,
  GraduationCap,
  Lock,
  AlertCircle,
  Edit3,
  Trash2,
  Settings,
  Award
} from 'lucide-react';

export default function ClassListPage({ onSelectClass, onNavigate }) {
  const { user, isAdmin, isDosen, isMahasiswa } = useAuth();
  const [classes, setClasses] = useState([]);
  const [mks, setMks] = useState([]);
  const [tas, setTas] = useState([]);
  const [dosenList, setDosenList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter semester yang dipilih
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  // Sub-filter untuk Dosen & Mahasiswa
  const [filterDosenScope, setFilterDosenScope] = useState('ALL'); // 'ALL' | 'MY_CLASSES'
  const [filterMhsScope, setFilterMhsScope] = useState('MY_SEMESTER'); // 'MY_SEMESTER' | 'ENROLLED' | 'ALL'

  // Modal Buka Kelas Baru (Khusus Admin BAA)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedClassForStudents, setSelectedClassForStudents] = useState(null);
  const [formData, setFormData] = useState({
    mataKuliahId: '',
    tahunAkademikId: '',
    dosenId: '',
    teamTeaching: [],
    namaKelas: 'A',
    ruang: 'Ruang Teori 101',
    hari: 'Senin',
    jam: '08:00 - 10:30 WITA',
    kuota: 40,
    status: 'OPEN'
  });

  // Modal Edit / Ubah Kelas (Khusus Admin & BAA)
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClassToEdit, setSelectedClassToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({
    mataKuliahId: '',
    tahunAkademikId: '',
    dosenId: '',
    teamTeaching: [],
    namaKelas: 'A',
    ruang: 'Ruang Teori 101',
    hari: 'Senin',
    jam: '08:00 - 10:30 WITA',
    kuota: 40,
    status: 'OPEN'
  });

  const loadData = async (isInitial = false) => {
    if (isInitial && classes.length === 0) {
      setLoading(true);
    }
    try {
      const [c, m, t, u] = await Promise.all([
        getClasses(),
        getMataKuliah(),
        getTahunAkademik(),
        getUsers()
      ]);
      setClasses(c);
      setMks(m);
      setTas(t);
      const dosens = u.filter(usr => usr.role === 'DOSEN');
      setDosenList(dosens);

      // Inisialisasi semester aktif BAA
      const activeTa = t.find(item => item.isActive) || t[0];
      if (!selectedSemesterId && activeTa) {
        setSelectedSemesterId(activeTa.id);
      }

      if (m.length > 0 && !formData.mataKuliahId) {
        setFormData(prev => ({
          ...prev,
          mataKuliahId: m[0].id,
          tahunAkademikId: activeTa?.id || t[0]?.id || '',
          dosenId: m[0].dosenId || dosens[0]?.uid || ''
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData(true);
    let debounceTimer = null;
    const unsubscribe = subscribeToDataSync((detail) => {
      if (detail && detail.key === 'STIE_LMS_LOGS') return;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadData(false);
      }, 50);
    });
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      unsubscribe();
    };
  }, [user]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      showErrorAlert("Akses Ditolak", "Hanya Admin Bagian Akademik (BAA) yang memiliki otoritas membuka kelas perkuliahan baru.");
      return;
    }

    const selectedMk = mks.find(m => m.id === formData.mataKuliahId);
    const selectedTa = tas.find(t => t.id === formData.tahunAkademikId);
    const selectedDosen = dosenList.find(d => d.uid === formData.dosenId);

    if (!selectedMk) {
      showErrorAlert("Pilih Mata Kuliah", "Silakan pilih mata kuliah terlebih dahulu sebelum membuka kelas.");
      return;
    }

    try {
      await createClass({
        ...formData,
        teamTeaching: formData.teamTeaching || [],
        namaMk: selectedMk.namaMk,
        kodeMk: selectedMk.kodeMk,
        sks: selectedMk.sks,
        prodiId: selectedMk.prodiId || '',
        namaTa: selectedTa?.namaTa || '2026/2027 Ganjil',
        dosenId: selectedDosen?.uid || selectedDosen?.id || '',
        namaDosen: selectedDosen?.name || 'Dosen Belum Ditentukan',
        dosenNidn: selectedDosen?.nidn || '',
        dosenEmail: selectedDosen?.email || ''
      }, user);

      setShowCreateModal(false);
      await loadData();
      showSuccessToast(`Kelas ${selectedMk.namaMk} (${formData.namaKelas}) berhasil dibuka!`);
    } catch (err) {
      showErrorAlert("Gagal Membuka Kelas", err.message);
    }
  };

  // Handler Buka Modal Edit Kelas
  const handleOpenEditClass = (cls, e) => {
    e?.stopPropagation?.();
    setSelectedClassToEdit(cls);
    setEditFormData({
      mataKuliahId: cls.mataKuliahId || '',
      tahunAkademikId: cls.tahunAkademikId || '',
      dosenId: cls.dosenId || '',
      teamTeaching: Array.isArray(cls.teamTeaching) ? cls.teamTeaching : [],
      namaKelas: cls.namaKelas || 'A',
      ruang: cls.ruang || 'Ruang Teori 101',
      hari: cls.hari || 'Senin',
      jam: cls.jam || '08:00 - 10:30 WITA',
      kuota: cls.kuota || 40,
      status: cls.status || 'OPEN'
    });
    setShowEditModal(true);
  };

  // Handler Simpan Perubahan Kelas (Admin & BAA)
  const handleUpdateClass = async (e) => {
    e.preventDefault();
    if (!selectedClassToEdit) return;

    if (!editFormData.mataKuliahId || !editFormData.tahunAkademikId) {
      showErrorAlert("Validasi Form Gagal", "Mata Kuliah dan Semester wajib dipilih.");
      return;
    }

    const selectedMk = mks.find(m => m.id === editFormData.mataKuliahId);
    const selectedTa = tas.find(t => t.id === editFormData.tahunAkademikId);
    const selectedDosen = dosenList.find(d => d.uid === editFormData.dosenId);

    try {
      await updateClass(selectedClassToEdit.id, {
        ...editFormData,
        teamTeaching: editFormData.teamTeaching || [],
        mataKuliahId: selectedMk?.id || selectedClassToEdit.mataKuliahId,
        namaMk: selectedMk?.namaMk || selectedClassToEdit.namaMk,
        kodeMk: selectedMk?.kodeMk || selectedClassToEdit.kodeMk,
        sks: selectedMk?.sks || selectedClassToEdit.sks,
        prodiId: selectedMk?.prodiId || selectedClassToEdit.prodiId || '',
        tahunAkademikId: selectedTa?.id || selectedClassToEdit.tahunAkademikId,
        namaTa: selectedTa?.namaTa || selectedClassToEdit.namaTa,
        dosenId: selectedDosen?.uid || selectedDosen?.id || selectedClassToEdit.dosenId,
        namaDosen: selectedDosen?.name || selectedClassToEdit.namaDosen,
        dosenNidn: selectedDosen?.nidn || selectedClassToEdit.dosenNidn || '',
        dosenEmail: selectedDosen?.email || selectedClassToEdit.dosenEmail || ''
      }, user);

      setShowEditModal(false);
      setSelectedClassToEdit(null);
      await loadData();
      showSuccessToast(`Kelas ${selectedMk?.namaMk || selectedClassToEdit.namaMk} (${editFormData.namaKelas}) berhasil diperbarui!`);
    } catch (err) {
      showErrorAlert("Gagal Mengubah Kelas", err.message);
    }
  };

  // Handler Hapus Kelas dengan Konfirmasi Interaktif
  const handleDeleteClass = async (cls, e) => {
    e?.stopPropagation?.();
    if (!isAdmin) {
      showErrorAlert("Akses Ditolak", "Hanya Admin dan Bagian Akademik (BAA) yang memiliki wewenang menghapus kelas.");
      return;
    }

    const classId = cls?.id || cls?.uid;
    if (!classId) {
      showErrorAlert("Gagal Menghapus Kelas", "ID kelas perkuliahan tidak ditemukan.");
      return;
    }

    const confirmed = await showConfirmDialog({
      title: 'Hapus Kelas Perkuliahan?',
      text: `Apakah Anda yakin ingin menghapus kelas "${cls.namaMk || 'Mata Kuliah'} (Kelas ${cls.namaKelas || '-'})"? Seluruh data modul pertemuan, presensi, dan nilai di kelas ini akan dihapus secara permanen.`,
      confirmButtonText: 'Ya, Hapus Kelas',
      confirmButtonColor: '#dc2626'
    });

    if (confirmed) {
      try {
        // Optimistic UI update agar kelas langsung hilang seketika
        setClasses(prev => prev.filter(c => String(c.id) !== String(classId) && String(c.uid || '') !== String(classId)));
        await deleteClass(classId, user);
        showSuccessToast(`Kelas ${cls.namaMk} (${cls.namaKelas}) berhasil dihapus.`);
        await loadData();
      } catch (err) {
        await loadData(); // Kembalikan data jika terjadi kegagalan
        showErrorAlert("Gagal Menghapus Kelas", err.message);
      }
    }
  };

  const handleSelfEnroll = async (classId) => {
    const targetClass = classes.find(c => c.id === classId);
    const classTa = tas.find(t => t.id === targetClass?.tahunAkademikId || t.namaTa === targetClass?.namaTa);
    if (!classTa || !classTa.isActive) {
      showErrorAlert("Pendaftaran Ditolak", "Semester perkuliahan untuk kelas ini telah ditutup oleh Bagian Akademik (BAA). Anda tidak dapat mendaftar.");
      return;
    }

    const mk = mks.find(m => m.id === targetClass?.mataKuliahId || m.kodeMk === targetClass?.kodeMk);
    const courseSemester = Number(mk?.semesterDefault || 1);
    const isProdiMatch = !mk?.prodiId || !user?.prodiId || mk.prodiId === user.prodiId;

    if (!isProdiMatch) {
      showErrorAlert(
        "KRS Ditolak (Beda Program Studi)",
        `Mata kuliah "${targetClass?.namaMk}" dialokasikan khusus untuk program studi lain.`
      );
      return;
    }

    if (studentCurrentSemester && studentCurrentSemester < courseSemester) {
      showErrorAlert(
        "KRS Ditolak (Belum Mencapai Semester)",
        `Mata kuliah "${targetClass?.namaMk}" dialokasikan untuk Semester ${courseSemester}. Anda saat ini berada di Semester ${studentCurrentSemester} (Angkatan ${user?.angkatan || '-'}).`
      );
      return;
    }

    if (studentCurrentSemester && studentCurrentSemester > courseSemester) {
      showErrorAlert(
        "Pendaftaran Mata Kuliah Mengulang",
        `Mata kuliah "${targetClass?.namaMk}" (Semester ${courseSemester}) merupakan mata kuliah mengulang dari tahun sebelumnya. Sesuai kebijakan akademik STIE Nasional, pendaftaran mata kuliah mengulang hanya dapat ditambahkan langsung oleh Admin atau Bagian Administrasi Akademik (BAA). Silakan menghubungi loket BAA.`
      );
      return;
    }

    try {
      await enrollStudent(classId, user.uid, user);
      showSuccessToast(`Berhasil mengambil kelas ${targetClass?.namaMk} (KRS)!`);
      await loadData();
    } catch (err) {
      showErrorAlert("Gagal Mendaftar", err.message);
    }
  };

  // Helper Semester Aktif
  const activeTa = tas.find(t => t.isActive);
  const selectedTa = tas.find(t => t.id === selectedSemesterId);

  // Hitung semester berjalan mahasiswa berdasarkan angkatan atau field semester
  const studentCurrentSemester = isMahasiswa ? (
    user?.semester ? Number(user.semester) : (
      user?.angkatan ? Math.max(1, ((2026 - Number(user.angkatan)) * 2) + 1) : 1
    )
  ) : null;

  // Filter Kelas berdasarkan Semester dan Peran
  const filteredClasses = classes.filter(cls => {
    // 1. Filter Semester
    if (selectedSemesterId && selectedSemesterId !== 'ALL') {
      const matchTa = cls.tahunAkademikId === selectedSemesterId || 
                      (selectedTa && cls.namaTa === selectedTa.namaTa);
      if (!matchTa) return false;
    }

    // 2. KETENTUAN KHUSUS DOSEN: HANYA TAMPILKAN KELAS YANG DIDAFTARKAN/DITUGASKAN OLEH BAA
    if (isDosen) {
      if (!isClassAssignedToLecturer(cls, user)) return false;
    }

    // 3. Sub-filter Mahasiswa (OBE KRS Rule)
    if (isMahasiswa) {
      if (filterMhsScope === 'MY_SEMESTER') {
        const mk = mks.find(m => m.id === cls.mataKuliahId || m.kodeMk === cls.kodeMk);
        const sem = Number(mk?.semesterDefault || 1);
        const isProdiMatch = !mk?.prodiId || !user?.prodiId || mk.prodiId === user.prodiId;
        if (sem !== studentCurrentSemester || !isProdiMatch) return false;
      } else if (filterMhsScope === 'ENROLLED') {
        const isEnrolled = (cls.enrolledStudents || []).includes(user?.uid);
        if (!isEnrolled) return false;
      }
    }

    return true;
  });

  // Hitungan untuk tab Dosen & Mahasiswa
  const totalClassesInSemester = classes.filter(c => 
    selectedSemesterId === 'ALL' || c.tahunAkademikId === selectedSemesterId || c.namaTa === selectedTa?.namaTa
  );
  const myDosenClassesCount = totalClassesInSemester.filter(c => isClassAssignedToLecturer(c, user)).length;
  const myEnrolledClassesCount = totalClassesInSemester.filter(c => (c.enrolledStudents || []).includes(user?.uid)).length;
  const mySemesterClassesCount = totalClassesInSemester.filter(c => {
    const mk = mks.find(m => m.id === c.mataKuliahId || m.kodeMk === c.kodeMk);
    const sem = Number(mk?.semesterDefault || 1);
    const isProdiMatch = !mk?.prodiId || !user?.prodiId || mk.prodiId === user.prodiId;
    return sem === studentCurrentSemester && isProdiMatch;
  }).length;

  if (loading && classes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-xs text-slate-500">
        <Clock className="w-5 h-5 animate-spin mr-2 text-brand-600" />
        Memuat daftar kelas perkuliahan...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header & Action */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-700" />
            {isMahasiswa ? 'Daftar Kelas Perkuliahan' : isDosen ? 'Manajemen Perkuliahan Dosen' : 'Manajemen Kelas Kuliah (BAA)'}
          </h2>
          <p className="text-xs text-slate-500">
            {isAdmin 
              ? 'Pengaturan semester berjalan, pembukaan kelas baru, penugasan dosen, dan kuota mahasiswa.' 
              : 'Data kelas perkuliahan dikelola dan dijadwalkan oleh Bagian Akademik (BAA) STIE Nasional.'}
          </p>
        </div>

        {/* Tombol Buat Kelas Baru: HANYA untuk Admin BAA / Super Admin */}
        {isAdmin && (
          <button
            onClick={() => {
              if (selectedSemesterId && selectedSemesterId !== 'ALL') {
                setFormData(prev => ({ ...prev, tahunAkademikId: selectedSemesterId }));
              }
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-800 text-white rounded-xl text-xs font-bold shadow hover:bg-brand-900 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Buka Kelas Kuliah Baru (BAA)
          </button>
        )}
      </div>

      {/* Notifikasi jika seluruh semester ditutup untuk Dosen dan Mahasiswa */}
      {!activeTa && !isAdmin && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-3 text-xs text-rose-900 shadow-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-sm block mb-0.5">Tahun Akademik (Semester) Berstatus Ditutup</span>
            Saat ini belum ada Tahun Akademik / Semester yang dibuka oleh Bagian Administrasi Akademik (BAA). Seluruh kelas perkuliahan berada dalam status non-aktif dan ditutup untuk akses Dosen maupun Mahasiswa hingga semester baru resmi dibuka oleh BAA.
          </div>
        </div>
      )}

      {/* Banner Informasi Hak Akses Perkuliahan untuk Dosen & Mahasiswa */}
      {!isAdmin && activeTa && (
        <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-start gap-3 text-xs text-blue-900">
          <div className="p-1.5 bg-blue-100 rounded-lg text-blue-700 shrink-0 mt-0.5">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-blue-950">
              {isDosen ? 'Mode Dosen Pengampu' : 'Mode Mahasiswa Terdaftar'}
            </div>
            <p className="text-blue-800 text-[11px] mt-0.5 leading-relaxed">
              {isDosen 
                ? 'Pembukaan semester dan penambahan kelas kuliah baru sepenuhnya diatur oleh Bagian Akademik (BAA). Anda dapat mengelola materi (Link Drive), media perkuliahan (Meet/Zoom), presensi, serta penilaian mahasiswa pada kelas yang Anda ampu.'
                : 'Kelas perkuliahan dan semester berjalan diatur oleh Bagian Akademik (BAA). Pilih kelas yang Anda ikuti untuk mengunduh materi bahan ajar, bergabung sesi tatap muka daring, dan mengunggah tugas.'}
            </p>
          </div>
        </div>
      )}

      {/* FILTER BAR: FILTER BERDASARKAN SEMESTER / TAHUN AKADEMIK */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Dropdown Pemilih Semester */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Filter className="w-4 h-4 text-brand-700" />
              <span>Semester / Tahun Akademik:</span>
            </div>

            <select
              value={selectedSemesterId}
              onChange={e => setSelectedSemesterId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              <option value="ALL">Semua Semester ({classes.length} Kelas)</option>
              {tas.map(ta => (
                <option key={ta.id} value={ta.id}>
                  {ta.namaTa} {ta.isActive ? '• [DIBUKA / Semester Aktif BAA]' : '• [DITUTUP BAA]'}
                </option>
              ))}
            </select>

            {/* Badge Status Semester Terpilih */}
            {selectedTa && (
              <div className="flex items-center gap-1.5">
                {selectedTa.isActive ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Semester Aktif BAA
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold">
                    <Lock className="w-3 h-3 text-rose-500" />
                    Semester Ditutup (Arsip)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Indikator Khusus Dosen: Hanya Kelas Penugasan BAA */}
          {isDosen && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-900 shadow-sm">
              <BookOpen className="w-4 h-4 text-blue-700" />
              <span>Kelas Penugasan BAA: {myDosenClassesCount} Kelas</span>
            </div>
          )}

          {/* Sub-Filter Khusus Mahasiswa */}
          {isMahasiswa && (
            <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setFilterMhsScope('MY_SEMESTER')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  filterMhsScope === 'MY_SEMESTER' ? 'bg-white shadow text-brand-800 font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Paket Semester {studentCurrentSemester} ({mySemesterClassesCount} Kelas)
              </button>
              <button
                onClick={() => setFilterMhsScope('ENROLLED')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  filterMhsScope === 'ENROLLED' ? 'bg-white shadow text-emerald-800 font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kelas Terdaftar ({myEnrolledClassesCount})
              </button>
              <button
                onClick={() => setFilterMhsScope('ALL')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  filterMhsScope === 'ALL' ? 'bg-white shadow text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Kelas Terbuka ({totalClassesInSemester.length})
              </button>
            </div>
          )}

        </div>

        {/* Notifikasi Kebijakan KRS & Mengulang Mahasiswa */}
        {isMahasiswa && (
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 text-[11px] text-amber-900 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-bold text-amber-950">Panduan KRS Mandiri Mahasiswa:</strong> Sistem secara otomatis menampilkan paket kelas sesuai Program Studi dan Semester berjalan Anda ({user?.prodiId || 'Prodi Anda'} • Semester {studentCurrentSemester}).
              Bagi mahasiswa yang bermaksud <strong className="text-purple-900">mengulang mata kuliah tahun sebelumnya</strong> yang belum lulus, pendaftaran kelas <em>wajib dilakukan melalui Admin / Bagian Administrasi Akademik (BAA)</em>.
            </div>
          </div>
        )}

        {/* Ringkasan Jumlah Kelas */}
        <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
          <span>
            Menampilkan <strong>{filteredClasses.length}</strong> kelas perkuliahan untuk semester <strong>{selectedTa ? selectedTa.namaTa : 'Seluruh Semester'}</strong>.
          </span>
          {activeTa && selectedSemesterId !== activeTa.id && selectedSemesterId !== 'ALL' && (
            <button
              onClick={() => setSelectedSemesterId(activeTa.id)}
              className="text-brand-700 hover:underline font-semibold"
            >
              Kembali ke Semester Aktif ({activeTa.namaTa})
            </button>
          )}
        </div>
      </div>

      {/* Grid Kelas */}
      {filteredClasses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-800">
            Belum Ada Kelas Perkuliahan
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {isAdmin 
              ? `Belum ada kelas perkuliahan yang dibuat untuk ${selectedTa ? selectedTa.namaTa : 'semester ini'}. Silakan buat kelas perkuliahan baru menggunakan tombol di bawah.`
              : isDosen
                ? `Belum ada kelas perkuliahan yang didaftarkan atau ditugaskan oleh Bagian Administrasi Akademik (BAA) kepada akun Anda untuk periode ${selectedTa ? selectedTa.namaTa : 'ini'}. Silakan berkoordinasi dengan BAA untuk penjadwalan mengajar.`
                : `Belum ada kelas perkuliahan yang dijadwalkan oleh Bagian Akademik (BAA) untuk periode ${selectedTa ? selectedTa.namaTa : 'ini'}.`}
          </p>
          {isAdmin && (
            <button
              onClick={() => {
                if (selectedSemesterId && selectedSemesterId !== 'ALL') {
                  setFormData(prev => ({ ...prev, tahunAkademikId: selectedSemesterId }));
                }
                setShowCreateModal(true);
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white rounded-xl text-xs font-bold shadow transition-colors"
            >
              <Plus className="w-4 h-4" />
              Buka Kelas untuk Semester Ini
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClasses.map(cls => {
            const isEnrolled = (cls.enrolledStudents || []).includes(user?.uid);
            const isFull = (cls.enrolledStudents || []).length >= (cls.kuota || 40);
            const isLecturer = isDosen && isClassAssignedToLecturer(cls, user);
            const classTa = tas.find(t => t.id === cls.tahunAkademikId || t.namaTa === cls.namaTa);
            const isClassSemesterActive = classTa ? classTa.isActive : false;

            const mk = mks.find(m => m.id === cls.mataKuliahId || m.kodeMk === cls.kodeMk);
            const courseSemester = Number(mk?.semesterDefault || 1);
            const isProdiMatch = !mk?.prodiId || !user?.prodiId || mk.prodiId === user.prodiId;
            const isRetakeCourse = isMahasiswa && (studentCurrentSemester > courseSemester);
            const isUnderSemester = isMahasiswa && (studentCurrentSemester < courseSemester);
            const isExactSemester = isMahasiswa && courseSemester === studentCurrentSemester;

            return (
              <div 
                key={cls.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-brand-300 transition-all flex flex-col justify-between"
              >
                <div className="p-5 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-lg bg-brand-50 text-brand-800 border border-brand-200">
                        {cls.kodeMk} • Kelas {cls.namaKelas}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        isExactSemester
                          ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                          : isRetakeCourse
                          ? 'bg-purple-50 text-purple-800 border-purple-200'
                          : isUnderSemester
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        Semester {courseSemester} {isExactSemester ? '• Paket Anda' : isRetakeCourse ? '• Mengulang' : ''}
                      </span>
                      {isLecturer && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                          Kelas Anda
                        </span>
                      )}
                      {isMahasiswa && isEnrolled && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Terdaftar
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isClassSemesterActive ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                          cls.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {cls.status || 'OPEN'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 bg-rose-50 text-rose-700 border-rose-200 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5 text-rose-600" />
                          DITUTUP BAA
                        </span>
                      )}

                      {/* Tombol Aksi Kelola Mahasiswa, Edit & Hapus untuk Admin dan BAA */}
                      {isAdmin && (
                        <div className="flex items-center gap-1 ml-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClassForStudents(cls);
                              setShowStudentsModal(true);
                            }}
                            title="Kelola Mahasiswa Kelas (Admin & BAA)"
                            className="p-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-800 border border-brand-200 transition-colors shadow-sm"
                          >
                            <Users className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleOpenEditClass(cls, e)}
                            title="Edit / Ubah Data Kelas (Admin & BAA)"
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors shadow-sm"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteClass(cls, e)}
                            title="Hapus Kelas (Admin & BAA)"
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors shadow-sm"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 line-clamp-1">
                    {cls.namaMk}
                  </h3>

                  {/* Informasi Semester dari BAA */}
                  <div className="text-[11px] text-slate-600 font-semibold flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/70">
                    <Calendar className="w-3.5 h-3.5 text-brand-700 shrink-0" />
                    <span>Semester: <strong>{cls.namaTa}</strong></span>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-700">Dosen Pengampu:</span> {cls.namaDosen}
                    </div>
                    {Array.isArray(cls.teamTeaching) && cls.teamTeaching.length > 0 && (
                      <div className="text-[11px] text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        <span className="font-semibold">Team Teaching:</span> {
                          cls.teamTeaching.map(tUid => {
                            const d = dosenList.find(usr => (usr.uid || usr.id) === (tUid?.uid || tUid));
                            return d ? d.name : (tUid?.name || tUid);
                          }).join(', ')
                        }
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{cls.hari}, {cls.jam}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{cls.ruang} • {cls.sks} SKS</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-slate-600 font-medium">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{(cls.enrolledStudents || []).length} / {cls.kuota} Mahasiswa</span>
                    </div>
                    {isAdmin ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClassForStudents(cls);
                          setShowStudentsModal(true);
                        }}
                        className="text-[11px] font-bold text-brand-800 hover:text-brand-950 bg-brand-50 hover:bg-brand-100 px-2 py-0.5 rounded-md border border-brand-200 flex items-center gap-1 transition-colors"
                        title="Kelola Mahasiswa Kelas"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>Kelola Mahasiswa</span>
                      </button>
                    ) : (
                      <div className="text-[10px] text-brand-800 font-bold bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200">
                        16 Sesi RPS • Sub-CPMK OBE
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                  {!isClassSemesterActive ? (
                    isAdmin ? (
                      <button
                        onClick={() => onSelectClass(cls.id)}
                        className="w-full py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                      >
                        <span>Pantau Kelas (Arsip BAA)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <div className="w-full py-2 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Akses Ditutup (Semester Non-Aktif)</span>
                      </div>
                    )
                  ) : isMahasiswa && !isEnrolled ? (
                    isUnderSemester ? (
                      <div 
                        className="w-full py-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed text-center px-2"
                        title={`Mata kuliah ini dialokasikan untuk Semester ${courseSemester}. Anda saat ini berada di Semester ${studentCurrentSemester}.`}
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>Terkunci (Belum Sampai Semester {courseSemester})</span>
                      </div>
                    ) : isRetakeCourse ? (
                      <div 
                        className="w-full py-2 bg-purple-50 border border-purple-200 text-purple-900 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed text-center px-2"
                        title={`Mata kuliah "${cls.namaMk}" merupakan mata kuliah Semester ${courseSemester} (Mengulang). Pendaftaran kelas hanya dapat ditambahkan langsung oleh Admin atau BAA.`}
                      >
                        <Lock className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                        <span>Mengulang (Hanya Ditambahkan BAA)</span>
                      </div>
                    ) : !isProdiMatch ? (
                      <div 
                        className="w-full py-2 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed text-center px-2"
                      >
                        <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Khusus Program Studi Lain</span>
                      </div>
                    ) : (
                      <button
                        disabled={isFull}
                        onClick={() => handleSelfEnroll(cls.id)}
                        className="w-full py-1.5 bg-brand-800 hover:bg-brand-900 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors shadow-sm"
                      >
                        <UserPlus className="w-4 h-4" />
                        {isFull ? 'Kuota Penuh' : 'Ambil Kelas (KRS)'}
                      </button>
                    )
                  ) : isDosen ? (
                    <div className="w-full flex items-center gap-2">
                      <button
                        onClick={() => onSelectClass(cls.id)}
                        className="flex-1 py-1.5 bg-white border border-brand-300 hover:bg-brand-50 text-brand-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors shadow-sm"
                      >
                        <span>Masuk Kelas</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      {onNavigate && (
                        <button
                          onClick={() => onNavigate('gradebook', { selectedClassId: cls.id })}
                          title="Isi Penilaian OBE (Gradebook)"
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm shrink-0"
                        >
                          <Award className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Nilai OBE</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => onSelectClass(cls.id)}
                      className="w-full py-1.5 bg-white border border-brand-300 hover:bg-brand-50 text-brand-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors shadow-sm"
                    >
                      <span>Masuk Modul Pertemuan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Buka Kelas Baru (Khusus Admin BAA) */}
      {showCreateModal && isAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-lg bg-brand-50 text-brand-700">
                <BookOpen className="w-5 h-5 text-brand-800" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Buka Kelas Perkuliahan Baru (BAA)</h3>
                <p className="text-xs text-slate-500">
                  Dikelola oleh Bagian Administrasi Akademik (BAA) STIE Nasional
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs mt-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mata Kuliah Kurikulum</label>
                <select
                  value={formData.mataKuliahId}
                  onChange={e => {
                    const mkId = e.target.value;
                    const matchedMk = mks.find(m => m.id === mkId);
                    setFormData({
                      ...formData, 
                      mataKuliahId: mkId,
                      dosenId: matchedMk?.dosenId || formData.dosenId
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-white font-medium"
                >
                  {mks.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.kodeMk} - {m.namaMk} ({m.sks} SKS) • [Semester {m.semesterDefault || 1}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Semester / Tahun Akademik</label>
                  <select
                    value={formData.tahunAkademikId}
                    onChange={e => setFormData({...formData, tahunAkademikId: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    {tas.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.namaTa} {t.isActive ? '(Aktif BAA)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Nama Kelas (Paralel)</label>
                  <input
                    type="text"
                    required
                    placeholder="contoh: A, B, atau Reguler"
                    value={formData.namaKelas}
                    onChange={e => setFormData({...formData, namaKelas: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Dosen Pengampu Utama</label>
                <select
                  value={formData.dosenId}
                  onChange={e => {
                    const newDosenId = e.target.value;
                    setFormData(prev => ({
                      ...prev, 
                      dosenId: newDosenId,
                      teamTeaching: (prev.teamTeaching || []).filter(id => id !== newDosenId)
                    }));
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  {dosenList.map(d => (
                    <option key={d.uid} value={d.uid}>{d.name} ({d.nidn ? `NUPTK/NIP: ${d.nidn}` : 'Dosen'})</option>
                  ))}
                </select>
              </div>

              {/* Pemilihan Dosen Team Teaching (Opsional) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-800 font-bold text-xs">
                    Tim Pengajar / Team Teaching (Opsional)
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">Centang dosen pendamping</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {dosenList.filter(d => d.uid !== formData.dosenId).map(d => {
                    const isChecked = (formData.teamTeaching || []).includes(d.uid);
                    return (
                      <label 
                        key={d.uid} 
                        className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isChecked ? 'bg-purple-50 border-purple-300 text-purple-900 font-semibold' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            const checked = e.target.checked;
                            setFormData(prev => ({
                              ...prev,
                              teamTeaching: checked
                                ? [...(prev.teamTeaching || []), d.uid]
                                : (prev.teamTeaching || []).filter(id => id !== d.uid)
                            }));
                          }}
                          className="w-3.5 h-3.5 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                        />
                        <span className="truncate">{d.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Hari</label>
                  <select
                    value={formData.hari}
                    onChange={e => setFormData({...formData, hari: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Jam Perkuliahan</label>
                  <input
                    type="text"
                    value={formData.jam}
                    onChange={e => setFormData({...formData, jam: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Kuota Kelas</label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={formData.kuota}
                    onChange={e => setFormData({...formData, kuota: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Ruang Kelas / Lab</label>
                <input
                  type="text"
                  value={formData.ruang}
                  onChange={e => setFormData({...formData, ruang: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl text-brand-900 text-[11px] flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Otomatisasi 16 Pertemuan:</strong> Pertemuan 1–7 (Materi Pokok), Pertemuan 8 (Khusus UTS), Pertemuan 9–15 (Materi Lanjutan), dan Pertemuan 16 (Khusus UAS) akan dibuat seketika sesuai standar RPS STIE Nasional.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-800 text-white rounded-lg font-bold hover:bg-brand-900"
                >
                  Buka & Buat 16 Pertemuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit / Ubah Kelas (Khusus Admin & BAA) */}
      {showEditModal && isAdmin && selectedClassToEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
                <Edit3 className="w-5 h-5 text-amber-800" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Edit Data Kelas Perkuliahan</h3>
                <p className="text-xs text-slate-500">
                  Kewenangan Admin & Bagian Administrasi Akademik (BAA) STIE Nasional
                </p>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs mt-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mata Kuliah</label>
                <select
                  value={editFormData.mataKuliahId}
                  onChange={e => {
                    const mkId = e.target.value;
                    const matchedMk = mks.find(m => m.id === mkId);
                    setEditFormData({
                      ...editFormData, 
                      mataKuliahId: mkId,
                      dosenId: matchedMk?.dosenId || editFormData.dosenId
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  {mks.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.kodeMk} - {m.namaMk} ({m.sks} SKS)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Semester / Tahun Akademik</label>
                  <select
                    value={editFormData.tahunAkademikId}
                    onChange={e => setEditFormData({...editFormData, tahunAkademikId: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    {tas.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.namaTa} {t.isActive ? '(Aktif BAA)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Nama / Golongan Kelas</label>
                  <input
                    type="text"
                    required
                    placeholder="A, B, Reguler Pagi, dll."
                    value={editFormData.namaKelas}
                    onChange={e => setEditFormData({...editFormData, namaKelas: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Dosen Pengampu Utama</label>
                <select
                  value={editFormData.dosenId}
                  onChange={e => {
                    const newDosenId = e.target.value;
                    setEditFormData(prev => ({
                      ...prev, 
                      dosenId: newDosenId,
                      teamTeaching: (prev.teamTeaching || []).filter(id => id !== newDosenId)
                    }));
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  {dosenList.map(d => (
                    <option key={d.uid} value={d.uid}>
                      {d.name} {d.nidn ? `(NUPTK/NIP: ${d.nidn})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pemilihan Dosen Team Teaching Edit (Opsional) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-800 font-bold text-xs">
                    Tim Pengajar / Team Teaching (Opsional)
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">Centang dosen pendamping</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {dosenList.filter(d => d.uid !== editFormData.dosenId).map(d => {
                    const isChecked = (editFormData.teamTeaching || []).includes(d.uid);
                    return (
                      <label 
                        key={d.uid} 
                        className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isChecked ? 'bg-purple-50 border-purple-300 text-purple-900 font-semibold' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            const checked = e.target.checked;
                            setEditFormData(prev => ({
                              ...prev,
                              teamTeaching: checked
                                ? [...(prev.teamTeaching || []), d.uid]
                                : (prev.teamTeaching || []).filter(id => id !== d.uid)
                            }));
                          }}
                          className="w-3.5 h-3.5 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                        />
                        <span className="truncate">{d.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Hari</label>
                  <select
                    value={editFormData.hari}
                    onChange={e => setEditFormData({...editFormData, hari: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Jam Perkuliahan</label>
                  <input
                    type="text"
                    value={editFormData.jam}
                    onChange={e => setEditFormData({...editFormData, jam: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Kuota Kelas</label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={editFormData.kuota}
                    onChange={e => setEditFormData({...editFormData, kuota: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Ruang Kelas / Lab</label>
                  <input
                    type="text"
                    value={editFormData.ruang}
                    onChange={e => setEditFormData({...editFormData, ruang: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Status Pendaftaran</label>
                  <select
                    value={editFormData.status}
                    onChange={e => setEditFormData({...editFormData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-white font-bold"
                  >
                    <option value="OPEN">OPEN (Pendaftaran Dibuka)</option>
                    <option value="CLOSED">CLOSED (Pendaftaran Ditutup)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={(e) => {
                    const targetCls = selectedClassToEdit;
                    setShowEditModal(false);
                    setSelectedClassToEdit(null);
                    handleDeleteClass(targetCls, e);
                  }}
                  className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg font-bold flex items-center gap-1.5 transition-colors text-xs border border-rose-200 hover:border-rose-300"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Kelas Ini</span>
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowEditModal(false); setSelectedClassToEdit(null); }}
                    className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-bold shadow"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KELOLA MAHASISWA KELAS (ADMIN & BAA) */}
      <ManageClassStudentsModal
        isOpen={showStudentsModal}
        onClose={() => {
          setShowStudentsModal(false);
          setSelectedClassForStudents(null);
        }}
        classItem={selectedClassForStudents}
        onStudentsUpdated={async () => {
          await loadData();
          if (selectedClassForStudents) {
            const updatedClasses = await getClasses();
            const freshClass = updatedClasses.find(c => c.id === selectedClassForStudents.id);
            if (freshClass) setSelectedClassForStudents(freshClass);
          }
        }}
      />

    </div>
  );
}
