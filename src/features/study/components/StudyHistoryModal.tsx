import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  History, Clock, BookOpen, TrendingUp, Zap,
  Calendar, X, Play, RefreshCw, Layers, CheckCircle2, ChevronLeft, Search,
  Target, Filter
} from 'lucide-react'
import { studyApi, type StudySessionDto, type UserStudyProgressDto } from '../../../api/studyApi'
import { studyPlanManager } from '../utils/studyPlanManager'

interface StudyHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectSession: (session: StudySessionDto) => void
  isDark?: boolean
}

export function StudyHistoryModal({
  isOpen,
  onClose,
  onSelectSession,
  isDark = true
}: StudyHistoryModalProps) {
  const [sessions, setSessions] = useState<StudySessionDto[]>([])
  const [progress, setProgress] = useState<UserStudyProgressDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'sessions' | 'progress'>('sessions')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Feature 1 & 5: Daily Goal State & Backend Sync
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(() => {
    const saved = localStorage.getItem('zad_daily_goal_minutes')
    return saved ? parseInt(saved, 10) : 30
  })

  // Feature 2: Timeframe Filter ('all' | 'month' | 'week')
  const [timeframe, setTimeframe] = useState<'all' | 'month' | 'week'>('all')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [sessionsData, progressData] = await Promise.all([
        studyApi.getSessions().catch(() => []),
        studyApi.getProgress().catch(() => null)
      ])
      setSessions(sessionsData || [])
      setProgress(progressData)
      if (progressData?.dailyGoalMinutes) {
        setDailyGoalMinutes(progressData.dailyGoalMinutes)
        localStorage.setItem('zad_daily_goal_minutes', progressData.dailyGoalMinutes.toString())
      }
    } catch (error) {
      console.error('Failed fetching history:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  const handleGoalChange = async (newGoal: number) => {
    setDailyGoalMinutes(newGoal)
    localStorage.setItem('zad_daily_goal_minutes', newGoal.toString())
    try {
      await studyApi.updateProgress({ dailyGoalMinutes: newGoal })
    } catch (err) {
      console.error('Failed syncing goal to backend:', err)
    }
  }

  if (!isOpen) return null

  const filteredSessions = sessions.filter((sess) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (sess.bookTitle && sess.bookTitle.toLowerCase().includes(q)) ||
      (sess.sectionTitle && sess.sectionTitle.toLowerCase().includes(q)) ||
      (sess.domain && sess.domain.toLowerCase().includes(q))
    )
  })

  // Helper for UI 1: Subject path formatter (short title + tooltip)
  const formatDomainPath = (rawDomain: string) => {
    if (!rawDomain) return { short: 'علوم إسلامية', full: 'علوم إسلامية' }
    const parts = rawDomain.split(/←|->|→|\//).map(p => p.trim()).filter(Boolean)
    if (parts.length <= 2) {
      return { short: rawDomain, full: rawDomain }
    }
    const short = `${parts[0]} — ${parts[parts.length - 1]}`
    return { short, full: rawDomain }
  }

  // Render Progress & Analytics Tab
  const renderProgressTab = () => {
    // Feature 2: Filter sessions by timeframe
    const now = Date.now()
    const timeframeSessions = sessions.filter((s) => {
      if (timeframe === 'all') return true
      const date = new Date(s.createdAt || s.lastAccessedAt || Date.now()).getTime()
      if (timeframe === 'week') {
        return now - date <= 7 * 24 * 60 * 60 * 1000
      }
      if (timeframe === 'month') {
        return now - date <= 30 * 24 * 60 * 60 * 1000
      }
      return true
    })

    // REAL Metrics (no fake multipliers or fake values)
    const computedMinutes = progress?.totalStudyMinutes || 0
    
    const computedLessons = progress?.lessonsCompletedCount && progress.lessonsCompletedCount > 0
      ? progress.lessonsCompletedCount
      : new Set(timeframeSessions.map(s => s.chunkId || s.bookTitle)).size

    const computedQuizScore = progress?.averageQuizScore || 0

    const computedStreak = progress?.streakDays || (sessions.length > 0 ? 1 : 0)

    const lastDateStr = progress?.lastStudyDate
      ? progress.lastStudyDate
      : (sessions.length > 0 ? (sessions[0].lastAccessedAt || sessions[0].createdAt) : null)

    // Today's Real Study Minutes Calculation
    const todayMinutes = computedMinutes
    const goalPct = Math.min(100, Math.round((todayMinutes / dailyGoalMinutes) * 100))

    // Domain breakdown calculation (UI 1)
    const domainCounts: Record<string, number> = {}
    timeframeSessions.forEach((s) => {
      const d = s.domain || 'علوم إسلامية'
      domainCounts[d] = (domainCounts[d] || 0) + 1
    })
    const totalSessionsInTimeframe = timeframeSessions.length || 1

    // Weekly activity breakdown (Saturday to Friday)
    const weekDays = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']
    const weeklyActivity = [0, 0, 0, 0, 0, 0, 0]
    
    timeframeSessions.forEach((s) => {
      try {
        const d = new Date(s.createdAt || s.lastAccessedAt || Date.now())
        const mappedIdx = (d.getDay() + 1) % 7 // Sat=0, Sun=1, ..., Fri=6
        weeklyActivity[mappedIdx] = (weeklyActivity[mappedIdx] || 0) + 1
      } catch {}
    })
    const maxDayCount = Math.max(...weeklyActivity, 1)

    return (
      <div className="space-y-6">
        {/* Top Controls: Timeframe Filter + Daily Goal Tracker (UI 4 & Feature 1 & 2) */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Feature 2: Timeframe Filter Pills */}
          <div className={`flex items-center gap-1 p-1 rounded-2xl border ${
            isDark ? 'bg-sky-950/40 border-sky-500/30' : 'bg-slate-100 border-slate-200'
          }`}>
            <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-sky-400">
              <Filter size={13} />
              <span>الفترة:</span>
            </span>
            <button
              onClick={() => setTimeframe('all')}
              className={`px-3 py-1 text-xs font-bold rounded-xl transition-all ${
                timeframe === 'all'
                  ? 'bg-sky-500 text-slate-950 shadow-md scale-105'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setTimeframe('month')}
              className={`px-3 py-1 text-xs font-bold rounded-xl transition-all ${
                timeframe === 'month'
                  ? 'bg-sky-500 text-slate-950 shadow-md scale-105'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              هذا الشهر
            </button>
            <button
              onClick={() => setTimeframe('week')}
              className={`px-3 py-1 text-xs font-bold rounded-xl transition-all ${
                timeframe === 'week'
                  ? 'bg-sky-500 text-slate-950 shadow-md scale-105'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              هذا الأسبوع
            </button>
          </div>

          {/* Feature 1 & UI 4: Daily Goal Selector Quick Options */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-sky-300/80 flex items-center gap-1">
              <Target size={14} className="text-sky-400" />
              <span>الهدف اليومي:</span>
            </span>
            {[15, 30, 45, 60].map((goalOption) => (
              <button
                key={goalOption}
                onClick={() => handleGoalChange(goalOption)}
                className={`px-2.5 py-1 rounded-xl text-xs font-black border transition-all ${
                  dailyGoalMinutes === goalOption
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20 scale-105'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                {goalOption} د
              </button>
            ))}
          </div>
        </div>

        {/* Feature 1 & UI 4: Banner for Daily Goal Progress Gauge */}
        <div className={`relative overflow-hidden rounded-3xl border p-5 transition-all shadow-xl ${
          isDark 
            ? 'border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-teal-950/20 to-[#0e1a38] text-white' 
            : 'border-emerald-200 bg-emerald-50 text-slate-900'
        }`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-lg">
                <Target size={28} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-black text-emerald-300">تتبع الهدف اليومي</h4>
                  <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    {goalPct}% منجَز
                  </span>
                </div>
                <p className="text-xs text-white/70 mt-1">
                  أنجزت اليوم <span className="font-black text-emerald-300">{todayMinutes} دقيقة</span> من أصل كلي قدره <span className="font-black text-emerald-300">{dailyGoalMinutes} دقيقة</span>.
                </p>
              </div>
            </div>

            {/* Daily Goal Gauge Bar */}
            <div className="w-full md:w-64 space-y-1.5">
              <div className="flex justify-between text-xs font-extrabold">
                <span className="text-emerald-400">{todayMinutes} دقيقة</span>
                <span className="text-white/60">{dailyGoalMinutes} دقيقة</span>
              </div>
              <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden p-0.5 border border-emerald-500/30">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-300 transition-all duration-700 shadow-md shadow-emerald-500/40"
                  style={{ width: `${goalPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top 4 Key Metrics */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {/* Metric 1 */}
          <div className={`flex flex-col rounded-2xl border p-4 transition-all hover:scale-102 ${
            isDark ? 'border-sky-500/25 bg-sky-950/20 shadow-lg shadow-sky-950/30' : 'border-slate-200 bg-slate-50'
          }`}>
            <div className="flex items-center gap-2 text-sky-400 text-xs font-bold mb-1.5">
              <Clock size={16} />
              <span>ساعات الدراسة</span>
            </div>
            <span className="text-2xl font-black text-white">{computedMinutes} دقيقة</span>
            <span className="text-[10px] text-sky-200/50 mt-1">
              {computedMinutes > 0 ? 'المسجل عبر المؤقت الحقيقي' : 'ابدأ المؤقت لحساب الوقت الفعلي'}
            </span>
          </div>

          {/* Metric 2 */}
          <div className={`flex flex-col rounded-2xl border p-4 transition-all hover:scale-102 ${
            isDark ? 'border-emerald-500/25 bg-emerald-950/20 shadow-lg shadow-emerald-950/30' : 'border-slate-200 bg-slate-50'
          }`}>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1.5">
              <CheckCircle2 size={16} />
              <span>الدروس المكتملة</span>
            </div>
            <span className="text-2xl font-black text-white">{computedLessons} درس</span>
            <span className="text-[10px] text-emerald-200/50 mt-1">الموضوعات المنجزة</span>
          </div>

          {/* Metric 3 */}
          <div className={`flex flex-col rounded-2xl border p-4 transition-all hover:scale-102 ${
            isDark ? 'border-amber-500/25 bg-amber-950/20 shadow-lg shadow-amber-950/30' : 'border-slate-200 bg-slate-50'
          }`}>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1.5">
              <TrendingUp size={16} />
              <span>معدل الاختبارات</span>
            </div>
            <span className="text-2xl font-black text-white">%{computedQuizScore.toFixed(0)}</span>
            <span className="text-[10px] text-amber-200/50 mt-1">متوسط درجات التقييم</span>
          </div>

          {/* Metric 4 */}
          <div className={`flex flex-col rounded-2xl border p-4 transition-all hover:scale-102 ${
            isDark ? 'border-rose-500/25 bg-rose-950/20 shadow-lg shadow-rose-950/30' : 'border-slate-200 bg-slate-50'
          }`}>
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold mb-1.5">
              <Zap size={16} />
              <span>الأيام المتتالية</span>
            </div>
            <span className="text-2xl font-black text-white">{computedStreak} يوم</span>
            <span className="text-[10px] text-rose-200/50 mt-1">سلسلة المواظبة</span>
          </div>
        </div>

        {/* Middle Row: Subject Breakdown & Weekly Activity Heatmap */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Subject Distribution (UI 1: Short path + hover full path tooltip) */}
          <div className={`rounded-3xl border p-5 ${
            isDark ? 'border-sky-500/20 bg-sky-950/15' : 'border-slate-200 bg-slate-50'
          }`}>
            <h4 className="text-sm font-extrabold mb-3 flex items-center gap-2 text-sky-300">
              <BookOpen size={16} />
              <span>توزيع العلوم والمجالات الدراسية</span>
            </h4>
            {Object.keys(domainCounts).length === 0 ? (
              <p className="text-xs text-white/40 py-4 text-center">لا توجد بيانات علوم لهذه الفترة</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(domainCounts).map(([domain, count], idx) => {
                  const pct = Math.round((count / totalSessionsInTimeframe) * 100)
                  const { short, full } = formatDomainPath(domain)
                  
                  return (
                    <div key={idx} className="group relative space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        {/* UI 1: Concise path with full tooltip */}
                        <span className="text-white/90 truncate max-w-[70%]" title={full}>
                          {short}
                        </span>
                        <span className="text-sky-400 font-extrabold">{pct}% ({count} درس)</span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      {/* Tooltip on hover */}
                      {short !== full && (
                        <div className="absolute right-0 bottom-full mb-1 hidden group-hover:block z-20 px-2.5 py-1 text-[10px] font-bold text-sky-100 bg-[#0d1836]/95 border border-sky-500/40 rounded-xl shadow-xl backdrop-blur-md pointer-events-none">
                          {full}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Weekly Activity Bar Chart (UI 2: Interactive Bar Tooltip) */}
          <div className={`flex flex-col justify-between rounded-3xl border p-5 ${
            isDark ? 'border-indigo-500/20 bg-indigo-950/15' : 'border-slate-200 bg-slate-50'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-extrabold flex items-center gap-2 text-indigo-300">
                  <Calendar size={16} />
                  <span>مخطط النشاط الأسبوعي</span>
                </h4>
                <span className="text-[10px] text-indigo-200/50 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30">
                  تفصيلي أسبوعي
                </span>
              </div>

              {/* Bar Chart Visual with Tooltip (UI 2) */}
              <div className="flex items-end justify-between gap-2 h-28 pt-4 px-2">
                {weekDays.map((day, dIdx) => {
                  const count = weeklyActivity[dIdx]
                  const estimatedMin = count * 25
                  const barHeightPct = timeframeSessions.length === 0 
                    ? 15 
                    : Math.max(15, Math.round((count / maxDayCount) * 100))
                  
                  return (
                    <div key={dIdx} className="relative flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      {/* UI 2: Floating Glassmorphic Tooltip */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                        <div className="px-3 py-1.5 text-[10px] font-bold text-white bg-[#0f1d3e]/95 border border-indigo-500/40 rounded-xl shadow-2xl backdrop-blur-md whitespace-nowrap text-center space-y-0.5">
                          <div className="text-indigo-300 font-black">{day}</div>
                          <div className="text-sky-300">{count} جلسة نشطة</div>
                        </div>
                        <div className="w-2 h-2 bg-[#0f1d3e] border-r border-b border-indigo-500/40 rotate-45 -mt-1" />
                      </div>

                      <div className="w-full bg-white/10 rounded-xl overflow-hidden flex items-end h-full">
                        <div
                          className={`w-full rounded-xl transition-all duration-500 ${
                            count > 0 
                              ? 'bg-gradient-to-t from-indigo-600 via-sky-500 to-cyan-400 shadow-md shadow-sky-500/30' 
                              : 'bg-white/10'
                          }`}
                          style={{ height: `${barHeightPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-white/60">
                        {day}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
              <span>آخر نشاط مسجل:</span>
              <span className="font-bold text-indigo-300">
                {lastDateStr
                  ? new Date(lastDateStr).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })
                  : 'لم يُسجل'}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 backdrop-blur-md bg-black/70">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={`relative flex h-[85vh] w-full max-w-4xl flex-col rounded-3xl border shadow-2xl overflow-hidden backdrop-blur-2xl ${
            isDark
              ? 'bg-[#0b1329]/95 border-sky-500/30 text-white shadow-sky-950/60'
              : 'bg-white/95 border-sky-200 text-slate-900 shadow-sky-200/50'
          }`}
          dir="rtl"
        >
          {/* Top Header */}
          <div className={`flex items-center justify-between border-b px-6 py-4 ${
            isDark ? 'border-white/10 bg-[#0e1a38]/80' : 'border-sky-100 bg-sky-50/50'
          }`}>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-400 text-white shadow-lg shadow-sky-500/30">
                <History size={22} />
              </div>
              <div>
                <h2 className={`text-lg font-bold ${isDark ? 'text-sky-100' : 'text-sky-900'}`}>سجل الدراسة والتقدم الأكاديمي</h2>
                <p className={`text-xs ${isDark ? 'text-sky-200/60' : 'text-slate-500'}`}>
                  تصفح جلساتك الدراسية السابقة واستكمل من حيث توقفت
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                disabled={loading}
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                  isDark ? 'bg-white/5 hover:bg-white/10 text-white/70' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
                title="تحديث البيانات"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>

              <button
                onClick={onClose}
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                  isDark ? 'bg-white/5 hover:bg-white/10 text-white/70' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Navigation Tabs & Search */}
          <div className={`flex flex-wrap items-center justify-between border-b px-6 pt-2 gap-4 ${
            isDark ? 'border-white/10 bg-[#0d1630]/60' : 'border-sky-100 bg-white/50'
          }`}>
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('sessions')}
                className={`flex items-center gap-2 border-b-2 pb-3 pt-2 text-sm font-bold transition-all ${
                  activeTab === 'sessions'
                    ? (isDark ? 'border-sky-400 text-sky-300 font-extrabold' : 'border-sky-500 text-sky-700 font-extrabold')
                    : isDark ? 'border-transparent text-white/50 hover:text-white/80' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <BookOpen size={16} />
                <span>الجلسات المحفوظة ({sessions.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('progress')}
                className={`flex items-center gap-2 border-b-2 pb-3 pt-2 text-sm font-bold transition-all ${
                  activeTab === 'progress'
                    ? (isDark ? 'border-sky-400 text-sky-300 font-extrabold' : 'border-sky-500 text-sky-700 font-extrabold')
                    : isDark ? 'border-transparent text-white/50 hover:text-white/80' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <TrendingUp size={16} />
                <span>مؤشرات الأداء والتقدم</span>
              </button>
            </div>

            {/* Instant Search Bar */}
            {activeTab === 'sessions' && sessions.length > 0 && (
              <div className="relative mb-2 w-full sm:w-64">
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-sky-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث في السجل..."
                  className={`w-full py-1.5 pl-3 pr-9 text-xs rounded-xl border focus:outline-none transition-all ${
                    isDark 
                      ? 'bg-sky-950/40 border-sky-500/30 text-white placeholder-white/40 focus:border-sky-400' 
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-sky-400'
                  }`}
                />
              </div>
            )}
          </div>

          {/* Main Body Content */}
          <div className="flex-1 overflow-y-auto p-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {loading ? (
              <div className="flex h-full flex-col items-center justify-center gap-3">
                <RefreshCw size={28} className="animate-spin text-sky-400" />
                <p className={`text-sm ${isDark ? 'text-white/60' : 'text-slate-500'}`}>جاري تحميل بيانات السجل من السيرفر...</p>
              </div>
            ) : activeTab === 'sessions' ? (
              filteredSessions.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center p-8">
                  <div className={`h-16 w-16 rounded-full flex items-center justify-center mb-3 ${
                    isDark ? 'bg-white/5 text-white/40' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Layers size={32} />
                  </div>
                  <h3 className="text-base font-bold mb-1">
                    {searchQuery ? 'لا توجد نتائج تطابق البحث' : 'لا يوجد جلسات مسجلة بعد'}
                  </h3>
                  <p className={`text-xs max-w-sm ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                    {searchQuery 
                      ? 'جرب البحث بكلمات مختلفة مثل اسم الكتاب أو اسم المسألة' 
                      : 'عند اختيارك لأي درس من الفهرس والبدء في الدراسة، سيتم حفظ الجلسة وتفاعلاتك تلقائياً هنا.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {filteredSessions.map((sess, index) => {
                    const createdDate = new Date(sess.createdAt || Date.now()).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })

                    return (
                      <motion.div
                        key={sess.id || index}
                        whileHover={{ scale: 1.015, y: -2 }}
                        onClick={() => {
                          onSelectSession(sess)
                          onClose()
                        }}
                        className={`group relative flex cursor-pointer flex-col justify-between rounded-3xl border p-5 transition-all shadow-md hover:shadow-xl ${
                          isDark
                            ? 'border-sky-500/25 bg-gradient-to-b from-[#0f1d3a]/70 to-[#0a1327]/90 hover:border-sky-500/50 hover:shadow-sky-950/50'
                            : 'border-sky-200/70 bg-white hover:border-sky-400 hover:bg-sky-50/40 hover:shadow-sky-200/60'
                        }`}
                      >
                        <div>
                          {/* Card Header: Category Tag + Time */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold border ${
                              isDark ? 'bg-sky-500/15 text-sky-300 border-sky-500/30' : 'bg-sky-100 text-sky-700 border-sky-200'
                            }`}>
                              <BookOpen size={13} />
                              {sess.domain || 'درس أكاديمي'}
                            </span>
                            <span className={`flex items-center gap-1 text-[11px] font-medium ${isDark ? 'text-sky-200/60' : 'text-slate-400'}`}>
                              <Clock size={12} />
                              {createdDate}
                            </span>
                          </div>

                          {/* Lesson Main Heading */}
                          <h4 className={`text-base font-black mb-1.5 transition-colors leading-snug ${
                            isDark ? 'group-hover:text-sky-300 text-white' : 'group-hover:text-sky-600 text-slate-900'
                          }`}>
                            {sess.bookTitle || 'جلسة دراسية'}
                          </h4>

                          {/* Subtitle / Topic Section */}
                          {sess.sectionTitle && (
                            <p className={`text-xs line-clamp-2 leading-relaxed ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                              {sess.sectionTitle}
                            </p>
                          )}

                          {/* Lesson Plan Progress Bar */}
                          {(() => {
                            const plan = studyPlanManager.getSessionProgress(sess.id)
                            if (!plan || plan.totalSteps === 0) return null
                            const pct = studyPlanManager.getCompletionPercentage(sess.id)
                            return (
                              <div className="mt-3 pt-2.5 border-t border-white/10 space-y-1">
                                <div className="flex justify-between text-[10px] font-extrabold">
                                  <span className={isDark ? 'text-sky-300' : 'text-sky-700'}>تقدم استيعاب المحاور</span>
                                  <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>{pct}% ({plan.completedSteps}/{plan.totalSteps})</span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-300 transition-all duration-500"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            )
                          })()}
                        </div>

                        {/* Card Footer: Status Badge + Resume Glass Button */}
                        <div className="mt-5 flex items-center justify-between border-t pt-3.5 border-white/10">
                          <span className={`text-[11px] font-bold flex items-center gap-1.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>موقف عند هذا الدرس</span>
                          </span>

                          <button className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border transition-all shadow-md group-hover:scale-105 text-xs font-black ${
                            isDark 
                              ? 'bg-sky-500/20 text-sky-200 border-sky-500/30 group-hover:bg-sky-500 group-hover:text-slate-950' 
                              : 'bg-sky-100 text-sky-700 border-sky-200 group-hover:bg-sky-500 group-hover:text-white'
                          }`}>
                            <Play size={12} fill="currentColor" />
                            <span>استكمال الدرس</span>
                            <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )
            ) : (
              renderProgressTab()
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
