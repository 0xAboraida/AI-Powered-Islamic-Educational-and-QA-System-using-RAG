import type { Question } from '../../../../contexts/StudyContext'

export const getNormalizedMatchingPairs = (q: Question) => {
  if (!q) return []
  if (q.matching_pairs && q.matching_pairs.length > 0) {
    return q.matching_pairs
  }
  if (q.options && q.options.length > 0) {
    return q.options.map((opt, i) => {
      if (!opt) return { left: `العنصر ${i + 1}`, right: '' }
      const delims = [':', '-', '|', '—']
      for (const d of delims) {
        if (opt.includes(d)) {
          const [l, r] = opt.split(d)
          if (l?.trim() && r?.trim()) {
            return { left: l.trim(), right: r.trim() }
          }
        }
      }
      return { left: `العنصر ${i + 1}`, right: opt.trim() }
    })
  }
  return [
    { left: "العنصر الأول", right: "بيان وتعريف العنصر الأول" },
    { left: "العنصر الثاني", right: "بيان وتعريف العنصر الثاني" },
    { left: "العنصر الثالث", right: "بيان وتعريف العنصر الثالث" },
  ]
}

export const isMatchingFullyAnswered = (
  qIdx: number, 
  q: Question, 
  matchingAnswers: Record<number, Record<number, number>>
): boolean => {
  if (!q || q.type !== 'matching') return false
  const pairs = getNormalizedMatchingPairs(q)
  const selections = (matchingAnswers && matchingAnswers[qIdx]) || {}
  return pairs.every((_, leftIdx) => selections[leftIdx] !== undefined)
}

export const isMatchingCorrect = (
  qIdx: number, 
  q: Question, 
  matchingAnswers: Record<number, Record<number, number>>,
  shuffledMatchingOptions: Record<number, string[]>
): boolean => {
  if (!q || q.type !== 'matching') return false
  const pairs = getNormalizedMatchingPairs(q)
  const selections = (matchingAnswers && matchingAnswers[qIdx]) || {}
  const shuffled = (shuffledMatchingOptions && shuffledMatchingOptions[qIdx]) || pairs.map(p => p.right)
  return pairs.every((pair, leftIdx) => {
    const selectedRightIdx = selections[leftIdx]
    return selectedRightIdx !== undefined && shuffled[selectedRightIdx] === pair.right
  })
}

export const formatTimer = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}
