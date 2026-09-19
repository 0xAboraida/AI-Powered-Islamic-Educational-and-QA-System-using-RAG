import { useState, useRef, useEffect, useMemo, useDeferredValue, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import bgDark from '@/assets/images/image.webp'
import bgLight from '@/assets/images/bg-islamic-light.webp'
import whiteLogo from '@/assets/images/WhiteLogo.png'
import darkLogo from '@/assets/images/ZadDarkLogo.png'
import {
  ArrowLeft, Menu, BookOpen, X,
  AlertCircle, XCircle, Sun, Moon,
  MessageCircle, Brain, ClipboardList,
  Maximize, Minimize, History, ChevronUp, ChevronDown
} from 'lucide-react'
import {
  useStudyContext,
  type Question,
  type TreeNode
} from '../../contexts/StudyContext'
import { useTheme } from '../../contexts/ThemeContext'
import { studyApi, type StudySessionDto } from '../../api/studyApi'

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

const TUTOR_ENGINE_URL = import.meta.env.VITE_TUTOR_ENGINE_URL || 'https://abourida-zad-tutor-engine-space.hf.space'
const API_BASE = TUTOR_ENGINE_URL
const TUTOR_API_KEY = import.meta.env.VITE_TUTOR_ENGINE_API_KEY || 'zad-super-secret-key'

export default function StudyMode({ onExit }: { onExit: () => void }) {
  const { toggleTheme, isDark } = useTheme()
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
  const [sidebarWidth, setSidebarWidth] = useState(300)

  const [isDocumentOpen, setIsDocumentOpen] = useState(true)
  const [documentWidth, setDocumentWidth] = useState(480)

  const [isChatOpen, setIsChatOpen] = useState(true)
  const [chatWidth, setChatWidth] = useState(550)

  const [isMindmapOpen, setIsMindmapOpen] = useState(false)
  const [mindmapWidth, setMindmapWidth] = useState(750)

  const [isQuizOpen, setIsQuizOpen] = useState(false)
  const [quizWidth, setQuizWidth] = useState(500)

  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const [confirmClose, setConfirmClose] = useState(false)
  const [pendingChunkSwitch, setPendingChunkSwitch] = useState<{ chunkId: string; title: string; fullPath: string } | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
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
              cleanText = '💬 أود بدء التحاور المباشر مع زاد وطرح أسئلتي في هذا الدرس.';
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

      if (panelKey === 'sidebar') setSidebarWidth(Math.max(220, Math.min(newWidth, 800)))
      else if (panelKey === 'document') setDocumentWidth(Math.max(280, Math.min(newWidth, 1200)))
      else if (panelKey === 'chat') setChatWidth(Math.max(300, Math.min(newWidth, 1400)))
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

  const [focusTarget, setFocusTarget] = useState<{ panel: string; id: number } | null>(null)

  const focusPanel = useCallback((panelKey: string) => {
    setFocusTarget({ panel: panelKey, id: Date.now() })
  }, [])

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

  const fetchTree = async () => {
    try {
      // 1. Load from cache immediately to show UI instantly
      const cachedTreeStr = localStorage.getItem('zad_library_tree')
      const cachedVersionStr = localStorage.getItem('zad_library_version')
      
      let hasValidCache = false
      if (cachedTreeStr) {
        try {
          const parsedCache = JSON.parse(cachedTreeStr)
          if (parsedCache && parsedCache.length > 0) {
            setTreeData(parsedCache)
            hasValidCache = true
          }
        } catch (e) {
          console.warn('Failed parsing cached tree', e)
        }
      }

      if (!hasValidCache) setTreeLoading(true)

      // 2. Check version from Tutor Engine (Fast & Lightweight)
      let currentVersion = null
      try {
        const versionRes = await fetch(`${API_BASE}/api/v1/library/version`)
        const versionData = await versionRes.json()
        if (versionData.success) {
          currentVersion = versionData.version || versionData.last_updated
        }
      } catch (e) {
        console.warn('Failed to fetch library version', e)
      }

      // 3. If version matches, we are done!
      if (hasValidCache && currentVersion && cachedVersionStr === String(currentVersion)) {
        setTreeLoading(false)
        return
      }

      // 4. Version mismatch or no cache -> Fetch full tree (forceRefresh = false)
      setTreeLoading(true)
      let newTreeData = null
      
      try {
        const data = await studyApi.getLibraryTrees(false)
        if (data && data.tree) newTreeData = data.tree
      } catch (err) {
        // Fallback to direct Python FastAPI
        const fallbackRes = await fetch(`${API_BASE}/api/v1/library/trees?force_refresh=false`)
        const fallbackData = await fallbackRes.json()
        if (fallbackData.success && fallbackData.tree) newTreeData = fallbackData.tree
      }

      // 5. Save to state and cache
      if (newTreeData) {
        setTreeData(newTreeData)
        try {
          localStorage.setItem('zad_library_tree', JSON.stringify(newTreeData))
          if (currentVersion) {
            localStorage.setItem('zad_library_version', String(currentVersion))
          }
        } catch (e) {
          console.warn('Failed saving tree to cache (might be too large)', e)
        }
      }
    } catch (error) {
      console.error('Error in fetchTree pipeline:', error)
    } finally {
      setTreeLoading(false)
    }
  }

  useEffect(() => {
    fetchTree()

    const handleTreeUpdated = () => {
      fetchTree()
    }
    window.addEventListener('zad_library_updated', handleTreeUpdated)
    return () => window.removeEventListener('zad_library_updated', handleTreeUpdated)
  }, [])

  const executeChunkSelect = async (chunkId: string, title: string, fullPath: string) => {
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
    } else {
      setIsDocumentOpen(true)
      setIsChatOpen(true)
    }

    try {
      // 1. Start or resume session in Backend SQL database
      let currentSessionId: number | null = null
      try {
        const session = await studyApi.startSession(chunkId, title, fullPath)
        if (session && session.id) {
          currentSessionId = session.id
          setActiveSessionId(session.id)
        }
      } catch (err) {
        console.warn('Backend study session start failed, operating in offline/direct mode:', err)
      }

      // 2. Fetch Chunk details
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

  const handleChunkSelect = (chunkId: string, title: string, fullPath: string) => {
    if (currentChunkId && currentChunkId !== chunkId) {
      setPendingChunkSwitch({ chunkId, title, fullPath })
    } else {
      executeChunkSelect(chunkId, title, fullPath)
    }
  }

  const handleConfirmChunkSwitch = () => {
    if (pendingChunkSwitch) {
      executeChunkSelect(pendingChunkSwitch.chunkId, pendingChunkSwitch.title, pendingChunkSwitch.fullPath)
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

  const filterTreeNodes = useCallback((nodes: TreeNode[], query: string): TreeNode[] => {
    if (!query) return nodes
    return nodes.reduce<TreeNode[]>((acc, node) => {
      const matchTitle = node.title.toLowerCase().includes(query.toLowerCase())
      const filteredChildren = node.children ? filterTreeNodes(node.children, query) : []

      if (matchTitle || filteredChildren.length > 0) {
        acc.push({
          ...node,
          children: filteredChildren
        })
      }
      return acc
    }, [])
  }, [])

  const filteredTreeData = useMemo(() => {
    return filterTreeNodes(treeData, deferredSearchQuery)
  }, [treeData, deferredSearchQuery, filterTreeNodes])

  const [pendingPlanSteps, setPendingPlanSteps] = useState<string[]>([])

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
      userDisplayMsg = '💬 أود بدء التحاور المباشر مع زاد وطرح أسئلتي في هذا الدرس.'
    }

    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userDisplayMsg }])
    setLoading(true)

    try {
      let replyText = ''
      if (activeSessionId) {
        try {
          const chatMsgDto = await studyApi.sendMessage(activeSessionId, promptMsg, optionKey)
          replyText = chatMsgDto.content
        } catch (e) {
          console.warn('Backend send message failed, fallback to direct tutor engine:', e)
        }
      }

      if (!replyText) {
        const res = await fetch(`${API_BASE}/api/v1/tutor/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-API-Key': TUTOR_API_KEY },
          body: JSON.stringify({
            chunk_id: currentChunkId,
            message: promptMsg,
            mode: optionKey,
            history: chatHistory
          })
        })
        const data = await res.json()
        if (data.success) replyText = data.reply
        else setMessages(prev => [...prev, { id: Date.now().toString(), role: 'tutor', text: 'خطأ: ' + data.detail }])
      }

      if (replyText) {
        const keyId = activeSessionId || currentChunkId
        const { cleanText, extractedSteps } = studyPlanManager.parseLLMResponse(replyText, keyId, false)
        replyText = cleanText

        if (optionKey === 'plan' && extractedSteps && extractedSteps.length > 0) {
          setPendingPlanSteps(extractedSteps)
        }

        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'tutor', text: replyText }])
        setChatHistory(prev => [
          ...prev,
          { role: 'user', content: userDisplayMsg },
          { role: 'assistant', content: replyText }
        ])
      }
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'tutor', text: 'فشل الاتصال بالسيرفر.' }])
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
      let replyText = ''
      if (activeSessionId) {
        try {
          const chatMsgDto = await studyApi.sendMessage(activeSessionId, userText)
          replyText = chatMsgDto.content
        } catch (e) {
          console.warn('Backend send failed:', e)
        }
      }

      if (!replyText) {
        const res = await fetch(`${API_BASE}/api/v1/tutor/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-API-Key': TUTOR_API_KEY },
          body: JSON.stringify({ chunk_id: currentChunkId, message: userText, history: chatHistory })
        })
        const data = await res.json()
        if (data.success) replyText = data.reply
      }

      if (replyText) {
        const { cleanText } = studyPlanManager.parseLLMResponse(replyText, keyId, true)
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'tutor', text: cleanText }])
        setChatHistory(prev => [
          ...prev,
          { role: 'user', content: userText },
          { role: 'assistant', content: cleanText }
        ])
      }
    } catch (e) {
      console.error(e)
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
      let replyText = ''
      if (activeSessionId) {
        try {
          const chatMsgDto = await studyApi.sendMessage(activeSessionId, userPromptMsg)
          replyText = chatMsgDto.content
        } catch (e) {
          console.warn('Backend send message failed, fallback to direct tutor engine:', e)
        }
      }

      if (!replyText) {
        const res = await fetch(`${API_BASE}/api/v1/tutor/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-API-Key': TUTOR_API_KEY },
          body: JSON.stringify({
            chunk_id: currentChunkId,
            message: userPromptMsg,
            history: chatHistory
          })
        })
        const data = await res.json()
        if (data.success) replyText = data.reply
        else setMessages(prev => [...prev, { id: Date.now().toString(), role: 'tutor', text: 'خطأ: ' + data.detail }])
      }

      if (replyText) {
        const { cleanText } = studyPlanManager.parseLLMResponse(replyText, keyId, false)
        replyText = cleanText
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'tutor', text: replyText }])
        setChatHistory(prev => [
          ...prev,
          { role: 'user', content: userPromptMsg },
          { role: 'assistant', content: replyText }
        ])
      }
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'tutor', text: 'فشل الاتصال بالسيرفر.' }])
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
      let replyText = ''

      if (activeSessionId) {
        try {
          const chatMsgDto = await studyApi.sendMessage(activeSessionId, userText)
          replyText = chatMsgDto.content
        } catch (e) {
          console.warn('Backend send message failed, fallback to direct tutor engine:', e)
        }
      }

      if (!replyText) {
        const res = await fetch(`${API_BASE}/api/v1/tutor/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-API-Key': TUTOR_API_KEY },
          body: JSON.stringify({
            chunk_id: currentChunkId,
            message: userText,
            history: chatHistory
          })
        })
        const data = await res.json()
        if (data.success) replyText = data.reply
        else setMessages(prev => [...prev, { id: Date.now().toString(), role: 'tutor', text: 'خطأ: ' + data.detail }])
      }

      if (replyText) {
        const keyId = activeSessionId || currentChunkId || 'current_session'
        const { cleanText, extractedSteps } = studyPlanManager.parseLLMResponse(replyText, keyId, false)
        replyText = cleanText

        // If LLM returned plan steps during chat, queue them for user approval instead of auto-activating
        if (extractedSteps && extractedSteps.length > 0) {
          const existingPlan = studyPlanManager.getSessionProgress(keyId)
          if (!existingPlan || existingPlan.totalSteps === 0) {
            setPendingPlanSteps(extractedSteps)
          }
        }

        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'tutor', text: replyText }])
        setChatHistory(prev => [
          ...prev,
          { role: 'user', content: userText },
          { role: 'assistant', content: replyText }
        ])
      }
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'tutor', text: 'فشل الاتصال بالسيرفر.' }])
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

    try {
      let questionsList: any = null

      try {
        const quizDto = await studyApi.generateQuiz(currentChunkId, num_questions, mode, difficulty, chunkTitle)
        if (quizDto?.id) {
          setActiveQuizId(quizDto.id)
        }
        questionsList = quizDto.questionsData?.questions || quizDto.questionsData
      } catch (err) {
        console.warn('Backend generate quiz failed, fallback to direct:', err)
        const res = await fetch(`${API_BASE}/api/v1/tutor/quiz/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-API-Key': TUTOR_API_KEY },
          body: JSON.stringify({ chunk_id: currentChunkId, num_questions, mode, difficulty })
        })
        const data = await res.json()
        if (data.success) questionsList = data.quiz.questions
      }

      if (questionsList) {
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
          }
        } catch (e) {
          console.warn('Failed saving quiz to localStorage fallback:', e)
        }
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

    try {
      let tree: any = null

      try {
        const mindmapDto = await studyApi.generateMindmap(currentChunkId, chunkText, chunkTitle, chunkMeta)
        tree = mindmapDto.treeData
      } catch (err) {
        console.warn('Backend mindmap failed, fallback to direct:', err)
        const res = await fetch(`${API_BASE}/api/v1/tutor/mindmap/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-API-Key': TUTOR_API_KEY },
          body: JSON.stringify({
            chunk_id: currentChunkId,
            text: chunkText,
            metadata: {
              ...chunkMeta,
              chunk_title: chunkTitle,
            }
          })
        })
        const data = await res.json()
        if (data.success) tree = data.tree
      }

      if (tree) {
        setMindmapData(Array.isArray(tree) ? tree : [tree])
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
      let replyText = ''

      if (activeSessionId) {
        try {
          const msgDto = await studyApi.sendMessage(activeSessionId, hiddenMsg, 'chat')
          replyText = msgDto.content
        } catch (e) {
          console.warn('Backend discuss question failed, fallback to direct:', e)
        }
      }

      if (!replyText) {
        const res = await fetch(`${API_BASE}/api/v1/tutor/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-API-Key': 'zad-super-secret-key' },
          body: JSON.stringify({
            chunk_id: currentChunkId,
            message: hiddenMsg,
            history: chatHistory
          })
        })
        const data = await res.json()
        if (data.success) replyText = data.reply
        else setMessages(prev => [...prev, { id: Date.now().toString(), role: 'tutor', text: 'خطأ: ' + data.detail }])
      }

      if (replyText) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'tutor', text: replyText }])
        setChatHistory(prev => [
          ...prev,
          { role: 'user', content: hiddenMsg },
          { role: 'assistant', content: replyText }
        ])
      }
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'tutor', text: 'فشل الاتصال بالسيرفر.' }])
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
          <img
            src={bgDark}
            alt=""
            className="h-full w-full object-cover opacity-100"
          />
          <div className="absolute inset-0 bg-[#12041f]/60" />
        </div>
      ) : (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src={bgLight}
            alt=""
            className="h-full w-full object-cover opacity-100"
          />
          <div className="absolute inset-0 bg-white/40" />
        </div>
      )}

      {/* Top Header Bar (Collapsible Focus Mode) */}
      <header className={`relative z-30 flex w-full items-center justify-between border-b px-2.5 sm:px-6 backdrop-blur-xl transition-all duration-500 ${isHeaderCollapsed ? 'h-0 py-0 opacity-0 border-b-0 pointer-events-none overflow-hidden' : 'h-14 sm:h-16 opacity-100'
        } ${isDark ? 'border-white/10 bg-[#12041f]/80 text-white' : 'border-slate-200 bg-white/90 text-slate-800 shadow-sm'
        }`}>
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="flex items-center gap-2 shrink-0">
            <span className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl p-1.5 sm:p-2 shadow-sm transition-all ${isDark
              ? 'brand-gradient shadow-primary/20'
              : 'bg-purple-100/90 border border-purple-200/80 shadow-purple-500/10'
              }`}>
              <img src={isDark ? whiteLogo : darkLogo} alt="زاد" className="w-full h-full object-contain drop-shadow-sm" />
            </span>
            <div className="hidden xs:block">
              <h1 className={`font-sans text-xs sm:text-base font-black leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                وضع المُدارَسة
              </h1>
            </div>
          </div>

          {/* Desktop Only 5 Separate Panel Toggles */}
          <div className={`hidden md:flex items-center gap-2 mr-4 border-r pr-4 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
            {/* 1. الفهرس */}
            <button
              onClick={() => {
                if (!isSidebarOpen) {
                  setIsSidebarOpen(true)
                  focusPanel('sidebar')
                } else if (focusTarget?.panel !== 'sidebar') {
                  focusPanel('sidebar')
                } else {
                  setIsSidebarOpen(false)
                }
              }}
              className={`flex h-9 items-center justify-center gap-2 rounded-xl px-3.5 text-xs font-bold transition-all backdrop-blur-xl ${isSidebarOpen
                ? isDark
                  ? 'bg-[#a855f7]/25 border border-[#a855f7]/50 text-white shadow-lg shadow-[#a855f7]/25 font-extrabold scale-[1.02] ring-1 ring-[#a855f7]/30'
                  : 'bg-gradient-to-b from-white/90 via-purple-50/60 to-purple-100/70 backdrop-blur-xl border border-purple-300/80 text-purple-950 shadow-md shadow-purple-500/10 font-extrabold scale-[1.02]'
                : isDark
                  ? 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                  : 'bg-white/50 border border-slate-200/90 text-slate-600 hover:bg-white/80 hover:text-slate-900 hover:border-slate-300'
                }`}
              title={isSidebarOpen ? 'الفهرس' : 'فتح الفهرس'}
            >
              <Menu size={16} className="text-teal-500 shrink-0 stroke-[2.2]" />
              <span>الفهرس</span>
            </button>

            {/* 2. النص الأصلي */}
            <button
              onClick={() => {
                if (!isDocumentOpen) {
                  setIsDocumentOpen(true)
                  focusPanel('document')
                } else if (focusTarget?.panel !== 'document') {
                  focusPanel('document')
                } else {
                  setIsDocumentOpen(false)
                }
              }}
              className={`flex h-9 items-center justify-center gap-2 rounded-xl px-3.5 text-xs font-bold transition-all backdrop-blur-xl ${isDocumentOpen
                ? isDark
                  ? 'bg-[#a855f7]/25 border border-[#a855f7]/50 text-white shadow-lg shadow-[#a855f7]/25 font-extrabold scale-[1.02] ring-1 ring-[#a855f7]/30'
                  : 'bg-gradient-to-b from-white/90 via-purple-50/60 to-purple-100/70 backdrop-blur-xl border border-purple-300/80 text-purple-950 shadow-md shadow-purple-500/10 font-extrabold scale-[1.02]'
                : isDark
                  ? 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                  : 'bg-white/50 border border-slate-200/90 text-slate-600 hover:bg-white/80 hover:text-slate-900 hover:border-slate-300'
                }`}
              title={isDocumentOpen ? 'النص الأصلي' : 'فتح النص الأصلي'}
            >
              <BookOpen size={16} className="text-sky-500 shrink-0 stroke-[2.2]" />
              <span>النص الأصلي</span>
            </button>

            {/* 3. المحادثة */}
            <button
              onClick={() => {
                if (!isChatOpen) {
                  setIsChatOpen(true)
                  focusPanel('chat')
                } else if (focusTarget?.panel !== 'chat') {
                  focusPanel('chat')
                } else {
                  setIsChatOpen(false)
                }
              }}
              className={`flex h-9 items-center justify-center gap-2 rounded-xl px-3.5 text-xs font-bold transition-all backdrop-blur-xl ${isChatOpen
                ? isDark
                  ? 'bg-[#a855f7]/25 border border-[#a855f7]/50 text-white shadow-lg shadow-[#a855f7]/25 font-extrabold scale-[1.02] ring-1 ring-[#a855f7]/30'
                  : 'bg-gradient-to-b from-white/90 via-purple-50/60 to-purple-100/70 backdrop-blur-xl border border-purple-300/80 text-purple-950 shadow-md shadow-purple-500/10 font-extrabold scale-[1.02]'
                : isDark
                  ? 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                  : 'bg-white/50 border border-slate-200/90 text-slate-600 hover:bg-white/80 hover:text-slate-900 hover:border-slate-300'
                }`}
              title={isChatOpen ? 'المحادثة' : 'فتح محادثة زاد'}
            >
              <MessageCircle size={16} className="text-purple-500 shrink-0 stroke-[2.2]" />
              <span>المحادثة</span>
            </button>

            {/* 4. الخريطة الذهنية */}
            <button
              onClick={() => {
                if (!isMindmapOpen) {
                  setIsMindmapOpen(true)
                  focusPanel('mindmap')
                } else if (focusTarget?.panel !== 'mindmap') {
                  focusPanel('mindmap')
                } else {
                  setIsMindmapOpen(false)
                }
              }}
              className={`flex h-9 items-center justify-center gap-2 rounded-xl px-3.5 text-xs font-bold transition-all backdrop-blur-xl ${isMindmapOpen
                ? isDark
                  ? 'bg-[#a855f7]/25 border border-[#a855f7]/50 text-white shadow-lg shadow-[#a855f7]/25 font-extrabold scale-[1.02] ring-1 ring-[#a855f7]/30'
                  : 'bg-gradient-to-b from-white/90 via-purple-50/60 to-purple-100/70 backdrop-blur-xl border border-purple-300/80 text-purple-950 shadow-md shadow-purple-500/10 font-extrabold scale-[1.02]'
                : isDark
                  ? 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                  : 'bg-white/50 border border-slate-200/90 text-slate-600 hover:bg-white/80 hover:text-slate-900 hover:border-slate-300'
                }`}
              title={isMindmapOpen ? 'الخريطة الذهنية' : 'فتح الخريطة الذهنية'}
            >
              <Brain size={16} className="text-sky-500 shrink-0 stroke-[2.2]" />
              <span>الخريطة</span>
            </button>

            {/* 5. التقييم */}
            <button
              onClick={() => {
                if (!isQuizOpen) {
                  setIsQuizOpen(true)
                  focusPanel('quiz')
                } else if (focusTarget?.panel !== 'quiz') {
                  focusPanel('quiz')
                } else {
                  setIsQuizOpen(false)
                }
              }}
              className={`flex h-9 items-center justify-center gap-2 rounded-xl px-3.5 text-xs font-bold transition-all backdrop-blur-xl ${isQuizOpen
                ? isDark
                  ? 'bg-[#a855f7]/25 border border-[#a855f7]/50 text-white shadow-lg shadow-[#a855f7]/25 font-extrabold scale-[1.02] ring-1 ring-[#a855f7]/30'
                  : 'bg-gradient-to-b from-white/90 via-purple-50/60 to-purple-100/70 backdrop-blur-xl border border-purple-300/80 text-purple-950 shadow-md shadow-purple-500/10 font-extrabold scale-[1.02]'
                : isDark
                  ? 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                  : 'bg-white/50 border border-slate-200/90 text-slate-600 hover:bg-white/80 hover:text-slate-900 hover:border-slate-300'
                }`}
              title={isQuizOpen ? 'اختبار التقييم' : 'فتح اختبار التقييم'}
            >
              <ClipboardList size={16} className="text-emerald-500 shrink-0 stroke-[2.2]" />
              <span>التقييم</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* مؤقت الدراسة والتركيز الذكي */}
          <StudyTimerWidget isDark={isDark} />

          {/* Light / Dark Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
            className={`flex h-8 w-8 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-all shadow-lg ${isDark
              ? 'bg-[#a855f7]/15 backdrop-blur-md border border-[#a855f7]/30 hover:bg-[#a855f7]/25 text-purple-100'
              : 'bg-white border border-purple-200 hover:bg-purple-50 text-purple-700 shadow-md'
              }`}
            title={isDark ? 'التحويل للوضع النهاري' : 'التحويل للوضع الليلي'}
          >
            <div className={`transition-all duration-700 ${isDark ? 'rotate-0' : 'rotate-[360deg] scale-110'}`}>
              {isDark ? <Sun size={17} strokeWidth={2.5} /> : <Moon size={17} strokeWidth={2.5} />}
            </div>
          </button>

          {/* سجل الجلسات والإحصائيات */}
          <button
            type="button"
            onClick={() => setIsHistoryModalOpen(true)}
            aria-label="سجل الجلسات والأداء"
            className={`flex h-8 w-8 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-all shadow-lg ${isDark
              ? 'bg-[#a855f7]/15 backdrop-blur-md border border-[#a855f7]/30 hover:bg-[#a855f7]/25 text-purple-100'
              : 'bg-white border border-purple-200 hover:bg-purple-50 text-purple-700 shadow-md'
              }`}
            title="سجل الجلسات والأداء"
          >
            <div className="transition-all duration-300 hover:rotate-12">
              <History size={17} strokeWidth={2.5} className={isDark ? 'text-purple-100' : 'text-purple-700'} />
            </div>
          </button>

          {/* Fullscreen Toggle Button (Hidden on tiny screens) */}
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'الخروج من الشاشة الكاملة' : 'وضع الشاشة الكاملة'}
            className={`hidden sm:flex h-11 w-11 items-center justify-center rounded-full transition-all shadow-lg ${isDark
              ? 'bg-[#a855f7]/15 backdrop-blur-md border border-[#a855f7]/30 hover:bg-[#a855f7]/25 text-purple-100'
              : 'bg-white border border-purple-200 hover:bg-purple-50 text-purple-700 shadow-md'
              }`}
            title={isFullscreen ? 'الخروج من الشاشة الكاملة (Esc)' : 'وضع الشاشة الكاملة'}
          >
            <div className="transition-all duration-300 hover:scale-110">
              {isFullscreen ? <Minimize size={20} strokeWidth={2.5} /> : <Maximize size={20} strokeWidth={2.5} />}
            </div>
          </button>

          <button
            onClick={() => setConfirmClose(true)}
            title="إعادة تعيين الدرس والخروج للرئيسية"
            className={`flex h-8 w-8 sm:h-11 sm:w-11 items-center justify-center rounded-full text-lg transition-all shadow-lg ${isDark
              ? 'bg-red-500/15 backdrop-blur-md border border-red-500/30 hover:bg-red-500/25 text-red-300'
              : 'bg-white border border-red-200 hover:bg-red-50 text-red-600 shadow-md'
              }`}
          >
            <X size={18} strokeWidth={2.5} />
          </button>
          <button
            onClick={onExit}
            title="الرجوع للرئيسية (مع حفظ تقدمك)"
            className={`flex h-8 w-8 sm:h-11 sm:w-11 items-center justify-center rounded-full text-lg transition-all shadow-lg ${isDark
              ? 'bg-[#a855f7]/15 backdrop-blur-md border border-[#a855f7]/30 hover:bg-[#a855f7]/25 text-purple-100'
              : 'bg-white border border-purple-200 hover:bg-purple-50 text-purple-700 shadow-md'
              }`}
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>

          {/* Collapse Header Button (Focus Mode Toggle) */}
          <button
            type="button"
            onClick={toggleHeaderCollapse}
            aria-label="طي الشريط العلوي (وضع التركيز)"
            className={`flex h-8 w-8 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-all shadow-lg ${isDark
              ? 'bg-[#a855f7]/15 backdrop-blur-md border border-[#a855f7]/30 hover:bg-[#a855f7]/25 text-purple-100'
              : 'bg-white border border-purple-200 hover:bg-purple-50 text-purple-700 shadow-md'
              }`}
            title="طي الشريط العلوي (وضع التركيز)"
          >
            <div className="transition-all duration-300 hover:-translate-y-0.5">
              <ChevronUp size={18} strokeWidth={2.5} />
            </div>
          </button>
        </div>
      </header>

      {/* Dedicated Mobile Navigation Bar (< 768px) */}
      {!isHeaderCollapsed && (
        <div className={`flex md:hidden w-full items-center justify-around px-2 py-1.5 border-b backdrop-blur-xl z-30 shrink-0 gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden ${isDark ? 'bg-[#12041f]/95 border-white/10 text-white shadow-lg' : 'bg-white/95 border-slate-200 text-slate-800 shadow-md'
          }`}>
          {/* 1. الفهرس */}
          <button
            onClick={() => {
              setIsSidebarOpen(true)
              setIsDocumentOpen(false)
              setIsChatOpen(false)
              setIsMindmapOpen(false)
              setIsQuizOpen(false)
              focusPanel('sidebar')
            }}
            className={`flex flex-1 items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-xs font-black transition-all shrink-0 whitespace-nowrap ${isSidebarOpen
                ? isDark
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40 ring-1 ring-purple-400'
                  : 'bg-purple-600 text-white shadow-md'
                : isDark
                  ? 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                  : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
          >
            <Menu size={14} className={isSidebarOpen ? 'text-white' : 'text-teal-400'} />
            <span>الفهرس</span>
          </button>

          {/* 2. النص الأصلي */}
          <button
            onClick={() => {
              setIsDocumentOpen(true)
              setIsSidebarOpen(false)
              setIsChatOpen(false)
              setIsMindmapOpen(false)
              setIsQuizOpen(false)
              focusPanel('document')
            }}
            className={`flex flex-1 items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-xs font-black transition-all shrink-0 whitespace-nowrap ${isDocumentOpen
                ? isDark
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40 ring-1 ring-purple-400'
                  : 'bg-purple-600 text-white shadow-md'
                : isDark
                  ? 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                  : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
          >
            <BookOpen size={14} className={isDocumentOpen ? 'text-white' : 'text-sky-400'} />
            <span>النص الأصلي</span>
          </button>

          {/* 3. المحادثة */}
          <button
            onClick={() => {
              setIsChatOpen(true)
              setIsSidebarOpen(false)
              setIsDocumentOpen(false)
              setIsMindmapOpen(false)
              setIsQuizOpen(false)
              focusPanel('chat')
            }}
            className={`flex flex-1 items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-xs font-black transition-all shrink-0 whitespace-nowrap ${isChatOpen
                ? isDark
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40 ring-1 ring-purple-400'
                  : 'bg-purple-600 text-white shadow-md'
                : isDark
                  ? 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                  : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
          >
            <MessageCircle size={14} className={isChatOpen ? 'text-white' : 'text-purple-400'} />
            <span>المحادثة</span>
          </button>

          {/* 4. الخريطة */}
          <button
            onClick={() => {
              setIsMindmapOpen(true)
              setIsSidebarOpen(false)
              setIsDocumentOpen(false)
              setIsChatOpen(false)
              setIsQuizOpen(false)
              focusPanel('mindmap')
            }}
            className={`flex flex-1 items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-xs font-black transition-all shrink-0 whitespace-nowrap ${isMindmapOpen
                ? isDark
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40 ring-1 ring-purple-400'
                  : 'bg-purple-600 text-white shadow-md'
                : isDark
                  ? 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                  : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
          >
            <Brain size={14} className={isMindmapOpen ? 'text-white' : 'text-sky-400'} />
            <span>الخريطة</span>
          </button>

          {/* 5. التقييم */}
          <button
            onClick={() => {
              setIsQuizOpen(true)
              setIsSidebarOpen(false)
              setIsDocumentOpen(false)
              setIsChatOpen(false)
              setIsMindmapOpen(false)
              focusPanel('quiz')
            }}
            className={`flex flex-1 items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-xs font-black transition-all shrink-0 whitespace-nowrap ${isQuizOpen
                ? isDark
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40 ring-1 ring-purple-400'
                  : 'bg-purple-600 text-white shadow-md'
                : isDark
                  ? 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                  : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
          >
            <ClipboardList size={14} className={isQuizOpen ? 'text-white' : 'text-emerald-400'} />
            <span>التقييم</span>
          </button>
        </div>
      )}

      {/* Floating Trigger in Top-Left Corner to expand header back */}
      <AnimatePresence>
        {isHeaderCollapsed && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={toggleHeaderCollapse}
            className={`absolute top-3 left-4 z-40 flex h-10 w-10 items-center justify-center rounded-full shadow-lg backdrop-blur-xl transition-all hover:scale-110 active:scale-95 ${isDark
              ? 'bg-[#12041f]/90 border border-purple-500/30 text-purple-200 shadow-purple-950/60 hover:bg-[#12041f] hover:border-purple-400'
              : 'bg-white/95 border border-purple-200 text-purple-900 shadow-purple-500/20 hover:bg-white hover:border-purple-300'
              }`}
            title="إظهار الشريط العلوي (خروج من وضع التركيز)"
          >
            <ChevronDown size={20} className="text-purple-500 stroke-[2.5]" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Content Workspace: Horizontal Multi-Panel Layout */}
      <div ref={workspaceRef} className="relative z-10 flex flex-1 overflow-x-auto min-w-0 scroll-smooth">
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
              اضغط على أي زر من التبويبات الخمسة بالأعلى 🔝 لفتح الفهرس، النص الأصلي، المحادثة، الخريطة، أو التقييم.
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
                    documentWidth={documentWidth}
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
                <span className={isDark ? 'text-purple-300' : 'text-purple-800'}>💡 ملاحظة: إذا أردت العودة للرئيسية مع حفظ تقدمك دون مسحه، يمكنك استخدام زر السهم (الرجوع).</span>
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
    </div>
  )
}
