import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  getCurrentUser, 
  loginUser, 
  logoutUser, 
  SESSION_TIMEOUT_MS, 
  WARNING_BEFORE_TIMEOUT_MS, 
  recordUserActivity 
} from '../firebase/authService';
import { isRealFirebaseConfigured } from '../firebase/config';
import { INITIAL_USERS } from '../utils/seedData';
import SessionTimeoutModal from '../components/common/SessionTimeoutModal';
import { showErrorAlert, showInfoToast } from '../utils/alert';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Ambil user dari localStorage jika ada dan belum kedaluwarsa
  const [user, setUser] = useState(() => {
    return getCurrentUser();
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFirebaseLive, setIsFirebaseLive] = useState(isRealFirebaseConfigured());

  // State untuk Session Inactivity Timeout
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(120);
  const lastThrottleRef = useRef(Date.now());

  // Notifikasi jika sesi sebelumnya kedaluwarsa saat pertama kali halaman dimuat
  useEffect(() => {
    if (localStorage.getItem('STIE_LMS_SESSION_EXPIRED') === 'true') {
      localStorage.removeItem('STIE_LMS_SESSION_EXPIRED');
      showErrorAlert(
        'Sesi Berakhir Otomatis',
        'Sesi sebelumnya telah ditutup otomatis karena aplikasi tidak digunakan (inactivity timeout) demi keamanan akun dari penyalahgunaan.'
      );
    }
  }, []);

  const handleLogin = async (identifier, password) => {
    setLoading(true);
    setError(null);
    try {
      const loggedUser = await loginUser(identifier, password);
      setUser(loggedUser);
      recordUserActivity();
      setShowTimeoutWarning(false);
      return loggedUser;
    } catch (err) {
      setError(err.message || "Gagal masuk");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = useCallback(async (isAutoTimeout = false) => {
    await logoutUser();
    setUser(null);
    setShowTimeoutWarning(false);
    if (isAutoTimeout) {
      showErrorAlert(
        'Sesi Telah Berakhir',
        'Demi keamanan akun dan mencegah penyalahgunaan saat perangkat ditinggalkan, sesi Anda telah dikeluarkan secara otomatis karena tidak ada aktivitas selama 15 menit. Silakan masuk kembali.'
      );
    }
  }, []);

  const handleExtendSession = useCallback(() => {
    recordUserActivity();
    setShowTimeoutWarning(false);
    showInfoToast('Sesi Anda berhasil diperpanjang.');
  }, []);

  // Mekanisme Inactivity Tracker: Dengarkan interaksi pengguna saat login
  useEffect(() => {
    if (!user) {
      setShowTimeoutWarning(false);
      return;
    }

    // Update stempel waktu aktivitas dengan throttle 5 detik
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastThrottleRef.current > 5000) {
        lastThrottleRef.current = now;
        recordUserActivity();
      }
      // Jika peringatan sedang tampil dan pengguna bergerak, tutup peringatan
      setShowTimeoutWarning(prev => {
        if (prev) {
          recordUserActivity();
          return false;
        }
        return false;
      });
    };

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(evt => window.addEventListener(evt, handleUserActivity, { passive: true }));

    // Cek berkala setiap detik untuk mengevaluasi waktu ketidakaktifan
    const intervalId = setInterval(() => {
      const lastRaw = localStorage.getItem('STIE_LMS_LAST_ACTIVITY');
      const lastTime = lastRaw ? parseInt(lastRaw, 10) : Date.now();
      const elapsed = Date.now() - lastTime;

      // 1. Jika sudah melampaui 15 menit: Logout Otomatis
      if (elapsed >= SESSION_TIMEOUT_MS) {
        handleLogout(true);
      }
      // 2. Jika memasuki periode peringatan (2 menit sebelum timeout): Tampilkan Modal Peringatan
      else if (elapsed >= (SESSION_TIMEOUT_MS - WARNING_BEFORE_TIMEOUT_MS)) {
        const leftSec = Math.max(0, Math.ceil((SESSION_TIMEOUT_MS - elapsed) / 1000));
        setRemainingSeconds(leftSec);
        setShowTimeoutWarning(true);
      } else {
        setShowTimeoutWarning(false);
      }
    }, 1000);

    return () => {
      activityEvents.forEach(evt => window.removeEventListener(evt, handleUserActivity));
      clearInterval(intervalId);
    };
  }, [user, handleLogout]);

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
      recordUserActivity();
      localStorage.removeItem('STIE_LMS_SESSION_EXPIRED');
      setShowTimeoutWarning(false);
      return target;
    }
  };

  const setSpecificUser = (targetUser) => {
    setUser(targetUser);
    localStorage.setItem('STIE_LMS_ACTIVE_USER', JSON.stringify(targetUser));
    recordUserActivity();
    localStorage.removeItem('STIE_LMS_SESSION_EXPIRED');
    setShowTimeoutWarning(false);
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
      } else {
        setUser(null);
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
      logout: () => handleLogout(false),
      loginAsRole,
      switchDemoRole: loginAsRole,
      setSpecificUser,
      updateCurrentUserProfile,
      extendSession: handleExtendSession,
      isAdmin,
      isBaa,
      isSuperAdmin,
      isAkademik: isBaa,
      isDosen,
      isMahasiswa,
    }}>
      {children}

      {/* Modal Peringatan Inactivity Timeout */}
      <SessionTimeoutModal 
        isOpen={showTimeoutWarning}
        remainingSeconds={remainingSeconds}
        onExtend={handleExtendSession}
        onLogout={() => handleLogout(false)}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
