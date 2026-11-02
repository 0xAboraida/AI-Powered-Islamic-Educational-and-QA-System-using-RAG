import { useState } from 'react'
import {
  Clock, Timer, Layers, List, Sparkles, Award, ChevronLeft, ChevronRight,
  Zap, BookOpen, Dices, Check, CheckCircle2, Play, Trophy
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme, type AccentColor } from '../../../../../contexts/ThemeContext'

function getQuizSetupThemeTokens(accentColor: AccentColor = 'emerald', isDark: boolean = true) {
  switch (accentColor) {
    case 'blue':
      return {
        cardBorder: isDark ? 'border-sky-500/25 shadow-sky-950/20' : 'border-sky-100 shadow-xl',
        glowPrimary: 'bg-sky-500/10',
        glowSecondary: 'bg-blue-600/10',
        glowLine: 'via-sky-500/30',
        iconBox: isDark ? 'bg-[#0d223f] border-sky-500/40 text-sky-300' : 'bg-sky-50 border-sky-200 text-sky-800',
        textAccent: 'text-[#154696] dark:text-sky-300',
        stepActive: 'bg-[#154696] text-white border-[#154696] shadow-md',
        stepPassed: isDark ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-sky-50 text-sky-800 border-sky-200',
        stepCircle: 'bg-sky-200 text-sky-950',
        stepActiveCircle: 'bg-white text-[#154696]',
        progressBar: 'bg-[#154696]',
        numBadge: 'bg-sky-500/15 text-[#154696] dark:text-sky-300 border border-sky-500/30',
        selectedCard: 'bg-[#154696] text-white border-[#154696] shadow-md',
        selectedSoftCard: isDark ? 'bg-sky-500/20 border-sky-500/60 text-sky-300' : 'bg-sky-50 border-sky-300 text-sky-900',
        selectedTimePill: 'bg-[#154696] text-white border-[#154696] shadow-md',
        selectedTypeCard: 'bg-sky-50/90 dark:bg-sky-950/40 border-sky-500 dark:border-sky-400',
        checkboxActive: 'bg-[#154696] border-[#154696] text-white',
        nextBtn: 'bg-[#154696] hover:bg-[#103878] active:bg-[#0c2b5d] text-white shadow-md transition-all',
        startBtn: 'bg-[#154696] hover:bg-[#103878] active:bg-[#0c2b5d] text-white shadow-md border border-[#103878]/30 transition-all',
      }
    case 'amber':
      return {
        cardBorder: isDark ? 'border-[#5e431a]/40 shadow-stone-950/40' : 'border-[#e6d8c3] shadow-xl',
        glowPrimary: 'bg-[#c99a4e]/10',
        glowSecondary: 'bg-[#8a6328]/10',
        glowLine: 'via-[#8a6328]/30',
        iconBox: isDark ? 'bg-[#261b0c] border-[#8a6328]/50 text-[#dfbf83]' : 'bg-[#f5ede0] border-[#decbb0] text-[#7a5720]',
        textAccent: 'text-[#6e4e1b] dark:text-[#edd8ae]',
        stepActive: 'bg-[#7a5720] text-white border-[#7a5720] shadow-md',
        stepPassed: isDark ? 'bg-[#5e431a]/40 text-[#edd8ae] border border-[#8a6328]/40' : 'bg-[#f5ecdc] text-[#5e431a] border border-[#e2d2ba]',
        stepCircle: 'bg-[#dfbf83] text-[#3b2a12]',
        stepActiveCircle: 'bg-white text-[#7a5720]',
        progressBar: 'bg-[#7a5720]',
        numBadge: 'bg-[#5e431a]/30 text-[#6e4e1b] dark:text-[#edd8ae] border border-[#8a6328]/40',
        selectedCard: 'bg-[#7a5720] text-white border-[#7a5720] shadow-md',
        selectedSoftCard: isDark ? 'bg-[#5e431a]/30 border-[#8a6328]/60 text-[#edd8ae]' : 'bg-[#f5ede0] border-[#decbb0] text-[#5c4118]',
        selectedTimePill: 'bg-[#7a5720] text-white border-[#7a5720] shadow-md',
        selectedTypeCard: 'bg-[#faf5eb] dark:bg-[#281b0a]/60 border-[#8a6328] dark:border-[#dfbf83]',
        checkboxActive: 'bg-[#7a5720] border-[#7a5720] text-white',
        nextBtn: 'bg-[#7a5720] hover:bg-[#684918] active:bg-[#593d12] text-white shadow-md transition-all',
        startBtn: 'bg-[#7a5720] hover:bg-[#684918] active:bg-[#593d12] text-white shadow-md border border-[#684918]/30 transition-all',
      }
    case 'purple':
      return {
        cardBorder: isDark ? 'border-purple-500/25 shadow-purple-950/20' : 'border-purple-100 shadow-xl',
        glowPrimary: 'bg-purple-500/10',
        glowSecondary: 'bg-fuchsia-600/10',
        glowLine: 'via-purple-500/30',
        iconBox: isDark ? 'bg-[#240a3d] border-purple-500/40 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-800',
        textAccent: 'text-[#581c87] dark:text-purple-300',
        stepActive: 'bg-[#581c87] text-white border-[#581c87] shadow-md',
        stepPassed: isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-purple-50 text-purple-800 border-purple-200',
        stepCircle: 'bg-purple-200 text-purple-950',
        stepActiveCircle: 'bg-white text-[#581c87]',
        progressBar: 'bg-[#581c87]',
        numBadge: 'bg-purple-500/15 text-[#581c87] dark:text-purple-300 border border-purple-500/30',
        selectedCard: 'bg-[#581c87] text-white border-[#581c87] shadow-md',
        selectedSoftCard: isDark ? 'bg-purple-500/20 border-purple-500/60 text-purple-300' : 'bg-purple-50 border-purple-300 text-purple-900',
        selectedTimePill: 'bg-[#581c87] text-white border-[#581c87] shadow-md',
        selectedTypeCard: 'bg-purple-50/90 dark:bg-purple-950/40 border-purple-500 dark:border-purple-400',
        checkboxActive: 'bg-[#581c87] border-[#581c87] text-white',
        nextBtn: 'bg-[#581c87] hover:bg-[#4a1572] active:bg-[#3b0f5c] text-white shadow-md transition-all',
        startBtn: 'bg-[#581c87] hover:bg-[#4a1572] active:bg-[#3b0f5c] text-white shadow-md border border-[#4a1572]/30 transition-all',
      }
    case 'emerald':
    default:
      return {
        cardBorder: isDark ? 'border-emerald-500/25 shadow-emerald-950/20' : 'border-emerald-100 shadow-xl',
        glowPrimary: 'bg-emerald-500/10',
        glowSecondary: 'bg-teal-600/10',
        glowLine: 'via-emerald-500/30',
        iconBox: isDark ? 'bg-[#092b1f] border-emerald-500/40 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800',
        textAccent: 'text-[#046c4e] dark:text-emerald-300',
        stepActive: 'bg-[#046c4e] text-white border-[#046c4e] shadow-md',
        stepPassed: isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-50 text-emerald-800 border-emerald-200',
        stepCircle: 'bg-emerald-200 text-emerald-950',
        stepActiveCircle: 'bg-white text-[#046c4e]',
        progressBar: 'bg-[#046c4e]',
        numBadge: 'bg-emerald-500/15 text-[#046c4e] dark:text-emerald-300 border border-emerald-500/30',
        selectedCard: 'bg-[#046c4e] text-white border-[#046c4e] shadow-md',
        selectedSoftCard: isDark ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-900',
        selectedTimePill: 'bg-[#046c4e] text-white border-[#046c4e] shadow-md',
        selectedTypeCard: 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-400',
        checkboxActive: 'bg-[#046c4e] border-[#046c4e] text-white',
        nextBtn: 'bg-[#046c4e] hover:bg-[#03543d] active:bg-[#023e2d] text-white shadow-md transition-all',
        startBtn: 'bg-[#046c4e] hover:bg-[#03543d] active:bg-[#023e2d] text-white shadow-md border border-[#03543d]/30 transition-all',
      }
  }
}

interface QuizSetupScreenProps {
  isDark: boolean
  currentChunkId: string | null
  loading: boolean
  timerMode: 'untimed' | 'timed'
  setTimerMode: (v: 'untimed' | 'timed') => void
  secondsPerQuestion: number
  setSecondsPerQuestion: (v: number) => void
  feedbackMode: 'instant' | 'at_end'
  setFeedbackMode: (v: 'instant' | 'at_end') => void
  quizViewMode: 'stepper' | 'list'
  setQuizViewMode: (v: 'stepper' | 'list') => void
  numQuestions: number | 'auto'
  setNumQuestions: (v: number | 'auto') => void
  aiMode: 'comprehensive' | 'random'
  setAiMode: (v: 'comprehensive' | 'random') => void
  difficulty: 'easy' | 'medium' | 'hard'
  setDifficulty: (v: 'easy' | 'medium' | 'hard') => void
  selectedQuestionTypes: string[]
  toggleQuestionType: (typeId: string) => void
  onBack: () => void
  onStart: () => void
}

export function QuizSetupScreen({
  isDark, currentChunkId, loading,
  timerMode, setTimerMode,
  secondsPerQuestion, setSecondsPerQuestion,
  feedbackMode, setFeedbackMode,
  quizViewMode, setQuizViewMode,
  numQuestions, setNumQuestions,
  aiMode, setAiMode,
  difficulty, setDifficulty,
  selectedQuestionTypes, toggleQuestionType,
  onBack, onStart,
}: QuizSetupScreenProps) {
  const { accentColor } = useTheme()
  const theme = getQuizSetupThemeTokens(accentColor, isDark)
  const [setupStep, setSetupStep] = useState<1 | 2 | 3>(1)

  const steps = [
    { id: 1, title: 'النمط والوقت', mobileTitle: 'النمط', icon: Clock },
    { id: 2, title: 'المحتوى والصعوبة', mobileTitle: 'المحتوى', icon: Sparkles },
    { id: 3, title: 'أنماط الأسئلة', mobileTitle: 'الأسئلة', icon: CheckCircle2 },
  ]

  const difficultyStyles: Record<string, { active: string; dot: string }> = {
    easy: {
      active: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-400/60 shadow-md shadow-emerald-500/20 scale-[1.02]',
      dot: 'bg-emerald-200'
    },
    medium: {
      active: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-amber-400/60 shadow-md shadow-amber-500/20 scale-[1.02]',
      dot: 'bg-amber-200'
    },
    hard: {
      active: 'bg-gradient-to-r from-rose-500 to-red-600 text-white border-rose-400/60 shadow-md shadow-rose-500/20 scale-[1.02]',
      dot: 'bg-rose-200'
    }
  }

  return (
    <div className="w-full flex flex-col items-center justify-center p-1 sm:p-3 overflow-y-auto" key="quiz-setup">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: -8 }}
        className={`p-3 sm:p-5 rounded-xl sm:rounded-2xl border shadow-xl max-w-lg w-full relative overflow-hidden text-right backdrop-blur-xl ${
          isDark
            ? `bg-[#12041f]/95 ${theme.cardBorder} text-white`
            : `bg-white ${theme.cardBorder} text-slate-900 shadow-xl`
        }`}
        dir="rtl"
      >
        {/* Glass Backdrop Glow Highlights */}
        <div className={`absolute -top-24 -left-24 w-48 h-48 ${theme.glowPrimary} rounded-full blur-3xl pointer-events-none`} />
        <div className={`absolute -bottom-24 -right-24 w-48 h-48 ${theme.glowSecondary} rounded-full blur-3xl pointer-events-none`} />
        <div className={`absolute top-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent ${theme.glowLine} to-transparent pointer-events-none`} />

        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-current/10 relative z-10">
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center border shadow-sm shrink-0 ${theme.iconBox}`}>
              <Layers size={17} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold leading-tight">تخصيص وإعداد الاختبار</h3>
              <p className="text-[10.5px] sm:text-xs opacity-75 mt-0.5">
                الخطوة {setupStep} من 3: <span className={`${theme.textAccent} font-bold`}>{steps[setupStep - 1].title}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onBack}
            className={`p-1.5 rounded-lg border text-xs font-bold transition-all ${
              isDark ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
            title="الرجوع للرئيسية"
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="mb-3 space-y-1.5 relative z-10">
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {steps.map((st) => {
              const isActive = setupStep === st.id
              const isPassed = setupStep > st.id
              return (
                <button
                  key={st.id}
                  onClick={() => setSetupStep(st.id as any)}
                  className={`py-1.5 px-1 sm:py-2 sm:px-2 rounded-lg border text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
                    isActive
                      ? `${theme.stepActive} shadow-sm`
                      : isPassed
                      ? `${theme.stepPassed}`
                      : isDark ? 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10' : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black shrink-0 ${
                    isActive ? `${theme.stepActiveCircle} bg-white` : isPassed ? `${theme.stepCircle}` : 'bg-white/20'
                  }`}>
                    {st.id}
                  </span>
                  <span className="text-[10.5px] sm:text-xs font-bold">
                    <span className="sm:hidden">{st.mobileTitle}</span>
                    <span className="hidden sm:inline">{st.title}</span>
                  </span>
                </button>
              )
            })}
          </div>

          {/* Dynamic Progress Indicator Bar */}
          <div className={`h-1 w-full rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
            <motion.div
              className={`h-full ${theme.progressBar} rounded-full`}
              initial={{ width: '33.33%' }}
              animate={{ width: `${(setupStep / 3) * 100}%` }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            />
          </div>
        </div>

        {/* Step Content Container */}
        <div className="min-h-[210px] flex flex-col justify-between relative z-10">
          <AnimatePresence mode="wait">
            {setupStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.16 }}
                className="space-y-2.5"
              >
                {/* Section 1: Timer Mode */}
                <div className={`p-2.5 sm:p-3 rounded-lg border ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50/80 border-slate-200/80'} space-y-2`}>
                  <label className="text-[11.5px] sm:text-xs font-bold opacity-90 block flex items-center gap-1.5">
                    <span className={`w-4 h-4 rounded ${theme.numBadge} text-[9.5px] font-black flex items-center justify-center shrink-0 shadow-xs`}>1</span>
                    <span>نظام وقت الاختبار:</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setTimerMode('untimed')}
                      className={`p-2 sm:p-2.5 rounded-lg text-xs font-bold border flex items-center gap-2 transition-all cursor-pointer ${
                        timerMode === 'untimed'
                          ? `${theme.selectedCard}`
                          : isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Zap size={15} className="shrink-0" />
                      <div className="text-right min-w-0">
                        <span className="block font-bold leading-tight">اختبار عادي</span>
                        <span className="text-[9.5px] sm:text-[10px] opacity-80 block font-normal mt-0.5 leading-tight">بدون مؤقت زمني</span>
                      </div>
                    </button>

                    <button
                      onClick={() => { setTimerMode('timed'); setFeedbackMode('at_end') }}
                      className={`p-2 sm:p-2.5 rounded-lg text-xs font-bold border flex items-center gap-2 transition-all cursor-pointer ${
                        timerMode === 'timed'
                          ? `${theme.selectedCard}`
                          : isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Timer size={15} className="shrink-0" />
                      <div className="text-right min-w-0">
                        <span className="block font-bold leading-tight">اختبار بوقت</span>
                        <span className="text-[9.5px] sm:text-[10px] opacity-80 block font-normal mt-0.5 leading-tight">{secondsPerQuestion} ثانية/سؤال</span>
                      </div>
                    </button>
                  </div>

                  {timerMode === 'timed' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`mt-1.5 p-2 rounded-md border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100/80 border-slate-200'} space-y-1.5`}
                    >
                      <div className={`flex items-center justify-between text-[10.5px] sm:text-[11px] font-bold ${theme.textAccent}`}>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>الوقت المخصص لكل سؤال:</span>
                        </span>
                        <span className="font-black">{secondsPerQuestion} ثانية</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[15, 30, 45, 60].map((sec) => (
                          <button
                            key={sec}
                            type="button"
                            onClick={() => setSecondsPerQuestion(sec)}
                            className={`py-1 px-1 rounded-md text-[11px] sm:text-xs font-bold border transition-all text-center cursor-pointer ${
                              secondsPerQuestion === sec
                                ? `${theme.selectedTimePill}`
                                : isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white/80' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            {sec} ثانية
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Section 2: Feedback Mode */}
                <div className={`p-2.5 sm:p-3 rounded-lg border ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50/80 border-slate-200/80'} space-y-2`}>
                  <label className="text-[11.5px] sm:text-xs font-bold opacity-90 block flex items-center gap-1.5">
                    <span className={`w-4 h-4 rounded ${theme.numBadge} text-[9.5px] font-black flex items-center justify-center shrink-0 shadow-xs`}>2</span>
                    <span>طريقة ظهور التصحيح والتوضيح:</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setFeedbackMode('instant')}
                      className={`p-2 sm:p-2.5 rounded-lg text-xs font-bold border flex items-center gap-2 transition-all cursor-pointer ${
                        feedbackMode === 'instant'
                          ? `${theme.selectedCard}`
                          : isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Zap size={15} className="text-amber-300 shrink-0" />
                      <div className="text-right min-w-0">
                        <span className="block font-bold leading-tight">تصحيح فوري</span>
                        <span className="text-[9.5px] sm:text-[10px] opacity-80 block font-normal mt-0.5 leading-tight">إظهار الإجابة مباشرة</span>
                      </div>
                    </button>

                    <button
                      onClick={() => setFeedbackMode('at_end')}
                      className={`p-2 sm:p-2.5 rounded-lg text-xs font-bold border flex items-center gap-2 transition-all cursor-pointer ${
                        feedbackMode === 'at_end'
                          ? `${theme.selectedCard}`
                          : isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Trophy size={15} className="text-amber-300 shrink-0" />
                      <div className="text-right min-w-0">
                        <span className="block font-bold leading-tight">تصحيح ختامي</span>
                        <span className="text-[9.5px] sm:text-[10px] opacity-80 block font-normal mt-0.5 leading-tight">النتيجة كاملة في النهاية</span>
                      </div>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {setupStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.16 }}
                className="space-y-2.5"
              >
                {/* Section 1: Number of Questions */}
                <div className={`p-2.5 sm:p-3 rounded-lg border ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50/80 border-slate-200/80'} space-y-2`}>
                  <label className="text-[11.5px] sm:text-xs font-bold opacity-90 block flex items-center gap-1.5">
                    <span className={`w-4 h-4 rounded ${theme.numBadge} text-[9.5px] font-black flex items-center justify-center shrink-0 shadow-xs`}>1</span>
                    <span>عدد الأسئلة المطلوب:</span>
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                    {[3, 5, 10, 'auto'].map((val) => (
                      <button
                        key={String(val)}
                        onClick={() => setNumQuestions(val as any)}
                        className={`py-1.5 sm:py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          numQuestions === val
                            ? `${theme.selectedCard}`
                            : isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {val === 'auto' ? (
                          <span className="flex items-center justify-center gap-1">
                            <span>تلقائي</span>
                            <Sparkles size={11} className="text-amber-300" />
                          </span>
                        ) : `${val} أسئلة`}
                      </button>
                    ))}
                  </div>

                  {numQuestions === 'auto' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`mt-1.5 p-2 rounded-md border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100/80 border-slate-200'} space-y-1.5`}
                    >
                      <div className={`flex items-center justify-between text-[10.5px] sm:text-[11px] font-bold ${theme.textAccent}`}>
                        <span className="flex items-center gap-1">
                          <Sparkles size={12} />
                          <span>نمط التوليد بالذكاء الاصطناعي:</span>
                        </span>
                        <span className="font-black">
                          {aiMode === 'comprehensive' ? 'اختبار شامل' : 'اختبار عشوائي'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { id: 'comprehensive', label: 'اختبار شامل', Icon: BookOpen },
                          { id: 'random', label: 'اختبار عشوائي', Icon: Dices },
                        ].map(({ id, label, Icon }) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setAiMode(id as any)}
                            className={`py-1.5 px-2 rounded-md text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              aiMode === id
                                ? `${theme.selectedCard}`
                                : isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white/80' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <Icon size={13} />
                            <span>{label}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Section 2: Difficulty */}
                <div className={`p-2.5 sm:p-3 rounded-lg border ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50/80 border-slate-200/80'} space-y-2`}>
                  <label className="text-[11.5px] sm:text-xs font-bold opacity-90 block flex items-center gap-1.5">
                    <span className={`w-4 h-4 rounded ${theme.numBadge} text-[9.5px] font-black flex items-center justify-center shrink-0 shadow-xs`}>2</span>
                    <span>مستوى الصعوبة:</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {[
                      { id: 'easy', label: 'سهل' },
                      { id: 'medium', label: 'متوسط' },
                      { id: 'hard', label: 'متقدم' },
                    ].map((d) => {
                      const isSel = difficulty === d.id
                      const st = difficultyStyles[d.id]
                      return (
                        <button
                          key={d.id}
                          onClick={() => setDifficulty(d.id as any)}
                          className={`py-1.5 sm:py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            isSel
                              ? st.active
                              : isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span className={`h-2 w-2 rounded-full ${isSel ? st.dot : 'bg-current opacity-40'} shrink-0`} />
                          <span>{d.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {setupStep === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.16 }}
                className="space-y-2.5"
              >
                {/* Section 1: Question Types */}
                <div className={`p-2.5 sm:p-3 rounded-lg border ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50/80 border-slate-200/80'} space-y-2`}>
                  <label className="text-[11.5px] sm:text-xs font-bold opacity-90 block flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-4 h-4 rounded ${theme.numBadge} text-[9.5px] font-black flex items-center justify-center shrink-0 shadow-xs`}>1</span>
                      <span>أنواع الأسئلة المسموح بها:</span>
                    </span>
                    <span className={`text-[10px] ${theme.textAccent} font-semibold`}>اختر نوعاً أو أكثر</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                    {[
                      { id: 'mcq', label: 'اختيار من متعدد', desc: '4 خيارات تقليدية' },
                      { id: 'true_false', label: 'صح أم خطأ', desc: 'صواب أو خطأ' },
                      { id: 'fill_blank', label: 'إكمال الفراغ', desc: 'تعبئة كلمة [فراغ]' },
                      { id: 'matching', label: 'توصيل المفاهيم', desc: 'ربط المصطلح بتعريفه' },
                    ].map((t) => {
                      const isSel = selectedQuestionTypes.includes(t.id)
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => toggleQuestionType(t.id)}
                          className={`p-2 sm:p-2.5 rounded-lg border-[1.5px] transition-all text-right flex items-center gap-2 cursor-pointer ${
                            isSel
                              ? `${theme.selectedTypeCard} shadow-sm`
                              : isDark
                                ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white/50'
                                : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-500'
                          }`}
                        >
                          <div className={`h-4 w-4 rounded border-[1.5px] flex items-center justify-center shrink-0 transition-colors ${
                            isSel
                              ? `${theme.checkboxActive}`
                              : isDark ? 'border-white/30 bg-transparent' : 'border-slate-300 bg-white'
                          }`}>
                            {isSel && <Check size={11} strokeWidth={3.5} className="text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className={`block font-bold text-[11px] sm:text-xs leading-tight ${
                              isSel
                                ? (isDark ? 'text-white' : 'text-slate-900')
                                : (isDark ? 'text-white/70' : 'text-slate-700')
                            }`}>
                              {t.label}
                            </span>
                            <span className={`block text-[9px] sm:text-[10px] font-normal mt-0.5 leading-tight ${
                              isSel
                                ? (isDark ? 'text-slate-300' : 'text-slate-600')
                                : (isDark ? 'text-white/40' : 'text-slate-400')
                            }`}>
                              {t.desc}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Section 2: View Mode */}
                <div className={`p-2.5 sm:p-3 rounded-lg border ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50/80 border-slate-200/80'} space-y-2`}>
                  <label className="text-[11.5px] sm:text-xs font-bold opacity-90 block flex items-center gap-1.5">
                    <span className={`w-4 h-4 rounded ${theme.numBadge} text-[9.5px] font-black flex items-center justify-center shrink-0 shadow-xs`}>2</span>
                    <span>نمط عرض الأسئلة:</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'stepper', label: 'بطاقات تفاعلية', desc: 'سؤال تلو الآخر', Icon: Layers },
                      { id: 'list', label: 'قائمة كاملة', desc: 'عرض كافة الأسئلة', Icon: List },
                    ].map(({ id, label, desc, Icon }) => (
                      <button
                        key={id}
                        onClick={() => setQuizViewMode(id as any)}
                        className={`p-2 sm:p-2.5 rounded-lg text-xs font-bold border flex items-center gap-2 transition-all cursor-pointer ${
                          quizViewMode === id
                            ? `${theme.selectedCard}`
                            : isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Icon size={14} className="shrink-0" />
                        <div className="text-right min-w-0">
                          <span className="block font-bold leading-tight">{label}</span>
                          <span className="text-[9.5px] sm:text-[10px] opacity-80 block font-normal mt-0.5 leading-tight">{desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Navigation Buttons */}
        <div className="mt-3 pt-2.5 border-t border-current/10 flex items-center justify-between gap-2 relative z-10">
          {/* Previous / Cancel Button */}
          {setupStep > 1 ? (
            <button
              onClick={() => setSetupStep((prev) => (prev - 1) as any)}
              className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white/80' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <ChevronRight size={14} />
              <span>السابق</span>
            </button>
          ) : (
            <button
              onClick={onBack}
              className={`px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white/60' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600'
              }`}
            >
              إلغاء والرجوع
            </button>
          )}

          {/* Next / Start Button */}
          {setupStep < 3 ? (
            <button
              onClick={() => setSetupStep((prev) => (prev + 1) as any)}
              className={`px-4.5 py-2 sm:px-5 sm:py-2.5 rounded-lg font-bold text-xs ${theme.nextBtn} transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-[0.98]`}>
              <span>التالي</span>
              <ChevronLeft size={14} />
            </button>
          ) : (
            <button
              disabled={!currentChunkId || loading}
              onClick={onStart}
              className={`group relative px-4.5 py-2 sm:px-5 sm:py-2.5 rounded-lg font-black text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer overflow-hidden ${
                !currentChunkId || loading
                  ? 'opacity-40 cursor-not-allowed bg-slate-500/20 text-white/50 border border-white/10'
                  : `${theme.startBtn} hover:scale-[1.01] active:scale-[0.98] border shadow-lg`
              }`}
            >
              {currentChunkId && !loading && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
              )}
              <div className="w-4 h-4 rounded bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                <Play size={10} fill="currentColor" className="ml-0.5 group-hover:translate-x-[-1px] transition-transform" />
              </div>
              <span className="tracking-wide">بدء الاختبار الآن</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
