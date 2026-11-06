import { CheckCircle2, XCircle, Check, X } from 'lucide-react'
import { motion } from 'framer-motion'
import type { QuestionCardContentProps } from '../../types'
import { useTheme } from '../../../../../contexts/ThemeContext'
import { getQuizActiveThemeTokens } from '../../utils/quizThemeTokens'
import { formatIslamicQuizText } from '../../utils/quizEvaluator'

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
  const { accentColor } = useTheme()
  const theme = getQuizActiveThemeTokens(accentColor, isDark)
  const options = q.options && q.options.length > 0 ? q.options : ['خيار 1', 'خيار 2', 'خيار 3', 'خيار 4']

  return (
    <div className="space-y-2 sm:space-y-2.5 my-2.5">
      {options.map((opt, optIdx) => {
        const isSelected = selectedOpt === optIdx
        const badgeChar = OPTION_BADGES[optIdx] || `${optIdx + 1}`

        let optStyle = isDark
          ? `bg-white/5 text-white/90 ${theme.optionHover} border-2 border-white/10`
          : `bg-white text-slate-800 ${theme.optionHover} border-2 border-slate-200/90 shadow-sm`

        let badgeStyle = isDark
          ? "bg-white/10 text-white/70 border-white/10"
          : "bg-slate-100 text-slate-600 border-slate-200"

        if (isSelected) {
          if (showFeedback) {
            const isCorrect = optIdx === q.correct_answer_index
            optStyle = isCorrect
              ? isDark
                ? "bg-emerald-500/20 text-emerald-100 border-2 border-emerald-400 font-black shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400/50"
                : "bg-emerald-50 text-emerald-950 border-2 border-emerald-600 font-black shadow-md ring-2 ring-emerald-500/30"
              : isDark
                ? "bg-rose-500/20 text-rose-100 border-2 border-rose-400 font-black shadow-lg shadow-rose-500/20 ring-2 ring-rose-400/50"
                : "bg-rose-50 text-rose-950 border-2 border-rose-600 font-black shadow-md ring-2 ring-rose-500/30"
            badgeStyle = isCorrect
              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
              : "bg-rose-600 text-white border-rose-600 shadow-sm"
          } else {
            optStyle = theme.optionSelected
            badgeStyle = theme.optionBadgeSelected
          }
        } else if (showFeedback && isAnswered && optIdx === q.correct_answer_index) {
          optStyle = isDark
            ? "bg-emerald-500/15 text-emerald-200 border-2 border-emerald-400/80 font-bold border-dashed shadow-sm"
            : "bg-emerald-50/90 text-emerald-950 border-2 border-emerald-600 font-bold border-dashed shadow-sm"
          badgeStyle = isDark
            ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/40"
            : "bg-emerald-100 text-emerald-900 border-emerald-300 font-bold"
        }

        return (
          <motion.button
            key={optIdx}
            whileTap={!(isReadOnly || (isAnswered && showFeedback)) ? { scale: 0.99 } : undefined}
            disabled={isReadOnly || (isAnswered && showFeedback)}
            onClick={() => onSelectOption && onSelectOption(optIdx)}
            className={`w-full text-right p-3 sm:p-3.5 md:p-4 rounded-xl text-xs sm:text-sm transition-all duration-150 cursor-pointer flex items-center gap-3 relative overflow-hidden opacity-0 animate-[fadeInUp_0.4s_ease-out_forwards] ${optStyle}`}
            style={{ animationDelay: `${0.2 + optIdx * 0.08}s` }}
          >
            <div className="relative shrink-0">
              <span className={`w-8 h-8 rounded-lg border flex items-center justify-center text-xs font-black transition-colors ${badgeStyle}`}>
                {badgeChar}
              </span>

              {/* Status indicator badge attached to the letter badge */}
              {showFeedback ? (
                (isSelected && optIdx === q.correct_answer_index) || (!isSelected && optIdx === q.correct_answer_index) ? (
                  <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900 animate-in zoom-in-75 duration-200 z-10">
                    <Check size={10} className="stroke-[3]" />
                  </span>
                ) : isSelected && optIdx !== q.correct_answer_index ? (
                  <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900 animate-in zoom-in-75 duration-200 z-10">
                    <X size={10} className="stroke-[3]" />
                  </span>
                ) : null
              ) : isSelected ? (
                <span className={`absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full ${theme.optionBadgeSelected} text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900 animate-in zoom-in-75 duration-200 z-10`}>
                  <Check size={10} className="stroke-[3]" />
                </span>
              ) : null}
            </div>
            <span className="flex-1 font-bold leading-relaxed text-right text-sm md:text-base pr-0.5">{formatIslamicQuizText(opt)}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
