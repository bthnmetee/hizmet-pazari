import { useState, type FormEvent } from 'react';
import axiosInstance from '../utils/axiosInstance';

interface PasswordChangeSettingsProps {
  userId: string;
  role: 'customer' | 'provider' | 'admin';
}

export default function PasswordChangeSettings({ userId, role }: PasswordChangeSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== newPasswordConfirm) {
      setError('Yeni şifreler eşleşmiyor.');
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.put('/profile/change-password', {
        userId,
        role,
        currentPassword,
        newPassword
      });
      setSuccess('Şifreniz başarıyla değiştirildi.');
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
      setTimeout(() => setIsEditing(false), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Şifre değiştirilirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = ({ show, onClick }: { show: boolean, onClick: () => void }) => (
    <button type="button" onClick={onClick} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none">
      {show ? (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )}
    </button>
  );

  if (!isEditing) {
    return (
      <div
        onClick={() => setIsEditing(true)}
        className="flex items-center justify-between py-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
      >
        <div>
          <h3 className="text-[15px] font-bold text-gray-900">Şifre değiştir</h3>
          <p className="text-[13px] text-gray-500 mt-0.5">Şifreni düzenle</p>
        </div>
        <div className="text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-full rounded-2xl w-full max-w-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 pt-2">
        <button onClick={() => setIsEditing(false)} className="text-gray-600 hover:text-gray-900 focus:outline-none">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-gray-900">Şifre değiştir</h2>
      </div>

      <div className="flex-1">
        <div className="mb-6">
          <h3 className="text-[15px] font-bold text-gray-900 mb-1">Şifre değiştir</h3>
          <p className="text-[13px] text-gray-500">Kimlik bilgilerini güncellemek için lütfen sırasıyla eski şifreni ve yeni şifreni gir.</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-[13px] rounded-lg">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-50 border border-green-100 text-green-600 text-[13px] rounded-lg">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Eski şifre */}
          <div>
            <label className="block text-[13px] font-bold text-gray-900 mb-1.5">Eski şifre</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                placeholder="Şifreni gir"
                required
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <EyeIcon show={showCurrent} onClick={() => setShowCurrent(!showCurrent)} />
            </div>
            <div className="mt-3">
              <a href="/forgot-password" target="_blank" className="text-[13px] font-bold text-gray-900 hover:underline">
                Şifremi bilmiyorum {'>'}{'>'}
              </a>
            </div>
          </div>

          <hr className="border-gray-100 my-8" />

          {/* Yeni şifre */}
          <div className="space-y-5">
            <div>
              <label className="block text-[13px] font-bold text-gray-900 mb-1.5">Yeni şifre</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  placeholder="Şifre gir"
                  required
                  minLength={6}
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <EyeIcon show={showNew} onClick={() => setShowNew(!showNew)} />
              </div>
            </div>

            {/* Yeni şifreni tekrarla */}
            <div>
              <label className="block text-[13px] font-bold text-gray-900 mb-1.5">Yeni şifreni tekrarla</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Yeni şifreni tekrarla"
                  required
                  minLength={6}
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                />
                <EyeIcon show={showConfirm} onClick={() => setShowConfirm(!showConfirm)} />
              </div>
            </div>
          </div>

          <div className="pt-8">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold text-[13px] rounded-lg transition-colors disabled:opacity-70"
            >
              {loading ? 'İşleniyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
