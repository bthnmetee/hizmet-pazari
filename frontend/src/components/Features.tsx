import React from 'react';

const featureList = [
  { icon: '✅', title: 'Güvenilir Profesyoneller', text: 'Onaylı ve değerlendirilmiş uzmanlarla çalışın. Her işin arkasındayız.' },
  { icon: '⚡', title: 'Hızlı ve Kolay', text: 'Dakikalar içinde teklif alın, rezervasyon yapın ve hizmetinizi planlayın.' },
  { icon: '💰', title: 'Şeffaf Fiyatlandırma', text: 'Beklenmedik maliyetler yok, en iyi teklifi seçin ve güvenle ödeme yapın.' },
];

export default function Features() {
  return (
    <section className="py-28 bg-slate-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-5xl font-extrabold text-blue-950 tracking-tighter mb-5">Neden Hizmet Platformu?</h2>
          <p className="text-xl md:text-2xl text-slate-600 font-light max-w-3xl mx-auto">Gelişmiş kuluçka sürecimizle yerel hizmet deneyimini mükemmelleştiriyoruz.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-16 text-center">
          {featureList.map((feature, index) => (
            <div key={index} className="bg-white p-14 rounded-3xl shadow-lg border border-slate-100 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 hover:border-blue-100 group">
              <div className="text-6xl text-blue-600 mb-10 bg-blue-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-inner transition-transform group-hover:rotate-12 group-hover:scale-110">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-semibold text-blue-950 mb-5 tracking-tight group-hover:text-blue-600">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed font-light text-lg">{feature.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}