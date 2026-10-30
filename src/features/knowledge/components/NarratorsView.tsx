import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  User,
  Calendar,
  ShieldCheck,
  ChevronLeft,
  ChevronDown,
  Check,
  ArrowLeft,
  X,
  Loader2,
  RefreshCw,
  List,
  LayoutGrid
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  fetchTurathNarrators,
  fetchTurathNarratorDetails,
  TurathNarratorItem,
  TurathNarratorDetail
} from '../../../api/turathApi';
import NarratorDetailView from './NarratorDetailView';

// Module-level cache so switching tabs does NOT reload narrators every time
let cachedNarrators: TurathNarratorItem[] = [];
let cachedTotalCount: number = 18989;
let cachedActiveNarrator: TurathNarratorItem | null = null;
let cachedActiveDetail: TurathNarratorDetail | null = null;

// Helper to truncate long biographical death quotes (e.g. historical narrations) to first few words
const formatDeathText = (text: string, maxWords: number = 7): string => {
  if (!text) return '';
  const clean = text.trim().replace(/\s+/g, ' ');
  const words = clean.split(' ');
  if (words.length <= maxWords) return clean;
  return words.slice(0, maxWords).join(' ') + '...';
};

interface NarratorsViewProps {
  onReadBook?: (book: any, page?: number) => void;
  publishedBooks?: any[];
  onOpenBookInfo?: (book: any) => void;
  onSelectNarrator?: (narrator: TurathNarratorItem | null) => void;
}

export default function NarratorsView({ onReadBook, publishedBooks, onOpenBookInfo, onSelectNarrator }: NarratorsViewProps = {}) {
  const { accentColor, isDark } = useTheme();

  // Layout mode: default to 'list' as requested
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [narrators, setNarrators] = useState<TurathNarratorItem[]>(cachedNarrators);
  const [totalCount, setTotalCount] = useState(cachedTotalCount);
  const [loading, setLoading] = useState(cachedNarrators.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected narrator for dedicated full-page view (restores automatically when returning from book reader)
  const [selectedNarrator, setSelectedNarrator] = useState<TurathNarratorItem | null>(() => cachedActiveNarrator);
  const [narratorDetail, setNarratorDetail] = useState<TurathNarratorDetail | null>(() => cachedActiveDetail);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (cachedActiveNarrator) {
      onSelectNarrator?.(cachedActiveNarrator);
    }
  }, [onSelectNarrator]);

  // Quick Rank Filter
  const [rankFilter, setRankFilter] = useState<'all' | 'sahaba' | 'thiqah' | 'saduq' | 'daif'>('all');

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 280);
    return () => clearTimeout(handler);
  }, [query]);

  // Fetch narrators on query or page change
  const loadNarrators = useCallback(async (targetPage: number, targetQuery: string, append: boolean = false) => {
    // If not searching and we already have cached narrators on page 1, skip initial spinner
    if (!append && targetPage === 1 && !targetQuery && cachedNarrators.length > 0) {
      setNarrators(cachedNarrators);
      setTotalCount(cachedTotalCount);
      setLoading(false);
      return;
    }

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetchTurathNarrators(targetPage, 50, targetQuery);
      if (res && Array.isArray(res.data)) {
        setTotalCount(res.count);
        if (append) {
          setNarrators(prev => [...prev, ...res.data]);
        } else {
          setNarrators(res.data);
          if (!targetQuery && targetPage === 1) {
            cachedNarrators = res.data;
            cachedTotalCount = res.count;
          }
        }
      } else {
        if (!append) setNarrators([]);
      }
    } catch (err: any) {
      console.error('Failed to load narrators:', err);
      setError('تعذر تحميل بيانات الرواة. يرجى التحقق من الاتصال بالإنترنت والمحاولة مجدداً.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadNarrators(page, debouncedQuery, page > 1);
  }, [page, debouncedQuery, loadNarrators]);

  // Load single narrator detail and transition to full-page view
  const handleOpenNarrator = async (narratorItem: TurathNarratorItem) => {
    cachedActiveNarrator = narratorItem;
    setSelectedNarrator(narratorItem);
    onSelectNarrator?.(narratorItem);

    if (cachedActiveDetail && cachedActiveDetail.id === narratorItem.id) {
      setNarratorDetail(cachedActiveDetail);
      setDetailLoading(false);
      return;
    }

    setDetailLoading(true);
    setNarratorDetail(null);

    try {
      const detail = await fetchTurathNarratorDetails(narratorItem.id);
      cachedActiveDetail = detail;
      setNarratorDetail(detail);
    } catch (err) {
      console.error('Failed to fetch narrator detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Filter by rank locally
  const filteredNarrators = narrators.filter(n => {
    if (rankFilter === 'all') return true;
    const r = (n.rank || '').toLowerCase();
    if (rankFilter === 'sahaba') return r.includes('صحابي');
    if (rankFilter === 'thiqah') return r.includes('ثقة') || r.includes('إمام') || r.includes('حافظ') || r.includes('حجة');
    if (rankFilter === 'saduq') return r.includes('صدوق') || r.includes('مقبول') || r.includes('لا بأس');
    if (rankFilter === 'daif') return r.includes('متروك') || r.includes('ضعيف') || r.includes('كذاب') || r.includes('وضاع');
    return true;
  });

  const getRankBadgeStyle = (rank: string) => {
    const r = (rank || '').toLowerCase();
    if (r.includes('صحابي')) {
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20';
    }
    if (r.includes('ثقة') || r.includes('إمام') || r.includes('حافظ') || r.includes('حجة')) {
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';
    }
    if (r.includes('صدوق') || r.includes('مقبول') || r.includes('لا بأس')) {
      return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20';
    }
    if (r.includes('متروك') || r.includes('ضعيف') || r.includes('كذاب') || r.includes('وضاع')) {
      return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20';
    }
    return 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20';
  };

  const getThemeActivePill = () => {
    switch (accentColor) {
      case 'amber':
        return 'bg-[#b88d46] text-stone-950 font-black shadow-sm';
      case 'emerald':
        return 'bg-teal-600 text-white font-bold shadow-sm';
      case 'blue':
        return 'bg-blue-600 text-white font-bold shadow-sm';
      case 'purple':
      default:
        return 'bg-brand-magenta text-white font-bold shadow-sm';
    }
  };

  const getThemeInputFocus = () => {
    switch (accentColor) {
      case 'amber':
        return 'focus:border-[#b88d46] focus:ring-2 focus:ring-[#b88d46]/20';
      case 'emerald':
        return 'focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20';
      case 'blue':
        return 'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';
      case 'purple':
      default:
        return 'focus:border-brand-magenta focus:ring-2 focus:ring-brand-magenta/20';
    }
  };

  // Rank picker dropdown state
  const [isRankPickerOpen, setIsRankPickerOpen] = useState(false);
  const rankPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (rankPickerRef.current && !rankPickerRef.current.contains(e.target as Node)) {
        setIsRankPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const rankOptions: { id: 'all' | 'sahaba' | 'thiqah' | 'saduq' | 'daif'; label: string }[] = [
    { id: 'all', label: 'الكل' },
    { id: 'sahaba', label: 'الصحابة' },
    { id: 'thiqah', label: 'الثقات والأئمة' },
    { id: 'saduq', label: 'الصدوق والمقبول' },
    { id: 'daif', label: 'المتروك والضعيف' },
  ];

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
          return 'bg-[#b88d46]/40 border-[#dfbf83] text-[#eed9b0] font-bold shadow-sm shadow-amber-950/40';
        case 'emerald':
          return 'bg-teal-500/40 border-teal-400 text-teal-200 font-bold shadow-sm shadow-teal-950/40';
        case 'blue':
          return 'bg-blue-500/40 border-blue-400 text-blue-200 font-bold shadow-sm shadow-blue-950/40';
        case 'purple':
        default:
          return 'bg-purple-500/40 border-purple-400 text-purple-200 font-bold shadow-sm shadow-purple-950/40';
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

  const getPopoverStyle = () => {
    if (isDark) {
      return 'bg-[#131620] border-white/10 text-white shadow-2xl';
    }
    return 'bg-white border-slate-200 text-slate-900 shadow-xl';
  };

  const getCardStyle = () => {
    if (isDark) {
      switch (accentColor) {
        case 'emerald':
          return 'border border-white/10 bg-[#131620]/95 shadow-md shadow-black/30 backdrop-blur-md hover:bg-[#181b26] hover:border-teal-400/40';
        case 'amber':
          return 'border border-white/10 bg-[#131620]/95 shadow-md shadow-black/30 backdrop-blur-md hover:bg-[#181b26] hover:border-[#dfbf83]/40';
        case 'blue':
          return 'border border-white/10 bg-[#131620]/95 shadow-md shadow-black/30 backdrop-blur-md hover:bg-[#181b26] hover:border-blue-400/40';
        case 'purple':
        default:
          return 'border border-white/10 bg-[#131620]/95 shadow-md shadow-black/30 backdrop-blur-md hover:bg-[#181b26] hover:border-purple-400/40';
      }
    }
    switch (accentColor) {
      case 'emerald':
        return 'border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md hover:border-teal-400';
      case 'amber':
        return 'border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md hover:border-[#dfbf83]';
      case 'blue':
        return 'border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md hover:border-blue-400';
      case 'purple':
      default:
        return 'border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md hover:border-purple-400';
    }
  };

  const getThemeAccentText = () => {
    switch (accentColor) {
      case 'emerald': return 'text-teal-600 dark:text-teal-400';
      case 'amber': return 'text-[#b88d46] dark:text-[#dfbf83]';
      case 'blue': return 'text-blue-600 dark:text-blue-400';
      case 'purple':
      default: return 'text-brand-magenta dark:text-purple-400';
    }
  };

  const getThemeHoverText = () => {
    switch (accentColor) {
      case 'emerald': return 'group-hover:text-teal-600 dark:group-hover:text-teal-400';
      case 'amber': return 'group-hover:text-[#b88d46] dark:group-hover:text-[#dfbf83]';
      case 'blue': return 'group-hover:text-blue-600 dark:group-hover:text-blue-400';
      case 'purple':
      default: return 'group-hover:text-brand-magenta dark:group-hover:text-purple-400';
    }
  };

  const getThemeHoverBorder = () => {
    switch (accentColor) {
      case 'emerald': return 'hover:border-teal-500/50 dark:hover:border-teal-400/50';
      case 'amber': return 'hover:border-[#dfbf83]/50 dark:hover:border-[#dfbf83]/50';
      case 'blue': return 'hover:border-blue-500/50 dark:hover:border-blue-400/50';
      case 'purple':
      default: return 'hover:border-purple-500/50 dark:hover:border-purple-400/50';
    }
  };

  const getThemeIconColor = () => {
    switch (accentColor) {
      case 'emerald': return 'text-teal-500 dark:text-teal-400';
      case 'amber': return 'text-[#b88d46] dark:text-[#dfbf83]';
      case 'blue': return 'text-blue-500 dark:text-blue-400';
      case 'purple':
      default: return 'text-brand-magenta dark:text-purple-400';
    }
  };

  const getThemeSpinnerColor = () => {
    switch (accentColor) {
      case 'emerald': return 'text-teal-500';
      case 'amber': return 'text-amber-500';
      case 'blue': return 'text-blue-500';
      case 'purple':
      default: return 'text-brand-magenta';
    }
  };

  const getThemeDropdownActiveItem = () => {
    switch (accentColor) {
      case 'emerald': return 'bg-teal-500/15 text-teal-900 dark:text-teal-200 font-black';
      case 'amber': return 'bg-amber-500/15 text-amber-900 dark:text-amber-200 font-black';
      case 'blue': return 'bg-blue-500/15 text-blue-900 dark:text-blue-200 font-black';
      case 'purple':
      default: return 'bg-purple-500/15 text-purple-900 dark:text-purple-200 font-black';
    }
  };

  const getThemeEmptyIconBox = () => {
    switch (accentColor) {
      case 'emerald': return 'bg-teal-500/10 text-teal-600 dark:text-teal-400';
      case 'amber': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
      case 'blue': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'purple':
      default: return 'bg-purple-500/10 text-brand-magenta dark:text-purple-400';
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

  if (selectedNarrator) {
    return (
      <NarratorDetailView
        narrator={narratorDetail}
        narratorBasicInfo={selectedNarrator}
        loading={detailLoading}
        onBack={() => {
          cachedActiveNarrator = null;
          cachedActiveDetail = null;
          setSelectedNarrator(null);
          setNarratorDetail(null);
          onSelectNarrator?.(null);
        }}
        onOpenBook={onReadBook}
        publishedBooks={publishedBooks}
        onOpenBookInfo={onOpenBookInfo}
      />
    );
  }

  const selectedRankLabel = rankFilter === 'all' ? 'رتبة الراوي' : (rankOptions.find(o => o.id === rankFilter)?.label || 'رتبة الراوي');

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir="rtl">
      {/* 1. In-Page Floating Search Console (مطابق تماماً لقسم الأقسام والمؤلفين) */}
      <div id="narrators-search-bar" className={`max-w-4xl mx-auto w-full relative transition-all ${isRankPickerOpen ? 'z-50' : 'z-30'}`}>
        <div className={`relative rounded-2xl md:rounded-full transition-all duration-300 w-full ${getHeroSearchContainerStyle()}`}>
          <div className="flex items-center gap-2 sm:gap-3 px-3.5 sm:px-4 py-2 sm:py-2.5">
            {/* Circle Search Button */}
            <div
              className={`rounded-xl md:rounded-full flex items-center justify-center shadow-md shrink-0 ${getSearchBtnStyle()} w-9 h-9 sm:w-10 sm:h-10`}
            >
              <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>

            {/* Input */}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن راوٍ، علم، أو ترجمة..."
              className={`min-w-0 flex-1 bg-transparent outline-none ${Boolean(query) ? 'font-bold' : 'font-normal'} ${isDark
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

            {/* Rank Filter Dropdown (تصفية الرتبة كـ dropdown داخل السيرش بار) */}
            <div className="relative" ref={rankPickerRef}>
              <button
                type="button"
                onClick={() => setIsRankPickerOpen(!isRankPickerOpen)}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 h-[30px] sm:h-[34px] rounded-full text-xs font-bold transition-all duration-200 border cursor-pointer shrink-0 active:scale-95 ${rankFilter !== 'all'
                    ? getFilterPillActiveStyle()
                    : isDark
                      ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-md'
                      : 'bg-white/40 hover:bg-white/60 border-white/60 hover:border-white text-stone-900 font-bold backdrop-blur-md shadow-2xs'
                  }`}
                title="تصفية حسب رتبة الراوي"
              >
                <span className="truncate max-w-[85px] sm:max-w-[130px]">{selectedRankLabel}</span>
                {rankFilter !== 'all' ? (
                  <span
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRankFilter('all');
                    }}
                    className="w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all ml-0.5 cursor-pointer shrink-0 bg-black/10 hover:bg-black/20 dark:bg-white/20 dark:hover:bg-white/30"
                    title="إلغاء التصفية"
                  >
                    <X className="w-2.5 h-2.5" />
                  </span>
                ) : (
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isRankPickerOpen ? 'rotate-180' : ''}`} />
                )}
              </button>

              {/* Dropdown Menu */}
              {isRankPickerOpen && (
                <div className={`absolute left-0 mt-2 w-52 sm:w-56 rounded-2xl p-1.5 border shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 ${getPopoverStyle()}`}>
                  <div className="text-[11px] font-bold text-muted-foreground px-3 py-1.5 mb-1 border-b border-slate-100 dark:border-white/5">
                    تصفية حسب رتبة الراوي
                  </div>
                  <div className="space-y-0.5">
                    {rankOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setRankFilter(opt.id);
                          setIsRankPickerOpen(false);
                        }}
                        className={`w-full text-right px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-between cursor-pointer ${rankFilter === opt.id
                            ? getThemeDropdownActiveItem()
                            : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                          }`}
                      >
                        <span>{opt.label}</span>
                        {rankFilter === opt.id && <Check className={`w-3.5 h-3.5 ${getThemeIconColor()}`} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Layout Toggle Bar (يظهر في الشاشات الكبيرة فقط ومخفي في الهاتف) */}
      <div className={`hidden md:flex rounded-2xl border p-2.5 sm:p-3 sm:px-5 items-center justify-between gap-2 sm:gap-3 ${getCardStyle()}`}>
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
          <ShieldCheck className={`w-4.5 h-4.5 sm:w-5 sm:h-5 shrink-0 ${getThemeIconColor()}`} />
          <h3 className="font-extrabold text-xs sm:text-base text-slate-900 dark:text-slate-100 truncate">
            قائمة الرواة ({filteredNarrators.length})
          </h3>
        </div>

        {/* View Toggle (قائمة vs شبكة) */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground font-semibold hidden sm:inline">طريقة العرض:</span>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-black/40 p-1 rounded-xl border border-slate-200/60 dark:border-white/10">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === 'list'
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
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === 'grid'
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

      {/* Results Content */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3.5 text-center">
          <Loader2 className={`w-8 h-8 animate-spin ${getThemeSpinnerColor()}`} />
          <p className="text-sm font-bold text-muted-foreground">
            جارٍ البحث في قاعدة بيانات الرواة (18,989 راوٍ)...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-3xl p-8 border border-rose-200 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-950/20 text-center space-y-3">
          <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{error}</p>
          <button
            type="button"
            onClick={() => loadNarrators(page, debouncedQuery)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>إعادة المحاولة</span>
          </button>
        </div>
      ) : filteredNarrators.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 dark:border-white/10 bg-white/40 dark:bg-white/[0.02] p-12 text-center space-y-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${getThemeEmptyIconBox()}`}>
            <Search className="w-7 h-7" />
          </div>
          <h4 className="text-base font-black text-slate-900 dark:text-white">
            لا توجد نتائج مطابقة لبحثك في الرواة
          </h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            جرّب البحث باسم آخر أو تأكد من صحة الحروف
          </p>
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setRankFilter('all'); }}
              className={`text-xs font-bold ${getThemeAccentText()} hover:underline cursor-pointer`}
            >
              عرض كل الرواة
            </button>
          )}
        </div>
      ) : viewMode === 'list' ? (
        /* ========================================================================= */
        /* LIST VIEW MODE (قائمة أفقية متتالية ومختصرة لعرض أكبر عدد من الرواة)       */
        /* ========================================================================= */
        <div className="space-y-1.5">
          {filteredNarrators.map((narrator) => {
            const hasDeathDate = Boolean(narrator.death_text || narrator.death);
            const deathDisplay = narrator.death_text || (narrator.death ? `ت ${narrator.death} هـ` : '');

            return (
              <div
                key={narrator.id}
                onClick={() => handleOpenNarrator(narrator)}
                className={`group rounded-xl py-2.5 px-3.5 sm:px-4.5 bg-white/95 dark:bg-[#131620]/95 border border-slate-200/80 dark:border-white/10 ${getThemeHoverBorder()} shadow-2xs hover:shadow-sm transition-all duration-150 cursor-pointer flex items-center justify-between gap-3`}
              >
                {/* 1. Narrator Info (Stacked: Name -> Full Name -> Date & Summary) */}
                <div className="min-w-0 flex-1">
                  {/* Row 1: Name only on its own line */}
                  <h3 className={`font-bold text-sm sm:text-base text-slate-900 dark:text-white ${getThemeHoverText()} transition-colors leading-snug`}>
                    {narrator.name}
                  </h3>

                  {/* Row 2: Detailed full name if available and different */}
                  {narrator.full_name && narrator.full_name !== narrator.name && (
                    <p className="text-[11px] sm:text-xs text-muted-foreground/80 line-clamp-1 opacity-80 mt-0.5 leading-normal">
                      {narrator.full_name}
                    </p>
                  )}

                  {/* Row 3: Death date with words limit, then Summary / Rank */}
                  {(hasDeathDate || narrator.rank) && (
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      {hasDeathDate && (
                        <span
                          title={deathDisplay}
                          className="text-[10px] sm:text-[11px] font-mono text-muted-foreground flex items-center gap-1 shrink-0"
                        >
                          <Calendar className={`w-3 h-3 shrink-0 ${getThemeIconColor()}`} />
                          <span>{formatDeathText(deathDisplay, 7)}</span>
                        </span>
                      )}

                      {narrator.rank && (
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shadow-2xs ${getRankBadgeStyle(narrator.rank)}`}>
                          {narrator.rank}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Arrow Action Button */}
                <div className={`flex items-center text-muted-foreground ${getThemeHoverText()} transition-colors shrink-0`}>
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ========================================================================= */
        /* GRID VIEW MODE (شبكة بطاقات مدمجة 3 في الصف)                              */
        /* ========================================================================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredNarrators.map((narrator) => {
            const hasDeathDate = Boolean(narrator.death_text || narrator.death);
            const deathDisplay = narrator.death_text || (narrator.death ? `ت ${narrator.death} هـ` : '');

            return (
              <div
                key={narrator.id}
                onClick={() => handleOpenNarrator(narrator)}
                className={`group rounded-xl p-3.5 bg-white/95 dark:bg-[#131620]/95 border border-slate-200/80 dark:border-white/10 ${getThemeHoverBorder()} shadow-2xs hover:shadow-sm transition-all duration-150 cursor-pointer flex flex-col justify-between`}
              >
                <div>
                  {/* Row 1: Name and Arrow */}
                  <div className="flex items-start justify-between gap-1.5 mb-1">
                    <h3 className={`font-bold text-sm text-slate-900 dark:text-white ${getThemeHoverText()} transition-colors line-clamp-1 flex-1 leading-snug`}>
                      {narrator.name}
                    </h3>
                    <ArrowLeft className={`w-3.5 h-3.5 text-muted-foreground ${getThemeHoverText()} group-hover:-translate-x-0.5 transition-transform shrink-0 mt-0.5`} />
                  </div>

                  {/* Row 2: Detailed full name if available and different */}
                  {narrator.full_name && narrator.full_name !== narrator.name && (
                    <p className="text-[11px] text-muted-foreground line-clamp-1 leading-normal opacity-80 mb-1.5">
                      {narrator.full_name}
                    </p>
                  )}

                  {/* Row 3: Death date with words limit, then Summary / Rank */}
                  {(hasDeathDate || narrator.rank) && (
                    <div className="flex items-center gap-1.5 flex-wrap mt-auto pt-1">
                      {hasDeathDate && (
                        <span
                          title={deathDisplay}
                          className="text-[10px] font-mono text-muted-foreground flex items-center gap-1"
                        >
                          <Calendar className={`w-3 h-3 shrink-0 ${getThemeIconColor()}`} />
                          <span>{formatDeathText(deathDisplay, 7)}</span>
                        </span>
                      )}

                      {narrator.rank && (
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shadow-2xs ${getRankBadgeStyle(narrator.rank)}`}>
                          {narrator.rank}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load More Button */}
      {narrators.length < totalCount && !debouncedQuery && (
        <div className="pt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setPage(p => p + 1)}
            disabled={loadingMore}
            className="px-6 py-2.5 rounded-2xl bg-white dark:bg-[#131620] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 font-bold text-xs text-slate-800 dark:text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loadingMore ? (
              <>
                <Loader2 className={`w-4 h-4 animate-spin ${getThemeSpinnerColor()}`} />
                <span>جارٍ تحميل المزيد من الرواة...</span>
              </>
            ) : (
              <>
                <span>تحميل المزيد من الرواة (الصفحة {page + 1})</span>
                <ChevronLeft className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}

    </div>
  );
}
