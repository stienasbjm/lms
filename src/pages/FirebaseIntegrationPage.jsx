import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  getSavedFirebaseConfig, 
  saveFirebaseConfig, 
  isRealFirebaseConfigured,
  auth,
  db 
} from '../firebase/config';
import { syncCollectionsToLiveFirestore } from '../firebase/firestoreService';
import { 
  Database, 
  Flame, 
  Check, 
  AlertCircle, 
  Copy, 
  RefreshCw, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  Server,
  Lock,
  Layers
} from 'lucide-react';
import { showSuccessAlert, showErrorAlert, showConfirmDialog, customSwal } from '../utils/alert';

export default function FirebaseIntegrationPage() {
  const { user } = useAuth();
  const [config, setConfig] = useState(getSavedFirebaseConfig());
  const [rawJson, setRawJson] = useState('');
  const [useJsonMode, setUseJsonMode] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState([]);
  const [copiedRules, setCopiedRules] = useState(null);

  // Akses halaman ini dibatasi hanya untuk Super Admin
  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-rose-200 shadow-sm max-w-lg mx-auto">
        <AlertCircle className="w-12 h-12 text-rose-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900">Akses Terbatas</h3>
        <p className="text-xs text-slate-500 mt-1">
          Halaman Integrasi Cloud Firebase hanya dapat diakses oleh akun <strong>Super Administrator</strong>.
        </p>
      </div>
    );
  }

  // Handle parsing JSON paste dari Firebase Console
  const handleJsonPaste = (e) => {
    const text = e.target.value;
    setRawJson(text);
    try {
      const parsed = JSON.parse(text);
      if (parsed.apiKey && parsed.projectId) {
        setConfig(parsed);
      }
    } catch (err) {
      // Tunggu input lengkap
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    saveFirebaseConfig(config);
    await showSuccessAlert("Tersimpan", "Konfigurasi Firebase berhasil disimpan! Aplikasi akan memuat ulang...");
    window.location.reload();
  };

  const handleResetDefault = async () => {
    const confirmed = await showConfirmDialog({
      title: "Reset Konfigurasi?",
      text: "Kembalikan konfigurasi ke mode BaaS Demo Standar?",
      confirmButtonText: "Ya, Reset",
      cancelButtonText: "Batal"
    });
    if (confirmed) {
      localStorage.removeItem('STIE_LMS_FIREBASE_CONFIG');
      window.location.reload();
    }
  };

  // Uji koneksi live ke Firebase SDK
  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      if (!isRealFirebaseConfigured()) {
        throw new Error("API Key masih menggunakan Dummy Key. Silakan masukkan kredensial Firebase asli Anda terlebih dahulu.");
      }

      // Test auth / db state
      if (!auth || !db) {
        throw new Error("Objek Firebase Auth / Firestore belum terinisialisasi.");
      }

      setTestResult({
        success: true,
        message: `Koneksi berhasil! Terhubung dengan Project ID: "${config.projectId}". Firebase Auth dan Cloud Firestore siap digunakan.`
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || "Gagal menghubungkan ke Firebase. Periksa kembali API Key dan Project ID."
      });
    } finally {
      setTesting(false);
    }
  };

  // Sinkronisasi seluruh koleksi ke live Firestore
  const handleSyncFirestore = async () => {
    setSyncing(true);
    setSyncLogs([]);
    try {
      const res = await syncCollectionsToLiveFirestore((msg, logs) => {
        setSyncLogs([...logs]);
      });
      showSuccessAlert("Sinkronisasi Selesai", "Inisialisasi koleksi Cloud Firestore selesai dengan sukses!");
    } catch (err) {
      const errMsg = (err.message || '').toLowerCase();
      if (errMsg.includes('permission') || errMsg.includes('izin')) {
        customSwal.fire({
          icon: 'warning',
          title: 'Izin Firestore Masih Terkunci',
          html: `
            <div class="text-left space-y-3 text-xs text-slate-700 leading-relaxed">
              <p>Firebase menolak sinkronisasi karena <strong>Aturan Keamanan (Security Rules)</strong> di Firebase Console masih terkunci (<em>Missing or insufficient permissions</em>).</p>
              
              <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
                <div class="font-bold">Langkah Cepat Membuka Akses (Hanya 1 Menit):</div>
                <ol class="list-decimal pl-4 space-y-1">
                  <li>Buka tab <strong>Rules</strong> di Firestore Database Firebase Console</li>
                  <li>Ubah aturan menjadi:</li>
                </ol>
              </div>

              <pre class="p-3 bg-slate-900 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto">rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}</pre>

              <p>3. Klik tombol <strong>Publish (Publikasikan)</strong>.</p>
              <p>4. Setelah dipublikasikan, klik tombol <strong>Sinkronkan Database Sekarang</strong> lagi.</p>
            </div>
          `,
          confirmButtonText: 'Buka Firebase Console Rules',
          showCancelButton: true,
          cancelButtonText: 'Tutup'
        }).then((result) => {
          if (result.isConfirmed) {
            window.open(`https://console.firebase.google.com/project/${config.projectId}/firestore/rules`, '_blank');
          }
        });
      } else {
        showErrorAlert("Gagal Sinkronisasi", err.message);
      }
    } finally {
      setSyncing(false);
    }
  };

  const firestoreRulesText = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

  const storageRulesText = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}`;

  const handleCopyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedRules(key);
    setTimeout(() => setCopiedRules(null), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            Integrasi Basis Data Google Firebase (Khusus Super Admin)
          </h2>
          <p className="text-xs text-slate-500">
            Hubungkan LMS secara langsung ke Firebase Authentication, Cloud Firestore, dan Storage
          </p>
        </div>

        <a
          href="https://console.firebase.google.com"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow transition-colors self-start sm:self-auto"
        >
          <ExternalLink className="w-4 h-4" />
          Buka Firebase Console
        </a>
      </div>

      {/* Status Banner */}
      <div className={`p-5 rounded-2xl border shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4 ${
        isRealFirebaseConfigured() 
          ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
          : 'bg-amber-50 border-amber-300 text-amber-950'
      }`}>
        <div className="flex items-start space-x-3.5">
          <div className={`p-2.5 rounded-xl ${isRealFirebaseConfigured() ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="font-extrabold text-sm flex items-center gap-2">
              <span>{isRealFirebaseConfigured() ? 'Firebase Terhubung (Live BaaS Active)' : 'Mode BaaS Mandiri / Standar Demo Aktif'}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isRealFirebaseConfigured() ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'}`}>
                {isRealFirebaseConfigured() ? 'Production Ready' : 'In-Memory/Local Storage'}
              </span>
            </div>
            <p className="text-xs mt-1 max-w-2xl opacity-90 leading-relaxed">
              {isRealFirebaseConfigured()
                ? `LMS saat ini terhubung langsung ke Google Cloud Project: "${config.projectId}". Seluruh data autentikasi dan kueri disinkronkan ke server Google Cloud.`
                : 'LMS saat ini berjalan dalam mode mandiri siap pakai (Instant Seed). Masukkan API Key & Project ID Firebase Console Anda di bawah ini untuk menghubungkan ke database riil kampus.'}
            </p>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow transition-colors flex items-center gap-1.5"
          >
            {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
            <span>Uji Koneksi Live</span>
          </button>
        </div>
      </div>

      {/* Hasil Uji Koneksi */}
      {testResult && (
        <div className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in ${
          testResult.success 
            ? 'bg-emerald-100/70 border-emerald-300 text-emerald-900' 
            : 'bg-rose-100/70 border-rose-300 text-rose-900'
        }`}>
          {testResult.success ? <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />}
          <div>
            <div className="font-bold">{testResult.success ? 'Uji Koneksi Berhasil!' : 'Uji Koneksi Gagal'}</div>
            <div className="mt-0.5">{testResult.message}</div>
          </div>
        </div>
      )}

      {/* Grid Konfigurasi & Inisialisasi */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Kiri (2 Span): Form Kredensial Firebase */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Lock className="w-4 h-4 text-brand-700" />
                Kredensial Proyek Firebase
              </h3>

              <button
                type="button"
                onClick={() => setUseJsonMode(!useJsonMode)}
                className="text-xs text-brand-700 font-bold hover:underline"
              >
                {useJsonMode ? 'Beralih ke Input Form' : 'Paste Kode JSON firebaseConfig'}
              </button>
            </div>

            {useJsonMode ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Paste Objek JSON <code>firebaseConfig</code> dari Firebase Console:
                </label>
                <textarea
                  rows="7"
                  value={rawJson}
                  onChange={handleJsonPaste}
                  placeholder={'{\n  "apiKey": "AIzaSy...",\n  "authDomain": "stie-nasional.firebaseapp.com",\n  "projectId": "stie-nasional",\n  "storageBucket": "stie-nasional.appspot.com",\n  "appId": "1:..."\n}'}
                  className="w-full text-xs font-mono p-3.5 bg-slate-900 text-emerald-400 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 border border-slate-800"
                />
              </div>
            ) : (
              <form onSubmit={handleSaveConfig} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">API Key (apiKey)</label>
                  <input
                    type="text"
                    required
                    value={config.apiKey || ''}
                    onChange={e => setConfig({...config, apiKey: e.target.value})}
                    placeholder="contoh: AIzaSyD-..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Project ID (projectId)</label>
                  <input
                    type="text"
                    required
                    value={config.projectId || ''}
                    onChange={e => setConfig({...config, projectId: e.target.value})}
                    placeholder="contoh: lms-stie-nasional"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Auth Domain (authDomain)</label>
                  <input
                    type="text"
                    value={config.authDomain || ''}
                    onChange={e => setConfig({...config, authDomain: e.target.value})}
                    placeholder="contoh: lms-stie-nasional.firebaseapp.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Storage Bucket (storageBucket)</label>
                  <input
                    type="text"
                    value={config.storageBucket || ''}
                    onChange={e => setConfig({...config, storageBucket: e.target.value})}
                    placeholder="contoh: lms-stie-nasional.appspot.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">App ID (appId)</label>
                  <input
                    type="text"
                    value={config.appId || ''}
                    onChange={e => setConfig({...config, appId: e.target.value})}
                    placeholder="contoh: 1:123456789:web:abcdef"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 font-mono text-xs"
                  />
                </div>

                <div className="sm:col-span-2 flex justify-between items-center pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleResetDefault}
                    className="text-rose-600 hover:text-rose-800 font-semibold text-xs flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reset ke Standar Demo
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-brand-800 hover:bg-brand-900 text-white font-bold rounded-xl text-xs shadow transition-colors"
                  >
                    Simpan & Hubungkan Database
                  </button>
                </div>
              </form>
            )}

          </div>

          {/* Section Inisialisasi Database Firestore Otomatis */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  Inisialisasi & Sinkronisasi Koleksi Firestore (One-Click)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tulis seluruh struktur database (users, tahun_akademik, prodi, mata_kuliah, kelas_kuliah 16 pertemuan) ke Cloud Firestore Anda
                </p>
              </div>

              <button
                onClick={handleSyncFirestore}
                disabled={syncing}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow transition-colors flex items-center gap-1.5 shrink-0"
              >
                {syncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{syncing ? 'Menulis Koleksi...' : 'Sinkronkan Database Sekarang'}</span>
              </button>
            </div>

            {syncLogs.length > 0 && (
              <div className="p-3.5 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl space-y-1 max-h-48 overflow-y-auto">
                {syncLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <span className="text-slate-500">&gt;</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Kolom Kanan (1 Span): Petunjuk Praktis & Aturan Keamanan */}
        <div className="space-y-6">
          
          {/* Panduan 4 Langkah Firebase Console */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Server className="w-4 h-4 text-brand-700" />
              Langkah Menghubungkan:
            </h4>

            <ol className="space-y-2.5 text-slate-600 pl-4 list-decimal leading-relaxed">
              <li>Buka <strong>Firebase Console</strong> dan klik <em>Create a project</em>.</li>
              <li>Masuk ke menu <strong>Build &gt; Authentication</strong>, aktifkan Sign-in method <strong>Email/Password</strong>.</li>
              <li>Masuk ke <strong>Firestore Database</strong>, klik <em>Create Database</em> (Pilih lokasi <code>asia-southeast2</code> Jakarta).</li>
              <li>Masuk ke <strong>Storage</strong>, klik <em>Get Started</em>.</li>
              <li>Masuk ke <strong>Project Settings &gt; General</strong>, pada bagian <em>Your apps</em> pilih Web App <code>&lt;/&gt;</code>, lalu salin kredensial ke form di sebelah kiri.</li>
            </ol>
          </div>

          {/* Salin Security Rules Firestore */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              1. Aturan Keamanan Firestore (Wajib)
            </h4>
            <p className="text-[11px] text-slate-500">
              Salin aturan ini ke tab <strong>Firestore Database &gt; Rules</strong> di Firebase Console agar sinkronisasi tidak terhalang <em>permission-denied</em>:
            </p>

            <div className="relative">
              <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto">
                {firestoreRulesText}
              </pre>
              <button
                onClick={() => handleCopyText(firestoreRulesText, 'firestore')}
                className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
              >
                {copiedRules === 'firestore' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedRules === 'firestore' ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>
          </div>

          {/* Salin Security Rules Storage */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              2. Aturan Keamanan Cloud Storage
            </h4>
            <p className="text-[11px] text-slate-500">
              Salin aturan ini ke tab <strong>Storage &gt; Rules</strong> untuk upload materi kuliah & tugas:
            </p>

            <div className="relative">
              <pre className="p-3 bg-slate-900 text-blue-300 rounded-xl font-mono text-[11px] overflow-x-auto">
                {storageRulesText}
              </pre>
              <button
                onClick={() => handleCopyText(storageRulesText, 'storage')}
                className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
              >
                {copiedRules === 'storage' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedRules === 'storage' ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
