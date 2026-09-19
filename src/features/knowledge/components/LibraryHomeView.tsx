import React, { useRef } from 'react';
import { 
  BookOpen, 
  Layers, 
  User, 
  Sparkles, 
  Video, 
  GraduationCap, 
  Heart, 
  ArrowLeft, 
  ArrowRight,
  Bookmark, 
  Play, 
  FileText,
  Clock,
  Compass,
  Scale,
  HeartHandshake,
  BookOpenText,
  Languages,
  Award,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Course, MediaPlaylist } from '../types/mediaTypes';
import IslamicPattern from './IslamicPattern';
import HomeChartsSection from './HomeChartsSection';

export interface DomainItem {
  name: string;
  count: number;
  id?: string;
}

interface LibraryHomeViewProps {
  recentBook: any | null;
  featuredBooks: any[];
  liveStats: {
    total_books: number;
    total_authors: number;
    total_domains: number;
    timeline?: {
      earliest_century?: number;
      latest_century?: number;
    };
  };
  availableDomains?: DomainItem[];
  selectedDomain?: string;
  onSelectDomain?: (domainName: string) => void;
  featuredPlaylist?: MediaPlaylist;
  activeCourse?: Course;
  favoritesCount: number;
  onNavigateTab: (tab: 'categories' | 'authors' | 'featured' | 'media' | 'favorites' | 'courses') => void;
  onReadBook: (book: any) => void;
  onOpenLinkedBook?: (bookTitle: string) => void;
}

export default function LibraryHomeView({
  recentBook,
  featuredBooks,
  liveStats,
  availableDomains = [],
  selectedDomain = 'all',
  onSelectDomain,
  featuredPlaylist,
  activeCourse,
  favoritesCount,
  onNavigateTab,
  onReadBook,
  onOpenLinkedBook
}: LibraryHomeViewProps) {
  const domainsScrollRef = useRef<HTMLDivElement>(null);

  // Scroll handler for horizontal domains list
  const scrollDomains = (direction: 'left' | 'right') => {
    if (domainsScrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      domainsScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Helper to get domain-specific icon and theme colors matching Image 1
  const getDomainStyle = (domainName: string) => {
    const lower = domainName.toLowerCase();
    
    if (lower.includes('عقيدة') || lower.includes('توحيد')) {
      return {
        icon: <Heart className="w-7 h-7 text-purple-600 dark:text-purple-400" />,
        bgColor: 'bg-purple-500/10',
        textColor: 'text-purple-600 dark:text-purple-400',
        accentBorder: 'border-purple-400/80',
        glow: 'shadow-purple-500/15'
      };
    }
    if (lower.includes('فقه') || lower.includes('مذهب') || lower.includes('فتاوى') || lower.includes('قضاء')) {
      return {
        icon: <Scale className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />,
        bgColor: 'bg-emerald-500/10',
        textColor: 'text-purple-600 dark:text-purple-400', // Matches Image 1 where Fiqh has purple title
        accentBorder: 'border-purple-400',
        glow: 'shadow-purple-500/20'
      };
    }
    if (lower.includes('حديث') || lower.includes('سنة') || lower.includes('أثر') || lower.includes('صحاح')) {
      return {
        icon: <BookOpen className="w-7 h-7 text-blue-600 dark:text-blue-400" />,
        bgColor: 'bg-blue-500/10',
        textColor: 'text-blue-600 dark:text-blue-400',
        accentBorder: 'border-blue-400/80',
        glow: 'shadow-blue-500/15'
      };
    }
    if (lower.includes('قرآن') || lower.includes('تفسير') || lower.includes('قراءات')) {
      return {
        icon: <Sparkles className="w-7 h-7 text-amber-500 dark:text-amber-400" />,
        bgColor: 'bg-amber-500/10',
        textColor: 'text-amber-600 dark:text-amber-400',
        accentBorder: 'border-amber-400/80',
        glow: 'shadow-amber-500/15'
      };
    }
    if (lower.includes('لغة') || lower.includes('نحو') || lower.includes('صرف') || lower.includes('أدب')) {
      return {
        icon: <Languages className="w-7 h-7 text-teal-600 dark:text-teal-400" />,
        bgColor: 'bg-teal-500/10',
        textColor: 'text-teal-600 dark:text-teal-400',
        accentBorder: 'border-teal-400/80',
        glow: 'shadow-teal-500/15'
      };
    }
    if (lower.includes('سيرة') || lower.includes('تاريخ') || lower.includes('تراجم')) {
      return {
        icon: <Clock className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />,
        bgColor: 'bg-indigo-500/10',
        textColor: 'text-indigo-600 dark:text-indigo-400',
        accentBorder: 'border-indigo-400/80',
        glow: 'shadow-indigo-500/15'
      };
    }

    // Default fallback style
    return {
      icon: <Layers className="w-7 h-7 text-brand-magenta" />,
      bgColor: 'bg-brand-magenta/10',
      textColor: 'text-brand-magenta',
      accentBorder: 'border-brand-magenta/80',
      glow: 'shadow-brand-magenta/15'
    };
  };

  // Fallback default 4 main domains matching Image 1 if availableDomains is empty
  const displayDomains = availableDomains.length > 0 ? availableDomains : [
    { name: 'العقيدة الإسلامية', count: 24 },
    { name: 'الفقه وأصوله', count: 42 },
    { name: 'الحديث الشريف', count: 28 },
    { name: 'علوم القرآن والتفسير', count: 18 },
  ];

  const handleDomainCardClick = (domainName: string) => {
    if (onSelectDomain) {
      onSelectDomain(domainName);
    }
    onNavigateTab('categories');
  };

  return (
    <div className="relative animate-in fade-in duration-300 space-y-12">
      
      {/* ========================================================================= */}
      {/* 1. DOMAINS SECTION: Title + Full-Width Line + Side-by-Side Cards           */}
      {/* ========================================================================= */}
      <section id="library-domains-section" className="relative z-10 space-y-5 scroll-mt-6">
        {/* Title and Controls */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="inline-flex flex-col items-start">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                المجالات والعلوم الشرعية
              </h2>
            </div>
            {/* الخط ممتد تحت الجملة كاملة */}
            <div className="w-full h-1.5 bg-gradient-to-l from-purple-600 via-brand-magenta to-purple-400 rounded-full mt-2 shadow-sm" />
          </div>

          {/* Navigation Controls: Horizontal scroll arrows */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollDomains('right')}
              className="w-9 h-9 rounded-xl bg-white dark:bg-[#180930] border border-slate-200/80 dark:border-purple-500/30 text-slate-700 dark:text-slate-200 hover:bg-brand-magenta hover:text-white hover:border-brand-magenta transition-all shadow-sm flex items-center justify-center cursor-pointer active:scale-95"
              title="التمرير لليمين"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollDomains('left')}
              className="w-9 h-9 rounded-xl bg-white dark:bg-[#180930] border border-slate-200/80 dark:border-purple-500/30 text-slate-700 dark:text-slate-200 hover:bg-brand-magenta hover:text-white hover:border-brand-magenta transition-all shadow-sm flex items-center justify-center cursor-pointer active:scale-95"
              title="التمرير لليسار"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('categories')}
              className="px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-brand-magenta hover:text-white text-purple-600 dark:text-purple-300 text-xs font-bold transition-all flex items-center gap-1.5 mr-2 cursor-pointer"
            >
              <span>عرض كل الأقسام ({displayDomains.length})</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Side-by-Side Cards (جنب بعض) Container */}
        <div 
          ref={domainsScrollRef}
          className="flex items-stretch gap-4 sm:gap-5 overflow-x-auto pb-4 pt-2 px-1 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-purple-500/20 hover:[&::-webkit-scrollbar-thumb]:bg-purple-500/40"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {displayDomains.map((domain) => {
            const style = getDomainStyle(domain.name);
            const isSelected = selectedDomain === domain.name;

            return (
              <div
                key={domain.name}
                onClick={() => handleDomainCardClick(domain.name)}
                style={{ scrollSnapAlign: 'start' }}
                className={`group cursor-pointer shrink-0 w-[200px] sm:w-[230px] rounded-3xl p-5 sm:p-6 transition-all duration-300 flex flex-col items-center justify-between text-center select-none ${
                  isSelected
                    ? 'bg-white dark:bg-[#16082e] border-2 border-purple-500 shadow-lg shadow-purple-500/15 scale-[1.02]'
                    : 'bg-white dark:bg-[#16082e] border border-slate-200/80 dark:border-purple-500/20 shadow-sm hover:shadow-xl hover:border-purple-400/60 hover:-translate-y-1'
                }`}
              >
                {/* 1. Icon in Soft Rounded Square Container (كما في الصورة 1) */}
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 shadow-sm ${style.bgColor}`}>
                  {style.icon}
                </div>

                {/* 2. Bold Domain Title (كما في الصورة 1) */}
                <div className="w-full mb-3">
                  <h3 className={`font-black text-sm sm:text-base leading-snug truncate transition-colors ${
                    isSelected 
                      ? 'text-purple-600 dark:text-purple-400' 
                      : 'text-slate-800 dark:text-white group-hover:text-purple-600'
                  }`}>
                    {domain.name}
                  </h3>
                  <span className="text-[11px] font-mono text-muted-foreground opacity-80">
                    {domain.count} مصنفاً
                  </span>
                </div>

                {/* 3. Action Sublink with Arrow: "استكشف الكتب ←" (كما في الصورة 1) */}
                <div className="pt-3 border-t border-slate-100 dark:border-white/5 w-full flex items-center justify-center gap-1.5 text-xs font-bold text-muted-foreground group-hover:text-purple-600 transition-colors">
                  <span>استكشف الكتب</span>
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. ANALYTICS & CHARTS SECTION (قسم الإحصائيات والرسوم البيانية)              */}
      {/* ========================================================================= */}
      <section className="relative z-10">
        <HomeChartsSection 
          stats={liveStats}
          domainStats={displayDomains}
          onSelectDomain={handleDomainCardClick}
        />
      </section>

      {/* ========================================================================= */}
      {/* 5. SPOTLIGHT: ACTIVE COURSE & MEDIA PLAYLISTS                             */}
      {/* ========================================================================= */}
      <section className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spotlight 1: الدورة الحالية - الفقه الميسر للشيخ علاء حامد */}
        {activeCourse && (
          <div className="rounded-3xl border border-slate-200/80 dark:border-purple-500/20 bg-white/90 dark:bg-[#14062b]/90 p-5 sm:p-6 shadow-sm backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold">
                  {activeCourse.badgeLabel}
                </span>
                <span className="text-xs text-muted-foreground font-bold">
                  {activeCourse.totalLessons} محاضرة
                </span>
              </div>

              <h4 className="text-lg font-black text-foreground mb-2">
                {activeCourse.title}
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                {activeCourse.description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onNavigateTab('courses')}
                className="py-2 px-4 rounded-xl bg-brand-magenta text-white text-xs font-bold hover:bg-brand-deep transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>الانتقال لصفحة الدورة</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>

              <a
                href={activeCourse.playlistUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-brand-blue hover:underline"
              >
                فتح على يوتيوب ↗
              </a>
            </div>
          </div>
        )}

        {/* Spotlight 2: شرح الفقه الميسر للشيخ علاء حامد */}
        {featuredPlaylist && (
          <div className="rounded-3xl border border-slate-200/80 dark:border-purple-500/20 bg-white/90 dark:bg-[#14062b]/90 p-5 sm:p-6 shadow-sm backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-brand-magenta/10 text-brand-magenta text-xs font-bold">
                  سلسلة فقهية مميزة
                </span>
                <span className="text-xs text-brand-blue font-bold">
                  {featuredPlaylist.sheikhName}
                </span>
              </div>

              <h4 className="text-lg font-black text-foreground mb-2">
                {featuredPlaylist.title}
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                {featuredPlaylist.description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onNavigateTab('media')}
                className="py-2 px-4 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-brand-magenta hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>بروفايل الشيخ والشروحات</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>

              {featuredPlaylist.linkedBook && onOpenLinkedBook && (
                <button
                  type="button"
                  onClick={() => onOpenLinkedBook(featuredPlaylist.linkedBook!.bookTitle)}
                  className="text-xs font-bold text-brand-magenta hover:underline cursor-pointer"
                >
                  قراءة متن الفقه الميسر 📖
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 6. FEATURED CLASSICAL BOOKS ROW (أمهات الكتب المختارة)                     */}
      {/* ========================================================================= */}
      {featuredBooks.length > 0 && (
        <section className="relative z-10 space-y-4 pt-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                من أمهات الكتب المختارة
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('featured')}
              className="text-xs font-bold text-brand-magenta hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>عرض جميع المختارة ({featuredBooks.length})</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredBooks.slice(0, 4).map((book) => (
              <div
                key={book.id || book.title}
                className="rounded-2xl border border-slate-200/80 dark:border-purple-500/20 bg-white/90 dark:bg-[#150628]/90 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between backdrop-blur-sm"
              >
                <div>
                  <h5 className="font-bold text-sm text-foreground truncate mb-1">
                    {book.title}
                  </h5>
                  <p className="text-xs text-muted-foreground truncate mb-3">
                    {book.author}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onReadBook(book)}
                  className="w-full py-2 rounded-xl bg-brand-magenta/10 hover:bg-brand-magenta hover:text-white text-brand-magenta text-xs font-bold transition-colors text-center cursor-pointer"
                >
                  تصفح الكتاب 📖
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
