import { useState, useEffect, useRef } from 'react'
import { Globe, Moon, Sun, ArrowLeft } from 'lucide-react'
import bgDark from '@/assets/images/image.webp'
import bgLight from '@/assets/images/authPageBackgroundLight.webp'
import Starfield from '../../components/layout/Starfield'
import Login from './Login'
import Signup from './Signup'
import darkLogo from '@/assets/images/ZadDarkLogo.png'

import { useTheme } from '../../contexts/ThemeContext'

export default function AuthPage({ initialMode = 'login', onBack, onSuccess }: {
  initialMode?: 'login' | 'signup'
  onBack: () => void
  onSuccess: () => void
}) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)
  const { isDark: dark, toggleTheme } = useTheme()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [mode])

  return (
    <div dir="rtl" className={`relative min-h-screen w-full font-sans overflow-hidden transition-colors duration-1000 ${dark ? 'text-white' : 'text-brand-deep'}`}>
      {/* ── FIXED BACKGROUND (Static, doesn't re-render on mode switch) ── */}
      <div className="fixed inset-0 z-0">
        <img
          src={bgDark}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover object-bottom pointer-events-none transition-opacity duration-1000 ease-in-out ${dark ? 'opacity-100' : 'opacity-0'}`}
        />
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
            className={`flex h-11 w-11 items-center justify-center rounded-full text-lg transition-all ${
              dark
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
            onClick={onBack}
            className={`flex h-11 w-11 items-center justify-center rounded-full text-lg transition-all ${
              dark
                ? 'bg-[#a855f7]/15 backdrop-blur-md border border-[#a855f7]/30 hover:bg-[#a855f7]/25 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] text-purple-100'
                : 'bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary'
            }`}
          >
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>
        </div>



        {/* Single Fixed Form Container */}
        <div
          className={`fixed right-6 sm:right-12 lg:right-16 xl:right-24 top-[5vh] z-10 w-[calc(100%-3rem)] sm:w-full max-w-[420px] max-h-[85vh] flex flex-col rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] border backdrop-blur-md overflow-hidden transition-colors duration-1000 ${
            dark 
              ? 'border-white/10 border-t-white/20 border-l-white/20 bg-white/5' 
              : 'border-primary/10 border-t-primary/20 border-l-primary/20 bg-white/40 shadow-[0_8px_32px_0_rgba(122,23,201,0.1)]'
          }`}
          style={{
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)'
          }}
        >
          {/* ── Fixed Header (Logo + Titles) ── */}
          <div className="flex-shrink-0 flex flex-col items-center pt-2 sm:pt-4 pb-0 px-7 sm:px-8 relative z-20 pointer-events-none">
            <div className="auth-logo-entrance mb-1 sm:mb-2">
              <img
                src={darkLogo}
                alt="شعار زاد"
                className="w-28 sm:w-20 h-auto auth-logo drop-shadow-[0_0_30px_rgba(255,255,255,0.15)]"
              />
          </div>

            <div className="w-full mt-0">
              <h1 className={`auth-title text-center text-[24px] sm:text-[28px] leading-[1.4] font-bold mb-1 ${dark ? 'text-white' : 'text-primary'}`}>
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
