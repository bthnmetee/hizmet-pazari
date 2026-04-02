import { Request, Response } from 'express';
import ServiceRequest from '../models/ServiceRequest';

// 1. YENİ HİZMET TALEBİ OLUŞTUR VE FİYAT BİÇ
export const createRequest = async (req: Request, res: Response) => {
  try {
    const { customer, category, title, description, location, phoneNumber, details } = req.body;

    // DİNAMİK FİYATLANDIRMA ALGORİTMASI
    let calculatedFee = 10; // Standart taban fiyat (10 Kredi)

    if (category === 'nakliyat' && details?.houseSize) {
      switch (details.houseSize) {
        case '1+0': calculatedFee = 15; break;
        case '1+1': calculatedFee = 25; break;
        case '2+1': calculatedFee = 40; break;
        case '3+1': calculatedFee = 60; break;
        case '4+1': calculatedFee = 85; break;
        case 'Villa / Müstakil': calculatedFee = 120; break;
        default: calculatedFee = 20;
      }
    }

    const newRequest = new ServiceRequest({
      customer,
      category,
      title,
      description,
      location,
      phoneNumber,
      leadFee: calculatedFee, // Hesaplanan fiyatı veritabanına yazıyoruz!
      details 
    });

    await newRequest.save();

    res.status(201).json({ 
      message: 'Talebiniz başarıyla oluşturuldu!', 
      request: newRequest 
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Talep oluşturulurken hata meydana geldi.', error: error.message });
  }
};

// 2. AÇIK HİZMET TALEPLERİNİ GETİR
export const getRequests = async (req: Request, res: Response) => {
  try {
    const requests = await ServiceRequest.find({ status: 'open' })
      .populate('customer', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error: any) {
    res.status(500).json({ message: 'Talepler getirilirken hata oluştu.', error: error.message });
  }
};