import nodemailer from 'nodemailer';

interface EmailOptions {
  email: string;
  subject: string;
  message: string;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const normalizeHtmlMessage = (message: string) => {
  const trimmedMessage = message.trim();
  const hasHtmlTags = /<\/?[a-z][\s\S]*>/i.test(trimmedMessage);

  if (hasHtmlTags) {
    return trimmedMessage;
  }

  return escapeHtml(trimmedMessage).replace(/\n/g, '<br>');
};

export const sendEmail = async (options: EmailOptions) => {
  try {
    const smtpUser = process.env.BREVO_SMTP_USER || process.env.SMTP_USER;
    const smtpPass = process.env.BREVO_SMTP_KEY || process.env.BREVO_SMTP_PASS || process.env.SMTP_PASS;
    const smtpHost = process.env.BREVO_SMTP_HOST || process.env.SMTP_HOST || 'smtp-relay.brevo.com';
    const smtpPort = Number(process.env.BREVO_SMTP_PORT || process.env.SMTP_PORT || 2525);
    const fromEmail = process.env.BREVO_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || smtpUser;
    const fromName = process.env.BREVO_FROM_NAME || process.env.SMTP_FROM_NAME || 'Hizmet Pazari';

    if (!smtpUser || !smtpPass || !fromEmail) {
      throw new Error('Brevo SMTP ayarlari eksik. BREVO_SMTP_USER, BREVO_SMTP_KEY ve BREVO_FROM_EMAIL tanimlanmalidir.');
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: options.email,
      subject: options.subject,
      html: normalizeHtmlMessage(options.message),
    });

    console.log(`E-posta Brevo ile gonderildi: ${options.email}`);
    return null;
  } catch (error: any) {
    console.error('E-Posta Gonderme Hatasi:', error?.message, error?.code);
    throw new Error('E-Posta gonderilemedi.');
  }
};
