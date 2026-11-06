import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  History,
  Clock,
  BookOpen,
  TrendingUp,
  Zap,
  Calendar,
  X,
  Play,
  RefreshCw,
  Layers,
  CheckCircle2,
  ChevronLeft,
  Search,
  Target,
  Filter,
} from "lucide-react"
import {
  studyApi,
  type StudySessionDto,
  type UserStudyProgressDto,
} from "../../../../api/studyApi"
import { studyPlanManager } from "../../utils/studyPlanManager"
import { getLocalStudySessions } from "../../utils/studyStorage"
import { useTheme, type AccentColor } from "../../../../contexts/ThemeContext"
import { useStudyContext } from "../../../../contexts/StudyContext"

function getHistoryThemeTokens(accentColor: AccentColor = 'amber', isDark: boolean = true) {
  switch (accentColor) {
    case 'emerald':
      return {
        modalBg: isDark ? 'bg-[#041413]/98 border-teal-500/30 shadow-teal-950/60' : 'bg-[#f0fdfa]/98 border-teal-200 shadow-teal-900/10',
        headerBg: isDark ? 'border-teal-500/20 bg-[#061f1d]/80 text-teal-100' : 'border-teal-100 bg-teal-50/80 text-teal-950',
        headerIcon: 'bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 text-white shadow-emerald-500/30',
        titleText: isDark ? 'text-teal-100' : 'text-teal-950',
        searchBarBg: isDark ? 'bg-teal-950/40 border-teal-500/30 text-white placeholder-teal-300/40 focus:border-teal-400' : 'bg-white border-teal-200 text-slate-900 placeholder-slate-400 focus:border-teal-500 shadow-2xs',
        searchIcon: isDark ? 'text-teal-400' : 'text-teal-600',
        card: isDark
          ? 'border-teal-500/20 bg-gradient-to-b from-[#062422]/80 to-[#031514]/90 hover:border-teal-400/50 hover:shadow-teal-950/60 text-white'
          : 'border-teal-100/90 bg-white hover:border-teal-300 hover:bg-teal-50/30 hover:shadow-teal-100/50 text-slate-900',
        cardTitleHover: isDark ? 'group-hover:text-teal-300 text-white' : 'group-hover:text-teal-700 text-slate-900',
        badge: isDark ? 'bg-teal-500/15 text-teal-300 border-teal-500/30' : 'bg-teal-50 text-teal-800 border-teal-200',
        btnResume: isDark
          ? 'bg-teal-500/20 text-teal-200 border-teal-500/30 hover:bg-teal-500 hover:text-slate-950'
          : 'bg-teal-600 text-white border-teal-600 hover:bg-teal-700 shadow-2xs',
        progressBar: 'from-emerald-500 via-teal-400 to-cyan-300',
      }
    case 'blue':
      return {
        modalBg: isDark ? 'bg-[#050d1a]/98 border-sky-500/30 shadow-sky-950/60' : 'bg-[#eff6ff]/98 border-sky-200 shadow-sky-900/10',
        headerBg: isDark ? 'border-sky-500/20 bg-[#0a1832]/80 text-sky-100' : 'border-sky-100 bg-sky-50/80 text-sky-950',
        headerIcon: 'bg-gradient-to-tr from-blue-600 via-sky-500 to-cyan-400 text-white shadow-sky-500/30',
        titleText: isDark ? 'text-sky-100' : 'text-sky-950',
        searchBarBg: isDark ? 'bg-sky-950/40 border-sky-500/30 text-white placeholder-sky-300/40 focus:border-sky-400' : 'bg-white border-sky-200 text-slate-900 placeholder-slate-400 focus:border-sky-500 shadow-2xs',
        searchIcon: isDark ? 'text-sky-400' : 'text-sky-600',
        card: isDark
          ? 'border-sky-500/20 bg-gradient-to-b from-[#0a1a36]/80 to-[#061022]/90 hover:border-sky-400/50 hover:shadow-sky-950/60 text-white'
          : 'border-sky-100/90 bg-white hover:border-sky-300 hover:bg-sky-50/30 hover:shadow-sky-100/50 text-slate-900',
        cardTitleHover: isDark ? 'group-hover:text-sky-300 text-white' : 'group-hover:text-sky-700 text-slate-900',
        badge: isDark ? 'bg-sky-500/15 text-sky-300 border-sky-500/30' : 'bg-sky-50 text-sky-800 border-sky-200',
        btnResume: isDark
          ? 'bg-sky-500/20 text-sky-200 border-sky-500/30 hover:bg-sky-500 hover:text-slate-950'
          : 'bg-sky-600 text-white border-sky-600 hover:bg-sky-700 shadow-2xs',
        progressBar: 'from-blue-500 via-sky-400 to-cyan-300',
      }
    case 'purple':
      return {
        modalBg: isDark ? 'bg-[#12041f]/98 border-purple-500/30 shadow-purple-950/60' : 'bg-[#faf7ff]/98 border-purple-200 shadow-purple-900/10',
        headerBg: isDark ? 'border-purple-500/20 bg-[#1c0830]/80 text-purple-100' : 'border-purple-100 bg-purple-50/80 text-purple-950',
        headerIcon: 'bg-gradient-to-tr from-purple-700 via-purple-500 to-fuchsia-400 text-white shadow-purple-500/30',
        titleText: isDark ? 'text-purple-100' : 'text-purple-950',
        searchBarBg: isDark ? 'bg-purple-950/40 border-purple-500/30 text-white placeholder-purple-300/40 focus:border-purple-400' : 'bg-white border-purple-200 text-slate-900 placeholder-slate-400 focus:border-purple-500 shadow-2xs',
        searchIcon: isDark ? 'text-purple-400' : 'text-purple-600',
        card: isDark
          ? 'border-purple-500/20 bg-gradient-to-b from-[#1e0a33]/80 to-[#12041f]/90 hover:border-purple-400/50 hover:shadow-purple-950/60 text-white'
          : 'border-purple-100/90 bg-white hover:border-purple-300 hover:bg-purple-50/30 hover:shadow-purple-100/50 text-slate-900',
        cardTitleHover: isDark ? 'group-hover:text-purple-300 text-white' : 'group-hover:text-purple-700 text-slate-900',
        badge: isDark ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'bg-purple-50 text-purple-800 border-purple-200',
        btnResume: isDark
          ? 'bg-purple-500/20 text-purple-200 border-purple-500/30 hover:bg-purple-500 hover:text-slate-950'
          : 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700 shadow-2xs',
        progressBar: 'from-purple-600 via-purple-400 to-fuchsia-300',
      }
    case 'amber':
    default:
      return {
        modalBg: isDark ? 'bg-[#120d06]/98 border-[#dfbf83]/30 shadow-amber-950/60' : 'bg-[#fbf8f0]/98 border-[#dfbf83]/40 shadow-amber-900/10',
        headerBg: isDark ? 'border-[#dfbf83]/20 bg-[#1c150b]/80 text-[#f5ebd7]' : 'border-[#dfbf83]/30 bg-[#f4ecdc]/80 text-[#422e11]',
        headerIcon: 'bg-gradient-to-tr from-[#8e682d] via-[#b88d46] to-[#dfbf83] text-white shadow-amber-500/30',
        titleText: isDark ? 'text-[#f5ebd7]' : 'text-[#422e11]',
        searchBarBg: isDark ? 'bg-amber-950/40 border-[#dfbf83]/30 text-white placeholder-amber-200/40 focus:border-[#dfbf83]' : 'bg-white border-[#dfbf83]/40 text-slate-900 placeholder-slate-400 focus:border-[#b88d46] shadow-2xs',
        searchIcon: isDark ? 'text-[#dfbf83]' : 'text-[#b88d46]',
        card: isDark
          ? 'border-[#dfbf83]/20 bg-gradient-to-b from-[#1f160c]/80 to-[#120d06]/90 hover:border-[#dfbf83]/50 hover:shadow-amber-950/60 text-white'
          : 'border-[#dfbf83]/30 bg-white hover:border-[#dfbf83] hover:bg-[#fcfaf5] hover:shadow-amber-100/50 text-slate-900',
        cardTitleHover: isDark ? 'group-hover:text-[#dfbf83] text-white' : 'group-hover:text-[#8e682d] text-slate-900',
        badge: isDark ? 'bg-[#dfbf83]/15 text-[#f5ebd7] border-[#dfbf83]/30' : 'bg-[#f5ebd7]/70 text-[#5e431a] border-[#dfbf83]/50',
        btnResume: isDark
          ? 'bg-[#dfbf83]/20 text-[#f5ebd7] border-[#dfbf83]/30 hover:bg-[#dfbf83] hover:text-stone-950'
          : 'bg-[#8e682d] text-white border-[#8e682d] hover:bg-[#7a5720] shadow-2xs',
        progressBar: 'from-[#8e682d] via-[#c59a53] to-[#dfbf83]',
      }
  }
}

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
  isDark: propDark,
}: StudyHistoryModalProps) {
  const { accentColor, isDark: contextDark } = useTheme()
  const isDark = propDark !== undefined ? propDark : contextDark
  const theme = getHistoryThemeTokens(accentColor, isDark)

  // Grab active session context safely if inside StudyProvider
  let studyCtx: any = null
  try {
    studyCtx = useStudyContext()
  } catch { }

  const [sessions, setSessions] = useState<StudySessionDto[]>([])
  const [progress, setProgress] = useState<UserStudyProgressDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"sessions" | "progress">("sessions")
  const [searchQuery, setSearchQuery] = useState("")

  // Feature 1 & 5: Daily Goal State & Backend Sync
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(() => {
    const saved = localStorage.getItem("zad_daily_goal_minutes")
    return saved ? parseInt(saved, 10) : 30
  })

  // Feature 2: Timeframe Filter ('all' | 'month' | 'week')
  const [timeframe, setTimeframe] = useState<"all" | "month" | "week">("all")

  const getAllStoredSessions = (): StudySessionDto[] => {
    const list: StudySessionDto[] = []

    // 0. Active StudyContext (Direct React state - most fresh!)
    if (studyCtx && studyCtx.chunkTitle && !studyCtx.chunkTitle.includes('اختر درساً')) {
      list.push({
        id: studyCtx.activeSessionId || Date.now(),
        chunkId: studyCtx.currentChunkId || `active_${Date.now()}`,
        bookTitle: studyCtx.chunkTitle,
        sectionTitle: studyCtx.headerSubtitle || '',
        domain: studyCtx.headerSubtitle || 'المدارسة الحالية',
        createdAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
        isActive: true,
      })
    }

    // 1. Local study sessions cache
    const local = getLocalStudySessions()
    if (Array.isArray(local)) {
      list.push(...local)
    }

    // 2. Reconstruct from studyPlanManager (all lessons user had plans for)
    try {
      const allPlans = studyPlanManager.getAllProgress()
      Object.entries(allPlans).forEach(([key, plan]) => {
        if (plan && (plan.bookTitle || plan.chunkId)) {
          const exists = list.some(
            (s) => String(s.id) === String(plan.sessionId) || (s.chunkId && s.chunkId === plan.chunkId)
          )
          if (!exists) {
            list.push({
              id: typeof plan.sessionId === 'number' ? plan.sessionId : (parseInt(String(plan.sessionId), 10) || Date.now()),
              chunkId: plan.chunkId || '',
              bookTitle: plan.bookTitle || 'جلسة دراسية سابقة',
              domain: 'مدارسة تفاعلية',
              sectionTitle: plan.steps?.[0]?.title || '',
              createdAt: plan.updatedAt || new Date().toISOString(),
              lastAccessedAt: plan.updatedAt || new Date().toISOString(),
              isActive: false,
            })
          }
        }
      })
    } catch { }

    // 3. Current active session in localStorage (handles both JSON and plain string storage)
    try {
      const safeGet = (key: string): string => {
        const val = localStorage.getItem(key)
        if (!val) return ''
        try {
          const parsed = JSON.parse(val)
          return typeof parsed === 'string' ? parsed : String(parsed)
        } catch {
          return val
        }
      }

      const activeChunkId = safeGet('zad_currentChunkId')
      const activeTitle = safeGet('zad_chunkTitle')
      const activeSubtitle = safeGet('zad_headerSubtitle')
      const activeIdRaw = safeGet('zad_activeSessionId')
      const sId = activeIdRaw ? parseInt(activeIdRaw, 10) || Date.now() : Date.now()

      if (activeTitle && !activeTitle.includes('اختر درساً')) {
        const exists = list.some((s) => (activeChunkId && s.chunkId === activeChunkId) || String(s.id) === String(sId))
        if (!exists) {
          list.unshift({
            id: sId,
            chunkId: activeChunkId || `active_${Date.now()}`,
            bookTitle: activeTitle,
            sectionTitle: activeSubtitle,
            domain: activeSubtitle || 'المدارسة الحالية',
            createdAt: new Date().toISOString(),
            lastAccessedAt: new Date().toISOString(),
            isActive: true,
          })
        }
      }

      // Also check recent book if available
      const recentBookRaw = localStorage.getItem('zad_recent_read_book')
      if (recentBookRaw) {
        try {
          const recentBook = JSON.parse(recentBookRaw)
          if (recentBook && (recentBook.title || recentBook.name)) {
            const bTitle = recentBook.title || recentBook.name
            const bChunkId = recentBook.chunkId || recentBook.id || `book_${recentBook.turath_id || 'recent'}`
            const exists = list.some((s) => s.chunkId === bChunkId || s.bookTitle === bTitle)
            if (!exists) {
              list.push({
                id: Date.now() - 1000,
                chunkId: bChunkId,
                bookTitle: bTitle,
                sectionTitle: recentBook.chapterTitle || recentBook.section || '',
                domain: recentBook.category || 'المكتبة الإسلامية',
                createdAt: recentBook.timestamp || new Date().toISOString(),
                lastAccessedAt: recentBook.timestamp || new Date().toISOString(),
                isActive: false,
              })
            }
          }
        } catch { }
      }
    } catch { }

    return list
  }

  const fetchData = async (forceRefresh = false) => {
    setLoading(true)
    try {
      const [sessionsData, progressData] = await Promise.all([
        studyApi.getSessions(forceRefresh).catch((err) => {
          console.warn('Backend getSessions failed, loading from local cache:', err)
          return null
        }),
        studyApi.getProgress().catch(() => null),
      ])

      const localList = getAllStoredSessions()

      if (Array.isArray(sessionsData) && sessionsData.length > 0) {
        const merged = [...sessionsData]
        localList.forEach((loc) => {
          if (!merged.some((m) => String(m.id) === String(loc.id) || (m.chunkId && m.chunkId === loc.chunkId))) {
            merged.push(loc)
          }
        })
        setSessions(merged)
        try {
          localStorage.setItem('zad_study_sessions_cache', JSON.stringify(merged))
        } catch { }
      } else {
        setSessions(localList)
      }

      setProgress(progressData)
      if (progressData?.dailyGoalMinutes) {
        setDailyGoalMinutes(progressData.dailyGoalMinutes)
        localStorage.setItem(
          "zad_daily_goal_minutes",
          progressData.dailyGoalMinutes.toString(),
        )
      }
    } catch (error) {
      console.error("Failed fetching history:", error)
      setSessions(getAllStoredSessions())
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
    localStorage.setItem("zad_daily_goal_minutes", newGoal.toString())
    try {
      await studyApi.updateProgress({ dailyGoalMinutes: newGoal })
    } catch (err) {
      console.error("Failed syncing goal to backend:", err)
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
    if (!rawDomain) return { short: "علوم إسلامية", full: "علوم إسلامية" }
    const parts = rawDomain
      .split(/←|->|→|\//)
      .map((p) => p.trim())
      .filter(Boolean)
    if (parts.length <= 2) {
      return { short: rawDomain, full: rawDomain }
    }
    const short = `${parts[0]} — ${parts[parts.length - 1]}`
    return { short, full: rawDomain }
  }

  // Render Progress & Analytics Tab
  const renderProgressTab = () => {
    const now = Date.now()
    const timeframeSessions = sessions.filter((s) => {
      if (timeframe === "all") return true
      const date = new Date(
        s.createdAt || s.lastAccessedAt || Date.now(),
      ).getTime()
      if (timeframe === "week") {
        return now - date <= 7 * 24 * 60 * 60 * 1000
      }
      if (timeframe === "month") {
        return now - date <= 30 * 24 * 60 * 60 * 1000
      }
      return true
    })

    const computedMinutes = progress?.totalStudyMinutes || 0

    const computedLessons =
      progress?.lessonsCompletedCount && progress.lessonsCompletedCount > 0
        ? progress.lessonsCompletedCount
        : new Set(timeframeSessions.map((s) => s.chunkId || s.bookTitle)).size

    const computedQuizScore = progress?.averageQuizScore || 0

    const computedStreak =
      progress?.streakDays || (sessions.length > 0 ? 1 : 0)

    const lastDateStr = progress?.lastStudyDate
      ? progress.lastStudyDate
      : sessions.length > 0
        ? sessions[0].lastAccessedAt || sessions[0].createdAt
        : null

    const todayMinutes = computedMinutes
    const goalPct = Math.min(
      100,
      Math.round((todayMinutes / dailyGoalMinutes) * 100),
    )

    const domainCounts: Record<string, number> = {}
    timeframeSessions.forEach((s) => {
      const d = s.domain || "علوم إسلامية"
      domainCounts[d] = (domainCounts[d] || 0) + 1
    })

    const weekDays = [
      "السبت",
      "الأحد",
      "الإثنين",
      "الثلاثاء",
      "الأربعاء",
      "الخميس",
      "الجمعة",
    ]
    const currentDayIdx = (new Date().getDay() + 1) % 7

    return (
      <div className="space-y-6 pb-4">
        {/* Timeframe Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-1.5 text-xs text-white/60">
            <Filter size={14} className="text-sky-400" />
            <span>نطاق التحليل الزمني:</span>
          </div>
          <div className="flex items-center gap-1.5 bg-black/30 p-1 rounded-xl border border-white/10 text-xs font-bold">
            <button
              onClick={() => setTimeframe("all")}
              className={`px-3 py-1 rounded-lg transition-all ${timeframe === "all"
                  ? "bg-sky-500 text-slate-950 shadow-sm"
                  : "text-white/60 hover:text-white"
                }`}
            >
              كامل المسار
            </button>
            <button
              onClick={() => setTimeframe("month")}
              className={`px-3 py-1 rounded-lg transition-all ${timeframe === "month"
                  ? "bg-sky-500 text-slate-950 shadow-sm"
                  : "text-white/60 hover:text-white"
                }`}
            >
              آخر 30 يوم
            </button>
            <button
              onClick={() => setTimeframe("week")}
              className={`px-3 py-1 rounded-lg transition-all ${timeframe === "week"
                  ? "bg-sky-500 text-slate-950 shadow-sm"
                  : "text-white/60 hover:text-white"
                }`}
            >
              آخر 7 أيام
            </button>
          </div>
        </div>

        {/* Feature 1: Daily Target Card */}
        <div
          className={`relative overflow-hidden rounded-2xl border p-5 transition-all ${isDark
              ? "border-sky-500/30 bg-gradient-to-r from-sky-950/40 via-[#0a152d]/60 to-[#060b18]/80 text-white"
              : "border-sky-200 bg-white shadow-sm text-slate-900"
            }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  <Target size={16} />
                </span>
                <h4 className="text-sm font-black">الهدف اليومي للمدارسة</h4>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-400 border border-emerald-500/30">
                  {goalPct}% مكتمل
                </span>
              </div>
              <p className="text-xs text-white/60">
                خصص وقتاً يومياً ثابتاً للمدارسة الشرعية وتثبيت المسائل الفقهية
              </p>
            </div>

            {/* Target Setting Controls */}
            <div className="flex items-center gap-2">
              {[15, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  onClick={() => handleGoalChange(mins)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${dailyGoalMinutes === mins
                      ? "bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/20 scale-105"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                    }`}
                >
                  {mins} د
                </button>
              ))}
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
          <div
            className={`flex flex-col rounded-2xl border p-4 transition-all hover:scale-102 ${isDark
                ? "border-sky-500/25 bg-sky-950/20 shadow-lg shadow-sky-950/30"
                : "border-slate-200 bg-slate-50"
              }`}
          >
            <div className="flex items-center gap-2 text-sky-400 text-xs font-bold mb-1.5">
              <Clock size={16} />
              <span>إجمالي ساعات المدارسة</span>
            </div>
            <span className="text-2xl font-black text-white">
              {(computedMinutes / 60).toFixed(1)} س
            </span>
            <span className="text-[10px] text-sky-200/50 mt-1">
              {computedMinutes > 0
                ? "المسجل عبر المؤقت الحقيقي"
                : "ابدأ المؤقت لحساب الوقت الفعلي"}
            </span>
          </div>

          {/* Metric 2 */}
          <div
            className={`flex flex-col rounded-2xl border p-4 transition-all hover:scale-102 ${isDark
                ? "border-emerald-500/25 bg-emerald-950/20 shadow-lg shadow-emerald-950/30"
                : "border-slate-200 bg-slate-50"
              }`}
          >
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1.5">
              <CheckCircle2 size={16} />
              <span>الدروس المكتملة</span>
            </div>
            <span className="text-2xl font-black text-white">
              {computedLessons} درس
            </span>
            <span className="text-[10px] text-emerald-200/50 mt-1">
              من الفصول والمسائل المنجزة
            </span>
          </div>

          {/* Metric 3 */}
          <div
            className={`flex flex-col rounded-2xl border p-4 transition-all hover:scale-102 ${isDark
                ? "border-amber-500/25 bg-amber-950/20 shadow-lg shadow-amber-950/30"
                : "border-slate-200 bg-slate-50"
              }`}
          >
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1.5">
              <Zap size={16} />
              <span>سلسلة الالتزام (Streak)</span>
            </div>
            <span className="text-2xl font-black text-white">
              {computedStreak} يوم
            </span>
            <span className="text-[10px] text-amber-200/50 mt-1">
              استمر يومياً لزيادة العزيمة
            </span>
          </div>

          {/* Metric 4 */}
          <div
            className={`flex flex-col rounded-2xl border p-4 transition-all hover:scale-102 ${isDark
                ? "border-purple-500/25 bg-purple-950/20 shadow-lg shadow-purple-950/30"
                : "border-slate-200 bg-slate-50"
              }`}
          >
            <div className="flex items-center gap-2 text-purple-400 text-xs font-bold mb-1.5">
              <TrendingUp size={16} />
              <span>متوسط درجات الاختبارات</span>
            </div>
            <span className="text-2xl font-black text-white">
              {computedQuizScore > 0 ? `${computedQuizScore}%` : "—"}
            </span>
            <span className="text-[10px] text-purple-200/50 mt-1">
              {computedQuizScore > 0
                ? "تقييم استيعاب المسائل"
                : "قم بإجراء اختبار لحساب النتيجة"}
            </span>
          </div>
        </div>

        {/* Feature 4: Weekly Attendance Heatmap / Dots */}
        <div
          className={`rounded-2xl border p-5 space-y-3 ${isDark
              ? "border-white/10 bg-white/[0.02]"
              : "border-slate-200 bg-white shadow-sm"
            }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-sky-400" />
              <h4 className="text-sm font-black text-white">
                خريطة التفاعل والحضور الأسبوعي
              </h4>
            </div>
            <span className="text-xs text-white/50">
              آخر جلسة:{" "}
              {lastDateStr
                ? new Date(lastDateStr).toLocaleDateString("ar-EG")
                : "اليوم"}
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2 pt-2">
            {weekDays.map((day, idx) => {
              const isPastOrToday = idx <= currentDayIdx
              const hasActivity = isPastOrToday && computedMinutes > 0
              return (
                <div
                  key={day}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${hasActivity
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                      : isPastOrToday
                        ? "bg-sky-950/30 border-sky-500/20 text-white/70"
                        : "bg-white/[0.02] border-white/5 text-white/30"
                    }`}
                >
                  <span className="text-[11px] font-bold mb-1">{day}</span>
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${hasActivity
                        ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                        : isPastOrToday
                          ? "bg-sky-400/50"
                          : "bg-white/10"
                      }`}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* Breakdown by Islamic Sciences / Subjects */}
        <div
          className={`rounded-2xl border p-5 space-y-4 ${isDark
              ? "border-white/10 bg-white/[0.02]"
              : "border-slate-200 bg-white shadow-sm"
            }`}
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <BookOpen size={16} className="text-amber-400" />
              <span>توزيع المدارسة حسب الفنون والعلوم الشرعية</span>
            </h4>
            <span className="text-xs text-white/50">
              {Object.keys(domainCounts).length} فنون شرعية
            </span>
          </div>

          {Object.keys(domainCounts).length === 0 ? (
            <p className="text-xs text-white/40 py-2">
              لم يتم تسجيل جلسات في النطاق الزمني المختار بعد.
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(domainCounts).map(([dom, count]) => {
                const totalFiltered = timeframeSessions.length || 1
                const pct = Math.round((count / totalFiltered) * 100)
                const { short, full } = formatDomainPath(dom)

                return (
                  <div key={dom} className="space-y-1.5" title={full}>
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-white/80 truncate max-w-xs cursor-help">
                        {short}
                      </span>
                      <span className="text-sky-400 font-mono">
                        {count} درس ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-400 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
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
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={`relative flex h-[88vh] md:h-[82vh] w-full max-w-4xl flex-col rounded-2xl md:rounded-3xl border shadow-2xl overflow-hidden backdrop-blur-2xl transition-all ${theme.modalBg}`}
          dir="rtl"
        >
          {/* Compact Top Header */}
          <div
            className={`flex items-center justify-between border-b px-4 sm:px-6 py-2.5 sm:py-3.5 transition-colors shrink-0 ${theme.headerBg}`}
          >
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl md:rounded-2xl shadow-md shrink-0 ${theme.headerIcon}`}>
                <History size={18} className="sm:w-5 sm:h-5" />
              </div>
              <div>
                <h2
                  className={`text-sm sm:text-base md:text-lg font-black leading-snug ${theme.titleText}`}
                >
                  سجل الدراسة والدروس السابقة
                </h2>
                <p
                  className="text-[11px] sm:text-xs opacity-70 line-clamp-1"
                >
                  تصفح جلساتك الدراسية السابقة واستأنف مدارستها بنقرة واحدة
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={() => fetchData(true)}
                disabled={loading}
                className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl border transition-all cursor-pointer ${isDark
                  ? "bg-white/5 hover:bg-white/10 border-white/10 text-white/80"
                  : "bg-white/80 hover:bg-white border-slate-200 text-slate-700 shadow-2xs"
                  }`}
                title="تحديث البيانات"
              >
                <RefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />
              </button>

              <button
                onClick={onClose}
                className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl border transition-all cursor-pointer ${isDark
                  ? "bg-white/5 hover:bg-white/10 border-white/10 text-white/80"
                  : "bg-white/80 hover:bg-white border-slate-200 text-slate-700 shadow-2xs"
                  }`}
                title="إغلاق"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Navigation Tabs Switcher (Progress tab hidden for now per user request) */}
          <div
            className={`flex items-center justify-between border-b px-4 sm:px-6 pt-2 shrink-0 transition-colors ${isDark ? 'border-white/10 bg-black/20' : 'border-slate-200/70 bg-black/[0.02]'
              }`}
          >
            <div className="flex gap-2 sm:gap-4">
              <button
                type="button"
                onClick={() => setActiveTab('sessions')}
                className={`flex items-center gap-1.5 sm:gap-2 border-b-2 pb-2.5 pt-1 text-xs sm:text-sm font-bold transition-all cursor-pointer ${isDark ? 'border-sky-400 text-sky-300 font-black' : 'border-sky-600 text-sky-800 font-black'
                  }`}
              >
                <BookOpen size={15} />
                <span>الجلسات المحفوظة ({sessions.length})</span>
              </button>
            </div>
          </div>

          {/* Prominent Search Bar Section (shown only in sessions tab) */}
          {activeTab === 'sessions' && (
            <div
              className={`px-4 sm:px-6 py-2.5 sm:py-3 border-b shrink-0 transition-colors ${isDark ? 'border-white/10 bg-black/10' : 'border-slate-200/50 bg-black/[0.01]'
                }`}
            >
              <div className="relative w-full">
                <Search
                  size={16}
                  className={`absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${theme.searchIcon}`}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث في السجل باسم الكتاب، المسألة، أو القسم..."
                  className={`w-full py-2 sm:py-2.5 pr-10 pl-9 text-xs sm:text-sm rounded-xl md:rounded-2xl border transition-all outline-none font-medium ${theme.searchBarBg}`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-0.5 rounded-full cursor-pointer"
                    title="مسح البحث"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Main Body Content */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {loading ? (
              <div className="flex h-full flex-col items-center justify-center gap-3">
                <RefreshCw size={26} className="animate-spin text-sky-400" />
                <p
                  className={`text-sm ${isDark ? "text-white/60" : "text-slate-500"
                    }`}
                >
                  جاري تحميل بيانات السجل...
                </p>
              </div>
            ) : activeTab === 'sessions' ? (
              filteredSessions.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center p-8">
                  <div
                    className={`h-16 w-16 rounded-full flex items-center justify-center mb-3 ${isDark
                      ? "bg-white/5 text-white/40"
                      : "bg-slate-100 text-slate-400"
                      }`}
                  >
                    <Layers size={32} />
                  </div>
                  <h3 className="text-base font-bold mb-1">
                    {searchQuery
                      ? "لا توجد نتائج تطابق البحث"
                      : "لا يوجد جلسات مسجلة بعد"}
                  </h3>
                  <p
                    className={`text-xs max-w-sm ${isDark ? "text-white/50" : "text-slate-500"
                      }`}
                  >
                    {searchQuery
                      ? "جرب البحث بكلمات مختلفة مثل اسم الكتاب أو اسم المسألة"
                      : "عند اختيارك لأي درس من الفهرس والبدء في الدراسة، سيتم حفظ الجلسة وتفاعلاتك تلقائياً هنا."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
                  {filteredSessions.map((sess, index) => {
                    const createdDate = new Date(
                      sess.createdAt || Date.now(),
                    ).toLocaleDateString("ar-EG", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })

                    return (
                      <motion.div
                        key={sess.id || index}
                        whileHover={{ scale: 1.01, y: -2 }}
                        onClick={() => {
                          onSelectSession(sess)
                          onClose()
                        }}
                        className={`group relative flex cursor-pointer flex-col justify-between rounded-xl md:rounded-2xl border p-3.5 sm:p-4 md:p-5 transition-all shadow-xs hover:shadow-md ${theme.card}`}
                      >
                        <div>
                          {/* Card Header: Category Tag + Resume Button */}
                          <div className="flex items-center justify-between gap-2 mb-2 sm:mb-2.5">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-[11px] font-extrabold border shrink-0 ${theme.badge}`}
                            >
                              <BookOpen size={12} />
                              <span>{sess.domain || "درس أكاديمي"}</span>
                            </span>

                            <button
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all text-[11px] font-bold cursor-pointer whitespace-nowrap shrink-0 group-hover:scale-105 active:scale-95 ${theme.btnResume}`}
                            >
                              <span>استكمال الدرس</span>
                              <ChevronLeft
                                size={12}
                                className="group-hover:-translate-x-0.5 transition-transform shrink-0"
                              />
                            </button>
                          </div>

                          {/* Lesson Main Heading */}
                          <h4
                            className={`text-sm sm:text-base font-black mb-1 transition-colors leading-snug line-clamp-2 ${theme.cardTitleHover}`}
                          >
                            {sess.bookTitle || "جلسة دراسية"}
                          </h4>

                          {/* Subtitle / Topic Section */}
                          {sess.sectionTitle && (
                            <p
                              className="text-xs opacity-75 line-clamp-1 leading-relaxed"
                            >
                              {sess.sectionTitle}
                            </p>
                          )}

                          {/* Lesson Plan Progress Bar */}
                          {(() => {
                            const plan = studyPlanManager.getSessionProgress(
                              sess.id,
                            )
                            if (!plan || plan.totalSteps === 0) return null
                            const pct =
                              studyPlanManager.getCompletionPercentage(sess.id)
                            return (
                              <div className="mt-2.5 pt-2 border-t border-current/10 space-y-1">
                                <div className="flex justify-between text-[10px] font-extrabold">
                                  <span className="opacity-80">
                                    تقدم استيعاب المحاور
                                  </span>
                                  <span className="text-emerald-500 font-black">
                                    {pct}% ({plan.completedSteps}/
                                    {plan.totalSteps})
                                  </span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full bg-gradient-to-r ${theme.progressBar} transition-all duration-500`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            )
                          })()}
                        </div>

                        {/* Card Footer: Date on the right (RTL) + Status Badge */}
                        <div className="mt-2.5 sm:mt-3 flex items-center justify-between border-t pt-2 border-current/10">
                          <span
                            className="flex items-center gap-1 text-[11px] font-medium opacity-70 whitespace-nowrap shrink-0"
                          >
                            <Clock size={11} className="shrink-0" />
                            <span>{createdDate}</span>
                          </span>

                          <span
                            className="text-[10px] sm:text-[11px] font-bold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            <span>موقف عند هذا الدرس</span>
                          </span>
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
