import express from 'express';
import { createRequest } from '../controllers/requestController';
import { createRequest, getRequests } from '../controllers/requestController';

const router = express.Router();

// Yeni ilan oluşturma rotası (POST /api/requests/create)
router.post('/create', createRequest);
// Tüm ilanları getirme rotası (GET /api/requests)
router.get('/', getRequests);

export default router;