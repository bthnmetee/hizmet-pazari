import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';

const HIZMET_KATEGORILERI = [
  { value: 'temizlik', label: 'Temizlik', icon: '🧹' },
  { value: 'tadilat', label: 'Tadilat & Boya', icon: '🔧' },
  { value: 'nakliyat', label: 'Nakliyat', icon: '🚚' },
  { value: 'sehirici-nakliyat', label: 'Şehiriçi Nakliyat', icon: '🚛' },
  { value: 'sehirlerarasi-nakliyat', label: 'Şehirlerarası Nakliyat', icon: '🛣️' },
  { value: 'evden-eve-nakliyat', label: 'Evden Eve Nakliyat', icon: '🏠' },
  { value: 'ofis-tasima', label: 'Ofis Taşıma', icon: '🏢' },
  { value: 'parca-esya-tasima', label: 'Parça Eşya Taşıma', icon: '📦' },
  { value: 'esya-depolama', label: 'Eşya Depolama', icon: '🗄️' },
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

const getPrimaryServiceCategory = (service?: string) => {
  if (!service) return 'Genel';
  return service.includes('nakliyat') ? 'nakliyat' : service;
};

const MAX_TAX_CERTIFICATE_SIZE = 5 * 1024 * 1024;
const TAX_CERTIFICATE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']);
const TAX_CERTIFICATE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'pdf']);

const validateTaxCertificate = (file: File) => {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  if (file.size > MAX_TAX_CERTIFICATE_SIZE) {
    return 'Vergi levhası dosyası 5MB sınırını aşamaz.';
  }

  if (!TAX_CERTIFICATE_TYPES.has(file.type) && !TAX_CERTIFICATE_EXTENSIONS.has(extension)) {
    return 'Vergi levhası JPG, PNG, WEBP veya PDF formatında olmalıdır.';
  }

  return '';
};

export default function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState<'customer' | 'provider'>('customer');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', companyName: '', phoneNumber: ''
  });
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [taxCertificate, setTaxCertificate] = useState<File | null>(null);

  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.target.name === 'email' && e.target.value !== formData.email) {
      setOtpSent(false);
      setOtpCode('');
      setEmailVerified(false);
      setOtpCountdown(0);
    }

    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleService = (value: string) => {
    setSelectedServices(prev =>
      prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value]
    );
  };

  const handleSendOTP = async () => {
    if (!formData.email || !formData.email.includes('@')) {
      setError('Lütfen geçerli bir e-posta adresi girin.');
      return;
    }
    setOtpLoading(true);
    setError('');
    try {
      const normalizedEmail = formData.email.trim().toLowerCase();
      const response = await axiosInstance.post('/phone/send-otp', { email: normalizedEmail });
      setOtpSent(true);
      setOtpCode('');
      setEmailVerified(false);
      setOtpCountdown(response.data?.expiresIn || 300);
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
        email: formData.email.trim().toLowerCase(),
        code: otpCode.trim()
      });
      if (res.data.verified) {
        setEmailVerified(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Doğrulama başarısız.');
    } finally {
      setOtpLoading(false);
    }
  };

  const canProceedToStep2 = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.phoneNumber) return false;
    if (role === 'provider' && (!formData.companyName || !taxCertificate)) return false;
    return true;
  };

  const canProceedToStep3 = () => {
    return selectedServices.length > 0;
  };

  const totalSteps = role === 'provider' ? 3 : 2;

  const goNextStep = () => {
    if (step === 1) {
      if (!canProceedToStep2()) {
        setError('Lütfen tüm alanları doldurun.');
        return;
      }
      setError('');
      if (role === 'provider') {
        setStep(2);
      } else {
        setStep(totalSteps);
      }
    } else if (step === 2 && role === 'provider') {
      if (!canProceedToStep3()) {
        setError('En az bir hizmet alanı seçmelisiniz.');
        return;
      }
      setError('');
      setStep(3);
    }
  };

  const goPrevStep = () => {
    setError('');
    if (step === 3 && role === 'provider') {
      setStep(2);
    } else if (step === 2 && role === 'provider') {
      setStep(1);
    } else {
      setStep(1);
    }
  };

  const isVerificationStep = (role === 'provider' && step === 3) || (role === 'customer' && step === 2);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!emailVerified) {
      setError('Lütfen önce e-posta adresinizi doğrulayın.');
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
        data.append('serviceCategory', getPrimaryServiceCategory(selectedServices[0]));
        data.append('services', JSON.stringify(selectedServices));
        if (taxCertificate) {
          const fileError = validateTaxCertificate(taxCertificate);
          if (fileError) {
            setError(fileError);
            setLoading(false);
            return;
          }

          data.append('taxCertificate', taxCertificate);
        }

        await axiosInstance.post('/auth/register/provider', data);
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-white to-navy-50/50">

      {/* Arka plan dekorasyon */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-navy-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-gold-500/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative max-w-lg w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-navy-800 rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto mb-4 shadow-2xl shadow-navy-800/25 rotate-3 hover:rotate-0 transition-transform">HP</div>
          <h1 className="text-3xl font-black text-navy-900 tracking-tight">Hizmet Pazarı</h1>
          <p className="text-navy-400 text-sm mt-1 font-medium">Ücretsiz hesap oluşturun</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${step === s ? 'bg-navy-800 text-white shadow-lg shadow-navy-800/25' : step > s ? 'bg-navy-100 text-navy-600' : 'bg-gray-100 text-navy-300'}`}>
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">{step > s ? '✓' : s}</span>
                {s === 1 ? 'Bilgiler' : (role === 'provider' && s === 2) ? 'Hizmetler' : 'Doğrulama'}
              </div>
              {s < totalSteps && <div className={`w-8 h-0.5 ${step > s ? 'bg-navy-300' : 'bg-gray-200'}`}></div>}
            </div>
          ))}
        </div>

        <div className="bg-white shadow-xl shadow-navy-200/20 p-8 rounded-3xl border border-navy-100">

          {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 font-bold rounded-xl text-sm text-center break-words">{error}</div>}

          {/* Rol Seçimi (sadece step 1'de göster) */}
          {step === 1 && (
            <div className="flex gap-3 mb-8 bg-navy-50 p-1.5 rounded-2xl border border-navy-100">
              <button type="button" onClick={() => { setRole('customer'); setSelectedServices([]); }} className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${role === 'customer' ? 'bg-white text-navy-900 shadow-lg' : 'text-navy-400 hover:text-navy-700'}`}>
                🏠 Hizmet Alacağım
              </button>
              <button type="button" onClick={() => setRole('provider')} className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${role === 'provider' ? 'bg-navy-800 text-white shadow-lg shadow-navy-800/25' : 'text-navy-400 hover:text-navy-700'}`}>
                💼 Hizmet Vereceğim
              </button>
            </div>
          )}

          {/* ═══ ADIM 1: BİLGİLER ═══ */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-black text-navy-400 uppercase tracking-widest mb-2">Ad Soyad</label>
                <input type="text" name="name" required onChange={handleChange} value={formData.name} placeholder="Adınız Soyadınız" className="w-full p-4 bg-navy-50/50 border border-navy-100 rounded-xl outline-none focus:border-navy-400 focus:ring-2 focus:ring-navy-500/15 font-medium text-navy-900 placeholder:text-navy-300 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-black text-navy-400 uppercase tracking-widest mb-2">E-Posta</label>
                <input type="email" name="email" required onChange={handleChange} value={formData.email} placeholder="ornek@mail.com" className="w-full p-4 bg-navy-50/50 border border-navy-100 rounded-xl outline-none focus:border-navy-400 focus:ring-2 focus:ring-navy-500/15 font-medium text-navy-900 placeholder:text-navy-300 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-black text-navy-400 uppercase tracking-widest mb-2">Telefon Numarası</label>
                <input type="tel" name="phoneNumber" required onChange={handleChange} value={formData.phoneNumber} placeholder="05XX XXX XX XX" className="w-full p-4 bg-navy-50/50 border border-navy-100 rounded-xl outline-none focus:border-navy-400 focus:ring-2 focus:ring-navy-500/15 font-medium text-navy-900 placeholder:text-navy-300 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-black text-navy-400 uppercase tracking-widest mb-2">Şifre</label>
                <input type="password" name="password" required minLength={6} onChange={handleChange} value={formData.password} placeholder="En az 6 karakter" className="w-full p-4 bg-navy-50/50 border border-navy-100 rounded-xl outline-none focus:border-navy-400 focus:ring-2 focus:ring-navy-500/15 font-medium text-navy-900 placeholder:text-navy-300 transition-all" />
              </div>

              {role === 'provider' && (
                <div className="space-y-5 border-t border-navy-100 pt-5 mt-5">
                  <div>
                    <label className="block text-xs font-black text-navy-400 uppercase tracking-widest mb-2">Firma Adı</label>
                    <input type="text" name="companyName" required onChange={handleChange} value={formData.companyName} placeholder="Firma veya Ticari Ünvan" className="w-full p-4 bg-navy-50/50 border border-navy-100 rounded-xl outline-none focus:border-navy-400 font-medium text-navy-900 placeholder:text-navy-300" />
                  </div>
                  <div className="bg-navy-800/5 p-5 rounded-2xl border border-navy-200">
                    <label className="block text-xs font-black text-navy-600 uppercase tracking-widest mb-2">Vergi Levhası (Zorunlu)</label>
                    <p className="text-[10px] font-bold text-navy-400 mb-3">Hesabınızın onaylanması için vergi levhanızı yüklemelisiniz (JPG, PNG, PDF).</p>
                    <input
	                      type="file"
	                      accept=".jpg,.jpeg,.png,.webp,.pdf"
	                      required
	                      onChange={(e) => {
	                        const file = e.target.files?.[0] || null;
	                        if (file) {
	                          const fileError = validateTaxCertificate(file);
	                          if (fileError) {
	                            setError(fileError);
	                            e.target.value = '';
	                            setTaxCertificate(null);
	                            return;
	                          }
	                        }

	                        setError('');
	                        setTaxCertificate(file);
	                      }}
	                      className="w-full text-sm font-medium text-navy-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-navy-800 file:text-white hover:file:bg-navy-700 transition-all cursor-pointer"
	                    />
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={goNextStep}
                className="w-full bg-navy-800 text-white font-black py-4 rounded-xl shadow-lg shadow-navy-800/25 hover:bg-navy-700 hover:shadow-xl transition-all uppercase tracking-widest mt-4 active:scale-[0.98]"
              >
                Devam Et →
              </button>
            </div>
          )}

          {/* ═══ ADIM 2: HİZMET SEÇİMİ (Sadece Provider) ═══ */}
          {step === 2 && role === 'provider' && (
            <div className="space-y-5">
              <button onClick={goPrevStep} className="text-navy-400 text-sm font-bold hover:text-navy-700 transition-colors">
                ← Geri Dön
              </button>

              <div>
                <label className="block text-sm font-black text-navy-800 mb-2">Hizmet Alanlarınızı Seçin</label>
                <p className="text-xs text-navy-400 font-medium mb-4">Verebileceğiniz hizmetleri seçin. Sadece seçtiğiniz hizmetlerle ilgili talepler panelinizde görünecektir.</p>
                
                <div className="grid grid-cols-2 gap-2.5">
                  {HIZMET_KATEGORILERI.map(kat => (
                    <label
                      key={kat.value}
                      className={`flex items-center gap-2.5 p-3.5 border rounded-xl cursor-pointer transition-all text-sm group ${
                        selectedServices.includes(kat.value)
                          ? 'border-navy-500 bg-navy-50 text-navy-700 font-bold shadow-sm shadow-navy-500/10'
                          : 'border-navy-100 text-navy-400 hover:bg-navy-50 hover:border-navy-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-navy-800 rounded"
                        checked={selectedServices.includes(kat.value)}
                        onChange={() => toggleService(kat.value)}
                      />
                      <span className="text-base group-hover:scale-105 transition-transform">{kat.icon}</span>
                      <span className="truncate">{kat.label}</span>
                    </label>
                  ))}
                </div>

                {selectedServices.length > 0 && (
                  <div className="mt-4 p-3 bg-navy-50 border border-navy-200 rounded-xl">
                    <p className="text-xs font-bold text-navy-600">
                      ✅ {selectedServices.length} hizmet alanı seçildi — Panelinizde sadece bu alanlara ait talepler görünecek.
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={goNextStep}
                disabled={selectedServices.length === 0}
                className="w-full bg-navy-800 text-white font-black py-4 rounded-xl shadow-lg shadow-navy-800/25 hover:bg-navy-700 transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                Devam Et →
              </button>
            </div>
          )}

          {/* ═══ E-POSTA DOĞRULAMA ADIMI ═══ */}
          {isVerificationStep && (
            <div className="space-y-6">
              <button onClick={goPrevStep} className="text-navy-400 text-sm font-bold hover:text-navy-700 transition-colors">
                ← Geri Dön
              </button>

              <div className="text-center py-4">
                <div className="w-20 h-20 bg-navy-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-navy-100">
                  <span className="text-4xl">{emailVerified ? '✅' : '✉️'}</span>
                </div>
                <h3 className="text-xl font-black text-navy-900 mb-1">E-Posta Doğrulama</h3>
                <p className="text-navy-400 text-sm font-medium">{formData.email}</p>
              </div>

              {emailVerified ? (
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
                    <span className="text-3xl block mb-2">🎉</span>
                    <p className="text-emerald-600 font-black text-lg">E-posta adresiniz doğrulandı!</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmit as any}
                    disabled={loading}
                    className="w-full bg-navy-800 text-white font-black py-4 rounded-xl shadow-lg shadow-navy-800/25 hover:bg-navy-700 transition-all uppercase tracking-widest disabled:opacity-50 active:scale-[0.98]"
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
                      className="w-full bg-navy-600 text-white font-black py-4 rounded-xl shadow-lg shadow-navy-600/25 hover:bg-navy-500 transition-all uppercase tracking-widest disabled:opacity-50 active:scale-[0.98]"
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
                        <label className="block text-xs font-black text-navy-400 uppercase tracking-widest mb-2">6 Haneli Doğrulama Kodu</label>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="• • • • • •"
                          value={otpCode}
                          onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          className="w-full p-5 bg-navy-50/50 border border-navy-100 rounded-xl outline-none focus:border-navy-400 font-mono text-3xl text-center text-navy-900 tracking-[0.5em] placeholder:text-navy-300 transition-all"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-navy-400 font-bold">
                          {otpCountdown > 0 ? `⏱ ${Math.floor(otpCountdown / 60)}:${(otpCountdown % 60).toString().padStart(2, '0')} kaldı` : ''}
                        </span>
                        <button
                          type="button"
                          onClick={handleSendOTP}
                          disabled={otpCountdown > 0 || otpLoading}
                          className="text-xs font-bold text-navy-500 hover:text-navy-700 disabled:text-navy-300 disabled:cursor-not-allowed transition-colors"
                        >
                          Tekrar Gönder
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={handleVerifyOTP}
                        disabled={otpLoading || otpCode.length !== 6}
                        className="w-full bg-navy-800 text-white font-black py-4 rounded-xl shadow-lg shadow-navy-800/25 hover:bg-navy-700 transition-all uppercase tracking-widest disabled:opacity-50 active:scale-[0.98]"
                      >
                        {otpLoading ? 'Doğrulanıyor...' : '✓ Kodu Doğrula'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <p className="text-center mt-8 text-sm font-bold text-navy-400">
            Zaten hesabınız var mı? <Link to="/login" className="text-navy-700 hover:text-navy-900 hover:underline transition-colors">Giriş Yap</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
