import { useState, type FormEvent } from 'react';
import type { AxiosError } from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setHata('');
    setYukleniyor(true);

    try {
      const response = await axiosInstance.post('/auth/login', {
        identifier,
        password,
      });

      login(response.data.user, response.data.token);

      const role = response.data.user.role;

      if (role === 'admin') {
        navigate('/admin-dashboard');
      } else if (role === 'customer') {
        navigate('/musteri-paneli');
      } else if (role === 'provider') {
        navigate('/hizmet-paneli');
      } else {
        setHata('Geçersiz kullanıcı rolü.');
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      if (axiosError.response) {
        setHata(axiosError.response.data.message || 'Giriş başarısız oldu.');
      } else {
        setHata('Sunucuya ulaşılamıyor.');
      }
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-10 border-t-4 border-emerald-500">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white text-2xl font-black mx-auto mb-4 shadow-lg shadow-emerald-500/30">HP</div>
          <h2 className="text-3xl font-extrabold text-gray-900">Hizmet Pazarı</h2>
          <p className="text-gray-400 text-sm mt-1 font-medium">Hesabınıza giriş yapın</p>
        </div>

        {hata && <div className="mb-6 p-4 bg-red-50 text-red-700 border-l-4 border-red-600 text-sm font-bold rounded-r-xl">{hata}</div>}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">E-Posta veya Telefon</label>
            <input type="text" placeholder="ornek@mail.com veya 05XXXXXXXXX" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium transition-all" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Şifre</label>
            <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium transition-all" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-emerald-600 font-semibold hover:underline">Şifremi Unuttum</Link>
          </div>

          <button type="submit" disabled={yukleniyor} className="w-full py-4 mt-2 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50">
            {yukleniyor ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-500 font-medium text-sm">
            Hesabınız yok mu? <Link to="/register" className="text-emerald-600 font-bold hover:underline">Kayıt Olun</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
