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
      // ԣ� Ger+�ek SMTP ba��lant�-s�-
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
      // ���+ Production'da SMTP bilgileri ZORUNLU
      console.error('��� FATAL: SMTP ayarlar�- production modunda zorunludur!');
      console.error('   .env dosyas�-na SMTP_HOST, SMTP_USER ve SMTP_PASS ekleyin.');
      throw new Error('SMTP ayarlar�- eksik. E-posta g+�nderilemez.');
    } else {
      // ��ᴩ� Development'da Ethereal test hesab�- kullan
      console.warn("��ᴩ� SMTP bilgileri eksik! Ethereal Email (test modu) kullan�-l�-yor.");
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
      from: process.env.SMTP_FROM || '"Hizmet Pazar�-" <noreply@hizmet-pazari.net>',
      to: options.email,
      subject: options.subject,
      html: options.message,
    };

    const info = await transporter.sendMail(mailOptions);

    // Development'da detayl�- log, production'da minimal log
    if (!isProduction) {
      console.log("-------------------------------------------------");
      console.log(`���� ALICI: ${options.email}`);
      console.log(`���� KONU: ${options.subject}`);
      console.log("ԣ� MESAJ G+�NDER�-LD�-.");
      let testUrl = null;
      if (isTestMode) {
        testUrl = nodemailer.getTestMessageUrl(info);
        console.log(`���� E-POSTA +�N�-ZLEME L�-NK�-: ${testUrl}`);
      }
      console.log("-------------------------------------------------");
      
      return testUrl;
    }

    return null;
  } catch (error: any) {
    console.error('❌ E-Posta Gönderme Hatası:', JSON.stringify(error?.message), error?.code, error?.response);
    throw new Error('E-Posta gönderilemedi.');
  }
};
