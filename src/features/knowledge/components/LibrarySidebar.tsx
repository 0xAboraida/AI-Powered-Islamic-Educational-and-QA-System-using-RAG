import React, { useState } from 'react';
import {
  X,
  Home,
  Layers,
  User,
  Sparkles,
  Video,
  Heart,
  GraduationCap,
  Bookmark,
  ArrowUpDown
} from 'lucide-react';
import whiteLogo from '@/assets/images/WhiteLogo.png';
import darkLogo from '@/assets/images/ZadDarkLogo.png';
import { Settings, Sun, Moon, Image as ImageIcon, Layers as LayersIcon } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

export type MainTab = 'home' | 'categories' | 'authors' | 'featured' | 'media' | 'favorites' | 'courses';

interface LibrarySidebarProps {
  isOpen: boolean;
  theme: string;
  activeMainTab: MainTab;
  counts: {
    domains: number;
    authors: number;
    featured: number;
    favorites: number;
  };
  recentBook: any | null;
  onClose: () => void;
  onSelectTab: (tab: MainTab) => void;
  onReadRecentBook: (book: any) => void;
  // Filters for featured tab
  selectedCentury?: string;
  onChangeCentury?: (c: string) => void;
  availableCenturies?: { century: number; name: string; count: number }[];
  sortAsc?: boolean;
  onToggleSort?: () => void;

  // Settings props
  toggleTheme?: () => void;
  imageOpacity?: number;
  overlayOpacity?: number;
  onSettingsChange?: (imgOpacity: number, overOpacity: number) => void;
  onOpenSettings: () => void;
}

export default function LibrarySidebar({
  isOpen,
  theme,
  activeMainTab,
  counts,
  recentBook,
  onClose,
  onSelectTab,
  onReadRecentBook,
  selectedCentury = 'all',
  onChangeCentury,
  availableCenturies = [],
  sortAsc = true,
  onToggleSort,
  onOpenSettings
}: LibrarySidebarProps) {
  const { user } = useAuth();

  return (
    <>
      <aside
        className={`fixed top-0 right-0 z-[70] h-screen w-80 sm:w-96 transition-all duration-300 ease-in-out flex flex-col border-l shadow-2xl ${isOpen
          ? 'translate-x-0 pointer-events-auto visible opacity-100'
          : 'translate-x-full pointer-events-none invisible opacity-0'
          } ${theme === 'dark'
            ? 'bg-[#120526]/98 border-purple-500/30 shadow-[-20px_0_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl'
            : 'bg-white/98 border-purple-200/80 shadow-[-15px_0_45px_rgba(122,23,201,0.18)] backdrop-blur-2xl'
          }`}
      >
        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-200/60 dark:border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-magenta/20 to-brand-blue/20 border border-brand-magenta/30 p-2 flex items-center justify-center shrink-0 shadow-inner">
              <img src={theme === 'dark' ? whiteLogo : darkLogo} alt="زاد" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-black tracking-tight brand-text-gradient truncate">
                مكتبة زاد الإسلامية
              </h2>
              <p className="text-[10px] text-muted-foreground truncate">القائمة الرئيسية والتصنيفات</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            title="إغلاق القائمة الجانبية"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">

          {/* GROUP 1: الاستكشاف والتصفح العام */}
          <div>
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5 px-1">
              الاستكشاف والمعرفة
            </div>
            <div className="space-y-1.5">
              {/* 1. الرئيسية */}
              <button
                type="button"
                onClick={() => {
                  onSelectTab('home');
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${activeMainTab === 'home'
                  ? 'bg-gradient-to-r from-brand-magenta to-brand-deep text-white shadow-lg shadow-brand-magenta/30'
                  : 'text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-purple-500/20'
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <Home className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>الرئيسية</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20">استكشاف</span>
              </button>

              {/* 2. الأقسام */}
              <button
                type="button"
                onClick={() => {
                  onSelectTab('categories');
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${activeMainTab === 'categories'
                  ? 'bg-brand-magenta text-white shadow-lg shadow-brand-magenta/30'
                  : 'text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-purple-500/20'
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>الأقسام والتخصصات</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-white/20">
                  {counts.domains}
                </span>
              </button>

              {/* 3. المؤلفون */}
              <button
                type="button"
                onClick={() => {
                  onSelectTab('authors');
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${activeMainTab === 'authors'
                  ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/30'
                  : 'text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-purple-500/20'
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-brand-blue shrink-0" />
                  <span>أعلام ومؤلفو التراث</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-white/20">
                  {counts.authors}
                </span>
              </button>

              {/* 4. الكتب المختارة */}
              <button
                type="button"
                onClick={() => {
                  onSelectTab('featured');
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${activeMainTab === 'featured'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30'
                  : 'text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-purple-500/20'
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>الكتب المختارة والمعتمدة</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-white/20">
                  {counts.featured}
                </span>
              </button>
            </div>
          </div>

          {/* GROUP 2: الوسائط والتعلم */}
          <div>
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5 px-1">
              الوسائط والمسارات العلمية
            </div>
            <div className="space-y-1.5">
              {/* 5. الشروح المرئية والصوتية */}
              <button
                type="button"
                onClick={() => {
                  onSelectTab('media');
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${activeMainTab === 'media'
                  ? 'bg-gradient-to-r from-purple-600 to-brand-magenta text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-purple-500/20'
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <Video className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>الشروح المرئية والصوتية</span>
                </div>
              </button>

              {/* 6. دورات حالية */}
              <button
                type="button"
                onClick={() => {
                  onSelectTab('courses');
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${activeMainTab === 'courses'
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-600/30'
                  : 'text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-purple-500/20'
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <GraduationCap className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>دورات حالية</span>
                </div>
              </button>
            </div>
          </div>

          {/* GROUP 3: المساحة الشخصية */}
          <div>
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5 px-1">
              مساحتي العلمية
            </div>
            <div className="space-y-1.5">
              {/* 7. الكتب المفضلة */}
              <button
                type="button"
                onClick={() => {
                  onSelectTab('favorites');
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${activeMainTab === 'favorites'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/30'
                  : 'text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-purple-500/20'
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <Heart className="w-4 h-4 text-rose-400 shrink-0 fill-current" />
                  <span>الكتب المفضلة</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-white/20">
                  {counts.favorites}
                </span>
              </button>
            </div>
          </div>

          {/* Quick Filters when on Featured tab */}
          {activeMainTab === 'featured' && onChangeCentury && (
            <div className="pt-2 border-t border-slate-200/60 dark:border-white/10">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5 px-1">
                تصفية وحصر الفهرس
              </div>
              <div className="space-y-2.5">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">القرن الهجري:</label>
                  <select
                    value={selectedCentury}
                    onChange={(e) => onChangeCentury(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200/80 dark:border-white/10 text-xs font-bold outline-none focus:border-brand-magenta cursor-pointer text-foreground"
                  >
                    <option value="all">جميع القرون الهجرية</option>
                    {availableCenturies.map(c => (
                      <option key={c.century} value={c.century.toString()}>{c.name} ({c.count})</option>
                    ))}
                  </select>
                </div>

                {onToggleSort && (
                  <button
                    type="button"
                    onClick={onToggleSort}
                    className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200/80 dark:border-white/10 text-xs font-bold transition-all flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5">
                      <ArrowUpDown className="w-3.5 h-3.5 text-brand-magenta" />
                      الترتيب الهجري:
                    </span>
                    <span className="text-brand-magenta">{sortAsc ? 'الأقدم وفاة ⏳' : 'الأحدث وفاة ⌛'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Recent Book Shortcut (متابعة القراءة الأخيرة) */}
          {recentBook && (
            <div className="p-3.5 rounded-2xl bg-brand-magenta/10 border border-brand-magenta/20">
              <div className="flex items-center gap-1.5 text-xs font-bold text-brand-magenta mb-1">
                <Bookmark className="w-3.5 h-3.5" />
                <span>متابعة القراءة الأخيرة</span>
              </div>
              <h4 className="font-bold text-xs truncate text-foreground">{recentBook.title}</h4>
              <p className="text-[10px] text-muted-foreground truncate mb-2">{recentBook.author}</p>
              <button
                type="button"
                onClick={() => {
                  onReadRecentBook(recentBook);
                  onClose();
                }}
                className="w-full py-1.5 rounded-lg bg-brand-magenta text-white font-bold text-xs hover:bg-brand-deep transition-colors shadow-sm"
              >
                إكمال القراءة 📖
              </button>
            </div>
          )}

        </div>

        {/* Sidebar Footer: Profile & Settings Button */}
        <div className="p-4 border-t border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-[#0c0319]/80 shrink-0">

          <button
            onClick={onOpenSettings}
            className="w-full mb-4 flex items-center justify-between p-3 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-brand-magenta dark:hover:border-brand-magenta transition-all shadow-sm group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-black/30 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:text-brand-magenta group-hover:bg-brand-magenta/10 transition-colors">
                <Settings className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-magenta transition-colors">الإعدادات والمظهر</span>
            </div>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-blue to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
              {user?.name ? user.name.charAt(0) : 'ط'}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {user?.name || 'طالب علم'}
              </h4>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email || 'طالب@زاد.تراث'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity duration-300 animate-in fade-in cursor-pointer"
          title="انقر للإغلاق"
        />
      )}
    </>
  );
}
