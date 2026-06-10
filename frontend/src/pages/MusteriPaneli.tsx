import { useState, useEffect, useRef, useCallback, useMemo, type ChangeEvent, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';
import JobTimeline, { type JobStatus } from '../components/JobTimeline';
import AiPriceEstimator from '../components/AiPriceEstimator';
import AiRequestEnhancer from '../components/AiRequestEnhancer';
import AiMatchScore from '../components/AiMatchScore';
import ContentWarning from '../components/ContentWarning';
import { checkContent } from '../utils/contentFilter';
import ProfileImageUploader from '../components/ProfileImageUploader';
import IlIlceSelector from '../components/IlIlceSelector';
import PasswordChangeSettings from '../components/PasswordChangeSettings';

const KATEGORILER = [
  { value: 'temizlik', label: '🧹 Temizlik' },
  { value: 'tadilat', label: '🔧 Tadilat & Boya' },
  { value: 'nakliyat', label: '🚚 Nakliyat' },
  { value: 'sehirici-nakliyat', label: '🚛 Şehiriçi Nakliyat' },
  { value: 'sehirlerarasi-nakliyat', label: '🛣️ Şehirlerarası Nakliyat' },
  { value: 'evden-eve-nakliyat', label: '🏠 Evden Eve Nakliyat' },
  { value: 'ofis-tasima', label: '🏢 Ofis Taşıma' },
  { value: 'parca-esya-tasima', label: '📦 Parça Eşya Taşıma' },
  { value: 'esya-depolama', label: '🗄️ Eşya Depolama' },
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

const isNakliyatCategory = (category: string) => category === 'nakliyat' || category.includes('nakliyat');

const getCategoryLabel = (category: string) =>
  KATEGORILER.find((item) => item.value === category)?.label.replace(/^[^\s]+\s/, '') || category;

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
          className={`${size} transition-transform ${onRate ? 'cursor-pointer hover:scale-125' : 'cursor-default'} ${(hover || rating) >= star ? 'text-amber-400' : 'text-navy-400'}`}
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

  const [activeMenu, setActiveMenu] = useState<'ilanlarim' | 'yeni-ilan' | 'firmalar' | 'ayarlar'>('ilanlarim');
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
    category: 'temizlik', title: '', fromIl: '', fromIlce: '', toIl: '', toIlce: '', movingDate: '', phoneNumber: '', description: '',
    roomCount: '', fromFloor: '', toFloor: '', elevator: 'unknown', packaging: 'unknown', heavyItem: 'no', itemCount: ''
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

  // ✅ İçerik moderasyonu kontrolleri
  const titleCheck = useMemo(() => checkContent(formData.title), [formData.title]);
  const descCheck = useMemo(() => checkContent(formData.description), [formData.description]);
  const formHasIssue = titleCheck.hasAnyIssue || descCheck.hasAnyIssue;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setHata('');
    const id = getUserId(user);
    if (!id) return alert("Oturum hatası.");

    // Frontend moderasyon kontrolü
    if (formHasIssue) {
      setHata('İçeriğinizde uygunsuz ifade veya iletişim bilgisi tespit edildi. Lütfen düzeltin.');
      return;
    }

    if (!formData.fromIl || !formData.fromIlce) {
      setHata('Lütfen konumunuzu tam olarak seçin (İl ve İlçe).');
      return;
    }
    if (isNakliyatCategory(formData.category) && (!formData.toIl || !formData.toIlce)) {
      setHata('Nakliyat için lütfen gideceğiniz konumu seçin (İl ve İlçe).');
      return;
    }

    setYukleniyor(true);
    try {
      await axiosInstance.post('/requests/create', {
        customer: id,
        category: formData.category,
        title: formData.title,
        location: `${formData.fromIlce}, ${formData.fromIl}${isNakliyatCategory(formData.category) && formData.toIl ? ` -> ${formData.toIlce}, ${formData.toIl}` : ''}`,
        phoneNumber: formData.phoneNumber,
        description: formData.description,
        details: {
          movingDate: formData.movingDate,
          fromIl: formData.fromIl,
          fromIlce: formData.fromIlce,
          toIl: formData.toIl,
          toIlce: formData.toIlce,
          roomCount: formData.roomCount,
          fromFloor: formData.fromFloor,
          toFloor: formData.toFloor,
          elevator: formData.elevator,
          packaging: formData.packaging,
          heavyItem: formData.heavyItem,
          itemCount: formData.itemCount,
          movingServiceType: formData.category,
          movingServiceLabel: isNakliyatCategory(formData.category) ? getCategoryLabel(formData.category) : ''
        }
      });
      alert("Talebiniz başarıyla oluşturuldu!");
      setActiveMenu('ilanlarim');
      fetchVeriler();
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.errors) {
        setHata(data.errors.join('\n'));
      } else {
        setHata(data?.message || "Bir hata oluştu.");
      }
    } finally {
      setYukleniyor(false);
    }
  };

  // ✅ Gelişmiş mesaj gönderme (metin + resim) + moderasyon
  const handleSendReply = async (proposalId: string) => {
    const text = replyTexts[proposalId];
    const file = selectedFiles[proposalId];

    if ((!text || text.trim() === '') && !file) return;

    // Frontend moderasyon kontrolü
    if (text) {
      const msgCheck = checkContent(text);
      if (msgCheck.hasAnyIssue) {
        alert(msgCheck.warnings.join('\n'));
        return;
      }
    }

    try {
      const formPayload = new FormData();
      formPayload.append('sender', 'customer');
      if (text) formPayload.append('text', text);
      if (file) formPayload.append('image', file);

      await axiosInstance.post(`/proposals/${proposalId}/reply`, formPayload);

      setReplyTexts(prev => ({ ...prev, [proposalId]: '' }));
      setSelectedFiles(prev => ({ ...prev, [proposalId]: null }));
      fetchVeriler();
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.errors) {
        alert(data.errors.join('\n'));
      } else {
        alert("Mesaj gönderilemedi.");
      }
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
    <div className="flex min-h-screen bg-gradient-to-br from-white to-navy-50/30 font-sans selection:bg-blue-400/20 selection:text-navy-300">

      {/* MOBİL OVERLAY */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)}></div>}

      {/* SOL MENÜ */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:sticky top-0 left-0 z-40 w-[280px] h-screen bg-white flex flex-col shrink-0 border-r border-navy-100 transition-transform duration-300`}>
        <div className="p-7 pb-6">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-11 h-11 bg-gradient-to-br from-navy-700 to-navy-900 rounded-xl flex items-center justify-center text-navy-900 font-black text-lg shadow-lg shadow-navy-800/20 group-hover:shadow-navy-800/30 transition-shadow">HP</div>
            <span className="text-xl font-black text-navy-900 tracking-tight">Hizmet<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Pazarı</span></span>
          </div>
        </div>

        {/* Özet Kartı */}
        <div className="mx-4 mb-6 relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-navy-700 to-navy-900"></div>
          <div className="relative p-5">
            <p className="text-navy-200 text-[10px] font-black uppercase tracking-[0.2em] mb-1">İşlerim</p>
            <div className="flex items-end gap-4 mt-2">
              <div>
                <p className="text-navy-900 text-3xl font-black">{ilanlarim.length}</p>
                <p className="text-navy-300 text-[11px] font-medium">Aktif Talep</p>
              </div>
              <div className="border-l border-white/20 pl-4">
                <p className="text-navy-900 text-xl font-black">{aktifTeklifSayisi}</p>
                <p className="text-navy-300 text-[11px] font-medium">Bekleyen Teklif</p>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {[
            { id: 'ilanlarim', icon: '📋', label: 'Taleplerim', count: ilanlarim.length },
            { id: 'yeni-ilan', icon: '➕', label: 'Yeni Talep Oluştur' },
            { id: 'firmalar', icon: '🏢', label: 'Profesyoneller' },
            { id: 'ayarlar', icon: '⚙️', label: 'Ayarlar' },
          ].map(item => (
            <button key={item.id} onClick={() => { setActiveMenu(item.id as any); setSidebarOpen(false); }} className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 group ${activeMenu === item.id ? 'bg-gradient-to-r from-navy-500/10 to-transparent text-navy-600 border-l-2 border-navy-600' : 'text-navy-300 hover:bg-navy-50/50 hover:text-navy-600 border-l-2 border-transparent'}`}>
              <span className={`text-lg transition-transform ${activeMenu === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeMenu === item.id ? 'bg-navy-500/15 text-navy-600' : 'bg-navy-50/50 text-navy-300'}`}>{item.count}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-navy-100">
          <div className="flex items-center gap-3 p-3 hover:bg-navy-50/50 rounded-xl transition-colors cursor-pointer">
            <ProfileImageUploader size="sm" editable={false} />
            <div className="overflow-hidden flex-1">
              <p className="text-navy-900 text-sm font-bold truncate">{user?.name || "Müşteri"}</p>
              <button onClick={handleLogout} className="text-navy-300 text-xs font-medium hover:text-red-400 transition-colors">Çıkış Yap</button>
            </div>
          </div>
        </div>
      </aside>

      {/* ANA İÇERİK */}
      <main className="flex-1 min-h-screen">
        {/* Mobil Header */}
        <div className="lg:hidden sticky top-0 z-20 bg-gradient-to-br from-white to-navy-50/30/80 backdrop-blur-xl border-b border-navy-100 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="text-navy-900 p-2 hover:bg-navy-100 rounded-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
          <span className="text-navy-900 font-black text-lg">HizmetPazarı</span>
          <div className="w-10"></div>
        </div>

        <div className="p-6 lg:p-10 max-w-5xl mx-auto">

          {/* TALEPLERİM */}
          {activeMenu === 'ilanlarim' && (
            <div>
              <header className="mb-8">
                <p className="text-navy-600 text-sm font-bold mb-1">Hoş geldin, {user?.name?.split(' ')[0] || 'Müşteri'}</p>
                <h1 className="text-3xl lg:text-4xl font-black text-navy-900 tracking-tight">İşlerim</h1>
              </header>

              {/* İstatistik Kartları */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-navy-50/50 border border-navy-100 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-navy-900">{ilanlarim.length}</p>
                  <p className="text-[10px] font-bold text-navy-300 uppercase tracking-wider mt-1">Aktif Talep</p>
                </div>
                <div className="bg-navy-50/50 border border-navy-100 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-navy-600">{aktifTeklifSayisi}</p>
                  <p className="text-[10px] font-bold text-navy-300 uppercase tracking-wider mt-1">Bekleyen Teklif</p>
                </div>
                <div className="bg-navy-50/50 border border-navy-100 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-gold-500">{tamamlananSayisi}</p>
                  <p className="text-[10px] font-bold text-navy-300 uppercase tracking-wider mt-1">Tamamlanan</p>
                </div>
              </div>

              <div className="flex gap-4 mb-8 bg-navy-50/50 p-1.5 rounded-xl border border-navy-100 w-max">
                <button onClick={() => setSubTab('aktif')} className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${subTab === 'aktif' ? 'bg-gradient-to-r from-navy-700 to-navy-800 text-navy-900 shadow-lg shadow-navy-800/20' : 'text-navy-300 hover:text-navy-600'}`}>Aktif İşlerim</button>
                <button onClick={() => setSubTab('eski')} className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${subTab === 'eski' ? 'bg-gradient-to-r from-navy-700 to-navy-800 text-navy-900 shadow-lg shadow-navy-800/20' : 'text-navy-300 hover:text-navy-600'}`}>Eski İşlerim</button>
              </div>

              {subTab === 'eski' ? (
                <div className="space-y-4">
                  {gelenTeklifler.filter(t => t.status === 'completed').length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-navy-50/50 rounded-2xl border border-navy-100">
                      <span className="text-6xl mb-6 opacity-30">📂</span>
                      <h3 className="text-xl font-black text-navy-600 mb-2">Geçmiş işin yok</h3>
                    </div>
                  ) : gelenTeklifler.filter(t => t.status === 'completed').map(t => (
                    <div key={t._id} className="bg-white rounded-2xl border border-navy-100 p-6 flex justify-between items-center hover:border-navy-500/20 transition-all">
                      <div>
                        <h3 className="font-black text-navy-900">{t.providerId?.companyName || t.providerId?.name}</h3>
                        <p className="text-sm text-navy-300 mt-1">{t.serviceRequestId?.title}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-black text-gold-500">{t.price} TL</span>
                        <button onClick={() => { setReviewModal(t); setReviewRating(0); setReviewComment(''); }} className="px-4 py-2 bg-amber-500/10 text-amber-400 font-bold text-sm rounded-xl hover:bg-amber-500/20 border border-amber-500/20 transition-colors">
                          ⭐ Değerlendir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : ilanlarim.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-navy-50/50 rounded-2xl border border-navy-100">
                  <div className="w-32 h-32 bg-navy-50/50 rounded-full flex items-center justify-center mb-6 text-5xl border border-navy-100">🔍</div>
                  <h3 className="text-xl font-black text-navy-600 mb-2">Aktif işin yok</h3>
                  <p className="text-navy-300 text-sm mb-6">Hizmet almak için hemen bir talep oluştur!</p>
                  <button onClick={() => setActiveMenu('yeni-ilan')} className="px-8 py-3 bg-gradient-to-r from-navy-700 to-navy-800 text-navy-900 font-bold rounded-xl shadow-lg shadow-navy-800/20 active:scale-95">Hemen Talep Oluştur</button>
                </div>
              ) : (
                <div className="space-y-8">
                  {ilanlarim.map(ilan => {
                    const teklifler = gelenTeklifler.filter(t => (t.serviceRequestId?._id || t.serviceRequestId) === ilan._id);

                    return (
                      <div key={ilan._id} className="bg-white border border-navy-100 rounded-2xl overflow-hidden hover:border-navy-500/20 transition-all">
                        <div className="p-6 border-b border-navy-100 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="w-2.5 h-2.5 bg-navy-800 rounded-full animate-pulse"></span>
                          <h2 className="text-xl font-black text-navy-900">{ilan.title}</h2>
                        </div>
                        <div className="flex items-center gap-2">
                          {ilan.details?.movingServiceLabel && (
                            <span className="text-xs font-bold text-navy-600 bg-white px-3 py-1.5 rounded-lg border border-navy-100">
                              {ilan.details.movingServiceLabel}
                            </span>
                          )}
                          <span className="text-xs font-bold text-navy-300 bg-navy-50/50 px-3 py-1.5 rounded-lg border border-navy-100">
                            {teklifler.length} Teklif
                          </span>
                        </div>
                        </div>

                        <div className="p-6">
                          {teklifler.length === 0 ? (
                            <div className="text-center py-6">
                              <div className="flex gap-1.5 justify-center mb-3">{[0, 1, 2].map(i => (<div key={i} className="w-2 h-2 bg-navy-800/30 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />))}</div>
                              <p className="text-navy-300 font-bold text-sm">Profesyoneller inceliyor...</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {teklifler.map(t => (
                                <div key={t._id} className="bg-navy-50/50 border border-navy-100 rounded-2xl overflow-hidden">
                                  {/* 🏆 AI Uyumluluk Skoru */}
                                  <div className="px-5 pt-4">
                                    <AiMatchScore providerId={t.providerId?._id || t.providerId} serviceRequestId={t.serviceRequestId?._id || t.serviceRequestId} proposalPrice={t.price} compact />
                                  </div>
                                  {/* Teklif Başlığı */}
                                  <div className="p-5 flex justify-between items-center border-b border-navy-100">
                                    <div>
                                      <h4 className="font-black text-navy-900">{t.providerId?.companyName || t.providerId?.name || "Hizmet Veren"}</h4>
                                      {t.providerId?.serviceCategory && <span className="text-xs font-bold text-navy-600">{t.providerId.serviceCategory}</span>}
                                      {t.providerId?.averageRating > 0 && (
                                        <div className="flex items-center gap-1 mt-1">
                                          <span className="text-amber-400 text-sm">⭐</span>
                                          <span className="text-xs font-bold text-navy-400">{t.providerId.averageRating.toFixed(1)} ({t.providerId.reviewCount})</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-right flex items-center gap-3">
                                      <div>
                                        <p className="text-[10px] font-bold text-navy-300 uppercase tracking-widest mb-0.5">Teklif</p>
                                        <p className="text-2xl font-black text-gold-500">{t.price} <span className="text-sm text-navy-300">TL</span></p>
                                      </div>
                                      {t.status === 'pending' && (
                                        <button onClick={() => handleAcceptProposal(t._id)} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-navy-900 text-xs font-bold rounded-lg hover:shadow-lg shadow-navy-800/20 active:scale-95">Kabul</button>
                                      )}
                                      {t.status === 'accepted' && (
                                        <div className="flex flex-col gap-1.5">
                                          <span className="text-xs font-bold text-gold-500 bg-navy-500/10 px-2.5 py-1 rounded-lg border border-navy-500/20">✓ Kabul Edildi</span>
                                          <button onClick={() => handleCompleteProposal(t._id)} className="px-3 py-1.5 bg-navy-800 text-navy-900 text-xs font-bold rounded-lg hover:bg-navy-800 active:scale-95">İş Bitti</button>
                                        </div>
                                      )}
                                      {t.status === 'completed' && (
                                        <div className="flex flex-col gap-1.5">
                                          <span className="text-xs font-bold text-navy-600 bg-navy-500/10 px-2.5 py-1 rounded-lg border border-navy-500/20">✓ Tamamlandı</span>
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
                                  <div className="p-5 bg-navy-50/50">
                                    <div className="space-y-3 max-h-72 overflow-y-auto mb-4 pr-2 scroll-smooth" id={`chat-${t._id}`}>
                                      {t.messages?.map((msg: any, idx: number) => (
                                        <div key={idx} className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
                                          <div className={`max-w-[80%] rounded-2xl text-sm font-medium flex flex-col gap-2 shadow-sm ${msg.sender === 'customer'
                                            ? 'bg-navy-800 text-navy-900 rounded-br-sm px-4 py-3'
                                            : 'bg-white/10 border border-navy-100 text-slate-200 rounded-bl-sm px-4 py-3'
                                            }`}>
                                            {msg.imageUrl && (
                                              <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                                                <img src={msg.imageUrl} alt="Paylaşılan görsel" className="max-w-full max-h-48 rounded-xl border border-navy-100 hover:opacity-90 transition-opacity" />
                                              </a>
                                            )}
                                            {msg.text && <span>{msg.text}</span>}
                                            <span className={`text-[10px] ${msg.sender === 'customer' ? 'text-navy-200' : 'text-navy-300'}`}>
                                              {new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                      <div ref={el => { chatEndRefs.current[t._id] = el; }} />
                                    </div>

                                    {/* Dosya Önizleme */}
                                    {selectedFiles[t._id] && (
                                      <div className="flex items-center gap-2 p-2 bg-navy-500/10 rounded-xl w-max mb-3 border border-navy-500/20">
                                        <span className="text-xs font-bold text-navy-600">📎 {selectedFiles[t._id]?.name}</span>
                                        <button onClick={() => setSelectedFiles(prev => ({ ...prev, [t._id]: null }))} className="text-red-400 font-bold hover:text-red-300 text-sm">✕</button>
                                      </div>
                                    )}

                                    {/* Mesaj Giriş */}
                                    <div className="flex gap-2 items-center">
                                      <label className="cursor-pointer p-2.5 text-navy-300 hover:text-navy-600 bg-navy-50/50 border border-navy-100 rounded-xl flex items-center justify-center transition-colors">
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => setSelectedFiles(prev => ({ ...prev, [t._id]: e.target.files?.[0] || null }))} />
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                                      </label>
                                      <div className="flex-1 flex flex-col gap-1">
                                        <input
                                          type="text" placeholder="Mesajınızı yazın..."
                                          className="w-full px-4 py-2.5 bg-navy-50/50 border border-navy-100 rounded-xl text-sm text-navy-900 placeholder:text-navy-300 focus:outline-none focus:border-navy-500 transition-all"
                                          value={replyTexts[t._id] || ''}
                                          onChange={(e) => setReplyTexts(prev => ({ ...prev, [t._id]: e.target.value }))}
                                          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && !checkContent(replyTexts[t._id] || '').hasAnyIssue && handleSendReply(t._id)}
                                        />
                                        <ContentWarning text={replyTexts[t._id] || ''} />
                                      </div>
                                      <button onClick={() => handleSendReply(t._id)} disabled={checkContent(replyTexts[t._id] || '').hasAnyIssue} className="bg-gradient-to-r from-navy-700 to-navy-800 text-navy-900 px-5 py-2.5 font-bold text-sm rounded-xl shadow-md shadow-navy-800/20 active:scale-95 disabled:opacity-50">Gönder</button>
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
                <h1 className="text-3xl font-black text-navy-900 mb-2">Talep Oluştur</h1>
                <p className="text-navy-300 font-medium">Hizmet almak istediğin detayları gir, profesyonellerden teklif topla.</p>
              </header>
              {hata && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 font-bold rounded-xl">{hata}</div>}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-navy-50/50 p-8 rounded-2xl border border-navy-100 space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-navy-300 ml-1 uppercase tracking-wider">KATEGORİ</label>
                    <select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-3.5 bg-white border border-navy-100 rounded-xl font-bold text-navy-900 focus:outline-none focus:border-navy-500">
                      {KATEGORILER.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-navy-300 ml-1 uppercase tracking-wider">İLAN BAŞLIĞI</label>
                    <input type="text" name="title" required placeholder="Örn: Kadıköy'de 2+1 ev temizliği" onChange={handleChange} className="w-full px-4 py-3.5 bg-navy-50/50 border border-navy-100 rounded-xl font-bold text-navy-900 placeholder:text-navy-300 focus:outline-none focus:border-navy-500" />
                    <ContentWarning text={formData.title} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <IlIlceSelector 
                      label={isNakliyatCategory(formData.category) ? 'NEREDEN' : 'KONUM'} 
                      selectedIl={formData.fromIl} 
                      selectedIlce={formData.fromIlce} 
                      onIlChange={(il) => setFormData(p => ({ ...p, fromIl: il }))} 
                      onIlceChange={(ilce) => setFormData(p => ({ ...p, fromIlce: ilce }))} 
                    />
                    {isNakliyatCategory(formData.category) && (
                      <IlIlceSelector 
                        label="NEREYE" 
                        selectedIl={formData.toIl} 
                        selectedIlce={formData.toIlce} 
                        onIlChange={(il) => setFormData(p => ({ ...p, toIl: il }))} 
                        onIlceChange={(ilce) => setFormData(p => ({ ...p, toIlce: ilce }))} 
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-navy-300 ml-1 uppercase tracking-wider">TARİH</label>
                    <input type="date" name="movingDate" required onChange={handleChange} className="w-full px-4 py-3.5 bg-navy-50/50 border border-navy-100 rounded-xl text-navy-900 focus:outline-none focus:border-navy-500" />
                  </div>
                  {isNakliyatCategory(formData.category) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-navy-300 ml-1 uppercase tracking-wider">ODA TİPİ</label>
                        <select name="roomCount" value={formData.roomCount} onChange={handleChange} className="w-full px-4 py-3.5 bg-white border border-navy-100 rounded-xl font-bold text-navy-900 focus:outline-none focus:border-navy-500">
                          <option value="">Seçiniz</option>
                          <option value="1+1">1+1</option>
                          <option value="2+1">2+1</option>
                          <option value="3+1">3+1</option>
                          <option value="4+1">4+1</option>
                          <option value="5+1">5+1 / Villa</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-navy-300 ml-1 uppercase tracking-wider">PARÇA EŞYA ADEDİ</label>
                        <input type="number" min="1" name="itemCount" value={formData.itemCount} onChange={handleChange} placeholder="Örn: 8" className="w-full px-4 py-3.5 bg-white border border-navy-100 rounded-xl text-navy-900 placeholder:text-navy-300 focus:outline-none focus:border-navy-500" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-navy-300 ml-1 uppercase tracking-wider">ÇIKIŞ KATI</label>
                        <input type="number" min="0" name="fromFloor" value={formData.fromFloor} onChange={handleChange} placeholder="Örn: 3" className="w-full px-4 py-3.5 bg-white border border-navy-100 rounded-xl text-navy-900 placeholder:text-navy-300 focus:outline-none focus:border-navy-500" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-navy-300 ml-1 uppercase tracking-wider">VARIŞ KATI</label>
                        <input type="number" min="0" name="toFloor" value={formData.toFloor} onChange={handleChange} placeholder="Örn: 1" className="w-full px-4 py-3.5 bg-white border border-navy-100 rounded-xl text-navy-900 placeholder:text-navy-300 focus:outline-none focus:border-navy-500" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-navy-300 ml-1 uppercase tracking-wider">ASANSÖR DURUMU</label>
                        <select name="elevator" value={formData.elevator} onChange={handleChange} className="w-full px-4 py-3.5 bg-white border border-navy-100 rounded-xl font-bold text-navy-900 focus:outline-none focus:border-navy-500">
                          <option value="unknown">Belirtmedim</option>
                          <option value="var">Var</option>
                          <option value="yok">Yok</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-navy-300 ml-1 uppercase tracking-wider">AMBALAJLAMA</label>
                        <select name="packaging" value={formData.packaging} onChange={handleChange} className="w-full px-4 py-3.5 bg-white border border-navy-100 rounded-xl font-bold text-navy-900 focus:outline-none focus:border-navy-500">
                          <option value="unknown">Belirtmedim</option>
                          <option value="dahil">İstiyorum</option>
                          <option value="haric">Gerekmiyor</option>
                        </select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold text-navy-300 ml-1 uppercase tracking-wider">AĞIR EŞYA</label>
                        <select name="heavyItem" value={formData.heavyItem} onChange={handleChange} className="w-full px-4 py-3.5 bg-white border border-navy-100 rounded-xl font-bold text-navy-900 focus:outline-none focus:border-navy-500">
                          <option value="no">Yok</option>
                          <option value="yes">Var (piyano, kasa, büyük dolap vb.)</option>
                        </select>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-navy-300 ml-1 uppercase tracking-wider">İLETİŞİM</label>
                    <input type="text" name="phoneNumber" required placeholder="05XX XXX XX XX" onChange={handleChange} className="w-full px-4 py-3.5 bg-navy-50/50 border border-navy-100 rounded-xl text-navy-900 placeholder:text-navy-300 focus:outline-none focus:border-navy-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-navy-300 ml-1 uppercase tracking-wider">DETAYLAR</label>
                    <textarea name="description" required placeholder="Hizmet hakkında detaylı bilgi..." onChange={handleChange} className="w-full px-4 py-3.5 bg-navy-50/50 border border-navy-100 rounded-xl h-28 resize-none text-navy-900 placeholder:text-navy-300 focus:outline-none focus:border-navy-500"></textarea>
                    <ContentWarning text={formData.description} />
                  </div>
                </div>

                {/* 🔮 AI Fiyat Tahmincisi */}
                <AiPriceEstimator 
                  category={formData.category} 
                  title={formData.title}
                  location={`${formData.fromIlce}, ${formData.fromIl}`} 
                  description={formData.description} 
                  details={{
                    movingDate: formData.movingDate,
                    roomCount: formData.roomCount,
                    fromFloor: formData.fromFloor,
                    toFloor: formData.toFloor,
                    elevator: formData.elevator,
                    packaging: formData.packaging,
                    heavyItem: formData.heavyItem,
                    itemCount: formData.itemCount,
                    movingServiceType: formData.category,
                    movingServiceLabel: isNakliyatCategory(formData.category) ? getCategoryLabel(formData.category) : ''
                  }}
                  fromIl={formData.fromIl} fromIlce={formData.fromIlce}
                  toIl={formData.toIl} toIlce={formData.toIlce}
                />

                {/* 🤖 AI Talep Güçlendirici */}
                <AiRequestEnhancer category={formData.category} title={formData.title} description={formData.description} location={`${formData.fromIlce}, ${formData.fromIl}`} onApply={(enhanced) => setFormData({...formData, description: enhanced})} />

                <button disabled={yukleniyor || formHasIssue} className="w-full bg-gradient-to-r from-navy-700 to-navy-800 text-navy-900 py-4 font-black text-lg rounded-2xl shadow-lg shadow-navy-800/20 active:scale-[0.98] disabled:opacity-70 transition-all">
                  {yukleniyor ? 'İşleniyor...' : formHasIssue ? '⚠️ İçerik Düzeltilmeli' : 'Talebi Yayınla'}
                </button>
              </form>
            </div>
          )}

          {/* PROFESYONELLER */}
          {activeMenu === 'firmalar' && (
            <div>
              <header className="mb-8">
                <h1 className="text-3xl font-black text-navy-900">Onaylı Profesyoneller</h1>
                <p className="text-navy-300 mt-1 font-medium">Doğrulanmış ve onaylı hizmet verenler</p>
              </header>
              {firmalar.length === 0 ? (
                <div className="text-center py-20 bg-navy-50/50 rounded-2xl border border-navy-100">
                  <span className="text-6xl mb-4 block opacity-30">🏢</span>
                  <h3 className="text-xl font-bold text-navy-600">Henüz onaylı profesyonel yok.</h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {firmalar.map((f: any) => (
                    <div key={f._id} className="bg-white rounded-2xl border border-navy-100 p-6 hover:border-navy-500/20 hover:shadow-lg hover:shadow-navy-800/5 transition-all group">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 text-navy-600 rounded-2xl flex items-center justify-center text-xl font-black border border-navy-500/20 group-hover:border-navy-500/30 transition-colors">
                          {(f.companyName || f.name)?.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-black text-navy-900 group-hover:text-navy-600 transition-colors">{f.companyName || f.name}</h3>
                          <span className="text-xs font-bold text-navy-600 bg-navy-500/10 px-2 py-0.5 rounded-md border border-navy-500/20">{f.serviceCategory}</span>
                        </div>
                      </div>
                      {f.about && <p className="text-sm text-navy-400 mb-3 line-clamp-2">"{f.about}"</p>}
                      <div className="flex items-center gap-2 text-sm text-navy-300">
                        <StarRating rating={f.averageRating || 0} size="text-lg" />
                        <span className="font-bold ml-1 text-navy-900">{f.averageRating?.toFixed(1) || 'Yeni'}</span>
                        <span className="text-navy-300">({f.reviewCount || 0} yorum)</span>
                      </div>
                      {f.completedJobs > 0 && (
                        <div className="mt-3 flex items-center gap-3 text-xs text-navy-300">
                          <span className="bg-navy-500/10 text-gold-500 px-2 py-0.5 rounded-md border border-navy-500/20 font-bold">✓ {f.completedJobs} iş tamamlandı</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══════════ AYARLAR ═══════════ */}
          {activeMenu === 'ayarlar' && (
            <div>
              <header className="mb-8">
                <h1 className="text-3xl font-black text-navy-900">Ayarlar</h1>
                <p className="text-navy-300 mt-1 font-medium">Hesap ve güvenlik ayarları</p>
              </header>
              <div className="max-w-xl bg-white p-6 rounded-2xl border border-navy-100 shadow-sm">
                <PasswordChangeSettings userId={getUserId(user)!} role="customer" />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ⭐ DEĞERLENDİRME MODAL */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setReviewModal(null)}></div>
          <div className="bg-white w-full max-w-md rounded-2xl relative z-10 p-8 shadow-2xl border border-navy-100">
            <div className="text-center mb-6">
              <span className="text-5xl block mb-4">⭐</span>
              <h2 className="text-2xl font-black text-navy-900">Hizmeti Değerlendir</h2>
              <p className="text-navy-300 text-sm mt-2 font-medium">
                <span className="font-bold text-navy-900">{reviewModal.providerId?.companyName || reviewModal.providerId?.name}</span> hakkındaki deneyiminiz
              </p>
            </div>

            <div className="flex justify-center mb-6">
              <StarRating rating={reviewRating} onRate={setReviewRating} size="text-4xl" />
            </div>

            <div className="text-center mb-6">
              <span className="text-sm font-bold text-navy-400">
                {reviewRating === 1 ? '😞 Çok Kötü' : reviewRating === 2 ? '😐 Kötü' : reviewRating === 3 ? '🙂 Orta' : reviewRating === 4 ? '😊 İyi' : reviewRating === 5 ? '🤩 Mükemmel' : 'Puan verin'}
              </span>
            </div>

            <textarea
              placeholder="Deneyiminizi paylaşın..."
              className="w-full px-4 py-3 border border-navy-100 bg-navy-50/50 rounded-2xl h-28 resize-none focus:outline-none focus:border-navy-500 mb-6 font-medium text-sm text-navy-900 placeholder:text-navy-300"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
            />

            <div className="flex gap-3">
              <button onClick={() => setReviewModal(null)} className="flex-1 py-3.5 bg-navy-50/50 text-navy-400 font-bold rounded-xl hover:bg-navy-100 border border-navy-100">Vazgeç</button>
              <button
                onClick={handleSubmitReview}
                disabled={reviewLoading || reviewRating === 0}
                className="flex-1 py-3.5 bg-gradient-to-r from-navy-700 to-navy-800 text-navy-900 font-bold rounded-xl shadow-lg shadow-navy-800/20 disabled:opacity-50 active:scale-95"
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
