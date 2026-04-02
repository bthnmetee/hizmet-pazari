import React, { createContext, useContext, useState, useEffect } from 'react';

// Kullanıcı bilgilerinin yapısı
interface User {
  id: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // Sayfa yenilendiğinde kullanıcının girişini hatırlamak için
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login'; // Çıkış yapınca login'e at
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// İŞTE EKSİK OLAN KISIM BURASI (useAuth Hook'u)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth, AuthProvider içinde kullanılmalıdır');
  return context;
};