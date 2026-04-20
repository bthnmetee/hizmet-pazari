import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 font-sans shadow-sm">
      <div className="max-w-[1920px] mx-auto px-6 lg:px-10 h-24 flex items-center justify-between">
        
        {/* LOGO ALANI */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-600 flex items-center justify-center text-white font-black text-2xl">
            C
          </div>
          <span className="font-black text-3xl tracking-tight text-gray-900">
            CORE<span className="text-red-600">PRO</span>
          </span>
        </Link>

        {/* ORTA MENÜ LİNKLERİ (Masaüstü) */}
        <div className="hidden md:flex items-center gap-8 font-bold text-gray-500 uppercase tracking-widest text-sm">
          <Link to="/" className="hover:text-red-600 transition-colors">Ana Sayfa</Link>
          <Link to="#" className="hover:text-red-600 transition-colors">Kurumsal</Link>
          <Link to="#" className="hover:text-red-600 transition-colors">Hizmet Ağımız</Link>
          <Link to="#" className="hover:text-red-600 transition-colors">İletişim</Link>
        </div>

        {/* SAĞ KULLANICI ALANI */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link 
                to={user.role === 'provider' ? '/hizmet-paneli' : '/musteri-paneli'} 
                className="text-gray-900 font-bold hover:text-red-600 transition-colors hidden sm:block"
              >
                Panelim ({user.name})
              </Link>
              <button 
                onClick={handleLogout} 
                className="bg-gray-100 text-gray-900 px-6 py-3 font-bold text-sm uppercase tracking-widest hover:bg-gray-200 transition-colors"
              >
                Çıkış
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-900 font-bold hover:text-red-600 transition-colors px-4 hidden sm:block">
                Firma / Üye Girişi
              </Link>
              <Link to="/kayit" className="bg-red-600 text-white px-8 py-4 font-bold hover:bg-red-700 transition-colors uppercase tracking-widest text-sm whitespace-nowrap">
                Hesap Oluştur
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
