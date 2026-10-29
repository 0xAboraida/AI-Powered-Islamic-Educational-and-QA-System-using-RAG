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

/**
 * Resolves immediate PDF URL if metadata is already present
 */
export function getBookPdfUrl(book: BookMeta): string | null {
  if (book.pdf_url) return book.pdf_url;
  if (book.pdf_links && Array.isArray(book.pdf_links.files) && book.pdf_links.files.length > 0) {
    const firstFile = book.pdf_links.files[0];
    if (firstFile) {
      return formatTurathPdfUrl(book.pdf_links.root, firstFile);
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
