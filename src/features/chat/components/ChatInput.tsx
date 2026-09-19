import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TextareaAutosize from 'react-textarea-autosize'
import VoiceChatButton from '../../../components/ui/VoiceChatButton'
import VoiceRecordButton from '../../../components/ui/VoiceRecordButton'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import {
  Scale,
  HeartHandshake,
  BookOpenText,
  Moon,
  Landmark,
  Languages,
  BookOpen,
  ChevronUp,
  GraduationCap,
  BookMarked,
  Sparkles,
  Zap,
  SlidersHorizontal
} from 'lucide-react'
import whiteLogo from '@/assets/images/WhiteLogo.png'
import zadDarkLogo from '@/assets/images/ZadDarkLogo.png'

const DOMAINS = [
  { id: 0, name: 'تلقائي', isZadIcon: true },
  { id: 1, name: 'الفقه', icon: <Scale className="h-4 w-4" /> },
  { id: 2, name: 'العقيدة', icon: <HeartHandshake className="h-4 w-4" /> },
  { id: 3, name: 'السيرة', icon: <Moon className="h-4 w-4" /> },
  { id: 4, name: 'التفسير', icon: <BookOpenText className="h-4 w-4" /> },
  { id: 5, name: 'الحديث', icon: <BookOpenText className="h-4 w-4" /> },
  { id: 6, name: 'علوم القرآن', icon: <BookOpen className="h-4 w-4" /> },
  { id: 7, name: 'التاريخ', icon: <Landmark className="h-4 w-4" /> },
  { id: 8, name: 'علوم اللغة', icon: <Languages className="h-4 w-4" /> },
]

export const RESPONSE_MODES = [
  {
    id: 'student',
    name: 'طالب علم (تأصيلي موسّع)',
    shortName: 'طالب علم',
    desc: 'تأصيل شرعي واسع مع مقارنة المذاهب والأدلة والتخريج من أمهات الكتب',
    icon: <GraduationCap className="h-4 w-4" />,
    toast: 'تم تفعيل نمط طالب العلم (تأصيل شرعي ومقارنة المذاهب).'
  },
  {
    id: 'simple',
    name: 'إجابة ميسّرة ومباشرة',
    shortName: 'إجابة ميسّرة',
    desc: 'بلسان عربي ميسّر يفهمه الجميع دون استطراد فقهي أو تعقيد',
    icon: <Sparkles className="h-4 w-4" />,
    toast: 'تم تفعيل نمط الإجابة الميسّرة والمباشرة.'
  },
]

export function ChatInput({
  input,
  setInput,
  send,
  dark,
  onOpenVoice,
  setFocused,
  mode,
  setMode,
  responseMode = 'student',
  setResponseMode,
  disabled = false
}: {
  input: string
  setInput: (v: string) => void
  send: () => void
  dark: boolean
  onOpenVoice: () => void
  setFocused: (v: boolean) => void
  mode: number
  setMode: (m: number) => void
  responseMode?: string
  setResponseMode?: (rm: string) => void
  disabled?: boolean
}) {
  const [baseInput, setBaseInput] = useState('')
  const [isDomainOpen, setIsDomainOpen] = useState(false)
  const [isResponseModeOpen, setIsResponseModeOpen] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)

  const domainRef = useRef<HTMLDivElement>(null)
  const responseModeRef = useRef<HTMLDivElement>(null)

  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition()

  useEffect(() => {
    if (listening) {
      const newText = baseInput ? `${baseInput} ${transcript}` : transcript
      setInput(newText.trim())
    }
  }, [transcript, listening, baseInput])

  // Handle clicking outside the dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (domainRef.current && !domainRef.current.contains(event.target as Node)) {
        setIsDomainOpen(false)
      }
      if (responseModeRef.current && !responseModeRef.current.contains(event.target as Node)) {
        setIsResponseModeOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const selectedDomain = DOMAINS.find(d => d.id === mode) || DOMAINS[0]
  const selectedResponseMode = RESPONSE_MODES.find(rm => rm.id === responseMode) || RESPONSE_MODES[0]

  return (
    <div className={`flex flex-col items-center px-2 sm:px-4 pb-2 sm:pb-3 relative mt-auto w-full transition-all duration-300 ${(isDomainOpen || isResponseModeOpen) ? 'z-40' : 'z-30'}`}>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-2">
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -100, scale: 0.9 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: [1, 1.02, 1]
              }}
              exit={{ opacity: 0, y: -100, scale: 0.9 }}
              transition={{
                y: { type: "spring", stiffness: 400, damping: 25 },
                scale: { repeat: Infinity, duration: 2, ease: "easeInOut" },
                opacity: { duration: 0.3 }
              }}
              className={`fixed top-10 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-5 py-2.5 rounded-full border backdrop-blur-md shadow-2xl z-[100] whitespace-nowrap ${dark
                ? 'bg-[#1a0730]/90 border-brand-magenta/40 text-white/90 shadow-[0_5px_25px_rgba(168,85,247,0.4)]'
                : 'bg-white/95 border-primary/30 text-brand-deep shadow-[0_5px_25px_rgba(40,10,70,0.15)]'
                }`}
            >
              <div className={`flex items-center justify-center p-1 rounded-full ${dark ? 'bg-brand-magenta/20' : 'bg-primary/10'}`}>
                <img src={zadDarkLogo} alt="Zad" className="h-4 w-4 object-contain" />
              </div>
              <span className="font-sans font-medium text-[13px]">{notification}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!disabled) send()
          }}
          className="flex flex-col w-full"
        >
          {/* Main Unified Input Box - SINGLE ROW (Height ~46px) */}
          <div className="gradient-border min-w-0 flex-1 rounded-[24px] sm:rounded-[28px] p-[2px] shadow-2xl shadow-primary/20 transition-all duration-300">
            <div
              className={`flex items-center gap-2 rounded-[22px] sm:rounded-[26px] py-1.5 px-3 sm:px-4 transition-all duration-300 ${dark ? 'bg-[#1a0730]/95 backdrop-blur-xl' : 'bg-white/95 backdrop-blur-xl'
                }`}
            >
              {/* 1. Selector Micro-Pills & Microphone (Right / Start in RTL) */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Domain Selector Pill */}
                <div className="relative" ref={domainRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDomainOpen(!isDomainOpen)
                      setIsResponseModeOpen(false)
                    }}
                    className={`group flex items-center gap-1 px-2 sm:px-2.5 h-[32px] sm:h-[34px] rounded-full border transition-all duration-200 text-[11px] sm:text-xs font-bold font-sans cursor-pointer ${dark
                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-200 hover:bg-purple-500/20 hover:border-purple-400'
                      : 'bg-purple-50 border-purple-200 text-purple-900 hover:bg-purple-100 hover:border-purple-300'
                      }`}
                  >
                    <div className="flex items-center justify-center shrink-0">
                      {selectedDomain.isZadIcon ? (
                        <img src={zadDarkLogo} alt="Zad" className="h-3.5 w-3.5 object-contain opacity-90" />
                      ) : (
                        selectedDomain.icon
                      )}
                    </div>
                    <span className="hidden sm:inline-block truncate max-w-[80px] md:max-w-[110px]">
                      {selectedDomain.id === 0 ? 'تلقائي' : selectedDomain.name}
                    </span>
                    <ChevronUp className={`w-3 h-3 transition-transform duration-300 ${isDomainOpen ? 'rotate-180' : 'rotate-0 opacity-70'}`} />
                  </button>

                  {/* Domain Dropdown Menu */}
                  <div className={`absolute bottom-full right-0 mb-2 w-[220px] rounded-2xl border backdrop-blur-2xl transition-all duration-300 z-50 origin-bottom-right ${isDomainOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
                    } ${dark
                      ? 'bg-[#0f041c]/95 border-brand-magenta/20 shadow-[0_15px_50px_-10px_rgba(168,85,247,0.3)]'
                      : 'bg-white/95 border-primary/10 shadow-2xl'
                    }`}>
                    <div className="p-2.5">
                      <div className={`mb-2 px-2 text-xs text-center font-bold font-sans ${dark ? 'text-white/80 border-b border-white/10 pb-2' : 'text-brand-deep/80 border-b border-black/10 pb-2'}`}>
                        اختر مجال العلم الشرعي
                      </div>
                      <div className="flex flex-col gap-1 max-h-[260px] overflow-y-auto [&::-webkit-scrollbar]:hidden">
                        {DOMAINS.map(d => {
                          const isActive = mode === d.id
                          return (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => {
                                setMode(d.id);
                                setIsDomainOpen(false);
                                if (d.id === 0) {
                                  setNotification("سوف يقوم زاد باختيار المجال المناسب لسؤالك تلقائياً");
                                } else if (d.name.includes("علوم")) {
                                  setNotification(`سوف يتم البحث عن سؤالك في الكتب المختصة بـ ${d.name}`);
                                } else {
                                  setNotification(`سوف يتم البحث عن سؤالك في الكتب المختصة بعلم ${d.name}`);
                                }
                              }}
                              className={`flex items-center gap-2.5 p-2 rounded-xl transition-all duration-200 text-right group ${isActive
                                ? dark
                                  ? 'bg-gradient-to-r from-brand-magenta/20 to-purple-500/10 text-white border border-brand-magenta/40 shadow-sm'
                                  : 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary border border-primary/30 shadow-sm'
                                : dark
                                  ? 'hover:bg-white/5 text-white/80 border border-transparent'
                                  : 'hover:bg-black/5 text-brand-deep/80 border border-transparent'
                                }`}
                            >
                              <div className={`flex items-center justify-center p-1.5 rounded-lg transition-all ${isActive
                                ? (dark ? 'bg-brand-magenta/30 text-white' : 'bg-primary/20 text-primary')
                                : (dark ? 'bg-white/5 text-brand-magenta' : 'bg-black/5 text-primary')
                                }`}>
                                {d.isZadIcon ? (
                                  <img src={zadDarkLogo} alt="Zad" className="h-4 w-4 object-contain drop-shadow-sm" />
                                ) : (
                                  d.icon
                                )}
                              </div>
                              <span className={`text-xs font-sans font-bold ${isActive ? '' : (dark ? 'group-hover:text-white' : 'group-hover:text-primary')}`}>
                                {d.name}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Response Mode Selector Pill */}
                <div className="relative" ref={responseModeRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsResponseModeOpen(!isResponseModeOpen)
                      setIsDomainOpen(false)
                    }}
                    className={`group flex items-center gap-1 px-2 sm:px-2.5 h-[32px] sm:h-[34px] rounded-full border transition-all duration-200 text-[11px] sm:text-xs font-bold font-sans cursor-pointer ${dark
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-200 hover:bg-amber-500/20 hover:border-amber-400'
                      : 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100 hover:border-amber-300'
                      }`}
                  >
                    <div className="flex items-center justify-center shrink-0">
                      {selectedResponseMode.icon}
                    </div>
                    <span className="hidden sm:inline-block truncate max-w-[90px] md:max-w-[120px]">
                      {selectedResponseMode.shortName}
                    </span>
                    <ChevronUp className={`w-3 h-3 transition-transform duration-300 ${isResponseModeOpen ? 'rotate-180' : 'rotate-0 opacity-70'}`} />
                  </button>

                  {/* Response Mode Dropdown Menu */}
                  <div className={`absolute bottom-full right-0 mb-2 w-[270px] sm:w-[290px] rounded-2xl border backdrop-blur-2xl transition-all duration-300 z-50 origin-bottom-right ${isResponseModeOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
                    } ${dark
                      ? 'bg-[#0f041c]/95 border-brand-magenta/20 shadow-[0_15px_50px_-10px_rgba(168,85,247,0.3)]'
                      : 'bg-white/95 border-primary/10 shadow-2xl'
                    }`}>
                    <div className="p-2.5">
                      <div className={`mb-2 px-2 text-xs text-center font-bold font-sans ${dark ? 'text-white/80 border-b border-white/10 pb-2' : 'text-brand-deep/80 border-b border-black/10 pb-2'}`}>
                        اختر نمط الإجابة والرد
                      </div>
                      <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto [&::-webkit-scrollbar]:hidden">
                        {RESPONSE_MODES.map(rm => {
                          const isActive = responseMode === rm.id
                          return (
                            <button
                              key={rm.id}
                              type="button"
                              onClick={() => {
                                if (setResponseMode) setResponseMode(rm.id);
                                setIsResponseModeOpen(false);
                                setNotification(rm.toast);
                              }}
                              className={`flex items-start gap-2.5 p-2.5 rounded-xl transition-all duration-200 text-right group ${isActive
                                ? dark
                                  ? 'bg-gradient-to-r from-brand-magenta/20 to-purple-500/10 text-white border border-brand-magenta/40 shadow-sm'
                                  : 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary border border-primary/30 shadow-sm'
                                : dark
                                  ? 'hover:bg-white/5 text-white/80 border border-transparent'
                                  : 'hover:bg-black/5 text-brand-deep/80 border border-transparent'
                                }`}
                            >
                              <div className={`flex items-center justify-center p-2 rounded-lg shrink-0 mt-0.5 transition-all ${isActive
                                ? (dark ? 'bg-brand-magenta/30 text-white' : 'bg-primary/20 text-primary')
                                : (dark ? 'bg-white/5 text-amber-400' : 'bg-black/5 text-amber-600')
                                }`}>
                                {rm.icon}
                              </div>
                              <div className="flex flex-col gap-0.5 min-w-0">
                                <span className={`text-xs font-sans font-bold ${isActive ? '' : (dark ? 'group-hover:text-white' : 'group-hover:text-primary')}`}>
                                  {rm.name}
                                </span>
                                <span className={`text-[11px] font-sans leading-tight ${dark ? 'text-white/60' : 'text-black/60'}`}>
                                  {rm.desc}
                                </span>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Voice Record Button - placed after choices */}
                <VoiceRecordButton
                  listening={listening}
                  dark={dark}
                  browserSupportsSpeechRecognition={browserSupportsSpeechRecognition}
                  onClick={() => {
                    if (listening) {
                      SpeechRecognition.stopListening()
                    } else {
                      setBaseInput(input)
                      resetTranscript()
                      SpeechRecognition.startListening({ language: 'ar-SA', continuous: true })
                    }
                  }}
                />
              </div>

              {/* 2. Center: Text Input */}
              <TextareaAutosize
                minRows={1}
                maxRows={4}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (!disabled && input.trim()) {
                      send()
                    }
                  }
                }}
                placeholder="اكتب سؤالك الشرعي هنا…"
                aria-label="اكتب سؤالك"
                className={`font-sans min-w-0 flex-1 resize-none bg-transparent py-1.5 text-sm sm:text-base outline-none placeholder:text-current/50 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${dark ? 'text-white placeholder:text-white/50' : 'text-brand-deep placeholder:text-brand-deep/45'
                  }`}
              />

              {/* 3. Action Buttons (Left / End in RTL: Send Button Only) */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="submit"
                  aria-label="اسأل زاد"
                  disabled={disabled || !input.trim()}
                  className={`brand-gradient flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full text-white shadow-lg shadow-primary/30 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${(disabled || !input.trim())
                      ? 'opacity-40 cursor-not-allowed pointer-events-none scale-95 shadow-none'
                      : 'hover:-translate-y-0.5 active:scale-95'
                    }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 sm:h-5 w-4 sm:w-5 -scale-x-100">
                    <path
                      d="M6 12h13M13 6l6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>

            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
