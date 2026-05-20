import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Customer from '../models/Customer';
import Provider from '../models/Provider';

const getPrimaryServiceCategory = (service?: string): string => {
  if (!service) return 'Genel';
  return service.includes('nakliyat') ? 'nakliyat' : service;
};

const buildResetPasswordLink = (frontendUrl: string, token: string) => {
  const baseUrl = frontendUrl.replace(/\/+$/, '');
  return `${baseUrl}/reset-password/${encodeURIComponent(token)}`;
};

// 🚀 MÜŞTERİ KAYIT (Sadece Metin Verileri)
export const registerCustomer = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phoneNumber } = req.body;

    const cleanEmail = email?.trim().toLowerCase();
    const cleanPhone = phoneNumber?.trim();

    const existingUser = await Customer.findOne({ email: cleanEmail });
    if (existingUser) return res.status(400).json({ message: 'Bu e-posta zaten kullanımda.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newCustomer = new Customer({ 
      name: name?.trim(), 
      email: cleanEmail, 
      password: hashedPassword, 
      phoneNumber: cleanPhone, 
      isPhoneVerified: !!cleanPhone 
    });

    await newCustomer.save();
    res.status(201).json({ message: 'Müşteri kaydı başarıyla oluşturuldu.' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
};

// 🚀 HİZMET VEREN KAYIT (Cloudinary Resim Yüklemeli)
export const registerProvider = async (req: Request, res: Response) => {
  try {
    const { name, email, password, companyName, phoneNumber, services } = req.body;

    // Dosya kontrolü
    if (!req.file) {
      return res.status(400).json({ message: 'Vergi levhası yüklenmesi zorunludur.' });
    }

    const cleanEmail = email?.trim().toLowerCase();
    const cleanPhone = phoneNumber?.trim();

    const existingProvider = await Provider.findOne({ email: cleanEmail });
    if (existingProvider) return res.status(400).json({ message: 'Bu e-posta zaten kullanımda.' });

    const hashedPassword = await bcrypt.hash(password, 10);

    let parsedServices: string[] = [];
    try {
      if (services) parsedServices = JSON.parse(services);
    } catch(e) {
      parsedServices = [];
    }

    const newProvider = new Provider({
      name: name?.trim(),
      email: cleanEmail,
      password: hashedPassword,
      companyName: companyName?.trim(),
      phoneNumber: cleanPhone,
      serviceCategory: getPrimaryServiceCategory(parsedServices[0]),
      services: parsedServices,
      taxCertificateUrl: req.file.path, // ✅ DÜZELTME: Model alan adıyla eşleşiyor
      isApproved: false
    });

    await newProvider.save();
    res.status(201).json({ message: 'Hizmet veren kaydı başarıyla oluşturuldu. Onay bekleniyor.' });
  } catch (error: any) {
    console.error("Kayıt Hatası:", error);

    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyValue)[0];
      if (duplicatedField === 'email') {
        return res.status(400).json({ message: 'Bu e-posta adresi zaten sistemde kayıtlı.' });
      }
      if (duplicatedField === 'phoneNumber') {
        return res.status(400).json({ message: 'Bu telefon numarası zaten sistemde kayıtlı.' });
      }
    }

    res.status(500).json({ message: 'Kayıt sırasında hata: ' + error.message });
  }
};

// 🔑 GİRİŞ YAP (E-Posta veya Telefon ile Çift Tablo Kontrollü)
export const login = async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Lütfen giriş bilgilerinizi eksiksiz doldurun.' });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    const searchCriteria = {
      $or: [
        { email: cleanIdentifier },
        { phoneNumber: cleanIdentifier }
      ]
    };



    // Önce Müşteri tablosunda ara
    let user = await Customer.findOne(searchCriteria).select('+password');
    let role = 'customer';

    // Müşteri değilse, Hizmet Veren tablosunda ara
    if (!user) {
      user = await Provider.findOne(searchCriteria).select('+password');
      role = 'provider';
    }

    // İki tabloda da yoksa
    if (!user) {

      return res.status(404).json({ message: 'Bu bilgilerle kayıtlı bir kullanıcı bulunamadı.' });
    }

    // ✅ Admin kontrolü (email bazlı)
    if (process.env.ADMIN_EMAIL && user.email.toLowerCase() === process.env.ADMIN_EMAIL.trim().toLowerCase()) {
      role = 'admin';
    }



    if (!user.password) {
      return res.status(400).json({ message: 'Bu hesabın şifre bilgisi eksik.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {

      return res.status(400).json({ message: 'Hatalı şifre girdiniz.' });
    }

    // ✅ Hizmet veren onay kontrolü
    if (role === 'provider') {
      const provider = user as any;
      if (!provider.isApproved) {
        return res.status(403).json({ message: 'Hesabınız henüz onaylanmamış. Lütfen admin onayını bekleyin.' });
      }
    }

    const token = jwt.sign(
      { id: user._id, role: role },
      process.env.JWT_SECRET!,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: (user as any).phoneNumber,
        companyName: (user as any).companyName,
        profileImage: (user as any).profileImage || '',
        services: (user as any).services || [],
        serviceCategory: (user as any).serviceCategory || '',
        role: role
      }
    });

  } catch (error) {
    console.error("Login Hatası (Catch Bloğu):", error);
    res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
};

// 🔑 ŞİFREMİ UNUTTUM
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'E-posta adresi gereklidir.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Kullanıcıyı iki tabloda da ara
    let user: any = await Customer.findOne({ email: cleanEmail });
    let userType = 'customer';
    
    if (!user) {
      user = await Provider.findOne({ email: cleanEmail });
      userType = 'provider';
    }

    if (!user) {
      return res.status(404).json({ message: 'Bu e-posta ile kayıtlı kullanıcı bulunamadı.' });
    }

    // Reset token oluştur
    const resetToken = jwt.sign(
      { id: user._id, type: userType },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = buildResetPasswordLink(FRONTEND_URL, resetToken);

    console.log('[auth] Sifre sifirlama linki olusturuldu', {
      userId: String(user._id),
      userType,
      email: cleanEmail,
      frontendUrl: FRONTEND_URL,
      tokenLength: resetToken.length,
    });

    // Mail Gönderimi
    const { sendEmail } = await import('../utils/sendEmail');
    const previewUrl = await sendEmail({
      email: user.email,
      subject: 'Hizmet Pazarı - Şifre Sıfırlama Talebi',
      message: `
        <h2>Şifre Sıfırlama Talebi</h2>
        <p>Merhaba ${user.name || ''},</p>
        <p>Hesabınız için şifre sıfırlama talebinde bulundunuz.</p>
        <p>Lütfen aşağıdaki bağlantıya tıklayarak yeni şifrenizi belirleyin:</p>
        <a href="${resetLink}" style="display:inline-block; padding:10px 20px; background:#1e3a8a; color:#fff; text-decoration:none; border-radius:5px;">Şifremi Sıfırla</a>
        <br><br>
        <p>Eğer bu talebi siz yapmadıysanız bu e-postayı dikkate almayınız.</p>
        <p>İyi günler dileriz,<br>Hizmet Pazarı Ekibi</p>
      `
    });

    res.json({ 
      message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.',
      previewUrl: previewUrl || undefined
    });
  } catch (error) {
    console.error("Forgot Password Hatası:", error);
    res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
};

// 🔑 ŞİFRE SIFIRLAMA
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const rawToken = req.params.token;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Şifre en az 6 karakter olmalıdır.' });
    }

    if (!rawToken) {
      return res.status(400).json({ message: 'Şifre sıfırlama bağlantısı eksik.' });
    }

    const token = decodeURIComponent(String(rawToken)).trim();

    console.log('[auth] Sifre sifirlama istegi alindi', {
      tokenLength: token.length,
      hasNewPassword: Boolean(newPassword),
    });

    // Token doğrula
    const decoded: any = jwt.verify(token as string, process.env.JWT_SECRET!);

    console.log('[auth] Sifre sifirlama token dogrulandi', {
      userId: decoded.id,
      userType: decoded.type,
    });
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    if (decoded.type === 'customer') {
      const updatedCustomer = await Customer.findByIdAndUpdate(decoded.id, { password: hashedPassword });
      if (!updatedCustomer) {
        console.warn('[auth] Sifre sifirlama kullanici bulunamadi', {
          userId: decoded.id,
          userType: decoded.type,
        });
        return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
      }
    } else if (decoded.type === 'provider') {
      const updatedProvider = await Provider.findByIdAndUpdate(decoded.id, { password: hashedPassword });
      if (!updatedProvider) {
        console.warn('[auth] Sifre sifirlama kullanici bulunamadi', {
          userId: decoded.id,
          userType: decoded.type,
        });
        return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
      }
    } else {
      console.warn('[auth] Sifre sifirlama token tipi gecersiz', {
        userType: decoded.type,
      });
      return res.status(400).json({ message: 'Geçersiz şifre sıfırlama bağlantısı.' });
    }

    console.log('[auth] Sifre basariyla sifirlandi', {
      userId: decoded.id,
      userType: decoded.type,
    });

    res.json({ message: 'Şifreniz başarıyla güncellendi.' });
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      console.error('[auth] Sifre sifirlama token suresi doldu');
      return res.status(400).json({ message: 'Şifre sıfırlama bağlantısının süresi dolmuş.' });
    }
    if (error.name === 'JsonWebTokenError') {
      console.error('[auth] Sifre sifirlama token gecersiz', {
        reason: error.message,
      });
      return res.status(400).json({ message: 'Geçersiz şifre sıfırlama bağlantısı.' });
    }
    console.error("Reset Password Hatası:", error);
    res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
};
