import express from 'express';
import { 
  registerCustomer, 
  registerProvider, 
  login, 
  forgotPassword,
  resetPassword // Yeni şifre belirleme fonksiyonumuzu da çağırdık
} from '../controllers/authController';

const router = express.Router();

// 1. Müşteri Kayıt
router.post('/register/customer', registerCustomer);

// 2. Hizmet Veren Kayıt
router.post('/register/provider', registerProvider);

// 3. Ortak Giriş (Login)
router.post('/login', login);

// 4. Şifremi Unuttum (Mail Gönderme)
router.post('/forgot-password', forgotPassword);

// 5. Şifreyi Sıfırla (Yeni şifreyi kaydetme)
router.post('/reset-password/:token', resetPassword);

export default router;