import { useEffect, useRef, useState, useCallback } from 'react'
import {
  uid,
  DOMAINS,
  type Conversation,
  type Message,
  type ChatSessionDTO,
  type HistoryMessageDTO,
  type ChatHistoryResponseDTO,
  type CitationDTO
} from './data'
import { apiClient } from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, ACCENT_STYLES } from '../../contexts/ThemeContext'
import {
  Menu,
  MoreVertical,
  SquarePen,
  History,
  ArrowLeft,
  Loader2,
  Sparkles,
  Check,
  RotateCcw,
  Compass,
  Scale,
  BookOpenText,
  ChevronLeft,
  ChevronDown,
  Type
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import whiteLogo from '@/assets/images/WhiteLogo.png'
import zadDarkLogo from '@/assets/images/ZadDarkLogo.png'
import IslamicPattern from '../knowledge/components/IslamicPattern'
import LibrarySidebar from '../knowledge/components/LibrarySidebar'
import UserProfileModal from '../profile/UserProfileModal'

import { useSpeechRecognition } from './hooks/useSpeechRecognition'
import { ChatHistoryDrawer } from './components/ChatHistoryDrawer'
import { ChatInput } from './components/ChatInput'
import { Bubble, TypingBubble } from './components/ChatBubble'
import { BookProfileCard, type BookMeta } from './components/BookProfileCard'
import { LIGHT_RESPONSIVE_PAGE_BG, getGlassHeaderButtonClass as buildGlassHeaderButtonClass, getZadMaskStyle } from './chatTheme'

const FONT_OPTIONS = [
  { id: 'cairo', name: 'خط القاهرة', desc: 'عصري رقمي (افتراضي)', fontClass: 'font-cairo' },
  { id: 'amiri', name: 'الخط الأميري', desc: 'نسخ شرعي فاخر', fontClass: 'font-amiri' },
  { id: 'scheherazade', name: 'خط شهرزاد', desc: 'تقليدي للمصادر', fontClass: 'font-scheherazade' },
  { id: 'noto', name: 'خط النسخ (Noto)', desc: 'نسخ واضح للقراءة', fontClass: 'font-noto-naskh' },
  { id: 'ruqaa', name: 'خط الرقعة', desc: 'عارف رقعة إسلامي', fontClass: 'font-display' },
] as const

const ACCENT_SLIDER_CLASSES: Record<string, string> = {
  amber: 'accent-[#b88d46]',
  emerald: 'accent-teal-500',
  blue: 'accent-blue-600',
  purple: 'accent-purple-600',
}

function formatChatErrorMessage(error: unknown): string {
  const rawMsg =
    error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string'
      ? (error as any).message.trim()
      : ''

  if (rawMsg === 'User is not authorized.' || /unauthoriz|not authorized|\b401\b/i.test(rawMsg)) {
    return 'يرجى تسجيل الدخول أولاً لتتمكن من استخدام زاد وطرح الأسئلة وحفظ محادثاتك.'
  }

  const isTransientOrTechnical =
    !rawMsg ||
    /failed to fetch|networkerror|load failed|abort|timeout|\b50[0234]\b|cannot read properties|unexpected token|json/i.test(
      rawMsg,
    )

  if (isTransientOrTechnical) {
    return 'عذراً، لم يصل رد من المساعد الذكي حالياً بسبب تعذّر الاتصال بالخادم. يرجى المحاولة مرة أخرى.'
  }

  return `عذراً، تعذّر الحصول على رد من المساعد الذكي (${rawMsg}). يرجى المحاولة مرة أخرى.`
}

function appendReplyToConversation(
  prev: Conversation[],
  candidateIds: Array<string | null | undefined>,
  fallbackConv: Conversation,
  replyMsg: Message,
): Conversation[] {
  const ids = new Set(candidateIds.filter((id): id is string => Boolean(id)))
  const hasMatch = prev.some((c) => ids.has(c.id))
  if (!hasMatch) {
    return [{ ...fallbackConv, messages: [...fallbackConv.messages, replyMsg] }, ...prev]
  }
  return prev.map((c) => (ids.has(c.id) ? { ...c, messages: [...c.messages, replyMsg] } : c))
}

const SUGGESTED_PROMPTS = [
  {
    title: 'صلاة المسافر والقصر',
    question: 'ما حكم صلاة المسافر وما هي شروط الجمع والقصر المعتمدة؟',
    icon: <Compass className="w-4 h-4 shrink-0" />
  },
  {
    title: 'القواعد الفقهية والأصولية',
    question: 'ما هو الفرق الدقيق بين القواعد الفقهية والقواعد الأصولية؟',
    icon: <Scale className="w-4 h-4 shrink-0" />
  },
  {
    title: 'أصحاب الكتب الستة',
    question: 'من هم أئمة الكتب الستة في الحديث النبوي وتواريخ وفياتهم؟',
    icon: <BookOpenText className="w-4 h-4 shrink-0" />
  },
  {
    title: 'أحكام النية والطهارة',
    question: 'لخص لي مسائل النية في الوضوء والغسل وأحكام الشك فيها',
    icon: <Sparkles className="w-4 h-4 shrink-0" />
  },
]

export default function ChatScreen({
  onExit,
  onOpenVoice,
  initialQuestion,
  onConsumeInitial,
  pendingBook,
  onNavigateHome,
  onOpenKnowledge,
  onOpenStudy,
  onOpenLessons,
  onOpenAdmin,
  onOpenTurathRag,
  onOpenEngineControl,
  onOpenDataIngestion,
  onOpenV2PipelineAdmin,
  onOpenAdminLibrary,
  onOpenYoutubeImporter,
  onOpenSystemObservability,
  onLogin,
}: {
  onExit: () => void
  onOpenVoice: () => void
  initialQuestion?: string
  onConsumeInitial?: () => void
  pendingBook?: BookMeta | null
  onNavigateHome?: () => void
  onOpenKnowledge?: (tab?: any) => void
  onOpenStudy?: () => void
  onOpenLessons?: () => void
  onOpenAdmin?: () => void
  onOpenTurathRag?: () => void
  onOpenEngineControl?: () => void
  onOpenDataIngestion?: () => void
  onOpenV2PipelineAdmin?: () => void
  onOpenAdminLibrary?: () => void
  onOpenYoutubeImporter?: () => void
  onOpenSystemObservability?: () => void
  onLogin?: () => void
}) {
  const { isDark: dark, accentColor = 'amber' } = useTheme()
  const currentAccent = ACCENT_STYLES[accentColor] || ACCENT_STYLES.amber

  const [selectedBook, setSelectedBook] = useState<BookMeta | null>(pendingBook || null)

  useEffect(() => {
    if (pendingBook) {
      setSelectedBook(pendingBook)
    }
  }, [pendingBook])

  // Font Family state
  const [selectedFont, setSelectedFont] = useState<string>(() => {
    return localStorage.getItem('zad_selected_font') || 'cairo'
  })

  useEffect(() => {
    localStorage.setItem('zad_selected_font', selectedFont)
  }, [selectedFont])

  const activeFontOption = FONT_OPTIONS.find(f => f.id === selectedFont) || FONT_OPTIONS[0]
  const activeFontClass = activeFontOption.fontClass
  const sliderAccentClass = ACCENT_SLIDER_CLASSES[accentColor] || ACCENT_SLIDER_CLASSES.purple

  // Font Size state (scaled 80% to 140%)
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('zad_chat_font_size')
    return saved ? Number(saved) : 100
  })

  const updateFontSize = (nextSize: number) => {
    const clamped = Math.min(140, Math.max(80, nextSize))
    setFontSize(clamped)
    localStorage.setItem('zad_chat_font_size', String(clamped))
  }

  const handleResetFontSize = () => {
    updateFontSize(100)
  }

  const getFontStepButtonClass = (disabled: boolean) =>
    `p-2 rounded-xl transition-all ${disabled
      ? 'opacity-40 cursor-not-allowed'
      : dark
        ? 'bg-white/10 hover:bg-white/20 text-white/80 cursor-pointer active:scale-90'
        : 'bg-black/5 hover:bg-black/10 text-stone-700 cursor-pointer active:scale-90'
    }`

  // 3-Dots Menu Dropdown state
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
  const [isFontMenuOpen, setIsFontMenuOpen] = useState(false)
  const moreMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isMoreMenuOpen) {
      setIsFontMenuOpen(false)
    }
  }, [isMoreMenuOpen])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Platform Sidebar state
  const [isPlatformSidebarOpen, setIsPlatformSidebarOpen] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)

  // Chat History Drawer state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [input, setInput] = useState('')
  const [focused, setFocused] = useState(false)

  const [query, setQuery] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveIdState] = useState<string | null>(() => {
    const saved = sessionStorage.getItem('zad_active_session_id')
    return saved && !saved.startsWith('conv-') ? saved : null
  })

  const setActiveId = useCallback((id: string | null) => {
    setActiveIdState(id)
    if (id && !id.startsWith('conv-')) {
      sessionStorage.setItem('zad_active_session_id', id)
    } else {
      sessionStorage.removeItem('zad_active_session_id')
    }
  }, [])

  const [typing, setTyping] = useState(false)
  const [isStreamingMessage, setIsStreamingMessage] = useState(false)
  const handleStreamingChange = useCallback((streaming: boolean) => {
    setIsStreamingMessage(streaming)
  }, [])
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  const { isAuthenticated } = useAuth()

  const loadHistory = useCallback(async (sessionId: string) => {
    if (!isAuthenticated) return
    setIsLoadingHistory(true)
    try {
      const history = await apiClient<ChatHistoryResponseDTO>(`/api/Chat/sessions/${sessionId}`)
      const loadedMessages: Message[] = []
      history.messages.forEach(m => {
        loadedMessages.push({ id: `u-${m.id}`, role: 'user', text: m.question })
        let citationsArray: CitationDTO[] = []
        if (Array.isArray(m.citations)) {
          citationsArray = m.citations
        } else if (m.citations && typeof m.citations === 'object') {
          citationsArray = Object.values(m.citations)
        }
        const answerText = typeof m.answer === 'string' && m.answer.trim().length > 0 ? m.answer : ''
        loadedMessages.push({
          id: `a-${m.id}`,
          role: 'assistant',
          text: answerText || 'لم تتوفر إجابة من المساعد الذكي لهذه الرسالة.',
          citations: citationsArray,
          isError: !answerText,
        })
      })

      setConversations(prev => {
        const exists = prev.some(c => c.id === sessionId)
        if (!exists) {
          const newConv: Conversation = { id: sessionId, title: 'محادثة سابقة', group: 'المحادثات السابقة', messages: loadedMessages }
          return [newConv, ...prev]
        }
        return prev.map(c => (c.id === sessionId ? { ...c, messages: loadedMessages } : c))
      })
    } catch (err) {
      console.error('Failed to load history', err)
    } finally {
      setIsLoadingHistory(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    async function loadSessions() {
      if (!isAuthenticated) return
      setIsLoadingSessions(true)
      try {
        const sessions = await apiClient<ChatSessionDTO[]>('/api/Chat/sessions')
        const loadedConversations = sessions.map(s => ({
          id: s.id.toString(),
          title: s.name || 'محادثة جديدة',
          group: 'المحادثات السابقة',
          messages: []
        }))
        setConversations(prev => {
          const activeLocal = prev.filter(
            c => c.group === 'الآن' && !loadedConversations.some(loaded => loaded.id === c.id),
          )
          return [...activeLocal, ...loadedConversations]
        })

        const savedSessionId = sessionStorage.getItem('zad_active_session_id')
        if (savedSessionId && !savedSessionId.startsWith('conv-')) {
          setActiveId(savedSessionId)
          loadHistory(savedSessionId)
        }
      } catch (err) {
        console.error('Failed to load sessions', err)
      } finally {
        setIsLoadingSessions(false)
      }
    }
    loadSessions()
  }, [isAuthenticated, loadHistory, setActiveId])

  const active = conversations.find((c) => c.id === activeId) ?? null
  const hasChatStarted = active && active.messages.length > 0
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [active?.messages.length, typing])

  const [mode, setMode] = useState<number>(0)
  const [responseMode, setResponseMode] = useState<string>('student')

  const send = async (raw?: string, retryErrorMsgId?: string) => {
    const text = (raw ?? input).trim()
    if (!text || typing) return

    const userMsg: Message = { id: uid('u'), role: 'user', text }

    const isNew = !activeId
    const shouldCreateSession = !activeId || activeId.startsWith('conv-')
    const convId: string = activeId || uid('conv')
    const title = text.length > 34 ? `${text.slice(0, 34)}…` : text
    const fallbackConv: Conversation = { id: convId, title, group: 'الآن', messages: [userMsg] }

    if (isNew) {
      setConversations(prev => [fallbackConv, ...prev])
      setActiveId(convId)
    } else if (retryErrorMsgId) {
      setConversations(prev =>
        prev.map(c =>
          c.id === convId
            ? { ...c, messages: c.messages.filter(m => m.id !== retryErrorMsgId) }
            : c,
        ),
      )
    } else {
      setConversations(prev =>
        prev.map(c => (c.id === convId ? { ...c, messages: [...c.messages, userMsg] } : c)),
      )
    }

    if (!retryErrorMsgId) {
      setInput('')
    }
    setTyping(true)

    let realSessionId: string = convId

    try {
      if (shouldCreateSession) {
        const newSession = await apiClient<ChatSessionDTO>('/api/Chat/sessions', {
          method: 'POST',
          body: JSON.stringify({ name: text })
        })
        if (newSession && newSession.id != null) {
          realSessionId = newSession.id.toString()
          setConversations(prev =>
            prev.map(c => (c.id === convId ? { ...c, id: realSessionId } : c))
          )
          setActiveId(realSessionId)
        }
      }

      const historyMsg = await apiClient<HistoryMessageDTO>(`/api/Chat/sessions/${realSessionId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          question: text,
          mode: mode,
          responseMode: responseMode
        })
      })

      const trimmedAnswer = typeof historyMsg?.answer === 'string' ? historyMsg.answer.trim() : ''
      const hasAnswer = trimmedAnswer.length > 0
      const replyText = hasAnswer
        ? historyMsg.answer
        : 'عذراً، لم يَرِد رد من المساعد الذكي في الوقت الحالي. يرجى إعادة المحاولة مرة أخرى.'

      let citationsArray: CitationDTO[] = []
      if (hasAnswer) {
        if (Array.isArray(historyMsg?.citations)) {
          citationsArray = historyMsg.citations
        } else if (historyMsg?.citations && typeof historyMsg.citations === 'object') {
          citationsArray = Object.values(historyMsg.citations)
        }
      }

      const currentDomainLabel = DOMAINS[mode] ? DOMAINS[mode].label : 'الفقه'
      const replyMsg: Message = hasAnswer
        ? {
          id: uid('a'),
          role: 'assistant',
          text: replyText,
          citations: citationsArray,
          domain: (historyMsg as any)?.domain || currentDomainLabel,
          responseMode: (historyMsg as any)?.response_mode || (historyMsg as any)?.responseMode || responseMode,
          stream: true
        }
        : {
          id: uid('a'),
          role: 'assistant',
          text: replyText,
          isError: true,
          stream: false
        }

      setConversations(prev =>
        appendReplyToConversation(prev, [realSessionId, convId], { ...fallbackConv, id: realSessionId }, replyMsg),
      )
    } catch (error: unknown) {
      const errorMsg: Message = {
        id: uid('a'),
        role: 'assistant',
        text: formatChatErrorMessage(error),
        isError: true,
        stream: false,
      }
      setConversations(prev =>
        appendReplyToConversation(prev, [realSessionId, convId], { ...fallbackConv, id: realSessionId }, errorMsg),
      )
    } finally {
      setTyping(false)
    }
  }

  const startNewConversation = () => {
    setActiveId(null)
    setInput('')
    setIsHistoryOpen(false)
    setIsMoreMenuOpen(false)
  }

  useEffect(() => {
    if (initialQuestion && !activeId && conversations.length > 0) {
      setInput(initialQuestion)
      setTimeout(() => send(initialQuestion), 100)
      onConsumeInitial?.()
    }
  }, [initialQuestion, activeId, conversations.length])

  const getGlassHeaderButtonClass = (isActive = false) =>
    buildGlassHeaderButtonClass(dark, currentAccent, isActive)

  return (
    <div
      dir="rtl"
      className={`fixed inset-0 h-screen h-[100dvh] w-full flex flex-col overflow-hidden transition-colors duration-500 ${activeFontClass} ${dark ? 'text-white bg-[#0c0e14]' : `text-stone-900 ${LIGHT_RESPONSIVE_PAGE_BG[accentColor] || LIGHT_RESPONSIVE_PAGE_BG.amber}`
        }`}
    >
      {/* 1. Islamic Geometric Pattern Background with Dynamic Theme Color */}
      <IslamicPattern
        isFixed={true}
        opacity={dark ? 0.07 : 0.08}
        mobileOpacity={dark ? 0.05 : 0.09}
        mobileScale={1.25}
        mobileStrokeWidth={0.9}
        strokeColor={dark ? currentAccent.strokeDark : currentAccent.strokeLight}
        className="pointer-events-none transition-colors duration-300"
      />

      {/* 2. Floating Top Controls (Independent, immersive glass floating buttons) */}
      <div className="fixed top-0 inset-x-0 z-30 pt-3 sm:pt-4 px-3 sm:px-6 flex items-center justify-between pointer-events-none">
        {/* Right (RTL start): Main Sidebar Button + Zad Logo in Theme Color + 'زاد' */}
        <div className="flex items-center gap-2.5 sm:gap-3 pointer-events-auto">
          <button
            type="button"
            aria-label="القائمة الرئيسية"
            title="القائمة الرئيسية"
            onClick={() => setIsPlatformSidebarOpen(true)}
            className={getGlassHeaderButtonClass()}
          >
            <Menu size={20} strokeWidth={2.2} />
          </button>

          <div
            onClick={onNavigateHome || onExit}
            className="flex items-center gap-2 cursor-pointer select-none group px-1 py-1 rounded-xl transition-all hover:opacity-90"
            title="الرئيسية"
          >
            <div
              className="h-7 w-7 sm:h-8 sm:w-8 transition-colors duration-200 shrink-0"
              style={getZadMaskStyle(whiteLogo, dark ? currentAccent.logoDark : currentAccent.logoLight)}
              aria-hidden="true"
            />
            <span
              className="font-display font-black text-xl sm:text-2xl leading-none select-none transition-colors"
              style={{ color: dark ? currentAccent.logoDark : currentAccent.logoLight }}
            >
              زاد
            </span>
          </div>
        </div>

        {/* Left (RTL end): Floating Glass Buttons (New Chat, 3-Dots Menu, Back/Exit) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* New Chat Button */}
          <button
            type="button"
            aria-label="محادثة جديدة"
            title="محادثة جديدة"
            onClick={startNewConversation}
            className={getGlassHeaderButtonClass()}
          >
            <SquarePen size={18} strokeWidth={2.2} />
          </button>

          {/* 3-Dots Menu Dropdown */}
          <div className="relative" ref={moreMenuRef}>
            <button
              type="button"
              aria-label="المزيد من الخيارات"
              title="المزيد من الخيارات"
              onClick={() => setIsMoreMenuOpen(prev => !prev)}
              className={getGlassHeaderButtonClass(isMoreMenuOpen)}
            >
              <MoreVertical size={18} strokeWidth={2.2} />
            </button>

            <AnimatePresence>
              {isMoreMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className={`absolute left-0 mt-2 w-72 max-w-[calc(100vw-24px)] rounded-2xl p-2.5 shadow-2xl z-50 border backdrop-blur-2xl ${dark
                    ? 'bg-[#121622]/98 border-white/15 text-white shadow-[0_15px_45px_rgba(0,0,0,0.7)]'
                    : `bg-white/98 ${currentAccent.lightBorder} text-stone-900 shadow-xl`
                    }`}
                >
                  {/* 1. Chat History Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreMenuOpen(false)
                      setIsHistoryOpen(true)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-right transition-all font-sans font-bold text-xs sm:text-sm cursor-pointer ${dark ? 'hover:bg-white/5 text-white' : `${currentAccent.lightBgHover} text-stone-800`
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg ${dark ? `${currentAccent.darkBgBadge} ${currentAccent.darkText}` : `${currentAccent.lightBgBadge} ${currentAccent.lightText}`}`}>
                        <History size={16} />
                      </div>
                      <span>سجل المحادثات</span>
                    </div>
                    <span className="text-[11px] opacity-60 font-sans font-normal">
                      {conversations.length} محادثة
                    </span>
                  </button>

                  <div className={`my-2 border-t ${dark ? 'border-white/10' : 'border-stone-200/60'}`} />

                  {/* 2. Font Size Range Slider (matching Library Mode) */}
                  <div className="px-3 py-1.5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className={dark ? 'text-white/80' : 'text-stone-700'}>حجم الخط</span>
                      <div className="flex items-center gap-1.5">
                        {fontSize !== 100 && (
                          <button
                            type="button"
                            onClick={handleResetFontSize}
                            title="إعادة ضبط الحجم الطبيعي (100%)"
                            className={`p-1 rounded-md border text-[10px] transition-all cursor-pointer ${dark ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70' : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-600'
                              }`}
                          >
                            <RotateCcw size={11} />
                          </button>
                        )}
                        <span className={`text-[11px] font-sans font-bold px-2 py-0.5 rounded-md ${dark ? `bg-white/10 ${currentAccent.darkText}` : `${currentAccent.lightBgBadge} ${currentAccent.lightText}`
                          }`}>
                          {fontSize}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateFontSize(fontSize - 5)}
                        disabled={fontSize <= 80}
                        title="تصغير الخط"
                        className={getFontStepButtonClass(fontSize <= 80)}
                      >
                        <Type className="h-3.5 w-3.5" />
                      </button>
                      <input
                        type="range"
                        min={80}
                        max={140}
                        step={5}
                        value={fontSize}
                        aria-label="حجم الخط"
                        onChange={(e) => updateFontSize(Number(e.target.value))}
                        className={`flex-1 ${sliderAccentClass} h-2 rounded-full appearance-none outline-none cursor-pointer ${dark ? 'bg-white/20 hover:bg-white/30' : 'bg-black/10 hover:bg-black/20'
                          }`}
                      />
                      <button
                        type="button"
                        onClick={() => updateFontSize(fontSize + 5)}
                        disabled={fontSize >= 140}
                        title="تكبير الخط"
                        className={getFontStepButtonClass(fontSize >= 140)}
                      >
                        <Type className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>

                  {/* 3. Font Family Dropdown */}
                  <div className="px-1.5 pt-1 pb-0.5">
                    <div className={`flex flex-col rounded-xl border overflow-hidden transition-all ${dark ? 'border-white/10 bg-white/[0.03]' : 'border-stone-200/80 bg-stone-50/70'
                      }`}>
                      <button
                        type="button"
                        onClick={() => setIsFontMenuOpen(prev => !prev)}
                        aria-expanded={isFontMenuOpen}
                        className={`flex items-center justify-between px-2.5 py-2 transition-all text-xs font-bold cursor-pointer ${dark ? 'hover:bg-white/5 text-white' : 'hover:bg-black/5 text-stone-800'
                          }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center ${dark ? `${currentAccent.darkBgBadge} ${currentAccent.darkText}` : `${currentAccent.lightBgBadge} ${currentAccent.lightText}`
                            }`}>
                            <Type className="w-4 h-4" />
                          </div>
                          <div className="flex items-center gap-1.5 text-right min-w-0">
                            <span className={`text-[11px] font-semibold shrink-0 ${dark ? 'text-white/60' : 'text-stone-500'}`}>نوع الخط:</span>
                            <span className={`text-xs font-bold truncate ${activeFontOption.fontClass}`}>
                              {activeFontOption.name}
                            </span>
                          </div>
                        </div>
                        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${dark ? 'text-white/60' : 'text-stone-500'
                          } ${isFontMenuOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isFontMenuOpen && (
                        <div className={`p-1.5 border-t flex flex-col gap-1 ${dark ? 'border-white/10 bg-black/20' : 'border-stone-200/70 bg-white/70'
                          }`}>
                          {FONT_OPTIONS.map((f) => {
                            const isSelected = f.id === selectedFont
                            return (
                              <button
                                key={f.id}
                                type="button"
                                onClick={() => {
                                  setSelectedFont(f.id)
                                  setIsFontMenuOpen(false)
                                }}
                                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${f.fontClass} ${isSelected
                                  ? dark
                                    ? `${currentAccent.darkBgBadge} border ${currentAccent.darkBorderHover} ${currentAccent.darkText} font-bold`
                                    : `${currentAccent.lightBgBadge} border ${currentAccent.lightBorder} ${currentAccent.lightText} font-bold`
                                  : dark
                                    ? 'hover:bg-white/5 text-white/80 border border-transparent'
                                    : 'hover:bg-stone-100 text-stone-700 border border-transparent'
                                  }`}
                              >
                                <span className="truncate">{f.name}</span>
                                {isSelected && <Check size={13} strokeWidth={3} className={dark ? currentAccent.darkText : currentAccent.lightText} />}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Exit / Return Button */}
          <button
            type="button"
            aria-label="العودة"
            title="العودة"
            onClick={onExit}
            className={getGlassHeaderButtonClass()}
          >
            <ArrowLeft size={18} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* 3. Full-height Scroll Area for Messages & Welcome Content */}
      <div
        className="absolute inset-0 z-10 overflow-y-auto px-2 sm:px-4 pt-16 pb-36 custom-scrollbar"
        ref={scrollRef}
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0px, black 20px, black calc(100% - 115px), transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, black 20px, black calc(100% - 115px), transparent 100%)'
        }}
      >
        {selectedBook && (
          <BookProfileCard
            book={selectedBook}
            onAskQuestion={(q) => send(q)}
          />
        )}

        {/* Empty State: Dignified Header + 2x2 Interactive Suggestion Grid */}
        {!hasChatStarted && !selectedBook && (
          <div className="flex min-h-[70vh] flex-col items-center justify-center max-w-2xl mx-auto px-4 py-6 sm:py-8">
            {/* Stable, Stately Welcome Title (No continuous deleting) */}
            <div className="text-center mb-6 sm:mb-8 max-w-xl px-2">
              <h1 className={`font-amiri font-bold text-[26px] sm:text-[34px] leading-[1.55] tracking-normal ${dark ? 'text-white' : 'text-stone-900'}`}>
                اسأل زاد عما يُشكل عليك في العلوم الشرعية
              </h1>
              <p className={`mt-2.5 text-xs sm:text-sm font-sans leading-relaxed ${dark ? 'text-white/70' : 'text-stone-600'}`}>
                إجابات موثقة وتأصيل علمي دقيق مستخرج من أمهات كتب الفقه والحديث والتفسير والعقيدة
              </p>
            </div>

            {/* 2x2 Interactive Question Suggestion Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5 max-w-2xl w-full px-1">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => send(prompt.question)}
                  className={`group relative flex items-center sm:items-start gap-3 p-3.5 sm:p-4 rounded-2xl text-right transition-all duration-300 border cursor-pointer ${dark
                    ? `bg-[#121622]/80 backdrop-blur-xl ${currentAccent.darkBorder} text-white/90 ${currentAccent.darkBorderHover} hover:bg-[#181d2c] hover:shadow-lg hover:-translate-y-0.5`
                    : `bg-white/90 backdrop-blur-xl ${currentAccent.lightBorder} text-stone-800 ${currentAccent.lightBorderHover} ${currentAccent.lightBgHover} hover:shadow-md hover:-translate-y-0.5`
                    }`}
                >
                  <div className={`p-2.5 rounded-xl shrink-0 transition-transform group-hover:scale-110 ${dark ? `${currentAccent.darkBgBadge} ${currentAccent.darkText}` : `${currentAccent.lightBgBadge} ${currentAccent.lightText}`
                    }`}>
                    {prompt.icon}
                  </div>
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <span className="hidden sm:block font-sans font-bold text-sm leading-tight text-current">
                      {prompt.title}
                    </span>
                    <span className={`font-sans text-xs leading-relaxed font-semibold sm:font-normal ${dark ? 'text-white/90 sm:text-white/60 group-hover:text-white sm:group-hover:text-white/80' : 'text-stone-800 sm:text-stone-500 group-hover:text-stone-900 sm:group-hover:text-stone-700'
                      }`}>
                      {prompt.question}
                    </span>
                  </div>
                  <ChevronLeft size={16} className={`shrink-0 self-center opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all ${dark ? currentAccent.darkText : currentAccent.lightText
                    }`} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Bubbles List */}
        {hasChatStarted && (
          <div
            className="mx-auto flex w-full max-w-4xl flex-col gap-6 py-4"
            style={{ zoom: fontSize !== 100 ? `${fontSize}%` : undefined }}
          >
            {isLoadingHistory && active?.messages.length === 0 ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className={`animate-spin ${dark ? currentAccent.darkText : currentAccent.lightText}`} size={32} />
              </div>
            ) : (
              active?.messages.map((m, i) => {
                const retryQuestion = m.isError
                  ? [...(active?.messages.slice(0, i) || [])]
                    .reverse()
                    .find((prevMsg) => prevMsg.role === 'user')?.text
                  : undefined
                return (
                  <Bubble
                    key={m.id}
                    message={m}
                    dark={dark}
                    onRetry={retryQuestion ? () => send(retryQuestion, m.id) : undefined}
                    onStreamingChange={i === (active?.messages.length ?? 0) - 1 ? handleStreamingChange : undefined}
                  />
                )
              })
            )}
            {typing && <TypingBubble dark={dark} />}
          </div>
        )}
      </div>

      {/* 4. Composer Input Bar */}
      <div className="fixed bottom-0 inset-x-0 z-20 pointer-events-none transition-colors duration-500 pt-6 pb-2">
        <div className="pointer-events-auto">
          <ChatInput
            input={input}
            setInput={setInput}
            send={send}
            dark={dark}
            onOpenVoice={onOpenVoice}
            setFocused={setFocused}
            mode={mode}
            setMode={setMode}
            responseMode={responseMode}
            setResponseMode={setResponseMode}
            selectedBook={selectedBook}
            onClearBook={() => setSelectedBook(null)}
            disabled={typing || isStreamingMessage}
          />
        </div>
      </div>

      {/* 5. Chat History Drawer */}
      <ChatHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        dark={dark}
        query={query}
        setQuery={setQuery}
        conversations={conversations}
        isLoadingSessions={isLoadingSessions}
        activeId={activeId}
        setActiveId={setActiveId}
        startNewConversation={startNewConversation}
        loadHistory={loadHistory}
      />

      {/* 6. Platform Main Sidebar Drawer */}
      <LibrarySidebar
        isOpen={isPlatformSidebarOpen}
        onClose={() => setIsPlatformSidebarOpen(false)}
        theme={dark ? 'dark' : 'light'}
        activeMainTab="chat"
        counts={{
          domains: 40,
          authors: 3177,
          favorites: 0,
          narrators: '18.9K',
          downloads: 0,
          books: 337,
        }}
        recentBook={null}
        onSelectTab={(tab) => {
          setIsPlatformSidebarOpen(false)
          onOpenKnowledge?.(tab)
        }}
        onReadRecentBook={() => { }}
        onOpenProfile={() => {
          setIsPlatformSidebarOpen(false)
          setShowProfileModal(true)
        }}
        onNavigateGlobal={(view) => {
          setIsPlatformSidebarOpen(false)
          if (view === 'profile') setShowProfileModal(true)
          else if (view === 'home') onNavigateHome ? onNavigateHome() : onExit()
          else if (view === 'voice') onOpenVoice()
          else if (view === 'knowledge') onOpenKnowledge?.()
          else if (view === 'study') onOpenStudy?.()
          else if (view === 'lessons') onOpenLessons?.()
          else if (view === 'admin') onOpenAdmin?.()
          else if (view === 'turath_rag') onOpenTurathRag?.()
          else if (view === 'engine_control') onOpenEngineControl?.()
          else if (view === 'data_ingestion') onOpenDataIngestion?.()
          else if (view === 'v2_pipeline_admin') onOpenV2PipelineAdmin?.()
          else if (view === 'admin_library') onOpenAdminLibrary?.()
          else if (view === 'youtube_importer') onOpenYoutubeImporter?.()
          else if (view === 'system_observability') onOpenSystemObservability?.()
        }}
        onExit={onExit}
        onLogin={onLogin}
      />

      {showProfileModal && (
        <UserProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  )
}
