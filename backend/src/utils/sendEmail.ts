import nodemailer from 'nodemailer';

interface EmailOptions {
  email: string;
  subject: string;
  message: string;
}

export const sendEmail = async (options: EmailOptions) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: "Hizmet Pazari" <>,
      to: options.email,
      subject: options.subject,
      html: options.message,
    });

    console.log('E-posta gonderildi: ' + options.email);
    return null;
  } catch (error: any) {
    console.error('E-Posta Gonderme Hatasi:', error?.message, error?.code);
    throw new Error('E-Posta gonderilemedi.');
  }
};
