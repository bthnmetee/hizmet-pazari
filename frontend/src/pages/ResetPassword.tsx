import { useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
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
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(data.message || 'Şifre sıfırlama işlemi başarısız oldu.');
      }
    } catch {
      setError('Sunucuya bağlanılamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50/30 px-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 text-3xl mx-auto mb-4">🔑</div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Yeni Şifre Belirle</h2>
          <p className="text-gray-500 mt-2 font-medium text-sm">Lütfen güçlü bir şifre girin.</p>
        </div>

        {message && <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm mb-6 text-center border border-emerald-100 font-medium">{message}</div>}
        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 text-center border border-red-100 font-medium">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Yeni Şifre</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Yeni Şifre (Tekrar)</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <button type="submit" disabled={loading || !!message} className="w-full bg-emerald-500 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-70">
            {loading ? 'Güncelleniyor...' : 'Şifremi Güncelle'}
          </button>
        </form>
      </div>
    </div>
  );
}
