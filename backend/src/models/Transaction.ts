import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  provider: mongoose.Types.ObjectId;
  type: 'credit_purchase' | 'proposal_fee' | 'bonus' | 'refund';
  amount: number;
  balanceAfter: number;
  description: string;
  paymentMethod?: 'credit_card' | 'bank_transfer' | 'bonus';
  cardLast4?: string;
  packageName?: string;
  relatedProposal?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const TransactionSchema: Schema = new Schema({
  provider: { type: Schema.Types.ObjectId, ref: 'Provider', required: true },
  type: { 
    type: String, 
    enum: ['credit_purchase', 'proposal_fee', 'bonus', 'refund'], 
    required: true 
  },
  amount: { type: Number, required: true }, // Pozitif: giriş, Negatif: çıkış
  balanceAfter: { type: Number, required: true },
  description: { type: String, required: true },
  paymentMethod: { type: String, enum: ['credit_card', 'bank_transfer', 'bonus'] },
  cardLast4: { type: String },
  packageName: { type: String },
  relatedProposal: { type: Schema.Types.ObjectId, ref: 'Proposal' }
}, { timestamps: true });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
