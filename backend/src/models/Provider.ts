import { Schema, model } from 'mongoose';

const providerSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  phoneNumber: { type: String, required: true, unique: true },
  serviceCategory: { type: String, required: true },
  taxNumber: { type: String, required: true },
  isApproved: { type: Boolean, default: false },
  
  about: { type: String, default: 'Bu profesyonel henüz bir tanıtım yazısı eklemedi.' },
  averageRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  walletBalance: { type: Number, default: 150 },

  // YENİ EKLENEN: PROFİL GÖRSELLERİ (URL listesi olarak)
  portfolioImages: [{ type: String }]

}, { timestamps: true });

export default model('Provider', providerSchema);