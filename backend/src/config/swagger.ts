import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hizmet Pazari API',
      version: '1.0.0',
      description: 'Hizmet Pazari platformu REST API dokumantasyonu',
      contact: {
        name: 'Hizmet Pazari Ekibi',
        email: 'batuhanm@gmail.com',
      },
    },
    servers: [
      {
        url: '/',
        description: 'Varsayılan (Mevcut Sunucu)',
      },
      {
        url: 'https://hizmet-pazari-backend.onrender.com',
        description: 'Production sunucusu',
      },
      {
        url: 'http://localhost:5000',
        description: 'Lokal gelistirme sunucusu',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token ile yetkilendirme. Ornek: "Bearer eyJhbGci..."',
        },
      },
      schemas: {
        // ===== AUTH =====
        LoginRequest: {
          type: 'object',
          required: ['identifier', 'password'],
          properties: {
            identifier: { type: 'string', description: 'E-posta veya telefon numarasi', example: 'kullanici@mail.com' },
            password: { type: 'string', description: 'Sifre', example: '123456' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', description: 'JWT Token' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                phoneNumber: { type: 'string' },
                role: { type: 'string', enum: ['customer', 'provider', 'admin'] },
              },
            },
          },
        },
        RegisterCustomerRequest: {
          type: 'object',
          required: ['name', 'email', 'password', 'phoneNumber'],
          properties: {
            name: { type: 'string', example: 'Ahmet Yilmaz' },
            email: { type: 'string', example: 'ahmet@mail.com' },
            password: { type: 'string', example: '123456' },
            phoneNumber: { type: 'string', example: '05551234567' },
          },
        },
        RegisterProviderRequest: {
          type: 'object',
          required: ['name', 'email', 'password', 'companyName', 'phoneNumber', 'taxCertificate'],
          properties: {
            name: { type: 'string', example: 'Mehmet Demir' },
            email: { type: 'string', example: 'mehmet@firma.com' },
            password: { type: 'string', example: '123456' },
            companyName: { type: 'string', example: 'Demir Nakliyat' },
            phoneNumber: { type: 'string', example: '05559876543' },
            services: { type: 'string', description: 'JSON array string', example: '["nakliyat","temizlik"]' },
            taxCertificate: { type: 'string', format: 'binary', description: 'Vergi levhasi dosyasi' },
          },
        },
        ForgotPasswordRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', example: 'kullanici@mail.com' },
          },
        },
        ResetPasswordRequest: {
          type: 'object',
          required: ['newPassword'],
          properties: {
            newPassword: { type: 'string', example: 'yeniSifre123', minLength: 6 },
          },
        },
        // ===== OTP =====
        SendOTPRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', example: 'kullanici@mail.com' },
          },
        },
        VerifyOTPRequest: {
          type: 'object',
          required: ['email', 'otp'],
          properties: {
            email: { type: 'string', example: 'kullanici@mail.com' },
            otp: { type: 'string', example: '123456' },
          },
        },
        // ===== REQUEST =====
        CreateRequestBody: {
          type: 'object',
          required: ['title', 'description', 'category'],
          properties: {
            title: { type: 'string', example: 'Ev tasima' },
            description: { type: 'string', example: 'Istanbul Kadikoy den Besiktas a tasima' },
            category: { type: 'string', example: 'nakliyat' },
          },
        },
        // ===== PROPOSAL =====
        CreateProposalBody: {
          type: 'object',
          required: ['requestId', 'price', 'message'],
          properties: {
            requestId: { type: 'string' },
            price: { type: 'number', example: 2500 },
            message: { type: 'string', example: 'Hizmetiniz icin teklif sunuyorum.' },
          },
        },
        // ===== REVIEW =====
        CreateReviewBody: {
          type: 'object',
          required: ['providerId', 'rating', 'comment'],
          properties: {
            providerId: { type: 'string' },
            rating: { type: 'number', minimum: 1, maximum: 5, example: 5 },
            comment: { type: 'string', example: 'Cok basarili bir hizmet.' },
          },
        },
        // ===== WALLET =====
        PurchaseCreditsBody: {
          type: 'object',
          required: ['packageId'],
          properties: {
            packageId: { type: 'string', description: 'Kredi paketi ID' },
          },
        },
        // ===== AI =====
        ChatbotRequest: {
          type: 'object',
          required: ['message'],
          properties: {
            message: { type: 'string', example: 'Nakliyat fiyatlari nedir?' },
          },
        },
        // ===== COMMON =====
        SuccessMessage: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        ErrorMessage: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Kimlik dogrulama islemleri' },
      { name: 'Phone/OTP', description: 'E-posta dogrulama (OTP)' },
      { name: 'Requests', description: 'Hizmet talepleri' },
      { name: 'Proposals', description: 'Teklifler ve mesajlasma' },
      { name: 'Providers', description: 'Hizmet veren islemleri' },
      { name: 'Reviews', description: 'Degerlendirmeler' },
      { name: 'Wallet', description: 'Kredi ve odeme islemleri' },
      { name: 'Profile', description: 'Profil yonetimi' },
      { name: 'AI', description: 'Yapay zeka servisleri' },
      { name: 'Admin', description: 'Yonetici islemleri' },
    ],
    // ===== PATHS =====
    paths: {
      // ==================== AUTH ====================
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Giris yap',
          description: 'E-posta veya telefon ile giris yapar, JWT token doner.',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { '$ref': '#/components/schemas/LoginRequest' } } },
          },
          responses: {
            200: { description: 'Basarili giris', content: { 'application/json': { schema: { '$ref': '#/components/schemas/LoginResponse' } } } },
            400: { description: 'Hatali sifre' },
            404: { description: 'Kullanici bulunamadi' },
          },
        },
      },
      '/api/auth/register/customer': {
        post: {
          tags: ['Auth'],
          summary: 'Musteri kayit',
          description: 'Yeni musteri hesabi olusturur.',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { '$ref': '#/components/schemas/RegisterCustomerRequest' } } },
          },
          responses: {
            201: { description: 'Kayit basarili' },
            400: { description: 'E-posta zaten kullanimda' },
          },
        },
      },
      '/api/auth/register/provider': {
        post: {
          tags: ['Auth'],
          summary: 'Hizmet veren kayit',
          description: 'Yeni hizmet veren hesabi olusturur. Vergi levhasi dosyasi zorunludur.',
          requestBody: {
            required: true,
            content: { 'multipart/form-data': { schema: { '$ref': '#/components/schemas/RegisterProviderRequest' } } },
          },
          responses: {
            201: { description: 'Kayit basarili, onay bekleniyor' },
            400: { description: 'E-posta zaten kullanimda veya dosya eksik' },
          },
        },
      },
      '/api/auth/forgot-password': {
        post: {
          tags: ['Auth'],
          summary: 'Sifremi unuttum',
          description: 'Sifre sifirlama baglantisi e-posta adresine gonderilir.',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { '$ref': '#/components/schemas/ForgotPasswordRequest' } } },
          },
          responses: {
            200: { description: 'Sifirlama linki gonderildi' },
            404: { description: 'Kullanici bulunamadi' },
          },
        },
      },
      '/api/auth/reset-password/{token}': {
        post: {
          tags: ['Auth'],
          summary: 'Sifre sifirla',
          description: 'Token ile yeni sifre belirler.',
          parameters: [{ name: 'token', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { '$ref': '#/components/schemas/ResetPasswordRequest' } } },
          },
          responses: {
            200: { description: 'Sifre guncellendi' },
            400: { description: 'Gecersiz veya suresi dolmus token' },
          },
        },
      },
      // ==================== PHONE/OTP ====================
      '/api/phone/send-otp': {
        post: {
          tags: ['Phone/OTP'],
          summary: 'OTP gonder',
          description: 'E-posta adresine dogrulama kodu gonderir.',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { '$ref': '#/components/schemas/SendOTPRequest' } } },
          },
          responses: {
            200: { description: 'OTP gonderildi' },
            400: { description: 'Gecersiz e-posta' },
          },
        },
      },
      '/api/phone/verify-otp': {
        post: {
          tags: ['Phone/OTP'],
          summary: 'OTP dogrula',
          description: 'Girilen OTP kodunu dogrular.',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { '$ref': '#/components/schemas/VerifyOTPRequest' } } },
          },
          responses: {
            200: { description: 'Dogrulama basarili' },
            400: { description: 'Gecersiz veya suresi dolmus OTP' },
          },
        },
      },
      // ==================== REQUESTS ====================
      '/api/requests/create': {
        post: {
          tags: ['Requests'],
          summary: 'Hizmet talebi olustur',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { '$ref': '#/components/schemas/CreateRequestBody' } } },
          },
          responses: {
            201: { description: 'Talep olusturuldu' },
            401: { description: 'Yetkisiz erisim' },
          },
        },
      },
      '/api/requests/active': {
        get: {
          tags: ['Requests'],
          summary: 'Aktif talepleri listele',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Aktif talepler listesi' },
            401: { description: 'Yetkisiz erisim' },
          },
        },
      },
      // ==================== PROPOSALS ====================
      '/api/proposals/create': {
        post: {
          tags: ['Proposals'],
          summary: 'Teklif olustur',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { '$ref': '#/components/schemas/CreateProposalBody' } } },
          },
          responses: {
            201: { description: 'Teklif olusturuldu' },
            401: { description: 'Yetkisiz erisim' },
          },
        },
      },
      '/api/proposals/{id}/reply': {
        post: {
          tags: ['Proposals'],
          summary: 'Teklife yanit ver',
          description: 'Resim destekli mesaj gonderilebilir.',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: { 'multipart/form-data': { schema: { type: 'object', properties: { message: { type: 'string' }, image: { type: 'string', format: 'binary' } } } } },
          },
          responses: {
            200: { description: 'Yanit gonderildi' },
          },
        },
      },
      '/api/proposals/customer/{customerId}': {
        get: {
          tags: ['Proposals'],
          summary: 'Musteri tekliflerini getir',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'customerId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Teklif listesi' } },
        },
      },
      '/api/proposals/provider/{providerId}': {
        get: {
          tags: ['Proposals'],
          summary: 'Hizmet veren tekliflerini getir',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'providerId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Teklif listesi' } },
        },
      },
      '/api/proposals/{id}/status': {
        patch: {
          tags: ['Proposals'],
          summary: 'Teklif durumunu guncelle',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', enum: ['accepted', 'rejected', 'completed'] } } } } },
          },
          responses: { 200: { description: 'Durum guncellendi' } },
        },
      },
      // ==================== PROVIDERS ====================
      '/api/providers/approved': {
        get: {
          tags: ['Providers'],
          summary: 'Onayli hizmet verenleri listele',
          description: 'Herkese acik endpoint.',
          responses: { 200: { description: 'Onayli hizmet veren listesi' } },
        },
      },
      '/api/providers/showcase': {
        get: {
          tags: ['Providers'],
          summary: 'Vitrin bilgilerini getir',
          description: 'Herkese acik endpoint.',
          responses: { 200: { description: 'Vitrin verileri' } },
        },
      },
      '/api/providers/update-services': {
        put: {
          tags: ['Providers'],
          summary: 'Hizmetleri guncelle',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', properties: { services: { type: 'array', items: { type: 'string' } } } } } },
          },
          responses: { 200: { description: 'Hizmetler guncellendi' } },
        },
      },
      '/api/providers/update-profile': {
        put: {
          tags: ['Providers'],
          summary: 'Profil bilgilerini guncelle',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Profil guncellendi' } },
        },
      },
      // ==================== REVIEWS ====================
      '/api/reviews/create': {
        post: {
          tags: ['Reviews'],
          summary: 'Degerlendirme olustur',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { '$ref': '#/components/schemas/CreateReviewBody' } } },
          },
          responses: { 201: { description: 'Degerlendirme olusturuldu' } },
        },
      },
      '/api/reviews/provider/{providerId}': {
        get: {
          tags: ['Reviews'],
          summary: 'Hizmet veren degerlendirmelerini getir',
          parameters: [{ name: 'providerId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Degerlendirme listesi' } },
        },
      },
      // ==================== WALLET ====================
      '/api/wallet/packages': {
        get: {
          tags: ['Wallet'],
          summary: 'Kredi paketlerini listele',
          description: 'Herkese acik endpoint.',
          responses: { 200: { description: 'Kredi paket listesi' } },
        },
      },
      '/api/wallet/purchase': {
        post: {
          tags: ['Wallet'],
          summary: 'Kredi satin al',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { '$ref': '#/components/schemas/PurchaseCreditsBody' } } },
          },
          responses: { 200: { description: 'Satin alma basarili' } },
        },
      },
      '/api/wallet/balance/{providerId}': {
        get: {
          tags: ['Wallet'],
          summary: 'Bakiye sorgula',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'providerId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Bakiye bilgisi' } },
        },
      },
      '/api/wallet/transactions/{providerId}': {
        get: {
          tags: ['Wallet'],
          summary: 'Islem gecmisini getir',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'providerId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Islem gecmisi' } },
        },
      },
      // ==================== PROFILE ====================
      '/api/profile/upload-image': {
        post: {
          tags: ['Profile'],
          summary: 'Profil resmi yukle',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'multipart/form-data': { schema: { type: 'object', properties: { image: { type: 'string', format: 'binary' } } } } },
          },
          responses: { 200: { description: 'Resim yuklendi' } },
        },
      },
      '/api/profile/change-password': {
        put: {
          tags: ['Profile'],
          summary: 'Sifre degistir',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', required: ['currentPassword', 'newPassword'], properties: { currentPassword: { type: 'string' }, newPassword: { type: 'string', minLength: 6 } } } } },
          },
          responses: { 200: { description: 'Sifre degistirildi' } },
        },
      },
      // ==================== AI ====================
      '/api/ai/generate-proposal': {
        post: {
          tags: ['AI'],
          summary: 'AI ile teklif olustur',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'AI teklif metni' } },
        },
      },
      '/api/ai/estimate-price': {
        post: {
          tags: ['AI'],
          summary: 'AI ile fiyat tahmini',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Tahmini fiyat' } },
        },
      },
      '/api/ai/enhance-request': {
        post: {
          tags: ['AI'],
          summary: 'AI ile talep iyilestirme',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Iyilestirilmis talep metni' } },
        },
      },
      '/api/ai/match-score': {
        post: {
          tags: ['AI'],
          summary: 'AI eslesme skoru',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Eslesme skoru' } },
        },
      },
      '/api/ai/chatbot': {
        post: {
          tags: ['AI'],
          summary: 'Chatbot',
          description: 'Herkese acik chatbot endpoint.',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { '$ref': '#/components/schemas/ChatbotRequest' } } },
          },
          responses: { 200: { description: 'Chatbot yaniti' } },
        },
      },
      '/api/ai/insights': {
        get: {
          tags: ['AI'],
          summary: 'Admin icgoruleri',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'AI icgoru verileri' } },
        },
      },
      // ==================== ADMIN ====================
      '/api/admin/stats': {
        get: {
          tags: ['Admin'],
          summary: 'Istatistikleri getir',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Admin istatistikleri' } },
        },
      },
      '/api/admin/providers/pending': {
        get: {
          tags: ['Admin'],
          summary: 'Onay bekleyen hizmet verenler',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Bekleyen hizmet veren listesi' } },
        },
      },
      '/api/admin/providers/approve/{id}': {
        put: {
          tags: ['Admin'],
          summary: 'Hizmet vereni onayla',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Onaylandi' } },
        },
      },
      '/api/admin/providers/reject/{id}': {
        delete: {
          tags: ['Admin'],
          summary: 'Hizmet vereni reddet/sil',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Reddedildi/Silindi' } },
        },
      },
      '/api/admin/providers/approved': {
        get: {
          tags: ['Admin'],
          summary: 'Tum onayli hizmet verenler',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Onayli hizmet veren listesi' } },
        },
      },
      '/api/admin/customers': {
        get: {
          tags: ['Admin'],
          summary: 'Tum musteriler',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Musteri listesi' } },
        },
      },
      '/api/admin/customers/{id}': {
        delete: {
          tags: ['Admin'],
          summary: 'Musteriyi sil',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Musteri silindi' } },
        },
      },
      '/api/admin/transactions': {
        get: {
          tags: ['Admin'],
          summary: 'Tum islemler',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Islem listesi' } },
        },
      },
      '/api/admin/service-requests': {
        get: {
          tags: ['Admin'],
          summary: 'Tum hizmet talepleri',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Hizmet talep listesi' } },
        },
      },
      '/api/admin/service-requests/{id}': {
        delete: {
          tags: ['Admin'],
          summary: 'Hizmet talebini sil',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Talep silindi' } },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
