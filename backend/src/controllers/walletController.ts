import { Request, Response } from 'express';
import Provider from '../models/Provider';
import Transaction from '../models/Transaction';

const CREDIT_PACKAGES = [
  { id: 'starter', name: 'Başlangıç', credits: 5, price: 49.99, popular: false, description: '5 teklif hakkı' },
  { id: 'basic', name: 'Temel', credits: 15, price: 129.99, popular: false, description: '15 teklif hakkı', savings: '%13 tasarruf' },
  { id: 'pro', name: 'Profesyonel', credits: 30, price: 229.99, popular: true, description: '30 teklif hakkı', savings: '%23 tasarruf' },
  { id: 'business', name: 'İşletme', credits: 60, price: 399.99, popular: false, description: '60 teklif hakkı', savings: '%33 tasarruf' },
  { id: 'enterprise', name: 'Kurumsal', credits: 120, price: 699.99, popular: false, description: '120 teklif hakkı', savings: '%42 tasarruf' },
];
const PROPOSAL_CREDIT_COST = 1;

// PAKETLERİ GETİR
export const getCreditPackages = async (req: Request, res: Response) => {
  try {
    res.status(200).json({ packages: CREDIT_PACKAGES, proposalCost: PROPOSAL_CREDIT_COST });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// KREDİ SATIN AL
export const purchaseCredits = async (req: Request, res: Response) => {
  try {
    const { providerId, packageId, cardNumber, cardHolder, expiry, cvv } = req.body;

    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!pkg) return res.status(400).json({ message: 'Geçersiz paket.' });

    const provider = await Provider.findById(providerId);
    if (!provider) return res.status(404).json({ message: 'Hizmet veren bulunamadı.' });

    // Kart format kontrolleri
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16)
      return res.status(400).json({ message: 'Geçersiz kart numarası.' });
    if (!cardHolder || cardHolder.trim().length < 3)
      return res.status(400).json({ message: 'Kart üzerindeki isim geçersiz.' });
    if (!expiry || !/^\d{2}\/\d{2}$/.test(expiry))
      return res.status(400).json({ message: 'Geçersiz son kullanma tarihi (AA/YY).' });
    if (!cvv || cvv.length < 3)
      return res.status(400).json({ message: 'Geçersiz CVV.' });

    const newBalance = (provider.walletBalance || 0) + pkg.credits;
    provider.walletBalance = newBalance;
    await provider.save();

    await new Transaction({
      provider: providerId,
      type: 'credit_purchase',
      amount: pkg.credits,
      balanceAfter: newBalance,
      description: `${pkg.name} paketi satın alındı (${pkg.credits} kredi)`,
      paymentMethod: 'credit_card',
      cardLast4: cardNumber.replace(/\s/g, '').slice(-4),
      packageName: pkg.name
    }).save();

    res.status(200).json({ message: `✅ ${pkg.credits} kredi yüklendi!`, newBalance });
  } catch (error: any) {
    res.status(500).json({ message: 'Ödeme hatası: ' + error.message });
  }
};

// BAKİYE SORGULA
export const getWalletBalance = async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;
    const provider = await Provider.findById(providerId).select('walletBalance name companyName');
    if (!provider) return res.status(404).json({ message: 'Hizmet veren bulunamadı.' });
    res.status(200).json({ balance: provider.walletBalance || 0, proposalCost: PROPOSAL_CREDIT_COST });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// İŞLEM GEÇMİŞİ
export const getTransactionHistory = async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;
    const transactions = await Transaction.find({ provider: providerId }).sort({ createdAt: -1 }).limit(50).lean();
    res.status(200).json(transactions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const PROPOSAL_COST = PROPOSAL_CREDIT_COST;