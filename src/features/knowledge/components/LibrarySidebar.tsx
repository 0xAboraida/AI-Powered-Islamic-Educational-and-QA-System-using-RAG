import React from 'react';
import {
  X,
  Home,
  Layers,
  Users,
  ShieldCheck,
  Heart,
  HardDriveDownload,
  Bookmark,
  Folder,
  BookOpen,
  User,
  ChevronLeft
} from 'lucide-react';
import whiteLogo from '@/assets/images/WhiteLogo.png';
import darkLogo from '@/assets/images/ZadDarkLogo.png';
import { useTheme } from '../../../contexts/ThemeContext';
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
  onSelectNarrator
}: LibrarySidebarProps) {
  const { accentColor, isDark } = useTheme();

  // هل النمط الفعلي للشريط هو داكن (مع مراعاة سمة القارئ العاجية أو الفاتحة)
  const isDarkEffective = theme === 'dark' || (theme !== 'sepia' && theme !== 'light' && isDark);

  const getActiveTabClass = () => {
    switch (accentColor) {
      case 'emerald':
        return isDarkEffective
          ? 'bg-teal-400/15 text-teal-300 border border-teal-400/25 font-bold shadow-xs'
          : 'bg-teal-50 text-teal-900 border border-teal-200 font-extrabold shadow-xs';
      case 'amber':
        return isDarkEffective
          ? 'bg-[#dfbf83]/15 text-[#f3dfb9] border border-[#dfbf83]/25 font-bold shadow-xs'
          : 'bg-amber-50 text-[#7a5823] border border-amber-300 font-extrabold shadow-xs';
      case 'blue':
        return isDarkEffective
          ? 'bg-blue-400/15 text-blue-300 border border-blue-400/25 font-bold shadow-xs'
          : 'bg-blue-50 text-blue-900 border border-blue-200 font-extrabold shadow-xs';
      case 'purple':
      default:
        return isDarkEffective
          ? 'bg-brand-magenta/15 text-purple-300 border border-brand-magenta/25 font-bold shadow-xs'
          : 'bg-purple-50 text-purple-950 border border-purple-200 font-extrabold shadow-xs';
    }
  };

  const getActiveIconContainerClass = () => {
    switch (accentColor) {
      case 'emerald':
        return isDarkEffective
          ? 'bg-teal-500/20 text-teal-300'
          : 'bg-teal-100 text-teal-800';
      case 'amber':
        return isDarkEffective
          ? 'bg-[#b88d46]/20 text-[#f3dfb9]'
          : 'bg-amber-100 text-[#7a5823]';
      case 'blue':
        return isDarkEffective
          ? 'bg-blue-500/20 text-blue-300'
          : 'bg-blue-100 text-blue-800';
      case 'purple':
      default:
        return isDarkEffective
          ? 'bg-brand-magenta/20 text-purple-300'
          : 'bg-purple-100 text-purple-900';
    }
  };

  const getActiveBadgeClass = () => {
    switch (accentColor) {
      case 'emerald':
        return isDarkEffective
          ? 'bg-teal-500/20 text-teal-200 border border-teal-500/25 font-bold'
          : 'bg-teal-100 text-teal-900 border border-teal-300 font-bold';
      case 'amber':
        return isDarkEffective
          ? 'bg-[#b88d46]/20 text-[#f3dfb9] border border-[#b88d46]/25 font-bold'
          : 'bg-amber-100 text-[#7a5823] border border-amber-300 font-bold';
      case 'blue':
        return isDarkEffective
          ? 'bg-blue-500/20 text-blue-200 border border-blue-500/25 font-bold'
          : 'bg-blue-100 text-blue-900 border border-blue-300 font-bold';
      case 'purple':
      default:
        return isDarkEffective
          ? 'bg-brand-magenta/20 text-purple-200 border border-brand-magenta/25 font-bold'
          : 'bg-purple-100 text-purple-900 border border-purple-300 font-bold';
    }
  };

  const catalogItems: {
    id: MainTab;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
  }[] = [
    {
      id: 'home',
      label: 'الرئيسية',
      icon: <Home className="w-4 h-4" />
    },
    {
      id: 'categories',
      label: 'الكتب والأقسام',
      icon: <Layers className="w-4 h-4" />,
      badge: counts.domains > 0 ? counts.domains : undefined
    },
    {
      id: 'authors',
      label: 'المؤلفون',
      icon: <Users className="w-4 h-4" />,
      badge: counts.authors > 0 ? counts.authors : undefined
    },
    {
      id: 'narrators',
      label: 'الرواة',
      icon: <ShieldCheck className="w-4 h-4" />,
      badge: counts.narrators || '18.9K'
    }
  ];

  const myLibraryItems: {
    id: MainTab;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
  }[] = [
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
        aria-label="القائمة الجانبية للمكتبة"
        className={`fixed top-0 right-0 z-[70] h-screen w-80 sm:w-96 transition-all duration-300 ease-in-out flex flex-col border-l ${
          isOpen
            ? 'translate-x-0 pointer-events-auto visible opacity-100'
            : 'translate-x-full pointer-events-none invisible opacity-0'
        } ${
          isDarkEffective
            ? 'bg-[#10131d] border-white/10 shadow-[-10px_0_35px_rgba(0,0,0,0.4)] text-white'
            : 'bg-white border-slate-200/90 shadow-[-8px_0_30px_rgba(0,0,0,0.08)] text-slate-900'
        }`}
      >
        {/* Sidebar Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between gap-3 shrink-0 ${
          isDarkEffective ? 'border-white/10 bg-white/[0.02]' : 'border-slate-100 bg-white'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-magenta/20 to-brand-blue/20 border border-brand-magenta/30 p-2 flex items-center justify-center shrink-0 shadow-inner">
              <img
                src={isDarkEffective ? whiteLogo : darkLogo}
                alt="زاد"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <h2 className={`text-base sm:text-lg font-black tracking-tight truncate ${
                isDarkEffective ? 'text-white' : 'text-slate-900'
              }`}>
                مكتبة زاد الإسلامية
              </h2>
              <p className={`text-[11px] truncate font-medium ${
                isDarkEffective ? 'text-slate-400' : 'text-slate-500'
              }`}>
                فهرس وتصفح المكتبة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-200 active:scale-95 shadow-xs hover:scale-105 cursor-pointer ${
              isDarkEffective
                ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
            }`}
            title="إغلاق القائمة الجانبية"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        {/* Sidebar Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-5 custom-scrollbar">

          {/* GROUP 1: فهرس المكتبة */}
          <div className="space-y-1.5">
            <div className={`text-[11px] font-extrabold tracking-wider px-2 pb-0.5 ${
              isDarkEffective ? 'text-slate-400' : 'text-slate-600'
            }`}>
              فهرس المكتبة
            </div>

            <div className="space-y-1.5">
              {catalogItems.map((item) => {
                const isActive = activeMainTab === item.id;
                return (
                  <div key={item.id} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTab(item.id);
                        onClose();
                      }}
                      className={`w-full group flex items-center justify-between py-2 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer select-none ${
                        isActive
                          ? getActiveTabClass()
                          : isDarkEffective
                            ? 'border border-transparent text-slate-200 hover:bg-white/[0.06] hover:text-white'
                            : 'border border-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isActive
                              ? getActiveIconContainerClass()
                              : isDarkEffective
                                ? 'bg-white/5 text-slate-400 group-hover:text-amber-400'
                                : 'bg-slate-100 text-slate-600 group-hover:text-amber-600'
                          }`}
                        >
                          {item.icon}
                        </div>
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge !== undefined && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10.5px] font-mono shrink-0 transition-colors ${
                            isActive
                              ? getActiveBadgeClass()
                              : isDarkEffective
                                ? 'bg-white/10 text-slate-300'
                                : 'bg-slate-100 text-slate-700 border border-slate-200/80 font-bold'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>

                    {/* الهيكل الهرمي التتبعي لتحديد الموقع بدقة */}
                    {/* 1. تتبع الكتب والأقسام */}
                    {item.id === 'categories' && currentContext && (currentContext.type === 'reader' || currentContext.type === 'category') && (
                      <div className="mr-5 pr-3.5 my-2 border-r-2 border-amber-500/40 dark:border-[#dfbf83]/30 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        {/* المستوى الأول: القسم / الفن */}
                        {currentContext.category && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectCategory?.(currentContext.category!);
                              onClose();
                            }}
                            className="flex items-center justify-between gap-2 text-xs font-bold p-1.5 rounded-lg transition-colors cursor-pointer group/cat hover:bg-slate-100 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200 hover:text-amber-700 dark:hover:text-amber-300"
                            title={`تصفح قسم: ${currentContext.category}`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                              <Folder className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                              <span className="truncate text-slate-900 dark:text-white font-bold">{currentContext.category}</span>
                            </div>
                            <ChevronLeft className="w-3.5 h-3.5 text-slate-400 group-hover/cat:text-amber-600 group-hover/cat:-translate-x-0.5 transition-all shrink-0" />
                          </div>
                        )}

                        {/* المستوى الثاني: الكتاب والمؤلف */}
                        {currentContext.bookTitle && (
                          <div className={`mr-3 pr-3 border-r-2 border-amber-500/40 dark:border-amber-400/30 space-y-1 py-2 px-2.5 rounded-xl border shadow-xs ${
                            isDarkEffective
                              ? 'bg-white/[0.04] border-white/10'
                              : 'bg-amber-50/70 border-amber-200'
                          }`}>
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                <span className={`text-xs font-black truncate ${
                                  isDarkEffective ? 'text-[#f3dfb9]' : 'text-slate-900'
                                }`}>
                                  {currentContext.bookTitle}
                                </span>
                              </div>
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                تقرأ الآن
                              </span>
                            </div>
                            {currentContext.authorName && (
                              <p className={`text-[11px] pr-5 truncate font-semibold ${
                                isDarkEffective ? 'text-slate-400' : 'text-slate-600'
                              }`}>
                                {currentContext.authorName}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 2. تتبع المؤلف المختار */}
                    {item.id === 'authors' && currentContext && currentContext.type === 'author' && currentContext.authorName && (
                      <div className="mr-5 pr-3.5 my-2 border-r-2 border-amber-500/40 dark:border-[#dfbf83]/30 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className={`flex items-center justify-between gap-2 text-xs font-bold p-2 rounded-xl border shadow-xs ${
                          isDarkEffective
                            ? 'bg-white/[0.04] border-white/10 text-white'
                            : 'bg-amber-50/70 border-amber-200 text-slate-900'
                        }`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                            <User className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span className="truncate font-black text-slate-900 dark:text-white">{currentContext.authorName}</span>
                          </div>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 shrink-0">
                            المؤلف المختار
                          </span>
                        </div>
                      </div>
                    )}

                    {/* 3. تتبع الراوي المختار */}
                    {item.id === 'narrators' && currentContext && currentContext.type === 'narrator' && currentContext.narratorName && (
                      <div className="mr-5 pr-3.5 my-2 border-r-2 border-amber-500/40 dark:border-[#dfbf83]/30 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className={`flex items-center justify-between gap-2 text-xs font-bold p-2 rounded-xl border shadow-xs ${
                          isDarkEffective
                            ? 'bg-white/[0.04] border-white/10 text-white'
                            : 'bg-amber-50/70 border-amber-200 text-slate-900'
                        }`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span className="truncate font-black text-slate-900 dark:text-white">{currentContext.narratorName}</span>
                          </div>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 shrink-0">
                            الراوي المختار
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* GROUP 2: مكتبتي */}
          <div className={`space-y-1.5 pt-2 border-t ${
            isDarkEffective ? 'border-white/10' : 'border-slate-100'
          }`}>
            <div className={`text-[11px] font-extrabold tracking-wider px-2 pb-0.5 ${
              isDarkEffective ? 'text-slate-400' : 'text-slate-600'
            }`}>
              مكتبتي
            </div>

            <div className="space-y-1">
              {myLibraryItems.map((item) => {
                const isActive = activeMainTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectTab(item.id);
                      onClose();
                    }}
                    className={`w-full group flex items-center justify-between py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer select-none ${
                      isActive
                        ? getActiveTabClass()
                        : isDarkEffective
                          ? 'border border-transparent text-slate-200 hover:bg-white/[0.06] hover:text-white'
                          : 'border border-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? getActiveIconContainerClass()
                            : isDarkEffective
                              ? 'bg-white/5 text-slate-400 group-hover:text-rose-400'
                              : 'bg-slate-100 text-slate-600 group-hover:text-rose-500'
                        }`}
                      >
                        {item.icon}
                      </div>
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10.5px] font-mono shrink-0 transition-colors ${
                          isActive
                            ? getActiveBadgeClass()
                            : isDarkEffective
                              ? 'bg-white/10 text-slate-300'
                              : 'bg-slate-100 text-slate-700 border border-slate-200/80 font-bold'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent Book Shortcut (متابعة القراءة الأخيرة) */}
          {recentBook && (
            <div className={`p-3.5 rounded-2xl border space-y-2.5 shadow-xs ${
              isDarkEffective
                ? 'bg-white/[0.04] border-white/10 text-white'
                : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                <Bookmark className="w-3.5 h-3.5" />
                <span>متابعة القراءة الأخيرة</span>
              </div>
              <h4 className={`font-bold text-xs truncate ${
                isDarkEffective ? 'text-white' : 'text-slate-900'
              }`}>
                {recentBook.title}
              </h4>
              <p className={`text-[11px] truncate font-medium ${
                isDarkEffective ? 'text-slate-400' : 'text-slate-600'
              }`}>
                {recentBook.author}
              </p>
              <button
                type="button"
                onClick={() => {
                  onReadRecentBook(recentBook);
                  onClose();
                }}
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer ${
                  isDarkEffective
                    ? 'bg-white text-slate-950 hover:bg-slate-100'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                إكمال القراءة 📖
              </button>
            </div>
          )}

        </div>

        {/* Sidebar Footer */}
        <div className={`p-4 border-t shrink-0 text-center ${
          isDarkEffective ? 'border-white/10 bg-white/[0.02]' : 'border-slate-100 bg-white'
        }`}>
          <p className={`text-[11px] font-bold ${
            isDarkEffective ? 'text-slate-400' : 'text-slate-500'
          }`}>
            مكتبة زاد • الإصدار الثاني
          </p>
        </div>
      </aside>

      {/* Overlay Backdrop - زجاجي ناعم ومريح بدون تدرجات داكنة مزعجة */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/35 dark:bg-black/45 backdrop-blur-sm z-[65] transition-all duration-300 animate-in fade-in cursor-pointer"
          title="انقر للإغلاق"
        />
      )}
    </>
  );
}
