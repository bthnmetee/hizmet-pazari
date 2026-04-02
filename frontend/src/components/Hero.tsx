import React from 'react';
import './Hero.css';

export default function Hero() {
  return (
    <section className="relative bg-blue-950 text-white py-40 md:py-48 overflow-hidden">
      {/* Dinamik Arka Plan Öğeleri */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="animate-float-water w-20 h-20 absolute top-10 left-[10%] opacity-80 text-6xl">💧</div>
        <div className="animate-spin-gear w-32 h-32 absolute top-[60%] right-[15%] opacity-50 text-7xl">⚙️</div>
        <div className="animate-float-bulb w-16 h-16 absolute top-[15%] left-[75%] opacity-70 text-6xl">💡</div>
        <div className="animate-float-water w-12 h-12 absolute top-[40%] right-[5%] opacity-90 text-4xl">💧</div>
      </div>

      <div className="max-w-7xl mx-auto px-6 text-center flex flex-col items-center relative z-10">
        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tighter mb-10 animate-fade-in-up">
          Güvenilir Yerel Hizmet Sağlayıcıları<br /> <span className="text-blue-300">Anında Keşfedin</span>
        </h1>
        <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mb-20 font-light animate-fade-in-up animation-delay-300">
          Güvenilir profesyonellerden anında teklif alın veya randevu oluşturun. Tesisat, temizlik, eğitim, nakliyat ve daha fazlası...
        </p>

        <div className="w-full max-w-4xl bg-white rounded-full shadow-2xl p-3 flex flex-col md:flex-row items-center gap-2 border border-blue-900/10 transition-all duration-500 hover:scale-[1.03] animate-fade-in-up animation-delay-600">
          <span className="hidden md:block text-slate-400 text-3xl pl-5">🔍</span>
          <input
            type="text"
            placeholder="İhtiyacınız olan hizmeti buraya yazın..."
            className="w-full md:flex-1 px-5 py-4 md:py-5 text-xl md:text-2xl text-slate-900 rounded-full focus:outline-none placeholder:text-slate-400 text-center md:text-left"
          />
          <button className="w-full md:w-auto bg-blue-600 text-white px-10 md:px-16 py-4 md:py-5 rounded-full font-bold text-xl md:text-2xl transition-all duration-300 hover:bg-blue-700 hover:shadow-lg hover:scale-105 whitespace-nowrap active:scale-95 mt-2 md:mt-0">
            Hizmet Bul
          </button>
        </div>
      </div>
    </section>
  );
}