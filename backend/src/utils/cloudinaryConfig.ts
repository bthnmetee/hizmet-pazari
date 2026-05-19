import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

// ✅ require yerine tip-güvenli multer import
import multer from 'multer';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'hizmet_pazari',
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
    public_id: (_req: any, file: any) =>
      `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname.replace(/\s+/g, '-')}`,
  } as any,
});

export const uploadCloud = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // ✅ Maksimum 5MB dosya boyutu
});