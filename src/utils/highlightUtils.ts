/**
 * Utilities for highlighting text selections across DOM elements,
 * supporting multi-node ranges, Arabic text variations, and persistent storage.
 */

export interface HighlightItem {
  id: string
  text: string
  color: string
}

export function buildArabicRegex(query: string): RegExp | null {
  const clean = query.trim()
  if (!clean) return null

  const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const tashkeel = '[\\u064B-\\u065F\\u0670\\u06D6-\\u06ED]*'

  let pattern = ''
  for (let i = 0; i < escaped.length; i++) {
    const ch = escaped[i]
    if (/[\u064B-\u065F\u0670\u06D6-\u06ED]/.test(ch)) continue

    if (/[اأإآٱ]/.test(ch)) {
      pattern += `[اأإآٱ]${tashkeel}`
    } else if (/[يى]/.test(ch)) {
      pattern += `[يى]${tashkeel}`
    } else if (/[هة]/.test(ch)) {
      pattern += `[هة]${tashkeel}`
    } else if (/[وؤ]/.test(ch)) {
      pattern += `[وؤ]${tashkeel}`
    } else if (/\s+/.test(ch)) {
      pattern += `\\s+`
    } else {
      pattern += `${ch}${tashkeel}`
    }
  }

  try {
    return new RegExp(pattern, 'gi')
  } catch {
    return null
  }
}

/**
 * Creates and styles a standard highlight <mark> element
 */
export function createHighlightMark(text: string, color: string, highlightId: string): HTMLElement {
  const mark = document.createElement('mark')
  mark.setAttribute('data-user-highlight', 'true')
  mark.setAttribute('data-highlight-id', highlightId)
  mark.setAttribute('data-highlight-color', color)
  mark.setAttribute('title', 'انقر مرتين لإزالة التظليل')
  mark.style.cssText = `background-color: ${color} !important; color: #0e0e0e !important; -webkit-text-fill-color: #0e0e0e !important; border-radius: 4px; padding: 1px 3px; cursor: pointer; display: inline; text-decoration: none; font-weight: inherit;`
  mark.textContent = text
  return mark
}

/**
 * Physically applies highlighters across all text nodes inside a DOM Range.
 * Handles both single-node selections and multi-block / multi-node selections.
 */
export function highlightRange(range: Range, color: string, highlightId: string): boolean {
  if (range.collapsed) return false

  let root: HTMLElement
  if (range.commonAncestorContainer.nodeType === Node.TEXT_NODE) {
    root = range.commonAncestorContainer.parentElement || (document.body as HTMLElement)
  } else {
    root = range.commonAncestorContainer as HTMLElement
  }

  // 1. Collect all valid text nodes intersecting the range
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const parent = node.parentElement
        if (!parent) return NodeFilter.FILTER_REJECT
        const tag = parent.tagName.toLowerCase()
        if (['script', 'style', 'input', 'textarea', 'button'].includes(tag)) {
          return NodeFilter.FILTER_REJECT
        }

        // If inside an existing highlight mark:
        const existingMark = parent.closest('[data-user-highlight="true"]') as HTMLElement | null
        if (existingMark) {
          if (range.intersectsNode(existingMark)) {
            // Update color of the existing highlight
            existingMark.setAttribute('data-highlight-color', color)
            existingMark.setAttribute('data-highlight-id', highlightId)
            existingMark.style.setProperty('background-color', color, 'important')
          }
          return NodeFilter.FILTER_REJECT
        }

        if (range.intersectsNode(node)) {
          return NodeFilter.FILTER_ACCEPT
        }
        return NodeFilter.FILTER_REJECT
      }
    }
  )

  const textNodes: Text[] = []
  let curr: Node | null
  while ((curr = walker.nextNode())) {
    textNodes.push(curr as Text)
  }

  // 2. Map slices before modifying the DOM
  interface NodeSlice {
    tNode: Text
    val: string
    start: number
    end: number
  }

  const slices: NodeSlice[] = []
  for (const tNode of textNodes) {
    const val = tNode.nodeValue || ''
    if (val.length === 0) continue
    const start = (tNode === range.startContainer) ? range.startOffset : 0
    const end = (tNode === range.endContainer) ? range.endOffset : val.length
    if (end > start) {
      slices.push({ tNode, val, start, end })
    }
  }

  // Fallback: If TreeWalker didn't yield slices but startContainer is a Text node
  if (slices.length === 0 && range.startContainer.nodeType === Node.TEXT_NODE) {
    const tNode = range.startContainer as Text
    const val = tNode.nodeValue || ''
    const start = range.startOffset
    const end = (range.startContainer === range.endContainer) ? range.endOffset : val.length
    if (end > start) {
      slices.push({ tNode, val, start, end })
    }
  }

  if (slices.length === 0) return false

  // 3. Apply mark wrapper to each slice
  for (const { tNode, val, start, end } of slices) {
    const beforeText = val.slice(0, start)
    const selectedPart = val.slice(start, end)
    const afterText = val.slice(end)

    if (!selectedPart) continue

    const mark = createHighlightMark(selectedPart, color, highlightId)

    const frag = document.createDocumentFragment()
    if (beforeText) {
      frag.appendChild(document.createTextNode(beforeText))
    }
    frag.appendChild(mark)
    if (afterText) {
      frag.appendChild(document.createTextNode(afterText))
    }

    const parent = tNode.parentNode
    if (parent) {
      parent.replaceChild(frag, tNode)
    }
  }

  return true
}

/**
 * Removes all parts of a highlight matching highlightId from the DOM
 */
export function removeHighlightById(highlightId: string, root: Document | HTMLElement = document): void {
  const marks = root.querySelectorAll(`[data-highlight-id="${highlightId}"]`)
  marks.forEach(mark => {
    const parent = mark.parentNode
    if (parent) {
      while (mark.firstChild) {
        parent.insertBefore(mark.firstChild, mark)
      }
      parent.removeChild(mark)
      parent.normalize()
    }
  })
}

/**
 * Removes all highlights intersecting a given Range
 */
export function removeHighlightsFromRange(range: Range): string[] {
  let root: HTMLElement
  if (range.commonAncestorContainer.nodeType === Node.TEXT_NODE) {
    root = range.commonAncestorContainer.parentElement || (document.body as HTMLElement)
  } else {
    root = range.commonAncestorContainer as HTMLElement
  }

  const spansToRemove = new Set<HTMLElement>()
  const parentHighlight = root.closest('[data-user-highlight="true"]')
  if (parentHighlight) spansToRemove.add(parentHighlight as HTMLElement)

  const allMarks = root.querySelectorAll('[data-user-highlight="true"]')
  allMarks.forEach(s => {
    if (range.intersectsNode(s)) {
      spansToRemove.add(s as HTMLElement)
    }
  })

  // Also collect any brother spans with the same highlight ID
  const highlightIdsToClear = new Set<string>()
  spansToRemove.forEach(s => {
    const id = s.getAttribute('data-highlight-id')
    if (id) highlightIdsToClear.add(id)
  })

  highlightIdsToClear.forEach(id => {
    document.querySelectorAll(`[data-highlight-id="${id}"]`).forEach(s => {
      spansToRemove.add(s as HTMLElement)
    })
  })

  const removedTexts: string[] = []
  spansToRemove.forEach(span => {
    const text = span.textContent || ''
    if (text) removedTexts.push(text)
    const parent = span.parentNode
    if (parent) {
      while (span.firstChild) {
        parent.insertBefore(span.firstChild, span)
      }
      parent.removeChild(span)
      parent.normalize()
    }
  })

  return removedTexts
}

/**
 * Applies a saved highlight to an element based on its text content
 */
export function applySavedHighlightToElement(container: HTMLElement, highlight: HighlightItem): boolean {
  if (!container || !highlight.text) return false
  const target = highlight.text.trim()
  if (target.length === 0) return false

  if (container.querySelector(`mark[data-highlight-id="${highlight.id}"]`)) return false

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement
      if (!parent) return NodeFilter.FILTER_REJECT
      const tag = parent.tagName.toLowerCase()
      if (['script', 'style', 'button', 'input', 'textarea'].includes(tag)) {
        return NodeFilter.FILTER_REJECT
      }
      if (parent.closest(`mark[data-highlight-id="${highlight.id}"]`)) {
        return NodeFilter.FILTER_REJECT
      }
      return NodeFilter.FILTER_ACCEPT
    }
  })

  interface NodeMap {
    node: Text
    start: number
    end: number
  }

  const nodes: NodeMap[] = []
  let concatenated = ''

  let currNode: Text | null
  while ((currNode = walker.nextNode() as Text | null)) {
    const val = currNode.nodeValue || ''
    if (val.length === 0) continue
    const start = concatenated.length
    concatenated += val
    nodes.push({
      node: currNode,
      start,
      end: start + val.length
    })
  }

  if (nodes.length === 0) return false

  let origMatchStart = -1
  let origMatchEnd = -1

  const directIdx = concatenated.indexOf(target)
  if (directIdx !== -1) {
    origMatchStart = directIdx
    origMatchEnd = directIdx + target.length
  } else {
    const regex = buildArabicRegex(target)
    if (regex) {
      const match = regex.exec(concatenated)
      if (match) {
        origMatchStart = match.index
        origMatchEnd = match.index + match[0].length
      }
    }
  }

  if (origMatchStart === -1 || origMatchEnd <= origMatchStart) return false

  for (let i = nodes.length - 1; i >= 0; i--) {
    const item = nodes[i]
    const segStart = Math.max(item.start, origMatchStart)
    const segEnd = Math.min(item.end, origMatchEnd)

    if (segStart < segEnd) {
      const localStart = segStart - item.start
      const localEnd = segEnd - item.start

      const nodeText = item.node.nodeValue || ''
      const beforeText = nodeText.slice(0, localStart)
      const highlightText = nodeText.slice(localStart, localEnd)
      const afterText = nodeText.slice(localEnd)

      const frag = document.createDocumentFragment()
      if (beforeText) {
        frag.appendChild(document.createTextNode(beforeText))
      }

      const mark = createHighlightMark(highlightText, highlight.color, highlight.id)
      frag.appendChild(mark)

      if (afterText) {
        frag.appendChild(document.createTextNode(afterText))
      }

      item.node.parentNode?.replaceChild(frag, item.node)
    }
  }

  return true
}

/* =========================================================================
 * LocalStorage helpers for Message Highlights
 * ========================================================================= */

const CHAT_HIGHLIGHTS_KEY_PREFIX = 'zad_chat_highlights_'

export function getChatMessageHighlights(messageId: string): HighlightItem[] {
  try {
    const raw = localStorage.getItem(`${CHAT_HIGHLIGHTS_KEY_PREFIX}${messageId}`)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveChatMessageHighlight(messageId: string, item: HighlightItem): void {
  try {
    const existing = getChatMessageHighlights(messageId)
    const updated = [...existing.filter(h => h.id !== item.id), item]
    localStorage.setItem(`${CHAT_HIGHLIGHTS_KEY_PREFIX}${messageId}`, JSON.stringify(updated))
  } catch { }
}

export function removeChatMessageHighlight(messageId: string, highlightIdOrText: string): void {
  try {
    const existing = getChatMessageHighlights(messageId)
    const updated = existing.filter(h => h.id !== highlightIdOrText && h.text.trim() !== highlightIdOrText.trim())
    localStorage.setItem(`${CHAT_HIGHLIGHTS_KEY_PREFIX}${messageId}`, JSON.stringify(updated))
  } catch { }
}

