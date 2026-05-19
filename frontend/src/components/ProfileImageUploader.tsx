import { useState, useRef } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { useAuth } from '../context/AuthContext';

interface ProfileImageUploaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  editable?: boolean;
}

const sizeMap = {
  sm: { container: 'w-10 h-10', text: 'text-sm', icon: 'w-4 h-4' },
  md: { container: 'w-16 h-16', text: 'text-xl', icon: 'w-5 h-5' },
  lg: { container: 'w-28 h-28', text: 'text-3xl', icon: 'w-7 h-7' },
};

/**
 * Profil Resmi Yükleyici Bileşeni
 * Yuvarlak avatar, hover'da kamera ikonu, dosya yükleme
 */
export default function ProfileImageUploader({ size = 'md', className = '', editable = true }: ProfileImageUploaderProps) {
  const { user, updateUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const sizes = sizeMap[size];
  const profileImage = previewUrl || user?.profileImage;
  const initial = user?.companyName?.charAt(0) || user?.name?.charAt(0) || '?';

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Boyut kontrolü (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('❌ Dosya boyutu 5MB\'den küçük olmalıdır.');
      return;
    }

    // Format kontrolü
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      alert('❌ Sadece JPG, PNG ve WEBP formatları desteklenir.');
      return;
    }

    // Önizleme
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Yükleme
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('userId', user?.id || '');
      formData.append('role', user?.role || '');

      const res = await axiosInstance.post('/profile/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.profileImage) {
        updateUser({ profileImage: res.data.profileImage });
        setPreviewUrl(null); // Artık user state'inden gelecek
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Profil resmi yüklenemedi.');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className={`relative group inline-block ${className}`}>
      {/* Avatar */}
      <div className={`${sizes.container} rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-lg transition-all duration-300 ${
        profileImage
          ? 'ring-2 ring-navy-500/20 ring-offset-2 ring-offset-white'
          : 'bg-gradient-to-br from-navy-700 to-navy-900'
      }`}>
        {profileImage ? (
          <img
            src={profileImage}
            alt="Profil"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className={`${sizes.text} font-black text-white uppercase select-none`}>
            {initial}
          </span>
        )}

        {/* Yükleme animasyonu */}
        {uploading && (
          <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
            <svg className={`${sizes.icon} animate-spin text-white`} viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}
      </div>

      {/* Hover overlay — sadece editable ise */}
      {editable && !uploading && (
        <button
          onClick={() => fileRef.current?.click()}
          className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/50 flex items-center justify-center transition-all duration-300 cursor-pointer"
        >
          <svg className={`${sizes.icon} text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      )}

      {/* Gizli dosya input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
