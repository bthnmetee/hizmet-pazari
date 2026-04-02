import express from 'express';
import { 
  createProposal, 
  getCustomerProposals, 
  acceptProposal, 
  getProviderProposals,
  replyToProposal // Yeni eklediğimiz mesajlaşma fonksiyonu
} from '../controllers/proposalController';

const router = express.Router();

// 1. Yeni Teklif Oluştur ve İlk Mesajı At (Hizmet Veren)
// POST /api/proposals/create
router.post('/create', createProposal);

// 2. Müşterinin Kendi İlanlarına Gelen Tüm Teklifleri ve Mesajları Getir
// GET /api/proposals/customer/:customerId
router.get('/customer/:customerId', getCustomerProposals);

// 3. Teklifi Kabul Et (Müşteri Onayı)
// PATCH /api/proposals/accept/:proposalId
router.patch('/accept/:proposalId', acceptProposal);

// 4. Hizmet Verenin Kendi Verdiği Teklifleri Getir
// GET /api/proposals/provider/:providerId
router.get('/provider/:providerId', getProviderProposals);

// 5. Karşılıklı Mesajlaşma (Sohbete yeni mesaj ekle)
// POST /api/proposals/:proposalId/reply
router.post('/:proposalId/reply', replyToProposal);

export default router;