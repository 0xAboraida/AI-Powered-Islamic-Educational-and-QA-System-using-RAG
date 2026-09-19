import React, { useEffect, useState } from 'react';
import { BookOpen, User, Calendar, FileText, Sparkles, ChevronDown, ChevronUp, HelpCircle, Building2 } from 'lucide-react';
import { AuthorBiographyModal } from '../../../components/common/AuthorBiographyModal';

export interface BookMeta {
  id: number | string;
  title: string;
  author: string;
}

export interface AuthorDetails {
  id?: number;
  name?: string;
  death?: string;
  biography?: string;
  info?: string;
}

export interface BookProfileData {
  title: string;
  authorName: string;
  publisher?: string;
  edition?: string;
  pages?: string | number;
  category?: string;
  authorBio?: string;
  authorDeath?: string;
  rawInfo?: string;
}

export function BookProfileCard({
  book,
  onAskQuestion,
}: {
  book: BookMeta;
  onAskQuestion: (q: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<BookProfileData | null>(null);
  const [showFullBio, setShowFullBio] = useState(false);
  const [showAuthorModal, setShowAuthorModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const baseUrl = import.meta.env.VITE_DATA_INGESTION_URL || 'https://abourida-zad-tutor-engine-space.hf.space';
        
        // 1. Fetch Book Metadata & TOC
        const bookRes = await fetch(`${baseUrl}/api/v1/data-ingestion/zad-book-info/${book.id}`);
        let bookData: any = null;
        if (bookRes.ok) {
          bookData = await bookRes.json();
        }

        const meta = bookData?.meta || {};
        const infoStr = meta.info || '';

        // Extract metadata fields using regex if available in info string
        const publisherMatch = infoStr.match(/الناشر:\s*([^\n]+)/);
        const editionMatch = infoStr.match(/الطبعة:\s*([^\n]+)/);
        const pagesMatch = infoStr.match(/عدد الصفحات:\s*([^\n]+)/);

        let authorBioStr = '';
        let authorDeathStr = '';

        // 2. Fetch Author Biography if author_id is present
        if (meta.author_id) {
          try {
            const authorRes = await fetch(`${baseUrl}/api/v1/data-ingestion/zad-author-info/${meta.author_id}`);
            if (authorRes.ok) {
              const authorData: AuthorDetails = await authorRes.json();
              authorBioStr = authorData.biography || authorData.info || '';
              authorDeathStr = authorData.death ? `${authorData.death} هـ` : '';
            }
          } catch (e) {
            console.error('Failed to fetch author info:', e);
          }
        }

        if (isMounted) {
          setProfile({
            title: meta.name || book.title,
            authorName: book.author && book.author !== 'من مراجع المنصة' ? book.author : meta.author_name || 'مؤلف غير معروف',
            publisher: publisherMatch ? publisherMatch[1].trim() : undefined,
            edition: editionMatch ? editionMatch[1].trim() : undefined,
            pages: pagesMatch ? pagesMatch[1].trim() : undefined,
            authorBio: authorBioStr || undefined,
            authorDeath: authorDeathStr || undefined,
            rawInfo: infoStr
          });
        }
      } catch (err) {
        console.error('Failed to load book profile data:', err);
        if (isMounted) {
          setProfile({
            title: book.title,
            authorName: book.author,
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProfileData();
    return () => { isMounted = false; };
  }, [book.id, book.title, book.author]);

  const suggestedQuestions = [
    `ما موضوع كتاب "${book.title}" وما أهميته العلمية؟`,
    `ما أهم المباحث والأبواب الواردة في كتاب "${book.title}"؟`,
    `حدثني عن مؤلف الكتاب ${book.author} وعصره ومذهبه الفقهي.`,
  ];

  return (
    <div dir="rtl" className="w-full max-w-3xl mx-auto my-6 rounded-3xl border border-purple-500/20 bg-card/80 p-6 md:p-8 backdrop-blur-xl shadow-xl transition-all animate-in fade-in zoom-in-95 duration-500">
      {/* Header Banner */}
      <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl brand-gradient text-white shadow-lg shadow-purple-500/20">
            <BookOpen className="h-7 w-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-magenta/10 text-brand-magenta border border-brand-magenta/20 mb-1.5">
              <Sparkles className="w-3.5 h-3.5" /> بطاقة الكتاب
            </div>
            <h3 className="font-display text-xl md:text-2xl font-bold text-foreground">
              {profile?.title || book.title}
            </h3>
            <div className="mt-1.5 flex items-center gap-2">
              <p className="flex items-center gap-2 text-sm text-muted-foreground font-semibold">
                <User className="w-4 h-4 text-brand-magenta" />
                {profile?.authorName || book.author}
                {profile?.authorDeath && (
                  <span className="text-xs px-2 py-0.5 rounded-md bg-secondary text-muted-foreground">
                    توفي {profile.authorDeath}
                  </span>
                )}
              </p>
              <button
                type="button"
                onClick={() => setShowAuthorModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-magenta/10 text-brand-magenta hover:bg-brand-magenta/20 border border-brand-magenta/30 transition-all hover:scale-105"
                title="عرض ترجمة وسيرة المؤلف الكاملة"
              >
                <span>[ترجمة المؤلف]</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="py-6 space-y-3 animate-pulse">
          <div className="h-4 bg-secondary/80 rounded w-3/4" />
          <div className="h-4 bg-secondary/60 rounded w-1/2" />
        </div>
      ) : (
        <>
          {/* Metadata Grid */}
          {(profile?.publisher || profile?.edition || profile?.pages) && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 my-5">
              {profile.publisher && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-secondary/40 border border-border/40 text-xs">
                  <Building2 className="w-4 h-4 text-brand-blue shrink-0" />
                  <div className="truncate">
                    <span className="block text-muted-foreground text-[10px]">الناشر</span>
                    <span className="font-bold text-foreground truncate">{profile.publisher}</span>
                  </div>
                </div>
              )}
              {profile.edition && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-secondary/40 border border-border/40 text-xs">
                  <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="truncate">
                    <span className="block text-muted-foreground text-[10px]">الطبعة</span>
                    <span className="font-bold text-foreground truncate">{profile.edition}</span>
                  </div>
                </div>
              )}
              {profile.pages && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-secondary/40 border border-border/40 text-xs col-span-2 md:col-span-1">
                  <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="truncate">
                    <span className="block text-muted-foreground text-[10px]">عدد الصفحات</span>
                    <span className="font-bold text-foreground truncate">{profile.pages}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Author Biography Accordion */}
          {profile?.authorBio && (
            <div className="my-4 rounded-2xl border border-border/60 bg-secondary/30 p-4 transition-all">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowFullBio(!showFullBio)}>
                <span className="text-xs font-bold text-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-brand-magenta" /> عن المؤلف وسيرته الذاتية (نقلاً عن الأعلام للزركلي)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setShowAuthorModal(true); }}
                    className="text-xs font-extrabold text-brand-magenta hover:underline"
                  >
                    فتح النافذة الكاملة
                  </button>
                  <button type="button" className="text-muted-foreground hover:text-foreground">
                    {showFullBio ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className={`mt-3 text-xs leading-relaxed text-muted-foreground transition-all duration-300 ${showFullBio ? 'line-clamp-none' : 'line-clamp-3'}`}>
                {profile.authorBio}
              </div>
            </div>
          )}

          {/* Quick Suggested Questions */}
          <div className="mt-6 pt-4 border-t border-border/50">
            <span className="text-xs font-extrabold text-foreground flex items-center gap-2 mb-3">
              <HelpCircle className="w-4 h-4 text-brand-magenta" /> أسئلة مقترحة عن هذا الكتاب:
            </span>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onAskQuestion(q)}
                  className="text-xs text-right font-medium px-3.5 py-2 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/15 hover:border-purple-500/40 text-purple-900 dark:text-purple-200 transition-all hover:scale-[1.02] active:scale-95"
                >
                  💡 {q}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Author Biography Modal */}
      <AuthorBiographyModal
        isOpen={showAuthorModal}
        onClose={() => setShowAuthorModal(false)}
        bookId={book.id}
        authorName={profile?.authorName || book.author}
        bookTitle={profile?.title || book.title}
        onAskZadAboutAuthor={(name) => {
          setShowAuthorModal(false);
          onAskQuestion(`حدثني بالتفصيل عن السيرة الذاتية والمذهب الفقهي وشيوخ ${name}`);
        }}
      />
    </div>
  );
}
