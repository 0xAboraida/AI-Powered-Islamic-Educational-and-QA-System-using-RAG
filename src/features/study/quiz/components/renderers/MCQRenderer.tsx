import { CheckCircle2, XCircle, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import type { QuestionCardContentProps } from '../../types'

const OPTION_BADGES = ['أ', 'ب', 'ج', 'د', 'هـ', 'و']

export function MCQRenderer({
  q,
  selectedOpt,
  onSelectOption,
  isAnswered,
  showFeedback,
  isDark,
  isReadOnly = false
}: QuestionCardContentProps) {
  const options = q.options && q.options.length > 0 ? q.options : ['خيار 1', 'خيار 2', 'خيار 3', 'خيار 4']

  return (
    <div className="space-y-3 my-3">
      {options.map((opt, optIdx) => {
        const isSelected = selectedOpt === optIdx
        const badgeChar = OPTION_BADGES[optIdx] || `${optIdx + 1}`

        let optStyle = isDark
          ? "bg-white/5 text-white/90 hover:bg-sky-500/10 hover:border-sky-400/40 border-white/10"
          : "bg-white text-slate-800 hover:bg-sky-50/60 hover:border-sky-300 border-slate-200 shadow-sm"

        let badgeStyle = isDark
          ? "bg-white/10 text-white/70 border-white/10"
          : "bg-slate-100 text-slate-600 border-slate-200"

        if (isSelected) {
          if (showFeedback) {
            const isCorrect = optIdx === q.correct_answer_index
            optStyle = isCorrect
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-400 font-black shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400/50"
              : "bg-rose-500/20 text-rose-300 border-rose-400 font-black shadow-lg shadow-rose-500/20 ring-2 ring-rose-400/50"
            badgeStyle = isCorrect
              ? "bg-emerald-500 text-white border-emerald-400"
              : "bg-rose-500 text-white border-rose-400"
          } else {
            optStyle = "bg-gradient-to-r from-sky-500/25 via-blue-500/20 to-sky-500/15 text-sky-200 border-sky-400 font-extrabold shadow-lg shadow-sky-500/20 ring-2 ring-sky-400/50"
            badgeStyle = "bg-sky-500 text-white border-sky-400 shadow-md"
          }
        } else if (showFeedback && isAnswered && optIdx === q.correct_answer_index) {
          optStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/60 font-bold border-dashed shadow-sm"
          badgeStyle = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
        }

        return (
          <motion.button
            key={optIdx}
            whileHover={!(isReadOnly || (isAnswered && showFeedback)) ? { scale: 1.01, x: -3 } : undefined}
            whileTap={!(isReadOnly || (isAnswered && showFeedback)) ? { scale: 0.99 } : undefined}
            disabled={isReadOnly || (isAnswered && showFeedback)}
            onClick={() => onSelectOption && onSelectOption(optIdx)}
            className={`w-full text-right p-4 rounded-2xl border text-sm transition-all duration-200 cursor-pointer flex items-center gap-3.5 relative overflow-hidden opacity-0 animate-[fadeInUp_0.4s_ease-out_forwards] ${optStyle}`}
            style={{ animationDelay: `${0.2 + optIdx * 0.08}s` }}
          >
            <span className={`w-8 h-8 rounded-xl border flex items-center justify-center text-xs font-black shrink-0 transition-colors ${badgeStyle}`}>
              {badgeChar}
            </span>
            <span className="flex-1 font-bold leading-relaxed text-right text-sm md:text-base">{opt}</span>
            {isSelected && (
              <span className="shrink-0 mr-auto">
                {showFeedback ? (
                  optIdx === q.correct_answer_index ? (
                    <CheckCircle2 size={20} className="text-emerald-400" />
                  ) : (
                    <XCircle size={20} className="text-rose-400" />
                  )
                ) : (
                  <Check size={20} className="text-sky-400 stroke-[3]" />
                )}
              </span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
