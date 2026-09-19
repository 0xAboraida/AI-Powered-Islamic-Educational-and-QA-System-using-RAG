import { apiClient } from './client'

export interface StudySessionDto {
  id: number
  chunkId: string
  bookTitle: string
  domain: string
  sectionTitle: string
  createdAt: string
  lastAccessedAt: string
  isActive: boolean
}

export interface StudyMessageDto {
  id: number
  studySessionId: number
  role: 'user' | 'tutor'
  content: string
  isQuestionDiscussion: boolean
  discussedQuestionText?: string
  createdAt: string
}

export interface StudyMindmapDto {
  id: number
  chunkId: string
  title: string
  treeData: any
  authorName: string
  createdAt: string
}

export interface QuizDto {
  id: number
  chunkId: string
  title: string
  sectionTitle: string
  mode: string
  difficulty: string
  questionsData: any
  authorName: string
  createdAt: string
}

export interface QuizAttemptDto {
  id: number
  quizId: number
  studySessionId?: number
  totalQuestions: number
  correctAnswers: number
  scorePercentage: number
  userAnswers: Record<number, number>
  timeSpentSeconds: number
  createdAt: string
}

export interface StudyNoteDto {
  id: number
  chunkId: string
  content: string
  updatedAt: string
}

export interface UserStudyProgressDto {
  userId: number
  totalStudyMinutes: number
  lessonsCompletedCount: number
  averageQuizScore: number
  streakDays: number
  lastStudyDate: string
  dailyGoalMinutes?: number
}

export const studyApi = {
  // 1. Library & Curriculum
  getLibraryTrees: async (forceRefresh = false) => {
    return apiClient<{ success: boolean; tree: any }>(`/api/study/library/trees?forceRefresh=${forceRefresh}`)
  },

  getChunkById: async (chunkId: string) => {
    return apiClient<any>(`/api/study/library/chunks/${chunkId}`)
  },

  // 2. Sessions
  startSession: async (chunkId: string, bookTitle?: string, domain?: string, sectionTitle?: string) => {
    return apiClient<StudySessionDto>('/api/study/sessions/start', {
      method: 'POST',
      body: JSON.stringify({ chunkId, bookTitle, domain, sectionTitle })
    })
  },

  getSessions: async () => {
    return apiClient<StudySessionDto[]>('/api/study/sessions')
  },

  getSessionDetails: async (sessionId: number) => {
    return apiClient<any>(`/api/study/sessions/${sessionId}`)
  },

  // 3. Tutor Chat
  sendMessage: async (sessionId: number, message: string, mode: string = 'chat', isQuestionDiscussion = false, discussedQuestionText?: string) => {
    return apiClient<StudyMessageDto>(`/api/study/sessions/${sessionId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message, mode, isQuestionDiscussion, discussedQuestionText })
    })
  },

  getSessionMessages: async (sessionId: number) => {
    return apiClient<StudyMessageDto[]>(`/api/study/sessions/${sessionId}/messages`)
  },

  // 4. Mindmaps
  generateMindmap: async (chunkId: string, text?: string, title?: string, metadata?: any) => {
    return apiClient<StudyMindmapDto>('/api/study/mindmaps/generate', {
      method: 'POST',
      body: JSON.stringify({ chunkId, text, title, metadata })
    })
  },

  getMindmapsByChunk: async (chunkId: string) => {
    return apiClient<StudyMindmapDto[]>(`/api/study/mindmaps/by-chunk?chunkId=${encodeURIComponent(chunkId)}`)
  },

  getCommunityMindmapsByChunk: async (chunkId: string) => {
    return apiClient<StudyMindmapDto[]>(`/api/study/mindmaps/community?chunkId=${encodeURIComponent(chunkId)}`)
  },

  // 5. Quizzes & Attempts
  generateQuiz: async (chunkId: string, numQuestions = 5, mode = 'comprehensive', difficulty = 'medium', sectionTitle?: string) => {
    return apiClient<QuizDto>('/api/study/quizzes/generate', {
      method: 'POST',
      body: JSON.stringify({ chunkId, numQuestions, mode, difficulty, sectionTitle })
    })
  },

  getUserQuizzes: async () => {
    return apiClient<QuizDto[]>('/api/study/quizzes')
  },

  getQuizzesByChunk: async (chunkId: string) => {
    return apiClient<QuizDto[]>(`/api/study/quizzes/by-chunk?chunkId=${encodeURIComponent(chunkId)}`)
  },

  getCommunityQuizzesByChunk: async (chunkId: string) => {
    return apiClient<QuizDto[]>(`/api/study/quizzes/community?chunkId=${encodeURIComponent(chunkId)}`)
  },

  submitQuizAttempt: async (
    quizId: number,
    studySessionId: number | null,
    totalQuestions: number,
    correctAnswers: number,
    scorePercentage: number,
    userAnswers: Record<number, number>,
    timeSpentSeconds: number
  ) => {
    return apiClient<QuizAttemptDto>('/api/study/quizzes/submit', {
      method: 'POST',
      body: JSON.stringify({
        quizId,
        studySessionId,
        totalQuestions,
        correctAnswers,
        scorePercentage,
        userAnswers,
        timeSpentSeconds
      })
    })
  },

  getQuizAttempts: async (sessionId: number) => {
    return apiClient<QuizAttemptDto[]>(`/api/study/quizzes/attempts/session/${sessionId}`)
  },

  // 6. Notes & Progress
  saveNote: async (chunkId: string, content: string) => {
    return apiClient<StudyNoteDto>('/api/study/notes', {
      method: 'POST',
      body: JSON.stringify({ chunkId, content })
    })
  },

  getNote: async (chunkId: string) => {
    return apiClient<StudyNoteDto>(`/api/study/notes/${chunkId}`)
  },

  getProgress: async () => {
    return apiClient<UserStudyProgressDto>('/api/study/progress')
  },

  updateProgress: async (progressData: Partial<UserStudyProgressDto>) => {
    return apiClient<UserStudyProgressDto>('/api/study/progress', {
      method: 'POST',
      body: JSON.stringify(progressData)
    })
  }
}
