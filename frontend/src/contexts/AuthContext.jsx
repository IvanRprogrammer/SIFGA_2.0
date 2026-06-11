import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as loginService, logout as logoutService, getProfile } from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(() => {
    const stored = localStorage.getItem('sifga_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('sifga_user');
        localStorage.removeItem('sifga_token');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (correo, contrasena) => {
    const data = await loginService(correo, contrasena);
    setUser(data.usuario);
    return data;
  };

  const logout = () => {
    logoutService();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const profile = await getProfile();
      setUser(profile);
      localStorage.setItem('sifga_user', JSON.stringify(profile));
    } catch {
      logout();
    }
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    return roles.some(r => {
      if (typeof r === 'number') return user.id_rol === r;
      return user.rol?.toLowerCase() === r.toLowerCase();
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, refreshUser, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};
