import express from 'express';
import { generateProposal } from '../controllers/aiController';

const router = express.Router();

router.post('/generate-proposal', generateProposal);

export default router;
