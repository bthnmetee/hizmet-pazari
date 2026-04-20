import type { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Sayfaları Import Ediyoruz
import Home from './pages/Home';
import Login from './pages/Login';
import RegisterPage from './pages/RegisterPage';
import ProviderRegister from './pages/ProviderRegister';
import MusteriPaneli from './pages/MusteriPaneli';
import HizmetPaneli from './pages/HizmetPaneli';
import AdminDashboard from './pages/AdminDashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profesyoneller from './pages/Profesyoneller';
import Kategoriler from './pages/Kategoriler';

// ✅ Düzeltilmiş ProtectedRoute - Gerçek rol kontrolü
const ProtectedRoute = ({ children, allowedRoles }: { children: ReactNode, allowedRoles?: string[] }) => {
  const { user } = useAuth();
  
  // React State gecikmesi için LocalStorage yedek
  const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
  const activeUser = user || storedUser;
  
  // Kullanıcı yoksa login'e yönlendir
  if (!activeUser) return <Navigate to="/login" replace />;
  
  // Rol kontrolü
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(activeUser.role)) {
    // Yetkisiz kullanıcıyı kendi paneline yönlendir
    if (activeUser.role === 'customer') return <Navigate to="/musteri-paneli" replace />;
    if (activeUser.role === 'provider') return <Navigate to="/hizmet-paneli" replace />;
    if (activeUser.role === 'admin') return <Navigate to="/admin-dashboard" replace />;
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Herkese Açık Rotalar */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/provider-register" element={<ProviderRegister />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/profesyoneller" element={<Profesyoneller />} />
          <Route path="/kategoriler" element={<Kategoriler />} />

          {/* MÜŞTERİ PANELİ */}
          <Route 
            path="/musteri-paneli" 
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <MusteriPaneli />
              </ProtectedRoute>
            } 
          />

          {/* HİZMET VEREN PANELİ */}
          <Route 
            path="/hizmet-paneli" 
            element={
              <ProtectedRoute allowedRoles={['provider']}>
                <HizmetPaneli />
              </ProtectedRoute>
            } 
          />

          {/* ADMİN PANELİ */}
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Tanımsız URL → Ana Sayfa */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
