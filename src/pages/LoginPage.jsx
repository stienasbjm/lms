import React, { useState, useEffect } from 'react';
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
  BookOpen,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import { registerStudent } from '../firebase/firestoreService';
import { requestPasswordReset, directResetPassword } from '../firebase/authService';
import { 
  calculateAcademicStanding, 
  generateSuggestedNim, 
  ANGKATAN_OPTIONS 
} from '../utils/studentNimHelper';

import { showErrorAlert, showSuccessAlert, showSuccessToast } from '../utils/alert';

export default function LoginPage({ onBackToLanding, defaultAuthMode = 'LOGIN' }) {
  const { login, setSpecificUser, isFirebaseLive } = useAuth();
  const [authMode, setAuthMode] = useState(defaultAuthMode || 'LOGIN'); // 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD'

  // Sinkronkan mode otentikasi saat props defaultAuthMode berubah
  useEffect(() => {
    if (defaultAuthMode) {
      setAuthMode(defaultAuthMode);
    }
  }, [defaultAuthMode]);

  // Login State (Clean & Kosong secara default)
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset Password State
  const [resetTarget, setResetTarget] = useState(null); // Akun yang ditemukan saat cari reset sandi
  const [newPasswordForReset, setNewPasswordForReset] = useState('');
  const [confirmPasswordForReset, setConfirmPasswordForReset] = useState('');
  const [showResetPass, setShowResetPass] = useState(false);

  // Register State (Khusus Mahasiswa Baru)
  const [showRegPass, setShowRegPass] = useState(false);
  const [showRegConfirmPass, setShowRegConfirmPass] = useState(false);
  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    prodiId: 'prodi-s1-manajemen',
    angkatan: 2026,
    nim: generateSuggestedNim(2026, 'prodi-s1-manajemen'),
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
    
    const trimmedId = (identifier || '').trim();
    if (!trimmedId) {
      setErrorMessage('Harap masukkan alamat email, NIM, atau username Anda.');
      showErrorAlert('Identitas Diperlukan', 'Harap masukkan alamat email terdaftar, NIM, atau username akun Anda.');
      return;
    }

    setLoading(true);
    try {
      const res = await requestPasswordReset(trimmedId);
      if (res.sentViaFirebase) {
        const msg = `Tautan reset kata sandi telah dikirim ke alamat email resmi terdaftar: ${res.email}. Silakan periksa kotak masuk (Inbox) atau folder Spam email Anda.`;
        setSuccessMessage(msg);
        showSuccessAlert('Tautan Reset Terkirim', msg);
        setIdentifier('');
      } else {
        // Layanan email eksternal dinonaktifkan/belum dikonfigurasi -> Berikan opsi reset langsung yang aman
        const target = res.foundUser || { email: res.email, name: res.name };
        setResetTarget(target);
        setSuccessMessage(`Akun ditemukan atas nama ${target.name || target.email}. Silakan buat kata sandi baru Anda langsung di bawah ini.`);
        showSuccessToast('Akun ditemukan! Silakan atur kata sandi baru.');
      }
    } catch (err) {
      const msg = err.message || "Gagal memproses permintaan reset kata sandi.";
      setErrorMessage(msg);
      showErrorAlert('Akun Tidak Ditemukan', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectResetSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!newPasswordForReset || newPasswordForReset.length < 6) {
      const msg = "Kata sandi baru minimal 6 karakter.";
      setErrorMessage(msg);
      showErrorAlert("Kata Sandi Terlalu Pendek", msg);
      return;
    }

    if (newPasswordForReset !== confirmPasswordForReset) {
      const msg = "Konfirmasi kata sandi baru tidak cocok.";
      setErrorMessage(msg);
      showErrorAlert("Kata Sandi Tidak Cocok", msg);
      return;
    }

    setLoading(true);
    try {
      const targetEmail = resetTarget.email;
      await directResetPassword(targetEmail, newPasswordForReset);
      showSuccessAlert(
        "Kata Sandi Berhasil Diperbarui!", 
        `Kata sandi baru untuk akun ${resetTarget.name || targetEmail} telah berhasil disimpan. Silakan masuk menggunakan kata sandi baru Anda.`
      );
      setIdentifier(targetEmail);
      setPassword(newPasswordForReset);
      setResetTarget(null);
      setNewPasswordForReset('');
      setConfirmPasswordForReset('');
      setAuthMode('LOGIN');
    } catch (err) {
      const msg = err.message || "Gagal memperbarui kata sandi.";
      setErrorMessage(msg);
      showErrorAlert("Gagal Reset Sandi", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanName = (regForm.name || '').trim();
    const cleanEmail = (regForm.email || '').trim().toLowerCase();
    let cleanNim = (regForm.nim || '').trim().replace(/\D/g, '');

    if (!cleanName || !cleanEmail || !regForm.password) {
      const msg = "Harap lengkapi nama, email, dan kata sandi pendaftaran.";
      setErrorMessage(msg);
      showErrorAlert('Data Belum Lengkap', msg);
      return;
    }

    // Jika NIM belum diisi, otomatis buatkan saran NIM resmi STIE Nasional
    if (!cleanNim) {
      cleanNim = generateSuggestedNim(regForm.angkatan, regForm.prodiId);
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
        name: cleanName,
        email: cleanEmail,
        password: regForm.password,
        prodiId: regForm.prodiId || 'prodi-s1-manajemen',
        angkatan: Number(regForm.angkatan) || 2026,
        nim: cleanNim,
        phone: (regForm.phone || '').trim()
      });

      showSuccessToast(`Selamat datang, ${newStudent.name}! Pendaftaran berhasil.`);
      // Langsung arahkan mahasiswa ke dasbor
      setSpecificUser(newStudent);
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
        

        <div className="text-center">
          <div className="inline-flex items-center justify-center mb-3">
            <img 
              src={`${import.meta.env.BASE_URL}logo-stienas.png`} 
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
                    Email / NIM / NUPTK/NIP / Username
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
                      placeholder="nama@gmail.com / 221011001"
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
              </form>
            </>
          )}

          {/* =========================================================================
              VIEW 1.5: FORM LUPA PASSWORD & RESET SANDI LANGSUNG
              ========================================================================= */}
          {authMode === 'FORGOT_PASSWORD' && (
            <div className="space-y-4">
              {!resetTarget ? (
                <form className="space-y-4" onSubmit={handleForgotPasswordSubmit}>
                  <div className="p-3.5 bg-brand-50 border border-brand-200 rounded-2xl text-brand-900 space-y-1">
                    <span className="font-bold block flex items-center gap-1.5 text-xs">
                      <Lock className="w-4 h-4 text-brand-700" />
                      Reset Kata Sandi Akun
                    </span>
                    <p className="text-[11px] text-brand-800 leading-relaxed">
                      Masukkan email terdaftar, NIM, atau username Anda untuk memverifikasi akun dan menyetel ulang kata sandi.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Terdaftar / NIM / Username Akun *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="Contoh: raby79279@gmail.com atau NIM Anda"
                        className="block w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all font-semibold"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Sistem akan mendeteksi akun Anda secara instan dan menyediakan opsi reset kata sandi aman.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-2.5 px-4 border border-transparent rounded-xl shadow-md text-xs font-bold text-white bg-brand-800 hover:bg-brand-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Memeriksa Akun...
                      </span>
                    ) : (
                      <>
                        <span>Cari Akun & Lanjutkan Reset</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => { setAuthMode('LOGIN'); setResetTarget(null); }}
                      className="text-[11px] text-slate-500 hover:text-brand-800 font-semibold flex items-center justify-center gap-1 mx-auto"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Kembali ke Halaman Login
                    </button>
                  </div>
                </form>
              ) : (
                <form className="space-y-3.5" onSubmit={handleDirectResetSubmit}>
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Akun Ditemukan: {resetTarget.name}</span>
                    </div>
                    <div className="text-[11px] text-emerald-800 flex flex-wrap gap-x-3 gap-y-1">
                      <span>Email: <strong className="font-mono">{resetTarget.email}</strong></span>
                      {resetTarget.nim && <span>NIM: <strong className="font-mono">{resetTarget.nim}</strong></span>}
                    </div>
                    <p className="text-[10px] text-emerald-700 leading-relaxed pt-1 border-t border-emerald-200/60">
                      Silakan tentukan kata sandi baru untuk akun Anda langsung di bawah ini:
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kata Sandi Baru * (Min. 6 Karakter)
                    </label>
                    <div className="relative">
                      <input
                        type={showResetPass ? "text" : "password"}
                        required
                        minLength={6}
                        value={newPasswordForReset}
                        onChange={(e) => setNewPasswordForReset(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        className="block w-full px-3 py-2 pr-10 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetPass(!showResetPass)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        {showResetPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Konfirmasi Kata Sandi Baru *
                    </label>
                    <input
                      type={showResetPass ? "text" : "password"}
                      required
                      minLength={6}
                      value={confirmPasswordForReset}
                      onChange={(e) => setConfirmPasswordForReset(e.target.value)}
                      placeholder="Ketik ulang kata sandi baru"
                      className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-semibold"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-3 py-2.5 px-4 border border-transparent rounded-xl shadow-md text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Menyimpan Kata Sandi...
                      </span>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Simpan Kata Sandi Baru & Masuk</span>
                      </>
                    )}
                  </button>

                  <div className="flex justify-between items-center pt-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setResetTarget(null)}
                      className="text-slate-500 hover:text-slate-800 font-semibold"
                    >
                      Batal / Cari Akun Lain
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAuthMode('LOGIN'); setResetTarget(null); }}
                      className="text-brand-700 hover:text-brand-900 font-bold"
                    >
                      Kembali ke Login
                    </button>
                  </div>
                </form>
              )}
            </div>
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
                  <div className="relative">
                    <input
                      type={showRegPass ? "text" : "password"}
                      required
                      placeholder="Min. 6 karakter"
                      value={regForm.password}
                      onChange={e => setRegForm({ ...regForm, password: e.target.value })}
                      className="w-full px-3 py-2 pr-8 border border-slate-300 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-brand-500 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPass(!showRegPass)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showRegPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ulangi Sandi *</label>
                  <div className="relative">
                    <input
                      type={showRegConfirmPass ? "text" : "password"}
                      required
                      placeholder="Sama persis"
                      value={regForm.confirmPassword}
                      onChange={e => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                      className="w-full px-3 py-2 pr-8 border border-slate-300 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-brand-500 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPass(!showRegConfirmPass)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showRegConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
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
                      <option key={opt.tahun} value={opt.tahun}>{opt.label}</option>
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
                  inputMode="numeric"
                  placeholder="Contoh: 261011001 (Hanya Angka)"
                  value={regForm.nim}
                  onChange={e => setRegForm({ ...regForm, nim: e.target.value.replace(/\D/g, '') })}
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

        {/* Back button to Landing Page dipindahkan ke bagian bawah */}
        {onBackToLanding && (
          <div className="text-center mt-5 mb-4">
            <button
              type="button"
              onClick={onBackToLanding}
              className="inline-flex items-center gap-2 text-xs text-slate-300 hover:text-white font-semibold py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-gold-400" />
              <span>Kembali ke Beranda (Landing Page)</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
