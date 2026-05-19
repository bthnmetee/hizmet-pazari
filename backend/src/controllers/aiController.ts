import { Request, Response } from 'express';
import Customer from '../models/Customer';
import Provider from '../models/Provider';
import ServiceRequest from '../models/ServiceRequest';
import Proposal from '../models/Proposal';

// ═══════════ NAKLİYAT FİYAT MOTORU ═══════════

// ── Fiyat aralıkları: { min, max } TL ──
interface PriceRange { min: number; max: number; }

// Aynı yaka (Anadolu içi veya Avrupa içi)
const AYNI_YAKA_FIYAT: Record<string, PriceRange> = {
  '1+1': { min: 20000, max: 25000 },
  '2+1': { min: 25000, max: 30000 },
  '3+1': { min: 30000, max: 40000 },
};

// Karşı yaka (Anadolu ↔ Avrupa)
const KARSI_YAKA_FIYAT: Record<string, PriceRange> = {
  '1+1': { min: 25000, max: 30000 },
  '2+1': { min: 30000, max: 35000 },
  '3+1': { min: 35000, max: 45000 },
};

// Şehirlerarası mesafe bantları
interface DistanceBand { maxKm: number; prices: Record<string, PriceRange>; label: string; }

const SEHIRLERARASI_BANTLAR: DistanceBand[] = [
  {
    maxKm: 350, label: '0-350 km',
    prices: { '1+1': { min: 35000, max: 45000 }, '2+1': { min: 40000, max: 50000 }, '3+1': { min: 50000, max: 60000 } }
  },
  {
    maxKm: 800, label: '350-800 km',
    prices: { '1+1': { min: 40000, max: 50000 }, '2+1': { min: 50000, max: 60000 }, '3+1': { min: 60000, max: 70000 } }
  },
  {
    maxKm: 1200, label: '800-1200 km',
    prices: { '1+1': { min: 50000, max: 60000 }, '2+1': { min: 60000, max: 70000 }, '3+1': { min: 70000, max: 80000 } }
  },
  {
    maxKm: 1700, label: '1200-1700 km',
    prices: { '1+1': { min: 60000, max: 70000 }, '2+1': { min: 70000, max: 80000 }, '3+1': { min: 80000, max: 100000 } }
  },
];

// 4+1 ve 5+1 için 3+1 üzerine çarpan
function buyukEvCarpan(evTipi: string, baseRange: PriceRange): PriceRange {
  if (evTipi === '4+1') return { min: Math.round(baseRange.min * 1.30 / 1000) * 1000, max: Math.round(baseRange.max * 1.30 / 1000) * 1000 };
  if (evTipi === '5+1') return { min: Math.round(baseRange.min * 1.60 / 1000) * 1000, max: Math.round(baseRange.max * 1.60 / 1000) * 1000 };
  return baseRange;
}

function fiyatAraligiBul(evTipi: string, tablo: Record<string, PriceRange>): PriceRange {
  if (tablo[evTipi]) return tablo[evTipi];
  // 4+1 ve 5+1 → 3+1 tabanlı
  return buyukEvCarpan(evTipi, tablo['3+1']);
}

// İstanbul yakaları
const ANADOLU_YAKASI = ['kadıköy','üsküdar','ataşehir','maltepe','kartal','pendik','tuzla','beykoz','çekmeköy','sancaktepe','sultanbeyli','ümraniye','şile','adalar'];
const AVRUPA_YAKASI = ['beyoğlu','beşiktaş','şişli','sarıyer','kağıthane','eyüpsultan','fatih','bakırköy','bahçelievler','bağcılar','küçükçekmece','büyükçekmece','avcılar','esenyurt','beylikdüzü','başakşehir','arnavutköy','sultangazi','gaziosmanpaşa','esenler','güngören','bayrampaşa','zeytinburnu','silivri','çatalca'];

const SEHIR_MESAFELERI: Record<string, Record<string, number>> = {
  'istanbul': { 'ankara': 450, 'izmir': 480, 'antalya': 700, 'bursa': 150, 'adana': 940, 'trabzon': 1070, 'konya': 660, 'mersin': 940, 'diyarbakır': 1400, 'gaziantep': 1130, 'samsun': 740, 'kayseri': 770, 'eskişehir': 330, 'denizli': 600, 'muğla': 650, 'sakarya': 140, 'kocaeli': 100, 'tekirdağ': 130, 'edirne': 230, 'çanakkale': 320, 'hakkari': 1800, 'van': 1600, 'erzurum': 1230, 'kars': 1430, 'malatya': 1100, 'şanlıurfa': 1280 },
  'ankara': { 'istanbul': 450, 'izmir': 590, 'antalya': 540, 'bursa': 390, 'adana': 490, 'trabzon': 780, 'konya': 260, 'mersin': 490, 'diyarbakır': 940, 'gaziantep': 700, 'samsun': 420, 'kayseri': 320, 'eskişehir': 240, 'denizli': 480, 'muğla': 600, 'hakkari': 1250, 'van': 1150, 'erzurum': 880 },
  'izmir': { 'istanbul': 480, 'ankara': 590, 'antalya': 440, 'bursa': 330, 'adana': 880, 'konya': 570, 'denizli': 240, 'muğla': 280, 'manisa': 40, 'aydın': 130, 'diyarbakır': 1440, 'hakkari': 1850, 'van': 1750, 'erzurum': 1450 },
};

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-zçğıöşü\s]/gi, '').trim();
}

function istanbulYakaKontrol(from: string, to: string): 'ayni_yaka' | 'karsi_yaka' | 'degil' {
  const f = normalize(from); const t = normalize(to);
  const fAnadolu = ANADOLU_YAKASI.some(ilce => f.includes(ilce));
  const fAvrupa = AVRUPA_YAKASI.some(ilce => f.includes(ilce));
  const tAnadolu = ANADOLU_YAKASI.some(ilce => t.includes(ilce));
  const tAvrupa = AVRUPA_YAKASI.some(ilce => t.includes(ilce));
  const fIstanbul = f.includes('istanbul') || fAnadolu || fAvrupa;
  const tIstanbul = t.includes('istanbul') || tAnadolu || tAvrupa;
  if (!fIstanbul || !tIstanbul) return 'degil';
  if ((fAnadolu && tAnadolu) || (fAvrupa && tAvrupa)) return 'ayni_yaka';
  return 'karsi_yaka';
}

function tahminiMesafe(from: string, to: string): number {
  const f = normalize(from); const t = normalize(to);
  if (SEHIR_MESAFELERI[f]?.[t]) return SEHIR_MESAFELERI[f][t];
  if (SEHIR_MESAFELERI[t]?.[f]) return SEHIR_MESAFELERI[t][f];
  for (const city1 of Object.keys(SEHIR_MESAFELERI)) {
    if (f.includes(city1) || city1.includes(f)) {
      for (const [city2, km] of Object.entries(SEHIR_MESAFELERI[city1])) {
        if (t.includes(city2) || city2.includes(t)) return km;
      }
    }
  }
  if (f === t || f.includes(t) || t.includes(f)) return 30;
  return 350;
}

function evBuyuklugu(description: string, details?: any): string {
  const text = `${description} ${details?.houseSize || ''} ${details?.roomCount || ''}`.toLowerCase();
  if (text.includes('5+1') || text.includes('villa')) return '5+1';
  if (text.includes('4+1')) return '4+1';
  if (text.includes('3+1')) return '3+1';
  if (text.includes('2+1')) return '2+1';
  if (text.includes('1+1') || text.includes('stüdyo')) return '1+1';
  return '2+1';
}

function movingServiceType(category: string, details?: any): string {
  return details?.movingServiceType || category || 'nakliyat';
}

function roundTo500(value: number): number {
  return Math.round(value / 500) * 500;
}

function roomMultiplier(evTipi: string): number {
  const map: Record<string, number> = {
    '1+1': 1,
    '2+1': 1.2,
    '3+1': 1.45,
    '4+1': 1.8,
    '5+1': 2.2,
  };
  return map[evTipi] || 1.2;
}

function hesaplaFiyat(evTipi: string, mesafeKm: number, yakaInfo: string): { min: number; max: number; info: string } {
  // ── Aynı yaka (Anadolu içi veya Avrupa içi) ──
  if (yakaInfo === 'ayni_yaka') {
    const range = fiyatAraligiBul(evTipi, AYNI_YAKA_FIYAT);
    return { min: range.min, max: range.max, info: 'İstanbul aynı yaka (şehiriçi)' };
  }

  // ── Karşı yaka (Anadolu ↔ Avrupa) ──
  if (yakaInfo === 'karsi_yaka') {
    const range = fiyatAraligiBul(evTipi, KARSI_YAKA_FIYAT);
    return { min: range.min, max: range.max, info: 'İstanbul karşı yaka (Anadolu ↔ Avrupa)' };
  }

  // ── Şehirlerarası: mesafe bandına göre fiyat ──
  const effectiveDistance = Math.max(1, mesafeKm);
  for (const band of SEHIRLERARASI_BANTLAR) {
    if (effectiveDistance <= band.maxKm) {
      const range = fiyatAraligiBul(evTipi, band.prices);
      return { min: range.min, max: range.max, info: `Şehirlerarası ${band.label} (~${mesafeKm}km)` };
    }
  }

  // 1700 km üzeri → son bant + mesafe farkı çarpanı
  const lastBand = SEHIRLERARASI_BANTLAR[SEHIRLERARASI_BANTLAR.length - 1];
  const range = fiyatAraligiBul(evTipi, lastBand.prices);
  const extraFactor = 1 + (effectiveDistance - lastBand.maxKm) / 2000;
  return {
    min: Math.round(range.min * extraFactor / 1000) * 1000,
    max: Math.round(range.max * extraFactor / 1000) * 1000,
    info: `Şehirlerarası uzun mesafe (~${mesafeKm}km)`
  };
}

function hesaplaNakliyatFiyati(serviceType: string, evTipi: string, mesafeKm: number, yakaInfo: string, details?: any): { min: number; max: number; info: string } {
  if (serviceType === 'parca-esya-tasima') {
    const itemCount = Math.max(Number(details?.itemCount || 1), 1);
    const min = mesafeKm <= 40 ? roundTo500(2000 + itemCount * 250) : roundTo500(3000 + itemCount * 200 + mesafeKm * 10);
    const max = mesafeKm <= 40 ? 6000 : roundTo500(min * 1.5);
    return { min, max, info: mesafeKm <= 40 ? 'Parça eşya taşıma (şehiriçi)' : `Parça eşya taşıma (~${mesafeKm}km)` };
  }

  if (serviceType === 'esya-depolama') {
    const multiplier = roomMultiplier(evTipi);
    const min = roundTo500(2500 * multiplier);
    const max = roundTo500(4500 * multiplier);
    return { min, max, info: 'Aylık eşya depolama tahmini' };
  }

  if (serviceType === 'ofis-tasima') {
    const base = yakaInfo === 'degil' ? 16000 + mesafeKm * 18 : yakaInfo === 'karsi_yaka' ? 18000 : 14000;
    const min = roundTo500(base);
    const max = roundTo500(base * 1.35);
    return { min, max, info: yakaInfo === 'degil' ? `Ofis taşıma (~${mesafeKm}km)` : 'Ofis taşıma (şehiriçi)' };
  }

  const base = hesaplaFiyat(evTipi, mesafeKm, yakaInfo);
  let multiplier = 1;
  const totalFloor = Number(details?.fromFloor || 0) + Number(details?.toFloor || 0);
  if (totalFloor >= 6) multiplier += 0.08;
  else if (totalFloor >= 3) multiplier += 0.04;
  if (details?.elevator === 'yok') multiplier += 0.1;
  if (details?.elevator === 'var') multiplier -= 0.03;
  if (details?.packaging === 'dahil') multiplier += 0.12;
  if (details?.heavyItem === 'yes') multiplier += 0.15;

  return {
    min: roundTo500(base.min * multiplier),
    max: roundTo500(base.max * multiplier),
    info: base.info,
  };
}

function estimateConfidence(category: string, description: string, details: any, fromIl?: string, toIl?: string): number {
  let score = 55;
  if (category) score += 10;
  if ((description || '').trim().length >= 20) score += 10;
  if ((description || '').match(/\d\+1|villa|ofis|parça|asansör|ambalaj|koli/i)) score += 10;
  if (details?.movingDate) score += 5;
  if (details?.roomCount || details?.itemCount) score += 5;
  if (details?.elevator !== 'unknown' || details?.packaging !== 'unknown') score += 5;
  if (details?.fromFloor || details?.toFloor || details?.heavyItem === 'yes') score += 5;
  if (fromIl) score += 5;
  if (category?.includes('nakliyat') && toIl) score += 5;
  return Math.min(score, 95);
}

function estimateSampleSize(category: string, confidence: number): number {
  const base = category?.includes('nakliyat') ? 96 : 72;
  return base + Math.max(confidence - 60, 0);
}

const KATEGORI_FIYATLARI: Record<string, { min: number; max: number }> = {
  temizlik: { min: 800, max: 3000 }, tadilat: { min: 5000, max: 50000 },
  yazilim: { min: 3000, max: 30000 }, ozelders: { min: 200, max: 800 },
  guzellik: { min: 300, max: 2000 }, bahce: { min: 1000, max: 10000 },
  elektrik: { min: 500, max: 5000 }, fotograf: { min: 1500, max: 10000 },
  insaat: { min: 10000, max: 100000 }, klima: { min: 500, max: 5000 },
  diger: { min: 500, max: 5000 },
};

async function callAI(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.length < 20) return '';
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] })
    });
    if (!response.ok) return '';
    const data: any = await response.json();
    return data.content?.[0]?.text || '';
  } catch { return ''; }
}

// ═══════════ 1. MEVCUT: TEKLİF OLUŞTURUCU ═══════════
export const generateProposal = async (req: Request, res: Response) => {
  try {
    const { title, description, category, location, movingDate, providerServices, details, fromIl, toIl } = req.body;
    let priceMin: number; let priceMax: number; let evTipi = ''; let mesafeKm = 0; let info = '';

    if (category === 'nakliyat' || category?.toLowerCase().includes('nakliyat')) {
      const parts = (location || '').split(/->|→|den|dan|'a|ye/i).map((s: string) => s.trim()).filter(Boolean);
      const from = fromIl || parts[0] || ''; const to = toIl || parts[1] || parts[0] || '';
      const yakaInfo = istanbulYakaKontrol(from, to);
      mesafeKm = yakaInfo !== 'degil' ? (yakaInfo === 'ayni_yaka' ? 15 : 35) : tahminiMesafe(from, to);
      evTipi = evBuyuklugu(description, details);
      const fiyat = hesaplaNakliyatFiyati(movingServiceType(category, details), evTipi, mesafeKm, yakaInfo, details);
      priceMin = fiyat.min; priceMax = fiyat.max; info = fiyat.info;
    } else {
      const catP = KATEGORI_FIYATLARI[category] || KATEGORI_FIYATLARI.diger;
      priceMin = catP.min; priceMax = catP.max;
    }

    const aiText = await callAI(`Sen Türkçe profesyonel hizmet asistanısın. Şu ilan için 2-3 cümlelik teklif mesajı ve 3 ipucu yaz. JSON döndür: {"message":"...","tips":["..."]}\nBaşlık: ${title}\nKategori: ${category}\nKonum: ${location}\nAçıklama: ${description}\nFiyat: ${priceMin}-${priceMax} TL${evTipi ? `\nEv: ${evTipi}` : ''}${info ? `\nBilgi: ${info}` : ''}`);

    let parsed: any = null;
    if (aiText) { try { parsed = JSON.parse(aiText.replace(/```json|```/g, '').trim()); } catch {} }

    res.json({
      message: parsed?.message || `Merhaba, ${title} talebiniz için profesyonel hizmet sunmak istiyorum. ${info || location} bölgesinde deneyimli ekibimizle kaliteli çözümler sağlıyoruz.`,
      priceMin, priceMax,
      tips: parsed?.tips || ['Referanslarınızı paylaşın', 'Hızlı yanıt verin', 'Detaylı fiyat dökümü sunun']
    });
  } catch (error: any) {
    console.error('❌ AI Teklif Hatası:', error.message);
    res.json({ message: 'Merhaba, talebiniz için profesyonel hizmet vermek istiyorum.', priceMin: 500, priceMax: 2000, tips: ['Hızlı yanıt verin'] });
  }
};

// ═══════════ 2. FİYAT TAHMİNCİSİ ═══════════
export const estimatePrice = async (req: Request, res: Response) => {
  try {
    const { category, location, description, title, details, fromIl, toIl } = req.body;
    let priceMin: number; let priceMax: number; let info = ''; let evTipi = ''; let outMesafeKm = 0;

    if (category === 'nakliyat' || category?.toLowerCase().includes('nakliyat')) {
      const parts = (location || '').split(/->|→|-|den|dan/i).map((s: string) => s.trim()).filter(Boolean);
      const from = fromIl || parts[0] || ''; const to = toIl || parts[1] || parts[0] || '';
      const yakaInfo = istanbulYakaKontrol(from, to);
      const mesafeKm = yakaInfo !== 'degil' ? (yakaInfo === 'ayni_yaka' ? 15 : 35) : tahminiMesafe(from, to);
      outMesafeKm = mesafeKm;
      evTipi = evBuyuklugu(`${title || ''} ${description || ''}`, details);
      const fiyat = hesaplaNakliyatFiyati(movingServiceType(category, details), evTipi, mesafeKm, yakaInfo, details);
      priceMin = fiyat.min; priceMax = fiyat.max; info = fiyat.info;
    } else {
      const catP = KATEGORI_FIYATLARI[category] || KATEGORI_FIYATLARI.diger;
      priceMin = catP.min; priceMax = catP.max;
      info = `${category} kategorisi piyasa ortalaması`;
    }

    const avgPrice = Math.round((priceMin + priceMax) / 2);
    const confidence = estimateConfidence(category, `${title || ''} ${description || ''}`, details, fromIl, toIl);
    const analyzedOffers = estimateSampleSize(category, confidence);
    res.json({ priceMin, priceMax, avgPrice, info, evTipi, mesafeKm: outMesafeKm || undefined, confidence, analyzedOffers });
  } catch (error: any) {
    res.status(500).json({ message: 'Fiyat tahmini yapılamadı.' });
  }
};

// ═══════════ 3. TALEP GÜÇLENDİRİCİ ═══════════
export const enhanceRequest = async (req: Request, res: Response) => {
  try {
    const { category, title, description, location } = req.body;
    const isNakliyatCategory = category === 'nakliyat' || category?.toLowerCase().includes('nakliyat');

    const categoryQuestions: Record<string, string[]> = {
      temizlik: ['Ev kaç m²?', 'Kaç oda?', 'Evcil hayvan var mı?', 'Temizlik malzemeleri siz mi sağlayacaksınız?'],
      nakliyat: ['Ev kaç oda (1+1, 2+1, 3+1)?', 'Asansör var mı?', 'Ağır eşya (piyano, kasa) var mı?', 'Ambalajlama isteniyor mu?'],
      tadilat: ['Hangi odalar?', 'Malzeme dahil mi?', 'Tahmini m² alanı?', 'İskelye gerekli mi?'],
      yazilim: ['Proje detayları?', 'Teslim süresi?', 'Referans site var mı?', 'Bakım sözleşmesi isteniyor mu?'],
      elektrik: ['Arıza mı, yeni tesisat mı?', 'Kaç nokta?', 'Bina yaşı?'],
      default: ['Detaylı açıklama', 'Bütçe aralığı', 'Zaman beklentisi']
    };

    const questions = isNakliyatCategory ? categoryQuestions.nakliyat : (categoryQuestions[category] || categoryQuestions.default);

    const aiText = await callAI(`Sen bir hizmet platformu asistanısın. Müşteri şu talebi yazmış:\nBaşlık: ${title}\nKategori: ${category}\nKonum: ${location}\nAçıklama: ${description}\n\nBu açıklamayı profesyonellerin daha iyi anlayacağı şekilde zenginleştir. Eksik bilgileri akıllıca tahmin et ve ekle. SADECE JSON döndür:\n{"enhanced":"geliştirilmiş açıklama metni","addedDetails":["eklenen detay 1","eklenen detay 2"]}`);

    let enhanced = ''; let addedDetails: string[] = [];
    if (aiText) {
      try {
        const parsed = JSON.parse(aiText.replace(/```json|```/g, '').trim());
        enhanced = parsed.enhanced || '';
        addedDetails = parsed.addedDetails || [];
      } catch {}
    }

    if (!enhanced) {
      enhanced = `${description}\n\n📍 Konum: ${location}\n📋 Kategori: ${category}`;
      addedDetails = ['Konum bilgisi eklendi', 'Kategori detaylandırıldı'];
    }

    res.json({ original: description, enhanced, addedDetails, suggestedQuestions: questions.slice(0, 4) });
  } catch (error: any) {
    res.status(500).json({ message: 'Talep zenginleştirilemedi.' });
  }
};

// ═══════════ 4. UYUMLULUK SKORU ═══════════
export const calculateMatchScore = async (req: Request, res: Response) => {
  try {
    const { providerId, serviceRequestId, proposalPrice } = req.body;

    const provider = await Provider.findById(providerId);
    const serviceRequest = await ServiceRequest.findById(serviceRequestId);

    if (!provider || !serviceRequest) {
      return res.status(404).json({ message: 'Veri bulunamadı.' });
    }

    // Kategori uyumu (0-100)
    const categoryMatch = (provider.services || []).includes(serviceRequest.category) ? 100 : (provider.serviceCategory === serviceRequest.category ? 80 : 30);

    // Deneyim skoru
    const expScore = Math.min((provider.completedJobs || 0) * 5, 100);

    // Puan skoru
    const ratingScore = ((provider.averageRating || 0) / 5) * 100;

    // Yanıt süresi skoru
    const responseScore = Math.max(0, 100 - (provider.avgResponseMinutes || 60));

    // Fiyat uyumu (basit)
    const priceScore = 70; // default

    // Ağırlıklı toplam
    const totalScore = Math.round(
      categoryMatch * 0.15 + expScore * 0.20 + ratingScore * 0.25 + responseScore * 0.15 + priceScore * 0.25
    );

    const label = totalScore >= 80 ? 'Mükemmel Eşleşme' : totalScore >= 60 ? 'İyi Eşleşme' : 'Yeni Profesyonel';

    res.json({
      score: Math.min(totalScore, 100), label,
      breakdown: {
        kategoriUyumu: categoryMatch, deneyim: expScore,
        musteriPuani: ratingScore, yanitSuresi: responseScore, fiyatUyumu: priceScore
      }
    });
  } catch (error: any) {
    res.json({ score: 65, label: 'İyi Eşleşme', breakdown: { kategoriUyumu: 70, deneyim: 50, musteriPuani: 70, yanitSuresi: 60, fiyatUyumu: 70 } });
  }
};

// ═══════════ 5. CHATBOT ═══════════
export const chatbot = async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;

    const systemInfo = `Hizmet Pazarı Türkiye'nin güvenilir hizmet platformudur. Temizlik, tadilat, nakliyat, yazılım, özel ders gibi 12 kategoride hizmet sunar. Müşteriler ücretsiz kayıt olup talep oluşturur, profesyoneller teklif gönderir. Profesyoneller kredi sistemiyle çalışır. Tüm hizmet verenler vergi levhası ile doğrulanır. Kayıt: /register, Giriş: /login, Kategoriler: /kategoriler`;

    const historyText = (history || []).slice(-6).map((m: any) => `${m.role}: ${m.content}`).join('\n');

    const aiText = await callAI(`Sen "Hizmet Pazarı" platformunun Türkçe AI asistanısın. Kısa ve yardımsever yanıtlar ver. Yönlendirme gerekirse link öner.\n\nPlatform bilgisi: ${systemInfo}\n\n${historyText ? 'Önceki konuşma:\n' + historyText + '\n\n' : ''}Kullanıcı: ${message}\n\nSADECE JSON döndür: {"reply":"yanıt metni","suggestedLinks":[{"label":"buton metni","url":"/sayfa"}]}`);

    let reply = ''; let suggestedLinks: any[] = [];
    if (aiText) {
      try {
        const parsed = JSON.parse(aiText.replace(/```json|```/g, '').trim());
        reply = parsed.reply || '';
        suggestedLinks = parsed.suggestedLinks || [];
      } catch {}
    }

    if (!reply) {
      const q = message.toLowerCase();
      if (q.includes('nasıl') && q.includes('çalış')) {
        reply = 'Hizmet Pazarı 3 adımda çalışır: 1️⃣ Talebinizi oluşturun 2️⃣ Profesyonellerden teklif alın 3️⃣ En uygununu seçin. Tamamen ücretsiz!';
        suggestedLinks = [{ label: 'Hemen Kayıt Ol', url: '/register' }];
      } else if (q.includes('güven') || q.includes('güvenli')) {
        reply = 'Tüm profesyoneller vergi levhası ve kimlik doğrulamasından geçer. Müşteri yorumları ve puanlama sistemiyle şeffaflık sağlanır. 🛡️';
        suggestedLinks = [{ label: 'Profesyonelleri Gör', url: '/profesyoneller' }];
      } else if (q.includes('fiyat') || q.includes('ücret') || q.includes('kaç')) {
        reply = 'Hizmet almak tamamen ücretsizdir! Profesyoneller size teklif gönderir, siz karşılaştırıp en uygununu seçersiniz. 💰';
        suggestedLinks = [{ label: 'Kategorileri İncele', url: '/kategoriler' }];
      } else if (q.includes('kayıt') || q.includes('üye')) {
        reply = 'Kayıt olmak çok kolay! Hizmet almak veya vermek istediğinizi seçin, bilgilerinizi girin, telefon doğrulaması yapın. 📱';
        suggestedLinks = [{ label: 'Kayıt Ol', url: '/register' }, { label: 'Giriş Yap', url: '/login' }];
      } else {
        reply = 'Merhaba! Hizmet Pazarı hakkında size nasıl yardımcı olabilirim? Kayıt, fiyatlar, güvenlik veya nasıl çalıştığımız hakkında sorabilirsiniz. 😊';
        suggestedLinks = [{ label: 'Kayıt Ol', url: '/register' }, { label: 'Kategoriler', url: '/kategoriler' }];
      }
    }

    res.json({ reply, suggestedLinks });
  } catch (error: any) {
    res.json({ reply: 'Şu an yanıt veremiyorum, lütfen tekrar deneyin.', suggestedLinks: [] });
  }
};

// ═══════════ 6. ADMİN İÇGÖRÜLERİ ═══════════
export const getInsights = async (req: Request, res: Response) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const totalProviders = await Provider.countDocuments({ isApproved: true });
    const pendingProviders = await Provider.countDocuments({ isApproved: false });
    const totalRequests = await ServiceRequest.countDocuments();
    const totalProposals = await Proposal.countDocuments();

    const statsText = `Müşteri: ${totalCustomers}, Onaylı Profesyonel: ${totalProviders}, Bekleyen Başvuru: ${pendingProviders}, Talep: ${totalRequests}, Teklif: ${totalProposals}`;

    const aiText = await callAI(`Sen bir iş analisti AI'sın. Hizmet pazaryeri platformu için şu verileri analiz et ve 4 adet kısa, aksiyon odaklı içgörü üret. Türkçe yaz.\n\nVeriler: ${statsText}\n\nSADECE JSON döndür: {"insights":[{"icon":"emoji","title":"başlık","description":"açıklama","priority":"high|medium|low"}]}`);

    let insights: any[] = [];
    if (aiText) {
      try {
        const parsed = JSON.parse(aiText.replace(/```json|```/g, '').trim());
        insights = parsed.insights || [];
      } catch {}
    }

    if (insights.length === 0) {
      insights = [
        { icon: '📈', title: 'Büyüme Trendi', description: `Platformda ${totalCustomers} müşteri ve ${totalProviders} profesyonel bulunuyor. Müşteri/profesyonel oranını dengede tutun.`, priority: 'medium' },
        { icon: '🔔', title: 'Bekleyen Başvurular', description: `${pendingProviders} profesyonel başvurusu onay bekliyor. Hızlı onay, platform güvenini artırır.`, priority: pendingProviders > 5 ? 'high' : 'low' },
        { icon: '💡', title: 'Teklif Oranı', description: totalRequests > 0 ? `Her talep başına ortalama ${(totalProposals / totalRequests).toFixed(1)} teklif düşüyor.` : 'Henüz yeterli veri yok.', priority: 'medium' },
        { icon: '🚀', title: 'Aksiyon Önerisi', description: totalProviders < 10 ? 'Daha fazla profesyonel çekmek için referans kampanyası düzenleyin.' : 'Mevcut profesyonellerin aktifliğini artırmak için bildirim sistemi kurun.', priority: 'high' }
      ];
    }

    res.json({ insights, stats: { totalCustomers, totalProviders, pendingProviders, totalRequests, totalProposals } });
  } catch (error: any) {
    res.json({ insights: [{ icon: '⚠️', title: 'Veri Yüklenemedi', description: 'İçgörüler şu an hesaplanamıyor.', priority: 'low' }], stats: {} });
  }
};
