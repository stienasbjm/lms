import React from 'react';
import { ShieldAlert, Clock, LogOut, CheckCircle } from 'lucide-react';

export default function SessionTimeoutModal({ isOpen, remainingSeconds, onExtend, onLogout }) {
  if (!isOpen) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  
  // Hitung persentase mundur (dari 120 detik)
  const totalWarningSeconds = 120;
  const progressPercent = Math.min(100, Math.max(0, (remainingSeconds / totalWarningSeconds) * 100));

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 text-center relative overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-brand-600 to-rose-500" />

        {/* Pulsing Warning Icon */}
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200 shadow-inner relative">
          <Clock className="w-8 h-8 animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-lg text-slate-900 mb-1 flex items-center justify-center gap-2">
          <span>Sesi Anda Akan Berakhir</span>
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-600 leading-relaxed mb-5">
          Tidak ada aktivitas terdeteksi. Demi melindungi data akademik institusi dan privasi akun Anda dari penyalahgunaan saat perangkat ditinggalkan, sesi Anda akan ditutup otomatis.
        </p>

        {/* Countdown Box */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-5">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Waktu Tersisa Sebelum Logout Otomatis
          </div>
          <div className="font-mono text-3xl font-extrabold text-amber-600 tracking-tight">
            {formattedTime}
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-3">
            <div 
              className="bg-amber-500 h-full rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={onLogout}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>Keluar Sekarang</span>
          </button>

          <button
            type="button"
            onClick={onExtend}
            className="flex-1 py-2.5 px-4 rounded-xl bg-brand-800 hover:bg-brand-900 text-white text-xs font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 transition-all"
          >
            <CheckCircle className="w-4 h-4 text-emerald-300" />
            <span>Lanjutkan Sesi</span>
          </button>
        </div>

        {/* Footer Note */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Sistem Keamanan Inactivity Timeout • Standar Keamanan LMS STIE Nasional</span>
        </div>
      </div>
    </div>
  );
}
