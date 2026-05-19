/**
 * İçerik Moderasyon Sistemi
 * Platform aracılığını korumak için iletişim bilgisi paylaşımını
 * ve uygunsuz içerik gönderimini engelleyen merkezi modül.
 */

// ═══════════ TÜRKÇE KARAKTER NORMALİZASYON ═══════════

const normalizeChars = (text: string): string => {
  const map: Record<string, string> = {
    'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g',
    'ı': 'i', 'İ': 'i', 'ö': 'o', 'Ö': 'o',
    'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u',
    '@': 'a', '€': 'e', '$': 's', '0': 'o',
    '1': 'i', '3': 'e', '4': 'a', '5': 's',
    '!': 'i', '¡': 'i',
  };
  return text.split('').map(c => map[c] || c).join('').toLowerCase();
};

// Nokta, tire, boşluk gibi ayırıcıları kaldır
const stripSeparators = (text: string): string => {
  return text.replace(/[\s.\-_*+#=~|/\\,;:!?'"()\[\]{}]/g, '');
};

// ═══════════ TELEFON NUMARASI TESPİTİ ═══════════

const PHONE_PATTERNS: RegExp[] = [
  // Türkiye mobil numaraları (tüm formatlar)
  /(\+?\s*9\s*0\s*)?[\s.\-()]*0?\s*[\s.\-()]*5\s*\d\s*\d[\s.\-()]*\d\s*\d\s*\d[\s.\-()]*\d\s*\d[\s.\-()]*\d\s*\d/g,
  // Uluslararası format
  /\+\s*9\s*0\s*[\s.\-()]*\d{3}[\s.\-()]*\d{3}[\s.\-()]*\d{2}[\s.\-()]*\d{2}/g,
  // Sabit hat
  /(\+?\s*9\s*0\s*)?[\s.\-()]*0?\s*[\s.\-()]*[2-4]\s*\d\s*\d[\s.\-()]*\d\s*\d\s*\d[\s.\-()]*\d\s*\d[\s.\-()]*\d\s*\d/g,
  // Ardışık 7+ rakam (genel yakalama)
  /\d[\s.\-]*\d[\s.\-]*\d[\s.\-]*\d[\s.\-]*\d[\s.\-]*\d[\s.\-]*\d[\s.\-]*\d*/g,
];

// Rakam yazıyla yazılmış olabilir
const WRITTEN_NUMBERS: Record<string, string> = {
  'sifir': '0', 'sıfır': '0', 'bir': '1', 'iki': '2', 'üç': '3', 'uc': '3',
  'dört': '4', 'dort': '4', 'beş': '5', 'bes': '5', 'altı': '6', 'alti': '6',
  'yedi': '7', 'sekiz': '8', 'dokuz': '9',
};

const containsPhone = (text: string): { found: boolean; matches: string[] } => {
  const matches: string[] = [];

  // Yazıyla yazılmış numaraları kontrol et
  let convertedText = text.toLowerCase();
  for (const [word, digit] of Object.entries(WRITTEN_NUMBERS)) {
    convertedText = convertedText.replace(new RegExp(`\\b${word}\\b`, 'gi'), digit);
  }

  // Her pattern'i dene
  for (const pattern of PHONE_PATTERNS) {
    const patternMatches = convertedText.match(new RegExp(pattern.source, pattern.flags));
    if (patternMatches) {
      for (const match of patternMatches) {
        // Sadece rakamları çıkar
        const digits = match.replace(/\D/g, '');
        // 7+ rakam varsa telefon numarası olarak kabul et
        if (digits.length >= 7) {
          matches.push(match.trim());
        }
      }
    }
  }

  return { found: matches.length > 0, matches: [...new Set(matches)] };
};

// ═══════════ E-POSTA TESPİTİ ═══════════

const EMAIL_PATTERN = /[\w.\-+]+\s*[@]\s*[\w.\-]+\s*\.\s*[a-zA-Z]{2,}/g;
const EMAIL_WRITTEN_PATTERN = /[\w.\-+]+\s*(?:at|@|et|güzel a|güzela|kuyruklu a)\s*[\w.\-]+\s*(?:nokta|dot|\.)\s*(?:com|net|org|tr|gmail|hotmail|yahoo)/gi;

const containsEmail = (text: string): { found: boolean; matches: string[] } => {
  const matches: string[] = [];

  const emailMatches = text.match(EMAIL_PATTERN);
  if (emailMatches) matches.push(...emailMatches.map(m => m.trim()));

  const writtenMatches = text.match(EMAIL_WRITTEN_PATTERN);
  if (writtenMatches) matches.push(...writtenMatches.map(m => m.trim()));

  return { found: matches.length > 0, matches: [...new Set(matches)] };
};

// ═══════════ SOSYAL MEDYA TESPİTİ ═══════════

const SOCIAL_PATTERNS: RegExp[] = [
  /(?:whatsapp|wp|wats\s*ap|vatsap|whats\s*app)[\s:.\-/]*[@]?\s*[\w.\-+]+/gi,
  /(?:telegram|telgram|tg)[\s:.\-/]*[@]?\s*[\w.\-+]+/gi,
  /(?:instagram|insta|ig)[\s:.\-/]*[@]?\s*[\w.\-+]+/gi,
  /(?:facebook|fb)[\s:.\-/]*[@]?\s*[\w.\-+]+/gi,
  /(?:twitter|tw|x\.com)[\s:.\-/]*[@]?\s*[\w.\-+]+/gi,
  /(?:tiktok|tik\s*tok)[\s:.\-/]*[@]?\s*[\w.\-+]+/gi,
  /(?:linkedin|linked\s*in)[\s:.\-/]*[@]?\s*[\w.\-+]+/gi,
];

const containsSocialMedia = (text: string): { found: boolean; matches: string[] } => {
  const matches: string[] = [];

  for (const pattern of SOCIAL_PATTERNS) {
    const socialMatches = text.match(new RegExp(pattern.source, pattern.flags));
    if (socialMatches) matches.push(...socialMatches.map(m => m.trim()));
  }

  return { found: matches.length > 0, matches: [...new Set(matches)] };
};

// ═══════════ KÜFÜR / ARGO FİLTRESİ ═══════════

// Kök küfür/argo kelime listesi (Türkçe)
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
  'dangalak', 'gerizekali', 'gerizekâli', 'salak',
  'aptal', 'mal', 'gerizekalı',
  'hassiktir', 'hass', 'hassik',
  'bok', 'boktan',
  'manyak', 'deli', 'psikopat',
  'puşt', 'pust', 'pusht',
  'döl', 'dol',
  'taşak', 'tasak', 'tassak',
  'siktimin', 'amcik', 'amcık',
  'pipi', 'yavsak', 'yavşak',
  'hıyar', 'hiyar',
  'kodumun', 'kodumunun',
  'serefsiz', 'şerefsiz', 'namussuz', 'ahlaksiz', 'ahlaksız',
  'lan', 'ulan',
  'sg', 'sktir', 'stfu',
  'ananı', 'anani', 'anana', 'ananin', 'ananın',
  'bacini', 'bacını',
  'top', 'dallama',
  'am', 'amcıq',
  'skrm', 'skm', 'sktr', 'mq',
];

// "am" gibi kısa kelimelerin yanlış pozitif vermemesi için minimum uzunluk + kelime sınırı
const SHORT_WORDS_NEEDING_BOUNDARY = new Set(['am', 'aq', 'mq', 'sg', 'mal', 'top', 'bok', 'got', 'pic', 'lan', 'dol']);

const containsProfanity = (text: string): { found: boolean; matches: string[] } => {
  const matches: string[] = [];
  const normalized = normalizeChars(text);
  const stripped = stripSeparators(normalized);

  for (const root of PROFANITY_ROOTS) {
    const normalizedRoot = normalizeChars(root);

    // Kısa kelimeler için tam kelime eşleşmesi gerekli
    if (SHORT_WORDS_NEEDING_BOUNDARY.has(root)) {
      const boundaryRegex = new RegExp(`\\b${normalizedRoot}\\b`, 'gi');
      if (boundaryRegex.test(normalized)) {
        matches.push(root);
      }
    } else {
      // Uzun kelimeler için kısmi eşleşme yeterli (türevleri de yakalar)
      if (normalized.includes(normalizedRoot) || stripped.includes(normalizedRoot)) {
        matches.push(root);
      }
    }
  }

  return { found: matches.length > 0, matches: [...new Set(matches)] };
};

// ═══════════ İÇERİK SANSÜRLEME ═══════════

const censorPhones = (text: string): string => {
  let result = text;
  const { matches } = containsPhone(text);
  for (const match of matches) {
    result = result.replace(match, '[📵 İletişim bilgisi gizlendi]');
  }
  return result;
};

const censorEmails = (text: string): string => {
  let result = text;
  const { matches } = containsEmail(text);
  for (const match of matches) {
    result = result.replace(match, '[📧 E-posta gizlendi]');
  }
  return result;
};

const censorSocial = (text: string): string => {
  let result = text;
  const { matches } = containsSocialMedia(text);
  for (const match of matches) {
    result = result.replace(match, '[🔗 Sosyal medya gizlendi]');
  }
  return result;
};

const censorProfanity = (text: string): string => {
  let result = text;
  const { matches } = containsProfanity(text);
  for (const match of matches) {
    // Orijinal metindeki kelimeyi bul ve sansürle
    const regex = new RegExp(match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    result = result.replace(regex, '***');
  }
  return result;
};

// ═══════════ ANA DOĞRULAMA FONKSİYONU ═══════════

export interface ContentViolation {
  type: 'phone' | 'email' | 'social' | 'profanity';
  original: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedText: string;
  violations: ContentViolation[];
}

/**
 * İçerik doğrulama fonksiyonu
 * @param text - Kontrol edilecek metin
 * @param options - Hangi kontrollerin yapılacağı (varsayılan: hepsi aktif)
 * @returns ValidationResult
 */
export const validateContent = (
  text: string,
  options: {
    checkPhone?: boolean;
    checkEmail?: boolean;
    checkSocial?: boolean;
    checkProfanity?: boolean;
    blockOnPhone?: boolean;    // true: telefonda engelle, false: sadece sansürle
    blockOnProfanity?: boolean; // true: küfürde engelle, false: sadece sansürle
  } = {}
): ValidationResult => {
  const {
    checkPhone = true,
    checkEmail = true,
    checkSocial = true,
    checkProfanity = true,
    blockOnPhone = true,
    blockOnProfanity = true,
  } = options;

  const errors: string[] = [];
  const violations: ContentViolation[] = [];
  let sanitizedText = text;

  // 1. Telefon kontrolü
  if (checkPhone) {
    const phoneResult = containsPhone(text);
    if (phoneResult.found) {
      violations.push(...phoneResult.matches.map(m => ({ type: 'phone' as const, original: m })));
      if (blockOnPhone) {
        errors.push('📵 Mesajınızda telefon numarası tespit edildi. Platform güvenliği için iletişim bilgisi paylaşımı yasaktır.');
      }
      sanitizedText = censorPhones(sanitizedText);
    }
  }

  // 2. E-posta kontrolü
  if (checkEmail) {
    const emailResult = containsEmail(text);
    if (emailResult.found) {
      violations.push(...emailResult.matches.map(m => ({ type: 'email' as const, original: m })));
      errors.push('📧 Mesajınızda e-posta adresi tespit edildi. Platform güvenliği için iletişim bilgisi paylaşımı yasaktır.');
      sanitizedText = censorEmails(sanitizedText);
    }
  }

  // 3. Sosyal medya kontrolü
  if (checkSocial) {
    const socialResult = containsSocialMedia(text);
    if (socialResult.found) {
      violations.push(...socialResult.matches.map(m => ({ type: 'social' as const, original: m })));
      errors.push('🔗 Mesajınızda sosyal medya hesabı tespit edildi. Platform dışı iletişim yasaktır.');
      sanitizedText = censorSocial(sanitizedText);
    }
  }

  // 4. Küfür/argo kontrolü
  if (checkProfanity) {
    const profanityResult = containsProfanity(text);
    if (profanityResult.found) {
      violations.push(...profanityResult.matches.map(m => ({ type: 'profanity' as const, original: m })));
      if (blockOnProfanity) {
        errors.push('🚫 Mesajınızda uygunsuz ifade tespit edildi. Lütfen saygılı bir dil kullanın.');
      }
      sanitizedText = censorProfanity(sanitizedText);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedText,
    violations,
  };
};

export default validateContent;
