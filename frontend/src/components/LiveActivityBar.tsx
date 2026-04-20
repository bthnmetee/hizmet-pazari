import { useState, useEffect } from 'react';

// ─────────────────────────────────────────────
//  CANLI AKTİVİTE BANNER'I  –  LiveActivityBar
// ─────────────────────────────────────────────

interface Aktivite {
    id: number;
    icon: string;
    text: string;
    zaman: string;
    renk: string;
}

const DEMO_AKTİVİTELER: Omit<Aktivite, 'id' | 'zaman'>[] = [
    { icon: '🧹', text: 'Ankara\'dan Mehmet B. ev temizliği talebi oluşturdu', renk: 'text-sky-600' },
    { icon: '✅', text: 'İstanbul\'dan Selin K. tadilat işini tamamladı', renk: 'text-emerald-600' },
    { icon: '⭐', text: 'Emre Y. ustasına 5 yıldız verdi', renk: 'text-amber-500' },
    { icon: '💼', text: 'Yeni profesyonel: "Yazılım & Tasarım" kategorisine katıldı', renk: 'text-violet-600' },
    { icon: '📩', text: 'Bursa\'dan Ayşe T. nakliyat için 4 teklif aldı', renk: 'text-rose-500' },
    { icon: '🏆', text: 'Bu ay 1.200+ iş başarıyla tamamlandı', renk: 'text-emerald-600' },
    { icon: '⚡', text: 'İzmir\'den Kemal A. elektrik arızasını 2 saatte çözdü', renk: 'text-orange-500' },
    { icon: '🤝', text: 'Denizli\'den Fatma S. ile hizmet sözleşmesi imzalandı', renk: 'text-teal-600' },
];

function zamanFarki() {
    const dakika = Math.floor(Math.random() * 15) + 1;
    return dakika === 1 ? 'Az önce' : `${dakika} dk önce`;
}

let idSayac = 0;
function yeniAktivite(): Aktivite {
    const şablon = DEMO_AKTİVİTELER[Math.floor(Math.random() * DEMO_AKTİVİTELER.length)];
    return { ...şablon, id: ++idSayac, zaman: zamanFarki() };
}

const BAŞLANGIÇlar: Aktivite[] = [0, 1, 2].map(i => ({
    ...DEMO_AKTİVİTELER[i],
    id: ++idSayac,
    zaman: i === 0 ? 'Az önce' : `${(i + 1) * 3} dk önce`,
}));

export default function LiveActivityBar() {
    const [aktiviteler, setAktiviteler] = useState<Aktivite[]>(BAŞLANGIÇlar);
    const [aktifIndex, setAktifIndex] = useState(0);
    const [kapat, setKapat] = useState(false);

    // DÜZELTME 1: setInterval mantığı basitleştirildi ve TS hatası önlendi
    useEffect(() => {
        // window.setInterval diyerek tarayıcı ortamını zorluyoruz
        const timerId = window.setInterval(() => {
            setAktiviteler(prev => {
                const yeniList = [yeniAktivite(), ...prev].slice(0, 10);
                return yeniList;
            });
            // Kullanıcı eski mesajlara bakmıyorsa (0. indexteyse), yeni geleni göstersin
            setAktifIndex(current => (current === 0 ? 0 : current + 1));
        }, 6000);

        return () => window.clearInterval(timerId);
    }, []);

    const önceki = () => setAktifIndex(i => Math.max(0, i - 1));
    const sonraki = () => setAktifIndex(i => Math.min(aktiviteler.length - 1, i + 1));

    if (kapat) return null;

    const current = aktiviteler[aktifIndex];

    return (
        <div className="w-full bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 border-b border-gray-800 py-2 px-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                {/* Canlı nokta */}
                <div className="flex items-center gap-2 shrink-0">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-gray-500 text-xs font-bold uppercase tracking-widest hidden sm:block">Canlı</span>
                </div>

                {/* Mesaj */}
                {/* DÜZELTME 2: 'key' prop'una id atayarak, her yeni mesajda div'in baştan render olmasını ve animasyonun tetiklenmesini sağladık */}
                <div
                    key={current.id}
                    className="flex-1 flex items-center gap-2 min-w-0 overflow-hidden animate-[slideIn_0.4s_ease-out]"
                >
                    <span className="text-base shrink-0">{current.icon}</span>
                    <p className={`text-xs font-semibold truncate ${current.renk}`}>
                        {current.text}
                    </p>
                    <span className="text-gray-600 text-xs shrink-0 hidden sm:block">{current.zaman}</span>
                </div>

                {/* Navigasyon */}
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={önceki}
                        disabled={aktifIndex === 0}
                        className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-white disabled:opacity-30 transition-colors text-xs"
                    >
                        ←
                    </button>
                    <span className="text-gray-700 text-xs font-bold">{aktifIndex + 1}/{aktiviteler.length}</span>
                    <button
                        onClick={sonraki}
                        disabled={aktifIndex === aktiviteler.length - 1}
                        className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-white disabled:opacity-30 transition-colors text-xs"
                    >
                        →
                    </button>
                    <button
                        onClick={() => setKapat(true)}
                        className="w-6 h-6 flex items-center justify-center text-gray-700 hover:text-gray-400 transition-colors ml-1"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* DÜZELTME 3: Tailwind ile uyumlu çalışması için keyframes tanımını koruyoruz, ancak Tailwind'in arbitrary values özelliğini kullandık */}
            <style>{`
                @keyframes slideIn {
                    0% { opacity: 0; transform: translateY(-10px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
