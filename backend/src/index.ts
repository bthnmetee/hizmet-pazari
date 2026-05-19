import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Rotaların İçe Aktarılması
import authRoutes from './routes/authRoutes';
import requestRoutes from './routes/requestRoutes';
import proposalRoutes from './routes/proposalRoutes';
import providerRoutes from './routes/providerRoutes';
import adminRoutes from './routes/adminRoutes';
import reviewRoutes from './routes/reviewRoutes';
import walletRoutes from './routes/walletRoutes';
import aiRoutes from './routes/aiRoutes';
import phoneRoutes from './routes/phoneRoutes';
import profileRoutes from './routes/profileRoutes';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// ✅ JWT_SECRET Zorunlu Kontrol — yoksa uygulama başlamaz
if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET ortam değişkeni tanımlanmamış!');
  console.error('   .env dosyasına JWT_SECRET=<güçlü-rastgele-bir-anahtar> ekleyin.');
  process.exit(1);
}

// ✅ Production'da MONGO_URI zorunlu kontrol
if (isProduction && !process.env.MONGO_URI) {
  console.error('❌ FATAL: MONGO_URI ortam değişkeni production modunda zorunludur!');
  process.exit(1);
}

const app = express();

// ═══════════ GÜVENLİK KATMANLARI ═══════════

// ✅ Trust Proxy — Reverse proxy (Nginx, Railway, Render vb.) arkasında doğru IP tespiti
app.set('trust proxy', 1);

// ✅ Helmet — HTTP güvenlik başlıkları (XSS, Clickjacking, MIME sniffing koruması)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Cloudinary resimleri için
  contentSecurityPolicy: isProduction ? undefined : false, // Dev'de CSP devre dışı
}));

const allowedOrigins = [
  'http://localhost:5173',
  'https://hizmet-pazari-projesi.vercel.app',
  process.env.CORS_ORIGIN,
].filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));

// ✅ Body Size Limiti — büyük payload'ları engelle
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ✅ Genel Rate Limiter — API isteklerini sınırla
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 200, // IP başına 15 dakikada max 200 istek
  message: { message: 'Çok fazla istek gönderdiniz. Lütfen 15 dakika sonra tekrar deneyin.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', generalLimiter);

// ✅ Login Rate Limiter — brute force koruması
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 10, // IP başına 15 dakikada max 10 login denemesi
  message: { message: 'Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);

// ✅ OTP Rate Limiter — SMS flooding koruması
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 saat
  max: 5, // IP başına 1 saatte max 5 SMS
  message: { message: 'Çok fazla SMS talebi. Lütfen 1 saat sonra tekrar deneyin.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/phone/send-otp', otpLimiter);

// ✅ Statik dosya sunumu (uploads klasörü)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ═══════════ ROTA BAĞLANTILARI ═══════════
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/phone', phoneRoutes);
app.use('/api/profile', profileRoutes);

// ═══════════ FRONTEND STATİK DOSYA SUNUMU (Tek Sunucu Deploy) ═══════════
// Eğer frontend ayrı bir platformda (Vercel/Netlify) deploy ediliyorsa bu blok devre dışı bırakılabilir
const frontendDistPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (isProduction) {
  app.use(express.static(frontendDistPath));
  // SPA fallback — Tanımsız rotaları index.html'e yönlendir
  app.get('*path', (req, res, next) => {
    // API rotalarını atla
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// ═══════════ GLOBAL HATA YÖNETİMİ ═══════════
// Yakalanmamış hataları ele al — iç detayları istemciye sızdırma
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!isProduction) {
    console.error('Global Hata:', err);
  } else {
    console.error('Global Hata:', err.message);
  }
  res.status(err.status || 500).json({
    message: isProduction
      ? 'Sunucu hatası oluştu.'
      : err.message || 'Sunucu hatası oluştu.'
  });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hizmet_pazari';

// MongoDB Bağlantısı ve Sunucuyu Başlatma
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Bağlantısı Başarılı');
    const server = app.listen(PORT, () => {
      console.log(`✅ Server ${PORT} portunda çalışıyor`);
      console.log(`   CORS Origins: ${allowedOrigins.join(', ')}`);
      console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    });

    // ═══════════ GRACEFUL SHUTDOWN ═══════════
    const gracefulShutdown = (signal: string) => {
      console.log(`\n⏳ ${signal} sinyali alındı. Sunucu kapatılıyor...`);
      server.close(() => {
        console.log('✅ HTTP sunucusu kapatıldı.');
        mongoose.connection.close().then(() => {
          console.log('✅ MongoDB bağlantısı kapatıldı.');
          process.exit(0);
        });
      });
      // 10 saniye içinde kapanmazsa zorla kapat
      setTimeout(() => {
        console.error('❌ Graceful shutdown zaman aşımı. Zorla kapatılıyor...');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  })
  .catch((error) => {
    console.error('❌ MongoDB Bağlantı Hatası:', error.message);
    process.exit(1);
  });
