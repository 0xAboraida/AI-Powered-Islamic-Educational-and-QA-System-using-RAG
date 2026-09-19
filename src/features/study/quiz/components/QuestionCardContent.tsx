import { CheckCircle2, Zap, Network, Sparkles } from 'lucide-react'
import type { QuestionCardContentProps } from '../types'
import { MCQRenderer } from './renderers/MCQRenderer'
import { TrueFalseRenderer } from './renderers/TrueFalseRenderer'
import { FillBlankRenderer } from './renderers/FillBlankRenderer'
import { MatchingRenderer } from './renderers/MatchingRenderer'

export function QuestionCardContent(props: QuestionCardContentProps) {
  const { q, questionIndex, selectedOpt, isAnswered, showFeedback } = props
  const qType = q.type || 'mcq'

  const renderOptionsHeader = () => {
    switch (qType) {
      case 'true_false':
        return (
          <div className="text-xs font-extrabold text-sky-400 mb-2 flex items-center gap-1.5">
            <CheckCircle2 size={14} />
            <span>حدد ما إذا كانت العبارة صواب أم خطأ:</span>
          </div>
        )
      case 'fill_blank':
        return (
          <div className="text-xs font-extrabold text-amber-400 mb-2 flex items-center gap-1.5">
            <Zap size={14} />
            <span>اختر الكلمة المناسبة لإكمال الفراغ:</span>
          </div>
        )
      case 'matching':
        return (
          <div className="text-xs font-extrabold text-purple-400 mb-2 flex items-center gap-1.5">
            <Network size={14} />
            <span>صِل كل عنصر بالتعريف المناسب له:</span>
          </div>
        )
      default:
        return (
          <div className="text-xs font-extrabold text-sky-400 mb-2 flex items-center gap-1.5">
            <Sparkles size={14} />
            <span>اختر الإجابة الصحيحة:</span>
          </div>
        )
    }
  }

  const renderQuestionText = () => {
    const qNumBadge = questionIndex !== undefined ? `${questionIndex + 1}` : null
    const badgeColorStyle = props.isDark
      ? 'bg-purple-500/20 text-purple-200 border-purple-500/40'
      : 'bg-purple-100 text-purple-800 border-purple-300'

    if (qType === 'fill_blank') {
      const blankRegex = /\[فراغ\]|______|\{\{\s*blank\s*\}\}|\[\.\.\.\]/gi
      const selectedWord = selectedOpt !== undefined && q.options ? q.options[selectedOpt] : null
      const parts = (q.question || '').split(blankRegex)

      if (parts.length > 1) {
        return (
          <div
            className={`p-4 md:p-5 rounded-2xl border text-right leading-relaxed font-extrabold text-base transition-all shadow-md opacity-0 animate-[fadeInUp_0.4s_ease-out_forwards] ${
              props.isDark
                ? 'bg-gradient-to-r from-purple-950/40 via-[#180a29] to-slate-900/60 border-purple-500/30 text-slate-100'
                : 'bg-gradient-to-r from-amber-50/90 via-purple-50/50 to-white border-purple-200 text-slate-900'
            }`}
            style={{ animationDelay: '0.05s' }}
          >
            {qNumBadge && (
              <span className={`inline-block px-2.5 py-0.5 ml-2.5 rounded-lg border text-xs font-black shadow-sm ${badgeColorStyle}`}>
                {qNumBadge}
              </span>
            )}
            <span>{parts[0]}</span>
            <span className={`inline-flex items-center px-3 py-1 mx-1.5 rounded-xl text-xs font-black border transition-all duration-200 ${
              selectedWord
                ? isAnswered && showFeedback
                  ? selectedOpt === q.correct_answer_index
                    ? 'bg-emerald-500/25 text-emerald-400 border-emerald-400 shadow-sm scale-105'
                    : 'bg-rose-500/25 text-rose-400 border-rose-400 shadow-sm scale-105'
                  : 'bg-sky-500/25 text-sky-300 border-sky-400 shadow-sm'
                : 'bg-amber-500/20 text-amber-300 border-amber-400/50 border-dashed animate-pulse'
            }`}>
              {selectedWord || '[ اختر الكلمة المناسبة ]'}
            </span>
            <span>{parts[1]}</span>
          </div>
        )
      }
    }

    return (
      <div
        className={`p-4 md:p-5 rounded-2xl border text-right leading-relaxed font-extrabold text-base md:text-lg transition-all shadow-md flex items-start gap-3 opacity-0 animate-[fadeInUp_0.4s_ease-out_forwards] ${
          props.isDark
            ? 'bg-gradient-to-r from-purple-950/40 via-[#180a29] to-slate-900/60 border-purple-500/30 text-slate-100 shadow-purple-950/30'
            : 'bg-gradient-to-r from-amber-50/90 via-purple-50/50 to-white border-purple-200 text-slate-900 shadow-sm'
        }`}
        style={{ animationDelay: '0.05s' }}
      >
        {qNumBadge && (
          <span className={`px-2.5 py-1 rounded-xl border text-xs font-black shrink-0 mt-0.5 shadow-sm ${badgeColorStyle}`}>
            {qNumBadge}
          </span>
        )}
        <p className="leading-relaxed flex-1">{q.question}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Prominent Question Box with Question Number & Bottom Divider */}
      <div className="pb-3 border-b border-current/10">
        {renderQuestionText()}
      </div>

      {/* Dynamic Options Header by Question Type */}
      <div className="pt-1 opacity-0 animate-[fadeInUp_0.4s_ease-out_forwards]" style={{ animationDelay: '0.15s' }}>
        {renderOptionsHeader()}

        {/* Options Renderer */}
        {(() => {
          if (qType === 'true_false') return <TrueFalseRenderer {...props} />
          if (qType === 'fill_blank') return <FillBlankRenderer {...props} />
          if (qType === 'matching') return <MatchingRenderer {...props} />
          return <MCQRenderer {...props} />
        })()}
      </div>
    </div>
  )
}
