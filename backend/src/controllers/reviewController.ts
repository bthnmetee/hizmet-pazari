import { Request, Response } from 'express';
import Review from '../models/Review';
import Provider from '../models/Provider';
import Proposal from '../models/Proposal';
import { validateContent } from '../utils/contentModeration';

export const createReview = async (req: Request, res: Response) => {
  try {
    const { proposalId, customerId, providerId, rating, comment } = req.body;

    // ✅ İçerik moderasyonu — yorum kontrolü
    if (comment) {
      const commentCheck = validateContent(comment);
      if (!commentCheck.isValid) {
        return res.status(400).json({
          message: 'İçerik politikası ihlali tespit edildi.',
          errors: commentCheck.errors,
        });
      }
    }

    // 1. Yorumu veritabanına kaydet
    const newReview = new Review({
      proposal: proposalId,
      customer: customerId,
      provider: providerId,
      rating,
      comment
    });
    await newReview.save();

    // 2. İş bittiği için teklifin durumunu 'completed' (tamamlandı) yap
    // (Böylece müşteri aynı işe defalarca yorum yapamaz)
    await Proposal.findByIdAndUpdate(proposalId, { status: 'completed' });

    // 3. Hizmet verenin tüm yorumlarını bul ve YENİ ORTALAMAYI hesapla
    const allReviews = await Review.find({ provider: providerId });
    const totalRating = allReviews.reduce((sum, rev) => sum + rev.rating, 0);
    const newAverage = totalRating / allReviews.length;

    // 4. Hizmet Verenin profilindeki Puanı ve Yorum Sayısını güncelle
    await Provider.findByIdAndUpdate(providerId, {
      averageRating: newAverage,
      reviewCount: allReviews.length
    });

    res.status(201).json({ message: 'Değerlendirmeniz başarıyla kaydedildi! Profesyonelin puanı güncellendi.' });
  } catch (error: any) {
    res.status(500).json({ message: 'Değerlendirme yapılırken hata oluştu.', error: error.message });
  }
};

export const getProviderReviews = async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;
    const reviews = await Review.find({ provider: providerId })
      .populate('customer', 'name profileImage')
      .populate({
        path: 'proposal',
        populate: {
          path: 'serviceRequest',
          select: 'category title'
        }
      })
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error: any) {
    res.status(500).json({ message: 'Değerlendirmeler getirilirken hata oluştu.', error: error.message });
  }
};