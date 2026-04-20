import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

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

dotenv.config();
const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// ✅ Statik dosya sunumu (uploads klasörü)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ✅ Tüm Rota Bağlantıları
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/providers', providerRoutes); 
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/phone', phoneRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hizmet_pazari'; 

// MongoDB Bağlantısı ve Sunucuyu Başlatma
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Bağlantısı Başarılı');
    app.listen(PORT, () => {
      console.log(`✅ Server ${PORT} portunda çalışıyor`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB Bağlantı Hatası:', error.message);
  });