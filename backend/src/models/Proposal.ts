import { Schema, model } from 'mongoose';

// Alt Şema: Her bir mesajın yapısı
const messageSchema = new Schema({
  sender: { type: String, enum: ['customer', 'provider'], required: true }, // Mesajı kim attı?
  text: { type: String, required: true }, // Mesajın içeriği
  createdAt: { type: Date, default: Date.now } // Atılma zamanı
});

const proposalSchema = new Schema({
  serviceRequest: { type: Schema.Types.ObjectId, ref: 'ServiceRequest', required: true },
  provider: { type: Schema.Types.ObjectId, ref: 'Provider', required: true },
  
  price: { type: Number, required: true },
  
  // Artık tek bir mesaj değil, karşılıklı konuşma listesi (chat) tutuyoruz
  conversation: [messageSchema], 
  
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
}, { timestamps: true });

export default model('Proposal', proposalSchema);