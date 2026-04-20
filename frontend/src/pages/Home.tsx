import { useState, type FormEvent, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import SmartMatch from '../components/SmartMatch';
import LiveActivityBar from '../components/LiveActivityBar';

const KATEGORILER = [
  { id: 'temizlik', icon: '🧹', title: 'Temizlik', desc: 'Ev, ofis ve inşaat sonrası temizlik', color: 'from-sky-400 to-sky-600' },
  { id: 'tadilat', icon: '🔧', title: 'Tadilat & Boya', desc: 'İç-dış boya, alçı, fayans işleri', color: 'from-amber-400 to-amber-600' },
  { id: 'nakliyat', icon: '🚚', title: 'Nakliyat', desc: 'Evden eve, ofis, şehirler arası', color: 'from-emerald-400 to-emerald-600' },
  { id: 'yazilim', icon: '💻', title: 'Yazılım & Tasarım', desc: 'Web, mobil uygulama, grafik', color: 'from-violet-400 to-violet-600' },
  { id: 'ozelders', icon: '📚', title: 'Özel Ders', desc: 'Matematik, İngilizce, müzik', color: 'from-rose-400 to-rose-600' },
  { id: 'guzellik', icon: '✂️', title: 'Güzellik & Bakım', desc: 'Kuaför, cilt bakımı, manikür', color: 'from-pink-400 to-pink-600' },
  { id: 'bahce', icon: '🌿', title: 'Bahçe & Peyzaj', desc: 'Bahçe düzenleme, çim biçme', color: 'from-lime-400 to-lime-600' },
  { id: 'elektrik', icon: '🔌', title: 'Elektrik & Tesisat', desc: 'Arıza, tesisat, kombi bakım', color: 'from-orange-400 to-orange-600' },
  { id: 'fotograf', icon: '📷', title: 'Fotoğraf & Video', desc: 'Düğün, etkinlik, ürün çekimi', color: 'from-indigo-400 to-indigo-600' },
  { id: 'insaat', icon: '🏗️', title: 'İnşaat & Dekorasyon', desc: 'Mutfak, banyo yenileme', color: 'from-teal-400 to-teal-600' },
  { id: 'klima', icon: '❄️', title: 'Klima & Beyaz Eşya', desc: 'Montaj, bakım, tamir', color: 'from-cyan-400 to-cyan-600' },
  { id: 'diger', icon: '⚡', title: 'Diğer Hizmetler', desc: 'Aradığınızı bulamadınız mı?', color: 'from-gray-400 to-gray-600' },
];

const SSS = [
  { q: 'Hizmet Pazarı nasıl çalışır?', a: 'Hizmet almak istediğiniz kategoriyi seçin, talebinizi oluşturun. Platformdaki profesyoneller size teklif gönderir. Teklifleri karşılaştırıp en uygununu seçersiniz.' },
  { q: 'Hizmet vermek ücretsiz mi?', a: 'Platforma kayıt olmak ücretsizdir. Hizmet verenler, müşterilere teklif gönderdiklerinde kredi harcamaktadır.' },
  { q: 'Profesyoneller güvenilir mi?', a: 'Tüm hizmet verenler vergi levhası ve kimlik doğrulamasından geçer. Ayrıca müşteri yorumları ve puanlama sistemiyle şeffaflık sağlanır.' },
  { q: 'Ödeme nasıl yapılır?', a: 'Ödeme, müşteri ve profesyonel arasında doğrudan gerçekleşir. Platform herhangi bir ödeme aracılığı yapmaz.' },
];

const Home: FC = () => {
  const navigate = useNavigate();
  const [aramaMetni, setAramaMetni] = useState('');
  const [acikSSS, setAcikSSS] = useState<number | null>(null);

  const handleArama = (e: FormEvent) => {
    e.preventDefault();
    if (aramaMetni.trim()) {
      navigate('/register');
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-emerald-100 selection:text-emerald-800 overflow-x-hidden">

      {/* NAVBAR */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-100 py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="text-xl text-white font-black">HP</span>
          </div>
          <span className="text-2xl font-black tracking-tight text-gray-900">Hizmet<span className="text-emerald-500">Pazarı</span></span>
        </div>

        <div className="hidden lg:flex space-x-8 font-semibold text-gray-500">
          <a href="#kategoriler" className="hover:text-emerald-600 transition-colors">Kategoriler</a>
          <a href="#nasil-calisir" className="hover:text-emerald-600 transition-colors">Nasıl Çalışır?</a>
          <button onClick={() => navigate('/profesyoneller')} className="hover:text-emerald-600 transition-colors">Profesyoneller</button>
          <a href="#sss" className="hover:text-emerald-600 transition-colors">SSS</a>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/login')}
            className="px-5 py-2.5 text-sm font-bold rounded-xl text-gray-700 hover:bg-gray-100 transition-colors hidden sm:block"
          >
            Giriş Yap
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-5 py-2.5 text-sm font-bold bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all transform hover:-translate-y-0.5"
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
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/80 via-white to-white"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-100/40 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-bold mb-8">
            ✨ Türkiye'nin Güvenilir Hizmet Platformu
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-6 tracking-tight leading-tight">
            Ne Yaptırmak<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">İstiyorsunuz?</span>
          </h1>

          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
            Binlerce onaylı profesyonelden teklif alın, karşılaştırın, en uygunuyla çalışın.
            <span className="text-emerald-600 font-bold"> Tamamen ücretsiz.</span>
          </p>

          {/* ARAMA KUTUSU */}
          <form onSubmit={handleArama} className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-xl">🔍</span>
              <input
                type="text"
                placeholder="Hangi hizmeti arıyorsunuz? (Örn: Ev temizliği, boya, nakliyat...)"
                className="w-full pl-14 pr-6 py-5 bg-white border-2 border-gray-100 rounded-2xl text-lg font-medium text-gray-900 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-xl shadow-gray-200/50"
                value={aramaMetni}
                onChange={(e) => setAramaMetni(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="px-10 py-5 bg-emerald-500 text-white text-lg font-bold rounded-2xl shadow-xl shadow-emerald-500/30 hover:bg-emerald-600 transition-all transform hover:-translate-y-0.5 whitespace-nowrap"
            >
              Hizmet Bul
            </button>
          </form>

          {/* Popüler Aramalar */}
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            <span className="text-sm text-gray-400 font-semibold mr-2">Popüler:</span>
            {['Ev Temizliği', 'Boya Badana', 'Nakliyat', 'Web Tasarım', 'Kombi Bakım'].map(item => (
              <button key={item} onClick={() => navigate('/register')} className="px-4 py-1.5 bg-white border border-gray-200 rounded-full text-sm font-semibold text-gray-600 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                {item}
              </button>
            ))}
          </div>

          {/* AKILLI HİZMET ASISTANI */}
          <SmartMatch />
        </div>
      </header>

      {/* İSTATİSTİKLER */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <h4 className="text-3xl md:text-4xl font-black text-gray-900">50.000+</h4>
            <p className="text-gray-400 font-semibold text-sm mt-1">Tamamlanan İş</p>
          </div>
          <div>
            <h4 className="text-3xl md:text-4xl font-black text-emerald-500">10.000+</h4>
            <p className="text-gray-400 font-semibold text-sm mt-1">Aktif Profesyonel</p>
          </div>
          <div>
            <h4 className="text-3xl md:text-4xl font-black text-gray-900">81</h4>
            <p className="text-gray-400 font-semibold text-sm mt-1">İl Kapsamı</p>
          </div>
          <div>
            <h4 className="text-3xl md:text-4xl font-black text-emerald-500">%98</h4>
            <p className="text-gray-400 font-semibold text-sm mt-1">Müşteri Memnuniyeti</p>
          </div>
        </div>
      </section>

      {/* KATEGORİLER */}
      <section id="kategoriler" className="py-24 px-6 bg-gray-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">Hizmet Kategorileri</h2>
            <p className="text-gray-500 font-medium text-lg max-w-2xl mx-auto">İhtiyacınız olan hizmeti seçin, profesyonellerden anında teklif alın.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {KATEGORILER.map((kat) => (
              <button
                key={kat.id}
                onClick={() => navigate('/register')}
                className="group bg-white p-6 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 text-left hover:-translate-y-1"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${kat.color} flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  {kat.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors">{kat.title}</h3>
                <p className="text-xs text-gray-400 font-medium leading-relaxed">{kat.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* NASIL ÇALIŞIR */}
      <section id="nasil-calisir" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">3 Adımda Hizmet Alın</h2>
            <p className="text-gray-500 font-medium text-lg">Dakikalar içinde ihtiyacınıza uygun profesyoneli bulun.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Bağlantı çizgisi */}
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-emerald-200 via-emerald-300 to-emerald-200 z-0"></div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-32 h-32 bg-emerald-50 border-4 border-emerald-100 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
                <span className="text-5xl">📝</span>
              </div>
              <span className="inline-flex items-center justify-center w-8 h-8 bg-emerald-500 text-white text-sm font-black rounded-full mb-4">1</span>
              <h3 className="text-xl font-black text-gray-900 mb-3">Talebinizi Oluşturun</h3>
              <p className="text-gray-500 font-medium text-sm leading-relaxed max-w-xs">Hangi hizmete ihtiyacınız olduğunu, nerede ve ne zaman istediğinizi bize anlatın.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-32 h-32 bg-emerald-500 border-4 border-emerald-200 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20">
                <span className="text-5xl">📩</span>
              </div>
              <span className="inline-flex items-center justify-center w-8 h-8 bg-emerald-500 text-white text-sm font-black rounded-full mb-4">2</span>
              <h3 className="text-xl font-black text-gray-900 mb-3">Teklif Alın</h3>
              <p className="text-gray-500 font-medium text-sm leading-relaxed max-w-xs">İlgili profesyoneller size fiyat ve detay içeren teklifler gönderir.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-32 h-32 bg-emerald-50 border-4 border-emerald-100 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
                <span className="text-5xl">🤝</span>
              </div>
              <span className="inline-flex items-center justify-center w-8 h-8 bg-emerald-500 text-white text-sm font-black rounded-full mb-4">3</span>
              <h3 className="text-xl font-black text-gray-900 mb-3">Profesyoneli Seçin</h3>
              <p className="text-gray-500 font-medium text-sm leading-relaxed max-w-xs">Teklifleri, profil puanlarını ve yorumları karşılaştırarak en uygunuyla çalışmaya başlayın.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PROFESYONELLERİÇİN CTA */}
      <section className="py-24 px-6 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-3xl"></div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold mb-6">
                💼 Profesyoneller İçin
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                Yeteneklerinizi<br /><span className="text-emerald-400">Kazanca</span> Dönüştürün
              </h2>
              <p className="text-gray-400 text-lg font-medium leading-relaxed mb-8">
                Binlerce müşteri her gün hizmet arıyor. Profilinizi oluşturun,
                teklif gönderin ve işlerinizi büyütün.
              </p>
              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 shrink-0">✓</div>
                  <span className="text-gray-300 font-medium">Ücretsiz kayıt, komisyon yok</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 shrink-0">✓</div>
                  <span className="text-gray-300 font-medium">Müşteri portföyünüzü genişletin</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 shrink-0">✓</div>
                  <span className="text-gray-300 font-medium">Puan ve yorum ile güven oluşturun</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/register')}
                className="px-10 py-4 bg-emerald-500 text-white text-lg font-bold rounded-2xl shadow-xl shadow-emerald-500/30 hover:bg-emerald-400 transition-all transform hover:-translate-y-1"
              >
                Profesyonel Olarak Kayıt Ol
              </button>
            </div>

            <div className="hidden lg:grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="bg-gray-800/80 border border-gray-700 rounded-2xl p-6">
                  <span className="text-3xl mb-3 block">🧹</span>
                  <h4 className="text-white font-bold">Temizlik</h4>
                  <p className="text-gray-500 text-sm mt-1">320+ Profesyonel</p>
                </div>
                <div className="bg-gray-800/80 border border-gray-700 rounded-2xl p-6">
                  <span className="text-3xl mb-3 block">🔧</span>
                  <h4 className="text-white font-bold">Tadilat</h4>
                  <p className="text-gray-500 text-sm mt-1">450+ Profesyonel</p>
                </div>
              </div>
              <div className="space-y-4 mt-8">
                <div className="bg-gray-800/80 border border-gray-700 rounded-2xl p-6">
                  <span className="text-3xl mb-3 block">💻</span>
                  <h4 className="text-white font-bold">Yazılım</h4>
                  <p className="text-gray-500 text-sm mt-1">280+ Profesyonel</p>
                </div>
                <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-2xl p-6">
                  <span className="text-3xl mb-3 block">📚</span>
                  <h4 className="text-emerald-400 font-bold">Özel Ders</h4>
                  <p className="text-emerald-500/60 text-sm mt-1">190+ Profesyonel</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SSS */}
      <section id="sss" className="py-24 px-6 bg-gray-50/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">Sıkça Sorulan Sorular</h2>
          </div>

          <div className="space-y-4">
            {SSS.map((item, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <button
                  onClick={() => setAcikSSS(acikSSS === i ? null : i)}
                  className="w-full flex justify-between items-center p-6 text-left"
                >
                  <span className="font-bold text-gray-900 pr-4">{item.q}</span>
                  <span className={`text-2xl text-emerald-500 transform transition-transform ${acikSSS === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {acikSSS === i && (
                  <div className="px-6 pb-6 -mt-2">
                    <p className="text-gray-500 font-medium leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FİNAL CTA */}
      <section className="py-24 bg-emerald-500 text-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/50 via-transparent to-teal-500/50"></div>

        <h2 className="relative z-10 text-4xl md:text-6xl font-black text-white mb-6">Hizmet İçin Doğru Adres</h2>
        <p className="relative z-10 text-emerald-100 text-xl mb-12 max-w-2xl mx-auto font-medium">
          Ücretsiz hesabınızı oluşturun ve binlerce profesyonele anında ulaşın.
        </p>
        <div className="relative z-10 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/register')}
            className="px-12 py-5 bg-white text-emerald-600 text-xl font-black rounded-2xl shadow-2xl hover:bg-gray-50 transition-all transform hover:-translate-y-1"
          >
            Hizmet Al
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-12 py-5 bg-emerald-700 text-white text-xl font-bold rounded-2xl shadow-2xl hover:bg-emerald-800 transition-all transform hover:-translate-y-1 border-2 border-emerald-400/20"
          >
            Hizmet Ver
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-950 text-gray-400 py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12 border-b border-gray-800 pb-12">

          <div className="md:col-span-1">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-xs font-black">HP</div>
              <span className="font-black text-white text-xl">Hizmet Pazarı</span>
            </div>
            <p className="text-sm leading-relaxed mb-6">Türkiye'nin en güvenilir hizmet ve profesyonel eşleştirme platformu.</p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Platform</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><button onClick={() => navigate('/register')} className="hover:text-emerald-400 transition-colors">Hizmet Al</button></li>
              <li><button onClick={() => navigate('/register')} className="hover:text-emerald-400 transition-colors">Profesyonel Ol</button></li>
              <li><button onClick={() => navigate('/kategoriler')} className="hover:text-emerald-400 transition-colors">Kategoriler</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Kurumsal</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Hakkımızda</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Kariyer</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">İletişim</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Destek</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Yardım Merkezi</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Kullanım Koşulları</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">KVKK & Gizlilik</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-sm">
          <p>&copy; 2026 Hizmet Pazarı. Tüm hakları saklıdır.</p>
          <p className="mt-4 md:mt-0">Türkiye'de ❤️ ile geliştirildi</p>
        </div>
      </footer>

    </div>
  );
};

export default Home;
