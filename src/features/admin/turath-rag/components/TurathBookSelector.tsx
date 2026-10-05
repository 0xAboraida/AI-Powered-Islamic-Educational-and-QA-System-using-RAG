import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  BookOpen,
  CheckSquare,
  Square,
  Sparkles,
  Layers,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  X,
  Server,
  Play,
  PlusCircle,
  UploadCloud,
  Cpu,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Folder,
  FolderOpen,
  Filter,
  Grid,
  List,
  RefreshCw,
  HardDrive,
  Clock,
  RotateCcw
} from 'lucide-react';
import { TurathBookItem, ClusterInfo } from '../types';
import { getCollectionDetails } from '../collectionsData';
import { fetchAllIngestedBooks, deleteBookFromCollection, fetchActiveJobs } from '../turathRagApi';

interface TurathCategoryItem {
  title: string;
  is_category?: boolean;
  children?: TurathBookItem[];
}

interface IngestedBookDetail {
  cluster_id: string;
  cluster_name: string;
  collection: string;
  title: string;
  author: string;
  chunks_count: number;
  pages_count: number;
  ingested_at: string;
}

interface TurathBookSelectorProps {
  clusters: ClusterInfo[];
  clusterAssignments: Record<string, string>;
  onSelectBooksForIngest: (selectedBooks: TurathBookItem[], mode: 'kaggle' | 'server') => void;
  onOpenBookIngestModal: (
    book: TurathBookItem,
    step?: 1 | 2 | 3 | 4,
    slug?: string,
    collection?: string,
    clusterId?: string
  ) => void;
  onRefreshClusters?: () => void;
}

export const TurathBookSelector: React.FC<TurathBookSelectorProps> = ({
  clusters,
  clusterAssignments,
  onSelectBooksForIngest,
  onOpenBookIngestModal,
  onRefreshClusters
}) => {
  const [categories, setCategories] = useState<TurathCategoryItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ingested' | 'ingesting' | 'unprocessed'>('all');
  const [viewMode, setViewMode] = useState<'categories' | 'flat'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBooksMap, setSelectedBooksMap] = useState<Map<number | string, TurathBookItem>>(new Map());

  // Ingested books live map from Qdrant Cloud
  const [ingestedMap, setIngestedMap] = useState<Record<number, IngestedBookDetail>>({});
  const [loadingIngested, setLoadingIngested] = useState(false);

  // Active Kaggle Jobs & Book IDs
  const [activeJobsData, setActiveJobsData] = useState<{ active_book_ids: number[]; jobs: any[] }>({
    active_book_ids: [],
    jobs: []
  });
  const activeBookIdsSet = useMemo(
    () => new Set((activeJobsData.active_book_ids || []).map(Number)),
    [activeJobsData]
  );

  // Accordion open/close state for categories
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Delete Confirmation State
  const [bookToDelete, setBookToDelete] = useState<{ book: TurathBookItem; meta: IngestedBookDetail } | null>(null);
  const [batchToDelete, setBatchToDelete] = useState<TurathBookItem[] | null>(null);
  const [batchDeleteProgress, setBatchDeleteProgress] = useState<{ current: number; total: number; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Pagination for Flat View
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // 1. Load Live Ingested Books Map from Backend/Qdrant
  const loadIngestedMap = useCallback(async () => {
    try {
      setLoadingIngested(true);
      const data = await fetchAllIngestedBooks();
      setIngestedMap(data || {});
    } catch (err) {
      console.warn('Could not load ingested books map:', err);
    } finally {
      setLoadingIngested(false);
    }
  }, []);

  // 2. Load Active Kaggle Jobs
  const loadActiveJobs = useCallback(async () => {
    try {
      const data = await fetchActiveJobs();
      setActiveJobsData(data || { active_book_ids: [], jobs: [] });
    } catch (err) {
      console.warn('Could not load active jobs:', err);
    }
  }, []);

  useEffect(() => {
    loadIngestedMap();
    loadActiveJobs();
  }, [loadIngestedMap, loadActiveJobs, clusters]);

  // Polling for active jobs when tasks are running
  useEffect(() => {
    if (activeBookIdsSet.size > 0) {
      const timer = setInterval(() => {
        loadActiveJobs();
        loadIngestedMap();
      }, 8000);
      return () => clearInterval(timer);
    }
  }, [activeBookIdsSet.size, loadActiveJobs, loadIngestedMap]);


  // 2. Load Turath Catalog
  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoadingCatalog(true);
        const res = await fetch('/data/turath_catalog.json');
        if (res.ok) {
          const data: TurathCategoryItem[] = await res.json();
          setCategories(data);
          // Keep all categories collapsed by default per user request
          setExpandedCategories(new Set());
        }
      } catch (err) {
        console.error('Failed to load turath_catalog.json:', err);
      } finally {
        setLoadingCatalog(false);
      }
    }
    loadCatalog();
  }, []);

  // 3. Flatten all books
  const allBooks = useMemo(() => {
    const list: TurathBookItem[] = [];
    categories.forEach((cat) => {
      cat.children?.forEach((b) => {
        list.push({
          ...b,
          category: cat.title,
          turath_id: Number(b.turath_id)
        });
      });
    });
    return list;
  }, [categories]);

  // Total Ingested Books Count
  const totalIngestedCount = useMemo(() => {
    return Object.keys(ingestedMap).length;
  }, [ingestedMap]);

  // Expand categories automatically when search query is entered
  useEffect(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchedCats = new Set<string>();
      categories.forEach((cat) => {
        const hasMatch =
          cat.title.toLowerCase().includes(q) ||
          cat.children?.some(
            (b) =>
              b.title?.toLowerCase().includes(q) ||
              b.author?.toLowerCase().includes(q) ||
              String(b.turath_id).includes(q)
          );
        if (hasMatch) {
          matchedCats.add(cat.title);
        }
      });
      setExpandedCategories(matchedCats);
    }
  }, [searchQuery, categories]);

  // Auto-resolve default collection for a book
  const resolveBookCollection = (book: TurathBookItem): string => {
    const text = `${book.category || ''} ${book.title || ''}`.toLowerCase();
    if (text.includes('حنبلي') || text.includes('الحنابلة') || text.includes('أحمد بن حنبل')) {
      return 'zad_turath_fiqh_hanbali';
    } else if (text.includes('شافعي') || text.includes('الشافعية') || text.includes('النووي')) {
      return 'zad_turath_fiqh_shafii';
    } else if (text.includes('مالكي') || text.includes('المالكية') || text.includes('مالك')) {
      return 'zad_turath_fiqh_maliki';
    } else if (text.includes('حنفي') || text.includes('الحنفية') || text.includes('أبو حنيفة')) {
      return 'zad_turath_fiqh_hanafi';
    } else if (text.includes('أصول الفقه') || text.includes('قواعد فقهية') || text.includes('مقارن')) {
      return 'zad_turath_fiqh_aam';
    } else if (text.includes('عقيدة') || text.includes('التوحيد') || text.includes('أصول الدين')) {
      return 'zad_turath_aqeedah';
    } else if (text.includes('تفسير') || text.includes('علوم القرآن')) {
      return 'zad_turath_tafseer';
    } else if (text.includes('حديث') || text.includes('السنن') || text.includes('شرح')) {
      return 'zad_turath_hadith';
    } else if (text.includes('سيرة') || text.includes('شمائل') || text.includes('مغازي')) {
      return 'zad_turath_seerah';
    } else if (text.includes('تاريخ') || text.includes('تراجم') || text.includes('طبقات')) {
      return 'zad_turath_tarikh';
    } else if (text.includes('نحو') || text.includes('لغة') || text.includes('صرف')) {
      return 'zad_turath_lugha';
    }
    return 'zad_turath_general';
  };

  // Toggle category accordion
  const toggleCategoryAccordion = (catTitle: string) => {
    const next = new Set(expandedCategories);
    if (next.has(catTitle)) {
      next.delete(catTitle);
    } else {
      next.add(catTitle);
    }
    setExpandedCategories(next);
  };

  // Expand / Collapse All
  const handleExpandAll = () => {
    const all = new Set(categories.map((c) => c.title));
    setExpandedCategories(all);
  };
  const handleCollapseAll = () => {
    setExpandedCategories(new Set());
  };

  // Toggle book selection for batch ingestion
  const toggleBook = (book: TurathBookItem) => {
    const next = new Map(selectedBooksMap);
    if (next.has(book.turath_id)) {
      next.delete(book.turath_id);
    } else {
      next.set(book.turath_id, book);
    }
    setSelectedBooksMap(next);
  };

  // Select all unprocessed books in a specific category
  const handleSelectCategoryUnprocessed = (cat: TurathCategoryItem) => {
    const next = new Map(selectedBooksMap);
    const books = cat.children || [];
    books.forEach((b) => {
      const bId = Number(b.turath_id);
      const isIngested = !!ingestedMap[bId];
      if (!isIngested) {
        next.set(bId, {
          ...b,
          category: cat.title,
          turath_id: bId
        });
      }
    });
    setSelectedBooksMap(next);
  };

  // Clear Selection
  const handleClearSelection = () => {
    setSelectedBooksMap(new Map());
  };

  // Execute Atomic Deletion of a Book from Qdrant Cloud
  const handleConfirmDelete = async () => {
    if (!bookToDelete) return;
    try {
      setIsDeleting(true);
      setDeleteError(null);
      await deleteBookFromCollection(
        bookToDelete.meta.cluster_id,
        bookToDelete.meta.collection,
        Number(bookToDelete.book.turath_id)
      );

      // Invalidate local state
      const nextMap = { ...ingestedMap };
      const bId = Number(bookToDelete.book.turath_id);
      delete nextMap[bId];
      setIngestedMap(nextMap);

      // Remove from selected list if present
      if (selectedBooksMap.has(bId)) {
        const nextSelected = new Map(selectedBooksMap);
        nextSelected.delete(bId);
        setSelectedBooksMap(nextSelected);
      }

      // Close modal
      setBookToDelete(null);

      // Refresh global cluster stats in parent
      if (onRefreshClusters) {
        onRefreshClusters();
      }
    } catch (err: any) {
      console.error(err);
      setDeleteError(err.message || 'فشل مسح الكتاب من الكلاستر');
    } finally {
      setIsDeleting(false);
    }
  };

  // Execute Batch Deletion of Selected Books from Qdrant Cloud
  const handleConfirmBatchDelete = async () => {
    if (!batchToDelete || batchToDelete.length === 0) return;
    try {
      setIsDeleting(true);
      setDeleteError(null);

      const nextIngested = { ...ingestedMap };
      const nextSelected = new Map(selectedBooksMap);

      for (let i = 0; i < batchToDelete.length; i++) {
        const book = batchToDelete[i];
        const bId = Number(book.turath_id);
        const meta = ingestedMap[bId];

        setBatchDeleteProgress({
          current: i + 1,
          total: batchToDelete.length,
          title: book.title
        });

        if (meta) {
          await deleteBookFromCollection(meta.cluster_id, meta.collection, bId);
          delete nextIngested[bId];
        }
        nextSelected.delete(bId);
      }

      setIngestedMap(nextIngested);
      setSelectedBooksMap(nextSelected);
      setBatchToDelete(null);
      setBatchDeleteProgress(null);

      if (onRefreshClusters) {
        onRefreshClusters();
      }
    } catch (err: any) {
      console.error('Batch deletion failed:', err);
      setDeleteError(err.message || 'فشل مسح بعض الكتب المحددة من الكلاستر');
    } finally {
      setIsDeleting(false);
      setBatchDeleteProgress(null);
    }
  };

  // Filter books matching search and status filter
  const filterBookItem = (b: TurathBookItem) => {
    const bId = Number(b.turath_id);
    const isIngested = !!ingestedMap[bId];
    const isIngesting = activeBookIdsSet.has(bId);

    // Status filter
    if (statusFilter === 'ingested' && !isIngested) return false;
    if (statusFilter === 'ingesting' && !isIngesting) return false;
    if (statusFilter === 'unprocessed' && (isIngested || isIngesting)) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        b.title?.toLowerCase().includes(q) ||
        b.author?.toLowerCase().includes(q) ||
        b.category?.toLowerCase().includes(q) ||
        String(b.turath_id).includes(q);
      if (!match) return false;
    }

    return true;
  };

  // Grouped Categories with Filtered Books
  const processedCategories = useMemo(() => {
    return categories
      .map((cat) => {
        const enrichedChildren: TurathBookItem[] = (cat.children || []).map((b) => ({
          ...b,
          category: cat.title,
          turath_id: Number(b.turath_id)
        }));

        const matchingChildren = enrichedChildren.filter(filterBookItem);
        const totalInCat = enrichedChildren.length;
        const ingestedInCat = enrichedChildren.filter((b) => !!ingestedMap[Number(b.turath_id)]).length;
        const ingestingInCat = enrichedChildren.filter((b) => activeBookIdsSet.has(Number(b.turath_id))).length;

        return {
          title: cat.title,
          totalCount: totalInCat,
          ingestedCount: ingestedInCat,
          ingestingCount: ingestingInCat,
          books: matchingChildren
        };
      })
      .filter((cat) => {
        if (selectedCategory !== 'all' && cat.title !== selectedCategory) return false;
        // Hide empty categories when filtering
        if (searchQuery.trim() || statusFilter !== 'all') {
          return cat.books.length > 0;
        }
        return true;
      });
  }, [categories, ingestedMap, searchQuery, statusFilter, selectedCategory]);

  // Flat View Filtered Books
  const flatFilteredBooks = useMemo(() => {
    return allBooks.filter(filterBookItem);
  }, [allBooks, ingestedMap, searchQuery, statusFilter]);

  const totalFlatPages = Math.ceil(flatFilteredBooks.length / pageSize) || 1;
  const paginatedFlatBooks = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return flatFilteredBooks.slice(startIdx, startIdx + pageSize);
  }, [flatFilteredBooks, currentPage, pageSize]);

  const selectedList = useMemo(() => Array.from(selectedBooksMap.values()), [selectedBooksMap]);

  // Categorize selected books by state (ingested vs new vs in-progress)
  const { selectedIngested, selectedUnprocessed, selectedIngesting } = useMemo(() => {
    const ingested: TurathBookItem[] = [];
    const unprocessed: TurathBookItem[] = [];
    const ingesting: TurathBookItem[] = [];

    selectedList.forEach((book) => {
      const bId = Number(book.turath_id);
      if (activeBookIdsSet.has(bId)) {
        ingesting.push(book);
      } else if (ingestedMap[bId]) {
        ingested.push(book);
      } else {
        unprocessed.push(book);
      }
    });

    return {
      selectedIngested: ingested,
      selectedUnprocessed: unprocessed,
      selectedIngesting: ingesting
    };
  }, [selectedList, ingestedMap, activeBookIdsSet]);

  const isAllIngested = selectedList.length > 0 && selectedIngested.length === selectedList.length;
  const isAllUnprocessed = selectedList.length > 0 && selectedUnprocessed.length === selectedList.length;
  const isMixedSelection = selectedList.length > 0 && !isAllIngested && !isAllUnprocessed;

  // Total vectors for batch delete
  const batchTotalVectors = useMemo(() => {
    if (!batchToDelete) return 0;
    return batchToDelete.reduce((acc, b) => {
      const meta = ingestedMap[Number(b.turath_id)];
      return acc + (meta?.chunks_count || 0);
    }, 0);
  }, [batchToDelete, ingestedMap]);

  return (
    <div className="space-y-6">
      {/* ================= HEADER & SEARCH TOOLBAR ================= */}
      <div className="rounded-3xl border border-white/10 bg-[#120322]/80 p-6 backdrop-blur-xl shadow-2xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <BookOpen className="h-4 w-4" />
              <span>فهرس المكتبة الشاملة والتراث المنظم</span>
            </div>
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <span>استكشاف واستدخال كتب التراث الإسلامي</span>
              {loadingIngested ? (
                <RefreshCw className="h-4 w-4 text-white/40 animate-spin" />
              ) : (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {totalIngestedCount} كتاب مضاف في السحابة
                </span>
              )}
            </h3>
          </div>

          {/* VIEW MODE TOGGLE & REFRESH */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                loadIngestedMap();
                loadActiveJobs();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs border border-white/10 transition-all cursor-pointer"
              title="تحديث حالة الكتب من Qdrant Cloud و Kaggle Jobs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingIngested ? 'animate-spin' : ''}`} />
              <span>تحديث الحالة</span>
            </button>

            <div className="flex items-center rounded-xl bg-black/40 p-1 border border-white/10">
              <button
                onClick={() => setViewMode('categories')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'categories'
                    ? 'bg-sky-500 text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Folder className="h-3.5 w-3.5" />
                <span>حسب الأقسام</span>
              </button>
              <button
                onClick={() => setViewMode('flat')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'flat'
                    ? 'bg-sky-500 text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <List className="h-3.5 w-3.5" />
                <span>قائمة شاملة</span>
              </button>
            </div>
          </div>
        </div>

        {/* SEARCH BAR & STATUS TABS */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-6">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              type="text"
              placeholder="ابحث باسم الكتاب، اسم المؤلف، رقم المعرف (مثال: عمدة الفقه، المغني، 11315)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/40 py-3 pr-11 pl-10 text-sm text-white placeholder-white/40 focus:border-sky-500 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Status Tabs Filter */}
          <div className="md:col-span-6 flex items-center justify-start md:justify-end gap-2 overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'border-white/30 bg-white/15 text-white shadow-sm'
                  : 'border-white/5 bg-black/20 text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              جميع الكتب ({allBooks.length.toLocaleString()})
            </button>
            <button
              onClick={() => setStatusFilter('ingested')}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                statusFilter === 'ingested'
                  ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300 shadow-sm'
                  : 'border-white/5 bg-black/20 text-emerald-400/70 hover:bg-emerald-500/10 hover:text-emerald-300'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>المضافة فقط ({totalIngestedCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('ingesting')}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                statusFilter === 'ingesting'
                  ? 'border-amber-500/60 bg-amber-500/20 text-amber-300 shadow-sm'
                  : 'border-white/5 bg-black/20 text-amber-400/70 hover:bg-amber-500/10 hover:text-amber-300'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>جاري الإضافة ({activeBookIdsSet.size})</span>
            </button>
            <button
              onClick={() => setStatusFilter('unprocessed')}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                statusFilter === 'unprocessed'
                  ? 'border-sky-500/60 bg-sky-500/20 text-sky-300 shadow-sm'
                  : 'border-white/5 bg-black/20 text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              غير المضافة ({Math.max(0, allBooks.length - totalIngestedCount - activeBookIdsSet.size).toLocaleString()})
            </button>
          </div>
        </div>
      </div>

      {/* ================= BATCH SELECTION STICKY BAR ================= */}
      {selectedList.length > 0 && (
        <>
          {/* CASE 1: ALL SELECTED BOOKS ARE ALREADY INGESTED */}
          {isAllIngested && (
            <div className="sticky top-2 z-50 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/50 bg-gradient-to-r from-emerald-950/95 via-black/95 to-teal-950/95 py-3 px-4 shadow-2xl backdrop-blur-2xl ring-1 ring-emerald-500/30 animate-in slide-in-from-top duration-200">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0 shadow-inner">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      تم تحديد <span className="text-emerald-400 font-mono text-base">{selectedList.length}</span> {selectedList.length === 1 ? 'كتاب مخزن ومفهرس' : 'كتب مخزنة ومفهرسة'} بالفعل في الكلاستر
                    </span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 font-bold flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      <span>مفهرس في Qdrant Cloud</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-white/60 hidden sm:block mt-0.5">
                    جميع الكتب المحددة متوفرة في السحابة. يمكنك مسحها لتحرير الكلاستر أو إعادة استدخالها وتضمينها مجدداً.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white cursor-pointer transition-colors"
                >
                  إلغاء التحديد
                </button>

                {/* Batch Delete */}
                <button
                  type="button"
                  onClick={() => setBatchToDelete(selectedIngested)}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/15 px-3.5 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500 hover:text-white shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
                  title="مسح كافة الكتب المحددة من الكلاستر وحذف كافة متجهاتها"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>مسح من الكلاستر ({selectedList.length})</span>
                </button>

                {/* Re-ingest / Re-embed */}
                <button
                  type="button"
                  onClick={() => onSelectBooksForIngest(selectedList, 'kaggle')}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 px-4 py-2 text-xs font-extrabold text-black shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-emerald-500 transition-all cursor-pointer"
                  title="إعادة بناء التضمين والفهرسة لهذه الكتب"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>إعادة الاستدخال والتضمين</span>
                </button>
              </div>
            </div>
          )}

          {/* CASE 2: MIXED SELECTION (SOME INGESTED, SOME UNPROCESSED) */}
          {isMixedSelection && (
            <div className="sticky top-2 z-50 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-purple-500/50 bg-gradient-to-r from-[#1c0830]/95 via-black/95 to-[#160b2b]/95 py-3 px-4 shadow-2xl backdrop-blur-2xl ring-1 ring-purple-500/30 animate-in slide-in-from-top duration-200">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0 shadow-inner">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      تحديد مجمع: <span className="font-mono text-base text-purple-300">{selectedList.length}</span> كتب
                    </span>
                    {selectedUnprocessed.length > 0 && (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/20 font-bold">
                        {selectedUnprocessed.length} غير مضاف (جديد)
                      </span>
                    )}
                    {selectedIngested.length > 0 && (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 font-bold">
                        {selectedIngested.length} مضاف مسبقاً
                      </span>
                    )}
                    {selectedIngesting.length > 0 && (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/20 font-bold animate-pulse">
                        {selectedIngesting.length} جاري إضافته
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-white/60 hidden sm:block mt-0.5">
                    يحتوي التحديد على مزيج من كتب جديدة ومضافة مسبقاً. اختر الإجراء الأنسب لك:
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white cursor-pointer transition-colors"
                >
                  إلغاء التحديد
                </button>

                {/* Option to Delete the ingested ones only */}
                {selectedIngested.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setBatchToDelete(selectedIngested)}
                    className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                    title="مسح الكتب المضافة مسبقاً فقط من الكلاستر"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>مسح المضاف ({selectedIngested.length})</span>
                  </button>
                )}

                {/* Option to Process All (Upsert/Re-ingest all) */}
                <button
                  type="button"
                  onClick={() => onSelectBooksForIngest(selectedList, 'kaggle')}
                  className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition-all cursor-pointer"
                  title="استدخال وتحديث كافة الكتب المحددة بما فيها المضاف مسبقاً"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
                  <span>معالجة الكل ({selectedList.length})</span>
                </button>

                {/* RECOMMENDED PRIMARY ACTION: Ingest New Only */}
                {selectedUnprocessed.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onSelectBooksForIngest(selectedUnprocessed, 'kaggle')}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 via-emerald-400 to-teal-400 px-4 py-2 text-xs font-black text-black shadow-lg shadow-sky-500/25 hover:opacity-95 transition-all cursor-pointer"
                    title="استدخال الكتب الجديدة فقط وتخطي المضاف مسبقاً لتوفير وقت وحساب Kaggle GPU"
                  >
                    <Cpu className="h-4 w-4" />
                    <span>استدخال الجديد فقط ({selectedUnprocessed.length})</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* CASE 3: ALL SELECTED BOOKS ARE UNPROCESSED (STANDARD) */}
          {isAllUnprocessed && (
            <div className="sticky top-2 z-50 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/50 bg-gradient-to-r from-amber-950/95 via-black/95 to-purple-950/95 py-3 px-4 shadow-2xl backdrop-blur-2xl ring-1 ring-amber-500/30 animate-in slide-in-from-top duration-200">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                  <CheckSquare className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      تم تحديد <span className="text-amber-400 font-mono text-base">{selectedList.length}</span> كتب للاستدخال السحابي المجمع
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/20 font-semibold">
                      Kaggle GPU Cloud
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50 hidden sm:block">
                    سيتم تجهيز مهمة واحدة على Kaggle GPU لمعالجة كافة الكتب عبر شبكة كاجل
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white cursor-pointer transition-colors"
                >
                  إلغاء التحديد
                </button>

                <button
                  type="button"
                  onClick={() => onSelectBooksForIngest(selectedList, 'kaggle')}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 px-4 py-2 text-xs font-extrabold text-black shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-amber-500 transition-all cursor-pointer"
                >
                  <Cpu className="h-4 w-4" />
                  <span>استدخال سحابي للكتب المحددة</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ================= VIEW MODE 1: CATEGORY ACCORDION VIEW ================= */}
      {viewMode === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2 text-xs text-white/50">
            <span>
              عرض {processedCategories.length} قسماً فقهياً وعلمياً من تصنيفات المكتبة
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExpandAll}
                className="hover:text-white text-white/60 cursor-pointer"
              >
                توسيع كل الأقسام
              </button>
              <span>•</span>
              <button
                onClick={handleCollapseAll}
                className="hover:text-white text-white/60 cursor-pointer"
              >
                طي الكل
              </button>
            </div>
          </div>

          {processedCategories.map((cat) => {
            const isExpanded = expandedCategories.has(cat.title);
            const progress = cat.totalCount > 0 ? (cat.ingestedCount / cat.totalCount) * 100 : 0;
            const hasUnprocessed = cat.totalCount > cat.ingestedCount;

            return (
              <div
                key={cat.title}
                className="rounded-2xl border border-white/10 bg-[#160628]/80 overflow-hidden shadow-xl transition-all"
              >
                {/* CATEGORY ACCORDION HEADER */}
                <div
                  onClick={() => toggleCategoryAccordion(cat.title)}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white/[0.03] hover:bg-white/[0.06] cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {isExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{cat.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-normal">
                          {cat.totalCount} كتاب
                        </span>
                        {cat.ingestedCount > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                            {cat.ingestedCount} مضاف
                          </span>
                        )}
                        {cat.ingestingCount > 0 && (
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold animate-pulse">
                            <Clock className="h-3 w-3" />
                            <span>{cat.ingestingCount} جاري إضافته</span>
                          </span>
                        )}
                      </h4>
                      {/* Mini Progress */}
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-emerald-400 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-white/40">
                          {progress.toFixed(0)}% مكتمل
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {hasUnprocessed && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const originalCat = categories.find((c) => c.title === cat.title);
                          if (originalCat) handleSelectCategoryUnprocessed(originalCat);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-amber-500/20 text-white/60 hover:text-amber-300 border border-white/10 hover:border-amber-500/30 text-xs transition-all cursor-pointer"
                        title="تحديد كل الكتب غير المضافة في هذا القسم دفعة واحدة"
                      >
                        <CheckSquare className="h-3.5 w-3.5" />
                        <span>تحديد غير المضاف</span>
                      </button>
                    )}

                    <div className="p-1 rounded-lg bg-white/5 text-white/50">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronLeft className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* CATEGORY BOOKS LIST */}
                {isExpanded && (
                  <div className="p-4 border-t border-white/5 space-y-2 bg-black/20 animate-in fade-in">
                    {cat.books.length === 0 ? (
                      <div className="p-6 text-center text-xs text-white/40">
                        لا توجد كتب تطابق الفلتر الحالي داخل هذا القسم.
                      </div>
                    ) : (
                      cat.books.map((book) => {
                        const bId = Number(book.turath_id);
                        const isSelected = selectedBooksMap.has(bId);
                        const ingestedRecord = ingestedMap[bId];
                        const isIngested = !!ingestedRecord;
                        const isIngesting = activeBookIdsSet.has(bId);

                        return (
                          <div
                            key={bId}
                            className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 transition-all ${
                              isIngested
                                ? 'border-emerald-500/30 bg-emerald-950/20 text-white'
                                : isIngesting
                                ? 'border-amber-500/40 bg-amber-950/20 text-white shadow-md'
                                : isSelected
                                ? 'border-sky-500/60 bg-sky-950/40 text-white shadow-md'
                                : 'border-white/5 bg-black/30 text-white/80 hover:border-white/15 hover:bg-white/5'
                            }`}
                          >
                            {/* Book Info & Checkbox */}
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                disabled={isIngesting}
                                className="text-white/60 hover:text-white cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                onClick={() => toggleBook(book)}
                              >
                                {isSelected ? (
                                  <CheckSquare className="h-5 w-5 text-sky-400" />
                                ) : (
                                  <Square className="h-5 w-5 text-white/30" />
                                )}
                              </button>

                              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 font-mono text-[11px] text-white/60 border border-white/10 shrink-0">
                                #{bId}
                              </span>

                              <div>
                                <h5 className="text-sm font-bold text-white flex items-center gap-2">
                                  <span>{book.title}</span>
                                  {isIngested ? (
                                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                      <CheckCircle2 className="h-3 w-3" />
                                      <span>مضاف</span>
                                    </span>
                                  ) : isIngesting ? (
                                    <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30 animate-pulse">
                                      <Clock className="h-3 w-3" />
                                      <span>جاري الإضافة على Kaggle...</span>
                                    </span>
                                  ) : null}
                                </h5>
                                <p className="text-xs text-white/50 mt-0.5">
                                  {book.author || 'مؤلف غير معروف'}
                                </p>
                              </div>
                            </div>

                            {/* Actions & Status Badge */}
                            <div className="flex items-center gap-2.5">
                              {isIngested ? (
                                <>
                                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs">
                                    <HardDrive className="h-3.5 w-3.5" />
                                    <span>
                                      {ingestedRecord.collection} • {ingestedRecord.chunks_count} فقرة
                                    </span>
                                  </div>

                                  {/* DELETE FROM QDRANT BUTTON */}
                                  <button
                                    type="button"
                                    onClick={() => setBookToDelete({ book, meta: ingestedRecord })}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 text-xs font-semibold transition-all cursor-pointer"
                                    title="مسح الكتاب ومتجهاته من Qdrant Cloud"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span>مسح من الكلاستر</span>
                                  </button>
                                </>
                              ) : isIngesting ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const job = activeJobsData.jobs.find((j: any) =>
                                      (j.book_ids || []).map(Number).includes(bId)
                                    );
                                    onOpenBookIngestModal(book, 3, job?.kernel_slug, job?.target_collection);
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/40 hover:to-amber-600/40 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all cursor-pointer animate-pulse shadow-sm"
                                  title="فتح لوحة المراحل والطرفية الحية لمتابعة هذا الكتاب"
                                >
                                  <Play className="h-3.5 w-3.5 fill-amber-300" />
                                  <span>متابعة واستئناف المراحل</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onOpenBookIngestModal(book)}
                                  className="flex items-center gap-1.5 rounded-xl bg-sky-500/20 px-3.5 py-1.5 text-xs font-bold text-sky-300 border border-sky-500/30 hover:bg-sky-500 hover:text-black transition-all cursor-pointer shadow-sm"
                                >
                                  <PlusCircle className="h-3.5 w-3.5" />
                                  <span>+ إضافة إلى كلاستر</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ================= VIEW MODE 2: FLAT LIST VIEW ================= */}
      {viewMode === 'flat' && (
        <div className="rounded-2xl border border-white/10 bg-[#160628]/80 p-5 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-white/10 gap-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-sky-400" />
              <span>
                قائمة الكتب الشاملة ({flatFilteredBooks.length.toLocaleString()} كتاب)
              </span>
            </h4>

            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/50">
                صفحة {currentPage} من {totalFlatPages}
              </span>
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-white disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                disabled={currentPage >= totalFlatPages}
                onClick={() => setCurrentPage((p) => Math.min(totalFlatPages, p + 1))}
                className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-white disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {paginatedFlatBooks.map((book) => {
              const bId = Number(book.turath_id);
              const isSelected = selectedBooksMap.has(bId);
              const ingestedRecord = ingestedMap[bId];
              const isIngested = !!ingestedRecord;
              const isIngesting = activeBookIdsSet.has(bId);

              return (
                <div
                  key={bId}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 transition-all ${
                    isIngested
                      ? 'border-emerald-500/30 bg-emerald-950/20 text-white'
                      : isIngesting
                      ? 'border-amber-500/40 bg-amber-950/20 text-white shadow-md'
                      : isSelected
                      ? 'border-sky-500/60 bg-sky-950/40 text-white shadow-md'
                      : 'border-white/5 bg-black/20 text-white/80 hover:border-white/15 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={isIngesting}
                      className="text-white/60 hover:text-white cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      onClick={() => toggleBook(book)}
                    >
                      {isSelected ? (
                        <CheckSquare className="h-5 w-5 text-sky-400" />
                      ) : (
                        <Square className="h-5 w-5 text-white/30" />
                      )}
                    </button>

                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 font-mono text-[11px] text-white/60 border border-white/10 shrink-0">
                      #{bId}
                    </span>

                    <div>
                      <h5 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{book.title}</span>
                        {isIngested ? (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>مضاف</span>
                          </span>
                        ) : isIngesting ? (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30 animate-pulse">
                            <Clock className="h-3 w-3" />
                            <span>جاري الإضافة على Kaggle...</span>
                          </span>
                        ) : null}
                      </h5>
                      <p className="text-xs text-white/50 mt-0.5">
                        {book.author || 'مؤلف غير معروف'} • {book.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {isIngested ? (
                      <>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs">
                          <HardDrive className="h-3.5 w-3.5" />
                          <span>
                            {ingestedRecord.collection} • {ingestedRecord.chunks_count} فقرة
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setBookToDelete({ book, meta: ingestedRecord })}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 text-xs font-semibold transition-all cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>مسح من الكلاستر</span>
                        </button>
                      </>
                    ) : isIngesting ? (
                      <button
                        type="button"
                        onClick={() => {
                          const job = activeJobsData.jobs.find((j: any) =>
                            (j.book_ids || []).map(Number).includes(bId)
                          );
                          onOpenBookIngestModal(book, 3, job?.kernel_slug, job?.target_collection);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/40 hover:to-amber-600/40 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all cursor-pointer animate-pulse shadow-sm"
                        title="فتح لوحة المراحل والطرفية الحية لمتابعة هذا الكتاب"
                      >
                        <Play className="h-3.5 w-3.5 fill-amber-300" />
                        <span>متابعة واستئناف المراحل</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenBookIngestModal(book)}
                        className="flex items-center gap-1.5 rounded-xl bg-sky-500/20 px-3.5 py-1.5 text-xs font-bold text-sky-300 border border-sky-500/30 hover:bg-sky-500 hover:text-black transition-all cursor-pointer shadow-sm"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span>+ إضافة إلى كلاستر</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {bookToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-[#16031f] p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/20 border border-rose-500/30 shadow-lg">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">تأكيد مسح الكتاب من Qdrant Cloud</h4>
                <p className="text-xs text-white/50">تحرير سعة الكلاستر وحذف متجهات الكتاب</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-white/10 bg-black/40 text-xs space-y-2 text-white/80 leading-relaxed">
              <p>
                هل أنت متأكد من رغبتك في حذف كتاب:
                <br />
                <span className="font-bold text-white text-sm">«{bookToDelete.book.title}»</span> (معرف #{bookToDelete.book.turath_id})
              </p>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-white/60">
                <span>المجموعة: <strong className="text-emerald-400">{bookToDelete.meta.collection}</strong></span>
                <span>المتجهات: <strong className="text-rose-400">{bookToDelete.meta.chunks_count} فقرة</strong></span>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-300">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBookToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-xs text-white/70 hover:text-white cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              >
                {isDeleting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span>{isDeleting ? 'جاري المسح من السحابة...' : 'تأكيد المسح نهائياً'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ================= BATCH DELETE CONFIRMATION MODAL ================= */}
      {batchToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-rose-500/30 bg-[#16031f] p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/20 border border-rose-500/30 shadow-lg shrink-0">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">تأكيد مسح {batchToDelete.length} كتب من Qdrant Cloud</h4>
                <p className="text-xs text-white/50">تحرير سعة الكلاستر وحذف متجهات الكتب المحددة نهائياً</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-white/10 bg-black/40 text-xs space-y-3 text-white/80 leading-relaxed">
              <div className="flex items-center justify-between text-white/70 pb-2 border-b border-white/10">
                <span>إجمالي الكتب المراد مسحها: <strong className="text-white font-mono">{batchToDelete.length} كتب</strong></span>
                <span>مجموع المتجهات: <strong className="text-rose-400 font-mono">{batchTotalVectors.toLocaleString()} فقرة</strong></span>
              </div>

              {/* Scrollable list of books */}
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {batchToDelete.map((b) => {
                  const bId = Number(b.turath_id);
                  const meta = ingestedMap[bId];
                  return (
                    <div
                      key={bId}
                      className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/5 border border-white/5 text-[11px]"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-white/40">#{bId}</span>
                        <span className="font-semibold text-white truncate">{b.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {meta && (
                          <>
                            <span className="text-emerald-400/80 font-mono text-[10px]">{meta.collection}</span>
                            <span className="text-rose-300 font-mono text-[10px]">{meta.chunks_count} فقرة</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {batchDeleteProgress && (
              <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-300 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span>جاري مسح: {batchDeleteProgress.title}</span>
                  <span className="font-mono">{batchDeleteProgress.current} / {batchDeleteProgress.total}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-200"
                    style={{ width: `${(batchDeleteProgress.current / batchDeleteProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {deleteError && (
              <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-300">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBatchToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-xs text-white/70 hover:text-white cursor-pointer disabled:opacity-40"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-40"
              >
                {isDeleting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span>{isDeleting ? 'جاري المسح الجماعي من السحابة...' : `تأكيد مسح ${batchToDelete.length} كتب نهائياً`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
