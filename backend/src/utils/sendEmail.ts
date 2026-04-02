// GEÇİCİ GELİŞTİRİCİ MODU (Gerçekten mail atmaz, linki terminale yazar)
interface EmailOptions {
    email: string;
    subject: string;
    message: string;
  }
  
  export const sendEmail = async (options: EmailOptions) => {
    console.log("-------------------------------------------------");
    console.log(`📩 ALICI: ${options.email}`);
    console.log(`📌 KONU: ${options.subject}`);
    console.log("🔗 AŞAĞIDAKİ MESAJ İÇERİĞİ GÖNDERİLDİ KABUL EDİLDİ:");
    console.log(options.message);
    console.log("-------------------------------------------------");
    
    // Hata vermemesi için başarılı olmuş gibi yapıyoruz
    return Promise.resolve();
  };