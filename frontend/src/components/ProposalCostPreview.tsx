import { useState } from 'react';

// ─────────────────────────────────────────────
//  TEKLİF MALİYET HESAPLAYICI  –  ProposalCostPreview
// ─────────────────────────────────────────────

interface Props {
    gercekTeklifSayisi: number; // İlana gelen gerçek toplam teklif sayısı
    teklifFiyati: number;       // kullanıcının girdiği TL fiyatı
    bakiye: number;             // mevcut kredi bakiyesi
    teklifMaliyeti: number;     // backend'den gelen teklif başına maliyet
    onGonder: () => void;
    gondermeyiOnayla?: boolean; // form gönderim hazır mı
}

function RekabetGostergesi({ skor }: { skor: number }) {
    const renkler = ['bg-navy-700', 'bg-navy-700', 'bg-amber-400', 'bg-orange-400', 'bg-red-400'];
    const etiketler = ['Çok Düşük', 'Düşük', 'Orta', 'Yüksek', 'Çok Yüksek'];
    const idx = Math.max(0, Math.min(4, skor - 1));

    return (
        <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(i => (
                    <div
                        key={i}
                        className={`h-2 w-3 rounded-sm transition-all ${i <= skor ? renkler[idx] : 'bg-navy-100'}`}
                    />
                ))}
            </div>
            <span className={`text-xs font-bold ${idx <= 1 ? 'text-navy-700' : idx === 2 ? 'text-amber-600' : 'text-red-500'}`}>
                {etiketler[idx]} Rekabet
            </span>
        </div>
    );
}

// 1'den 5'e kadar skor üreten yardımcı fonksiyon
function skorHesapla(teklifSayisi: number): number {
    if (teklifSayisi <= 2) return 1;
    if (teklifSayisi <= 5) return 2;
    if (teklifSayisi <= 10) return 3;
    if (teklifSayisi <= 20) return 4;
    return 5;
}

export default function ProposalCostPreview({
    gercekTeklifSayisi,
    teklifFiyati,
    bakiye,
    teklifMaliyeti,
    onGonder,
    gondermeyiOnayla = true,
}: Props) {
    const [onayAcik, setOnayAcik] = useState(false);
    const yeterliKredi = bakiye >= teklifMaliyeti;
    const potansiyelKazan = teklifFiyati * 0.85;

    // Skor değerini gerçek teklif sayısından türetiyoruz
    const rekabetSkoru = skorHesapla(gercekTeklifSayisi);

    return (
        <div className={`rounded-2xl border-2 overflow-hidden transition-all ${yeterliKredi ? 'border-emerald-100 bg-navy-50/50' : 'border-red-100 bg-red-50/50'}`}>
            {/* Özet */}
            <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${yeterliKredi ? 'bg-emerald-100' : 'bg-red-100'}`}>
                        {yeterliKredi ? '💳' : '⚠️'}
                    </div>
                    <div>
                        <p className="text-sm font-black text-navy-900">
                            {yeterliKredi ? 'Teklif Gönderebilirsiniz' : 'Yetersiz Kredi'}
                        </p>
                        <p className={`text-xs font-medium ${yeterliKredi ? 'text-navy-700' : 'text-red-500'}`}>
                            {yeterliKredi
                                ? `Bu teklif ${teklifMaliyeti} kredi harcar`
                                : `${Math.max(0, teklifMaliyeti - bakiye)} kredi daha gerekli`}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setOnayAcik(a => !a)}
                    className="text-navy-300 hover:text-navy-600 text-xs font-bold transition-colors"
                >
                    {onayAcik ? 'Gizle ↑' : 'Detay ↓'}
                </button>
            </div>

            {/* Detay */}
            {onayAcik && (
                <div className="border-t border-white/80 px-4 py-4 space-y-3 bg-white/60">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-xl p-3 border border-navy-100">
                            <p className="text-xs text-navy-300 font-medium mb-1">Mevcut Bakiye</p>
                            <p className={`text-lg font-black ${yeterliKredi ? 'text-navy-900' : 'text-red-500'}`}>
                                {bakiye} <span className="text-sm font-semibold">Kredi</span>
                            </p>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-navy-100">
                            <p className="text-xs text-navy-300 font-medium mb-1">Harcanan</p>
                            <p className="text-lg font-black text-orange-500">
                                -{teklifMaliyeti} <span className="text-sm font-semibold">Kredi</span>
                            </p>
                        </div>
                    </div>

                    {/* Rekabet */}
                    <div className="bg-white rounded-xl p-3 border border-navy-100">
                        <p className="text-xs text-navy-300 font-medium mb-2">İlan Rekabet Durumu</p>
                        <RekabetGostergesi skor={rekabetSkoru} />
                        <p className="text-xs text-navy-300 mt-1.5">
                            Bu ilana şu ana kadar <strong className="text-navy-600">{gercekTeklifSayisi} teklif</strong> geldi.
                        </p>
                    </div>

                    {/* Potansiyel kazanç */}
                    {teklifFiyati > 0 && (
                        <div className="bg-navy-50 rounded-xl p-3 border border-emerald-100 flex justify-between items-center">
                            <p className="text-xs text-emerald-700 font-medium">İşi kazanırsanız tahmini kazanç</p>
                            <p className="text-base font-black text-navy-700">
                                ₺{potansiyelKazan.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Gönder butonu */}
            <div className="px-4 pb-4 pt-2">
                {yeterliKredi ? (
                    <button
                        onClick={onGonder}
                        disabled={!gondermeyiOnayla}
                        className={`w-full py-3 text-white font-black rounded-xl transition-all text-sm shadow-sm ${gondermeyiOnayla
                                ? 'bg-navy-800 hover:bg-navy-800 shadow-navy-800/20 hover:-translate-y-0.5'
                                : 'bg-gray-400 cursor-not-allowed opacity-70'
                            }`}
                    >
                        {gondermeyiOnayla ? `Teklif Gönder — ${teklifMaliyeti} Kredi Kullan` : 'Göndermek İçin Formu Doldurun'}
                    </button>
                ) : (
                    <button
                        onClick={() => {/* navigate to wallet */ }}
                        className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl shadow-lg shadow-orange-500/20 transition-all text-sm"
                    >
                        💳 Kredi Yükle
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Kullanım (HizmetPaneli.tsx teklif formu içinde) ───
//
// <ProposalCostPreview
//   gercekTeklifSayisi={selectedIlan?.proposalCount ?? 0}
//   teklifFiyati={Number(teklifForm.price) || 0}
//   bakiye={walletBalance || 0}
//   teklifMaliyeti={proposalCost || 0}
//   onGonder={handleTeklifGonder}
//   gondermeyiOnayla={!!teklifForm.price && !!teklifForm.message}
// />
