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

const getMailConfig = () => {
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

  return {
    smtpHost,
    smtpPort,
    smtpSecure,
    smtpUser,
    smtpPass,
    fromEmail,
    fromName,
  };
};

const logMailConfig = (prefix: string, config: ReturnType<typeof getMailConfig>) => {
  console.log(prefix, {
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    smtpUser: redactEmail(config.smtpUser),
    fromEmail: redactEmail(config.fromEmail),
    fromName: config.fromName,
    hasPassword: Boolean(config.smtpPass),
  });
};

const createMailTransporter = (config: ReturnType<typeof getMailConfig>) => {
  if (!config.smtpUser || !config.smtpPass || !config.fromEmail) {
    console.error('[mail] Brevo SMTP config eksik', {
      hasSmtpUser: Boolean(config.smtpUser),
      hasSmtpPassword: Boolean(config.smtpPass),
      hasFromEmail: Boolean(config.fromEmail),
    });
    throw new Error('SMTP ayarlari eksik. SMTP_USER, SMTP_PASS veya SMTP_KEY ve MAIL_FROM_EMAIL tanimlanmalidir.');
  }

  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  });
};

export const verifyEmailTransport = async () => {
  const config = getMailConfig();

  try {
    logMailConfig('[mail] Startup SMTP config kontrol ediliyor', config);
    const transporter = createMailTransporter(config);

    console.log('[mail] Startup SMTP transporter verify basladi', {
      host: config.smtpHost,
      port: config.smtpPort,
    });
    await transporter.verify();
    console.log('[mail] Startup SMTP transporter verify basarili', {
      host: config.smtpHost,
      port: config.smtpPort,
    });
  } catch (error: any) {
    console.error('[mail] Startup SMTP transporter verify hatasi', getSafeErrorDetails(error));
  }
};

export const sendEmail = async (options: EmailOptions) => {
  const config = getMailConfig();
  const htmlContent = normalizeHtmlMessage(options.message);

  try {
    logMailConfig('[mail] Brevo SMTP config kontrol ediliyor', config);
    const transporter = createMailTransporter(config);

    console.log('[mail] Brevo SMTP transporter verify basladi', {
      host: config.smtpHost,
      port: config.smtpPort,
    });
    await transporter.verify();
    console.log('[mail] Brevo SMTP transporter verify basarili', {
      host: config.smtpHost,
      port: config.smtpPort,
    });

    console.log('[mail] E-posta gonderimi basladi', {
      to: redactEmail(options.email),
      subject: options.subject,
      host: config.smtpHost,
      port: config.smtpPort,
    });

    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
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
