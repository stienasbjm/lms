import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  Award, 
  Database, 
  Users, 
  FileUp, 
  TrendingUp, 
  FileText,
  CalendarCheck,
  Flame,
  X
} from 'lucide-react';

export default function Sidebar({ activeTab, onSelectTab, isOpen = false, onClose }) {
  const { user, isAdmin, isBaa, isSuperAdmin, isDosen, isMahasiswa } = useAuth();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dasbor Utama',
      icon: LayoutDashboard,
      visible: true,
      badge: null
    },
    {
      id: 'classes',
      label: isMahasiswa ? 'Mata Kuliah Saya' : 'Kelas Perkuliahan',
      icon: BookOpen,
      visible: true,
      badge: '16 Pertemuan'
    },
    {
      id: 'gradebook',
      label: isMahasiswa ? 'Kartu Hasil Studi' : 'Buku Nilai (Gradebook)',
      icon: Award,
      visible: true,
      badge: null
    },
    // Master Akademik (Admin & BAA)
    {
      id: 'master-data',
      label: 'Master Akademik',
      icon: Database,
      visible: isAdmin || isBaa,
      badge: isSuperAdmin ? 'Admin' : 'BAA'
    },
    // Master Akun / Manajemen Pengguna (BAA dan Super Admin)
    {
      id: 'users',
      label: isSuperAdmin ? 'Master Seluruh Akun' : 'Master Akun',
      icon: Users,
      visible: isAdmin || isBaa,
      badge: isSuperAdmin ? 'Admin' : 'BAA'
    },
    {
      id: 'batch-import',
      label: 'Impor Massal JSON',
      icon: FileUp,
      visible: isSuperAdmin,
      badge: 'Batch'
    },
    {
      id: 'lecturer-activity',
      label: 'Skor Keaktifan Dosen',
      icon: TrendingUp,
      visible: isAdmin || isBaa,
      badge: null
    },
    {
      id: 'audit-logs',
      label: 'Audit Trail Logs',
      icon: FileText,
      visible: isSuperAdmin,
      badge: null
    },
    // Khusus Super Admin
    {
      id: 'firebase-integration',
      label: 'Integrasi Firebase',
      icon: Flame,
      visible: isSuperAdmin,
      badge: 'BaaS'
    }
  ];

  return (
    <>
      {/* Backdrop overlay untuk mobile & tablet */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 animate-in fade-in"
          aria-hidden="true"
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 p-4 flex flex-col justify-between shrink-0 shadow-2xl transition-transform duration-300 ease-in-out overflow-y-auto
        lg:static lg:w-64 lg:min-h-[calc(100vh-4rem)] lg:shadow-none lg:translate-x-0 lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="space-y-4 sm:space-y-6">
          
          {/* Header Mobile Drawer */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 lg:hidden">
            <div className="flex items-center gap-2">
              <img 
                src={`${import.meta.env.BASE_URL}logo-stienas.png`} 
                alt="Logo STIE Nasional" 
                className="w-7 h-7 object-contain" 
              />
              <span className="font-bold text-xs text-slate-900">Menu Navigasi LMS</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              aria-label="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Brief Info */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1">
              Status Akun
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-semibold text-slate-700">Terkoneksi & Aktif</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono truncate">
              {user?.nim ? `NIM: ${user.nim}` : user?.nidn ? `NIDN: ${user.nidn}` : user?.email}
            </div>
          </div>

          {/* Navigation Menu */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Menu Utama
            </div>
            <nav className="space-y-1">
              {menuItems.filter(item => item.visible).map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      if (onClose) onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive 
                        ? 'bg-brand-800 text-white shadow-md font-semibold shadow-brand-900/10' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-gold-400' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

        </div>

        {/* Info Footer STIE Nasional */}
        <div className="pt-4 border-t border-slate-200 text-center">
          <div className="text-[11px] font-bold text-slate-700">STIE NASIONAL BANJARMASIN</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Frontend: GitHub Pages CDN</div>
          <div className="text-[10px] text-slate-400">Backend: Google Cloud Firebase</div>
        </div>
      </aside>
    </>
  );
}
