import type { TreeNode } from '../contexts/StudyContext'

export interface TurathHeading {
  title: string
  level: number
  page: number
}

export interface TurathBookIndexesResponse {
  meta?: {
    id: number
    name: string
    author_id?: number
    cat_id?: number
    info?: string
    version?: string
    author_page_start?: number
  }
  indexes?: {
    headings?: TurathHeading[]
    volumes?: string[]
    print_pg_to_pg?: Record<string, number>
  }
}

export interface TurathPageResponse {
  meta?: {
    headings?: string[]
    page_id?: number
    page: number
    vol?: string
    book_name?: string
    author_name?: string
    cat_name?: string
  }
  text: string
}

const TURATH_PROXY_URL = '/turath-proxy'
const TURATH_EDGE_URL = '/api/turath-proxy'
const TURATH_DIRECT_URL = 'https://api.turath.io'

/**
 * Robust fetcher handling local Vite dev proxy, Vercel Edge Serverless proxy, and CORS fallbacks
 */
async function fetchTurathJson(endpointWithQuery: string): Promise<any> {
  if (typeof window !== 'undefined') {
    // Strategy 1: Local Vite proxy / Vercel vercel.json rewrite
    try {
      const res = await fetch(`${TURATH_PROXY_URL}${endpointWithQuery}`)
      if (res.ok) {
        const contentType = res.headers.get('content-type') || ''
        if (contentType.includes('application/json') || contentType.includes('text/plain')) {
          return await res.json()
        }
      }
    } catch {
      // Ignore and proceed to next strategy
    }

    // Strategy 1.5: Vercel Edge Serverless Function Proxy (/api/turath-proxy)
    try {
      const res = await fetch(`${TURATH_EDGE_URL}${endpointWithQuery}`)
      if (res.ok) {
        const contentType = res.headers.get('content-type') || ''
        if (contentType.includes('application/json') || contentType.includes('text/plain')) {
          return await res.json()
        }
      }
    } catch {
      // Ignore and proceed to next strategy
    }
  }

  // Strategy 2: Direct public API call (works if CORS is supported)
  try {
    const res = await fetch(`${TURATH_DIRECT_URL}${endpointWithQuery}`)
    if (res.ok) {
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json') || contentType.includes('text/plain')) {
        return await res.json()
      }
    }
  } catch {
    // Ignore and proceed to next strategy
  }

  // Strategy 3: Public CORS bridge fallback (e.g. allorigins)
  try {
    const targetUrl = encodeURIComponent(`${TURATH_DIRECT_URL}${endpointWithQuery}`)
    const res = await fetch(`https://api.allorigins.win/raw?url=${targetUrl}`)
    if (res.ok) {
      return await res.json()
    }
  } catch (err) {
    console.error('All Turath fetch strategies failed:', err)
  }

  return null
}

/**
 * Fetch table of contents (headings and indexes) for a given book from Turath
 */
export async function fetchTurathBookIndexes(turathId: number): Promise<TurathBookIndexesResponse | null> {
  const data = await fetchTurathJson(`/book?id=${turathId}&include=indexes&ver=3`)
  if (data && data.indexes) {
    return data
  }
  return null
}

/**
 * Fetch a single page content from Turath
 */
export async function fetchTurathPage(turathId: number, page: number): Promise<TurathPageResponse | null> {
  const data = await fetchTurathJson(`/page?book_id=${turathId}&pg=${page}&ver=3`)
  if (data && data.text !== undefined) {
    return data
  }
  return null
}

export interface ChapterSliceOptions {
  startTocId?: string
  endTocId?: string
  chapterTitle?: string
  nextChapterTitle?: string
}

function normalizeArabic(text: string): string {
  if (!text) return ''
  return text
    .trim()
    .toLowerCase()
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[\u064B-\u065F]/g, '')
}

function normalizeArabicHeading(text: string): string {
  if (!text) return ''
  return text
    .trim()
    .toLowerCase()
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[\u064B-\u065F]/g, '')
    // Remove footnote markers like (١) or [1] or (14)
    .replace(/[\(\[]\s*[١٢٣٤٥٦٧٨٩٠\d]+\s*[\)\]]/g, '')
    // Remove non-word characters and punctuation
    .replace(/[^\u0621-\u064A\u0671-\u06D3\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function filterFootnotesByBody(body: string, footnotesText: string, isPageSliced: boolean = false): string {
  if (!footnotesText || !footnotesText.trim()) return ''
  const bodyFnNums = new Set<string>()

  // 1. Footnote markers in parentheses or brackets: (1), [1], (^1)
  const refRegex = /[\(\[]\s*\^?([١٢٣٤٥٦٧٨٩٠\d]+)\^?\s*[\)\]]/g
  let rm: RegExpExecArray | null
  while ((rm = refRegex.exec(body)) !== null) {
    bodyFnNums.add(rm[1].trim())
  }

  // 2. Extract potential footnote numbers from footnotesText first
  const fnAvailableNums = new Set<string>()
  const lines = footnotesText.split('\n')
  for (const line of lines) {
    const fnStartMatch = line.match(/^\s*(?:[\(\[]\s*\^?([١٢٣٤٥٦٧٨٩٠\d]+)\^?\s*[\)\]]|([١٢٣٤٥٦٧٨٩٠\d]{1,2})(?:[\.\-:،]\s*|\s+(?=[^\d\s])))/)
    if (fnStartMatch) {
      const num = (fnStartMatch[1] || fnStartMatch[2] || '').trim()
      if (num) fnAvailableNums.add(num)
    }
  }

  // 3. For any footnote numbers found in footnotes, check if they exist bare in body:
  // e.g. "ضعفيهم ۲ إذا كان"
  if (fnAvailableNums.size > 0) {
    const reservedWords = 'سنة|عام|توفي|ت|ولد|ص|صـ|ج|جـ|الآية|رقم|قاعدة|مسألة|فقرة|حديث|ح|ط|طبعة|الباب|باب'
    for (const num of fnAvailableNums) {
      const escapedNum = num.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const barePattern = new RegExp(`(?<!(?:${reservedWords})\\s*)(?:^|(?<=[\\u0621-\\u064A\\u0671-\\u06D3\\s]))${escapedNum}(?=(?:\\s+|$|[،.؛:!؟«»"\\(\\)\\[\\]]))(?![-–—])`, 'u')
      if (barePattern.test(body)) {
        bodyFnNums.add(num)
      }
    }
  }

  // If the page was SLICED (i.e. other chapters begin or end on this page)
  // and this chapter has ZERO references to footnotes on this page:
  // Then the footnotes belong to the OTHER chapter that was cut away! Do NOT attach them!
  if (bodyFnNums.size === 0) {
    if (isPageSliced) {
      return ''
    }
    // If the page was NOT sliced (it's a full page belonging entirely to this lesson), preserve footnotes
    return footnotesText.trim()
  }

  const matchedLines: string[] = []
  let capturing = false

  for (const line of lines) {
    const fnStartMatch = line.match(/^\s*(?:[\(\[]\s*\^?([١٢٣٤٥٦٧٨٩٠\d]+)\^?\s*[\)\]]|([١٢٣٤٥٦٧٨٩٠\d]{1,2})(?:[\.\-:،]\s*|\s+(?=[^\d\s])))/)
    if (fnStartMatch) {
      const fnNum = (fnStartMatch[1] || fnStartMatch[2] || '').trim()
      capturing = bodyFnNums.has(fnNum)
    }
    if (capturing) {
      matchedLines.push(line)
    }
  }

  return matchedLines.length > 0 ? matchedLines.join('\n').trim() : (isPageSliced ? '' : footnotesText.trim())
}

/**
 * Accurately slice chapter pages so the returned text contains ONLY
 * the requested chapter, trimming previous chapter endings from startPage
 * and following chapter beginnings from endPage.
 */
export function sliceChapterPages(
  pagesList: { pg: number; text: string }[],
  options?: ChapterSliceOptions
): { pg: number; text: string }[] {
  if (!options || (!options.startTocId && !options.endTocId && !options.chapterTitle && !options.nextChapterTitle)) {
    return pagesList
  }

  const { startTocId, endTocId, chapterTitle, nextChapterTitle } = options
  const footnoteSeparatorRegex = /(?:<hr\s*\/?>\s*(?:<s\d+>)?|(?:\r?\n|^)\s*(?:_{3,}|[-–—]{3,})\s*(?:\r?\n|$))/i

  const result: { pg: number; text: string }[] = []
  let chapterEnded = false

  for (let idx = 0; idx < pagesList.length; idx++) {
    if (chapterEnded) break

    const { pg, text } = pagesList[idx]
    const isStartPage = idx === 0
    let pageWasSliced = false

    // Separate body from footnotes so footnotes are preserved and not truncated
    const fnParts = text.split(footnoteSeparatorRegex)
    let body = fnParts[0]
    const footnotes = fnParts.length > 1 ? fnParts.slice(1).join('\n_________\n') : ''

    // 1. On start page: trim any previous chapter text preceding this chapter's heading
    if (isStartPage) {
      let startMatchIdx = -1

      // Strategy A: Match by unique TOC ID (handling quoted or unquoted attributes like id=toc-16 or id="toc-16")
      if (startTocId) {
        const idRegex = new RegExp(`(?:<span\\s+[^>]*id\\s*=\\s*["']?${startTocId}["']?[^>]*>[\\s\\S]*?<\\/span>)`, 'i')
        const m = body.match(idRegex)
        if (m && m.index !== undefined) {
          const beforeMatch = body.slice(0, m.index)
          const lastNl = beforeMatch.lastIndexOf('\n')
          const lineStart = lastNl === -1 ? 0 : lastNl + 1
          const linePrefix = beforeMatch.slice(lineStart)
          if (/^[ \t]*(?:[-–—•\*]|[\(\[]?[١٢٣٤٥٦٧٨٩٠\d]+[\)\]]?\s*[-–—.:،\)])/i.test(linePrefix)) {
            startMatchIdx = lineStart
          } else {
            startMatchIdx = m.index
          }
        }
      }

      // Strategy B: Fallback match by chapter title text inside title span
      if (startMatchIdx === -1 && chapterTitle) {
        const cleanTarget = normalizeArabicHeading(chapterTitle)
        if (cleanTarget.length >= 2) {
          const spanRegex = /<span\s+[^>]*data-type\s*=\s*["']?title["']?[^>]*>([\s\S]*?)<\/span>/gi
          let sm: RegExpExecArray | null
          while ((sm = spanRegex.exec(body)) !== null) {
            const spanText = normalizeArabicHeading(sm[1].replace(/<[^>]+>/g, ''))
            const targetSample = cleanTarget.slice(0, Math.min(25, cleanTarget.length))
            if (spanText && (
              spanText === cleanTarget ||
              spanText.startsWith(targetSample) ||
              cleanTarget.startsWith(spanText.slice(0, Math.min(25, spanText.length))) ||
              (targetSample.length >= 10 && spanText.includes(targetSample))
            )) {
              const beforeMatch = body.slice(0, sm.index)
              const lastNl = beforeMatch.lastIndexOf('\n')
              const lineStart = lastNl === -1 ? 0 : lastNl + 1
              startMatchIdx = lineStart
              break
            }
          }
        }
      }

      // Strategy C: Fallback match by chapter title as a standalone line
      if (startMatchIdx === -1 && chapterTitle) {
        const cleanTarget = normalizeArabicHeading(chapterTitle)
        if (cleanTarget.length >= 2) {
          const lines = body.split('\n')
          let charCount = 0
          for (let li = 0; li < lines.length; li++) {
            const rawLine = lines[li]
            const cleanLine = normalizeArabicHeading(rawLine.replace(/<[^>]+>/g, ''))
            const targetSample = cleanTarget.slice(0, Math.min(25, cleanTarget.length))
            if (cleanLine && (
              cleanLine === cleanTarget ||
              cleanLine.startsWith(targetSample) ||
              cleanTarget.startsWith(cleanLine.slice(0, Math.min(25, cleanLine.length))) ||
              (targetSample.length >= 10 && cleanLine.includes(targetSample))
            )) {
              startMatchIdx = charCount
              break
            }
            charCount += rawLine.length + 1
          }
        }
      }

      // Preserve consecutive preceding parent heading(s) without intervening body text
      // e.g. [كتاب الطهارة] [باب ما تكون به الطهارة من الماء]
      if (startMatchIdx > 0) {
        let checkIdx = startMatchIdx
        while (checkIdx > 0) {
          const textBefore = body.slice(0, checkIdx).trimEnd()
          const prevSpanMatch = textBefore.match(/(?:<span\s+[^>]*data-type\s*=\s*["']?title["']?[^>]*>[\s\S]*?<\/span>)(?:[ \t]*[-–—.:،\)]*)?$/i)
          if (prevSpanMatch && prevSpanMatch.index !== undefined) {
            const between = textBefore.slice(prevSpanMatch.index + prevSpanMatch[0].length)
            const cleanBetween = between.replace(/<[^>]+>/g, '').replace(/[^\u0621-\u064A\u0671-\u06D3\w]/g, '').trim()
            if (cleanBetween.length > 0) {
              // Real body text exists between headings -> do not absorb previous heading
              break
            }
            const lineBeforeSpan = textBefore.slice(0, prevSpanMatch.index)
            const lastNl = lineBeforeSpan.lastIndexOf('\n')
            checkIdx = lastNl === -1 ? 0 : lastNl + 1
            startMatchIdx = checkIdx
          } else {
            break
          }
        }
        body = body.slice(startMatchIdx)
        pageWasSliced = true
      }
    }

    // 2. End Trimming: Check if the following chapter begins on this page
    if (endTocId || nextChapterTitle) {
      let endMatchIdx = -1

      // Strategy A: Match by next TOC ID (handling quoted or unquoted attributes like id=toc-3 or id="toc-3")
      if (endTocId) {
        const idRegex = new RegExp(`(?:<span\\s+[^>]*id\\s*=\\s*["']?${endTocId}["']?[^>]*>[\\s\\S]*?<\\/span>)`, 'i')
        const m = body.match(idRegex)
        if (m && m.index !== undefined) {
          const beforeMatch = body.slice(0, m.index)
          const lastNl = beforeMatch.lastIndexOf('\n')
          const lineTextBeforeMatch = beforeMatch.slice(lastNl === -1 ? 0 : lastNl + 1)
          if (lastNl !== -1 && !/<span\s+[^>]*data-type\s*=\s*["']?title["']?/i.test(lineTextBeforeMatch)) {
            endMatchIdx = lastNl
          } else {
            endMatchIdx = m.index
          }
          chapterEnded = true
        }
      }

      // Strategy B: Fallback match by next chapter title inside a title span
      if (endMatchIdx === -1 && nextChapterTitle) {
        const cleanNext = normalizeArabicHeading(nextChapterTitle)
        if (cleanNext.length >= 2) {
          const spanRegex = /<span\s+[^>]*data-type\s*=\s*["']?title["']?[^>]*>([\s\S]*?)<\/span>/gi
          let sm: RegExpExecArray | null
          while ((sm = spanRegex.exec(body)) !== null) {
            const spanText = normalizeArabicHeading(sm[1].replace(/<[^>]+>/g, ''))
            const targetSample = cleanNext.slice(0, Math.min(25, cleanNext.length))
            if (spanText && (
              spanText === cleanNext ||
              spanText.startsWith(targetSample) ||
              cleanNext.startsWith(spanText.slice(0, Math.min(25, spanText.length))) ||
              (targetSample.length >= 10 && spanText.includes(targetSample))
            )) {
              const beforeMatch = body.slice(0, sm.index)
              const lastNl = beforeMatch.lastIndexOf('\n')
              const lineTextBeforeMatch = beforeMatch.slice(lastNl === -1 ? 0 : lastNl + 1)
              if (lastNl !== -1 && !/<span\s+[^>]*data-type\s*=\s*["']?title["']?/i.test(lineTextBeforeMatch)) {
                endMatchIdx = lastNl
              } else {
                endMatchIdx = sm.index
              }
              chapterEnded = true
              break
            }
          }
        }
      }

      // Strategy C: Fallback match by next chapter title as a standalone line
      if (endMatchIdx === -1 && nextChapterTitle) {
        const cleanNextHeading = normalizeArabicHeading(nextChapterTitle)
        if (cleanNextHeading.length >= 2) {
          const lines = body.split('\n')
          let charCount = 0
          for (let li = 0; li < lines.length; li++) {
            const rawLine = lines[li]
            const cleanLine = normalizeArabicHeading(rawLine.replace(/<[^>]+>/g, ''))
            const targetSample = cleanNextHeading.slice(0, Math.min(25, cleanNextHeading.length))
            if (cleanLine && (
              cleanLine === cleanNextHeading ||
              cleanLine.startsWith(targetSample) ||
              cleanNextHeading.startsWith(cleanLine.slice(0, Math.min(25, cleanLine.length))) ||
              (targetSample.length >= 10 && cleanLine.includes(targetSample))
            )) {
              endMatchIdx = charCount
              chapterEnded = true
              break
            }
            charCount += rawLine.length + 1
          }
        }
      }

      if (endMatchIdx !== -1) {
        body = body.slice(0, endMatchIdx).trim()
        pageWasSliced = true
      }
    }

    // Check if remaining body is empty after slicing; skip phantom blank pages
    const cleanBodyText = body.replace(/<[^>]+>/g, '').replace(/[^\u0621-\u064A\u0671-\u06D3\w]/g, '').trim()
    if (cleanBodyText.length === 0) {
      continue
    }

    // Reassemble with footnotes if present, filtering out footnotes not referenced in body
    const validFootnotes = filterFootnotesByBody(body, footnotes, pageWasSliced)
    let finalPageText = body
    if (validFootnotes) {
      finalPageText += '\n_________\n' + validFootnotes
    }

    result.push({
      pg,
      text: finalPageText
    })
  }

  return result
}

/**
 * Fetch the entire chapter/lesson content by retrieving its page range
 * (e.g. from startPage to endPage) with precise chapter boundary slicing.
 */
export async function fetchTurathChapterText(
  turathId: number,
  startPage: number,
  endPage?: number,
  sliceOptions?: ChapterSliceOptions
): Promise<{ text: string; meta: any } | null> {
  const fromPg = Math.max(1, startPage)
  // Retrieve up to 25 pages per chapter to cover full lessons comprehensively
  const toPg = endPage && endPage >= fromPg ? Math.min(fromPg + 25, endPage) : fromPg

  const pageNumbers: number[] = []
  for (let p = fromPg; p <= toPg; p++) {
    pageNumbers.push(p)
  }

  try {
    const pageResults = await Promise.all(
      pageNumbers.map(p => fetchTurathPage(turathId, p))
    )

    const validPages = pageResults.filter(Boolean) as TurathPageResponse[]
    if (validPages.length === 0) return null

    const baseMeta = validPages[0].meta || {}

    // Prepare pages for chapter slicing
    const pageDataList = validPages.map((p, idx) => ({
      pg: pageNumbers[idx],
      text: p.text || ''
    }))

    // Slice chapter boundaries (removes preceding chapter leftovers & following chapter starts)
    const slicedPages = sliceChapterPages(pageDataList, sliceOptions)

    // Combine texts of non-empty pages in this chapter with explicit page boundary tags
    let combinedText = slicedPages
      .map(p => `<!-- TURATH_PAGE_START pg="${p.pg}" -->\n${p.text}\n<!-- TURATH_PAGE_END pg="${p.pg}" -->`)
      .join('\n\n')

    if (endPage && endPage > toPg) {
      combinedText += `\n\n<div class="turath-continuation-notice" style="margin: 2em 0; padding: 0.9em 1.4em; border-radius: 1.25rem; background: rgba(56,189,248,0.08); border: 1px dashed rgba(56,189,248,0.35); text-align: center; color: #38bdf8; font-size: 0.9em; font-weight: bold;"><span>يتبع هذا الفصل حتى صفحة ${endPage} — يمكنك استخدام أزرار التنقل بالأسفل للمتابعة</span></div>`
    }

    return {
      text: combinedText,
      meta: {
        ...baseMeta,
        page: fromPg,
        page_id: fromPg,
        end_page: toPg
      }
    }
  } catch (err) {
    console.error(`Failed to fetch Turath chapter ${turathId} (p${fromPg}-${toPg}):`, err)
    return null
  }
}

/**
 * Convert Turath level-based headings into a hierarchical TreeNode[]
 * with proper chapter page spans and unique TOC IDs.
 * Each heading's boundary naturally extends to the immediately following heading.
 */
export function convertTurathHeadingsToTree(
  headings: TurathHeading[],
  turathId: number,
  bookTitle: string
): TreeNode[] {
  if (!headings || headings.length === 0) {
    return [
      {
        title: 'قراءة الكتاب (من البداية)',
        chunk_id: `turath_${turathId}_pg_1_to_1`,
        turath_id: turathId,
        page: 1,
        is_turath: true
      }
    ]
  }

  const root: TreeNode[] = []
  const stack: { node: TreeNode; level: number }[] = []

  for (let i = 0; i < headings.length; i++) {
    const h = headings[i]
    const startPage = h.page || 1
    const lvl = h.level || 1

    // The boundary of this lesson: ends where the next heading begins!
    let endPage = startPage
    let nextHeadingTitle: string | undefined = undefined
    let endTocIndex = 0

    if (i + 1 < headings.length) {
      const nextH = headings[i + 1]
      endPage = nextH.page && nextH.page >= startPage ? nextH.page : startPage
      nextHeadingTitle = nextH.title ? nextH.title.trim() : undefined
      endTocIndex = i + 2
    }

    const startTocIndex = i + 1

    const node: TreeNode = {
      title: h.title ? h.title.trim() : `فصل صفحة ${startPage}`,
      chunk_id: `turath_${turathId}_pg_${startPage}_to_${endPage}_toc_${startTocIndex}_next_${endTocIndex}_v5`,
      turath_id: turathId,
      page: startPage,
      toc_id: `toc-${startTocIndex}`,
      next_toc_id: endTocIndex > 0 ? `toc-${endTocIndex}` : undefined,
      next_title: nextHeadingTitle,
      is_turath: true,
      children: []
    }

    // Pop nodes from stack that are at same or deeper level
    while (stack.length > 0 && stack[stack.length - 1].level >= lvl) {
      stack.pop()
    }

    if (stack.length === 0) {
      root.push(node)
    } else {
      const parent = stack[stack.length - 1].node
      if (!parent.children) parent.children = []
      parent.children.push(node)
    }

    stack.push({ node, level: lvl })
  }

  // Prune empty children arrays so they render as clean leaf items with document icons
  function pruneEmptyChildren(nodes: TreeNode[]) {
    for (const n of nodes) {
      if (n.children && n.children.length === 0) {
        delete n.children
      } else if (n.children) {
        pruneEmptyChildren(n.children)
      }
    }
  }

  pruneEmptyChildren(root)
  return root
}
