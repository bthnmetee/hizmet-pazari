import mongoose, { Schema, Document } from 'mongoose';

export interface IProposal extends Document {
  serviceRequest: mongoose.Types.ObjectId;
  provider: mongoose.Types.ObjectId;
  price: number;
  messages: { sender: 'customer' | 'provider'; text?: string; imageUrl?: string; createdAt: Date }[];
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  acceptedAt?: Date;   // ✅ EKLENDİ: frontend JobTimeline için gerekli
  completedAt?: Date;  // ✅ EKLENDİ: tamamlanma tarihi
  createdAt: Date;
}

const ProposalSchema: Schema = new Schema({
  serviceRequest: { type: Schema.Types.ObjectId, ref: 'ServiceRequest', required: true },
  provider: { type: Schema.Types.ObjectId, ref: 'Provider', required: true },
  price: { type: Number, required: true },
  messages: [
    {
      sender: { type: String, enum: ['customer', 'provider'], required: true },
      text: { type: String },
      imageUrl: { type: String },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'completed'], default: 'pending' },
  acceptedAt: { type: Date },   // ✅ EKLENDİ
  completedAt: { type: Date },  // ✅ EKLENDİ
}, { timestamps: true });

export default mongoose.model<IProposal>('Proposal', ProposalSchema);