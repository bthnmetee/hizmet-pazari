import { Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import Login from './pages/Login';
import RegisterPage from './pages/RegisterPage';
import MusteriPaneli from './pages/MusteriPaneli';
import HizmetPaneli from './pages/HizmetPaneli'; // Nakliyeci panelini ekledik
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Paneller */}
        <Route path="/musteri-paneli" element={<MusteriPaneli />} />
        <Route path="/hizmet-paneli" element={<HizmetPaneli />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;