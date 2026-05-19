import { Fragment, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';

const SERVICES = [
  'temizlik', 'tadilat', 'nakliyat', 'sehirici-nakliyat', 'sehirlerarasi-nakliyat',
  'evden-eve-nakliyat', 'ofis-tasima', 'parca-esya-tasima', 'esya-depolama', 'yazilim',
  'ozelders', 'guzellik', 'bahce', 'elektrik',
  'fotograf', 'insaat', 'klima', 'diger'
];
const SERVICE_LABELS: Record<string, string> = {
  temizlik: '🧹 Temizlik', tadilat: '🔧 Tadilat & Boya', nakliyat: '🚚 Nakliyat',
  'sehirici-nakliyat': '🚛 Şehiriçi Nakliyat',
  'sehirlerarasi-nakliyat': '🛣️ Şehirlerarası Nakliyat',
  'evden-eve-nakliyat': '🏠 Evden Eve Nakliyat',
  'ofis-tasima': '🏢 Ofis Taşıma',
  'parca-esya-tasima': '📦 Parça Eşya Taşıma',
  'esya-depolama': '🗄️ Eşya Depolama',
  yazilim: '💻 Yazılım & Tasarım', ozelders: '📚 Özel Ders', guzellik: '✂️ Güzellik & Bakım',
  bahce: '🌿 Bahçe & Peyzaj', elektrik: '🔌 Elektrik & Tesisat', fotograf: '📷 Fotoğraf & Video',
  insaat: '🏗️ İnşaat & Dekorasyon', klima: '❄️ Klima & Beyaz Eşya', diger: '⚡ Diğer'
};

const getPrimaryServiceCategory = (service?: string) => {
  if (!service) return 'Genel';
  return service.includes('nakliyat') ? 'nakliyat' : service;
};

export default function ProviderRegister() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [taxCertificate, setTaxCertificate] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  const toggleService = (srv: string) => {
    setSelectedServices(prev =>
      prev.includes(srv) ? prev.filter(s => s !== srv) : [...prev, srv]
    );
  };

  const handleSendOTP = async () => {
    if (!email || !email.includes('@')) {
      setError('Lütfen geçerli bir e-posta adresi girin.');
      return;
    }
    setOtpLoading(true);
    setError('');
    try {
      await axiosInstance.post('/phone/send-otp', { email });
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
      const res = await axiosInstance.post('/phone/verify-otp', { email, code: otpCode });
      if (res.data.verified) setEmailVerified(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Doğrulama başarısız.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleRegister = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    if (!emailVerified) { setError('Lütfen e-posta adresinizi doğrulayın.'); return; }
    if (!taxCertificate) { setError('Lütfen vergi levhanızı yükleyin.'); return; }
    if (selectedServices.length === 0) { setError('En az bir hizmet alanı seçin.'); return; }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('phoneNumber', phoneNumber);
    formData.append('password', password);
    formData.append('companyName', name);
    formData.append('serviceCategory', getPrimaryServiceCategory(selectedServices[0]));
    formData.append('services', JSON.stringify(selectedServices));
    formData.append('taxCertificate', taxCertificate);

    setLoading(true);
    try {
      await axiosInstance.post('/auth/register/provider', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kayıt işlemi başarısız oldu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-6 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-gold-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-navy-500/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-navy-700 rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto mb-4 shadow-2xl shadow-navy-900/50 rotate-3 hover:rotate-0 transition-transform border border-navy-600">HP</div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Hizmet Veren Ol</h2>
          <p className="text-navy-300 mt-2 font-medium">Becerilerinizi kazanca dönüştürün.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <Fragment key={s}>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${step === s ? 'bg-gold-500 text-navy-900 shadow-lg shadow-gold-500/30' : step > s ? 'bg-gold-500/20 text-gold-400' : 'bg-white/5 text-navy-400'}`}>
                <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">{step > s ? '✓' : s}</span>
                {s === 1 ? 'Bilgiler' : s === 2 ? 'Hizmetler' : 'Doğrulama'}
              </div>
              {s < 3 && <div className="w-6 h-0.5 bg-white/10"></div>}
            </Fragment>
          ))}
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl">
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm mb-6 text-center font-bold">{error}</div>}
          {success && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-sm mb-6 text-center font-bold">🎉 Tebrikler! Başvurunuz alındı. Onaylandıktan sonra giriş yapabilirsiniz.</div>}

          {/* ═══ STEP 1: Kişisel Bilgiler ═══ */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-black text-navy-300 uppercase tracking-widest mb-2">Ad Soyad / Firma Adı</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Adınız Soyadınız" className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-navy-500/30 focus:border-gold-500 outline-none text-white placeholder:text-navy-500 font-medium" />
              </div>
              <div>
                <label className="block text-xs font-black text-navy-300 uppercase tracking-widest mb-2">E-posta</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="ornek@mail.com" className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-navy-500/30 focus:border-gold-500 outline-none text-white placeholder:text-navy-500 font-medium" />
              </div>
              <div>
                <label className="block text-xs font-black text-navy-300 uppercase tracking-widest mb-2">Telefon</label>
                <input type="tel" required value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="0555 555 55 55" className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-navy-500/30 focus:border-gold-500 outline-none text-white placeholder:text-navy-500 font-medium" />
              </div>
              <div>
                <label className="block text-xs font-black text-navy-300 uppercase tracking-widest mb-2">Şifre</label>
                <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="En az 6 karakter" className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-navy-500/30 focus:border-gold-500 outline-none text-white placeholder:text-navy-500 font-medium" />
              </div>
              <div className="bg-navy-700/30 p-5 rounded-2xl border border-navy-600/30">
                <label className="block text-xs font-black text-gold-400 uppercase tracking-widest mb-2">Vergi Levhası (Zorunlu)</label>
                <input type="file" required accept="image/*,.pdf" onChange={e => setTaxCertificate(e.target.files?.[0] || null)} className="w-full text-sm font-medium text-navy-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-gold-500 file:text-navy-900 hover:file:bg-gold-400 cursor-pointer" />
              </div>
              <button type="button" onClick={() => {
                if (!name || !email || !password || !phoneNumber || !taxCertificate) { setError('Lütfen tüm alanları doldurun.'); return; }
                setError(''); setStep(2);
              }} className="w-full bg-gold-500 text-navy-900 font-black py-4 rounded-xl shadow-lg shadow-gold-500/25 hover:bg-gold-400 hover:shadow-xl transition-all active:scale-[0.98]">
                Devam Et →
              </button>
            </div>
          )}

          {/* ═══ STEP 2: Hizmet Seçimi ═══ */}
          {step === 2 && (
            <div className="space-y-5">
              <button onClick={() => setStep(1)} className="text-navy-300 text-sm font-bold hover:text-white transition-colors">← Geri Dön</button>
              <div>
                <label className="block text-sm font-black text-white mb-4">Hizmet Alanlarınızı Seçin</label>
                <div className="grid grid-cols-2 gap-2">
                  {SERVICES.map(srv => (
                    <label key={srv} className={`flex items-center gap-2 p-3.5 border rounded-xl cursor-pointer transition-all text-sm ${selectedServices.includes(srv) ? 'border-gold-500 bg-gold-500/10 text-gold-400 font-bold' : 'border-white/10 text-navy-300 hover:bg-white/5 hover:border-white/20'}`}>
                      <input type="checkbox" className="w-4 h-4 accent-gold-500 rounded" checked={selectedServices.includes(srv)} onChange={() => toggleService(srv)} />
                      {SERVICE_LABELS[srv]}
                    </label>
                  ))}
                </div>
              </div>
              <button type="button" onClick={() => {
                if (selectedServices.length === 0) { setError('En az bir hizmet alanı seçin.'); return; }
                setError(''); setStep(3);
              }} className="w-full bg-gold-500 text-navy-900 font-black py-4 rounded-xl shadow-lg shadow-gold-500/25 hover:bg-gold-400 hover:shadow-xl transition-all active:scale-[0.98]">
                Devam Et →
              </button>
            </div>
          )}

          {/* ═══ STEP 3: E-Posta Doğrulama ═══ */}
          {step === 3 && (
            <div className="space-y-6">
              <button onClick={() => setStep(2)} className="text-navy-300 text-sm font-bold hover:text-white transition-colors">← Geri Dön</button>
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-navy-700/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-navy-600/30">
                  <span className="text-4xl">{emailVerified ? '✅' : '📧'}</span>
                </div>
                <h3 className="text-xl font-black text-white mb-1">E-Posta Doğrulama</h3>
                <p className="text-navy-300 text-sm font-medium">{email}</p>
              </div>

              {emailVerified ? (
                <div className="space-y-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center">
                    <span className="text-3xl block mb-2">🎉</span>
                    <p className="text-emerald-400 font-black text-lg">Doğrulandı!</p>
                  </div>
                  <button onClick={() => handleRegister()} disabled={success || loading} className="w-full bg-gold-500 text-navy-900 font-black py-4 rounded-xl shadow-lg shadow-gold-500/25 hover:bg-gold-400 hover:shadow-xl transition-all disabled:opacity-50 active:scale-[0.98]">
                    {loading ? 'İşleniyor...' : 'Başvuruyu Tamamla ✓'}
                  </button>
                </div>
              ) : !otpSent ? (
                <button onClick={handleSendOTP} disabled={otpLoading} className="w-full bg-navy-600 text-white font-black py-4 rounded-xl shadow-lg shadow-navy-600/30 hover:bg-navy-500 hover:shadow-xl transition-all disabled:opacity-50 active:scale-[0.98]">
                  {otpLoading ? 'Gönderiliyor...' : '📩 Doğrulama Kodu Gönder'}
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl text-xs font-bold text-center border bg-blue-500/10 border-blue-500/20 text-blue-400">
                    📩 Doğrulama kodu e-posta adresinize gönderildi
                  </div>
                  <div>
                    <label className="block text-xs font-black text-navy-300 uppercase tracking-widest mb-2">6 Haneli Doğrulama Kodu</label>
                    <input type="text" maxLength={6} placeholder="• • • • • •" value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))} className="w-full p-5 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-gold-500 font-mono text-3xl text-center text-white tracking-[0.5em] placeholder:text-navy-600 transition-all" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-navy-400 font-bold">{otpCountdown > 0 ? `⏱ ${Math.floor(otpCountdown / 60)}:${(otpCountdown % 60).toString().padStart(2, '0')} kaldı` : ''}</span>
                    <button onClick={handleSendOTP} disabled={otpCountdown > 0 || otpLoading} className="text-xs font-bold text-gold-400 hover:text-gold-300 disabled:text-navy-600 disabled:cursor-not-allowed">Tekrar Gönder</button>
                  </div>
                  <button onClick={handleVerifyOTP} disabled={otpLoading || otpCode.length !== 6} className="w-full bg-gold-500 text-navy-900 font-black py-4 rounded-xl shadow-lg shadow-gold-500/25 disabled:opacity-50 active:scale-[0.98]">
                    {otpLoading ? 'Doğrulanıyor...' : '✓ Kodu Doğrula'}
                  </button>
                </div>
              )}
            </div>
          )}

          <p className="text-center text-navy-400 mt-6 text-sm font-bold">
            Zaten hesabınız var mı? <Link to="/login" className="text-gold-400 font-bold hover:underline">Giriş Yapın</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
