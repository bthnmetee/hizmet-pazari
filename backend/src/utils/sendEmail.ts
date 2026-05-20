import nodemailer from 'nodemailer';

interface EmailOptions {
  email: string;
  subject: string;
  message: string;
}

export const sendEmail = async (options: EmailOptions) => {
  // Oncelik 1: Resend API (HTTP tabanli - Render'da calisiyor)
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || 'Hizmet Pazari <onboarding@resend.dev>',
          to: options.email,
          subject: options.subject,
          html: options.message,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error('Resend API hatasi: ' + JSON.stringify(error));
      }

      console.log('E-posta gonderildi (Resend): ' + options.email);
      return null;
    } catch (error: any) {
      console.error('Resend hatasi:', error?.message || error);
      throw new Error('E-Posta gonderilemedi.');
    }
  }

  // Oncelik 2: SMTP (Lokal gelistirme icin)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 10000,
      });

      const mailOptions = {
        from: process.env.SMTP_FROM || '"Hizmet Pazari" <' + process.env.SMTP_USER + '>',
        to: options.email,
        subject: options.subject,
        html: options.message,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('E-posta gonderildi (SMTP): ' + options.email + ' (ID: ' + info.messageId + ')');
      return null;
    } catch (error: any) {
      console.error('SMTP hatasi:', error?.message || error);
      throw new Error('E-Posta gonderilemedi.');
    }
  }

  throw new Error('E-posta ayarlari eksik. RESEND_API_KEY veya SMTP bilgileri tanimlanmali.');
};