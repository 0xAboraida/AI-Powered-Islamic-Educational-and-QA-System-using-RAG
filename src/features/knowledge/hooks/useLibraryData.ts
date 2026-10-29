import { useState, useMemo, useEffect } from 'react';
import { BookMeta, LibraryAnalytics, MainTab } from '../types/bookTypes';
import {
  CENTURY_NAMES_MAP,
  normalizeBook,
  inferCenturyAndDeath,
  lookupAuthorDeathYear
} from '../utils/turathMeta';
import { normalizeArabicText, createTurathSearchRegex, stripTashkeel } from '../utils/arabicText';
import { idbGet, idbSet } from '../../../utils/indexedDbStorage';
import { searchTurathCorpus } from '../../../api/turathApi';

interface UseLibraryDataProps {
  query: string;
  selectedDomain: string;
  filterAuthor: string;
  selectedCentury: string;
  sortAsc: boolean;
  activeMainTab: MainTab;
  categorySearch: string;
  authorSearch: string;
  currentSearchValue: string;
  selectedAuthor: string | null;
  favoriteBookIds: Set<string | number>;
}

export function useLibraryData({
  query,
  selectedDomain,
  filterAuthor,
  selectedCentury,
  sortAsc,
  activeMainTab,
  categorySearch,
  authorSearch,
  currentSearchValue,
  selectedAuthor,
  favoriteBookIds,
}: UseLibraryDataProps) {
  // 1. Featured Books Set (المختارة)
  const [featuredBookIds, setFeaturedBookIds] = useState<Set<number | string>>(() => {
    try {
      const saved = localStorage.getItem('zad_featured_book_ids');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch (e) { }
    return new Set();
  });

  useEffect(() => {
    const syncFeatured = () => {
      try {
        const saved = localStorage.getItem('zad_featured_book_ids');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setFeaturedBookIds(new Set(parsed));
        } else {
          setFeaturedBookIds(new Set());
        }
      } catch (e) { }
    };
    window.addEventListener('zad_featured_books_changed', syncFeatured);
    window.addEventListener('storage', syncFeatured);
    return () => {
      window.removeEventListener('zad_featured_books_changed', syncFeatured);
      window.removeEventListener('storage', syncFeatured);
    };
  }, []);

  // 2. Data & Analytics State
  const [publishedBooks, setPublishedBooks] = useState<BookMeta[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [analytics, setAnalytics] = useState<LibraryAnalytics | null>(null);
  const [turathMatchedBookIds, setTurathMatchedBookIds] = useState<Set<number>>(new Set());

  // Listen for admin changes in published books in real-time
  useEffect(() => {
    const handleBooksSync = async () => {
      try {
        const idbBooks = await idbGet<BookMeta[]>('admin_published_books');
        if (idbBooks && Array.isArray(idbBooks) && idbBooks.length > 0) {
          setPublishedBooks(idbBooks.map(normalizeBook));
        }
      } catch (e) { }
    };
    window.addEventListener('zad_library_books_changed', handleBooksSync);
    return () => {
      window.removeEventListener('zad_library_books_changed', handleBooksSync);
    };
  }, []);

  const getBaseUrl = () => import.meta.env.VITE_DATA_INGESTION_URL || 'https://abourida-zad-tutor-engine-space.hf.space';

  // 3. Instant Cache Hydration from IndexedDB / local static catalog & Fresh Network Sync
  useEffect(() => {
    const fetchLibraryData = async () => {
      try {
        // Clean legacy localStorage keys that hit the 5MB quota limit
        try {
          localStorage.removeItem('zad_cached_library_books_v4');
          localStorage.removeItem('zad_cached_library_books_v5');
          localStorage.removeItem('zad_cached_library_books_v6');
          localStorage.removeItem('zad_cached_library_books_v7');
        } catch { }

        const getDeletedPlatformBookIds = (): Set<number> => {
          try {
            const raw = typeof window !== 'undefined' ? localStorage.getItem('zad_deleted_library_book_ids') : null;
            if (raw) {
              const arr = JSON.parse(raw);
              if (Array.isArray(arr)) return new Set(arr.map(Number));
            }
          } catch { }
          return new Set();
        };

        const filterDeleted = (bks: BookMeta[]) => {
          const deleted = getDeletedPlatformBookIds();
          return deleted.size > 0 ? bks.filter(b => !deleted.has(b.id)) : bks;
        };

        // 1. Try instant IndexedDB cache
        let loaded = false;
        try {
          const idbBooks = await idbGet<BookMeta[]>('admin_published_books');
          if (idbBooks && Array.isArray(idbBooks) && idbBooks.length > 50) {
            setPublishedBooks(filterDeleted(idbBooks.map(normalizeBook)));
            setLoading(false);
            loaded = true;
          }
        } catch (e) { }

        // 2. Instant static catalog hydration if IndexedDB was empty
        if (!loaded) {
          try {
            const localRes = await fetch('/data/libraryCatalog.json');
            if (localRes.ok) {
              const localBooks = await localRes.json();
              if (Array.isArray(localBooks) && localBooks.length > 0) {
                const normalized = filterDeleted(localBooks.map(normalizeBook));
                setPublishedBooks(normalized);
                setLoading(false);
                loaded = true;
                idbSet('admin_published_books', normalized);
              }
            }
          } catch (localErr) {
            console.warn("Could not load local static catalog:", localErr);
          }
        }

        // 3. Fresh background network sync from remote engine with timeout protection
        const baseUrl = getBaseUrl();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        let resBooks: Response | null = null;
        try {
          resBooks = await fetch(`${baseUrl}/api/v1/data-ingestion/admin/library-books`, { signal: controller.signal });
          if (!resBooks.ok) {
            resBooks = await fetch(`${baseUrl}/api/v1/data-ingestion/admin/published-books`, { signal: controller.signal });
          }
        } catch (fetchErr) {
          // Timeout or network unreachable - perfectly fine since local catalog is already loaded
        } finally {
          clearTimeout(timeoutId);
        }

        if (resBooks && resBooks.ok) {
          const data = await resBooks.json();
          const rawBooks = Array.isArray(data.books) ? data.books : [];
          if (rawBooks.length > 0) {
            const books = filterDeleted(rawBooks.map(normalizeBook));
            setPublishedBooks(books);
            idbSet('admin_published_books', books);
          }
        }

        // 4. Analytics fetch
        try {
          const resAnalytics = await fetch(`${baseUrl}/api/v1/data-ingestion/admin/library-analytics`);
          if (resAnalytics.ok) {
            const dataAnalytics = await resAnalytics.json();
            setAnalytics(dataAnalytics);
          }
        } catch (err) { }
      } catch (err) {
        console.error("Error loading library data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLibraryData();
  }, []);

  // 4. Pre-indexed normalized books for sub-millisecond instant search
  const indexedBooks = useMemo(() => {
    return publishedBooks.map(b => {
      const _normTitle = normalizeArabicText(b.title || '');
      const _normAuthor = normalizeArabicText(b.author || '');
      const _normCategory = normalizeArabicText(b.category || '');
      const _normBlob = `${_normTitle} ${_normAuthor} ${_normCategory}`;
      return {
        ...b,
        _normTitle,
        _normAuthor,
        _normCategory,
        _normBlob,
      };
    });
  }, [publishedBooks]);

  // 4. Favorite Books List Computed
  const favoriteBooksList = useMemo(() => {
    return publishedBooks.filter(b => favoriteBookIds.has(b.id) || favoriteBookIds.has(b.title));
  }, [publishedBooks, favoriteBookIds]);

  // Turath Cloud Search Engine Results (بحث تراث المباشر) - runs quietly in background
  useEffect(() => {
    const q = (currentSearchValue || query || categorySearch).trim();
    if (!q || q.length < 2) {
      setTurathMatchedBookIds(new Set());
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await searchTurathCorpus(q);
        if (res && Array.isArray(res.data) && !cancelled) {
          const ids = new Set<number>();
          res.data.forEach(hit => {
            if (hit.book_id) ids.add(Number(hit.book_id));
          });
          setTurathMatchedBookIds(ids);
        }
      } catch { }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [currentSearchValue, query, categorySearch]);

  // 5. Live Floating Search Results for Library Home Popover (Ultra-Fast Instant In-Memory)
  const homeSearchResults = useMemo(() => {
    const rawQ = (currentSearchValue || query).trim();
    const hasFilter = selectedDomain !== 'all' || filterAuthor !== 'all';
    if (!rawQ && !hasFilter) return [];
    const normQ = normalizeArabicText(rawQ);

    const exactMatches: BookMeta[] = [];
    const prefixMatches: BookMeta[] = [];
    const substringMatches: BookMeta[] = [];
    const authorMatches: BookMeta[] = [];
    const otherMatches: BookMeta[] = [];

    const MAX_POP_RESULTS = 32;

    for (let i = 0; i < indexedBooks.length; i++) {
      const b = indexedBooks[i];
      if (selectedDomain !== 'all' && b.category !== selectedDomain) continue;
      if (filterAuthor !== 'all' && b.author !== filterAuthor) continue;

      if (!normQ) {
        exactMatches.push(b);
        if (exactMatches.length >= MAX_POP_RESULTS) break;
        continue;
      }

      const t = b._normTitle;
      const a = b._normAuthor;

      if (t === normQ) {
        exactMatches.push(b);
      } else if (t.startsWith(normQ)) {
        prefixMatches.push(b);
      } else if (t.includes(normQ)) {
        substringMatches.push(b);
      } else if (a && (a === normQ || a.startsWith(normQ) || a.includes(normQ))) {
        authorMatches.push(b);
      } else if (b.id && turathMatchedBookIds.has(Number(b.id))) {
        otherMatches.push(b);
      }
    }

    return [
      ...exactMatches,
      ...prefixMatches,
      ...substringMatches,
      ...authorMatches,
      ...otherMatches
    ].slice(0, MAX_POP_RESULTS);
  }, [indexedBooks, currentSearchValue, query, selectedDomain, filterAuthor, turathMatchedBookIds]);

  // 6. Dynamic Domains List
  const availableDomains = useMemo(() => {
    const counts: Record<string, number> = {};
    publishedBooks.forEach(b => {
      const cat = b.category || 'أخرى';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [publishedBooks]);

  // 7. Dynamic Authors List for Dropdown
  const availableAuthors = useMemo(() => {
    const counts: Record<string, number> = {};
    publishedBooks.forEach(b => {
      const author = b.author?.trim();
      if (author && author !== 'من غير معروف') {
        counts[author] = (counts[author] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [publishedBooks]);

  // 8. Dynamic Century List
  const availableCenturies = useMemo(() => {
    const counts: Record<number, number> = {};
    publishedBooks.forEach(b => {
      const { century } = inferCenturyAndDeath(b);
      if (century) {
        counts[century] = (counts[century] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([centuryStr, count]) => {
        const c = parseInt(centuryStr, 10);
        return {
          century: c,
          name: CENTURY_NAMES_MAP[c] || `القرن ${c} هـ`,
          count
        };
      })
      .sort((a, b) => a.century - b.century);
  }, [publishedBooks]);

  // 9. Live DB Analytics
  const liveStats = useMemo(() => {
    if (analytics && analytics.total_books > 0) {
      const earliest = (analytics.timeline?.earliest_century && analytics.timeline.earliest_century < 14)
        ? analytics.timeline.earliest_century
        : (availableCenturies[0]?.century && availableCenturies[0].century < 14 ? availableCenturies[0].century : 2);
      const latest = (analytics.timeline?.latest_century && analytics.timeline.latest_century >= earliest)
        ? analytics.timeline.latest_century
        : 15;

      return {
        ...analytics,
        centuries: (analytics.centuries && analytics.centuries.length > 5) ? analytics.centuries : availableCenturies,
        timeline: {
          earliest_century: earliest,
          latest_century: latest
        }
      };
    }

    const uniqueAuthors = new Set(publishedBooks.map(b => b.author).filter(Boolean));
    return {
      total_books: publishedBooks.length,
      total_authors: uniqueAuthors.size,
      total_domains: availableDomains.length,
      domains: availableDomains,
      centuries: availableCenturies,
      timeline: {
        earliest_century: availableCenturies[0]?.century || 2,
        latest_century: availableCenturies[availableCenturies.length - 1]?.century || 15
      }
    };
  }, [analytics, publishedBooks, availableDomains, availableCenturies]);

  // 10. Tab 1 Filtering & Ascending Chronological Sorting (Ultra-Fast)
  const filteredAndSortedBooks = useMemo(() => {
    let result = [...indexedBooks];

    if (activeMainTab === 'featured') {
      if (featuredBookIds.size > 0) {
        result = result.filter(b => featuredBookIds.has(b.id) || featuredBookIds.has(b.title));
      } else {
        result = [];
      }
    }

    if (query.trim()) {
      const normQ = normalizeArabicText(query.trim());
      result = result.filter(b => b._normBlob.includes(normQ));
    }

    if (selectedDomain !== 'all') {
      result = result.filter(b => b.category === selectedDomain);
    }

    if (filterAuthor !== 'all') {
      result = result.filter(b => b.author === filterAuthor);
    }

    if (selectedCentury !== 'all') {
      const targetCentury = parseInt(selectedCentury, 10);
      result = result.filter(b => {
        const { century } = inferCenturyAndDeath(b);
        return century === targetCentury;
      });
    }

    result.sort((a, b) => {
      const metaA = inferCenturyAndDeath(a);
      const metaB = inferCenturyAndDeath(b);
      const scoreA = metaA.deathYear ?? (metaA.century ? metaA.century * 100 : 9999);
      const scoreB = metaB.deathYear ?? (metaB.century ? metaB.century * 100 : 9999);

      if (scoreA !== scoreB) {
        return sortAsc ? scoreA - scoreB : scoreB - scoreA;
      }
      return (a.title || '').localeCompare(b.title || '', 'ar');
    });

    return result;
  }, [indexedBooks, query, selectedDomain, filterAuthor, selectedCentury, sortAsc, activeMainTab, featuredBookIds]);

  // 11. Tab 2: Grouping Books by Categories
  const baseCategorySortedMap = useMemo(() => {
    const map: Record<string, (BookMeta & { _normBlob?: string })[]> = {};
    indexedBooks.forEach(b => {
      const cat = b.category || 'أخرى';
      if (!map[cat]) map[cat] = [];
      map[cat].push(b);
    });

    Object.keys(map).forEach(cat => {
      map[cat].sort((a, b) => {
        const metaA = inferCenturyAndDeath(a);
        const metaB = inferCenturyAndDeath(b);
        const scoreA = metaA.deathYear ?? (metaA.century ? metaA.century * 100 : 9999);
        const scoreB = metaB.deathYear ?? (metaB.century ? metaB.century * 100 : 9999);
        return scoreA - scoreB;
      });
    });

    return map;
  }, [indexedBooks]);

  const booksByCategory = useMemo(() => {
    let list = availableDomains.map(d => ({
      name: d.name,
      count: d.count,
      books: baseCategorySortedMap[d.name] || []
    }));

    if (selectedDomain !== 'all') {
      list = list.filter(cat => cat.name === selectedDomain);
    }

    if (filterAuthor !== 'all') {
      list = list.map(cat => ({
        ...cat,
        books: cat.books.filter(b => b.author === filterAuthor)
      })).filter(cat => cat.books.length > 0);
    }

    const trimmed = categorySearch.trim();
    if (trimmed) {
      const normQ = normalizeArabicText(trimmed);
      list = list
        .map(cat => {
          const catMatches = normalizeArabicText(cat.name).includes(normQ);
          const matchingBooks = cat.books.filter(b =>
            b._normBlob ? b._normBlob.includes(normQ) : (
              normalizeArabicText(b.title).includes(normQ) ||
              normalizeArabicText(b.author).includes(normQ)
            )
          );

          if (matchingBooks.length > 0) {
            return {
              ...cat,
              count: matchingBooks.length,
              books: matchingBooks,
            };
          }

          if (catMatches) {
            return cat;
          }

          return null;
        })
        .filter((cat): cat is { name: string; count: number; books: BookMeta[] } => cat !== null);
    }

    return list;
  }, [baseCategorySortedMap, availableDomains, categorySearch, selectedDomain, filterAuthor]);

  // 12. Tab 3: Grouping Authors by Centuries
  const authorsByCentury = useMemo(() => {
    const map: Record<number, {
      century: number;
      centuryName: string;
      authors: Record<string, {
        authorName: string;
        deathYear: number | null;
        centuryName: string;
        sampleBook: BookMeta;
        books: BookMeta[];
      }>;
    }> = {};

    publishedBooks.forEach(b => {
      const { deathYear, century, centuryName } = inferCenturyAndDeath(b);
      const c = century || 15;
      const cName = centuryName !== 'غير محدد' ? centuryName : (CENTURY_NAMES_MAP[c] || `القرن ${c} هـ`);

      if (!map[c]) {
        map[c] = {
          century: c,
          centuryName: cName,
          authors: {}
        };
      }

      const authorKey = (b.author || 'مؤلف غير معروف').trim();
      if (!map[c].authors[authorKey]) {
        map[c].authors[authorKey] = {
          authorName: authorKey,
          deathYear,
          centuryName: cName,
          sampleBook: b,
          books: []
        };
      }
      map[c].authors[authorKey].books.push(b);
      if (deathYear && !map[c].authors[authorKey].deathYear) {
        map[c].authors[authorKey].deathYear = deathYear;
      }
    });

    let centuriesList = Object.values(map).map(cGroup => ({
      century: cGroup.century,
      centuryName: cGroup.centuryName,
      totalBooks: Object.values(cGroup.authors).reduce((sum, a) => sum + a.books.length, 0),
      authors: Object.values(cGroup.authors).sort((a, b) => {
        if (a.deathYear && b.deathYear) return a.deathYear - b.deathYear;
        return a.authorName.localeCompare(b.authorName, 'ar');
      })
    })).sort((a, b) => a.century - b.century);

    if (selectedDomain !== 'all') {
      centuriesList = centuriesList.map(cGroup => ({
        ...cGroup,
        authors: cGroup.authors.filter(a => a.books.some(b => b.category === selectedDomain))
      })).filter(cGroup => cGroup.authors.length > 0);
    }

    if (filterAuthor !== 'all') {
      centuriesList = centuriesList.map(cGroup => ({
        ...cGroup,
        authors: cGroup.authors.filter(a => a.authorName === filterAuthor)
      })).filter(cGroup => cGroup.authors.length > 0);
    }

    if (authorSearch && authorSearch.trim()) {
      const reg = createTurathSearchRegex(authorSearch.trim());
      if (reg) {
        centuriesList = centuriesList.map(cGroup => ({
          ...cGroup,
          authors: (cGroup.authors || []).filter(a => a && a.authorName && reg.test(stripTashkeel(a.authorName)))
        })).filter(cGroup => cGroup.authors.length > 0);
      } else {
        const normQ = normalizeArabicText(authorSearch.trim());
        centuriesList = centuriesList.map(cGroup => ({
          ...cGroup,
          authors: (cGroup.authors || []).filter(a => a && a.authorName && normalizeArabicText(a.authorName).includes(normQ))
        })).filter(cGroup => cGroup.authors.length > 0);
      }
    }

    return centuriesList;
  }, [publishedBooks, authorSearch, selectedDomain, filterAuthor]);

  // 13. Selected Author Object
  const currentAuthorData = useMemo(() => {
    if (!selectedAuthor) return null;

    const cleanRaw = (str: string) =>
      str
        .replace(/\s*\([^\)]*\)/g, '') // remove (ت 142هـ)
        .replace(/^(الشيخ|الإمام|العلامة|الحافظ|الدكتور|د\.)\s+/, '')
        .replace(/\bابن\b/g, 'بن')
        .trim();

    const cleanSelected = cleanRaw(selectedAuthor);

    // 1. Direct or fuzzy match in authorsByCentury
    for (const cGroup of authorsByCentury) {
      const found = cGroup.authors.find(a => {
        if (a.authorName === selectedAuthor) return true;
        const cleanA = cleanRaw(a.authorName);
        return (
          cleanA === cleanSelected ||
          cleanA.includes(cleanSelected) ||
          cleanSelected.includes(cleanA)
        );
      });
      if (found) return found;
    }

    // 2. Direct or fuzzy match across all published books
    const authorBooks = publishedBooks.filter(b => {
      if (!b.author) return false;
      if (b.author === selectedAuthor) return true;
      const cleanB = cleanRaw(b.author);
      return (
        cleanB === cleanSelected ||
        cleanB.includes(cleanSelected) ||
        cleanSelected.includes(cleanB)
      );
    });

    if (authorBooks.length > 0) {
      const canonicalAuthor = authorBooks[0].author || selectedAuthor;
      const meta = inferCenturyAndDeath(authorBooks[0]);
      return {
        authorName: canonicalAuthor,
        deathYear: meta.deathYear,
        centuryName: meta.centuryName,
        sampleBook: authorBooks[0],
        books: authorBooks
      };
    }

    // Fallback so author page loads smoothly even before books are uploaded
    const isContemporary = selectedAuthor.includes('برهامي') || selectedAuthor.includes('المقدم');
    return {
      authorName: selectedAuthor,
      deathYear: isContemporary ? null : (lookupAuthorDeathYear(selectedAuthor) || null),
      centuryName: isContemporary ? 'القرن الخامس عشر هـ (معاصر)' : 'التراث الإسلامي',
      sampleBook: { id: 0, title: '', author: selectedAuthor, category: 'عام' } as any,
      books: []
    };
  }, [selectedAuthor, authorsByCentury, publishedBooks]);

  return {
    publishedBooks,
    setPublishedBooks,
    loading,
    analytics,
    liveStats,
    availableDomains,
    availableAuthors,
    availableCenturies,
    filteredAndSortedBooks,
    booksByCategory,
    authorsByCentury,
    currentAuthorData,
    homeSearchResults,
    favoriteBooksList,
    featuredBookIds,
    getBaseUrl,
  };
}
