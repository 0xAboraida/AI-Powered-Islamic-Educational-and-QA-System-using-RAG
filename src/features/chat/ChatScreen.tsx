
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
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
import { useTheme } from '../../contexts/ThemeContext'
import { Moon, Sun, ArrowLeft, AlignRight, X, XCircle, Loader2, Maximize2, Minimize2, Type, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import bgDark from '@/assets/images/image.webp'
import bgLight from '@/assets/images/bg-islamic-light.webp'
import whiteLogo from '@/assets/images/WhiteLogo.png'
import zadDarkLogo from '@/assets/images/ZadDarkLogo.png'
import Starfield from '../../components/layout/Starfield'

import { useSpeechRecognition, type Status } from './hooks/useSpeechRecognition'
import { ChatHistoryDrawer } from './components/ChatHistoryDrawer'
import { ChatInput } from './components/ChatInput'
import { Bubble, TypingBubble } from './components/ChatBubble'
import { TextSelectionToolbar } from '@/components/common/TextSelectionToolbar'
import { BookProfileCard, type BookMeta } from './components/BookProfileCard'

const FONT_OPTIONS = [
  { id: 'cairo', name: 'خط القاهرة', desc: 'عصري رقمي (افتراضي)', fontClass: 'font-cairo' },
  { id: 'amiri', name: 'الخط الأميري', desc: 'نسخ شرعي فاخر', fontClass: 'font-amiri' },
  { id: 'scheherazade', name: 'خط شهرزاد', desc: 'تقليدي للمصادر', fontClass: 'font-scheherazade' },
  { id: 'noto', name: 'خط النسخ (Noto)', desc: 'نسخ واضح للقراءة', fontClass: 'font-noto-naskh' },
  { id: 'ruqaa', name: 'خط الرقعة', desc: 'عارف رقعة إسلامي', fontClass: 'font-display' },
] as const

const STATUS_TEXT: Record<Status, string> = {
  idle: 'مرحبًا بك، اكتب سؤالك لأجيبك من أمهات الكتب…',
  listening: 'أستمع إليك الآن…',
  thinking: 'أفكّر في إجابتك…',
  speaking: 'زاد يتحدّث…',
}

export default function ChatScreen({
  onExit,
  onOpenVoice,
  initialQuestion,
  onConsumeInitial,
  pendingBook,
}: {
  onExit: () => void
  onOpenVoice: () => void
  initialQuestion?: string
  onConsumeInitial?: () => void
  pendingBook?: BookMeta | null
}) {
  const { isDark: dark, toggleTheme } = useTheme()
  const [selectedBook, setSelectedBook] = useState<BookMeta | null>(pendingBook || null)

  useEffect(() => {
    if (pendingBook) {
      setSelectedBook(pendingBook)
    }
  }, [pendingBook])
  const [selectedFont, setSelectedFont] = useState<string>(() => {
    return localStorage.getItem('zad_selected_font') || 'cairo'
  })
  const [isFontMenuOpen, setIsFontMenuOpen] = useState(false)
  const fontMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    localStorage.setItem('zad_selected_font', selectedFont)
  }, [selectedFont])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fontMenuRef.current && !fontMenuRef.current.contains(e.target as Node)) {
        setIsFontMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const activeFontClass = FONT_OPTIONS.find(f => f.id === selectedFont)?.fontClass || 'font-cairo'

  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [typedIdleText, setTypedIdleText] = useState('')
  const [input, setInput] = useState('')
  const [focused, setFocused] = useState(false)

  const [query, setQuery] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveIdState] = useState<string | null>(() => {
    return sessionStorage.getItem('zad_active_session_id')
  })

  const setActiveId = useCallback((id: string | null) => {
    setActiveIdState(id)
    if (id) {
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
  const { status, isCallActive, transcript, reply, supported, handleMic, volume } = useSpeechRecognition()

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
        loadedMessages.push({ id: `a-${m.id}`, role: 'assistant', text: m.answer, citations: citationsArray })
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
        setConversations(loadedConversations)

        const savedSessionId = sessionStorage.getItem('zad_active_session_id')
        if (savedSessionId) {
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

  const firstAvatarRef = useRef<HTMLSpanElement>(null)
  const [orbStyle, setOrbStyle] = useState<React.CSSProperties>({})

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [active?.messages.length, typing])

  useEffect(() => {
    if (hasChatStarted) {
      // Use requestAnimationFrame to wait for the DOM to render the bubble
      requestAnimationFrame(() => {
        if (firstAvatarRef.current) {
          const rect = firstAvatarRef.current.getBoundingClientRect()
          setOrbStyle({
            top: `${rect.top + rect.height / 2}px`,
            left: `${rect.left + rect.width / 2}px`,
            transform: `translate(-50%, -50%) scale(0.16)`, // Scale perfectly to match the 36px avatar
            opacity: 0,
            transition: 'top 1000ms cubic-bezier(0.2, 0.8, 0.2, 1), left 1000ms cubic-bezier(0.2, 0.8, 0.2, 1), transform 1000ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 200ms ease 800ms',
          })
        }
      })
    } else {
      setOrbStyle({
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) scale(1)',
        opacity: 1,
        transition: 'all 1000ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      })
    }
  }, [hasChatStarted, typing])

  const [mode, setMode] = useState<number>(0)
  const [responseMode, setResponseMode] = useState<string>('student')
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error enabling fullscreen: ${err.message}`)
      })
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim()
    if (!text || typing) return

    const userMsg: Message = { id: uid('u'), role: 'user', text }

    // Create a local session ID if none exists yet to give immediate UI feedback
    const isNew = !activeId
    const convId: string = activeId || uid('conv')

    if (isNew) {
      const title = text.length > 34 ? `${text.slice(0, 34)}…` : text
      const newConv: Conversation = { id: convId, title, group: 'الآن', messages: [userMsg] }
      setConversations(prev => [newConv, ...prev])
      setActiveId(convId)
    } else {
      setConversations(prev =>
        prev.map(c => (c.id === convId ? { ...c, messages: [...c.messages, userMsg] } : c))
      )
    }

    setInput('')
    setTyping(true)

    try {
      let realSessionId: string = convId

      // If this is a brand new conversation, create the session on the backend
      if (isNew) {
        const newSession = await apiClient<ChatSessionDTO>('/api/Chat/sessions', {
          method: 'POST',
          body: JSON.stringify({ name: text })
        })
        if (newSession && newSession.id) {
          realSessionId = newSession.id.toString()
          // Update conversation ID in state to match backend session ID
          setConversations(prev =>
            prev.map(c => (c.id === convId ? { ...c, id: realSessionId } : c))
          )
          setActiveId(realSessionId)
        }
      }

      // Send the question message
      const historyMsg = await apiClient<HistoryMessageDTO>(`/api/Chat/sessions/${realSessionId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          question: text,
          mode: mode,
          responseMode: responseMode
        })
      })

      const replyText = historyMsg.answer || 'لم أتمكن من الحصول على إجابة، يرجى المحاولة لاحقاً.'

      let citationsArray: CitationDTO[] = []
      if (Array.isArray(historyMsg.citations)) {
        citationsArray = historyMsg.citations
      } else if (historyMsg.citations && typeof historyMsg.citations === 'object') {
        citationsArray = Object.values(historyMsg.citations)
      }

      const currentDomainLabel = DOMAINS[mode] ? DOMAINS[mode].label : 'الفقه'
      const replyMsg: Message = {
        id: uid('a'),
        role: 'assistant',
        text: replyText,
        citations: citationsArray,
        domain: (historyMsg as any).domain || currentDomainLabel,
        responseMode: (historyMsg as any).response_mode || (historyMsg as any).responseMode || responseMode,
        stream: true
      }

      setConversations((prev) =>
        prev.map((c) => (c.id === realSessionId || c.id === convId ? { ...c, messages: [...c.messages, replyMsg] } : c)),
      )
    } catch (error: any) {
      const errorText = error.message === 'User is not authorized.' || error.message?.includes('authorized')
        ? 'يرجى تسجيل الدخول أولاً لتتمكن من استخدام زاد وطرح الأسئلة وحفظ محادثاتك.'
        : `عذراً، حدث خطأ: ${error.message}`

      const errorMsg: Message = { id: uid('a'), role: 'assistant', text: errorText }
      setConversations((prev) =>
        prev.map((c) => (c.id === convId || c.id === activeId ? { ...c, messages: [...c.messages, errorMsg] } : c)),
      )
    } finally {
      setTyping(false)
    }
  }

  const startNewConversation = () => {
    setActiveId(null)
    setInput('')
    setIsHistoryOpen(false)
  }

  useEffect(() => {
    if (status !== 'idle') {
      setTypedIdleText('')
      return
    }
    const texts = [
      'مرحبًا بك، اكتب سؤالك لأجيبك من أمهات الكتب الشرعية…',
      'كيف يمكنني مساعدتك في بحثك العلمي اليوم؟',
      'أنا هنا لتوفير الإجابات الموثقة من المصادر المعتمدة…',
      'اسألني في الفقه، العقيدة، التفسير، الحديث، السيرة, علوم القرآن، التارخ، النحو والصرف…'
    ]
    let textIndex = 0
    let i = 0
    let isDeleting = false
    let timer: NodeJS.Timeout

    const tick = () => {
      const currentText = texts[textIndex]
      if (!isDeleting) {
        setTypedIdleText(currentText.slice(0, i + 1))
        i++
        if (i === currentText.length) {
          isDeleting = true
          timer = setTimeout(tick, 2000)
        } else {
          timer = setTimeout(tick, 70)
        }
      } else {
        setTypedIdleText(currentText.slice(0, i - 1))
        i--
        if (i === 0) {
          isDeleting = false
          textIndex = (textIndex + 1) % texts.length
          timer = setTimeout(tick, 500)
        } else {
          timer = setTimeout(tick, 15)
        }
      }
    }
    timer = setTimeout(tick, 100)
    return () => clearTimeout(timer)
  }, [status])

  useEffect(() => {
    if (initialQuestion && !activeId && conversations.length > 0) {
      setInput(initialQuestion)
      setTimeout(() => send(initialQuestion), 100)
      onConsumeInitial?.()
    }
  }, [initialQuestion, activeId, conversations.length])

  return (
    <div
      dir="rtl"
      className={`fixed inset-0 h-screen h-[100dvh] w-full flex flex-col overflow-hidden transition-colors duration-500 ${activeFontClass} ${dark ? 'text-white bg-[#12041f]' : 'text-brand-deep bg-[#faf7ff]'
        }`}
    >
      {/* Background Image Layers - Crossfade Animation */}
      <img
        src={bgDark}
        alt=""
        aria-hidden
        className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${dark ? 'opacity-100' : 'opacity-0'
          }`}
      />
      <img
        src={bgLight}
        alt=""
        aria-hidden
        className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${dark ? 'opacity-0' : 'opacity-100'
          }`}
      />
      {dark && <Starfield count={60} />}

      {/* Soft scrim to ensure UI readability */}
      <div
        className={`pointer-events-none absolute inset-0 ${dark ? 'bg-[#12041f]/60' : 'bg-white/40'
          }`}
      />
      {/* Top bar */}
      <header className={`fixed top-0 inset-x-0 z-30 pt-4 pb-8 px-4 sm:px-6 flex items-center justify-between transition-colors duration-500`}>
        <button
          type="button"
          aria-label="سجل المحادثات"
          onClick={() => setIsHistoryOpen(true)}
          className={`flex h-11 w-11 items-center justify-center rounded-full text-lg transition-all ${dark
            ? 'bg-[#a855f7]/15 backdrop-blur-md border border-[#a855f7]/30 hover:bg-[#a855f7]/25 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] text-purple-100'
            : 'bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary'
            }`}
        >
          <AlignRight size={22} strokeWidth={2.5} />
        </button>

        <div className="flex items-center gap-3">
          {/* Font Selector Button & Dropdown */}
          <div className="relative" ref={fontMenuRef}>
            <button
              type="button"
              aria-label="تغيير نوع الخط"
              title="تغيير نوع الخط"
              onClick={() => setIsFontMenuOpen(prev => !prev)}
              className={`flex h-11 w-11 items-center justify-center rounded-full text-lg transition-all ${dark
                ? 'bg-[#a855f7]/15 backdrop-blur-md border border-[#a855f7]/30 hover:bg-[#a855f7]/25 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] text-purple-100'
                : 'bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary'
                } ${isFontMenuOpen ? (dark ? 'bg-[#a855f7]/35 border-[#a855f7]/60 ring-2 ring-purple-500/40' : 'bg-primary/25 border-primary/40 ring-2 ring-primary/30') : ''}`}
            >
              <Type size={20} strokeWidth={2.5} />
            </button>

            <AnimatePresence>
              {isFontMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className={`absolute left-0 mt-3 w-64 rounded-2xl p-2.5 shadow-2xl z-50 border backdrop-blur-xl ${dark
                    ? 'bg-[#18082a]/95 border-purple-500/30 text-white shadow-[0_10px_35px_rgba(0,0,0,0.6)]'
                    : 'bg-white/95 border-purple-200 text-purple-950 shadow-[0_10px_35px_rgba(124,58,237,0.18)]'
                    }`}
                >
                  <div className={`px-3 py-2 text-xs font-extrabold border-b mb-1.5 flex items-center justify-between ${dark ? 'border-white/10 text-purple-300' : 'border-purple-100 text-purple-800'
                    }`}>
                    <span>اختر نوع خط القراءة</span>
                    <span className="text-[10px] opacity-75 font-normal">تأثير فوري</span>
                  </div>
                  <div className="space-y-1">
                    {FONT_OPTIONS.map((font) => {
                      const isSelected = font.id === selectedFont
                      return (
                        <button
                          key={font.id}
                          type="button"
                          onClick={() => {
                            setSelectedFont(font.id)
                            setIsFontMenuOpen(false)
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-right transition-all ${font.fontClass} ${isSelected
                            ? dark
                              ? 'bg-purple-600/35 border border-purple-400/50 text-purple-200 shadow-sm'
                              : 'bg-purple-100/90 border border-purple-300 text-purple-900 font-bold'
                            : dark
                              ? 'hover:bg-white/5 text-white/80 hover:text-white'
                              : 'hover:bg-purple-50/80 text-gray-700 hover:text-purple-900'
                            }`}
                        >
                          <div className="flex flex-col items-start text-right">
                            <span className="text-[15px] leading-snug">{font.name}</span>
                            <span className={`text-[11px] opacity-70 font-sans`}>{font.desc}</span>
                          </div>
                          {isSelected && (
                            <Check size={18} className={dark ? 'text-emerald-400' : 'text-purple-700'} strokeWidth={3} />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            aria-label={isFullscreen ? 'تصغير الشاشة' : 'تكبير الشاشة (ملء الشاشة)'}
            title={isFullscreen ? 'تصغير الشاشة' : 'تكبير الشاشة (ملء الشاشة)'}
            onClick={toggleFullscreen}
            className={`flex h-11 w-11 items-center justify-center rounded-full text-lg transition-all ${dark
              ? 'bg-[#a855f7]/15 backdrop-blur-md border border-[#a855f7]/30 hover:bg-[#a855f7]/25 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] text-purple-100'
              : 'bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary'
              }`}
          >
            {isFullscreen ? <Minimize2 size={20} strokeWidth={2.5} /> : <Maximize2 size={20} strokeWidth={2.5} />}
          </button>
          <button
            type="button"
            aria-label={dark ? 'الوضع النهاري' : 'الوضع الليلي'}
            onClick={toggleTheme}
            className={`flex h-11 w-11 items-center justify-center rounded-full text-lg transition-all ${dark
              ? 'bg-[#a855f7]/15 backdrop-blur-md border border-[#a855f7]/30 hover:bg-[#a855f7]/25 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] text-purple-100'
              : 'bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary'
              }`}
          >
            <div className={`transition-all duration-700 ${dark ? 'rotate-0' : 'rotate-[360deg] scale-110'}`}>
              {dark ? <Moon size={22} strokeWidth={2.5} /> : <Sun size={22} strokeWidth={2.5} />}
            </div>
          </button>
          <button
            type="button"
            aria-label="إنهاء المحادثة الحالية"
            onClick={() => {
              if (activeId) {
                setConfirmClose(true)
              } else {
                onExit()
              }
            }}
            className={`flex h-11 w-11 items-center justify-center rounded-full text-lg transition-all ${dark
              ? 'bg-red-500/15 backdrop-blur-md border border-red-500/30 hover:bg-red-500/25 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] text-red-200'
              : 'bg-red-50 border border-red-200 hover:bg-red-100 text-red-500'
              }`}
          >
            <X size={22} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            aria-label="العودة للموقع"
            onClick={onExit}
            className={`flex h-11 w-11 items-center justify-center rounded-full text-lg transition-all ${dark
              ? 'bg-[#a855f7]/15 backdrop-blur-md border border-[#a855f7]/30 hover:bg-[#a855f7]/25 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] text-purple-100'
              : 'bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary'
              }`}
          >
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>
        </div>
      </header>

      {/* Center Orb (Calculated morph to the first AI avatar position) */}
      {!selectedBook && (
        <div
          className="absolute z-20 pointer-events-none"
          style={hasChatStarted ? orbStyle : {
            top: '42%',
            left: '50%',
            transform: 'translate(-50%, -50%) scale(1)',
            opacity: 1,
            transition: 'all 1000ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        >
          <div className="relative flex items-center justify-center">
            {/* Dynamic Glow Ring */}
            <span
              className="absolute rounded-full blur-[35px] transition-opacity duration-300 opacity-80"
              style={{
                width: '250px',
                height: '250px',
                background: 'conic-gradient(from 0deg, transparent 0%, rgba(192,32,240,0.8) 40%, rgba(168,85,247,0.9) 60%, transparent 100%)',
              }}
            />

            {/* Main Logo Orb */}
            <div
              className={`relative flex h-56 w-56 items-center justify-center rounded-full z-10 ${dark ? 'bg-[#0f041c]/60 backdrop-blur-xl border border-white/10' : 'bg-white border border-primary/10'
                }`}
              style={{
                boxShadow: '0 0 40px rgba(168,85,247, 0.4)',
              }}
            >
              <img
                src={dark ? whiteLogo : zadDarkLogo}
                alt="شعار زاد"
                className={`object-contain drop-shadow-2xl transition-transform duration-500 ${dark ? 'h-32 w-32 scale-100' : 'h-32 w-32 scale-[1.5]'}`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Full-height Scroll Area for Messages */}
      <div
        className="absolute inset-0 z-10 overflow-y-auto px-2 sm:px-4 pt-24 sm:pt-28 pb-36 sm:pb-40 custom-scrollbar"
        ref={scrollRef}
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0px, black 96px, black calc(100% - 130px), transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, black 96px, black calc(100% - 130px), transparent 100%)'
        }}
      >
        {selectedBook && (
          <BookProfileCard
            book={selectedBook}
            onAskQuestion={(q) => send(q)}
          />
        )}

        {!hasChatStarted && !selectedBook && (
          <div className="flex h-full flex-col items-center justify-center">
            {/* The orb occupies this space physically to push text down */}
            <div className="h-[220px]" />
            <h1
              className={`mt-16 font-display font-bold text-xl md:text-2xl text-center max-w-2xl px-4 ${dark ? 'text-white' : 'text-brand-deep'
                }`}
              style={{
                textShadow: dark ? '0 2px 24px rgba(18,4,31,0.7)' : 'none',
              }}
            >
              {focused || input ? 'أنا هنا لمساعدتك...' : typedIdleText}
              {(!focused && !input && status === 'idle') && (
                <span className="inline-block w-[3px] h-[1em] bg-current ml-1 animate-pulse align-middle" />
              )}
            </h1>
          </div>
        )}

        {hasChatStarted && (
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 py-4">
            {isLoadingHistory && active?.messages.length === 0 ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className={`animate-spin ${dark ? 'text-white' : 'text-primary'}`} size={32} />
              </div>
            ) : (
              active?.messages.map((m, i) => (
                <Bubble
                  key={m.id}
                  message={m}
                  dark={dark}
                  avatarRef={i === 1 ? firstAvatarRef : undefined}
                  onStreamingChange={i === (active?.messages.length ?? 0) - 1 ? handleStreamingChange : undefined}
                />
              ))
            )}
            {typing && <TypingBubble dark={dark} avatarRef={active?.messages.length === 1 ? firstAvatarRef : undefined} />}
          </div>
        )}
      </div>

      {/* Composer Input Bar */}
      <div className={`fixed bottom-0 inset-x-0 z-20 pointer-events-none transition-colors duration-500 pt-6 pb-2`}>
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
            disabled={typing || isStreamingMessage}
          />
        </div>
      </div>

      {/* History Drawer */}
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

      {/* Confirmation Dialog: Close Chat */}
      {confirmClose && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl backdrop-blur-xl transform transition-all duration-300 scale-100 ${dark ? 'bg-[#1a0730]/95 border-white/10' : 'bg-white border-primary/20'}`}>
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 mx-auto">
              <XCircle size={28} className="text-red-500" />
            </div>
            <h3 className={`mb-2 text-center font-display text-xl font-bold ${dark ? 'text-white' : 'text-brand-deep'}`}>إنهاء المحادثة الحالية؟</h3>
            <p className={`mb-6 text-center text-[15px] leading-relaxed ${dark ? 'text-white/70' : 'text-[#374151]'}`}>
              إنهاء الجلسة سيؤدي لمسح المحادثة الحالية نهائياً ولن تتمكن من استعادتها. للرجوع للخلف وحفظ تقدمك، استخدم زر الرجوع العادي بدلاً من ذلك.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmClose(false)}
                className={`flex-1 rounded-xl border py-3 text-sm font-semibold transition-colors ${dark ? 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white' : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] hover:bg-[#E2E8F0] hover:text-[#0F172A]'}`}
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  startNewConversation()
                  setConfirmClose(false)
                  onExit()
                }}
                className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-bold text-white shadow-lg shadow-red-500/25 transition-transform hover:-translate-y-0.5"
              >
                نعم، إنهاء المحادثة
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Floating Text Selection Audio & Copy Toolbar */}
      <TextSelectionToolbar dark={dark} />
    </div>
  )
}
