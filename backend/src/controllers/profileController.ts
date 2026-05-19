import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import Customer from '../models/Customer';
import Provider from '../models/Provider';

/**
 * Profil Resmi Yükleme Controller'ı
 * Hem müşteri hem hizmet veren için ortak endpoint.
 */
export const uploadProfileImage = async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({ message: 'Kullanıcı bilgileri eksik.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Lütfen bir resim dosyası yükleyin.' });
    }

    const imageUrl = (req.file as any).path; // Cloudinary URL

    let updatedUser;
    if (role === 'customer' || role === 'admin') {
      updatedUser = await Customer.findByIdAndUpdate(
        userId,
        { profileImage: imageUrl },
        { new: true }
      ).select('-password');
    } else if (role === 'provider') {
      updatedUser = await Provider.findByIdAndUpdate(
        userId,
        { profileImage: imageUrl },
        { new: true }
      ).select('-password');
    } else {
      return res.status(400).json({ message: 'Geçersiz kullanıcı rolü.' });
    }

    if (!updatedUser) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    res.status(200).json({
      message: 'Profil resmi başarıyla güncellendi.',
      profileImage: imageUrl,
    });
  } catch (error: any) {
    console.error('❌ Profil resmi yükleme hatası:', error);
    res.status(500).json({ message: 'Profil resmi yüklenirken hata oluştu: ' + error.message });
  }
};

/**
 * Şifre Değiştirme Controller'ı
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const { userId, role, currentPassword, newPassword } = req.body;

    if (!userId || !role || !currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Gerekli bilgiler eksik.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Yeni şifreniz en az 6 karakter olmalıdır.' });
    }

    let user;
    if (role === 'customer' || role === 'admin') {
      user = await Customer.findById(userId).select('+password');
    } else if (role === 'provider') {
      user = await Provider.findById(userId).select('+password');
    } else {
      return res.status(400).json({ message: 'Geçersiz kullanıcı rolü.' });
    }

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    if (!user.password) {
      return res.status(400).json({ message: 'Kullanıcı şifresi ayarlanamamış.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mevcut şifreniz hatalı.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Şifreniz başarıyla değiştirildi.' });
  } catch (error: any) {
    console.error('❌ Şifre değiştirme hatası:', error);
    res.status(500).json({ message: 'Şifre değiştirilirken hata oluştu: ' + error.message });
  }
};
