import { useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';

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
      await axiosInstance.post(`/auth/reset-password/${token}`, { newPassword });

      setMessage('Şifreniz başarıyla güncellendi! Giriş sayfasına yönlendiriliyorsunuz...');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Şifre sıfırlama işlemi başarısız oldu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-navy-50 px-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-navy-200/20 border border-navy-100 p-10 animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-navy-50 rounded-full flex items-center justify-center text-navy-600 text-3xl mx-auto mb-4">🔑</div>
          <h2 className="text-2xl font-black text-navy-900 tracking-tight">Yeni Şifre Belirle</h2>
          <p className="text-navy-400 mt-2 font-medium text-sm">Lütfen güçlü bir şifre girin.</p>
        </div>

        {message && <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm mb-6 text-center border border-emerald-100 font-medium">{message}</div>}
        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 text-center border border-red-100 font-medium">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-navy-600 mb-2">Yeni Şifre</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-5 py-3 border border-navy-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-500/15 focus:border-navy-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-navy-600 mb-2">Yeni Şifre (Tekrar)</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-5 py-3 border border-navy-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-500/15 focus:border-navy-400 transition-all"
            />
          </div>
          <button type="submit" disabled={loading || !!message} className="w-full bg-navy-800 text-white font-bold py-3.5 rounded-xl hover:bg-navy-700 transition-all shadow-lg shadow-navy-800/20 disabled:opacity-70">
            {loading ? 'Güncelleniyor...' : 'Şifremi Güncelle'}
          </button>
        </form>
      </div>
    </div>
  );
}
