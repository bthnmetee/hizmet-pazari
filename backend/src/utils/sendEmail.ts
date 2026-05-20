import nodemailer from 'nodemailer';
import axios from 'axios';

interface EmailOptions {
  email: string;
  subject: string;
  message: string;
}

const redactEmail = (email?: string) => {
  if (!email || !email.includes('@')) return email || 'not-set';

  const [localPart, domain] = email.split('@');
  const visiblePrefix = localPart.slice(0, 2);
  return `${visiblePrefix}${localPart.length > 2 ? '***' : '*'}@${domain}`;
};

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
  const smtpUser = process.env.BREVO_SMTP_USER || process.env.SMTP_USER;
  const smtpPass = process.env.BREVO_SMTP_KEY || process.env.BREVO_SMTP_PASS || process.env.SMTP_PASS;
  const smtpHost = process.env.BREVO_SMTP_HOST || process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const smtpPort = Number(process.env.BREVO_SMTP_PORT || process.env.SMTP_PORT || 2525);
  const brevoApiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.BREVO_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || smtpUser;
  const fromName = process.env.BREVO_FROM_NAME || process.env.SMTP_FROM_NAME || 'Hizmet Pazari';
  const htmlContent = normalizeHtmlMessage(options.message);

  try {
    if (brevoApiKey) {
      console.log('[mail] Brevo API config kontrol ediliyor', {
        endpoint: 'https://api.brevo.com/v3/smtp/email',
        fromEmail: redactEmail(fromEmail),
        fromName,
        hasApiKey: true,
      });

      if (!fromEmail) {
        console.error('[mail] Brevo API config eksik', {
          hasFromEmail: Boolean(fromEmail),
        });
        throw new Error('Brevo API ayarlari eksik. BREVO_FROM_EMAIL tanimlanmalidir.');
      }

      console.log('[mail] Brevo API e-posta gonderimi basladi', {
        to: redactEmail(options.email),
        subject: options.subject,
      });

      const response = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: {
            name: fromName,
            email: fromEmail,
          },
          to: [
            {
              email: options.email,
            },
          ],
          subject: options.subject,
          htmlContent,
        },
        {
          headers: {
            accept: 'application/json',
            'api-key': brevoApiKey,
            'content-type': 'application/json',
          },
          timeout: 15000,
        }
      );

      console.log('[mail] E-posta Brevo API tarafindan kabul edildi', {
        to: redactEmail(options.email),
        status: response.status,
        messageId: response.data?.messageId,
      });

      return null;
    }

    const secure = smtpPort === 465;

    console.log('[mail] Brevo SMTP config kontrol ediliyor', {
      host: smtpHost,
      port: smtpPort,
      secure,
      smtpUser: redactEmail(smtpUser),
      fromEmail: redactEmail(fromEmail),
      fromName,
      hasPassword: Boolean(smtpPass),
      hasApiKey: false,
    });

    if (!smtpUser || !smtpPass || !fromEmail) {
      console.error('[mail] Brevo SMTP config eksik', {
        hasSmtpUser: Boolean(smtpUser),
        hasSmtpPassword: Boolean(smtpPass),
        hasFromEmail: Boolean(fromEmail),
      });
      throw new Error('Brevo SMTP ayarlari eksik. BREVO_SMTP_USER, BREVO_SMTP_KEY ve BREVO_FROM_EMAIL tanimlanmalidir.');
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    console.log('[mail] E-posta gonderimi basladi', {
      to: redactEmail(options.email),
      subject: options.subject,
      host: smtpHost,
      port: smtpPort,
    });

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: options.email,
      subject: options.subject,
      html: htmlContent,
    });

    console.log('[mail] E-posta Brevo tarafindan kabul edildi', {
      to: redactEmail(options.email),
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
      pending: info.pending,
    });
    return null;
  } catch (error: any) {
    console.error('[mail] E-Posta Gonderme Hatasi', {
      to: redactEmail(options.email),
      subject: options.subject,
      message: error?.message,
      code: error?.code,
      command: error?.command,
      response: error?.response,
      responseCode: error?.responseCode,
      httpStatus: error?.response?.status,
      httpData: error?.response?.data,
      stack: process.env.NODE_ENV === 'production' ? undefined : error?.stack,
    });
    throw new Error('E-Posta gonderilemedi.');
  }
};
