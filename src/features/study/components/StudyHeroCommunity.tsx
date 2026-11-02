import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, HelpCircle, Users, Sparkles, BookOpen, Clock,
  ArrowLeft, Search, Filter, Share2, Award, CheckCircle2, ChevronRight
} from 'lucide-react'

export interface CommunityMindmapItem {
  id: string | number
  title: string
  treeData?: any[]
  chunkId?: string
  authorName?: string
  bookTitle?: string
  lessonTitle?: string
  createdAt?: string
  nodesCount?: number
  isShared?: boolean
}

export interface CommunityQuizItem {
  id: string | number
  title: string
  questionsData?: any
  chunkId?: string
  authorName?: string
  bookTitle?: string
  lessonTitle?: string
  createdAt?: string
  questionsCount?: number
  difficulty?: string
  isShared?: boolean
}

interface StudyHeroCommunityProps {
  accentColor: 'purple' | 'emerald' | 'amber' | 'blue'
  isDark: boolean
  onSelectMindmap: (mindmap: CommunityMindmapItem) => void
  onSelectQuiz: (quiz: CommunityQuizItem) => void
}

export function StudyHeroCommunity({
  accentColor,
  isDark,
  onSelectMindmap,
  onSelectQuiz
}: StudyHeroCommunityProps) {
  const [activeTab, setActiveTab] = useState<'mindmaps' | 'quizzes'>('mindmaps')
  const [searchQuery, setSearchQuery] = useState('')
  const [communityMindmaps, setCommunityMindmaps] = useState<CommunityMindmapItem[]>([])
  const [communityQuizzes, setCommunityQuizzes] = useState<CommunityQuizItem[]>([])

  // Load actual published items from LocalStorage
  const loadCommunityData = () => {
    try {
      const rawMindmaps = localStorage.getItem('zad_community_mindmaps')
      let userMindmaps: any[] = rawMindmaps ? JSON.parse(rawMindmaps) : []
      if (!Array.isArray(userMindmaps)) userMindmaps = []

      // Normalize user mindmaps
      const mappedUserMindmaps: CommunityMindmapItem[] = userMindmaps.map(m => ({
        id: m.id || `user-mm-${Math.random()}`,
        title: m.title || 'تشجير منشور جديد',
        treeData: m.treeData || [],
        chunkId: m.chunkId,
        authorName: m.authorName || 'طالب زاد (أنت)',
        bookTitle: m.bookTitle || 'درس تراثي',
        lessonTitle: m.lessonTitle || (m.chunkId ? `درس ${m.chunkId}` : 'موضوع فقهي'),
        createdAt: m.createdAt || new Date().toISOString(),
        nodesCount: Array.isArray(m.treeData) ? m.treeData.length : 10,
        isShared: true
      }))

      setCommunityMindmaps(mappedUserMindmaps)
    } catch (e) {
      console.warn('Error reading community mindmaps:', e)
      setCommunityMindmaps([])
    }

    try {
      const rawQuizzes = localStorage.getItem('zad_community_quizzes')
      let userQuizzes: any[] = rawQuizzes ? JSON.parse(rawQuizzes) : []
      if (!Array.isArray(userQuizzes)) userQuizzes = []

      const mappedUserQuizzes: CommunityQuizItem[] = userQuizzes.map(q => {
        let qData = q.questionsData
        if (typeof qData === 'string') {
          try { qData = JSON.parse(qData) } catch { }
        }
        const qCount = Array.isArray(qData) ? qData.length : Array.isArray(qData?.questions) ? qData.questions.length : 5
        return {
          id: q.id || `user-qz-${Math.random()}`,
          title: q.title || 'اختبار تقييمي منشور',
          questionsData: qData,
          chunkId: q.chunkId,
          authorName: q.authorName || 'طالب زاد (أنت)',
          bookTitle: q.bookTitle || 'درس تراثي',
          lessonTitle: q.lessonTitle || (q.chunkId ? `درس ${q.chunkId}` : 'موضوع تقييمي'),
          createdAt: q.createdAt || new Date().toISOString(),
          questionsCount: qCount,
          difficulty: q.difficulty || 'متوسط',
          isShared: true
        }
      })

      setCommunityQuizzes(mappedUserQuizzes)
    } catch (e) {
      console.warn('Error reading community quizzes:', e)
      setCommunityQuizzes([])
    }
  }

  useEffect(() => {
    loadCommunityData()
    const handleMMUpdate = () => loadCommunityData()
    const handleQZUpdate = () => loadCommunityData()

    window.addEventListener('zad_mindmaps_updated', handleMMUpdate)
    window.addEventListener('zad_quizzes_updated', handleQZUpdate)
    return () => {
      window.removeEventListener('zad_mindmaps_updated', handleMMUpdate)
      window.removeEventListener('zad_quizzes_updated', handleQZUpdate)
    }
  }, [])

  // Filter based on search query
  const filteredMindmaps = communityMindmaps.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.bookTitle && m.bookTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (m.authorName && m.authorName.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredQuizzes = communityQuizzes.filter(q =>
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (q.bookTitle && q.bookTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (q.authorName && q.authorName.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Style helpers based on theme
  const getBadgeStyle = () => {
    switch (accentColor) {
      case 'emerald':
        return isDark ? 'bg-teal-500/20 text-teal-300 border-teal-500/30' : 'bg-teal-50 text-teal-800 border-teal-200'
      case 'amber':
        return isDark ? 'bg-amber-500/20 text-[#dfbf83] border-[#dfbf83]/30' : 'bg-amber-50 text-amber-900 border-[#dfbf83]/40'
      case 'blue':
        return isDark ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-blue-50 text-blue-800 border-blue-200'
      case 'purple':
      default:
        return isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-purple-50 text-purple-800 border-purple-200'
    }
  }

  const getActiveTabStyle = () => {
    switch (accentColor) {
      case 'emerald':
        return isDark ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30' : 'bg-teal-700 text-white shadow-md'
      case 'amber':
        return isDark ? 'bg-[#b88d46] text-stone-950 font-black shadow-lg shadow-amber-500/30' : 'bg-[#78350f] text-white shadow-md'
      case 'blue':
        return isDark ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-blue-700 text-white shadow-md'
      case 'purple':
      default:
        return isDark ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'bg-purple-700 text-white shadow-md'
    }
  }

  const getCardBorder = () => {
    if (isDark) {
      return 'bg-black/35 hover:bg-black/55 border-white/10 hover:border-white/20'
    }
    return 'bg-white/80 hover:bg-white border-slate-200/90 shadow-sm hover:shadow-md'
  }

  return (
    <div className="w-full mt-10 pt-8 border-t border-white/10 relative z-20 text-right" dir="rtl">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold mb-2 border backdrop-blur-md"
            style={{ backdropFilter: 'blur(12px)' }}>
            <Users size={14} className="text-amber-500" />
            <span className={isDark ? 'text-amber-300' : 'text-amber-800'}>مجتمع زاد التدارسي التشاركي</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-500 font-bold">جديد</span>
          </div>
          <h2 className={`text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            المكتبة التشاركية للتشجيرات والاختبارات المنشورة
          </h2>
          <p className={`text-xs sm:text-sm mt-1 max-w-2xl ${isDark ? 'text-white/65' : 'text-slate-600'}`}>
            استفد من خلاصة مدارسة زملائك؛ تصفح الخرائط الذهنية التي نشرها الطلاب أو اخض اختباراتهم التقييمية لتعزيز فهمك للمتون.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className={`p-1 rounded-2xl border flex items-center gap-1 backdrop-blur-xl ${
          isDark ? 'bg-black/40 border-white/10' : 'bg-slate-100/90 border-slate-200'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab('mindmaps')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 cursor-pointer ${
              activeTab === 'mindmaps'
                ? getActiveTabStyle()
                : isDark ? 'text-white/70 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Brain size={16} />
            <span>التشجيرات المنشورة</span>
            <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-black/20 text-current">
              {communityMindmaps.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quizzes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 cursor-pointer ${
              activeTab === 'quizzes'
                ? getActiveTabStyle()
                : isDark ? 'text-white/70 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle size={16} />
            <span>الاختبارات المنشورة</span>
            <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-black/20 text-current">
              {communityQuizzes.length}
            </span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6 max-w-md">
        <Search size={16} className={`absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-white/40' : 'text-slate-400'}`} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={activeTab === 'mindmaps' ? 'ابحث في تشجيرات المجتمع المنشورة...' : 'ابحث في اختبارات المجتمع المنشورة...'}
          className={`w-full pr-10 pl-4 py-2.5 rounded-xl text-xs sm:text-sm border backdrop-blur-xl transition-all outline-none ${
            isDark
              ? 'bg-black/30 border-white/15 text-white placeholder-white/40 focus:border-white/30'
              : 'bg-white/80 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-slate-400'
          }`}
        />
      </div>

      {/* Mindmaps Tab View */}
      {activeTab === 'mindmaps' && (
        <motion.div
          key="community-mindmaps-tab"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredMindmaps.length === 0 ? (
            <div className={`col-span-full py-12 text-center rounded-2xl border ${isDark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              <Brain size={36} className="mx-auto mb-2 opacity-40" />
              <p className="font-bold text-sm">لم يتم العثور على تشجيرات تطابق بحثك</p>
              <p className="text-xs mt-1 text-slate-400">يمكنك نشر خريطتك الذهنية الأولى لأي درس من مساحة المدارسة لتظهر هنا لجميع زملائك.</p>
            </div>
          ) : (
            filteredMindmaps.map((mm) => (
              <div
                key={mm.id}
                onClick={() => onSelectMindmap(mm)}
                className={`rounded-2xl border p-4.5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between group ${getCardBorder()}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-full border ${getBadgeStyle()}`}>
                      {mm.bookTitle || 'درس تراثي'}
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      <Sparkles size={12} />
                      <span>{mm.nodesCount || 10} مفهوم هيكلي</span>
                    </div>
                  </div>

                  <h3 className={`text-sm sm:text-base font-black leading-snug line-clamp-2 mb-2 group-hover:text-amber-400 transition-colors ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {mm.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs mb-4">
                    <span className={`font-semibold ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                      نُشر بواسطة:
                    </span>
                    <span className={`font-bold ${isDark ? 'text-white/90' : 'text-slate-800'}`}>
                      {mm.authorName}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className={`text-[11px] ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                    {new Date(mm.createdAt || Date.now()).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectMindmap(mm)
                    }}
                    className="inline-flex items-center gap-1.5 font-bold text-amber-500 hover:text-amber-400 transition-transform group-hover:-translate-x-1"
                  >
                    <span>استعراض وتشجير في المدارسة</span>
                    <ArrowLeft size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </motion.div>
      )}

      {/* Quizzes Tab View */}
      {activeTab === 'quizzes' && (
        <motion.div
          key="community-quizzes-tab"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredQuizzes.length === 0 ? (
            <div className={`col-span-full py-12 text-center rounded-2xl border ${isDark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              <HelpCircle size={36} className="mx-auto mb-2 opacity-40" />
              <p className="font-bold text-sm">لم يتم العثور على اختبارات تطابق بحثك</p>
              <p className="text-xs mt-1 text-slate-400">يمكنك نشر اختبارك لأي درس من مساحة المدارسة ليظهر هنا لجميع زملائك.</p>
            </div>
          ) : (
            filteredQuizzes.map((qz) => (
              <div
                key={qz.id}
                onClick={() => onSelectQuiz(qz)}
                className={`rounded-2xl border p-4.5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between group ${getCardBorder()}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-full border ${getBadgeStyle()}`}>
                      {qz.bookTitle || 'درس تراثي'}
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      <Award size={12} />
                      <span>{qz.questionsCount || 5} أسئلة • {qz.difficulty || 'متوسط'}</span>
                    </div>
                  </div>

                  <h3 className={`text-sm sm:text-base font-black leading-snug line-clamp-2 mb-2 group-hover:text-emerald-400 transition-colors ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {qz.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs mb-4">
                    <span className={`font-semibold ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                      إعداد الطالب:
                    </span>
                    <span className={`font-bold ${isDark ? 'text-white/90' : 'text-slate-800'}`}>
                      {qz.authorName}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className={`text-[11px] ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                    {new Date(qz.createdAt || Date.now()).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectQuiz(qz)
                    }}
                    className="inline-flex items-center gap-1.5 font-bold text-emerald-400 hover:text-emerald-300 transition-transform group-hover:-translate-x-1"
                  >
                    <span>خوض الاختبار في المدارسة</span>
                    <ArrowLeft size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </motion.div>
      )}
    </div>
  )
}
