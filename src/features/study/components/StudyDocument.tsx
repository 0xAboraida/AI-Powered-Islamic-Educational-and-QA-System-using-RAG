import { X, BookOpen, ChevronLeft, User, Book, Library, CalendarDays, Layers, Hash, Link, Brain, ClipboardList, Loader2 } from 'lucide-react'
import type { ChunkMetadata } from '../../../contexts/StudyContext'
import { formatMarkdown } from '../utils/markdownParser'

export function StudyDocument({
  isDocumentOpen,
  documentWidth,
  setIsDocumentOpen,
  currentChunkId,
  chunkMeta,
  chunkText,
  loading,
  mindmapLoading = false,
  quizLoading = false,
  handleGenerateMindmap,
  handleGenerateQuiz,
  startResizingDocument,
  isDark = true
}: {
  isDocumentOpen: boolean
  documentWidth: number
  setIsDocumentOpen: (v: boolean) => void
  currentChunkId: string | null
  chunkMeta: ChunkMetadata | null
  chunkText: string
  loading: boolean
  mindmapLoading?: boolean
  quizLoading?: boolean
  handleGenerateMindmap: () => void
  handleGenerateQuiz: () => void
  startResizingDocument: (e: React.MouseEvent) => void
  isDark?: boolean
}) {
  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleFadeIn {
          from { opacity: 0; transform: scale(0.98) translateY(15px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
      <div
        style={{
          width: isDocumentOpen ? (documentWidth ? documentWidth : '100%') : 0,
          opacity: isDocumentOpen ? 1 : 0
        }}
        className={`flex flex-col shrink-0 overflow-hidden transition-colors bg-transparent ${isDark
          ? 'border-white/10 text-white'
          : 'border-slate-200 text-slate-900'
          } ${isDocumentOpen ? 'border-l' : 'border-transparent'}`}
      >
        <div style={{ width: documentWidth ? documentWidth : '100%' }} className="flex h-full flex-col">
          {/* Header Bar matching Chat/Sidebar/Mindmap/Quiz panels */}
          <div className={`flex items-center justify-between px-4 py-3 border-b backdrop-blur-md ${isDark ? 'border-white/10 bg-[#12041f]/70 text-white' : 'border-slate-200 bg-slate-50/90 text-slate-800'
            }`}>
            <div className="flex items-center gap-2 text-sm font-bold">
              <BookOpen size={18} className="text-sky-500 shrink-0 stroke-[2.2]" />
              <span>النص الأصلي</span>
            </div>
            <button
              onClick={() => setIsDocumentOpen(false)}
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700'
                }`}
              title="إغلاق النص الأصلي"
            >
              <X size={15} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {!currentChunkId ? (
              <div className={`flex flex-col items-center justify-center rounded-3xl border p-12 text-center backdrop-blur-md shadow-xl mt-10 ${isDark ? 'border-white/10 bg-gradient-to-b from-white/5 to-transparent' : 'border-slate-200 bg-slate-50'
                }`}>
                <div className={`mb-6 flex h-28 w-28 items-center justify-center rounded-full relative border ${isDark ? 'bg-white/5 border-white/10 shadow-[0_0_50px_rgba(56,189,248,0.15)]' : 'bg-sky-50 border-sky-100 shadow-md'
                  }`}>
                  <BookOpen size={56} className="text-[#38bdf8] opacity-80 drop-shadow-md" />
                  <div className="absolute inset-0 bg-[#38bdf8]/10 blur-xl rounded-full"></div>
                </div>
                <h3 className={`mb-3 font-display text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>ابدأ رحلة التعلم</h3>
                <p className={`max-w-md text-[15px] leading-relaxed ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                  يرجى اختيار درس من الفهرس الجانبي لعرض النص الأساسي، وتوليد الخرائط الذهنية، والبدء في التفاعل مع زاد .
                </p>
              </div>
            ) : (
              <>
                {chunkMeta && (
                  <div className={`group mb-8 flex flex-col items-center justify-center rounded-3xl border-2 p-8 text-center backdrop-blur-md opacity-0 animate-[scaleFadeIn_0.5s_ease-out_forwards] transition-all duration-500 hover:-translate-y-1 ${isDark ? 'border-white/10 bg-white/[0.04] hover:border-white/20 hover:shadow-[0_8px_30px_rgba(138,23,201,0.15)] shadow-xl' : 'border-[#38bdf8]/50 bg-white/95 hover:border-[#38bdf8]/80 hover:shadow-2xl shadow-xl shadow-[#38bdf8]/15 ring-1 ring-[#38bdf8]/25'
                    }`}>
                    <div className="flex flex-col items-center justify-center mb-6 mt-2 relative">
                      <h3 className="font-display text-[38px] font-bold gradient-border bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(138,23,201,0.4)] pb-1 leading-tight text-center relative z-10 px-4">
                        {chunkMeta.book_title || 'اسم الكتاب غير متوفر'}
                      </h3>
                    </div>

                    {chunkMeta.hierarchy && (chunkMeta.hierarchy.kitab || (chunkMeta.hierarchy.sections && chunkMeta.hierarchy.sections.length > 0)) && (
                      <div className="mb-8 flex flex-col items-center justify-center text-center gap-2">
                        {(() => {
                          const levels = [
                            ...(chunkMeta.hierarchy.kitab ? [chunkMeta.hierarchy.kitab] : []),
                            ...(chunkMeta.hierarchy.sections || [])
                          ]
                          const parents = levels.slice(0, -1)
                          const current = levels[levels.length - 1]

                          return (
                            <>
                              {parents.length > 0 && (
                                <div className={`flex flex-wrap items-center justify-center gap-1.5 text-[13.5px] font-medium ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                                  {parents.map((level, idx) => (
                                    <div key={idx} className="flex items-center gap-1.5">
                                      <span className={`rounded-lg px-3 py-1.5 shadow-sm transition-colors cursor-default ${isDark ? 'bg-white/5 hover:bg-white/10 text-white/90' : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-800'}`}>
                                        {level}
                                      </span>
                                      {idx < parents.length - 1 && <ChevronLeft size={12} className="opacity-40 mx-0.5" />}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {current && (
                                <div className="mt-2 flex items-start justify-center gap-2.5 max-w-3xl mx-auto">
                                  <ChevronLeft size={18} className="text-[#38bdf8]/60 mt-2.5 shrink-0" strokeWidth={2.5} />
                                  <div className="px-4 text-[15px] font-bold text-[#38bdf8] leading-relaxed bg-[#38bdf8]/5 border border-[#38bdf8]/10 py-2 rounded-xl shadow-sm text-right">
                                    {current}
                                  </div>
                                </div>
                              )}
                            </>
                          )
                        })()}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                      {chunkMeta.author && (
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#f43f5e]/25 bg-[#f43f5e]/10 px-4 py-2 text-[13px] font-semibold text-[#f43f5e] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:shadow-[#f43f5e]/20 cursor-default opacity-0 animate-[fadeInUp_0.5s_ease-out_forwards]"
                          style={{ animationDelay: '0.1s' }}
                        >
                          <User size={14} />
                          المؤلف: {chunkMeta.author}{chunkMeta.author_death ? ` (${chunkMeta.author_death})` : ''}
                        </span>
                      )}
                      {(chunkMeta.domain || (chunkMeta as any).category) && (
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#38bdf8]/25 bg-[#38bdf8]/10 px-4 py-2 text-[13px] font-semibold text-[#38bdf8] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:shadow-[#38bdf8]/20 cursor-default opacity-0 animate-[fadeInUp_0.5s_ease-out_forwards]"
                          style={{ animationDelay: '0.2s' }}
                        >
                          <Book size={14} />
                          المجال: {chunkMeta.domain || (chunkMeta as any).category}
                        </span>
                      )}
                      {chunkMeta.madhhab && (
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#10b981]/25 bg-[#10b981]/10 px-4 py-2 text-[13px] font-semibold text-[#10b981] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:shadow-[#10b981]/20 cursor-default opacity-0 animate-[fadeInUp_0.5s_ease-out_forwards]"
                          style={{ animationDelay: '0.3s' }}
                        >
                          <Library size={14} />
                          المذهب: {chunkMeta.madhhab}
                        </span>
                      )}
                      {chunkMeta.hijri_century && (
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#f59e0b]/25 bg-[#f59e0b]/10 px-4 py-2 text-[13px] font-semibold text-[#f59e0b] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:shadow-[#f59e0b]/20 cursor-default opacity-0 animate-[fadeInUp_0.5s_ease-out_forwards]"
                          style={{ animationDelay: '0.4s' }}
                        >
                          <CalendarDays size={14} />
                          القرن: {chunkMeta.hijri_century}
                        </span>
                      )}
                      {(chunkMeta.part !== undefined && chunkMeta.part !== null || chunkMeta.total_parts !== undefined && chunkMeta.total_parts !== null) && (
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#14b8a6]/25 bg-[#14b8a6]/10 px-4 py-2 text-[13px] font-semibold text-[#14b8a6] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:shadow-[#14b8a6]/20 cursor-default opacity-0 animate-[fadeInUp_0.5s_ease-out_forwards]"
                          style={{ animationDelay: '0.5s' }}
                        >
                          <Layers size={14} />
                          الجزء: {chunkMeta.part || '-'}{chunkMeta.total_parts ? ` / ${chunkMeta.total_parts}` : ''}
                        </span>
                      )}
                      {chunkMeta.page_id && (
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#ec4899]/25 bg-[#ec4899]/10 px-4 py-2 text-[13px] font-semibold text-[#ec4899] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:shadow-[#ec4899]/20 cursor-default opacity-0 animate-[fadeInUp_0.5s_ease-out_forwards]"
                          style={{ animationDelay: '0.6s' }}
                        >
                          <Hash size={14} />
                          الصفحة: {chunkMeta.page_id}
                        </span>
                      )}
                      {chunkMeta.source_url && (
                        <a
                          href={chunkMeta.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/25 bg-blue-500/10 px-4 py-2 text-[13px] font-semibold text-blue-400 hover:bg-blue-500/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:shadow-blue-500/20 shadow-sm opacity-0 animate-[fadeInUp_0.5s_ease-out_forwards]"
                          style={{ animationDelay: '0.7s' }}
                        >
                          <Link size={14} />
                          رابط المصدر
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-10 mb-6 flex items-center gap-4 w-full px-2">
                  <div className={`h-px flex-1 bg-gradient-to-l from-transparent ${isDark ? 'via-[#38bdf8]/40' : 'via-sky-500/60'} to-transparent`}></div>
                  <div className={`group flex items-center gap-3 px-6 py-2.5 rounded-full backdrop-blur-md relative overflow-hidden transition-all ${isDark 
                    ? 'bg-[#38bdf8]/10 border border-[#38bdf8]/25 shadow-[0_0_20px_rgba(56,189,248,0.15)] hover:bg-[#38bdf8]/15 hover:shadow-[0_0_25px_rgba(56,189,248,0.25)]' 
                    : 'bg-sky-100 border border-sky-300 shadow-md hover:bg-sky-200 hover:shadow-lg'}`}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <BookOpen size={18} className={isDark ? 'text-[#38bdf8]' : 'text-sky-700'} />
                    <span className={`font-bold text-[16px] tracking-wide ${isDark ? 'text-[#38bdf8]' : 'text-sky-800'}`}>النص الأساسي للدرس</span>
                  </div>
                  <div className={`h-px flex-1 bg-gradient-to-r from-transparent ${isDark ? 'via-[#38bdf8]/40' : 'via-sky-500/60'} to-transparent`}></div>
                </div>

                <div
                  data-selectable="true"
                  data-library-content="true"
                  className={`rounded-3xl border-2 p-8 text-[18px] leading-[1.9] font-serif tracking-wide relative overflow-hidden backdrop-blur-md transition-all ${isDark
                    ? 'border-white/10 bg-white/[0.04] text-white/90 shadow-xl'
                    : 'border-[#38bdf8]/50 bg-white text-slate-900 shadow-xl shadow-[#38bdf8]/15 ring-1 ring-[#38bdf8]/25 font-sans'
                    }`}
                  dangerouslySetInnerHTML={formatMarkdown(chunkText, true, isDark)}
                />
              </>
            )}

            <div className="mt-12 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleGenerateMindmap}
                disabled={!currentChunkId || mindmapLoading || loading}
                className={`group relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl border p-6 transition-all duration-300 ${(!currentChunkId || mindmapLoading || loading) ? 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed' : 'bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-500/10 hover:-translate-y-1 shadow-lg'}`}
              >
                <div className={`rounded-full p-3.5 transition-all duration-300 ${(!currentChunkId || mindmapLoading || loading) ? 'bg-white/5 text-white/20' : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/20 group-hover:shadow-purple-500/40'}`}>
                  {mindmapLoading || loading ? <Loader2 size={24} className="animate-spin text-purple-300" /> : <Brain size={24} className={currentChunkId ? "group-hover:scale-110 transition-transform duration-300" : ""} />}
                </div>
                <div className="text-center">
                  <h4 className={`font-bold text-[16px] mb-1.5 ${!currentChunkId ? 'text-white/30' : isDark ? 'text-purple-200 group-hover:text-white' : 'text-purple-800'}`}>
                    {mindmapLoading ? 'جاري إنشاء الخريطة...' : 'خريطة ذهنية'}
                  </h4>
                  <p className={`text-[13px] ${!currentChunkId ? 'text-white/20' : isDark ? 'text-purple-200/60' : 'text-purple-600'}`}>
                    {mindmapLoading ? 'جاري التحليل واستخراج المفاهيم' : 'إنشاء خريطة ذهنية لهذا الدرس'}
                  </p>
                </div>
              </button>

              <button
                onClick={handleGenerateQuiz}
                disabled={!currentChunkId || quizLoading || loading}
                className={`group relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl border p-6 transition-all duration-300 ${(!currentChunkId || quizLoading || loading) ? 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed' : 'bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-500/10 hover:-translate-y-1 shadow-lg'}`}
              >
                <div className={`rounded-full p-3.5 transition-all duration-300 ${(!currentChunkId || quizLoading || loading) ? 'bg-white/5 text-white/20' : 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md shadow-blue-500/20 group-hover:shadow-blue-500/40'}`}>
                  {quizLoading || loading ? <Loader2 size={24} className="animate-spin text-emerald-300" /> : <ClipboardList size={24} className={currentChunkId ? "group-hover:scale-110 transition-transform duration-300" : ""} />}
                </div>
                <div className="text-center">
                  <h4 className={`font-bold text-[16px] mb-1.5 ${!currentChunkId ? 'text-white/30' : isDark ? 'text-blue-200 group-hover:text-white' : 'text-blue-800'}`}>
                    {quizLoading ? 'جاري فتح الإعدادات...' : 'تخصيص وإعداد اختبار'}
                  </h4>
                  <p className={`text-[13px] ${!currentChunkId ? 'text-white/20' : isDark ? 'text-blue-200/60' : 'text-blue-600'}`}>
                    {quizLoading ? 'جاري توجيهك لشاشة الاختبار' : 'ضبط الوقت، الصعوبة، وإنشاء الاختبار'}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
