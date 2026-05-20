import nodemailer from 'nodemailer';

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

const getSafeErrorDetails = (error: any) => {
  return {
    message: error?.message,
    code: error?.code,
    command: error?.command,
    responseCode: error?.responseCode,
    smtpResponse: typeof error?.response === 'string' ? error.response : undefined,
    stack: process.env.NODE_ENV === 'production' ? undefined : error?.stack,
  };
};

export const sendEmail = async (options: EmailOptions) => {
  const smtpHost = process.env.SMTP_HOST || process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com';
  const smtpPort = Number(process.env.SMTP_PORT || process.env.BREVO_SMTP_PORT || 2525);
  const smtpSecure = (process.env.SMTP_SECURE || '').toLowerCase() === 'true';
  const smtpUser = process.env.SMTP_USER || process.env.BREVO_SMTP_USER;
  const smtpPass =
    process.env.SMTP_PASS ||
    process.env.SMTP_KEY ||
    process.env.BREVO_SMTP_KEY ||
    process.env.BREVO_SMTP_PASS;
  const fromEmail =
    process.env.MAIL_FROM_EMAIL ||
    process.env.BREVO_FROM_EMAIL ||
    process.env.SMTP_FROM_EMAIL ||
    smtpUser;
  const fromName = process.env.MAIL_FROM_NAME || process.env.BREVO_FROM_NAME || process.env.SMTP_FROM_NAME || 'Hizmet Pazari';
  const htmlContent = normalizeHtmlMessage(options.message);

  try {
    console.log('[mail] Brevo SMTP config kontrol ediliyor', {
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      smtpUser: redactEmail(smtpUser),
      fromEmail: redactEmail(fromEmail),
      fromName,
      hasPassword: Boolean(smtpPass),
    });

    if (!smtpUser || !smtpPass || !fromEmail) {
      console.error('[mail] Brevo SMTP config eksik', {
        hasSmtpUser: Boolean(smtpUser),
        hasSmtpPassword: Boolean(smtpPass),
        hasFromEmail: Boolean(fromEmail),
      });
      throw new Error('SMTP ayarlari eksik. SMTP_USER, SMTP_PASS veya SMTP_KEY ve MAIL_FROM_EMAIL tanimlanmalidir.');
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    console.log('[mail] Brevo SMTP transporter verify basladi', {
      host: smtpHost,
      port: smtpPort,
    });
    await transporter.verify();
    console.log('[mail] Brevo SMTP transporter verify basarili', {
      host: smtpHost,
      port: smtpPort,
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
      ...getSafeErrorDetails(error),
    });
    throw new Error('E-Posta gonderilemedi.');
  }
};
