import { Schema, model } from 'mongoose';

const reviewSchema = new Schema({
  // Hangi teklif/iş için yapıldı?
  proposal: { type: Schema.Types.ObjectId, ref: 'Proposal', required: true },
  
  // Kim yaptı? (Müşteri)
  customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  
  // Kime yapıldı? (Hizmet Veren)
  provider: { type: Schema.Types.ObjectId, ref: 'Provider', required: true },
  
  // Verilen Puan (1 ile 5 arası)
  rating: { type: Number, required: true, min: 1, max: 5 },
  
  // Yorum metni
  comment: { type: String, required: true }
}, { timestamps: true });

export default model('Review', reviewSchema);