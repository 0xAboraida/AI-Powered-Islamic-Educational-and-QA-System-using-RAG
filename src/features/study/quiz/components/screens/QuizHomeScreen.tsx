import { useEffect, useState } from 'react'
import {
  ClipboardList, Plus, History, Users, RefreshCw, PlayCircle, ChevronLeft, Trash2,
  Sparkles, HelpCircle, BarChart2, Target, Calendar, BookOpen, Database, Brain, User, Trophy,
  ChevronDown, SlidersHorizontal, Clock, CheckCircle2, ListFilter, Layers
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { studyApi, type QuizDto } from '../../../../../api/studyApi'

interface QuizHomeScreenProps {
  currentChunkId: string | null
  isDark: boolean
  onStartSetup: () => void
  onLoadQuiz?: (quizDto: any) => void
  chunkLoading?: boolean
}

type ViewMode = 'menu' | 'my_quizzes' | 'community_quizzes'

export function QuizHomeScreen({ currentChunkId, isDark, onStartSetup, onLoadQuiz, chunkLoading }: QuizHomeScreenProps) {
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
        className={`p-4 sm:p-6 rounded-3xl border w-full max-w-4xl mx-auto relative overflow-hidden flex flex-col items-center transition-all duration-500 ${isDark
            ? 'bg-gradient-to-br from-[#12041f]/95 via-[#160628]/90 to-emerald-950/20 border-emerald-500/20 text-white shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl'
            : 'bg-white border-emerald-200 text-slate-900 shadow-2xl'
          }`}
        dir="rtl"
      >
        {/* Top Glow Highlights */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header Bar */}
        <div className="flex items-center justify-between w-full mb-4 relative z-10 border-b pb-3.5 border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`p-2 rounded-xl flex-shrink-0 ${isDark ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-700'}`}>
              <Brain size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`text-lg sm:text-xl font-extrabold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold shadow-sm ${isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-800'}`}>
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
            <RefreshCw className="animate-spin text-emerald-400 mb-3" size={32} />
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
            className={`p-8 rounded-3xl border max-w-md w-full relative overflow-hidden text-center flex flex-col items-center gap-4 transition-all duration-500 ${isDark ? 'bg-gradient-to-br from-[#12041f]/95 via-[#12041f]/90 to-emerald-900/10 border-emerald-500/20 text-white shadow-[0_0_20px_rgba(16,185,129,0.05)] backdrop-blur-md' : 'bg-gradient-to-b from-emerald-50/50 via-white to-white border-emerald-200/90 text-slate-900 shadow-xl backdrop-blur-md'
              }`}
            dir="rtl"
          >
            <div className="absolute -top-12 -left-12 w-36 h-36 bg-emerald-500/20 rounded-full blur-3xl animate-pulse -z-10"></div>
            <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-500 -z-10"></div>

            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-2 relative z-10 border shadow-xl transition-all ${isDark ? 'bg-gradient-to-br from-[#1a0730] to-[#12041f] border-emerald-500/40 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
              }`}>
              <ClipboardList size={36} className="drop-shadow-md" />
            </div>

            <h3 className="text-2xl font-black text-center bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 bg-clip-text text-transparent">
              اختبارات التقييم التفاعلية
            </h3>


            <div className="grid grid-cols-2 gap-3 w-full mt-1">
              <button
                type="button"
                onClick={() => setViewMode('my_quizzes')}
                className={`flex flex-col items-center p-4 rounded-2xl border transition-all duration-300 hover:-translate-y-1 active:scale-95 cursor-pointer text-center ${isDark ? 'bg-[#12041f]/70 border-white/10 hover:border-emerald-500/40 hover:bg-emerald-900/20 hover:shadow-lg hover:shadow-emerald-500/20 shadow-md' : 'bg-white/90 border-emerald-100/80 hover:border-emerald-400 hover:bg-emerald-50/60 hover:shadow-lg shadow-sm'
                  }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-transform duration-300 ${isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-600'}`}>
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
                className={`flex flex-col items-center p-4 rounded-2xl border transition-all duration-300 hover:-translate-y-1 active:scale-95 cursor-pointer text-center ${isDark ? 'bg-[#12041f]/70 border-white/10 hover:border-sky-500/40 hover:bg-sky-900/20 hover:shadow-lg hover:shadow-sky-500/20 shadow-md' : 'bg-white/90 border-sky-100/80 hover:border-sky-400 hover:bg-sky-50/60 hover:shadow-lg shadow-sm'
                  }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-transform duration-300 ${isDark ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-sky-100 text-sky-600'}`}>
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
                  : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white hover:shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] border border-emerald-400/30'
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
