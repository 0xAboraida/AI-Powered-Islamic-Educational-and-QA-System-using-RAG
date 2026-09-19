import { jsPDF } from 'jspdf'
import { toCanvas } from 'html-to-image'
import zadDarkLogo from '@/assets/images/ZadDarkLogo.png'
import type { Message, CitationDTO } from '../features/chat/data'

function autoIndentSubLists(text: string): string {
  if (!text) return text
  const lines = text.split('\n')
  const result: string[] = []

  const parentStack: number[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const match = line.match(/^([ \t]*)([\*\-\+]|\d+\.|[\u0600-\u06FF]\.)[ \t]+(.*)$/)

    if (match) {
      const origIndent = match[1].length
      const marker = match[2]
      const content = match[3].trim()

      const cleanContent = content.replace(/[\*\_\s]+$/g, '')
      const colonIdx = content.search(/[:؛]/)
      let isHeaderTitleBullet = false

      if (colonIdx !== -1) {
        const afterColon = content.slice(colonIdx + 1).replace(/[\*\_\s]+/g, '')
        if (afterColon.length === 0 && /[:؛]$/.test(cleanContent)) {
          isHeaderTitleBullet = true
        }
      }

      let levelFromIndent = 0
      if (origIndent > 0) {
        if (origIndent <= 3) levelFromIndent = 1
        else if (origIndent <= 6) levelFromIndent = 1
        else if (origIndent <= 10) levelFromIndent = 2
        else if (origIndent <= 14) levelFromIndent = 3
        else levelFromIndent = Math.floor(origIndent / 4)
      }

      let effectiveLevel = levelFromIndent

      if (origIndent === 0 && parentStack.length > 0) {
        effectiveLevel = parentStack.length
      }

      while (parentStack.length > 0 && effectiveLevel <= parentStack[parentStack.length - 1]) {
        parentStack.pop()
      }

      const indentStr = '  '.repeat(effectiveLevel)
      result.push(`${indentStr}${marker} ${content}`)

      if (isHeaderTitleBullet) {
        parentStack.push(effectiveLevel)
      }
    } else {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('>') || trimmed.startsWith('```')) {
        parentStack.length = 0
      }
      result.push(line)
    }
  }

  return result.join('\n')
}

function preprocessFrameText(frameStr: string): string {
  let text = frameStr

  // Remove standalone lines containing only a period or dot
  text = text.replace(/^\s*[\.\u06D4]\s*$/gm, '')

  // 1. Fix missing spaces in headings
  text = text.replace(/^(#{1,4})([0-9]+\.|[\u0600-\u06FF]+\.)/gm, '$1 $2')

  // 2. Fix squashed text
  text = text.replace(/([^\s#])[ \t]+(#{1,4}[ \t]+)/g, '$1\n\n$2')
  text = text.replace(/([^\s#])[ \t]+([0-9]+\.[ \t]+\*\*)/g, '$1\n\n$2')
  text = text.replace(/([^\s#])[ \t]+([\u0600-\u06FF]\.[ \t]+\*\*)/g, '$1\n\n$2')
  text = text.replace(/\*\*((?:الخلاص[ةه]|توضيح|ملاحظ[ةه]|تنبيه|فائدة).*?)\*\*/g, '**__BADGE__$1**')
  text = text.replace(/([^\s#])[ \t]+(\*[ \t]+\*\*)/g, '$1\n\n$2')
  text = text.replace(/([^\s#])[ \t]+(-[ \t]+\*\*)/g, '$1\n\n$2')

  // 3. Title markers
  text = text.replace(/^([ \t]*)([\u0600-\u06FF0-9]+[\.\-][ \t]+)\*\*(.*?)\*\*([:؛]?)[ \t]+/gm, '$1$2**__TITLE__$3$4**  \n')

  // Remove horizontal rules
  text = text.replace(/^[\-_]{3,}\s*$/gm, '')

  // Qur'an: &Ayah& -> tagged blockquote
  text = text.replace(/^([ \t]*)(.*?)&([^&\r\n]+)&(?:[ \t]*(?:\r?\n[ \t]*)?\^([^\^\r\n]+)\^)?(.*)$/gm, (match, indent, before, quote, ref, after) => {
    let res = ''
    if (before.trim()) res += `${indent}${before.trim()}\n\n`
    const refTag = ref ? `[REF:${ref.trim()}]` : ''
    res += `\n${indent}> [QURAN]${refTag} ${quote.trim()}\n`
    const cleanAfter = (after || '').replace(/^[.\u06D4\s]+/, '')
    if (cleanAfter.trim()) res += `\n${indent}${cleanAfter.trim()}\n\n`
    return res
  })

  // Hadith: %Hadith% -> tagged blockquote
  text = text.replace(/^([ \t]*)(.*?)%([^%\r\n]+)%(?:[ \t]*(?:\r?\n[ \t]*)?\^([^\^\r\n]+)\^)?(.*)$/gm, (match, indent, before, quote, ref, after) => {
    let res = ''
    if (before.trim()) res += `${indent}${before.trim()}\n\n`
    const refTag = ref ? `[REF:${ref.trim()}]` : ''
    res += `\n${indent}> [HADITH]${refTag} ${quote.trim()}\n`
    const cleanAfter = (after || '').replace(/^[.\u06D4\s]+/, '')
    if (cleanAfter.trim()) res += `\n${indent}${cleanAfter.trim()}\n\n`
    return res
  })

  // Scholars' sayings: @Saying@
  text = text.replace(/^([ \t]*)(.*?)@([^@\r\n]+)@(?:[ \t]*(?:\r?\n[ \t]*)?\^([^\^\r\n]+)\^)?(.*)$/gm, (match, indent, before, quote, ref, after) => {
    let res = ''
    if (before.trim()) res += `${indent}${before.trim()}\n\n`
    const refTag = ref ? `[REF:${ref.trim()}]` : ''
    res += `\n${indent}> [SAYING]${refTag} ${quote.trim()}\n`
    const cleanAfter = (after || '').replace(/^[.\u06D4\s]+/, '')
    if (cleanAfter.trim()) res += `\n${indent}${cleanAfter.trim()}\n\n`
    return res
  })

  // Poetry: $Poetry$
  text = text.replace(/^([ \t]*)(.*?)\$([^$\r\n]+)\$(?:[ \t]*(?:\r?\n[ \t]*)?\^([^\^\r\n]+)\^)?(.*)$/gm, (match, indent, before, quote, ref, after) => {
    let res = ''
    if (before.trim()) res += `${indent}${before.trim()}\n\n`
    const refTag = ref ? `[REF:${ref.trim()}]` : ''
    res += `\n${indent}> [POETRY]${refTag} ${quote.trim()}\n`
    const cleanAfter = (after || '').replace(/^[.\u06D4\s]+/, '')
    if (cleanAfter.trim()) res += `\n${indent}${cleanAfter.trim()}\n\n`
    return res
  })

  text = text.replace(/^\s*[\.\u06D4]\s*$/gm, '')
  text = text.replace(/([^\n])\n([ \t]*)([0-9]+\.|[\u0600-\u06FF]\.|\*|-)[ \t]+/g, '$1\n\n$2$3 ')
  text = text.replace(/\+\+([^+]+)\+\+/g, '~~$1~~')
  text = text.replace(/«([^»\n]+)»/g, '~~«$1»~~')
  text = autoIndentSubLists(text)
  text = text.replace(/\n{3,}/g, '\n\n')

  return text.trim()
}

export function buildCleanPrintablePdfContainer(
  rawText: string,
  citations?: CitationDTO[],
  lessonTitle?: string
): HTMLElement {
  const container = document.createElement('div')
  container.id = 'pdf-export-container'
  container.style.position = 'absolute'
  container.style.top = '0'
  container.style.left = '0'
  container.style.zIndex = '-99999'
  container.style.opacity = '0.99'
  container.style.pointerEvents = 'none'
  container.style.width = '794px' // A4 pixel width at 96 DPI
  container.style.backgroundColor = '#ffffff'
  container.style.color = '#0f172a'
  container.style.fontFamily = "Cairo, 'Traditional Arabic', system-ui, -apple-system, sans-serif"
  container.style.padding = '0'
  container.style.margin = '0'
  container.style.boxSizing = 'border-box'
  container.setAttribute('dir', 'rtl')

  const dateStr = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
  const docId = `ZAD-${Math.floor(100000 + Math.random() * 900000)}`

  // Extract or build full tree hierarchy breadcrumb path (e.g. الفقه › المغني › كتاب الصلاة › باب الأذان والإقامة)
  let activeLessonTitle = lessonTitle
  if (!activeLessonTitle && citations && citations.length > 0) {
    for (const c of citations) {
      if (c.hierarchy) {
        if (typeof c.hierarchy === 'string' && c.hierarchy.trim().length > 0) {
          activeLessonTitle = c.hierarchy
            .split(/[\/>>]+/)
            .map(s => s.trim())
            .filter(Boolean)
            .join(' ‹ ')
          break
        } else if (Array.isArray(c.hierarchy) && (c.hierarchy as any[]).length > 0) {
          activeLessonTitle = (c.hierarchy as string[]).join(' ‹ ')
          break
        }
      }

      const bTitle = c.book_title || c.bookTitle
      const sTitle = (c as any).section_title || (c as any).sectionTitle
      const parts = [c.madhhab, bTitle, sTitle].filter(Boolean)
      if (parts.length > 0) {
        activeLessonTitle = parts.join(' ‹ ')
        break
      }
    }
  }

  if (!activeLessonTitle) {
    activeLessonTitle = 'منصة زاد للعلوم الشرعية — وثيقة تفاعلية'
  }

  // Process and format breadcrumb pathway cleanly, and extract last title
  let formattedPathwayHtml = ''
  let lastTitle = 'ملخص المطلب الشرعي'
  if (activeLessonTitle) {
    const parts = activeLessonTitle
      .split(/[\/>>←\->‹›]+/)
      .map(s => s.trim())
      .filter(Boolean)

    if (parts.length > 0) {
      lastTitle = parts[parts.length - 1]
      formattedPathwayHtml = parts.map((part, index) => {
        const isLast = index === parts.length - 1
        if (isLast) {
          return `<span style="color: #ffffff; font-weight: 900; background: rgba(255,255,255,0.18); padding: 2px 9px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.35); display: inline-block;">${part}</span>`
        }
        return `<span style="color: #e9d5ff; font-weight: 800;">${part}</span>`
      }).join(' <span style="color: #fbbf24; font-weight: 900; font-size: 11px; margin: 0 5px;">◀</span> ')
    }
  }

  if (!formattedPathwayHtml) {
    formattedPathwayHtml = '<span style="color: #ffffff; font-weight: 800;">منصة زاد للعلوم الشرعية والتربوية</span>'
  }

  // Top luxury gradient ribbon, Clean Header, and Dark Hierarchy Banner
  let html = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Cairo:wght@400;600;700;800;900&display=swap');
    </style>
    <!-- Top Luxury Gradient Ribbon -->
    <div style="height: 6px; background: linear-gradient(90deg, #f59e0b 0%, #10b981 35%, #7c3aed 70%, #db2777 100%);"></div>

    <!-- Main Branding Header Area -->
    <div style="padding: 20px 36px 16px; background: linear-gradient(180deg, #faf5ff 0%, #ffffff 100%); border-bottom: 1px solid #ede9fe;">
      <table style="width: 100%; border-collapse: collapse; margin: 0; padding: 0; table-layout: fixed;">
        <tr>
          <!-- Right Column: Logo & Main Title -->
          <td style="vertical-align: middle; text-align: right;">
            <table style="border-collapse: collapse; display: inline-table;">
              <tr>
                <td style="vertical-align: middle; padding-left: 12px;">
                  <img src="${zadDarkLogo}" alt="Zad Logo" style="height: 42px; width: auto; object-fit: contain; display: block;" />
                </td>
                <td style="vertical-align: middle; text-align: right;">
                  <div style="font-size: 21px; font-weight: 900; color: #0f172a; line-height: 1.3; font-family: Cairo, sans-serif;">منصة زاد للعلوم الشرعية</div>
                  <div style="font-size: 12.5px; font-weight: 800; color: #7c3aed; margin-top: 2px;">إجابات موثقه من أمهات الكتب الشرعية</div>
                </td>
              </tr>
            </table>
          </td>

          <!-- Left Column: Official Metadata Floating Card -->
          <td style="vertical-align: middle; text-align: left; width: 240px;">
            <div style="background: #ffffff; border: 1px solid #e9d5ff; border-radius: 12px; padding: 8px 14px; box-shadow: 0 3px 10px rgba(124, 58, 237, 0.05); display: inline-block; text-align: right;">
              <table style="width: 100%; border-collapse: collapse; font-size: 11.5px;">
                <tr>
                  <td style="color: #64748b; font-weight: 700; padding-bottom: 4px; text-align: right; white-space: nowrap;">تاريخ التصدير:</td>
                  <td style="color: #1e1b4b; font-weight: 800; padding-bottom: 4px; text-align: left; white-space: nowrap; padding-right: 8px;">${dateStr}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 700; text-align: right; white-space: nowrap;">كود المستند:</td>
                  <td style="text-align: left; white-space: nowrap; padding-right: 8px;">
                    <span style="direction: ltr; display: inline-block; font-family: 'Courier New', monospace; font-weight: 900; color: #7c3aed; background: #f3e8ff; padding: 1px 7px; border-radius: 5px; border: 1px solid #ddd6fe; font-size: 11px;">${docId}</span>
                  </td>
                </tr>
              </table>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Active Book & Chapter Hierarchy Banner -->
    <div style="padding: 10px 36px; background: linear-gradient(90deg, #1e1b4b 0%, #2e1065 50%, #4c1d95 100%); border-bottom: 3px solid #7c3aed;">
      <table style="width: 100%; border-collapse: collapse; margin: 0; padding: 0; table-layout: fixed;">
        <tr>
          <td style="vertical-align: middle; text-align: right;">
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <span style="background: rgba(245,158,11,0.22); border: 1px solid #f59e0b; color: #fef08a; font-size: 11px; font-weight: 900; padding: 3px 10px; border-radius: 6px; flex-shrink: 0; display: inline-block; margin-left: 4px;">📚 المسار الشرعي:</span>
              <div style="font-size: 13px; line-height: 1.5; display: inline-block; vertical-align: middle;">${formattedPathwayHtml}</div>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <div style="padding: 32px 40px 40px; background-color: #ffffff;">
      <!-- Prominent Centered Main Section Title -->
      <div data-pdf-block="true" style="text-align: center; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px dashed #ddd6fe; page-break-inside: avoid;">
        <h1 style="font-size: 26px; font-weight: 900; color: #3b0764; margin: 0; line-height: 1.4; font-family: Cairo, sans-serif;">
          ${lastTitle}
        </h1>
      </div>
  `

  const processedText = preprocessFrameText(rawText)
  const lines = processedText.split('\n')

  let inList = false
  let listType: 'ul' | 'ol' = 'ul'
  let inMainCard = false
  let inSubCard = false

  const closeSubCard = () => {
    if (inList) {
      html += listType === 'ul' ? '</ul>' : '</ol>'
      inList = false
    }
    if (inSubCard) {
      html += '</div></div>'
      inSubCard = false
    }
  }

  const closeMainCard = () => {
    closeSubCard()
    if (inMainCard) {
      html += '</div></div>'
      inMainCard = false
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const line = rawLine.trim()
    if (!line) {
      if (inList) {
        html += listType === 'ul' ? '</ul>' : '</ol>'
        inList = false
      }
      continue
    }

    if (line.startsWith('#')) {
      const hashCount = (line.match(/^#+/) || ['#'])[0].length
      const titleText = line.replace(/^#+\s*/, '').replace(/__TITLE__/g, '').replace(/__BADGE__/g, '')

      if (hashCount === 1) {
        closeMainCard()
        html += `
          <div data-pdf-block="true" data-pdf-heading="true" style="margin: 32px 0 18px 0; border-bottom: 3px solid #7c3aed; padding-bottom: 10px; page-break-inside: avoid;">
            <h1 style="font-size: 23px; font-weight: 900; color: #3b0764; margin: 0; line-height: 1.4; font-family: Cairo, sans-serif;">${titleText}</h1>
          </div>
        `
      } else if (hashCount === 2) {
        closeMainCard()
        html += `
          <div data-pdf-block="true" data-pdf-heading="true" style="margin: 28px 0 16px 0; border-bottom: 2px solid #ddd6fe; padding-bottom: 8px; page-break-inside: avoid;">
            <h2 style="font-size: 20.5px; font-weight: 900; color: #581c87; margin: 0; line-height: 1.4; font-family: Cairo, sans-serif;">${titleText}</h2>
          </div>
        `
      } else if (hashCount === 3) {
        // Main Section Card (Shaded Header Strip + Pure White Body)
        closeMainCard()
        html += `
          <div data-pdf-block="true" style="background-color: #ffffff; border: 1.5px solid #e9d5ff; border-right: 6px solid #7c3aed; border-radius: 16px; margin: 24px 0; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.05); overflow: hidden; page-break-inside: avoid;">
            <div style="background: linear-gradient(90deg, #f3e8ff 0%, #faf5ff 100%); padding: 14px 22px; border-bottom: 1.5px solid #e9d5ff; font-size: 19px; font-weight: 900; color: #2e1065; line-height: 1.35; font-family: Cairo, sans-serif; display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 8px; height: 18px; background: #7c3aed; border-radius: 4px; flex-shrink: 0;"></span>
              <span>${titleText}</span>
            </div>
            <div style="padding: 20px 24px 8px 24px;">
        `
        inMainCard = true
      } else {
        // Nested Sub-Section Card (Shaded Sub-Header Strip + Soft White Body)
        closeSubCard()
        html += `
          <div data-pdf-block="true" style="background-color: #ffffff; border: 1px solid #ddd6fe; border-right: 4px solid #a855f7; border-radius: 12px; margin: 18px 0 14px 0; box-shadow: 0 2px 8px rgba(168, 85, 247, 0.04); overflow: hidden; page-break-inside: avoid;">
            <div style="background: #f5f3ff; padding: 10px 18px; border-bottom: 1px solid #ede9fe; font-size: 16px; font-weight: 800; color: #581c87; line-height: 1.35; font-family: Cairo, sans-serif; display: flex; align-items: center; gap: 6px;">
              <span style="color: #a855f7; font-size: 14px; flex-shrink: 0;">🔹</span>
              <span>${titleText}</span>
            </div>
            <div style="padding: 14px 18px 6px 18px;">
        `
        inSubCard = true
      }
      continue
    }

    if (line.includes('[QURAN]')) {
      if (inList) { html += listType === 'ul' ? '</ul>' : '</ol>'; inList = false; }
      const refMatch = line.match(/\[REF:(.*?)\]/)
      const refText = refMatch ? refMatch[1] : ''
      const cleanQuote = line.replace('> [QURAN]', '').replace(/\[REF:.*?\]/, '').replace(/~~«?/g, '«').replace(/»?~~/g, '»').replace(/~~/g, '').trim()

      html += `
        <div data-pdf-block="true" style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-right: 6px solid #10b981; padding: 18px 22px; border-radius: 16px; margin: 18px 0; box-shadow: 0 2px 8px rgba(16,185,129,0.08); page-break-inside: avoid;">
          <div style="font-family: 'Amiri', 'Traditional Arabic', serif; font-size: 21px; font-weight: 700; color: #064e3b; line-height: 2.3; text-align: justify;">${cleanQuote}</div>
          ${refText ? `
            <div style="margin-top: 12px; padding-top: 8px; border-top: 1px dashed #a7f3d0; display: flex; justify-content: flex-end;">
              <div style="font-size: 12.5px; color: #047857; font-weight: 900; background: #d1fae5; border: 1px solid #a7f3d0; padding: 3px 12px; border-radius: 8px;">[${refText}]</div>
            </div>
          ` : ''}
        </div>
      `
      continue
    }

    if (line.includes('[HADITH]')) {
      if (inList) { html += listType === 'ul' ? '</ul>' : '</ol>'; inList = false; }
      const refMatch = line.match(/\[REF:(.*?)\]/)
      const refText = refMatch ? refMatch[1] : ''
      const cleanQuote = line.replace('> [HADITH]', '').replace(/\[REF:.*?\]/, '').replace(/~~«?/g, '«').replace(/»?~~/g, '»').replace(/~~/g, '').trim()

      html += `
        <div data-pdf-block="true" style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-right: 6px solid #0284c7; padding: 18px 22px; border-radius: 16px; margin: 18px 0; box-shadow: 0 2px 8px rgba(2,132,199,0.08); page-break-inside: avoid;">
          <div style="font-family: 'Amiri', 'Traditional Arabic', serif; font-size: 19.5px; font-weight: 700; color: #0c4a6e; line-height: 2.1; text-align: justify;">${cleanQuote}</div>
          ${refText ? `
            <div style="margin-top: 12px; padding-top: 8px; border-top: 1px dashed #bae6fd; display: flex; justify-content: flex-end;">
              <div style="font-size: 12.5px; color: #0369a1; font-weight: 900; background: #e0f2fe; border: 1px solid #bae6fd; padding: 3px 12px; border-radius: 8px;">[${refText}]</div>
            </div>
          ` : ''}
        </div>
      `
      continue
    }

    if (line.includes('[SAYING]')) {
      if (inList) { html += listType === 'ul' ? '</ul>' : '</ol>'; inList = false; }
      const refMatch = line.match(/\[REF:(.*?)\]/)
      const refText = refMatch ? refMatch[1] : ''
      const cleanQuote = line.replace('> [SAYING]', '').replace(/\[REF:.*?\]/, '').replace(/~~«?/g, '«').replace(/»?~~/g, '»').replace(/~~/g, '').trim()

      html += `
        <div data-pdf-block="true" style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-right: 6px solid #8b5cf6; padding: 18px 22px; border-radius: 16px; margin: 18px 0; box-shadow: 0 2px 8px rgba(139,92,246,0.08); page-break-inside: avoid;">
          <div style="font-family: 'Amiri', 'Traditional Arabic', serif; font-size: 19px; font-weight: 700; color: #4c1d95; line-height: 2.05; text-align: justify;">${cleanQuote}</div>
          ${refText ? `
            <div style="margin-top: 12px; padding-top: 8px; border-top: 1px dashed #e9d5ff; display: flex; justify-content: flex-end;">
              <div style="font-size: 12.5px; color: #6d28d9; font-weight: 900; background: #f3e8ff; border: 1px solid #e9d5ff; padding: 3px 12px; border-radius: 8px;">[${refText}]</div>
            </div>
          ` : ''}
        </div>
      `
      continue
    }

    if (line.includes('[POETRY]')) {
      if (inList) { html += listType === 'ul' ? '</ul>' : '</ol>'; inList = false; }
      const refMatch = line.match(/\[REF:(.*?)\]/)
      const refText = refMatch ? refMatch[1] : ''
      const cleanQuote = line.replace('> [POETRY]', '').replace(/\[REF:.*?\]/, '').replace(/~~«?/g, '«').replace(/»?~~/g, '»').replace(/~~/g, '').trim()

      html += `
        <div data-pdf-block="true" style="background-color: #fffbeb; border: 1px solid #fde68a; border-right: 6px solid #f59e0b; padding: 18px 22px; border-radius: 16px; margin: 18px 0; box-shadow: 0 2px 8px rgba(245,158,11,0.08); page-break-inside: avoid;">
          <div style="font-family: 'Amiri', 'Traditional Arabic', serif; font-size: 19.5px; font-weight: 700; color: #78350f; line-height: 2.1; text-align: center;">${cleanQuote}</div>
          ${refText ? `
            <div style="margin-top: 12px; padding-top: 8px; border-top: 1px dashed #fde68a; display: flex; justify-content: flex-end;">
              <div style="font-size: 12.5px; color: #b45309; font-weight: 900; background: #fef3c7; border: 1px solid #fde68a; padding: 3px 12px; border-radius: 8px;">[${refText}]</div>
            </div>
          ` : ''}
        </div>
      `
      continue
    }

    const numMatch = line.match(/^(([0-9]+|[\u0600-\u06FF])[\.\-]|(أولاً|ثانياً|ثالثاً|رابعاً|خامساً|سادساً|سابعاً|ثامناً|تاسعاً|عاشراً)[:\s])\s*/)

    if (numMatch) {
      if (inList) {
        html += listType === 'ul' ? '</ul>' : '</ol>'
        inList = false
      }
      const rawNum = numMatch[1]
      const cleanBadgeNum = rawNum.replace(/[\.\-:\s]+$/g, '').trim()
      const restOfLine = line.slice(numMatch[0].length)
        .replace(/__TITLE__/g, '')
        .replace(/__BADGE__/g, '')
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #581c87; font-weight: 900;">$1</strong>')
        .replace(/~~«?(.*?)»?~~/g, '«<strong style="color: #047857; font-weight: 900;">$1</strong>»')
        .replace(/~~/g, '')

      html += `
        <div data-pdf-block="true" data-pdf-heading="true" style="margin: 16px 0 10px 0; display: flex; align-items: flex-start; gap: 10px; page-break-inside: avoid;">
          <span style="background: linear-gradient(135deg, #7c3aed, #9333ea); color: #ffffff; padding: 3px 11px; border-radius: 8px; font-weight: 900; font-size: 13.5px; flex-shrink: 0; line-height: 1.5; box-shadow: 0 2px 6px rgba(124,58,237,0.25);">${cleanBadgeNum}</span>
          <div style="font-size: 16px; font-weight: 800; color: #1e1b4b; line-height: 1.85; flex-grow: 1;">${restOfLine}</div>
        </div>
      `
      continue
    }

    if (/^[\*\-]\s+/.test(line)) {
      if (!inList || listType !== 'ul') {
        if (inList) html += listType === 'ul' ? '</ul>' : '</ol>'
        html += '<ul style="padding-right: 24px; font-size: 15.5px; line-height: 1.95; color: #0f172a; margin-bottom: 14px; list-style-type: disc;">'
        inList = true
        listType = 'ul'
      }
      const indentMatch = rawLine.match(/^([ \t]*)/)
      const indentLevel = indentMatch ? Math.floor(indentMatch[1].length / 2) : 0
      const extraPadding = indentLevel > 0 ? `margin-right: ${indentLevel * 20}px;` : ''

      const itemText = line.replace(/^[\*\-]\s+/, '')
        .replace(/__TITLE__/g, '')
        .replace(/__BADGE__/g, '')
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #6b21a8; font-weight: 900;">$1</strong>')
        .replace(/~~/g, '')
      html += `<li data-pdf-block="true" style="margin-bottom: 6px; font-weight: 700; page-break-inside: avoid; ${extraPadding}">${itemText}</li>`
      continue
    }

    if (inList) {
      html += listType === 'ul' ? '</ul>' : '</ol>'
      inList = false
    }

    const formattedPara = line
      .replace(/__TITLE__/g, '')
      .replace(/__BADGE__/g, '')
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #581c87; font-weight: 900;">$1</strong>')
      .replace(/~~«?(.*?)»?~~/g, '«<strong style="color: #047857; font-weight: 900;">$1</strong>»')
      .replace(/~~/g, '')

    html += `<p data-pdf-block="true" style="font-size: 15.5px; font-weight: 700; color: #0f172a; line-height: 1.95; margin: 0 0 14px 0; text-align: justify; page-break-inside: avoid;">${formattedPara}</p>`
  }

  closeMainCard()

  if (citations && citations.length > 0) {
    html += `
      <div data-pdf-block="true" style="margin-top: 40px; padding-top: 24px; border-top: 2px dashed #d8b4fe; page-break-inside: avoid;">
        <h4 style="font-size: 16px; font-weight: 900; color: #581c87; margin: 0 0 14px 0;">📚 المصادر والمراجع المعزوة:</h4>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${citations.map((c, i) => `
            <div style="background-color: #faf5ff; border: 1px solid #f3e8ff; border-right: 4px solid #a855f7; padding: 12px 16px; border-radius: 10px; font-size: 13.5px; color: #4c1d95; font-weight: 700;">
              [${i + 1}] ${c.book_title || 'مرجع غير محدد'} — ${c.section_title || ''}
            </div>
          `).join('')}
        </div>
      </div>
    `
  }

  // Footer
  html += `
    </div>
    <div style="padding: 22px 40px; border-top: 1px solid #e9d5ff; text-align: center; font-size: 12.5px; color: #6b21a8; font-weight: 800; background-color: #faf5ff;">
      مستند دراسي موثق — تم استخراجه عبر «منصة زاد للعلوم الشرعية والتربوية» © ${new Date().getFullYear()}
    </div>
  `

  container.innerHTML = html
  return container
}

export async function exportMessageToPdf(
  messageText: string,
  citations?: CitationDTO[],
  lessonTitle?: string
): Promise<void> {
  const printContainer = buildCleanPrintablePdfContainer(messageText, citations, lessonTitle)
  document.body.appendChild(printContainer)

  // Wait for images and styling
  await new Promise(resolve => setTimeout(resolve, 250))

  const targetHeight = Math.max(printContainer.scrollHeight, printContainer.offsetHeight, 400)

  try {
    const scale = 2
    const containerRect = printContainer.getBoundingClientRect()

    // Query top-level blocks marked with data-pdf-block BEFORE removing container from DOM
    const blockElements = Array.from(
      printContainer.querySelectorAll('[data-pdf-block="true"]')
    )

    const blockRects = blockElements.map(el => {
      const rect = el.getBoundingClientRect()
      return {
        top: Math.floor((rect.top - containerRect.top) * scale),
        bottom: Math.floor((rect.bottom - containerRect.top) * scale),
        isHeading: el.hasAttribute('data-pdf-heading'),
      }
    })

    const canvas = await toCanvas(printContainer, {
      quality: 0.98,
      pixelRatio: scale,
      backgroundColor: '#ffffff',
      width: 794,
      height: targetHeight,
    })

    if (printContainer.parentNode) {
      printContainer.parentNode.removeChild(printContainer)
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pdfWidth = 190
    const pageHeightMm = 277
    const margin = 10
    const maxPageHeightPx = Math.floor((canvas.width * pageHeightMm) / pdfWidth)

    let currentY = 0
    let pageNum = 0

    while (currentY < canvas.height) {
      let targetY = currentY + maxPageHeightPx

      if (targetY < canvas.height) {
        // 1. Find all blocks (including inner paragraphs/quotes) that intersect targetY and fit within a page
        const validIntersectingBlocks = blockRects.filter(
          b => targetY > b.top && targetY < b.bottom && (b.bottom - b.top) <= maxPageHeightPx && b.top > currentY
        )

        if (validIntersectingBlocks.length > 0) {
          // Select the block with the highest top position (closest to targetY but above it)
          const bestBlock = validIntersectingBlocks.reduce((prev, curr) =>
            curr.top > prev.top ? curr : prev
          )
          targetY = bestBlock.top
        }

        // 2. Orphan Heading Check: Prevent page ending right on/after a heading without content below it
        const orphanHeading = blockRects.find(
          b => b.isHeading && b.top > currentY && (targetY - b.bottom < 110)
        )

        if (orphanHeading && orphanHeading.top > currentY) {
          targetY = orphanHeading.top
        }
      } else {
        targetY = canvas.height
      }

      // Safety check against infinite loops if a single block exceeds page height
      if (targetY <= currentY) {
        targetY = currentY + maxPageHeightPx
      }

      const sliceHeightPx = targetY - currentY
      if (sliceHeightPx <= 0) break

      const pageCanvas = document.createElement('canvas')
      pageCanvas.width = canvas.width
      pageCanvas.height = sliceHeightPx

      const pageCtx = pageCanvas.getContext('2d')
      if (pageCtx) {
        pageCtx.fillStyle = '#ffffff'
        pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
        pageCtx.drawImage(
          canvas,
          0,
          currentY,
          canvas.width,
          sliceHeightPx,
          0,
          0,
          canvas.width,
          sliceHeightPx
        )
      }

      const pageDataUrl = pageCanvas.toDataURL('image/png')
      const sliceHeightMm = (sliceHeightPx * pdfWidth) / canvas.width

      if (pageNum > 0) {
        pdf.addPage()
      }

      pdf.addImage(pageDataUrl, 'PNG', margin, margin, pdfWidth, sliceHeightMm)
      currentY = targetY
      pageNum++
    }

    const timestamp = new Date().toISOString().slice(0, 10)
    pdf.save(`zad-lesson-${timestamp}.pdf`)
  } catch (err) {
    if (document.body.contains(printContainer)) {
      document.body.removeChild(printContainer)
    }
    throw err
  }
}
