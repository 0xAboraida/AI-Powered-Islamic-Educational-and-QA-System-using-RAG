import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  User, Calendar, Clock, BookCheck, List, LayoutGrid,
  ChevronDown, BookOpen, FileText, ChevronLeft, ArrowRight, ArrowLeft,
  GraduationCap, X, Quote, Sparkles, ChevronUp, Loader2, Search, Layers
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { BookMeta } from '../types/bookTypes';
import BookCard from './BookCard';
import { createTurathSearchRegex, stripTashkeel } from '../utils/arabicText';
import { fetchTurathBookIndexes } from '../../../api/turathApi';

export interface AuthorItem {
  authorName: string;
  deathYear?: number | null;
  century?: number | null;
  centuryName?: string;
  books: BookMeta[];
  sampleBook: BookMeta;
}

export interface CenturyGroup {
  century: number;
  centuryName: string;
  totalBooks: number;
  authors: AuthorItem[];
}

export interface AuthorsViewProps {
  selectedAuthor: string | null;
  setSelectedAuthor: (author: string | null) => void;
  currentAuthorData: AuthorItem | null;
  authorsByCentury: CenturyGroup[];
  liveStats: {
    total_authors: number;
    total_books?: number;
    total_domains?: number;
  };
  availableCenturies: { century: number; name: string }[];
  publishedBooksCount: number;
  renderSearchConsole: (isCompact?: boolean, totalMatchingBooks?: number) => React.ReactNode;
  handleReadBook: (book: BookMeta) => void;
  onAskBook: (book: any) => void;
  setSelectedAuthorBook: (book: BookMeta) => void;
  setActiveInfoBook: (book: BookMeta) => void;
  favoriteBookIds: Set<number | string>;
  toggleFavorite: (id: number | string) => void;
  authorSearch?: string;
  selectedDomain?: string;
  filterAuthor?: string;
  handleSearchChange?: (value: string) => void;
  returnToReaderBook?: BookMeta | null;
  onReturnToReader?: () => void;
}

export function AuthorsView({
  selectedAuthor,
  setSelectedAuthor,
  currentAuthorData,
  authorsByCentury = [],
  liveStats,
  availableCenturies = [],
  publishedBooksCount = 0,
  renderSearchConsole,
  handleReadBook,
  onAskBook,
  setSelectedAuthorBook,
  setActiveInfoBook,
  favoriteBookIds = new Set(),
  toggleFavorite,
  authorSearch = '',
  selectedDomain = 'all',
  filterAuthor = 'all',
  handleSearchChange,
  returnToReaderBook,
  onReturnToReader,
}: AuthorsViewProps) {
  const { accentColor, isDark } = useTheme();

  // Local state for authors view (SUB-VIEW B)
  const [openCentury, setOpenCentury] = useState<number | null>(null);
  const [authorsViewMode, setAuthorsViewMode] = useState<'grid' | 'list'>('list');
  const [visibleAuthorsCount, setVisibleAuthorsCount] = useState<number>(24);
  const [visibleCenturyAuthorsLimit, setVisibleCenturyAuthorsLimit] = useState<number>(24);

  // SUB-VIEW A (Author Profile): View mode, Search, Category filter, and Biography State
  const [authorBooksViewMode, setAuthorBooksViewMode] = useState<'grid' | 'list'>('list');
  const [authorBooksQuery, setAuthorBooksQuery] = useState<string>('');
  const [selectedAuthorCategory, setSelectedAuthorCategory] = useState<string>('all');
  const [visibleAuthorBooksLimit, setVisibleAuthorBooksLimit] = useState<number>(24);
  const [isAuthorCatDropdownOpen, setIsAuthorCatDropdownOpen] = useState<boolean>(false);
  const authorCatDropdownRef = useRef<HTMLDivElement>(null);

  const [bioData, setBioData] = useState<{ id?: number; name?: string; death?: string; biography?: string } | null>(null);
  const [isBioLoading, setIsBioLoading] = useState<boolean>(false);
  const [isBioExpanded, setIsBioExpanded] = useState<boolean>(false);
  const bioCacheRef = useRef<Map<string, { id?: number; name?: string; death?: string; biography?: string }>>(new Map());
  const bioContentRef = useRef<HTMLDivElement>(null);
  const bioCardRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(220);

  useEffect(() => {
    if (bioContentRef.current) {
      setContentHeight(bioContentRef.current.scrollHeight);
    }
  }, [bioData, isBioExpanded]);

  useEffect(() => {
    if (!isAuthorCatDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (authorCatDropdownRef.current && !authorCatDropdownRef.current.contains(e.target as Node)) {
        setIsAuthorCatDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAuthorCatDropdownOpen]);

  const handleToggleBio = () => {
    if (isBioExpanded) {
      bioCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    setIsBioExpanded(prev => !prev);
  };

  // Reset author books query and category filter when changing author
  useEffect(() => {
    setAuthorBooksQuery('');
    setSelectedAuthorCategory('all');
    setIsBioExpanded(false);
    setIsAuthorCatDropdownOpen(false);
    setVisibleAuthorBooksLimit(24);
  }, [selectedAuthor]);

  useEffect(() => {
    setVisibleAuthorBooksLimit(24);
  }, [authorBooksQuery, selectedAuthorCategory]);

  useEffect(() => {
    setVisibleCenturyAuthorsLimit(24);
  }, [openCentury]);

  // Fetch author biography when entering author view
  useEffect(() => {
    if (!selectedAuthor || !currentAuthorData) {
      setBioData(null);
      setIsBioLoading(false);
      setIsBioExpanded(false);
      return;
    }

    let isMounted = true;
    const authorName = currentAuthorData.authorName;

    // 1. Check in-memory cache
    if (bioCacheRef.current.has(authorName)) {
      setBioData(bioCacheRef.current.get(authorName)!);
      setIsBioLoading(false);
      return;
    }

    // 2. Check if sampleBook or books have pre-populated detailed biography
    const sampleBio = currentAuthorData.sampleBook?.authorBioText ||
      currentAuthorData.sampleBook?.author_bio ||
      currentAuthorData.sampleBook?.author_bio_text;
    if (sampleBio && sampleBio.trim().length > 60 && !sampleBio.startsWith('العالم والمصنف')) {
      const entry = {
        name: authorName,
        death: currentAuthorData.deathYear ? String(currentAuthorData.deathYear) : undefined,
        biography: sampleBio
      };
      bioCacheRef.current.set(authorName, entry);
      setBioData(entry);
      setIsBioLoading(false);
      return;
    }

    setIsBioLoading(true);

    const fetchAuthorBio = async () => {
      try {
        const baseUrl = import.meta.env.VITE_DATA_INGESTION_URL || 'https://abourida-zad-tutor-engine-space.hf.space';
        let targetAuthorId = currentAuthorData.sampleBook?.author_id ||
          currentAuthorData.books.find(b => b.author_id)?.author_id;

        // Step 1: If authorId is not known, resolve it instantly from sampleBook indexes via Turath API
        if (!targetAuthorId) {
          const sampleBookId = (currentAuthorData.sampleBook as any)?.turath_id || currentAuthorData.sampleBook?.id;
          if (sampleBookId && Number(sampleBookId) > 0) {
            try {
              const turathData = await fetchTurathBookIndexes(Number(sampleBookId));
              if (turathData?.meta?.author_id) {
                targetAuthorId = turathData.meta.author_id;
              }
            } catch (e) {
              console.warn('Could not resolve author_id from sampleBook:', e);
            }
          }
        }

        // Step 2: Fetch author biography directly from official Turath API
        if (targetAuthorId) {
          try {
            const turathRes = await fetch(`https://api.turath.io/author?id=${targetAuthorId}&ver=3`);
            if (turathRes.ok) {
              const data = await turathRes.json();
              if (data?.biography && data.biography.trim().length > 10) {
                if (isMounted) {
                  const entry = {
                    id: data.id,
                    name: data.name || authorName,
                    death: data.death || (currentAuthorData.deathYear ? String(currentAuthorData.deathYear) : undefined),
                    biography: data.biography
                  };
                  bioCacheRef.current.set(authorName, entry);
                  setBioData(entry);
                  setIsBioLoading(false);
                  return;
                }
              }
            }
          } catch (e) {
            console.warn('Turath author API fetch error:', e);
          }
        }

        // Step 3: Fallback to zad-author-info ingestion endpoint by name
        try {
          const nameRes = await fetch(`${baseUrl}/api/v1/data-ingestion/zad-author-info/${encodeURIComponent(authorName)}?author_name=${encodeURIComponent(authorName)}`);
          if (nameRes.ok) {
            const data = await nameRes.json();
            if (data?.biography && data.biography.trim().length > 10) {
              if (isMounted) {
                const entry = {
                  id: data.id,
                  name: data.name || authorName,
                  death: data.death || (currentAuthorData.deathYear ? String(currentAuthorData.deathYear) : undefined),
                  biography: data.biography
                };
                bioCacheRef.current.set(authorName, entry);
                setBioData(entry);
                setIsBioLoading(false);
                return;
              }
            }
          }
        } catch (e) {
          // continue
        }

        if (isMounted) {
          setBioData(null);
          setIsBioLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setBioData(null);
          setIsBioLoading(false);
        }
      }
    };

    fetchAuthorBio();

    return () => {
      isMounted = false;
    };
  }, [selectedAuthor, currentAuthorData]);

  // Unique domains/categories where this author has published works
  const authorCategories = useMemo(() => {
    if (!currentAuthorData?.books) return [];
    const set = new Set<string>();
    currentAuthorData.books.forEach(b => {
      const c = (b.category || b.cat_name || '').trim();
      if (c && c !== 'عام') set.add(c);
    });
    return Array.from(set);
  }, [currentAuthorData]);

  // Filtered books of the selected author if searching or filtering by category
  const displayedAuthorBooks = useMemo(() => {
    if (!currentAuthorData?.books) return [];
    let list = currentAuthorData.books;
    if (selectedAuthorCategory !== 'all') {
      list = list.filter(b => (b.category || b.cat_name) === selectedAuthorCategory);
    }
    const q = (authorBooksQuery || '').trim();
    if (!q) return list;
    const reg = createTurathSearchRegex(q);
    if (reg) {
      return list.filter(b => b && b.title && reg.test(stripTashkeel(b.title)));
    }
    return list.filter(b => b && b.title && b.title.includes(q));
  }, [currentAuthorData, selectedAuthorCategory, authorBooksQuery]);

  useEffect(() => {
    setVisibleAuthorsCount(36);
  }, [authorSearch, selectedDomain, filterAuthor]);

  const isSearching = Boolean(
    (authorSearch && authorSearch.trim()) ||
    (selectedDomain && selectedDomain !== 'all') ||
    (filterAuthor && filterAuthor !== 'all')
  );

  // Flat matching authors list sorted by Turath relevance
  const matchingAuthorsList = useMemo(() => {
    if (!isSearching) return [];
    const list: AuthorItem[] = [];
    const seen = new Set<string>();
    for (const cGroup of (authorsByCentury || [])) {
      for (const author of (cGroup?.authors || [])) {
        if (author && author.authorName && !seen.has(author.authorName)) {
          seen.add(author.authorName);
          list.push(author);
        }
      }
    }

    const q = (authorSearch || '').trim();
    if (q) {
      list.sort((a, b) => {
        const aName = a?.authorName || '';
        const bName = b?.authorName || '';
        const aExact = aName === q;
        const bExact = bName === q;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        const aStarts = aName.startsWith(q);
        const bStarts = bName.startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        const aCount = a?.books?.length || 0;
        const bCount = b?.books?.length || 0;
        if (bCount !== aCount) {
          return bCount - aCount;
        }

        if (a?.deathYear && b?.deathYear) return a.deathYear - b.deathYear;
        return aName.localeCompare(bName, 'ar');
      });
    }

    return list;
  }, [authorsByCentury, isSearching, authorSearch]);

  const displayedAuthors = matchingAuthorsList.slice(0, visibleAuthorsCount);

  // Theme styling helpers
  const getThemeAccentTextClass = () => {
    switch (accentColor) {
      case 'amber': return 'text-[#8a652a] dark:text-[#eed8ad] font-bold';
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

  const getSearchCapsuleStyle = () => {
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

  const getSearchCircleBtnStyle = () => {
    switch (accentColor) {
      case 'emerald':
        return 'bg-gradient-to-tr from-teal-700 via-teal-500 to-cyan-400 hover:brightness-110 text-white shadow-md shadow-teal-500/40 ring-1 ring-white/30';
      case 'amber':
        return 'bg-gradient-to-tr from-[#8e682d] via-[#c59b58] to-[#eedbb2] hover:brightness-110 text-stone-950 font-black shadow-md shadow-[#dfbf83]/40 ring-1 ring-white/30';
      case 'blue':
        return 'bg-gradient-to-tr from-blue-700 via-blue-500 to-sky-400 hover:brightness-110 text-white shadow-md shadow-blue-500/40 ring-1 ring-white/30';
      case 'purple':
      default:
        return 'bg-gradient-to-tr from-purple-700 via-purple-600 to-fuchsia-500 hover:brightness-110 text-white shadow-md shadow-purple-600/40 ring-1 ring-white/30';
    }
  };

  const getAuthorDropdownActiveStyle = () => {
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

  const renderAuthorCardGrid = (author: AuthorItem) => (
    <div
      key={author.authorName}
      onClick={() => setSelectedAuthor(author.authorName)}
      className={`group rounded-xl border p-3.5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer ${getCategoryCardStyle()}`}
    >
      <div>
        {/* Row 1: Author Icon & Name */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-all shadow-sm bg-blue-500/10 text-blue-600 dark:text-blue-400 dark:bg-blue-500/15">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 transition-colors leading-snug truncate group-hover:text-brand-magenta">
                {author.authorName}
              </h4>
              <div className="flex items-center gap-1.5 flex-wrap">
                {author.deathYear ? (
                  <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400">
                    (توفي: {author.deathYear} هـ)
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground">(معاصر)</span>
                )}
              </div>
            </div>
          </div>

          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 shrink-0">
            {author.books.length} {author.books.length === 1 ? 'كتاب' : 'كتب'}
          </span>
        </div>

        {/* Row 2: Preview of titles */}
        <div className="my-2 space-y-1">
          {author.books.slice(0, 2).map(b => (
            <div key={b.id || b.title} className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
              <BookOpen className="w-3 h-3 text-brand-magenta shrink-0" />
              <span className="truncate">{b.title}</span>
            </div>
          ))}
          {author.books.length > 2 && (
            <div className="text-[11px] text-brand-magenta font-semibold">
              + {author.books.length - 2} مصنفات أخرى
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Action Link */}
      <div className="pt-2.5 mt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-1 text-xs font-bold text-brand-magenta">
        <span>عرض المصنفات</span>
        <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
      </div>
    </div>
  );

  const renderAuthorCardList = (author: AuthorItem) => (
    <div
      key={author.authorName}
      onClick={() => setSelectedAuthor(author.authorName)}
      className={`group rounded-xl border py-2.5 px-3 sm:px-4 shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer ${getCategoryCardStyle()}`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Author Details */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all shadow-sm bg-blue-500/10 text-blue-600 dark:text-blue-400 dark:bg-blue-500/15 group-hover:scale-105">
            <User className="w-4.5 h-4.5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 transition-colors truncate group-hover:text-brand-magenta">
                {author.authorName}
              </h4>
            </div>

            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              {author.deathYear ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shrink-0">
                  <Calendar className="w-2.5 h-2.5" />
                  <span>(توفي: {author.deathYear}هـ)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-white/5 text-muted-foreground border border-slate-200/60 dark:border-white/10 shrink-0">
                  (معاصر)
                </span>
              )}

              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20">
                <BookOpen className="w-2.5 h-2.5" />
                <span>{author.books.length} {author.books.length === 1 ? 'كتاب' : 'كتب'}</span>
              </span>

              {author.books[0] && (
                <span className="text-[11px] text-muted-foreground truncate max-w-[260px] hidden md:inline-flex items-center gap-1 opacity-80">
                  <span>من مؤلفاته:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 truncate">«{author.books[0].title}»</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Left Arrow */}
        <div className="flex items-center shrink-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground group-hover:text-brand-magenta transition-colors">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-300 space-y-6">

      {/* SUB-VIEW A: Single Author Detailed Profile & His Books */}
      {selectedAuthor && currentAuthorData ? (
        <div className="space-y-4">

          {/* Breadcrumbs Navigation & Return to Reading Book Button */}
          <div className="flex items-center justify-between gap-3 flex-wrap py-1 px-1 select-none">
            <nav aria-label="مسار التنقل" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedAuthor(null)}
                className="hover:text-brand-magenta transition-colors flex items-center gap-1 group font-bold text-slate-600 dark:text-slate-300 cursor-pointer shrink-0"
              >
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span className="hidden sm:inline">المؤلفون والقرون</span>
                <span className="sm:hidden">المؤلفون</span>
              </button>

              <ChevronLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-stone-500 dark:text-stone-300" strokeWidth={2.5} />

              {currentAuthorData.centuryName && (
                <>
                  <span className="text-slate-600 dark:text-slate-400 font-medium shrink-0">
                    {currentAuthorData.centuryName}
                  </span>
                  <ChevronLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-stone-500 dark:text-stone-300" strokeWidth={2.5} />
                </>
              )}

              <span className={`font-extrabold truncate max-w-[220px] sm:max-w-[340px] ${getThemeAccentTextClass()}`}>
                {currentAuthorData.authorName}
              </span>
            </nav>

            {returnToReaderBook && onReturnToReader && (
              <button
                type="button"
                onClick={onReturnToReader}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl brand-gradient text-white font-bold text-xs sm:text-sm shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all group cursor-pointer shrink-0 animate-in fade-in active:scale-95"
                title={`العودة لمتابعة قراءة: ${returnToReaderBook.title}`}
              >
                <BookOpen className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">متابعة قراءة:</span>
                <span className="truncate max-w-[140px] sm:max-w-[220px] font-black">{returnToReaderBook.title}</span>
                <ArrowLeft className="w-4 h-4 shrink-0 group-hover:-translate-x-1 transition-transform" />
              </button>
            )}
          </div>

          {/* UNIFIED AUTHOR PROFILE & BIOGRAPHY CARD */}
          <div ref={bioCardRef} className="rounded-3xl border border-brand-magenta/25 dark:border-white/10 bg-gradient-to-br from-brand-magenta/[0.04] via-white to-brand-blue/[0.03] dark:from-[#131726] dark:via-[#121624] dark:to-[#17102b] p-6 sm:p-8 shadow-sm transition-all relative overflow-hidden backdrop-blur-md">

            {/* Ambient background glows */}
            <div className="pointer-events-none absolute -left-16 -top-16 w-48 h-48 rounded-full bg-brand-magenta/10 blur-3xl" />
            <div className="pointer-events-none absolute -right-16 -bottom-16 w-48 h-48 rounded-full bg-brand-blue/10 blur-3xl" />

            {/* TOP: Author Profile with Clean Typography */}
            <div className="relative z-10">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {currentAuthorData.authorName}
                </h2>

                {/* Pure text metadata items - no bulky frames */}
                <div className="mt-3 space-y-1.5 text-xs sm:text-sm text-muted-foreground font-medium">

                  {/* الوفاة والقرن */}
                  {(currentAuthorData.deathYear || currentAuthorData.centuryName) && (
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>
                        {currentAuthorData.centuryName && currentAuthorData.deathYear
                          ? `توفي في ${currentAuthorData.centuryName} (${currentAuthorData.deathYear}هـ)`
                          : currentAuthorData.deathYear
                            ? `توفي سنة ${currentAuthorData.deathYear}هـ`
                            : `من أعلام ${currentAuthorData.centuryName}`}
                      </span>
                    </div>
                  )}

                  {/* عدد الكتب المضافة */}
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <BookOpen className="w-4 h-4 text-brand-magenta shrink-0" />
                    <span>
                      عدد الكتب المضافة للمكتبة حالياً: <strong className="font-extrabold text-foreground">{currentAuthorData.books.length} {currentAuthorData.books.length === 1 ? 'كتاب' : 'كتاب'}</strong>
                    </span>
                  </div>

                  {/* المجالات العلمية التي له فيها مؤلفات */}
                  {authorCategories.length > 0 && (
                    <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                      <Layers className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>المجالات العلمية:</span>
                        <span className="font-bold text-foreground">
                          {authorCategories.slice(0, 6).join(' • ')}
                          {authorCategories.length > 6 && ` (+${authorCategories.length - 6} أخرى)`}
                        </span>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* SUBTLE DIVIDER */}
            <div className="my-6 border-t border-slate-200/60 dark:border-white/10 relative z-10" />

            {/* BOTTOM: Biography Section */}
            <div className="relative z-10">
              <div className="flex items-center gap-2.5 mb-3.5">
                <div className="w-7 h-7 rounded-lg bg-brand-magenta/15 text-brand-magenta flex items-center justify-center shrink-0">
                  <Quote className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  عن {currentAuthorData.authorName}
                </h3>
              </div>

              {isBioLoading ? (
                <div className="py-6 px-4 flex flex-col items-center justify-center gap-2.5 text-center">
                  <Loader2 className="w-7 h-7 text-brand-magenta animate-spin" />
                  <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
                    جاري تحميل سيرة المؤلف من تراث...
                  </p>
                </div>
              ) : bioData?.biography ? (
                <div>
                  <div
                    ref={bioContentRef}
                    style={{
                      maxHeight: isBioExpanded ? `${Math.max(contentHeight + 40, 500)}px` : '190px',
                      maskImage: isBioExpanded
                        ? 'none'
                        : 'linear-gradient(to bottom, rgba(0, 0, 0, 1) 45%, rgba(0, 0, 0, 0) 100%)',
                      WebkitMaskImage: isBioExpanded
                        ? 'none'
                        : 'linear-gradient(to bottom, rgba(0, 0, 0, 1) 45%, rgba(0, 0, 0, 0) 100%)',
                      transition: 'max-height 600ms cubic-bezier(0.4, 0, 0.2, 1), mask-image 400ms ease, -webkit-mask-image 400ms ease',
                    }}
                    className="space-y-4 text-slate-800 dark:text-slate-200 text-base sm:text-lg md:text-[19px] leading-[2.3] font-read text-justify relative overflow-hidden will-change-[max-height]"
                  >
                    {bioData.biography.split('\n\n').filter(p => p.trim()).map((paragraph, idx) => (
                      <p key={idx} className="whitespace-pre-line">
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {/* Expand / Collapse Action with smooth animation */}
                  <div className="mt-3 pt-3 flex items-center justify-start border-t border-slate-200/50 dark:border-white/5">
                    <button
                      type="button"
                      onClick={handleToggleBio}
                      className="group inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-brand-magenta hover:bg-brand-magenta/10 border border-brand-magenta/30 hover:border-brand-magenta transition-all duration-300 active:scale-95 shadow-xs cursor-pointer"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-500 ease-in-out ${isBioExpanded ? 'rotate-180 text-brand-magenta' : 'rotate-0 text-brand-magenta'
                          }`}
                      />
                      <span className="transition-all duration-300">
                        {isBioExpanded ? 'طي السيرة والاكتفاء بالموجز' : 'قراءة الترجمة الكاملة للمؤلف'}
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-xs sm:text-sm text-muted-foreground">
                  لم تتوفر ترجمة مسجلة في فهرس تراث لهذا المؤلف حالياً.
                </div>
              )}
            </div>

          </div>

          {/* UNIFIED AUTHOR'S BOOKS SECTION CARD (Matching the author profile frame style) */}
          <div className="rounded-3xl border border-brand-magenta/25 dark:border-white/10 bg-gradient-to-br from-brand-magenta/[0.04] via-white to-brand-blue/[0.03] dark:from-[#131726] dark:via-[#121624] dark:to-[#17102b] p-6 sm:p-8 shadow-sm transition-all relative overflow-hidden backdrop-blur-md space-y-6">

            {/* Ambient background glows */}
            <div className="pointer-events-none absolute -left-16 -top-16 w-48 h-48 rounded-full bg-brand-magenta/10 blur-3xl" />
            <div className="pointer-events-none absolute -right-16 -bottom-16 w-48 h-48 rounded-full bg-brand-blue/10 blur-3xl" />

            {/* Header: Title, Count Badge, and Layout Toggle */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-brand-magenta/15 text-brand-magenta flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                    مؤلفات {currentAuthorData.authorName}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${accentColor === 'amber'
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                      : accentColor === 'emerald'
                        ? 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20'
                        : accentColor === 'blue'
                          ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20'
                          : 'bg-brand-magenta/10 text-brand-magenta border border-brand-magenta/20'
                    }`}>
                    {displayedAuthorBooks.length === currentAuthorData.books.length
                      ? `${currentAuthorData.books.length} ${currentAuthorData.books.length === 1 ? 'مصنف' : currentAuthorData.books.length === 2 ? 'مصنفان' : currentAuthorData.books.length <= 10 ? 'مصنفات' : 'مصنفاً'}`
                      : `عرض ${displayedAuthorBooks.length} من ${currentAuthorData.books.length}`}
                  </span>
                </div>
              </div>

              {/* View Mode Toggle Buttons (شبكة / قائمة) - مخفي في الهاتف */}
              <div className="hidden md:flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-black/40 p-1 rounded-xl border border-slate-200/60 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setAuthorBooksViewMode('grid')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${authorBooksViewMode === 'grid'
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
                    onClick={() => setAuthorBooksViewMode('list')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${authorBooksViewMode === 'list'
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

            {/* In-Page Author Search Capsule (يظهر فقط إذا كان للمؤلف 3 كتب أو أكثر) */}
            {currentAuthorData.books.length >= 3 && (
              <div className={`relative w-full ${isAuthorCatDropdownOpen ? 'z-50' : 'z-20'}`}>
                <div className={`w-full transition-all duration-300 rounded-full ${getSearchCapsuleStyle()}`}>
                  <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2">

                    {/* Search Icon / Circle Button */}
                    <div
                      className={`rounded-full flex items-center justify-center shadow-md shrink-0 w-8 h-8 sm:w-9 sm:h-9 ${getSearchCircleBtnStyle()}`}
                      title="بحث في كتب المؤلف"
                    >
                      <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>

                    {/* Search Input */}
                    <input
                      type="text"
                      value={authorBooksQuery}
                      onChange={(e) => setAuthorBooksQuery(e.target.value)}
                      placeholder={`ابحث في مصنفات وكتب ${currentAuthorData.authorName}...`}
                      className={`min-w-0 flex-1 bg-transparent outline-none text-xs sm:text-sm py-1 ${authorBooksQuery ? 'font-bold' : 'font-normal'
                        } ${isDark
                          ? 'text-white placeholder:text-slate-400/60'
                          : 'text-stone-900 placeholder:text-stone-400'
                        }`}
                    />

                    {/* Clear Search Button */}
                    {Boolean(authorBooksQuery) && (
                      <button
                        type="button"
                        onClick={() => setAuthorBooksQuery('')}
                        className={`p-1.5 rounded-full transition-colors shrink-0 cursor-pointer ${isDark ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-stone-600 hover:text-stone-900 hover:bg-black/5'
                          }`}
                        title="مسح البحث"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Category Dropdown Filteration */}
                    {authorCategories.length > 0 && (
                      <>
                        <div className={`w-px h-5 sm:h-6 shrink-0 ${isDark ? 'bg-white/20' : 'bg-stone-300/60'}`} />

                        <div className="relative" ref={authorCatDropdownRef}>
                          <button
                            type="button"
                            onClick={() => setIsAuthorCatDropdownOpen(!isAuthorCatDropdownOpen)}
                            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 h-[30px] sm:h-[34px] rounded-full border transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 active:scale-95 ${selectedAuthorCategory !== 'all'
                                ? getAuthorDropdownActiveStyle()
                                : isDark
                                  ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-md'
                                  : 'bg-white/60 hover:bg-white/90 border-slate-200/80 text-stone-800 backdrop-blur-md shadow-2xs'
                              }`}
                            title="تصفية مصنفات المؤلف حسب القسم"
                          >
                            <span className="truncate max-w-[85px] sm:max-w-[130px]">
                              {selectedAuthorCategory === 'all' ? 'كل الأقسام' : selectedAuthorCategory}
                            </span>
                            {selectedAuthorCategory !== 'all' ? (
                              <span
                                role="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAuthorCategory('all');
                                }}
                                className="w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all ml-0.5 cursor-pointer bg-black/10 hover:bg-black/20 dark:bg-white/20 dark:hover:bg-white/30"
                                title="إلغاء تصفية القسم"
                              >
                                <X className="w-2.5 h-2.5" />
                              </span>
                            ) : (
                              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isAuthorCatDropdownOpen ? 'rotate-180' : 'rotate-0 opacity-70'}`} />
                            )}
                          </button>

                          {/* Dropdown Popover */}
                          {isAuthorCatDropdownOpen && (
                            <div className={`absolute top-full left-0 mt-2 w-64 rounded-2xl border transition-all duration-200 z-[100] origin-top-left p-2 shadow-2xl backdrop-blur-2xl ${isDark
                                ? 'bg-[#161226]/95 border-white/15 text-white'
                                : 'bg-white/95 border-slate-200 text-stone-900'
                              }`}>
                              <div className="flex items-center justify-between px-2.5 pb-2 mb-1 border-b border-slate-100 dark:border-white/10 text-xs font-bold text-muted-foreground">
                                <span>أقسام مؤلفات {currentAuthorData.authorName}</span>
                                <span className="text-[10px] font-mono opacity-80">{authorCategories.length} قسم</span>
                              </div>

                              <div className="flex flex-col gap-1 max-h-[260px] overflow-y-auto [&::-webkit-scrollbar]:hidden">
                                {/* Option: All Categories */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedAuthorCategory('all');
                                    setIsAuthorCatDropdownOpen(false);
                                  }}
                                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all text-right cursor-pointer ${selectedAuthorCategory === 'all'
                                      ? getCategoryActiveBadgeStyle()
                                      : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
                                    }`}
                                >
                                  <span>كل الأقسام</span>
                                  <span className={`text-[11px] px-1.5 py-0.2 rounded-md ${selectedAuthorCategory === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-white/10 text-muted-foreground'
                                    }`}>
                                    {currentAuthorData.books.length}
                                  </span>
                                </button>

                                {/* Options: Each category */}
                                {authorCategories.map((cat) => {
                                  const count = currentAuthorData.books.filter(b => (b.category || b.cat_name) === cat).length;
                                  const isSelected = selectedAuthorCategory === cat;
                                  return (
                                    <button
                                      key={cat}
                                      type="button"
                                      onClick={() => {
                                        setSelectedAuthorCategory(cat);
                                        setIsAuthorCatDropdownOpen(false);
                                      }}
                                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all text-right cursor-pointer ${isSelected
                                          ? getCategoryActiveBadgeStyle()
                                          : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
                                        }`}
                                    >
                                      <span className="truncate">{cat}</span>
                                      <span className={`text-[11px] px-1.5 py-0.2 rounded-md ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-white/10 text-muted-foreground'
                                        }`}>
                                        {count}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                  </div>
                </div>
              </div>
            )}

            {/* Author's Books: Grid vs List inside the Frame */}
            <div className="relative z-10">
              {displayedAuthorBooks.length === 0 ? (
                <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-white/40 dark:bg-white/[0.02]">
                  <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    لم يتم العثور على مصنفات مطابقة لبحثك في كتب {currentAuthorData.authorName}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthorBooksQuery('');
                      setSelectedAuthorCategory('all');
                    }}
                    className="mt-3 px-4 py-1.5 rounded-xl text-xs font-bold bg-brand-magenta/10 text-brand-magenta hover:bg-brand-magenta/20 transition-colors"
                  >
                    مسح التصفية وعرض كل الكتب
                  </button>
                </div>
              ) : authorBooksViewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {displayedAuthorBooks.slice(0, visibleAuthorBooksLimit).map((book, bIdx) => (
                    <BookCard
                      key={book.id ? `auth-${book.id}` : `auth-${bIdx}-${book.title}`}
                      book={book}
                      viewMode="grid"
                      onRead={handleReadBook}
                      onAsk={onAskBook}
                      onOpenBookInfo={(b) => setActiveInfoBook(b)}
                      isFavorite={favoriteBookIds.has(book.id) || favoriteBookIds.has(book.title)}
                      onToggleFavorite={() => toggleFavorite(book.id || book.title)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {displayedAuthorBooks.slice(0, visibleAuthorBooksLimit).map((book, bIdx) => (
                    <BookCard
                      key={book.id ? `auth-${book.id}` : `auth-${bIdx}-${book.title}`}
                      book={book}
                      viewMode="list"
                      onRead={handleReadBook}
                      onAsk={onAskBook}
                      onOpenBookInfo={(b) => setActiveInfoBook(b)}
                      isFavorite={favoriteBookIds.has(book.id) || favoriteBookIds.has(book.title)}
                      onToggleFavorite={() => toggleFavorite(book.id || book.title)}
                    />
                  ))}
                </div>
              )}

              {displayedAuthorBooks.length > visibleAuthorBooksLimit && (
                <div className="pt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setVisibleAuthorBooksLimit(prev => prev + 24)}
                    className={`px-6 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-sm cursor-pointer hover:scale-[1.02] active:scale-95 ${getCategoryToggleActiveBtnStyle()}`}
                  >
                    عرض المزيد من مؤلفات {currentAuthorData.authorName} ({displayedAuthorBooks.length - visibleAuthorBooksLimit} كتاب متبقي)
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      ) : (
        /* SUB-VIEW B: Centuries List with Layout Toggle (قائمة vs شبكة) */
        <div className="space-y-6">


          {/* 1. In-Page Search Console */}
          <div id="subpage-main-search-bar" className="max-w-4xl mx-auto w-full">
            {renderSearchConsole && renderSearchConsole(false, isSearching ? matchingAuthorsList.length : undefined)}
          </div>

          {/* 2. Header & Layout Toggle Bar for Authors (يظهر في الشاشات الكبيرة فقط ومخفي في الهاتف) */}
          <div className={`hidden md:flex rounded-2xl border p-2.5 sm:p-3 sm:px-5 items-center justify-between gap-2 sm:gap-3 ${getCategoryCardStyle()}`}>
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
              <User className={`w-4.5 h-4.5 sm:w-5 sm:h-5 shrink-0 transition-colors ${getSectionHeaderIconClass()}`} />
              <h3 className="font-extrabold text-xs sm:text-base text-slate-900 dark:text-slate-100 truncate">
                {isSearching ? (
                  <>
                    نتائج البحث: <span className={getThemeAccentTextClass()}>{matchingAuthorsList.length}</span>
                    <span className="text-[11px] sm:text-xs text-muted-foreground font-normal mr-1">
                      {matchingAuthorsList.length === 1
                        ? 'مؤلف مطابق'
                        : matchingAuthorsList.length === 2
                          ? 'مؤلفان متطابقان'
                          : matchingAuthorsList.length >= 3 && matchingAuthorsList.length <= 10
                            ? 'مؤلفين مطابقين'
                            : 'مؤلفاً مطابقاً'}
                    </span>
                  </>
                ) : (
                  <>أعلام ومؤلفو التراث ({(authorsByCentury || []).reduce((sum, c) => sum + (c?.authors?.length || 0), 0)} عالماً)</>
                )}
              </h3>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground font-semibold hidden sm:inline">
                {isSearching ? 'عرض النتائج:' : 'عرض المؤلفين داخل القرن:'}
              </span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-black/40 p-1 rounded-xl border border-slate-200/60 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setAuthorsViewMode('grid')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${authorsViewMode === 'grid'
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
                  onClick={() => setAuthorsViewMode('list')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${authorsViewMode === 'list'
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

          {/* 3. CONTENT: Either Flat Search Results (خارج الأقسام) OR Centuries Accordion */}
          {isSearching ? (
            <div className="space-y-4">
              {matchingAuthorsList.length > 0 ? (
                <>
                  {authorsViewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                      {displayedAuthors.map(renderAuthorCardGrid)}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {displayedAuthors.map(renderAuthorCardList)}
                    </div>
                  )}

                  {displayedAuthors.length < matchingAuthorsList.length && (
                    <div className="pt-4 flex justify-center">
                      <button
                        type="button"
                        onClick={() => setVisibleAuthorsCount(prev => prev + 24)}
                        className={`px-6 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-sm cursor-pointer hover:scale-[1.02] active:scale-95 ${getCategoryToggleActiveBtnStyle()}`}
                      >
                        عرض المزيد من نتائج المؤلفين (متبقي {matchingAuthorsList.length - displayedAuthors.length} مؤلفاً)
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-12 text-center text-muted-foreground bg-slate-50/50 dark:bg-white/[0.02] rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                  <User className="w-12 h-12 mx-auto mb-3 opacity-30 text-muted-foreground" />
                  <h4 className="font-bold text-base text-slate-800 dark:text-slate-200 mb-1">
                    لم يتم العثور على مؤلفين يطابقون بحثك "{authorSearch}"
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    تأكد من كتابة الاسم بصورة صحيحة أو ابحث بكلمة واحدة من اسم المؤلف
                  </p>
                  {handleSearchChange && (
                    <button
                      type="button"
                      onClick={() => handleSearchChange('')}
                      className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-brand-magenta text-white hover:bg-brand-deep transition-all cursor-pointer"
                    >
                      إعادة ضبط البحث
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* 4. Centuries Accordion List (when not searching) */
            <div className="space-y-2.5">
              {(authorsByCentury || []).map((cGroup, idx) => {
                const isOpen = openCentury === cGroup.century;
                const authorCount = cGroup?.authors?.length || 0;
                const booksCount = (cGroup.authors || []).reduce((sum, a) => sum + (a.books?.length || 0), 0) || cGroup.totalBooks || 0;

                return (
                  <div
                    key={cGroup.century}
                    className={`rounded-xl border overflow-hidden shadow-sm transition-colors duration-200 ${getCategoryAccordionContainerStyle(isOpen)}`}
                  >
                    {/* Century Accordion Header */}
                    <button
                      type="button"
                      onClick={() => {
                        if (isOpen) {
                          setOpenCentury(null);
                        } else {
                          setOpenCentury(cGroup.century);
                          setVisibleCenturyAuthorsLimit(24);
                        }
                      }}
                      className={`w-full py-2.5 sm:py-3 px-3.5 sm:px-4 flex items-center justify-between gap-3 text-right transition-colors cursor-pointer group ${isOpen
                        ? getCategoryAccordionHeaderOpenStyle()
                        : 'hover:bg-slate-50 dark:hover:bg-white/5'
                        }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <span className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 transition-all ${getCategoryNumberBadgeStyle(isOpen)}`}>
                          {idx + 1}
                        </span>

                        <div className="min-w-0">
                          <h3 className="font-bold text-xs sm:text-sm md:text-base text-slate-900 dark:text-slate-100 leading-snug whitespace-nowrap">
                            {cGroup.centuryName}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                        <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-full text-[10px] sm:text-xs font-semibold sm:font-bold transition-colors whitespace-nowrap ${isOpen
                          ? getCategoryActiveBadgeStyle()
                          : 'bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/5 group-hover:border-white/10'
                          }`}>
                          {authorCount} مؤلف
                        </span>

                        <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-full text-[10px] sm:text-xs font-semibold sm:font-bold transition-colors whitespace-nowrap ${isOpen
                          ? getCategoryActiveBadgeStyle()
                          : 'bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/5 group-hover:border-white/10'
                          }`}>
                          {booksCount} كتاب
                        </span>

                        <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-transform duration-300 ${isOpen ? `${getCategoryActiveIconStyle()} rotate-180` : 'bg-slate-100 dark:bg-white/5 text-muted-foreground group-hover:text-foreground'
                          }`}>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </button>

                    {/* Century Body (List or Grid of Authors) */}
                    {isOpen && (
                      <div className="p-3 sm:p-4 bg-slate-50/50 dark:bg-black/30 animate-in fade-in duration-200 border-t border-slate-100 dark:border-white/5">
                        {authorsViewMode === 'grid' ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                            {(cGroup.authors || []).slice(0, visibleCenturyAuthorsLimit).map(renderAuthorCardGrid)}
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {(cGroup.authors || []).slice(0, visibleCenturyAuthorsLimit).map(renderAuthorCardList)}
                          </div>
                        )}

                        {(cGroup.authors || []).length > visibleCenturyAuthorsLimit && (
                          <div className="pt-3 pb-1 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setVisibleCenturyAuthorsLimit(prev => prev + 24);
                              }}
                              className={`px-6 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-sm cursor-pointer hover:scale-[1.02] active:scale-95 ${getCategoryToggleActiveBtnStyle()}`}
                            >
                              عرض المزيد من مؤلفي {cGroup.centuryName} ({(cGroup.authors || []).length - visibleCenturyAuthorsLimit} مؤلف متبقي)
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {(authorsByCentury || []).length === 0 && (
                <div className="p-12 text-center text-muted-foreground">
                  لم يتم العثور على مؤلفين يطابقون بحثك.
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default AuthorsView;

