import React, { useState, useEffect, useRef } from 'react'
import { Brain, X, Loader2, Sparkles, History, Users, ChevronLeft, Calendar, User, ArrowRight, Database } from 'lucide-react'
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
        iconBox: isDark ? 'bg-[#092b1f] border-emerald-500/40 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-[#046c4e]',
        cardBorder: isDark ? 'border-emerald-500/25' : 'border-emerald-200/80',
        cardBg: isDark
          ? 'bg-[#051c14] text-white shadow-[0_12px_40px_rgba(0,0,0,0.5)]'
          : 'bg-[#f7fcf9] border-emerald-100 text-slate-900 shadow-xl',
        glowPrimary: 'bg-emerald-500/10',
        glowSecondary: 'bg-teal-600/10',
        titleColor: 'text-[#065f46] dark:text-emerald-200',
        primaryBtn: 'bg-[#046c4e] hover:bg-[#03543d] active:bg-[#023e2d] text-white shadow-md border border-[#03543d]/30 transition-all',
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
        iconBox: isDark ? 'bg-[#261b0c] border-[#8a6328]/50 text-[#dfbf83]' : 'bg-[#f5ede0] border-[#decbb0] text-[#7a5720]',
        cardBorder: isDark ? 'border-[#5e431a]/40' : 'border-[#e6d8c3]',
        cardBg: isDark
          ? 'bg-[#18120a] text-stone-100 shadow-[0_12px_40px_rgba(0,0,0,0.5)]'
          : 'bg-[#fcfaf6] border-[#e6d8c3] text-stone-900 shadow-xl',
        glowPrimary: 'bg-[#c99a4e]/10',
        glowSecondary: 'bg-[#8a6328]/10',
        titleColor: 'text-[#5c4118] dark:text-[#edd8ae]',
        primaryBtn: 'bg-[#7a5720] hover:bg-[#684918] active:bg-[#593d12] text-white shadow-md border border-[#684918]/30 transition-all',
        cardOption: isDark ? 'hover:border-[#8a6328]/50 hover:bg-[#261b0c]/40 hover:shadow-stone-900/30' : 'hover:border-[#b88d46] hover:bg-[#f6ede0]',
        iconPill: isDark ? 'bg-[#3b2a12] text-[#dfbf83] border border-[#8a6328]/40' : 'bg-[#f5ede0] text-[#7a5720]',
        progressBar: 'bg-gradient-to-r from-[#8a6328] via-[#dfbf83] to-[#8a6328]',
        borderAccent: isDark ? 'border-r-[#dfbf83]' : 'border-r-[#7a5720]',
        itemBadge: isDark ? 'bg-[#3b2a12] text-[#dfbf83] border-[#8a6328]/40' : 'bg-[#f5ede0] text-[#7a5720] border-[#decbb0]',
      }
    case 'purple':
      return {
        icon: 'text-[#581c87] dark:text-purple-300',
        badge: isDark ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-purple-100 text-purple-800 border border-purple-200',
        iconBox: isDark ? 'bg-[#240a3d] border-purple-500/40 text-purple-300' : 'bg-purple-50 border-purple-200 text-[#581c87]',
        cardBorder: isDark ? 'border-purple-500/25' : 'border-purple-200/80',
        cardBg: isDark
          ? 'bg-[#140624] text-white shadow-[0_12px_40px_rgba(0,0,0,0.5)]'
          : 'bg-[#faf7fd] border-purple-100 text-slate-900 shadow-xl',
        glowPrimary: 'bg-purple-500/10',
        glowSecondary: 'bg-fuchsia-600/10',
        titleColor: 'text-[#4a1572] dark:text-purple-200',
        primaryBtn: 'bg-[#581c87] hover:bg-[#4a1572] active:bg-[#3b0f5c] text-white shadow-md border border-[#4a1572]/30 transition-all',
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
        iconBox: isDark ? 'bg-[#0d223f] border-sky-500/40 text-sky-300' : 'bg-sky-50 border-sky-200 text-[#154696]',
        cardBorder: isDark ? 'border-sky-500/25' : 'border-sky-200/80',
        cardBg: isDark
          ? 'bg-[#0b1626] text-white shadow-[0_12px_40px_rgba(0,0,0,0.5)]'
          : 'bg-[#fafcff] border-sky-100 text-slate-900 shadow-xl',
        glowPrimary: 'bg-sky-500/10',
        glowSecondary: 'bg-blue-600/10',
        titleColor: 'text-[#12396e] dark:text-sky-200',
        primaryBtn: 'bg-[#154696] hover:bg-[#103878] active:bg-[#0c2b5d] text-white shadow-md border border-[#103878]/30 transition-all',
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
  panelWidth = 550,
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
  const { setMindmapData } = useStudyContext()
  const [mindmapViewMode, setMindmapViewMode] = useState<'list' | 'visual'>('visual')
  const [viewMode, setViewMode] = useState<'menu' | 'my_mindmaps' | 'community_mindmaps' | 'visual'>(() => {
    return (mindmapData && Array.isArray(mindmapData) && mindmapData.length > 0) ? 'visual' : 'menu'
  })

  const [myMindmaps, setMyMindmaps] = useState<StudyMindmapDto[]>([])
  const [communityMindmaps, setCommunityMindmaps] = useState<StudyMindmapDto[]>([])
  const [loadingLists, setLoadingLists] = useState<boolean>(false)
  const [activeMindmap, setActiveMindmap] = useState<MindmapNode[] | null>(mindmapData)
  const prevMindmapRef = useRef<MindmapNode[] | null>(mindmapData)

  // Sync activeMindmap ONLY when parent passes new mindmapData (e.g., after fresh AI generation)
  useEffect(() => {
    if (mindmapData && mindmapData !== prevMindmapRef.current) {
      prevMindmapRef.current = mindmapData
      setActiveMindmap(mindmapData)
      setViewMode('visual')
      loadMindmaps()
    }
  }, [mindmapData])

  // Load saved mindmaps from API whenever currentChunkId changes or panel mounts
  const loadMindmaps = async () => {
    setLoadingLists(true)
    try {
      const [userRes, commRes] = await Promise.all([
        studyApi.getMindmapsByChunk(currentChunkId || ''),
        studyApi.getCommunityMindmapsByChunk(currentChunkId || '')
      ])

      let myFiltered = Array.isArray(userRes) ? userRes : []
      let commFiltered = Array.isArray(commRes) ? commRes : []

      // Strict chunk isolation if chunk selected
      if (currentChunkId) {
        const decChunk = decodeURIComponent(currentChunkId)
        myFiltered = myFiltered.filter(m => m.chunkId === currentChunkId || m.chunkId === decChunk)
        commFiltered = commFiltered.filter(m => m.chunkId === currentChunkId || m.chunkId === decChunk)
      }

      // Deduplicate
      const myIds = new Set(myFiltered.map(m => m.id))
      commFiltered = commFiltered.filter(m => !myIds.has(m.id))

      setMyMindmaps(myFiltered)
      setCommunityMindmaps(commFiltered)
    } catch (err) {
      console.warn('Failed to load mindmaps from backend API:', err)
    } finally {
      setLoadingLists(false)
    }
  }

  useEffect(() => {
    loadMindmaps()
  }, [currentChunkId])

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
        <div className="flex items-center justify-between w-full mb-5 relative z-10 border-b pb-3.5 border-white/10 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`p-2 rounded-xl flex-shrink-0 ${mindmapTheme.iconPill}`}>
              <Brain size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`text-base sm:text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold shadow-sm ${mindmapTheme.badge}`}>
                  {items.length} خريطة
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">استعرض الشجرات الذهنية المحفوظة لتعميق الفهم البصري</p>
            </div>
          </div>
          <button
            onClick={() => setViewMode('menu')}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all duration-200 flex items-center gap-1 hover:scale-105 active:scale-95 shadow-md flex-shrink-0 ${isDark ? 'bg-white/10 hover:bg-white/20 text-white border border-white/10' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
          >
            <ChevronLeft size={15} /> العودة
          </button>
        </div>

        {/* Content List */}
        <div className="w-full relative z-10 max-h-[380px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full">
          {loadingLists ? (
            <div className="py-14 flex flex-col items-center justify-center relative z-10 gap-3">
              <Loader2 className={`animate-spin ${mindmapTheme.icon}`} size={32} />
              <p className={`text-xs font-semibold ${isDark ? 'text-white/70' : 'text-slate-500'}`}>جاري استرجاع الخرائط الذهنية...</p>
            </div>
          ) : items.length === 0 ? (
            <div className={`w-full py-14 rounded-2xl border text-center relative z-10 flex flex-col items-center justify-center gap-2.5 ${isDark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
              <Brain size={36} className="text-slate-500/60" />
              <p className="font-bold text-sm">لا توجد خرائط ذهنية محفوظة هنا بعد.</p>
              <p className="text-xs text-slate-400 max-w-xs">أنشئ خريطة ذهنية جديدة من الشاشة الرئيسية لبدء استكشاف مفاهيم الدرس.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {items.map((item, index) => {
                const createdDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }) : 'مؤخراً'
                const nodesList = parseTreeNodes(item.treeData)
                const nodeCount = nodesList.length > 0 ? (nodesList[0]?.children?.length || 1) + 1 : 1

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectMindmapDto(item)}
                    className={`w-full group p-3.5 sm:p-4 rounded-2xl border-l border-t border-b border-r-4 transition-all duration-300 cursor-pointer flex flex-col gap-3 relative overflow-hidden ${isDark
                      ? `bg-white/5 border-white/10 ${mindmapTheme.borderAccent} hover:bg-white/10 shadow-md backdrop-blur-xl`
                      : `bg-white border-slate-200 ${mindmapTheme.borderAccent} hover:shadow-xl`
                      }`}
                  >

                    {/* Top Row: Sequential Index Badge (#1, #2...) + Title + Button */}
                    <div className="flex items-center justify-between gap-3 w-full">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        {/* Sequential Index Badge (#1, #2...) */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm sm:text-base flex-shrink-0 transition-all duration-300 ${mindmapTheme.itemBadge} group-hover:scale-110`}>
                          {index + 1}
                        </div>
                        <div className="flex flex-col justify-center min-w-0 flex-1">
                          <h4 className={`font-black text-sm sm:text-base leading-snug break-words transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {item.title || 'خريطة ذهنية للدرس'}
                          </h4>
                        </div>
                      </div>

                      <button
                        className={`px-3.5 py-1.5 text-xs font-black rounded-xl ${mindmapTheme.primaryBtn} group-hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 flex-shrink-0`}
                      >
                        <span>عرض</span>
                        <ArrowRight size={14} className="rotate-180" />
                      </button>
                    </div>

                    {/* Metadata Row (Simplified: Date & Branch Count) */}
                    <div className="flex items-center gap-2 text-[11px] font-medium pt-2 border-t border-white/5">
                      {/* 1. Branch Count */}
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md border ${isDark ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300' : 'bg-cyan-50 border-cyan-200 text-cyan-700'
                        }`}>
                        <Brain size={12} className="text-cyan-400" />
                        <span>{nodeCount} فروع مفاهيمية</span>
                      </span>

                      {/* 2. Created Date */}
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md border ${isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
                        }`}>
                        <Calendar size={12} className="text-sky-400" />
                        <span>{createdDate}</span>
                      </span>
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
      <div className={`hidden md:flex items-center justify-between px-4 py-3 border-b backdrop-blur-md ${isDark ? 'border-white/10 bg-[#12041f]/70 text-white' : 'border-slate-200 bg-slate-50/90 text-slate-800'
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
                  : `${mindmapTheme.cardBg} ${mindmapTheme.cardBorder} text-slate-900 shadow-xl backdrop-blur-md`
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
                      ? `bg-[#12041f]/70 border-white/10 ${mindmapTheme.cardOption} shadow-md`
                      : `bg-white/90 border-slate-200 ${mindmapTheme.cardOption} shadow-sm`
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-transform duration-300 ${mindmapTheme.iconPill}`}>
                    <History size={20} />
                  </div>
                  <span className={`font-extrabold text-xs sm:text-sm mb-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>خرائطي السابقة</span>
                  <span className={`text-[11px] font-medium ${isDark ? 'text-white/60' : 'text-slate-500'}`}>{myMindmaps.length} خريطة متوفرة</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!currentChunkId && communityMindmaps.length === 0) {
                      alert('الرجاء اختيار درس من الفهرس أولاً لتصفح خرائط زملائك الخاصة به.')
                      return
                    }
                    setViewMode('community_mindmaps')
                  }}
                  className={`flex flex-col items-center p-4 rounded-2xl border transition-all duration-300 hover:-translate-y-1 active:scale-95 cursor-pointer text-center ${
                    isDark
                      ? `bg-[#12041f]/70 border-white/10 ${mindmapTheme.cardOption} shadow-md`
                      : `bg-white/90 border-slate-200 ${mindmapTheme.cardOption} shadow-sm`
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-transform duration-300 ${mindmapTheme.iconPill}`}>
                    <Users size={20} />
                  </div>
                  <span className={`font-extrabold text-xs sm:text-sm mb-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>خرائط الزملاء</span>
                  <span className={`text-[11px] font-medium ${isDark ? 'text-white/60' : 'text-slate-500'}`}>{communityMindmaps.length} خريطة متوفرة</span>
                </button>
              </div>

              <button
                disabled={!currentChunkId || loading || chunkLoading}
                onClick={() => {
                  if (!currentChunkId || loading || chunkLoading) {
                    if (!currentChunkId) alert('الرجاء اختيار درس من الفهرس الجانبي أولاً لإنشاء خريطة ذهنية جديدة حوله.')
                    return
                  }
                  if (handleGenerateMindmap) handleGenerateMindmap()
                }}
                className={`w-full mt-1 py-3.5 px-5 rounded-2xl font-black text-xs sm:text-sm transition-all duration-200 shadow-xl flex items-center justify-center gap-2 ${
                  (!currentChunkId || loading || chunkLoading)
                    ? 'opacity-50 cursor-not-allowed bg-slate-500/20 text-white/50 border border-white/10 shadow-none'
                    : `${mindmapTheme.primaryBtn} hover:scale-[1.02] active:scale-[0.98] border`
                }`}
              >
                <Sparkles size={18} className="stroke-[2.5]" />
                <span>إنشاء خريطة ذهنية جديدة</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
