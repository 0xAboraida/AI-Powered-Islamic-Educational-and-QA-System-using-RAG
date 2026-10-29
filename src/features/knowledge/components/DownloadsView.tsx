import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Download, 
  Search, 
  HardDriveDownload, 
  ArrowRight, 
  X,
  List,
  LayoutGrid,
  Layers,
  ChevronDown,
  Check
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { BookMeta } from '../types/bookTypes';
import { 
  idbGetAllOfflineBookPackages, 
  idbRemoveOfflineBook,
  OfflineBookPackage 
} from '../../../utils/indexedDbStorage';
import { BookCard } from './BookCard';

interface DownloadsViewProps {
  onReadBook: (book: BookMeta) => void;
  onBrowseLibrary: () => void;
  publishedBooks: BookMeta[];
  onAskBook?: (book: any) => void;
  onOpenAuthorBio?: (book: BookMeta) => void;
  onOpenBookInfo?: (book: BookMeta) => void;
  favoriteBookIds?: Set<number | string>;
  toggleFavorite?: (id: number | string) => void;
}

export default function DownloadsView({
  onReadBook,
  onBrowseLibrary,
  publishedBooks,
  onAskBook,
  onOpenAuthorBio,
  onOpenBookInfo,
  favoriteBookIds = new Set(),
  toggleFavorite = () => {},
}: DownloadsViewProps) {
  const { accentColor, isDark } = useTheme();

  // Layout mode: default to 'list' as requested
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const [offlinePackages, setOfflinePackages] = useState<OfflineBookPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const categoryPickerRef = useRef<HTMLDivElement>(null);

  const loadOfflinePackages = async () => {
    setLoading(true);
    try {
      const pkgs = await idbGetAllOfflineBookPackages();
      setOfflinePackages(pkgs);
    } catch (err) {
      console.error('Failed to load offline packages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOfflineBook = async (book: BookMeta) => {
    try {
      await idbRemoveOfflineBook(book.id);
      await loadOfflinePackages();
    } catch (err) {
      console.error('Failed to remove offline book:', err);
    }
  };

  useEffect(() => {
    loadOfflinePackages();
  }, []);

  // Close category picker on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryPickerRef.current && !categoryPickerRef.current.contains(e.target as Node)) {
        setIsCategoryPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Map each offline package to a rich BookMeta object with category
  const downloadedBooks = useMemo<BookMeta[]>(() => {
    return offlinePackages.map(pkg => {
      const found = publishedBooks.find(b => String(b.id) === String(pkg.bookId));
      if (found) {
        return {
          ...found,
          category: found.category || 'عام',
        };
      }
      return {
        id: pkg.bookId,
        title: pkg.title,
        author: pkg.author || 'غير محدد',
        category: 'محمّل محلياً',
      } as BookMeta;
    });
  }, [offlinePackages, publishedBooks]);

  // Extract unique categories for dropdown filter
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    downloadedBooks.forEach(b => {
      if (b.category) cats.add(b.category);
    });
    return Array.from(cats);
  }, [downloadedBooks]);

  // Filter books by query and category
  const filteredBooks = useMemo(() => {
    return downloadedBooks.filter(b => {
      const q = query.trim().toLowerCase();
      const matchesQuery = !q || 
        (b.title || '').toLowerCase().includes(q) || 
        (b.author || '').toLowerCase().includes(q) ||
        (b.category || '').toLowerCase().includes(q);

      const matchesCat = selectedCategory === 'all' || b.category === selectedCategory;

      return matchesQuery && matchesCat;
    });
  }, [downloadedBooks, query, selectedCategory]);

  const getHeroSearchContainerStyle = () => {
    if (isDark) {
      switch (accentColor) {
        case 'emerald':
          return 'bg-[#0f1724]/75 hover:bg-[#0f1724]/85 backdrop-blur-2xl border border-teal-500/35 hover:border-teal-400/55 shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.18)] ring-1 ring-teal-500/20 text-teal-100';
        case 'amber':
          return 'bg-[#15141b]/75 hover:bg-[#15141b]/85 backdrop-blur-2xl border border-[#dfbf83]/35 hover:border-[#dfbf83]/55 shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.18)] ring-1 ring-[#dfbf83]/20 text-[#eed8ad]';
        case 'blue':
          return 'bg-[#0f1724]/75 hover:bg-[#0f1724]/85 backdrop-blur-2xl border border-blue-500/35 hover:border-blue-400/55 shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.18)] ring-1 ring-blue-500/20 text-blue-100';
        case 'purple':
        default:
          return 'bg-[#140e24]/75 hover:bg-[#140e24]/85 backdrop-blur-2xl border border-purple-500/35 hover:border-purple-400/55 shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.18)] ring-1 ring-purple-500/20 text-purple-100';
      }
    } else {
      switch (accentColor) {
        case 'emerald':
          return 'bg-white/70 hover:bg-white/80 backdrop-blur-2xl border border-teal-200/80 hover:border-teal-300 shadow-[0_10px_35px_rgba(20,184,166,0.08),inset_0_1px_2px_rgba(255,255,255,0.95)] ring-1 ring-teal-500/15 text-slate-900';
        case 'amber':
          return 'bg-white/70 hover:bg-white/80 backdrop-blur-2xl border border-[#dfbf83]/60 hover:border-[#dfbf83] shadow-[0_10px_35px_rgba(184,141,70,0.08),inset_0_1px_2px_rgba(255,255,255,0.95)] ring-1 ring-[#dfbf83]/15 text-slate-900';
        case 'blue':
          return 'bg-white/70 hover:bg-white/80 backdrop-blur-2xl border border-blue-200/80 hover:border-blue-300 shadow-[0_10px_35px_rgba(59,130,246,0.08),inset_0_1px_2px_rgba(255,255,255,0.95)] ring-1 ring-blue-500/15 text-slate-900';
        case 'purple':
        default:
          return 'bg-white/70 hover:bg-white/80 backdrop-blur-2xl border border-purple-200/80 hover:border-purple-300 shadow-[0_10px_35px_rgba(168,85,247,0.08),inset_0_1px_2px_rgba(255,255,255,0.95)] ring-1 ring-purple-500/15 text-slate-900';
      }
    }
  };

  const getSearchBtnStyle = () => {
    switch (accentColor) {
      case 'emerald':
        return 'bg-gradient-to-tr from-teal-700 via-teal-500 to-cyan-400 hover:brightness-110 text-white shadow-lg shadow-teal-500/40 ring-1 ring-white/30';
      case 'amber':
        return 'bg-gradient-to-tr from-[#8e682d] via-[#c59b58] to-[#eedbb2] hover:brightness-110 text-stone-950 font-black shadow-lg shadow-[#dfbf83]/40 ring-1 ring-white/30';
      case 'blue':
        return 'bg-gradient-to-tr from-blue-700 via-blue-500 to-sky-400 hover:brightness-110 text-white shadow-lg shadow-blue-500/40 ring-1 ring-white/30';
      case 'purple':
      default:
        return 'bg-gradient-to-tr from-purple-700 via-purple-600 to-fuchsia-500 hover:brightness-110 text-white shadow-lg shadow-purple-600/40 ring-1 ring-white/30';
    }
  };

  const getFilterPillActiveStyle = () => {
    if (isDark) {
      switch (accentColor) {
        case 'amber':
          return 'bg-[#b88d46]/25 border-[#dfbf83]/60 text-[#eed9b0] shadow-sm shadow-amber-950/40';
        case 'emerald':
          return 'bg-teal-500/25 border-teal-400/60 text-teal-200 shadow-sm shadow-teal-950/40';
        case 'blue':
          return 'bg-blue-500/25 border-blue-400/60 text-blue-200 shadow-sm shadow-blue-950/40';
        case 'purple':
        default:
          return 'bg-purple-500/25 border-purple-400/60 text-purple-200 shadow-sm shadow-purple-950/40';
      }
    } else {
      switch (accentColor) {
        case 'amber':
          return 'bg-[#ebd9b5]/90 border-[#b88d46] text-stone-900 font-bold shadow-sm';
        case 'emerald':
          return 'bg-teal-100/90 border-teal-400 text-teal-950 font-bold shadow-sm';
        case 'blue':
          return 'bg-blue-100/90 border-blue-400 text-blue-950 font-bold shadow-sm';
        case 'purple':
        default:
          return 'bg-purple-100/90 border-purple-400 text-purple-950 font-bold shadow-sm';
      }
    }
  };

  const getAccentIconClass = () => {
    switch (accentColor) {
      case 'amber':
        return 'text-[#b88d46] dark:text-[#dfbf83]';
      case 'emerald':
        return 'text-teal-600 dark:text-teal-400';
      case 'blue':
        return 'text-blue-600 dark:text-blue-400';
      case 'purple':
      default:
        return 'text-brand-magenta dark:text-purple-400';
    }
  };

  const getDropdownActiveClass = () => {
    switch (accentColor) {
      case 'amber':
        return 'bg-[#dfbf83]/20 text-[#8a652a] dark:text-[#eed8ad] font-black';
      case 'emerald':
        return 'bg-teal-500/15 text-teal-800 dark:text-teal-200 font-black';
      case 'blue':
        return 'bg-blue-500/15 text-blue-800 dark:text-blue-200 font-black';
      case 'purple':
      default:
        return 'bg-brand-magenta/15 text-brand-magenta dark:text-purple-300 font-black';
    }
  };

  const getCardStyle = () => {
    if (isDark) {
      switch (accentColor) {
        case 'amber':
          return 'border border-white/10 bg-[#131620]/95 shadow-md shadow-black/30 backdrop-blur-md hover:border-[#dfbf83]/50';
        case 'emerald':
          return 'border border-white/10 bg-[#131620]/95 shadow-md shadow-black/30 backdrop-blur-md hover:border-teal-400/50';
        case 'blue':
          return 'border border-white/10 bg-[#131620]/95 shadow-md shadow-black/30 backdrop-blur-md hover:border-blue-400/50';
        case 'purple':
        default:
          return 'border border-white/10 bg-[#131620]/95 shadow-md shadow-black/30 backdrop-blur-md hover:border-purple-400/50';
      }
    }
    switch (accentColor) {
      case 'amber':
        return 'border-[#ebd9b5] bg-white/95 shadow-sm backdrop-blur-md hover:border-[#dfbf83]';
      case 'emerald':
        return 'border-teal-100 bg-white/95 shadow-sm backdrop-blur-md hover:border-teal-300';
      case 'blue':
        return 'border-blue-100 bg-white/95 shadow-sm backdrop-blur-md hover:border-blue-300';
      case 'purple':
      default:
        return 'border-purple-100 bg-white/95 shadow-sm backdrop-blur-md hover:border-purple-300';
    }
  };

  const getToggleActiveBtnStyle = () => {
    if (isDark) {
      switch (accentColor) {
        case 'amber': return 'bg-[#b88d46] text-stone-950 font-black shadow-sm';
        case 'emerald': return 'bg-teal-600 text-white shadow-sm';
        case 'blue': return 'bg-blue-600 text-white shadow-sm';
        case 'purple':
        default: return 'bg-brand-magenta text-white shadow-sm';
      }
    }
    switch (accentColor) {
      case 'amber': return 'bg-white text-[#8e682d] font-black shadow-sm border border-[#ebd9b5]';
      case 'emerald': return 'bg-white text-teal-700 font-bold shadow-sm border border-teal-200';
      case 'blue': return 'bg-white text-blue-700 font-bold shadow-sm border border-blue-200';
      case 'purple':
      default: return 'bg-white text-brand-magenta font-bold shadow-sm border border-purple-200';
    }
  };

  const getPopoverStyle = () => {
    if (isDark) {
      return 'bg-[#131620] border-white/10 text-white shadow-2xl';
    }
    return 'bg-white border-slate-200 text-slate-900 shadow-xl';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir="rtl">
      {/* 1. In-Page Floating Search Console (مطابق تماماً للأقسام والمؤلفين) */}
      <div id="downloads-search-bar" className="max-w-4xl mx-auto w-full">
        <div className={`relative rounded-2xl md:rounded-full transition-all duration-300 w-full ${getHeroSearchContainerStyle()}`}>
          <div className="flex items-center gap-2 sm:gap-3 px-3.5 sm:px-4 py-2 sm:py-2.5">
            {/* Circle Search Button */}
            <div
              className={`rounded-xl md:rounded-full flex items-center justify-center shadow-md shrink-0 ${getSearchBtnStyle()} w-9 h-9 sm:w-10 sm:h-10`}
            >
              <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>

            {/* Main Search Input */}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث في الكتب والملفات المحمّلة أوفلاين..."
              className={`min-w-0 flex-1 bg-transparent outline-none ${Boolean(query) ? 'font-bold' : 'font-normal'} ${
                isDark 
                  ? 'text-white placeholder:text-slate-400/50' 
                  : 'text-stone-900 placeholder:text-stone-400'
              } text-xs sm:text-sm py-1.5 md:py-1`}
            />

            {/* Clear button */}
            {Boolean(query) && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1.5 rounded-full transition-colors shrink-0 text-stone-500 hover:text-stone-900 dark:text-white/60 dark:hover:text-white cursor-pointer"
                title="مسح البحث"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Subtle Divider (Desktop only) */}
            <div className={`w-px shrink-0 ${isDark ? 'bg-white/20' : 'bg-stone-400/50'} h-6 sm:h-7 hidden md:block`} />

            {/* Category Dropdown (تصفية القسم - يظهر في الديسكتوب فقط) */}
            <div className="relative hidden md:block" ref={categoryPickerRef}>
              <button
                type="button"
                onClick={() => setIsCategoryPickerOpen(!isCategoryPickerOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                  selectedCategory !== 'all' 
                    ? getFilterPillActiveStyle() 
                    : 'bg-transparent border-transparent hover:bg-black/5 dark:hover:bg-white/10 text-stone-700 dark:text-stone-300'
                }`}
                title="تصفية حسب القسم"
              >
                <Layers className={`w-3.5 h-3.5 ${getAccentIconClass()} shrink-0`} />
                <span className="truncate max-w-[120px]">
                  {selectedCategory === 'all' ? 'القسم: الكل' : selectedCategory}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isCategoryPickerOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Category Dropdown Menu */}
              {isCategoryPickerOpen && (
                <div className={`absolute left-0 mt-2 w-56 rounded-2xl p-1.5 border shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 max-h-72 overflow-y-auto ${getPopoverStyle()}`}>
                  <div className="text-[11px] font-bold text-muted-foreground px-3 py-1.5 mb-1 border-b border-slate-100 dark:border-white/5">
                    تصفية حسب أقسام المحمّلات
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('all');
                      setIsCategoryPickerOpen(false);
                    }}
                    className={`w-full text-right px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-between cursor-pointer ${
                      selectedCategory === 'all'
                        ? getDropdownActiveClass()
                        : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>الكل ({downloadedBooks.length})</span>
                    {selectedCategory === 'all' && <Check className={`w-3.5 h-3.5 ${getAccentIconClass()}`} />}
                  </button>
                  {availableCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setIsCategoryPickerOpen(false);
                      }}
                      className={`w-full text-right px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-between cursor-pointer ${
                        selectedCategory === cat
                          ? getDropdownActiveClass()
                          : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="truncate">{cat}</span>
                      {selectedCategory === cat && <Check className={`w-3.5 h-3.5 ${getAccentIconClass()}`} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Category Filter Chips (تصفية القسم في الموبايل تحت شريط البحث) */}
        {availableCategories.length > 0 && (
          <div className="flex md:hidden items-center gap-1.5 overflow-x-auto no-scrollbar py-1 mt-2 px-0.5">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`shrink-0 px-3 py-1 rounded-xl text-xs font-bold transition-all border active:scale-95 cursor-pointer select-none ${
                selectedCategory === 'all'
                  ? getFilterPillActiveStyle()
                  : 'bg-slate-100/80 dark:bg-white/5 border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-300'
              }`}
            >
              جميع الأقسام ({downloadedBooks.length})
            </button>
            {availableCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 px-3 py-1 rounded-xl text-xs font-bold transition-all border active:scale-95 cursor-pointer select-none ${
                  selectedCategory === cat
                    ? getFilterPillActiveStyle()
                    : 'bg-slate-100/80 dark:bg-white/5 border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Header & Layout Toggle Bar (يظهر في الشاشات الكبيرة فقط ومخفي في الهاتف) */}
      <div className={`hidden md:flex rounded-2xl border p-2.5 sm:p-3 sm:px-5 items-center justify-between gap-2 sm:gap-3 ${getCardStyle()}`}>
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
          <HardDriveDownload className={`w-4.5 h-4.5 sm:w-5 sm:h-5 ${getAccentIconClass()} shrink-0`} />
          <h3 className="font-extrabold text-xs sm:text-base text-slate-900 dark:text-slate-100 truncate">
            الكتب والملفات المحمّلة ({filteredBooks.length})
          </h3>
        </div>

        {/* View Toggle (قائمة vs شبكة) */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground font-semibold hidden sm:inline">طريقة العرض:</span>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-black/40 p-1 rounded-xl border border-slate-200/60 dark:border-white/10">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? getToggleActiveBtnStyle()
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="عرض كقائمة"
            >
              <List className="w-3.5 h-3.5" />
              <span>قائمة</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? getToggleActiveBtnStyle()
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="عرض كشبكة بطاقات (3 في الصف)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>شبكة</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Content */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className={`w-8 h-8 border-3 border-current/20 border-t-current rounded-full animate-spin ${getAccentIconClass()}`} />
          <p className="text-xs text-muted-foreground font-bold">جارٍ فحص الذاكرة المحلية والكتب المحمّلة...</p>
        </div>
      ) : offlinePackages.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 dark:border-white/10 bg-white/40 dark:bg-white/[0.02] p-12 sm:p-16 text-center space-y-4">
          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto shadow-inner ${
            accentColor === 'amber'
              ? 'bg-[#dfbf83]/15 text-[#8e682d] dark:text-[#eedbb2]'
              : accentColor === 'emerald'
              ? 'bg-teal-500/10 text-teal-600'
              : accentColor === 'blue'
              ? 'bg-blue-500/10 text-blue-600'
              : 'bg-brand-magenta/10 text-brand-magenta'
          }`}>
            <Download className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            لا توجد كتب محمّلة حالياً على هذا الجهاز
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            يمكنك حفظ أي كتاب وتنزيله للقراءة بدون إنترنت من خلال الضغط على أيقونة التنزيل (📥) في بطاقة الكتاب داخل الأقسام، ليتوفر معك حتى عند انقطاع الشبكة.
          </p>
          <button
            type="button"
            onClick={onBrowseLibrary}
            className={`inline-flex items-center gap-2 py-2.5 px-6 rounded-xl text-white text-xs font-bold transition-all shadow-md cursor-pointer ${
              accentColor === 'amber'
                ? 'bg-gradient-to-r from-[#8e682d] to-[#dfbf83] text-stone-950 font-black shadow-amber-900/20'
                : accentColor === 'emerald'
                ? 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20'
                : accentColor === 'blue'
                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                : 'bg-brand-magenta hover:bg-brand-deep shadow-brand-magenta/20'
            }`}
          >
            <span>استعراض كتب وأقسام المكتبة</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-white/[0.02] p-10 text-center space-y-2">
          <p className="text-sm font-bold text-slate-800 dark:text-white">لم يتم العثور على نتائج في المحمّلات</p>
          <p className="text-xs text-muted-foreground">تأكد من كتابة اسم الكتاب أو اختيار القسم المناسب</p>
        </div>
      ) : viewMode === 'list' ? (
        /* ========================================================================= */
        /* LIST VIEW MODE (قائمة أفقية متتالية بنفس فريم بطاقة الكتاب في الأقسام)      */
        /* ========================================================================= */
        <div className="space-y-3">
          {filteredBooks.map((book) => (
            <BookCard
              key={String(book.id)}
              book={book}
              viewMode="list"
              showCategoryBadge={true}
              onRead={() => onReadBook(book)}
              onAsk={(b) => onAskBook?.(b) || onReadBook(book)}
              onOpenAuthorBio={onOpenAuthorBio}
              onOpenBookInfo={(b) => onOpenBookInfo?.(b)}
              isFavorite={favoriteBookIds.has(book.id) || favoriteBookIds.has(book.title)}
              onToggleFavorite={(b) => toggleFavorite(b.id)}
              onDeleteOffline={handleDeleteOfflineBook}
            />
          ))}
        </div>
      ) : (
        /* ========================================================================= */
        /* GRID VIEW MODE (شبكة بطاقات بنفس فريم بطاقة الكتاب في الأقسام)             */
        /* ========================================================================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBooks.map((book) => (
            <BookCard
              key={String(book.id)}
              book={book}
              viewMode="grid"
              showCategoryBadge={true}
              onRead={() => onReadBook(book)}
              onAsk={(b) => onAskBook?.(b) || onReadBook(book)}
              onOpenAuthorBio={onOpenAuthorBio}
              onOpenBookInfo={(b) => onOpenBookInfo?.(b)}
              isFavorite={favoriteBookIds.has(book.id) || favoriteBookIds.has(book.title)}
              onToggleFavorite={(b) => toggleFavorite(b.id)}
              onDeleteOffline={handleDeleteOfflineBook}
            />
          ))}
        </div>
      )}
    </div>
  );
}
