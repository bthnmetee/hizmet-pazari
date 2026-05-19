import { Request, Response } from 'express';
import { sendEmail } from '../utils/sendEmail';

// Geçici OTP deposu (Uygulama büyüdüğünde prodüksiyonda Redis kullanılması önerilir)
const otpStore: Map<string, { code: string; expiresAt: number }> = new Map();

// 6 haneli random OTP oluştur
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 📩 OTP GÖNDER (Email)
export const sendOTP = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'E-posta adresi gereklidir.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const otp = generateOTP();

    // 5 dakika geçerlilik süresi
    otpStore.set(normalizedEmail, {
      code: otp,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    await sendEmail({
      email: normalizedEmail,
      subject: 'Hizmet Pazarı - Doğrulama Kodu',
      message: `
        <h2>Hesap Doğrulama</h2>
        <p>Hizmet Pazarı hesabınızı doğrulamak için aşağıdaki kodu kullanabilirsiniz:</p>
        <h1 style="letter-spacing: 5px; color: #1e3a8a;">${otp}</h1>
        <p>Bu kod 5 dakika boyunca geçerlidir. Kodu kimseyle paylaşmayınız.</p>
      `
    });

    return res.json({
      message: 'Doğrulama kodu e-posta adresinize gönderildi.',
      expiresIn: 300,
      smsProvider: 'email'
    });

  } catch (error: any) {
    console.error('OTP Gönderme Hatası:', error);
    res.status(500).json({ message: 'Doğrulama kodu gönderilemedi.' });
  }
};

// ✅ OTP DOĞRULA (Email)
export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'E-posta adresi ve doğrulama kodu gereklidir.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const stored = otpStore.get(normalizedEmail);

    if (!stored) {
      return res.status(400).json({ message: 'Doğrulama kodu bulunamadı. Lütfen yeni kod talep edin.' });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(normalizedEmail);
      return res.status(400).json({ message: 'Doğrulama kodunun süresi dolmuş. Lütfen yeni kod talep edin.' });
    }

    if (stored.code !== code) {
      return res.status(400).json({ message: 'Yanlış doğrulama kodu.' });
    }

    // Başarılı - kodu temizle
    otpStore.delete(normalizedEmail);

    res.json({ message: 'E-posta adresi doğrulandı.', verified: true });
  } catch (error: any) {
    console.error('OTP Doğrulama Hatası:', error);
    res.status(500).json({ message: 'Doğrulama sırasında hata oluştu.' });
  }
};