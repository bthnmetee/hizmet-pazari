import express, { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../middlewares/authMiddleware';
import { uploadProfileImage, changePassword } from '../controllers/profileController';
import { getUploadErrorResponse, uploadCloud } from '../utils/cloudinaryConfig';

const router = express.Router();

// ✅ Profil resmi yükleme — giriş yapmış kullanıcı
router.post('/upload-image', verifyToken, (req: Request, res: Response, next: NextFunction) => {
  uploadCloud.single('image')(req, res, (err: any) => {
    if (err) {
      const uploadError = getUploadErrorResponse(err);
      console.error('Multer/Cloudinary Hatası:', err);
      return res.status(uploadError.statusCode).json({ message: uploadError.message });
    }
    uploadProfileImage(req, res);
  });
});

// ✅ Şifre değiştirme
router.put('/change-password', verifyToken, changePassword);

export default router;
