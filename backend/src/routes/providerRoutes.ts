import express from 'express';
import { verifyToken, verifyProvider } from '../middlewares/authMiddleware';
import { getApprovedProviders, getProviderShowcase, updateServices, updateProfile } from '../controllers/providerController';

const router = express.Router();

// Herkese açık — vitrin bilgisi
router.get('/approved', getApprovedProviders);
router.get('/showcase', getProviderShowcase);

// ✅ Korumalı — giriş yapmış provider
router.put('/update-services', verifyToken, verifyProvider, updateServices);
router.put('/update-profile', verifyToken, verifyProvider, updateProfile);

export default router;