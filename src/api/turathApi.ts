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

/**
 * Fetch the entire chapter/lesson content by retrieving its page range
 * (e.g. from startPage to endPage) and combining them seamlessly.
 */
export async function fetchTurathChapterText(
  turathId: number,
  startPage: number,
  endPage?: number
): Promise<{ text: string; meta: any } | null> {
  const fromPg = Math.max(1, startPage)
  // Retrieve up to 15 pages per chapter to cover full lessons comprehensively
  const toPg = endPage && endPage >= fromPg ? Math.min(fromPg + 14, endPage) : fromPg

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

    // Combine texts of all pages in this chapter
    let combinedText = validPages
      .map((p, idx) => {
        const pgNum = pageNumbers[idx]
        const header = pageNumbers.length > 1
          ? `\n\n<div style="margin: 1.5em 0 0.8em; padding: 0.2em 0.8em; border-radius: 9999px; background: rgba(56,189,248,0.1); color: #38bdf8; font-size: 0.8em; font-weight: bold; display: inline-flex; align-items: center; gap: 0.4em;"><span>صفحة ${pgNum}</span></div>\n\n`
          : ''
        return header + (p.text || '')
      })
      .join('\n')

    if (endPage && endPage > toPg) {
      combinedText += `\n\n<div style="margin: 2em 0; padding: 0.8em 1.2em; border-radius: 1rem; background: rgba(56,189,248,0.08); border: 1px dashed rgba(56,189,248,0.3); text-align: center; color: #38bdf8; font-size: 0.85em; font-weight: bold;"><span>يتبع هذا الفصل حتى صفحة ${endPage} — يمكنك استخدام أزرار التنقل بالأسفل للمتابعة</span></div>`
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
 * with proper chapter page spans.
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

  // Pre-calculate chapter page boundaries (startPage to endPage)
  const root: TreeNode[] = []
  const stack: { node: TreeNode; level: number }[] = []

  for (let i = 0; i < headings.length; i++) {
    const h = headings[i]
    const startPage = h.page || 1

    // Find the next heading page to determine this chapter's end page
    let endPage = startPage
    for (let j = i + 1; j < headings.length; j++) {
      if (headings[j].page && headings[j].page > startPage) {
        endPage = Math.max(startPage, headings[j].page - 1)
        break
      }
    }

    const node: TreeNode = {
      title: h.title ? h.title.trim() : `فصل صفحة ${startPage}`,
      chunk_id: `turath_${turathId}_pg_${startPage}_to_${endPage}`,
      turath_id: turathId,
      page: startPage,
      is_turath: true,
      children: []
    }

    const lvl = h.level || 1

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
