import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  getUsers, 
  getProdi,
  getMataKuliah,
  enrollStudent, 
  unenrollStudent 
} from '../../firebase/firestoreService';
import { calculateAcademicStanding } from '../../utils/studentNimHelper';
import { showSuccessToast, showErrorAlert, showConfirmDialog } from '../../utils/alert';
import { 
  X, 
  Users, 
  UserPlus, 
  Trash2, 
  Search, 
  Filter, 
  CheckCircle, 
  AlertCircle, 
  GraduationCap, 
  ShieldCheck, 
  CheckSquare, 
  Square,
  Sparkles,
  Info
} from 'lucide-react';

export default function ManageClassStudentsModal({ 
  isOpen, 
  onClose, 
  classItem, 
  onStudentsUpdated 
}) {
  const { user, isAdmin, isBaa, isSuperAdmin } = useAuth();
  
  const [activeTab, setActiveTab] = useState('ENROLLED'); // 'ENROLLED' | 'ADD'
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [prodis, setProdis] = useState([]);
  const [allMks, setAllMks] = useState([]);
  
  // Search & Filter States
  const [searchEnrolled, setSearchEnrolled] = useState('');
  const [searchAvailable, setSearchAvailable] = useState('');
  const [filterProdi, setFilterProdi] = useState('ALL');
  const [filterAngkatan, setFilterAngkatan] = useState('ALL');
  
  // Selection state for Batch Enrollment
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  // BAA Quota Override
  const [bypassQuota, setBypassQuota] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      setSelectedStudentIds([]);
      setSearchEnrolled('');
      setSearchAvailable('');
      setFilterProdi('ALL');
      setFilterAngkatan('ALL');
    }
  }, [isOpen, classItem?.id]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [users, prodiList, mkList] = await Promise.all([
        getUsers(),
        getProdi(),
        getMataKuliah()
      ]);
      setAllUsers(users);
      setProdis(prodiList);
      setAllMks(mkList);
    } catch (err) {
      console.error("Gagal memuat data pengguna/prodi/mk:", err);
    } finally {
      setLoading(false);
    }
  };

  const targetMk = useMemo(() => {
    return allMks.find(m => String(m.id) === String(classItem?.mataKuliahId) || m.kodeMk === classItem?.kodeMk);
  }, [allMks, classItem]);
  const courseSemester = Number(targetMk?.semesterDefault || 1);

  const enrolledIds = useMemo(() => {
    return classItem?.enrolledStudents || [];
  }, [classItem]);

  // Mahasiswa yang sedang terdaftar
  const enrolledStudents = useMemo(() => {
    const list = allUsers.filter(u => enrolledIds.includes(u.uid || u.id));
    if (!searchEnrolled.trim()) return list;
    const term = searchEnrolled.toLowerCase();
    return list.filter(u => 
      (u.name || '').toLowerCase().includes(term) ||
      (u.nim || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term)
    );
  }, [allUsers, enrolledIds, searchEnrolled]);

  // Mahasiswa yang belum terdaftar (hanya role MAHASISWA)
  const availableStudents = useMemo(() => {
    const list = allUsers.filter(u => {
      const isMhs = (u.role || '').toUpperCase() === 'MAHASISWA';
      const isNotEnrolled = !enrolledIds.includes(u.uid || u.id);
      return isMhs && isNotEnrolled;
    });

    return list.filter(u => {
      // Filter Prodi
      if (filterProdi !== 'ALL' && u.prodiId !== filterProdi) {
        return false;
      }
      // Filter Angkatan
      if (filterAngkatan !== 'ALL' && String(u.angkatan || '') !== String(filterAngkatan)) {
        return false;
      }
      // Filter Search
      if (searchAvailable.trim()) {
        const term = searchAvailable.toLowerCase();
        const matchName = (u.name || '').toLowerCase().includes(term);
        const matchNim = (u.nim || '').toLowerCase().includes(term);
        const matchEmail = (u.email || '').toLowerCase().includes(term);
        if (!matchName && !matchNim && !matchEmail) return false;
      }
      return true;
    });
  }, [allUsers, enrolledIds, searchAvailable, filterProdi, filterAngkatan]);

  // Unique Angkatan dari data user mahasiswa
  const availableAngkatans = useMemo(() => {
    const set = new Set();
    allUsers.forEach(u => {
      if ((u.role || '').toUpperCase() === 'MAHASISWA' && u.angkatan) {
        set.add(String(u.angkatan));
      }
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [allUsers]);

  // Handler Hapus / Keluarkan Mahasiswa
  const handleRemoveStudent = async (student) => {
    const confirmed = await showConfirmDialog({
      title: 'Keluarkan Mahasiswa?',
      text: `Apakah Anda yakin ingin mengeluarkan ${student.name} (${student.nim || student.username || '-'}) dari kelas ${classItem?.namaMk}?`,
      confirmButtonText: 'Ya, Keluarkan',
      cancelButtonText: 'Batal',
      icon: 'warning'
    });

    if (!confirmed) return;

    setActionLoading(true);
    try {
      const studentId = student.uid || student.id;
      await unenrollStudent(classItem.id, studentId, user);
      showSuccessToast(`${student.name} berhasil dikeluarkan dari kelas.`);
      if (onStudentsUpdated) {
        await onStudentsUpdated();
      }
    } catch (err) {
      showErrorAlert('Gagal Mengeluarkan Mahasiswa', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handler Tambah Satuan Mahasiswa
  const handleAddSingleStudent = async (student) => {
    const studentId = student.uid || student.id;
    setActionLoading(true);
    try {
      await enrollStudent(classItem.id, studentId, user, {
        bypassQuota,
        bypassRestrictions: true // Otoritas pengontrol Admin/BAA
      });
      showSuccessToast(`${student.name} berhasil ditambahkan ke kelas.`);
      setSelectedStudentIds(prev => prev.filter(id => id !== studentId));
      if (onStudentsUpdated) {
        await onStudentsUpdated();
      }
    } catch (err) {
      showErrorAlert('Gagal Menambahkan Mahasiswa', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handler Tambah Sekaligus (Batch Enrollment)
  const handleBatchEnroll = async () => {
    if (selectedStudentIds.length === 0) {
      showErrorAlert('Pilih Mahasiswa', 'Silakan centang minimal satu mahasiswa untuk didaftarkan.');
      return;
    }

    const currentCount = enrolledIds.length;
    const kuota = Number(classItem?.kuota || 40);
    const newTotal = currentCount + selectedStudentIds.length;

    if (!bypassQuota && newTotal > kuota) {
      showErrorAlert(
        'Kapasitas Kuota Terlampaui',
        `Menambahkan ${selectedStudentIds.length} mahasiswa akan melebihi kuota maksimal (${newTotal}/${kuota}). Aktifkan "Dispensasi Kuota BAA" jika institusi memberikan izin penambahan kapasitas.`
      );
      return;
    }

    const confirmed = await showConfirmDialog({
      title: `Tambahkan ${selectedStudentIds.length} Mahasiswa?`,
      text: `Seluruh mahasiswa terpilih akan didaftarkan ke kelas ${classItem?.namaMk} (${classItem?.namaKelas}).`,
      confirmButtonText: 'Ya, Daftarkan Semua',
      cancelButtonText: 'Batal',
      icon: 'question'
    });

    if (!confirmed) return;

    setActionLoading(true);
    let successCount = 0;
    let failMessages = [];

    try {
      for (const sId of selectedStudentIds) {
        try {
          await enrollStudent(classItem.id, sId, user, {
            bypassQuota,
            bypassRestrictions: true
          });
          successCount++;
        } catch (e) {
          failMessages.push(e.message);
        }
      }

      if (successCount > 0) {
        showSuccessToast(`Berhasil mendaftarkan ${successCount} mahasiswa ke dalam kelas.`);
      }
      if (failMessages.length > 0) {
        showErrorAlert('Sebagian Gagal', failMessages.slice(0, 3).join('\n'));
      }

      setSelectedStudentIds([]);
      if (onStudentsUpdated) {
        await onStudentsUpdated();
      }
    } catch (err) {
      showErrorAlert('Gagal Mendaftarkan Mahasiswa', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle checklist satuan
  const toggleSelectStudent = (studentId) => {
    setSelectedStudentIds(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  // Toggle checklist semua hasil pencarian
  const toggleSelectAllVisible = () => {
    const visibleIds = availableStudents.map(s => s.uid || s.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedStudentIds.includes(id));

    if (allSelected) {
      // Uncheck all visible
      setSelectedStudentIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      // Check all visible
      const newSet = new Set([...selectedStudentIds, ...visibleIds]);
      setSelectedStudentIds(Array.from(newSet));
    }
  };

  // Pilih otomatis seluruh mahasiswa yang semester dan prodinya cocok dengan mata kuliah ini
  const handleSelectMatchingSemesterStudents = () => {
    const matchingIds = availableStudents
      .filter(s => {
        const standing = calculateAcademicStanding(s.nim, s.angkatan);
        const sem = standing.semester || Number(s.semester) || 1;
        const prodiMatch = !targetMk?.prodiId || !s.prodiId || s.prodiId === targetMk.prodiId;
        return sem === courseSemester && prodiMatch;
      })
      .map(s => s.uid || s.id);

    setSelectedStudentIds(matchingIds);
    if (matchingIds.length > 0) {
      showSuccessToast(`${matchingIds.length} mahasiswa Semester ${courseSemester} berhasil dipilih.`);
    } else {
      showSuccessToast(`Tidak ada mahasiswa Semester ${courseSemester} yang belum terdaftar.`);
    }
  };

  if (!isOpen || !classItem) return null;

  const currentCount = enrolledIds.length;
  const kuota = Number(classItem.kuota || 40);
  const remainingQuota = Math.max(0, kuota - currentCount);
  const isFull = currentCount >= kuota;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
        
        {/* Header Modal */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-brand-900 to-slate-900 text-white flex justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[11px] font-mono font-bold bg-brand-800 px-2 py-0.5 rounded border border-brand-700">
                {classItem.kodeMk} • KELAS {classItem.namaKelas}
              </span>
              <span className="text-[11px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Kontrol BAA & Admin
              </span>
              <span className="text-[11px] bg-gold-500/20 text-gold-300 font-semibold px-2 py-0.5 rounded border border-gold-500/30">
                {classItem.namaTa}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white line-clamp-1">
              {classItem.namaMk}
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Dosen Pengampu: <strong className="text-white">{classItem.namaDosen}</strong> • Kapasitas Kuota: <strong className="text-white">{currentCount} / {kuota}</strong> Mahasiswa
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/75 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('ENROLLED')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 transition-all ${
              activeTab === 'ENROLLED'
                ? 'bg-white border-brand-800 text-brand-800 shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Peserta Terdaftar ({currentCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('ADD')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 transition-all ${
              activeTab === 'ADD'
                ? 'bg-white border-brand-800 text-brand-800 shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Tambah Mahasiswa Manual</span>
            {remainingQuota > 0 ? (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded-full">
                Sisa {remainingQuota}
              </span>
            ) : (
              <span className="text-[10px] bg-rose-100 text-rose-800 font-extrabold px-1.5 py-0.5 rounded-full">
                Penuh
              </span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {activeTab === 'ENROLLED' ? (
            /* ============================================================ */
            /* TAB 1: DAFTAR MAHASISWA TERDAFTAR */
            /* ============================================================ */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchEnrolled}
                    onChange={e => setSearchEnrolled(e.target.value)}
                    placeholder="Cari berdasarkan nama atau NIM..."
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  />
                </div>

                {/* Info Kuota */}
                <div className="text-xs text-slate-500 flex items-center gap-2 shrink-0">
                  <span>Status Kuota:</span>
                  <span className={`font-bold px-2.5 py-1 rounded-lg border text-[11px] ${
                    isFull 
                      ? 'bg-rose-50 text-rose-700 border-rose-200' 
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {currentCount} / {kuota} Terisi {isFull ? '(Penuh)' : `(Sisa ${remainingQuota})`}
                  </span>
                </div>
              </div>

              {/* Daftar Mahasiswa */}
              {loading ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  Memuat data mahasiswa terdaftar...
                </div>
              ) : enrolledStudents.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 space-y-2">
                  <Users className="w-8 h-8 text-slate-300 mx-auto" />
                  <div className="font-bold text-slate-700 text-sm">
                    {searchEnrolled ? 'Mahasiswa tidak ditemukan' : 'Belum Ada Mahasiswa Terdaftar'}
                  </div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {searchEnrolled 
                      ? `Tidak ada mahasiswa terdaftar yang cocok dengan kata kunci "${searchEnrolled}".`
                      : 'Kelas ini belum memiliki peserta. Klik tab "+ Tambah Mahasiswa Manual" untuk mendaftarkan mahasiswa.'
                    }
                  </p>
                  {!searchEnrolled && (
                    <button
                      onClick={() => setActiveTab('ADD')}
                      className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-brand-800 text-white rounded-xl text-xs font-bold hover:bg-brand-900 shadow-sm"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Tambah Mahasiswa Sekarang</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm divide-y divide-slate-100">
                  {enrolledStudents.map((mhs) => {
                    const matchedProdi = prodis.find(p => p.id === mhs.prodiId);
                    return (
                      <div 
                        key={mhs.uid || mhs.id} 
                        className="p-3 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-brand-50 text-brand-800 border border-brand-200 flex items-center justify-center font-bold text-xs shrink-0">
                            {(mhs.name || 'M')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                              {mhs.name}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5 flex-wrap">
                              <span>NIM: <strong className="text-slate-700">{mhs.nim || mhs.username || '-'}</strong></span>
                              <span>•</span>
                              <span>{matchedProdi?.namaProdi || mhs.prodiId || 'Reguler'}</span>
                              {mhs.angkatan && (
                                <>
                                  <span>•</span>
                                  <span>Angkatan {mhs.angkatan}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Tombol Keluarkan */}
                        <button
                          disabled={actionLoading}
                          onClick={() => handleRemoveStudent(mhs)}
                          title="Keluarkan mahasiswa dari kelas"
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm shrink-0 disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span className="hidden sm:inline">Keluarkan</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* ============================================================ */
            /* TAB 2: TAMBAH MAHASISWA MANUAL */
            /* ============================================================ */
            <div className="space-y-4">
              
              {/* Otoritas BAA Notice */}
              <div className="p-3.5 bg-brand-50/70 border border-brand-200 rounded-2xl flex items-start gap-3 text-xs text-brand-900">
                <Info className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-brand-950">
                    Otoritas Manual Pengontrol (Admin & BAA):
                  </div>
                  <p className="text-[11px] text-brand-800 leading-relaxed">
                    Sebagai pengontrol akademik, Anda dapat mendaftarkan mahasiswa secara manual ke kelas ini (termasuk kasus dispensasi penyesuaian KRS atau perbaikan nilai).
                  </p>
                  
                  {/* Toggle Dispensasi Kuota BAA */}
                  <div className="pt-1.5 flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-xs text-slate-800">
                      <input
                        type="checkbox"
                        checked={bypassQuota}
                        onChange={e => setBypassQuota(e.target.checked)}
                        className="rounded border-slate-300 text-brand-800 focus:ring-brand-500 w-4 h-4"
                      />
                      <span>Izinkan lewati kuota maksimal (Dispensasi Kapasitas BAA)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                <div className="sm:col-span-6 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchAvailable}
                    onChange={e => setSearchAvailable(e.target.value)}
                    placeholder="Cari nama mahasiswa atau NIM..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  />
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={filterProdi}
                    onChange={e => setFilterProdi(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    <option value="ALL">Semua Program Studi</option>
                    {prodis.map(p => (
                      <option key={p.id} value={p.id}>{p.namaProdi}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={filterAngkatan}
                    onChange={e => setFilterAngkatan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    <option value="ALL">Semua Angkatan</option>
                    {availableAngkatans.map(akt => (
                      <option key={akt} value={akt}>Angkatan {akt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Bar for Batch Selection */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pt-1 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleSelectAllVisible}
                    className="text-xs font-semibold text-slate-700 hover:text-brand-800 flex items-center gap-1.5 cursor-pointer"
                  >
                    {availableStudents.length > 0 && availableStudents.every(s => selectedStudentIds.includes(s.uid || s.id)) ? (
                      <CheckSquare className="w-4 h-4 text-brand-800" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                    <span>Pilih Semua Tampil ({availableStudents.length})</span>
                  </button>

                  {courseSemester && (
                    <button
                      type="button"
                      onClick={handleSelectMatchingSemesterStudents}
                      className="text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 flex items-center gap-1 transition-colors cursor-pointer"
                      title={`Pilih seluruh mahasiswa yang berada di Semester ${courseSemester}`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Pilih Mahasiswa Semester {courseSemester}</span>
                    </button>
                  )}

                  {selectedStudentIds.length > 0 && (
                    <span className="text-xs font-bold text-brand-800 bg-brand-50 px-2 py-0.5 rounded-lg border border-brand-200">
                      {selectedStudentIds.length} Mahasiswa Dipilih
                    </span>
                  )}
                </div>

                {selectedStudentIds.length > 0 && (
                  <button
                    disabled={actionLoading}
                    onClick={handleBatchEnroll}
                    className="px-4 py-1.5 bg-brand-800 hover:bg-brand-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Tambahkan Sekaligus ({selectedStudentIds.length})</span>
                  </button>
                )}
              </div>

              {/* List Mahasiswa Tersedia */}
              {loading ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  Memuat daftar mahasiswa...
                </div>
              ) : availableStudents.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 space-y-2">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                  <div className="font-bold text-slate-700 text-sm">
                    {searchAvailable || filterProdi !== 'ALL' || filterAngkatan !== 'ALL' 
                      ? 'Tidak ada mahasiswa yang cocok dengan filter'
                      : 'Semua mahasiswa telah terdaftar di kelas ini'
                    }
                  </div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Seluruh mahasiswa pada kriteria yang dicari sudah terdaftar sebagai peserta kelas perkuliahan ini.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm divide-y divide-slate-100 max-h-96 overflow-y-auto">
                  {availableStudents.map(mhs => {
                    const studentId = mhs.uid || mhs.id;
                    const isSelected = selectedStudentIds.includes(studentId);
                    const matchedProdi = prodis.find(p => p.id === mhs.prodiId);
                    const standing = calculateAcademicStanding(mhs.nim, mhs.angkatan);
                    const sem = standing.semester || Number(mhs.semester) || 1;
                    const isExactSemester = sem === courseSemester;

                    return (
                      <div 
                        key={studentId}
                        className={`p-3 sm:p-4 flex items-center justify-between gap-3 transition-colors ${
                          isSelected ? 'bg-brand-50/40' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectStudent(studentId)}
                            className="rounded border-slate-300 text-brand-800 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                          />

                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold text-xs shrink-0">
                            {(mhs.name || 'M')[0].toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <div className="font-bold text-xs sm:text-sm text-slate-900 truncate flex items-center gap-1.5">
                              <span>{mhs.name}</span>
                              <span className={`font-bold px-1.5 py-0.5 rounded border text-[10px] ${
                                isExactSemester 
                                  ? 'bg-indigo-50 text-indigo-800 border-indigo-200 font-extrabold' 
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                                Semester {sem} {isExactSemester ? '• Target Kelas' : ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5 flex-wrap">
                              <span>NIM: <strong className="text-slate-700">{mhs.nim || mhs.username || '-'}</strong></span>
                              <span>•</span>
                              <span>{matchedProdi?.namaProdi || mhs.prodiId || 'Reguler'}</span>
                              {mhs.angkatan && (
                                <>
                                  <span>•</span>
                                  <span>Angkatan {mhs.angkatan}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Tombol Tambah Satuan */}
                        <button
                          disabled={actionLoading || (!bypassQuota && isFull)}
                          onClick={() => handleAddSingleStudent(mhs)}
                          className="px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-800 border border-brand-200 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm shrink-0 disabled:opacity-50 cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Tambahkan</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs">
          <div className="text-slate-500">
            Total Terdaftar: <strong className="text-slate-900">{currentCount}</strong> / {kuota} Mahasiswa
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
