// Simple Markdown Parser Helper
export function formatMarkdown(text: string, isTurathText: boolean = true, isDark: boolean = true) {
  if (!text) return { __html: '' }

  let html = text
    // Escape HTML to prevent basic XSS
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // =============================================
  // TURATH TEXT PATH — uses inline styles only
  // (no Tailwind bracket classes like text-[#xxx])
  // to prevent bracket regex from corrupting HTML
  // =============================================
  if (isTurathText) {
    // 0. Strip metadata: remove السياق line and النص label
    html = html.replace(/^السياق:\s*\[.*?\]\s*/gim, '')
    html = html.replace(/^النص:\s*/gim, '')

    const bulletColor = isDark ? '#38bdf8' : '#0284c7'
    const titleColor = isDark ? '#38bdf8' : '#0284c7'
    const bracketColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,42,0.55)'
    const bullet = `<span style="color:${bulletColor}; margin-left: 12px; font-size: 1.4em; line-height: 1;">•</span>`

    // 1. Title/Section at the very beginning
    let titleHtml = '';
    html = html.replace(
      /^\s*\[([^\]]+)\]\s*/g,
      (match, p1) => {
        titleHtml = `<span style="display:block; color:${titleColor}; margin-bottom:0.5em; font-size:1.1em; font-weight:bold;">&#91;${p1}&#93;</span>`;
        return ''; // Remove from the main text body
      }
    )

    // 2. Normalize paragraph breaks (convert periods followed by spaces into newlines)
    html = html.replace(/\.\s+/g, '.\n')

    // 3. Wrap each paragraph with a bullet point using Flexbox for perfect alignment
    const paragraphs = html.split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map(p => `
        <div style="margin-bottom: 0.8em; display: flex; align-items: flex-start;">
          <div style="flex-shrink: 0; padding-top: 0.2em;">${bullet}</div>
          <div style="flex-grow: 1;">${p}</div>
        </div>
      `)

    html = titleHtml + paragraphs.join('')

    // 4. Page/volume references: (1 / 232)
    html = html.replace(
      /\((\d+\s*\/\s*\d+)\)/g,
      `<span style="display:inline-flex;align-items:center;background:${isDark ? 'rgba(56,189,248,0.1)' : 'rgba(2,132,199,0.1)'};color:${isDark ? '#38bdf8' : '#0284c7'};border:1px solid ${isDark ? 'rgba(56,189,248,0.25)' : 'rgba(2,132,199,0.25)'};padding:1px 10px;border-radius:9999px;font-size:0.72em;font-weight:600;margin:0 4px;direction:ltr">$1</span>`
    )

    // 5. Bracketed commentary/annotations [...]
    html = html.replace(
      /\[([^\]]+)\]/g,
      `<span style="color:${bracketColor};font-size:0.88em;margin:0 3px">[$1]</span>`
    )

    // 6. Hadiths and Quotes « »
    // This breaks out of the current paragraph's flex container, inserts a beautiful frame, and re-opens the flex container.
    html = html.replace(
      /«(.*?)»\s*([.،,؛]?)/g,
      `</div></div>
       <div style="margin: 1.25em 0.5em; padding: 1em 1.25em 1em 1em; border-right: 4px solid ${isDark ? '#38bdf8' : '#0284c7'}; background-color: ${isDark ? 'rgba(56,189,248,0.08)' : 'rgba(2,132,199,0.08)'}; border-radius: 16px; color: ${isDark ? '#38bdf8' : '#0284c7'}; line-height: 1.8; font-weight: 600; box-shadow: inset 0 0 20px rgba(56,189,248,0.05), 0 1px 2px rgba(0,0,0,0.05);">
         «$1»$2
       </div>
       <div style="margin-bottom: 0.8em; display: flex; align-items: flex-start;">
         <div style="flex-shrink: 0; padding-top: 0.2em; width: 1.4em;"></div>
         <div style="flex-grow: 1;">`
    )

    return { __html: html }
  }

  // =============================================
  // MARKDOWN PATH — for AI/tutor generated content
  // =============================================
  html = html
    // Headers
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2 text-[#38bdf8]">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-5 mb-3 text-[#38bdf8]">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4 text-[#38bdf8]">$1</h1>')

    // Bold and Italic
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-[#8a17c9]">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic text-white/80">$1</em>')

    // Turath / Quote Special Markers & Double-Quoted Matn phrases
    .replace(/«([^»]+)»/g, '<span class="inline-flex items-center px-2 py-0.5 mx-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-[#fcd34d] font-semibold">«$1»</span>')
    .replace(/@([^@]+)@/g, '<span class="inline-flex items-center px-2 py-0.5 mx-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-[#fcd34d] font-semibold">$1</span>')
    .replace(/%([^%]+)%/g, '<span class="inline-flex items-center px-2 py-0.5 mx-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[#34d399] font-semibold">$1</span>')
    .replace(/&amp;([^&]+)&amp;/g, '<span class="inline-flex items-center px-2 py-0.5 mx-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[#34d399] font-semibold">$1</span>')
    .replace(/\$([^\$]+)\$/g, '<span class="inline-flex items-center px-2 py-0.5 mx-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-[#c084fc] font-semibold">$1</span>')
    .replace(/"([^"\n]{2,120})"/g, '"<span class="text-[#fcd34d] font-semibold">$1</span>"')

    // Lists (using div/span to avoid <li> numbering issues without <ul>/<ol>)
    .replace(/^[-*] (.*$)/gim, '<div class="flex gap-2 mr-2 mb-1"><span class="font-bold text-[#38bdf8]">•</span> <span>$1</span></div>')
    .replace(/^(\d+\.) (.*$)/gim, '<div class="flex gap-2 mr-2 mb-1"><span class="font-bold text-[#38bdf8] w-5 shrink-0">$1</span> <span>$2</span></div>')

    // Special formatting for "Context" string
    .replace(/^السياق:\s*\[(.*?)\]/gim, (_match, p1) => {
      const badges = p1.split('|').map((b: string) => `<span class="bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/30 px-3 py-1.5 rounded-full text-xs font-semibold ml-2 mb-2 inline-flex items-center shadow-sm backdrop-blur-md transition-all hover:bg-[#38bdf8]/20">${b.trim()}</span>`).join('');
      return `<div class="mb-8 flex flex-wrap relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-5 shadow-lg">${badges}</div>`;
    })

    // Special formatting for "Text" string
    .replace(/^النص:\s*/gim, '<div class="flex items-center gap-3 mb-6 mt-2"><div class="h-px flex-1 bg-gradient-to-l from-transparent via-white/20 to-transparent"></div><div class="text-[#fcd34d] text-sm font-bold flex items-center gap-2"><span class="text-[#fcd34d]"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></span> المتن الأصلي</div><div class="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div></div>')

  html = html
    // Line breaks (only apply <br/> if the line doesn't start with a block tag or isn't already handled by flex div)
    .replace(/\n/g, '<br />')
    // Remove extra breaks after our divs
    .replace(/<\/div><br \/>/g, '</div>')

  return { __html: html }
}

const unicodeHonorificsMap: Record<string, string> = {
  '\ufdfa': 'ﷺ',
  '\ufd40': 'رحمه الله',
  '\ufd41': 'رضي الله عنه',
  '\ufd42': 'رضي الله عنها',
  '\ufd43': 'رضي الله عنهم',
  '\ufd44': 'رضي الله عنهما',
  '\ufd45': 'رضي الله عنهن',
  '\ufd46': 'صلى الله عليه وآله',
  '\ufd47': 'عليه السلام',
  '\ufd48': 'عليهم السلام',
  '\ufd49': 'عليهما السلام',
  '\ufd4a': 'عليه الصلاة والسلام',
  '\ufd4b': 'قدس سره',
  '\ufd4c': 'صلى الله عليه وآله وسلم',
  '\ufd4d': 'عليها السلام',
  '\ufd4e': 'تبارك وتعالى',
  '\ufd4f': 'رحمهم الله',
  '\ufdfb': 'جل جلاله',
  '\ufdfe': 'سبحانه وتعالى',
  '\ufdff': 'عز وجل',
}

function replaceIslamicLigatures(text: string, isDark: boolean): string {
  if (!text) return text
  let newText = text
  const honorificColor = isDark ? '#94a3b8' : '#64748b'
  const honorificTokens: string[] = []

  const createHonorificBadge = (content: string) => {
    return ` <span class="islamic-honorific" style="color:${honorificColor}; font-size:0.9em; font-weight:normal; margin:0 2px; display:inline; white-space:nowrap; font-family:'Amiri',serif;">- ${content} -</span> `
  }

  // 1. Replace unicode characters first (absorbing surrounding parentheses, spaces, and dashes)
  for (const [key, value] of Object.entries(unicodeHonorificsMap)) {
    const pattern = new RegExp(`[\\s\\(]*[-–—]?\\s*${key}\\s*[-–—]?[\\s\\)]*`, 'g')
    newText = newText.replace(pattern, () => {
      honorificTokens.push(createHonorificBadge(value))
      return `__TURATH_HON_${honorificTokens.length - 1}__`
    })
  }

  // 2. Common phrases (sorted by length descending so longer phrases match first)
  const phrases = [
    'صلى الله عليه وآله وسلم',
    'صلى الله عليه وسلم',
    'صلى الله عليه وآله',
    'رضي الله عنهما',
    'رضي الله عنهن',
    'رضي الله عنهم',
    'رضي الله عنها',
    'رضي الله عنه',
    'عليه الصلاة والسلام',
    'عليهما السلام',
    'عليهم السلام',
    'عليها السلام',
    'عليه السلام',
    'رحمهم الله تعالى',
    'رحمه الله تعالى',
    'رحمهم الله',
    'رحمها الله',
    'رحمه الله',
    'سبحانه وتعالى',
    'تبارك وتعالى',
    'عز وجل',
    'جل جلاله'
  ]

  phrases.forEach(phrase => {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // Match optional surrounding parentheses, spaces, and dashes
    const pattern = new RegExp(`(?<!<[^>]*)[\\s\\(]*[-–—]?\\s*${escaped}\\s*[-–—]?[\\s\\)]*(?![^<]*>)`, 'g')
    newText = newText.replace(pattern, (match) => {
      if (match.includes('__TURATH_HON_')) return match
      honorificTokens.push(createHonorificBadge(phrase))
      return `__TURATH_HON_${honorificTokens.length - 1}__`
    })
  })

  // Restore honorific tokens safely without nested regex issues
  honorificTokens.forEach((tokenHtml, i) => {
    newText = newText.replace(`__TURATH_HON_${i}__`, () => tokenHtml)
  })

  // Normalize any resulting double spaces
  newText = newText.replace(/ {2,}/g, ' ')

  return newText
}

function isPoetryLine(line: string): { s1: string; s2: string } | null {
  const trimmed = line.trim()
  if (!trimmed || /^[\.·\s«»"\-]+$/.test(trimmed)) return null
  if (/^\.{2,}/.test(trimmed) && !trimmed.slice(3).includes('...')) return null
  if (/\.{2,}[»"]*$/.test(trimmed) && !trimmed.slice(0, -3).includes('...')) return null

  // Exclude reference prefixes and volume citations
  if (/^(?:يراجع|انظر|ينظر|أخرجه|رواه|تخريج|سورة|ديوانه|المستقصى|اللسان|تاريخ|تفسير)\b/i.test(trimmed)) {
    return null
  }

  // Pattern: First Hemistich (صدر) ... Second Hemistich (عجز)
  const match = trimmed.match(/^(.+?)\s*(?:\.{3,}|···+|—{2,})\s*(.+)$/)
  if (match) {
    const s1 = match[1].trim()
    const s2 = match[2].trim()
    if (s1.length >= 3 && s2.length >= 3 && s1.length <= 60 && s2.length <= 60) {
      if (/\d+\s*\/\s*\d+/.test(trimmed)) return null
      return { s1, s2 }
    }
  }
  return null
}

function formatPoetryVerse(s1: string, s2: string, isDark: boolean): string {
  return `
    <div class="turath-poetry-verse" style="display: flex; align-items: baseline; justify-content: center; gap: 1em; margin: 0.7em auto; max-width: 95%; font-family: 'Amiri', 'Traditional Arabic', serif; font-size: 1.06em; font-weight: normal; color: ${isDark ? '#fbbf24' : '#b45309'
    }; line-height: 1.85;">
      <span style="flex: 1; text-align: left; min-width: 0;">${s1}</span>
      <span style="opacity: 0.45; font-size: 0.85em; flex-shrink: 0; user-select: none; letter-spacing: 2px;">···</span>
      <span style="flex: 1; text-align: right; min-width: 0;">${s2}</span>
    </div>
  `
}

function normalizeNumeral(numStr: string): string {
  const map: Record<string, string> = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
  }
  return numStr.replace(/[٠-٩]/g, d => map[d] || d).trim()
}

/**
 * Specialized Authentic Classical Arabic Typesetting for Turath Global Pages.
 * - Extracts headings via Turath's semantic <span data-type="title"> tags.
 * - Replaces Islamic ligatures and honorifics (e.g. رحمه الله U+FD40) seamlessly.
 * - Frames each page in its own card with its page badge at the bottom.
 * - Detects footnotes and Sharh via <hr>, <s0>, and _________ dividers.
 * - Beautiful classical Arabic poetry typesetting for hemistich verses.
 * - Formats Quranic verses, prophetic quotes, and bidirectional footnote navigation.
 */
export interface TurathLivePage {
  pgNum: string
  html: string
}

export interface TurathLiveTextResult {
  __html: string
  pages: TurathLivePage[]
  continuationNotice: string
}

export function formatTurathLiveText(
  text: string,
  isDark: boolean = true,
  defaultPage?: number | string
): TurathLiveTextResult {
  if (!text) return { __html: '', pages: [], continuationNotice: '' }

  // 0. If the content is an injected UI notice card (e.g. parent section notice), return directly without book text parsing
  if (text.includes('turath-empty-parent-notice')) {
    return {
      __html: text,
      pages: [{ pgNum: defaultPage ? String(defaultPage) : '', html: text }],
      continuationNotice: ''
    }
  }

  // 1. Check for continuation notices at the very end
  let continuationNotice = ''
  let cleanText = text.replace(/<div class="turath-continuation-notice"[\s\S]*?<\/div>/gi, (match) => {
    continuationNotice = match
    return ''
  })

  // 2. Extract Pages
  interface PageBlock {
    pgNum: string
    content: string
  }

  const pageBlocks: PageBlock[] = []
  const pageRegex = /<!--\s*TURATH_PAGE_START\s+pg=["']?(\d+)["']?\s*-->([\s\S]*?)<!--\s*TURATH_PAGE_END\s+pg=["']?\1["']?\s*-->/gi
  let match: RegExpExecArray | null

  while ((match = pageRegex.exec(cleanText)) !== null) {
    pageBlocks.push({
      pgNum: match[1],
      content: match[2].trim()
    })
  }

  // Fallback: If no explicit page markers exist (single page or legacy cache)
  if (pageBlocks.length === 0) {
    pageBlocks.push({
      pgNum: defaultPage ? String(defaultPage) : '',
      content: cleanText.trim()
    })
  }

  // 3. Process Each Page Individually
  const renderedPagesHtml = pageBlocks.map((block) => {
    const rawContent = block.content
    const pgNum = block.pgNum

    // Collect valid footnote numbers present on this page from rawContent upfront
    const validFootnoteNumbers = new Set<string>()
    const footnoteSeparatorRegex = /(?:<hr\s*\/?>\s*(?:<s\d+>)?|(?:\r?\n|^)\s*(?:_{3,}|[-–—]{3,})\s*(?:\r?\n|$))/gi
    const rawParts = rawContent.split(footnoteSeparatorRegex).filter((p: string) => p && p.trim())
    if (rawParts.length >= 2) {
      const rawFnSection = rawParts[rawParts.length - 1]
      const rawLines = rawFnSection.split('\n')
      for (const line of rawLines) {
        if (/^[-–—]$/.test(line.trim())) continue
        const fnMatch = line.match(/^[\s\n]*(?:\(\^?([١٢٣٤٥٦٧٨٩٠\d]+)\^?\)|\[([١٢٣٤٥٦٧٨٩٠\d]+)\]|([١٢٣٤٥٦٧٨٩٠\d]{1,2})(?:[\.\-:،]\s*|\s+(?=[^\d\s])))(.*)$/)
        if (fnMatch) {
          const rawNum = (fnMatch[1] || fnMatch[2] || fnMatch[3] || '').trim()
          if (rawNum) {
            validFootnoteNumbers.add(normalizeNumeral(rawNum))
          }
        }
      }
    }

    // Helper to format citation numbers into interactive badges
    const replaceCitationsWithBadges = (str: string): string => {
      let res = str.replace(
        /\((\^?[١٢٣٤٥٦٧٨٩٠\d]+\^?)\)/g,
        (fullMatch, inner, offset, allText) => {
          // Do not replace if inside ANY HTML tag or attribute
          const lastOpen = allText.lastIndexOf('<', offset)
          const lastClose = allText.lastIndexOf('>', offset)
          if (lastOpen !== -1 && (lastClose === -1 || lastOpen > lastClose)) {
            return fullMatch
          }

          const hasCaret = inner.includes('^')
          const cleanNum = inner.replace(/\^/g, '').trim()
          const normNum = normalizeNumeral(cleanNum)

          const isValidFootnote = hasCaret || (validFootnoteNumbers.size > 0 && validFootnoteNumbers.has(normNum))
          if (!isValidFootnote) {
            return fullMatch
          }

          const safePg = pgNum || '1'
          const refId = `turath-ref-${safePg}-${normNum}`
          const fnId = `turath-fn-${safePg}-${normNum}`
          return `<a href="#${fnId}" id="${refId}" class="turath-citation-ref" style="text-decoration:none; display:inline-flex; align-items:center; justify-content:center; margin:0 3px; font-family:'Amiri','Noto Naskh Arabic',serif; vertical-align:super; font-size:0.85em; font-weight:700; color:${isDark ? '#38bdf8' : '#0284c7'
            }; background:${isDark ? 'rgba(56,189,248,0.1)' : 'rgba(2,132,199,0.08)'
            }; border:1px solid ${isDark ? 'rgba(56,189,248,0.3)' : 'rgba(2,132,199,0.25)'
            }; padding:0 5px; min-width:20px; height:20px; line-height:20px; border-radius:9999px; cursor:pointer; transition:all 0.2s;" title="انتقل إلى الحاشية ${cleanNum}" onclick="event.preventDefault(); event.stopPropagation(); const target = document.getElementById('${fnId}'); if(target) { target.scrollIntoView({behavior:'smooth', block:'center'}); target.style.transition='background 0.5s'; target.style.backgroundColor='${isDark ? 'rgba(56,189,248,0.22)' : 'rgba(2,132,199,0.15)'}'; setTimeout(() => target.style.backgroundColor='transparent', 1500); }">${cleanNum}</a>`
        }
      )

      // Also support bare unparenthesized footnote numbers ONLY IF they strictly match an actual footnote in validFootnoteNumbers!
      if (validFootnoteNumbers.size > 0) {
        const reservedWords = 'سنة|عام|توفي|ت|ولد|ص|صـ|ج|جـ|الآية|رقم|قاعدة|مسألة|فقرة|حديث|ح|ط|طبعة|الباب|باب'
        const bareRefRegex = new RegExp(`(?<!(?:${reservedWords})\\s*)(?:^|(?<=[\\u0621-\\u064A\\u0671-\\u06D3\\s]))([١٢٣٤٥٦٧٨٩٠\\d]{1,2})(?=(?:\\s+|$|[،.؛:!؟«»"\\(\\)\\[\\]]))(?![-–—])`, 'gu')

        res = res.replace(bareRefRegex, (fullMatch, rawNum, offset, allText) => {
          // CRITICAL: Do not replace if inside ANY HTML tag or attribute!
          const lastOpen = allText.lastIndexOf('<', offset)
          const lastClose = allText.lastIndexOf('>', offset)
          if (lastOpen !== -1 && (lastClose === -1 || lastOpen > lastClose)) {
            return fullMatch
          }

          const normNum = normalizeNumeral(rawNum)
          // CRITICAL: Must be a known footnote on this page!
          if (!validFootnoteNumbers.has(normNum)) {
            return fullMatch
          }

          // Check if this number is at the beginning of a line (e.g. paragraph number like "۲۲-")
          const lineStart = allText.lastIndexOf('\n', offset)
          const textBeforeOnLine = allText.slice(lineStart === -1 ? 0 : lineStart + 1, offset).trim()
          if (!textBeforeOnLine) {
            return fullMatch
          }

          const safePg = pgNum || '1'
          const refId = `turath-ref-${safePg}-${normNum}`
          const fnId = `turath-fn-${safePg}-${normNum}`
          return `<a href="#${fnId}" id="${refId}" class="turath-citation-ref" style="text-decoration:none; display:inline-flex; align-items:center; justify-content:center; margin:0 3px; font-family:'Amiri','Noto Naskh Arabic',serif; vertical-align:super; font-size:0.85em; font-weight:700; color:${isDark ? '#38bdf8' : '#0284c7'
            }; background:${isDark ? 'rgba(56,189,248,0.1)' : 'rgba(2,132,199,0.08)'
            }; border:1px solid ${isDark ? 'rgba(56,189,248,0.3)' : 'rgba(2,132,199,0.25)'
            }; padding:0 5px; min-width:20px; height:20px; line-height:20px; border-radius:9999px; cursor:pointer; transition:all 0.2s;" title="انتقل إلى الحاشية ${rawNum}" onclick="event.preventDefault(); event.stopPropagation(); const target = document.getElementById('${fnId}'); if(target) { target.scrollIntoView({behavior:'smooth', block:'center'}); target.style.transition='background 0.5s'; target.style.backgroundColor='${isDark ? 'rgba(56,189,248,0.22)' : 'rgba(2,132,199,0.15)'}'; setTimeout(() => target.style.backgroundColor='transparent', 1500); }">${rawNum}</a>`
        })
      }

      return res
    }

    // 0. Extract semantic titles FIRST THING directly from untouched rawContent!
    // This completely isolates titles from any ligatures or formatting regex,
    // absorbs leading numbering/bullet prefixes (e.g. ٤-, [١]-, -), and absorbs trailing citations/punctuation directly into the title heading.
    const pageTitles: string[] = []
    let contentWithoutTitles = rawContent.replace(
      /((?:^|\n)[ \t]*(?:(?:(?:ترجمة|رقم|فائدة|مسألة|فرع|قاعدة)\s+)?(?:[-–—•\*]\s*)*(?:[\(\[]?[١٢٣٤٥٦٧٨٩٠\d]+[\)\]]?\s*[-–—.:،\)]\s*|[-–—•\*]\s*)+))?<span\s+data-type=["']title["'][^>]*>([\s\S]*?)<\/span>([^\n\r]*)/gi,
      (_m, prefix, titleContent, restOfLine, offset, fullStr) => {
        let strayPrefix = ''
        let cleanTitleContent = titleContent

        // Only check for stray bracket closure if the text immediately preceding this title has an unclosed bracket '['
        const textBefore = fullStr.slice(0, offset)
        const hasUnclosedBracket = /\[[^\]]*$/.test(textBefore)

        if (hasUnclosedBracket) {
          const bracketSplit = cleanTitleContent.match(/^([\s\S]*?[\]\)\.]\s*)\n+([\s\S]+)$/)
          if (bracketSplit) {
            strayPrefix = bracketSplit[1].trim()
            cleanTitleContent = bracketSplit[2].trim()
          }
        }

        const cleanPrefix = (prefix || '').trim()
        let cleanTitle = cleanTitleContent.replace(/<[^>]+>/g, '').trim()
        let trailingToAttach = ''
        let trailingRemaining = ''

        if (cleanPrefix) {
          // If the line started with a heading prefix (like ٤- or ٢- or -),
          // the rest of the line before \n belongs to the heading!
          trailingToAttach = (restOfLine || '').trim()
        } else {
          // Otherwise, only absorb trailing citations or punctuation
          const punctMatch = (restOfLine || '').match(/^([ \t]*(?:(?:\(\^?[١٢٣٤٥٦٧٨٩٠\d]+\^?\)\.?|[-–—؟?.:!،])+)[ \t]*)(.*)$/)
          if (punctMatch) {
            trailingToAttach = punctMatch[1].trim()
            trailingRemaining = punctMatch[2]
          } else {
            trailingRemaining = restOfLine || ''
          }
        }

        let fullTitle = cleanTitle
        if (cleanPrefix) {
          fullTitle = cleanPrefix + ' ' + fullTitle
        }
        if (trailingToAttach) {
          if (!fullTitle.endsWith(trailingToAttach)) {
            if (/^[-–—]$/.test(trailingToAttach) || /^\(/.test(trailingToAttach)) {
              fullTitle = fullTitle + ' ' + trailingToAttach
            } else {
              fullTitle = fullTitle + ' ' + trailingToAttach
            }
          }
        }

        // Apply citation badge formatting to titles so citations like (^١) are interactive badges
        const formattedTitleWithCitations = replaceCitationsWithBadges(fullTitle)

        const formattedTitle = formattedTitleWithCitations
          .split('\n')
          .map((l: string) => l.trim())
          .filter(Boolean)
          .join('<br />')

        const html = `\n\n<div class="turath-title-block" style="margin: 1.4em 0 1.8em; text-align: center; width: 100%;">
          <h2 style="font-family: inherit; font-size: 1.2em; font-weight: 300; color: ${
            isDark ? '#ffffff' : '#075985'
          }; margin: 0; line-height: 1.6; display: inline-block;">
            ${formattedTitle}
          </h2>
        </div>\n\n`

        pageTitles.push(html)
        return (strayPrefix ? strayPrefix + '\n\n' : '') + `__TURATH_TITLE_${pageTitles.length - 1}__` + (trailingRemaining ? trailingRemaining : '')
      }
    )

    // A. Preprocess ligatures on body text (now titles are safely protected as __TURATH_TITLE_X__)
    let cleanedContent = replaceIslamicLigatures(contentWithoutTitles, isDark)
    cleanedContent = cleanedContent.replace(/\/\.\s*$/gm, '.').replace(/\/\s*$/gm, '')

    // B. Separate Main Body, Sharh, and Footnotes (<hr>, <s0>, or 3+ underscores/hyphens)
    const parts = cleanedContent.split(footnoteSeparatorRegex).filter((p: string) => p && p.trim())

    let mainBody = ''
    let sharhRaw = ''
    let footnotesRaw = ''

    if (parts.length >= 3) {
      mainBody = parts[0]
      sharhRaw = parts.slice(1, parts.length - 1).join('\n\n')
      footnotesRaw = parts[parts.length - 1]
    } else if (parts.length === 2) {
      mainBody = parts[0]
      footnotesRaw = parts[1]
    } else if (parts.length === 1) {
      mainBody = parts[0]
    }

    // Helper for formatting blocks of text (verses, quotes, citations)
    const processContentMarkup = (rawText: string, parseCitations: boolean = true) => {
      let t = rawText
      const quranVerses: string[] = []

      // 1. Remove any remaining raw spans
      t = t.replace(/<span\s+[^>]*>/gi, '').replace(/<\/span>/gi, '')

      // 1.5 Pre-normalize adjacent closing and opening brackets on ayah numbers:
      // e.g. ﴾ ﴿(٤٧)﴾ ->  (٤٧)﴾ and standalone ﴿(٤٧)﴾ -> (٤٧)
      t = t.replace(/﴾\s*﴿\s*\(?([١٢٣٤٥٦٧٨٩٠\d]+)\)?\s*﴾/gu, ' ($1)﴾')
      t = t.replace(/﴾\s*\(?([١٢٣٤٥٦٧٨٩٠\d]+)\)?/gu, ' ($1)﴾')
      t = t.replace(/﴿\s*\(?([١٢٣٤٥٦٧٨٩٠\d]+)\)?\s*﴾/gu, '($1)')

      // 2. Quranic verses ﴿ ... ﴾
      // Extract Quranic verses and format internal verse numbers cleanly.
      // Use standard classical font ('Amiri', serif) on ayah number parentheses
      // so 'Amiri Quran' does NOT transform '(' and ')' into duplicate ornate brackets ﴿ ﴾.
      t = t.replace(/﴿([\s\S]*?)﴾/g, (_match, innerVerse) => {
        const cleanInner = innerVerse.replace(/[﴿﴾]/g, '').trim()
        const formattedInner = cleanInner.replace(
          /(?:\(([١٢٣٤٥٦٧٨٩٠\d]+)\)|\[([١٢٣٤٥٦٧٨٩٠\d]+)\]|۝\s*([١٢٣٤٥٦٧٨٩٠\d]+))/g,
          (_subMatch: string, p1: string, p2: string, p3: string) => {
            const ayahNum = (p1 || p2 || p3 || '').trim()
            return `<span class="turath-ayah-num" style="display:inline; font-family:'Amiri', 'Traditional Arabic', serif; font-variant-numeric:tabular-nums; color:${
              isDark ? '#34d399' : '#059669'
            }; font-weight:normal; margin:0 4px;">(${ayahNum})</span>`
          }
        )

        const verseHtml = `<span class="turath-quran-verse" style="display:inline; font-family:'Amiri Quran', 'Amiri', serif; color:${
          isDark ? '#34d399' : '#059669'
        }; font-weight:normal; margin:0 2px;">﴿${formattedInner}﴾</span>`

        quranVerses.push(verseHtml)
        return `__TURATH_QURAN_${quranVerses.length - 1}__`
      })

      // 3. Quran Surah citations e.g. [الأنفال: ١١] or [النساء: ٤٣]
      t = t.replace(
        /\[\s*([\u0621-\u064A\u0671-\u06D3\s]+?)\s*[:،]\s*([١٢٣٤٥٦٧٨٩٠\d]+(?:\s*[-–—]\s*[١٢٣٤٥٦٧٨٩٠\d]+)?)\s*\]/gu,
        (_match, surah, ayah) => {
          const cleanSurah = surah.trim()
          const cleanAyah = ayah.trim()
          return `<span class="turath-surah-ref" style="display:inline; color:${
            isDark ? '#94a3b8' : '#64748b'
          }; font-weight:normal; margin:0 2px;">[${cleanSurah}: ${cleanAyah}]</span>`
        }
      )

      // 4. Quotes « ... »
      t = t.replace(
        /«(.*?)»/g,
        `<span style="display:inline; color:${isDark ? '#fbbf24' : '#d97706'
        }; font-weight:normal; margin:0 2px;">«$1»</span>`
      )

      // 4.5. Parentheses (Words, Surah names, etc.) - handles multiple like ((...))
      t = t.replace(
        /(\(+)([^()]*)(\)+)/g,
        (match, openP, inner, closeP) => {
          // Skip if it contains HTML tags (to avoid breaking existing formatting)
          if (/<[^>]+>/.test(inner)) return match;

          // Skip if it's just numbers (citations) or volume/page refs (e.g. 1 / 232)
          if (/^[\d١٢٣٤٥٦٧٨٩٠\^]+$/.test(inner.trim()) || /^\d+\s*\/\s*\d+$/.test(inner.trim())) {
            return match;
          }
          return `<span style="display:inline; color:${isDark ? '#38bdf8' : '#0284c7'
            }; font-weight:normal; margin:0 2px;">${match}</span>`;
        }
      )

      // 5. Standalone honorific ﷺ (if not already styled)
      t = t.replace(
        /(?<![-–—]\s*)ﷺ(?!\s*[-–—])/g,
        `<span class="islamic-honorific" style="color:${isDark ? '#94a3b8' : '#64748b'}; font-size:0.9em; font-weight:normal; margin:0 2px; display:inline; white-space:nowrap; font-family:'Amiri',serif;">- ﷺ -</span>`
      )

      // Note: Removed artificial divine names regex (الله, ربنا, etc.) completely
      // as requested so names flow naturally with text without artificial cyan/blue highlighting.

      // 6. Citation Numbers: (^١) or (١^) or (١) -> Subtle classical badge
      if (parseCitations) {
        t = replaceCitationsWithBadges(t)
      }

      // Volume and page references: (1 / 232)
      t = t.replace(
        /\((\d+\s*\/\s*\d+)\)/g,
        `<span style="display:inline-flex;align-items:center;background:${isDark ? 'rgba(56,189,248,0.1)' : 'rgba(2,132,199,0.1)'
        };color:${isDark ? '#38bdf8' : '#0284c7'
        };border:1px solid ${isDark ? 'rgba(56,189,248,0.25)' : 'rgba(2,132,199,0.25)'
        };padding:1px 8px;border-radius:9999px;font-size:0.75em;font-weight:600;margin:0 4px;direction:ltr">$1</span>`
      )

      // Restore Quran verses
      quranVerses.forEach((verseHtml, i) => {
        t = t.replace(`__TURATH_QURAN_${i}__`, () => verseHtml)
      })

      // Restore titles
      pageTitles.forEach((titleHtml, i) => {
        t = t.replace(`__TURATH_TITLE_${i}__`, () => titleHtml)
      })

      return t
    }

    const highlightLineStartMarkers = (line: string): string => {
      const color = isDark ? '#38bdf8' : '#0284c7'; // Sky-400 for dark, Sky-700 for light

      // 1. Matches strictly at the start of the line (with optional colon/dash)
      const startPattern = /^(?:(?:و|ف|ثم\s+)?(?:(?:الوجه|القسم|الشرط|السبب|الركن|القول|المذهب|الدليل|النوع|الصنف|الأمر)\s+)?(?:الأول|الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|التاسع|العاشر|الحادي عشر|الثاني عشر|أولا|ثانيا|ثالثا|رابعا|خامسا|سادسا|سابعا|ثامنا|تاسعا|عاشرا|أولاً|ثانياً|ثالثاً|رابعاً|خامساً|سادساً|سابعاً|ثامناً|تاسعاً|عاشراً|قلت|فيه|فصل|تنبيه|مسألة|فرع|فائدة|مطلب|خاتمة|تتمة|مقدمة|س|ج|سؤال|جواب))(?=\s|[:.-]|$)(?:\s*[:.-]+)?/u;

      let processed = line.replace(startPattern, (match) => {
        return `<span style="color: ${color}; font-weight: 800; font-size: 1.05em; margin-left: 4px;">${match}</span>`;
      });

      // 2. Matches anywhere in the line IF preceded by space/punctuation AND strictly followed by a colon ":"
      const midPattern = /(^|[\s،,.\-—–]+)((?:و|ف|ثم\s+)?(?:قلت|فيه|فصل|تنبيه|مسألة|فرع|فائدة|مطلب|خاتمة|تتمة|مقدمة|س|ج|سؤال|جواب))(\s*[:])/gu;

      processed = processed.replace(midPattern, (match, prefix, keyword, suffix) => {
        return `${prefix}<span style="color: ${color}; font-weight: 800; font-size: 1.05em; margin-left: 4px;">${keyword}${suffix}</span>`;
      });

      // 3. Highlight Quranic/Divine introductions (قوله تعالى، قال تعالى، إلخ) anywhere
      const divineIntroPattern = /(^|[\s،,.\-—–])((?:[وفلبك])?(?:قال|قوله)\s+(?:تعالى|عز\s*وجل|تبارك\s*وتعالى|سبحانه(?: وتعالى)?))(\s*[:]?)/gu;
      processed = processed.replace(divineIntroPattern, (match, prefix, keyword, suffix) => {
        return `${prefix}<span style="color: ${color}; font-weight: 800; font-size: 1.05em; margin: 0 2px;">${keyword}${suffix}</span>`;
      });

      return processed;
    }

    // Helper to format text blocks into natural paragraphs (<br /> within paragraphs) and poetry verses
    const renderParagraphBlocks = (textWithDivs: string) => {
      // Re-join any bracketed citations [ ... ] that were accidentally split across newlines
      const normalizedText = textWithDivs.replace(/\[([^\]]*?)\n+([^\]]*?)\]/g, '[$1 $2]')
      const rawBlocks = normalizedText.split(/\n\s*\n+/).map((b: string) => b.trim()).filter(Boolean)

      return rawBlocks.map((block: string) => {
        if (block.startsWith('<div')) return block
        if (/^[-–—]$/.test(block)) return ''

        const rawLines = block
          .split('\n')
          .map((l: string) => l.trim())
          .filter((l: string) => l && !/^[-–—]$/.test(l))

        if (rawLines.length === 0) return ''

        // Merge orphan citation lines so a footnote badge alone on a line never causes an isolated line
        const lines: string[] = []
        for (let i = 0; i < rawLines.length; i++) {
          const l = rawLines[i]
          const isOrphanCitation = /^[\s\.\-،]*<a\s[^>]*class=["']turath-citation-ref["'][^>]*>[\s\S]*?<\/a>[\s\.\-،]*$/i.test(l)
          if (isOrphanCitation) {
            if (lines.length > 0) {
              lines[lines.length - 1] += ' ' + l
            } else if (i + 1 < rawLines.length) {
              rawLines[i + 1] = l + ' ' + rawLines[i + 1]
            } else {
              lines.push(l)
            }
          } else {
            lines.push(l)
          }
        }

        const hasPoetry = lines.some((l: string) => isPoetryLine(l) !== null)

        if (!hasPoetry) {
          // Pure prose block: lines flow naturally with <br /> and standard comfortable line-height
          const formattedLines = lines.map(highlightLineStartMarkers)
          return `<p style="margin-bottom: 0.9em; line-height: 1.8; font-size: 1.08em; text-align: justify;">${formattedLines.join('<br />')}</p>`
        }

        // Mixed block with poetry verses: group prose lines and separate poetry verses
        const elements: string[] = []
        let proseAccumulator: string[] = []

        const flushProse = () => {
          if (proseAccumulator.length > 0) {
            elements.push(`<p style="margin-bottom: 0.75em; line-height: 1.8; font-size: 1.08em; text-align: justify;">${proseAccumulator.join('<br />')}</p>`)
            proseAccumulator = []
          }
        }

        for (const line of lines) {
          if (/^[-–—]$/.test(line)) continue
          const poetry = isPoetryLine(line)
          if (poetry) {
            flushProse()
            elements.push(formatPoetryVerse(poetry.s1, poetry.s2, isDark))
          } else {
            proseAccumulator.push(highlightLineStartMarkers(line))
          }
        }
        flushProse()

        return elements.join('\n')
      }).filter(Boolean).join('\n')
    }

    // C. Format Main Body paragraphs & poetry verses
    const processedMain = processContentMarkup(mainBody)
    const mainBodyHtml = renderParagraphBlocks(processedMain)

    // D. Format Sharh Section (if present)
    let sharhHtml = ''
    if (sharhRaw.length > 0) {
      const processedSharh = processContentMarkup(sharhRaw)
      const formattedSharhContent = renderParagraphBlocks(processedSharh)

      sharhHtml = `
        <div class="turath-sharh-section" style="margin-top: 2em; margin-bottom: 1.5em;">
          <div style="position: relative; margin: 2em 0 1.5em; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; inset: 0; display: flex; align-items: center;">
              <div style="width: 100%; border-top: 1.5px dashed ${isDark ? 'rgba(251,191,36,0.35)' : 'rgba(217,119,6,0.35)'};"></div>
            </div>
            <div style="position: relative; padding: 0.25em 1.2em; font-size: 0.78em; font-weight: 800; border-radius: 9999px; background: ${isDark ? '#1a0730' : '#ffffff'}; border: 1.5px solid ${isDark ? 'rgba(251,191,36,0.4)' : 'rgba(217,119,6,0.4)'}; color: ${isDark ? '#fbbf24' : '#d97706'}; font-family:'Cairo',sans-serif;">
              الشرح والبيان
            </div>
          </div>
          <div>${formattedSharhContent}</div>
        </div>
      `
    }

    // E. Format Footnotes Section with clean divider line and interactive bidirectional links
    let footnotesHtml = ''
    if (footnotesRaw.length > 0) {
      const rawLines = footnotesRaw
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0)

      interface RawFnGroup {
        num: string
        firstLine: string
        extraLines: string[]
      }

      const groups: RawFnGroup[] = []
      let currentGroup: RawFnGroup | null = null

      for (const line of rawLines) {
        if (/^[-–—]$/.test(line)) continue
        const fnMatch = line.match(/^[\s\n]*(?:\(\^?([١٢٣٤٥٦٧٨٩٠\d]+)\^?\)|\[([١٢٣٤٥٦٧٨٩٠\d]+)\]|([١٢٣٤٥٦٧٨٩٠\d]{1,2})(?:[\.\-:،]\s*|\s+(?=[^\d\s])))(.*)$/)
        if (fnMatch) {
          if (currentGroup) {
            groups.push(currentGroup)
          }
          currentGroup = {
            num: (fnMatch[1] || fnMatch[2] || fnMatch[3] || '').trim(),
            firstLine: (fnMatch[4] || '').trim(),
            extraLines: []
          }
        } else {
          if (currentGroup) {
            currentGroup.extraLines.push(line)
          } else {
            groups.push({
              num: '',
              firstLine: line,
              extraLines: []
            })
          }
        }
      }
      if (currentGroup) {
        groups.push(currentGroup)
      }

      const formattedFootnotes = groups.map(group => {
        const cleanNum = group.num
        const safePg = pgNum || '1'
        const normNum = normalizeNumeral(cleanNum)
        const refId = `turath-ref-${safePg}-${normNum}`
        const fnId = `turath-fn-${safePg}-${normNum}`

        const firstLineMarkup = processContentMarkup(group.firstLine, false)

        const extraLinesMarkup = group.extraLines.map(extra => {
          const poetry = isPoetryLine(extra)
          if (poetry) {
            return formatPoetryVerse(poetry.s1, poetry.s2, isDark)
          }
          return `<div style="margin-top: 0.35em;">${processContentMarkup(extra, false)}</div>`
        }).join('')

        if (cleanNum) {
          return `
            <div id="${fnId}" class="turath-footnote-item" style="margin-bottom: 0.8em; line-height: 1.85; font-size: 0.9em; opacity: ${isDark ? '0.92' : '0.88'
            }; border-radius: 8px; padding: 4px 6px; transition: background 0.4s ease; direction: rtl; text-align: right;">
              <div style="display: flex; flex-direction: row; align-items: flex-start; gap: 10px; width: 100%;">
                <div style="flex-shrink: 0; margin-top: -3px;">
                  <a href="#${refId}" class="turath-fn-backref" style="text-decoration:none; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; font-family:'Amiri','Noto Naskh Arabic',serif; font-size:1em; font-weight:700; color:${isDark ? '#38bdf8' : '#0284c7'
            }; background:${isDark ? 'rgba(56,189,248,0.1)' : 'rgba(2,132,199,0.08)'
            }; border:1px solid ${isDark ? 'rgba(56,189,248,0.3)' : 'rgba(2,132,199,0.25)'
            }; padding:0 8px; min-width:26px; height:26px; line-height:26px; border-radius:9999px; cursor:pointer; transition:all 0.2s; box-shadow: ${isDark ? '0 2px 8px rgba(56,189,248,0.1)' : 'none'};" title="العودة إلى موضع الإحالة في النص (${cleanNum})" onmouseover="this.style.boxShadow='${isDark ? '0 4px 12px rgba(56,189,248,0.3)' : '0 2px 6px rgba(2,132,199,0.2)'}'; this.style.backgroundColor='${isDark ? 'rgba(56,189,248,0.2)' : 'rgba(2,132,199,0.15)'}';" onmouseout="this.style.boxShadow='${isDark ? '0 2px 8px rgba(56,189,248,0.1)' : 'none'}'; this.style.backgroundColor='${isDark ? 'rgba(56,189,248,0.1)' : 'rgba(2,132,199,0.08)'}';" onclick="event.preventDefault(); event.stopPropagation(); const ref = document.getElementById('${refId}'); if(ref) { ref.scrollIntoView({behavior:'smooth', block:'center'}); ref.style.transition='all 0.5s'; ref.style.boxShadow='0 0 14px ${isDark ? '#38bdf8' : '#0284c7'}'; ref.style.backgroundColor='${isDark ? 'rgba(56,189,248,0.3)' : 'rgba(2,132,199,0.2)'}'; setTimeout(() => { ref.style.boxShadow='none'; ref.style.backgroundColor='${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)'}'; }, 1600); }">${cleanNum}</a>
                </div>
                <div style="flex: 1; min-width: 0; text-align: justify; text-justify: inter-word;">
                  <div style="display: inline; line-height: 1.85;">${firstLineMarkup}</div>
                  ${extraLinesMarkup}
                </div>
              </div>
            </div>
          `
        }

        // Unnumbered footnote line
        return `
          <div style="margin-bottom: 0.65em; line-height: 1.85; font-size: 0.9em; opacity: ${isDark ? '0.88' : '0.85'
          }; text-align: justify; padding: 4px 6px; padding-right: 34px; direction: rtl;">
            ${firstLineMarkup}
            ${extraLinesMarkup}
          </div>
        `
      }).join('')

      footnotesHtml = `
        <div class="turath-footnote-section" style="margin-top: 2.4em; padding-top: 0.8em; direction: rtl; text-align: right;">
          <div style="position: relative; margin: 2em 0 1.5em; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; inset: 0; display: flex; align-items: center;">
              <div style="width: 100%; border-top: 1.5px dashed ${isDark ? 'rgba(56,189,248,0.35)' : 'rgba(2,132,199,0.35)'};"></div>
            </div>
            <div style="position: relative; padding: 0.25em 1.2em; font-size: 0.78em; font-weight: 800; border-radius: 9999px; background: ${isDark ? '#1a0730' : '#ffffff'}; border: 1.5px solid ${isDark ? 'rgba(56,189,248,0.4)' : 'rgba(2,132,199,0.4)'}; color: ${isDark ? '#38bdf8' : '#0284c7'}; font-family:'Cairo',sans-serif;">
              الحواشي
            </div>
          </div>
          <div style="padding-right: 4px;">
            ${formattedFootnotes}
          </div>
        </div>
      `
    }

    // F. Assemble Page Card: Classical Amiri typography, solid luxury background, centered bottom page badge
    return `
      <div class="turath-page-card font-amiri" style="font-family: 'Amiri', 'Traditional Arabic', serif; margin-bottom: 3.5em; border: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(56,189,248,0.35)'
      }; border-radius: 24px; background: ${isDark ? '#160D21' : '#ffffff'
      }; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); padding: 2.2em 2.4em 2.8em; box-shadow: ${isDark ? '0 20px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.3)' : '0 10px 30px rgba(56,189,248,0.1)'
      }; position: relative; transition: all 0.3s ease; direction: rtl; text-align: right;">
        <div class="turath-page-main">
          ${mainBodyHtml}
        </div>
        ${sharhHtml}
        ${footnotesHtml}
        ${pgNum
        ? `
          <div style="position: absolute; bottom: -17px; left: 0; right: 0; display: flex; align-items: center; justify-content: center; z-index: 10; pointer-events: none;">
            <div style="pointer-events: auto; display: inline-flex; align-items: center; justify-content: center; gap: 0.45em; padding: 0.38em 1.5em; border-radius: 9999px; background: ${isDark ? '#1a0733' : '#ffffff'
        }; color: ${isDark ? '#38bdf8' : '#0284c7'
        }; font-family: 'Cairo', system-ui, sans-serif; border: 1.5px solid ${isDark ? 'rgba(56,189,248,0.45)' : 'rgba(2,132,199,0.35)'
        }; box-shadow: ${isDark ? '0 4px 16px rgba(0,0,0,0.5)' : '0 4px 14px rgba(56,189,248,0.2)'
        }; direction: rtl;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: ${isDark ? '#38bdf8' : '#0284c7'
        };"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              <span style="font-size: 0.86em; font-weight: 700; line-height: 1;">صفحة</span>
              <span style="font-size: 0.94em; font-weight: 800; line-height: 1; font-family: 'Cairo', system-ui, sans-serif; font-variant-numeric: tabular-nums; direction: ltr;">${pgNum}</span>
            </div>
          </div>
        `
        : ''
      }
      </div>
    `
  })

  const pages: TurathLivePage[] = pageBlocks.map((block, idx) => ({
    pgNum: block.pgNum || String(idx + 1),
    html: renderedPagesHtml[idx]
  }))

  return {
    __html: renderedPagesHtml.join('') + continuationNotice,
    pages,
    continuationNotice
  }
}
