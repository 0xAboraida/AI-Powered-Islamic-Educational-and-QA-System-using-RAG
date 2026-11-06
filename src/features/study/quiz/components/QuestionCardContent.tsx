import { CheckCircle2, Zap, Network, Sparkles } from 'lucide-react'
import type { QuestionCardContentProps } from '../types'
import { MCQRenderer } from './renderers/MCQRenderer'
import { TrueFalseRenderer } from './renderers/TrueFalseRenderer'
import { FillBlankRenderer } from './renderers/FillBlankRenderer'
import { MatchingRenderer } from './renderers/MatchingRenderer'
import { useTheme } from '../../../../contexts/ThemeContext'
import { getQuizActiveThemeTokens } from '../utils/quizThemeTokens'
import { formatIslamicQuizText } from '../utils/quizEvaluator'

export function QuestionCardContent(props: QuestionCardContentProps) {
  const { q, questionIndex, selectedOpt, isAnswered, showFeedback } = props
  const qType = q.type || 'mcq'
  const { accentColor } = useTheme()
  const theme = getQuizActiveThemeTokens(accentColor, props.isDark)

  const renderOptionsHeader = () => {
    switch (qType) {
      case 'true_false':
        return (
          <div className={`text-xs font-black ${theme.promptText} mb-2 flex items-center gap-1.5`}>
            <CheckCircle2 size={14} />
            <span>حدد ما إذا كانت العبارة صواب أم خطأ:</span>
          </div>
        )
      case 'fill_blank':
        return (
          <div className={`text-xs font-black ${theme.promptText} mb-2 flex items-center gap-1.5`}>
            <Zap size={14} />
            <span>اختر الكلمة المناسبة لإكمال الفراغ:</span>
          </div>
        )
      case 'matching':
        return (
          <div className={`text-xs font-black ${theme.promptText} mb-2 flex items-center gap-1.5`}>
            <Network size={14} />
            <span>صِل كل عنصر بالتعريف المناسب له:</span>
          </div>
        )
      default:
        return (
          <div className={`text-xs font-black ${theme.promptText} mb-2 flex items-center gap-1.5`}>
            <Sparkles size={14} />
            <span>اختر الإجابة الصحيحة:</span>
          </div>
        )
    }
  }

  const renderQuestionText = () => {
    const qNumBadge = questionIndex !== undefined ? `${questionIndex + 1}` : null

    if (qType === 'fill_blank') {
      const blankRegex = /\[فراغ\]|______|\{\{\s*blank\s*\}\}|\[\.\.\.\]/gi
      const selectedWord = selectedOpt !== undefined && q.options ? q.options[selectedOpt] : null
      const parts = (q.question || '').split(blankRegex)

      if (parts.length > 1) {
        return (
          <div
            className={`p-3.5 sm:p-4 md:p-5 rounded-xl border text-right leading-relaxed font-black text-sm sm:text-base transition-all shadow-sm opacity-0 animate-[fadeInUp_0.4s_ease-out_forwards] ${theme.qCardBg} ${theme.qCardBorder}`}
            style={{ animationDelay: '0.05s' }}
          >
            {qNumBadge && (
              <span className={`inline-block px-2.5 py-0.5 ml-2.5 rounded-lg border text-xs font-black shadow-sm ${theme.qNumBadge}`}>
                {qNumBadge}
              </span>
            )}
            <span>{formatIslamicQuizText(parts[0])}</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 mx-1 rounded-lg text-xs font-black border transition-all duration-200 ${
              selectedWord
                ? isAnswered && showFeedback
                  ? selectedOpt === q.correct_answer_index
                    ? props.isDark ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400 shadow-md scale-105 font-black' : 'bg-emerald-100 text-emerald-950 border-2 border-emerald-600 shadow-md scale-105 font-black'
                    : props.isDark ? 'bg-rose-500/25 text-rose-200 border-rose-400 shadow-md scale-105 font-black' : 'bg-rose-100 text-rose-950 border-2 border-rose-600 shadow-md scale-105 font-black'
                  : `${theme.fillBlankSelected} shadow-sm`
                : `${theme.blankPlaceholder} border-dashed animate-pulse`
            }`}>
              {selectedWord ? formatIslamicQuizText(selectedWord) : '[ اختر الكلمة المناسبة ]'}
            </span>
            <span>{formatIslamicQuizText(parts[1])}</span>
          </div>
        )
      }
    }

    return (
      <div
        className={`p-3.5 sm:p-4 md:p-5 rounded-xl border text-right leading-relaxed font-black text-sm sm:text-base md:text-lg transition-all shadow-sm flex items-start gap-2.5 sm:gap-3 opacity-0 animate-[fadeInUp_0.4s_ease-out_forwards] ${theme.qCardBg} ${theme.qCardBorder}`}
        style={{ animationDelay: '0.05s' }}
      >
        {qNumBadge && (
          <span className={`px-2 py-0.5 rounded-lg border text-xs font-black shrink-0 mt-0.5 shadow-xs ${theme.qNumBadge}`}>
            {qNumBadge}
          </span>
        )}
        <p className="leading-relaxed flex-1">{formatIslamicQuizText(q.question)}</p>
      </div>
    )
  }

  const renderOptions = () => {
    switch (qType) {
      case 'true_false':
        return <TrueFalseRenderer {...props} />
      case 'fill_blank':
        return <FillBlankRenderer {...props} />
      case 'matching':
        return <MatchingRenderer {...props} />
      default:
        return <MCQRenderer {...props} />
    }
  }

  return (
    <div className="space-y-4">
      {renderQuestionText()}
      <div className="pt-2">
        {renderOptionsHeader()}
        {renderOptions()}
      </div>
    </div>
  )
}
