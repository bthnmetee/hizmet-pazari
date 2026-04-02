import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function ProviderRegister() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [serviceCategory, setServiceCategory] = useState('');
  const [taxPlate, setTaxPlate] = useState<File | null>(null); // Dosya için state
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!taxPlate) {
      setError('Lütfen vergi levhanızı yükleyin.');
      return;
    }
    
    // Dosya göndereceğimiz için FormData oluşturuyoruz
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('phoneNumber', phoneNumber);
    formData.append('password', password);
    formData.append('serviceCategory', serviceCategory);
    formData.append('taxPlate', taxPlate); // Backend'deki 'upload.single("taxPlate")' adıyla eşleşmeli

    try {
      // DİKKAT: FormData kullanırken 'Content-Type' başlığını BİZ EKLEMİYORUZ. Tarayıcı otomatik ayarlar.
      const response = await fetch('http://localhost:5000/api/auth/register/provider', {
        method: 'POST',
        body: formData, 
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(data.message || 'Kayıt işlemi başarısız oldu.');
      }
    } catch (err) {
      setError('Sunucuya bağlanılamadı. Lütfen backendin açık olduğundan emin olun.');
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center py-20 bg-slate-50 px-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4 shadow-lg">🚀</div>
          <h2 className="text-3xl font-extrabold text-blue-950 tracking-tight">Hizmet Veren Ol</h2>
          <p className="text-slate-500 mt-2 font-light">Becerilerinizi kazanca dönüştürün.</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center">{error}</div>}
        {success && <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-6 text-center">Tebrikler! Başvurunuz alındı. Vergi levhanız incelendikten sonra hesabınız onaylanacaktır. Girişe yönlendiriliyorsunuz...</div>}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Ad Soyad / Firma Adı</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Adınız Soyadınız" className="w-full px-5 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">E-posta Adresi</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@mail.com" className="w-full px-5 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Telefon Numarası</label>
            <input type="tel" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="0555 555 55 55" className="w-full px-5 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Hizmet Kategorisi</label>
            <select required value={serviceCategory} onChange={(e) => setServiceCategory(e.target.value)} className="w-full px-5 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 bg-white">
              <option value="" disabled>Alanınızı Seçin</option>
              <option value="temizlik">Temizlik</option>
              <option value="tadilat">Tadilat & Boya</option>
              <option value="nakliyat">Nakliyat</option>
              <option value="yazilim">Yazılım & Tasarım</option>
              <option value="ozelders">Özel Ders</option>
            </select>
          </div>

          {/* DOSYA YÜKLEME ALANI */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Vergi Levhası (Zorunlu)</label>
            <input 
              type="file" 
              required 
              accept="image/*,.pdf" // Sadece resim ve PDF kabul et
              onChange={(e) => setTaxPlate(e.target.files ? e.target.files[0] : null)} 
              className="w-full px-5 py-3 border border-slate-300 rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Şifre</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-5 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600" />
          </div>

          <button type="submit" disabled={success} className="w-full bg-blue-950 text-white font-bold py-3.5 rounded-xl hover:bg-blue-900 transition-all duration-300 active:scale-95 disabled:opacity-50 mt-2">
            Başvuruyu Tamamla
          </button>
        </form>

        <p className="text-center text-slate-600 mt-6 text-sm">
          Zaten hesabınız var mı? <Link to="/login" className="text-blue-600 font-bold hover:text-blue-800">Giriş Yapın</Link>
        </p>
      </div>
    </div>
  );
}