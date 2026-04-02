import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const { login } = useAuth(); // Context'ten login fonksiyonunu çektik
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (response.ok) {
          // YENİ: Context'i kullanarak tüm sisteme haber veriyoruz
          login(data.user, data.token);
          
          const userRole = data.user.role;
          
          if (userRole === 'admin') {
            navigate('/admin');
          } else if (userRole === 'provider') {
            navigate('/hizmet-paneli');
          } else {
            navigate('/musteri-paneli'); 
          }
        }
        
      } else {
        setError(data.message || 'Giriş yapılamadı, bilgilerinizi kontrol edin.');
      }
    } catch (err) {
      setError('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.');
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center py-20 bg-slate-50 px-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-950 rounded-full flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4 shadow-lg">B</div>
          <h2 className="text-3xl font-extrabold text-blue-950 tracking-tight">Tekrar Hoş Geldiniz</h2>
          <p className="text-slate-500 mt-2 font-light">Hesabınıza giriş yaparak devam edin.</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">E-posta Adresi veya Telefon</label>
            <input 
              type="text" 
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              placeholder="ornek@mail.com veya 0555..."
              className="w-full px-5 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-700">Şifre</label>
              <Link to="/sifremi-unuttum" className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">Şifremi Unuttum</Link>
            </div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-5 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
            />
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-all duration-300 hover:shadow-lg active:scale-95">
            Giriş Yap
          </button>
        </form>

        <p className="text-center text-slate-600 mt-8 text-sm">
          Hesabınız yok mu?{' '}
          <Link to="/kayit" className="text-blue-600 font-bold hover:text-blue-800 transition-colors">Hemen Üye Olun</Link>
        </p>
      </div>
    </div>
  );
}