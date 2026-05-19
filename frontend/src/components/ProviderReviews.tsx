import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../utils/axiosInstance';

interface ProviderReviewsProps {
  providerId: string | null;
}

const SERVICE_LABELS: Record<string, string> = {
  temizlik: 'Temizlik', tadilat: 'Tadilat & Boya', nakliyat: 'Nakliyat',
  'sehirici-nakliyat': 'Şehiriçi Nakliyat',
  'sehirlerarasi-nakliyat': 'Şehirlerarası Nakliyat',
  'evden-eve-nakliyat': 'Evden Eve Nakliyat',
  'ofis-tasima': 'Ofis Taşıma',
  'parca-esya-tasima': 'Parça Eşya Taşıma',
  'esya-depolama': 'Eşya Depolama',
  yazilim: 'Yazılım & Tasarım', ozelders: 'Özel Ders', guzellik: 'Güzellik & Bakım',
  bahce: 'Bahçe & Peyzaj', elektrik: 'Elektrik & Tesisat', fotograf: 'Fotoğraf & Video',
  insaat: 'İnşaat & Dekorasyon', klima: 'Klima & Beyaz Eşya', diger: 'Diğer'
};

const formatCustomerName = (fullName: string) => {
  if (!fullName) return 'Müşteri';
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return parts[0];
  const lastPart = parts.pop();
  return `${parts.join(' ')} ${lastPart ? lastPart[0] + '.' : ''}`;
};

export default function ProviderReviews({ providerId }: ProviderReviewsProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});

  const fetchReviews = useCallback(async () => {
    if (!providerId) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/reviews/provider/${providerId}`);
      setReviews(res.data);
    } catch (error) {
      console.error('Yorumlar getirilirken hata oluştu:', error);
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const filteredReviews = filterRating 
    ? reviews.filter(r => r.rating === filterRating)
    : reviews;

  const toggleExpand = (id: string) => {
    setExpandedReviews(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, idx) => (
      <svg 
        key={idx} 
        className={`w-5 h-5 ${idx < rating ? 'text-amber-400' : 'text-gray-300'}`} 
        fill="currentColor" 
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* BAŞLIK VE FİLTRE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-black text-navy-900 tracking-tight">Müşteri Yorumları</h2>
          <p className="text-sm text-navy-400 font-medium mt-1">Hizmet alan müşterilerin değerlendirmeleri</p>
        </div>
      </div>

      <div className="flex justify-between items-end border-b border-navy-100 pb-4">
        <select 
          className="px-4 py-2.5 bg-white border border-navy-100 rounded-xl focus:outline-none focus:border-navy-500 font-bold text-sm text-navy-900 shadow-sm appearance-none cursor-pointer pr-10 relative"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%230B1C33\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 0.7rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em' }}
          value={filterRating === null ? '' : filterRating}
          onChange={(e) => setFilterRating(e.target.value === '' ? null : Number(e.target.value))}
        >
          <option value="">Filtreler (Tümü)</option>
          <option value="5">5 Yıldız</option>
          <option value="4">4 Yıldız</option>
          <option value="3">3 Yıldız</option>
          <option value="2">2 Yıldız</option>
          <option value="1">1 Yıldız</option>
        </select>
        <span className="text-sm font-bold text-navy-400">{filteredReviews.length} yorum</span>
      </div>

      {/* YORUMLAR LİSTESİ */}
      {loading ? (
        <div className="flex flex-col items-center py-20 gap-3">
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-3 h-3 bg-navy-800 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <p className="text-navy-400 font-bold">Yorumlar yükleniyor...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-navy-100 shadow-sm">
          <span className="text-6xl mb-4 block opacity-50">⭐</span>
          <h3 className="text-xl font-bold text-navy-600">Henüz değerlendirme yok</h3>
          <p className="text-navy-300 text-sm mt-2">Hizmet verdiğiniz müşteriler sizi değerlendirdiğinde burada görünecek.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => {
            const isExpanded = expandedReviews[review._id];
            const shouldTruncate = review.comment.length > 200;
            const displayComment = !isExpanded && shouldTruncate 
              ? review.comment.substring(0, 200) + '...' 
              : review.comment;
            
            const customerName = review.customer?.name ? formatCustomerName(review.customer.name) : 'Bilinmeyen Müşteri';
            const category = review.proposal?.serviceRequest?.category;
            const displayCategory = category ? (SERVICE_LABELS[category] || category) : 'Hizmet';
            const reviewDate = new Date(review.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });

            return (
              <div key={review._id} className="bg-white rounded-2xl border border-navy-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-navy-900">{customerName}</h3>
                    <span className="text-sm font-medium text-navy-300">{reviewDate}</span>
                  </div>
                </div>
                
                <div className="text-sm font-medium text-navy-400 mb-3">{displayCategory}</div>
                
                <div className="flex items-center gap-1 mb-4">
                  {renderStars(review.rating)}
                </div>

                <p className="text-navy-700 leading-relaxed text-[15px] font-medium whitespace-pre-line">
                  {displayComment}
                </p>

                {shouldTruncate && (
                  <button 
                    onClick={() => toggleExpand(review._id)}
                    className="mt-3 text-sm font-bold text-navy-900 hover:text-gold-500 transition-colors flex items-center gap-1 group"
                  >
                    <span className="border-b border-navy-900 group-hover:border-gold-500 transition-colors pb-0.5">
                      {isExpanded ? 'Daha az göster' : 'Daha fazla göster'}
                    </span>
                    <svg 
                      className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
