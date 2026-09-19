import React, { useState, useEffect } from 'react';
import { Book, Folder, CheckCircle, Plus, Search, Loader2, Trash2, ChevronDown, AlertTriangle, Sparkles } from 'lucide-react';
import { idbGet, idbSet } from '../../utils/indexedDbStorage';

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
  const [activeTab, setActiveTab] = useState<'add' | 'manage' | 'featured'>('add');
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
    }, 300);
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
        if (cachedPubBooks) {
          setPublishedBooksList(cachedPubBooks);
          setLibraryBooks(new Set(cachedPubBooks.map((b: any) => b.id)));
        }
        if (cachedAuthors && cachedAuthors.length > 0) {
          setAuthorsList(cachedAuthors);
        }
        setLoading(false); // Instant rendering in 0ms!
      }
    } catch (e) {
      console.warn("IndexedDB cache read error:", e);
    }

    // 2. Fresh Network Sync from MongoDB Atlas in background
    try {
      const baseUrl = getIngestionBaseUrl();
      const [catsRes, libRes, authorsRes] = await Promise.all([
        fetch(`${baseUrl}/api/v1/data-ingestion/admin/turath-categories`),
        fetch(`${baseUrl}/api/v1/data-ingestion/admin/library-books`),
        fetch(`${baseUrl}/api/v1/data-ingestion/admin/turath-authors`).catch(() => null)
      ]);

      if (catsRes && catsRes.ok && libRes && libRes.ok) {
        const catsData = await catsRes.json();
        const libData = await libRes.json();
        const freshCats = catsData.categories || [];
        setCategories(freshCats);

        const freshPubBooks: TurathBook[] = libData.books || [];
        setPublishedBooksList(freshPubBooks);
        setLibraryBooks(new Set(freshPubBooks.map((b: any) => b.id)));

        // Update IndexedDB silently for future visits
        idbSet('admin_turath_categories', freshCats);
        idbSet('admin_published_books', freshPubBooks);
      }

      if (authorsRes && authorsRes.ok) {
        const authorsData = await authorsRes.json();
        const freshAuthors: string[] = authorsData.authors || [];
        if (freshAuthors.length > 0) {
          setAuthorsList(freshAuthors);
          idbSet('admin_turath_authors', freshAuthors);
        }
      }
    } catch (err) {
      console.error("Error fetching admin data:", err);
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
      // Deselect all in this category
      setSelectedBooks(prev => prev.filter(sb => !unaddedBooks.some(ub => ub.id === sb.id)));
    } else {
      // Select all unadded books in this category
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
        // Refresh data & cache
        await fetchData();
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

  const toggleCategory = async (catId: number) => {
    if (expandedCategory === catId) {
      setExpandedCategory(null);
      return;
    }
    setExpandedCategory(catId);
    if (!categoryBooksMap[catId]) {
      setLoadingCategory(catId);
      try {
        const baseUrl = getIngestionBaseUrl();
        const res = await fetch(`${baseUrl}/api/v1/data-ingestion/admin/turath-categories/${catId}/books`);
        if (res.ok) {
          const data = await res.json();
          setCategoryBooksMap(prev => ({ ...prev, [catId]: data.books || [] }));
        }
      } catch (err) {
        console.error("Error fetching category books:", err);
      } finally {
        setLoadingCategory(null);
      }
    }
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
        try {
          const baseUrl = getIngestionBaseUrl();
          const res = await fetch(`${baseUrl}/api/v1/data-ingestion/admin/library-books/${bookId}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            setLibraryBooks(prev => {
              const newSet = new Set(prev);
              newSet.delete(bookId);
              return newSet;
            });
            setPublishedBooksList(prev => {
              const updated = prev.filter(b => b.id !== bookId);
              idbSet('admin_published_books', updated);
              return updated;
            });
            showToast('تمت إزالة الكتاب من المنصة بنجاح', 'info');
          }
        } catch (err) {
          console.error("Error removing book:", err);
          showToast('حدث خطأ أثناء الإزالة', 'error');
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
        try {
          const baseUrl = getIngestionBaseUrl();
          const res = await fetch(`${baseUrl}/api/v1/data-ingestion/admin/library-books`, {
            method: 'DELETE'
          });
          if (res.ok) {
            setLibraryBooks(new Set());
            setPublishedBooksList([]);
            idbSet('admin_published_books', []);
            showToast('تم مسح جميع الكتب من المكتبة نهائياً', 'success');
          }
        } catch (err) {
          console.error("Error clearing books:", err);
          showToast('حدث خطأ أثناء إزالة جميع الكتب', 'error');
        }
      }
    });
  };

  // Cloud Search Effect directly from MongoDB Atlas
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q && authorFilter === "all" && catFilter === "all") {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    let isCancelled = false;
    const executeSearch = async () => {
      setSearching(true);
      try {
        const baseUrl = getIngestionBaseUrl();
        const searchParam = q || (authorFilter !== "all" ? authorFilter : "");
        let url = `${baseUrl}/api/v1/data-ingestion/admin/turath-search?q=${encodeURIComponent(searchParam)}`;
        if (catFilter !== "all") url += `&cat_id=${catFilter}`;

        const res = await fetch(url);
        if (res.ok && !isCancelled) {
          const data = await res.json();
          let results: TurathBook[] = data.data || [];
          if (authorFilter !== "all" && authorFilter !== "") {
            results = results.filter(b => b.author_name?.includes(authorFilter));
          }
          setSearchResults(results);
        }
      } catch (e) {
        console.error("Search error:", e);
      } finally {
        if (!isCancelled) setSearching(false);
      }
    };

    executeSearch();
    return () => { isCancelled = true; };
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
          {activeTab === 'add' ? renderAddTab() : activeTab === 'manage' ? renderManageTab() : renderFeaturedTab()}
        </div>
      </main>
    </div>
  );
}
