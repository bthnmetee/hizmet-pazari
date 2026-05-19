import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware';
import { createReview, getProviderReviews } from '../controllers/reviewController';

const router = express.Router();

// ✅ Değerlendirme oluştur — giriş yapmış müşteri
router.post('/create', verifyToken, createReview);

// Değerlendirmeleri getir (herkese açık — vitrin bilgisi)
router.get('/provider/:providerId', getProviderReviews);

export default router;