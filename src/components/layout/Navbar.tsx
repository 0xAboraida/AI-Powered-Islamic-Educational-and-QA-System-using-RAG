import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import whiteLogo from '@/assets/images/WhiteLogo.webp'
import darkLogo from '@/assets/images/ZadDarkLogo.webp'
import {
  User, LogOut, Settings, LayoutDashboard, Sun, Moon, Sparkles, LogIn, Loader2,
  Activity, Zap, Server, Cpu, Home, BookOpen, GraduationCap, MessageSquare, Mic,
  ChevronLeft, ChevronDown, ShieldCheck, Database, Video, X, BookOpenCheck, Bell, Palette, Menu,
  Share2, Smartphone, Copy, Check, Globe, Mail
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { getAvatarUrl } from '../../api/client'
import StoreBadges from '../ui/StoreBadges'
import NotificationBell from './NotificationBell'
import UserProfileModal from '../../features/profile/UserProfileModal'

const links = [
  { label: 'الرئيسية', href: '#home' },
]

export default function Navbar({
  onTryChat,
  onOpenKnowledge,
  onOpenStudy,
  onOpenAdmin,
  onOpenTurathRag,
  onOpenEngineControl,
  onOpenDataIngestion,
  onOpenV2PipelineAdmin,
  onOpenAdminLibrary,
  onOpenVoiceChat,
  onOpenLessons,
  onOpenYoutubeImporter,
  onOpenSystemObservability,
  onNavigateHome,
  activeTab = 'home',
  headerClassName,
}: {
  onTryChat: () => void
  onOpenKnowledge: () => void
  onOpenStudy: () => void
  onOpenLessons: () => void
  onOpenAdmin?: () => void
  onOpenTurathRag?: () => void
  onOpenEngineControl?: () => void
  onOpenDataIngestion?: () => void
  onOpenV2PipelineAdmin?: () => void
  onOpenAdminLibrary?: () => void
  onOpenVoiceChat?: () => void
  onOpenYoutubeImporter?: () => void
  onOpenSystemObservability?: () => void
  onNavigateHome?: () => void
  activeTab?: 'home' | 'knowledge' | 'lessons' | 'study' | 'chat' | 'voice'
  headerClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [isLoginLoading, setIsLoginLoading] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [copiedType, setCopiedType] = useState<'web' | 'app' | null>(null)
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const [isAdminMenuExpanded, setIsAdminMenuExpanded] = useState(false)
  const [isMobileAdminMenuExpanded, setIsMobileAdminMenuExpanded] = useState(false)

  const profileMenuRef = useRef<HTMLDivElement>(null)
  const themeMenuRef = useRef<HTMLDivElement>(null)

  const { user, isAuthenticated, logout } = useAuth()
  const { theme, toggleTheme, isDark, accentColor, setAccentColor } = useTheme()
  const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.email?.toLowerCase().includes('admin')

  // Dynamic accent styling for all sidebar navigation icons & active state
  const getNavIconBoxClass = () => {
    switch (accentColor) {
      case 'emerald':
        return isDark
          ? 'bg-teal-500/10 border-teal-500/25 text-teal-300'
          : 'bg-teal-50 border-teal-200/80 text-teal-700'
      case 'amber':
        return isDark
          ? 'bg-[#dfbf83]/10 border-[#dfbf83]/25 text-[#eed8ad]'
          : 'bg-[#fbf8f0] border-[#ebd9b5] text-[#8a652a]'
      case 'blue':
        return isDark
          ? 'bg-blue-500/10 border-blue-500/25 text-blue-300'
          : 'bg-blue-50 border-blue-200/80 text-blue-700'
      case 'purple':
      default:
        return isDark
          ? 'bg-purple-500/10 border-purple-500/25 text-purple-300'
          : 'bg-purple-50 border-purple-200/80 text-purple-700'
    }
  }

  const getActiveNavClass = () => {
    switch (accentColor) {
      case 'emerald':
        return isDark
          ? 'border-teal-500/40 bg-teal-950/40 text-teal-200'
          : 'border-teal-600/30 bg-teal-50/80 text-teal-950 shadow-sm'
      case 'amber':
        return isDark
          ? 'border-[#dfbf83]/40 bg-[#251809]/60 text-[#f6eedd]'
          : 'border-[#b88d46]/30 bg-[#fbf8f0] text-[#5e431a] shadow-sm'
      case 'blue':
        return isDark
          ? 'border-blue-500/40 bg-blue-950/40 text-blue-200'
          : 'border-blue-600/30 bg-blue-50/80 text-blue-950 shadow-sm'
      case 'purple':
      default:
        return isDark
          ? 'border-purple-500/40 bg-purple-950/40 text-purple-200'
          : 'border-purple-600/30 bg-purple-50/80 text-purple-950 shadow-sm'
    }
  }

  const getActiveDotClass = () => {
    if (isDark) {
      switch (accentColor) {
        case 'emerald': return 'bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)]'
        case 'amber': return 'bg-[#dfbf83] shadow-[0_0_8px_rgba(223,191,131,0.8)]'
        case 'blue': return 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]'
        default: return 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]'
      }
    } else {
      switch (accentColor) {
        case 'emerald': return 'bg-teal-700'
        case 'amber': return 'bg-[#8a652a]'
        case 'blue': return 'bg-blue-700'
        default: return 'bg-purple-700'
      }
    }
  }

  const getDrawerSectionHeadingClass = () => {
    switch (accentColor) {
      case 'emerald':
        return isDark ? 'text-teal-300/60' : 'text-teal-900/65'
      case 'amber':
        return isDark ? 'text-[#dfbf83]/60' : 'text-[#8a652a]/65'
      case 'blue':
        return isDark ? 'text-blue-300/60' : 'text-blue-900/65'
      case 'purple':
      default:
        return isDark ? 'text-purple-300/60' : 'text-purple-900/65'
    }
  }

  const getDrawerScrollbarThumbClass = () => {
    switch (accentColor) {
      case 'emerald':
        return isDark
          ? '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-teal-500/50 hover:[&::-webkit-scrollbar-thumb]:bg-teal-400/80 [scrollbar-color:rgba(20,184,166,0.5)_transparent]'
          : '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-teal-600/40 hover:[&::-webkit-scrollbar-thumb]:bg-teal-600/70 [scrollbar-color:rgba(13,148,136,0.4)_transparent]'
      case 'amber':
        return isDark
          ? '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#dfbf83]/50 hover:[&::-webkit-scrollbar-thumb]:bg-[#dfbf83]/80 [scrollbar-color:rgba(223,191,131,0.5)_transparent]'
          : '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#b88d46]/40 hover:[&::-webkit-scrollbar-thumb]:bg-[#b88d46]/70 [scrollbar-color:rgba(184,141,70,0.4)_transparent]'
      case 'blue':
        return isDark
          ? '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-blue-500/50 hover:[&::-webkit-scrollbar-thumb]:bg-blue-400/80 [scrollbar-color:rgba(59,130,246,0.5)_transparent]'
          : '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-blue-600/40 hover:[&::-webkit-scrollbar-thumb]:bg-blue-600/70 [scrollbar-color:rgba(37,99,235,0.4)_transparent]'
      case 'purple':
      default:
        return isDark
          ? '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-purple-500/50 hover:[&::-webkit-scrollbar-thumb]:bg-purple-400/80 [scrollbar-color:rgba(168,85,247,0.5)_transparent]'
          : '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-stone-300 hover:[&::-webkit-scrollbar-thumb]:bg-stone-400 [scrollbar-color:rgba(214,211,209,0.7)_transparent]'
    }
  }

  const getDrawerBorderClass = () => {
    switch (accentColor) {
      case 'emerald':
        return isDark ? 'border-teal-500/35' : 'border-teal-600/30'
      case 'amber':
        return isDark ? 'border-[#dfbf83]/35' : 'border-[#b88d46]/35'
      case 'blue':
        return isDark ? 'border-blue-500/35' : 'border-blue-600/30'
      case 'purple':
      default:
        return isDark ? 'border-purple-500/35' : 'border-purple-600/30'
    }
  }

  const getDrawerWelcomeCardClass = () => (isDark ? 'border-white/10 bg-white/[0.03] shadow-sm' : 'border-stone-200/80 bg-white/90 shadow-stone-200/50')

  const getDrawerBgClass = () => (isDark ? 'bg-[#090b10]/98 text-white shadow-[-16px_0_50px_rgba(0,0,0,0.85)]' : 'bg-[#fcfbf9]/98 text-stone-900 shadow-[-12px_0_40px_rgba(0,0,0,0.08)]')

  const getNavItemCardClass = () => (isDark ? 'border-white/[0.07] bg-white/[0.03] text-white/90 hover:bg-white/[0.08] hover:border-white/15' : 'border-stone-200/70 bg-white/80 text-stone-800 hover:bg-white hover:border-stone-300 shadow-2xs')

  const getZadWordClass = () => {
    switch (accentColor) {
      case 'emerald': return isDark ? 'text-teal-400' : 'text-teal-700'
      case 'amber': return isDark ? 'text-[#dfbf83]' : 'text-[#8a652a]'
      case 'blue':
        return isDark
          ? 'bg-gradient-to-l from-[#38bdf8] via-[#60a5fa] to-[#2563eb] bg-clip-text text-transparent font-black drop-shadow-[0_2px_10px_rgba(37,99,235,0.45)]'
          : 'bg-gradient-to-l from-[#0284c7] via-[#1d4ed8] to-[#1e40af] bg-clip-text text-transparent font-black'
      case 'purple':
      default:
        return isDark
          ? 'bg-gradient-to-l from-[#c084fc] via-[#9d32ec] to-[#801bcc] bg-clip-text text-transparent font-black drop-shadow-[0_2px_10px_rgba(157,50,236,0.4)]'
          : 'bg-gradient-to-l from-[#7b1fa2] via-[#8e24aa] to-[#5e1482] bg-clip-text text-transparent font-black'
    }
  }

  const renderBrandLogo = (sizeClass = 'h-8 w-8 lg:h-10 lg:w-10') => {
    if (accentColor === 'purple') {
      return (
        <img
          src={darkLogo}
          alt="شعار زاد"
          className={`${sizeClass} shrink-0 object-contain drop-shadow-[0_3px_12px_rgba(157,50,236,0.35)] transition-all`}
        />
      )
    }

    const shadowClass = isDark
      ? accentColor === 'blue'
        ? 'drop-shadow-[0_3px_12px_rgba(37,99,235,0.45)]'
        : accentColor === 'emerald'
        ? 'drop-shadow-[0_3px_12px_rgba(20,184,166,0.4)]'
        : 'drop-shadow-[0_3px_12px_rgba(223,191,131,0.4)]'
      : accentColor === 'blue'
      ? 'drop-shadow-[0_2px_8px_rgba(2,132,199,0.35)]'
      : accentColor === 'emerald'
      ? 'drop-shadow-[0_2px_8px_rgba(13,148,136,0.35)]'
      : 'drop-shadow-[0_2px_8px_rgba(184,141,70,0.35)]'

    return (
      <div
        aria-hidden="true"
        className={`${sizeClass} shrink-0 transition-colors duration-300 ${shadowClass} ${getLogoBgColorClass()}`}
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

  const getTabIndicatorClass = () => {
    switch (accentColor) {
      case 'emerald': return 'bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.95)]'
      case 'amber': return 'bg-[#dfbf83] shadow-[0_0_12px_rgba(223,191,131,0.95)]'
      case 'blue': return 'bg-gradient-to-r from-[#38bdf8] to-[#2563eb] shadow-[0_0_12px_rgba(37,99,235,0.95)]'
      default: return 'bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.95)]'
    }
  }

  const getTabLinkClass = (isActive = false) => {
    if (isDark) {
      return isActive
        ? 'text-white font-bold'
        : 'text-white/80 hover:text-white font-semibold'
    } else {
      return isActive
        ? 'text-stone-950 font-bold'
        : 'text-stone-800 hover:text-black font-semibold'
    }
  }

  const getLogoBgColorClass = () => {
    switch (accentColor) {
      case 'emerald':
        return isDark
          ? 'bg-gradient-to-b from-[#5eead4] via-[#14b8a6] to-[#0f766e]'
          : 'bg-gradient-to-b from-[#14b8a6] via-[#0d9488] to-[#134e4a]'
      case 'amber':
        return isDark
          ? 'bg-gradient-to-b from-[#f5ecd5] via-[#dfbf83] to-[#8e682d]'
          : 'bg-gradient-to-b from-[#dfbf83] via-[#b88d46] to-[#5e431a]'
      case 'blue':
        return isDark
          ? 'bg-gradient-to-b from-[#38bdf8] via-[#2563eb] to-[#1e40af]'
          : 'bg-gradient-to-b from-[#0284c7] via-[#1d4ed8] to-[#1e3a8a]'
      default: return isDark ? 'bg-purple-300' : 'bg-purple-700'
    }
  }

  const getDrawerCloseButtonClass = () => {
    switch (accentColor) {
      case 'emerald':
        return isDark
          ? 'border-teal-500/25 bg-teal-500/10 text-teal-300 hover:border-teal-500/40 hover:bg-teal-500/15'
          : 'border-teal-500/30 bg-teal-50/80 text-teal-800 hover:bg-teal-100/80'
      case 'amber':
        return isDark
          ? 'border-[#dfbf83]/25 bg-[#dfbf83]/10 text-[#eed9b0] hover:border-[#dfbf83]/40 hover:bg-[#dfbf83]/15'
          : 'border-[#dfbf83]/40 bg-[#fbf8f0] text-[#8a652a] hover:bg-[#ebd9b5]/40'
      case 'blue':
        return isDark
          ? 'border-blue-500/25 bg-blue-500/10 text-blue-300 hover:border-blue-500/40 hover:bg-blue-500/15'
          : 'border-blue-500/30 bg-blue-50/80 text-blue-800 hover:bg-blue-100/80'
      case 'purple':
      default:
        return isDark
          ? 'border-purple-500/25 bg-purple-500/10 text-purple-300 hover:border-purple-500/40 hover:bg-purple-500/15'
          : 'border-purple-500/30 bg-purple-50/80 text-purple-800 hover:bg-purple-100/80'
    }
  }

  const getThemeBadgeClass = () => {
    switch (accentColor) {
      case 'emerald': return isDark ? 'bg-teal-500/15 text-teal-300 border-teal-500/30' : 'bg-teal-50 text-teal-800 border-teal-200'
      case 'amber': return isDark ? 'bg-[#dfbf83]/15 text-[#eed9b0] border-[#dfbf83]/30' : 'bg-[#fbf8f0] text-[#8a652a] border-[#ebd9b5]'
      case 'blue': return isDark ? 'bg-blue-500/15 text-blue-300 border-blue-500/30' : 'bg-blue-50 text-blue-800 border-blue-200'
      default: return isDark ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'bg-purple-50 text-purple-800 border-purple-200'
    }
  }

  const getThemeToggleTrackClass = () => {
    if (!isDark) return 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.35)]'
    switch (accentColor) {
      case 'emerald': return 'bg-gradient-to-r from-teal-700 to-cyan-600 shadow-[0_0_12px_rgba(20,184,166,0.35)]'
      case 'amber': return 'bg-gradient-to-r from-[#8e682d] to-[#c59b58] shadow-[0_0_12px_rgba(223,191,131,0.35)]'
      case 'blue': return 'bg-gradient-to-r from-blue-700 to-indigo-600 shadow-[0_0_12px_rgba(59,130,246,0.35)]'
      default: return 'bg-gradient-to-r from-purple-700 to-indigo-600 shadow-[0_0_12px_rgba(168,85,247,0.35)]'
    }
  }

  const getNavActionBtnClass = () => {
    switch (accentColor) {
      case 'emerald':
        return isDark
          ? 'bg-teal-500/10 border-teal-500/25 text-teal-300 hover:bg-teal-500/20 hover:border-teal-500/40 shadow-sm'
          : 'bg-white/80 border-teal-200 text-teal-800 hover:bg-teal-50 shadow-sm'
      case 'amber':
        return isDark
          ? 'bg-[#dfbf83]/10 border-[#dfbf83]/25 text-[#eed9b0] hover:bg-[#dfbf83]/20 hover:border-[#dfbf83]/40 shadow-sm'
          : 'bg-white/80 border-[#ebd9b5] text-[#8a652a] hover:bg-[#fbf8f0] shadow-sm'
      case 'blue':
        return isDark
          ? 'bg-blue-500/10 border-blue-500/25 text-blue-300 hover:bg-blue-500/20 hover:border-blue-500/40 shadow-sm'
          : 'bg-white/80 border-blue-200 text-blue-800 hover:bg-blue-50 shadow-sm'
      case 'purple':
      default:
        return isDark
          ? 'bg-purple-500/10 border-purple-500/25 text-purple-300 hover:bg-purple-500/20 hover:border-purple-500/40 shadow-sm'
          : 'bg-white/80 border-purple-200 text-purple-800 hover:bg-purple-50 shadow-sm'
    }
  }

  const getDropdownGlassClass = () => {
    if (isDark) {
      switch (accentColor) {
        case 'emerald':
          return 'bg-[#080c14]/96 border-teal-500/25 text-white shadow-2xl shadow-black/80'
        case 'amber':
          return 'bg-[#0b0c10]/96 border-[#dfbf83]/25 text-white shadow-2xl shadow-black/80'
        case 'blue':
          return 'bg-[#080d1a]/96 border-blue-500/25 text-white shadow-2xl shadow-black/80'
        case 'purple':
        default:
          return 'bg-[#0c0717]/96 border-purple-500/25 text-white shadow-2xl shadow-black/80'
      }
    } else {
      return 'bg-white/96 border-stone-200 text-stone-900 shadow-xl shadow-stone-200/50'
    }
  }

  const getAccentLabelClass = () => {
    switch (accentColor) {
      case 'emerald': return 'text-teal-400'
      case 'amber': return 'text-[#dfbf83]'
      case 'blue': return 'text-blue-400'
      default: return 'text-purple-400'
    }
  }

  const copyToClipboard = async (text: string): Promise<boolean> => {
    // 1. Try modern navigator.clipboard if available (secure context / localhost / HTTPS)
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(text)
        return true
      } catch (err) {
        console.warn('navigator.clipboard.writeText failed, trying fallback:', err)
      }
    }

    // 2. Reliable cross-browser fallback using temporary textarea (works on mobile, HTTP, local IPs)
    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.top = '0'
      textArea.style.left = '0'
      textArea.style.width = '2em'
      textArea.style.height = '2em'
      textArea.style.padding = '0'
      textArea.style.border = 'none'
      textArea.style.outline = 'none'
      textArea.style.boxShadow = 'none'
      textArea.style.background = 'transparent'
      textArea.setAttribute('readonly', '')
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      textArea.setSelectionRange(0, 99999)
      const success = document.execCommand('copy')
      document.body.removeChild(textArea)
      if (success) return true
    } catch (err) {
      console.warn('execCommand fallback failed:', err)
    }

    // 3. Extreme fallback
    try {
      window.prompt('يرجى نسخ الرابط:', text)
      return true
    } catch {
      return false
    }
  }

  const handleShare = async (type: 'web' | 'app') => {
    const url = type === 'web'
      ? 'https://zad-islamic-ai.vercel.app/'
      : 'https://apkpure.com/p/com.example.zaad'
    const title = type === 'web' ? 'منصة زاد للعلوم الشرعية' : 'تطبيق زاد للهاتف (أندرويد)'
    const text = type === 'web'
      ? 'منصة زاد للعلوم الشرعية بالذكاء الاصطناعي - إجابات موثقة من أمهات الكتب الشرعية'
      : 'حمّل تطبيق زاد للهاتف الآن وادرس العلوم الشرعية بسهولة'

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title,
          text: `${title}\n${text}`,
          url,
        })
      } catch (err: any) {
        if (err?.name === 'AbortError') return
        console.warn('Native navigator.share failed:', err)
      }
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false)
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header className={headerClassName || "fixed md:absolute inset-x-0 top-4 sm:top-6 z-50 px-3 sm:px-4"}>
      {/* Mobile top floating bar (< md): Menu toggle button on Right, NotificationBell on Left */}
      <div className="flex md:hidden items-center justify-between pointer-events-none w-full">
        <button
          type="button"
          aria-label="فتح القائمة"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className={`pointer-events-auto flex h-11 w-11 items-center justify-center rounded-2xl border backdrop-blur-[6px] transition-all duration-300 active:scale-90 ${isDark
            ? 'border-white/20 bg-white/[0.08] hover:bg-white/[0.16] text-white shadow-[0_4px_20px_rgba(0,0,0,0.25)]'
            : 'border-white/50 bg-white/[0.20] hover:bg-white/[0.30] text-purple-950 shadow-[0_4px_20px_rgba(0,0,0,0.06)]'
            }`}
        >
          <Menu size={22} strokeWidth={2.3} className="transition-transform group-hover:scale-105" />
        </button>

        <div className="pointer-events-auto">
          <NotificationBell variant="glass" />
        </div>
      </div>

      <nav className={`mx-auto hidden md:flex w-full max-w-[98%] xl:max-w-7xl items-center justify-between rounded-[2rem] border px-3 sm:px-4 lg:px-6 py-2 lg:py-2.5 backdrop-blur-xl transition-colors duration-300 ${
        isDark
          ? accentColor === 'emerald'
            ? 'border-teal-500/25 bg-[#061014]/50 shadow-[0_0_40px_rgba(20,184,166,0.12)]'
            : accentColor === 'amber'
            ? 'border-[#dfbf83]/25 bg-[#120e09]/50 shadow-[0_0_40px_rgba(223,191,131,0.12)]'
            : accentColor === 'blue'
            ? 'border-blue-500/25 bg-[#060c18]/50 shadow-[0_0_40px_rgba(59,130,246,0.12)]'
            : 'border-purple-500/25 bg-[#0a0214]/50 shadow-[0_0_40px_rgba(122,23,201,0.15)]'
          : 'border-stone-200/80 bg-white/70 shadow-[0_10px_30px_rgba(0,0,0,0.04)] text-stone-900'
      }`}>

        {/* Brand (Right Section in RTL) */}
        <a
          href="#home"
          onClick={(e) => {
            if (onNavigateHome) {
              e.preventDefault()
              onNavigateHome()
            }
          }}
          className="flex shrink-0 items-center gap-2 lg:gap-2.5 transition-transform hover:scale-105 cursor-pointer"
        >
          {renderBrandLogo('h-8 w-8 lg:h-10 lg:w-10')}
          <span className={`font-display text-[22px] lg:text-[28px] inline-block transition-colors ${getZadWordClass()}`}>زاد</span>
        </a>

        {/* Center Section: Tabs (Adapts and shrinks down to 768px) */}
        <div className="hidden flex-1 items-center justify-center md:flex px-1 lg:px-2 xl:px-4 min-w-0">
          <ul className="flex items-center gap-1.5 sm:gap-2.5 lg:gap-3.5 xl:gap-6">
            <li className="shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (onNavigateHome) {
                    onNavigateHome()
                  } else {
                    window.location.hash = '#home'
                  }
                }}
                className={`group relative flex flex-col items-center py-1 text-[12.5px] sm:text-[13px] lg:text-[15px] xl:text-[16.5px] transition-colors duration-300 whitespace-nowrap ${getTabLinkClass(activeTab === 'home')}`}
              >
                الرئيسية
                {activeTab === 'home' ? (
                  <motion.span
                    layoutId="desktopNavActiveIndicator"
                    className={`absolute -bottom-2 lg:-bottom-3 h-[2px] lg:h-[3px] rounded-full ${getTabIndicatorClass()} w-6 lg:w-8`}
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                ) : (
                  <span className="absolute -bottom-2 lg:-bottom-3 h-[2px] lg:h-[3px] rounded-full bg-white/25 dark:bg-white/15 w-0 group-hover:w-6 lg:group-hover:w-8 transition-all duration-300" />
                )}
              </button>
            </li>
            <li className="shrink-0">
              <button
                type="button"
                onClick={onOpenKnowledge}
                className={`group relative flex flex-col items-center py-1 text-[12.5px] sm:text-[13px] lg:text-[15px] xl:text-[16.5px] transition-colors duration-300 whitespace-nowrap ${getTabLinkClass(activeTab === 'knowledge')}`}
              >
                المكتبة
                {activeTab === 'knowledge' ? (
                  <motion.span
                    layoutId="desktopNavActiveIndicator"
                    className={`absolute -bottom-2 lg:-bottom-3 h-[2px] lg:h-[3px] rounded-full ${getTabIndicatorClass()} w-6 lg:w-8`}
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                ) : (
                  <span className="absolute -bottom-2 lg:-bottom-3 h-[2px] lg:h-[3px] rounded-full bg-white/25 dark:bg-white/15 w-0 group-hover:w-6 lg:group-hover:w-8 transition-all duration-300" />
                )}
              </button>
            </li>
            <li className="shrink-0">
              <button
                type="button"
                onClick={onOpenLessons}
                className={`group relative flex flex-col items-center py-1 text-[12.5px] sm:text-[13px] lg:text-[15px] xl:text-[16.5px] transition-colors duration-300 whitespace-nowrap ${getTabLinkClass(activeTab === 'lessons')}`}
              >
                الشروحات والدروس
                {activeTab === 'lessons' ? (
                  <motion.span
                    layoutId="desktopNavActiveIndicator"
                    className={`absolute -bottom-2 lg:-bottom-3 h-[2px] lg:h-[3px] rounded-full ${getTabIndicatorClass()} w-6 lg:w-8`}
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                ) : (
                  <span className="absolute -bottom-2 lg:-bottom-3 h-[2px] lg:h-[3px] rounded-full bg-white/25 dark:bg-white/15 w-0 group-hover:w-6 lg:group-hover:w-8 transition-all duration-300" />
                )}
              </button>
            </li>
            <li className="shrink-0">
              <button
                type="button"
                onClick={onOpenStudy}
                className={`group relative flex flex-col items-center py-1 text-[12.5px] sm:text-[13px] lg:text-[15px] xl:text-[16.5px] transition-colors duration-300 whitespace-nowrap ${getTabLinkClass(activeTab === 'study')}`}
              >
                وضع الدراسة
                {activeTab === 'study' ? (
                  <motion.span
                    layoutId="desktopNavActiveIndicator"
                    className={`absolute -bottom-2 lg:-bottom-3 h-[2px] lg:h-[3px] rounded-full ${getTabIndicatorClass()} w-6 lg:w-8`}
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                ) : (
                  <span className="absolute -bottom-2 lg:-bottom-3 h-[2px] lg:h-[3px] rounded-full bg-white/25 dark:bg-white/15 w-0 group-hover:w-6 lg:group-hover:w-8 transition-all duration-300" />
                )}
              </button>
            </li>
            <li className="shrink-0">
              <button
                type="button"
                onClick={onTryChat}
                className={`group relative flex flex-col items-center py-1 text-[12.5px] sm:text-[13px] lg:text-[15px] xl:text-[16.5px] transition-colors duration-300 whitespace-nowrap ${getTabLinkClass(activeTab === 'chat')}`}
              >
                المحادثة النصية
                {activeTab === 'chat' ? (
                  <motion.span
                    layoutId="desktopNavActiveIndicator"
                    className={`absolute -bottom-2 lg:-bottom-3 h-[2px] lg:h-[3px] rounded-full ${getTabIndicatorClass()} w-6 lg:w-8`}
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                ) : (
                  <span className="absolute -bottom-2 lg:-bottom-3 h-[2px] lg:h-[3px] rounded-full bg-white/25 dark:bg-white/15 w-0 group-hover:w-6 lg:group-hover:w-8 transition-all duration-300" />
                )}
              </button>
            </li>
            <li className="shrink-0">
              <button
                type="button"
                onClick={onOpenVoiceChat}
                className={`group relative flex flex-col items-center py-1 text-[12.5px] sm:text-[13px] lg:text-[15px] xl:text-[16.5px] transition-colors duration-300 whitespace-nowrap ${getTabLinkClass(activeTab === 'voice')}`}
              >
                المحادثة الصوتية
                {activeTab === 'voice' ? (
                  <motion.span
                    layoutId="desktopNavActiveIndicator"
                    className={`absolute -bottom-2 lg:-bottom-3 h-[2px] lg:h-[3px] rounded-full ${getTabIndicatorClass()} w-6 lg:w-8`}
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                ) : (
                  <span className="absolute -bottom-2 lg:-bottom-3 h-[2px] lg:h-[3px] rounded-full bg-white/25 dark:bg-white/15 w-0 group-hover:w-6 lg:group-hover:w-8 transition-all duration-300" />
                )}
              </button>
            </li>
          </ul>
        </div>

        {/* CTA & Actions */}
        <div className="hidden shrink-0 items-center gap-2 lg:gap-3 md:flex">
          {/* جرس الإشعارات */}
          <NotificationBell />

          {/* زر القائمة والإعدادات (مدخل الإعدادات والبروفايل في وضع الكمبيوتر) */}
          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              aria-label="الإعدادات والمظهر"
              title="الإعدادات والمظهر"
              className={`flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-md transition-all active:scale-95 group ${getNavActionBtnClass()}`}
            >
              <Settings className="h-4.5 w-4.5 transition-transform group-hover:rotate-45 duration-300" strokeWidth={2.2} />
            </button>

            {showProfileMenu && (
              <div
                dir="rtl"
                className={`absolute left-0 top-full mt-3 w-84 max-h-[85vh] overflow-y-auto rounded-3xl border p-3.5 shadow-2xl backdrop-blur-2xl transition-all text-right slim-scrollbar z-50 space-y-2.5 ${getDropdownGlassClass()}`}
              >
                {/* 1. تاب البروفايل */}
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false)
                      setShowProfileModal(true)
                    }}
                    className={`flex w-full items-center justify-between rounded-2xl border p-3 text-right transition-all duration-200 active:scale-[0.99] ${getNavItemCardClass()}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full brand-gradient text-white shadow-md overflow-hidden ring-2 ring-white/15">
                        {user?.avatarUrl ? (
                          <img
                            src={getAvatarUrl(user.avatarUrl)}
                            alt={user?.name || 'مستخدم'}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User size={22} strokeWidth={2.2} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 text-right">
                        <div className="flex items-center gap-2">
                          <span className={`truncate text-sm font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                            {user?.name || (isAdmin ? 'مسؤول النظام' : 'مستخدم زاد')}
                          </span>
                          {isAdmin && (
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold border ${getThemeBadgeClass()}`}>
                              أدمن
                            </span>
                          )}
                        </div>
                        <p className={`truncate text-xs font-mono mt-0.5 ${isDark ? 'text-white/50' : 'text-stone-500'}`}>
                          {user?.email || 'طالب علم'}
                        </p>
                      </div>
                    </div>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${isDark ? 'text-white/60 hover:text-white' : 'text-stone-500'}`}>
                      <ChevronLeft size={18} />
                    </div>
                  </button>
                ) : (
                  <div className={`rounded-2xl border p-3.5 text-right shadow-sm ${isDark ? getDrawerWelcomeCardClass() : 'border-stone-200/80 bg-white/90 shadow-stone-200/50'}`}>
                    <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>مرحباً بك</h4>
                    <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-white/70' : 'text-stone-500'}`}>
                      قم بالتسجيل للاستفادة من خدمات الموقع
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false)
                        setIsLoginLoading(true)
                        onTryChat()
                        setTimeout(() => setIsLoginLoading(false), 1500)
                      }}
                      disabled={isLoginLoading}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#53177d] hover:bg-[#431265] text-white py-2 px-3 text-xs font-bold shadow-sm shadow-[#53177d]/20 active:scale-[0.98] transition-all"
                    >
                      {isLoginLoading ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
                      <span>تسجيل الدخول / إنشاء حساب</span>
                    </button>
                  </div>
                )}

                {/* لوحات إدارة النظام (للأدمن) */}
                {isAuthenticated && isAdmin && (
                  <div className={`rounded-xl border transition-all overflow-hidden ${getNavItemCardClass()}`}>
                    <button
                      type="button"
                      onClick={() => setIsAdminMenuExpanded(!isAdminMenuExpanded)}
                      className="flex w-full items-center justify-between px-3.5 py-2.5 text-right transition-colors cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${getNavIconBoxClass()}`}>
                          <ShieldCheck size={16} />
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <span className="block text-sm font-bold">لوحات إدارة النظام</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getThemeBadgeClass()}`}>
                              أدمن
                            </span>
                          </div>
                          <span className={`text-[11px] font-normal ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                            صفحات وأدوات التحكم الإداري
                          </span>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: isAdminMenuExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown size={16} className={isDark ? 'text-white/50' : 'text-stone-400'} />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {isAdminMenuExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`border-t px-2 py-2 space-y-1 ${
                            isDark ? 'border-white/10 bg-black/25' : 'border-stone-200/80 bg-stone-50/80'
                          }`}
                        >
                          {onOpenAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowProfileMenu(false)
                                onOpenAdmin()
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-right text-xs font-semibold transition-colors ${isDark ? 'text-brand-blue hover:bg-white/10' : 'text-blue-700 hover:bg-blue-50'}`}
                            >
                              <div className="flex items-center gap-2">
                                <LayoutDashboard size={13} />
                                <span>إدارة وضع الدراسة</span>
                              </div>
                              <ChevronLeft size={12} className={isDark ? 'text-blue-400/50' : 'text-blue-700/50'} />
                            </button>
                          )}

                          {onOpenTurathRag && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowProfileMenu(false)
                                onOpenTurathRag()
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-right text-xs font-semibold transition-colors ${isDark ? 'text-sky-400 hover:bg-white/10' : 'text-sky-700 hover:bg-sky-50'}`}
                            >
                              <div className="flex items-center gap-2">
                                <Zap size={13} />
                                <span>استخراج وتخزين الكتب</span>
                              </div>
                              <ChevronLeft size={12} className={isDark ? 'text-sky-400/50' : 'text-sky-700/50'} />
                            </button>
                          )}

                          {onOpenEngineControl && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowProfileMenu(false)
                                onOpenEngineControl()
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-right text-xs font-semibold transition-colors ${isDark ? 'text-purple-400 hover:bg-white/10' : 'text-purple-700 hover:bg-purple-50'}`}
                            >
                              <div className="flex items-center gap-2">
                                <Cpu size={13} />
                                <span>التحكم في محركات RAG</span>
                              </div>
                              <ChevronLeft size={12} className={isDark ? 'text-purple-400/50' : 'text-purple-700/50'} />
                            </button>
                          )}

                          {onOpenDataIngestion && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowProfileMenu(false)
                                onOpenDataIngestion()
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-right text-xs font-semibold transition-colors ${isDark ? 'text-emerald-400 hover:bg-white/10' : 'text-emerald-700 hover:bg-emerald-50'}`}
                            >
                              <div className="flex items-center gap-2">
                                <Database size={13} />
                                <span>إدارة البيانات</span>
                              </div>
                              <ChevronLeft size={12} className={isDark ? 'text-emerald-400/50' : 'text-emerald-700/50'} />
                            </button>
                          )}

                          {onOpenV2PipelineAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowProfileMenu(false)
                                onOpenV2PipelineAdmin()
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-right text-xs font-semibold transition-colors ${isDark ? 'text-blue-400 hover:bg-white/10' : 'text-blue-700 hover:bg-blue-50'}`}
                            >
                              <div className="flex items-center gap-2">
                                <Sparkles size={13} />
                                <span>إدخال بيانات AI</span>
                              </div>
                              <ChevronLeft size={12} className={isDark ? 'text-blue-400/50' : 'text-blue-700/50'} />
                            </button>
                          )}

                          {onOpenAdminLibrary && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowProfileMenu(false)
                                onOpenAdminLibrary()
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-right text-xs font-semibold transition-colors ${isDark ? 'text-amber-400 hover:bg-white/10' : 'text-amber-700 hover:bg-amber-50'}`}
                            >
                              <div className="flex items-center gap-2">
                                <BookOpen size={13} />
                                <span>إدارة مكتبة القراءة</span>
                              </div>
                              <ChevronLeft size={12} className={isDark ? 'text-amber-400/50' : 'text-amber-700/50'} />
                            </button>
                          )}

                          {onOpenYoutubeImporter && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowProfileMenu(false)
                                onOpenYoutubeImporter()
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-right text-xs font-semibold transition-colors ${isDark ? 'text-red-400 hover:bg-white/10' : 'text-red-700 hover:bg-red-50'}`}
                            >
                              <div className="flex items-center gap-2">
                                <Video size={13} />
                                <span>استيراد شروحات يوتيوب</span>
                              </div>
                              <ChevronLeft size={12} className={isDark ? 'text-red-400/50' : 'text-red-700/50'} />
                            </button>
                          )}

                          {onOpenSystemObservability && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowProfileMenu(false)
                                onOpenSystemObservability()
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-right text-xs font-semibold transition-colors ${isDark ? 'text-amber-300 hover:bg-white/10' : 'text-amber-700 hover:bg-amber-50'}`}
                            >
                              <div className="flex items-center gap-2">
                                <Activity size={13} />
                                <span>مراقبة النظام والـ AI</span>
                              </div>
                              <ChevronLeft size={12} className={isDark ? 'text-amber-300/50' : 'text-amber-700/50'} />
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* 2. الإضاءة (مطابق للهاتف) */}
                <div
                  onClick={toggleTheme}
                  role="button"
                  tabIndex={0}
                  className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm font-semibold cursor-pointer active:scale-[0.99] transition-all select-none ${getNavItemCardClass()}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${getNavIconBoxClass()}`}>
                      {isDark ? <Moon size={16} /> : <Sun size={16} />}
                    </div>
                    <div className="text-right">
                      <span className="block text-sm font-bold">الإضاءة</span>
                      <span className={`text-[11px] font-normal ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                        {isDark ? 'الوضع الليلي مفعّل' : 'الوضع النهاري مفعّل'}
                      </span>
                    </div>
                  </div>

                  {/* Modern Animated Switch Component */}
                  <div
                    className={`relative flex h-7 w-14 items-center rounded-full p-1 transition-colors duration-300 ${getThemeToggleTrackClass()}`}
                  >
                    <div className="absolute inset-x-2 flex justify-between items-center text-[10px] pointer-events-none">
                      <Moon size={12} className={isDark ? 'text-white/80' : 'text-black/25'} />
                      <Sun size={12} className={!isDark ? 'text-amber-950/80' : 'text-white/25'} />
                    </div>

                    <motion.div
                      layout
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className={`z-10 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-md ${
                        isDark ? 'mr-0 ml-auto text-stone-800' : 'ml-0 mr-auto text-amber-600'
                      }`}
                    >
                      {isDark ? <Moon size={11} strokeWidth={2.5} /> : <Sun size={11} strokeWidth={2.5} />}
                    </motion.div>
                  </div>
                </div>

                {/* 3. لون السمة (مطابق للهاتف) */}
                <div className={`rounded-xl border p-3 ${getNavItemCardClass()}`}>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <Palette size={15} className={accentColor === 'emerald' ? 'text-teal-400' : accentColor === 'amber' ? 'text-[#dfbf83]' : accentColor === 'blue' ? 'text-blue-400' : 'text-purple-400'} />
                      <span>لون السمة</span>
                    </div>
                    <span className={`text-[10px] font-bold ${accentColor === 'emerald' ? 'text-teal-400' : accentColor === 'amber' ? 'text-[#dfbf83]' : accentColor === 'blue' ? 'text-blue-400' : 'text-purple-400'}`}>
                      {accentColor === 'purple' && 'أرجواني ملكي'}
                      {accentColor === 'emerald' && 'فيروزي إسلامي'}
                      {accentColor === 'amber' && 'عاجي إسلامي'}
                      {accentColor === 'blue' && 'أزرق ياقوتي'}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'purple', name: 'أرجواني', gradient: 'from-purple-700 to-fuchsia-500', ring: 'ring-purple-400' },
                      { id: 'emerald', name: 'فيروزي', gradient: 'from-teal-700 via-teal-500 to-cyan-400', ring: 'ring-teal-400' },
                      { id: 'amber', name: 'عاجي', gradient: 'from-[#8e682d] via-[#c59b58] to-[#eedbb2]', ring: 'ring-[#dfbf83]' },
                      { id: 'blue', name: 'ياقوتي', gradient: 'from-blue-700 to-indigo-500', ring: 'ring-blue-400' },
                    ].map((item) => {
                      const isSelected = accentColor === item.id
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setAccentColor(item.id as any)}
                          className="group flex flex-col items-center gap-1.5 py-1 px-1 transition-all active:scale-95"
                        >
                          <span
                            className={`h-7 w-7 rounded-full bg-gradient-to-tr ${item.gradient} transition-all duration-300 ${
                              isSelected
                                ? `ring-2 ${item.ring} ring-offset-2 ${isDark ? 'ring-offset-[#120324]' : 'ring-offset-white'} scale-115 shadow-lg`
                                : 'scale-90 opacity-70 group-hover:opacity-100 group-hover:scale-95'
                            }`}
                          />
                          <span
                            className={`text-[10px] leading-tight transition-colors ${
                              isSelected ? (isDark ? 'font-bold text-white' : 'font-bold text-stone-900') : isDark ? 'font-medium text-white/60' : 'font-medium text-stone-600'
                            }`}
                          >
                            {item.name}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 4. تحميل الأبلكيشن (مطابق للهاتف) */}
                <a
                  href="https://apkpure.com/p/com.example.zaad"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowProfileMenu(false)}
                  className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm font-semibold active:scale-[0.99] transition-all ${getNavItemCardClass()}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${getNavIconBoxClass()}`}>
                      <Smartphone size={16} />
                    </div>
                    <div className="text-right">
                      <span className="block text-sm font-bold">تطبيق زاد للأندرويد</span>
                      <span className={`text-[11px] font-normal ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                        تحميل مباشر عبر APKPure
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getThemeBadgeClass()}`}>
                    تثبيت
                  </span>
                </a>

                {/* 5. مشاركة زاد (مطابق للهاتف) */}
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false)
                    setShowShareModal(true)
                  }}
                  className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm font-semibold active:scale-[0.99] transition-all ${getNavItemCardClass()}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${getNavIconBoxClass()}`}>
                      <Share2 size={16} />
                    </div>
                    <div className="text-right">
                      <span className="block text-sm font-bold">مشاركة زاد</span>
                      <span className={`text-[11px] font-normal ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                        شارك الموقع أو رابط التطبيق
                      </span>
                    </div>
                  </div>
                  <ChevronLeft size={16} className={isDark ? 'text-white/55' : 'text-stone-400'} />
                </button>

                {/* 6. تسجيل الخروج */}
                {isAuthenticated && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false)
                      logout()
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors active:scale-95"
                  >
                    <LogOut size={15} />
                    <span>تسجيل خروج</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Backdrop Overlay & Drawer with Smooth Physics-based Spring Animation */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="mobile-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className={`fixed inset-0 z-50 backdrop-blur-[2px] md:hidden ${isDark ? 'bg-black/45' : 'bg-black/25'
                }`}
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />

            <motion.aside
              key="mobile-drawer-panel"
              dir="rtl"
              aria-label="القائمة الجانبية للهاتف"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{
                type: 'spring',
                damping: 32,
                stiffness: 320,
                mass: 0.85,
              }}
              className={`fixed inset-y-0 right-0 z-50 flex h-[100dvh] w-[86vw] max-w-[340px] flex-col border-l backdrop-blur-2xl md:hidden will-change-transform ${getDrawerBorderClass()} ${getDrawerBgClass()}`}
            >
              {/* 1. Header: Logo Zad, "زاد", Close button (X) on the left */}
              <div className={`flex items-center justify-between px-5 py-4 border-b ${getDrawerBorderClass()}`}>
                <div className="flex items-center gap-2.5">
                  {renderBrandLogo('h-9 w-9')}
                  <span className={`font-display text-2xl font-bold tracking-wide inline-block transition-colors ${getZadWordClass()}`}>زاد</span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="إغلاق القائمة"
                  className={`flex h-9.5 w-9.5 items-center justify-center rounded-full border shadow-sm active:scale-90 transition-all ${getDrawerCloseButtonClass()}`}
                >
                  <X size={19} strokeWidth={2.2} />
                </button>
              </div>

              {/* Scrollable Content */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.08 }}
                className={`flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4 text-right pb-8 slim-scrollbar ${getDrawerScrollbarThumbClass()}`}
              >
                {/* Auth Section - Display welcome & login ONLY when NOT authenticated */}
                {!isAuthenticated && (
                  <div className={`rounded-2xl border p-4 text-right shadow-sm ${isDark
                    ? getDrawerWelcomeCardClass()
                    : 'border-stone-200/80 bg-white/90 shadow-stone-200/50'
                    }`}>
                    <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>مرحباً بك</h4>
                    <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-white/70' : 'text-stone-500'}`}>
                      قم بالتسجيل للاستفادة من خدمات الموقع
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false)
                        setIsLoginLoading(true)
                        onTryChat()
                        setTimeout(() => setIsLoginLoading(false), 1500)
                      }}
                      disabled={isLoginLoading}
                      className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#53177d] hover:bg-[#431265] text-white py-2.5 px-4 text-xs font-bold shadow-sm shadow-[#53177d]/20 active:scale-[0.98] transition-all"
                    >
                      {isLoginLoading ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />}
                      <span>تسجيل الدخول / إنشاء حساب</span>
                    </button>
                  </div>
                )}

                {/* 3. Main Navigation Items */}
                <div className="space-y-1.5">
                  <div className={`pr-0.5 pl-2 text-[11px] font-semibold tracking-wider transition-colors ${getDrawerSectionHeadingClass()}`}>
                    التنقل الأساسي
                  </div>

                  {/* الرئيسية */}
                  <a
                    href="#home"
                    onClick={(e) => {
                      setOpen(false)
                      if (onNavigateHome) {
                        e.preventDefault()
                        onNavigateHome()
                      }
                    }}
                    className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm active:scale-[0.99] transition-all cursor-pointer ${activeTab === 'home' ? `font-bold ${getActiveNavClass()}` : `font-semibold ${getNavItemCardClass()}`}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${activeTab === 'home' ? 'brand-gradient text-white shadow-sm' : `border ${getNavIconBoxClass()}`}`}>
                        <Home size={16} />
                      </div>
                      <span>الرئيسية</span>
                    </div>
                    {activeTab === 'home' ? (
                      <span className={`h-2 w-2 rounded-full ${getActiveDotClass()}`} />
                    ) : (
                      <ChevronLeft size={16} className={isDark ? 'text-white/55' : 'text-stone-400'} />
                    )}
                  </a>

                  {/* المكتبة */}
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      onOpenKnowledge()
                    }}
                    className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm active:scale-[0.99] transition-all cursor-pointer ${activeTab === 'knowledge' ? `font-bold ${getActiveNavClass()}` : `font-semibold ${getNavItemCardClass()}`}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${activeTab === 'knowledge' ? 'brand-gradient text-white shadow-sm' : `border ${getNavIconBoxClass()}`}`}>
                        <BookOpen size={16} />
                      </div>
                      <span>المكتبة</span>
                    </div>
                    {activeTab === 'knowledge' ? (
                      <span className={`h-2 w-2 rounded-full ${getActiveDotClass()}`} />
                    ) : (
                      <ChevronLeft size={16} className={isDark ? 'text-white/55' : 'text-stone-400'} />
                    )}
                  </button>

                  {/* الشروحات والدورات (Video Icon) */}
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      onOpenLessons()
                    }}
                    className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm active:scale-[0.99] transition-all cursor-pointer ${activeTab === 'lessons' ? `font-bold ${getActiveNavClass()}` : `font-semibold ${getNavItemCardClass()}`}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${activeTab === 'lessons' ? 'brand-gradient text-white shadow-sm' : `border ${getNavIconBoxClass()}`}`}>
                        <Video size={16} />
                      </div>
                      <span>الشروحات والدورات</span>
                    </div>
                    {activeTab === 'lessons' ? (
                      <span className={`h-2 w-2 rounded-full ${getActiveDotClass()}`} />
                    ) : (
                      <ChevronLeft size={16} className={isDark ? 'text-white/55' : 'text-stone-400'} />
                    )}
                  </button>
                </div>

                {/* 4. AI & Interactive Section */}
                <div className={`space-y-1.5 pt-3 border-t ${isDark ? 'border-white/10' : 'border-stone-200/70'}`}>
                  <div className={`pr-0.5 pl-2 text-[11px] font-semibold tracking-wider transition-colors ${getDrawerSectionHeadingClass()}`}>
                    أدوات زاد التفاعلية
                  </div>

                  {/* وضع الدراسة (BookOpenCheck Icon) */}
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      onOpenStudy()
                    }}
                    className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm font-semibold active:scale-[0.99] transition-all ${getNavItemCardClass()}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${getNavIconBoxClass()}`}>
                        <BookOpenCheck size={16} />
                      </div>
                      <span>وضع الدراسة</span>
                    </div>
                    <ChevronLeft size={16} className={isDark ? 'text-white/55' : 'text-stone-400'} />
                  </button>

                  {/* المحادثة النصية */}
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      onTryChat()
                    }}
                    className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm font-semibold active:scale-[0.99] transition-all ${getNavItemCardClass()}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${getNavIconBoxClass()}`}>
                        <MessageSquare size={16} />
                      </div>
                      <span>المحادثة النصية</span>
                    </div>
                    <ChevronLeft size={16} className={isDark ? 'text-white/55' : 'text-stone-400'} />
                  </button>

                  {/* المحادثة الصوتية (تحت الإنشاء) */}
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      if (onOpenVoiceChat) onOpenVoiceChat()
                    }}
                    className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm font-semibold active:scale-[0.99] transition-all ${getNavItemCardClass()}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${getNavIconBoxClass()}`}>
                        <Mic size={16} />
                      </div>
                      <span>المحادثة الصوتية</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getThemeBadgeClass()}`}>
                      قريباً...
                    </span>
                  </button>
                </div>

                {/* Admin Management Tools (If admin) */}
                {isAuthenticated && isAdmin && (
                  <div className={`rounded-xl border transition-all overflow-hidden ${getNavItemCardClass()}`}>
                    <button
                      type="button"
                      onClick={() => setIsMobileAdminMenuExpanded(!isMobileAdminMenuExpanded)}
                      className="flex w-full items-center justify-between px-3.5 py-2.5 text-right transition-colors cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${getNavIconBoxClass()}`}>
                          <ShieldCheck size={16} />
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <span className="block text-sm font-bold">لوحات إدارة النظام</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getThemeBadgeClass()}`}>
                              أدمن
                            </span>
                          </div>
                          <span className={`text-[11px] font-normal ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                            صفحات وأدوات التحكم الإداري
                          </span>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: isMobileAdminMenuExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown size={16} className={isDark ? 'text-white/50' : 'text-stone-400'} />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {isMobileAdminMenuExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`border-t px-2 py-2 space-y-1 ${
                            isDark ? 'border-white/10 bg-black/25' : 'border-stone-200/80 bg-stone-50/80'
                          }`}
                        >
                          {onOpenAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpen(false)
                                onOpenAdmin()
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-right text-xs font-semibold transition-colors ${isDark ? 'text-brand-blue hover:bg-white/10' : 'text-blue-700 hover:bg-blue-50'}`}
                            >
                              <div className="flex items-center gap-2">
                                <LayoutDashboard size={13} />
                                <span>إدارة وضع الدراسة</span>
                              </div>
                              <ChevronLeft size={12} className={isDark ? 'text-blue-400/50' : 'text-blue-700/50'} />
                            </button>
                          )}

                          {onOpenTurathRag && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpen(false)
                                onOpenTurathRag()
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-right text-xs font-semibold transition-colors ${isDark ? 'text-sky-400 hover:bg-white/10' : 'text-sky-700 hover:bg-sky-50'}`}
                            >
                              <div className="flex items-center gap-2">
                                <Zap size={13} />
                                <span>استخراج وتخزين الكتب</span>
                              </div>
                              <ChevronLeft size={12} className={isDark ? 'text-sky-400/50' : 'text-sky-700/50'} />
                            </button>
                          )}

                          {onOpenEngineControl && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpen(false)
                                onOpenEngineControl()
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-right text-xs font-semibold transition-colors ${isDark ? 'text-purple-400 hover:bg-white/10' : 'text-purple-700 hover:bg-purple-50'}`}
                            >
                              <div className="flex items-center gap-2">
                                <Cpu size={13} />
                                <span>التحكم في محركات RAG</span>
                              </div>
                              <ChevronLeft size={12} className={isDark ? 'text-purple-400/50' : 'text-purple-700/50'} />
                            </button>
                          )}

                          {onOpenDataIngestion && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpen(false)
                                onOpenDataIngestion()
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-right text-xs font-semibold transition-colors ${isDark ? 'text-emerald-400 hover:bg-white/10' : 'text-emerald-700 hover:bg-emerald-50'}`}
                            >
                              <div className="flex items-center gap-2">
                                <Database size={13} />
                                <span>إدارة البيانات</span>
                              </div>
                              <ChevronLeft size={12} className={isDark ? 'text-emerald-400/50' : 'text-emerald-700/50'} />
                            </button>
                          )}

                          {onOpenV2PipelineAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpen(false)
                                onOpenV2PipelineAdmin()
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-right text-xs font-semibold transition-colors ${isDark ? 'text-blue-400 hover:bg-white/10' : 'text-blue-700 hover:bg-blue-50'}`}
                            >
                              <div className="flex items-center gap-2">
                                <Sparkles size={13} />
                                <span>إدخال بيانات AI</span>
                              </div>
                              <ChevronLeft size={12} className={isDark ? 'text-blue-400/50' : 'text-blue-700/50'} />
                            </button>
                          )}

                          {onOpenAdminLibrary && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpen(false)
                                onOpenAdminLibrary()
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-right text-xs font-semibold transition-colors ${isDark ? 'text-amber-400 hover:bg-white/10' : 'text-amber-700 hover:bg-amber-50'}`}
                            >
                              <div className="flex items-center gap-2">
                                <BookOpen size={13} />
                                <span>إدارة مكتبة القراءة</span>
                              </div>
                              <ChevronLeft size={12} className={isDark ? 'text-amber-400/50' : 'text-amber-700/50'} />
                            </button>
                          )}

                          {onOpenYoutubeImporter && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpen(false)
                                onOpenYoutubeImporter()
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-right text-xs font-semibold transition-colors ${isDark ? 'text-red-400 hover:bg-white/10' : 'text-red-700 hover:bg-red-50'}`}
                            >
                              <div className="flex items-center gap-2">
                                <Video size={13} />
                                <span>استيراد شروحات يوتيوب</span>
                              </div>
                              <ChevronLeft size={12} className={isDark ? 'text-red-400/50' : 'text-red-700/50'} />
                            </button>
                          )}

                          {onOpenSystemObservability && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpen(false)
                                onOpenSystemObservability()
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-right text-xs font-semibold transition-colors ${isDark ? 'text-amber-300 hover:bg-white/10' : 'text-amber-700 hover:bg-amber-50'}`}
                            >
                              <div className="flex items-center gap-2">
                                <Activity size={13} />
                                <span>مراقبة النظام والـ AI</span>
                              </div>
                              <ChevronLeft size={12} className={isDark ? 'text-amber-300/50' : 'text-amber-700/50'} />
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* 5. Customization & Appearance Section (المظهر والتخصيص) */}
                <div className={`space-y-2 pt-3 border-t ${isDark ? 'border-white/10' : 'border-stone-200/70'}`}>
                  <div className={`pr-0.5 pl-2 text-[11px] font-semibold tracking-wider transition-colors ${getDrawerSectionHeadingClass()}`}>
                    المظهر والتخصيص
                  </div>

                  {/* الإشعارات والتحديثات */}
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      setTimeout(() => {
                        window.dispatchEvent(new Event('open_zad_notifications'))
                      }, 120)
                    }}
                    className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm font-semibold active:scale-[0.99] transition-all ${getNavItemCardClass()}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${getNavIconBoxClass()}`}>
                        <Bell size={16} />
                      </div>
                      <span>الإشعارات والتحديثات</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getThemeBadgeClass()}`}>
                        جديد
                      </span>
                      <ChevronLeft size={16} className={isDark ? 'text-white/55' : 'text-stone-400'} />
                    </div>
                  </button>

                  {/* مظهر التطبيق (Toggle Switch) */}
                  <div
                    onClick={toggleTheme}
                    role="button"
                    tabIndex={0}
                    className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm font-semibold cursor-pointer active:scale-[0.99] transition-all select-none ${getNavItemCardClass()}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${getNavIconBoxClass()}`}>
                        {isDark ? <Moon size={16} /> : <Sun size={16} />}
                      </div>
                      <div className="text-right">
                        <span className="block text-sm font-bold">الإضاءة</span>
                        <span className={`text-[11px] font-normal ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                          {isDark ? 'الوضع الليلي مفعّل' : 'الوضع النهاري مفعّل'}
                        </span>
                      </div>
                    </div>

                    {/* Modern Animated Switch Component */}
                    <div
                      className={`relative flex h-7 w-14 items-center rounded-full p-1 transition-colors duration-300 ${getThemeToggleTrackClass()}`}
                    >
                      {/* Track background icons */}
                      <div className="absolute inset-x-2 flex justify-between items-center text-[10px] pointer-events-none">
                        <Moon size={12} className={isDark ? 'text-white/80' : 'text-black/25'} />
                        <Sun size={12} className={!isDark ? 'text-amber-950/80' : 'text-white/25'} />
                      </div>

                      {/* Sliding Knob */}
                      <motion.div
                        layout
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className={`z-10 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-md ${isDark ? 'mr-0 ml-auto text-stone-800' : 'ml-0 mr-auto text-amber-600'
                          }`}
                      >
                        {isDark ? <Moon size={11} strokeWidth={2.5} /> : <Sun size={11} strokeWidth={2.5} />}
                      </motion.div>
                    </div>
                  </div>

                  {/* لون السمة (توزيع متوازن وأنيق) */}
                  <div className={`rounded-xl border p-3 ${getNavItemCardClass()}`}>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <Palette size={15} className={accentColor === 'emerald' ? 'text-teal-400' : accentColor === 'amber' ? 'text-[#dfbf83]' : accentColor === 'blue' ? 'text-blue-400' : 'text-purple-400'} />
                        <span>لون السمة</span>
                      </div>
                      <span className={`text-[10px] font-bold ${accentColor === 'emerald' ? 'text-teal-400' : accentColor === 'amber' ? 'text-[#dfbf83]' : accentColor === 'blue' ? 'text-blue-400' : 'text-purple-400'}`}>
                        {accentColor === 'purple' && 'أرجواني ملكي'}
                        {accentColor === 'emerald' && 'فيروزي إسلامي'}
                        {accentColor === 'amber' && 'عاجي إسلامي'}
                        {accentColor === 'blue' && 'أزرق ياقوتي'}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: 'purple', name: 'أرجواني', gradient: 'from-purple-700 to-fuchsia-500', ring: 'ring-purple-400' },
                        { id: 'emerald', name: 'فيروزي', gradient: 'from-teal-700 via-teal-500 to-cyan-400', ring: 'ring-teal-400' },
                        { id: 'amber', name: 'عاجي', gradient: 'from-[#8e682d] via-[#c59b58] to-[#eedbb2]', ring: 'ring-[#dfbf83]' },
                        { id: 'blue', name: 'ياقوتي', gradient: 'from-blue-700 to-indigo-500', ring: 'ring-blue-400' },
                      ].map((item) => {
                        const isSelected = accentColor === item.id
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setAccentColor(item.id as any)}
                            className="group flex flex-col items-center gap-1.5 py-1 px-1 transition-all active:scale-95"
                          >
                            <span
                              className={`h-7 w-7 rounded-full bg-gradient-to-tr ${item.gradient} transition-all duration-300 ${isSelected
                                ? `ring-2 ${item.ring} ring-offset-2 ${isDark ? 'ring-offset-[#120324]' : 'ring-offset-white'} scale-115 shadow-lg`
                                : 'scale-90 opacity-70 group-hover:opacity-100 group-hover:scale-95'
                                }`}
                            />
                            <span
                              className={`text-[10px] leading-tight transition-colors ${isSelected ? (isDark ? 'font-bold text-white' : 'font-bold text-stone-900') : isDark ? 'font-medium text-white/60' : 'font-medium text-stone-600'
                                }`}
                            >
                              {item.name}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* 6. Mobile App & Share Section (التطبيق والمشاركة) */}
                <div className={`space-y-2 pt-3 border-t ${isDark ? 'border-white/10' : 'border-stone-200/70'}`}>
                  <div className={`pr-0.5 pl-2 text-[11px] font-semibold tracking-wider transition-colors ${getDrawerSectionHeadingClass()}`}>
                    التطبيق والمشاركة
                  </div>

                  {/* رابط تحميل التطبيق للأندرويد */}
                  <a
                    href="https://apkpure.com/p/com.example.zaad"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                    className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm font-semibold active:scale-[0.99] transition-all ${getNavItemCardClass()}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${getNavIconBoxClass()}`}>
                        <Smartphone size={16} />
                      </div>
                      <div className="text-right">
                        <span className="block text-sm font-bold">تطبيق زاد للأندرويد</span>
                        <span className={`text-[11px] font-normal ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                          تحميل مباشر عبر APKPure
                        </span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getThemeBadgeClass()}`}>
                      تثبيت
                    </span>
                  </a>

                  {/* زر مشاركة زاد */}
                  <button
                    type="button"
                    onClick={() => setShowShareModal(true)}
                    className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm font-semibold active:scale-[0.99] transition-all ${getNavItemCardClass()}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${getNavIconBoxClass()}`}>
                        <Share2 size={16} />
                      </div>
                      <div className="text-right">
                        <span className="block text-sm font-bold">مشاركة زاد</span>
                        <span className={`text-[11px] font-normal ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                          شارك الموقع أو رابط التطبيق
                        </span>
                      </div>
                    </div>
                    <ChevronLeft size={16} className={isDark ? 'text-white/55' : 'text-stone-400'} />
                  </button>
                </div>

                {/* 7. User Profile (مدمج في أسفل السايدبار بالكامل بدون فريم كارت منفصل، ويتحرك مع التمرير) */}
                {isAuthenticated && (
                  <div className={`-mx-4 -mb-4 mt-6 border-t transition-colors ${isDark ? 'border-white/10 bg-black/30' : 'border-stone-200/80 bg-stone-100/80'}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false)
                        setShowProfileModal(true)
                      }}
                      className={`flex w-full items-center justify-between px-5 py-4 text-right transition-all duration-200 active:scale-[0.99] ${isDark ? 'hover:bg-white/5' : 'hover:bg-stone-200/60'}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full brand-gradient text-white shadow-md overflow-hidden ring-2 ring-white/15">
                          {user?.avatarUrl ? (
                            <img src={getAvatarUrl(user.avatarUrl)} alt={user?.name || 'مستخدم'} className="h-full w-full object-cover" />
                          ) : (
                            <User size={22} strokeWidth={2.2} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 text-right">
                          <div className="flex items-center gap-2">
                            <span className={`truncate text-sm font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                              {user?.name || (isAdmin ? 'مسؤول النظام' : 'مستخدم زاد')}
                            </span>
                            {isAdmin && (
                              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold border ${getThemeBadgeClass()}`}>
                                أدمن
                              </span>
                            )}
                          </div>
                          <p className={`truncate text-xs font-mono mt-0.5 ${isDark ? 'text-white/50' : 'text-stone-500'}`}>
                            {user?.email || 'طالب علم'}
                          </p>
                        </div>
                      </div>
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${isDark ? 'text-white/60 hover:text-white' : 'text-stone-500'}`}>
                        <ChevronLeft size={18} />
                      </div>
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Share Zad Modal (مشاركة منصة وتطبيق زاد) */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              dir="rtl"
              className={`relative z-10 w-full max-w-sm rounded-2xl border p-5 shadow-2xl backdrop-blur-xl ${isDark
                ? 'border-white/10 bg-[#090b10]/98 text-white shadow-[-16px_0_50px_rgba(0,0,0,0.85)]'
                : 'border-stone-200/90 bg-white/98 text-stone-900 shadow-stone-400/20'
                }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-inherit/20 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${getNavIconBoxClass()}`}>
                    <Share2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">مشاركة زاد</h3>
                    <p className={`text-[11px] ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                      اختر الرابط الذي تود مشاركته
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all active:scale-90 ${isDark
                    ? 'border-white/10 hover:bg-white/10 text-white/70'
                    : 'border-stone-200 hover:bg-stone-100 text-stone-600'
                    }`}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {/* 1. Website Share */}
                <div className={`p-4 rounded-2xl border transition-all ${isDark
                  ? 'border-white/[0.08] bg-white/[0.03] hover:border-white/15'
                  : 'border-stone-200 bg-white/80 hover:border-stone-300 shadow-sm'
                  }`}>
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-sm ${getNavIconBoxClass()}`}>
                      <Globe size={18} strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-sm font-bold">منصة زاد للويب</span>
                      <p className={`text-[11px] truncate ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                        التصفح والدراسة عبر المتصفح
                      </p>
                    </div>
                  </div>

                  <div className={`text-[11px] font-mono dir-ltr text-left select-all px-3 py-1.5 rounded-lg mb-3 truncate border ${isDark ? 'bg-black/40 text-white/80 border-white/5' : 'bg-stone-100 text-stone-700 border-stone-200'
                    }`}>
                    https://zad-islamic-ai.vercel.app/
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleShare('web')}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl brand-gradient text-white text-xs font-bold active:scale-[0.98] hover:opacity-90 transition-all shadow-sm"
                    >
                      <Share2 size={15} />
                      <span>مشاركة</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await copyToClipboard('https://zad-islamic-ai.vercel.app/')
                        setCopiedType('web')
                        setTimeout(() => setCopiedType(null), 2500)
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl border text-xs font-bold active:scale-[0.98] transition-all ${copiedType === 'web'
                        ? getThemeBadgeClass()
                        : isDark
                          ? 'border-white/15 bg-white/5 hover:bg-white/10 text-white'
                          : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                        }`}
                    >
                      {copiedType === 'web' ? (
                        <>
                          <Check size={14} className={accentColor === 'emerald' ? 'text-teal-400' : accentColor === 'amber' ? 'text-[#dfbf83]' : accentColor === 'blue' ? 'text-blue-400' : 'text-purple-400'} />
                          <span>تم النسخ!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>نسخ الرابط</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 2. Mobile App Share */}
                <div className={`p-4 rounded-2xl border transition-all ${isDark
                  ? 'border-white/[0.08] bg-white/[0.03] hover:border-white/15'
                  : 'border-stone-200 bg-white/80 hover:border-stone-300 shadow-sm'
                  }`}>
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-sm ${getNavIconBoxClass()}`}>
                      <Smartphone size={18} strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-sm font-bold">تطبيق زاد للأندرويد</span>
                      <p className={`text-[11px] truncate ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                        تحميل وتثبيت مباشر عبر APKPure
                      </p>
                    </div>
                  </div>

                  <div className={`text-[11px] font-mono dir-ltr text-left select-all px-3 py-1.5 rounded-lg mb-3 truncate border ${isDark ? 'bg-black/40 text-white/80 border-white/5' : 'bg-stone-100 text-stone-700 border-stone-200'
                    }`}>
                    https://apkpure.com/p/com.example.zaad
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleShare('app')}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl brand-gradient text-white text-xs font-bold active:scale-[0.98] hover:opacity-90 transition-all shadow-sm"
                    >
                      <Share2 size={15} />
                      <span>مشاركة</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await copyToClipboard('https://apkpure.com/p/com.example.zaad')
                        setCopiedType('app')
                        setTimeout(() => setCopiedType(null), 2500)
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl border text-xs font-bold active:scale-[0.98] transition-all ${copiedType === 'app'
                        ? getThemeBadgeClass()
                        : isDark
                          ? 'border-white/15 bg-white/5 hover:bg-white/10 text-white'
                          : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                        }`}
                    >
                      {copiedType === 'app' ? (
                        <>
                          <Check size={14} className={accentColor === 'emerald' ? 'text-teal-400' : accentColor === 'amber' ? 'text-[#dfbf83]' : accentColor === 'blue' ? 'text-blue-400' : 'text-purple-400'} />
                          <span>تم النسخ!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>نسخ الرابط</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Toast */}
              {copiedType && (
                <div className={`mt-3 py-1.5 px-3 rounded-lg border text-xs text-center font-bold ${getThemeBadgeClass()}`}>
                  تم نسخ الرابط بنجاح إلى الحافظة! 📋
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </header>
  )
}
