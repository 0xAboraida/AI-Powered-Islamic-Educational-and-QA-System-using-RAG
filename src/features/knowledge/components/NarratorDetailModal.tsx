import React, { useEffect } from 'react';
import {
  X,
  User,
  Calendar,
  Award,
  ShieldCheck,
  BookOpen,
  FileText,
  Sparkles,
  MapPin,
  Users,
  Quote,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { TurathNarratorDetail } from '../../../api/turathApi';

interface NarratorDetailModalProps {
  narrator: TurathNarratorDetail | null;
  isOpen: boolean;
  onClose: () => void;
  loading?: boolean;
}

export default function NarratorDetailModal({
  narrator,
  isOpen,
  onClose,
  loading = false,
}: NarratorDetailModalProps) {
  const { accentColor, isDark } = useTheme();

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getRankBadgeStyle = (rank: string) => {
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

  const getThemeHeaderGradient = () => {
    switch (accentColor) {
      case 'amber':
        return 'from-[#dfbf83]/20 via-[#b88d46]/10 to-transparent';
      case 'emerald':
        return 'from-teal-500/20 via-teal-600/10 to-transparent';
      case 'blue':
        return 'from-blue-500/20 via-blue-600/10 to-transparent';
      case 'purple':
      default:
        return 'from-brand-magenta/20 via-purple-600/10 to-transparent';
    }
  };

  const getThemeAccentClass = () => {
    switch (accentColor) {
      case 'amber': return 'text-[#b88d46] dark:text-[#dfbf83]';
      case 'emerald': return 'text-teal-600 dark:text-teal-400';
      case 'blue': return 'text-blue-600 dark:text-blue-400';
      case 'purple':
      default: return 'text-brand-magenta';
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-[#131620] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Top Header Background Gradient */}
        <div className={`absolute top-0 inset-x-0 h-36 bg-gradient-to-b ${getThemeHeaderGradient()} pointer-events-none`} />

        {/* Modal Header */}
        <div className="relative z-10 px-6 pt-6 pb-4 border-b border-slate-100 dark:border-white/5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-sm border border-amber-500/20">
              <User className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                  ترجمة راوٍ
                </span>
                {narrator?.rank && (
                  <span className={`text-[11px] font-extrabold px-3 py-0.5 rounded-full border shadow-xs ${getRankBadgeStyle(narrator.rank)}`}>
                    {narrator.rank}
                  </span>
                )}
                {narrator?.death_text && (
                  <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{narrator.death_text}</span>
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                {narrator?.name || 'تفاصيل الراوي'}
              </h2>
              {narrator?.full_name && narrator.full_name !== narrator.name && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                  {narrator.full_name}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-600 dark:text-slate-300 transition-colors shrink-0 cursor-pointer"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
              <p className="text-xs text-muted-foreground font-bold">جارٍ استدعاء ترجمة الراوي وأقوال الجرح والتعديل...</p>
            </div>
          ) : !narrator ? (
            <div className="py-12 text-center text-muted-foreground">
              لم يتم العثور على بيانات إضافية لهذا الراوي
            </div>
          ) : (
            <>
              {/* Summary Key-Value List */}
              {narrator.summary && narrator.summary.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>بيانات الترجمة والنسب</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {narrator.summary.map((item: any, i: number) => {
                      const rawLabel = Array.isArray(item) ? item[0] : (item?.label || item?.key || '');
                      const rawVal = Array.isArray(item) ? item[1] : (item?.value || '');
                      const label = typeof rawLabel === 'object' ? JSON.stringify(rawLabel) : String(rawLabel || '');
                      const value = typeof rawVal === 'object' ? (rawVal?.text || rawVal?.name || JSON.stringify(rawVal)) : String(rawVal || '');
                      if (!label && !value) return null;
                      return (
                        <div
                          key={i}
                          className="rounded-xl p-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 flex flex-col justify-center"
                        >
                          {label && <span className="text-[11px] font-bold text-muted-foreground mb-0.5">{label}</span>}
                          <span className="text-xs font-bold text-slate-900 dark:text-white leading-snug">{value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Jarh wa Ta'dil (أقوال أئمة الجرح والتعديل) */}
              {narrator.evaluations && narrator.evaluations.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>أقوال أئمة الجرح والتعديل</span>
                  </h3>
                  <div className="space-y-2.5">
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
                          className="rounded-2xl p-3.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <Quote className={`w-4 h-4 shrink-0 ${getThemeAccentClass()}`} />
                            <span className={`text-xs font-extrabold ${getThemeAccentClass()}`}>
                              {scholarName}:
                            </span>
                          </div>
                          <div className="space-y-1.5 pr-6">
                            {rawStatements.map((st: any, sIdx: number) => {
                              const text = typeof st === 'string' ? st : (st?.text ? String(st.text) : (typeof st === 'object' ? JSON.stringify(st) : String(st || '')));
                              const citation = st?.citation ? String(st.citation) : null;
                              return (
                                <div key={sIdx} className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                                  <p>{text}</p>
                                  {citation && (
                                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                                      المصدر: {citation}
                                    </span>
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

              {/* Notes (ملاحظات وتنبيهات) */}
              {narrator.notes && (Array.isArray(narrator.notes) ? narrator.notes.length > 0 : !!narrator.notes) && (
                <div className="space-y-2">
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span>تنبيهات وملاحظات</span>
                  </h3>
                  <div className="space-y-2">
                    {Array.isArray(narrator.notes) ? (
                      narrator.notes.map((noteItem: any, nIdx: number) => {
                        const noteText = Array.isArray(noteItem)
                          ? String(noteItem[0] || '')
                          : (typeof noteItem === 'string' ? noteItem : String(noteItem?.text || noteItem?.note || JSON.stringify(noteItem)));
                        const noteCitation = Array.isArray(noteItem) ? String(noteItem[1] || '') : (noteItem?.citation ? String(noteItem.citation) : null);

                        return (
                          <div
                            key={nIdx}
                            className="rounded-2xl p-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 text-xs text-slate-800 dark:text-slate-200 leading-relaxed space-y-1"
                          >
                            <p className="whitespace-pre-line">{noteText}</p>
                            {noteCitation && (
                              <span className="text-[10px] text-muted-foreground block pt-1 border-t border-slate-200/50 dark:border-white/5">
                                المصدر: {noteCitation}
                              </span>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-2xl p-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                        {typeof narrator.notes === 'string' ? narrator.notes : JSON.stringify(narrator.notes)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Benefits (فوائد ملحقة) */}
              {narrator.benefits && narrator.benefits.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>فوائد وتنبيهات ملحقة</span>
                  </h3>
                  <div className="space-y-2.5">
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
                          className="rounded-2xl p-3.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                            <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                              {benefitTitle}
                            </span>
                          </div>
                          {statements.length > 0 && (
                            <div className="space-y-1.5 pr-6">
                              {statements.map((st: any, sIdx: number) => {
                                const text = typeof st === 'string' ? st : (st?.text ? String(st.text) : (typeof st === 'object' ? JSON.stringify(st) : String(st || '')));
                                const citation = st?.citation ? String(st.citation) : null;
                                return (
                                  <div key={sIdx} className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                                    <p>{text}</p>
                                    {citation && (
                                      <span className="text-[10px] text-muted-foreground block mt-0.5">
                                        المصدر: {citation}
                                      </span>
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

            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-800 dark:text-white transition-all cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
}
