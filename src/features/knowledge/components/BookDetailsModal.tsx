import React from 'react';
import { X, BookOpen, ArrowLeft, Loader2 } from 'lucide-react';
import { BookMeta } from '../types/bookTypes';

interface BookDetailsModalProps {
  book: BookMeta | null;
  onClose: () => void;
  loadingInfo: boolean;
  modalInfoText: string | null;
  modalInfoLongText?: string | null;
  onReadBook: (book: BookMeta) => void;
  onAskBook?: (book: any) => void;
}

export default function BookDetailsModal({
  book,
  onClose,
  loadingInfo,
  modalInfoText,
  modalInfoLongText,
  onReadBook,
}: BookDetailsModalProps) {
  if (!book) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg sm:max-w-xl bg-white dark:bg-[#121624] rounded-2xl border border-slate-200/90 dark:border-white/10 p-4 sm:p-5 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Book Icon + Title + Category + Close Button */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                {book.title}
              </h3>
              <div className="flex items-center gap-1.5 flex-wrap mt-1 text-[11px]">
                {book.category && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/20">
                    {book.category}
                  </span>
                )}
                {book.century_name && book.century_name !== 'غير محدد' && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold border border-amber-500/20">
                    {book.century_name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100 dark:bg-white/10 my-3" />

        {/* Content Body: Direct on modal surface with full width */}
        <div className="max-h-[62vh] overflow-y-auto px-0.5 text-slate-900 dark:text-slate-100 font-scheherazade">
          {loadingInfo ? (
            <div className="flex flex-col items-center justify-center gap-2.5 py-10 text-primary font-bold">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs sm:text-sm font-sans">جاري جلب تفاصيل وبطاقة الكتاب المطبوع...</span>
            </div>
          ) : (
            <div className="space-y-3.5">
              {(() => {
                const hasInfo = !!(modalInfoText && modalInfoText.trim());
                const hasLong = !!(modalInfoLongText && modalInfoLongText.trim());

                if (!hasInfo && !hasLong) {
                  return (
                    <div className="text-base sm:text-lg text-slate-500 dark:text-slate-400 py-4 text-center">
                      لم تتوفر تفاصيل إضافية لهذا الكتاب حالياً.
                    </div>
                  );
                }

                const lines = hasInfo
                  ? modalInfoText!
                      .split('\n')
                      .map((l) => l.trim())
                      .filter(Boolean)
                  : [];

                return (
                  <div>
                    {/* 1. Printed Book Metadata (بطاقة الكتاب المطبوع) */}
                    {hasInfo && (
                      <div className="space-y-1.5 text-[15px] sm:text-[16px] leading-[1.8] text-slate-900 dark:text-slate-100 font-medium text-right">
                        {lines.map((line, idx) => {
                          const match = line.match(/^([^:：]{2,25})[:：]\s*(.*)$/);
                          if (match) {
                            const [, key, value] = match;
                            return (
                              <div key={idx} className="leading-[1.8] flex items-baseline gap-1.5">
                                <span className="font-bold text-slate-950 dark:text-white shrink-0">
                                  {key} :
                                </span>
                                <span className="text-slate-800 dark:text-slate-200 font-normal">
                                  {value}
                                </span>
                              </div>
                            );
                          }

                          const isBracketed = line.startsWith('[') && line.endsWith(']');
                          return (
                            <div
                              key={idx}
                              className={`font-normal leading-[1.8] ${
                                isBracketed
                                  ? 'text-slate-600 dark:text-slate-400 pt-1 text-[14px] sm:text-[15px] font-bold'
                                  : 'text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              {line}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* 2. Detailed Book Commentary / Description */}
                    {hasLong && (
                      <div className={hasInfo ? 'mt-4 pt-4 border-t border-slate-100 dark:border-white/10' : ''}>
                        <div className="space-y-2.5 text-[15px] sm:text-[16px] leading-[2.0] text-slate-800 dark:text-slate-200 font-normal text-right">
                          {modalInfoLongText!
                            .split(/\n\s*\n/)
                            .map((para) => para.trim())
                            .filter(Boolean)
                            .map((para, pIdx) => {
                              const isBracketed = para.startsWith('[') && para.endsWith(']');
                              if (isBracketed) {
                                return (
                                  <div
                                    key={pIdx}
                                    className="text-center font-bold text-slate-950 dark:text-white py-1 text-[16px] sm:text-[17px]"
                                  >
                                    {para}
                                  </div>
                                );
                              }
                              return (
                                <p key={pIdx} className="leading-[2.0] text-justify">
                                  {para}
                                </p>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
          <button
            onClick={() => {
              onClose();
              onReadBook(book);
            }}
            className="w-full py-2.5 sm:py-3 px-5 rounded-xl brand-gradient text-white font-bold text-xs sm:text-sm hover:opacity-95 hover:-translate-y-0.5 transition-all duration-300 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 flex items-center justify-center gap-2.5 active:scale-[0.98] group cursor-pointer"
            title="فتح الكتاب والتصفح في القارئ"
          >
            <BookOpen className="w-4 h-4 shrink-0 opacity-90 group-hover:scale-110 transition-transform duration-200" />
            <span>تصفح وقراءة الكتاب</span>
            <ArrowLeft className="w-4 h-4 shrink-0 group-hover:-translate-x-1 transition-transform duration-200" />
          </button>
        </div>
      </div>
    </div>
  );
}
