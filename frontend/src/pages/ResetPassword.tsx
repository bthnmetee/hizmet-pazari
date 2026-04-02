import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      return setError('Şifreler birbiriyle eşleşmiyor!');
    }

    if (newPassword.length < 6) {
      return setError('Şifreniz en az 6 karakter olmalıdır.');
    }

    setLoading(true);

    try {
      const response = await fetch(`http://localhost:5000/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Şifreniz başarıyla güncellendi! Giriş sayfasına yönlendiriliyorsunuz...');
        setTimeout(() => navigate('/login'), 3000); // 3 saniye sonra login'e at
      } else {
        setError(data.message || 'Şifre sıfırlama işlemi başarısız oldu.');
      }
    } catch (err) {
      setError('Sunucuya bağlanılamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center py-20 bg-slate-50 px-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-3xl mx-auto mb-4 shadow-sm">🔑</div>
          <h2 className="text-2xl font-extrabold text-blue-950 tracking-tight">Yeni Şifre Belirle</h2>
          <p className="text-slate-500 mt-2 font-light text-sm">Lütfen unutmayacağınız güçlü bir şifre girin.</p>
        </div>

        {message && <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm mb-6 text-center border border-green-100 font-medium">{message}</div>}
        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 text-center border border-red-100 font-medium">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Yeni Şifre</label>
            <input 
              type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="••••••••"
              className="w-full px-5 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Yeni Şifre (Tekrar)</label>
            <input 
              type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="••••••••"
              className="w-full px-5 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
            />
          </div>
          <button type="submit" disabled={loading || !!message} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-70">
            {loading ? 'Güncelleniyor...' : 'Şifremi Güncelle'}
          </button>
        </form>
      </div>
    </div>
  );
}