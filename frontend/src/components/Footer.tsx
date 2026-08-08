import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-navy-900 text-navy-300 py-16 border-t border-navy-700/50 font-sans mt-auto">
      <div className="max-w-[1920px] mx-auto px-6 lg:px-10 grid grid-cols-1 md:grid-cols-4 gap-12">

        {/* ŞİRKET BİLGİSİ */}
        <div>
          <Link to="/" className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-navy-700 flex items-center justify-center text-white font-bold text-lg rounded-lg">HP</div>
            <span className="font-black text-xl tracking-tight text-white">Hizmet<span className="text-gold-500">Pazarı</span></span>
          </Link>
          <p className="font-medium leading-relaxed mb-6">Türkiye'nin en güvenilir kurumsal hizmet ağı. Sertifikalı profesyoneller ve şeffaf operasyon yönetimi ile yanınızdayız.</p>
          <p className="text-xs font-bold text-white tracking-widest uppercase mb-1">Operasyon Merkezi</p>
          <p className="text-2xl font-black text-gold-500">0850 XXX XX XX</p>
        </div>

        {/* KURUMSAL LİNKLER */}
        <div>
          <h4 className="text-white font-bold uppercase tracking-widest mb-6 border-b border-navy-700 pb-2">Kurumsal</h4>
          <ul className="space-y-3 font-medium">
            <li><Link to="#" className="hover:text-gold-400 transition-colors">Hakkımızda</Link></li>
            <li><Link to="#" className="hover:text-gold-400 transition-colors">Kalite Politikamız</Link></li>
            <li><Link to="#" className="hover:text-gold-400 transition-colors">Yatırımcı İlişkileri</Link></li>
            <li><Link to="#" className="hover:text-gold-400 transition-colors">İnsan Kaynakları</Link></li>
          </ul>
        </div>

        {/* HİZMETLER */}
        <div>
          <h4 className="text-white font-bold uppercase tracking-widest mb-6 border-b border-navy-700 pb-2">Hizmetlerimiz</h4>
          <ul className="space-y-3 font-medium">
            <li><Link to="/kategoriler" className="hover:text-gold-400 transition-colors">Tüm Kategoriler</Link></li>
            <li><Link to="/profesyoneller" className="hover:text-gold-400 transition-colors">Profesyoneller</Link></li>
            <li><Link to="/register" className="hover:text-gold-400 transition-colors">Hizmet Al</Link></li>
            <li><Link to="/register" className="hover:text-gold-400 transition-colors">Profesyonel Ol</Link></li>
          </ul>
        </div>

        {/* YASAL BİLGİLER */}
        <div>
          <h4 className="text-white font-bold uppercase tracking-widest mb-6 border-b border-navy-700 pb-2">Yasal Mevzuat</h4>
          <ul className="space-y-3 font-medium">
            <li><Link to="#" className="hover:text-gold-400 transition-colors">Kullanım Koşulları</Link></li>
            <li><Link to="#" className="hover:text-gold-400 transition-colors">Gizlilik Sözleşmesi</Link></li>
            <li><Link to="#" className="hover:text-gold-400 transition-colors">KVKK Aydınlatma Metni</Link></li>
            <li><Link to="#" className="hover:text-gold-400 transition-colors">Çerez Politikası</Link></li>
          </ul>
        </div>

      </div>

      {/* İŞ ORTAKLARI */}
      <div className="max-w-[1920px] mx-auto px-6 lg:px-10 mt-12 pt-8 border-t border-navy-700/50">
        <h4 className="text-white font-bold uppercase tracking-widest mb-4 text-sm">İş Ortaklarımız</h4>
        <div className="flex flex-wrap gap-4">
          <a
            href="https://www.globalevtasima.com.tr/istanbul-izmir-parca-esya-tasima"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 px-4 py-2 bg-navy-800 border border-navy-600/50 rounded-xl hover:border-gold-500/50 hover:bg-navy-700 transition-all duration-300 group"
          >
            <span className="w-8 h-8 bg-gold-500/15 rounded-lg flex items-center justify-center text-gold-400 text-sm group-hover:bg-gold-500/25 transition-colors">🚚</span>
            <div>
              <span className="text-white text-sm font-bold block group-hover:text-gold-400 transition-colors">Global Evden Eve Nakliyat</span>
              <span className="text-navy-400 text-xs font-medium">Sigortalı &amp; Profesyonel Taşımacılık</span>
            </div>
          </a>
        </div>
      </div>

      {/* TELİF VE SOSYAL MEDYA */}
      <div className="max-w-[1920px] mx-auto px-6 lg:px-10 mt-8 pt-8 border-t border-navy-700/50 text-sm font-medium flex flex-col md:flex-row justify-between items-center">
        <p>© 2026 Hizmet Pazarı. Tüm hakları saklıdır.</p>
        <div className="flex items-center gap-6">
          <a href="https://www.globalevtasima.com.tr" target="_blank" rel="noopener" className="hover:text-gold-400 transition-colors">Global Nakliyat</a>
          <div className="flex gap-4">
            <span className="w-10 h-10 bg-navy-700 rounded-lg flex items-center justify-center hover:bg-gold-500 text-white transition-colors cursor-pointer font-bold">in</span>
            <span className="w-10 h-10 bg-navy-700 rounded-lg flex items-center justify-center hover:bg-gold-500 text-white transition-colors cursor-pointer font-bold">tw</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
