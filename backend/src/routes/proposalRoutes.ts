import express, { Request, Response, NextFunction } from 'express';
import {
  createProposal,
  replyToProposal,
  getCustomerProposals,
  getProviderProposals,
  updateProposalStatus
} from '../controllers/proposalController';
import { uploadCloud } from '../utils/cloudinaryConfig';

const router = express.Router();

router.post('/create', createProposal);

// ✅ Resim destekli mesaj
router.post('/:id/reply', (req: Request, res: Response, next: NextFunction) => {
  uploadCloud.single('image')(req, res, (err: any) => {
    if (err) return res.status(500).json({ message: 'Dosya yükleme hatası: ' + err.message });
    replyToProposal(req, res);
  });
});

router.get('/customer/:customerId', getCustomerProposals);
router.get('/provider/:providerId', getProviderProposals);
router.patch('/:id/status', updateProposalStatus);

export default router;