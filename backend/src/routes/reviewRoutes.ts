import express from 'express';
import { createReview } from '../controllers/reviewController';

const router = express.Router();

// POST /api/reviews/create
router.post('/create', createReview);

export default router;