import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';
import AiProposalAssistant from '../components/AiProposalAssistant';
import ContentWarning from '../components/ContentWarning';
import { checkContent } from '../utils/contentFilter';
import ProfileImageUploader from '../components/ProfileImageUploader';
import ProviderReviews from '../components/ProviderReviews';
import PasswordChangeSettings from '../components/PasswordChangeSettings';

const getUserId = (data: any) => {
  if (!data) return null;
  if (typeof data === 'object') return data.userId || data.id || data._id || (data.user && (data.user._id || data.user.id)) || null;
  try {
    const decoded = JSON.parse(atob(data.split('.')[1]));
    return decoded.userId || decoded.id || decoded._id || (decoded.user && (decoded.user._id || decoded.user.id));
  } catch { return null; }
};

// 💳 Kart numarası formatlama
const formatCardNumber = (value: string) => {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  const matches = v.match(/\d{4,16}/g);
  const match = (matches && matches[0]) || '';
  const parts = [];
  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4));
  }
  return parts.length ? parts.join(' ') : value;
};

// Hizmet slug→label eşleştirmesi
const SERVICE_LABELS: Record<string, string> = {
  temizlik: '🧹 Temizlik', tadilat: '🔧 Tadilat & Boya', nakliyat: '🚚 Nakliyat',
  'sehirici-nakliyat': '🚛 Şehiriçi Nakliyat',
  'sehirlerarasi-nakliyat': '🛣️ Şehirlerarası Nakliyat',
  'evden-eve-nakliyat': '🏠 Evden Eve Nakliyat',
  'ofis-tasima': '🏢 Ofis Taşıma',
  'parca-esya-tasima': '📦 Parça Eşya Taşıma',
  'esya-depolama': '🗄️ Eşya Depolama',
  yazilim: '💻 Yazılım & Tasarım', ozelders: '📚 Özel Ders', guzellik: '✂️ Güzellik & Bakım',
  bahce: '🌿 Bahçe & Peyzaj', elektrik: '🔌 Elektrik & Tesisat', fotograf: '📷 Fotoğraf & Video',
  insaat: '🏗️ İnşaat & Dekorasyon', klima: '❄️ Klima & Beyaz Eşya', diger: '⚡ Diğer'
};

export default function HizmetPaneli() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'yeni-ilanlar' | 'tekliflerim' | 'kazandiklarim' | 'cuzdan' | 'hizmetlerim' | 'degerlendirmeler' | 'ayarlar'>('yeni-ilanlar');

  const [ilanlar, setIlanlar] = useState<any[]>([]);
  const [tekliflerim, setTekliflerim] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);

  const [teklifForm, setTeklifForm] = useState({ price: '', message: '' });
  const [selectedIlan, setSelectedIlan] = useState<any>(null);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

  // Cüzdan state
  const [walletBalance, setWalletBalance] = useState(0);
  const [proposalCost, setProposalCost] = useState(1);
  const [creditPackages, setCreditPackages] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [walletTab, setWalletTab] = useState<'overview' | 'buy' | 'history'>('overview');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState('');

  // Kart bilgileri
  const [cardForm, setCardForm] = useState({
    cardNumber: '', cardHolder: '', expiry: '', cvv: ''
  });

  // Hizmetler state
  const [myServices, setMyServices] = useState<string[]>([]);
  const [newService, setNewService] = useState('');

  // Profil state
  const [profilForm, setProfilForm] = useState({ about: '', companyName: '', phoneNumber: '' });


  // İlan filtreleri
  const [filters, setFilters] = useState({
    category: '',
    sortDate: 'newest',
    location: ''
  });

  const [searchInput, setSearchInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Provider'ın hizmetleri
  const providerServices: string[] = user?.services || myServices || [];

  // ═══════════ FETCH FONKSİYONLARI ═══════════

  const fetchIlanlar = useCallback(async () => {
    setYukleniyor(true);
    try {
      const pId = getUserId(user);
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.location) params.append('location', filters.location);
      if (filters.sortDate) params.append('sortDate', filters.sortDate);
      if (pId) params.append('providerId', pId);

      const res = await axiosInstance.get(`/requests/active?${params.toString()}`);
      setIlanlar(res.data);
    } catch (error) { console.error(error); }
    finally { setYukleniyor(false); }
  }, [filters.category, filters.location, filters.sortDate, user]);

  const fetchTekliflerim = useCallback(async () => {
    const pId = getUserId(user);
    if (!pId) return;
    setYukleniyor(true);
    try {
      const res = await axiosInstance.get(`/proposals/provider/${pId}`);
      setTekliflerim(res.data);
    } catch (error) { console.error(error); }
    finally { setYukleniyor(false); }
  }, [user]);

  const fetchWallet = useCallback(async () => {
    const pId = getUserId(user);
    if (!pId) return;
    try {
      const [balRes, pkgRes, txRes] = await Promise.all([
        axiosInstance.get(`/wallet/balance/${pId}`),
        axiosInstance.get('/wallet/packages'),
        axiosInstance.get(`/wallet/transactions/${pId}`)
      ]);
      setWalletBalance(balRes.data.balance);
      setProposalCost(balRes.data.proposalCost);
      setCreditPackages(pkgRes.data.packages);
      setTransactions(txRes.data);
    } catch (error) { console.error(error); }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'yeni-ilanlar') fetchIlanlar();
    if (activeTab === 'tekliflerim' || activeTab === 'kazandiklarim') fetchTekliflerim();
    if (activeTab === 'cuzdan') fetchWallet();
  }, [activeTab, fetchIlanlar, fetchTekliflerim, fetchWallet]);

  // ═══════════ TEKLİF & MESAJ FONKSİYONLARI ═══════════

  const handleTeklifVer = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedIlan) return;
    const pId = getUserId(user);
    if (!pId) return alert("Oturum hatası.");

    // Frontend moderasyon kontrolü
    if (teklifForm.message) {
      const msgCheck = checkContent(teklifForm.message);
      if (msgCheck.hasAnyIssue) {
        alert(msgCheck.warnings.join('\n'));
        return;
      }
    }

    try {
      const res = await axiosInstance.post('/proposals/create', { serviceRequestId: selectedIlan._id, providerId: pId, price: Number(teklifForm.price), message: teklifForm.message });
      alert(`🚀 Teklif gönderildi! Kalan kredi: ${res.data.remainingCredits}`);
      setSelectedIlan(null); setTeklifForm({ price: '', message: '' });
      fetchIlanlar(); fetchWallet();
    } catch (error: any) {
      const data = error.response?.data;
      if (data?.code === 'INSUFFICIENT_CREDITS') {
        if (window.confirm(`❌ Yetersiz kredi! Mevcut: ${data.currentBalance} kredi.\n\nKredi satın almak ister misiniz?`)) {
          setActiveTab('cuzdan');
          setWalletTab('buy');
        }
      } else if (data?.code === 'MAX_PROPOSALS_REACHED') {
        alert('⚠️ Bu talep maksimum 3 teklif aldı. Artık teklif gönderilemez.');
        setSelectedIlan(null);
        fetchIlanlar(); // Listeyi güncelle, dolu ilan kaybolsun
      } else if (data?.errors) {
        alert(data.errors.join('\n'));
      } else {
        alert(`❌ Hata: ${data?.message || "Sunucu hatası."}`);
      }
    }
  };

  const handleSendReply = async (proposalId: string) => {
    const text = replyTexts[proposalId];
    if (!text || text.trim() === '') return;

    // Frontend moderasyon kontrolü
    const msgCheck = checkContent(text);
    if (msgCheck.hasAnyIssue) {
      alert(msgCheck.warnings.join('\n'));
      return;
    }

    try {
      await axiosInstance.post(`/proposals/${proposalId}/reply`, { sender: 'provider', text });
      setReplyTexts(prev => ({ ...prev, [proposalId]: '' }));
      fetchIlanlar();
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.errors) {
        alert(data.errors.join('\n'));
      } else {
        alert("Mesaj gönderilemedi.");
      }
    }
  };

  // ═══════════ CÜZDAN / ÖDEME FONKSİYONLARI ═══════════

  const handlePurchase = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) return alert("Lütfen bir paket seçin.");
    const pId = getUserId(user);
    if (!pId) return;
    setPaymentLoading(true);
    setPaymentSuccess('');
    try {
      const res = await axiosInstance.post('/wallet/purchase', {
        providerId: pId, packageId: selectedPackage.id,
        cardNumber: cardForm.cardNumber, cardHolder: cardForm.cardHolder,
        expiry: cardForm.expiry, cvv: cardForm.cvv
      });
      setPaymentSuccess(`✅ ${res.data.message} Yeni bakiye: ${res.data.newBalance} kredi`);
      setWalletBalance(res.data.newBalance);
      setCardForm({ cardNumber: '', cardHolder: '', expiry: '', cvv: '' });
      setSelectedPackage(null);
      fetchWallet();
      setTimeout(() => setPaymentSuccess(''), 5000);
    } catch (error: any) {
      alert(error.response?.data?.message || "Ödeme işlemi başarısız.");
    } finally { setPaymentLoading(false); }
  };

  // ═══════════ HİZMET & PROFİL FONKSİYONLARI ═══════════

  const handleAddService = () => {
    if (newService.trim() !== '' && !myServices.includes(newService.trim())) {
      setMyServices([...myServices, newService.trim()]);
      setNewService('');
    }
  };

  const handleSaveServices = async () => {
    const pId = getUserId(user);
    if (!pId) return;
    try {
      await axiosInstance.put('/providers/update-services', { providerId: pId, services: myServices });
      alert("✅ Hizmet alanlarınız güncellendi!");
    } catch { alert("Hata oluştu."); }
  };

  const handleSaveProfile = async () => {
    const pId = getUserId(user);
    if (!pId) return;
    try {
      await axiosInstance.put(`/providers/${pId}`, profilForm);
      alert("Profil başarıyla güncellendi!");
    } catch (error) {
      alert("Profil güncellenirken hata oluştu.");
    }
  };


  const handleLogout = () => {
    if (window.confirm('Çıkış?')) { logout(); navigate('/login'); }
  };

  const aktifTeklifler = tekliflerim.filter(t => t.status !== 'completed' && t.status !== 'rejected');
  const kazandiklarim = tekliflerim.filter(t => t.status === 'completed' || t.status === 'accepted');

  // Zaman farkı hesapla
  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}dk önce`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}sa önce`;
    return `${Math.floor(hours / 24)}g önce`;
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 font-sans selection:bg-navy-700/20 selection:text-gold-400">

      {/* ═══════════ MOBİL MENÜ OVERLAY ═══════════ */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)}></div>}

      {/* ═══════════ SOL MENÜ ═══════════ */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:sticky top-0 left-0 z-40 w-[280px] h-screen bg-white flex flex-col shrink-0 border-r border-navy-100 transition-transform duration-300`}>
        <div className="p-7 pb-8">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-11 h-11 bg-gradient-to-br from-navy-700 to-navy-900 rounded-xl flex items-center justify-center text-navy-900 font-black text-lg shadow-lg shadow-navy-800/20 group-hover:shadow-navy-800/30 transition-shadow">HP</div>
            <span className="text-xl font-black text-navy-900 tracking-tight">Hizmet<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Pazarı</span></span>
          </div>
        </div>

        {/* Bakiye Kartı */}
        <div className="mx-4 mb-6 relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-navy-700 to-navy-900"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSI0MCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNhKSIgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiLz48L3N2Zz4=')] opacity-30"></div>
          <div className="relative p-5">
            <p className="text-navy-200 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Mevcut Bakiye</p>
            <p className="text-navy-900 text-3xl font-black">{walletBalance} <span className="text-lg font-bold text-navy-200">Kredi</span></p>
            <p className="text-navy-300 text-[11px] font-medium mt-2">{Math.floor(walletBalance / proposalCost)} teklif hakkınız var</p>
            <button onClick={() => { setActiveTab('cuzdan'); setWalletTab('buy'); }} className="mt-3 text-[11px] font-black text-navy-200 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors border border-navy-100">+ Kredi Yükle</button>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {[
            { id: 'yeni-ilanlar', icon: '⚡', label: 'İş Fırsatları', count: ilanlar.length },
            { id: 'tekliflerim', icon: '💬', label: 'Aktif Teklifler', count: aktifTeklifler.length },
            { id: 'kazandiklarim', icon: '🏆', label: 'İş Geçmişi' },
            { id: 'cuzdan', icon: '💳', label: 'Cüzdan & Krediler', badge: walletBalance < 3 },
            { id: 'hizmetlerim', icon: '🛠️', label: 'Hizmet Alanlarım' },
            { id: 'degerlendirmeler', icon: '⭐', label: 'Değerlendirmelerim' },
            { id: 'ayarlar', icon: '⚙️', label: 'Profil Ayarları' }
          ].map((item) => (
            <button key={item.id} onClick={() => { setActiveTab(item.id as any); setSidebarOpen(false); }} className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 group ${activeTab === item.id ? 'bg-gradient-to-r from-navy-500/10 to-transparent text-gold-500 border-l-2 border-gold-500' : 'text-navy-300 hover:bg-navy-50/50 hover:text-navy-600 border-l-2 border-transparent'}`}>
              <span className={`text-lg transition-transform ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === item.id ? 'bg-navy-500/15 text-gold-500' : 'bg-navy-50/50 text-navy-300'}`}>{item.count}</span>
              )}
              {item.badge && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-navy-100">
          <div className="flex items-center gap-3 p-3 hover:bg-navy-50/50 rounded-xl transition-colors cursor-pointer group">
            <ProfileImageUploader size="sm" editable={false} />
            <div className="overflow-hidden flex-1">
              <p className="text-navy-900 text-sm font-bold truncate">{user?.companyName || user?.name}</p>
              <button onClick={handleLogout} className="text-navy-300 text-xs hover:text-red-400 transition-colors font-medium">Çıkış Yap</button>
            </div>
          </div>
        </div>
      </aside>

      {/* ═══════════ ANA İÇERİK ═══════════ */}
      <main className="flex-1 min-h-screen">
        {/* Mobil Header */}
        <div className="lg:hidden sticky top-0 z-20 bg-gradient-to-br from-gray-50 to-emerald-50/30/80 backdrop-blur-xl border-b border-navy-100 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="text-navy-900 p-2 hover:bg-navy-100 rounded-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
          <span className="text-navy-900 font-black text-lg">HizmetPazarı</span>
          <div className="text-gold-500 font-black text-sm">{walletBalance} K</div>
        </div>

        <div className="p-6 lg:p-10 max-w-6xl mx-auto">

          {/* İstatistik Başlık */}
          <header className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div>
                <p className="text-gold-500 text-sm font-bold mb-1">Hoş geldin, {user?.name?.split(' ')[0] || user?.companyName?.split(' ')[0] || 'Profesyonel'}</p>
                <h1 className="text-3xl lg:text-4xl font-black text-navy-900 tracking-tight">
                  {activeTab === 'yeni-ilanlar' ? 'İş Fırsatlarını Keşfet' :
                    activeTab === 'tekliflerim' ? 'Aktif Tekliflerim' :
                      activeTab === 'kazandiklarim' ? 'Tamamlanan İşler' :
                        activeTab === 'cuzdan' ? 'Cüzdan & Kredi Yönetimi' :
                          activeTab === 'degerlendirmeler' ? 'Müşteri Değerlendirmeleri' :
                            activeTab === 'ayarlar' ? 'Profil Ayarları' : 'Hizmet Yönetimi'}
                </h1>
              </div>
              {activeTab === 'yeni-ilanlar' && (
                <div className="flex gap-3">
                  <div className="bg-navy-50/50 border border-navy-100 rounded-xl px-5 py-3 text-center">
                    <p className="text-2xl font-black text-navy-900">{ilanlar.length}</p>
                    <p className="text-[10px] font-bold text-navy-300 uppercase tracking-wider">Aktif İlan</p>
                  </div>
                  <div className="bg-navy-50/50 border border-navy-100 rounded-xl px-5 py-3 text-center">
                    <p className="text-2xl font-black text-gold-500">{aktifTeklifler.length}</p>
                    <p className="text-[10px] font-bold text-navy-300 uppercase tracking-wider">Bekleyen Teklif</p>
                  </div>
                  <div className="bg-navy-50/50 border border-navy-100 rounded-xl px-5 py-3 text-center">
                    <p className="text-2xl font-black text-amber-400">{kazandiklarim.length}</p>
                    <p className="text-[10px] font-bold text-navy-300 uppercase tracking-wider">Tamamlanan</p>
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* ═══════════ İŞ FIRSATLARI ═══════════ */}
          {activeTab === 'yeni-ilanlar' && (
            <div className="space-y-6">
              {/* FİLTRELEME ÇUBUĞU */}
              <div className="bg-navy-50/50 backdrop-blur-sm p-4 rounded-2xl border border-navy-100 flex flex-col lg:flex-row gap-3 items-center">
                <div className="flex-1 w-full relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-300">🔍</span>
                  <input
                    type="text" placeholder="Konum Ara (Örn: İstanbul, Kadıköy)"
                    className="w-full pl-11 pr-4 py-3 bg-navy-50/50 border border-navy-100 rounded-xl focus:outline-none focus:border-navy-500 font-medium text-sm text-navy-900 placeholder:text-navy-300"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && setFilters({ ...filters, location: searchInput })}
                  />
                </div>
                <div className="flex gap-3 w-full lg:w-auto">
                  {/* ✅ Dinamik kategori filtresi - provider'ın hizmetlerine göre */}
                  <select
                    className="flex-1 lg:w-48 px-4 py-3 bg-navy-50/50 border border-navy-100 rounded-xl focus:outline-none focus:border-navy-500 font-medium text-sm text-navy-900 appearance-none cursor-pointer"
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  >
                    <option value="">Tüm Hizmetlerim</option>
                    {providerServices.map(srv => (
                      <option key={srv} value={srv}>{SERVICE_LABELS[srv] || srv}</option>
                    ))}
                  </select>
                  <select
                    className="flex-1 lg:w-40 px-4 py-3 bg-navy-50/50 border border-navy-100 rounded-xl focus:outline-none focus:border-navy-500 font-medium text-sm text-navy-900 appearance-none cursor-pointer"
                    value={filters.sortDate}
                    onChange={(e) => setFilters({ ...filters, sortDate: e.target.value })}
                  >
                    <option value="newest">En Yeni</option>
                    <option value="oldest">En Eski</option>
                  </select>
                  <button
                    onClick={() => setFilters({ ...filters, location: searchInput })}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-navy-900 px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-navy-800/20 active:scale-95"
                  >Ara</button>
                </div>
              </div>

              {yukleniyor ? (
                <div className="flex flex-col items-center py-20 gap-3">
                  <div className="flex gap-1.5">{[0, 1, 2].map(i => (<div key={i} className="w-3 h-3 bg-navy-800 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />))}</div>
                  <p className="text-navy-400 font-bold">Yükleniyor...</p>
                </div>
              ) : ilanlar.length === 0 ? (
                <div className="text-center py-20 bg-navy-50/50 rounded-3xl border border-navy-100">
                  <span className="text-6xl mb-4 block opacity-50">📭</span>
                  <h3 className="text-xl font-bold text-navy-600">Şu an aktif iş fırsatı yok</h3>
                  <p className="text-navy-300 text-sm mt-2">Hizmet alanlarınıza uygun yeni ilanları buradan göreceksiniz.</p>
                </div>
              ) : ilanlar.map((ilan) => (
                <div key={ilan._id} onClick={() => setSelectedIlan(ilan)} className="group bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden hover:shadow-sm cursor-pointer relative p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="font-bold text-gray-900 text-sm">{ilan.customer?.name || 'Müşteri'}</span>
                    <span className="ml-auto text-xs text-gray-400">{timeAgo(ilan.createdAt)}</span>
                  </div>
                  
                  <h3 className="text-base font-bold text-gray-900 mb-2">
                    {SERVICE_LABELS[ilan.category] || ilan.category} - {ilan.location.split(',')[0]} {ilan.details?.movingDate ? `- ${ilan.details.movingDate}` : ''}
                  </h3>
                  
                  <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed mb-4">
                    {ilan.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {ilan.details?.isUrgent && (
                      <span className="bg-red-50 text-red-500 px-2 py-1 rounded text-[11px] font-bold">Acil</span>
                    )}
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1">📞</span>
                    {ilan.details?.houseSize && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-[11px] font-bold">{ilan.details.houseSize}</span>
                    )}
                    {ilan.details?.elevatorFrom && ilan.details.elevatorFrom !== 'Yok' && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-[11px] font-bold">Asansör (Kalkış): {ilan.details.elevatorFrom}</span>
                    )}
                    {ilan.details?.elevatorTo && ilan.details.elevatorTo !== 'Yok' && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-[11px] font-bold">Asansör (Varış): {ilan.details.elevatorTo}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-400 border-t border-gray-100 pt-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    <span>{ilan.proposalCount || 0} teklif aldı</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ═══════════ AKTİF TEKLİFLER ═══════════ */}
          {activeTab === 'tekliflerim' && (
            <div className="space-y-6">
              {aktifTeklifler.length === 0 ? (
                <div className="text-center py-20 bg-navy-50/50 rounded-3xl border border-navy-100">
                  <span className="text-6xl mb-4 block opacity-50">💬</span>
                  <h3 className="text-xl font-bold text-navy-600">Aktif teklifiniz yok</h3>
                  <button onClick={() => setActiveTab('yeni-ilanlar')} className="mt-6 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-navy-900 font-bold rounded-xl shadow-lg shadow-navy-800/20">İşleri Keşfet</button>
                </div>
              ) : aktifTeklifler.map(t => (
                <div key={t._id} className="bg-white rounded-2xl border border-navy-100 overflow-hidden">
                  <div className="p-6 border-b border-navy-100 flex justify-between items-center">
                    <div>
                      <h3 className="font-black text-navy-900 text-lg">{t.serviceRequestId?.title || 'Hizmet Talebi'}</h3>
                      <p className="text-sm text-navy-300 mt-1">📍 {t.serviceRequestId?.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-gold-500">{t.price} <span className="text-sm text-navy-300">TL</span></p>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${t.status === 'accepted' ? 'bg-navy-500/10 text-gold-500 border border-navy-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                        {t.status === 'accepted' ? '✓ Kabul Edildi' : '⏳ Bekleyen'}
                      </span>
                    </div>
                  </div>

                  {/* 💬 Mesajlaşma */}
                  <div className="p-6 bg-navy-50/50">
                    <div className="space-y-3 max-h-60 overflow-y-auto mb-4 pr-2">
                      {t.messages?.map((msg: any, idx: number) => (
                        <div key={idx} className={`flex ${msg.sender === 'provider' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-2xl text-sm font-medium flex flex-col gap-1 px-4 py-2.5 ${msg.sender === 'provider' ? 'bg-navy-800 text-navy-900 rounded-br-sm' : 'bg-white/10 border border-navy-100 text-slate-200 rounded-bl-sm'}`}>
                            {msg.imageUrl && <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer"><img src={msg.imageUrl} alt="" className="max-w-full max-h-40 rounded-lg" /></a>}
                            {msg.text && <span>{msg.text}</span>}
                            <span className={`text-[10px] ${msg.sender === 'provider' ? 'text-navy-200' : 'text-navy-300'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 flex flex-col gap-1">
                        <input type="text" placeholder="Müşteriye mesaj..." className="w-full px-4 py-2.5 bg-navy-50/50 border border-navy-100 rounded-xl text-sm text-navy-900 placeholder:text-navy-300 focus:outline-none focus:border-navy-500" value={replyTexts[t._id] || ''} onChange={(e) => setReplyTexts(prev => ({ ...prev, [t._id]: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && !checkContent(replyTexts[t._id] || '').hasAnyIssue && handleSendReply(t._id)} />
                        <ContentWarning text={replyTexts[t._id] || ''} />
                      </div>
                      <button onClick={() => handleSendReply(t._id)} disabled={checkContent(replyTexts[t._id] || '').hasAnyIssue} className="bg-gradient-to-r from-emerald-500 to-teal-500 text-navy-900 px-5 py-2.5 font-bold text-sm rounded-xl shadow-md active:scale-95 disabled:opacity-50">Gönder</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ═══════════ İŞ GEÇMİŞİ ═══════════ */}
          {activeTab === 'kazandiklarim' && (
            <div className="space-y-4">
              {kazandiklarim.length === 0 ? (
                <div className="text-center py-20 bg-navy-50/50 rounded-3xl border border-navy-100">
                  <span className="text-6xl mb-4 block opacity-50">🏆</span>
                  <h3 className="text-xl font-bold text-navy-600">Henüz tamamlanan iş yok</h3>
                </div>
              ) : kazandiklarim.map(t => (
                <div key={t._id} className="bg-white rounded-2xl border border-navy-100 p-6 flex justify-between items-center hover:border-navy-500/20 transition-all">
                  <div>
                    <h3 className="font-black text-navy-900">{t.serviceRequestId?.title || 'Hizmet'}</h3>
                    <p className="text-sm text-navy-300 mt-1">📍 {t.serviceRequestId?.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-gold-500">{t.price} TL</p>
                    <span className="text-xs font-bold text-gold-500 bg-navy-500/10 px-2.5 py-1 rounded-lg border border-navy-500/20">✓ {t.status === 'completed' ? 'Tamamlandı' : 'Kabul Edildi'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ═══════════ 💳 CÜZDAN & KREDİLER ═══════════ */}
          {activeTab === 'cuzdan' && (
            <div>
              <div className="flex gap-2 mb-8 bg-navy-50/50 p-1.5 rounded-2xl w-max border border-navy-100">
                {[
                  { id: 'overview', label: '📊 Genel Bakış' },
                  { id: 'buy', label: '💳 Kredi Satın Al' },
                  { id: 'history', label: '📜 İşlem Geçmişi' }
                ].map(tab => (
                  <button key={tab.id} onClick={() => setWalletTab(tab.id as any)} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${walletTab === tab.id ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-navy-900 shadow-lg shadow-navy-800/20' : 'text-navy-300 hover:text-navy-600'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {paymentSuccess && (
                <div className="mb-6 p-4 bg-navy-500/10 border border-navy-500/20 text-gold-500 font-bold rounded-2xl text-center">{paymentSuccess}</div>
              )}

              {/* 📊 GENEL BAKIŞ */}
              {walletTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="relative overflow-hidden bg-gradient-to-br from-navy-700 to-navy-900 rounded-2xl p-8 text-navy-900 shadow-xl shadow-navy-800/20 col-span-1 md:col-span-2">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                      <p className="text-navy-200 text-xs font-bold uppercase tracking-widest mb-2">Mevcut Bakiye</p>
                      <p className="text-5xl font-black mb-1">{walletBalance} <span className="text-2xl text-navy-200">Kredi</span></p>
                      <p className="text-navy-200 text-sm font-medium">{Math.floor(walletBalance / proposalCost)} teklif gönderebilirsiniz</p>
                      <button onClick={() => setWalletTab('buy')} className="mt-6 px-6 py-3 bg-white/20 backdrop-blur-sm text-navy-900 font-bold rounded-xl hover:bg-white/30 transition-colors border border-navy-100">+ Kredi Yükle</button>
                    </div>
                    <div className="bg-navy-50/50 rounded-2xl p-8 border border-navy-100">
                      <p className="text-navy-300 text-xs font-bold uppercase tracking-widest mb-2">Teklif Ücreti</p>
                      <p className="text-4xl font-black text-navy-900">{proposalCost}</p>
                      <p className="text-navy-300 text-sm font-medium mt-1">kredi / teklif</p>
                    </div>
                  </div>

                  <div className="bg-navy-50/50 rounded-2xl border border-navy-100 overflow-hidden">
                    <div className="p-6 border-b border-navy-100"><h3 className="font-black text-navy-900 text-lg">Son İşlemler</h3></div>
                    <div className="divide-y divide-white/5">
                      {transactions.length === 0 ? (
                        <div className="p-8 text-center text-navy-300 font-medium">Henüz işlem yok</div>
                      ) : transactions.slice(0, 5).map((tx: any) => (
                        <div key={tx._id} className="p-5 flex justify-between items-center hover:bg-navy-50/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${tx.type === 'credit_purchase' ? 'bg-navy-500/10 text-gold-500' : tx.type === 'proposal_fee' ? 'bg-orange-500/10 text-orange-400' : 'bg-purple-500/10 text-purple-400'}`}>
                              {tx.type === 'credit_purchase' ? '💳' : tx.type === 'proposal_fee' ? '📤' : '🎁'}
                            </div>
                            <div>
                              <p className="font-bold text-navy-900 text-sm">{tx.description}</p>
                              <p className="text-xs text-navy-300">{new Date(tx.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            </div>
                          </div>
                          <span className={`font-black text-lg ${tx.amount > 0 ? 'text-gold-500' : 'text-red-400'}`}>{tx.amount > 0 ? '+' : ''}{tx.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 💳 KREDİ SATIN AL */}
              {walletTab === 'buy' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-black text-navy-900 mb-6">Kredi Paketi Seçin</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {creditPackages.map((pkg: any) => (
                        <button key={pkg.id} onClick={() => setSelectedPackage(pkg)} className={`relative p-6 rounded-2xl border-2 text-left transition-all hover:-translate-y-0.5 ${selectedPackage?.id === pkg.id ? 'border-navy-500 bg-navy-500/10 shadow-lg shadow-navy-800/10' : 'border-navy-100 bg-white hover:border-navy-500/30 hover:shadow-md'}`}>
                          {pkg.popular && (<div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-navy-900 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-md">En Popüler</div>)}
                          <p className="font-black text-navy-900 text-lg">{pkg.name}</p>
                          <p className="text-3xl font-black text-gold-500 mt-2">{pkg.credits} <span className="text-sm text-navy-300 font-bold">Kredi</span></p>
                          <p className="text-2xl font-black text-navy-900 mt-3">{pkg.price} <span className="text-sm text-navy-300">TL</span></p>
                          <p className="text-xs text-navy-300 font-medium mt-1">{pkg.description}</p>
                          {pkg.savings && <p className="text-xs text-gold-500 font-bold mt-2 bg-navy-500/10 w-max px-2 py-0.5 rounded-md border border-navy-500/20">{pkg.savings}</p>}
                          {selectedPackage?.id === pkg.id && (<div className="absolute top-4 right-4 w-6 h-6 bg-navy-800 rounded-full flex items-center justify-center text-navy-900 text-xs font-bold">✓</div>)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedPackage && (
                    <div className="bg-navy-50/50 rounded-2xl border border-navy-100 overflow-hidden">
                      <div className="p-6 bg-navy-50/50 border-b border-navy-100 flex justify-between items-center">
                        <div>
                          <h3 className="font-black text-navy-900 text-lg">Ödeme Bilgileri</h3>
                          <p className="text-sm text-navy-300">{selectedPackage.name} - {selectedPackage.credits} Kredi</p>
                        </div>
                        <p className="text-3xl font-black text-gold-500">{selectedPackage.price} <span className="text-sm text-navy-300">TL</span></p>
                      </div>
                      <form onSubmit={handlePurchase} className="p-8 space-y-6">
                        <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-2xl p-6 text-navy-900 shadow-xl max-w-sm mx-auto border border-navy-100">
                          <div className="flex justify-between items-start mb-8">
                            <div className="w-12 h-8 bg-gradient-to-r from-amber-300 to-amber-500 rounded-md"></div>
                            <span className="text-xs font-bold text-navy-300 tracking-widest">VISA</span>
                          </div>
                          <p className="text-xl font-mono tracking-[0.2em] mb-6">{cardForm.cardNumber || '•••• •••• •••• ••••'}</p>
                          <div className="flex justify-between text-[11px]">
                            <div><p className="text-navy-300 uppercase tracking-widest mb-0.5">Kart Sahibi</p><p className="font-bold text-sm">{cardForm.cardHolder || 'AD SOYAD'}</p></div>
                            <div><p className="text-navy-300 uppercase tracking-widest mb-0.5">Son Kullanma</p><p className="font-bold text-sm">{cardForm.expiry || 'AA/YY'}</p></div>
                          </div>
                        </div>
                        <div className="space-y-4 max-w-lg mx-auto">
                          <div>
                            <label className="text-xs font-bold text-navy-300 mb-1.5 block uppercase tracking-wider">Kart Numarası</label>
                            <input type="text" required maxLength={19} placeholder="1234 5678 9012 3456" className="w-full px-4 py-3.5 bg-navy-50/50 border border-navy-100 rounded-xl font-mono text-lg tracking-wider text-navy-900 placeholder:text-navy-400 focus:outline-none focus:border-navy-500" value={cardForm.cardNumber} onChange={(e) => setCardForm({ ...cardForm, cardNumber: formatCardNumber(e.target.value) })} />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-navy-300 mb-1.5 block uppercase tracking-wider">Kart Üzerindeki İsim</label>
                            <input type="text" required placeholder="AD SOYAD" className="w-full px-4 py-3.5 bg-navy-50/50 border border-navy-100 rounded-xl font-bold uppercase text-navy-900 placeholder:text-navy-400 focus:outline-none focus:border-navy-500" value={cardForm.cardHolder} onChange={(e) => setCardForm({ ...cardForm, cardHolder: e.target.value.toUpperCase() })} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-bold text-navy-300 mb-1.5 block uppercase tracking-wider">Son Kullanma</label>
                              <input type="text" required maxLength={5} placeholder="AA/YY" className="w-full px-4 py-3.5 bg-navy-50/50 border border-navy-100 rounded-xl font-mono text-lg text-center text-navy-900 placeholder:text-navy-400 focus:outline-none focus:border-navy-500" value={cardForm.expiry} onChange={(e) => { let v = e.target.value.replace(/\D/g, ''); if (v.length >= 2) v = v.substring(0, 2) + '/' + v.substring(2, 4); setCardForm({ ...cardForm, expiry: v }); }} />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-navy-300 mb-1.5 block uppercase tracking-wider">CVV</label>
                              <input type="password" required maxLength={4} placeholder="•••" className="w-full px-4 py-3.5 bg-navy-50/50 border border-navy-100 rounded-xl font-mono text-lg text-center text-navy-900 placeholder:text-navy-400 focus:outline-none focus:border-navy-500" value={cardForm.cvv} onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, '') })} />
                            </div>
                          </div>
                        </div>
                        <div className="max-w-lg mx-auto pt-4">
                          <button type="submit" disabled={paymentLoading} className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-navy-900 font-black text-lg rounded-2xl hover:shadow-xl hover:shadow-navy-800/20 disabled:opacity-50 active:scale-[0.98] transition-all">
                            {paymentLoading ? (<span className="flex items-center justify-center gap-2"><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>İşleniyor...</span>) : (`💳 ${selectedPackage.price} TL Öde`)}
                          </button>
                          <p className="text-center text-xs text-navy-300 mt-4 font-medium">🔒 256-bit SSL ile güvenli ödeme</p>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* 📜 İŞLEM GEÇMİŞİ */}
              {walletTab === 'history' && (
                <div className="bg-navy-50/50 rounded-2xl border border-navy-100 overflow-hidden">
                  <div className="p-6 border-b border-navy-100"><h3 className="font-black text-navy-900 text-lg">Tüm İşlemler</h3></div>
                  <div className="divide-y divide-white/5">
                    {transactions.length === 0 ? (
                      <div className="p-12 text-center"><span className="text-5xl opacity-30 block mb-4">📜</span><p className="text-navy-300 font-bold">Henüz işlem geçmişi yok</p></div>
                    ) : transactions.map((tx: any) => (
                      <div key={tx._id} className="p-5 flex justify-between items-center hover:bg-navy-50/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${tx.type === 'credit_purchase' ? 'bg-navy-500/10 text-gold-500' : tx.type === 'proposal_fee' ? 'bg-orange-500/10 text-orange-400' : 'bg-purple-500/10 text-purple-400'}`}>
                            {tx.type === 'credit_purchase' ? '💳' : tx.type === 'proposal_fee' ? '📤' : '🎁'}
                          </div>
                          <div>
                            <p className="font-bold text-navy-900">{tx.description}</p>
                            <p className="text-xs text-navy-300 mt-0.5">{new Date(tx.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}{tx.cardLast4 && <span className="ml-2">• ****{tx.cardLast4}</span>}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`font-black text-xl ${tx.amount > 0 ? 'text-gold-500' : 'text-red-400'}`}>{tx.amount > 0 ? '+' : ''}{tx.amount}</span>
                          <p className="text-xs text-navy-300 font-medium">Bakiye: {tx.balanceAfter}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════ HİZMET ALANLARIM ═══════════ */}
          {activeTab === 'hizmetlerim' && (
            <div className="max-w-2xl">
              <div className="bg-navy-50/50 p-8 rounded-2xl border border-navy-100">
                <div className="flex gap-3 mb-8">
                  <input type="text" placeholder="Örn: Ev Temizliği, Web Tasarım" className="flex-1 px-5 py-4 bg-navy-50/50 border border-navy-100 rounded-xl font-bold text-navy-900 placeholder:text-navy-300 focus:outline-none focus:border-navy-500" value={newService} onChange={(e) => setNewService(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddService()} />
                  <button onClick={handleAddService} className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-navy-900 font-black rounded-xl hover:shadow-lg shadow-navy-800/20 active:scale-95">Ekle</button>
                </div>
                <div className="space-y-3 min-h-[120px]">
                  {myServices.length === 0 && <div className="text-center py-10 text-navy-300 font-bold">Henüz hizmet eklenmemiş</div>}
                  {myServices.map((srv, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 bg-navy-50/50 border border-navy-100 rounded-xl">
                      <span className="font-bold text-navy-900">{SERVICE_LABELS[srv] || srv}</span>
                      <button onClick={() => setMyServices(myServices.filter(s => s !== srv))} className="w-8 h-8 flex items-center justify-center bg-navy-50/50 text-navy-300 rounded-full hover:bg-red-500/10 hover:text-red-400 font-black transition-colors">✕</button>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-navy-100">
                  <button onClick={handleSaveServices} className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-navy-900 font-black text-lg rounded-xl shadow-lg shadow-navy-800/20 active:scale-[0.98]">Kaydet</button>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ PROFİL AYARLARI ═══════════ */}
          {activeTab === 'degerlendirmeler' && (
            <ProviderReviews providerId={getUserId(user)} />
          )}

          {/* ═══════════ PROFİL AYARLARI ═══════════ */}
          {activeTab === 'ayarlar' && (
            <div className="max-w-2xl">
              <div className="bg-navy-50/50 p-8 rounded-2xl border border-navy-100 space-y-6">
                {/* 📷 Profil Resmi */}
                <div className="flex flex-col items-center gap-4 pb-6 border-b border-navy-100">
                  <ProfileImageUploader size="lg" />
                  <div className="text-center">
                    <p className="text-sm font-bold text-navy-900">Profil Fotoğrafı</p>
                    <p className="text-xs text-navy-300 mt-1">Kameraya tıklayarak değiştirebilirsiniz</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-navy-300 ml-1 uppercase tracking-wider">FİRMA ADI</label>
                  <input type="text" placeholder={user?.companyName || 'Firma'} className="w-full px-5 py-4 bg-navy-50/50 border border-navy-100 rounded-xl font-bold text-navy-900 placeholder:text-navy-300 focus:outline-none focus:border-navy-500" value={profilForm.companyName} onChange={(e) => setProfilForm({ ...profilForm, companyName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-navy-300 ml-1 uppercase tracking-wider">TELEFON</label>
                  <input type="tel" placeholder={user?.phoneNumber || '05XX'} className="w-full px-5 py-4 bg-navy-50/50 border border-navy-100 rounded-xl font-bold text-navy-900 placeholder:text-navy-300 focus:outline-none focus:border-navy-500" value={profilForm.phoneNumber} onChange={(e) => setProfilForm({ ...profilForm, phoneNumber: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-navy-300 ml-1 uppercase tracking-wider">HAKKINDA</label>
                  <textarea placeholder="Firma tanıtımı..." className="w-full px-5 py-4 bg-navy-50/50 border border-navy-100 rounded-xl font-bold text-navy-900 placeholder:text-navy-300 focus:outline-none focus:border-navy-500 h-32 resize-none" value={profilForm.about} onChange={(e) => setProfilForm({ ...profilForm, about: e.target.value })} />
                </div>
                <button onClick={handleSaveProfile} className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-navy-900 font-black text-lg rounded-xl shadow-lg shadow-navy-800/20 active:scale-[0.98]">Profili Güncelle</button>
              </div>

              {/* 🔒 Şifre Değiştirme */}
              <div className="bg-white p-6 rounded-2xl border border-navy-100 shadow-sm mt-8">
                <PasswordChangeSettings userId={getUserId(user)!} role="provider" />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ═══════════ TEKLİF MODAL ═══════════ */}
      {selectedIlan && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedIlan(null)}></div>
          <div className="bg-white w-full md:max-w-2xl h-full md:h-auto md:max-h-[90vh] rounded-none md:rounded-2xl relative z-10 flex flex-col shadow-2xl">
            
            {/* Üst Kısım / Header */}
            <div className="flex items-center gap-4 p-4 border-b border-gray-100">
              <button onClick={() => setSelectedIlan(null)} className="text-gray-600 p-2 hover:bg-gray-100 rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
              </button>
              <h2 className="text-xl font-bold text-gray-900">Detaylar</h2>
            </div>

            {/* Orta Kısım / Scrollable İçerik */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Müşteri Bilgisi */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-yellow-400 rounded-full flex items-center justify-center text-white text-xl font-bold uppercase">
                  {selectedIlan.customer?.name ? selectedIlan.customer.name.substring(0, 2) : 'MÜ'}
                </div>
                <div className="font-bold text-gray-900 text-lg">
                  {selectedIlan.customer?.name || 'Müşteri'}
                </div>
              </div>

              {/* Temel Bilgiler */}
              <div className="space-y-3 mt-4">
                <h3 className="font-bold text-gray-900">{SERVICE_LABELS[selectedIlan.category] || selectedIlan.category}</h3>
                
                {selectedIlan.details?.movingDate && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span>📅</span> {selectedIlan.details.movingDate}
                  </div>
                )}
                
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span>📍</span> {selectedIlan.location}
                </div>
                
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span>📞</span> Müşteri ile mesajlaşabilirsin
                </div>
                
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span>💰</span> Teklif ücreti {proposalCost} Kredi
                </div>

                {selectedIlan.details?.isUrgent && (
                  <div className="mt-2 inline-block bg-red-50 text-red-500 px-3 py-1 rounded text-xs font-bold">
                    Acil
                  </div>
                )}
              </div>

              <hr className="border-gray-100" />

              {/* Soru-Cevap Detayları */}
              <div className="space-y-5">
                {selectedIlan.details?.houseSize && (
                  <div>
                    <p className="font-bold text-sm text-gray-900 mb-1">Evin büyüklüğü nedir?</p>
                    <p className="text-sm text-gray-600">{selectedIlan.details.houseSize}</p>
                  </div>
                )}
                {selectedIlan.details?.elevatorFrom && (
                  <div>
                    <p className="font-bold text-sm text-gray-900 mb-1">Asansör durumu?</p>
                    <p className="text-sm text-gray-600">Kalkış: {selectedIlan.details.elevatorFrom} / Varış: {selectedIlan.details.elevatorTo}</p>
                  </div>
                )}
                <div>
                  <p className="font-bold text-sm text-gray-900 mb-1">İşin detayları nelerdir?</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{selectedIlan.description}</p>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Talep Numarası & Müşteri Hakkında */}
              <div>
                 <p className="font-bold text-sm text-gray-900 mb-1">Talep numarası</p>
                 <p className="text-sm text-gray-600">{selectedIlan._id}</p>
              </div>

              <hr className="border-gray-100" />

              <div>
                 <p className="font-bold text-sm text-gray-900 mb-3">Müşteri Hakkında</p>
                 <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                   <span className="bg-gray-100 p-2 rounded-lg">📅</span> 
                   {selectedIlan.customer?.createdAt ? new Date(selectedIlan.customer.createdAt).toLocaleDateString('tr-TR') + ' tarihinde kaydoldu' : 'Yeni üye'}
                 </div>
              </div>
              
              <hr className="border-gray-100" />

              {/* Form Alanı (Aynı pencerede ama en altta) */}
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">Teklifinizi Hazırlayın</h3>
                
                {/* ✅ AI ASISTAN */}
                <div className="mb-4">
                  <AiProposalAssistant
                    ilan={selectedIlan}
                    providerServices={providerServices}
                    onApply={(message, price) => setTeklifForm({ message, price })}
                  />
                </div>

                <form id="teklifForm" onSubmit={handleTeklifVer} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">FİYAT (TL)</label>
                    <input type="number" required placeholder="Örn: 1500" className="w-full px-4 py-3 border border-gray-200 bg-white rounded-xl focus:outline-none focus:border-emerald-500 font-bold text-lg text-gray-900" value={teklifForm.price} onChange={(e) => setTeklifForm({ ...teklifForm, price: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">MESAJINIZ</label>
                    <textarea required placeholder="Teklif detayları ve kendinizi tanıtın..." className="w-full px-4 py-3 border border-gray-200 bg-white rounded-xl h-28 resize-none focus:outline-none focus:border-emerald-500 text-gray-900" value={teklifForm.message} onChange={(e) => setTeklifForm({ ...teklifForm, message: e.target.value })} />
                    <ContentWarning text={teklifForm.message} />
                  </div>
                </form>
              </div>

            </div>

            {/* Alt Bar / Bottom Sticky */}
            <div className="p-4 border-t border-gray-100 bg-white flex items-center justify-between mt-auto">
              <div className="text-xs text-gray-500 font-medium hidden sm:block">
                {selectedIlan.proposalCount || 0} teklif aldı
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button type="button" onClick={() => setSelectedIlan(null)} className="flex-1 sm:flex-none px-6 py-3 bg-white text-gray-600 font-bold rounded-xl border border-gray-200 hover:bg-gray-50">Reddet</button>
                <button type="submit" form="teklifForm" disabled={walletBalance < proposalCost || checkContent(teklifForm.message).hasAnyIssue} className="flex-1 sm:flex-none px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-colors">
                   {walletBalance < proposalCost ? 'Yetersiz Kredi' : `Teklif ver (${proposalCost} Kredi)`}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );

}
