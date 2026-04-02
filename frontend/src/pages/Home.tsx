import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* ÜST MENÜ (NAVBAR) */}
      <nav className="bg-slate-900 text-white py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50 shadow-xl">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-2xl">📦</span>
          </div>
          <span className="text-2xl font-bold tracking-wide">Lojistik<span className="text-blue-400">Pazarı</span></span>
        </div>
        
        <div className="hidden md:flex space-x-8 font-medium text-slate-300">
          <a href="#nasil-calisir" className="hover:text-white transition-colors duration-300">Nasıl Çalışır?</a>
          <a href="#hizmetler" className="hover:text-white transition-colors duration-300">Avantajlar</a>
          <a href="#ilanlar" className="hover:text-white transition-colors duration-300">Açık İlanlar</a>
        </div>
        
        <div className="flex space-x-4">
          <button 
            onClick={() => navigate('/login')} 
            className="px-5 py-2.5 text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors"
          >
            Giriş Yap
          </button>
          <button 
            onClick={() => navigate('/register')} 
            className="px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all transform hover:-translate-y-0.5"
          >
            Hemen Katıl
          </button>
        </div>
      </nav>

      {/* 1. KAHRAMAN (HERO) BÖLÜMÜ */}
      <header className="flex-1 flex flex-col items-center justify-center text-center px-4 py-28 bg-gradient-to-b from-white to-slate-100">
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-bold mb-8 animate-fade-down">
          🚀 Türkiye'nin Yeni Nesil Lojistik Ağı
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-6 tracking-tight animate-fade-up animate-delay-200">
          Yükünüzü <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Güvenle</span> Taşıyın
        </h1>
        
        <p className="text-lg md:text-xl text-slate-500 max-w-2xl mb-12 animate-fade-up animate-delay-300 font-medium leading-relaxed">
          Gelişmiş eşleştirme algoritmamız sayesinde binlerce güvenilir nakliyeciyle anında buluşun. İster yük gönderin, ister boş dönmeyin.
        </p>
        
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 animate-fade-up animate-delay-500">
          <button 
            onClick={() => navigate('/register')}
            className="px-8 py-4 bg-slate-900 text-white text-lg font-bold rounded-2xl shadow-xl hover:bg-slate-800 transition-all transform hover:-translate-y-1"
          >
            Müşteriyim, Yüküm Var
          </button>
          <button 
            onClick={() => navigate('/register')}
            className="px-8 py-4 bg-white text-slate-900 border-2 border-slate-200 text-lg font-bold rounded-2xl shadow-lg hover:bg-slate-50 hover:border-slate-300 transition-all transform hover:-translate-y-1"
          >
            Nakliyeciyim, İş Arıyorum
          </button>
        </div>
      </header>

      {/* 2. İSTATİSTİKLER BÖLÜMÜ (Yeni) */}
      <section className="bg-slate-900 py-16 border-y border-slate-800">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x-0 md:divide-x divide-slate-800">
          <div className="p-4">
            <h4 className="text-4xl font-extrabold text-white mb-2">15.000+</h4>
            <p className="text-slate-400 font-medium">Başarılı Teslimat</p>
          </div>
          <div className="p-4">
            <h4 className="text-4xl font-extrabold text-blue-500 mb-2">3.500+</h4>
            <p className="text-slate-400 font-medium">Onaylı Nakliyeci</p>
          </div>
          <div className="p-4">
            <h4 className="text-4xl font-extrabold text-white mb-2">81</h4>
            <p className="text-slate-400 font-medium">Aktif İl</p>
          </div>
          <div className="p-4">
            <h4 className="text-4xl font-extrabold text-blue-500 mb-2">%99.8</h4>
            <p className="text-slate-400 font-medium">Müşteri Memnuniyeti</p>
          </div>
        </div>
      </section>

      {/* 3. NASIL ÇALIŞIR BÖLÜMÜ (Yeni) */}
      <section id="nasil-calisir" className="py-24 px-6 md:px-12 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">Sistem Nasıl İşler?</h2>
            <p className="text-slate-500 mt-4 font-medium text-lg">Sadece 3 basit adımda yükünüzü yola çıkarın.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Arka Plan Çizgisi (Sadece Masaüstünde) */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-1 bg-slate-200 z-0"></div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-white border-4 border-blue-100 rounded-full flex items-center justify-center text-4xl shadow-xl mb-6 text-blue-600">📝</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">1. İlan Oluştur</h3>
              <p className="text-slate-500 font-medium">Taşınacak yükünüzün detaylarını, nereden nereye gideceğini sisteme girin.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-blue-600 border-4 border-blue-200 rounded-full flex items-center justify-center text-4xl shadow-xl mb-6 text-white">🤝</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">2. Teklifleri Değerlendir</h3>
              <p className="text-slate-500 font-medium">Onaylı nakliyecilerden gelen fiyat tekliflerini ve sürücü puanlarını kıyaslayın.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-white border-4 border-blue-100 rounded-full flex items-center justify-center text-4xl shadow-xl mb-6 text-blue-600">🚚</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">3. Güvenle Taşıt</h3>
              <p className="text-slate-500 font-medium">Ödemenizi havuzda güvende tutun, yükünüz sorunsuz teslim edildiğinde onaylayın.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. AVANTAJLAR / NEDEN BİZ */}
      <section id="hizmetler" className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">Neden Bizi Seçmelisiniz?</h2>
            <p className="text-slate-500 mt-4 font-medium text-lg">Süreci sizin için en kolay ve güvenli hale getirdik.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="p-10 rounded-[2rem] bg-slate-50 border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group">
              <div className="w-16 h-16 bg-white shadow-sm text-blue-600 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">🛡️</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Onaylı Taşıyıcılar</h3>
              <p className="text-slate-500 leading-relaxed font-medium">Tüm nakliyecilerimiz resmi belge onayından ve müşteri puanlama sisteminden geçer. Kötü sürprizlere yer yok.</p>
            </div>
            
            <div className="p-10 rounded-[2rem] bg-slate-50 border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group">
              <div className="w-16 h-16 bg-white shadow-sm text-blue-600 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">⚡</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Hızlı Eşleşme</h3>
              <p className="text-slate-500 leading-relaxed font-medium">Gelişmiş lokasyon algoritmamızla size en yakın aracı veya yükü dakikalar içinde buluruz. Zamanınız size kalır.</p>
            </div>
            
            <div className="p-10 rounded-[2rem] bg-slate-50 border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group">
              <div className="w-16 h-16 bg-white shadow-sm text-blue-600 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">💳</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Güvenli Havuz Ödeme</h3>
              <p className="text-slate-500 leading-relaxed font-medium">Yük güvenle teslim edilip tarafınızdan onaylanana kadar paranız korumalı havuz hesabımızda bekletilir.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. MÜŞTERİ YORUMLARI (Yeni) */}
      <section className="py-24 px-6 md:px-12 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 md:flex md:justify-between md:items-end">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Ne Dediler?</h2>
              <p className="text-slate-400 font-medium text-lg">Platformumuzu kullanan binlerce mutlu müşteriden sadece birkaçı.</p>
            </div>
            <div className="hidden md:block">
              <div className="flex space-x-1 text-yellow-400 text-2xl">
                ★★★★★
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-800 p-8 rounded-3xl">
              <p className="text-slate-300 italic mb-6">"Fabrikamızın ürünlerini şehir dışına göndermek her zaman bir stresti. Bu platforma üye oldum, 10 dakikada 4 farklı firmadan fiyat aldım. Mükemmel bir sistem."</p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center font-bold text-lg mr-4">AH</div>
                <div>
                  <h4 className="font-bold">Ahmet Yılmaz</h4>
                  <p className="text-sm text-slate-400">Üretici Firma Sahibi</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 p-8 rounded-3xl">
              <p className="text-slate-300 italic mb-6">"Eskiden dönüş yolunda aracım hep boş geliyordu. Artık teslimatı yapmadan dönüş yükümü buradan bulup ayarlıyorum. Kazancım ciddi oranda arttı."</p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center font-bold text-lg mr-4">MK</div>
                <div>
                  <h4 className="font-bold">Mustafa Kaya</h4>
                  <p className="text-sm text-slate-400">Bireysel Nakliyeci</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FİNAL CTA BÖLÜMÜ (Yeni) */}
      <section className="py-20 bg-blue-600 text-center px-4">
        <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">Lojistik Ağımıza Katılmaya Hazır Mısınız?</h2>
        <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">Saniyeler içinde ücretsiz hesabınızı oluşturun, sektörün en güvenilir dijital lojistik ekosisteminde yerinizi alın.</p>
        <button 
          onClick={() => navigate('/register')}
          className="px-10 py-5 bg-white text-blue-600 text-xl font-bold rounded-2xl shadow-2xl hover:bg-slate-50 transition-all transform hover:-translate-y-1"
        >
          Hemen Ücretsiz Kayıt Ol
        </button>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-16 text-center border-t border-slate-900">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-6 md:mb-0">
            <span className="text-2xl text-blue-500">📦</span>
            <span className="font-bold text-white tracking-wide text-xl">Lojistik Pazarı</span>
          </div>
          
          <div className="flex space-x-6 mb-6 md:mb-0 text-sm font-medium">
            <a href="#" className="hover:text-white transition-colors">Kullanım Koşulları</a>
            <a href="#" className="hover:text-white transition-colors">Gizlilik Politikası</a>
            <a href="#" className="hover:text-white transition-colors">İletişim</a>
          </div>

          <p className="text-sm">&copy; 2026 Tüm hakları saklıdır.</p>
        </div>
      </footer>
      
    </div>
  );
};

export default Home;