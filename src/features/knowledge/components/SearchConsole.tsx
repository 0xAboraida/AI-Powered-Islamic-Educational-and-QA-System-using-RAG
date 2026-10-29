import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Layers,
  ChevronDown,
  User,
  RotateCcw,
  Sparkles,
  BookOpen,
  Calendar,
  FileText,
  Info,
  Heart,
  ArrowLeft
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { BookMeta, MainTab } from '../types/bookTypes';
import { inferCenturyAndDeath } from '../utils/turathMeta';
import { BookCard } from './BookCard';

export interface SearchConsoleProps {
  isCompact?: boolean;
  isScrolledPastSearch?: boolean;
  currentSearchValue: string;
  handleSearchChange: (val: string) => void;
  onSearchSubmit?: () => void;
  selectedDomain: string;
  setSelectedDomain: (val: string) => void;
  availableDomains: { name: string; count: number }[];
  filterAuthor: string;
  setFilterAuthor: (val: string) => void;
  availableAuthors: { name: string; count: number }[];
  publishedBooksCount: number;
  activeMainTab?: MainTab;
  homeSearchResults?: BookMeta[];
  isHomeSearchResultsDismissed?: boolean;
  setIsHomeSearchResultsDismissed?: (val: boolean) => void;
  favoriteBookIds?: Set<number | string>;
  toggleFavorite?: (id: number | string) => void;
  handleReadBook?: (book: BookMeta) => void;
  onAskBook?: (book: any) => void;
  setSelectedAuthorBook?: (book: BookMeta) => void;
  setActiveInfoBook?: (book: BookMeta) => void;
}

export const SearchConsole: React.FC<SearchConsoleProps> = ({
  isCompact = false,
  isScrolledPastSearch = false,
  currentSearchValue,
  handleSearchChange,
  onSearchSubmit,
  selectedDomain,
  setSelectedDomain,
  availableDomains,
  filterAuthor,
  setFilterAuthor,
  availableAuthors,
  publishedBooksCount,
  activeMainTab,
  homeSearchResults = [],
  isHomeSearchResultsDismissed = false,
  setIsHomeSearchResultsDismissed,
  favoriteBookIds = new Set(),
  toggleFavorite,
  handleReadBook,
  onAskBook,
  setSelectedAuthorBook,
  setActiveInfoBook,
}) => {
  const { isDark, accentColor } = useTheme();

  // On the home tab, only one search console is active and displayed to the user:
  // When scrolled past the hero, the compact navbar search console is active.
  // Otherwise, the hero search console is active.
  const isSearchActiveForThisInstance =
    activeMainTab === 'home' &&
    (isScrolledPastSearch ? isCompact : !isCompact);

  // Dropdown Popovers State
  const [isDomainPickerOpen, setIsDomainPickerOpen] = useState(false);
  const [isAuthorPickerOpen, setIsAuthorPickerOpen] = useState(false);
  const domainPickerRef = useRef<HTMLDivElement>(null);
  const mobileDomainPickerRef = useRef<HTMLDivElement>(null);
  const authorPickerRef = useRef<HTMLDivElement>(null);
  const mobileAuthorPickerRef = useRef<HTMLDivElement>(null);
  const searchConsoleRef = useRef<HTMLDivElement>(null);
  const [authorFilterQuery, setAuthorFilterQuery] = useState('');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideDomain =
        (domainPickerRef.current && domainPickerRef.current.contains(target)) ||
        (mobileDomainPickerRef.current && mobileDomainPickerRef.current.contains(target));
      if (!isInsideDomain) {
        setIsDomainPickerOpen(false);
      }

      const isInsideAuthor =
        (authorPickerRef.current && authorPickerRef.current.contains(target)) ||
        (mobileAuthorPickerRef.current && mobileAuthorPickerRef.current.contains(target));
      if (!isInsideAuthor) {
        setIsAuthorPickerOpen(false);
      }
      // Only the currently active search console instance handles dismissing the home search results popover
      if (isSearchActiveForThisInstance && searchConsoleRef.current) {
        const isInsideSearchConsole = searchConsoleRef.current.contains(target);
        const isInsidePopover = (event.target as Element)?.closest?.('[data-search-popover="true"]');
        if (!isInsideSearchConsole && !isInsidePopover) {
          setIsHomeSearchResultsDismissed?.(true);
        }
      }
    };

    const handleWindowScroll = () => {
      setIsDomainPickerOpen(false);
      setIsAuthorPickerOpen(false);

      // للشريط الرئيسي في الواجهة: لا يختفي بمجرد التمرير البسيط، بل يختفي فقط إذا خرج شريط البحث بالكامل من الشاشة
      if (!isCompact) {
        const heroEl = document.getElementById('hero-main-search-bar');
        if (heroEl) {
          const rect = heroEl.getBoundingClientRect();
          if (rect.bottom < -30) {
            setIsHomeSearchResultsDismissed?.(true);
          }
        } else if (window.scrollY > 500) {
          setIsHomeSearchResultsDismissed?.(true);
        }
      }
      // للشريط المصغر في النافبار (isCompact):
      // بما أنه شريط ثابت (Sticky) في أعلى الشاشة ويبقى دائماً أمام المستخدم،
      // فلا ينبغي إخفاء نتائجه بمجرد التمرير العادي في الخلفية، بل يختفي فقط بالنقر في أي مكان خارج الشاشة أو عند إغلاقه
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleWindowScroll);
    };
  }, [isCompact, isSearchActiveForThisInstance, setIsHomeSearchResultsDismissed]);

  const getHeroSearchContainerStyle = () => {
    // If we're on the home page hero:
    // On mobile (< md): provide an ultra-clean frosted glass aesthetic matching main site hero (Image 2)
    // On desktop (>= md): preserve original desktop hero styling 100%
    if (activeMainTab === 'home') {
      const mobileGlass = isDark
        ? 'bg-white/[0.08] hover:bg-white/[0.14] backdrop-blur-md border border-white/15 shadow-[0_4px_24px_rgba(0,0,0,0.25)] text-white'
        : 'bg-white/[0.35] hover:bg-white/[0.45] backdrop-blur-md border border-white/40 shadow-[0_4px_24px_rgba(0,0,0,0.06)] text-slate-900';

      const desktopStyle = (() => {
        switch (accentColor) {
          case 'emerald':
            return 'md:bg-black/16 md:hover:bg-black/25 md:backdrop-blur-xl md:border md:border-teal-300/60 md:hover:border-teal-200 md:shadow-[0_8px_32px_rgba(0,0,0,0.25),inset_0_1px_2px_rgba(255,255,255,0.35)] md:ring-1 md:ring-teal-300/25 md:text-white';
          case 'amber':
            return 'md:bg-black/16 md:hover:bg-black/25 md:backdrop-blur-xl md:border md:border-[#dfbf83]/60 md:hover:border-[#ebd9b5] md:shadow-[0_8px_32px_rgba(0,0,0,0.25),inset_0_1px_2px_rgba(255,255,255,0.35)] md:ring-1 md:ring-[#dfbf83]/25 md:text-white';
          case 'blue':
            return 'md:bg-black/16 md:hover:bg-black/25 md:backdrop-blur-xl md:border md:border-blue-300/60 md:hover:border-blue-200 md:shadow-[0_8px_32px_rgba(0,0,0,0.25),inset_0_1px_2px_rgba(255,255,255,0.35)] md:ring-1 md:ring-blue-300/25 md:text-white';
          case 'purple':
          default:
            return 'md:bg-black/16 md:hover:bg-black/25 md:backdrop-blur-xl md:border md:border-purple-300/60 md:hover:border-purple-200 md:shadow-[0_8px_32px_rgba(0,0,0,0.25),inset_0_1px_2px_rgba(255,255,255,0.35)] md:ring-1 md:ring-purple-300/25 md:text-white';
        }
      })();

      return `${mobileGlass} ${desktopStyle}`;
    }

    if (isDark) {
      switch (accentColor) {
        case 'emerald':
          return 'bg-[#0f1724]/80 hover:bg-[#0f1724]/90 backdrop-blur-2xl border border-teal-500/35 hover:border-teal-400/55 shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.18)] ring-1 ring-teal-500/20 text-teal-100';
        case 'amber':
          return 'bg-[#15141b]/80 hover:bg-[#15141b]/90 backdrop-blur-2xl border border-[#dfbf83]/35 hover:border-[#dfbf83]/55 shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.18)] ring-1 ring-[#dfbf83]/20 text-[#eed8ad]';
        case 'blue':
          return 'bg-[#0f1724]/80 hover:bg-[#0f1724]/90 backdrop-blur-2xl border border-blue-500/35 hover:border-blue-400/55 shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.18)] ring-1 ring-blue-500/20 text-blue-100';
        case 'purple':
        default:
          return 'bg-[#140e24]/80 hover:bg-[#140e24]/90 backdrop-blur-2xl border border-purple-500/35 hover:border-purple-400/55 shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.18)] ring-1 ring-purple-500/20 text-purple-100';
      }
    } else {
      switch (accentColor) {
        case 'emerald':
          return 'bg-white/85 hover:bg-white/95 backdrop-blur-2xl border border-teal-200/80 hover:border-teal-300 shadow-[0_10px_35px_rgba(20,184,166,0.08),inset_0_1px_2px_rgba(255,255,255,0.95)] ring-1 ring-teal-500/15 text-slate-900';
        case 'amber':
          return 'bg-white/85 hover:bg-white/95 backdrop-blur-2xl border border-[#dfbf83]/60 hover:border-[#dfbf83] shadow-[0_10px_35px_rgba(184,141,70,0.08),inset_0_1px_2px_rgba(255,255,255,0.95)] ring-1 ring-[#dfbf83]/15 text-slate-900';
        case 'blue':
          return 'bg-white/85 hover:bg-white/95 backdrop-blur-2xl border border-blue-200/80 hover:border-blue-300 shadow-[0_10px_35px_rgba(59,130,246,0.08),inset_0_1px_2px_rgba(255,255,255,0.95)] ring-1 ring-blue-500/15 text-slate-900';
        case 'purple':
        default:
          return 'bg-white/85 hover:bg-white/95 backdrop-blur-2xl border border-purple-200/80 hover:border-purple-300 shadow-[0_10px_35px_rgba(168,85,247,0.08),inset_0_1px_2px_rgba(255,255,255,0.95)] ring-1 ring-purple-500/15 text-slate-900';
      }
    }
  };

  const getCompactSearchContainerStyle = () => {
    if (isDark) {
      switch (accentColor) {
        case 'emerald':
          return 'bg-[#0f1724]/75 hover:bg-[#0f1724]/85 backdrop-blur-2xl border border-teal-500/30 text-teal-100 shadow-md ring-1 ring-teal-500/20';
        case 'amber':
          return 'bg-[#15141b]/75 hover:bg-[#15141b]/85 backdrop-blur-2xl border border-[#dfbf83]/30 text-[#eed8ad] shadow-md ring-1 ring-[#dfbf83]/20';
        case 'blue':
          return 'bg-[#0f1724]/75 hover:bg-[#0f1724]/85 backdrop-blur-2xl border border-blue-500/30 text-blue-100 shadow-md ring-1 ring-blue-500/20';
        case 'purple':
        default:
          return 'bg-[#140e24]/75 hover:bg-[#140e24]/85 backdrop-blur-2xl border border-purple-500/30 text-purple-100 shadow-md ring-1 ring-purple-500/20';
      }
    } else {
      switch (accentColor) {
        case 'emerald':
          return 'bg-white/75 hover:bg-white/85 backdrop-blur-2xl border border-teal-200/80 text-slate-900 shadow-sm ring-1 ring-teal-500/10';
        case 'amber':
          return 'bg-white/75 hover:bg-white/85 backdrop-blur-2xl border border-[#dfbf83]/60 text-slate-900 shadow-sm ring-1 ring-[#dfbf83]/10';
        case 'blue':
          return 'bg-white/75 hover:bg-white/85 backdrop-blur-2xl border border-blue-200/80 text-slate-900 shadow-sm ring-1 ring-blue-500/10';
        case 'purple':
        default:
          return 'bg-white/75 hover:bg-white/85 backdrop-blur-2xl border border-purple-200/80 text-slate-900 shadow-sm ring-1 ring-purple-500/10';
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

  const getHeroSearchIconColor = () => {
    switch (accentColor) {
      case 'amber':
        return 'text-[#dfbf83] drop-shadow-[0_1px_8px_rgba(223,191,131,0.65)]';
      case 'emerald':
        return 'text-teal-400 drop-shadow-[0_1px_8px_rgba(20,184,166,0.65)]';
      case 'blue':
        return 'text-blue-400 drop-shadow-[0_1px_8px_rgba(59,130,246,0.65)]';
      case 'purple':
      default:
        return 'text-purple-400 drop-shadow-[0_1px_8px_rgba(168,85,247,0.65)]';
    }
  };

  const getFilterPillActiveStyle = () => {
    if (!isCompact && activeMainTab === 'home') {
      switch (accentColor) {
        case 'amber':
          return 'bg-[#b88d46]/45 border-[#dfbf83] text-white shadow-md shadow-amber-950/40 backdrop-blur-md font-bold';
        case 'emerald':
          return 'bg-teal-500/45 border-teal-300 text-white shadow-md shadow-teal-950/40 backdrop-blur-md font-bold';
        case 'blue':
          return 'bg-blue-500/45 border-blue-300 text-white shadow-md shadow-blue-950/40 backdrop-blur-md font-bold';
        case 'purple':
        default:
          return 'bg-purple-500/45 border-purple-300 text-white shadow-md shadow-purple-950/40 backdrop-blur-md font-bold';
      }
    }
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

  const getFilterPillIconColor = (isActive: boolean) => {
    if (!isActive) {
      if (!isCompact && activeMainTab === 'home') return 'text-white/80';
      return isDark ? 'text-white/60' : 'text-stone-600';
    }
    if (!isCompact && activeMainTab === 'home') return 'text-white';
    switch (accentColor) {
      case 'amber': return 'text-[#dfbf83] dark:text-[#eed9b0]';
      case 'emerald': return 'text-teal-600 dark:text-teal-300';
      case 'blue': return 'text-blue-600 dark:text-blue-300';
      case 'purple':
      default: return 'text-brand-magenta dark:text-purple-300';
    }
  };

  const getFilterPillCloseBtnStyle = () => {
    if (!isCompact && activeMainTab === 'home') {
      return 'bg-white/20 hover:bg-white/40 text-white';
    }
    switch (accentColor) {
      case 'amber':
        return 'bg-[#b88d46]/30 hover:bg-[#b88d46] hover:text-stone-950 text-amber-200';
      case 'emerald':
        return 'bg-teal-500/30 hover:bg-teal-500 hover:text-white text-teal-200';
      case 'blue':
        return 'bg-blue-500/30 hover:bg-blue-500 hover:text-white text-blue-200';
      case 'purple':
      default:
        return 'bg-purple-500/30 hover:bg-purple-500 hover:text-white text-purple-200';
    }
  };

  const getFilterPopoverContainerStyle = () => {
    if (isDark) {
      switch (accentColor) {
        case 'amber':
          return 'bg-[#1e1710]/98 border-[#dfbf83]/30 text-white shadow-[0_25px_70px_rgba(0,0,0,0.7)] backdrop-blur-2xl';
        case 'emerald':
          return 'bg-[#102020]/98 border-teal-500/30 text-white shadow-[0_25px_70px_rgba(0,0,0,0.7)] backdrop-blur-2xl';
        case 'blue':
          return 'bg-[#111f33]/98 border-blue-500/30 text-white shadow-[0_25px_70px_rgba(0,0,0,0.7)] backdrop-blur-2xl';
        case 'purple':
        default:
          return 'bg-[#1a122e]/98 border-purple-500/30 text-white shadow-[0_25px_70px_rgba(0,0,0,0.7)] backdrop-blur-2xl';
      }
    } else {
      switch (accentColor) {
        case 'amber':
          return 'bg-white/98 border-[#ebd9b5] text-stone-900 shadow-xl';
        case 'emerald':
          return 'bg-white/98 border-teal-200 text-slate-900 shadow-xl';
        case 'blue':
          return 'bg-white/98 border-blue-200 text-slate-900 shadow-xl';
        case 'purple':
        default:
          return 'bg-white/98 border-purple-200 text-slate-900 shadow-xl';
      }
    }
  };

  const getFilterPopoverItemActiveStyle = () => {
    switch (accentColor) {
      case 'amber':
        return 'bg-gradient-to-r from-[#8e682d] via-[#b88d46] to-[#dfbf83] text-stone-950 font-bold shadow-sm';
      case 'emerald':
        return 'bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-500 text-white font-bold shadow-sm';
      case 'blue':
        return 'bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 text-white font-bold shadow-sm';
      case 'purple':
      default:
        return 'bg-gradient-to-r from-brand-magenta to-brand-deep text-white font-bold shadow-sm';
    }
  };

  const getFilterPopoverItemHoverStyle = () => {
    if (isDark) return 'hover:bg-white/10 text-white/90';
    switch (accentColor) {
      case 'amber': return 'hover:bg-[#fcf8ee] text-stone-800';
      case 'emerald': return 'hover:bg-teal-50 text-teal-900';
      case 'blue': return 'hover:bg-blue-50 text-blue-900';
      case 'purple':
      default: return 'hover:bg-purple-50 text-purple-900';
    }
  };

  const getFilterPopoverInputStyle = () => {
    if (isDark) {
      switch (accentColor) {
        case 'amber':
          return 'bg-white/5 border-white/15 focus:border-[#dfbf83]/60 text-white placeholder:text-white/40';
        case 'emerald':
          return 'bg-white/5 border-white/15 focus:border-teal-400/60 text-white placeholder:text-white/40';
        case 'blue':
          return 'bg-white/5 border-white/15 focus:border-blue-400/60 text-white placeholder:text-white/40';
        case 'purple':
        default:
          return 'bg-white/5 border-white/15 focus:border-purple-400/60 text-white placeholder:text-white/40';
      }
    } else {
      switch (accentColor) {
        case 'amber':
          return 'bg-amber-50/40 border-[#ebd9b5] focus:border-[#b88d46] text-stone-900 placeholder:text-stone-400';
        case 'emerald':
          return 'bg-teal-50/40 border-teal-200 focus:border-teal-400 text-stone-900 placeholder:text-stone-400';
        case 'blue':
          return 'bg-blue-50/40 border-blue-200 focus:border-blue-400 text-stone-900 placeholder:text-stone-400';
        case 'purple':
        default:
          return 'bg-purple-50/40 border-purple-200 focus:border-purple-400 text-stone-900 placeholder:text-stone-400';
      }
    }
  };

  const getFilterResetBtnStyle = () => {
    switch (accentColor) {
      case 'amber':
        return 'bg-amber-500/15 hover:bg-amber-500 hover:text-stone-950 text-[#eed9b0] dark:text-[#dfbf83] border-amber-500/30';
      case 'emerald':
        return 'bg-teal-500/15 hover:bg-teal-500 hover:text-white text-teal-300 border-teal-500/30';
      case 'blue':
        return 'bg-blue-500/15 hover:bg-blue-500 hover:text-white text-blue-300 border-blue-500/30';
      case 'purple':
      default:
        return 'bg-purple-500/15 hover:bg-purple-500 hover:text-white text-purple-200 border-purple-500/30';
    }
  };

  const getSearchPopoverContainerStyle = () => {
    if (isDark) {
      switch (accentColor) {
        case 'amber':
          return 'bg-[#0d0f14] border-[#dfbf83]/30 text-white shadow-[0_25px_80px_rgba(0,0,0,0.95)] ring-1 ring-[#dfbf83]/15';
        case 'emerald':
          return 'bg-[#0b1717] border-teal-500/30 text-white shadow-[0_25px_80px_rgba(0,0,0,0.95)] ring-1 ring-teal-500/15';
        case 'blue':
          return 'bg-[#0d1627] border-blue-500/30 text-white shadow-[0_25px_80px_rgba(0,0,0,0.95)] ring-1 ring-blue-500/15';
        case 'purple':
        default:
          return 'bg-[#130d24] border-purple-500/30 text-white shadow-[0_25px_80px_rgba(0,0,0,0.95)] ring-1 ring-purple-500/15';
      }
    } else {
      switch (accentColor) {
        case 'amber':
          return 'bg-white border-[#ebd9b5] text-stone-900 shadow-[0_25px_70px_rgba(184,141,70,0.18)] ring-1 ring-[#b88d46]/10';
        case 'emerald':
          return 'bg-white border-teal-200 text-slate-900 shadow-[0_25px_70px_rgba(20,184,166,0.18)] ring-1 ring-teal-500/10';
        case 'blue':
          return 'bg-white border-blue-200 text-slate-900 shadow-[0_25px_70px_rgba(59,130,246,0.18)] ring-1 ring-blue-500/10';
        case 'purple':
        default:
          return 'bg-white border-purple-200 text-slate-900 shadow-[0_25px_70px_rgba(168,85,247,0.18)] ring-1 ring-purple-500/10';
      }
    }
  };

  const getPopoverSparkleColor = () => {
    switch (accentColor) {
      case 'amber': return 'text-[#dfbf83] dark:text-[#eed9b0]';
      case 'emerald': return 'text-teal-600 dark:text-teal-400';
      case 'blue': return 'text-blue-600 dark:text-blue-400';
      case 'purple':
      default: return 'text-brand-magenta dark:text-purple-400';
    }
  };

  const getPopoverCountBadgeStyle = () => {
    if (isDark) {
      switch (accentColor) {
        case 'amber': return 'bg-[#dfbf83]/20 text-[#eed9b0] border border-[#dfbf83]/30';
        case 'emerald': return 'bg-teal-500/20 text-teal-300 border border-teal-500/30';
        case 'blue': return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
        case 'purple':
        default: return 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
      }
    } else {
      switch (accentColor) {
        case 'amber': return 'bg-amber-100 text-stone-900 border border-amber-300';
        case 'emerald': return 'bg-teal-100 text-teal-900 border border-teal-300';
        case 'blue': return 'bg-blue-100 text-blue-900 border border-blue-300';
        case 'purple':
        default: return 'bg-purple-100 text-purple-900 border border-purple-300';
      }
    }
  };

  const getPopoverViewAllBtnStyle = () => {
    switch (accentColor) {
      case 'amber':
        return 'bg-gradient-to-r from-[#8e682d] via-[#b88d46] to-[#dfbf83] text-stone-950 font-black shadow-[#dfbf83]/30';
      case 'emerald':
        return 'bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-500 text-white shadow-teal-500/30';
      case 'blue':
        return 'bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 text-white shadow-blue-500/30';
      case 'purple':
      default:
        return 'bg-gradient-to-r from-brand-magenta to-brand-deep text-white shadow-purple-500/30';
    }
  };

  const isLiveSearchActive =
    isSearchActiveForThisInstance &&
    (Boolean(currentSearchValue.trim()) || selectedDomain !== 'all' || filterAuthor !== 'all') &&
    !isHomeSearchResultsDismissed;

  return (
    <div
      ref={searchConsoleRef}
      className={`relative w-full transition-all ${(isDomainPickerOpen || isAuthorPickerOpen || isLiveSearchActive) ? 'z-50' : 'z-20'}`}
    >
      <div className={`w-full transition-all duration-300 rounded-2xl md:rounded-full ${isCompact
        ? getCompactSearchContainerStyle()
        : getHeroSearchContainerStyle()
        }`}>
        <div className={`flex items-center gap-2 sm:gap-3 px-3.5 sm:px-4 ${isCompact ? 'py-1.5' : 'py-2 sm:py-2.5'
          }`}>
          {/* 1. Circle Search Button on Right (Desktop or when not mobile home hero) */}
          <button
            type="button"
            onClick={() => onSearchSubmit?.()}
            className={`${!isCompact && activeMainTab === 'home' ? 'hidden md:flex' : 'flex'} rounded-xl md:rounded-full items-center justify-center shadow-md shrink-0 transition-all cursor-pointer active:scale-95 ${getSearchBtnStyle()} ${isCompact ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-9 h-9 sm:w-10 sm:h-10'
              }`}
            title="بحث في المكتبة"
          >
            <Search className={isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4 sm:w-4.5 sm:h-4.5'} />
          </button>

          {/* 1b. Colored Search Icon on Right (Mobile Home Hero ONLY) */}
          {!isCompact && activeMainTab === 'home' && (
            <button
              type="button"
              onClick={() => onSearchSubmit?.()}
              className="flex md:hidden items-center justify-center shrink-0 pr-0.5 transition-transform active:scale-90 cursor-pointer"
              title="بحث في المكتبة"
            >
              <Search className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${getHeroSearchIconColor()}`} />
            </button>
          )}

          {/* 2. Main Search Input */}
          <input
            type="text"
            value={currentSearchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => {
              if (Boolean(currentSearchValue.trim()) || selectedDomain !== 'all' || filterAuthor !== 'all') {
                setIsHomeSearchResultsDismissed?.(false);
              }
            }}
            onClick={() => {
              if (Boolean(currentSearchValue.trim()) || selectedDomain !== 'all' || filterAuthor !== 'all') {
                setIsHomeSearchResultsDismissed?.(false);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onSearchSubmit?.();
              }
            }}
            placeholder={isCompact ? "ابحث في المكتبة..." : "ابحث عن كتاب، مؤلف، أو موضوع شرعي..."}
            className={`min-w-0 flex-1 bg-transparent outline-none ${Boolean(currentSearchValue) ? 'font-bold' : 'font-normal'} ${!isCompact && activeMainTab === 'home'
              ? 'text-white placeholder:text-white/80 placeholder:font-normal drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]'
              : isDark
                ? 'text-white placeholder:text-slate-400/50 placeholder:font-normal'
                : 'text-stone-900 placeholder:text-stone-400 placeholder:font-normal'
              } text-xs sm:text-sm py-1.5 md:py-1`}
          />

          {/* Clear button */}
          {Boolean(currentSearchValue) && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className={`p-1.5 rounded-full transition-colors shrink-0 cursor-pointer ${!isCompact && activeMainTab === 'home'
                ? 'text-white/80 hover:text-white hover:bg-white/15'
                : isDark
                  ? 'text-white/80 hover:text-white hover:bg-white/10'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-black/5'
                }`}
              title="مسح البحث"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Subtle Vertical Divider (Desktop only) */}
          <div className={`w-px shrink-0 ${!isCompact && activeMainTab === 'home'
            ? 'bg-white/30'
            : isDark
              ? 'bg-white/20'
              : 'bg-stone-400/50'
            } ${isCompact ? 'h-5' : 'h-6 sm:h-7'} hidden md:block`} />

          {/* Dropdown Filters: Domain & Author (Desktop: inside search bar) */}
          <div className="hidden md:flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Domain Picker */}
            <div className="relative" ref={domainPickerRef}>
              <button
                type="button"
                onClick={() => {
                  setIsDomainPickerOpen(!isDomainPickerOpen);
                  setIsAuthorPickerOpen(false);
                }}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 rounded-full border transition-all duration-200 font-bold font-sans cursor-pointer active:scale-95 ${isCompact ? 'h-[30px] sm:h-[32px] text-[11px] sm:text-xs' : 'h-[32px] sm:h-[34px] text-xs'
                  } ${selectedDomain !== 'all'
                    ? getFilterPillActiveStyle()
                    : !isCompact && activeMainTab === 'home'
                      ? 'bg-white/10 hover:bg-white/18 border-white/25 hover:border-white/45 text-white backdrop-blur-md shadow-xs drop-shadow-xs'
                      : isDark
                        ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-md'
                        : 'bg-white/40 hover:bg-white/60 border-white/60 hover:border-white text-stone-900 font-bold backdrop-blur-md shadow-2xs'
                  }`}
                title="تصفية حسب القسم الشرعي"
              >
                <Layers className={`${isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} ${getFilterPillIconColor(selectedDomain !== 'all')} shrink-0`} />
                <span className="truncate max-w-[70px] sm:max-w-[110px] md:max-w-[130px]">
                  {selectedDomain === 'all' ? 'القسم: الكل' : selectedDomain}
                </span>
                {selectedDomain !== 'all' ? (
                  <span
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDomain('all');
                    }}
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all ml-0.5 cursor-pointer shrink-0 ${getFilterPillCloseBtnStyle()}`}
                    title="إلغاء تصفية القسم"
                  >
                    <X className="w-2.5 h-2.5" />
                  </span>
                ) : (
                  <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isDomainPickerOpen ? 'rotate-180' : 'rotate-0'} ${!isCompact && activeMainTab === 'home' ? 'text-white/80' : 'opacity-70'}`} />
                )}
              </button>

              {/* Domain Popover */}
              <div
                className={`absolute top-full left-0 mt-2 w-[240px] sm:w-[270px] rounded-2xl border transition-all duration-200 z-[100] origin-top-left p-2.5 shadow-2xl backdrop-blur-2xl ${isDomainPickerOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                  } ${getFilterPopoverContainerStyle()}`}
              >
                <div className="flex items-center justify-between px-2 pb-2 mb-1.5 border-b border-slate-100 dark:border-white/10 text-xs font-bold text-muted-foreground">
                  <span>اختر القسم الشرعي</span>
                  <span className="text-[10px] font-mono opacity-80">{availableDomains.length} قسم</span>
                </div>
                <div className="flex flex-col gap-1 max-h-[260px] overflow-y-auto [&::-webkit-scrollbar]:hidden">
                  <button
                    key="all-domains"
                    type="button"
                    onClick={() => {
                      setSelectedDomain('all');
                      setIsDomainPickerOpen(false);
                    }}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-all text-right cursor-pointer ${selectedDomain === 'all'
                      ? getFilterPopoverItemActiveStyle()
                      : getFilterPopoverItemHoverStyle()
                      }`}
                  >
                    <span className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 opacity-70" />
                      الكل (جميع الأقسام)
                    </span>
                    <span className="text-[11px] font-mono opacity-75">({publishedBooksCount})</span>
                  </button>
                  {availableDomains.map(d => {
                    const isSel = selectedDomain === d.name;
                    return (
                      <button
                        key={d.name}
                        type="button"
                        onClick={() => {
                          setSelectedDomain(d.name);
                          setIsDomainPickerOpen(false);
                        }}
                        className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all text-right cursor-pointer ${isSel
                          ? getFilterPopoverItemActiveStyle()
                          : getFilterPopoverItemHoverStyle()
                          }`}
                      >
                        <span className="truncate">{d.name}</span>
                        <span className="text-[11px] font-mono opacity-75 shrink-0 mr-2">({d.count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Author Picker (hidden on authors tab) */}
            {activeMainTab !== 'authors' && (
            <div className="relative" ref={authorPickerRef}>
              <button
                type="button"
                onClick={() => {
                  setIsAuthorPickerOpen(!isAuthorPickerOpen);
                  setIsDomainPickerOpen(false);
                }}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 rounded-full border transition-all duration-200 font-bold font-sans cursor-pointer active:scale-95 ${isCompact ? 'h-[30px] sm:h-[32px] text-[11px] sm:text-xs' : 'h-[32px] sm:h-[34px] text-xs'
                  } ${filterAuthor !== 'all'
                    ? getFilterPillActiveStyle()
                    : !isCompact && activeMainTab === 'home'
                      ? 'bg-white/10 hover:bg-white/18 border-white/25 hover:border-white/45 text-white backdrop-blur-md shadow-xs drop-shadow-xs'
                      : isDark
                        ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-md'
                        : 'bg-white/40 hover:bg-white/60 border-white/60 hover:border-white text-stone-900 font-bold backdrop-blur-md shadow-2xs'
                  }`}
                title="تصفية حسب المؤلف"
              >
                <User className={`${isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} ${getFilterPillIconColor(filterAuthor !== 'all')} shrink-0`} />
                <span className="truncate max-w-[70px] sm:max-w-[110px] md:max-w-[130px]">
                  {filterAuthor === 'all' ? 'المؤلف: الكل' : filterAuthor}
                </span>
                {filterAuthor !== 'all' ? (
                  <span
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilterAuthor('all');
                    }}
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all ml-0.5 cursor-pointer shrink-0 ${getFilterPillCloseBtnStyle()}`}
                    title="إلغاء تصفية المؤلف"
                  >
                    <X className="w-2.5 h-2.5" />
                  </span>
                ) : (
                  <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isAuthorPickerOpen ? 'rotate-180' : 'rotate-0'} ${!isCompact && activeMainTab === 'home' ? 'text-white/80' : 'opacity-70'}`} />
                )}
              </button>

              {/* Author Popover */}
              <div
                className={`absolute top-full left-0 mt-2 w-[240px] sm:w-[270px] rounded-2xl border transition-all duration-200 z-[100] origin-top-left p-2.5 shadow-2xl backdrop-blur-2xl ${isAuthorPickerOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                  } ${getFilterPopoverContainerStyle()}`}
              >
                <div className="flex items-center justify-between px-2 pb-2 mb-1.5 border-b border-slate-100 dark:border-white/10 text-xs font-bold text-muted-foreground">
                  <span>اختر المؤلف أو الإمام</span>
                  <span className="text-[10px] font-mono opacity-80">{availableAuthors.length} عالم</span>
                </div>

                <div className="px-1 mb-2">
                  <input
                    type="text"
                    placeholder="ابحث باسم العالم..."
                    value={authorFilterQuery}
                    onChange={(e) => setAuthorFilterQuery(e.target.value)}
                    className={`w-full text-xs px-2.5 py-1.5 rounded-lg outline-none transition-colors ${getFilterPopoverInputStyle()}`}
                  />
                </div>

                <div className="flex flex-col gap-1 max-h-[220px] overflow-y-auto [&::-webkit-scrollbar]:hidden">
                  <button
                    key="all-authors"
                    type="button"
                    onClick={() => {
                      setFilterAuthor('all');
                      setIsAuthorPickerOpen(false);
                      setAuthorFilterQuery('');
                    }}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-all text-right cursor-pointer ${filterAuthor === 'all'
                      ? getFilterPopoverItemActiveStyle()
                      : getFilterPopoverItemHoverStyle()
                      }`}
                  >
                    <span className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 opacity-70" />
                      الكل (جميع المؤلفين)
                    </span>
                    <span className="text-[11px] font-mono opacity-75">({availableAuthors.length})</span>
                  </button>
                  {availableAuthors
                    .filter(a => !authorFilterQuery.trim() || a.name.toLowerCase().includes(authorFilterQuery.trim().toLowerCase()))
                    .slice(0, 50)
                    .map(a => {
                      const isSel = filterAuthor === a.name;
                      return (
                        <button
                          key={a.name}
                          type="button"
                          onClick={() => {
                            setFilterAuthor(a.name);
                            setIsAuthorPickerOpen(false);
                            setAuthorFilterQuery('');
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all text-right cursor-pointer ${isSel
                            ? getFilterPopoverItemActiveStyle()
                            : getFilterPopoverItemHoverStyle()
                            }`}
                        >
                          <span className="truncate pr-1">{a.name}</span>
                          <span className="text-[11px] font-mono opacity-75 shrink-0 mr-2">({a.count})</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
            )}

            {/* Reset button if filtered */}
            {(selectedDomain !== 'all' || (activeMainTab !== 'authors' && filterAuthor !== 'all')) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDomain('all');
                  setFilterAuthor('all');
                }}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border transition-all flex items-center justify-center shrink-0 active:scale-95 cursor-pointer shadow-xs ${getFilterResetBtnStyle()}`}
                title="إعادة تعيين الفلاتر"
              >
                <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Mobile Filters Row (Below capsule on home, authors, and categories tabs when !isCompact) */}
      {!isCompact && (activeMainTab === 'home' || activeMainTab === 'authors' || activeMainTab === 'categories') && (
        <div className="flex md:hidden items-center justify-center gap-2 mt-2 px-1 animate-in fade-in duration-200">
          {/* Domain Picker (Mobile) */}
          <div className="relative" ref={mobileDomainPickerRef}>
            <button
              type="button"
              onClick={() => {
                setIsDomainPickerOpen(!isDomainPickerOpen);
                setIsAuthorPickerOpen(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all duration-200 font-bold font-sans cursor-pointer active:scale-95 text-xs ${
                selectedDomain !== 'all'
                  ? getFilterPillActiveStyle()
                  : activeMainTab === 'home'
                    ? 'bg-white/[0.08] hover:bg-white/[0.14] border-white/15 text-white backdrop-blur-md shadow-xs'
                    : isDark
                      ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-md'
                      : 'bg-white/40 hover:bg-white/60 border-white/60 hover:border-white text-stone-900 font-bold backdrop-blur-md shadow-2xs'
              }`}
              title="تصفية حسب القسم الشرعي"
            >
              <Layers className={`w-3.5 h-3.5 ${getFilterPillIconColor(selectedDomain !== 'all')} shrink-0`} />
              <span className="truncate max-w-[110px]">
                {selectedDomain === 'all' ? 'القسم: الكل' : selectedDomain}
              </span>
              {selectedDomain !== 'all' ? (
                <span
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDomain('all');
                  }}
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all ml-0.5 cursor-pointer shrink-0 ${getFilterPillCloseBtnStyle()}`}
                  title="إلغاء تصفية القسم"
                >
                  <X className="w-2.5 h-2.5" />
                </span>
              ) : (
                <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isDomainPickerOpen ? 'rotate-180' : 'rotate-0'} ${activeMainTab === 'home' ? 'text-white/80' : isDark ? 'text-white/60' : 'text-stone-500'}`} />
              )}
            </button>

            {/* Mobile Domain Popover */}
            <div
              className={`absolute top-full right-0 mt-2 w-[250px] rounded-2xl border transition-all duration-200 z-[100] origin-top-right p-2.5 shadow-2xl backdrop-blur-2xl ${
                isDomainPickerOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
              } ${getFilterPopoverContainerStyle()}`}
            >
              <div className="flex items-center justify-between px-2 pb-2 mb-1.5 border-b border-slate-100 dark:border-white/10 text-xs font-bold text-muted-foreground">
                <span>اختر القسم الشرعي</span>
                <span className="text-[10px] font-mono opacity-80">{availableDomains.length} قسم</span>
              </div>
              <div className="flex flex-col gap-1 max-h-[240px] overflow-y-auto custom-scrollbar">
                <button
                  key="all-domains-mob"
                  type="button"
                  onClick={() => {
                    setSelectedDomain('all');
                    setIsDomainPickerOpen(false);
                  }}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-all text-right cursor-pointer ${
                    selectedDomain === 'all'
                      ? getFilterPopoverItemActiveStyle()
                      : getFilterPopoverItemHoverStyle()
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 opacity-70" />
                    الكل (جميع الأقسام)
                  </span>
                  <span className="text-[11px] font-mono opacity-75">({publishedBooksCount})</span>
                </button>
                {availableDomains.map(d => {
                  const isSel = selectedDomain === d.name;
                  return (
                    <button
                      key={d.name}
                      type="button"
                      onClick={() => {
                        setSelectedDomain(d.name);
                        setIsDomainPickerOpen(false);
                      }}
                      className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all text-right cursor-pointer ${
                        isSel
                          ? getFilterPopoverItemActiveStyle()
                          : getFilterPopoverItemHoverStyle()
                      }`}
                    >
                      <span className="truncate">{d.name}</span>
                      <span className="text-[11px] font-mono opacity-75 shrink-0 mr-2">({d.count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Author Picker (Mobile) - hidden on authors tab */}
          {activeMainTab !== 'authors' && (
          <div className="relative" ref={mobileAuthorPickerRef}>
            <button
              type="button"
              onClick={() => {
                setIsAuthorPickerOpen(!isAuthorPickerOpen);
                setIsDomainPickerOpen(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all duration-200 font-bold font-sans cursor-pointer active:scale-95 text-xs ${
                filterAuthor !== 'all'
                  ? getFilterPillActiveStyle()
                  : activeMainTab === 'home'
                    ? 'bg-white/[0.08] hover:bg-white/[0.14] border-white/15 text-white backdrop-blur-md shadow-xs'
                    : isDark
                      ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-md'
                      : 'bg-white/40 hover:bg-white/60 border-white/60 hover:border-white text-stone-900 font-bold backdrop-blur-md shadow-2xs'
              }`}
              title="تصفية حسب المؤلف"
            >
              <User className={`w-3.5 h-3.5 ${getFilterPillIconColor(filterAuthor !== 'all')} shrink-0`} />
              <span className="truncate max-w-[110px]">
                {filterAuthor === 'all' ? 'المؤلف: الكل' : filterAuthor}
              </span>
              {filterAuthor !== 'all' ? (
                <span
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFilterAuthor('all');
                  }}
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all ml-0.5 cursor-pointer shrink-0 ${getFilterPillCloseBtnStyle()}`}
                  title="إلغاء تصفية المؤلف"
                >
                  <X className="w-2.5 h-2.5" />
                </span>
              ) : (
                <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isAuthorPickerOpen ? 'rotate-180' : 'rotate-0'} ${activeMainTab === 'home' ? 'text-white/80' : isDark ? 'text-white/60' : 'text-stone-500'}`} />
              )}
            </button>

            {/* Mobile Author Popover */}
            <div
              className={`absolute top-full left-0 mt-2 w-[250px] rounded-2xl border transition-all duration-200 z-[100] origin-top-left p-2.5 shadow-2xl backdrop-blur-2xl ${
                isAuthorPickerOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
              } ${getFilterPopoverContainerStyle()}`}
            >
              <div className="flex items-center justify-between px-2 pb-2 mb-1.5 border-b border-slate-100 dark:border-white/10 text-xs font-bold text-muted-foreground">
                <span>اختر المؤلف أو الإمام</span>
                <span className="text-[10px] font-mono opacity-80">{availableAuthors.length} عالم</span>
              </div>

              <div className="px-1 mb-2">
                <input
                  type="text"
                  placeholder="ابحث باسم العالم..."
                  value={authorFilterQuery}
                  onChange={(e) => setAuthorFilterQuery(e.target.value)}
                  className={`w-full text-xs px-2.5 py-1.5 rounded-lg outline-none transition-colors ${getFilterPopoverInputStyle()}`}
                />
              </div>

              <div className="flex flex-col gap-1 max-h-[220px] overflow-y-auto custom-scrollbar">
                <button
                  key="all-authors-mob"
                  type="button"
                  onClick={() => {
                    setFilterAuthor('all');
                    setIsAuthorPickerOpen(false);
                    setAuthorFilterQuery('');
                  }}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-all text-right cursor-pointer ${
                    filterAuthor === 'all'
                      ? getFilterPopoverItemActiveStyle()
                      : getFilterPopoverItemHoverStyle()
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 opacity-70" />
                    الكل (جميع المؤلفين)
                  </span>
                  <span className="text-[11px] font-mono opacity-75">({availableAuthors.length})</span>
                </button>
                {availableAuthors
                  .filter(a => !authorFilterQuery.trim() || a.name.toLowerCase().includes(authorFilterQuery.trim().toLowerCase()))
                  .slice(0, 50)
                  .map(a => {
                    const isSel = filterAuthor === a.name;
                    return (
                      <button
                        key={a.name}
                        type="button"
                        onClick={() => {
                          setFilterAuthor(a.name);
                          setIsAuthorPickerOpen(false);
                          setAuthorFilterQuery('');
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all text-right cursor-pointer ${
                          isSel
                            ? getFilterPopoverItemActiveStyle()
                            : getFilterPopoverItemHoverStyle()
                        }`}
                      >
                        <span className="truncate pr-1">{a.name}</span>
                        <span className="text-[11px] font-mono opacity-75 shrink-0 mr-2">({a.count})</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
          )}
        </div>
      )}

      {/* 3. Floating Live Search Results Popover (نافذة منبثقة ملتصقة بالسيرش بار) */}
      {isLiveSearchActive && (
        <div
          data-search-popover="true"
          onMouseDown={(e) => e.stopPropagation()}
          className={`absolute top-full left-0 right-0 ${isCompact ? 'mt-2' : 'mt-3'} rounded-2xl sm:rounded-3xl border shadow-2xl backdrop-blur-2xl transition-all duration-300 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 text-right ${getSearchPopoverContainerStyle()}`}
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-100 dark:border-white/10">
            <div className="flex items-center gap-2">
              <Sparkles className={`w-4 h-4 ${getPopoverSparkleColor()}`} />
              <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">
                نتائج البحث الفوري
              </span>
              <span className={`text-[11px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded-full ${getPopoverCountBadgeStyle()}`}>
                {homeSearchResults.length} {homeSearchResults.length === 1 ? 'كتاب' : 'كتب'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {homeSearchResults.length > 0 && (
                <button
                  type="button"
                  onClick={() => onSearchSubmit?.()}
                  className="text-[11px] sm:text-xs font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>عرض في الأقسام</span>
                  <ArrowLeft className="w-3 h-3" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsHomeSearchResultsDismissed?.(true)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="إغلاق نافذة النتائج"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Popover Content (List of Cards) */}
          {homeSearchResults.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                لم يتم العثور على كتب تطابق {currentSearchValue ? `"${currentSearchValue}"` : 'الفلاتر المحددة'}
              </p>
              <p className="text-xs text-muted-foreground">
                جرّب البحث باسم كتاب أو مؤلف آخر، أو قم بإعادة تعيين فلاتر الأقسام والمؤلفين.
              </p>
            </div>
          ) : (
            <div className="max-h-[55vh] sm:max-h-[460px] overflow-y-auto p-3 sm:p-4 space-y-2.5 custom-scrollbar">
              {homeSearchResults.slice(0, 8).map((book) => (
                <BookCard
                  key={book.id || book.title}
                  book={book}
                  viewMode="list"
                  compact={isCompact}
                  showCategoryBadge={true}
                  onAsk={(b) => onAskBook?.(b)}
                  onRead={(b) => {
                    handleReadBook?.(b);
                  }}
                  onOpenAuthorBio={(b) => setSelectedAuthorBook?.(b)}
                  onOpenBookInfo={(b) => setActiveInfoBook?.(b)}
                  isFavorite={Boolean(favoriteBookIds?.has(book.id))}
                  onToggleFavorite={(b) => toggleFavorite?.(b.id)}
                />
              ))}

              {/* View All Matching Results Footer Button */}
              {homeSearchResults.length > 8 && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onSearchSubmit?.()}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:brightness-110 active:scale-[0.99] ${getPopoverViewAllBtnStyle()}`}
                  >
                    <span>عرض جميع النتائج المطابقة في صفحة الأقسام ({homeSearchResults.length} كتاب)</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchConsole;
