import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TrustScoreCard from '../components/TrustScoreCard';
import axiosInstance from '../utils/axiosInstance';

export default function Profesyoneller() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await axiosInstance.get('/providers/showcase');
        setProviders(response.data);
      } catch (error) {
        console.error('Profesyoneller çekilirken hata oluştu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  return (
    <div className="bg-white min-h-screen font-sans">
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

      <div className="max-w-[1920px] mx-auto py-16 px-6 lg:px-10">
        {/* Başlık */}
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-black text-navy-900 tracking-tight mb-6">
            En İyi Profesyonellerimiz
          </h1>
          <p className="text-lg text-navy-400 font-medium leading-relaxed">
            Platformumuzdaki onaylı hizmet verenleri inceleyin.
            Onlarla çalışmak için tek yapmanız gereken bir <b className="text-navy-700">hizmet talebi</b> oluşturmak!
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-navy-300 font-bold text-xl animate-pulse">Profesyoneller Yükleniyor...</div>
        ) : providers.length === 0 ? (
          <div className="text-center py-20 bg-navy-50 rounded-3xl border border-navy-100">
            <span className="text-6xl block mb-4">🏢</span>
            <h3 className="text-2xl font-bold text-navy-600">Henüz onaylı bir profesyonel bulunmuyor.</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {providers.map((pro, index) => (
              <div key={pro._id} className="bg-white rounded-3xl shadow-sm border border-navy-100 p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full animate-fade-in-up opacity-0" style={{ animationDelay: `${index * 0.08}s`, animationFillMode: 'forwards' }}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-navy-600 to-navy-800 text-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg shadow-navy-800/20 shrink-0 overflow-hidden">
                    {pro.profileImage ? (
                      <img src={pro.profileImage} alt={pro.companyName || pro.name} className="w-full h-full object-cover" />
                    ) : (
                      (pro.companyName || pro.name).charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-navy-900 text-lg line-clamp-1">{pro.companyName || pro.name}</h3>
                    <span className="inline-block mt-1 bg-navy-50 text-navy-600 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wide">
                      {pro.serviceCategory}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4 bg-amber-50 w-max px-3 py-1.5 rounded-lg border border-amber-100">
                  <span className="text-amber-500 text-lg">⭐</span>
                  <span className="font-black text-navy-800">{pro.averageRating === 0 ? 'Yeni' : pro.averageRating?.toFixed(1)}</span>
                  <span className="text-sm text-navy-400 font-medium">({pro.reviewCount || 0} Yorum)</span>
                </div>

                {pro.about && (
                  <p className="text-navy-500 font-medium text-sm leading-relaxed mb-8 flex-grow line-clamp-3">
                    "{pro.about}"
                  </p>
                )}

                {pro.services && pro.services.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {pro.services.slice(0, 3).map((s: string, i: number) => (
                      <span key={i} className="text-xs font-bold bg-navy-50 text-navy-500 px-2 py-1 rounded-lg border border-navy-100">{s}</span>
                    ))}
                  </div>
                )}

                {/* GÜVEN SKORU */}
                <div className="mb-4">
                  <TrustScoreCard
                    profesyonelAdi={pro.companyName || pro.name}
                    data={{
                      kimlikOnay: pro.isVerified ?? false,
                      vergiLevhasi: !!pro.vergiLevhasi,
                      tamamlananIs: pro.completedJobs ?? pro.reviewCount ?? 0,
                      iptalOrani: pro.cancelRate ?? 0,
                      yorumPuani: pro.averageRating ?? 0,
                      yanıtSuresi: pro.avgResponseMinutes ?? 90,
                      platformYasi: pro.monthsOnPlatform ?? 1,
                    }}
                  />
                </div>

                <div className="mt-auto pt-6 border-t border-navy-100">
                  <p className="text-xs text-navy-300 font-semibold mb-3 text-center">İletişime geçmek için talep oluşturun</p>
                  <Link
                    to="/register"
                    className="block w-full text-center bg-navy-50 text-navy-700 font-bold py-3.5 rounded-xl hover:bg-navy-800 hover:text-white transition-all duration-300"
                  >
                    Hemen Talep Oluştur
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
