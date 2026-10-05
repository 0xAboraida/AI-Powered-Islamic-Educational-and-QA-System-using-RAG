import { useState, useEffect, useMemo } from 'react'
import {
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Sparkles,
  BookOpen,
  Folder,
  Layers,
  ChevronDown,
  ChevronLeft,
  RotateCcw,
  Save,
  Check,
  Filter,
  Info
} from 'lucide-react'

export interface TurathVisibilityConfig {
  mode: 'all' | 'custom'
  allowedBookIds: string[]
  hiddenBookIds: string[]
  lastUpdated?: string
}

interface TurathBook {
  title: string
  author?: string
  turath_id: string | number
  is_book?: boolean
  is_turath?: boolean
  category?: string
}

interface TurathCategory {
  title: string
  children: TurathBook[]
}

const STORAGE_KEY = 'zad_turath_visibility_config'

// Top classical books preset IDs
const TOP_CLASSICS_KEYWORDS = [
  'صحيح البخاري',
  'صحيح مسلم',
  'سنن أبي داود',
  'جامع الترمذي',
  'سنن النسائي',
  'سنن ابن ماجه',
  'موطأ مالك',
  'مسند أحمد',
  'تفسير ابن كثير',
  'جامع البيان عن تأويل آي القرآن',
  'تفسير الطبري',
  'تفسير القرطبي',
  'تيسير الكريم الرحمن',
  'فتح الباري',
  'رياض الصالحين',
  'الأذكار للنووي',
  'منهاج الطالبين',
  'المغني لابن قدامة',
  'بداية المجتهد',
  'زاد المعاد',
  'مدارج السالكين',
  'العقيدة الواسطية',
  'العقيدة الطحاوية',
  'سير أعلام النبلاء',
  'البداية والنهاية',
  'شرح النووي على مسلم',
  'بلوغ المرام',
  'عمدة الأحكام'
]

export default function TurathAdminManager({
  librarySource,
  onSwitchLibrarySource,
  onNotify
}: {
  librarySource: 'mongo' | 'turath'
  onSwitchLibrarySource: (source: 'mongo' | 'turath') => void
  onNotify?: (type: 'info' | 'success' | 'warning' | 'error', msg: string) => void
}) {
  const [categories, setCategories] = useState<TurathCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'visible' | 'hidden'>('all')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Visibility Config State
  const [config, setConfig] = useState<TurathVisibilityConfig>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.error(e)
    }
    return {
      mode: 'all',
      allowedBookIds: [],
      hiddenBookIds: []
    }
  })

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [savedSuccessAlert, setSavedSuccessAlert] = useState(false)

  // Load Turath Catalog
  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true)
        const res = await fetch('/data/turath_catalog.json')
        if (res.ok) {
          const data: TurathCategory[] = await res.json()
          setCategories(data)
        }
      } catch (err) {
        console.error('Failed to load turath_catalog.json:', err)
      } finally {
        setLoading(false)
      }
    }
    loadCatalog()
  }, [])

  // Flattened all books
  const allBooks = useMemo(() => {
    const list: TurathBook[] = []
    categories.forEach(cat => {
      cat.children?.forEach(b => {
        list.push({ ...b, category: cat.title })
      })
    })
    return list
  }, [categories])

  // Fast set of allowed and hidden IDs
  const allowedSet = useMemo(() => new Set(config.allowedBookIds.map(String)), [config.allowedBookIds])
  const hiddenSet = useMemo(() => new Set(config.hiddenBookIds.map(String)), [config.hiddenBookIds])

  // Helper: check if a book is visible
  const isBookVisible = (bookId: string | number) => {
    const idStr = String(bookId)
    if (config.mode === 'all') {
      return !hiddenSet.has(idStr)
    } else {
      return allowedSet.has(idStr)
    }
  }

  // Count metrics
  const metrics = useMemo(() => {
    const total = allBooks.length
    if (total === 0) return { total: 0, visible: 0, hidden: 0, totalCategories: 0 }

    let visible = 0
    if (config.mode === 'all') {
      visible = total - hiddenSet.size
    } else {
      visible = allowedSet.size
    }
    const hidden = Math.max(0, total - visible)
    return {
      total,
      visible,
      hidden,
      totalCategories: categories.length
    }
  }, [allBooks, config.mode, allowedSet, hiddenSet, categories.length])

  // Toggle single book visibility
  const handleToggleBook = (bookId: string | number) => {
    const idStr = String(bookId)
    setHasUnsavedChanges(true)

    if (config.mode === 'all') {
      // In 'all' mode, toggling off adds to hiddenSet; toggling on removes from hiddenSet
      const nextHidden = new Set(hiddenSet)
      if (nextHidden.has(idStr)) {
        nextHidden.delete(idStr)
      } else {
        nextHidden.add(idStr)
      }
      setConfig(prev => ({
        ...prev,
        hiddenBookIds: Array.from(nextHidden)
      }))
    } else {
      // In 'custom' mode, toggling on adds to allowedSet; toggling off removes from allowedSet
      const nextAllowed = new Set(allowedSet)
      if (nextAllowed.has(idStr)) {
        nextAllowed.delete(idStr)
      } else {
        nextAllowed.add(idStr)
      }
      setConfig(prev => ({
        ...prev,
        allowedBookIds: Array.from(nextAllowed)
      }))
    }
  }

  // Toggle Category
  const handleToggleCategory = (category: TurathCategory, enableAll: boolean) => {
    setHasUnsavedChanges(true)
    const catBookIds = (category.children || []).map(b => String(b.turath_id))

    if (config.mode === 'all') {
      const nextHidden = new Set(hiddenSet)
      catBookIds.forEach(id => {
        if (enableAll) {
          nextHidden.delete(id)
        } else {
          nextHidden.add(id)
        }
      })
      setConfig(prev => ({
        ...prev,
        hiddenBookIds: Array.from(nextHidden)
      }))
    } else {
      const nextAllowed = new Set(allowedSet)
      catBookIds.forEach(id => {
        if (enableAll) {
          nextAllowed.add(id)
        } else {
          nextAllowed.delete(id)
        }
      })
      setConfig(prev => ({
        ...prev,
        allowedBookIds: Array.from(nextAllowed)
      }))
    }
  }

  // Preset: Show All Books
  const handleApplyShowAll = () => {
    setHasUnsavedChanges(true)
    setConfig({
      mode: 'all',
      allowedBookIds: [],
      hiddenBookIds: []
    })
    if (onNotify) onNotify('info', 'تم ضبط وضع العرض: إظهار جميع كتب تراث (8,589 كتاب).')
  }

  // Preset: Apply Top Classics
  const handleApplyTopClassics = () => {
    setHasUnsavedChanges(true)
    const matchingIds: string[] = []

    allBooks.forEach(b => {
      const title = b.title.trim()
      const match = TOP_CLASSICS_KEYWORDS.some(k => title.includes(k))
      if (match) {
        matchingIds.push(String(b.turath_id))
      }
    })

    setConfig({
      mode: 'custom',
      allowedBookIds: matchingIds,
      hiddenBookIds: []
    })
    if (onNotify) onNotify('success', `تم تطبيق حزمة أمهات الكتب الكبرى (${matchingIds.length} كتاب محقق).`)
  }

  // Preset: Hide All / Clear
  const handleClearAll = () => {
    setHasUnsavedChanges(true)
    setConfig({
      mode: 'custom',
      allowedBookIds: [],
      hiddenBookIds: []
    })
    if (onNotify) onNotify('warning', 'تم إلغاء تفعيل جميع الكتب.')
  }

  // Save changes and publish to users
  const handleSaveAndPublish = () => {
    const finalConfig: TurathVisibilityConfig = {
      ...config,
      lastUpdated: new Date().toISOString()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(finalConfig))
    setHasUnsavedChanges(false)
    setSavedSuccessAlert(true)
    setTimeout(() => setSavedSuccessAlert(false), 3500)

    // Notify study mode live
    window.dispatchEvent(new CustomEvent('zad_turath_visibility_changed', { detail: finalConfig }))
    window.dispatchEvent(new Event('zad_library_updated'))

    if (onNotify) {
      onNotify('success', 'تم حفظ التعديلات ونشر فهارس تراث المحدثة للمستخدمين فوراً!')
    }
  }

  // Filter Categories & Books for UI
  const filteredCategories = useMemo(() => {
    return categories
      .filter(cat => selectedCategoryFilter === 'all' || cat.title === selectedCategoryFilter)
      .map(cat => {
        let books = cat.children || []

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          books = books.filter(
            b =>
              b.title.toLowerCase().includes(q) ||
              (b.author && b.author.toLowerCase().includes(q)) ||
              cat.title.toLowerCase().includes(q)
          )
        }

        // Status filter
        if (statusFilter === 'visible') {
          books = books.filter(b => isBookVisible(b.turath_id))
        } else if (statusFilter === 'hidden') {
          books = books.filter(b => !isBookVisible(b.turath_id))
        }

        return {
          ...cat,
          children: books
        }
      })
      .filter(cat => cat.children.length > 0)
  }, [categories, selectedCategoryFilter, searchQuery, statusFilter, config, allowedSet, hiddenSet])

  const toggleCategoryExpand = (catTitle: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(catTitle)) next.delete(catTitle)
      else next.add(catTitle)
      return next
    })
  }

  const handleExpandAll = () => {
    setExpandedCategories(new Set(filteredCategories.map(c => c.title)))
  }

  const handleCollapseAll = () => {
    setExpandedCategories(new Set())
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in">
      {/* Turath Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-sky-950/40 border border-sky-500/20 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/20 text-lg text-sky-300 border border-sky-500/30">
            🏛️
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white">إدارة ظهور محتوى مكتبة تراث الكبرى</h3>
              <span className="rounded-full bg-sky-400/20 px-2.5 py-0.5 text-[10px] font-bold text-sky-300 border border-sky-400/30">
                8,589 كتاب محقق
              </span>
            </div>
            <p className="mt-0.5 text-xs text-white/60">تحكم في الكتب التي تظهر في فهارس الطلاب لوضع الدراسة عبر 40 مجالاً إسلامياً</p>
          </div>
        </div>

        <div>
          {librarySource !== 'turath' ? (
            <button
              type="button"
              onClick={() => onSwitchLibrarySource('turath')}
              className="flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-sky-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              <span>⚡ اعتماد تراث كمحرك نشط</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-1.5 text-xs font-bold text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>المحرك المعتمد حالياً</span>
            </div>
          )}
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Books */}
        <div className="group relative flex flex-col gap-2 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white/60">إجمالي كتب تراث في النظام</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/20 text-lg text-sky-400">
              📚
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {metrics.total.toLocaleString('ar-EG')}
            </span>
            <span className="text-xs text-white/50">كتاب أصلي</span>
          </div>
          <span className="text-[11px] text-sky-300/80">شاملة 40 مجالاً علمياً وفنياً</span>
        </div>

        {/* Visible Books */}
        <div className="group relative flex flex-col gap-2 overflow-hidden rounded-3xl border border-emerald-500/20 bg-emerald-950/20 p-5 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300/80">الكتب المعروضة للمستخدمين</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-lg text-emerald-400">
              <Eye size={18} />
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">
              {metrics.visible.toLocaleString('ar-EG')}
            </span>
            <span className="text-xs text-emerald-400/60">
              ({metrics.total > 0 ? Math.round((metrics.visible / metrics.total) * 100) : 0}%)
            </span>
          </div>
          <span className="text-[11px] text-emerald-400/80">
            {config.mode === 'all' ? 'وضع الشمول الكامل (الكل متاح)' : 'وضع مخصص ومحدد'}
          </span>
        </div>

        {/* Hidden Books */}
        <div className="group relative flex flex-col gap-2 overflow-hidden rounded-3xl border border-amber-500/20 bg-amber-950/20 p-5 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300/80">الكتب المحجوبة / المخفية</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-lg text-amber-400">
              <EyeOff size={18} />
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">
              {metrics.hidden.toLocaleString('ar-EG')}
            </span>
            <span className="text-xs text-amber-400/60">كتاب محجوب</span>
          </div>
          <span className="text-[11px] text-amber-400/80">لا تظهر في شجرة البحث للطلاب</span>
        </div>

        {/* Domains Count */}
        <div className="group relative flex flex-col gap-2 overflow-hidden rounded-3xl border border-purple-500/20 bg-purple-950/20 p-5 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-300/80">المجالات والتصنيفات</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 text-lg text-purple-400">
              <Layers size={18} />
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-purple-300">
              {metrics.totalCategories}
            </span>
            <span className="text-xs text-purple-300/60">مجال إسلامي</span>
          </div>
          <span className="text-[11px] text-purple-400/80">تفسير، حديث، فقه، لغة، عقيدة</span>
        </div>
      </div>

      {/* TOOLBAR: PRESETS & QUICK CONTROLS */}
      <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/40 p-5 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white/80">حزم التخصيص السريعة:</span>
            
            <button
              type="button"
              onClick={handleApplyShowAll}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all border ${
                config.mode === 'all' && config.hiddenBookIds.length === 0
                  ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/30'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border-white/10'
              }`}
            >
              <CheckCircle2 size={14} />
              <span>إظهار جميع كتب تراث (8,589)</span>
            </button>

            <button
              type="button"
              onClick={handleApplyTopClassics}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-3 py-1.5 text-xs font-bold transition-all shadow-sm"
              title="تفعيل كتب الصحاح والسنن والتفاسير الكبرى وأمهات الفقه"
            >
              <Sparkles size={14} />
              <span>🌟 حزمة أمهات الكتب الكبرى</span>
            </button>

            <button
              type="button"
              onClick={handleClearAll}
              className="flex items-center gap-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-300 border border-white/10 hover:border-red-500/30 px-3 py-1.5 text-xs font-bold transition-all"
            >
              <XCircle size={14} />
              <span>إلغاء تفعيل الكل</span>
            </button>
          </div>

          {/* Save & Publish Button */}
          <div className="flex items-center gap-3">
            {savedSuccessAlert && (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 animate-in fade-in">
                <Check size={14} /> تم الحفظ والنشر بنجاح!
              </span>
            )}

            <button
              type="button"
              onClick={handleSaveAndPublish}
              disabled={!hasUnsavedChanges}
              className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition-all shadow-lg ${
                hasUnsavedChanges
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white ring-2 ring-emerald-400/40 hover:scale-[1.03] active:scale-[0.98]'
                  : 'bg-white/10 text-white/40 cursor-not-allowed border border-white/5'
              }`}
            >
              <Save size={15} />
              <span>{hasUnsavedChanges ? '💾 حفظ ونشر التعديلات للمستخدمين' : 'التعديلات محفوظة'}</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-white/10">
          {/* Instant Search input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ابحث فوراً بالاسم أو اسم المؤلف (مثل: صحيح البخاري، ابن تيمية، الشافعي)..."
              className="w-full rounded-2xl border border-white/15 bg-white/5 py-2.5 pr-10 pl-4 text-xs text-white placeholder-white/40 outline-none transition-all focus:border-sky-400 focus:bg-white/10 focus:ring-1 focus:ring-sky-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
              >
                ×
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={15} className="text-white/50 shrink-0" />
            <select
              value={selectedCategoryFilter}
              onChange={e => setSelectedCategoryFilter(e.target.value)}
              className="rounded-2xl border border-white/15 bg-slate-900/90 py-2.5 px-3 text-xs text-white outline-none focus:border-sky-400 w-full sm:w-56"
            >
              <option value="all">كل التصنيفات (40 مجال)</option>
              {categories.map(cat => (
                <option key={cat.title} value={cat.title}>
                  {cat.title} ({cat.children?.length || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 rounded-2xl bg-white/5 p-1 border border-white/10">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition-all ${
                statusFilter === 'all' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              الكل
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('visible')}
              className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition-all ${
                statusFilter === 'visible'
                  ? 'bg-emerald-500/30 text-emerald-300'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              المفعل
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('hidden')}
              className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition-all ${
                statusFilter === 'hidden'
                  ? 'bg-amber-500/30 text-amber-300'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              المخفي
            </button>
          </div>

          {/* Quick Expand / Collapse All */}
          <div className="flex items-center gap-1 rounded-2xl bg-white/5 p-1 border border-white/10 mr-auto sm:mr-0">
            <button
              type="button"
              onClick={handleExpandAll}
              className="rounded-xl px-2.5 py-1 text-[11px] font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all"
              title="توسيع كافة المجالات لعرض الكتب"
            >
              توسيع الكل
            </button>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="rounded-xl px-2.5 py-1 text-[11px] font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all"
              title="طي كافة المجالات"
            >
              طي الكل
            </button>
          </div>
        </div>
      </div>

      {/* BOOKS LIST BY CATEGORY */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-400 border-t-transparent mb-3"></div>
          <p className="text-sm font-bold text-white/70">جاري قراءة وتحليل مكتبة تراث الشاملة (8,589 كتاب)...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-white/10 bg-white/5">
          <Info size={32} className="text-white/40 mb-2" />
          <p className="text-sm font-bold text-white/70">لم يتم العثور على أي كتب مطابقة لمعايير البحث الحالية.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setSelectedCategoryFilter('all')
              setStatusFilter('all')
            }}
            className="mt-3 text-xs text-sky-400 hover:underline"
          >
            إعادة ضبط الفلاتر والبحث
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredCategories.map(cat => {
            const isExpanded = expandedCategories.has(cat.title) || (searchQuery.trim() !== '') || (selectedCategoryFilter !== 'all')
            const catBooks = cat.children || []
            const visibleCount = catBooks.filter(b => isBookVisible(b.turath_id)).length
            const isAllVisible = visibleCount === catBooks.length
            const isNoneVisible = visibleCount === 0

            return (
              <div
                key={cat.title}
                className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl transition-all"
              >
                {/* Category Header */}
                <div
                  onClick={() => toggleCategoryExpand(cat.title)}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 px-6 bg-white/[0.03] hover:bg-white/[0.07] cursor-pointer transition-colors border-b border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/20 text-sky-300">
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronLeft size={18} />}
                    </span>
                    <div>
                      <h3 className="font-bold text-sm text-white flex items-center gap-2">
                        <span>{cat.title}</span>
                        <span className="text-[11px] font-normal text-white/50">
                          ({visibleCount} من {catBooks.length} كتاب معروض)
                        </span>
                      </h3>
                    </div>
                  </div>

                  {/* Category Quick Batch Actions */}
                  <div
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-2"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleCategory(cat, true)}
                      disabled={isAllVisible}
                      className="rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 px-3 py-1 text-[11px] font-bold text-emerald-300 transition-all disabled:opacity-40"
                    >
                      إظهار الكل في هذا التصنيف
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleCategory(cat, false)}
                      disabled={isNoneVisible}
                      className="rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 px-3 py-1 text-[11px] font-bold text-amber-300 transition-all disabled:opacity-40"
                    >
                      إخفاء الكل في هذا التصنيف
                    </button>
                  </div>
                </div>

                {/* Books Inside Category */}
                {isExpanded && (
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 bg-black/20">
                    {catBooks.map(book => {
                      const visible = isBookVisible(book.turath_id)
                      return (
                        <div
                          key={String(book.turath_id)}
                          onClick={() => handleToggleBook(book.turath_id)}
                          className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                            visible
                              ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-400/50'
                              : 'bg-white/[0.02] border-white/5 opacity-60 hover:opacity-100 hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 text-xs text-white/70">
                              <BookOpen size={14} className={visible ? 'text-emerald-400' : 'text-white/40'} />
                            </span>
                            <div className="truncate flex-1">
                              <p className={`text-xs font-bold truncate ${visible ? 'text-white' : 'text-white/70'}`}>
                                {book.title}
                              </p>
                              {book.author && (
                                <p className="text-[10px] text-white/50 truncate">
                                  {book.author}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Visibility Toggle Switch / Pill */}
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation()
                              handleToggleBook(book.turath_id)
                            }}
                            className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-bold transition-all shrink-0 ${
                              visible
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-white/5 text-white/40 border border-white/10'
                            }`}
                          >
                            {visible ? (
                              <>
                                <Eye size={12} />
                                <span>مفعل</span>
                              </>
                            ) : (
                              <>
                                <EyeOff size={12} />
                                <span>مخفي</span>
                              </>
                            )}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
