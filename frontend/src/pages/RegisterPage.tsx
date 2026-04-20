import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';

const HIZMET_KATEGORILERI = [
  { value: 'temizlik', label: 'Temizlik', icon: '🧹' },
  { value: 'tadilat', label: 'Tadilat & Boya', icon: '🔧' },
  { value: 'nakliyat', label: 'Nakliyat', icon: '🚚' },
  { value: 'yazilim', label: 'Yazılım & Tasarım', icon: '💻' },
  { value: 'ozelders', label: 'Özel Ders', icon: '📚' },
  { value: 'guzellik', label: 'Güzellik & Bakım', icon: '✂️' },
  { value: 'bahce', label: 'Bahçe & Peyzaj', icon: '🌿' },
  { value: 'elektrik', label: 'Elektrik & Tesisat', icon: '🔌' },
  { value: 'fotograf', label: 'Fotoğraf & Video', icon: '📷' },
  { value: 'insaat', label: 'İnşaat & Dekorasyon', icon: '🏗️' },
  { value: 'klima', label: 'Klima & Beyaz Eşya', icon: '❄️' },
  { value: 'diger', label: 'Diğer', icon: '⚡' },
];

export default function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState<'customer' | 'provider'>('customer');
  const [step, setStep] = useState(1); // 1: Bilgiler, 2: Telefon Doğrulama
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', companyName: '', phoneNumber: '', serviceCategory: ''
  });
  const [taxCertificate, setTaxCertificate] = useState<File | null>(null);

  // Telefon doğrulama state
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ─── TELEFON DOĞRULAMA ───
  const handleSendOTP = async () => {
    if (!formData.phoneNumber || formData.phoneNumber.length < 10) {
      setError('Lütfen geçerli bir telefon numarası girin.');
      return;
    }
    setOtpLoading(true);
    setError('');
    try {
      const res = await axiosInstance.post('/phone/send-otp', { phoneNumber: formData.phoneNumber });
      
      // MOCK TEST EKRANI YAKALAMA
      if (res.data.devMode) {
        alert(`📱 TEST CİHAZI BİLDİRİMİ\n\nTelefonunuza şu SMS geldi:\n"Doğrulama kodunuz: ${res.data.devOtp}"`);
      }

      setOtpSent(true);
      setOtpCountdown(120);
      const timer = setInterval(() => {
        setOtpCountdown(prev => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Doğrulama kodu gönderilemedi.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setError('Lütfen 6 haneli doğrulama kodunu girin.');
      return;
    }
    setOtpLoading(true);
    setError('');
    try {
      const res = await axiosInstance.post('/phone/verify-otp', {
        phoneNumber: formData.phoneNumber,
        code: otpCode
      });
      if (res.data.verified) {
        setPhoneVerified(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Doğrulama başarısız.');
    } finally {
      setOtpLoading(false);
    }
  };

  const canProceedToStep2 = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.phoneNumber) return false;
    if (role === 'provider' && (!formData.companyName || !formData.serviceCategory || !taxCertificate)) return false;
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!phoneVerified) {
      setError('Lütfen önce telefon numaranızı doğrulayın.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (role === 'provider') {
        const data = new FormData();
        data.append('name', formData.name);
        data.append('email', formData.email);
        data.append('password', formData.password);
        data.append('companyName', formData.companyName);
        data.append('phoneNumber', formData.phoneNumber);
        data.append('serviceCategory', formData.serviceCategory);
        data.append('services', JSON.stringify([formData.serviceCategory]));
        if (taxCertificate) data.append('taxCertificate', taxCertificate);

        await axiosInstance.post('/auth/register/provider', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert('Kayıt başarılı! Vergi levhanız onaylandıktan sonra giriş yapabilirsiniz.');
        navigate('/login');
      } else {
        await axiosInstance.post('/auth/register/customer', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phoneNumber: formData.phoneNumber
        });
        alert('Kayıt başarılı! Giriş yapabilirsiniz.');
        navigate('/login');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-emerald-50/30">

      {/* Arka plan dekorasyon */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative max-w-lg w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center text-gray-900 font-black text-2xl mx-auto mb-4 shadow-2xl shadow-emerald-500/30 rotate-3 hover:rotate-0 transition-transform">HP</div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Hizmet Pazarı</h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">Ücretsiz hesap oluşturun</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${step === 1 ? 'bg-emerald-500 text-gray-900 shadow-lg shadow-emerald-500/30' : 'bg-gray-100 text-gray-500'}`}>
            <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs">1</span>
            Bilgiler
          </div>
          <div className="w-8 h-0.5 bg-gray-100"></div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${step === 2 ? 'bg-emerald-500 text-gray-900 shadow-lg shadow-emerald-500/30' : 'bg-gray-100 text-gray-500'}`}>
            <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs">2</span>
            Doğrulama
          </div>
        </div>

        <div className="bg-white shadow-xl p-8 rounded-3xl border border-gray-200">

          {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 font-bold rounded-xl text-sm text-center break-words">{error}</div>}

          {/* Rol Seçimi */}
          <div className="flex gap-3 mb-8 bg-gray-50 p-1.5 rounded-2xl border border-gray-200">
            <button type="button" onClick={() => setRole('customer')} className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${role === 'customer' ? 'bg-white text-gray-900 shadow-lg' : 'text-gray-500 hover:text-gray-900'}`}>
              🏠 Hizmet Alacağım
            </button>
            <button type="button" onClick={() => setRole('provider')} className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${role === 'provider' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-gray-900 shadow-lg shadow-emerald-500/30' : 'text-gray-500 hover:text-gray-900'}`}>
              💼 Hizmet Vereceğim
            </button>
          </div>

          {/* ═══ ADIM 1: BİLGİLER ═══ */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Ad Soyad</label>
                <input type="text" name="name" required onChange={handleChange} value={formData.name} placeholder="Adınız Soyadınız" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium text-gray-900 placeholder:text-gray-400 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">E-Posta</label>
                <input type="email" name="email" required onChange={handleChange} value={formData.email} placeholder="ornek@mail.com" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium text-gray-900 placeholder:text-gray-400 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Telefon Numarası</label>
                <input type="tel" name="phoneNumber" required onChange={handleChange} value={formData.phoneNumber} placeholder="05XX XXX XX XX" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium text-gray-900 placeholder:text-gray-400 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Şifre</label>
                <input type="password" name="password" required minLength={6} onChange={handleChange} value={formData.password} placeholder="En az 6 karakter" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium text-gray-900 placeholder:text-gray-400 transition-all" />
              </div>

              {role === 'provider' && (
                <div className="space-y-5 border-t border-gray-200 pt-5 mt-5">
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Firma Adı</label>
                    <input type="text" name="companyName" required onChange={handleChange} value={formData.companyName} placeholder="Firma veya Ticari Ünvan" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 font-medium text-gray-900 placeholder:text-gray-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Hizmet Kategorisi</label>
                    <select name="serviceCategory" required value={formData.serviceCategory} onChange={handleChange} className="w-full p-4 bg-white border border-gray-200 rounded-xl outline-none focus:border-emerald-500 font-medium text-gray-900">
                      <option value="" disabled>Alanınızı Seçin</option>
                      {HIZMET_KATEGORILERI.map(k => (
                        <option key={k.value} value={k.value}>{k.icon} {k.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/20">
                    <label className="block text-xs font-black text-emerald-400 uppercase tracking-widest mb-2">Vergi Levhası (Zorunlu)</label>
                    <p className="text-[10px] font-bold text-gray-500 mb-3">Hesabınızın onaylanması için vergi levhanızı yüklemelisiniz (JPG, PNG, PDF).</p>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      required
                      onChange={(e) => setTaxCertificate(e.target.files?.[0] || null)}
                      className="w-full text-sm font-medium text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-emerald-500 file:text-gray-900 hover:file:bg-emerald-600 transition-all cursor-pointer"
                    />
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  if (!canProceedToStep2()) {
                    setError('Lütfen tüm alanları doldurun.');
                    return;
                  }
                  setError('');
                  setStep(2);
                }}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-gray-900 font-black py-4 rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all uppercase tracking-widest mt-4 active:scale-[0.98]"
              >
                Devam Et →
              </button>
            </div>
          )}

          {/* ═══ ADIM 2: TELEFON DOĞRULAMA ═══ */}
          {step === 2 && (
            <div className="space-y-6">
              <button onClick={() => setStep(1)} className="text-gray-500 text-sm font-bold hover:text-gray-900 transition-colors">
                ← Geri Dön
              </button>

              <div className="text-center py-4">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                  <span className="text-4xl">{phoneVerified ? '✅' : '📱'}</span>
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-1">Telefon Doğrulama</h3>
                <p className="text-gray-500 text-sm font-medium">{formData.phoneNumber}</p>
              </div>

              {phoneVerified ? (
                <div className="space-y-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center">
                    <span className="text-3xl block mb-2">🎉</span>
                    <p className="text-emerald-400 font-black text-lg">Telefon numaranız doğrulandı!</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmit as any}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-gray-900 font-black py-4 rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl transition-all uppercase tracking-widest disabled:opacity-50 active:scale-[0.98]"
                  >
                    {loading ? 'İşleniyor...' : 'Kayıt Ol ✓'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {!otpSent ? (
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={otpLoading}
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-gray-900 font-black py-4 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all uppercase tracking-widest disabled:opacity-50 active:scale-[0.98]"
                    >
                      {otpLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                          Gönderiliyor...
                        </span>
                      ) : '📩 Doğrulama Kodu Gönder'}
                    </button>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">6 Haneli Doğrulama Kodu</label>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="• • • • • •"
                          value={otpCode}
                          onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          className="w-full p-5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 font-mono text-3xl text-center text-gray-900 tracking-[0.5em] placeholder:text-gray-500 transition-all"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 font-bold">
                          {otpCountdown > 0 ? `⏱ ${Math.floor(otpCountdown / 60)}:${(otpCountdown % 60).toString().padStart(2, '0')} kaldı` : ''}
                        </span>
                        <button
                          type="button"
                          onClick={handleSendOTP}
                          disabled={otpCountdown > 0 || otpLoading}
                          className="text-xs font-bold text-emerald-400 hover:text-emerald-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                        >
                          Tekrar Gönder
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={handleVerifyOTP}
                        disabled={otpLoading || otpCode.length !== 6}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-gray-900 font-black py-4 rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl transition-all uppercase tracking-widest disabled:opacity-50 active:scale-[0.98]"
                      >
                        {otpLoading ? 'Doğrulanıyor...' : '✓ Kodu Doğrula'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <p className="text-center mt-8 text-sm font-bold text-gray-400">
            Zaten hesabınız var mı? <Link to="/login" className="text-emerald-400 hover:text-emerald-300 hover:underline transition-colors">Giriş Yap</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
