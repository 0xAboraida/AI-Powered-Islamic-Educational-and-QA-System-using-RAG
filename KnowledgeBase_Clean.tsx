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
  const category = (b.category || b.cat_name || 'Ø¹Ø§Ù…').trim();
  const infoText = (b.infoText || b.book_info_text || b.info || '').trim();
  const authorBioText = (b.authorBioText || b.author_bio_text || '').trim();
  return {
    ...b,
    id: b.id,
    title: title || 'Ø¨Ø¯ÙˆÙ† Ø¹Ù†ÙˆØ§Ù†',
    name: title || 'Ø¨Ø¯ÙˆÙ† Ø¹Ù†ÙˆØ§Ù†',
    author: author || 'Ù…Ù† ØºÙŠØ± Ù…Ø¹Ø±ÙˆÙ�',
    author_name: author || 'Ù…Ù† ØºÙŠØ± Ù…Ø¹Ø±ÙˆÙ�',
    category: category || 'Ø¹Ø§Ù…',
    cat_name: category || 'Ø¹Ø§Ù…',
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
      infoText: `ÙƒØªØ§Ø¨ ${b.title} Ù�ÙŠ ${dom.name} (${cat.name}) Ù„Ù„Ù…Ø¤Ù„Ù� ${b.author}`,
      book_info_text: `ÙƒØªØ§Ø¨ ${b.title} Ù�ÙŠ ${dom.name} (${cat.name}) Ù„Ù„Ù…Ø¤Ù„Ù� ${b.author}`,
      info: `ÙƒØªØ§Ø¨ ${b.title} Ù�ÙŠ ${dom.name} (${cat.name}) Ù„Ù„Ù…Ø¤Ù„Ù� ${b.author}`,
      authorBioText: `Ø§Ù„Ø¹Ø§Ù„Ù… ÙˆØ§Ù„Ù…ØµÙ†Ù� ${b.author}`,
      author_bio_text: `Ø§Ù„Ø¹Ø§Ù„Ù… ÙˆØ§Ù„Ù…ØµÙ†Ù� ${b.author}`,
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
  1: "Ø§Ù„Ù‚Ø±Ù† Ø§Ù„Ø£ÙˆÙ„ Ù‡Ù€",
  2: "Ø§Ù„Ù‚Ø±Ù† Ø§Ù„Ø«Ø§Ù†ÙŠ Ù‡Ù€",
  3: "Ø§Ù„Ù‚Ø±Ù† Ø§Ù„Ø«Ø§Ù„Ø« Ù‡Ù€",
  4: "Ø§Ù„Ù‚Ø±Ù† Ø§Ù„Ø±Ø§Ø¨Ø¹ Ù‡Ù€",
  5: "Ø§Ù„Ù‚Ø±Ù† Ø§Ù„Ø®Ø§Ù…Ø³ Ù‡Ù€",
  6: "Ø§Ù„Ù‚Ø±Ù† Ø§Ù„Ø³Ø§Ø¯Ø³ Ù‡Ù€",
  7: "Ø§Ù„Ù‚Ø±Ù† Ø§Ù„Ø³Ø§Ø¨Ø¹ Ù‡Ù€",
  8: "Ø§Ù„Ù‚Ø±Ù† Ø§Ù„Ø«Ø§Ù…Ù† Ù‡Ù€",
  9: "Ø§Ù„Ù‚Ø±Ù† Ø§Ù„ØªØ§Ø³Ø¹ Ù‡Ù€",
  10: "Ø§Ù„Ù‚Ø±Ù† Ø§Ù„Ø¹Ø§Ø´Ø± Ù‡Ù€",
  11: "Ø§Ù„Ù‚Ø±Ù† Ø§Ù„Ø­Ø§Ø¯ÙŠ Ø¹Ø´Ø± Ù‡Ù€",
  12: "Ø§Ù„Ù‚Ø±Ù† Ø§Ù„Ø«Ø§Ù†ÙŠ Ø¹Ø´Ø± Ù‡Ù€",
  13: "Ø§Ù„Ù‚Ø±Ù† Ø§Ù„Ø«Ø§Ù„Ø« Ø¹Ø´Ø± Ù‡Ù€",
  14: "Ø§Ù„Ù‚Ø±Ù† Ø§Ù„Ø±Ø§Ø¨Ø¹ Ø¹Ø´Ø± Ù‡Ù€",
  15: "Ø§Ù„Ù‚Ø±Ù† Ø§Ù„Ø®Ø§Ù…Ø³ Ø¹Ø´Ø± Ù‡Ù€ (Ø§Ù„Ù…Ø¹Ø§ØµØ±)",
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
      centuryName: book.century_name || (c ? CENTURY_NAMES_MAP[c] || `Ø§Ù„Ù‚Ø±Ù† ${c} Ù‡Ù€` : 'ØºÙŠØ± Ù…Ø­Ø¯Ø¯')
    };
  }

  const arToEn = (str: string) => str.replace(/[Ù -Ù©]/g, d => '0123456789'['Ù Ù¡Ù¢Ù£Ù¤Ù¥Ù¦Ù§Ù¨Ù©'.indexOf(d)]);
  const authorBio = arToEn(book.authorBioText || book.author_bio_text || '');
  const bookInfo = arToEn(book.infoText || book.book_info_text || book.info || '');
  const bookTitle = (book.title || book.name || '').trim();

  const extractYear = (text: string) => {
    if (!text) return null;
    const m = text.match(/(?:Øª|ØªÙˆÙ�ÙŠ|ÙˆÙ�Ø§ØªÙ‡|Ø§Ù„Ù…ØªÙˆÙ�Ù‰|Ø§Ù„Ù…ØªÙˆÙ�Ù‰ Ø³Ù†Ø©|Ø¹Ø§Ù…)\s*[:\s]?\s*(\d{1,4})\s*(?:Ù‡Ù€|Ù‡Ù€\b|\))/);
    if (m) {
      const y = parseInt(m[1], 10);
      if (y >= 10 && y <= 1450) return y;
    }
    const m2 = text.match(/[\(â€“\-]\s*(?:\d{1,4}\s*[\-â€“]\s*)?(\d{1,4})\s*Ù‡Ù€/);
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
    return { deathYear: yAuthor, century: c, centuryName: CENTURY_NAMES_MAP[c] || `Ø§Ù„Ù‚Ø±Ù† ${c} Ù‡Ù€` };
  }

  // 2. Contemporary scholar by birth
  const mBirth = authorBio.match(/(?:ÙˆÙ„Ø¯|Ù…ÙŠÙ„Ø§Ø¯Ù‡)\s*(?:Ù�ÙŠ|Ø¹Ø§Ù…|Ø³Ù†Ø©)?\s*(\d{4})\s*(?:Ù‡Ù€|Ù‡Ø¬Ø±ÙŠØ©|Ù…|Ù…ÙŠÙ„Ø§Ø¯ÙŠØ©)?/);
  if (mBirth) {
    const by = parseInt(mBirth[1], 10);
    if (by >= 1300 || by >= 1900) {
      return { deathYear: null, century: 15, centuryName: CENTURY_NAMES_MAP[15] };
    }
  }

  // 3. Contemporary markers in biography
  if (/Ø­Ù�Ø¸Ù‡ Ø§Ù„Ù„Ù‡|Ø£Ø·Ø§Ù„ Ø§Ù„Ù„Ù‡ Ø¹Ù…Ø±Ù‡|Ø±Ø¹Ø§Ù‡ Ø§Ù„Ù„Ù‡|Ù…Ø¹Ø§ØµØ±|Ø¹Ø¶Ùˆ Ù‡ÙŠØ¦Ø© ÙƒØ¨Ø§Ø±|Ø¬Ø§Ù…Ø¹Ø© Ø§Ù„Ø¥Ù…Ø§Ù…|Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø§Ù„Ø¥Ø³Ù„Ø§Ù…ÙŠØ©/.test(authorBio)) {
    return { deathYear: null, century: 15, centuryName: CENTURY_NAMES_MAP[15] };
  }

  // 4. Commentary Isolation Rule:
  // If the work is a commentary/sharh/hashiya, book_info describes the original text author
  // and must NOT be attributed to the commentator.
  const isCommentary = /Ø´Ø±Ø­|Ø­Ø§Ø´ÙŠØ©|ØªØ¹Ù„ÙŠÙ‚|ØªÙ‚Ø±ÙŠØ±|Ø¯Ø±ÙˆØ³|Ù�ÙˆØ§Ø¦Ø¯|Ø¥Ù…Ù„Ø§Ø¡|ØªÙ„Ø®ÙŠØµ|ØªÙ‡Ø°ÙŠØ¨/.test(bookTitle);
  if (isCommentary) {
    return { deathYear: null, century: 15, centuryName: CENTURY_NAMES_MAP[15] };
  }

  // 5. Original works fallback to book_info
  const yBook = extractYear(bookInfo);
  if (yBook) {
    const c = Math.floor((yBook - 1) / 100) + 1;
    return { deathYear: yBook, century: c, centuryName: CENTURY_NAMES_MAP[c] || `Ø§Ù„Ù‚Ø±Ù† ${c} Ù‡Ù€` };
  }

  return { deathYear: null, century: null, centuryName: 'ØºÙŠØ± Ù…Ø­Ø¯Ø¯' };
}

// -------------------------------------------------------------
// Quick Search Suggestion Tags
// -------------------------------------------------------------
const QUICK_SEARCH_TAGS = [
  'ØµØ­ÙŠØ­ Ø§Ù„Ø¨Ø®Ø§Ø±ÙŠ',
  'Ø§Ù„Ù…ØºÙ†ÙŠ Ù„Ø§Ø¨Ù† Ù‚Ø¯Ø§Ù…Ø©',
  'Ø´Ø±ÙˆØ­ Ø§Ù„Ø­Ø¯ÙŠØ«',
  'Ø§Ù„Ù�Ù‚Ù‡ Ø§Ù„Ø­Ù†Ø¨Ù„ÙŠ',
  'Ø§Ø¨Ù† ØªÙŠÙ…ÙŠØ©',
  'Ø§Ù„Ø¹Ù‚ÙŠØ¯Ø© ÙˆØ§Ù„ØªÙˆØ­ÙŠØ¯',
  'Ø§Ù„Ù†ÙˆÙˆÙŠ',
  'ØªÙ�Ø³ÙŠØ± Ø§Ø¨Ù† ÙƒØ«ÙŠØ±'
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
                title={isFavorite ? 'Ø¥Ø²Ø§Ù„Ø© Ù…Ù† Ø§Ù„Ù…Ù�Ø¶Ù„Ø©' : 'Ø¥Ø¶Ø§Ù�Ø© Ø¥Ù„Ù‰ Ø§Ù„Ù…Ù�Ø¶Ù„Ø©'}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current text-rose-500' : ''}`} />
              </button>
            )}
          </div>

          {/* Row 2: Author Name + Category Badge + Century Badge */}
          <div className="flex items-center gap-2 flex-wrap mb-4 pr-1">
            {onOpenAuthorBio && book.author && book.author !== 'Ù…Ù† ØºÙŠØ± Ù…Ø¹Ø±ÙˆÙ�' ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAuthorBio(book);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-brand-magenta transition-colors group/author outline-none text-right shrink-0"
                title="Ø¹Ø±Ø¶ ØªØ±Ø¬Ù…Ø© ÙˆØ³ÙŠØ±Ø© Ø§Ù„Ù…Ø¤Ù„Ù�"
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
            {centuryName && centuryName !== 'ØºÙŠØ± Ù…Ø­Ø¯Ø¯' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shrink-0" title={`ØªÙˆÙ�ÙŠ: ${deathYear ? deathYear + ' Ù‡Ù€' : 'Ø§Ù„Ù…Ø¹Ø§ØµØ±'}`}>
                <Calendar className="w-3 h-3" />
                {centuryName}
                {deathYear && <span className="opacity-75 font-mono">({deathYear}Ù‡Ù€)</span>}
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
              title="ØªØµÙ�Ø­ ÙˆÙ‚Ø±Ø§Ø¡Ø© Ø§Ù„ÙƒØªØ§Ø¨"
            >
              <FileText className="w-3.5 h-3.5" />
              ØªØµÙ�Ø­
            </button>

            <button
              type="button"
              onClick={() => onAsk(book)}
              className="py-2 px-3 rounded-xl border border-brand-magenta/30 bg-brand-magenta/5 text-brand-magenta hover:bg-brand-magenta/15 text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
              title="Ø³Ø¤Ø§Ù„ Ø§Ù„Ù…Ø³Ø§Ø¹Ø¯ Ø§Ù„Ø°ÙƒÙŠ Ø­ÙˆÙ„ Ø§Ù„ÙƒØªØ§Ø¨"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Ø§Ø³Ø£Ù„ Ø²Ø§Ø¯
            </button>

            <button
              type="button"
              onClick={() => onOpenBookInfo(book)}
              className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-muted-foreground hover:text-brand-magenta hover:bg-brand-magenta/10 hover:border-brand-magenta/30 transition-all flex items-center justify-center"
              title="ØªÙ�Ø§ØµÙŠÙ„ ÙˆÙ…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„ÙƒØªØ§Ø¨"
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
              {onOpenAuthorBio && book.author && book.author !== 'Ù…Ù† ØºÙŠØ± Ù…Ø¹Ø±ÙˆÙ�' ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenAuthorBio(book);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-brand-magenta transition-colors group/author outline-none text-right shrink-0"
                  title="Ø¹Ø±Ø¶ ØªØ±Ø¬Ù…Ø© ÙˆØ³ÙŠØ±Ø© Ø§Ù„Ù…Ø¤Ù„Ù�"
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
              {centuryName && centuryName !== 'ØºÙŠØ± Ù…Ø­Ø¯Ø¯' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shrink-0" title={`ØªÙˆÙ�ÙŠ: ${deathYear ? deathYear + ' Ù‡Ù€' : 'Ø§Ù„Ù…Ø¹Ø§ØµØ±'}`}>
                  <Calendar className="w-3 h-3" />
                  {centuryName}
                  {deathYear && <span className="font-mono">({deathYear}Ù‡Ù€)</span>}
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
            title="ØªØµÙ�Ø­ ÙˆÙ‚Ø±Ø§Ø¡Ø© Ø§Ù„ÙƒØªØ§Ø¨"
          >
            <FileText className="w-4 h-4" /> <span>ØªØµÙ�Ø­</span>
          </button>

          <button
            type="button"
            onClick={() => onAsk(book)}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-brand-magenta/30 bg-brand-magenta/5 text-brand-magenta hover:bg-brand-magenta/15 text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
            title="Ø§Ø³Ø£Ù„ Ø²Ø§Ø¯"
          >
            <Sparkles className="w-4 h-4" /> <span>Ø§Ø³Ø£Ù„ Ø²Ø§Ø¯</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenBookInfo(book)}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-muted-foreground hover:text-brand-magenta hover:bg-brand-magenta/10 hover:border-brand-magenta/30 transition-all flex items-center justify-center"
            title="Ù…Ø¹Ù„ÙˆÙ…Ø§Øª ÙˆØªÙ�Ø§ØµÙŠÙ„ Ø§Ù„ÙƒØªØ§Ø¨"
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
              title={isFavorite ? 'Ø¥Ø²Ø§Ù„Ø© Ù…Ù† Ø§Ù„Ù…Ù�Ø¶Ù„Ø©' : 'Ø¥Ø¶Ø§Ù�Ø© Ø¥Ù„Ù‰ Ø§Ù„Ù…Ù�Ø¶Ù„Ø©'}
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

  // Scroll Listener for Navbar Activation across all library views (ÙŠØ¸Ù‡Ø± Ù�Ù‚Ø· Ø¹Ù†Ø¯ Ø§Ø®ØªÙ�Ø§Ø¡ Ø´Ø±ÙŠØ· Ø§Ù„Ø¨Ø­Ø« ØªÙ…Ø§Ù…Ø§Ù‹ Ù…Ù† Ø§Ù„Ø´Ø§Ø´Ø©)
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

  // Favorites State (Ø§Ù„Ù…Ù�Ø¶Ù„Ø©)
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

  // Media & Courses Data (Ù…Ù‡ÙŠØ£Ø© ÙˆÙ…Ø¬Ù‡Ø²Ø© Ù„Ù„Ø±Ø¨Ø· Ø¨Ù€ MongoDB)
  const [sheikhs] = useState<Sheikh[]>(INITIAL_SHEIKHS);
  const [playlists] = useState<MediaPlaylist[]>(INITIAL_PLAYLISTS);
  const [standaloneItems] = useState<MediaStandalone[]>(INITIAL_STANDALONE);
  const [courses] = useState<Course[]>(INITIAL_COURSES);

  // Tab 1 (Ø§Ù„Ù…Ø®ØªØ§Ø±Ø©) Filter States
  const [query, setQuery] = useState('')
  const [selectedDomain, setSelectedDomain] = useState<string>('all')
  const [filterAuthor, setFilterAuthor] = useState<string>('all')
  const [selectedCentury, setSelectedCentury] = useState<string>('all')
  const [sortAsc, setSortAsc] = useState<boolean>(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Tab 2 (Ø§Ù„Ø£Ù‚Ø³Ø§Ù…) State
  const [openCategory, setOpenCategory] = useState<string | null>(null)
  const [closedCategories, setClosedCategories] = useState<Set<string>>(new Set())
  const [categorySearch, setCategorySearch] = useState<string>('')
  const [categoriesViewMode, setCategoriesViewMode] = useState<'grid' | 'list'>('list') // 'list' = Ù�ÙˆÙ‚ Ø¨Ø¹Ø¶, 'grid' = Ø¬Ù†Ø¨ Ø¨Ø¹Ø¶

  // Tab 3 (Ø§Ù„Ù…Ø¤Ù„Ù�ÙˆÙ†) State
  const [openCentury, setOpenCentury] = useState<number | null>(null)
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null)
  const [authorSearch, setAuthorSearch] = useState<string>('')
  const [authorsViewMode, setAuthorsViewMode] = useState<'grid' | 'list'>('list') // 'list' = Ù�ÙˆÙ‚ Ø¨Ø¹Ø¶, 'grid' = Ø¬Ù†Ø¨ Ø¨Ø¹Ø¶

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

  // Dropdown Popovers State (Ù„Ù‚Ø§Ø¦Ù…ØªÙŠ Ø§Ù„Ù‚Ø³Ù… ÙˆØ§Ù„Ù…Ø¤Ù„Ù� Ø§Ù„Ù…Ù†Ø¨Ø«Ù‚ØªÙŠÙ† Ù�ÙŠ Ø·Ø±Ù� Ø§Ù„Ø³ÙŠØ±Ø´ Ø¨Ø§Ø±)
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

  // Featured Books Set (Ø§Ù„Ù…Ø®ØªØ§Ø±Ø©)
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
          setModalInfoText(data.meta?.info || 'Ù„Ù… ØªØªÙˆÙ�Ø± ØªÙ�Ø§ØµÙŠÙ„ Ø¥Ø¶Ø§Ù�ÙŠØ© Ù„Ù‡Ø°Ø§ Ø§Ù„ÙƒØªØ§Ø¨ Ø­Ø§Ù„ÙŠØ§Ù‹.');
        } else {
          setModalInfoText('Ù�Ø´Ù„ Ø¬Ù„Ø¨ ØªÙ�Ø§ØµÙŠÙ„ Ø§Ù„ÙƒØªØ§Ø¨ Ù…Ù† Ø§Ù„Ø®Ø§Ø¯Ù….');
        }
      } catch (err) {
        setModalInfoText('Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ù…Ø­Ø§ÙˆÙ„Ø© Ø¬Ù„Ø¨ Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª.');
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
      const cat = b.category || 'Ø£Ø®Ø±Ù‰';
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
      if (author && author !== 'Ù…Ù† ØºÙŠØ± Ù…Ø¹Ø±ÙˆÙ�') {
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
          name: CENTURY_NAMES_MAP[c] || `Ø§Ù„Ù‚Ø±Ù† ${c} Ù‡Ù€`,
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
      const cat = b.category || 'Ø£Ø®Ø±Ù‰';
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
      const cName = centuryName !== 'ØºÙŠØ± Ù…Ø­Ø¯Ø¯' ? centuryName : (CENTURY_NAMES_MAP[c] || `Ø§Ù„Ù‚Ø±Ù† ${c} Ù‡Ù€`);

      if (!map[c]) {
        map[c] = {
          century: c,
          centuryName: cName,
          authors: {}
        };
      }

      const authorKey = (b.author || 'Ù…Ø¤Ù„Ù� ØºÙŠØ± Ù…Ø¹Ø±ÙˆÙ�').trim();
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
              placeholder="Ø§Ø¨Ø­Ø« Ø¹Ù† ÙƒØªØ§Ø¨ (Ù…Ø«Ù„: Ø¹Ù…Ø¯Ø© Ø§Ù„Ù�Ù‚Ù‡)ØŒ Ù…Ø¤Ù„Ù� (Ù…Ø«Ù„: Ø§Ø¨Ù† Ù‚Ø¯Ø§Ù…Ø©)ØŒ Ø£Ùˆ Ø¨Ø§Ø¨ Ø´Ø±Ø¹ÙŠ..."
              className={`min-w-0 flex-1 bg-transparent text-foreground outline-none font-medium placeholder:font-normal placeholder:text-muted-foreground ${isCompact ? 'text-xs sm:text-sm py-1' : 'text-sm sm:text-base py-1.5'
                }`}
            />

            {/* Clear button */}
            {Boolean(currentSearchValue) && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                title="Ù…Ø³Ø­ Ø§Ù„Ø¨Ø­Ø«"
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
                  title="ØªØµÙ�ÙŠØ© Ø­Ø³Ø¨ Ø§Ù„Ù‚Ø³Ù… Ø§Ù„Ø´Ø±Ø¹ÙŠ"
                >
                  <Layers className={`${isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-emerald-500 shrink-0`} />
                  <span className="truncate max-w-[70px] sm:max-w-[110px] md:max-w-[130px]">
                    {selectedDomain === 'all' ? 'Ø§Ù„Ù‚Ø³Ù…: Ø§Ù„ÙƒÙ„' : selectedDomain}
                  </span>
                  {selectedDomain !== 'all' ? (
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDomain('all');
                      }}
                      className="w-3.5 h-3.5 rounded-full bg-emerald-600/20 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 flex items-center justify-center transition-all ml-0.5 cursor-pointer shrink-0"
                      title="Ø¥Ù„ØºØ§Ø¡ ØªØµÙ�ÙŠØ© Ø§Ù„Ù‚Ø³Ù…"
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
                    <span>Ø§Ø®ØªØ± Ø§Ù„Ù‚Ø³Ù… Ø§Ù„Ø´Ø±Ø¹ÙŠ</span>
                    <span className="text-[10px] font-mono opacity-80">{availableDomains.length} Ù‚Ø³Ù…</span>
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
                        Ø§Ù„ÙƒÙ„ (Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø£Ù‚Ø³Ø§Ù…)
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
                  title="ØªØµÙ�ÙŠØ© Ø­Ø³Ø¨ Ø§Ù„Ù…Ø¤Ù„Ù�"
                >
                  <User className={`${isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-brand-blue shrink-0`} />
                  <span className="truncate max-w-[70px] sm:max-w-[110px] md:max-w-[130px]">
                    {filterAuthor === 'all' ? 'Ø§Ù„Ù…Ø¤Ù„Ù�: Ø§Ù„ÙƒÙ„' : filterAuthor}
                  </span>
                  {filterAuthor !== 'all' ? (
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilterAuthor('all');
                      }}
                      className="w-3.5 h-3.5 rounded-full bg-blue-600/20 hover:bg-blue-600 hover:text-white text-blue-700 dark:text-blue-300 flex items-center justify-center transition-all ml-0.5 cursor-pointer shrink-0"
                      title="Ø¥Ù„ØºØ§Ø¡ ØªØµÙ�ÙŠØ© Ø§Ù„Ù…Ø¤Ù„Ù�"
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
                    <span>Ø§Ø®ØªØ± Ø§Ù„Ù…Ø¤Ù„Ù� Ø£Ùˆ Ø§Ù„Ø¥Ù…Ø§Ù…</span>
                    <span className="text-[10px] font-mono opacity-80">{availableAuthors.length} Ø¹Ø§Ù„Ù…</span>
                  </div>

                  <div className="px-1 mb-2">
                    <input
                      type="text"
                      placeholder="Ø§Ø¨Ø­Ø« Ø¨Ø§Ø³Ù… Ø§Ù„Ø¹Ø§Ù„Ù…..."
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
                        Ø§Ù„ÙƒÙ„ (Ø¬Ù…ÙŠØ¹ Ø§Ù„Ù…Ø¤Ù„Ù�ÙŠÙ†)
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
                  title="Ø¥Ø¹Ø§Ø¯Ø© ØªØ¹ÙŠÙŠÙ† Ø§Ù„Ù�Ù„Ø§ØªØ±"
                >
                  <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Live Search Floating Popover for Library Home View (Ù�Ø±ÙŠÙ… Ø·Ø§Ù�Ù� Ù…Ù†Ø¨Ø«Ù‚ Ø¨Ù†ØªØ§Ø¦Ø¬ Ø§Ù„Ø¨Ø­Ø« Ø§Ù„Ù…Ø¨Ø§Ø´Ø± Ù�ÙŠ Ø§Ù„ØµÙ�Ø­Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©) */}
        {activeMainTab === 'home' && (Boolean(currentSearchValue.trim()) || selectedDomain !== 'all' || filterAuthor !== 'all') && !isHomeSearchResultsDismissed && (
          <div className="absolute top-full left-0 right-0 mt-3 max-h-[520px] overflow-y-auto rounded-3xl border-2 border-purple-500/30 dark:border-purple-500/40 bg-white/95 dark:bg-[#120526]/95 backdrop-blur-2xl shadow-[0_25px_80px_rgba(46,8,84,0.3)] dark:shadow-[0_25px_80px_rgba(0,0,0,0.95)] z-[90] p-4 sm:p-5 space-y-3 animate-in fade-in zoom-in-95 duration-200 text-right">

            {/* Header of Floating Search Results */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10 text-xs font-bold text-muted-foreground">
              <span className="flex items-center gap-1.5 text-slate-900 dark:text-white font-extrabold text-sm sm:text-base">
                <Sparkles className="w-4 h-4 text-brand-magenta" />
                Ù†ØªØ§Ø¦Ø¬ Ø§Ù„Ø¨Ø­Ø« Ø§Ù„Ù…Ø¨Ø§Ø´Ø± ({homeSearchResults.length} {homeSearchResults.length === 1 ? 'ÙƒØªØ§Ø¨' : 'ÙƒØªØ¨'})
              </span>
              <button
                type="button"
                onClick={() => setIsHomeSearchResultsDismissed(true)}
                className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-xs font-bold text-muted-foreground hover:text-foreground transition-all flex items-center gap-1 cursor-pointer"
                title="Ø¥ØºÙ„Ø§Ù‚ Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ù†ØªØ§Ø¦Ø¬"
              >
                <span>Ø¥ØºÙ„Ø§Ù‚</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List of Results (ÙƒÙ„ ÙƒØªØ§Ø¨ Ù�ÙŠ Ø³Ø·Ø± Ù…Ø·Ø§Ø¨Ù‚ Ù„Ù„Ø¨Ø·Ø§Ù‚Ø© ÙˆØ§Ù„ØªØµÙ…ÙŠÙ… Ø§Ù„Ù…Ø·Ù„ÙˆØ¨) */}
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
                          {book.author && book.author !== 'Ù…Ù† ØºÙŠØ± Ù…Ø¹Ø±ÙˆÙ�' ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAuthorBook(book);
                              }}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-brand-magenta transition-colors group/author cursor-pointer"
                              title="Ø¹Ø±Ø¶ Ø³ÙŠØ±Ø© Ø§Ù„Ù…Ø¤Ù„Ù�"
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

                          {/* Glassmorphic Category Badge (ÙˆØ³Ù… Ø¨Ù�Ø±ÙŠÙ… Ø§Ø­ØªØ±Ø§Ù�ÙŠ Ø²Ø¬Ø§Ø¬ÙŠ Ø¨Ø§Ø³Ù… Ø§Ù„Ù‚Ø³Ù…) */}
                          {book.category && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 backdrop-blur-sm">
                              <Layers className="w-3 h-3 text-brand-magenta" />
                              {book.category}
                            </span>
                          )}

                          {/* Century Badge (ÙˆØ³Ù… Ø§Ù„Ù‚Ø±Ù† ÙˆØªØ§Ø±ÙŠØ® Ø§Ù„ÙˆÙ�Ø§Ø©) */}
                          {centuryName && centuryName !== 'ØºÙŠØ± Ù…Ø­Ø¯Ø¯' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                              <Calendar className="w-3 h-3 text-amber-500" />
                              {centuryName}
                              {deathYear && <span className="font-mono">({deathYear}Ù‡Ù€)</span>}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: ØªØµÙ�Ø­ + Ø§Ø³Ø£Ù„ Ø²Ø§Ø¯ + Ù…Ø¹Ù„ÙˆÙ…Ø§Øª + Ù…Ù�Ø¶Ù„Ø© */}
                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-white/5 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          handleReadBook(book);
                          setIsHomeSearchResultsDismissed(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-brand-magenta text-white text-xs font-bold hover:bg-brand-deep transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                        title="ØªØµÙ�Ø­ ÙˆÙ‚Ø±Ø§Ø¡Ø© Ø§Ù„ÙƒØªØ§Ø¨"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>ØªØµÙ�Ø­</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onAskBook(book);
                          setIsHomeSearchResultsDismissed(true);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-brand-magenta/30 bg-brand-magenta/5 text-brand-magenta hover:bg-brand-magenta/15 text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                        title="Ø§Ø³Ø£Ù„ Ø²Ø§Ø¯ Ø­ÙˆÙ„ Ø§Ù„ÙƒØªØ§Ø¨"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Ø§Ø³Ø£Ù„ Ø²Ø§Ø¯</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveInfoBook(book)}
                        className="p-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-muted-foreground hover:text-brand-magenta hover:bg-brand-magenta/10 transition-all flex items-center justify-center cursor-pointer"
                        title="Ù…Ø¹Ù„ÙˆÙ…Ø§Ø  // Navigation tabs identical to main website: "Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©, Ø§Ù„Ù…ÙƒØªØ¨Ø©, Ø§Ù„Ø´Ø±ÙˆØ­Ø§Øª ÙˆØ§Ù„Ø¯Ø±ÙˆØ³, ÙˆØ¶Ø¹ Ø§Ù„Ø¯Ø±Ø§Ø³Ø©, Ø§Ù„Ù…Ø­Ø§Ø¯Ø«Ø© Ø§Ù„Ù†ØµÙŠØ©, Ø§Ù„Ù…Ø­Ø§Ø¯Ø«Ø© Ø§Ù„ØµÙˆØªÙŠØ©"
  const renderGlobalNavTabs = (compact: boolean = false) => {
    const isMediaActive = activeMainTab === 'media' || activeMainTab === 'courses';
    const isLibraryActive = !isMediaActive;

    const navItems = [
      { id: 'home', label: 'Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©', isActive: false, action: () => (onNavigateGlobal ? onNavigateGlobal('home') : onExit()) },
      {
        id: 'knowledge',
        label: 'Ø§Ù„Ù…ÙƒØªØ¨Ø©',
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
        label: 'Ø§Ù„Ø´Ø±ÙˆØ­Ø§Øª ÙˆØ§Ù„Ø¯Ø±ÙˆØ³',
        isActive: isMediaActive,
        action: () => {
          setActiveMainTab('media');
          setSelectedAuthor(null);
        }
      },
      { id: 'study', label: 'ÙˆØ¶Ø¹ Ø§Ù„Ø¯Ø±Ø§Ø³Ø©', isActive: false, action: () => (onNavigateGlobal ? onNavigateGlobal('study') : null) },
      { id: 'chat', label: 'Ø§Ù„Ù…Ø­Ø§Ø¯Ø«Ø© Ø§Ù„Ù†ØµÙŠØ©', isActive: false, action: () => (onNavigateGlobal ? onNavigateGlobal('chat') : null) },
      { id: 'voice', label: 'Ø§Ù„Ù…Ø­Ø§Ø¯Ø«Ø© Ø§Ù„ØµÙˆØªÙŠØ©', isActive: false, action: () => (onNavigateGlobal ? onNavigateGlobal('voice') : null) },
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
                className={`relative flex items-center justify-center transition-all duration-300 rounded-full cursor-pointer ${
                  compact
                    ? 'text-[11px] sm:text-xs px-2.5 py-1'
                    : 'text-xs sm:text-sm lg:text-[14px] px-3 sm:px-3.5 py-1.5'
                } font-bold ${
                  active
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
        {/* FLOATING DRAWER SIDEBAR (Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø¬Ø§Ù†Ø¨ÙŠØ© ÙƒØ·Ø¨Ù‚Ø© Ø·Ø§Ù�ÙŠØ©)         */}
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
        {/* MAIN WORKSPACE AREA (Ù…Ø³Ø§Ø­Ø© Ø§Ù„ØªØµÙ�Ø­ ÙˆØ§Ù„Ø¹Ø±Ø¶ Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©)            */}
        {/* ============================================================= */}
        <main className="flex-1 min-w-0 flex flex-col min-h-screen">

          {/* ============================================================= */}
          {/* SECTION 1: TOP HERO (Ø§Ù„Ù‚Ø³Ù… Ø§Ù„Ø£ÙˆÙ„: Ø§Ù„Ù†Ø§Ù�Ø¨Ø§Ø± + Ø§Ù„Ù‡ÙŠØ¯Ø± + ØµÙˆØ±Ø© Ø§Ù„ØºØ±ÙˆØ¨ - Ø´Ø§Ø´Ø© ÙƒØ§Ù…Ù„Ø© 100vh) */}
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
                  alt="Ø®Ù„Ù�ÙŠØ© Ø§Ù„Ù…ÙƒØªØ¨Ø©"
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

                {/* 1. RIGHT: Sidebar Icon + Zad Logo ONLY (Ø¨Ø¯ÙˆÙ† ØªÙƒØ±Ø§Ø± Ø§Ù„Ù†Øµ Ø§Ù„Ø·ÙˆÙŠÙ„) */}
                <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(true)}
                    className="w-10 h-10 rounded-2xl bg-white/40 dark:bg-[#1a0730]/60 backdrop-blur-xl text-foreground border border-white/40 dark:border-purple-500/30 hover:border-brand-magenta hover:bg-brand-magenta hover:text-white transition-all shadow-sm flex items-center justify-center group active:scale-95 cursor-pointer"
                    title="Ù�ØªØ­ Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© ÙˆØ§Ù„Ù�Ù‡Ø±Ø³"
                  >
                    <Menu className="w-5 h-5 text-brand-magenta group-hover:text-white transition-all" />
                  </button>

                  <div
                    onClick={() => { setActiveMainTab('home'); setSelectedAuthor(null); }}
                    className="flex items-center cursor-pointer group"
                    title="Ù…ÙƒØªØ¨Ø© Ø²Ø§Ø¯"
                  >
                    <img
                      src={theme === 'dark' ? whiteLogo : darkLogo}
                      alt="Ø´Ø¹Ø§Ø± Ø²Ø§Ø¯"
                      className="h-9 sm:h-10 w-auto object-contain drop-shadow-md group-hover:scale-105 transition-transform"
                    />
                  </div>
                </div>

                {/* 2. CENTER:
                    - In Home tab when scrolled past search: Compact Search Console (Ø´Ø±ÙŠØ· Ø§Ù„Ø¨Ø­Ø« Ø§Ù„Ù…Ø¯Ù…Ø¬ Ù�ÙŠ Ø§Ù„Ù†Ø§Ù�Ø¨Ø§Ø±)
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
                      title={isDark ? "Ø§Ù„Ø§Ù†ØªÙ‚Ø§Ù„ Ù„Ù„ÙˆØ¶Ø¹ Ø§Ù„Ù†Ù‡Ø§Ø±ÙŠ (Ø§Ù„Ù�Ø§ØªØ­)" : "Ø§Ù„Ø§Ù†ØªÙ‚Ø§Ù„ Ù„Ù„ÙˆØ¶Ø¹ Ø§Ù„Ù„ÙŠÙ„ÙŠ (Ø§Ù„Ø¯Ø§ÙƒÙ†)"}
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
                      title="Ø§Ù„Ø±Ø¬ÙˆØ¹ Ù„Ù„Ø±Ø¦ÙŠØ³ÙŠØ© Ø§Ù„Ø¹Ø§Ù…Ø©"
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="hidden sm:inline">Ø§Ù„Ø±Ø¬ÙˆØ¹</span>
                    </button>
                  </div>
                </div>

              </div>
            </header>dPastSearch && (
                    <div className="hidden xl:flex items-center mr-1">
                      <div className="px-2.5 py-1 rounded-full bg-slate-100/90 dark:bg-white/5 border border-slate-200/80 dark:border-purple-500/20 backdrop-blur-md shadow-xs">
                        {renderGlobalNavTabs(true)}
                      </div>
                    </div>
                  )}

                  {/* Theme Switcher Button */}
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/90 dark:bg-[#1a0730]/90 text-foreground border border-slate-200/80 dark:border-purple-500/30 hover:border-brand-magenta hover:bg-brand-magenta hover:text-white transition-all shadow-sm flex items-center justify-center active:scale-95 cursor-pointer"
                    title={isDark ? "Ø§Ù„Ø§Ù†ØªÙ‚Ø§Ù„ Ù„Ù„ÙˆØ¶Ø¹ Ø§Ù„Ù†Ù‡Ø§Ø±ÙŠ (Ø§Ù„Ù�Ø§ØªØ­)" : "Ø§Ù„Ø§Ù†ØªÙ‚Ø§Ù„ Ù„Ù„ÙˆØ¶Ø¹ Ø§Ù„Ù„ÙŠÙ„ÙŠ (Ø§Ù„Ø¯Ø§ÙƒÙ†)"}
                  >
                    {isDark ? (
                      <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-90 duration-300" />
                    ) : (
                      <Moon className="w-4 h-4 text-purple-600 transition-transform hover:-rotate-12 duration-300" />
                    )}
                  </button>

                  {/* Back Button */}
                  <button
                    type="button"
                    onClick={onExit}
                    className="h-9 sm:h-10 px-3 sm:px-3.5 rounded-xl sm:rounded-2xl bg-white/90 dark:bg-[#1a0730]/90 text-foreground border border-slate-200/80 dark:border-purple-500/30 hover:border-brand-magenta hover:bg-brand-magenta hover:text-white transition-all shadow-sm flex items-center gap-1.5 text-xs font-bold active:scale-95 cursor-pointer"
                    title="Ø§Ù„Ø±Ø¬ÙˆØ¹ Ù„Ù„Ø±Ø¦ÙŠØ³ÙŠØ© Ø§Ù„Ø¹Ø§Ù…Ø©"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="hidden sm:inline">Ø§Ù„Ø±Ø¬ÙˆØ¹</span>
                  </button>
                </div>

              </div>
            </header>

            {/* HOME HERO SECTION (ÙŠØªÙˆØ³Ø· Ø§Ù„Ø´Ø§Ø´Ø© Ø±Ø£Ø³ÙŠØ§Ù‹) */}
            {activeMainTab === 'home' && (
              <div className="relative z-20 flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-center animate-in fade-in duration-300">
                <div className="max-w-4xl w-full mx-auto space-y-3 sm:space-y-4">

                  {/* Zad Logo & Header Title */}
                  <div className="space-y-2 sm:space-y-2.5">
                    <div className="relative flex items-center justify-center py-1">
                      <div className="absolute w-44 h-44 bg-gradient-to-tr from-brand-magenta/20 via-brand-deep/20 to-purple-500/20 blur-3xl rounded-full pointer-events-none -z-10" />
                      <img
                        src={theme === 'dark' ? whiteLogo : darkLogo}
                        alt="Ø´Ø¹Ø§Ø± Ø²Ø§Ø¯"
                        className="h-20 sm:h-24 md:h-28 w-auto max-h-32 object-contain drop-shadow-2xl hover:scale-105 transition-all duration-300"
                      />
                    </div>
                    {/* Solid Deep Royal Purple Title (ØºÙŠØ± Ù…ØªØ¯Ø±Ø¬ ÙƒØ·Ù„Ø¨ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…) */}
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight font-tajawal text-[#2e0854] dark:text-[#f7eeff] drop-shadow-xs">
                      Ù…ÙƒØªØ¨Ø© Ù…ØªÙƒØ§Ù…Ù„Ø© Ù„Ø¯Ø±Ø§Ø³Ø© Ø§Ù„Ø¹Ù„ÙˆÙ… Ø§Ù„Ø´Ø±Ø¹ÙŠØ©
                    </h1>
                    <p className="text-xs sm:text-sm font-bold text-slate-800/95 dark:text-slate-100 max-w-xl mx-auto leading-relaxed drop-shadow-xs">
                      Ø§Ø¨Ø­Ø« Ù�ÙŠ Ù…Ø¬Ù…ÙˆØ¹Ø© Ù…Ø®ØªØ§Ø±Ø© Ù…Ù† ÙƒØªØ¨ Ø§Ù„Ù…ÙƒØªØ¨Ø© Ø§Ù„Ø´Ø§Ù…Ù„Ø©ØŒ ÙˆØ§Ø³ØªÙƒØ´Ù� Ø§Ù„Ø´Ø±ÙˆØ­ Ø§Ù„Ù…Ø±Ø¦ÙŠØ© ÙˆØ§Ù„ØµÙˆØªÙŠØ© ÙˆØ§Ù„Ø¯ÙˆØ±Ø§Øª Ø§Ù„Ø¹Ù„Ù…ÙŠØ©.
                    </p>
                  </div>

                  {/* Taller Search Bar (Ø¨Ø§Ø±ØªÙ�Ø§Ø¹ Ø£ÙƒØ¨Ø± ÙˆØªØµÙ…ÙŠÙ… Ù…Ø·Ø§Ø¨Ù‚ Ù„Ù„ØµÙˆØ±Ø© 2) */}
                  <div id="hero-main-search-bar" className="max-w-4xl mx-auto w-full">
                    {renderSearchConsole(false)}
                  </div>

                  {/* CONTINUE READING BANNER (ØªØµÙ…ÙŠÙ… Ø²Ø¬Ø§Ø¬ÙŠ Ø´Ù�Ø§Ù� Ù�Ø§Ø®Ø± ÙˆÙ…Ø­ÙƒÙ… Glassmorphic) */}
                  {recentBook && (
                    <div className="max-w-2xl mx-auto w-full rounded-2xl p-3 sm:p-4 bg-white/30 dark:bg-purple-950/40 backdrop-blur-xl border border-white/50 dark:border-white/20 ring-1 ring-white/30 shadow-xl shadow-purple-950/20 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto text-right">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-brand-magenta to-purple-700 text-white flex items-center justify-center shrink-0 shadow-lg shadow-brand-magenta/35 border border-white/30">
                          <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] sm:text-xs font-black text-purple-950 dark:text-purple-200 drop-shadow-xs">Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„Ù‚Ø±Ø§Ø¡Ø© Ø§Ù„Ø£Ø®ÙŠØ±Ø©</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/50 dark:bg-white/15 text-purple-950 dark:text-purple-100 font-bold border border-white/50 backdrop-blur-sm">Ø¬Ø§Ù‡Ø² Ù„Ù„Ø¥ÙƒÙ…Ø§Ù„</span>
                          </div>
                          <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate mt-0.5 drop-shadow-xs">
                            {recentBook.title}
                          </h3>
                          <p className="text-[11px] text-slate-700 dark:text-slate-300 truncate font-semibold">
                            Ø§Ù„Ù…Ø¤Ù„Ù�: {recentBook.author}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleReadBook(recentBook)}
                        className="w-full sm:w-auto py-2 px-5 rounded-xl bg-gradient-to-r from-brand-magenta via-purple-600 to-brand-deep hover:from-brand-deep hover:to-purple-800 text-white text-xs sm:text-sm font-black transition-all shadow-lg shadow-brand-magenta/30 hover:shadow-brand-magenta/50 hover:scale-105 active:scale-95 border border-white/30 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Ø¥ÙƒÙ…Ø§Ù„ Ø§Ù„Ù‚Ø±Ø§Ø¡Ø© Ø§Ù„Ø¢Ù† ðŸ“–</span>
                      </button>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* Ù…Ø¤Ø´Ø± Ø§Ù„ØªÙ…Ø±ÙŠØ± Ù„Ù„Ø£Ø³Ù�Ù„ Ù„Ù„Ø§Ù†ØªÙ‚Ø§Ù„ Ù„Ù„Ù‚Ø³Ù… Ø§Ù„Ø«Ø§Ù†ÙŠ */}
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
                  <span className="opacity-80 group-hover:opacity-100 transition-opacity">ØªØµÙ�Ø­ Ø§Ù„Ø¹Ù„ÙˆÙ… Ø§Ù„Ø´Ø±Ø¹ÙŠØ©</span>
                  <ChevronDown className="w-4 h-4 text-brand-magenta animate-bounce" />
                </button>
              </div>
            )}
          </div>

          {/* ============================================================= */}
          {/* SECTION 2: WORKSPACE & ISLAMIC PATTERN (Ø§Ù„Ù‚Ø³Ù… Ø§Ù„Ø«Ø§Ù†ÙŠ: Ø§Ù„Ø²Ø®Ø±Ù�Ø©)  */}
          {/* ============================================================= */}
          <div className={`relative z-10 flex-1 w-full overflow-hidden transition-colors duration-300 ${activeMainTab === 'home'
            ? 'bg-[#faf8fd] dark:bg-[#0a0216] border-t border-purple-200/50 dark:border-purple-500/20'
            : ''
            }`}>
            {/* Ø§Ù„Ø²Ø®Ø±Ù�Ø© Ø§Ù„Ø¥Ø³Ù„Ø§Ù…ÙŠØ© Ø§Ù„Ù‡Ù†Ø¯Ø³ÙŠØ© ØªØºØ·ÙŠ ÙƒØ§Ù…Ù„ Ø®Ù„Ù�ÙŠØ© Ø§Ù„Ù‚Ø³Ù… Ø§Ù„Ø«Ø§Ù†ÙŠ Ø¨Ø¯ÙˆÙ† ØµÙˆØ±Ø© Ø§Ù„ØºØ±ÙˆØ¨ */}
            {activeMainTab === 'home' && (
              <IslamicPattern
                opacity={theme === 'dark' ? 0.12 : 0.08}
                className="text-purple-600 dark:text-purple-400 pointer-events-none"
              />
            )}

            <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">

              {/* TAB: Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ© (Home) */}
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

              {/* TAB: Ø§Ù„Ø´Ø±ÙˆØ­ Ø§Ù„Ù…Ø±Ø¦ÙŠØ© ÙˆØ§Ù„ØµÙˆØªÙŠØ© (Media) */}
              {activeMainTab === 'media' && (
                <MediaExplanationsView
                  sheikhs={sheikhs}
                  playlists={playlists}
                  standaloneItems={standaloneItems}
                  onOpenLinkedBook={handleOpenLinkedBook}
                />
              )}

              {/* TAB: Ø§Ù„ÙƒØªØ¨ Ø§Ù„Ù…Ù�Ø¶Ù„Ø© (Favorites) */}
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

              {/* TAB: Ø¯ÙˆØ±Ø§Øª Ø­Ø§Ù„ÙŠØ© (Courses) */}
              {activeMainTab === 'courses' && (
                <CurrentCoursesView
                  courses={courses}
                  onOpenLinkedBook={handleOpenLinkedBook}
                />
              )}

              {/* ============================================================= */}
              {/* TAB 1: Ø§Ù„Ø£Ù‚Ù€Ù€Ø³Ù€Ø§Ù… (By Categories / Domains)                   */}
              {/* ============================================================= */}
              {activeMainTab === 'categories' && (() => {
                const isSearching = Boolean(categorySearch.trim() || selectedDomain !== 'all' || filterAuthor !== 'all');
                return (
                  <div className="animate-in fade-in duration-300 space-y-6">

                    {/* 1. Category Statistics Grid (Ø¨Ø·Ø§Ù‚Ø§Øª Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª Ø§Ù„Ø£Ù‚Ø³Ø§Ù…) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Stat 1: Total Categories */}
                      <div className="rounded-2xl border border-slate-200/80 dark:border-purple-500/25 bg-white/90 dark:bg-[#14062b]/90 p-4 shadow-sm backdrop-blur-md flex items-center gap-3.5 hover:border-emerald-500/40 transition-all">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
                          <Layers className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Ø§Ù„Ø£Ù‚Ø³Ø§Ù… ÙˆØ§Ù„ØªØ®ØµØµØ§Øª</span>
                          <span className="text-xl font-black text-slate-900 dark:text-white block tracking-tight">
                            {availableDomains.length} <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Ù‚Ø³Ù…Ø§Ù‹ Ø´Ø±Ø¹ÙŠØ§Ù‹</span>
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate block">ØªØºØ·ÙŠ Ù�Ø±ÙˆØ¹ Ø§Ù„Ø¹Ù„ÙˆÙ… Ø§Ù„Ø¥Ø³Ù„Ø§Ù…ÙŠØ©</span>
                        </div>
                      </div>

                      {/* Stat 2: Total Books */}
                      <div className="rounded-2xl border border-slate-200/80 dark:border-purple-500/25 bg-white/90 dark:bg-[#14062b]/90 p-4 shadow-sm backdrop-blur-md flex items-center gap-3.5 hover:border-brand-magenta/40 transition-all">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-magenta/15 to-purple-500/20 text-brand-magenta dark:text-purple-300 flex items-center justify-center shrink-0 shadow-sm">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„ÙƒØªØ¨ Ø§Ù„Ù…Ù�Ù‡Ø±Ø³Ø©</span>
                          <span className="text-xl font-black text-slate-900 dark:text-white block tracking-tight">
                            {publishedBooks.length} <span className="text-xs font-bold text-brand-magenta">ÙƒØªØ§Ø¨Ø§Ù‹ Ù…Ø¹ØªÙ…Ø¯Ø§Ù‹</span>
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate block">Ø¨Ù†ØµÙˆØµ ÙƒØ§Ù…Ù„Ø© Ù‚Ø§Ø¨Ù„Ø© Ù„Ù„Ø¯Ø±Ø§Ø³Ø©</span>
                        </div>
                      </div>

                      {/* Stat 3: Top Domain */}
                      <div className="rounded-2xl border border-slate-200/80 dark:border-purple-500/25 bg-white/90 dark:bg-[#14062b]/90 p-4 shadow-sm backdrop-blur-md flex items-center gap-3.5 hover:border-amber-500/40 transition-all">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/15 to-orange-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
                          <Award className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Ø£ØºØ²Ø± Ø§Ù„Ø£Ù‚Ø³Ø§Ù… Ù…Ø¤Ù„Ù�Ø§Øª</span>
                          <span className="text-base font-black text-slate-900 dark:text-white block truncate">
                            {availableDomains[0]?.name || 'Ø§Ù„Ù�Ù‚Ù‡ ÙˆØ£ØµÙˆÙ„Ù‡'}
                          </span>
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">
                            ({availableDomains[0]?.count || 0} Ù…ØµÙ†Ù�Ø§Ù‹ Ù…Ù�Ù‡Ø±Ø³Ø§Ù‹)
                          </span>
                        </div>
                      </div>

                      {/* Stat 4: Search & Scholars */}
                      <div className="rounded-2xl border border-slate-200/80 dark:border-purple-500/25 bg-white/90 dark:bg-[#14062b]/90 p-4 shadow-sm backdrop-blur-md flex items-center gap-3.5 hover:border-blue-500/40 transition-all">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/15 to-indigo-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-sm">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Ø§Ù„Ø£Ø¦Ù…Ø© ÙˆØ§Ù„Ù…ØµÙ†Ù�ÙˆÙ†</span>
                          <span className="text-xl font-black text-slate-900 dark:text-white block tracking-tight">
                            {liveStats.total_authors} <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Ø¹Ø§Ù„Ù…Ø§Ù‹</span>
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate block">Ø¹Ø¨Ø± 15 Ù‚Ø±Ù†Ø§Ù‹ Ù‡Ø¬Ø±ÙŠØ§Ù‹</span>
                        </div>
                      </div>
                    </div>

                    {/* 2. In-Page Search Console (Ù…Ø±Ø¨Ø¹ Ø§Ù„Ø¨Ø­Ø« Ù…Ø·Ø§Ø¨Ù‚ Ù„Ù„Ø±Ø¦ÙŠØ³ÙŠØ© ØªÙ…Ø§Ù…Ø§Ù‹ Ø¨Ø¯ÙˆÙ† Ø£ÙŠ Ù�Ø±ÙŠÙ… Ø¥Ø¶Ø§Ù�ÙŠ) */}
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
                              Ù†ØªØ§Ø¦Ø¬ Ø§Ù„Ø¨Ø­Ø« Ù�ÙŠ Ø§Ù„Ø£Ù‚Ø³Ø§Ù…: <span className="text-brand-magenta">{booksByCategory.length}</span> Ù‚Ø³Ù…
                              <span className="text-xs text-muted-foreground font-normal mr-2">
                                ({booksByCategory.reduce((sum, c) => sum + c.books.length, 0)} ÙƒØªØ§Ø¨Ø§Ù‹ Ù…Ø·Ø§Ø¨Ù‚Ø§Ù‹)
                              </span>
                            </>
                          ) : (
                            <>Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø£Ù‚Ø³Ø§Ù… ÙˆØ§Ù„ØªØ®ØµØµØ§Øª ({booksByCategory.length})</>
                          )}
                        </h3>
                      </div>

                      {/* View Toggle (Ù�ÙˆÙ‚ Ø¨Ø¹Ø¶ vs Ø¬Ù†Ø¨ Ø¨Ø¹Ø¶) */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground font-semibold hidden sm:inline">Ø·Ø±ÙŠÙ‚Ø© Ø§Ù„Ø¹Ø±Ø¶:</span>
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-black/40 p-1 rounded-xl border border-slate-200/60 dark:border-white/10">
                          <button
                            onClick={() => setCategoriesViewMode('list')}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${categoriesViewMode === 'list'
                              ? 'bg-white dark:bg-brand-magenta text-brand-magenta dark:text-white shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                              }`}
                            title="Ø¹Ø±Ø¶ Ù�ÙˆÙ‚ Ø¨Ø¹Ø¶ (Ù‚ÙˆØ§Ø¦Ù… Ù…Ù†Ø³Ø¯Ù„Ø©)"
                          >
                            <List className="w-3.5 h-3.5" />
                            <span>Ù�ÙˆÙ‚ Ø¨Ø¹Ø¶</span>
                          </button>

                          <button
                            onClick={() => setCategoriesViewMode('grid')}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${categoriesViewMode === 'grid'
                              ? 'bg-white dark:bg-brand-magenta text-brand-magenta dark:text-white shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                              }`}
                            title="Ø¹Ø±Ø¶ Ø¬Ù†Ø¨ Ø¨Ø¹Ø¶ (Ø¨Ø·Ø§Ù‚Ø§Øª Ø´Ø¨ÙƒÙŠØ©)"
                          >
                            <LayoutGrid className="w-3.5 h-3.5" />
                            <span>Ø¬Ù†Ø¨ Ø¨Ø¹Ø¶</span>
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* Categories Content: LIST MODE (Ù�ÙˆÙ‚ Ø¨Ø¹Ø¶) */}
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
                                        <>Ù…Ø¹Ø±ÙˆØ¶ <span className="font-bold text-brand-magenta">{cat.books.length}</span> ÙƒØªØ§Ø¨Ø§Ù‹ Ù…Ø·Ø§Ø¨Ù‚Ø§Ù‹ Ù„Ù„Ø¨Ø­Ø«</>
                                      ) : (
                                        <>ÙŠØ­ØªÙˆÙŠ Ø¹Ù„Ù‰ <span className="font-bold text-brand-magenta">{cat.books.length}</span> ÙƒØªØ§Ø¨Ø§Ù‹ Ù…Ø¹ØªÙ…Ø¯Ø§Ù‹</>
                                      )}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                  <span className={`hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${isOpen
                                    ? 'bg-brand-magenta text-white'
                                    : 'bg-slate-100 dark:bg-black/30 text-slate-700 dark:text-slate-300'
                                    }`}>
                                    {cat.books.length} ÙƒØªØ¨
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
                              Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ø£Ù‚Ø³Ø§Ù… Ø£Ùˆ ÙƒØªØ¨ ØªØ·Ø§Ø¨Ù‚ Ø¨Ø­Ø«Ùƒ "{categorySearch}"
                            </p>
                            <p className="text-xs text-muted-foreground mb-4">
                              Ø¬Ø±Ø¨ Ø§Ù„Ø¨Ø­Ø« Ø¨Ø¹Ù†ÙˆØ§Ù† ÙƒØªØ§Ø¨ (Ù…Ø«Ù„: Ø¹Ù…Ø¯Ø© Ø§Ù„Ù�Ù‚Ù‡) Ø£Ùˆ Ø§Ø³Ù… Ù…Ø¤Ù„Ù� (Ù…Ø«Ù„: Ø§Ø¨Ù† Ù‚Ø¯Ø§Ù…Ø©).
                            </p>
                            <button
                              type="button"
                              onClick={() => handleSearchChange('')}
                              className="px-4 py-2 rounded-xl bg-brand-magenta text-white text-xs font-bold hover:bg-brand-deep transition-all shadow-sm"
                            >
                              Ø¥Ù„ØºØ§Ø¡ Ø§Ù„Ø¨Ø­Ø« ÙˆØ¥Ø¸Ù‡Ø§Ø± Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø£Ù‚Ø³Ø§Ù…
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Categories Content: GRID MODE (Ø¬Ù†Ø¨ Ø¨Ø¹Ø¶) */
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
                                      {cat.books.length} ÙƒØªØ¨
                                    </span>
                                  </div>

                                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1.5">
                                    {cat.name}
                                  </h3>
                                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                    {isSearching ? `ÙŠØ­ØªÙˆÙŠ Ø¹Ù„Ù‰ ${cat.books.length} ÙƒØªØ§Ø¨ Ù…Ø·Ø§Ø¨Ù‚ Ù„Ù„Ø¨Ø­Ø«` : 'ØªØµÙ�Ø­ ÙƒØªØ¨ ÙˆÙ…ØµÙ†Ù�Ø§Øª Ù‡Ø°Ø§ Ø§Ù„Ù‚Ø³Ù… Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø© ÙˆØ§Ù„Ù…Ø­Ù‚Ù‚Ø© Ù�ÙŠ Ù…Ù†ØµØ© Ø²Ø§Ø¯.'}
                                  </p>
                                </div>

                                <div className="pt-4 mt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs font-bold text-brand-magenta">
                                  <span>{isSelected ? 'Ø¥Ø®Ù�Ø§Ø¡ Ø§Ù„ÙƒØªØ¨ â–²' : 'Ø§Ø³ØªØ¹Ø±Ø§Ø¶ Ø§Ù„ÙƒØªØ¨ â–¼'}</span>
                                  <span className="text-[11px] text-muted-foreground font-normal">
                                    {isSelected ? 'Ù…Ø­Ø¯Ø¯ Ø­Ø§Ù„ÙŠØ§Ù‹' : 'Ø§Ù†Ù‚Ø± Ù„Ù„Ù�ØªØ­'}
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
                                    ÙƒØªØ¨ Ù‚Ø³Ù…: <span className="text-brand-magenta">{activeGridCat.name}</span>
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
                                  <span>Ø¥ØºÙ„Ø§Ù‚ Ø§Ù„Ù‚Ø³Ù…</span>
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
              {/* TAB 2: Ø§Ù„Ù…Ù€Ø®Ù€ØªÙ€Ø§Ø±Ø© (Featured & Chronological)                 */}
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
                          Ø§Ù„ÙƒØªØ¨ Ø§Ù„Ù…Ø®ØªØ§Ø±Ø© ÙˆØ§Ù„Ù…Ø¹ØªÙ…Ø¯Ø© ({filteredAndSortedBooks.length})
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
                          <option value="all">Ø¬Ù…ÙŠØ¹ Ø§Ù„Ù‚Ø±ÙˆÙ† Ø§Ù„Ù‡Ø¬Ø±ÙŠØ©</option>
                          {availableCenturies.map(c => (
                            <option key={c.century} value={c.century.toString()}>
                              {c.name} ({c.count} ÙƒØªØ§Ø¨)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Sort Toggle */}
                      <button
                        onClick={() => setSortAsc(!sortAsc)}
                        className="w-full md:w-auto px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-100 dark:bg-black/30 hover:bg-slate-200 dark:hover:bg-white/10 text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shrink-0 text-slate-700 dark:text-slate-200"
                        title={sortAsc ? "Ø§Ù„ØªØ±ØªÙŠØ¨ Ø§Ù„Ø­Ø§Ù„ÙŠ: Ù…Ù† Ø§Ù„Ù…ØªÙ‚Ø¯Ù…ÙŠÙ† Ø¥Ù„Ù‰ Ø§Ù„Ù…ØªØ£Ø®Ø±ÙŠÙ† (ØªØµØ§Ø¹Ø¯ÙŠ)" : "Ø§Ù„ØªØ±ØªÙŠØ¨ Ø§Ù„Ø­Ø§Ù„ÙŠ: Ù…Ù† Ø§Ù„Ù…ØªØ£Ø®Ø±ÙŠÙ† Ø¥Ù„Ù‰ Ø§Ù„Ù…ØªÙ‚Ø¯Ù…ÙŠÙ† (ØªÙ†Ø§Ø²Ù„ÙŠ)"}
                      >
                        <ArrowUpDown className="w-4 h-4 text-brand-magenta" />
                        <span>{sortAsc ? 'Ø§Ù„Ø£Ù‚Ø¯Ù… ÙˆÙ�Ø§Ø© â�³' : 'Ø§Ù„Ø£Ø­Ø¯Ø« ÙˆÙ�Ø§Ø© âŒ›'}</span>
                      </button>

                      {/* Grid / List Mode */}
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-black/40 p-1 rounded-xl border border-slate-200/60 dark:border-white/10 shrink-0 self-end md:self-auto">
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`p-2 rounded-lg transition-all ${viewMode === 'grid'
                            ? 'bg-white dark:bg-brand-magenta text-brand-magenta dark:text-white shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                          title="Ø¹Ø±Ø¶ Ø´Ø¨ÙƒÙŠ"
                        >
                          <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setViewMode('list')}
                          className={`p-2 rounded-lg transition-all ${viewMode === 'list'
                            ? 'bg-white dark:bg-brand-magenta text-brand-magenta dark:text-white shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                          title="Ø¹Ø±Ø¶ Ù‚Ø§Ø¦Ù…ÙŠ"
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
                        Ø¬Ù…ÙŠØ¹ Ø§Ù„Ù…Ø¬Ø§Ù„Ø§Øª ({publishedBooks.length})
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
                      <span>Ø§Ù„ÙƒØªØ¨ Ø§Ù„Ù…Ø®ØªØ§Ø±Ø© ÙˆØ§Ù„Ù…Ø¹ØªÙ…Ø¯Ø©</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        (Ù…Ø¹Ø±ÙˆØ¶ <span className="font-bold text-brand-magenta">{filteredAndSortedBooks.length}</span> ÙƒØªØ§Ø¨)
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
                        <span>Ø¥Ø¹Ø§Ø¯Ø© Ø¶Ø¨Ø· Ø§Ù„Ù�Ù„Ø§ØªØ±</span>
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
                        <p className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">Ù„Ø§ ØªÙˆØ¬Ø¯ ÙƒØªØ¨ ØªØ·Ø§Ø¨Ù‚ Ù…Ø¹Ø§ÙŠÙŠØ± Ø§Ù„Ù�Ù„ØªØ±Ø© Ø§Ù„Ù…Ø­Ø¯Ø¯Ø©</p>
                        <p className="text-xs text-muted-foreground">Ø¬Ø±Ø¨ Ø§Ø®ØªÙŠØ§Ø± Ù…Ø¬Ø§Ù„ Ø¢Ø®Ø± Ø£Ùˆ ØªØºÙŠÙŠØ± Ø§Ù„Ù‚Ø±Ù† Ø§Ù„Ù‡Ø¬Ø±ÙŠ.</p>
                        <button
                          onClick={() => {
                            setQuery('');
                            setSelectedDomain('all');
                            setSelectedCentury('all');
                          }}
                          className="mt-4 px-4 py-2 rounded-xl bg-brand-magenta text-white font-bold text-xs hover:bg-brand-deep transition-all shadow-md"
                        >
                          Ø¹Ø±Ø¶ Ø¬Ù…ÙŠØ¹ Ø§Ù„ÙƒØªØ¨
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
              {/* TAB 3: Ø§Ù„Ù€Ù…Ù€Ø¤Ù„Ù€Ù�Ù€ÙˆÙ† (Authors by Centuries)                    */}
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
                        <span>Ø§Ù„Ø¹ÙˆØ¯Ø© Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ù…Ø¤Ù„Ù�ÙŠÙ† ÙˆØ§Ù„Ù‚Ø±ÙˆÙ†</span>
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
                                    ØªÙˆÙ�ÙŠ: {currentAuthorData.deathYear} Ù‡Ù€
                                  </span>
                                )}
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-magenta/10 text-brand-magenta border border-brand-magenta/20">
                                  {currentAuthorData.centuryName}
                                </span>
                              </div>

                              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                Ø£Ø­Ø¯ Ø£Ø¦Ù…Ø© ÙˆØ£Ø¹Ù„Ø§Ù… Ø§Ù„ØªØ±Ø§Ø« Ø§Ù„Ø¥Ø³Ù„Ø§Ù…ÙŠ Ø§Ù„Ù…Ø¹ØªÙ…Ø¯ÙŠÙ† Ù�ÙŠ Ù…Ù†ØµØ© Ø²Ø§Ø¯ â€¢ Ø¹Ø¯Ø¯ Ø§Ù„Ù…ØµÙ†Ù�Ø§Øª Ø§Ù„Ù…Ù†Ø´ÙˆØ±Ø©: <span className="font-bold text-foreground">{currentAuthorData.books.length} Ù…ØµÙ†Ù�</span>
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
                              <span>ðŸ“œ ØªØ±Ø¬Ù…Ø© ÙˆØ³ÙŠØ±Ø© Ø§Ù„Ù…Ø¤Ù„Ù�</span>
                            </button>
                          </div>

                        </div>
                      </div>

                      {/* Author's Books Header */}
                      <div className="flex items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-200">
                        <BookCheck className="w-5 h-5 text-brand-magenta" />
                        <span>Ù…ØµÙ†Ù�Ø§Øª ÙˆÙ…Ø¤Ù„Ù�Ø§Øª {currentAuthorData.authorName} Ù�ÙŠ Ø²Ø§Ø¯</span>
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
                    /* SUB-VIEW B: Centuries List with Layout Toggle (Ù�ÙˆÙ‚ Ø¨Ø¹Ø¶ vs Ø¬Ù†Ø¨ Ø¨Ø¹Ø¶) */
                    <div className="space-y-6">

                      {/* 1. Authors Statistics Grid (Ø¨Ø·Ø§Ù‚Ø§Øª Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª Ø§Ù„Ù…Ø¤Ù„Ù�ÙŠÙ†) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Stat 1: Total Authors */}
                        <div className="rounded-2xl border border-slate-200/80 dark:border-purple-500/25 bg-white/90 dark:bg-[#14062b]/90 p-4 shadow-sm backdrop-blur-md flex items-center gap-3.5 hover:border-blue-500/40 transition-all">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/15 to-indigo-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-sm">
                            <User className="w-6 h-6" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Ø£Ø¹Ù„Ø§Ù… ÙˆÙ…Ø¤Ù„Ù�Ùˆ Ø§Ù„ØªØ±Ø§Ø«</span>
                            <span className="text-xl font-black text-slate-900 dark:text-white block tracking-tight">
                              {liveStats.total_authors} <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Ø¹Ø§Ù„Ù…Ø§Ù‹ ÙˆØ¥Ù…Ø§Ù…Ø§Ù‹</span>
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate block">Ù…Ù† ÙƒØ¨Ø§Ø± Ø£Ø¦Ù…Ø© ÙˆÙ…Ø­Ù‚Ù‚ÙŠ Ø§Ù„Ø£Ù…Ø©</span>
                          </div>
                        </div>

                        {/* Stat 2: Historical Timeline */}
                        <div className="rounded-2xl border border-slate-200/80 dark:border-purple-500/25 bg-white/90 dark:bg-[#14062b]/90 p-4 shadow-sm backdrop-blur-md flex items-center gap-3.5 hover:border-amber-500/40 transition-all">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/15 to-orange-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
                            <Calendar className="w-6 h-6" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Ø§Ù„Ù†Ø·Ø§Ù‚ Ø§Ù„Ø²Ù…Ù†ÙŠ Ø§Ù„Ù‡Ø¬Ø±ÙŠ</span>
                            <span className="text-base font-black text-slate-900 dark:text-white block truncate">
                              Ù…Ù† Ø§Ù„Ù‚Ø±Ù† {availableCenturies[0]?.century || 1} Ø­ØªÙ‰ {availableCenturies[availableCenturies.length - 1]?.century || 15} Ù‡Ù€
                            </span>
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">
                              15 Ù‚Ø±Ù†Ø§Ù‹ Ù…Ù† Ø§Ù„ØªØ£Ù„ÙŠÙ� ÙˆØ§Ù„ØªØ¯ÙˆÙŠÙ†
                            </span>
                          </div>
                        </div>

                        {/* Stat 3: Centuries Count */}
                        <div className="rounded-2xl border border-slate-200/80 dark:border-purple-500/25 bg-white/90 dark:bg-[#14062b]/90 p-4 shadow-sm backdrop-blur-md flex items-center gap-3.5 hover:border-purple-500/40 transition-all">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/15 to-pink-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-sm">
                            <Clock className="w-6 h-6" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Ø§Ù„Ù‚Ø±ÙˆÙ† Ø§Ù„Ù‡Ø¬Ø±ÙŠØ© Ø§Ù„Ù…ÙˆØ«Ù‚Ø©</span>
                            <span className="text-xl font-black text-slate-900 dark:text-white block tracking-tight">
                              {availableCenturies.length} <span className="text-xs font-bold text-purple-600 dark:text-purple-400">Ø­Ù‚Ø¨Ø§Ù‹ ÙˆÙ‚Ø±ÙˆÙ†Ø§Ù‹</span>
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate block">Ù…Ø±ØªØ¨Ø© ØªØ§Ø±ÙŠØ®ÙŠØ§Ù‹ Ø¨Ø¯Ù‚Ø©</span>
                          </div>
                        </div>

                        {/* Stat 4: Total Works */}
                        <div className="rounded-2xl border border-slate-200/80 dark:border-purple-500/25 bg-white/90 dark:bg-[#14062b]/90 p-4 shadow-sm backdrop-blur-md flex items-center gap-3.5 hover:border-emerald-500/40 transition-all">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
                            <BookCheck className="w-6 h-6" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù…ØµÙ†Ù�Ø§Øª Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø©</span>
                            <span className="text-xl font-black text-slate-900 dark:text-white block tracking-tight">
                              {publishedBooks.length} <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Ù…ØµÙ†Ù�Ø§Ù‹</span>
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate block">Ù…ÙˆØ²Ø¹Ø© Ø¹Ù„Ù‰ Ø§Ù„Ø£Ø¦Ù…Ø© ÙˆØªÙ„Ø§Ù…ÙŠØ°Ù‡Ù…</span>
                          </div>
                        </div>
                      </div>

                      {/* 2. In-Page Search Console (Ù…Ø±Ø¨Ø¹ Ø§Ù„Ø¨Ø­Ø« Ù…Ø·Ø§Ø¨Ù‚ Ù„Ù„Ø±Ø¦ÙŠØ³ÙŠØ© ØªÙ…Ø§Ù…Ø§Ù‹ Ø¨Ø¯ÙˆÙ† Ø£ÙŠ Ù�Ø±ÙŠÙ… Ø¥Ø¶Ø§Ù�ÙŠ) */}
                      <div id="subpage-main-search-bar" className="max-w-4xl mx-auto w-full">
                        {renderSearchConsole(false)}
                      </div>

                      {/* 3. Header & Layout Toggle Bar for Authors */}
                      <div className="rounded-2xl border border-slate-200/90 dark:border-purple-500/20 bg-white/95 dark:bg-[#14062b]/95 p-3 sm:px-5 shadow-sm backdrop-blur-xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-brand-blue" />
                          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                            Ø£Ø¹Ù„Ø§Ù… ÙˆÙ…Ø¤Ù„Ù�Ùˆ Ø§Ù„ØªØ±Ø§Ø« ({authorsByCentury.reduce((sum, c) => sum + c.authors.length, 0)} Ø¹Ø§Ù„Ù…Ø§Ù‹)
                          </h3>
                        </div>

                        {/* View Toggle (Ù�ÙˆÙ‚ Ø¨Ø¹Ø¶ vs Ø¬Ù†Ø¨ Ø¨Ø¹Ø¶) */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground font-semibold hidden sm:inline">Ø·Ø±ÙŠÙ‚Ø© Ø§Ù„Ø¹Ø±Ø¶:</span>
                          <div className="flex items-center gap-1 bg-slate-100 dark:bg-black/40 p-1 rounded-xl border border-slate-200/60 dark:border-white/10">
                            <button
                              onClick={() => setAuthorsViewMode('list')}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${authorsViewMode === 'list'
                                ? 'bg-white dark:bg-brand-magenta text-brand-magenta dark:text-white shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                              title="Ø¹Ø±Ø¶ Ù�ÙˆÙ‚ Ø¨Ø¹Ø¶ (Ù‚ÙˆØ§Ø¦Ù… Ù…Ù†Ø³Ø¯Ù„Ø© Ù„Ù„Ù‚Ø±ÙˆÙ†)"
                            >
                              <List className="w-3.5 h-3.5" />
                              <span>Ù�ÙˆÙ‚ Ø¨Ø¹Ø¶</span>
                            </button>

                            <button
                              onClick={() => setAuthorsViewMode('grid')}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${authorsViewMode === 'grid'
                                ? 'bg-white dark:bg-brand-magenta text-brand-magenta dark:text-white shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                              title="Ø¹Ø±Ø¶ Ø¬Ù†Ø¨ Ø¨Ø¹Ø¶ (Ø¨Ø·Ø§Ù‚Ø§Øª Ø´Ø¨ÙƒÙŠØ© Ù„Ù„Ù‚Ø±ÙˆÙ†)"
                            >
                              <LayoutGrid className="w-3.5 h-3.5" />
                              <span>Ø¬Ù†Ø¨ Ø¨Ø¹Ø¶</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* AUTHORS CONTENT: LIST MODE (Ù�ÙˆÙ‚ Ø¨Ø¹Ø¶) */}
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
                                        ÙŠØ¶Ù… <span className="font-bold text-brand-magenta">{cGroup.authors.length}</span> Ø¥Ù…Ø§Ù…Ø§Ù‹ ÙˆØ¹Ø§Ù„Ù…Ø§Ù‹ â€¢ <span className="font-bold">{cGroup.totalBooks}</span> ÙƒØªØ¨
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 shrink-0">
                                    <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-black/30 text-slate-700 dark:text-slate-300">
                                      {cGroup.authors.length} Ù…Ø¤Ù„Ù�
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
                                                      (ØªÙˆÙ�ÙŠ: {author.deathYear} Ù‡Ù€)
                                                    </span>
                                                  ) : (
                                                    <span className="text-[11px] text-muted-foreground">
                                                      (Ù…Ø¹Ø§ØµØ±)
                                                    </span>
                                                  )}
                                                </div>
                                              </div>

                                              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-white/5 text-muted-foreground shrink-0">
                                                {author.books.length} {author.books.length === 1 ? 'ÙƒØªØ§Ø¨' : 'ÙƒØªØ¨'}
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
                                                  + {author.books.length - 2} Ù…ØµÙ†Ù�Ø§Øª Ø£Ø®Ø±Ù‰
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
                                              title="Ø¹Ø±Ø¶ Ø§Ù„Ø³ÙŠØ±Ø© Ø§Ù„Ø°Ø§ØªÙŠØ© ÙˆØ§Ù„Ø´ÙŠÙˆØ®"
                                            >
                                              <FileText className="w-3.5 h-3.5" />
                                              <span>Ø§Ù„Ø³ÙŠØ±Ø©</span>
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => setSelectedAuthor(author.authorName)}
                                              className="flex-1 py-2 px-3 rounded-xl bg-brand-magenta text-white text-xs font-bold hover:bg-brand-deep transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                                              title="Ø¹Ø±Ø¶ Ø¬Ù…ÙŠØ¹ Ù…ØµÙ†Ù�Ø§Øª Ù‡Ø°Ø§ Ø§Ù„Ø¥Ù…Ø§Ù…"
                                            >
                                              <span>Ø§Ù„ÙƒØªØ¨</span>
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
                              Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ù…Ø¤Ù„Ù�ÙŠÙ† ÙŠØ·Ø§Ø¨Ù‚ÙˆÙ† Ø¨Ø­Ø«Ùƒ.
                            </div>
                          )}
                        </div>
                      ) : (
                        /* AUTHORS CONTENT: GRID MODE (Ø¬Ù†Ø¨ Ø¨Ø¹Ø¶) */
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
                                        {cGroup.authors.length} Ù…Ø¤Ù„Ù�
                                      </span>
                                    </div>

                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">
                                      {cGroup.centuryName}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                      ÙŠØ¶Ù… <span className="font-bold text-brand-magenta">{cGroup.authors.length}</span> Ø¥Ù…Ø§Ù…Ø§Ù‹ ÙˆØ¹Ø§Ù„Ù…Ø§Ù‹ â€¢ <span className="font-bold">{cGroup.totalBooks}</span> ÙƒØªØ¨ Ù…Ù†Ø´ÙˆØ±Ø©
                                    </p>
                                  </div>

                                  <div className="pt-4 mt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
                                    <span>{isOpen ? 'Ø¥Ø®Ù�Ø§Ø¡ Ø§Ù„Ø£Ø¹Ù„Ø§Ù… â–²' : 'Ø§Ø³ØªØ¹Ø±Ø§Ø¶ Ø§Ù„Ø£Ø¹Ù„Ø§Ù… â–¼'}</span>
                                    <span className="text-[11px] text-muted-foreground font-normal">
                                      {isOpen ? 'Ù…Ù�ØªÙˆØ­ Ø­Ø§Ù„ÙŠØ§Ù‹' : 'Ø§Ù†Ù‚Ø± Ù„Ù„Ù�ØªØ­'}
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
                                    Ø¹Ù„Ù…Ø§Ø¡ ÙˆØ£Ø¹Ù„Ø§Ù…: <span className="text-amber-600 dark:text-amber-400">{authorsByCentury.find(c => c.century === openCentury)?.centuryName}</span>
                                  </h3>
                                </div>
                                <button
                                  onClick={() => setOpenCentury(null)}
                                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-bold flex items-center gap-1"
                                >
                                  <span>Ø¥ØºÙ„Ø§Ù‚ Ø§Ù„Ù‚Ø±Ù†</span>
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
                                                (ØªÙˆÙ�ÙŠ: {author.deathYear} Ù‡Ù€)
                                              </span>
                                            ) : (
                                              <span className="text-[11px] text-muted-foreground">
                                                (Ù…Ø¹Ø§ØµØ±)
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-white/5 text-muted-foreground shrink-0">
                                          {author.books.length} {author.books.length === 1 ? 'ÙƒØªØ§Ø¨' : 'ÙƒØªØ¨'}
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
                                            + {author.books.length - 2} Ù…ØµÙ†Ù�Ø§Øª Ø£Ø®Ø±Ù‰
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedAuthorBook(author.sampleBook)}
                                        className="flex-1 py-2 px-3 rounded-xl border border-brand-magenta/30 bg-brand-magenta/5 text-brand-magenta hover:bg-brand-magenta/15 text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
                                        title="Ø¹Ø±Ø¶ Ø§Ù„Ø³ÙŠØ±Ø© Ø§Ù„Ø°Ø§ØªÙŠØ© ÙˆØ§Ù„Ø´ÙŠÙˆØ®"
                                      >
                                        <FileText className="w-3.5 h-3.5" />
                                        <span>Ø§Ù„Ø³ÙŠØ±Ø©</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => setSelectedAuthor(author.authorName)}
                                        className="flex-1 py-2 px-3 rounded-xl bg-brand-magenta text-white text-xs font-bold hover:bg-brand-deep transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                                        title="Ø¹Ø±Ø¶ Ø¬Ù…ÙŠØ¹ Ù…ØµÙ†Ù�Ø§Øª Ù‡Ø°Ø§ Ø§Ù„Ø¥Ù…Ø§Ù…"
                                      >
                                        <span>Ø§Ù„ÙƒØªØ¨</span>
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
      {/* FLOATING BOOK INFO MODAL CARD (Ù†Ø§Ù�Ø°Ø© Ø¹Ø§Ø¦Ù…Ø© Ù…Ø¹ Ø®Ù„Ù�ÙŠØ© Ù‚Ø§Ø¨Ù„Ø© Ù„Ù„Ù†Ù‚Ø±) */}
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
              title="Ø¥ØºÙ„Ø§Ù‚ Ø§Ù„Ù†Ø§Ù�Ø°Ø©"
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
                    Ø§Ù„Ù…Ø¤Ù„Ù�: {activeInfoBook.author}
                  </span>
                  {activeInfoBook.category && (
                    <span className="px-2 py-0.5 rounded-md bg-brand-magenta/10 text-brand-magenta font-bold border border-brand-magenta/20">
                      {activeInfoBook.category}
                    </span>
                  )}
                  {activeInfoBook.century_name && activeInfoBook.century_name !== 'ØºÙŠØ± Ù…Ø­Ø¯Ø¯' && (
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
                  <span>Ø¬Ø§Ø±ÙŠ Ø¬Ù„Ø¨ ØªÙ�Ø§ØµÙŠÙ„ ÙˆÙ…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„ÙƒØªØ§Ø¨...</span>
                </div>
              ) : (
                modalInfoText || activeInfoBook.infoText || 'Ù„Ù… ØªØªÙˆÙ�Ø± ØªÙ�Ø§ØµÙŠÙ„ Ø¥Ø¶Ø§Ù�ÙŠØ© Ù„Ù‡Ø°Ø§ Ø§Ù„ÙƒØªØ§Ø¨ Ø­Ø§Ù„ÙŠØ§Ù‹.'
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
                <span>ØªØµÙ�Ø­ ÙˆÙ‚Ø±Ø§Ø¡Ø© Ø§Ù„ÙƒØªØ§Ø¨</span>
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
                <span>Ø§Ø³Ø£Ù„ Ø²Ø§Ø¯ Ø¹Ù† Ø§Ù„ÙƒØªØ§Ø¨</span>
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
            title: bookName || "ÙƒØªØ§Ø¨ Ù…Ù† Ø§Ù„Ù…ÙƒØªØ¨Ø©",
            author: selectedAuthorBook?.author || ""
          });
          setView('reader');
        }}
        onAskZadAboutAuthor={(authorName) => {
          setSelectedAuthorBook(null);
          onAskBook({
            id: selectedAuthorBook?.id || 0,
            title: `Ø³ÙŠØ±Ø© ${authorName}`,
            author: authorName,
            initialPrompt: `Ø­Ø¯Ø«Ù†ÙŠ Ø¨Ø§Ù„ØªÙ�ØµÙŠÙ„ Ø¹Ù† Ø§Ù„Ø³ÙŠØ±Ø© Ø§Ù„Ø°Ø§ØªÙŠØ© ÙˆØ§Ù„Ù…Ø°Ù‡Ø¨ Ø§Ù„Ù�Ù‚Ù‡ÙŠ ÙˆØ´ÙŠÙˆØ® ÙˆÙ…ØµÙ†Ù�Ø§Øª ${authorName}`
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
