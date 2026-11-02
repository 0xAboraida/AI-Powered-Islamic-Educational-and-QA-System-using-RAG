import { ClipboardList, Play, Timer } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Question } from '../../../../../contexts/StudyContext'
import { formatTimer } from '../../utils/quizEvaluator'
import { useTheme, type AccentColor } from '../../../../../contexts/ThemeContext'

interface QuizReadyScreenProps {
  localQuestions: Question[]
  timerMode: 'untimed' | 'timed'
  secondsPerQuestion: number
  isDark: boolean
  onStart: () => void
  onEditSettings: () => void
}

function getQuizReadyThemeTokens(accentColor: AccentColor = 'emerald', isDark: boolean = true) {
  switch (accentColor) {
    case 'blue':
      return {
        cardBorder: isDark ? 'border-sky-500/25 shadow-sky-950/20' : 'border-sky-100 shadow-xl',
        cardBg: isDark ? 'bg-[#0b1626] text-white' : 'bg-[#fafcff] text-slate-900',
        glowPrimary: 'bg-sky-500/10',
        glowSecondary: 'bg-blue-600/10',
        iconBox: isDark ? 'bg-[#0d223f] border-sky-500/40 text-sky-300' : 'bg-sky-50 border-sky-200 text-[#154696]',
        titleColor: 'text-[#12396e] dark:text-sky-200',
        statNum: 'text-[#154696] dark:text-sky-300',
        startBtn: 'bg-[#154696] hover:bg-[#103878] active:bg-[#0c2b5d] text-white shadow-md border border-[#103878]/30 transition-all',
        pingGlow: 'bg-sky-500/20',
      }
    case 'amber':
      return {
        cardBorder: isDark ? 'border-[#5e431a]/40 shadow-stone-950/40' : 'border-[#e6d8c3] shadow-xl',
        cardBg: isDark ? 'bg-[#18120a] text-stone-100' : 'bg-[#fcfaf6] text-stone-900',
        glowPrimary: 'bg-[#c99a4e]/10',
        glowSecondary: 'bg-[#8a6328]/10',
        iconBox: isDark ? 'bg-[#261b0c] border-[#8a6328]/50 text-[#dfbf83]' : 'bg-[#f5ede0] border-[#decbb0] text-[#7a5720]',
        titleColor: 'text-[#5c4118] dark:text-[#edd8ae]',
        statNum: 'text-[#7a5720] dark:text-[#edd8ae]',
        startBtn: 'bg-[#7a5720] hover:bg-[#684918] active:bg-[#593d12] text-white shadow-md border border-[#684918]/30 transition-all',
        pingGlow: 'bg-[#c99a4e]/20',
      }
    case 'purple':
      return {
        cardBorder: isDark ? 'border-purple-500/25 shadow-purple-950/20' : 'border-purple-100 shadow-xl',
        cardBg: isDark ? 'bg-[#140624] text-white' : 'bg-[#faf7fd] text-slate-900',
        glowPrimary: 'bg-purple-500/10',
        glowSecondary: 'bg-fuchsia-600/10',
        iconBox: isDark ? 'bg-[#240a3d] border-purple-500/40 text-purple-300' : 'bg-purple-50 border-purple-200 text-[#581c87]',
        titleColor: 'text-[#4a1572] dark:text-purple-200',
        statNum: 'text-[#581c87] dark:text-purple-300',
        startBtn: 'bg-[#581c87] hover:bg-[#4a1572] active:bg-[#3b0f5c] text-white shadow-md border border-[#4a1572]/30 transition-all',
        pingGlow: 'bg-purple-500/20',
      }
    case 'emerald':
    default:
      return {
        cardBorder: isDark ? 'border-emerald-500/25 shadow-emerald-950/20' : 'border-emerald-100 shadow-xl',
        cardBg: isDark ? 'bg-[#051c14] text-white' : 'bg-[#f7fcf9] text-slate-900',
        glowPrimary: 'bg-emerald-500/10',
        glowSecondary: 'bg-teal-600/10',
        iconBox: isDark ? 'bg-[#092b1f] border-emerald-500/40 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-[#046c4e]',
        titleColor: 'text-[#065f46] dark:text-emerald-200',
        statNum: 'text-[#046c4e] dark:text-emerald-300',
        startBtn: 'bg-[#046c4e] hover:bg-[#03543d] active:bg-[#023e2d] text-white shadow-md border border-[#03543d]/30 transition-all',
        pingGlow: 'bg-emerald-500/20',
      }
  }
}

export function QuizReadyScreen({
  localQuestions,
  timerMode,
  secondsPerQuestion,
  isDark,
  onStart,
  onEditSettings,
}: QuizReadyScreenProps) {
  const { accentColor } = useTheme()
  const theme = getQuizReadyThemeTokens(accentColor, isDark)

  return (
    <div className="my-auto w-full flex flex-col items-center justify-center py-8" key="quiz-ready">
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: -15 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className={`flex flex-col items-center justify-center text-center p-8 rounded-3xl border shadow-2xl backdrop-blur-xl max-w-sm w-full relative overflow-hidden transition-all duration-300 ${theme.cardBg} ${theme.cardBorder}`}
        dir="rtl"
      >
        {/* Glow accents */}
        <div className={`absolute -top-12 -left-12 w-36 h-36 ${theme.glowPrimary} rounded-full blur-3xl`}></div>
        <div className={`absolute -bottom-12 -right-12 w-36 h-36 ${theme.glowSecondary} rounded-full blur-3xl`}></div>

        {/* Icon */}
        <div className="relative mb-6 flex items-center justify-center">
          <div className={`absolute inset-0 rounded-full ${theme.pingGlow} blur-xl animate-pulse`}></div>
          <div className={`h-24 w-24 rounded-3xl flex items-center justify-center relative z-10 border shadow-xl transition-all ${theme.iconBox}`}>
            <ClipboardList size={48} />
          </div>
        </div>

        <h3 className={`text-2xl font-black mb-1 ${theme.titleColor}`}>
          الاختبار جاهز!
        </h3>
        <p className={`text-xs leading-relaxed mb-6 opacity-80 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
          تم تحضير <strong>{localQuestions.length}</strong> سؤال بنجاح. اضغط ابدأ عندما تكون مستعداً.
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 w-full mb-6 text-xs">
          <div className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className={`font-black text-lg ${theme.statNum}`}>{localQuestions.length}</span>
            <span className="opacity-70 text-[10px]">عدد الأسئلة</span>
          </div>

          {timerMode === 'timed' ? (
            <div className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 ${
              isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'
            }`}>
              <span className="text-amber-500 dark:text-amber-400 font-black text-lg font-mono flex items-center gap-1">
                <Timer size={14} />
                {formatTimer(localQuestions.length * secondsPerQuestion)}
              </span>
              <span className="opacity-70 text-[10px]">الوقت الإجمالي</span>
            </div>
          ) : (
            <div className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className={`font-black text-lg ${isDark ? 'text-white/60' : 'text-slate-400'}`}>∞</span>
              <span className="opacity-70 text-[10px]">بدون موقت</span>
            </div>
          )}
        </div>

        {/* Start Button */}
        <button
          onClick={onStart}
          className={`w-full py-4 px-6 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2.5 cursor-pointer ${theme.startBtn}`}
        >
          <Play size={20} fill="currentColor" />
          <span>ابدأ الاختبار الآن</span>
        </button>

        {/* Back to setup */}
        <button
          onClick={onEditSettings}
          className={`mt-3 w-full py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            isDark ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white/60' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
          }`}
        >
          تعديل الإعدادات
        </button>
      </motion.div>
    </div>
  )
}
