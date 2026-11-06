import { Zap } from 'lucide-react'
import type { QuestionCardContentProps } from '../../types'
import { useTheme } from '../../../../../contexts/ThemeContext'
import { getQuizActiveThemeTokens } from '../../utils/quizThemeTokens'
import { formatIslamicQuizText } from '../../utils/quizEvaluator'

export function FillBlankRenderer({
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
  const options = q.options || []

  return (
    <div className="grid grid-cols-2 gap-2 my-2.5">
      {options.map((opt, optIdx) => {
        const isSelected = selectedOpt === optIdx
        let optStyle = isDark
          ? `bg-white/5 text-white/80 ${theme.optionHover} border-white/10`
          : `bg-white text-slate-800 ${theme.optionHover} border-slate-200 shadow-sm`

        if (isSelected) {
          if (showFeedback) {
            optStyle = optIdx === q.correct_answer_index
              ? isDark
                ? "bg-emerald-500/20 text-emerald-100 border-2 border-emerald-400 font-black shadow-md"
                : "bg-emerald-50 text-emerald-950 border-2 border-emerald-600 font-black shadow-md"
              : isDark
                ? "bg-rose-500/20 text-rose-100 border-2 border-rose-400 font-black shadow-md"
                : "bg-rose-50 text-rose-950 border-2 border-rose-600 font-black shadow-md"
          } else {
            optStyle = theme.fillBlankSelected
          }
        } else if (showFeedback && isAnswered && optIdx === q.correct_answer_index) {
          optStyle = isDark
            ? "bg-emerald-500/15 text-emerald-200 border-emerald-400/50 font-bold border-dashed"
            : "bg-emerald-50/90 text-emerald-950 border-emerald-600 font-bold border-dashed"
        }

        return (
          <button
            key={optIdx}
            disabled={isReadOnly || (isAnswered && showFeedback)}
            onClick={() => onSelectOption && onSelectOption(optIdx)}
            className={`p-2.5 sm:p-3 rounded-lg border text-xs font-bold transition-all duration-200 flex items-center justify-between cursor-pointer opacity-0 animate-[fadeInUp_0.4s_ease-out_forwards] ${optStyle}`}
            style={{ animationDelay: `${0.2 + optIdx * 0.08}s` }}
          >
            <span>{formatIslamicQuizText(opt)}</span>
            <Zap size={14} className={isSelected && !showFeedback ? `${theme.optionCheckIcon} opacity-100` : 'opacity-40'} />
          </button>
        )
      })}
    </div>
  )
}
