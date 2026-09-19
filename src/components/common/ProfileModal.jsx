import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateUser } from '../../firebase/firestoreService';
import { 
  calculateAcademicStanding, 
  ANGKATAN_OPTIONS 
} from '../../utils/studentNimHelper';
import { showErrorAlert, showSuccessToast } from '../../utils/alert';
import { 
  User, 
  X, 
  Check, 
  GraduationCap, 
  Mail, 
  Phone, 
  Sparkles, 
  Camera, 
  Building2,
  Calendar
} from 'lucide-react';

export default function ProfileModal({ onClose }) {
  const { user, updateCurrentUserProfile } = useAuth();
  const isMhs = user?.role === 'MAHASISWA';
  const isDosen = user?.role === 'DOSEN';

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    nim: user?.nim || '',
    nidn: user?.nidn || '',
    angkatan: user?.angkatan || (user?.nim ? calculateAcademicStanding(user.nim).angkatan : 2026),
    phone: user?.phone || '',
    avatarUrl: user?.avatarUrl || ''
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const academicStanding = isMhs ? calculateAcademicStanding(form.nim, form.angkatan) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      await updateUser(user.uid, form, user);
      updateCurrentUserProfile(form);
      showSuccessToast("Profil berhasil diperbarui!");
      setSuccessMsg("Profil berhasil diperbarui!");
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      showErrorAlert("Gagal Menyimpan Profil", err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full p-5 sm:p-6 border border-slate-200 max-h-[92vh] overflow-y-auto">
        
        {/* Header Modal */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-800 flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Profil Saya</h3>
              <p className="text-[11px] text-slate-400">Pengaturan Identitas Akun & Akademik</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMsg && (
          <div className="p-3 mb-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          
          {/* Avatar Preview */}
          <div className="flex items-center gap-3.5 p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <img 
              src={form.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name || 'User')}&background=1e3a8a&color=fff`} 
              alt={form.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-brand-200 shadow-sm"
            />
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">URL Foto Profil (Avatar)</label>
              <input 
                type="text"
                placeholder="https://..."
                value={form.avatarUrl}
                onChange={e => setForm({ ...form, avatarUrl: e.target.value })}
                className="w-full px-2.5 py-1.5 text-[11px] border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
            <input 
              type="text"
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Alamat Email</label>
            <input 
              type="email"
              disabled
              value={form.email}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-100 text-slate-500 font-mono"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Email akun terdaftar tidak dapat diubah sendiri.</span>
          </div>

          {/* Atribut Mahasiswa: NIM, Angkatan & Semester */}
          {isMhs && (
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2.5">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                <GraduationCap className="w-4 h-4 text-emerald-700" />
                Informasi Mahasiswa & Semester
              </span>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Angkatan Masuk</label>
                  <select
                    value={form.angkatan}
                    onChange={e => setForm({ ...form, angkatan: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-bold text-xs"
                  >
                    {ANGKATAN_OPTIONS.map(opt => (
                      <option key={opt.tahun} value={opt.tahun}>{opt.tahun}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIM</label>
                  <input 
                    type="text"
                    required
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="261011xxx (Hanya Angka)"
                    value={form.nim}
                    onKeyDown={e => {
                      if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) || e.ctrlKey || e.metaKey) return;
                      if (!/^[0-9]$/.test(e.key)) e.preventDefault();
                    }}
                    onChange={e => setForm({ ...form, nim: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-bold bg-white text-xs"
                  />
                </div>
              </div>

              {/* Status Semester Otomatis */}
              {academicStanding && (
                <div className="p-2.5 bg-white rounded-xl border border-emerald-300 text-xs">
                  <div className="text-[11px] text-slate-500">Estimasi Semester Berjalan (TA 2026/2027):</div>
                  <div className="font-bold text-emerald-900 mt-0.5 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{academicStanding.infoLengkap}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Atribut Dosen: NUPTK/NIP */}
          {isDosen && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">NUPTK / NIP Dosen</label>
              <input 
                type="text"
                value={form.nidn}
                onChange={e => setForm({ ...form, nidn: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon / WhatsApp</label>
            <input 
              type="text"
              placeholder="0812xxxxxxxx"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-brand-800 text-white rounded-xl font-bold hover:bg-brand-900 shadow disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
