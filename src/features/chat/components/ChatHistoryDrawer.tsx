

import { useMemo } from 'react'
import { Search, Plus, MessageCircle, X, Loader2 } from 'lucide-react'
import { GROUP_ORDER, type Conversation } from '../data'

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
          className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* History Drawer Panel */}
      <div
        className={`absolute top-0 bottom-0 right-0 z-50 w-80 md:w-96 flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.3,0.9,0.4,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full'
          } ${dark ? 'bg-[#1a0730]/80 backdrop-blur-xl border-l border-white/10' : 'bg-white/80 backdrop-blur-xl border-l border-primary/10 shadow-2xl'}`}
      >
        <div className={`flex items-center justify-between p-6 border-b ${dark ? 'border-white/10' : 'border-primary/10'}`}>
          <h2 className={`font-display text-2xl font-bold ${dark ? 'text-white' : 'text-primary'}`}>سجل المحادثات</h2>
          <button
            onClick={onClose}
            aria-label="إغلاق السجل"
            className={`flex h-11 w-11 items-center justify-center rounded-full text-lg transition-all ${dark
              ? 'bg-[#a855f7]/15 backdrop-blur-md border border-[#a855f7]/30 hover:bg-[#a855f7]/25 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] text-purple-100'
              : 'bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary'
              }`}
          >
            <X size={22} strokeWidth={2.5} />
          </button>
        </div>

        {/* Search & New Chat Actions */}
        <div className="p-4 flex flex-col gap-3">
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors focus-within:border-primary/50 ${dark ? 'bg-black/20 border-white/10 text-white' : 'bg-primary/5 border-primary/10 text-primary'}`}>
            <Search size={18} className="opacity-50" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="البحث في المحادثات..."
              className="bg-transparent w-full outline-none text-sm placeholder:opacity-50"
            />
          </div>
          <button
            type="button"
            onClick={startNewConversation}
            className="brand-gradient-blue flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-lg shadow-brand-blue/25 transition-transform hover:-translate-y-0.5"
          >
            <Plus size={18} />
            محادثة جديدة
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pt-1 space-y-6 custom-scrollbar">
          {isLoadingSessions ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className={`animate-spin ${dark ? 'text-white' : 'text-primary'}`} size={24} />
            </div>
          ) : grouped.length === 0 ? (
            <p className={`text-center text-sm py-10 ${dark ? 'text-white/50' : 'text-primary/50'}`}>لا توجد نتائج</p>
          ) : (
            grouped.map(({ group, items }: { group: string, items: Conversation[] }) => (
              <div key={group}>
                <h3 className={`text-xs mb-3 font-semibold ${dark ? 'text-white/40' : 'text-primary/50'}`}>{group}</h3>
                <div className="space-y-2">
                  {items.map((chat: Conversation) => (
                    <button
                      key={chat.id}
                      onClick={() => {
                        setActiveId(chat.id)
                        onClose()
                        if (chat.messages.length === 0) {
                          loadHistory(chat.id)
                        }
                      }}
                      className={`group w-full flex flex-col text-right p-3.5 rounded-2xl transition-all ${activeId === chat.id
                        ? (dark ? 'bg-white/10 border border-white/20' : 'bg-primary/10 border border-primary/20 shadow-sm')
                        : (dark ? 'bg-white/5 hover:bg-white/10 border border-white/5' : 'bg-white hover:bg-primary/5 border border-primary/10 shadow-sm')
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full transition-colors ${activeId === chat.id
                          ? (dark ? 'bg-white/20 text-white' : 'bg-primary text-white')
                          : (dark ? 'bg-brand-magenta/20 text-brand-magenta group-hover:bg-brand-magenta/30' : 'bg-primary/10 text-primary group-hover:bg-primary/20')
                          }`}>
                          <MessageCircle size={18} />
                        </div>
                        <span className={`font-semibold truncate flex-1 ${dark ? 'text-white/90' : 'text-brand-deep'}`}>
                          {chat.title}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
