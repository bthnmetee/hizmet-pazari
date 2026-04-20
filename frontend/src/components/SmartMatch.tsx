import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ─────────────────────────────────────────────
//  AKİLLI HİZMET EŞLEŞTİRME  –  SmartMatch
//  Hero bölümünde mevcut arama kutusunun
//  ALTINA eklenir. Kullanıcıya 3 soru sorarak
//  hangi kategoriyi & profesyoneli araması
//  gerektiğini önerir.
// ─────────────────────────────────────────────

interface Step {
    id: string;
    question: string;
    options: { label: string; icon: string; next: string | null; category?: string }[];
}

const ADIMLAR: Record<string, Step> = {
    start: {
        id: 'start',
        question: 'Ne tür bir yardıma ihtiyacınız var?',
        options: [
            { label: 'Evim/İşyerim için', icon: '🏠', next: 'ev' },
            { label: 'Dijital / Online iş', icon: '💻', next: 'dijital' },
            { label: 'Kişisel gelişim', icon: '📚', next: 'kisisel' },
        ],
    },
    ev: {
        id: 'ev',
        question: 'Hangi alanda yardım istiyorsunuz?',
        options: [
            { label: 'Temizlik', icon: '🧹', next: null, category: 'temizlik' },
            { label: 'Tadilat / Boya', icon: '🔧', next: null, category: 'tadilat' },
            { label: 'Elektrik / Tesisat', icon: '🔌', next: null, category: 'elektrik' },
            { label: 'Nakliyat', icon: '🚚', next: null, category: 'nakliyat' },
        ],
    },
    dijital: {
        id: 'dijital',
        question: 'Projeniz hakkında daha fazla bilgi verin:',
        options: [
            { label: 'Web sitesi / Uygulama', icon: '🌐', next: null, category: 'yazilim' },
            { label: 'Grafik / Logo', icon: '🎨', next: null, category: 'yazilim' },
            { label: 'Fotoğraf / Video', icon: '📷', next: null, category: 'fotograf' },
        ],
    },
    kisisel: {
        id: 'kisisel',
        question: 'Hangi alanda ilerlemeyi hedefliyorsunuz?',
        options: [
            { label: 'Özel Ders', icon: '📚', next: null, category: 'ozelders' },
            { label: 'Güzellik & Bakım', icon: '✂️', next: null, category: 'guzellik' },
            { label: 'Bahçe & Peyzaj', icon: '🌿', next: null, category: 'bahce' },
        ],
    },
};

const KATEGORİ_PROFESYONEL: Record<string, { count: number; avg: number }> = {
    temizlik: { count: 320, avg: 4.8 },
    tadilat: { count: 450, avg: 4.7 },
    elektrik: { count: 210, avg: 4.9 },
    nakliyat: { count: 180, avg: 4.6 },
    yazilim: { count: 280, avg: 4.8 },
    fotograf: { count: 150, avg: 4.9 },
    ozelders: { count: 190, avg: 4.7 },
    guzellik: { count: 120, avg: 4.8 },
    bahce: { count: 90, avg: 4.6 },
};

export default function SmartMatch() {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState('start');
    const [history, setHistory] = useState<string[]>([]);
    const [result, setResult] = useState<{ category: string; label: string; icon: string } | null>(null);
    const [animating, setAnimating] = useState(false);

    const step = ADIMLAR[currentStep];

    const handleOption = (opt: (typeof step.options)[0]) => {
        if (animating) return;
        setAnimating(true);
        setTimeout(() => {
            if (opt.next) {
                setHistory(h => [...h, currentStep]);
                setCurrentStep(opt.next!);
            } else if (opt.category) {
                setResult({ category: opt.category, label: opt.label, icon: opt.icon });
            }
            setAnimating(false);
        }, 200);
    };

    const handleBack = () => {
        if (history.length === 0) { setOpen(false); return; }
        const prev = history[history.length - 1];
        setHistory(h => h.slice(0, -1));
        setCurrentStep(prev);
        setResult(null);
    };

    const handleReset = () => {
        setCurrentStep('start');
        setHistory([]);
        setResult(null);
    };

    const info = result ? KATEGORİ_PROFESYONEL[result.category] : null;

    return (
        <div className="max-w-2xl mx-auto mt-6">
            {!open ? (
                <button
                    onClick={() => setOpen(true)}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border-2 border-dashed border-emerald-200 text-emerald-600 font-bold text-sm hover:bg-emerald-50 hover:border-emerald-300 transition-all group"
                >
                    <span className="text-xl group-hover:scale-125 transition-transform">🤖</span>
                    Hangi hizmete ihtiyacınız var? <span className="underline underline-offset-2">Akıllı Asistan ile Bul</span>
                    <span className="ml-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-black">YENİ</span>
                </button>
            ) : (
                <div
                    className={`bg-white border-2 border-emerald-100 rounded-3xl shadow-2xl shadow-emerald-500/10 overflow-hidden transition-all duration-300 ${animating ? 'opacity-50 scale-[0.98]' : 'opacity-100 scale-100'}`}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">🤖</span>
                            <span className="text-white font-black text-sm">Akıllı Hizmet Asistanı</span>
                        </div>
                        <div className="flex gap-2">
                            {history.length > 0 && !result && (
                                <button onClick={handleBack} className="text-white/80 hover:text-white text-xs font-bold px-3 py-1 bg-white/10 rounded-lg transition">
                                    ← Geri
                                </button>
                            )}
                            <button onClick={() => { setOpen(false); handleReset(); }} className="text-white/80 hover:text-white text-lg leading-none">✕</button>
                        </div>
                    </div>

                    <div className="p-6">
                        {!result ? (
                            <>
                                {/* Adım göstergesi */}
                                <div className="flex gap-1 mb-5">
                                    {['start', ...Object.keys(ADIMLAR).filter(k => k !== 'start')].slice(0, 3).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-1 flex-1 rounded-full transition-all ${i <= history.length ? 'bg-emerald-500' : 'bg-gray-100'}`}
                                        />
                                    ))}
                                </div>

                                <p className="text-gray-900 font-black text-lg mb-5">{step.question}</p>

                                <div className="grid grid-cols-2 gap-3">
                                    {step.options.map(opt => (
                                        <button
                                            key={opt.label}
                                            onClick={() => handleOption(opt)}
                                            className="flex items-center gap-3 p-4 rounded-2xl border-2 border-gray-100 hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left group hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/10"
                                        >
                                            <span className="text-2xl group-hover:scale-125 transition-transform">{opt.icon}</span>
                                            <span className="text-sm font-bold text-gray-800 group-hover:text-emerald-700">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-2">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-50 rounded-3xl text-5xl mb-4 shadow-lg shadow-emerald-500/10 animate-bounce">
                                    {result.icon}
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-2">
                                    {result.label} için<br />
                                    <span className="text-emerald-500">{info?.count}+ Profesyonel</span> Hazır!
                                </h3>
                                <div className="flex justify-center items-center gap-1 mb-2">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <span key={s} className={`text-lg ${s <= Math.floor(info?.avg ?? 0) ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
                                    ))}
                                    <span className="text-sm font-bold text-gray-500 ml-1">Ort. {info?.avg} puan</span>
                                </div>
                                <p className="text-gray-400 text-sm mb-6 font-medium">
                                    Ortalama <strong className="text-gray-700">48 dakika</strong> içinde ilk teklifinizi alacaksınız.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => navigate(`/register?category=${result.category}`)}
                                        className="flex-1 py-3.5 bg-emerald-500 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 transition-all hover:-translate-y-0.5"
                                    >
                                        Teklif Al →
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        className="px-4 py-3.5 border-2 border-gray-200 text-gray-500 font-bold rounded-2xl hover:border-gray-300 transition"
                                    >
                                        ↺
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
