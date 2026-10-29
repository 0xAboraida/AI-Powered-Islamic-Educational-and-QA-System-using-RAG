import React, { useEffect } from 'react';
import {
  ArrowRight,
  ChevronLeft,
  Calendar,
  Award,
  BookOpen,
  Info,
  Loader2
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { TurathNarratorDetail, TurathNarratorItem } from '../../../api/turathApi';

interface NarratorDetailViewProps {
  narrator: TurathNarratorDetail | null;
  narratorBasicInfo?: TurathNarratorItem | null;
  loading: boolean;
  onBack: () => void;
  onOpenBook?: (book: any, page?: number) => void;
  publishedBooks?: any[];
  onOpenBookInfo?: (book: any) => void;
}

export default function NarratorDetailView({
  narrator,
  narratorBasicInfo,
  loading,
  onBack,
  onOpenBook,
  publishedBooks = [],
  onOpenBookInfo,
}: NarratorDetailViewProps) {
  const { accentColor, isDark } = useTheme();

  // Scroll to top when view opens
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Keyboard shortcut to go back (Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  const displayName = narrator?.name || narratorBasicInfo?.name || 'تفاصيل الراوي';
  const displayFullName = narrator?.full_name || narratorBasicInfo?.full_name || displayName;
  const displayRank = narrator?.rank || narratorBasicInfo?.rank || null;
  const displayDeath = narrator?.death_text || (narratorBasicInfo?.death ? `${narratorBasicInfo.death} هـ` : null);

  const getThemeAccentText = () => {
    switch (accentColor) {
      case 'emerald': return 'text-teal-600 dark:text-teal-400';
      case 'amber': return 'text-[#b88d46] dark:text-[#dfbf83]';
      case 'blue': return 'text-blue-600 dark:text-blue-400';
      case 'purple':
      default: return 'text-brand-magenta dark:text-purple-400';
    }
  };

  const getThemeIconColor = () => {
    switch (accentColor) {
      case 'emerald': return 'text-teal-500 dark:text-teal-400';
      case 'amber': return 'text-[#b88d46] dark:text-[#dfbf83]';
      case 'blue': return 'text-blue-500 dark:text-blue-400';
      case 'purple':
      default: return 'text-brand-magenta dark:text-purple-400';
    }
  };

  const getThemeSpinnerColor = () => {
    switch (accentColor) {
      case 'emerald': return 'text-teal-500';
      case 'amber': return 'text-amber-500';
      case 'blue': return 'text-blue-500';
      case 'purple':
      default: return 'text-brand-magenta';
    }
  };

  const getThemeHoverBorder = () => {
    switch (accentColor) {
      case 'emerald': return 'hover:border-teal-500/40';
      case 'amber': return 'hover:border-[#dfbf83]/50';
      case 'blue': return 'hover:border-blue-500/40';
      case 'purple':
      default: return 'hover:border-purple-500/40';
    }
  };

  const getRankBadgeStyle = (rank?: string | null) => {
    const r = (rank || '').toLowerCase();
    if (r.includes('صحابي')) {
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
    }
    if (r.includes('ثقة') || r.includes('إمام') || r.includes('حافظ') || r.includes('حجة')) {
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
    }
    if (r.includes('صدوق') || r.includes('مقبول') || r.includes('لا بأس')) {
      return 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30';
    }
    if (r.includes('متروك') || r.includes('ضعيف') || r.includes('كذاب') || r.includes('وضاع')) {
      return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30';
    }
    return 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30';
  };

  const getBookFromCitation = (rawCitation?: string, stObj?: any) => {
    const raw = String(rawCitation || stObj?.citation || '').trim();
    if (!raw) return null;

    let bookTitle = raw;
    let page: number | undefined;

    // Pattern matching: "Book Title (vol/ page)" or "Book Title (page)"
    const match = raw.match(/^(.*?)(?:\s*[\(\[]\s*(?:(\d+)\s*[\/:]\s*)?(\d+)\s*[\)\]])\s*$/);
    if (match) {
      bookTitle = match[1].trim();
      page = match[3] ? parseInt(match[3], 10) : undefined;
    }

    // 1. Read EXACT book_id and page from stObj.source provided by Turath API
    const explicitBookId = stObj?.source?.book_id ?? stObj?.book_id ?? stObj?.bookId ?? (typeof stObj?.reader_path === 'string' ? Number(stObj.reader_path.match(/\/book\/(\d+)/)?.[1]) : undefined);
    const targetPage = stObj?.source?.page ?? stObj?.page ?? page ?? 1;

    // 2. Try to find book in publishedBooks by exact ID
    let foundBook: any;
    if (explicitBookId && publishedBooks.length > 0) {
      foundBook = publishedBooks.find((b: any) => Number(b.id) === Number(explicitBookId));
    }

    // 3. Fallback: only if no explicit book_id was provided by Turath, try fuzzy title match
    if (!foundBook && !explicitBookId && publishedBooks.length > 0 && bookTitle) {
      const cleanSearch = bookTitle
        .replace(/[أإآٱ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/[\u064B-\u065F]/g, '')
        .trim()
        .toLowerCase();

      foundBook = publishedBooks.find((b: any) => {
        const bTitle = String(b.title || '')
          .replace(/[أإآٱ]/g, 'ا')
          .replace(/ة/g, 'ه')
          .replace(/[\u064B-\u065F]/g, '')
          .trim()
          .toLowerCase();
        return bTitle === cleanSearch || bTitle.includes(cleanSearch) || cleanSearch.includes(bTitle);
      });
    }

    // 4. Construct book object with exact book_id and target page for TurathReader
    if (!foundBook) {
      foundBook = {
        id: explicitBookId || 0,
        title: bookTitle,
        author: 'تراث',
        savedPage: targetPage
      };
    } else {
      foundBook = {
        ...foundBook,
        savedPage: targetPage
      };
    }

    return { book: foundBook, targetPage };
  };

  /**
   * Handle citation click to navigate to the exact book & page inside Zad TurathReader
   */
  const handleCitationClick = (rawCitation?: string, stObj?: any) => {
    if (!onOpenBook) return;
    const resolved = getBookFromCitation(rawCitation, stObj);
    if (resolved) {
      onOpenBook(resolved.book, resolved.targetPage);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans" dir="rtl">
      {/* ========================================================================= */}
      {/* 1. المسار العلوي (BREADCRUMB)                                              */}
      {/* ========================================================================= */}
      <div className="pb-2 border-b border-slate-200/80 dark:border-white/10">
        <nav aria-label="مسار التصفح" className="flex items-center gap-2 text-xs sm:text-sm font-medium select-none flex-wrap">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer group"
          >
            <ArrowRight className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>الرواة</span>
          </button>
          <ChevronLeft className="w-3.5 h-3.5 shrink-0 text-stone-500 dark:text-stone-300" strokeWidth={2.5} />
          <span className="font-extrabold text-slate-900 dark:text-white max-w-[260px] sm:max-w-md truncate">
            {displayName}
          </span>
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* 2. هيدر الراوي الشامل (HERO IDENTITY BANNER)                             */}
      {/* - الاسم في الأعلى                                                        */}
      {/* - تحته الاسم كاملاً                                                      */}
      {/* - تحته: الوفاة والخلاصة                                                  */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 2. هيدر الراوي الشامل مع النبذة مدمجة (HERO & BIOGRAPHY CARD)               */}
      {/* ========================================================================= */}
      <div className="relative rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-white/10 bg-gradient-to-br from-brand-magenta/[0.04] via-white to-brand-blue/[0.03] dark:from-[#131726] dark:via-[#121624] dark:to-[#17102b] shadow-sm backdrop-blur-md overflow-hidden space-y-6">
        {/* Ambient background glows */}
        <div className="pointer-events-none absolute -left-16 -top-16 w-48 h-48 rounded-full bg-brand-magenta/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 -bottom-16 w-48 h-48 rounded-full bg-brand-blue/10 blur-3xl" />

        <div className="relative z-10 space-y-3">
          {/* الاسم أعلى حاجة */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            {displayName}
          </h1>

          {/* الاسم كاملاً تحته مباشرة */}
          {displayFullName && displayFullName !== displayName && (
            <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed max-w-4xl font-medium">
              {displayFullName}
            </p>
          )}

          {/* شريط: الوفاة و الخلاصة */}
          {(displayDeath || displayRank) && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 pt-3 mt-1 border-t border-slate-200/60 dark:border-white/10 text-xs sm:text-sm">
              {displayDeath && (
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Calendar className={`w-4 h-4 shrink-0 ${getThemeIconColor()}`} />
                  <span className="text-muted-foreground font-bold">الوفاة:</span>
                  <span className="font-semibold text-foreground">{displayDeath}</span>
                </div>
              )}

              {displayRank && (
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Award className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-muted-foreground font-bold">الخلاصة:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{displayRank}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* النبذة مدمجة داخل فريم الراوي كشطر سفلي منظم يجمع بياناته الشخصية */}
        {narrator?.summary && narrator.summary.length > 0 && (
          <div className="relative z-10 pt-5 border-t border-slate-200/60 dark:border-white/10 space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                النبذة والنسب
              </h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-white/10">
                {narrator.summary.length} بيانات
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {narrator.summary.map((item: any, i: number) => {
                const rawLabel = Array.isArray(item) ? item[0] : (item?.label || item?.key || '');
                const rawVal = Array.isArray(item) ? item[1] : (item?.value || '');
                const label = typeof rawLabel === 'object' ? JSON.stringify(rawLabel) : String(rawLabel || '');
                const value = typeof rawVal === 'object' ? (rawVal?.text || rawVal?.name || JSON.stringify(rawVal)) : String(rawVal || '');
                if (!label && !value) return null;

                return (
                  <div
                    key={i}
                    className={`rounded-xl p-3.5 bg-white/70 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5 flex flex-col justify-between gap-1 ${getThemeHoverBorder()} transition-all`}
                  >
                    {label && (
                      <div className={`text-xs font-bold ${getThemeAccentText()}`}>
                        {label}
                      </div>
                    )}
                    <span className="text-[15px] sm:text-base font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
                      {value}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. حالة التحميل (LOADING STATE)                                          */}
      {/* ========================================================================= */}
      {loading ? (
        <div className="rounded-3xl p-16 border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-[#131620]/95 shadow-md flex flex-col items-center justify-center gap-4 text-center">
          <Loader2 className={`w-10 h-10 animate-spin ${getThemeSpinnerColor()}`} />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            جارٍ استدعاء ترجمة الراوي وأقوال أئمة الجرح والتعديل من موسوعة تراث...
          </p>
          <span className="text-xs text-muted-foreground">
            يرجى الانتظار لحظات
          </span>
        </div>
      ) : !narrator ? (
        <div className="rounded-3xl p-12 border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-[#131620]/95 shadow-md text-center text-muted-foreground">
          لم يتم العثور على بيانات إضافية لهذا الراوي.
        </div>
      ) : (
        <div className="space-y-8">
          {/* ===================================================================== */}
          {/* 4. أقوال أئمة الجرح والتعديل - فريم رئيسي جامع مع ترويسة داخلية         */}
          {/* ===================================================================== */}
          {narrator.evaluations && narrator.evaluations.length > 0 && (
            <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-gradient-to-br from-brand-magenta/[0.04] via-white to-brand-blue/[0.03] dark:from-[#131726] dark:via-[#121624] dark:to-[#17102b] p-6 sm:p-8 shadow-sm backdrop-blur-md space-y-6 relative overflow-hidden">
              {/* Ambient background glows */}
              <div className="pointer-events-none absolute -left-16 -top-16 w-48 h-48 rounded-full bg-brand-magenta/10 blur-3xl" />
              <div className="pointer-events-none absolute -right-16 -bottom-16 w-48 h-48 rounded-full bg-brand-blue/10 blur-3xl" />

              {/* ترويسة الفريم المدمجة في الأعلى */}
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200/60 dark:border-white/10">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                    أقوال أئمة الجرح والتعديل
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    آراء أئمة الحديث ونقاد الرواة في ضبطه وعدالته
                  </p>
                </div>

                <span className="text-xs sm:text-[13px] font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  {narrator.evaluations.length} ناقد
                </span>
              </div>

              {/* قائمة بطاقات الأئمة داخل الفريم */}
              <div className="relative z-10 space-y-3.5">
                {narrator.evaluations.map((item: any, i: number) => {
                  const scholarName = Array.isArray(item)
                    ? String(item[0] || 'قول')
                    : (typeof item?.name === 'object' ? (item?.name?.name || 'قول') : String(item?.name || 'قول'));
                  const rawStatements = Array.isArray(item)
                    ? [{ text: item[1] }]
                    : (Array.isArray(item?.statements) ? item.statements : [{ text: String(item?.statements || '') }]);

                  return (
                    <div
                      key={i}
                      className="rounded-2xl bg-white/95 dark:bg-[#131622]/95 border border-slate-200/80 dark:border-white/10 shadow-xs hover:border-emerald-500/30 transition-all overflow-hidden"
                    >
                      {/* ترويسة الفريم الرسمية لاسم الإمام */}
                      <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-50/70 dark:bg-white/[0.03] border-b border-slate-200/60 dark:border-white/10 flex items-center justify-between gap-3">
                        <h3 className="font-extrabold text-base sm:text-[17px] text-slate-900 dark:text-white">
                          {scholarName}
                        </h3>

                        {rawStatements.length > 1 && (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                            {rawStatements.length} أقوال
                          </span>
                        )}
                      </div>

                      {/* نصوص الأقوال مباشرة داخل جسم الفريم بخط كتاب الخاص بتراث */}
                      <div className="p-4 sm:p-5 space-y-4">
                        {rawStatements.map((st: any, sIdx: number) => {
                          const text = typeof st === 'string' ? st : (st?.text ? String(st.text) : (typeof st === 'object' ? JSON.stringify(st) : String(st || '')));
                          const citation = st?.citation ? String(st.citation) : null;
                          return (
                            <div
                              key={sIdx}
                              className={`${sIdx > 0 ? 'pt-4 border-t border-slate-100 dark:border-white/5' : ''} space-y-2`}
                            >
                              <p className="font-kitab text-[1.25rem] sm:text-[1.35rem] leading-[2.2] text-slate-800 dark:text-slate-100 font-normal" lang="ar" dir="auto">
                                {text}
                              </p>

                              {/* المرجع مطابق تماماً لتراث */}
                              {citation && (
                                <div className="flex items-center justify-start pt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleCitationClick(citation, st)}
                                    className="inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors group/cite cursor-pointer"
                                    title="الانتقال إلى موضع القول في هذا الكتاب"
                                  >
                                    <BookOpen className="w-3.5 h-3.5 text-blue-500/80 group-hover/cite:text-blue-600 shrink-0" />
                                    <span className="hover:underline underline-offset-4 font-sans">
                                      {citation}
                                    </span>
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 5. فوائد وتنبيهات ملحقة - فريم جامع بترويسة داخلية                     */}
          {/* ===================================================================== */}
          {narrator.benefits && narrator.benefits.length > 0 && (
            <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-gradient-to-br from-amber-500/[0.03] via-white to-amber-500/[0.02] dark:from-[#18161f] dark:via-[#141520] dark:to-[#1c1824] p-6 sm:p-8 shadow-sm backdrop-blur-md space-y-6 relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-white/10">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                  فوائد وتنبيهات ملحقة
                </h2>
                <span className="text-xs sm:text-[13px] font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  {narrator.benefits.length} فوائد
                </span>
              </div>

              <div className="space-y-3.5">
                {narrator.benefits.map((b: any, i: number) => {
                  const benefitTitle = typeof b === 'string'
                    ? b
                    : (typeof b?.name === 'object' ? JSON.stringify(b.name) : String(b?.name || 'فائدة'));
                  const statements: any[] = typeof b === 'string'
                    ? []
                    : (Array.isArray(b?.statements) ? b.statements : (b?.statements ? [{ text: String(b.statements) }] : []));

                  return (
                    <div
                      key={i}
                      className="rounded-2xl bg-white/95 dark:bg-[#131622]/95 border border-slate-200/80 dark:border-white/10 shadow-xs hover:border-amber-500/30 transition-all overflow-hidden"
                    >
                      {/* ترويسة الفائدة */}
                      <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-amber-500/[0.04] dark:bg-white/[0.03] border-b border-slate-200/60 dark:border-white/10">
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                          {benefitTitle}
                        </h3>
                      </div>

                      {statements.length > 0 && (
                        <div className="p-4 sm:p-5 space-y-4">
                          {statements.map((st: any, sIdx: number) => {
                            const text = typeof st === 'string' ? st : (st?.text ? String(st.text) : (typeof st === 'object' ? JSON.stringify(st) : String(st || '')));
                            const citation = st?.citation ? String(st.citation) : null;
                            return (
                              <div
                                key={sIdx}
                                className={`${sIdx > 0 ? 'pt-4 border-t border-slate-100 dark:border-white/5' : ''} space-y-2`}
                              >
                                <p className="font-kitab text-[1.25rem] sm:text-[1.35rem] leading-[2.2] text-slate-800 dark:text-slate-100 font-normal" lang="ar" dir="auto">
                                  {text}
                                </p>
                                {citation && (
                                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                                    <button
                                      type="button"
                                      onClick={() => handleCitationClick(citation, st)}
                                      className="inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors group/cite cursor-pointer"
                                    >
                                      <BookOpen className="w-3.5 h-3.5 text-blue-500/80 group-hover/cite:text-blue-600 shrink-0" />
                                      <span className="hover:underline underline-offset-4 font-sans">
                                        {citation}
                                      </span>
                                    </button>

                                    {onOpenBookInfo && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const resolved = getBookFromCitation(citation, st);
                                          if (resolved?.book) {
                                            onOpenBookInfo(resolved.book);
                                          }
                                        }}
                                        className="p-1 rounded-md text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer border border-transparent hover:border-blue-200 dark:hover:border-blue-800/40"
                                        title="معلومات وتفاصيل الكتاب"
                                      >
                                        <Info className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 6. ملاحظات وتنبيهات المحققين - فريم جامع                              */}
          {/* ===================================================================== */}
          {narrator.notes && (Array.isArray(narrator.notes) ? narrator.notes.length > 0 : !!narrator.notes) && (
            <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-gradient-to-br from-blue-500/[0.03] via-white to-blue-500/[0.02] dark:from-[#131726] dark:via-[#121624] dark:to-[#141829] p-6 sm:p-8 shadow-sm backdrop-blur-md space-y-6 relative overflow-hidden">
              <div className="pb-4 border-b border-slate-200/60 dark:border-white/10">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                  ملاحظات وتنبيهات المحققين
                </h2>
              </div>

              <div className="space-y-3.5">
                {Array.isArray(narrator.notes) ? (
                  narrator.notes.map((noteItem: any, nIdx: number) => {
                    const noteText = Array.isArray(noteItem)
                      ? String(noteItem[0] || '')
                      : (typeof noteItem === 'string' ? noteItem : String(noteItem?.text || noteItem?.note || JSON.stringify(noteItem)));
                    const noteCitation = Array.isArray(noteItem) ? String(noteItem[1] || '') : (noteItem?.citation ? String(noteItem.citation) : null);

                    return (
                      <div
                        key={nIdx}
                        className="rounded-2xl p-4 sm:p-5 bg-white/95 dark:bg-[#131622]/95 border border-slate-200/80 dark:border-white/10 space-y-2.5 shadow-xs"
                      >
                        <p className="font-kitab text-[1.25rem] sm:text-[1.35rem] leading-[2.2] text-slate-800 dark:text-slate-100 whitespace-pre-line font-normal" lang="ar" dir="auto">
                          {noteText}
                        </p>
                        {noteCitation && (
                          <div className="pt-2 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-start">
                            <button
                              type="button"
                              onClick={() => handleCitationClick(noteCitation)}
                              className="inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors group/cite cursor-pointer"
                            >
                              <BookOpen className="w-3.5 h-3.5 text-blue-500/80 group-hover/cite:text-blue-600 shrink-0" />
                              <span className="hover:underline underline-offset-4 font-sans">
                                {noteCitation}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl p-4 sm:p-5 bg-white/95 dark:bg-[#131622]/95 border border-slate-200/80 dark:border-white/10 font-kitab text-[1.25rem] sm:text-[1.35rem] leading-[2.2] text-muted-foreground whitespace-pre-line font-normal shadow-xs" lang="ar" dir="auto">
                    {typeof narrator.notes === 'string' ? narrator.notes : JSON.stringify(narrator.notes)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 8. تذييل الصفحة                                                        */}
          {/* ===================================================================== */}
          <div className="pt-4 text-center border-t border-slate-200/80 dark:border-white/10">
            <span className="text-xs text-muted-foreground">
              بيانات الترجمة وأقوال الأئمة مستخرجة من موقع تراث جزاهم الله خير الجزاء
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
