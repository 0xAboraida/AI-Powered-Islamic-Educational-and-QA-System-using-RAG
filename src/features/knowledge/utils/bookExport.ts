import { BookMeta } from '../types/bookTypes';
import { fetchTurathPage, fetchTurathBookIndexes } from '../../../api/turathApi';
import { idbGetOfflineBook } from '../../../utils/indexedDbStorage';

export interface DownloadProgress {
  current: number;
  total: number;
  percent: number;
  status: string;
}

/**
 * Downloads full book content as formatted .txt or structured .json
 * Fetches actual book pages dynamically or pulls from IndexedDB offline storage
 */
export async function downloadBookFile(
  book: BookMeta,
  format: 'txt' | 'json',
  onProgress?: (p: DownloadProgress) => void
): Promise<void> {
  const turathId = typeof book.id === 'number' ? book.id : parseInt(String(book.id), 10);
  const pagesMap: Record<number, string> = {};

  // 1. Check if the book was already saved locally in IndexedDB
  try {
    const offlinePkg = await idbGetOfflineBook(book.id);
    if (offlinePkg && offlinePkg.cachedPages) {
      for (const [pgNum, pageData] of Object.entries(offlinePkg.cachedPages)) {
        if (pageData && pageData.text) {
          pagesMap[Number(pgNum)] = pageData.text;
        }
      }
    }
  } catch (err) {
    console.warn('Could not read offline pages from IndexedDB:', err);
  }

  // 2. If no offline pages cached, fetch pages from Turath API
  if (Object.keys(pagesMap).length === 0 && !isNaN(turathId) && turathId > 0) {
    onProgress?.({
      current: 0,
      total: 100,
      percent: 5,
      status: 'جاري جلب فهرس وبيانات الكتاب...'
    });

    let totalPages = book.page_count && book.page_count > 0 ? Math.min(book.page_count, 300) : 50;

    // Fetch index to check max page count accurately if available
    try {
      const idxRes = await fetchTurathBookIndexes(turathId);
      if (idxRes?.indexes?.page_map && Array.isArray(idxRes.indexes.page_map)) {
        totalPages = Math.min(idxRes.indexes.page_map.length - 1, 300);
      }
    } catch { }

    if (totalPages <= 0) totalPages = 50;

    // Batch fetch pages in chunks of 5 for optimal speed and reliability
    const BATCH_SIZE = 5;
    for (let p = 1; p <= totalPages; p += BATCH_SIZE) {
      const batchPromises: Promise<{ page: number; text: string | null }>[] = [];
      for (let i = 0; i < BATCH_SIZE && p + i <= totalPages; i++) {
        const pg = p + i;
        batchPromises.push(
          fetchTurathPage(turathId, pg)
            .then(res => ({ page: pg, text: res?.text || null }))
            .catch(() => ({ page: pg, text: null }))
        );
      }

      const results = await Promise.all(batchPromises);
      let anyFoundInBatch = false;
      for (const r of results) {
        if (r.text) {
          pagesMap[r.page] = r.text;
          anyFoundInBatch = true;
        }
      }

      const currentFetched = Math.min(p + BATCH_SIZE - 1, totalPages);
      const percent = Math.min(95, Math.round((currentFetched / totalPages) * 100));
      onProgress?.({
        current: currentFetched,
        total: totalPages,
        percent,
        status: `جاري تحميل نص الكتاب... (${currentFetched} من ${totalPages} صفحة)`
      });

      // If 2 consecutive batches return nothing, break early (reached end of book)
      if (!anyFoundInBatch && p > 10) {
        break;
      }
    }
  }

  onProgress?.({
    current: 100,
    total: 100,
    percent: 100,
    status: 'اكتمل التحميل! جاري تجهيز الملف للتنزيل...'
  });

  // 3. Generate file content
  let content = '';
  let filename = '';
  let mimeType = '';

  const sortedPageNumbers = Object.keys(pagesMap).map(Number).sort((a, b) => a - b);

  if (format === 'json') {
    filename = `${book.title || 'كتاب'}.json`;
    mimeType = 'application/json;charset=utf-8';
    content = JSON.stringify({
      id: book.id,
      title: book.title,
      author: book.author,
      category: book.category,
      death_year: book.death_year,
      century: book.century,
      total_pages_exported: sortedPageNumbers.length,
      info: book.info || '',
      pages: sortedPageNumbers.map(pg => ({
        page: pg,
        text: pagesMap[pg]
      })),
      source: 'زاد للذكاء الاصطناعي الإسلامي',
      exported_at: new Date().toISOString()
    }, null, 2);
  } else {
    filename = `${book.title || 'كتاب'} - ${book.author || 'المؤلف'}.txt`;
    mimeType = 'text/plain;charset=utf-8';

    const header = `======================================================
عنوان الكتاب: ${book.title || 'بدون عنوان'}
المؤلف: ${book.author || 'غير معروف'}
التصنيف والقسم: ${book.category || 'عام'}
${book.death_year ? `سنة الوفاة: ${book.death_year} هـ\n` : ''}${book.century_name ? `القرن: ${book.century_name}\n` : ''}عدد الصفحات المحملة: ${sortedPageNumbers.length} صفحة
======================================================

نبذة ومعلومات عن الكتاب:
${book.info || 'كتاب إسلامي من أمهات كتب التراث.'}

======================================================
                     متن ونصوص الكتاب
======================================================
`;

    const body = sortedPageNumbers.length > 0
      ? sortedPageNumbers.map(pg => `\n--- [ صفحة ${pg} ] ---\n${pagesMap[pg]}`).join('\n\n')
      : '\n(تعذر جلب صفحات المتن، يرجى التأكد من الاتصال بالإنترنت أو قراءة الكتاب مباشرة من قارئ زاد)\n';

    const footer = `\n\n------------------------------------------------------\nتم تصدير هذا الكتاب عبر منصة زاد للذكاء الاصطناعي الإسلامي\n`;

    content = (header + body + footer).trim();
  }

  // 4. Trigger browser download
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
