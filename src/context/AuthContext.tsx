import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  quickSwitch: (role: Role) => Promise<void>;
  originalRole: Role | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [originalRole, setOriginalRole] = useState<Role | null>(() => {
    return localStorage.getItem('originalRole') as Role | null;
  });

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const res = await authApi.getMe();
          const userData = res.data?.data?.user || res.data?.data;
          if (userData) {
            setUser(userData);
          }
        } catch (_err) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem('originalRole');
          localStorage.removeItem('superAdminAccessToken');
          localStorage.removeItem('superAdminRefreshToken');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string, isQuickSwitch = false) => {
    const res = await authApi.login({ email, password });
    const { user: loggedInUser, accessToken, refreshToken } = res.data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    
    if (!isQuickSwitch) {
      localStorage.setItem('originalRole', loggedInUser.role);
      setOriginalRole(loggedInUser.role);
    }
    
    setUser(loggedInUser);
  };

  const logout = () => {
    authApi.logout().catch(() => {});
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('originalRole');
    localStorage.removeItem('superAdminAccessToken');
    localStorage.removeItem('superAdminRefreshToken');
    setUser(null);
    setOriginalRole(null);
  };

  const quickSwitch = async (role: Role) => {
    if (role === 'SUPER_ADMIN') {
      const saToken = localStorage.getItem('superAdminAccessToken');
      const saRefresh = localStorage.getItem('superAdminRefreshToken');
      if (saToken && saRefresh) {
        localStorage.setItem('accessToken', saToken);
        localStorage.setItem('refreshToken', saRefresh);
        localStorage.removeItem('superAdminAccessToken');
        localStorage.removeItem('superAdminRefreshToken');
        
        try {
          const res = await authApi.getMe();
          const userData = res.data?.data?.user || res.data?.data;
          if (userData) setUser(userData);
        } catch (err) {}
      }
      return;
    }

    // Switching TO Student/Admin
    if (!localStorage.getItem('superAdminAccessToken')) {
      localStorage.setItem('superAdminAccessToken', localStorage.getItem('accessToken') || '');
      localStorage.setItem('superAdminRefreshToken', localStorage.getItem('refreshToken') || '');
    }

    try {
      const res = await authApi.impersonate({ role });
      const { user: targetUser, accessToken, refreshToken } = res.data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(targetUser));
      setUser(targetUser);
    } catch (err) {
      console.error('Failed to impersonate', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        quickSwitch,
        originalRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
