import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  BookOpen, Library, Search, X, Pen, FileText, User, Info,
  ChevronUp, Loader2, Sparkles, LayoutGrid, List, ArrowUpDown,
  Calendar, Layers, Award, BookMarked, Clock, ChevronDown,
  GraduationCap, ChevronLeft, ArrowRight, BookCheck, ArrowLeft,
  Menu, Bookmark, PanelLeftClose, PanelLeftOpen, RotateCcw,
  Heart, Sun, Moon, Hash
} from 'lucide-react'
import whiteLogo from '@/assets/images/WhiteLogo.png'
import darkLogo from '@/assets/images/ZadDarkLogo.png'
import libraryBgLight from '@/assets/images/library background light 3.png'
import libraryBgDark from '@/assets/images/library background Sunset 1.png'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { AuthorBiographyModal } from '../../components/common/AuthorBiographyModal'
import TurathReader from './TurathReader'
import LibrarySidebar from './components/LibrarySidebar'
import SettingsModal from './components/SettingsModal'
import LibraryHomeView from './components/LibraryHomeView'
import IslamicPattern from './components/IslamicPattern'
import MediaExplanationsView from './components/MediaExplanationsView'
import CurrentCoursesView from './components/CurrentCoursesView'
import FavoriteBooksView from './components/FavoriteBooksView'
import { INITIAL_SHEIKHS, INITIAL_PLAYLISTS, INITIAL_STANDALONE, INITIAL_COURSES } from './data/mediaData'
import { Sheikh, MediaPlaylist, MediaStandalone, Course } from './types/mediaTypes'
import { domains as initialDomainsData } from './data'

export type BookMeta = {
  id: number;
  title: string;
  name?: string;
  author: string;
  author_name?: string;
  author_id?: number;
  category?: string;
  cat_name?: string;
  infoText?: string;
  book_info_text?: string;
  info?: string;
  authorBioText?: string;
  author_bio_text?: string;
  death_year?: number | null;
  century?: number | string | null;
  century_name?: string;
};

const normalizeBook = (b: any): BookMeta => {
  const title = (b.title || b.name || '').trim();
  const author = (b.author || b.author_name || '').trim();
  const category = (b.category || b.cat_name || 'عام').trim();
  const infoText = (b.infoText || b.book_info_text || b.info || '').trim();
  const authorBioText = (b.authorBioText || b.author_bio_text || '').trim();
  return {
    ...b,
    id: b.id,
    title: title || 'بدون عنوان',
    name: title || 'بدون عنوان',
    author: author || 'من غير معروف',
    author_name: author || 'من غير معروف',
    category: category || 'عام',
    cat_name: category || 'عام',
    infoText,
    book_info_text: infoText,
    info: infoText,
    authorBioText,
    author_bio_text: authorBioText,
    death_year: b.death_year ?? null,
    century: b.century ?? null,
    century_name: b.century_name || undefined,
  };
};

const FALLBACK_BOOKS: BookMeta[] = initialDomainsData.flatMap((dom, dIdx) =>
  dom.categories.flatMap((cat, cIdx) =>
    cat.books.map((b, bIdx) => ({
      id: dIdx * 1000 + cIdx * 100 + bIdx + 1,
      title: b.title,
      name: b.title,
      author: b.author,
      author_name: b.author,
      category: cat.name,
      cat_name: cat.name,
      infoText: `كتاب ${b.title} في ${dom.name} (${cat.name}) للمؤلف ${b.author}`,
      book_info_text: `كتاب ${b.title} في ${dom.name} (${cat.name}) للمؤلف ${b.author}`,
      info: `كتاب ${b.title} في ${dom.name} (${cat.name}) للمؤلف ${b.author}`,
      authorBioText: `العالم والمصنف ${b.author}`,
      author_bio_text: `العالم والمصنف ${b.author}`,
      death_year: null,
      century: null
    }))
  )
);

export type LibraryAnalytics = {
  total_books: number;
  total_authors: number;
  total_domains: number;
  domains: { name: string; count: number }[];
  centuries: { century: number; name: string; count: number }[];
  timeline?: {
    earliest_death?: number;
    latest_death?: number;
    earliest_century?: number;
    latest_century?: number;
  };
};

export type MainTab = 'home' | 'categories' | 'authors' | 'featured' | 'media' | 'favorites' | 'courses';

const CENTURY_NAMES_MAP: Record<number, string> = {
  1: "القرن الأول هـ",
  2: "القرن الثاني هـ",
  3: "القرن الثالث هـ",
  4: "القرن الرابع هـ",
  5: "القرن الخامس هـ",
  6: "القرن السادس هـ",
  7: "القرن السابع هـ",
  8: "القرن الثامن هـ",
  9: "القرن التاسع هـ",
  10: "القرن العاشر هـ",
  11: "القرن الحادي عشر هـ",
  12: "القرن الثاني عشر هـ",
  13: "القرن الثالث عشر هـ",
  14: "القرن الرابع عشر هـ",
  15: "القرن الخامس عشر هـ (المعاصر)",
};

// Fallback death year & century extractor with robust generic commentary isolation
function inferCenturyAndDeath(book: BookMeta): { deathYear: number | null; century: number | null; centuryName: string } {
  // If backend already provided century/death_year
  if (book.death_year || book.century) {
    let c: number | null = null;
    if (typeof book.century === 'number') {
      c = book.century;
    } else if (typeof book.century === 'string') {
      const parsed = parseInt(book.century, 10);
      c = isNaN(parsed) ? null : parsed;
    } else if (book.death_year) {
      c = Math.floor((book.death_year - 1) / 100) + 1;
    }
    return {
      deathYear: book.death_year || null,
      century: c,
      centuryName: book.century_name || (c ? CENTURY_NAMES_MAP[c] || `القرن ${c} هـ` : 'غير محدد')
    };
  }

  const arToEn = (str: string) => str.replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
  const authorBio = arToEn(book.authorBioText || book.author_bio_text || '');
  const bookInfo = arToEn(book.infoText || book.book_info_text || book.info || '');
  const bookTitle = (book.title || book.name || '').trim();

  const extractYear = (text: string) => {
    if (!text) return null;
    const m = text.match(/(?:ت|توفي|وفاته|المتوفى|المتوفى سنة|عام)\s*[:\s]?\s*(\d{1,4})\s*(?:هـ|هـ\b|\))/);
    if (m) {
      const y = parseInt(m[1], 10);
      if (y >= 10 && y <= 1450) return y;
    }
    const m2 = text.match(/[\(–\-]\s*(?:\d{1,4}\s*[\-–]\s*)?(\d{1,4})\s*هـ/);
    if (m2) {
      const y = parseInt(m2[1], 10);
      if (y >= 10 && y <= 1450) return y;
    }
    return null;
  };

  // 1. Primary Authority: Author's own biography
  const yAuthor = extractYear(authorBio);
  if (yAuthor) {
    const c = Math.floor((yAuthor - 1) / 100) + 1;
    return { deathYear: yAuthor, century: c, centuryName: CENTURY_NAMES_MAP[c] || `القرن ${c} هـ` };
  }

  // 2. Contemporary scholar by birth
  const mBirth = authorBio.match(/(?:ولد|ميلاده)\s*(?:في|عام|سنة)?\s*(\d{4})\s*(?:هـ|هجرية|م|ميلادية)?/);
  if (mBirth) {
    const by = parseInt(mBirth[1], 10);
    if (by >= 1300 || by >= 1900) {
      return { deathYear: null, century: 15, centuryName: CENTURY_NAMES_MAP[15] };
    }
  }

  // 3. Contemporary markers in biography
  if (/حفظه الله|أطال الله عمره|رعاه الله|معاصر|عضو هيئة كبار|جامعة الإمام|الجامعة الإسلامية/.test(authorBio)) {
    return { deathYear: null, century: 15, centuryName: CENTURY_NAMES_MAP[15] };
  }

  // 4. Commentary Isolation Rule:
  // If the work is a commentary/sharh/hashiya, book_info describes the original text author
  // and must NOT be attributed to the commentator.
  const isCommentary = /شرح|حاشية|تعليق|تقرير|دروس|فوائد|إملاء|تلخيص|تهذيب/.test(bookTitle);
  if (isCommentary) {
    return { deathYear: null, century: 15, centuryName: CENTURY_NAMES_MAP[15] };
  }

  // 5. Original works fallback to book_info
  const yBook = extractYear(bookInfo);
  if (yBook) {
    const c = Math.floor((yBook - 1) / 100) + 1;
    return { deathYear: yBook, century: c, centuryName: CENTURY_NAMES_MAP[c] || `القرن ${c} هـ` };
  }

  return { deathYear: null, century: null, centuryName: 'غير محدد' };
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
// Component: Book Card
// -------------------------------------------------------------
function BookCard({
  book,
  viewMode,
  onAsk,
  onRead,
  onOpenAuthorBio,
  onOpenBookInfo,
  isFavorite,
  onToggleFavorite
}: {
  book: BookMeta;
  viewMode: 'grid' | 'list';
  onAsk: (b: BookMeta) => void;
  onRead: (b: BookMeta) => void;
  onOpenAuthorBio?: (b: BookMeta) => void;
  onOpenBookInfo: (b: BookMeta) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (b: BookMeta) => void;
}) {
  const { deathYear, centuryName } = useMemo(() => inferCenturyAndDeath(book), [book]);

  // GRID VIEW CARD
  if (viewMode === 'grid') {
    return (
      <div className="group relative rounded-2xl border border-slate-200/80 dark:border-purple-500/20 bg-white dark:bg-[#150628]/90 p-5 shadow-sm hover:shadow-xl hover:border-brand-magenta/40 dark:hover:border-purple-500/50 transition-all duration-300 flex flex-col justify-between overflow-hidden">
        <div className="pointer-events-none absolute -right-16 -top-16 w-32 h-32 rounded-full bg-brand-magenta/5 group-hover:bg-brand-magenta/15 blur-2xl transition-all duration-500" />

        <div>
          {/* Row 1: Book Title + Favorite Button */}
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-magenta/10 to-brand-blue/10 dark:from-brand-magenta/20 dark:to-brand-blue/20 flex items-center justify-center text-brand-magenta shrink-0 group-hover:scale-105 group-hover:bg-brand-magenta group-hover:text-white transition-all shadow-sm mt-0.5">
                <BookOpen className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-base sm:text-lg text-slate-800 dark:text-slate-100 group-hover:text-brand-magenta transition-colors leading-snug line-clamp-2">
                  {book.title}
                </h4>
              </div>
            </div>

            {onToggleFavorite && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(book);
                }}
                className={`p-1.5 rounded-xl transition-all shrink-0 active:scale-90 ${isFavorite
                  ? 'text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 shadow-xs'
                  : 'text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-white/10'
                  }`}
                title={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current text-rose-500' : ''}`} />
              </button>
            )}
          </div>

          {/* Row 2: Author Name + Category Badge + Century Badge */}
          <div className="flex items-center gap-2 flex-wrap mb-4 pr-1">
            {onOpenAuthorBio && book.author && book.author !== 'من غير معروف' ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAuthorBio(book);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-brand-magenta transition-colors group/author outline-none text-right shrink-0"
                title="عرض ترجمة وسيرة المؤلف"
              >
                <User className="h-3.5 w-3.5 shrink-0 group-hover/author:scale-110 transition-transform text-slate-400" />
                <span className="font-semibold group-hover/author:underline decoration-brand-magenta/50 underline-offset-4">
                  {book.author}
                </span>
              </button>
            ) : (
              <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                <Pen className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="font-semibold">{book.author}</span>
              </p>
            )}

            {book.category && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-brand-magenta/10 text-brand-magenta border border-brand-magenta/20 shrink-0">
                <Layers className="w-3 h-3" />
                {book.category}
              </span>
            )}
            {centuryName && centuryName !== 'غير محدد' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shrink-0" title={`توفي: ${deathYear ? deathYear + ' هـ' : 'المعاصر'}`}>
                <Calendar className="w-3 h-3" />
                {centuryName}
                {deathYear && <span className="opacity-75 font-mono">({deathYear}هـ)</span>}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onRead(book)}
              className="flex-1 py-2 px-3 rounded-xl bg-brand-magenta text-white text-xs font-bold hover:bg-brand-deep transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-brand-magenta/20 active:scale-95"
              title="تصفح وقراءة الكتاب"
            >
              <FileText className="w-3.5 h-3.5" />
              تصفح
            </button>

            <button
              type="button"
              onClick={() => onAsk(book)}
              className="py-2 px-3 rounded-xl border border-brand-magenta/30 bg-brand-magenta/5 text-brand-magenta hover:bg-brand-magenta/15 text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
              title="سؤال المساعد الذكي حول الكتاب"
            >
              <Sparkles className="w-3.5 h-3.5" />
              اسأل زاد
            </button>

            <button
              type="button"
              onClick={() => onOpenBookInfo(book)}
              className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-muted-foreground hover:text-brand-magenta hover:bg-brand-magenta/10 hover:border-brand-magenta/30 transition-all flex items-center justify-center"
              title="تفاصيل ومعلومات الكتاب"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // LIST VIEW ROW
  return (
    <div className="group rounded-2xl border border-slate-200/80 dark:border-purple-500/20 bg-white dark:bg-[#150628]/90 p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-brand-magenta/40 dark:hover:border-purple-500/50 transition-all duration-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

        {/* Book Details */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-magenta/10 to-brand-blue/10 dark:from-brand-magenta/20 dark:to-brand-blue/20 flex items-center justify-center text-brand-magenta shrink-0 group-hover:bg-brand-magenta group-hover:text-white transition-all shadow-sm">
            <BookOpen className="w-6 h-6" />
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-base sm:text-lg text-slate-800 dark:text-slate-100 group-hover:text-brand-magenta transition-colors mb-1.5 truncate">
              {book.title}
            </h4>

            <div className="flex items-center gap-2 flex-wrap">
              {onOpenAuthorBio && book.author && book.author !== 'من غير معروف' ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenAuthorBio(book);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-brand-magenta transition-colors group/author outline-none text-right shrink-0"
                  title="عرض ترجمة وسيرة المؤلف"
                >
                  <User className="h-3.5 w-3.5 shrink-0 group-hover/author:scale-110 transition-transform text-slate-400" />
                  <span className="group-hover/author:underline decoration-brand-magenta/50 underline-offset-4">
                    {book.author}
                  </span>
                </button>
              ) : (
                <p className="inline-flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Pen className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span>{book.author}</span>
                </p>
              )}

              {book.category && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-brand-magenta/10 text-brand-magenta border border-brand-magenta/20 shrink-0">
                  <Layers className="w-3 h-3" />
                  {book.category}
                </span>
              )}
              {centuryName && centuryName !== 'غير محدد' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shrink-0" title={`توفي: ${deathYear ? deathYear + ' هـ' : 'المعاصر'}`}>
                  <Calendar className="w-3 h-3" />
                  {centuryName}
                  {deathYear && <span className="font-mono">({deathYear}هـ)</span>}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Left Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-white/5">
          <button
            type="button"
            onClick={() => onRead(book)}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-brand-magenta text-white text-xs sm:text-sm font-bold hover:bg-brand-deep transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-brand-magenta/20 active:scale-95"
            title="تصفح وقراءة الكتاب"
          >
            <FileText className="w-4 h-4" /> <span>تصفح</span>
          </button>

          <button
            type="button"
            onClick={() => onAsk(book)}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-brand-magenta/30 bg-brand-magenta/5 text-brand-magenta hover:bg-brand-magenta/15 text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
            title="اسأل زاد"
          >
            <Sparkles className="w-4 h-4" /> <span>اسأل زاد</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenBookInfo(book)}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-muted-foreground hover:text-brand-magenta hover:bg-brand-magenta/10 hover:border-brand-magenta/30 transition-all flex items-center justify-center"
            title="معلومات وتفاصيل الكتاب"
          >
            <Info className="w-4 h-4" />
          </button>

          {onToggleFavorite && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(book);
              }}
              className={`p-2 sm:p-2.5 rounded-xl border transition-all flex items-center justify-center active:scale-90 ${isFavorite
                ? 'border-rose-500/30 text-rose-500 bg-rose-500/10'
                : 'border-slate-200 dark:border-white/10 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10'
                }`}
              title={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current text-rose-500' : ''}`} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Component: Skeletons for Loading
// -------------------------------------------------------------
function SkeletonList({ viewMode }: { viewMode: 'grid' | 'list' }) {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="animate-pulse rounded-2xl border border-slate-200 dark:border-white/10 bg-card/60 p-5 space-y-4">
            <div className="flex justify-between">
              <div className="h-5 w-24 rounded bg-slate-200 dark:bg-white/10" />
              <div className="h-5 w-20 rounded bg-slate-200 dark:bg-white/10" />
            </div>
            <div className="h-6 w-3/4 rounded bg-slate-300 dark:bg-white/20" />
            <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-white/10" />
            <div className="pt-3 flex gap-2">
              <div className="h-9 flex-1 rounded-xl bg-slate-200 dark:bg-white/10" />
              <div className="h-9 flex-1 rounded-xl bg-slate-200 dark:bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-slate-200 dark:border-white/10 bg-card/60 p-5">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-slate-200 dark:bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-1/3 rounded bg-slate-300 dark:bg-white/20" />
              <div className="h-4 w-1/4 rounded bg-slate-200 dark:bg-white/10" />
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-20 rounded-xl bg-slate-200 dark:bg-white/10" />
              <div className="h-9 w-24 rounded-xl bg-slate-200 dark:bg-white/10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// -------------------------------------------------------------
// MAIN KNOWLEDGE BASE COMPONENT
// -------------------------------------------------------------
export default function KnowledgeBase({
  onExit,
  onAskBook,
  onLogin,
  onNavigateGlobal,
  initialTab = 'home',
}: {
  onExit: () => void
  onAskBook: (book: any) => void
  onLogin?: () => void
  onNavigateGlobal?: (view: any) => void
  initialTab?: MainTab
}) {
  const { theme, toggleTheme } = useTheme()
  const { isAuthenticated, user } = useAuth()
  const isDark = theme === 'dark';

  // Settings for Image Opacity & Overlay
  const [lightSettings, setLightSettings] = useState({ imageOpacity: 100, overlayOpacity: 0 });
  const [darkSettings, setDarkSettings] = useState({ imageOpacity: 30, overlayOpacity: 85 });

  // Load settings on mount
  useEffect(() => {
    try {
      const savedLight = localStorage.getItem('zad_bg_light_settings');
      if (savedLight) setLightSettings(JSON.parse(savedLight));
      const savedDark = localStorage.getItem('zad_bg_dark_settings');
      if (savedDark) setDarkSettings(JSON.parse(savedDark));
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

  // Default tab initialized from prop
  const [activeMainTab, setActiveMainTab] = useState<MainTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveMainTab(initialTab);
    }
  }, [initialTab]);

  // Scroll Listener for Navbar Activation across all library views (يظهر فقط عند اختفاء شريط البحث تماماً من الشاشة)
  const [isScrolledPastSearch, setIsScrolledPastSearch] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const searchEl = document.getElementById('hero-main-search-bar') || document.getElementById('subpage-main-search-bar');
      if (searchEl) {
        const rect = searchEl.getBoundingClientRect();
        // The navbar should appear ONLY when the search bar has completely disappeared from the screen (rect.bottom <= 10)
        setIsScrolledPastSearch(rect.bottom <= 10);
      } else {
        setIsScrolledPastSearch(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      document.removeEventListener('scroll', handleScroll);
    };
  }, [activeMainTab]);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>(() => {
    try {
      const saved = localStorage.getItem('zad_font_size');
      if (saved === 'small' || saved === 'medium' || saved === 'large') return saved;
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

  // Tab 2 (الأقسام) State
  const [openCategory, setOpenCategory] = useState<string | null>(null)
  const [closedCategories, setClosedCategories] = useState<Set<string>>(new Set())
  const [categorySearch, setCategorySearch] = useState<string>('')
  const [categoriesViewMode, setCategoriesViewMode] = useState<'grid' | 'list'>('list') // 'list' = فوق بعض, 'grid' = جنب بعض

  // Tab 3 (المؤلفون) State
  const [openCentury, setOpenCentury] = useState<number | null>(null)
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null)
  const [authorSearch, setAuthorSearch] = useState<string>('')
  const [authorsViewMode, setAuthorsViewMode] = useState<'grid' | 'list'>('list') // 'list' = فوق بعض, 'grid' = جنب بعض

  // Unified Search Handler across tabs
  const currentSearchValue = activeMainTab === 'categories' ? categorySearch : activeMainTab === 'authors' ? authorSearch : query;
  const [isHomeSearchResultsDismissed, setIsHomeSearchResultsDismissed] = useState(false);

  const handleSearchChange = (val: string) => {
    setCategorySearch(val);
    setAuthorSearch(val);
    setQuery(val);
    setClosedCategories(new Set());
    setIsHomeSearchResultsDismissed(false);
  };

  // Dropdown Popovers State (لقائمتي القسم والمؤلف المنبثقتين في طرف السيرش بار)
  const [isDomainPickerOpen, setIsDomainPickerOpen] = useState(false);
  const [isAuthorPickerOpen, setIsAuthorPickerOpen] = useState(false);
  const domainPickerRef = useRef<HTMLDivElement>(null);
  const authorPickerRef = useRef<HTMLDivElement>(null);
  const [authorFilterQuery, setAuthorFilterQuery] = useState('');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (domainPickerRef.current && !domainPickerRef.current.contains(event.target as Node)) {
        setIsDomainPickerOpen(false);
      }
      if (authorPickerRef.current && !authorPickerRef.current.contains(event.target as Node)) {
        setIsAuthorPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Book Info Floating Modal State
  const [activeInfoBook, setActiveInfoBook] = useState<BookMeta | null>(null)
  const [modalInfoText, setModalInfoText] = useState<string | null>(null)
  const [loadingInfo, setLoadingInfo] = useState(false)

  // Featured Books Set (المختارة)
  const [featuredBookIds, setFeaturedBookIds] = useState<Set<number | string>>(() => {
    try {
      const saved = localStorage.getItem('zad_featured_book_ids')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) return new Set(parsed)
      }
    } catch (e) { }
    return new Set()
  })

  useEffect(() => {
    const syncFeatured = () => {
      try {
        const saved = localStorage.getItem('zad_featured_book_ids')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) setFeaturedBookIds(new Set(parsed))
        } else {
          setFeaturedBookIds(new Set())
        }
      } catch (e) { }
    }
    window.addEventListener('zad_featured_books_changed', syncFeatured)
    window.addEventListener('storage', syncFeatured)
    return () => {
      window.removeEventListener('zad_featured_books_changed', syncFeatured)
      window.removeEventListener('storage', syncFeatured)
    }
  }, [])

  // Data & Analytics State
  const [publishedBooks, setPublishedBooks] = useState<BookMeta[]>(() => {
    try {
      const cachedBooksStr = localStorage.getItem('zad_cached_library_books_v5') || localStorage.getItem('zad_cached_library_books_v4');
      if (cachedBooksStr) {
        const cached = JSON.parse(cachedBooksStr);
        if (Array.isArray(cached) && cached.length > 0) {
          return cached.map(normalizeBook);
        }
      }
    } catch (e) { }
    return FALLBACK_BOOKS;
  })
  const [loading, setLoading] = useState<boolean>(false)
  const [analytics, setAnalytics] = useState<LibraryAnalytics | null>(null)

  // Favorite Books List Computed
  const favoriteBooksList = useMemo(() => {
    return publishedBooks.filter(b => favoriteBookIds.has(b.id) || favoriteBookIds.has(b.title));
  }, [publishedBooks, favoriteBookIds]);

  // Live Floating Search Results for Library Home Popover
  const homeSearchResults = useMemo(() => {
    const q = (currentSearchValue || query).trim().toLowerCase();
    const hasFilter = selectedDomain !== 'all' || filterAuthor !== 'all';
    if (!q && !hasFilter) return [];

    return publishedBooks.filter(b => {
      const matchQ = !q || (
        (b.title || '').toLowerCase().includes(q) ||
        (b.author || '').toLowerCase().includes(q) ||
        (b.category || '').toLowerCase().includes(q) ||
        (b.infoText || '').toLowerCase().includes(q)
      );
      const matchDomain = selectedDomain === 'all' || b.category === selectedDomain;
      const matchAuthor = filterAuthor === 'all' || b.author === filterAuthor;
      return matchQ && matchDomain && matchAuthor;
    });
  }, [publishedBooks, currentSearchValue, query, selectedDomain, filterAuthor]);

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
  const [view, setView] = useState<'search' | 'reader'>('search')
  const [selectedBook, setSelectedBook] = useState<BookMeta | null>(null)
  const [selectedAuthorBook, setSelectedAuthorBook] = useState<BookMeta | null>(null)

  const getBaseUrl = () => import.meta.env.VITE_DATA_INGESTION_URL || 'https://abourida-zad-tutor-engine-space.hf.space';

  // 1. Instant Cache Hydration & Fresh Network Sync
  useEffect(() => {
    try {
      const cachedBooksStr = localStorage.getItem('zad_cached_library_books_v5') || localStorage.getItem('zad_cached_library_books_v4');
      if (cachedBooksStr) {
        const cached = JSON.parse(cachedBooksStr);
        if (Array.isArray(cached) && cached.length > 0) {
          const normalized = cached.map(normalizeBook);
          setPublishedBooks(normalized);
          setLoading(false);
        }
      }
      const cachedAnalyticsStr = localStorage.getItem('zad_cached_library_analytics_v4');
      if (cachedAnalyticsStr) {
        const cachedAnalytics = JSON.parse(cachedAnalyticsStr);
        if (cachedAnalytics && cachedAnalytics.total_books > 0) {
          setAnalytics(cachedAnalytics);
        }
      }
    } catch (e) {
      console.warn("Could not read local library cache", e);
    }

    const fetchLibraryData = async () => {
      try {
        const baseUrl = getBaseUrl();
        let resBooks = await fetch(`${baseUrl}/api/v1/data-ingestion/admin/library-books`);
        if (!resBooks.ok) {
          resBooks = await fetch(`${baseUrl}/api/v1/data-ingestion/admin/published-books`);
        }
        if (resBooks.ok) {
          const data = await resBooks.json();
          const rawBooks = data.books || [];
          if (rawBooks.length > 0) {
            const books = rawBooks.map(normalizeBook);
            setPublishedBooks(books);
            try {
              localStorage.setItem('zad_cached_library_books_v5', JSON.stringify(books));
            } catch (err) { }
          }
        }

        const resAnalytics = await fetch(`${baseUrl}/api/v1/data-ingestion/admin/library-analytics`);
        if (resAnalytics.ok) {
          const dataAnalytics = await resAnalytics.json();
          setAnalytics(dataAnalytics);
          try {
            localStorage.setItem('zad_cached_library_analytics_v4', JSON.stringify(dataAnalytics));
          } catch (err) { }
        }
      } catch (err) {
        console.error("Error loading library data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLibraryData();
  }, []);

  // Fetch book info for floating modal when activeInfoBook changes
  useEffect(() => {
    if (!activeInfoBook) {
      setModalInfoText(null);
      return;
    }
    if (activeInfoBook.infoText) {
      setModalInfoText(activeInfoBook.infoText);
      return;
    }
    const fetchInfo = async () => {
      setLoadingInfo(true);
      try {
        const baseUrl = getBaseUrl();
        const res = await fetch(`${baseUrl}/api/v1/data-ingestion/zad-book-info/${activeInfoBook.id}`);
        if (res.ok) {
          const data = await res.json();
          setModalInfoText(data.meta?.info || 'لم تتوفر تفاصيل إضافية لهذا الكتاب حالياً.');
        } else {
          setModalInfoText('فشل جلب تفاصيل الكتاب من الخادم.');
        }
      } catch (err) {
        setModalInfoText('حدث خطأ أثناء محاولة جلب المعلومات.');
      } finally {
        setLoadingInfo(false);
      }
    };
    fetchInfo();
  }, [activeInfoBook]);

  // 2. Dynamic Domains List
  const availableDomains = useMemo(() => {
    const counts: Record<string, number> = {};
    publishedBooks.forEach(b => {
      const cat = b.category || 'أخرى';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [publishedBooks]);

  // Dynamic Authors List for Dropdown
  const availableAuthors = useMemo(() => {
    const counts: Record<string, number> = {};
    publishedBooks.forEach(b => {
      const author = b.author?.trim();
      if (author && author !== 'من غير معروف') {
        counts[author] = (counts[author] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [publishedBooks]);

  // 3. Dynamic Century List
  const availableCenturies = useMemo(() => {
    const counts: Record<number, number> = {};
    publishedBooks.forEach(b => {
      const { century } = inferCenturyAndDeath(b);
      if (century) {
        counts[century] = (counts[century] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([centuryStr, count]) => {
        const c = parseInt(centuryStr, 10);
        return {
          century: c,
          name: CENTURY_NAMES_MAP[c] || `القرن ${c} هـ`,
          count
        };
      })
      .sort((a, b) => a.century - b.century);
  }, [publishedBooks]);

  // 4. Live DB Analytics
  const liveStats = useMemo(() => {
    if (analytics && analytics.total_books > 0) return analytics;
    const uniqueAuthors = new Set(publishedBooks.map(b => b.author).filter(Boolean));
    return {
      total_books: publishedBooks.length,
      total_authors: uniqueAuthors.size,
      total_domains: availableDomains.length,
      domains: availableDomains,
      centuries: availableCenturies,
      timeline: {
        earliest_century: availableCenturies[0]?.century || 2,
        latest_century: availableCenturies[availableCenturies.length - 1]?.century || 15
      }
    };
  }, [analytics, publishedBooks, availableDomains, availableCenturies]);

  // 5. Tab 1 Filtering & Ascending Chronological Sorting
  const filteredAndSortedBooks = useMemo(() => {
    let result = [...publishedBooks];

    if (activeMainTab === 'featured') {
      if (featuredBookIds.size > 0) {
        result = result.filter(b => featuredBookIds.has(b.id) || featuredBookIds.has(b.title));
      } else {
        result = [];
      }
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(b =>
        (b.title || '').toLowerCase().includes(q) ||
        (b.author || '').toLowerCase().includes(q) ||
        (b.category || '').toLowerCase().includes(q)
      );
    }

    if (selectedDomain !== 'all') {
      result = result.filter(b => b.category === selectedDomain);
    }

    if (filterAuthor !== 'all') {
      result = result.filter(b => b.author === filterAuthor);
    }

    if (selectedCentury !== 'all') {
      const targetCentury = parseInt(selectedCentury, 10);
      result = result.filter(b => {
        const { century } = inferCenturyAndDeath(b);
        return century === targetCentury;
      });
    }

    result.sort((a, b) => {
      const metaA = inferCenturyAndDeath(a);
      const metaB = inferCenturyAndDeath(b);
      const scoreA = metaA.deathYear ?? (metaA.century ? metaA.century * 100 : 9999);
      const scoreB = metaB.deathYear ?? (metaB.century ? metaB.century * 100 : 9999);

      if (scoreA !== scoreB) {
        return sortAsc ? scoreA - scoreB : scoreB - scoreA;
      }
      return (a.title || '').localeCompare(b.title || '', 'ar');
    });

    return result;
  }, [publishedBooks, query, selectedDomain, filterAuthor, selectedCentury, sortAsc, activeMainTab, featuredBookIds]);

  // 6. Tab 2: Grouping Books by Categories
  const booksByCategory = useMemo(() => {
    const map: Record<string, BookMeta[]> = {};
    publishedBooks.forEach(b => {
      const cat = b.category || 'أخرى';
      if (!map[cat]) map[cat] = [];
      map[cat].push(b);
    });

    let list = availableDomains.map(d => ({
      name: d.name,
      count: d.count,
      books: (map[d.name] || []).sort((a, b) => {
        const metaA = inferCenturyAndDeath(a);
        const metaB = inferCenturyAndDeath(b);
        const scoreA = metaA.deathYear ?? (metaA.century ? metaA.century * 100 : 9999);
        const scoreB = metaB.deathYear ?? (metaB.century ? metaB.century * 100 : 9999);
        return scoreA - scoreB;
      })
    }));

    if (selectedDomain !== 'all') {
      list = list.filter(cat => cat.name === selectedDomain);
    }

    if (filterAuthor !== 'all') {
      list = list.map(cat => ({
        ...cat,
        books: cat.books.filter(b => b.author === filterAuthor)
      })).filter(cat => cat.books.length > 0);
    }

    if (categorySearch.trim()) {
      const q = categorySearch.trim().toLowerCase();
      list = list
        .map(cat => {
          const catMatches = cat.name.toLowerCase().includes(q);
          const matchingBooks = cat.books.filter(b =>
            (b.title || '').toLowerCase().includes(q) ||
            (b.author || '').toLowerCase().includes(q) ||
            (b.infoText || '').toLowerCase().includes(q)
          );

          if (matchingBooks.length > 0) {
            return {
              ...cat,
              count: matchingBooks.length,
              books: matchingBooks,
            };
          }

          if (catMatches) {
            return cat;
          }

          return null;
        })
        .filter((cat): cat is { name: string; count: number; books: BookMeta[] } => cat !== null);
    }

    return list;
  }, [publishedBooks, availableDomains, categorySearch, selectedDomain, filterAuthor]);

  // 7. Tab 3: Grouping Authors by Centuries
  const authorsByCentury = useMemo(() => {
    const map: Record<number, {
      century: number;
      centuryName: string;
      authors: Record<string, {
        authorName: string;
        deathYear: number | null;
        centuryName: string;
        sampleBook: BookMeta;
        books: BookMeta[];
      }>;
    }> = {};

    publishedBooks.forEach(b => {
      const { deathYear, century, centuryName } = inferCenturyAndDeath(b);
      const c = century || 15;
      const cName = centuryName !== 'غير محدد' ? centuryName : (CENTURY_NAMES_MAP[c] || `القرن ${c} هـ`);

      if (!map[c]) {
        map[c] = {
          century: c,
          centuryName: cName,
          authors: {}
        };
      }

      const authorKey = (b.author || 'مؤلف غير معروف').trim();
      if (!map[c].authors[authorKey]) {
        map[c].authors[authorKey] = {
          authorName: authorKey,
          deathYear,
          centuryName: cName,
          sampleBook: b,
          books: []
        };
      }
      map[c].authors[authorKey].books.push(b);
      if (deathYear && !map[c].authors[authorKey].deathYear) {
        map[c].authors[authorKey].deathYear = deathYear;
      }
    });

    let centuriesList = Object.values(map).map(cGroup => ({
      century: cGroup.century,
      centuryName: cGroup.centuryName,
      totalBooks: Object.values(cGroup.authors).reduce((sum, a) => sum + a.books.length, 0),
      authors: Object.values(cGroup.authors).sort((a, b) => {
        if (a.deathYear && b.deathYear) return a.deathYear - b.deathYear;
        return a.authorName.localeCompare(b.authorName, 'ar');
      })
    })).sort((a, b) => a.century - b.century);

    if (selectedDomain !== 'all') {
      centuriesList = centuriesList.map(cGroup => ({
        ...cGroup,
        authors: cGroup.authors.filter(a => a.books.some(b => b.category === selectedDomain))
      })).filter(cGroup => cGroup.authors.length > 0);
    }

    if (filterAuthor !== 'all') {
      centuriesList = centuriesList.map(cGroup => ({
        ...cGroup,
        authors: cGroup.authors.filter(a => a.authorName === filterAuthor)
      })).filter(cGroup => cGroup.authors.length > 0);
    }

    if (authorSearch.trim()) {
      const q = authorSearch.trim().toLowerCase();
      centuriesList = centuriesList.map(cGroup => ({
        ...cGroup,
        authors: cGroup.authors.filter(a =>
          a.authorName.toLowerCase().includes(q) ||
          a.books.some(b => (b.title || '').toLowerCase().includes(q))
        )
      })).filter(cGroup => cGroup.authors.length > 0);
    }

    return centuriesList;
  }, [publishedBooks, authorSearch, selectedDomain, filterAuthor]);

  // Collapsible Sidebar & Recent Book State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [recentBook, setRecentBook] = useState<BookMeta | null>(() => {
    try {
      const saved = localStorage.getItem('zad_recent_read_book')
      if (saved) return JSON.parse(saved)
    } catch (e) { }
    return null
  })

  // Selected Author Object (for Author detail sub-page)
  const currentAuthorData = useMemo(() => {
    if (!selectedAuthor) return null;
    for (const cGroup of authorsByCentury) {
      const found = cGroup.authors.find(a => a.authorName === selectedAuthor);
      if (found) return found;
    }
    const authorBooks = publishedBooks.filter(b => b.author === selectedAuthor);
    if (authorBooks.length > 0) {
      const meta = inferCenturyAndDeath(authorBooks[0]);
      return {
        authorName: selectedAuthor,
        deathYear: meta.deathYear,
        centuryName: meta.centuryName,
        sampleBook: authorBooks[0],
        books: authorBooks
      };
    }
    return null;
  }, [selectedAuthor, authorsByCentury, publishedBooks]);

  const handleReadBook = (book: BookMeta) => {
    setSelectedBook(book);
    setRecentBook(book);
    try {
      localStorage.setItem('zad_recent_read_book', JSON.stringify(book));
    } catch (e) { }
    setView('reader');
  };

  if (view === 'reader' && selectedBook) {
    return (
      <TurathReader
        book={{
          ...selectedBook,
          century: selectedBook.century ? String(selectedBook.century) : undefined
        }}
        onClose={() => setView('search')}
        onAskBook={onAskBook}
        globalFontSize={fontSize}
      />
    );
  }

  // Render Search Console (Used in Navbar for non-home tabs and in Hero for home tab)
  const renderSearchConsole = (isCompact: boolean = false) => {
    return (
      <div className={`relative w-full transition-all ${(isDomainPickerOpen || isAuthorPickerOpen) ? 'z-50' : 'z-20'}`}>
        <div className={`w-full transition-all duration-300 ${isCompact
          ? 'rounded-full border border-slate-200/90 dark:border-purple-500/30 bg-white/95 dark:bg-[#18082c]/95 shadow-xs'
          : 'rounded-full border-2 border-purple-500 dark:border-purple-500 bg-white/95 dark:bg-[#1a0730]/95 shadow-2xl shadow-purple-500/20 ring-4 ring-purple-500/10'
          }`}>
          <div className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 ${isCompact ? 'py-1.5' : 'py-2.5 sm:py-3.5'
            }`}>
            {/* 1. Purple Circle Search Button on Right (Start in RTL) - matching Image 2 */}
            <div className={`rounded-full bg-gradient-to-br from-brand-magenta to-brand-deep text-white flex items-center justify-center shadow-md shadow-brand-magenta/30 shrink-0 ${isCompact ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-10 h-10 sm:w-11 sm:h-11'
              }`}>
              <Search className={isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4 sm:w-5 sm:h-5'} />
            </div>

            {/* 2. Main Search Input */}
            <input
              type="text"
              value={currentSearchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="ابحث عن كتاب (مثل: عمدة الفقه)، مؤلف (مثل: ابن قدامة)، أو باب شرعي..."
              className={`min-w-0 flex-1 bg-transparent text-foreground outline-none font-medium placeholder:font-normal placeholder:text-muted-foreground ${isCompact ? 'text-xs sm:text-sm py-1' : 'text-sm sm:text-base py-1.5'
                }`}
            />

            {/* Clear button */}
            {Boolean(currentSearchValue) && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                title="مسح البحث"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Subtle Vertical Divider */}
            <div className={`w-px bg-slate-200/80 dark:bg-purple-500/30 shrink-0 ${isCompact ? 'h-5' : 'h-7 sm:h-8'
              }`} />

            {/* Dropdown Filters: Domain & Author */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Domain Picker */}
              <div className="relative" ref={domainPickerRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsDomainPickerOpen(!isDomainPickerOpen);
                    setIsAuthorPickerOpen(false);
                  }}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 rounded-full border transition-all duration-200 font-bold font-sans cursor-pointer ${isCompact ? 'h-[30px] sm:h-[32px] text-[11px] sm:text-xs' : 'h-[36px] sm:h-[40px] text-xs sm:text-sm'
                    } ${selectedDomain !== 'all'
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 shadow-sm'
                      : theme === 'dark'
                        ? 'bg-purple-500/10 border-purple-500/30 text-purple-200 hover:bg-purple-500/20'
                        : 'bg-purple-50 border-purple-200 text-purple-900 hover:bg-purple-100'
                    }`}
                  title="تصفية حسب القسم الشرعي"
                >
                  <Layers className={`${isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-emerald-500 shrink-0`} />
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
                      className="w-3.5 h-3.5 rounded-full bg-emerald-600/20 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 flex items-center justify-center transition-all ml-0.5 cursor-pointer shrink-0"
                      title="إلغاء تصفية القسم"
                    >
                      <X className="w-2.5 h-2.5" />
                    </span>
                  ) : (
                    <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isDomainPickerOpen ? 'rotate-180' : 'rotate-0 opacity-70'}`} />
                  )}
                </button>

                {/* Domain Popover */}
                <div
                  className={`absolute top-full left-0 mt-2 w-[240px] sm:w-[270px] rounded-2xl border-2 transition-all duration-200 z-[100] origin-top-left p-2.5 shadow-2xl ${isDomainPickerOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                    } ${theme === 'dark'
                      ? 'bg-[#120526] border-purple-500/50 text-white shadow-[0_25px_70px_rgba(0,0,0,0.95)]'
                      : 'bg-white border-purple-200 text-slate-900 shadow-[0_25px_70px_rgba(122,23,201,0.25)]'
                    }`}
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
                        ? 'bg-gradient-to-r from-brand-magenta to-brand-deep text-white shadow-sm'
                        : theme === 'dark' ? 'hover:bg-white/5 text-white/90' : 'hover:bg-purple-50 text-brand-deep'
                        }`}
                    >
                      <span className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 opacity-70" />
                        الكل (جميع الأقسام)
                      </span>
                      <span className="text-[11px] font-mono opacity-75">({publishedBooks.length})</span>
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
                            ? 'bg-gradient-to-r from-brand-magenta to-brand-deep text-white font-bold shadow-sm'
                            : theme === 'dark' ? 'hover:bg-white/5 text-white/80' : 'hover:bg-purple-50 text-slate-700'
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

              {/* Author Picker */}
              <div className="relative" ref={authorPickerRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsAuthorPickerOpen(!isAuthorPickerOpen);
                    setIsDomainPickerOpen(false);
                  }}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 rounded-full border transition-all duration-200 font-bold font-sans cursor-pointer ${isCompact ? 'h-[30px] sm:h-[32px] text-[11px] sm:text-xs' : 'h-[36px] sm:h-[40px] text-xs sm:text-sm'
                    } ${filterAuthor !== 'all'
                      ? 'bg-gradient-to-r from-brand-blue/20 to-blue-500/10 border-brand-blue/40 text-blue-700 dark:text-blue-300 shadow-sm'
                      : theme === 'dark'
                        ? 'bg-purple-500/10 border-purple-500/30 text-purple-200 hover:bg-purple-500/20'
                        : 'bg-purple-50 border-purple-200 text-purple-900 hover:bg-purple-100'
                    }`}
                  title="تصفية حسب المؤلف"
                >
                  <User className={`${isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-brand-blue shrink-0`} />
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
                      className="w-3.5 h-3.5 rounded-full bg-blue-600/20 hover:bg-blue-600 hover:text-white text-blue-700 dark:text-blue-300 flex items-center justify-center transition-all ml-0.5 cursor-pointer shrink-0"
                      title="إلغاء تصفية المؤلف"
                    >
                      <X className="w-2.5 h-2.5" />
                    </span>
                  ) : (
                    <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isAuthorPickerOpen ? 'rotate-180' : 'rotate-0 opacity-70'}`} />
                  )}
                </button>

                {/* Author Popover */}
                <div
                  className={`absolute top-full left-0 mt-2 w-[240px] sm:w-[270px] rounded-2xl border-2 transition-all duration-200 z-[100] origin-top-left p-2.5 shadow-2xl ${isAuthorPickerOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                    } ${theme === 'dark'
                      ? 'bg-[#120526] border-purple-500/50 text-white shadow-[0_25px_70px_rgba(0,0,0,0.95)]'
                      : 'bg-white border-purple-200 text-slate-900 shadow-[0_25px_70px_rgba(122,23,201,0.25)]'
                    }`}
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
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-purple-500/20 outline-none text-foreground"
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
                        ? 'bg-gradient-to-r from-brand-blue to-blue-600 text-white shadow-sm'
                        : theme === 'dark' ? 'hover:bg-white/5 text-white/90' : 'hover:bg-purple-50 text-brand-deep'
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
                              ? 'bg-gradient-to-r from-brand-blue to-blue-600 text-white font-bold shadow-sm'
                              : theme === 'dark' ? 'hover:bg-white/5 text-white/80' : 'hover:bg-purple-50 text-slate-700'
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

              {/* Reset button if filtered */}
              {(selectedDomain !== 'all' || filterAuthor !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDomain('all');
                    setFilterAuthor('all');
                  }}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 dark:text-rose-400 border border-rose-500/25 transition-all flex items-center justify-center shrink-0 active:scale-95 cursor-pointer"
                  title="إعادة تعيين الفلاتر"
                >
                  <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Live Search Floating Popover for Library Home View (فريم طافف منبثق بنتائج البحث المباشر في الصفحة الرئيسية) */}
        {activeMainTab === 'home' && (Boolean(currentSearchValue.trim()) || selectedDomain !== 'all' || filterAuthor !== 'all') && !isHomeSearchResultsDismissed && (
          <div className="absolute top-full left-0 right-0 mt-3 max-h-[520px] overflow-y-auto rounded-3xl border-2 border-purple-500/30 dark:border-purple-500/40 bg-white/95 dark:bg-[#120526]/95 backdrop-blur-2xl shadow-[0_25px_80px_rgba(46,8,84,0.3)] dark:shadow-[0_25px_80px_rgba(0,0,0,0.95)] z-[90] p-4 sm:p-5 space-y-3 animate-in fade-in zoom-in-95 duration-200 text-right">

            {/* Header of Floating Search Results */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10 text-xs font-bold text-muted-foreground">
              <span className="flex items-center gap-1.5 text-slate-900 dark:text-white font-extrabold text-sm sm:text-base">
                <Sparkles className="w-4 h-4 text-brand-magenta" />
                نتائج البحث المباشر ({homeSearchResults.length} {homeSearchResults.length === 1 ? 'كتاب' : 'كتب'})
              </span>
              <button
                type="button"
                onClick={() => setIsHomeSearchResultsDismissed(true)}
                className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-xs font-bold text-muted-foreground hover:text-foreground transition-all flex items-center gap-1 cursor-pointer"
                title="إغلاق قائمة النتائج"
              >
                <span>إغلاق</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List of Results (كل كتاب في سطر مطابق للبطاقة والتصميم المطلوب) */}
            <div className="space-y-3">
              {homeSearchResults.map(book => {
                const { deathYear, centuryName } = inferCenturyAndDeath(book);
                const isFav = favoriteBookIds.has(book.id) || favoriteBookIds.has(book.title);
                return (
                  <div
                    key={book.id}
                    className="group rounded-2xl border border-slate-200/80 dark:border-purple-500/20 bg-white dark:bg-[#180730]/90 p-3.5 sm:p-4 shadow-sm hover:shadow-md hover:border-brand-magenta/40 dark:hover:border-purple-500/50 transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-right"
                  >
                    {/* Book Info */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-magenta/15 to-brand-blue/15 text-brand-magenta flex items-center justify-center shrink-0 group-hover:bg-brand-magenta group-hover:text-white transition-all shadow-xs mt-0.5">
                        <BookOpen className="w-5 h-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 group-hover:text-brand-magenta transition-colors line-clamp-1">
                          {book.title}
                        </h4>

                        {/* Badges: Author + Category (Glassmorphic) + Century */}
                        <div className="flex items-center gap-2 flex-wrap mt-1.5">
                          {/* Author with User Icon */}
                          {book.author && book.author !== 'من غير معروف' ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAuthorBook(book);
                              }}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-brand-magenta transition-colors group/author cursor-pointer"
                              title="عرض سيرة المؤلف"
                            >
                              <User className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover/author:text-brand-magenta" />
                              <span className="group-hover/author:underline underline-offset-2">{book.author}</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="h-3.5 w-3.5 text-slate-400" />
                              <span>{book.author}</span>
                            </span>
                          )}

                          {/* Glassmorphic Category Badge (وسم بفريم احترافي زجاجي باسم القسم) */}
                          {book.category && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 backdrop-blur-sm">
                              <Layers className="w-3 h-3 text-brand-magenta" />
                              {book.category}
                            </span>
                          )}

                          {/* Century Badge (وسم القرن وتاريخ الوفاة) */}
                          {centuryName && centuryName !== 'غير محدد' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                              <Calendar className="w-3 h-3 text-amber-500" />
                              {centuryName}
                              {deathYear && <span className="font-mono">({deathYear}هـ)</span>}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: تصفح + اسأل زاد + معلومات + مفضلة */}
                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-white/5 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          handleReadBook(book);
                          setIsHomeSearchResultsDismissed(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-brand-magenta text-white text-xs font-bold hover:bg-brand-deep transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                        title="تصفح وقراءة الكتاب"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>تصفح</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onAskBook(book);
                          setIsHomeSearchResultsDismissed(true);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-brand-magenta/30 bg-brand-magenta/5 text-brand-magenta hover:bg-brand-magenta/15 text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                        title="اسأل زاد حول الكتاب"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>اسأل زاد</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveInfoBook(book)}
                        className="p-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-muted-foreground hover:text-brand-magenta hover:bg-brand-magenta/10 transition-all flex items-center justify-center cursor-pointer"
                        title="معلومات وتفاصيل الكتاب"
                      >
                        <Info className="w-4 h-4" />
                      </button>

                      {(typeof toggleFavorite === 'function') && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(book.id ?? book.title);
                          }}
                          className={`p-1.5 rounded-xl border transition-all flex items-center justify-center active:scale-90 ${isFav
                            ? 'border-rose-500/30 text-rose-500 bg-rose-500/10'
                            : 'border-slate-200 dark:border-white/10 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10'
                            }`}
                          title={isFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-current text-rose-500' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderGlobalNavTabs = (compact: boolean = false) => {
    const isMediaActive = activeMainTab === 'media' || activeMainTab === 'courses';
    const isLibraryActive = !isMediaActive;

    const navItems = [
      { id: 'home', label: 'الرئيسية', isActive: false, action: () => (onNavigateGlobal ? onNavigateGlobal('home') : onExit()) },
      {
        id: 'knowledge',
        label: 'المكتبة',
        isActive: isLibraryActive,
        action: () => {
          if (activeMainTab !== 'home') {
            setActiveMainTab('home');
            setSelectedAuthor(null);
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
      },
      {
        id: 'media',
        label: 'الشروحات والدروس',
        isActive: isMediaActive,
        action: () => {
          setActiveMainTab('media');
          setSelectedAuthor(null);
        }
      },
      { id: 'study', label: 'وضع الدراسة', isActive: false, action: () => (onNavigateGlobal ? onNavigateGlobal('study') : null) },
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
                    : 'text-xs sm:text-sm lg:text-[14px] px-3 sm:px-3.5 py-1.5'
                  } font-bold ${active
                    ? 'bg-brand-magenta text-white shadow-md shadow-brand-magenta/35 scale-[1.02]'
                    : 'text-slate-800 dark:text-slate-100 hover:text-brand-magenta dark:hover:text-purple-300 hover:bg-white/40 dark:hover:bg-white/10'
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

  return (
    <div dir="rtl" className={`relative min-h-screen font-sans transition-colors duration-300 ${theme === 'dark' ? 'dark bg-[#080210] text-slate-100' : 'bg-[#faf8fd] text-slate-900'}`}>

      <div className="flex min-h-screen relative z-10 overflow-x-clip">

        {/* ============================================================= */}
        {/* FLOATING DRAWER SIDEBAR (القائمة الجانبية كطبقة طافية)         */}
        {/* ============================================================= */}
        <LibrarySidebar
          isOpen={isSidebarOpen}
          theme={theme}
          activeMainTab={activeMainTab}
          counts={{
            domains: availableDomains.length,
            authors: liveStats.total_authors,
            featured: featuredBookIds.size > 0 ? publishedBooks.filter(b => featuredBookIds.has(b.id) || featuredBookIds.has(b.title)).length : 0,
            favorites: favoriteBooksList.length,
          }}
          recentBook={recentBook}
          onClose={() => setIsSidebarOpen(false)}
          onSelectTab={(tab) => {
            setActiveMainTab(tab);
            setSelectedAuthor(null);
          }}
          onReadRecentBook={handleReadBook}
          selectedCentury={selectedCentury}
          onChangeCentury={(c) => setSelectedCentury(c)}
          availableCenturies={availableCenturies}
          sortAsc={sortAsc}
          onToggleSort={() => setSortAsc(!sortAsc)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
        />

        {/* ============================================================= */}
        {/* MAIN WORKSPACE AREA (مساحة التصفح والعرض الرئيسية)            */}
        {/* ============================================================= */}
        <main className="flex-1 min-w-0 flex flex-col min-h-screen">

          {/* ============================================================= */}
          {/* SECTION 1: TOP HERO (القسم الأول: النافبار + الهيدر + صورة الغروب - شاشة كاملة 100vh) */}
          {/* ============================================================= */}
          <div className={`relative w-full ${activeMainTab === 'home'
            ? 'min-h-screen flex flex-col justify-between'
            : ''
            }`}>
            {/* Sunset Mosque Background - STRICTLY LIMITED TO SECTION 1 ON 'home' */}
            {activeMainTab === 'home' && (
              <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                <img
                  src={theme === 'dark' ? libraryBgDark : libraryBgLight}
                  alt="خلفية المكتبة"
                  aria-hidden
                  className="h-full w-full object-cover object-center transition-all duration-500"
                  style={{
                    opacity: currentSettings.imageOpacity / 100,
                    filter: theme === 'dark' ? 'brightness(0.75) contrast(1.25)' : 'none'
                  }}
                />
                <div
                  className="absolute inset-0 bg-gradient-to-b from-[#080210]/30 via-[#0d041c]/40 to-[#080210]/90 dark:from-[#080210]/60 dark:via-[#0d041c]/70 dark:to-[#080210] transition-opacity duration-500"
                  style={{ opacity: currentSettings.overlayOpacity / 100 }}
                />
              </div>
            )}

            {/* UNIFIED TOP NAVBAR */}
            <header className={`z-50 w-full transition-all duration-300 ${activeMainTab === 'home'
              ? isScrolledPastSearch
                ? 'fixed top-0 left-0 right-0 bg-white/95 dark:bg-[#0c0218]/95 backdrop-blur-xl border-b border-purple-200/60 dark:border-purple-500/25 shadow-md py-2 px-4 sm:px-6 lg:px-8 animate-in slide-in-from-top-2 duration-300'
                : 'bg-transparent border-b border-transparent py-4 px-4 sm:px-6 lg:px-8'
              : 'sticky top-0 bg-white/95 dark:bg-[#0c0218]/95 border-b border-slate-200/80 dark:border-purple-500/25 backdrop-blur-xl py-2.5 px-4 sm:px-6 lg:px-8 shadow-xs'
              }`}>
              <div className="w-full flex items-center justify-between gap-2 sm:gap-4">

                {/* 1. RIGHT: Sidebar Icon + Zad Logo ONLY (بدون تكرار النص الطويل) */}
                <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(true)}
                    className="w-10 h-10 rounded-2xl bg-white/40 dark:bg-[#1a0730]/60 backdrop-blur-xl text-foreground border border-white/40 dark:border-purple-500/30 hover:border-brand-magenta hover:bg-brand-magenta hover:text-white transition-all shadow-sm flex items-center justify-center group active:scale-95 cursor-pointer"
                    title="فتح القائمة والفهرس"
                  >
                    <Menu className="w-5 h-5 text-brand-magenta group-hover:text-white transition-all" />
                  </button>

                  <div
                    onClick={() => { setActiveMainTab('home'); setSelectedAuthor(null); }}
                    className="flex items-center cursor-pointer group"
                    title="مكتبة زاد"
                  >
                    <img
                      src={theme === 'dark' ? whiteLogo : darkLogo}
                      alt="شعار زاد"
                      className="h-9 sm:h-10 w-auto object-contain drop-shadow-md group-hover:scale-105 transition-transform"
                    />
                  </div>
                </div>

                {/* 2. CENTER:
                    - In Home tab when scrolled past search: Compact Search Console (شريط البحث المدمج في النافبار)
                    - Otherwise: Floating Glassmorphic Pill with the 6 navigation tabs
                */}
                {activeMainTab === 'home' && isScrolledPastSearch ? (
                  <div className="flex-1 max-w-2xl mx-auto px-2 animate-in fade-in zoom-in-95 duration-200">
                    {renderSearchConsole(true)}
                  </div>
                ) : (
                  <div className="hidden md:flex flex-1 items-center justify-center px-2 animate-in fade-in duration-300">
                    <div className="px-2 py-1.5 rounded-full bg-white/40 dark:bg-[#140628]/60 backdrop-blur-2xl border border-white/50 dark:border-purple-500/30 shadow-[0_8px_32px_rgba(46,8,84,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                      {renderGlobalNavTabs(false)}
                    </div>
                  </div>
                )}

                {/* 3. LEFT: Unified Glassmorphic Capsule for Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {activeMainTab === 'home' && isScrolledPastSearch && (
                    <div className="hidden xl:flex items-center mr-1">
                      <div className="px-2 py-1 rounded-full bg-slate-100/90 dark:bg-white/5 border border-slate-200/80 dark:border-purple-500/20 backdrop-blur-md shadow-xs">
                        {renderGlobalNavTabs(true)}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/40 dark:bg-[#1a0730]/60 backdrop-blur-xl border border-white/40 dark:border-purple-500/30 shadow-sm">
                    {/* Theme Switcher Button */}
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="w-9 h-9 rounded-xl hover:bg-white/60 dark:hover:bg-white/10 text-foreground transition-all flex items-center justify-center active:scale-95 cursor-pointer"
                      title={isDark ? "الانتقال للوضع النهاري (الفاتح)" : "الانتقال للوضع الليلي (الداكن)"}
                    >
                      {isDark ? (
                        <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-90 duration-300" />
                      ) : (
                        <Moon className="w-4 h-4 text-purple-600 transition-transform hover:-rotate-12 duration-300" />
                      )}
                    </button>

                    <div className="w-[1px] h-4 bg-slate-300/60 dark:bg-white/15" />

                    {/* Back Button */}
                    <button
                      type="button"
                      onClick={onExit}
                      className="h-9 px-3 rounded-xl hover:bg-white/60 dark:hover:bg-white/10 text-foreground transition-all flex items-center gap-1.5 text-xs font-bold active:scale-95 cursor-pointer"
                      title="الرجوع للرئيسية العامة"
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="hidden sm:inline">الرجوع</span>
                    </button>
                  </div>
                </div>

              </div>
            </header>

            {/* HOME HERO SECTION (يتوسط الشاشة رأسياً) */}
            {activeMainTab === 'home' && (
              <div className="relative z-20 flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-center animate-in fade-in duration-300">
                <div className="max-w-4xl w-full mx-auto space-y-3 sm:space-y-4">

                  {/* Zad Logo & Header Title */}
                  <div className="space-y-2 sm:space-y-2.5">
                    <div className="relative flex items-center justify-center py-1">
                      <div className="absolute w-44 h-44 bg-gradient-to-tr from-brand-magenta/20 via-brand-deep/20 to-purple-500/20 blur-3xl rounded-full pointer-events-none -z-10" />
                      <img
                        src={theme === 'dark' ? whiteLogo : darkLogo}
                        alt="شعار زاد"
                        className="h-20 sm:h-24 md:h-28 w-auto max-h-32 object-contain drop-shadow-2xl hover:scale-105 transition-all duration-300"
                      />
                    </div>
                    {/* Solid Deep Royal Purple Title (غير متدرج كطلب المستخدم) */}
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight font-tajawal text-[#2e0854] dark:text-[#f7eeff] drop-shadow-xs">
                      مكتبة متكاملة لدراسة العلوم الشرعية
                    </h1>
                    <p className="text-xs sm:text-sm font-bold text-slate-800/95 dark:text-slate-100 max-w-xl mx-auto leading-relaxed drop-shadow-xs">
                      ابحث في مجموعة مختارة من كتب المكتبة الشاملة، واستكشف الشروح المرئية والصوتية والدورات العلمية.
                    </p>
                  </div>

                  {/* Taller Search Bar (بارتفاع أكبر وتصميم مطابق للصورة 2) */}
                  <div id="hero-main-search-bar" className="max-w-4xl mx-auto w-full">
                    {renderSearchConsole(false)}
                  </div>

                  {/* CONTINUE READING BANNER (تصميم زجاجي شفاف فاخر ومحكم Glassmorphic) */}
                  {recentBook && (
                    <div className="max-w-2xl mx-auto w-full rounded-2xl p-3 sm:p-4 bg-white/30 dark:bg-purple-950/40 backdrop-blur-xl border border-white/50 dark:border-white/20 ring-1 ring-white/30 shadow-xl shadow-purple-950/20 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto text-right">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-brand-magenta to-purple-700 text-white flex items-center justify-center shrink-0 shadow-lg shadow-brand-magenta/35 border border-white/30">
                          <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] sm:text-xs font-black text-purple-950 dark:text-purple-200 drop-shadow-xs">متابعة القراءة الأخيرة</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/50 dark:bg-white/15 text-purple-950 dark:text-purple-100 font-bold border border-white/50 backdrop-blur-sm">جاهز للإكمال</span>
                          </div>
                          <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate mt-0.5 drop-shadow-xs">
                            {recentBook.title}
                          </h3>
                          <p className="text-[11px] text-slate-700 dark:text-slate-300 truncate font-semibold">
                            المؤلف: {recentBook.author}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleReadBook(recentBook)}
                        className="w-full sm:w-auto py-2 px-5 rounded-xl bg-gradient-to-r from-brand-magenta via-purple-600 to-brand-deep hover:from-brand-deep hover:to-purple-800 text-white text-xs sm:text-sm font-black transition-all shadow-lg shadow-brand-magenta/30 hover:shadow-brand-magenta/50 hover:scale-105 active:scale-95 border border-white/30 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>إكمال القراءة الآن 📖</span>
                      </button>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* مؤشر التمرير للأسفل للانتقال للقسم الثاني */}
            {activeMainTab === 'home' && (
              <div className="relative z-20 pb-4 sm:pb-5 flex flex-col items-center justify-center text-center">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('library-domains-section');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="inline-flex flex-col items-center gap-1 text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-brand-magenta transition-colors cursor-pointer group"
                >
                  <span className="opacity-80 group-hover:opacity-100 transition-opacity">تصفح العلوم الشرعية</span>
                  <ChevronDown className="w-4 h-4 text-brand-magenta animate-bounce" />
                </button>
              </div>
            )}
          </div>

          {/* ============================================================= */}
          {/* SECTION 2: WORKSPACE & ISLAMIC PATTERN (القسم الثاني: الزخرفة)  */}
          {/* ============================================================= */}
          <div className={`relative z-10 flex-1 w-full overflow-hidden transition-colors duration-300 ${activeMainTab === 'home'
            ? 'bg-[#faf8fd] dark:bg-[#0a0216] border-t border-purple-200/50 dark:border-purple-500/20'
            : ''
            }`}>
            {/* الزخرفة الإسلامية الهندسية تغطي كامل خلفية القسم الثاني بدون صورة الغروب */}
            {activeMainTab === 'home' && (
              <IslamicPattern
                opacity={theme === 'dark' ? 0.12 : 0.08}
                className="text-purple-600 dark:text-purple-400 pointer-events-none"
              />
            )}

            <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">

              {/* TAB: الرئيسية (Home) */}
              {activeMainTab === 'home' && (
                <LibraryHomeView
                  recentBook={recentBook}
                  featuredBooks={publishedBooks.filter(b => featuredBookIds.has(b.id) || featuredBookIds.has(b.title))}
                  liveStats={liveStats}
                  availableDomains={availableDomains}
                  selectedDomain={selectedDomain}
                  onSelectDomain={(dom) => {
                    setSelectedDomain(dom);
                    setActiveMainTab('categories');
                  }}
                  featuredPlaylist={playlists.find(p => p.id === 'pl-alaa-fiqh-muyassar') || playlists[0]}
                  activeCourse={courses.find(c => c.playlistId === 'PLRG850GgVGNY') || courses[0]}
                  favoritesCount={favoriteBooksList.length}
                  onNavigateTab={(tab) => {
                    setActiveMainTab(tab);
                    setSelectedAuthor(null);
                  }}
                  onReadBook={handleReadBook}
                  onOpenLinkedBook={handleOpenLinkedBook}
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

              {/* TAB: الكتب المفضلة (Favorites) */}
              {activeMainTab === 'favorites' && (
                <FavoriteBooksView
                  favoriteBooks={favoriteBooksList}
                  onRead={handleReadBook}
                  onAsk={onAskBook}
                  onRemoveFavorite={(id) => toggleFavorite(id)}
                  onBrowseLibrary={() => setActiveMainTab('categories')}
                  onOpenAuthorBio={(b) => setSelectedAuthorBook(b)}
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
              {/* TAB 1: الأقــسـام (By Categories / Domains)                   */}
              {/* ============================================================= */}
              {activeMainTab === 'categories' && (() => {
                const isSearching = Boolean(categorySearch.trim() || selectedDomain !== 'all' || filterAuthor !== 'all');
                return (
                  <div className="animate-in fade-in duration-300 space-y-6">

                    {/* 1. Category Statistics Grid (بطاقات إحصائيات الأقسام) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Stat 1: Total Categories */}
                      <div className="rounded-2xl border border-slate-200/80 dark:border-purple-500/25 bg-white/90 dark:bg-[#14062b]/90 p-4 shadow-sm backdrop-blur-md flex items-center gap-3.5 hover:border-emerald-500/40 transition-all">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
                          <Layers className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">الأقسام والتخصصات</span>
                          <span className="text-xl font-black text-slate-900 dark:text-white block tracking-tight">
                            {availableDomains.length} <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">قسماً شرعياً</span>
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate block">تغطي فروع العلوم الإسلامية</span>
                        </div>
                      </div>

                      {/* Stat 2: Total Books */}
                      <div className="rounded-2xl border border-slate-200/80 dark:border-purple-500/25 bg-white/90 dark:bg-[#14062b]/90 p-4 shadow-sm backdrop-blur-md flex items-center gap-3.5 hover:border-brand-magenta/40 transition-all">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-magenta/15 to-purple-500/20 text-brand-magenta dark:text-purple-300 flex items-center justify-center shrink-0 shadow-sm">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">إجمالي الكتب المفهرسة</span>
                          <span className="text-xl font-black text-slate-900 dark:text-white block tracking-tight">
                            {publishedBooks.length} <span className="text-xs font-bold text-brand-magenta">كتاباً معتمداً</span>
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate block">بنصوص كاملة قابلة للدراسة</span>
                        </div>
                      </div>

                      {/* Stat 3: Top Domain */}
                      <div className="rounded-2xl border border-slate-200/80 dark:border-purple-500/25 bg-white/90 dark:bg-[#14062b]/90 p-4 shadow-sm backdrop-blur-md flex items-center gap-3.5 hover:border-amber-500/40 transition-all">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/15 to-orange-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
                          <Award className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">أغزر الأقسام مؤلفات</span>
                          <span className="text-base font-black text-slate-900 dark:text-white block truncate">
                            {availableDomains[0]?.name || 'الفقه وأصوله'}
                          </span>
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">
                            ({availableDomains[0]?.count || 0} مصنفاً مفهرساً)
                          </span>
                        </div>
                      </div>

                      {/* Stat 4: Search & Scholars */}
                      <div className="rounded-2xl border border-slate-200/80 dark:border-purple-500/25 bg-white/90 dark:bg-[#14062b]/90 p-4 shadow-sm backdrop-blur-md flex items-center gap-3.5 hover:border-blue-500/40 transition-all">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/15 to-indigo-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-sm">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">الأئمة والمصنفون</span>
                          <span className="text-xl font-black text-slate-900 dark:text-white block tracking-tight">
                            {liveStats.total_authors} <span className="text-xs font-bold text-blue-600 dark:text-blue-400">عالماً</span>
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate block">عبر 15 قرناً هجرياً</span>
                        </div>
                      </div>
                    </div>

                    {/* 2. In-Page Search Console (مربع البحث مطابق للرئيسية تماماً بدون أي فريم إضافي) */}
                    <div id="subpage-main-search-bar" className="max-w-4xl mx-auto w-full">
                      {renderSearchConsole(false)}
                    </div>

                    {/* 3. Layout Toggle Bar for Categories */}
                    <div className="rounded-2xl border border-slate-200/90 dark:border-purple-500/20 bg-white/95 dark:bg-[#14062b]/95 p-3 sm:px-5 shadow-sm backdrop-blur-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Layers className="w-5 h-5 text-brand-magenta" />
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                          {isSearching ? (
                            <>
                              نتائج البحث في الأقسام: <span className="text-brand-magenta">{booksByCategory.length}</span> قسم
                              <span className="text-xs text-muted-foreground font-normal mr-2">
                                ({booksByCategory.reduce((sum, c) => sum + c.books.length, 0)} كتاباً مطابقاً)
                              </span>
                            </>
                          ) : (
                            <>جميع الأقسام والتخصصات ({booksByCategory.length})</>
                          )}
                        </h3>
                      </div>

                      {/* View Toggle (فوق بعض vs جنب بعض) */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground font-semibold hidden sm:inline">طريقة العرض:</span>
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-black/40 p-1 rounded-xl border border-slate-200/60 dark:border-white/10">
                          <button
                            onClick={() => setCategoriesViewMode('list')}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${categoriesViewMode === 'list'
                              ? 'bg-white dark:bg-brand-magenta text-brand-magenta dark:text-white shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                              }`}
                            title="عرض فوق بعض (قوائم منسدلة)"
                          >
                            <List className="w-3.5 h-3.5" />
                            <span>فوق بعض</span>
                          </button>

                          <button
                            onClick={() => setCategoriesViewMode('grid')}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${categoriesViewMode === 'grid'
                              ? 'bg-white dark:bg-brand-magenta text-brand-magenta dark:text-white shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                              }`}
                            title="عرض جنب بعض (بطاقات شبكية)"
                          >
                            <LayoutGrid className="w-3.5 h-3.5" />
                            <span>جنب بعض</span>
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* Categories Content: LIST MODE (فوق بعض) */}
                    {categoriesViewMode === 'list' ? (
                      <div className="space-y-4">
                        {booksByCategory.map((cat, idx) => {
                          const isOpen = isSearching
                            ? !closedCategories.has(cat.name)
                            : (openCategory !== null ? openCategory === cat.name : idx === 0);

                          return (
                            <div
                              key={cat.name}
                              className="rounded-2xl border border-slate-200/80 dark:border-purple-500/25 bg-white dark:bg-[#14062b] overflow-hidden shadow-sm transition-all hover:border-brand-magenta/40"
                            >
                              {/* Accordion Header */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (isSearching) {
                                    setClosedCategories(prev => {
                                      const next = new Set(prev);
                                      if (next.has(cat.name)) next.delete(cat.name);
                                      else next.add(cat.name);
                                      return next;
                                    });
                                  } else {
                                    const currentlyOpen = openCategory !== null ? openCategory === cat.name : idx === 0;
                                    setOpenCategory(currentlyOpen ? '' : cat.name);
                                  }
                                }}
                                className={`w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-right transition-colors ${isOpen
                                  ? 'bg-brand-magenta/5 dark:bg-purple-500/15 border-b border-slate-200/60 dark:border-purple-500/20'
                                  : 'hover:bg-slate-50 dark:hover:bg-white/5'
                                  }`}
                              >
                                <div className="flex items-center gap-3.5 min-w-0">
                                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold shrink-0 transition-colors ${isOpen
                                    ? 'bg-brand-magenta text-white shadow-md shadow-brand-magenta/30'
                                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    }`}>
                                    <Layers className="w-5 h-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                                      {cat.name}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                      {isSearching ? (
                                        <>معروض <span className="font-bold text-brand-magenta">{cat.books.length}</span> كتاباً مطابقاً للبحث</>
                                      ) : (
                                        <>يحتوي على <span className="font-bold text-brand-magenta">{cat.books.length}</span> كتاباً معتمداً</>
                                      )}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                  <span className={`hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${isOpen
                                    ? 'bg-brand-magenta text-white'
                                    : 'bg-slate-100 dark:bg-black/30 text-slate-700 dark:text-slate-300'
                                    }`}>
                                    {cat.books.length} كتب
                                  </span>
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 ${isOpen ? 'rotate-180 bg-brand-magenta text-white' : 'bg-slate-100 dark:bg-white/5 text-muted-foreground'
                                    }`}>
                                    <ChevronDown className="w-4 h-4" />
                                  </div>
                                </div>
                              </button>

                              {/* Accordion Body (Books of this category) */}
                              {isOpen && (
                                <div className="p-4 sm:p-6 bg-slate-50/50 dark:bg-black/30 animate-in fade-in duration-200">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {cat.books.map(book => (
                                      <BookCard
                                        key={book.id}
                                        book={book}
                                        viewMode="grid"
                                        onRead={handleReadBook}
                                        onAsk={onAskBook}
                                        onOpenAuthorBio={(b) => setSelectedAuthorBook(b)}
                                        onOpenBookInfo={(b) => setActiveInfoBook(b)}
                                        isFavorite={favoriteBookIds.has(book.id) || favoriteBookIds.has(book.title)}
                                        onToggleFavorite={() => toggleFavorite(book.id || book.title)}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {booksByCategory.length === 0 && (
                          <div className="p-12 text-center text-muted-foreground bg-white dark:bg-[#14062b] rounded-2xl border border-dashed border-slate-300 dark:border-purple-500/30">
                            <Search className="w-10 h-10 mx-auto text-slate-300 dark:text-purple-500/40 mb-3" />
                            <p className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                              لم يتم العثور على أقسام أو كتب تطابق بحثك "{categorySearch}"
                            </p>
                            <p className="text-xs text-muted-foreground mb-4">
                              جرب البحث بعنوان كتاب (مثل: عمدة الفقه) أو اسم مؤلف (مثل: ابن قدامة).
                            </p>
                            <button
                              type="button"
                              onClick={() => handleSearchChange('')}
                              className="px-4 py-2 rounded-xl bg-brand-magenta text-white text-xs font-bold hover:bg-brand-deep transition-all shadow-sm"
                            >
                              إلغاء البحث وإظهار جميع الأقسام
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Categories Content: GRID MODE (جنب بعض) */
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {booksByCategory.map((cat, idx) => {
                            const isSelected = isSearching
                              ? !closedCategories.has(cat.name)
                              : (openCategory !== null ? openCategory === cat.name : idx === 0);

                            return (
                              <div
                                key={cat.name}
                                onClick={() => {
                                  if (isSearching) {
                                    setClosedCategories(prev => {
                                      const next = new Set(prev);
                                      if (next.has(cat.name)) next.delete(cat.name);
                                      else next.add(cat.name);
                                      return next;
                                    });
                                  } else {
                                    setOpenCategory(isSelected ? '' : cat.name);
                                  }
                                }}
                                className={`cursor-pointer rounded-2xl border p-5 transition-all flex flex-col justify-between ${isSelected
                                  ? 'border-brand-magenta bg-brand-magenta/5 dark:bg-purple-500/15 shadow-md'
                                  : 'border-slate-200/80 dark:border-purple-500/25 bg-white dark:bg-[#14062b] hover:border-brand-magenta/40 hover:shadow-md'
                                  }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-3 mb-3">
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-brand-magenta text-white' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                      }`}>
                                      <Layers className="w-5 h-5" />
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${isSelected ? 'bg-brand-magenta text-white' : 'bg-slate-100 dark:bg-black/30 text-slate-700 dark:text-slate-300'
                                      }`}>
                                      {cat.books.length} كتب
                                    </span>
                                  </div>

                                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1.5">
                                    {cat.name}
                                  </h3>
                                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                    {isSearching ? `يحتوي على ${cat.books.length} كتاب مطابق للبحث` : 'تصفح كتب ومصنفات هذا القسم المعتمدة والمحققة في منصة زاد.'}
                                  </p>
                                </div>

                                <div className="pt-4 mt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs font-bold text-brand-magenta">
                                  <span>{isSelected ? 'إخفاء الكتب ▲' : 'استعراض الكتب ▼'}</span>
                                  <span className="text-[11px] text-muted-foreground font-normal">
                                    {isSelected ? 'محدد حالياً' : 'انقر للفتح'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* If a category is selected in grid mode, show its books below */}
                        {(() => {
                          const activeGridCat = booksByCategory.find((c, idx) =>
                            isSearching ? !closedCategories.has(c.name) : (openCategory !== null ? openCategory === c.name : idx === 0)
                          );
                          if (!activeGridCat) return null;

                          return (
                            <div className="p-6 rounded-3xl border border-brand-magenta/30 dark:border-purple-500/30 bg-white/90 dark:bg-[#14062b]/95 backdrop-blur-md shadow-lg animate-in fade-in duration-200 space-y-4">
                              <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-white/10">
                                <div className="flex items-center gap-2.5">
                                  <Layers className="w-5 h-5 text-brand-magenta" />
                                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                                    كتب قسم: <span className="text-brand-magenta">{activeGridCat.name}</span>
                                  </h3>
                                </div>
                                <button
                                  onClick={() => {
                                    if (isSearching) {
                                      setClosedCategories(prev => new Set(prev).add(activeGridCat.name));
                                    } else {
                                      setOpenCategory('');
                                    }
                                  }}
                                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-bold flex items-center gap-1"
                                >
                                  <span>إغلاق القسم</span>
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {activeGridCat.books.map(book => (
                                  <BookCard
                                    key={book.id}
                                    book={book}
                                    viewMode="grid"
                                    onRead={handleReadBook}
                                    onAsk={onAskBook}
                                    onOpenAuthorBio={(b) => setSelectedAuthorBook(b)}
                                    onOpenBookInfo={(b) => setActiveInfoBook(b)}
                                    isFavorite={favoriteBookIds.has(book.id) || favoriteBookIds.has(book.title)}
                                    onToggleFavorite={() => toggleFavorite(book.id || book.title)}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                  </div>
                );
              })()}

              {/* ============================================================= */}
              {/* TAB 2: المـخـتـارة (Featured & Chronological)                 */}
              {/* ============================================================= */}
              {activeMainTab === 'featured' && (
                <div className="animate-in fade-in duration-300 space-y-6">

                  {/* Sticky Search & Filter Hub */}
                  <div className="sticky top-3 z-30 space-y-3">
                    <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-[#121624]/95 p-3 shadow-md backdrop-blur-xl flex flex-col md:flex-row items-center gap-3">

                      {/* Header Title */}
                      <div className="flex items-center gap-2.5 px-3 flex-1 min-w-0">
                        <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
                          الكتب المختارة والمعتمدة ({filteredAndSortedBooks.length})
                        </h3>
                      </div>

                      <div className="hidden md:block w-px h-8 bg-slate-200 dark:bg-white/10" />

                      {/* Century Dropdown */}
                      <div className="w-full md:w-auto min-w-[190px] flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-brand-magenta shrink-0 hidden sm:block" />
                        <select
                          value={selectedCentury}
                          onChange={(e) => setSelectedCentury(e.target.value)}
                          className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-black/30 border border-slate-200/60 dark:border-white/10 text-xs sm:text-sm font-semibold outline-none focus:border-brand-magenta cursor-pointer text-slate-800 dark:text-slate-100"
                        >
                          <option value="all">جميع القرون الهجرية</option>
                          {availableCenturies.map(c => (
                            <option key={c.century} value={c.century.toString()}>
                              {c.name} ({c.count} كتاب)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Sort Toggle */}
                      <button
                        onClick={() => setSortAsc(!sortAsc)}
                        className="w-full md:w-auto px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-100 dark:bg-black/30 hover:bg-slate-200 dark:hover:bg-white/10 text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shrink-0 text-slate-700 dark:text-slate-200"
                        title={sortAsc ? "الترتيب الحالي: من المتقدمين إلى المتأخرين (تصاعدي)" : "الترتيب الحالي: من المتأخرين إلى المتقدمين (تنازلي)"}
                      >
                        <ArrowUpDown className="w-4 h-4 text-brand-magenta" />
                        <span>{sortAsc ? 'الأقدم وفاة ⁳' : 'الأحدث وفاة ⌛'}</span>
                      </button>

                      {/* Grid / List Mode */}
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-black/40 p-1 rounded-xl border border-slate-200/60 dark:border-white/10 shrink-0 self-end md:self-auto">
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`p-2 rounded-lg transition-all ${viewMode === 'grid'
                            ? 'bg-white dark:bg-brand-magenta text-brand-magenta dark:text-white shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                          title="عرض شبكي"
                        >
                          <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setViewMode('list')}
                          className={`p-2 rounded-lg transition-all ${viewMode === 'list'
                            ? 'bg-white dark:bg-brand-magenta text-brand-magenta dark:text-white shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                          title="عرض قائمي"
                        >
                          <List className="w-4 h-4" />
                        </button>
                      </div>

                    </div>

                    {/* Dynamic Domain Filter Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
                      <button
                        onClick={() => setSelectedDomain('all')}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 ${selectedDomain === 'all'
                          ? 'bg-brand-magenta text-white shadow-md shadow-brand-magenta/25'
                          : 'bg-white/80 dark:bg-[#121624]/80 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 border border-slate-200/70 dark:border-white/10'
                          }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        جميع المجالات ({publishedBooks.length})
                      </button>

                      {availableDomains.map(d => (
                        <button
                          key={d.name}
                          onClick={() => setSelectedDomain(d.name)}
                          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 ${selectedDomain === d.name
                            ? 'bg-brand-magenta text-white shadow-md shadow-brand-magenta/25'
                            : 'bg-white/80 dark:bg-[#121624]/80 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 border border-slate-200/70 dark:border-white/10'
                            }`}
                        >
                          <span>{d.name}</span>
                          <span className={`text-[11px] px-1.5 py-0.2 rounded-md ${selectedDomain === d.name ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-white/10 text-muted-foreground'}`}>
                            {d.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Results Header */}
                  <div className="flex items-center justify-between gap-4 px-1">
                    <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">
                      <Library className="w-5 h-5 text-brand-magenta" />
                      <span>الكتب المختارة والمعتمدة</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        (معروض <span className="font-bold text-brand-magenta">{filteredAndSortedBooks.length}</span> كتاب)
                      </span>
                    </div>

                    {(query || selectedDomain !== 'all' || selectedCentury !== 'all') && (
                      <button
                        onClick={() => {
                          setQuery('');
                          setSelectedDomain('all');
                          setSelectedCentury('all');
                        }}
                        className="text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <span>إعادة ضبط الفلاتر</span>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Books Grid / List */}
                  <section>
                    {loading ? (
                      <SkeletonList viewMode={viewMode} />
                    ) : filteredAndSortedBooks.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-slate-200 dark:border-white/10 bg-white/50 dark:bg-card/40 py-20 text-center backdrop-blur-md">
                        <BookMarked className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                        <p className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">لا توجد كتب تطابق معايير الفلترة المحددة</p>
                        <p className="text-xs text-muted-foreground">جرب اختيار مجال آخر أو تغيير القرن الهجري.</p>
                        <button
                          onClick={() => {
                            setQuery('');
                            setSelectedDomain('all');
                            setSelectedCentury('all');
                          }}
                          className="mt-4 px-4 py-2 rounded-xl bg-brand-magenta text-white font-bold text-xs hover:bg-brand-deep transition-all shadow-md"
                        >
                          عرض جميع الكتب
                        </button>
                      </div>
                    ) : viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredAndSortedBooks.map(book => (
                          <BookCard
                            key={book.id}
                            book={book}
                            viewMode="grid"
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
                      <div className="flex flex-col gap-4">
                        {filteredAndSortedBooks.map(book => (
                          <BookCard
                            key={book.id}
                            book={book}
                            viewMode="list"
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
                  </section>
                </div>
              )}

              {/* ============================================================= */}
              {/* TAB 3: الـمـؤلـفـون (Authors by Centuries)                    */}
              {/* ============================================================= */}
              {activeMainTab === 'authors' && (
                <div className="animate-in fade-in duration-300 space-y-6">

                  {/* SUB-VIEW A: Single Author Detailed Profile & His Books */}
                  {selectedAuthor && currentAuthorData ? (
                    <div className="space-y-6">

                      {/* Back Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedAuthor(null)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#121624] border border-slate-200 dark:border-white/10 text-xs sm:text-sm font-bold text-muted-foreground hover:text-brand-magenta hover:border-brand-magenta shadow-sm transition-all"
                      >
                        <ArrowRight className="w-4 h-4" />
                        <span>العودة لقائمة المؤلفين والقرون</span>
                      </button>

                      {/* Author Showcase Banner */}
                      <div className="rounded-3xl border border-brand-magenta/30 bg-gradient-to-br from-brand-magenta/10 via-white to-brand-blue/10 dark:from-brand-magenta/20 dark:via-[#121624] dark:to-brand-blue/10 p-6 sm:p-8 shadow-md backdrop-blur-md">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-magenta to-brand-deep text-white flex items-center justify-center shadow-lg shadow-brand-magenta/30 shrink-0">
                              <GraduationCap className="w-8 h-8" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2.5 flex-wrap mb-2">
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                                  {currentAuthorData.authorName}
                                </h2>
                                {currentAuthorData.deathYear && (
                                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                                    توفي: {currentAuthorData.deathYear} هـ
                                  </span>
                                )}
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-magenta/10 text-brand-magenta border border-brand-magenta/20">
                                  {currentAuthorData.centuryName}
                                </span>
                              </div>

                              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                أحد أئمة وأعلام التراث الإسلامي المعتمدين في منصة زاد • عدد المصنفات المنشورة: <span className="font-bold text-foreground">{currentAuthorData.books.length} مصنف</span>
                              </p>
                            </div>
                          </div>

                          {/* Prominent Author Biography Button */}
                          <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                            <button
                              type="button"
                              onClick={() => setSelectedAuthorBook(currentAuthorData.sampleBook)}
                              className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-brand-magenta text-white font-bold text-sm hover:bg-brand-deep transition-all shadow-md shadow-brand-magenta/30 flex items-center justify-center gap-2 active:scale-95"
                            >
                              <FileText className="w-4 h-4" />
                              <span>📜 ترجمة وسيرة المؤلف</span>
                            </button>
                          </div>

                        </div>
                      </div>

                      {/* Author's Books Header */}
                      <div className="flex items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-200">
                        <BookCheck className="w-5 h-5 text-brand-magenta" />
                        <span>مصنفات ومؤلفات {currentAuthorData.authorName} في زاد</span>
                      </div>

                      {/* Author's Books Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {currentAuthorData.books.map(book => (
                          <BookCard
                            key={book.id}
                            book={book}
                            viewMode="grid"
                            onRead={handleReadBook}
                            onAsk={onAskBook}
                            onOpenAuthorBio={(b) => setSelectedAuthorBook(b)}
                            onOpenBookInfo={(b) => setActiveInfoBook(b)}
                            isFavorite={favoriteBookIds.has(book.id) || favoriteBookIds.has(book.title)}
                            onToggleFavorite={() => toggleFavorite(book.id || book.title)}
                          />
                        ))}
                      </div>

                    </div>
                  ) : (
                    /* SUB-VIEW B: Centuries List with Layout Toggle (فوق بعض vs جنب بعض) */
                    <div className="space-y-6">

                      {/* 1. Authors Statistics Grid (بطاقات إحصائيات المؤلفين) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Stat 1: Total Authors */}
                        <div className="rounded-2xl border border-slate-200/80 dark:border-purple-500/25 bg-white/90 dark:bg-[#14062b]/90 p-4 shadow-sm backdrop-blur-md flex items-center gap-3.5 hover:border-blue-500/40 transition-all">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/15 to-indigo-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-sm">
                            <User className="w-6 h-6" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">أعلام ومؤلفو التراث</span>
                            <span className="text-xl font-black text-slate-900 dark:text-white block tracking-tight">
                              {liveStats.total_authors} <span className="text-xs font-bold text-blue-600 dark:text-blue-400">عالماً وإماماً</span>
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate block">من كبار أئمة ومحققي الأمة</span>
                          </div>
                        </div>

                        {/* Stat 2: Historical Timeline */}
                        <div className="rounded-2xl border border-slate-200/80 dark:border-purple-500/25 bg-white/90 dark:bg-[#14062b]/90 p-4 shadow-sm backdrop-blur-md flex items-center gap-3.5 hover:border-amber-500/40 transition-all">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/15 to-orange-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
                            <Calendar className="w-6 h-6" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">النطاق الزمني الهجري</span>
                            <span className="text-base font-black text-slate-900 dark:text-white block truncate">
                              من القرن {availableCenturies[0]?.century || 1} حتى {availableCenturies[availableCenturies.length - 1]?.century || 15} هـ
                            </span>
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">
                              15 قرناً من التأليف والتدوين
                            </span>
                          </div>
                        </div>

                        {/* Stat 3: Centuries Count */}
                        <div className="rounded-2xl border border-slate-200/80 dark:border-purple-500/25 bg-white/90 dark:bg-[#14062b]/90 p-4 shadow-sm backdrop-blur-md flex items-center gap-3.5 hover:border-purple-500/40 transition-all">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/15 to-pink-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-sm">
                            <Clock className="w-6 h-6" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">القرون الهجرية الموثقة</span>
                            <span className="text-xl font-black text-slate-900 dark:text-white block tracking-tight">
                              {availableCenturies.length} <span className="text-xs font-bold text-purple-600 dark:text-purple-400">حقباً وقروناً</span>
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate block">مرتبة تاريخياً بدقة</span>
                          </div>
                        </div>

                        {/* Stat 4: Total Works */}
                        <div className="rounded-2xl border border-slate-200/80 dark:border-purple-500/25 bg-white/90 dark:bg-[#14062b]/90 p-4 shadow-sm backdrop-blur-md flex items-center gap-3.5 hover:border-emerald-500/40 transition-all">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
                            <BookCheck className="w-6 h-6" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">إجمالي المصنفات المعتمدة</span>
                            <span className="text-xl font-black text-slate-900 dark:text-white block tracking-tight">
                              {publishedBooks.length} <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">مصنفاً</span>
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate block">موزعة على الأئمة وتلاميذهم</span>
                          </div>
                        </div>
                      </div>

                      {/* 2. In-Page Search Console (مربع البحث مطابق للرئيسية تماماً بدون أي فريم إضافي) */}
                      <div id="subpage-main-search-bar" className="max-w-4xl mx-auto w-full">
                        {renderSearchConsole(false)}
                      </div>

                      {/* 3. Header & Layout Toggle Bar for Authors */}
                      <div className="rounded-2xl border border-slate-200/90 dark:border-purple-500/20 bg-white/95 dark:bg-[#14062b]/95 p-3 sm:px-5 shadow-sm backdrop-blur-xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-brand-blue" />
                          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                            أعلام ومؤلفو التراث ({authorsByCentury.reduce((sum, c) => sum + c.authors.length, 0)} عالماً)
                          </h3>
                        </div>

                        {/* View Toggle (فوق بعض vs جنب بعض) */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground font-semibold hidden sm:inline">طريقة العرض:</span>
                          <div className="flex items-center gap-1 bg-slate-100 dark:bg-black/40 p-1 rounded-xl border border-slate-200/60 dark:border-white/10">
                            <button
                              onClick={() => setAuthorsViewMode('list')}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${authorsViewMode === 'list'
                                ? 'bg-white dark:bg-brand-magenta text-brand-magenta dark:text-white shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                              title="عرض فوق بعض (قوائم منسدلة للقرون)"
                            >
                              <List className="w-3.5 h-3.5" />
                              <span>فوق بعض</span>
                            </button>

                            <button
                              onClick={() => setAuthorsViewMode('grid')}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${authorsViewMode === 'grid'
                                ? 'bg-white dark:bg-brand-magenta text-brand-magenta dark:text-white shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                              title="عرض جنب بعض (بطاقات شبكية للقرون)"
                            >
                              <LayoutGrid className="w-3.5 h-3.5" />
                              <span>جنب بعض</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* AUTHORS CONTENT: LIST MODE (فوق بعض) */}
                      {authorsViewMode === 'list' ? (
                        <div className="space-y-4">
                          {authorsByCentury.map(cGroup => {
                            const isOpen = openCentury === cGroup.century;
                            return (
                              <div
                                key={cGroup.century}
                                className="rounded-2xl border border-slate-200/80 dark:border-purple-500/25 bg-white dark:bg-[#14062b] overflow-hidden shadow-sm transition-all hover:border-brand-magenta/40"
                              >
                                {/* Century Accordion Header */}
                                <button
                                  type="button"
                                  onClick={() => setOpenCentury(isOpen ? null : cGroup.century)}
                                  className={`w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-right transition-colors ${isOpen
                                    ? 'bg-amber-500/5 dark:bg-amber-500/15 border-b border-slate-200/60 dark:border-amber-500/20'
                                    : 'hover:bg-slate-50 dark:hover:bg-white/5'
                                    }`}
                                >
                                  <div className="flex items-center gap-3.5 min-w-0">
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold shrink-0 transition-colors ${isOpen
                                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                      }`}>
                                      <Calendar className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                      <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                                        {cGroup.centuryName}
                                      </h3>
                                      <p className="text-xs text-muted-foreground">
                                        يضم <span className="font-bold text-brand-magenta">{cGroup.authors.length}</span> إماماً وعالماً • <span className="font-bold">{cGroup.totalBooks}</span> كتب
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 shrink-0">
                                    <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-black/30 text-slate-700 dark:text-slate-300">
                                      {cGroup.authors.length} مؤلف
                                    </span>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 ${isOpen ? 'rotate-180 bg-brand-magenta text-white' : 'bg-slate-100 dark:bg-white/5 text-muted-foreground'
                                      }`}>
                                      <ChevronDown className="w-4 h-4" />
                                    </div>
                                  </div>
                                </button>

                                {/* Century Body (List of Authors) */}
                                {isOpen && (
                                  <div className="p-4 sm:p-6 bg-slate-50/50 dark:bg-black/30 animate-in fade-in duration-200">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                      {cGroup.authors.map(author => (
                                        <div
                                          key={author.authorName}
                                          className="rounded-2xl border border-slate-200/80 dark:border-purple-500/20 bg-white dark:bg-[#1a0836] p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-brand-magenta/40 transition-all flex flex-col justify-between"
                                        >
                                          <div>
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                              <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-9 h-9 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0">
                                                  <User className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                  <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                                                    {author.authorName}
                                                  </h4>
                                                  {author.deathYear ? (
                                                    <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400">
                                                      (توفي: {author.deathYear} هـ)
                                                    </span>
                                                  ) : (
                                                    <span className="text-[11px] text-muted-foreground">
                                                      (معاصر)
                                                    </span>
                                                  )}
                                                </div>
                                              </div>

                                              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-white/5 text-muted-foreground shrink-0">
                                                {author.books.length} {author.books.length === 1 ? 'كتاب' : 'كتب'}
                                              </span>
                                            </div>

                                            {/* Preview of author's titles */}
                                            <div className="my-3 space-y-1">
                                              {author.books.slice(0, 2).map(b => (
                                                <div key={b.id} className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
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

                                          {/* Author Actions */}
                                          <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center gap-2">
                                            <button
                                              type="button"
                                              onClick={() => setSelectedAuthorBook(author.sampleBook)}
                                              className="flex-1 py-2 px-3 rounded-xl border border-brand-magenta/30 bg-brand-magenta/5 text-brand-magenta hover:bg-brand-magenta/15 text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
                                              title="عرض السيرة الذاتية والشيوخ"
                                            >
                                              <FileText className="w-3.5 h-3.5" />
                                              <span>السيرة</span>
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => setSelectedAuthor(author.authorName)}
                                              className="flex-1 py-2 px-3 rounded-xl bg-brand-magenta text-white text-xs font-bold hover:bg-brand-deep transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                                              title="عرض جميع مصنفات هذا الإمام"
                                            >
                                              <span>الكتب</span>
                                              <ChevronLeft className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {authorsByCentury.length === 0 && (
                            <div className="p-12 text-center text-muted-foreground">
                              لم يتم العثور على مؤلفين يطابقون بحثك.
                            </div>
                          )}
                        </div>
                      ) : (
                        /* AUTHORS CONTENT: GRID MODE (جنب بعض) */
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {authorsByCentury.map(cGroup => {
                              const isOpen = openCentury === cGroup.century;
                              return (
                                <div
                                  key={cGroup.century}
                                  onClick={() => setOpenCentury(isOpen ? null : cGroup.century)}
                                  className={`cursor-pointer rounded-2xl border p-5 transition-all flex flex-col justify-between ${isOpen
                                    ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/15 shadow-md'
                                    : 'border-slate-200/80 dark:border-purple-500/25 bg-white dark:bg-[#14062b] hover:border-amber-500/40 hover:shadow-md'
                                    }`}
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-3 mb-3">
                                      <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                        <Calendar className="w-5 h-5" />
                                      </div>
                                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-black/30 text-slate-700 dark:text-slate-300">
                                        {cGroup.authors.length} مؤلف
                                      </span>
                                    </div>

                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">
                                      {cGroup.centuryName}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                      يضم <span className="font-bold text-brand-magenta">{cGroup.authors.length}</span> إماماً وعالماً • <span className="font-bold">{cGroup.totalBooks}</span> كتب منشورة
                                    </p>
                                  </div>

                                  <div className="pt-4 mt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
                                    <span>{isOpen ? 'إخفاء الأعلام ▲' : 'استعراض الأعلام ▼'}</span>
                                    <span className="text-[11px] text-muted-foreground font-normal">
                                      {isOpen ? 'مفتوح حالياً' : 'انقر للفتح'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* If a century is selected in grid mode, show its authors below */}
                          {openCentury && (
                            <div className="p-6 rounded-3xl border border-amber-500/30 bg-white/90 dark:bg-[#14062b]/95 backdrop-blur-md shadow-lg animate-in fade-in duration-200 space-y-4">
                              <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-white/10">
                                <div className="flex items-center gap-2.5">
                                  <Calendar className="w-5 h-5 text-amber-500" />
                                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                                    علماء وأعلام: <span className="text-amber-600 dark:text-amber-400">{authorsByCentury.find(c => c.century === openCentury)?.centuryName}</span>
                                  </h3>
                                </div>
                                <button
                                  onClick={() => setOpenCentury(null)}
                                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-bold flex items-center gap-1"
                                >
                                  <span>إغلاق القرن</span>
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {authorsByCentury.find(c => c.century === openCentury)?.authors.map(author => (
                                  <div
                                    key={author.authorName}
                                    className="rounded-2xl border border-slate-200/80 dark:border-purple-500/20 bg-white dark:bg-[#1a0836] p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-brand-magenta/40 transition-all flex flex-col justify-between"
                                  >
                                    <div>
                                      <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <div className="w-9 h-9 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0">
                                            <User className="w-4 h-4" />
                                          </div>
                                          <div className="min-w-0">
                                            <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                                              {author.authorName}
                                            </h4>
                                            {author.deathYear ? (
                                              <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400">
                                                (توفي: {author.deathYear} هـ)
                                              </span>
                                            ) : (
                                              <span className="text-[11px] text-muted-foreground">
                                                (معاصر)
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-white/5 text-muted-foreground shrink-0">
                                          {author.books.length} {author.books.length === 1 ? 'كتاب' : 'كتب'}
                                        </span>
                                      </div>

                                      <div className="my-3 space-y-1">
                                        {author.books.slice(0, 2).map(b => (
                                          <div key={b.id} className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
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

                                    <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedAuthorBook(author.sampleBook)}
                                        className="flex-1 py-2 px-3 rounded-xl border border-brand-magenta/30 bg-brand-magenta/5 text-brand-magenta hover:bg-brand-magenta/15 text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
                                        title="عرض السيرة الذاتية والشيوخ"
                                      >
                                        <FileText className="w-3.5 h-3.5" />
                                        <span>السيرة</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => setSelectedAuthor(author.authorName)}
                                        className="flex-1 py-2 px-3 rounded-xl bg-brand-magenta text-white text-xs font-bold hover:bg-brand-deep transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                                        title="عرض جميع مصنفات هذا الإمام"
                                      >
                                        <span>الكتب</span>
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>
        </main>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* FLOATING BOOK INFO MODAL CARD (نافذة عائمة مع خلفية قابلة للنقر) */}
      {/* ------------------------------------------------------------- */}
      {activeInfoBook && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setActiveInfoBook(null)}
        >
          <div
            className="relative w-full max-w-xl bg-white dark:bg-[#121624] rounded-3xl border border-slate-200 dark:border-white/10 p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Close Button */}
            <button
              onClick={() => setActiveInfoBook(null)}
              className="absolute left-5 top-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
              title="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-start gap-4 mb-4 pr-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-magenta to-brand-deep text-white flex items-center justify-center shrink-0 shadow-md">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug mb-1.5 line-clamp-2">
                  {activeInfoBook.title}
                </h3>
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    المؤلف: {activeInfoBook.author}
                  </span>
                  {activeInfoBook.category && (
                    <span className="px-2 py-0.5 rounded-md bg-brand-magenta/10 text-brand-magenta font-bold border border-brand-magenta/20">
                      {activeInfoBook.category}
                    </span>
                  )}
                  {activeInfoBook.century_name && activeInfoBook.century_name !== 'غير محدد' && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20">
                      {activeInfoBook.century_name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-100 dark:bg-white/5 my-4" />

            {/* Content Body */}
            <div className="max-h-[50vh] overflow-y-auto pr-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {loadingInfo ? (
                <div className="flex items-center justify-center gap-3 py-10 text-brand-magenta font-bold">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>جاري جلب تفاصيل ومعلومات الكتاب...</span>
                </div>
              ) : (
                modalInfoText || activeInfoBook.infoText || 'لم تتوفر تفاصيل إضافية لهذا الكتاب حالياً.'
              )}
            </div>

            {/* Footer Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center gap-3">
              <button
                onClick={() => {
                  const b = activeInfoBook;
                  setActiveInfoBook(null);
                  handleReadBook(b);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-brand-magenta text-white font-bold text-xs sm:text-sm hover:bg-brand-deep transition-all shadow-md shadow-brand-magenta/20 flex items-center justify-center gap-2 active:scale-95"
              >
                <FileText className="w-4 h-4" />
                <span>تصفح وقراءة الكتاب</span>
              </button>

              <button
                onClick={() => {
                  const b = activeInfoBook;
                  setActiveInfoBook(null);
                  onAskBook(b);
                }}
                className="flex-1 py-3 px-4 rounded-xl border border-brand-magenta/30 bg-brand-magenta/5 text-brand-magenta hover:bg-brand-magenta/15 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>اسأل زاد عن الكتاب</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Author Biography Modal */}
      <AuthorBiographyModal
        isOpen={!!selectedAuthorBook}
        onClose={() => setSelectedAuthorBook(null)}
        bookId={selectedAuthorBook?.id}
        authorId={selectedAuthorBook?.author_id}
        authorName={selectedAuthorBook?.author}
        bookTitle={selectedAuthorBook?.title}
        authorBioText={selectedAuthorBook?.authorBioText}
        onOpenBook={(bookId, bookName) => {
          setSelectedBook({
            id: Number(bookId),
            title: bookName || "كتاب من المكتبة",
            author: selectedAuthorBook?.author || ""
          });
          setView('reader');
        }}
        onAskZadAboutAuthor={(authorName) => {
          setSelectedAuthorBook(null);
          onAskBook({
            id: selectedAuthorBook?.id || 0,
            title: `سيرة ${authorName}`,
            author: authorName,
            initialPrompt: `حدثني بالتفصيل عن السيرة الذاتية والمذهب الفقهي وشيوخ ومصنفات ${authorName}`
          });
        }}
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
