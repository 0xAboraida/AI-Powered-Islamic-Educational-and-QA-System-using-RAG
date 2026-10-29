import React from 'react';
import {
  Sparkles,
  Calendar,
  ArrowUpDown,
  LayoutGrid,
  List,
  Layers,
  Library,
  X,
  BookMarked
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { BookMeta } from '../types/bookTypes';
import { BookCard } from './BookCard';
import { SkeletonList } from './BookSkeletons';

export interface BrowseBooksViewProps {
  filteredAndSortedBooks: BookMeta[];
  availableCenturies: { century: number; name: string; count: number }[];
  availableDomains: { name: string; count: number }[];
  publishedBooksCount: number;
  selectedCentury: string;
  setSelectedCentury: (val: string) => void;
  sortAsc: boolean;
  setSortAsc: (val: boolean | ((prev: boolean) => boolean)) => void;
  selectedDomain: string;
  setSelectedDomain: (val: string) => void;
  query: string;
  setQuery: (val: string) => void;
  loading: boolean;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  visibleBrowseBooksLimit: number;
  setVisibleBrowseBooksLimit: React.Dispatch<React.SetStateAction<number>>;
  handleReadBook: (book: BookMeta) => void;
  onAskBook: (book: any) => void;
  setSelectedAuthorBook: (book: BookMeta) => void;
  setActiveInfoBook: (book: BookMeta) => void;
  favoriteBookIds: Set<number | string>;
  toggleFavorite: (id: number | string) => void;
}

export const BrowseBooksView: React.FC<BrowseBooksViewProps> = ({
  filteredAndSortedBooks,
  availableCenturies,
  availableDomains,
  publishedBooksCount,
  selectedCentury,
  setSelectedCentury,
  sortAsc,
  setSortAsc,
  selectedDomain,
  setSelectedDomain,
  query,
  setQuery,
  loading,
  viewMode,
  setViewMode,
  visibleBrowseBooksLimit,
  setVisibleBrowseBooksLimit,
  handleReadBook,
  onAskBook,
  setSelectedAuthorBook,
  setActiveInfoBook,
  favoriteBookIds,
  toggleFavorite,
}) => {
  const { isDark, accentColor } = useTheme();

  const getCategoryToggleActiveBtnStyle = () => {
    if (isDark) {
      switch (accentColor) {
        case 'amber':
          return 'bg-[#b88d46] text-stone-950 font-black shadow-sm';
        case 'emerald':
          return 'bg-teal-600 text-white shadow-sm';
        case 'blue':
          return 'bg-blue-600 text-white shadow-sm';
        case 'purple':
        default:
          return 'bg-brand-magenta text-white shadow-sm';
      }
    } else {
      switch (accentColor) {
        case 'amber':
          return 'bg-white text-[#8e682d] font-black shadow-sm border border-[#ebd9b5]';
        case 'emerald':
          return 'bg-white text-teal-700 font-bold shadow-sm border border-teal-200';
        case 'blue':
          return 'bg-white text-blue-700 font-bold shadow-sm border border-blue-200';
        case 'purple':
        default:
          return 'bg-white text-brand-magenta font-bold shadow-sm border border-purple-200';
      }
    }
  };

  return (
    <div className="animate-in fade-in duration-300 space-y-6">

      {/* Sticky Search & Filter Hub */}
      <div className="sticky top-3 z-30 space-y-3">
        <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-[#121624]/95 p-3 shadow-md backdrop-blur-xl flex flex-col md:flex-row items-center gap-3">

          {/* Header Title */}
          <div className="flex items-center gap-2.5 px-3 flex-1 min-w-0">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
              الكتب المختارة والمعتمدة ({filteredAndSortedBooks.length})
            </h3>
          </div>

          <div className="hidden md:block w-px h-8 bg-slate-200 dark:bg-white/10" />

          {/* Century Dropdown */}
          <div className="w-full md:w-auto min-w-[190px] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-magenta shrink-0 hidden sm:block" />
            <select
              value={selectedCentury}
              onChange={(e) => setSelectedCentury(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-black/30 border border-slate-200/60 dark:border-white/10 text-xs sm:text-sm font-semibold outline-none focus:border-brand-magenta cursor-pointer text-slate-800 dark:text-slate-100"
            >
              <option value="all">جميع القرون الهجرية</option>
              {availableCenturies.map(c => (
                <option key={c.century} value={c.century.toString()}>
                  {c.name} ({c.count} كتاب)
                </option>
              ))}
            </select>
          </div>

          {/* Sort Toggle */}
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="w-full md:w-auto px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-100 dark:bg-black/30 hover:bg-slate-200 dark:hover:bg-white/10 text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shrink-0 text-slate-700 dark:text-slate-200"
            title={sortAsc ? "الترتيب الحالي: من المتقدمين إلى المتأخرين (تصاعدي)" : "الترتيب الحالي: من المتأخرين إلى المتقدمين (تنازلي)"}
          >
            <ArrowUpDown className="w-4 h-4 text-brand-magenta" />
            <span>{sortAsc ? 'الأقدم وفاة ⁳' : 'الأحدث وفاة ⌛'}</span>
          </button>

          {/* Grid / List Mode */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-black/40 p-1 rounded-xl border border-slate-200/60 dark:border-white/10 shrink-0 self-end md:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid'
                ? 'bg-white dark:bg-brand-magenta text-brand-magenta dark:text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
                }`}
              title="عرض شبكي"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list'
                ? 'bg-white dark:bg-brand-magenta text-brand-magenta dark:text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
                }`}
              title="عرض قائمي"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Dynamic Domain Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
          <button
            onClick={() => setSelectedDomain('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 ${selectedDomain === 'all'
              ? 'bg-brand-magenta text-white shadow-md shadow-brand-magenta/25'
              : 'bg-white/80 dark:bg-[#121624]/80 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 border border-slate-200/70 dark:border-white/10'
              }`}
          >
            <Layers className="w-3.5 h-3.5" />
            جميع المجالات ({publishedBooksCount})
          </button>

          {availableDomains.map(d => (
            <button
              key={d.name}
              onClick={() => setSelectedDomain(d.name)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 ${selectedDomain === d.name
                ? 'bg-brand-magenta text-white shadow-md shadow-brand-magenta/25'
                : 'bg-white/80 dark:bg-[#121624]/80 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 border border-slate-200/70 dark:border-white/10'
                }`}
            >
              <span>{d.name}</span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded-md ${selectedDomain === d.name ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-white/10 text-muted-foreground'}`}>
                {d.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">
          <Library className="w-5 h-5 text-brand-magenta" />
          <span>الكتب المختارة والمعتمدة</span>
          <span className="text-xs font-normal text-muted-foreground">
            (معروض <span className="font-bold text-brand-magenta">{filteredAndSortedBooks.length}</span> كتاب)
          </span>
        </div>

        {(query || selectedDomain !== 'all' || selectedCentury !== 'all') && (
          <button
            onClick={() => {
              setQuery('');
              setSelectedDomain('all');
              setSelectedCentury('all');
            }}
            className="text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>إعادة ضبط الفلاتر</span>
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Books Grid / List */}
      <section>
        {loading ? (
          <SkeletonList viewMode={viewMode} />
        ) : filteredAndSortedBooks.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 dark:border-white/10 bg-white/50 dark:bg-card/40 py-20 text-center backdrop-blur-md">
            <BookMarked className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">لا توجد كتب تطابق معايير الفلترة المحددة</p>
            <p className="text-xs text-muted-foreground">جرب اختيار مجال آخر أو تغيير القرن الهجري.</p>
            <button
              onClick={() => {
                setQuery('');
                setSelectedDomain('all');
                setSelectedCentury('all');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-brand-magenta text-white font-bold text-xs hover:bg-brand-deep transition-all shadow-md cursor-pointer"
            >
              عرض جميع الكتب
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAndSortedBooks.slice(0, visibleBrowseBooksLimit).map((book, idx) => (
                <BookCard
                  key={book.id ? `browse-${book.id}` : `browse-${idx}-${book.title}`}
                  book={book}
                  viewMode="grid"
                  onRead={handleReadBook}
                  onAsk={onAskBook}
                  onOpenAuthorBio={(b) => setSelectedAuthorBook(b)}
                  onOpenBookInfo={(b) => setActiveInfoBook(b)}
                  isFavorite={favoriteBookIds.has(book.id) || favoriteBookIds.has(book.title)}
                  onToggleFavorite={() => toggleFavorite(book.id || book.title)}
                />
              ))}
            </div>
            {filteredAndSortedBooks.length > visibleBrowseBooksLimit && (
              <div className="pt-2 pb-4 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleBrowseBooksLimit(prev => prev + 36)}
                  className={`px-8 py-3 rounded-xl border text-xs font-bold transition-all shadow-sm cursor-pointer hover:scale-[1.02] active:scale-95 ${getCategoryToggleActiveBtnStyle()}`}
                >
                  عرض المزيد من الكتب ({filteredAndSortedBooks.length - visibleBrowseBooksLimit} كتاب متبقي)
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col gap-3">
              {filteredAndSortedBooks.slice(0, visibleBrowseBooksLimit).map((book, idx) => (
                <BookCard
                  key={book.id ? `browse-${book.id}` : `browse-${idx}-${book.title}`}
                  book={book}
                  viewMode="list"
                  onRead={handleReadBook}
                  onAsk={onAskBook}
                  onOpenAuthorBio={(b) => setSelectedAuthorBook(b)}
                  onOpenBookInfo={(b) => setActiveInfoBook(b)}
                  isFavorite={favoriteBookIds.has(book.id) || favoriteBookIds.has(book.title)}
                  onToggleFavorite={() => toggleFavorite(book.id || book.title)}
                />
              ))}
            </div>
            {filteredAndSortedBooks.length > visibleBrowseBooksLimit && (
              <div className="pt-2 pb-4 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleBrowseBooksLimit(prev => prev + 36)}
                  className={`px-8 py-3 rounded-xl border text-xs font-bold transition-all shadow-sm cursor-pointer hover:scale-[1.02] active:scale-95 ${getCategoryToggleActiveBtnStyle()}`}
                >
                  عرض المزيد من الكتب ({filteredAndSortedBooks.length - visibleBrowseBooksLimit} كتاب متبقي)
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
