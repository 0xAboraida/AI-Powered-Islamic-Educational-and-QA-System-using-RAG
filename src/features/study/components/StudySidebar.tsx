import { useState, useEffect, memo } from 'react'
import { Folder, FileText, ChevronDown, ChevronLeft, Search, Hourglass, X, BookOpen, Loader2, Menu } from 'lucide-react'
import type { TreeNode } from '../../../contexts/StudyContext'
import whiteLogo from '../../../assets/images/WhiteLogo.png'
import darkLogo from '../../../assets/images/ZadDarkLogo.png'

const EMPTY_PATH: string[] = []

const TreeView = memo(function TreeView({
  node,
  depth = 0,
  activeChunkId,
  onChunkSelect,
  parentPath = EMPTY_PATH,
  defaultExpanded = false,
  isDark = true
}: {
  node: TreeNode;
  depth?: number;
  activeChunkId?: string | null;
  onChunkSelect?: (chunkId: string, title: string, fullPath: string) => void;
  parentPath?: string[];
  defaultExpanded?: boolean;
  isDark?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  useEffect(() => {
    setExpanded(defaultExpanded)
  }, [defaultExpanded])

  const hasChildren = node.children && node.children.length > 0
  const isActive = node.chunk_id && node.chunk_id === activeChunkId
  const currentPath = [...parentPath, node.title]

  const handleClick = () => {
    if (hasChildren) {
      setExpanded(!expanded)
    } else if (node.chunk_id && onChunkSelect) {
      onChunkSelect(node.chunk_id, node.title, parentPath.join(' ← '))
    }
  }

  return (
    <div className="select-none">
      <div
        className={`group flex cursor-pointer items-center gap-2 py-2 px-2 rounded-xl transition-all hover:-translate-x-1 ${isActive
            ? 'font-bold text-teal-500 bg-teal-500/10'
            : isDark
              ? 'text-white/70 hover:bg-white/5'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        style={{ paddingRight: `${depth * 1.5}rem` }}
        onClick={handleClick}
      >
        {hasChildren ? (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center opacity-70">
            {expanded ? <ChevronDown size={14} /> : <ChevronLeft size={14} />}
          </span>
        ) : (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center opacity-50">
            <FileText size={14} />
          </span>
        )}
        <span className={hasChildren ? 'font-semibold flex items-center gap-1.5' : 'text-[14px] flex items-center gap-1.5'}>
          {hasChildren && <Folder size={14} className="shrink-0 text-teal-500" />}{node.title}
          {node.is_new && <span className="shrink-0 mr-2 rounded bg-teal-500/20 px-1.5 py-0.5 text-[10px] text-teal-400">جديد</span>}
        </span>
      </div>
      {expanded && hasChildren && (
        <div className="flex flex-col">
          {node.children!.map((child, idx) => (
            <TreeView
              key={idx}
              node={child}
              depth={depth + 1}
              activeChunkId={activeChunkId}
              onChunkSelect={onChunkSelect}
              parentPath={currentPath}
              defaultExpanded={defaultExpanded}
              isDark={isDark}
            />
          ))}
        </div>
      )}
    </div>
  )
})

export function StudySidebar({
  isSidebarOpen,
  sidebarWidth,
  setIsSidebarOpen,
  searchQuery,
  setSearchQuery,
  deferredSearchQuery,
  treeLoading,
  filteredTreeData,
  currentChunkId,
  handleChunkSelect,
  startResizingSidebar,
  isDark = true
}: {
  isSidebarOpen: boolean
  sidebarWidth?: number
  setIsSidebarOpen: (v: boolean) => void
  searchQuery: string
  setSearchQuery: (v: string) => void
  deferredSearchQuery: string
  treeLoading: boolean
  filteredTreeData: TreeNode[]
  currentChunkId: string | null
  handleChunkSelect: (chunkId: string, title: string, fullPath: string) => void
  startResizingSidebar: (e: React.MouseEvent) => void
  isDark?: boolean
}) {
  return (
    <div
      style={{ width: sidebarWidth ? sidebarWidth : '100%' }}
      className={`flex h-full flex-col shrink-0 overflow-hidden transition-colors border-l ${isDark
          ? 'border-white/10 text-white bg-transparent'
          : 'border-slate-200 text-slate-800 bg-white/40 backdrop-blur-md shadow-[inset_1px_0_0_rgba(255,255,255,0.5)]'
        }`}
    >
      {/* Header Bar matching Chat/Mindmap/Quiz panels */}
      <div className={`flex items-center justify-between px-4 py-3 border-b backdrop-blur-md ${isDark ? 'border-white/10 bg-[#12041f]/70 text-white' : 'border-slate-200 bg-slate-50/90 text-slate-800'
        }`}>
        <div className="flex items-center gap-2 text-sm font-bold">
          <Menu size={18} className="text-teal-500 shrink-0 stroke-[2.2]" />
          <span>فهرس المحتوى</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(false)}
          className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700'
            }`}
          title="إغلاق الفهرس"
        >
          <X size={15} />
        </button>
      </div>

      {/* Search Box Container */}
      <div className={`p-4 border-b ${isDark ? 'border-white/5 bg-transparent' : 'border-teal-100 bg-gradient-to-b from-teal-50/50 to-transparent'}`}>
        <div className={`group flex items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 transition-all duration-300 shadow-sm ${isDark
            ? 'border-white/10 bg-white/5 text-white hover:border-white/20 hover:bg-white/10 focus-within:border-teal-400/70 focus-within:shadow-[0_0_15px_rgba(45,212,191,0.1)] focus-within:bg-[#12041f]/80'
            : 'border-teal-200 bg-white text-slate-900 hover:border-teal-300 hover:shadow-md focus-within:border-teal-400 focus-within:shadow-[0_4px_20px_rgba(45,212,191,0.15)] focus-within:bg-teal-50/30'
          }`}>
          <Search size={16} className={`transition-colors ${isDark ? 'text-white/40 group-focus-within:text-teal-400' : 'text-teal-400 group-focus-within:text-teal-600'}`} />
          <input
            type="text"
            placeholder="بحث في الفهرس..."
            className={`w-full bg-transparent text-[13px] font-medium outline-none transition-colors ${isDark ? 'text-white placeholder:text-white/30' : 'text-teal-900 placeholder:text-teal-700/40'
              }`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {treeLoading ? (
          <div className="flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700 h-full pb-20">
            <div className="mb-8 flex items-center justify-center relative w-16 h-16">
              {/* Outer fast spinning ring */}
              <div className={`absolute inset-0 rounded-full border-[3px] border-transparent animate-spin ${isDark ? 'border-t-teal-500 border-l-teal-500/30' : 'border-t-teal-600 border-l-teal-600/30'}`} style={{ animationDuration: '1s' }}></div>
              {/* Inner slow reverse spinning ring */}
              <div className={`absolute inset-2 rounded-full border-[3px] border-transparent animate-spin ${isDark ? 'border-b-teal-400 border-r-teal-400/30' : 'border-b-teal-500 border-r-teal-500/30'}`} style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
              {/* Center icon */}
              <BookOpen className={`w-5 h-5 animate-pulse ${isDark ? 'text-teal-400/80' : 'text-teal-600'}`} />
            </div>

            <h3 className={`text-sm font-semibold mb-3 tracking-wide animate-pulse ${isDark ? 'text-teal-100/70' : 'text-slate-600'}`}>
              جاري تجهيز الفهرس...
            </h3>

            <div className={`h-1 w-32 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
              <div className={`h-full w-full rounded-full animate-[shimmer_1.5s_infinite] origin-left ${isDark ? 'bg-gradient-to-r from-transparent via-teal-500/60 to-transparent' : 'bg-gradient-to-r from-transparent via-teal-500/60 to-transparent'}`} style={{ transform: 'translateX(-100%)' }}></div>
            </div>

            <style>{`
              @keyframes shimmer {
                100% { transform: translateX(100%); }
              }
            `}</style>
          </div>
        ) : filteredTreeData.length > 0 ? (
          filteredTreeData.map((node, idx) => (
            <TreeView
              key={idx}
              node={node}
              activeChunkId={currentChunkId}
              onChunkSelect={handleChunkSelect}
              defaultExpanded={deferredSearchQuery.trim().length > 0}
              isDark={isDark}
            />
          ))
        ) : searchQuery.trim() !== '' ? (
          <div className={`text-center ${isDark ? 'text-white/50' : 'text-slate-500'}`}>لا توجد نتائج للبحث تطابق "{searchQuery}"</div>
        ) : (
          <div className={`text-center ${isDark ? 'text-white/50' : 'text-slate-500'}`}>لا يوجد بيانات للفهرس. الرجاء بناء الشجرة من لوحة التحكم.</div>
        )}
      </div>
    </div>
  )
}
