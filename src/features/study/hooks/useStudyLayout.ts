import { useState, useEffect, useCallback, useMemo } from 'react'

export type StudyPanelKey = 'sidebar' | 'document' | 'chat' | 'mindmap' | 'quiz'

export interface UseStudyLayoutOptions {
  isDark?: boolean
  accentColor?: string
  onSwitchView?: (view: 'hero' | 'workspace' | 'tracks' | 'track-admin') => void
}

export function useStudyLayout({
  isDark = true,
  accentColor = 'purple',
  onSwitchView,
}: UseStudyLayoutOptions = {}) {
  // 1. Independent Panel Visibility States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isDocumentOpen, setIsDocumentOpen] = useState(true)
  const [isChatOpen, setIsChatOpen] = useState(true)
  const [isMindmapOpen, setIsMindmapOpen] = useState(false)
  const [isQuizOpen, setIsQuizOpen] = useState(false)

  // 2. Panel Widths (desktop drag resizing)
  const [sidebarWidth, setSidebarWidth] = useState(380)
  const [documentWidth, setDocumentWidth] = useState(900)
  const [chatWidth, setChatWidth] = useState<number>(() => {
    const saved =
      typeof window !== 'undefined'
        ? localStorage.getItem('zad_study_chat_width')
        : null
    return saved ? Math.max(350, Math.min(Number(saved), 1400)) : 700
  })
  const [mindmapWidth, setMindmapWidth] = useState<number>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('zad_study_mindmap_width') : null
    return saved ? Math.max(350, Math.min(Number(saved), 1400)) : 750
  })
  const [quizWidth, setQuizWidth] = useState<number>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('zad_study_quiz_width') : null
    return saved ? Math.max(350, Math.min(Number(saved), 1400)) : 750
  })

  // 3. Mobile responsiveness & Focus tracking
  const [isMobile, setIsMobile] = useState<boolean>(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  )
  const [focusTarget, setFocusTarget] = useState<{
    panel: string
    id: number
  } | null>(null)

  const focusPanel = useCallback((panelKey: string) => {
    setFocusTarget({ panel: panelKey, id: Date.now() })
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 4. Global study panel open event listener
  useEffect(() => {
    try {
      const pendingPanel = sessionStorage.getItem('zad_pending_study_panel')
      if (pendingPanel === 'tracks' || pendingPanel === 'track-admin') {
        sessionStorage.removeItem('zad_pending_study_panel')
        onSwitchView?.(pendingPanel)
      }
    } catch {}

    const handleOpenStudyPanel = (e: any) => {
      const panel = e.detail?.panel

      if (panel === 'tracks' || panel === 'track-admin') {
        try { sessionStorage.removeItem('zad_pending_study_panel') } catch {}
        onSwitchView?.(panel)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }

      if (panel === 'hero') {
        onSwitchView?.('hero')
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }

      if (panel === 'community') {
        onSwitchView?.('hero')
        setTimeout(() => {
          const el = document.getElementById('study-hero-community')
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 120)
        return
      }

      onSwitchView?.('workspace')

      if (panel === 'index' || panel === 'sidebar') {
        setIsSidebarOpen(true)
        if (isMobile) {
          setIsDocumentOpen(false)
          setIsChatOpen(false)
          setIsMindmapOpen(false)
          setIsQuizOpen(false)
        }
        focusPanel('sidebar')
      } else if (panel === 'document') {
        setIsDocumentOpen(true)
        if (isMobile) {
          setIsSidebarOpen(false)
          setIsChatOpen(false)
          setIsMindmapOpen(false)
          setIsQuizOpen(false)
        }
        focusPanel('document')
      } else if (panel === 'chat') {
        setIsChatOpen(true)
        if (isMobile) {
          setIsSidebarOpen(false)
          setIsDocumentOpen(false)
          setIsMindmapOpen(false)
          setIsQuizOpen(false)
        }
        focusPanel('chat')
      } else if (panel === 'mindmap') {
        setIsMindmapOpen(true)
        if (isMobile) {
          setIsSidebarOpen(false)
          setIsDocumentOpen(false)
          setIsChatOpen(false)
          setIsQuizOpen(false)
        }
        focusPanel('mindmap')
      } else if (panel === 'quiz') {
        setIsQuizOpen(true)
        if (isMobile) {
          setIsSidebarOpen(false)
          setIsDocumentOpen(false)
          setIsChatOpen(false)
          setIsMindmapOpen(false)
        }
        focusPanel('quiz')
      } else if (panel === 'workspace') {
        if (isMobile) {
          setIsDocumentOpen(true)
          setIsSidebarOpen(false)
          setIsChatOpen(false)
          setIsMindmapOpen(false)
          setIsQuizOpen(false)
          focusPanel('document')
        } else {
          setIsDocumentOpen(true)
          setIsChatOpen(true)
          setIsSidebarOpen(true)
          focusPanel('document')
        }
      }
    }

    window.addEventListener('open_study_panel', handleOpenStudyPanel)
    return () =>
      window.removeEventListener('open_study_panel', handleOpenStudyPanel)
  }, [isMobile, focusPanel, onSwitchView])

  // 5. Fullscreen mode
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {})
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {})
      }
    }
  }, [])

  // 6. UI Workspace Sidebar & Header Collapsing
  const [isWorkspaceSidebarExpanded, setIsWorkspaceSidebarExpanded] =
    useState<boolean>(() => {
      try {
        const saved = localStorage.getItem('zad_study_workspace_sidebar_expanded')
        return saved !== null ? JSON.parse(saved) : true
      } catch {
        return true
      }
    })

  const handleToggleWorkspaceSidebar = useCallback(() => {
    setIsWorkspaceSidebarExpanded((prev) => {
      const next = !prev
      try {
        localStorage.setItem(
          'zad_study_workspace_sidebar_expanded',
          JSON.stringify(next)
        )
      } catch {}
      return next
    })
  }, [])

  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('zad_study_header_collapsed') === 'true'
  })

  const toggleHeaderCollapse = useCallback(() => {
    setIsHeaderCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('zad_study_header_collapsed', String(next))
      } catch {}
      return next
    })
  }, [])

  // 7. Timer popup & Platform Sidebar
  const [isTimerNavbarExpanded, setIsTimerNavbarExpanded] = useState(false)
  const [isPlatformSidebarOpen, setIsPlatformSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isTimerNavbarExpanded) return

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement
      if (
        !target.closest('#study-mobile-timer-container') &&
        !target.closest('#study-mobile-timer-btn')
      ) {
        setIsTimerNavbarExpanded(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('touchstart', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('touchstart', handleOutsideClick)
    }
  }, [isTimerNavbarExpanded])

  // 8. Panel Resizing
  const [isResizing, setIsResizing] = useState(false)

  const startResizingPanel = useCallback(
    (panelKey: StudyPanelKey, e: React.MouseEvent) => {
      e.preventDefault()
      setIsResizing(true)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      const startX = e.clientX
      let startWidth = 300
      if (panelKey === 'sidebar') startWidth = sidebarWidth
      else if (panelKey === 'document') startWidth = documentWidth
      else if (panelKey === 'chat') startWidth = chatWidth
      else if (panelKey === 'mindmap') startWidth = mindmapWidth
      else if (panelKey === 'quiz') startWidth = quizWidth

      const handleMouseMove = (moveEv: MouseEvent) => {
        // RTL delta calculation: dragging mouse left (smaller clientX) increases width
        const deltaX = startX - moveEv.clientX
        const newWidth = startWidth + deltaX

        if (panelKey === 'sidebar')
          setSidebarWidth(Math.max(340, Math.min(newWidth, 800)))
        else if (panelKey === 'document')
          setDocumentWidth(Math.max(280, Math.min(newWidth, 1200)))
        else if (panelKey === 'chat') {
          const clamped = Math.max(350, Math.min(newWidth, 1400))
          setChatWidth(clamped)
          try {
            localStorage.setItem('zad_study_chat_width', String(clamped))
          } catch {}
        } else if (panelKey === 'mindmap') {
          const clamped = Math.max(320, Math.min(newWidth, 1400))
          setMindmapWidth(clamped)
          try { localStorage.setItem('zad_study_mindmap_width', String(clamped)) } catch {}
        } else if (panelKey === 'quiz') {
          const clamped = Math.max(320, Math.min(newWidth, 1400))
          setQuizWidth(clamped)
          try { localStorage.setItem('zad_study_quiz_width', String(clamped)) } catch {}
        }
      }

      const handleMouseUp = () => {
        setIsResizing(false)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [sidebarWidth, documentWidth, chatWidth, mindmapWidth, quizWidth]
  )

  // 9. Mobile Tab helpers
  const handleSelectMobileTab = useCallback(
    (tab: StudyPanelKey) => {
      setIsSidebarOpen(tab === 'sidebar')
      setIsDocumentOpen(tab === 'document')
      setIsChatOpen(tab === 'chat')
      setIsMindmapOpen(tab === 'mindmap')
      setIsQuizOpen(tab === 'quiz')
      focusPanel(tab)
    },
    [focusPanel]
  )

  const activeMobileTab = useMemo(() => {
    if (focusTarget?.panel) {
      const p = focusTarget.panel
      const isOpen =
        p === 'sidebar'
          ? isSidebarOpen
          : p === 'document'
            ? isDocumentOpen
            : p === 'chat'
              ? isChatOpen
              : p === 'mindmap'
                ? isMindmapOpen
                : p === 'quiz'
                  ? isQuizOpen
                  : false
      if (isOpen) return p
    }

    if (isSidebarOpen) return 'sidebar'
    if (isDocumentOpen) return 'document'
    if (isChatOpen) return 'chat'
    if (isMindmapOpen) return 'mindmap'
    if (isQuizOpen) return 'quiz'
    return 'document'
  }, [
    focusTarget,
    isSidebarOpen,
    isDocumentOpen,
    isChatOpen,
    isMindmapOpen,
    isQuizOpen,
  ])

  // 10. Open Panel Names List
  const openPanelNames = useMemo(() => {
    const list: string[] = []
    if (isSidebarOpen) list.push('sidebar')
    if (isDocumentOpen) list.push('document')
    if (isChatOpen) list.push('chat')
    if (isMindmapOpen) list.push('mindmap')
    if (isQuizOpen) list.push('quiz')
    return list
  }, [isSidebarOpen, isDocumentOpen, isChatOpen, isMindmapOpen, isQuizOpen])

  const lastOpenPanel = openPanelNames[openPanelNames.length - 1] || null

  // 11. CSS Class Helpers for tabs & toggles
  const getMobileToggleClass = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        switch (accentColor) {
          case 'emerald':
            return 'bg-teal-600 text-white shadow-md shadow-teal-900/40 ring-1 ring-teal-400'
          case 'amber':
            return 'bg-[#b88d46] text-white shadow-md shadow-amber-900/40 ring-1 ring-[#dfbf83]'
          case 'blue':
            return 'bg-blue-600 text-white shadow-md shadow-blue-900/40 ring-1 ring-blue-400'
          case 'purple':
          default:
            return 'bg-purple-600 text-white shadow-md shadow-purple-900/40 ring-1 ring-purple-400'
        }
      }
      return isDark
        ? 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
        : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
    },
    [accentColor, isDark]
  )

  const getBottomNavTabClass = useCallback(
    (isActive: boolean) => {
      const base =
        'flex-1 h-full flex flex-col items-center justify-center py-1.5 px-0.5 gap-1 transition-colors duration-200 relative cursor-pointer min-w-0 select-none border-0 outline-none overflow-hidden'
      if (!isActive) {
        return `${base} text-muted-foreground hover:text-foreground opacity-70 hover:bg-black/[0.03] dark:hover:bg-white/[0.03]`
      }
      switch (accentColor) {
        case 'amber':
          return `${base} text-[#8e682d] dark:text-[#dfbf83] font-bold bg-[#c59b58]/18 dark:bg-[#c59b58]/25`
        case 'emerald':
          return `${base} text-teal-700 dark:text-teal-300 font-bold bg-teal-500/18 dark:bg-teal-500/25`
        case 'blue':
          return `${base} text-blue-700 dark:text-blue-300 font-bold bg-blue-500/18 dark:bg-blue-500/25`
        case 'purple':
        default:
          return `${base} text-white font-bold bg-[#800080] dark:bg-[#800080]`
      }
    },
    [accentColor]
  )

  return {
    // Visibility
    isSidebarOpen,
    setIsSidebarOpen,
    isDocumentOpen,
    setIsDocumentOpen,
    isChatOpen,
    setIsChatOpen,
    isMindmapOpen,
    setIsMindmapOpen,
    isQuizOpen,
    setIsQuizOpen,

    // Widths
    sidebarWidth,
    setSidebarWidth,
    documentWidth,
    setDocumentWidth,
    chatWidth,
    setChatWidth,
    mindmapWidth,
    setMindmapWidth,
    quizWidth,
    setQuizWidth,

    // Resizing
    isResizing,
    startResizingPanel,

    // Mobile & Focus
    isMobile,
    focusTarget,
    focusPanel,
    activeMobileTab,
    handleSelectMobileTab,

    // Sidebars & Collapsing
    isWorkspaceSidebarExpanded,
    setIsWorkspaceSidebarExpanded,
    handleToggleWorkspaceSidebar,
    isHeaderCollapsed,
    setIsHeaderCollapsed,
    toggleHeaderCollapse,
    isTimerNavbarExpanded,
    setIsTimerNavbarExpanded,
    isPlatformSidebarOpen,
    setIsPlatformSidebarOpen,

    // Fullscreen
    isFullscreen,
    toggleFullscreen,

    // Computed
    openPanelNames,
    lastOpenPanel,

    // Style helpers
    getMobileToggleClass,
    getBottomNavTabClass,
  }
}

