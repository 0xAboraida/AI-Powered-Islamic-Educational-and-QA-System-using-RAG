import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen, Library, Search, X, Pen, FileText, User, Info,
  ChevronUp, Loader2, Sparkles, LayoutGrid, List, ArrowUpDown,
  Calendar, Layers, Award, BookMarked, Clock, ChevronDown,
  GraduationCap, ChevronLeft, ArrowRight, BookCheck, ArrowLeft,
  Menu, Bookmark, PanelLeftClose, PanelLeftOpen, RotateCcw,
  Heart, Sun, Moon, Hash, Settings, Palette, LogOut,
  Smartphone, Share2, LogIn, ShieldCheck, Download, FileDown
} from 'lucide-react'
import libraryBgLight from '@/assets/images/library background light 5.png'
import libraryBgDark from '@/assets/images/library background dark5.png'
import mobileLibraryBgDark from '@/assets/images/mobile library background dark 1.webp'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { getAvatarUrl } from '../../api/client'
import NotificationBell from '../../components/layout/NotificationBell'
import UserProfileModal from '../profile/UserProfileModal'
import TurathReader from './TurathReader'
import LibrarySidebar, { LibraryCurrentContext } from './components/LibrarySidebar'
import SettingsModal from './components/SettingsModal'
import LibraryHomeView from './components/LibraryHomeView'
import IslamicPattern from './components/IslamicPattern'
import MediaExplanationsView from './components/MediaExplanationsView'
import CurrentCoursesView from './components/CurrentCoursesView'
import UnifiedCatalogView, { CatalogSubTab } from './components/UnifiedCatalogView'
import { BrowseBooksView } from './components/BrowseBooksView'
import LibraryNavbar from './components/LibraryNavbar'
import SearchConsole from './components/SearchConsole'
import BookDetailsModal from './components/BookDetailsModal'
import LibraryHero from './components/LibraryHero'
import { useLibraryData } from './hooks/useLibraryData'
import { INITIAL_SHEIKHS, INITIAL_PLAYLISTS, INITIAL_STANDALONE, INITIAL_COURSES } from './data/mediaData'
import { Sheikh, MediaPlaylist, MediaStandalone, Course } from './types/mediaTypes'
import { fetchTurathBookIndexes } from '../../api/turathApi'
import { BookMeta, LibraryAnalytics, MainTab } from './types/bookTypes'
import {
  hasBookPdf,
  getBookPdfUrl,
  CENTURY_NAMES_MAP,
  lookupAuthorDeathYear,
  normalizeBook,
  inferCenturyAndDeath
} from './utils/turathMeta'
import { normalizeArabicText } from './utils/arabicText'
import { downloadBookFile } from './utils/bookExport'
import { idbGetAllOfflineBookPackages } from '../../utils/indexedDbStorage'

import BookCard from './components/BookCard'
import SkeletonList from './components/BookSkeletons'

// Re-export for complete backwards compatibility across the project
export type { BookMeta, LibraryAnalytics, MainTab }
export {
  BookCard,
  SkeletonList,
  BrowseBooksView,
  SearchConsole,
  hasBookPdf,
  getBookPdfUrl,
  CENTURY_NAMES_MAP,
  lookupAuthorDeathYear,
  normalizeBook,
  inferCenturyAndDeath,
  normalizeArabicText,
  downloadBookFile
}



// -------------------------------------------------------------
// Quick Search Suggestion Tags
// -------------------------------------------------------------
const QUICK_SEARCH_TAGS = [
  'صحيح البخاري',
  'المغني لابن قدامة',
  'شروح الحديث',
  'الفقه الحنبلي',
  'ابن تيمية',
  'العقيدة والتوحيد',
  'النووي',
  'تفسير ابن كثير'
];

// -------------------------------------------------------------
// MAIN KNOWLEDGE BASE COMPONENT
// -------------------------------------------------------------
export default function KnowledgeBase({
  onExit,
  onAskBook,
  onLogin,
  onNavigateGlobal,
  activeTab,
  initialTab = 'home',
  hideCustomHeader = false,
  onTabChange,
  onScrolledPastSearchChange,
}: {
  onExit: () => void
  onAskBook: (book: any) => void
  onLogin?: () => void
  onNavigateGlobal?: (view: any) => void
  activeTab?: MainTab
  initialTab?: MainTab
  hideCustomHeader?: boolean
  onTabChange?: (tab: MainTab) => void
  onScrolledPastSearchChange?: (scrolled: boolean) => void
}) {
  const { theme, toggleTheme, isDark, accentColor, setAccentColor } = useTheme()
  const { isAuthenticated, user, logout } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [isRecentBannerDismissed, setIsRecentBannerDismissed] = useState(false)



  const getSection2ContainerStyle = () => {
    if (isDark) {
      return 'bg-[#0c0e14] border-t border-white/10';
    } else {
      return 'bg-white border-t border-slate-100';
    }
  };

  const getSection2PatternColor = () => {
    if (isDark) {
      switch (accentColor) {
        case 'amber':
          return 'text-[#dfbf83]';
        case 'emerald':
          return 'text-teal-400';
        case 'blue':
          return 'text-blue-400';
        case 'purple':
        default:
          return 'text-purple-400';
      }
    }
    switch (accentColor) {
      case 'amber':
        return 'text-[#b88d46]';
      case 'emerald':
        return 'text-teal-600';
      case 'blue':
        return 'text-blue-600';
      case 'purple':
      default:
        return 'text-purple-600';
    }
  };

  // Settings for Image Opacity & Overlay
  const [lightSettings, setLightSettings] = useState({ imageOpacity: 100, overlayOpacity: 0 });
  const [darkSettings, setDarkSettings] = useState({ imageOpacity: 100, overlayOpacity: 0 });

  // Load settings on mount
  useEffect(() => {
    try {
      const savedLight = localStorage.getItem('zad_bg_light_settings');
      if (savedLight) {
        const parsed = JSON.parse(savedLight);
        setLightSettings(parsed);
      }
      const savedDark = localStorage.getItem('zad_bg_dark_settings');
      if (savedDark) {
        const parsed = JSON.parse(savedDark);
        if (parsed.imageOpacity === 30 || parsed.overlayOpacity === 85) {
          setDarkSettings({ imageOpacity: 100, overlayOpacity: 0 });
          localStorage.setItem('zad_bg_dark_settings', JSON.stringify({ imageOpacity: 100, overlayOpacity: 0 }));
        } else {
          setDarkSettings(parsed);
        }
      }
    } catch (e) { }
  }, []);

  const currentSettings = theme === 'dark' ? darkSettings : lightSettings;

  const updateSettings = (imageOpacity: number, overlayOpacity: number) => {
    if (theme === 'dark') {
      const newSettings = { imageOpacity, overlayOpacity };
      setDarkSettings(newSettings);
      localStorage.setItem('zad_bg_dark_settings', JSON.stringify(newSettings));
    } else {
      const newSettings = { imageOpacity, overlayOpacity };
      setLightSettings(newSettings);
      localStorage.setItem('zad_bg_light_settings', JSON.stringify(newSettings));
    }
  };

  // Controlled tab from App.tsx, with fallback to internal state
  const VALID_MAIN_TABS: MainTab[] = ['home', 'categories', 'authors', 'narrators', 'featured', 'media', 'courses', 'favorites', 'downloads'];
  const sanitizeTab = (t: any): MainTab => (typeof t === 'string' && VALID_MAIN_TABS.includes(t as MainTab) ? (t as MainTab) : 'home');

  const [internalTab, setInternalTab] = useState<MainTab>(() => sanitizeTab(activeTab || initialTab));
  const activeMainTab = sanitizeTab(activeTab !== undefined ? activeTab : internalTab);

  const onTabChangeRef = useRef(onTabChange);
  useEffect(() => {
    onTabChangeRef.current = onTabChange;
  }, [onTabChange]);

  const onScrolledPastSearchChangeRef = useRef(onScrolledPastSearchChange);
  useEffect(() => {
    onScrolledPastSearchChangeRef.current = onScrolledPastSearchChange;
  }, [onScrolledPastSearchChange]);

  const activeMainTabRef = useRef(activeMainTab);
  useEffect(() => {
    activeMainTabRef.current = activeMainTab;
  }, [activeMainTab]);

  // Scroll Listener for Navbar Activation across all library views (يظهر فقط عند اختفاء شريط البحث تماماً من الشاشة)
  const [isScrolledPastSearch, setIsScrolledPastSearch] = useState(activeMainTab !== 'home');
  const isScrolledRef = useRef(activeMainTab !== 'home');
  const lastScrollYRef = useRef(0);
  const lastNotifiedScrolledRef = useRef(activeMainTab !== 'home');

  const prevActiveTabRef = useRef(activeMainTab);

  const setActiveMainTab = useCallback((tabOrFn: MainTab | ((prev: MainTab) => MainTab)) => {
    const rawNext = typeof tabOrFn === 'function' ? tabOrFn(activeMainTabRef.current) : tabOrFn;
    const nextTab = sanitizeTab(rawNext);
    prevActiveTabRef.current = nextTab;
    setInternalTab(nextTab);
    onTabChangeRef.current?.(nextTab);
    setView('search');
    if (nextTab !== 'authors') {
      setSelectedAuthor(null);
    }
    if (nextTab !== 'narrators') {
      setSelectedNarrator(null);
    }
    if (nextTab === 'home') {
      lastScrollYRef.current = 0;
      isScrolledRef.current = false;
      setIsScrolledPastSearch(false);
      lastNotifiedScrolledRef.current = false;
      onScrolledPastSearchChangeRef.current?.(false);
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else {
      isScrolledRef.current = true;
      setIsScrolledPastSearch(true);
      lastNotifiedScrolledRef.current = true;
      onScrolledPastSearchChangeRef.current?.(true);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, []);

  // Synchronize internal state when activeTab or initialTab changes from parent
  useEffect(() => {
    const rawIncoming = activeTab !== undefined ? activeTab : initialTab;
    const incomingTab = sanitizeTab(rawIncoming);
    if (incomingTab && incomingTab !== prevActiveTabRef.current) {
      prevActiveTabRef.current = incomingTab;
      setInternalTab(incomingTab);
      setView('search');
      if (incomingTab !== 'authors') {
        setSelectedAuthor(null);
      }
      if (incomingTab !== 'narrators') {
        setSelectedNarrator(null);
      }
      if (incomingTab === 'home') {
        lastScrollYRef.current = 0;
        isScrolledRef.current = false;
        setIsScrolledPastSearch(false);
        lastNotifiedScrolledRef.current = false;
        onScrolledPastSearchChangeRef.current?.(false);
      } else {
        isScrolledRef.current = true;
        setIsScrolledPastSearch(true);
        lastNotifiedScrolledRef.current = true;
        onScrolledPastSearchChangeRef.current?.(true);
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    }
  }, [activeTab, initialTab]);

  useEffect(() => {
    isScrolledRef.current = isScrolledPastSearch;
    if (lastNotifiedScrolledRef.current !== isScrolledPastSearch) {
      lastNotifiedScrolledRef.current = isScrolledPastSearch;
      onScrolledPastSearchChangeRef.current?.(isScrolledPastSearch);
    }
  }, [isScrolledPastSearch]);

  const handleGoToLibraryHome = useCallback(() => {
    setActiveMainTab('home');
  }, [setActiveMainTab]);

  useEffect(() => {
    if (activeMainTab !== 'home') {
      setIsScrolledPastSearch(true);
      isScrolledRef.current = true;
      return;
    }

    const initialScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    lastScrollYRef.current = initialScrollY;
    if (initialScrollY < 120) {
      setIsScrolledPastSearch(false);
      isScrolledRef.current = false;
    }

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (activeMainTabRef.current !== 'home') {
            if (!isScrolledRef.current) {
              setIsScrolledPastSearch(true);
              isScrolledRef.current = true;
            }
            ticking = false;
            return;
          }

          const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
          const isScrollingUp = scrollY < lastScrollYRef.current;
          lastScrollYRef.current = scrollY;

          // إذا كان المستخدم قريباً جداً من قمة الصفحة
          if (scrollY < 120) {
            if (isScrolledRef.current) {
              setIsScrolledPastSearch(false);
              isScrolledRef.current = false;
            }
            ticking = false;
            return;
          }

            const searchEl = document.getElementById('hero-main-search-bar');
            if (searchEl) {
              const rect = searchEl.getBoundingClientRect();
              if (rect.height > 0 && rect.width > 0) {
                if (isScrollingUp) {
                  // أثناء الصعود لأعلى: أول ما يقترب شريط البحث في الواجهة من الظهور (على بُعد 25px أو أقل من الحافة العلوية)، يختفي النافبار الثاني فوراً
                  if (rect.bottom >= -25) {
                    if (isScrolledRef.current) {
                      setIsScrolledPastSearch(false);
                      isScrolledRef.current = false;
                    }
                  }
                } else {
                  // أثناء النزول لأسفل: يظهر النافبار الثاني بمجرد اختفاء شريط البحث الرئيسي تماماً من الشاشة
                  if (rect.bottom <= 0 && scrollY > 150) {
                    if (!isScrolledRef.current) {
                      setIsScrolledPastSearch(true);
                      isScrolledRef.current = true;
                    }
                  }
                }
              } else {
                if (isScrollingUp && scrollY < 320) {
                  if (isScrolledRef.current) {
                    setIsScrolledPastSearch(false);
                    isScrolledRef.current = false;
                  }
                } else if (!isScrollingUp && scrollY > 380) {
                  if (!isScrolledRef.current) {
                    setIsScrolledPastSearch(true);
                    isScrolledRef.current = true;
                  }
                }
              }
            } else {
              if (isScrollingUp && scrollY < 320) {
                if (isScrolledRef.current) {
                  setIsScrolledPastSearch(false);
                  isScrolledRef.current = false;
                }
              } else if (!isScrollingUp && scrollY > 380) {
                if (!isScrolledRef.current) {
                  setIsScrolledPastSearch(true);
                  isScrolledRef.current = true;
                }
              }
            }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [activeMainTab]);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>(() => {
    try {
      const saved = localStorage.getItem('zad_font_size');
      if (saved === 'large') {
        localStorage.setItem('zad_font_size', 'medium');
        return 'medium';
      }
      if (saved === 'small' || saved === 'medium') return saved;
    } catch (e) { }
    return 'medium';
  });

  useEffect(() => {
    localStorage.setItem('zad_font_size', fontSize);
  }, [fontSize]);

  // Favorites State (المفضلة)
  const [favoriteBookIds, setFavoriteBookIds] = useState<Set<string | number>>(() => {
    try {
      const saved = localStorage.getItem('zad_favorite_books');
      if (saved) return new Set(JSON.parse(saved));
    } catch (e) { }
    return new Set();
  });

  const toggleFavorite = (bookId: string | number) => {
    setFavoriteBookIds(prev => {
      const next = new Set(prev);
      if (next.has(bookId)) {
        next.delete(bookId);
      } else {
        next.add(bookId);
      }
      try {
        localStorage.setItem('zad_favorite_books', JSON.stringify(Array.from(next)));
      } catch (e) { }
      return next;
    });
  };

  // Media & Courses Data (مهيأة ومجهزة للربط بـ MongoDB)
  const [sheikhs] = useState<Sheikh[]>(INITIAL_SHEIKHS);
  const [playlists] = useState<MediaPlaylist[]>(INITIAL_PLAYLISTS);
  const [standaloneItems] = useState<MediaStandalone[]>(INITIAL_STANDALONE);
  const [courses] = useState<Course[]>(INITIAL_COURSES);

  // Tab 1 (المختارة) Filter States
  const [query, setQuery] = useState('')
  const [selectedDomain, setSelectedDomain] = useState<string>('all')
  const [filterAuthor, setFilterAuthor] = useState<string>('all')
  const [selectedCentury, setSelectedCentury] = useState<string>('all')
  const [sortAsc, setSortAsc] = useState<boolean>(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [visibleBrowseBooksLimit, setVisibleBrowseBooksLimit] = useState<number>(36)

  // Reset Tab 1 pagination when filters or sort change
  useEffect(() => {
    setVisibleBrowseBooksLimit(36);
  }, [query, selectedDomain, filterAuthor, selectedCentury, sortAsc, activeMainTab]);

  // Tab 2 (الأقسام) & Tab 3 (المؤلفون) Search & Selection State
  const [categorySearch, setCategorySearch] = useState<string>('')
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null)
  const [authorSearch, setAuthorSearch] = useState<string>('')

  // Immediate input state for instant 0ms typing response without UI freeze
  const [searchInput, setSearchInput] = useState<string>('');

  // Sync searchInput when categorySearch or tab changes externally
  useEffect(() => {
    const activeVal = activeMainTab === 'categories' ? categorySearch : activeMainTab === 'authors' ? authorSearch : query;
    if (activeVal !== searchInput && !searchInput) {
      setSearchInput(activeVal);
    }
  }, [categorySearch, authorSearch, query, activeMainTab]);

  // Debounced search trigger to prevent freezing while typing fast in categories/authors view
  useEffect(() => {
    if (activeMainTab === 'home') {
      // On the home tab, typing directly drives the instant in-memory popover in 0ms
      // without locking the CPU by re-grouping categories or author trees!
      return;
    }
    const timer = setTimeout(() => {
      setCategorySearch(searchInput);
      setAuthorSearch(searchInput);
      setQuery(searchInput);
    }, 150);

    return () => clearTimeout(timer);
  }, [searchInput, activeMainTab]);

  const currentSearchValue = searchInput;
  const [isHomeSearchResultsDismissed, setIsHomeSearchResultsDismissed] = useState(false);

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    setIsHomeSearchResultsDismissed(false);
    if (!val) {
      // Instant clear when emptied
      setCategorySearch('');
      setAuthorSearch('');
      setQuery('');
    }
  };

  const handleSearchSubmit = () => {
    setCategorySearch(searchInput);
    setAuthorSearch(searchInput);
    setQuery(searchInput);
    if (activeMainTab === 'home') {
      window.scrollTo({ top: 0, behavior: 'instant' });
      setActiveMainTab('categories');
    }
  };

  // Book Info Floating Modal State
  const [activeInfoBook, setActiveInfoBook] = useState<BookMeta | null>(null)
  const [modalInfoText, setModalInfoText] = useState<string | null>(null)
  const [modalInfoLongText, setModalInfoLongText] = useState<string | null>(null)
  const [loadingInfo, setLoadingInfo] = useState(false)
  const [bookDetailsCache, setBookDetailsCache] = useState<Record<string, { info: string; infoLong?: string | null }>>({})
  const [returnToReaderBook, setReturnToReaderBook] = useState<BookMeta | null>(null)
  const [downloadsCount, setDownloadsCount] = useState<number>(0)

  // Track offline downloaded books count and reactively update
  useEffect(() => {
    let isMounted = true
    const fetchDownloads = async () => {
      try {
        const pkgs = await idbGetAllOfflineBookPackages()
        if (isMounted) setDownloadsCount(pkgs.length)
      } catch {
        // ignore
      }
    }
    fetchDownloads()
    window.addEventListener('zad-offline-books-changed', fetchDownloads)
    return () => {
      isMounted = false
      window.removeEventListener('zad-offline-books-changed', fetchDownloads)
    }
  }, [])

  // Library Data Hook (إدارة البيانات، التخزين المؤقت، والتصفية فائقة السرعة)
  const {
    publishedBooks,
    loading,
    liveStats,
    availableDomains,
    availableAuthors,
    availableCenturies,
    filteredAndSortedBooks,
    booksByCategory,
    authorsByCentury,
    currentAuthorData,
    homeSearchResults,
    favoriteBooksList,
    featuredBookIds,
    getBaseUrl,
  } = useLibraryData({
    query,
    selectedDomain,
    filterAuthor,
    selectedCentury,
    sortAsc,
    activeMainTab,
    categorySearch,
    authorSearch,
    currentSearchValue,
    selectedAuthor,
    favoriteBookIds,
  });

  // Cache for fetched book details to provide instant opening on subsequent clicks

  // Helper to verify if text is genuine printed book metadata rather than a generic auto-generated fallback
  const isRealBookInfo = (text?: string | null) => {
    if (!text) return false;
    const trimmed = text.trim();
    if (/^كتاب\s+.+\s+في\s+.+\s+للمؤلف\s+.+$/s.test(trimmed)) return false;
    return trimmed.includes('\n') || trimmed.includes('الكتاب:') || trimmed.includes('الناشر:') || trimmed.includes('المحقق:') || trimmed.includes('الطبعة:');
  };

  // Fetch book info for floating modal when activeInfoBook changes
  useEffect(() => {
    if (!activeInfoBook) {
      setModalInfoText(null);
      setModalInfoLongText(null);
      return;
    }

    const bookId = activeInfoBook.id;

    // 1. Check memory cache first (instant response)
    if (bookId && bookDetailsCache[bookId]) {
      const cached = bookDetailsCache[bookId];
      setModalInfoText(cached.info);
      setModalInfoLongText(cached.infoLong || null);
      return;
    }

    // 2. Check if the book object itself has genuine metadata (not the auto-generated single-line fallback)
    const existing = activeInfoBook.info || activeInfoBook.infoText;
    if (isRealBookInfo(existing)) {
      setModalInfoText(existing!);
      setModalInfoLongText(null);
      if (bookId) {
        setBookDetailsCache(prev => ({ ...prev, [bookId]: { info: existing!, infoLong: null } }));
      }
      return;
    }

    // 3. Fetch book info directly from official Turath API (Primary: Instant without Ingestion)
    const fetchInfo = async () => {
      setLoadingInfo(true);
      setModalInfoText(null);
      setModalInfoLongText(null);
      try {
        if (bookId) {
          // 1. Primary: Direct fetch from Turath public API (returns both info and info_long)
          try {
            const turathData = await fetchTurathBookIndexes(Number(bookId));
            const infoStr = (turathData?.meta?.info || (turathData as any)?.info)?.trim();
            const infoLongStr = (turathData?.meta?.info_long || (turathData as any)?.info_long)?.trim() || null;
            if ((infoStr && infoStr.length > 5) || (infoLongStr && infoLongStr.length > 5)) {
              setModalInfoText(infoStr || '');
              setModalInfoLongText(infoLongStr);
              setBookDetailsCache(prev => ({ ...prev, [bookId]: { info: infoStr || '', infoLong: infoLongStr } }));
              return;
            }
          } catch (e) {
            console.warn('Error fetching directly from Turath API:', e);
          }

          // 2. Secondary fallback: Local or remote Ingestion backend if available
          try {
            const baseUrl = getBaseUrl();
            const res = await fetch(`${baseUrl}/api/v1/data-ingestion/zad-book-info/${bookId}`);
            if (res.ok) {
              const data = await res.json();
              const infoStr = (data?.meta?.info || data?.info)?.trim();
              const infoLongStr = (data?.meta?.info_long || data?.info_long)?.trim() || null;
              if ((infoStr && infoStr.length > 5) || (infoLongStr && infoLongStr.length > 5)) {
                setModalInfoText(infoStr || '');
                setModalInfoLongText(infoLongStr);
                setBookDetailsCache(prev => ({ ...prev, [bookId]: { info: infoStr || '', infoLong: infoLongStr } }));
                return;
              }
            }
          } catch (e) {
            console.warn('Ingestion fallback not responding:', e);
          }
        }

        setModalInfoText('لم تتوفر تفاصيل إضافية لهذا الكتاب حالياً.');
      } catch (err) {
        setModalInfoText('حدث خطأ أثناء محاولة جلب المعلومات.');
      } finally {
        setLoadingInfo(false);
      }
    };

    fetchInfo();
  }, [activeInfoBook, getBaseUrl, bookDetailsCache]);

  // Handler to open linked book from explanation or course
  const handleOpenLinkedBook = (bookTitle: string) => {
    const clean = bookTitle.trim().toLowerCase();
    const found = publishedBooks.find(b =>
      b.title.toLowerCase().includes(clean) || clean.includes(b.title.toLowerCase())
    );
    if (found) {
      handleReadBook(found);
    } else {
      setActiveMainTab('categories');
      setCategorySearch(bookTitle);
    }
  };

  // View State (Reader vs Browser)
  const [view, setView] = useState<'search' | 'reader'>('search');
  const [selectedBook, setSelectedBook] = useState<BookMeta | null>(null);

  // Navigate to official Author profile page
  const handleOpenAuthorProfile = (book: BookMeta) => {
    const author = book.author?.trim();
    if (author && author !== 'من غير معروف') {
      window.scrollTo({ top: 0, behavior: 'instant' });
      setSelectedAuthor(author);
      setActiveMainTab('authors');
    }
  };

  // Collapsible Sidebar & Recent Book State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedNarrator, setSelectedNarrator] = useState<any | null>(null);
  const [readerActiveTheme, setReaderActiveTheme] = useState<'light' | 'dark' | 'sepia' | null>(null);
  const [recentBook, setRecentBook] = useState<BookMeta | null>(() => {
    try {
      const saved = localStorage.getItem('zad_recent_read_book');
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    return null;
  });

  useEffect(() => {
    if (view === 'search') {
      try {
        const saved = localStorage.getItem('zad_recent_read_book');
        if (saved) {
          setRecentBook(JSON.parse(saved));
        }
      } catch (e) { }
    }
  }, [view]);

  const currentLocationContext = useMemo<LibraryCurrentContext | null>(() => {
    if (view === 'reader' && selectedBook) {
      return {
        type: 'reader',
        category: selectedBook.category || selectedBook.cat_name || 'الفقه الحنبلي',
        bookTitle: selectedBook.title,
        authorName: selectedBook.author || selectedBook.author_name,
      };
    }
    if (activeMainTab === 'authors' && selectedAuthor) {
      return {
        type: 'author',
        authorName: selectedAuthor,
      };
    }
    if (activeMainTab === 'narrators' && selectedNarrator) {
      return {
        type: 'narrator',
        narratorName: selectedNarrator.name || selectedNarrator.label,
      };
    }
    if (activeMainTab === 'categories' && selectedDomain && selectedDomain !== 'all') {
      return {
        type: 'category',
        category: selectedDomain,
      };
    }
    return null;
  }, [view, selectedBook, activeMainTab, selectedAuthor, selectedNarrator, selectedDomain]);

  const handleReadBook = (book: BookMeta, page?: number) => {
    const bookWithPage = page && page > 0 ? { ...book, savedPage: page } : book;
    setSelectedBook(bookWithPage);
    setRecentBook(bookWithPage);
    try {
      localStorage.setItem('zad_recent_read_book', JSON.stringify(bookWithPage));
    } catch (e) { }
    setIsHomeSearchResultsDismissed(true);
    window.scrollTo({ top: 0, behavior: 'instant' });
    setView('reader');
  };

  useEffect(() => {
    const handleOpenRecent = (e: any) => {
      const book = e.detail || recentBook;
      if (book) {
        handleReadBook(book, book.savedPage);
      }
    };
    window.addEventListener('open_zad_recent_book', handleOpenRecent);
    return () => window.removeEventListener('open_zad_recent_book', handleOpenRecent);
  }, [recentBook]);

  if (view === 'reader' && selectedBook) {
    return (
      <>
        <TurathReader
          book={selectedBook}
          onClose={() => setView('search')}
          onAskBook={onAskBook}
          globalFontSize={fontSize}
          onReaderThemeChange={(t) => setReaderActiveTheme(t)}
          onSelectAuthor={(authorName) => {
            setReturnToReaderBook(selectedBook);
            setView('search');
            setActiveMainTab('authors');
            setSelectedAuthor(authorName);
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />
        <LibrarySidebar
          isOpen={isSidebarOpen}
          theme={readerActiveTheme || theme}
          activeMainTab="categories"
          currentContext={currentLocationContext}
          counts={{
            domains: availableDomains.length,
            authors: liveStats.total_authors,
            narrators: '18.9K',
            featured: featuredBookIds.size > 0 ? publishedBooks.filter(b => featuredBookIds.has(b.id) || featuredBookIds.has(b.title)).length : 0,
            favorites: favoriteBooksList.length,
            downloads: downloadsCount,
          }}
          recentBook={recentBook}
          onClose={() => setIsSidebarOpen(false)}
          onNavigateGlobal={onNavigateGlobal}
          onExit={onExit}
          onLogin={onLogin}
          onSelectTab={(tab) => {
            setIsSidebarOpen(false);
            setView('search');
            setSelectedAuthor(null);
            setSelectedNarrator(null);
            if (tab === 'home') {
              handleGoToLibraryHome();
            } else {
              window.scrollTo({ top: 0, behavior: 'instant' });
              setActiveMainTab(tab);
              setIsScrolledPastSearch(true);
              onScrolledPastSearchChange?.(true);
            }
          }}
          onReadRecentBook={(book) => {
            setIsSidebarOpen(false);
            handleReadBook(book);
          }}
          onSelectCategory={(category) => {
            setIsSidebarOpen(false);
            setView('search');
            setActiveMainTab('categories');
            setSelectedDomain(category);
            setSelectedAuthor(null);
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
          onSelectAuthor={(author) => {
            setIsSidebarOpen(false);
            setView('search');
            setActiveMainTab('authors');
            setSelectedAuthor(author);
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
          selectedCentury={selectedCentury}
          onChangeCentury={(c) => setSelectedCentury(c)}
          availableCenturies={availableCenturies}
          sortAsc={sortAsc}
          onToggleSort={() => setSortAsc(!sortAsc)}
          onOpenSettings={() => {
            setIsSidebarOpen(false);
            setIsSettingsModalOpen(true);
          }}
        />
      </>
    );
  }

  // Render Search Console (Used in Navbar for non-home tabs and in Hero for home tab)
  const renderSearchConsole = (isCompact: boolean = false) => {
    return (
      <SearchConsole
        isCompact={isCompact}
        isScrolledPastSearch={isScrolledPastSearch}
        currentSearchValue={currentSearchValue}
        handleSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        selectedDomain={selectedDomain}
        setSelectedDomain={setSelectedDomain}
        availableDomains={availableDomains}
        filterAuthor={filterAuthor}
        setFilterAuthor={setFilterAuthor}
        availableAuthors={availableAuthors}
        publishedBooksCount={publishedBooks.length}
        activeMainTab={activeMainTab}
        homeSearchResults={homeSearchResults}
        isHomeSearchResultsDismissed={isHomeSearchResultsDismissed}
        setIsHomeSearchResultsDismissed={setIsHomeSearchResultsDismissed}
        favoriteBookIds={favoriteBookIds}
        toggleFavorite={toggleFavorite}
        handleReadBook={handleReadBook}
        onAskBook={onAskBook}
        setSelectedAuthorBook={handleOpenAuthorProfile}
        setActiveInfoBook={setActiveInfoBook}
      />
    );
  };

  const getRootBgStyle = () => {
    if (isDark) {
      return 'bg-[#090b10] text-slate-100';
    }
    switch (accentColor) {
      case 'amber':
        return 'bg-[#faf7f0] text-stone-900';
      case 'emerald':
        return 'bg-[#f0fdfa] text-slate-900';
      case 'blue':
        return 'bg-[#f0f7ff] text-slate-900';
      case 'purple':
      default:
        return 'bg-[#faf8fd] text-slate-900';
    }
  };

  return (
    <div dir="rtl" className={`relative min-h-screen font-sans transition-colors duration-300 ${isDark ? 'dark' : ''} ${getRootBgStyle()}`}>

      <div className="flex min-h-screen relative z-10 overflow-x-clip">

        {/* ============================================================= */}
        {/* FLOATING DRAWER SIDEBAR (القائمة الجانبية كطبقة طافية)         */}
        {/* ============================================================= */}
        <LibrarySidebar
          isOpen={isSidebarOpen}
          theme={theme}
          activeMainTab={activeMainTab}
          currentContext={currentLocationContext}
          counts={{
            domains: availableDomains.length,
            authors: liveStats.total_authors,
            narrators: '18.9K',
            featured: featuredBookIds.size > 0 ? publishedBooks.filter(b => featuredBookIds.has(b.id) || featuredBookIds.has(b.title)).length : 0,
            favorites: favoriteBooksList.length,
            downloads: downloadsCount,
          }}
          recentBook={recentBook}
          onClose={() => setIsSidebarOpen(false)}
          onNavigateGlobal={onNavigateGlobal}
          onExit={onExit}
          onLogin={onLogin}
          onSelectTab={(tab) => {
            setIsSidebarOpen(false);
            setView('search');
            setSelectedAuthor(null);
            setSelectedNarrator(null);
            if (tab === 'home') {
              handleGoToLibraryHome();
            } else {
              window.scrollTo({ top: 0, behavior: 'instant' });
              setActiveMainTab(tab);
              setIsScrolledPastSearch(true);
              onScrolledPastSearchChange?.(true);
            }
          }}
          onReadRecentBook={handleReadBook}
          onSelectCategory={(category) => {
            setIsSidebarOpen(false);
            setActiveMainTab('categories');
            setSelectedDomain(category);
            setSelectedAuthor(null);
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
          onSelectAuthor={(author) => {
            setIsSidebarOpen(false);
            setActiveMainTab('authors');
            setSelectedAuthor(author);
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
          selectedCentury={selectedCentury}
          onChangeCentury={(c) => setSelectedCentury(c)}
          availableCenturies={availableCenturies}
          sortAsc={sortAsc}
          onToggleSort={() => setSortAsc(!sortAsc)}
          onOpenSettings={() => {
            setIsSidebarOpen(false);
            setIsSettingsModalOpen(true);
          }}
        />

        {/* ============================================================= */}
        {/* MAIN WORKSPACE AREA (مساحة التصفح والعرض الرئيسية)            */}
        {/* ============================================================= */}
        <main className="flex-1 min-w-0 flex flex-col min-h-screen">

          {/* ============================================================= */}
          {/* SECTION 1: TOP HERO (القسم الأول: النافبار + الهيدر + صورة الغروب - شاشة كاملة 100vh) */}
          {/* ============================================================= */}
          <div className={`relative z-30 w-full ${isDark ? 'bg-[#0c0e14]' : 'bg-[#fbfbfb]'} ${activeMainTab === 'home'
            ? 'min-h-[100svh] md:min-h-screen flex flex-col justify-between'
            : ''
            }`}>
            {/* Sunset Mosque Background - STRICTLY LIMITED TO SECTION 1 ON 'home' */}
            {activeMainTab === 'home' && (
              <div className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${isDark ? 'bg-[#0c0e14]' : 'bg-[#fbfbfb]'}`}>
                {/* Desktop Background (>= md) */}
                <img
                  src={theme === 'dark' ? libraryBgDark : libraryBgLight}
                  alt="خلفية المكتبة"
                  aria-hidden
                  className="hidden md:block h-full w-full object-cover object-center transition-all duration-500"
                  style={{
                    opacity: currentSettings.imageOpacity / 100
                  }}
                />
                {/* Mobile Background (< md) */}
                <img
                  src={theme === 'dark' ? mobileLibraryBgDark : libraryBgLight}
                  alt="خلفية المكتبة"
                  aria-hidden
                  className="block md:hidden h-full w-full object-cover object-bottom transition-all duration-500"
                  style={{
                    opacity: currentSettings.imageOpacity / 100
                  }}
                />
                {currentSettings.overlayOpacity > 0 && (
                  <div
                    className="absolute inset-0 bg-black/20 transition-opacity duration-500"
                    style={{ opacity: currentSettings.overlayOpacity / 100 }}
                  />
                )}
              </div>
            )}

            {/* ============================================================= */}
            {/* STICKY TOP NAVBAR (يظهر عند التمرير واختفاء السيرش بار أو في الصفحات الفرعية) */}
            {/* ============================================================= */}
            <LibraryNavbar
              isScrolledPastSearch={isScrolledPastSearch}
              activeMainTab={activeMainTab}
              setActiveMainTab={setActiveMainTab}
              onExit={onExit}
              onNavigateGlobal={onNavigateGlobal}
              onScrolledPastSearchChange={onScrolledPastSearchChange}
              setIsScrolledPastSearch={setIsScrolledPastSearch}
              handleGoToLibraryHome={handleGoToLibraryHome}
              setIsSidebarOpen={setIsSidebarOpen}
              onLogin={onLogin}
              setShowProfileModal={setShowProfileModal}
              setSelectedAuthor={setSelectedAuthor}
              renderSearchConsole={renderSearchConsole}
              categoriesCount={booksByCategory.length}
              authorsCount={liveStats.total_authors}
              favoritesCount={favoriteBooksList.length}
              downloadsCount={downloadsCount}
            />

            {/* HOME HERO SECTION */}
            {activeMainTab === 'home' && (
              <LibraryHero
                accentColor={accentColor}
                isDark={isDark}
                renderSearchConsole={renderSearchConsole}
                recentBook={recentBook}
                isRecentBannerDismissed={isRecentBannerDismissed}
                setIsRecentBannerDismissed={setIsRecentBannerDismissed}
                handleReadBook={handleReadBook}
                onScrollToDomains={() => {
                  const el = document.getElementById('library-domains-section');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                onBrowseLibrary={() => {
                  window.scrollTo({ top: 0, behavior: 'instant' });
                  setActiveMainTab('categories');
                }}
              />
            )}
          </div>

          {/* ============================================================= */}
          {/* SECTION 2: WORKSPACE & ISLAMIC PATTERN (القسم الثاني: الزخرفة)  */}
          {/* ============================================================= */}
          <div className={`relative z-10 flex-1 w-full overflow-hidden transition-colors duration-300 ${getSection2ContainerStyle()}`}>
            {/* الزخرفة الإسلامية الهندسية تغطي كامل خلفية القسم الثاني وتتلون حسب السمة */}
            <IslamicPattern
              isFixed={true}
              opacity={isDark ? 0.07 : 0.08}
              className={`${getSection2PatternColor()} pointer-events-none transition-colors duration-300`}
            />

            <div className={`relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 ${activeMainTab === 'home'
              ? ''
              : ['categories', 'authors', 'narrators', 'favorites', 'downloads'].includes(activeMainTab)
                ? 'pt-[134px] sm:pt-36 lg:pt-40'
                : 'pt-24 sm:pt-28 lg:pt-32'
              }`}>

              {/* TAB: الرئيسية (Home) */}
              {activeMainTab === 'home' && (
                <LibraryHomeView
                  recentBook={recentBook}
                  featuredBooks={publishedBooks.filter(b => featuredBookIds.has(b.id) || featuredBookIds.has(b.title))}
                  liveStats={liveStats}
                  availableDomains={availableDomains}
                  selectedDomain={selectedDomain}
                  onSelectDomain={(dom) => {
                    window.scrollTo({ top: 0, behavior: 'instant' });
                    setSelectedDomain(dom);
                    setActiveMainTab('categories');
                  }}
                  availableAuthors={availableAuthors}
                  onSelectAuthor={(authorName) => {
                    window.scrollTo({ top: 0, behavior: 'instant' });
                    setSelectedAuthor(authorName);
                    setActiveMainTab('authors');
                  }}
                  favoritesCount={favoriteBooksList.length}
                  onNavigateTab={(tab) => {
                    window.scrollTo({ top: 0, behavior: 'instant' });
                    setActiveMainTab(tab);
                    setSelectedAuthor(null);
                  }}
                  onReadBook={handleReadBook}
                  onOpenLinkedBook={handleOpenLinkedBook}
                  onOpenBookInfo={(book) => {
                    const found = publishedBooks.find(b => Number(b.id) === Number(book.id) || b.title === book.title);
                    setActiveInfoBook(found || {
                      id: book.id,
                      title: book.title,
                      author: book.author,
                      category: book.categoryLabel || book.category,
                      century_name: book.authorDeath ? `وفاة ${book.authorDeath}` : undefined,
                      info: book.description || book.info,
                    } as any);
                  }}
                  favoriteBookIds={favoriteBookIds}
                  toggleFavorite={toggleFavorite}
                />
              )}

              {/* TAB: الشروح المرئية والصوتية (Media) */}
              {activeMainTab === 'media' && (
                <MediaExplanationsView
                  sheikhs={sheikhs}
                  playlists={playlists}
                  standaloneItems={standaloneItems}
                  onOpenLinkedBook={handleOpenLinkedBook}
                />
              )}

              {/* TAB: دورات حالية (Courses) */}
              {activeMainTab === 'courses' && (
                <CurrentCoursesView
                  courses={courses}
                  onOpenLinkedBook={handleOpenLinkedBook}
                />
              )}

              {/* ============================================================= */}
              {/* TAB: المـخـتـارة (Featured & Chronological)                   */}
              {/* ============================================================= */}
              {activeMainTab === 'featured' && (
                <BrowseBooksView
                  filteredAndSortedBooks={filteredAndSortedBooks}
                  availableCenturies={availableCenturies}
                  availableDomains={availableDomains}
                  publishedBooksCount={publishedBooks.length}
                  selectedCentury={selectedCentury}
                  setSelectedCentury={setSelectedCentury}
                  sortAsc={sortAsc}
                  setSortAsc={setSortAsc}
                  selectedDomain={selectedDomain}
                  setSelectedDomain={setSelectedDomain}
                  query={query}
                  setQuery={setQuery}
                  loading={loading}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                  visibleBrowseBooksLimit={visibleBrowseBooksLimit}
                  setVisibleBrowseBooksLimit={setVisibleBrowseBooksLimit}
                  handleReadBook={handleReadBook}
                  onAskBook={onAskBook}
                  setSelectedAuthorBook={handleOpenAuthorProfile}
                  setActiveInfoBook={setActiveInfoBook}
                  favoriteBookIds={favoriteBookIds}
                  toggleFavorite={toggleFavorite}
                />
              )}

              {/* ============================================================= */}
              {/* UNIFIED HERITAGE CATALOG HUB (البوابة الشاملة الموحدة)         */}
              {/* [ الكتب والأقسام | المؤلفون | الرواة | المفضلة | المحمّلة ]    */}
              {/* ============================================================= */}
              {(['categories', 'authors', 'narrators', 'favorites', 'downloads'].includes(activeMainTab)) && (
                <UnifiedCatalogView
                  activeSubTab={activeMainTab as CatalogSubTab}
                  onSubTabChange={(tab) => {
                    setActiveMainTab(tab as MainTab);
                    if (tab !== 'narrators') {
                      setSelectedNarrator(null);
                    }
                  }}
                  onSelectNarrator={setSelectedNarrator}
                  categoriesProps={{
                    categorySearch,
                    selectedDomain,
                    filterAuthor,
                    booksByCategory,
                    renderSearchConsole,
                    handleReadBook,
                    onAskBook,
                    setSelectedAuthorBook: handleOpenAuthorProfile,
                    setActiveInfoBook,
                    favoriteBookIds,
                    toggleFavorite,
                    handleSearchChange,
                  }}
                  authorsProps={{
                    selectedAuthor,
                    setSelectedAuthor,
                    currentAuthorData,
                    authorsByCentury,
                    liveStats,
                    availableCenturies,
                    publishedBooksCount: publishedBooks.length,
                    renderSearchConsole,
                    handleReadBook,
                    onAskBook,
                    setSelectedAuthorBook: handleOpenAuthorProfile,
                    setActiveInfoBook,
                    favoriteBookIds,
                    toggleFavorite,
                    authorSearch,
                    selectedDomain,
                    filterAuthor,
                    handleSearchChange,
                    returnToReaderBook,
                    onReturnToReader: () => {
                      if (returnToReaderBook) {
                        setSelectedBook(returnToReaderBook);
                        setView('reader');
                        window.scrollTo({ top: 0, behavior: 'instant' });
                      }
                    },
                  }}
                  favoriteBooks={favoriteBooksList}
                  onRemoveFavorite={(id) => toggleFavorite(id)}
                  onOpenAuthorBio={handleOpenAuthorProfile}
                  handleReadBook={handleReadBook}
                  onAskBook={onAskBook}
                  publishedBooks={publishedBooks}
                />
              )}

            </div>
          </div>
        </main>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* FLOATING BOOK INFO MODAL CARD (نافذة عائمة مع خلفية قابلة للنقر) */}
      {/* ------------------------------------------------------------- */}
      <BookDetailsModal
        book={activeInfoBook}
        onClose={() => setActiveInfoBook(null)}
        loadingInfo={loadingInfo}
        modalInfoText={modalInfoText}
        modalInfoLongText={modalInfoLongText}
        onReadBook={handleReadBook}
        onAskBook={onAskBook}
      />

      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        theme={theme}
        toggleTheme={toggleTheme}
        overlayOpacity={currentSettings.overlayOpacity}
        onOverlayOpacityChange={(val) => updateSettings(currentSettings.imageOpacity, val)}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
      />

      {/* Global Style for Keyframe Animations */}
      <style>{`
        @keyframes float { 
          0% { transform: translateY(0px); } 
          50% { transform: translateY(-12px); } 
          100% { transform: translateY(0px); } 
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
