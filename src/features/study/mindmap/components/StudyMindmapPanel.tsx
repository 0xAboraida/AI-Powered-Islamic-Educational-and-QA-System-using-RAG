import { getSavedMindmapsStorageKey } from '../../utils/studyStorage'
import React, { useState, useEffect, useRef } from 'react'
import { Brain, X, Loader2, Sparkles, History, Users, ChevronLeft, Calendar, User, ArrowRight, Database, Globe, Lock, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStudyContext, type MindmapNode } from '../../../../contexts/StudyContext'
import { VisualMindmap } from './VisualMindmap'
import { studyApi, StudyMindmapDto } from '../../../../api/studyApi'
import { useTheme, type AccentColor } from '../../../../contexts/ThemeContext'

function getMindmapThemeTokens(accentColor: AccentColor = 'blue', isDark: boolean = true) {
  switch (accentColor) {
    case 'emerald':
      return {
        icon: 'text-[#046c4e] dark:text-emerald-300',
        badge: isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border border-emerald-200',
        iconBox: isDark ? 'bg-teal-500/10 border-teal-500/25 text-teal-300' : 'bg-emerald-50 border-emerald-200 text-[#046c4e]',
        cardBorder: isDark ? 'border-white/10' : 'border-slate-200/90 shadow-[0_12px_36px_rgba(0,0,0,0.06)]',
        cardBg: isDark ? 'bg-[#090b10] text-white shadow-2xl shadow-black/50' : 'bg-[#f7fcf9] border-emerald-100 text-slate-900',
        glowPrimary: 'hidden',
        glowSecondary: 'hidden',
        titleColor: 'text-[#065f46] dark:text-white',
        primaryBtn: 'bg-gradient-to-r from-teal-600 to-emerald-500 text-white font-bold shadow-md shadow-teal-500/20 border border-teal-400/30 transition-all',
        cardOption: isDark ? 'hover:border-emerald-500/40 hover:bg-emerald-900/20 hover:shadow-emerald-500/20' : 'hover:border-emerald-300 hover:bg-emerald-50/70',
        iconPill: isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-800',
        progressBar: 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500',
        borderAccent: isDark ? 'border-r-emerald-400' : 'border-r-[#046c4e]',
        itemBadge: isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-[#046c4e] border-emerald-200',
      }
    case 'amber':
      return {
        icon: 'text-[#7a5720] dark:text-[#dfbf83]',
        badge: isDark ? 'bg-[#5e431a]/40 text-[#edd8ae] border border-[#8a6328]/40' : 'bg-[#f5ecdc] text-[#5e431a] border border-[#e2d2ba]',
        iconBox: isDark ? 'bg-[#dfbf83]/10 border-[#dfbf83]/25 text-[#dfbf83]' : 'bg-[#f5ede0] border-[#decbb0] text-[#7a5720]',
        cardBorder: isDark ? 'border-white/10' : 'border-slate-200/90 shadow-[0_12px_36px_rgba(0,0,0,0.06)]',
        cardBg: isDark ? 'bg-[#090b10] text-white shadow-2xl shadow-black/50' : 'bg-[#fcfaf6] border-[#e6d8c3] text-stone-900',
        glowPrimary: 'hidden',
        glowSecondary: 'hidden',
        titleColor: 'text-[#5c4118] dark:text-white',
        primaryBtn: 'bg-gradient-to-r from-[#b88d46] to-[#dfbf83] text-stone-950 font-bold shadow-md shadow-amber-900/20 border border-[#dfbf83]/30 transition-all',
        cardOption: isDark ? 'hover:border-[#8a6328]/50 hover:bg-[#261b0c]/40 hover:shadow-stone-900/30' : 'hover:border-[#b88d46] hover:bg-[#f6ede0]',
        iconPill: isDark ? 'bg-[#3b2a12] text-[#dfbf83] border border-[#8a6328]/40' : 'bg-[#f5ede0] text-[#7a5720]',
        progressBar: 'bg-gradient-to-r from-[#8a6328] via-[#dfbf83] to-[#8a6328]',
        borderAccent: isDark ? 'border-r-[#dfbf83]' : 'border-r-[#7a5720]',
        itemBadge: isDark ? 'bg-[#3b2a12] text-[#dfbf83] border-[#8a6328]/40' : 'bg-[#f5ede0] text-[#7a5720] border-[#decbb0]',
      }
    case 'purple':
      return {
        icon: isDark ? 'text-[#b51ee7]' : 'text-[#800080]',
        badge: isDark ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-purple-100 text-purple-800 border border-purple-200',
        iconBox: isDark ? 'bg-purple-500/10 border-purple-500/25 text-purple-300' : 'bg-purple-50 border-purple-200 text-[#581c87]',
        cardBorder: isDark ? 'border-white/10' : 'border-slate-200/90 shadow-[0_12px_36px_rgba(0,0,0,0.06)]',
        cardBg: isDark ? 'bg-[#090b10] text-white shadow-2xl shadow-black/50' : 'bg-[#faf7fd] border-purple-100 text-slate-900',
        glowPrimary: 'hidden',
        glowSecondary: 'hidden',
        titleColor: 'text-[#4a1572] dark:text-white',
        primaryBtn: 'bg-gradient-to-r from-[#800080] to-purple-600 text-white font-bold shadow-md shadow-purple-900/20 border border-purple-400/30 transition-all',
        cardOption: isDark ? 'hover:border-purple-500/40 hover:bg-purple-900/20 hover:shadow-purple-500/20' : 'hover:border-purple-300 hover:bg-purple-50/70',
        iconPill: isDark ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-purple-100 text-purple-800',
        progressBar: 'bg-gradient-to-r from-purple-600 via-fuchsia-400 to-purple-600',
        borderAccent: isDark ? 'border-r-purple-400' : 'border-r-[#581c87]',
        itemBadge: isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-purple-100 text-[#581c87] border-purple-200',
      }
    case 'blue':
    default:
      return {
        icon: 'text-[#154696] dark:text-sky-300',
        badge: isDark ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'bg-sky-100 text-sky-800 border border-sky-200',
        iconBox: isDark ? 'bg-blue-500/10 border-blue-500/25 text-sky-300' : 'bg-sky-50 border-sky-200 text-[#154696]',
        cardBorder: isDark ? 'border-white/10' : 'border-slate-200/90 shadow-[0_12px_36px_rgba(0,0,0,0.06)]',
        cardBg: isDark ? 'bg-[#090b10] text-white shadow-2xl shadow-black/50' : 'bg-[#fafcff] border-sky-100 text-slate-900',
        glowPrimary: 'hidden',
        glowSecondary: 'hidden',
        titleColor: 'text-[#12396e] dark:text-white',
        primaryBtn: 'bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold shadow-md shadow-blue-500/20 border border-blue-400/30 transition-all',
        cardOption: isDark ? 'hover:border-sky-500/40 hover:bg-sky-900/20 hover:shadow-sky-500/20' : 'hover:border-sky-300 hover:bg-sky-50/70',
        iconPill: isDark ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'bg-sky-100 text-sky-800',
        progressBar: 'bg-gradient-to-r from-[#154696] via-sky-400 to-[#154696]',
        borderAccent: isDark ? 'border-r-sky-400' : 'border-r-[#154696]',
        itemBadge: isDark ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-sky-100 text-[#154696] border-sky-200',
      }
  }
}

export function StudyMindmapPanel({
  mindmapData,
  loading,
  currentChunkId,
  handleGenerateMindmap,
  onClose,
  panelWidth = 750,
  startResizing,
  isDark = true,
  chunkLoading
}: {
  mindmapData: MindmapNode[] | null
  loading: boolean
  currentChunkId?: string | null
  handleGenerateMindmap?: () => void
  onClose?: () => void
  panelWidth?: number
  startResizing?: (e: React.MouseEvent) => void
  isDark?: boolean
  chunkLoading?: boolean
}) {
  const { accentColor } = useTheme()
  const mindmapTheme = getMindmapThemeTokens(accentColor, isDark)
  const { setMindmapData, chunkText, chunkTitle, headerSubtitle, chunkMeta } = useStudyContext()
  const [mindmapViewMode, setMindmapViewMode] = useState<'list' | 'visual'>('visual')
  const [viewMode, setViewMode] = useState<'menu' | 'my_mindmaps' | 'community_mindmaps' | 'visual'>(() => {
    return (mindmapData && Array.isArray(mindmapData) && mindmapData.length > 0) ? 'visual' : 'menu'
  })
  const [filterScope, setFilterScope] = useState<'current' | 'all'>('current')

  const [myMindmaps, setMyMindmaps] = useState<StudyMindmapDto[]>([])
  const [communityMindmaps, setCommunityMindmaps] = useState<StudyMindmapDto[]>([])
  const [loadingLists, setLoadingLists] = useState<boolean>(false)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [activeMindmap, setActiveMindmap] = useState<MindmapNode[] | null>(mindmapData)
  const prevMindmapRef = useRef<MindmapNode[] | null>(mindmapData)

  // Sync activeMindmap ONLY when parent passes new mindmapData (e.g., after fresh AI generation)
  useEffect(() => {
    if (mindmapData && Array.isArray(mindmapData) && mindmapData.length > 0) {
      prevMindmapRef.current = mindmapData
      setActiveMindmap(mindmapData)
      setViewMode('visual')
      loadMindmaps()
    }
  }, [mindmapData])

  // Load saved mindmaps from API and localStorage whenever currentChunkId changes or panel mounts
  const loadMindmaps = (forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true)
    }

    // 1. Immediately read local saved mindmaps (Zero delay)
    let localSaved: StudyMindmapDto[] = []
    try {
      const rawLocal = localStorage.getItem(getSavedMindmapsStorageKey())
      if (rawLocal) {
        const parsed = JSON.parse(rawLocal)
        if (Array.isArray(parsed)) localSaved = parsed
      }
    } catch (err) {
      console.warn('Error reading local saved mindmaps:', err)
    }

    // 2. Immediately read local community mindmaps
    let localComm: StudyMindmapDto[] = []
    try {
      const rawComm = localStorage.getItem('zad_community_mindmaps')
      if (rawComm) {
        const parsed = JSON.parse(rawComm)
        if (Array.isArray(parsed)) localComm = parsed
      }
    } catch (err) {
      console.warn('Error reading local community mindmaps:', err)
    }

    // ALSO: Merge any items from localSaved that have isShared: true
    for (const s of localSaved) {
      if (s && (s as any).isShared && !localComm.some(c => c.id === s.id)) {
        localComm.unshift({
          ...s,
          authorName: s.authorName?.includes('(أنت)') ? s.authorName : 'طالب في زاد (أنت)'
        })
      }
    }

    // Helper to process, deduplicate, and set state
    const syncMindmapsState = (rawMy: StudyMindmapDto[], rawComm: StudyMindmapDto[]) => {
      let myFiltered = [...rawMy]
      let commFiltered = [...rawComm]

      // If activeMindmap exists in current context, ensure it's represented
      if (activeMindmap && activeMindmap.length > 0 && currentChunkId) {
        const hasCurrent = myFiltered.some(m => m.chunkId === currentChunkId || decodeURIComponent(m.chunkId || '') === decodeURIComponent(currentChunkId))
        if (!hasCurrent) {
          myFiltered.unshift({
            id: Date.now(),
            chunkId: currentChunkId,
            title: 'خريطة الدرس الحالية',
            treeData: activeMindmap,
            authorName: 'طالب في زاد (أنت)',
            createdAt: new Date().toISOString()
          })
        }
      }

      // Deduplicate user mindmaps: prioritize real DB records over temporary local copies
      const seenIds = new Set<string | number>()
      const seenSignatures = new Set<string>()
      const uniqueMy: StudyMindmapDto[] = []

      for (const m of myFiltered) {
        if (!m) continue
        const id = m.id
        const chunk = (m.chunkId || '').trim()
        const title = (m.title || '').trim()
        const sig = `${chunk}___${title}`

        if (seenIds.has(id) || (sig !== '___' && seenSignatures.has(sig))) {
          continue
        }

        seenIds.add(id)
        if (sig !== '___') {
          seenSignatures.add(sig)
        }
        uniqueMy.push(m)
      }

      // Deduplicate community mindmaps by ID and signature
      const seenCommIds = new Set<string | number>()
      const seenCommSignatures = new Set<string>()
      const uniqueComm: StudyMindmapDto[] = []

      for (const m of commFiltered) {
        if (!m) continue
        const id = m.id
        const chunk = (m.chunkId || '').trim()
        const title = (m.title || '').trim()
        const author = (m.authorName || '').trim()
        const sig = `${chunk}___${title}___${author}`

        if (seenCommIds.has(id) || (sig !== '______' && seenCommSignatures.has(sig))) {
          continue
        }

        seenCommIds.add(id)
        if (sig !== '______') {
          seenCommSignatures.add(sig)
        }
        uniqueComm.push(m)
      }

      setMyMindmaps(uniqueMy)
      setCommunityMindmaps(uniqueComm)

      // Prune lingering duplicate entries from localStorage so browser state stays clean
      try {
        const rawLocal = localStorage.getItem(getSavedMindmapsStorageKey())
        if (rawLocal) {
          const list = JSON.parse(rawLocal)
          if (Array.isArray(list)) {
            const cleanSaved = []
            const localSigs = new Set()
            for (const item of list) {
              const sig = `${(item.chunkId || '').trim()}___${(item.title || '').trim()}`
              if (!localSigs.has(sig)) {
                localSigs.add(sig)
                cleanSaved.push(item)
              }
            }
            if (cleanSaved.length !== list.length) {
              localStorage.setItem(getSavedMindmapsStorageKey(), JSON.stringify(cleanSaved))
            }
          }
        }
      } catch {}
    }

    // Immediately update UI with local cached data
    syncMindmapsState(localSaved, localComm)
    setLoadingLists(false)

    // Fetch from API and prioritize real DB records over temporary local ones
    Promise.all([
      studyApi.getMindmapsByChunk(currentChunkId || '', forceRefresh).catch(() => []),
      studyApi.getCommunityMindmapsByChunk(currentChunkId || '', forceRefresh).catch(() => [])
    ]).then(([userRes, commRes]) => {
      const uRes = Array.isArray(userRes) ? userRes : []
      const cRes = Array.isArray(commRes) ? commRes : []
      syncMindmapsState([...uRes, ...localSaved], [...cRes, ...localComm])
    }).catch(err => {
      console.warn('Failed background load of mindmaps:', err)
    }).finally(() => {
      if (forceRefresh) {
        setIsRefreshing(false)
      }
    })
  }

  useEffect(() => {
    loadMindmaps()
    const handleUpdate = () => loadMindmaps()
    window.addEventListener('zad_mindmaps_updated', handleUpdate)
    return () => window.removeEventListener('zad_mindmaps_updated', handleUpdate)
  }, [currentChunkId])

  const handleToggleShareMindmap = async (e: React.MouseEvent, item: StudyMindmapDto) => {
    e.stopPropagation()
    let targetId = Number(item.id)
    const newShared = !item.isSharedInCommunity

    // 1. Optimistic state update
    setMyMindmaps(prev =>
      prev.map(m => m.id === item.id ? { ...m, isSharedInCommunity: newShared } : m)
    )

    try {
      // 2. If item was local-only or has temporary timestamp ID (> 1 billion), save to DB first!
      if (!targetId || targetId > 1000000000) {
        const savedDto = await studyApi.saveMindmap(
          item.chunkId || currentChunkId || '',
          item.title || chunkTitle || 'خريطة مفاهيم الدرس',
          item.treeData,
          item.bookTitle || (chunkMeta as any)?.book_title || headerSubtitle || 'درس شرعي',
          item.sectionTitle || chunkTitle || 'عنوان الدرس'
        )
        if (savedDto && savedDto.id) {
          targetId = savedDto.id
          setMyMindmaps(prev =>
            prev.map(m => m.id === item.id ? { ...savedDto, isSharedInCommunity: newShared } : m)
          )
        }
      }

      // 3. Call backend to toggle share
      const res = await studyApi.toggleShareMindmap(targetId)
      if (res && typeof res.isShared === 'boolean') {
        setMyMindmaps(prev =>
          prev.map(m => (m.id === targetId || m.id === item.id) ? { ...m, isSharedInCommunity: res.isShared } : m)
        )
      }
    } catch (err) {
      console.warn('Backend toggle share failed:', err)
      // Revert on error
      setMyMindmaps(prev =>
        prev.map(m => (m.id === targetId || m.id === item.id) ? { ...m, isSharedInCommunity: !newShared } : m)
      )
    }
  }

  const isChunkMatch = (m: StudyMindmapDto) => {
    if (!currentChunkId) return true
    const decChunk = decodeURIComponent(currentChunkId).trim()
    const mChunk = decodeURIComponent(m.chunkId || '').trim()
    return mChunk === decChunk || m.chunkId === currentChunkId
  }

  const parseTreeNodes = (raw: any): MindmapNode[] => {
    if (!raw) return []
    let data = raw
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data)
      } catch {
        return []
      }
    }
    if (Array.isArray(data)) return data
    if (typeof data === 'object' && data !== null) {
      if (Array.isArray(data.tree)) return data.tree
      if (data.tree && typeof data.tree === 'object') return [data.tree]
      if (Array.isArray(data.nodes)) return data.nodes
      if (data.nodes && typeof data.nodes === 'object') return [data.nodes]
      return [data]
    }
    return []
  }

  const handleSelectMindmapDto = (dto: StudyMindmapDto) => {
    const nodes = parseTreeNodes(dto.treeData)
    if (nodes && nodes.length > 0) {
      setActiveMindmap(nodes)
      prevMindmapRef.current = nodes
      if (setMindmapData) {
        setMindmapData(nodes)
      }
      setViewMode('visual')
    } else {
      alert('تعذر تحميل الخريطة الذهنية المحددة.')
    }
  }

  const renderMindmapList = (items: StudyMindmapDto[], title: string) => {
    // Strictly isolate to the current lesson only
    const displayedItems = items.filter(isChunkMatch)

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -12 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`p-4 sm:p-6 rounded-2xl border w-full max-w-full relative overflow-hidden flex flex-col items-center transition-all duration-500 ${isDark
          ? `${mindmapTheme.cardBg} ${mindmapTheme.cardBorder} text-white backdrop-blur-xl`
          : `${mindmapTheme.cardBg} ${mindmapTheme.cardBorder} text-slate-900 shadow-2xl`
          }`}
        dir="rtl"
      >
        {/* Top Glow Highlights */}
        <div className={`absolute -top-24 -right-24 w-48 h-48 ${mindmapTheme.glowPrimary} rounded-full blur-3xl pointer-events-none animate-pulse`}></div>
        <div className={`absolute -bottom-24 -left-24 w-48 h-48 ${mindmapTheme.glowSecondary} rounded-full blur-3xl pointer-events-none`}></div>

        {/* Header Bar */}
        <div className="flex items-center justify-between w-full mb-4 relative z-10 border-b pb-3.5 border-white/10 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`p-2 rounded-xl flex-shrink-0 ${mindmapTheme.iconPill}`}>
              <Brain size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`text-base sm:text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold shadow-sm ${mindmapTheme.badge}`}>
                  {displayedItems.length} خريطة
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">استعرض الشجرات الذهنية المحفوظة لتعميق الفهم البصري لهذا الدرس</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => loadMindmaps(true)}
              disabled={isRefreshing}
              className={`p-2 rounded-xl transition-all duration-200 flex items-center justify-center hover:scale-105 active:scale-95 shadow-xs cursor-pointer ${
                isDark
                  ? 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
              title="تحديث القائمة من السيرفر"
              aria-label="تحديث القائمة"
            >
              <RefreshCw size={15} className={isRefreshing ? 'animate-spin text-purple-400' : ''} />
            </button>

            <button
              onClick={() => setViewMode('menu')}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all duration-200 flex items-center gap-1 hover:scale-105 active:scale-95 shadow-md flex-shrink-0 cursor-pointer ${isDark ? 'bg-white/10 hover:bg-white/20 text-white border border-white/10' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
            >
              <ChevronLeft size={15} /> العودة
            </button>
          </div>
        </div>

        {/* Content List */}
        <div className="w-full relative z-10 max-h-[380px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full">
          {loadingLists ? (
            <div className="py-14 flex flex-col items-center justify-center relative z-10 gap-3">
              <Loader2 className={`animate-spin ${mindmapTheme.icon}`} size={32} />
              <p className={`text-xs font-semibold ${isDark ? 'text-white/70' : 'text-slate-500'}`}>جاري استرجاع الخرائط الذهنية...</p>
            </div>
          ) : displayedItems.length === 0 ? (
            <div className={`w-full py-14 rounded-2xl border text-center relative z-10 flex flex-col items-center justify-center gap-2.5 ${isDark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
              <Brain size={36} className="text-slate-500/60" />
              <p className="font-bold text-sm">لا توجد خرائط ذهنية محفوظة لمجال العرض الحالي.</p>
              <p className="text-xs text-slate-400 max-w-xs">
                {filterScope === 'current'
                  ? 'يمكنك تبديل التصفية إلى "كل الدروس" أو توليد خريطة جديدة لهذا الدرس.'
                  : 'أنشئ خريطة ذهنية جديدة من الشاشة الرئيسية لبدء استكشاف مفاهيم الدرس.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {displayedItems.map((item, index) => {
                const createdDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }) : 'مؤخراً'
                const nodesList = parseTreeNodes(item.treeData)
                const nodeCount = nodesList.length > 0 ? (nodesList[0]?.children?.length || 1) + 1 : 1

                return (
                  <div
                    key={item.id}
                    className={`w-full group p-4 sm:p-5 rounded-2xl border-l border-t border-b border-r-4 transition-all duration-300 flex flex-col gap-3 relative overflow-hidden ${isDark
                      ? `bg-white/5 border-white/10 ${mindmapTheme.borderAccent} hover:bg-white/10 shadow-md backdrop-blur-xl`
                      : `bg-white border-slate-200 ${mindmapTheme.borderAccent} hover:shadow-xl`
                      }`}
                  >
                    {/* Top Row: Sequential Index Badge + Full Width Title */}
                    <div className="flex items-center gap-2.5 w-full">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm sm:text-base flex-shrink-0 transition-all duration-300 ${mindmapTheme.itemBadge} group-hover:scale-105`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-black text-sm sm:text-base leading-snug transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {item.title || 'خريطة ذهنية للدرس'}
                        </h4>
                      </div>
                    </div>

                    {/* Middle Row: Metadata Chips */}
                    <div className="flex items-center gap-2 text-[11px] font-medium pt-0.5 flex-wrap">
                      {/* Book Title Pill */}
                      {(item.bookTitle || (chunkMeta as any)?.book_title || (headerSubtitle && headerSubtitle !== 'يرجى اختيار درس للبدء')) && (
                        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[11px] font-bold ${
                          isDark ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-900'
                        }`}>
                          <span>📖 {item.bookTitle || (chunkMeta as any)?.book_title || headerSubtitle}</span>
                        </span>
                      )}

                      {/* 1. Branch Count */}
                      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-bold ${isDark ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300' : 'bg-cyan-50 border-cyan-200 text-cyan-700'
                        }`}>
                        <Brain size={13} className="text-cyan-400" />
                        <span>{nodeCount} فروع مفاهيمية</span>
                      </span>

                      {/* 2. Created Date */}
                      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-bold ${isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
                        }`}>
                        <Calendar size={13} className="text-sky-400" />
                        <span>{createdDate}</span>
                      </span>

                      {/* Lesson Scope Tag if viewing all lessons */}
                      {filterScope === 'all' && (
                        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[10px] font-bold ${
                          isChunkMatch(item)
                            ? (isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800')
                            : (isDark ? 'bg-white/5 border-white/10 text-white/50' : 'bg-slate-100 border-slate-200 text-slate-500')
                        }`}>
                          <span>{isChunkMatch(item) ? '📌 هذا الدرس' : 'درس آخر'}</span>
                        </span>
                      )}
                    </div>

                    {/* Bottom Row: Action Bar with compact 'عرض الخريطة' button */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/10 gap-2 flex-wrap">
                      <div>
                        {viewMode === 'my_mindmaps' && (
                          <button
                            type="button"
                            onClick={(e) => handleToggleShareMindmap(e, item)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              item.isSharedInCommunity
                                ? isDark
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                : isDark
                                  ? 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                            }`}
                            title={item.isSharedInCommunity ? 'إلغاء النشر من المجتمع العام' : 'نشر هذا التشجير في مجتمع زاد'}
                          >
                            <Globe size={13} className={item.isSharedInCommunity ? 'text-amber-400' : 'opacity-70'} />
                            <span>{item.isSharedInCommunity ? 'منشور بالمجتمع' : 'نشر بالمجتمع'}</span>
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectMindmapDto(item)}
                        className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl font-bold text-xs ${mindmapTheme.primaryBtn} hover:scale-105 active:scale-95 transition-all cursor-pointer`}
                      >
                        <span>عرض الخريطة</span>
                        <ArrowRight size={14} className="rotate-180" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <div
      style={{
        width: panelWidth ? panelWidth : '100%',
      }}
      className={`flex-1 w-full min-w-[300px] flex flex-col relative h-full overflow-hidden transition-colors bg-transparent border-l ${isDark
        ? 'border-white/10 text-white'
        : 'border-slate-200 text-slate-900'
        }`}
    >
      {/* Header */}
      <div className={`hidden md:flex items-center justify-between px-4 py-3 border-b backdrop-blur-md ${isDark ? 'border-white/10 bg-[#090b10] text-white' : 'border-slate-200 bg-slate-50/90 text-slate-800'
        }`}>
        <div className="flex items-center gap-2 text-sm font-bold">
          <Brain size={18} className={mindmapTheme.icon} />
          <span>الخريطة الذهنية</span>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === 'visual' && activeMindmap && (
            <button
              onClick={() => {
                setActiveMindmap(null)
                setViewMode('menu')
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                }`}
            >
              <ChevronLeft size={14} /> قائمة الخرائط
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700'
                }`}
              title="إغلاق التاب"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col justify-center items-center w-full">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="mindmap-loading"
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className={`flex flex-col items-center justify-center text-center p-6 sm:p-8 rounded-2xl border shadow-2xl backdrop-blur-xl max-w-sm w-full relative overflow-hidden transition-all duration-300 ${isDark
                ? `${mindmapTheme.cardBg} ${mindmapTheme.cardBorder} text-white`
                : `${mindmapTheme.cardBg} ${mindmapTheme.cardBorder} text-slate-900 shadow-xl`
                }`}
            >
              <div className={`absolute -top-12 -left-12 w-32 h-32 ${mindmapTheme.glowPrimary} rounded-full blur-3xl animate-pulse -z-10`} />
              <div className={`absolute -bottom-12 -right-12 w-32 h-32 ${mindmapTheme.glowSecondary} rounded-full blur-3xl animate-pulse -z-10`} />

              <div className="relative mb-6 flex items-center justify-center">
                <div className={`absolute inset-0 rounded-full ${mindmapTheme.glowPrimary} blur-md animate-ping`}></div>
                <div className={`h-20 w-20 rounded-full flex items-center justify-center relative z-10 border shadow-xl ${mindmapTheme.iconBox}`}>
                  <Brain size={38} className="animate-pulse" />
                </div>
                <Loader2 size={92} className={`absolute ${mindmapTheme.icon} opacity-40 animate-spin stroke-[1.5]`} />
              </div>

              <h3 className={`text-xl font-bold mb-2 ${mindmapTheme.titleColor}`}>
                جاري بناء الخريطة الذهنية
              </h3>
              <p className={`text-sm leading-relaxed mb-6 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                يقوم زاد بتحليل النص واستخراج المفاهيم الأساسية وترتيب العلاقات الهيكلية...
              </p>

              <div className="w-full bg-black/10 dark:bg-white/10 h-2 rounded-full overflow-hidden relative">
                <motion.div
                  className={`h-full ${mindmapTheme.progressBar} rounded-full`}
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          ) : viewMode === 'visual' && activeMindmap ? (
            <div className="w-full flex flex-col h-full" key="visual-view">
              <VisualMindmap
                data={activeMindmap}
                mindmapViewMode={mindmapViewMode}
                setMindmapViewMode={setMindmapViewMode}
                isDark={isDark}
                onBack={() => {
                  setActiveMindmap(null)
                  setViewMode('menu')
                }}
              />
            </div>
          ) : viewMode === 'my_mindmaps' ? (
            renderMindmapList(myMindmaps, 'خرائطي الذهنية السابقة')
          ) : viewMode === 'community_mindmaps' ? (
            renderMindmapList(communityMindmaps, 'خرائط الزملاء المتاحة')
          ) : (
            <motion.div
              key="menu"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className={`p-6 sm:p-8 rounded-2xl border max-w-md w-full relative overflow-hidden text-center flex flex-col items-center gap-4 transition-all duration-500 ${
                isDark
                  ? `${mindmapTheme.cardBg} ${mindmapTheme.cardBorder} text-white backdrop-blur-md`
                  : `${mindmapTheme.cardBg} ${mindmapTheme.cardBorder} text-slate-900 backdrop-blur-md`
              }`}
              dir="rtl"
            >
              <div className={`absolute -top-12 -left-12 w-36 h-36 ${mindmapTheme.glowPrimary} rounded-full blur-3xl animate-pulse -z-10`}></div>
              <div className={`absolute -bottom-12 -right-12 w-36 h-36 ${mindmapTheme.glowSecondary} rounded-full blur-3xl animate-pulse delay-500 -z-10`}></div>

              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-2 relative z-10 border shadow-xl transition-all ${mindmapTheme.iconBox}`}>
                <Brain size={36} className="drop-shadow-md" />
              </div>

              <h3 className={`text-2xl font-black text-center ${mindmapTheme.titleColor}`}>
                الخريطة الذهنية التفاعلية
              </h3>

              <div className="grid grid-cols-2 gap-3 w-full mt-1">
                <button
                  type="button"
                  onClick={() => setViewMode('my_mindmaps')}
                  className={`flex flex-col items-center p-4 rounded-2xl border transition-all duration-300 hover:-translate-y-1 active:scale-95 cursor-pointer text-center ${
                    isDark
                      ? `bg-white/[0.04] border-white/10 ${mindmapTheme.cardOption} shadow-md`
                      : `bg-white/90 border-slate-200 ${mindmapTheme.cardOption} shadow-sm`
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-transform duration-300 ${mindmapTheme.iconPill}`}>
                    <History size={20} />
                  </div>
                  <span className={`font-extrabold text-xs sm:text-sm mb-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>تشجيراتي للدرس</span>
                  <span className={`text-[11px] font-medium ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                    {myMindmaps.filter(isChunkMatch).length} خريطة متوفرة
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('community_mindmaps')}
                  className={`flex flex-col items-center p-4 rounded-2xl border transition-all duration-300 hover:-translate-y-1 active:scale-95 cursor-pointer text-center ${
                    isDark
                      ? `bg-white/[0.04] border-white/10 ${mindmapTheme.cardOption} shadow-md`
                      : `bg-white/90 border-slate-200 ${mindmapTheme.cardOption} shadow-sm`
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-transform duration-300 ${mindmapTheme.iconPill}`}>
                    <Users size={20} />
                  </div>
                  <span className={`font-extrabold text-xs sm:text-sm mb-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>تشجيرات الزملاء</span>
                  <span className={`text-[11px] font-medium ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                    {communityMindmaps.filter(isChunkMatch).length} خريطة متوفرة
                  </span>
                </button>
              </div>

              {/* If activeMindmap exists, offer a button to view it directly */}
              {activeMindmap && activeMindmap.length > 0 && (
                <button
                  type="button"
                  onClick={() => setViewMode('visual')}
                  className={`w-full mt-1 py-3 px-5 rounded-2xl font-black text-xs sm:text-sm transition-all duration-200 border flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                    isDark
                      ? 'bg-sky-500/20 hover:bg-sky-500/30 border-sky-400/50 text-sky-200 shadow-sky-950/40'
                      : 'bg-sky-50 hover:bg-sky-100 border-sky-300 text-sky-900 shadow-sm'
                  }`}
                >
                  <Brain size={18} className="stroke-[2.5]" />
                  <span>عرض الخريطة الحالية النشطة لهذا الدرس</span>
                </button>
              )}

              <button
                disabled={!currentChunkId || loading || chunkLoading}
                onClick={() => {
                  if (!currentChunkId || loading || chunkLoading) return
                  if (handleGenerateMindmap) handleGenerateMindmap()
                }}
                className={`w-full mt-1 py-3.5 px-5 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  (!currentChunkId || loading || chunkLoading)
                    ? isDark
                      ? 'cursor-not-allowed bg-white/[0.04] text-white/45 border border-dashed border-white/15 shadow-none select-none'
                      : 'cursor-not-allowed bg-stone-100 text-stone-500 border border-dashed border-stone-300 shadow-none select-none'
                    : `${mindmapTheme.primaryBtn} hover:scale-[1.02] active:scale-[0.98] border shadow-xl cursor-pointer`
                }`}
              >
                {!currentChunkId || loading || chunkLoading ? (
                  <>
                    <Lock size={15} className="opacity-70" />
                    <span>اختر درساً من الفهرس لإنشاء خريطة ذهنية</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} className="stroke-[2.5]" />
                    <span>إنشاء خريطة ذهنية جديدة</span>
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
