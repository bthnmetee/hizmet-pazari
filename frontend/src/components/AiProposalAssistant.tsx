import { useState } from 'react';
import axiosInstance from '../utils/axiosInstance';

// ─────────────────────────────────────────────────────────────────────────────
//  🤖 AKİLLI TEKLİF ASISTANI  –  AiProposalAssistant
//
//  HizmetPaneli'ndeki teklif modalına entegre edilir.
//  Profesyonel, ilana bakarak "Ne yazacağımı bilmiyorum"
//  sorununu çözer. Backend proxy üzerinden AI kullanarak:
//    1. İlana özel kişiselleştirilmiş teklif mesajı üretir
//    2. Rekabete göre fiyat aralığı önerir
//    3. Profesyonelin hizmet alanıyla eşleştirme yapar
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
    ilan: {
        title: string;
        description: string;
        category: string;
        location: string;
        details?: { movingDate?: string };
    };
    providerServices: string[];
    onApply: (message: string, price: string) => void;
}

interface AiResult {
    message: string;
    priceMin: number;
    priceMax: number;
    tips: string[];
}

export default function AiProposalAssistant({ ilan, providerServices, onApply }: Props) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AiResult | null>(null);
    const [error, setError] = useState('');
    const [editedMessage, setEditedMessage] = useState('');
    const [editedPrice, setEditedPrice] = useState('');

    const generateProposal = async () => {
        setLoading(true);
        setError('');
        setResult(null);

        try {
            // ✅ Backend proxy üzerinden AI'ya istek at
            const response = await axiosInstance.post('/ai/generate-proposal', {
                title: ilan.title,
                description: ilan.description,
                category: ilan.category,
                location: ilan.location,
                movingDate: ilan.details?.movingDate,
                providerServices: providerServices
            });

            const parsed: AiResult = response.data;
            setResult(parsed);
            setEditedMessage(parsed.message);
            setEditedPrice(String(Math.round((parsed.priceMin + parsed.priceMax) / 2)));
        } catch {
            setError('AI yanıt oluşturulamadı. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => { setOpen(true); generateProposal(); }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-violet-200 text-violet-600 font-bold text-sm hover:bg-violet-50 hover:border-violet-300 transition-all group"
            >
                <span className="text-lg group-hover:scale-125 transition-transform">🤖</span>
                AI ile Otomatik Teklif Oluştur
                <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs font-black">YENİ</span>
            </button>
        );
    }

    return (
        <div className="rounded-2xl border-2 border-violet-100 bg-violet-50/50 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🤖</span>
                    <span className="text-white font-black text-sm">Akıllı Teklif Asistanı</span>
                </div>
                <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white text-lg">✕</button>
            </div>

            <div className="p-4">
                {loading && (
                    <div className="flex flex-col items-center py-6 gap-3">
                        <div className="flex gap-1.5">
                            {[0, 1, 2].map(i => (
                                <div key={i} className="w-2.5 h-2.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                            ))}
                        </div>
                        <p className="text-sm text-violet-600 font-bold">İlan analiz ediliyor, teklif hazırlanıyor...</p>
                    </div>
                )}

                {error && (
                    <div className="py-4 text-center">
                        <p className="text-red-500 text-sm font-bold mb-3">{error}</p>
                        <button onClick={generateProposal} className="text-xs font-bold text-violet-600 underline">Tekrar Dene</button>
                    </div>
                )}

                {result && !loading && (
                    <div className="space-y-4">
                        {/* Fiyat Önerisi */}
                        <div className="bg-white rounded-xl p-3 border border-violet-100">
                            <p className="text-xs font-black text-navy-400 uppercase tracking-wider mb-2">Önerilen Fiyat Aralığı</p>
                            <div className="flex items-center gap-3">
                                <span className="text-navy-700 font-black text-lg">₺{result.priceMin.toLocaleString('tr-TR')} – ₺{result.priceMax.toLocaleString('tr-TR')}</span>
                                <span className="text-xs text-navy-300 font-medium">AI tahmini</span>
                            </div>
                        </div>

                        {/* Mesaj Düzenleyici */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <p className="text-xs font-black text-navy-400 uppercase tracking-wider">Teklif Mesajı</p>
                                <button onClick={generateProposal} className="text-xs text-violet-500 font-bold hover:text-violet-700 transition-colors">
                                    ↺ Yenile
                                </button>
                            </div>
                            <textarea
                                value={editedMessage}
                                onChange={e => setEditedMessage(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2.5 bg-white border border-violet-200 rounded-xl text-sm font-medium text-navy-800 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 resize-none transition-all"
                            />
                            <p className="text-xs text-navy-300 mt-1">✏️ Düzenleyebilirsiniz</p>
                        </div>

                        {/* İpuçları */}
                        {result.tips.length > 0 && (
                            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                                <p className="text-xs font-black text-amber-700 uppercase tracking-wider mb-2">💡 Teklifinizi Güçlendirin</p>
                                <ul className="space-y-1">
                                    {result.tips.map((tip, i) => (
                                        <li key={i} className="text-xs text-amber-700 font-medium flex gap-1.5">
                                            <span className="shrink-0">•</span>{tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Fiyat input */}
                        <div>
                            <label className="text-xs font-black text-navy-400 uppercase tracking-wider block mb-1.5">Teklifinizin Fiyatı (TL)</label>
                            <input
                                type="number"
                                value={editedPrice}
                                onChange={e => setEditedPrice(e.target.value)}
                                className="w-full px-3 py-2.5 bg-white border border-violet-200 rounded-xl text-sm font-bold focus:outline-none focus:border-violet-400"
                            />
                        </div>

                        {/* Uygula butonu */}
                        <button
                            type="button"
                            onClick={() => { onApply(editedMessage, editedPrice); setOpen(false); }}
                            className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-violet-500/25 text-sm"
                        >
                            ✅ Bu Teklifi Kullan
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
