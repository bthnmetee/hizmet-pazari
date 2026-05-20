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
      // Ô£à Ger+ðek SMTP ba¦þlant¦-s¦-
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
      // ­þö+ Production'da SMTP bilgileri ZORUNLU
      console.error('ÔØî FATAL: SMTP ayarlar¦- production modunda zorunludur!');
      console.error('   .env dosyas¦-na SMTP_HOST, SMTP_USER ve SMTP_PASS ekleyin.');
      throw new Error('SMTP ayarlar¦- eksik. E-posta g+Ânderilemez.');
    } else {
      // ÔÜá´©Å Development'da Ethereal test hesab¦- kullan
      console.warn("ÔÜá´©Å SMTP bilgileri eksik! Ethereal Email (test modu) kullan¦-l¦-yor.");
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
      from: process.env.SMTP_FROM || '"Hizmet Pazar¦-" <noreply@hizmet-pazari.net>',
      to: options.email,
      subject: options.subject,
      html: options.message,
    };

    const info = await transporter.sendMail(mailOptions);

    // Development'da detayl¦- log, production'da minimal log
    if (!isProduction) {
      console.log("-------------------------------------------------");
      console.log(`­þô® ALICI: ${options.email}`);
      console.log(`­þôî KONU: ${options.subject}`);
      console.log("Ô£à MESAJ G+ûNDER¦-LD¦-.");
      let testUrl = null;
      if (isTestMode) {
        testUrl = nodemailer.getTestMessageUrl(info);
        console.log(`­þöù E-POSTA +ûN¦-ZLEME L¦-NK¦-: ${testUrl}`);
      }
      console.log("-------------------------------------------------");
      
      return testUrl;
    }

    return null;
  } catch (error) {
    console.error("ÔØî E-Posta G+Ânderme Hatas¦-:", isProduction ? (error as Error).message : error);
    throw new Error('E-Posta g+Ânderilemedi.');
  }
};
