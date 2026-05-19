interface EmailOptions {
  email: string;
  subject: string;
  message: string;
}

export const sendEmail = async (options: EmailOptions) => {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Hizmet Pazarı <onboarding@resend.dev>',
        to: options.email,
        subject: options.subject,
        html: options.message,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Resend API hatası: ${JSON.stringify(error)}`);
    }

    console.log(`✅ E-posta gönderildi: ${options.email}`);
    return null;
  } catch (error) {
    console.error('❌ E-Posta Gönderme Hatası:', error);
    throw new Error('E-Posta gönderilemedi.');
  }
};