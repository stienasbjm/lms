import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, loginUser, logoutUser } from '../firebase/authService';
import { isRealFirebaseConfigured } from '../firebase/config';
import { INITIAL_USERS } from '../utils/seedData';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Ambil user dari localStorage jika ada, jika tidak ada maka null (menampilkan Landing Page)
  const [user, setUser] = useState(() => {
    return getCurrentUser();
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFirebaseLive, setIsFirebaseLive] = useState(isRealFirebaseConfigured());

  const handleLogin = async (identifier, password) => {
    setLoading(true);
    setError(null);
    try {
      const loggedUser = await loginUser(identifier, password);
      setUser(loggedUser);
      return loggedUser;
    } catch (err) {
      setError(err.message || "Gagal masuk");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
  };

  const getStoredUsers = () => {
    try {
      const stored = localStorage.getItem('STIE_LMS_USERS');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn("Storage read error:", e);
    }
    return INITIAL_USERS;
  };

  // Login instan untuk 4 akun utama
  const loginAsRole = (roleType) => {
    const currentUsers = getStoredUsers();
    let target;
    if (roleType === 'ADMIN' || roleType === 'SUPER_ADMIN') {
      target = currentUsers.find(u => u.role === 'SUPER_ADMIN') || INITIAL_USERS.find(u => u.role === 'SUPER_ADMIN');
    } else if (roleType === 'AKADEMIK' || roleType === 'ADMIN_AKADEMIK') {
      target = currentUsers.find(u => u.role === 'ADMIN_AKADEMIK') || INITIAL_USERS.find(u => u.role === 'ADMIN_AKADEMIK');
    } else if (roleType === 'DOSEN') {
      target = currentUsers.find(u => u.role === 'DOSEN') || INITIAL_USERS.find(u => u.role === 'DOSEN');
    } else if (roleType === 'MAHASISWA') {
      target = currentUsers.find(u => u.role === 'MAHASISWA') || INITIAL_USERS.find(u => u.role === 'MAHASISWA');
    }
    if (target) {
      setUser(target);
      localStorage.setItem('STIE_LMS_ACTIVE_USER', JSON.stringify(target));
      return target;
    }
  };

  const setSpecificUser = (targetUser) => {
    setUser(targetUser);
    localStorage.setItem('STIE_LMS_ACTIVE_USER', JSON.stringify(targetUser));
  };

  const updateCurrentUserProfile = (updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('STIE_LMS_ACTIVE_USER', JSON.stringify(updated));
      return updated;
    });
  };

  // Listen to cross-tab/active user storage updates
  useEffect(() => {
    const handleSync = () => {
      const activeRaw = localStorage.getItem('STIE_LMS_ACTIVE_USER');
      if (activeRaw) {
        try {
          setUser(JSON.parse(activeRaw));
        } catch (e) {}
      }
    };
    window.addEventListener('storage', handleSync);
    return () => window.removeEventListener('storage', handleSync);
  }, []);

  const currentRole = (user?.role || '').toUpperCase();
  const isSuperAdmin = currentRole === 'SUPER_ADMIN' || currentRole === 'ADMIN';
  const isBaa = currentRole === 'ADMIN_AKADEMIK' || currentRole === 'AKADEMIK' || currentRole === 'BAA' || isSuperAdmin;
  const isAdmin = isSuperAdmin || isBaa;
  const isDosen = currentRole === 'DOSEN';
  const isMahasiswa = currentRole === 'MAHASISWA';

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      isFirebaseLive,
      login: handleLogin,
      logout: handleLogout,
      loginAsRole,
      switchDemoRole: loginAsRole,
      setSpecificUser,
      updateCurrentUserProfile,
      isAdmin,
      isBaa,
      isSuperAdmin,
      isAkademik: isBaa,
      isDosen,
      isMahasiswa,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
