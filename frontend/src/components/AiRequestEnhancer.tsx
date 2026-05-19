import { useState } from 'react';
import axiosInstance from '../utils/axiosInstance';

interface Props {
  category: string;
  title: string;
  description: string;
  location: string;
  onApply: (enhanced: string) => void;
}

export default function AiRequestEnhancer({ category, title, description, location, onApply }: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  const enhance = async () => {
    setVisible(true);

    if ((!description || description.trim().length < 5) && (!title || title.trim().length < 3)) {
      setData({ error: 'Aciklamayi guclendirmek icin lutfen kisa da olsa baslik veya aciklama girin.' });
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post('/ai/enhance-request', { category, title, description, location });
      setData(res.data);
    } catch {
      setData({ error: 'Islem yapilamadi. Lutfen tekrar deneyin.' });
    } finally {
      setLoading(false);
    }
  };

  if (!visible) {
    return (
      <button
        type="button"
        onClick={enhance}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-blue-200 text-blue-600 font-bold text-sm hover:bg-blue-50 hover:border-blue-300 transition-all group"
      >
        <span className="text-lg group-hover:scale-125 transition-transform">AI</span>
        AI ile Aciklamayi Guclendir
        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-black">AI</span>
      </button>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-blue-100 bg-blue-50/50 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">AI</span>
          <span className="text-white font-black text-sm">AI Talep Guclendirici</span>
        </div>
        <button onClick={() => setVisible(false)} className="text-white/70 hover:text-white text-lg">x</button>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <p className="text-sm text-blue-600 font-bold">Aciklama analiz ediliyor...</p>
          </div>
        ) : data && !data.error ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                <p className="text-xs font-black text-red-400 uppercase tracking-wider mb-1">Orijinal</p>
                <p className="text-sm text-navy-600 font-medium">{data.original}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3 border border-green-200">
                <p className="text-xs font-black text-green-600 uppercase tracking-wider mb-1">AI ile Guclendirildi</p>
                <p className="text-sm text-navy-800 font-medium">{data.enhanced}</p>
              </div>
            </div>

            {data.addedDetails?.length > 0 && (
              <div className="bg-white rounded-xl p-3 border border-blue-100">
                <p className="text-xs font-black text-blue-600 uppercase tracking-wider mb-2">Eklenen Detaylar</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.addedDetails.map((d: string, i: number) => (
                    <span key={i} className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">{d}</span>
                  ))}
                </div>
              </div>
            )}

            {data.suggestedQuestions?.length > 0 && (
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                <p className="text-xs font-black text-amber-600 uppercase tracking-wider mb-2">Ekleyebileceginiz Bilgiler</p>
                <ul className="space-y-1">
                  {data.suggestedQuestions.map((q: string, i: number) => (
                    <li key={i} className="text-xs text-amber-700 font-medium flex gap-1.5"><span>*</span>{q}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setVisible(false)} className="flex-1 py-3 bg-navy-50 text-navy-400 font-bold rounded-xl hover:bg-navy-100 border border-navy-100 text-sm">Hayir, Orijinali Kalsin</button>
              <button onClick={() => { onApply(data.enhanced); setVisible(false); }} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 text-sm transition-all">Guclendirilmis Metni Kullan</button>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-red-500 text-sm font-bold">{data?.error || 'Islem yapilamadi.'}</p>
            <button onClick={enhance} className="text-xs font-bold text-blue-600 underline mt-2">Tekrar Dene</button>
          </div>
        )}
      </div>
    </div>
  );
}
