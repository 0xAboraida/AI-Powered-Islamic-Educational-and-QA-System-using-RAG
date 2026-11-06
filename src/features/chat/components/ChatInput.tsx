import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TextareaAutosize from 'react-textarea-autosize'
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
  Sparkles,
  X
} from 'lucide-react'
import zadDarkLogo from '@/assets/images/ZadDarkLogo.png'
import { useTheme } from '../../../contexts/ThemeContext'
import type { BookMeta } from './BookProfileCard'

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
  selectedBook,
  onClearBook,
  disabled = false
}: {
  input: string
  setInput: (v: string) => void
  send: (text?: string) => void
  dark: boolean
  onOpenVoice: () => void
  setFocused: (v: boolean) => void
  mode: number
  setMode: (m: number) => void
  responseMode?: string
  setResponseMode?: (rm: string) => void
  selectedBook?: BookMeta | null
  onClearBook?: () => void
  disabled?: boolean
}) {
  const { accentColor = 'amber' } = useTheme()

  const getAccentConfig = () => {
    switch (accentColor) {
      case 'emerald':
        return {
          pillBorderLight: 'border-teal-300/70',
          pillBorderHoverLight: 'hover:border-teal-500',
          pillBgHoverLight: 'hover:bg-teal-50',
          activeBgLight: 'bg-teal-100',
          activeTextLight: 'text-teal-900',
          activeBorderLight: 'border-teal-300',
          activeIconLight: 'text-teal-600',
          inputBorderLight: 'border-teal-300/60',
          toastBorderLight: 'border-teal-300',
          toastBadgeLight: 'bg-teal-100',
          iconColorLight: 'text-teal-600',
          activeBgDark: 'bg-teal-500/20',
          activeTextDark: 'text-teal-300',
          activeBorderDark: 'border-teal-400/40',
          activeIconDark: 'bg-teal-500/30 text-white',
          iconColorDark: 'text-teal-400',
          pillHoverDark: 'hover:border-teal-400/50',
          dropdownBorderDark: 'border-teal-500/30',
          toastBorderDark: 'border-teal-400/40',
        }
      case 'blue':
        return {
          pillBorderLight: 'border-blue-300/70',
          pillBorderHoverLight: 'hover:border-blue-500',
          pillBgHoverLight: 'hover:bg-blue-50',
          activeBgLight: 'bg-blue-100',
          activeTextLight: 'text-blue-900',
          activeBorderLight: 'border-blue-300',
          activeIconLight: 'text-blue-600',
          inputBorderLight: 'border-blue-300/60',
          toastBorderLight: 'border-blue-300',
          toastBadgeLight: 'bg-blue-100',
          iconColorLight: 'text-blue-600',
          activeBgDark: 'bg-blue-500/20',
          activeTextDark: 'text-blue-300',
          activeBorderDark: 'border-blue-400/40',
          activeIconDark: 'bg-blue-500/30 text-white',
          iconColorDark: 'text-blue-400',
          pillHoverDark: 'hover:border-blue-400/50',
          dropdownBorderDark: 'border-blue-500/30',
          toastBorderDark: 'border-blue-400/40',
        }
      case 'purple':
        return {
          pillBorderLight: 'border-purple-300/70',
          pillBorderHoverLight: 'hover:border-purple-500',
          pillBgHoverLight: 'hover:bg-purple-50',
          activeBgLight: 'bg-purple-100',
          activeTextLight: 'text-purple-900',
          activeBorderLight: 'border-purple-300',
          activeIconLight: 'text-purple-600',
          inputBorderLight: 'border-purple-300/60',
          toastBorderLight: 'border-purple-300',
          toastBadgeLight: 'bg-purple-100',
          iconColorLight: 'text-purple-600',
          activeBgDark: 'bg-purple-500/20',
          activeTextDark: 'text-purple-300',
          activeBorderDark: 'border-purple-400/40',
          activeIconDark: 'bg-purple-500/30 text-white',
          iconColorDark: 'text-purple-400',
          pillHoverDark: 'hover:border-purple-400/50',
          dropdownBorderDark: 'border-purple-500/30',
          toastBorderDark: 'border-purple-400/40',
        }
      case 'amber':
      default:
        return {
          pillBorderLight: 'border-amber-300/70',
          pillBorderHoverLight: 'hover:border-amber-500',
          pillBgHoverLight: 'hover:bg-amber-50',
          activeBgLight: 'bg-amber-100',
          activeTextLight: 'text-amber-900',
          activeBorderLight: 'border-amber-300',
          activeIconLight: 'text-amber-700',
          inputBorderLight: 'border-amber-300/60',
          toastBorderLight: 'border-amber-300',
          toastBadgeLight: 'bg-amber-100',
          iconColorLight: 'text-amber-600',
          activeBgDark: 'bg-[#dfbf83]/20',
          activeTextDark: 'text-[#dfbf83]',
          activeBorderDark: 'border-[#dfbf83]/40',
          activeIconDark: 'bg-[#dfbf83]/30 text-white',
          iconColorDark: 'text-[#dfbf83]',
          pillHoverDark: 'hover:border-[#dfbf83]/50',
          dropdownBorderDark: 'border-[#dfbf83]/30',
          toastBorderDark: 'border-[#dfbf83]/40',
        }
    }
  }

  const ac = getAccentConfig()

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
  }, [transcript, listening, baseInput, setInput])

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
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const selectedDomain = DOMAINS.find(d => d.id === mode) || DOMAINS[0]
  const selectedResponseMode = RESPONSE_MODES.find(rm => rm.id === responseMode) || RESPONSE_MODES[0]

  return (
    <div className={`flex flex-col items-center px-2 sm:px-4 pb-2 sm:pb-3 relative mt-auto w-full transition-all duration-300 ${(isDomainOpen || isResponseModeOpen) ? 'z-40' : 'z-30'}`}>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-2">
        {/* Floating Notification Toast */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -60, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`fixed top-16 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-5 py-2.5 rounded-full border backdrop-blur-md shadow-2xl z-[100] whitespace-nowrap ${
                dark
                  ? `bg-[#121622]/95 ${ac.toastBorderDark} text-white shadow-[0_5px_25px_rgba(0,0,0,0.6)]`
                  : `bg-white/95 ${ac.toastBorderLight} text-stone-900 shadow-xl`
              }`}
            >
              <div className={`flex items-center justify-center p-1 rounded-full ${dark ? ac.activeBgDark : ac.toastBadgeLight}`}>
                <img src={zadDarkLogo} alt="Zad" className="h-4 w-4 object-contain" />
              </div>
              <span className="font-sans font-medium text-[13px]">{notification}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Floating Row Above Input Form (Filters and Selected Book) */}
        <div className="flex items-center justify-between gap-2 px-1 w-full relative">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Domain Selector Pill */}
            <div className="relative" ref={domainRef}>
              <button
                type="button"
                onClick={() => {
                  setIsDomainOpen(!isDomainOpen)
                  setIsResponseModeOpen(false)
                }}
                className={`group flex items-center gap-1.5 px-3 h-[34px] rounded-xl border transition-all duration-200 text-xs font-bold font-sans cursor-pointer shadow-xs ${
                  dark
                    ? `bg-[#121622]/90 border-white/15 text-stone-200 hover:bg-[#181d2c] ${ac.pillHoverDark}`
                    : `bg-white/95 ${ac.pillBorderLight} text-stone-800 ${ac.pillBgHoverLight} ${ac.pillBorderHoverLight}`
                }`}
              >
                <div className="flex items-center justify-center shrink-0">
                  {selectedDomain.isZadIcon ? (
                    <img src={zadDarkLogo} alt="Zad" className="h-3.5 w-3.5 object-contain opacity-90" />
                  ) : (
                    selectedDomain.icon
                  )}
                </div>
                <span className="text-[11px] opacity-70">المجال:</span>
                <span className="truncate max-w-[85px] sm:max-w-[120px]">
                  {selectedDomain.id === 0 ? 'تلقائي' : selectedDomain.name}
                </span>
                <ChevronUp className={`w-3.5 h-3.5 transition-transform duration-300 ${isDomainOpen ? 'rotate-180' : 'rotate-0 opacity-70'}`} />
              </button>

              {/* Domain Dropdown Menu (Opens Above) */}
              <div
                className={`absolute bottom-full right-0 mb-2 w-[220px] max-w-[calc(100vw-24px)] rounded-2xl border backdrop-blur-2xl transition-all duration-300 z-50 origin-bottom-right ${
                  isDomainOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
                } ${
                  dark
                    ? `bg-[#121622]/98 ${ac.dropdownBorderDark} shadow-[0_15px_50px_-10px_rgba(0,0,0,0.7)]`
                    : `bg-white/98 ${ac.pillBorderLight} shadow-2xl`
                }`}
              >
                <div className="p-2.5">
                  <div className={`mb-2 px-2 text-xs text-center font-bold font-sans ${dark ? 'text-white/80 border-b border-white/10 pb-2' : 'text-stone-800 border-b border-stone-200 pb-2'}`}>
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
                          className={`flex items-center gap-2.5 p-2 rounded-xl transition-all duration-200 text-right group ${
                            isActive
                              ? dark
                                ? `${ac.activeBgDark} ${ac.activeTextDark} border ${ac.activeBorderDark} shadow-xs`
                                : `${ac.activeBgLight} ${ac.activeTextLight} border ${ac.activeBorderLight} shadow-xs`
                              : dark
                                ? 'hover:bg-white/5 text-white/80 border border-transparent'
                                : `${ac.pillBgHoverLight} text-stone-700 border border-transparent`
                          }`}
                        >
                          <div className={`flex items-center justify-center p-1.5 rounded-lg transition-all ${
                            isActive
                              ? (dark ? ac.activeIconDark : `${ac.activeBgLight} ${ac.activeIconLight}`)
                              : (dark ? `bg-white/5 ${ac.iconColorDark}` : `bg-black/5 ${ac.iconColorLight}`)
                          }`}>
                            {d.isZadIcon ? (
                              <img src={zadDarkLogo} alt="Zad" className="h-4 w-4 object-contain drop-shadow-sm" />
                            ) : (
                              d.icon
                            )}
                          </div>
                          <span className={`text-xs font-sans font-bold ${isActive ? '' : (dark ? 'group-hover:text-white' : 'group-hover:text-stone-900')}`}>
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
            <div className="sm:relative" ref={responseModeRef}>
              <button
                type="button"
                onClick={() => {
                  setIsResponseModeOpen(!isResponseModeOpen)
                  setIsDomainOpen(false)
                }}
                className={`group flex items-center gap-1.5 px-3 h-[34px] rounded-xl border transition-all duration-200 text-xs font-bold font-sans cursor-pointer shadow-xs ${
                  dark
                    ? `bg-[#121622]/90 border-white/15 text-stone-200 hover:bg-[#181d2c] ${ac.pillHoverDark}`
                    : `bg-white/95 ${ac.pillBorderLight} text-stone-800 ${ac.pillBgHoverLight} ${ac.pillBorderHoverLight}`
                }`}
              >
                <div className={`flex items-center justify-center shrink-0 ${dark ? ac.iconColorDark : ac.iconColorLight}`}>
                  {selectedResponseMode.icon}
                </div>
                <span className="text-[11px] opacity-70">النمط:</span>
                <span className="truncate max-w-[85px] sm:max-w-[120px]">
                  {selectedResponseMode.shortName}
                </span>
                <ChevronUp className={`w-3.5 h-3.5 transition-transform duration-300 ${isResponseModeOpen ? 'rotate-180' : 'rotate-0 opacity-70'}`} />
              </button>

              {/* Response Mode Dropdown Menu (Opens Above) */}
              <div
                className={`absolute bottom-full right-1 sm:right-0 mb-2 w-[270px] sm:w-[290px] max-w-[calc(100vw-24px)] rounded-2xl border backdrop-blur-2xl transition-all duration-300 z-50 origin-bottom-right ${
                  isResponseModeOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
                } ${
                  dark
                    ? `bg-[#121622]/98 ${ac.dropdownBorderDark} shadow-[0_15px_50px_-10px_rgba(0,0,0,0.7)]`
                    : `bg-white/98 ${ac.pillBorderLight} shadow-2xl`
                }`}
              >
                <div className="p-2.5">
                  <div className={`mb-2 px-2 text-xs text-center font-bold font-sans ${dark ? 'text-white/80 border-b border-white/10 pb-2' : 'text-stone-800 border-b border-stone-200 pb-2'}`}>
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
                          className={`flex items-start gap-2.5 p-2.5 rounded-xl transition-all duration-200 text-right group ${
                            isActive
                              ? dark
                                ? `${ac.activeBgDark} ${ac.activeTextDark} border ${ac.activeBorderDark} shadow-xs`
                                : `${ac.activeBgLight} ${ac.activeTextLight} border ${ac.activeBorderLight} shadow-xs`
                              : dark
                                ? 'hover:bg-white/5 text-white/80 border border-transparent'
                                : `${ac.pillBgHoverLight} text-stone-700 border border-transparent`
                          }`}
                        >
                          <div className={`flex items-center justify-center p-2 rounded-lg shrink-0 mt-0.5 transition-all ${
                            isActive
                              ? (dark ? ac.activeIconDark : `${ac.activeBgLight} ${ac.activeIconLight}`)
                              : (dark ? `bg-white/5 ${ac.iconColorDark}` : `bg-black/5 ${ac.iconColorLight}`)
                          }`}>
                            {rm.icon}
                          </div>
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className={`text-xs font-sans font-bold ${isActive ? '' : (dark ? 'group-hover:text-white' : 'group-hover:text-stone-900')}`}>
                              {rm.name}
                            </span>
                            <span className={`text-[11px] font-sans leading-tight ${dark ? 'text-white/60' : 'text-stone-500'}`}>
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

            {/* Selected Book Tag (if any) */}
            {selectedBook && (
              <div
                className={`flex items-center gap-1.5 px-3 h-[34px] rounded-xl text-xs font-sans font-semibold border backdrop-blur-md transition-all ${
                  dark ? `bg-[#121622]/90 ${ac.dropdownBorderDark} ${ac.activeTextDark}` : `${ac.activeBgLight} ${ac.activeBorderLight} ${ac.activeTextLight}`
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate max-w-[130px] sm:max-w-[200px]">{selectedBook.title}</span>
                {onClearBook && (
                  <button
                    type="button"
                    onClick={onClearBook}
                    className="hover:opacity-75 transition-opacity mr-1 cursor-pointer"
                    title="إلغاء حصر البحث بهذا الكتاب"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 2. Main Input Box (Voice Record + Text Input + Send Button) */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!disabled && input.trim()) send()
          }}
          className="flex flex-col w-full"
        >
          <div className="gradient-border min-w-0 flex-1 rounded-[16px] sm:rounded-[18px] p-[2px] shadow-2xl shadow-primary/20 transition-all duration-300">
            <div
              className={`flex items-center gap-2 rounded-[14px] sm:rounded-[16px] py-1.5 px-3 sm:px-4 transition-all duration-300 ${
                dark ? 'bg-[#121622]/95 backdrop-blur-xl border border-white/10' : `bg-white/95 backdrop-blur-xl border ${ac.inputBorderLight}`
              }`}
            >
              {/* Start (Right in RTL): Voice Record Button */}
              <div className="shrink-0 flex items-center">
                <VoiceRecordButton
                  listening={listening}
                  dark={dark}
                  browserSupportsSpeechRecognition={browserSupportsSpeechRecognition}
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl"
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

              {/* Center: Text Input */}
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
                className={`font-sans min-w-0 flex-1 resize-none bg-transparent py-2 text-sm sm:text-base outline-none placeholder:text-current/45 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${
                  dark ? 'text-white placeholder:text-white/45' : 'text-stone-800 placeholder:text-stone-400'
                }`}
              />

              {/* End (Left in RTL): Send Button */}
              <div className="shrink-0 flex items-center">
                <button
                  type="submit"
                  aria-label="اسأل زاد"
                  disabled={disabled || !input.trim()}
                  className={`brand-gradient flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-lg shadow-primary/30 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring cursor-pointer ${
                    (disabled || !input.trim())
                      ? 'opacity-40 cursor-not-allowed pointer-events-none scale-95 shadow-none'
                      : 'hover:-translate-y-0.5 active:scale-95'
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 sm:h-5 w-4 sm:w-5 -scale-x-100">
                    <path
                      d="M6 12h13M13 6l6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="2.2"
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
