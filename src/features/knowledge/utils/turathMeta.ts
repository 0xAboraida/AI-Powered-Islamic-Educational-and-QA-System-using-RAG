import authorsDeathData from '../data/authors_death.json';
import booksWithPdfData from '../data/books_with_pdf.json';
import { BookMeta } from '../types/bookTypes';

// Pre-indexed set of all 5,838 books with verified PDFs in Turath
const PDF_BOOK_IDS_SET = new Set<number>(booksWithPdfData as number[]);

/**
 * Checks whether a book has a verified PDF available in Turath
 */
export function hasBookPdf(book: BookMeta): boolean {
  if (book.has_pdf === true) return true;
  if (book.pdf_url) return true;
  if (book.pdf_links && Array.isArray(book.pdf_links.files) && book.pdf_links.files.length > 0) return true;
  const numId = typeof book.id === 'number' ? book.id : parseInt(String(book.id), 10);
  if (!isNaN(numId) && PDF_BOOK_IDS_SET.has(numId)) return true;
  return false;
}

/**
 * Cleanly formats a Turath PDF URL given a root folder and a filename
 */
export function formatTurathPdfUrl(root: string | undefined, file: string): string {
  const cleanFile = file.split('|')[0].trim().replace(/^\/+/, '');
  const cleanRoot = (root || '').trim().replace(/^\/+|\/+$/g, '');
  let fullPath = cleanRoot ? `${cleanRoot}/${cleanFile}` : cleanFile;
  if (fullPath.includes('archive.org')) {
    fullPath = 'archive/' + fullPath.replace('https://archive.org/download/', '').replace('/', '_=_');
  }
  return `https://files.turath.io/pdf/${encodeURIComponent(fullPath).replace(/%2F/g, '/')}`;
}

export interface VolumePdfItem {
  vol: string;
  volNum?: number;
  isCover: boolean;
  isPreface?: boolean;
  fileName: string;
  url: string;
  pageRange?: string;
  badgeLabel?: string;
}

export const ARABIC_ORDINAL_VOLUMES: Record<number, string> = {
  1: 'المجلد الأول',
  2: 'المجلد الثاني',
  3: 'المجلد الثالث',
  4: 'المجلد الرابع',
  5: 'المجلد الخامس',
  6: 'المجلد السادس',
  7: 'المجلد السابع',
  8: 'المجلد الثامن',
  9: 'المجلد التاسع',
  10: 'المجلد العاشر',
  11: 'المجلد الحادي عشر',
  12: 'المجلد الثاني عشر',
  13: 'المجلد الثالث عشر',
  14: 'المجلد الرابع عشر',
  15: 'المجلد الخامس عشر',
  16: 'المجلد السادس عشر',
  17: 'المجلد السابع عشر',
  18: 'المجلد الثامن عشر',
  19: 'المجلد التاسع عشر',
  20: 'المجلد العشرون',
  21: 'المجلد الحادي والعشرون',
  22: 'المجلد الثاني والعشرون',
  23: 'المجلد الثالث والعشرون',
  24: 'المجلد الرابع والعشرون',
  25: 'المجلد الخامس والعشرون',
  26: 'المجلد السادس والعشرون',
  27: 'المجلد السابع والعشرون',
  28: 'المجلد الثامن والعشرون',
  29: 'المجلد التاسع والعشرون',
  30: 'المجلد الثلاثون',
};

/**
 * Parses multi-volume PDF links or pdfsMap into structured VolumePdfItem list
 */
export function parsePdfFilesList(
  pdfLinks?: { root?: string; files?: string[] } | null,
  pdfsMap?: Record<string, string>,
  pdfBase?: string,
  volumeBounds?: Record<string, [number, number]>
): VolumePdfItem[] {
  const items: VolumePdfItem[] = [];
  const files = pdfLinks?.files || [];
  const root = pdfLinks?.root;

  if (Array.isArray(files) && files.length > 0) {
    let fallbackVolCounter = 1;
    files.forEach((entry) => {
      const parts = entry.split('|');
      const rawFile = parts[0].trim();
      const explicitLabel = parts[1]?.trim();
      const cleanFile = rawFile.replace(/^\/+/, '');
      const url = formatTurathPdfUrl(root, cleanFile);

      const isCover =
        (explicitLabel && /غلاف|عنوان/i.test(explicitLabel)) ||
        /^(00_|_0\.pdf|.*[_-]00?\b|.*cover|.*front)/i.test(cleanFile);

      const isPreface =
        (explicitLabel && /مقدمة|تمهيد|مدخل|ترجمة/i.test(explicitLabel)) ||
        /(\d+p[_-]|.*p\.pdf|.*preface|.*intro|.*tamheed)/i.test(cleanFile);

      let volLabel = '';
      let volNum: number | undefined = undefined;
      let badgeLabel = '';

      if (isCover) {
        volLabel = explicitLabel || 'غلاف الكتاب (صفحة العنوان)';
        volNum = 0;
        badgeLabel = 'غلاف';
      } else if (isPreface) {
        volLabel = explicitLabel || 'مقدمة التحقيق والتمهيد';
        volNum = 0;
        badgeLabel = 'مقدمة';
      } else if (explicitLabel && /^\d+$/.test(explicitLabel)) {
        volNum = parseInt(explicitLabel, 10);
        volLabel = ARABIC_ORDINAL_VOLUMES[volNum] || `المجلد ${volNum}`;
        badgeLabel = `جـ ${volNum}`;
      } else if (explicitLabel) {
        volLabel = explicitLabel;
        const matchNum = explicitLabel.match(/\d+/);
        if (matchNum) {
          volNum = parseInt(matchNum[0], 10);
          badgeLabel = `جـ ${volNum}`;
        }
      } else {
        // Try extracting volume number from filename
        // Examples: 01_elmoghni.pdf, bustan_2.pdf, tqa3.pdf, 01_2022.pdf
        const match = cleanFile.match(/(?:_0?(\d+)|-(\d+)|\bvol(?:ume)?[-_]?(\d+)|bustan_(\d+)|_(\d+)\.pdf|^0?(\d+)_)/i);
        const extracted = match ? (match[1] || match[2] || match[3] || match[4] || match[5] || match[6]) : null;
        if (extracted && parseInt(extracted, 10) > 0) {
          volNum = parseInt(extracted, 10);
          volLabel = ARABIC_ORDINAL_VOLUMES[volNum] || `المجلد ${volNum}`;
          badgeLabel = `جـ ${volNum}`;
        } else {
          volNum = fallbackVolCounter++;
          volLabel = files.length === 1 ? 'الكتاب كاملاً (PDF)' : (ARABIC_ORDINAL_VOLUMES[volNum] || `المجلد ${volNum}`);
          badgeLabel = files.length === 1 ? 'كامل' : `جـ ${volNum}`;
        }
      }

      // Attach page range only to non-cover, non-preface actual volumes
      const bounds = (volNum !== undefined && volNum > 0 && !isCover && !isPreface) ? volumeBounds?.[String(volNum)] : undefined;
      const pageRange = bounds ? `صـ ${bounds[0]} - ${bounds[1]}` : undefined;

      items.push({
        vol: volLabel,
        volNum,
        isCover: isCover || isPreface,
        isPreface,
        fileName: cleanFile,
        url,
        pageRange,
        badgeLabel
      });
    });
  } else if (pdfsMap && Object.keys(pdfsMap).length > 0) {
    Object.entries(pdfsMap).forEach(([volKey, fileName]) => {
      let cleanFile = fileName.replace(/^\/+/, '');
      const cleanRoot = pdfBase ? pdfBase.replace(/^\/+|\/+$/g, '') : '';
      const fullPath = cleanRoot ? `${cleanRoot}/${cleanFile}` : cleanFile;
      const url = fullPath.includes('archive.org') ? fullPath : `https://files.turath.io/pdf/${fullPath}`;
      const isCover = /^(00_|_0\.pdf|.*cover)/i.test(cleanFile) || volKey === '0';
      const isPreface = /(\d+p[_-]|.*p\.pdf|.*preface)/i.test(cleanFile);
      const volNum = parseInt(volKey, 10) || undefined;
      const bounds = (volNum !== undefined && volNum > 0) ? volumeBounds?.[volKey] : undefined;
      items.push({
        vol: isCover ? 'غلاف الكتاب' : isPreface ? 'مقدمة التحقيق' : (volNum && ARABIC_ORDINAL_VOLUMES[volNum]) ? ARABIC_ORDINAL_VOLUMES[volNum] : `المجلد ${volKey}`,
        volNum,
        isCover: isCover || isPreface,
        isPreface,
        fileName: cleanFile,
        url,
        pageRange: bounds ? `صـ ${bounds[0]} - ${bounds[1]}` : undefined,
        badgeLabel: isCover ? 'غلاف' : isPreface ? 'مقدمة' : `جـ ${volKey}`
      });
    });
  }

  return items;
}

/**
 * Resolves immediate PDF URL if metadata is already present.
 * Intelligently skips cover/front-matter files to return the actual reading content (e.g. Volume 1),
 * or matches a requested targetVolume if specified.
 */
export function getBookPdfUrl(book: BookMeta, targetVolume?: number | string): string | null {
  if (book.pdf_url) return book.pdf_url;
  if (book.pdf_links && Array.isArray(book.pdf_links.files) && book.pdf_links.files.length > 0) {
    const list = parsePdfFilesList(book.pdf_links);
    if (list.length > 0) {
      if (targetVolume !== undefined && targetVolume !== null && targetVolume !== '') {
        const targetNum = typeof targetVolume === 'number' ? targetVolume : parseInt(String(targetVolume), 10);
        if (!isNaN(targetNum)) {
          const match = list.find(it => it.volNum === targetNum);
          if (match) return match.url;
        }
      }
      // Prefer the first non-cover volume (usually Volume 1)
      const firstRealVolume = list.find(it => !it.isCover);
      if (firstRealVolume) return firstRealVolume.url;
      return list[0].url;
    }
  }
  return null;
}

export const CENTURY_NAMES_MAP: Record<number, string> = {
  1: "القرن الأول هـ",
  2: "القرن الثاني هـ",
  3: "القرن الثالث هـ",
  4: "القرن الرابع هـ",
  5: "القرن الخامس هـ",
  6: "القرن السادس هـ",
  7: "القرن السابع هـ",
  8: "القرن الثامن هـ",
  9: "القرن التاسع هـ",
  10: "القرن العاشر هـ",
  11: "القرن الحادي عشر هـ",
  12: "القرن الثاني عشر هـ",
  13: "القرن الثالث عشر هـ",
  14: "القرن الرابع عشر هـ",
  15: "القرن الخامس عشر هـ",
};

// Pre-computed O(1) maps for instant, zero-lag author death lookups
const AUTHOR_DEATH_MAP = new Map<string, number>();
const NORM_AUTHOR_DEATH_MAP = new Map<string, number>();

function normalizeArabicKey(str: string): string {
  return str
    .replace(/^(الشيخ|الإمام|العلامة|الحافظ|القاضي|أبو|ابن)\s+/, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[\u064B-\u0652]/g, '')
    .trim();
}

for (const [key, death] of Object.entries(authorsDeathData as Record<string, number>)) {
  const trimmed = key.trim();
  AUTHOR_DEATH_MAP.set(trimmed, death);

  const clean = trimmed.replace(/^(الشيخ|الإمام|العلامة|الحافظ|القاضي|أبو|ابن)\s+/, '').trim();
  if (clean && !AUTHOR_DEATH_MAP.has(clean)) {
    AUTHOR_DEATH_MAP.set(clean, death);
  }

  const norm = normalizeArabicKey(trimmed);
  if (norm && !NORM_AUTHOR_DEATH_MAP.has(norm)) {
    NORM_AUTHOR_DEATH_MAP.set(norm, death);
  }
}

/**
 * High-performance O(1) author death year lookup strictly using authors_death.json
 */
export function lookupAuthorDeathYear(authorName: string): number | null {
  if (!authorName) return null;
  const rawClean = authorName.trim();

  // 1. Direct O(1) match
  const exact = AUTHOR_DEATH_MAP.get(rawClean);
  if (exact !== undefined) return exact;

  // 2. Strip honorifics O(1) match
  const clean = rawClean.replace(/^(الشيخ|الإمام|العلامة|الحافظ|القاضي|أبو|ابن)\s+/, '').trim();
  const stripped = AUTHOR_DEATH_MAP.get(clean);
  if (stripped !== undefined) return stripped;

  // 3. Normalized Arabic O(1) match
  const norm = normalizeArabicKey(rawClean);
  const normalizedMatch = NORM_AUTHOR_DEATH_MAP.get(norm);
  if (normalizedMatch !== undefined) return normalizedMatch;

  return null;
}

/**
 * Normalizes any book object into the standard BookMeta format with zero mock data
 */
export const normalizeBook = (b: any): BookMeta => {
  const title = (b.title || b.name || '').trim();
  const author = (b.author || b.author_name || '').trim();
  const category = (b.category || b.cat_name || 'عام').trim();
  const info = (b.info || b.infoText || b.book_info_text || '').trim();
  const authorBio = (b.author_bio || b.authorBioText || b.author_bio_text || '').trim();
  const rawId = b.id ?? b.turath_id ?? b._id;
  const numId = typeof rawId === 'number' ? rawId : parseInt(String(rawId), 10);
  const finalId = (!isNaN(numId) && numId > 0) ? numId : 0;

  const has_pdf = typeof b.has_pdf === 'boolean'
    ? b.has_pdf
    : (!isNaN(numId) && PDF_BOOK_IDS_SET.has(numId));

  const inferredDeath = typeof b.death_year === 'number' && b.death_year > 0
    ? b.death_year
    : lookupAuthorDeathYear(author);

  const inferredCentury = (typeof inferredDeath === 'number' && inferredDeath > 0)
    ? Math.floor((inferredDeath - 1) / 100) + 1
    : (typeof b.century === 'number' && b.century > 0 ? b.century : null);

  const centuryName = (typeof inferredCentury === 'number' && inferredCentury > 0)
    ? (CENTURY_NAMES_MAP[inferredCentury] || `القرن ${inferredCentury} هـ`)
    : (b.century_name || 'غير محدد');

  return {
    ...b,
    id: finalId,
    title: title || 'بدون عنوان',
    name: title || 'بدون عنوان',
    author: author || 'غير معروف',
    author_name: author || 'غير معروف',
    category: category || 'عام',
    cat_name: category || 'عام',
    info: info || `كتاب ${title} في ${category} للمؤلف ${author}`,
    infoText: info || `كتاب ${title} في ${category} للمؤلف ${author}`,
    book_info_text: info || `كتاب ${title} في ${category} للمؤلف ${author}`,
    author_bio: authorBio || `العالم والمصنف ${author}`,
    authorBioText: authorBio || `العالم والمصنف ${author}`,
    author_bio_text: authorBio || `العالم والمصنف ${author}`,
    death_year: inferredDeath ?? null,
    century: inferredCentury ?? null,
    century_name: centuryName,
    has_pdf,
    pdf_url: b.pdf_url || null,
    pdf_links: b.pdf_links || null,
    size: typeof b.size === 'number' ? b.size : null,
    page_count: typeof b.page_count === 'number' ? b.page_count : null,
  };
};

/**
 * Accurately determines century and death year from canonical author data
 */
export function inferCenturyAndDeath(book: BookMeta): { deathYear: number | null; century: number | null; centuryName: string } {
  let resolvedDeath: number | null = (typeof book.death_year === 'number' && book.death_year > 0)
    ? book.death_year
    : null;

  if (!resolvedDeath) {
    const authorName = (book.author || book.author_name || '').trim();
    resolvedDeath = lookupAuthorDeathYear(authorName);
  }

  if (!resolvedDeath) {
    const arToEn = (str: string) => str.replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
    const authorBio = arToEn(book.authorBioText || book.author_bio_text || '');
    const bookInfo = arToEn(book.infoText || book.book_info_text || book.info || '');

    const extractYear = (text: string) => {
      if (!text) return null;
      const m = text.match(/(?:ت|توفي|وفاته|المتوفى|المتوفى سنة|عام)\s*[:\s]?\s*(\d{1,4})\s*(?:هـ|هـ\b|\))/);
      if (m) {
        const y = parseInt(m[1], 10);
        if (y >= 10 && y <= 1450) return y;
      }
      const m2 = text.match(/[\(–\-]\s*(?:\d{1,4}\s*[\-–]\s*)?(\d{1,4})\s*هـ/);
      if (m2) {
        const y = parseInt(m2[1], 10);
        if (y >= 10 && y <= 1450) return y;
      }
      return null;
    };

    resolvedDeath = extractYear(authorBio) || extractYear(bookInfo);
  }

  if (resolvedDeath && resolvedDeath > 0) {
    const c = Math.floor((resolvedDeath - 1) / 100) + 1;
    return {
      deathYear: resolvedDeath,
      century: c,
      centuryName: CENTURY_NAMES_MAP[c] || `القرن ${c} هـ`
    };
  }

  let explicitCentury: number | null = null;
  if (typeof book.century === 'number' && book.century > 0) {
    explicitCentury = book.century;
  } else if (typeof book.century === 'string') {
    const parsed = parseInt(book.century, 10);
    explicitCentury = isNaN(parsed) ? null : parsed;
  }

  if (explicitCentury && explicitCentury > 0) {
    return {
      deathYear: null,
      century: explicitCentury,
      centuryName: CENTURY_NAMES_MAP[explicitCentury] || book.century_name || `القرن ${explicitCentury} هـ`
    };
  }

  const arBio = book.authorBioText || book.author_bio_text || '';
  if (/حفظه الله|أطال الله عمره|رعاه الله|عضو هيئة كبار|جامعة الإمام|الجامعة الإسلامية/.test(arBio)) {
    return { deathYear: null, century: 15, centuryName: 'معاصر' };
  }

  return { deathYear: null, century: null, centuryName: 'غير محدد' };
}
