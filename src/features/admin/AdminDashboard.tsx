import { useState, useEffect, useRef } from 'react'
import bgDark from '@/assets/images/image.webp'

const TUTOR_ENGINE_URL = import.meta.env.VITE_TUTOR_ENGINE_URL || 'https://abourida-zad-tutor-engine-space.hf.space'
const API_BASE = TUTOR_ENGINE_URL

interface BuildStatus {
  is_building: boolean
  current_book: string
  chunks_processed: number
  total_expected: number
  cancel_requested: boolean
}

interface LibraryStats {
  total_books: number
  built_books_count: number
  compressed_size_mb: number
  last_updated: string | null
  is_building: boolean
  current_building_book: string | null
  book_statuses: Record<string, 'built' | 'processing' | 'not_built' | 'built_unpublished'>
}

interface Job {
  book: string
  status: 'pending' | 'processing' | 'done' | 'error' | 'cancelled'
  message?: string
  progress?: number
}

interface IntegrityReport {
  healthy: boolean
  message: string
  total_chunks_in_tree?: number
  sample_checked?: number
  valid_chunks?: number
  missing_chunks?: number
}

interface LogEntry {
  id: string
  timestamp: string
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
  details?: string
}

export default function AdminDashboard({ onExit, onNavigateToIngestion }: { onExit: () => void; onNavigateToIngestion?: () => void }) {
  const [hierarchy, setHierarchy] = useState<Record<string, Record<string, string[]>>>({})
  const [loadingBooks, setLoadingBooks] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('zad_admin_selected_books')
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch {
      return new Set()
    }
  })

  useEffect(() => {
    localStorage.setItem('zad_admin_selected_books', JSON.stringify(Array.from(selectedBooks)))
  }, [selectedBooks])
  const [searchQuery, setSearchQuery] = useState('')

  const [stats, setStats] = useState<LibraryStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  const [buildStatus, setBuildStatus] = useState<BuildStatus | null>(null)
  const [polling, setPolling] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [checkingIntegrity, setCheckingIntegrity] = useState(false)
  const [integrityReport, setIntegrityReport] = useState<IntegrityReport | null>(null)

  // Real-time System Error & Activity Log
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [showLogsDrawer, setShowLogsDrawer] = useState(false)

  // Notifications State
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [notificationTitle, setNotificationTitle] = useState('تحديث جديد في المكتبة')
  const [notificationMessage, setNotificationMessage] = useState('')
  const [notificationBooks, setNotificationBooks] = useState<Set<string>>(new Set())
  const [availableNotificationBooks, setAvailableNotificationBooks] = useState<string[]>([])
  const [isPublishing, setIsPublishing] = useState(false)
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set())

  // Search state for modals
  const [modalSearchQuery, setModalSearchQuery] = useState('')

  // Build Confirmation State
  const [showBuildConfirmModal, setShowBuildConfirmModal] = useState(false)
  const [booksToConfirm, setBooksToConfirm] = useState<string[]>([])
  const [isBuildingAll, setIsBuildingAll] = useState(false)

  const [statusMessage, setStatusMessage] = useState('')
  const [jobs, setJobs] = useState<Job[]>([])
  const abortControllerRef = useRef<AbortController | null>(null)
  const activeJobAbortRef = useRef<AbortController | null>(null)
  const jobsRef = useRef<Job[]>([])

  // Keep jobsRef in sync
  useEffect(() => { jobsRef.current = jobs }, [jobs])

  const getBookLocation = (bookName: string) => {
    for (const [domain, madhhabs] of Object.entries(hierarchy)) {
      for (const [madhhab, books] of Object.entries(madhhabs)) {
        if (books.includes(bookName)) return { domain, madhhab }
      }
    }
    return { domain: 'أخرى', madhhab: 'غير محدد' }
  }

  const addLog = (type: 'info' | 'success' | 'warning' | 'error', message: string, details?: string) => {
    const newEntry: LogEntry = {
      id: Date.now().toString() + Math.random().toString().slice(2, 6),
      timestamp: new Date().toLocaleTimeString('ar-EG'),
      type,
      message,
      details,
    }
    setLogs(prev => [newEntry, ...prev.slice(0, 49)]) // Keep last 50 entries
  }

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/library-stats`)
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.detail || `خطأ HTTP ${res.status}`)
      }
      const data = await res.json()
      setStats(data)
    } catch (err: any) {
      console.error('Failed to fetch library stats:', err)
      addLog('error', 'فشل في جلب إحصائيات المكتبة من المحرك', err.message || String(err))
    } finally {
      setLoadingStats(false)
    }
  }

  const fetchBooksData = async () => {
    setLoadingBooks(true)
    setFetchError(null)
    addLog('info', 'جاري جلب هيكلية الكتب والمجالات من السيرفر...')
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/books`)
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.detail || `رمز الخطأ HTTP ${res.status}`)
      }
      const data = await res.json()
      if (data.hierarchy && Object.keys(data.hierarchy).length > 0) {
        setHierarchy(data.hierarchy)
        addLog('success', `تم تحميل الكتب بنجاح (${Object.keys(data.hierarchy).length} مجالات).`)
      } else {
        const msg = 'لم يتم العثور على أي كتب أو مجالات في قاعدة البيانات.'
        setFetchError(msg)
        addLog('warning', msg)
      }
    } catch (err: any) {
      const msg = err.message || 'تعذر الاتصال بسيرفر المحرك (Zad Tutor Engine).'
      setFetchError(msg)
      addLog('error', 'فشل الاتصال بسيرفر المحرك', msg)
    } finally {
      setLoadingBooks(false)
    }
  }

  // Fetch books & stats on mount
  useEffect(() => {
    fetchBooksData()
    fetchStats()
  }, [])

  // Poll status when building or polling is active
  useEffect(() => {
    if (!polling) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/admin/build-status`)
        if (!res.ok) return
        const status: BuildStatus = await res.json()
        setBuildStatus(status)
        if (status.is_building && status.total_expected > 0) {
          const p = Math.round((status.chunks_processed / status.total_expected) * 100)
          setJobs(prev => prev.map(j => j.status === 'processing' ? { ...j, progress: Math.max(j.progress || 0, p) } : j))
        }
      } catch (e: any) {
        addLog('error', 'فشل استعلام حالة البناء الحية', e.message)
      }
    }, 200)
    return () => clearInterval(interval)
  }, [polling])

  // Smooth fake progress for active processing jobs
  useEffect(() => {
    if (!polling) return
    const interval = setInterval(() => {
      setJobs(prev => prev.map(j => {
        if (j.status === 'processing') {
          const current = j.progress || 0
          if (current < 90) {
            return { ...j, progress: current + Math.floor(Math.random() * 8) + 2 }
          }
        }
        return j
      }))
    }, 300)
    return () => clearInterval(interval)
  }, [polling])

  const toggleBook = (book: string) => {
    const newSet = new Set(selectedBooks)
    if (newSet.has(book)) newSet.delete(book)
    else newSet.add(book)
    setSelectedBooks(newSet)
  }

  const allAvailableBooks = Object.values(hierarchy).flatMap(d => Object.values(d).flat())

  const handleSelectAll = () => {
    if (selectedBooks.size === allAvailableBooks.length) {
      setSelectedBooks(new Set())
    } else {
      setSelectedBooks(new Set(allAvailableBooks))
    }
  }

  const handlePreBuild = (buildAll: boolean = false) => {
    let books: string[] = []
    if (buildAll) {
      books = allAvailableBooks
    } else {
      books = Array.from(selectedBooks)
    }

    if (books.length === 0) {
      addLog('warning', 'لم يتم اختيار أي كتاب للبناء.')
      return alert('يرجى اختيار كتاب واحد على الأقل أو اختيار "بناء كل الكتب"')
    }

    setBooksToConfirm(books)
    setIsBuildingAll(buildAll)
    setShowBuildConfirmModal(true)
  }

  const handleBuildConfirmed = async () => {
    setShowBuildConfirmModal(false)
    const booksToBuild = booksToConfirm
    
    // Remove built books from selection so they aren't accidentally built again
    const newSelected = new Set(selectedBooks)
    booksToBuild.forEach(b => newSelected.delete(b))
    setSelectedBooks(newSelected)

    if (booksToBuild.length === 0) return

    setJobs(booksToBuild.map(b => ({ book: b, status: 'pending' })))
    setPolling(true)
    setStatusMessage('جاري معالجة طابور الكتب...')
    addLog('info', `بدء عملية البناء لـ ${booksToBuild.length} كتاب...`)

    abortControllerRef.current = new AbortController()

    for (let i = 0; i < booksToBuild.length; i++) {
      const book = booksToBuild[i]
      const resetFlags = i === 0 // Only the first book in the batch clears old new flags

      const currentJobState = jobsRef.current.find(j => j.book === book)
      if (currentJobState?.status === 'cancelled') continue

      if (abortControllerRef.current.signal.aborted) {
        setStatusMessage('تم الإلغاء.')
        addLog('warning', 'تم إلغاء عملية البناء بطلب المستخدم.')
        setPolling(false)
        break
      }

      setJobs(prev => prev.map(j => j.book === book ? { ...j, status: 'processing', progress: 5 } : j))

      activeJobAbortRef.current = new AbortController()

      try {
        const url = `${API_BASE}/api/v1/admin/build-tree?book_names=${encodeURIComponent(book)}&reset_new_flags=${resetFlags}`
        const res = await fetch(url, {
          method: 'POST',
          signal: activeJobAbortRef.current.signal
        })
        const data = await res.json()

        if (!res.ok || !data.success) {
          throw new Error(data.detail || data.message || `HTTP ${res.status}`)
        }

        setJobs(prev => prev.map(j => j.book === book ? { ...j, progress: 100 } : j))
        await new Promise(resolve => setTimeout(resolve, 400))

        setJobs(prev => prev.map(j => j.book === book ? { ...j, status: 'done', message: data.message } : j))
        addLog('success', `تم بناء الفهرس لكتاب: ${book}`)
        // Fetch stats immediately so this book updates its status in the UI without waiting for others
        fetchStats()
      } catch (err: any) {
        if (err.name === 'AbortError') {
          setJobs(prev => prev.map(j => j.book === book ? { ...j, status: 'cancelled', message: 'تم الإلغاء' } : j))
          addLog('warning', `تم إلغاء بناء كتاب: ${book}`)
        } else {
          const errorMsg = err.message || 'فشل الاتصال بالسيرفر'
          setJobs(prev => prev.map(j => j.book === book ? { ...j, status: 'error', message: errorMsg } : j))
          addLog('error', `خطأ أثناء بناء كتاب ${book}`, errorMsg)
        }
      }
    }

    if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
      setStatusMessage('✅ تمت عملية البناء لجميع الكتب بنجاح!')
      addLog('success', 'اكتملت جميع المهام في طابور البناء.')
      setPolling(false)
    }
    fetchStats()
  }

  const handleFastSync = () => {
    if (!stats) return
    const unbuilt = Object.keys(stats.book_statuses).filter(b => stats.book_statuses[b] === 'not_built')
    if (unbuilt.length === 0) return alert('جميع الكتب مبنية بالفعل. لا يوجد كتب مفقودة للمزامنة.')
    setBooksToConfirm(unbuilt)
    setIsBuildingAll(true)
    setShowBuildConfirmModal(true)
  }

  const handleCheckIntegrity = async () => {
    setCheckingIntegrity(true)
    addLog('info', 'جاري فحص سلامة وصلات الشجرة والـ Chunk IDs...')
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/tree-integrity`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`)
      setIntegrityReport(data)
      if (data.healthy) {
        addLog('success', 'فحص سلامة الشجرة: سليمة بنسبة 100%.')
      } else {
        addLog('warning', 'فحص سلامة الشجرة: توجد عناصر مفقودة!', data.message)
      }
    } catch (err: any) {
      const msg = err.message || 'فشل فحص سلامة الشجرة'
      addLog('error', 'فشل في فحص سلامة الشجرة', msg)
      alert(`فشل الفحص: ${msg}`)
    } finally {
      setCheckingIntegrity(false)
    }
  }

  const [isRestoring, setIsRestoring] = useState(false)

  const handleRestoreBackup = async () => {
    if (!confirm('تحذير خطير: هل أنت متأكد من استعادة النسخة الاحتياطية السابقة للشجرة؟ قد تفقد بعض التحديثات الأخيرة!')) return
    
    setIsRestoring(true)
    addLog('warning', 'جاري استعادة النسخة الاحتياطية للشجرة...')
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/tree/restore`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || data.message || `HTTP ${res.status}`)
      
      addLog('success', 'تم استعادة النسخة الاحتياطية بنجاح!', data.message)
      alert('تم استعادة الشجرة بنجاح!')
      await fetchStats()
      await fetchBooksData()
    } catch (err: any) {
      addLog('error', 'فشل استعادة الشجرة', err.message)
      alert(`خطأ في الاستعادة: ${err.message}`)
    } finally {
      setIsRestoring(false)
    }
  }

  const handlePublishNotification = async () => {
    if (notificationBooks.size === 0) {
       return alert('يرجى تحديد الكتب التي تود إرفاقها في الإشعار أولاً.')
    }
    
    setIsPublishing(true)
    addLog('info', 'جاري إرسال إشعار للمستخدمين...')
    try {
      const payload = {
        title: notificationTitle,
        message: notificationMessage,
        books: Array.from(notificationBooks),
        type: 'update'
      }
      
      const res = await fetch(`${API_BASE}/api/v1/admin/notifications/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || data.message || `HTTP ${res.status}`)
      
      addLog('success', 'تم إرسال الإشعار بنجاح!', data.message)
      // Optionally remove just the published books from selectedBooks so they don't stay checked forever:
      const newSelected = new Set(selectedBooks)
      notificationBooks.forEach(b => newSelected.delete(b))
      setSelectedBooks(newSelected)

      // Ensure loading screen stays for at least 1.5 seconds so user sees it
      await new Promise(r => setTimeout(r, 1500))

      // Refresh the library stats so the books are moved to "Published"
      await fetchStats()
      await fetchBooksData()
      
      alert('تم إرسال الإشعار بنجاح وتحديث المكتبة!')
      setShowNotificationModal(false)
      setNotificationMessage('')
      setNotificationBooks(new Set())
      setModalSearchQuery('')
    } catch (err: any) {
      addLog('error', 'فشل في إرسال الإشعار', err.message)
      alert(`خطأ: ${err.message}`)
    } finally {
      setIsPublishing(false)
    }
  }

  const handleUnpublish = async (book: string) => {
    if (!confirm(`هل أنت متأكد من سحب كتاب "${book}" وإلغاء نشره؟ سيتم إخفاؤه من مكتبة المستخدمين فوراً.`)) return

    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/notifications/unpublish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ books: [book] })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || data.message || `HTTP ${res.status}`)
      
      addLog('warning', 'تم سحب الكتاب بنجاح', data.message)
      await fetchStats()
      await fetchBooksData()
      
      // Remove it from selected notification books if it was there
      if (notificationBooks.has(book)) {
        const newSet = new Set(notificationBooks)
        newSet.delete(book)
        setNotificationBooks(newSet)
      }
    } catch (err: any) {
      addLog('error', 'فشل في سحب الكتاب', err.message)
      alert(`خطأ: ${err.message}`)
    }
  }

  const cancelJob = (book: string) => {
    setJobs(prev => prev.map(j => {
      if (j.book === book) {
        if (j.status === 'processing' && activeJobAbortRef.current) {
          activeJobAbortRef.current.abort()
        }
        return { ...j, status: 'cancelled' }
      }
      return j
    }))
  }

  const handleCancel = async () => {
    setStatusMessage('⏳ جاري إيقاف العملية...')
    addLog('warning', 'جاري إيقاف عملية البناء الحالية...')
    if (abortControllerRef.current) abortControllerRef.current.abort()
    if (activeJobAbortRef.current) activeJobAbortRef.current.abort()
    try {
      await fetch(`${API_BASE}/api/v1/admin/build-cancel`, { method: 'POST' })
    } catch (e: any) {
      console.error(e)
    }
  }

  // Format date helper
  const formatDate = (isoStr: string | null) => {
    if (!isoStr) return 'غير محدد'
    try {
      const d = new Date(isoStr)
      return d.toLocaleString('ar-EG', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    } catch {
      return isoStr
    }
  }

  // Filter hierarchy by search query
  const filteredHierarchy = Object.entries(hierarchy).reduce((acc, [domain, madhhabs]) => {
    const filteredMadhhabs: Record<string, string[]> = {}
    Object.entries(madhhabs).forEach(([madhhab, books]) => {
      const matchingBooks = books.filter(b =>
        b.toLowerCase().includes(searchQuery.toLowerCase()) ||
        domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        madhhab.toLowerCase().includes(searchQuery.toLowerCase())
      )
      if (matchingBooks.length > 0) {
        filteredMadhhabs[madhhab] = matchingBooks
      }
    })
    if (Object.keys(filteredMadhhabs).length > 0) {
      acc[domain] = filteredMadhhabs
    }
    return acc
  }, {} as Record<string, Record<string, string[]>>)

  return (
    <div dir="rtl" className="relative flex h-screen w-full flex-col overflow-hidden text-foreground">
      {/* Background */}
      <img
        src={bgDark}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-[#12041f]/90 backdrop-blur-md" />

      {/* Header */}
      <header className="relative z-10 flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-[#1a0730]/60 px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
          >
            →
          </button>
          <div>
            <h1 className="font-display text-lg font-bold text-white">لوحة تحكم المكتبة (Admin Dashboard)</h1>
            <p className="text-xs text-white/60">بناء وتحديث كاش الخرائط وفهارس الدروس</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToIngestion && (
            <button
              onClick={onNavigateToIngestion}
              className="flex items-center gap-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 px-3 py-2 text-xs font-bold transition-all shadow-sm"
              title="الانتقال إلى واجهة استدخال ومعالجة كتب الذكاء الاصطناعي"
            >
              ✨ معالجة الـ AI (Ingestion) ↗
            </button>
          )}

          {/* System Error & Logs Trigger Button */}
          <button
            onClick={() => setShowLogsDrawer(!showLogsDrawer)}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all border ${
              logs.some(l => l.type === 'error')
                ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                : 'bg-white/10 text-white/80 border-white/15 hover:bg-white/20'
            }`}
            title="فتح سجل الأخطاء والنشاط"
          >
            📜 سجل الأخطاء {logs.filter(l => l.type === 'error').length > 0 && `(${logs.filter(l => l.type === 'error').length})`}
          </button>

          <button
            onClick={handleFastSync}
            disabled={syncing}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-bold text-white shadow-lg transition-transform hover:scale-105 disabled:opacity-50"
          >
            {syncing ? '⏳ جاري المزامنة...' : '⚡ إعادة مزامنة سريعة'}
          </button>
          <button
            onClick={handleCheckIntegrity}
            disabled={checkingIntegrity}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-4 py-2 text-xs font-bold text-emerald-300 transition-colors hover:bg-emerald-500/30 disabled:opacity-50"
          >
            {checkingIntegrity ? '⏳ جاري الفحص...' : '🩺 فحص سلامة الشجرة'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 overflow-y-auto p-6 md:p-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

        {/* REAL-TIME LOGS DRAWER / BANNER IF THERE ARE ERRORS */}
        {logs.length > 0 && logs[0].type === 'error' && (
          <div className="flex items-center justify-between rounded-2xl border border-red-500/40 bg-red-950/80 px-5 py-3 text-red-200 shadow-xl backdrop-blur-md animate-in fade-in">
            <div className="flex items-center gap-3">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="text-xs font-bold">{logs[0].message}</p>
                {logs[0].details && <p className="text-[11px] opacity-80">{logs[0].details}</p>}
              </div>
            </div>
            <button
              onClick={() => setShowLogsDrawer(true)}
              className="rounded-lg bg-red-500/20 px-3 py-1 text-xs font-bold hover:bg-red-500/40"
            >
              عرض التفاصيل 🔍
            </button>
          </div>
        )}

        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* Card 1: Total Books */}
          <div className="group relative flex flex-col gap-2 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-sm transition-all hover:bg-white/10 hover:shadow-blue-500/10">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl transition-all group-hover:bg-blue-500/20"></div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white/60">إجمالي الكتب في النظام</span>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-xl text-blue-400">📚</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">
                {allAvailableBooks.length}
              </span>
              <span className="text-xs font-bold text-blue-400">كتاب متاح</span>
            </div>
          </div>

          {/* Card 2: Published Books */}
          <div className="group relative flex flex-col gap-2 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-sm transition-all hover:bg-white/10 hover:shadow-emerald-500/10">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl transition-all group-hover:bg-emerald-500/20"></div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white/60">الكتب المنشورة حالياً</span>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-xl text-emerald-400">🟢</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">
                {stats ? allAvailableBooks.filter(b => stats.book_statuses?.[b] === 'built').length : (loadingStats ? '...' : '0')}
              </span>
              <span className="text-xs font-bold text-emerald-400">عند المستخدمين</span>
            </div>
          </div>

          {/* Card 3: Unpublished Books */}
          <div className="group relative flex flex-col gap-2 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-sm transition-all hover:bg-white/10 hover:shadow-cyan-500/10">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-cyan-500/10 blur-2xl transition-all group-hover:bg-cyan-500/20"></div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white/60">بانتظار الإرسال</span>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-xl text-cyan-400">🔵</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">
                {stats ? allAvailableBooks.filter(b => stats.book_statuses?.[b] === 'built_unpublished').length : (loadingStats ? '...' : '0')}
              </span>
              <span className="text-xs font-bold text-cyan-400">جاهز للإشعار</span>
            </div>
          </div>

          {/* Card 4: Tree Health */}
          <div className="group relative flex flex-col gap-2 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-sm transition-all hover:bg-white/10 hover:shadow-purple-500/10 cursor-pointer" onClick={handleCheckIntegrity}>
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-purple-500/10 blur-2xl transition-all group-hover:bg-purple-500/20"></div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white/60">حالة الفهرس والشجرة</span>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-xl text-purple-400">🩺</span>
            </div>
            <div className="mt-2 flex flex-col">
              {checkingIntegrity ? (
                 <span className="text-lg font-bold text-purple-400 animate-pulse mt-2">جاري الفحص...</span>
              ) : integrityReport ? (
                 <>
                   <span className={`text-xl font-extrabold ${integrityReport.healthy ? 'text-emerald-400' : 'text-red-400'} mt-1`}>
                     {integrityReport.healthy ? 'سليمة 100%' : 'توجد أخطاء!'}
                   </span>
                   <span className="text-[10px] text-white/40 mt-1">{integrityReport.healthy ? 'تم الفحص ولم يعثر على مشاكل' : 'يجب مراجعة الدروس المفقودة'}</span>
                 </>
              ) : (
                 <>
                   <span className="text-lg font-bold text-white/80 mt-1 group-hover:text-purple-300 transition-colors">اضغط للفحص الآن</span>
                   <span className="text-[10px] text-white/40 mt-1">تأكد من سلامة روابط المستخدمين</span>
                 </>
              )}
            </div>
          </div>
          
        </div>

        {/* Top Section: Progress & Actions */}
        <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">حالة البناء والمهام</h2>
              <p className="mt-1 text-sm text-white/60">راقب تقدم بناء الخرائط والفهارس بشكل حيّ</p>
            </div>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleRestoreBackup}
                disabled={isRestoring || polling}
                className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/20 px-4 py-2 text-xs font-bold text-rose-300 transition-colors hover:bg-rose-500/30 disabled:opacity-50"
              >
                {isRestoring ? '⏳ جاري الاستعادة...' : '🛡️ استعادة الشجرة السابقة'}
              </button>
              <button
                onClick={() => {
                  const allBuiltBooks = Object.keys(stats?.book_statuses || {}).filter(b => {
                    const st = stats?.book_statuses?.[b]
                    return st === 'built' || st === 'built_unpublished'
                  }).sort((a, b) => a.localeCompare(b, 'ar')) // Sort alphabetically in Arabic
                  
                  setAvailableNotificationBooks(allBuiltBooks)
                  const unpublished = allBuiltBooks.filter(b => stats?.book_statuses?.[b] === 'built_unpublished')
                  setNotificationBooks(new Set(unpublished))
                  setShowNotificationModal(true)
                }}
                className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl px-5 py-2.5 font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5 text-sm border border-pink-400/30"
              >
                📢 إرسال إشعار للمستخدمين
              </button>
              <button
                onClick={() => handlePreBuild(false)}
                disabled={polling || selectedBooks.size === 0}
                className="brand-gradient rounded-xl px-5 py-2.5 font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                بناء الكتب المحددة ({selectedBooks.size})
              </button>
              <button
                onClick={() => handlePreBuild(true)}
                disabled={polling}
                className="brand-gradient-blue rounded-xl px-5 py-2.5 font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                بناء كل الكتب 
              </button>
              {polling && (
                <button
                  onClick={handleCancel}
                  className="rounded-xl border border-red-500/50 bg-red-500/20 px-5 py-2.5 font-bold text-red-400 transition-colors hover:bg-red-500/30 text-sm"
                >
                  إيقاف البناء 🛑
                </button>
              )}
            </div>
          </div>

          {/* Jobs Queue Container */}
          {jobs.length > 0 && (
            <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-[#0a0212]/80 p-5 border border-white/5 shadow-inner max-h-[400px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="flex justify-between items-center text-sm font-semibold text-white mb-2 sticky top-0 bg-[#0a0212]/90 backdrop-blur-md py-2 z-10 border-b border-white/10">
                <span>{statusMessage}</span>
                <span className="bg-white/10 px-3 py-1 rounded-full text-xs">
                  {jobs.filter(j => j.status === 'done').length} / {jobs.length} مكتمل
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {jobs.map((job) => (
                  <div key={job.book} className="flex flex-col gap-2 rounded-xl bg-white/5 p-4 border border-white/10 transition-colors">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold text-[15px]">{job.book}</span>

                      <div className="flex gap-2 items-center">
                        {(job.status === 'pending' || job.status === 'processing') && (
                          <button
                            onClick={() => cancelJob(job.book)}
                            className="text-xs font-bold px-2 py-1 rounded-md bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-white/50 transition-colors"
                          >
                            إلغاء
                          </button>
                        )}
                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                          job.status === 'done' ? 'bg-green-500/20 text-green-400' :
                          job.status === 'processing' ? 'bg-blue-500/20 text-[#38bdf8]' :
                          job.status === 'error' ? 'bg-red-500/20 text-red-400' :
                          job.status === 'cancelled' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-white/10 text-white/40'
                        }`}>
                          {job.status === 'done' ? 'مكتمل ✅' :
                           job.status === 'processing' ? 'قيد المعالجة ⏳' :
                           job.status === 'error' ? 'حدث خطأ ❌' :
                           job.status === 'cancelled' ? 'تم الإلغاء 🚫' : 'في الانتظار'}
                        </span>
                      </div>
                    </div>

                    {/* Active Progress Bar */}
                    {job.status === 'processing' && (
                      <div className="mt-2 flex flex-col gap-2">
                        <div className="flex justify-between text-xs text-white/50">
                          <span>{buildStatus?.is_building && buildStatus.current_book === job.book ? `${buildStatus.chunks_processed} / ${buildStatus.total_expected} درس` : 'جاري التحميل...'}</span>
                          <span>{job.progress || 0}%</span>
                        </div>
                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
                          <div
                            className="absolute left-0 top-0 h-full bg-gradient-to-l from-[#38bdf8] to-[#10b981] transition-all duration-500 ease-out"
                            style={{ width: `${job.progress || 0}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Done Progress Bar */}
                    {job.status === 'done' && (
                      <div className="mt-2 relative h-1.5 w-full overflow-hidden rounded-full bg-white/10 opacity-50">
                        <div className="absolute left-0 top-0 h-full w-full bg-[#10b981]" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Section: Books Selection with Search & Badges */}
        <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white">قائمة الكتب المتاحة ومؤشرات الحالة</h2>
              {allAvailableBooks.length > 0 && (
                <button
                  onClick={handleSelectAll}
                  className="rounded-lg bg-white/10 px-3 py-1 text-xs font-bold text-white/80 hover:bg-white/20 transition-colors"
                >
                  {selectedBooks.size === allAvailableBooks.length ? 'إلغاء تحديد الكل' : 'تحديد كل الكتب'}
                </button>
              )}
            </div>

            {/* Quick Search Input */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="ابحث عن كتاب، مذهب، أو مجال..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2 text-sm text-white placeholder-white/40 focus:border-[#38bdf8] focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-2.5 text-xs text-white/50 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {loadingBooks ? (
            <div className="py-12 text-center text-white/50 flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#38bdf8] border-t-transparent" />
              <span>جاري تحميل قائمة الكتب وحالة الفهرسة... ⏳</span>
            </div>
          ) : fetchError ? (
            <div className="py-10 text-center flex flex-col items-center gap-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
              <span className="font-semibold">⚠️ {fetchError}</span>
              <p className="text-xs text-red-200/80">تأكد من تشغيل سيرفر الـ Tutor Engine وصحة رابط الاتصال ثم انقر على إعادة المحاولة.</p>
              <button
                onClick={() => { fetchBooksData(); fetchStats(); }}
                className="rounded-xl bg-red-500/20 border border-red-500/40 px-5 py-2 text-xs font-bold text-white hover:bg-red-500/30 transition-colors"
              >
                إعادة المحاولة 🔄
              </button>
            </div>
          ) : Object.keys(filteredHierarchy).length === 0 ? (
            <div className="py-10 text-center text-white/50">لا توجد نتائج مطابقة للبحث.</div>
          ) : (
            <div className="flex flex-col gap-4">
              {Object.entries(filteredHierarchy).map(([domain, madhhabs]) => (
                <details key={domain} className="group rounded-2xl border border-white/10 bg-black/20 transition-all open:bg-black/40">
                  <summary className="flex cursor-pointer select-none items-center justify-between p-5 list-none [&::-webkit-details-marker]:hidden">
                    <h3 className="font-display text-xl text-[#38bdf8]">{domain}</h3>
                    <span className="text-white/50 transition-transform group-open:rotate-180">▼</span>
                  </summary>

                  <div className="flex flex-col gap-4 px-5 pb-5">
                    {Object.entries(madhhabs).map(([madhhab, books]) => (
                      <details key={madhhab} className="group/madhhab rounded-xl border border-white/5 bg-white/5 transition-all open:bg-white/10">
                        <summary className="flex cursor-pointer select-none items-center justify-between p-4 list-none [&::-webkit-details-marker]:hidden">
                          <h4 className="font-bold text-white/90">{madhhab}</h4>
                          <span className="text-sm text-white/40 transition-transform group-open/madhhab:rotate-180">▼</span>
                        </summary>

                        <div className="flex flex-col gap-1 border-t border-white/5 px-3 py-3">
                          {books.map(book => {
                            const status = stats?.book_statuses?.[book] || 'not_built'
                            return (
                              <label key={book} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/10">
                                <input
                                  type="checkbox"
                                  checked={selectedBooks.has(book)}
                                  onChange={() => toggleBook(book)}
                                  className="h-4 w-4 rounded border-white/20 bg-transparent text-[#38bdf8] focus:ring-[#38bdf8]/30"
                                />
                                <span className="text-[15px] font-medium text-white/90">{book}</span>

                                {/* Status Badge */}
                                <div className="mr-auto">
                                  {status === 'built' && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                      🟢 مبني ومتاح (تم إرسال إشعار)
                                    </span>
                                  )}
                                  {status === 'built_unpublished' && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400">
                                      <span className="h-2 w-2 rounded-full bg-blue-400" />
                                      🔵 مبني (في الانتظار للإرسال)
                                    </span>
                                  )}
                                  {status === 'processing' && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">
                                      <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                                      🟡 قيد التجهيز والبناء...
                                    </span>
                                  )}
                                  {status === 'not_built' && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400">
                                      <span className="h-2 w-2 rounded-full bg-red-400" />
                                      🔴 لم يتم بناؤه بعد
                                    </span>
                                  )}
                                </div>
                              </label>
                            )
                          })}
                        </div>
                      </details>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* SYSTEM LOGS & ERROR DRAWER MODAL */}
      {showLogsDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="flex w-full max-w-2xl flex-col gap-4 rounded-3xl border border-white/20 bg-[#1a0730] p-6 text-white shadow-2xl max-h-[80vh]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📜</span>
                <h3 className="text-lg font-bold">سجل أخطاء ونشاط النظام (System Error & Activity Log)</h3>
              </div>
              <button
                onClick={() => setShowLogsDrawer(false)}
                className="text-white/50 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-1 font-mono text-xs">
              {logs.length === 0 ? (
                <div className="py-10 text-center text-white/40">لا توجد سجلات أخطاء أو تنبيهات حتى الآن.</div>
              ) : (
                logs.map(log => (
                  <div
                    key={log.id}
                    className={`flex flex-col gap-1 rounded-xl p-3 border ${
                      log.type === 'error' ? 'bg-red-500/15 border-red-500/30 text-red-200' :
                      log.type === 'warning' ? 'bg-amber-500/15 border-amber-500/30 text-amber-200' :
                      log.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200' :
                      'bg-white/5 border-white/10 text-white/80'
                    }`}
                  >
                    <div className="flex justify-between items-center font-bold">
                      <span>
                        {log.type === 'error' ? '❌ [ERROR]' :
                         log.type === 'warning' ? '⚠️ [WARNING]' :
                         log.type === 'success' ? '✅ [SUCCESS]' : 'ℹ️ [INFO]'} {log.message}
                      </span>
                      <span className="text-[10px] opacity-60 font-sans">{log.timestamp}</span>
                    </div>
                    {log.details && (
                      <p className="mt-1 text-[11px] opacity-80 break-words font-sans bg-black/30 p-2 rounded-lg">
                        {log.details}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-between items-center border-t border-white/10 pt-3">
              <button
                onClick={() => setLogs([])}
                className="text-xs text-white/50 hover:text-red-400 transition-colors"
              >
                مسح السجل 🗑️
              </button>
              <button
                onClick={() => setShowLogsDrawer(false)}
                className="rounded-xl brand-gradient px-5 py-2 font-bold text-white text-xs"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Publish Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="flex w-full max-w-lg flex-col gap-4 rounded-3xl border border-pink-500/30 bg-[#1a0730] p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl text-pink-400">📢</span>
                <h3 className="text-lg font-bold">نشر إشعار جديد للمستخدمين</h3>
              </div>
              <button onClick={() => setShowNotificationModal(false)} className="text-white/50 hover:text-white">✕</button>
            </div>
            
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-white/70">عنوان الإشعار</label>
                <input 
                  type="text" 
                  value={notificationTitle}
                  onChange={e => setNotificationTitle(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2 text-sm text-white focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-white/70">تفاصيل التحديث (Changelog) - ستظهر للمستخدمين لمعرفة ما الجديد</label>
                <textarea 
                  value={notificationMessage}
                  onChange={e => setNotificationMessage(e.target.value)}
                  placeholder="مثال: تم تصحيح أخطاء إملائية في باب الصيام، وإضافة فصول جديدة لكتاب التوحيد..."
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white focus:border-pink-500 focus:outline-none min-h-[80px]"
                />
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-white/70">الكتب المرفقة في الإشعار ({notificationBooks.size} من {availableNotificationBooks.length})</label>
                
                {/* Search Bar */}
                <div className="relative mb-2">
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/40">🔍</span>
                  <input
                    type="text"
                    placeholder="ابحث عن كتاب محدد..."
                    value={modalSearchQuery}
                    onChange={(e) => setModalSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 pr-10 text-sm text-white placeholder-white/40 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
                  />
                </div>

                {availableNotificationBooks.length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-sm text-white/80">
                    <span className="text-red-400 text-xs p-2 block text-center">⚠️ لا يوجد أي كتب مبنية حالياً!</span>
                  </div>
                ) : availableNotificationBooks.filter(b => b.toLowerCase().includes(modalSearchQuery.toLowerCase())).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center text-white/50">
                    <span className="text-4xl mb-2">📚</span>
                    <p>{modalSearchQuery ? 'لم يتم العثور على نتائج للبحث' : 'لا توجد كتب مبنية لإرسال إشعارات بها'}</p>
                  </div>
                ) : (
                  isPublishing ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4 animate-in fade-in zoom-in-95">
                      <div className="h-14 w-14 animate-spin rounded-full border-b-4 border-t-4 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
                      <div className="flex flex-col items-center gap-1">
                        <h4 className="text-lg font-bold text-white">جاري إرسال الكتب للمستخدمين...</h4>
                        <p className="text-sm text-white/50">يرجى الانتظار بضع ثوانٍ</p>
                      </div>
                    </div>
                  ) : (
                  <div className="animate-in fade-in flex flex-col gap-3 max-h-[300px] overflow-y-auto">
                    {/* Unpublished Container */}
                    {availableNotificationBooks.filter(b => stats?.book_statuses?.[b] === 'built_unpublished' && b.toLowerCase().includes(modalSearchQuery.toLowerCase())).length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold text-[#38bdf8] px-1">🔵 كتب تم بناءها ولم ترسل:</span>
                        <div className="max-h-40 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-2 text-sm text-white/80">
                          <div className="flex flex-col gap-1">
                            {availableNotificationBooks.filter(b => stats?.book_statuses?.[b] === 'built_unpublished' && b.toLowerCase().includes(modalSearchQuery.toLowerCase())).map(b => (
                              <label key={b} className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors cursor-pointer hover:bg-white/10`}>
                                <input
                                  type="checkbox"
                                  checked={notificationBooks.has(b)}
                                  onChange={() => {
                                    const newSet = new Set(notificationBooks)
                                    if (newSet.has(b)) newSet.delete(b)
                                    else newSet.add(b)
                                    setNotificationBooks(newSet)
                                  }}
                                  className="h-4 w-4 rounded border-white/20 bg-transparent text-[#38bdf8] focus:ring-[#38bdf8]/30"
                                />
                                <span className="text-[14px] text-white/90">{b}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Published Container */}
                    {availableNotificationBooks.filter(b => stats?.book_statuses?.[b] === 'built' && b.toLowerCase().includes(modalSearchQuery.toLowerCase())).length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold text-emerald-400 px-1">🟢 كتب تم بناءها وأرسلت مسبقاً:</span>
                        <div className="max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-2 text-sm text-white/80 pr-1">
                          <div className="flex flex-col gap-2">
                            {(() => {
                              const publishedBooks = availableNotificationBooks.filter(b => stats?.book_statuses?.[b] === 'built' && b.toLowerCase().includes(modalSearchQuery.toLowerCase()))
                              const grouped = publishedBooks.reduce((acc, book) => {
                                const { domain, madhhab } = getBookLocation(book)
                                if (!acc[domain]) acc[domain] = {}
                                if (!acc[domain][madhhab]) acc[domain][madhhab] = []
                                acc[domain][madhhab].push(book)
                                return acc
                              }, {} as Record<string, Record<string, string[]>>)

                              return Object.entries(grouped).map(([domain, madhhabs]) => (
                                <div key={domain} className="flex flex-col overflow-hidden rounded-lg border border-white/5 bg-black/20 shrink-0">
                                  <button
                                    onClick={() => {
                                      const newExpanded = new Set(expandedDomains)
                                      if (newExpanded.has(domain)) newExpanded.delete(domain)
                                      else newExpanded.add(domain)
                                      setExpandedDomains(newExpanded)
                                    }}
                                    className="flex w-full items-center justify-between bg-white/5 px-3 py-2 text-right transition-colors hover:bg-white/10"
                                  >
                                    <span className="font-bold text-white/90">{domain} <span className="text-white/40 text-xs">({Object.values(madhhabs).flat().length})</span></span>
                                    <svg className={`h-4 w-4 text-white/50 transition-transform ${expandedDomains.has(domain) ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                  </button>
                                  {(expandedDomains.has(domain) || modalSearchQuery.trim() !== '') && (
                                    <div className="flex flex-col gap-1 p-1 bg-black/10">
                                      {Object.entries(madhhabs).map(([madhhab, books]) => (
                                        <div key={madhhab} className="flex flex-col">
                                          {madhhab !== 'غير محدد' && (
                                            <span className="text-[11px] font-bold text-white/40 px-3 pt-2 pb-1">{madhhab}</span>
                                          )}
                                          <div className="flex flex-col gap-1">
                                            {books.map(b => (
                                              <div key={b} className="flex items-center justify-between gap-3 rounded-md px-3 py-1.5 transition-colors hover:bg-white/10">
                                                <label className="flex items-center gap-3 cursor-pointer flex-1">
                                                  <input
                                                    type="checkbox"
                                                    checked={notificationBooks.has(b)}
                                                    onChange={() => {
                                                      const newSet = new Set(notificationBooks)
                                                      if (newSet.has(b)) newSet.delete(b)
                                                      else newSet.add(b)
                                                      setNotificationBooks(newSet)
                                                    }}
                                                    className="h-3.5 w-3.5 rounded border-white/20 bg-transparent text-emerald-500 focus:ring-emerald-500/30"
                                                  />
                                                  <span className="text-[13px] text-white/80">{b}</span>
                                                </label>
                                                <button
                                                  onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    handleUnpublish(b)
                                                  }}
                                                  className="text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded hover:bg-red-500/30 hover:text-red-300 transition-colors"
                                                  title="سحب الكتاب وإلغاء نشره"
                                                >
                                                  سحب ⏪
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
              <button disabled={isPublishing} onClick={() => {
                setShowNotificationModal(false)
                setModalSearchQuery('')
              }} className="rounded-xl px-4 py-2 text-sm font-bold text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed">إلغاء</button>
              <button 
                onClick={handlePublishNotification}
                disabled={notificationBooks.size === 0 || isPublishing}
                className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isPublishing ? '⏳ جاري إرسال الإشعارات وتحديث المكتبة...' : 'إرسال الآن 🚀'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Build Confirmation Modal */}
      {showBuildConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="flex w-full max-w-lg flex-col gap-4 rounded-3xl border border-white/20 bg-[#1a0730] p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl text-[#38bdf8]">⚙️</span>
                <h3 className="text-lg font-bold">تأكيد عملية البناء</h3>
              </div>
              <button onClick={() => setShowBuildConfirmModal(false)} className="text-white/50 hover:text-white">✕</button>
            </div>
            
            <div className="flex flex-col gap-2 py-2">
              <p className="text-sm text-white/70">
                سيتم بناء <strong className="text-white">{booksToConfirm.length}</strong> كتاب. يمكنك مراجعة القائمة أدناه وإلغاء تحديد أي كتاب لا ترغب في بنائه الآن.
              </p>

              <div className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-2 flex flex-col gap-2">
                {booksToConfirm.length === 0 ? (
                   <span className="p-2 text-red-400 text-xs text-center shrink-0">لم يتبق أي كتب للبناء!</span>
                ) : (
                  (() => {
                    const grouped = booksToConfirm.reduce((acc, book) => {
                      const { domain, madhhab } = getBookLocation(book)
                      if (!acc[domain]) acc[domain] = {}
                      if (!acc[domain][madhhab]) acc[domain][madhhab] = []
                      acc[domain][madhhab].push(book)
                      return acc
                    }, {} as Record<string, Record<string, string[]>>)

                    return Object.entries(grouped).map(([domain, madhhabs]) => (
                      <div key={`build_${domain}`} className="flex flex-col overflow-hidden rounded-lg border border-white/5 bg-black/20 shrink-0">
                        <button
                          onClick={() => {
                            const newExpanded = new Set(expandedDomains)
                            if (newExpanded.has(`build_${domain}`)) newExpanded.delete(`build_${domain}`)
                            else newExpanded.add(`build_${domain}`)
                            setExpandedDomains(newExpanded)
                          }}
                          className="flex w-full items-center justify-between bg-white/5 px-3 py-2 text-right transition-colors hover:bg-white/10"
                        >
                          <span className="font-bold text-white/90">{domain} <span className="text-white/40 text-xs">({Object.values(madhhabs).flat().length})</span></span>
                          <svg className={`h-4 w-4 text-white/50 transition-transform ${expandedDomains.has(`build_${domain}`) ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {(expandedDomains.has(`build_${domain}`) || modalSearchQuery.trim() !== '') && (
                          <div className="flex flex-col gap-1 p-1 bg-black/10">
                            {Object.entries(madhhabs).map(([madhhab, books]) => (
                              <div key={`build_${domain}_${madhhab}`} className="flex flex-col">
                                {madhhab !== 'غير محدد' && (
                                  <span className="text-[11px] font-bold text-white/40 px-3 pt-2 pb-1">{madhhab}</span>
                                )}
                                <div className="flex flex-col gap-1">
                                  {books.map(book => (
                                    <label key={book} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-white/10">
                                      <span className="text-[13px] text-white/90 truncate pr-2">{book}</span>
                                      <button 
                                        onClick={(e) => {
                                          e.preventDefault()
                                          setBooksToConfirm(prev => prev.filter(b => b !== book))
                                        }}
                                        className="text-red-400/70 hover:text-red-400 p-1 bg-red-400/10 rounded-md text-xs"
                                      >
                                        إزالة ✕
                                      </button>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  })()
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
              <button onClick={() => {
                setShowBuildConfirmModal(false)
                setModalSearchQuery('')
              }} className="rounded-xl px-4 py-2 text-sm font-bold text-white/60 hover:text-white hover:bg-white/10">إلغاء</button>
              <button 
                onClick={handleBuildConfirmed}
                disabled={booksToConfirm.length === 0}
                className="rounded-xl brand-gradient px-6 py-2 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 disabled:opacity-50"
              >
                تأكيد وبدء البناء ⚡
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tree Integrity Modal */}
      {integrityReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="flex w-full max-w-lg flex-col gap-4 rounded-3xl border border-white/20 bg-[#1a0730] p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold">🩺 تقرير صحة وسلامة الشجرة</h3>
              <button
                onClick={() => setIntegrityReport(null)}
                className="text-white/50 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3 py-2">
              <div className={`rounded-xl p-4 font-semibold text-sm ${integrityReport.healthy ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                {integrityReport.message}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-white/5 p-3">
                  <span className="text-white/50">إجمالي دروس الشجرة:</span>
                  <div className="mt-1 text-lg font-bold">{integrityReport.total_chunks_in_tree || 0}</div>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <span className="text-white/50">الدروس المفحوصة:</span>
                  <div className="mt-1 text-lg font-bold">{integrityReport.sample_checked || 0}</div>
                </div>
                <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
                  <span>الدروس السليمة:</span>
                  <div className="mt-1 text-lg font-bold">{integrityReport.valid_chunks || 0}</div>
                </div>
                <div className="rounded-xl bg-red-500/10 p-3 text-red-400">
                  <span>الدروس المفقودة:</span>
                  <div className="mt-1 text-lg font-bold">{integrityReport.missing_chunks || 0}</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIntegrityReport(null)}
              className="mt-2 rounded-xl brand-gradient py-2.5 font-bold text-white"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
