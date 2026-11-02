import {
  ChevronLeft, ChevronRight, Award, MessageCircle,
  CheckCircle2, XCircle, BookOpen, LogOut
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Question } from '../../../../../contexts/StudyContext'
import { isMatchingFullyAnswered, isMatchingCorrect, formatIslamicQuizText } from '../../utils/quizEvaluator'
import { QuestionCardContent } from '../QuestionCardContent'
import { useTheme } from '../../../../../contexts/ThemeContext'
import { getQuizActiveThemeTokens } from '../../utils/quizThemeTokens'

interface QuizActiveViewProps {
  localQuestions: Question[]
  quizViewMode: 'stepper' | 'list'
  currentQuestionIndex: number
  setCurrentQuestionIndex: (idx: number) => void
  selectedAnswers: Record<number, number>
  setSelectedAnswers: (fn: (prev: Record<number, number>) => Record<number, number>) => void
  matchingAnswers: Record<number, Record<number, number>>
  setMatchingAnswers: (fn: (prev: Record<number, Record<number, number>>) => Record<number, Record<number, number>>) => void
  shuffledMatchingOptions: Record<number, string[]>
  feedbackMode: 'instant' | 'at_end'
  timerMode: 'untimed' | 'timed'
  isQuizCompleted: boolean
  answeredCount: number
  totalQuestions: number
  isDark: boolean
  onDiscuss: (q: Question, wrongOptText: string) => void
  onSubmit: () => void
  onExit?: () => void
}

export function QuizActiveView({
  localQuestions, quizViewMode,
  currentQuestionIndex, setCurrentQuestionIndex,
  selectedAnswers, setSelectedAnswers,
  matchingAnswers, setMatchingAnswers,
  shuffledMatchingOptions,
  feedbackMode, timerMode, isQuizCompleted,
  answeredCount, totalQuestions,
  isDark, onDiscuss, onSubmit, onExit,
}: QuizActiveViewProps) {
  const { accentColor } = useTheme()
  const theme = getQuizActiveThemeTokens(accentColor, isDark)

  // Helper to compute a sliding window of visible question pill indices (Max 5 at a time)
  const getVisiblePillIndices = (current: number, total: number, maxVisible: number = 5) => {
    if (total <= maxVisible) {
      return Array.from({ length: total }, (_, i) => i)
    }
    const half = Math.floor(maxVisible / 2)
    let start = current - half
    let end = current + half

    if (start < 0) {
      start = 0
      end = maxVisible - 1
    }
    if (end >= total) {
      end = total - 1
      start = total - maxVisible
    }

    const indices: number[] = []
    for (let i = start; i <= end; i++) {
      indices.push(i)
    }
    return indices
  }

  const renderFeedbackBlock = (
    q: Question, idx: number, isAnswered: boolean, isCorrect: boolean, selectedOpt: number | undefined, showFeedback: boolean
  ) => {
    if (!isAnswered || !showFeedback) return null
    return (
      <div className="mt-4 space-y-3 animate-in fade-in duration-300">
        {/* Status Pill */}
        <div className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center justify-between ${
          isCorrect
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
        }`}>
          <span className="flex items-center gap-1.5">
            {isCorrect ? (
              <><CheckCircle2 size={15} className="text-emerald-400" /><span>إجابة صحيحة! أحسنت 👏</span></>
            ) : (
              <><XCircle size={15} className="text-rose-400" /><span>إجابة خاطئة</span></>
            )}
          </span>
          {!isCorrect && (
            <button
              onClick={() => onDiscuss(
                q,
                selectedOpt !== undefined
                  ? q.options[selectedOpt]
                  : (q.type === 'matching' ? 'إجابات التوصيل والربط الخاصة بي' : 'لم يتم الإجابة')
              )}
              className="text-xs font-bold text-[#38bdf8] hover:underline flex items-center gap-1.5 bg-[#38bdf8]/10 px-2.5 py-1 rounded-lg border border-[#38bdf8]/20 cursor-pointer"
            >
              <MessageCircle size={13} />
              <span>تناقش مع زاد</span>
            </button>
          )}
        </div>

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
                {formatIslamicQuizText(q.explanation)}
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col items-center justify-start min-h-full py-2" key="quiz-active">

      {quizViewMode === 'stepper' ? (
        // ─── STEPPER VIEW (Cards Mode) ───
        <div className="my-auto w-full flex flex-col items-center justify-center">
          {(() => {
            const safeQIdx = Math.min(Math.max(0, currentQuestionIndex), Math.max(0, totalQuestions - 1))
            const q = localQuestions[safeQIdx] || localQuestions[0]
            if (!q) return null
            const qIdx = safeQIdx

            const selectedOpt = selectedAnswers[qIdx]
            const isAnswered = q.type === 'matching'
              ? isMatchingFullyAnswered(qIdx, q, matchingAnswers)
              : selectedOpt !== undefined
            const showFeedback = ((feedbackMode === 'instant' && timerMode !== 'timed') || isQuizCompleted) && isAnswered
            const isCorrect = showFeedback && isAnswered && (
              q.type === 'matching'
                ? isMatchingCorrect(qIdx, q, matchingAnswers, shuffledMatchingOptions)
                : selectedOpt === q.correct_answer_index
            )

            const visibleIndices = getVisiblePillIndices(qIdx, totalQuestions, 5)

            return (
              <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center gap-3 sm:gap-4" dir="rtl">
                {/* Floating Question Number Navigator Pills (Right Side - Centered) */}
                <div className="flex flex-row md:flex-col items-center justify-center gap-1.5 sm:gap-2 shrink-0 self-center my-auto w-full md:w-auto" dir="rtl">
                  {visibleIndices[0] > 0 && (
                    <button
                      onClick={() => setCurrentQuestionIndex(visibleIndices[0] - 1)}
                      className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-xs opacity-60 hover:opacity-100 transition-all cursor-pointer ${theme.stepperArrow}`}
                      title="الأسئلة السابقة"
                    >
                      <ChevronRight size={16} className="rotate-90 md:rotate-0" />
                    </button>
                  )}

                  {visibleIndices.map((dotIdx) => {
                    const dq = localQuestions[dotIdx]
                    if (!dq) return null
                    const isAns = dq.type === 'matching'
                      ? isMatchingFullyAnswered(dotIdx, dq, matchingAnswers)
                      : selectedAnswers[dotIdx] !== undefined
                    const isCurr = currentQuestionIndex === dotIdx
                    return (
                      <button
                        key={dotIdx}
                        onClick={() => setCurrentQuestionIndex(dotIdx)}
                        className={`w-8 h-8 md:w-9 md:h-9 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer flex items-center justify-center border shadow-xs ${
                          isCurr
                            ? `${theme.stepperPillActive}`
                            : isAns
                            ? `${theme.stepperPillDone} hover:scale-105`
                            : isDark
                            ? 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white hover:scale-105'
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200 hover:scale-105'
                        }`}
                        title={`سؤال ${dotIdx + 1}`}
                      >
                        {dotIdx + 1}
                      </button>
                    )
                  })}

                  {visibleIndices[visibleIndices.length - 1] < totalQuestions - 1 && (
                    <button
                      onClick={() => setCurrentQuestionIndex(visibleIndices[visibleIndices.length - 1] + 1)}
                      className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-xs opacity-60 hover:opacity-100 transition-all cursor-pointer ${theme.stepperArrow}`}
                      title="الأسئلة التالية"
                    >
                      <ChevronLeft size={16} className="rotate-90 md:rotate-0" />
                    </button>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={qIdx}
                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -16, scale: 0.98 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className={`p-3.5 sm:p-5 md:p-8 rounded-2xl border shadow-xl flex-1 max-w-2xl w-full relative overflow-hidden text-right transition-all duration-300 ${theme.cardBg} ${theme.cardBorder}`}
                    dir="rtl"
                  >

                <QuestionCardContent
                  q={q}
                  questionIndex={qIdx}
                  selectedOpt={selectedOpt}
                  onSelectOption={(optIdx) => setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }))}
                  isAnswered={isAnswered}
                  showFeedback={showFeedback}
                  isDark={isDark}
                  matchingSelections={matchingAnswers[qIdx] || {}}
                  shuffledRightOptions={shuffledMatchingOptions[qIdx] || []}
                  correctMatchingPairs={q.matching_pairs}
                  onMatchingSelect={(leftIdx, rightIdx) =>
                    setMatchingAnswers(prev => ({ ...prev, [qIdx]: { ...(prev[qIdx] || {}), [leftIdx]: rightIdx } }))
                  }
                />

                {renderFeedbackBlock(q, qIdx, isAnswered, isCorrect, selectedOpt, showFeedback)}

                {/* Bottom Navigation */}
                <div className="flex items-center justify-between gap-2 sm:gap-3 mt-4 pt-3.5 border-t border-current/10">
                  <button
                    disabled={qIdx === 0}
                    onClick={() => setCurrentQuestionIndex(Math.max(0, qIdx - 1))}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                      qIdx === 0
                        ? 'opacity-30 cursor-not-allowed border-transparent'
                        : isDark ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white cursor-pointer' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800 cursor-pointer'
                    }`}
                  >
                    <ChevronRight size={15} />
                    <span>السابق</span>
                  </button>

                  {/* Progress Indicator */}
                  <span className={`text-[11px] font-bold ${theme.progressText}`}>
                    مُجاب {answeredCount} من {totalQuestions}
                  </span>

                  {qIdx < totalQuestions - 1 ? (
                    <button
                      onClick={() => setCurrentQuestionIndex(Math.min(totalQuestions - 1, qIdx + 1))}
                      className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-bold text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer ${theme.nextBtn}`}
                    >
                      <span>التالي</span>
                      <ChevronLeft size={15} />
                    </button>
                  ) : (
                    <button
                      disabled={answeredCount < totalQuestions}
                      onClick={onSubmit}
                      className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
                        answeredCount < totalQuestions
                          ? 'opacity-40 bg-slate-500/20 text-slate-400 border border-slate-500/30 cursor-not-allowed'
                          : timerMode === 'timed'
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-amber-500/25 cursor-pointer animate-pulse'
                          : `${theme.submitBtn} cursor-pointer`
                      }`}
                      title={answeredCount < totalQuestions ? `أجب على كافة الأسئلة أولاً` : timerMode === 'timed' ? 'تسليم قبل انتهاء الوقت' : 'تسليم والتقييم'}
                    >
                      <Award size={14} />
                      <span>{timerMode === 'timed' ? 'تسليم مبكر' : 'تسليم'}</span>
                    </button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          )
          })()}
        </div>
      ) : (
        // ─── LIST VIEW ───
        <div className="space-y-10 w-full max-w-3xl mx-auto pb-8 flex flex-col items-center">

          {localQuestions.map((q, idx) => {
            const selectedOpt = selectedAnswers[idx]
            const isAnswered = q.type === 'matching'
              ? isMatchingFullyAnswered(idx, q, matchingAnswers)
              : selectedOpt !== undefined
            const showFeedback = ((feedbackMode === 'instant' && timerMode !== 'timed') || isQuizCompleted) && isAnswered
            const isCorrect = showFeedback && isAnswered && (
              q.type === 'matching'
                ? isMatchingCorrect(idx, q, matchingAnswers, shuffledMatchingOptions)
                : selectedOpt === q.correct_answer_index
            )

            return (
              <div
                key={idx}
                className={`p-3.5 sm:p-5 md:p-8 rounded-2xl border shadow-lg space-y-3.5 w-full max-w-2xl text-right transition-all duration-300 ${theme.cardBg} ${theme.cardBorder}`}
                dir="rtl"
              >
                <QuestionCardContent
                  q={q}
                  questionIndex={idx}
                  selectedOpt={selectedOpt}
                  onSelectOption={(optIdx) => setSelectedAnswers((prev) => ({ ...prev, [idx]: optIdx }))}
                  isAnswered={isAnswered}
                  showFeedback={showFeedback}
                  isDark={isDark}
                  matchingSelections={matchingAnswers[idx] || {}}
                  shuffledRightOptions={shuffledMatchingOptions[idx] || []}
                  correctMatchingPairs={q.matching_pairs}
                  onMatchingSelect={(leftIdx, rightIdx) =>
                    setMatchingAnswers(prev => ({ ...prev, [idx]: { ...(prev[idx] || {}), [leftIdx]: rightIdx } }))
                  }
                />

                {renderFeedbackBlock(q, idx, isAnswered, isCorrect, selectedOpt, showFeedback)}
              </div>
            )
          })}

          {/* List Submit Button */}
          <div className="flex flex-col items-center gap-2 pt-4 border-t border-current/10 w-full max-w-2xl mt-4" dir="rtl">
            <button
              disabled={answeredCount < totalQuestions}
              onClick={onSubmit}
              className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl text-xs font-black transition-all shadow-lg active:scale-95 ${
                answeredCount < totalQuestions
                  ? 'opacity-40 bg-slate-500/20 text-slate-400 border border-slate-500/30 cursor-not-allowed'
                  : timerMode === 'timed'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-amber-500/25 cursor-pointer'
                  : `${theme.submitBtn} cursor-pointer`
              }`}
              title={answeredCount < totalQuestions ? `يجب الإجابة على كافة الأسئلة (${answeredCount}/${totalQuestions})` : timerMode === 'timed' ? 'تسليم قبل انتهاء الوقت' : 'تسليم والتقييم'}
            >
              <Award size={16} />
              <span>{
                answeredCount < totalQuestions
                  ? `أكمل الإجابات لتسليم الاختبار (${answeredCount}/${totalQuestions})`
                  : timerMode === 'timed'
                  ? 'تسليم مبكر قبل انتهاء الوقت'
                  : 'تسليم والتقييم'
              }</span>
            </button>
            {timerMode === 'timed' && answeredCount === totalQuestions && (
              <p className="text-[10px] text-amber-400/70 font-bold">
                ℹ️ يمكنك الانتظار حتى نهاية الوقت أو التسليم مبكراً
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
