import { useState, useEffect, useRef } from 'react'
import { Globe, Moon, Sun, ArrowLeft } from 'lucide-react'
import bgDarkPcPurple from '@/assets/images/pc view main page background dark purple.png'
import bgDarkPcBlue from '@/assets/images/pc view main page background dark blue.webp'
import bgDarkPcTeal from '@/assets/images/pc view main page background dark teal.webp'
import bgDarkPcAmber from '@/assets/images/pc view main page background dark agee.webp'

import bgDarkMobilePurple from '@/assets/images/mobile view main page background dark4.webp'
import bgDarkMobileBlue from '@/assets/images/mobile view main page background dark blue.webp'
import bgDarkMobileTeal from '@/assets/images/mobile view main page background dark teal.webp'
import bgDarkMobileAmber from '@/assets/images/mobile view main page background dark agee.webp'

import bgLight from '@/assets/images/authPageBackgroundLight.webp'
import Starfield from '../../components/layout/Starfield'
import Login from './Login'
import Signup from './Signup'
import darkLogo from '@/assets/images/ZadDarkLogo.png'
import whiteLogo from '@/assets/images/WhiteLogo.png'

import { useTheme } from '../../contexts/ThemeContext'

export default function AuthPage({ initialMode = 'login', onBack, onSuccess }: {
  initialMode?: 'login' | 'signup'
  onBack: () => void
  onSuccess: () => void
}) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)
  const { isDark: dark, toggleTheme, accentColor } = useTheme()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [mode])

  const getDesktopDarkBg = () => {
    switch (accentColor) {
      case 'blue': return bgDarkPcBlue
      case 'emerald': return bgDarkPcTeal
      case 'amber': return bgDarkPcAmber
      case 'purple':
      default: return bgDarkPcPurple
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

  const renderLogo = () => {
    if (accentColor === 'purple') {
      return (
        <img
          src={darkLogo}
          alt="شعار زاد"
          className="w-28 h-32 sm:w-28 sm:h-32 object-contain auth-logo drop-shadow-[0_0_30px_rgba(168,85,247,0.35)]"
        />
      )
    }

    const gradientClass = (() => {
      if (dark) {
        switch (accentColor) {
          case 'emerald':
            return 'bg-gradient-to-b from-[#5eead4] via-[#14b8a6] to-[#0f766e]'
          case 'amber':
            return 'bg-gradient-to-b from-[#f5ecd5] via-[#dfbf83] to-[#8e682d]'
          case 'blue':
            return 'bg-gradient-to-b from-[#38bdf8] via-[#2563eb] to-[#1e40af]'
          default:
            return 'bg-gradient-to-b from-[#d8b4fe] via-[#a855f7] to-[#7e22ce]'
        }
      }
      switch (accentColor) {
        case 'emerald':
          return 'bg-gradient-to-b from-[#14b8a6] via-[#0d9488] to-[#134e4a]'
        case 'amber':
          return 'bg-gradient-to-b from-[#dfbf83] via-[#b88d46] to-[#5e431a]'
        case 'blue':
          return 'bg-gradient-to-b from-[#0284c7] via-[#1d4ed8] to-[#1e3a8a]'
        default:
          return 'bg-gradient-to-b from-[#c084fc] via-[#9d32ec] to-[#801bcc]'
      }
    })()

    return (
      <div
        role="img"
        aria-label="شعار زاد"
        className={`w-28 h-32 sm:w-28 sm:h-32 shrink-0 auth-logo transition-all duration-300 ${gradientClass}`}
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

  const getTitleGradient = () => {
    if (dark) {
      switch (accentColor) {
        case 'emerald':
          return 'linear-gradient(120deg, #14b8a6, #2dd4bf, #5eead4, #99f6e4, #5eead4, #2dd4bf, #14b8a6)'
        case 'amber':
          return 'linear-gradient(120deg, #b88d46, #dfbf83, #edd8ae, #fef3c7, #edd8ae, #dfbf83, #b88d46)'
        case 'blue':
          return 'linear-gradient(120deg, #2563eb, #3b82f6, #60a5fa, #93c5fd, #60a5fa, #3b82f6, #2563eb)'
        default:
          return 'linear-gradient(120deg, #9333ea, #a855f7, #c084fc, #e9d5ff, #c084fc, #a855f7, #9333ea)'
      }
    }
    switch (accentColor) {
      case 'emerald':
        return 'linear-gradient(120deg, #134e4a, #0d9488, #14b8a6, #2dd4bf, #0284c7, #14b8a6, #134e4a)'
      case 'amber':
        return 'linear-gradient(120deg, #5e431a, #8a652a, #b88d46, #dfbf83, #8a652a, #b88d46, #5e431a)'
      case 'blue':
        return 'linear-gradient(120deg, #1e3a8a, #1d4ed8, #2563eb, #3b82f6, #60a5fa, #2563eb, #1e3a8a)'
      default:
        return 'linear-gradient(120deg, #5b0e9c, #8a17c9, #c020f0, #ad46ff, #2b7fff, #8a17c9, #5b0e9c)'
    }
  }

  return (
    <div dir="rtl" className={`relative min-h-screen w-full font-sans overflow-hidden transition-colors duration-1000 ${dark ? 'text-white' : 'text-brand-deep'}`}>
      {/* ── FIXED BACKGROUND (Static, doesn't re-render on mode switch) ── */}
      <div className="fixed inset-0 z-0">
        {/* Desktop Dark Background (>= md) */}
        <img
          src={getDesktopDarkBg()}
          alt=""
          className={`absolute inset-0 hidden md:block h-full w-full object-cover object-bottom pointer-events-none transition-opacity duration-1000 ease-in-out ${dark ? 'opacity-100' : 'opacity-0'}`}
        />
        {/* Mobile Dark Background (< md) */}
        <img
          src={getMobileDarkBg()}
          alt=""
          className={`absolute inset-0 block md:hidden h-full w-full object-cover object-center pointer-events-none transition-opacity duration-1000 ease-in-out ${dark ? 'opacity-100' : 'opacity-0'}`}
        />
        {/* Light Background */}
        <img
          src={bgLight}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover object-bottom pointer-events-none transition-opacity duration-1000 ease-in-out ${dark ? 'opacity-0' : 'opacity-100'}`}
        />
        <div className={`absolute inset-0 pointer-events-none transition-colors duration-1000 ${dark ? 'bg-black/20' : 'bg-white/0'}`} />
        {dark && <Starfield count={55} />}
      </div>

      {/* ── FOREGROUND CONTENT ── */}
      <div className="relative z-10 min-h-screen flex items-center justify-between px-8 lg:px-14 xl:px-20 py-20">

        {/* Top-left nav (Theme Toggle & Back Button) */}
        <div className="fixed top-5 left-5 z-20 flex items-center gap-3">
          <button
            type="button"
            aria-label={dark ? 'الوضع النهاري' : 'الوضع الليلي'}
            onClick={toggleTheme}
            className={`flex h-11 w-11 items-center justify-center rounded-full text-lg transition-all ${dark
              ? 'bg-primary/15 backdrop-blur-md border border-primary/30 hover:bg-primary/25 hover:shadow-[0_0_20px_var(--color-ring)] text-foreground'
              : 'bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary'
              }`}
          >
            <div className={`transition-all duration-700 ${dark ? 'rotate-0' : 'rotate-[360deg] scale-110'}`}>
              {dark ? <Moon size={22} strokeWidth={2.5} /> : <Sun size={22} strokeWidth={2.5} />}
            </div>
          </button>

          <button
            type="button"
            onClick={onBack}
            className={`flex h-11 w-11 items-center justify-center rounded-full text-lg transition-all ${dark
              ? 'bg-primary/15 backdrop-blur-md border border-primary/30 hover:bg-primary/25 hover:shadow-[0_0_20px_var(--color-ring)] text-foreground'
              : 'bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary'
              }`}
          >
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>
        </div>



        {/* Single Fixed Form Container */}
        <div
          className={`fixed right-6 sm:right-12 lg:right-16 xl:right-24 top-[5vh] z-10 w-[calc(100%-3rem)] sm:w-full max-w-[420px] max-h-[85vh] flex flex-col rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] border backdrop-blur-md overflow-hidden transition-colors duration-1000 ${dark
            ? 'border-white/10 border-t-white/20 border-l-white/20 bg-white/5'
            : 'border-primary/10 border-t-primary/20 border-l-primary/20 bg-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)]'
            }`}
          style={{
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)'
          }}
        >
          {/* ── Fixed Header (Logo + Titles) ── */}
          <div className="flex-shrink-0 flex flex-col items-center pt-2 sm:pt-4 pb-0 px-7 sm:px-8 relative z-20 pointer-events-none">
            <div className="auth-logo-entrance mb-1 sm:mb-2">
              {renderLogo()}
            </div>

            <div className="w-full mt-0">
              <h1
                className="auth-title text-center text-[24px] sm:text-[28px] leading-[1.4] font-bold mb-1"
                style={{
                  backgroundImage: getTitleGradient(),
                }}
              >
                {mode === 'login' ? 'سجل الدخول فى زاد' : 'أنشئ حسابك فى زاد'}
              </h1>
              <p className={`auth-subtitle text-center text-[12px] sm:text-[13px] mb-2 sm:mb-4 ${dark ? 'text-white/50' : 'text-primary/70'}`}>
                {mode === 'login'
                  ? 'وواصل رحلتك في مدارسه وفهم العلوم الشرعية'
                  : 'اسأل وتعلم العلوم الشرعيه مع زاد'}
              </p>
            </div>
          </div>

          {/* ── Scrollable Content ── */}
          <div
            ref={scrollRef}
            className="
              flex-1
              overflow-y-auto
              px-7 pb-7 pt-6
              sm:px-8 sm:pb-8
              auth-scroll
              [&::-webkit-scrollbar]:hidden
            "
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <div key={mode} className="auth-content-switch">
              {mode === 'login' ? (
                <Login
                  onNavigateSignup={() => setMode('signup')}
                  onSuccess={onSuccess}
                  isEmbedded={true}
                  dark={dark}
                />
              ) : (
                <Signup
                  onNavigateLogin={() => setMode('login')}
                  onSuccess={onSuccess}
                  isEmbedded={true}
                  dark={dark}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
