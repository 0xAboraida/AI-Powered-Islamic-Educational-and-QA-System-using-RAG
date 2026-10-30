import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Bell,
  BookOpen,
  Info,
  CheckCheck,
  Sparkles,
  Clock,
  BellOff,
  RefreshCw,
  Layers,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

const TUTOR_ENGINE_URL = import.meta.env.VITE_TUTOR_ENGINE_URL || 'https://abourida-zad-tutor-engine-space.hf.space'
const API_BASE = TUTOR_ENGINE_URL

export interface Notification {
  id: string
  title: string
  message: string
  type: string
  timestamp: string
  payload: string[]
  read?: boolean
}

export interface NotificationBellProps {
  variant?: 'default' | 'glass'
  className?: string
}

export default function NotificationBell({ variant = 'default', className = '' }: NotificationBellProps) {
  const { isDark, accentColor } = useTheme()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('zad_read_notifications')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch {
      return new Set()
    }
  })
  const [activeFilter, setActiveFilter] = useState<'all' | 'update' | 'unread'>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(new Set())
  const dropdownRef = useRef<HTMLDivElement>(null)

  // ----------------------------------------------------
  // Dynamic Glassmorphism & Theme Color Style Helpers
  // ----------------------------------------------------
  const getThemeGlassPanelClass = () => {
    if (isDark) {
      switch (accentColor) {
        case 'emerald':
          return 'bg-[#080b12]/92 sm:bg-[#080b12]/96 border-teal-500/25 shadow-[-16px_20px_60px_rgba(0,0,0,0.85)]'
        case 'amber':
          return 'bg-[#0b0c10]/92 sm:bg-[#0b0c10]/96 border-[#dfbf83]/25 shadow-[-16px_20px_60px_rgba(0,0,0,0.85)]'
        case 'blue':
          return 'bg-[#080c18]/92 sm:bg-[#080c18]/96 border-blue-500/25 shadow-[-16px_20px_60px_rgba(0,0,0,0.85)]'
        case 'purple':
        default:
          return 'bg-[#0c0717]/92 sm:bg-[#0c0717]/96 border-purple-500/25 shadow-[-16px_20px_60px_rgba(0,0,0,0.85)]'
      }
    } else {
      switch (accentColor) {
        case 'emerald':
          return 'bg-white/94 sm:bg-white/97 border-teal-500/25 shadow-[0_20px_50px_rgba(13,148,136,0.12)]'
        case 'amber':
          return 'bg-[#fcfbf9]/94 sm:bg-[#fcfbf9]/97 border-[#dfbf83]/40 shadow-[0_20px_50px_rgba(197,155,88,0.12)]'
        case 'blue':
          return 'bg-white/94 sm:bg-white/97 border-blue-500/25 shadow-[0_20px_50px_rgba(37,99,235,0.12)]'
        case 'purple':
        default:
          return 'bg-white/94 sm:bg-white/97 border-purple-500/25 shadow-[0_20px_50px_rgba(122,23,201,0.12)]'
      }
    }
  }

  const getThemeHeaderClass = () => {
    if (isDark) {
      switch (accentColor) {
        case 'emerald':
          return 'border-teal-500/15 bg-gradient-to-l from-teal-950/30 via-teal-900/10 to-transparent'
        case 'amber':
          return 'border-[#dfbf83]/15 bg-gradient-to-l from-[#36250f]/35 via-[#231707]/15 to-transparent'
        case 'blue':
          return 'border-blue-500/15 bg-gradient-to-l from-blue-950/30 via-blue-900/10 to-transparent'
        case 'purple':
        default:
          return 'border-purple-500/15 bg-gradient-to-l from-purple-950/30 via-purple-900/10 to-transparent'
      }
    } else {
      return 'border-stone-200/70 bg-stone-50/70'
    }
  }

  const getThemeIconBoxClass = () => {
    switch (accentColor) {
      case 'emerald':
        return isDark ? 'bg-teal-500/15 border-teal-500/30 text-teal-300' : 'bg-teal-50 border-teal-200 text-teal-800'
      case 'amber':
        return isDark ? 'bg-[#dfbf83]/15 border-[#dfbf83]/30 text-[#eed9b0]' : 'bg-[#fbf8f0] border-[#ebd9b5] text-[#8a652a]'
      case 'blue':
        return isDark ? 'bg-blue-500/15 border-blue-500/30 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-800'
      case 'purple':
      default:
        return isDark ? 'bg-purple-500/15 border-purple-500/30 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-800'
    }
  }

  const getThemeTabActiveClass = () => {
    switch (accentColor) {
      case 'emerald':
        return 'bg-teal-600 text-white shadow-sm shadow-teal-600/30'
      case 'amber':
        return 'bg-[#b88d46] text-white shadow-sm shadow-[#b88d46]/30'
      case 'blue':
        return 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
      case 'purple':
      default:
        return 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
    }
  }

  const getThemeCardClass = (isRead: boolean) => {
    if (!isRead) {
      if (isDark) {
        switch (accentColor) {
          case 'emerald':
            return 'bg-teal-500/[0.08] border-teal-500/25 hover:bg-teal-500/[0.12] shadow-sm'
          case 'amber':
            return 'bg-[#dfbf83]/[0.08] border-[#dfbf83]/25 hover:bg-[#dfbf83]/[0.12] shadow-sm'
          case 'blue':
            return 'bg-blue-500/[0.08] border-blue-500/25 hover:bg-blue-500/[0.12] shadow-sm'
          case 'purple':
          default:
            return 'bg-purple-500/[0.08] border-purple-500/25 hover:bg-purple-500/[0.12] shadow-sm'
        }
      } else {
        switch (accentColor) {
          case 'emerald':
            return 'bg-teal-50/70 border-teal-200 hover:bg-teal-50 shadow-sm'
          case 'amber':
            return 'bg-[#fcf9f2] border-[#ebd9b5] hover:bg-[#f8f2e2] shadow-sm'
          case 'blue':
            return 'bg-blue-50/70 border-blue-200 hover:bg-blue-50 shadow-sm'
          case 'purple':
          default:
            return 'bg-purple-50/70 border-purple-200 hover:bg-purple-50 shadow-sm'
        }
      }
    } else {
      return isDark
        ? 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] opacity-80 hover:opacity-100'
        : 'bg-stone-50/60 border-stone-200/70 hover:bg-stone-100/60 opacity-85 hover:opacity-100'
    }
  }

  const getThemeCardIconBoxClass = (isLibraryUpdate: boolean) => {
    if (!isLibraryUpdate) {
      return isDark
        ? 'bg-white/10 border-white/15 text-white/80'
        : 'bg-stone-200/70 border-stone-300 text-stone-700'
    }
    switch (accentColor) {
      case 'emerald':
        return isDark ? 'bg-teal-500/15 border-teal-500/30 text-teal-300' : 'bg-teal-100/80 border-teal-200 text-teal-800'
      case 'amber':
        return isDark ? 'bg-[#dfbf83]/15 border-[#dfbf83]/30 text-[#eed9b0]' : 'bg-[#ebd9b5]/60 border-[#dfbf83]/70 text-[#8a652a]'
      case 'blue':
        return isDark ? 'bg-blue-500/15 border-blue-500/30 text-blue-300' : 'bg-blue-100/80 border-blue-200 text-blue-800'
      case 'purple':
      default:
        return isDark ? 'bg-purple-500/15 border-purple-500/30 text-purple-300' : 'bg-purple-100/80 border-purple-200 text-purple-800'
    }
  }

  const getUnreadDotClass = () => {
    switch (accentColor) {
      case 'emerald':
        return 'bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.85)]'
      case 'amber':
        return 'bg-[#dfbf83] shadow-[0_0_8px_rgba(223,191,131,0.85)]'
      case 'blue':
        return 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.85)]'
      case 'purple':
      default:
        return 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.85)]'
    }
  }

  const getBookTagClass = () => {
    if (isDark) {
      switch (accentColor) {
        case 'emerald':
          return 'bg-teal-500/10 border-teal-500/20 text-teal-200 hover:bg-teal-500/20'
        case 'amber':
          return 'bg-[#dfbf83]/10 border-[#dfbf83]/20 text-[#eed9b0] hover:bg-[#dfbf83]/20'
        case 'blue':
          return 'bg-blue-500/10 border-blue-500/20 text-blue-200 hover:bg-blue-500/20'
        case 'purple':
        default:
          return 'bg-purple-500/10 border-purple-500/20 text-purple-200 hover:bg-purple-500/20'
      }
    } else {
      switch (accentColor) {
        case 'emerald':
          return 'bg-teal-50 border-teal-200 text-teal-900 hover:bg-teal-100/70'
        case 'amber':
          return 'bg-[#fbf8f0] border-[#ebd9b5] text-[#78541c] hover:bg-[#f4ebd7]'
        case 'blue':
          return 'bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100/70'
        case 'purple':
        default:
          return 'bg-purple-50 border-purple-200 text-purple-900 hover:bg-purple-100/70'
      }
    }
  }

  const getExpandButtonClass = () => {
    switch (accentColor) {
      case 'emerald':
        return isDark ? 'border-teal-500/30 bg-teal-500/15 text-teal-300 hover:bg-teal-500/25' : 'border-teal-300 bg-teal-100/60 text-teal-800 hover:bg-teal-200/60'
      case 'amber':
        return isDark ? 'border-[#dfbf83]/30 bg-[#dfbf83]/15 text-[#eed9b0] hover:bg-[#dfbf83]/25' : 'border-[#dfbf83]/60 bg-[#ebd9b5]/40 text-[#8a652a] hover:bg-[#ebd9b5]/70'
      case 'blue':
        return isDark ? 'border-blue-500/30 bg-blue-500/15 text-blue-300 hover:bg-blue-500/25' : 'border-blue-300 bg-blue-100/60 text-blue-800 hover:bg-blue-200/60'
      case 'purple':
      default:
        return isDark ? 'border-purple-500/30 bg-purple-500/15 text-purple-300 hover:bg-purple-500/25' : 'border-purple-300 bg-purple-100/60 text-purple-800 hover:bg-purple-200/60'
    }
  }

  const getBellButtonClass = () => {
    if (isDark) {
      switch (accentColor) {
        case 'emerald':
          return 'bg-white/[0.04] hover:bg-white/[0.09] border-white/10 hover:border-teal-400/50 text-slate-300 hover:text-teal-200 shadow-xs hover:shadow-teal-500/20'
        case 'amber':
          return 'bg-white/[0.04] hover:bg-white/[0.09] border-white/10 hover:border-[#dfbf83]/50 text-slate-300 hover:text-[#eed8ad] shadow-xs hover:shadow-[#dfbf83]/20'
        case 'blue':
          return 'bg-white/[0.04] hover:bg-white/[0.09] border-white/10 hover:border-blue-400/50 text-slate-300 hover:text-blue-200 shadow-xs hover:shadow-blue-500/20'
        case 'purple':
        default:
          return 'bg-white/[0.04] hover:bg-white/[0.09] border-white/10 hover:border-purple-400/50 text-slate-300 hover:text-purple-200 shadow-xs hover:shadow-purple-500/20'
      }
    }
    switch (accentColor) {
      case 'emerald':
        return 'bg-white/80 hover:bg-white border-teal-200 hover:border-teal-300 text-teal-800 shadow-xs'
      case 'amber':
        return 'bg-white/80 hover:bg-white border-[#ebd9b5] hover:border-[#dfbf83] text-[#8a652a] shadow-xs'
      case 'blue':
        return 'bg-white/80 hover:bg-white border-blue-200 hover:border-blue-300 text-blue-800 shadow-xs'
      case 'purple':
      default:
        return 'bg-white/80 hover:bg-white border-purple-200 hover:border-purple-300 text-purple-800 shadow-xs'
    }
  }

  const getBellBadgeClass = () => {
    switch (accentColor) {
      case 'emerald':
        return 'bg-teal-500 shadow-teal-500/40'
      case 'amber':
        return 'bg-[#c59b58] shadow-[#c59b58]/40'
      case 'blue':
        return 'bg-blue-600 shadow-blue-500/40'
      case 'purple':
      default:
        return 'bg-purple-600 shadow-purple-500/40'
    }
  }

  const getScrollbarThumbClass = () => {
    switch (accentColor) {
      case 'emerald':
        return isDark
          ? '[&::-webkit-scrollbar-thumb]:bg-teal-500/30 hover:[&::-webkit-scrollbar-thumb]:bg-teal-500/50'
          : '[&::-webkit-scrollbar-thumb]:bg-teal-300 hover:[&::-webkit-scrollbar-thumb]:bg-teal-400'
      case 'amber':
        return isDark
          ? '[&::-webkit-scrollbar-thumb]:bg-[#dfbf83]/30 hover:[&::-webkit-scrollbar-thumb]:bg-[#dfbf83]/50'
          : '[&::-webkit-scrollbar-thumb]:bg-[#dfbf83] hover:[&::-webkit-scrollbar-thumb]:bg-[#c59b58]'
      case 'blue':
        return isDark
          ? '[&::-webkit-scrollbar-thumb]:bg-blue-500/30 hover:[&::-webkit-scrollbar-thumb]:bg-blue-500/50'
          : '[&::-webkit-scrollbar-thumb]:bg-blue-300 hover:[&::-webkit-scrollbar-thumb]:bg-blue-400'
      case 'purple':
      default:
        return isDark
          ? '[&::-webkit-scrollbar-thumb]:bg-purple-500/30 hover:[&::-webkit-scrollbar-thumb]:bg-purple-500/50'
          : '[&::-webkit-scrollbar-thumb]:bg-purple-300 hover:[&::-webkit-scrollbar-thumb]:bg-purple-400'
    }
  }

  // ----------------------------------------------------
  // Fetch & Read Status Handlers
  // ----------------------------------------------------
  const fetchNotifications = async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/library/notifications`)
      if (!res.ok) return
      const data = await res.json()
      if (data.success && data.notifications) {
        setNotifications(data.notifications)

        // Check for unread notifications
        const lastReadId = localStorage.getItem('last_read_notification')
        if (data.notifications.length > 0) {
          const latestId = data.notifications[0].id
          if (latestId !== lastReadId) {
            setHasUnread(true)
            if (data.notifications[0].type === 'update') {
              window.dispatchEvent(new Event('zad_library_updated'))
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err)
    } finally {
      setTimeout(() => setIsRefreshing(false), 600)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  // Lock body scroll on small screens while notifications are open
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow
      if (typeof window !== 'undefined' && window.innerWidth < 640) {
        document.body.style.overflow = 'hidden'
      }
      return () => {
        document.body.style.overflow = prevOverflow
      }
    }
  }, [isOpen])

  const handleOpenDropdown = () => {
    const nextState = !isOpen
    setIsOpen(nextState)
    if (nextState && notifications.length > 0) {
      setHasUnread(false)
      localStorage.setItem('last_read_notification', notifications[0].id)
    }
  }

  const markAllAsRead = () => {
    const allIds = new Set(notifications.map(n => n.id))
    setReadIds(allIds)
    localStorage.setItem('zad_read_notifications', JSON.stringify(Array.from(allIds)))
    setHasUnread(false)
    if (notifications.length > 0) {
      localStorage.setItem('last_read_notification', notifications[0].id)
    }
  }

  const markSingleAsRead = (id: string) => {
    const next = new Set(readIds)
    next.add(id)
    setReadIds(next)
    localStorage.setItem('zad_read_notifications', JSON.stringify(Array.from(next)))
  }

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedCardIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const formatDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)

      if (diffMins < 2) return 'الآن'
      if (diffMins < 60) return `منذ ${diffMins} دقيقة`
      if (diffHours < 24) return `منذ ${diffHours} ساعة`

      return date.toLocaleDateString('ar-EG', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return isoStr
    }
  }

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'update') return n.type === 'update'
    if (activeFilter === 'unread') return !readIds.has(n.id)
    return true
  })

  // ----------------------------------------------------
  // Notification List Rendering
  // ----------------------------------------------------
  const renderNotificationContent = () => {
    if (filteredNotifications.length === 0) {
      return (
        <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border mb-3 shadow-inner ${getThemeIconBoxClass()}`}>
            <BellOff className="h-6 w-6 opacity-85" />
          </div>
          <h4 className={`text-sm font-bold ${isDark ? 'text-white/90' : 'text-stone-800'}`}>لا توجد إشعارات حالياً</h4>
          <p className={`text-xs mt-1 max-w-[240px] leading-relaxed ${isDark ? 'text-white/50' : 'text-stone-500'}`}>
            {activeFilter === 'unread'
              ? 'لقد اطلعت على جميع التحديثات بنجاح'
              : 'سيتم إشعارك فور إضافة كتب أو ميزات جديدة إلى المنصة'}
          </p>
        </div>
      )
    }

    return filteredNotifications.map((notif) => {
      const isRead = readIds.has(notif.id)
      const isLibraryUpdate = notif.type === 'update'
      const isExpanded = expandedCardIds.has(notif.id)
      const books = notif.payload || []
      const visibleBooks = isExpanded ? books : books.slice(0, 3)
      const hasMoreBooks = books.length > 3

      return (
        <div
          key={notif.id}
          onClick={() => markSingleAsRead(notif.id)}
          className={`group relative flex flex-col gap-2.5 rounded-2xl p-4 transition-all duration-200 cursor-pointer border ${getThemeCardClass(isRead)}`}
        >
          {/* Subtle Unread Dot Indicator */}
          {!isRead && (
            <span
              className={`absolute top-3.5 right-3.5 h-2 w-2 rounded-full ${getUnreadDotClass()}`}
              title="غير مقروء"
            />
          )}

          {/* Header row: Icon, Title, and Timestamp */}
          <div className="flex items-center justify-between gap-2.5 pl-1 pr-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-colors ${getThemeCardIconBoxClass(isLibraryUpdate)}`}
              >
                {isLibraryUpdate ? (
                  <BookOpen className="h-4 w-4" />
                ) : (
                  <Info className="h-4 w-4" />
                )}
              </div>
              <h4 className={`font-bold text-xs sm:text-sm truncate ${isDark ? 'text-white/95' : 'text-stone-900'}`}>
                {notif.title}
              </h4>
            </div>

            {/* Timestamp */}
            <span className={`flex items-center gap-1 text-[11px] font-medium shrink-0 ${isDark ? 'text-white/50' : 'text-stone-500'}`}>
              <Clock className="h-3 w-3 opacity-60" />
              {formatDate(notif.timestamp)}
            </span>
          </div>

          {/* Message Body */}
          {notif.message && (
            <p className={`text-xs leading-relaxed font-normal pr-10.5 ${isDark ? 'text-white/75' : 'text-stone-600'}`}>
              {notif.message}
            </p>
          )}

          {/* Books Tag Pill Section (Clean, Compact, No Emojis) */}
          {books.length > 0 && (
            <div className="mt-1 flex flex-col gap-2 pr-10.5">
              <div className={`flex items-center gap-1.5 text-[11px] font-semibold ${isDark ? 'text-white/60' : 'text-stone-600'}`}>
                <Layers className="h-3.5 w-3.5 opacity-70" />
                <span>الكتب المشمولة بالتحديث ({books.length}):</span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {visibleBooks.map((book, bIdx) => (
                  <div
                    key={bIdx}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${getBookTagClass()}`}
                  >
                    <BookOpen size={11} className="shrink-0 opacity-70" />
                    <span className="truncate max-w-[260px]">{book}</span>
                  </div>
                ))}

                {/* Expand / Collapse Button if > 3 books */}
                {hasMoreBooks && (
                  <button
                    type="button"
                    onClick={(e) => toggleExpand(notif.id, e)}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-bold transition-all active:scale-95 ${getExpandButtonClass()}`}
                  >
                    {isExpanded ? (
                      <>
                        <span>عرض أقل</span>
                        <ChevronUp size={11} />
                      </>
                    ) : (
                      <>
                        <span>+{books.length - 3} كتب أخرى</span>
                        <ChevronDown size={11} />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )
    })
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={handleOpenDropdown}
        aria-label="الإشعارات والتحديثات"
        className={
          variant === 'glass'
            ? `relative flex h-11 w-11 items-center justify-center rounded-2xl border backdrop-blur-[8px] transition-all duration-300 active:scale-90 ${
                isDark
                  ? 'border-white/15 bg-white/[0.06] hover:bg-white/[0.12] text-white shadow-[0_4px_20px_rgba(0,0,0,0.25)]'
                  : 'border-white/60 bg-white/[0.30] hover:bg-white/[0.40] text-stone-900 shadow-[0_4px_20px_rgba(0,0,0,0.06)]'
              } ${className}`
            : `relative flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-md transition-all active:scale-95 cursor-pointer group ${getBellButtonClass()} ${className}`
        }
        title="الإشعارات"
      >
        <Bell
          className={`h-4.5 w-4.5 transition-transform duration-300 group-hover:scale-105 ${isOpen ? 'scale-110' : ''}`}
          strokeWidth={2.2}
        />

        {/* Pulse Dot & Badge Counter */}
        {(hasUnread || unreadCount > 0) && (
          <span
            className={`absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white shadow-md ${getBellBadgeClass()}`}
          >
            <span className="relative z-10">{unreadCount > 0 ? unreadCount : ''}</span>
          </span>
        )}
      </button>

      {/* Notifications Glass Dropdown Panel & Glassy Blurred Backdrop */}
      {isOpen && (
        <>
          {/* Glassy Backdrop Overlay rendered into document.body to cover the full viewport and avoid containing-block trap */}
          {typeof document !== 'undefined' && createPortal(
            <div
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(false)
              }}
              className="fixed inset-0 w-screen h-screen bg-slate-950/40 dark:bg-black/60 backdrop-blur-md z-40 transition-all duration-300 animate-in fade-in cursor-pointer"
              aria-hidden="true"
              title="انقر للإغلاق"
            />,
            document.body
          )}

          <div
            dir="rtl"
            className={`fixed inset-x-3 top-18 sm:absolute sm:inset-x-auto sm:left-0 sm:top-full sm:mt-2.5 sm:w-[410px] max-w-[calc(100vw-1.5rem)] rounded-3xl border backdrop-blur-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 origin-top-left duration-200 max-h-[calc(100dvh-6rem)] flex flex-col ${getThemeGlassPanelClass()}`}
          >
          {/* Top Header */}
          <div className={`shrink-0 border-b px-4 sm:px-5 py-3.5 sm:py-4 transition-colors ${getThemeHeaderClass()}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl border shadow-inner ${getThemeIconBoxClass()}`}>
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className={`font-bold text-sm sm:text-base leading-snug ${isDark ? 'text-white' : 'text-stone-900'}`}>
                    الإشعارات والتحديثات
                  </h3>
                  <p className={`text-[10.5px] sm:text-[11px] font-normal ${isDark ? 'text-white/50' : 'text-stone-500'}`}>
                    آخر التطورات والكتب المضافة للمكتبة
                  </p>
                </div>
              </div>

              {/* Actions: Mark all as read, Refresh, Close on Mobile */}
              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg border transition-colors whitespace-nowrap ${
                      isDark
                        ? 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                    }`}
                    title="تحديد الكل كمقروء"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    <span>تحديد الكل</span>
                  </button>
                )}

                <button
                  onClick={fetchNotifications}
                  disabled={isRefreshing}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                    isDark ? 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                  title="تحديث قائمة الإشعارات"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors sm:hidden ${
                    isDark ? 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                  title="إغلاق"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className={`mt-3 flex items-center justify-between gap-1.5 pt-2.5 border-t ${isDark ? 'border-white/5' : 'border-stone-200/60'}`}>
              <div className={`flex items-center gap-1 p-1 rounded-xl border text-xs overflow-x-auto ${isDark ? 'bg-black/25 border-white/5' : 'bg-stone-100/70 border-stone-200'}`}>
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1 rounded-lg transition-all font-semibold whitespace-nowrap text-xs ${
                    activeFilter === 'all'
                      ? getThemeTabActiveClass()
                      : isDark ? 'text-white/60 hover:text-white' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  الكل ({notifications.length})
                </button>
                <button
                  onClick={() => setActiveFilter('update')}
                  className={`px-3 py-1 rounded-lg transition-all font-semibold whitespace-nowrap text-xs ${
                    activeFilter === 'update'
                      ? getThemeTabActiveClass()
                      : isDark ? 'text-white/60 hover:text-white' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  التحديثات
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={() => setActiveFilter('unread')}
                    className={`px-3 py-1 rounded-lg transition-all font-semibold whitespace-nowrap text-xs ${
                      activeFilter === 'unread'
                        ? getThemeTabActiveClass()
                        : isDark ? 'text-white/60 hover:text-white' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    غير مقروء ({unreadCount})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Notifications Scrollable Container */}
          <div
            className={`flex-1 max-h-[60vh] sm:max-h-96 overflow-y-auto p-3 space-y-2.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full ${getScrollbarThumbClass()}`}
          >
            {renderNotificationContent()}
          </div>
        </div>
        </>
      )}
    </div>
  )
}
