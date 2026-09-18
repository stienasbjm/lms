import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LogOut, 
  ShieldCheck, 
  GraduationCap, 
  UserCheck, 
  Database, 
  Settings, 
  Bell, 
  Sparkles,
  Menu
} from 'lucide-react';
import FirebaseSettingsModal from './FirebaseSettingsModal';
import ProfileModal from './ProfileModal';

export default function Header({ onToggleSidebar }) {
  const { user, logout, isFirebaseLive } = useAuth();
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-0.5 rounded-full border border-purple-200">Super Admin</span>;
      case 'ADMIN_AKADEMIK':
        return <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2 py-0.5 rounded-full border border-indigo-200">Admin BAA</span>;
      case 'DOSEN':
        return <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full border border-blue-200">Dosen Pengampu</span>;
      case 'MAHASISWA':
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-200">Mahasiswa</span>;
      default:
        return null;
    }
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo, Hamburger & Kampus Branding */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Hamburger Button for Mobile / Tablet Drawer */}
              <button
                type="button"
                onClick={onToggleSidebar}
                className="lg:hidden p-2 -ml-1 rounded-xl text-slate-700 hover:text-brand-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
                aria-label="Buka Menu Navigasi"
              >
                <Menu className="w-5 h-5" />
              </button>

              <img 
                src={`${import.meta.env.BASE_URL}logo-stienas.png`} 
                alt="Logo STIE Nasional Banjarmasin" 
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-sm hover:scale-105 transition-transform" 
              />
              <div>
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-1 sm:gap-1.5">
                  LMS STIE NASIONAL
                  <span className="hidden sm:inline-block text-[10px] bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded border border-brand-200 uppercase font-mono">Banjarmasin</span>
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium hidden sm:block">Kurikulum Berbasis Luaran (Outcome-Based Education / OBE)</p>
              </div>
            </div>

            {/* Actions & Profile */}
            <div className="flex items-center space-x-3">
              {/* Firebase Status Badge */}
              <button 
                onClick={() => setShowConfigModal(true)}
                title="Klik untuk konfigurasi Firebase Backend"
                className={`flex items-center space-x-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                  isFirebaseLive 
                    ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100' 
                    : 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline font-medium">
                  {isFirebaseLive ? 'Firebase BaaS: Live' : 'Firebase: Demo/Config'}
                </span>
              </button>

              {/* User Profile */}
              {user && (
                <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                  <button 
                    onClick={() => setShowProfileModal(true)}
                    title="Klik untuk melihat dan mengedit profil Anda"
                    className="flex items-center space-x-2.5 p-1 rounded-xl hover:bg-slate-100 transition-colors text-left group"
                  >
                    <img 
                      src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=1e3a8a&color=fff`} 
                      alt={user.name} 
                      className="w-9 h-9 rounded-full object-cover border border-slate-300 group-hover:border-brand-500 transition-colors"
                    />
                    <div className="hidden md:block text-left">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 group-hover:text-brand-900">
                        {user.name}
                      </div>
                      <div>{getRoleBadge(user.role)}</div>
                    </div>
                  </button>
                  <button 
                    onClick={logout}
                    title="Keluar (Logout)"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Firebase Modal */}
      {showConfigModal && (
        <FirebaseSettingsModal onClose={() => setShowConfigModal(false)} />
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal onClose={() => setShowProfileModal(false)} />
      )}
    </>
  );
}
