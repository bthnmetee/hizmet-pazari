import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Provider {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  serviceCategory: string;
  companyName: string;
  taxCertificateUrl: string;
}

export default function AdminDashboard() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { logout } = useAuth();
  const navigate = useNavigate();

  const fetchPendingProviders = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/providers/pending');
      const data = await response.json();

      if (response.ok) {
        setProviders(data);
      } else {
        setError(data.message || 'Veriler alınamadı.');
      }
    } catch {
      setError('Sunucuya bağlanılamadı. Backend açık mı?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingProviders();
  }, []);

  const handleApprove = async (id: string) => {
    if (!window.confirm('Bu kullanıcıyı onaylamak istediğinize emin misiniz?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/admin/providers/approve/${id}`, { method: 'PUT' });
      if (response.ok) {
        alert('Kullanıcı başarıyla onaylandı!');
        setProviders(providers.filter((provider) => provider._id !== id));
      }
    } catch {
      alert('Onaylama işlemi sırasında bir hata oluştu.');
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm('Bu başvuruyu reddetmek ve silmek istediğinize emin misiniz?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/admin/providers/reject/${id}`, { method: 'DELETE' });
      if (response.ok) {
        alert('Başvuru reddedildi ve silindi.');
        setProviders(providers.filter((provider) => provider._id !== id));
      }
    } catch {
      alert('Reddetme işlemi sırasında bir hata oluştu.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl font-bold text-gray-500">Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-emerald-500/20">HP</div>
          <span className="text-xl font-black text-gray-900">Admin Panel</span>
        </div>
        <button onClick={handleLogout} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-red-600 transition-colors">Çıkış Yap</button>
      </header>

      <div className="max-w-7xl mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Onay Bekleyen Başvurular</h1>
            <p className="text-gray-500 mt-1 font-medium">Hizmet veren başvurularını yönetin.</p>
          </div>
          <div className="bg-white px-5 py-3 rounded-2xl shadow-sm font-bold text-gray-700 border border-gray-100">
            Bekleyen: <span className="text-emerald-600">{providers.length}</span>
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-2xl mb-6 font-bold">{error}</div>}

        {providers.length === 0 && !loading ? (
          <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-black text-gray-900">Tebrikler!</h3>
            <p className="text-gray-500 mt-2 font-medium">Bekleyen başvuru yok. Tüm kayıtlar incelenmiş.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider) => (
              <div key={provider._id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                {provider.taxCertificateUrl && (
                  <div className="h-48 bg-gray-100 relative group overflow-hidden">
                    <img
                      src={provider.taxCertificateUrl}
                      alt="Vergi Levhası"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <a href={provider.taxCertificateUrl} target="_blank" rel="noopener noreferrer" className="bg-white text-gray-900 px-4 py-2 rounded-xl font-bold text-sm hover:bg-gray-100">
                        Büyüt / İncele
                      </a>
                    </div>
                  </div>
                )}

                <div className="p-6">
                  <h3 className="text-lg font-black text-gray-900">{provider.companyName || provider.name}</h3>
                  <p className="text-sm font-bold text-emerald-600 uppercase tracking-wider mt-1">{provider.serviceCategory}</p>

                  <div className="space-y-2 text-sm text-gray-500 mt-4">
                    <p>👤 {provider.name}</p>
                    <p>📧 {provider.email}</p>
                    <p>📱 {provider.phoneNumber}</p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                  <button
                    onClick={() => handleReject(provider._id)}
                    className="flex-1 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors"
                  >
                    Reddet
                  </button>
                  <button
                    onClick={() => handleApprove(provider._id)}
                    className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-md"
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
