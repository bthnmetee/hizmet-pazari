import nodemailer from 'nodemailer';

interface EmailOptions {
  email: string;
  subject: string;
  message: string;
}

export const sendEmail = async (options: EmailOptions) => {
  try {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('SMTP ayarlari eksik! .env dosyasina SMTP_HOST, SMTP_USER ve SMTP_PASS ekleyin.');
      throw new Error('SMTP ayarlari eksik. E-posta gonderilemez.');
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Hizmet Pazari" <' + process.env.SMTP_USER + '>',
      to: options.email,
      subject: options.subject,
      html: options.message,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('E-posta gonderildi: ' + options.email + ' (ID: ' + info.messageId + ')');
    return null;
  } catch (error: any) {
    console.error('E-Posta Gonderme Hatasi:', error?.message || error);
    throw new Error('E-Posta gonderilemedi.');
  }
};