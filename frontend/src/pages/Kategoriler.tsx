import { useNavigate } from 'react-router-dom';

const KATEGORILER = [
  { id: 'temizlik', icon: '🧹', title: 'Temizlik', desc: 'Ev temizliği, ofis temizliği, inşaat sonrası temizlik, cam silme', color: 'from-sky-400 to-sky-600' },
  { id: 'tadilat', icon: '🔧', title: 'Tadilat & Boya', desc: 'İç-dış boya, alçı sıva, fayans döşeme, parke, duvar kağıdı', color: 'from-amber-400 to-amber-600' },
  { id: 'nakliyat', icon: '🚚', title: 'Nakliyat', desc: 'Şehiriçi nakliyat, şehirlerarası nakliyat, evden eve, parça eşya taşıma, ofis taşıma, eşya depolama', color: 'from-navy-400 to-navy-600' },
  { id: 'yazilim', icon: '💻', title: 'Yazılım & Tasarım', desc: 'Web sitesi, mobil uygulama, logo tasarım, sosyal medya yönetimi', color: 'from-violet-400 to-violet-600' },
  { id: 'ozelders', icon: '📚', title: 'Özel Ders', desc: 'Matematik, İngilizce, üniversite hazırlık, müzik, enstrüman', color: 'from-rose-400 to-rose-600' },
  { id: 'guzellik', icon: '✂️', title: 'Güzellik & Bakım', desc: 'Kuaför, cilt bakımı, manikür, pedikür, kalıcı makyaj', color: 'from-pink-400 to-pink-600' },
  { id: 'bahce', icon: '🌿', title: 'Bahçe & Peyzaj', desc: 'Bahçe düzenleme, çim biçme, ağaç budama, sulama sistemi', color: 'from-lime-400 to-lime-600' },
  { id: 'elektrik', icon: '🔌', title: 'Elektrik & Tesisat', desc: 'Elektrik arıza, tesisat, petek temizliği, kombi bakım', color: 'from-orange-400 to-orange-600' },
  { id: 'fotograf', icon: '📷', title: 'Fotoğraf & Video', desc: 'Düğün fotoğrafçılığı, ürün çekimi, drone, etkinlik videosu', color: 'from-indigo-400 to-indigo-600' },
  { id: 'insaat', icon: '🏗️', title: 'İnşaat & Dekorasyon', desc: 'Mutfak yenileme, banyo renovasyon, mobilya montaj, alçıpan', color: 'from-teal-400 to-teal-600' },
  { id: 'klima', icon: '❄️', title: 'Klima & Beyaz Eşya', desc: 'Klima montaj, bulaşık makinesi tamiri, çamaşır makinesi bakım', color: 'from-cyan-400 to-cyan-600' },
  { id: 'diger', icon: '⚡', title: 'Diğer Hizmetler', desc: 'Aradığınız hizmeti bulamadınız mı? Bize yazın, doğru profesyoneli bulalım.', color: 'from-gray-400 to-gray-600' },
];

export default function Kategoriler() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* NAVBAR */}
      <nav className="bg-white/90 backdrop-blur-xl border-b border-navy-100 py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 bg-navy-800 rounded-xl flex items-center justify-center shadow-lg shadow-navy-800/20">
            <span className="text-xl text-white font-black">HP</span>
          </div>
          <span className="text-2xl font-black tracking-tight text-navy-900">Hizmet<span className="text-gold-500">Pazarı</span></span>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => navigate('/login')} className="px-5 py-2.5 text-sm font-bold rounded-xl text-navy-600 hover:bg-navy-50 transition-colors">Giriş Yap</button>
          <button onClick={() => navigate('/register')} className="px-5 py-2.5 text-sm font-bold bg-navy-800 text-white rounded-xl shadow-lg shadow-navy-800/20 hover:bg-navy-700 transition-all">Ücretsiz Kayıt</button>
        </div>
      </nav>

      {/* İÇERİK */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-black text-navy-900 mb-4">Tüm Hizmet Kategorileri</h1>
          <p className="text-navy-400 font-medium text-lg max-w-2xl mx-auto">İhtiyacınız olan hizmeti seçin ve dakikalar içinde profesyonellerden teklif almaya başlayın.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {KATEGORILER.map((kat, index) => (
            <button
              key={kat.id}
              onClick={() => navigate('/register')}
              className="group bg-white p-8 rounded-3xl border border-navy-100 hover:border-navy-300 hover:shadow-xl hover:shadow-navy-500/5 transition-all duration-300 text-left hover:-translate-y-1 animate-fade-in-up opacity-0"
              style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${kat.color} flex items-center justify-center text-3xl mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {kat.icon}
              </div>
              <h3 className="text-xl font-black text-navy-800 mb-2 group-hover:text-navy-600 transition-colors">{kat.title}</h3>
              <p className="text-sm text-navy-300 font-medium leading-relaxed">{kat.desc}</p>
              <div className="mt-4 text-navy-500 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                Teklif Al →
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
