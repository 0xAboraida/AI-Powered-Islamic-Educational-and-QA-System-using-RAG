import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  Settings,
  User,
  ChevronLeft,
  Loader2,
  LogIn,
  Moon,
  Sun,
  Palette,
  Smartphone,
  Share2,
  LogOut,
  Layers,
  Users,
  ShieldCheck,
  Heart,
  HardDriveDownload,
  Search,
  X
} from 'lucide-react';
import whiteLogo from '@/assets/images/WhiteLogo.png';
import darkLogo from '@/assets/images/ZadDarkLogo.png';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { getAvatarUrl } from '../../../api/client';
import NotificationBell from '../../../components/layout/NotificationBell';
import { MainTab } from '../types/bookTypes';
import { idbGetAllOfflineBookPackages } from '../../../utils/indexedDbStorage';

export interface LibraryNavbarProps {
  isScrolledPastSearch: boolean;
  activeMainTab: MainTab;
  setActiveMainTab: (tab: MainTab) => void;
  onExit: () => void;
  onNavigateGlobal?: (view: any) => void;
  onScrolledPastSearchChange?: (scrolled: boolean) => void;
  setIsScrolledPastSearch: (scrolled: boolean) => void;
  handleGoToLibraryHome: () => void;
  setIsSidebarOpen: (open: boolean) => void;
  onLogin?: () => void;
  setShowProfileModal: (show: boolean) => void;
  setSelectedAuthor: (author: string | null) => void;
  renderSearchConsole?: (isCompact: boolean) => React.ReactNode;
  categoriesCount?: number;
  authorsCount?: number;
  favoritesCount?: number;
  downloadsCount?: number;
}

export const LibraryNavbar: React.FC<LibraryNavbarProps> = ({
  isScrolledPastSearch,
  activeMainTab,
  setActiveMainTab,
  onExit,
  onNavigateGlobal,
  onScrolledPastSearchChange,
  setIsScrolledPastSearch,
  handleGoToLibraryHome,
  setIsSidebarOpen,
  onLogin,
  setShowProfileModal,
  setSelectedAuthor,
  renderSearchConsole,
  categoriesCount,
  authorsCount,
  favoritesCount,
  downloadsCount,
}) => {
  const { theme, toggleTheme, isDark, accentColor, setAccentColor } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [internalDownloadsCount, setInternalDownloadsCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    const loadDownloadsCount = async () => {
      try {
        const pkgs = await idbGetAllOfflineBookPackages();
        if (isMounted) {
          setInternalDownloadsCount(pkgs.length);
        }
      } catch {
        // ignore
      }
    };
    loadDownloadsCount();
    window.addEventListener('zad-offline-books-changed', loadDownloadsCount);
    return () => {
      isMounted = false;
      window.removeEventListener('zad-offline-books-changed', loadDownloadsCount);
    };
  }, []);

  const effectiveDownloadsCount = downloadsCount !== undefined ? downloadsCount : internalDownloadsCount;

  const handleShare = async () => {
    const url = 'https://zad-islamic-ai.vercel.app/';
    const shareData = {
      title: 'زاد - المعلم والباحث الشرعي الذكي',
      text: 'منصة زاد: دراسة العلوم الشرعية، تصفح كتب التراث، واستكشاف الشروحات العلمية بالذكاء الاصطناعي.',
      url: url,
    };
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(shareData);
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
    } catch (err) {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(url);
      }
    }
  };

  const getStickyNavbarStyle = () => {
    if (isDark) {
      return 'bg-[#090b10]/80 border-b border-white/10 shadow-lg shadow-black/25 text-slate-100 backdrop-blur-2xl';
    }
    return 'bg-white/85 border-b border-slate-200/80 shadow-xs text-slate-900 backdrop-blur-2xl';
  };

  const getNavCircleBtnStyle = () => {
    if (isDark) {
      switch (accentColor) {
        case 'amber':
          return 'bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-[#dfbf83]/50 text-slate-300 hover:text-[#eed8ad] shadow-xs hover:shadow-[#dfbf83]/20 transition-all';
        case 'emerald':
          return 'bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-teal-400/50 text-slate-300 hover:text-teal-200 shadow-xs hover:shadow-teal-500/20 transition-all';
        case 'blue':
          return 'bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-blue-400/50 text-slate-300 hover:text-blue-200 shadow-xs hover:shadow-blue-500/20 transition-all';
        case 'purple':
        default:
          return 'bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-purple-400/50 text-slate-300 hover:text-purple-200 shadow-xs hover:shadow-purple-500/20 transition-all';
      }
    }
    switch (accentColor) {
      case 'amber':
        return 'bg-white/80 hover:bg-white border border-[#ebd9b5] hover:border-[#dfbf83] text-[#8a652a] shadow-xs';
      case 'emerald':
        return 'bg-white/80 hover:bg-white border border-teal-200 hover:border-teal-300 text-teal-800 shadow-xs';
      case 'blue':
        return 'bg-white/80 hover:bg-white border border-blue-200 hover:border-blue-300 text-blue-800 shadow-xs';
      case 'purple':
      default:
        return 'bg-white/80 hover:bg-white border border-purple-200 hover:border-purple-300 text-purple-800 shadow-xs';
    }
  };

  const getActiveMobileSearchBtnStyle = () => {
    switch (accentColor) {
      case 'amber':
        return 'bg-gradient-to-r from-[#b88d46] to-[#dfbf83] text-stone-950 font-bold border-[#dfbf83] shadow-md shadow-amber-900/30';
      case 'emerald':
        return 'bg-gradient-to-r from-teal-600 to-emerald-500 text-white font-bold border-teal-400 shadow-md shadow-teal-500/30';
      case 'blue':
        return 'bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold border-blue-400 shadow-md shadow-blue-500/30';
      case 'purple':
      default:
        return 'bg-gradient-to-r from-brand-magenta to-purple-600 text-white font-bold border-purple-400 shadow-md shadow-brand-magenta/35';
    }
  };

  const getDropdownGlassClass = () => {
    if (isDark) {
      return 'bg-[#10131d]/95 border border-white/10 text-white shadow-2xl shadow-black/80 backdrop-blur-2xl';
    } else {
      return 'bg-white/96 border border-stone-200 text-stone-900 shadow-xl shadow-stone-200/50';
    }
  };

  const getNavItemCardClass = () => {
    if (isDark) {
      return 'border-white/[0.07] bg-white/[0.03] text-white/90 hover:bg-white/[0.08] hover:border-white/15';
    } else {
      return 'border-stone-200/70 bg-white/80 text-stone-800 hover:bg-white hover:border-stone-300 shadow-2xs';
    }
  };

  const getNavIconBoxClass = () => {
    switch (accentColor) {
      case 'emerald':
        return isDark
          ? 'bg-teal-500/10 border-teal-500/25 text-teal-300'
          : 'bg-teal-50 border-teal-200/80 text-teal-700';
      case 'amber':
        return isDark
          ? 'bg-[#dfbf83]/10 border-[#dfbf83]/25 text-[#eed8ad]'
          : 'bg-[#fbf8f0] border-[#ebd9b5] text-[#8a652a]';
      case 'blue':
        return isDark
          ? 'bg-blue-500/10 border-blue-500/25 text-blue-300'
          : 'bg-blue-50 border-blue-200/80 text-blue-700';
      case 'purple':
      default:
        return isDark
          ? 'bg-purple-500/10 border-purple-500/25 text-purple-300'
          : 'bg-purple-50 border-purple-200/80 text-purple-700';
    }
  };

  const getThemeToggleTrackClass = () => {
    if (!isDark) return 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.35)]';
    switch (accentColor) {
      case 'emerald': return 'bg-gradient-to-r from-teal-700 to-cyan-600 shadow-[0_0_12px_rgba(20,184,166,0.35)]';
      case 'amber': return 'bg-gradient-to-r from-[#8e682d] to-[#c59b58] shadow-[0_0_12px_rgba(223,191,131,0.35)]';
      case 'blue': return 'bg-gradient-to-r from-blue-700 to-indigo-600 shadow-[0_0_12px_rgba(59,130,246,0.35)]';
      default: return 'bg-gradient-to-r from-purple-700 to-indigo-600 shadow-[0_0_12px_rgba(168,85,247,0.35)]';
    }
  };

  const getThemeBadgeClass = () => {
    switch (accentColor) {
      case 'emerald': return isDark ? 'bg-teal-500/15 text-teal-300 border-teal-500/30' : 'bg-teal-50 text-teal-800 border-teal-200';
      case 'amber': return isDark ? 'bg-[#dfbf83]/15 text-[#eed9b0] border-[#dfbf83]/30' : 'bg-[#fbf8f0] text-[#8a652a] border-[#ebd9b5]';
      case 'blue': return isDark ? 'bg-blue-500/15 text-blue-300 border-blue-500/30' : 'bg-blue-50 text-blue-800 border-blue-200';
      default: return isDark ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'bg-purple-50 text-purple-800 border-purple-200';
    }
  };

  const getActiveTabStyle = () => {
    switch (accentColor) {
      case 'emerald':
        return 'bg-gradient-to-r from-teal-600 to-emerald-500 text-white shadow-md shadow-teal-500/30 scale-[1.02]';
      case 'amber':
        return 'bg-gradient-to-r from-[#b88d46] to-[#dfbf83] text-stone-950 font-black shadow-md shadow-amber-900/30 scale-[1.02]';
      case 'blue':
        return 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-md shadow-blue-500/30 scale-[1.02]';
      case 'purple':
      default:
        return 'bg-gradient-to-r from-brand-magenta to-purple-600 text-white shadow-md shadow-brand-magenta/35 scale-[1.02]';
    }
  };

  const getZadWordClass = () => {
    switch (accentColor) {
      case 'emerald':
        return isDark ? 'text-teal-400 font-black' : 'text-teal-700 font-black';
      case 'amber':
        return isDark ? 'text-[#dfbf83] font-black' : 'text-[#8a652a] font-black';
      case 'blue':
        return isDark
          ? 'bg-gradient-to-l from-[#38bdf8] via-[#60a5fa] to-[#2563eb] bg-clip-text text-transparent font-black drop-shadow-[0_2px_10px_rgba(37,99,235,0.45)]'
          : 'bg-gradient-to-l from-[#0284c7] via-[#1d4ed8] to-[#1e40af] bg-clip-text text-transparent font-black';
      case 'purple':
      default:
        return isDark
          ? 'bg-gradient-to-l from-[#c084fc] via-[#9d32ec] to-[#801bcc] bg-clip-text text-transparent font-black drop-shadow-[0_2px_10px_rgba(157,50,236,0.4)]'
          : 'bg-gradient-to-l from-[#7b1fa2] via-[#8e24aa] to-[#5e1482] bg-clip-text text-transparent font-black';
    }
  };

  const isCatalogTab = ['categories', 'authors', 'narrators', 'favorites', 'downloads'].includes(activeMainTab as string);

  const getCatalogTabActiveStyle = () => {
    switch (accentColor) {
      case 'amber':
        return isDark ? 'text-[#f5ecd5] font-extrabold' : 'text-[#734e18] font-extrabold';
      case 'emerald':
        return isDark ? 'text-teal-200 font-extrabold' : 'text-teal-900 font-extrabold';
      case 'blue':
        return isDark ? 'text-sky-200 font-extrabold' : 'text-blue-900 font-extrabold';
      case 'purple':
      default:
        return isDark ? 'text-purple-200 font-extrabold' : 'text-purple-950 font-extrabold';
    }
  };

  const getCatalogTabActiveBgGradient = () => {
    switch (accentColor) {
      case 'amber':
        return isDark
          ? 'bg-gradient-to-b from-[#dfbf83]/25 to-[#dfbf83]/15 border border-[#dfbf83]/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]'
          : 'bg-gradient-to-b from-[#dfbf83]/35 to-[#dfbf83]/20 border border-[#dfbf83]/50 shadow-sm';
      case 'emerald':
        return isDark
          ? 'bg-gradient-to-b from-teal-500/25 to-teal-500/15 border border-teal-500/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]'
          : 'bg-gradient-to-b from-teal-500/25 to-teal-500/15 border border-teal-500/40 shadow-sm';
      case 'blue':
        return isDark
          ? 'bg-gradient-to-b from-blue-500/25 to-blue-500/15 border border-blue-500/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]'
          : 'bg-gradient-to-b from-blue-500/25 to-blue-500/15 border border-blue-500/40 shadow-sm';
      case 'purple':
      default:
        return isDark
          ? 'bg-gradient-to-b from-purple-500/25 to-purple-500/15 border border-purple-500/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]'
          : 'bg-gradient-to-b from-purple-500/25 to-purple-500/15 border border-purple-500/40 shadow-sm';
    }
  };

  const catalogSubTabs = [
    {
      id: 'categories' as MainTab,
      label: 'الكتب والأقسام',
      mobileLabel: 'الأقسام',
      icon: <Layers className="w-4 h-4" />,
      badge: categoriesCount && categoriesCount > 0 ? categoriesCount : undefined,
    },
    {
      id: 'authors' as MainTab,
      label: 'المؤلفون',
      mobileLabel: 'المؤلفون',
      icon: <Users className="w-4 h-4" />,
      badge: authorsCount && authorsCount > 0 ? authorsCount : undefined,
    },
    {
      id: 'narrators' as MainTab,
      label: 'الرواة',
      mobileLabel: 'الرواة',
      icon: <ShieldCheck className="w-4 h-4" />,
      badge: '18.9K',
    },
    {
      id: 'favorites' as MainTab,
      label: 'الكتب المفضلة',
      mobileLabel: 'المفضلة',
      icon: <Heart className="w-4 h-4" />,
      badge: favoritesCount && favoritesCount > 0 ? favoritesCount : undefined,
    },
    {
      id: 'downloads' as MainTab,
      label: 'الكتب المحمّلة',
      mobileLabel: 'المحمّلة',
      icon: <HardDriveDownload className="w-4 h-4" />,
      badge: effectiveDownloadsCount > 0 ? effectiveDownloadsCount : undefined,
    },
  ];

  const renderGlobalNavTabs = (compact: boolean = false) => {
    const isLibraryActive = activeMainTab !== 'courses';

    const navItems = [
      {
        id: 'home',
        label: 'الرئيسية',
        isActive: false,
        action: () => {
          setIsScrolledPastSearch(false);
          onScrolledPastSearchChange?.(false);
          window.scrollTo({ top: 0, behavior: 'instant' });
          if (onNavigateGlobal) onNavigateGlobal('home');
          else onExit();
        }
      },
      {
        id: 'knowledge',
        label: 'المكتبة',
        isActive: isLibraryActive,
        action: () => {
          if (activeMainTab !== 'home') {
            handleGoToLibraryHome();
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
      },
      {
        id: 'lessons',
        label: 'الشروحات والدروس',
        isActive: false,
        action: () => (onNavigateGlobal ? onNavigateGlobal('lessons') : null)
      },
      { id: 'study', label: 'المدارسة الذكية', isActive: false, action: () => (onNavigateGlobal ? onNavigateGlobal('study') : null) },
      { id: 'chat', label: 'المحادثة النصية', isActive: false, action: () => (onNavigateGlobal ? onNavigateGlobal('chat') : null) },
      { id: 'voice', label: 'المحادثة الصوتية', isActive: false, action: () => (onNavigateGlobal ? onNavigateGlobal('voice') : null) },
    ];

    return (
      <ul className={`flex items-center ${compact ? 'gap-0.5 sm:gap-1' : 'gap-1 sm:gap-1.5'}`}>
        {navItems.map((item) => {
          const active = item.isActive;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={item.action}
                className={`relative flex items-center justify-center transition-all duration-300 rounded-full cursor-pointer ${compact
                  ? 'text-[11px] sm:text-xs px-2.5 py-1'
                  : 'text-xs sm:text-sm lg:text-[13.5px] px-3.5 sm:px-4 py-1.5'
                  } font-bold ${active
                    ? getActiveTabStyle()
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.08]'
                  }`}
              >
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    );
  };

  const isVisible = (activeMainTab === 'home' && isScrolledPastSearch) || activeMainTab !== 'home';

  // إغلاق شريط البحث الممتد عند اختفاء النافبار أو الانتقال لتبويبات الكتالوج
  useEffect(() => {
    if (!isVisible || isCatalogTab) {
      setIsMobileSearchOpen(false);
    }
  }, [isVisible, isCatalogTab]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 w-full backdrop-blur-xl border-b transition-all duration-300 flex flex-col ${getStickyNavbarStyle()} ${isVisible
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : '-translate-y-full opacity-0 pointer-events-none'
        }`}
    >
      <div className="w-full max-w-[1920px] mx-auto min-h-[66px] sm:min-h-[70px] py-2.5 sm:py-3 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 lg:gap-5">

        {/* 1. RIGHT: Circular Menu Button (فهرس وتصنيفات المكتبة) + Zad Logo & Word */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className={`h-10 w-10 rounded-full border flex items-center justify-center transition-all backdrop-blur-md active:scale-95 cursor-pointer group ${getNavCircleBtnStyle()}`}
            title="فهرس وتصنيفات المكتبة"
            aria-label="فتح فهرس وتصنيفات المكتبة"
          >
            <Menu className="h-5 w-5 transition-transform group-hover:scale-110" strokeWidth={2.2} />
          </button>

          <div
            onClick={() => {
              setIsScrolledPastSearch(false);
              onScrolledPastSearchChange?.(false);
              window.scrollTo({ top: 0, behavior: 'instant' });
              if (onNavigateGlobal) onNavigateGlobal('home');
              else onExit();
            }}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group select-none"
            title="الصفحة الرئيسية لموقع زاد"
          >
            {accentColor === 'purple' ? (
              <img
                src={darkLogo}
                alt="زاد"
                className="h-10 sm:h-11 w-auto object-contain drop-shadow-[0_2px_10px_rgba(157,50,236,0.35)] transition-transform group-hover:scale-105"
              />
            ) : (
              <div
                aria-hidden="true"
                className={`h-10 w-10 sm:h-11 sm:w-11 shrink-0 transition-transform group-hover:scale-105 ${accentColor === 'blue'
                  ? theme === 'dark'
                    ? 'bg-gradient-to-b from-[#38bdf8] via-[#2563eb] to-[#1e40af] drop-shadow-[0_2px_10px_rgba(37,99,235,0.45)]'
                    : 'bg-gradient-to-b from-[#0284c7] via-[#1d4ed8] to-[#1e3a8a] drop-shadow-[0_2px_8px_rgba(2,132,199,0.35)]'
                  : accentColor === 'emerald'
                    ? theme === 'dark'
                      ? 'bg-gradient-to-b from-[#5eead4] via-[#14b8a6] to-[#0f766e] drop-shadow-[0_2px_10px_rgba(20,184,166,0.4)]'
                      : 'bg-gradient-to-b from-[#14b8a6] via-[#0d9488] to-[#134e4a] drop-shadow-[0_2px_8px_rgba(13,148,136,0.35)]'
                    : theme === 'dark'
                      ? 'bg-gradient-to-b from-[#f5ecd5] via-[#dfbf83] to-[#8e682d] drop-shadow-[0_2px_10px_rgba(223,191,131,0.4)]'
                      : 'bg-gradient-to-b from-[#dfbf83] via-[#b88d46] to-[#5e431a] drop-shadow-[0_2px_8px_rgba(184,141,70,0.35)]'
                  }`}
                style={{
                  WebkitMaskImage: `url(${whiteLogo})`,
                  maskImage: `url(${whiteLogo})`,
                  WebkitMaskSize: 'contain',
                  maskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  maskPosition: 'center',
                }}
              />
            )}
            <span className={`font-display text-[22px] sm:text-[24px] lg:text-[26px] inline-block transition-colors leading-none ${getZadWordClass()}`}>
              زاد
            </span>
          </div>
        </div>

        {/* 2. CENTER: On catalog pages (categories, authors, narrators, favorites, downloads), hide navbar search and center the global nav tabs */}
        {!['categories', 'authors', 'narrators', 'favorites', 'downloads'].includes(activeMainTab as string) ? (
          <>
            {/* في الشاشات العريضة والمتوسطة (md وأعلى) يظهر شريط البحث كالمعتاد، بينما يُخفى في وضع الهاتف لتوفير المساحة */}
            <div className="hidden md:block flex-1 max-w-xl xl:max-w-2xl min-w-0">
              {renderSearchConsole?.(true)}
            </div>

            <nav className="hidden md:flex items-center shrink-0">
              <div className="p-1 rounded-full bg-white/70 dark:bg-[#121520]/80 border border-slate-200/80 dark:border-white/10 backdrop-blur-2xl shadow-sm dark:shadow-md dark:shadow-black/20">
                {renderGlobalNavTabs(true)}
              </div>
            </nav>
          </>
        ) : (
          <nav className="hidden md:flex flex-1 items-center justify-center">
            <div className="p-1 rounded-full bg-white/70 dark:bg-[#121520]/80 border border-slate-200/80 dark:border-white/10 backdrop-blur-2xl shadow-sm dark:shadow-lg dark:shadow-black/25">
              {renderGlobalNavTabs(false)}
            </div>
          </nav>
        )}

        {/* 4. LEFT: Mobile Search Toggle + Notifications & Circular Settings Button (مطابق للنافبار الأساسي) */}
        <div className="flex items-center gap-2 lg:gap-3 shrink-0">
          {/* زر البحث المخصص لوضع الهاتف (عند النقر تتمدد النافبار للأسفل) */}
          {!['categories', 'authors', 'narrators', 'favorites', 'downloads'].includes(activeMainTab as string) && (
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className={`h-10 w-10 rounded-full border flex items-center justify-center transition-all backdrop-blur-md active:scale-95 cursor-pointer group md:hidden ${
                isMobileSearchOpen
                  ? getActiveMobileSearchBtnStyle()
                  : getNavCircleBtnStyle()
              }`}
              title={isMobileSearchOpen ? 'إغلاق البحث' : 'بحث في المكتبة'}
              aria-label={isMobileSearchOpen ? 'إغلاق البحث' : 'بحث في المكتبة'}
              aria-expanded={isMobileSearchOpen}
            >
              {isMobileSearchOpen ? (
                <X className="h-4.5 w-4.5 transition-transform group-hover:scale-110" strokeWidth={2.2} />
              ) : (
                <Search className="h-4.5 w-4.5 transition-transform group-hover:scale-110" strokeWidth={2.2} />
              )}
            </button>
          )}

          <NotificationBell />
        </div>

      </div>

      {/* EXPANDABLE MOBILE SEARCH ROW (تمدد شريط البحث لأسفل بأناقة وسلاسة في وضع الهاتف) */}
      <AnimatePresence>
        {isMobileSearchOpen && !isCatalogTab && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1, transitionEnd: { overflow: 'visible' } }}
            exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="w-full md:hidden border-t border-slate-200/60 dark:border-white/10 bg-slate-50/80 dark:bg-[#07090e]/90 backdrop-blur-2xl shadow-inner"
          >
            <div className="w-full px-3.5 sm:px-5 py-2.5">
              {renderSearchConsole?.(true)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. BOTTOM ROW: FULL-WIDTH SUB-NAVBAR FOR CATALOG TABS (ثابت 100% وبدون تحريك) */}
      {isCatalogTab && (
        <div className="w-full border-t border-slate-200/60 dark:border-white/10 bg-slate-100/60 dark:bg-[#07090e]/80 backdrop-blur-2xl">
          <div className="w-full max-w-[1920px] mx-auto px-1.5 sm:px-6 lg:px-8">
            <div className="w-full grid grid-cols-5 gap-1 sm:gap-2.5 lg:gap-3 py-1.5 sm:py-2.5" dir="rtl">
              {catalogSubTabs.map((tab) => {
                const isActive = activeMainTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveMainTab(tab.id)}
                    className={`relative flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 px-1 sm:px-3 lg:px-4 py-1.5 sm:py-2 min-h-[46px] sm:min-h-[48px] rounded-md sm:rounded-lg transition-all duration-200 w-full min-w-0 cursor-pointer select-none active:scale-[0.98] ${isActive
                      ? getCatalogTabActiveStyle()
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5'
                      }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeCatalogSubTab"
                        className={`absolute inset-0 rounded-md sm:rounded-lg ${getCatalogTabActiveBgGradient()}`}
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                    {/* إخفاء الأيقونة في وضع الهاتف وإظهارها فقط في الشاشات الأكبر لتوفير مساحة للخط */}
                    <span className="relative z-10 shrink-0 hidden md:inline-flex">{tab.icon}</span>

                    {/* النص: واضح تماماً في سطر مخصص بدون أي اقتصاص */}
                    <span className="relative z-10 tracking-tight text-[11px] sm:text-xs md:text-sm font-bold leading-tight truncate sm:overflow-visible">
                      <span className="md:hidden">{tab.mobileLabel}</span>
                      <span className="hidden md:inline">{tab.label}</span>
                    </span>

                    {/* البادج المرقّم: أسفل الاسم في الهاتف ليوفر المساحة بالكامل، وبجانبه في الشاشات الكبيرة */}
                    {tab.badge !== undefined ? (
                      <span
                        className={`relative z-10 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold shrink-0 transition-colors leading-none ${isActive
                          ? 'bg-black/15 dark:bg-white/10 text-current border border-current/20'
                          : 'bg-slate-200/90 dark:bg-white/10 text-slate-700 dark:text-slate-300'
                          }`}
                      >
                        {tab.badge}
                      </span>
                    ) : (
                      <span className="relative z-10 text-[9px] leading-none opacity-0 select-none md:hidden" aria-hidden="true">
                        -
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default LibraryNavbar;
