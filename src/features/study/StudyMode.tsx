import { useState, useRef, useEffect, useMemo, useDeferredValue, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import bgDark from '@/assets/images/image.webp'
import bgLight from '@/assets/images/bg-islamic-light.webp'
import whiteLogo from '@/assets/images/WhiteLogo.png'
import darkLogo from '@/assets/images/ZadDarkLogo.png'
import IslamicPattern from '../knowledge/components/IslamicPattern'
import {
  ArrowLeft, ArrowRight, Menu, BookOpen, X,
  AlertCircle, XCircle, Sun, Moon,
  MessageCircle, Brain, ClipboardList,
  Maximize, Minimize, History, ChevronUp, ChevronDown, Image, LayoutGrid, Square, Sparkles,
  Folder, Timer
} from 'lucide-react'
import NotificationBell from '../../components/layout/NotificationBell'
import LibrarySidebar from '../knowledge/components/LibrarySidebar'
import {
  useStudyContext,
  type Question,
  type TreeNode
} from '../../contexts/StudyContext'
import { useTheme } from '../../contexts/ThemeContext'
import { studyApi, type StudySessionDto } from '../../api/studyApi'

import Navbar from '../../components/layout/Navbar'
import { StudyHero } from './components/StudyHero'
import { StudyWorkspaceSidebar } from './components/StudyWorkspaceSidebar'
import UserProfileModal from '../profile/UserProfileModal'
import bgDarkPurple from '@/assets/images/pc view main page background dark purple.png'
import bgDarkAmber from '@/assets/images/pc view main page background dark agee.webp'
import bgDarkTeal from '@/assets/images/pc view main page background dark teal.webp'
import bgDarkBlue from '@/assets/images/pc view main page background dark blue.webp'
import libraryBgLight from '@/assets/images/library-background-light-desktop.jpg'

import { StudySidebar } from './components/StudySidebar'
import { StudyDocument } from './components/StudyDocument'
import { StudyChatPanel } from './chat'
import { StudyMindmapPanel } from './mindmap'
import { StudyQuizPanel } from './quiz'
import { StudyHistoryModal } from './components/StudyHistoryModal'
import { PanelErrorBoundary } from '@/components/common/PanelErrorBoundary'
import { PanelResizer } from './components/PanelResizer'
import { StudyTimerWidget } from './components/StudyTimerWidget'
import { studyPlanManager } from './utils/studyPlanManager'
import { STUDY_PROMPTS } from './utils/studyPrompts'
import { type QuizFlowState, defaultQuizFlowState } from './quiz/types'
import {
  idbGetBookTree,
  idbSetBookTree,
  idbGetCachedBookTitles,
  idbGetTurathBookTree,
  idbSetTurathBookTree,
  idbGetCachedTurathBookIds,
  idbDeleteTurathBookTree
} from '../../utils/indexedDbStorage'
import {
  fetchTurathBookIndexes,
  fetchTurathPage,
  fetchTurathChapterText,
  convertTurathHeadingsToTree,
  type ChapterSliceOptions
} from '../../api/turathApi'
import {
  parseTurathInfoField,
  calculateHijriCentury,
  resolveMadhhab,
  resolveDomain,
  findTurathBookInTree,
  buildTurathHierarchy
} from './utils/turathMetaHelper'

const TUTOR_ENGINE_URL = import.meta.env.VITE_TUTOR_ENGINE_URL || 'https://abourida-zad-tutor-engine-space.hf.space'
const API_BASE = TUTOR_ENGINE_URL
const TUTOR_API_KEY = import.meta.env.VITE_TUTOR_ENGINE_API_KEY || 'zad-super-secret-key'

export interface StudyModeProps {
  onExit: () => void
  onNavigateHome?: () => void
  onTryChat?: () => void
  onOpenKnowledge?: (tab?: any) => void
  onOpenVoiceChat?: () => void
  onOpenLessons?: () => void
  onOpenAdmin?: () => void
  onOpenTurathRag?: () => void
  onOpenEngineControl?: () => void
  onOpenDataIngestion?: () => void
  onOpenV2PipelineAdmin?: () => void
  onOpenAdminLibrary?: () => void
  onOpenYoutubeImporter?: () => void
  onOpenSystemObservability?: () => void
}

export default function StudyMode({
  onExit,
  onNavigateHome,
  onTryChat,
  onOpenKnowledge,
  onOpenVoiceChat,
  onOpenLessons,
  onOpenAdmin,
  onOpenTurathRag,
  onOpenEngineControl,
  onOpenDataIngestion,
  onOpenV2PipelineAdmin,
  onOpenAdminLibrary,
  onOpenYoutubeImporter,
  onOpenSystemObservability
}: StudyModeProps) {
  const { toggleTheme, isDark, accentColor } = useTheme()
  const [studyView, setStudyView] = useState<'hero' | 'workspace'>('hero')

  const getWorkspaceDarkBg = () => {
    switch (accentColor) {
      case 'amber': return bgDarkAmber
      case 'emerald': return bgDarkTeal
      case 'blue': return bgDarkBlue
      case 'purple':
      default: return bgDarkPurple
    }
  }

  const getWorkspacePatternColor = () => {
    switch (accentColor) {
      case 'amber': return isDark ? 'text-[#dfbf83]' : 'text-[#b88d46]'
      case 'emerald': return isDark ? 'text-teal-400' : 'text-teal-600'
      case 'blue': return isDark ? 'text-blue-400' : 'text-blue-600'
      case 'purple':
      default: return isDark ? 'text-purple-400' : 'text-purple-600'
    }
  }

  const getPanelToggleClass = (isOpen: boolean) => {
    if (isOpen) {
      if (isDark) {
        switch (accentColor) {
          case 'emerald':
            return 'bg-teal-500/25 border-teal-400/50 text-teal-100 shadow-lg shadow-teal-500/20 font-extrabold scale-[1.02] ring-1 ring-teal-400/30'
          case 'amber':
            return 'bg-[#dfbf83]/25 border-[#dfbf83]/50 text-[#f5ebd7] shadow-lg shadow-amber-500/20 font-extrabold scale-[1.02] ring-1 ring-[#dfbf83]/30'
          case 'blue':
            return 'bg-blue-500/25 border-blue-400/50 text-blue-100 shadow-lg shadow-blue-500/20 font-extrabold scale-[1.02] ring-1 ring-blue-400/30'
          case 'purple':
          default:
            return 'bg-purple-500/25 border-purple-400/50 text-purple-100 shadow-lg shadow-purple-500/20 font-extrabold scale-[1.02] ring-1 ring-purple-400/30'
        }
      } else {
        switch (accentColor) {
          case 'emerald':
            return 'bg-gradient-to-b from-white via-teal-50/70 to-teal-100/80 border-teal-300 text-teal-950 shadow-md font-extrabold scale-[1.02]'
          case 'amber':
            return 'bg-gradient-to-b from-white via-[#fbf8f0] to-[#f4ecdc] border-[#dfbf83] text-[#5e431a] shadow-md font-extrabold scale-[1.02]'
          case 'blue':
            return 'bg-gradient-to-b from-white via-blue-50/70 to-blue-100/80 border-blue-300 text-blue-950 shadow-md font-extrabold scale-[1.02]'
          case 'purple':
          default:
            return 'bg-gradient-to-b from-white via-purple-50/70 to-purple-100/80 border-purple-300 text-purple-950 shadow-md font-extrabold scale-[1.02]'
        }
      }
    }
    return isDark
      ? 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
      : 'bg-white/50 border border-slate-200/90 text-slate-600 hover:bg-white/80 hover:text-slate-900 hover:border-slate-300'
  }

  const getToolbarCircleBtnClass = () => {
    if (isDark) {
      switch (accentColor) {
        case 'emerald':
          return 'bg-teal-500/15 backdrop-blur-md border border-teal-500/30 hover:bg-teal-500/25 text-teal-100'
        case 'amber':
          return 'bg-[#dfbf83]/15 backdrop-blur-md border border-[#dfbf83]/30 hover:bg-[#dfbf83]/25 text-[#f5ebd7]'
        case 'blue':
          return 'bg-blue-500/15 backdrop-blur-md border border-blue-500/30 hover:bg-blue-500/25 text-blue-100'
        case 'purple':
        default:
          return 'bg-purple-500/15 backdrop-blur-md border border-purple-500/30 hover:bg-purple-500/25 text-purple-100'
      }
    } else {
      switch (accentColor) {
        case 'emerald':
          return 'bg-white border border-teal-200 hover:bg-teal-50 text-teal-700 shadow-md'
        case 'amber':
          return 'bg-white border border-[#dfbf83]/60 hover:bg-[#fbf8f0] text-[#78350f] shadow-md'
        case 'blue':
          return 'bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 shadow-md'
        case 'purple':
        default:
          return 'bg-white border border-purple-200 hover:bg-purple-50 text-purple-700 shadow-md'
      }
    }
  }

  const getMobileToggleClass = (isOpen: boolean) => {
    if (isOpen) {
      switch (accentColor) {
        case 'emerald':
          return 'bg-teal-600 text-white shadow-md shadow-teal-900/40 ring-1 ring-teal-400'
        case 'amber':
          return 'bg-[#b88d46] text-white shadow-md shadow-amber-900/40 ring-1 ring-[#dfbf83]'
        case 'blue':
          return 'bg-blue-600 text-white shadow-md shadow-blue-900/40 ring-1 ring-blue-400'
        case 'purple':
        default:
          return 'bg-purple-600 text-white shadow-md shadow-purple-900/40 ring-1 ring-purple-400'
      }
    }
    return isDark
      ? 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
      : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
  }

  // Library Provider Engine: 'mongo' (198 books classic) vs 'turath' (8,589 books global)
  const [librarySource, setLibrarySource] = useState<'mongo' | 'turath'>(() => {
    return (localStorage.getItem('zad_study_library_source') as 'mongo' | 'turath') || 'mongo'
  })

  // Background Type (Image vs Pattern vs Solid)
  const [bgType, setBgType] = useState<'image' | 'pattern' | 'solid'>(() => {
    return (localStorage.getItem('zad_study_bg_type') as 'image' | 'pattern' | 'solid') || 'pattern'
  })

  const toggleBgType = useCallback(() => {
    setBgType((prev) => {
      const next = prev === 'image' ? 'pattern' : prev === 'pattern' ? 'solid' : 'image'
      localStorage.setItem('zad_study_bg_type', next)
      return next
    })
  }, [])

  const {
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
  } = useStudyContext()

  const [input, setInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const deferredSearchQuery = useDeferredValue(searchQuery)
  const [loading, setLoading] = useState(false) // Chat loading
  const [isChunkLoading, setIsChunkLoading] = useState(false) // Document chunk loading
  const [mindmapLoading, setMindmapLoading] = useState(false)
  const [quizLoading, setQuizLoading] = useState(false)
  const [activeQuizId, setActiveQuizId] = useState<number | null>(null)

  // Resizable & Toggleable 5 Independent Panels
  // Default: Index, Document Reader, and Smart Tutor Chat are ALL open initially
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(380)

  const [isDocumentOpen, setIsDocumentOpen] = useState(true)
  const [documentWidth, setDocumentWidth] = useState(900)

  const [isChatOpen, setIsChatOpen] = useState(true)
  const [chatWidth, setChatWidth] = useState<number>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('zad_study_chat_width') : null
    return saved ? Math.max(350, Math.min(Number(saved), 1400)) : 700
  })

  const [isMindmapOpen, setIsMindmapOpen] = useState(false)
  const [mindmapWidth, setMindmapWidth] = useState(750)

  const [isQuizOpen, setIsQuizOpen] = useState(false)
  const [quizWidth, setQuizWidth] = useState(500)

  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth < 768)

  const [focusTarget, setFocusTarget] = useState<{ panel: string; id: number } | null>(null)

  const focusPanel = useCallback((panelKey: string) => {
    setFocusTarget({ panel: panelKey, id: Date.now() })
  }, [])

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const handleOpenStudyPanel = (e: any) => {
      const panel = e.detail?.panel
      if (panel === 'hero') {
        setStudyView('hero')
        return
      }
      setStudyView('workspace')
      if (panel === 'index' || panel === 'sidebar') {
        setIsSidebarOpen(true)
        if (isMobile) {
          setIsDocumentOpen(false)
          setIsChatOpen(false)
          setIsMindmapOpen(false)
          setIsQuizOpen(false)
        }
        focusPanel('sidebar')
      } else if (panel === 'document') {
        setIsDocumentOpen(true)
        if (isMobile) {
          setIsSidebarOpen(false)
          setIsChatOpen(false)
          setIsMindmapOpen(false)
          setIsQuizOpen(false)
        }
        focusPanel('document')
      } else if (panel === 'chat') {
        setIsChatOpen(true)
        if (isMobile) {
          setIsSidebarOpen(false)
          setIsDocumentOpen(false)
          setIsMindmapOpen(false)
          setIsQuizOpen(false)
        }
        focusPanel('chat')
      } else if (panel === 'mindmap') {
        setIsMindmapOpen(true)
        if (isMobile) {
          setIsSidebarOpen(false)
          setIsDocumentOpen(false)
          setIsChatOpen(false)
          setIsQuizOpen(false)
        }
        focusPanel('mindmap')
      } else if (panel === 'quiz') {
        setIsQuizOpen(true)
        if (isMobile) {
          setIsSidebarOpen(false)
          setIsDocumentOpen(false)
          setIsChatOpen(false)
          setIsMindmapOpen(false)
        }
        focusPanel('quiz')
      } else if (panel === 'workspace') {
        if (isMobile) {
          setIsDocumentOpen(true)
          setIsSidebarOpen(false)
          setIsChatOpen(false)
          setIsMindmapOpen(false)
          setIsQuizOpen(false)
          focusPanel('document')
        } else {
          setIsDocumentOpen(true)
          setIsChatOpen(true)
          setIsSidebarOpen(true)
          focusPanel('document')
        }
      }
    }

    window.addEventListener('open_study_panel', handleOpenStudyPanel)
    return () => window.removeEventListener('open_study_panel', handleOpenStudyPanel)
  }, [isMobile, focusPanel])

  const [confirmClose, setConfirmClose] = useState(false)
  const [pendingChunkSwitch, setPendingChunkSwitch] = useState<{ chunkId: string; title: string; fullPath: string; node?: TreeNode } | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [isTimerNavbarExpanded, setIsTimerNavbarExpanded] = useState(false)
  const [isPlatformSidebarOpen, setIsPlatformSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isTimerNavbarExpanded) return
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('#study-mobile-timer-container') && !target.closest('#study-mobile-timer-btn')) {
        setIsTimerNavbarExpanded(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('touchstart', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('touchstart', handleOutsideClick)
    }
  }, [isTimerNavbarExpanded])

  const handleNavigateGlobal = (view: any) => {
    setIsPlatformSidebarOpen(false)
    if (view === 'home') (onNavigateHome || onExit)()
    else if (view === 'chat') onTryChat?.()
    else if (view === 'knowledge') onOpenKnowledge?.()
    else if (view === 'study') setStudyView('hero')
    else if (view === 'lessons') onOpenLessons?.()
    else if (view === 'voice') onOpenVoiceChat?.()
    else if (view === 'admin') onOpenAdmin?.()
    else if (view === 'turath-rag') onOpenTurathRag?.()
    else if (view === 'engine-control') onOpenEngineControl?.()
    else if (view === 'data-ingestion') onOpenDataIngestion?.()
    else if (view === 'v2-pipeline-admin') onOpenV2PipelineAdmin?.()
    else if (view === 'admin-library') onOpenAdminLibrary?.()
    else if (view === 'youtube-importer') onOpenYoutubeImporter?.()
    else if (view === 'system-observability') onOpenSystemObservability?.()
  }

  const getZadWordClass = () => {
    switch (accentColor) {
      case 'amber':
        return isDark ? 'text-[#e8cda2]' : 'text-[#855e24]'
      case 'emerald':
        return isDark ? 'text-teal-300' : 'text-teal-800'
      case 'blue':
        return isDark ? 'text-blue-300' : 'text-blue-800'
      case 'purple':
      default:
        return isDark ? 'text-purple-300' : 'text-purple-900'
    }
  }

  const getNavCircleBtnStyle = () => {
    if (isDark) {
      switch (accentColor) {
        case 'amber':
          return 'bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-[#dfbf83]/50 text-slate-300 hover:text-[#eed8ad] shadow-xs'
        case 'emerald':
          return 'bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-teal-400/50 text-slate-300 hover:text-teal-200 shadow-xs'
        case 'blue':
          return 'bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-blue-400/50 text-slate-300 hover:text-blue-200 shadow-xs'
        case 'purple':
        default:
          return 'bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-purple-400/50 text-slate-300 hover:text-purple-200 shadow-xs'
      }
    }
    switch (accentColor) {
      case 'amber':
        return 'bg-white/80 hover:bg-white border border-[#ebd9b5] hover:border-[#dfbf83] text-[#8a652a] shadow-xs'
      case 'emerald':
        return 'bg-white/80 hover:bg-white border border-teal-200 hover:border-teal-300 text-teal-800 shadow-xs'
      case 'blue':
        return 'bg-white/80 hover:bg-white border border-blue-200 hover:border-blue-300 text-blue-800 shadow-xs'
      case 'purple':
      default:
        return 'bg-white/80 hover:bg-white border border-purple-200 hover:border-purple-300 text-purple-800 shadow-xs'
    }
  }

  const [isWorkspaceSidebarExpanded, setIsWorkspaceSidebarExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('zad_study_workspace_sidebar_expanded')
      return saved !== null ? saved === 'true' : true
    } catch (e) {
      return true
    }
  })

  const handleToggleWorkspaceSidebar = useCallback(() => {
    setIsWorkspaceSidebarExpanded(prev => {
      const next = !prev
      try {
        localStorage.setItem('zad_study_workspace_sidebar_expanded', String(next))
      } catch (e) {}
      return next
    })
  }, [])

  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('zad_study_header_collapsed') === 'true'
  })

  const toggleHeaderCollapse = useCallback(() => {
    setIsHeaderCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('zad_study_header_collapsed', String(next))
      return next
    })
  }, [])

  const handleSelectSavedSession = async (sess: StudySessionDto) => {
    setStudyView('workspace')
    if (sess.chunkId && sess.chunkId.startsWith('turath_')) {
      await executeChunkSelect(
        sess.chunkId,
        sess.sectionTitle || sess.bookTitle,
        sess.domain || sess.bookTitle
      )
      return
    }

    setCurrentChunkId(sess.chunkId)
    setChunkTitle(sess.bookTitle || 'جلسة دراسية')
    setHeaderSubtitle(sess.sectionTitle || sess.domain || '')
    setActiveSessionId(sess.id)
    setPendingPlanSteps([])
    setChunkText('جاري تحميل بيانات الجلسة والنص الاصلي...')
    setLoading(true)

    if (isMobile) {
      setIsDocumentOpen(true)
      setIsChatOpen(false)
      setIsSidebarOpen(false)
      setIsMindmapOpen(false)
      setIsQuizOpen(false)
      focusPanel('document')
    } else {
      setIsDocumentOpen(true)
      setIsChatOpen(true)
    }

    try {
      // 1. Fetch chunk document text
      let data: any = null
      try {
        data = await studyApi.getChunkById(sess.chunkId)
      } catch {
        const res = await fetch(`${API_BASE}/api/v1/library/chunks/${sess.chunkId}`)
        if (res.ok) data = await res.json()
      }

      if (data) {
        setChunkText(data.text || data.content || 'تم تحميل الدرس بنجاح.')
        if (data.metadata) setChunkMeta(data.metadata)
      }

      // 2. Fetch session chat messages from backend database
      const savedMessages = await studyApi.getSessionMessages(sess.id).catch(() => [])
      if (savedMessages && savedMessages.length > 0) {
        const uiMsgs = savedMessages.map(m => {
          let cleanText = m.content;

          if (m.role === 'user') {
            if (cleanText.includes('ملاحظات حتمية للعمل') || cleanText.includes('أنا كطالب أود البدء في دراسة درس')) {
              cleanText = 'أود الحصول على خطة تفاعلية لمذاكرة هذا الدرس.';
            } else if (cleanText.includes('أنا كطالب أود الحصول على تلخيص مركز وشامل لدرس')) {
              cleanText = 'أود الحصول على تلخيص مركز ومُتوازن لهذا الدرس (لا إفراط ولا تفريط).';
            } else if (cleanText.includes('مرحباً يا زاد، أود فتح باب النقاش المباشر والأسئلة حول درس')) {
              cleanText = 'أود بدء التحاور المباشر مع زاد وطرح أسئلتي في هذا الدرس.';
            }
          } else {
            const { cleanText: parsed } = studyPlanManager.parseLLMResponse(cleanText, sess.id, true);
            cleanText = parsed;
          }

          return {
            id: m.id.toString(),
            role: (m.role === 'user' ? 'user' : 'tutor') as 'user' | 'tutor',
            text: cleanText
          };
        })
        setMessages(uiMsgs)

        const historyFormatted = savedMessages.map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content
        }))
        setChatHistory(historyFormatted)
      } else {
        setMessages([])
        setChatHistory([])
      }
    } catch (err) {
      console.error('فشل في استرجاع الجلسة المحفوظة:', err)
    } finally {
      setLoading(false)
    }
  }

  const chatEndRef = useRef<HTMLDivElement>(null)
  const workspaceRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => { })
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => { })
      }
    }
  }

  const openPanelNames = useMemo(() => {
    const list: string[] = []
    if (isSidebarOpen) list.push('sidebar')
    if (isDocumentOpen) list.push('document')
    if (isChatOpen) list.push('chat')
    if (isMindmapOpen) list.push('mindmap')
    if (isQuizOpen) list.push('quiz')
    return list
  }, [isSidebarOpen, isDocumentOpen, isChatOpen, isMindmapOpen, isQuizOpen])

  const lastOpenPanel = openPanelNames[openPanelNames.length - 1] || null

  const [isResizing, setIsResizing] = useState(false)

  const startResizingPanel = (
    panelKey: 'sidebar' | 'document' | 'chat' | 'mindmap' | 'quiz',
    e: React.MouseEvent
  ) => {
    e.preventDefault()
    setIsResizing(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const startX = e.clientX
    let startWidth = 300
    if (panelKey === 'sidebar') startWidth = sidebarWidth
    else if (panelKey === 'document') startWidth = documentWidth
    else if (panelKey === 'chat') startWidth = chatWidth
    else if (panelKey === 'mindmap') startWidth = mindmapWidth
    else if (panelKey === 'quiz') startWidth = quizWidth

    const handleMouseMove = (moveEv: MouseEvent) => {
      // RTL delta calculation: dragging mouse left (smaller clientX) increases width
      const deltaX = startX - moveEv.clientX
      const newWidth = startWidth + deltaX

      if (panelKey === 'sidebar') setSidebarWidth(Math.max(340, Math.min(newWidth, 800)))
      else if (panelKey === 'document') setDocumentWidth(Math.max(280, Math.min(newWidth, 1200)))
      else if (panelKey === 'chat') {
        const clamped = Math.max(350, Math.min(newWidth, 1400))
        setChatWidth(clamped)
        try {
          localStorage.setItem('zad_study_chat_width', String(clamped))
        } catch { }
      }
      else if (panelKey === 'mindmap') setMindmapWidth(Math.max(320, Math.min(newWidth, 1400)))
      else if (panelKey === 'quiz') setQuizWidth(Math.max(280, Math.min(newWidth, 1200)))
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSelectMobileTab = (tab: 'sidebar' | 'document' | 'chat' | 'mindmap' | 'quiz') => {
    setIsSidebarOpen(tab === 'sidebar')
    setIsDocumentOpen(tab === 'document')
    setIsChatOpen(tab === 'chat')
    setIsMindmapOpen(tab === 'mindmap')
    setIsQuizOpen(tab === 'quiz')
    focusPanel(tab)
  }

  const activeMobileTab = useMemo(() => {
    // If focusTarget points to a panel that is currently open, prioritize it
    if (focusTarget?.panel) {
      const p = focusTarget.panel
      const isOpen =
        p === 'sidebar' ? isSidebarOpen :
        p === 'document' ? isDocumentOpen :
        p === 'chat' ? isChatOpen :
        p === 'mindmap' ? isMindmapOpen :
        p === 'quiz' ? isQuizOpen : false
      if (isOpen) return p
    }
    // Otherwise fallback to whichever panel is actually open
    if (isSidebarOpen) return 'sidebar'
    if (isDocumentOpen) return 'document'
    if (isChatOpen) return 'chat'
    if (isMindmapOpen) return 'mindmap'
    if (isQuizOpen) return 'quiz'
    return 'document'
  }, [focusTarget, isSidebarOpen, isDocumentOpen, isChatOpen, isMindmapOpen, isQuizOpen])

  const getBottomNavTabClass = (isActive: boolean) => {
    const base = 'flex-1 h-full flex flex-col items-center justify-center py-1.5 px-0.5 gap-1 transition-colors duration-200 relative cursor-pointer min-w-0 select-none border-0 outline-none overflow-hidden'
    if (!isActive) {
      return `${base} text-muted-foreground hover:text-foreground opacity-70 hover:bg-black/[0.03] dark:hover:bg-white/[0.03]`
    }
    switch (accentColor) {
      case 'amber':
        return `${base} text-[#8e682d] dark:text-[#dfbf83] font-bold bg-[#c59b58]/18 dark:bg-[#c59b58]/25`
      case 'emerald':
        return `${base} text-teal-700 dark:text-teal-300 font-bold bg-teal-500/18 dark:bg-teal-500/25`
      case 'blue':
        return `${base} text-blue-600 dark:text-blue-300 font-bold bg-blue-500/18 dark:bg-blue-500/25`
      case 'purple':
      default:
        return `${base} text-purple-700 dark:text-purple-300 font-bold bg-purple-500/18 dark:bg-purple-500/25`
    }
  }

  // Smoothly focus / scroll workspace to target panel when opened or selected
  useEffect(() => {
    if (!focusTarget) return
    const timer = setTimeout(() => {
      const el = document.getElementById(`panel-${focusTarget.panel}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }, 120)
    return () => clearTimeout(timer)
  }, [focusTarget])

  const updateBookInTree = (nodes: TreeNode[], bookTitle: string, chapters: TreeNode[], bookId?: number): TreeNode[] => {
    return nodes.map(node => {
      if (node.is_book && ((bookId && node.turath_id === bookId) || node.title === bookTitle)) {
        return {
          ...node,
          children: chapters,
          is_loaded: true
        }
      }
      if (node.children && node.children.length > 0) {
        return {
          ...node,
          children: updateBookInTree(node.children, bookTitle, chapters, bookId)
        }
      }
      return node
    })
  }

  const fetchTree = async () => {
    try {
      setTreeLoading(true)
      const currentSource = (localStorage.getItem('zad_study_library_source') as 'mongo' | 'turath') || librarySource || 'mongo'

      // ==============================================================
      // 1. TURATH GLOBAL ENGINE PIPELINE (8,589 books across 40 domains)
      // ==============================================================
      if (currentSource === 'turath') {
        let turathCatalog: TreeNode[] | null = null
        try {
          const res = await fetch('/data/turath_catalog.json')
          if (res.ok) {
            turathCatalog = await res.json()
          }
        } catch (e) {
          console.warn('Failed to load /data/turath_catalog.json:', e)
        }

        if (turathCatalog && turathCatalog.length > 0) {
          // Apply Admin Turath Visibility Filtering if configured
          try {
            const rawConfig = localStorage.getItem('zad_turath_visibility_config')
            if (rawConfig) {
              const cfg = JSON.parse(rawConfig)
              if (cfg.mode === 'custom' && Array.isArray(cfg.allowedBookIds)) {
                const allowedSet = new Set(cfg.allowedBookIds.map(String))
                turathCatalog = turathCatalog
                  .map(cat => ({
                    ...cat,
                    children: (cat.children || []).filter(b => allowedSet.has(String(b.turath_id)))
                  }))
                  .filter(cat => cat.children && cat.children.length > 0)
              } else if (cfg.mode === 'all' && Array.isArray(cfg.hiddenBookIds) && cfg.hiddenBookIds.length > 0) {
                const hiddenSet = new Set(cfg.hiddenBookIds.map(String))
                turathCatalog = turathCatalog
                  .map(cat => ({
                    ...cat,
                    children: (cat.children || []).filter(b => !hiddenSet.has(String(b.turath_id)))
                  }))
                  .filter(cat => cat.children && cat.children.length > 0)
              }
            }
          } catch (cfgErr) {
            console.warn('Turath visibility filtering notice:', cfgErr)
          }

          // Hydrate only books that were previously clicked & cached in IndexedDB
          try {
            const cachedIds = await idbGetCachedTurathBookIds()
            if (cachedIds.length > 0) {
              const cachedSet = new Set(cachedIds.map(String))
              for (const cat of turathCatalog) {
                for (const book of cat.children || []) {
                  const bId = String(book.turath_id || '')
                  if (bId && cachedSet.has(bId)) {
                    const cachedBook = await idbGetTurathBookTree(bId)
                    const isFallback = cachedBook?.children?.length === 1 && cachedBook.children[0].title === 'قراءة الكتاب (من البداية)'
                    const isOldFormat = Boolean(cachedBook?.children && cachedBook.children.length > 0 && (!cachedBook.children[0].toc_id || !cachedBook.children[0].chunk_id?.includes('_v2')))
                    if (isFallback || isOldFormat) {
                      // Stale fallback or old format without TOC indices - delete it immediately so fresh headings load!
                      await idbDeleteTurathBookTree(bId)
                    } else if (cachedBook && cachedBook.children && cachedBook.children.length > 0) {
                      book.children = cachedBook.children
                      book.is_loaded = true
                    }
                  }
                }
              }
            }
          } catch (idbErr) {
            console.warn('Turath IndexedDB hydration notice:', idbErr)
          }

          setTreeData(turathCatalog)
        }
        return
      }

      // ==============================================================
      // 2. MONGO RAG CLASSIC PIPELINE (198 books - completely intact)
      // ==============================================================
      let catalog: TreeNode[] | null = null
      try {
        const res = await fetch('/data/catalog.json')
        if (res.ok) {
          catalog = await res.json()
        }
      } catch (e) {
        console.warn('Failed to load /data/catalog.json, falling back to API:', e)
      }

      // If local static catalog failed, fallback to API
      if (!catalog) {
        try {
          const res = await fetch(`${API_BASE}/api/v1/library/trees?catalog_only=true`)
          if (res.ok) {
            const data = await res.json()
            if (data.success && data.tree) catalog = data.tree
          }
        } catch (e) {
          console.warn('Failed to fetch catalog from API:', e)
        }
      }

      if (catalog && catalog.length > 0) {
        // Hydrate ONLY books previously clicked and cached in IndexedDB
        try {
          const cachedTitles = await idbGetCachedBookTitles()
          if (cachedTitles.length > 0) {
            const cachedSet = new Set(cachedTitles)
            for (const domain of catalog) {
              for (const sub of domain.children || []) {
                for (const book of sub.children || []) {
                  if (cachedSet.has(book.title)) {
                    const cachedBook = await idbGetBookTree(book.title)
                    if (cachedBook && cachedBook.children) {
                      book.children = cachedBook.children
                      book.is_loaded = true
                    }
                  }
                }
              }
            }
          }
        } catch (idbErr) {
          console.warn('IndexedDB hydration notice:', idbErr)
        }

        setTreeData(catalog)
      }
    } catch (error) {
      console.error('Error in fetchTree pipeline:', error)
    } finally {
      setTreeLoading(false)
    }
  }

  const handleLoadBookTree = useCallback(async (bookNode: TreeNode) => {
    const isTurath = bookNode.is_turath || !!bookNode.turath_id || librarySource === 'turath'
    const turathId = bookNode.turath_id

    // PATH A: TURATH ON-DEMAND BOOK TOC LOADING
    if (isTurath && turathId) {
      // 1. Check IndexedDB first (0ms)
      try {
        const cached = await idbGetTurathBookTree(turathId)
        if (cached && cached.children && cached.children.length > 0) {
          const isFallback = cached.children.length === 1 && cached.children[0].title === 'قراءة الكتاب (من البداية)'
          const isOldFormat = Boolean(!cached.children[0].toc_id || !cached.children[0].chunk_id?.includes('_v5'))
          if (!isFallback && !isOldFormat) {
            setTreeData(prev => updateBookInTree(prev, bookNode.title, cached.children, turathId))
            return cached.children
          } else {
            // Delete stale fallback or old format without TOC indices so fresh headings can load
            await idbDeleteTurathBookTree(turathId)
          }
        }
      } catch (e) {
        console.warn('IndexedDB Turath read error:', e)
      }

      // 2. Fetch live from Turath indexes API (through local proxy)
      try {
        const data = await fetchTurathBookIndexes(turathId)
        const headings = data?.indexes?.headings || []

        if (headings && headings.length > 0) {
          const chapters = convertTurathHeadingsToTree(headings, turathId, bookNode.title)
          // 3. Cache in IndexedDB with authentic headings, indexes, AND metadata!
          await idbSetTurathBookTree(turathId, { children: chapters, meta: data?.meta, indexes: data?.indexes })
          // 4. Update state in memory tree
          setTreeData(prev => updateBookInTree(prev, bookNode.title, chapters, turathId))
          return chapters
        } else {
          // If book has no headings in Turath metadata, show reader node without permanently caching it
          const chapters = convertTurathHeadingsToTree([], turathId, bookNode.title)
          setTreeData(prev => updateBookInTree(prev, bookNode.title, chapters, turathId))
          return chapters
        }
      } catch (err) {
        console.error(`Failed to load Turath book ${turathId}:`, err)
      }
      return undefined
    }

    // PATH B: MONGO RAG BOOK TOC LOADING (Completely untouched)
    const bookTitle = bookNode.title

    // 1. Check IndexedDB first (0ms)
    try {
      const cached = await idbGetBookTree(bookTitle)
      if (cached && cached.children && cached.children.length > 0) {
        setTreeData(prev => updateBookInTree(prev, bookTitle, cached.children))
        return cached.children
      }
    } catch (e) {
      console.warn('IndexedDB read error:', e)
    }

    // 2. Load from /data/books/${filename}
    let bookData: any = null
    const filename = bookNode.book_file || (bookTitle.replace(/ /g, '_').replace(/[/\\\\]/g, '_') + '.json')

    try {
      const res = await fetch(`/data/books/${encodeURIComponent(filename)}`)
      if (res.ok) {
        bookData = await res.json()
      }
    } catch (err) {
      console.warn('Fetch from /data/books/ failed, trying API fallback:', err)
    }

    // Fallback to API if static file not found
    if (!bookData) {
      try {
        const res = await fetch(`${API_BASE}/api/v1/library/trees?book_names=${encodeURIComponent(bookTitle)}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.tree) {
            const findBook = (nodes: any[]): any => {
              for (const n of nodes) {
                if (n.title === bookTitle && n.children) return n
                if (n.children) {
                  const found = findBook(n.children)
                  if (found) return found
                }
              }
              return null
            }
            bookData = findBook(data.tree)
          }
        }
      } catch (err) {
        console.error('Failed to fetch book from API:', err)
      }
    }

    if (bookData && bookData.children) {
      // 3. Save to IndexedDB ONLY for this book that user opened!
      try {
        await idbSetBookTree(bookTitle, bookData)
      } catch (e) {
        console.warn('Failed saving book to IndexedDB:', e)
      }

      // 4. Update state in memory tree
      setTreeData(prev => updateBookInTree(prev, bookTitle, bookData.children))
      return bookData.children
    }
    return undefined
  }, [librarySource])

  useEffect(() => {
    fetchTree()

    const handleTreeUpdated = () => {
      fetchTree()
    }
    const handleSourceChanged = (e: any) => {
      const nextSource = e.detail?.source || localStorage.getItem('zad_study_library_source') || 'mongo'
      setLibrarySource(nextSource)
    }
    const handleCustomChunkSelect = (e: any) => {
      if (e.detail?.chunkId) {
        executeChunkSelect(e.detail.chunkId, e.detail.title, e.detail.fullPath, e.detail.node)
      }
    }

    window.addEventListener('zad_library_updated', handleTreeUpdated)
    window.addEventListener('zad_library_source_changed', handleSourceChanged)
    window.addEventListener('zad_select_chunk', handleCustomChunkSelect)
    return () => {
      window.removeEventListener('zad_library_updated', handleTreeUpdated)
      window.removeEventListener('zad_library_source_changed', handleSourceChanged)
      window.removeEventListener('zad_select_chunk', handleCustomChunkSelect)
    }
  }, [librarySource])

  const executeChunkSelect = async (chunkId: string, title: string, fullPath: string, selectedNode?: TreeNode) => {
    setStudyView('workspace')
    setIsChunkLoading(true)
    setCurrentChunkId(chunkId)
    setActiveSessionId(null)
    setPendingPlanSteps([])
    studyPlanManager.resetPlanProgress(chunkId)
    setChunkTitle(title)
    setHeaderSubtitle(fullPath)
    setChunkText('جاري تحميل النص من الكتاب...')
    setChunkMeta(null)

    // Reset interactive states & Ensure Document + Chat panels are open
    setMessages([])
    setChatHistory([])
    setMindmapData(null)
    setQuizQuestions(null)
    setSelectedAnswers({})
    setQuizFlowState(defaultQuizFlowState(null))
    setMindmapLoading(false)
    setQuizLoading(false)

    if (isMobile) {
      setIsDocumentOpen(true)
      setIsChatOpen(false)
      setIsSidebarOpen(false)
      setIsMindmapOpen(false)
      setIsQuizOpen(false)
      focusPanel('document')
    } else {
      setIsDocumentOpen(true)
      setIsChatOpen(true)
    }

    // 1. TURATH FULL CHAPTER RETRIEVAL (Pulls entire section / chapter across its pages)
    if (chunkId.startsWith('turath_')) {
      try {
        const parts = chunkId.split('_')
        const turathId = parseInt(parts[1], 10)
        const startPage = parseInt(parts[3], 10) || 1
        let endPage = parts[5] ? parseInt(parts[5], 10) : startPage
        let startTocIndex = parts[7] ? parseInt(parts[7], 10) : undefined
        let endTocIndex = parts[9] ? parseInt(parts[9], 10) : undefined

        // Resolve chapter boundary options directly from selected node or chunk ID
        let resolvedStartTocId = selectedNode?.toc_id || (startTocIndex ? `toc-${startTocIndex}` : undefined)
        let resolvedEndTocId = selectedNode?.next_toc_id || (endTocIndex && endTocIndex > 0 ? `toc-${endTocIndex}` : undefined)
        let nextChapterTitle = selectedNode?.next_title

        // CRITICAL: If this node is a parent folder that has sub-chapters (children):
        // Its boundary MUST stop at its very first child! It never encompasses all its children or the next main book!
        if (selectedNode?.children && selectedNode.children.length > 0) {
          const firstChild = selectedNode.children[0]
          if (firstChild) {
            endPage = Math.max(startPage, firstChild.page || startPage)
            if (firstChild.toc_id) resolvedEndTocId = firstChild.toc_id
            if (firstChild.title) nextChapterTitle = firstChild.title
          }
        }

        // Fallback: If not passed as selectedNode, locate in cached chapters
        if (!resolvedStartTocId || !resolvedEndTocId) {
          const { bookNode } = findTurathBookInTree(treeData, turathId)
          let bookChapters = bookNode?.children
          if (!bookChapters || bookChapters.length === 0) {
            try {
              const cachedBookData = await idbGetTurathBookTree(turathId)
              if (cachedBookData?.children && cachedBookData.children.length > 0) {
                bookChapters = cachedBookData.children
              }
            } catch { }
          }
          if (bookChapters) {
            const flattenNodes = (nodes: TreeNode[]): TreeNode[] => {
              const list: TreeNode[] = []
              for (const n of nodes) {
                list.push(n)
                if (n.children && n.children.length > 0) {
                  list.push(...flattenNodes(n.children))
                }
              }
              return list
            }
            const flat = flattenNodes(bookChapters)
            const matched = flat.find(n => n.chunk_id === chunkId || (n.title === title && n.page === startPage))
            if (matched) {
              if (!resolvedStartTocId) resolvedStartTocId = matched.toc_id
              if (!resolvedEndTocId) resolvedEndTocId = matched.next_toc_id
              if (!nextChapterTitle) nextChapterTitle = matched.next_title
            }
          }
        }

        const sliceOptions: ChapterSliceOptions = {
          startTocId: resolvedStartTocId,
          endTocId: resolvedEndTocId,
          chapterTitle: title,
          nextChapterTitle: nextChapterTitle
        }

        // Pull the lesson content with exact boundary slicing
        const turathData = await fetchTurathChapterText(turathId, startPage, endPage, sliceOptions)
        if (turathData) {
          const rawText = turathData.text || ''
          const cleanRawText = rawText
            .replace(/<!--[\s\S]*?-->/g, '')
            .replace(/<[^>]+>/g, '')
            .replace(/[^\u0621-\u064A\u0671-\u06D3\w]/g, '')
            .trim()

          // If a parent folder has no body text between its heading and the next heading
          const normalizedTitle = title.replace(/[^\u0621-\u064A\u0671-\u06D3\w]/g, '').trim()
          const isOnlyHeading = cleanRawText.length < 15 || cleanRawText === normalizedTitle || (cleanRawText.startsWith(normalizedTitle) && cleanRawText.length - normalizedTitle.length < 15)

          if (isOnlyHeading && selectedNode?.children && selectedNode.children.length > 0) {
            const firstChild = selectedNode.children[0]
            const nextHeadingName = firstChild?.title || nextChapterTitle || 'الدرس الأول'
            const noticeHtml = `
              <div class="turath-empty-parent-notice" style="margin: 3em auto; max-width: 580px; padding: 2.2em 1.8em; border-radius: 1.5rem; text-align: center; background: ${isDark ? 'rgba(56, 189, 248, 0.05)' : 'rgba(2, 132, 199, 0.04)'}; border: 1.5px dashed ${isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(2, 132, 199, 0.25)'}; backdrop-filter: blur(10px);">
                <div style="display: inline-flex; align-items: center; justify-content: center; width: 54px; height: 54px; border-radius: 9999px; margin-bottom: 1.2em; background: ${isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.1)'}; color: ${isDark ? '#38bdf8' : '#0284c7'};">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>
                </div>
                <h3 style="font-size: 1.25em; font-weight: 700; margin-bottom: 0.6em; color: ${isDark ? '#ffffff' : '#0f172a'}; font-family: 'Amiri', serif;">${title}</h3>
                <p style="font-size: 0.95em; line-height: 1.8; color: ${isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(15, 23, 42, 0.7)'}; margin-bottom: 1.6em;">
                  هذا العنوان عبارة عن باب وتصنيف رئيسي تبدأ موضوعاته التفصيلية مباشرة من:
                  <br />
                  <strong style="color: ${isDark ? '#38bdf8' : '#0284c7'}; font-size: 1.05em;">«${nextHeadingName}»</strong>
                </p>
                ${firstChild?.chunk_id ? `
                  <button
                    type="button"
                    onclick="window.dispatchEvent(new CustomEvent('zad_select_chunk', { detail: { chunkId: '${firstChild.chunk_id}', title: '${firstChild.title.replace(/'/g, "\\'")}', fullPath: '${fullPath} ← ${firstChild.title.replace(/'/g, "\\'")}' } }))"
                    style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 22px; border-radius: 9999px; font-weight: 700; font-size: 0.92em; cursor: pointer; border: none; background: #0284c7; color: #ffffff; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35); transition: all 0.2s;"
                  >
                    <span>الانتقال إلى ${firstChild.title}</span>
                    <span style="font-size: 1.1em;">←</span>
                  </button>
                ` : ''}
              </div>
            `
            setChunkText(noticeHtml)
          } else {
            setChunkText(rawText || 'لا يوجد نص متوفر لهذا الفصل.')
          }

          // Resolve book metadata from tree and local cache
          const { bookNode, categoryTitle } = findTurathBookInTree(treeData, turathId)

          let bookIndexesMeta: any = null
          try {
            const cachedBook = await idbGetTurathBookTree(turathId)
            if (cachedBook?.meta) {
              bookIndexesMeta = cachedBook.meta
            } else {
              // Lazy-fetch book indexes meta if not in cache yet
              const liveIndexes = await fetchTurathBookIndexes(turathId)
              if (liveIndexes?.meta) {
                bookIndexesMeta = liveIndexes.meta
                if (cachedBook && cachedBook.children) {
                  await idbSetTurathBookTree(turathId, { ...cachedBook, meta: liveIndexes.meta })
                }
              }
            }
          } catch (e) {
            console.warn('Turath metadata resolution notice:', e)
          }

          const parsedInfo = parseTurathInfoField(bookIndexesMeta?.info)

          // 1. Book Title: Always authentic book title (e.g. 'عمدة الفقه' or 'حكم التقليد'), never lesson title
          const resolvedBookTitle =
            bookIndexesMeta?.name ||
            bookNode?.title ||
            (turathData.meta as any)?.book_name ||
            (fullPath.split('←')[1]?.trim()) ||
            'اسم الكتاب'

          // 2. Author and Death Date (e.g. 'ابن قدامة المقدسي' and '620هـ')
          const resolvedAuthor =
            parsedInfo.author ||
            bookNode?.author ||
            (turathData.meta as any)?.author_name ||
            'غير محدد'
          const resolvedAuthorDeath = parsedInfo.authorDeath || ''
          const resolvedCentury = parsedInfo.deathYear
            ? calculateHijriCentury(parsedInfo.deathYear)
            : ''

          // 3. Domain and Madhhab (e.g. 'فقه' and 'حنبلي')
          const resolvedDomain = resolveDomain(categoryTitle, resolvedBookTitle)
          const resolvedMadhhab = resolveMadhhab(
            categoryTitle,
            resolvedAuthor,
            resolvedBookTitle,
            parsedInfo.madhhabHint
          )

          // 4. Volume / Part and Total Parts (e.g. '1 / 1' or '1 / 2')
          const currentVol = (turathData.meta as any)?.vol || '1'
          const totalParts = parsedInfo.totalParts || 1

          // 5. Clean hierarchy without duplication (kitab: 'كتاب الطهارة', sections: ['باب أحكام المياه'])
          const resolvedHierarchy = buildTurathHierarchy(fullPath, resolvedBookTitle, title)

          // 6. Turath Source URL
          const sourceUrl = `https://app.turath.io/book/${turathId}?page=${startPage}`

          setChunkMeta({
            book_title: resolvedBookTitle,
            author: resolvedAuthor,
            author_death: resolvedAuthorDeath,
            domain: resolvedDomain,
            madhhab: resolvedMadhhab,
            hijri_century: resolvedCentury,
            part: currentVol,
            total_parts: totalParts,
            page_id: startPage,
            end_page: endPage,
            hierarchy: resolvedHierarchy,
            source_url: sourceUrl
          })

          // Start or resume session in Backend SQL database so it's recorded in Study History
          try {
            const session = await studyApi.startSession(
              chunkId,
              resolvedBookTitle,
              resolvedDomain || fullPath,
              title
            )
            if (session && session.id) {
              setActiveSessionId(session.id)

              // Load existing chat messages for this session if any
              const savedMessages = await studyApi.getSessionMessages(session.id).catch(() => [])
              if (savedMessages && savedMessages.length > 0) {
                const uiMsgs = savedMessages.map(m => {
                  let cleanText = m.content
                  if (m.role === 'user') {
                    if (cleanText.includes('ملاحظات حتمية للعمل') || cleanText.includes('أنا كطالب أود البدء في دراسة درس')) {
                      cleanText = 'أود الحصول على خطة تفاعلية لمذاكرة هذا الدرس.'
                    } else if (cleanText.includes('أنا كطالب أود الحصول على تلخيص مركز وشامل لدرس')) {
                      cleanText = 'أود الحصول على تلخيص مركز ومُتوازن لهذا الدرس (لا إفراط ولا تفريط).'
                    } else if (cleanText.includes('مرحباً يا زاد، أود فتح باب النقاش المباشر والأسئلة حول درس')) {
                      cleanText = 'أود بدء التحاور المباشر مع زاد وطرح أسئلتي في هذا الدرس.'
                    }
                  } else {
                    const { cleanText: parsed } = studyPlanManager.parseLLMResponse(cleanText, session.id, true)
                    cleanText = parsed
                  }
                  return {
                    id: m.id.toString(),
                    role: (m.role === 'user' ? 'user' : 'tutor') as 'user' | 'tutor',
                    text: cleanText
                  }
                })
                setMessages(uiMsgs)
                setChatHistory(savedMessages.map(m => ({ role: m.role, content: m.content })))
              }
            }
          } catch (err) {
            console.warn('Backend study session start for Turath failed:', err)
          }
        } else {
          setChunkText('تعذر تحميل الفصل من مكتبة تراث، يرجى التحقق من الاتصال بالإنترنت.')
        }
      } catch (err) {
        console.error('Error fetching Turath chapter:', err)
        setChunkText('حدث خطأ أثناء تحميل فصل الكتاب من تراث.')
      } finally {
        setIsChunkLoading(false)
        setLoading(false)
      }
      return
    }

    // 2. MONGO RAG CHUNK HANDLING (Completely untouched)
    try {
      // Start or resume session in Backend SQL database
      let currentSessionId: number | null = null
      try {
        const session = await studyApi.startSession(chunkId, title, fullPath, title)
        if (session && session.id) {
          currentSessionId = session.id
          setActiveSessionId(session.id)
        }
      } catch (err) {
        console.warn('Backend study session start failed, operating in offline/direct mode:', err)
      }

      // Fetch Chunk details
      let data: any = null
      try {
        data = await studyApi.getChunkById(chunkId)
      } catch {
        const res = await fetch(`${API_BASE}/api/v1/library/chunks/${chunkId}`)
        if (res.ok) data = await res.json()
      }

      if (data) {
        setChunkText(data.text || data.content || 'تم تحميل الدرس بنجاح، لكن لا يوجد نص متوفر.')
        if (data.metadata) setChunkMeta(data.metadata)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsChunkLoading(false)
      setLoading(false)
    }
  }

  const handleTurathPageChange = (direction: 'next' | 'prev') => {
    if (!currentChunkId || !currentChunkId.startsWith('turath_')) return
    const parts = currentChunkId.split('_')
    const turathId = parseInt(parts[1], 10)
    const currentPage = parseInt(parts[3], 10) || 1
    const currentEndPage = parts[5] ? parseInt(parts[5], 10) : currentPage
    const targetPage = direction === 'next' ? currentEndPage + 1 : Math.max(1, currentPage - 1)
    const targetChunkId = `turath_${turathId}_pg_${targetPage}_to_${targetPage}`
    executeChunkSelect(targetChunkId, `صفحة ${targetPage}`, headerSubtitle)
  }

  const handleChunkSelect = (chunkId: string, title: string, fullPath: string, node?: TreeNode) => {
    if (currentChunkId && currentChunkId !== chunkId) {
      setPendingChunkSwitch({ chunkId, title, fullPath, node })
    } else {
      executeChunkSelect(chunkId, title, fullPath, node)
    }
  }

  const handleConfirmChunkSwitch = () => {
    if (pendingChunkSwitch) {
      executeChunkSelect(pendingChunkSwitch.chunkId, pendingChunkSwitch.title, pendingChunkSwitch.fullPath, pendingChunkSwitch.node)
      setPendingChunkSwitch(null)
    }
  }

  const handleConfirmExit = () => {
    clearStudySession()
    setIsSidebarOpen(true)
    setIsDocumentOpen(true)
    setIsChatOpen(true)
    setIsMindmapOpen(false)
    setIsQuizOpen(false)
    setConfirmClose(false)
    onExit()
  }

  const handleStartNewSession = useCallback(() => {
    // 1. Reset current session context and states (clear active lesson, chat, quiz, mindmap)
    clearStudySession()

    // 2. Open workspace sidebar in expanded mode
    setIsWorkspaceSidebarExpanded(true)

    // 3. Open Content Index and Document Reader panels (matching the requested layout)
    setIsSidebarOpen(true)
    setIsDocumentOpen(true)

    // 4. Close other panels (Chat, Mindmap, Quiz)
    setIsChatOpen(false)
    setIsMindmapOpen(false)
    setIsQuizOpen(false)

    // 5. Ensure we are in workspace view
    setStudyView('workspace')

    // 6. Reset all temporary flow and loading states
    setActiveQuizId(null)
    setPendingPlanSteps([])
    setLoading(false)
    setIsChunkLoading(false)
    setMindmapLoading(false)
    setQuizLoading(false)

    // 7. Focus on sidebar index
    focusPanel('sidebar')
  }, [clearStudySession, focusPanel])

  const filterTreeNodes = useCallback((nodes: TreeNode[], query: string): TreeNode[] => {
    if (!query) return nodes
    const q = query.trim().toLowerCase()
    if (!q) return nodes

    return nodes.reduce<TreeNode[]>((acc, node) => {
      const matchTitle = (node.title || '').toLowerCase().includes(q)
      const matchAuthor = (node.author || '').toLowerCase().includes(q)
      const isSelfMatch = matchTitle || matchAuthor

      // 1. If this node is a BOOK:
      if (node.is_book) {
        if (isSelfMatch) {
          // If the book itself matched by title or author:
          // Keep ALL its loaded children (chapters) intact so the user can browse them when they expand the book
          acc.push({
            ...node,
            children: node.children || []
          })
          return acc
        }

        // If the book title itself didn't match, check if any loaded chapters match
        if (node.children && node.children.length > 0) {
          const matchedChapters = filterTreeNodes(node.children, query)
          if (matchedChapters.length > 0) {
            acc.push({
              ...node,
              children: matchedChapters,
              _hasMatchedChild: true
            } as any)
            return acc
          }
        }

        return acc
      }

      // 2. For CATEGORIES / FOLDERS:
      const filteredChildren = node.children ? filterTreeNodes(node.children, query) : []
      if (isSelfMatch || filteredChildren.length > 0) {
        acc.push({
          ...node,
          children: filteredChildren,
          _hasMatchedChild: filteredChildren.length > 0 && !isSelfMatch
        } as any)
      }
      return acc
    }, [])
  }, [])

  const filteredTreeData = useMemo(() => {
    return filterTreeNodes(treeData, deferredSearchQuery)
  }, [treeData, deferredSearchQuery, filterTreeNodes])

  const totalBooksCount = useMemo(() => {
    if (!treeData || treeData.length === 0) return 51
    const countBooks = (n: TreeNode): number => {
      if (n.is_book) return 1
      if (!n.children || n.children.length === 0) return 0
      return n.children.reduce((acc, child) => acc + countBooks(child), 0)
    }
    const count = treeData.reduce((acc, node) => acc + countBooks(node), 0)
    return count > 0 ? count : 51
  }, [treeData])

  const [pendingPlanSteps, setPendingPlanSteps] = useState<string[]>([])

  /**
   * Unified Tutor Chat Dispatcher:
   * - For Turath chunks (or missing Mongo chunks): sends text directly to /chat/raw,
   *   bypassing MongoDB entirely so "Chunk not found" never happens!
   * - For Mongo RAG chunks: keeps the classic Mongo /chat flow.
   */
  const requestTutorChat = async (
    message: string,
    mode: 'chat' | 'plan' | 'summary' = 'chat',
    history = chatHistory
  ): Promise<string> => {
    const isTurath = currentChunkId?.startsWith('turath_')

    // 1. Try SQL backend session if available and not Turath
    if (activeSessionId && !isTurath) {
      try {
        const chatMsgDto = await studyApi.sendMessage(activeSessionId, message, mode)
        if (chatMsgDto && chatMsgDto.content) {
          return chatMsgDto.content
        }
      } catch (e) {
        console.warn('Backend session send failed, fallback to direct tutor engine:', e)
      }
    }

    // 2. For Turath: Use /chat/raw directly with live chapter text!
    // This completely bypasses MongoDB and prevents "Chunk not found"!
    if (isTurath) {
      const res = await fetch(`${API_BASE}/api/v1/tutor/chat/raw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': TUTOR_API_KEY },
        body: JSON.stringify({
          text: chunkText || 'نص الدرس الشرعي',
          message: message,
          mode: mode,
          history: history
        })
      })
      const data = await res.json()
      if (data.success && data.reply) {
        return data.reply
      }
      throw new Error(data.detail || 'فشل توليد الرد من المعلم')
    }

    // 3. For Mongo RAG chunks: try standard /chat
    try {
      const res = await fetch(`${API_BASE}/api/v1/tutor/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': TUTOR_API_KEY },
        body: JSON.stringify({
          chunk_id: currentChunkId,
          message: message,
          mode: mode,
          history: history
        })
      })
      const data = await res.json()
      if (data.success && data.reply) {
        return data.reply
      }
      // If Mongo lookup failed, fallback to /chat/raw with chunkText!
      if (chunkText) {
        const rawRes = await fetch(`${API_BASE}/api/v1/tutor/chat/raw`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-API-Key': TUTOR_API_KEY },
          body: JSON.stringify({
            text: chunkText,
            message: message,
            mode: mode,
            history: history
          })
        })
        const rawData = await rawRes.json()
        if (rawData.success && rawData.reply) {
          return rawData.reply
        }
      }
      throw new Error(data.detail || 'فشل الاتصال بالمعلم')
    } catch (err: any) {
      if (chunkText) {
        const rawRes = await fetch(`${API_BASE}/api/v1/tutor/chat/raw`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-API-Key': TUTOR_API_KEY },
          body: JSON.stringify({
            text: chunkText,
            message: message,
            mode: mode,
            history: history
          })
        })
        const rawData = await rawRes.json()
        if (rawData.success && rawData.reply) {
          return rawData.reply
        }
      }
      throw err
    }
  }

  const handleSelectStartOption = async (optionKey: 'plan' | 'summary' | 'chat') => {
    if (!currentChunkId) return
    let promptMsg = ''
    let userDisplayMsg = ''

    if (optionKey === 'plan') {
      promptMsg = STUDY_PROMPTS.CREATE_STUDY_PLAN(chunkTitle)
      userDisplayMsg = 'أود الحصول على خطة تفاعلية لمذاكرة هذا الدرس.'
    } else if (optionKey === 'summary') {
      promptMsg = STUDY_PROMPTS.BALANCED_SUMMARY(chunkTitle)
      userDisplayMsg = 'أود الحصول على تلخيص مركز ومُتوازن لهذا الدرس (لا إفراط ولا تفريط).'
    } else {
      promptMsg = STUDY_PROMPTS.DIRECT_DISCUSSION(chunkTitle)
      userDisplayMsg = 'أود بدء التحاور المباشر مع زاد وطرح أسئلتي في هذا الدرس.'
    }

    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userDisplayMsg }])
    setLoading(true)

    try {
      const replyText = await requestTutorChat(promptMsg, optionKey)

      if (replyText) {
        const keyId = activeSessionId || currentChunkId
        const { cleanText, extractedSteps } = studyPlanManager.parseLLMResponse(replyText, keyId, false)

        if (optionKey === 'plan' && extractedSteps && extractedSteps.length > 0) {
          setPendingPlanSteps(extractedSteps)
        }

        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'tutor', text: cleanText }])
        setChatHistory(prev => [
          ...prev,
          { role: 'user', content: userDisplayMsg },
          { role: 'assistant', content: cleanText }
        ])
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'tutor', text: 'خطأ: ' + (e.message || 'فشل الاتصال بالسيرفر.') }])
    } finally {
      setLoading(false)
    }
  }

  const handleApprovePlan = async (firstStepTitle: string) => {
    if (!currentChunkId) return
    const keyId = activeSessionId || currentChunkId
    if (pendingPlanSteps.length > 0) {
      studyPlanManager.saveSessionPlan(keyId, pendingPlanSteps)
      setPendingPlanSteps([])
    }

    const userText = `ممتاز أخي زاد، اعتمدت الخطة! ابدأ فوراً بشرح المحور الأول: "${firstStepTitle}".`
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userText }])
    setLoading(true)

    try {
      const replyText = await requestTutorChat(userText, 'chat')
      if (replyText) {
        const { cleanText } = studyPlanManager.parseLLMResponse(replyText, keyId, true)
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'tutor', text: cleanText }])
        setChatHistory(prev => [
          ...prev,
          { role: 'user', content: userText },
          { role: 'assistant', content: cleanText }
        ])
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'tutor', text: 'خطأ: ' + (e.message || 'فشل الاتصال بالسيرفر.') }])
    } finally {
      setLoading(false)
    }
  }

  const handleStepComplete = async (completedStepId: number) => {
    if (!currentChunkId) return
    const keyId = activeSessionId || currentChunkId

    // Mark step completed immediately in studyPlanManager
    studyPlanManager.markStepCompleted(keyId, completedStepId, true)

    const currentProgress = studyPlanManager.getSessionProgress(keyId)
    if (!currentProgress) return

    const completedStep = currentProgress.steps.find(s => s.id === completedStepId)
    const nextStep = currentProgress.steps.find(s => !s.isCompleted)

    let userPromptMsg = ''
    if (nextStep) {
      userPromptMsg = `ممتاز أخي زاد، استوعبت محور "${completedStep?.title || completedStepId}" بفضل الله. يرجى البدء فوراً في شرح المحور التالي: "${nextStep.title}".`
    } else {
      userPromptMsg = `ممتاز أخي زاد، استوعبت بفضل الله جميع محاور هذا الدرس! قدم لي ملخصاً ختامياً شاملاً لأهم الفوائد والتطبيقات.`
    }

    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userPromptMsg }])
    setLoading(true)

    try {
      const replyText = await requestTutorChat(userPromptMsg, 'chat')
      if (replyText) {
        const { cleanText } = studyPlanManager.parseLLMResponse(replyText, keyId, false)
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'tutor', text: cleanText }])
        setChatHistory(prev => [
          ...prev,
          { role: 'user', content: userPromptMsg },
          { role: 'assistant', content: cleanText }
        ])
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'tutor', text: 'خطأ: ' + (e.message || 'فشل الاتصال بالسيرفر.') }])
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return
    if (!currentChunkId) {
      alert('الرجاء اختيار درس من الفهرس الجانبي أولاً لتبدأ المحادثة حوله.')
      return
    }

    const userText = input.trim()
    setInput('')
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userText }])
    setLoading(true)

    try {
      const replyText = await requestTutorChat(userText, 'chat')
      if (replyText) {
        const keyId = activeSessionId || currentChunkId || 'current_session'
        const { cleanText, extractedSteps } = studyPlanManager.parseLLMResponse(replyText, keyId, false)

        // If LLM returned plan steps during chat, queue them for user approval instead of auto-activating
        if (extractedSteps && extractedSteps.length > 0) {
          const existingPlan = studyPlanManager.getSessionProgress(keyId)
          if (!existingPlan || existingPlan.totalSteps === 0) {
            setPendingPlanSteps(extractedSteps)
          }
        }

        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'tutor', text: cleanText }])
        setChatHistory(prev => [
          ...prev,
          { role: 'user', content: userText },
          { role: 'assistant', content: cleanText }
        ])
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'tutor', text: 'خطأ: ' + (e.message || 'فشل الاتصال بالسيرفر.') }])
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateQuiz = async (options?: {
    numQuestions?: number | 'auto';
    aiMode?: 'comprehensive' | 'random';
    difficulty?: 'easy' | 'medium' | 'hard';
    questionTypes?: string[];
    isAppend?: boolean;
  }) => {
    if (!currentChunkId) return alert('الرجاء اختيار درس من الفهرس أولاً')
    setIsQuizOpen(true)
    focusPanel('quiz')
    setQuizLoading(true)

    if (!options?.isAppend) {
      setQuizQuestions(null)
      setSelectedAnswers({})
    }

    const num_questions = options?.numQuestions === 'auto' ? 0 : (options?.numQuestions || 5)
    const mode = options?.aiMode || 'comprehensive'
    const difficulty = options?.difficulty || 'medium'
    const isTurath = currentChunkId.startsWith('turath_')

    try {
      let questionsList: any = null

      // 1. For Mongo chunks: try standard backend / SQL first
      if (!isTurath) {
        try {
          const quizDto = await studyApi.generateQuiz(currentChunkId, num_questions, mode, difficulty, chunkTitle)
          if (quizDto?.id) {
            setActiveQuizId(quizDto.id)
          }
          questionsList = quizDto.questionsData?.questions || quizDto.questionsData
        } catch (err) {
          console.warn('Backend generate quiz failed, trying tutor engine API:', err)
        }
      }

      // 2. Try calling dedicated /api/v1/tutor/quiz/generate (supports both Mongo chunk_id and live Turath text)
      if (!questionsList && (chunkText || currentChunkId)) {
        try {
          const res = await fetch(`${API_BASE}/api/v1/tutor/quiz/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': TUTOR_API_KEY },
            body: JSON.stringify({
              chunk_id: isTurath ? undefined : currentChunkId,
              text: chunkText || undefined,
              metadata: { book_title: chunkTitle },
              num_questions,
              mode,
              difficulty,
              question_types: options?.questionTypes || ['mcq', 'true_false', 'fill_blank', 'matching']
            })
          })
          if (res.ok) {
            const data = await res.json()
            if (data.success && data.quiz) {
              questionsList = data.quiz.questions || data.quiz
            }
          }
        } catch (tutorErr) {
          console.warn('Backend tutor quiz/generate failed, falling back to direct prompt:', tutorErr)
        }
      }

      // 3. Direct Fallback: generate quiz questions directly via /chat/raw with universal multi-discipline prompt
      if (!questionsList && chunkText) {
        try {
          const allowedTypes = options?.questionTypes && options.questionTypes.length > 0
            ? options.questionTypes
            : ['mcq', 'true_false', 'fill_blank', 'matching']

          const typesGuide = []
          if (allowedTypes.includes('mcq')) {
            typesGuide.push(`- 'mcq' (اختيار من متعدد): 4 خيارات رصينة (أحدها صحيح تماماً و3 مشتتات علمية واقعية)، يقيس الفهم العميق والتحليل والاستنباط.`)
          }
          if (allowedTypes.includes('true_false')) {
            typesGuide.push(`- 'true_false' (صح أو خطأ): الخيارات دائماً حصراً ["صواب", "خطأ"]، يقيس الدقة في ضبط القواعد والشروط وصحة نسبة الأقوال ونفي الأوهام.`)
          }
          if (allowedTypes.includes('fill_blank')) {
            typesGuide.push(`- 'fill_blank' (إكمال الفراغ): يجب أن يحتوي نص السؤال وجوباً على كلمة '[فراغ]'، والخيارات 4 مصطلحات مقتضبة، لضبط المصطلحات الدقيقة وألفاظ المتون والقواعد.`)
          }
          if (allowedTypes.includes('matching')) {
            typesGuide.push(`- 'matching' (توصيل ومطابقة): يجب أن يحتوي السؤال على خاصية 'matching_pairs' بها من 3 إلى 5 أزواج متناسقة [{"left": "...", "right": "..."}]، لمطابقة المصطلحات بتعريفاتها، أو الأقوال بقائليها، أو الأقسام بضوابطها.`)
          }

          const countInstruction = num_questions <= 0
            ? `1. استقصاء شامل وحصري (Exhaustive Knowledge Scan): هذا النص قد ينتمي لأي فرع من العلوم الإسلامية والعربية والتاريخية (عقيدة وتوحيد، تفسير وعلوم قرآن، حديث ومصطلحه وشروحه، فقه وأصول وقواعد، سيرة وتاريخ وتراجم، علوم اللغة من نحو وصرف وبلاغة، تزكية وآداب).\nقم بعمل مسح دقيق للنص من أوله إلى آخره، واستخرج سؤالاً مستقلاً لكل مسألة، تعريف، مصطلح، تقسيم، حكم، علة، دليل، شاهد، أو فائدة علمية وردت في النص، دون أن تترك أي معلومة ذات بال بدون سؤال، واجعل عدد الأسئلة الإجمالي متطابقاً مع عدد النقاط المعرفية المستخلصة دون تحديد سقف مصطنع.`
            : `1. التزم باستخراج بالضبط (${num_questions}) أسئلة تقييمية تغطي أهم وأبرز المحاور والفوائد العلمية في النص.`

          const quizPrompt =
            `أنت خبير تربوي ومحقق متخصص في العلوم الإسلامية واللغوية والتاريخية.
المطلوب إنشاء اختبار تقييمي احترافي تفاعلي للنص التالي المأخوذ من: "${chunkTitle || 'الدرس المختار'}".
مستوى الصعوبة المطلوب: ${difficulty === 'easy' ? 'مباشر وواضح' : difficulty === 'hard' ? 'متقدم ودقيق يقيس الاستنباط' : 'متوسط يقيس الاستيعاب والفهم'}.

التعليمات والقواعد الصارمة:
${countInstruction}
2. تنويع الأنماط بذكاء: وزّع الأسئلة بين الأنماط المتاحة أدناه بحسب ما يناسب طبيعة كل معلومة وفائدة، ولا تقصر الاختبار على نمط واحد:
${typesGuide.join('\n')}
3. التعليل العلمي (explanation): لكل سؤال، اكتب شرحاً علمياً دقيقاً في حقل explanation يوضح وجه صحة الإجابة مستنداً إلى النص المعروض ومبيناً دليله أو تعليله وعزوه للمصنف إن وُجد.
4. التنسيق: أخرج الناتج فقط وحصرياً ككائن JSON صالح 100% بدون أي نصوص أو شروحات خارج الكود، بالهيكل التالي:
\`\`\`json
{
  "questions": [
    {
      "id": "1",
      "type": "mcq",
      "question": "نص السؤال الاستنباطي أو التحليلي؟",
      "options": ["الخيار الصحيح", "مشتت 1", "مشتت 2", "مشتت 3"],
      "correct_answer_index": 0,
      "explanation": "بيان وجه الصحة والتعليل من النص."
    },
    {
      "id": "2",
      "type": "true_false",
      "question": "نص العبارة التقريرية المراد الحكم عليها من واقع النص؟",
      "options": ["صواب", "خطأ"],
      "correct_answer_index": 0,
      "explanation": "توضيح الصواب والتعليل."
    },
    {
      "id": "3",
      "type": "fill_blank",
      "question": "المقصود بـ [فراغ] في هذا السياق هو كذا وكذا.",
      "options": ["المصطلح الصحيح", "بديل 1", "بديل 2", "بديل 3"],
      "correct_answer_index": 0,
      "explanation": "شرح المصطلح وسياقه في النص."
    },
    {
      "id": "4",
      "type": "matching",
      "question": "صل بين المفاهيم في القائمة (أ) وما يطابقها في القائمة (ب):",
      "options": ["الربط الصحيح الكامل", "ربط غير صحيح"],
      "correct_answer_index": 0,
      "explanation": "شرح التوافق والمطابقة بين العناصر.",
      "matching_pairs": [
        {"left": "العنصر أو المفهوم 1", "right": "البيان أو التعريف 1"},
        {"left": "العنصر أو المفهوم 2", "right": "البيان أو التعريف 2"},
        {"left": "العنصر أو المفهوم 3", "right": "البيان أو التعريف 3"}
      ]
    }
  ]
}
\`\`\``

          const res = await fetch(`${API_BASE}/api/v1/tutor/chat/raw`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': TUTOR_API_KEY },
            body: JSON.stringify({
              text: chunkText,
              message: quizPrompt,
              mode: 'chat',
              history: []
            })
          })
          const data = await res.json()
          if (data.success && data.reply) {
            const raw = data.reply
            const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, raw]
            const cleaned = (jsonMatch[1] || raw).trim()
            const parsed = JSON.parse(cleaned)
            questionsList = parsed.questions || parsed
          }
        } catch (rawQuizErr) {
          console.warn('Raw quiz generation fallback failed:', rawQuizErr)
        }
      }

      if (questionsList && Array.isArray(questionsList)) {
        questionsList = questionsList.map((q: any, i: number) => ({
          ...q,
          id: q.id || String(i + 1),
          type: q.type || 'mcq',
          options: Array.isArray(q.options) ? q.options : [],
          correct_answer_index: typeof q.correct_answer_index === 'number' ? q.correct_answer_index : 0,
          explanation: q.explanation || ''
        }))
        if (options?.isAppend) {
          setQuizQuestions(prev => prev ? [...prev, ...questionsList] : questionsList)
        } else {
          setQuizQuestions(questionsList)
        }

        // Save generated quiz to localStorage fallback cache
        try {
          const localQuizObj = {
            id: Date.now(),
            chunkId: currentChunkId,
            title: `اختبار: ${chunkTitle || 'درس دراسي'}`,
            sectionTitle: chunkTitle || 'درس دراسي',
            mode: mode,
            difficulty: difficulty,
            questionsData: questionsList,
            authorName: 'طالب زاد',
            createdAt: new Date().toISOString()
          }
          const storedStr = localStorage.getItem('zad_saved_quizzes')
          const storedList: any[] = storedStr ? JSON.parse(storedStr) : []
          // Avoid duplicate entries
          const exists = storedList.some(q => q.chunkId === currentChunkId && JSON.stringify(q.questionsData) === JSON.stringify(questionsList))
          if (!exists) {
            storedList.unshift(localQuizObj)
            localStorage.setItem('zad_saved_quizzes', JSON.stringify(storedList.slice(0, 50)))
            window.dispatchEvent(new CustomEvent('zad_quizzes_updated'))
          }
        } catch (e) {
          console.warn('Failed saving quiz to localStorage fallback:', e)
        }
      } else {
        alert('تعذر استخراج أسئلة التقييم لهذا الدرس حالياً، يرجى المحاولة مرة أخرى.')
      }
    } catch (e) {
      alert('فشل الاتصال بالسيرفر')
    } finally {
      setQuizLoading(false)
    }
  }

  const handleLoadQuiz = (quizDto: any) => {
    if (!quizDto) return
    setActiveQuizId(quizDto.id)
    let questionsList = quizDto.questionsData?.questions || quizDto.questionsData
    if (typeof questionsList === 'string') {
      try {
        const parsed = JSON.parse(questionsList)
        questionsList = parsed.questions || parsed
      } catch (e) {
        console.warn('Failed parsing quiz questionsData string:', e)
      }
    }
    setQuizQuestions(Array.isArray(questionsList) ? questionsList : null)
    setQuizFlowState(prev => ({
      ...prev,
      hasExited: false,
      isHomeScreen: false,
      isSetupMode: false,
      isReadyScreen: true,
      isQuizStarted: false,
    }))
  }

  const handleOpenQuizSetup = () => {
    if (!currentChunkId) return alert('الرجاء اختيار درس من الفهرس أولاً')
    setIsQuizOpen(true)
    focusPanel('quiz')
    setQuizFlowState(prev => ({
      ...prev,
      hasExited: false,
      isHomeScreen: false,
      isSetupMode: true,
      isReadyScreen: false,
      isQuizStarted: false,
    }))
  }

  const handleGenerateMindmap = async () => {
    if (!currentChunkId) return alert('الرجاء اختيار درس من الفهرس أولاً')
    setIsMindmapOpen(true)
    focusPanel('mindmap')
    setMindmapLoading(true)
    setMindmapData(null)

    const isTurath = currentChunkId.startsWith('turath_')

    try {
      let tree: any = null

      // 1. Try SQL backend if not Turath
      if (!isTurath) {
        try {
          const mindmapDto = await studyApi.generateMindmap(currentChunkId, chunkText, chunkTitle, chunkMeta)
          tree = mindmapDto.treeData
        } catch (err) {
          console.warn('Backend mindmap failed, fallback to direct:', err)
        }
      }

      // 2. Direct tutor engine (omit chunk_id for Turath so Mongo DB is never queried!)
      if (!tree) {
        try {
          const res = await fetch(`${API_BASE}/api/v1/tutor/mindmap/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': TUTOR_API_KEY },
            body: JSON.stringify({
              chunk_id: isTurath ? undefined : currentChunkId,
              text: chunkText,
              metadata: {
                ...chunkMeta,
                chunk_title: chunkTitle,
              }
            })
          })
          const data = await res.json()
          if (data.success && data.tree) {
            tree = data.tree
          }
        } catch (mindmapErr) {
          console.warn('Direct mindmap API failed, fallback to raw generation:', mindmapErr)
        }
      }

      // 3. Fallback: generate Mindmap directly from raw chapter text via /chat/raw
      if (!tree && chunkText) {
        try {
          const mindmapPrompt = `قم باستخراج خريطة ذهنية هيكلية لهذا الدرس الشرعي: "${chunkTitle || ''}".\n` +
            `أخرج النتيجة حصراً بصيغة كود JSON فقط تمثل الشجرة الهيكلية بهذا الشكل وبدون أي نصوص إضافية:\n` +
            `\`\`\`json\n` +
            `{\n  "id": "1",\n  "label": "${chunkTitle || 'عنوان الدرس'}",\n  "content": "ملخص عام للدرس",\n  "children": [\n    {\n      "id": "2",\n      "label": "المحور الأول",\n      "content": "شرح وتفاصيل المحور الأول",\n      "children": []\n    }\n  ]\n}\n\`\`\``

          const res = await fetch(`${API_BASE}/api/v1/tutor/chat/raw`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': TUTOR_API_KEY },
            body: JSON.stringify({
              text: chunkText,
              message: mindmapPrompt,
              mode: 'chat',
              history: []
            })
          })
          const data = await res.json()
          if (data.success && data.reply) {
            const raw = data.reply
            const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, raw]
            const cleaned = (jsonMatch[1] || raw).trim()
            tree = JSON.parse(cleaned)
          }
        } catch (rawMindmapErr) {
          console.warn('Raw mindmap fallback failed:', rawMindmapErr)
        }
      }

      if (tree) {
        const nodes = Array.isArray(tree) ? tree : [tree]
        setMindmapData(nodes)

        // Save generated mindmap to localStorage cache so it always appears in "خرائطي السابقة"
        try {
          const localMindmapObj = {
            id: Date.now(),
            chunkId: currentChunkId,
            title: chunkTitle ? `خريطة: ${chunkTitle}` : 'خريطة مفاهيم الدرس',
            treeData: nodes,
            authorName: 'طالب زاد',
            createdAt: new Date().toISOString()
          }
          const storedStr = localStorage.getItem('zad_saved_mindmaps')
          const storedList: any[] = storedStr ? JSON.parse(storedStr) : []
          const exists = storedList.some(m => m.chunkId === currentChunkId && JSON.stringify(m.treeData) === JSON.stringify(nodes))
          if (!exists) {
            storedList.unshift(localMindmapObj)
            localStorage.setItem('zad_saved_mindmaps', JSON.stringify(storedList.slice(0, 50)))
            window.dispatchEvent(new CustomEvent('zad_mindmaps_updated'))
          }
        } catch (e) {
          console.warn('Failed saving mindmap to localStorage:', e)
        }
      } else {
        alert('تعذر استخراج الخريطة الذهنية لهذا الدرس، يرجى المحاولة مرة أخرى.')
      }
    } catch (e) {
      alert('فشل الاتصال بالسيرفر')
    } finally {
      setMindmapLoading(false)
    }
  }

  const handleDiscussQuestion = async (q: Question, wrongOpt: string) => {
    let hiddenMsg = ''
    if (q.question.startsWith('أسئلة الاختبار الخاطئة')) {
      hiddenMsg = `أنا كطالب أواجه صعوبة في فهم بعض الأسئلة التي أخطأت فيها خلال الاختبار:\n\n${q.explanation}\n\nهل يمكنك مراجعة هذه الأخطاء معي وتوضيح المفاهيم الشرعية الصحيحة ببساطة وإيجاز؟`
    } else {
      hiddenMsg = `أنا كطالب أواجه صعوبة في فهم هذا السؤال:\n• السؤال: "${q.question}"\n• إجابتي: "${wrongOpt}"\n• الإجابة الصحيحة: "${q.options[q.correct_answer_index]}"\n• التفسير المرفق: "${q.explanation}"\n\nهل يمكنك أن تبسط لي الأمر وتتناقش معي فيه؟`
    }

    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: hiddenMsg }])
    setIsChatOpen(true)
    focusPanel('chat')
    setLoading(true)

    try {
      const replyText = await requestTutorChat(hiddenMsg, 'chat')
      if (replyText) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'tutor', text: replyText }])
        setChatHistory(prev => [
          ...prev,
          { role: 'user', content: hiddenMsg },
          { role: 'assistant', content: replyText }
        ])
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'tutor', text: 'خطأ: ' + (e.message || 'فشل الاتصال بالسيرفر.') }])
    } finally {
      setLoading(false)
    }
  }

  const areAllPanelsClosed = !isSidebarOpen && !isDocumentOpen && !isChatOpen && !isMindmapOpen && !isQuizOpen

  useEffect(() => {
    let meta = document.querySelector('meta[name="theme-color"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'theme-color')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', isDark ? '#0d021a' : '#F8FAFC')
  }, [isDark])

  if (studyView === 'hero') {
    return (
      <div dir="rtl" className="relative min-h-screen w-full bg-background text-foreground transition-colors duration-300">
        {/* Floating Top Navbar matching Homepage and Library */}
        <Navbar
          headerClassName="absolute inset-x-0 top-4 sm:top-6 z-50 px-3 sm:px-4"
          activeTab="study"
          onNavigateHome={onNavigateHome || onExit}
          onTryChat={onTryChat || (() => {})}
          onOpenKnowledge={onOpenKnowledge || (() => {})}
          onOpenStudy={() => setStudyView('hero')}
          onOpenLessons={onOpenLessons || (() => {})}
          onOpenVoiceChat={onOpenVoiceChat || (() => {})}
          onOpenAdmin={onOpenAdmin}
          onOpenTurathRag={onOpenTurathRag}
          onOpenEngineControl={onOpenEngineControl}
          onOpenDataIngestion={onOpenDataIngestion}
          onOpenV2PipelineAdmin={onOpenV2PipelineAdmin}
          onOpenAdminLibrary={onOpenAdminLibrary}
          onOpenYoutubeImporter={onOpenYoutubeImporter}
          onOpenSystemObservability={onOpenSystemObservability}
        />

        {/* Study Mode Hero Landing View */}
        <StudyHero
          accentColor={accentColor}
          isDark={isDark}
          chunkTitle={chunkTitle}
          headerSubtitle={headerSubtitle}
          chunkMeta={chunkMeta}
          currentChunkId={currentChunkId}
          onEnterWorkspace={() => setStudyView('workspace')}
          onOpenBookSelector={handleStartNewSession}
          onOpenHistory={() => setIsHistoryModalOpen(true)}
          onSelectCommunityMindmap={(mm) => {
            if (mm.treeData && mm.treeData.length > 0) {
              setMindmapData(mm.treeData)
            }
            setIsMindmapOpen(true)
            setStudyView('workspace')
          }}
          onSelectCommunityQuiz={(qz) => {
            handleLoadQuiz(qz)
            setIsQuizOpen(true)
            setStudyView('workspace')
          }}
        />

        {/* Saved Sessions History Modal */}
        <StudyHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          onSelectSession={(sess) => {
            handleSelectSavedSession(sess)
            setStudyView('workspace')
          }}
          isDark={isDark}
        />
      </div>
    )
  }

  return (
    <div dir="rtl" className={`relative flex h-screen w-screen flex-col overflow-hidden font-sans transition-colors duration-500 ${isDark ? 'bg-[#0d021a] text-white' : 'bg-[#F8FAFC] text-slate-800'
      }`}>
      <style>{`
        /* Fix for nested details arrows */
        details.mindmap-details[open] > summary .mindmap-arrow {
          transform: rotate(-90deg);
        }
        
        /* Smooth fade-in animation for mindmap children */
        details.mindmap-details[open] > .mindmap-content {
          animation: slideFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes slideFadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Background with Dark/Light styling */}
      {isDark ? (
        <div className="absolute inset-0 z-0 pointer-events-none">
          {bgType === 'image' ? (
            <>
              <img
                src={getWorkspaceDarkBg()}
                alt=""
                className="h-full w-full object-cover opacity-100"
              />
              <div className="absolute inset-0 bg-[#0d021a]/40" />
            </>
          ) : bgType === 'pattern' ? (
            <>
              <div className="absolute inset-0 bg-[#07010f]" />
              <IslamicPattern className={`${getWorkspacePatternColor()} pointer-events-none`} opacity={0.12} scale={0.8} />
            </>
          ) : (
            <div className="absolute inset-0 bg-[#07010f]" />
          )}
        </div>
      ) : (
        <div className="absolute inset-0 z-0 pointer-events-none">
          {bgType === 'image' ? (
            <>
              <img
                src={libraryBgLight}
                alt=""
                className="h-full w-full object-cover opacity-100"
              />
              <div className="absolute inset-0 bg-white/20" />
            </>
          ) : bgType === 'pattern' ? (
            <>
              <div className="absolute inset-0 bg-[#faf8fd]" />
              <IslamicPattern className={`${getWorkspacePatternColor()} pointer-events-none`} opacity={0.08} scale={0.9} />
            </>
          ) : (
            <div className="absolute inset-0 bg-[#faf8fd]" />
          )}
        </div>
      )}

      {/* Mobile Top Header (مطابق لنافبار المكتبة) */}
      <header className="md:hidden relative z-30 shrink-0 w-full border-b border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#090b10]/90 backdrop-blur-xl shadow-xs transition-colors">
        <div className="w-full px-3.5 py-2 flex items-center justify-between gap-2 min-h-[58px]">
          {/* RIGHT (RTL): Drawer Menu Toggle + Zad Logo & Word */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsPlatformSidebarOpen(true)}
              className={`h-10 w-10 rounded-full border flex items-center justify-center transition-all backdrop-blur-md active:scale-95 cursor-pointer group ${getNavCircleBtnStyle()}`}
              title="القائمة الرئيسية للمنصة"
              aria-label="فتح القائمة الرئيسية"
            >
              <Menu className="h-5 w-5 transition-transform group-hover:scale-110" strokeWidth={2.2} />
            </button>

            <div
              onClick={() => setStudyView('hero')}
              className="flex items-center gap-2 cursor-pointer group select-none"
              title="الرئيسية للمدارسة"
            >
              {accentColor === 'purple' ? (
                <img
                  src={darkLogo}
                  alt="زاد"
                  className="h-8.5 w-auto object-contain drop-shadow-[0_2px_8px_rgba(157,50,236,0.35)]"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className={`h-8.5 w-8.5 shrink-0 transition-transform group-hover:scale-105 ${
                    accentColor === 'blue'
                      ? isDark
                        ? 'bg-gradient-to-b from-[#38bdf8] via-[#2563eb] to-[#1e40af]'
                        : 'bg-gradient-to-b from-[#0284c7] via-[#1d4ed8] to-[#1e3a8a]'
                      : accentColor === 'emerald'
                        ? isDark
                          ? 'bg-gradient-to-b from-[#5eead4] via-[#14b8a6] to-[#0f766e]'
                          : 'bg-gradient-to-b from-[#14b8a6] via-[#0d9488] to-[#134e4a]'
                        : isDark
                          ? 'bg-gradient-to-b from-[#f5ecd5] via-[#dfbf83] to-[#8e682d]'
                          : 'bg-gradient-to-b from-[#dfbf83] via-[#b88d46] to-[#5e431a]'
                  }`}
                  style={{
                    WebkitMaskImage: `url(${whiteLogo})`,
                    maskImage: `url(${whiteLogo})`,
                    WebkitMaskSize: 'contain',
                    maskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                    maskPosition: 'center',
                  }}
                />
              )}
              <span className={`font-display text-[21px] font-bold inline-block transition-colors leading-none ${getZadWordClass()}`}>
                زاد
              </span>
            </div>
          </div>

          {/* LEFT (RTL): NotificationBell + Timer Toggle Button + History Button */}
          <div className="flex items-center gap-2 shrink-0">
            {/* زر سجل المدارسة والأداء */}
            <button
              id="study-mobile-history-btn"
              type="button"
              onClick={() => setIsHistoryModalOpen(true)}
              className={`h-10 w-10 rounded-full border flex items-center justify-center transition-all backdrop-blur-md active:scale-95 cursor-pointer group ${
                isHistoryModalOpen
                  ? isDark
                    ? (accentColor === 'amber'
                        ? 'bg-amber-500/20 text-[#eed8ad] border-[#dfbf83] shadow-sm'
                        : accentColor === 'emerald'
                        ? 'bg-teal-500/20 text-teal-300 border-teal-400 shadow-sm'
                        : accentColor === 'blue'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-400 shadow-sm'
                        : 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-sm')
                    : (accentColor === 'amber'
                        ? 'bg-amber-100 text-[#8a652a] border-amber-300 shadow-sm'
                        : accentColor === 'emerald'
                        ? 'bg-teal-100 text-teal-800 border-teal-300 shadow-sm'
                        : accentColor === 'blue'
                        ? 'bg-blue-100 text-blue-800 border-blue-300 shadow-sm'
                        : 'bg-purple-100 text-purple-800 border-purple-300 shadow-sm')
                  : getNavCircleBtnStyle()
              }`}
              title="سجل المدارسة والجلسات السابقة"
              aria-label="سجل المدارسة"
            >
              <History className="h-5 w-5 shrink-0 transition-transform group-hover:scale-110" strokeWidth={2.2} />
            </button>

            {/* زر المؤقت بجانب الإشعارات يميناً (أيقونة فقط بنفس حجم الإشعارات) */}
            <button
              id="study-mobile-timer-btn"
              type="button"
              onClick={() => setIsTimerNavbarExpanded((prev) => !prev)}
              className={`h-10 w-10 rounded-full border flex items-center justify-center transition-all backdrop-blur-md active:scale-95 cursor-pointer group ${
                isTimerNavbarExpanded
                  ? isDark
                    ? (accentColor === 'amber'
                        ? 'bg-amber-500/20 text-[#eed8ad] border-[#dfbf83] shadow-sm'
                        : accentColor === 'emerald'
                        ? 'bg-teal-500/20 text-teal-300 border-teal-400 shadow-sm'
                        : accentColor === 'blue'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-400 shadow-sm'
                        : 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-sm')
                    : (accentColor === 'amber'
                        ? 'bg-amber-100 text-[#8a652a] border-amber-300 shadow-sm'
                        : accentColor === 'emerald'
                        ? 'bg-teal-100 text-teal-800 border-teal-300 shadow-sm'
                        : accentColor === 'blue'
                        ? 'bg-blue-100 text-blue-800 border-blue-300 shadow-sm'
                        : 'bg-purple-100 text-purple-800 border-purple-300 shadow-sm')
                  : getNavCircleBtnStyle()
              }`}
              title={isTimerNavbarExpanded ? 'إخفاء مؤقت المدارسة' : 'عرض مؤقت المدارسة'}
              aria-label="مؤقت المدارسة"
            >
              <Timer className="h-5 w-5 shrink-0 transition-transform group-hover:scale-110" strokeWidth={2.2} />
            </button>

            <NotificationBell />
          </div>
        </div>

        {/* تمدد المؤقت كطبقة عائمة فوق المحتوى دون إزاحة ما تحته */}
        <AnimatePresence>
          {isTimerNavbarExpanded && (
            <motion.div
              id="study-mobile-timer-container"
              initial={{ opacity: 0, y: -6, scaleY: 0.95 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -6, scaleY: 0.95 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ originY: 0 }}
              className="absolute top-full left-0 right-0 z-50 w-full border-b border-x border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#0e031a]/95 backdrop-blur-2xl px-3.5 py-3 shadow-2xl rounded-b-2xl"
            >
              <div className="w-full max-w-sm mx-auto">
                <StudyTimerWidget isDark={isDark} isFullWidth={true} hideTriggerHeader={true} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content Workspace Layout: Right-Docked Pro Sidebar + Multi-Panel Content */}
      <div className="relative z-10 flex flex-1 min-h-0 w-full overflow-hidden">
        {/* Pro Workspace Sidebar on the Right (RTL) - يُخفى في وضع الهاتف ويستبدل بالتابات السفلية */}
        <div className="hidden md:flex shrink-0 h-full">
          <StudyWorkspaceSidebar
            isExpanded={isWorkspaceSidebarExpanded}
            onToggleExpanded={handleToggleWorkspaceSidebar}
            onOpenPlatformSidebar={() => setIsPlatformSidebarOpen(true)}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => {
              if (!isSidebarOpen) {
                setIsSidebarOpen(true)
                focusPanel('sidebar')
              } else if (focusTarget?.panel !== 'sidebar') {
                focusPanel('sidebar')
              } else {
                setIsSidebarOpen(false)
              }
            }}
            isDocumentOpen={isDocumentOpen}
            onToggleDocument={() => {
              if (!isDocumentOpen) {
                setIsDocumentOpen(true)
                focusPanel('document')
              } else if (focusTarget?.panel !== 'document') {
                focusPanel('document')
              } else {
                setIsDocumentOpen(false)
              }
            }}
            isChatOpen={isChatOpen}
            onToggleChat={() => {
              if (!isChatOpen) {
                setIsChatOpen(true)
                focusPanel('chat')
              } else if (focusTarget?.panel !== 'chat') {
                focusPanel('chat')
              } else {
                setIsChatOpen(false)
              }
            }}
            isMindmapOpen={isMindmapOpen}
            onToggleMindmap={() => {
              if (!isMindmapOpen) {
                setIsMindmapOpen(true)
                focusPanel('mindmap')
              } else if (focusTarget?.panel !== 'mindmap') {
                focusPanel('mindmap')
              } else {
                setIsMindmapOpen(false)
              }
            }}
            isQuizOpen={isQuizOpen}
            onToggleQuiz={() => {
              if (!isQuizOpen) {
                setIsQuizOpen(true)
                focusPanel('quiz')
              } else if (focusTarget?.panel !== 'quiz') {
                focusPanel('quiz')
              } else {
                setIsQuizOpen(false)
              }
            }}
            onNewSession={handleStartNewSession}
            onReturnToHero={() => setStudyView('hero')}
            onOpenHistory={() => setIsHistoryModalOpen(true)}
            onOpenProfile={() => setShowProfileModal(true)}
            onSelectSavedSession={handleSelectSavedSession}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            currentBookTitle={headerSubtitle}
            currentChunkTitle={chunkTitle}
          />
        </div>

        {/* Horizontal Multi-Panel Layout */}
        <div ref={workspaceRef} className="relative flex flex-1 overflow-x-auto min-w-0 scroll-smooth h-full">
        {areAllPanelsClosed ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center p-8 my-auto animate-in fade-in duration-300">
            <div className={`h-20 w-20 rounded-full flex items-center justify-center mb-4 transition-all shadow-xl ${isDark
              ? 'bg-[#a855f7]/15 border border-[#a855f7]/30 shadow-[0_0_30px_rgba(168,85,247,0.2)]'
              : 'bg-purple-100/80 border border-purple-200/90 shadow-lg shadow-purple-500/10'
              }`}>
              <BookOpen size={32} className={isDark ? 'text-[#c084fc]' : 'text-purple-700'} />
            </div>
            <h2 className={`text-2xl font-bold mb-2 tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
              جميع التبويبات مغلقة
            </h2>
            <p className={`text-sm leading-relaxed max-w-md ${isDark ? 'text-white/70' : 'text-slate-600 font-medium'}`}>
              اضغط على أي زر من التبويبات الخمسة بالأعلى لفتح الفهرس، النص الأصلي، المحادثة، الخريطة، أو التقييم.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {/* Panel 1: الفهرس */}
            {isSidebarOpen && (
              <>
                <motion.div
                  id="panel-sidebar"
                  key="sidebar-panel"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: (isMobile || openPanelNames.length === 1) ? '100%' : sidebarWidth }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={isResizing ? { duration: 0 } : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className={`h-full flex overflow-hidden ${(isMobile || openPanelNames.length === 1) ? 'flex-1 w-full min-w-full' : 'shrink-0'}`}
                >
                  <StudySidebar
                    isSidebarOpen={isSidebarOpen}
                    sidebarWidth={(isMobile || openPanelNames.length === 1) ? undefined : sidebarWidth}
                    setIsSidebarOpen={setIsSidebarOpen}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    deferredSearchQuery={deferredSearchQuery}
                    treeLoading={treeLoading}
                    filteredTreeData={filteredTreeData}
                    currentChunkId={currentChunkId}
                    handleChunkSelect={handleChunkSelect}
                    startResizingSidebar={() => { }}
                    isDark={isDark}
                    onLoadBookTree={handleLoadBookTree}
                    librarySource={librarySource}
                  />
                </motion.div>

                {openPanelNames.length > 1 && !isMobile && (
                  <PanelResizer
                    onMouseDown={(e) => startResizingPanel('sidebar', e)}
                    isDark={isDark}
                    label="سحب لتغيير عرض الفهرس"
                  />
                )}
              </>
            )}

            {/* Panel 2: النص الأصلي */}
            {isDocumentOpen && (
              <>
                <motion.div
                  id="panel-document"
                  key="document-panel"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: (isMobile || openPanelNames.length === 1) ? '100%' : documentWidth }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={isResizing ? { duration: 0 } : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className={`h-full flex overflow-hidden ${(isMobile || openPanelNames.length === 1) ? 'flex-1 w-full min-w-full' : 'shrink-0'}`}
                >
                  <StudyDocument
                    isDocumentOpen={isDocumentOpen}
                    documentWidth={(isMobile || openPanelNames.length === 1) ? undefined : documentWidth}
                    setIsDocumentOpen={setIsDocumentOpen}
                    currentChunkId={currentChunkId}
                    chunkMeta={chunkMeta}
                    chunkText={chunkText}
                    loading={isChunkLoading}
                    mindmapLoading={mindmapLoading}
                    quizLoading={quizLoading}
                    handleGenerateMindmap={handleGenerateMindmap}
                    handleGenerateQuiz={handleOpenQuizSetup}
                    startResizingDocument={() => { }}
                    isDark={isDark}
                    onPageChange={handleTurathPageChange}
                  />
                </motion.div>

                {openPanelNames.length > 1 && !isMobile && (
                  <PanelResizer
                    onMouseDown={(e) => startResizingPanel('document', e)}
                    isDark={isDark}
                    label="سحب لتغيير عرض النص الأصلي"
                  />
                )}
              </>
            )}

            {/* Panel 3: المعلم الذكي */}
            {isChatOpen && (
              <>
                <motion.div
                  id="panel-chat"
                  key="chat-panel"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: (isMobile || openPanelNames.length === 1) ? '100%' : chatWidth }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={isResizing ? { duration: 0 } : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className={`h-full flex overflow-hidden ${(isMobile || openPanelNames.length === 1) ? 'flex-1 w-full min-w-full' : 'shrink-0'}`}
                >
                  <StudyChatPanel
                    messages={messages}
                    loading={loading}
                    chatEndRef={chatEndRef}
                    input={input}
                    setInput={setInput}
                    handleSend={handleSend}
                    currentChunkId={currentChunkId}
                    sessionId={activeSessionId}
                    chunkTitle={chunkTitle}
                    onClose={() => setIsChatOpen(false)}
                    onSelectStartOption={handleSelectStartOption}
                    pendingPlanSteps={pendingPlanSteps}
                    onApprovePlan={handleApprovePlan}
                    onStepComplete={handleStepComplete}
                    panelWidth={(isMobile || openPanelNames.length === 1) ? undefined : chatWidth}
                    startResizing={() => { }}
                    isDark={isDark}
                  />
                </motion.div>

                {openPanelNames.length > 1 && !isMobile && (
                  <PanelResizer
                    onMouseDown={(e) => startResizingPanel('chat', e)}
                    isDark={isDark}
                    label="سحب لتغيير عرض محادثة زاد"
                  />
                )}
              </>
            )}

            {/* Panel 4: الخريطة الذهنية */}
            {isMindmapOpen && (
              <>
                <motion.div
                  id="panel-mindmap"
                  key="mindmap-panel"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: (isMobile || openPanelNames.length === 1) ? '100%' : mindmapWidth }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={isResizing ? { duration: 0 } : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className={`h-full flex overflow-hidden ${(isMobile || openPanelNames.length === 1) ? 'flex-1 w-full min-w-full' : 'shrink-0'}`}
                >
                  <StudyMindmapPanel
                    mindmapData={mindmapData}
                    loading={mindmapLoading}
                    currentChunkId={currentChunkId}
                    handleGenerateMindmap={handleGenerateMindmap}
                    onClose={() => setIsMindmapOpen(false)}
                    panelWidth={(isMobile || openPanelNames.length === 1) ? undefined : mindmapWidth}
                    startResizing={() => { }}
                    isDark={isDark}
                    chunkLoading={isChunkLoading}
                  />
                </motion.div>

                {openPanelNames.length > 1 && !isMobile && (
                  <PanelResizer
                    onMouseDown={(e) => startResizingPanel('mindmap', e)}
                    isDark={isDark}
                    label="سحب لتغيير عرض الخريطة الذهنية"
                  />
                )}
              </>
            )}

            {/* Panel 5: اختبار التقييم */}
            {isQuizOpen && (
              <>
                <motion.div
                  id="panel-quiz"
                  key="quiz-panel"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: (isMobile || openPanelNames.length === 1) ? '100%' : quizWidth }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={isResizing ? { duration: 0 } : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className={`h-full flex overflow-hidden ${(isMobile || openPanelNames.length === 1) ? 'flex-1 w-full min-w-full' : 'shrink-0'}`}
                >
                  <PanelErrorBoundary panelName="اختبار التقييم" isDark={isDark} onReset={() => setQuizQuestions(null)}>
                    <StudyQuizPanel
                      quizQuestions={quizQuestions}
                      loading={quizLoading}
                      selectedAnswers={selectedAnswers}
                      setSelectedAnswers={setSelectedAnswers}
                      handleDiscussQuestion={handleDiscussQuestion}
                      currentChunkId={currentChunkId}
                      handleGenerateQuiz={handleGenerateQuiz}
                      onResetQuiz={() => setQuizQuestions(null)}
                      onClose={() => setIsQuizOpen(false)}
                      panelWidth={(isMobile || openPanelNames.length === 1) ? undefined : quizWidth}
                      startResizing={() => { }}
                      isDark={isDark}
                      flowState={quizFlowState}
                      setFlowState={setQuizFlowState}
                      activeQuizId={activeQuizId}
                      activeSessionId={activeSessionId}
                      onLoadQuiz={handleLoadQuiz}
                      chunkLoading={isChunkLoading}
                    />
                  </PanelErrorBoundary>
                </motion.div>

                {openPanelNames.length > 1 && (
                  <PanelResizer
                    onMouseDown={(e) => startResizingPanel('quiz', e)}
                    isDark={isDark}
                    label="سحب لتغيير عرض اختبار التقييم"
                  />
                )}
              </>
            )}
          </AnimatePresence>
        )}
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (مطابق تماماً لشريط القراءة في المكتبة بجميع الأحجام والألوان) */}
      <nav
        dir="rtl"
        className={`md:hidden shrink-0 w-full border-t z-40 backdrop-blur-2xl transition-all duration-200 ${
          isDark
            ? 'bg-[#0a0d14]/75 border-white/10 shadow-[0_-8px_25px_rgba(0,0,0,0.7)] text-white backdrop-blur-2xl backdrop-saturate-150'
            : 'bg-white/75 border-gray-200/90 shadow-[0_-6px_20px_rgba(0,0,0,0.06)] text-slate-800 backdrop-blur-2xl backdrop-saturate-150'
        }`}
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 4px)' }}
        aria-label="شريط التبويبات السفلي"
      >
        <div className="flex items-stretch justify-around h-14 sm:h-16 w-full max-w-lg mx-auto px-0">
          {[
            { id: 'sidebar', label: 'الفهرس', icon: Folder },
            { id: 'document', label: 'نص الدرس', icon: BookOpen },
            { id: 'chat', label: 'المساعد زاد', icon: MessageCircle },
            { id: 'mindmap', label: 'التشجير', icon: Brain },
            { id: 'quiz', label: 'الاختبارات', icon: ClipboardList }
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeMobileTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectMobileTab(tab.id as any)}
                className={getBottomNavTabClass(isActive)}
                title={tab.label}
              >
                <Icon
                  className={`h-5 w-5 sm:h-5.5 sm:w-5.5 transition-transform duration-200 ${
                    isActive ? 'scale-110' : ''
                  }`}
                  strokeWidth={2.2}
                />
                <span className="text-[10px] xs:text-[11px] sm:text-xs font-bold tracking-tight truncate max-w-full text-center block px-0.5">
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Unified Platform Sidebar Drawer Modal (تفتح عند الضغط على أيقونة القائمة في النافبار العلوي) */}
      <LibrarySidebar
        isOpen={isPlatformSidebarOpen}
        onClose={() => setIsPlatformSidebarOpen(false)}
        theme={isDark ? 'dark' : 'light'}
        activeMainTab={'study' as any}
        activeStudyTab={activeMobileTab}
        counts={{ domains: 40, authors: 3177, favorites: 0, narrators: '18.9K', downloads: 0, books: totalBooksCount }}
        recentBook={null}
        onSelectTab={(tab) => {
          setIsPlatformSidebarOpen(false)
          onOpenKnowledge?.(tab)
        }}
        onReadRecentBook={() => {}}
        onNavigateGlobal={handleNavigateGlobal}
        onExit={onNavigateHome || onExit}
        onOpenProfile={() => setShowProfileModal(true)}
      />

      {/* Professional Confirmation Modal for Switching Lessons (Dark & Light Mode) */}
      <AnimatePresence>
        {pendingChunkSwitch && (
          <div dir="rtl" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border flex flex-col gap-4.5 ${isDark
                ? 'bg-[#160628]/95 border-purple-500/30 text-white shadow-[0_20px_60px_rgba(0,0,0,0.7)]'
                : 'bg-white/95 border-purple-200 text-slate-900 shadow-2xl'
                }`}
            >
              <div className="flex items-center gap-3.5">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                  <AlertCircle size={26} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    هل تريد تبديل الدرس؟
                  </h3>
                  <p className={`text-xs font-bold line-clamp-1 ${isDark ? 'text-purple-300' : 'text-purple-800'}`}>
                    الدرس القادم: {pendingChunkSwitch.title}
                  </p>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed font-bold ${isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-purple-50/70 border-purple-200 text-purple-950'
                }`}>
                سيتم الانفصال عن سياق الدرس الحالي والبدء في درس جديد. ستعمل محادثة زاد والخريطة الذهنية والاختبارات مباشرةً على موضوع الدرس المحدد.
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setPendingChunkSwitch(null)}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${isDark
                    ? 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleConfirmChunkSwitch}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-purple-600/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <BookOpen size={16} />
                  <span>تأكيد التبديل</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal for Ending Current Lesson and Exiting */}
      <AnimatePresence>
        {confirmClose && (
          <div dir="rtl" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border flex flex-col gap-4 ${isDark
                ? 'bg-[#160628]/95 border-purple-500/30 text-white shadow-[0_20px_60px_rgba(0,0,0,0.7)]'
                : 'bg-white/95 border-purple-200 text-slate-900 shadow-2xl'
                }`}
            >
              <div className="flex items-center gap-3 text-red-500">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${isDark ? 'bg-red-500/20 border border-red-500/30 text-red-400' : 'bg-red-100 border border-red-200 text-red-700'
                  }`}>
                  <AlertCircle size={26} strokeWidth={2.2} />
                </div>
                <h3 className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  تأكيد إنهاء الدرس والخروج
                </h3>
              </div>
              <p className={`text-xs sm:text-sm leading-relaxed font-bold p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-red-50/60 border-red-200 text-slate-800'
                }`}>
                عند الخروج باستخدام زر (X)، سيتم إنهاء الدرس الحالي وتصفير المحادثة والأسئلة والتقدم الحالي، والعودة للشاشة الرئيسية.
                <br /><br />
                <span className={isDark ? 'text-purple-300' : 'text-purple-800'}>ملاحظة: إذا أردت العودة للرئيسية مع حفظ تقدمك دون مسحه، يمكنك استخدام زر السهم (الرجوع).</span>
              </p>
              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmClose(false)}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${isDark
                    ? 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleConfirmExit}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-red-600/30 transition-all hover:scale-105 active:scale-95"
                >
                  تأكيد الإنهاء والخروج
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Saved Sessions & Academic Progress History Modal */}
      <StudyHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onSelectSession={handleSelectSavedSession}
        isDark={isDark}
      />

      {/* User Profile Modal */}
      {showProfileModal && (
        <UserProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  )
}
