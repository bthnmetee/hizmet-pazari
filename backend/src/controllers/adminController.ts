import { Request, Response } from 'express';
import Provider from '../models/Provider';
import Customer from '../models/Customer';

// 1. Onay Bekleyen Hizmet Verenleri Getir
export const getPendingProviders = async (req: Request, res: Response) => {
  try {
    const pendingProviders = await Provider.find({ isApproved: false });
    res.status(200).json(pendingProviders);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Hizmet Vereni Onayla
export const approveProvider = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const provider = await Provider.findByIdAndUpdate(id, { isApproved: true }, { new: true });
    
    if (!provider) {
      return res.status(404).json({ message: 'Hizmet veren bulunamadı.' });
    }
    
    res.status(200).json({ message: 'Hizmet veren başarıyla onaylandı.', provider });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Hizmet Vereni Reddet (veya Sil)
export const rejectProvider = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Provider.findByIdAndDelete(id); // Şimdilik reddedilen başvuruyu siliyoruz
    res.status(200).json({ message: 'Başvuru reddedildi ve silindi.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Tüm Kullanıcıları (Müşterileri) Getir (Genel kontrol için)
export const getAllCustomers = async (req: Request, res: Response) => {
  try {
    const customers = await Customer.find();
    res.status(200).json(customers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};