import { motion } from 'framer-motion'
import type { QuestionCardContentProps } from '../../types'
import { useTheme } from '../../../../../contexts/ThemeContext'
import { getQuizActiveThemeTokens } from '../../utils/quizThemeTokens'

export function TrueFalseRenderer({
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
  const options = q.options && q.options.length > 0 ? q.options : ['صواب', 'خطأ']

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 my-2.5">
      {options.map((opt, optIdx) => {
        const isSelected = selectedOpt === optIdx

        let cardStyle = isDark
          ? `bg-white/5 border-white/10 ${theme.optionHover} text-white`
          : `bg-white border-slate-200 ${theme.optionHover} text-slate-900 shadow-sm`

        if (isSelected) {
          if (showFeedback) {
            cardStyle = optIdx === q.correct_answer_index
              ? isDark
                ? "bg-emerald-500/25 text-emerald-100 border-2 border-emerald-400 shadow-xl shadow-emerald-500/20 font-black ring-2 ring-emerald-400/50"
                : "bg-emerald-50 text-emerald-950 border-2 border-emerald-600 shadow-md font-black ring-2 ring-emerald-500/30"
              : isDark
                ? "bg-rose-500/25 text-rose-100 border-2 border-rose-400 shadow-xl shadow-rose-500/20 font-black ring-2 ring-rose-400/50"
                : "bg-rose-50 text-rose-950 border-2 border-rose-600 shadow-md font-black ring-2 ring-rose-500/30"
          } else {
            cardStyle = theme.optionSelected
          }
        } else if (showFeedback && isAnswered && optIdx === q.correct_answer_index) {
          cardStyle = isDark
            ? "bg-emerald-500/15 text-emerald-200 border-emerald-400/80 font-bold border-dashed"
            : "bg-emerald-50/90 text-emerald-950 border-emerald-600 font-bold border-dashed"
        }

        return (
          <motion.button
            key={optIdx}
            whileHover={!(isReadOnly || (isAnswered && showFeedback)) ? { scale: 1.02, y: -2 } : undefined}
            whileTap={!(isReadOnly || (isAnswered && showFeedback)) ? { scale: 0.98 } : undefined}
            disabled={isReadOnly || (isAnswered && showFeedback)}
            onClick={() => onSelectOption && onSelectOption(optIdx)}
            className={`py-4 sm:py-5 px-4 rounded-xl border flex items-center justify-center transition-all duration-200 cursor-pointer relative overflow-hidden opacity-0 animate-[fadeInUp_0.4s_ease-out_forwards] ${cardStyle}`}
            style={{ animationDelay: `${0.2 + optIdx * 0.1}s` }}
          >
            <span className="text-base sm:text-lg font-black">{opt}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
