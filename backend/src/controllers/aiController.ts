import { Request, Response } from 'express';

// 🤖 AI TEKLİF OLUŞTURUCU — Backend Proxy
// Nakliyat için akıllı fiyat hesaplama motoru + Anthropic API desteği

// ═══════════ NAKLİYAT FİYAT MOTORU ═══════════
// Taban fiyatlar (minimum mesafe ~50km)
// 1+1: 30.000 TL | 2+1: 40.000 TL | 3+1: 50.000 TL
// 700km referans fiyatlar:
// 1+1: 45.000 TL | 2+1: 55.000 TL | 3+1: 70.000 TL

interface PriceTier {
  base: number;     // Taban fiyat
  ref700: number;   // 700km referans fiyat
}

const NAKLIYAT_FIYATLARI: Record<string, PriceTier> = {
  '1+1': { base: 30000, ref700: 45000 },
  '2+1': { base: 40000, ref700: 55000 },
  '3+1': { base: 50000, ref700: 70000 },
  '4+1': { base: 65000, ref700: 90000 },
  '5+1': { base: 80000, ref700: 110000 },
};

// Mesafe tahmini (şehirler arası km)
const SEHIR_MESAFELERI: Record<string, Record<string, number>> = {
  'istanbul': { 'ankara': 450, 'izmir': 480, 'antalya': 700, 'bursa': 150, 'adana': 940, 'trabzon': 1070, 'konya': 660, 'mersin': 940, 'diyarbakır': 1400, 'gaziantep': 1130, 'samsun': 740, 'kayseri': 770, 'eskişehir': 330, 'denizli': 600, 'muğla': 650, 'sakarya': 140, 'kocaeli': 100, 'tekirdağ': 130, 'edirne': 230, 'çanakkale': 320 },
  'ankara': { 'istanbul': 450, 'izmir': 590, 'antalya': 540, 'bursa': 390, 'adana': 490, 'trabzon': 780, 'konya': 260, 'mersin': 490, 'diyarbakır': 940, 'gaziantep': 700, 'samsun': 420, 'kayseri': 320, 'eskişehir': 240, 'denizli': 480, 'muğla': 600 },
  'izmir': { 'istanbul': 480, 'ankara': 590, 'antalya': 440, 'bursa': 330, 'adana': 880, 'konya': 570, 'denizli': 240, 'muğla': 280, 'manisa': 40, 'aydın': 130 },
};

function tahminiMesafe(from: string, to: string): number {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-zçğıöşü]/gi, '').trim();
  const f = normalize(from);
  const t = normalize(to);

  // Direkt eşleşme
  if (SEHIR_MESAFELERI[f]?.[t]) return SEHIR_MESAFELERI[f][t];
  if (SEHIR_MESAFELERI[t]?.[f]) return SEHIR_MESAFELERI[t][f];

  // Kısmi eşleşme
  for (const city1 of Object.keys(SEHIR_MESAFELERI)) {
    if (f.includes(city1) || city1.includes(f)) {
      for (const [city2, km] of Object.entries(SEHIR_MESAFELERI[city1])) {
        if (t.includes(city2) || city2.includes(t)) return km;
      }
    }
  }

  // Aynı şehir içi
  if (f === t || f.includes(t) || t.includes(f)) return 30;

  // Bilinmeyen → orta mesafe varsay
  return 350;
}

function evBuyuklugu(description: string, details?: any): string {
  const text = `${description} ${details?.houseSize || ''}`.toLowerCase();
  if (text.includes('5+1') || text.includes('5 oda') || text.includes('villa')) return '5+1';
  if (text.includes('4+1') || text.includes('4 oda')) return '4+1';
  if (text.includes('3+1') || text.includes('3 oda')) return '3+1';
  if (text.includes('2+1') || text.includes('2 oda')) return '2+1';
  if (text.includes('1+1') || text.includes('1 oda') || text.includes('stüdyo')) return '1+1';
  return '2+1'; // varsayılan
}

function hesaplaFiyat(evTipi: string, mesafeKm: number): { min: number; max: number } {
  const tier = NAKLIYAT_FIYATLARI[evTipi] || NAKLIYAT_FIYATLARI['2+1'];

  // Lineer interpolasyon: taban + (mesafe/700) * (ref700 - taban)
  // Minimum mesafe 30km (şehir içi)
  const effectiveDistance = Math.max(30, mesafeKm);
  const distanceFactor = effectiveDistance / 700;

  const calculated = tier.base + distanceFactor * (tier.ref700 - tier.base);

  // Min-max aralığı: -%10 / +%15
  const min = Math.round(calculated * 0.90 / 1000) * 1000;
  const max = Math.round(calculated * 1.15 / 1000) * 1000;

  // Taban fiyatın altına düşmesin
  return {
    min: Math.max(min, tier.base),
    max: Math.max(max, tier.base + 5000)
  };
}

// ═══════════ DİĞER KATEGORİLER İÇİN GENEL FİYAT ═══════════
const KATEGORI_FIYATLARI: Record<string, { min: number; max: number }> = {
  temizlik: { min: 800, max: 3000 },
  tadilat: { min: 5000, max: 50000 },
  yazilim: { min: 3000, max: 30000 },
  ozelders: { min: 200, max: 800 },
  guzellik: { min: 300, max: 2000 },
  bahce: { min: 1000, max: 10000 },
  elektrik: { min: 500, max: 5000 },
  fotograf: { min: 1500, max: 10000 },
  insaat: { min: 10000, max: 100000 },
  klima: { min: 500, max: 5000 },
  diger: { min: 500, max: 5000 },
};

export const generateProposal = async (req: Request, res: Response) => {
  try {
    const { title, description, category, location, movingDate, providerServices, details } = req.body;

    // ═══ NAKLİYAT ÖZEL FİYAT HESAPLAMA ═══
    let priceMin: number;
    let priceMax: number;
    let evTipi = '';
    let mesafeKm = 0;

    if (category === 'nakliyat' || category?.toLowerCase().includes('nakliyat') || category?.toLowerCase().includes('taşıma')) {
      // Konum bilgisinden mesafe hesapla
      const locationParts = (location || '').split(/->|→|den|dan|'a|ye/i).map((s: string) => s.trim()).filter(Boolean);
      const from = locationParts[0] || '';
      const to = locationParts[1] || locationParts[0] || '';

      mesafeKm = tahminiMesafe(from, to);
      evTipi = evBuyuklugu(description, details);
      const fiyat = hesaplaFiyat(evTipi, mesafeKm);
      priceMin = fiyat.min;
      priceMax = fiyat.max;
    } else {
      const catPrices = KATEGORI_FIYATLARI[category] || KATEGORI_FIYATLARI.diger;
      priceMin = catPrices.min;
      priceMax = catPrices.max;
    }

    // ═══ MOCK TEKLİF MESAJI ═══
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey || apiKey === 'BURAYA_API_ANAHTARINIZI_YAPIŞTIRIN') {
      const isNakliyat = category === 'nakliyat' || category?.toLowerCase().includes('nakliyat');
      const avgPrice = Math.round((priceMin + priceMax) / 2 / 1000) * 1000;

      const nakliyatMsg = `Merhaba, ${title} talebiniz için profesyonel nakliyat hizmeti sunmak istiyorum. ${evTipi} eviniz için ${location} güzergahında (yaklaşık ${mesafeKm}km) deneyimli ekibimiz ve sigortalı taşıma araçlarımızla güvenli bir taşınma süreci sağlıyoruz. Eşyalarınız bizimle güvende olacak.`;

      const genelMsg = `Merhaba, ${title} talebiniz için profesyonel hizmet sunmak istiyorum. ${location} bölgesinde deneyimli ekibimizle kaliteli ve uygun fiyatlı çözümler sağlıyoruz. Size en uygun teklifi hazırladım.`;

      return res.json({
        message: isNakliyat ? nakliyatMsg : genelMsg,
        priceMin,
        priceMax,
        tips: isNakliyat ? [
          `${evTipi} ev için ${mesafeKm}km mesafe baz alınarak fiyatlandırıldı`,
          'Sigortalı taşımacılık yapıldığını belirtin, güven oluşturur',
          'Ambalajlama hizmeti dahil olduğunu vurgulayın',
          'Referans fotoğrafları ve önceki müşteri yorumlarını paylaşın'
        ] : [
          'Referanslarınızı ve iş fotoğraflarınızı paylaşın',
          'Hızlı yanıt verin, müşteriler genelde ilk cevap vereni tercih eder',
          'Detaylı fiyat dökümü sunarak güven oluşturun'
        ]
      });
    }

    // ═══ ANTHROPIC API ÇAĞRISI ═══
    const prompt = `Sen bir hizmet platformunda Türkçe konuşan profesyonel bir asistansın.
Aşağıdaki hizmet ilanı için profesyonel bir teklif mesajı ve fiyat önerisi oluştur.

İLAN BİLGİLERİ:
- Başlık: ${title}
- Kategori: ${category}
- Konum: ${location}
- Açıklama: ${description}
${movingDate ? `- Tarih: ${movingDate}` : ''}
${evTipi ? `- Ev Büyüklüğü: ${evTipi}` : ''}
${mesafeKm ? `- Tahmini Mesafe: ${mesafeKm}km` : ''}

ÖNERİLEN FİYAT ARALIĞI: ${priceMin.toLocaleString('tr-TR')} - ${priceMax.toLocaleString('tr-TR')} TL

Yanıtını SADECE şu JSON formatında ver:
{
  "message": "Müşteriye gönderilecek Türkçe teklif mesajı (2-3 cümle, samimi ve profesyonel)",
  "priceMin": ${priceMin},
  "priceMax": ${priceMax},
  "tips": ["Teklifi güçlendirecek 2-3 kısa ipucu"]
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API hatası: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    // API'den gelen fiyatları bizim hesapladıklarımızla override et (tutarlılık için)
    parsed.priceMin = priceMin;
    parsed.priceMax = priceMax;

    res.json(parsed);
  } catch (error: any) {
    console.error('❌ AI Teklif Hatası:', error.message);
    res.json({
      message: `Merhaba, talebiniz için profesyonel hizmet vermek istiyorum. Deneyimli ekibimizle kaliteli iş çıkarıyoruz.`,
      priceMin: 500,
      priceMax: 2000,
      tips: ['Hızlı yanıt sürenizi koruyun', 'Detaylı açıklama ile fark yaratın']
    });
  }
};
