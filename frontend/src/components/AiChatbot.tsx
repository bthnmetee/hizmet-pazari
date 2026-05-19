import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';

interface Message { role: 'user' | 'assistant'; content: string; links?: { label: string; url: string }[]; }

const QUICK_QUESTIONS = [
  { label: '🤔 Nasıl çalışır?', q: 'Platform nasıl çalışıyor?' },
  { label: '🛡️ Güvenli mi?', q: 'Güvenli mi?' },
  { label: '💰 Fiyatlar ne kadar?', q: 'Fiyatlar ne kadar?' },
  { label: '📝 Nasıl kayıt olunur?', q: 'Nasıl kayıt olabilirim?' },
];

export default function AiChatbot() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { const t = setTimeout(() => setPulse(false), 10000); return () => clearTimeout(t); }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await axiosInstance.post('/ai/chatbot', {
        message: text,
        history: messages.slice(-6)
      });
      const botMsg: Message = { role: 'assistant', content: res.data.reply, links: res.data.suggestedLinks };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Şu an yanıt veremiyorum, lütfen tekrar deneyin.' }]);
    }
    finally { setLoading(false); }
  };

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button onClick={() => { setOpen(true); setPulse(false); if (messages.length === 0) setMessages([{ role: 'assistant', content: 'Merhaba! 👋 Hizmet Pazarı hakkında size nasıl yardımcı olabilirim?' }]); }}
          className={`fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-navy-700 to-navy-900 rounded-2xl shadow-2xl shadow-navy-800/30 flex items-center justify-center text-2xl hover:scale-110 transition-all ${pulse ? 'animate-bounce' : 'hover:-translate-y-1'}`}>
          💬
          {pulse && <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold-500 rounded-full animate-ping" />}
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-3rem)] bg-white rounded-3xl shadow-2xl shadow-navy-800/20 border border-navy-100 flex flex-col overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-navy-800 to-navy-700 px-5 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl backdrop-blur-sm">🤖</div>
              <div>
                <p className="text-white font-black text-sm">HP Asistan</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-navy-200 text-xs font-medium">Çevrimiçi</span>
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white text-xl transition-colors">✕</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm font-medium ${msg.role === 'user' ? 'bg-navy-800 text-white rounded-br-sm' : 'bg-navy-50 text-navy-800 rounded-bl-sm border border-navy-100'}`}>
                  <p className="leading-relaxed">{msg.content}</p>
                  {msg.links && msg.links.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {msg.links.map((link, j) => (
                        <button key={j} onClick={() => { navigate(link.url); setOpen(false); }}
                          className="text-xs font-bold text-navy-600 bg-white px-3 py-1.5 rounded-lg border border-navy-200 hover:bg-navy-50 hover:border-navy-300 transition-all">
                          {link.label} →
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-navy-50 rounded-2xl rounded-bl-sm px-4 py-3 border border-navy-100">
                  <div className="flex gap-1.5">{[0, 1, 2].map(i => (<div key={i} className="w-2 h-2 bg-navy-300 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />))}</div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick Questions (only when few messages) */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {QUICK_QUESTIONS.map(q => (
                <button key={q.q} onClick={() => sendMessage(q.q)} className="text-xs font-bold text-navy-500 bg-navy-50 px-3 py-1.5 rounded-full border border-navy-100 hover:bg-navy-100 hover:border-navy-200 transition-all">
                  {q.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-navy-100 shrink-0">
            <div className="flex gap-2">
              <input type="text" placeholder="Bir soru sorun..." className="flex-1 px-4 py-3 bg-navy-50 border border-navy-100 rounded-xl text-sm font-medium text-navy-900 placeholder:text-navy-300 focus:outline-none focus:border-navy-400 transition-all"
                value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)} disabled={loading} />
              <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()}
                className="px-4 py-3 bg-navy-800 text-white rounded-xl font-bold text-sm hover:bg-navy-700 transition-all disabled:opacity-40 active:scale-95">
                ➤
              </button>
            </div>
            <p className="text-center text-[10px] text-navy-300 mt-2 font-medium">Hizmet Pazarı AI Asistan • 7/24</p>
          </div>
        </div>
      )}
    </>
  );
}
