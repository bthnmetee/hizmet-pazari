import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';
import AiProposalAssistant from '../components/AiProposalAssistant';

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
  yazilim: '💻 Yazılım & Tasarım', ozelders: '📚 Özel Ders', guzellik: '✂️ Güzellik & Bakım',
  bahce: '🌿 Bahçe & Peyzaj', elektrik: '🔌 Elektrik & Tesisat', fotograf: '📷 Fotoğraf & Video',
  insaat: '🏗️ İnşaat & Dekorasyon', klima: '❄️ Klima & Beyaz Eşya', diger: '⚡ Diğer'
};

export default function HizmetPaneli() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'yeni-ilanlar' | 'tekliflerim' | 'kazandiklarim' | 'cuzdan' | 'hizmetlerim' | 'ayarlar'>('yeni-ilanlar');

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
      } else {
        alert(`❌ Hata: ${data?.message || "Sunucu hatası."}`);
      }
    }
  };

  const handleSendReply = async (proposalId: string) => {
    const text = replyTexts[proposalId];
    if (!text || text.trim() === '') return;
    try {
      await axiosInstance.post(`/proposals/${proposalId}/reply`, { sender: 'provider', text });
      setReplyTexts(prev => ({ ...prev, [proposalId]: '' }));
      fetchIlanlar();
    } catch { alert("Servis silinemedi."); }
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
      await axiosInstance.put('/providers/update-profile', { providerId: pId, ...profilForm });
      setProfilForm({ about: user?.about || '', companyName: user?.companyName || '', phoneNumber: user?.phoneNumber || '' });
    } catch { alert("Profil güncellenemedi."); }
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
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 font-sans selection:bg-emerald-400/20 selection:text-emerald-300">

      {/* ═══════════ MOBİL MENÜ OVERLAY ═══════════ */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)}></div>}

      {/* ═══════════ SOL MENÜ ═══════════ */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:sticky top-0 left-0 z-40 w-[280px] h-screen bg-white flex flex-col shrink-0 border-r border-gray-200 transition-transform duration-300`}>
        <div className="p-7 pb-8">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center text-gray-900 font-black text-lg shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">HP</div>
            <span className="text-xl font-black text-gray-900 tracking-tight">Hizmet<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Pazarı</span></span>
          </div>
        </div>

        {/* Bakiye Kartı */}
        <div className="mx-4 mb-6 relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSI0MCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNhKSIgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiLz48L3N2Zz4=')] opacity-30"></div>
          <div className="relative p-5">
            <p className="text-emerald-100 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Mevcut Bakiye</p>
            <p className="text-gray-900 text-3xl font-black">{walletBalance} <span className="text-lg font-bold text-emerald-200">Kredi</span></p>
            <p className="text-emerald-200/70 text-[11px] font-medium mt-2">{Math.floor(walletBalance / proposalCost)} teklif hakkınız var</p>
            <button onClick={() => { setActiveTab('cuzdan'); setWalletTab('buy'); }} className="mt-3 text-[11px] font-black text-emerald-100 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors border border-gray-200">+ Kredi Yükle</button>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {[
            { id: 'yeni-ilanlar', icon: '⚡', label: 'İş Fırsatları', count: ilanlar.length },
            { id: 'tekliflerim', icon: '💬', label: 'Aktif Teklifler', count: aktifTeklifler.length },
            { id: 'kazandiklarim', icon: '🏆', label: 'İş Geçmişi' },
            { id: 'cuzdan', icon: '💳', label: 'Cüzdan & Krediler', badge: walletBalance < 3 },
            { id: 'hizmetlerim', icon: '🛠️', label: 'Hizmet Alanlarım' },
            { id: 'ayarlar', icon: '⚙️', label: 'Profil Ayarları' }
          ].map((item) => (
            <button key={item.id} onClick={() => { setActiveTab(item.id as any); setSidebarOpen(false); }} className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 group ${activeTab === item.id ? 'bg-gradient-to-r from-emerald-500/10 to-transparent text-emerald-400 border-l-2 border-emerald-400' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600 border-l-2 border-transparent'}`}>
              <span className={`text-lg transition-transform ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === item.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-50 text-gray-400'}`}>{item.count}</span>
              )}
              {item.badge && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-600 text-gray-900 rounded-xl flex items-center justify-center font-black text-sm uppercase shrink-0 shadow-lg shadow-emerald-500/10">
              {user?.companyName?.charAt(0) || user?.name?.charAt(0) || '?'}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-gray-900 text-sm font-bold truncate">{user?.companyName || user?.name}</p>
              <button onClick={handleLogout} className="text-gray-400 text-xs hover:text-red-400 transition-colors font-medium">Çıkış Yap</button>
            </div>
          </div>
        </div>
      </aside>

      {/* ═══════════ ANA İÇERİK ═══════════ */}
      <main className="flex-1 min-h-screen">
        {/* Mobil Header */}
        <div className="lg:hidden sticky top-0 z-20 bg-gradient-to-br from-gray-50 to-emerald-50/30/80 backdrop-blur-xl border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-900 p-2 hover:bg-gray-100 rounded-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
          <span className="text-gray-900 font-black text-lg">HizmetPazarı</span>
          <div className="text-emerald-400 font-black text-sm">{walletBalance} K</div>
        </div>

        <div className="p-6 lg:p-10 max-w-6xl mx-auto">

          {/* İstatistik Başlık */}
          <header className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div>
                <p className="text-emerald-400 text-sm font-bold mb-1">Hoş geldin,</p>
                <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">
                  {activeTab === 'yeni-ilanlar' ? 'İş Fırsatlarını Keşfet' :
                    activeTab === 'tekliflerim' ? 'Aktif Tekliflerim' :
                      activeTab === 'kazandiklarim' ? 'Tamamlanan İşler' :
                        activeTab === 'cuzdan' ? 'Cüzdan & Kredi Yönetimi' :
                          activeTab === 'ayarlar' ? 'Profil Ayarları' : 'Hizmet Yönetimi'}
                </h1>
              </div>
              {activeTab === 'yeni-ilanlar' && (
                <div className="flex gap-3">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 text-center">
                    <p className="text-2xl font-black text-gray-900">{ilanlar.length}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Aktif İlan</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 text-center">
                    <p className="text-2xl font-black text-emerald-400">{aktifTeklifler.length}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Bekleyen Teklif</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 text-center">
                    <p className="text-2xl font-black text-amber-400">{kazandiklarim.length}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tamamlanan</p>
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* ═══════════ İŞ FIRSATLARI ═══════════ */}
          {activeTab === 'yeni-ilanlar' && (
            <div className="space-y-6">
              {/* FİLTRELEME ÇUBUĞU */}
              <div className="bg-gray-50 backdrop-blur-sm p-4 rounded-2xl border border-gray-200 flex flex-col lg:flex-row gap-3 items-center">
                <div className="flex-1 w-full relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                  <input
                    type="text" placeholder="Konum Ara (Örn: İstanbul, Kadıköy)"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium text-sm text-gray-900 placeholder:text-gray-400"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && setFilters({ ...filters, location: searchInput })}
                  />
                </div>
                <div className="flex gap-3 w-full lg:w-auto">
                  {/* ✅ Dinamik kategori filtresi - provider'ın hizmetlerine göre */}
                  <select
                    className="flex-1 lg:w-48 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium text-sm text-gray-900 appearance-none cursor-pointer"
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  >
                    <option value="">Tüm Hizmetlerim</option>
                    {providerServices.map(srv => (
                      <option key={srv} value={srv}>{SERVICE_LABELS[srv] || srv}</option>
                    ))}
                  </select>
                  <select
                    className="flex-1 lg:w-40 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium text-sm text-gray-900 appearance-none cursor-pointer"
                    value={filters.sortDate}
                    onChange={(e) => setFilters({ ...filters, sortDate: e.target.value })}
                  >
                    <option value="newest">En Yeni</option>
                    <option value="oldest">En Eski</option>
                  </select>
                  <button
                    onClick={() => setFilters({ ...filters, location: searchInput })}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-gray-900 px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                  >Ara</button>
                </div>
              </div>

              {yukleniyor ? (
                <div className="flex flex-col items-center py-20 gap-3">
                  <div className="flex gap-1.5">{[0, 1, 2].map(i => (<div key={i} className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />))}</div>
                  <p className="text-gray-500 font-bold">Yükleniyor...</p>
                </div>
              ) : ilanlar.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border border-gray-200">
                  <span className="text-6xl mb-4 block opacity-50">📭</span>
                  <h3 className="text-xl font-bold text-gray-600">Şu an aktif iş fırsatı yok</h3>
                  <p className="text-gray-400 text-sm mt-2">Hizmet alanlarınıza uygun yeni ilanları buradan göreceksiniz.</p>
                </div>
              ) : ilanlar.map((ilan) => (
                <div key={ilan._id} className="group bg-white backdrop-blur-sm rounded-2xl border border-gray-200 hover:border-emerald-500/30 transition-all duration-300 overflow-hidden hover:shadow-lg hover:shadow-emerald-500/5">
                  <div className="p-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg uppercase tracking-wider">{SERVICE_LABELS[ilan.category] || ilan.category}</span>
                          {ilan.proposalCount > 0 && (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                              🔥 {ilan.proposalCount} teklif
                            </span>
                          )}
                          <span className="text-[10px] text-gray-400 font-medium ml-auto">{timeAgo(ilan.createdAt)}</span>
                        </div>
                        <h3 className="text-lg font-black text-gray-900 group-hover:text-emerald-400 transition-colors">{ilan.title}</h3>
                        <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">{ilan.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 font-medium">
                          <span>📍 {ilan.location}</span>
                          {ilan.details?.movingDate && <span>📅 {ilan.details.movingDate}</span>}
                        </div>
                      </div>
                      <button onClick={() => setSelectedIlan(ilan)} className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-gray-900 font-black rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all shrink-0 text-sm active:scale-95">
                        Teklif Ver <span className="text-emerald-200 text-[10px] ml-1">({proposalCost}K)</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ═══════════ AKTİF TEKLİFLER ═══════════ */}
          {activeTab === 'tekliflerim' && (
            <div className="space-y-6">
              {aktifTeklifler.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border border-gray-200">
                  <span className="text-6xl mb-4 block opacity-50">💬</span>
                  <h3 className="text-xl font-bold text-gray-600">Aktif teklifiniz yok</h3>
                  <button onClick={() => setActiveTab('yeni-ilanlar')} className="mt-6 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-gray-900 font-bold rounded-xl shadow-lg shadow-emerald-500/20">İşleri Keşfet</button>
                </div>
              ) : aktifTeklifler.map(t => (
                <div key={t._id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <div>
                      <h3 className="font-black text-gray-900 text-lg">{t.serviceRequestId?.title || 'Hizmet Talebi'}</h3>
                      <p className="text-sm text-gray-400 mt-1">📍 {t.serviceRequestId?.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-emerald-400">{t.price} <span className="text-sm text-gray-400">TL</span></p>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${t.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                        {t.status === 'accepted' ? '✓ Kabul Edildi' : '⏳ Bekleyen'}
                      </span>
                    </div>
                  </div>

                  {/* 💬 Mesajlaşma */}
                  <div className="p-6 bg-gray-50">
                    <div className="space-y-3 max-h-60 overflow-y-auto mb-4 pr-2">
                      {t.messages?.map((msg: any, idx: number) => (
                        <div key={idx} className={`flex ${msg.sender === 'provider' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-2xl text-sm font-medium flex flex-col gap-1 px-4 py-2.5 ${msg.sender === 'provider' ? 'bg-emerald-500 text-gray-900 rounded-br-sm' : 'bg-white/10 border border-gray-200 text-slate-200 rounded-bl-sm'}`}>
                            {msg.imageUrl && <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer"><img src={msg.imageUrl} alt="" className="max-w-full max-h-40 rounded-lg" /></a>}
                            {msg.text && <span>{msg.text}</span>}
                            <span className={`text-[10px] ${msg.sender === 'provider' ? 'text-emerald-200' : 'text-gray-400'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input type="text" placeholder="Müşteriye mesaj..." className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500" value={replyTexts[t._id] || ''} onChange={(e) => setReplyTexts(prev => ({ ...prev, [t._id]: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && handleSendReply(t._id)} />
                      <button onClick={() => handleSendReply(t._id)} className="bg-gradient-to-r from-emerald-500 to-teal-500 text-gray-900 px-5 py-2.5 font-bold text-sm rounded-xl shadow-md active:scale-95">Gönder</button>
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
                <div className="text-center py-20 bg-gray-50 rounded-3xl border border-gray-200">
                  <span className="text-6xl mb-4 block opacity-50">🏆</span>
                  <h3 className="text-xl font-bold text-gray-600">Henüz tamamlanan iş yok</h3>
                </div>
              ) : kazandiklarim.map(t => (
                <div key={t._id} className="bg-white rounded-2xl border border-gray-200 p-6 flex justify-between items-center hover:border-emerald-500/20 transition-all">
                  <div>
                    <h3 className="font-black text-gray-900">{t.serviceRequestId?.title || 'Hizmet'}</h3>
                    <p className="text-sm text-gray-400 mt-1">📍 {t.serviceRequestId?.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-emerald-400">{t.price} TL</p>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">✓ {t.status === 'completed' ? 'Tamamlandı' : 'Kabul Edildi'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ═══════════ 💳 CÜZDAN & KREDİLER ═══════════ */}
          {activeTab === 'cuzdan' && (
            <div>
              <div className="flex gap-2 mb-8 bg-gray-50 p-1.5 rounded-2xl w-max border border-gray-200">
                {[
                  { id: 'overview', label: '📊 Genel Bakış' },
                  { id: 'buy', label: '💳 Kredi Satın Al' },
                  { id: 'history', label: '📜 İşlem Geçmişi' }
                ].map(tab => (
                  <button key={tab.id} onClick={() => setWalletTab(tab.id as any)} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${walletTab === tab.id ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-gray-900 shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-gray-600'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {paymentSuccess && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold rounded-2xl text-center">{paymentSuccess}</div>
              )}

              {/* 📊 GENEL BAKIŞ */}
              {walletTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 text-gray-900 shadow-xl shadow-emerald-500/20 col-span-1 md:col-span-2">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                      <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-2">Mevcut Bakiye</p>
                      <p className="text-5xl font-black mb-1">{walletBalance} <span className="text-2xl text-emerald-200">Kredi</span></p>
                      <p className="text-emerald-200 text-sm font-medium">{Math.floor(walletBalance / proposalCost)} teklif gönderebilirsiniz</p>
                      <button onClick={() => setWalletTab('buy')} className="mt-6 px-6 py-3 bg-white/20 backdrop-blur-sm text-gray-900 font-bold rounded-xl hover:bg-white/30 transition-colors border border-gray-200">+ Kredi Yükle</button>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
                      <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Teklif Ücreti</p>
                      <p className="text-4xl font-black text-gray-900">{proposalCost}</p>
                      <p className="text-gray-400 text-sm font-medium mt-1">kredi / teklif</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200"><h3 className="font-black text-gray-900 text-lg">Son İşlemler</h3></div>
                    <div className="divide-y divide-white/5">
                      {transactions.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 font-medium">Henüz işlem yok</div>
                      ) : transactions.slice(0, 5).map((tx: any) => (
                        <div key={tx._id} className="p-5 flex justify-between items-center hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${tx.type === 'credit_purchase' ? 'bg-emerald-500/10 text-emerald-400' : tx.type === 'proposal_fee' ? 'bg-orange-500/10 text-orange-400' : 'bg-purple-500/10 text-purple-400'}`}>
                              {tx.type === 'credit_purchase' ? '💳' : tx.type === 'proposal_fee' ? '📤' : '🎁'}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-sm">{tx.description}</p>
                              <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            </div>
                          </div>
                          <span className={`font-black text-lg ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{tx.amount > 0 ? '+' : ''}{tx.amount}</span>
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
                    <h2 className="text-xl font-black text-gray-900 mb-6">Kredi Paketi Seçin</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {creditPackages.map((pkg: any) => (
                        <button key={pkg.id} onClick={() => setSelectedPackage(pkg)} className={`relative p-6 rounded-2xl border-2 text-left transition-all hover:-translate-y-0.5 ${selectedPackage?.id === pkg.id ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10' : 'border-gray-200 bg-white hover:border-emerald-500/30 hover:shadow-md'}`}>
                          {pkg.popular && (<div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-gray-900 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-md">En Popüler</div>)}
                          <p className="font-black text-gray-900 text-lg">{pkg.name}</p>
                          <p className="text-3xl font-black text-emerald-400 mt-2">{pkg.credits} <span className="text-sm text-gray-400 font-bold">Kredi</span></p>
                          <p className="text-2xl font-black text-gray-900 mt-3">{pkg.price} <span className="text-sm text-gray-400">TL</span></p>
                          <p className="text-xs text-gray-400 font-medium mt-1">{pkg.description}</p>
                          {pkg.savings && <p className="text-xs text-emerald-400 font-bold mt-2 bg-emerald-500/10 w-max px-2 py-0.5 rounded-md border border-emerald-500/20">{pkg.savings}</p>}
                          {selectedPackage?.id === pkg.id && (<div className="absolute top-4 right-4 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-gray-900 text-xs font-bold">✓</div>)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedPackage && (
                    <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
                      <div className="p-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                        <div>
                          <h3 className="font-black text-gray-900 text-lg">Ödeme Bilgileri</h3>
                          <p className="text-sm text-gray-400">{selectedPackage.name} - {selectedPackage.credits} Kredi</p>
                        </div>
                        <p className="text-3xl font-black text-emerald-400">{selectedPackage.price} <span className="text-sm text-gray-400">TL</span></p>
                      </div>
                      <form onSubmit={handlePurchase} className="p-8 space-y-6">
                        <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-2xl p-6 text-gray-900 shadow-xl max-w-sm mx-auto border border-gray-200">
                          <div className="flex justify-between items-start mb-8">
                            <div className="w-12 h-8 bg-gradient-to-r from-amber-300 to-amber-500 rounded-md"></div>
                            <span className="text-xs font-bold text-gray-400 tracking-widest">VISA</span>
                          </div>
                          <p className="text-xl font-mono tracking-[0.2em] mb-6">{cardForm.cardNumber || '•••• •••• •••• ••••'}</p>
                          <div className="flex justify-between text-[11px]">
                            <div><p className="text-gray-400 uppercase tracking-widest mb-0.5">Kart Sahibi</p><p className="font-bold text-sm">{cardForm.cardHolder || 'AD SOYAD'}</p></div>
                            <div><p className="text-gray-400 uppercase tracking-widest mb-0.5">Son Kullanma</p><p className="font-bold text-sm">{cardForm.expiry || 'AA/YY'}</p></div>
                          </div>
                        </div>
                        <div className="space-y-4 max-w-lg mx-auto">
                          <div>
                            <label className="text-xs font-bold text-gray-400 mb-1.5 block uppercase tracking-wider">Kart Numarası</label>
                            <input type="text" required maxLength={19} placeholder="1234 5678 9012 3456" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-lg tracking-wider text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-emerald-500" value={cardForm.cardNumber} onChange={(e) => setCardForm({ ...cardForm, cardNumber: formatCardNumber(e.target.value) })} />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-400 mb-1.5 block uppercase tracking-wider">Kart Üzerindeki İsim</label>
                            <input type="text" required placeholder="AD SOYAD" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold uppercase text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-emerald-500" value={cardForm.cardHolder} onChange={(e) => setCardForm({ ...cardForm, cardHolder: e.target.value.toUpperCase() })} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-bold text-gray-400 mb-1.5 block uppercase tracking-wider">Son Kullanma</label>
                              <input type="text" required maxLength={5} placeholder="AA/YY" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-lg text-center text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-emerald-500" value={cardForm.expiry} onChange={(e) => { let v = e.target.value.replace(/\D/g, ''); if (v.length >= 2) v = v.substring(0, 2) + '/' + v.substring(2, 4); setCardForm({ ...cardForm, expiry: v }); }} />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-gray-400 mb-1.5 block uppercase tracking-wider">CVV</label>
                              <input type="password" required maxLength={4} placeholder="•••" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-lg text-center text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-emerald-500" value={cardForm.cvv} onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, '') })} />
                            </div>
                          </div>
                        </div>
                        <div className="max-w-lg mx-auto pt-4">
                          <button type="submit" disabled={paymentLoading} className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-gray-900 font-black text-lg rounded-2xl hover:shadow-xl hover:shadow-emerald-500/20 disabled:opacity-50 active:scale-[0.98] transition-all">
                            {paymentLoading ? (<span className="flex items-center justify-center gap-2"><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>İşleniyor...</span>) : (`💳 ${selectedPackage.price} TL Öde`)}
                          </button>
                          <p className="text-center text-xs text-gray-400 mt-4 font-medium">🔒 256-bit SSL ile güvenli ödeme</p>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* 📜 İŞLEM GEÇMİŞİ */}
              {walletTab === 'history' && (
                <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-200"><h3 className="font-black text-gray-900 text-lg">Tüm İşlemler</h3></div>
                  <div className="divide-y divide-white/5">
                    {transactions.length === 0 ? (
                      <div className="p-12 text-center"><span className="text-5xl opacity-30 block mb-4">📜</span><p className="text-gray-400 font-bold">Henüz işlem geçmişi yok</p></div>
                    ) : transactions.map((tx: any) => (
                      <div key={tx._id} className="p-5 flex justify-between items-center hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${tx.type === 'credit_purchase' ? 'bg-emerald-500/10 text-emerald-400' : tx.type === 'proposal_fee' ? 'bg-orange-500/10 text-orange-400' : 'bg-purple-500/10 text-purple-400'}`}>
                            {tx.type === 'credit_purchase' ? '💳' : tx.type === 'proposal_fee' ? '📤' : '🎁'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{tx.description}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{new Date(tx.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}{tx.cardLast4 && <span className="ml-2">• ****{tx.cardLast4}</span>}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`font-black text-xl ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{tx.amount > 0 ? '+' : ''}{tx.amount}</span>
                          <p className="text-xs text-gray-400 font-medium">Bakiye: {tx.balanceAfter}</p>
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
              <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200">
                <div className="flex gap-3 mb-8">
                  <input type="text" placeholder="Örn: Ev Temizliği, Web Tasarım" className="flex-1 px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500" value={newService} onChange={(e) => setNewService(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddService()} />
                  <button onClick={handleAddService} className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-gray-900 font-black rounded-xl hover:shadow-lg shadow-emerald-500/20 active:scale-95">Ekle</button>
                </div>
                <div className="space-y-3 min-h-[120px]">
                  {myServices.length === 0 && <div className="text-center py-10 text-gray-400 font-bold">Henüz hizmet eklenmemiş</div>}
                  {myServices.map((srv, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 border border-gray-200 rounded-xl">
                      <span className="font-bold text-gray-900">{srv}</span>
                      <button onClick={() => setMyServices(myServices.filter(s => s !== srv))} className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-400 rounded-full hover:bg-red-500/10 hover:text-red-400 font-black transition-colors">✕</button>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <button onClick={handleSaveServices} className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-gray-900 font-black text-lg rounded-xl shadow-lg shadow-emerald-500/20 active:scale-[0.98]">Kaydet</button>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ PROFİL AYARLARI ═══════════ */}
          {activeTab === 'ayarlar' && (
            <div className="max-w-2xl">
              <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wider">FİRMA ADI</label>
                  <input type="text" placeholder={user?.companyName || 'Firma'} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500" value={profilForm.companyName} onChange={(e) => setProfilForm({ ...profilForm, companyName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wider">TELEFON</label>
                  <input type="tel" placeholder={user?.phoneNumber || '05XX'} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500" value={profilForm.phoneNumber} onChange={(e) => setProfilForm({ ...profilForm, phoneNumber: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wider">HAKKINDA</label>
                  <textarea placeholder="Firma tanıtımı..." className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 h-32 resize-none" value={profilForm.about} onChange={(e) => setProfilForm({ ...profilForm, about: e.target.value })} />
                </div>
                <button onClick={handleSaveProfile} className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-gray-900 font-black text-lg rounded-xl shadow-lg shadow-emerald-500/20 active:scale-[0.98]">Profili Güncelle</button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ═══════════ TEKLİF MODAL ═══════════ */}
      {selectedIlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedIlan(null)}></div>
          <div className="bg-white w-full max-w-md rounded-2xl relative z-10 p-8 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-black text-gray-900 mb-2">Teklif Gönder</h2>
            <p className="text-sm text-gray-500 mb-2 font-medium">{selectedIlan.title}</p>
            <div className="flex items-center gap-2 mb-4 text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/20">
              <span>💰</span> Bu teklif {proposalCost} kredi harcayacak. Bakiye: {walletBalance}
            </div>

            {/* ✅ AI ASISTAN */}
            <div className="mb-4">
              <AiProposalAssistant
                ilan={selectedIlan}
                providerServices={providerServices}
                onApply={(message, price) => setTeklifForm({ message, price })}
              />
            </div>

            <form onSubmit={handleTeklifVer} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 mb-1 block uppercase tracking-wider">FİYAT (TL)</label>
                <input type="number" required placeholder="1500" className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:border-emerald-500 font-bold text-lg text-gray-900 placeholder:text-gray-500" value={teklifForm.price} onChange={(e) => setTeklifForm({ ...teklifForm, price: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 mb-1 block uppercase tracking-wider">MESAJ</label>
                <textarea required placeholder="Teklif detayları..." className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl h-28 resize-none focus:outline-none focus:border-emerald-500 text-gray-900 placeholder:text-gray-500" value={teklifForm.message} onChange={(e) => setTeklifForm({ ...teklifForm, message: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setSelectedIlan(null)} className="flex-1 py-3 bg-gray-50 text-gray-500 font-bold rounded-xl hover:bg-gray-100 border border-gray-200">İptal</button>
                <button type="submit" disabled={walletBalance < proposalCost} className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-gray-900 font-bold rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95">
                  {walletBalance < proposalCost ? '❌ Yetersiz Kredi' : `Gönder (${proposalCost} Kredi)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

}
