import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen spam/gereksiz kutusunu da kontrol edin.');
        setEmail('');
      } else {
        setError(data.message || 'İşlem başarısız oldu.');
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
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 text-3xl mx-auto mb-4">
            🔒
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Şifrenizi mi Unuttunuz?</h2>
          <p className="text-gray-500 mt-2 font-medium text-sm">
            E-posta adresinizi girin, size sıfırlama bağlantısı gönderelim.
          </p>
        </div>

        {message && <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm mb-6 text-center border border-emerald-100 font-medium">{message}</div>}
        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 text-center border border-red-100 font-medium">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">E-posta Adresi</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Sisteme kayıtlı e-posta adresiniz"
              className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-70"
          >
            {loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link to="/login" className="text-gray-500 hover:text-emerald-600 font-semibold text-sm transition-colors">
            &larr; Giriş Ekranına Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
