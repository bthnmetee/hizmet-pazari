import express from 'express';
import { getCreditPackages, purchaseCredits, getWalletBalance, getTransactionHistory } from '../controllers/walletController';

const router = express.Router();

// Kredi paketlerini listele
router.get('/packages', getCreditPackages);

// Kredi satın al
router.post('/purchase', purchaseCredits);

// Bakiye sorgula
router.get('/balance/:providerId', getWalletBalance);

// İşlem geçmişi
router.get('/transactions/:providerId', getTransactionHistory);

export default router;
