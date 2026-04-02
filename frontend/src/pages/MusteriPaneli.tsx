import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const TURKISH_CITIES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ankara', 'Antalya', 'Bursa', 'Diyarbakır', 'Erzurum', 'Eskişehir', 'Gaziantep', 'İstanbul', 'İzmir', 'Kayseri', 'Kocaeli', 'Konya', 'Mersin', 'Sakarya', 'Samsun', 'Trabzon', 'Şanlıurfa'
];

const LocationInput = ({ value, onChange, placeholder, label }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredCities, setFilteredCities] = useState(TURKISH_CITIES);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    setFilteredCities(TURKISH_CITIES.filter(city => city.toLocaleLowerCase('tr-TR').startsWith(val.toLocaleLowerCase('tr-TR'))));
    setIsOpen(true);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <input
        type="text" value={value} onChange={handleInputChange} onFocus={() => setIsOpen(true)}
        placeholder={placeholder} required
        className="w-full px-5 py-4 border border-gray-300 rounded-none focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all font-medium bg-white"
      />
      {isOpen && filteredCities.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 shadow-xl max-h-48 overflow-y-auto">
          {filteredCities.map((city) => (
            <li key={city} onClick={() => { onChange(city); setIsOpen(false); }} className="px-5 py-3 hover:bg-red-50 hover:text-red-700 cursor-pointer font-medium text-gray-700 transition-colors">
              {city}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default function MusteriPaneli() {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('new-request'); 
  const [proposals, setProposals] = useState<any[]>([]);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

  const [reviewModal, setReviewModal] = useState({ isOpen: false, proposalId: '', providerId: '', providerName: '' });
  const [profileModal, setProfileModal] = useState<{ isOpen: boolean, provider: any, reviews: any[] }>({ isOpen: false, provider: null, reviews: [] });
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const [category, setCategory] = useState('nakliyat');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [houseSize, setHouseSize] = useState('2+1');
  const [packingRequired, setPackingRequired] = useState('Hayır');
  const [moveDate, setMoveDate] = useState('');
  const [fromFloor, setFromFloor] = useState('1. Kat');
  const [toFloor, setToFloor] = useState('1. Kat');
  const [description, setDescription] = useState('');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); setError(''); setLoading(true);
    const autoTitle = `${fromLocation} - ${toLocation} Arası ${houseSize} Evden Eve Nakliyat`;
    try {
      const response = await fetch('http://localhost:5000/api/requests/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: user?.id, category, title: autoTitle, description: description || 'Detaylı açıklama girilmedi.',
          location: fromLocation, phoneNumber: phoneNumber,
          details: { fromLocation, toLocation, houseSize, packingRequired, moveDate, fromFloor, toFloor }
        }),
      });
      if (response.ok) {
        setMessage('İlanınız başarıyla sistemimize kaydedilmiştir.');
        setFromLocation(''); setToLocation(''); setMoveDate(''); setDescription(''); setPhoneNumber('');
        setActiveTab('my-proposals');
      } else {
        const data = await response.json();
        setError(data.message || 'Sistemsel bir hata meydana geldi.');
      }
    } catch (err) {
      setError('Sunucu bağlantısı kurulamadı.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProposals = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/proposals/customer/${user?.id}`);
      if (response.ok) setProposals(await response.json());
    } catch (err) {
      console.error("Teklifler çekilemedi", err);
    }
  };

  useEffect(() => {
    if (activeTab === 'my-proposals' && user?.id) fetchProposals();
  }, [activeTab, user?.id]);

  const handleAcceptProposal = async (id: string) => {
    if(!window.confirm("Bu teklifi onaylamak istediğinize emin misiniz? İşlem geri alınamaz.")) return;
    try {
      const response = await fetch(`http://localhost:5000/api/proposals/accept/${id}`, { method: 'PATCH' });
      if (response.ok) {
        alert("Anlaşma resmi olarak onaylandı.");
        fetchProposals();
      }
    } catch (err) {
      alert("İşlem sırasında hata oluştu.");
    }
  };

  const handleSendReply = async (proposalId: string) => {
    const text = replyTexts[proposalId];
    if (!text || text.trim() === '') return;
    try {
      const response = await fetch(`http://localhost:5000/api/proposals/${proposalId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: 'customer', text })
      });
      if (response.ok) {
        setReplyTexts(prev => ({ ...prev, [proposalId]: '' }));
        fetchProposals();
      }
    } catch (error) {
      alert("Mesaj gönderilemedi.");
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const response = await fetch('http://localhost:5000/api/reviews/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId: reviewModal.proposalId, customerId: user?.id, providerId: reviewModal.providerId, rating, comment
        })
      });
      if (response.ok) {
        alert('Değerlendirmeniz sisteme işlenmiştir. Teşekkür ederiz.');
        setReviewModal({ isOpen: false, proposalId: '', providerId: '', providerName: '' });
        setRating(5); setComment('');
        fetchProposals();
      } else {
        alert('Hata oluştu.');
      }
    } catch (err) {
      alert('Sunucuya bağlanılamadı.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleViewProfile = async (providerId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/providers/${providerId}`);
      if (response.ok) {
        const data = await response.json();
        setProfileModal({ isOpen: true, provider: data.provider, reviews: data.reviews });
      }
    } catch (error) {
      alert("Profil bilgileri alınamadı.");
    }
  };

  return (
    <div className="max-w-[1920px] mx-auto px-6 py-12 lg:px-10 flex flex-col lg:flex-row gap-8 items-start bg-gray-50 min-h-screen font-sans">
      
      {/* SOL MENÜ - KURUMSAL BEYAZ/KIRMIZI */}
      <aside className="w-full lg:w-72 bg-white shadow-sm border border-gray-200 p-8 lg:sticky lg:top-28 shrink-0">
        <div className="flex flex-col items-center text-center mb-8 border-b border-gray-200 pb-8">
          <div className="w-20 h-20 bg-red-600 text-white flex items-center justify-center text-3xl font-bold mb-4 shadow-md">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <h3 className="font-bold text-gray-900 text-xl tracking-tight">{user?.name}</h3>
          <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-widest">Müşteri Portalı</p>
        </div>
        <nav className="space-y-2 flex flex-row lg:flex-col overflow-x-auto pb-2 lg:pb-0">
          <button onClick={() => setActiveTab('new-request')} className={`whitespace-nowrap w-full text-left px-5 py-4 font-semibold transition-all ${activeTab === 'new-request' ? 'bg-red-50 text-red-700 border-l-4 border-red-600' : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'}`}>
            Yeni Talep Oluştur
          </button>
          <button onClick={() => setActiveTab('my-proposals')} className={`whitespace-nowrap w-full flex justify-between items-center text-left px-5 py-4 font-semibold transition-all ${activeTab === 'my-proposals' ? 'bg-red-50 text-red-700 border-l-4 border-red-600' : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'}`}>
            <span>Gelen Teklifler</span>
            <span className="bg-gray-900 text-white px-2.5 py-1 rounded text-xs">{proposals.length}</span>
          </button>
        </nav>
      </aside>

      {/* ANA İÇERİK */}
      <main className="flex-1 w-full bg-white shadow-sm border border-gray-200 p-8 lg:p-12">
        
        {activeTab === 'new-request' && (
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-8">Hizmet Talebi Oluştur</h1>
            
            {message && <div className="bg-green-50 text-green-800 p-5 border-l-4 border-green-600 font-medium mb-8 flex items-center gap-3">✓ {message}</div>}
            {error && <div className="bg-red-50 text-red-800 p-5 border-l-4 border-red-600 font-medium mb-8 flex items-center gap-3">✕ {error}</div>}

            <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
              <div className="bg-gray-50 p-6 border border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Hizmet Kategorisi</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['nakliyat', 'temizlik', 'tamirat', 'boya'].map((cat) => (
                    <button key={cat} type="button" onClick={() => setCategory(cat)} className={`py-3 px-4 font-semibold text-sm capitalize transition-all border ${category === cat ? 'border-red-600 bg-red-600 text-white shadow-md' : 'border-gray-300 bg-white text-gray-600 hover:border-red-400'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {category === 'nakliyat' && (
                <div className="space-y-8 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <LocationInput label="Yükleme Noktası" placeholder="Örn: Ankara" value={fromLocation} onChange={setFromLocation} />
                    <LocationInput label="Teslimat Noktası" placeholder="Örn: İstanbul" value={toLocation} onChange={setToLocation} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-gray-200 pt-8">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Hacim / Ev Tipi</label>
                      <select value={houseSize} onChange={(e) => setHouseSize(e.target.value)} className="w-full px-5 py-4 border border-gray-300 rounded-none font-medium focus:border-red-600 focus:outline-none bg-white">
                        {['1+0', '1+1', '2+1', '3+1', '4+1', 'Villa / Müstakil'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Paketleme Hizmeti</label>
                      <select value={packingRequired} onChange={(e) => setPackingRequired(e.target.value)} className="w-full px-5 py-4 border border-gray-300 rounded-none font-medium focus:border-red-600 focus:outline-none bg-white">
                        <option value="Hayır">Müşteri Tarafından</option>
                        <option value="Evet">Firma Tarafından</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">İşlem Tarihi</label>
                      <input type="date" required value={moveDate} onChange={(e) => setMoveDate(e.target.value)} className="w-full px-5 py-4 border border-gray-300 rounded-none font-medium focus:border-red-600 focus:outline-none bg-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-200 pt-8">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Yükleme Katı</label>
                      <select value={fromFloor} onChange={(e) => setFromFloor(e.target.value)} className="w-full px-5 py-4 border border-gray-300 rounded-none font-medium focus:border-red-600 focus:outline-none bg-white">
                        {['Zemin Kat', '1. Kat', '2. Kat', '3. Kat', '4. Kat', '5+ Kat', 'Asansörlü Bina'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Teslimat Katı</label>
                      <select value={toFloor} onChange={(e) => setToFloor(e.target.value)} className="w-full px-5 py-4 border border-gray-300 rounded-none font-medium focus:border-red-600 focus:outline-none bg-white">
                        {['Zemin Kat', '1. Kat', '2. Kat', '3. Kat', '4. Kat', '5+ Kat', 'Asansörlü Bina'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-8">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ek Operasyonel Notlar</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Örn: Ağır kasa, piyano mevcuttur..." className="w-full px-5 py-4 border border-gray-300 rounded-none focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all font-medium resize-none"></textarea>
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 pt-8 mt-8">
                <label className="block text-sm font-semibold text-gray-700 mb-2">İletişim Numarası</label>
                <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required placeholder="05XX XXX XX XX" className="w-full md:w-1/2 px-5 py-4 border border-gray-300 rounded-none focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all font-medium" />
              </div>

              <div className="pt-6 border-t border-gray-200">
                <button type="submit" disabled={loading || category !== 'nakliyat'} className="w-full md:w-auto px-12 py-4 bg-red-600 text-white font-bold text-lg hover:bg-red-700 transition-colors disabled:opacity-50">
                  {loading ? 'İşleniyor...' : 'Talebi Sisteme İlet'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SEKME 2: GELEN TEKLİFLER */}
        {activeTab === 'my-proposals' && (
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 tracking-tight">Gelen Teklifler</h1>
            {proposals.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 border border-gray-200">
                <p className="text-gray-500 font-medium">Sistemde henüz bekleyen bir teklifiniz bulunmamaktadır.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {proposals.map((prop) => (
                  <div key={prop._id} className={`p-8 border bg-white flex flex-col xl:flex-row gap-8 transition-all ${prop.status === 'accepted' ? 'border-red-600 shadow-md' : 'border-gray-200'}`}>
                    
                    <div className="w-full xl:w-1/3 border-b xl:border-b-0 xl:border-r border-gray-200 pb-6 xl:pb-0 xl:pr-6 flex flex-col">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{prop.serviceRequest?.title}</span>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{prop.provider?.name}</h2>
                      
                      <button onClick={() => handleViewProfile(prop.provider._id)} className="text-sm font-semibold text-red-600 hover:text-red-800 transition-colors mb-6 text-left w-max">
                        Profili ve Belgeleri İncele →
                      </button>

                      <div className="mb-6 bg-gray-50 p-4 border border-gray-200">
                        <p className="text-xs text-gray-500 font-bold uppercase mb-1">Teklif Edilen Tutar</p>
                        <p className="text-3xl font-bold text-gray-900">{prop.price} <span className="text-lg font-medium text-gray-500">TL</span></p>
                      </div>

                      {prop.status === 'pending' && (
                        <button onClick={() => handleAcceptProposal(prop._id)} className="w-full bg-red-600 text-white font-bold py-3.5 hover:bg-red-700 transition-colors mt-auto">
                          Teklifi Onayla
                        </button>
                      )}

                      {prop.status === 'accepted' && (
                        <div className="space-y-3 mt-auto">
                          <div className="text-center p-3 bg-gray-900 text-white font-bold text-sm uppercase tracking-wider">Anlaşma Sağlandı</div>
                          <button onClick={() => setReviewModal({ isOpen: true, proposalId: prop._id, providerId: prop.provider._id, providerName: prop.provider.name })} className="w-full border-2 border-gray-900 text-gray-900 font-bold py-3 hover:bg-gray-900 hover:text-white transition-colors">
                            Hizmeti Değerlendir
                          </button>
                        </div>
                      )}

                      {prop.status === 'completed' && (
                        <div className="text-center p-3 bg-gray-200 text-gray-700 font-bold text-sm uppercase tracking-wider mt-auto">İşlem Tamamlandı</div>
                      )}
                    </div>

                    <div className="w-full xl:w-2/3 flex flex-col h-[400px]">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">İletişim Paneli</h3>
                      <div className="flex-1 overflow-y-auto bg-gray-50 p-5 border border-gray-200 mb-4 flex flex-col gap-4">
                        {prop.conversation?.map((msg: any, idx: number) => (
                          <div key={idx} className={`max-w-[85%] ${msg.sender === 'customer' ? 'self-end' : 'self-start'}`}>
                            <p className={`text-[10px] text-gray-400 font-bold mb-1 uppercase tracking-wider ${msg.sender === 'customer' ? 'text-right' : ''}`}>
                              {msg.sender === 'customer' ? 'Siz' : prop.provider?.name}
                            </p>
                            <div className={`p-4 font-medium text-sm border ${msg.sender === 'customer' ? 'bg-red-600 text-white border-red-600' : 'bg-white border-gray-200 text-gray-800'}`}>
                              {msg.text}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input type="text" placeholder="Mesajınızı iletin..." value={replyTexts[prop._id] || ''} onChange={(e) => setReplyTexts(prev => ({ ...prev, [prop._id]: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && handleSendReply(prop._id)} className="flex-1 px-4 py-3 border border-gray-300 focus:outline-none focus:border-red-600" />
                        <button onClick={() => handleSendReply(prop._id)} className="bg-gray-900 text-white px-8 font-bold hover:bg-gray-800 transition-colors">İlet</button>
                      </div>
                    </div>
                    
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* DEĞERLENDİRME MODALI */}
      {reviewModal.isOpen && (
        <div className="fixed inset-0 bg-gray-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full p-8 relative border-t-4 border-red-600">
            <button onClick={() => setReviewModal({ ...reviewModal, isOpen: false })} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 text-2xl font-light">&times;</button>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Hizmet Değerlendirmesi</h2>
            <p className="text-gray-500 font-medium mb-8 text-sm">Lütfen <strong className="text-gray-900">{reviewModal.providerName}</strong> hizmet kalitesini puanlayın.</p>
            <form onSubmit={handleReviewSubmit} className="space-y-6">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setRating(star)} className={`text-4xl transition-colors ${rating >= star ? 'text-red-600' : 'text-gray-200'}`}>★</button>
                ))}
              </div>
              <textarea required rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Deneyiminize dair detayları aktarın..." className="w-full px-5 py-4 border border-gray-300 focus:border-red-600 focus:outline-none font-medium resize-none"></textarea>
              <button type="submit" disabled={submittingReview} className="w-full bg-red-600 text-white font-bold py-4 hover:bg-red-700 transition-colors disabled:opacity-50">
                {submittingReview ? 'İşleniyor...' : 'Değerlendirmeyi Kaydet'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PROFİL İNCELEME MODALI */}
      {profileModal.isOpen && profileModal.provider && (
        <div className="fixed inset-0 bg-gray-900/90 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-4xl w-full max-h-[90vh] overflow-y-auto relative animate-fade-in border-t-4 border-red-600">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{profileModal.provider.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-red-600 font-bold text-sm">
                    ★ {profileModal.provider.averageRating > 0 ? profileModal.provider.averageRating.toFixed(1) : 'Yeni'}
                  </span>
                  <span className="text-gray-500 text-sm font-medium">({profileModal.provider.reviewCount} Değerlendirme)</span>
                </div>
              </div>
              <button onClick={() => setProfileModal({ isOpen: false, provider: null, reviews: [] })} className="text-gray-400 hover:text-gray-900 text-3xl font-light">&times;</button>
            </div>

            <div className="p-8 space-y-10">
              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wider border-b border-gray-200 pb-2">Firma Hakkında</h3>
                <p className="text-gray-600 font-medium leading-relaxed">{profileModal.provider.about}</p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wider border-b border-gray-200 pb-2">Referans Görselleri</h3>
                {profileModal.provider.portfolioImages?.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {profileModal.provider.portfolioImages.map((img: string, idx: number) => (
                      <div key={idx} className="aspect-video bg-gray-100 border border-gray-200">
                        <img src={img} alt="Portfolyo" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/300?text=Gorsel+Yok')} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Firma sisteme görsel yüklememiştir.</p>
                )}
              </section>

              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wider border-b border-gray-200 pb-2">Müşteri Değerlendirmeleri</h3>
                {profileModal.reviews?.length > 0 ? (
                  <div className="space-y-4">
                    {profileModal.reviews.map((rev, idx) => (
                      <div key={idx} className="bg-gray-50 p-6 border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-bold text-gray-900">{rev.customer?.name || 'Kayıtlı Müşteri'}</p>
                          <span className="text-red-600 text-sm">{'★'.repeat(rev.rating)}{'☆'.repeat(5-rev.rating)}</span>
                        </div>
                        <p className="text-gray-600 font-medium text-sm">{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Firma henüz değerlendirme almamıştır.</p>
                )}
              </section>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}