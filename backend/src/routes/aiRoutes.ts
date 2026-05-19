import express from 'express';
import { verifyToken, verifyAdmin } from '../middlewares/authMiddleware';
import { generateProposal, estimatePrice, enhanceRequest, calculateMatchScore, chatbot, getInsights } from '../controllers/aiController';

const router = express.Router();

// ✅ Korumalı — giriş yapmış kullanıcılar
router.post('/generate-proposal', verifyToken, generateProposal);
router.post('/estimate-price', verifyToken, estimatePrice);
router.post('/enhance-request', verifyToken, enhanceRequest);
router.post('/match-score', verifyToken, calculateMatchScore);

// Chatbot — herkese açık (ana sayfa widget'ı)
router.post('/chatbot', chatbot);

// ✅ Admin içgörüleri — sadece admin
router.get('/insights', verifyToken, verifyAdmin, getInsights);

export default router;
