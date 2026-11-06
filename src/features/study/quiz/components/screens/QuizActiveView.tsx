import {
  ChevronLeft, ChevronRight, Award, MessageCircle,
  CheckCircle2, XCircle, BookOpen, LogOut, RotateCcw
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Question } from '../../../../../contexts/StudyContext'
import { isMatchingFullyAnswered, isMatchingCorrect, formatIslamicQuizText, getNormalizedMatchingPairs } from '../../utils/quizEvaluator'
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
  onRetry?: () => void
}

export function QuizActiveView({
  localQuestions, quizViewMode,
  currentQuestionIndex, setCurrentQuestionIndex,
  selectedAnswers, setSelectedAnswers,
  matchingAnswers, setMatchingAnswers,
  shuffledMatchingOptions,
  feedbackMode, timerMode, isQuizCompleted,
  answeredCount, totalQuestions,
  isDark, onDiscuss, onSubmit, onExit, onRetry,
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
      <div className="mt-5 animate-in fade-in duration-300">
        {/* Unified Evaluation & Explanation Card */}
        <div className={`rounded-2xl border-l border-t border-b border-r-4 overflow-hidden shadow-sm transition-all ${
          isCorrect
            ? isDark
              ? 'border-r-emerald-400 border-white/10 bg-[#061e14]/60'
              : 'border-r-emerald-600 border-emerald-200/90 bg-emerald-50/40'
            : isDark
              ? 'border-r-rose-400 border-white/10 bg-[#240a12]/60'
              : 'border-r-rose-600 border-rose-200/90 bg-rose-50/40'
        }`}>
          {/* Card Header: Evaluation Banner */}
          <div className={`px-4 py-2.5 flex items-center justify-between border-b ${
            isCorrect
              ? isDark
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200'
                : 'bg-emerald-100/90 border-emerald-200 text-emerald-950 font-black'
              : isDark
                ? 'bg-rose-500/20 border-rose-500/30 text-rose-200'
                : 'bg-rose-100/90 border-rose-200 text-rose-950 font-black'
          }`}>
            <div className="flex items-center gap-2 font-black text-xs sm:text-sm">
              {isCorrect ? (
                <>
                  <CheckCircle2 size={17} className={isDark ? "text-emerald-400" : "text-emerald-700"} />
                  <span>إجابة صحيحة، أحسنت! 👏</span>
                </>
              ) : (
                <>
                  <XCircle size={17} className={isDark ? "text-rose-400" : "text-rose-700"} />
                  <span>إجابة غير صحيحة</span>
                </>
              )}
            </div>

            {!isCorrect && (
              <button
                type="button"
                onClick={() => onDiscuss(
                  q,
                  selectedOpt !== undefined
                    ? q.options[selectedOpt]
                    : (q.type === 'matching' ? 'إجابات التوصيل والربط الخاصة بي' : 'لم يتم الإجابة')
                )}
                className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                  isDark
                    ? 'bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border-sky-500/30'
                    : 'bg-white hover:bg-sky-50 text-sky-800 border-sky-200 shadow-xs'
                }`}
              >
                <MessageCircle size={13} className={isDark ? "text-sky-300" : "text-sky-700"} />
                <span>تناقش مع زاد</span>
              </button>
            )}
          </div>

          {/* If matching question and incorrect, show the correct connections explicitly */}
          {q.type === 'matching' && !isCorrect && (
            <div className="mx-4 mt-3 text-right space-y-2">
              <div className="flex items-center text-xs font-black text-emerald-700 dark:text-emerald-400 pr-0.5">
                <span>التوصيل الصحيح</span>
              </div>
              <div className="space-y-2 text-xs">
                {getNormalizedMatchingPairs(q).map((pair, pIdx) => (
                  <div
                    key={pIdx}
                    className={`p-2.5 rounded-xl border text-xs flex flex-col gap-1.5 transition-all ${
                      isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-2xs'
                    }`}
                  >
                    {/* المصطلح ورقم ترتيبه */}
                    <div className="flex items-center gap-2 font-black text-slate-900 dark:text-stone-100">
                      <span className="w-5 h-5 rounded-md bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 flex items-center justify-center text-[11px] font-black shrink-0">
                        {pIdx + 1}
                      </span>
                      <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-stone-100">
                        {formatIslamicQuizText(pair.left)}
                      </span>
                    </div>

                    {/* التعريف المرتبط بعرض كامل لمنع انضغاط الكلمات عمودياً */}
                    <div className={`flex items-start gap-2 p-2 rounded-lg border ${
                      isDark 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                        : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                    }`}>
                      <span className="text-emerald-600 dark:text-emerald-400 font-black shrink-0 mt-0.5">⟵</span>
                      <span className="text-xs sm:text-sm font-bold leading-relaxed flex-1">
                        {formatIslamicQuizText(pair.right)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Card Body: Scholarly Explanation */}
          {q.explanation && (
            <div className="p-4 space-y-2 text-right">
              <div className="flex items-center gap-1.5">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-black border ${
                  isDark
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-amber-100 text-amber-900 border-amber-200'
                }`}>
                  <BookOpen size={13} className={isDark ? "text-amber-400" : "text-amber-700"} />
                  <span>{isCorrect ? 'التوضيح والتفسير الشرعي' : 'بيان وتأصيل الإجابة الصحيحة'}</span>
                </span>
              </div>
              <p className={`text-xs sm:text-sm leading-relaxed pr-0.5 font-medium ${
                isDark ? 'text-stone-200' : 'text-slate-800'
              }`}>
                {formatIslamicQuizText(q.explanation)}
              </p>
            </div>
          )}
        </div>
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
                {/* Floating Question Number Navigator Pills & Mobile Action Buttons */}
                <div className="w-full md:w-auto flex flex-row md:flex-col items-center justify-center gap-2 sm:gap-2.5 shrink-0 self-center my-auto" dir="rtl">
                  {/* Mobile-Only Action Icons: Exit & Retry */}
                  <div className="flex md:hidden items-center gap-1.5 shrink-0">
                    {onExit && (
                      <button
                        onClick={onExit}
                        className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all active:scale-90 shadow-2xs cursor-pointer ${
                          isDark
                            ? 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-400'
                            : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-600'
                        }`}
                        title="خروج من الاختبار"
                        aria-label="خروج من الاختبار"
                      >
                        <LogOut size={15} />
                      </button>
                    )}
                    {onRetry && (
                      <button
                        onClick={onRetry}
                        className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all active:scale-90 shadow-2xs cursor-pointer ${
                          isDark
                            ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80'
                            : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                        }`}
                        title="إعادة الاختبار"
                        aria-label="إعادة الاختبار"
                      >
                        <RotateCcw size={15} />
                      </button>
                    )}
                  </div>

                  {/* Pills Container */}
                  <div className="flex flex-row md:flex-col items-center justify-center gap-1.5 sm:gap-2 shrink-0">
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
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={qIdx}
                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -16, scale: 0.98 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className={`p-3.5 sm:p-5 md:p-8 rounded-2xl border shadow-xl flex-1 max-w-3xl w-full relative overflow-hidden text-right transition-all duration-300 ${theme.cardBg} ${theme.cardBorder}`}
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
        <div className="space-y-6 w-full max-w-3xl mx-auto pb-8 flex flex-col items-center">
          {/* Mobile Top Actions for List View */}
          <div className="w-full max-w-2xl px-3 flex md:hidden items-center justify-end" dir="rtl">
            <div className="flex items-center gap-1.5 shrink-0">
              {onExit && (
                <button
                  onClick={onExit}
                  className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all active:scale-90 shadow-2xs cursor-pointer ${
                    isDark
                      ? 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-400'
                      : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-600'
                  }`}
                  title="خروج من الاختبار"
                  aria-label="خروج من الاختبار"
                >
                  <LogOut size={15} />
                </button>
              )}
              {onRetry && (
                <button
                  onClick={onRetry}
                  className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all active:scale-90 shadow-2xs cursor-pointer ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                  }`}
                  title="إعادة الاختبار"
                  aria-label="إعادة الاختبار"
                >
                  <RotateCcw size={15} />
                </button>
              )}
            </div>
          </div>

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
