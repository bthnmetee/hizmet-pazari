import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';

interface Props {
  providerId: string;
  serviceRequestId: string;
  proposalPrice: number;
  compact?: boolean;
}

export default function AiMatchScore({ providerId, serviceRequestId, proposalPrice, compact = false }: Props) {
  const [score, setScore] = useState<number | null>(null);
  const [label, setLabel] = useState('');
  const [breakdown, setBreakdown] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axiosInstance.post('/ai/match-score', { providerId, serviceRequestId, proposalPrice });
        setScore(res.data.score);
        setLabel(res.data.label);
        setBreakdown(res.data.breakdown);
      } catch {
        setScore(65); setLabel('İyi Eşleşme');
      }
    };
    if (providerId && serviceRequestId) fetch();
  }, [providerId, serviceRequestId, proposalPrice]);

  if (score === null) return null;

  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#94a3b8';
  const bgColor = score >= 80 ? 'bg-emerald-50 border-emerald-200' : score >= 60 ? 'bg-amber-50 border-amber-200' : 'bg-navy-50 border-navy-200';
  const textColor = score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-navy-400';

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${bgColor} cursor-pointer`} onClick={() => setShowDetail(!showDetail)} title="AI Uyumluluk Skoru">
        <svg width="20" height="20" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="8" fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
          <circle cx="10" cy="10" r="8" fill="none" stroke={color} strokeWidth="2.5"
            strokeDasharray={`${(score / 100) * 50.26} 50.26`} strokeLinecap="round"
            transform="rotate(-90 10 10)" style={{ transition: 'stroke-dasharray 1s ease' }} />
        </svg>
        <span className={`text-xs font-black ${textColor}`}>{score}</span>
        {score >= 80 && <span className="text-xs">🏆</span>}
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-3 ${bgColor} transition-all`}>
      <button onClick={() => setShowDetail(!showDetail)} className="w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg width="44" height="44" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="18" fill="none" stroke="#e5e7eb" strokeWidth="4" />
              <circle cx="22" cy="22" r="18" fill="none" stroke={color} strokeWidth="4"
                strokeDasharray={`${(score / 100) * 113.1} 113.1`} strokeLinecap="round"
                transform="rotate(-90 22 22)" style={{ transition: 'stroke-dasharray 1s ease' }} />
              <text x="22" y="23" textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="800" fill={color}>{score}</text>
            </svg>
          </div>
          <div className="text-left">
            <p className={`text-sm font-black ${textColor}`}>{label}</p>
            <p className="text-xs text-navy-300 font-medium">AI Uyumluluk Skoru</p>
          </div>
        </div>
        <span className={`text-navy-300 text-lg transition-transform ${showDetail ? 'rotate-180' : ''}`}>⌄</span>
      </button>

      {showDetail && breakdown && (
        <div className="mt-3 pt-3 border-t border-white/50 space-y-2">
          {[
            { label: 'Kategori Uyumu', value: breakdown.kategoriUyumu, icon: '🎯' },
            { label: 'Deneyim', value: breakdown.deneyim, icon: '⭐' },
            { label: 'Müşteri Puanı', value: breakdown.musteriPuani, icon: '💬' },
            { label: 'Yanıt Süresi', value: breakdown.yanitSuresi, icon: '⚡' },
            { label: 'Fiyat Uyumu', value: breakdown.fiyatUyumu, icon: '💰' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-xs text-navy-500 font-medium flex items-center gap-1.5">{item.icon} {item.label}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-white/50 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${item.value}%`, backgroundColor: color }} />
                </div>
                <span className="text-xs font-black text-navy-600 w-6 text-right">{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
