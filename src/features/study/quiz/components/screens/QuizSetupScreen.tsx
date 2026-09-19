import { useState } from 'react'
import {
  Clock, Timer, Layers, List, Sparkles, Award, ChevronLeft, ChevronRight,
  Zap, BookOpen, Dices, Check, CheckCircle2, Play, Trophy
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
  const [setupStep, setSetupStep] = useState<1 | 2 | 3>(1)

  const steps = [
    { id: 1, title: 'النمط والوقت', icon: Clock },
    { id: 2, title: 'المحتوى والصعوبة', icon: Sparkles },
    { id: 3, title: 'أنماط الأسئلة', icon: CheckCircle2 },
  ]

  const difficultyStyles: Record<string, { active: string; dot: string }> = {
    easy: {
      active: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-400/60 shadow-lg shadow-emerald-500/25 scale-[1.03]',
      dot: 'bg-emerald-200'
    },
    medium: {
      active: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-amber-400/60 shadow-lg shadow-amber-500/25 scale-[1.03]',
      dot: 'bg-amber-200'
    },
    hard: {
      active: 'bg-gradient-to-r from-rose-500 to-red-600 text-white border-rose-400/60 shadow-lg shadow-rose-500/25 scale-[1.03]',
      dot: 'bg-rose-200'
    }
  }

  return (
    <div className="my-auto w-full flex flex-col items-center justify-center py-4" key="quiz-setup">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        className={`p-6 md:p-7 rounded-3xl border shadow-2xl max-w-lg w-full relative overflow-hidden text-right backdrop-blur-xl ${
          isDark
            ? 'bg-[#12041f]/95 border-emerald-500/30 text-white shadow-emerald-500/10'
            : 'bg-white border-emerald-200 text-slate-900 shadow-xl'
        }`}
        dir="rtl"
      >
        {/* Glass Backdrop Glow Highlights */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-current/10 relative z-10">
          <div className="flex items-center gap-3">
            <div className={`h-11 w-11 rounded-2xl flex items-center justify-center border shadow-md ${
              isDark ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
            }`}>
              <Layers size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold">تخصيص وإعداد الاختبار</h3>
              <p className="text-xs opacity-75 mt-0.5">
                الخطوة {setupStep} من 3: <span className="text-emerald-400 font-bold">{steps[setupStep - 1].title}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onBack}
            className={`p-2 rounded-xl border text-xs font-bold transition-all ${
              isDark ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
            title="الرجوع للرئيسية"
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="mb-5 space-y-2 relative z-10">
          <div className="grid grid-cols-3 gap-2">
            {steps.map((st) => {
              const isActive = setupStep === st.id
              const isPassed = setupStep > st.id
              return (
                <button
                  key={st.id}
                  onClick={() => setSetupStep(st.id as any)}
                  className={`py-2 px-2 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500 text-white border-emerald-400 shadow-md scale-[1.02]'
                      : isPassed
                      ? isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : isDark ? 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10' : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black ${
                    isActive ? 'bg-white text-emerald-600' : isPassed ? 'bg-emerald-400 text-slate-950' : 'bg-white/20'
                  }`}>
                    {st.id}
                  </span>
                  <span className="truncate text-[11px]">{st.title}</span>
                </button>
              )
            })}
          </div>

          {/* Dynamic Progress Indicator Bar */}
          <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
              initial={{ width: '33.33%' }}
              animate={{ width: `${(setupStep / 3) * 100}%` }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            />
          </div>
        </div>

        {/* Step Content Container */}
        <div className="min-h-[260px] flex flex-col justify-between relative z-10">
          <AnimatePresence mode="wait">
            {setupStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Section 1: Timer Mode */}
                <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50/80 border-slate-200/80'} space-y-2.5`}>
                  <label className="text-xs font-bold opacity-90 block flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 text-[11px] font-black flex items-center justify-center border border-emerald-500/30 shrink-0 shadow-sm">1</span>
                    <span>نظام وقت الاختبار:</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => setTimerMode('untimed')}
                      className={`p-3 rounded-2xl text-xs font-bold border flex items-center gap-2.5 transition-all cursor-pointer ${
                        timerMode === 'untimed'
                          ? 'bg-emerald-500 text-white border-emerald-400 shadow-md scale-[1.02]'
                          : isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Zap size={18} />
                      <div className="text-right">
                        <span className="block font-bold">اختبار عادي</span>
                        <span className="text-[10px] opacity-80 block font-normal mt-0.5">بدون مؤقت زمني</span>
                      </div>
                    </button>

                    <button
                      onClick={() => { setTimerMode('timed'); setFeedbackMode('at_end') }}
                      className={`p-3 rounded-2xl text-xs font-bold border flex items-center gap-2.5 transition-all cursor-pointer ${
                        timerMode === 'timed'
                          ? 'bg-emerald-500 text-white border-emerald-400 shadow-md scale-[1.02]'
                          : isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Timer size={18} />
                      <div className="text-right">
                        <span className="block font-bold">اختبار بوقت</span>
                        <span className="text-[10px] opacity-80 block font-normal mt-0.5">{secondsPerQuestion} ثانية لكل سؤال</span>
                      </div>
                    </button>
                  </div>

                  {timerMode === 'timed' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 p-2.5 rounded-xl border bg-emerald-500/10 border-emerald-500/20 space-y-2"
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>الوقت المخصص لكل سؤال:</span>
                        </span>
                        <span className="text-emerald-400 font-black">{secondsPerQuestion} ثانية</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[15, 30, 45, 60].map((sec) => (
                          <button
                            key={sec}
                            type="button"
                            onClick={() => setSecondsPerQuestion(sec)}
                            className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                              secondsPerQuestion === sec
                                ? 'bg-emerald-500 text-white border-emerald-400 shadow-md scale-[1.02]'
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
                <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50/80 border-slate-200/80'} space-y-2.5`}>
                  <label className="text-xs font-bold opacity-90 block flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 text-[11px] font-black flex items-center justify-center border border-emerald-500/30 shrink-0 shadow-sm">2</span>
                    <span>طريقة ظهور التصحيح والتوضيح:</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => setFeedbackMode('instant')}
                      className={`p-3 rounded-2xl text-xs font-bold border flex items-center gap-2.5 transition-all cursor-pointer ${
                        feedbackMode === 'instant'
                          ? 'bg-emerald-500 text-white border-emerald-400 shadow-md scale-[1.02]'
                          : isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Zap size={18} className="text-amber-300 shrink-0" />
                      <div className="text-right">
                        <span className="block font-bold">تصحيح فوري</span>
                        <span className="text-[10px] opacity-80 block font-normal mt-0.5">إظهار الإجابة والنتيجة مباشرة</span>
                      </div>
                    </button>

                    <button
                      onClick={() => setFeedbackMode('at_end')}
                      className={`p-3 rounded-2xl text-xs font-bold border flex items-center gap-2.5 transition-all cursor-pointer ${
                        feedbackMode === 'at_end'
                          ? 'bg-emerald-500 text-white border-emerald-400 shadow-md scale-[1.02]'
                          : isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Trophy size={18} className="text-amber-300 shrink-0" />
                      <div className="text-right">
                        <span className="block font-bold">تصحيح ختامي</span>
                        <span className="text-[10px] opacity-80 block font-normal mt-0.5">عرض النتيجة كاملة في النهاية</span>
                      </div>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {setupStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Section 1: Number of Questions */}
                <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50/80 border-slate-200/80'} space-y-2.5`}>
                  <label className="text-xs font-bold opacity-90 block flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 text-[11px] font-black flex items-center justify-center border border-emerald-500/30 shrink-0 shadow-sm">1</span>
                    <span>عدد الأسئلة المطلوب:</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[3, 5, 10, 'auto'].map((val) => (
                      <button
                        key={String(val)}
                        onClick={() => setNumQuestions(val as any)}
                        className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          numQuestions === val
                            ? 'bg-emerald-500 text-white border-emerald-400 shadow-md scale-105'
                            : isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {val === 'auto' ? (
                          <span className="flex items-center justify-center gap-1">
                            <span>تلقائي</span>
                            <Sparkles size={12} className="text-amber-300" />
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
                      className="mt-2 p-2.5 rounded-xl border bg-emerald-500/10 border-emerald-500/20 space-y-2"
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400">
                        <span className="flex items-center gap-1">
                          <Sparkles size={12} />
                          <span>نمط التوليد بالذكاء الاصطناعي:</span>
                        </span>
                        <span className="text-emerald-400 font-black">
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
                            className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              aiMode === id
                                ? 'bg-emerald-500 text-white border-emerald-400 shadow-md scale-[1.02]'
                                : isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white/80' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <Icon size={14} />
                            <span>{label}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Section 2: Difficulty */}
                <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50/80 border-slate-200/80'} space-y-2.5`}>
                  <label className="text-xs font-bold opacity-90 block flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 text-[11px] font-black flex items-center justify-center border border-emerald-500/30 shrink-0 shadow-sm">2</span>
                    <span>مستوى الصعوبة:</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
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
                          className={`py-2.5 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            isSel
                              ? st.active
                              : isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span className={`h-2.5 w-2.5 rounded-full ${isSel ? st.dot : 'bg-current opacity-40'} shrink-0`} />
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
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Section 1: Question Types */}
                <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50/80 border-slate-200/80'} space-y-2.5`}>
                  <label className="text-xs font-bold opacity-90 block flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 text-[11px] font-black flex items-center justify-center border border-emerald-500/30 shrink-0 shadow-sm">1</span>
                      <span>أنواع الأسئلة المسموح بها:</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">اختر نوعاً أو أكثر</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
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
                          className={`p-2.5 rounded-2xl text-xs font-bold border transition-all text-right flex items-center gap-2.5 cursor-pointer ${
                            isSel
                              ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-sm scale-[1.01]'
                              : isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white/50' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-500'
                          }`}
                        >
                          <div className={`h-4 w-4 rounded-md border flex items-center justify-center shrink-0 ${
                            isSel ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-current opacity-40'
                          }`}>
                            {isSel && <Check size={12} strokeWidth={3} />}
                          </div>
                          <div>
                            <span className="block font-bold text-[11px]">{t.label}</span>
                            <span className="block text-[9px] opacity-70 font-normal">{t.desc}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Section 2: View Mode */}
                <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50/80 border-slate-200/80'} space-y-2.5`}>
                  <label className="text-xs font-bold opacity-90 block flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 text-[11px] font-black flex items-center justify-center border border-emerald-500/30 shrink-0 shadow-sm">2</span>
                    <span>نمط عرض الأسئلة:</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { id: 'stepper', label: 'بطاقات تفاعلية', desc: 'سؤال تلو الآخر', Icon: Layers },
                      { id: 'list', label: 'قائمة كاملة', desc: 'عرض كافة الأسئلة', Icon: List },
                    ].map(({ id, label, desc, Icon }) => (
                      <button
                        key={id}
                        onClick={() => setQuizViewMode(id as any)}
                        className={`p-3 rounded-2xl text-xs font-bold border flex items-center gap-2.5 transition-all cursor-pointer ${
                          quizViewMode === id
                            ? 'bg-emerald-500 text-white border-emerald-400 shadow-md scale-[1.02]'
                            : isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Icon size={16} />
                        <div className="text-right">
                          <span className="block font-bold">{label}</span>
                          <span className="text-[10px] opacity-80 block font-normal mt-0.5">{desc}</span>
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
        <div className="mt-5 pt-3 border-t border-current/10 flex items-center justify-between gap-3 relative z-10">
          {/* Previous / Cancel Button */}
          {setupStep > 1 ? (
            <button
              onClick={() => setSetupStep((prev) => (prev - 1) as any)}
              className={`px-4 py-3 rounded-2xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white/80' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <ChevronRight size={16} />
              <span>السابق</span>
            </button>
          ) : (
            <button
              onClick={onBack}
              className={`px-4 py-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
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
              className="px-6 py-3 rounded-2xl font-black text-xs bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>التالي</span>
              <ChevronLeft size={16} />
            </button>
          ) : (
            <button
              disabled={!currentChunkId || loading}
              onClick={onStart}
              className={`group relative px-6 py-3.5 rounded-2xl font-black text-xs transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer overflow-hidden ${
                !currentChunkId || loading
                  ? 'opacity-40 cursor-not-allowed bg-slate-500/20 text-white/50 border border-white/10'
                  : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] border border-emerald-400/30'
              }`}
            >
              {currentChunkId && !loading && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
              )}
              <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                <Play size={12} fill="currentColor" className="ml-0.5 group-hover:translate-x-[-1px] transition-transform" />
              </div>
              <span className="tracking-wide">بدء الاختبار الآن</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
