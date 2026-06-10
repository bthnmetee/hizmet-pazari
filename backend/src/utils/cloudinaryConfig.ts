import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

// ✅ require yerine tip-güvenli multer import
import multer from 'multer';

dotenv.config();

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);
const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY?.trim();
const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

cloudinary.config({
  cloud_name: cloudinaryCloudName,
  api_key: cloudinaryApiKey,
  api_secret: cloudinaryApiSecret,
});

const ensureCloudinaryConfig = () => {
  if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
    throw createUploadError(
      'Cloudinary ayarlari eksik. CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY ve CLOUDINARY_API_SECRET tanimlanmalidir.',
      500
    );
  }
};

const getFileExtension = (file: Express.Multer.File) => {
  const parts = file.originalname.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
};

const isImageFile = (file: Express.Multer.File) => {
  const extension = getFileExtension(file);
  return IMAGE_MIME_TYPES.has(file.mimetype) || IMAGE_EXTENSIONS.has(extension);
};

const isPdfFile = (file: Express.Multer.File) => {
  return file.mimetype === 'application/pdf' || getFileExtension(file) === 'pdf';
};

const getPublicId = (file: Express.Multer.File) => {
  const extension = getFileExtension(file);
  const originalName = extension
    ? file.originalname.slice(0, -(extension.length + 1))
    : file.originalname;
  const sanitizedName = originalName
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}-${sanitizedName || 'file'}`;
};

const createUploadError = (message: string, statusCode = 400) => {
  const error = new Error(message) as Error & { statusCode?: number };
  error.statusCode = statusCode;
  return error;
};

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (file.fieldname === 'taxCertificate') {
    if (isImageFile(file) || isPdfFile(file)) return cb(null, true);
    return cb(createUploadError('Vergi levhasi JPG, PNG, WEBP veya PDF formatinda olmalidir.'));
  }

  if (file.fieldname === 'image') {
    if (isImageFile(file)) return cb(null, true);
    return cb(createUploadError('Sadece JPG, PNG veya WEBP formatinda gorsel yukleyebilirsiniz.'));
  }

  return cb(createUploadError(`Beklenmeyen dosya alani: ${file.fieldname}`));
};

const storage = new CloudinaryStorage({
  cloudinary,
  params: ((_req: any, file: Express.Multer.File) => {
    ensureCloudinaryConfig();

    return {
      folder: 'hizmet_pazari',
      resource_type: isPdfFile(file) ? 'raw' : 'image',
      public_id: getPublicId(file),
    };
  }) as any,
});

export const uploadCloud = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
});

export const getUploadErrorResponse = (error: any) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return {
      statusCode: 400,
      message: 'Dosya boyutu 5MB limitini asamaz.',
    };
  }

  if (typeof error?.message === 'string' && error.message.toLowerCase().includes('invalid api_key')) {
    return {
      statusCode: 500,
      message: 'Cloudinary API bilgileri gecersiz. CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY ve CLOUDINARY_API_SECRET degerlerini kontrol edin.',
    };
  }

  if (typeof error?.message === 'string' && error.message.toLowerCase().includes('invalid signature')) {
    return {
      statusCode: 500,
      message: 'Cloudinary API secret gecersiz. CLOUDINARY_API_KEY ve CLOUDINARY_API_SECRET ayni Cloudinary hesabindan olmali.',
    };
  }

  return {
    statusCode: error?.statusCode || 500,
    message: error?.message || 'Dosya yukleme sirasinda hata olustu.',
  };
};
