import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-16 border-t-[8px] border-red-600 font-sans mt-auto">
      <div className="max-w-[1920px] mx-auto px-6 lg:px-10 grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* ŞİRKET BİLGİSİ */}
        <div>
          <Link to="/" className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-red-600 flex items-center justify-center text-white font-bold text-lg">C</div>
            <span className="font-black text-xl tracking-tight text-white">CORE<span className="text-red-600">PRO</span></span>
          </Link>
          <p className="font-medium leading-relaxed mb-6">Türkiye'nin en güvenilir kurumsal hizmet ağı. Sertifikalı profesyoneller ve şeffaf operasyon yönetimi ile yanınızdayız.</p>
          <p className="text-xs font-bold text-white tracking-widest uppercase mb-1">Operasyon Merkezi</p>
          <p className="text-2xl font-black text-red-500">0850 XXX XX XX</p>
        </div>

        {/* KURUMSAL LİNKLER */}
        <div>
          <h4 className="text-white font-bold uppercase tracking-widest mb-6 border-b border-gray-700 pb-2">Kurumsal</h4>
          <ul className="space-y-3 font-medium">
            <li><Link to="#" className="hover:text-white transition-colors">Hakkımızda</Link></li>
            <li><Link to="#" className="hover:text-white transition-colors">Kalite Politikamız</Link></li>
            <li><Link to="#" className="hover:text-white transition-colors">Yatırımcı İlişkileri</Link></li>
            <li><Link to="#" className="hover:text-white transition-colors">İnsan Kaynakları</Link></li>
          </ul>
        </div>

        {/* HİZMETLER */}
        <div>
          <h4 className="text-white font-bold uppercase tracking-widest mb-6 border-b border-gray-700 pb-2">Hizmetlerimiz</h4>
          <ul className="space-y-3 font-medium">
            <li><Link to="#" className="hover:text-white transition-colors">Kurumsal Lojistik</Link></li>
            <li><Link to="#" className="hover:text-white transition-colors">Tesis Yönetimi</Link></li>
            <li><Link to="#" className="hover:text-white transition-colors">Teknik Altyapı</Link></li>
            <li><Link to="#" className="hover:text-white transition-colors">Endüstriyel Temizlik</Link></li>
          </ul>
        </div>

        {/* YASAL BİLGİLER */}
        <div>
          <h4 className="text-white font-bold uppercase tracking-widest mb-6 border-b border-gray-700 pb-2">Yasal Mevzuat</h4>
          <ul className="space-y-3 font-medium">
            <li><Link to="#" className="hover:text-white transition-colors">Kullanım Koşulları</Link></li>
            <li><Link to="#" className="hover:text-white transition-colors">Gizlilik Sözleşmesi</Link></li>
            <li><Link to="#" className="hover:text-white transition-colors">KVKK Aydınlatma Metni</Link></li>
            <li><Link to="#" className="hover:text-white transition-colors">Çerez Politikası</Link></li>
          </ul>
        </div>

      </div>

      {/* TELİF VE SOSYAL MEDYA */}
      <div className="max-w-[1920px] mx-auto px-6 lg:px-10 mt-16 pt-8 border-t border-gray-800 text-sm font-medium flex flex-col md:flex-row justify-between items-center">
        <p>© 2026 CorePro Teknoloji A.Ş. Tüm hakları saklıdır.</p>
        <div className="flex gap-4 mt-4 md:mt-0">
          <span className="w-10 h-10 bg-gray-800 flex items-center justify-center hover:bg-red-600 text-white transition-colors cursor-pointer font-bold">in</span>
          <span className="w-10 h-10 bg-gray-800 flex items-center justify-center hover:bg-red-600 text-white transition-colors cursor-pointer font-bold">tw</span>
        </div>
      </div>
    </footer>
  );
}