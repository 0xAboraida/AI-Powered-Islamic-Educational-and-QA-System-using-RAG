import { ClipboardList, Play, Timer } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Question } from '../../../../../contexts/StudyContext'
import { formatTimer } from '../../utils/quizEvaluator'

interface QuizReadyScreenProps {
  localQuestions: Question[]
  timerMode: 'untimed' | 'timed'
  secondsPerQuestion: number
  isDark: boolean
  onStart: () => void
  onEditSettings: () => void
}

export function QuizReadyScreen({
  localQuestions,
  timerMode,
  secondsPerQuestion,
  isDark,
  onStart,
  onEditSettings,
}: QuizReadyScreenProps) {
  return (
    <div className="my-auto w-full flex flex-col items-center justify-center py-8" key="quiz-ready">
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: -15 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className={`flex flex-col items-center justify-center text-center p-8 rounded-3xl border shadow-2xl backdrop-blur-xl max-w-sm w-full relative overflow-hidden ${
          isDark
            ? 'bg-[#12041f]/95 border-emerald-500/30 text-white shadow-emerald-500/15'
            : 'bg-white border-emerald-200 text-slate-900 shadow-xl'
        }`}
        dir="rtl"
      >
        {/* Glow accents */}
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-teal-500/20 rounded-full blur-3xl"></div>

        {/* Icon */}
        <div className="relative mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl animate-pulse"></div>
          <div className={`h-24 w-24 rounded-3xl flex items-center justify-center relative z-10 border shadow-xl ${
            isDark ? 'bg-gradient-to-br from-[#1a0730] to-[#12041f] border-emerald-500/40 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
          }`}>
            <ClipboardList size={48} />
          </div>
        </div>

        <h3 className="text-2xl font-black mb-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 bg-clip-text text-transparent">
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
            <span className="text-emerald-400 font-black text-lg">{localQuestions.length}</span>
            <span className="opacity-70 text-[10px]">عدد الأسئلة</span>
          </div>

          {timerMode === 'timed' ? (
            <div className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 ${
              isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'
            }`}>
              <span className="text-amber-400 font-black text-lg font-mono flex items-center gap-1">
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
          className="w-full py-4 px-6 rounded-2xl font-extrabold text-sm bg-gradient-to-r from-[#10b981] via-teal-500 to-[#059669] text-white hover:shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-xl border border-emerald-400/30 flex items-center justify-center gap-2.5 cursor-pointer"
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
