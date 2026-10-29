import { useEffect, useState } from 'react'
import StoreBadges from '../ui/StoreBadges'
import VoiceRecordButton from '../ui/VoiceRecordButton'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import TextareaAutosize from 'react-textarea-autosize'
import whiteLogo from '@/assets/images/WhiteLogo.webp'
import darkLogo from '@/assets/images/ZadDarkLogo.webp'
import bgDark from '@/assets/images/pc view main page background dark purple.png'
import bgLight from '@/assets/images/authPageBackgroundLight.png'
import bgDarkPcBlue from '@/assets/images/pc view main page background dark blue.webp'
import bgDarkPcTeal from '@/assets/images/pc view main page background dark teal.webp'
import bgDarkPcAmber from '@/assets/images/pc view main page background dark agee.webp'
import bgDarkMobilePurple from '@/assets/images/mobile view main page background dark4.webp'
import bgDarkMobileBlue from '@/assets/images/mobile view main page background dark blue.webp'
import bgDarkMobileTeal from '@/assets/images/mobile view main page background dark teal.webp'
import bgDarkMobileAmber from '@/assets/images/mobile view main page background dark agee.webp'
import bgLightMobile from '@/assets/images/mobile view main page background light5.webp'
import { useTheme } from '../../contexts/ThemeContext'

const samplePrompts = [
  'ما حكم صلاة الجماعة للرجال؟',
  'كيف أحسب زكاة المال؟',
  'ما صحة حديث "إنما الأعمال بالنيّات"؟',
  'ما معنى قوله تعالى: "وقل ربِّ زدني علمًا"؟',
  'ما آداب طالب العلم مع شيخه؟',
  'ما الفرق بين الزكاة والصدقة؟',
]

export default function Hero({
  onTryChat,
  onTryVoice,
  onAsk,
}: {
  onTryChat: () => void
  onTryVoice: () => void
  onAsk: (question: string) => void
}) {
  const { isDark: dark, accentColor } = useTheme()

  const getDesktopDarkBg = () => {
    switch (accentColor) {
      case 'blue': return bgDarkPcBlue
      case 'emerald': return bgDarkPcTeal
      case 'amber': return bgDarkPcAmber
      case 'purple':
      default: return bgDark
    }
  }

  const getMobileDarkBg = () => {
    switch (accentColor) {
      case 'blue': return bgDarkMobileBlue
      case 'emerald': return bgDarkMobileTeal
      case 'amber': return bgDarkMobileAmber
      case 'purple':
      default: return bgDarkMobilePurple
    }
  }

  const renderMobileLogo = () => {
    if (dark) {
      return (
        <img
          src={whiteLogo}
          alt="شعار زاد"
          className="mx-auto h-44 w-44 sm:h-44 sm:w-44 object-contain drop-shadow-[0_12px_30px_rgba(255,255,255,0.25)] transition-transform duration-300 hover:scale-105 select-none"
        />
      )
    }

    if (accentColor === 'purple') {
      return (
        <img
          src={darkLogo}
          alt="شعار زاد"
          className="mx-auto h-44 w-44 sm:h-44 sm:w-44 object-contain drop-shadow-[0_12px_30px_rgba(168,85,247,0.4)] transition-transform duration-300 hover:scale-105 select-none"
        />
      )
    }

    const gradientClass = (() => {
      switch (accentColor) {
        case 'emerald':
          return 'bg-gradient-to-b from-[#14b8a6] via-[#0d9488] to-[#134e4a] drop-shadow-[0_10px_25px_rgba(13,148,136,0.35)]'
        case 'amber':
          return 'bg-gradient-to-b from-[#dfbf83] via-[#b88d46] to-[#5e431a] drop-shadow-[0_10px_25px_rgba(184,141,70,0.35)]'
        case 'blue':
          return 'bg-gradient-to-b from-[#0284c7] via-[#1d4ed8] to-[#1e3a8a] drop-shadow-[0_10px_25px_rgba(2,132,199,0.35)]'
        default:
          return 'bg-gradient-to-b from-[#c084fc] via-[#9d32ec] to-[#801bcc] drop-shadow-[0_12px_30px_rgba(168,85,247,0.4)]'
      }
    })()

    return (
      <div
        aria-hidden="true"
        className={`mx-auto h-44 w-44 sm:h-44 sm:w-44 hover:scale-105 transition-transform duration-300 select-none ${gradientClass}`}
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
    )
  }

  const [question, setQuestion] = useState('')
  const [baseQuestion, setBaseQuestion] = useState('')
  const [focused, setFocused] = useState(false)
  const [typed, setTyped] = useState('')

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition()

  useEffect(() => {
    if (listening) {
      const newQ = baseQuestion ? `${baseQuestion} ${transcript}` : transcript
      setQuestion(newQ.trim())
    }
  }, [transcript, listening, baseQuestion])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = question.trim()
    if (q) onAsk(q)
  }

  // Typewriter placeholder — cycles through sample questions when idle
  useEffect(() => {
    if (question || focused) return
    let promptIndex = 0
    let charIndex = 0
    let deleting = false
    let timer: ReturnType<typeof setTimeout>

    const tick = () => {
      const current = samplePrompts[promptIndex]
      if (!deleting) {
        charIndex++
        setTyped(current.slice(0, charIndex))
        if (charIndex === current.length) {
          deleting = true
          timer = setTimeout(tick, 1800)
          return
        }
        timer = setTimeout(tick, 55)
      } else {
        charIndex--
        setTyped(current.slice(0, charIndex))
        if (charIndex === 0) {
          deleting = false
          promptIndex = (promptIndex + 1) % samplePrompts.length
          timer = setTimeout(tick, 350)
          return
        }
        timer = setTimeout(tick, 30)
      }
    }

    timer = setTimeout(tick, 400)
    return () => clearTimeout(timer)
  }, [question, focused])

  return (
    <section id="home" className="relative flex min-h-[100svh] md:min-h-[100dvh] flex-col justify-center overflow-hidden pb-14 pt-20 sm:pt-24 md:pb-48 md:pt-40">
      {/* Desktop Background Image Layers (>= md) */}
      <img
        src={getDesktopDarkBg()}
        alt=""
        aria-hidden
        className={`pointer-events-none absolute inset-0 hidden md:block h-full w-full object-cover object-bottom transition-opacity duration-300 ease-out ${dark ? 'opacity-100' : 'opacity-0'
          }`}
      />
      <img
        src={bgLight}
        alt=""
        aria-hidden
        className={`pointer-events-none absolute inset-0 hidden md:block h-full w-full object-cover object-bottom transition-opacity duration-300 ease-out ${dark ? 'opacity-0' : 'opacity-100'
          }`}
      />

      {/* Mobile Dedicated Background Image Layers (< md) */}
      <img
        src={getMobileDarkBg()}
        alt=""
        aria-hidden
        className={`pointer-events-none absolute inset-0 block md:hidden h-full w-full object-cover object-center transition-opacity duration-300 ease-out ${dark ? 'opacity-100' : 'opacity-0'
          }`}
      />
      <img
        src={bgLightMobile}
        alt=""
        aria-hidden
        className={`pointer-events-none absolute inset-0 block md:hidden h-full w-full object-cover object-center transition-opacity duration-300 ease-out ${dark ? 'opacity-0' : 'opacity-100'
          }`}
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-5">
        {/* Copy — single centered column */}
        <div className="mx-auto max-w-3xl text-center">
          {/* Centered Zad logo on mobile */}
          <div className="block md:hidden mx-auto mb-4">
            {renderMobileLogo()}
          </div>

          <h1
            className={`font-display text-3xl sm:text-4xl md:text-6xl lg:text-7xl leading-[1.25] md:leading-[1.15] ${dark ? 'text-white' : 'text-brand-deep'
              }`}
            style={{
              textShadow: dark
                ? '0 2px 24px rgba(18,4,31,0.7)'
                : '0 2px 20px rgba(255,255,255,0.85)',
            }}
          >
            <span className="brand-text-gradient">زادٌ</span> في طريق العلوم الشرعية
          </h1>

          <p
            className={`mx-auto mt-3 md:mt-6 max-w-xl text-sm sm:text-base md:text-lg leading-relaxed px-2 ${dark ? 'text-white/90' : 'text-brand-deep/85'
              }`}
            style={{
              textShadow: dark
                ? '0 1px 12px rgba(18,4,31,0.6)'
                : '0 1px 10px rgba(255,255,255,0.9)',
            }}
          >
            منصّةٌ متكامله لمساعدة طالب العلم الشرعي باستخدام الذكاء الاصطناعي مع الإجابات الموثقة من أمهات الكتب
          </p>

          {/* Ask input — wrapped in a min-height container to absorb vertical expansion */}
          <div className="mx-auto mt-3 md:mt-2 flex min-h-[90px] md:min-h-[130px] w-full max-w-2xl items-end justify-center px-1 sm:px-0">
            <form onSubmit={submit} className="flex w-full items-end gap-2 md:gap-3">

              <div className="relative min-w-0 flex-1 rounded-2xl md:rounded-[24px] shadow-lg shadow-black/20 md:shadow-xl transition-all duration-300">
                {/* Moving Animated Gradient Border (ONLY on Desktop, 100% transparent interior) */}
                <div className="desktop-moving-border" />

                <div
                  className={`relative flex items-center gap-1.5 md:gap-2 rounded-2xl md:rounded-[24px] border border-white/15 md:border-transparent py-1.5 md:py-2 pr-3.5 md:pr-5 pl-1.5 md:pl-2 transition-all duration-300 ${dark
                    ? 'bg-white/[0.08] hover:bg-white/[0.14] backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.25)]'
                    : 'bg-white/[0.35] hover:bg-white/[0.45] backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.06)]'
                    }`}
                >
                  <VoiceRecordButton
                    listening={listening}
                    dark={dark}
                    browserSupportsSpeechRecognition={browserSupportsSpeechRecognition}
                    onClick={() => {
                      if (listening) {
                        SpeechRecognition.stopListening()
                      } else {
                        setBaseQuestion(question)
                        resetTranscript()
                        SpeechRecognition.startListening({ language: 'ar-SA', continuous: true })
                      }
                    }}
                  />
                  <TextareaAutosize
                    minRows={1}
                    maxRows={4}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        submit(e as any)
                      }
                    }}
                    placeholder={focused ? 'اكتب سؤالك الشرعي هنا…' : typed}
                    aria-label="اكتب سؤالك"
                    className={`min-w-0 flex-1 resize-none bg-transparent py-1.5 md:py-2.5 text-sm md:text-base outline-none placeholder:text-current/50 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${dark ? 'text-white placeholder:text-white/60 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]' : 'text-brand-deep placeholder:text-brand-deep/60'
                      }`}
                  />
                  <button
                    type="submit"
                    aria-label="اسأل زاد"
                    className="flex h-9 w-9 md:h-11 md:w-11 shrink-0 items-center justify-center rounded-full text-white brand-gradient backdrop-blur-md border border-white/30 shadow-md shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 md:h-5 md:w-5 -scale-x-100">
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

            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
