import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  getClasses, 
  getUsers, 
  getMataKuliah, 
  getTahunAkademik,
  getAuditLogs,
  calculateLecturersActivityScores,
  subscribeToDataSync 
} from '../firebase/firestoreService';
import { 
  BookOpen, 
  Users, 
  GraduationCap, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Award, 
  ArrowRight, 
  FileText,
  AlertTriangle,
  Sparkles,
  Lock,
  AlertCircle
} from 'lucide-react';

export default function DashboardPage({ onNavigate }) {
  const { user, isAdmin, isDosen, isMahasiswa } = useAuth();
  const [classes, setClasses] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [mkList, setMkList] = useState([]);
  const [tas, setTas] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const [cls, usrs, mks, tList, logs] = await Promise.all([
        getClasses(),
        getUsers(),
        getMataKuliah(),
        getTahunAkademik(),
        getAuditLogs()
      ]);
      setClasses(cls);
      setUsersList(usrs);
      setMkList(mks);
      setTas(tList);
      setRecentLogs(logs.slice(0, 5));
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToDataSync(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-xs text-slate-500">
        <Clock className="w-5 h-5 animate-spin mr-2 text-brand-600" />
        Memuat data dasbor STIE Nasional...
      </div>
    );
  }

  const activeTa = tas.find(t => t.isActive);

  // Filter kelas sesuai peran dan TAHUN AKADEMIK AKTIF BAA
  const myClasses = isDosen 
    ? classes.filter(c => c.dosenId === user.uid && (activeTa ? (c.tahunAkademikId === activeTa.id || c.namaTa === activeTa.namaTa) : false))
    : isMahasiswa 
    ? classes.filter(c => (c.enrolledStudents || []).includes(user.uid) && (activeTa ? (c.tahunAkademikId === activeTa.id || c.namaTa === activeTa.namaTa) : false))
    : (activeTa ? classes.filter(c => c.tahunAkademikId === activeTa.id || c.namaTa === activeTa.namaTa) : classes);

  const totalDosen = usersList.filter(u => u.role === 'DOSEN').length;
  const totalMahasiswa = usersList.filter(u => u.role === 'MAHASISWA').length;

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-white/5 skew-x-12 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gold-500/20 text-gold-300 text-xs font-semibold mb-2 border border-gold-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              {activeTa ? `Tahun Akademik ${activeTa.namaTa} (Aktif)` : 'Belum Ada Semester Berjalan Aktif'}
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              Selamat Datang di LMS STIE Nasional, {user?.name}!
            </h2>
            <p className="text-xs text-slate-200 mt-1 max-w-2xl">
              Platform pembelajaran digital berbasis Jamstack Serverless STIE Nasional Banjarmasin. Akses cepat materi 16 pertemuan, presensi real-time, dan kalkulasi nilai otomatis.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onNavigate('classes')}
              className="px-4 py-2 bg-white text-brand-900 font-bold text-xs rounded-xl shadow hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4 text-brand-700" />
              {isMahasiswa ? 'Lihat Kuliah Saya' : 'Kelola Kelas Kuliah'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-700">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{myClasses.length}</div>
            <div className="text-xs text-slate-500">{isMahasiswa ? 'Kelas Diikuti' : 'Kelas Perkuliahan'}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-3 rounded-lg bg-indigo-50 text-indigo-700">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{totalMahasiswa}</div>
            <div className="text-xs text-slate-500">Mahasiswa Terdaftar</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{totalDosen}</div>
            <div className="text-xs text-slate-500">Dosen Pengampu</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-3 rounded-lg bg-amber-50 text-amber-700">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">16 Modul</div>
            <div className="text-xs text-slate-500">Standarisasi RPS</div>
          </div>
        </div>
      </div>

      {/* Warning jika seluruh semester ditutup BAA */}
      {!activeTa && !isAdmin && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-3 text-xs text-rose-950 shadow-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-sm block mb-0.5">Periode Akademik Sedang Ditutup</span>
            Bagian Administrasi Akademik (BAA) saat ini belum membuka Tahun Akademik / Semester aktif. Akses modul materi 16 sesi, presensi kehadiran, pendaftaran kelas baru, serta pengisian nilai dikunci sementara hingga BAA membuka semester baru.
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kelas Aktif & Jadwal */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-700" />
              {isMahasiswa ? 'Mata Kuliah Semester Ini' : 'Daftar Kelas Perkuliahan Aktif'}
            </h3>
            <button 
              onClick={() => onNavigate('classes')}
              className="text-xs text-brand-700 font-semibold hover:underline flex items-center gap-1"
            >
              Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myClasses.length === 0 ? (
              <div className="md:col-span-2 p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
                <Lock className="w-6 h-6 text-slate-400 mx-auto" />
                <div className="text-xs font-bold text-slate-700">
                  {!activeTa ? 'Tahun Akademik Ditutup oleh BAA' : 'Belum Ada Kelas Perkuliahan Aktif'}
                </div>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  {!activeTa 
                    ? 'Saat ini seluruh semester berstatus non-aktif / ditutup oleh Bagian Akademik (BAA). Perkuliahan dan penilaian sedang dijeda.'
                    : 'Tidak ada kelas perkuliahan aktif yang dijadwalkan pada semester ini.'}
                </p>
              </div>
            ) : (
              myClasses.slice(0, 4).map(c => (
                <div 
                  key={c.id} 
                  onClick={() => onNavigate('classes', { selectedClassId: c.id })}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-brand-500 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200 font-mono">
                      {c.kodeMk} - Kelas {c.namaKelas}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {c.status || 'OPEN'}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 mt-2 group-hover:text-brand-700 transition-colors line-clamp-1">
                    {c.namaMk}
                  </h4>
                  
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dosen: {c.namaDosen}
                  </p>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{c.sks} SKS • {c.hari}, {c.jam}</span>
                    <span className="font-medium text-brand-600">16 Pertemuan &rarr;</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Audit Log / Aktivitas Terbaru - Hanya untuk Admin */}
        {isAdmin && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-700" />
                Aktivitas Terkini
              </h3>
              <button 
                onClick={() => onNavigate('audit-logs')}
                className="text-xs text-brand-700 font-semibold hover:underline"
              >
                Log Lengkap
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 divide-y divide-slate-100 shadow-sm">
              {recentLogs.map(log => (
                <div key={log.id} className="py-2.5 first:pt-0 last:pb-0 text-xs">
                  <div className="flex justify-between text-slate-400 text-[10px] mb-0.5">
                    <span className="font-semibold text-brand-700">{log.userName}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="text-slate-700 font-medium line-clamp-2">
                    {log.details}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Notice Card */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <Award className="w-4 h-4 text-amber-600" />
                Standarisasi 16 Pertemuan
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Perkuliahan semester berjalan wajib mematuhi 16 sesi terstruktur: Pertemuan 8 adalah Evaluasi UTS dan Pertemuan 16 adalah Evaluasi UAS.
              </p>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
