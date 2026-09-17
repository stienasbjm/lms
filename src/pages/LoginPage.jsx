import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  GraduationCap, 
  Lock, 
  User, 
  ArrowRight, 
  ArrowLeft,
  AlertCircle, 
  Sparkles, 
  Eye, 
  EyeOff,
  Database,
  CheckCircle,
  Mail,
  UserPlus,
  BookOpen
} from 'lucide-react';
import { registerStudent } from '../firebase/firestoreService';
import { 
  calculateAcademicStanding, 
  generateSuggestedNim, 
  ANGKATAN_OPTIONS 
} from '../utils/studentNimHelper';
import FirebaseSettingsModal from '../components/common/FirebaseSettingsModal';
import { showErrorAlert, showSuccessAlert, showSuccessToast } from '../utils/alert';

export default function LoginPage({ onBackToLanding }) {
  const { login, setSpecificUser, isFirebaseLive } = useAuth();
  const [authMode, setAuthMode] = useState('LOGIN'); // 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD'

  // Login State (Clean & Kosong secara default)
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Register State (Khusus Mahasiswa Baru)
  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    prodiId: 'prodi-s1-manajemen',
    angkatan: 2024,
    nim: generateSuggestedNim(2024, 'prodi-s1-manajemen'),
    phone: ''
  });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      await login(identifier, password);
      showSuccessToast('Berhasil masuk ke LMS!');
    } catch (err) {
      const msg = err.message || 'Login gagal. Periksa kembali kredensial Anda.';
      setErrorMessage(msg);
      showErrorAlert('Gagal Masuk', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    if (!identifier) {
      setErrorMessage('Harap masukkan alamat email Anda.');
      showErrorAlert('Email Diperlukan', 'Harap masukkan alamat email akun Anda untuk menerima tautan reset kata sandi.');
      return;
    }

    setLoading(true);
    // Simulasi pengiriman email reset password
    setTimeout(() => {
      setLoading(false);
      const msg = `Tautan reset kata sandi telah dikirim ke ${identifier}. Silakan cek kotak masuk Anda.`;
      setSuccessMessage(msg);
      showSuccessAlert('Tautan Reset Terkirim', msg);
      // Reset identifier setelah sukses agar user tidak bingung
      setIdentifier('');
    }, 1200);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!regForm.name || !regForm.email || !regForm.password) {
      const msg = "Harap lengkapi semua kolom pendaftaran yang wajib diisi.";
      setErrorMessage(msg);
      showErrorAlert('Data Belum Lengkap', msg);
      return;
    }

    if (regForm.password.length < 6) {
      const msg = "Kata sandi minimal 6 karakter.";
      setErrorMessage(msg);
      showErrorAlert('Kata Sandi Terlalu Pendek', msg);
      return;
    }

    if (regForm.password !== regForm.confirmPassword) {
      const msg = "Konfirmasi kata sandi tidak cocok.";
      setErrorMessage(msg);
      showErrorAlert('Kata Sandi Tidak Cocok', msg);
      return;
    }

    setLoading(true);
    try {
      const newStudent = await registerStudent({
        name: regForm.name,
        email: regForm.email,
        password: regForm.password,
        prodiId: regForm.prodiId,
        angkatan: regForm.angkatan,
        nim: regForm.nim,
        phone: regForm.phone
      });

      showSuccessAlert('Pendaftaran Berhasil!', `Selamat datang, ${newStudent.name}. Mengalihkan ke portal mahasiswa...`);
      setSuccessMessage("Pendaftaran berhasil! Mengalihkan ke dasbor mahasiswa...");
      setTimeout(() => {
        setSpecificUser(newStudent);
      }, 1000);
    } catch (err) {
      const msg = err.message || "Gagal melakukan pendaftaran.";
      setErrorMessage(msg);
      showErrorAlert('Pendaftaran Gagal', msg);
    } finally {
      setLoading(false);
    }
  };

  const regStanding = calculateAcademicStanding(regForm.nim, regForm.angkatan);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-slate-900 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-brand-500 selection:text-white">
      
      {/* Decorative background blurs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        
        {/* Back button to Landing Page */}
        {onBackToLanding && (
          <button
            type="button"
            onClick={onBackToLanding}
            className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white font-medium mb-4 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Kembali ke Beranda (Landing Page)</span>
          </button>
        )}

        <div className="text-center">
          <div className="inline-flex items-center justify-center mb-3">
            <img 
              src="/logo-stienas.png" 
              alt="Logo STIE Nasional Banjarmasin" 
              className="w-16 h-16 object-contain drop-shadow-lg hover:scale-105 transition-transform" 
            />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Portal LMS STIE Nasional
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Sekolah Tinggi Ilmu Ekonomi Nasional Banjarmasin
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-white/95 backdrop-blur-xl py-6 px-6 shadow-2xl rounded-3xl sm:px-8 border border-white/20">
          
          {/* Tab Switcher: Masuk vs Daftar */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 mb-5 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setAuthMode('LOGIN'); setErrorMessage(''); setSuccessMessage(''); }}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                (authMode === 'LOGIN' || authMode === 'FORGOT_PASSWORD')
                  ? 'bg-white shadow text-brand-900' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Masuk Portal</span>
            </button>

            <button
              type="button"
              onClick={() => { setAuthMode('REGISTER'); setErrorMessage(''); setSuccessMessage(''); }}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'REGISTER' 
                  ? 'bg-emerald-700 shadow text-white' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Daftar Mahasiswa</span>
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 mb-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <span className="font-semibold block">Gagal</span>
                {errorMessage}
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 mb-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <div>
                <span className="font-semibold block">Sukses</span>
                {successMessage}
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 1: FORM LOGIN
              ========================================================================= */}
          {authMode === 'LOGIN' && (
            <>
              <form className="space-y-3.5" onSubmit={handleLoginSubmit}>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email / NIM / NIDN / Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="admin@stienas.ac.id / 221011001"
                      className="block w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-9 pr-10 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      onClick={() => { setAuthMode('FORGOT_PASSWORD'); setErrorMessage(''); setSuccessMessage(''); }}
                      className="text-[11px] text-brand-700 font-semibold hover:underline"
                    >
                      Lupa Kata Sandi?
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 px-4 border border-transparent rounded-xl shadow-md text-xs font-bold text-white bg-brand-800 hover:bg-brand-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Memverifikasi...
                    </span>
                  ) : (
                    <>
                      <span>Masuk ke LMS</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* 1-Click Autofill Pengujian (Bersih, Rapi & Elegan) */}
                <div className="pt-3 mt-3 border-t border-slate-200/80">
                  <p className="text-[11px] text-center text-slate-500 font-medium mb-2">
                    ⚡ Klik tombol di bawah untuk pengisian akun instan:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => { setIdentifier('admin@stienas.ac.id'); setPassword('admin123'); }}
                      className="p-2 bg-slate-50 hover:bg-purple-50 text-slate-800 hover:text-purple-900 border border-slate-200 hover:border-purple-300 rounded-xl text-left transition-all flex flex-col"
                    >
                      <span className="font-bold text-xs flex items-center gap-1">👑 Super Admin</span>
                      <span className="text-[10px] text-slate-500 font-mono">admin123</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIdentifier('akademik@stienas.ac.id'); setPassword('akademik123'); }}
                      className="p-2 bg-slate-50 hover:bg-indigo-50 text-slate-800 hover:text-indigo-900 border border-slate-200 hover:border-indigo-300 rounded-xl text-left transition-all flex flex-col"
                    >
                      <span className="font-bold text-xs flex items-center gap-1">🏛️ Admin BAA</span>
                      <span className="text-[10px] text-slate-500 font-mono">akademik123</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIdentifier('dosen@stienas.ac.id'); setPassword('dosen123'); }}
                      className="p-2 bg-slate-50 hover:bg-blue-50 text-slate-800 hover:text-blue-900 border border-slate-200 hover:border-blue-300 rounded-xl text-left transition-all flex flex-col"
                    >
                      <span className="font-bold text-xs flex items-center gap-1">👨‍🏫 Dosen</span>
                      <span className="text-[10px] text-slate-500 font-mono">dosen123</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIdentifier('mahasiswa@stienas.ac.id'); setPassword('mhs123'); }}
                      className="p-2 bg-slate-50 hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition-all flex flex-col"
                    >
                      <span className="font-bold text-xs flex items-center gap-1">🎓 Mahasiswa</span>
                      <span className="text-[10px] text-slate-500 font-mono">mhs123</span>
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}

          {/* =========================================================================
              VIEW 1.5: FORM LUPA PASSWORD
              ========================================================================= */}
          {authMode === 'FORGOT_PASSWORD' && (
            <form className="space-y-4" onSubmit={handleForgotPasswordSubmit}>
              <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl text-brand-900 space-y-1 mb-2">
                <span className="font-bold block flex items-center gap-1">
                  <Lock className="w-4 h-4 text-brand-700" />
                  Reset Kata Sandi
                </span>
                <p className="text-[11px] text-brand-800 leading-relaxed">
                  Masukkan email yang terdaftar. Kami akan mengirimkan tautan untuk mereset kata sandi Anda.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Email Terdaftar
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="email.anda@stienas.ac.id"
                    className="block w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-2.5 px-4 border border-transparent rounded-xl shadow-md text-xs font-bold text-white bg-brand-800 hover:bg-brand-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Memproses...
                  </span>
                ) : (
                  <>
                    <span>Kirim Tautan Reset</span>
                    <Mail className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-3">
                <button
                  type="button"
                  onClick={() => setAuthMode('LOGIN')}
                  className="text-[11px] text-slate-500 hover:text-brand-800 font-semibold flex items-center justify-center gap-1 mx-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Kembali ke Halaman Login
                </button>
              </div>
            </form>
          )}

          {/* =========================================================================
              VIEW 2: FORM PENDAFTARAN MAHASISWA BARU
              ========================================================================= */}
          {authMode === 'REGISTER' && (
            <form className="space-y-3 text-xs" onSubmit={handleRegisterSubmit}>
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-emerald-900 space-y-1">
                <span className="font-bold block flex items-center gap-1">
                  <GraduationCap className="w-4 h-4 text-emerald-700" />
                  Pendaftaran Mandiri Mahasiswa STIE Nasional
                </span>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Daftarkan diri Anda dengan email aktif untuk mengakses 16 modul perkuliahan OBE dan Kartu Hasil Studi (KHS).
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Mahasiswa *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Siti Rahmah"
                  value={regForm.name}
                  onChange={e => setRegForm({ ...regForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alamat Email *</label>
                <input
                  type="email"
                  required
                  placeholder="email.anda@gmail.com"
                  value={regForm.email}
                  onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kata Sandi *</label>
                  <input
                    type="password"
                    required
                    placeholder="Min. 6 karakter"
                    value={regForm.password}
                    onChange={e => setRegForm({ ...regForm, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ulangi Sandi *</label>
                  <input
                    type="password"
                    required
                    placeholder="Sama dengan di samping"
                    value={regForm.confirmPassword}
                    onChange={e => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Program Studi *</label>
                  <select
                    value={regForm.prodiId}
                    onChange={e => {
                      const newPid = e.target.value;
                      setRegForm({
                        ...regForm,
                        prodiId: newPid,
                        nim: generateSuggestedNim(regForm.angkatan, newPid)
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 font-bold"
                  >
                    <option value="prodi-s1-manajemen">S1 Manajemen</option>
                    <option value="prodi-s1-akuntansi">S1 Akuntansi</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Angkatan Masuk *</label>
                  <select
                    value={regForm.angkatan}
                    onChange={e => {
                      const newAngk = Number(e.target.value);
                      setRegForm({
                        ...regForm,
                        angkatan: newAngk,
                        nim: generateSuggestedNim(newAngk, regForm.prodiId)
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 font-bold"
                  >
                    {ANGKATAN_OPTIONS.map(opt => (
                      <option key={opt.tahun} value={opt.tahun}>Tahun {opt.tahun}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-700">Nomor Induk Mahasiswa (NIM) *</label>
                  <button
                    type="button"
                    onClick={() => setRegForm({ ...regForm, nim: generateSuggestedNim(regForm.angkatan, regForm.prodiId) })}
                    className="text-[10px] text-brand-700 font-bold hover:underline"
                  >
                    Gunakan Saran NIM
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 241011088"
                  value={regForm.nim}
                  onChange={e => setRegForm({ ...regForm, nim: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 bg-white"
                />
              </div>

              {/* Pesan Penting Mahasiswa Baru */}
              <div className="p-3 bg-white rounded-xl border border-brand-200 text-xs shadow-sm">
                <div className="font-bold text-brand-900 flex items-center gap-1.5 mb-1.5">
                  <CheckCircle className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Informasi Penting Pendaftaran</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Pastikan email dan kata sandi yang didaftarkan mudah diingat. Akun ini akan menjadi akses utama Anda ke dalam LMS untuk mengikuti 16 modul perkuliahan (Sub-CPMK), bergabung ke ruang tatap muka virtual (Meet/Zoom), serta menyematkan tugas dan melihat perolehan nilai akhir (KHS).
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 border border-transparent rounded-xl shadow-md text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 focus:outline-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span>Mendaftarkan...</span>
                ) : (
                  <>
                    <span>Daftar Sebagai Mahasiswa</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setAuthMode('LOGIN')}
                  className="text-[11px] text-slate-500 hover:text-brand-800 font-semibold"
                >
                  Sudah memiliki akun? <strong className="text-brand-800 underline">Masuk di sini</strong>
                </button>
              </div>
            </form>
          )}

        </div>
      </div>

      {showConfigModal && (
        <FirebaseSettingsModal onClose={() => setShowConfigModal(false)} />
      )}
    </div>
  );
}
