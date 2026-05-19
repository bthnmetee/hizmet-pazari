import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware';
import { createRequest, getActiveRequests } from '../controllers/requestController';

const router = express.Router();

// ✅ Talep oluşturma — giriş yapmış müşteri
router.post('/create', verifyToken, createRequest);

// ✅ Aktif talepleri çek — giriş yapmış provider
router.get('/active', verifyToken, getActiveRequests);

export default router;