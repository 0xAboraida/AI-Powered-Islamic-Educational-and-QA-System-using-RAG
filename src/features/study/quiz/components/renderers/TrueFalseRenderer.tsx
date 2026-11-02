import { CheckCircle2, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import type { QuestionCardContentProps } from '../../types'

export function TrueFalseRenderer({
  q,
  selectedOpt,
  onSelectOption,
  isAnswered,
  showFeedback,
  isDark,
  isReadOnly = false
}: QuestionCardContentProps) {
  const options = q.options && q.options.length > 0 ? q.options : ['صواب', 'خطأ']

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 my-2.5">
      {options.map((opt, optIdx) => {
        const isTrue = opt.includes('صواب') || opt.includes('صح') || optIdx === 0
        const isSelected = selectedOpt === optIdx

        let cardStyle = isDark
          ? isTrue
            ? "bg-white/5 border-white/10 hover:bg-emerald-950/30 hover:border-emerald-500/50 text-white"
            : "bg-white/5 border-white/10 hover:bg-rose-950/30 hover:border-rose-500/50 text-white"
          : isTrue
            ? "bg-white border-slate-200 hover:bg-emerald-50/60 hover:border-emerald-300 text-slate-900 shadow-sm"
            : "bg-white border-slate-200 hover:bg-rose-50/60 hover:border-rose-300 text-slate-900 shadow-sm"

        if (isSelected) {
          if (showFeedback) {
            cardStyle = optIdx === q.correct_answer_index
              ? "bg-emerald-500/25 text-emerald-300 border-2 border-emerald-400 shadow-xl shadow-emerald-500/20 font-black ring-2 ring-emerald-400/50"
              : "bg-rose-500/25 text-rose-300 border-2 border-rose-400 shadow-xl shadow-rose-500/20 font-black ring-2 ring-rose-400/50"
          } else {
            cardStyle = isTrue
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-slate-900 dark:text-white border-2 border-emerald-500 shadow-lg shadow-emerald-500/20 font-black"
              : "bg-rose-50 dark:bg-rose-950/40 text-slate-900 dark:text-white border-2 border-rose-500 shadow-lg shadow-rose-500/20 font-black"
          }
        } else if (showFeedback && isAnswered && optIdx === q.correct_answer_index) {
          cardStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/60 font-bold border-dashed"
        }

        return (
          <motion.button
            key={optIdx}
            whileHover={!(isReadOnly || (isAnswered && showFeedback)) ? { scale: 1.02, y: -2 } : undefined}
            whileTap={!(isReadOnly || (isAnswered && showFeedback)) ? { scale: 0.98 } : undefined}
            disabled={isReadOnly || (isAnswered && showFeedback)}
            onClick={() => onSelectOption && onSelectOption(optIdx)}
            className={`p-3.5 sm:p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all duration-200 cursor-pointer relative overflow-hidden opacity-0 animate-[fadeInUp_0.4s_ease-out_forwards] ${cardStyle}`}
            style={{ animationDelay: `${0.2 + optIdx * 0.1}s` }}
          >
            {isTrue ? (
              <CheckCircle2 size={26} className={isSelected && showFeedback && optIdx !== q.correct_answer_index ? 'text-rose-400' : 'text-emerald-500'} />
            ) : (
              <XCircle size={26} className="text-rose-500" />
            )}
            <span className="text-sm sm:text-base font-black">{opt}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
