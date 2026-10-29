import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Heart, 
  Search, 
  ArrowRight,
  List,
  LayoutGrid,
  X,
  Layers,
  ChevronDown,
  Check
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { BookMeta } from '../types/bookTypes';
import { BookCard } from './BookCard';

interface FavoriteBooksViewProps {
  favoriteBooks: BookMeta[];
  onRead: (book: BookMeta) => void;
  onAsk: (book: any) => void;
  onRemoveFavorite: (bookId: string | number) => void;
  onBrowseLibrary: () => void;
  onOpenAuthorBio?: (book: BookMeta) => void;
  onOpenBookInfo?: (book: BookMeta) => void;
}

export default function FavoriteBooksView({
  favoriteBooks,
  onRead,
  onAsk,
  onRemoveFavorite,
  onBrowseLibrary,
  onOpenAuthorBio,
  onOpenBookInfo,
}: FavoriteBooksViewProps) {
  const { accentColor, isDark } = useTheme();

  // Layout mode: default to 'list'
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const categoryPickerRef = useRef<HTMLDivElement>(null);

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

  // Extract unique categories from favorite books
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    favoriteBooks.forEach(b => {
      const c = b.category;
      if (c) cats.add(c);
    });
    return Array.from(cats);
  }, [favoriteBooks]);

  // Filter books by query and category
  const filtered = useMemo(() => {
    return favoriteBooks.filter(b => {
      const title = (b.title || '').toLowerCase();
      const author = (b.author || '').toLowerCase();
      const cat = (b.category || '').toLowerCase();
      const q = query.toLowerCase().trim();

      const matchesQuery = !q || title.includes(q) || author.includes(q) || cat.includes(q);
      const matchesCat = selectedCategory === 'all' || b.category === selectedCategory;

      return matchesQuery && matchesCat;
    });
  }, [favoriteBooks, query, selectedCategory]);

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

  const getCardStyle = () => {
    if (isDark) {
      return 'border border-white/10 bg-[#131620]/95 shadow-md shadow-black/30 backdrop-blur-md hover:bg-[#181b26]';
    }
    return 'border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md hover:border-amber-400';
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
    <div className="animate-in fade-in duration-300 space-y-6" dir="rtl">
      {/* 1. In-Page Floating Search Console (مطابق تماماً للأقسام والمؤلفين) */}
      <div id="favorites-search-bar" className="max-w-4xl mx-auto w-full">
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
              placeholder="ابحث في الكتب والمصنفات المفضلة..."
              className={`min-w-0 flex-1 bg-transparent outline-none ${Boolean(query) ? 'font-bold' : 'font-normal'} ${
                isDark 
                  ? 'text-white placeholder:text-slate-400/50' 
                  : 'text-stone-900 placeholder:text-stone-400'
              } text-xs sm:text-sm py-1.5 md:py-1`}
            />

            {/* Clear Button */}
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
                <Layers className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="truncate max-w-[120px]">
                  {selectedCategory === 'all' ? 'القسم: الكل' : selectedCategory}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isCategoryPickerOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Category Dropdown Menu */}
              {isCategoryPickerOpen && (
                <div className={`absolute left-0 mt-2 w-56 rounded-2xl p-1.5 border shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 max-h-72 overflow-y-auto ${getPopoverStyle()}`}>
                  <div className="text-[11px] font-bold text-muted-foreground px-3 py-1.5 mb-1 border-b border-slate-100 dark:border-white/5">
                    تصفية حسب أقسام المفضلة
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('all');
                      setIsCategoryPickerOpen(false);
                    }}
                    className={`w-full text-right px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-between cursor-pointer ${
                      selectedCategory === 'all'
                        ? 'bg-rose-500/15 text-rose-800 dark:text-rose-200 font-black'
                        : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>الكل ({favoriteBooks.length})</span>
                    {selectedCategory === 'all' && <Check className="w-3.5 h-3.5 text-rose-500" />}
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
                          ? 'bg-rose-500/15 text-rose-800 dark:text-rose-200 font-black'
                          : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="truncate">{cat}</span>
                      {selectedCategory === cat && <Check className="w-3.5 h-3.5 text-rose-500" />}
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
                  ? 'bg-rose-500/20 text-rose-800 dark:text-rose-200 border-rose-500/40 font-black'
                  : 'bg-slate-100/80 dark:bg-white/5 border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-300'
              }`}
            >
              جميع الأقسام ({favoriteBooks.length})
            </button>
            {availableCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 px-3 py-1 rounded-xl text-xs font-bold transition-all border active:scale-95 cursor-pointer select-none ${
                  selectedCategory === cat
                    ? 'bg-rose-500/20 text-rose-800 dark:text-rose-200 border-rose-500/40 font-black'
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
          <Heart className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-rose-500 fill-rose-500 shrink-0" />
          <h3 className="font-extrabold text-xs sm:text-base text-slate-900 dark:text-slate-100 truncate">
            قائمة الكتب المفضلة ({filtered.length})
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
      {favoriteBooks.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 dark:border-white/10 bg-white/40 dark:bg-white/[0.02] p-12 sm:p-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            قائمة المفضلة فارغة حالياً
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            اضغط على أيقونة القلب (🤍) في بطاقة أي كتاب يعجبك أثناء تصفح أقسام المكتبة للوصول السريع إليه هنا في أي وقت.
          </p>
          <button
            type="button"
            onClick={onBrowseLibrary}
            className="inline-flex items-center gap-2 py-2.5 px-6 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold transition-all shadow-md cursor-pointer hover:opacity-90"
          >
            <span>استعراض أقسام المكتبة</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          لا توجد نتائج مطابقة لبحثك في المفضلة.
        </div>
      ) : viewMode === 'list' ? (
        /* ========================================================================= */
        /* LIST VIEW MODE (قائمة أفقية متتالية بنفس فريم بطاقة الكتاب في الأقسام)      */
        /* ========================================================================= */
        <div className="space-y-3">
          {filtered.map((book) => (
            <BookCard
              key={String(book.id || book.title)}
              book={book}
              viewMode="list"
              showCategoryBadge={true}
              onRead={onRead}
              onAsk={onAsk}
              onOpenAuthorBio={onOpenAuthorBio}
              onOpenBookInfo={(b) => onOpenBookInfo?.(b)}
              isFavorite={true}
              onToggleFavorite={() => onRemoveFavorite(book.id || book.title)}
            />
          ))}
        </div>
      ) : (
        /* ========================================================================= */
        /* GRID VIEW MODE (شبكة بطاقات بنفس فريم بطاقة الكتاب في الأقسام)             */
        /* ========================================================================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((book) => (
            <BookCard
              key={String(book.id || book.title)}
              book={book}
              viewMode="grid"
              showCategoryBadge={true}
              onRead={onRead}
              onAsk={onAsk}
              onOpenAuthorBio={onOpenAuthorBio}
              onOpenBookInfo={(b) => onOpenBookInfo?.(b)}
              isFavorite={true}
              onToggleFavorite={() => onRemoveFavorite(book.id || book.title)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
