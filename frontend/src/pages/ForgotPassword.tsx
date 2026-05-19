import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setPreviewUrl('');
    setLoading(true);

    try {
      const response = await axiosInstance.post('/auth/forgot-password', { email });
      setMessage('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen spam/gereksiz kutusunu da kontrol edin.');
      if (response.data.previewUrl) {
        setPreviewUrl(response.data.previewUrl);
      }
      setEmail('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'İşlem başarısız oldu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-navy-50 px-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-navy-200/20 border border-navy-100 p-10 animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-navy-50 rounded-full flex items-center justify-center text-navy-600 text-3xl mx-auto mb-4">
            🔒
          </div>
          <h2 className="text-2xl font-black text-navy-900 tracking-tight">Şifrenizi mi Unuttunuz?</h2>
          <p className="text-navy-400 mt-2 font-medium text-sm">
            E-posta adresinizi girin, size sıfırlama bağlantısı gönderelim.
          </p>
        </div>

        {message && <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm mb-6 text-center border border-emerald-100 font-medium">{message}</div>}
        {previewUrl && (
          <div className="bg-blue-50 text-blue-700 p-4 rounded-xl text-sm mb-6 text-center border border-blue-100 font-medium">
            <p className="mb-2">Geliştirme Modu (Ethereal Email):</p>
            <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold text-blue-800">
              Şifre Sıfırlama E-Postasını Görüntüle
            </a>
          </div>
        )}
        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 text-center border border-red-100 font-medium">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-navy-600 mb-2">E-posta Adresi</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Sisteme kayıtlı e-posta adresiniz"
              className="w-full px-5 py-3 border border-navy-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-500/15 focus:border-navy-400 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy-800 text-white font-bold py-3.5 rounded-xl hover:bg-navy-700 transition-all shadow-lg shadow-navy-800/20 active:scale-95 disabled:opacity-70"
          >
            {loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link to="/login" className="text-navy-400 hover:text-navy-700 font-semibold text-sm transition-colors">
            &larr; Giriş Ekranına Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
