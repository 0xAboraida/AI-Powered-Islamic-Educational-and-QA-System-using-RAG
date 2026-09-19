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
    <div className="grid grid-cols-2 gap-3.5 my-3">
      {options.map((opt, optIdx) => {
        const isTrue = opt.includes('صواب') || opt.includes('صح') || optIdx === 0
        const isSelected = selectedOpt === optIdx

        let cardStyle = isDark
          ? "bg-white/5 border-white/10 hover:bg-sky-500/10 hover:border-sky-400/40 text-white"
          : "bg-white border-slate-200 hover:bg-sky-50/60 hover:border-sky-300 text-slate-800 shadow-sm"

        if (isSelected) {
          if (showFeedback) {
            cardStyle = optIdx === q.correct_answer_index
              ? "bg-emerald-500/25 text-emerald-300 border-emerald-400 shadow-xl shadow-emerald-500/20 font-black ring-2 ring-emerald-400/50"
              : "bg-rose-500/25 text-rose-300 border-rose-400 shadow-xl shadow-rose-500/20 font-black ring-2 ring-rose-400/50"
          } else {
            cardStyle = "bg-gradient-to-br from-sky-500/25 to-blue-600/20 text-sky-200 border-sky-400 shadow-xl shadow-sky-500/20 font-extrabold ring-2 ring-sky-400/50"
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
            className={`p-5 rounded-2xl border flex flex-col items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer relative overflow-hidden opacity-0 animate-[fadeInUp_0.4s_ease-out_forwards] ${cardStyle}`}
            style={{ animationDelay: `${0.2 + optIdx * 0.1}s` }}
          >
            {isTrue ? (
              <CheckCircle2 size={32} className={isSelected && !showFeedback ? 'text-sky-400' : isSelected && showFeedback && optIdx !== q.correct_answer_index ? 'text-rose-400' : 'text-emerald-400'} />
            ) : (
              <XCircle size={32} className={isSelected && !showFeedback ? 'text-sky-400' : 'text-rose-400'} />
            )}
            <span className="text-base font-black">{opt}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
