import express, { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../middlewares/authMiddleware';
import {
  createProposal,
  replyToProposal,
  getCustomerProposals,
  getProviderProposals,
  updateProposalStatus
} from '../controllers/proposalController';
import { getUploadErrorResponse, uploadCloud } from '../utils/cloudinaryConfig';

const router = express.Router();

// ✅ Tüm teklif rotaları verifyToken ile korunuyor

router.post('/create', verifyToken, createProposal);

// ✅ Resim destekli mesaj
router.post('/:id/reply', verifyToken, (req: Request, res: Response, next: NextFunction) => {
  uploadCloud.single('image')(req, res, (err: any) => {
    if (err) {
      const uploadError = getUploadErrorResponse(err);
      return res.status(uploadError.statusCode).json({ message: uploadError.message });
    }
    replyToProposal(req, res);
  });
});

router.get('/customer/:customerId', verifyToken, getCustomerProposals);
router.get('/provider/:providerId', verifyToken, getProviderProposals);
router.patch('/:id/status', verifyToken, updateProposalStatus);

export default router;
