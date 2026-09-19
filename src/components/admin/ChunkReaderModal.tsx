import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  X,
  Search,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  FileText,
  FolderTree,
  Sun,
  Moon,
  Type
} from 'lucide-react'

export interface ParentChunkItem {
  parent_id: string
  book_id: number
  title: string
  author: string
  author_death?: string
  hijri_century?: number
  domain: string
  madhhab: string
  page_id: number
  part: number
  total_parts: number
  source_url: string
  hierarchy: string[] | string
  content: string
}

interface ChunkReaderModalProps {
  bookId: number
  bookTitle: string
  authorName: string
  onClose: () => void
  apiBaseUrl?: string
}

// ── Islamic Ligatures Replacement (نفس دالة TurathReader بالضبط) ──
const replaceIslamicLigatures = (text: string): string => {
  if (!text) return ''

  const map: Record<string, string> = {
    '\ufdfa': 'صلى الله عليه وسلم',
    '\ufd40': 'رحمه الله',
    '\ufd41': 'رحمها الله',
    '\ufd42': 'رحمهم الله',
    '\ufd43': 'رضي الله عنه',
    '\ufd44': 'رضي الله عنها',
    '\ufd45': 'رضي الله عنهم',
    '\ufd46': 'رضي الله عنهن',
    '\ufd49': 'عليهما السلام',
    '\ufd4a': 'عليهم السلام',
    '\ufd4b': 'عليه السلام',
    '\ufd4c': 'رضي الله عنهما',
    '\ufd4d': 'عليهن السلام',
    '\ufdfb': 'جل جلاله',
    '\ufdfc': 'عز وجل',
    '\ufd4e': 'سبحانه وتعالى',
  }

  let newText = text
  for (const [key, value] of Object.entries(map)) {
    const styledValue = `<span class="text-brand-magenta/90 font-bold mx-0.5">- ${value} -</span>`
    newText = newText.split(`-${key}-`).join(styledValue)
    newText = newText.split(key).join(styledValue)
  }

  return newText
}

// ── تنسيق محتوى الباب ببطاقات صفحات متداخلة ومظهر فاخر ──
function renderTurathChunkHtml(content: string): string {
  if (!content) return ''
  let text = replaceIslamicLigatures(content)

  // Regex لتقسيم أجزاء الصفحات
  const pageRegex = /<span\s+data-type=["']page["']\s+data-page=["'](\d+)["'][^>]*>\[ص:\s*\d+\]<\/span>/g
  const matches: { pageNum: string; index: number; length: number }[] = []
  let match: RegExpExecArray | null

  while ((match = pageRegex.exec(text)) !== null) {
    matches.push({ pageNum: match[1], index: match.index, length: match[0].length })
  }

  if (matches.length === 0) {
    let html = text.replace(/\n?_{4,}\n?/g, '<div class="turath-page-footnote-divider"><span class="turath-footnote-label">الحواشي والتعليقات</span></div>')
    return `<div class="turath-outer-chapter-card"><div class="turath-page-card"><div class="turath-page-body">${html}</div></div></div>`
  }

  const pageCards: string[] = []
  for (let i = 0; i < matches.length; i++) {
    const pageNum = matches[i].pageNum
    const startIdx = matches[i].index + matches[i].length
    const endIdx = i + 1 < matches.length ? matches[i + 1].index : text.length

    let pageContent = text.substring(startIdx, endIdx).trim()

    // تحويل فاصل الحواشي لكل صفحة
    pageContent = pageContent.replace(
      /\n?_{4,}\n?/g,
      `<div class="turath-page-footnote-divider"><span class="turath-footnote-label">حواشي صـ ${pageNum}</span></div>`
    )

    pageCards.push(`
      <div class="turath-page-card">
        <div class="turath-page-badge">
          <span class="turath-page-badge-dot"></span>
          <span>صـ ${pageNum}</span>
        </div>
        <div class="turath-page-body">${pageContent}</div>
      </div>
    `)
  }

  return `<div class="turath-outer-chapter-card">${pageCards.join('')}</div>`
}

// ── CSS مطابق تماماً لمحرك عرض TurathReader.tsx والإطارات المتداخلة ──
const TURATH_READER_CSS = `
  .turath-content {
    white-space: pre-wrap;
    word-wrap: break-word;
    text-align: justify;
    line-height: 2.5;
  }

  /* الإطار الخارجي الكبير للباب */
  .turath-outer-chapter-card {
    border: 1.5px solid rgba(149, 11, 196, 0.25);
    background: rgba(149, 11, 196, 0.02);
    border-radius: 1.75rem;
    padding: 2rem 1.25rem 1.5rem;
    margin: 1.5rem 0;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.25);
  }

  /* إطار الصفحة الداخلي المتداخل (Nested Page Card) */
  .turath-page-card {
    position: relative;
    border: 1px solid rgba(168, 85, 247, 0.25);
    background: rgba(255, 255, 255, 0.03);
    border-radius: 1.25rem;
    padding: 2.25rem 1.5rem 1.5rem;
    margin-top: 0.5rem;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.12);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .turath-page-card:hover {
    border-color: rgba(168, 85, 247, 0.45);
    box-shadow: 0 6px 20px rgba(168, 85, 247, 0.15);
  }

  /* شارة رقم الصفحة العائمة بمنتصف الإطار العلوي */
  .turath-page-badge {
    position: absolute;
    top: -0.85rem;
    right: 1.75rem;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.78rem;
    font-family: var(--font-sans, 'Cairo', sans-serif);
    font-weight: 700;
    color: #c084fc;
    background: #160a2b;
    border: 1px solid rgba(168, 85, 247, 0.45);
    padding: 0.15rem 0.8rem;
    border-radius: 9999px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
    user-select: none;
    z-index: 10;
  }

  .turath-page-badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #a855f7;
    box-shadow: 0 0 6px #a855f7;
  }

  .turath-page-body {
    position: relative;
  }

  .turath-page-footnote-divider {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 2rem 0 1rem;
    border-top: 1px dashed rgba(168, 85, 247, 0.35);
    padding-top: 0.75rem;
  }

  .turath-footnote-label {
    font-size: 0.8em;
    font-weight: 700;
    color: var(--color-brand-magenta, #950bc4);
    opacity: 0.9;
  }

  .turath-content span[data-type="title"] {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    font-family: var(--font-display, 'Aref Ruqaa', serif);
    font-weight: 800;
    font-size: 1.8em;
    text-align: center;
    margin: 1.5rem auto 2rem;
    color: var(--color-brand-deep, #5b0e9c);
    position: relative;
    width: fit-content;
    line-height: 1.4;
    padding: 0.5rem 2rem;
    background: radial-gradient(ellipse at center, rgba(149, 11, 196, 0.08) 0%, transparent 80%);
    border-radius: 100px;
  }

  .turath-content span[data-type="title"]::before {
    content: '﴿';
    color: var(--color-brand-magenta, #950bc4);
    opacity: 0.7;
    font-weight: 400;
    font-size: 1.1em;
    transform: translateY(2px);
  }

  .turath-content span[data-type="title"]::after {
    content: '﴾';
    color: var(--color-brand-magenta, #950bc4);
    opacity: 0.7;
    font-weight: 400;
    font-size: 1.1em;
    transform: translateY(2px);
  }

  .turath-content span[data-type="title"] + span[data-type="title"] {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-family: var(--font-sans, 'Cairo', sans-serif);
    font-size: 1.2em;
    font-weight: 800;
    color: var(--color-brand-magenta, #950bc4);
    margin-top: -1.5rem;
    margin-bottom: 2rem;
    padding: 0;
    background: none;
  }

  .turath-content span[data-type="title"] + span[data-type="title"]::before,
  .turath-content span[data-type="title"] + span[data-type="title"]::after {
    content: '◆';
    font-size: 0.4em;
    opacity: 0.4;
    transform: translateY(2px);
  }

  .turath-content span[data-type="poetry"] {
    display: block;
    text-align: center;
    color: var(--color-primary, #7a17c9);
    font-style: italic;
    margin: 1.5rem 0;
    font-size: 1.1em;
  }

  /* Dark Reader Styles */
  .dark-reader .turath-outer-chapter-card {
    border-color: rgba(168, 85, 247, 0.3) !important;
    background: rgba(18, 9, 36, 0.5) !important;
  }
  .dark-reader .turath-page-card {
    border-color: rgba(168, 85, 247, 0.22) !important;
    background: rgba(255, 255, 255, 0.02) !important;
  }
  .dark-reader .turath-page-badge {
    color: #e9d5ff !important;
    background: #180d2d !important;
    border-color: rgba(168, 85, 247, 0.5) !important;
  }
  .dark-reader .turath-content,
  .dark-reader .turath-content p {
    color: #f1edfa !important;
  }
  .dark-reader .turath-content span[data-type="title"] {
    color: #f3e8ff !important;
    background: radial-gradient(ellipse at center, rgba(168, 85, 247, 0.18) 0%, transparent 80%);
  }

  /* Sepia Reader Styles */
  .sepia-reader .turath-outer-chapter-card {
    border-color: rgba(184, 164, 120, 0.5) !important;
    background: rgba(234, 224, 202, 0.25) !important;
  }
  .sepia-reader .turath-page-card {
    border-color: rgba(184, 164, 120, 0.4) !important;
    background: rgba(250, 244, 230, 0.7) !important;
  }
  .sepia-reader .turath-page-badge {
    color: #4a382b !important;
    background: #eadeca !important;
    border-color: #b8a478 !important;
  }
  .sepia-reader .turath-content,
  .sepia-reader .turath-content p {
    color: #3b2814 !important;
  }

  /* Light Reader Styles */
  .light-reader .turath-outer-chapter-card {
    border-color: rgba(149, 11, 196, 0.2) !important;
    background: rgba(250, 247, 255, 0.8) !important;
  }
  .light-reader .turath-page-card {
    border-color: rgba(149, 11, 196, 0.18) !important;
    background: #ffffff !important;
  }
  .light-reader .turath-page-badge {
    color: #7c3aed !important;
    background: #f5f3ff !important;
    border-color: rgba(124, 58, 237, 0.35) !important;
  }
  .light-reader .turath-content,
  .light-reader .turath-content p {
    color: #1e1b2e !important;
  }
`

export default function ChunkReaderModal({
  bookId,
  bookTitle,
  authorName,
  onClose,
  apiBaseUrl = 'http://127.0.0.1:8001/api/v1/data-ingestion'
}: ChunkReaderModalProps) {
  const [chunks, setChunks] = useState<ParentChunkItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [copied, setCopied] = useState(false)
  const [fontSize, setFontSize] = useState<number>(20)
  const [fontFamily, setFontFamily] = useState<'font-read' | 'font-sans'>('font-read')
  const [readerTheme, setReaderTheme] = useState<'dark' | 'sepia' | 'light'>('dark')
  const contentScrollRef = useRef<HTMLDivElement>(null)

  // ── جلب المقاطع المستخرجة ──
  useEffect(() => {
    const fetchChunks = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`${apiBaseUrl}/rag-books/${bookId}/chunks?limit=500`)
        if (!res.ok) throw new Error(`تعذر استرجاع الأبواب (كود ${res.status})`)
        const data = await res.json()
        setChunks(data.chunks || [])
        setTotalCount(data.total || 0)
        if (data.chunks?.length > 0) setSelectedIdx(0)
      } catch (err: any) {
        setError(err.message || 'فشل الاتصال بالخادم لجلب الأبواب.')
      } finally {
        setLoading(false)
      }
    }
    fetchChunks()
  }, [bookId, apiBaseUrl])

  // التمرير لأعلى عند تغيير الباب
  useEffect(() => {
    contentScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [selectedIdx])

  // التصفية والبحث
  const filteredChunks = useMemo(() => {
    if (!searchQuery.trim()) return chunks
    const q = searchQuery.trim().toLowerCase()
    return chunks.filter(c => {
      const hierStr = Array.isArray(c.hierarchy) ? c.hierarchy.join(' ') : String(c.hierarchy || '')
      return (
        (c.title || '').toLowerCase().includes(q) ||
        (c.content || '').toLowerCase().includes(q) ||
        hierStr.toLowerCase().includes(q)
      )
    })
  }, [chunks, searchQuery])

  // اختصارات لوحة المفاتيح
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setSelectedIdx(p => Math.min(filteredChunks.length - 1, p + 1))
      if (e.key === 'ArrowRight') setSelectedIdx(p => Math.max(0, p - 1))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, filteredChunks.length])

  const currentChunk = filteredChunks[selectedIdx] || null

  // المسار الفقهي
  const hierarchyList = useMemo(() => {
    if (!currentChunk) return []
    if (Array.isArray(currentChunk.hierarchy)) return currentChunk.hierarchy
    if (typeof currentChunk.hierarchy === 'string') {
      try {
        const parsed = JSON.parse(currentChunk.hierarchy)
        if (Array.isArray(parsed)) return parsed
      } catch {
        return [currentChunk.hierarchy]
      }
    }
    return []
  }, [currentChunk])

  // عنوان الباب الحالي
  const currentTitle = useMemo(() => {
    if (!currentChunk) return ''
    if (currentChunk.title && currentChunk.title.trim()) return currentChunk.title.trim()
    if (hierarchyList.length > 0) return hierarchyList[hierarchyList.length - 1]
    return 'باب فقهي'
  }, [currentChunk, hierarchyList])

  // تجهيز محتوى الباب بنفس محرك TurathReader مباشرة
  const renderedChunkHtml = useMemo(() => {
    if (!currentChunk || !currentChunk.content) return ''
    return renderTurathChunkHtml(currentChunk.content)
  }, [currentChunk])

  const handleCopy = () => {
    if (!currentChunk) return
    navigator.clipboard.writeText(currentChunk.content || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ثيمات الشاشة والقارئ
  const themeStyles = {
    dark: {
      modalBg: 'bg-[#0b0416]',
      sidebarBg: 'bg-[#0f071d]/95 border-white/10',
      contentBg: 'bg-[#120924]',
      border: 'border-white/10',
      activeItem: 'bg-gradient-to-l from-brand-magenta/30 to-brand-blue/20 border-brand-magenta/50 text-white shadow-md',
      hoverItem: 'hover:bg-white/5 text-white/70 hover:text-white border-transparent',
      titleColor: 'text-white',
      metaColor: 'text-white/60',
      badgeBg: 'bg-white/5 text-white/70 border-white/10',
      searchBg: 'bg-black/40 border-white/10 text-white placeholder:text-white/30 focus:border-brand-magenta/50',
      topbarBg: 'bg-[#0d071a]/90',
      footerBg: 'bg-[#0d071a]/95 border-white/10',
    },
    sepia: {
      modalBg: 'bg-[#f4ecd8]',
      sidebarBg: 'bg-[#eadeca] border-[#d4c4a8]',
      contentBg: 'bg-[#faf4e6]',
      border: 'border-[#d4c4a8]',
      activeItem: 'bg-[#d8caa6] border-[#b8a478] text-[#332211] font-bold shadow-sm',
      hoverItem: 'hover:bg-[#d8caa6]/40 text-[#5c3f22] border-transparent',
      titleColor: 'text-[#362314]',
      metaColor: 'text-[#5c3f22]/80',
      badgeBg: 'bg-[#eadeca] text-[#5c3f22] border-[#d4c4a8]',
      searchBg: 'bg-[#faf4e6] border-[#d4c4a8] text-[#362314] placeholder:text-[#a0876a] focus:border-amber-700/50',
      topbarBg: 'bg-[#f0e4ce]/90',
      footerBg: 'bg-[#f0e4ce]/95 border-[#d4c4a8]',
    },
    light: {
      modalBg: 'bg-[#faf7ff]',
      sidebarBg: 'bg-white border-slate-200',
      contentBg: 'bg-[#ffffff]',
      border: 'border-slate-200',
      activeItem: 'bg-brand-magenta/10 border-brand-magenta/40 text-brand-deep font-bold shadow-sm',
      hoverItem: 'hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-transparent',
      titleColor: 'text-slate-900',
      metaColor: 'text-slate-500',
      badgeBg: 'bg-slate-100 text-slate-600 border-slate-200',
      searchBg: 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-brand-magenta/40',
      topbarBg: 'bg-white/90',
      footerBg: 'bg-white/95 border-slate-200',
    },
  }[readerTheme]

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-2 sm:p-6 animate-in fade-in duration-300"
    >
      <style>{TURATH_READER_CSS}</style>

      <div className={`relative flex flex-col h-full max-h-[96vh] w-full max-w-7xl rounded-3xl border shadow-2xl overflow-hidden transition-colors duration-300 ${themeStyles.modalBg} ${themeStyles.border}`}>

        {/* ── شريط الرأس العلوي ── */}
        <header className={`flex items-center justify-between px-6 py-4 border-b shrink-0 backdrop-blur-md transition-colors ${themeStyles.topbarBg} ${themeStyles.border}`}>
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-brand-magenta/15 border border-brand-magenta/30 flex items-center justify-center text-brand-magenta shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className={`font-bold text-base sm:text-lg tracking-tight ${themeStyles.titleColor}`}>{bookTitle}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                  {totalCount} باب مستخرج
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${themeStyles.metaColor}`}>
                المؤلف: {authorName || 'غير معروف'} • وضع المطالعة المطابق لمكتبة زاد
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* تبديل الخط */}
            <button
              onClick={() => setFontFamily(p => p === 'font-read' ? 'font-sans' : 'font-read')}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${themeStyles.badgeBg} hover:scale-105`}
              title="تغيير نوع الخط"
            >
              <Type className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{fontFamily === 'font-read' ? 'خط كلاسيكي (أميري)' : 'خط عصري (كايرو)'}</span>
            </button>

            {/* تصغير وتكبير الخط */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-black/20 dark:bg-white/5 border border-inherit text-xs">
              <button
                onClick={() => setFontSize(p => Math.max(14, p - 2))}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors font-bold"
                title="تصغير الخط"
              >
                A-
              </button>
              <span className="text-[11px] font-mono px-1 min-w-[28px] text-center">{fontSize}px</span>
              <button
                onClick={() => setFontSize(p => Math.min(36, p + 2))}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors font-bold"
                title="تكبير الخط"
              >
                A+
              </button>
            </div>

            {/* ثيمات العرض */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-black/20 dark:bg-white/5 border border-inherit">
              <button
                onClick={() => setReaderTheme('dark')}
                className={`p-1.5 rounded-lg transition-all ${readerTheme === 'dark' ? 'bg-brand-magenta text-white shadow-sm' : 'opacity-50 hover:opacity-100'}`}
                title="الوضع الداكن"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setReaderTheme('sepia')}
                className={`p-1.5 rounded-lg transition-all ${readerTheme === 'sepia' ? 'bg-[#b8a478] text-[#332211] shadow-sm' : 'opacity-50 hover:opacity-100'}`}
                title="الوضع الورقي"
              >
                <FileText className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setReaderTheme('light')}
                className={`p-1.5 rounded-lg transition-all ${readerTheme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'opacity-50 hover:opacity-100'}`}
                title="الوضع النهاري"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* زر الإغلاق */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-foreground/70 hover:text-red-400 border border-inherit transition-all mr-1"
              title="إغلاق (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* ── جسم النافذة ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* القائمة الجانبية للأبواب */}
          <aside className={`w-72 md:w-84 flex flex-col border-l shrink-0 transition-colors duration-300 ${themeStyles.sidebarBg} ${themeStyles.border}`}>
            <div className="p-3.5 border-b border-inherit">
              <div className="relative">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 opacity-40" />
                <input
                  type="text"
                  placeholder="بحث في الأبواب والفهرس..."
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setSelectedIdx(0) }}
                  className={`w-full border rounded-xl pr-9 pl-3 py-2 text-xs focus:outline-none transition-colors ${themeStyles.searchBg}`}
                />
              </div>
              <div className={`flex justify-between items-center text-[11px] mt-2 px-1 ${themeStyles.metaColor}`}>
                <span>{filteredChunks.length} من {totalCount} باب</span>
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-brand-magenta hover:underline text-[11px] font-semibold">
                    مسح البحث
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-60">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-magenta" />
                  <p className="text-xs">جاري تحميل الأبواب...</p>
                </div>
              ) : error ? (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">{error}</div>
              ) : filteredChunks.length === 0 ? (
                <div className="p-8 text-center opacity-50 text-xs">لا توجد أبواب تطابق بحثك.</div>
              ) : (
                filteredChunks.map((chunk, idx) => {
                  const isSelected = idx === selectedIdx
                  const hierText = Array.isArray(chunk.hierarchy)
                    ? chunk.hierarchy.slice(-2).join(' ‹ ')
                    : String(chunk.hierarchy || '')
                  const itemTitle = chunk.title || `باب #${idx + 1}`

                  return (
                    <button
                      key={chunk.parent_id || idx}
                      onClick={() => setSelectedIdx(idx)}
                      className={`w-full text-right p-3 rounded-xl border transition-all duration-200 flex flex-col gap-1 text-xs ${isSelected ? themeStyles.activeItem : themeStyles.hoverItem}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold truncate text-[13px]">{itemTitle}</span>
                        <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${themeStyles.badgeBg} shrink-0`}>
                          صـ {chunk.page_id || 1}
                        </span>
                      </div>
                      {hierText && <span className="text-[11px] opacity-60 truncate">{hierText}</span>}
                    </button>
                  )
                })
              )}
            </div>
          </aside>

          {/* مساحة قراءة المحتوى */}
          <main className={`flex-1 flex flex-col overflow-hidden transition-colors duration-300 ${themeStyles.contentBg}`}>
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 opacity-60">
                <Loader2 className="w-8 h-8 animate-spin text-brand-magenta" />
                <p className={`text-sm ${themeStyles.metaColor}`}>جاري جلب محتوى الباب...</p>
              </div>
            ) : !currentChunk ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-50">
                <BookOpen className="w-12 h-12 text-brand-magenta" />
                <p className={`text-sm ${themeStyles.metaColor}`}>اختر باباً من القائمة الجانبية لبدء القراءة.</p>
              </div>
            ) : (
              <>
                {/* شريط معلومات الباب الحالي */}
                <div className={`px-8 py-4 border-b flex flex-col gap-3 shrink-0 backdrop-blur-sm bg-black/5 dark:bg-white/5 ${themeStyles.border}`}>
                  {hierarchyList.length > 0 && (
                    <div className={`flex items-center gap-1.5 flex-wrap text-xs ${themeStyles.metaColor}`}>
                      <FolderTree className="w-3.5 h-3.5 text-brand-magenta shrink-0" />
                      <span className="font-bold opacity-70">المسار الفقهي:</span>
                      {hierarchyList.map((item, i) => (
                        <React.Fragment key={i}>
                          <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${themeStyles.badgeBg}`}>
                            {item}
                          </span>
                          {i < hierarchyList.length - 1 && <span className="opacity-40 text-xs">‹</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-4 flex-wrap text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      {currentChunk.madhhab && (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                          {currentChunk.madhhab}
                        </span>
                      )}
                      <span className="px-2.5 py-1 rounded-lg bg-brand-blue/15 text-brand-blue font-semibold border border-brand-blue/30 font-mono">
                        الصفحة: {currentChunk.page_id || 1}
                      </span>
                      {currentChunk.part > 0 && (
                        <span className="px-2.5 py-1 rounded-lg bg-brand-magenta/15 text-brand-magenta font-semibold border border-brand-magenta/30 font-mono">
                          الجزء {currentChunk.part}{currentChunk.total_parts ? ` من ${currentChunk.total_parts}` : ''}
                        </span>
                      )}
                      {currentChunk.author_death && (
                        <span className={`px-2.5 py-1 rounded-lg font-mono border ${themeStyles.badgeBg}`}>
                          ت {currentChunk.author_death}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopy}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-semibold ${themeStyles.badgeBg} hover:scale-105`}
                        title="نسخ نص هذا الباب كاملاً"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'تم النسخ!' : 'نسخ النص'}
                      </button>

                      {currentChunk.source_url && (
                        <a
                          href={currentChunk.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-blue/15 hover:bg-brand-blue/25 text-brand-blue border border-brand-blue/30 transition-all text-xs font-semibold hover:scale-105"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          فتح في تراث
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* مساحة قراءة النص */}
                <div
                  ref={contentScrollRef}
                  className="flex-1 overflow-y-auto px-6 sm:px-12 md:px-20 py-8 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10"
                >
                  <div className="max-w-4xl mx-auto">
                    {/* شارة عنوان الباب الكلاسيكية كما في TurathReader */}
                    <div className="flex flex-col items-center justify-center text-center my-6">
                      <div className="inline-flex items-center justify-center gap-3 px-8 py-3 rounded-full border shadow-sm backdrop-blur-md bg-brand-magenta/10 border-brand-magenta/30">
                        <span className="text-brand-magenta text-xl select-none font-bold">﴿</span>
                        <h1 className="text-xl sm:text-2xl font-extrabold tracking-wide font-display text-inherit">
                          {currentTitle}
                        </h1>
                        <span className="text-brand-magenta text-xl select-none font-bold">﴾</span>
                      </div>
                      <span className="text-[11px] font-mono opacity-50 mt-2 dir-ltr">{currentChunk.parent_id}</span>
                    </div>

                    {/* جسم النص - بنفس محرك TurathReader */}
                    <div className={`${readerTheme === 'dark' ? 'dark-reader' : readerTheme === 'sepia' ? 'sepia-reader' : 'light-reader'}`}>
                      <div
                        className={`turath-content prose prose-lg max-w-none leading-[2.5] selection:bg-brand-magenta/30 selection:text-brand-deep dark:selection:text-white ${fontFamily} prose-headings:m-0 prose-headings:leading-tight prose-p:my-1`}
                        style={{ fontSize: `${fontSize}px` }}
                        dangerouslySetInnerHTML={{ __html: renderedChunkHtml }}
                      />
                    </div>

                    {/* تذييل نهاية النص */}
                    <div className={`pt-12 pb-6 mt-12 border-t border-inherit flex items-center justify-between text-xs opacity-50 ${themeStyles.metaColor}`}>
                      <span>انتهى نص هذا الباب من كتاب «{bookTitle}»</span>
                      <span className="font-mono">الصفحة {currentChunk.page_id}</span>
                    </div>
                  </div>
                </div>

                {/* شريط التنقل السفلي */}
                <footer className={`px-8 py-3.5 border-t backdrop-blur-md flex items-center justify-between shrink-0 transition-colors ${themeStyles.footerBg} ${themeStyles.border}`}>
                  <button
                    onClick={() => setSelectedIdx(p => Math.max(0, p - 1))}
                    disabled={selectedIdx === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-inherit text-xs font-semibold border border-inherit transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105"
                  >
                    <ChevronRight className="w-4 h-4" />
                    الباب السابق
                  </button>

                  <span className={`text-xs font-mono opacity-70 ${themeStyles.metaColor}`}>
                    {selectedIdx + 1} / {filteredChunks.length}
                  </span>

                  <button
                    onClick={() => setSelectedIdx(p => Math.min(filteredChunks.length - 1, p + 1))}
                    disabled={selectedIdx >= filteredChunks.length - 1}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-inherit text-xs font-semibold border border-inherit transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105"
                  >
                    الباب التالي
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </footer>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
