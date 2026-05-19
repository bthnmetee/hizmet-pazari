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
    { icon: '🧹', text: 'Ankara\'dan Mehmet B. ev temizliği talebi oluşturdu', renk: 'text-sky-500' },
    { icon: '✅', text: 'İstanbul\'dan Selin K. tadilat işini tamamladı', renk: 'text-emerald-400' },
    { icon: '⭐', text: 'Emre Y. ustasına 5 yıldız verdi', renk: 'text-gold-400' },
    { icon: '💼', text: 'Yeni profesyonel: "Yazılım & Tasarım" kategorisine katıldı', renk: 'text-violet-400' },
    { icon: '📩', text: 'Bursa\'dan Ayşe T. nakliyat için 4 teklif aldı', renk: 'text-rose-400' },
    { icon: '🏆', text: 'Bu ay 1.200+ iş başarıyla tamamlandı', renk: 'text-emerald-400' },
    { icon: '⚡', text: 'İzmir\'den Kemal A. elektrik arızasını 2 saatte çözdü', renk: 'text-orange-400' },
    { icon: '🤝', text: 'Denizli\'den Fatma S. ile hizmet sözleşmesi imzalandı', renk: 'text-teal-400' },
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

    useEffect(() => {
        const timerId = window.setInterval(() => {
            setAktiviteler(prev => {
                const yeniList = [yeniAktivite(), ...prev].slice(0, 10);
                return yeniList;
            });
            setAktifIndex(current => (current === 0 ? 0 : current + 1));
        }, 6000);

        return () => window.clearInterval(timerId);
    }, []);

    const önceki = () => setAktifIndex(i => Math.max(0, i - 1));
    const sonraki = () => setAktifIndex(i => Math.min(aktiviteler.length - 1, i + 1));

    if (kapat) return null;

    const current = aktiviteler[aktifIndex];

    return (
        <div className="w-full bg-navy-900 border-b border-navy-700/50 py-2 px-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                {/* Canlı nokta */}
                <div className="flex items-center gap-2 shrink-0">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-500" />
                    </span>
                    <span className="text-navy-400 text-xs font-bold uppercase tracking-widest hidden sm:block">Canlı</span>
                </div>

                {/* Mesaj */}
                <div
                    key={current.id}
                    className="flex-1 flex items-center gap-2 min-w-0 overflow-hidden animate-[slideIn_0.4s_ease-out]"
                >
                    <span className="text-base shrink-0">{current.icon}</span>
                    <p className={`text-xs font-semibold truncate ${current.renk}`}>
                        {current.text}
                    </p>
                    <span className="text-navy-500 text-xs shrink-0 hidden sm:block">{current.zaman}</span>
                </div>

                {/* Navigasyon */}
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={önceki}
                        disabled={aktifIndex === 0}
                        className="w-6 h-6 flex items-center justify-center text-navy-500 hover:text-white disabled:opacity-30 transition-colors text-xs"
                    >
                        ←
                    </button>
                    <span className="text-navy-500 text-xs font-bold">{aktifIndex + 1}/{aktiviteler.length}</span>
                    <button
                        onClick={sonraki}
                        disabled={aktifIndex === aktiviteler.length - 1}
                        className="w-6 h-6 flex items-center justify-center text-navy-500 hover:text-white disabled:opacity-30 transition-colors text-xs"
                    >
                        →
                    </button>
                    <button
                        onClick={() => setKapat(true)}
                        className="w-6 h-6 flex items-center justify-center text-navy-500 hover:text-navy-300 transition-colors ml-1"
                    >
                        ✕
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes slideIn {
                    0% { opacity: 0; transform: translateY(-10px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
