import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import IslamicPattern from '../../features/knowledge/components/IslamicPattern'

type Feature = {
  id: string
  title: string
  icon: string
  short: string
  detail: string
}

const features: Feature[] = [
  {
    id: 'fiqh',
    title: 'الفقه',
    icon: '📖',
    short: 'أحكامٌ عمليّة مبنيّة على الأدلة.',
    detail: 'إجابات فقهية مدعّمة بالأدلة من الكتاب والسنّة، مع الإشارة إلى أقوال المذاهب المعتبرة عند الاختلاف.',
  },
  {
    id: 'aqeedah',
    title: 'العقيدة',
    icon: '🕌',
    short: 'ترسيخ أصول الإيمان الصحيح.',
    detail: 'شرحٌ ميسّر لمسائل التوحيد والأسماء والصفات وفق منهج أهل السنّة والجماعة.',
  },
  {
    id: 'tafsir',
    title: 'التفسير',
    icon: '✨',
    short: 'فهمٌ أعمق لكتاب الله.',
    detail: 'تفسيرٌ للآيات مع بيان أسباب النزول ومعاني المفردات مستندًا إلى كتب التفسير المعتمدة.',
  },
  {
    id: 'hadith',
    title: 'الحديث',
    icon: '📜',
    short: 'أحاديث موثّقة بدرجاتها.',
    detail: 'تخريج الأحاديث وبيان درجتها من الصحّة والضعف مع ذكر المصدر ورقم الحديث.',
  },
  {
    id: 'quran_sciences',
    title: 'علوم القرآن',
    icon: '🌟',
    short: 'دراسات حول الكتاب المبين.',
    detail: 'مباحث تتعلق بنزول القرآن، وجمعه، وقراءاته، والمكي والمدني، والناسخ والمنسوخ وغير ذلك من علوم القرآن الكريم.',
  },
  {
    id: 'seerah',
    title: 'السيرة النبوية',
    icon: '🌙',
    short: 'أحداثٌ من سيرة خير الأنام.',
    detail: 'سردٌ لأحداث السيرة النبوية العطرة مع استخلاص الدروس والعبر المستفادة من حياة النبي ﷺ.',
  },
  {
    id: 'history',
    title: 'التاريخ الإسلامي',
    icon: '🏛️',
    short: 'نافذة على أمجاد الماضي.',
    detail: 'تغطية شاملة لأبرز المحطات في التاريخ الإسلامي وحضارته عبر العصور المختلفة.',
  },
  {
    id: 'language_sciences',
    title: 'علوم اللغة',
    icon: '📝',
    short: 'لغة الضاد وجمالياتها.',
    detail: 'قواعد النحو والصرف، والبلاغة، ومفردات اللغة العربية التي تعين على فهم النصوص الشرعية.',
  },
]

export default function FeatureCards() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const { accentColor, isDark } = useTheme()

  const getMeteorGradient = () => {
    switch (accentColor) {
      case 'emerald':
        return 'conic-gradient(from 0deg, transparent 0%, transparent 85%, #0284c7 92%, #0d9488 96%, #2dd4bf 100%)'
      case 'amber':
        return 'conic-gradient(from 0deg, transparent 0%, transparent 85%, #8e682d 92%, #c59b58 96%, #dfbf83 100%)'
      case 'blue':
        return 'conic-gradient(from 0deg, transparent 0%, transparent 85%, #1d4ed8 92%, #3b82f6 96%, #60a5fa 100%)'
      case 'purple':
      default:
        return 'conic-gradient(from 0deg, transparent 0%, transparent 85%, #2b7fff 92%, #7a17c9 96%, #c020f0 100%)'
    }
  }

  const getContainerShadowClass = () => {
    switch (accentColor) {
      case 'emerald':
        return 'shadow-[0_0_40px_rgba(20,184,166,0.15)] hover:shadow-[0_30px_80px_-24px_rgba(20,184,166,0.35)]'
      case 'amber':
        return 'shadow-[0_0_40px_rgba(223,191,131,0.15)] hover:shadow-[0_30px_80px_-24px_rgba(223,191,131,0.35)]'
      case 'blue':
        return 'shadow-[0_0_40px_rgba(59,130,246,0.15)] hover:shadow-[0_30px_80px_-24px_rgba(59,130,246,0.35)]'
      case 'purple':
      default:
        return 'shadow-[0_0_40px_rgba(173,70,255,0.15)] hover:shadow-[0_30px_80px_-24px_rgba(173,70,255,0.35)]'
    }
  }

  // Auto-rotation effect
  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % features.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [isPaused])

  return (
    <section id="features" className="relative z-10 mt-0 w-full px-5 py-24 md:py-32 overflow-hidden bg-white dark:bg-background transition-colors duration-300">
      {/* Authentic Islamic Geometric Tessellation Background (from Study Mode) */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-white dark:bg-transparent">
        <div className={`absolute inset-0 transition-opacity duration-300 ${isDark ? 'opacity-[0.08]' : 'opacity-[0.065] md:opacity-[0.14]'}`}>
          <IslamicPattern
            className="text-accent"
            opacity={1}
            scale={0.85}
          />
        </div>
        {/* Soft edge fading masks to blend smoothly */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-transparent to-white/90 dark:from-background dark:via-transparent dark:to-background opacity-40 dark:opacity-75 pointer-events-none" />
        <div className="absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_55%,white_95%)] dark:[background:radial-gradient(ellipse_at_center,transparent_30%,var(--color-background)_80%)] opacity-30 dark:opacity-60 pointer-events-none" />
      </div>

      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mt-3 font-display text-4xl text-foreground md:text-5xl">
            إجابات موثوقة <span className="brand-text-gradient">بين يديك </span>
          </h2>
          <p className="mt-4 text-lg text-stone-600 dark:text-white">
            يجيب زاد علي الأسئلة الشرعية من أمهات الكتب , بالإضافة إلي توثيق الإجابة وارجاع كل جزء إلي مصدره.
          </p>
        </div>

        <div className="mt-16 flex flex-col items-center">
          {/* Main Showcase Container */}
          <div
            className={`animate-float-subtle relative w-full max-w-xl overflow-hidden rounded-[2.6rem] bg-border/40 p-[2.5px] transition-all duration-500 hover:-translate-y-2 ${getContainerShadowClass()}`}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            {/* Spinning 'Meteor' Element for the racing border animation */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div
                className="h-[900px] w-[900px] shrink-0 animate-[spin_20s_linear_infinite]"
                style={{
                  background: getMeteorGradient()
                }}
              />
            </div>

            <div className="relative z-10 h-[440px] w-full overflow-hidden rounded-[2.5rem] bg-card/95 backdrop-blur-xl">
              {/* Ambient Glowing Background */}
              <div className="animate-orbit pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-accent/20 blur-[100px] transition-opacity" />
              <div className="animate-orbit pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-brand-blue/20 blur-[100px] transition-opacity" style={{ animationDirection: 'reverse', animationDuration: '20s' }} />

              {features.map((f, index) => {
                let stateClass = ''
                if (index === activeIndex) {
                  stateClass = 'translate-y-0 opacity-100 z-10 pointer-events-auto scale-100'
                } else if (index < activeIndex) {
                  stateClass = '-translate-y-16 opacity-0 z-0 pointer-events-none scale-95'
                } else {
                  stateClass = 'translate-y-16 opacity-0 z-0 pointer-events-none scale-95'
                }

                return (
                  <div
                    key={f.id}
                    className={`absolute inset-0 flex flex-col items-center justify-center p-8 text-center transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${stateClass}`}
                  >
                    <div className={`brand-gradient mb-6 flex h-24 w-24 items-center justify-center rounded-3xl text-5xl text-white shadow-xl shadow-primary/30 transition-transform duration-700 delay-100 ${index === activeIndex ? 'scale-100' : 'scale-75'}`}>
                      {f.icon}
                    </div>
                    <h3 className={`mb-4 font-display text-4xl text-foreground transition-all duration-700 delay-150 ${index === activeIndex ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>{f.title}</h3>
                    <p className={`mb-2 text-xl font-medium text-accent transition-all duration-700 delay-200 ${index === activeIndex ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>{f.short}</p>
                    <p className={`mb-8 max-w-sm text-base leading-relaxed text-stone-600 dark:text-white transition-all duration-700 delay-300 ${index === activeIndex ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                      {f.detail}
                    </p>

                    <button className={`group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-secondary px-6 py-2.5 text-sm font-semibold text-secondary-foreground transition-all duration-500 delay-500 hover:bg-primary hover:text-white hover:shadow-lg hover:shadow-primary/25 ${index === activeIndex ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                      <span className="relative z-10">استكشف المجال</span>
                      <svg className="relative z-10 h-4 w-4 -scale-x-100 transition-transform group-hover:-translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Navigation Indicator (Modern Dots) */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 px-4">
            {features.map((f, index) => (
              <button
                key={f.id}
                onClick={() => {
                  setActiveIndex(index)
                  // Pause rotation temporarily when user manually clicks to allow them to read
                  setIsPaused(true)
                  setTimeout(() => setIsPaused(false), 8000)
                }}
                aria-label={`الذهاب إلى ${f.title}`}
                className={`h-2.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${index === activeIndex
                  ? 'w-8 bg-accent'
                  : 'w-2.5 bg-border hover:bg-accent/40'
                  }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

