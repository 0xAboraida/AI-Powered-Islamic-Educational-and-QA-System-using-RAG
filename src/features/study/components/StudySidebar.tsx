import { useState, useEffect, useRef, memo, useMemo } from 'react'
import {
  Folder, FolderOpen, FileText, ChevronDown, ChevronLeft, Search, Hourglass,
  X, BookOpen, Loader2, Menu, Book, SlidersHorizontal, Filter, RotateCcw,
  Check, Sparkles, User, Layers, Target, LocateIcon
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStudyContext, type TreeNode } from '../../../contexts/StudyContext'
import { findTurathBookInTree } from '../utils/turathMetaHelper'
import whiteLogo from '../../../assets/images/WhiteLogo.png'
import darkLogo from '../../../assets/images/ZadDarkLogo.png'

const EMPTY_PATH: string[] = []

export function isChunkMatch(node: TreeNode, activeChunkId?: string | null): boolean {
  if (!node || !activeChunkId || !node.chunk_id) return false
  if (node.chunk_id === activeChunkId) return true

  // Folders and books with children are containers, NEVER selectable leaf chunks
  if (node.is_book || (node.children && node.children.length > 0)) {
    return false
  }

  // If activeChunkId specifies an exact TOC item (e.g. _toc_X_next_Y),
  // it must ONLY match that exact chunk. Overlapping page spans between distinct chapters
  // must never cause multiple chapters to be highlighted!
  const activeHasToc = activeChunkId.includes('_toc_')
  const nodeHasToc = node.chunk_id.includes('_toc_')
  if (activeHasToc && nodeHasToc) {
    return false
  }

  // Fallback for page-based navigation (e.g. turath_996_pg_55_to_55 without TOC):
  if (activeChunkId.startsWith('turath_') && node.chunk_id.startsWith('turath_')) {
    const activeParts = activeChunkId.split('_')
    const nodeParts = node.chunk_id.split('_')
    if (activeParts[1] && nodeParts[1] && activeParts[1] === nodeParts[1]) {
      const activePage = parseInt(activeParts[3], 10)
      const nodeStart = parseInt(nodeParts[3], 10)
      const nodeEnd = parseInt(nodeParts[5], 10)
      if (!isNaN(activePage) && !isNaN(nodeStart) && !isNaN(nodeEnd)) {
        // Direct start match: the chapter that begins on this page
        if (nodeStart === activePage) return true
        // Chapter spanning across this page (strictly before boundary endPage where next chapter begins)
        if (activePage > nodeStart && activePage < nodeEnd) return true
        // Single page chapter
        if (nodeStart === nodeEnd && nodeStart === activePage) return true
      }
    }
  }
  return false
}

export type SearchScope = 'all' | 'books' | 'authors'

const SCOPE_LABELS: Record<SearchScope, string> = {
  all: 'الكل',
  books: 'الكتاب فقط',
  authors: 'المؤلف فقط'
}

function normalizeArabic(text: string): string {
  if (!text) return ''
  return text
    .trim()
    .toLowerCase()
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[\u064B-\u065F]/g, '') // remove tashkeel/harakat
}

function countBooksInNode(n: TreeNode): number {
  if (n.is_book) return 1
  if (!n.children || n.children.length === 0) return 0
  return n.children.reduce((acc, child) => acc + countBooksInNode(child), 0)
}

function filterTree(
  nodes: TreeNode[],
  query: string,
  scope: SearchScope,
  category: string,
  author: string
): TreeNode[] {
  let source = nodes

  // 1. Narrow down by Category if chosen
  if (category !== 'all') {
    source = source.filter(n => n.title === category)
  }

  const q = normalizeArabic(query)
  const hasQuery = q.length > 0
  const hasAuthorFilter = author !== 'all'

  // If no query and no author filter, return category-filtered source
  if (!hasQuery && !hasAuthorFilter) {
    return source
  }

  const filterNode = (n: TreeNode): TreeNode | null => {
    // If author filter is active, check if book matches
    if (hasAuthorFilter && n.is_book) {
      if ((n.author || '').trim() !== author) return null
    }

    // Match text query with Arabic normalization
    const matchTitle = normalizeArabic(n.title || '').includes(q)
    const matchAuthor = normalizeArabic(n.author || '').includes(q)

    let isTextMatch = false
    if (!hasQuery) {
      isTextMatch = true
    } else if (scope === 'all') {
      isTextMatch = matchTitle || matchAuthor
    } else if (scope === 'books') {
      isTextMatch = Boolean(n.is_book && matchTitle)
    } else if (scope === 'authors') {
      isTextMatch = Boolean(matchAuthor)
    }

    // If it's a book:
    if (n.is_book) {
      if (isTextMatch) {
        return { ...n, children: n.children || [] }
      }
      return null
    }

    // If it's a category/folder container:
    const filteredKids = (n.children || [])
      .map(child => filterNode(child))
      .filter((c): c is TreeNode => c !== null)

    if (filteredKids.length > 0) {
      return {
        ...n,
        children: filteredKids,
        _hasMatchedChild: true
      } as any
    }

    return null
  }

  return source
    .map(node => filterNode(node))
    .filter((n): n is TreeNode => n !== null)
}

const TreeView = memo(function TreeView({
  node,
  depth = 0,
  activeChunkId,
  activeChunkTitle,
  onChunkSelect,
  parentPath = EMPTY_PATH,
  searchQuery = '',
  isDark = true,
  onLoadBookTree,
  isInsideBook = false,
  isCustomFiltered = false,
  forceExpandedKeys
}: {
  node: TreeNode;
  depth?: number;
  activeChunkId?: string | null;
  activeChunkTitle?: string;
  onChunkSelect?: (chunkId: string, title: string, fullPath: string, node?: TreeNode) => void;
  parentPath?: string[];
  searchQuery?: string;
  isDark?: boolean;
  onLoadBookTree?: (node: TreeNode) => Promise<any>;
  isInsideBook?: boolean;
  isCustomFiltered?: boolean;
  forceExpandedKeys?: Set<string>;
}) {
  const isSearchActive = Boolean(searchQuery && searchQuery.trim().length > 0) || isCustomFiltered

  // Rule for automatic expansion on search:
  // - Top-level Category (depth === 0 or node.is_category): auto-expand so user can see matching books.
  // - Node with specifically matched descendant (_hasMatchedChild): auto-expand so matched item is visible.
  // - Books and chapters/folders inside books: stay collapsed so user can expand at their own pace!
  const shouldDefaultExpand = isSearchActive
    ? (depth === 0 || Boolean((node as any).is_category) ? true : Boolean((node as any)._hasMatchedChild))
    : false

  const nodePathKey = parentPath.length > 0 ? `${parentPath.join('///')}///${node.title}` : node.title
  const isForceExpanded = Boolean(forceExpandedKeys && (forceExpandedKeys.has(nodePathKey) || forceExpandedKeys.has(node.title)))

  // Check if any descendant of this container is currently active
  const hasActiveChild = useMemo(() => {
    if (!activeChunkId || !node.children || node.children.length === 0) return false
    const checkActive = (n: TreeNode): boolean => {
      if (activeChunkId) {
        if (isChunkMatch(n, activeChunkId)) return true
      } else if (
        activeChunkTitle &&
        !n.is_book &&
        (!n.children || n.children.length === 0) &&
        normalizeArabic(n.title) === normalizeArabic(activeChunkTitle)
      ) {
        return true
      }
      return Boolean(n.children && n.children.some(checkActive))
    }
    return node.children.some(checkActive)
  }, [node.children, activeChunkId, activeChunkTitle])

  const [expanded, setExpanded] = useState(shouldDefaultExpand || isForceExpanded || hasActiveChild)
  const [isLoadingBook, setIsLoadingBook] = useState(false)

  // Auto-expand folder when one of its children becomes active
  useEffect(() => {
    if (hasActiveChild) {
      setExpanded(true)
    }
  }, [hasActiveChild])

  // Synchronize when forced to expand via Locate / Reveal feature
  useEffect(() => {
    if (forceExpandedKeys && (forceExpandedKeys.has(nodePathKey) || forceExpandedKeys.has(node.title))) {
      if (node.is_book && !node.is_loaded && onLoadBookTree) {
        setIsLoadingBook(true)
        onLoadBookTree(node).finally(() => {
          setIsLoadingBook(false)
          setExpanded(true)
        })
      } else {
        setExpanded(true)
      }
    }
  }, [forceExpandedKeys, nodePathKey, node.title, node.is_book, node.is_loaded, onLoadBookTree])

  // Synchronize when the user changes or clears the search query,
  // but preserve user's manual click state when tree data reloads
  const prevQueryRef = useRef(searchQuery)
  useEffect(() => {
    if (prevQueryRef.current !== searchQuery) {
      prevQueryRef.current = searchQuery
      setExpanded(shouldDefaultExpand)
    }
  }, [searchQuery, shouldDefaultExpand])

  // Check if this node is an authentic readable chapter/lesson (not a book or main category container)
  const isSelectableChapter = Boolean(!node.is_book && !(node as any).is_category && node.chunk_id)
  const hasChildren = Boolean(node.is_book || (node.children && node.children.length > 0))
  const isTitleMatch = Boolean(
    !activeChunkId &&
    activeChunkTitle &&
    isSelectableChapter &&
    normalizeArabic(node.title) === normalizeArabic(activeChunkTitle)
  )
  const isActive = isSelectableChapter && (
    activeChunkId
      ? isChunkMatch(node, activeChunkId)
      : isTitleMatch
  )
  const currentPath = [...parentPath, node.title]
  const bookCount = !node.is_book && hasChildren ? countBooksInNode(node) : 0
  const isFramed = expanded && depth === 0 && !isSearchActive

  const chevronColorClass = node.is_book
    ? (expanded
      ? 'text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.35)]'
      : (isDark ? 'text-amber-400/80 hover:text-amber-300' : 'text-amber-600/80 hover:text-amber-700'))
    : isInsideBook
      ? (expanded
        ? (isDark ? 'text-indigo-300 drop-shadow-[0_0_6px_rgba(165,180,252,0.35)]' : 'text-indigo-600')
        : (isDark ? 'text-indigo-400/80 hover:text-indigo-300' : 'text-indigo-600/80 hover:text-indigo-700'))
      : (expanded
        ? (isDark ? 'text-teal-400' : 'text-emerald-700')
        : '')

  const handleChevronClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    // If it's a book that needs on-demand loading of its chapters
    if (node.is_book && !node.is_loaded) {
      setIsLoadingBook(true)
      try {
        if (onLoadBookTree) {
          await onLoadBookTree(node)
        }
        setExpanded(true)
      } finally {
        setIsLoadingBook(false)
      }
      return
    }

    setExpanded(prev => !prev)
  }

  const handleClick = async () => {
    // 1. If it's a book that needs on-demand loading of its chapters
    if (node.is_book && !node.is_loaded) {
      setIsLoadingBook(true)
      try {
        if (onLoadBookTree) {
          await onLoadBookTree(node)
        }
        setExpanded(true)
      } finally {
        setIsLoadingBook(false)
      }
      return
    }

    // 2. If it's a selectable chapter (even if it has sub-chapters / children)
    if (isSelectableChapter && onChunkSelect && node.chunk_id) {
      onChunkSelect(node.chunk_id, node.title, parentPath.join(' ← '), node)
      if (hasChildren && !expanded) {
        setExpanded(true)
      }
      return
    }

    if (hasChildren) {
      setExpanded(prev => !prev)
    } else if (node.chunk_id && onChunkSelect) {
      onChunkSelect(node.chunk_id, node.title, parentPath.join(' ← '), node)
    }
  }

  return (
    <div className="select-none">
      <motion.div
        id={isActive ? 'tree-active-chunk-item' : (node.chunk_id ? `tree-chunk-${node.chunk_id}` : undefined)}
        data-tree-active={isActive ? 'true' : undefined}
        whileTap={{ scale: 0.985 }}
        title={node.title}
        className={`group relative flex cursor-pointer items-center gap-2 px-2.5 transition-all duration-200 hover:-translate-x-1
          ${isFramed
            ? 'py-2 mb-0 sticky top-0 z-20 backdrop-blur-md rounded-xl border shadow-sm ' + (isDark ? 'bg-[#1a0733]/90 border-teal-500/30' : 'bg-white/95 border-emerald-600/25')
            : 'py-1 rounded-xl my-0.5'}
          ${isActive
            ? isDark
              ? 'font-bold text-teal-300 bg-teal-500/20 border border-teal-500/40 shadow-sm z-10'
              : 'font-bold text-emerald-950 bg-emerald-600/15 border border-emerald-600/35 shadow-xs z-10'
            : isDark
              ? (isFramed ? 'text-white font-bold' : (expanded ? 'text-white font-bold hover:bg-white/5' : 'text-white/70 hover:bg-white/5'))
              : (isFramed ? 'text-slate-900 font-bold' : (expanded ? 'text-slate-900 font-bold hover:bg-slate-100' : 'text-slate-700 hover:bg-slate-100'))
          }`}
        style={{ paddingRight: `${depth * 0.5 + (!hasChildren ? 1.5 : 0)}rem` }}
        onClick={handleClick}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={handleChevronClick}
            className="flex h-5 w-5 shrink-0 items-center justify-center opacity-70 hover:opacity-100 transition-opacity"
            title={expanded ? 'طيّ' : 'توسيع'}
          >
            {isLoadingBook ? (
              <Loader2 size={13} className={`animate-spin ${node.is_book ? 'text-amber-400' : isInsideBook ? 'text-indigo-400' : (isDark ? 'text-teal-400' : 'text-emerald-700')}`} />
            ) : (
              <ChevronLeft
                size={14}
                className={`transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${expanded ? '-rotate-90' : 'rotate-0'
                  } ${chevronColorClass}`}
              />
            )}
          </button>
        ) : (
          <span className={`flex h-5 w-5 shrink-0 items-center justify-center ${isActive ? (isDark ? 'text-teal-300 opacity-90' : 'text-emerald-700 opacity-90') : 'opacity-50'}`}>
            <FileText size={14} />
          </span>
        )}

        <span className={hasChildren ? 'font-semibold flex items-center gap-1.5 flex-1 min-w-0' : 'text-[14px] flex items-center gap-1.5 flex-1 min-w-0'}>
          {node.is_book ? (
            <BookOpen
              size={14}
              className={`shrink-0 transition-all duration-300 ${expanded ? 'text-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.35)]' : 'text-amber-400/80'
                }`}
            />
          ) : hasChildren ? (
            isInsideBook ? (
              <Book
                size={14}
                className={`shrink-0 transition-all duration-300 ${expanded ? 'text-indigo-300 scale-110' : 'text-indigo-400/90'
                  }`}
              />
            ) : expanded ? (
              <FolderOpen size={14} className={`shrink-0 transition-all ${isDark ? 'text-teal-400 scale-105 drop-shadow-[0_0_8px_rgba(45,212,191,0.3)]' : 'text-emerald-700 scale-105'}`} />
            ) : (
              <Folder size={14} className={`shrink-0 transition-all ${isDark ? 'text-teal-500' : 'text-emerald-600/80'}`} />
            )
          ) : null}
          <span className="truncate">{node.title}</span>
          {node.is_new && <span className={`shrink-0 mr-1.5 rounded px-1.5 py-0.5 text-[10px] ${isDark ? 'bg-teal-500/20 text-teal-400' : 'bg-emerald-100 text-emerald-800'}`}>جديد</span>}
          {bookCount > 0 && (
            <span
              className={`shrink-0 mr-auto text-[11px] font-bold px-2 py-0.5 rounded-full transition-all duration-300 ${isDark
                ? isFramed
                  ? 'bg-teal-500/25 text-teal-200 border border-teal-500/40 shadow-[0_0_10px_rgba(45,212,191,0.2)]'
                  : 'bg-teal-500/15 text-teal-300 border border-teal-500/25 group-hover:border-teal-500/40'
                : isFramed
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                  : 'bg-slate-100 text-slate-700 border border-slate-200 group-hover:border-emerald-200 group-hover:text-emerald-800'
                }`}
            >
              {bookCount} كتاب
            </span>
          )}
          {node.is_book && typeof node.children_count === 'number' && !expanded && (
            <span className={`shrink-0 mr-auto text-[10px] font-normal px-2 py-0.5 rounded-full transition-opacity ${isDark ? 'bg-white/5 text-white/50 border border-white/5' : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}>
              {node.children_count} درس
            </span>
          )}
        </span>
      </motion.div>

      <AnimatePresence initial={false}>
        {expanded && hasChildren && node.children && node.children.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
              opacity: { duration: 0.22, ease: 'easeOut' }
            }}
            className="flex flex-col space-y-0.5 py-0.5 overflow-hidden"
          >
            {node.children.map((child, idx) => (
              <TreeView
                key={child.chunk_id || `${child.title}_${idx}`}
                node={child}
                depth={depth + 1}
                activeChunkId={activeChunkId}
                activeChunkTitle={activeChunkTitle}
                onChunkSelect={onChunkSelect}
                parentPath={currentPath}
                searchQuery={searchQuery}
                isDark={isDark}
                onLoadBookTree={onLoadBookTree}
                isInsideBook={isInsideBook || Boolean(node.is_book)}
                isCustomFiltered={isCustomFiltered}
                forceExpandedKeys={forceExpandedKeys}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

interface SearchableSelectOption {
  value: string
  label: string
  count?: number
}

function SearchableSelect({
  value,
  onChange,
  options,
  allLabel,
  searchPlaceholder,
  icon: Icon,
  isDark = true
}: {
  value: string
  onChange: (val: string) => void
  options: SearchableSelectOption[]
  allLabel: string
  searchPlaceholder: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  isDark?: boolean
  accentColor?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedOption = useMemo(() => options.find(o => o.value === value), [options, value])
  const isCustomSelected = value !== 'all' && Boolean(selectedOption)

  // Sync displayed text with selected value when dropdown is closed or value changes
  useEffect(() => {
    if (!isOpen) {
      setInputValue(isCustomSelected ? selectedOption?.label || '' : '')
    }
  }, [value, isCustomSelected, selectedOption, isOpen])

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setInputValue(isCustomSelected ? selectedOption?.label || '' : '')
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, isCustomSelected, selectedOption])

  // Filter options based on input value when open and typing
  const filteredOptions = useMemo(() => {
    if (!isOpen || !inputValue.trim()) return options
    const normalizedQ = normalizeArabic(inputValue)
    return options.filter(opt => normalizeArabic(opt.label).includes(normalizedQ))
  }, [options, inputValue, isOpen])

  const handleSelect = (val: string) => {
    onChange(val)
    setIsOpen(false)
    if (val === 'all') {
      setInputValue('')
    } else {
      const opt = options.find(o => o.value === val)
      setInputValue(opt?.label || '')
    }
    inputRef.current?.blur()
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('all')
    setInputValue('')
    inputRef.current?.focus()
    setIsOpen(true)
  }

  const handleFocus = () => {
    setIsOpen(true)
    inputRef.current?.select()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[0].value)
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setInputValue(isCustomSelected ? selectedOption?.label || '' : '')
      inputRef.current?.blur()
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* The Search Bar Box itself (Direct Combobox Input) */}
      <div
        onClick={() => {
          inputRef.current?.focus()
          setIsOpen(true)
        }}
        className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl border text-xs transition-all duration-200 cursor-text ${isOpen
          ? isDark
            ? 'border-teal-400/80 bg-[#120524] ring-1 ring-teal-400/30 shadow-[0_0_12px_rgba(45,212,191,0.15)]'
            : 'border-teal-400 bg-white ring-1 ring-teal-400/40 shadow-sm'
          : isDark
            ? isCustomSelected
              ? 'border-teal-500/40 bg-teal-500/10 text-white'
              : 'border-white/10 bg-[#180933]/70 hover:border-white/20 text-white'
            : isCustomSelected
              ? 'border-emerald-300 bg-emerald-50/70 text-emerald-900'
              : 'border-slate-200 bg-slate-50 hover:border-slate-300 text-slate-800'
          }`}
      >
        {/* Right side: Icon badge (Unified cohesive styling) */}
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors ml-2 pointer-events-none ${isDark
          ? isCustomSelected ? 'bg-teal-500/20 text-teal-300' : 'bg-white/5 text-white/60'
          : isCustomSelected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
          }`}>
          <Icon size={13} />
        </span>

        {/* Center: The Search Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            if (!isOpen) setIsOpen(true)
          }}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={allLabel}
          className={`w-full bg-transparent text-xs font-medium outline-none transition-colors ${isDark
            ? 'text-white placeholder:text-white/40'
            : 'text-slate-900 placeholder:text-slate-400'
            }`}
        />

        {/* Left side: Book count badge + Clear button + Chevron */}
        <div className="flex items-center gap-1.5 shrink-0 mr-1">
          {!isOpen && isCustomSelected && typeof selectedOption?.count === 'number' && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 pointer-events-none ${isDark ? 'bg-teal-500/25 text-teal-300 border border-teal-500/30' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}>
              {selectedOption.count} كتاب
            </span>
          )}

          {(isCustomSelected || (isOpen && inputValue)) && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
              title="إلغاء التحديد"
            >
              <X size={12} />
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(prev => !prev)
              if (!isOpen) inputRef.current?.focus()
            }}
            className="p-0.5 text-white/40 hover:text-white transition-colors"
          >
            <ChevronDown
              size={13}
              className={`transition-transform duration-200 ${isOpen ? (isDark ? 'rotate-180 text-teal-400' : 'rotate-180 text-emerald-700') : 'opacity-60'}`}
            />
          </button>
        </div>
      </div>

      {/* Dropdown Menu (Options list ONLY - NO duplicate search input!) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute top-full right-0 left-0 mt-1.5 z-[60] rounded-xl border p-1.5 shadow-2xl backdrop-blur-xl ${isDark
              ? 'bg-[#180933]/98 border-teal-500/30 text-white shadow-[0_16px_36px_rgba(0,0,0,0.9)]'
              : 'bg-white border-slate-200 text-slate-800 shadow-2xl'
              }`}
          >
            <div className="max-h-48 overflow-y-auto space-y-0.5 pr-0.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-teal-500/30">
              {/* Option 'all' - only displayed when no search query is typed */}
              {(!inputValue.trim() || normalizeArabic(allLabel).includes(normalizeArabic(inputValue))) && (
                <button
                  type="button"
                  onClick={() => handleSelect('all')}
                  className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-right ${value === 'all'
                    ? isDark
                      ? 'bg-teal-500/20 text-teal-300 font-bold'
                      : 'bg-emerald-50 text-emerald-900 font-bold'
                    : isDark
                      ? 'hover:bg-white/5 text-white/80'
                      : 'hover:bg-slate-100 text-slate-700'
                    }`}
                >
                  <span>{allLabel}</span>
                  {value === 'all' && <Check size={12} className={isDark ? "text-teal-400 shrink-0" : "text-emerald-700 shrink-0"} />}
                </button>
              )}

              {/* Filtered items */}
              {filteredOptions.map((opt) => {
                const isSelected = value === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-right ${isSelected
                      ? isDark
                        ? 'bg-teal-500/20 text-teal-300 font-bold'
                        : 'bg-emerald-50 text-emerald-900 font-bold'
                      : isDark
                        ? 'hover:bg-white/5 text-white/80'
                        : 'hover:bg-slate-100 text-slate-700'
                      }`}
                  >
                    <span className="truncate flex-1">{opt.label}</span>
                    <div className="flex items-center gap-1.5 shrink-0 mr-2">
                      {typeof opt.count === 'number' && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${isDark ? 'bg-white/10 text-white/60' : 'bg-slate-100 text-slate-600'
                          }`}>
                          {opt.count}
                        </span>
                      )}
                      {isSelected && <Check size={12} className="text-teal-400" />}
                    </div>
                  </button>
                )
              })}

              {filteredOptions.length === 0 && (
                <div className="py-4 text-center text-xs opacity-50">
                  لا توجد نتائج مطابقة لـ «{inputValue}»
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Recursive helper to find any book and its full ancestor path from root down to the book
function findBookAndAncestorPath(
  nodes: TreeNode[],
  matcher: (n: TreeNode) => boolean,
  path: TreeNode[] = []
): { book: TreeNode; path: TreeNode[] } | null {
  for (const node of nodes) {
    const nextPath = [...path, node]
    if (matcher(node)) {
      return { book: node, path: nextPath }
    }
    if (node.children && node.children.length > 0) {
      const found = findBookAndAncestorPath(node.children, matcher, nextPath)
      if (found) return found
    }
  }
  return null
}

// Recursive helper to find the target chunk and all intermediate chapters inside book's children
function findChunkPathInChapters(
  nodes: TreeNode[],
  targetChunkId: string,
  targetTitle?: string,
  path: TreeNode[] = []
): TreeNode[] | null {
  for (const node of nodes) {
    const nextPath = [...path, node]
    // Check children first so we reach the deepest leaf chunk match before parent containers
    if (node.children && node.children.length > 0) {
      const found = findChunkPathInChapters(node.children, targetChunkId, targetTitle, nextPath)
      if (found) return found
    }
    if (isChunkMatch(node, targetChunkId)) {
      return nextPath
    }
    if (
      targetTitle &&
      (!node.children || node.children.length === 0) &&
      normalizeArabic(node.title) === normalizeArabic(targetTitle)
    ) {
      return nextPath
    }
  }
  return null
}

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
  isDark = true,
  onLoadBookTree,
  librarySource = 'mongo'
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
  handleChunkSelect: (chunkId: string, title: string, fullPath: string, node?: TreeNode) => void
  startResizingSidebar: (e: React.MouseEvent) => void
  isDark?: boolean
  onLoadBookTree?: (node: TreeNode) => Promise<any>
  librarySource?: 'mongo' | 'turath'
}) {
  const { treeData: baseTreeData, chunkMeta, chunkTitle } = useStudyContext()
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [searchScope, setSearchScope] = useState<SearchScope>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all')
  const [isLocating, setIsLocating] = useState(false)
  const [forceExpandedKeys, setForceExpandedKeys] = useState<Set<string>>(new Set())
  const filterDropdownRef = useRef<HTMLDivElement>(null)
  const mainSearchInputRef = useRef<HTMLInputElement>(null)

  // Locate the current active lesson in the tree, expand parents, scroll to it, and pulse
  const handleLocateCurrentLesson = async () => {
    if (!currentChunkId) return
    setIsLocating(true)

    // 1. Reset any search / filters if they would hide the item from view
    if (hasActiveFilters || searchQuery.trim()) {
      setSearchQuery('')
      handleResetFilters()
    }

    try {
      const tree = (baseTreeData && baseTreeData.length > 0) ? baseTreeData : filteredTreeData
      const isTurath = currentChunkId.startsWith('turath_')

      let bookMatchResult: { book: TreeNode; path: TreeNode[] } | null = null

      if (isTurath) {
        const parts = currentChunkId.split('_')
        const turathId = parseInt(parts[1], 10)
        bookMatchResult = findBookAndAncestorPath(tree, n =>
          Boolean(n.is_book && (n.turath_id === turathId || (n as any).id === turathId))
        )
      }

      if (!bookMatchResult && chunkMeta?.book_title) {
        const targetNorm = normalizeArabic(chunkMeta.book_title)
        bookMatchResult = findBookAndAncestorPath(tree, n => {
          if (!n.is_book) return false
          const titleNorm = normalizeArabic(n.title)
          return titleNorm === targetNorm || titleNorm.includes(targetNorm) || targetNorm.includes(titleNorm)
        })
      }

      if (!bookMatchResult) {
        const hasMatchingChunk = (nodes?: TreeNode[]): boolean => {
          if (!nodes) return false
          return nodes.some(n => isChunkMatch(n, currentChunkId) || hasMatchingChunk(n.children))
        }
        bookMatchResult = findBookAndAncestorPath(tree, n => {
          return Boolean(n.is_book && hasMatchingChunk(n.children))
        })
      }

      if (!bookMatchResult) {
        console.warn('Could not find book for chunk:', currentChunkId)
        setIsLocating(false)
        return
      }

      const bookNode = bookMatchResult.book
      let bookChapters: TreeNode[] = bookNode.children || []

      // If book chapters are not loaded yet, load them!
      if ((!bookChapters || bookChapters.length === 0 || !bookNode.is_loaded) && onLoadBookTree) {
        const loaded = await onLoadBookTree(bookNode)
        if (Array.isArray(loaded) && loaded.length > 0) {
          bookChapters = loaded
          bookNode.children = loaded
          bookNode.is_loaded = true
        } else if (bookNode.children && bookNode.children.length > 0) {
          bookChapters = bookNode.children
          bookNode.is_loaded = true
        }
      }

      // Find the lesson chunk path inside the chapters
      const chunkPath = findChunkPathInChapters(bookChapters, currentChunkId, chunkTitle)

      // All ancestors from root category down to the parent of the lesson
      const intermediateChapters = chunkPath && chunkPath.length > 1 ? chunkPath.slice(0, -1) : []
      const fullChain = [...bookMatchResult.path, ...intermediateChapters]

      const keysToExpand = new Set<string>()
      const pathSegments: string[] = []

      for (const node of fullChain) {
        pathSegments.push(node.title)
        keysToExpand.add(pathSegments.join('///'))
        keysToExpand.add(node.title)
      }

      setForceExpandedKeys(prev => {
        const next = new Set(prev)
        keysToExpand.forEach(k => next.add(k))
        return next
      })

      // Wait for DOM element to render and animate, then smooth scroll and pulse
      let attempts = 0
      const maxAttempts = 35
      const interval = setInterval(() => {
        attempts++
        const targetEl =
          document.getElementById('tree-active-chunk-item') ||
          (currentChunkId ? document.getElementById(`tree-chunk-${currentChunkId}`) : null)

        if (targetEl) {
          clearInterval(interval)
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
          targetEl.classList.remove('locate-glow-pulse')
          void targetEl.offsetWidth
          targetEl.classList.add('locate-glow-pulse')
          setTimeout(() => {
            targetEl.classList.remove('locate-glow-pulse')
            setIsLocating(false)
          }, 3200)
        } else if (attempts >= maxAttempts) {
          clearInterval(interval)
          setIsLocating(false)
        }
      }, 100)

    } catch (err) {
      console.error('Error locating current lesson in tree:', err)
      setIsLocating(false)
    }
  }

  // Auto-locate active lesson once on initial load / refresh
  const initialLocateDoneRef = useRef(false)
  useEffect(() => {
    if (!initialLocateDoneRef.current && currentChunkId && baseTreeData && baseTreeData.length > 0 && isSidebarOpen) {
      initialLocateDoneRef.current = true
      const timer = setTimeout(() => {
        handleLocateCurrentLesson()
      }, 350)
      return () => clearTimeout(timer)
    }
  }, [currentChunkId, baseTreeData, isSidebarOpen])

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFilterOpen(false)
      }
    }
    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFilterOpen])

  // Get list of available categories
  const categoriesList = useMemo(() => {
    const nodes = (baseTreeData && baseTreeData.length > 0) ? baseTreeData : filteredTreeData
    return nodes
      .filter(n => !n.is_book)
      .map(n => ({
        title: n.title,
        count: countBooksInNode(n)
      }))
      .filter(n => Boolean(n.title))
  }, [baseTreeData, filteredTreeData])

  // Get list of available authors (scoped to selected category if specified)
  const authorsList = useMemo(() => {
    const nodes = (baseTreeData && baseTreeData.length > 0) ? baseTreeData : filteredTreeData
    const relevantNodes = selectedCategory !== 'all'
      ? nodes.filter(n => n.title === selectedCategory)
      : nodes
    const authors = new Set<string>()
    const extract = (list: TreeNode[]) => {
      for (const item of list) {
        if (item.author && item.author.trim()) {
          authors.add(item.author.trim())
        }
        if (item.children && item.children.length > 0) {
          extract(item.children)
        }
      }
    }
    extract(relevantNodes)
    return Array.from(authors).sort((a, b) => a.localeCompare(b, 'ar'))
  }, [baseTreeData, filteredTreeData, selectedCategory])

  // If selected author is not in the newly selected category's authors, reset to 'all'
  useEffect(() => {
    if (selectedAuthor !== 'all' && authorsList.length > 0 && !authorsList.includes(selectedAuthor)) {
      setSelectedAuthor('all')
    }
  }, [selectedCategory, authorsList, selectedAuthor])

  const categoryOptions = useMemo<SearchableSelectOption[]>(() => {
    return categoriesList.map(cat => ({
      value: cat.title,
      label: cat.title,
      count: cat.count
    }))
  }, [categoriesList])

  const authorOptions = useMemo<SearchableSelectOption[]>(() => {
    return authorsList.map(auth => ({
      value: auth,
      label: auth
    }))
  }, [authorsList])

  const activeFiltersCount = (searchScope !== 'all' ? 1 : 0) + (selectedCategory !== 'all' ? 1 : 0) + (selectedAuthor !== 'all' ? 1 : 0)
  const hasActiveFilters = activeFiltersCount > 0

  const handleResetFilters = () => {
    setSearchScope('all')
    setSelectedCategory('all')
    setSelectedAuthor('all')
  }

  // Compute final filtered data
  const effectiveTreeData = useMemo(() => {
    if (!hasActiveFilters && !searchQuery.trim()) {
      return filteredTreeData
    }
    const source = (baseTreeData && baseTreeData.length > 0) ? baseTreeData : filteredTreeData
    return filterTree(source, deferredSearchQuery, searchScope, selectedCategory, selectedAuthor)
  }, [baseTreeData, filteredTreeData, deferredSearchQuery, searchQuery, searchScope, selectedCategory, selectedAuthor, hasActiveFilters])

  return (
    <div
      style={{ width: sidebarWidth ? sidebarWidth : '100%' }}
      className={`flex h-full flex-col shrink-0 overflow-hidden transition-colors border-l ${isDark
        ? 'border-white/10 text-white bg-white/[0.03] backdrop-blur-xl shadow-2xl'
        : 'border-slate-200 text-slate-800 bg-white/40 backdrop-blur-md shadow-[inset_1px_0_0_rgba(255,255,255,0.5)]'
        }`}
    >
      {/* Header Bar matching Chat/Mindmap/Quiz panels */}
      <div className={`flex items-center justify-between px-4 py-3 border-b backdrop-blur-md ${isDark ? 'border-white/10 bg-[#12041f]/70 text-white' : 'border-slate-200 bg-slate-50/90 text-slate-800'
        }`}>
        <div className="flex items-center gap-2 text-sm font-bold">
          <Menu size={18} className={`shrink-0 stroke-[2.2] ${isDark ? 'text-teal-400' : 'text-emerald-700'}`} />
          <span>فهرس المحتوى</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* زر تحديد موقع الدرس الحالي في الشجرة */}
          {currentChunkId && (
            <button
              type="button"
              onClick={handleLocateCurrentLesson}
              disabled={isLocating}
              className={`group/locate flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${isDark
                ? 'bg-teal-500/15 hover:bg-teal-500/25 border-teal-500/30 text-teal-300 shadow-[0_0_12px_rgba(45,212,191,0.15)] active:scale-95'
                : 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200 text-emerald-800 shadow-xs active:scale-95'
                } ${isLocating ? 'opacity-80 cursor-wait' : ''}`}
              title="تحديد موقع الدرس الحالي في الفهرس وتتبعه"
            >
              {isLocating ? (
                <Loader2 size={13} className={`animate-spin ${isDark ? 'text-teal-400' : 'text-emerald-700'}`} />
              ) : (
                <LocateIcon size={13} className={`stroke-[2.5] group-hover/locate:rotate-45 transition-transform duration-300 ${isDark ? 'text-teal-400' : 'text-emerald-700'}`} />
              )}
              <span className="text-[11px] whitespace-nowrap">موقع الدرس الحالي</span>
            </button>
          )}

          <button
            onClick={() => setIsSidebarOpen(false)}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700'
              }`}
            title="إغلاق الفهرس"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Search Box Container with Integrated Filter */}
      <div className={`p-4 border-b relative ${isDark ? 'border-white/5 bg-transparent' : 'border-slate-200/80 bg-slate-50/50'}`}>
        <div className={`group relative flex items-center gap-2 rounded-2xl border px-3 py-2 transition-all duration-300 shadow-xs ${isDark
          ? 'border-white/10 bg-white/5 text-white hover:border-white/20 hover:bg-white/10 focus-within:border-teal-400/70 focus-within:shadow-[0_0_15px_rgba(45,212,191,0.1)] focus-within:bg-[#12041f]/80'
          : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/10'
          }`}>
          <Search size={16} className={`transition-colors shrink-0 ${isDark ? 'text-white/40 group-focus-within:text-teal-400' : 'text-slate-400 group-focus-within:text-emerald-700'}`} />
          <input
            ref={mainSearchInputRef}
            type="text"
            placeholder={
              selectedAuthor !== 'all'
                ? `ابحث في مؤلفات "${selectedAuthor}"...`
                : selectedCategory !== 'all'
                  ? `ابحث داخل قسم "${selectedCategory}"...`
                  : searchScope === 'books'
                    ? "ابحث باسم الكتاب فقط..."
                    : searchScope === 'authors'
                      ? "ابحث باسم المؤلف فقط..."
                      : librarySource === 'turath'
                        ? "ابحث في 8,589 كتاب أو مؤلف..."
                        : "ابحث باسم الكتاب أو المؤلف..."
            }
            className={`w-full bg-transparent text-[13px] font-medium outline-none transition-colors ${isDark ? 'text-white placeholder:text-white/30' : 'text-slate-900 placeholder:text-slate-400'
              }`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <AnimatePresence>
            {searchQuery && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => setSearchQuery('')}
                className={`p-1 rounded-full transition-colors shrink-0 ${isDark ? 'text-white/50 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                  }`}
                title="مسح البحث"
              >
                <X size={14} />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Integrated Filter Button */}
          <div className="relative shrink-0 flex items-center pr-1 border-r border-slate-200 dark:border-white/10 mr-0.5">
            <button
              onClick={() => setIsFilterOpen(prev => !prev)}
              className={`relative flex items-center justify-center h-7 px-2 rounded-xl transition-all gap-1 text-[11px] font-bold ${hasActiveFilters || isFilterOpen
                ? isDark
                  ? 'bg-teal-500/25 text-teal-300 border border-teal-500/50 shadow-[0_0_10px_rgba(45,212,191,0.25)]'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs'
                : isDark
                  ? 'text-white/50 hover:text-white hover:bg-white/10'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
              title="تخصيص الفلترة"
            >
              <SlidersHorizontal size={14} className={hasActiveFilters || isFilterOpen ? (isDark ? 'text-teal-400' : 'text-emerald-700') : ''} />
              {hasActiveFilters && (
                <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-black ${isDark ? 'bg-teal-400 text-slate-950' : 'bg-emerald-700 text-white'}`}>
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filter Dropdown Popover */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              ref={filterDropdownRef}
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={`absolute top-full right-4 left-4 z-50 rounded-2xl border p-4 shadow-2xl backdrop-blur-2xl ${isDark
                ? 'bg-[#15072c]/95 border-teal-500/30 text-white shadow-[0_16px_40px_rgba(0,0,0,0.85)]'
                : 'bg-white/98 border-slate-200 text-slate-800 shadow-xl'
                }`}
            >
              {/* Header: Single unified row without redundant duplicate titles */}
              <div className="flex items-center justify-between pb-2.5 border-b border-white/10 dark:border-white/10 mb-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-white/90">
                  <SlidersHorizontal size={13} className={isDark ? "text-teal-400" : "text-emerald-700"} />
                  <span>حصر نطاق البحث:</span>
                </div>
                <div className="flex items-center gap-2">
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className={`flex items-center gap-1 text-[11px] font-semibold transition-colors ${isDark ? 'text-teal-400/90 hover:text-teal-300' : 'text-emerald-700 hover:text-emerald-800'}`}
                    >
                      <RotateCcw size={11} />
                      <span>إعادة تعيين</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen(false)}
                    className={`p-1 rounded-lg transition-colors ${isDark ? 'text-white/40 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                    title="إغلاق النافذة"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Direct Fields: Category & Author */}
              <div className="space-y-2 mb-3.5">
                <SearchableSelect
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  options={categoryOptions}
                  allLabel="جميع الأقسام"
                  searchPlaceholder="اكتب اسم القسم للبحث السريع..."
                  icon={Layers}
                  isDark={isDark}
                />
                <SearchableSelect
                  value={selectedAuthor}
                  onChange={setSelectedAuthor}
                  options={authorOptions}
                  allLabel="جميع المؤلفين"
                  searchPlaceholder="اكتب اسم المؤلف للبحث السريع..."
                  icon={User}
                  isDark={isDark}
                />
              </div>

              {/* نطاق البحث بالاسم */}
              <div>
                <label className={`block text-[11px] font-semibold mb-2 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                  البحث بالاسم في:
                </label>
                <div className={`p-1 rounded-xl border flex items-center gap-1 ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
                  }`}>
                  {(['all', 'books', 'authors'] as SearchScope[]).map((sc) => {
                    const isSelected = searchScope === sc
                    return (
                      <button
                        key={sc}
                        type="button"
                        onClick={() => setSearchScope(sc)}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all relative text-center border ${isSelected
                          ? isDark
                            ? 'bg-teal-500/20 border-teal-500/40 text-teal-300 shadow-[0_0_10px_rgba(45,212,191,0.15)]'
                            : 'bg-white border-emerald-300 text-emerald-900 shadow-xs'
                          : isDark
                            ? 'border-transparent text-white/50 hover:text-white hover:bg-white/5'
                            : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                          }`}
                      >
                        {SCOPE_LABELS[sc]}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* زر تطبيق التصفية (Harmonious refined gradient) */}
              <div className="pt-3 mt-3.5 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setIsFilterOpen(false)
                    setTimeout(() => {
                      mainSearchInputRef.current?.focus()
                    }, 60)
                  }}
                  className={`w-full py-2 px-4 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 ${isDark
                    ? 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white shadow-[0_4px_16px_rgba(20,184,166,0.25)] border border-teal-400/30 active:scale-[0.985]'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs active:scale-[0.985]'
                    }`}
                >
                  <Check size={14} className="stroke-[2.5]" />
                  <span>تطبيق التصفية</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Filters Removable Chips below Search Bar */}
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-wrap items-center gap-1.5 pt-2.5 overflow-hidden"
            >
              {selectedCategory !== 'all' && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all ${isDark ? 'bg-teal-500/15 text-teal-300 border-teal-500/30' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                  <span>القسم: {selectedCategory}</span>
                  <button onClick={() => setSelectedCategory('all')} className="hover:text-red-400 transition-colors p-0.5">
                    <X size={11} />
                  </button>
                </span>
              )}
              {selectedAuthor !== 'all' && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all ${isDark ? 'bg-teal-500/15 text-teal-300 border-teal-500/30' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                  <span>المؤلف: {selectedAuthor}</span>
                  <button onClick={() => setSelectedAuthor('all')} className="hover:text-red-400 transition-colors p-0.5">
                    <X size={11} />
                  </button>
                </span>
              )}
              {searchScope !== 'all' && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all ${isDark ? 'bg-teal-500/15 text-teal-300 border-teal-500/30' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                  <span>البحث في: {SCOPE_LABELS[searchScope]}</span>
                  <button onClick={() => setSearchScope('all')} className="hover:text-red-400 transition-colors p-0.5">
                    <X size={11} />
                  </button>
                </span>
              )}
              <button
                onClick={handleResetFilters}
                className={`text-[10px] font-semibold underline px-1 transition-colors ${isDark ? 'text-white/40 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
              >
                مسح الكل
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="h-2 w-full shrink-0"></div>
        <AnimatePresence mode="wait">
          {treeLoading ? (
            <motion.div
              key="tree-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700 h-full pb-20"
            >
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
            </motion.div>
          ) : effectiveTreeData.length > 0 ? (
            <motion.div
              key={deferredSearchQuery ? `tree-search-${deferredSearchQuery}-${searchScope}-${selectedCategory}-${selectedAuthor}` : `tree-root-${selectedCategory}-${selectedAuthor}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex flex-col space-y-0.5"
            >
              {effectiveTreeData.map((node, idx) => (
                <TreeView
                  key={node.chunk_id || `${node.title}_${idx}`}
                  node={node}
                  activeChunkId={currentChunkId}
                  activeChunkTitle={chunkTitle}
                  onChunkSelect={handleChunkSelect}
                  searchQuery={deferredSearchQuery}
                  isDark={isDark}
                  onLoadBookTree={onLoadBookTree}
                  isCustomFiltered={hasActiveFilters}
                  forceExpandedKeys={forceExpandedKeys}
                />
              ))}
            </motion.div>
          ) : (searchQuery.trim() !== '' || hasActiveFilters) ? (
            <motion.div
              key="tree-empty-search"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`text-center py-12 px-4 ${isDark ? 'text-white/50' : 'text-slate-500'}`}
            >
              <p>لا توجد نتائج تطابق معايير البحث والفلترة المحددة</p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  handleResetFilters()
                }}
                className="mt-3 inline-block px-3 py-1.5 rounded-xl text-xs font-semibold text-teal-400 bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500/20 transition-colors"
              >
                مسح البحث والفلترة
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="tree-empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`text-center py-12 px-4 ${isDark ? 'text-white/50' : 'text-slate-500'}`}
            >
              لا يوجد بيانات للفهرس. الرجاء بناء الشجرة من لوحة التحكم.
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes locateGlowPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(45, 212, 191, 0.75);
            background-color: rgba(45, 212, 191, 0.35);
            transform: scale(1.02);
          }
          50% {
            box-shadow: 0 0 25px 8px rgba(45, 212, 191, 0.45);
            background-color: rgba(45, 212, 191, 0.22);
            transform: scale(1.03);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(45, 212, 191, 0);
            background-color: transparent;
            transform: scale(1);
          }
        }
        .locate-glow-pulse {
          animation: locateGlowPulse 1.4s ease-in-out 2 !important;
          border-radius: 0.75rem !important;
          z-index: 30 !important;
          position: relative !important;
        }
      `}</style>
    </div>
  )
}
