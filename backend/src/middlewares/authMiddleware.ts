import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// JWT_SECRET zorunlu kontrol — uygulama başlangıcında doğrulanır
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL: JWT_SECRET ortam değişkeni tanımlanmamış! Uygulama güvenli çalışamaz.');
  }
  return secret;
};

// Request tipini genişlet — decoded user bilgisi taşıması için
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

/**
 * JWT Token Doğrulama Middleware'i
 * Gelen istekteki Authorization header'ını kontrol eder.
 * Geçerli token bulunursa req.user'a decoded bilgileri yazar.
 */
export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Yetkilendirme token\'ı bulunamadı. Lütfen giriş yapın.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, getJwtSecret()) as { id: string; role: string };

    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Oturum süreniz doldu. Lütfen tekrar giriş yapın.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Geçersiz yetkilendirme token\'ı.' });
    }
    return res.status(500).json({ message: 'Yetkilendirme hatası oluştu.' });
  }
};

/**
 * Admin Yetki Kontrolü Middleware'i
 * verifyToken'dan sonra kullanılır.
 * Kullanıcının admin rolüne sahip olduğunu doğrular.
 */
export const verifyAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Yetkilendirme gerekli.' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bu işlem için admin yetkisi gereklidir.' });
  }

  next();
};

/**
 * Provider Yetki Kontrolü Middleware'i
 * verifyToken'dan sonra kullanılır.
 * Kullanıcının provider rolüne sahip olduğunu doğrular.
 */
export const verifyProvider = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Yetkilendirme gerekli.' });
  }

  if (req.user.role !== 'provider' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bu işlem için hizmet veren yetkisi gereklidir.' });
  }

  next();
};

/**
 * Sahiplik Kontrolü - Kullanıcının kendi kaynağına eriştiğini doğrular
 * req.params veya req.body'deki userId/providerId/customerId ile token'daki id'yi karşılaştırır
 */
export const verifyOwnership = (paramField: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Yetkilendirme gerekli.' });
    }

    // Admin her şeye erişebilir
    if (req.user.role === 'admin') {
      return next();
    }

    const resourceId = req.params[paramField] || req.body[paramField];
    if (resourceId && resourceId !== req.user.id) {
      return res.status(403).json({ message: 'Bu kaynağa erişim yetkiniz yok.' });
    }

    next();
  };
};
