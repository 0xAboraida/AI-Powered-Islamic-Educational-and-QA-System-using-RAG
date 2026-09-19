import type { Question } from '../../../contexts/StudyContext'

export interface QuestionCardContentProps {
  q: Question
  questionIndex?: number
  selectedOpt?: number
  onSelectOption?: (idx: number) => void
  isAnswered: boolean
  showFeedback: boolean
  isDark: boolean
  isReadOnly?: boolean
  matchingSelections?: Record<number, number>
  shuffledRightOptions?: string[]
  onMatchingSelect?: (leftIdx: number, rightIdx: number) => void
  correctMatchingPairs?: { left: string; right: string }[]
}

/** Persistent quiz state lifted to StudyMode to survive panel unmounting */
export interface QuizFlowState {
  // Screen routing
  isHomeScreen: boolean
  isSetupMode: boolean
  isReadyScreen: boolean
  isQuizStarted: boolean
  isSubmitted: boolean
  showDetailedReview: boolean
  confirmModal: 'none' | 'exit' | 'retry' | 'new'

  // Setup settings
  timerMode: 'untimed' | 'timed'
  secondsPerQuestion: number
  feedbackMode: 'instant' | 'at_end'
  quizViewMode: 'stepper' | 'list'
  numQuestions: number | 'auto'
  aiMode: 'comprehensive' | 'random'
  difficulty: 'easy' | 'medium' | 'hard'
  selectedQuestionTypes: string[]

  // Timer
  isTimerStarted: boolean
  timerStartTime: number | null
  totalTimerDuration: number
  timeLeft: number
  isTimerRunning: boolean

  // Navigation
  currentQuestionIndex: number

  // Matching
  matchingAnswers: Record<number, Record<number, number>>
  shuffledMatchingOptions: Record<number, string[]>

  // Prevents re-showing ready screen after hasExited
  hasExited: boolean
}

export type QuizFlowAction = Partial<QuizFlowState>

export const defaultQuizFlowState = (quizQuestions: Question[] | null): QuizFlowState => ({
  isHomeScreen: !quizQuestions,
  isSetupMode: false,
  isReadyScreen: false,
  isQuizStarted: false,
  isSubmitted: false,
  showDetailedReview: false,
  confirmModal: 'none',
  timerMode: 'untimed',
  secondsPerQuestion: 30,
  feedbackMode: 'instant',
  quizViewMode: 'stepper',
  numQuestions: 5,
  aiMode: 'comprehensive',
  difficulty: 'medium',
  selectedQuestionTypes: ['mcq', 'true_false', 'fill_blank', 'matching'],
  isTimerStarted: false,
  timerStartTime: null,
  totalTimerDuration: 0,
  timeLeft: 0,
  isTimerRunning: false,
  currentQuestionIndex: 0,
  matchingAnswers: {},
  shuffledMatchingOptions: {},
  hasExited: false,
})

export interface StudyQuizPanelProps {
  quizQuestions: Question[] | null
  loading: boolean
  selectedAnswers: Record<number, number>
  setSelectedAnswers: React.Dispatch<React.SetStateAction<Record<number, number>>>
  handleDiscussQuestion: (q: Question, wrongOpt: string) => void
  currentChunkId?: string | null
  handleGenerateQuiz?: (options?: {
    numQuestions?: number | 'auto'
    aiMode?: 'comprehensive' | 'random'
    difficulty?: 'easy' | 'medium' | 'hard'
    questionTypes?: string[]
    isAppend?: boolean
  }) => void
  onResetQuiz?: () => void
  onClose?: () => void
  panelWidth?: number
  startResizing?: (e: React.MouseEvent) => void
  isDark?: boolean
  // Lifted flow state
  flowState: QuizFlowState
  setFlowState: React.Dispatch<React.SetStateAction<QuizFlowState>>
  activeQuizId?: number | null
  activeSessionId?: number | null
  onLoadQuiz?: (quizDto: any) => void
  chunkLoading?: boolean
}

