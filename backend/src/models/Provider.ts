import mongoose, { Schema, Document } from 'mongoose';

export interface IProvider extends Document {
  name: string;
  email: string;
  password?: string;
  companyName?: string;
  phoneNumber?: string;
  walletBalance: number;
  about?: string;
  portfolioImages?: string[];
  serviceCategory?: string;
  services?: string[];
  isApproved: boolean;
  rating?: number;
  averageRating?: number;
  reviewCount?: number;
  taxCertificateUrl?: string;
  // ✅ EKLENDİ: TrustScoreCard ve istatistik için
  completedJobs?: number;
  cancelRate?: number;
  avgResponseMinutes?: number;
  monthsOnPlatform?: number;
  createdAt: Date;
}

const ProviderSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  companyName: { type: String },
  phoneNumber: { type: String },
  walletBalance: { type: Number, default: 0 },
  about: { type: String, default: '' },
  portfolioImages: [{ type: String }],
  serviceCategory: { type: String, default: 'Genel' },
  services: [{ type: String }],
  isApproved: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  taxCertificateUrl: { type: String },
  // ✅ EKLENDİ
  completedJobs: { type: Number, default: 0 },
  cancelRate: { type: Number, default: 0 },
  avgResponseMinutes: { type: Number, default: 60 },
  monthsOnPlatform: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model<IProvider>('Provider', ProviderSchema);