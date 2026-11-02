import { useEffect, useState } from 'react'
import {
  ClipboardList, Plus, History, Users, RefreshCw, PlayCircle, ChevronLeft, Trash2,
  Sparkles, HelpCircle, BarChart2, Target, Calendar, BookOpen, Database, Brain, User, Trophy,
  ChevronDown, SlidersHorizontal, Clock, CheckCircle2, ListFilter, Layers
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { studyApi, type QuizDto } from '../../../../../api/studyApi'
import { useTheme, type AccentColor } from '../../../../../contexts/ThemeContext'

function getQuizHomeThemeTokens(accentColor: AccentColor = 'emerald', isDark: boolean = true) {
  switch (accentColor) {
    case 'blue':
      return {
        cardBorder: isDark ? 'border-sky-500/25' : 'border-sky-200/80',
        cardBg: isDark
          ? 'bg-[#0b1626] text-white shadow-[0_12px_40px_rgba(0,0,0,0.5)]'
          : 'bg-[#fafcff] border-sky-100 text-slate-900 shadow-xl',
        glowPrimary: 'bg-sky-500/10',
        glowSecondary: 'bg-blue-600/10',
        iconBox: isDark ? 'bg-[#0d223f] border-sky-500/40 text-sky-300' : 'bg-sky-50 border-sky-200 text-sky-800',
        titleColor: 'text-[#12396e] dark:text-sky-200',
        primaryBtn: 'bg-[#154696] hover:bg-[#103878] active:bg-[#0c2b5d] text-white shadow-md border border-[#103878]/30 transition-all',
        cardOption: isDark ? 'hover:border-sky-500/40 hover:bg-sky-900/20 hover:shadow-sky-500/20' : 'hover:border-sky-300 hover:bg-sky-50/70',
        badge: isDark ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'bg-sky-100 text-sky-800 border border-sky-200',
        iconPill: isDark ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30' : 'bg-sky-100 text-sky-800',
        textAccent: 'text-[#154696] dark:text-sky-300',
        borderAccent: isDark ? 'border-sky-500/30' : 'border-sky-200',
        chipBg: isDark ? 'bg-sky-500/10 border-sky-500/20' : 'bg-sky-50/80 border-sky-200',
        chipText: isDark ? 'text-sky-300' : 'text-sky-800',
      }
    case 'amber':
      return {
        cardBorder: isDark ? 'border-[#5e431a]/40' : 'border-[#e6d8c3]',
        cardBg: isDark
          ? 'bg-[#18120a] text-stone-100 shadow-[0_12px_40px_rgba(0,0,0,0.5)]'
          : 'bg-[#fcfaf6] border-[#e6d8c3] text-stone-900 shadow-xl',
        glowPrimary: 'bg-[#c99a4e]/10',
        glowSecondary: 'bg-[#8a6328]/10',
        iconBox: isDark ? 'bg-[#261b0c] border-[#8a6328]/50 text-[#dfbf83]' : 'bg-[#f5ede0] border-[#decbb0] text-[#7a5720]',
        titleColor: 'text-[#5c4118] dark:text-[#edd8ae]',
        primaryBtn: 'bg-[#7a5720] hover:bg-[#684918] active:bg-[#593d12] text-white shadow-md border border-[#684918]/30 transition-all',
        cardOption: isDark ? 'hover:border-[#8a6328]/50 hover:bg-[#261b0c]/40 hover:shadow-stone-900/30' : 'hover:border-[#b88d46] hover:bg-[#f6ede0]',
        badge: isDark ? 'bg-[#5e431a]/40 text-[#edd8ae] border border-[#8a6328]/40' : 'bg-[#f5ecdc] text-[#5e431a] border border-[#e2d2ba]',
        iconPill: isDark ? 'bg-[#3b2a12] text-[#dfbf83] border border-[#8a6328]/40' : 'bg-[#f5ede0] text-[#7a5720]',
        textAccent: 'text-[#6e4e1b] dark:text-[#edd8ae]',
        borderAccent: isDark ? 'border-[#5e431a]/40' : 'border-[#e2d2ba]',
        chipBg: isDark ? 'bg-[#5e431a]/20 border-[#8c672b]/30' : 'bg-[#f5ecdc]/80 border-[#e2d2ba]',
        chipText: isDark ? 'text-[#edd8ae]' : 'text-[#5e431a]',
      }
    case 'purple':
      return {
        cardBorder: isDark ? 'border-purple-500/25' : 'border-purple-200/80',
        cardBg: isDark
          ? 'bg-[#140624] text-white shadow-[0_12px_40px_rgba(0,0,0,0.5)]'
          : 'bg-[#faf7fd] border-purple-100 text-slate-900 shadow-xl',
        glowPrimary: 'bg-purple-500/10',
        glowSecondary: 'bg-fuchsia-600/10',
        iconBox: isDark ? 'bg-[#240a3d] border-purple-500/40 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-800',
        titleColor: 'text-[#4a1572] dark:text-purple-200',
        primaryBtn: 'bg-[#581c87] hover:bg-[#4a1572] active:bg-[#3b0f5c] text-white shadow-md border border-[#4a1572]/30 transition-all',
        cardOption: isDark ? 'hover:border-purple-500/40 hover:bg-purple-900/20 hover:shadow-purple-500/20' : 'hover:border-purple-300 hover:bg-purple-50/70',
        badge: isDark ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-purple-100 text-purple-800 border border-purple-200',
        iconPill: isDark ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30' : 'bg-purple-100 text-purple-800',
        textAccent: 'text-[#581c87] dark:text-purple-300',
        borderAccent: isDark ? 'border-purple-500/30' : 'border-purple-200',
        chipBg: isDark ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50/80 border-purple-200',
        chipText: isDark ? 'text-purple-300' : 'text-purple-800',
      }
    case 'emerald':
    default:
      return {
        cardBorder: isDark ? 'border-emerald-500/25' : 'border-emerald-200/80',
        cardBg: isDark
          ? 'bg-[#051c14] text-white shadow-[0_12px_40px_rgba(0,0,0,0.5)]'
          : 'bg-[#f7fcf9] border-emerald-100 text-slate-900 shadow-xl',
        glowPrimary: 'bg-emerald-500/10',
        glowSecondary: 'bg-teal-600/10',
        iconBox: isDark ? 'bg-[#092b1f] border-emerald-500/40 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800',
        titleColor: 'text-[#065f46] dark:text-emerald-200',
        primaryBtn: 'bg-[#046c4e] hover:bg-[#03543d] active:bg-[#023e2d] text-white shadow-md border border-[#03543d]/30 transition-all',
        cardOption: isDark ? 'hover:border-emerald-500/40 hover:bg-emerald-900/20 hover:shadow-emerald-500/20' : 'hover:border-emerald-300 hover:bg-emerald-50/70',
        badge: isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border border-emerald-200',
        iconPill: isDark ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-800',
        textAccent: 'text-[#046c4e] dark:text-emerald-300',
        borderAccent: isDark ? 'border-emerald-500/30' : 'border-emerald-200',
        chipBg: isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50/80 border-emerald-200',
        chipText: isDark ? 'text-emerald-300' : 'text-emerald-800',
      }
  }
}

interface QuizHomeScreenProps {
  currentChunkId: string | null
  isDark: boolean
  onStartSetup: () => void
  onLoadQuiz?: (quizDto: any) => void
  chunkLoading?: boolean
}

type ViewMode = 'menu' | 'my_quizzes' | 'community_quizzes'

export function QuizHomeScreen({ currentChunkId, isDark, onStartSetup, onLoadQuiz, chunkLoading }: QuizHomeScreenProps) {
  const { accentColor } = useTheme()
  const theme = getQuizHomeThemeTokens(accentColor, isDark)
  const [viewMode, setViewMode] = useState<ViewMode>('menu')
  const [filterScope, setFilterScope] = useState<'current' | 'all'>('current')

  const [myQuizzes, setMyQuizzes] = useState<QuizDto[]>([])
  const [communityQuizzes, setCommunityQuizzes] = useState<QuizDto[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({ myCount: 0, communityCount: 0 })
  const [expandedQuizId, setExpandedQuizId] = useState<number | null>(null)

  const isQuizMatchingChunk = (quiz: any, targetChunkId: string | null) => {
    if (!targetChunkId) return true
    const qChunk = quiz?.chunkId || quiz?.chunk_id || quiz?.chunk
    if (!qChunk) return true
    return String(qChunk).trim() === String(targetChunkId).trim()
  }

  const loadQuizzes = async () => {
    setLoading(true)
    try {
      // Send 2 parallel requests directly to Backend API (Source of Truth):
      const [myResult, communityResult] = await Promise.all([
        studyApi.getUserQuizzes().catch(() => [] as QuizDto[]),
        currentChunkId
          ? studyApi.getCommunityQuizzesByChunk(currentChunkId).catch(() => [] as QuizDto[])
          : studyApi.getCommunityQuizzesByChunk('').catch(() => [] as QuizDto[])
      ])

      let fetchedMy: any[] = []
      if (Array.isArray(myResult)) {
        fetchedMy = myResult
      } else if (myResult && typeof myResult === 'object') {
        const resObj = myResult as any
        if (Array.isArray(resObj.quizzes)) fetchedMy = resObj.quizzes
        else if (Array.isArray(resObj.data)) fetchedMy = resObj.data
        else if (Array.isArray(resObj.items)) fetchedMy = resObj.items
      }

      let fetchedCommunity: any[] = []
      if (Array.isArray(communityResult)) {
        fetchedCommunity = communityResult
      } else if (communityResult && typeof communityResult === 'object') {
        const resObj = communityResult as any
        if (Array.isArray(resObj.quizzes)) fetchedCommunity = resObj.quizzes
        else if (Array.isArray(resObj.data)) fetchedCommunity = resObj.data
        else if (Array.isArray(resObj.items)) fetchedCommunity = resObj.items
      }

      // Deduplicate user quizzes strictly by ID
      const seenMyIds = new Set<number>()
      const uniqueMy: QuizDto[] = []
      for (const q of fetchedMy) {
        if (q && q.id && !seenMyIds.has(q.id)) {
          seenMyIds.add(q.id)
          uniqueMy.push(q)
        } else if (q && !q.id) {
          uniqueMy.push(q)
        }
      }
      uniqueMy.sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime())

      // Filter out user's own quizzes from community list
      const uniqueCommunity = fetchedCommunity.filter(q => q && (q.id ? !seenMyIds.has(q.id) : true))
      uniqueCommunity.sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime())

      setMyQuizzes(uniqueMy)
      setCommunityQuizzes(uniqueCommunity)

      const myMatching = uniqueMy.filter(q => isQuizMatchingChunk(q, currentChunkId))
      const commMatching = uniqueCommunity.filter(q => isQuizMatchingChunk(q, currentChunkId))

      setStats({
        myCount: currentChunkId ? myMatching.length : uniqueMy.length,
        communityCount: currentChunkId ? commMatching.length : uniqueCommunity.length,
      })
    } catch (err) {
      console.warn('Error loading quizzes from API:', err)
      setMyQuizzes([])
      setCommunityQuizzes([])
      setStats({ myCount: 0, communityCount: 0 })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuizzes()
  }, [currentChunkId, viewMode])

  const handleDeleteLocalQuiz = (e: React.MouseEvent, quizId: number) => {
    e.stopPropagation()
    setMyQuizzes(prev => (Array.isArray(prev) ? prev.filter(q => q && q.id !== quizId) : []))
    setStats(s => ({ ...s, myCount: Math.max(0, s.myCount - 1) }))
  }

  const renderQuizList = (quizzes: QuizDto[], title: string) => {
    const safeQuizzes = Array.isArray(quizzes) ? quizzes : []
    const filteredQuizzes = safeQuizzes.filter(q => q && isQuizMatchingChunk(q, currentChunkId))

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -12 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`p-4 sm:p-6 rounded-3xl border w-full max-w-4xl mx-auto relative overflow-hidden flex flex-col items-center transition-all duration-500 ${
          isDark
            ? `${theme.cardBg} ${theme.cardBorder} text-white shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl`
            : `${theme.cardBg} ${theme.cardBorder} text-slate-900 shadow-2xl`
        }`}
        dir="rtl"
      >
        {/* Top Glow Highlights */}
        <div className={`absolute -top-24 -right-24 w-48 h-48 ${theme.glowPrimary} rounded-full blur-3xl pointer-events-none animate-pulse`}></div>
        <div className={`absolute -bottom-24 -left-24 w-48 h-48 ${theme.glowSecondary} rounded-full blur-3xl pointer-events-none`}></div>

        {/* Header Bar */}
        <div className="flex items-center justify-between w-full mb-4 relative z-10 border-b pb-3.5 border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`p-2 rounded-xl flex-shrink-0 ${theme.iconPill}`}>
              <Brain size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`text-lg sm:text-xl font-extrabold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold shadow-sm ${theme.badge}`}>
                  {filteredQuizzes.length} اختبار
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate hidden sm:block">سجل الاختبارات التقييمية لمراجعة تحصيلك العلمي</p>
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



        {loading ? (
          <div className="py-14 flex flex-col items-center justify-center relative z-10">
            <RefreshCw className={`animate-spin ${theme.textAccent} mb-3`} size={32} />
            <p className={`text-xs font-semibold ${isDark ? 'text-white/70' : 'text-slate-500'}`}>جاري استرجاع الاختبارات الخاصة بك...</p>
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className={`w-full py-14 rounded-2xl border text-center relative z-10 flex flex-col items-center justify-center gap-2.5 ${isDark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
            <History size={36} className="text-slate-500/60" />
            <p className="font-bold text-sm">لا توجد اختبارات محفوظة لمجال التصفية المحدد.</p>
            <p className="text-xs text-slate-400 max-w-xs">أنشئ اختباراً جديداً من الشاشة الرئيسية لبدء تقييم مستواك الأكاديمي.</p>
          </div>
        ) : (
          <div className="w-full grid gap-3.5 overflow-y-auto max-h-[62vh] pl-1 pr-1 relative z-10 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-emerald-500/40 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
            {filteredQuizzes.map((quiz, index) => {
              if (!quiz) return null
              let questionsDataObj = quiz.questionsData
              if (typeof questionsDataObj === 'string') {
                try { questionsDataObj = JSON.parse(questionsDataObj) } catch { }
              }
              const numQuestions = Array.isArray(questionsDataObj)
                ? questionsDataObj.length
                : Array.isArray(questionsDataObj?.questions)
                  ? questionsDataObj.questions.length
                  : 0;

              const formattedDate = quiz.createdAt
                ? new Date(quiz.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })
                : 'حديثاً'

              const modeLabel = quiz.mode === 'comprehensive' ? 'شامل' : quiz.mode === 'focused' ? 'مركّز' : quiz.mode || 'عام'
              const diffLabel = quiz.difficulty === 'hard' ? 'صعب' : quiz.difficulty === 'easy' ? 'سهل' : 'متوسط'
              const diffColor = quiz.difficulty === 'hard' ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' : quiz.difficulty === 'easy' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/15 border-amber-500/30 text-amber-400'

              return (
                <div
                  key={quiz.id || index}
                  onClick={() => onLoadQuiz?.(quiz)}
                  className={`w-full group p-4 sm:p-5 rounded-2xl border-l border-t border-b border-r-4 transition-all duration-300 cursor-pointer flex flex-col gap-3 relative overflow-hidden ${
                    isDark
                      ? 'bg-[#150727]/90 border-white/10 border-r-emerald-400 hover:border-emerald-500/60 hover:border-r-emerald-300 hover:bg-[#1a0932] shadow-md hover:shadow-[0_8px_30px_rgba(16,185,129,0.25)] backdrop-blur-xl'
                      : 'bg-white border-slate-200 border-r-emerald-500 hover:border-emerald-400 hover:shadow-xl'
                  }`}
                >

                  {/* Top Header inside card */}
                  <div className="flex items-center justify-between gap-2.5 w-full">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      {/* Sequential Index Badge (#1, #2, #3...) */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm sm:text-base flex-shrink-0 transition-all duration-300 ${
                        isDark 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 group-hover:scale-110 group-hover:bg-emerald-500/30 group-hover:shadow-[0_0_12px_rgba(16,185,129,0.5)]' 
                          : 'bg-emerald-100 text-emerald-700 border border-emerald-300 group-hover:scale-110'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex flex-col justify-center min-w-0 flex-1">
                        <span className={`font-black text-sm sm:text-base leading-snug break-words transition-colors ${
                          isDark ? 'text-white group-hover:text-emerald-300' : 'text-slate-900 group-hover:text-emerald-700'
                        }`}>
                          {quiz.title || 'اختبار تقييم زاد'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={(e) => handleDeleteLocalQuiz(e, quiz.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isDark ? 'bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/20' : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200'
                        }`}
                        title="حذف الاختبار"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Date & Settings Dropdown Toggle Row (Right Aligned Together) */}
                  <div className="flex items-center justify-between w-full pt-2.5 border-t border-white/10 gap-2" dir="rtl">
                    <div className="flex items-center gap-2">
                      {/* 1. Settings Dropdown Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setExpandedQuizId(expandedQuizId === quiz.id ? null : quiz.id)
                        }}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                          expandedQuizId === quiz.id
                            ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500/40'
                            : isDark
                              ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        <SlidersHorizontal size={14} className="text-emerald-400" />
                        <span>خيارات الاختبار</span>
                        <motion.div
                          animate={{ rotate: expandedQuizId === quiz.id ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown size={14} />
                        </motion.div>
                      </button>

                      {/* 2. Date Badge with Motion Animation immediately adjacent */}
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all duration-300 ${
                          isDark 
                            ? 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-emerald-300 hover:border-emerald-500/30 shadow-sm' 
                            : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
                        }`}
                      >
                        <Calendar size={13} className="text-emerald-400 animate-pulse" />
                        <span>{formattedDate}</span>
                      </motion.div>
                    </div>
                  </div>

                  {/* Dropdown Content for Quiz Setup Details with Smooth Animation */}
                  <AnimatePresence>
                    {expandedQuizId === quiz.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -6 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -6 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        onClick={(e) => e.stopPropagation()}
                        className={`w-full p-3 rounded-2xl border text-[11px] flex flex-wrap items-center gap-2 mt-1 ${
                          isDark 
                            ? 'bg-gradient-to-b from-[#190831]/95 to-[#120524]/95 border-emerald-500/30 text-slate-200 shadow-[0_10px_25px_rgba(0,0,0,0.4)] backdrop-blur-xl' 
                            : 'bg-slate-50 border-slate-200 text-slate-700 shadow-inner'
                        }`}
                      >
                        {/* 1. عدد الأسئلة المطلوب */}
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
                          isDark ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-slate-100 border-slate-200'
                        }`}>
                          <HelpCircle size={13} className="text-emerald-400 flex-shrink-0" />
                          <span className={isDark ? 'text-slate-300 font-medium' : 'text-slate-600 font-medium'}>عدد الأسئلة:</span>
                          <span className="font-bold text-emerald-300">{numQuestions} أسئلة</span>
                        </div>

                        {/* 2. مستوى الصعوبة */}
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
                          isDark ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-slate-100 border-slate-200'
                        }`}>
                          <BarChart2 size={13} className="text-emerald-400 flex-shrink-0" />
                          <span className={isDark ? 'text-slate-300 font-medium' : 'text-slate-600 font-medium'}>الصعوبة:</span>
                          <span className="font-bold text-emerald-300">{diffLabel}</span>
                        </div>

                        {/* 3. نمط التوليد بالذكاء الاصطناعي */}
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
                          isDark ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-slate-100 border-slate-200'
                        }`}>
                          <Target size={13} className="text-emerald-400 flex-shrink-0" />
                          <span className={isDark ? 'text-slate-300 font-medium' : 'text-slate-600 font-medium'}>نمط التوليد:</span>
                          <span className="font-bold text-emerald-300">{modeLabel}</span>
                        </div>

                        {/* 4. نظام وقت الاختبار */}
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
                          isDark ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-slate-100 border-slate-200'
                        }`}>
                          <Clock size={13} className="text-emerald-400 flex-shrink-0" />
                          <span className={isDark ? 'text-slate-300 font-medium' : 'text-slate-600 font-medium'}>الوقت:</span>
                          <span className="font-bold text-emerald-300">غير محدد (مرن)</span>
                        </div>

                        {/* 5. طريقة ظهور التصحيح والتوضيح */}
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
                          isDark ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-slate-100 border-slate-200'
                        }`}>
                          <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
                          <span className={isDark ? 'text-slate-300 font-medium' : 'text-slate-600 font-medium'}>التصحيح والتوضيح:</span>
                          <span className="font-bold text-emerald-300">فوري بعد الإجابة</span>
                        </div>

                        {/* 6. أنواع الأسئلة المسموح بها */}
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
                          isDark ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-slate-100 border-slate-200'
                        }`}>
                          <ListFilter size={13} className="text-emerald-400 flex-shrink-0" />
                          <span className={isDark ? 'text-slate-300 font-medium' : 'text-slate-600 font-medium'}>أنواع الأسئلة:</span>
                          <span className="font-bold text-emerald-300">خيارات متعددة</span>
                        </div>

                        {/* 7. نمط عرض الأسئلة */}
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
                          isDark ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-slate-100 border-slate-200'
                        }`}>
                          <Layers size={13} className="text-emerald-400 flex-shrink-0" />
                          <span className={isDark ? 'text-slate-300 font-medium' : 'text-slate-600 font-medium'}>عرض الأسئلة:</span>
                          <span className="font-bold text-emerald-300">سؤال تلو الآخر</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action Bar Bottom Row: Start Quiz Button Only */}
                  <div className="flex items-center justify-end pt-1">
                    <button className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 group-hover:shadow-emerald-500/40 group-hover:scale-105 active:scale-95 transition-all">
                      <span>بدء الاختبار</span>
                      <PlayCircle size={16} className="-scale-x-100" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>
    )
  }

  return (
    <div className="w-full flex flex-col items-center justify-center" key="quiz-home">
      <AnimatePresence>
        {viewMode === 'menu' && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className={`p-8 rounded-3xl border max-w-md w-full relative overflow-hidden text-center flex flex-col items-center gap-4 transition-all duration-500 ${
              isDark
                ? `${theme.cardBg} ${theme.cardBorder} text-white backdrop-blur-md`
                : `${theme.cardBg} ${theme.cardBorder} text-slate-900 shadow-xl backdrop-blur-md`
            }`}
            dir="rtl"
          >
            <div className={`absolute -top-12 -left-12 w-36 h-36 ${theme.glowPrimary} rounded-full blur-3xl animate-pulse -z-10`}></div>
            <div className={`absolute -bottom-12 -right-12 w-36 h-36 ${theme.glowSecondary} rounded-full blur-3xl animate-pulse delay-500 -z-10`}></div>

            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-2 relative z-10 border shadow-xl transition-all ${theme.iconBox}`}>
              <ClipboardList size={36} className="drop-shadow-md" />
            </div>

            <h3 className={`text-2xl font-black text-center ${theme.titleColor}`}>
              اختبارات التقييم التفاعلية
            </h3>

            <div className="grid grid-cols-2 gap-3 w-full mt-1">
              <button
                type="button"
                onClick={() => setViewMode('my_quizzes')}
                className={`flex flex-col items-center p-4 rounded-2xl border transition-all duration-300 hover:-translate-y-1 active:scale-95 cursor-pointer text-center ${
                  isDark
                    ? `bg-[#12041f]/70 border-white/10 ${theme.cardOption} shadow-md`
                    : `bg-white/90 ${theme.cardOption} shadow-sm border-slate-200`
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-transform duration-300 ${theme.iconPill}`}>
                  <History size={20} />
                </div>
                <span className={`font-extrabold text-xs sm:text-sm mb-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>اختباراتي السابقة</span>
                <span className={`text-[11px] font-medium ${isDark ? 'text-white/60' : 'text-slate-500'}`}>{stats.myCount} اختبار متوفر</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!currentChunkId && stats.communityCount === 0) {
                    alert('الرجاء اختيار درس من الفهرس أولاً لتصفح اختبارات زملائك الخاصة به.')
                    return
                  }
                  setViewMode('community_quizzes')
                }}
                className={`flex flex-col items-center p-4 rounded-2xl border transition-all duration-300 hover:-translate-y-1 active:scale-95 cursor-pointer text-center ${
                  isDark
                    ? `bg-[#12041f]/70 border-white/10 ${theme.cardOption} shadow-md`
                    : `bg-white/90 ${theme.cardOption} shadow-sm border-slate-200`
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-transform duration-300 ${theme.iconPill}`}>
                  <Users size={20} />
                </div>
                <span className={`font-extrabold text-xs sm:text-sm mb-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>اختبارات الإخوة</span>
                <span className={`text-[11px] font-medium ${isDark ? 'text-white/60' : 'text-slate-500'}`}>{stats.communityCount} اختبار متوفر</span>
              </button>
            </div>

            <button
              disabled={!currentChunkId || chunkLoading}
              onClick={() => {
                if (!currentChunkId || chunkLoading) {
                  if (!currentChunkId) alert('الرجاء اختيار درس من الفهرس الجانبي أولاً لإنشاء وتخصيص اختبار جديد حوله.')
                  return
                }
                onStartSetup()
              }}
              className={`w-full mt-1 py-3.5 px-5 rounded-2xl font-black text-xs sm:text-sm transition-all duration-200 shadow-xl flex items-center justify-center gap-2 ${
                (!currentChunkId || chunkLoading)
                  ? 'opacity-50 cursor-not-allowed bg-slate-500/20 text-white/50 border border-white/10 shadow-none'
                  : `${theme.primaryBtn} hover:scale-[1.02] active:scale-[0.98] border`
              }`}
            >
              <Plus size={18} className="stroke-[2.5]" />
              <span>إنشاء وتخصيص اختبار جديد</span>
            </button>
          </motion.div>
        )}

        {viewMode === 'my_quizzes' && renderQuizList(myQuizzes, 'اختباراتي السابقة')}
        {viewMode === 'community_quizzes' && renderQuizList(communityQuizzes, 'اختبارات مكتبة زاد')}
      </AnimatePresence>
    </div>
  )
}
