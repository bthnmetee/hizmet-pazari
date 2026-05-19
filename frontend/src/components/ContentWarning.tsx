import { useMemo } from 'react';
import { checkContent } from '../utils/contentFilter';

interface ContentWarningProps {
  text: string;
  className?: string;
}

/**
 * İçerik uyarı bileşeni — text alanlarının altına eklenir.
 * Kullanıcı yazarken gerçek zamanlı uyarı gösterir.
 */
export default function ContentWarning({ text, className = '' }: ContentWarningProps) {
  const result = useMemo(() => checkContent(text), [text]);

  if (!result.hasAnyIssue) return null;

  return (
    <div className={`mt-2 space-y-1.5 animate-fadeIn ${className}`}>
      {result.warnings.map((warning, idx) => (
        <div
          key={idx}
          className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm font-bold border transition-all duration-300"
          style={{
            background: warning.includes('🚫')
              ? 'rgba(239, 68, 68, 0.08)'
              : 'rgba(245, 158, 11, 0.08)',
            borderColor: warning.includes('🚫')
              ? 'rgba(239, 68, 68, 0.2)'
              : 'rgba(245, 158, 11, 0.2)',
            color: warning.includes('🚫')
              ? '#ef4444'
              : '#d97706',
          }}
        >
          <span className="shrink-0 mt-0.5 text-base animate-pulse">⚠️</span>
          <span className="leading-relaxed">{warning}</span>
        </div>
      ))}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.25s ease-out; }
      `}</style>
    </div>
  );
}
