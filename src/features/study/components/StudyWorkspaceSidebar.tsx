import React, { useState, useRef, useEffect } from 'react'
import {
  Folder,
  FolderOpen,
  BookOpen,
  MessageCircle,
  MessageSquarePlus,
  Brain,
  ClipboardList,
  Plus,
  ArrowRight,
  History,
  Maximize,
  Minimize,
  Sun,
  Moon,
  Palette,
  PanelRightClose,
  PanelRightOpen,
  ChevronLeft,
  User,
  Check
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme, type AccentColor } from '../../../contexts/ThemeContext'
import { useAuth } from '../../../contexts/AuthContext'
import { StudyTimerWidget } from './StudyTimerWidget'
import { getAvatarUrl } from '../../../api/client'
import { studyApi, type StudySessionDto } from '../../../api/studyApi'
import whiteLogo from '@/assets/images/WhiteLogo.webp'

export interface StudyWorkspaceSidebarProps {
  isExpanded: boolean
  onToggleExpanded: () => void
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  isDocumentOpen: boolean
  onToggleDocument: () => void
  isChatOpen: boolean
  onToggleChat: () => void
  isMindmapOpen: boolean
  onToggleMindmap: () => void
  isQuizOpen: boolean
  onToggleQuiz: () => void
  onNewSession: () => void
  onReturnToHero: () => void
  onOpenHistory: () => void
  onOpenProfile: () => void
  onSelectSavedSession?: (session: StudySessionDto) => void
  isFullscreen: boolean
  onToggleFullscreen: () => void
  currentBookTitle?: string
  currentChunkTitle?: string
}

const ACCENT_OPTIONS: { id: AccentColor; name: string; gradient: string; ring: string }[] = [
  { id: 'purple', name: 'أرجواني', gradient: 'from-purple-700 to-fuchsia-500', ring: 'ring-purple-400' },
  { id: 'emerald', name: 'فيروزي', gradient: 'from-teal-700 via-teal-500 to-cyan-400', ring: 'ring-teal-400' },
  { id: 'amber', name: 'عاجي', gradient: 'from-[#8e682d] via-[#c59b58] to-[#eedbb2]', ring: 'ring-[#dfbf83]' },
  { id: 'blue', name: 'ياقوتي', gradient: 'from-blue-700 to-indigo-500', ring: 'ring-blue-400' },
]

export function StudyWorkspaceSidebar({
  isExpanded,
  onToggleExpanded,
  isSidebarOpen,
  onToggleSidebar,
  isDocumentOpen,
  onToggleDocument,
  isChatOpen,
  onToggleChat,
  isMindmapOpen,
  onToggleMindmap,
  isQuizOpen,
  onToggleQuiz,
  onNewSession,
  onReturnToHero,
  onOpenHistory,
  onOpenProfile,
  onSelectSavedSession,
  isFullscreen,
  onToggleFullscreen,
  currentBookTitle,
  currentChunkTitle
}: StudyWorkspaceSidebarProps) {
  const { toggleTheme, isDark, accentColor, setAccentColor } = useTheme()
  const { user } = useAuth()
  const [showCollapsedThemePopover, setShowCollapsedThemePopover] = useState(false)
  const collapsedPopoverRef = useRef<HTMLDivElement>(null)
  const [recentSessions, setRecentSessions] = useState<StudySessionDto[]>([])

  useEffect(() => {
    let isMounted = true
    studyApi.getSessions()
      .then((sessions) => {
        if (isMounted && Array.isArray(sessions)) {
          setRecentSessions(sessions.slice(0, 3))
        }
      })
      .catch(() => {})
    return () => {
      isMounted = false
    }
  }, [currentChunkTitle])

  // Close collapsed popover on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (collapsedPopoverRef.current && !collapsedPopoverRef.current.contains(e.target as Node)) {
        setShowCollapsedThemePopover(false)
      }
    }
    if (showCollapsedThemePopover) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showCollapsedThemePopover])

  // Base sidebar container style: Pure WHITE in light mode, theme-dark in dark mode
  const getSidebarContainerClass = () => {
    if (isDark) {
      switch (accentColor) {
        case 'emerald':
          return 'bg-[#041413] border-teal-500/20 text-white'
        case 'amber':
          return 'bg-[#120d06] border-[#dfbf83]/20 text-[#fcf9f2]'
        case 'blue':
          return 'bg-[#050d1a] border-blue-500/20 text-white'
        case 'purple':
        default:
          return 'bg-[#0d021a] border-purple-500/20 text-white'
      }
    }
    // Light mode: Base background is crisp White
    return 'bg-white border-slate-200 text-slate-800'
  }

  // Active navigation tab styling with reduced border-radius (rounded-lg)
  const getActiveTabClass = (isActive: boolean) => {
    if (!isActive) {
      return isDark
        ? 'text-white/70 hover:text-white hover:bg-white/5 border-transparent font-normal'
        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 border-transparent font-normal'
    }

    if (isDark) {
      switch (accentColor) {
        case 'emerald':
          return 'bg-teal-500/15 text-teal-300 border-teal-500/35 font-semibold'
        case 'amber':
          return 'bg-[#dfbf83]/15 text-[#eed8ad] border-[#dfbf83]/35 font-semibold'
        case 'blue':
          return 'bg-blue-500/15 text-blue-300 border-blue-500/35 font-semibold'
        case 'purple':
        default:
          return 'bg-purple-500/15 text-purple-300 border-purple-500/35 font-semibold'
      }
    }

    switch (accentColor) {
      case 'emerald':
        return 'bg-teal-50/90 text-teal-900 border-teal-300 font-semibold shadow-xs'
      case 'amber':
        return 'bg-[#fcf7ee] text-[#6b4c1e] border-[#eedbb2] font-semibold shadow-xs'
      case 'blue':
        return 'bg-blue-50/90 text-blue-900 border-blue-300 font-semibold shadow-xs'
      case 'purple':
      default:
        return 'bg-purple-50/90 text-purple-900 border-purple-300 font-semibold shadow-xs'
    }
  }

  // Active icon tint matching theme
  const getActiveIconColor = (isActive: boolean) => {
    if (!isActive) {
      return isDark ? 'text-white/50' : 'text-slate-500'
    }
    if (isDark) {
      switch (accentColor) {
        case 'emerald': return 'text-teal-400'
        case 'amber': return 'text-[#eed8ad]'
        case 'blue': return 'text-blue-400'
        case 'purple':
        default: return 'text-purple-400'
      }
    }
    switch (accentColor) {
      case 'emerald': return 'text-teal-700'
      case 'amber': return 'text-[#8e682d]'
      case 'blue': return 'text-blue-700'
      case 'purple':
      default: return 'text-purple-700'
    }
  }

  // Neutral action button styling ("جلسة مدارسة جديدة") - calm without loud colors
  const getPrimaryBtnClass = () => {
    if (isDark) {
      return 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 hover:text-white border border-white/10 hover:border-white/20 shadow-2xs'
    }
    return 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 shadow-2xs'
  }

  // Dynamic accent styling for navigation icon boxes
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

  // Animated switch track styling matching Homepage Settings
  const getThemeToggleTrackClass = () => {
    if (!isDark) return 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.35)]'
    switch (accentColor) {
      case 'emerald': return 'bg-gradient-to-r from-teal-700 to-cyan-600 shadow-[0_0_12px_rgba(20,184,166,0.35)]'
      case 'amber': return 'bg-gradient-to-r from-[#8e682d] to-[#c59b58] shadow-[0_0_12px_rgba(223,191,131,0.35)]'
      case 'blue': return 'bg-gradient-to-r from-blue-700 to-indigo-600 shadow-[0_0_12px_rgba(59,130,246,0.35)]'
      default: return 'bg-gradient-to-r from-purple-700 to-indigo-600 shadow-[0_0_12px_rgba(168,85,247,0.35)]'
    }
  }

  // Render Zad Logo strictly in the active theme color using CSS mask
  const renderThemeLogo = (sizeClass = 'h-9 w-9') => {
    let gradient = 'bg-gradient-to-b from-[#9333ea] via-[#7e22ce] to-[#581c87]'
    if (isDark) {
      switch (accentColor) {
        case 'emerald': gradient = 'bg-gradient-to-b from-[#5eead4] via-[#14b8a6] to-[#0f766e]'; break
        case 'amber': gradient = 'bg-gradient-to-b from-[#f5ecd5] via-[#dfbf83] to-[#8e682d]'; break
        case 'blue': gradient = 'bg-gradient-to-b from-[#38bdf8] via-[#2563eb] to-[#1e40af]'; break
        case 'purple':
        default: gradient = 'bg-gradient-to-b from-[#d8b4fe] via-[#a855f7] to-[#7e22ce]'; break
      }
    } else {
      switch (accentColor) {
        case 'emerald': gradient = 'bg-gradient-to-b from-[#14b8a6] via-[#0d9488] to-[#134e4a]'; break
        case 'amber': gradient = 'bg-gradient-to-b from-[#dfbf83] via-[#b88d46] to-[#5e431a]'; break
        case 'blue': gradient = 'bg-gradient-to-b from-[#0284c7] via-[#1d4ed8] to-[#1e3a8a]'; break
        case 'purple':
        default: gradient = 'bg-gradient-to-b from-[#9333ea] via-[#7e22ce] to-[#581c87]'; break
      }
    }

    return (
      <div
        aria-hidden="true"
        className={`${sizeClass} shrink-0 transition-all duration-300 ${gradient}`}
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

  // Accent name display in Arabic
  const getAccentName = () => {
    switch (accentColor) {
      case 'purple': return 'أرجواني ملكي'
      case 'emerald': return 'فيروزي إسلامي'
      case 'amber': return 'عاجي إسلامي'
      case 'blue': return 'أزرق ياقوتي'
      default: return 'أرجواني ملكي'
    }
  }

  // Deep dark shade of the active accent color for the header title
  const getHeaderTitleColorClass = () => {
    if (isDark) {
      switch (accentColor) {
        case 'emerald': return 'text-teal-300'
        case 'amber': return 'text-[#dfbf83]'
        case 'blue': return 'text-blue-300'
        case 'purple': default: return 'text-purple-300'
      }
    } else {
      switch (accentColor) {
        case 'emerald': return 'text-teal-900'
        case 'amber': return 'text-[#6c4e1f]'
        case 'blue': return 'text-blue-950'
        case 'purple': default: return 'text-purple-950'
      }
    }
  }

  // User profile details matching Homepage Settings (Image 2)
  const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.email?.toLowerCase().includes('admin')
  const displayName = user?.name || (isAdmin ? 'مسؤول النظام' : 'مستخدم زاد')
  const displayEmail = user?.email || (isAdmin ? 'abouridaAdminZad@zad.ai' : 'طالب علم')
  const userName = displayName
  const userInitial = (displayName || 'م').trim().charAt(0).toUpperCase()

  const getNavItemCardClass = () => (
    isDark
      ? 'border-white/[0.07] bg-white/[0.03] text-white/90 hover:bg-white/[0.08] hover:border-white/15'
      : 'border-stone-200/70 bg-white/80 text-stone-800 hover:bg-white hover:border-stone-300 shadow-2xs'
  )

  const getThemeBadgeClass = () => {
    switch (accentColor) {
      case 'emerald': return isDark ? 'bg-teal-500/15 text-teal-300 border-teal-500/30' : 'bg-teal-50 text-teal-800 border-teal-200'
      case 'amber': return isDark ? 'bg-[#dfbf83]/15 text-[#eed9b0] border-[#dfbf83]/30' : 'bg-[#fbf8f0] text-[#8a652a] border-[#ebd9b5]'
      case 'blue': return isDark ? 'bg-blue-500/15 text-blue-300 border-blue-500/30' : 'bg-blue-50 text-blue-800 border-blue-200'
      case 'purple':
      default: return isDark ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'bg-purple-50 text-purple-800 border-purple-200'
    }
  }

  return (
    <aside
      dir="rtl"
      aria-label="شريط أدوات بيئة المدارسة"
      className={`relative z-30 flex flex-col h-full shrink-0 border-l transition-all duration-300 ease-out select-none ${
        isExpanded ? 'w-[265px] sm:w-[270px]' : 'w-[64px]'
      } ${getSidebarContainerClass()}`}
    >
      {/* ========================================================================= */}
      {/* 1. HEADER: BRAND LOGO + "وضع المدارسة" + ENLARGED EXPAND/COLLAPSE ICON    */}
      {/* Height h-[53px], NO dividing bottom border per user instruction           */}
      {/* ========================================================================= */}
      <div
        className={`min-h-[60px] pt-3 pb-1.5 box-border px-3.5 shrink-0 flex items-center transition-colors ${
          isExpanded ? 'justify-between' : 'justify-center'
        }`}
      >
        {isExpanded ? (
          <>
            <div className="flex items-center gap-2.5 min-w-0">
              {renderThemeLogo('h-9 w-9')}
              <span className={`font-sans text-[16px] font-bold tracking-tight truncate translate-y-1 ${getHeaderTitleColorClass()}`}>
                المدارسة الذكية
              </span>
            </div>

            {/* Enlarged, prominent collapse button */}
            <button
              type="button"
              onClick={onToggleExpanded}
              aria-label="طي الشريط الجانبي"
              title="طي الشريط الجانبي"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100/90 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/10 transition-all cursor-pointer active:scale-95"
            >
              <PanelRightClose size={21} strokeWidth={2} />
            </button>
          </>
        ) : (
          /* Enlarged, prominent expand button */
          <button
            type="button"
            onClick={onToggleExpanded}
            aria-label="توسيع الشريط الجانبي"
            title="توسيع الشريط الجانبي"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100/90 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/10 transition-all cursor-pointer active:scale-95"
          >
            <PanelRightOpen size={21} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. SCROLLABLE CONTENT: ALL ITEMS SCROLL UNDER FIXED HEADER                */}
      {/* ========================================================================= */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-2.5 py-1.5 space-y-2 text-right [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* PRIMARY ACTIONS: NEW STUDY SESSION + RETURN TO HOME */}
        <div className="pt-0.5 space-y-1.5">
          {/* 1. جلسة مدارسة جديدة */}
          <button
            type="button"
            onClick={onNewSession}
            title={isExpanded ? 'بدء جلسة مدارسة جديدة' : 'جلسة مدارسة جديدة'}
            className={`w-full flex items-center justify-center rounded-lg transition-all duration-150 cursor-pointer active:scale-95 ${
              isExpanded ? 'gap-2.5 px-3.5 py-2.5 text-sm font-medium font-sans' : 'h-11 w-11 mx-auto'
            } ${getPrimaryBtnClass()}`}
          >
            <MessageSquarePlus size={isExpanded ? 19 : 20} className="shrink-0 text-slate-500 dark:text-white/60" />
            {isExpanded && <span className="truncate">جلسة مدارسة جديدة</span>}
          </button>

          {/* 2. العودة إلى الصفحة الرئيسية (Placed directly below New Session per user request) */}
          <button
            type="button"
            onClick={onReturnToHero}
            title={isExpanded ? 'العودة إلى واجهة الصفحة الرئيسية' : 'العودة للرئيسية'}
            className={`w-full flex items-center justify-center rounded-lg transition-all duration-150 cursor-pointer active:scale-95 ${
              isExpanded ? 'gap-2.5 px-3.5 py-2 text-xs sm:text-sm font-medium font-sans' : 'h-10 w-10 mx-auto'
            } ${
              isDark
                ? 'bg-white/[0.02] hover:bg-white/[0.06] text-white/70 hover:text-white border border-white/5'
                : 'bg-slate-50/60 hover:bg-slate-100/80 text-slate-600 hover:text-slate-900 border border-slate-200/60 shadow-2xs'
            }`}
          >
            <ArrowRight size={isExpanded ? 17 : 19} className="shrink-0 text-slate-500 dark:text-white/50" />
            {isExpanded && <span className="truncate">العودة إلى الصفحة الرئيسية</span>}
          </button>
        </div>

        {!isExpanded && (
          <div className="w-6 h-[1px] bg-slate-200/80 dark:bg-white/10 mx-auto my-1.5 shrink-0" />
        )}

        {/* WORKSPACE NAVIGATION ITEMS */}
        <div className="space-y-0.5">
          {isExpanded && (
            <div className="px-2 pb-0.5 text-xs font-bold font-sans tracking-wide text-slate-400 dark:text-white/40">
              أقسام بيئة العمل
            </div>
          )}

          {/* 1. الفهرس وتصفح الكتاب (Folder Icon) */}
          <button
            type="button"
            onClick={onToggleSidebar}
            title="فهرس المحتوى والكتب"
            className={`w-full flex items-center rounded-lg border transition-all duration-150 cursor-pointer ${
              isExpanded ? 'gap-3 px-3 py-1.5 text-sm font-sans' : 'justify-center h-9 w-9 mx-auto'
            } ${getActiveTabClass(isSidebarOpen)}`}
          >
            {isSidebarOpen ? (
              <FolderOpen size={20} className={`shrink-0 ${getActiveIconColor(isSidebarOpen)}`} />
            ) : (
              <Folder size={20} className={`shrink-0 ${getActiveIconColor(isSidebarOpen)}`} />
            )}
            {isExpanded && (
              <span className="truncate">فهرس المحتوى</span>
            )}
          </button>

          {/* 2. نص الدرس والمطالعة */}
          <button
            type="button"
            onClick={onToggleDocument}
            title="نص الدرس والشرح"
            className={`w-full flex items-center rounded-lg border transition-all duration-150 cursor-pointer ${
              isExpanded ? 'gap-3 px-3 py-1.5 text-sm font-sans' : 'justify-center h-9 w-9 mx-auto'
            } ${getActiveTabClass(isDocumentOpen)}`}
          >
            <BookOpen size={20} className={`shrink-0 ${getActiveIconColor(isDocumentOpen)}`} />
            {isExpanded && (
              <span className="truncate">نص الدرس</span>
            )}
          </button>

          {/* 3. مساعد الدراسة */}
          <button
            type="button"
            onClick={onToggleChat}
            title="مساعد الدراسة الذكي"
            className={`w-full flex items-center rounded-lg border transition-all duration-150 cursor-pointer ${
              isExpanded ? 'gap-3 px-3 py-1.5 text-sm font-sans' : 'justify-center h-9 w-9 mx-auto'
            } ${getActiveTabClass(isChatOpen)}`}
          >
            <MessageCircle size={20} className={`shrink-0 ${getActiveIconColor(isChatOpen)}`} />
            {isExpanded && (
              <span className="truncate">المساعد زاد</span>
            )}
          </button>

          {/* 4. الخريطة الذهنية */}
          <button
            type="button"
            onClick={onToggleMindmap}
            title="الخريطة الذهنية المعرفية"
            className={`w-full flex items-center rounded-lg border transition-all duration-150 cursor-pointer ${
              isExpanded ? 'gap-3 px-3 py-1.5 text-sm font-sans' : 'justify-center h-9 w-9 mx-auto'
            } ${getActiveTabClass(isMindmapOpen)}`}
          >
            <Brain size={20} className={`shrink-0 ${getActiveIconColor(isMindmapOpen)}`} />
            {isExpanded && (
              <span className="truncate">الخريطة الذهنية</span>
            )}
          </button>

          {/* 5. التقييم والاختبار */}
          <button
            type="button"
            onClick={onToggleQuiz}
            title="اختبر فهمك وتقييم الدرس"
            className={`w-full flex items-center rounded-lg border transition-all duration-150 cursor-pointer ${
              isExpanded ? 'gap-3 px-3 py-1.5 text-sm font-sans' : 'justify-center h-9 w-9 mx-auto'
            } ${getActiveTabClass(isQuizOpen)}`}
          >
            <ClipboardList size={20} className={`shrink-0 ${getActiveIconColor(isQuizOpen)}`} />
            {isExpanded && (
              <span className="truncate">اختبار وتقييم</span>
            )}
          </button>
        </div>

        {!isExpanded && (
          <div className="w-6 h-[1px] bg-slate-200/80 dark:bg-white/10 mx-auto my-1.5 shrink-0" />
        )}

        {/* RECENT STUDY SESSIONS & HISTORY SECTION (No divider lines) */}
        <div className={`${isExpanded ? 'pt-4' : 'pt-0.5'} space-y-0.5`}>
          {isExpanded && (
            <div className="px-2 pb-1 text-xs font-bold font-sans tracking-wide text-slate-400 dark:text-white/40">
              سجل جلسات المدارسة
            </div>
          )}

          {/* Current / Active Lesson item preview - only when an actual lesson is chosen */}
          {isExpanded && currentChunkTitle && currentChunkTitle !== 'اختر درساً من الفهرس...' && (
            <div className={`p-2.5 rounded-lg border flex items-start justify-between gap-2 mb-1 ${
              isDark
                ? 'bg-white/[0.03] border-white/10 text-white'
                : 'bg-slate-50/80 border-slate-200/80 text-slate-800'
            }`}>
              <div className="min-w-0 flex-1">
                <p className="font-bold font-sans truncate text-xs text-foreground">
                  {currentChunkTitle}
                </p>
                {currentBookTitle && (
                  <p className="text-[11px] font-sans text-muted-foreground truncate mt-0.5">
                    {currentBookTitle}
                  </p>
                )}
              </div>
              <span className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 mt-1 animate-pulse ${
                accentColor === 'emerald' ? 'bg-teal-500' :
                accentColor === 'amber' ? 'bg-[#b88d46]' :
                accentColor === 'blue' ? 'bg-blue-500' : 'bg-purple-500'
              }`} title="الجلسة الحالية النشطة" />
            </div>
          )}

          {/* Up to 3 recent session records */}
          {isExpanded && recentSessions.slice(0, 3).map((sess) => (
            <button
              key={sess.id}
              type="button"
              onClick={() => onSelectSavedSession?.(sess)}
              title={`${sess.sectionTitle || sess.bookTitle || 'جلسة سابقة'}${sess.domain ? ` (${sess.domain})` : ''}`}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-transparent hover:bg-slate-100/70 dark:hover:bg-white/5 text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white transition-all duration-150 cursor-pointer text-right group text-xs sm:text-sm font-sans"
            >
              <BookOpen size={16} className="shrink-0 text-slate-400 dark:text-white/40 group-hover:text-primary transition-colors" />
              <span className="truncate flex-1">
                {sess.sectionTitle || sess.bookTitle || 'جلسة مدارسة'}
              </span>
            </button>
          ))}

          {/* Older Records / History Modal Trigger Button */}
          <button
            type="button"
            onClick={onOpenHistory}
            title={isExpanded ? 'عرض سجلات المدارسة السابقة' : 'سجلات أقدم'}
            className={`w-full flex items-center rounded-lg border border-transparent hover:bg-slate-100/70 dark:hover:bg-white/5 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white transition-all duration-150 cursor-pointer ${
              isExpanded ? 'gap-3 px-3 py-1.5 text-xs sm:text-sm font-medium font-sans' : 'justify-center h-9 w-9 mx-auto'
            }`}
          >
            <History size={18} className="shrink-0 text-slate-400 dark:text-white/40" />
            {isExpanded && <span className="truncate">سجلات أقدم</span>}
          </button>
        </div>

        {!isExpanded && (
          <div className="w-6 h-[1px] bg-slate-200/80 dark:bg-white/10 mx-auto my-1.5 shrink-0" />
        )}

        {/* WORKSPACE TOOLS (تكبير الشاشة، المؤقت، العودة، الإضاءة، السمة) */}
        <div className={`${isExpanded ? 'pt-4' : 'pt-0.5'} space-y-0.5`}>
          {isExpanded && (
            <div className="px-2 pb-1 text-xs font-bold font-sans tracking-wide text-slate-400 dark:text-white/40">
              الأدوات والإعدادات
            </div>
          )}

          {/* 1. Fullscreen Toggle */}
          <button
            type="button"
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'الخروج من الشاشة الكاملة (Esc)' : 'تكبير الشاشة (ملء الشاشة)'}
            className={`w-full flex items-center rounded-lg border border-transparent hover:bg-slate-100/70 dark:hover:bg-white/5 text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white transition-all duration-150 cursor-pointer ${
              isExpanded ? 'gap-3 px-3 py-1.5 text-sm font-medium font-sans' : 'justify-center h-9 w-9 mx-auto'
            }`}
          >
            {isFullscreen ? (
              <Minimize size={19} className="shrink-0 text-slate-500 dark:text-white/50" />
            ) : (
              <Maximize size={19} className="shrink-0 text-slate-500 dark:text-white/50" />
            )}
            {isExpanded && <span className="truncate">{isFullscreen ? 'إنهاء ملء الشاشة' : 'تكبير الشاشة'}</span>}
          </button>

          {/* 2. Study Timer / Pomodoro Widget */}
          <div className={isExpanded ? 'w-full' : 'flex justify-center'}>
            <StudyTimerWidget isDark={isDark} isFullWidth={isExpanded} />
          </div>

          {!isExpanded && (
            <div className="w-6 h-[1px] bg-slate-200/80 dark:bg-white/10 mx-auto my-1.5 shrink-0" />
          )}

          {/* 4. LIGHTING SWITCH: NO OUTER FRAME */}
          {isExpanded ? (
            <div
              onClick={toggleTheme}
              role="button"
              tabIndex={0}
              className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-sm font-medium font-sans cursor-pointer active:scale-[0.99] hover:bg-slate-100/70 dark:hover:bg-white/5 transition-all select-none text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white"
            >
              <div className="flex items-center gap-3 min-w-0">
                {isDark ? (
                  <Moon size={19} className="shrink-0 text-slate-500 dark:text-white/50" />
                ) : (
                  <Sun size={19} className="shrink-0 text-slate-500 dark:text-white/50" />
                )}
                <div className="text-right min-w-0">
                  <span className="block text-sm font-medium font-sans leading-tight">الإضاءة</span>
                  <span className={`text-[11px] font-sans font-normal leading-tight ${isDark ? 'text-white/50' : 'text-slate-400'}`}>
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
          ) : (
            /* Collapsed mode single toggle button */
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? 'التحويل للوضع النهاري' : 'التحويل للوضع الليلي'}
              className="w-full flex items-center justify-center h-9 w-9 mx-auto rounded-lg border border-transparent hover:bg-slate-100/70 dark:hover:bg-white/5 text-slate-700 dark:text-white/70 transition-all cursor-pointer"
            >
              {isDark ? <Moon size={20} className="text-slate-500 dark:text-white/50" /> : <Sun size={20} className="text-slate-500 dark:text-white/50" />}
            </button>
          )}

          {/* 5. THEME SELECTOR: NO OUTER FRAME */}
          {isExpanded ? (
            <div className="px-3 py-1.5">
              {/* Header row: Palette icon + "لون السمة" + Accent name */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 text-sm font-medium font-sans text-slate-700 dark:text-white/70">
                  <Palette size={19} className="shrink-0 text-slate-500 dark:text-white/50" />
                  <span>لون السمة</span>
                </div>
                <span className={`text-[11px] font-bold font-sans ${
                  accentColor === 'emerald' ? 'text-teal-600 dark:text-teal-400' :
                  accentColor === 'amber' ? 'text-[#8e682d] dark:text-[#dfbf83]' :
                  accentColor === 'blue' ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'
                }`}>
                  {getAccentName()}
                </span>
              </div>

              {/* 4 Theme Circles Grid side-by-side */}
              <div className="grid grid-cols-4 gap-1.5">
                {ACCENT_OPTIONS.map((item) => {
                  const isSelected = accentColor === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAccentColor(item.id)}
                      className="group flex flex-col items-center gap-1.5 py-1 px-1 transition-all active:scale-95 cursor-pointer"
                    >
                      <span
                        className={`h-7 w-7 rounded-full bg-gradient-to-tr ${item.gradient} transition-all duration-200 ${
                          isSelected
                            ? `ring-2 ${item.ring} ring-offset-2 ${isDark ? 'ring-offset-[#12041f]' : 'ring-offset-white'} scale-110 shadow-md`
                            : 'scale-90 opacity-70 group-hover:opacity-100 group-hover:scale-95'
                        }`}
                      />
                      <span
                        className={`text-[11px] font-sans leading-tight transition-colors ${
                          isSelected
                            ? (isDark ? 'font-bold text-white' : 'font-bold text-slate-900')
                            : (isDark ? 'font-medium text-white/60' : 'font-medium text-slate-600')
                        }`}
                      >
                        {item.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            /* Collapsed mode theme trigger */
            <div className="relative" ref={collapsedPopoverRef}>
              <button
                type="button"
                onClick={() => setShowCollapsedThemePopover(!showCollapsedThemePopover)}
                title={`لون السمة: ${getAccentName()}`}
                className="w-full flex items-center justify-center h-9 w-9 mx-auto rounded-lg border border-transparent hover:bg-slate-100/70 dark:hover:bg-white/5 text-slate-700 dark:text-white/70 transition-all cursor-pointer"
              >
                <Palette size={20} className="shrink-0 text-slate-500 dark:text-white/50" />
              </button>

              <AnimatePresence>
                {showCollapsedThemePopover && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, x: 8 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.92, x: 8 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute right-full top-0 mr-2 w-64 p-3.5 rounded-lg border shadow-2xl backdrop-blur-2xl z-50 space-y-3 ${
                      isDark ? 'bg-[#12041f]/98 border-white/15 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2">
                      <span className="text-xs font-bold font-sans">لون السمة</span>
                      <button
                        type="button"
                        onClick={toggleTheme}
                        className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10"
                      >
                        {isDark ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-purple-600" />}
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {ACCENT_OPTIONS.map((item) => {
                        const isSelected = accentColor === item.id
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setAccentColor(item.id)}
                            className="group flex flex-col items-center gap-1.5 py-1 px-1 cursor-pointer"
                          >
                            <span
                              className={`h-7 w-7 rounded-full bg-gradient-to-tr ${item.gradient} ${
                                isSelected ? `ring-2 ${item.ring} ring-offset-2 ring-offset-white scale-110` : 'opacity-70'
                              }`}
                            />
                            <span className="text-[11px] font-sans font-medium">{item.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* USER PROFILE IN EXPANDED MODE: INTEGRATED WITH TOP DIVIDER LINE, SCROLLS NATURALLY */}
        {isExpanded && (
          <div className="pt-2 pb-2 mt-2 border-t border-slate-200/80 dark:border-white/10">
            <button
              type="button"
              onClick={onOpenProfile}
              title={`الملف الشخصي: ${displayName}`}
              className="flex w-full items-center justify-between p-2 rounded-lg hover:bg-slate-100/70 dark:hover:bg-white/5 transition-all duration-150 active:scale-[0.99] cursor-pointer text-right"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full brand-gradient text-white shadow-sm overflow-hidden ring-1 ring-white/15">
                  {user?.avatarUrl ? (
                    <img
                      src={getAvatarUrl(user.avatarUrl)}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User size={20} strokeWidth={2.2} />
                  )}
                </div>
                <div className="min-w-0 flex-1 text-right">
                  <div className="flex items-center gap-1.5">
                    <span className={`truncate text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      {displayName}
                    </span>
                    {isAdmin && (
                      <span className={`shrink-0 rounded-full px-1.5 py-0.2 text-[9px] font-bold border ${getThemeBadgeClass()}`}>
                        أدمن
                      </span>
                    )}
                  </div>
                  <p className={`truncate text-[11px] font-mono mt-0.5 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                    {displayEmail}
                  </p>
                </div>
              </div>
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${isDark ? 'text-white/50' : 'text-slate-400'}`}>
                <ChevronLeft size={16} />
              </div>
            </button>
          </div>
        )}
      </div>

      {/* FIXED USER PROFILE AT THE BOTTOM IN COLLAPSED MODE ONLY */}
      {!isExpanded && (
        <div className="p-2 shrink-0 border-t border-slate-200/80 dark:border-white/10 flex justify-center">
          <button
            type="button"
            onClick={onOpenProfile}
            title={`الملف الشخصي: ${displayName}`}
            className="flex items-center justify-center h-10 w-10 mx-auto rounded-lg hover:bg-slate-100/70 dark:hover:bg-white/5 transition-all duration-150 cursor-pointer"
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full brand-gradient text-white shadow-sm overflow-hidden ring-1 ring-white/15">
              {user?.avatarUrl ? (
                <img
                  src={getAvatarUrl(user.avatarUrl)}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User size={19} strokeWidth={2.2} />
              )}
            </div>
          </button>
        </div>
      )}
    </aside>
  )
}
