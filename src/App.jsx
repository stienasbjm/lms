import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import DashboardPage from './pages/DashboardPage';
import ClassListPage from './pages/ClassListPage';
import ClassDetailPage from './pages/ClassDetailPage';
import GradebookPage from './pages/GradebookPage';
import MasterDataPage from './pages/MasterDataPage';
import UserManagementPage from './pages/UserManagementPage';
import BatchImportPage from './pages/BatchImportPage';
import LecturerActivityPage from './pages/LecturerActivityPage';
import AuditLogPage from './pages/AuditLogPage';
import FirebaseIntegrationPage from './pages/FirebaseIntegrationPage';

import { LayoutDashboard, BookOpen, Award, Menu as MenuIcon } from 'lucide-react';

function MainApp() {
  const { user, isSuperAdmin, isBaa, isAdmin } = useAuth();
  const [unauthView, setUnauthView] = useState('landing'); // 'landing' | 'login'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Jika belum login: tampilkan Landing Page atau Login Page
  if (!user) {
    if (unauthView === 'login') {
      return <LoginPage onBackToLanding={() => setUnauthView('landing')} />;
    }
    return <LandingPage onGoToLogin={() => setUnauthView('login')} />;
  }

  const handleNavigate = (tab, params = {}) => {
    setActiveTab(tab);
    if (params.selectedClassId) {
      setSelectedClassId(params.selectedClassId);
    } else {
      setSelectedClassId(null);
    }
    setIsSidebarOpen(false);
  };

  const renderContent = () => {
    if (activeTab === 'classes') {
      if (selectedClassId) {
        return (
          <ClassDetailPage 
            classId={selectedClassId} 
            onBack={() => setSelectedClassId(null)} 
          />
        );
      }
      return (
        <ClassListPage 
          onSelectClass={(classId) => setSelectedClassId(classId)} 
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;
      case 'gradebook':
        return <GradebookPage />;
      case 'master-data':
        return (isAdmin || isBaa || isSuperAdmin) ? <MasterDataPage /> : <DashboardPage onNavigate={handleNavigate} />;
      case 'users':
        return (isAdmin || isBaa || isSuperAdmin) ? <UserManagementPage /> : <DashboardPage onNavigate={handleNavigate} />;
      case 'batch-import':
        return isSuperAdmin ? <BatchImportPage onDone={() => handleNavigate('master-data')} /> : <DashboardPage onNavigate={handleNavigate} />;
      case 'lecturer-activity':
        return (isAdmin || isBaa || isSuperAdmin) ? <LecturerActivityPage /> : <DashboardPage onNavigate={handleNavigate} />;
      case 'audit-logs':
        return isSuperAdmin ? <AuditLogPage /> : <DashboardPage onNavigate={handleNavigate} />;
      case 'firebase-integration':
        return isSuperAdmin ? <FirebaseIntegrationPage /> : <DashboardPage onNavigate={handleNavigate} />;
      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">
      <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar 
          activeTab={activeTab} 
          onSelectTab={(tab) => handleNavigate(tab)} 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <main key={user?.uid} className="flex-1 p-3.5 sm:p-6 md:p-8 pb-24 lg:pb-8 max-w-full overflow-x-hidden min-w-0">
          {renderContent()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (App-like thumb access for smartphones) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg flex items-center justify-around py-1.5 px-2">
        <button
          onClick={() => handleNavigate('dashboard')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'dashboard' ? 'text-brand-800 font-bold scale-105' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Dasbor</span>
        </button>

        <button
          onClick={() => handleNavigate('classes')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'classes' ? 'text-brand-800 font-bold scale-105' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Kelas</span>
        </button>

        <button
          onClick={() => handleNavigate('gradebook')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'gradebook' ? 'text-brand-800 font-bold scale-105' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Nilai</span>
        </button>

        <button
          onClick={() => setIsSidebarOpen(true)}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
            isSidebarOpen ? 'text-brand-800 font-bold scale-105' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <MenuIcon className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Menu</span>
        </button>
      </nav>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("LMS Uncaught Error caught by ErrorBoundary:", error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('STIE_LMS_ACTIVE_USER');
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 border border-slate-200 shadow-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center text-xl font-bold">
              ⚠️
            </div>
            <h2 className="text-lg font-bold text-slate-900">Terjadi Kendala Memuat Tampilan</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Sistem mendeteksi adanya galat rendering pada komponen tampilan. Data akademik dan akun Anda tetap aman.
            </p>
            {this.state.error?.message && (
              <div className="p-2.5 bg-slate-100 rounded-xl text-[11px] font-mono text-slate-700 text-left overflow-x-auto border border-slate-200">
                {this.state.error.message}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 py-2 px-4 bg-brand-800 hover:bg-brand-900 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                Muat Ulang Halaman
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200"
              >
                Reset & Keluar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}
