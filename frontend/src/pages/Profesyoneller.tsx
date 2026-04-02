import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Profesyoneller() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/providers/showcase');
        if (response.ok) {
          const data = await response.json();
          setProviders(data);
        }
      } catch (error) {
        console.error('Profesyoneller çekilirken hata oluştu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen py-16 px-6 lg:px-10">
      <div className="max-w-[1920px] mx-auto">
        
        {/* Sayfa Başlığı */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
            En İyi Profesyonellerimiz
          </h1>
          <p className="text-lg text-slate-500 font-medium leading-relaxed">
            Platformumuzdaki en yüksek puanlı ve onaylı hizmet verenleri inceleyin. 
            Onlarla çalışmak için tek yapmanız gereken bir <b className="text-blue-600">hizmet talebi (ilan)</b> oluşturmak!
          </p>
        </div>

        {/* Yükleniyor veya Boş Durumu */}
        {loading ? (
          <div className="text-center py-20 text-slate-500 font-bold text-xl animate-pulse">Profesyoneller Yükleniyor...</div>
        ) : providers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-2xl font-bold text-slate-700">Henüz onaylı bir profesyonel bulunmuyor.</h3>
          </div>
        ) : (
          
          /* Profesyoneller Grid (Izgara) Yapısı */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {providers.map((pro) => (
              <div key={pro._id} className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                
                {/* Üst Kısım: Avatar ve İsim */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-2xl flex items-center justify-center text-2xl font-extrabold shadow-md shrink-0">
                    {pro.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg line-clamp-1">{pro.name}</h3>
                    <span className="inline-block mt-1 bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wide">
                      {pro.serviceCategory}
                    </span>
                  </div>
                </div>

                {/* Puan ve Yorum Sayısı */}
                <div className="flex items-center gap-2 mb-4 bg-orange-50 w-max px-3 py-1.5 rounded-lg border border-orange-100">
                  <span className="text-orange-500 text-lg">⭐</span>
                  <span className="font-extrabold text-slate-800">{pro.averageRating === 0 ? 'Yeni' : pro.averageRating.toFixed(1)}</span>
                  <span className="text-sm text-slate-500 font-medium">({pro.reviewCount} Yorum)</span>
                </div>

                {/* Hakkında Yazısı */}
                <p className="text-slate-600 font-medium text-sm leading-relaxed mb-8 flex-grow line-clamp-3">
                  "{pro.about}"
                </p>

                {/* Alt Kısım: İletişime Geç Butonu (İlan Açmaya Yönlendirir) */}
                <div className="mt-auto pt-6 border-t border-slate-100">
                  <p className="text-xs text-slate-400 font-semibold mb-3 text-center">İletişime geçmek için talep oluşturun</p>
                  <Link 
                    to="/musteri-paneli" // <-- Kendi müşteri paneli rotanla aynı olduğundan emin ol! (Örn: /musteri)
                    className="block w-full text-center bg-blue-50 text-blue-700 font-bold py-3.5 rounded-xl hover:bg-blue-600 hover:text-white transition-colors"
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