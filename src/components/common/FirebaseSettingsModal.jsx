import React, { useState } from 'react';
import { getSavedFirebaseConfig, saveFirebaseConfig, isRealFirebaseConfigured } from '../../firebase/config';
import { X, Database, Check, AlertCircle, RefreshCw } from 'lucide-react';

export default function FirebaseSettingsModal({ onClose }) {
  const [config, setConfig] = useState(getSavedFirebaseConfig());
  const [rawJson, setRawJson] = useState('');
  const [useJsonMode, setUseJsonMode] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleJsonPaste = (e) => {
    const text = e.target.value;
    setRawJson(text);
    try {
      const parsed = JSON.parse(text);
      if (parsed.apiKey && parsed.projectId) {
        setConfig(parsed);
      }
    } catch (err) {
      // JSON in progress
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    saveFirebaseConfig(config);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleResetDefault = () => {
    localStorage.removeItem('STIE_LMS_FIREBASE_CONFIG');
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Konfigurasi Backend Firebase</h3>
              <p className="text-xs text-slate-300">Hubungkan LMS ke Firebase Console Anda</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Info */}
        <div className="p-6 space-y-4">
          <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
            isRealFirebaseConfigured() 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">
                {isRealFirebaseConfigured() ? 'Firebase Terhubung (Live BaaS)' : 'Mode BaaS Mandiri / Standar Demo Aktif'}
              </span>
              {isRealFirebaseConfigured() 
                ? `Menggunakan Project ID: ${config.projectId}`
                : 'Aplikasi saat ini berjalan menggunakan data instan tanpa perlu API Key eksternal. Masukkan konfigurasi Firebase jika ingin menghubungkan ke database riil Anda.'}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-700">Detail Kredensial Firebase</span>
            <button 
              type="button"
              onClick={() => setUseJsonMode(!useJsonMode)}
              className="text-xs text-brand-600 hover:underline font-medium"
            >
              {useJsonMode ? 'Gunakan Mode Form' : 'Paste JSON dari Firebase Console'}
            </button>
          </div>

          {useJsonMode ? (
            <div>
              <label className="block text-xs text-slate-600 mb-1">Paste Objek firebaseConfig JSON:</label>
              <textarea 
                rows="6"
                value={rawJson}
                onChange={handleJsonPaste}
                placeholder={'{\n  "apiKey": "AIza...",\n  "authDomain": "...",\n  "projectId": "..."\n}'}
                className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">API Key</label>
                <input 
                  type="text" 
                  value={config.apiKey || ''} 
                  onChange={e => setConfig({...config, apiKey: e.target.value})}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono" 
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Project ID</label>
                  <input 
                    type="text" 
                    value={config.projectId || ''} 
                    onChange={e => setConfig({...config, projectId: e.target.value})}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono" 
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Auth Domain</label>
                  <input 
                    type="text" 
                    value={config.authDomain || ''} 
                    onChange={e => setConfig({...config, authDomain: e.target.value})}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Storage Bucket</label>
                <input 
                  type="text" 
                  value={config.storageBucket || ''} 
                  onChange={e => setConfig({...config, storageBucket: e.target.value})}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono" 
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">App ID</label>
                <input 
                  type="text" 
                  value={config.appId || ''} 
                  onChange={e => setConfig({...config, appId: e.target.value})}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono" 
                />
              </div>
            </div>
          )}

          {savedSuccess && (
            <div className="p-2.5 bg-emerald-100 text-emerald-800 text-xs rounded-lg flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 text-emerald-600" />
              Konfigurasi berhasil disimpan! Halaman akan dimuat ulang...
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-slate-200">
            <button 
              type="button" 
              onClick={handleResetDefault}
              className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset ke Demo Standar
            </button>
            <div className="flex space-x-2">
              <button 
                type="button" 
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Batal
              </button>
              <button 
                type="button" 
                onClick={handleSave}
                className="px-4 py-1.5 text-xs bg-brand-800 hover:bg-brand-900 text-white font-medium rounded-lg shadow-sm"
              >
                Simpan & Muat Ulang
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
