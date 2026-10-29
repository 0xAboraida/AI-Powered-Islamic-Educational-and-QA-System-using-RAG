/**
 * Fast Arabic Text Normalization (تطبيع النصوص العربية):
 * إزالة التشكيل، توحيد الهمزات، توحيد التاء المربوطة، وتوحيد الألف المقصورة لتسريع ودقة البحث
 */
export function normalizeArabicText(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ـ+/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * إزالة التشكيل وعلامات المصحف والمدود
 */
export function stripTashkeel(str: string | undefined | null): string {
  if (!str) return '';
  return str.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');
}

/**
 * خوارزمية بحث تراث الأصلية (Turath Search Engine Regex)
 * مأخوذة بالحرف من كود تطبيق تراث (.temp_turath / app.turath.io)
 */
const TURATH_CHAR_MAP: Record<string, string> = {
  'ا': 'اأآإى',
  'أ': 'أإءؤئ',
  'ء': 'ءأإؤئ',
  'ت': 'تة',
  'ة': 'ةته',
  'ه': 'هة',
  'ى': 'ىاي',
  'ي': 'يى'
};

const TURATH_CHAR_REGEX = new RegExp(`[${Object.keys(TURATH_CHAR_MAP).join('')}]`, 'g');

/**
 * بناء تعبير نمطي مطابق لخوارزمية تراث بالمللي ثانية وبدقة تامة
 */
export function createTurathSearchRegex(query: string | undefined | null): RegExp | null {
  if (!query) return null;
  const unvoweled = stripTashkeel(query);
  const cleaned = unvoweled.replace(/[^\p{sc=Arabic}\p{N} ]/gu, '').trim();
  if (!cleaned) return null;

  const pattern = cleaned
    .replace(/\s+/g, '.*?')
    .replace(TURATH_CHAR_REGEX, (ch) => `[${TURATH_CHAR_MAP[ch]}]`);

  try {
    return new RegExp(pattern);
  } catch {
    return null;
  }
}

