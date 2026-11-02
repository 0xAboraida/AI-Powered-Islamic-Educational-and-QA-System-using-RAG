import { CheckCircle2, XCircle, Check } from 'lucide-react'
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
              ? "bg-emerald-500/20 text-emerald-300 border-2 border-emerald-400 font-black shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400/50"
              : "bg-rose-500/20 text-rose-300 border-2 border-rose-400 font-black shadow-lg shadow-rose-500/20 ring-2 ring-rose-400/50"
            badgeStyle = isCorrect
              ? "bg-emerald-500 text-white border-emerald-400"
              : "bg-rose-500 text-white border-rose-400"
          } else {
            optStyle = theme.optionSelected
            badgeStyle = theme.optionBadgeSelected
          }
        } else if (showFeedback && isAnswered && optIdx === q.correct_answer_index) {
          optStyle = "bg-emerald-500/10 text-emerald-400 border-2 border-emerald-500/60 font-bold border-dashed shadow-sm"
          badgeStyle = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
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
            <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center text-xs font-black shrink-0 transition-colors ${badgeStyle}`}>
              {badgeChar}
            </span>
            <span className="flex-1 font-bold leading-relaxed text-right text-sm md:text-base">{formatIslamicQuizText(opt)}</span>
            
            {/* Always-present indicator slot to eliminate horizontal displacement and text reflow */}
            <div className="shrink-0 mr-auto w-6 h-6 flex items-center justify-center">
              {showFeedback ? (
                isSelected ? (
                  optIdx === q.correct_answer_index ? (
                    <CheckCircle2 size={20} className="text-emerald-400" />
                  ) : (
                    <XCircle size={20} className="text-rose-400" />
                  )
                ) : optIdx === q.correct_answer_index ? (
                  <CheckCircle2 size={20} className="text-emerald-500" />
                ) : null
              ) : isSelected ? (
                <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${theme.optionBadgeSelected} shadow-xs`}>
                  <Check size={12} className="text-white stroke-[3]" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-slate-300/80 dark:border-white/20 transition-colors" />
              )}
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
