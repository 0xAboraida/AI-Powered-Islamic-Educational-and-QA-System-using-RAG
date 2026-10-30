import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  BookOpen, FileText, User, Pen, Sparkles,
  Calendar, Layers, BookCheck, Download, FileDown, Info, Heart, Loader2,
  Check, HardDriveDownload, Trash2, ChevronLeft, X, ArrowLeft
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { BookMeta } from '../types/bookTypes';
import { hasBookPdf, getBookPdfUrl, inferCenturyAndDeath } from '../utils/turathMeta';
import { downloadBookFile } from '../utils/bookExport';
import { fetchTurathBookPdfUrl, fetchTurathPage, fetchTurathBookIndexes } from '../../../api/turathApi';
import { idbIsBookSavedOffline, idbSaveBookOffline, idbRemoveOfflineBook } from '../../../utils/indexedDbStorage';
import { resolveBookCover, getSynchronousCachedCover } from '../services/bookCoverService';

export interface BookCardProps {
  book: BookMeta;
  viewMode: 'grid' | 'list';
  showCategoryBadge?: boolean;
  compact?: boolean;
  onAsk?: (b: BookMeta) => void;
  onRead: (b: BookMeta) => void;
  onOpenAuthorBio?: (b: BookMeta) => void;
  onOpenBookInfo: (b: BookMeta) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (b: BookMeta) => void;
  onDeleteOffline?: (b: BookMeta) => void;
}

export function BookCard({
  book,
  viewMode,
  showCategoryBadge = true,
  compact = false,
  onAsk,
  onRead,
  onOpenAuthorBio,
  onOpenBookInfo,
  isFavorite,
  onToggleFavorite,
  onDeleteOffline
}: BookCardProps) {
  const { theme, accentColor, isDark } = useTheme();
  const { deathYear, centuryName } = useMemo(() => inferCenturyAndDeath(book), [book]);

  // Dynamic cover resolution with IndexedDB caching (strictly only for grid view mode)
  const [coverUrl, setCoverUrl] = useState<string | null>(() => {
    if (viewMode !== 'grid') return null;
    return getSynchronousCachedCover(book);
  });

  useEffect(() => {
    if (viewMode !== 'grid') {
      setCoverUrl(null);
      return;
    }
    let isMounted = true;
    resolveBookCover(book).then(url => {
      if (isMounted && url) {
        setCoverUrl(url);
      }
    });
    return () => { isMounted = false; };
  }, [book, viewMode]);

  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const [menuPlacement, setMenuPlacement] = useState<'top' | 'bottom'>('bottom');
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const bookIdentifier = useMemo(() => book.id ?? book.title, [book.id, book.title]);

  useEffect(() => {
    const handleCloseOthers = (e: Event) => {
      const customEvent = e as CustomEvent<{ bookIdentifier: number | string }>;
      if (customEvent.detail?.bookIdentifier !== bookIdentifier) {
        setIsDownloadMenuOpen(false);
      }
    };
    window.addEventListener('close-all-book-download-menus', handleCloseOthers);
    return () => window.removeEventListener('close-all-book-download-menus', handleCloseOthers);
  }, [bookIdentifier]);

  useEffect(() => {
    if (!isDownloadMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) {
        setIsDownloadMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDownloadMenuOpen]);

  const handleToggleDownloadMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const buttonEl = e.currentTarget;
    const rect = buttonEl.getBoundingClientRect();

    // Check closest scrollable container or viewport
    const scrollParent = buttonEl.closest('.overflow-y-auto') as HTMLElement | null;
    let shouldOpenTop = false;

    if (scrollParent) {
      const parentRect = scrollParent.getBoundingClientRect();
      const spaceBelowInParent = parentRect.bottom - rect.bottom;
      const spaceAboveInParent = rect.top - parentRect.top;

      // If space below inside the scrollable container is cramped (< 240px) and there's more space above, open top
      if (spaceBelowInParent < 240 && spaceAboveInParent > spaceBelowInParent) {
        shouldOpenTop = true;
      }
    } else {
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      if (spaceBelow < 240 && spaceAbove > spaceBelow) {
        shouldOpenTop = true;
      }
    }

    setMenuPlacement(shouldOpenTop ? 'top' : 'bottom');

    setIsDownloadMenuOpen((prev) => {
      if (!prev) {
        window.dispatchEvent(
          new CustomEvent('close-all-book-download-menus', {
            detail: { bookIdentifier },
          })
        );
        return true;
      }
      return false;
    });
  };

  const isPdfAvailable = useMemo(() => hasBookPdf(book), [book]);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [isSavedOffline, setIsSavedOffline] = useState(false);
  const [isSavingOffline, setIsSavingOffline] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgressText, setExportProgressText] = useState('');

  useEffect(() => {
    let isMounted = true;
    idbIsBookSavedOffline(book.id).then((saved: boolean) => {
      if (isMounted) setIsSavedOffline(saved);
    });
    return () => { isMounted = false; };
  }, [book.id]);

  const handleToggleOffline = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSavingOffline) return;

    if (isSavedOffline) {
      await idbRemoveOfflineBook(book.id);
      setIsSavedOffline(false);
      return;
    }

    setIsSavingOffline(true);
    try {
      const turathId = Number(book.id);
      const cachedPages: Record<number, any> = {};
      const totalToFetch = Math.min(book.page_count || 50, 50);

      // 1. Fetch indexes so table of contents works offline
      let indexes: any = {};
      try {
        const idxRes = await fetchTurathBookIndexes(turathId);
        if (idxRes?.indexes) {
          indexes = idxRes.indexes;
        }
      } catch { }

      // 2. Batch fetch initial pages in parallel chunks of 5
      const BATCH_SIZE = 5;
      for (let p = 1; p <= totalToFetch; p += BATCH_SIZE) {
        const batchPromises: Promise<{ page: number; text: string | null }>[] = [];
        for (let i = 0; i < BATCH_SIZE && p + i <= totalToFetch; i++) {
          const pg = p + i;
          batchPromises.push(
            fetchTurathPage(turathId, pg)
              .then(res => ({ page: pg, text: res?.text || null }))
              .catch(() => ({ page: pg, text: null }))
          );
        }
        const results = await Promise.all(batchPromises);
        for (const r of results) {
          if (r.text) cachedPages[r.page] = { text: r.text, main: r.text };
        }
      }

      await idbSaveBookOffline({
        bookId: book.id,
        title: book.title,
        author: book.author,
        indexes,
        cachedPages,
        savedAt: Date.now()
      });
      setIsSavedOffline(true);
    } catch (err) {
      console.error('Failed to save book offline:', err);
    } finally {
      setIsSavingOffline(false);
    }
  };

  const handleExport = async (format: 'txt' | 'json') => {
    setIsExporting(true);
    setExportProgressText('جاري التحضير...');
    try {
      await downloadBookFile(book, format, (p) => {
        setExportProgressText(p.status);
      });
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
      setExportProgressText('');
      setIsDownloadMenuOpen(false);
    }
  };

  const handleOpenOrDownloadPdf = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsDownloadMenuOpen(false);

    // 1. Direct URL if already attached
    const immediateUrl = getBookPdfUrl(book);
    if (immediateUrl) {
      window.open(immediateUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // 2. Fetch Turath PDF dynamically on demand
    const turathId = typeof book.id === 'number' ? book.id : parseInt(String(book.id), 10);
    if (!isNaN(turathId) && turathId > 0) {
      setLoadingPdf(true);
      try {
        const resolvedUrl = await fetchTurathBookPdfUrl(turathId);
        if (resolvedUrl) {
          book.pdf_url = resolvedUrl;
          window.open(resolvedUrl, '_blank', 'noopener,noreferrer');
        } else {
          alert('النسخة المصورة جارية إتاحتها من خادم تراث، يرجى المحاولة بعد قليل.');
        }
      } catch (err) {
        console.error('Error fetching PDF:', err);
      } finally {
        setLoadingPdf(false);
      }
    }
  };

  const formattedSize = useMemo(() => {
    if (typeof book.size === 'number' && book.size > 0) {
      const mb = book.size / (1024 * 1024);
      return mb >= 0.1 ? `${mb.toFixed(1)} MB` : `${Math.round(book.size / 1024)} KB`;
    }
    return null;
  }, [book.size]);

  const getBookCardContainerClass = () => {
    if (isDark) {
      switch (accentColor) {
        case 'amber':
          return 'border border-white/10 bg-[#181b26] hover:bg-[#1e2333] hover:border-[#dfbf83]/50 hover:shadow-lg shadow-sm';
        case 'emerald':
          return 'border border-white/10 bg-[#181b26] hover:bg-[#1e2333] hover:border-teal-400/50 hover:shadow-lg shadow-sm';
        case 'blue':
          return 'border border-white/10 bg-[#181b26] hover:bg-[#1e2333] hover:border-blue-400/50 hover:shadow-lg shadow-sm';
        case 'purple':
        default:
          return 'border border-white/10 bg-[#181b26] hover:bg-[#1e2333] hover:border-purple-400/50 hover:shadow-lg shadow-sm';
      }
    } else {
      switch (accentColor) {
        case 'amber':
          return 'border-[#ebd9b5]/90 bg-white hover:border-[#dfbf83] hover:shadow-md';
        case 'emerald':
          return 'border-teal-100 bg-white hover:border-teal-300 hover:shadow-md';
        case 'blue':
          return 'border-blue-100 bg-white hover:border-blue-300 hover:shadow-md';
        case 'purple':
        default:
          return 'border-purple-100 bg-white hover:border-purple-300 hover:shadow-md';
      }
    }
  };

  const getGlowOrbClass = () => {
    switch (accentColor) {
      case 'amber': return 'bg-[#dfbf83]/10 group-hover:bg-[#dfbf83]/20';
      case 'emerald': return 'bg-teal-500/10 group-hover:bg-teal-500/20';
      case 'blue': return 'bg-blue-500/10 group-hover:bg-blue-500/20';
      case 'purple':
      default: return 'bg-purple-500/10 group-hover:bg-purple-500/20';
    }
  };

  const getBookIconClass = () => {
    switch (accentColor) {
      case 'amber':
        return 'bg-gradient-to-br from-[#b88d46]/15 to-[#dfbf83]/25 text-[#8e682d] dark:text-[#eed9b0] group-hover:bg-[#b88d46] group-hover:text-stone-950';
      case 'emerald':
        return 'bg-gradient-to-br from-teal-500/15 to-emerald-500/20 text-teal-600 dark:text-teal-300 group-hover:bg-teal-600 group-hover:text-white';
      case 'blue':
        return 'bg-gradient-to-br from-blue-500/15 to-indigo-500/20 text-blue-600 dark:text-blue-300 group-hover:bg-blue-600 group-hover:text-white';
      case 'purple':
      default:
        return 'bg-gradient-to-br from-brand-magenta/10 to-purple-500/20 text-brand-magenta group-hover:bg-brand-magenta group-hover:text-white';
    }
  };

  const getTitleHoverClass = () => {
    switch (accentColor) {
      case 'amber': return 'group-hover:text-[#8e682d] dark:group-hover:text-[#eed9b0]';
      case 'emerald': return 'group-hover:text-teal-600 dark:group-hover:text-teal-400';
      case 'blue': return 'group-hover:text-blue-600 dark:group-hover:text-blue-400';
      case 'purple':
      default: return 'group-hover:text-brand-magenta';
    }
  };

  const getCategoryBadgeClass = () => {
    switch (accentColor) {
      case 'amber':
        return 'bg-[#dfbf83]/15 text-[#8a652a] dark:text-[#eed9b0] border-[#dfbf83]/30';
      case 'emerald':
        return 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20';
      case 'blue':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20';
      case 'purple':
      default:
        return 'bg-brand-magenta/10 text-brand-magenta border-brand-magenta/20';
    }
  };


  const getAskButtonClass = () => {
    switch (accentColor) {
      case 'amber':
        return 'border-[#dfbf83]/40 bg-[#dfbf83]/10 text-[#8e682d] dark:text-[#eed9b0] hover:bg-[#dfbf83]/20';
      case 'emerald':
        return 'border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-300 hover:bg-teal-500/20';
      case 'blue':
        return 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-300 hover:bg-blue-500/20';
      case 'purple':
      default:
        return 'border-brand-magenta/30 bg-brand-magenta/5 text-brand-magenta hover:bg-brand-magenta/15';
    }
  };

  const getInfoButtonClass = () => {
    switch (accentColor) {
      case 'amber':
        return 'hover:text-[#8e682d] dark:hover:text-[#eed9b0] hover:bg-[#dfbf83]/15 hover:border-[#dfbf83]/40';
      case 'emerald':
        return 'hover:text-teal-600 dark:hover:text-teal-300 hover:bg-teal-500/15 hover:border-teal-500/40';
      case 'blue':
        return 'hover:text-blue-600 dark:hover:text-blue-300 hover:bg-blue-500/15 hover:border-blue-500/40';
      case 'purple':
      default:
        return 'hover:text-brand-magenta hover:bg-brand-magenta/10 hover:border-brand-magenta/30';
    }
  };

  // GRID VIEW CARD
  if (viewMode === 'grid') {
    return (
      <div
        onClick={() => onRead(book)}
        className={`group relative rounded-xl border ${compact ? 'p-2.5 sm:p-3' : 'p-3 sm:p-3.5'} shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer ${getBookCardContainerClass()}`}
      >
        <div className={`pointer-events-none absolute -right-16 -top-16 w-24 h-24 rounded-full blur-2xl transition-all duration-500 ${getGlowOrbClass()}`} />

        {/* Full Uncropped Book Cover Presentation for Grid View */}
        {coverUrl && (
          <div className="relative w-full aspect-[1/1.4] mb-3 rounded-lg overflow-hidden bg-stone-100/80 dark:bg-black/40 border border-slate-200/70 dark:border-white/10 group-hover:shadow-lg transition-all flex items-center justify-center p-0.5">
            <img
              src={coverUrl}
              alt={book.title}
              loading="lazy"
              className="w-full h-full object-contain rounded group-hover:scale-[1.02] transition-transform duration-300"
              onError={(e) => {
                // Graceful fallback to hide broken image
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            {/* Subtle spine shadow on the right (RTL binding edge) */}
            <div className="absolute top-0 right-0 bottom-0 w-3 bg-gradient-to-l from-black/25 to-transparent pointer-events-none rounded-r-lg" />
          </div>
        )}

        <div>
          {/* Row 1: Book Title + Favorite Button */}
          <div className={`flex items-start justify-between gap-2 ${compact ? 'mb-1' : 'mb-1.5'}`}>
            <div className={`flex items-start ${compact ? 'gap-2' : 'gap-2.5'} min-w-0 flex-1`}>
              <div className={`${compact ? 'w-7 h-7 rounded-lg' : 'w-8 h-8 rounded-lg'} flex items-center justify-center shrink-0 group-hover:scale-105 transition-all shadow-sm mt-0.5 ${getBookIconClass()}`}>
                <BookOpen className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className={`font-bold ${compact ? 'text-xs sm:text-[13px]' : 'text-sm'} text-slate-800 dark:text-slate-100 transition-colors leading-snug line-clamp-2 ${getTitleHoverClass()}`}>
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
                className={`p-1 rounded-lg transition-all shrink-0 active:scale-90 cursor-pointer ${isFavorite
                  ? 'text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 shadow-xs'
                  : 'text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-white/10'
                  }`}
                title={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
              >
                <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current text-rose-500' : ''}`} />
              </button>
            )}
          </div>

          {/* Row 2: Author Name + Category Badge + Century Badge */}
          <div className="flex items-center gap-1.5 flex-wrap mb-2.5 pr-0.5">
            {onOpenAuthorBio && book.author && book.author !== 'من غير معروف' ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAuthorBio(book);
                }}
                className={`inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors group/author outline-none text-right shrink-0 cursor-pointer ml-2 ${getTitleHoverClass()}`}
                title="عرض ترجمة وسيرة المؤلف"
              >
                <User className="h-3 w-3 shrink-0 group-hover/author:scale-110 transition-transform text-slate-400" />
                <span className="font-semibold group-hover/author:underline underline-offset-4 truncate max-w-[140px]">
                  {book.author}
                </span>
              </button>
            ) : (
              <p className="inline-flex items-center gap-1 text-[11px] text-muted-foreground shrink-0 ml-2 cursor-default select-none">
                <User className="h-3 w-3 shrink-0 text-slate-400" />
                <span className="font-semibold truncate max-w-[140px]">{book.author}</span>
              </p>
            )}

            {showCategoryBadge && book.category && (
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${getCategoryBadgeClass()}`}>
                <Layers className="w-2.5 h-2.5" />
                {book.category}
              </span>
            )}
            {centuryName && centuryName !== 'غير محدد' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shrink-0" title={deathYear ? `توفي: ${deathYear} هـ` : centuryName}>
                <Calendar className="w-2.5 h-2.5" />
                <span>{centuryName}</span>
                {deathYear && <span className="opacity-75 font-mono">({deathYear}هـ)</span>}
              </span>
            )}
            {formattedSize && (
              <span className="text-[10px] text-muted-foreground font-mono opacity-70 shrink-0" title="حجم ملف الكتاب">
                {formattedSize}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            {isPdfAvailable && (
              <button
                type="button"
                onClick={handleOpenOrDownloadPdf}
                disabled={loadingPdf}
                className="px-2 py-1 rounded-lg text-xs font-bold font-mono text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 shrink-0 transition-colors cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                title="فتح أو تحميل النسخة المصورة (PDF) المعتمدة"
              >
                {loadingPdf ? (
                  <Loader2 className="w-3 h-3 animate-spin text-rose-500" />
                ) : (
                  'PDF'
                )}
              </button>
            )}

            {/* Download Menu */}
            <div className={`relative ${isDownloadMenuOpen ? 'z-50' : 'z-10'}`}>
              <button
                type="button"
                onClick={handleToggleDownloadMenu}
                className={`p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-muted-foreground transition-all flex items-center justify-center cursor-pointer hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/10 ${isSavedOffline ? 'text-amber-500 border-amber-500/30 bg-amber-500/10' : ''}`}
                title={isSavedOffline ? "الكتاب محفوظ للقراءة أوفلاين (انقر لخيارات التصدير)" : "تحميل وتصدير الكتاب (أوفلاين / TXT / JSON / PDF)"}
              >
                {isSavedOffline ? <HardDriveDownload className="w-3.5 h-3.5 text-amber-500" /> : <Download className="w-3.5 h-3.5" />}
              </button>

              {isDownloadMenuOpen && (
                <div
                  ref={downloadMenuRef}
                  onClick={(e) => e.stopPropagation()}
                  className={`absolute left-0 w-56 rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#161226]/95 backdrop-blur-xl p-1.5 shadow-xl z-50 text-right animate-in fade-in zoom-in-95 duration-150 ${
                    menuPlacement === 'top'
                      ? 'bottom-full mb-1.5 origin-bottom-left'
                      : 'top-full mt-1.5 origin-top-left'
                  }`}
                >
                  <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 dark:border-white/10 mb-1">
                    <span className="text-[10px] font-bold text-muted-foreground">
                      خيارات تحميل وتصدير الكتاب:
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsDownloadMenuOpen(false);
                      }}
                      className="p-0.5 rounded-md hover:bg-slate-200 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="إغلاق"
                      aria-label="إغلاق قائمة التحميل"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* 1. Offline Storage (مثل تراث تماماً) */}
                  <button
                    type="button"
                    onClick={handleToggleOffline}
                    disabled={isSavingOffline}
                    className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-right cursor-pointer ${isSavedOffline ? 'text-amber-600 dark:text-amber-400' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <HardDriveDownload className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{isSavingOffline ? 'جاري الحفظ أوفلاين...' : isSavedOffline ? 'محفوظ أوفلاين (إزالة)' : 'حفظ للقراءة دون إنترنت (Offline)'}</span>
                    </div>
                    {isSavingOffline ? (
                      <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                    ) : isSavedOffline ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : null}
                  </button>

                  {/* 2. Full TXT download */}
                  <button
                    type="button"
                    onClick={() => handleExport('txt')}
                    disabled={isExporting}
                    className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-right cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <FileDown className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>تحميل متن الكتاب (TXT)</span>
                    </div>
                    {isExporting ? <Loader2 className="w-3 h-3 animate-spin text-emerald-500" /> : null}
                  </button>

                  {/* 3. JSON download */}
                  <button
                    type="button"
                    onClick={() => handleExport('json')}
                    disabled={isExporting}
                    className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-right cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <BookCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>بيانات وفهرس (JSON)</span>
                    </div>
                  </button>

                  {/* 4. PDF download */}
                  {isPdfAvailable && (
                    <button
                      type="button"
                      onClick={handleOpenOrDownloadPdf}
                      disabled={loadingPdf}
                      className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-right cursor-pointer text-rose-600 dark:text-rose-400"
                    >
                      <div className="flex items-center gap-2">
                        <FileDown className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>تحميل النسخة المصورة (PDF)</span>
                      </div>
                      {loadingPdf ? (
                        <Loader2 className="w-3 h-3 animate-spin text-rose-500" />
                      ) : (
                        <span className="text-[10px] font-bold px-1 rounded bg-rose-500/10 border border-rose-500/20 font-mono">PDF</span>
                      )}
                    </button>
                  )}

                  {isExporting && exportProgressText && (
                    <p className="text-[10px] text-muted-foreground px-2 py-1 mt-1 border-t border-slate-100 dark:border-white/10 animate-pulse">
                      {exportProgressText}
                    </p>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenBookInfo(book);
              }}
              className={`p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-muted-foreground transition-all flex items-center justify-center cursor-pointer ${getInfoButtonClass()}`}
              title="تفاصيل ومعلومات الكتاب"
            >
              <Info className="w-3.5 h-3.5" />
            </button>

            {onDeleteOffline && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteOffline(book);
                }}
                className="p-1.5 rounded-lg border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/50 transition-colors cursor-pointer active:scale-95"
                title="حذف الكتاب من المحمّلات المحلية"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-[11px] font-semibold text-muted-foreground group-hover:text-brand-magenta transition-colors flex items-center gap-0.5">
            <span>تصفح</span>
            <ChevronLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    );
  }

  // LIST VIEW ROW
  return (
    <div
      onClick={() => onRead(book)}
      className={`group rounded-xl border ${compact ? 'py-2 px-2.5 sm:px-3' : 'p-3 sm:p-3.5'} shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer flex flex-col gap-2.5 ${getBookCardContainerClass()}`}
    >
      {/* Top Details: Icon + Title + Meta */}
      <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
        <div
          onClick={(e) => {
            e.stopPropagation();
            onRead(book);
          }}
          className={`${compact ? 'w-7 h-7 rounded-lg' : 'w-8 h-8 rounded-lg'} flex items-center justify-center shrink-0 transition-all shadow-xs mt-0.5 cursor-pointer ${getBookIconClass()}`}
          title="فتح وقراءة الكتاب"
        >
          <BookOpen className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        </div>

        <div className="min-w-0 flex-1">
          <h4
            onClick={(e) => {
              e.stopPropagation();
              onRead(book);
            }}
            className={`font-bold ${compact ? 'text-xs sm:text-[13px] mb-0.5' : 'text-sm sm:text-[15px] mb-1.5'} text-slate-800 dark:text-slate-100 transition-colors line-clamp-2 leading-snug cursor-pointer ${getTitleHoverClass()}`}
            title={book.title}
          >
            {book.title}
          </h4>

          {/* Meta line: Author + Death / Century + Category */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
            {onOpenAuthorBio && book.author && book.author !== 'من غير معروف' ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAuthorBio(book);
                }}
                className={`inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors group/author outline-none text-right shrink-0 cursor-pointer ${getTitleHoverClass()}`}
                title={`عرض ترجمة وسيرة ${book.author}`}
              >
                <User className="h-3 w-3 shrink-0 text-slate-400 group-hover/author:scale-110 transition-transform" />
                <span className="group-hover/author:underline underline-offset-2">
                  {book.author}
                </span>
              </button>
            ) : (
              <p className="inline-flex items-center gap-1 text-[11px] text-muted-foreground shrink-0 select-none">
                <User className="h-3 w-3 shrink-0 text-slate-400" />
                <span>{book.author}</span>
              </p>
            )}

            {((centuryName && centuryName !== 'غير محدد') || deathYear) && (
              <>
                <span className="text-slate-300 dark:text-white/20 text-[10px]">•</span>
                <span
                  className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-amber-700 dark:text-amber-400 shrink-0 font-sans"
                  title={deathYear ? `توفي: ${deathYear} هـ` : centuryName}
                >
                  <Calendar className="w-2.5 h-2.5" />
                  <span>{deathYear ? `ت ${deathYear}هـ` : centuryName}</span>
                </span>
              </>
            )}

            {showCategoryBadge && book.category && (
              <>
                <span className="text-slate-300 dark:text-white/20 text-[10px]">•</span>
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${getCategoryBadgeClass()}`}>
                  <Layers className="w-2.5 h-2.5" />
                  <span>{book.category}</span>
                </span>
              </>
            )}

            {formattedSize && (
              <>
                <span className="text-slate-300 dark:text-white/20 text-[10px]">•</span>
                <span className="text-[10px] text-muted-foreground font-mono opacity-70 shrink-0" title="حجم ملف الكتاب">
                  {formattedSize}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Action buttons on the right, "قراءة الكتاب" CTA on the left */}
      <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2 text-xs">
        {/* Right Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Download Menu */}
          <div className={`relative ${isDownloadMenuOpen ? 'z-50' : 'z-10'}`}>
            <button
              type="button"
              onClick={handleToggleDownloadMenu}
              className={`p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-muted-foreground transition-all flex items-center justify-center cursor-pointer hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/10 ${isSavedOffline ? 'text-amber-500 border-amber-500/30 bg-amber-500/10' : ''}`}
              title={isSavedOffline ? "الكتاب محفوظ للقراءة أوفلاين (انقر لخيارات التصدير)" : "تحميل وتصدير الكتاب (أوفلاين / TXT / JSON / PDF)"}
            >
              {isSavedOffline ? <HardDriveDownload className="w-3.5 h-3.5 text-amber-500" /> : <Download className="w-3.5 h-3.5" />}
            </button>

            {isDownloadMenuOpen && (
              <div
                ref={downloadMenuRef}
                onClick={(e) => e.stopPropagation()}
                className={`absolute left-0 w-56 rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#161226]/95 backdrop-blur-xl p-1.5 shadow-xl z-50 text-right animate-in fade-in zoom-in-95 duration-150 ${
                  menuPlacement === 'top'
                    ? 'bottom-full mb-1.5 origin-bottom-left'
                    : 'top-full mt-1.5 origin-top-left'
                }`}
              >
                <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 dark:border-white/10 mb-1">
                  <span className="text-[10px] font-bold text-muted-foreground">
                    خيارات تحميل وتصدير الكتاب:
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDownloadMenuOpen(false);
                    }}
                    className="p-0.5 rounded-md hover:bg-slate-200 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="إغلاق"
                    aria-label="إغلاق قائمة التحميل"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 1. Offline Storage */}
                <button
                  type="button"
                  onClick={handleToggleOffline}
                  disabled={isSavingOffline}
                  className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-right cursor-pointer ${isSavedOffline ? 'text-amber-600 dark:text-amber-400' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <HardDriveDownload className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{isSavingOffline ? 'جاري الحفظ أوفلاين...' : isSavedOffline ? 'محفوظ أوفلاين (إزالة)' : 'حفظ للقراءة دون إنترنت (Offline)'}</span>
                  </div>
                  {isSavingOffline ? (
                    <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                  ) : isSavedOffline ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : null}
                </button>

                {/* 2. Full TXT download */}
                <button
                  type="button"
                  onClick={() => handleExport('txt')}
                  disabled={isExporting}
                  className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-right cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FileDown className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>تحميل متن الكتاب (TXT)</span>
                  </div>
                  {isExporting ? <Loader2 className="w-3 h-3 animate-spin text-emerald-500" /> : null}
                </button>

                {/* 3. JSON download */}
                <button
                  type="button"
                  onClick={() => handleExport('json')}
                  disabled={isExporting}
                  className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-right cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <BookCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>بيانات وفهرس (JSON)</span>
                  </div>
                </button>

                {/* 4. PDF download */}
                {isPdfAvailable && (
                  <button
                    type="button"
                    onClick={handleOpenOrDownloadPdf}
                    disabled={loadingPdf}
                    className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-right cursor-pointer text-rose-600 dark:text-rose-400"
                  >
                    <div className="flex items-center gap-2">
                      <FileDown className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>تحميل النسخة المصورة (PDF)</span>
                    </div>
                    {loadingPdf ? (
                      <Loader2 className="w-3 h-3 animate-spin text-rose-500" />
                    ) : (
                      <span className="text-[10px] font-bold px-1 rounded bg-rose-500/10 border border-rose-500/20 font-mono">PDF</span>
                    )}
                  </button>
                )}

                {isExporting && exportProgressText && (
                  <p className="text-[10px] text-muted-foreground px-2 py-1 mt-1 border-t border-slate-100 dark:border-white/10 animate-pulse">
                    {exportProgressText}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Info Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenBookInfo(book);
            }}
            className={`p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-muted-foreground transition-all flex items-center justify-center cursor-pointer ${getInfoButtonClass()}`}
            title="معلومات وتفاصيل الكتاب"
          >
            <Info className="w-3.5 h-3.5" />
          </button>

          {/* Favorite Button */}
          {onToggleFavorite && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(book);
              }}
              className={`p-1.5 rounded-lg border transition-all flex items-center justify-center active:scale-90 cursor-pointer ${isFavorite
                ? 'border-rose-500/30 text-rose-500 bg-rose-500/10'
                : 'border-slate-200 dark:border-white/10 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10'
                }`}
              title={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current text-rose-500' : ''}`} />
            </button>
          )}

          {/* Delete Offline Button */}
          {onDeleteOffline && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteOffline(book);
              }}
              className="p-1.5 rounded-lg border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/50 transition-colors cursor-pointer active:scale-95"
              title="حذف الكتاب من المحمّلات المحلية"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Left CTA: قراءة الكتاب */}
        <div className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-primary group-hover:underline">
          <span>قراءة الكتاب</span>
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
}

export default BookCard;
