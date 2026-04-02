import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function HizmetPaneli() {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'opportunities' | 'profile'>('opportunities');

  const [requests, setRequests] = useState<any[]>([]);
  const [myProposals, setMyProposals] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myBalance, setMyBalance] = useState<number | null>(null);

  const [about, setAbout] = useState('');
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const fetchData = async () => {
    try {
      const [reqRes, propRes, profileRes] = await Promise.all([
        fetch('http://localhost:5000/api/requests'),
        fetch(`http://localhost:5000/api/proposals/provider/${user?.id}`),
        fetch(`http://localhost:5000/api/providers/${user?.id}`)
      ]);
      
      if (reqRes.ok && propRes.ok && profileRes.ok) {
        setRequests(await reqRes.json());
        setMyProposals(await propRes.json());
        
        const profileData = await profileRes.json();
        setMyBalance(profileData.provider.walletBalance);
        setAbout(profileData.provider.about || '');
        setPortfolioImages(profileData.provider.portfolioImages || []);
      }
    } catch (error) {
      console.error('Veri hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user?.id]);

  const filteredRequests = requests.filter(req => 
    req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/api/proposals/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceRequestId: selectedRequest._id,
          providerId: user?.id,
          price: Number(price),
          message: message
        }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Teklif başarıyla iletildi. Ücret tahsilatı tamamlandı.');
        setSelectedRequest(null);
        setPrice(''); setMessage('');
        if (data.newBalance !== undefined) setMyBalance(data.newBalance); 
        fetchData(); 
      } else {
        alert(data.message || 'Sistem hatası.');
      }
    } catch (err) {
      alert('Bağlantı hatası.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (proposalId: string) => {
    const text = replyTexts[proposalId];
    if (!text || text.trim() === '') return;
    try {
      const response = await fetch(`http://localhost:5000/api/proposals/${proposalId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: 'provider', text })
      });
      if (response.ok) {
        setReplyTexts(prev => ({ ...prev, [proposalId]: '' }));
        fetchData(); 
      }
    } catch (error) {
      alert("İletim hatası.");
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const response = await fetch(`http://localhost:5000/api/providers/${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ about, portfolioImages })
      });
      if (response.ok) {
        alert("Firma profili güncellendi.");
      } else {
        alert("Güncelleme hatası.");
      }
    } catch (error) {
      alert("Bağlantı hatası.");
    } finally {
      setSavingProfile(false);
    }
  };

  const addImage = () => {
    if (newImageUrl.trim() !== '') {
      setPortfolioImages([...portfolioImages, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    setPortfolioImages(portfolioImages.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-[1920px] mx-auto px-6 py-12 lg:px-10 flex flex-col lg:flex-row gap-8 items-start bg-gray-50 min-h-screen font-sans">
      
      {/* SOL MENÜ - KURUMSAL BEYAZ/KIRMIZI */}
      <aside className="w-full lg:w-72 bg-white shadow-sm border border-gray-200 p-8 lg:sticky lg:top-28 shrink-0">
        <div className="flex flex-col items-center text-center mb-8 border-b border-gray-200 pb-8">
          <div className="w-20 h-20 bg-gray-900 text-white flex items-center justify-center text-3xl font-bold mb-4 shadow-md">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <h3 className="font-bold text-gray-900 text-xl tracking-tight">{user?.name}</h3>
          <p className="text-sm text-red-600 font-bold mt-1 uppercase tracking-widest">Profesyonel / Firma</p>

          <div className="mt-6 bg-gray-50 p-5 border border-gray-200 w-full text-center">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Cari Bakiye</p>
            <p className="text-3xl font-bold text-gray-900">{myBalance !== null ? myBalance : '...'} <span className="text-sm font-medium text-gray-500">Kredi</span></p>
            <button className="mt-4 w-full border-2 border-gray-900 text-gray-900 font-bold py-2.5 hover:bg-gray-900 hover:text-white transition-colors">
              Bakiye Yükle
            </button>
          </div>
        </div>
        
        <nav className="space-y-2 flex flex-row lg:flex-col overflow-x-auto pb-2 lg:pb-0">
          <button 
            onClick={() => setActiveTab('opportunities')} 
            className={`whitespace-nowrap w-full text-left px-5 py-4 font-semibold transition-all ${activeTab === 'opportunities' ? 'bg-red-50 text-red-700 border-l-4 border-red-600' : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'}`}
          >
            İş Fırsatları
          </button>
          <button 
            onClick={() => setActiveTab('profile')} 
            className={`whitespace-nowrap w-full text-left px-5 py-4 font-semibold transition-all ${activeTab === 'profile' ? 'bg-red-50 text-red-700 border-l-4 border-red-600' : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'}`}
          >
            Firma Vitrini
          </button>
        </nav>
      </aside>

      {/* ANA İÇERİK */}
      <main className="flex-1 w-full bg-white shadow-sm border border-gray-200 p-8 lg:p-12">
        
        {/* SEKME 1: İŞ FIRSATLARI */}
        {activeTab === 'opportunities' && (
          <div className="animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Aktif İş Fırsatları</h1>
                <p className="text-gray-500 mt-2 font-medium">Sistemdeki açık ilanları inceleyin ve teklifinizi iletin.</p>
              </div>
              <input 
                type="text" placeholder="Lokasyon veya kelime ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-72 px-5 py-3 border border-gray-300 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 font-medium"
              />
            </div>

            {loading ? <div className="text-center py-20 font-medium text-gray-500 text-lg">Veriler Yükleniyor...</div> : (
              <div className="space-y-8">
                {filteredRequests.map((req) => {
                  const proposal = myProposals.find(p => (p.serviceRequest?._id || p.serviceRequest) === req._id);
                  const hasBid = !!proposal;

                  return (
                    <div key={req._id} className={`bg-white border p-8 transition-all ${hasBid ? 'border-red-600 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
                      
                      <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                        <div className="flex-1 w-full">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="bg-gray-900 text-white text-xs font-bold px-3 py-1.5 uppercase tracking-widest">{req.category}</span>
                            <span className="bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1.5 uppercase tracking-widest">{req.location}</span>
                          </div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-3">{req.title}</h2>
                          <p className="text-gray-600 font-medium leading-relaxed mb-4">{req.description}</p>
                        </div>

                        {!hasBid && (
                          <div className="w-full lg:w-72 bg-gray-50 p-6 border border-gray-200 text-center shrink-0">
                            <div className="bg-white text-gray-900 text-sm font-bold py-3 px-4 border border-gray-300 mb-4 inline-block w-full">
                              Hizmet Bedeli: <span className="text-red-600">{req.leadFee || 20} Kredi</span>
                            </div>
                            <button 
                              onClick={() => setSelectedRequest(req)}
                              className="w-full bg-red-600 text-white font-bold py-3.5 hover:bg-red-700 transition-colors disabled:opacity-50"
                              disabled={!user?.isApproved}
                            >
                              Teklif İlet ve İletişime Geç
                            </button>
                          </div>
                        )}
                      </div>

                      {hasBid && proposal && (
                        <div className="w-full mt-8 pt-8 border-t border-gray-200 flex flex-col xl:flex-row gap-8">
                          <div className="w-full xl:w-1/3">
                            <div className="flex items-center gap-2 mb-6">
                              <span className="bg-gray-100 text-gray-800 px-3 py-1 text-xs font-bold uppercase tracking-widest border border-gray-300">İletildi</span>
                              {proposal.status === 'accepted' && <span className="bg-red-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-widest">Sözleşme Onaylandı</span>}
                              {proposal.status === 'completed' && <span className="bg-gray-900 text-white px-3 py-1 text-xs font-bold uppercase tracking-widest">Tamamlandı</span>}
                            </div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Verilen Fiyat</p>
                            <p className="text-4xl font-bold text-gray-900 mb-8">{proposal.price} <span className="text-lg text-gray-500">TL</span></p>

                            <div className="bg-gray-50 p-5 border border-gray-200">
                              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Müşteri İletişim</p>
                              {(req.phoneNumber || proposal.serviceRequest?.phoneNumber) ? (
                                <a href={`tel:${req.phoneNumber || proposal.serviceRequest.phoneNumber}`} className="text-red-600 font-bold text-2xl hover:text-red-800 transition-colors">
                                  {req.phoneNumber || proposal.serviceRequest.phoneNumber}
                                </a>
                              ) : (
                                <span className="text-gray-400 font-medium text-sm">Numara Bulunamadı</span>
                              )}
                            </div>
                          </div>

                          <div className="w-full xl:w-2/3 flex flex-col h-[350px]">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Mesaj Paneli</h3>
                            <div className="flex-1 overflow-y-auto bg-gray-50 p-5 border border-gray-200 mb-4 flex flex-col gap-4">
                              {proposal.conversation?.map((msg: any, idx: number) => (
                                <div key={idx} className={`max-w-[85%] ${msg.sender === 'provider' ? 'self-end' : 'self-start'}`}>
                                  <p className={`text-[10px] text-gray-400 font-bold mb-1 uppercase tracking-wider ${msg.sender === 'provider' ? 'text-right' : ''}`}>
                                    {msg.sender === 'provider' ? 'Firma (Siz)' : 'Müşteri'}
                                  </p>
                                  <div className={`p-4 font-medium text-sm border ${msg.sender === 'provider' ? 'bg-red-600 text-white border-red-600' : 'bg-white border-gray-200 text-gray-800'}`}>
                                    {msg.text}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2 relative">
                              <input 
                                type="text" placeholder="Mesaj metnini girin..." value={replyTexts[proposal._id] || ''}
                                onChange={(e) => setReplyTexts(prev => ({...prev, [proposal._id]: e.target.value}))}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendReply(proposal._id)}
                                className="flex-1 px-5 py-3.5 border border-gray-300 focus:outline-none focus:border-red-600 font-medium"
                              />
                              <button onClick={() => handleSendReply(proposal._id)} className="bg-gray-900 text-white px-8 font-bold hover:bg-gray-800 transition-colors">
                                İlet
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SEKME 2: FİRMA VİTRİNİ */}
        {activeTab === 'profile' && (
          <div className="animate-fade-in max-w-4xl">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-4">Firma Vitrini</h1>
            <p className="text-gray-500 font-medium mb-10">Kurumsal profilinizi buradan yönetebilirsiniz. Müşteriler teklifinizi değerlendirirken bu bilgileri referans alacaktır.</p>

            <form onSubmit={handleProfileUpdate} className="space-y-8">
              
              <div className="bg-gray-50 p-8 border border-gray-200">
                <label className="block text-sm font-bold text-gray-900 uppercase tracking-widest mb-2">Hakkımızda / Kurumsal Tanıtım</label>
                <p className="text-sm text-gray-500 mb-4 font-medium">Firmanızın operasyonel yetkinliklerini, altyapısını ve kalite standartlarını belirtin.</p>
                <textarea 
                  rows={6} value={about} onChange={(e) => setAbout(e.target.value)}
                  placeholder="Firmanızın tanıtım metni..."
                  className="w-full px-5 py-4 border border-gray-300 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 font-medium resize-none"
                ></textarea>
              </div>

              <div className="bg-gray-50 p-8 border border-gray-200">
                <label className="block text-sm font-bold text-gray-900 uppercase tracking-widest mb-2">Referans Görselleri (Portfolyo)</label>
                <p className="text-sm text-gray-500 mb-4 font-medium">Araç, ekipman veya operasyon görsellerinizin URL bağlantılarını ekleyin.</p>
                
                <div className="flex gap-2 mb-6">
                  <input 
                    type="url" placeholder="Görsel bağlantısı (https://...)" value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)}
                    className="flex-1 px-5 py-3 border border-gray-300 focus:outline-none focus:border-red-600 font-medium"
                  />
                  <button type="button" onClick={addImage} className="bg-gray-900 text-white px-8 font-bold hover:bg-gray-800 transition-colors">
                    Ekle
                  </button>
                </div>

                {portfolioImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {portfolioImages.map((img, index) => (
                      <div key={index} className="relative group border border-gray-200 aspect-video bg-white overflow-hidden">
                        <img src={img} alt="Portfolyo" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/300?text=Gecersiz+Gorsel')} />
                        <button type="button" onClick={() => removeImage(index)} className="absolute top-2 right-2 bg-red-600 text-white w-8 h-8 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {portfolioImages.length === 0 && (
                  <div className="text-center py-8 border border-dashed border-gray-300 text-gray-400 font-medium">
                    Sisteme kayıtlı görsel bulunmamaktadır.
                  </div>
                )}
              </div>

              <button type="submit" disabled={savingProfile} className="w-full bg-red-600 text-white font-bold text-lg py-4 hover:bg-red-700 transition-colors disabled:opacity-50">
                {savingProfile ? 'Veriler İşleniyor...' : 'Kurumsal Verileri Güncelle'}
              </button>

            </form>
          </div>
        )}

      </main>

      {/* İLK TEKLİF MODALI */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-gray-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full p-8 relative border-t-4 border-red-600">
            <button onClick={() => setSelectedRequest(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 text-2xl font-light">&times;</button>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Teklif Formu</h2>
            <p className="text-gray-500 font-medium mb-6 text-sm">İşlem onaylandığında cari hesabınızdan <strong className="text-gray-900">{selectedRequest.leadFee || 20} Kredi</strong> düşülecektir.</p>

            <form onSubmit={handleBidSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-widest">Tahmini Tutar (TL)</label>
                <input type="number" required value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-5 py-4 border border-gray-300 font-bold focus:border-red-600 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-widest">Ön Yazı / Mesaj</label>
                <textarea required rows={4} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full px-5 py-4 border border-gray-300 resize-none focus:border-red-600 focus:outline-none font-medium"></textarea>
              </div>
              <button type="submit" disabled={submitting} className="w-full bg-red-600 text-white font-bold py-4 hover:bg-red-700 transition-colors disabled:opacity-50">
                {submitting ? 'İşlem Devam Ediyor...' : 'Onayla ve Gönder'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}