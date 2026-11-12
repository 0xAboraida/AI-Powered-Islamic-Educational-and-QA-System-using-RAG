import { useMemo } from 'react'
import { Search, SquarePen, MessageCircle, X, Loader2, History } from 'lucide-react'
import { GROUP_ORDER, type Conversation } from '../data'
import { useTheme, ACCENT_STYLES } from '../../../contexts/ThemeContext'

export function ChatHistoryDrawer({
  isOpen,
  onClose,
  dark,
  query,
  setQuery,
  conversations,
  isLoadingSessions,
  activeId,
  setActiveId,
  startNewConversation,
  loadHistory
}: {
  isOpen: boolean
  onClose: () => void
  dark: boolean
  query: string
  setQuery: (q: string) => void
  conversations: Conversation[]
  isLoadingSessions: boolean
  activeId: string | null
  setActiveId: (id: string) => void
  startNewConversation: () => void
  loadHistory: (id: string) => void
}) {
  const { accentColor = 'amber' } = useTheme()
  const currentAccent = ACCENT_STYLES[accentColor] || ACCENT_STYLES.amber

  const grouped = useMemo(() => {
    const filtered = conversations.filter((c) => c.title.includes(query.trim()))
    return GROUP_ORDER.map((g: string) => ({
      group: g,
      items: filtered.filter((c) => c.group === g),
    })).filter((g: any) => g.items.length > 0)
  }, [conversations, query])

  return (
    <>
      {/* History Drawer Overlay */}
      {isOpen && (
        <div
          className="absolute inset-0 z-[60] bg-black/45 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* History Drawer Panel */}
      <div
        className={`font-sans absolute top-0 bottom-0 right-0 z-[70] w-80 max-w-[88vw] md:w-96 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.3,0.9,0.4,1)] ${
          isOpen
            ? 'translate-x-0 opacity-100 visible'
            : 'translate-x-full pointer-events-none opacity-0 invisible shadow-none'
        } ${
          dark
            ? 'bg-[#0f131d]/95 backdrop-blur-2xl border-l border-white/10 text-white shadow-[0_20px_60px_rgba(0,0,0,0.7)]'
            : `bg-white/95 backdrop-blur-2xl border-l ${currentAccent.lightBorder} text-stone-900 shadow-2xl`
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${dark ? 'border-white/10' : 'border-stone-200/80'}`}>
          <div className="flex items-center gap-2.5">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              dark ? `${currentAccent.darkBgBadge} ${currentAccent.darkText}` : `${currentAccent.lightBgBadge} ${currentAccent.lightText}`
            }`}>
              <History size={18} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className={`font-sans text-base sm:text-lg font-bold leading-tight ${dark ? 'text-white' : 'text-stone-900'}`}>
                سجل المحادثات
              </h2>
              <p className={`text-[11px] font-medium ${dark ? 'text-white/50' : 'text-stone-500'}`}>
                {conversations.length} محادثة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق السجل"
            className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all cursor-pointer active:scale-95 ${
              dark
                ? 'bg-white/[0.08] border-white/15 hover:bg-white/15 text-white/85'
                : 'bg-stone-100 border-stone-200/90 hover:bg-stone-200/80 text-stone-700'
            }`}
          >
            <X size={18} strokeWidth={2.3} />
          </button>
        </div>

        {/* Search & New Chat Actions */}
        <div className="p-4 flex flex-col gap-3">
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${
            dark
              ? 'bg-white/[0.05] border-white/10 text-white focus-within:border-white/30 focus-within:bg-white/[0.08]'
              : 'bg-stone-100/80 border-stone-200/90 text-stone-900 focus-within:bg-white focus-within:border-stone-400'
          }`}>
            <Search size={17} className={dark ? 'text-white/45 shrink-0' : 'text-stone-400 shrink-0'} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="البحث في المحادثات..."
              className={`bg-transparent w-full outline-none text-sm font-sans ${
                dark ? 'text-white placeholder:text-white/40' : 'text-stone-900 placeholder:text-stone-400'
              }`}
            />
          </div>

          <button
            type="button"
            onClick={startNewConversation}
            className="brand-gradient flex w-full items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-sm font-bold text-white shadow-md transition-all hover:brightness-110 active:scale-[0.98] cursor-pointer"
          >
            <SquarePen size={17} strokeWidth={2.2} />
            <span>محادثة جديدة</span>
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-1 space-y-5 custom-scrollbar">
          {isLoadingSessions ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className={`animate-spin ${dark ? currentAccent.darkText : currentAccent.lightText}`} size={26} />
            </div>
          ) : grouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12 px-4 gap-2.5">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                dark ? 'bg-white/[0.05] text-white/40' : 'bg-stone-100 text-stone-400'
              }`}>
                <MessageCircle size={22} />
              </div>
              <p className={`text-sm font-medium ${dark ? 'text-white/55' : 'text-stone-500'}`}>
                {query.trim() ? 'لا توجد نتائج مطابقة للبحث' : 'لا توجد محادثات سابقة بعد'}
              </p>
            </div>
          ) : (
            grouped.map(({ group, items }: { group: string, items: Conversation[] }) => (
              <div key={group}>
                <h3 className={`text-xs mb-2.5 px-1 font-bold ${dark ? 'text-white/50' : 'text-stone-500'}`}>
                  {group}
                </h3>
                <div className="space-y-2">
                  {items.map((chat: Conversation) => {
                    const isActive = activeId === chat.id
                    return (
                      <button
                        key={chat.id}
                        type="button"
                        onClick={() => {
                          setActiveId(chat.id)
                          onClose()
                          if (chat.messages.length === 0) {
                            loadHistory(chat.id)
                          }
                        }}
                        className={`group w-full flex flex-col text-right p-3 rounded-xl border transition-all cursor-pointer ${
                          isActive
                            ? dark
                              ? `${currentAccent.darkBgBadge} ${currentAccent.darkBorderHover} shadow-sm`
                              : `${currentAccent.lightBgBadge} ${currentAccent.lightBorder} shadow-xs`
                            : dark
                              ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10'
                              : 'bg-white hover:bg-stone-50 border-stone-200/80 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg shrink-0 transition-colors ${
                            isActive
                              ? 'brand-gradient text-white shadow-xs'
                              : dark
                                ? `${currentAccent.darkBgBadge} ${currentAccent.darkText}`
                                : `${currentAccent.lightBgBadge} ${currentAccent.lightText}`
                          }`}>
                            <MessageCircle size={16} strokeWidth={2.2} />
                          </div>
                          <span className={`text-xs sm:text-sm font-semibold truncate flex-1 ${
                            isActive
                              ? dark
                                ? 'text-white'
                                : currentAccent.lightText
                              : dark
                                ? 'text-white/85'
                                : 'text-stone-800'
                          }`}>
                            {chat.title}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
