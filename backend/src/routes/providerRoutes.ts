import express from 'express';
import { getApprovedProviders, getProviderShowcase, updateServices, updateProfile } from '../controllers/providerController';

const router = express.Router();

router.get('/approved', getApprovedProviders);
router.get('/showcase', getProviderShowcase);
router.put('/update-services', updateServices);
router.put('/update-profile', updateProfile);

export default router;