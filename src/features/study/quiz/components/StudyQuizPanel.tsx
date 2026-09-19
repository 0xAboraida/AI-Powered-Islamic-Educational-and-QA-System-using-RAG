import { useEffect, useState } from 'react'
import { ClipboardList, X, RotateCcw, LogOut, Timer } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Question } from '../../../../contexts/StudyContext'
import type { StudyQuizPanelProps } from '../types'
import { isMatchingFullyAnswered, isMatchingCorrect, formatTimer } from '../utils/quizEvaluator'
import { studyApi } from '../../../../api/studyApi'

// ── Screen components ──────────────────────────────────────────────────
import { QuizHomeScreen } from './screens/QuizHomeScreen'
import { QuizSetupScreen } from './screens/QuizSetupScreen'
import { QuizLoadingScreen } from './screens/QuizLoadingScreen'
import { QuizReadyScreen } from './screens/QuizReadyScreen'
import { QuizCompletedScreen } from './screens/QuizCompletedScreen'
import { QuizDetailedReview } from './screens/QuizDetailedReview'
import { QuizActiveView } from './screens/QuizActiveView'
import { QuizConfirmModal } from './screens/QuizConfirmModal'

export function StudyQuizPanel({
  quizQuestions,
  loading,
  selectedAnswers,
  setSelectedAnswers,
  handleDiscussQuestion,
  currentChunkId,
  handleGenerateQuiz,
  onResetQuiz,
  onClose,
  panelWidth = 450,
  isDark = true,
  flowState,
  setFlowState,
  activeQuizId,
  activeSessionId,
  onLoadQuiz,
  chunkLoading,
}: StudyQuizPanelProps) {
  const [hasSubmittedAttempt, setHasSubmittedAttempt] = useState(false)

  // Shorthand updater
  const set = (patch: Partial<typeof flowState>) =>
    setFlowState(prev => ({ ...prev, ...patch }))

  // ── Sync incoming questions → update flow routing ───────────────────
  useEffect(() => {
    if (loading) return
    if (!quizQuestions || !Array.isArray(quizQuestions) || quizQuestions.length === 0) {
      if (!flowState.isSetupMode) {
        set({ isHomeScreen: true, isSetupMode: false, isReadyScreen: false, isQuizStarted: false })
      }
    } else if (!flowState.hasExited) {
      if (flowState.isQuizStarted) {
        set({ isHomeScreen: false, isSetupMode: false, isReadyScreen: false })
      } else if (!flowState.isSubmitted) {
        set({ isHomeScreen: false, isSetupMode: false, isReadyScreen: true })
      } else {
        set({ isHomeScreen: false, isSetupMode: false })
      }
    }
  }, [quizQuestions, loading])

  // ── Shuffle matching options whenever questions change ──────────────
  useEffect(() => {
    if (!quizQuestions || quizQuestions.length === 0) return
    setFlowState(prev => {
      if (Object.keys(prev.shuffledMatchingOptions).length > 0) return prev
      const shuffled: Record<number, string[]> = {}
      quizQuestions.forEach((q, idx) => {
        if (q.type === 'matching' && q.matching_pairs?.length) {
          const rights = q.matching_pairs.map(p => p.right)
          for (let i = rights.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [rights[i], rights[j]] = [rights[j], rights[i]]
          }
          shuffled[idx] = rights
        }
      })
      return { ...prev, shuffledMatchingOptions: shuffled }
    })
  }, [quizQuestions])

  // ── Safety guard ────────────────────────────────────────────────────
  useEffect(() => {
    if (!flowState.isTimerStarted) set({ isTimerRunning: false })
  }, [flowState.isTimerStarted])

  // ── Countdown based on start timestamp for accuracy across tab toggles ──────
  useEffect(() => {
    if (flowState.timerMode !== 'timed' || !flowState.isTimerRunning || !flowState.timerStartTime) return

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - flowState.timerStartTime!) / 1000)
      const remaining = Math.max(0, flowState.totalTimerDuration - elapsed)

      if (remaining <= 0) {
        setFlowState(prev => ({ ...prev, isTimerRunning: false, timeLeft: 0 }))
      } else {
        setFlowState(prev => ({ ...prev, timeLeft: remaining }))
      }
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)
    return () => clearInterval(timer)
  }, [flowState.timerMode, flowState.isTimerRunning, flowState.timerStartTime, flowState.totalTimerDuration])

  // ── Derived values ──────────────────────────────────────────────────
  const localQuestions = quizQuestions
  const totalQuestions = localQuestions?.length ?? 0

  const answeredCount = localQuestions?.reduce((c, q, idx) => {
    if (!q) return c
    if (q.type === 'matching') return c + (isMatchingFullyAnswered(idx, q, flowState.matchingAnswers) ? 1 : 0)
    return c + (selectedAnswers && selectedAnswers[idx] !== undefined ? 1 : 0)
  }, 0) ?? 0

  const correctCount = localQuestions?.reduce((c, q, idx) => {
    if (!q) return c
    if (q.type === 'matching') return c + (isMatchingCorrect(idx, q, flowState.matchingAnswers, flowState.shuffledMatchingOptions) ? 1 : 0)
    const optIdx = selectedAnswers ? selectedAnswers[idx] : undefined
    return c + (optIdx !== undefined && optIdx === q.correct_answer_index ? 1 : 0)
  }, 0) ?? 0

  const incorrectCount = answeredCount - correctCount
  const isTimeOut = flowState.timerMode === 'timed' && flowState.isTimerStarted && flowState.timeLeft === 0 && !flowState.isTimerRunning && totalQuestions > 0
  const isQuizCompleted = totalQuestions > 0 && (
    flowState.isSubmitted ||
    isTimeOut
  )
  const scorePct = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0
  const isTestStarted = flowState.isQuizStarted || flowState.isTimerStarted

  // Reset submitted attempt flag when test is restarted/reset
  useEffect(() => {
    if (!isQuizCompleted) {
      setHasSubmittedAttempt(false)
    }
  }, [isQuizCompleted])

  // Submit attempt to backend database when quiz is completed
  useEffect(() => {
    if (isQuizCompleted && !hasSubmittedAttempt) {
      setHasSubmittedAttempt(true)
      const targetQuizId = activeQuizId || 4
      const elapsedSeconds = flowState.timerStartTime
        ? Math.floor((Date.now() - flowState.timerStartTime) / 1000)
        : 30

      studyApi.submitQuizAttempt(
        targetQuizId,
        activeSessionId ?? null,
        totalQuestions,
        correctCount,
        scorePct,
        selectedAnswers,
        elapsedSeconds
      ).then(res => {
        console.log('Quiz attempt saved successfully:', res)
      }).catch(err => {
        console.warn('Failed to save quiz attempt:', err)
      })
    }
  }, [isQuizCompleted, hasSubmittedAttempt, activeQuizId, activeSessionId, totalQuestions, correctCount, scorePct, selectedAnswers, flowState.timerStartTime])

  const isViewingHome =
    flowState.isHomeScreen ||
    (!flowState.isSetupMode &&
      !flowState.isReadyScreen &&
      !flowState.isQuizStarted &&
      !flowState.isSubmitted &&
      !flowState.showDetailedReview &&
      !loading &&
      (!localQuestions || localQuestions.length === 0))

  // ── Helpers ─────────────────────────────────────────────────────────
  const toggleQuestionType = (typeId: string) => {
    set({
      selectedQuestionTypes: flowState.selectedQuestionTypes.includes(typeId)
        ? flowState.selectedQuestionTypes.length === 1
          ? flowState.selectedQuestionTypes
          : flowState.selectedQuestionTypes.filter(t => t !== typeId)
        : [...flowState.selectedQuestionTypes, typeId]
    })
  }

  const handleExitQuizToHome = () => {
    onResetQuiz?.()
    setSelectedAnswers({})
    setFlowState(prev => ({
      ...prev,
      hasExited: true,
      isQuizStarted: false,
      isSubmitted: false,
      isTimerStarted: false,
      timerStartTime: null,
      totalTimerDuration: 0,
      isTimerRunning: false,
      timeLeft: 0,
      isSetupMode: false,
      isReadyScreen: false,
      isHomeScreen: true,
      confirmModal: 'none',
      currentQuestionIndex: 0,
      matchingAnswers: {},
      shuffledMatchingOptions: {},
      showDetailedReview: false,
    }))
  }

  const handleStartNewQuiz = () => {
    setSelectedAnswers({})
    setFlowState(prev => ({
      ...prev,
      hasExited: false,
      isHomeScreen: false,
      isSetupMode: false,
      isReadyScreen: false,
      isQuizStarted: false,
      isTimerStarted: false,
      timerStartTime: null,
      totalTimerDuration: 0,
      isSubmitted: false,
      isTimerRunning: false,
      timeLeft: 0,
      currentQuestionIndex: 0,
      matchingAnswers: {},
      shuffledMatchingOptions: {},
    }))
    handleGenerateQuiz?.({
      numQuestions: flowState.numQuestions,
      aiMode: flowState.aiMode,
      difficulty: flowState.difficulty,
      questionTypes: flowState.selectedQuestionTypes,
    })
  }

  const handleConfirmStartQuiz = () => {
    if (flowState.timerMode === 'timed' && localQuestions) {
      const duration = localQuestions.length * flowState.secondsPerQuestion
      set({
        isReadyScreen: false,
        isQuizStarted: true,
        isTimerStarted: true,
        timerStartTime: Date.now(),
        totalTimerDuration: duration,
        timeLeft: duration,
        isTimerRunning: true,
      })
    } else {
      set({
        isReadyScreen: false,
        isQuizStarted: true,
      })
    }
  }

  const handleDiscussWrong = () => {
    const wrongEntries: { idx: number; wrongOptText: string; correctOptText: string }[] = []
      ; (localQuestions || []).forEach((q, idx) => {
        if (q.type === 'matching') {
          if (!isMatchingCorrect(idx, q, flowState.matchingAnswers, flowState.shuffledMatchingOptions)) {
            wrongEntries.push({
              idx,
              wrongOptText: 'إجابات التوصيل والربط الخاصة بي غير مكتملة أو بها أخطاء',
              correctOptText: q.matching_pairs?.map(p => `${p.left} ⬅️ ${p.right}`).join(', ') || '',
            })
          }
        } else {
          const optIdx = selectedAnswers[idx]
          const opts = q.options || []
          const correctIdx = q.correct_answer_index ?? 0
          if (optIdx === undefined || optIdx !== correctIdx) {
            wrongEntries.push({
              idx,
              wrongOptText: (optIdx !== undefined && opts[optIdx]) ? opts[optIdx] : 'لم يُجب',
              correctOptText: opts[correctIdx] || '',
            })
          }
        }
      })
    if (wrongEntries.length === 1) {
      const item = wrongEntries[0]
      const q = (localQuestions || [])[item.idx]
      if (q) handleDiscussQuestion(q, item.wrongOptText)
    } else if (wrongEntries.length > 1) {
      const batchQ: Question = {
        question: `أسئلة الاختبار الخاطئة (عدد: ${wrongEntries.length})`,
        options: wrongEntries.map((item, i) => `سؤال ${i + 1}: ${item.wrongOptText}`),
        correct_answer_index: 0,
        explanation: wrongEntries.map((item, i) => {
          const q = (localQuestions || [])[item.idx]
          return `[سؤال ${i + 1}]: "${q?.question}"\n- إجابتي: "${item.wrongOptText}"\n- الصحيحة: "${item.correctOptText}"\n- التفسير: ${q?.explanation}`
        }).join('\n\n'),
      }
      handleDiscussQuestion(batchQ, 'إجابات متعددة')
    }
  }

  const handleConfirmModalAction = () => {
    if (flowState.confirmModal === 'exit' || flowState.confirmModal === 'new') {
      handleExitQuizToHome()
    } else if (flowState.confirmModal === 'retry') {
      setSelectedAnswers({})
      setFlowState(prev => ({
        ...prev,
        currentQuestionIndex: 0,
        isQuizStarted: false,
        isSubmitted: false,
        matchingAnswers: {},
        isReadyScreen: true,
        isTimerStarted: false,
        timerStartTime: null,
        totalTimerDuration: 0,
        isTimerRunning: false,
        timeLeft: 0,
        confirmModal: 'none',
      }))
      return
    }
    set({ confirmModal: 'none' })
  }

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <>
      <div
        style={{ width: panelWidth || '100%' }}
        className={`flex-1 w-full min-w-[280px] flex flex-col relative h-full overflow-hidden transition-colors bg-transparent border-l ${isDark
            ? 'border-white/10 text-white'
            : 'border-slate-200 text-slate-900'
          }`}
      >
        {/* ── Header ── */}
        <div className={`flex items-center justify-between px-4 py-3 border-b backdrop-blur-md shrink-0 gap-2 ${isDark ? 'border-white/10 bg-[#12041f]/70 text-white' : 'border-slate-200 bg-slate-50/90 text-slate-800'
          }`} dir="rtl">
          <div className="flex items-center gap-2 text-sm font-bold shrink-0">
            <ClipboardList size={18} className="text-[#10b981]" />
            <span>اختبار التقييم</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {flowState.timerMode === 'timed' && isTestStarted && !isQuizCompleted && (
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold border transition-all shadow-sm ${flowState.isTimerStarted && flowState.timeLeft <= 20
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse'
                  : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                }`}>
                <Timer size={14} />
                <span>{formatTimer(flowState.isTimerStarted ? flowState.timeLeft : totalQuestions * flowState.secondsPerQuestion)}</span>
              </div>
            )}
            {!isViewingHome && (
              <div className="flex items-center gap-1.5">
                {isTestStarted && !isQuizCompleted && (
                  <button
                    onClick={() => set({ confirmModal: 'retry' })}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-md transition-all active:scale-95 ${isDark ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                      }`}
                    title="إعادة الاختبار"
                  >
                    <RotateCcw size={13} />
                    <span className="hidden sm:inline">إعادة</span>
                  </button>
                )}
                <button
                  onClick={() => (flowState.isSetupMode || loading) ? handleExitQuizToHome() : set({ confirmModal: 'exit' })}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-md transition-all active:scale-95 ${isDark
                      ? 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-400'
                      : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-600'
                    }`}
                  title="خروج"
                >
                  <LogOut size={13} />
                  <span className="font-bold">خروج من الاختبار</span>
                </button>
              </div>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700'
                  }`}
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* ── Ultra-thin Sleek Glowing Progress Line ── */}
        {localQuestions && !flowState.isHomeScreen && !flowState.isSetupMode && !flowState.isReadyScreen && !isQuizCompleted && (
          <div className={`w-full h-1 relative overflow-hidden shrink-0 ${isDark ? 'bg-white/5' : 'bg-slate-200/80'}`}>
            <div
              className="h-full bg-gradient-to-r from-emerald-400 via-sky-400 to-purple-400 shadow-[0_0_10px_rgba(56,189,248,0.7)] transition-all duration-500 relative"
              style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
            >
              <div className="absolute top-0 bottom-0 left-0 w-3 bg-white/90 rounded-full blur-[1px] shadow-[0_0_6px_#fff]" />
            </div>
          </div>
        )}

        {/* ── Content Area ── */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col justify-start items-center w-full">
          <AnimatePresence mode="wait">

            {loading ? (
              <motion.div key="loading" className="w-full flex flex-col items-center justify-center my-auto" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                <QuizLoadingScreen isDark={isDark} />
              </motion.div>

            ) : flowState.isSetupMode ? (
              <motion.div key="setup" className="w-full flex flex-col items-center" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                <QuizSetupScreen
                  isDark={isDark}
                  currentChunkId={currentChunkId ?? null}
                  loading={loading}
                  timerMode={flowState.timerMode} setTimerMode={v => set({ timerMode: v })}
                  secondsPerQuestion={flowState.secondsPerQuestion} setSecondsPerQuestion={v => set({ secondsPerQuestion: v })}
                  feedbackMode={flowState.feedbackMode} setFeedbackMode={v => set({ feedbackMode: v })}
                  quizViewMode={flowState.quizViewMode} setQuizViewMode={v => set({ quizViewMode: v })}
                  numQuestions={flowState.numQuestions} setNumQuestions={v => set({ numQuestions: v })}
                  aiMode={flowState.aiMode} setAiMode={v => set({ aiMode: v })}
                  difficulty={flowState.difficulty} setDifficulty={v => set({ difficulty: v })}
                  selectedQuestionTypes={flowState.selectedQuestionTypes} toggleQuestionType={toggleQuestionType}
                  onBack={() => set({ isSetupMode: false, isHomeScreen: true })}
                  onStart={handleStartNewQuiz}
                />
              </motion.div>

            ) : flowState.showDetailedReview && localQuestions ? (
              <motion.div key="review" className="w-full flex flex-col items-center" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                <QuizDetailedReview
                  localQuestions={localQuestions ?? []}
                  selectedAnswers={selectedAnswers}
                  matchingAnswers={flowState.matchingAnswers}
                  shuffledMatchingOptions={flowState.shuffledMatchingOptions}
                  totalQuestions={totalQuestions}
                  isDark={isDark}
                  onBack={() => set({ showDetailedReview: false })}
                  onDiscuss={handleDiscussQuestion}
                />
              </motion.div>

            ) : isQuizCompleted && localQuestions ? (
              <motion.div key="completed" className="w-full flex flex-col items-center" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                <QuizCompletedScreen
                  localQuestions={localQuestions ?? []}
                  selectedAnswers={selectedAnswers}
                  matchingAnswers={flowState.matchingAnswers}
                  shuffledMatchingOptions={flowState.shuffledMatchingOptions}
                  scorePct={scorePct}
                  correctCount={correctCount}
                  incorrectCount={incorrectCount}
                  totalQuestions={totalQuestions}
                  timerMode={flowState.timerMode}
                  isDark={isDark}
                  onShowDetailedReview={() => set({ showDetailedReview: true })}
                  onDiscussWrong={handleDiscussWrong}
                  onRetry={() => set({ confirmModal: 'retry' })}
                  onNewQuiz={handleExitQuizToHome}
                />
              </motion.div>

            ) : flowState.isReadyScreen && localQuestions && localQuestions.length > 0 ? (
              <motion.div key="ready" className="w-full flex flex-col items-center justify-center my-auto" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                <QuizReadyScreen
                  localQuestions={localQuestions}
                  timerMode={flowState.timerMode}
                  secondsPerQuestion={flowState.secondsPerQuestion}
                  isDark={isDark}
                  onStart={handleConfirmStartQuiz}
                  onEditSettings={() => set({ isReadyScreen: false, isSetupMode: true })}
                />
              </motion.div>

            ) : localQuestions && localQuestions.length > 0 && (flowState.isQuizStarted || isTestStarted) ? (
              <motion.div key="active" className="w-full flex flex-col items-center" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                <QuizActiveView
                  localQuestions={localQuestions}
                  quizViewMode={flowState.quizViewMode}
                  currentQuestionIndex={flowState.currentQuestionIndex}
                  setCurrentQuestionIndex={idx => set({ currentQuestionIndex: idx })}
                  selectedAnswers={selectedAnswers}
                  setSelectedAnswers={setSelectedAnswers}
                  matchingAnswers={flowState.matchingAnswers}
                  setMatchingAnswers={fn => setFlowState(prev => ({ ...prev, matchingAnswers: fn(prev.matchingAnswers) }))}
                  shuffledMatchingOptions={flowState.shuffledMatchingOptions}
                  feedbackMode={flowState.feedbackMode}
                  timerMode={flowState.timerMode}
                  isQuizCompleted={isQuizCompleted}
                  answeredCount={answeredCount}
                  totalQuestions={totalQuestions}
                  isDark={isDark}
                  onDiscuss={handleDiscussQuestion}
                  onSubmit={() => set({ isSubmitted: true })}
                  onExit={() => set({ confirmModal: 'exit' })}
                />
              </motion.div>

            ) : (
              <motion.div key="home" className="w-full flex flex-col items-center justify-center my-auto" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                <QuizHomeScreen
                  currentChunkId={currentChunkId ?? null}
                  isDark={isDark}
                  onStartSetup={() => set({ hasExited: false, isHomeScreen: false, isSetupMode: true })}
                  onLoadQuiz={onLoadQuiz}
                  chunkLoading={chunkLoading}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* ── Confirm Modal ── */}
      <QuizConfirmModal
        confirmModal={flowState.confirmModal}
        isDark={isDark}
        onCancel={() => set({ confirmModal: 'none' })}
        onConfirm={handleConfirmModalAction}
      />
    </>
  )
}
