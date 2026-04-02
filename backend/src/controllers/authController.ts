import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Customer from '../models/Customer';
import Provider from '../models/Provider';
import { sendEmail } from '../utils/sendEmail';

// 1. MÜŞTERİ KAYIT
export const registerCustomer = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await Customer.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Bu e-posta zaten kayıtlı.' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newCustomer = new Customer({ name, email, password: hashedPassword });
    await newCustomer.save();

    res.status(201).json({ message: 'Müşteri kaydı başarılı!' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// 2. HİZMET VEREN KAYIT
export const registerProvider = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phoneNumber, serviceCategory, taxNumber } = req.body;
    
    const existingEmail = await Provider.findOne({ email });
    const existingPhone = await Provider.findOne({ phoneNumber });
    if (existingEmail || existingPhone) {
      return res.status(400).json({ message: 'Bu e-posta veya telefon zaten kayıtlı.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newProvider = new Provider({
      name, email, password: hashedPassword, phoneNumber, serviceCategory, taxNumber
    });
    await newProvider.save();

    res.status(201).json({ message: 'Hizmet veren kaydı alındı. Onay bekleniyor.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// 3. GİRİŞ YAP (LOGIN)
export const login = async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;
    let user: any = null;
    let role = '';

    if (identifier.includes('@')) {
      user = await Customer.findOne({ email: identifier }).select('+password');
      if (user) {
        role = 'customer';
        // ADMIN KONTROLÜ
        if (user.email === 'admin@gmail.com') {
          role = 'admin'; 
        }
      } else {
        user = await Provider.findOne({ email: identifier }).select('+password');
        if (user) role = 'provider';
      }
    } else {
      user = await Provider.findOne({ phoneNumber: identifier }).select('+password');
      if (user) role = 'provider';
    }

    if (!user) return res.status(401).json({ message: 'Kullanıcı bulunamadı.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Şifre hatalı.' });

    if (role === 'provider' && user.isApproved === false) {
      return res.status(403).json({ message: 'Hesabınız henüz onaylanmamıştır.' });
    }

    const token = jwt.sign({ userId: user._id, role }, process.env.JWT_SECRET || 'gizli_anahtar', { expiresIn: '1d' });

    res.status(200).json({ 
      message: 'Giriş başarılı',
      token,
      user: { id: user._id, name: user.name, role, isApproved: user.isApproved }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// 4. ŞİFREMİ UNUTTUM (MAİL GÖNDERME)
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    let user: any = await Customer.findOne({ email });
    let role = 'customer';

    if (!user) {
      user = await Provider.findOne({ email });
      role = 'provider';
    }

    if (!user) return res.status(404).json({ message: 'Bu e-posta adresine ait bir hesap bulunamadı.' });

    const resetToken = jwt.sign(
      { userId: user._id, role }, 
      process.env.JWT_SECRET || 'gizli_anahtar', 
      { expiresIn: '15m' }
    );

    const resetUrl = `http://localhost:5173/sifre-sifirla/${resetToken}`;

    const message = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8fafc; border-radius: 10px;">
        <h2 style="color: #1e3a8a;">Şifre Sıfırlama Talebi</h2>
        <p>Merhaba <b>${user.name}</b>,</p>
        <p>Hesabınızın şifresini sıfırlamak için bir talep aldık. Şifrenizi yenilemek için aşağıdaki butona tıklayın:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">Şifremi Sıfırla</a>
      </div>
    `;

    await sendEmail({ email: user.email, subject: '🔑 Şifrenizi Sıfırlayın - Baykuş Platformu', message });

    res.status(200).json({ message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.' });
  } catch (error: any) {
    res.status(500).json({ message: 'E-posta gönderilirken bir hata oluştu.', error: error.message });
  }
};

// 5. ŞİFREYİ SIFIRLA (YENİ ŞİFREYİ KAYDET)
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'gizli_anahtar');

    let user: any;
    if (decoded.role === 'customer') {
      user = await Customer.findById(decoded.userId);
    } else {
      user = await Provider.findById(decoded.userId);
    }

    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: 'Şifreniz başarıyla güncellendi.' });
  } catch (error: any) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(400).json({ message: 'Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.' });
    }
    res.status(500).json({ message: 'Şifre güncellenirken bir hata oluştu.', error: error.message });
  }
};