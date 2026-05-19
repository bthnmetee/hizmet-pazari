import nodemailer from 'nodemailer';

interface EmailOptions {
  email: string;
  subject: string;
  message: string;
}

const isProduction = process.env.NODE_ENV === 'production';

export const sendEmail = async (options: EmailOptions) => {
  try {
    let transporter;
    let isTestMode = false;

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      // ✅ Gerçek SMTP bağlantısı
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else if (isProduction) {
      // 🔴 Production'da SMTP bilgileri ZORUNLU
      console.error('❌ FATAL: SMTP ayarları production modunda zorunludur!');
      console.error('   .env dosyasına SMTP_HOST, SMTP_USER ve SMTP_PASS ekleyin.');
      throw new Error('SMTP ayarları eksik. E-posta gönderilemez.');
    } else {
      // ⚠️ Development'da Ethereal test hesabı kullan
      console.warn("⚠️ SMTP bilgileri eksik! Ethereal Email (test modu) kullanılıyor.");
      isTestMode = true;
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Hizmet Pazarı" <noreply@hizmet-pazari.net>',
      to: options.email,
      subject: options.subject,
      html: options.message,
    };

    const info = await transporter.sendMail(mailOptions);

    // Development'da detaylı log, production'da minimal log
    if (!isProduction) {
      console.log("-------------------------------------------------");
      console.log(`📩 ALICI: ${options.email}`);
      console.log(`📌 KONU: ${options.subject}`);
      console.log("✅ MESAJ GÖNDERİLDİ.");
      let testUrl = null;
      if (isTestMode) {
        testUrl = nodemailer.getTestMessageUrl(info);
        console.log(`🔗 E-POSTA ÖNİZLEME LİNKİ: ${testUrl}`);
      }
      console.log("-------------------------------------------------");
      
      return testUrl;
    }

    return null;
  } catch (error) {
    console.error("❌ E-Posta Gönderme Hatası:", isProduction ? (error as Error).message : error);
    throw new Error('E-Posta gönderilemedi.');
  }
};