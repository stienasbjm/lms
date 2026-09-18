import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  getClassById, 
  updateMeeting, 
  addMeetingMaterial, 
  saveMeetingAttendance, 
  submitAssignment, 
  gradeSubmission,
  getUsers,
  enrollStudent,
  updateMeetingMedia,
  deleteMeetingMaterial,
  getTahunAkademik,
  subscribeToDataSync
} from '../firebase/firestoreService';
import { compressImageIfNeeded, formatBytes } from '../utils/imageCompressor';
import { 
  ArrowLeft, 
  BookOpen, 
  Calendar, 
  FileText, 
  Video, 
  CheckCircle, 
  Upload, 
  Award, 
  Users, 
  Clock, 
  AlertCircle, 
  ExternalLink,
  Play,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileUp,
  Plus,
  Link as LinkIcon,
  Settings,
  Share2,
  Check,
  Trash2,
  Lock,
  Edit3
} from 'lucide-react';
import { showSuccessAlert, showErrorAlert, showSuccessToast, showErrorToast, showConfirmDialog } from '../utils/alert';

export default function ClassDetailPage({ classId, onBack }) {
  const { user, isAdmin, isDosen, isMahasiswa } = useAuth();
  const [classData, setClassData] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [activeMeetingNumber, setActiveMeetingNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isTaActive, setIsTaActive] = useState(true);

  // Modals state
  const [showUploadMaterialModal, setShowUploadMaterialModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showTaskSubmitModal, setShowTaskSubmitModal] = useState(false);
  const [showGradingModal, setShowGradingModal] = useState(null);
  const [showEditMeetingModal, setShowEditMeetingModal] = useState(false);

  // Form states
  const [editMeetingForm, setEditMeetingForm] = useState({
    judul: '',
    deskripsi: '',
    subCpmk: '',
    indikatorObe: '',
    tanggal: ''
  });
  const [materialForm, setMaterialForm] = useState({ 
    judul: '', 
    linkUrl: '', 
    fileType: 'link/drive', 
    fileUrl: '' 
  });
  
  const [mediaForm, setMediaForm] = useState({
    videoType: 'GOOGLE_MEET',
    videoUrl: '',
    mediaTitle: ''
  });

  const [taskForm, setTaskForm] = useState({ judul: '', fileUrl: '', catatan: '' });
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [gradingForm, setGradingForm] = useState({ nilai: 85, feedback: '' });

  const loadClass = async () => {
    setLoading(true);
    try {
      const [cls, usrs, tas] = await Promise.all([
        getClassById(classId),
        getUsers(),
        getTahunAkademik()
      ]);
      setClassData(cls);
      setAllUsers(usrs);

      if (cls) {
        const classTa = tas.find(t => t.id === cls.tahunAkademikId || t.namaTa === cls.namaTa);
        setIsTaActive(classTa ? classTa.isActive : false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClass();
    const unsubscribe = subscribeToDataSync(() => {
      loadClass();
    });
    return () => unsubscribe();
  }, [classId, user]);

  if (loading || !classData) {
    return (
      <div className="flex items-center justify-center h-64 text-xs text-slate-500">
        <Clock className="w-5 h-5 animate-spin mr-2 text-brand-600" />
        Memuat detail kelas perkuliahan...
      </div>
    );
  }

  // Jika semester ditutup oleh BAA/Admin, Mahasiswa dan Dosen TIDAK DAPAT mengakses kelas ini
  if (!isAdmin && !isTaActive) {
    return (
      <div className="min-h-[420px] flex items-center justify-center p-6 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl border border-rose-200 p-8 max-w-lg text-center shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-rose-700 bg-rose-100 px-3 py-1 rounded-full border border-rose-200">
              Semester Ditutup Oleh BAA
            </span>
            <h3 className="font-extrabold text-lg text-slate-900 mt-2">
              Akses Perkuliahan Ditutup
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Tahun akademik / semester untuk kelas <strong>{classData.namaMk} ({classData.namaKelas})</strong> saat ini berstatus <strong>DITUTUP</strong> oleh Bagian Administrasi Akademik (BAA). 
              Sesuai ketentuan akademik STIE Nasional, mahasiswa dan dosen tidak dapat mengakses modul materi, presensi, pengumpulan tugas, maupun penilaian kelas ini.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-800 hover:bg-brand-900 text-white rounded-xl text-xs font-bold shadow-md transition-all transform hover:-translate-y-0.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Daftar Kelas Aktif</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeMeeting = classData.meetings.find(m => m.pertemuanKe === activeMeetingNumber) || classData.meetings[0];
  const enrolledStudentsList = allUsers.filter(u => (classData.enrolledStudents || []).includes(u.uid));
  const isLecturerOfThisClass = isDosen && classData.dosenId === user.uid;
  const canManageClass = isAdmin || isLecturerOfThisClass;

  // Buka modal edit judul & rincian pertemuan (Dosen)
  const handleOpenEditMeeting = () => {
    setEditMeetingForm({
      judul: activeMeeting.judul || `Pertemuan ${activeMeeting.pertemuanKe}: Pokok Bahasan Teori & Konsep ${activeMeeting.pertemuanKe}`,
      deskripsi: activeMeeting.deskripsi || '',
      subCpmk: activeMeeting.subCpmk || '',
      indikatorObe: activeMeeting.indikatorObe || '',
      tanggal: activeMeeting.tanggal || ''
    });
    setShowEditMeetingModal(true);
  };

  // Simpan perubahan judul & rincian pertemuan
  const handleSaveEditMeeting = async (e) => {
    e.preventDefault();
    if (!editMeetingForm.judul.trim()) {
      showErrorAlert("Judul Diperlukan", "Judul pertemuan tidak boleh kosong.");
      return;
    }

    try {
      await updateMeeting(classId, activeMeeting.pertemuanKe, {
        judul: editMeetingForm.judul.trim(),
        deskripsi: editMeetingForm.deskripsi.trim(),
        subCpmk: editMeetingForm.subCpmk.trim(),
        indikatorObe: editMeetingForm.indikatorObe.trim(),
        tanggal: editMeetingForm.tanggal
      }, user);

      setShowEditMeetingModal(false);
      await loadClass();
      showSuccessToast(`Judul & materi Pertemuan ke-${activeMeeting.pertemuanKe} berhasil disimpan!`);
    } catch (err) {
      showErrorAlert("Gagal Menyimpan Pertemuan", err.message);
    }
  };

  // Buka modal atur media
  const handleOpenMediaModal = () => {
    setMediaForm({
      videoType: activeMeeting.videoType || 'GOOGLE_MEET',
      videoUrl: activeMeeting.videoUrl || activeMeeting.googleMeetUrl || activeMeeting.zoomMeetingUrl || 'https://meet.google.com/stie-nas-lms',
      mediaTitle: activeMeeting.mediaTitle || `Sesi Kuliah Daring Pertemuan ${activeMeetingNumber}`
    });
    setShowMediaModal(true);
  };

  const handleSaveMediaSubmit = async (e) => {
    e.preventDefault();
    if (!isTaActive) return showErrorToast("Semester telah ditutup. Tindakan tidak diizinkan.");
    try {
      await updateMeetingMedia(classId, activeMeetingNumber, mediaForm, user);
      setShowMediaModal(false);
      showSuccessToast("Tautan ruang tatap muka daring diperbarui!");
      await loadClass();
    } catch (err) {
      showErrorAlert("Gagal Memperbarui Media", err.message);
    }
  };

  // Handler Sematkan Link Drive Bahan Ajar
  const handleUploadMaterialSubmit = async (e) => {
    e.preventDefault();
    if (!isTaActive) return showErrorToast("Semester telah ditutup. Tindakan tidak diizinkan.");
    if (!materialForm.judul || !materialForm.linkUrl) {
      showErrorAlert("Data Belum Lengkap", "Harap isi Judul Materi dan Tautan Link Drive.");
      return;
    }

    try {
      await addMeetingMaterial(classId, activeMeetingNumber, {
        judul: materialForm.judul,
        isLink: true,
        isGoogleDrive: true,
        source: 'GOOGLE_DRIVE',
        fileType: 'link/drive',
        fileUrl: materialForm.linkUrl,
        fileSize: 0
      }, user);

      setShowUploadMaterialModal(false);
      setMaterialForm({ judul: '', linkUrl: '', fileType: 'link/drive', fileUrl: '' });
      showSuccessToast("Materi Link Drive berhasil disematkan!");
      await loadClass();
    } catch (err) {
      showErrorAlert("Gagal Menyematkan Materi", err.message);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!isTaActive) return showErrorToast("Semester telah ditutup. Tindakan tidak diizinkan.");
    const confirmed = await showConfirmDialog({
      title: "Hapus Materi?",
      text: "Apakah Anda yakin ingin menghapus materi bahan ajar ini dari pertemuan?",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal"
    });
    if (!confirmed) return;

    try {
      await deleteMeetingMaterial(classId, activeMeetingNumber, materialId, user);
      showSuccessToast("Materi perkuliahan berhasil dihapus.");
      await loadClass();
    } catch (err) {
      showErrorAlert("Gagal Menghapus Materi", err.message);
    }
  };

  // Handler Buka Modal Presensi (disinkronkan dengan mahasiswa terdaftar)
  const handleOpenAttendanceModal = () => {
    const existing = activeMeeting.attendances || {};
    const initial = {};
    enrolledStudentsList.forEach(mhs => {
      initial[mhs.uid] = existing[mhs.uid] || {
        mahasiswaId: mhs.uid,
        nama: mhs.name,
        nim: mhs.nim || mhs.username,
        status: 'HADIR',
        catatan: ''
      };
    });
    setAttendanceRecords(initial);
    setShowAttendanceModal(true);
  };

  const handleSaveAttendance = async () => {
    if (!isTaActive) return showErrorToast("Semester telah ditutup. Tindakan tidak diizinkan.");
    try {
      await saveMeetingAttendance(classId, activeMeetingNumber, attendanceRecords, user);
      setShowAttendanceModal(false);
      showSuccessToast("Rekap presensi pertemuan berhasil disimpan!");
      await loadClass();
    } catch (err) {
      showErrorAlert("Gagal Menyimpan Presensi", err.message);
    }
  };

  // Handler Pengumpulan Tugas dengan Sematkan Link File Dokumen (Hemat Space Drive)
  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!isTaActive) return showErrorToast("Semester telah ditutup. Tindakan tidak diizinkan.");
    if (!taskForm.fileUrl) {
      showErrorAlert("Tautan Tugas Diperlukan", "Harap masukkan tautan link dokumen Google Drive / OneDrive tugas Anda.");
      return;
    }

    try {
      await submitAssignment(classId, activeMeetingNumber, {
        fileName: taskForm.judul || `${activeMeeting.taskTitle || 'Tugas Pertemuan ' + activeMeetingNumber}`,
        fileUrl: taskForm.fileUrl,
        fileSize: 0,
        isLink: true,
        catatan: taskForm.catatan,
        submittedAt: new Date().toISOString()
      }, user);

      setShowTaskSubmitModal(false);
      setTaskForm({ judul: '', fileUrl: '', catatan: '' });
      showSuccessAlert("Tugas Terkumpul", "Tugas berhasil disematkan dan dikumpulkan!");
      await loadClass();
    } catch (err) {
      showErrorAlert("Gagal Mengumpulkan Tugas", err.message);
    }
  };

  // Handler Penilaian Tugas (FR-06.3)
  const handleSaveGrading = async (e) => {
    e.preventDefault();
    if (!showGradingModal) return;
    if (!isTaActive) return showErrorToast("Semester telah ditutup. Tindakan tidak diizinkan.");

    try {
      await gradeSubmission(
        classId, 
        activeMeetingNumber, 
        showGradingModal.mahasiswaId, 
        gradingForm.nilai, 
        gradingForm.feedback, 
        user
      );
      setShowGradingModal(null);
      showSuccessToast("Nilai tugas mahasiswa berhasil disimpan!");
      await loadClass();
    } catch (err) {
      showErrorAlert("Gagal Menyimpan Penilaian", err.message);
    }
  };

  const mySubmission = activeMeeting.submissions ? activeMeeting.submissions[user.uid] : null;

  // Hitung status presensi
  const existingAttendances = activeMeeting.attendances || {};
  const attendedCount = Object.values(existingAttendances).filter(a => a.status === 'HADIR').length;

  return (
    <div className="space-y-6">
      
      {/* Back Button & Class Banner */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-brand-800 mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar Kelas
        </button>

        {!isTaActive && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
            <Lock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-rose-900">Semester Telah Ditutup</h4>
              <p className="text-xs text-rose-700 mt-0.5">
                Aktivitas pembelajaran pada kelas ini (pengumpulan tugas, presensi, penambahan materi) telah dikunci karena semester sudah ditutup oleh Bagian Akademik (BAA).
              </p>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-brand-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono font-bold bg-brand-800 px-2.5 py-0.5 rounded border border-brand-700">
                  {classData.kodeMk} • KELAS {classData.namaKelas}
                </span>
                <span className="text-xs bg-gold-500/20 text-gold-300 font-semibold px-2.5 py-0.5 rounded border border-gold-500/30">
                  {classData.namaTa}
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                {classData.namaMk}
              </h1>
              <p className="text-xs text-slate-300 mt-1">
                Dosen Pengampu: <strong className="text-white">{classData.namaDosen}</strong> • {classData.sks} SKS • {classData.hari}, {classData.jam} ({classData.ruang})
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-slate-400">Mahasiswa Terdaftar</div>
                <div className="text-lg font-bold text-white">
                  {enrolledStudentsList.length} / {classData.kuota}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 16 Pertemuan Selector Bar (FR-03.2) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Navigasi 16 Pertemuan RPS Perkuliahan:
          </span>
          <span className="text-xs text-slate-400">
            Pilih pertemuan untuk melihat bahan ajar & daring
          </span>
        </div>

        {/* 16 Pertemuan Pills */}
        <div className="grid grid-cols-4 sm:grid-cols-8 xl:grid-cols-16 gap-1.5 sm:gap-2 text-center">
          {classData.meetings.map(m => {
            const isSelected = m.pertemuanKe === activeMeetingNumber;
            const isUTS = m.pertemuanKe === 8;
            const isUAS = m.pertemuanKe === 16;

            return (
              <button
                key={m.pertemuanKe}
                onClick={() => setActiveMeetingNumber(m.pertemuanKe)}
                className={`py-2 px-1 rounded-xl text-xs font-bold transition-all relative ${
                  isSelected 
                    ? 'bg-brand-800 text-white shadow-md scale-105 z-10 ring-2 ring-brand-400' 
                    : isUTS 
                    ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300' 
                    : isUAS 
                    ? 'bg-purple-100 text-purple-900 hover:bg-purple-200 border border-purple-300'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <div>P-{m.pertemuanKe}</div>
                <div className="text-[9px] font-medium tracking-tighter">
                  {isUTS ? 'UTS' : isUAS ? 'UAS' : 'Materi'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pertemuan Active View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Detail Pertemuan, Video/Daring, & Bahan Ajar */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Header Pertemuan */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-800 border border-brand-200">
                    Pertemuan ke-{activeMeeting.pertemuanKe}
                  </span>
                  {activeMeeting.isExam && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                      Evaluasi Resmi: {activeMeeting.examType}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-2">
                  {activeMeeting.judul}
                </h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {activeMeeting.deskripsi}
                </p>

                {/* Indikator Kurikulum OBE (Outcome-Based Education) */}
                <div className="mt-3 p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-950">
                    <span className="px-1.5 py-0.5 rounded bg-indigo-200 text-indigo-900 text-[10px] font-mono uppercase">
                      Kurikulum OBE
                    </span>
                    <span>Capaian Pembelajaran (Sub-CPMK):</span>
                  </div>
                  <p className="text-xs text-indigo-900 font-medium leading-relaxed">
                    {activeMeeting.subCpmk || `Sub-CPMK ${activeMeeting.pertemuanKe}: Mahasiswa mampu menganalisis konsep modul ${activeMeeting.pertemuanKe} secara terstruktur dan terstandar.`}
                  </p>
                  <div className="text-[10px] text-indigo-700 pt-1 border-t border-indigo-200/60 flex items-center justify-between">
                    <span>Indikator Asesmen Otentik: {activeMeeting.indikatorObe || 'Rubrik Analitik Kinerja Skala 0–100'}</span>
                    <span className="font-semibold text-indigo-900">Bobot Evaluasi: Terintegrasi CPL</span>
                  </div>
                </div>
              </div>

              {canManageClass && isTaActive && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleOpenEditMeeting}
                    className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                    <span>Edit Judul Pertemuan</span>
                  </button>

                  <button
                    onClick={handleOpenAttendanceModal}
                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Presensi Mahasiswa
                  </button>
                </div>
              )}
            </div>

            {/* Video Pembelajaran / Tautan Konferensi Daring (Google Meet / Zoom / YouTube) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-brand-700" />
                  Media Perkuliahan Daring (Google Meet / Zoom / YouTube)
                </span>
                {canManageClass && isTaActive && (
                  <button
                    onClick={handleOpenMediaModal}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-brand-800 bg-white border border-brand-200 rounded-lg hover:bg-brand-50 shadow-sm"
                  >
                    <Settings className="w-3.5 h-3.5 text-brand-600" />
                    Atur Media Daring
                  </button>
                )}
              </div>

              {/* Tampilan Media Sesuai Tipe */}
              {activeMeeting.videoType === 'YOUTUBE' && activeMeeting.videoUrl ? (
                <div className="space-y-2">
                  <div className="aspect-video w-full rounded-xl overflow-hidden shadow-inner bg-black">
                    <iframe 
                      className="w-full h-full"
                      src={activeMeeting.videoUrl.includes('embed') ? activeMeeting.videoUrl : "https://www.youtube.com/embed/dQw4w9WgXcQ"} 
                      title="Video Pembelajaran STIE Nasional"
                      allowFullScreen
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>{activeMeeting.mediaTitle || 'Video Penjelasan Sesi'}</span>
                    <a 
                      href={activeMeeting.videoUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-red-600 font-bold hover:underline flex items-center gap-1"
                    >
                      Buka di YouTube <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ) : activeMeeting.videoType === 'ZOOM' ? (
                <div className="p-4 bg-blue-50/80 rounded-xl border border-blue-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <div className="font-bold text-xs text-blue-950 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      Zoom Meeting Terjadwal
                    </div>
                    <div className="text-[11px] text-blue-800 mt-0.5 truncate max-w-md">
                      {activeMeeting.videoUrl || activeMeeting.zoomMeetingUrl || 'https://zoom.us/j/123456789'}
                    </div>
                  </div>
                  <a
                    href={activeMeeting.videoUrl || activeMeeting.zoomMeetingUrl || 'https://zoom.us/j/123456789'}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow inline-flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Video className="w-4 h-4" />
                    Gabung Zoom Meeting
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                /* Default / GOOGLE_MEET */
                <div className="p-4 bg-emerald-50/80 rounded-xl border border-emerald-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <div className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                      Google Meet Tatap Muka Virtual
                    </div>
                    <div className="text-[11px] text-emerald-800 mt-0.5 truncate max-w-md">
                      {activeMeeting.videoUrl || activeMeeting.googleMeetUrl || 'https://meet.google.com/stie-nas-lms'}
                    </div>
                  </div>
                  <a
                    href={activeMeeting.videoUrl || activeMeeting.googleMeetUrl || 'https://meet.google.com/stie-nas-lms'}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow inline-flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Video className="w-4 h-4" />
                    Buka & Gabung Google Meet
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Modul Bahan Ajar (FR-04.1) - Sematkan Link Drive Saja */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-brand-700" />
                  Bahan Ajar & Modul Kuliah ({(activeMeeting.materials || []).length})
                </h3>
                {canManageClass && isTaActive && (
                  <button
                    onClick={() => setShowUploadMaterialModal(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Sematkan Link Drive
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {(activeMeeting.materials || []).length === 0 ? (
                  <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                    Belum ada link drive bahan ajar yang disematkan untuk pertemuan ini.
                  </div>
                ) : (
                  (activeMeeting.materials || []).map(mat => (
                    <div 
                      key={mat.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-center hover:border-brand-300 transition-colors shadow-sm"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
                          <Share2 className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{mat.judul}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                              Link Drive
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Tautan Berkas Bahan Ajar Link Drive
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={mat.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 font-bold text-xs rounded-lg transition-colors border flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 shadow-sm"
                        >
                          <span>Buka Link Drive</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        {canManageClass && isTaActive && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMaterial(mat.id)}
                            title="Hapus materi ini"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Kolom Kanan: Tugas Pertemuan & Presensi Ter-sinkronisasi */}
        <div className="space-y-6">
          
          {/* Card Presensi Pertemuan Ini (Ter-sinkronisasi dengan Mahasiswa yang Terdata Mengambil MK) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-brand-700" />
                Presensi Pertemuan {activeMeetingNumber}
              </h4>
              <span className="text-[11px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                {attendedCount} / {enrolledStudentsList.length} Hadir
              </span>
            </div>

            {/* Status Untuk Mahasiswa */}
            {isMahasiswa && (
              <div className="p-3 rounded-xl border bg-slate-50 text-xs space-y-1">
                <div className="text-slate-500 font-medium">Status Kehadiran Anda:</div>
                <div className="flex items-center gap-1.5">
                  {existingAttendances[user.uid]?.status === 'HADIR' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> HADIR
                    </span>
                  ) : existingAttendances[user.uid]?.status ? (
                    <span className="inline-flex items-center gap-1 text-xs font-extrabold text-blue-800 bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-300">
                      {existingAttendances[user.uid].status}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-200 px-2.5 py-1 rounded-lg">
                      BELUM TERCATAT
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Daftar Sinkronisasi Mahasiswa untuk Dosen & Admin */}
            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-semibold text-slate-500 flex justify-between">
                <span>Daftar Mahasiswa Mengambil MK ({enrolledStudentsList.length}):</span>
                {canManageClass && isTaActive && (
                  <button
                    onClick={handleOpenAttendanceModal}
                    className="text-brand-700 hover:underline font-bold text-xs"
                  >
                    Ubah Presensi
                  </button>
                )}
              </div>

              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 pr-1">
                {enrolledStudentsList.map(mhs => {
                  const rec = existingAttendances[mhs.uid];
                  const status = rec?.status || 'BELUM';
                  return (
                    <div key={mhs.uid} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{mhs.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">NIM: {mhs.nim || mhs.username}</div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        status === 'HADIR' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                        status === 'IZIN' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                        status === 'SAKIT' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                        status === 'ALPHA' ? 'bg-rose-50 text-rose-700 border-rose-300' :
                        'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {canManageClass && isTaActive && (
              <button
                onClick={handleOpenAttendanceModal}
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Input / Rekap Presensi Cepat
              </button>
            )}
          </div>

          {/* Box Tugas Pertemuan */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-brand-700" />
              Tugas & Evaluasi Pertemuan {activeMeeting.pertemuanKe}
            </h3>

            {activeMeeting.hasTask || activeMeeting.isExam ? (
              <div className="space-y-3">
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                  <div className="font-bold mb-1">
                    {activeMeeting.isExam ? `Ujian Resmi: ${activeMeeting.examType}` : activeMeeting.taskTitle}
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Batas waktu pengumpulan: <strong>{activeMeeting.taskDeadline || '23:59 WITA'}</strong>.
                  </p>
                </div>

                {/* Status Pengumpulan untuk Mahasiswa */}
                {isMahasiswa && (
                  <div className="pt-2">
                    {mySubmission ? (
                      <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-2">
                        <div className="flex items-center gap-1.5 font-bold">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          Tugas Telah Dikumpulkan (Link Disematkan)!
                        </div>
                        <div className="text-[11px] flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-emerald-200/60">
                          <span>Dokumen: <strong>{mySubmission.fileName}</strong></span>
                          {mySubmission.fileUrl && (
                            <a
                              href={mySubmission.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold shadow-sm"
                            >
                              <span>Buka Link Tugas</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        {mySubmission.catatan && (
                          <p className="text-[11px] text-emerald-800 italic bg-emerald-100/40 p-2 rounded-lg">
                            Catatan Anda: "{mySubmission.catatan}"
                          </p>
                        )}
                        {mySubmission.nilai !== undefined ? (
                          <div className="p-2 bg-white rounded-lg border border-emerald-300 mt-2">
                            <span className="text-[11px] text-slate-500 block">Nilai Dosen:</span>
                            <span className="text-lg font-extrabold text-emerald-700">{mySubmission.nilai} / 100</span>
                            {mySubmission.catatanDosen && (
                              <p className="text-[11px] text-slate-600 mt-1 italic">
                                "{mySubmission.catatanDosen}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-500 italic">Menunggu penilaian Dosen.</div>
                        )}
                      </div>
                    ) : (
                      isTaActive ? (
                        <button
                          onClick={() => setShowTaskSubmitModal(true)}
                          className="w-full py-2.5 bg-brand-800 hover:bg-brand-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                          Sematkan Link Tugas Mahasiswa
                        </button>
                      ) : (
                        <div className="text-center p-3 bg-slate-100 rounded-xl text-slate-500 text-xs font-medium border border-slate-200">
                          Semester telah ditutup. Tidak dapat mengumpulkan tugas.
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* Daftar Pengumpulan Mahasiswa untuk Dosen/Admin */}
                {canManageClass && (
                  <div className="pt-2 space-y-2">
                    <div className="text-xs font-semibold text-slate-700 flex justify-between">
                      <span>Mahasiswa Mengumpulkan:</span>
                      <span>{Object.keys(activeMeeting.submissions || {}).length} Orang</span>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {Object.values(activeMeeting.submissions || {}).map(sub => (
                        <div key={sub.mahasiswaId} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex justify-between items-center gap-2">
                          <div>
                            <div className="font-bold text-slate-900">{sub.mahasiswaName}</div>
                            <div className="text-[10px] text-slate-400">NIM: {sub.nim}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {sub.fileUrl && (
                              <a
                                href={sub.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                              >
                                <span>Buka Link Tugas</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            {sub.nilai !== undefined ? (
                              <button
                                onClick={() => {
                                  if (!isTaActive) return showErrorToast("Semester ditutup, tidak dapat mengubah nilai.");
                                  setShowGradingModal(sub);
                                  setGradingForm({ nilai: sub.nilai, feedback: sub.catatanDosen || '' });
                                }}
                                className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded font-bold text-xs"
                              >
                                Nilai: {sub.nilai}
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  if (!isTaActive) return showErrorToast("Semester ditutup, tidak dapat mengubah nilai.");
                                  setShowGradingModal(sub);
                                  setGradingForm({ nilai: 85, feedback: '' });
                                }}
                                className="px-2.5 py-1 bg-brand-800 text-white rounded font-bold text-xs hover:bg-brand-900"
                              >
                                Beri Nilai
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                Tidak ada penugasan terstruktur untuk pertemuan ini.
              </div>
            )}
          </div>

        </div>

      </div>

      {/* MODAL 1: ATUR MEDIA PERKULIAHAN DARING (YOUTUBE / ZOOM / GOOGLE MEET) */}
      {showMediaModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 mb-1">
              Atur Media Perkuliahan Daring
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Sematkan link Google Meet, Zoom Meeting, atau Video YouTube untuk Pertemuan {activeMeetingNumber}
            </p>

            <form onSubmit={handleSaveMediaSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Pilih Platform Media</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMediaForm({...mediaForm, videoType: 'GOOGLE_MEET'})}
                    className={`p-2 rounded-xl border text-center font-bold transition-all ${
                      mediaForm.videoType === 'GOOGLE_MEET' 
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-500 shadow-sm' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Google Meet
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaForm({...mediaForm, videoType: 'ZOOM'})}
                    className={`p-2 rounded-xl border text-center font-bold transition-all ${
                      mediaForm.videoType === 'ZOOM' 
                        ? 'bg-blue-50 text-blue-900 border-blue-500 shadow-sm' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Zoom Meeting
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaForm({...mediaForm, videoType: 'YOUTUBE'})}
                    className={`p-2 rounded-xl border text-center font-bold transition-all ${
                      mediaForm.videoType === 'YOUTUBE' 
                        ? 'bg-red-50 text-red-900 border-red-500 shadow-sm' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    YouTube
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {mediaForm.videoType === 'GOOGLE_MEET' ? 'Tautan Google Meet URL' :
                   mediaForm.videoType === 'ZOOM' ? 'Tautan Zoom Meeting URL' :
                   'Tautan / URL Video YouTube'}
                </label>
                <input
                  type="url"
                  required
                  value={mediaForm.videoUrl}
                  onChange={e => setMediaForm({...mediaForm, videoUrl: e.target.value})}
                  placeholder={
                    mediaForm.videoType === 'GOOGLE_MEET' ? 'https://meet.google.com/abc-defg-hij' :
                    mediaForm.videoType === 'ZOOM' ? 'https://zoom.us/j/123456789' :
                    'https://www.youtube.com/watch?v=...'
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Judul / Keterangan Sesi Daring</label>
                <input
                  type="text"
                  value={mediaForm.mediaTitle}
                  onChange={e => setMediaForm({...mediaForm, mediaTitle: e.target.value})}
                  placeholder="contoh: Kuliah Tatap Muka Daring Bab 4"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowMediaModal(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-800 text-white rounded-lg font-bold hover:bg-brand-900"
                >
                  Simpan Media Daring
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SEMATKAN LINK DRIVE BAHAN AJAR */}
      {showUploadMaterialModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
                <Share2 className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Sematkan Link Drive</h3>
                <p className="text-xs text-slate-500">
                  Pertemuan ke-{activeMeetingNumber} • Hemat Kuota Cloud Storage
                </p>
              </div>
            </div>

            <div className="my-3 p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
              💡 <strong>Hemat Penyimpanan:</strong> Dokumen/materi perkuliahan disimpan di Google Drive / Cloud Anda, dan cukup tautan publik yang disematkan di sini agar tidak memakan kuota server.
            </div>

            <form onSubmit={handleUploadMaterialSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Judul Dokumen / Bahan Ajar</label>
                <input
                  type="text"
                  required
                  placeholder="contoh: Modul Pembelajaran Bab 2 (Link Drive)"
                  value={materialForm.judul}
                  onChange={e => setMaterialForm({...materialForm, judul: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tautan Link Drive (Google Drive / Cloud URL)</label>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/file/d/... atau https://drive.google.com/drive/folders/..."
                  value={materialForm.linkUrl}
                  onChange={e => setMaterialForm({...materialForm, linkUrl: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 font-mono text-xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Pastikan izin akses tautan Google Drive disetel ke <em>'Siapa saja yang memiliki link dapat melihat (Viewer)'</em>.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowUploadMaterialModal(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg font-bold transition-colors shadow-sm"
                >
                  Sematkan Link Drive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PRESENSI MAHASISWA (TER-SINKRONISASI DENGAN ENROLLED STUDENTS) */}
      {showAttendanceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 border border-slate-200 max-h-[90vh] flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 mb-1">
                Input Presensi Pertemuan ke-{activeMeetingNumber}
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Ter-sinkronisasi dengan seluruh mahasiswa terdaftar ({enrolledStudentsList.length} orang)
              </p>

              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 pr-1">
                {enrolledStudentsList.map(mhs => {
                  const currentStatus = attendanceRecords[mhs.uid]?.status || 'HADIR';
                  return (
                    <div key={mhs.uid} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{mhs.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">NIM: {mhs.nim || mhs.username}</div>
                      </div>

                      <div className="flex gap-1.5">
                        {['HADIR', 'IZIN', 'SAKIT', 'ALPHA'].map(st => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => {
                              setAttendanceRecords(prev => ({
                                ...prev,
                                [mhs.uid]: {
                                  ...prev[mhs.uid],
                                  mahasiswaId: mhs.uid,
                                  nama: mhs.name,
                                  nim: mhs.nim || mhs.username,
                                  status: st
                                }
                              }));
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                              currentStatus === st 
                                ? st === 'HADIR' ? 'bg-emerald-600 text-white border-emerald-600'
                                : st === 'IZIN' ? 'bg-blue-600 text-white border-blue-600'
                                : st === 'SAKIT' ? 'bg-amber-600 text-white border-amber-600'
                                : 'bg-rose-600 text-white border-rose-600'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 mt-4">
              <button
                type="button"
                onClick={() => setShowAttendanceModal(false)}
                className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-xs"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleSaveAttendance}
                className="px-4 py-1.5 bg-brand-800 text-white rounded-lg font-bold hover:bg-brand-900 text-xs shadow"
              >
                Simpan Presensi Pertemuan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: SEMATKAN LINK TUGAS MAHASISWA (HEMAT SPACE DRIVE) */}
      {showTaskSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                <Share2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Sematkan Link Dokumen Tugas</h3>
                <p className="text-xs text-slate-500">
                  Pertemuan ke-{activeMeetingNumber} • Hemat Space Drive Cloud
                </p>
              </div>
            </div>

            <div className="my-3 p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 leading-relaxed">
              💡 <strong>Hemat Penyimpanan Server:</strong> Lembar jawaban tugas Anda (PDF / Dokumen / Spreadsheet) disimpan di Google Drive / Cloud Anda sendiri. Cukup sematkan link publiknya di sini agar tidak memakan ruang storage server.
            </div>

            <form onSubmit={handleTaskSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Judul / Deskripsi Dokumen Tugas</label>
                <input
                  type="text"
                  placeholder="contoh: Lembar Jawaban Studi Kasus - Ahmad Fadillah"
                  value={taskForm.judul}
                  onChange={e => setTaskForm({...taskForm, judul: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tautan Link Berkas / Dokumen (Google Drive / Cloud URL)</label>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/file/d/... atau https://docs.google.com/..."
                  value={taskForm.fileUrl}
                  onChange={e => setTaskForm({...taskForm, fileUrl: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Pastikan hak akses link Google Drive disetel ke <em>'Siapa saja yang memiliki link dapat melihat'</em>.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Catatan Tambahan untuk Dosen (Opsional)</label>
                <textarea
                  rows="3"
                  value={taskForm.catatan}
                  onChange={e => setTaskForm({...taskForm, catatan: e.target.value})}
                  placeholder="Tuliskan catatan pengerjaan atau keterangan khusus..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowTaskSubmitModal(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-sm transition-colors"
                >
                  Sematkan & Kumpulkan Tugas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: PENILAIAN TUGAS OLEH DOSEN */}
      {showGradingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 mb-1">Penilaian Tugas Mahasiswa</h3>
            <p className="text-xs text-slate-500 mb-4">
              Mahasiswa: <strong>{showGradingModal.mahasiswaName}</strong> (NIM: {showGradingModal.nim})
            </p>

            <form onSubmit={handleSaveGrading} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nilai Angka (Skala 0 - 100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={gradingForm.nilai}
                  onChange={e => setGradingForm({...gradingForm, nilai: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 text-base font-bold text-brand-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Umpan Balik / Catatan Dosen</label>
                <textarea
                  rows="3"
                  value={gradingForm.feedback}
                  onChange={e => setGradingForm({...gradingForm, feedback: e.target.value})}
                  placeholder="Bagus, analisis studi kasus sangat mendalam..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowGradingModal(null)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-800 text-white rounded-lg font-bold hover:bg-brand-900"
                >
                  Simpan Nilai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: EDIT JUDUL & POKOK BAHASAN PERTEMUAN OLEH DOSEN */}
      {showEditMeetingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
                <Edit3 className="w-5 h-5 text-amber-800" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Edit Judul & Pokok Bahasan Pertemuan {activeMeeting.pertemuanKe}
                </h3>
                <p className="text-xs text-slate-500">
                  Kustomisasi judul topik perkuliahan dan capaian pembelajaran OBE
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveEditMeeting} className="space-y-4 text-xs mt-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Judul Pertemuan *
                </label>
                <input
                  type="text"
                  required
                  placeholder={`Contoh: Pertemuan ${activeMeeting.pertemuanKe}: Pokok Bahasan Teori & Konsep ${activeMeeting.pertemuanKe}`}
                  value={editMeetingForm.judul}
                  onChange={e => setEditMeetingForm({ ...editMeetingForm, judul: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 font-bold text-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Deskripsi Modul / Pokok Bahasan
                </label>
                <textarea
                  rows="3"
                  placeholder="Rangkuman pokok bahasan, instruksi modul RPS, dan studi kasus perkuliahan..."
                  value={editMeetingForm.deskripsi}
                  onChange={e => setEditMeetingForm({ ...editMeetingForm, deskripsi: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 text-xs leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Capaian Pembelajaran (Sub-CPMK) Kurikulum OBE
                </label>
                <input
                  type="text"
                  placeholder="Sub-CPMK: Mampu menganalisis konsep teoritis..."
                  value={editMeetingForm.subCpmk}
                  onChange={e => setEditMeetingForm({ ...editMeetingForm, subCpmk: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Indikator Asesmen Otentik
                  </label>
                  <input
                    type="text"
                    placeholder="Ketepatan analisis, rubrik 0-100"
                    value={editMeetingForm.indikatorObe}
                    onChange={e => setEditMeetingForm({ ...editMeetingForm, indikatorObe: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Tanggal Pelaksanaan
                  </label>
                  <input
                    type="date"
                    value={editMeetingForm.tanggal}
                    onChange={e => setEditMeetingForm({ ...editMeetingForm, tanggal: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEditMeetingModal(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-800 hover:bg-brand-900 text-white rounded-lg font-bold shadow transition-colors"
                >
                  Simpan Judul Pertemuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
