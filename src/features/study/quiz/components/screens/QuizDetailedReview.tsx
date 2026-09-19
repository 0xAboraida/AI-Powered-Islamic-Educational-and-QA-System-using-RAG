import { List, ChevronLeft, CheckCircle2, XCircle, BookOpen, MessageCircle } from 'lucide-react'
import type { Question } from '../../../../../contexts/StudyContext'
import { isMatchingFullyAnswered, isMatchingCorrect } from '../../utils/quizEvaluator'
import { QuestionCardContent } from '../QuestionCardContent'

interface QuizDetailedReviewProps {
  localQuestions: Question[]
  selectedAnswers: Record<number, number>
  matchingAnswers: Record<number, Record<number, number>>
  shuffledMatchingOptions: Record<number, string[]>
  totalQuestions: number
  isDark: boolean
  onBack: () => void
  onDiscuss: (q: Question, wrongOptText: string) => void
}

export function QuizDetailedReview({
  localQuestions, selectedAnswers, matchingAnswers, shuffledMatchingOptions,
  totalQuestions, isDark, onBack, onDiscuss,
}: QuizDetailedReviewProps) {
  return (
    <div className="w-full flex flex-col items-center py-4" key="quiz-detailed-review" dir="rtl">
      <div className="w-full max-w-2xl space-y-4">
        {/* Sticky Header */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between backdrop-blur-md sticky top-0 z-20 shadow-md ${
          isDark ? 'bg-[#12041f]/90 border-white/10 text-white' : 'bg-white/90 border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center gap-2 font-bold text-sm">
            <List size={18} className="text-emerald-400" />
            <span>مراجعة إجابات الاختبار التفصيلية</span>
          </div>
          <button
            onClick={onBack}
            className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold shadow-md hover:bg-emerald-600 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronLeft size={16} />
            <span>العودة للنتيجة</span>
          </button>
        </div>

        {/* Questions */}
        <div className="space-y-8 pb-8">
          {localQuestions.map((q, idx) => {
            const selectedOpt = selectedAnswers[idx]
            const isAnswered = q.type === 'matching'
              ? isMatchingFullyAnswered(idx, q, matchingAnswers)
              : selectedOpt !== undefined
            const isCorrect = q.type === 'matching'
              ? isMatchingCorrect(idx, q, matchingAnswers, shuffledMatchingOptions)
              : (isAnswered && selectedOpt === q.correct_answer_index)

            return (
              <div
                key={idx}
                className={`p-6 pt-7 md:p-8 md:pt-8 rounded-3xl border shadow-xl space-y-4 transition-all relative ${
                  isDark
                    ? 'bg-[#1c0836] border-purple-500/30 text-white shadow-purple-950/50 ring-1 ring-white/5'
                    : 'bg-white border-slate-300 text-slate-900 shadow-md ring-1 ring-slate-900/5'
                }`}
              >
                {/* Floating Question Number & Answer Status Badges Outside Top-Right Corner */}
                <div className="absolute -top-4 right-5 z-10 flex items-center gap-2" dir="rtl">
                  <span className="px-3.5 py-1 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 border border-emerald-300/40 flex items-center gap-1">
                    سؤال {idx + 1} من {totalQuestions}
                  </span>

                  <span className={`px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-lg ${
                    isCorrect
                      ? 'bg-emerald-500 text-white border border-emerald-300/40 shadow-emerald-500/20'
                      : 'bg-rose-500 text-white border border-rose-300/40 shadow-rose-500/20'
                  }`}>
                    {isCorrect ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    <span>{isCorrect ? 'إجابة صحيحة' : 'إجابة خاطئة'}</span>
                  </span>
                </div>

                <QuestionCardContent
                  q={q}
                  selectedOpt={selectedOpt}
                  isAnswered={isAnswered}
                  showFeedback={true}
                  isDark={isDark}
                  isReadOnly={true}
                  matchingSelections={matchingAnswers[idx] || {}}
                  shuffledRightOptions={shuffledMatchingOptions[idx] || []}
                  correctMatchingPairs={q.matching_pairs}
                />

                {/* Scholarly Explanation Callout */}
                {q.explanation && (
                  <div className="pt-2">
                    <div className="w-full border-t border-amber-500/25 my-2" />
                    <div className={`p-4 rounded-l-2xl border-r-4 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.12)] transition-all ${
                      isDark
                        ? 'bg-gradient-to-l from-amber-500/30 via-amber-500/15 to-amber-500/5 text-amber-100/95'
                        : 'bg-gradient-to-l from-amber-200/80 via-amber-100/50 to-amber-50/30 text-slate-900 border-amber-500 shadow-sm'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-black bg-amber-400/25 text-amber-300 border border-amber-400/40 shadow-sm">
                          <BookOpen size={13} className="text-amber-400" />
                          <span>التوضيح والتفسير الشرعي</span>
                        </span>
                      </div>
                      <p className="text-xs md:text-sm leading-relaxed opacity-95 pr-1">
                        {q.explanation}
                      </p>
                    </div>
                  </div>
                )}

                {!isCorrect && (
                  <div className="pt-1 flex justify-end">
                    <button
                      onClick={() => onDiscuss(
                        q,
                        selectedOpt !== undefined && q.options && q.options[selectedOpt]
                          ? q.options[selectedOpt]
                          : (q.type === 'matching' ? 'إجابات التوصيل والربط الخاصة بي' : 'لم يتم الإجابة')
                      )}
                      className="text-xs font-black text-[#38bdf8] hover:bg-[#38bdf8]/20 flex items-center gap-2 bg-[#38bdf8]/10 px-4 py-2 rounded-xl border border-[#38bdf8]/30 shadow-md shadow-[#38bdf8]/10 transition-all active:scale-95 cursor-pointer"
                    >
                      <MessageCircle size={15} />
                      <span>تناقش مع زاد حول هذا الإشكال</span>
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
