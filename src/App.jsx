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

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
