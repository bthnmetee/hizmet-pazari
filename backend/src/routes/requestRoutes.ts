import express from 'express';
import { createRequest, getActiveRequests } from '../controllers/requestController';

const router = express.Router();

router.post('/create', createRequest);
router.get('/active', getActiveRequests);

export default router;