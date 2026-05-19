/**
 * Frontend içerik filtresi.
 * Kullanıcı yazarken gerçek zamanlı uyarı sağlar.
 * Backend ile aynı kuralları paylaşır.
 */

const normalizeChars = (text: string): string => {
  const map: Record<string, string> = {
    'ç': 'c',
    'Ç': 'c',
    'ğ': 'g',
    'Ğ': 'g',
    'ı': 'i',
    'İ': 'i',
    'ö': 'o',
    'Ö': 'o',
    'ş': 's',
    'Ş': 's',
    'ü': 'u',
    'Ü': 'u',
    '@': 'a',
    '€': 'e',
    '$': 's',
    '0': 'o',
    '1': 'i',
    '3': 'e',
    '4': 'a',
    '5': 's',
    '!': 'i',
    '¡': 'i',
  };

  return text
    .split('')
    .map((char) => map[char] || char)
    .join('')
    .toLowerCase();
};

const stripSeparators = (text: string): string => text.replace(/[\s._*+#=~|/\\,;:!?'()[\]{}-]/g, '');

const PHONE_PATTERNS: RegExp[] = [
  /(\+?\s*9\s*0\s*)?[\s.() -]*0?\s*[\s.() -]*5\s*\d\s*\d[\s.() -]*\d\s*\d\s*\d[\s.() -]*\d\s*\d[\s.() -]*\d\s*\d/g,
  /\+\s*9\s*0\s*[\s.() -]*\d{3}[\s.() -]*\d{3}[\s.() -]*\d{2}[\s.() -]*\d{2}/g,
  /(\+?\s*9\s*0\s*)?[\s.() -]*0?\s*[\s.() -]*[2-4]\s*\d\s*\d[\s.() -]*\d\s*\d\s*\d[\s.() -]*\d\s*\d[\s.() -]*\d\s*\d/g,
  /\d[\s.*-]*\d[\s.*-]*\d[\s.*-]*\d[\s.*-]*\d[\s.*-]*\d[\s.*-]*\d[\s.*-]*\d*/g,
];

const containsPhone = (text: string): boolean => {
  for (const pattern of PHONE_PATTERNS) {
    const matches = text.match(new RegExp(pattern.source, pattern.flags));
    if (!matches) continue;

    for (const match of matches) {
      const digits = match.replace(/\D/g, '');
      if (digits.length >= 7) return true;
    }
  }

  return false;
};

const containsEmail = (text: string): boolean => {
  const pattern = /[\w.+-]+\s*@\s*[\w.-]+\s*\.\s*[a-zA-Z]{2,}/g;
  const writtenPattern =
    /[\w.+-]+\s*(?:at|@|et|güzel a|güzela|kuyruklu a)\s*[\w.-]+\s*(?:nokta|dot|\.)\s*(?:com|net|org|tr|gmail|hotmail|yahoo)/gi;

  return pattern.test(text) || writtenPattern.test(text);
};

const SOCIAL_PATTERNS: RegExp[] = [
  /(?:whatsapp|wp|wats\s*ap|vatsap|whats\s*app)[\s:./-]*@?\s*[\w.+-]+/gi,
  /(?:telegram|telgram|tg)[\s:./-]*@?\s*[\w.+-]+/gi,
  /(?:instagram|insta|ig)[\s:./-]*@?\s*[\w.+-]+/gi,
  /(?:facebook|fb)[\s:./-]*@?\s*[\w.+-]+/gi,
  /(?:twitter|tw|x\.com)[\s:./-]*@?\s*[\w.+-]+/gi,
  /(?:tiktok|tik\s*tok)[\s:./-]*@?\s*[\w.+-]+/gi,
];

const containsSocialMedia = (text: string): boolean => {
  for (const pattern of SOCIAL_PATTERNS) {
    if (new RegExp(pattern.source, pattern.flags).test(text)) return true;
  }

  return false;
};

const PROFANITY_ROOTS: string[] = [
  'amk', 'aq', 'amq', 'amina', 'aminako', 'amini',
  'orospu', 'oruspu', 'orusbu', 'orosbu', 'orospucocu',
  'sik', 'sikim', 'sikis', 'sikerim', 'sikeyim', 'siktir', 'siktirgit',
  'got', 'gotun', 'gotunu',
  'yarak', 'yarrak', 'yaraq',
  'pic', 'pich', 'piclik',
  'gavat', 'ibne', 'ibnelik',
  'pezevenk', 'pzevenk',
  'kahpe', 'kaltak',
  'dangalak', 'gerizekali', 'gerizekâli',
  'hassiktir', 'hass', 'hassik',
  'boktan',
  'puşt', 'pust', 'pusht',
  'döl', 'dol',
  'taşak', 'tasak', 'tassak',
  'siktimin', 'amcik', 'amcık',
  'yavsak', 'yavşak',
  'kodumun', 'kodumunun',
  'serefsiz', 'şerefsiz', 'namussuz', 'ahlaksiz', 'ahlaksız',
  'sg', 'sktir',
  'ananı', 'anani', 'anana', 'ananin', 'ananın',
  'bacini', 'bacını',
  'dallama',
  'skrm', 'skm', 'sktr', 'mq',
];

const SHORT_WORDS = new Set(['aq', 'mq', 'sg', 'got', 'pic', 'dol']);

const containsProfanity = (text: string): boolean => {
  const normalized = normalizeChars(text);
  const stripped = stripSeparators(normalized);

  for (const root of PROFANITY_ROOTS) {
    const normalizedRoot = normalizeChars(root);

    if (SHORT_WORDS.has(root)) {
      const boundaryRegex = new RegExp(`\\b${normalizedRoot}\\b`, 'gi');
      if (boundaryRegex.test(normalized)) return true;
      continue;
    }

    if (normalized.includes(normalizedRoot) || stripped.includes(normalizedRoot)) {
      return true;
    }
  }

  return false;
};

export interface ContentCheckResult {
  hasPhone: boolean;
  hasEmail: boolean;
  hasSocial: boolean;
  hasProfanity: boolean;
  hasAnyIssue: boolean;
  warnings: string[];
}

export const checkContent = (text: string): ContentCheckResult => {
  if (!text || text.trim().length < 3) {
    return {
      hasPhone: false,
      hasEmail: false,
      hasSocial: false,
      hasProfanity: false,
      hasAnyIssue: false,
      warnings: [],
    };
  }

  const warnings: string[] = [];

  const hasPhone = containsPhone(text);
  if (hasPhone) {
    warnings.push('📵 Telefon numarası tespit edildi; platform güvenliği için iletişim bilgisi paylaşılamaz.');
  }

  const hasEmail = containsEmail(text);
  if (hasEmail) {
    warnings.push('📧 E-posta adresi tespit edildi; platform dışı iletişim paylaşılamaz.');
  }

  const hasSocial = containsSocialMedia(text);
  if (hasSocial) {
    warnings.push('🔗 Sosyal medya bilgisi tespit edildi; platform dışı iletişim yasaktır.');
  }

  const hasProfanity = containsProfanity(text);
  if (hasProfanity) {
    warnings.push('🚫 Uygunsuz ifade tespit edildi; lütfen saygılı bir dil kullanın.');
  }

  return {
    hasPhone,
    hasEmail,
    hasSocial,
    hasProfanity,
    hasAnyIssue: hasPhone || hasEmail || hasSocial || hasProfanity,
    warnings,
  };
};

export default checkContent;
