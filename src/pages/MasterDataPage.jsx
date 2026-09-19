import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  getFakultas, 
  getProdi, 
  getTahunAkademik, 
  setTahunAkademikActive, 
  addTahunAkademik,
  toggleTahunAkademikStatus,
  deleteTahunAkademik,
  getMataKuliah, 
  addMataKuliah,
  updateMataKuliah,
  deleteMataKuliah,
  getUsers,
  subscribeToDataSync
} from '../firebase/firestoreService';
import { showConfirmDialog, showSuccessToast, showErrorAlert } from '../utils/alert';
import { 
  Database, 
  Building2, 
  Calendar, 
  BookOpen, 
  Plus, 
  Check, 
  CheckCircle2, 
  AlertCircle,
  Lock,
  Unlock,
  Trash2,
  Edit2,
  Sparkles
} from 'lucide-react';

export default function MasterDataPage() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('mk'); // 'mk' | 'ta' | 'prodi'
  const [prodis, setProdis] = useState([]);
  const [tas, setTas] = useState([]);
  const [mks, setMks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter Mata Kuliah Kurikulum
  const [mkSemesterFilter, setMkSemesterFilter] = useState('ALL');
  const [mkProdiFilter, setMkProdiFilter] = useState('ALL');

  // Form Tambah Mata Kuliah
  const [showAddMkModal, setShowAddMkModal] = useState(false);
  const [newMk, setNewMk] = useState({
    kodeMk: '',
    namaMk: '',
    sks: 3,
    semesterDefault: 1,
    prodiId: '',
    dosenId: ''
  });

  // Form Edit Mata Kuliah
  const [editingMk, setEditingMk] = useState(null);

  // Form Buka Semester Baru (Tahun Akademik)
  const [showAddTaModal, setShowAddTaModal] = useState(false);
  const [newTa, setNewTa] = useState({
    kodeTa: '',
    namaTa: '',
    semesterTipe: 'GANJIL',
    isActive: true
  });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [p, t, m, u] = await Promise.all([
        getProdi(),
        getTahunAkademik(),
        getMataKuliah(),
        getUsers()
      ]);
      setProdis(p);
      setTas(t);
      setMks(m);
      setUsers(u);
      if (p.length > 0 && !newMk.prodiId) {
        setNewMk(prev => ({ ...prev, prodiId: p[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    const unsubscribe = subscribeToDataSync(() => {
      loadAll();
    });
    return () => unsubscribe();
  }, [user]);

  const handleToggleTaStatus = async (taId) => {
    try {
      const updated = await toggleTahunAkademikStatus(taId, user);
      setTas(updated);
      showSuccessToast("Status semester berhasil diperbarui!");
    } catch (err) {
      showErrorAlert("Gagal Mengubah Status Semester", err.message);
    }
  };

  const handleDeleteTa = async (taId, taName) => {
    const confirmed = await showConfirmDialog({
      title: 'Hapus Semester?',
      text: `Hapus semester "${taName}"? Seluruh kelas perkuliahan terkait akan tetap tersimpan di arsip.`,
      confirmButtonText: 'Ya, Hapus Semester',
      confirmButtonColor: '#dc2626'
    });
    if (!confirmed) return;

    try {
      setTas(prev => prev.filter(t => String(t.id) !== String(taId)));
      const updated = await deleteTahunAkademik(taId, user);
      setTas(updated);
      showSuccessToast(`Semester "${taName}" berhasil dihapus.`);
      await loadAll();
    } catch (err) {
      await loadAll();
      showErrorAlert("Gagal Menghapus Semester", err.message);
    }
  };

  const handleCreateMk = async (e) => {
    e.preventDefault();
    if (!newMk.kodeMk || !newMk.namaMk) {
      showErrorAlert("Data Tidak Lengkap", "Harap lengkapi Kode MK dan Nama Mata Kuliah.");
      return;
    }

    try {
      await addMataKuliah(newMk, user);
      setShowAddMkModal(false);
      setNewMk({
        kodeMk: '',
        namaMk: '',
        sks: 3,
        semesterDefault: 1,
        prodiId: prodis[0]?.id || '',
        dosenId: ''
      });
      await loadAll();
      showSuccessToast("Mata kuliah baru berhasil ditambahkan!");
    } catch (err) {
      showErrorAlert("Gagal Menambah Mata Kuliah", err.message);
    }
  };

  const handleDeleteMk = async (mkId, mkName) => {
    const confirmed = await showConfirmDialog({
      title: 'Hapus Mata Kuliah?',
      text: `Hapus kurikulum mata kuliah "${mkName}" dari master kurikulum?`,
      confirmButtonText: 'Ya, Hapus MK',
      confirmButtonColor: '#dc2626'
    });
    if (!confirmed) return;

    try {
      setMks(prev => prev.filter(m => String(m.id) !== String(mkId)));
      await deleteMataKuliah(mkId, user);
      showSuccessToast(`Mata kuliah "${mkName}" berhasil dihapus.`);
      await loadAll();
    } catch (err) {
      await loadAll();
      showErrorAlert("Gagal Menghapus Mata Kuliah", err.message);
    }
  };

  const handleUpdateMkSubmit = async (e) => {
    e.preventDefault();
    if (!editingMk || !editingMk.kodeMk || !editingMk.namaMk) {
      showErrorAlert("Data Tidak Lengkap", "Harap lengkapi Kode MK dan Nama Mata Kuliah.");
      return;
    }
    try {
      await updateMataKuliah(editingMk.id, editingMk, user);
      setEditingMk(null);
      await loadAll();
      showSuccessToast("Kurikulum mata kuliah berhasil diperbarui!");
    } catch (err) {
      showErrorAlert("Gagal Memperbarui Mata Kuliah", err.message);
    }
  };

  const handleCreateTaSubmit = async (e) => {
    e.preventDefault();
    if (!newTa.kodeTa || !newTa.namaTa) {
      showErrorAlert("Data Tidak Lengkap", "Harap lengkapi Kode TA dan Nama Tahun Akademik.");
      return;
    }
    try {
      await addTahunAkademik(newTa, user);
      setShowAddTaModal(false);
      setNewTa({
        kodeTa: '',
        namaTa: '',
        semesterTipe: 'GANJIL',
        isActive: true
      });
      await loadAll();
      showSuccessToast("Semester baru berhasil dibuka!");
    } catch (err) {
      showErrorAlert("Gagal Membuka Semester Baru", err.message);
    }
  };

  const dosenList = users.filter(u => u.role === 'DOSEN');

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-brand-700" />
            Master Data Akademik
          </h2>
          <p className="text-xs text-slate-500">
            Pengelolaan Kurikulum Mata Kuliah, Program Studi, dan Tahun Akademik Aktif (FR-02)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'mk' && isAdmin && (
            <button
              onClick={() => setShowAddMkModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-800 text-white rounded-xl text-xs font-bold shadow hover:bg-brand-900 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tambah Mata Kuliah
            </button>
          )}

          {activeTab === 'ta' && isAdmin && (
            <button
              onClick={() => setShowAddTaModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-800 text-white rounded-xl text-xs font-bold shadow hover:bg-brand-900 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Buka Semester Baru (BAA)
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-3 sm:gap-4 text-xs font-semibold overflow-x-auto whitespace-nowrap pb-0.5">
        <button
          onClick={() => setActiveTab('mk')}
          className={`pb-2.5 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'mk' 
              ? 'border-brand-800 text-brand-800' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Mata Kuliah & Kurikulum ({mks.length})
        </button>

        <button
          onClick={() => setActiveTab('ta')}
          className={`pb-2.5 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'ta' 
              ? 'border-brand-800 text-brand-800' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Tahun Akademik ({tas.length})
        </button>

        <button
          onClick={() => setActiveTab('prodi')}
          className={`pb-2.5 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'prodi' 
              ? 'border-brand-800 text-brand-800' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Fakultas & Prodi ({prodis.length})
        </button>
      </div>

      {/* TAB 1: MATA KULIAH */}
      {activeTab === 'mk' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm space-y-0">
          <div className="p-3.5 bg-brand-50 border-b border-brand-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <span className="font-bold text-brand-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              Kurikulum OBE (Outcome-Based Education) • Standar Akreditasi LAMEMBA 2026/2027
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={mkSemesterFilter}
                onChange={e => setMkSemesterFilter(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 outline-none"
              >
                <option value="ALL">Semua Semester ({mks.length})</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                  <option key={sem} value={sem}>Semester {sem} ({mks.filter(m => Number(m.semesterDefault) === sem).length} MK)</option>
                ))}
              </select>

              <select
                value={mkProdiFilter}
                onChange={e => setMkProdiFilter(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 outline-none"
              >
                <option value="ALL">Semua Prodi</option>
                {prodis.map(p => (
                  <option key={p.id} value={p.id}>{p.namaProdi}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Kode MK</th>
                  <th className="p-3.5">Nama Mata Kuliah</th>
                  <th className="p-3.5">SKS</th>
                  <th className="p-3.5">Semester Kurikulum</th>
                  <th className="p-3.5">Program Studi</th>
                  <th className="p-3.5">Standar Kurikulum OBE</th>
                  <th className="p-3.5">Dosen Penanggung Jawab</th>
                  {isAdmin && <th className="p-3.5 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mks.filter(m => {
                  if (mkSemesterFilter !== 'ALL' && String(m.semesterDefault) !== String(mkSemesterFilter)) return false;
                  if (mkProdiFilter !== 'ALL' && m.prodiId !== mkProdiFilter) return false;
                  return true;
                }).map(mk => {
                  const prodi = prodis.find(p => p.id === mk.prodiId);
                  const dosen = users.find(u => u.uid === mk.dosenId);
                  const cplCount = (mk.cpl || []).length;
                  const cpmkCount = (mk.cpmk || []).length;

                  return (
                    <tr key={mk.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-brand-900">{mk.kodeMk}</td>
                      <td className="p-3.5 font-semibold text-slate-800">
                        {mk.namaMk}
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                          16 Sesi RPS Otentik
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600 font-semibold">{mk.sks} SKS</td>
                      <td className="p-3.5 text-slate-600">Semester {mk.semesterDefault}</td>
                      <td className="p-3.5 text-slate-600">{prodi ? prodi.namaProdi : '-'}</td>
                      <td className="p-3.5">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 w-fit">
                            Kurikulum OBE
                          </span>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {cplCount > 0 ? `${cplCount} CPL Terpetakan` : 'CPL-1, CPL-2, CPL-3'} • {cpmkCount > 0 ? `${cpmkCount} CPMK` : '3 CPMK'}
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {dosen ? (
                          <span className="text-slate-900 font-medium">{dosen.name}</span>
                        ) : (
                          <span className="text-slate-400 italic">Belum ditentukan</span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingMk(mk)}
                              title="Edit Mata Kuliah"
                              className="p-1.5 text-slate-500 hover:text-brand-800 hover:bg-brand-50 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteMk(mk.id, mk.namaMk)}
                              title="Hapus Mata Kuliah"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TAHUN AKADEMIK */}
      {activeTab === 'ta' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-brand-700" />
              <span>
                <strong>Manajemen Status Semester BAA:</strong> Bagian Akademik dapat membuka semester berjalan dan menutup semester secara manual kapan saja.
              </span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">
              Total: {tas.length} Semester
            </span>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Kode TA</th>
                <th className="p-3.5">Nama Semester / Tahun Akademik</th>
                <th className="p-3.5">Tipe Semester</th>
                <th className="p-3.5">Status BAA</th>
                <th className="p-3.5 text-right">Aksi BAA (Buka / Tutup)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tas.map(ta => (
                <tr key={ta.id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-mono font-bold text-slate-800">{ta.kodeTa}</td>
                  <td className="p-3.5 font-semibold text-slate-900">{ta.namaTa}</td>
                  <td className="p-3.5 text-slate-600">{ta.semesterTipe}</td>
                  <td className="p-3.5">
                    {ta.isActive ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                        DIBUKA (Aktif)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        <Lock className="w-3 h-3 text-slate-400" />
                        DITUTUP
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-right">
                    {isAdmin && (
                      <div className="flex items-center justify-end gap-2">
                        {ta.isActive ? (
                          <button
                            onClick={() => handleToggleTaStatus(ta.id)}
                            title="Tutup semester ini (menjadikan status non-aktif/ditutup)"
                            className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg border border-amber-300 transition-colors shadow-sm"
                          >
                            <Lock className="w-3 h-3 text-amber-700" />
                            Tutup Semester
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleTaStatus(ta.id)}
                            title="Buka semester ini (menjadikan semester aktif berjalan)"
                            className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-300 transition-colors shadow-sm"
                          >
                            <Unlock className="w-3 h-3 text-emerald-600" />
                            Buka Semester
                          </button>
                        )}

                        {!ta.isActive && (
                          <button
                            onClick={() => handleDeleteTa(ta.id, ta.namaTa)}
                            title="Hapus semester dari daftar"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: PRODI */}
      {activeTab === 'prodi' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prodis.map(prodi => (
            <div key={prodi.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-800 border border-brand-200 font-mono">
                    Kode: {prodi.kodeProdi}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 mt-2">{prodi.namaProdi}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Jenjang Pendidikan: {prodi.jenjang}</p>
                </div>
                <Building2 className="w-8 h-8 text-slate-300" />
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                STIE Nasional Banjarmasin
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah Mata Kuliah */}
      {showAddMkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 mb-1">Tambah Mata Kuliah Baru</h3>
            <p className="text-xs text-slate-500 mb-4">Masukkan data kurikulum mata kuliah STIE Nasional</p>

            <form onSubmit={handleCreateMk} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Kode Mata Kuliah</label>
                <input
                  type="text"
                  required
                  placeholder="contoh: MNJ302"
                  value={newMk.kodeMk}
                  onChange={e => setNewMk({...newMk, kodeMk: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nama Mata Kuliah</label>
                <input
                  type="text"
                  required
                  placeholder="contoh: Manajemen Strategik"
                  value={newMk.namaMk}
                  onChange={e => setNewMk({...newMk, namaMk: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Bobot SKS</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={newMk.sks}
                    onChange={e => setNewMk({...newMk, sks: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Semester Default</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={newMk.semesterDefault}
                    onChange={e => setNewMk({...newMk, semesterDefault: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Program Studi</label>
                <select
                  value={newMk.prodiId}
                  onChange={e => setNewMk({...newMk, prodiId: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  {prodis.map(p => (
                    <option key={p.id} value={p.id}>{p.namaProdi}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Dosen Pengampu Default</label>
                <select
                  value={newMk.dosenId}
                  onChange={e => setNewMk({...newMk, dosenId: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="">-- Pilih Dosen Pengampu --</option>
                  {dosenList.map(d => (
                    <option key={d.uid} value={d.uid}>{d.name} ({d.nidn ? `NUPTK/NIP: ${d.nidn}` : 'Dosen'})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddMkModal(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-800 text-white rounded-lg font-bold hover:bg-brand-900"
                >
                  Simpan Mata Kuliah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH / BUKA SEMESTER BARU (TA) */}
      {showAddTaModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                <Calendar className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Buka Semester Baru (BAA)</h3>
                <p className="text-xs text-slate-500">
                  Manajemen Periode Tahun Akademik Perkuliahan
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateTaSubmit} className="space-y-3 text-xs mt-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Kode Tahun Akademik</label>
                <input
                  type="text"
                  required
                  placeholder="contoh: 20262 atau 20271"
                  value={newTa.kodeTa}
                  onChange={e => setNewTa({...newTa, kodeTa: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nama Semester / Tahun Akademik</label>
                <input
                  type="text"
                  required
                  placeholder="contoh: 2026/2027 Genap"
                  value={newTa.namaTa}
                  onChange={e => setNewTa({...newTa, namaTa: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tipe Semester</label>
                <select
                  value={newTa.semesterTipe}
                  onChange={e => setNewTa({...newTa, semesterTipe: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="GANJIL">Semester Ganjil</option>
                  <option value="GENAP">Semester Genap</option>
                  <option value="PENDEK">Semester Antara / Pendek</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={newTa.isActive}
                    onChange={e => setNewTa({...newTa, isActive: e.target.checked})}
                    className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                  />
                  <span className="font-semibold">Jadikan Semester Aktif Sekarang</span>
                </label>
                <p className="text-[11px] text-slate-400 ml-6 mt-0.5">
                  Jika dicentang, semester ini akan langsung menjadi acuan aktif perkuliahan dan KRS/KHS.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddTaModal(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-800 hover:bg-brand-900 text-white rounded-lg font-bold transition-colors shadow-sm"
                >
                  Buka Semester Ini
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Mata Kuliah */}
      {editingMk && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 mb-1">Edit Kurikulum Mata Kuliah</h3>
            <p className="text-xs text-slate-500 mb-4">Perbarui data kurikulum dan penugasan dosen pengampu</p>

            <form onSubmit={handleUpdateMkSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Kode Mata Kuliah</label>
                <input
                  type="text"
                  required
                  value={editingMk.kodeMk || ''}
                  onChange={e => setEditingMk({...editingMk, kodeMk: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nama Mata Kuliah</label>
                <input
                  type="text"
                  required
                  value={editingMk.namaMk || ''}
                  onChange={e => setEditingMk({...editingMk, namaMk: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Bobot SKS</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={editingMk.sks || 3}
                    onChange={e => setEditingMk({...editingMk, sks: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Semester Default</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={editingMk.semesterDefault || 1}
                    onChange={e => setEditingMk({...editingMk, semesterDefault: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Program Studi</label>
                <select
                  value={editingMk.prodiId || ''}
                  onChange={e => setEditingMk({...editingMk, prodiId: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  {prodis.map(p => (
                    <option key={p.id} value={p.id}>{p.namaProdi}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Dosen Penanggung Jawab</label>
                <select
                  value={editingMk.dosenId || ''}
                  onChange={e => setEditingMk({...editingMk, dosenId: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="">Belum ditentukan</option>
                  {dosenList.map(d => (
                    <option key={d.uid} value={d.uid}>
                      {d.name} {d.nidn ? `(NUPTK/NIP: ${d.nidn})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 mt-4">
                <button
                  type="button"
                  onClick={() => setEditingMk(null)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-800 hover:bg-brand-900 text-white rounded-lg font-bold transition-colors shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
