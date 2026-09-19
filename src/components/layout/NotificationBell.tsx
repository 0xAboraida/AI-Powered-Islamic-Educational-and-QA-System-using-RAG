import { useState, useEffect, useRef } from 'react'
import { Bell, BookOpen, Info, CheckCheck, Sparkles, Clock, BellOff, RefreshCw, Layers } from 'lucide-react'
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

export default function NotificationBell() {
  const { isDark } = useTheme()
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
  const dropdownRef = useRef<HTMLDivElement>(null)

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
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  const renderNotificationContent = () => {
    if (filteredNotifications.length === 0) {
      return (
        <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mb-3 shadow-inner">
            <BellOff className="h-7 w-7 opacity-80" />
          </div>
          <h4 className="text-sm font-bold text-white/80">لا توجد إشعارات حالياً</h4>
          <p className="text-xs text-white/40 mt-1 max-w-[220px]">
            {activeFilter === 'unread'
              ? 'لقد قمت بقراءة جميع الإشعارات والتحديثات بنجاح 🎉'
              : 'سيتم إشعارك فور إضافة كتب أو ميزات جديدة إلى التطبيق'}
          </p>
        </div>
      )
    }

    return filteredNotifications.map((notif) => {
      const isRead = readIds.has(notif.id)
      const isLibraryUpdate = notif.type === 'update'

      return (
        <div
          key={notif.id}
          onClick={() => markSingleAsRead(notif.id)}
          className={`group relative flex flex-col gap-2 rounded-2xl p-3.5 transition-all duration-200 cursor-pointer border ${!isRead
              ? 'bg-gradient-to-l from-purple-500/15 via-purple-900/10 to-transparent border-purple-500/30 shadow-md shadow-purple-950/40'
              : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
            }`}
        >
          {/* Unread Accent Bar */}
          {!isRead && (
            <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.9)] animate-pulse" />
          )}

          {/* Card Header */}
          <div className="flex items-center justify-between gap-2 pl-4">
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${isLibraryUpdate
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'bg-purple-500/15 border-purple-500/30 text-purple-400'
                  }`}
              >
                {isLibraryUpdate ? (
                  <BookOpen className="h-4 w-4" />
                ) : (
                  <Info className="h-4 w-4" />
                )}
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-white/90 group-hover:text-purple-200 transition-colors">
                {notif.title}
              </h4>
            </div>

            {/* Timestamp */}
            <span className="flex items-center gap-1 text-[10px] text-white/40 font-medium shrink-0">
              <Clock className="h-3 w-3 opacity-60" />
              {formatDate(notif.timestamp)}
            </span>
          </div>

          {/* Message Body */}
          {notif.message && (
            <p className="text-[12px] text-white/70 leading-relaxed font-normal pr-10">
              {notif.message}
            </p>
          )}

          {/* Books Tag Pill Section */}
          {notif.payload && notif.payload.length > 0 && (
            <div className="mt-1 flex flex-col gap-1.5 pr-10">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-purple-300/80">
                <Layers className="h-3.5 w-3.5 text-purple-400" />
                <span>الكتب المشمولة بالتحديث:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {notif.payload.map((book, bIdx) => (
                  <div
                    key={bIdx}
                    className="rounded-xl bg-purple-500/15 border border-purple-500/25 px-2.5 py-1 text-[11px] text-purple-100 font-medium leading-normal shadow-sm transition-colors hover:bg-purple-500/25 break-words max-w-full"
                  >
                    📖 {book}
                  </div>
                ))}
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
        className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-all ${isDark
          ? 'bg-[#a855f7]/15 backdrop-blur-md border border-[#a855f7]/30 hover:bg-[#a855f7]/25 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] text-purple-100'
          : 'bg-white border border-purple-200 hover:bg-purple-50 text-purple-700 shadow-md'
          }`}
        title="الإشعارات"
      >
        <Bell size={18} strokeWidth={2.5} className={`transition-transform duration-300 ${isOpen ? 'scale-110' : ''} ${isDark ? 'text-purple-100' : 'text-purple-700'}`} />

        {/* Pulse Dot & Badge Counter */}
        {(hasUnread || unreadCount > 0) && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 px-1.5 text-[10px] font-bold text-white shadow-lg shadow-pink-500/40">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
            <span className="relative z-10">{unreadCount > 0 ? unreadCount : ''}</span>
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div
          dir="rtl"
          className="absolute left-0 mt-3 w-80 sm:w-96 rounded-3xl border border-purple-500/20 bg-[#0f041c]/95 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] z-50 overflow-hidden animate-in fade-in zoom-in-95 origin-top-left duration-200"
        >
          {/* Top Header */}
          <div className="border-b border-purple-500/15 bg-gradient-to-l from-purple-950/40 via-purple-900/20 to-transparent px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 shadow-inner">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base leading-snug">الإشعارات والتحديثات</h3>
                  <p className="text-[11px] text-white/50 font-normal">آخر التطورات والكتب المضافة للمكتبة</p>
                </div>
              </div>

              {/* Refresh Icon */}
              <button
                onClick={fetchNotifications}
                disabled={isRefreshing}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                title="تحديث قائمة الإشعارات"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-purple-400' : ''}`} />
              </button>
            </div>

            {/* Filter Tabs & Quick Action */}
            <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-white/5">
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5 text-xs">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all font-medium ${activeFilter === 'all'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-white/60 hover:text-white'
                    }`}
                >
                  الكل ({notifications.length})
                </button>
                <button
                  onClick={() => setActiveFilter('update')}
                  className={`px-2.5 py-1 rounded-lg transition-all font-medium ${activeFilter === 'update'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-white/60 hover:text-white'
                    }`}
                >
                  التحديثات
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={() => setActiveFilter('unread')}
                    className={`px-2.5 py-1 rounded-lg transition-all font-medium ${activeFilter === 'unread'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-white/60 hover:text-white'
                      }`}
                  >
                    غير مقروء
                  </button>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-[11px] font-semibold text-purple-300 hover:text-purple-200 transition-colors bg-purple-500/10 hover:bg-purple-500/20 px-2 py-1 rounded-lg border border-purple-500/20"
                  title="تحديد الكل كمقروء"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>تحديد كمقروء</span>
                </button>
              )}
            </div>
          </div>

          {/* Notifications Scrollable Container */}
          <div className="max-h-96 overflow-y-auto p-3 space-y-2.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-purple-500/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-purple-500/40">
            {renderNotificationContent()}
          </div>


        </div>
      )}
    </div>
  )
}

