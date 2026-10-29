import { BookMeta } from '../types/bookTypes';
import { idbGet, idbSet } from '../../../utils/indexedDbStorage';
import { FEATURED_CLASSICAL_BOOKS } from '../data/curatedClassicalBooks';
import { fetchTurathBookIndexes, fetchTurathBookPdfUrl } from '../../../api/turathApi';

// In-memory memory cache for instant synchronous frame rendering
const MEMORY_CACHE = new Map<number | string, string>();

export interface AdminCoverOverride {
  bookId: number;
  bookTitle?: string;
  bookAuthor?: string;
  category?: string; // Custom domain / category label (e.g. user-defined)
  defaultCategory?: string; // Original catalog category (from the ~40 categories)
  coverSource: string; // Turath ID, or Archive item ID, or Direct Image URL
  resolvedCoverUrl: string;
  isShowcase?: boolean; // Show in Home "أبرز كتب المكتبة"
  orderIndex?: number; // Display order in showcase (1, 2, 3...)
  badgeText?: string; // Optional custom badge (e.g., "طبعة محققة", "أصل المذهب")
  updatedAt?: number;
}

// In-memory cache of admin-configured cover overrides
let ADMIN_OVERRIDES_CACHE: Record<number, AdminCoverOverride> | null = null;
let STATIC_SHOWCASE_FETCHED = false;

/**
 * Returns set of book IDs explicitly removed/deleted by the admin.
 */
export function getDeletedShowcaseIds(): Set<number> {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('zad_admin_deleted_showcase_ids') : null;
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr.map(Number));
    }
  } catch (e) { }
  return new Set();
}

/**
 * Records that a book has been explicitly removed by the admin so it never resurrects.
 */
export function markShowcaseBookDeleted(bookId: number): void {
  const deletedSet = getDeletedShowcaseIds();
  deletedSet.add(Number(bookId));
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('zad_admin_deleted_showcase_ids', JSON.stringify(Array.from(deletedSet)));
    } catch (e) { }
  }
}

/**
 * Clears the deleted mark if admin explicitly re-adds or edits this book.
 */
export function unmarkShowcaseBookDeleted(bookId: number): void {
  const deletedSet = getDeletedShowcaseIds();
  const numId = Number(bookId);
  if (deletedSet.has(numId)) {
    deletedSet.delete(numId);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('zad_admin_deleted_showcase_ids', JSON.stringify(Array.from(deletedSet)));
      } catch (e) { }
    }
  }
}

export function clearDeletedShowcaseIds(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('zad_admin_deleted_showcase_ids');
    } catch (e) { }
  }
}

export function getAdminCoverOverrides(): Record<number, AdminCoverOverride> {
  if (ADMIN_OVERRIDES_CACHE !== null) return ADMIN_OVERRIDES_CACHE;
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('zad_admin_cover_overrides') : null;
    if (raw) {
      ADMIN_OVERRIDES_CACHE = JSON.parse(raw);
      return ADMIN_OVERRIDES_CACHE || {};
    }
  } catch (e) { }
  ADMIN_OVERRIDES_CACHE = {};
  return ADMIN_OVERRIDES_CACHE;
}

/**
 * Loads static showcase configuration from public/data/showcase_config.json
 * so all deployed users immediately receive the configured showcase books, covers, and order!
 */
export async function syncStaticShowcaseConfig(): Promise<void> {
  if (STATIC_SHOWCASE_FETCHED || typeof window === 'undefined') return;
  STATIC_SHOWCASE_FETCHED = true;
  try {
    const res = await fetch('/data/showcase_config.json');
    if (res.ok) {
      const staticData: Record<number, AdminCoverOverride> = await res.json();
      if (staticData && typeof staticData === 'object') {
        const local = getAdminCoverOverrides();
        const deletedIds = getDeletedShowcaseIds();

        // Filter out any entries that the admin explicitly deleted
        const filteredStatic: Record<number, AdminCoverOverride> = {};
        Object.entries(staticData).forEach(([idStr, val]) => {
          const numId = Number(idStr);
          if (!deletedIds.has(numId) && !deletedIds.has(val.bookId)) {
            filteredStatic[numId] = val;
          }
        });

        ADMIN_OVERRIDES_CACHE = { ...filteredStatic, ...local };
        window.dispatchEvent(new CustomEvent('zad_cover_overrides_changed', { detail: ADMIN_OVERRIDES_CACHE }));
      }
    }
  } catch (e) { }
}

// Automatically trigger on client startup
if (typeof window !== 'undefined') {
  syncStaticShowcaseConfig();
}

let PDFJS_PROMISE: Promise<any> | null = null;

export function loadPdfJsLib(): Promise<any> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if ((window as any).pdfjsLib) return Promise.resolve((window as any).pdfjsLib);
  if (PDFJS_PROMISE) return PDFJS_PROMISE;

  PDFJS_PROMISE = new Promise((resolve) => {
    const existing = document.querySelector('script[data-pdfjs-cdn]');
    if (existing) {
      existing.addEventListener('load', () => {
        const lib = (window as any).pdfjsLib;
        if (lib) {
          lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
        resolve(lib);
      });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.setAttribute('data-pdfjs-cdn', 'true');
    script.async = true;
    script.onload = () => {
      const lib = (window as any).pdfjsLib;
      if (lib) {
        lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }
      resolve(lib);
    };
    script.onerror = () => {
      console.warn('Primary PDF.js CDN failed, trying unpkg fallback...');
      const fallback = document.createElement('script');
      fallback.src = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js';
      fallback.onload = () => {
        const lib = (window as any).pdfjsLib;
        if (lib) {
          lib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
        }
        resolve(lib);
      };
      fallback.onerror = () => resolve(null);
      document.head.appendChild(fallback);
    };
    document.head.appendChild(script);
  });

  return PDFJS_PROMISE;
}

/**
 * Extracts and renders the authentic first page (cover) of any PDF via HTML5 Canvas.
 * Uses HTTP range requests so only the initial byte chunks for page 1 are downloaded.
 * Returns a high-definition JPEG Data URL ready for instant display and IndexedDB caching.
 */
export async function renderPdfFirstPageToDataUrl(pdfUrl: string): Promise<string | null> {
  if (typeof window === 'undefined' || !pdfUrl) return null;
  try {
    const pdfjsLib = await loadPdfJsLib();
    if (!pdfjsLib) return null;

    const loadingTask = pdfjsLib.getDocument({
      url: pdfUrl,
      cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
      cMapPacked: true,
      disableRange: false,
      disableStream: false
    });

    const pdfDoc = await loadingTask.promise;
    if (!pdfDoc || pdfDoc.numPages < 1) return null;

    const page = await pdfDoc.getPage(1);
    const viewport = page.getViewport({ scale: 1.4 });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas.toDataURL('image/jpeg', 0.88);
  } catch (err) {
    console.warn('Failed to extract first page from PDF:', pdfUrl, err);
    return null;
  }
}

/**
 * Resolves any user-provided source (Turath ID, Archive ID, or Image URL) into a valid Cover Image URL.
 */
export async function resolveCoverSource(source: string, bookTitle?: string): Promise<string> {
  const trimmed = (source || '').trim();
  if (!trimmed) return '';

  // 1. Direct Image URL, Data URL, or Direct PDF URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image')) {
    // If user provided a direct PDF file link:
    if (trimmed.toLowerCase().includes('.pdf')) {
      const pdfCover = await renderPdfFirstPageToDataUrl(trimmed);
      if (pdfCover) return pdfCover;
    }

    const archiveId = extractArchiveId(trimmed);
    if (archiveId) {
      return `https://archive.org/services/img/${archiveId}`;
    }
    return trimmed;
  }

  // 2. Pure Numeric string -> Turath ID (e.g. 28107 for Muwatta, 11315 for Umda, 1655 for Umm, 6910 for Mughni)
  if (/^\d+$/.test(trimmed)) {
    const turathId = parseInt(trimmed, 10);
    try {
      const idx = await fetchTurathBookIndexes(turathId);

      // A. Check if linked to an Archive item
      let archiveId = extractArchiveId(idx?.meta?.pdf_links?.root);
      if (!archiveId && Array.isArray(idx?.meta?.pdf_links?.files) && idx.meta.pdf_links.files[0]) {
        archiveId = extractArchiveId(idx.meta.pdf_links.files[0]);
      }
      if (archiveId) {
        return `https://archive.org/services/img/${archiveId}`;
      }

      // B. If not on Archive, extract authentic Page 1 from Turath's direct PDF!
      const directPdfUrl = await fetchTurathBookPdfUrl(turathId);
      if (directPdfUrl) {
        const pdfCover = await renderPdfFirstPageToDataUrl(directPdfUrl);
        if (pdfCover) return pdfCover;
      }
    } catch (e) {
      console.warn('Failed to resolve Turath ID into cover:', turathId, e);
    }

    // C. Search Archive by title as fallback
    if (bookTitle) {
      const searchCover = await searchArchiveOrgCover(bookTitle);
      if (searchCover) return searchCover;
    }
    return '';
  }

  // 3. Archive / Waqf Identifier (alphanumeric like 01-86049 or WAQmogni or waq1234 or ommfikr)
  // Must NOT be purely numeric
  if (/^[a-zA-Z0-9_\.-]+$/.test(trimmed) && !/^\d+$/.test(trimmed)) {
    return `https://archive.org/services/img/${trimmed}`;
  }

  // 4. Fallback search by title
  if (bookTitle) {
    const searchCover = await searchArchiveOrgCover(bookTitle);
    if (searchCover) return searchCover;
  }

  return '';
}

/**
 * Saves or updates an admin cover override for a specific book.
 */
export async function saveAdminCoverOverride(override: Omit<AdminCoverOverride, 'resolvedCoverUrl' | 'updatedAt'> & { resolvedCoverUrl?: string }): Promise<string> {
  const numId = Number(override.bookId);
  unmarkShowcaseBookDeleted(numId);

  const overrides = getAdminCoverOverrides();
  let resolvedUrl = override.resolvedCoverUrl || '';
  if (!resolvedUrl) {
    resolvedUrl = await resolveCoverSource(override.coverSource, override.bookTitle);
  }

  const finalRecord: AdminCoverOverride = {
    ...override,
    bookId: numId,
    resolvedCoverUrl: resolvedUrl,
    updatedAt: Date.now()
  };

  overrides[numId] = finalRecord;
  ADMIN_OVERRIDES_CACHE = overrides;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('zad_admin_cover_overrides', JSON.stringify(overrides));
      localStorage.setItem('zad_showcase_customized', 'true');
      await idbSet('admin_cover_overrides', overrides);
    } catch (e) { }

    if (resolvedUrl) {
      MEMORY_CACHE.set(numId, resolvedUrl);
      try {
        await idbSet(`zad_cover_v6_${numId}`, resolvedUrl);
      } catch (e) { }
    }

    window.dispatchEvent(new CustomEvent('zad_cover_overrides_changed', { detail: finalRecord }));
  }

  return resolvedUrl;
}

/**
 * Removes an admin cover override and permanently hides/removes the book from the showcase.
 */
export function removeAdminCoverOverride(bookId: number): void {
  const numId = Number(bookId);
  // 1. Mark as permanently deleted from showcase so it cannot resurrect from classical seeds or static JSON
  markShowcaseBookDeleted(numId);

  // 2. Remove from overrides
  const overrides = getAdminCoverOverrides();
  delete overrides[numId];
  ADMIN_OVERRIDES_CACHE = overrides;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('zad_admin_cover_overrides', JSON.stringify(overrides));
      localStorage.setItem('zad_showcase_customized', 'true');
      idbSet('admin_cover_overrides', overrides);
    } catch (e) { }
    MEMORY_CACHE.delete(numId);
    window.dispatchEvent(new CustomEvent('zad_cover_overrides_changed', { detail: { bookId: numId, deleted: true } }));
  }
}

/**
 * Wipes all showcase book overrides so admin can start fresh from scratch.
 */
export function clearAllAdminCoverOverrides(): void {
  ADMIN_OVERRIDES_CACHE = {};
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('zad_admin_cover_overrides', JSON.stringify({}));
      localStorage.setItem('zad_showcase_customized', 'true');
      idbSet('admin_cover_overrides', {});
    } catch (e) { }
    MEMORY_CACHE.clear();
    window.dispatchEvent(new CustomEvent('zad_cover_overrides_changed', { detail: {} }));
  }
}

/**
 * Sets all admin cover overrides in one shot (e.g. loading classical defaults or importing).
 */
export function setAllAdminCoverOverrides(map: Record<number, AdminCoverOverride>): void {
  ADMIN_OVERRIDES_CACHE = map;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('zad_admin_cover_overrides', JSON.stringify(map));
      localStorage.setItem('zad_showcase_customized', 'true');
      idbSet('admin_cover_overrides', map);
    } catch (e) { }
    window.dispatchEvent(new CustomEvent('zad_cover_overrides_changed', { detail: map }));
  }
}

/**
 * Returns all books designated as showcase books in the home view, sorted by orderIndex.
 */
export function getShowcaseBooks(): AdminCoverOverride[] {
  const overrides = getAdminCoverOverrides();
  const deletedIds = getDeletedShowcaseIds();
  return Object.values(overrides)
    .filter(o => o.isShowcase && !deletedIds.has(o.bookId))
    .sort((a, b) => (a.orderIndex ?? 9999) - (b.orderIndex ?? 9999));
}

/**
 * Reorders showcase books based on an array of books or book IDs in the desired order.
 */
export async function reorderShowcaseBooks(orderedItems: (number | AdminCoverOverride)[]): Promise<void> {
  const overrides = getAdminCoverOverrides();

  orderedItems.forEach((item, idx) => {
    if (typeof item === 'number') {
      if (overrides[item]) {
        overrides[item] = {
          ...overrides[item],
          orderIndex: idx + 1,
          updatedAt: Date.now()
        };
      }
    } else {
      overrides[item.bookId] = {
        ...(overrides[item.bookId] || item),
        ...item,
        orderIndex: idx + 1,
        updatedAt: Date.now()
      };
      if (item.resolvedCoverUrl) {
        MEMORY_CACHE.set(item.bookId, item.resolvedCoverUrl);
      }
    }
  });

  ADMIN_OVERRIDES_CACHE = overrides;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('zad_admin_cover_overrides', JSON.stringify(overrides));
      await idbSet('admin_cover_overrides', overrides);
    } catch (e) { }
    window.dispatchEvent(new CustomEvent('zad_cover_overrides_changed', { detail: overrides }));
  }
}

/**
 * Extracts archive.org item identifier from any URL or path
 */
function extractArchiveId(str: string | undefined | null): string | null {
  if (!str) return null;
  const trimmed = str.trim();
  if (!trimmed) return null;

  // 1. Match archive.org/download/ID or archive/ID_=_ or archive.org/details/ID
  const m1 = trimmed.match(/archive\.org\/(?:download|details)\/([^/?#\s]+)/i);
  if (m1 && m1[1]) return m1[1];
  const m2 = trimmed.match(/archive\/([^_/]+)_=_/i);
  if (m2 && m2[1]) return m2[1];

  // 2. Match standard Waqf / Fiqh archive IDs like waq12345 or FP12345
  const m3 = trimmed.match(/\b(waq\d+|FP\d+)\b/i);
  if (m3 && m3[1]) return m3[1];

  // 3. Match clean folder or item name without slashes, like /ommfikr/ or /WAQmogni/ or ommfikr
  const clean = trimmed.replace(/^\/+|\/+$/g, '').trim();
  if (/^[a-zA-Z0-9_\.-]+$/.test(clean) && clean.length >= 3 && !/^\d+$/.test(clean)) {
    if (clean.toLowerCase().endsWith('.pdf')) {
      const withoutExt = clean.slice(0, -4).replace(/[-_]\d+$/, '').replace(/\d+$/, '');
      if (withoutExt.length >= 3 && !/^\d+$/.test(withoutExt)) {
        return withoutExt;
      }
    } else {
      return clean;
    }
  }

  return null;
}

/**
 * Generates an authentic, luxurious classical leather-bound Islamic book cover
 * rendered onto a canvas and returned as an optimized JPEG Data URL.
 */
function generateLeatherCoverDataUrl(title: string, author: string, category?: string): string {
  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  // Golden classical Arabic book ratio (1 : 1.4)
  canvas.width = 360;
  canvas.height = 504;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1. Determine rich Moroccan/Cordoban leather palette based on category
  const cat = (category || '').toLowerCase();
  let baseColor1 = '#1a2434'; // Deep obsidian navy leather
  let baseColor2 = '#0d131d';
  let baseColor3 = '#05070a';
  let accentGoldLight = '#fae19c';
  let accentGoldMid = '#d8b257';
  let accentGoldDark = '#8f6e25';

  if (cat.includes('حديث') || cat.includes('سنة')) {
    baseColor1 = '#123860'; // Royal Ottoman Sapphire
    baseColor2 = '#0a1d33';
    baseColor3 = '#030b14';
    accentGoldLight = '#fae6a8';
    accentGoldMid = '#dfbb62';
    accentGoldDark = '#94752c';
  } else if (cat.includes('فقه') || cat.includes('أصول') || cat.includes('معاملات')) {
    baseColor1 = '#124534'; // Deep Imperial Islamic Emerald
    baseColor2 = '#08251c';
    baseColor3 = '#03110c';
    accentGoldLight = '#fae19c';
    accentGoldMid = '#d4af37';
    accentGoldDark = '#8a6c22';
  } else if (cat.includes('عقيدة') || cat.includes('توحيد') || cat.includes('ملل')) {
    baseColor1 = '#3a164a'; // Imperial Royal Aubergine
    baseColor2 = '#1e0a27';
    baseColor3 = '#0b030f';
    accentGoldLight = '#fde3af';
    accentGoldMid = '#dcab52';
    accentGoldDark = '#8f6723';
  } else if (cat.includes('تفسير') || cat.includes('قرآن') || cat.includes('قراءات')) {
    baseColor1 = '#4a1520'; // Cordoban Deep Burgundy/Crimson
    baseColor2 = '#270a10';
    baseColor3 = '#0e0306';
    accentGoldLight = '#fae3a0';
    accentGoldMid = '#dcb457';
    accentGoldDark = '#947226';
  } else if (cat.includes('لغة') || cat.includes('معاجم') || cat.includes('نحو') || cat.includes('أدب') || cat.includes('شعر')) {
    baseColor1 = '#422515'; // Antique Damascene Saddle Walnut
    baseColor2 = '#231309';
    baseColor3 = '#0e0703';
    accentGoldLight = '#f8dfa4';
    accentGoldMid = '#d7b057';
    accentGoldDark = '#8a6a24';
  }

  // 2. Base Leather Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 360, 504);
  bgGrad.addColorStop(0, baseColor1);
  bgGrad.addColorStop(0.55, baseColor2);
  bgGrad.addColorStop(1, baseColor3);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 360, 504);

  // 3. Luxurious 3D Dome / Lighting Highlight (tactile leather sheen)
  const sheen = ctx.createRadialGradient(180, 170, 20, 180, 210, 270);
  sheen.addColorStop(0, 'rgba(255, 255, 255, 0.14)');
  sheen.addColorStop(0.45, 'rgba(255, 255, 255, 0.03)');
  sheen.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, 360, 504);

  // 4. Spine Binding (Right edge for Arabic RTL books) with Raised Leather Ribs
  const spineGrad = ctx.createLinearGradient(360, 0, 332, 0);
  spineGrad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
  spineGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.08)');
  spineGrad.addColorStop(0.85, 'rgba(0, 0, 0, 0.2)');
  spineGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = spineGrad;
  ctx.fillRect(328, 0, 32, 504);

  // Embossed gold spine rib marks
  [95, 200, 310, 415].forEach(y => {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(330, y);
    ctx.lineTo(360, y);
    ctx.stroke();

    ctx.strokeStyle = accentGoldMid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(330, y + 2);
    ctx.lineTo(360, y + 2);
    ctx.stroke();
  });

  // Left Outer Edge Bevel
  const leftBevel = ctx.createLinearGradient(0, 0, 14, 0);
  leftBevel.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
  leftBevel.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = leftBevel;
  ctx.fillRect(0, 0, 14, 504);

  // 5. Gold Foil Inset Borders (Traditional Arabesque Framing)
  const goldGrad = ctx.createLinearGradient(0, 0, 360, 504);
  goldGrad.addColorStop(0, accentGoldLight);
  goldGrad.addColorStop(0.5, accentGoldMid);
  goldGrad.addColorStop(1, accentGoldDark);

  // Outer Blind Deboss Leather Groove
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, 340, 484);

  // Outer Major Gold Foil Border
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 4;
  ctx.strokeStyle = goldGrad;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(16, 16, 328, 472);
  ctx.restore();

  // Inner Minor Gold Filigree Line
  ctx.strokeStyle = 'rgba(216, 178, 87, 0.45)';
  ctx.lineWidth = 1;
  ctx.strokeRect(22, 22, 316, 460);

  // 6. Four Ornate Andalusian 8-Point Star Corner Medallions
  const drawCornerStar = (cx: number, cy: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = accentGoldMid;
    ctx.fillStyle = accentGoldLight;
    ctx.lineWidth = 1.2;

    // Small outer diamond
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(9, 0);
    ctx.lineTo(0, 9);
    ctx.lineTo(-9, 0);
    ctx.closePath();
    ctx.stroke();

    // Rotated inner square
    ctx.strokeRect(-5, -5, 10, 10);

    // Center jewel
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  drawCornerStar(22, 22);
  drawCornerStar(338, 22);
  drawCornerStar(22, 482);
  drawCornerStar(338, 482);

  // 7. Header Calligraphic Basmala with Luminous Gold Foil
  ctx.save();
  ctx.shadowColor = accentGoldLight;
  ctx.shadowBlur = 6;
  ctx.fillStyle = accentGoldLight;
  ctx.font = 'bold 16px "Amiri", "Scheherazade New", serif';
  ctx.textAlign = 'center';
  ctx.fillText('✦  ﷽  ✦', 178, 58);
  ctx.restore();

  // 8. Grand Central Ornamental Arch Cartouche (إطار العنوان الملكي)
  ctx.save();
  // Cartouche Dark Velvet Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.roundRect(32, 92, 296, 218, 16);
  ctx.fill();

  // Cartouche Gold Border
  ctx.strokeStyle = goldGrad;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner Inset Filigree Frame
  ctx.strokeStyle = 'rgba(216, 178, 87, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(38, 98, 284, 206, 12);
  ctx.stroke();

  // Top Rosette Jewel on Cartouche
  ctx.fillStyle = accentGoldMid;
  ctx.beginPath();
  ctx.arc(180, 114, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(180, 114, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.restore();

  // 9. Book Title (Large, Prestigious, Perfectly Centered)
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = '#fff9ec';
  ctx.textAlign = 'center';

  const cleanTitle = title
    .replace(/\s*[-=]\s*(ط\.|طبعة|ت\.|تحقيق|دار).*$/i, '')
    .trim();

  // Dynamic adaptive typography size based on length
  let fontSize = 21;
  if (cleanTitle.length <= 18) {
    fontSize = 24;
  } else if (cleanTitle.length > 36) {
    fontSize = 17;
  }
  ctx.font = `bold ${fontSize}px "Amiri", "Scheherazade New", "Cairo", serif`;

  // Multiline wrapping
  const words = cleanTitle.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  const maxLineWidth = 250;

  for (const w of words) {
    const testLine = currentLine ? `${currentLine} ${w}` : w;
    if (ctx.measureText(testLine).width > maxLineWidth) {
      if (currentLine) lines.push(currentLine);
      currentLine = w;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  const displayLines = lines.slice(0, 4);
  const lineHeight = fontSize + 9;
  const totalTextHeight = displayLines.length * lineHeight;
  const startY = 195 - (totalTextHeight / 2) + (fontSize / 2);

  displayLines.forEach((line, i) => {
    ctx.fillText(line, 180, startY + (i * lineHeight));
  });
  ctx.restore();

  // 10. Author Ribbon Cartouche (شريط اسم المؤلف المذهب)
  if (author && author !== 'من غير معروف') {
    ctx.save();
    const ribbonY = 350;

    // Dark velvet banner with gold border
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.roundRect(46, ribbonY, 268, 52, 10);
    ctx.fill();

    ctx.strokeStyle = 'rgba(216, 178, 87, 0.7)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Side ornamental notch dots
    ctx.fillStyle = accentGoldMid;
    ctx.beginPath();
    ctx.arc(46, ribbonY + 26, 3, 0, Math.PI * 2);
    ctx.arc(314, ribbonY + 26, 3, 0, Math.PI * 2);
    ctx.fill();

    // "تأليف" Label
    ctx.fillStyle = accentGoldLight;
    ctx.font = 'bold 11px "Cairo", "Tajawal", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('• تأليف •', 180, ribbonY + 20);

    // Author Name in Warm Gold
    ctx.fillStyle = '#fff4db';
    ctx.font = 'bold 13.5px "Amiri", "Cairo", sans-serif';
    const displayAuthor = author.length > 30 ? author.slice(0, 28) + '...' : author;
    ctx.fillText(displayAuthor, 180, ribbonY + 40);
    ctx.restore();
  }

  // 11. Bottom Islamic Star Seal / Category Emblem
  ctx.save();
  ctx.fillStyle = accentGoldMid;
  ctx.font = 'bold 12px "Cairo", "Tajawal", sans-serif';
  ctx.textAlign = 'center';
  const label = category ? `❖ ${category} ❖` : '❖ مكتبة زاد التراثية ❖';
  ctx.fillText(label, 180, 452);
  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.9);
}

/**
 * Normalizes Arabic text for strict comparison (removes tashkeel, standardizes letters, removes non-alphanumeric)
 */
function normalizeArabicText(str: string): string {
  return (str || '')
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove tashkeel
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^\u0621-\u064A\w]/g, ' ') // remove punctuation, brackets, dashes
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Strips common book title prefixes like "كتاب" or "متن" for clean title matching
 */
function stripTitlePrefixes(norm: string): string {
  return norm.replace(/^(كتاب|متن)\s+/, '');
}

/**
 * Checks if a book accurately matches a curated featured book.
 * Strict criteria:
 * Strict normalized title equality (with author sanity check).
 * Never matches on ID alone or loose substring (`includes`), preventing commentaries (شرح),
 * summaries (مختصر/تجريد), or unrelated books from inheriting another book's cover.
 */
function findCuratedMatch(book: BookMeta) {
  if (!book) return null;
  const normBookTitle = stripTitlePrefixes(normalizeArabicText(book.title || ''));
  if (!normBookTitle) return null;

  const normAuthor = normalizeArabicText(book.author || '');

  return FEATURED_CLASSICAL_BOOKS.find(cb => {
    // Both normalized titles MUST match strictly:
    const normCuratedTitle = stripTitlePrefixes(normalizeArabicText(cb.title));
    if (normBookTitle !== normCuratedTitle) return false;

    // And if author is known on both, ensure author compatibility
    if (normAuthor && cb.author) {
      const normCuratedAuthor = normalizeArabicText(cb.author);
      const authorTokens = normCuratedAuthor.split(' ').filter(t => t.length > 3);
      const hasAuthorMatch = authorTokens.some(t => normAuthor.includes(t));
      if (!hasAuthorMatch && authorTokens.length > 0) {
        return false;
      }
    }
    return true;
  }) || null;
}

/**
 * Main Service: Resolves or generates the book cover image automatically.
 * Caches in IndexedDB so it loads in 0ms on subsequent visits.
 */
export async function resolveBookCover(book: BookMeta): Promise<string> {
  if (!book || !book.id) return '';
  const numId = Number(book.id);
  const cacheKey = `zad_cover_v6_${book.id}`;

  // 0. Highest Priority: Admin Explicit Cover Override
  const adminOverrides = getAdminCoverOverrides();
  if (adminOverrides[numId]?.resolvedCoverUrl) {
    const adminUrl = adminOverrides[numId].resolvedCoverUrl;
    MEMORY_CACHE.set(book.id, adminUrl);
    return adminUrl;
  }

  // 1. Check in-memory sync cache
  if (MEMORY_CACHE.has(book.id)) {
    return MEMORY_CACHE.get(book.id)!;
  }

  // 2. Check curated classical books (highest fidelity local images) - STRICT matching only
  const curated = findCuratedMatch(book);
  if (curated) {
    MEMORY_CACHE.set(book.id, curated.coverUrl);
    return curated.coverUrl;
  }

  // 3. Check persistent IndexedDB cache (v6)
  try {
    const cached = await idbGet<string>(cacheKey);
    if (cached) {
      MEMORY_CACHE.set(book.id, cached);
      return cached;
    }
  } catch (e) { }

  // 4. Check if book metadata already has direct cover
  if (book.cover_url || book.cover) {
    const direct = book.cover_url || book.cover!;
    MEMORY_CACHE.set(book.id, direct);
    try { await idbSet(cacheKey, direct); } catch { }
    return direct;
  }

  // 5. Try extracting archive.org PDF cover
  let archiveId = extractArchiveId(book.pdf_url);
  if (!archiveId && book.pdf_links) {
    archiveId = extractArchiveId(book.pdf_links.root) ||
      (Array.isArray(book.pdf_links.files) && book.pdf_links.files[0] ? extractArchiveId(book.pdf_links.files[0]) : null);
  }

  // If not in local metadata, try fetching book indexes from Turath API in background (with quick timeout)
  if (!archiveId) {
    try {
      const idxData = await fetchTurathBookIndexes(Number(book.id));
      if (idxData?.meta?.pdf_links) {
        archiveId = extractArchiveId(idxData.meta.pdf_links.root) ||
          (Array.isArray(idxData.meta.pdf_links.files) ? extractArchiveId(idxData.meta.pdf_links.files[0]) : null);
      }
    } catch { }
  }

  if (archiveId) {
    const archiveCoverUrl = `https://archive.org/services/img/${archiveId}`;
    MEMORY_CACHE.set(book.id, archiveCoverUrl);
    try { await idbSet(cacheKey, archiveCoverUrl); } catch { }
    return archiveCoverUrl;
  }

  // 5.5 Extract page 1 from direct Turath PDF
  try {
    const directPdfUrl = await fetchTurathBookPdfUrl(Number(book.id));
    if (directPdfUrl) {
      const pdfCover = await renderPdfFirstPageToDataUrl(directPdfUrl);
      if (pdfCover) {
        MEMORY_CACHE.set(book.id, pdfCover);
        try { await idbSet(cacheKey, pdfCover); } catch { }
        return pdfCover;
      }
    }
  } catch { }

  // 6. Search Archive.org / Waqfeya for the authentic scanned cover if not linked in Turath
  if (book.title) {
    const onlineScannedCover = await searchArchiveOrgCover(book.title);
    if (onlineScannedCover) {
      MEMORY_CACHE.set(book.id, onlineScannedCover);
      try { await idbSet(cacheKey, onlineScannedCover); } catch { }
      return onlineScannedCover;
    }
  }

  // 7. Automated Luxury Leather Cover Generation (for remaining books without scanned copies)
  // Generates once, stores in IndexedDB, and serves instantaneously
  const generatedCover = generateLeatherCoverDataUrl(
    book.title || 'كتاب بدون عنوان',
    book.author || '',
    book.category
  );

  if (generatedCover) {
    MEMORY_CACHE.set(book.id, generatedCover);
    try { await idbSet(cacheKey, generatedCover); } catch { }
    return generatedCover;
  }

  return '';
}

/**
 * Searches Archive.org / Waqfeya for the actual scanned edition cover with timeout
 */
async function searchArchiveOrgCover(title: string): Promise<string | null> {
  const clean = title
    .replace(/\s*[-=]\s*(ط\.|طبعة|ت\.|تحقيق|دار).*$/i, '')
    .replace(/[^\u0621-\u064A\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean || clean.length < 3) return null;

  try {
    const query = encodeURIComponent(`title:("${clean}") AND mediatype:(texts)`);
    const url = `https://archive.org/advancedsearch.php?q=${query}&fl[]=identifier,title&sort[]=downloads+desc&rows=3&output=json`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      const docs = data?.response?.docs;
      if (Array.isArray(docs) && docs.length > 0 && docs[0].identifier) {
        return `https://archive.org/services/img/${docs[0].identifier}`;
      }
    }
  } catch (e) {
    // Fallback silently without blocking
  }
  return null;
}

/**
 * Synchronous cover lookup: guarantees instant 0ms cover at frame 1!
 * If not in memory or curated, generates luxury tailored leather cover on the fly.
 * Eliminates all delays, blank cards, and layout shifts completely.
 */
export function getSynchronousCachedCover(book: BookMeta): string | null {
  if (!book || !book.id) return null;
  const numId = Number(book.id);

  // 0. Highest Priority: Admin Explicit Cover Override
  const adminOverrides = getAdminCoverOverrides();
  if (adminOverrides[numId]?.resolvedCoverUrl) {
    const adminUrl = adminOverrides[numId].resolvedCoverUrl;
    MEMORY_CACHE.set(book.id, adminUrl);
    return adminUrl;
  }

  if (MEMORY_CACHE.has(book.id)) return MEMORY_CACHE.get(book.id)!;

  const curated = findCuratedMatch(book);
  if (curated) {
    MEMORY_CACHE.set(book.id, curated.coverUrl);
    return curated.coverUrl;
  }

  if (book.cover_url || book.cover) {
    const direct = book.cover_url || book.cover!;
    MEMORY_CACHE.set(book.id, direct);
    return direct;
  }

  let archiveId = extractArchiveId(book.pdf_url);
  if (!archiveId && book.pdf_links) {
    archiveId = extractArchiveId(book.pdf_links.root) ||
      (Array.isArray(book.pdf_links.files) && book.pdf_links.files[0] ? extractArchiveId(book.pdf_links.files[0]) : null);
  }
  if (archiveId) {
    const archiveUrl = `https://archive.org/services/img/${archiveId}`;
    MEMORY_CACHE.set(book.id, archiveUrl);
    return archiveUrl;
  }

  // Instant 0ms synchronous leather cover (no waiting, no blank space!)
  const instantLeather = generateLeatherCoverDataUrl(
    book.title || 'كتاب بدون عنوان',
    book.author || '',
    book.category
  );
  if (instantLeather) {
    MEMORY_CACHE.set(book.id, instantLeather);
    return instantLeather;
  }

  return null;
}
