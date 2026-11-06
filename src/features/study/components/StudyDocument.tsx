import React, { useState, useEffect, useMemo, useRef } from 'react'
import { X, BookOpen, ChevronLeft, ChevronRight, User, Book, Library, CalendarDays, Layers, Hash, Link, Bookmark } from 'lucide-react'
import type { ChunkMetadata } from '../../../contexts/StudyContext'
import { formatMarkdown, formatTurathLiveText } from '../utils/markdownParser'
import { useTheme } from '../../../contexts/ThemeContext'

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
  isDark = true,
  onPageChange
}: {
  isDocumentOpen: boolean
  documentWidth?: number
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
  onPageChange?: (direction: 'next' | 'prev') => void
}) {
  const { accentColor } = useTheme()
  const [viewMode, setViewMode] = useState<'paged' | 'continuous'>('paged')
  const [activePageIndex, setActivePageIndex] = useState<number>(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const getBadgeClass = (variant: 'primary' | 'secondary' | 'accent' | 'neutral' | 'page') => {
    if (isDark) {
      switch (accentColor) {
        case 'emerald':
          if (variant === 'primary') return 'border-teal-500/40 bg-teal-950/40 text-teal-300'
          if (variant === 'secondary') return 'border-emerald-500/35 bg-emerald-950/35 text-emerald-300'
          if (variant === 'accent') return 'border-teal-400/35 bg-teal-900/35 text-teal-200'
          if (variant === 'page') return 'border-teal-400/50 bg-teal-500/25 text-teal-100 font-bold'
          return 'border-white/10 bg-white/5 text-white/80'
        case 'amber':
          if (variant === 'primary') return 'border-[#dfbf83]/40 bg-[#291e0e]/60 text-[#edd8ae]'
          if (variant === 'secondary') return 'border-[#b88d46]/40 bg-[#1f160a]/50 text-[#dfbf83]'
          if (variant === 'accent') return 'border-[#eed9b0]/35 bg-[#3d2c14]/40 text-[#f5ebd7]'
          if (variant === 'page') return 'border-[#dfbf83]/60 bg-[#dfbf83]/25 text-white font-bold'
          return 'border-white/10 bg-white/5 text-white/80'
        case 'blue':
          if (variant === 'primary') return 'border-blue-500/40 bg-blue-950/40 text-blue-300'
          if (variant === 'secondary') return 'border-sky-500/35 bg-sky-950/35 text-sky-300'
          if (variant === 'accent') return 'border-indigo-400/35 bg-indigo-900/35 text-indigo-200'
          if (variant === 'page') return 'border-blue-400/50 bg-blue-500/25 text-blue-100 font-bold'
          return 'border-white/10 bg-white/5 text-white/80'
        case 'purple':
        default:
          if (variant === 'primary') return 'border-purple-500/40 bg-purple-950/40 text-purple-300'
          if (variant === 'secondary') return 'border-fuchsia-500/35 bg-fuchsia-950/35 text-fuchsia-300'
          if (variant === 'accent') return 'border-purple-400/35 bg-purple-900/35 text-purple-200'
          if (variant === 'page') return 'border-purple-400/50 bg-purple-500/25 text-purple-100 font-bold'
          return 'border-white/10 bg-white/5 text-white/80'
      }
    } else {
      switch (accentColor) {
        case 'emerald':
          if (variant === 'primary') return 'border-teal-300/80 bg-teal-50 text-teal-900 shadow-xs'
          if (variant === 'secondary') return 'border-emerald-300/70 bg-emerald-50 text-emerald-900 shadow-xs'
          if (variant === 'accent') return 'border-teal-200 bg-teal-50/60 text-teal-800'
          if (variant === 'page') return 'border-teal-400 bg-teal-100/90 text-teal-950 font-bold shadow-xs'
          return 'border-stone-200 bg-stone-50 text-stone-700'
        case 'amber':
          if (variant === 'primary') return 'border-[#dfbf83] bg-[#fbf8f0] text-[#5e431a] shadow-xs'
          if (variant === 'secondary') return 'border-[#ebd9b5] bg-[#f5ebd7]/50 text-[#78350f] shadow-xs'
          if (variant === 'accent') return 'border-[#dfbf83]/60 bg-[#fbf6ee] text-[#8a652a]'
          if (variant === 'page') return 'border-[#b88d46] bg-[#eed9b0]/60 text-[#422e11] font-bold shadow-xs'
          return 'border-stone-200 bg-stone-50 text-stone-700'
        case 'blue':
          if (variant === 'primary') return 'border-blue-300/80 bg-blue-50 text-blue-900 shadow-xs'
          if (variant === 'secondary') return 'border-sky-300/70 bg-sky-50 text-sky-900 shadow-xs'
          if (variant === 'accent') return 'border-blue-200 bg-blue-50/60 text-blue-800'
          if (variant === 'page') return 'border-blue-400 bg-blue-100/90 text-blue-950 font-bold shadow-xs'
          return 'border-stone-200 bg-stone-50 text-stone-700'
        case 'purple':
        default:
          if (variant === 'primary') return 'border-purple-300/80 bg-purple-50 text-purple-900 shadow-xs'
          if (variant === 'secondary') return 'border-fuchsia-300/70 bg-fuchsia-50 text-fuchsia-900 shadow-xs'
          if (variant === 'accent') return 'border-purple-200 bg-purple-50/60 text-purple-800'
          if (variant === 'page') return 'border-purple-400 bg-purple-100/90 text-purple-950 font-bold shadow-xs'
          return 'border-stone-200 bg-stone-50 text-stone-700'
      }
    }
  }

  const getBookTitleColorClass = () => {
    if (isDark) {
      switch (accentColor) {
        case 'emerald':
          return 'text-teal-200 drop-shadow-[0_2px_8px_rgba(20,184,166,0.3)]'
        case 'amber':
          return 'text-[#eed8ad] drop-shadow-[0_2px_8px_rgba(223,191,131,0.3)]'
        case 'blue':
          return 'text-sky-200 drop-shadow-[0_2px_8px_rgba(56,189,248,0.3)]'
        case 'purple':
        default:
          return 'text-purple-200 drop-shadow-[0_2px_8px_rgba(168,85,247,0.3)]'
      }
    } else {
      switch (accentColor) {
        case 'emerald':
          return 'text-teal-900 drop-shadow-xs'
        case 'amber':
          return 'text-[#78350f] drop-shadow-xs'
        case 'blue':
          return 'text-blue-900 drop-shadow-xs'
        case 'purple':
        default:
          return 'text-[#4c1d95] drop-shadow-xs'
      }
    }
  }

  const docTheme = useMemo(() => {
    switch (accentColor) {
      case 'amber':
        return {
          icon: isDark ? 'text-[#eed8ad]' : 'text-[#855e24]',
          link: isDark ? 'text-[#eed8ad] hover:text-[#f7ebd4]' : 'text-[#855e24] hover:text-[#6b471c]',
          navDivider: isDark ? 'via-[#dfbf83]/40' : 'via-[#b88d46]/45',
          navBadge: isDark
            ? 'bg-[#dfbf83]/10 border border-[#dfbf83]/30 shadow-[0_0_20px_rgba(223,191,131,0.15)] text-[#eed8ad]'
            : 'bg-[#fcf7ed] border border-[#dfbf83] text-[#6b471c] shadow-xs',
          navIcon: isDark ? 'text-[#eed8ad]' : 'text-[#855e24]',
          navText: isDark ? 'text-[#eed8ad]' : 'text-[#6b471c]',
          headerIcon: isDark ? 'text-[#eed8ad]' : 'text-[#855e24]',
          toggleActive: isDark
            ? 'bg-[#dfbf83]/20 text-[#eed8ad] border border-[#dfbf83]/35 shadow-xs'
            : 'bg-white text-[#6b471c] shadow-xs border border-[#dfbf83]/50',
          pageBtn: isDark
            ? 'bg-[#1f160a] hover:bg-[#2b1f0e] text-[#eed8ad] border-[#dfbf83]/40 shadow-[0_4px_16px_rgba(0,0,0,0.5)]'
            : 'bg-white hover:bg-[#fbf7f0] text-[#6b471c] border-[#dfbf83] shadow-[0_4px_14px_rgba(223,191,131,0.25)]',
          emptyGlow: isDark ? 'shadow-[0_0_50px_rgba(223,191,131,0.15)]' : 'bg-amber-50 border-amber-200 shadow-md',
          emptyIcon: isDark ? 'text-[#eed8ad]' : 'text-[#855e24]',
          emptyBg: isDark ? 'bg-[#dfbf83]/10' : 'bg-amber-100/40',
        }
      case 'blue':
        return {
          icon: isDark ? 'text-sky-400' : 'text-sky-600',
          link: isDark ? 'text-sky-400 hover:text-sky-300' : 'text-sky-600 hover:text-sky-700',
          navDivider: isDark ? 'via-[#38bdf8]/40' : 'via-sky-500/50',
          navBadge: isDark
            ? 'bg-[#38bdf8]/10 border border-[#38bdf8]/25 shadow-[0_0_20px_rgba(56,189,248,0.15)] text-[#38bdf8]'
            : 'bg-sky-50 border border-sky-300 text-sky-800 shadow-xs',
          navIcon: isDark ? 'text-[#38bdf8]' : 'text-sky-700',
          navText: isDark ? 'text-[#38bdf8]' : 'text-sky-800',
          headerIcon: isDark ? 'text-sky-400' : 'text-sky-600',
          toggleActive: isDark
            ? 'bg-sky-500/25 text-sky-300 border border-sky-500/35 shadow-xs'
            : 'bg-white text-sky-700 shadow-xs border border-sky-200',
          pageBtn: isDark
            ? 'bg-[#1a0733] hover:bg-white/10 text-sky-300 border-[#38bdf8]/40 shadow-[0_4px_16px_rgba(0,0,0,0.5)]'
            : 'bg-white hover:bg-sky-50 text-sky-700 border-sky-300 shadow-[0_4px_14px_rgba(56,189,248,0.2)]',
          emptyGlow: isDark ? 'shadow-[0_0_50px_rgba(56,189,248,0.15)]' : 'bg-sky-50 border-sky-100 shadow-md',
          emptyIcon: isDark ? 'text-[#38bdf8]' : 'text-sky-600',
          emptyBg: isDark ? 'bg-[#38bdf8]/10' : 'bg-sky-100/40',
        }
      case 'purple':
        return {
          icon: isDark ? 'text-purple-400' : 'text-purple-600',
          link: isDark ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700',
          navDivider: isDark ? 'via-[#c084fc]/40' : 'via-purple-500/50',
          navBadge: isDark
            ? 'bg-[#c084fc]/10 border border-[#c084fc]/25 shadow-[0_0_20px_rgba(192,132,252,0.15)] text-[#c084fc]'
            : 'bg-purple-50 border border-purple-300 text-purple-800 shadow-xs',
          navIcon: isDark ? 'text-[#c084fc]' : 'text-purple-700',
          navText: isDark ? 'text-[#c084fc]' : 'text-purple-800',
          headerIcon: isDark ? 'text-purple-400' : 'text-purple-600',
          toggleActive: isDark
            ? 'bg-purple-500/25 text-purple-300 border border-purple-500/35 shadow-xs'
            : 'bg-white text-purple-700 shadow-xs border border-purple-200',
          pageBtn: isDark
            ? 'bg-[#180a2b] hover:bg-white/10 text-purple-300 border-[#c084fc]/40 shadow-[0_4px_16px_rgba(0,0,0,0.5)]'
            : 'bg-white hover:bg-purple-50 text-purple-700 border-purple-300 shadow-[0_4px_14px_rgba(192,132,252,0.2)]',
          emptyGlow: isDark ? 'shadow-[0_0_50px_rgba(192,132,252,0.15)]' : 'bg-purple-50 border-purple-100 shadow-md',
          emptyIcon: isDark ? 'text-[#c084fc]' : 'text-purple-600',
          emptyBg: isDark ? 'bg-[#c084fc]/10' : 'bg-purple-100/40',
        }
      case 'emerald':
      default:
        return {
          icon: isDark ? 'text-teal-400' : 'text-teal-600',
          link: isDark ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700',
          navDivider: isDark ? 'via-[#2dd4bf]/40' : 'via-teal-500/50',
          navBadge: isDark
            ? 'bg-[#2dd4bf]/10 border border-[#2dd4bf]/25 shadow-[0_0_20px_rgba(45,212,191,0.15)] text-[#2dd4bf]'
            : 'bg-teal-50 border border-teal-300 text-teal-800 shadow-xs',
          navIcon: isDark ? 'text-[#2dd4bf]' : 'text-teal-700',
          navText: isDark ? 'text-[#2dd4bf]' : 'text-teal-800',
          headerIcon: isDark ? 'text-teal-400' : 'text-teal-600',
          toggleActive: isDark
            ? 'bg-teal-500/25 text-teal-300 border border-teal-500/35 shadow-xs'
            : 'bg-white text-teal-700 shadow-xs border border-teal-200',
          pageBtn: isDark
            ? 'bg-[#061e1b] hover:bg-white/10 text-teal-300 border-[#2dd4bf]/40 shadow-[0_4px_16px_rgba(0,0,0,0.5)]'
            : 'bg-white hover:bg-teal-50 text-teal-700 border-teal-300 shadow-[0_4px_14px_rgba(45,212,191,0.2)]',
          emptyGlow: isDark ? 'shadow-[0_0_50px_rgba(45,212,191,0.15)]' : 'bg-teal-50 border-teal-100 shadow-md',
          emptyIcon: isDark ? 'text-[#2dd4bf]' : 'text-teal-600',
          emptyBg: isDark ? 'bg-[#2dd4bf]/10' : 'bg-teal-100/40',
        }
    }
  }, [accentColor, isDark])

  // Reset to first page when new chunk/chapter is opened
  useEffect(() => {
    setActivePageIndex(0)
  }, [currentChunkId, chunkText])

  const isTurathBook: boolean = Boolean(
    currentChunkId?.startsWith('turath_') ||
    chunkText?.includes('TURATH_PAGE_START') ||
    chunkText?.includes('data-type="title"') ||
    chunkText?.includes('data-type=title')
  )

  const turathResult = useMemo(() => {
    if (!isTurathBook) return null
    return formatTurathLiveText(chunkText, isDark, chunkMeta?.page_id, accentColor)
  }, [chunkText, isDark, chunkMeta?.page_id, currentChunkId, accentColor])

  // When a chapter starts at the very bottom of a book page (or ends at the very top of one),
  // that page holds only a line or two. Showing it alone in paged mode looks like missing content,
  // so merge such tiny fragment pages with their neighbor.
  const pages = useMemo(() => {
    const raw = turathResult?.pages || []
    if (raw.length < 2) return raw
    const FRAGMENT_CHARS = 450
    const textLen = (html: string) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().length
    const merged = raw.map(p => ({ ...p }))
    if (merged.length >= 2 && textLen(merged[0].html) < FRAGMENT_CHARS) {
      merged[1] = { pgNum: `${merged[0].pgNum}-${merged[1].pgNum}`, html: merged[0].html + merged[1].html }
      merged.shift()
    }
    const last = merged.length - 1
    if (merged.length >= 2 && textLen(merged[last].html) < FRAGMENT_CHARS) {
      merged[last - 1] = { pgNum: `${merged[last - 1].pgNum}-${merged[last].pgNum}`, html: merged[last - 1].html + merged[last].html }
      merged.pop()
    }
    return merged
  }, [turathResult])
  const totalPages = pages.length
  const safePageIndex = Math.max(0, Math.min(activePageIndex, totalPages - 1))
  const currentPageItem = pages[safePageIndex]
  const isFirstPage = safePageIndex <= 0
  const isLastPage = safePageIndex >= totalPages - 1

  const scrollToTextStart = () => {
    setTimeout(() => {
      const el = document.getElementById('study-text-start')
      const container = scrollContainerRef.current
      if (el && container) {
        const containerTop = container.getBoundingClientRect().top
        const elTop = el.getBoundingClientRect().top
        container.scrollTo({ top: container.scrollTop + elTop - containerTop - 15, behavior: 'smooth' })
      } else {
        container?.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }, 10)
  }

  const handlePrevPage = () => {
    if (viewMode === 'paged' && totalPages > 1) {
      if (!isFirstPage) {
        setActivePageIndex(prev => prev - 1)
        scrollToTextStart()
        return
      }
    }
    if (onPageChange) {
      onPageChange('prev')
    }
  }

  const handleNextPage = () => {
    if (viewMode === 'paged' && totalPages > 1) {
      if (!isLastPage) {
        setActivePageIndex(prev => prev + 1)
        scrollToTextStart()
        return
      }
    }
    if (onPageChange) {
      onPageChange('next')
    }
  }

  // Keyboard navigation for page flipping (ArrowLeft: next, ArrowRight: prev in RTL)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase()
      if (activeTag === 'input' || activeTag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable) {
        return
      }
      if (!isDocumentOpen || !isTurathBook || viewMode !== 'paged') return

      if (e.key === 'ArrowLeft') {
        handleNextPage()
      } else if (e.key === 'ArrowRight') {
        handlePrevPage()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDocumentOpen, currentChunkId, viewMode, safePageIndex, totalPages, isFirstPage, isLastPage])

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
          <div className={`hidden md:flex items-center justify-between px-4 py-3 h-[53px] box-border border-b backdrop-blur-md ${isDark ? 'border-white/10 bg-[#12041f]/70 text-white' : 'border-slate-200 bg-slate-50/90 text-slate-800'
            }`}>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-bold">
                <BookOpen size={18} className={`${docTheme.headerIcon} shrink-0 stroke-[2.2]`} />
                <span>نص الدرس</span>
              </div>

              {/* View Mode Toggle: Paged (Single Page) vs Continuous */}
              {isTurathBook && totalPages > 1 && (
                <div className={`flex items-center p-0.5 rounded-lg border text-xs font-semibold ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('paged')
                      scrollToTextStart()
                    }}
                    className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${viewMode === 'paged'
                      ? docTheme.toggleActive
                      : isDark
                        ? 'text-white/60 hover:text-white'
                        : 'text-slate-500 hover:text-slate-800'
                      }`}
                    title="عرض صفحة واحدة والتقليب بالشريط"
                  >
                    <BookOpen size={13} />
                    <span>صفحة بصفحة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('continuous')
                      scrollToTextStart()
                    }}
                    className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${viewMode === 'continuous'
                      ? docTheme.toggleActive
                      : isDark
                        ? 'text-white/60 hover:text-white'
                        : 'text-slate-500 hover:text-slate-800'
                      }`}
                    title="عرض كل الصفحات متتابعة بتمرير مستمر"
                  >
                    <Layers size={13} />
                    <span>متتابع</span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsDocumentOpen(false)}
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700'
                }`}
              title="إغلاق نص الدرس"
            >
              <X size={15} />
            </button>
          </div>

          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-2 sm:p-5 md:p-6 study-document-scrollbar">
            {!currentChunkId ? (
              <div className={`flex flex-col items-center justify-center rounded-2xl border p-8 sm:p-12 text-center backdrop-blur-md shadow-xl mt-6 sm:mt-10 ${isDark ? 'border-white/10 bg-gradient-to-b from-white/5 to-transparent' : 'border-slate-200 bg-slate-50'
                }`}>
                <div className={`mb-4 sm:mb-6 flex h-20 w-20 sm:h-28 sm:w-28 items-center justify-center rounded-full relative border ${isDark ? `bg-white/5 border-white/10 ${docTheme.emptyGlow}` : docTheme.emptyGlow
                  }`}>
                  <BookOpen size={42} className={`${docTheme.emptyIcon} opacity-80 drop-shadow-md sm:w-14 sm:h-14`} />
                  <div className={`absolute inset-0 ${docTheme.emptyBg} blur-xl rounded-full`}></div>
                </div>
                <h3 className={`mb-2 sm:mb-3 font-display text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>ابدأ رحلة التعلم</h3>
                <p className={`max-w-md text-xs sm:text-[15px] leading-relaxed ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                  يرجى اختيار درس من الفهرس الجانبي لعرض النص الأساسي، وتوليد الخرائط الذهنية، والبدء في التفاعل مع زاد .
                </p>
              </div>
            ) : (
              <>
                {chunkMeta && (
                  <div className={`group mb-5 flex flex-col items-stretch justify-center rounded-xl border p-4 sm:p-5 md:p-6 backdrop-blur-md opacity-0 animate-[scaleFadeIn_0.5s_ease-out_forwards] transition-all duration-300 w-full max-w-full sm:max-w-3xl mx-auto shadow-md ${
                    isDark ? 'border-white/10 bg-white/[0.04]' : 'border-slate-200 bg-white/95'
                  }`} dir="rtl">
                    <div className="flex flex-col items-center justify-center mb-2.5 mt-0.5 relative w-full text-center">
                      <h3 className={`font-amiri text-2xl sm:text-3xl md:text-[34px] font-bold leading-snug text-center relative z-10 tracking-normal ${getBookTitleColorClass()}`}>
                        {chunkMeta.book_title || 'اسم الكتاب غير متوفر'}
                      </h3>
                    </div>

                    {/* Clean Right-Aligned Metadata List without Box Frames */}
                    <div className="flex flex-col items-start gap-2 w-full pt-1 text-right">
                      {(() => {
                        const levels = [
                          ...(chunkMeta.hierarchy?.kitab ? [chunkMeta.hierarchy.kitab] : []),
                          ...(chunkMeta.hierarchy?.sections || [])
                        ].filter(Boolean)
                        if (levels.length === 0) return null

                        return (
                          <div className={`flex items-center flex-wrap gap-2 text-xs sm:text-[13px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            <Bookmark size={14} className={`shrink-0 ${docTheme.icon}`} />
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span>العنوان:</span>
                              {levels.map((level, idx) => (
                                <React.Fragment key={idx}>
                                  <span className="font-bold">{level}</span>
                                  {idx < levels.length - 1 && (
                                    <ChevronLeft size={11} className="shrink-0 opacity-50" />
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        )
                      })()}
                      {chunkMeta.author && (
                        <div className={`flex items-center gap-2 text-xs sm:text-[13px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          <User size={14} className={`shrink-0 ${docTheme.icon}`} />
                          <span>المؤلف: <span className="font-bold">{chunkMeta.author}{chunkMeta.author_death ? ` (${chunkMeta.author_death})` : ''}</span></span>
                        </div>
                      )}
                      {(chunkMeta.domain || (chunkMeta as any).category) && (
                        <div className={`flex items-center gap-2 text-xs sm:text-[13px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          <Book size={14} className={`shrink-0 ${docTheme.icon}`} />
                          <span>القسم: <span className="font-bold">{chunkMeta.domain || (chunkMeta as any).category}</span></span>
                        </div>
                      )}
                      {chunkMeta.madhhab && (
                        <div className={`flex items-center gap-2 text-xs sm:text-[13px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          <Library size={14} className={`shrink-0 ${docTheme.icon}`} />
                          <span>المذهب: <span className="font-bold">{chunkMeta.madhhab}</span></span>
                        </div>
                      )}
                      {chunkMeta.hijri_century && (
                        <div className={`flex items-center gap-2 text-xs sm:text-[13px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          <CalendarDays size={14} className={`shrink-0 ${docTheme.icon}`} />
                          <span>القرن: <span className="font-bold">{chunkMeta.hijri_century}</span></span>
                        </div>
                      )}
                      {(chunkMeta.part !== undefined && chunkMeta.part !== null || chunkMeta.total_parts !== undefined && chunkMeta.total_parts !== null) && (
                        <div className={`flex items-center gap-2 text-xs sm:text-[13px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          <Layers size={14} className={`shrink-0 ${docTheme.icon}`} />
                          <span>الجزء: <span className="font-bold">{chunkMeta.part || '-'}{chunkMeta.total_parts ? ` / ${chunkMeta.total_parts}` : ''}</span></span>
                        </div>
                      )}
                      {chunkMeta.page_id && (
                        <div className={`flex items-center gap-2 text-xs sm:text-[13px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          <Hash size={14} className={`shrink-0 ${docTheme.icon}`} />
                          <span>الصفحة: <span className="font-bold">{chunkMeta.page_id}</span></span>
                        </div>
                      )}
                      {chunkMeta.source_url && (
                        <a
                          href={chunkMeta.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-2 text-xs sm:text-[13px] ${docTheme.link} hover:underline transition-colors mt-0.5`}
                        >
                          <Link size={14} className={`shrink-0 ${docTheme.icon}`} />
                          <span className="font-bold">رابط المصدر</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div id="study-text-start" className="mt-6 mb-4 flex items-center gap-3 w-full px-1">
                  <div className={`h-px flex-1 bg-gradient-to-l from-transparent ${docTheme.navDivider} to-transparent`}></div>
                  <div className={`group flex items-center gap-2.5 px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg backdrop-blur-md relative overflow-hidden transition-all ${docTheme.navBadge}`}>
                    <BookOpen size={16} className={docTheme.navIcon} />
                    <span className={`font-bold text-xs sm:text-[14px] tracking-wide ${docTheme.navText}`}>نص الدرس</span>
                  </div>
                  <div className={`h-px flex-1 bg-gradient-to-r from-transparent ${docTheme.navDivider} to-transparent`}></div>
                </div>

                <div className="relative">
                  <div
                    key={`${viewMode}-${safePageIndex}`}
                    data-selectable="true"
                    data-library-content="true"
                    className={
                      isTurathBook
                        ? `text-[17px] sm:text-[18px] leading-[1.8] font-amiri tracking-wide relative transition-all animate-[fadeInUp_0.8s_ease-out_forwards] ${isDark ? 'text-white/90' : 'text-slate-900'
                        }`
                        : `rounded-xl border p-3.5 sm:p-6 md:p-8 text-[17px] sm:text-[18px] leading-[1.8] sm:leading-[1.9] font-amiri tracking-wide relative overflow-hidden backdrop-blur-md transition-all animate-[fadeInUp_0.8s_ease-out_forwards] ${isDark
                          ? 'border-white/10 bg-white/[0.04] text-white/90 shadow-xl'
                          : 'border-slate-200 bg-white text-slate-900 shadow-xl'
                        }`
                    }
                    dangerouslySetInnerHTML={
                      isTurathBook
                        ? viewMode === 'paged' && currentPageItem
                          ? { __html: currentPageItem.html + (isLastPage ? (turathResult?.continuationNotice || '') : '') }
                          : { __html: turathResult?.__html || '' }
                        : formatMarkdown(chunkText, true, isDark)
                    }
                  />

                  {/* Turath Book Authentic Page Navigator (Floating on bottom edges) */}
                  {isTurathBook && viewMode === 'paged' && onPageChange && !chunkText?.includes('turath-empty-parent-notice') && (
                    <div className="absolute -bottom-[15px] left-0 right-0 flex items-center justify-between px-2 sm:px-5 md:px-8 pointer-events-none z-20">
                      <button
                        type="button"
                        onClick={handlePrevPage}
                        disabled={isFirstPage}
                        className={`pointer-events-auto flex items-center justify-center gap-1 rounded-full px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold transition-all border ${isFirstPage
                          ? isDark
                            ? 'opacity-35 cursor-not-allowed text-white/30 border-white/10 bg-black/40'
                            : 'opacity-40 cursor-not-allowed text-slate-400 border-slate-200 bg-slate-50'
                          : docTheme.pageBtn
                          }`}
                        title="الصفحة السابقة"
                      >
                        <ChevronRight size={13} />
                        <span>السابقة</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleNextPage}
                        disabled={isLastPage}
                        className={`pointer-events-auto flex items-center justify-center gap-1 rounded-full px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold transition-all border ${isLastPage
                          ? isDark
                            ? 'opacity-35 cursor-not-allowed text-white/30 border-white/10 bg-black/40'
                            : 'opacity-40 cursor-not-allowed text-slate-400 border-slate-200 bg-slate-50'
                          : docTheme.pageBtn
                          }`}
                        title="الصفحة التالية"
                      >
                        <span>التالية</span>
                        <ChevronLeft size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </>
  )
}
