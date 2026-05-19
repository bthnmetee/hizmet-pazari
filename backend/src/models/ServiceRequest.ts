import mongoose, { Schema, Document } from 'mongoose';

export interface IServiceRequest extends Document {
  customer: mongoose.Types.ObjectId;
  category: string;
  title: string;
  description: string;
  location: string;
  phoneNumber: string;
  details: {
    houseSize?: string;
    movingDate?: string;
    elevatorFrom?: string;
    elevatorTo?: string;
    fromIl?: string;
    fromIlce?: string;
    toIl?: string;
    toIlce?: string;
  };
  status: 'active' | 'completed' | 'cancelled';
  proposalCount?: number; // ✅ EKLENDİ: frontend rekabet göstergesi için
  createdAt: Date;
}

const ServiceRequestSchema: Schema = new Schema({
  customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  category: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  details: {
    houseSize: { type: String },
    movingDate: { type: String },
    elevatorFrom: { type: String },
    elevatorTo: { type: String },
    fromIl: { type: String },
    fromIlce: { type: String },
    toIl: { type: String },
    toIlce: { type: String }
  },
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
  proposalCount: { type: Number, default: 0 }, // ✅ EKLENDİ
}, { timestamps: true });

export default mongoose.model<IServiceRequest>('ServiceRequest', ServiceRequestSchema);