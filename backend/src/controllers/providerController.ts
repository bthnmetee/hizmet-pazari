import { Request, Response } from 'express';
import Provider from '../models/Provider';

// ONAYLI FİRMALARI LİSTELE
export const getApprovedProviders = async (req: Request, res: Response) => {
  try {
    const providers = await Provider.find({ isApproved: true }).select('-password').lean();
    const sorted = providers
      .map((p: any) => ({ ...p, averageRating: p.averageRating || 0, reviewCount: p.reviewCount || 0 }))
      .sort((a, b) => b.averageRating - a.averageRating);
    res.status(200).json(sorted);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// VİTRİN İÇİN
export const getProviderShowcase = async (req: Request, res: Response) => {
  try {
    const providers = await Provider.find({ isApproved: true })
      .select('name companyName serviceCategory services about profileImage averageRating reviewCount completedJobs cancelRate avgResponseMinutes monthsOnPlatform taxCertificateUrl isApproved')
      .sort({ averageRating: -1 })
      .limit(12)
      .lean();
    res.status(200).json(providers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// HİZMET ALANLARINI GÜNCELLE
export const updateServices = async (req: Request, res: Response) => {
  try {
    const { providerId, services } = req.body;
    if (!providerId) return res.status(400).json({ message: 'Provider ID gerekli.' });
    const provider = await Provider.findByIdAndUpdate(providerId, { services }, { new: true }).select('-password');
    if (!provider) return res.status(404).json({ message: 'Hizmet veren bulunamadı.' });
    res.status(200).json({ message: 'Hizmet alanları güncellendi.', provider });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// PROFİL GÜNCELLE
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { providerId, about, companyName, phoneNumber } = req.body;
    const updateData: any = {};
    if (about !== undefined) updateData.about = about;
    if (companyName !== undefined) updateData.companyName = companyName;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    const provider = await Provider.findByIdAndUpdate(providerId, updateData, { new: true }).select('-password');
    if (!provider) return res.status(404).json({ message: 'Hizmet veren bulunamadı.' });
    res.status(200).json({ message: 'Profil güncellendi.', provider });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};