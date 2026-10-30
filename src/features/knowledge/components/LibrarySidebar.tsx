import React, { useState } from 'react';
import {
  X,
  Home,
  Layers,
  Users,
  ShieldCheck,
  Heart,
  HardDriveDownload,
  Bookmark,
  BookOpen,
  ChevronLeft,
  ChevronDown,
  Video,
  BookOpenCheck,
  MessageSquare,
  Mic,
  Sun,
  Moon,
  Palette,
  Bell,
  LogIn,
  LogOut,
  Smartphone,
  Share2,
  Library,
  LayoutDashboard,
  Zap,
  Cpu,
  Database,
  Sparkles,
  Activity,
  Check,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import whiteLogo from '@/assets/images/WhiteLogo.png';
import darkLogo from '@/assets/images/ZadDarkLogo.png';
import { useTheme, AccentColor } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { MainTab } from '../types/bookTypes';
export type { MainTab };

export interface LibraryCurrentContext {
  type: 'reader' | 'category' | 'author' | 'narrator' | 'catalog';
  category?: string;
  bookTitle?: string;
  authorName?: string;
  narratorName?: string;
}

interface LibrarySidebarProps {
  isOpen: boolean;
  theme: string;
  activeMainTab: MainTab;
  currentContext?: LibraryCurrentContext | null;
  counts: {
    domains: number;
    authors: number;
    featured?: number;
    favorites: number;
    narrators?: string | number;
    downloads?: number;
  };
  recentBook: any | null;
  onClose: () => void;
  onSelectTab: (tab: MainTab) => void;
  onReadRecentBook: (book: any) => void;
  onSelectCategory?: (category: string) => void;
  onSelectAuthor?: (author: string) => void;
  onSelectNarrator?: (narrator: string) => void;
  // Global Navigation Props
  onNavigateGlobal?: (view: any) => void;
  onExit?: () => void;
  onLogin?: () => void;
  // Optional / backward-compatible props
  selectedCentury?: string;
  onChangeCentury?: (c: string) => void;
  availableCenturies?: { century: number; name: string; count: number }[];
  sortAsc?: boolean;
  onToggleSort?: () => void;
  onOpenSettings?: () => void;
}

export default function LibrarySidebar({
  isOpen,
  theme,
  activeMainTab,
  currentContext,
  counts,
  recentBook,
  onClose,
  onSelectTab,
  onReadRecentBook,
  onSelectCategory,
  onSelectAuthor,
  onSelectNarrator,
  onNavigateGlobal,
  onExit,
  onLogin,
}: LibrarySidebarProps) {
  const { accentColor, isDark, toggleTheme, setAccentColor } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.email?.toLowerCase().includes('admin');

  // Library accordion sub-menu expanded state (default expanded since user is inside the library)
  const [isLibraryExpanded, setIsLibraryExpanded] = useState(true);
  const [isAdminExpanded, setIsAdminExpanded] = useState(false);
  const [isCopiedShare, setIsCopiedShare] = useState(false);

  // Effective dark mode calculation
  const isDarkEffective = theme === 'dark' || (theme !== 'sepia' && theme !== 'light' && isDark);

  const getDrawerBgClass = () => (isDarkEffective ? 'bg-[#090b10]/98 text-white shadow-[-16px_0_50px_rgba(0,0,0,0.85)]' : 'bg-[#fcfbf9]/98 text-stone-900 shadow-[-12px_0_40px_rgba(0,0,0,0.08)]');

  const getDrawerBorderClass = () => {
    switch (accentColor) {
      case 'emerald':
        return isDarkEffective ? 'border-teal-500/35' : 'border-teal-600/30';
      case 'amber':
        return isDarkEffective ? 'border-[#dfbf83]/35' : 'border-[#b88d46]/35';
      case 'blue':
        return isDarkEffective ? 'border-blue-500/35' : 'border-blue-600/30';
      case 'purple':
      default:
        return isDarkEffective ? 'border-purple-500/35' : 'border-purple-600/30';
    }
  };

  const getNavItemCardClass = () => (isDarkEffective ? 'border-white/[0.07] bg-white/[0.03] text-white/90 hover:bg-white/[0.08] hover:border-white/15' : 'border-stone-200/70 bg-white/80 text-stone-800 hover:bg-white hover:border-stone-300 shadow-2xs');

  const getNavIconBoxClass = () => {
    switch (accentColor) {
      case 'emerald':
        return isDarkEffective
          ? 'bg-teal-500/10 border-teal-500/25 text-teal-300'
          : 'bg-teal-50 border-teal-200/80 text-teal-700';
      case 'amber':
        return isDarkEffective
          ? 'bg-[#dfbf83]/10 border-[#dfbf83]/25 text-[#eed8ad]'
          : 'bg-[#fbf8f0] border-[#ebd9b5] text-[#8a652a]';
      case 'blue':
        return isDarkEffective
          ? 'bg-blue-500/10 border-blue-500/25 text-blue-300'
          : 'bg-blue-50 border-blue-200/80 text-blue-700';
      case 'purple':
      default:
        return isDarkEffective
          ? 'bg-purple-500/10 border-purple-500/25 text-purple-300'
          : 'bg-purple-50 border-purple-200/80 text-purple-700';
    }
  };

  const getActiveNavClass = () => {
    switch (accentColor) {
      case 'emerald':
        return isDarkEffective
          ? 'border-teal-500/40 bg-teal-950/40 text-teal-200 shadow-sm'
          : 'border-teal-600/30 bg-teal-50/80 text-teal-950 shadow-sm';
      case 'amber':
        return isDarkEffective
          ? 'border-[#dfbf83]/40 bg-[#251809]/60 text-[#f6eedd] shadow-sm'
          : 'border-[#b88d46]/30 bg-[#fbf8f0] text-[#5e431a] shadow-sm';
      case 'blue':
        return isDarkEffective
          ? 'border-blue-500/40 bg-blue-950/40 text-blue-200 shadow-sm'
          : 'border-blue-600/30 bg-blue-50/80 text-blue-950 shadow-sm';
      case 'purple':
      default:
        return isDarkEffective
          ? 'border-purple-500/40 bg-purple-950/40 text-purple-200 shadow-sm'
          : 'border-purple-600/30 bg-purple-50/80 text-purple-950 shadow-sm';
    }
  };

  const getActiveDotClass = () => {
    if (isDarkEffective) {
      switch (accentColor) {
        case 'emerald': return 'bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)]';
        case 'amber': return 'bg-[#dfbf83] shadow-[0_0_8px_rgba(223,191,131,0.8)]';
        case 'blue': return 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]';
        default: return 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]';
      }
    } else {
      switch (accentColor) {
        case 'emerald': return 'bg-teal-700';
        case 'amber': return 'bg-[#8a652a]';
        case 'blue': return 'bg-blue-700';
        default: return 'bg-purple-700';
      }
    }
  };

  const getDrawerSectionHeadingClass = () => {
    switch (accentColor) {
      case 'emerald':
        return isDarkEffective ? 'text-teal-300/70' : 'text-teal-900/70';
      case 'amber':
        return isDarkEffective ? 'text-[#dfbf83]/70' : 'text-[#8a652a]/70';
      case 'blue':
        return isDarkEffective ? 'text-blue-300/70' : 'text-blue-900/70';
      case 'purple':
      default:
        return isDarkEffective ? 'text-purple-300/70' : 'text-purple-900/70';
    }
  };

  const getZadWordClass = () => {
    switch (accentColor) {
      case 'emerald': return isDarkEffective ? 'text-teal-400' : 'text-teal-700';
      case 'amber': return isDarkEffective ? 'text-[#dfbf83]' : 'text-[#8a652a]';
      case 'blue':
        return isDarkEffective
          ? 'bg-gradient-to-l from-[#38bdf8] via-[#60a5fa] to-[#2563eb] bg-clip-text text-transparent font-black drop-shadow-[0_2px_10px_rgba(37,99,235,0.45)]'
          : 'bg-gradient-to-l from-[#0284c7] via-[#1d4ed8] to-[#1e40af] bg-clip-text text-transparent font-black';
      case 'purple':
      default:
        return isDarkEffective
          ? 'bg-gradient-to-l from-[#c084fc] via-[#9d32ec] to-[#801bcc] bg-clip-text text-transparent font-black drop-shadow-[0_2px_10px_rgba(157,50,236,0.4)]'
          : 'bg-gradient-to-l from-[#7b1fa2] via-[#8e24aa] to-[#5e1482] bg-clip-text text-transparent font-black';
    }
  };

  const getLogoBgColorClass = () => {
    switch (accentColor) {
      case 'emerald':
        return isDarkEffective
          ? 'bg-gradient-to-b from-[#5eead4] via-[#14b8a6] to-[#0f766e]'
          : 'bg-gradient-to-b from-[#14b8a6] via-[#0d9488] to-[#134e4a]';
      case 'amber':
        return isDarkEffective
          ? 'bg-gradient-to-b from-[#f5ecd5] via-[#dfbf83] to-[#8e682d]'
          : 'bg-gradient-to-b from-[#dfbf83] via-[#b88d46] to-[#5e431a]';
      case 'blue':
        return isDarkEffective
          ? 'bg-gradient-to-b from-[#38bdf8] via-[#2563eb] to-[#1e40af]'
          : 'bg-gradient-to-b from-[#0284c7] via-[#1d4ed8] to-[#1e3a8a]';
      default: return isDarkEffective ? 'bg-purple-300' : 'bg-purple-700';
    }
  };

  const renderBrandLogo = (sizeClass = 'h-9 w-9') => {
    if (accentColor === 'purple') {
      return (
        <img
          src={darkLogo}
          alt="شعار زاد"
          className={`${sizeClass} shrink-0 object-contain drop-shadow-[0_3px_12px_rgba(157,50,236,0.35)] transition-all`}
        />
      );
    }

    const shadowClass = isDarkEffective
      ? accentColor === 'blue'
        ? 'drop-shadow-[0_3px_12px_rgba(37,99,235,0.45)]'
        : accentColor === 'emerald'
        ? 'drop-shadow-[0_3px_12px_rgba(20,184,166,0.4)]'
        : 'drop-shadow-[0_3px_12px_rgba(223,191,131,0.4)]'
      : accentColor === 'blue'
      ? 'drop-shadow-[0_2px_8px_rgba(2,132,199,0.35)]'
      : accentColor === 'emerald'
      ? 'drop-shadow-[0_2px_8px_rgba(13,148,136,0.35)]'
      : 'drop-shadow-[0_2px_8px_rgba(184,141,70,0.35)]';

    return (
      <div
        aria-hidden="true"
        className={`${sizeClass} shrink-0 transition-colors duration-300 ${shadowClass} ${getLogoBgColorClass()}`}
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
    );
  };

  const getDrawerCloseButtonClass = () => {
    switch (accentColor) {
      case 'emerald':
        return isDarkEffective
          ? 'border-teal-500/25 bg-teal-500/10 text-teal-300 hover:border-teal-500/40 hover:bg-teal-500/15'
          : 'border-teal-500/30 bg-teal-50/80 text-teal-800 hover:bg-teal-100/80';
      case 'amber':
        return isDarkEffective
          ? 'border-[#dfbf83]/25 bg-[#dfbf83]/10 text-[#eed9b0] hover:border-[#dfbf83]/40 hover:bg-[#dfbf83]/15'
          : 'border-[#dfbf83]/40 bg-[#fbf8f0] text-[#8a652a] hover:bg-[#ebd9b5]/40';
      case 'blue':
        return isDarkEffective
          ? 'border-blue-500/25 bg-blue-500/10 text-blue-300 hover:border-blue-500/40 hover:bg-blue-500/15'
          : 'border-blue-500/30 bg-blue-50/80 text-blue-800 hover:bg-blue-100/80';
      case 'purple':
      default:
        return isDarkEffective
          ? 'border-purple-500/25 bg-purple-500/10 text-purple-300 hover:border-purple-500/40 hover:bg-purple-500/15'
          : 'border-purple-500/30 bg-purple-50/80 text-purple-800 hover:bg-purple-100/80';
    }
  };

  const getThemeBadgeClass = () => {
    switch (accentColor) {
      case 'emerald': return isDarkEffective ? 'bg-teal-500/15 text-teal-300 border-teal-500/30' : 'bg-teal-50 text-teal-800 border-teal-200';
      case 'amber': return isDarkEffective ? 'bg-[#dfbf83]/15 text-[#eed9b0] border-[#dfbf83]/30' : 'bg-[#fbf8f0] text-[#8a652a] border-[#ebd9b5]';
      case 'blue': return isDarkEffective ? 'bg-blue-500/15 text-blue-300 border-blue-500/30' : 'bg-blue-50 text-blue-800 border-blue-200';
      default: return isDarkEffective ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'bg-purple-50 text-purple-800 border-purple-200';
    }
  };

  const getThemeToggleTrackClass = () => {
    if (!isDarkEffective) return 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.35)]';
    switch (accentColor) {
      case 'emerald': return 'bg-gradient-to-r from-teal-700 to-cyan-600 shadow-[0_0_12px_rgba(20,184,166,0.35)]';
      case 'amber': return 'bg-gradient-to-r from-[#8e682d] to-[#c59b58] shadow-[0_0_12px_rgba(223,191,131,0.35)]';
      case 'blue': return 'bg-gradient-to-r from-blue-700 to-indigo-600 shadow-[0_0_12px_rgba(59,130,246,0.35)]';
      default: return 'bg-gradient-to-r from-purple-700 to-indigo-600 shadow-[0_0_12px_rgba(168,85,247,0.35)]';
    }
  };

  const handleShare = async () => {
    const url = 'https://zad-islamic-ai.vercel.app/';
    const title = 'منصة زاد للعلوم الشرعية';
    const text = 'منصة زاد للعلوم الشرعية بالذكاء الاصطناعي - إجابات موثقة من أمهات الكتب الشرعية';

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text: `${title}\n${text}`, url });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setIsCopiedShare(true);
      setTimeout(() => setIsCopiedShare(false), 2000);
    } catch {
      window.prompt('يرجى نسخ الرابط:', url);
    }
  };

  // Sub-items of the Library accordion
  const librarySubItems: {
    id: MainTab;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
  }[] = [
    {
      id: 'home',
      label: 'رئيسية المكتبة',
      icon: <Library className="w-4 h-4" />
    },
    {
      id: 'categories',
      label: 'الكتب والأقسام',
      icon: <Layers className="w-4 h-4" />,
      badge: counts.domains > 0 ? counts.domains : undefined
    },
    {
      id: 'authors',
      label: 'المؤلفون والقرون',
      icon: <Users className="w-4 h-4" />,
      badge: counts.authors > 0 ? counts.authors : undefined
    },
    {
      id: 'narrators',
      label: 'الرواة',
      icon: <ShieldCheck className="w-4 h-4" />,
      badge: counts.narrators || '18.9K'
    },
    {
      id: 'favorites',
      label: 'الكتب المفضلة',
      icon: <Heart className="w-4 h-4" />,
      badge: counts.favorites > 0 ? counts.favorites : undefined
    },
    {
      id: 'downloads',
      label: 'الكتب المحمّلة',
      icon: <HardDriveDownload className="w-4 h-4" />,
      badge: counts.downloads && counts.downloads > 0 ? counts.downloads : undefined
    }
  ];

  return (
    <>
      <aside
        dir="rtl"
        aria-label="القائمة الجانبية الموحدة"
        className={`fixed inset-y-0 right-0 z-[75] flex h-[100dvh] w-[86vw] max-w-[340px] flex-col border-l backdrop-blur-2xl transition-transform duration-300 ease-out will-change-transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        } ${getDrawerBorderClass()} ${getDrawerBgClass()}`}
      >
        {/* 1. Header: Zad Logo, "زاد", Close button (X) */}
        <div className={`flex items-center justify-between px-5 py-4 border-b shrink-0 ${getDrawerBorderClass()}`}>
          <div className="flex items-center gap-2.5">
            {renderBrandLogo('h-9 w-9')}
            <span className={`font-display text-2xl font-bold tracking-wide inline-block transition-colors ${getZadWordClass()}`}>
              زاد
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق القائمة"
            className={`flex h-9 w-9 items-center justify-center rounded-full border shadow-xs active:scale-90 transition-all cursor-pointer ${getDrawerCloseButtonClass()}`}
          >
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4 text-right pb-8 custom-scrollbar">
          
          {/* Auth Section - Display welcome & login ONLY when NOT authenticated */}
          {!isAuthenticated && (
            <div className={`rounded-2xl border p-4 text-right shadow-xs ${
              isDarkEffective ? 'border-white/10 bg-white/[0.03]' : 'border-stone-200/80 bg-white/90 shadow-stone-200/50'
            }`}>
              <h4 className={`text-sm font-bold ${isDarkEffective ? 'text-white' : 'text-stone-900'}`}>مرحباً بك</h4>
              <p className={`text-xs mt-1 leading-relaxed ${isDarkEffective ? 'text-white/70' : 'text-stone-500'}`}>
                قم بالتسجيل للاستفادة من خدمات الموقع ومكتبتك الشخصية
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onLogin) onLogin();
                  else if (onNavigateGlobal) onNavigateGlobal('login');
                }}
                className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#53177d] hover:bg-[#431265] text-white py-2.5 px-4 text-xs font-bold shadow-xs shadow-[#53177d]/20 active:scale-[0.98] transition-all cursor-pointer"
              >
                <LogIn size={15} />
                <span>تسجيل الدخول / إنشاء حساب</span>
              </button>
            </div>
          )}

          {/* 2. Main Navigation Items (التنقل الأساسي) */}
          <div className="space-y-1.5">
            <div className={`pr-0.5 pl-2 text-[11px] font-semibold tracking-wider transition-colors ${getDrawerSectionHeadingClass()}`}>
              التنقل الأساسي
            </div>

            {/* الرئيسية */}
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onNavigateGlobal) onNavigateGlobal('home');
                else if (onExit) onExit();
              }}
              className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm font-semibold active:scale-[0.99] transition-all cursor-pointer ${getNavItemCardClass()}`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${getNavIconBoxClass()}`}>
                  <Home size={16} />
                </div>
                <span>الرئيسية</span>
              </div>
              <ChevronLeft size={16} className={isDarkEffective ? 'text-white/55' : 'text-stone-400'} />
            </button>

            {/* المكتبة (Accordion / تفرع شجري تفاعلي) */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setIsLibraryExpanded(!isLibraryExpanded)}
                className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm font-bold active:scale-[0.99] transition-all cursor-pointer select-none ${getActiveNavClass()}`}
                title={isLibraryExpanded ? 'طي تفرع المكتبة' : 'توسيع تفرع المكتبة'}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg brand-gradient text-white shadow-xs`}>
                    <BookOpen size={16} />
                  </div>
                  <div className="text-right">
                    <span className="block font-bold">المكتبة</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${getActiveDotClass()}`} />
                  <motion.div
                    animate={{ rotate: isLibraryExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={16} className={isDarkEffective ? 'text-white/70' : 'text-stone-600'} />
                  </motion.div>
                </div>
              </button>

              {/* Sub-branch items inside Library Accordion */}
              <AnimatePresence initial={false}>
                {isLibraryExpanded && (
                  <motion.div
                    key="library-accordion-content"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="mr-3 pr-2.5 my-1.5 border-r-2 border-primary/25 space-y-1">
                      {librarySubItems.map((item) => {
                        const isActive = activeMainTab === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              onSelectTab(item.id);
                              onClose();
                            }}
                            className={`w-full group flex items-center justify-between py-2 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
                              isActive
                                ? isDarkEffective
                                  ? 'bg-white/10 text-white font-bold border border-white/15 shadow-2xs'
                                  : 'bg-stone-100 text-stone-950 font-bold border border-stone-200/90 shadow-2xs'
                                : isDarkEffective
                                  ? 'text-white/75 hover:bg-white/[0.05] hover:text-white border border-transparent'
                                  : 'text-stone-700 hover:bg-stone-50 hover:text-stone-900 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className={`shrink-0 transition-colors ${
                                isActive
                                  ? isDarkEffective ? 'text-white' : 'text-stone-950'
                                  : isDarkEffective ? 'text-white/60 group-hover:text-white' : 'text-stone-500 group-hover:text-stone-900'
                              }`}>
                                {item.icon}
                              </span>
                              <span className="truncate">{item.label}</span>
                            </div>

                            {item.badge !== undefined && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono shrink-0 transition-colors ${
                                isActive
                                  ? isDarkEffective
                                    ? 'bg-white/20 text-white font-bold'
                                    : 'bg-stone-200 text-stone-900 font-bold'
                                  : isDarkEffective
                                    ? 'bg-white/10 text-white/70'
                                    : 'bg-stone-100 text-stone-600 border border-stone-200/60'
                              }`}>
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}

                      {/* Recent Book inside Library Accordion */}
                      {recentBook && (
                        <div className={`mt-2 p-2.5 rounded-xl border space-y-1.5 shadow-2xs ${
                          isDarkEffective
                            ? 'bg-white/[0.03] border-white/10 text-white'
                            : 'bg-stone-50/90 border-stone-200 text-stone-900'
                        }`}>
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                            <Bookmark className="w-3.5 h-3.5" />
                            <span>متابعة القراءة الأخيرة</span>
                          </div>
                          <h5 className="font-bold text-xs truncate">
                            {recentBook.title}
                          </h5>
                          <p className={`text-[10.5px] truncate font-medium ${
                            isDarkEffective ? 'text-white/60' : 'text-stone-500'
                          }`}>
                            {recentBook.author}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              onReadRecentBook(recentBook);
                              onClose();
                            }}
                            className={`w-full py-1.5 rounded-lg font-bold text-[11px] transition-all shadow-2xs cursor-pointer ${
                              isDarkEffective
                                ? 'bg-white text-stone-950 hover:bg-stone-100'
                                : 'bg-stone-900 text-white hover:bg-stone-800'
                            }`}
                          >
                            إكمال القراءة 📖
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* الشروحات والدورات */}
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onNavigateGlobal) onNavigateGlobal('lessons');
              }}
              className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm font-semibold active:scale-[0.99] transition-all cursor-pointer ${getNavItemCardClass()}`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${getNavIconBoxClass()}`}>
                  <Video size={16} />
                </div>
                <span>الشروحات والدورات</span>
              </div>
              <ChevronLeft size={16} className={isDarkEffective ? 'text-white/55' : 'text-stone-400'} />
            </button>
          </div>

          {/* 3. AI & Interactive Section (أدوات زاد التفاعلية) */}
          <div className={`space-y-1.5 pt-3 border-t ${isDarkEffective ? 'border-white/10' : 'border-stone-200/70'}`}>
            <div className={`pr-0.5 pl-2 text-[11px] font-semibold tracking-wider transition-colors ${getDrawerSectionHeadingClass()}`}>
              أدوات زاد التفاعلية
            </div>

            {/* وضع الدراسة */}
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onNavigateGlobal) onNavigateGlobal('study');
              }}
              className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm font-semibold active:scale-[0.99] transition-all cursor-pointer ${getNavItemCardClass()}`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${getNavIconBoxClass()}`}>
                  <BookOpenCheck size={16} />
                </div>
                <span>وضع الدراسة</span>
              </div>
              <ChevronLeft size={16} className={isDarkEffective ? 'text-white/55' : 'text-stone-400'} />
            </button>

            {/* المحادثة النصية */}
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onNavigateGlobal) onNavigateGlobal('chat');
              }}
              className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm font-semibold active:scale-[0.99] transition-all cursor-pointer ${getNavItemCardClass()}`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${getNavIconBoxClass()}`}>
                  <MessageSquare size={16} />
                </div>
                <span>المحادثة النصية</span>
              </div>
              <ChevronLeft size={16} className={isDarkEffective ? 'text-white/55' : 'text-stone-400'} />
            </button>

            {/* المحادثة الصوتية */}
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onNavigateGlobal) onNavigateGlobal('voice');
              }}
              className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm font-semibold active:scale-[0.99] transition-all cursor-pointer ${getNavItemCardClass()}`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${getNavIconBoxClass()}`}>
                  <Mic size={16} />
                </div>
                <span>المحادثة الصوتية</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getThemeBadgeClass()}`}>
                قريباً...
              </span>
            </button>
          </div>

          {/* 4. Admin Management Section (لوحات إدارة النظام - If Admin) */}
          {isAuthenticated && isAdmin && (
            <div className={`rounded-xl border transition-all overflow-hidden ${getNavItemCardClass()}`}>
              <button
                type="button"
                onClick={() => setIsAdminExpanded(!isAdminExpanded)}
                className="flex w-full items-center justify-between px-3.5 py-2.5 text-right transition-colors cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${getNavIconBoxClass()}`}>
                    <ShieldCheck size={16} />
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="block text-sm font-bold">لوحات إدارة النظام</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getThemeBadgeClass()}`}>
                        أدمن
                      </span>
                    </div>
                    <span className={`text-[11px] font-normal ${isDarkEffective ? 'text-white/60' : 'text-stone-500'}`}>
                      صفحات وأدوات التحكم الإداري
                    </span>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: isAdminExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={16} className={isDarkEffective ? 'text-white/50' : 'text-stone-400'} />
                </motion.div>
              </button>

              <AnimatePresence>
                {isAdminExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`border-t px-2 py-2 space-y-1 ${
                      isDarkEffective ? 'border-white/10 bg-black/25' : 'border-stone-200/80 bg-stone-50/80'
                    }`}
                  >
                    {[
                      { id: 'admin', label: 'إدارة وضع الدراسة', icon: <LayoutDashboard size={13} />, color: isDarkEffective ? 'text-brand-blue' : 'text-blue-700' },
                      { id: 'turath_rag', label: 'استخراج وتخزين الكتب', icon: <Zap size={13} />, color: isDarkEffective ? 'text-sky-400' : 'text-sky-700' },
                      { id: 'engine_control', label: 'التحكم في محركات RAG', icon: <Cpu size={13} />, color: isDarkEffective ? 'text-purple-400' : 'text-purple-700' },
                      { id: 'data_ingestion', label: 'إدارة البيانات', icon: <Database size={13} />, color: isDarkEffective ? 'text-emerald-400' : 'text-emerald-700' },
                      { id: 'v2_pipeline_admin', label: 'إدخال بيانات AI', icon: <Sparkles size={13} />, color: isDarkEffective ? 'text-blue-400' : 'text-blue-700' },
                      { id: 'admin_library', label: 'إدارة مكتبة القراءة', icon: <BookOpen size={13} />, color: isDarkEffective ? 'text-amber-400' : 'text-amber-700' },
                      { id: 'youtube_importer', label: 'استيراد شروحات يوتيوب', icon: <Video size={13} />, color: isDarkEffective ? 'text-red-400' : 'text-red-700' },
                      { id: 'system_observability', label: 'مراقبة النظام والـ AI', icon: <Activity size={13} />, color: isDarkEffective ? 'text-amber-300' : 'text-amber-700' },
                    ].map((tool) => (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onNavigateGlobal) onNavigateGlobal(tool.id);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-right text-xs font-semibold transition-colors cursor-pointer ${tool.color} ${
                          isDarkEffective ? 'hover:bg-white/10' : 'hover:bg-black/5'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {tool.icon}
                          <span>{tool.label}</span>
                        </div>
                        <ChevronLeft size={12} className="opacity-50" />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* 5. Customization & Appearance Section (المظهر والتخصيص) */}
          <div className={`space-y-2 pt-3 border-t ${isDarkEffective ? 'border-white/10' : 'border-stone-200/70'}`}>
            <div className={`pr-0.5 pl-2 text-[11px] font-semibold tracking-wider transition-colors ${getDrawerSectionHeadingClass()}`}>
              المظهر والتخصيص
            </div>

            {/* الإشعارات والتحديثات */}
            <button
              type="button"
              onClick={() => {
                onClose();
                setTimeout(() => {
                  window.dispatchEvent(new Event('open_zad_notifications'));
                }, 120);
              }}
              className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm font-semibold active:scale-[0.99] transition-all cursor-pointer ${getNavItemCardClass()}`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${getNavIconBoxClass()}`}>
                  <Bell size={16} />
                </div>
                <span>الإشعارات والتحديثات</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getThemeBadgeClass()}`}>
                  جديد
                </span>
                <ChevronLeft size={16} className={isDarkEffective ? 'text-white/55' : 'text-stone-400'} />
              </div>
            </button>

            {/* مظهر التطبيق (Toggle Switch) */}
            <div
              onClick={toggleTheme}
              role="button"
              tabIndex={0}
              className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm font-semibold cursor-pointer active:scale-[0.99] transition-all select-none ${getNavItemCardClass()}`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${getNavIconBoxClass()}`}>
                  {isDarkEffective ? <Moon size={16} /> : <Sun size={16} />}
                </div>
                <div className="text-right">
                  <span className="block text-sm font-bold">الإضاءة</span>
                  <span className={`text-[11px] font-normal ${isDarkEffective ? 'text-white/60' : 'text-stone-500'}`}>
                    {isDarkEffective ? 'الوضع الليلي مفعّل' : 'الوضع النهاري مفعّل'}
                  </span>
                </div>
              </div>

              {/* Animated Switch Component */}
              <div className={`relative flex h-7 w-14 items-center rounded-full p-1 transition-colors duration-300 ${getThemeToggleTrackClass()}`}>
                <div className="absolute inset-x-2 flex justify-between items-center text-[10px] pointer-events-none">
                  <Moon size={12} className={isDarkEffective ? 'text-white/80' : 'text-black/25'} />
                  <Sun size={12} className={!isDarkEffective ? 'text-amber-950/80' : 'text-white/25'} />
                </div>
                <motion.div
                  layout
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className={`z-10 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-md ${
                    isDarkEffective ? 'mr-0 ml-auto text-stone-800' : 'ml-0 mr-auto text-amber-600'
                  }`}
                >
                  {isDarkEffective ? <Moon size={11} strokeWidth={2.5} /> : <Sun size={11} strokeWidth={2.5} />}
                </motion.div>
              </div>
            </div>

            {/* لون السمة */}
            <div className={`rounded-xl border p-3 ${getNavItemCardClass()}`}>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Palette size={15} className={accentColor === 'emerald' ? 'text-teal-400' : accentColor === 'amber' ? 'text-[#dfbf83]' : accentColor === 'blue' ? 'text-blue-400' : 'text-purple-400'} />
                  <span>لون السمة</span>
                </div>
                <span className={`text-[10px] font-bold ${accentColor === 'emerald' ? 'text-teal-400' : accentColor === 'amber' ? 'text-[#dfbf83]' : accentColor === 'blue' ? 'text-blue-400' : 'text-purple-400'}`}>
                  {accentColor === 'purple' && 'أرجواني ملكي'}
                  {accentColor === 'emerald' && 'فيروزي إسلامي'}
                  {accentColor === 'amber' && 'عاجي إسلامي'}
                  {accentColor === 'blue' && 'أزرق ياقوتي'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'purple', name: 'أرجواني', gradient: 'from-purple-700 to-fuchsia-500', ring: 'ring-purple-400' },
                  { id: 'emerald', name: 'فيروزي', gradient: 'from-teal-700 via-teal-500 to-cyan-400', ring: 'ring-teal-400' },
                  { id: 'amber', name: 'عاجي', gradient: 'from-[#8e682d] via-[#c59b58] to-[#eedbb2]', ring: 'ring-[#dfbf83]' },
                  { id: 'blue', name: 'ياقوتي', gradient: 'from-blue-700 to-indigo-500', ring: 'ring-blue-400' },
                ].map((item) => {
                  const isSelected = accentColor === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAccentColor(item.id as AccentColor)}
                      className="group flex flex-col items-center gap-1.5 py-1 px-1 transition-all active:scale-95 cursor-pointer"
                    >
                      <span
                        className={`h-7 w-7 rounded-full bg-gradient-to-tr ${item.gradient} transition-all duration-300 ${
                          isSelected
                            ? `ring-2 ${item.ring} ring-offset-2 ${isDarkEffective ? 'ring-offset-[#120324]' : 'ring-offset-white'} scale-115 shadow-lg`
                            : 'scale-90 opacity-70 group-hover:opacity-100 group-hover:scale-95'
                        }`}
                      />
                      <span className={`text-[10px] leading-tight transition-colors ${
                        isSelected
                          ? (isDarkEffective ? 'font-bold text-white' : 'font-bold text-stone-900')
                          : (isDarkEffective ? 'font-medium text-white/60' : 'font-medium text-stone-600')
                      }`}>
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 6. Mobile App & Share Section (التطبيق والمشاركة) */}
          <div className={`space-y-2 pt-3 border-t ${isDarkEffective ? 'border-white/10' : 'border-stone-200/70'}`}>
            <div className={`pr-0.5 pl-2 text-[11px] font-semibold tracking-wider transition-colors ${getDrawerSectionHeadingClass()}`}>
              التطبيق والمشاركة
            </div>

            {/* تحميل التطبيق */}
            <a
              href="https://apkpure.com/p/com.example.zaad"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm font-semibold active:scale-[0.99] transition-all ${getNavItemCardClass()}`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${getNavIconBoxClass()}`}>
                  <Smartphone size={16} />
                </div>
                <span>تطبيق زاد للأندرويد</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getThemeBadgeClass()}`}>
                APK
              </span>
            </a>

            {/* مشاركة المنصة */}
            <button
              type="button"
              onClick={handleShare}
              className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm font-semibold active:scale-[0.99] transition-all cursor-pointer ${getNavItemCardClass()}`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${getNavIconBoxClass()}`}>
                  {isCopiedShare ? <Check size={16} className="text-emerald-500" /> : <Share2 size={16} />}
                </div>
                <span>{isCopiedShare ? 'تم نسخ الرابط بنجاح!' : 'مشاركة منصة زاد'}</span>
              </div>
              <ChevronLeft size={16} className={isDarkEffective ? 'text-white/55' : 'text-stone-400'} />
            </button>

            {/* تسجيل الخروج إن وجد */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  logout();
                }}
                className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm font-semibold text-rose-500 hover:bg-rose-500/10 border-rose-500/20 active:scale-[0.99] transition-all cursor-pointer`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
                    <LogOut size={16} />
                  </div>
                  <span>تسجيل الخروج</span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className={`p-3.5 border-t shrink-0 text-center ${
          isDarkEffective ? 'border-white/10 bg-white/[0.02]' : 'border-stone-200/70 bg-white/70'
        }`}>
          <p className={`text-[11px] font-bold ${
            isDarkEffective ? 'text-white/50' : 'text-stone-500'
          }`}>
            منصة زاد للعلوم الشرعية • الإصدار الموحد
          </p>
        </div>
      </aside>

      {/* Overlay Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/40 dark:bg-black/55 backdrop-blur-sm z-[70] transition-opacity duration-300 animate-in fade-in cursor-pointer"
          title="انقر للإغلاق"
        />
      )}
    </>
  );
}
