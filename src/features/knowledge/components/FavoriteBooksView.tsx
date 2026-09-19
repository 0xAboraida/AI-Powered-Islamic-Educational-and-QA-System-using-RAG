import React, { useState } from 'react';
import { 
  Heart, 
  BookOpen, 
  Search, 
  Trash2, 
  FileText, 
  MessageSquareQuote, 
  User, 
  Layers, 
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface FavoriteBooksViewProps {
  favoriteBooks: any[];
  onRead: (book: any) => void;
  onAsk: (book: any) => void;
  onRemoveFavorite: (bookId: string | number) => void;
  onBrowseLibrary: () => void;
  onOpenAuthorBio?: (book: any) => void;
}

export default function FavoriteBooksView({
  favoriteBooks,
  onRead,
  onAsk,
  onRemoveFavorite,
  onBrowseLibrary,
  onOpenAuthorBio
}: FavoriteBooksViewProps) {
  const [query, setQuery] = useState('');

  const filtered = favoriteBooks.filter(b => {
    const title = (b.title || '').toLowerCase();
    const author = (b.author || '').toLowerCase();
    const category = (b.category || '').toLowerCase();
    const q = query.toLowerCase();
    return title.includes(q) || author.includes(q) || category.includes(q);
  });

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      {/* Header Bar */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-purple-500/20 bg-white/95 dark:bg-[#14062b]/95 p-4 sm:p-6 shadow-sm backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
            <Heart className="w-5 h-5 fill-rose-500" />
          </div>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>الكتب المفضلة</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-rose-500/10 text-rose-500">
                {favoriteBooks.length}
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">
              مجموعتك الخاصة من أمهات الكتب والمراجع المحفوظة للقراءة السريعة
            </p>
          </div>
        </div>

        {/* Search */}
        {favoriteBooks.length > 0 && (
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث في مفضلتك..."
              className="w-full py-2 pr-9 pl-3 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200/80 dark:border-white/10 text-xs font-bold outline-none focus:border-brand-magenta transition-all"
            />
            <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
        )}
      </div>

      {/* Books Content */}
      {favoriteBooks.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 dark:border-purple-500/30 bg-white/50 dark:bg-[#14062b]/50 p-10 sm:p-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
            <Heart className="w-8 h-8" />
          </div>
          <h4 className="text-lg font-black text-slate-900 dark:text-white">
            قائمة المفضلة فارغة حالياً
          </h4>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            يمكنك إضافة أي كتاب إلى مفضلتك عبر النقر على رمز القلب الموجود على بطاقة الكتاب في الأقسام، المؤلفين، أو الكتب المختارة.
          </p>
          <button
            type="button"
            onClick={onBrowseLibrary}
            className="inline-flex items-center gap-2 py-2.5 px-6 rounded-xl bg-brand-magenta text-white text-xs font-bold hover:bg-brand-deep transition-all shadow-md shadow-brand-magenta/20"
          >
            <span>استعراض أقسام المكتبة</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          لا توجد نتائج مطابقة لبحثك في المفضلة.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((book) => (
            <div
              key={book.id || book.title}
              className="group relative rounded-2xl border border-slate-200/80 dark:border-purple-500/20 bg-white dark:bg-[#150628] p-5 shadow-sm hover:shadow-xl hover:border-brand-magenta/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="w-10 h-10 rounded-xl bg-brand-magenta/10 text-brand-magenta flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveFavorite(book.id || book.title)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                    title="إزالة من المفضلة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h4 className="font-extrabold text-base text-slate-900 dark:text-slate-100 group-hover:text-brand-magenta transition-colors line-clamp-2 mb-1.5">
                  {book.title}
                </h4>

                <p className="text-xs text-muted-foreground mb-3 font-semibold">
                  المؤلف: {book.author || 'غير معروف'}
                </p>

                {book.category && (
                  <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-brand-magenta/10 text-brand-magenta border border-brand-magenta/20 mb-4">
                    {book.category}
                  </span>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onRead(book)}
                  className="flex-1 py-2 px-3 rounded-xl bg-brand-magenta text-white text-xs font-bold hover:bg-brand-deep transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>قراءة الكتاب</span>
                </button>

                <button
                  type="button"
                  onClick={() => onAsk(book)}
                  className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 text-xs font-bold transition-all flex items-center gap-1"
                  title="سؤال المساعد الذكي عن هذا الكتاب"
                >
                  <MessageSquareQuote className="w-3.5 h-3.5" />
                  <span>اسأل</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
