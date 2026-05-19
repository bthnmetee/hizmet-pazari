import { Request, Response } from 'express';
import Provider from '../models/Provider';
import Customer from '../models/Customer';
import ServiceRequest from '../models/ServiceRequest';
import Transaction from '../models/Transaction';
import { sendEmail } from '../utils/sendEmail';

// 1. İstatistikleri Getir (Dashboard)
export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const totalProviders = await Provider.countDocuments({ isApproved: true });
    const pendingProvidersCount = await Provider.countDocuments({ isApproved: false });
    const totalRequests = await ServiceRequest.countDocuments();
    const totalTransactions = await Transaction.countDocuments();
    
    // Toplam İşlem Hacmi Hesaplama
    const transactions = await Transaction.find({ status: 'completed' });
    const totalVolume = transactions.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    res.status(200).json({
      totalCustomers,
      totalProviders,
      pendingProvidersCount,
      totalRequests,
      totalTransactions,
      totalVolume,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
};

// 2. Onay Bekleyen Hizmet Verenleri Getir
export const getPendingProviders = async (req: Request, res: Response) => {
  try {
    const pendingProviders = await Provider.find({ isApproved: false }).sort({ createdAt: -1 });
    res.status(200).json(pendingProviders);
  } catch (error: any) {
    res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
};

// 3. Hizmet Vereni Onayla
export const approveProvider = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const provider = await Provider.findByIdAndUpdate(id, { isApproved: true }, { new: true });
    
    if (!provider) {
      return res.status(404).json({ message: 'Hizmet veren bulunamadı.' });
    }

    // Onay e-postası gönder
    try {
      await sendEmail({
        email: provider.email,
        subject: 'Hizmet Pazarı - Üyelik Başvurunuz Onaylandı ✅',
        message: `Sayın ${provider.name},\n\nHizmet Pazarı platformuna yaptığınız üyelik başvurusu yönetim ekibimiz tarafından incelenmiş ve onaylanmıştır.\n\nArtık platformumuza giriş yaparak hizmet taleplerine teklif verebilir, profilinizi düzenleyebilir ve müşterilerle iletişime geçebilirsiniz.\n\nGiriş yapmak için: https://hizmetpazari.net/login\n\nHizmet Pazarı ailesine hoş geldiniz!\n\nSaygılarımızla,\nHizmet Pazarı Ekibi`,
      });
    } catch (emailError) {
      console.error('Onay e-postası gönderilemedi:', emailError);
      // E-posta hatası onay işlemini engellememeli
    }
    
    res.status(200).json({ message: 'Hizmet veren başarıyla onaylandı.', provider });
  } catch (error: any) {
    res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
};

// 4. Hizmet Vereni Reddet (veya Sil)
export const rejectProvider = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Provider.findByIdAndDelete(id); 
    res.status(200).json({ message: 'Başvuru/Kayıt reddedildi ve silindi.' });
  } catch (error: any) {
    res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
};

// 5. Tüm Onaylı Profesyonelleri Getir
export const getAllProviders = async (req: Request, res: Response) => {
  try {
    const providers = await Provider.find({ isApproved: true }).sort({ createdAt: -1 });
    res.status(200).json(providers);
  } catch (error: any) {
    res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
};

// 6. Tüm Müşterileri Getir
export const getAllCustomers = async (req: Request, res: Response) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.status(200).json(customers);
  } catch (error: any) {
    res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
};

// 7. Müşteri Sil
export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Customer.findByIdAndDelete(id);
    res.status(200).json({ message: 'Müşteri hesabı başarıyla silindi.' });
  } catch (error: any) {
    res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
};

// 8. Tüm Finansal İşlemleri (Transactions) Getir
export const getAllTransactions = async (req: Request, res: Response) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 }).populate('provider', 'name email');
    res.status(200).json(transactions);
  } catch (error: any) {
    res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
};

// 9. Tüm Hizmet Taleplerini Getir
export const getAllServiceRequests = async (req: Request, res: Response) => {
  try {
    const requests = await ServiceRequest.find().sort({ createdAt: -1 }).populate('customer', 'name email');
    res.status(200).json(requests);
  } catch (error: any) {
    res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
};

// 10. Hizmet Talebini Sil
export const deleteServiceRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await ServiceRequest.findByIdAndDelete(id);
    // Also consider deleting related proposals if needed. For now, just delete the request.
    const Proposal = (await import('../models/Proposal')).default;
    await Proposal.deleteMany({ serviceRequestId: id });

    res.status(200).json({ message: 'Hizmet talebi başarıyla silindi.' });
  } catch (error: any) {
    res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
};