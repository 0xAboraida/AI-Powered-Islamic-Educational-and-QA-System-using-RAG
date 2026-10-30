/**
 * Simple, robust, zero-dependency IndexedDB storage wrapper.
 * Designed to store large datasets (e.g., Turath index 2.5MB+) safely
 * without hitting the localStorage 5MB quota limit.
 */

const DB_NAME = 'zad_platform_cache';
const STORE_NAME = 'keyval_store';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

export async function idbGet<T = any>(key: string): Promise<T | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result !== undefined ? request.result : null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn('IndexedDB get error:', err);
    return null;
  }
}

export async function idbSet(key: string, value: any): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn('IndexedDB set error:', err);
  }
}

export async function idbDelete(key: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn('IndexedDB delete error:', err);
  }
}

// -------------------------------------------------------------
// Study Mode: Per-Book On-Demand Caching Helpers
// -------------------------------------------------------------

export async function idbGetBookTree<T = any>(bookTitle: string): Promise<T | null> {
  return idbGet<T>(`zad_study_book_${bookTitle}`);
}

export async function idbSetBookTree(bookTitle: string, bookData: any): Promise<void> {
  return idbSet(`zad_study_book_${bookTitle}`, bookData);
}

export async function idbGetCachedBookTitles(): Promise<string[]> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAllKeys();

      request.onsuccess = () => {
        const keys = (request.result || []) as string[];
        const bookTitles = keys
          .filter((k) => typeof k === 'string' && k.startsWith('zad_study_book_'))
          .map((k) => k.replace('zad_study_book_', ''));
        resolve(bookTitles);
      };

      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function idbClearAllBookTrees(): Promise<void> {
  try {
    const titles = await idbGetCachedBookTitles();
    for (const title of titles) {
      await idbDelete(`zad_study_book_${title}`);
    }
  } catch (e) {
    console.warn('Error clearing book trees:', e);
  }
}

// -------------------------------------------------------------
// Turath Global Mode: Per-Book On-Demand Caching Helpers
// -------------------------------------------------------------

export async function idbGetTurathBookTree<T = any>(turathId: number | string): Promise<T | null> {
  return idbGet<T>(`zad_turath_book_${turathId}`);
}

export async function idbSetTurathBookTree(turathId: number | string, bookData: any): Promise<void> {
  return idbSet(`zad_turath_book_${turathId}`, bookData);
}

export async function idbGetCachedTurathBookIds(): Promise<string[]> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAllKeys();

      request.onsuccess = () => {
        const keys = (request.result || []) as string[];
        const ids = keys
          .filter((k) => typeof k === 'string' && k.startsWith('zad_turath_book_'))
          .map((k) => k.replace('zad_turath_book_', ''));
        resolve(ids);
      };

      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function idbDeleteTurathBookTree(turathId: number | string): Promise<void> {
  return idbDelete(`zad_turath_book_${turathId}`);
}

export async function idbClearAllTurathBookTrees(): Promise<void> {
  try {
    const ids = await idbGetCachedTurathBookIds();
    for (const id of ids) {
      await idbDelete(`zad_turath_book_${id}`);
    }
  } catch (e) {
    console.warn('Error clearing Turath book trees:', e);
  }
}

// -------------------------------------------------------------
// Offline Books Storage Helpers
// -------------------------------------------------------------

export interface OfflineBookPackage {
  bookId: number | string;
  title: string;
  author?: string;
  indexes?: any;
  cachedPages: Record<number | string, { text: string; main?: string }>;
  savedAt: number;
}

export async function idbSaveBookOffline(pkg: OfflineBookPackage): Promise<void> {
  await idbSet(`zad_offline_book_${pkg.bookId}`, pkg);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('zad-offline-books-changed'));
  }
}

export async function idbGetOfflineBook(bookId: number | string): Promise<OfflineBookPackage | null> {
  return idbGet<OfflineBookPackage>(`zad_offline_book_${bookId}`);
}

export async function idbIsBookSavedOffline(bookId: number | string): Promise<boolean> {
  const pkg = await idbGet(`zad_offline_book_${bookId}`);
  return pkg !== null;
}

export async function idbRemoveOfflineBook(bookId: number | string): Promise<void> {
  await idbDelete(`zad_offline_book_${bookId}`);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('zad-offline-books-changed'));
  }
}

export async function idbGetAllOfflineBookPackages(): Promise<OfflineBookPackage[]> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.openCursor();
      const packages: OfflineBookPackage[] = [];

      request.onsuccess = (event: any) => {
        const cursor = event.target?.result as IDBCursorWithValue | null;
        if (cursor) {
          if (typeof cursor.key === 'string' && cursor.key.startsWith('zad_offline_book_')) {
            packages.push(cursor.value as OfflineBookPackage);
          }
          cursor.continue();
        } else {
          resolve(packages);
        }
      };

      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}
