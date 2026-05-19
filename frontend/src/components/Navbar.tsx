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
    <nav className="bg-white/90 backdrop-blur-xl border-b border-navy-100 sticky top-0 z-50 font-sans shadow-sm">
      <div className="max-w-[1920px] mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
        
        {/* LOGO ALANI */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-11 h-11 bg-navy-800 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-navy-800/20">
            HP
          </div>
          <span className="font-black text-2xl tracking-tight text-navy-900">
            Hizmet<span className="text-gold-500">Pazarı</span>
          </span>
        </Link>

        {/* ORTA MENÜ LİNKLERİ (Masaüstü) */}
        <div className="hidden md:flex items-center gap-8 font-bold text-navy-400 text-sm">
          <Link to="/" className="hover:text-navy-800 transition-colors">Ana Sayfa</Link>
          <Link to="/kategoriler" className="hover:text-navy-800 transition-colors">Kategoriler</Link>
          <Link to="/profesyoneller" className="hover:text-navy-800 transition-colors">Profesyoneller</Link>
          <Link to="#" className="hover:text-navy-800 transition-colors">İletişim</Link>
        </div>

        {/* SAĞ KULLANICI ALANI */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link 
                to={user.role === 'provider' ? '/hizmet-paneli' : '/musteri-paneli'} 
                className="text-navy-800 font-bold hover:text-gold-500 transition-colors hidden sm:block"
              >
                Panelim ({user.name})
              </Link>
              <button 
                onClick={handleLogout} 
                className="bg-navy-50 text-navy-700 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-navy-100 transition-colors"
              >
                Çıkış
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-navy-600 font-bold hover:text-navy-800 transition-colors px-4 hidden sm:block">
                Giriş Yap
              </Link>
              <Link to="/register" className="bg-navy-800 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-navy-700 transition-colors shadow-lg shadow-navy-800/20 text-sm whitespace-nowrap">
                Ücretsiz Kayıt
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
