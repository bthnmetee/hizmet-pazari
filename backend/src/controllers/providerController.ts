import { Request, Response } from 'express';
import Provider from '../models/Provider';
import Review from '../models/Review';

// Hizmet Verenin Kendi Profilini Güncellemesi
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { about, portfolioImages } = req.body;
    
    const updatedProvider = await Provider.findByIdAndUpdate(
      id, 
      { about, portfolioImages }, 
      { new: true }
    );
    
    res.status(200).json(updatedProvider);
  } catch (error: any) {
    res.status(500).json({ message: 'Profil güncellenemedi.', error: error.message });
  }
};

// Müşterinin Hizmet Veren Profilini ve Yorumlarını İncelemesi
export const getProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const provider = await Provider.findById(id);
    if (!provider) return res.status(404).json({ message: 'Profesyonel bulunamadı.' });

    // Profesyonelin aldığı tüm yorumları müşteri isimleriyle birlikte çek
    const reviews = await Review.find({ provider: id })
      .populate('customer', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ provider, reviews });
  } catch (error: any) {
    res.status(500).json({ message: 'Profil bilgileri getirilemedi.', error: error.message });
  }
};