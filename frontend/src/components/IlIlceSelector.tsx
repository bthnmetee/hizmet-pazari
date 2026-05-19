import { useState, useRef, useEffect, useCallback } from 'react';
import { TURKIYE_ILLERI, normalizeText } from '../data/turkiyeIlIlce';

interface Props {
  label: string;
  selectedIl: string;
  selectedIlce: string;
  onIlChange: (il: string) => void;
  onIlceChange: (ilce: string) => void;
}

export default function IlIlceSelector({ label, selectedIl, selectedIlce, onIlChange, onIlceChange }: Props) {
  const [ilSearch, setIlSearch] = useState('');
  const [ilceSearch, setIlceSearch] = useState('');
  const [ilOpen, setIlOpen] = useState(false);
  const [ilceOpen, setIlceOpen] = useState(false);
  const ilRef = useRef<HTMLDivElement>(null);
  const ilceRef = useRef<HTMLDivElement>(null);

  // Dışarı tıklayınca kapat
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ilRef.current && !ilRef.current.contains(e.target as Node)) setIlOpen(false);
      if (ilceRef.current && !ilceRef.current.contains(e.target as Node)) setIlceOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredIller = useCallback(() => {
    if (!ilSearch.trim()) return TURKIYE_ILLERI;
    const q = normalizeText(ilSearch);
    return TURKIYE_ILLERI.filter(i => normalizeText(i.il).includes(q));
  }, [ilSearch]);

  const currentIlceler = useCallback(() => {
    const found = TURKIYE_ILLERI.find(i => i.il === selectedIl);
    if (!found) return [];
    if (!ilceSearch.trim()) return found.ilceler;
    const q = normalizeText(ilceSearch);
    return found.ilceler.filter(ilce => normalizeText(ilce).includes(q));
  }, [selectedIl, ilceSearch]);

  const handleIlSelect = (il: string) => {
    onIlChange(il);
    onIlceChange('');
    setIlSearch('');
    setIlOpen(false);
    setIlceSearch('');
  };

  const handleIlceSelect = (ilce: string) => {
    onIlceChange(ilce);
    setIlceSearch('');
    setIlceOpen(false);
  };

  const clearSelection = () => {
    onIlChange('');
    onIlceChange('');
    setIlSearch('');
    setIlceSearch('');
  };

  return (
    <div className="space-y-3">
      <label className="text-xs font-bold text-navy-300 ml-1 uppercase tracking-wider">{label}</label>

      {/* Seçili Chip */}
      {selectedIl && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy-500/10 text-navy-600 text-sm font-bold rounded-lg border border-navy-500/20">
            📍 {selectedIlce ? `${selectedIlce}, ${selectedIl}` : selectedIl}
            <button type="button" onClick={clearSelection} className="text-navy-300 hover:text-red-400 transition-colors ml-1 text-xs font-black">✕</button>
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* İL SEÇİCİ */}
        <div ref={ilRef} className="relative">
          <input
            type="text"
            placeholder={selectedIl || 'İl seçin...'}
            value={ilOpen ? ilSearch : ''}
            onFocus={() => { setIlOpen(true); setIlSearch(''); }}
            onChange={(e) => setIlSearch(e.target.value)}
            className={`w-full px-4 py-3 bg-white border rounded-xl text-sm font-bold focus:outline-none transition-all ${selectedIl ? 'border-navy-500/30 text-navy-900 placeholder:text-navy-600' : 'border-navy-100 text-navy-900 placeholder:text-navy-300'} ${ilOpen ? 'border-navy-500 ring-2 ring-navy-500/10' : 'focus:border-navy-500'}`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-300 text-xs pointer-events-none">{ilOpen ? '▲' : '▼'}</span>

          {ilOpen && (
            <div className="absolute z-50 top-full mt-1 w-full bg-white border border-navy-100 rounded-xl shadow-xl shadow-navy-800/10 max-h-56 overflow-y-auto animate-fade-in-up">
              {filteredIller().length === 0 ? (
                <div className="px-4 py-3 text-sm text-navy-300 text-center font-medium">Sonuç bulunamadı</div>
              ) : filteredIller().map(item => (
                <button
                  key={item.il}
                  type="button"
                  onClick={() => handleIlSelect(item.il)}
                  className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors hover:bg-navy-50 ${selectedIl === item.il ? 'bg-navy-500/10 text-navy-600' : 'text-navy-900'}`}
                >
                  {item.il}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* İLÇE SEÇİCİ */}
        <div ref={ilceRef} className="relative">
          <input
            type="text"
            placeholder={selectedIlce || (selectedIl ? 'İlçe seçin...' : 'Önce il seçin')}
            value={ilceOpen ? ilceSearch : ''}
            disabled={!selectedIl}
            onFocus={() => { if (selectedIl) { setIlceOpen(true); setIlceSearch(''); } }}
            onChange={(e) => setIlceSearch(e.target.value)}
            className={`w-full px-4 py-3 bg-white border rounded-xl text-sm font-bold focus:outline-none transition-all ${!selectedIl ? 'bg-navy-50/30 border-navy-100 text-navy-200 cursor-not-allowed' : selectedIlce ? 'border-navy-500/30 text-navy-900 placeholder:text-navy-600' : 'border-navy-100 text-navy-900 placeholder:text-navy-300'} ${ilceOpen ? 'border-navy-500 ring-2 ring-navy-500/10' : 'focus:border-navy-500'}`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-300 text-xs pointer-events-none">{!selectedIl ? '—' : ilceOpen ? '▲' : '▼'}</span>

          {ilceOpen && selectedIl && (
            <div className="absolute z-50 top-full mt-1 w-full bg-white border border-navy-100 rounded-xl shadow-xl shadow-navy-800/10 max-h-56 overflow-y-auto animate-fade-in-up">
              {currentIlceler().length === 0 ? (
                <div className="px-4 py-3 text-sm text-navy-300 text-center font-medium">Sonuç bulunamadı</div>
              ) : currentIlceler().map(ilce => (
                <button
                  key={ilce}
                  type="button"
                  onClick={() => handleIlceSelect(ilce)}
                  className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors hover:bg-navy-50 ${selectedIlce === ilce ? 'bg-navy-500/10 text-navy-600' : 'text-navy-900'}`}
                >
                  {ilce}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
