import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { type QuizFlowState, defaultQuizFlowState } from '../features/study/quiz/types'

export interface Message {
  id: string
  role: 'user' | 'tutor'
  text: string
}

export interface ApiHistoryMsg {
  role: string
  content: string
}

export interface MatchingPair {
  left: string
  right: string
}

export interface Question {
  id?: string
  type?: 'mcq' | 'true_false' | 'matching' | 'fill_blank'
  question: string
  options: string[]
  correct_answer_index: number
  explanation: string
  matching_pairs?: MatchingPair[]
}

export interface MindmapNode {
  id?: string
  type?: 'label' | 'content'
  label?: string
  content?: string
  children?: MindmapNode[]
}

export interface ChunkMetadata {
  book_title?: string
  author?: string
  author_death?: string
  domain?: string
  madhhab?: string
  hijri_century?: string
  total_parts?: number | string
  part?: number | string
  page_id?: number | string
  source_url?: string
  hierarchy?: Record<string, string | string[]>
}

export interface TreeNode {
  title: string
  chunk_id?: string
  is_new?: boolean
  children?: TreeNode[]
}

interface StudyContextType {
  activeTab: 'chat' | 'mindmap' | 'quiz'
  setActiveTab: React.Dispatch<React.SetStateAction<'chat' | 'mindmap' | 'quiz'>>
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  chatHistory: ApiHistoryMsg[]
  setChatHistory: React.Dispatch<React.SetStateAction<ApiHistoryMsg[]>>
  currentChunkId: string | null
  setCurrentChunkId: React.Dispatch<React.SetStateAction<string | null>>
  activeSessionId: number | null
  setActiveSessionId: React.Dispatch<React.SetStateAction<number | null>>
  chunkTitle: string
  setChunkTitle: React.Dispatch<React.SetStateAction<string>>
  headerSubtitle: string
  setHeaderSubtitle: React.Dispatch<React.SetStateAction<string>>
  chunkText: string
  setChunkText: React.Dispatch<React.SetStateAction<string>>
  chunkMeta: ChunkMetadata | null
  setChunkMeta: React.Dispatch<React.SetStateAction<ChunkMetadata | null>>
  quizQuestions: Question[] | null
  setQuizQuestions: React.Dispatch<React.SetStateAction<Question[] | null>>
  quizFlowState: QuizFlowState
  setQuizFlowState: React.Dispatch<React.SetStateAction<QuizFlowState>>
  mindmapData: MindmapNode[] | null
  setMindmapData: React.Dispatch<React.SetStateAction<MindmapNode[] | null>>
  selectedAnswers: Record<number, number>
  setSelectedAnswers: React.Dispatch<React.SetStateAction<Record<number, number>>>
  
  // Tree Data caching
  treeData: TreeNode[]
  setTreeData: React.Dispatch<React.SetStateAction<TreeNode[]>>
  treeLoading: boolean
  setTreeLoading: React.Dispatch<React.SetStateAction<boolean>>

  clearStudySession: () => void
}

export const StudyContext = createContext<StudyContextType | undefined>(undefined)

// Custom hook to sync state to localStorage
function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue))
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  return [storedValue, setStoredValue]
}

export function StudyProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useLocalStorage<'chat' | 'mindmap' | 'quiz'>('zad_activeTab', 'chat')
  const [messages, setMessages] = useLocalStorage<Message[]>('zad_messages', [])
  const [chatHistory, setChatHistory] = useLocalStorage<ApiHistoryMsg[]>('zad_chatHistory', [])
  
  const [currentChunkId, setCurrentChunkId] = useLocalStorage<string | null>('zad_currentChunkId', null)
  const [activeSessionId, setActiveSessionId] = useLocalStorage<number | null>('zad_activeSessionId', null)
  const [chunkTitle, setChunkTitle] = useLocalStorage<string>('zad_chunkTitle', 'اختر درساً من الفهرس...')
  const [headerSubtitle, setHeaderSubtitle] = useLocalStorage<string>('zad_headerSubtitle', 'يرجى اختيار درس للبدء')
  const [chunkText, setChunkText] = useLocalStorage<string>('zad_chunkText', 'يرجى اختيار درس من الفهرس الجانبي لعرض النص الأساسي والبدء في التفاعل مع زاد.')
  const [chunkMeta, setChunkMeta] = useLocalStorage<ChunkMetadata | null>('zad_chunkMeta', null)
  
  const [quizQuestions, setQuizQuestions] = useLocalStorage<Question[] | null>('zad_quizQuestions', null)
  const [quizFlowState, setQuizFlowState] = useLocalStorage<QuizFlowState>('zad_quizFlowState', defaultQuizFlowState(null))
  const [mindmapData, setMindmapData] = useLocalStorage<MindmapNode[] | null>('zad_mindmapData', null)
  const [selectedAnswers, setSelectedAnswers] = useLocalStorage<Record<number, number>>('zad_selectedAnswers', {})

  // Tree data doesn't need to be in localStorage, it fetches on mount
  const [treeData, setTreeData] = useState<TreeNode[]>([])
  const [treeLoading, setTreeLoading] = useState(true)

  const clearStudySession = () => {
    setActiveTab('chat')
    setMessages([])
    setChatHistory([])
    setCurrentChunkId(null)
    setActiveSessionId(null)
    setChunkTitle('اختر درساً من الفهرس...')
    setHeaderSubtitle('يرجى اختيار درس للبدء')
    setChunkText('يرجى اختيار درس من الفهرس الجانبي لعرض النص الأساسي والبدء في التفاعل مع زاد الذكي.')
    setChunkMeta(null)
    setQuizQuestions(null)
    setQuizFlowState(defaultQuizFlowState(null))
    setMindmapData(null)
    setSelectedAnswers({})
  }

  const value = {
    activeTab, setActiveTab,
    messages, setMessages,
    chatHistory, setChatHistory,
    currentChunkId, setCurrentChunkId,
    activeSessionId, setActiveSessionId,
    chunkTitle, setChunkTitle,
    headerSubtitle, setHeaderSubtitle,
    chunkText, setChunkText,
    chunkMeta, setChunkMeta,
    quizQuestions, setQuizQuestions,
    quizFlowState, setQuizFlowState,
    mindmapData, setMindmapData,
    selectedAnswers, setSelectedAnswers,
    treeData, setTreeData,
    treeLoading, setTreeLoading,
    clearStudySession
  }

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>
}

export function useStudyContext() {
  const context = useContext(StudyContext)
  if (context === undefined) {
    throw new Error('useStudyContext must be used within a StudyProvider')
  }
  return context
}

export const useStudy = useStudyContext

