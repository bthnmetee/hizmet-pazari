import { useState } from 'react';

// ─────────────────────────────────────────────
//  İŞ İLERLEME ZAMAN ÇİZELGESİ  –  JobTimeline
//
//  MusteriPaneli.tsx içinde, kabul edilen bir
//  teklifin detay bölümüne eklenir.
//  İşin hangi aşamada olduğunu, ne zaman
//  geçildiğini ve bir sonraki adımı gösterir.
//  Fiverr / TaskRabbit'te benzer bir şey yok.
// ─────────────────────────────────────────────

export type JobStatus =
    | 'teklif_kabul'
    | 'iletisim_kuruldu'
    | 'is_basladi'
    | 'tamamlandi'
    | 'degerlendirildi';

interface Aşama {
    id: JobStatus;
    label: string;
    icon: string;
    desc: string;
    actionLabel?: string;
    actionId?: string;
}

const AŞAMALAR: Aşama[] = [
    {
        id: 'teklif_kabul',
        label: 'Teklif Kabul Edildi',
        icon: '✅',
        desc: 'Profesyonelin teklifini onayladınız. Süreç başladı.',
    },
    {
        id: 'iletisim_kuruldu',
        label: 'İletişim Kuruldu',
        icon: '💬',
        desc: 'Profesyonelle detayları konuştunuz.',
        actionLabel: 'Mesaj Gönder',
        actionId: 'mesaj',
    },
    {
        id: 'is_basladi',
        label: 'İş Başladı',
        icon: '🔨',
        desc: 'Profesyonel işe başladı. Tamamlanma bekleniyor.',
    },
    {
        id: 'tamamlandi',
        label: 'İş Tamamlandı',
        icon: '🎉',
        desc: 'İş teslim edildi! Memnun kaldınız mı?',
        actionLabel: 'Değerlendir',
        actionId: 'degerlendirme',
    },
    {
        id: 'degerlendirildi',
        label: 'Değerlendirildi',
        icon: '⭐',
        desc: 'Değerlendirmeniz için teşekkürler!',
    },
];

const SIRALAMA: JobStatus[] = [
    'teklif_kabul',
    'iletisim_kuruldu',
    'is_basladi',
    'tamamlandi',
    'degerlendirildi',
];

interface Props {
    currentStatus: JobStatus;
    tarihler?: Partial<Record<JobStatus, string>>; // ISO string
    profesyonelAdi?: string;
    onAction?: (actionId: string) => void;
}

function formatTarih(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function JobTimeline({ currentStatus, tarihler = {}, profesyonelAdi, onAction }: Props) {
    const currentIndex = SIRALAMA.indexOf(currentStatus);
    const [expanded, setExpanded] = useState(true);

    return (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            {/* Header */}
            <button
                onClick={() => setExpanded(e => !e)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white text-sm font-black">
                        {currentIndex + 1}/{SIRALAMA.length}
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-black text-gray-900">İş Durumu</p>
                        {profesyonelAdi && <p className="text-xs text-gray-400">{profesyonelAdi} ile</p>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                        {AŞAMALAR.find(a => a.id === currentStatus)?.label}
                    </span>
                    <span className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}>⌄</span>
                </div>
            </button>

            {/* İlerleme çubuğu */}
            <div className="mx-5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-700"
                    style={{ width: `${((currentIndex + 1) / SIRALAMA.length) * 100}%` }}
                />
            </div>

            {expanded && (
                <div className="px-5 py-5">
                    <div className="relative">
                        {/* Dikey çizgi */}
                        <div className="absolute left-[22px] top-6 bottom-6 w-px bg-gray-100" />

                        <div className="space-y-1">
                            {AŞAMALAR.map((aşama, i) => {
                                const done = i < currentIndex;
                                const active = i === currentIndex;
                                const upcoming = i > currentIndex;
                                const tarih = tarihler[aşama.id];

                                return (
                                    <div key={aşama.id} className={`flex gap-4 py-3 ${upcoming ? 'opacity-40' : ''}`}>
                                        {/* İkon */}
                                        <div className={`
                      relative z-10 w-11 h-11 rounded-2xl flex items-center justify-center text-lg flex-shrink-0
                      shadow-sm transition-all
                      ${done ? 'bg-emerald-50 shadow-emerald-100' : ''}
                      ${active ? 'bg-emerald-500 shadow-emerald-200 shadow-lg scale-110' : ''}
                      ${upcoming ? 'bg-gray-50' : ''}
                    `}>
                                            {done ? (
                                                <span className="text-emerald-500 font-black text-base">✓</span>
                                            ) : (
                                                <span>{aşama.icon}</span>
                                            )}
                                        </div>

                                        {/* İçerik */}
                                        <div className="flex-1 min-w-0 pt-1">
                                            <div className="flex justify-between items-start">
                                                <p className={`text-sm font-black ${active ? 'text-emerald-600' : done ? 'text-gray-700' : 'text-gray-400'}`}>
                                                    {aşama.label}
                                                </p>
                                                {tarih && (
                                                    <span className="text-xs text-gray-400 font-medium shrink-0 ml-2">{formatTarih(tarih)}</span>
                                                )}
                                            </div>
                                            <p className={`text-xs font-medium mt-0.5 ${active ? 'text-gray-600' : 'text-gray-400'}`}>
                                                {aşama.desc}
                                            </p>
                                            {active && aşama.actionLabel && onAction && (
                                                <button
                                                    onClick={() => onAction(aşama.actionId!)}
                                                    className="mt-2 text-xs font-black text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded-xl transition-all hover:-translate-y-0.5 shadow-sm shadow-emerald-200"
                                                >
                                                    {aşama.actionLabel} →
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Tahmini tamamlanma */}
                    {currentStatus !== 'degerlendirildi' && (
                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-2 text-xs text-gray-400 font-medium">
                            <span>⏱</span>
                            <span>
                                Tahmini tamamlanma: <strong className="text-gray-600">
                                    {currentStatus === 'teklif_kabul' ? '2-5 gün' :
                                        currentStatus === 'iletisim_kuruldu' ? '1-4 gün' :
                                            currentStatus === 'is_basladi' ? '1-2 gün' : '—'}
                                </strong>
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Kullanım örneği (MusteriPaneli.tsx içinde) ───
//
// import JobTimeline, { JobStatus } from '../components/JobTimeline';
//
// const mapStatusToJobStatus = (s: string): JobStatus => {
//   const map: Record<string, JobStatus> = {
//     'accepted': 'teklif_kabul',
//     'contacted': 'iletisim_kuruldu',
//     'started': 'is_basladi',
//     'completed': 'tamamlandi',
//     'reviewed': 'degerlendirildi',
//   };
//   return map[s] ?? 'teklif_kabul';
// };
//
// <JobTimeline
//   currentStatus={mapStatusToJobStatus(teklif.status)}
//   tarihler={{ teklif_kabul: teklif.acceptedAt }}
//   profesyonelAdi={teklif.providerName}
//   onAction={(id) => {
//     if (id === 'mesaj') setActiveTab('mesajlar');
//     if (id === 'degerlendirme') setReviewModal(teklif);
//   }}
// />
