import React, { useEffect, useState } from 'react';

// TypeScript için hizmet veren veri modelimiz
interface Provider {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  serviceCategory: string;
  taxPlateUrl: string;
}

export default function AdminDashboard() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sayfa açıldığında onay bekleyenleri getir
  const fetchPendingProviders = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/providers/pending');
      const data = await response.json();
      
      if (response.ok) {
        setProviders(data);
      } else {
        setError(data.message || 'Veriler alınamadı.');
      }
    } catch (err) {
      setError('Sunucuya bağlanılamadı. Backend açık mı?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingProviders();
  }, []);

  // Hizmet Vereni Onayla
  const handleApprove = async (id: string) => {
    if (!window.confirm('Bu kullanıcıyı onaylamak istediğinize emin misiniz?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/admin/providers/approve/${id}`, {
        method: 'PUT'
      });
      if (response.ok) {
        alert('Kullanıcı başarıyla onaylandı!');
        // Onaylanan kullanıcıyı listeden çıkar
        setProviders(providers.filter(p => p._id !== id));
      }
    } catch (error) {
      alert('Onaylama işlemi sırasında bir hata oluştu.');
    }
  };

  // Hizmet Vereni Reddet
  const handleReject = async (id: string) => {
    if (!window.confirm('Bu başvuruyu REDDETMEK ve SİLMEK istediğinize emin misiniz?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/admin/providers/reject/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        alert('Başvuru reddedildi ve silindi.');
        // Silinen kullanıcıyı listeden çıkar
        setProviders(providers.filter(p => p._id !== id));
      }
    } catch (error) {
      alert('Reddetme işlemi sırasında bir hata oluştu.');
    }
  };

  // Resim yollarını (Windows'taki ters slash'leri vs.) düzeltip tam URL'ye çeviren yardımcı fonksiyon
  const getImageUrl = (path: string) => {
    const cleanPath = path.replace(/\\/g, '/'); // Windows dosya yollarını tarayıcı uyumlu hale getirir
    return `http://localhost:5000/${cleanPath}`;
  };

  if (loading) return <div className="text-center py-20 text-xl font-bold text-slate-600">Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800">Admin Kontrol Paneli</h1>
            <p className="text-slate-500 mt-1">Onay bekleyen hizmet veren başvurularını yönetin.</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm font-semibold text-slate-700">
            Bekleyen Başvuru: <span className="text-blue-600">{providers.length}</span>
          </div>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded-xl mb-6">{error}</div>}

        {providers.length === 0 && !loading ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-slate-700">Harika! Bekleyen başvuru yok.</h3>
            <p className="text-slate-500">Tüm hizmet verenler incelenmiş durumda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider) => (
              <div key={provider._id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                {/* Vergi Levhası Görseli */}
                <div className="h-48 bg-slate-200 relative group overflow-hidden">
                  <img 
                    src={getImageUrl(provider.taxPlateUrl)} 
                    alt="Vergi Levhası" 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=Gorsel+Bulunamadi' }}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a href={getImageUrl(provider.taxPlateUrl)} target="_blank" rel="noopener noreferrer" className="bg-white text-slate-900 px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-100 transition-colors">
                      Büyüt / İncele
                    </a>
                  </div>
                </div>

                {/* Kullanıcı Bilgileri */}
                <div className="p-5 flex-grow">
                  <h3 className="text-lg font-bold text-slate-800">{provider.name}</h3>
                  <p className="text-sm text-blue-600 font-semibold mb-3 uppercase tracking-wider">{provider.serviceCategory}</p>
                  
                  <div className="space-y-2 text-sm text-slate-600">
                    <p>📧 {provider.email}</p>
                    <p>📱 {provider.phoneNumber}</p>
                  </div>
                </div>

                {/* Butonlar */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                  <button 
                    onClick={() => handleReject(provider._id)}
                    className="flex-1 py-2.5 bg-red-100 text-red-700 font-bold rounded-xl hover:bg-red-200 transition-colors"
                  >
                    Reddet
                  </button>
                  <button 
                    onClick={() => handleApprove(provider._id)}
                    className="flex-1 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
                  >
                    Onayla
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}