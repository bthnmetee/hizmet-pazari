import { Request, Response } from 'express';
import Proposal from '../models/Proposal';
import ServiceRequest from '../models/ServiceRequest';
import Provider from '../models/Provider';
import Transaction from '../models/Transaction';

const PROPOSAL_CREDIT_COST = 1;

// TEKLİF OLUŞTURMA
export const createProposal = async (req: Request, res: Response) => {
  try {
    const { serviceRequestId, providerId, price, message } = req.body;

    const providerDoc = await Provider.findById(providerId);
    if (!providerDoc) {
      return res.status(404).json({ message: 'Hizmet veren hesabı bulunamadı.' });
    }

    if (!providerDoc.walletBalance || providerDoc.walletBalance < PROPOSAL_CREDIT_COST) {
      return res.status(400).json({
        message: `Yetersiz kredi! En az ${PROPOSAL_CREDIT_COST} kredi gerekli. Mevcut: ${providerDoc.walletBalance || 0}`,
        code: 'INSUFFICIENT_CREDITS',
        currentBalance: providerDoc.walletBalance || 0,
        requiredCredits: PROPOSAL_CREDIT_COST
      });
    }

    // ✅ Daha önce teklif göndermiş mi kontrol et
    const existingProposal = await Proposal.findOne({
      serviceRequest: serviceRequestId,
      provider: providerId
    });
    if (existingProposal) {
      return res.status(400).json({ message: 'Bu ilana zaten teklif gönderdiniz.' });
    }

    // Kredi düş
    providerDoc.walletBalance -= PROPOSAL_CREDIT_COST;
    await providerDoc.save();

    const newProposal = new Proposal({
      serviceRequest: serviceRequestId,
      provider: providerId,
      price,
      messages: [{ sender: 'provider', text: message }]
    });
    await newProposal.save();

    // ✅ proposalCount arttır
    await ServiceRequest.findByIdAndUpdate(serviceRequestId, { $inc: { proposalCount: 1 } });

    // İşlem kaydı
    const transaction = new Transaction({
      provider: providerId,
      type: 'proposal_fee',
      amount: -PROPOSAL_CREDIT_COST,
      balanceAfter: providerDoc.walletBalance,
      description: `Teklif gönderildi (${PROPOSAL_CREDIT_COST} kredi)`,
      relatedProposal: newProposal._id
    });
    await transaction.save();

    res.status(201).json({
      message: 'Teklif başarıyla iletildi',
      proposal: newProposal,
      remainingCredits: providerDoc.walletBalance
    });
  } catch (error: any) {
    console.error('❌ Teklif Oluşturma Hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
};

// MESAJ YANITLAMA
export const replyToProposal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { sender, text } = req.body;
    const imageUrl = req.file ? (req.file as any).path : undefined;

    if ((!text || text.trim() === '') && !imageUrl) {
      return res.status(400).json({ message: 'Mesaj veya resim gönderin.' });
    }

    const proposal = await Proposal.findById(id);
    if (!proposal) return res.status(404).json({ message: 'Teklif bulunamadı.' });

    const newMessage: any = { sender, createdAt: new Date() };
    if (text && text.trim() !== '') newMessage.text = text;
    if (imageUrl) newMessage.imageUrl = imageUrl;

    proposal.messages.push(newMessage);
    await proposal.save();

    res.status(200).json({ message: 'Mesaj gönderildi.', proposal });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// MÜŞTERİYE GELEN TEKLİFLER
export const getCustomerProposals = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const myRequests = await ServiceRequest.find({ customer: customerId });
    const myRequestIds = myRequests.map(r => r._id);

    const proposals = await Proposal.find({ serviceRequest: { $in: myRequestIds } })
      .populate('provider', 'name companyName phoneNumber serviceCategory averageRating reviewCount about isApproved completedJobs cancelRate avgResponseMinutes')
      .populate('serviceRequest', 'title location category description proposalCount')
      .sort({ createdAt: -1 })
      .lean();

    const mappedProposals = proposals.map((p: any) => ({
      ...p,
      serviceRequestId: p.serviceRequest,
      providerId: p.provider
    }));

    res.status(200).json(mappedProposals);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// HİZMET VERENİN TEKLİFLERİ
export const getProviderProposals = async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;
    const proposals = await Proposal.find({ provider: providerId })
      .populate('serviceRequest', 'title location category description customer phoneNumber details proposalCount')
      .sort({ createdAt: -1 })
      .lean();

    const mappedProposals = proposals.map((p: any) => ({
      ...p,
      serviceRequestId: p.serviceRequest,
      providerId: p.provider
    }));

    res.status(200).json(mappedProposals);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// TEKLİF DURUMU GÜNCELLEME
export const updateProposalStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'accepted', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Geçersiz durum.' });
    }

    const updateData: any = { status };

    // ✅ acceptedAt / completedAt tarihlerini kaydet
    if (status === 'accepted') updateData.acceptedAt = new Date();
    if (status === 'completed') {
      updateData.completedAt = new Date();
      // Tamamlanan iş sayısını arttır
      const proposal = await Proposal.findById(id);
      if (proposal) {
        await Provider.findByIdAndUpdate(proposal.provider, { $inc: { completedJobs: 1 } });
      }
    }

    const proposal = await Proposal.findByIdAndUpdate(id, updateData, { new: true });
    if (!proposal) return res.status(404).json({ message: 'Teklif bulunamadı.' });

    res.status(200).json({ message: 'Durum güncellendi', proposal });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};