import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  getProdi,
  subscribeToDataSync
} from '../firebase/firestoreService';
import { 
  calculateAcademicStanding, 
  generateSuggestedNim, 
  ANGKATAN_OPTIONS 
} from '../utils/studentNimHelper';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  Search, 
  AlertCircle, 
  Plus, 
  KeyRound, 
  Trash2, 
  Check, 
  X, 
  GraduationCap, 
  Sparkles, 
  BookOpen, 
  Lock, 
  Phone, 
  Mail, 
  SlidersHorizontal,
  Eye,
  EyeOff,
  AlertTriangle,
  Save,
  CheckCircle2
} from 'lucide-react';

export default function UserManagementPage() {
  const { user: currentUser, isSuperAdmin, isBaa } = useAuth();
  const [users, setUsers] = useState([]);
  const [prodis, setProdis] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // State bantuan dalam Modal Kelola
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form Tambah Akun Baru
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: 'password123',
    role: 'MAHASISWA',
    nim: '',
    nidn: '',
    angkatan: 2024,
    prodiId: 'prodi-s1-manajemen',
    phone: '',
    isActive: true
  });

  // Form Kelola & Update Akun Terpadu (Satu Pop-Up)
  const [manageForm, setManageForm] = useState({
    name: '',
    email: '',
    role: 'MAHASISWA',
    nim: '',
    nidn: '',
    angkatan: 2024,
    prodiId: '',
    phone: '',
    isActive: true,
    newPassword: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [u, p] = await Promise.all([
        getUsers(),
        getProdi()
      ]);
      setUsers(u);
      setProdis(p);
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
  }, [currentUser]);

  // Otoritas Pengelolaan Akun:
  // Super Admin: Semua peran (Super Admin, BAA, Dosen, Mahasiswa)
  // BAA: KHUSUS Dosen dan Mahasiswa saja
  const canManageUser = (target) => {
    if (!target) return false;
    if (isSuperAdmin) return true;
    if (isBaa) {
      return target.role === 'DOSEN' || target.role === 'MAHASISWA';
    }
    return false;
  };

  // Filter Pengguna Efektif:
  // Jika BAA: batasi data HANYA Dosen & Mahasiswa saja
  const effectiveUsers = (!isSuperAdmin && isBaa)
    ? users.filter(u => u.role === 'DOSEN' || u.role === 'MAHASISWA')
    : users;

  // Search and Filter
  const filteredUsers = effectiveUsers.filter(u => {
    const matchSearch = (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (u.nim || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (u.nidn || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const studentCount = effectiveUsers.filter(u => u.role === 'MAHASISWA').length;
  const lecturerCount = effectiveUsers.filter(u => u.role === 'DOSEN').length;
  const staffCount = users.filter(u => u.role === 'ADMIN_AKADEMIK' || u.role === 'SUPER_ADMIN').length;

  // ==========================================
  // HANDLERS: TAMBAH AKUN BARU
  // ==========================================
  const handleOpenCreate = () => {
    const defaultRole = 'MAHASISWA';
    const defaultAngkatan = 2024;
    const defaultProdi = prodis[0]?.id || 'prodi-s1-manajemen';
    setCreateForm({
      name: '',
      email: '',
      password: 'password123',
      role: defaultRole,
      nim: generateSuggestedNim(defaultAngkatan, defaultProdi),
      nidn: '',
      angkatan: defaultAngkatan,
      prodiId: defaultProdi,
      phone: '',
      isActive: true
    });
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.email.trim()) {
      alert("Harap lengkapi nama dan email pengguna.");
      return;
    }

    try {
      await createUser(createForm, currentUser);
      setShowCreateModal(false);
      await loadData();
      alert(`Akun ${createForm.name} (${createForm.role}) berhasil ditambahkan!`);
    } catch (err) {
      alert("Gagal menambahkan akun: " + err.message);
    }
  };

  // ==========================================
  // HANDLERS: KELOLA & UPDATE AKUN (SATU POP-UP)
  // ==========================================
  const handleOpenManageModal = (target) => {
    if (!canManageUser(target)) {
      alert("Anda tidak memiliki wewenang untuk mengelola akun ini.");
      return;
    }

    setSelectedUser(target);
    setShowDeleteConfirm(false);
    setShowPasswordText(false);

    const calculatedAngkatan = target.angkatan || 
      (target.nim ? calculateAcademicStanding(target.nim).angkatan : 2024);

    setManageForm({
      name: target.name || '',
      email: target.email || '',
      role: target.role || 'MAHASISWA',
      nim: target.nim || '',
      nidn: target.nidn || '',
      angkatan: calculatedAngkatan,
      prodiId: target.prodiId || prodis[0]?.id || 'prodi-s1-manajemen',
      phone: target.phone || '',
      isActive: target.isActive !== false,
      newPassword: ''
    });
    setShowManageModal(true);
  };

  const handleManageSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!manageForm.name.trim() || !manageForm.email.trim()) {
      alert("Nama dan email pengguna tidak boleh kosong.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: manageForm.name.trim(),
        email: manageForm.email.trim(),
        role: manageForm.role,
        phone: manageForm.phone.trim(),
        isActive: manageForm.isActive,
        prodiId: manageForm.prodiId
      };

      if (manageForm.role === 'MAHASISWA') {
        payload.nim = manageForm.nim.trim();
        payload.angkatan = Number(manageForm.angkatan);
        payload.nidn = '';
      } else if (manageForm.role === 'DOSEN') {
        payload.nidn = manageForm.nidn.trim();
        payload.nim = '';
        payload.angkatan = null;
      }

      // Jika ada kata sandi baru yang diinput, sertakan untuk reset
      if (manageForm.newPassword && manageForm.newPassword.trim().length > 0) {
        payload.password = manageForm.newPassword.trim();
      }

      await updateUser(selectedUser.uid, payload, currentUser);
      setShowManageModal(false);
      setSelectedUser(null);
      await loadData();
      alert(`Data akun ${payload.name} berhasil diperbarui!${payload.password ? ' (Kata sandi baru telah diterapkan)' : ''}`);
    } catch (err) {
      alert("Gagal memperbarui akun: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Hapus Akun Langsung dari Pop-Up
  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    if (!canManageUser(selectedUser)) {
      alert("Anda tidak memiliki wewenang untuk menghapus akun ini.");
      return;
    }
    if (selectedUser.uid === currentUser?.uid) {
      alert("Anda tidak dapat menghapus akun Anda sendiri.");
      return;
    }

    try {
      await deleteUser(selectedUser.uid, currentUser);
      setShowManageModal(false);
      setShowDeleteConfirm(false);
      setSelectedUser(null);
      await loadData();
      alert(`Akun ${selectedUser.name} telah berhasil dihapus secara permanen.`);
    } catch (err) {
      alert("Gagal menghapus akun: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-700" />
              {isSuperAdmin ? 'Master Seluruh Akun' : 'Master Akun'}
            </h2>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
              isSuperAdmin 
                ? 'bg-purple-100 text-purple-800 border-purple-200' 
                : 'bg-indigo-100 text-indigo-800 border-indigo-200'
            }`}>
              {isSuperAdmin ? 'Super Admin (Akses Penuh)' : 'Otoritas BAA (Dosen & Mahasiswa)'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isSuperAdmin 
              ? 'Kelola seluruh tingkatan akun pengguna: Super Admin, BAA, Dosen, dan Mahasiswa' 
              : 'Kelola akun Dosen dan Mahasiswa STIE Nasional Banjarmasin (Tambah, Update Data, Reset Sandi, Hapus)'}
          </p>
        </div>

        {/* Action Button: Tambah Akun */}
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white rounded-xl text-xs font-bold shadow transition-all transform hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Akun {isSuperAdmin ? 'Pengguna' : 'Dosen / Mahasiswa'}</span>
        </button>
      </div>

      {/* Info Badge Otoritas BAA */}
      {isBaa && !isSuperAdmin && (
        <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-start gap-3 text-xs text-indigo-900">
          <Shield className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Kewenangan Bagian Administrasi Akademik (BAA):</strong> Anda memiliki hak akses penuh untuk membuat, memperbarui profil, mengubah status aktif, mereset kata sandi, serta menghapus akun <strong>Dosen Pengampu</strong> dan <strong>Mahasiswa</strong>.
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Mahasiswa</div>
            <div className="text-2xl font-black text-emerald-800 mt-1">{studentCount} Orang</div>
            <div className="text-[10px] text-slate-400 mt-0.5">S1 Manajemen & Akuntansi</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Dosen Pengampu</div>
            <div className="text-2xl font-black text-blue-800 mt-1">{lecturerCount} Orang</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Dosen Ber-NIDN Terverifikasi</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          {isSuperAdmin ? (
            <>
              <div>
                <div className="text-xs text-slate-500 font-medium">Staf Akademik & Admin</div>
                <div className="text-2xl font-black text-purple-800 mt-1">{staffCount} Orang</div>
                <div className="text-[10px] text-slate-400 mt-0.5">BAA & Super Administrator</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <Shield className="w-5 h-5" />
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="text-xs text-slate-500 font-medium">Total Akun Terkelola</div>
                <div className="text-2xl font-black text-indigo-800 mt-1">{studentCount + lecturerCount} Akun</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Akses Penuh Kelola BAA</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama, NIM, NIDN, atau email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-slate-500 font-medium">Filter Peran:</span>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-white text-xs font-semibold text-slate-800"
          >
            <option value="ALL">
              {isSuperAdmin ? `Semua Peran (${effectiveUsers.length})` : `Semua Akun BAA (${effectiveUsers.length})`}
            </option>
            <option value="MAHASISWA">Mahasiswa ({studentCount})</option>
            <option value="DOSEN">Dosen Pengampu ({lecturerCount})</option>
            {isSuperAdmin && (
              <>
                <option value="ADMIN_AKADEMIK">Admin BAA</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Nama & Identitas</th>
                <th className="p-3.5">NIM / NIDN & Semester</th>
                <th className="p-3.5">Peran (Role)</th>
                <th className="p-3.5">Status Akun</th>
                <th className="p-3.5 text-center">Aksi & Pengelolaan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400 italic">
                    Tidak ditemukan data pengguna yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => {
                  const manageable = canManageUser(u);
                  const isMhs = u.role === 'MAHASISWA';
                  const academicStanding = isMhs && u.nim ? calculateAcademicStanding(u.nim, u.angkatan) : null;

                  return (
                    <tr key={u.uid} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center space-x-3">
                          <img 
                            src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=1e3a8a&color=fff`} 
                            alt={u.name}
                            className="w-9 h-9 rounded-full border border-slate-200 object-cover shrink-0" 
                          />
                          <div>
                            <div className="font-bold text-slate-900">{u.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{u.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        {u.nim ? (
                          <div className="space-y-0.5">
                            <span className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-800 border border-slate-200 text-xs">
                              {u.nim}
                            </span>
                            {academicStanding && (
                              <div className="text-[10px] text-slate-500 font-medium">
                                {academicStanding.infoLengkap}
                              </div>
                            )}
                          </div>
                        ) : u.nidn ? (
                          <div className="space-y-0.5">
                            <span className="bg-blue-50 text-blue-900 px-2 py-0.5 rounded font-mono font-bold border border-blue-200 text-xs">
                              NIDN: {u.nidn}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Administrator Kampus</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                          u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                          u.role === 'ADMIN_AKADEMIK' ? 'bg-indigo-100 text-indigo-800 border-indigo-300' :
                          u.role === 'DOSEN' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                          'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}>
                          {u.role === 'ADMIN_AKADEMIK' ? 'ADMIN BAA' : u.role}
                        </span>
                      </td>

                      <td className="p-3.5">
                        {u.isActive !== false ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                            AKTIF
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-300">
                            <UserX className="w-3 h-3 text-rose-600" />
                            NON-AKTIF
                          </span>
                        )}
                      </td>

                      {/* Kolom Aksi Terpadu: Satu Tombol Pop-up */}
                      <td className="p-3.5 text-center">
                        {manageable ? (
                          <button
                            onClick={() => handleOpenManageModal(u)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-800 border border-brand-200 hover:border-brand-400 rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5 text-brand-700" />
                            <span>Kelola & Update Akun</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                            <Lock className="w-3 h-3" />
                            Terkunci (Super Admin)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          MODAL 1: TAMBAH AKUN BARU
          ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Tambah Akun {isSuperAdmin ? 'Pengguna Baru' : 'Dosen / Mahasiswa Baru'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isSuperAdmin ? 'Akses Super Admin: Seluruh Peran Sistem' : 'Akses BAA: Khusus Dosen dan Mahasiswa'}
                </p>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Peran Pengguna (Role) *</label>
                <select
                  value={createForm.role}
                  onChange={e => {
                    const newR = e.target.value;
                    setCreateForm({
                      ...createForm, 
                      role: newR,
                      nim: newR === 'MAHASISWA' ? generateSuggestedNim(createForm.angkatan, createForm.prodiId) : '',
                      nidn: newR === 'DOSEN' ? '110508' + Math.floor(1000 + Math.random() * 9000) : ''
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 font-bold bg-white"
                >
                  <option value="MAHASISWA">🎓 Mahasiswa (S1)</option>
                  <option value="DOSEN">👨‍🏫 Dosen Pengampu</option>
                  {isSuperAdmin && (
                    <>
                      <option value="ADMIN_AKADEMIK">🏛️ Bagian Akademik (BAA)</option>
                      <option value="SUPER_ADMIN">👑 Super Admin</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ahmad Fadillah atau Dr. H. Muhammad Ramli, S.E., M.M."
                  value={createForm.name}
                  onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Resmi *</label>
                  <input
                    type="email"
                    required
                    placeholder="user@stienas.ac.id"
                    value={createForm.email}
                    onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kata Sandi Awal *</label>
                  <input
                    type="text"
                    required
                    value={createForm.password}
                    onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  />
                </div>
              </div>

              {/* Khusus Mahasiswa */}
              {createForm.role === 'MAHASISWA' && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Tahun Angkatan Masuk *</label>
                      <select
                        value={createForm.angkatan}
                        onChange={e => {
                          const yr = Number(e.target.value);
                          setCreateForm({
                            ...createForm,
                            angkatan: yr,
                            nim: generateSuggestedNim(yr, createForm.prodiId)
                          });
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold"
                      >
                        {ANGKATAN_OPTIONS.map(opt => (
                          <option key={opt.tahun} value={opt.tahun}>
                            Angkatan {opt.tahun} (Semester {opt.semester})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-700">Nomor Induk Mahasiswa (NIM) *</label>
                        <button
                          type="button"
                          onClick={() => setCreateForm({ ...createForm, nim: generateSuggestedNim(createForm.angkatan, createForm.prodiId) })}
                          className="text-[10px] text-brand-700 font-bold hover:underline"
                        >
                          Saran NIM
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={createForm.nim}
                        onChange={e => setCreateForm({ ...createForm, nim: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Program Studi *</label>
                    <select
                      value={createForm.prodiId}
                      onChange={e => {
                        const newPid = e.target.value;
                        setCreateForm({ 
                          ...createForm, 
                          prodiId: newPid,
                          nim: generateSuggestedNim(createForm.angkatan, newPid)
                        });
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                    >
                      {prodis.map(p => (
                        <option key={p.id} value={p.id}>{p.namaProdi} (Kode: {p.kodeProdi})</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Khusus Dosen */}
              {createForm.role === 'DOSEN' && (
                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">NIDN Dosen *</label>
                      <input
                        type="text"
                        required
                        placeholder="1105087501"
                        value={createForm.nidn}
                        onChange={e => setCreateForm({ ...createForm, nidn: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Program Studi Homebase</label>
                      <select
                        value={createForm.prodiId}
                        onChange={e => setCreateForm({ ...createForm, prodiId: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                      >
                        {prodis.map(p => (
                          <option key={p.id} value={p.id}>{p.namaProdi}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor WhatsApp / HP (Opsional)</label>
                <input
                  type="text"
                  placeholder="0812xxxxxxxx"
                  value={createForm.phone}
                  onChange={e => setCreateForm({ ...createForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-800 text-white rounded-xl font-bold hover:bg-brand-900 shadow"
                >
                  Simpan & Buat Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: SATU POP-UP TERPADU (KELOLA, UPDATE DATA, STATUS & RESET SANDI)
          ========================================================================= */}
      {showManageModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 max-h-[92vh] overflow-y-auto">
            
            {/* Header Pop-up */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <img 
                  src={selectedUser.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name || 'User')}&background=1e3a8a&color=fff`} 
                  alt={selectedUser.name}
                  className="w-12 h-12 rounded-2xl border-2 border-brand-200 object-cover shadow-sm"
                />
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    Kelola & Update Akun
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500 font-mono">{selectedUser.email}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] border ${
                      selectedUser.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                      selectedUser.role === 'ADMIN_AKADEMIK' ? 'bg-indigo-100 text-indigo-800 border-indigo-300' :
                      selectedUser.role === 'DOSEN' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                      'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}>
                      {selectedUser.role === 'ADMIN_AKADEMIK' ? 'ADMIN BAA' : selectedUser.role}
                    </span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => { setShowManageModal(false); setSelectedUser(null); }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManageSubmit} className="space-y-4 text-xs">
              
              {/* SECTION 1: PROFIL & IDENTITAS */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-brand-700" />
                  <span>Identitas & Profil Akun</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar *</label>
                  <input
                    type="text"
                    required
                    value={manageForm.name}
                    onChange={e => setManageForm({ ...manageForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email Resmi *</label>
                    <input
                      type="email"
                      required
                      value={manageForm.email}
                      onChange={e => setManageForm({ ...manageForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Peran Akun (Role) *</label>
                    <select
                      value={manageForm.role}
                      onChange={e => {
                        const newR = e.target.value;
                        setManageForm({
                          ...manageForm,
                          role: newR,
                          nim: newR === 'MAHASISWA' ? (manageForm.nim || generateSuggestedNim(manageForm.angkatan, manageForm.prodiId)) : '',
                          nidn: newR === 'DOSEN' ? (manageForm.nidn || '110508' + Math.floor(1000 + Math.random() * 9000)) : ''
                        });
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold"
                    >
                      <option value="MAHASISWA">🎓 Mahasiswa (S1)</option>
                      <option value="DOSEN">👨‍🏫 Dosen Pengampu</option>
                      {isSuperAdmin && (
                        <>
                          <option value="ADMIN_AKADEMIK">🏛️ Bagian Akademik (BAA)</option>
                          <option value="SUPER_ADMIN">👑 Super Admin</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="0812xxxxxxxx"
                    value={manageForm.phone}
                    onChange={e => setManageForm({ ...manageForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  />
                </div>
              </div>

              {/* SECTION 2: DETAIL KHUSUS MAHASISWA ATAU DOSEN */}
              {manageForm.role === 'MAHASISWA' && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                  <div className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-emerald-700" />
                    <span>Data Akademik Mahasiswa</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Tahun Angkatan Masuk *</label>
                      <select
                        value={manageForm.angkatan}
                        onChange={e => {
                          const yr = Number(e.target.value);
                          setManageForm({
                            ...manageForm,
                            angkatan: yr,
                            nim: generateSuggestedNim(yr, manageForm.prodiId)
                          });
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold"
                      >
                        {ANGKATAN_OPTIONS.map(opt => (
                          <option key={opt.tahun} value={opt.tahun}>
                            Angkatan {opt.tahun} (Semester {opt.semester})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-700">Nomor Induk Mahasiswa (NIM) *</label>
                        <button
                          type="button"
                          onClick={() => setManageForm({ ...manageForm, nim: generateSuggestedNim(manageForm.angkatan, manageForm.prodiId) })}
                          className="text-[10px] text-emerald-800 font-bold hover:underline"
                        >
                          Saran NIM
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={manageForm.nim}
                        onChange={e => setManageForm({ ...manageForm, nim: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold bg-white"
                      />
                    </div>
                  </div>

                  {manageForm.nim && (
                    <div className="text-[11px] font-semibold text-emerald-900 bg-white p-2.5 rounded-xl border border-emerald-200 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{calculateAcademicStanding(manageForm.nim, manageForm.angkatan).infoLengkap}</span>
                    </div>
                  )}

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Program Studi *</label>
                    <select
                      value={manageForm.prodiId}
                      onChange={e => setManageForm({ ...manageForm, prodiId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                    >
                      {prodis.map(p => (
                        <option key={p.id} value={p.id}>{p.namaProdi} (Kode: {p.kodeProdi})</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {manageForm.role === 'DOSEN' && (
                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-3">
                  <div className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-700" />
                    <span>Data Pengampu Dosen</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">NIDN Dosen *</label>
                      <input
                        type="text"
                        required
                        value={manageForm.nidn}
                        onChange={e => setManageForm({ ...manageForm, nidn: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Program Studi Homebase</label>
                      <select
                        value={manageForm.prodiId}
                        onChange={e => setManageForm({ ...manageForm, prodiId: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                      >
                        {prodis.map(p => (
                          <option key={p.id} value={p.id}>{p.namaProdi}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 3: STATUS KEAKTIFAN AKUN (TOGGLE STATUS) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <label className="block font-bold text-slate-800 text-xs">
                  Status Keaktifan Akun
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setManageForm({ ...manageForm, isActive: true })}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      manageForm.isActive 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-400 ring-2 ring-emerald-200' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Akun Aktif (Bisa Login)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setManageForm({ ...manageForm, isActive: false })}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      !manageForm.isActive 
                        ? 'bg-rose-50 text-rose-800 border-rose-400 ring-2 ring-rose-200' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <UserX className="w-3.5 h-3.5 text-rose-600" />
                    <span>Non-Aktif / Dibekukan</span>
                  </button>
                </div>
              </div>

              {/* SECTION 4: RESET / GANTI KATA SANDI (TERINTEGRASI) */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-2.5">
                <div className="flex justify-between items-center">
                  <div className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-indigo-700" />
                    <span>Atur Ulang / Reset Kata Sandi</span>
                  </div>
                  <span className="text-[10px] text-indigo-600 italic">
                    Kosongkan jika tidak ingin mengubah sandi
                  </span>
                </div>

                <div className="relative">
                  <input
                    type={showPasswordText ? "text" : "password"}
                    placeholder="Ketik kata sandi baru di sini..."
                    value={manageForm.newPassword}
                    onChange={e => setManageForm({ ...manageForm, newPassword: e.target.value })}
                    className="w-full pl-3 pr-10 py-2 border border-indigo-200 rounded-xl font-mono text-xs bg-white outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Tombol Shortcut Sandi */}
                <div className="flex flex-wrap gap-2 items-center pt-1">
                  <button
                    type="button"
                    onClick={() => setManageForm({ ...manageForm, newPassword: 'stienas123' })}
                    className="text-[10px] text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 hover:bg-indigo-50 font-semibold"
                  >
                    ⚡ Default: stienas123
                  </button>
                  <button
                    type="button"
                    onClick={() => setManageForm({ ...manageForm, newPassword: 'mhs' + Math.floor(1000 + Math.random() * 9000) })}
                    className="text-[10px] text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 font-semibold"
                  >
                    🎲 Sandi Acak
                  </button>
                  {manageForm.newPassword && (
                    <button
                      type="button"
                      onClick={() => setManageForm({ ...manageForm, newPassword: '' })}
                      className="text-[10px] text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200 hover:bg-rose-100 font-semibold"
                    >
                      Batal Ganti Sandi
                    </button>
                  )}
                </div>
              </div>

              {/* SECTION 5: KONFIRMASI HAPUS AKUN (JIKA DIKLIK) */}
              {showDeleteConfirm && (
                <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl space-y-2.5 animate-fadeIn">
                  <div className="flex items-start gap-2.5 text-rose-900">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-extrabold text-xs">Konfirmasi Hapus Akun Permanen!</div>
                      <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                        Apakah Anda yakin ingin menghapus akun <strong>{selectedUser.name}</strong> ({selectedUser.email})? Tindakan ini tidak dapat dibatalkan.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 text-slate-600 bg-white border border-slate-300 rounded-xl font-semibold text-xs hover:bg-slate-50"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDelete}
                      className="px-4 py-1.5 bg-rose-600 text-white rounded-xl font-bold text-xs hover:bg-rose-700 shadow-sm"
                    >
                      Ya, Hapus Akun Ini
                    </button>
                  </div>
                </div>
              )}

              {/* MODAL FOOTER */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-slate-100">
                
                {/* Tombol Hapus Akun (Kiri) */}
                <div>
                  {!showDeleteConfirm && (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-2 rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5 font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Akun Ini</span>
                    </button>
                  )}
                </div>

                {/* Tombol Batal & Simpan Seluruh Perubahan (Kanan) */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => { setShowManageModal(false); setSelectedUser(null); }}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-brand-800 text-white rounded-xl font-bold hover:bg-brand-900 shadow transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Menyimpan...' : 'Simpan Seluruh Perubahan'}</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
