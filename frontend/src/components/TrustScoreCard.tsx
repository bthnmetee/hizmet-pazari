import { useState } from 'react';

// ─────────────────────────────────────────────
//  GÜVEN SKORU KARTI  –  TrustScoreCard
//
//  Profesyoneller sayfasındaki her profesyonel
//  kartının içine ya da yanına eklenir.
//  Puan bileşenlerini animasyonlu halka
//  diyagramıyla gösterir – Türkiye'deki hiçbir
//  benzer platformda bu yok.
// ─────────────────────────────────────────────

interface TrustData {
    kimlikOnay: boolean;
    vergiLevhasi: boolean;
    tamamlananIs: number;
    iptalOrani: number;   // 0-100
    yorumPuani: number;   // 0-5
    yanıtSuresi: number;  // dakika
    platformYasi: number; // ay
}

function hesaplaGuvenSkoru(d: TrustData): number {
    let score = 0;
    if (d.kimlikOnay) score += 20;
    if (d.vergiLevhasi) score += 20;
    score += Math.min(d.tamamlananIs / 5, 20);           // max 20
    score += Math.max(0, 15 - d.iptalOrani * 0.15);       // max 15
    score += (d.yorumPuani / 5) * 15;                     // max 15
    score += Math.max(0, 5 - d.yanıtSuresi / 60);         // max 5
    score += Math.min(d.platformYasi / 6, 5);              // max 5
    return Math.round(Math.min(score, 100));
}

function GuvenHalkasi({ score, size = 80 }: { score: number; size?: number }) {
    const r = size / 2 - 8;
    const circ = 2 * Math.PI * r;
    const offset = circ - (score / 100) * circ;

    const renk =
        score >= 80 ? '#10b981' :
            score >= 60 ? '#f59e0b' :
                '#ef4444';

    const etiket =
        score >= 80 ? 'Çok Güvenilir' :
            score >= 60 ? 'Güvenilir' :
                'Yeni Üye';

    return (
        <div className="flex flex-col items-center gap-1">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth="6" />
                <circle
                    cx={size / 2} cy={size / 2} r={r}
                    fill="none"
                    stroke={renk}
                    strokeWidth="6"
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
                <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="middle" fontSize="14" fontWeight="800" fill={renk}>
                    {score}
                </text>
            </svg>
            <span className="text-xs font-bold" style={{ color: renk }}>{etiket}</span>
        </div>
    );
}

interface Props {
    data: TrustData;
    profesyonelAdi: string;
    expanded?: boolean;
}

export default function TrustScoreCard({ data, profesyonelAdi, expanded = false }: Props) {
    const [acik, setAcik] = useState(expanded);
    const skor = hesaplaGuvenSkoru(data);

    const detaylar = [
        { label: 'Kimlik Doğrulama', value: data.kimlikOnay ? '✓ Onaylı' : '✗ Bekliyor', ok: data.kimlikOnay, puan: 20 },
        { label: 'Vergi Levhası', value: data.vergiLevhasi ? '✓ Onaylı' : '✗ Bekliyor', ok: data.vergiLevhasi, puan: 20 },
        { label: 'Tamamlanan İş', value: `${data.tamamlananIs} iş`, ok: data.tamamlananIs > 10, puan: Math.round(Math.min(data.tamamlananIs / 5, 20)) },
        { label: 'İptal Oranı', value: `%${data.iptalOrani}`, ok: data.iptalOrani < 10, puan: Math.round(Math.max(0, 15 - data.iptalOrani * 0.15)) },
        { label: 'Müşteri Puanı', value: `${data.yorumPuani}/5 ★`, ok: data.yorumPuani >= 4, puan: Math.round((data.yorumPuani / 5) * 15) },
        { label: 'Yanıt Süresi', value: data.yanıtSuresi < 60 ? `${data.yanıtSuresi} dk` : `${Math.round(data.yanıtSuresi / 60)}s`, ok: data.yanıtSuresi < 60, puan: Math.round(Math.max(0, 5 - data.yanıtSuresi / 60)) },
    ];

    return (
        <div className="bg-white border border-navy-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Özet satırı */}
            <button
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-navy-50/50 transition-colors"
                onClick={() => setAcik(a => !a)}
            >
                <div className="flex items-center gap-3">
                    <GuvenHalkasi score={skor} size={56} />
                    <div className="text-left">
                        <p className="text-sm font-black text-navy-900">{profesyonelAdi}</p>
                        <p className="text-xs text-navy-300 font-medium">Güven Skoru</p>
                    </div>
                </div>
                <span className={`text-navy-300 text-lg transition-transform ${acik ? 'rotate-180' : ''}`}>⌄</span>
            </button>

            {/* Detay */}
            {acik && (
                <div className="border-t border-gray-50 px-4 py-4 space-y-2.5">
                    <p className="text-xs font-black text-navy-400 uppercase tracking-wider mb-3">Skor Kırılımı</p>
                    {detaylar.map(d => (
                        <div key={d.label} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${d.ok ? 'bg-navy-700' : 'bg-gray-200'}`} />
                                <span className="text-xs text-navy-600 font-medium">{d.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold ${d.ok ? 'text-navy-700' : 'text-navy-300'}`}>{d.value}</span>
                                <span className="text-xs font-black text-navy-200">+{d.puan}</span>
                            </div>
                        </div>
                    ))}
                    <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between items-center">
                        <span className="text-xs text-navy-300 font-semibold">Toplam Skor</span>
                        <span className="text-base font-black text-gold-500">{skor}/100</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Yardımcı: Mevcut provider kartlarına entegrasyon ───
// Profesyoneller.tsx içinde her provider için şu veriyi
// oluşturup bileşeni render edebilirsiniz:
//
// const trustData: TrustData = {
//   kimlikOnay: provider.isVerified,
//   vergiLevhasi: provider.vergiLevhasi,
//   tamamlananIs: provider.completedJobs ?? 0,
//   iptalOrani: provider.cancelRate ?? 0,
//   yorumPuani: provider.rating ?? 0,
//   yanıtSuresi: provider.avgResponseMinutes ?? 120,
//   platformYasi: provider.monthsOnPlatform ?? 0,
// };
// <TrustScoreCard data={trustData} profesyonelAdi={provider.companyName} />
