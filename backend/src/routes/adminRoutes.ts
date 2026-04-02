import express from 'express';
import { 
  getPendingProviders, 
  approveProvider, 
  rejectProvider, 
  getAllCustomers 
} from '../controllers/adminController';

const router = express.Router();

// Onay bekleyen hizmet verenleri getirir
router.get('/providers/pending', getPendingProviders);

// Bir hizmet vereni onaylar
router.put('/providers/approve/:id', approveProvider);

// Bir başvuruyu reddeder (siler)
router.delete('/providers/reject/:id', rejectProvider);

// Tüm kullanıcıları/müşterileri listeler
router.get('/customers', getAllCustomers);

export default router;