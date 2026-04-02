import { Request, Response } from 'express';
import Proposal from '../models/Proposal';
import Provider from '../models/Provider'; 
import ServiceRequest from '../models/ServiceRequest'; 

// 1. YENİ TEKLİF OLUŞTUR VE ÜCRETİ TAHSİL ET
export const createProposal = async (req: Request, res: Response) => {
  try {
    const { serviceRequestId, providerId, price, message } = req.body;

    const provider = await Provider.findById(providerId);
    const serviceRequest = await ServiceRequest.findById(serviceRequestId);

    if (!provider || !serviceRequest) {
      return res.status(404).json({ message: 'Kullanıcı veya ilan bulunamadı.' });
    }

    // KURTARICI KOD 1: Eğer eski hesapsa ve cüzdanı yoksa, ona 150 kredi hediye et
    if (provider.walletBalance === undefined || provider.walletBalance === null || isNaN(provider.walletBalance)) {
      provider.walletBalance = 150;
    }

    // KONTROL 1: Zaten teklif verilmiş mi?
    const existingProposal = await Proposal.findOne({ serviceRequest: serviceRequestId, provider: providerId });
    if (existingProposal) {
      return res.status(400).json({ message: 'Bu ilana zaten bir teklif verdiniz.' });
    }

    // KONTROL 2: Cüzdanda yeterli bakiye var mı?
    const fee = serviceRequest.leadFee || 20; 
    if (provider.walletBalance < fee) {
      return res.status(400).json({ 
        message: `Yetersiz bakiye! Bu ilana teklif vermek için ${fee} Krediye ihtiyacınız var. Mevcut bakiyeniz: ${provider.walletBalance} Kredi.` 
      });
    }

    // TAHSİLAT: Krediyi cüzdandan düş
    provider.walletBalance -= fee;

    // KURTARICI KOD 2: Eski hesapların eksik zorunlu bilgilerini tamamla (Hata vermesini engeller)
    if (!provider.taxNumber) provider.taxNumber = "11111111111"; // Rastgele bir vergi no
    if (!provider.serviceCategory) provider.serviceCategory = "nakliyat"; // Rastgele kategori
    if (!provider.phoneNumber) provider.phoneNumber = "05555555555"; // Rastgele telefon

    await provider.save();

    // TEKLİFİ OLUŞTUR
    const newProposal = new Proposal({
      serviceRequest: serviceRequestId,
      provider: providerId,
      price,
      conversation: [{ sender: 'provider', text: message }] 
    });

    await newProposal.save();

    res.status(201).json({ 
      message: 'Teklifiniz başarıyla iletildi ve ücret cüzdanınızdan düşüldü!',
      newBalance: provider.walletBalance // Kalan bakiyeyi arayüze gönderiyoruz
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Teklif gönderilirken hata oluştu.', error: error.message });
  }
};

// 2. MÜŞTERİNİN KENDİ İLANLARINA GELEN TEKLİFLERİ GETİR
export const getCustomerProposals = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const proposals = await Proposal.find()
      .populate({ path: 'serviceRequest', match: { customer: customerId } })
      .populate('provider', 'name averageRating reviewCount phoneNumber');

    const filteredProposals = proposals.filter(p => p.serviceRequest !== null);
    res.status(200).json(filteredProposals);
  } catch (error: any) {
    res.status(500).json({ message: 'Teklifler getirilirken hata oluştu.', error: error.message });
  }
};

// 3. TEKLİFİ KABUL ET (ANLAŞMA SAĞLA)
export const acceptProposal = async (req: Request, res: Response) => {
  try {
    const { proposalId } = req.params;
    
    const proposal = await Proposal.findByIdAndUpdate(proposalId, { status: 'accepted' }, { new: true });
    if (!proposal) return res.status(404).json({ message: 'Teklif bulunamadı.' });

    await Proposal.updateMany(
      { serviceRequest: proposal.serviceRequest, _id: { $ne: proposalId } },
      { status: 'rejected' }
    );

    await ServiceRequest.findByIdAndUpdate(proposal.serviceRequest, { status: 'in-progress' });

    res.status(200).json({ message: 'Teklif kabul edildi, diğer teklifler reddedildi.', proposal });
  } catch (error: any) {
    res.status(500).json({ message: 'Teklif kabul edilirken hata oluştu.', error: error.message });
  }
};

// 4. HİZMET VERENİN KENDİ VERDİĞİ TEKLİFLERİ GETİR
export const getProviderProposals = async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;
    const proposals = await Proposal.find({ provider: providerId })
      .populate('serviceRequest'); 
    res.status(200).json(proposals);
  } catch (error: any) {
    res.status(500).json({ message: 'Teklifler getirilirken hata oluştu.', error: error.message });
  }
};

// 5. TEKLİFE MESAJ GÖNDER (KARŞILIKLI SOHBET)
export const replyToProposal = async (req: Request, res: Response) => {
  try {
    const { proposalId } = req.params;
    const { sender, text } = req.body;

    const proposal = await Proposal.findById(proposalId);
    if (!proposal) return res.status(404).json({ message: 'Teklif bulunamadı.' });

    proposal.conversation.push({ sender, text, createdAt: new Date() } as any);
    await proposal.save();

    res.status(200).json({ message: 'Mesaj gönderildi.', conversation: proposal.conversation });
  } catch (error: any) {
    res.status(500).json({ message: 'Mesaj gönderilirken hata oluştu.', error: error.message });
  }
};