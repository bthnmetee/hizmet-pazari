import { useState, type FormEvent, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import SmartMatch from '../components/SmartMatch';
import LiveActivityBar from '../components/LiveActivityBar';
import AiChatbot from '../components/AiChatbot';

const KATEGORILER = [
  { id: 'temizlik', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1470&auto=format&fit=crop', title: 'Ev Temizliği', desc: 'Ev, ofis ve inşaat sonrası detaylı temizlik', proCount: 9788, rating: 4.6, reviewCount: 429069 },
  { id: 'tadilat', image: 'https://images.unsplash.com/photo-1505798577917-a65157d3320a?q=80&w=1470&auto=format&fit=crop', title: 'Tadilat & Boya', desc: 'İç-dış boya, alçı, fayans ve dekorasyon işleri', proCount: 11039, rating: 4.8, reviewCount: 118464 },
  { id: 'nakliyat', image: 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?q=80&w=1470&auto=format&fit=crop', title: 'Nakliyat', desc: 'Şehiriçi, şehirlerarası sigortalı ve güvenilir evden eve nakliyat', proCount: 5886, rating: 4.9, reviewCount: 60752 },
  { id: 'yazilim', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1472&auto=format&fit=crop', title: 'Yazılım & Tasarım', desc: 'Kurumsal web, mobil uygulama ve UI/UX tasarımı', proCount: 3205, rating: 4.9, reviewCount: 45200 },
  { id: 'ozelders', image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1422&auto=format&fit=crop', title: 'Özel Ders', desc: 'Matematik, İngilizce, yazılım ve müzik dersleri', proCount: 8402, rating: 4.7, reviewCount: 89300 },
  { id: 'guzellik', image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1374&auto=format&fit=crop', title: 'Güzellik & Bakım', desc: 'Profesyonel kuaför, cilt bakımı ve manikür', proCount: 6540, rating: 4.8, reviewCount: 112000 },
  { id: 'bahce', image: 'https://images.unsplash.com/photo-1558904541-efa843a96f0f?q=80&w=1470&auto=format&fit=crop', title: 'Bahçe & Peyzaj', desc: 'Bahçe düzenleme, peyzaj ve çim biçme', proCount: 2300, rating: 4.5, reviewCount: 15400 },
  { id: 'elektrik', image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=1469&auto=format&fit=crop', title: 'Elektrik & Tesisat', desc: 'Acil arıza, su tesisatı ve kombi bakımı', proCount: 5420, rating: 4.8, reviewCount: 48900 },
  { id: 'fotograf', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1528&auto=format&fit=crop', title: 'Fotoğraf & Video', desc: 'Düğün, etkinlik ve profesyonel ürün çekimi', proCount: 4120, rating: 4.9, reviewCount: 32500 },
  { id: 'insaat', image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1631&auto=format&fit=crop', title: 'İnşaat & Dekorasyon', desc: 'Komple mutfak, banyo yenileme ve iç mimarlık', proCount: 3890, rating: 4.6, reviewCount: 21800 },
  { id: 'klima', image: 'https://images.unsplash.com/photo-1562635036-7c938ed3d9e8?q=80&w=1470&auto=format&fit=crop', title: 'Klima & Beyaz Eşya', desc: 'Klima montajı, beyaz eşya bakım ve tamiri', proCount: 3202, rating: 4.8, reviewCount: 28824 },
  { id: 'diger', image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1470&auto=format&fit=crop', title: 'Diğer Hizmetler', desc: 'Aradığınız diğer tüm profesyonel hizmetler', proCount: 1250, rating: 4.7, reviewCount: 5400 },
];

const SSS = [
  { q: 'Hizmet Pazarı nasıl çalışır?', a: 'Hizmet almak istediğiniz kategoriyi seçin, talebinizi oluşturun. Platformdaki profesyoneller size teklif gönderir. Teklifleri karşılaştırıp en uygununu seçersiniz.' },
  { q: 'Hizmet vermek ücretsiz mi?', a: 'Platforma kayıt olmak ücretsizdir. Hizmet verenler, müşterilere teklif gönderdiklerinde kredi harcamaktadır.' },
  { q: 'Profesyoneller güvenilir mi?', a: 'Tüm hizmet verenler vergi levhası ve kimlik doğrulamasından geçer. Ayrıca müşteri yorumları ve puanlama sistemiyle şeffaflık sağlanır.' },
  { q: 'Ödeme nasıl yapılır?', a: 'Ödeme, müşteri ve profesyonel arasında doğrudan gerçekleşir. Platform herhangi bir ödeme aracılığı yapmaz.' },
];

const normalizeSearchText = (value: string) =>
  value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const Home: FC = () => {
  const navigate = useNavigate();
  const [aramaMetni, setAramaMetni] = useState('');
  const [acikSSS, setAcikSSS] = useState<number | null>(null);
  const normalizeAramaMetni = normalizeSearchText(aramaMetni.trim());
  const filtrelenmisHizmetler = aramaMetni.trim()
    ? KATEGORILER.filter((kategori) =>
        normalizeSearchText(kategori.title).startsWith(normalizeAramaMetni) &&
        normalizeSearchText(kategori.title) !== normalizeAramaMetni
      ).slice(0, 6)
    : [];

  const handleArama = (e: FormEvent) => {
    e.preventDefault();
    if (aramaMetni.trim()) {
      navigate('/register');
    }
  };

  const handleHizmetSec = (hizmetAdi: string) => {
    setAramaMetni(hizmetAdi);
  };

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">

      {/* NAVBAR */}
      <nav className="bg-white/90 backdrop-blur-xl border-b border-navy-100 py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50 transition-all duration-300">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 bg-navy-800 rounded-xl flex items-center justify-center shadow-lg shadow-navy-800/20">
            <span className="text-xl text-white font-black">HP</span>
          </div>
          <span className="text-2xl font-black tracking-tight text-navy-900">Hizmet<span className="text-gold-500">Pazarı</span></span>
        </div>

        <div className="hidden lg:flex space-x-8 font-semibold text-navy-400">
          <a href="#kategoriler" className="hover:text-navy-800 transition-colors duration-300">Kategoriler</a>
          <a href="#nasil-calisir" className="hover:text-navy-800 transition-colors duration-300">Nasıl Çalışır?</a>
          <button onClick={() => navigate('/profesyoneller')} className="hover:text-navy-800 transition-colors duration-300">Profesyoneller</button>
          <a href="#sss" className="hover:text-navy-800 transition-colors duration-300">SSS</a>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/login')}
            className="px-5 py-2.5 text-sm font-bold rounded-xl text-navy-600 hover:bg-navy-50 transition-colors hidden sm:block"
          >
            Giriş Yap
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-5 py-2.5 text-sm font-bold bg-navy-800 text-white rounded-xl shadow-lg shadow-navy-800/20 hover:bg-navy-700 transition-all transform hover:-translate-y-0.5"
          >
            Ücretsiz Kayıt
          </button>
        </div>
      </nav>

      {/* CANLI AKTİVİTE BANDI */}
      <LiveActivityBar />

      {/* HERO */}
      <header className="relative pt-20 pb-28 px-4 overflow-hidden">
        {/* Gradient arka plan */}
        <div className="absolute inset-0 bg-gradient-to-b from-navy-50/60 via-white to-white"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-navy-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 animate-soft-glow"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gold-100/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 animate-soft-glow" style={{ animationDelay: '2s' }}></div>

        {/* Dekoratif geometrik elementler */}
        <div className="absolute top-20 left-[10%] w-3 h-3 bg-navy-300/30 rounded-full animate-float"></div>
        <div className="absolute top-40 right-[15%] w-2 h-2 bg-gold-400/40 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-[20%] w-4 h-4 border-2 border-navy-200/30 rounded-full animate-float" style={{ animationDelay: '3s' }}></div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-navy-800/5 border border-navy-200/50 text-navy-700 text-sm font-bold mb-8 animate-fade-in-up">
            ✨ Türkiye'nin Güvenilir Hizmet Platformu
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-navy-900 mb-6 tracking-tight leading-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Ne Yaptırmak<br />
            <span className="text-gradient-navy">İstiyorsunuz?</span>
          </h1>

          <p className="text-xl text-navy-400 max-w-2xl mx-auto mb-12 font-medium leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Binlerce onaylı profesyonelden teklif alın, karşılaştırın, en uygunuyla çalışın.
            <span className="text-navy-700 font-bold"> Tamamen ücretsiz.</span>
          </p>

          {/* ARAMA KUTUSU */}
          <div className="max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <form onSubmit={handleArama} className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-navy-300 text-xl">🔍</span>
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="Hangi hizmeti arıyorsunuz? (Örn: Ev temizliği, boya, nakliyat...)"
                    className={`w-full pl-14 pr-6 py-5 bg-white border-2 text-lg font-medium text-navy-900 outline-none focus:border-navy-400 focus:ring-4 focus:ring-navy-500/10 transition-all shadow-xl shadow-navy-100/30 ${
                      filtrelenmisHizmetler.length > 0
                        ? 'border-navy-200 rounded-t-2xl rounded-b-lg'
                        : 'border-navy-100 rounded-2xl'
                    }`}
                    value={aramaMetni}
                    onChange={(e) => setAramaMetni(e.target.value)}
                  />
                </div>
                {filtrelenmisHizmetler.length > 0 && (
                  <div className="mt-1 overflow-hidden rounded-b-2xl rounded-t-lg border-x-2 border-b-2 border-navy-200 bg-white shadow-xl shadow-navy-100/50">
                    {filtrelenmisHizmetler.map((hizmet) => (
                      <button
                        key={hizmet.id}
                        type="button"
                        onClick={() => handleHizmetSec(hizmet.title)}
                        className="block w-full border-b border-navy-50 px-5 py-4 text-left font-semibold text-navy-800 transition-colors hover:bg-navy-50 last:border-b-0"
                      >
                        {hizmet.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="px-10 py-5 bg-navy-800 text-white text-lg font-bold rounded-2xl shadow-xl shadow-navy-800/25 hover:bg-navy-700 transition-all transform hover:-translate-y-0.5 whitespace-nowrap animate-pulse-glow sm:self-stretch"
              >
                Hizmet Bul
              </button>
            </form>
          </div>
          <div className="hidden max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <form onSubmit={handleArama} className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="flex-1 min-w-0">
                <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-navy-300 text-xl">🔍</span>
              <input
                type="text"
                autoComplete="off"
                placeholder="Hangi hizmeti arıyorsunuz? (Örn: Ev temizliği, boya, nakliyat...)"
                className={`w-full pl-14 pr-6 py-5 bg-white border-2 text-lg font-medium text-navy-900 outline-none focus:border-navy-400 focus:ring-4 focus:ring-navy-500/10 transition-all shadow-xl shadow-navy-100/30 ${
                  filtrelenmisHizmetler.length > 0
                    ? 'border-navy-200 rounded-t-2xl rounded-b-lg'
                    : 'border-navy-100 rounded-2xl'
                }`}
                value={aramaMetni}
                onChange={(e) => setAramaMetni(e.target.value)}
              />
                </div>
              {filtrelenmisHizmetler.length > 0 && (
                <div className="overflow-hidden rounded-b-2xl rounded-t-lg border-x-2 border-b-2 border-navy-200 bg-white shadow-xl shadow-navy-100/50">
                  {filtrelenmisHizmetler.map((hizmet) => (
                    <button
                      key={hizmet.id}
                      type="button"
                      onClick={() => setAramaMetni(hizmet.title)}
                      className="block w-full border-b border-navy-50 px-5 py-4 text-left font-semibold text-navy-800 transition-colors hover:bg-navy-50 last:border-b-0"
                    >
                      {hizmet.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              className="px-10 py-5 bg-navy-800 text-white text-lg font-bold rounded-2xl shadow-xl shadow-navy-800/25 hover:bg-navy-700 transition-all transform hover:-translate-y-0.5 whitespace-nowrap animate-pulse-glow"
            >
              Hizmet Bul
            </button>
            </form>
          </div>

          {/* Popüler Aramalar */}
          <div className="flex flex-wrap justify-center gap-2 mt-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <span className="text-sm text-navy-300 font-semibold mr-2">Popüler:</span>
            {['Ev Temizliği', 'Boya Badana', 'Nakliyat', 'Web Tasarım', 'Kombi Bakım'].map(item => (
              <button key={item} onClick={() => navigate('/register')} className="px-4 py-1.5 bg-white border border-navy-100 rounded-full text-sm font-semibold text-navy-500 hover:border-navy-300 hover:text-navy-700 hover:bg-navy-50 transition-all">
                {item}
              </button>
            ))}
          </div>

          {/* AKILLI HİZMET ASISTANI */}
          <SmartMatch />
        </div>
      </header>

      {/* İSTATİSTİKLER */}
      <section className="py-12 bg-white border-y border-navy-100">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="animate-fade-in-up">
            <h4 className="text-3xl md:text-4xl font-black text-navy-900">50.000+</h4>
            <p className="text-navy-300 font-semibold text-sm mt-1">Tamamlanan İş</p>
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h4 className="text-3xl md:text-4xl font-black text-gold-500">10.000+</h4>
            <p className="text-navy-300 font-semibold text-sm mt-1">Aktif Profesyonel</p>
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h4 className="text-3xl md:text-4xl font-black text-navy-900">81</h4>
            <p className="text-navy-300 font-semibold text-sm mt-1">İl Kapsamı</p>
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <h4 className="text-3xl md:text-4xl font-black text-gold-500">%98</h4>
            <p className="text-navy-300 font-semibold text-sm mt-1">Müşteri Memnuniyeti</p>
          </div>
        </div>
      </section>

      {/* KATEGORİLER (Trend Hizmetler Konsepti) */}
      <section id="kategoriler" className="py-24 px-6 bg-navy-50/40 relative overflow-hidden">
        {/* Dekoratif Arka Plan Elementleri */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white rounded-full blur-3xl opacity-60 pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gold-500/5 rounded-full blur-3xl pointer-events-none translate-y-1/3 -translate-x-1/3"></div>

        <div className="max-w-[1400px] mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-navy-900/5 border border-navy-900/10 text-navy-700 text-sm font-bold mb-4">
                🚀 En Çok Talep Görenler
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-navy-900 tracking-tight">Haftanın Trend Hizmetleri</h2>
            </div>
            <button onClick={() => navigate('/kategoriler')} className="inline-flex items-center gap-2 text-navy-600 font-bold hover:text-navy-900 transition-colors group">
              Tüm Kategorileri Gör
              <span className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center group-hover:bg-gold-500 group-hover:text-white transition-all transform group-hover:translate-x-1">
                →
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {KATEGORILER.map((kat, index) => (
              <button
                key={kat.id}
                onClick={() => navigate('/register')}
                className="group relative bg-white rounded-3xl overflow-hidden border border-navy-100 hover:border-gold-500 hover:shadow-2xl hover:shadow-navy-900/10 transition-all duration-500 text-left hover:-translate-y-2 flex flex-col h-full animate-fade-in-up opacity-0"
                style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
              >
                <div className="relative h-56 overflow-hidden bg-navy-50">
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-900/60 via-navy-900/10 to-transparent group-hover:opacity-80 transition-opacity duration-500 z-10"></div>
                  <img src={kat.image} alt={kat.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out" />
                  
                  {/* Rating Badge */}
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-black text-navy-900 shadow-lg z-20 flex items-center gap-1.5 border border-navy-50">
                    <span className="text-gold-500 text-sm">★</span> {kat.rating} <span className="text-navy-400 font-medium">({(kat.reviewCount / 1000).toFixed(1)}k)</span>
                  </div>
                </div>
                
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-xl font-black text-navy-900 mb-2 group-hover:text-gold-600 transition-colors">{kat.title}</h3>
                  <p className="text-sm text-navy-500 font-medium leading-relaxed mb-6 flex-grow">{kat.desc}</p>
                  
                  <div className="flex items-center justify-between pt-5 border-t border-navy-50">
                    <div className="flex items-center gap-2.5 text-sm font-semibold text-navy-700">
                      <div className="flex -space-x-2">
                        <div className="w-7 h-7 rounded-full bg-navy-100 border-2 border-white flex items-center justify-center text-xs">👨‍🔧</div>
                        <div className="w-7 h-7 rounded-full bg-navy-200 border-2 border-white flex items-center justify-center text-xs">👩‍🎨</div>
                      </div>
                      <span>{kat.proCount.toLocaleString('tr-TR')} <span className="text-navy-400 font-medium">profesyonel</span></span>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-navy-50 group-hover:bg-gold-500 flex items-center justify-center text-navy-400 group-hover:text-navy-900 transition-all duration-300 transform group-hover:rotate-45 shadow-sm">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* NASIL ÇALIŞIR */}
      <section id="nasil-calisir" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-black text-navy-900 mb-4">3 Adımda Hizmet Alın</h2>
            <p className="text-navy-400 font-medium text-lg">Dakikalar içinde ihtiyacınıza uygun profesyoneli bulun.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Bağlantı çizgisi */}
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-navy-200 via-gold-300 to-navy-200 z-0"></div>

            <div className="relative z-10 flex flex-col items-center text-center animate-fade-in-up">
              <div className="w-32 h-32 bg-navy-50 border-4 border-navy-100 rounded-3xl flex items-center justify-center mb-6 shadow-xl group hover:border-navy-200 transition-colors">
                <span className="text-5xl">📝</span>
              </div>
              <span className="inline-flex items-center justify-center w-8 h-8 bg-navy-800 text-white text-sm font-black rounded-full mb-4">1</span>
              <h3 className="text-xl font-black text-navy-900 mb-3">Talebinizi Oluşturun</h3>
              <p className="text-navy-400 font-medium text-sm leading-relaxed max-w-xs">Hangi hizmete ihtiyacınız olduğunu, nerede ve ne zaman istediğinizi bize anlatın.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              <div className="w-32 h-32 bg-navy-800 border-4 border-navy-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-navy-800/20">
                <span className="text-5xl">📩</span>
              </div>
              <span className="inline-flex items-center justify-center w-8 h-8 bg-gold-500 text-white text-sm font-black rounded-full mb-4">2</span>
              <h3 className="text-xl font-black text-navy-900 mb-3">Teklif Alın</h3>
              <p className="text-navy-400 font-medium text-sm leading-relaxed max-w-xs">İlgili profesyoneller size fiyat ve detay içeren teklifler gönderir.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="w-32 h-32 bg-navy-50 border-4 border-navy-100 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
                <span className="text-5xl">🤝</span>
              </div>
              <span className="inline-flex items-center justify-center w-8 h-8 bg-navy-800 text-white text-sm font-black rounded-full mb-4">3</span>
              <h3 className="text-xl font-black text-navy-900 mb-3">Profesyoneli Seçin</h3>
              <p className="text-navy-400 font-medium text-sm leading-relaxed max-w-xs">Teklifleri, profil puanlarını ve yorumları karşılaştırarak en uygunuyla çalışmaya başlayın.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PROFESYONELLERİÇİN CTA */}
      <section className="py-24 px-6 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-navy-500/10 rounded-full blur-3xl"></div>
        {/* Dekoratif çizgiler */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent"></div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-400 text-sm font-bold mb-6">
                💼 Profesyoneller İçin
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                Yeteneklerinizi<br /><span className="text-gold-400">Kazanca</span> Dönüştürün
              </h2>
              <p className="text-navy-300 text-lg font-medium leading-relaxed mb-8">
                Binlerce müşteri her gün hizmet arıyor. Profilinizi oluşturun,
                teklif gönderin ve işlerinizi büyütün.
              </p>
              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gold-500/15 rounded-xl flex items-center justify-center text-gold-400 shrink-0">✓</div>
                  <span className="text-navy-200 font-medium">Ücretsiz kayıt, komisyon yok</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gold-500/15 rounded-xl flex items-center justify-center text-gold-400 shrink-0">✓</div>
                  <span className="text-navy-200 font-medium">Müşteri portföyünüzü genişletin</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gold-500/15 rounded-xl flex items-center justify-center text-gold-400 shrink-0">✓</div>
                  <span className="text-navy-200 font-medium">Puan ve yorum ile güven oluşturun</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/register')}
                className="px-10 py-4 bg-gold-500 text-navy-900 text-lg font-bold rounded-2xl shadow-xl shadow-gold-500/20 hover:bg-gold-400 transition-all transform hover:-translate-y-1"
              >
                Profesyonel Olarak Kayıt Ol
              </button>
            </div>

            <div className="hidden lg:grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="bg-navy-700/50 border border-navy-600/50 rounded-2xl p-6 backdrop-blur-sm hover:border-navy-500 transition-colors duration-300">
                  <span className="text-3xl mb-3 block">🧹</span>
                  <h4 className="text-white font-bold">Temizlik</h4>
                  <p className="text-navy-400 text-sm mt-1">320+ Profesyonel</p>
                </div>
                <div className="bg-navy-700/50 border border-navy-600/50 rounded-2xl p-6 backdrop-blur-sm hover:border-navy-500 transition-colors duration-300">
                  <span className="text-3xl mb-3 block">🔧</span>
                  <h4 className="text-white font-bold">Tadilat</h4>
                  <p className="text-navy-400 text-sm mt-1">450+ Profesyonel</p>
                </div>
              </div>
              <div className="space-y-4 mt-8">
                <div className="bg-navy-700/50 border border-navy-600/50 rounded-2xl p-6 backdrop-blur-sm hover:border-navy-500 transition-colors duration-300">
                  <span className="text-3xl mb-3 block">💻</span>
                  <h4 className="text-white font-bold">Yazılım</h4>
                  <p className="text-navy-400 text-sm mt-1">280+ Profesyonel</p>
                </div>
                <div className="bg-gold-500/10 border border-gold-500/20 rounded-2xl p-6 hover:border-gold-500/40 transition-colors duration-300">
                  <span className="text-3xl mb-3 block">📚</span>
                  <h4 className="text-gold-400 font-bold">Özel Ders</h4>
                  <p className="text-gold-500/50 text-sm mt-1">190+ Profesyonel</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SSS */}
      <section id="sss" className="py-24 px-6 bg-navy-50/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-navy-900 mb-4">Sıkça Sorulan Sorular</h2>
          </div>

          <div className="space-y-4">
            {SSS.map((item, i) => (
              <div key={i} className="bg-white border border-navy-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                <button
                  onClick={() => setAcikSSS(acikSSS === i ? null : i)}
                  className="w-full flex justify-between items-center p-6 text-left"
                >
                  <span className="font-bold text-navy-800 pr-4">{item.q}</span>
                  <span className={`text-2xl text-navy-400 transform transition-transform duration-300 ${acikSSS === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${acikSSS === i ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-6 pb-6">
                    <p className="text-navy-400 font-medium leading-relaxed">{item.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FİNAL CTA */}
      <section className="py-24 bg-navy-900 text-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-navy-800/50 via-transparent to-navy-800/50"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent"></div>

        <h2 className="relative z-10 text-4xl md:text-6xl font-black text-white mb-6">Hizmet İçin Doğru Adres</h2>
        <p className="relative z-10 text-navy-300 text-xl mb-12 max-w-2xl mx-auto font-medium">
          Ücretsiz hesabınızı oluşturun ve binlerce profesyonele anında ulaşın.
        </p>
        <div className="relative z-10 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/register')}
            className="px-12 py-5 bg-white text-navy-900 text-xl font-black rounded-2xl shadow-2xl hover:bg-gray-50 transition-all transform hover:-translate-y-1"
          >
            Hizmet Al
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-12 py-5 bg-gold-500 text-navy-900 text-xl font-bold rounded-2xl shadow-2xl hover:bg-gold-400 transition-all transform hover:-translate-y-1"
          >
            Hizmet Ver
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-navy-900 text-navy-300 py-16 px-6 border-t border-navy-700/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12 border-b border-navy-700/50 pb-12">

          <div className="md:col-span-1">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-navy-700 rounded-lg flex items-center justify-center text-white text-xs font-black">HP</div>
              <span className="font-black text-white text-xl">Hizmet Pazarı</span>
            </div>
            <p className="text-sm leading-relaxed mb-6">Türkiye'nin en güvenilir hizmet ve profesyonel eşleştirme platformu.</p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Platform</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><button onClick={() => navigate('/register')} className="hover:text-gold-400 transition-colors">Hizmet Al</button></li>
              <li><button onClick={() => navigate('/register')} className="hover:text-gold-400 transition-colors">Profesyonel Ol</button></li>
              <li><button onClick={() => navigate('/kategoriler')} className="hover:text-gold-400 transition-colors">Kategoriler</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Kurumsal</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><a href="#" className="hover:text-gold-400 transition-colors">Hakkımızda</a></li>
              <li><a href="#" className="hover:text-gold-400 transition-colors">Kariyer</a></li>
              <li><a href="#" className="hover:text-gold-400 transition-colors">İletişim</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Destek</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><a href="#" className="hover:text-gold-400 transition-colors">Yardım Merkezi</a></li>
              <li><a href="#" className="hover:text-gold-400 transition-colors">Kullanım Koşulları</a></li>
              <li><a href="#" className="hover:text-gold-400 transition-colors">KVKK & Gizlilik</a></li>
            </ul>
          </div>
        </div>

        {/* İş Ortaklarımız */}
        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-navy-700/50">
          <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">İş Ortaklarımız</h4>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://www.globalevtasima.com.tr"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy-800 border border-navy-600/50 rounded-xl hover:border-gold-500/40 hover:bg-navy-700/80 transition-all duration-300 group"
            >
              <span className="w-7 h-7 bg-gold-500/15 rounded-lg flex items-center justify-center text-gold-400 text-sm">🚚</span>
              <div>
                <span className="text-white text-sm font-bold block group-hover:text-gold-400 transition-colors">Global Evden Eve Nakliyat</span>
                <span className="text-navy-400 text-xs">İstanbul, İzmir, Bodrum Nakliyat</span>
              </div>
            </a>
          </div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-sm mt-12">
          <p>&copy; 2026 Hizmet Pazarı. Tüm hakları saklıdır.</p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <a href="https://www.globalevtasima.com.tr" target="_blank" rel="noopener" className="hover:text-gold-400 transition-colors">Global Nakliyat</a>
            <span className="text-navy-600">|</span>
            <p>Türkiye'de ❤️ ile geliştirildi</p>
          </div>
        </div>
      </footer>

      {/* AI CHATBOT */}
      <AiChatbot />

    </div>
  );
};

export default Home;
