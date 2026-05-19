
const categories = [
  { title: 'Ev Temizliği', icon: '🧹', bg: 'bg-sky-50', border: 'hover:border-sky-200' },
  { title: 'Su Tesisatı', icon: '🔧', bg: 'bg-navy-50', border: 'hover:border-navy-200' },
  { title: 'Elektrik İşleri', icon: '💡', bg: 'bg-amber-50', border: 'hover:border-amber-200' },
  { title: 'Boya & Badana', icon: '🖌️', bg: 'bg-indigo-50', border: 'hover:border-indigo-200' },
  { title: 'Özel Ders', icon: '📚', bg: 'bg-emerald-50', border: 'hover:border-emerald-200' },
  { title: 'Nakliyat', icon: '🚛', bg: 'bg-rose-50', border: 'hover:border-rose-200' },
  { title: 'Bilgisayar Tamiri', icon: '💻', bg: 'bg-cyan-50', border: 'hover:border-cyan-200' },
  { title: 'Kurye', icon: '📦', bg: 'bg-gold-50', border: 'hover:border-gold-200' },
];

export default function FeaturedServices() {
  return (
    <section className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between mb-20">
          <h2 className="text-4xl md:text-5xl font-extrabold text-navy-900 tracking-tighter">Öne Çıkan Hizmetler</h2>
          <a href="#" className="hidden md:flex text-lg font-semibold text-navy-600 hover:text-navy-800 items-center gap-1.5 group">
            Tümünü Gör <span className="transition-transform group-hover:translate-x-1">→</span>
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10">
          {categories.map((category, index) => (
            <a href="#" key={index} className={`group border border-navy-100 rounded-3xl p-10 bg-white shadow-sm transition-all duration-300 hover:bg-white hover:shadow-2xl hover:-translate-y-2 ${category.border}`}>
              <div className={`text-6xl mb-10 text-center ${category.bg} w-28 h-28 rounded-full flex items-center justify-center mx-auto shadow-inner transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12`}>
                {category.icon}
              </div>
              <h3 className="text-2xl font-semibold text-navy-900 text-center group-hover:text-navy-700 tracking-tight transition-colors">
                {category.title}
              </h3>
              <p className="text-base text-navy-400 text-center mt-3 font-medium">Uzmanları Listele <span className="opacity-0 transition-opacity group-hover:opacity-100">→</span></p>
            </a>
          ))}
        </div>
        
        {/* Mobil için Tümünü Gör butonu */}
        <div className="mt-12 text-center md:hidden">
            <a href="#" className="inline-flex text-lg font-semibold text-navy-600 hover:text-navy-800 items-center gap-1.5 group">
                Tümünü Gör <span className="transition-transform group-hover:translate-x-1">→</span>
            </a>
        </div>
      </div>
    </section>
  );
}
