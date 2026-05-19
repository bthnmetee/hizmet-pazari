import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AiInsights from '../components/AiInsights';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';

type MenuType = 'overview' | 'pending' | 'customers' | 'providers' | 'transactions' | 'requests';

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState<MenuType>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [stats, setStats] = useState<any>(null);
  const [pendingProviders, setPendingProviders] = useState<any[]>([]);
  const [approvedProviders, setApprovedProviders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        if (activeMenu === 'overview') {
          const res = await axiosInstance.get('/admin/stats');
          setStats(res.data);
        } else if (activeMenu === 'pending') {
          const res = await axiosInstance.get('/admin/providers/pending');
          setPendingProviders(res.data);
        } else if (activeMenu === 'customers') {
          const res = await axiosInstance.get('/admin/customers');
          setCustomers(res.data);
        } else if (activeMenu === 'providers') {
          const res = await axiosInstance.get('/admin/providers/approved');
          setApprovedProviders(res.data);
        } else if (activeMenu === 'transactions') {
          const res = await axiosInstance.get('/admin/transactions');
          setTransactions(res.data);
        } else if (activeMenu === 'requests') {
          const res = await axiosInstance.get('/admin/service-requests');
          setRequests(res.data);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Veri çekilirken hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [activeMenu]);

  const handleApprove = async (id: string) => {
    if (!window.confirm('Bu kullanıcıyı onaylamak istediğinize emin misiniz?')) return;

    try {
      await axiosInstance.put(`/admin/providers/approve/${id}`);
      alert('Başarıyla onaylandı!');
      setPendingProviders((prev) => prev.filter((provider) => provider._id !== id));

      if (stats) {
        setStats({
          ...stats,
          pendingProvidersCount: stats.pendingProvidersCount - 1,
          totalProviders: stats.totalProviders + 1,
        });
      }
    } catch {
      alert('Hata oluştu.');
    }
  };

  const handleRejectOrDeleteProvider = async (id: string, isPending: boolean) => {
    if (!window.confirm('Bu hizmet vereni silmek istediğinize emin misiniz?')) return;

    try {
      await axiosInstance.delete(`/admin/providers/reject/${id}`);
      alert('Kayıt silindi.');

      if (isPending) {
        setPendingProviders((prev) => prev.filter((provider) => provider._id !== id));
      } else {
        setApprovedProviders((prev) => prev.filter((provider) => provider._id !== id));
      }
    } catch {
      alert('Hata oluştu.');
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!window.confirm('Bu müşteriyi silmek istediğinize emin misiniz?')) return;

    try {
      await axiosInstance.delete(`/admin/customers/${id}`);
      alert('Müşteri silindi.');
      setCustomers((prev) => prev.filter((customer) => customer._id !== id));
    } catch {
      alert('Hata oluştu.');
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!window.confirm('Bu hizmet talebini silmek istediğinize emin misiniz? İşlem geri alınamaz.')) return;

    try {
      await axiosInstance.delete(`/admin/service-requests/${id}`);
      alert('Hizmet talebi silindi.');
      setRequests((prev) => prev.filter((req) => req._id !== id));
      if (stats) {
        setStats({ ...stats, totalRequests: Math.max(0, stats.totalRequests - 1) });
      }
    } catch {
      alert('Hata oluştu.');
    }
  };

  const menuItems: { id: MenuType; icon: string; label: string }[] = [
    { id: 'overview', icon: '📊', label: 'Genel Bakış' },
    { id: 'pending', icon: '🔔', label: 'Onay Bekleyenler' },
    { id: 'customers', icon: '👥', label: 'Müşteriler' },
    { id: 'providers', icon: '🏢', label: 'Profesyoneller' },
    { id: 'requests', icon: '📋', label: 'Hizmet Talepleri' },
    { id: 'transactions', icon: '💰', label: 'İşlemler (Finans)' },
  ];

  return (
    <div className="flex min-h-screen bg-navy-50/30 font-sans selection:bg-navy-500/20 selection:text-navy-900">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed left-0 top-0 z-40 flex h-screen w-[280px] shrink-0 flex-col border-r border-navy-100 bg-white transition-transform duration-300 lg:sticky lg:translate-x-0`}
      >
        <div className="p-7 pb-6">
          <div className="group flex cursor-pointer items-center gap-3" onClick={() => navigate('/')}>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-800 text-lg font-black text-white shadow-lg shadow-navy-800/20 transition-shadow">
              HP
            </div>
            <span className="text-xl font-black tracking-tight text-navy-900">
              Admin<span className="text-gold-500">Panel</span>
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveMenu(item.id);
                setSidebarOpen(false);
              }}
              className={`group flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200 ${
                activeMenu === item.id
                  ? 'bg-navy-800 text-white shadow-lg shadow-navy-800/20'
                  : 'text-navy-400 hover:bg-navy-50 hover:text-navy-600'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="border-t border-navy-100 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-navy-50 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-800 text-sm font-black uppercase text-white shadow-lg shadow-navy-800/10">
              A
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-bold text-navy-900">Yönetici</p>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="text-xs font-bold text-red-500 transition-colors hover:text-red-600"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex min-h-screen flex-1 flex-col">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-navy-100 bg-white/80 px-4 py-3 backdrop-blur-xl lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="rounded-xl p-2 text-navy-900 hover:bg-navy-50">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-black text-navy-900">AdminPanel</span>
          <div className="w-8" />
        </div>

        <div className="mx-auto flex-1 w-full max-w-[1600px] p-6 md:p-10">
          <header className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-black text-navy-900 tacking-tight">
                {menuItems.find((item) => item.id === activeMenu)?.label}
              </h1>
              <p className="mt-1 text-sm font-medium text-navy-400">Sistem yönetim paneli</p>
            </div>
            {loading && (
              <span className="animate-pulse rounded-lg border border-navy-100 bg-navy-50 px-3 py-1.5 text-sm font-bold text-navy-400">
                Güncelleniyor...
              </span>
            )}
          </header>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-600">
              {error}
            </div>
          )}

          {activeMenu === 'overview' && stats && (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Onaylı Profesyonel', val: stats.totalProviders, icon: '🏢', bg: 'bg-navy-800', text: 'text-white' },
                  { label: 'Onay Bekleyen', val: stats.pendingProvidersCount, icon: '🔔', bg: 'bg-amber-100', text: 'text-amber-700' },
                  { label: 'Toplam Müşteri', val: stats.totalCustomers, icon: '👥', bg: 'bg-white', text: 'text-navy-900' },
                  { label: 'Oluşturulan Talep', val: stats.totalRequests, icon: '📋', bg: 'bg-white', text: 'text-navy-900' },
                  { label: 'Gerçekleşen İşlem', val: stats.totalTransactions, icon: '💳', bg: 'bg-white', text: 'text-navy-900' },
                  { label: 'Toplam Hacim (TL)', val: `${stats.totalVolume} ₺`, icon: '💰', bg: 'bg-gold-500/10', text: 'text-gold-600' },
                ].map((item, index) => (
                  <div key={index} className={`rounded-3xl border border-navy-100 p-6 shadow-sm ${item.bg}`}>
                    <div className="mb-4 text-3xl opacity-80">{item.icon}</div>
                    <h3 className={`mb-1 text-3xl font-black ${item.text}`}>{item.val}</h3>
                    <p className={`text-sm font-bold ${item.text} opacity-80`}>{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <AiInsights />
              </div>
            </>
          )}

          {activeMenu === 'pending' && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {pendingProviders.length === 0 ? (
                <div className="col-span-full rounded-3xl border border-navy-100 bg-white py-16 text-center">
                  🎉 Bekleyen başvuru yok.
                </div>
              ) : (
                pendingProviders.map((provider) => (
                  <div key={provider._id} className="group overflow-hidden rounded-3xl border border-navy-100 bg-white shadow-sm">
                    {provider.taxCertificateUrl ? (
                      <div className="relative h-48 overflow-hidden bg-navy-50">
                        <img
                          src={provider.taxCertificateUrl}
                          alt="Vergi Levhası"
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-navy-900/60 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                          <a
                            href={provider.taxCertificateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-navy-900 shadow-xl transition-colors hover:bg-gold-500 hover:text-white"
                          >
                            Büyüt ve İncele
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-48 items-center justify-center bg-red-50 text-sm font-bold text-red-500">
                        Vergi Levhası Yok!
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="mb-1 text-lg font-black text-navy-900">{provider.companyName || provider.name}</h3>
                      <p className="mb-4 inline-block rounded-md bg-gold-500/10 px-2 py-1 text-xs font-bold uppercase tracking-widest text-gold-500">
                        {provider.serviceCategory}
                      </p>
                      <div className="mb-6 space-y-1 text-sm font-medium text-navy-400">
                        <p>👤 {provider.name}</p>
                        <p>📧 {provider.email}</p>
                        <p>📱 {provider.phoneNumber}</p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleRejectOrDeleteProvider(provider._id, true)}
                          className="flex-1 rounded-xl bg-red-50 py-3 font-bold text-red-600 transition-colors hover:bg-red-100"
                        >
                          Reddet / Sil
                        </button>
                        <button
                          onClick={() => handleApprove(provider._id)}
                          className="flex-1 rounded-xl bg-navy-800 py-3 font-bold text-white shadow-lg transition-all hover:bg-navy-700"
                        >
                          Onayla ✓
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeMenu === 'customers' && (
            <div className="overflow-hidden rounded-3xl border border-navy-100 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-navy-50/50 text-xs font-bold uppercase text-navy-400">
                    <tr>
                      <th className="px-6 py-4">Ad Soyad</th>
                      <th className="px-6 py-4">E-posta</th>
                      <th className="px-6 py-4">Telefon</th>
                      <th className="px-6 py-4">Kayıt Tarihi</th>
                      <th className="px-6 py-4 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-50">
                    {customers.map((customer) => (
                      <tr key={customer._id} className="hover:bg-navy-50/30">
                        <td className="px-6 py-4 font-bold text-navy-900">{customer.name}</td>
                        <td className="px-6 py-4 text-navy-600">{customer.email}</td>
                        <td className="px-6 py-4 text-navy-600">{customer.phoneNumber}</td>
                        <td className="px-6 py-4 text-navy-400">
                          {new Date(customer.createdAt).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteCustomer(customer._id)}
                            className="rounded-lg px-3 py-1.5 font-bold text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                          >
                            Sil
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeMenu === 'providers' && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {approvedProviders.map((provider) => (
                <div key={provider._id} className="flex flex-col rounded-3xl border border-navy-100 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-black text-navy-900">{provider.companyName || provider.name}</h3>
                      <p className="mt-1 inline-block rounded-md bg-navy-50 px-2 py-1 text-xs font-bold text-navy-500">
                        {provider.serviceCategory}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg border border-gold-200 bg-gold-50 px-2 py-1 text-xs font-bold text-gold-600">
                      ⭐ {provider.averageRating || 0}
                    </div>
                  </div>
                  <div className="mb-6 flex-1 space-y-1 text-sm font-medium text-navy-400">
                    <p>👤 {provider.name}</p>
                    <p>📧 {provider.email}</p>
                    <p>📱 {provider.phoneNumber}</p>
                    <p>
                      💼 Bakiye:{' '}
                      <span className="font-bold text-navy-700">{provider.walletBalance || 0} ₺</span>
                    </p>
                  </div>
                  <div className="flex gap-2 border-t border-navy-50 pt-4">
                    {provider.taxCertificateUrl && (
                      <a
                        href={provider.taxCertificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 rounded-xl bg-navy-50 py-2.5 text-center text-xs font-bold text-navy-600 transition-colors hover:bg-navy-100"
                      >
                        Vergi Levhası
                      </a>
                    )}
                    <button
                      onClick={() => handleRejectOrDeleteProvider(provider._id, false)}
                      className="flex-1 rounded-xl py-2.5 text-xs font-bold text-red-500 transition-colors hover:bg-red-50"
                    >
                      Hesabı Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeMenu === 'requests' && (
            <div className="overflow-hidden rounded-3xl border border-navy-100 bg-white p-6 shadow-sm">
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request._id}
                    className="flex items-center justify-between rounded-2xl border border-navy-100 p-4 transition-colors hover:bg-navy-50/50"
                  >
                    <div>
                      <h4 className="text-lg font-bold text-navy-900">{request.title}</h4>
                      <p className="mt-1 text-xs font-medium text-navy-400">
                        Müşteri: {request.customer?.name} • Şehir: {request.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                          request.status === 'open'
                            ? 'border border-emerald-100 bg-emerald-50 text-emerald-600'
                            : request.status === 'in_progress'
                              ? 'border border-blue-100 bg-blue-50 text-blue-600'
                              : 'border border-gray-200 bg-gray-100 text-gray-500'
                        }`}
                      >
                        {request.status === 'open'
                          ? 'Açık İlan'
                          : request.status === 'in_progress'
                            ? 'Devam Ediyor'
                            : 'Kapalı'}
                      </span>
                      <div className="flex flex-col items-end gap-2 mt-2">
                        <p className="text-[10px] font-bold text-navy-300">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                        <button
                          onClick={() => handleDeleteRequest(request._id)}
                          className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-500 transition-colors hover:bg-red-100 hover:text-red-700"
                        >
                          Talebi Sil
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeMenu === 'transactions' && (
            <div className="overflow-hidden rounded-3xl border border-navy-100 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-navy-100 bg-navy-50/50 text-xs font-bold uppercase text-navy-400">
                    <tr>
                      <th className="px-6 py-4">Tarih</th>
                      <th className="px-6 py-4">Kullanıcı (Kime ait)</th>
                      <th className="px-6 py-4">İşlem Türü</th>
                      <th className="px-6 py-4 text-right">Miktar</th>
                      <th className="px-6 py-4 text-right">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-50">
                    {transactions.map((transaction) => (
                      <tr key={transaction._id} className="transition-colors hover:bg-navy-50/30">
                        <td className="px-6 py-4 font-medium text-navy-500">
                          {new Date(transaction.createdAt).toLocaleString('tr-TR')}
                        </td>
                        <td className="px-6 py-4 font-bold text-navy-900">
                          {transaction.provider?.name || 'Bilinmiyor'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-md px-2 py-1 text-xs font-bold ${
                              transaction.type === 'deposit'
                                ? 'bg-emerald-50 text-emerald-600'
                                : transaction.type === 'proposal_fee'
                                  ? 'bg-amber-50 text-amber-600'
                                  : transaction.type === 'refund'
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'bg-navy-50 text-navy-600'
                            }`}
                          >
                            {transaction.type === 'deposit'
                              ? 'Bakiye Yükleme'
                              : transaction.type === 'proposal_fee'
                                ? 'Teklif Verme Ücreti'
                                : transaction.type === 'refund'
                                  ? 'İade'
                                  : transaction.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-navy-900">
                          {transaction.type === 'proposal_fee' ? '-' : '+'}
                          {transaction.amount} ₺
                        </td>
                        <td className="px-6 py-4 text-right">
                          {transaction.status === 'completed' ? (
                            <span className="text-emerald-500">✓ Başarılı</span>
                          ) : transaction.status === 'pending' ? (
                            <span className="text-amber-500">⏳ Bekliyor</span>
                          ) : (
                            <span className="text-red-500">✕ İptal</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
