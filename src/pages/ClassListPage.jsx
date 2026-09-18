import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  getClasses, 
  createClass, 
  getMataKuliah, 
  getTahunAkademik, 
  getUsers,
  enrollStudent,
  subscribeToDataSync 
} from '../firebase/firestoreService';
import { showSuccessToast, showErrorAlert } from '../utils/alert';
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
  AlertCircle
} from 'lucide-react';

export default function ClassListPage({ onSelectClass }) {
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
  const [filterMhsScope, setFilterMhsScope] = useState('ENROLLED'); // 'ENROLLED' | 'ALL'

  // Modal Buka Kelas Baru (Khusus Admin BAA)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    mataKuliahId: '',
    tahunAkademikId: '',
    dosenId: '',
    namaKelas: 'A',
    ruang: 'Ruang Teori 101',
    hari: 'Senin',
    jam: '08:00 - 10:30 WITA',
    kuota: 40,
    status: 'OPEN'
  });

  const loadData = async () => {
    setLoading(true);
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
          dosenId: dosens[0]?.uid || ''
        }));
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
        namaMk: selectedMk.namaMk,
        kodeMk: selectedMk.kodeMk,
        sks: selectedMk.sks,
        namaTa: selectedTa?.namaTa || '2026/2027 Ganjil',
        dosenId: selectedDosen?.uid || '',
        namaDosen: selectedDosen?.name || 'Dosen Belum Ditentukan'
      }, user);

      setShowCreateModal(false);
      await loadData();
      showSuccessToast(`Kelas ${selectedMk.namaMk} (${formData.namaKelas}) berhasil dibuka!`);
    } catch (err) {
      showErrorAlert("Gagal Membuka Kelas", err.message);
    }
  };

  const handleSelfEnroll = async (classId) => {
    const targetClass = classes.find(c => c.id === classId);
    const classTa = tas.find(t => t.id === targetClass?.tahunAkademikId || t.namaTa === targetClass?.namaTa);
    if (!classTa || !classTa.isActive) {
      showErrorAlert("Pendaftaran Ditolak", "Semester perkuliahan untuk kelas ini telah ditutup oleh Bagian Akademik (BAA). Anda tidak dapat mendaftar.");
      return;
    }

    try {
      await enrollStudent(classId, user.uid, user);
      showSuccessToast("Berhasil mendaftar ke kelas perkuliahan!");
      await loadData();
    } catch (err) {
      showErrorAlert("Gagal Mendaftar", err.message);
    }
  };

  // Helper Semester Aktif
  const activeTa = tas.find(t => t.isActive);
  const selectedTa = tas.find(t => t.id === selectedSemesterId);

  // Filter Kelas berdasarkan Semester dan Peran
  const filteredClasses = classes.filter(cls => {
    // 1. Filter Semester
    if (selectedSemesterId && selectedSemesterId !== 'ALL') {
      const matchTa = cls.tahunAkademikId === selectedSemesterId || 
                      (selectedTa && cls.namaTa === selectedTa.namaTa);
      if (!matchTa) return false;
    }

    // 2. Sub-filter Dosen
    if (isDosen && filterDosenScope === 'MY_CLASSES') {
      if (cls.dosenId !== user?.uid) return false;
    }

    // 3. Sub-filter Mahasiswa
    if (isMahasiswa && filterMhsScope === 'ENROLLED') {
      const isEnrolled = (cls.enrolledStudents || []).includes(user?.uid);
      if (!isEnrolled) return false;
    }

    return true;
  });

  // Hitungan untuk tab Dosen
  const totalClassesInSemester = classes.filter(c => 
    selectedSemesterId === 'ALL' || c.tahunAkademikId === selectedSemesterId || c.namaTa === selectedTa?.namaTa
  );
  const myDosenClassesCount = totalClassesInSemester.filter(c => c.dosenId === user?.uid).length;
  const myEnrolledClassesCount = totalClassesInSemester.filter(c => (c.enrolledStudents || []).includes(user?.uid)).length;

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

          {/* Sub-Filter Khusus Dosen */}
          {isDosen && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setFilterDosenScope('ALL')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  filterDosenScope === 'ALL' ? 'bg-white shadow text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Kelas ({totalClassesInSemester.length})
              </button>
              <button
                onClick={() => setFilterDosenScope('MY_CLASSES')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  filterDosenScope === 'MY_CLASSES' ? 'bg-white shadow text-blue-700 font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kelas Saya ({myDosenClassesCount})
              </button>
            </div>
          )}

          {/* Sub-Filter Khusus Mahasiswa */}
          {isMahasiswa && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setFilterMhsScope('ENROLLED')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  filterMhsScope === 'ENROLLED' ? 'bg-white shadow text-emerald-800 font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kelas Saya ({myEnrolledClassesCount})
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
            const isLecturer = isDosen && cls.dosenId === user?.uid;
            const classTa = tas.find(t => t.id === cls.tahunAkademikId || t.namaTa === cls.namaTa);
            const isClassSemesterActive = classTa ? classTa.isActive : false;

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
                      <span className="font-semibold text-slate-700">Dosen:</span> {cls.namaDosen}
                    </div>
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
                    <div className="text-[10px] text-brand-800 font-bold bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200">
                      16 Sesi RPS • Sub-CPMK OBE
                    </div>
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
                    <button
                      disabled={isFull}
                      onClick={() => handleSelfEnroll(cls.id)}
                      className="w-full py-1.5 bg-brand-800 hover:bg-brand-900 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      {isFull ? 'Kuota Penuh' : 'Daftar Kelas Ini'}
                    </button>
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
                  onChange={e => setFormData({...formData, mataKuliahId: e.target.value})}
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
                <label className="block text-slate-700 font-semibold mb-1">Dosen Pengampu Perkuliahan</label>
                <select
                  value={formData.dosenId}
                  onChange={e => setFormData({...formData, dosenId: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  {dosenList.map(d => (
                    <option key={d.uid} value={d.uid}>{d.name} ({d.nidn || 'Dosen'})</option>
                  ))}
                </select>
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

    </div>
  );
}
