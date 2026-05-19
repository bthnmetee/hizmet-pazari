import { useState } from 'react';
import axiosInstance from '../utils/axiosInstance';

export default function AiInsights() {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/ai/insights');
      setInsights(res.data.insights || []);
      setLoaded(true);
    } catch { setInsights([]); }
    finally { setLoading(false); }
  };

  if (!loaded) {
    return (
      <button onClick={fetchInsights} disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl border-2 border-dashed border-purple-200 text-purple-600 font-bold text-sm hover:bg-purple-50 hover:border-purple-300 transition-all group disabled:opacity-50">
        {loading ? (
          <><div className="flex gap-1">{[0,1,2].map(i=>(<div key={i} className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>))}</div> Analiz ediliyor...</>
        ) : (
          <><span className="text-2xl group-hover:scale-125 transition-transform">🧠</span> AI İçgörülerini Yükle <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-black">AI</span></>
        )}
      </button>
    );
  }

  const priorityStyles: Record<string, string> = {
    high: 'border-l-red-500 bg-red-50/50',
    medium: 'border-l-amber-500 bg-amber-50/50',
    low: 'border-l-emerald-500 bg-emerald-50/50',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧠</span>
          <h3 className="font-black text-navy-900">AI İçgörüleri</h3>
          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-black">AI</span>
        </div>
        <button onClick={fetchInsights} disabled={loading} className="text-xs font-bold text-purple-500 hover:text-purple-700 transition-colors disabled:opacity-50">↺ Yenile</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, i) => (
          <div key={i} className={`rounded-2xl border border-navy-100 border-l-4 p-5 transition-all hover:shadow-md ${priorityStyles[insight.priority] || priorityStyles.medium}`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">{insight.icon}</span>
              <div>
                <h4 className="font-black text-navy-900 text-sm mb-1">{insight.title}</h4>
                <p className="text-xs text-navy-500 font-medium leading-relaxed">{insight.description}</p>
                <span className={`inline-block mt-2 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                  insight.priority === 'high' ? 'bg-red-100 text-red-600' :
                  insight.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                  'bg-emerald-100 text-emerald-600'
                }`}>
                  {insight.priority === 'high' ? 'Yüksek Öncelik' : insight.priority === 'medium' ? 'Orta Öncelik' : 'Düşük Öncelik'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
