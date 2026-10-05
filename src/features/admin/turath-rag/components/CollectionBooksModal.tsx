import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Calendar,
  Layers,
  FileText,
  Clock,
  ExternalLink,
  Search
} from 'lucide-react';
import { IngestedBookRecord } from '../types';
import { fetchCollectionBooks } from '../turathRagApi';
import { getCollectionDetails } from '../collectionsData';

interface CollectionBooksModalProps {
  isOpen: boolean;
  onClose: () => void;
  clusterId: string;
  clusterName: string;
  collectionName: string;
}

export const CollectionBooksModal: React.FC<CollectionBooksModalProps> = ({
  isOpen,
  onClose,
  clusterId,
  clusterName,
  collectionName
}) => {
  const [books, setBooks] = useState<IngestedBookRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const collMeta = getCollectionDetails(collectionName);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchCollectionBooks(clusterId, collectionName)
      .then((data) => {
        if (isMounted) {
          setBooks(data || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error(err);
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, clusterId, collectionName]);

  if (!isOpen) return null;

  const filtered = books.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase()) ||
      String(b.book_id).includes(search)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div
        dir="rtl"
        className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-[#160628] shadow-2xl flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-5 bg-white/5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-300 border border-sky-500/30">
              <BookOpen className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  الكتب المفهرسة في مجموعة: {collMeta?.arabicName || collectionName}
                </h3>
                <span className="rounded bg-sky-500/20 px-2 py-0.5 text-xs font-mono text-sky-300 border border-sky-500/30">
                  {clusterName}
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5 font-mono">{collectionName}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/60 hover:bg-white/10 hover:text-white transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-white/5 bg-black/20 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث في الكتب المضافة بالاسم أو المؤلف..."
              className="w-full rounded-xl border border-white/10 bg-black/40 pr-10 pl-4 py-2 text-xs text-white placeholder-white/40 focus:border-sky-500 focus:outline-none"
            />
          </div>
          <span className="text-xs text-white/50 whitespace-nowrap">
            إجمالي الكتب: <strong className="text-white font-mono">{books.length}</strong>
          </span>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="py-16 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-sky-400 border-r-transparent" />
              <p className="mt-3 text-xs text-white/60">جاري قراءة سجلات الكتب المضافة...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-red-400">
              <p className="text-xs">حدث خطأ أثناء جلب السجلات: {error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-white/40">
              <BookOpen className="mx-auto h-12 w-12 text-white/20 mb-3" />
              <p className="text-sm font-semibold text-white/60">
                {books.length === 0
                  ? 'لم يتم استدخال وتضمين أي كتب في هذه المجموعة بعد'
                  : 'لم يتم العثور على كتب مطابقة للبحث'}
              </p>
              {books.length === 0 && (
                <p className="text-xs text-white/40 mt-1">
                  يمكنك استخدام زر "إضافة إلى كلاستر" في جدول الكتب أدناه لاستدخال كتاب جديد إلى هذه المجموعة.
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[11px] font-semibold text-white/60">
                    <th className="py-2.5 px-3">معرف الكتاب</th>
                    <th className="py-2.5 px-3">اسم الكتاب</th>
                    <th className="py-2.5 px-3">المصنف (المؤلف)</th>
                    <th className="py-2.5 px-3">الفقرات المفهرسة (Chunks)</th>
                    <th className="py-2.5 px-3">الصفحات</th>
                    <th className="py-2.5 px-3">تاريخ ووقت الإضافة</th>
                    <th className="py-2.5 px-3 text-center">عرض المصدر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-white/90">
                  {filtered.map((book) => (
                    <tr key={book.book_id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3 font-mono text-sky-400 font-bold">
                        #{book.book_id}
                      </td>
                      <td className="py-3 px-3 font-semibold text-white">
                        {book.title}
                      </td>
                      <td className="py-3 px-3 text-white/60">
                        {book.author || 'غير معروف'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="rounded-lg bg-sky-500/20 px-2 py-0.5 text-xs font-mono font-bold text-sky-300 border border-sky-500/30">
                          {book.chunks_count.toLocaleString()} فقرة
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-white/60">
                        {book.pages_count} ص
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-white/50">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-amber-400" />
                          <span>{book.ingested_at}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <a
                          href={`https://app.turath.io/book/${book.book_id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>تراث</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-4 bg-white/5 flex items-center justify-between">
          <span className="text-[11px] text-white/50">
            يتم تخزين المتجهات في Qdrant Cloud بضغط int8 Scalar Quantization
          </span>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition-all"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
