import express from 'express';
import { updateProfile, getProfile } from '../controllers/providerController';

const router = express.Router();

// GET /api/providers/:id -> Profili ve Yorumları Getir
router.get('/:id', getProfile);

// PUT /api/providers/:id -> Profili Güncelle
router.put('/:id', updateProfile);

export default router;