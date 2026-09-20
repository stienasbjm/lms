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
  unenrollStudent,
  updateMeetingMedia,
  deleteMeetingMaterial,
  getTahunAkademik,
  subscribeToDataSync,
  getClassMessages,
  sendClassMessage,
  markClassMessagesAsRead,
  isClassAssignedToLecturer,
  editClassMessage,
  deleteClassMessage
} from '../firebase/firestoreService';
import ManageClassStudentsModal from '../components/classes/ManageClassStudentsModal';
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
  Unlock,
  Edit3,
  MessageSquare,
  Send,
  MessageCircle,
  CalendarCheck,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Timer,
  ShieldAlert
} from 'lucide-react';
import { showSuccessAlert, showErrorAlert, showSuccessToast, showErrorToast, showConfirmDialog } from '../utils/alert';

export default function ClassDetailPage({ classId, onBack, initialTab = 'MEETINGS' }) {
  const { user, isAdmin, isBaa, isSuperAdmin, isDosen, isMahasiswa } = useAuth();
  const [classData, setClassData] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [activeMeetingNumber, setActiveMeetingNumber] = useState(1);
  const [activeMainTab, setActiveMainTab] = useState(initialTab || 'MEETINGS'); // 'MEETINGS' | 'MESSAGES' | 'STUDENTS'
  const [loading, setLoading] = useState(true);
  const [isTaActive, setIsTaActive] = useState(true);

  // Class Messages & Discussion State
  const [classMessages, setClassMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  // State untuk edit pesan
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [isDeletingMessageId, setIsDeletingMessageId] = useState(null);
  // State hover untuk tombol aksi pesan
  const [hoveredMessageId, setHoveredMessageId] = useState(null);

  // Modals state
  const [showUploadMaterialModal, setShowUploadMaterialModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showTaskSubmitModal, setShowTaskSubmitModal] = useState(false);
  const [showTaskConfigModal, setShowTaskConfigModal] = useState(false);
  const [showGradingModal, setShowGradingModal] = useState(null);
  const [showEditMeetingModal, setShowEditMeetingModal] = useState(false);
  const [showStudentManagementModal, setShowStudentManagementModal] = useState(false);

  // Form states untuk pengaturan tugas & jadwal deadline oleh Dosen
  const [taskConfigForm, setTaskConfigForm] = useState({
    taskTitle: '',
    taskDesc: '',
    taskWeight: '10%',
    taskDeadline: '',
    isTaskOpen: true,
    hasTask: true
  });

  // Handler: Toggle buka/tutup kelas per pertemuan oleh Dosen
  const handleToggleClassOpen = async () => {
    if (!isTaActive) return showErrorToast('Semester telah ditutup. Tindakan tidak diizinkan.');
    const newIsOpen = !(activeMeeting.isOpen !== false); // default open = true
    const label = newIsOpen ? 'DIBUKA' : 'DITUTUP';
    const confirmed = await showConfirmDialog({
      title: newIsOpen ? 'Buka Sesi Pertemuan?' : 'Tutup Sesi Pertemuan?',
      text: newIsOpen
        ? `Mahasiswa akan dapat melakukan aktivitas (presensi, diskusi, tugas) pada Pertemuan ${activeMeetingNumber}.`
        : `Mahasiswa tidak akan dapat melakukan aktivitas apapun saat sesi Pertemuan ${activeMeetingNumber} ditutup.`,
      confirmButtonText: `Ya, ${label}`,
      cancelButtonText: 'Batal',
      icon: newIsOpen ? 'success' : 'warning'
    });
    if (!confirmed) return;
    try {
      // Optimistic update — UI langsung diperbarui
      setClassData(prev => {
        if (!prev) return prev;
        const updatedMeetings = prev.meetings.map(m =>
          m.pertemuanKe === activeMeetingNumber ? { ...m, isOpen: newIsOpen } : m
        );
        return { ...prev, meetings: updatedMeetings };
      });
      await updateMeeting(classId, activeMeetingNumber, { isOpen: newIsOpen }, user);
      showSuccessToast(`Sesi Pertemuan ${activeMeetingNumber} berhasil ${label}.`);
      // TIDAK memanggil loadClass(false) setelah update — optimistic update sudah cukup
      // dan loadClass bisa mengembalikan data stale dari Firestore (eventual consistency)
    } catch (err) {
      showErrorAlert('Gagal Mengubah Status Kelas', err.message);
      await loadClass(false); // Hanya reload saat error untuk rollback
    }
  };

  // Handler: Toggle Buka/Tutup Pengumpulan Tugas per pertemuan oleh Dosen
  const handleToggleTaskOpen = async () => {
    if (!isTaActive) return showErrorToast('Semester telah ditutup. Tindakan tidak diizinkan.');
    const currentStatus = activeMeeting.isTaskOpen !== false;
    const newStatus = !currentStatus;
    const label = newStatus ? 'DIBUKA' : 'DITUTUP';
    const confirmed = await showConfirmDialog({
      title: newStatus ? 'Buka Pengumpulan Tugas?' : 'Tutup Pengumpulan Tugas?',
      text: newStatus
        ? `Mahasiswa akan dapat menyematkan dan memperbarui tautan tugas pada Pertemuan ${activeMeetingNumber}.`
        : `Pengumpulan tugas Pertemuan ${activeMeetingNumber} akan ditutup. Mahasiswa tidak dapat lagi menyematkan atau memperbarui tugas.`,
      confirmButtonText: `Ya, ${label}`,
      cancelButtonText: 'Batal',
      icon: newStatus ? 'success' : 'warning'
    });
    if (!confirmed) return;

    // Optimistic update — UI langsung diperbarui seketika
    setClassData(prev => {
      if (!prev) return prev;
      const updatedMeetings = prev.meetings.map(m =>
        m.pertemuanKe === activeMeetingNumber ? { ...m, isTaskOpen: newStatus } : m
      );
      return { ...prev, meetings: updatedMeetings };
    });

    try {
      await updateMeeting(classId, activeMeetingNumber, { isTaskOpen: newStatus }, user);
      showSuccessToast(`Status Pengumpulan Tugas Pertemuan ${activeMeetingNumber} berhasil ${label}!`);
    } catch (err) {
      showErrorAlert('Gagal Mengubah Status Tugas', err.message);
      await loadClass(false);
    }
  };

  // Handler: Buka modal konfigurasi tugas oleh Dosen
  const handleOpenTaskConfig = () => {
    let deadlineStr = '';
    if (activeMeeting.taskDeadline) {
      try {
        const d = new Date(activeMeeting.taskDeadline);
        if (!isNaN(d.getTime())) {
          deadlineStr = d.toISOString().slice(0, 16);
        }
      } catch (e) {}
    }

    setTaskConfigForm({
      taskTitle: activeMeeting.taskTitle || `Tugas Studi Kasus Pertemuan ${activeMeetingNumber}`,
      taskDesc: activeMeeting.taskDesc || '',
      taskWeight: activeMeeting.taskWeight || '10%',
      taskDeadline: deadlineStr,
      isTaskOpen: activeMeeting.isTaskOpen !== false,
      hasTask: activeMeeting.hasTask !== false
    });
    setShowTaskConfigModal(true);
  };

  // Handler: Simpan konfigurasi tugas oleh Dosen
  const handleSaveTaskConfig = async (e) => {
    e?.preventDefault?.();
    if (!isTaActive) return showErrorToast('Semester telah ditutup. Tindakan tidak diizinkan.');
    try {
      let deadlineIso = null;
      if (taskConfigForm.taskDeadline) {
        try {
          const d = new Date(taskConfigForm.taskDeadline);
          if (!isNaN(d.getTime())) {
            deadlineIso = d.toISOString();
          }
        } catch (e) {}
      }

      const updatedFields = {
        taskTitle: (taskConfigForm.taskTitle || '').trim() || `Tugas Studi Kasus Pertemuan ${activeMeetingNumber}`,
        taskDesc: (taskConfigForm.taskDesc || '').trim(),
        taskWeight: taskConfigForm.taskWeight || '10%',
        taskDeadline: deadlineIso,
        isTaskOpen: Boolean(taskConfigForm.isTaskOpen),
        hasTask: Boolean(taskConfigForm.hasTask)
      };

      // 1. Optimistic update — UI langsung diperbarui seketika
      setClassData(prev => {
        if (!prev || !prev.meetings) return prev;
        const updatedMeetings = prev.meetings.map(m =>
          m.pertemuanKe === activeMeetingNumber ? { ...m, ...updatedFields } : m
        );
        return { ...prev, meetings: updatedMeetings };
      });

      setShowTaskConfigModal(false);
      showSuccessToast(`Pengaturan Tugas Pertemuan ${activeMeetingNumber} berhasil disimpan! (Status: ${updatedFields.isTaskOpen ? 'DIBUKA' : 'DITUTUP'})`);

      // 2. Simpan permanen ke database
      await updateMeeting(classId, activeMeetingNumber, updatedFields, user);
    } catch (err) {
      showErrorAlert('Gagal Menyimpan Konfigurasi Tugas', err.message);
      await loadClass(false); // Rollback saat error
    }
  };

  // Quick remove student from class (Admin & BAA)
  const handleQuickRemoveStudent = async (student) => {
    const confirmed = await showConfirmDialog({
      title: 'Keluarkan Mahasiswa?',
      text: `Apakah Anda yakin ingin mengeluarkan ${student.name} (${student.nim || student.username || '-'}) dari kelas ini?`,
      confirmButtonText: 'Ya, Keluarkan',
      cancelButtonText: 'Batal',
      icon: 'warning'
    });
    if (!confirmed) return;
    try {
      await unenrollStudent(classData.id, student.uid || student.id, user);
      showSuccessToast(`${student.name} berhasil dikeluarkan dari kelas.`);
      await loadClass(false);
    } catch (err) {
      showErrorAlert("Gagal Mengeluarkan Mahasiswa", err.message);
    }
  };

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

  const loadMessages = async () => {
    try {
      const msgs = await getClassMessages(classId);
      setClassMessages(msgs);
      if (activeMainTab === 'MESSAGES' && user?.uid) {
        await markClassMessagesAsRead(classId, user.uid);
      }
    } catch (err) {
      console.error("Gagal memuat pesan kelas:", err);
    }
  };

  const loadClass = async (isInitial = false) => {
    if (isInitial && !classData) {
      setLoading(true);
    }
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
      if (isInitial) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (initialTab) {
      setActiveMainTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    loadClass(true);
    loadMessages();

    // Polling interval untuk sinkronisasi pesan kelas secara real-time antara Dosen & Mahasiswa
    const intervalTime = activeMainTab === 'MESSAGES' ? 3000 : 8000;
    const pollInterval = setInterval(() => {
      loadMessages();
    }, intervalTime);

    let debounceTimer = null;
    const unsubscribe = subscribeToDataSync((detail) => {
      // Abaikan sinkronisasi audit logs agar tidak memicu re-render
      if (detail && detail.key === 'STIE_LMS_LOGS') return;
      if (detail && (
        detail.key === `STIE_LMS_CLASS_MESSAGES_${classId}` || 
        detail.key === 'STIE_LMS_NEW_MESSAGE_NOTIFICATION' ||
        detail.key === 'STIE_LMS_CLASSES'
      )) {
        loadMessages();
      }
      if (detail && detail.key && !['STIE_LMS_CLASSES', 'STIE_LMS_USERS', 'STIE_LMS_TA'].includes(detail.key)) return;

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadClass(false);
      }, 50);
    });
    return () => {
      clearInterval(pollInterval);
      if (debounceTimer) clearTimeout(debounceTimer);
      unsubscribe();
    };
  }, [classId, user, activeMainTab]);

  useEffect(() => {
    const currentUserId = user?.uid || user?.id;
    if (activeMainTab === 'MESSAGES' && currentUserId) {
      markClassMessagesAsRead(classId, currentUserId);
    }
  }, [activeMainTab, classId, user]);

  const handleSendMessage = async (e) => {
    e?.preventDefault?.();
    if (!newMessageText.trim()) return;
    if (isSendingMessage) return;

    const textToSend = newMessageText.trim();
    setIsSendingMessage(true);
    try {
      setNewMessageText('');
      await sendClassMessage(classId, { text: textToSend }, user);
      await loadMessages();
      showSuccessToast("Pesan berhasil dikirim!");
    } catch (err) {
      showErrorAlert("Gagal Mengirim Pesan", err.message);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleStartEdit = (msg) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.text);
  };

  const handleSaveEdit = async (messageId) => {
    if (!editingText.trim()) return;
    try {
      await editClassMessage(classId, messageId, editingText, user);
      setEditingMessageId(null);
      setEditingText('');
      await loadMessages();
      showSuccessToast('Pesan berhasil diperbarui.');
    } catch (err) {
      showErrorAlert('Gagal Mengedit Pesan', err.message);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    const confirmed = await showConfirmDialog({
      title: 'Hapus Pesan?',
      text: 'Pesan ini akan dihapus dari riwayat ruang diskusi kelas perkuliahan. Lanjutkan?',
      confirmButtonText: 'Ya, Hapus Pesan',
      cancelButtonText: 'Batal',
      icon: 'warning'
    });
    if (!confirmed) return;
    setIsDeletingMessageId(messageId);
    try {
      await deleteClassMessage(classId, messageId, user);
      await loadMessages();
      showSuccessToast('Pesan berhasil dihapus.');
    } catch (err) {
      showErrorAlert('Gagal Menghapus Pesan', err.message);
    } finally {
      setIsDeletingMessageId(null);
    }
  };

  if ((loading && !classData) || !classData) {
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
  const isLecturerOfThisClass = isDosen && isClassAssignedToLecturer(classData, user);
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
      // Optimistic update
      setClassData(prev => {
        if (!prev || !prev.meetings) return prev;
        const updatedMeetings = prev.meetings.map(m => {
          if (m.pertemuanKe === activeMeeting.pertemuanKe) {
            return {
              ...m,
              judul: editMeetingForm.judul.trim(),
              deskripsi: editMeetingForm.deskripsi.trim(),
              subCpmk: editMeetingForm.subCpmk.trim(),
              indikatorObe: editMeetingForm.indikatorObe.trim(),
              tanggal: editMeetingForm.tanggal
            };
          }
          return m;
        });
        return { ...prev, meetings: updatedMeetings };
      });

      setShowEditMeetingModal(false);
      showSuccessToast(`Judul & materi Pertemuan ke-${activeMeeting.pertemuanKe} berhasil disimpan!`);

      await updateMeeting(classId, activeMeeting.pertemuanKe, {
        judul: editMeetingForm.judul.trim(),
        deskripsi: editMeetingForm.deskripsi.trim(),
        subCpmk: editMeetingForm.subCpmk.trim(),
        indikatorObe: editMeetingForm.indikatorObe.trim(),
        tanggal: editMeetingForm.tanggal
      }, user);

      await loadClass(false);
    } catch (err) {
      showErrorAlert("Gagal Menyimpan Pertemuan", err.message);
      await loadClass(false);
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
      // Optimistic update
      setClassData(prev => {
        if (!prev || !prev.meetings) return prev;
        const updatedMeetings = prev.meetings.map(m => {
          if (m.pertemuanKe === activeMeetingNumber) {
            return {
              ...m,
              videoType: mediaForm.videoType,
              videoUrl: mediaForm.videoUrl,
              mediaTitle: mediaForm.mediaTitle
            };
          }
          return m;
        });
        return { ...prev, meetings: updatedMeetings };
      });

      setShowMediaModal(false);
      showSuccessToast("Tautan ruang tatap muka daring diperbarui!");

      await updateMeetingMedia(classId, activeMeetingNumber, mediaForm, user);
      await loadClass(false);
    } catch (err) {
      showErrorAlert("Gagal Memperbarui Media", err.message);
      await loadClass(false);
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
      await loadClass(false);
    } catch (err) {
      showErrorAlert("Gagal Menyematkan Materi", err.message);
      await loadClass(false);
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
      await loadClass(false);
    } catch (err) {
      showErrorAlert("Gagal Menghapus Materi", err.message);
      await loadClass(false);
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
      // Optimistic update: langsung mutasi state memori lokal agar tampilan presensi seketika berubah tanpa jeda / kedap-kedip
      setClassData(prev => {
        if (!prev || !prev.meetings) return prev;
        const updatedMeetings = prev.meetings.map(m => {
          if (m.pertemuanKe === activeMeetingNumber) {
            return {
              ...m,
              attendances: { ...attendanceRecords }
            };
          }
          return m;
        });
        return {
          ...prev,
          meetings: updatedMeetings
        };
      });

      setShowAttendanceModal(false);
      showSuccessToast("Rekap presensi pertemuan berhasil disimpan!");

      await saveMeetingAttendance(classId, activeMeetingNumber, attendanceRecords, user);
      await loadClass(false);
    } catch (err) {
      showErrorAlert("Gagal Menyimpan Presensi", err.message);
      await loadClass(false);
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
      await loadClass(false);
    } catch (err) {
      showErrorAlert("Gagal Mengumpulkan Tugas", err.message);
      await loadClass(false);
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
      await loadClass(false);
    } catch (err) {
      showErrorAlert("Gagal Menyimpan Penilaian", err.message);
      await loadClass(false);
    }
  };

  const currentUserId = user?.uid || user?.id;
  const mySubmission = activeMeeting?.submissions ? (
    activeMeeting.submissions[currentUserId] ||
    (user?.uid && activeMeeting.submissions[user.uid]) ||
    (user?.id && activeMeeting.submissions[user.id])
  ) : null;

  // Hitung status presensi
  const existingAttendances = activeMeeting?.attendances || {};
  const attendedCount = Object.values(existingAttendances).filter(a => a?.status === 'HADIR').length;
  const myAttendanceStatus = existingAttendances[currentUserId]?.status || (user?.uid && existingAttendances[user.uid]?.status) || (user?.id && existingAttendances[user.id]?.status) || null;
  const attendanceCounts = {
    HADIR: Object.values(existingAttendances).filter(a => a?.status === 'HADIR').length,
    IZIN: Object.values(existingAttendances).filter(a => a?.status === 'IZIN').length,
    SAKIT: Object.values(existingAttendances).filter(a => a?.status === 'SAKIT').length,
    ALPA: Object.values(existingAttendances).filter(a => a?.status === 'ALPHA' || a?.status === 'ALPA').length
  };

  // Hitung notifikasi pesan kelas belum dibaca
  const unreadClassMessagesCount = (classMessages || []).filter(
    m => m.senderId !== currentUserId && !(m.readBy || []).includes(currentUserId)
  ).length;

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
              {Array.isArray(classData.teamTeaching) && classData.teamTeaching.length > 0 && (
                <p className="text-[11px] text-amber-200 mt-0.5 font-medium">
                  Tim Dosen (Team Teaching): <strong className="text-white">{
                    classData.teamTeaching.map(tUid => {
                      const d = allUsers.find(u => (u.uid || u.id) === (tUid?.uid || tUid));
                      return d ? d.name : (tUid?.name || tUid);
                    }).join(', ')
                  }</strong>
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-slate-400">Mahasiswa Terdaftar</div>
                <div className="text-lg font-bold text-white">
                  {enrolledStudentsList.length} / {classData.kuota}
                </div>
              </div>
              {(isAdmin || isBaa || isSuperAdmin) && (
                <button
                  type="button"
                  onClick={() => setShowStudentManagementModal(true)}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 flex items-center gap-1.5 transition-all shadow-sm shrink-0"
                  title="Kelola Peserta Mahasiswa (Admin & BAA)"
                >
                  <Users className="w-3.5 h-3.5 text-gold-300" />
                  <span>Kelola Mahasiswa</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigasi Utama Kelas: Sesi Pertemuan (1-16) | Pesan & Diskusi Kelas | Peserta Mahasiswa */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveMainTab('MEETINGS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
            activeMainTab === 'MEETINGS'
              ? 'bg-brand-800 text-white ring-2 ring-brand-300'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Sesi RPS Pertemuan (1-16)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveMainTab('MESSAGES');
            if (user?.uid) markClassMessagesAsRead(classId, user.uid);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm relative ${
            activeMainTab === 'MESSAGES'
              ? 'bg-brand-800 text-white ring-2 ring-brand-300'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Pesan & Diskusi Kelas</span>
          {classMessages.length > 0 && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              activeMainTab === 'MESSAGES' ? 'bg-white text-brand-900' : 'bg-brand-100 text-brand-800'
            }`}>
              {classMessages.length}
            </span>
          )}
          {unreadClassMessagesCount > 0 && activeMainTab !== 'MESSAGES' && (
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse"></span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('STUDENTS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
            activeMainTab === 'STUDENTS'
              ? 'bg-brand-800 text-white ring-2 ring-brand-300'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Peserta Mahasiswa ({enrolledStudentsList.length})</span>
        </button>
      </div>

      {/* KONTEN TAB 1: 16 PERTEMUAN RPS PERKULIAHAN */}
      {activeMainTab === 'MEETINGS' && (
        <>
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
                const isSessionClosed = m.isOpen === false;

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
                    {/* Indikator buka/tutup sesi */}
                    {isSessionClosed && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full flex items-center justify-center ring-1 ring-white">
                        <Lock className="w-2 h-2 text-white" />
                      </span>
                    )}
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
                    <div className="flex items-center flex-wrap gap-2 shrink-0">
                      {/* Toggle Buka / Tutup Sesi Pertemuan */}
                      <button
                        type="button"
                        onClick={handleToggleClassOpen}
                        title={activeMeeting.isOpen === false ? 'Buka kembali sesi pertemuan ini' : 'Tutup sesi pertemuan ini'}
                        className={`px-3 py-1.5 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm ${
                          activeMeeting.isOpen === false
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200'
                        }`}
                      >
                        {activeMeeting.isOpen === false ? (
                          <><Lock className="w-3.5 h-3.5 text-rose-600" /><span>Sesi Ditutup</span></>
                        ) : (
                          <><Unlock className="w-3.5 h-3.5 text-emerald-600" /><span>Sesi Terbuka</span></>
                        )}
                      </button>
                      {/* Toggle Buka / Tutup Pengumpulan Tugas */}
                      <button
                        type="button"
                        onClick={handleToggleTaskOpen}
                        title={activeMeeting.isTaskOpen === false ? 'Buka pengumpulan tugas pertemuan ini' : 'Tutup pengumpulan tugas pertemuan ini'}
                        className={`px-3 py-1.5 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm ${
                          activeMeeting.isTaskOpen === false
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200'
                        }`}
                      >
                        {activeMeeting.isTaskOpen === false ? (
                          <><Lock className="w-3.5 h-3.5 text-rose-600" /><span>Tugas Ditutup</span></>
                        ) : (
                          <><Unlock className="w-3.5 h-3.5 text-emerald-600" /><span>Tugas Dibuka</span></>
                        )}
                      </button>
                      {/* Konfigurasi Tugas */}
                      <button
                        type="button"
                        onClick={handleOpenTaskConfig}
                        className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                        title="Atur Tugas & Deadline Pertemuan"
                      >
                        <Timer className="w-3.5 h-3.5 text-purple-700" />
                        <span>Atur Tugas</span>
                      </button>
                      {/* Edit judul pertemuan */}
                      <button
                        type="button"
                        onClick={handleOpenEditMeeting}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                        title="Ubah Judul Pertemuan & Pokok Bahasan RPS"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                        <span>Edit Judul</span>
                      </button>
                    </div>
                  )}

                  {/* Banner sesi ditutup — tampil untuk Mahasiswa */}
                  {isMahasiswa && activeMeeting.isOpen === false && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 shrink-0">
                      <Lock className="w-3.5 h-3.5 text-rose-600" />
                      <span>Sesi Ditutup</span>
                    </div>
                  )}
                </div>

                {/* Info Tanggal Pelaksanaan RPS */}
                {activeMeeting.tanggal && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium pt-2 border-t border-slate-100">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Jadwal Pelaksanaan: <strong>{new Date(activeMeeting.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong></span>
                  </div>
                )}
              </div>

              {/* Video / Daring Section */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                    <Video className="w-4 h-4 text-rose-600" />
                    <span>Tatap Muka Daring & Video Interaktif</span>
                  </div>
                  {canManageClass && isTaActive && (
                    <button
                      onClick={handleOpenMediaModal}
                      className="text-xs font-bold text-brand-800 hover:text-brand-950 flex items-center gap-1 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Atur Media Daring
                    </button>
                  )}
                </div>

                {activeMeeting.videoUrl ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-slate-900 rounded-xl text-white flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <div className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">
                          Platform: {activeMeeting.videoType || 'GOOGLE_MEET'}
                        </div>
                        <div className="text-sm font-bold mt-0.5">{activeMeeting.mediaTitle || 'Sesi Tatap Muka Daring'}</div>
                        <div className="text-xs text-slate-300 truncate max-w-md mt-0.5 font-mono">{activeMeeting.videoUrl}</div>
                      </div>
                      <a
                        href={activeMeeting.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors shrink-0"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Gabung Sesi Perkuliahan
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2">
                    <Video className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-400">Belum ada tautan tatap muka daring yang disematkan.</p>
                  </div>
                )}
              </div>

              {/* Bahan Ajar & Materi Perkuliahan */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                    <FileText className="w-4 h-4 text-brand-700" />
                    <span>Materi & Bahan Ajar (Link Google Drive)</span>
                  </div>
                  {canManageClass && isTaActive && (
                    <button
                      onClick={() => setShowUploadMaterialModal(true)}
                      className="px-3 py-1.5 bg-brand-800 hover:bg-brand-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Sematkan Link Drive
                    </button>
                  )}
                </div>

                {(activeMeeting.materials || []).length === 0 ? (
                  <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-400">Belum ada bahan ajar atau materi untuk pertemuan ini.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {(activeMeeting.materials || []).map(mat => (
                      <div key={mat.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-100/80 transition-colors">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                            <LinkIcon className="w-4 h-4" />
                          </div>
                          <div className="overflow-hidden">
                            <div className="font-bold text-xs text-slate-900 truncate">{mat.judul}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-sm">{mat.fileUrl}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={mat.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
                          >
                            <span>Buka Materi</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </a>
                          {canManageClass && isTaActive && (
                            <button
                              onClick={() => handleDeleteMaterial(mat.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Hapus Materi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Kolom Kanan: Presensi & Tugas */}
            <div className="space-y-6">
              
              {/* Presensi Perkuliahan */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>Presensi Pertemuan {activeMeeting.pertemuanKe}</span>
                  </div>
                  {canManageClass && isTaActive && (
                    <button
                      onClick={handleOpenAttendanceModal}
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
                    >
                      Kelola Presensi
                    </button>
                  )}
                </div>

                {isMahasiswa && (
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-500">Status Kehadiran Anda</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">
                        {myAttendanceStatus === 'HADIR' ? 'Hadir Kuliah' :
                         myAttendanceStatus === 'IZIN' ? 'Izin Resmi' :
                         myAttendanceStatus === 'SAKIT' ? 'Surat Sakit' :
                         myAttendanceStatus === 'ALPA' ? 'Tidak Hadir (Alpa)' : 'Belum Ada Presensi'}
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      myAttendanceStatus === 'HADIR' ? 'bg-emerald-100 text-emerald-800' :
                      myAttendanceStatus === 'IZIN' || myAttendanceStatus === 'SAKIT' ? 'bg-amber-100 text-amber-800' :
                      myAttendanceStatus === 'ALPA' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {myAttendanceStatus || 'BELUM DICATAT'}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="text-lg font-bold text-emerald-800">{attendanceCounts.HADIR}</div>
                    <div className="text-[10px] text-emerald-600 uppercase font-semibold">Hadir</div>
                  </div>
                  <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="text-lg font-bold text-amber-800">{attendanceCounts.IZIN + attendanceCounts.SAKIT}</div>
                    <div className="text-[10px] text-amber-600 uppercase font-semibold">Izin / Sakit</div>
                  </div>
                  <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100">
                    <div className="text-lg font-bold text-rose-800">{attendanceCounts.ALPA}</div>
                    <div className="text-[10px] text-rose-600 uppercase font-semibold">Alpha</div>
                  </div>
                </div>
              </div>

              {/* Tugas Terstruktur OBE */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                    <Award className="w-4 h-4 text-purple-600" />
                    <span>Tugas Pertemuan {activeMeeting.pertemuanKe}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      activeMeeting.isTaskOpen === false
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}>
                      {activeMeeting.isTaskOpen === false ? 'Pengumpulan Ditutup' : 'Pengumpulan Dibuka'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {canManageClass && isTaActive && (
                      <button
                        type="button"
                        onClick={handleToggleTaskOpen}
                        className={`text-xs font-bold px-3 py-1 rounded-xl border flex items-center gap-1.5 transition-colors shadow-sm ${
                          activeMeeting.isTaskOpen === false
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                            : 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700'
                        }`}
                        title={activeMeeting.isTaskOpen === false ? 'Klik untuk membuka akses pengumpulan tugas bagi mahasiswa' : 'Klik untuk menutup akses pengumpulan tugas bagi mahasiswa'}
                      >
                        {activeMeeting.isTaskOpen === false ? (
                          <><Unlock className="w-3.5 h-3.5" /><span>Buka Pengumpulan</span></>
                        ) : (
                          <><Lock className="w-3.5 h-3.5" /><span>Tutup Pengumpulan</span></>
                        )}
                      </button>
                    )}
                    {(activeMeeting.isTask || activeMeeting.hasTask) && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                        Bobot OBE: {activeMeeting.taskWeight || '10%'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Banner Status Pengumpulan untuk Dosen */}
                {canManageClass && activeMeeting.isTaskOpen === false && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                      <span><strong>Status Pengumpulan Tugas Ditutup.</strong> Mahasiswa tidak dapat mengunggah atau memperbarui link tugas.</span>
                    </div>
                    {isTaActive && (
                      <button
                        type="button"
                        onClick={handleToggleTaskOpen}
                        className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-[11px] font-bold shrink-0 shadow-sm transition-colors"
                      >
                        Buka Sekarang
                      </button>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  {/* Deskripsi Penugasan Dosen (jika ada instruksi khusus dari dosen) */}
                  {(activeMeeting.isTask || activeMeeting.hasTask || activeMeeting.taskTitle || activeMeeting.taskDesc) ? (
                    <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl">
                      <div className="font-bold text-xs text-purple-950">
                        {activeMeeting.taskTitle || `Tugas Studi Kasus Pertemuan ${activeMeeting.pertemuanKe}`}
                      </div>
                      {activeMeeting.taskDesc && (
                        <div className="text-xs text-purple-900 mt-1 leading-relaxed whitespace-pre-wrap">
                          {activeMeeting.taskDesc}
                        </div>
                      )}
                      {activeMeeting.taskDeadline && (
                        <div className="text-[11px] text-purple-800 font-semibold mt-2 pt-2 border-t border-purple-200/80 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-purple-600" />
                          <span>Batas Akhir: {new Date(activeMeeting.taskDeadline).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
                      <span className="font-semibold text-slate-800 block mb-0.5">Penugasan Pertemuan {activeMeeting.pertemuanKe}</span>
                      Mahasiswa dapat menyematkan tautan dokumen tugas mandiri / tugas kelompok berupa link (Google Drive / Docs) untuk dinilai oleh Dosen.
                    </div>
                  )}

                  {/* Pengumpulan Tugas Mahasiswa (Hanya Sematkan Link - Hemat Space Server) */}
                  {isMahasiswa && (() => {
                    const isSessionClosed = activeMeeting.isOpen === false;
                    const isTaskClosed = activeMeeting.isTaskOpen === false;
                    const now = new Date();
                    const deadline = activeMeeting.taskDeadline ? new Date(activeMeeting.taskDeadline) : null;
                    const isPastDeadline = deadline && now > deadline;

                    return (
                    <div className="p-4 border border-slate-200 rounded-xl space-y-3 bg-slate-50/80">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs font-bold text-slate-800">Status Pengumpulan Tugas Anda</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {mySubmission ? (
                            <>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-600" />
                                Terkumpul
                              </span>
                              {mySubmission.isLate && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 animate-pulse">
                                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  Tugas Terlambat
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                              Belum Mengumpulkan
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Banner sesi kelas ditutup */}
                      {isSessionClosed && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
                          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                          <span><strong>Sesi pertemuan ini sedang ditutup oleh Dosen.</strong> Anda tidak dapat melakukan aktivitas saat sesi ditutup.</span>
                        </div>
                      )}

                      {/* Banner tugas ditutup / deadline lewat */}
                      {!isSessionClosed && isTaskClosed && (
                        <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl flex items-center gap-2 text-xs text-slate-700">
                          <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                          <span><strong>Pengumpulan tugas telah ditutup oleh Dosen.</strong> Anda tidak dapat lagi menyematkan atau memperbarui tugas.</span>
                        </div>
                      )}

                      {/* Banner deadline terlewat (tapi tugas masih open) */}
                      {!isSessionClosed && !isTaskClosed && isPastDeadline && !mySubmission && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span><strong>Batas waktu telah lewat!</strong> Jika masih dikumpulkan, tugas akan ditandai sebagai <strong>Terlambat</strong>.</span>
                        </div>
                      )}

                      {mySubmission ? (
                        <div className="space-y-2.5 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                          <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
                            <span className="truncate max-w-[200px] sm:max-w-xs font-semibold text-slate-900">
                              Dokumen: <strong>{mySubmission.fileName || mySubmission.judul || 'Dokumen Tugas'}</strong>
                            </span>
                            {mySubmission.fileUrl && (
                              <a
                                href={mySubmission.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold shadow-sm transition-colors shrink-0"
                              >
                                <span>Buka Link Tugas</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>

                          {mySubmission.submittedAt && (
                            <div className="text-[10px] text-slate-400">
                              Disematkan pada: {new Date(mySubmission.submittedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}

                          {mySubmission.catatan && (
                            <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                              Catatan Anda: "{mySubmission.catatan}"
                            </p>
                          )}

                          {mySubmission.nilai !== undefined ? (
                            <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-300 mt-2">
                              <span className="text-[11px] text-emerald-800 font-semibold block">Nilai Dosen:</span>
                              <span className="text-xl font-extrabold text-emerald-700">{mySubmission.nilai} / 100</span>
                              {mySubmission.catatanDosen && (
                                <p className="text-[11px] text-slate-700 mt-1 italic">
                                  Umpan balik: "{mySubmission.catatanDosen}"
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-500 italic pt-1 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              <span>Menunggu penilaian dan umpan balik Dosen.</span>
                            </div>
                          )}

                          {isTaActive && !isSessionClosed && !isTaskClosed && (
                            <button
                              type="button"
                              onClick={() => {
                                setTaskForm({
                                  judul: mySubmission.fileName || mySubmission.judul || '',
                                  fileUrl: mySubmission.fileUrl || '',
                                  catatan: mySubmission.catatan || ''
                                });
                                setShowTaskSubmitModal(true);
                              }}
                              className="w-full mt-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                              Ganti / Perbarui Tautan Link Tugas
                            </button>
                          )}
                        </div>
                      ) : (
                        isTaActive && !isSessionClosed && !isTaskClosed ? (
                          <button
                            type="button"
                            onClick={() => {
                              setTaskForm({
                                judul: `${activeMeeting.taskTitle || ('Tugas Pertemuan ' + activeMeetingNumber)} - ${user?.name || 'Mahasiswa'}`,
                                fileUrl: '',
                                catatan: ''
                              });
                              setShowTaskSubmitModal(true);
                            }}
                            className="w-full py-2.5 bg-brand-800 hover:bg-brand-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-colors"
                          >
                            <Share2 className="w-4 h-4" />
                            Sematkan Link Tugas Mahasiswa
                            {isPastDeadline && (
                              <span className="ml-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500 text-white">TERLAMBAT</span>
                            )}
                          </button>
                        ) : (
                          !isSessionClosed && !isTaskClosed && (
                            <div className="text-center p-3 bg-slate-100 rounded-xl text-slate-500 text-xs font-medium border border-slate-200">
                              Semester telah ditutup. Tidak dapat mengumpulkan tugas.
                            </div>
                          )
                        )
                      )}
                    </div>
                    );
                  })()}

                  {/* Daftar Pengumpulan Mahasiswa untuk Dosen & Admin */}
                  {canManageClass && (
                    <div className="pt-2 space-y-2">
                      <div className="text-xs font-semibold text-slate-700 flex justify-between items-center">
                        <span>Mahasiswa Mengumpulkan Tugas:</span>
                        <span className="font-bold text-brand-900 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200 text-[11px]">
                          {Object.keys(activeMeeting.submissions || {}).length} Orang
                        </span>
                      </div>

                      {Object.keys(activeMeeting.submissions || {}).length === 0 ? (
                        <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                          Belum ada mahasiswa yang menyematkan tugas untuk pertemuan ini.
                        </div>
                      ) : (
                        <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                          {Object.values(activeMeeting.submissions || {}).map(sub => (
                            <div key={sub.mahasiswaId} className={`p-3 border rounded-xl text-xs flex justify-between items-center gap-2 ${
                              sub.isLate ? 'bg-rose-50/60 border-rose-200' : 'bg-slate-50 border-slate-200'
                            }`}>
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  {sub.mahasiswaName}
                                  {sub.isLate && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-0.5">
                                      <AlertTriangle className="w-2.5 h-2.5" /> Terlambat
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500">NIM: {sub.nim || '-'}</div>
                                {sub.submittedAt && (
                                  <div className="text-[10px] text-slate-400">
                                    {new Date(sub.submittedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                )}
                                {sub.catatan && (
                                  <div className="text-[10px] text-slate-400 italic line-clamp-1 mt-0.5">
                                    "{sub.catatan}"
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
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
                                    type="button"
                                    onClick={() => {
                                      if (!isTaActive) return showErrorToast("Semester ditutup, tidak dapat mengubah nilai.");
                                      setShowGradingModal(sub);
                                      setGradingForm({ nilai: sub.nilai, feedback: sub.catatanDosen || '' });
                                    }}
                                    className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg font-bold text-xs border border-emerald-300 transition-colors"
                                  >
                                    Nilai: {sub.nilai}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!isTaActive) return showErrorToast("Semester ditutup, tidak dapat mengubah nilai.");
                                      setShowGradingModal(sub);
                                      setGradingForm({ nilai: 85, feedback: '' });
                                    }}
                                    className="px-2.5 py-1 bg-brand-800 text-white rounded-lg font-bold text-xs hover:bg-brand-900 shadow-sm"
                                  >
                                    Beri Nilai
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>

            </div>

          </div>
        </>
      )}

      {/* KONTEN TAB 2: PESAN & DISKUSI KELAS (DOSEN & MAHASISWA) */}
      {activeMainTab === 'MESSAGES' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[580px]">
          {/* Header Ruang Pesan */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-brand-900 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-brand-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 text-gold-400 shrink-0 shadow-inner">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span>Pesan & Diskusi Perkuliahan</span>
                  <span className="text-[11px] font-medium bg-white/20 text-white px-2 py-0.5 rounded-full">
                    {classData.namaMk} ({classData.namaKelas})
                  </span>
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-300">
                  Dosen Pengampu: <strong className="text-white">{classData.namaDosen}</strong> • Mahasiswa Terdaftar: <strong className="text-white">{enrolledStudentsList.length} Orang</strong>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Saluran Diskusi Aktif
              </span>
            </div>
          </div>

          {/* List Pesan */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[480px] bg-slate-50/50">
            {classMessages.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-800 border border-brand-200 flex items-center justify-center mx-auto shadow-sm">
                  <MessageCircle className="w-7 h-7" />
                </div>
                <h4 className="font-bold text-sm sm:text-base text-slate-800">
                  Belum Ada Pesan di Kelas Ini
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Ruang ini disediakan untuk komunikasi dan diskusi perkuliahan antara Dosen Pengampu dan Mahasiswa terdaftar. Tulis pesan atau pertanyaan pertama untuk memulai percakapan!
                </p>
              </div>
            ) : (
              classMessages.map((msg) => {
                const isMyMessage = msg.senderId === user?.uid || 
                                    msg.senderId === user?.id || 
                                    String(msg.senderId) === String(user?.id) || 
                                    String(msg.senderId) === String(user?.uid) ||
                                    (user?.email && msg.senderEmail === user.email);
                const isSenderDosen = msg.senderRole === 'DOSEN';
                const isSenderAdmin = msg.senderRole === 'ADMIN_AKADEMIK' || msg.senderRole === 'SUPER_ADMIN';
                const isHovered = hoveredMessageId === msg.id;
                const isEditing = editingMessageId === msg.id;
                const canModerate = canManageClass;
                const canDelete = isMyMessage || canModerate;
                const canEdit = isMyMessage && !msg.isDeleted;

                return (
                  <div
                    key={msg.id}
                    onMouseEnter={() => setHoveredMessageId(msg.id)}
                    onMouseLeave={() => setHoveredMessageId(null)}
                    className={`flex items-end gap-2 ${isMyMessage ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div className="shrink-0 self-end mb-1">
                      {msg.senderAvatar ? (
                        <img
                          src={msg.senderAvatar}
                          alt={msg.senderName}
                          className="w-8 h-8 rounded-full object-cover border border-slate-300 shadow-sm"
                        />
                      ) : (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                          isSenderDosen
                            ? 'bg-blue-800 text-white'
                            : isSenderAdmin
                            ? 'bg-purple-800 text-white'
                            : 'bg-emerald-800 text-white'
                        }`}>
                          {(msg.senderName || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Tombol Aksi Samping (Edit/Hapus) — tampil saat hover dan touch */}
                    {!msg.isDeleted && !isEditing && (canEdit || canDelete) && (
                      <div
                        className={`flex flex-col gap-1 self-center shrink-0 transition-opacity duration-150 ${
                          isHovered ? 'opacity-100' : 'opacity-60 sm:opacity-0 hover:opacity-100'
                        }`}
                      >
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(msg)}
                            className="p-1.5 rounded-lg bg-white border border-slate-200 shadow-sm hover:bg-amber-50 hover:border-amber-300 transition-colors"
                            title="Edit pesan"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(msg.id)}
                            disabled={isDeletingMessageId === msg.id}
                            className="p-1.5 rounded-lg bg-white border border-slate-200 shadow-sm hover:bg-rose-50 hover:border-rose-300 transition-colors disabled:opacity-50"
                            title={isMyMessage ? "Hapus pesan Anda" : "Hapus pesan (Moderasi Dosen/Admin)"}
                          >
                            {isDeletingMessageId === msg.id
                              ? <Clock className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            }
                          </button>
                        )}
                      </div>
                    )}

                    {/* Bubble Pesan */}
                    <div className={`max-w-md sm:max-w-xl rounded-2xl p-3.5 shadow-sm text-xs space-y-1 ${
                      isMyMessage
                        ? 'bg-brand-800 text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                    } ${msg.isDeleted ? 'opacity-60' : ''}`}>

                      {/* Header bubble */}
                      <div className={`flex items-center gap-2 pb-1.5 mb-0.5 border-b ${
                        isMyMessage ? 'border-brand-700/60' : 'border-slate-100'
                      }`}>
                        <span className={`font-bold text-[11px] ${isMyMessage ? 'text-white' : 'text-slate-900'}`}>
                          {isMyMessage ? 'Anda' : msg.senderName}
                        </span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
                          isSenderDosen
                            ? isMyMessage ? 'bg-blue-900/60 text-blue-200 border-blue-400/40' : 'bg-blue-50 text-blue-800 border-blue-200'
                            : isSenderAdmin
                            ? isMyMessage ? 'bg-purple-900/60 text-purple-200 border-purple-400/40' : 'bg-purple-50 text-purple-800 border-purple-200'
                            : isMyMessage ? 'bg-emerald-900/60 text-emerald-200 border-emerald-400/40' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {isSenderDosen ? 'Dosen' : isSenderAdmin ? 'Admin BAA' : 'Mahasiswa'}
                        </span>
                        <div className="flex items-center gap-1.5 ml-auto">
                          <span className={`text-[10px] ${isMyMessage ? 'text-brand-200' : 'text-slate-400'}`}>
                            {new Date(msg.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                            {msg.isEdited && !msg.isDeleted && (
                              <span className="ml-1 italic opacity-70"> · Diedit</span>
                            )}
                          </span>

                          {/* Tombol aksi langsung di header bubble agar mudah dilihat & diakses */}
                          {!msg.isDeleted && !isEditing && (
                            <div className="flex items-center gap-1 ml-1">
                              {canEdit && (
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(msg)}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5 transition-colors ${
                                    isMyMessage
                                      ? 'bg-brand-700/80 hover:bg-brand-600 text-amber-200 border border-brand-500/40'
                                      : 'bg-slate-100 hover:bg-amber-100 text-amber-700 border border-slate-200'
                                  }`}
                                  title="Edit pesan"
                                >
                                  <Edit3 className="w-2.5 h-2.5" />
                                  <span>Edit</span>
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  disabled={isDeletingMessageId === msg.id}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5 transition-colors disabled:opacity-50 ${
                                    isMyMessage
                                      ? 'bg-brand-700/80 hover:bg-rose-900/80 text-rose-200 border border-brand-500/40'
                                      : 'bg-slate-100 hover:bg-rose-100 text-rose-700 border border-slate-200'
                                  }`}
                                  title={isMyMessage ? "Hapus pesan Anda" : "Hapus pesan (Moderasi)"}
                                >
                                  {isDeletingMessageId === msg.id ? (
                                    <Clock className="w-2.5 h-2.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-2.5 h-2.5" />
                                  )}
                                  <span>Hapus</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Konten: deleted / sedang diedit / normal */}
                      {msg.isDeleted ? (
                        <p className="leading-relaxed pt-0.5 font-normal text-xs italic opacity-60 flex items-center gap-1.5">
                          <Trash2 className="w-3 h-3 shrink-0 text-rose-400" />
                          Pesan ini telah dihapus.
                        </p>
                      ) : isEditing ? (
                        <div className="pt-1 space-y-2">
                          <textarea
                            rows="3"
                            value={editingText}
                            onChange={e => setEditingText(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit(msg.id); }
                              if (e.key === 'Escape') { setEditingMessageId(null); setEditingText(''); }
                            }}
                            autoFocus
                            className="w-full px-2.5 py-2 border border-brand-300 rounded-lg text-xs text-slate-900 outline-none focus:ring-2 focus:ring-brand-500 resize-none bg-white"
                          />
                          <div className="flex gap-1.5 justify-end">
                            <button
                              type="button"
                              onClick={() => { setEditingMessageId(null); setEditingText(''); }}
                              className="px-3 py-1 text-[11px] font-bold rounded-lg bg-white/20 hover:bg-white/30 text-white border border-white/30 transition-colors"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(msg.id)}
                              className="px-3 py-1 text-[11px] font-bold rounded-lg bg-white text-brand-800 hover:bg-brand-50 shadow-sm transition-colors"
                            >
                              Simpan
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="leading-relaxed whitespace-pre-wrap pt-0.5 font-normal text-xs">
                          {msg.text}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Form Kirim Pesan */}
          <div className="p-4 bg-white border-t border-slate-200">
            <form onSubmit={handleSendMessage} className="space-y-2">
              <div className="flex items-end gap-2">
                <textarea
                  rows="2"
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Tulis pesan atau pertanyaan diskusi kelas... (Tekan Enter untuk kirim, Shift+Enter untuk baris baru)"
                  className="flex-1 p-3 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all resize-none leading-relaxed"
                />
                <button
                  type="submit"
                  disabled={!newMessageText.trim() || isSendingMessage}
                  className="px-5 py-3 bg-brand-800 hover:bg-brand-900 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-all shrink-0 h-[46px]"
                >
                  {isSendingMessage ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Kirim</span>
                </button>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>Pesan dapat dibaca oleh Dosen dan seluruh Mahasiswa di kelas ini. Notifikasi otomatis dikirimkan ke akun peserta.</span>
                <span>{newMessageText.length} karakter</span>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KONTEN TAB 3: PESERTA MAHASISWA */}
      {activeMainTab === 'STUDENTS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-700" />
                Daftar Mahasiswa Terdaftar ({enrolledStudentsList.length} / {classData.kuota} Kuota)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Seluruh mahasiswa yang telah mengambil mata kuliah ini via KRS Mandiri atau didaftarkan oleh Bagian Administrasi Akademik (BAA).
              </p>
            </div>
            {(isAdmin || isBaa || isSuperAdmin) && (
              <button
                type="button"
                onClick={() => setShowStudentManagementModal(true)}
                className="px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah / Kelola Mahasiswa</span>
              </button>
            )}
          </div>

          {enrolledStudentsList.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Belum ada mahasiswa yang terdaftar di kelas ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">No</th>
                    <th className="px-4 py-3">NIM / Username</th>
                    <th className="px-4 py-3">Nama Lengkap</th>
                    <th className="px-4 py-3">Program Studi</th>
                    <th className="px-4 py-3">Angkatan / Semester</th>
                    <th className="px-4 py-3">Status</th>
                    {(isAdmin || isBaa || isSuperAdmin) && (
                      <th className="px-4 py-3 text-right">Aksi</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {enrolledStudentsList.map((stu, idx) => (
                    <tr key={stu.uid || stu.id || idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{stu.nim || stu.username || '-'}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{stu.name}</td>
                      <td className="px-4 py-3">{stu.prodiId || '-'}</td>
                      <td className="px-4 py-3">{stu.angkatan ? `Angkatan ${stu.angkatan}` : '-'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Aktif Kuliah
                        </span>
                      </td>
                      {(isAdmin || isBaa || isSuperAdmin) && (
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleQuickRemoveStudent(stu)}
                            className="px-2.5 py-1 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-[11px] font-bold transition-colors"
                          >
                            Keluarkan
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

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
                  placeholder="contoh: Lembar Jawaban Studi Kasus - Putri Maharani"
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

      {/* MODAL 7: KONFIGURASI TUGAS OLEH DOSEN */}
      {showTaskConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-lg bg-purple-50 text-purple-700">
                <Timer className="w-5 h-5 text-purple-800" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Pengaturan Tugas Pertemuan {activeMeeting.pertemuanKe}
                </h3>
                <p className="text-xs text-slate-500">
                  Atur judul tugas, deadline, dan status pengumpulan
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveTaskConfig} className="space-y-4 text-xs mt-4">
              {/* Toggle Aktifkan Tugas */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <div className="font-bold text-slate-900 text-xs">Aktifkan Tugas Pertemuan</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Mahasiswa dapat melihat dan mengumpulkan tugas</div>
                </div>
                <button
                  type="button"
                  onClick={() => setTaskConfigForm(f => ({ ...f, hasTask: !f.hasTask }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    taskConfigForm.hasTask
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {taskConfigForm.hasTask ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
                  {taskConfigForm.hasTask ? 'Aktif' : 'Nonaktif'}
                </button>
              </div>

              {taskConfigForm.hasTask && (
                <>
                  {/* Judul Tugas */}
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Judul / Instruksi Tugas</label>
                    <input
                      type="text"
                      placeholder={`Tugas Studi Kasus Pertemuan ${activeMeeting.pertemuanKe}`}
                      value={taskConfigForm.taskTitle}
                      onChange={e => setTaskConfigForm(f => ({ ...f, taskTitle: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 text-xs"
                    />
                  </div>

                  {/* Deskripsi Tugas */}
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Deskripsi / Detail Penugasan</label>
                    <textarea
                      rows="3"
                      placeholder="Jelaskan instruksi pengerjaan tugas secara rinci..."
                      value={taskConfigForm.taskDesc}
                      onChange={e => setTaskConfigForm(f => ({ ...f, taskDesc: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-xs leading-relaxed"
                    />
                  </div>

                  {/* Bobot & Deadline */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Bobot Nilai OBE</label>
                      <select
                        value={taskConfigForm.taskWeight}
                        onChange={e => setTaskConfigForm(f => ({ ...f, taskWeight: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                      >
                        {['5%','10%','15%','20%','25%','30%'].map(w => (
                          <option key={w} value={w}>{w}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Batas Waktu (Deadline)</label>
                      <input
                        type="datetime-local"
                        value={taskConfigForm.taskDeadline}
                        onChange={e => setTaskConfigForm(f => ({ ...f, taskDeadline: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                      />
                    </div>
                  </div>

                  {/* Toggle buka/tutup pengumpulan tugas */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>Status Pengumpulan Tugas:</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            taskConfigForm.isTaskOpen 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}>
                            {taskConfigForm.isTaskOpen ? 'DIBUKA (Aktif)' : 'DITUTUP (Terkunci)'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {taskConfigForm.isTaskOpen
                            ? 'Mahasiswa dapat menyematkan dan memperbarui tautan tugas.'
                            : 'Pengumpulan ditutup. Mahasiswa tidak dapat mengunggah tugas.'}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setTaskConfigForm(f => ({ ...f, isTaskOpen: true }))}
                        className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all border ${
                          taskConfigForm.isTaskOpen
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-200'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Buka Pengumpulan</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaskConfigForm(f => ({ ...f, isTaskOpen: false }))}
                        className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all border ${
                          !taskConfigForm.isTaskOpen
                            ? 'bg-rose-600 text-white border-rose-700 shadow-sm ring-2 ring-rose-200'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Tutup Pengumpulan</span>
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowTaskConfigModal(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-bold shadow transition-colors"
                >
                  Simpan Pengaturan Tugas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONTROL MAHASISWA KELAS (ADMIN & BAA) */}
      <ManageClassStudentsModal
        isOpen={showStudentManagementModal}
        onClose={() => setShowStudentManagementModal(false)}
        classItem={classData}
        onStudentsUpdated={async () => {
          await loadClass(false);
        }}
      />

    </div>
  );
}
