import React, { useState, useEffect } from 'react';
import { getAuditLogs, subscribeToDataSync } from '../firebase/firestoreService';
import { exportToCSV } from '../utils/csvExporter';
import { FileText, Clock, Search, Shield, Download } from 'lucide-react';

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const data = await getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const unsubscribe = subscribeToDataSync(() => {
      load();
    });
    return () => unsubscribe();
  }, []);

  const handleExportCSV = () => {
    const headers = [
      { key: 'timestamp', label: 'Waktu' },
      { key: 'userName', label: 'Nama Pengguna' },
      { key: 'role', label: 'Peran' },
      { key: 'action', label: 'Tindakan' },
      { key: 'details', label: 'Detail Aktivitas' }
    ];
    exportToCSV('Audit_Logs_LMS_STIE_Nasional', headers, logs);
  };

  const filteredLogs = logs.filter(l => {
    return (l.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           (l.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           (l.details || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-xs text-slate-500">
        <Clock className="w-5 h-5 animate-spin mr-2 text-brand-600" />
        Memuat catatan riwayat audit sistem...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-700" />
            Rekam Jejak Audit Terpusat (Audit Trail Logs)
          </h2>
          <p className="text-xs text-slate-500">
            Pencatatan transparan seluruh aktivitas krusial sistem perkuliahan (FR-08.2)
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow transition-colors"
        >
          <Download className="w-4 h-4" />
          Ekspor Log Audit (CSV)
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 text-xs">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Cari tindakan, pengguna, atau detail catatan..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full outline-none text-xs"
        />
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Waktu (Timestamp)</th>
                <th className="p-3.5">Pengguna</th>
                <th className="p-3.5">Peran</th>
                <th className="p-3.5">Kode Aksi</th>
                <th className="p-3.5">Deskripsi Aktivitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('id-ID', {
                      dateStyle: 'short',
                      timeStyle: 'medium'
                    })}
                  </td>
                  <td className="p-3.5 font-bold text-slate-900">{log.userName}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                      {log.role}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono font-bold text-brand-800 text-[11px]">
                    {log.action}
                  </td>
                  <td className="p-3.5 text-slate-700">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
