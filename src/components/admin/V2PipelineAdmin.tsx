import React, { useState, useEffect } from 'react'
import { ArrowRight, CheckSquare, Square, Play, Layers, Sparkles, Database, CheckCircle, Search, Server, CloudUpload, RefreshCw, BookOpen, AlertCircle, Loader2, Trash2, XSquare, Terminal, Activity, Eye } from 'lucide-react'
import bgDark from '@/assets/images/image.webp'
import ChunkReaderModal from './ChunkReaderModal'

interface BookItem {
  id: number
  name: string
  author_name: string
  cat_name: string
  domain: string
  madhhab: string
  is_ingested: boolean
  parent_chunks_count: number
  job_status?: {
    status: 'idle' | 'pending' | 'processing' | 'done' | 'error'
    phase?: string
    step?: string
    message?: string
    current?: number
    total?: number
    percent?: number
    recent_logs?: string[]
    chunks_count?: number
  }
}

interface RagStatusResponse {
  total_library_books: number
  ingested_for_rag_count: number
  reading_only_count: number
  books: BookItem[]
}

const INGESTION_API_BASE = import.meta.env.VITE_DATA_INGESTION_URL || 'http://127.0.0.1:8001/api/v1/data-ingestion'

export default function V2PipelineAdmin({ onExit }: { onExit: () => void }) {
  const [books, setBooks] = useState<BookItem[]>([])
  const [stats, setStats] = useState({
    total: 0,
    ingested: 0,
    readingOnly: 0
  })
  const [selectedBooks, setSelectedBooks] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [syncingHf, setSyncingHf] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMode, setFilterMode] = useState<'all' | 'ingested' | 'reading_only'>('all')
  const [showLogs, setShowLogs] = useState(true)
  const [inspectingBook, setInspectingBook] = useState<BookItem | null>(null)

  const fetchBooksStatus = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true)
      const res = await fetch(`${INGESTION_API_BASE}/rag-books-status`)
      if (res.ok) {
        const data: RagStatusResponse = await res.json()
        setBooks(data.books || [])
        setStats({
          total: data.total_library_books || 0,
          ingested: data.ingested_for_rag_count || 0,
          readingOnly: data.reading_only_count || 0
        })
      } else {
        if (!isBackground) {
          setMessage({ text: 'تعذر جلب حالة الكتب من الخادم. تأكد من تشغيل خدمة data_ingestion على المنفذ 8001.', type: 'error' })
        }
      }
    } catch (err: any) {
      console.error('Error fetching RAG books status:', err)
      if (!isBackground) {
        setMessage({ text: `فشل الاتصال بخدمة المعالجة: ${err.message}`, type: 'error' })
      }
    } finally {
      if (!isBackground) setLoading(false)
    }
  }

  useEffect(() => {
    fetchBooksStatus()
  }, [])

  // Poll job progress every 1.5 seconds if any book is in processing/pending
  useEffect(() => {
    const hasActiveJobs = books.some(b => b.job_status?.status === 'processing' || b.job_status?.status === 'pending')
    if (!hasActiveJobs && !processing) return

    const timer = setInterval(() => {
      fetchBooksStatus(true)
    }, 1500)

    return () => clearInterval(timer)
  }, [books, processing])

  const toggleBook = (id: number) => {
    setSelectedBooks(prev => 
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    const visibleBookIds = filteredBooks.map(b => b.id)
    const allSelected = visibleBookIds.every(id => selectedBooks.includes(id))
    
    if (allSelected) {
      setSelectedBooks(prev => prev.filter(id => !visibleBookIds.includes(id)))
    } else {
      setSelectedBooks(prev => Array.from(new Set([...prev, ...visibleBookIds])))
    }
  }

  const handleSelectOnlyReading = () => {
    const readingOnlyIds = books.filter(b => !b.is_ingested).map(b => b.id)
    setSelectedBooks(readingOnlyIds)
  }

  const startPipeline = async () => {
    if (selectedBooks.length === 0) {
      setMessage({ text: 'يرجى تحديد كتاب واحد على الأقل للمعالجة.', type: 'error' })
      return
    }

    setProcessing(true)
    setMessage({ text: `جاري بدء معالجة ${selectedBooks.length} كتاب للذكاء الاصطناعي في الخلفية...`, type: 'info' })

    try {
      const res = await fetch(`${INGESTION_API_BASE}/ingest-selected-books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_ids: selectedBooks })
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ text: data.message || 'تمت جدولة الكتب بنجاح في الخلفية!', type: 'success' })
        setSelectedBooks([])
        await fetchBooksStatus()
      } else {
        setMessage({ text: `خطأ أثناء الجدولة: ${data.detail || data.message}`, type: 'error' })
      }
    } catch (err: any) {
      setMessage({ text: `فشل الاتصال بالخادم: ${err.message}`, type: 'error' })
    } finally {
      setProcessing(false)
    }
  }

  const syncToHuggingFace = async () => {
    setSyncingHf(true)
    setMessage({ text: 'جاري رفع ومزامنة قاعدة بيانات التراث المحلية إلى مستودع Hugging Face Dataset...', type: 'info' })

    try {
      const res = await fetch(`${INGESTION_API_BASE}/sync-to-hf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commit_message: `Update turath_parents.db with ${stats.ingested} books`
        })
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ text: data.message || 'تمت المزامنة بنجاح مع Hugging Face Data!', type: 'success' })
      } else {
        setMessage({ text: `فشل المزامنة: ${data.detail || 'تأكد من إعداد HF_TOKEN'}`, type: 'error' })
      }
    } catch (err: any) {
      setMessage({ text: `خطأ أثناء الاتصال بـ Hugging Face: ${err.message}`, type: 'error' })
    } finally {
      setSyncingHf(false)
    }
  }

  const removeBookFromRag = async (e: React.MouseEvent, bookId: number, bookName: string) => {
    e.stopPropagation()
    if (!window.confirm(`هل أنت متأكد من رغبتك في إزالة كتاب "${bookName}" من محرك الـ RAG؟\nسيبقى الكتاب متاحاً في مكتبة القراءة ولكن ستُحذف مقاطعه من الذكاء الاصطناعي.`)) {
      return
    }

    try {
      const res = await fetch(`${INGESTION_API_BASE}/rag-books/${bookId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ text: data.message || 'تمت إزالة الكتاب من محرك الـ RAG بنجاح!', type: 'success' })
        setSelectedBooks(prev => prev.filter(id => id !== bookId))
        await fetchBooksStatus()
      } else {
        setMessage({ text: `فشل الحذف: ${data.detail || data.message}`, type: 'error' })
      }
    } catch (err: any) {
      setMessage({ text: `خطأ في الاتصال: ${err.message}`, type: 'error' })
    }
  }

  const filteredBooks = books.filter(b => {
    const matchesSearch = b.name.includes(searchQuery) || b.author_name.includes(searchQuery) || b.cat_name.includes(searchQuery)
    if (!matchesSearch) return false

    if (filterMode === 'ingested') return b.is_ingested
    if (filterMode === 'reading_only') return !b.is_ingested
    return true
  })

  const activeJobs = books.filter(b => b.job_status?.status === 'processing' || b.job_status?.status === 'pending')
  const allRecentLogs = books
    .filter(b => b.job_status?.recent_logs && b.job_status.recent_logs.length > 0)
    .flatMap(b => b.job_status!.recent_logs!.map(l => ({ bookName: b.name, log: l })))

  return (
    <div dir="rtl" className="relative flex h-screen w-full flex-col overflow-hidden text-foreground bg-[#0a0211]">
      {/* Background with Glassmorphism Overlay */}
      <img
        src={bgDark}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-35"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#12041f]/95 via-[#0a0211]/95 to-[#0a0211] backdrop-blur-xl" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Back Button */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={onExit}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/70 transition-all hover:bg-white/10 hover:text-white border border-white/10 shadow-lg backdrop-blur-md"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-8 overflow-y-auto [&::-webkit-scrollbar]:hidden">
        
        {/* Header */}
        <div className="flex flex-col items-center justify-center text-center mb-2 shrink-0">
          <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
            <Server className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">إدارة بيانات الذكاء الاصطناعي (AI & RAG Ingestion)</h1>
          <p className="text-white/60 text-sm max-w-2xl">
            هذه اللوحة مخصصة لاختيار وتفعيل الكتب المعتمدة في مكتبة زاد، لتضمينها في محرك البحث الذكي واستخراج الأبواب والـ Embeddings السحابية دون استهلاك إنترنت جهازك.
          </p>
        </div>

        {/* Top Summary Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 shrink-0">
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3.5 backdrop-blur-md">
            <div className="p-2.5 rounded-lg bg-blue-500/20 text-blue-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-white/50">إجمالي كتب المكتبة</p>
              <h4 className="text-xl font-bold text-white mt-0.5">{stats.total}</h4>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3.5 backdrop-blur-md">
            <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-white/50">مفعلة في الذكاء الاصطناعي</p>
              <h4 className="text-xl font-bold text-emerald-400 mt-0.5">{stats.ingested}</h4>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3.5 backdrop-blur-md">
            <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-white/50">للقراءة فقط (غير مدرجة بالـ RAG)</p>
              <h4 className="text-xl font-bold text-amber-400 mt-0.5">{stats.readingOnly}</h4>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between backdrop-blur-md">
            <button
              onClick={syncToHuggingFace}
              disabled={syncingHf || stats.ingested === 0}
              className="w-full h-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(147,51,234,0.3)]"
            >
              {syncingHf ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
              مزامنة ورفع إلى Hugging Face
            </button>
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div className={`p-4 rounded-xl flex items-center justify-between gap-3 border backdrop-blur-md shadow-xl transition-all ${
            message.type === 'error'
              ? 'bg-red-900/20 border-red-500/30 text-red-300' 
              : message.type === 'success'
              ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-300'
              : 'bg-blue-900/20 border-blue-500/30 text-blue-300'
          }`}>
            <div className="flex items-center gap-2.5">
              {message.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle className="w-5 h-5 shrink-0" />}
              <p className="text-sm font-semibold">{message.text}</p>
            </div>
            <button onClick={() => setMessage(null)} className="text-white/50 hover:text-white text-xs">إغلاق</button>
          </div>
        )}

        {/* Live Pipeline Monitor (Shows when active or recent jobs exist) */}
        {activeJobs.length > 0 && (
          <div className="w-full p-5 rounded-2xl bg-gradient-to-br from-blue-950/40 via-indigo-950/30 to-black/60 border border-blue-500/30 backdrop-blur-xl shadow-[0_0_30px_rgba(59,130,246,0.15)] flex flex-col gap-4 animate-in fade-in duration-300 shrink-0">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
                <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  متابعة المعالجة الحية للكتب ({activeJobs.length})
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowLogs(prev => !prev)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  {showLogs ? 'إخفاء الطرفية الحية' : 'عرض سجل العمليات المباشر'}
                </button>
              </div>
            </div>

            {/* Active Books Progress Bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeJobs.map(job => (
                <div key={job.id} className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{job.name}</span>
                      <span className="text-white/40">({job.author_name})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30 text-[10px]">
                        {job.job_status?.phase === 'downloading' ? '🚀 تنزيل الحزمة السحابية' : job.job_status?.phase === 'parsing' ? '⚡ تقطيع وحفظ الأبواب' : '🧩 تجهيز الـ RAG'}
                      </span>
                      <span className="font-bold text-white font-mono">{job.job_status?.percent ?? 0}%</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(job.job_status?.percent ?? 0, 5)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-white/60">
                    <span className="truncate max-w-[280px]">{job.job_status?.message || 'جاري المعالجة...'}</span>
                    {job.job_status?.total ? (
                      <span className="font-mono text-white/50 shrink-0">{job.job_status.current} / {job.job_status.total} باب</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            {/* Live Terminal Logs Console */}
            {showLogs && (
              <div className="p-3.5 rounded-xl bg-black/80 border border-white/10 font-mono text-xs max-h-48 overflow-y-auto space-y-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/20">
                <div className="flex items-center justify-between text-[10px] text-white/40 pb-2 border-b border-white/10 font-sans">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <Terminal className="w-3 h-3" /> سجل الأحداث الحية (Realtime Logs)
                  </span>
                  <span>تحديث كل 1.5 ثانية</span>
                </div>
                {allRecentLogs.length === 0 ? (
                  <p className="text-white/30 text-center py-2 font-sans">جاري انتظار وصول السجلات الأولى من محرك الاستخراج...</p>
                ) : (
                  allRecentLogs.slice(-25).map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-white/30 shrink-0 text-[10px] font-sans">[{item.bookName}]</span>
                      <span className={item.log.includes('✅') ? 'text-emerald-400 font-semibold' : item.log.includes('❌') ? 'text-red-400' : item.log.includes('🚀') ? 'text-cyan-300 font-bold' : item.log.includes('💾') ? 'text-purple-300' : 'text-white/70'}>
                        {item.log}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Main Content Area */}
        <div className="w-full flex-1 min-h-[450px] bg-white/[0.02] border border-white/5 rounded-2xl p-6 shadow-2xl backdrop-blur-xl flex flex-col shrink-0">
          
          {/* Controls & Filter Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 border-b border-white/5 pb-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="بحث في كتب المكتبة المعتمدة..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl pr-10 pl-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
              {/* Filter Tabs */}
              <div className="flex items-center p-1 bg-black/40 rounded-xl border border-white/5 text-xs">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${filterMode === 'all' ? 'bg-white/10 text-white font-bold' : 'text-white/50 hover:text-white'}`}
                >
                  الكل ({books.length})
                </button>
                <button
                  onClick={() => setFilterMode('reading_only')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${filterMode === 'reading_only' ? 'bg-white/10 text-white font-bold' : 'text-white/50 hover:text-white'}`}
                >
                  للقراءة فقط ({stats.readingOnly})
                </button>
                <button
                  onClick={() => setFilterMode('ingested')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${filterMode === 'ingested' ? 'bg-white/10 text-white font-bold' : 'text-white/50 hover:text-white'}`}
                >
                  المفعلة بالـ RAG ({stats.ingested})
                </button>
              </div>

              <button
                onClick={() => fetchBooksStatus()}
                disabled={loading}
                title="تحديث البيانات"
                className="p-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={handleSelectAll}
                className="px-3 py-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10 text-xs flex items-center gap-1.5 transition-colors"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                تحديد المعروض
              </button>

              <button
                onClick={handleSelectOnlyReading}
                className="px-3 py-2 rounded-xl bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/20 text-xs flex items-center gap-1.5 transition-colors"
              >
                تحديد غير المجهزة فقط
              </button>

              {selectedBooks.length > 0 && (
                <button
                  onClick={() => setSelectedBooks([])}
                  className="px-3 py-2 rounded-xl bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/10 text-xs flex items-center gap-1.5 transition-colors"
                >
                  <XSquare className="w-3.5 h-3.5" />
                  إلغاء التحديد ({selectedBooks.length})
                </button>
              )}
            </div>
          </div>

          {/* Book Cards Grid */}
          {loading && books.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-white/50 py-16">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-3" />
              <p>جاري فحص حالة الكتب من المكتبة وقاعدة البيانات...</p>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-white/40 py-16 text-center">
              <BookOpen className="w-12 h-12 text-white/20 mb-3" />
              <p className="font-semibold">لا توجد كتب تطابق البحث أو الفلتر المختار.</p>
              <p className="text-xs text-white/30 mt-1">تأكد أولاً من إضافة كتب لمكتبة القراءة من شاشة إدارة المكتبة (Admin Library).</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-1 flex-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10">
              {filteredBooks.map(book => {
                const isSelected = selectedBooks.includes(book.id)
                const isJobRunning = book.job_status?.status === 'processing' || book.job_status?.status === 'pending'
                const isJobDone = book.job_status?.status === 'done'
                const isJobError = book.job_status?.status === 'error'

                return (
                  <div
                    key={book.id}
                    onClick={() => toggleBook(book.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 group flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-500/10 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.12)]'
                        : book.is_ingested
                        ? 'bg-emerald-950/10 border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-900/10'
                        : 'bg-black/40 border-white/5 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div>
                      {/* Top status header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="mt-0.5">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-400" />
                            ) : (
                              <Square className="w-4 h-4 text-white/30 group-hover:text-white/50" />
                            )}
                          </div>
                          <span className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-white/90'}`}>
                            {book.name}
                          </span>
                        </div>

                        {/* Status Badge */}
                        {isJobRunning ? (
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-semibold border border-blue-500/30 flex items-center gap-1 shrink-0 animate-pulse">
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            معالجة ({book.job_status?.percent ?? 0}%)
                          </span>
                        ) : book.is_ingested ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30 flex items-center gap-1 shrink-0">
                            <CheckCircle className="w-2.5 h-2.5" />
                            مفعل بالـ RAG
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-white/5 text-white/50 text-[10px] border border-white/10 shrink-0">
                            للقراءة فقط
                          </span>
                        )}
                      </div>

                      <p className="text-white/50 text-xs pr-6">المؤلف: {book.author_name || 'غير معروف'}</p>

                      {/* In-Card Live Progress Bar for running jobs */}
                      {isJobRunning && (
                        <div className="mt-2.5 p-2 rounded-lg bg-blue-950/40 border border-blue-500/20 space-y-1.5">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-blue-300 font-medium">
                              {book.job_status?.phase === 'downloading'
                                ? '🚀 تنزيل الحزمة السحابية'
                                : book.job_status?.phase === 'parsing'
                                ? '⚡ تقطيع وحفظ الأبواب'
                                : '🧩 تجهيز محرك الـ RAG'}
                            </span>
                            <span className="font-mono text-white font-bold">{book.job_status?.percent ?? 0}%</span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.max(book.job_status?.percent ?? 0, 5)}%` }}
                            />
                          </div>
                          {book.job_status?.total ? (
                            <div className="flex justify-between text-[9px] text-white/40 font-mono">
                              <span>باب مستخرج: {book.job_status.current}</span>
                              <span>إجمالي الأبواب: {book.job_status.total}</span>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>

                    {/* Metadata tags and chunks count */}
                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-white/50">
                      <div className="flex gap-1.5 flex-wrap">
                        {book.cat_name && (
                          <span className="px-2 py-0.5 rounded bg-white/5 text-white/60 border border-white/5">
                            {book.cat_name}
                          </span>
                        )}
                        {book.madhhab && (
                          <span className="px-2 py-0.5 rounded bg-white/5 text-white/60 border border-white/5">
                            {book.madhhab}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {book.is_ingested && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setInspectingBook(book)
                              }}
                              title="معاينة واستعراض الأبواب (Chunks) بنمط قارئ مكتبة زاد"
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 hover:text-white border border-blue-500/30 transition-all text-xs font-semibold shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-400" />
                              استعراض الأبواب ({book.parent_chunks_count})
                            </button>
                            <button
                              onClick={(e) => removeBookFromRag(e, book.id, book.name)}
                              title="إزالة من الـ RAG والتحويل للقراءة فقط"
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Job message if any */}
                    {book.job_status?.message && (
                      <div className={`mt-2 p-1.5 rounded text-[10px] ${
                        isJobError ? 'bg-red-500/10 text-red-300' : isJobDone ? 'bg-emerald-500/10 text-emerald-300' : 'bg-blue-500/10 text-blue-300'
                      }`}>
                        {book.job_status.message}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Bottom Action Bar */}
          <div className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-white/60">
              تم تحديد <span className="font-bold text-white mx-1 text-base">{selectedBooks.length}</span> كتاب من أصل {filteredBooks.length}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={startPipeline}
                disabled={processing || selectedBooks.length === 0}
                className="flex-1 sm:flex-initial px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(59,130,246,0.3)]"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                بدء معالجة واستخراج الكتب المحددة للـ RAG
              </button>
            </div>
          </div>
        </div>

      </div>
      {/* Chunk Reader & Inspection Modal */}
      {inspectingBook && (
        <ChunkReaderModal
          bookId={inspectingBook.id}
          bookTitle={inspectingBook.name}
          authorName={inspectingBook.author_name}
          onClose={() => setInspectingBook(null)}
          apiBaseUrl={INGESTION_API_BASE}
        />
      )}

    </div>
  )
}
