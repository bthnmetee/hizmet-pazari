import { Request, Response } from 'express';
import axios from 'axios'; // Gerçek SMS API istekleri atmak için eklendi

// Geçici OTP deposu (Uygulama büyüdüğünde prodüksiyonda Redis kullanılması önerilir)
const otpStore: Map<string, { code: string; expiresAt: number }> = new Map();

// 6 haneli random OTP oluştur
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Telefon numarasını normalize et (Boşlukları sil, +90 ekle)
const normalizePhone = (phone: string): string => {
  return phone.replace(/[\s\-\(\)]/g, '').replace(/^0/, '+90');
};

// 📩 OTP GÖNDER
export const sendOTP = async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Telefon numarası gereklidir.' });
    }

    const normalized = normalizePhone(phoneNumber);
    const otp = generateOTP();

    // 5 dakika geçerlilik süresi
    otpStore.set(normalized, {
      code: otp,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    // ─── GERÇEK SMS GÖNDERİM ALANI ───
    const SMS_API_KEY = process.env.SMS_API_KEY;
    const SMS_SECRET = process.env.SMS_SECRET; // IletiMerkezi için Hash, Netgsm için Parola

    if (SMS_API_KEY && SMS_SECRET) {
      // Türkiye'de en yaygın servislerden olan İletiMerkezi (veya ayarlara göre NetGSM) için çalışan entegrasyon
      try {
        await axios.post('https://api.iletimerkezi.com/v1/send-sms/json', {
          request: {
            authentication: {
              key: SMS_API_KEY,
              hash: SMS_SECRET
            },
            order: {
              sender: process.env.SMS_SENDER_TITLE || "HIZMET",
              sendDateTime: [],
              message: {
                text: `Hizmet Pazarı doğrulama kodunuz: ${otp}. Kodu kimseyle paylaşmayın.`,
                receipents: {
                  number: [normalized]
                }
              }
            }
          }
        });
        console.log(`[BİLGİ] SMS Başarıyla gönderildi. (${normalized})`);
      } catch (err: any) {
        console.error("[HATA] SMS API isteği başarısız oldu:", err.message);
        // SMS hatasında yine de kodu terminale düşürelim ki test edilebilsin
        console.log(`⚠️ SMS GİTMEDİ - KOD: ${otp}`);
      }
    } else {
      // 🔧 DEV MODU (Türkiye'deki numaralara ücretsiz test SMS'leri abuse sebebiyle kapatıldığı için MOCK sistemi)
      console.log('─────────────────────────────────────────');
      console.log(`⚠️ SMS BİLGİLERİ YOK VEYA TEST LİMİTİ!`);
      console.log(`YALNIZCA GELİŞTİRİCİ MODU AKTİF - ARAYÜZE (UI) SAHTE SMS GÖNDERİLİYOR`);
      console.log(`📞 Numara: ${normalized}`);
      console.log(`🔢 Kod: ${otp}`);
      console.log(`⏰ Geçerlilik: 5 dakika`);
      console.log('─────────────────────────────────────────');
      
      // Geliştirici ortamı için frontend'de (RegisterPage.tsx) uyarı olarak göstermesi amacıyla
      // kodu doğrudan frontend'e dönüyorum ki oradan sanki telefonuna bir popup (toast) düşmüş gibi görebilesin.
      return res.json({ 
        message: 'Doğrulama kodu (Geliştirici Testi) gönderildi.', 
        expiresIn: 300,
        devMode: true,
        devOtp: otp
      });
    }

    res.json({ message: 'Doğrulama kodu gönderildi.', expiresIn: 300 });
  } catch (error: any) {
    console.error('OTP Gönderme Hatası:', error);
    res.status(500).json({ message: 'Doğrulama kodu gönderilemedi.' });
  }
};

// ✅ OTP DOĞRULA
export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { phoneNumber, code } = req.body;

    if (!phoneNumber || !code) {
      return res.status(400).json({ message: 'Telefon numarası ve doğrulama kodu gereklidir.' });
    }

    const normalized = normalizePhone(phoneNumber);
    const stored = otpStore.get(normalized);

    if (!stored) {
      return res.status(400).json({ message: 'Doğrulama kodu bulunamadı. Lütfen yeni kod talep edin.' });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(normalized);
      return res.status(400).json({ message: 'Doğrulama kodunun süresi dolmuş. Lütfen yeni kod talep edin.' });
    }

    if (stored.code !== code) {
      return res.status(400).json({ message: 'Yanlış doğrulama kodu.' });
    }

    // Başarılı - kodu temizle
    otpStore.delete(normalized);

    res.json({ message: 'Telefon numarası doğrulandı.', verified: true });
  } catch (error: any) {
    console.error('OTP Doğrulama Hatası:', error);
    res.status(500).json({ message: 'Doğrulama sırasında hata oluştu.' });
  }
};