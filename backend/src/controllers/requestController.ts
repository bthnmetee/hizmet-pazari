import { Request, Response } from 'express';
import ServiceRequest from '../models/ServiceRequest';
import Provider from '../models/Provider';

// Kategori label → slug eşleştirmesi (eski verilerle uyum için)
const normalizeCategory = (cat: string): string => {
  const map: Record<string, string> = {
    'Temizlik': 'temizlik',
    'Tadilat & Boya': 'tadilat',
    'Tadilat': 'tadilat',
    'Nakliyat': 'nakliyat',
    'Evden Eve Nakliyat': 'nakliyat',
    'Ofis Taşıma': 'nakliyat',
    'Parsiyel Eşya Taşıma': 'nakliyat',
    'Yazılım & Tasarım': 'yazilim',
    'Yazılım': 'yazilim',
    'Özel Ders': 'ozelders',
    'Güzellik & Bakım': 'guzellik',
    'Bahçe & Peyzaj': 'bahce',
    'Elektrik & Tesisat': 'elektrik',
    'Fotoğraf & Video': 'fotograf',
    'İnşaat & Dekorasyon': 'insaat',
    'Klima & Beyaz Eşya': 'klima',
  };
  return map[cat] ?? cat.toLowerCase();
};

// YENİ TALEP OLUŞTUR
export const createRequest = async (req: Request, res: Response) => {
  try {
    // ✅ category değerini normalize et
    const body = { ...req.body, category: normalizeCategory(req.body.category || ''), status: 'active' };
    const newRequest = new ServiceRequest(body);
    await newRequest.save();
    res.status(201).json({ message: 'Hizmet talebi başarıyla oluşturuldu.', request: newRequest });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// AKTİF TALEPLERİ ÇEK (filtrelemeli)
export const getActiveRequests = async (req: Request, res: Response) => {
  try {
    const { category, sortDate, location, providerId } = req.query;

    const query: any = { status: 'active' };

    // Provider'ın hizmet alanlarını normalize et
    let allowedCategories: string[] = [];
    if (providerId) {
      const provider = await Provider.findById(providerId);
      if (provider?.services && provider.services.length > 0) {
        allowedCategories = provider.services.map(normalizeCategory);
      }
    }

    if (category) {
      const normalCat = normalizeCategory(category as string);
      if (allowedCategories.length > 0) {
        if (allowedCategories.includes(normalCat)) {
          query.category = normalCat;
        } else {
          query.category = { $in: [] };
        }
      } else {
        query.category = normalCat;
      }
    } else if (allowedCategories.length > 0) {
      query.category = { $in: allowedCategories };
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    const sortCondition = sortDate === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
    const requests = await ServiceRequest.find(query).sort(sortCondition as any);
    res.status(200).json(requests);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};