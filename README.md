# Hizmet Pazarı — Türkiye'nin Güvenilir Hizmet Platformu

Nakliyat, temizlik, tadilat, yazılım ve daha fazlası için profesyonellerden teklif alın.

## 🏗️ Proje Yapısı

```
Hizmet-Pazarı.net/
├── backend/          # Express.js + TypeScript API
│   ├── src/
│   │   ├── controllers/    # İş mantığı
│   │   ├── middlewares/    # JWT doğrulama, yetkilendirme
│   │   ├── models/         # Mongoose şemaları
│   │   ├── routes/         # API rotaları
│   │   ├── utils/          # Yardımcı modüller
│   │   └── index.ts        # Uygulama giriş noktası
│   └── .env.example        # Ortam değişkenleri şablonu
│
├── frontend/         # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── components/     # Yeniden kullanılabilir bileşenler
│   │   ├── pages/          # Sayfa bileşenleri
│   │   ├── context/        # React Context (Auth)
│   │   └── utils/          # Axios, içerik filtreleme
│   └── .env.example        # Ortam değişkenleri şablonu
│
└── README.md
```

## 🚀 Hızlı Başlangıç

### Gereksinimler
- **Node.js** >= 18.0.0
- **MongoDB** (Atlas veya yerel)
- **npm** veya **yarn**

### 1. Kurulum

```bash
# Backend
cd backend
cp .env.example .env     # .env dosyasını düzenleyin
npm install

# Frontend
cd ../frontend
cp .env.example .env     # .env dosyasını düzenleyin
npm install
```

### 2. Ortam Değişkenleri

**Backend `.env`** — Aşağıdaki değişkenleri doldurun:
| Değişken | Açıklama |
|----------|----------|
| `MONGO_URI` | MongoDB bağlantı URI'si |
| `JWT_SECRET` | Güçlü, rastgele bir anahtar (min 32 karakter) |
| `CORS_ORIGIN` | Frontend URL'i (prod: `https://hizmet-pazari.net`) |
| `FRONTEND_URL` | Frontend URL'i (şifre sıfırlama linkleri için) |
| `CLOUDINARY_*` | Cloudinary resim yükleme bilgileri |
| `SMTP_*` | Mailjet SMTP e-posta gönderim bilgileri |
| `ANTHROPIC_API_KEY` | AI özellikleri için (opsiyonel) |
| `ADMIN_EMAIL` | Admin yetkisi verilecek e-posta |

**Frontend `.env`**:
| Değişken | Açıklama |
|----------|----------|
| `VITE_API_URL` | Backend API URL'i (`https://api.hizmet-pazari.net/api`) |

### 3. Geliştirme Modu

```bash
# Backend (port 5000)
cd backend && npm run dev

# Frontend (port 5173)
cd frontend && npm run dev
```

### 4. Production Build

```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build && npm run preview
```

## 🌐 Deployment

### Seçenek A: Vercel (Frontend) + Railway/Render (Backend)

**Frontend → Vercel:**
1. Vercel'e bağlayın (`frontend/` dizini)
2. Build komutu: `npm run build`
3. Output dizini: `dist`
4. Ortam değişkeni: `VITE_API_URL`

**Backend → Railway/Render:**
1. Platformu bağlayın (`backend/` dizini)
2. Build komutu: `npm run build`
3. Start komutu: `npm start`
4. Tüm `.env` değişkenlerini platform üzerinden ekleyin

### Seçenek B: Tek Sunucu (VPS)

Backend, production modunda frontend'in build çıktısını (`frontend/dist`) otomatik olarak sunar:

```bash
# Tüm projeyi sunucuya yükleyin
cd frontend && npm run build
cd ../backend && npm run build
NODE_ENV=production npm start
```

## 🔐 Güvenlik Özellikleri

- ✅ **Helmet** — HTTP güvenlik başlıkları
- ✅ **CORS** — Kaynak paylaşım kontrolü
- ✅ **Rate Limiting** — Brute force koruması
- ✅ **JWT** — Token tabanlı kimlik doğrulama
- ✅ **bcrypt** — Şifre hashleme
- ✅ **Payload Limiti** — 10KB body size limiti
- ✅ **Graceful Shutdown** — Düzgün kapanış yönetimi

## 📋 API Rotaları

| Yol | Açıklama |
|-----|----------|
| `POST /api/auth/login` | Giriş yap |
| `POST /api/auth/register/customer` | Müşteri kaydı |
| `POST /api/auth/register/provider` | Hizmet veren kaydı |
| `POST /api/auth/forgot-password` | Şifre sıfırlama talebi |
| `GET /api/providers` | Profesyonelleri listele |
| `POST /api/requests` | Hizmet talebi oluştur |
| `POST /api/proposals` | Teklif gönder |
| `GET /api/admin/*` | Admin yönetim paneli |
| `POST /api/ai/*` | AI özellikleri |

## 📄 Lisans

ISC
