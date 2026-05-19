import express from 'express';
import { verifyToken, verifyProvider } from '../middlewares/authMiddleware';
import { getCreditPackages, purchaseCredits, getWalletBalance, getTransactionHistory } from '../controllers/walletController';

const router = express.Router();

// Kredi paketlerini listele (herkese açık — bilgilendirme)
router.get('/packages', getCreditPackages);

// ✅ Kredi satın al — sadece giriş yapmış provider
router.post('/purchase', verifyToken, verifyProvider, purchaseCredits);

// ✅ Bakiye sorgula — sadece giriş yapmış kullanıcı
router.get('/balance/:providerId', verifyToken, getWalletBalance);

// ✅ İşlem geçmişi — sadece giriş yapmış kullanıcı
router.get('/transactions/:providerId', verifyToken, getTransactionHistory);

export default router;
