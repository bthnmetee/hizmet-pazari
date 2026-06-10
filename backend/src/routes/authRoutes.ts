import express, { Request, Response, NextFunction } from 'express';
import { login, registerCustomer, registerProvider, forgotPassword, resetPassword } from '../controllers/authController';
import { getUploadErrorResponse, uploadCloud } from '../utils/cloudinaryConfig';

const router = express.Router();

router.post('/login', login);
router.post('/register/customer', registerCustomer);

// Hizmet veren kaydı (dosya yüklemeli)
router.post('/register/provider', (req: Request, res: Response, next: NextFunction) => {
  uploadCloud.single('taxCertificate')(req, res, (err: any) => {
    if (err) {
      const uploadError = getUploadErrorResponse(err);
      console.error('Multer/Cloudinary Hatası:', err);
      return res.status(uploadError.statusCode).json({ message: uploadError.message });
    }
    registerProvider(req, res);
  });
});

// ✅ Şifre sıfırlama rotaları
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;
