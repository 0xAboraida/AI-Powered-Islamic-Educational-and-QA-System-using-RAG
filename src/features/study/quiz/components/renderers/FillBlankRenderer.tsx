import { Zap } from 'lucide-react'
import type { QuestionCardContentProps } from '../../types'

export function FillBlankRenderer({
  q,
  selectedOpt,
  onSelectOption,
  isAnswered,
  showFeedback,
  isDark,
  isReadOnly = false
}: QuestionCardContentProps) {
  const options = q.options || []

  return (
    <div className="grid grid-cols-2 gap-2.5 my-3">
      {options.map((opt, optIdx) => {
        const isSelected = selectedOpt === optIdx
        let optStyle = isDark
          ? "bg-white/5 text-white/80 hover:bg-sky-500/10 border-white/10"
          : "bg-white text-slate-700 hover:bg-sky-50/60 border-slate-200 shadow-sm"

        if (isSelected) {
          if (showFeedback) {
            optStyle = optIdx === q.correct_answer_index
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-400 font-black shadow-md"
              : "bg-rose-500/20 text-rose-300 border-rose-400 font-black shadow-md"
          } else {
            optStyle = "bg-sky-500/25 text-sky-200 border-sky-400 font-extrabold shadow-md ring-1 ring-sky-400/50"
          }
        } else if (showFeedback && isAnswered && optIdx === q.correct_answer_index) {
          optStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/50 font-bold border-dashed"
        }

        return (
          <button
            key={optIdx}
            disabled={isReadOnly || (isAnswered && showFeedback)}
            onClick={() => onSelectOption && onSelectOption(optIdx)}
            className={`p-3 rounded-xl border text-xs font-bold transition-all duration-200 flex items-center justify-between cursor-pointer opacity-0 animate-[fadeInUp_0.4s_ease-out_forwards] ${optStyle}`}
            style={{ animationDelay: `${0.2 + optIdx * 0.08}s` }}
          >
            <span>{opt}</span>
            <Zap size={14} className={isSelected && !showFeedback ? 'text-sky-400 opacity-100' : 'opacity-40'} />
          </button>
        )
      })}
    </div>
  )
}
