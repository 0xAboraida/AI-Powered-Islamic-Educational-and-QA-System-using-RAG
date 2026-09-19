import { List, RotateCcw, Plus, Check, X, HelpCircle, ClipboardList, ClipboardCheck, ChevronLeft, Bot } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Question } from '../../../../../contexts/StudyContext'

interface QuizCompletedScreenProps {
  localQuestions: Question[]
  selectedAnswers: Record<number, number>
  matchingAnswers: Record<number, Record<number, number>>
  shuffledMatchingOptions: Record<number, string[]>
  scorePct: number
  correctCount: number
  incorrectCount: number
  totalQuestions: number
  timerMode?: 'untimed' | 'timed'
  isDark: boolean
  onShowDetailedReview: () => void
  onDiscussWrong: () => void
  onRetry: () => void
  onNewQuiz: () => void
}

export function QuizCompletedScreen({
  scorePct, correctCount, incorrectCount, totalQuestions,
  timerMode,
  isDark,
  onShowDetailedReview, onDiscussWrong, onRetry, onNewQuiz,
}: QuizCompletedScreenProps) {
  const unansweredCount = Math.max(0, totalQuestions - (correctCount + incorrectCount))
  const isTimed = timerMode === 'timed'

  const safeScorePct = (Number.isNaN(scorePct) || !Number.isFinite(scorePct)) ? 0 : Math.max(0, Math.min(100, Math.round(scorePct)))

  const getTitleText = () => {
    if (safeScorePct === 100) return 'إتقان تام! علامة كاملة 🌟'
    if (safeScorePct >= 80) return 'ممتاز! إنجاز رائع'
    if (safeScorePct >= 50) return 'نتيجة حسنة، واصل التعلم'
    return 'تحتاج إلى مراجعة الدرس'
  }

  const getSubtitleText = () => {
    if (safeScorePct === 100) {
      return 'أداء استثنائي وتفوق كامل! أحسنت صنعاً، واصل هذا التميز.'
    }
    if (safeScorePct >= 80) {
      return 'أداء رائع جداً! أوشكت على الوصول للدرجة النهائية بنجاح.'
    }
    if (safeScorePct >= 50) {
      return 'نتيجة حسنة وتقدم جيد! يمكنك مراجعة الإجابات الخاطئة لترسيخ المعلومات.'
    }
    if (safeScorePct > 0) {
      return `أجبت بشكل صحيح على ${correctCount} أسئلة، ركّز على مراجعة باقي النقاط للتحسين.`
    }
    if (isTimed && unansweredCount > 0 && incorrectCount === 0) {
      return 'انتهى الوقت المحدد قبل الإجابة على الأسئلة، حاول مرة أخرى مع إدارة الوقت.'
    }
    return 'لم تحقق أي إجابة صحيحة بعد، لا تقلق! يمكنك مراجعة الدرس وإعادة الاختبار.'
  }

  return (
    <div className="my-auto w-full flex flex-col items-center justify-center py-6" key="quiz-completed">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -15 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className={`p-6 sm:p-8 rounded-3xl border shadow-2xl max-w-lg w-full relative overflow-hidden text-center flex flex-col items-center ${
          isDark
            ? 'bg-[#0d0714]/95 border-emerald-500/20 text-white shadow-emerald-500/10'
            : 'bg-white border-emerald-200 text-slate-900 shadow-xl'
        }`}
        dir="rtl"
      >
        {/* Background Subtle Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* ─── 1. TOP GAUGE AREA ─── */}
        <div className="relative w-44 h-44 flex items-center justify-center my-2 group">
          {/* SVG Gauge */}
          <svg className="w-full h-full transform -rotate-90 filter drop-shadow-[0_0_15px_rgba(16,185,129,0.25)]" viewBox="0 0 120 120">
            <circle
              cx="60" cy="60" r="50"
              className={isDark ? "stroke-white/10" : "stroke-slate-200"}
              strokeWidth="7" fill="transparent"
            />
            <motion.circle
              cx="60" cy="60" r="50"
              stroke="url(#score-gradient-img)"
              strokeWidth="7"
              strokeLinecap="round"
              fill="transparent"
              strokeDasharray={314.159}
              initial={{ strokeDashoffset: 314.159 }}
              animate={{ strokeDashoffset: 314.159 - (safeScorePct / 100) * 314.159 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id="score-gradient-img" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#14b8a6" />
              </linearGradient>
            </defs>
          </svg>

          {/* Score Text in Center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-black tracking-tight text-[#10b981]">
              {safeScorePct}%
            </span>
            <span className="text-[11px] font-bold opacity-75 text-emerald-200/80 mt-0.5">
              النتيجة النهائية
            </span>
          </div>

          {/* Floating Badge Icon on Bottom-Left of Circle */}
          <div className="absolute bottom-2 left-4 w-9 h-9 rounded-2xl bg-[#121c24] border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10 group-hover:scale-110 transition-transform">
            <ClipboardCheck size={18} />
          </div>
        </div>

        {/* ─── 2. TITLE & SUBTITLE ─── */}
        <h3 className="text-2xl sm:text-3xl font-black mb-1.5 mt-2 tracking-tight text-white">
          {getTitleText()}
        </h3>
        <p className="text-xs font-medium text-slate-400 mb-6 max-w-sm">
          {getSubtitleText()}
        </p>

        {/* ─── 3. STAT CARDS ROW (4 Stat Cards with Bottom Color Line) ─── */}
        <div className={`grid ${isTimed ? 'grid-cols-4 gap-2 sm:gap-2.5' : 'grid-cols-3 gap-2.5'} w-full mb-6 text-xs`}>
          {/* Card 1: Correct (Rightmost in RTL) */}
          <div className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center text-center relative overflow-hidden transition-all duration-200 hover:scale-[1.03] ${
            isDark ? 'bg-[#131127]/80 border-white/5' : 'bg-slate-50 border-slate-200'
          } border-b-2 border-b-emerald-500`}>
            <span className="text-emerald-400 font-black text-2xl sm:text-3xl leading-none">{correctCount}</span>
            <span className="text-slate-300 font-bold text-[10px] sm:text-[11px] mt-2 opacity-90">إجابات صحيحة</span>
          </div>

          {/* Card 2: Incorrect */}
          <div className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center text-center relative overflow-hidden transition-all duration-200 hover:scale-[1.03] ${
            isDark ? 'bg-[#131127]/80 border-white/5' : 'bg-slate-50 border-slate-200'
          } border-b-2 border-b-rose-500`}>
            <span className="text-rose-400 font-black text-2xl sm:text-3xl leading-none">{incorrectCount}</span>
            <span className="text-slate-300 font-bold text-[10px] sm:text-[11px] mt-2 opacity-90">إجابات خاطئة</span>
          </div>

          {/* Card 3: Unanswered (If Timed) */}
          {isTimed && (
            <div className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center text-center relative overflow-hidden transition-all duration-200 hover:scale-[1.03] ${
              isDark ? 'bg-[#131127]/80 border-white/5' : 'bg-slate-50 border-slate-200'
            } border-b-2 border-b-sky-500`}>
              <span className="text-sky-400 font-black text-2xl sm:text-3xl leading-none">{unansweredCount}</span>
              <span className="text-slate-300 font-bold text-[10px] sm:text-[11px] mt-2 opacity-90">أسئلة بدون إجابة</span>
            </div>
          )}

          {/* Card 4: Total Questions (Leftmost in RTL) */}
          <div className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center text-center relative overflow-hidden transition-all duration-200 hover:scale-[1.03] ${
            isDark ? 'bg-[#131127]/80 border-white/5' : 'bg-slate-50 border-slate-200'
          } border-b-2 border-b-amber-500`}>
            <span className="text-amber-400 font-black text-2xl sm:text-3xl leading-none">{totalQuestions}</span>
            <span className="text-slate-300 font-bold text-[10px] sm:text-[11px] mt-2 opacity-90">إجمالي الأسئلة</span>
          </div>
        </div>

        {/* ─── 4. ACTION BUTTONS STACK ─── */}
        <div className="flex flex-col gap-3 w-full">
          {/* Button 1: Detailed Review Card */}
          <button
            onClick={onShowDetailedReview}
            className={`group w-full p-3.5 rounded-2xl border flex items-center justify-between transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] cursor-pointer text-right ${
              isDark
                ? 'bg-[#0d1f1a]/80 border-emerald-500/40 hover:border-emerald-400 text-white shadow-lg shadow-emerald-500/5'
                : 'bg-emerald-50 border-emerald-200 text-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                <List size={22} />
              </div>
              <div>
                <h4 className="text-xs font-black text-emerald-400 leading-tight">عرض تفاصيل الإجابات</h4>
                <p className="text-[10px] opacity-75 text-slate-300 mt-0.5">مراجعة شاملة لجميع الأسئلة والإجابات والتفسيرات</p>
              </div>
            </div>
            <ChevronLeft size={18} className="text-emerald-400/80 shrink-0 group-hover:-translate-x-1.5 transition-transform duration-200" />
          </button>

          {/* Button 2: Zad Bot Discussion Card */}
          <button
            onClick={onDiscussWrong}
            className={`group w-full p-3.5 rounded-2xl border flex items-center justify-between transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] cursor-pointer text-right ${
              isDark
                ? 'bg-[#11192e]/80 border-sky-500/40 hover:border-sky-400 text-white shadow-lg shadow-sky-500/5'
                : 'bg-sky-50 border-sky-200 text-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-600/20 border border-sky-400/40 flex items-center justify-center text-sky-400 shrink-0 shadow-inner group-hover:scale-105 transition-transform ${
                incorrectCount > 0 ? 'ring-2 ring-sky-400/30 animate-pulse' : ''
              }`}>
                <Bot size={22} />
              </div>
              <div>
                <h4 className="text-xs font-black text-sky-400 leading-tight">ناقش أخطاءك مع زاد</h4>
                <p className="text-[10px] opacity-75 text-slate-300 mt-0.5">يحللك الأخطاء ويساعدك على الفهم بشكل أفضل</p>
              </div>
            </div>
            <ChevronLeft size={18} className="text-sky-400/80 shrink-0 group-hover:-translate-x-1.5 transition-transform duration-200" />
          </button>

          {/* Row 3: Bottom 2 Buttons */}
          <div className="grid grid-cols-2 gap-3 w-full">
            {/* Right: New Custom Quiz */}
            <button
              onClick={onNewQuiz}
              className={`group p-3 rounded-2xl border flex items-center gap-3 transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] cursor-pointer text-right ${
                isDark
                  ? 'bg-[#0f1724]/80 border-teal-500/30 hover:border-teal-400/60 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
              </div>
              <div>
                <h5 className="text-xs font-black text-teal-400 leading-tight">تخصيص اختبار جديد</h5>
                <p className="text-[10px] opacity-60 text-slate-300 mt-0.5">أنشئ اختباراً يناسبك</p>
              </div>
            </button>

            {/* Left: Retry Quiz */}
            <button
              onClick={onRetry}
              className={`group p-3 rounded-2xl border flex items-center gap-3 transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] cursor-pointer text-right ${
                isDark
                  ? 'bg-[#151328]/80 border-white/10 hover:border-white/20 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <RotateCcw size={17} className="group-hover:-rotate-180 transition-transform duration-500" />
              </div>
              <div>
                <h5 className="text-xs font-black text-white leading-tight">إعادة الاختبار</h5>
                <p className="text-[10px] opacity-60 text-slate-300 mt-0.5">حاول مرة أخرى</p>
              </div>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
