import React, { useState, useEffect } from 'react'
import {
  Folder,
  FolderOpen,
  BookOpen,
  MessageCircle,
  MessageSquarePlus,
  Brain,
  ClipboardList,
  ArrowRight,
  History,
  Maximize,
  Minimize,
  PanelRightClose,
  PanelRightOpen,
  Menu
} from 'lucide-react'
import { useTheme } from '../../../contexts/ThemeContext'
import { StudyTimerWidget } from './StudyTimerWidget'
import { studyApi, type StudySessionDto } from '../../../api/studyApi'
import whiteLogo from '@/assets/images/WhiteLogo.webp'

export interface StudyWorkspaceSidebarProps {
  isExpanded: boolean
  onToggleExpanded: () => void
  onExpandSidebar?: () => void
  onOpenPlatformSidebar?: () => void
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
  onOpenProfile?: () => void
  onSelectSavedSession?: (session: StudySessionDto) => void
  isFullscreen: boolean
  onToggleFullscreen: () => void
  currentBookTitle?: string
  currentChunkTitle?: string
}

export function StudyWorkspaceSidebar({
  isExpanded,
  onToggleExpanded,
  onExpandSidebar,
  onOpenPlatformSidebar,
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
  onSelectSavedSession,
  isFullscreen,
  onToggleFullscreen,
  currentBookTitle,
  currentChunkTitle
}: StudyWorkspaceSidebarProps) {
  const { isDark, accentColor } = useTheme()
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

  // Active navigation tab styling matching the exact neutral card frame of the former new session button
  const getActiveTabClass = (isActive: boolean) => {
    if (!isActive) {
      return isDark
        ? 'text-white/70 hover:text-white hover:bg-white/5 border-transparent font-normal'
        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 border-transparent font-normal'
    }

    if (isDark) {
      return 'bg-white/[0.04] text-white border-white/10 shadow-2xs font-medium'
    }
    return 'bg-white text-slate-800 border-slate-200 shadow-2xs font-medium'
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

  return (
    <aside
      dir="rtl"
      aria-label="شريط أدوات بيئة المدارسة"
      className={`relative z-30 flex flex-col h-full shrink-0 border-l transition-all duration-300 ease-out select-none ${
        isExpanded ? 'w-[265px] sm:w-[270px]' : 'w-[64px]'
      } ${getSidebarContainerClass()}`}
    >
      {/* ========================================================================= */}
      {/* 1. HEADER: BRAND LOGO & TITLE + EXPAND/COLLAPSE ICON                     */}
      {/* ========================================================================= */}
      <div
        className={`min-h-[58px] pt-2.5 pb-2 box-border px-3.5 shrink-0 flex items-center transition-colors ${
          isExpanded ? 'justify-between' : 'justify-center'
        }`}
      >
        {isExpanded ? (
          <>
            <div
              onClick={onReturnToHero}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer group select-none"
              title="الرئيسية للمدارسة"
            >
              {renderThemeLogo('h-8 w-8')}
              <span className={`font-sans text-[16px] font-bold tracking-tight truncate translate-y-0.5 ${getHeaderTitleColorClass()}`}>
                المدارسة الذكية
              </span>
            </div>

            {/* Collapse button */}
            <button
              type="button"
              onClick={onToggleExpanded}
              aria-label="طي الشريط الجانبي"
              title="طي الشريط الجانبي"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100/90 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/10 transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <PanelRightClose size={20} strokeWidth={2} />
            </button>
          </>
        ) : (
          /* Expand button in collapsed mode */
          <button
            type="button"
            onClick={onToggleExpanded}
            aria-label="توسيع الشريط الجانبي"
            title="توسيع الشريط الجانبي"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100/90 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/10 transition-all cursor-pointer active:scale-95"
          >
            <PanelRightOpen size={20} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. SCROLLABLE CONTENT: ALL ITEMS SCROLL UNDER FIXED HEADER                */}
      {/* ========================================================================= */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-2.5 py-1.5 space-y-2 text-right [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* PRIMARY ACTIONS: NEW STUDY SESSION + RETURN TO HOME + MAIN PLATFORM SIDEBAR */}
        <div className="pt-0.5 space-y-1.5">
          {/* 1. جلسة مدارسة جديدة */}
          <button
            type="button"
            onClick={onNewSession}
            title={isExpanded ? 'بدء جلسة مدارسة جديدة' : 'جلسة مدارسة جديدة'}
            className={`w-full flex items-center rounded-lg border border-transparent hover:bg-slate-100/70 dark:hover:bg-white/5 text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white transition-all duration-150 cursor-pointer ${
              isExpanded ? 'gap-3 px-3.5 py-2 text-sm font-medium font-sans text-right' : 'justify-center h-10 w-10 mx-auto'
            }`}
          >
            <MessageSquarePlus size={20} className="shrink-0 text-slate-500 dark:text-white/50" />
            {isExpanded && <span className="truncate">جلسة مدارسة جديدة</span>}
          </button>

          {/* 2. العودة إلى الصفحة الرئيسية */}
          <button
            type="button"
            onClick={onReturnToHero}
            title={isExpanded ? 'العودة إلى واجهة الصفحة الرئيسية' : 'العودة للرئيسية'}
            className={`w-full flex items-center rounded-lg border border-transparent hover:bg-slate-100/70 dark:hover:bg-white/5 text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white transition-all duration-150 cursor-pointer ${
              isExpanded ? 'gap-3 px-3.5 py-2 text-sm font-medium font-sans text-right' : 'justify-center h-10 w-10 mx-auto'
            }`}
          >
            <ArrowRight size={20} className="shrink-0 text-slate-500 dark:text-white/50" />
            {isExpanded && <span className="truncate">العودة إلى الصفحة الرئيسية</span>}
          </button>

          {/* 3. القائمة الرئيسية للمنصة */}
          <button
            type="button"
            onClick={onOpenPlatformSidebar}
            title={isExpanded ? 'فتح القائمة الرئيسية للمنصة' : 'القائمة الرئيسية للمنصة'}
            className={`w-full flex items-center rounded-lg border border-transparent hover:bg-slate-100/70 dark:hover:bg-white/5 text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white transition-all duration-150 cursor-pointer ${
              isExpanded ? 'gap-3 px-3.5 py-2 text-sm font-medium font-sans text-right' : 'justify-center h-10 w-10 mx-auto'
            }`}
          >
            <Menu size={20} className="shrink-0 text-slate-500 dark:text-white/50" />
            {isExpanded && <span className="truncate">القائمة الرئيسية للمنصة</span>}
          </button>
        </div>

        {!isExpanded && (
          <div className="w-6 h-[1px] bg-slate-200/80 dark:bg-white/10 mx-auto my-1.5 shrink-0" />
        )}

        {/* WORKSPACE NAVIGATION ITEMS */}
        <div className="space-y-1.5">
          {isExpanded && (
            <div className="px-2 pb-0.5 text-xs font-bold font-sans tracking-wide text-slate-400 dark:text-white/40">
              قوائم الدراسة
            </div>
          )}

          {/* 1. الفهرس وتصفح الكتاب (Folder Icon) */}
          <button
            type="button"
            onClick={onToggleSidebar}
            title="فهرس المحتوى والكتب"
            className={`w-full flex items-center rounded-lg border transition-all duration-150 cursor-pointer ${
              isExpanded ? 'gap-3 px-3.5 py-2.5 text-sm font-sans' : 'justify-center h-11 w-11 mx-auto'
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
              isExpanded ? 'gap-3 px-3.5 py-2.5 text-sm font-sans' : 'justify-center h-11 w-11 mx-auto'
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
              isExpanded ? 'gap-3 px-3.5 py-2.5 text-sm font-sans' : 'justify-center h-11 w-11 mx-auto'
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
              isExpanded ? 'gap-3 px-3.5 py-2.5 text-sm font-sans' : 'justify-center h-11 w-11 mx-auto'
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
              isExpanded ? 'gap-3 px-3.5 py-2.5 text-sm font-sans' : 'justify-center h-11 w-11 mx-auto'
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
            <StudyTimerWidget
              isDark={isDark}
              isFullWidth={isExpanded}
              onRequestExpand={() => {
                if (onExpandSidebar) {
                  onExpandSidebar()
                } else if (!isExpanded) {
                  onToggleExpanded()
                }
              }}
            />
          </div>
        </div>
      </div>
    </aside>
  )
}

