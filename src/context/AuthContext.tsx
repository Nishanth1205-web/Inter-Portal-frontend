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
          if (res.data?.data?.user) {
            setUser(res.data.data.user);
          }
        } catch (_err) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem('originalRole');
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
    setUser(null);
    setOriginalRole(null);
  };

  const quickSwitch = async (role: Role) => {
    const credentials: Record<Role, { email: string; pass: string }> = {
      SUPER_ADMIN: { email: 'superadmin@inter.edu', pass: 'SuperAdmin@123' },
      ADMIN: { email: 'admin@inter.edu', pass: 'Admin@123' },
      STUDENT: { email: 'student1@inter.edu', pass: 'Student@123' },
    };

    const cred = credentials[role];
    if (cred) {
      // pass isQuickSwitch = true
      await login(cred.email, cred.pass, true);
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
