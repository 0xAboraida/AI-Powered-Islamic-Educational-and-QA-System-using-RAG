import React, { useEffect, useState } from 'react';
import { User, Calendar, BookOpen, X, Sparkles, Award, Loader2, Library, BookMarked, Quote, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export interface AuthorBiographyModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookId?: number | string;
  authorId?: number | string;
  authorName?: string;
  bookTitle?: string;
  authorBioText?: string;
  onOpenBook?: (bookId: number | string, bookName?: string) => void;
  onAskZadAboutAuthor?: (authorName: string) => void;
}

export interface AuthorDetails {
  id?: number;
  name?: string;
  death?: string;
  biography?: string;
  info?: string;
}

export interface AuthorBook {
  book_id: number;
  name: string;
  cat_name?: string;
}

export function AuthorBiographyModal({
  isOpen,
  onClose,
  bookId,
  authorId: initialAuthorId,
  authorName: initialAuthorName,
  bookTitle,
  authorBioText,
  onOpenBook,
  onAskZadAboutAuthor,
}: AuthorBiographyModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [author, setAuthor] = useState<AuthorDetails | null>(null);
  const [authorBooks, setAuthorBooks] = useState<AuthorBook[]>([]);
  const [expandedBookId, setExpandedBookId] = useState<number | null>(null);
  const [bookInfos, setBookInfos] = useState<Record<number, any>>({});
  const [loadingBookInfo, setLoadingBookInfo] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFetchBookInfo = async (bookId: number) => {
    if (expandedBookId === bookId) {
      setExpandedBookId(null);
      return;
    }
    setExpandedBookId(bookId);
    if (bookInfos[bookId]) return; // already fetched

    setLoadingBookInfo(bookId);
    try {
      const baseUrl = import.meta.env.VITE_DATA_INGESTION_URL || 'https://abourida-zad-tutor-engine-space.hf.space';
      const res = await fetch(`${baseUrl}/api/v1/data-ingestion/zad-book-info/${bookId}`);
      if (res.ok) {
        const data = await res.json();
        setBookInfos(prev => ({ ...prev, [bookId]: data?.meta?.info || 'عذراً، لم نتمكن من جلب معلومات الكتاب.' }));
      } else {
        setBookInfos(prev => ({ ...prev, [bookId]: 'عذراً، لم نتمكن من جلب معلومات الكتاب.' }));
      }
    } catch (err) {
      console.error("Error fetching book info:", err);
      setBookInfos(prev => ({ ...prev, [bookId]: 'حدث خطأ أثناء الاتصال بالخادم.' }));
    } finally {
      setLoadingBookInfo(null);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchAuthorData = async () => {
      setLoading(true);
      setError(null);
      try {
        const baseUrl = import.meta.env.VITE_DATA_INGESTION_URL || 'https://abourida-zad-tutor-engine-space.hf.space';
        const assistantUrl = import.meta.env.VITE_READING_ASSISTANT_URL || 'https://abourida-zad-tutor-engine-space.hf.space';
        let targetAuthorId = initialAuthorId;

        // 1. Check if we already have the bio text
        let bioFound = false;
        let authorDataResult: AuthorDetails | null = null;
        
        if (authorBioText) {
          bioFound = true;
          authorDataResult = {
            id: (targetAuthorId as number) || 0,
            name: initialAuthorName || 'ترجمة العالم',
            biography: authorBioText,
            info: authorBioText
          };
        }

        // 2. Resolve authorId if missing using book info
        if (!bioFound && !targetAuthorId && bookId) {
          try {
            const bookRes = await fetch(`${baseUrl}/api/v1/data-ingestion/zad-book-info/${bookId}`);
            if (bookRes.ok) {
              const bookData = await bookRes.json();
              targetAuthorId = bookData?.meta?.author_id;
            }
          } catch (e) {
            console.error('Failed to fetch book info for author resolution:', e);
          }
        }

        // 3. Try fetching from zad-author-info API by ID
        if (!bioFound && targetAuthorId) {
          try {
            const authorRes = await fetch(`${baseUrl}/api/v1/data-ingestion/zad-author-info/${targetAuthorId}`);
            if (authorRes.ok) {
              const data = await authorRes.json();
              if (data.biography && data.biography.trim().length > 10) {
                bioFound = true;
                authorDataResult = {
                  id: data.id,
                  name: data.name || initialAuthorName || 'ترجمة العالم',
                  death: data.death,
                  biography: data.biography,
                  info: data.biography
                };
              }
            }
          } catch (e) {
            console.error('Failed to fetch author by id:', e);
          }
        }

        // 3. Try searching by author name if ID didn't give biography
        if (!bioFound && initialAuthorName) {
          try {
            const searchRes = await fetch(`${baseUrl}/api/v1/data-ingestion/zad-author-info/${encodeURIComponent(initialAuthorName)}?author_name=${encodeURIComponent(initialAuthorName)}`);
            if (searchRes.ok) {
              const data = await searchRes.json();
              if (data.biography && data.biography.trim().length > 10) {
                bioFound = true;
                authorDataResult = {
                  id: data.id,
                  name: data.name || initialAuthorName,
                  death: data.death,
                  biography: data.biography,
                  info: data.biography
                };
              }
            }
          } catch (e) {
            console.error('Failed to search author by name:', e);
          }

          // 3b. Direct Turath API author fetch fallback for known IDs (e.g. 2335 for ياسر برهامي)
          if (!bioFound) {
            try {
              let directId: number | null = null;
              if (initialAuthorName.includes('برهامي')) directId = 2335;
              else if (initialAuthorName.includes('قدامة')) directId = 1756;
              else if (initialAuthorName.includes('النووي')) directId = 127;
              else if (initialAuthorName.includes('تيمية')) directId = 172;

              if (directId) {
                const directRes = await fetch(`https://api.turath.io/author?id=${directId}&ver=3`);
                if (directRes.ok) {
                  const data = await directRes.json();
                  if (data.biography && data.biography.trim().length > 10) {
                    bioFound = true;
                    authorDataResult = {
                      id: data.id,
                      name: data.name || initialAuthorName,
                      death: data.death,
                      biography: data.biography,
                      info: data.biography
                    };
                  }
                }
              }
            } catch (e) {
              console.error('Failed direct Turath fetch:', e);
            }
          }
        }

        if (bioFound && authorDataResult) {
          if (isMounted) setAuthor(authorDataResult);
          
          // Fetch books by this author
          if (authorDataResult.id) {
            try {
              const booksRes = await fetch(`${baseUrl}/api/v1/data-ingestion/zad-author-books/${authorDataResult.id}`);
              if (booksRes.ok) {
                const booksData = await booksRes.json();
                if (isMounted && booksData.books) {
                  // Ensure unique books by ID and limit to say 20 books for UI reasons
                  const uniqueBooks = Array.from(new Map(booksData.books.map((b: any) => [b.id, {
                    book_id: b.id,
                    name: b.name,
                    cat_name: b.cat_name
                  }])).values()) as AuthorBook[];
                  const topBooks = uniqueBooks.slice(0, 30);
                  setAuthorBooks(topBooks);

                }
              }
            } catch (e) {
              console.error('Failed to fetch author books:', e);
            }
          }
          return;
        }

        // 4. Zad AI Live Generation Fallback: If no pre-written biography found in Turath DB, generate using Zad AI!
        if (initialAuthorName) {
          try {
            const aiRes = await fetch(`${assistantUrl}/api/v1/reading-assistant/explain`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                book_title: bookTitle || '',
                author: initialAuthorName,
                user_message: `اكتب سيرة ذاتية ومترجمة مركزة وشاملة للعالم والمؤلف "${initialAuthorName}" تشمل: نسبه، عصره، مذهبه الفقهي، أشهر شيوخه ومصنفاته، وسنة وفاته الهجرية إن عُرفت.`
              })
            });

            if (aiRes.ok) {
              const aiData = await aiRes.json();
              if (aiData.explanation && isMounted) {
                const deathMatch = aiData.explanation.match(/(?:توفي|وفاته)\s*(?:عام|سنة)?\s*(\d{3,4})\s*هـ/);
                const extractedDeath = deathMatch ? deathMatch[1] : undefined;

                setAuthor({
                  name: initialAuthorName,
                  death: extractedDeath,
                  biography: aiData.explanation,
                  info: 'استدعاء سيرة ومذهب العالم عبر الذكاء الاصطناعي (زاد AI) ✨'
                });
                return;
              }
            }
          } catch (e) {
            console.error('Failed to generate author bio via Zad AI:', e);
          }
        }

        // Fallback
        if (isMounted) {
          setAuthor({
            name: initialAuthorName || 'المؤلف',
            biography: `المؤلف ${initialAuthorName || ''} من مراجع وأعلام التراث الإسلامي المعتمدين.`
          });
        }
      } catch (err: any) {
        console.error('Failed to load author biography:', err);
        if (isMounted) {
          setError('تعذر تحميل سيرة المؤلف. يرجى التحقق من اتصالك بالإنترنت.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAuthorData();
    return () => { isMounted = false; };
  }, [isOpen, bookId, initialAuthorId, initialAuthorName, bookTitle]);

  if (!isOpen) return null;

  const bioText = author?.biography || author?.info || '';
  const paragraphs = bioText ? bioText.split('\n\n').filter(p => p.trim()) : [];

  return (
    <div 
      dir="rtl"
      className={`fixed inset-0 z-[100] flex flex-col overflow-y-auto transition-all animate-in slide-in-from-bottom-8 duration-500 ${
        isDark ? 'bg-[#0a0514] text-white' : 'bg-[#f8f9fc] text-slate-900'
      }`}
    >
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-brand-magenta/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[20%] left-[-10%] w-[40%] h-[40%] bg-brand-blue/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Navigation Bar */}
      <div className={`sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 backdrop-blur-xl border-b shadow-sm transition-colors ${
        isDark ? 'bg-[#0a0514]/85 border-white/10 shadow-black/50' : 'bg-white/85 border-slate-200 shadow-purple-900/5'
      }`}>
        {/* Right side: Author Name & Date */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-brand-magenta via-purple-600 to-brand-blue text-white shadow-md border-2 border-white dark:border-[#120824]">
            <User className="h-5 w-5 sm:h-6 sm:w-6 opacity-90" />
          </div>
          
          <div className="flex flex-col">
            <h2 className="text-base sm:text-xl font-extrabold tracking-tight drop-shadow-sm font-display text-transparent bg-clip-text bg-gradient-to-b from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 line-clamp-1">
              {author?.name || initialAuthorName || 'ترجمة العالم'}
            </h2>
            {author?.death && (
              <div className={`flex items-center gap-1.5 text-[10px] sm:text-xs font-bold mt-0.5 ${
                isDark ? 'text-purple-300' : 'text-purple-700'
              }`}>
                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> 
                <span>سنة الوفاة: {author.death} هـ</span>
              </div>
            )}
          </div>
        </div>

        {/* Left side: Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Ask Zad Button (Desktop Full) */}
          {onAskZadAboutAuthor && (author?.name || initialAuthorName) && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onAskZadAboutAuthor(author?.name || initialAuthorName || '');
              }}
              className="group hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-magenta to-brand-blue text-white font-bold text-xs shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-4 h-4 group-hover:animate-pulse" /> 
              <span>اسأل زاد عن هذا العالم</span>
            </button>
          )}

          {/* Ask Zad Button (Mobile Icon) */}
          {onAskZadAboutAuthor && (author?.name || initialAuthorName) && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onAskZadAboutAuthor(author?.name || initialAuthorName || '');
              }}
              className="group sm:hidden flex items-center justify-center p-2.5 rounded-full bg-gradient-to-r from-brand-magenta to-brand-blue text-white font-bold shadow-md transition-all hover:scale-105 active:scale-95"
              title="اسأل زاد عن هذا العالم"
            >
              <Sparkles className="w-4 h-4 group-hover:animate-pulse" /> 
            </button>
          )}

          <button 
            onClick={onClose}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all shadow-sm border ${
              isDark ? 'bg-white/5 hover:bg-white/10 text-white border-white/10' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 shadow-slate-200/50'
            }`}
          >
            <span className="hidden sm:inline">إغلاق</span>
            <X className="w-4 h-4 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col pb-20 relative z-10 pt-8">

        {/* Content Area */}
        <div className="flex flex-col gap-8">
          {loading ? (
            <div className={`p-12 text-center rounded-3xl border shadow-sm ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-100'}`}>
              <Loader2 className="w-10 h-10 animate-spin text-brand-magenta mx-auto mb-4" />
              <p className="font-semibold text-lg opacity-70">جاري تحميل بطاقة العالم...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500 bg-red-500/10 rounded-3xl border border-red-500/20 font-semibold shadow-sm">
              <div className="bg-red-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8" />
              </div>
              {error}
            </div>
          ) : (
            <>
              {/* Biography Card */}
              <div className={`rounded-3xl p-6 sm:p-10 border shadow-sm transition-all ${
                isDark ? 'bg-white/[0.02] border-white/10' : 'bg-white border-slate-200/60 shadow-slate-200/40'
              }`}>
                <div className="flex items-center gap-3 mb-6 border-b pb-4 border-slate-200/50 dark:border-white/10">
                  <Quote className="w-6 h-6 text-brand-magenta opacity-80" />
                  <h3 className="font-bold text-xl">نبذة وسيرة</h3>
                </div>
                <div className="space-y-5 leading-[2.2] font-read text-lg md:text-xl opacity-90 text-justify">
                  {paragraphs.length > 0 ? (
                    paragraphs.map((p, idx) => (
                      <p key={idx} className="whitespace-pre-line text-slate-800 dark:text-slate-200">
                        {p}
                      </p>
                    ))
                  ) : (
                    <p className="opacity-75 font-semibold text-center py-8">
                      {bioText || 'لا تتوفر بطاقة سيرة مفصلة لهذا العالم حالياً.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Author Books Section */}
              {authorBooks.length > 0 && (
                <div className={`mt-4 p-6 sm:p-8 rounded-3xl border transition-all relative overflow-hidden ${
                  isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gradient-to-b from-purple-50/30 to-white/80 border-purple-200/50 shadow-sm'
                }`}>
                  <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="p-2.5 rounded-2xl bg-brand-magenta/10 text-brand-magenta border border-brand-magenta/20">
                      <Library className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-l from-brand-magenta to-brand-blue">
                      من مؤلفات العالم في المكتبة ({authorBooks.length})
                    </h3>
                  </div>
                  
                  <div className="flex flex-col gap-4 items-stretch max-h-[400px] overflow-y-auto custom-scrollbar pr-2 relative z-10">
                    {authorBooks.map((b) => (
                      <div
                        key={b.book_id}
                        className={`text-right rounded-2xl border transition-all duration-300 text-sm font-semibold flex flex-col shadow-sm group ${
                          isDark 
                            ? 'bg-[#120a20] border-purple-500/20 hover:border-purple-400/50 hover:shadow-purple-900/20 text-white/90' 
                            : 'bg-white border-purple-100/80 hover:border-purple-300 hover:shadow-purple-100 text-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between p-4 sm:p-5 gap-4">
                          <button 
                            className="flex-1 text-right transition-colors group-hover:text-brand-magenta outline-none"
                            onClick={() => {
                              if (onOpenBook) {
                                onOpenBook(b.book_id, b.name);
                                onClose();
                              }
                            }}
                            title="انقر لفتح الكتاب للقراءة"
                          >
                            <span className="line-clamp-2 leading-relaxed text-base sm:text-lg">{b.name}</span>
                            {b.cat_name && (
                              <span className={`block text-[11px] px-3 py-1 rounded-full mt-2.5 w-max font-bold tracking-wide ${
                                isDark ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30' : 'bg-purple-50 text-purple-700 border border-purple-100'
                              }`}>
                                {b.cat_name}
                              </span>
                            )}
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFetchBookInfo(b.book_id);
                            }}
                            className={`p-3 rounded-xl transition-all flex-shrink-0 border ${
                              expandedBookId === b.book_id 
                                ? 'bg-brand-magenta text-white border-brand-magenta shadow-md shadow-brand-magenta/30' 
                                : isDark 
                                  ? 'bg-white/5 border-white/10 hover:bg-white/15 text-white/70 hover:text-white' 
                                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                            }`}
                            title="معلومات الكتاب"
                          >
                            {expandedBookId === b.book_id ? <ChevronUp className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                          </button>
                        </div>
                        
                        <div 
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            expandedBookId === b.book_id ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                          }`}
                        >
                          <div className={`p-5 sm:p-6 border-t text-sm font-read leading-relaxed ${isDark ? 'border-white/10 bg-black/40' : 'border-slate-100 bg-slate-50/80'} rounded-b-2xl shadow-inner`}>
                            {loadingBookInfo === b.book_id ? (
                              <div className="flex items-center justify-center gap-3 py-6 text-brand-magenta">
                                <Loader2 className="w-5 h-5 animate-spin" /> 
                                <span className="font-bold text-base">جاري جلب المعلومات...</span>
                              </div>
                            ) : (
                              <div className="whitespace-pre-line opacity-95 text-slate-700 dark:text-slate-300">
                                {bookInfos[b.book_id]}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attribution Source Badge */}
              <div className={`mt-6 flex items-center gap-2 p-3.5 rounded-2xl border text-xs font-bold ${
                isDark 
                  ? 'bg-purple-950/40 border-purple-500/30 text-purple-200' 
                  : 'bg-purple-50 border-purple-200 text-purple-900'
              }`}>
                <Quote className="w-4 h-4 text-brand-magenta shrink-0" />
                <span>مصدر الترجمة والسيرة: <strong>الأعلام للزركلي / تاريخ الإسلام</strong></span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
