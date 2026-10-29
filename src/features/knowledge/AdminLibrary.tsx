import React, { useState, useEffect, useRef } from 'react';
import {
  Book, Folder, CheckCircle, Plus, Search, Loader2, Trash2, ChevronDown,
  AlertTriangle, Sparkles, Image as ImageIcon, Eye, Save, Star, RefreshCw, Check, ExternalLink,
  ArrowUp, ArrowDown, Tag, SlidersHorizontal, Layers, GripVertical, Download, Upload
} from 'lucide-react';
import { idbGet, idbSet } from '../../utils/indexedDbStorage';
import {
  getAdminCoverOverrides,
  saveAdminCoverOverride,
  removeAdminCoverOverride,
  resolveCoverSource,
  reorderShowcaseBooks,
  getDeletedShowcaseIds,
  clearDeletedShowcaseIds,
  unmarkShowcaseBookDeleted,
  clearAllAdminCoverOverrides,
  setAllAdminCoverOverrides,
  AdminCoverOverride
} from './services/bookCoverService';
import { FEATURED_CLASSICAL_BOOKS } from './data/curatedClassicalBooks';

// Helper functions for tracking permanently deleted platform books (so they never resurrect on refresh)
const getDeletedPlatformBookIds = (): Set<number> => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('zad_deleted_library_book_ids') : null;
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr.map(Number));
    }
  } catch (e) { }
  return new Set();
};

const markPlatformBookDeleted = (bookId: number) => {
  const set = getDeletedPlatformBookIds();
  set.add(Number(bookId));
  try {
    localStorage.setItem('zad_deleted_library_book_ids', JSON.stringify(Array.from(set)));
  } catch (e) { }
};

const unmarkPlatformBookDeleted = (bookId: number) => {
  const set = getDeletedPlatformBookIds();
  set.delete(Number(bookId));
  try {
    localStorage.setItem('zad_deleted_library_book_ids', JSON.stringify(Array.from(set)));
  } catch (e) { }
};

interface TurathBook {
  id: number;
  name: string;
  author_id?: number;
  author_name?: string;
  cat_id?: number;
  cat_name?: string;
}

interface TurathCategory {
  cat_id: number;
  name: string;
  count: number;
  books?: TurathBook[];
}

interface AdminLibraryProps {
  onExit?: () => void;
  onNavigateToIngestion?: () => void;
}

export default function AdminLibrary({ onExit, onNavigateToIngestion }: AdminLibraryProps) {
  const [activeTab, setActiveTab] = useState<'add' | 'manage' | 'featured' | 'covers'>('covers');
  const [categories, setCategories] = useState<TurathCategory[]>([]);
  const [publishedBooksList, setPublishedBooksList] = useState<TurathBook[]>([]);
  const [categoryBooksMap, setCategoryBooksMap] = useState<Record<number, TurathBook[]>>({});
  const [loadingCategory, setLoadingCategory] = useState<number | null>(null);
  const [searchResults, setSearchResults] = useState<TurathBook[]>([]);
  const [searching, setSearching] = useState(false);
  const [libraryBooks, setLibraryBooks] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
  const [selectedBooks, setSelectedBooks] = useState<TurathBook[]>([]);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedManageCategory, setExpandedManageCategory] = useState<number | null>(null);
  const [authorFilter, setAuthorFilter] = useState("all");
  const [authorsList, setAuthorsList] = useState<string[]>([]);
  const [catFilter, setCatFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const allCatalogBooksRef = useRef<TurathBook[]>([]);

  // Covers & Showcase Management State
  const [coverOverrides, setCoverOverrides] = useState<Record<number, AdminCoverOverride>>(() => getAdminCoverOverrides());
  const [coverSearchInput, setCoverSearchInput] = useState('');
  const [selectedBookForCover, setSelectedBookForCover] = useState<TurathBook | null>(null);
  const [coverSourceInput, setCoverSourceInput] = useState('');
  const [isShowcaseInput, setIsShowcaseInput] = useState(true);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [orderIndexInput, setOrderIndexInput] = useState<number>(1);
  const [coverTabFilter, setCoverTabFilter] = useState<'all' | 'showcase' | 'hidden'>('all');
  const [previewCoverUrl, setPreviewCoverUrl] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isSavingCover, setIsSavingCover] = useState(false);

  const [featuredBooksSet, setFeaturedBooksSet] = useState<Set<number | string>>(() => {
    try {
      const saved = localStorage.getItem('zad_featured_book_ids');
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr)) return new Set(arr);
      }
    } catch (e) { }
    return new Set();
  });
  const [featuredSearch, setFeaturedSearch] = useState('');
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' | 'info' }>({ show: false, message: '', type: 'success' });
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning';
  }>({ isOpen: false, title: '', message: '', onConfirm: () => { }, type: 'warning' });

  const toggleFeaturedBook = (bookId: number | string, bookTitle?: string) => {
    setFeaturedBooksSet(prev => {
      const next = new Set(prev);
      const isAlreadyIn = next.has(bookId) || (bookTitle && next.has(bookTitle));
      if (isAlreadyIn) {
        next.delete(bookId);
        if (bookTitle) next.delete(bookTitle);
        showToast('تمت إزالة الكتاب من قائمة المختارة', 'info');
      } else {
        next.add(bookId);
        if (bookTitle) next.add(bookTitle);
        showToast('تمت إضافة الكتاب إلى قائمة المختارة ✨', 'success');
      }
      const arr = Array.from(next);
      localStorage.setItem('zad_featured_book_ids', JSON.stringify(arr));
      window.dispatchEvent(new Event('zad_featured_books_changed'));
      return next;
    });
  };

  const RESULTS_PER_PAGE = 50;

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  // Debounce search input to prevent lagging while typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset pagination to page 1 when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, authorFilter, catFilter]);

  const getIngestionBaseUrl = () => import.meta.env.VITE_DATA_INGESTION_URL || 'https://Abourida-zad-rag-engine-v2.hf.space';

  const fetchData = async () => {
    // 1. Instant Cache Hydration: Load immediately from IndexedDB
    try {
      const [cachedCats, cachedPubBooks, cachedAuthors] = await Promise.all([
        idbGet<TurathCategory[]>('admin_turath_categories'),
        idbGet<TurathBook[]>('admin_published_books'),
        idbGet<string[]>('admin_turath_authors')
      ]);

      if (cachedCats && cachedCats.length > 0) {
        setCategories(cachedCats);
        allCatalogBooksRef.current = cachedCats.flatMap(c => c.books || []);
        const bMap: Record<number, TurathBook[]> = {};
        cachedCats.forEach(c => { bMap[c.cat_id] = c.books || []; });
        setCategoryBooksMap(bMap);

        if (cachedPubBooks) {
          setPublishedBooksList(cachedPubBooks);
          setLibraryBooks(new Set(cachedPubBooks.map((b: any) => b.id)));
        }
        if (cachedAuthors && cachedAuthors.length > 0) {
          setAuthorsList(cachedAuthors);
        }
        setLoading(false);
      }
    } catch (e) {
      console.warn("IndexedDB cache read error:", e);
    }

    // 2. Load Local Static Catalog (/data/turath_catalog.json) instantly
    try {
      const catRes = await fetch('/data/turath_catalog.json');
      if (catRes.ok) {
        const rawCatalog = await catRes.json();
        if (Array.isArray(rawCatalog) && rawCatalog.length > 0) {
          const parsedCats: TurathCategory[] = rawCatalog.map((cat: any, idx: number) => {
            const catId = idx + 1;
            const bks: TurathBook[] = (cat.children || []).map((b: any) => ({
              id: Number(b.turath_id),
              name: b.title,
              author_name: b.author,
              cat_id: catId,
              cat_name: cat.title
            }));
            return {
              cat_id: catId,
              name: cat.title,
              count: cat.children_count || bks.length,
              books: bks
            };
          });

          setCategories(parsedCats);
          allCatalogBooksRef.current = parsedCats.flatMap(c => c.books || []);
          const bMap: Record<number, TurathBook[]> = {};
          parsedCats.forEach(c => { bMap[c.cat_id] = c.books || []; });
          setCategoryBooksMap(bMap);

          const allAuthors = Array.from(new Set(allCatalogBooksRef.current.map(b => b.author_name).filter(Boolean) as string[])).sort();
          setAuthorsList(allAuthors);

          idbSet('admin_turath_categories', parsedCats);
          idbSet('admin_turath_authors', allAuthors);
        }
      }
    } catch (e) {
      console.warn("Could not load local turath_catalog.json:", e);
    }

    // 3. Sync published books list from MongoDB backend
    try {
      const baseUrl = getIngestionBaseUrl();
      const libRes = await fetch(`${baseUrl}/api/v1/data-ingestion/admin/library-books`);
      if (libRes.ok) {
        const libData = await libRes.json();
        const freshPubBooks: TurathBook[] = libData.books || [];
        const deletedIds = getDeletedPlatformBookIds();
        const filteredFresh = freshPubBooks.filter(b => !deletedIds.has(b.id));
        setPublishedBooksList(filteredFresh);
        setLibraryBooks(new Set(filteredFresh.map((b: any) => b.id)));

        idbSet('admin_published_books', filteredFresh);
        localStorage.setItem('zad_cached_library_books_v7', JSON.stringify(filteredFresh));
        localStorage.setItem('zad_library_synced', 'true');
        window.dispatchEvent(new Event('zad_library_books_changed'));
      }
    } catch (err) {
      console.error("Error fetching published books from backend:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleBook = (book: TurathBook) => {
    setSelectedBooks(prev => {
      const isSelected = prev.some(b => b.id === book.id);
      if (isSelected) {
        return prev.filter(b => b.id !== book.id);
      } else {
        return [...prev, book];
      }
    });
  };

  const handleSelectAllInCategory = (categoryId: number, books: TurathBook[]) => {
    const unaddedBooks = books.filter(b => !libraryBooks.has(b.id));
    const allSelected = unaddedBooks.every(b => selectedBooks.some(sb => sb.id === b.id));

    if (allSelected) {
      setSelectedBooks(prev => prev.filter(sb => !unaddedBooks.some(ub => ub.id === sb.id)));
    } else {
      setSelectedBooks(prev => {
        const newSelection = [...prev];
        unaddedBooks.forEach(ub => {
          if (!newSelection.some(sb => sb.id === ub.id)) {
            newSelection.push(ub);
          }
        });
        return newSelection;
      });
    }
  };

  const handleAddSelected = async () => {
    if (selectedBooks.length === 0) return;
    setAdding(true);
    try {
      const baseUrl = getIngestionBaseUrl();
      const res = await fetch(`${baseUrl}/api/v1/data-ingestion/admin/library-books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ books: selectedBooks })
      });
      if (res.ok) {
        // Unmark any previously deleted flags
        selectedBooks.forEach(b => unmarkPlatformBookDeleted(b.id));
        const newPublishedList = [...publishedBooksList, ...selectedBooks];
        setPublishedBooksList(newPublishedList);
        setLibraryBooks(new Set(newPublishedList.map(b => b.id)));
        idbSet('admin_published_books', newPublishedList);
        localStorage.setItem('zad_cached_library_books_v7', JSON.stringify(newPublishedList));
        localStorage.setItem('zad_library_synced', 'true');
        window.dispatchEvent(new Event('zad_library_books_changed'));

        setSelectedBooks([]);
        showToast(`تمت إضافة ${selectedBooks.length} كتاب بنجاح إلى المكتبة!`, 'success');
      }
    } catch (err) {
      console.error("Error adding books:", err);
      showToast('حدث خطأ أثناء الإضافة', 'error');
    } finally {
      setAdding(false);
    }
  };

  const toggleCategory = (catId: number) => {
    setExpandedCategory(prev => (prev === catId ? null : catId));
  };

  const handleRemoveBook = (bookId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      title: 'إزالة كتاب من المنصة',
      message: 'هل أنت متأكد من إزالة هذا الكتاب؟ يمكنك إضافته مرة أخرى في أي وقت من الفهرس.',
      type: 'warning',
      onConfirm: async () => {
        setRemovingId(bookId);
        // 1. Mark as permanently deleted locally so it never resurrects
        markPlatformBookDeleted(bookId);

        // 2. Instant optimistic UI update
        const updated = publishedBooksList.filter(b => b.id !== bookId);
        setLibraryBooks(prev => {
          const newSet = new Set(prev);
          newSet.delete(bookId);
          return newSet;
        });
        setPublishedBooksList(updated);
        idbSet('admin_published_books', updated);
        localStorage.setItem('zad_cached_library_books_v7', JSON.stringify(updated));
        localStorage.setItem('zad_library_synced', 'true');
        window.dispatchEvent(new Event('zad_library_books_changed'));
        showToast('تمت إزالة الكتاب من المنصة بنجاح', 'info');

        // 3. Background server sync
        try {
          const baseUrl = getIngestionBaseUrl();
          await fetch(`${baseUrl}/api/v1/data-ingestion/admin/library-books/${bookId}`, {
            method: 'DELETE'
          });
        } catch (err) {
          console.warn("Backend remove warning (kept removed locally):", err);
        } finally {
          setRemovingId(null);
        }
      }
    });
  };

  const handleClearAllBooks = () => {
    if (libraryBooks.size === 0) return;

    setConfirmDialog({
      isOpen: true,
      title: 'حذف جميع الكتب المضافة',
      message: `تحذير خطير: هل أنت متأكد من مسح جميع الكتب من المنصة بالكامل؟ (العدد: ${libraryBooks.size} كتاب)`,
      type: 'danger',
      onConfirm: async () => {
        // Mark all as deleted locally
        libraryBooks.forEach(id => markPlatformBookDeleted(id));

        // Optimistically clear immediately
        setLibraryBooks(new Set());
        setPublishedBooksList([]);
        idbSet('admin_published_books', []);
        localStorage.setItem('zad_cached_library_books_v7', JSON.stringify([]));
        localStorage.setItem('zad_library_synced', 'true');
        window.dispatchEvent(new Event('zad_library_books_changed'));
        showToast('تم مسح جميع الكتب من المكتبة بنجاح', 'success');

        try {
          const baseUrl = getIngestionBaseUrl();
          await fetch(`${baseUrl}/api/v1/data-ingestion/admin/library-books`, {
            method: 'DELETE'
          });
        } catch (err) {
          console.warn("Backend clear books warning (kept cleared locally):", err);
        }
      }
    });
  };

  // High-speed In-Memory Search over Local Catalog
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q && authorFilter === "all" && catFilter === "all") {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    let results = allCatalogBooksRef.current;
    if (q) {
      results = results.filter(b =>
        (b.name && b.name.toLowerCase().includes(q)) ||
        (b.author_name && b.author_name.toLowerCase().includes(q))
      );
    }
    if (authorFilter !== "all" && authorFilter !== "") {
      results = results.filter(b => b.author_name?.includes(authorFilter));
    }
    if (catFilter !== "all" && catFilter !== "") {
      results = results.filter(b => b.cat_id?.toString() === catFilter);
    }
    setSearchResults(results);
    setSearching(false);
  }, [searchQuery, catFilter, authorFilter]);

  const uniqueAuthors = authorsList.length > 0
    ? authorsList
    : Array.from(new Set(
      [...publishedBooksList, ...Object.values(categoryBooksMap).flat()]
        .map(b => b.author_name)
        .filter(Boolean) as string[]
    )).sort();

  const filteredCategories = categories.filter(c => {
    if (catFilter !== "all" && c.cat_id.toString() !== catFilter) return false;
    return true;
  });

  // Decide when to show the flat list instead of folders
  const showFlatList = searchQuery !== "" || authorFilter !== "all" || catFilter !== "all";

  // Flat list of matching books from cloud search
  const allSearchResults = searchResults;

  // Pagination Math
  const totalPages = Math.ceil(allSearchResults.length / RESULTS_PER_PAGE);
  const startIndex = (currentPage - 1) * RESULTS_PER_PAGE;
  const paginatedResults = allSearchResults.slice(startIndex, startIndex + RESULTS_PER_PAGE);

  const handleSelectPageResults = () => {
    // Check if all visible valid books are already selected
    const validBooks = paginatedResults.filter(b => !libraryBooks.has(b.id));
    if (validBooks.length === 0) return;

    const allSelected = validBooks.every(b => selectedBooks.some(sb => sb.id === b.id));

    if (allSelected) {
      // Deselect all on this page
      setSelectedBooks(selectedBooks.filter(sb => !validBooks.some(b => b.id === sb.id)));
    } else {
      // Select all on this page
      const newSelected = [...selectedBooks];
      validBooks.forEach(b => {
        if (!newSelected.some(sb => sb.id === b.id)) {
          newSelected.push(b);
        }
      });
      setSelectedBooks(newSelected);
    }
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setAuthorFilter("all");
    setCatFilter("all");
    setCurrentPage(1);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    // Generate page numbers to show (current, +/- 2 pages, first, last)
    let pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
        pages.push(i);
      }
    }

    // Insert ellipses where there are gaps
    let paginationUI: React.ReactNode[] = [];
    let lastPage = 0;
    pages.forEach(page => {
      if (lastPage !== 0 && page - lastPage > 1) {
        paginationUI.push(<span key={`ellipsis-${page}`} className="px-2 text-muted-foreground">...</span>);
      }
      paginationUI.push(
        <button
          key={page}
          onClick={() => {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold transition-all ${currentPage === page ? 'bg-brand-magenta text-white shadow-md' : 'bg-white dark:bg-[#121826] border border-slate-200 dark:border-white/10 hover:border-brand-magenta text-slate-700 dark:text-slate-300'}`}
        >
          {page}
        </button>
      );
      lastPage = page;
    });

    return (
      <div className="flex items-center justify-center gap-2 mt-12 pb-10" dir="rtl">
        <button
          onClick={() => {
            setCurrentPage(p => Math.max(1, p - 1));
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          disabled={currentPage === 1}
          className="px-4 py-2 rounded-lg bg-white dark:bg-[#121826] border border-slate-200 dark:border-white/10 hover:border-brand-magenta disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center gap-2 font-semibold shadow-sm"
        >
          &rarr; السابق
        </button>

        <div className="items-center gap-1 hidden sm:flex mx-4">
          {paginationUI}
        </div>
        <div className="flex sm:hidden items-center gap-2 font-bold mx-4 text-slate-700 dark:text-slate-300">
          {currentPage} / {totalPages}
        </div>

        <button
          onClick={() => {
            setCurrentPage(p => Math.min(totalPages, p + 1));
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          disabled={currentPage === totalPages}
          className="px-4 py-2 rounded-lg bg-white dark:bg-[#121826] border border-slate-200 dark:border-white/10 hover:border-brand-magenta disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center gap-2 font-semibold shadow-sm"
        >
          التالي &larr;
        </button>
      </div>
    );
  };

  const renderBookCard = (book: TurathBook) => {
    const isAdded = libraryBooks.has(book.id);
    const isSelected = selectedBooks.some(b => b.id === book.id);
    const isFeatured = featuredBooksSet.has(book.id) || (book.name ? featuredBooksSet.has(book.name) : false);

    return (
      <div
        key={book.id}
        onClick={() => !isAdded && handleToggleBook(book)}
        className={`group flex items-center justify-between p-4 rounded-xl border transition-all duration-300 relative ${isAdded ? 'border-green-500/30 bg-green-500/5 hover:border-green-500/60 hover:shadow-lg hover:shadow-green-500/10 hover:scale-[1.01] hover:-translate-y-1 hover:bg-green-500/10 z-0 hover:z-10' :
            isSelected ? 'border-brand-magenta bg-brand-magenta/10 shadow-lg shadow-brand-magenta/10 cursor-pointer scale-[1.02] -translate-y-1 z-10' :
              'border-slate-200 dark:border-white/10 bg-white dark:bg-[#181825] hover:border-brand-magenta/40 hover:shadow-xl hover:shadow-brand-magenta/10 hover:scale-[1.02] hover:-translate-y-1 hover:bg-white dark:hover:bg-[#1f1f30] cursor-pointer z-0 hover:z-10'
          }`}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 ease-out ${isAdded ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 group-hover:scale-110 group-hover:bg-green-200 dark:group-hover:bg-green-500/30 group-hover:rotate-6' :
              isSelected ? 'bg-brand-magenta text-white shadow-md shadow-brand-magenta/30 scale-110 rotate-6' :
                'bg-slate-100 dark:bg-white/5 text-slate-400 group-hover:bg-brand-magenta/10 group-hover:text-brand-magenta group-hover:scale-110 group-hover:-rotate-6'
            }`}>
            <Book className="h-6 w-6" />
          </div>
          <div className="flex flex-col flex-1 min-w-0 gap-1.5">
            <span className="font-bold text-base md:text-lg text-slate-800 dark:text-slate-100 leading-relaxed break-words whitespace-normal">{book.name}</span>
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-xs text-muted-foreground bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-white/10">ID: {book.id}</span>
              {book.author_name && <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-white/10">مؤلف: {book.author_name}</span>}
              {book.cat_name && <span className="text-xs text-brand-magenta/80 bg-brand-magenta/5 px-2.5 py-1 rounded-md border border-brand-magenta/20">قسم: {book.cat_name}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 mr-4">
          {/* Featured Toggle Button */}
          {isAdded && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFeaturedBook(book.id, book.name);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all border ${isFeatured
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-500 hover:bg-amber-500/25 shadow-sm'
                  : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-amber-500 hover:border-amber-500/40'
                }`}
              title={isFeatured ? 'موجود في المختارة (انقر للإزالة)' : 'إضافة إلى المختارة'}
            >
              <Sparkles className={`w-3.5 h-3.5 ${isFeatured ? 'fill-amber-500 text-amber-500' : ''}`} />
              <span>{isFeatured ? 'في المختارة' : 'إضافة للمختارة'}</span>
            </button>
          )}

          {isAdded ? (
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => handleRemoveBook(book.id, e)}
                disabled={removingId === book.id}
                className="flex items-center justify-center p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-xl transition-all disabled:opacity-50"
                title="إزالة الكتاب من المكتبة"
              >
                {removingId === book.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
              </button>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-green-500/30 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 text-sm font-bold shadow-sm cursor-default">
                <CheckCircle className="h-4 w-4" /> تمت الإضافة
              </div>
            </div>
          ) : (
            <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-brand-magenta border-brand-magenta text-white shadow-md' : 'border-slate-300 dark:border-slate-600'
              }`}>
              {isSelected && <CheckCircle className="h-4 w-4" />}
            </div>
          )}
        </div>
      </div>
    );
  };

  const addedBooksList = publishedBooksList;

  const renderManageTab = () => {
    const grouped = addedBooksList.reduce((acc, book) => {
      const cat = acc.find(c => c.cat_id === book.cat_id);
      if (cat) cat.books.push(book);
      else acc.push({ cat_id: book.cat_id ?? 0, name: book.cat_name || 'أخرى', books: [book] });
      return acc;
    }, [] as { cat_id: number, name: string, books: TurathBook[] }[]);

    return (
      <div className="space-y-6 pb-20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">الكتب المضافة للمنصة</h2>
            <p className="text-muted-foreground">تصفح وإدارة الكتب التي قمت بإضافتها سابقاً من الفهرس المحلي.</p>
          </div>
          <button
            onClick={handleClearAllBooks}
            disabled={libraryBooks.size === 0}
            className="flex items-center gap-2 bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 px-6 py-3 rounded-xl font-bold hover:bg-red-200 dark:hover:bg-red-500/30 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            <Trash2 className="h-5 w-5" /> حذف جميع الكتب
          </button>
        </div>

        {grouped.length === 0 ? (
          <div className="text-center py-32 opacity-50 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
            <Book className="h-16 w-16 mx-auto mb-4 text-slate-400" />
            <p className="text-lg">لا يوجد أي كتب مضافة للمكتبة حالياً.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.map(group => (
              <div key={group.cat_id} className="bg-white dark:bg-[#121826] rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 overflow-hidden">
                <button
                  onClick={() => setExpandedManageCategory(prev => prev === group.cat_id ? null : group.cat_id)}
                  className="w-full p-5 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-right"
                >
                  <div className={`p-2.5 rounded-xl transition-colors ${expandedManageCategory === group.cat_id ? 'bg-brand-magenta text-white shadow-md' : 'bg-brand-magenta/10 text-brand-magenta'}`}>
                    <Folder className="h-6 w-6" />
                  </div>
                  <span className="text-xl font-bold">{group.name}</span>
                  <span className="text-sm font-semibold opacity-70 mr-auto bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full">
                    {group.books.length} كتاب
                  </span>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${expandedManageCategory === group.cat_id ? 'rotate-180' : ''}`} />
                </button>

                {expandedManageCategory === group.cat_id && (
                  <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 flex flex-col gap-3">
                    {group.books.map(book => renderBookCard(book))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderAddTab = () => (
    <>
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-3 text-brand-magenta flex items-center justify-center gap-3">
          <Search className="h-8 w-8" />
          البحث في الفهرس
        </h1>
        <p className="text-muted-foreground">تصفح الفهرس المحلي لمكتبة تراث وأضف الكتب المطلوبة إلى المنصة.</p>
      </header>

      {/* Action Bar */}
      <div className="bg-white dark:bg-[#121826] p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 mb-8 sticky top-4 z-40">

        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-[2] min-w-[300px] w-full">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="ابحث عن قسم أو كتاب أو مؤلف..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-4 pr-12 py-3 rounded-xl bg-slate-100 dark:bg-black/20 border-transparent focus:border-brand-magenta focus:ring-1 focus:ring-brand-magenta transition-all outline-none"
            />
          </div>

          <div className="flex-1 w-full md:min-w-[180px]">
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="w-full py-3 px-4 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-sm font-medium outline-none focus:border-brand-magenta cursor-pointer"
            >
              <option value="all">كل الأقسام</option>
              {categories.map(c => (
                <option key={c.cat_id} value={c.cat_id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 w-full md:min-w-[180px] relative">
            <input
              type="text"
              list="author-options"
              placeholder="فلتر بالمؤلف..."
              value={authorFilter === "all" ? "" : authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value || "all")}
              className="w-full py-3 px-4 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-sm font-medium outline-none focus:border-brand-magenta"
            />
            <datalist id="author-options">
              {uniqueAuthors.map(author => (
                <option key={author} value={author} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
          <div className="text-sm font-semibold opacity-70">
            محدد: <span className="text-brand-magenta text-lg mx-1">{selectedBooks.length}</span> كتاب
          </div>
          <button
            onClick={handleAddSelected}
            disabled={selectedBooks.length === 0 || adding}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-magenta text-white font-bold rounded-xl hover:bg-brand-deep transition-all shadow-md disabled:opacity-50 disabled:pointer-events-none"
          >
            {adding ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
            إضافة المحدد للمكتبة
          </button>
        </div>
      </div>

      {/* Categories List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-60">
          <Loader2 className="h-10 w-10 animate-spin text-brand-magenta mb-4" />
          <span>جاري تحميل الفهرس...</span>
        </div>
      ) : showFlatList ? (
        searching ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-60">
            <Loader2 className="h-10 w-10 animate-spin text-brand-magenta mb-4" />
            <span>جاري البحث في السحابة...</span>
          </div>
        ) : (
          <div className="space-y-4 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-2">
              <h3 className="font-bold text-lg flex items-center gap-3">
                نتائج البحث
                <span className="text-sm font-normal text-muted-foreground">
                  (تم العثور على <span className="text-brand-magenta font-bold">{allSearchResults.length}</span> كتاب)
                </span>
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 px-4 py-2 rounded-lg transition-colors font-semibold"
                >
                  إلغاء الفلاتر &times;
                </button>
                {paginatedResults.length > 0 && (
                  (() => {
                    const validBooks = paginatedResults.filter(b => !libraryBooks.has(b.id));
                    if (validBooks.length === 0) return null;
                    const isAllSelected = validBooks.every(b => selectedBooks.some(sb => sb.id === b.id));

                    return (
                      <button
                        onClick={handleSelectPageResults}
                        className={`text-sm px-4 py-2 rounded-lg font-bold transition-colors ${isAllSelected
                            ? 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
                            : 'bg-brand-magenta/10 text-brand-magenta hover:bg-brand-magenta/20'
                          }`}
                      >
                        {isAllSelected ? 'إلغاء التحديد' : 'تحديد نتائج الصفحة الحالية'}
                      </button>
                    );
                  })()
                )}
              </div>
            </div>
            {paginatedResults.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">لم يتم العثور على كتب تطابق بحثك</div>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  {paginatedResults.map(book => renderBookCard(book))}
                </div>
                {renderPagination()}
              </>
            )}
          </div>
        )
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          الفهرس فارغ. يرجى تشغيل السكربت.
        </div>
      ) : (
        <div className="space-y-4 pb-32">
          {filteredCategories.map(cat => (
            <div key={cat.cat_id} className="bg-white dark:bg-[#121826] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm transition-all hover:shadow-md">
              <button
                onClick={() => toggleCategory(cat.cat_id)}
                className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-right"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl transition-colors ${expandedCategory === cat.cat_id ? 'bg-brand-magenta text-white shadow-lg shadow-brand-magenta/20' : 'bg-slate-100 dark:bg-white/5 text-brand-magenta'}`}>
                    <Folder className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="font-bold text-xl block">{cat.name}</span>
                    <span className="text-sm font-semibold opacity-60 mt-1 block">
                      {cat.count} كتاب متاح
                    </span>
                  </div>
                  <ChevronDown className={`mr-auto h-6 w-6 text-muted-foreground transition-transform ${expandedCategory === cat.cat_id ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {expandedCategory === cat.cat_id && (
                <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20">
                  {loadingCategory === cat.cat_id ? (
                    <div className="flex flex-col items-center justify-center py-10">
                      <Loader2 className="h-7 w-7 animate-spin text-brand-magenta mb-2" />
                      <span className="text-sm font-semibold opacity-70">جاري جلب كتب القسم من السحابة...</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="font-bold text-lg text-slate-700 dark:text-slate-300">
                          كتب القسم ({categoryBooksMap[cat.cat_id]?.length || 0})
                        </h4>
                        <button
                          onClick={() => handleSelectAllInCategory(cat.cat_id, categoryBooksMap[cat.cat_id] || [])}
                          className="text-sm font-semibold text-brand-magenta hover:text-brand-deep transition-colors bg-brand-magenta/10 px-4 py-2 rounded-lg"
                        >
                          تحديد الكل
                        </button>
                      </div>
                      <div className="flex flex-col gap-3">
                        {(categoryBooksMap[cat.cat_id] || []).map(book => renderBookCard(book))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );

  const renderFeaturedTab = () => {
    const featuredList = publishedBooksList.filter(b =>
      featuredBooksSet.has(b.id) || (b.name ? featuredBooksSet.has(b.name) : false)
    );

    const filteredFeatured = featuredList.filter(b => {
      if (!featuredSearch.trim()) return true;
      const q = featuredSearch.trim().toLowerCase();
      return (b.name || '').toLowerCase().includes(q) || (b.author_name || '').toLowerCase().includes(q) || (b.cat_name || '').toLowerCase().includes(q);
    });

    return (
      <div className="space-y-6 pb-20 animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-amber-500" />
              إدارة قائمة "المختارة"
            </h2>
            <p className="text-muted-foreground">الكتب المحددة هنا تظهر حصرياً في تبويب "المختارة" لمستخدمي منصة زاد.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const allIds = publishedBooksList.map(b => b.id);
                setFeaturedBooksSet(new Set(allIds));
                localStorage.setItem('zad_featured_book_ids', JSON.stringify(allIds));
                window.dispatchEvent(new Event('zad_featured_books_changed'));
                showToast(`تمت إضافة جميع كتب المكتبة (${allIds.length}) للمختارة`, 'success');
              }}
              disabled={publishedBooksList.length === 0}
              className="px-4 py-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold hover:bg-amber-500/20 transition-all text-xs sm:text-sm disabled:opacity-50"
            >
              تحديد كل كتب المكتبة كـ "مختارة"
            </button>

            {featuredBooksSet.size > 0 && (
              <button
                onClick={() => {
                  setFeaturedBooksSet(new Set());
                  localStorage.removeItem('zad_featured_book_ids');
                  window.dispatchEvent(new Event('zad_featured_books_changed'));
                  showToast('تم إفراغ قائمة المختارة', 'info');
                }}
                className="px-4 py-2.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 font-bold hover:bg-red-500/20 transition-all text-xs sm:text-sm"
              >
                إفراغ قائمة المختارة
              </button>
            )}
          </div>
        </div>

        {/* Search inside featured books */}
        <div className="bg-white dark:bg-[#121826] p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 flex items-center gap-3">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="ابحث في الكتب المختارة..."
            value={featuredSearch}
            onChange={(e) => setFeaturedSearch(e.target.value)}
            className="w-full bg-transparent outline-none text-sm font-semibold placeholder:text-muted-foreground"
          />
          {featuredSearch && (
            <button onClick={() => setFeaturedSearch('')} className="text-xs text-muted-foreground hover:text-foreground">مسح</button>
          )}
        </div>

        {/* Featured list */}
        {filteredFeatured.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-white/50 dark:bg-black/10">
            <Sparkles className="h-14 w-14 mx-auto mb-3 text-amber-400 animate-pulse" />
            <p className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
              {featuredBooksSet.size === 0 ? 'لا توجد كتب مضافة لقائمة المختارة بعد' : 'لا توجد نتائج تطابق البحث'}
            </p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              تصفح "الكتب المضافة للمنصة" وانقر على زر "إضافة للمختارة" لأي كتاب ليعرض في هذه القائمة.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFeatured.map(book => (
              <div
                key={book.id}
                className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 flex items-center justify-between gap-4 shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold">
                    <Sparkles className="w-5 h-5 fill-white" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-base text-slate-900 dark:text-white truncate">{book.name}</h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {book.author_name || 'مؤلف غير معروف'} • <span className="text-amber-600 dark:text-amber-400 font-semibold">{book.cat_name || 'عام'}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => toggleFeaturedBook(book.id, book.name)}
                  className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-xs border border-red-500/20 shrink-0 transition-colors"
                >
                  إزالة من المختارة
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // -------------------------------------------------------------
  // Covers & Showcase Management Handlers & UI Tab
  // -------------------------------------------------------------
  const handleSelectBookForCover = async (book: TurathBook) => {
    setSelectedBookForCover(book);
    const existing = coverOverrides[book.id];
    const defaultCat = book.cat_name || 'عام';

    if (existing) {
      setCoverSourceInput(existing.coverSource || '');
      setIsShowcaseInput(existing.isShowcase ?? true);
      setCustomCategoryInput(existing.category || defaultCat);
      setOrderIndexInput(existing.orderIndex ?? (Object.values(coverOverrides).filter(o => o.isShowcase).length + 1));
      setPreviewCoverUrl(existing.resolvedCoverUrl || '');
    } else {
      const defaultSource = String(book.id);
      setCoverSourceInput(defaultSource);
      setIsShowcaseInput(true);
      setCustomCategoryInput(defaultCat);
      const currentShowcaseCount = Object.values(coverOverrides).filter(o => o.isShowcase).length;
      setOrderIndexInput(currentShowcaseCount + 1);
      setIsPreviewLoading(true);
      try {
        const url = await resolveCoverSource(defaultSource, book.name);
        setPreviewCoverUrl(url);
      } catch {
        setPreviewCoverUrl('');
      } finally {
        setIsPreviewLoading(false);
      }
    }
  };

  const handleTestPreviewCover = async () => {
    if (!coverSourceInput.trim()) {
      showToast('يرجى إدخال معرّف أو رابط الغلاف أولاً', 'error');
      return;
    }
    setIsPreviewLoading(true);
    try {
      const url = await resolveCoverSource(coverSourceInput.trim(), selectedBookForCover?.name);
      if (url) {
        setPreviewCoverUrl(url);
        showToast('تم فحص الغلاف بنجاح! تفقد صندوق المعاينة', 'success');
      } else {
        showToast('تعذر العثور على غلاف بهذا المعرّف، تأكد من الرقم أو كود الأرشيف', 'error');
      }
    } catch (e) {
      showToast('حدث خطأ أثناء فحص الغلاف', 'error');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleSaveCoverConfig = async () => {
    if (!selectedBookForCover) {
      showToast('يرجى اختيار كتاب أولاً', 'error');
      return;
    }
    if (!coverSourceInput.trim()) {
      showToast('يرجى تحديد معرّف أو مصدر الغلاف', 'error');
      return;
    }

    setIsSavingCover(true);
    try {
      const resolvedUrl = previewCoverUrl || (await resolveCoverSource(coverSourceInput.trim(), selectedBookForCover.name));
      const finalCategory = customCategoryInput.trim() || selectedBookForCover.cat_name || 'عام';

      await saveAdminCoverOverride({
        bookId: selectedBookForCover.id,
        bookTitle: selectedBookForCover.name,
        bookAuthor: selectedBookForCover.author_name,
        category: finalCategory,
        defaultCategory: selectedBookForCover.cat_name || 'عام',
        coverSource: coverSourceInput.trim(),
        resolvedCoverUrl: resolvedUrl,
        isShowcase: isShowcaseInput,
        orderIndex: Number(orderIndexInput) || 1
      });

      setCoverOverrides({ ...getAdminCoverOverrides() });
      showToast(`تم حفظ وتطبيق غلاف "${selectedBookForCover.name}" في مجال (${finalCategory}) بنجاح! 🎉`, 'success');
    } catch (e) {
      showToast('حدث خطأ أثناء حفظ الغلاف', 'error');
    } finally {
      setIsSavingCover(false);
    }
  };

  const handleRemoveCoverOverride = (bookId: number, bookName?: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'حذف الكتاب من القائمة والواجهة',
      message: `هل أنت متأكد من حذف كتاب "${bookName || bookId}" من قائمة الكتب وأبرز كتب الواجهة؟ لن يظهر في الصفحة الرئيسية مجدداً.`,
      type: 'danger',
      onConfirm: () => {
        removeAdminCoverOverride(bookId);
        setCoverOverrides({ ...getAdminCoverOverrides() });
        if (selectedBookForCover?.id === bookId) {
          setSelectedBookForCover(null);
          setCoverSourceInput('');
          setPreviewCoverUrl('');
        }
        showToast('تم حذف الكتاب من القائمة والواجهة بنجاح', 'success');
      }
    });
  };

  // Builds list of books: when customized by admin, returns ONLY what admin added/kept
  const getMergedShowcaseBooks = (): AdminCoverOverride[] => {
    const isCustomized = typeof window !== 'undefined' && (
      localStorage.getItem('zad_showcase_customized') === 'true' ||
      Object.keys(coverOverrides).length > 0
    );

    if (isCustomized) {
      // ONLY return books explicitly in coverOverrides
      return Object.values(coverOverrides)
        .sort((a, b) => (a.orderIndex ?? 9999) - (b.orderIndex ?? 9999));
    }

    // Default first-time fallback only:
    const deletedIds = getDeletedShowcaseIds();
    return FEATURED_CLASSICAL_BOOKS
      .filter(cb => !deletedIds.has(cb.id))
      .map((cb, idx) => ({
        bookId: cb.id,
        bookTitle: cb.title,
        bookAuthor: cb.author,
        category: cb.categoryLabel || cb.category,
        defaultCategory: cb.categoryLabel || cb.category,
        coverSource: String(cb.id),
        resolvedCoverUrl: cb.coverUrl,
        isShowcase: true,
        orderIndex: idx + 1
      }));
  };

  // Quick Move Up / Move Down Handlers for Showcase Books
  const handleMoveShowcaseBook = async (bookId: number, direction: 'up' | 'down') => {
    const allMerged = getMergedShowcaseBooks();
    const showcaseBooks = allMerged
      .filter(o => o.isShowcase)
      .sort((a, b) => (a.orderIndex ?? 9999) - (b.orderIndex ?? 9999));

    const index = showcaseBooks.findIndex(b => b.bookId === bookId);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= showcaseBooks.length) return;

    const newOrderedList = [...showcaseBooks];
    const temp = newOrderedList[index];
    newOrderedList[index] = newOrderedList[targetIndex];
    newOrderedList[targetIndex] = temp;

    await reorderShowcaseBooks(newOrderedList);
    setCoverOverrides({ ...getAdminCoverOverrides() });
    showToast('تم تحديث ترتيب ظهور الكتب بالواجهة بنجاح ✨', 'success');
  };

  const handleToggleShowcaseDirect = async (override: AdminCoverOverride) => {
    const newStatus = !override.isShowcase;
    const allMerged = getMergedShowcaseBooks();
    const currentShowcaseCount = allMerged.filter(o => o.isShowcase).length;
    await saveAdminCoverOverride({
      ...override,
      isShowcase: newStatus,
      orderIndex: newStatus ? (currentShowcaseCount + 1) : undefined
    });
    setCoverOverrides({ ...getAdminCoverOverrides() });
    showToast(newStatus ? 'تم تفعيل ظهور الكتاب في الصفحة الرئيسية ⭐' : 'تم إخفاء الكتاب من الصفحة الرئيسية (مخفي للزوار)', 'info');
  };

  const handleExportShowcaseConfig = () => {
    const allBooks = getMergedShowcaseBooks();
    const configMap: Record<number, AdminCoverOverride> = {};
    allBooks.forEach(b => {
      configMap[b.bookId] = b;
    });

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(configMap, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "showcase_config.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('تم تصدير ملف showcase_config.json للـ Deploy بنجاح! 💾', 'success');
  };

  const handleImportShowcaseConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed && typeof parsed === 'object') {
          const arr = Object.values(parsed) as AdminCoverOverride[];
          arr.forEach(b => unmarkShowcaseBookDeleted(b.bookId));
          await reorderShowcaseBooks(arr);
          setCoverOverrides({ ...getAdminCoverOverrides() });
          showToast(`تم استيراد وتطبيق ${arr.length} كتاب بنجاح! 🎉`, 'success');
        }
      } catch (err) {
        showToast('فشل قراءة ملف الـ JSON، تأكد من سلامة الملف', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleRestoreDeletedShowcaseBooks = () => {
    clearDeletedShowcaseIds();
    setCoverOverrides({ ...getAdminCoverOverrides() });
    showToast('تمت استعادة جميع الكتب المحذوفة بنجاح ✨', 'success');
  };

  const handleClearAllShowcaseBooks = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'إفراغ قائمة كتب الواجهة',
      message: 'هل أنت متأكد من مسح جميع كتب الواجهة؟ ستصبح القائمة فارغة تماماً لتضيف كتبك الخاصة فقط.',
      type: 'danger',
      onConfirm: () => {
        clearAllAdminCoverOverrides();
        setCoverOverrides({});
        setSelectedBookForCover(null);
        showToast('تم إفراغ قائمة الواجهة بنجاح ✨ أضف كتبك الآن من شريط البحث', 'success');
      }
    });
  };

  const handleLoadDefaultClassicalBooks = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'تحميل الكتب الكلاسيكية الافتراضية',
      message: 'هل تريد تحميل الـ 25 كتاب كلاسيكي الافتراضي إلى قائمتك لتعديلها أو حذف ما لا تريده؟',
      type: 'warning',
      onConfirm: () => {
        const defaultMap: Record<number, AdminCoverOverride> = {};
        FEATURED_CLASSICAL_BOOKS.forEach((cb, idx) => {
          defaultMap[cb.id] = {
            bookId: cb.id,
            bookTitle: cb.title,
            bookAuthor: cb.author,
            category: cb.categoryLabel || cb.category,
            defaultCategory: cb.categoryLabel || cb.category,
            coverSource: String(cb.id),
            resolvedCoverUrl: cb.coverUrl,
            isShowcase: true,
            orderIndex: idx + 1
          };
        });
        setAllAdminCoverOverrides(defaultMap);
        setCoverOverrides(defaultMap);
        showToast('تم تحميل الكتب الكلاسيكية الافتراضية بنجاح! يمكنك الآن تعديل أي كتاب أو حذفه', 'success');
      }
    });
  };

  const handleResetSelectedBookCustomization = () => {
    if (!selectedBookForCover) return;
    const bookId = selectedBookForCover.id;
    removeAdminCoverOverride(bookId);
    setCoverOverrides({ ...getAdminCoverOverrides() });
    setCoverSourceInput(String(bookId));
    setPreviewCoverUrl('');
    setCustomCategoryInput(selectedBookForCover.cat_name || 'عام');
    setIsShowcaseInput(true);
    showToast(`تم مسح تخصيص كتاب "${selectedBookForCover.name}" والبدء من جديد`, 'info');
  };

  const renderCoversTab = () => {
    const catalogPool = (allCatalogBooksRef.current && allCatalogBooksRef.current.length > 0)
      ? allCatalogBooksRef.current
      : publishedBooksList;

    const searchHits = coverSearchInput.trim().length >= 2
      ? catalogPool.filter(b => {
        const q = coverSearchInput.trim().toLowerCase();
        return (b.name || '').toLowerCase().includes(q) || (b.author_name || '').toLowerCase().includes(q) || String(b.id) === q;
      }).slice(0, 10)
      : [];

    const allManagedBooks = getMergedShowcaseBooks();
    const showcaseList = allManagedBooks
      .filter(o => o.isShowcase)
      .sort((a, b) => (a.orderIndex ?? 9999) - (b.orderIndex ?? 9999));
    const hiddenList = allManagedBooks.filter(o => !o.isShowcase);

    const displayedBooks = coverTabFilter === 'showcase' 
      ? showcaseList 
      : coverTabFilter === 'hidden'
      ? hiddenList
      : allManagedBooks;

    // Distinct popular categories suggestions
    const popularCategoriesSuggestions = [
      'الحديث الشريف', 'الفقه وأصوله', 'العقيدة الإسلامية',
      'علوم القرآن والتفسير', 'السيرة والتاريخ', 'الرقائق والآداب',
      'المعاجم واللغة', 'أصول الفقه المقارن', 'القواعد الفقهية'
    ];

    return (
      <div className="space-y-8 pb-20 animate-in fade-in duration-300">
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-white/10 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <ImageIcon className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white">إدارة وتخصيص أغلفة الكتب والواجهة</h2>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            تحكم كامل في الكتب المعروضة في واجهة "أبرز كتب المكتبة"، ترتيب ظهورها الدقيق، تخصيص أسماء المجالات والأقسام مع اعتماد القسم الأصلي للكتاب كافتراضي، وربط الأغلفة بمعرّفات التراث أو الوقفية أو الروابط المباشرة.
          </p>
        </div>

        {/* Step 1: Book Selection Search */}
        <div className="bg-white dark:bg-[#121826] p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
            1. ابحث واختر كتاباً لتخصيص غلافه ومجاله وترتيبه:
          </label>
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="ابحث باسم الكتاب أو مؤلفه أو رقمه (مثال: المغني، عمدة الفقه، صحيح البخاري، 6910)..."
              value={coverSearchInput}
              onChange={(e) => setCoverSearchInput(e.target.value)}
              className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-muted-foreground"
            />
            {coverSearchInput && (
              <button
                onClick={() => setCoverSearchInput('')}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                مسح
              </button>
            )}
          </div>

          {/* Autocomplete Search Results Dropdown/List */}
          {searchHits.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 max-h-72 overflow-y-auto">
              {searchHits.map((b) => {
                const isSelected = selectedBookForCover?.id === b.id;
                const hasCustomCover = !!coverOverrides[b.id];
                return (
                  <button
                    key={b.id}
                    onClick={() => {
                      handleSelectBookForCover(b);
                      setCoverSearchInput('');
                    }}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border text-right transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-sm'
                        : 'border-slate-200 dark:border-white/5 hover:border-emerald-500/40 hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0 text-slate-500">
                        <Book className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{b.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{b.author_name || 'مؤلف غير معروف'} • ID: {b.id} • {b.cat_name || 'عام'}</p>
                      </div>
                    </div>
                    {hasCustomCover && (
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md font-bold shrink-0 mr-2">
                        مخصص
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Step 2: Cover Configuration Panel (Active Book) */}
        {selectedBookForCover ? (
          <div className="bg-white dark:bg-[#121826] p-6 sm:p-8 rounded-3xl border-2 border-emerald-500/30 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-4">
              <div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                  الكتاب المحدد حالياً للتعديل
                </span>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{selectedBookForCover.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  المؤلف: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedBookForCover.author_name || 'غير معروف'}</span> • 
                  القسم الأصلي: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{selectedBookForCover.cat_name || 'عام'}</span> • 
                  معرّف الكتاب (ID): <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{selectedBookForCover.id}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {coverOverrides[selectedBookForCover.id] && (
                  <button
                    type="button"
                    onClick={handleResetSelectedBookCustomization}
                    className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-xl border border-red-500/20 font-bold transition-all flex items-center gap-1"
                    title="مسح تخصيص هذا الكتاب والبدء من جديد"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>مسح تخصيص هذا الكتاب</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedBookForCover(null)}
                  className="text-xs text-muted-foreground hover:text-red-500 self-start sm:self-center font-semibold"
                >
                  إلغاء التحديد &times;
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Form Controls (7 cols) */}
              <div className="lg:col-span-7 space-y-5">
                {/* 1. Cover ID / Source */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    1. معرّف أو مصدر الغلاف (Turath ID / Archive ID / Image URL):
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: 6910 أو 01-86049 أو WAQmogni أو رابط صورة https://..."
                    value={coverSourceInput}
                    onChange={(e) => setCoverSourceInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl py-3 px-4 text-sm font-mono font-semibold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-muted-foreground"
                  />
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">اختصارات:</span>
                    <button
                      type="button"
                      onClick={() => setCoverSourceInput(String(selectedBookForCover.id))}
                      className="text-xs bg-slate-100 dark:bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-500 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 transition-colors font-mono"
                    >
                      استخدام ID الكتاب ({selectedBookForCover.id})
                    </button>
                  </div>
                </div>

                {/* 2. Custom Domain / Category Name */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-emerald-500" />
                      <span>2. اسم المجال / القسم العلمي للكتاب:</span>
                    </label>
                    {customCategoryInput !== selectedBookForCover.cat_name && (
                      <button
                        type="button"
                        onClick={() => setCustomCategoryInput(selectedBookForCover.cat_name || 'عام')}
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1"
                        title="إعادة تعيين للمجال الأصلي"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>استعادة المجال الأصلي ({selectedBookForCover.cat_name || 'عام'})</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="اكتب اسم المجال المخصص أو اختر من المقترحات أدناه..."
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    className="w-full bg-white dark:bg-[#121826] border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-3 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-muted-foreground"
                  />
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-muted-foreground ml-1">مقترحات شائعة:</span>
                    {popularCategoriesSuggestions.slice(0, 5).map((catName) => (
                      <button
                        key={catName}
                        type="button"
                        onClick={() => setCustomCategoryInput(catName)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                          customCategoryInput === catName
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                            : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-emerald-500/40'
                        }`}
                      >
                        {catName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Display Order Index */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <SlidersHorizontal className="w-4 h-4 text-emerald-500" />
                      <span>3. ترتيب ظهور الكتاب بالواجهة:</span>
                    </label>
                    <p className="text-xs text-muted-foreground">
                      الرقم 1 يظهر كأول كتاب في شبكة أبرز الكتب بالصفحة الرئيسية، يليه 2، 3 وهكذا.
                    </p>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={orderIndexInput}
                    onChange={(e) => setOrderIndexInput(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-20 bg-white dark:bg-[#121826] border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-center text-sm font-bold font-mono outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* 4. Showcase Switch */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                  <div className="flex items-center gap-3">
                    <Star className={`h-5 w-5 ${isShowcaseInput ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">تثبيت في "أبرز كتب المكتبة"</p>
                      <p className="text-xs text-muted-foreground">يظهر الكتاب في الصفحة الرئيسية بالمجال المحدد وترتيب الظهور المعين.</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isShowcaseInput}
                    onChange={(e) => setIsShowcaseInput(e.target.checked)}
                    className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleTestPreviewCover}
                    disabled={isPreviewLoading || !coverSourceInput.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 font-bold text-sm text-slate-700 dark:text-slate-200 transition-all disabled:opacity-50"
                  >
                    {isPreviewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                    <span>معاينة وفحص الغلاف</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveCoverConfig}
                    disabled={isSavingCover || !coverSourceInput.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
                  >
                    {isSavingCover ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    <span>حفظ وتطبيق التعديلات</span>
                  </button>
                </div>
              </div>

              {/* Live Preview Box (5 cols) */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <span className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" /> المعاينة الحية للغلاف
                </span>
                <div className="w-full max-w-[220px] aspect-[1/1.4] rounded-2xl overflow-hidden shadow-2xl border border-slate-300 dark:border-white/10 bg-stone-100 dark:bg-black/40 flex items-center justify-center relative p-1.5">
                  {isPreviewLoading ? (
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                      <span className="text-xs font-semibold">جاري جلب الغلاف...</span>
                    </div>
                  ) : previewCoverUrl ? (
                    <img
                      src={previewCoverUrl}
                      alt={selectedBookForCover.name}
                      className="w-full h-full object-contain rounded-xl shadow-inner"
                      onError={() => {
                        setPreviewCoverUrl('');
                        showToast('فشل تحميل صورة الغلاف من هذا الرابط/المعرف', 'error');
                      }}
                    />
                  ) : (
                    <div className="text-center p-4 text-muted-foreground">
                      <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-xs font-bold">لا يوجد غلاف معروض حالياً</p>
                      <p className="text-[10px] mt-1 opacity-70">أدخل معرّف تراث أو رابط الغلاف واضغط "معاينة"</p>
                    </div>
                  )}
                </div>
                {previewCoverUrl && (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-2 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" /> الغلاف جاهز ومعتمد
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl p-10 text-center bg-white/40 dark:bg-black/10">
            <ImageIcon className="h-12 w-12 mx-auto text-emerald-500/40 mb-3" />
            <h4 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-1">لم يتم اختيار أي كتاب للتعديل بعد</h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              استخدم شريط البحث أعلاه أو انقر على زر "تعديل" لأي كتاب من القائمة أدناه للتحكم في غلافه ومجاله وترتيبه.
            </p>
          </div>
        )}

        {/* Step 3: Customized & Showcase Books Table/Grid */}
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span>قائمة الكتب والتحكم في الترتيب</span>
              <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-mono">
                {displayedBooks.length}
              </span>
            </h3>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filter Pills: All vs Showcase vs Hidden */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setCoverTabFilter('all')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    coverTabFilter === 'all'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>جميع الكتب ({allManagedBooks.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCoverTabFilter('showcase')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    coverTabFilter === 'showcase'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>معروض بالواجهة ({showcaseList.length})</span>
                </button>
                {hiddenList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCoverTabFilter('hidden')}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      coverTabFilter === 'hidden'
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    <span>مخفي ({hiddenList.length})</span>
                  </button>
                )}
              </div>

              {/* Clear All, Load Defaults, Export, Import */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {allManagedBooks.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllShowcaseBooks}
                    className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                    title="مسح جميع كتب الواجهة والبدء من الصفر"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>إفراغ القائمة</span>
                  </button>
                )}

                {allManagedBooks.length === 0 && (
                  <button
                    type="button"
                    onClick={handleLoadDefaultClassicalBooks}
                    className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                    title="تحميل الكتب الكلاسيكية الـ 25 الافتراضية"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل الافتراضيات (25 كتاب)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleExportShowcaseConfig}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-emerald-500/15 hover:text-emerald-600 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                  title="تصدير ملف showcase_config.json لحفظه في المشروع للـ Deploy"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير للـ Deploy</span>
                </button>

                <label
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-blue-500/15 hover:text-blue-600 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  title="استيراد ملف showcase_config.json"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>استيراد</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportShowcaseConfig}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Quick Explanation banner for Reordering */}
          {coverTabFilter === 'showcase' && showcaseList.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2 font-semibold">
              <span className="text-base">💡</span>
              <span>يمكنك تحريك أي كتاب لأعلى (⬆️) أو لأسفل (⬇️) لتقديم أو تأخير ظهوره في شبكة الصفحة الرئيسية فوراً.</span>
            </div>
          )}

          {displayedBooks.length === 0 ? (
            <div className="text-center py-12 border border-slate-200 dark:border-white/10 rounded-2xl bg-white dark:bg-[#121826] text-muted-foreground text-sm">
              {allManagedBooks.length === 0
                ? 'القائمة فارغة حالياً. ابحث عن أي كتاب من شريط البحث أعلاه لإضافته، أو اضغط "تحميل الافتراضيات".'
                : 'لا توجد كتب تطابق هذا التبويب.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayedBooks.map((ov, index) => {
                const isCustomDomain = ov.category && ov.defaultCategory && ov.category !== ov.defaultCategory;

                return (
                  <div
                    key={ov.bookId}
                    className="bg-white dark:bg-[#121826] border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-all gap-3 relative group"
                  >
                    {/* Top Row: Rank indicator + Up/Down arrows */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-white/5 pb-2">
                      <div className="flex items-center gap-1.5">
                        {ov.isShowcase ? (
                          <>
                            <span className="text-xs font-mono font-black bg-gradient-to-r from-amber-500 to-amber-600 text-white px-2 py-0.5 rounded-md shadow-xs">
                              #{ov.orderIndex ?? (index + 1)}
                            </span>
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-bold border border-emerald-500/20">
                              معروض بالواجهة
                            </span>
                          </>
                        ) : (
                          <span className="text-[10px] bg-slate-500/10 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded font-bold border border-slate-500/20">
                            مخفي من الواجهة
                          </span>
                        )}
                      </div>

                      {/* Reorder Buttons (Move Up / Move Down) */}
                      {ov.isShowcase && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveShowcaseBook(ov.bookId, 'up')}
                            disabled={index === 0}
                            className="p-1 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-amber-500/20 hover:text-amber-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            title="تقديم الكتاب للأمام (تحريك لأعلى)"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveShowcaseBook(ov.bookId, 'down')}
                            disabled={index === displayedBooks.length - 1}
                            className="p-1 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-amber-500/20 hover:text-amber-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            title="تأخير الكتاب للخلف (تحريك لأسفل)"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Book Metadata & Cover */}
                    <div className="flex items-start gap-3">
                      <div className="w-16 aspect-[1/1.4] rounded-lg overflow-hidden bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 shrink-0 flex items-center justify-center p-0.5 shadow-sm">
                        {ov.resolvedCoverUrl ? (
                          <img src={ov.resolvedCoverUrl} alt={ov.bookTitle} className="w-full h-full object-contain rounded" />
                        ) : (
                          <Book className="h-6 w-6 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-slate-800 dark:text-slate-100 line-clamp-2">{ov.bookTitle || `كتاب رقم ${ov.bookId}`}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{ov.bookAuthor || 'مؤلف غير معروف'}</p>
                        
                        {/* Domain Tag */}
                        <div className="mt-2 flex items-center gap-1 flex-wrap">
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-bold border border-emerald-500/20 flex items-center gap-1 truncate">
                            <Tag className="w-2.5 h-2.5" />
                            <span>{ov.category || 'عام'}</span>
                          </span>
                          {isCustomDomain && (
                            <span className="text-[9px] bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded font-bold">
                              مخصص
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const target = catalogPool.find(b => b.id === ov.bookId) || {
                              id: ov.bookId,
                              name: ov.bookTitle || `كتاب ${ov.bookId}`,
                              author_name: ov.bookAuthor,
                              cat_name: ov.defaultCategory || ov.category
                            };
                            handleSelectBookForCover(target);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                        >
                          تعديل
                        </button>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <button
                          type="button"
                          onClick={() => handleToggleShowcaseDirect(ov)}
                          className={`font-semibold transition-colors ${
                            ov.isShowcase
                              ? 'text-slate-500 hover:text-amber-600'
                              : 'text-emerald-600 hover:text-emerald-700 font-bold'
                          }`}
                          title={ov.isShowcase ? 'إخفاء من الصفحة الرئيسية للزوار' : 'إظهار في الصفحة الرئيسية للزوار'}
                        >
                          {ov.isShowcase ? 'إخفاء من الواجهة' : 'إظهار بالواجهة'}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveCoverOverride(ov.bookId, ov.bookTitle)}
                        className="text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
                        title="حذف الكتاب نهائياً من القائمة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف نهائي</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 dark:bg-[#0a0514] text-slate-900 dark:text-slate-100 font-sans flex">

      {/* Custom Glassmorphism Toast Notification */}
      <div
        className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-out flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border ${toast.show ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-10 opacity-0 scale-95 pointer-events-none'
          } ${toast.type === 'success'
            ? 'bg-green-500/20 border-green-500/30 text-green-700 dark:text-green-300'
            : toast.type === 'error'
              ? 'bg-red-500/20 border-red-500/30 text-red-700 dark:text-red-300'
              : 'bg-slate-500/20 border-slate-500/30 text-slate-700 dark:text-slate-300'
          }`}
      >
        {toast.type === 'success' ? <CheckCircle className="h-6 w-6" /> : toast.type === 'error' ? <div className="h-6 w-6 font-bold text-xl flex items-center justify-center">!</div> : <Book className="h-6 w-6" />}
        <span className="font-bold text-lg">{toast.message}</span>
      </div>

      {/* Custom Confirmation Modal */}
      <div
        className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-all duration-300 ${confirmDialog.isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
          }`}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        />

        <div
          className={`relative w-full max-w-md bg-white dark:bg-[#181825] rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10 transition-all duration-300 ease-out ${confirmDialog.isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
            }`}
        >
          <div className={`p-8 text-center ${confirmDialog.type === 'danger' ? 'bg-red-50 dark:bg-red-500/10' : 'bg-amber-50 dark:bg-amber-500/10'}`}>
            <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-sm ${confirmDialog.type === 'danger' ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'}`}>
              <AlertTriangle className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">{confirmDialog.title}</h3>
            <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">{confirmDialog.message}</p>
          </div>
          <div className="p-6 flex flex-col sm:flex-row items-center gap-3 bg-slate-50 dark:bg-black/20">
            <button
              onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
              className="w-full sm:flex-1 py-3.5 px-4 rounded-xl font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#121826] border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors focus:ring-2 focus:ring-slate-300"
            >
              تراجع وإلغاء
            </button>
            <button
              onClick={() => {
                confirmDialog.onConfirm();
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
              }}
              className={`w-full sm:flex-1 py-3.5 px-4 rounded-xl font-bold text-white shadow-lg transition-all focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-[#121826] ${confirmDialog.type === 'danger'
                  ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20 focus:ring-red-500'
                  : 'bg-brand-magenta hover:bg-brand-deep shadow-brand-magenta/20 focus:ring-brand-magenta'
                }`}
            >
              تأكيد الحذف
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="w-72 bg-white dark:bg-[#121826] border-l border-slate-200 dark:border-white/10 shrink-0 h-screen sticky top-0 flex flex-col z-50">
        <div className="p-6 flex items-center justify-center border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-3 text-brand-magenta">
            <div className="bg-brand-magenta text-white p-2.5 rounded-xl shadow-sm">
              <Book className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Zad <span className="text-slate-800 dark:text-white">Admin</span></h2>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button
            onClick={() => setActiveTab('add')}
            className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all font-semibold ${activeTab === 'add'
                ? 'bg-brand-magenta text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
          >
            <Search className="h-5 w-5" />
            إضافة كتب للفهرس
          </button>

          <button
            onClick={() => setActiveTab('manage')}
            className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all font-semibold ${activeTab === 'manage'
                ? 'bg-brand-magenta text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
          >
            <div className="flex items-center gap-3">
              <Folder className="h-5 w-5" />
              الكتب المضافة للمنصة
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full ${activeTab === 'manage' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700'
              }`}>
              {libraryBooks.size}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('featured')}
            className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all font-semibold ${activeTab === 'featured'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
          >
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-amber-400" />
              قائمة الكتب المختارة
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full ${activeTab === 'featured' ? 'bg-white/20 text-white' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              }`}>
              {featuredBooksSet.size}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('covers')}
            className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all font-semibold ${activeTab === 'covers'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
          >
            <div className="flex items-center gap-3">
              <ImageIcon className="h-5 w-5 text-emerald-400" />
              تخصيص الأغلفة والواجهة
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full ${activeTab === 'covers' ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}>
              {getMergedShowcaseBooks().filter(b => b.isShowcase).length}
            </span>
          </button>

          {onNavigateToIngestion && (
            <button
              onClick={onNavigateToIngestion}
              className="w-full flex items-center justify-between p-3.5 rounded-xl transition-all font-semibold text-blue-500 dark:text-blue-400 bg-blue-500/5 hover:bg-blue-500/15 border border-blue-500/20 shadow-sm mt-3"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                <span className="text-sm">معالجة الـ AI (Ingestion)</span>
              </div>
              <span className="text-xs">↗</span>
            </button>
          )}
        </nav>

        {onExit && (
          <div className="p-4 border-t border-slate-200 dark:border-white/10">
            <button
              onClick={onExit}
              className="w-full flex items-center justify-center gap-2 p-3 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all font-medium"
            >
              <span>&rarr;</span> العودة للرئيسية
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto p-8 relative scroll-smooth">
        <div className="max-w-5xl mx-auto">
          {activeTab === 'add' ? renderAddTab() : activeTab === 'manage' ? renderManageTab() : activeTab === 'featured' ? renderFeaturedTab() : renderCoversTab()}
        </div>
      </main>
    </div>
  );
}
