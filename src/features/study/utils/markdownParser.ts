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
