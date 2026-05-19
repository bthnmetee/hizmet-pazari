import { useState } from 'react';
import axiosInstance from '../utils/axiosInstance';

interface Props {
  category: string;
  title?: string;
  location: string;
  description: string;
  details?: any;
  fromIl?: string;
  toIl?: string;
  fromIlce?: string;
  toIlce?: string;
}

export default function AiPriceEstimator({ category, title, location, description, details, fromIl, toIl, fromIlce, toIlce }: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  const isNakliyatCategory = category === 'nakliyat' || category.includes('nakliyat');
  const hasRequiredInputs = Boolean(category && fromIl && fromIlce && (!isNakliyatCategory || toIl));

  const estimate = async () => {
    setVisible(true);

    if (!hasRequiredInputs) {
      setData({
        error: isNakliyatCategory
          ? 'Fiyat tahmini icin lutfen nereden ve nereye bilgisini secin.'
          : 'Fiyat tahmini icin lutfen il ve ilce bilgisini secin.'
      });
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post('/ai/estimate-price', {
        category,
        title,
        location,
        description,
        details,
        fromIl,
        toIl,
        fromIlce,
        toIlce,
      });
      setData(res.data);
    } catch {
      setData({ error: 'Tahmin yapilamadi. Lutfen tekrar deneyin.' });
    } finally {
      setLoading(false);
    }
  };

  if (!visible) {
    return (
      <button
        type="button"
        onClick={estimate}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-emerald-200 text-emerald-600 font-bold text-sm hover:bg-emerald-50 hover:border-emerald-300 transition-all group"
      >
        <span className="text-lg group-hover:scale-125 transition-transform">AI</span>
        AI ile Piyasa Fiyatini Ogren
        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-black">AI</span>
      </button>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-emerald-100 bg-emerald-50/50 overflow-hidden animate-fade-in-up">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">AI</span>
          <span className="text-white font-black text-sm">AI Fiyat Tahmini</span>
        </div>
        <button onClick={() => setVisible(false)} className="text-white/70 hover:text-white text-lg">x</button>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <p className="text-sm text-emerald-600 font-bold">Piyasa analizi yapiliyor...</p>
          </div>
        ) : data && !data.error ? (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 border border-emerald-100">
              <p className="text-xs font-black text-navy-400 uppercase tracking-wider mb-3">Tahmini Fiyat Araligi</p>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-3xl font-black text-navy-900">TL {data.priceMin?.toLocaleString('tr-TR')}</span>
                <span className="text-navy-300 font-bold text-lg mb-0.5">-</span>
                <span className="text-3xl font-black text-emerald-600">TL {data.priceMax?.toLocaleString('tr-TR')}</span>
              </div>
              <div className="w-full h-2 bg-navy-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-1000" style={{ width: `${data.confidence || 80}%` }} />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs font-bold text-navy-300">Dusuk</span>
                <span className="text-xs font-bold text-navy-300">Ortalama: TL {data.avgPrice?.toLocaleString('tr-TR')}</span>
                <span className="text-xs font-bold text-navy-300">Yuksek</span>
              </div>
            </div>

            <div className="flex gap-3">
              {data.info && (
                <div className="flex-1 bg-white rounded-xl p-3 border border-emerald-100 text-center">
                  <p className="text-xs font-bold text-navy-600">{data.info}</p>
                </div>
              )}
              {data.evTipi && (
                <div className="flex-1 bg-white rounded-xl p-3 border border-emerald-100 text-center">
                  <p className="text-xs font-bold text-navy-600">{data.evTipi} Ev</p>
                </div>
              )}
              <div className="flex-1 bg-white rounded-xl p-3 border border-emerald-100 text-center">
                <p className="text-xs font-bold text-navy-600">{data.analyzedOffers}+ teklif analizi</p>
              </div>
            </div>

            {data.mesafeKm && (
              <div className="bg-white rounded-xl p-3 border border-emerald-100 flex items-center justify-center gap-3">
                <span className="text-sm font-bold text-navy-600">Tahmini Mesafe: ~{data.mesafeKm} km</span>
              </div>
            )}

            <p className="text-xs text-emerald-600 font-medium text-center">Bu tahmin, benzer hizmet verilerine gore olusturulmustur.</p>
            <button onClick={estimate} className="w-full text-xs font-bold text-emerald-500 hover:text-emerald-700 transition-colors">Yeniden Hesapla</button>
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-red-500 text-sm font-bold">{data?.error || 'Tahmin yapilamadi.'}</p>
            <button onClick={estimate} className="text-xs font-bold text-emerald-600 underline mt-2">Tekrar Dene</button>
          </div>
        )}
      </div>
    </div>
  );
}
