import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';// Dosya yollarını ayarlamak için gerekli
import requestRoutes from './routes/requestRoutes'; 
import proposalRoutes from './routes/proposalRoutes'; // Yukarıya importlara ekle
import reviewRoutes from './routes/reviewRoutes';

// ... diğer rotaların altına ekle:


// Rotaları içeri aktarıyoruz
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import providerRoutes from './routes/providerRoutes';

// .env dosyasındaki değişkenleri okumak için
dotenv.config();

const app = express();

// --- MİDDLEWARE'LER ---
app.use(cors()); // Frontend'in backend'e istek atabilmesi için
app.use(express.json()); // Gelen JSON verilerini okuyabilmek için
app.use(express.urlencoded({ extended: true })); // Form verilerini okuyabilmek için
app.use('/api/proposals', proposalRoutes);
app.use('/api/reviews', reviewRoutes);

// --- DOSYA ERİŞİM İZNİ (ÇOK ÖNEMLİ) ---
// Admin panelinde veya sitede vergi levhalarını/fotoğrafları gösterebilmek için 'uploads' klasörünü dışa açıyoruz.
// index.ts dosyası "src" içinde olduğu için, bir üst klasöre ('../uploads') çıkıp ana dizindeki klasörü işaret ediyoruz.
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// --- API ROTALARI ---
app.use('/api/auth', authRoutes);  // Kayıt ve Giriş işlemleri
app.use('/api/requests', requestRoutes);   
app.use('/api/admin', adminRoutes);   // Admin onay ve kontrol işlemleri
app.use('/api/providers', providerRoutes);

// --- VERİTABANI BAĞLANTISI VE SUNUCU ---
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hizmet_pazari';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB bağlantısı başarılı.');
    app.listen(PORT, () => {
      console.log(`🚀 Sunucu ${PORT} portunda çalışıyor.`);
      console.log(`📂 Dosya sunucusu aktif: http://localhost:${PORT}/uploads`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB bağlantı hatası:', error);
  });