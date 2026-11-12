import { useEffect, useRef, useState, useCallback } from 'react'
import whiteLogo from '@/assets/images/WhiteLogo.png'
import { demoReply } from '../chat/data'
import { useMicrophoneVolume } from '../../hooks/useMicrophoneVolume'
import { Menu, ArrowLeft, X, Mic, MicOff, Wrench, Sparkles, MessageSquare } from 'lucide-react'
import VoiceChatButton from '../../components/ui/VoiceChatButton'
import IslamicPattern from '../knowledge/components/IslamicPattern'
import LibrarySidebar from '../knowledge/components/LibrarySidebar'
import UserProfileModal from '../profile/UserProfileModal'
import { useTheme, ACCENT_STYLES } from '../../contexts/ThemeContext'
import { LIGHT_RESPONSIVE_PAGE_BG, getGlassHeaderButtonClass, getZadMaskStyle } from '../chat/chatTheme'

type Status = 'idle' | 'listening' | 'thinking' | 'speaking' | 'muted'

const STATUS_TEXT: Record<Status, string> = {
  idle: 'مرحبًا بك، اضغط للبدء…',
  listening: 'أستمع إليك الآن…',
  thinking: 'أفكّر في إجابتك…',
  speaking: 'زاد يتحدّث…',
  muted: 'الميكروفون مكتوم (الذكاء الاصطناعي لا يسمعك)',
}

const ACCENT_VOICE_STYLES: Record<string, {
  conicGlow: string
  shadowRgbDark: string
  shadowRgbLight: string
}> = {
  amber: {
    conicGlow: 'conic-gradient(from 0deg, transparent 0%, rgba(223,191,131,0.75) 40%, rgba(184,141,70,0.85) 60%, transparent 100%)',
    shadowRgbDark: '223, 191, 131',
    shadowRgbLight: '184, 141, 70',
  },
  emerald: {
    conicGlow: 'conic-gradient(from 0deg, transparent 0%, rgba(45,212,191,0.75) 40%, rgba(13,148,136,0.85) 60%, transparent 100%)',
    shadowRgbDark: '45, 212, 191',
    shadowRgbLight: '13, 148, 136',
  },
  blue: {
    conicGlow: 'conic-gradient(from 0deg, transparent 0%, rgba(96,165,250,0.75) 40%, rgba(37,99,235,0.85) 60%, transparent 100%)',
    shadowRgbDark: '96, 165, 250',
    shadowRgbLight: '37, 99, 235',
  },
  purple: {
    conicGlow: 'conic-gradient(from 0deg, transparent 0%, rgba(192,32,240,0.75) 40%, rgba(124,58,237,0.85) 60%, transparent 100%)',
    shadowRgbDark: '168, 85, 247',
    shadowRgbLight: '124, 58, 237',
  },
}

// The browser Speech APIs are still vendor-prefixed in some engines.
function getRecognition(): any | null {
  const w = window as any
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
  return Ctor ? new Ctor() : null
}

interface VoiceScreenProps {
  onExit: () => void
  onOpenText: () => void
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
}

export default function VoiceScreen({
  onExit,
  onOpenText,
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
}: VoiceScreenProps) {
  const { isDark: dark, accentColor } = useTheme()
  const currentAccent = ACCENT_STYLES[accentColor] || ACCENT_STYLES.amber
  const voiceAccent = ACCENT_VOICE_STYLES[accentColor] || ACCENT_VOICE_STYLES.amber
  const logoColor = dark ? currentAccent.logoDark : currentAccent.logoLight

  const [status, setStatus] = useState<Status>('idle')
  const [isCallActive, setIsCallActive] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isPlatformSidebarOpen, setIsPlatformSidebarOpen] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [_reply, setReply] = useState('')
  const [supported, setSupported] = useState(true)
  const [typedIdleText, setTypedIdleText] = useState('')
  const [showNotice, setShowNotice] = useState(true)

  const recognitionRef = useRef<any>(null)
  const transcriptRef = useRef<string>('')
  const isCallActiveRef = useRef<boolean>(false)
  const isMutedRef = useRef<boolean>(false)

  // Real-time audio volume hook for animation
  const volume = useMicrophoneVolume(isCallActive && !isMuted)

  useEffect(() => {
    isCallActiveRef.current = isCallActive
  }, [isCallActive])

  useEffect(() => {
    isMutedRef.current = isMuted
  }, [isMuted])

  useEffect(() => {
    if (status !== 'idle' || isCallActive) {
      setTypedIdleText('')
      return
    }
    const text = 'مرحبًا بك، اضغط للبدء…'
    let i = 0
    let isDeleting = false
    let timer: ReturnType<typeof setTimeout>

    const tick = () => {
      if (!isDeleting) {
        setTypedIdleText(text.slice(0, i + 1))
        i++
        if (i === text.length) {
          isDeleting = true
          timer = setTimeout(tick, 2000)
        } else {
          timer = setTimeout(tick, 70)
        }
      } else {
        setTypedIdleText(text.slice(0, i - 1))
        i--
        if (i === 0) {
          isDeleting = false
          timer = setTimeout(tick, 500)
        } else {
          timer = setTimeout(tick, 40)
        }
      }
    }
    timer = setTimeout(tick, 100)
    return () => clearTimeout(timer)
  }, [status, isCallActive])

  const speak = useCallback((text: string) => {
    const synth = window.speechSynthesis
    if (!synth) {
      if (isCallActiveRef.current) {
        setTranscript('')
        setReply('')
        if (!isMutedRef.current) {
          setTimeout(() => {
            try {
              recognitionRef.current?.start()
              setStatus('listening')
            } catch { /* noop */ }
          }, 500)
        } else {
          setStatus('muted')
        }
      } else {
        setStatus('idle')
      }
      return
    }
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'ar-SA'
    utter.rate = 0.95
    utter.onend = () => {
      if (isCallActiveRef.current) {
        setTranscript('')
        setReply('')
        if (!isMutedRef.current) {
          setTimeout(() => {
            try {
              recognitionRef.current?.start()
              setStatus('listening')
            } catch { /* noop */ }
          }, 500)
        } else {
          setStatus('muted')
        }
      } else {
        setStatus('idle')
      }
    }
    setStatus('speaking')
    synth.speak(utter)
  }, [])

  const respond = useCallback((question: string) => {
    setStatus('thinking')
    window.setTimeout(() => {
      const answer = demoReply(question, 'auto')
      setReply(answer)
      speak(answer)
    }, 1000)
  }, [speak])

  useEffect(() => {
    transcriptRef.current = transcript
  }, [transcript])

  useEffect(() => {
    const rec = getRecognition()
    if (!rec) {
      setSupported(false)
      return
    }
    rec.lang = 'ar-SA'
    rec.interimResults = true
    rec.continuous = false

    rec.onresult = (event: any) => {
      if (isMutedRef.current) return
      const text = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join(' ')
      setTranscript(text)
    }
    rec.onerror = () => {
      if (isCallActiveRef.current && !isMutedRef.current) {
        setTimeout(() => {
          try { recognitionRef.current?.start() } catch { /* noop */ }
        }, 300)
      } else if (!isCallActiveRef.current) {
        setStatus('idle')
      }
    }
    rec.onend = () => {
      setStatus((currentStatus) => {
        if (currentStatus === 'listening') {
          const finalTranscript = transcriptRef.current.trim()
          if (finalTranscript && !isMutedRef.current) {
            respond(finalTranscript)
            return 'thinking'
          }
          if (isCallActiveRef.current && !isMutedRef.current) {
            setTimeout(() => {
              try { recognitionRef.current?.start() } catch { /* noop */ }
            }, 100)
            return 'listening'
          }
          if (isMutedRef.current) {
            return 'muted'
          }
          return 'idle'
        }
        return currentStatus
      })
    }

    recognitionRef.current = rec
    return () => {
      try {
        rec.abort()
      } catch {
        /* noop */
      }
      window.speechSynthesis?.cancel()
    }
  }, [respond])

  const handleMic = () => {
    if (!supported) return

    if (isCallActive) {
      setIsCallActive(false)
      window.speechSynthesis?.cancel()
      try { recognitionRef.current?.stop() } catch { /* noop */ }
      setStatus('idle')
      return
    }

    setIsCallActive(true)
    setTranscript('')
    setReply('')
    try {
      recognitionRef.current?.start()
      setStatus('listening')
    } catch {
      setStatus('idle')
      setIsCallActive(false)
    }
  }

  const glassHeaderBtnClass = getGlassHeaderButtonClass(dark, currentAccent)
  const orbShadowRgb = dark ? voiceAccent.shadowRgbDark : voiceAccent.shadowRgbLight

  return (
    <div
      dir="rtl"
      className={`fixed inset-0 h-screen h-[100dvh] w-full flex flex-col overflow-hidden transition-colors duration-500 font-sans ${dark
          ? 'text-white bg-[#0c0e14]'
          : `text-stone-900 ${LIGHT_RESPONSIVE_PAGE_BG[accentColor] || LIGHT_RESPONSIVE_PAGE_BG.amber}`
        }`}
    >
      {/* 1. Islamic Geometric Pattern Background matching Text Chat */}
      <IslamicPattern
        isFixed={true}
        opacity={dark ? 0.07 : 0.08}
        mobileOpacity={dark ? 0.05 : 0.09}
        mobileScale={1.25}
        mobileStrokeWidth={0.9}
        strokeColor={dark ? currentAccent.strokeDark : currentAccent.strokeLight}
        className="pointer-events-none transition-colors duration-300"
      />

      {/* 2. Floating Top Header: Sidebar button (right), Centered Zad Logo, Back button (left) */}
      <header className="fixed top-0 inset-x-0 z-30 pt-3 sm:pt-4 px-3 sm:px-6 flex items-center justify-between pointer-events-none">
        <button
          type="button"
          aria-label="القائمة الرئيسية"
          title="القائمة الرئيسية"
          onClick={() => setIsPlatformSidebarOpen(true)}
          className={`${glassHeaderBtnClass} pointer-events-auto`}
        >
          <Menu size={20} strokeWidth={2.2} />
        </button>

        {/* Centered Zad Logo & Wordmark in Active Theme Color */}
        <div
          onClick={onNavigateHome || onExit}
          className="flex items-center gap-2 cursor-pointer select-none px-2 py-1 rounded-xl transition-all hover:opacity-90 pointer-events-auto"
          title="الرئيسية"
        >
          <div
            className="h-7 w-7 sm:h-8 sm:w-8 transition-colors duration-200 shrink-0"
            style={getZadMaskStyle(whiteLogo, logoColor)}
            aria-hidden="true"
          />
          <span
            className="font-display font-black text-xl sm:text-2xl leading-none select-none transition-colors"
            style={{ color: logoColor }}
          >
            زاد
          </span>
        </div>

        <button
          type="button"
          aria-label="العودة"
          title="العودة"
          onClick={onExit}
          className={`${glassHeaderBtnClass} pointer-events-auto`}
        >
          <ArrowLeft size={18} strokeWidth={2.2} />
        </button>
      </header>

      {/* Main Content Area below floating header */}
      <div className="relative z-10 flex flex-1 flex-col pt-16 sm:pt-20">
        {/* Persistent Top Banner Notice (when modal is closed) */}
        {!showNotice && (
          <div className="mx-4 sm:mx-6 mt-2 flex items-center justify-between px-4 py-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 backdrop-blur-md text-amber-800 dark:text-amber-300 text-xs sm:text-sm font-medium">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 shrink-0 animate-pulse text-amber-500" />
              <span>تنبيه: الوكيل الصوتي حالياً قيد التطوير والصيانة، وسيتوفر قريباً بكامل كفاءته.</span>
            </div>
            <button
              type="button"
              onClick={() => setShowNotice(true)}
              className="underline text-xs font-bold hover:opacity-80 shrink-0 mr-2 cursor-pointer"
            >
              عرض التفاصيل
            </button>
          </div>
        )}

        {/* Center Voice Orb */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className={`flex flex-col items-center transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isCallActive ? '-translate-y-8 sm:-translate-y-12' : 'translate-y-0'}`}>
            <div className="relative flex items-center justify-center">
              {/* Dynamic Audio Glow Ring */}
              <span
                className={`absolute rounded-full blur-[35px] transition-opacity duration-300 ${isCallActive ? 'opacity-100 animate-[spin_4s_linear_infinite]' : 'opacity-80'
                  }`}
                style={{
                  width: `${230 + Math.max(volume, 0.1) * 140}px`,
                  height: `${230 + Math.max(volume, 0.1) * 140}px`,
                  background: voiceAccent.conicGlow,
                  transition: 'width 100ms ease-out, height 100ms ease-out',
                }}
              />

              {/* Main Theme-Colored Zad Orb */}
              <div
                className={`relative flex h-48 w-48 sm:h-56 sm:w-56 items-center justify-center rounded-full z-10 border transition-colors ${dark
                    ? `bg-[#090b10]/85 backdrop-blur-xl border-white/15`
                    : `bg-white/95 backdrop-blur-xl ${currentAccent.lightBorder}`
                  } ${status === 'speaking' ? 'animate-pulse' : ''}`}
                style={{
                  transform: `scale(${1 + volume * 0.15})`,
                  boxShadow: isCallActive
                    ? `0 0 ${40 + volume * 90}px rgba(${orbShadowRgb}, ${0.35 + volume * 0.45})`
                    : `0 0 36px rgba(${orbShadowRgb}, ${dark ? 0.35 : 0.25})`,
                  transition: 'transform 100ms ease-out, box-shadow 100ms ease-out',
                }}
              >
                <div
                  className="h-28 w-28 sm:h-32 sm:w-32 transition-all duration-300"
                  style={getZadMaskStyle(whiteLogo, logoColor)}
                  role="img"
                  aria-label="شعار زاد"
                />
              </div>
            </div>

            <p className={`mt-9 sm:mt-10 text-base sm:text-lg font-medium ${dark ? 'text-white/85' : currentAccent.lightText}`}>
              {supported ? (
                status === 'idle' ? (
                  <>
                    {typedIdleText}
                    <span className="animate-pulse opacity-70">|</span>
                  </>
                ) : (
                  STATUS_TEXT[status]
                )
              ) : (
                'المتصفح لا يدعم الإدخال الصوتي — جرّب المحادثة النصية.'
              )}
            </p>
          </div>
        </div>

        {/* Mic Button & Footer */}
        <div className="flex flex-col items-center pb-10 sm:pb-14">
          <div className="flex items-center gap-6 transition-all duration-300">
            <VoiceChatButton
              onClick={handleMic}
              disabled={!supported}
              isActive={isCallActive}
              className="h-16 w-16"
            />

            {/* Mute toggle button (only visible when call is active) */}
            <div className={`transition-all duration-500 overflow-hidden ${isCallActive ? 'w-14 opacity-100 scale-100' : 'w-0 opacity-0 scale-50'}`}>
              <button
                type="button"
                onClick={() => {
                  const newMutedState = !isMuted
                  setIsMuted(newMutedState)
                  if (newMutedState) {
                    try { recognitionRef.current?.stop() } catch { /* noop */ }
                    if (status === 'listening' || status === 'thinking') {
                      setStatus('muted')
                    }
                  } else {
                    try { recognitionRef.current?.start(); setStatus('listening') } catch { /* noop */ }
                  }
                }}
                title={isMuted ? 'إلغاء الكتم' : 'كتم الميكروفون'}
                aria-label={isMuted ? 'إلغاء الكتم' : 'كتم الميكروفون'}
                className={`flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300 backdrop-blur-md border cursor-pointer ${isMuted
                    ? 'bg-red-500/20 text-red-500 border-red-500/40 hover:bg-red-500/30'
                    : dark
                      ? 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                      : `${currentAccent.lightBgBadge} ${currentAccent.lightText} ${currentAccent.lightBorder}`
                  }`}
              >
                {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notice Modal for Voice Agent Under Maintenance */}
      {showNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div
            className={`relative max-w-lg w-full rounded-3xl p-6 md:p-8 shadow-2xl border transition-all ${dark
                ? 'bg-[#0f131d]/95 border-white/15 text-white shadow-[0_20px_50px_rgba(0,0,0,0.65)]'
                : `bg-white/95 ${currentAccent.lightBorder} text-stone-900 shadow-2xl`
              }`}
          >
            <button
              type="button"
              onClick={() => setShowNotice(false)}
              className="absolute top-4 left-4 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="إغلاق التنبيه"
              aria-label="إغلاق التنبيه"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 mb-4 shadow-inner">
                <Wrench className="h-8 w-8 animate-bounce" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold mb-3">
                <Sparkles className="w-3.5 h-3.5" /> قيد التطوير والتحديث حالياً
              </div>

              <h3 className="text-2xl font-bold font-amiri mb-3">
                المساعد الصوتي قيد التطوير
              </h3>

              <p className="text-sm md:text-base leading-relaxed opacity-80 mb-6 max-w-md">
                نعمل حالياً على تحديث وتطوير الوكيل الصوتي (Voice Agent) لتقديم أفضل تجربة محادثة صوتية تفاعلية مباشرة. وسيكون متاحاً وسيعمل بكامل كفاءته قريباً جداً بإذن الله!
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                <button
                  type="button"
                  onClick={onOpenText}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl brand-gradient hover:opacity-95 text-white font-bold shadow-lg transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" /> الانتقال للمحادثة النصية
                </button>

                <button
                  type="button"
                  onClick={() => setShowNotice(false)}
                  className={`w-full sm:w-auto py-3 px-5 rounded-xl border font-semibold text-sm transition-all cursor-pointer ${dark
                      ? 'border-white/15 hover:bg-white/10 text-white'
                      : 'border-stone-200 hover:bg-stone-100 text-stone-800'
                    }`}
                >
                  تصفّح الواجهة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Platform Main Sidebar Drawer matching Text Chat */}
      <LibrarySidebar
        isOpen={isPlatformSidebarOpen}
        onClose={() => setIsPlatformSidebarOpen(false)}
        theme={dark ? 'dark' : 'light'}
        activeMainTab="voice"
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
          else if (view === 'chat') onOpenText()
          else if (view === 'voice') setIsPlatformSidebarOpen(false)
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
