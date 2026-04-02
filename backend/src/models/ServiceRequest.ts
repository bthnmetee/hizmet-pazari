import { Schema, model } from 'mongoose';

const serviceRequestSchema = new Schema({
  customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  category: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  phoneNumber: { type: String, required: true }, 
  
  // YENİ EKLENEN: BU İLANA TEKLİF VERME BEDELİ (KREDİ)
  leadFee: { type: Number, required: true }, 
  
  details: { type: Schema.Types.Mixed },
  status: { type: String, enum: ['open', 'in-progress', 'completed', 'cancelled'], default: 'open' }
}, { timestamps: true });

export default model('ServiceRequest', serviceRequestSchema);