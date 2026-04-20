import { useState, useEffect, useRef, useCallback, type ChangeEvent, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';
import JobTimeline, { type JobStatus } from '../components/JobTimeline';

const KATEGORILER = [
  { value: 'temizlik', label: '🧹 Temizlik' },
  { value: 'tadilat', label: '🔧 Tadilat & Boya' },
  { value: 'nakliyat', label: '🚚 Nakliyat' },
  { value: 'yazilim', label: '💻 Yazılım & Tasarım' },
  { value: 'ozelders', label: '📚 Özel Ders' },
  { value: 'guzellik', label: '✂️ Güzellik & Bakım' },
  { value: 'bahce', label: '🌿 Bahçe & Peyzaj' },
  { value: 'elektrik', label: '🔌 Elektrik & Tesisat' },
  { value: 'fotograf', label: '📷 Fotoğraf & Video' },
  { value: 'insaat', label: '🏗️ İnşaat & Dekorasyon' },
  { value: 'klima', label: '❄️ Klima & Beyaz Eşya' },
  { value: 'diger', label: '⚡ Diğer' },
];

const getUserId = (data: any) => {
  if (!data) return null;
  if (typeof data === 'object') return data.userId || data.id || data._id || (data.user && (data.user._id || data.user.id)) || null;
  try {
    const decoded = JSON.parse(atob(data.split('.')[1]));
    return decoded.userId || decoded.id || decoded._id || (decoded.user && (decoded.user._id || decoded.user.id));
  } catch { return null; }
};

// İş durumu eşleştirme
const statusToJobStatus = (s: string): JobStatus => {
  const map: Record<string, JobStatus> = {
    accepted: 'teklif_kabul',
    contacted: 'iletisim_kuruldu',
    started: 'is_basladi',
    completed: 'tamamlandi',
    reviewed: 'degerlendirildi',
    pending: 'teklif_kabul',
  };
  return map[s] ?? 'teklif_kabul';
};

function StarRating({ rating, onRate, size = 'text-2xl' }: { rating: number; onRate?: (r: number) => void; size?: string }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onRate && onRate(star)}
          onMouseEnter={() => onRate && setHover(star)}
          onMouseLeave={() => onRate && setHover(0)}
          className={`${size} transition-transform ${onRate ? 'cursor-pointer hover:scale-125' : 'cursor-default'} ${(hover || rating) >= star ? 'text-amber-400' : 'text-gray-500'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function MusteriPaneli() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState<'ilanlarim' | 'yeni-ilan' | 'firmalar'>('ilanlarim');
  const [subTab, setSubTab] = useState<'aktif' | 'eski'>('aktif');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [ilanlarim, setIlanlarim] = useState<any[]>([]);
  const [gelenTeklifler, setGelenTeklifler] = useState<any[]>([]);
  const [firmalar, setFirmalar] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState('');

  // Chat state
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});
  const chatEndRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Değerlendirme state
  const [reviewModal, setReviewModal] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const [formData, setFormData] = useState({
    category: 'temizlik', title: '', fromLocation: '', toLocation: '', movingDate: '', phoneNumber: '', description: ''
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const fetchVeriler = useCallback(async () => {
    const id = getUserId(user);
    if (!id) return;
    setYukleniyor(true);
    try {
      const [reqRes, propRes, providerRes] = await Promise.all([
        axiosInstance.get('/requests/active'),
        axiosInstance.get(`/proposals/customer/${id}`),
        axiosInstance.get('/providers/approved')
      ]);
      setIlanlarim(reqRes.data.filter((r: any) => (r.customer?._id || r.customer) === id));
      setGelenTeklifler(propRes.data || []);
      setFirmalar(providerRes.data || []);
    } catch (e) {
      console.error("Veriler çekilirken hata:", e);
    } finally {
      setYukleniyor(false);
    }
  }, [user]);

  useEffect(() => { fetchVeriler(); }, [fetchVeriler]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setHata('');
    const id = getUserId(user);
    if (!id) return alert("Oturum hatası.");

    setYukleniyor(true);
    try {
      await axiosInstance.post('/requests/create', {
        customer: id,
        category: formData.category,
        title: formData.title,
        location: `${formData.fromLocation}${formData.toLocation ? ' -> ' + formData.toLocation : ''}`,
        phoneNumber: formData.phoneNumber,
        description: formData.description,
        details: { movingDate: formData.movingDate }
      });
      alert("Talebiniz başarıyla oluşturuldu!");
      setActiveMenu('ilanlarim');
      fetchVeriler();
    } catch (err: any) {
      setHata(err.response?.data?.message || "Bir hata oluştu.");
    } finally {
      setYukleniyor(false);
    }
  };

  // ✅ Gelişmiş mesaj gönderme (metin + resim)
  const handleSendReply = async (proposalId: string) => {
    const text = replyTexts[proposalId];
    const file = selectedFiles[proposalId];

    if ((!text || text.trim() === '') && !file) return;

    try {
      const formPayload = new FormData();
      formPayload.append('sender', 'customer');
      if (text) formPayload.append('text', text);
      if (file) formPayload.append('image', file);

      await axiosInstance.post(`/proposals/${proposalId}/reply`, formPayload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setReplyTexts(prev => ({ ...prev, [proposalId]: '' }));
      setSelectedFiles(prev => ({ ...prev, [proposalId]: null }));
      fetchVeriler();
    } catch {
      alert("Mesaj gönderilemedi.");
    }
  };

  // ✅ Teklif kabul et
  const handleAcceptProposal = async (proposalId: string) => {
    if (!window.confirm('Bu teklifi kabul etmek istediğinize emin misiniz?')) return;
    try {
      await axiosInstance.patch(`/proposals/${proposalId}/status`, { status: 'accepted' });
      alert("✅ Teklif kabul edildi!");
      fetchVeriler();
    } catch {
      alert("İşlem sırasında hata oluştu.");
    }
  };

  // ✅ İşi tamamla
  const handleCompleteProposal = async (proposalId: string) => {
    if (!window.confirm('İşin tamamlandığını onaylıyor musunuz?')) return;
    try {
      await axiosInstance.patch(`/proposals/${proposalId}/status`, { status: 'completed' });
      alert("✅ İş tamamlandı olarak işaretlendi!");
      fetchVeriler();
    } catch {
      alert("İşlem sırasında hata oluştu.");
    }
  };

  // ✅ Firma Değerlendirme Gönder
  const handleSubmitReview = async () => {
    if (reviewRating === 0) return alert("Lütfen bir puan verin.");
    if (!reviewComment.trim()) return alert("Lütfen bir yorum yazın.");

    const customerId = getUserId(user);
    if (!customerId || !reviewModal) return;

    setReviewLoading(true);
    try {
      await axiosInstance.post('/reviews/create', {
        proposalId: reviewModal._id,
        customerId,
        providerId: reviewModal.providerId?._id || reviewModal.providerId,
        rating: reviewRating,
        comment: reviewComment
      });
      alert("✅ Değerlendirmeniz gönderildi! Teşekkürler.");
      setReviewModal(null);
      setReviewRating(0);
      setReviewComment('');
      fetchVeriler();
    } catch (error: any) {
      alert(error.response?.data?.message || "Değerlendirme gönderilemedi.");
    } finally {
      setReviewLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Çıkış yapmak istediğinize emin misiniz?')) {
      logout();
      navigate('/login');
    }
  };

  const aktifTeklifSayisi = gelenTeklifler.filter(t => t.status === 'pending').length;
  const tamamlananSayisi = gelenTeklifler.filter(t => t.status === 'completed').length;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 font-sans selection:bg-blue-400/20 selection:text-blue-300">

      {/* MOBİL OVERLAY */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)}></div>}

      {/* SOL MENÜ */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:sticky top-0 left-0 z-40 w-[280px] h-screen bg-white flex flex-col shrink-0 border-r border-gray-200 transition-transform duration-300`}>
        <div className="p-7 pb-6">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-11 h-11 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-xl flex items-center justify-center text-gray-900 font-black text-lg shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">HP</div>
            <span className="text-xl font-black text-gray-900 tracking-tight">Hizmet<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Pazarı</span></span>
          </div>
        </div>

        {/* Özet Kartı */}
        <div className="mx-4 mb-6 relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600"></div>
          <div className="relative p-5">
            <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mb-1">İşlerim</p>
            <div className="flex items-end gap-4 mt-2">
              <div>
                <p className="text-gray-900 text-3xl font-black">{ilanlarim.length}</p>
                <p className="text-blue-200/70 text-[11px] font-medium">Aktif Talep</p>
              </div>
              <div className="border-l border-white/20 pl-4">
                <p className="text-gray-900 text-xl font-black">{aktifTeklifSayisi}</p>
                <p className="text-blue-200/70 text-[11px] font-medium">Bekleyen Teklif</p>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {[
            { id: 'ilanlarim', icon: '📋', label: 'Taleplerim', count: ilanlarim.length },
            { id: 'yeni-ilan', icon: '➕', label: 'Yeni Talep Oluştur' },
            { id: 'firmalar', icon: '🏢', label: 'Profesyoneller' },
          ].map(item => (
            <button key={item.id} onClick={() => { setActiveMenu(item.id as any); setSidebarOpen(false); }} className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 group ${activeMenu === item.id ? 'bg-gradient-to-r from-blue-500/10 to-transparent text-blue-400 border-l-2 border-blue-400' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600 border-l-2 border-transparent'}`}>
              <span className={`text-lg transition-transform ${activeMenu === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeMenu === item.id ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-50 text-gray-400'}`}>{item.count}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-600 text-gray-900 rounded-xl flex items-center justify-center font-black text-sm uppercase shrink-0 shadow-lg shadow-blue-500/10">
              {user?.name?.charAt(0) || 'M'}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-gray-900 text-sm font-bold truncate">{user?.name || "Müşteri"}</p>
              <button onClick={handleLogout} className="text-gray-400 text-xs font-medium hover:text-red-400 transition-colors">Çıkış Yap</button>
            </div>
          </div>
        </div>
      </aside>

      {/* ANA İÇERİK */}
      <main className="flex-1 min-h-screen">
        {/* Mobil Header */}
        <div className="lg:hidden sticky top-0 z-20 bg-gradient-to-br from-gray-50 to-blue-50/30/80 backdrop-blur-xl border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-900 p-2 hover:bg-gray-100 rounded-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
          <span className="text-gray-900 font-black text-lg">HizmetPazarı</span>
          <div className="w-10"></div>
        </div>

        <div className="p-6 lg:p-10 max-w-5xl mx-auto">

          {/* TALEPLERİM */}
          {activeMenu === 'ilanlarim' && (
            <div>
              <header className="mb-8">
                <p className="text-blue-400 text-sm font-bold mb-1">Hoş geldin, {user?.name || 'Müşteri'}</p>
                <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">İşlerim</h1>
              </header>

              {/* İstatistik Kartları */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-gray-900">{ilanlarim.length}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Aktif Talep</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-blue-400">{aktifTeklifSayisi}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Bekleyen Teklif</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-emerald-400">{tamamlananSayisi}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Tamamlanan</p>
                </div>
              </div>

              <div className="flex gap-4 mb-8 bg-gray-50 p-1.5 rounded-xl border border-gray-200 w-max">
                <button onClick={() => setSubTab('aktif')} className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${subTab === 'aktif' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-gray-900 shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-gray-600'}`}>Aktif İşlerim</button>
                <button onClick={() => setSubTab('eski')} className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${subTab === 'eski' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-gray-900 shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-gray-600'}`}>Eski İşlerim</button>
              </div>

              {subTab === 'eski' ? (
                <div className="space-y-4">
                  {gelenTeklifler.filter(t => t.status === 'completed').length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 rounded-2xl border border-gray-200">
                      <span className="text-6xl mb-6 opacity-30">📂</span>
                      <h3 className="text-xl font-black text-gray-600 mb-2">Geçmiş işin yok</h3>
                    </div>
                  ) : gelenTeklifler.filter(t => t.status === 'completed').map(t => (
                    <div key={t._id} className="bg-white rounded-2xl border border-gray-200 p-6 flex justify-between items-center hover:border-blue-500/20 transition-all">
                      <div>
                        <h3 className="font-black text-gray-900">{t.providerId?.companyName || t.providerId?.name}</h3>
                        <p className="text-sm text-gray-400 mt-1">{t.serviceRequestId?.title}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-black text-emerald-400">{t.price} TL</span>
                        <button onClick={() => { setReviewModal(t); setReviewRating(0); setReviewComment(''); }} className="px-4 py-2 bg-amber-500/10 text-amber-400 font-bold text-sm rounded-xl hover:bg-amber-500/20 border border-amber-500/20 transition-colors">
                          ⭐ Değerlendir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : ilanlarim.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-50 rounded-2xl border border-gray-200">
                  <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-5xl border border-gray-200">🔍</div>
                  <h3 className="text-xl font-black text-gray-600 mb-2">Aktif işin yok</h3>
                  <p className="text-gray-400 text-sm mb-6">Hizmet almak için hemen bir talep oluştur!</p>
                  <button onClick={() => setActiveMenu('yeni-ilan')} className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-gray-900 font-bold rounded-xl shadow-lg shadow-blue-500/20 active:scale-95">Hemen Talep Oluştur</button>
                </div>
              ) : (
                <div className="space-y-8">
                  {ilanlarim.map(ilan => {
                    const teklifler = gelenTeklifler.filter(t => (t.serviceRequestId?._id || t.serviceRequestId) === ilan._id);

                    return (
                      <div key={ilan._id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-blue-500/20 transition-all">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            <h2 className="text-xl font-black text-gray-900">{ilan.title}</h2>
                          </div>
                          <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                            {teklifler.length} Teklif
                          </span>
                        </div>

                        <div className="p-6">
                          {teklifler.length === 0 ? (
                            <div className="text-center py-6">
                              <div className="flex gap-1.5 justify-center mb-3">{[0, 1, 2].map(i => (<div key={i} className="w-2 h-2 bg-blue-500/30 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />))}</div>
                              <p className="text-gray-400 font-bold text-sm">Profesyoneller inceliyor...</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {teklifler.map(t => (
                                <div key={t._id} className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
                                  {/* Teklif Başlığı */}
                                  <div className="p-5 flex justify-between items-center border-b border-gray-200">
                                    <div>
                                      <h4 className="font-black text-gray-900">{t.providerId?.companyName || t.providerId?.name || "Hizmet Veren"}</h4>
                                      {t.providerId?.serviceCategory && <span className="text-xs font-bold text-blue-400">{t.providerId.serviceCategory}</span>}
                                      {t.providerId?.averageRating > 0 && (
                                        <div className="flex items-center gap-1 mt-1">
                                          <span className="text-amber-400 text-sm">⭐</span>
                                          <span className="text-xs font-bold text-gray-500">{t.providerId.averageRating.toFixed(1)} ({t.providerId.reviewCount})</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-right flex items-center gap-3">
                                      <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Teklif</p>
                                        <p className="text-2xl font-black text-emerald-400">{t.price} <span className="text-sm text-gray-400">TL</span></p>
                                      </div>
                                      {t.status === 'pending' && (
                                        <button onClick={() => handleAcceptProposal(t._id)} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-gray-900 text-xs font-bold rounded-lg hover:shadow-lg shadow-emerald-500/20 active:scale-95">Kabul</button>
                                      )}
                                      {t.status === 'accepted' && (
                                        <div className="flex flex-col gap-1.5">
                                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">✓ Kabul Edildi</span>
                                          <button onClick={() => handleCompleteProposal(t._id)} className="px-3 py-1.5 bg-blue-500 text-gray-900 text-xs font-bold rounded-lg hover:bg-blue-600 active:scale-95">İş Bitti</button>
                                        </div>
                                      )}
                                      {t.status === 'completed' && (
                                        <div className="flex flex-col gap-1.5">
                                          <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">✓ Tamamlandı</span>
                                          <button onClick={() => { setReviewModal(t); setReviewRating(0); setReviewComment(''); }} className="px-3 py-1.5 bg-amber-500/10 text-amber-400 text-xs font-bold rounded-lg border border-amber-500/20 hover:bg-amber-500/20">⭐ Değerlendir</button>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* 🗂 İŞ İLERLEME ZAMANÇİZELGESİ */}
                                  {(t.status === 'accepted' || t.status === 'completed') && (
                                    <div className="px-5 pb-4">
                                      <JobTimeline
                                        currentStatus={statusToJobStatus(t.status)}
                                        tarihler={{ teklif_kabul: t.acceptedAt || t.updatedAt }}
                                        profesyonelAdi={t.providerId?.companyName || t.providerId?.name}
                                        onAction={(actionId) => {
                                          if (actionId === 'degerlendirme') {
                                            setReviewModal(t);
                                            setReviewRating(0);
                                            setReviewComment('');
                                          }
                                        }}
                                      />
                                    </div>
                                  )}

                                  {/* 💬 Mesajlaşma Alanı */}
                                  <div className="p-5 bg-gray-50">
                                    <div className="space-y-3 max-h-72 overflow-y-auto mb-4 pr-2 scroll-smooth" id={`chat-${t._id}`}>
                                      {t.messages?.map((msg: any, idx: number) => (
                                        <div key={idx} className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
                                          <div className={`max-w-[80%] rounded-2xl text-sm font-medium flex flex-col gap-2 shadow-sm ${msg.sender === 'customer'
                                            ? 'bg-blue-500 text-gray-900 rounded-br-sm px-4 py-3'
                                            : 'bg-white/10 border border-gray-200 text-slate-200 rounded-bl-sm px-4 py-3'
                                            }`}>
                                            {msg.imageUrl && (
                                              <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                                                <img src={msg.imageUrl} alt="Paylaşılan görsel" className="max-w-full max-h-48 rounded-xl border border-gray-200 hover:opacity-90 transition-opacity" />
                                              </a>
                                            )}
                                            {msg.text && <span>{msg.text}</span>}
                                            <span className={`text-[10px] ${msg.sender === 'customer' ? 'text-blue-200' : 'text-gray-400'}`}>
                                              {new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                      <div ref={el => { chatEndRefs.current[t._id] = el; }} />
                                    </div>

                                    {/* Dosya Önizleme */}
                                    {selectedFiles[t._id] && (
                                      <div className="flex items-center gap-2 p-2 bg-blue-500/10 rounded-xl w-max mb-3 border border-blue-500/20">
                                        <span className="text-xs font-bold text-blue-400">📎 {selectedFiles[t._id]?.name}</span>
                                        <button onClick={() => setSelectedFiles(prev => ({ ...prev, [t._id]: null }))} className="text-red-400 font-bold hover:text-red-300 text-sm">✕</button>
                                      </div>
                                    )}

                                    {/* Mesaj Giriş */}
                                    <div className="flex gap-2 items-center">
                                      <label className="cursor-pointer p-2.5 text-gray-400 hover:text-blue-400 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center transition-colors">
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => setSelectedFiles(prev => ({ ...prev, [t._id]: e.target.files?.[0] || null }))} />
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                                      </label>
                                      <input
                                        type="text" placeholder="Mesajınızı yazın..."
                                        className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 transition-all"
                                        value={replyTexts[t._id] || ''}
                                        onChange={(e) => setReplyTexts(prev => ({ ...prev, [t._id]: e.target.value }))}
                                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendReply(t._id)}
                                      />
                                      <button onClick={() => handleSendReply(t._id)} className="bg-gradient-to-r from-blue-500 to-indigo-500 text-gray-900 px-5 py-2.5 font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 active:scale-95">Gönder</button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* YENİ TALEP */}
          {activeMenu === 'yeni-ilan' && (
            <div className="max-w-2xl mx-auto">
              <header className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 mb-2">Talep Oluştur</h1>
                <p className="text-gray-400 font-medium">Hizmet almak istediğin detayları gir, profesyonellerden teklif topla.</p>
              </header>
              {hata && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 font-bold rounded-xl">{hata}</div>}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200 space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wider">KATEGORİ</label>
                    <select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 focus:outline-none focus:border-blue-500">
                      {KATEGORILER.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wider">İLAN BAŞLIĞI</label>
                    <input type="text" name="title" required placeholder="Örn: Kadıköy'de 2+1 ev temizliği" onChange={handleChange} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wider">KONUM</label>
                      <input type="text" name="fromLocation" required placeholder="İlçe, İl" onChange={handleChange} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wider">TARİH</label>
                      <input type="date" name="movingDate" required onChange={handleChange} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wider">İLETİŞİM</label>
                    <input type="text" name="phoneNumber" required placeholder="05XX XXX XX XX" onChange={handleChange} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wider">DETAYLAR</label>
                    <textarea name="description" required placeholder="Hizmet hakkında detaylı bilgi..." onChange={handleChange} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl h-28 resize-none text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500"></textarea>
                  </div>
                </div>
                <button disabled={yukleniyor} className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-gray-900 py-4 font-black text-lg rounded-2xl shadow-lg shadow-blue-500/20 active:scale-[0.98] disabled:opacity-70 transition-all">
                  {yukleniyor ? 'İşleniyor...' : 'Talebi Yayınla'}
                </button>
              </form>
            </div>
          )}

          {/* PROFESYONELLER */}
          {activeMenu === 'firmalar' && (
            <div>
              <header className="mb-8">
                <h1 className="text-3xl font-black text-gray-900">Onaylı Profesyoneller</h1>
                <p className="text-gray-400 mt-1 font-medium">Doğrulanmış ve onaylı hizmet verenler</p>
              </header>
              {firmalar.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-200">
                  <span className="text-6xl mb-4 block opacity-30">🏢</span>
                  <h3 className="text-xl font-bold text-gray-600">Henüz onaylı profesyonel yok.</h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {firmalar.map((f: any) => (
                    <div key={f._id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-blue-500/20 hover:shadow-lg hover:shadow-blue-500/5 transition-all group">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 text-blue-400 rounded-2xl flex items-center justify-center text-xl font-black border border-blue-500/20 group-hover:border-blue-500/30 transition-colors">
                          {(f.companyName || f.name)?.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-black text-gray-900 group-hover:text-blue-400 transition-colors">{f.companyName || f.name}</h3>
                          <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">{f.serviceCategory}</span>
                        </div>
                      </div>
                      {f.about && <p className="text-sm text-gray-500 mb-3 line-clamp-2">"{f.about}"</p>}
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <StarRating rating={f.averageRating || 0} size="text-lg" />
                        <span className="font-bold ml-1 text-gray-900">{f.averageRating?.toFixed(1) || 'Yeni'}</span>
                        <span className="text-gray-400">({f.reviewCount || 0} yorum)</span>
                      </div>
                      {f.completedJobs > 0 && (
                        <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                          <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/20 font-bold">✓ {f.completedJobs} iş tamamlandı</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ⭐ DEĞERLENDİRME MODAL */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setReviewModal(null)}></div>
          <div className="bg-white w-full max-w-md rounded-2xl relative z-10 p-8 shadow-2xl border border-gray-200">
            <div className="text-center mb-6">
              <span className="text-5xl block mb-4">⭐</span>
              <h2 className="text-2xl font-black text-gray-900">Hizmeti Değerlendir</h2>
              <p className="text-gray-400 text-sm mt-2 font-medium">
                <span className="font-bold text-gray-900">{reviewModal.providerId?.companyName || reviewModal.providerId?.name}</span> hakkındaki deneyiminiz
              </p>
            </div>

            <div className="flex justify-center mb-6">
              <StarRating rating={reviewRating} onRate={setReviewRating} size="text-4xl" />
            </div>

            <div className="text-center mb-6">
              <span className="text-sm font-bold text-gray-500">
                {reviewRating === 1 ? '😞 Çok Kötü' : reviewRating === 2 ? '😐 Kötü' : reviewRating === 3 ? '🙂 Orta' : reviewRating === 4 ? '😊 İyi' : reviewRating === 5 ? '🤩 Mükemmel' : 'Puan verin'}
              </span>
            </div>

            <textarea
              placeholder="Deneyiminizi paylaşın..."
              className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-2xl h-28 resize-none focus:outline-none focus:border-blue-500 mb-6 font-medium text-sm text-gray-900 placeholder:text-gray-400"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
            />

            <div className="flex gap-3">
              <button onClick={() => setReviewModal(null)} className="flex-1 py-3.5 bg-gray-50 text-gray-500 font-bold rounded-xl hover:bg-gray-100 border border-gray-200">Vazgeç</button>
              <button
                onClick={handleSubmitReview}
                disabled={reviewLoading || reviewRating === 0}
                className="flex-1 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-gray-900 font-bold rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-50 active:scale-95"
              >
                {reviewLoading ? 'Gönderiliyor...' : 'Değerlendir'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
