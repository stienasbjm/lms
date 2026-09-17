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

function MainApp() {
  const { user, isSuperAdmin, isBaa, isAdmin } = useAuth();
  const [unauthView, setUnauthView] = useState('landing'); // 'landing' | 'login'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedClassId, setSelectedClassId] = useState(null);

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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar 
          activeTab={activeTab} 
          onSelectTab={(tab) => handleNavigate(tab)} 
        />
        <main key={user?.uid} className="flex-1 p-6 md:p-8 max-w-full overflow-x-hidden">
          {renderContent()}
        </main>
      </div>
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
