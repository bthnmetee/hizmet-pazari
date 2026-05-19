import express from 'express';
import { verifyToken, verifyAdmin } from '../middlewares/authMiddleware';
import { 
  getAdminStats,
  getPendingProviders, 
  approveProvider, 
  rejectProvider, 
  getAllProviders,
  getAllCustomers,
  deleteCustomer,
  getAllTransactions,
  getAllServiceRequests,
  deleteServiceRequest
} from '../controllers/adminController';

const router = express.Router();

// ✅ Tüm admin rotaları verifyToken + verifyAdmin ile korunuyor

// İstatistikler
router.get('/stats', verifyToken, verifyAdmin, getAdminStats);

// Onay bekleyen hizmet verenler
router.get('/providers/pending', verifyToken, verifyAdmin, getPendingProviders);

// Hizmet veren onayla
router.put('/providers/approve/:id', verifyToken, verifyAdmin, approveProvider);

// Hizmet veren reddet/sil
router.delete('/providers/reject/:id', verifyToken, verifyAdmin, rejectProvider);

// Tüm onaylı hizmet verenler
router.get('/providers/approved', verifyToken, verifyAdmin, getAllProviders);

// Müşteriler
router.get('/customers', verifyToken, verifyAdmin, getAllCustomers);
router.delete('/customers/:id', verifyToken, verifyAdmin, deleteCustomer);

// İşlemler (Transactions)
router.get('/transactions', verifyToken, verifyAdmin, getAllTransactions);

// Hizmet Talepleri
router.get('/service-requests', verifyToken, verifyAdmin, getAllServiceRequests);
router.delete('/service-requests/:id', verifyToken, verifyAdmin, deleteServiceRequest);

export default router;