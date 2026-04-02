import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const RegisterPage: React.FC = () => {
  const [isim, setIsim] = useState('');
  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [rol, setRol] = useState('musteri'); 
  const [firmaAdi, setFirmaAdi] = useState('');
  const [hata, setHata] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setHata('');

    try {
      await axios.post('http://localhost:5000/api/auth/register', {
        isim,
        email,
        sifre,
        rol,
        firmaAdi: rol === 'hizmetveren' ? firmaAdi : undefined
      });

      alert('Kayıt fişek gibi başarılı! Şimdi giriş yapabilirsin. 🎉');
      navigate('/login'); 
      
    } catch (error: any) {
      setHata(error.response?.data?.mesaj || 'Sunucu patladı galiba, backend açık mı? 🔥');
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-10 animate-fade-down animate-duration-700 animate-ease-out">
        
        <div className="text-center mb-8 animate-fade-in animate-delay-300">
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Aramıza Katıl</h2>
          <p className="text-slate-500 mt-2 font-medium">Yeni bir hesap oluştur</p>
        </div>

        {hata && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg animate-shake animate-duration-300">
            <p className="text-sm font-semibold">{hata}</p>
          </div>
        )}

        <div className="flex bg-slate-100 p-1 rounded-xl mb-6 animate-fade-in animate-delay-500">
          <button
            type="button"
            onClick={() => setRol('musteri')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${
              rol === 'musteri' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Müşteriyim
          </button>
          <button
            type="button"
            onClick={() => setRol('hizmetveren')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${
              rol === 'hizmetveren' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Nakliyeciyim
          </button>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="animate-fade-right animate-delay-[600ms]">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ad Soyad</label>
            <input
              type="text"
              value={isim}
              onChange={(e) => setIsim(e.target.value)}
              className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all hover:border-slate-300"
              placeholder="Ad Soyad"
              required
            />
          </div>

          {rol === 'hizmetveren' && (
            <div className="animate-fade-down animate-duration-300">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Firma Adı</label>
              <input
                type="text"
                value={firmaAdi}
                onChange={(e) => setFirmaAdi(e.target.value)}
                className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all hover:border-slate-300"
                placeholder="Örn: Hızlı Nakliyat"
                required
              />
            </div>
          )}

          <div className="animate-fade-right animate-delay-[700ms]">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Adresi</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all hover:border-slate-300"
              placeholder="ornek@mail.com"
              required
            />
          </div>

          <div className="animate-fade-right animate-delay-[800ms]">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Şifre</label>
            <input
              type="password"
              value={sifre}
              onChange={(e) => setSifre(e.target.value)}
              className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all hover:border-slate-300"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="animate-fade-up animate-delay-[1000ms] pt-2">
            <button
              type="submit"
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-500/30 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all active:scale-[0.98] outline-none"
            >
              Kayıt Ol
            </button>
          </div>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500 animate-fade-in animate-delay-[1200ms]">
          Zaten hesabın var mı?{' '}
          <span 
            onClick={() => navigate('/login')} 
            className="font-bold text-blue-600 hover:text-blue-500 transition-colors cursor-pointer"
          >
            Giriş Yap
          </span>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;