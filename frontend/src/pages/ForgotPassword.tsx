import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen spam/gereksiz kutusunu da kontrol etmeyi unutmayın.');
        setEmail(''); // Başarılı olunca inputu temizle
      } else {
        setError(data.message || 'İşlem başarısız oldu.');
      }
    } catch (err) {
      setError('Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center py-20 bg-slate-50 px-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-3xl mx-auto mb-4 shadow-sm">
            🔒
          </div>
          <h2 className="text-2xl font-extrabold text-blue-950 tracking-tight">Şifrenizi mi Unuttunuz?</h2>
          <p className="text-slate-500 mt-2 font-light text-sm">
            Sorun değil! E-posta adresinizi girin, size şifrenizi sıfırlamanız için bir bağlantı gönderelim.
          </p>
        </div>

        {message && <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm mb-6 text-center border border-green-100 font-medium">{message}</div>}
        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 text-center border border-red-100 font-medium">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">E-posta Adresi</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Sisteme kayıtlı e-posta adresiniz"
              className="w-full px-5 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-all duration-300 hover:shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link to="/login" className="text-slate-500 hover:text-blue-600 font-semibold text-sm transition-colors">
            &larr; Giriş Ekranına Dön
          </Link>
        </div>
      </div>
    </div>
  );
}