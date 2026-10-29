import React, { useState } from 'react';
import { Layers, LayoutGrid, List, Search, ChevronDown } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { BookMeta } from '../types/bookTypes';
import BookCard from './BookCard';
import { normalizeArabicText } from '../utils/arabicText';

export interface CategoriesViewProps {
  categorySearch: string;
  selectedDomain: string;
  filterAuthor: string;
  booksByCategory: { name: string; books: BookMeta[] }[];
  renderSearchConsole: (isCompact?: boolean, totalMatchingBooks?: number) => React.ReactNode;
  handleReadBook: (book: BookMeta) => void;
  onAskBook: (book: any) => void;
  setSelectedAuthorBook: (book: BookMeta) => void;
  setActiveInfoBook: (book: BookMeta) => void;
  favoriteBookIds: Set<number | string>;
  toggleFavorite: (id: number | string) => void;
  handleSearchChange: (query: string) => void;
}

export function CategoriesView({
  categorySearch,
  selectedDomain,
  filterAuthor,
  booksByCategory,
  renderSearchConsole,
  handleReadBook,
  onAskBook,
  setSelectedAuthorBook,
  setActiveInfoBook,
  favoriteBookIds,
  toggleFavorite,
  handleSearchChange,
}: CategoriesViewProps) {
  const { accentColor, isDark } = useTheme();

  // Local state for categories view (Default: list)
  const [categoriesViewMode, setCategoriesViewMode] = useState<'grid' | 'list'>('list');
  const [visibleResultsCount, setVisibleResultsCount] = useState(32);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [visibleCategoryBooksLimit, setVisibleCategoryBooksLimit] = useState(32);

  // Style helpers
  const getThemeAccentTextClass = () => {
    switch (accentColor) {
      case 'amber': return 'text-[#b88d46] dark:text-[#dfbf83] font-bold';
      case 'emerald': return 'text-teal-600 dark:text-teal-400 font-bold';
      case 'blue': return 'text-blue-600 dark:text-sky-400 font-bold';
      case 'purple':
      default: return 'text-fuchsia-600 dark:text-[#d946ef] font-extrabold';
    }
  };

  const getSectionHeaderIconClass = () => {
    switch (accentColor) {
      case 'amber': return 'text-[#b88d46] dark:text-[#dfbf83] drop-shadow-[0_0_10px_rgba(223,191,131,0.55)]';
      case 'emerald': return 'text-teal-600 dark:text-teal-400 drop-shadow-[0_0_10px_rgba(45,212,191,0.55)]';
      case 'blue': return 'text-blue-600 dark:text-sky-400 drop-shadow-[0_0_10px_rgba(56,189,248,0.55)]';
      case 'purple':
      default: return 'text-fuchsia-600 dark:text-[#d946ef] drop-shadow-[0_0_12px_rgba(217,70,239,0.65)]';
    }
  };

  const getCategoryCardStyle = () => {
    if (isDark) {
      switch (accentColor) {
        case 'amber':
          return 'border border-white/10 bg-[#131620]/95 shadow-md shadow-black/30 backdrop-blur-md hover:bg-[#181b26] hover:border-[#dfbf83]/50';
        case 'emerald':
          return 'border border-white/10 bg-[#131620]/95 shadow-md shadow-black/30 backdrop-blur-md hover:bg-[#181b26] hover:border-teal-400/50';
        case 'blue':
          return 'border border-white/10 bg-[#131620]/95 shadow-md shadow-black/30 backdrop-blur-md hover:bg-[#181b26] hover:border-blue-400/50';
        case 'purple':
        default:
          return 'border border-white/10 bg-[#131620]/95 shadow-md shadow-black/30 backdrop-blur-md hover:bg-[#181b26] hover:border-purple-400/50';
      }
    } else {
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
    }
  };

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

  const getCategoryActiveBadgeStyle = () => {
    switch (accentColor) {
      case 'amber':
        return 'bg-[#b88d46] text-stone-950 font-black';
      case 'emerald':
        return 'bg-teal-600 text-white font-bold';
      case 'blue':
        return 'bg-blue-600 text-white font-bold';
      case 'purple':
      default:
        return 'bg-brand-magenta text-white font-bold';
    }
  };

  const getCategoryActiveIconStyle = () => {
    switch (accentColor) {
      case 'amber':
        return 'bg-gradient-to-br from-[#8e682d] via-[#b88d46] to-[#dfbf83] text-stone-950 font-black shadow-md shadow-[#dfbf83]/30';
      case 'emerald':
        return 'bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-500 text-white shadow-md shadow-teal-500/30';
      case 'blue':
        return 'bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30';
      case 'purple':
      default:
        return 'bg-gradient-to-br from-brand-magenta to-purple-700 text-white shadow-md shadow-brand-magenta/30';
    }
  };

  const getCategoryNumberBadgeStyle = (isOpen: boolean) => {
    if (isOpen) {
      return `${getCategoryActiveBadgeStyle()} shadow-sm`;
    }
    if (isDark) {
      switch (accentColor) {
        case 'amber':
          return 'bg-[#dfbf83]/15 text-[#eed8ad] border border-[#dfbf83]/30 shadow-xs shadow-black/20';
        case 'emerald':
          return 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-xs shadow-black/20';
        case 'blue':
          return 'bg-blue-500/15 text-blue-300 border border-blue-500/30 shadow-xs shadow-black/20';
        case 'purple':
        default:
          return 'bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-xs shadow-black/20';
      }
    } else {
      switch (accentColor) {
        case 'amber':
          return 'bg-[#ebd9b5]/60 text-[#8a652a] border border-[#ebd9b5]';
        case 'emerald':
          return 'bg-teal-500/10 text-teal-700 border border-teal-300/60';
        case 'blue':
          return 'bg-blue-500/10 text-blue-700 border border-blue-300/60';
        case 'purple':
        default:
          return 'bg-purple-500/10 text-purple-700 border border-purple-300/60';
      }
    }
  };

  const getCategoryAccordionContainerStyle = (isOpen: boolean = false) => {
    if (isDark) {
      if (isOpen) {
        switch (accentColor) {
          case 'amber':
            return 'border border-[#dfbf83]/40 bg-[#131620]/95 shadow-lg shadow-black/40 border-r-4 border-r-[#dfbf83]';
          case 'emerald':
            return 'border border-teal-500/40 bg-[#131620]/95 shadow-lg shadow-black/40 border-r-4 border-r-teal-500';
          case 'blue':
            return 'border border-blue-500/40 bg-[#131620]/95 shadow-lg shadow-black/40 border-r-4 border-r-blue-500';
          case 'purple':
          default:
            return 'border border-purple-500/40 bg-[#131620]/95 shadow-lg shadow-black/40 border-r-4 border-r-brand-magenta';
        }
      }
      return 'border border-white/10 bg-[#131620]/95 hover:border-white/20 shadow-md shadow-black/30';
    } else {
      if (isOpen) {
        switch (accentColor) {
          case 'amber':
            return 'border-[#dfbf83] bg-white shadow-md border-r-4 border-r-[#b88d46]';
          case 'emerald':
            return 'border-teal-300 bg-white shadow-md border-r-4 border-r-teal-600';
          case 'blue':
            return 'border-blue-300 bg-white shadow-md border-r-4 border-r-blue-600';
          case 'purple':
          default:
            return 'border-purple-300 bg-white shadow-md border-r-4 border-r-brand-magenta';
        }
      }
      switch (accentColor) {
        case 'amber':
          return 'border-[#ebd9b5] bg-white hover:border-[#dfbf83]';
        case 'emerald':
          return 'border-teal-100 bg-white hover:border-teal-300';
        case 'blue':
          return 'border-blue-100 bg-white hover:border-blue-300';
        case 'purple':
        default:
          return 'border-purple-100 bg-white hover:border-purple-300';
      }
    }
  };

  const getCategoryAccordionHeaderOpenStyle = () => {
    if (isDark) {
      switch (accentColor) {
        case 'amber':
          return 'bg-[#dfbf83]/10 border-b border-white/10';
        case 'emerald':
          return 'bg-teal-500/10 border-b border-white/10';
        case 'blue':
          return 'bg-blue-500/10 border-b border-white/10';
        case 'purple':
        default:
          return 'bg-purple-500/15 border-b border-white/10';
      }
    } else {
      switch (accentColor) {
        case 'amber':
          return 'bg-[#fcf8ee] border-b border-[#ebd9b5]';
        case 'emerald':
          return 'bg-teal-50/70 border-b border-teal-100';
        case 'blue':
          return 'bg-blue-50/70 border-b border-blue-100';
        case 'purple':
        default:
          return 'bg-purple-50/70 border-b border-purple-100';
      }
    }
  };

  const getThemeEmptySearchBtnStyle = () => {
    switch (accentColor) {
      case 'amber':
        return 'bg-[#b88d46] hover:bg-[#8e682d] text-stone-950 font-black';
      case 'emerald':
        return 'bg-teal-600 hover:bg-teal-700 text-white font-bold';
      case 'blue':
        return 'bg-blue-600 hover:bg-blue-700 text-white font-bold';
      case 'purple':
      default:
        return 'bg-brand-magenta hover:bg-brand-deep text-white font-bold';
    }
  };

  const isSearching = Boolean(categorySearch.trim() || selectedDomain !== 'all' || filterAuthor !== 'all');

  // Flat search results list sorted by relevance with fast Arabic Normalization
  const searchResultsList = (() => {
    if (!isSearching) return [];
    const q = categorySearch.trim();
    const normQ = normalizeArabicText(q);

    const allMatching: BookMeta[] = [];
    const seen = new Set<number | string>();
    for (const cat of booksByCategory) {
      for (const book of cat.books) {
        const id = book.id || book.title;
        if (!seen.has(id)) {
          seen.add(id);
          allMatching.push(book);
        }
      }
    }

    if (normQ) {
      allMatching.sort((a, b) => {
        const aTitle = normalizeArabicText(a.title);
        const bTitle = normalizeArabicText(b.title);
        const aAuthor = normalizeArabicText(a.author);
        const bAuthor = normalizeArabicText(b.author);

        const aScore = aTitle === normQ ? 120
          : aTitle.startsWith(normQ) ? 80
            : aTitle.includes(normQ) ? 50
              : aAuthor === normQ ? 40
                : aAuthor.startsWith(normQ) ? 30
                  : aAuthor.includes(normQ) ? 20 : 0;

        const bScore = bTitle === normQ ? 120
          : bTitle.startsWith(normQ) ? 80
            : bTitle.includes(normQ) ? 50
              : bAuthor === normQ ? 40
                : bAuthor.startsWith(normQ) ? 30
                  : bAuthor.includes(normQ) ? 20 : 0;

        if (aScore !== bScore) return bScore - aScore;
        return (a.title || '').localeCompare(b.title || '', 'ar');
      });
    }

    return allMatching;
  })();

  const totalMatchingBooks = searchResultsList.length;
  const deptCount = booksByCategory.length;
  const deptCountText = deptCount === 1
    ? '1 قسم'
    : deptCount === 2
      ? '2 قسم'
      : deptCount >= 3 && deptCount <= 10
        ? `${deptCount} أقسام`
        : `${deptCount} قسماً`;

  const matchingBooksCountText = totalMatchingBooks === 1
    ? 'كتاب واحد مطابق'
    : totalMatchingBooks === 2
      ? 'كتابان متطابقان'
      : totalMatchingBooks >= 3 && totalMatchingBooks <= 10
        ? `${totalMatchingBooks} كتب مطابقة`
        : `${totalMatchingBooks} كتاباً مطابقاً`;

  const displayedResults = searchResultsList.slice(0, visibleResultsCount);

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      {/* In-Page Search Console */}
      {(() => {
        const consoleNode = renderSearchConsole ? renderSearchConsole(false, isSearching ? totalMatchingBooks : undefined) : null;
        if (!consoleNode) return null;
        return (
          <div id="subpage-main-search-bar" className="max-w-4xl mx-auto w-full">
            {consoleNode}
          </div>
        );
      })()}

      {/* Layout Toggle Bar (يظهر في اللابتوب والشاشات الكبيرة فقط، ومخفي تماماً في وضع الهاتف) */}
      <div className={`hidden md:flex rounded-2xl border p-3 sm:px-5 items-center justify-between gap-3 ${getCategoryCardStyle()}`}>
        <div className="flex items-center gap-2">
          <Layers className={`w-5 h-5 shrink-0 transition-colors ${getSectionHeaderIconClass()}`} />
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
            {isSearching ? (
              <>
                نتائج البحث: <span className={getThemeAccentTextClass()}>{deptCountText}</span>
                <span className="text-xs text-muted-foreground font-normal mr-1.5">
                  ({matchingBooksCountText})
                </span>
              </>
            ) : (
              <>جميع الأقسام: ({booksByCategory.length})</>
            )}
          </h3>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-black/40 p-1 rounded-xl border border-slate-200/60 dark:border-white/10">
            <button
              type="button"
              onClick={() => setCategoriesViewMode('grid')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${categoriesViewMode === 'grid'
                ? getCategoryToggleActiveBtnStyle()
                : 'text-muted-foreground hover:text-foreground'
                }`}
              title="عرض كشبكة بطاقات"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>شبكة</span>
            </button>

            <button
              type="button"
              onClick={() => setCategoriesViewMode('list')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${categoriesViewMode === 'list'
                ? getCategoryToggleActiveBtnStyle()
                : 'text-muted-foreground hover:text-foreground'
                }`}
              title="عرض كقائمة متتالية"
            >
              <List className="w-3.5 h-3.5" />
              <span>قائمة</span>
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      {isSearching ? (
        <div className="space-y-4">
          {searchResultsList.length > 0 ? (
            <>
              {categoriesViewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {displayedResults.map(book => (
                    <BookCard
                      key={book.id || book.title}
                      book={book}
                      viewMode="grid"
                      showCategoryBadge={true}
                      onRead={handleReadBook}
                      onAsk={onAskBook}
                      onOpenAuthorBio={(b) => setSelectedAuthorBook(b)}
                      onOpenBookInfo={(b) => setActiveInfoBook(b)}
                      isFavorite={favoriteBookIds.has(book.id) || favoriteBookIds.has(book.title)}
                      onToggleFavorite={() => toggleFavorite(book.id || book.title)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {displayedResults.map(book => (
                    <BookCard
                      key={book.id || book.title}
                      book={book}
                      viewMode="list"
                      showCategoryBadge={true}
                      onRead={handleReadBook}
                      onAsk={onAskBook}
                      onOpenAuthorBio={(b) => setSelectedAuthorBook(b)}
                      onOpenBookInfo={(b) => setActiveInfoBook(b)}
                      isFavorite={favoriteBookIds.has(book.id) || favoriteBookIds.has(book.title)}
                      onToggleFavorite={() => toggleFavorite(book.id || book.title)}
                    />
                  ))}
                </div>
              )}

              {searchResultsList.length > visibleResultsCount && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setVisibleResultsCount(prev => prev + 32)}
                    className={`px-6 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-sm cursor-pointer hover:scale-[1.02] active:scale-95 ${getCategoryToggleActiveBtnStyle()}`}
                  >
                    عرض المزيد من نتائج البحث ({searchResultsList.length - visibleResultsCount} كتاب متبقي)
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className={`p-12 text-center text-muted-foreground rounded-2xl border border-dashed ${getCategoryCardStyle()}`}>
              <Search className={`w-10 h-10 mx-auto opacity-60 mb-3 ${getThemeAccentTextClass()}`} />
              <p className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                لم يتم العثور على كتب تطابق بحثك "{categorySearch}"
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                جرب البحث بعنوان كتاب (مثل: عمدة الفقه) أو اسم مؤلف (مثل: ابن قدامة).
              </p>
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${getThemeEmptySearchBtnStyle()}`}
              >
                إلغاء البحث وإظهار جميع الأقسام
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {booksByCategory.map((cat, idx) => {
            const isOpen = openCategory === cat.name;

            return (
              <div
                key={cat.name}
                className={`rounded-xl border overflow-hidden shadow-sm transition-colors duration-200 ${getCategoryAccordionContainerStyle(isOpen)}`}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (openCategory === cat.name) {
                      setOpenCategory(null);
                    } else {
                      setOpenCategory(cat.name);
                      setVisibleCategoryBooksLimit(32);
                    }
                  }}
                  className={`w-full py-2.5 sm:py-3 px-3.5 sm:px-4 flex items-center justify-between gap-3 text-right transition-colors cursor-pointer group ${isOpen
                    ? getCategoryAccordionHeaderOpenStyle()
                    : 'hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 transition-all ${getCategoryNumberBadgeStyle(isOpen)}`}>
                      {idx + 1}
                    </span>

                    <div className="min-w-0">
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 leading-snug">
                        {cat.name}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold transition-colors ${isOpen
                      ? getCategoryActiveBadgeStyle()
                      : 'bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/5 group-hover:border-white/10'
                      }`}>
                      {cat.books.length >= 3 && cat.books.length <= 10 ? `${cat.books.length} كتب` : `${cat.books.length} كتاباً`}
                    </span>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform duration-300 ${isOpen ? `${getCategoryActiveIconStyle()} rotate-180` : 'bg-slate-100 dark:bg-white/5 text-muted-foreground group-hover:text-foreground'
                      }`}>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="p-3 sm:p-4 bg-slate-50/50 dark:bg-black/30 animate-in fade-in duration-200 border-t border-slate-100 dark:border-white/5">
                    {categoriesViewMode === 'grid' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                        {cat.books.slice(0, visibleCategoryBooksLimit).map((book, bIdx) => (
                          <BookCard
                            key={book.id ? `cat-${cat.name}-${book.id}` : `cat-${cat.name}-${bIdx}-${book.title}`}
                            book={book}
                            viewMode="grid"
                            showCategoryBadge={false}
                            onRead={handleReadBook}
                            onAsk={onAskBook}
                            onOpenAuthorBio={(b) => setSelectedAuthorBook(b)}
                            onOpenBookInfo={(b) => setActiveInfoBook(b)}
                            isFavorite={favoriteBookIds.has(book.id) || favoriteBookIds.has(book.title)}
                            onToggleFavorite={() => toggleFavorite(book.id || book.title)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {cat.books.slice(0, visibleCategoryBooksLimit).map((book, bIdx) => (
                          <BookCard
                            key={book.id ? `cat-${cat.name}-${book.id}` : `cat-${cat.name}-${bIdx}-${book.title}`}
                            book={book}
                            viewMode="list"
                            showCategoryBadge={false}
                            onRead={handleReadBook}
                            onAsk={onAskBook}
                            onOpenAuthorBio={(b) => setSelectedAuthorBook(b)}
                            onOpenBookInfo={(b) => setActiveInfoBook(b)}
                            isFavorite={favoriteBookIds.has(book.id) || favoriteBookIds.has(book.title)}
                            onToggleFavorite={() => toggleFavorite(book.id || book.title)}
                          />
                        ))}
                      </div>
                    )}

                    {cat.books.length > visibleCategoryBooksLimit && (
                      <div className="pt-3 pb-1 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setVisibleCategoryBooksLimit(prev => prev + 48);
                          }}
                          className={`px-6 py-2 rounded-xl border text-xs font-bold transition-all shadow-sm cursor-pointer hover:scale-[1.02] active:scale-95 ${getCategoryToggleActiveBtnStyle()}`}
                        >
                          عرض المزيد من كتب قسم {cat.name} ({cat.books.length - visibleCategoryBooksLimit} كتاب متبقي)
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CategoriesView;
