import React, { useState, useEffect } from 'react';
import { calculateLecturersActivityScores, subscribeToDataSync } from '../firebase/firestoreService';
import { exportToCSV } from '../utils/csvExporter';
import { TrendingUp, Award, Download, Clock, Star, BookOpen, CheckCircle, FileCheck } from 'lucide-react';

export default function LecturerActivityPage() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load(isInitial = false) {
    if (isInitial && scores.length === 0) {
      setLoading(true);
    }
    try {
      const data = await calculateLecturersActivityScores();
      setScores(data.sort((a, b) => b.totalScore - a.totalScore));
    } catch (err) {
      console.error(err);
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    load(true);
    let debounceTimer = null;
    const unsubscribe = subscribeToDataSync(() => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        load(false);
      }, 50);
    });
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      unsubscribe();
    };
  }, []);

  const handleExportCSV = () => {
    const headers = [
      { key: 'namaDosen', label: 'Nama Dosen' },
      { key: 'nidn', label: 'NUPTK/NIP' },
      { key: 'totalKelas', label: 'Total Kelas' },
      { key: 'totalMateri', label: 'Total Materi (x2)' },
      { key: 'totalPresensi', label: 'Total Presensi (x1)' },
      { key: 'totalTugasDinilai', label: 'Tugas Dinilai (x3)' },
      { key: 'totalScore', label: 'Total Skor Keaktifan' }
    ];
    exportToCSV('Laporan_Skor_Keaktifan_Dosen_LMS', headers, scores);
  };

  if (loading && scores.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-xs text-slate-500">
        <Clock className="w-5 h-5 animate-spin mr-2 text-brand-600" />
        Menghitung akumulasi skor keaktifan dosen...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-700" />
            Laporan Skor Keaktifan Dosen (FR-08.1)
          </h2>
          <p className="text-xs text-slate-500">
            Metrik kinerja Dosen pengampu dalam pengelolaan bahan ajar, presensi, dan penilaian tugas
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow transition-colors"
        >
          <Download className="w-4 h-4" />
          Ekspor Laporan Skor
        </button>
      </div>

      {/* Formula Explanation Card */}
      <div className="p-4 bg-gradient-to-r from-brand-900 to-brand-800 rounded-2xl text-white shadow-md space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm text-gold-400">
          <Award className="w-4 h-4" />
          Rumus Indeks Aktivitas Dosen STIE Nasional
        </div>
        <p className="text-xs text-slate-200">
          Skor dihitung secara otomatis oleh sistem berdasarkan aktivitas riil pada modul perkuliahan:
        </p>
        <div className="font-mono text-xs bg-black/30 p-2.5 rounded-xl border border-white/10 inline-block">
          Skor = (Total Materi × 2) + (Total Presensi × 1) + (Total Tugas Dinilai × 3)
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Peringkat</th>
                <th className="p-3.5">Nama Dosen Pengampu</th>
                <th className="p-3.5">NUPTK/NIP</th>
                <th className="p-3.5 text-center">Kelas Aktif</th>
                <th className="p-3.5 text-center">Materi (×2)</th>
                <th className="p-3.5 text-center">Presensi (×1)</th>
                <th className="p-3.5 text-center">Tugas Dinilai (×3)</th>
                <th className="p-3.5 text-center">Total Skor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scores.map((dosen, idx) => (
                <tr key={dosen.dosenId} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${
                      idx === 0 ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                      idx === 1 ? 'bg-slate-200 text-slate-800' :
                      idx === 2 ? 'bg-amber-50 text-amber-700' :
                      'text-slate-500'
                    }`}>
                      {idx + 1}
                    </span>
                  </td>

                  <td className="p-3.5 font-bold text-slate-900">
                    {dosen.namaDosen}
                    <div className="text-[10px] text-slate-400 font-normal">{dosen.email}</div>
                  </td>

                  <td className="p-3.5 font-mono text-slate-600">{dosen.nidn}</td>
                  <td className="p-3.5 text-center font-semibold text-slate-700">{dosen.totalKelas} Kelas</td>
                  <td className="p-3.5 text-center font-mono text-blue-700 font-semibold">{dosen.totalMateri}</td>
                  <td className="p-3.5 text-center font-mono text-emerald-700 font-semibold">{dosen.totalPresensi}</td>
                  <td className="p-3.5 text-center font-mono text-purple-700 font-semibold">{dosen.totalTugasDinilai}</td>

                  <td className="p-3.5 text-center">
                    <span className="text-base font-extrabold text-brand-900 bg-brand-50 border border-brand-200 px-3 py-1 rounded-lg">
                      {dosen.totalScore} Poin
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
