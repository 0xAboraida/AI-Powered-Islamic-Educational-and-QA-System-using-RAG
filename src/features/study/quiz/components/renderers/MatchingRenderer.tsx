import { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react'
import { Network, Check, X, ArrowLeftRight, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import type { QuestionCardContentProps } from '../../types'
import { useTheme } from '../../../../../contexts/ThemeContext'
import { getQuizActiveThemeTokens } from '../../utils/quizThemeTokens'

import { getNormalizedMatchingPairs, formatIslamicQuizText } from '../../utils/quizEvaluator'

const RIGHT_BADGES = ['أ', 'ب', 'ج', 'د', 'هـ', 'و']

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
  const { accentColor } = useTheme()
  const theme = getQuizActiveThemeTokens(accentColor, isDark)

  const pairColors = useMemo(() => [
    {
      border: isDark ? 'border-sky-400' : 'border-sky-500',
      bg: isDark ? 'bg-sky-500/15' : 'bg-sky-50/90',
      badge: 'bg-sky-600 text-white shadow-sm shadow-sky-600/30',
      hex: isDark ? '#38bdf8' : '#0284c7',
    },
    {
      border: isDark ? 'border-[#800080]' : 'border-[#800080]',
      bg: isDark ? 'bg-[#800080]/25' : 'bg-purple-50/90',
      badge: 'bg-[#800080] text-white shadow-sm shadow-[#800080]/30',
      hex: isDark ? '#d884d8' : '#800080',
    },
    {
      border: isDark ? 'border-emerald-400' : 'border-emerald-600',
      bg: isDark ? 'bg-emerald-500/15' : 'bg-emerald-50/90',
      badge: 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30',
      hex: isDark ? '#34d399' : '#059669',
    },
    {
      border: isDark ? 'border-teal-400' : 'border-teal-600',
      bg: isDark ? 'bg-teal-500/15' : 'bg-teal-50/90',
      badge: 'bg-teal-600 text-white shadow-sm shadow-teal-600/30',
      hex: isDark ? '#2dd4bf' : '#0d9488',
    },
    {
      border: isDark ? 'border-rose-400' : 'border-rose-500',
      bg: isDark ? 'bg-rose-500/15' : 'bg-rose-50/90',
      badge: 'bg-rose-600 text-white shadow-sm shadow-rose-600/30',
      hex: isDark ? '#fb7185' : '#e11d48',
    },
  ], [isDark])

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

        const colorTheme = pairColors[leftIdx % pairColors.length]
        lines.push({
          leftIdx,
          rightIdx,
          pairIndex: leftIdx % pairColors.length,
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
  }, [pairs, safeSelections, pairColors])

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
        <div className={`flex items-center gap-2 text-xs font-extrabold px-3.5 py-2.5 rounded-xl border ${theme.matchingHint}`}>
          <ArrowLeftRight size={15} className="animate-pulse shrink-0" />
          <span>اضغط على المصطلح والتعريف المناسب لربطهما بسهم التوصيل (يمكنك الاختيار بأي ترتيب)</span>
        </div>
      )}

      {/* Main Grid Container with SVG Overlay */}
      <div ref={containerRef} className="grid grid-cols-2 gap-2.5 sm:gap-6 md:gap-12 relative p-1">
        {/* SVG Cable Lines Canvas Overlay */}
        <svg className="absolute inset-0 pointer-events-none w-full h-full z-10 overflow-visible block">
          {connectionLines.map((line) => {
            const controlPointOffset = Math.max(Math.abs(line.x1 - line.x2) / 2, 8)
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
                {/* Main Cable Line without Arrowhead */}
                <path
                  d={dPath}
                  fill="none"
                  stroke={line.colorHex}
                  strokeWidth="2.5"
                  strokeDasharray="6 3"
                />
              </g>
            )
          })}
        </svg>

        {/* Right Column: Terms (المصطلحات) */}
        <div className="space-y-2.5 sm:space-y-3 z-20">
          {pairs.map((pair, leftIdx) => {
            const selectedRIdx = safeSelections[leftIdx]
            const hasSelection = selectedRIdx !== undefined
            const isActive = activeLeftIndex === leftIdx
            const colorTheme = pairColors[leftIdx % pairColors.length]

            const correctRight = correctRightForLeft(leftIdx)
            const selectedRightLabel = hasSelection ? rightOptions[selectedRIdx] : null
            const isPairCorrect = showFeedback && hasSelection && selectedRightLabel === correctRight

            let termStyle = isDark
              ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
              : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50 shadow-sm"

            if (hasSelection && showFeedback) {
              termStyle = isPairCorrect
                ? (isDark ? "bg-emerald-500/20 border-2 border-emerald-400 text-emerald-200 font-extrabold" : "bg-emerald-50 border-2 border-emerald-500 text-emerald-950 font-extrabold shadow-sm")
                : (isDark ? "bg-rose-500/20 border-2 border-rose-400 text-rose-200 font-extrabold" : "bg-rose-50 border-2 border-rose-500 text-rose-950 font-extrabold shadow-sm")
            } else if (isActive) {
              termStyle = isDark
                ? "bg-amber-500/20 border-2 border-amber-400 text-white font-black shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/50 scale-[1.01]"
                : "bg-amber-50 border-2 border-amber-600 text-slate-950 font-black shadow-md ring-2 ring-amber-500/30 scale-[1.01]"
            } else if (hasSelection) {
              termStyle = isDark
                ? `${colorTheme.bg} border-2 ${colorTheme.border} text-white font-extrabold shadow-sm`
                : `${colorTheme.bg} border-2 ${colorTheme.border} text-slate-950 font-extrabold shadow-sm`
            } else if (activeRightIndex !== null) {
              termStyle += isDark
                ? " border-dashed border-purple-400/60 hover:border-purple-400 hover:bg-purple-500/10"
                : " border-dashed border-purple-400 hover:border-purple-500 hover:bg-purple-50/70"
            }

            let termBadgeStyle = "bg-sky-600 text-white shadow-md shadow-sky-500/20"
            if (hasSelection && showFeedback) {
              termBadgeStyle = isPairCorrect
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/30"
                : "bg-rose-600 text-white shadow-md shadow-rose-500/30"
            } else if (isActive) {
              termBadgeStyle = "bg-amber-600 text-white shadow-lg shadow-amber-500/40 ring-2 ring-amber-300 animate-pulse"
            } else if (hasSelection) {
              termBadgeStyle = `${colorTheme.badge} text-white shadow-sm`
            } else {
              termBadgeStyle = theme.matchingTermBadge
            }

            return (
              <motion.button
                key={leftIdx}
                ref={el => { leftItemRefs.current[leftIdx] = el }}
                whileTap={!(isReadOnly || (showFeedback && isAnswered)) ? { scale: 0.98 } : undefined}
                onClick={() => handleLeftClick(leftIdx)}
                disabled={isReadOnly || (showFeedback && isAnswered)}
                className={`w-full text-right p-2.5 sm:p-3 rounded-xl border text-xs sm:text-sm transition-all duration-200 flex items-center gap-2 cursor-pointer relative opacity-0 animate-[fadeInUp_0.4s_ease-out_forwards] ${termStyle}`}
                style={{ animationDelay: `${0.2 + leftIdx * 0.08}s` }}
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="relative shrink-0">
                    <span className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-xs font-black flex items-center justify-center transition-all duration-200 ${termBadgeStyle}`}>
                      {leftIdx + 1}
                    </span>

                    {/* Status indicator badge attached to the number badge */}
                    {hasSelection && showFeedback && (
                      isPairCorrect ? (
                        <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900 animate-in zoom-in-75 duration-200 z-10">
                          <Check size={10} className="stroke-[3]" />
                        </span>
                      ) : (
                        <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900 animate-in zoom-in-75 duration-200 z-10">
                          <X size={10} className="stroke-[3]" />
                        </span>
                      )
                    )}
                  </div>
                  <span className="font-extrabold text-xs sm:text-sm leading-snug break-words flex-1">{formatIslamicQuizText(pair.left)}</span>
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* Left Column: Definitions (التعريفات) */}
        <div className="space-y-2.5 sm:space-y-3 z-20">
          {rightOptions.map((rightLabel, rightIdx) => {
            const rBadge = RIGHT_BADGES[rightIdx] || `${rightIdx + 1}`

            const linkedLeftIdxStr = Object.keys(safeSelections).find(
              lKey => safeSelections[Number(lKey)] === rightIdx
            )
            const linkedLeftIdx = linkedLeftIdxStr !== undefined ? Number(linkedLeftIdxStr) : null
            const isLinked = linkedLeftIdx !== null
            const linkedColorTheme = isLinked ? pairColors[linkedLeftIdx % pairColors.length] : null

            const isCorrect = isLinked && showFeedback && rightLabel === correctRightForLeft(linkedLeftIdx!)

            let defStyle = isDark
              ? "bg-white/5 border-white/10 text-white/90 hover:bg-white/10"
              : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50 shadow-sm"

            if (isLinked && showFeedback) {
              defStyle = isCorrect
                ? (isDark ? "bg-emerald-500/20 border-2 border-emerald-400 text-emerald-200 font-extrabold" : "bg-emerald-50 border-2 border-emerald-500 text-emerald-950 font-extrabold shadow-sm")
                : (isDark ? "bg-rose-500/20 border-rose-400 text-rose-200 font-extrabold" : "bg-rose-50 border-2 border-rose-500 text-rose-950 font-extrabold shadow-sm")
            } else if (isLinked && linkedColorTheme) {
              defStyle = isDark
                ? `${linkedColorTheme.bg} border-2 ${linkedColorTheme.border} text-white font-extrabold shadow-sm`
                : `${linkedColorTheme.bg} border-2 ${linkedColorTheme.border} text-slate-950 font-extrabold shadow-sm`
            } else if (activeRightIndex === rightIdx) {
              defStyle = isDark
                ? "bg-purple-500/20 border-2 border-purple-400 text-white font-black shadow-lg shadow-purple-500/20 ring-2 ring-purple-400/50 scale-[1.01]"
                : "bg-purple-50 border-2 border-purple-600 text-slate-950 font-black shadow-md ring-2 ring-purple-500/30 scale-[1.01]"
            } else if (activeLeftIndex !== null) {
              defStyle += isDark
                ? " border-dashed border-sky-400/60 hover:border-sky-400 hover:bg-sky-500/10"
                : " border-dashed border-sky-400 hover:border-sky-500 hover:bg-sky-50/70"
            }

            let defBadgeStyle = "bg-purple-600 text-white shadow-md shadow-purple-500/20"
            if (isLinked && showFeedback) {
              defBadgeStyle = isCorrect
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/30"
                : "bg-rose-600 text-white shadow-md shadow-rose-500/30"
            } else if (isLinked && linkedColorTheme) {
              defBadgeStyle = `${linkedColorTheme.badge} text-white shadow-sm`
            } else if (activeRightIndex === rightIdx) {
              defBadgeStyle = "bg-purple-600 text-white shadow-lg shadow-purple-500/40 ring-2 ring-purple-300 animate-pulse"
            } else {
              defBadgeStyle = theme.matchingDefBadge
            }

            return (
              <motion.button
                key={rightIdx}
                ref={el => { rightItemRefs.current[rightIdx] = el }}
                whileTap={!(isReadOnly || (showFeedback && isAnswered)) ? { scale: 0.98 } : undefined}
                onClick={() => handleRightClick(rightIdx)}
                disabled={isReadOnly || (showFeedback && isAnswered)}
                className={`w-full text-right p-2.5 sm:p-3 rounded-xl border text-xs sm:text-sm transition-all duration-200 flex items-center gap-2 cursor-pointer relative opacity-0 animate-[fadeInUp_0.4s_ease-out_forwards] ${defStyle}`}
                style={{ animationDelay: `${0.2 + rightIdx * 0.08}s` }}
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="relative shrink-0">
                    <span className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-xs font-black flex items-center justify-center transition-all duration-200 ${defBadgeStyle}`}>
                      {rBadge}
                    </span>

                    {/* Status indicator badge attached to the letter badge */}
                    {isLinked && showFeedback && (
                      isCorrect ? (
                        <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900 animate-in zoom-in-75 duration-200 z-10">
                          <Check size={10} className="stroke-[3]" />
                        </span>
                      ) : (
                        <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900 animate-in zoom-in-75 duration-200 z-10">
                          <X size={10} className="stroke-[3]" />
                        </span>
                      )
                    )}
                  </div>
                  <span className="font-bold leading-relaxed text-xs sm:text-sm break-words flex-1">{formatIslamicQuizText(rightLabel)}</span>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>




    </div>
  )
}
