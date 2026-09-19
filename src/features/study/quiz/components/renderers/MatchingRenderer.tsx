import { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react'
import { Network, CheckCircle2, XCircle, ArrowLeftRight, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import type { QuestionCardContentProps } from '../../types'

import { getNormalizedMatchingPairs } from '../../utils/quizEvaluator'

const RIGHT_BADGES = ['أ', 'ب', 'ج', 'د', 'هـ', 'و']

// Vibrant color accents for paired items
const PAIR_COLORS = [
  { border: 'border-sky-400', bg: 'bg-sky-500/15', text: 'text-sky-300', badge: 'bg-sky-500 text-white', hex: '#38bdf8' },
  { border: 'border-purple-400', bg: 'bg-purple-500/15', text: 'text-purple-300', badge: 'bg-purple-500 text-white', hex: '#c084fc' },
  { border: 'border-amber-400', bg: 'bg-amber-500/15', text: 'text-amber-300', badge: 'bg-amber-500 text-white', hex: '#fbbf24' },
  { border: 'border-pink-400', bg: 'bg-pink-500/15', text: 'text-pink-300', badge: 'bg-pink-500 text-white', hex: '#f472b6' },
  { border: 'border-emerald-400', bg: 'bg-emerald-500/15', text: 'text-emerald-300', badge: 'bg-emerald-500 text-white', hex: '#34d399' },
]

interface ConnectionLine {
  leftIdx: number
  rightIdx: number
  pairIndex: number
  x1: number
  y1: number
  x2: number
  y2: number
  colorHex: string
}

export function MatchingRenderer({
  q,
  isAnswered,
  showFeedback,
  isDark,
  isReadOnly = false,
  matchingSelections = {},
  shuffledRightOptions = [],
  onMatchingSelect,
  correctMatchingPairs
}: QuestionCardContentProps) {
  const [activeLeftIndex, setActiveLeftIndex] = useState<number | null>(null)
  const [activeRightIndex, setActiveRightIndex] = useState<number | null>(null)
  const [connectionLines, setConnectionLines] = useState<ConnectionLine[]>([])

  const containerRef = useRef<HTMLDivElement>(null)
  const leftItemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const rightItemRefs = useRef<(HTMLButtonElement | null)[]>([])

  const safeSelections = matchingSelections || {}
  const pairs = useMemo(() => getNormalizedMatchingPairs(q), [q])
  const rightOptions = useMemo(() => {
    return (shuffledRightOptions && shuffledRightOptions.length > 0)
      ? shuffledRightOptions
      : pairs.map(p => p.right)
  }, [shuffledRightOptions, pairs])

  // Reset active selections when question changes
  useEffect(() => {
    setActiveLeftIndex(null)
    setActiveRightIndex(null)
  }, [q])

  // Correct right string for a given left index
  const correctRightForLeft = (leftIdx: number): string =>
    correctMatchingPairs?.[leftIdx]?.right ?? pairs[leftIdx]?.right ?? ''

  const isFullyAnswered = pairs.every((_, lIdx) => safeSelections[lIdx] !== undefined)
  const allCorrect = showFeedback && isFullyAnswered && pairs.every((_, lIdx) => {
    const selectedRIdx = safeSelections[lIdx]
    return selectedRIdx !== undefined && rightOptions[selectedRIdx] === correctRightForLeft(lIdx)
  })

  // Calculate SVG line coordinates between connected elements
  const updateLines = useCallback(() => {
    if (!containerRef.current) return
    const cRect = containerRef.current.getBoundingClientRect()
    const lines: ConnectionLine[] = []

    pairs.forEach((_, leftIdx) => {
      const rightIdx = safeSelections[leftIdx]
      if (rightIdx === undefined) return

      const lBtn = leftItemRefs.current[leftIdx]
      const rBtn = rightItemRefs.current[rightIdx]

      if (lBtn && rBtn) {
        const lRect = lBtn.getBoundingClientRect()
        const rRect = rBtn.getBoundingClientRect()

        const x1 = lRect.left - cRect.left
        const y1 = lRect.top + lRect.height / 2 - cRect.top

        const x2 = rRect.right - cRect.left
        const y2 = rRect.top + rRect.height / 2 - cRect.top

        const colorTheme = PAIR_COLORS[leftIdx % PAIR_COLORS.length]
        lines.push({
          leftIdx,
          rightIdx,
          pairIndex: leftIdx % PAIR_COLORS.length,
          x1,
          y1,
          x2,
          y2,
          colorHex: colorTheme.hex
        })
      }
    })

    setConnectionLines(prev => {
      if (prev.length === lines.length && prev.every((l, i) => 
        l.leftIdx === lines[i].leftIdx && 
        l.rightIdx === lines[i].rightIdx && 
        Math.abs(l.x1 - lines[i].x1) < 1 && 
        Math.abs(l.y1 - lines[i].y1) < 1 &&
        Math.abs(l.x2 - lines[i].x2) < 1 &&
        Math.abs(l.y2 - lines[i].y2) < 1
      )) {
        return prev
      }
      return lines
    })
  }, [pairs, safeSelections])

  useLayoutEffect(() => {
    updateLines()
  }, [updateLines])

  useEffect(() => {
    const handleResize = () => updateLines()
    window.addEventListener('resize', handleResize)
    const observer = new ResizeObserver(() => updateLines())
    if (containerRef.current) observer.observe(containerRef.current)

    return () => {
      window.removeEventListener('resize', handleResize)
      observer.disconnect()
    }
  }, [updateLines])

  // Handle clicking on a left term
  const handleLeftClick = (leftIdx: number) => {
    if (isReadOnly || (showFeedback && isAnswered)) return

    if (activeRightIndex !== null) {
      if (onMatchingSelect) {
        onMatchingSelect(leftIdx, activeRightIndex)
      }
      setActiveRightIndex(null)
      setActiveLeftIndex(null)
      return
    }

    setActiveLeftIndex(prev => (prev === leftIdx ? null : leftIdx))
  }

  // Handle clicking on a right definition
  const handleRightClick = (rightIdx: number) => {
    if (isReadOnly || (showFeedback && isAnswered)) return

    if (activeLeftIndex !== null) {
      if (onMatchingSelect) {
        onMatchingSelect(activeLeftIndex, rightIdx)
      }
      setActiveLeftIndex(null)
      setActiveRightIndex(null)
    } else {
      const existingLeftIdxStr = Object.keys(safeSelections).find(
        lKey => safeSelections[Number(lKey)] === rightIdx
      )
      if (existingLeftIdxStr !== undefined) {
        setActiveLeftIndex(Number(existingLeftIdxStr))
        setActiveRightIndex(null)
      } else {
        setActiveRightIndex(prev => (prev === rightIdx ? null : rightIdx))
      }
    }
  }

  return (
    <div className="space-y-4 my-3" dir="rtl">
      {/* Hint */}
      {!showFeedback && (
        <div className={`flex items-center gap-2 text-xs font-extrabold px-3.5 py-2.5 rounded-2xl border ${
          isDark ? 'bg-sky-500/10 border-sky-500/30 text-sky-300' : 'bg-sky-50 border-sky-200 text-sky-700'
        }`}>
          <ArrowLeftRight size={15} className="animate-pulse shrink-0" />
          <span>اضغط على المصطلح والتعريف المناسب لربطهما بسهم التوصيل (يمكنك الاختيار بأي ترتيب)</span>
        </div>
      )}

      {/* Main Grid Container with SVG Overlay */}
      <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 relative p-1">
        {/* SVG Arrow Lines Canvas Overlay */}
        <svg className="absolute inset-0 pointer-events-none w-full h-full z-10 overflow-visible hidden md:block">
          <defs>
            {PAIR_COLORS.map((c, i) => (
              <marker
                key={i}
                id={`arrow-${i}`}
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={c.hex} />
              </marker>
            ))}
          </defs>

          {connectionLines.map((line) => {
            const controlPointOffset = Math.abs(line.x1 - line.x2) / 2
            const dPath = `M ${line.x1} ${line.y1} C ${line.x1 - controlPointOffset} ${line.y1}, ${line.x2 + controlPointOffset} ${line.y2}, ${line.x2} ${line.y2}`

            return (
              <g key={`${line.leftIdx}-${line.rightIdx}`}>
                {/* Outer Glow */}
                <path
                  d={dPath}
                  fill="none"
                  stroke={line.colorHex}
                  strokeWidth="6"
                  strokeOpacity="0.2"
                />
                {/* Main Arrow Line */}
                <path
                  d={dPath}
                  fill="none"
                  stroke={line.colorHex}
                  strokeWidth="2.5"
                  strokeDasharray="6 3"
                  markerEnd={`url(#arrow-${line.pairIndex})`}
                />
              </g>
            )
          })}
        </svg>

        {/* Right Column: Terms (المصطلحات) */}
        <div className="space-y-3 z-20">
          {pairs.map((pair, leftIdx) => {
            const selectedRIdx = safeSelections[leftIdx]
            const hasSelection = selectedRIdx !== undefined
            const isActive = activeLeftIndex === leftIdx
            const colorTheme = PAIR_COLORS[leftIdx % PAIR_COLORS.length]

            const correctRight = correctRightForLeft(leftIdx)
            const selectedRightLabel = hasSelection ? rightOptions[selectedRIdx] : null
            const isPairCorrect = showFeedback && hasSelection && selectedRightLabel === correctRight

            let termStyle = isDark
              ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
              : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50 shadow-sm"

            if (hasSelection && showFeedback) {
              termStyle = isPairCorrect
                ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 font-extrabold"
                : "bg-rose-500/20 border-rose-400 text-rose-300 font-extrabold"
            } else if (isActive) {
              termStyle = "bg-gradient-to-r from-sky-500/25 to-blue-500/20 border-sky-400 text-sky-200 font-extrabold shadow-lg shadow-sky-500/20 ring-2 ring-sky-400/60 scale-[1.01]"
            } else if (hasSelection) {
              termStyle = `${colorTheme.bg} ${colorTheme.border} ${colorTheme.text} font-bold shadow-sm`
            } else if (activeRightIndex !== null) {
              termStyle += " border-dashed border-purple-400/60 hover:border-purple-400 hover:bg-purple-500/10"
            }

            let termBadgeStyle = "bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20"
            if (hasSelection && showFeedback) {
              termBadgeStyle = isPairCorrect
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                : "bg-rose-500 text-white shadow-md shadow-rose-500/30"
            } else if (isActive) {
              termBadgeStyle = "bg-gradient-to-br from-sky-400 to-blue-500 text-white shadow-lg shadow-sky-500/40 ring-2 ring-sky-300 animate-pulse"
            } else if (hasSelection) {
              termBadgeStyle = `${colorTheme.badge} text-white shadow-sm`
            } else if (isDark) {
              termBadgeStyle = "bg-sky-500/20 text-sky-300 border border-sky-400/30"
            } else {
              termBadgeStyle = "bg-sky-100 text-sky-700 border border-sky-200"
            }

            return (
              <motion.button
                key={leftIdx}
                ref={el => { leftItemRefs.current[leftIdx] = el }}
                whileTap={!(isReadOnly || (showFeedback && isAnswered)) ? { scale: 0.98 } : undefined}
                onClick={() => handleLeftClick(leftIdx)}
                disabled={isReadOnly || (showFeedback && isAnswered)}
                className={`w-full text-right p-3.5 rounded-2xl border text-sm transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer relative opacity-0 animate-[fadeInUp_0.4s_ease-out_forwards] ${termStyle}`}
                style={{ animationDelay: `${0.2 + leftIdx * 0.08}s` }}
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className={`w-7 h-7 md:w-8 md:h-8 rounded-xl text-xs md:text-sm font-black flex items-center justify-center shrink-0 transition-all duration-200 ${termBadgeStyle}`}>
                    {leftIdx + 1}
                  </span>
                  <span className="font-bold truncate text-xs md:text-sm">{pair.left}</span>
                </div>

                {/* Status / Feedback */}
                {hasSelection && showFeedback && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isPairCorrect ? <CheckCircle2 size={16} className="text-emerald-400" /> : <XCircle size={16} className="text-rose-400" />}
                  </div>
                )}

           
              </motion.button>
            )
          })}
        </div>

        {/* Left Column: Definitions (التعريفات) */}
        <div className="space-y-3 z-20">
          {rightOptions.map((rightLabel, rightIdx) => {
            const rBadge = RIGHT_BADGES[rightIdx] || `${rightIdx + 1}`

            const linkedLeftIdxStr = Object.keys(safeSelections).find(
              lKey => safeSelections[Number(lKey)] === rightIdx
            )
            const linkedLeftIdx = linkedLeftIdxStr !== undefined ? Number(linkedLeftIdxStr) : null
            const isLinked = linkedLeftIdx !== null
            const linkedColorTheme = isLinked ? PAIR_COLORS[linkedLeftIdx % PAIR_COLORS.length] : null

            let defStyle = isDark
              ? "bg-white/5 border-white/10 text-white/80 hover:bg-purple-500/10 hover:border-purple-400/40"
              : "bg-white border-slate-200 text-slate-700 hover:bg-purple-50/60 hover:border-purple-300 shadow-sm"

            if (isLinked && showFeedback) {
              const correctRight = correctRightForLeft(linkedLeftIdx!)
              const isCorrect = rightLabel === correctRight
              defStyle = isCorrect
                ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 font-extrabold"
                : "bg-rose-500/20 border-rose-400 text-rose-300 font-extrabold"
            } else if (isLinked && linkedColorTheme) {
              defStyle = `${linkedColorTheme.bg} ${linkedColorTheme.border} ${linkedColorTheme.text} font-bold shadow-sm`
            } else if (activeRightIndex === rightIdx) {
              defStyle = "bg-gradient-to-r from-purple-500/25 to-pink-500/20 border-purple-400 text-purple-200 font-extrabold shadow-lg shadow-purple-500/20 ring-2 ring-purple-400/60 scale-[1.01]"
            } else if (activeLeftIndex !== null) {
              defStyle += " border-dashed border-sky-400/60 hover:border-sky-400 hover:bg-sky-500/10"
            }

            let defBadgeStyle = "bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-md shadow-purple-500/20"
            if (isLinked && showFeedback) {
              const correctRight = correctRightForLeft(linkedLeftIdx!)
              const isCorrect = rightLabel === correctRight
              defBadgeStyle = isCorrect
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                : "bg-rose-500 text-white shadow-md shadow-rose-500/30"
            } else if (isLinked && linkedColorTheme) {
              defBadgeStyle = `${linkedColorTheme.badge} text-white shadow-sm`
            } else if (activeRightIndex === rightIdx) {
              defBadgeStyle = "bg-gradient-to-br from-purple-400 to-pink-500 text-white shadow-lg shadow-purple-500/40 ring-2 ring-purple-300 animate-pulse"
            } else if (isDark) {
              defBadgeStyle = "bg-purple-500/20 text-purple-300 border border-purple-400/30"
            } else {
              defBadgeStyle = "bg-purple-100 text-purple-700 border border-purple-200"
            }

            return (
              <motion.button
                key={rightIdx}
                ref={el => { rightItemRefs.current[rightIdx] = el }}
                whileTap={!(isReadOnly || (showFeedback && isAnswered)) ? { scale: 0.98 } : undefined}
                onClick={() => handleRightClick(rightIdx)}
                disabled={isReadOnly || (showFeedback && isAnswered)}
                className={`w-full text-right p-3.5 rounded-2xl border text-sm transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer relative opacity-0 animate-[fadeInUp_0.4s_ease-out_forwards] ${defStyle}`}
                style={{ animationDelay: `${0.2 + rightIdx * 0.08}s` }}
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className={`w-7 h-7 md:w-8 md:h-8 rounded-xl text-xs md:text-sm font-black flex items-center justify-center shrink-0 transition-all duration-200 ${defBadgeStyle}`}>
                    {rBadge}
                  </span>
                  <span className="font-bold leading-relaxed text-xs md:text-sm">{rightLabel}</span>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>



      {/* Feedback Summary */}
      {showFeedback && isFullyAnswered && (
        <div className={`px-4 py-3 rounded-2xl border text-xs font-extrabold flex items-center gap-2.5 ${
          allCorrect
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
            : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
        }`}>
          {allCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <span>{allCorrect ? 'أحسنت! جميع الربط صحيح' : 'بعض الروابط خاطئة — تم تمييز الإجابات أعلاه'}</span>
        </div>
      )}
    </div>
  )
}
