import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { User, BookOpen, Book, ExternalLink, ChevronDown, ChevronLeft, LayoutGrid, FileText, Feather, Copy, Check, Download, Loader2 } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { toCanvas } from 'html-to-image'
import whiteLogo from '@/assets/images/WhiteLogo.png'
import zadDarkLogo from '@/assets/images/ZadDarkLogo.png'
import type { Message, CitationDTO } from '../data'
import { exportMessageToPdf } from '@/utils/pdfExporter'
import { useStudy } from '@/contexts/StudyContext'
import { useTheme, type AccentColor } from '@/contexts/ThemeContext'
import { AudioReaderButton } from '@/components/common/AudioReaderButton'

function AvatarLogo({ dark }: { dark: boolean }) {
  const { accentColor } = useTheme();

  const getGradient = () => {
    switch (accentColor) {
      case 'amber':
        return 'conic-gradient(from 0deg, transparent 0%, rgba(223,191,131,0.8) 40%, rgba(245,158,11,0.9) 60%, transparent 100%)';
      case 'emerald':
        return 'conic-gradient(from 0deg, transparent 0%, rgba(45,212,191,0.8) 40%, rgba(13,148,136,0.9) 60%, transparent 100%)';
      case 'blue':
        return 'conic-gradient(from 0deg, transparent 0%, rgba(96,165,250,0.8) 40%, rgba(37,99,235,0.9) 60%, transparent 100%)';
      case 'purple':
      default:
        return 'conic-gradient(from 0deg, transparent 0%, rgba(192,32,240,0.8) 40%, rgba(168,85,247,0.9) 60%, transparent 100%)';
    }
  };

  const getShadowStyle = () => {
    switch (accentColor) {
      case 'amber': return '0 0 12px rgba(223,191,131, 0.55)';
      case 'emerald': return '0 0 12px rgba(45,212,191, 0.55)';
      case 'blue': return '0 0 12px rgba(96,165,250, 0.55)';
      case 'purple':
      default: return '0 0 12px rgba(168,85,247, 0.55)';
    }
  };

  const getBorderClass = () => {
    if (dark) return 'border-white/20';
    switch (accentColor) {
      case 'amber': return 'border-amber-300';
      case 'emerald': return 'border-teal-300';
      case 'blue': return 'border-blue-300';
      case 'purple':
      default: return 'border-primary/20';
    }
  };

  const getLogoColor = () => {
    switch (accentColor) {
      case 'amber': return dark ? '#dfbf83' : '#b88d46';
      case 'emerald': return dark ? '#2dd4bf' : '#0d9488';
      case 'blue': return dark ? '#60a5fa' : '#2563eb';
      case 'purple':
      default: return dark ? '#c084fc' : '#950bc4';
    }
  };

  return (
    <div className="relative flex h-9 w-9 sm:h-12 sm:w-12 shrink-0 items-center justify-center -mt-1 sm:-mt-2">
      <span
        className="absolute inset-0 rounded-full blur-[7px] opacity-90 transition-all duration-300"
        style={{
          background: getGradient(),
        }}
      />
      <div
        className={`relative flex h-full w-full items-center justify-center rounded-full z-10 transition-all duration-300 ${
          dark ? 'bg-[#0f041c]/80 backdrop-blur-xl border border-white/20' : `bg-white border ${getBorderClass()}`
        }`}
        style={{ boxShadow: getShadowStyle() }}
      >
        <div
          className="h-5 w-5 sm:h-7 sm:w-7 transition-colors duration-200"
          style={{
            backgroundColor: getLogoColor(),
            WebkitMaskImage: `url(${whiteLogo})`,
            maskImage: `url(${whiteLogo})`,
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
          }}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}

function parseTextIntoFrames(text: string): { content: string, children: string[] }[] {
  if (!text) return [];

  const lines = text.split('\n');
  const frames: { content: string, children: string[] }[] = [];

  let currentMainContent: string[] = [];
  let currentChildren: string[][] = [];
  let currentChildContent: string[] = [];

  let writingToChild = false;
  let inCodeBlock = false;

  const commitMainFrame = () => {
    if (currentChildContent.length > 0 && currentChildContent.some(l => l.trim().length > 0)) {
      currentChildren.push([...currentChildContent]);
    }
    currentChildContent = [];

    if (
      (currentMainContent.length > 0 && currentMainContent.some(l => l.trim().length > 0)) ||
      currentChildren.length > 0
    ) {
      frames.push({
        content: currentMainContent.join('\n'),
        children: currentChildren.map(c => c.join('\n'))
      });
    }

    currentMainContent = [];
    currentChildren = [];
    writingToChild = false;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Standalone horizontal rule --- delimits main frames
    if (!inCodeBlock && /^---+\s*$/.test(trimmed)) {
      commitMainFrame();
      continue;
    }

    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      if (writingToChild) {
        currentChildContent.push(line);
      } else {
        currentMainContent.push(line);
      }
      continue;
    }

    if (!inCodeBlock) {
      // H1, H2, H3 (or numbered H2/H3) start a NEW Main Frame
      const isMainHeading = /^#{1,3}(?:\s+.*)?$/.test(trimmed);
      // H4 (or ####sub-headings) start a Child Sub-Frame inside current Main Frame
      const isChildHeading = /^#{4,}(?:\s+.*)?$/.test(trimmed);

      if (isMainHeading) {
        commitMainFrame();
        currentMainContent.push(line);
        writingToChild = false;
        continue;
      }

      if (isChildHeading) {
        if (currentChildContent.length > 0 && currentChildContent.some(l => l.trim().length > 0)) {
          currentChildren.push([...currentChildContent]);
        }
        currentChildContent = [line];
        writingToChild = true;
        continue;
      }
    }

    if (writingToChild) {
      currentChildContent.push(line);
    } else {
      currentMainContent.push(line);
    }
  }

  commitMainFrame();
  return frames;
}

function autoIndentSubLists(text: string): string {
  if (!text) return text;
  const lines = text.split('\n');
  const result: string[] = [];

  const parentStack: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^([ \t]*)([\*\-\+]|\d+\.|[\u0600-\u06FF]\.)[ \t]+(.*)$/);

    if (match) {
      const origIndent = match[1].length;
      const marker = match[2];
      const content = match[3].trim();

      const cleanContent = content.replace(/[\*\_\s]+$/g, '');
      const colonIdx = content.search(/[:؛]/);
      let isHeaderTitleBullet = false;

      if (colonIdx !== -1) {
        const afterColon = content.slice(colonIdx + 1).replace(/[\*\_\s]+/g, '');
        if (afterColon.length === 0 && /[:؛]$/.test(cleanContent)) {
          isHeaderTitleBullet = true;
        }
      }

      let levelFromIndent = 0;
      if (origIndent > 0) {
        if (origIndent <= 3) levelFromIndent = 1;
        else if (origIndent <= 6) levelFromIndent = 1;
        else if (origIndent <= 10) levelFromIndent = 2;
        else if (origIndent <= 14) levelFromIndent = 3;
        else levelFromIndent = Math.floor(origIndent / 4);
      }

      let effectiveLevel = levelFromIndent;

      if (origIndent === 0 && parentStack.length > 0) {
        effectiveLevel = parentStack.length;
      }

      while (parentStack.length > 0 && effectiveLevel <= parentStack[parentStack.length - 1]) {
        parentStack.pop();
      }

      const indentStr = '    '.repeat(effectiveLevel);
      result.push(`${indentStr}${marker} ${content}`);

      if (isHeaderTitleBullet) {
        parentStack.push(effectiveLevel);
      }
    } else {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('>') || trimmed.startsWith('```')) {
        parentStack.length = 0;
      }
      result.push(line);
    }
  }

  return result.join('\n');
}

function preprocessFrameText(frameStr: string): string {
  let text = frameStr;

  // ------------------------------------------------------------
  // Hierarchy:
  // ### = main frame
  // ##  = internal subsection
  // #### = internal detail
  // ------------------------------------------------------------

  // Remove standalone lines containing only a period or dot
  text = text.replace(/^\s*[\.\u06D4]\s*$/gm, '');

  // Preprocess citation numbers like [1], [1] [2], [1][2], [1] و [2] into grouped markdown link placeholders
  text = text.replace(/(?:\[\d+\](?:[\s,،و]*\[\d+\])*)/g, (match) => {
    const numbers = (match.match(/\d+/g) || []).map(Number);
    if (numbers.length === 0) return match;
    const idsStr = numbers.join(',');
    return `[ZAD_CIT:${idsStr}](#cit-${idsStr})`;
  });

  // 1. Fix missing spaces in headings (e.g., ###1. -> ### 1., ###أ. -> ### أ.)
  text = text.replace(/^(#{1,4})([0-9]+\.|[\u0600-\u06FF]+\.)/gm, '$1 $2');

  // Normalize extra spaces after list bullet markers (e.g. "*   **Title**" -> "* **Title**")
  text = text.replace(/^([ \t]*[\*\-\+]|\d+\.|\w+\.)[ \t]{2,}/gm, '$1 ');

  // 2. Fix squashed text where the AI puts lists or headings on the same line as previous text
  text = text.replace(/([^\s#])[ \t]+(#{1,4}[ \t]+)/g, '$1\n\n$2'); // Headings
  text = text.replace(/([^\s#])[ \t]+([0-9]+\.[ \t]+\*\*)/g, '$1\n\n$2'); // Numbered lists (with bold title)
  text = text.replace(/([^\s#])[ \t]+([\u0600-\u06FF]\.[ \t]+\*\*)/g, '$1\n\n$2'); // Alphabet lists (with bold title)
  text = text.replace(/\*\*((?:الخلاص[ةه]|توضيح|ملاحظ[ةه]|تنبيه|فائدة).*?)\*\*/g, '**ZAD_BADGE_$1**');

  // Wrap standalone bold lines in a ZAD_FRAME
  text = text.replace(/^([ \t]*)\*\*([^\*\r\n]+)\*\*([: \t.\u06D4؟\?]*)[ \t]*$/gm, '$1**ZAD_FRAME_$2$3**');

  text = text.replace(/([^\s#])[ \t]+(\*[ \t]+\*\*)/g, '$1\n\n$2'); // Bullet lists (with bold title)
  text = text.replace(/([^\s#])[ \t]+(-[ \t]+\*\*)/g, '$1\n\n$2'); // Dash lists (with bold title)

  // Ensure list items with bold titles (e.g. "* **Title:**\n Description") split into double newlines so description starts on a new line (but ignore if the next line is a sub-list)
  text = text.replace(/^([ \t]*)([\*\-\+]|\d+\.|\w+\.)[ \t]*(\*\*[^\*\r\n]+\*\*[: \t.\u06D4]*)[ \t]*\n(?!\n)([ \t]*)(?![ \t]*([\*\-\+]|\d+\.|\w+\.))/gm, (match, indent, bullet, title, nextIndent) => {
    const spacesNeeded = indent.length + 4;
    const actualIndent = nextIndent.length >= spacesNeeded ? nextIndent : ' '.repeat(spacesNeeded);
    return `${indent}${bullet} ${title}\n\n${actualIndent}`;
  });

  // Ensure bold and italic sub-headings/labels (e.g. *مثال:*, **ملاحظة:**, _تنبيه:_) preceded by single newline get double newline \n\n
  text = text.replace(/([^\n])\n([ \t]*)(\*[^\*\r\n]+\*[: \t]*|\*\*[^\*\r\n]+\*\*[: \t]*|_[^_\r\n]+_[: \t]*)/g, '$1\n\n$2$3');

  // Ensure bold and italic sub-headings on standalone lines are followed by double newlines (\n\n) so subsequent text starts on a new line
  text = text.replace(/^([ \t]*\*\*[^\*\r\n]+\*\*[: \t]*)\n(?!\n)/gm, '$1\n\n');
  text = text.replace(/^([ \t]*\*[^\*\r\n]+\*[: \t]*)\n(?!\n)/gm, '$1\n\n');

  // Remove horizontal rules generated by AI (--- or ___)
  text = text.replace(/^[\-_]{3,}\s*$/gm, '');

  const extractLeadingCitations = (afterText: string) => {
    let citations = '';
    let rest = afterText || '';
    const citMatch = rest.match(/^([ \t\`"'«»:\u061B;,،.\u06D4\s\(\)]*)((\[\s*ZAD_CIT:[^\]]+\s*\]\([^\)]+\)[\s,،و]*)+)/);
    if (citMatch) {
      citations = citMatch[2].trim();
      rest = rest.slice(citMatch[0].length);
    }
    return { citations, rest };
  };

  const cleanBeforeStr = (str: string) => {
    return str.trim().replace(/[`"'«»]+$/, '').trim();
  };

  const cleanAfterStr = (str: string) => {
    return (str || '').replace(/^[.\u06D4\s\`"'«»:\u061B;,،\(\)]+/, '');
  };

  // Standalone Qur'an: entire line is &Ayah& or &&Ayah&& (with optional reference ^Ref^)
  text = text.replace(/^[ \t]*&+([^&\r\n]+)&+(?:[ \t]*(?:\r?\n[ \t]*)?\^+([^\^\r\n]+)\^+)?\s*$/gm, (match, quote, ref) => {
    let res = `\n> [QURAN] ${quote.trim()}`;
    if (ref) res += `  \n> *__REF__${ref.trim()}*`;
    res += '\n';
    return res;
  });

  // Standalone Hadith: entire line is %Hadith% or %%Hadith%% (with optional reference ^Ref^)
  text = text.replace(/^[ \t]*%+([^%\r\n]+)%+(?:[ \t]*(?:\r?\n[ \t]*)?\^+([^\^\r\n]+)\^+)?\s*$/gm, (match, quote, ref) => {
    let res = `\n> [HADITH] ${quote.trim()}`;
    if (ref) res += `  \n> *__REF__${ref.trim()}*`;
    res += '\n';
    return res;
  });

  // Standalone Scholars' sayings: entire line is @Saying@ or @@Saying@@ (with optional reference ^Ref^)
  text = text.replace(/^[ \t]*@+([^@\r\n]+)@+(?:[ \t]*(?:\r?\n[ \t]*)?\^+([^\^\r\n]+)\^+)?\s*$/gm, (match, quote, ref) => {
    let res = `\n> [SAYING] ${quote.trim()}`;
    if (ref) res += `  \n> *__REF__${ref.trim()}*`;
    res += '\n';
    return res;
  });

  // Standalone Poetry: entire line is $Poetry$ or $$Poetry$$ (with optional reference ^Ref^)
  text = text.replace(/^[ \t]*\$+([^$\r\n]+)\$+(?:[ \t]*(?:\r?\n[ \t]*)?\^+([^\^\r\n]+)\^+)?\s*$/gm, (match, quote, ref) => {
    let res = `\n> [POETRY] ${quote.trim()}`;
    if (ref) res += `  \n> *__REF__${ref.trim()}*`;
    res += '\n';
    return res;
  });

  // Standalone References: entire line is ^text^ or ^^text^^ -> tagged blockquote
  text = text.replace(/^[ \t]*\^+([^\^\r\n]+)\^+\s*$/gm, (match, ref) => {
    return `\n> [REFERENCE] ${ref.trim()}\n`;
  });

  // Inline Scholars' sayings / terms / expressions: @Saying@ or @@Saying@@ -> bold quotation «Saying»
  text = text.replace(/@+([^@\r\n]+)@+/g, '**«$1»**');

  // Inline Hadith: %Hadith% or %%Hadith%% -> bold quotation «Hadith»
  text = text.replace(/%+([^%\r\n]+)%+/g, '**«$1»**');

  // Inline Qur'an: &Ayah& or &&Ayah&& -> bold quotation ﴿Ayah﴾
  text = text.replace(/&+([^&\r\n]+)&+/g, '**﴿$1﴾**');

  // Inline Poetry: $Poetry$ or $$Poetry$$ -> bold quotation «Poetry»
  text = text.replace(/\$+([^$\r\n]+)\$+/g, '**«$1»**');

  // Inline References: ^Ref^ or ^^Ref^^ -> subtle reference (*Ref*)
  text = text.replace(/\^+([^\^\r\n]+)\^+/g, ' (*$1*)');

  // Remove any remaining standalone lines containing only a dot or period
  text = text.replace(/^\s*[\.\u06D4]\s*$/gm, '');

  // 4. Ensure numbered and bullet list items always start on a new line with double newline \n\n while preserving indentation
  text = text.replace(/([^\n])\n([ \t]*)([0-9]+\.|[\u0600-\u06FF]\.|\*|-)[ \t]+/g, '$1\n\n$2$3 ');

  // ++Keyword++ -> ~~Keyword~~.
  text = text.replace(/\+\+([^+]+)\+\+/g, '~~$1~~');

  // Automatically indent sub-list items under parent title bullets
  text = autoIndentSubLists(text);

  // Cleanup extra blank lines.
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

function getChatBubbleThemeClasses(accentColor: AccentColor, dark: boolean) {
  switch (accentColor) {
    case 'amber':
      return {
        h2Box: dark ? 'bg-amber-500/[0.07] border-amber-400/20' : 'bg-amber-50/80 border-amber-200/70',
        h2Bar: dark ? 'bg-amber-400' : 'bg-amber-600',
        h2Text: dark ? 'text-amber-300/90' : 'text-amber-900/85',
        h3Text: dark ? 'text-amber-300/90' : 'text-amber-800/85',
        h4Banner: dark
          ? 'from-amber-500/10 via-amber-500/[0.04] to-transparent border-b border-amber-500/20'
          : 'from-amber-100/80 via-amber-50/40 to-transparent border-b border-amber-200/80',
        h4Text: dark ? 'text-amber-200/90' : 'text-amber-900/85',
        marker: dark ? 'marker:text-amber-400/80' : 'marker:text-amber-700/80',
        strong: dark ? 'text-amber-300/90 drop-shadow-[0_0_4px_rgba(245,158,11,0.2)]' : 'text-amber-900/85',
        strongTitle: dark ? 'text-amber-300/90 decoration-amber-400/40' : 'text-amber-900/85 decoration-amber-500/40',
        strongBadge: dark ? 'bg-amber-500/10 border-amber-500/30 text-amber-300/90' : 'bg-amber-50 border-amber-300 text-amber-800/90',
        strongFrame: dark ? 'bg-gradient-to-l from-amber-500/10 to-transparent border-amber-500/20 text-amber-300/90' : 'bg-gradient-to-l from-amber-50 to-transparent border-amber-200 text-amber-900/85',
        del: dark ? 'bg-amber-500/10 border-amber-400/30 text-amber-300/90 shadow-[0_0_12px_rgba(245,158,11,0.06)]' : 'bg-amber-50 border-amber-300/70 text-amber-800/90 shadow-sm',
        link: dark ? 'text-amber-400 hover:text-amber-300 font-medium transition-colors underline underline-offset-4' : 'text-amber-600 hover:text-amber-800 font-medium transition-colors underline underline-offset-4',
        code: dark ? 'bg-amber-950/50 text-amber-200' : 'bg-amber-100/60 text-amber-950 border border-amber-200/60',
        quoteGeneric: dark ? 'border-amber-500/50 bg-amber-500/[0.08] text-amber-50' : 'border-amber-600 bg-[#FFFDF7] text-[#78350F] shadow-sm ring-1 ring-amber-100/70',
        mainFrameBorder: dark ? 'border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.15)]' : 'border-amber-200/60 shadow-[0_2px_12px_rgba(217,119,6,0.04)]',
        childBox: dark
          ? 'bg-gradient-to-br from-[#1a1205]/90 via-[#231807]/80 to-[#100a02]/95 border-amber-500/40 shadow-[0_4px_20px_rgba(245,158,11,0.12)]'
          : 'bg-gradient-to-br from-amber-50/90 via-white to-amber-50/40 border-amber-300/90 shadow-[0_2px_15px_rgba(217,119,6,0.08)]',
        citationBtn: dark
          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/30 hover:border-amber-400 shadow-amber-950/40'
          : 'bg-amber-100/80 text-amber-950 border-amber-300/80 hover:bg-amber-200 hover:border-amber-400 shadow-amber-100/50',
        citationIcon: 'text-amber-400',
        citationBadge: dark ? 'bg-amber-400/20 text-amber-200' : 'bg-amber-200 text-amber-900',
        popoverBox: dark ? 'bg-[#140d04]/95 border-amber-500/30 text-white shadow-black/80' : 'bg-white/95 border-amber-200 text-slate-900 shadow-amber-900/15',
        itemBox: dark ? 'bg-white/[0.03] border-white/10' : 'bg-amber-50/50 border-amber-100',
        bookTitle: 'text-amber-400',
        sourceBtn: dark ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30' : 'bg-amber-600 text-white border-amber-600 hover:bg-amber-700 shadow-sm',
        hierarchyTag: dark ? 'bg-amber-950/60 text-amber-300 border border-amber-500/30 hover:bg-amber-900/90 hover:border-amber-400/80 hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-amber-100/90 text-amber-900 border border-amber-300/70 hover:bg-amber-200/90 hover:border-amber-400 hover:shadow-[0_0_12px_rgba(245,158,11,0.3)]',
        userBubbleGradient: 'linear-gradient(225deg, #78350f 0%, #854d0e 50%, #92400e 100%)',
      };
    case 'emerald':
      return {
        h2Box: dark ? 'bg-emerald-500/[0.07] border-emerald-400/20' : 'bg-emerald-50/80 border-emerald-200/70',
        h2Bar: dark ? 'bg-emerald-400' : 'bg-emerald-600',
        h2Text: dark ? 'text-emerald-300/90' : 'text-emerald-800/85',
        h3Text: dark ? 'text-emerald-300/90' : 'text-emerald-800/85',
        h4Banner: dark
          ? 'from-emerald-500/10 via-emerald-500/[0.04] to-transparent border-b border-emerald-500/20'
          : 'from-emerald-100/80 via-emerald-50/40 to-transparent border-b border-emerald-200/80',
        h4Text: dark ? 'text-emerald-200/90' : 'text-emerald-900/85',
        marker: dark ? 'marker:text-emerald-400/80' : 'marker:text-emerald-700/80',
        strong: dark ? 'text-emerald-300/90 drop-shadow-[0_0_4px_rgba(52,211,153,0.2)]' : 'text-emerald-800/85',
        strongTitle: dark ? 'text-emerald-300/90 decoration-emerald-400/40' : 'text-emerald-800/85 decoration-emerald-500/40',
        strongBadge: dark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300/90' : 'bg-emerald-50 border-emerald-300 text-emerald-800/90',
        strongFrame: dark ? 'bg-gradient-to-l from-emerald-500/10 to-transparent border-emerald-500/20 text-emerald-300/90' : 'bg-gradient-to-l from-emerald-50 to-transparent border-emerald-200 text-emerald-800/85',
        del: dark ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300/90 shadow-[0_0_12px_rgba(16,185,129,0.06)]' : 'bg-emerald-50 border-emerald-300/70 text-emerald-800/90 shadow-sm',
        link: dark ? 'text-emerald-400 hover:text-emerald-300 font-medium transition-colors underline underline-offset-4' : 'text-emerald-600 hover:text-emerald-800 font-medium transition-colors underline underline-offset-4',
        code: dark ? 'bg-emerald-950/50 text-emerald-200' : 'bg-emerald-100/60 text-emerald-900 border border-emerald-200/60',
        quoteGeneric: dark ? 'border-emerald-500/50 bg-emerald-500/[0.08] text-emerald-50' : 'border-emerald-600 bg-[#F7FDFB] text-[#064E3B] shadow-sm ring-1 ring-emerald-100/70',
        mainFrameBorder: dark ? 'border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.15)]' : 'border-emerald-200/60 shadow-[0_2px_12px_rgba(16,185,129,0.04)]',
        childBox: dark
          ? 'bg-gradient-to-br from-[#041413]/90 via-[#06201e]/80 to-[#020b0a]/95 border-emerald-500/40 shadow-[0_4px_20px_rgba(16,185,129,0.12)]'
          : 'bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 border-emerald-300/90 shadow-[0_2px_15px_rgba(16,185,129,0.08)]',
        citationBtn: dark
          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30 hover:border-emerald-400 shadow-emerald-950/40'
          : 'bg-emerald-100/80 text-emerald-900 border-emerald-300/80 hover:bg-emerald-200 hover:border-emerald-400 shadow-emerald-100/50',
        citationIcon: 'text-emerald-400',
        citationBadge: dark ? 'bg-emerald-400/20 text-emerald-200' : 'bg-emerald-200 text-emerald-800',
        popoverBox: dark ? 'bg-[#041413]/95 border-emerald-500/30 text-white shadow-black/80' : 'bg-white/95 border-emerald-200 text-slate-900 shadow-emerald-900/15',
        itemBox: dark ? 'bg-white/[0.03] border-white/10' : 'bg-emerald-50/50 border-emerald-100',
        bookTitle: 'text-emerald-400',
        sourceBtn: dark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30' : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-sm',
        hierarchyTag: dark ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/90 hover:border-emerald-400/80 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-emerald-100/90 text-emerald-900 border border-emerald-300/70 hover:bg-emerald-200/90 hover:border-emerald-400 hover:shadow-[0_0_12px_rgba(16,185,129,0.3)]',
        userBubbleGradient: 'linear-gradient(225deg, #064e3b 0%, #065f46 50%, #0f766e 100%)',
      };
    case 'blue':
      return {
        h2Box: dark ? 'bg-blue-500/[0.07] border-blue-400/20' : 'bg-blue-50/80 border-blue-200/70',
        h2Bar: dark ? 'bg-blue-400' : 'bg-blue-600',
        h2Text: dark ? 'text-blue-300/90' : 'text-blue-900/85',
        h3Text: dark ? 'text-blue-300/90' : 'text-blue-800/85',
        h4Banner: dark
          ? 'from-blue-500/10 via-blue-500/[0.04] to-transparent border-b border-blue-500/20'
          : 'from-blue-100/80 via-blue-50/40 to-transparent border-b border-blue-200/80',
        h4Text: dark ? 'text-blue-200/90' : 'text-blue-900/85',
        marker: dark ? 'marker:text-blue-400/80' : 'marker:text-blue-700/80',
        strong: dark ? 'text-blue-300/90 drop-shadow-[0_0_4px_rgba(59,130,246,0.2)]' : 'text-blue-900/85',
        strongTitle: dark ? 'text-blue-300/90 decoration-blue-400/40' : 'text-blue-900/85 decoration-blue-500/40',
        strongBadge: dark ? 'bg-blue-500/10 border-blue-500/30 text-blue-300/90' : 'bg-blue-50 border-blue-300 text-blue-800/90',
        strongFrame: dark ? 'bg-gradient-to-l from-blue-500/10 to-transparent border-blue-500/20 text-blue-300/90' : 'bg-gradient-to-l from-blue-50 to-transparent border-blue-200 text-blue-900/85',
        del: dark ? 'bg-blue-500/10 border-blue-400/30 text-blue-300/90 shadow-[0_0_12px_rgba(59,130,246,0.06)]' : 'bg-blue-50 border-blue-300/70 text-blue-800/90 shadow-sm',
        link: dark ? 'text-blue-400 hover:text-blue-300 font-medium transition-colors underline underline-offset-4' : 'text-blue-600 hover:text-blue-800 font-medium transition-colors underline underline-offset-4',
        code: dark ? 'bg-blue-950/50 text-blue-200' : 'bg-blue-100/60 text-blue-950 border border-blue-200/60',
        quoteGeneric: dark ? 'border-blue-500/50 bg-blue-500/[0.08] text-blue-50' : 'border-blue-600 bg-[#F8FAFC] text-[#1E3A8A] shadow-sm ring-1 ring-blue-100/70',
        mainFrameBorder: dark ? 'border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.15)]' : 'border-blue-200/60 shadow-[0_2px_12px_rgba(37,99,235,0.04)]',
        childBox: dark
          ? 'bg-gradient-to-br from-[#061226]/90 via-[#0a1b38]/80 to-[#030914]/95 border-blue-500/40 shadow-[0_4px_20px_rgba(59,130,246,0.12)]'
          : 'bg-gradient-to-br from-blue-50/90 via-white to-blue-50/40 border-blue-300/90 shadow-[0_2px_15px_rgba(37,99,235,0.08)]',
        citationBtn: dark
          ? 'bg-blue-500/15 text-blue-300 border-blue-500/30 hover:bg-blue-500/30 hover:border-blue-400 shadow-blue-950/40'
          : 'bg-blue-100/80 text-blue-950 border-blue-300/80 hover:bg-blue-200 hover:border-blue-400 shadow-blue-100/50',
        citationIcon: 'text-blue-400',
        citationBadge: dark ? 'bg-blue-400/20 text-blue-200' : 'bg-blue-200 text-blue-900',
        popoverBox: dark ? 'bg-[#040e1c]/95 border-blue-500/30 text-white shadow-black/80' : 'bg-white/95 border-blue-200 text-slate-900 shadow-blue-900/15',
        itemBox: dark ? 'bg-white/[0.03] border-white/10' : 'bg-blue-50/50 border-blue-100',
        bookTitle: 'text-blue-400',
        sourceBtn: dark ? 'bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30' : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-sm',
        hierarchyTag: dark ? 'bg-blue-950/60 text-blue-300 border border-blue-500/30 hover:bg-blue-900/90 hover:border-blue-400/80 hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'bg-blue-100/90 text-blue-900 border border-blue-300/70 hover:bg-blue-200/90 hover:border-blue-400 hover:shadow-[0_0_12px_rgba(59,130,246,0.3)]',
        userBubbleGradient: 'linear-gradient(225deg, #172554 0%, #1e3a8a 50%, #1d4ed8 100%)',
      };
    case 'purple':
    default:
      return {
        h2Box: dark ? 'bg-purple-500/[0.07] border-purple-400/20' : 'bg-purple-50/80 border-purple-200/70',
        h2Bar: dark ? 'bg-purple-400' : 'bg-purple-600',
        h2Text: dark ? 'text-purple-300/90' : 'text-purple-800/85',
        h3Text: dark ? 'text-purple-300/90' : 'text-purple-800/85',
        h4Banner: dark
          ? 'from-purple-500/10 via-purple-500/[0.04] to-transparent border-b border-purple-500/20'
          : 'from-purple-100/80 via-purple-50/40 to-transparent border-b border-purple-200/80',
        h4Text: dark ? 'text-purple-200/90' : 'text-purple-900/85',
        marker: dark ? 'marker:text-purple-400/80' : 'marker:text-purple-700/80',
        strong: dark ? 'text-purple-300/90 drop-shadow-[0_0_4px_rgba(168,85,247,0.2)]' : 'text-purple-800/85',
        strongTitle: dark ? 'text-purple-300/90 decoration-purple-400/40' : 'text-purple-800/85 decoration-purple-500/40',
        strongBadge: dark ? 'bg-purple-500/10 border-purple-500/30 text-purple-300/90' : 'bg-purple-50 border-purple-300 text-purple-700/90',
        strongFrame: dark ? 'bg-gradient-to-l from-purple-500/10 to-transparent border-purple-500/20 text-purple-300/90' : 'bg-gradient-to-l from-purple-50 to-transparent border-purple-200 text-purple-800/85',
        del: dark ? 'bg-purple-500/10 border-purple-400/30 text-purple-300/90 shadow-[0_0_12px_rgba(168,85,247,0.06)]' : 'bg-purple-50 border-purple-300/70 text-purple-700/90 shadow-sm',
        link: dark ? 'text-purple-400 hover:text-purple-300 font-medium transition-colors underline underline-offset-4' : 'text-purple-600 hover:text-purple-800 font-medium transition-colors underline underline-offset-4',
        code: dark ? 'bg-purple-950/50 text-purple-200' : 'bg-purple-100/60 text-purple-900 border border-purple-200/60',
        quoteGeneric: dark ? 'border-purple-500/50 bg-purple-500/[0.08] text-purple-50' : 'border-purple-600 bg-[#FDFBF7] text-[#1E1B4B] shadow-sm ring-1 ring-purple-100/70',
        mainFrameBorder: dark ? 'border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.15)]' : 'border-purple-200/50 shadow-[0_2px_12px_rgba(124,58,237,0.03)]',
        childBox: dark
          ? 'bg-gradient-to-br from-[#16062b]/80 via-[#100321]/80 to-[#0a0216]/90 border-purple-500/40 shadow-[0_4px_20px_rgba(168,85,247,0.12)]'
          : 'bg-gradient-to-br from-purple-50/90 via-white to-purple-50/40 border-purple-300/90 shadow-[0_2px_15px_rgba(124,58,237,0.08)]',
        citationBtn: dark
          ? 'bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/30 hover:border-purple-400 shadow-purple-950/40'
          : 'bg-purple-100/80 text-purple-900 border-purple-300/80 hover:bg-purple-200 hover:border-purple-400 shadow-purple-100/50',
        citationIcon: 'text-purple-400',
        citationBadge: dark ? 'bg-purple-400/20 text-purple-200' : 'bg-purple-200 text-purple-800',
        popoverBox: dark ? 'bg-[#0f041c]/95 border-purple-500/30 text-white shadow-black/80' : 'bg-white/95 border-purple-200 text-slate-900 shadow-purple-900/15',
        itemBox: dark ? 'bg-white/[0.03] border-white/10' : 'bg-purple-50/50 border-purple-100',
        bookTitle: 'text-purple-400',
        sourceBtn: dark ? 'bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30' : 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700 shadow-sm',
        hierarchyTag: dark ? 'bg-purple-950/60 text-purple-300 border border-purple-500/30 hover:bg-purple-900/90 hover:border-purple-400/80 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-purple-100/90 text-purple-900 border border-purple-300/70 hover:bg-purple-200/90 hover:border-purple-400 hover:shadow-[0_0_12px_rgba(168,85,247,0.3)]',
        userBubbleGradient: 'linear-gradient(225deg, #4a044e 0%, #581c87 50%, #6b21a8 100%)',
      };
  }
}

export function Bubble({
  message,
  dark,
  avatarRef,
  lessonTitle,
  onStreamingChange
}: {
  message: Message;
  dark: boolean;
  avatarRef?: React.RefObject<HTMLSpanElement | null>;
  lessonTitle?: string;
  onStreamingChange?: (isStreaming: boolean) => void;
}) {
  const isUser = message.role === 'user'
  const { accentColor } = useTheme()
  const theme = getChatBubbleThemeClasses(accentColor, dark)

  let activeLessonBreadcrumb: string | undefined = lessonTitle
  try {
    const study = useStudy()
    if (study) {
      const parts = [study.headerSubtitle, study.chunkTitle].filter(Boolean)
      if (parts.length > 0) {
        activeLessonBreadcrumb = parts.join(' ‹ ')
      }
    }
  } catch (e) {
    // Graceful fallback if invoked outside StudyProvider
  }

  const [displayedText, setDisplayedText] = useState(() => (message.stream && !isUser) ? '' : message.text)
  const [isStreaming, setIsStreaming] = useState(() => (message.stream && !isUser) ? true : false)
  const [isCopied, setIsCopied] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const messageContentRef = useRef<HTMLDivElement>(null)

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleDownloadPDF = async () => {
    if (isExportingPDF) return
    try {
      setIsExportingPDF(true)
      await exportMessageToPdf(message.text, message.citations, activeLessonBreadcrumb)
    } catch (err) {
      console.error('Failed to export PDF:', err)
      alert('حدث خطأ أثناء تصدير ملف PDF، يرجى المحاولة مرة أخرى.')
    } finally {
      setIsExportingPDF(false)
    }
  }

  const onStreamingChangeRef = useRef(onStreamingChange);
  useEffect(() => {
    onStreamingChangeRef.current = onStreamingChange;
  }, [onStreamingChange]);

  const currentIdxRef = useRef(0);

  useEffect(() => {
    if (isUser || !message.stream || !isStreaming) return;

    onStreamingChangeRef.current?.(true);

    const fullText = message.text;
    const chunkSize = 3;

    const interval = setInterval(() => {
      currentIdxRef.current += chunkSize;
      if (currentIdxRef.current >= fullText.length) {
        setDisplayedText(fullText);
        setIsStreaming(false);
        onStreamingChangeRef.current?.(false);
        clearInterval(interval);
      } else {
        setDisplayedText(fullText.slice(0, currentIdxRef.current));
      }

      const scrollContainer = document.querySelector('.custom-scrollbar');
      if (scrollContainer) {
        const isAtBottom = scrollContainer.scrollHeight - scrollContainer.clientHeight <= scrollContainer.scrollTop + 150;
        if (isAtBottom) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    }, 20);

    return () => {
      clearInterval(interval);
    };
  }, [message.stream, message.text, isStreaming, isUser]);

  const markdownComponents = useMemo(() => {
    const extractText = (child: any): string => {
      if (!child) return '';
      if (typeof child === 'string') return child;
      if (Array.isArray(child)) return child.map(extractText).join('');
      if (child.props && child.props.children) return extractText(child.props.children);
      if (child.props && child.props.node && child.props.node.value) return child.props.node.value;
      return '';
    };

    return {
      h1: ({ node, ...props }: any) => (
        <h1
          className={`text-[17px] sm:text-[18px] md:text-[19px] font-bold mt-1 mb-3 leading-snug ${dark ? 'text-white' : 'text-primary'
            }`}
          {...props}
        />
      ),
      h2: ({ node, ...props }: any) => (
        <div
          className={`flex items-center gap-2 mt-3.5 mb-2 px-2.5 py-1.5 rounded-xl border ${theme.h2Box}`}
        >
          <span
            className={`w-1 h-4 rounded-full flex-shrink-0 ${theme.h2Bar}`}
          />
          <h2
            className={`text-[14.5px] sm:text-[15.5px] font-bold leading-snug ${theme.h2Text}`}
            {...props}
          />
        </div>
      ),
      h3: ({ node, ...props }: any) => (
        <div
          className={`flex items-center gap-2 mb-3.5 px-3 sm:px-4 py-2 sm:py-2.5 -mx-3 sm:-mx-4 -mt-3 sm:-mt-4 bg-gradient-to-l ${dark
            ? 'from-white/[0.06] to-transparent border-b border-white/10'
            : 'from-primary/[0.05] to-transparent border-b border-primary/10'
            }`}
        >
          <h3
            className={`text-[14.5px] sm:text-[15.5px] md:text-[16px] font-bold leading-snug ${theme.h3Text}`}
            {...props}
          />
        </div>
      ),
      h4: ({ node, ...props }: any) => (
        <div
          className={`flex items-center gap-2 mb-2.5 px-3 sm:px-4 py-1.5 sm:py-2 -mx-3 sm:-mx-4 -mt-3 sm:-mt-4 bg-gradient-to-l ${theme.h4Banner}`}
        >
          <h4
            className={`text-[13.5px] sm:text-[14.5px] font-bold leading-snug ${theme.h4Text}`}
            {...props}
          />
        </div>
      ),
      p: ({ node, ...props }: any) => (
        <p
          className={`mb-4 last:mb-0 text-[15px] md:text-[16px] leading-[1.85] ${dark ? 'text-white/90' : 'text-[#0F172A]'
            }`}
          {...props}
        />
      ),
      ul: ({ node, ...props }: any) => (
        <ul className={`list-disc list-outside pr-4 sm:pr-6 [&_ul]:pr-2 [&_ol]:pr-2 sm:[&_ul]:pr-6 sm:[&_ol]:pr-6 mr-0 sm:mr-2 mb-4 space-y-3 ${theme.marker}`} {...props} />
      ),
      ol: ({ node, ...props }: any) => (
        <ol
          className={`list-decimal list-outside pr-4 sm:pr-6 [&_ul]:pr-2 [&_ol]:pr-2 sm:[&_ul]:pr-6 sm:[&_ol]:pr-6 mr-0 sm:mr-2 mb-4 space-y-3 font-semibold ${theme.marker}`}
          {...props}
        />
      ),
      li: ({ node, ...props }: any) => (
        <li
          className={`text-[15px] md:text-[16px] leading-[1.85] pr-1 sm:pr-1.5 ${dark ? 'text-white/90' : 'text-[#0F172A]'}`}
          {...props}
        />
      ),
      strong: ({ node, ...props }: any) => {
        const text = extractText(props.children);
        if (text.includes('ZAD_TITLE_') || text.includes('__TITLE__')) {
          return (
            <strong
              className={`font-bold underline underline-offset-[6px] decoration-[1.5px] ${theme.strongTitle}`}
            >
              {text.replace(/ZAD_TITLE_/g, '').replace(/__TITLE__/g, '')}
            </strong>
          );
        }
        if (text.includes('ZAD_BADGE_') || text.includes('__BADGE__')) {
          return (
            <strong
              className={`font-bold inline-block px-2.5 py-0.5 mx-1 rounded-md border text-[13px] md:text-[14px] ${theme.strongBadge}`}
            >
              {text.replace(/ZAD_BADGE_/g, '').replace(/__BADGE__/g, '')}
            </strong>
          );
        }
        if (text.includes('ZAD_FRAME_') || text.includes('__FRAME__')) {
          return (
            <strong
              className={`inline-flex items-center mb-1.5 mt-2 px-3 py-1 rounded-full border border-b-[2px] font-bold text-[13.5px] sm:text-[14px] shadow-xs max-w-full leading-tight ${theme.strongFrame}`}
            >
              <span>{text.replace(/ZAD_FRAME_/g, '').replace(/__FRAME__/g, '')}</span>
            </strong>
          );
        }
        return (
          <strong
            className={`font-bold ${theme.strong}`}
            {...props}
          />
        );
      },
      em: ({ node, ...props }: any) => {
        const text = extractText(props.children);
        if (text.startsWith('__REF__')) {
          return (
            <span className={`block w-full mt-3 pt-2 border-t ${dark ? 'border-white/15' : 'border-black/10'} text-[12.5px] md:text-[13.5px] opacity-90 font-medium text-left`} dir="rtl">
              {text.replace('__REF__', '')}
            </span>
          );
        }
        return <em className="italic" {...props} />;
      },
      del: ({ node, ...props }: any) => {
        return (
          <span
            className={`inline-flex items-center mx-1 px-3 py-1 rounded-lg border align-middle font-bold text-[13px] md:text-[14px] ${theme.del}`}
            {...props}
          />
        );
      },
      blockquote: ({ node, ...props }: any) => {
        const quoteText = extractText(props.children).trim();
        let type:
          | 'quran'
          | 'hadith'
          | 'saying'
          | 'poetry'
          | 'reference'
          | 'generic' = 'generic';

        if (quoteText.startsWith('[QURAN]')) type = 'quran';
        else if (quoteText.startsWith('[HADITH]')) type = 'hadith';
        else if (quoteText.startsWith('[SAYING]')) type = 'saying';
        else if (quoteText.startsWith('[POETRY]')) type = 'poetry';
        else if (quoteText.startsWith('[REFERENCE]')) type = 'reference';

        const styles = {
          quran: {
            dark: 'border-emerald-400/60 bg-emerald-500/[0.10] text-emerald-50 shadow-[inset_0_0_30px_rgba(16,185,129,0.06),0_8px_30px_rgba(16,185,129,0.05)]',
            light: 'border-emerald-500 bg-[#ECFDF5] text-emerald-950 shadow-sm ring-1 ring-emerald-100',
            icon: <BookOpen className="w-[18px] h-[18px]" strokeWidth={2.5} />,
            label: 'آية قرآنية',
          },
          hadith: {
            dark: 'border-sky-400/50 bg-sky-500/[0.09] text-sky-50 shadow-[inset_0_0_30px_rgba(14,165,233,0.05),0_8px_30px_rgba(14,165,233,0.04)]',
            light: 'border-sky-500 bg-[#F0F9FF] text-sky-950 shadow-sm ring-1 ring-sky-100',
            icon: <Book className="w-[18px] h-[18px]" strokeWidth={2.5} />,
            label: 'حديث نبوي',
          },
          saying: {
            dark: 'border-violet-400/50 bg-violet-500/[0.09] text-violet-50 shadow-[inset_0_0_30px_rgba(139,92,246,0.05),0_8px_30px_rgba(139,92,246,0.04)]',
            light: 'border-purple-600 bg-[#FDFBF7] text-[#1E1B4B] shadow-sm ring-1 ring-purple-100/70',
            icon: <User className="w-[18px] h-[18px]" strokeWidth={2.5} />,
            label: 'قول عالم',
          },
          poetry: {
            dark: 'border-amber-400/50 bg-amber-500/[0.09] text-amber-50 shadow-[inset_0_0_30px_rgba(245,158,11,0.05),0_8px_30px_rgba(245,158,11,0.04)]',
            light: 'border-amber-500 bg-[#FFFBEB] text-amber-950 shadow-sm ring-1 ring-amber-100',
            icon: <Feather className="w-[18px] h-[18px]" strokeWidth={2.5} />,
            label: 'شعر',
          },
          reference: {
            dark: 'border-indigo-400/40 bg-indigo-500/[0.05] text-indigo-100 shadow-[inset_0_0_30px_rgba(99,102,241,0.03),0_8px_30px_rgba(99,102,241,0.02)]',
            light: 'border-indigo-500 bg-[#EEF2FF] text-indigo-950 shadow-sm ring-1 ring-indigo-100',
            icon: <FileText className="w-[18px] h-[18px]" strokeWidth={2.5} />,
            label: 'مرجع',
          },
          generic: {
            dark: theme.quoteGeneric,
            light: theme.quoteGeneric,
            icon: <FileText className="w-[18px] h-[18px]" strokeWidth={2.5} />,
            label: 'اقتباس',
          },
        };

        const style = styles[type];
        let prefixRemoved = false;
        const removePrefix = (text: string) => {
          const original = text;
          const replaced = text.replace(/^\[QURAN\]\s*/, '').replace(/^\[HADITH\]\s*/, '').replace(/^\[SAYING\]\s*/, '').replace(/^\[POETRY\]\s*/, '').replace(/^\[REFERENCE\]\s*/, '');
          if (replaced !== original) prefixRemoved = true;
          return replaced;
        };

        const recursivelyClean = (node: any): any => {
          if (prefixRemoved) return node;
          if (typeof node === 'string') return removePrefix(node);
          if (Array.isArray(node)) return node.map(recursivelyClean);
          if (React.isValidElement(node)) {
            const children = (node.props as any)?.children;
            if (children) {
              return React.cloneElement(node, {
                children: recursivelyClean(children)
              } as any);
            }
          }
          return node;
        };

        const cleanedChildren = recursivelyClean(props.children);

        return (
          <blockquote
            className={`relative my-5 rounded-2xl border-r-[5px] px-5 py-4 ${dark ? style.dark : style.light
              }`}
            {...props}
          >
            <div
              className={
                type === 'quran'
                  ? 'text-[17px] md:text-[18px] leading-[2.05] font-semibold'
                  : type === 'reference'
                    ? 'text-[14px] md:text-[15px] leading-[1.85] font-medium opacity-90'
                    : 'text-[15px] md:text-[16px] leading-[1.95] font-semibold'
              }
            >
              {cleanedChildren}
            </div>
          </blockquote>
        );
      },

      a: ({ node, href, children, ...props }: any) => {
        if (href && href.startsWith('#cit-')) {
          const rawIds = href.replace('#cit-', '');
          const ids = rawIds.split(',').map(Number).filter(Boolean);
          return <CitationPill ids={ids} citations={message.citations} dark={dark} />;
        }
        return (
          <a
            className={theme.link}
            target="_blank"
            rel="noopener noreferrer"
            href={href}
            {...props}
          />
        );
      },

      hr: () => null,

      code: ({ node, ...props }: any) => (
        <code
          className={`px-1.5 py-0.5 rounded-md text-sm font-mono ${theme.code}`}
          {...props}
        />
      ),
    };
  }, [dark, message.citations, accentColor]);

  return (
    <div className={`flex w-full min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-500 ${isUser ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex min-w-0 gap-1.5 sm:gap-3 w-full flex-col ${isUser ? 'items-start' : 'items-end'}`}>
        {isUser ? (
          <div
            className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full text-white shadow-lg shadow-primary/30"
            style={{ background: theme.userBubbleGradient }}
          >
            <User size={18} className="sm:hidden" strokeWidth={2.5} />
            <User size={22} className="hidden sm:block" strokeWidth={2.5} />
          </div>
        ) : (
          <span ref={avatarRef} className="shrink-0">
            <AvatarLogo dark={dark} />
          </span>
        )}
        {isUser ? (
          <div
            className="rounded-[18px] sm:rounded-[22px] px-3 sm:px-4.5 py-2 sm:py-3 text-sm sm:text-[15px] leading-relaxed shadow-sm rounded-tr-none text-white whitespace-pre-line break-words"
            style={{ background: theme.userBubbleGradient }}
          >
            {message.text}
          </div>
        ) : (
          <div className="flex flex-col flex-1 w-full min-w-0 pt-0.5 sm:pt-1">
            <div
              ref={messageContentRef}
              data-selectable="true"
              className={`relative px-2 sm:px-4 py-2.5 sm:py-4 border rounded-[18px] sm:rounded-[22px] rounded-tl-none flex flex-col gap-2.5 sm:gap-4 ${dark
                ? 'bg-black/60 backdrop-blur-2xl border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.15)]'
                : 'bg-[#FAF9FC] border-primary/15 shadow-[0_4px_20px_rgba(124,58,237,0.04)]'
                }`}
            >
              <ResponseMetadataBadges
                domain={message.domain}
                mode={message.responseMode || message.response_mode}
                dark={dark}
              />
              {(() => {
                const structuredFrames = parseTextIntoFrames(displayedText);
                return structuredFrames.map((mainFrame, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border flex flex-col gap-2 ${dark
                      ? 'bg-white/[0.02] border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.15)]'
                      : `bg-white ${theme.mainFrameBorder}`
                      }`}
                  >
                    {mainFrame.content.trim().length > 0 && (
                      <div dir="rtl" className="w-full text-right">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={markdownComponents as any}
                        >
                          {preprocessFrameText(mainFrame.content)}
                        </ReactMarkdown>
                      </div>
                    )}

                    {mainFrame.children.length > 0 && (
                      <div className={`flex flex-col gap-2.5 sm:gap-3.5 ${mainFrame.content.trim().length > 0 ? 'mt-1.5' : ''}`}>
                        {mainFrame.children.map((childContent, cIdx) => (
                          <div
                            key={cIdx}
                            className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border ${theme.childBox}`}
                          >
                            <div dir="rtl" className="w-full text-right">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={markdownComponents as any}
                              >
                                {preprocessFrameText(childContent)}
                              </ReactMarkdown>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ));
              })()}

              {message.citations && message.citations.length > 0 && !isStreaming && (
                <div className="mt-1 pt-1 animate-in fade-in zoom-in duration-500">
                  <CitationsSection citations={message.citations} dark={dark} />
                </div>
              )}

              {!isUser && !isStreaming && (
                <div className="flex items-center justify-end gap-1.5 mt-2 pt-2 border-t max-w-full" dir="rtl" style={{ borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                  <AudioReaderButton
                    text={displayedText}
                    dark={dark}
                    showTextLabel={false}
                    hidePodcast={true}
                    colorTheme={accentColor}
                    menuPlacement="top"
                    className="!h-8 !w-8 !p-0 !justify-center !rounded-xl hover:scale-105 transition-transform"
                  />

                  <button
                    onClick={handleCopy}
                    title={isCopied ? 'تم النسخ' : 'نسخ النص'}
                    aria-label="نسخ النص"
                    className={`h-8 w-8 flex items-center justify-center rounded-xl text-[13px] font-bold transition-all duration-200 hover:scale-105 cursor-pointer ${
                      isCopied
                        ? 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/30'
                        : dark
                          ? 'text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10'
                          : 'text-slate-600 hover:text-slate-900 bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200'
                    }`}
                  >
                    {isCopied ? (
                      <Check size={14} className="text-emerald-500 drop-shadow-sm" strokeWidth={3} />
                    ) : (
                      <Copy size={14} strokeWidth={2.2} />
                    )}
                  </button>

                  <button
                    onClick={handleDownloadPDF}
                    disabled={isExportingPDF}
                    title="حفظ كـ PDF"
                    aria-label="حفظ كـ PDF"
                    className={`h-8 w-8 flex items-center justify-center rounded-xl text-[13px] font-bold transition-all duration-200 hover:scale-105 cursor-pointer ${
                      dark
                        ? 'text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10'
                        : 'text-slate-600 hover:text-slate-900 bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200'
                    } ${isExportingPDF ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    {isExportingPDF ? (
                      <Loader2 size={14} className="animate-spin text-primary" />
                    ) : (
                      <Download size={14} strokeWidth={2.2} />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function TypingBubble({ dark, avatarRef }: { dark: boolean; avatarRef?: React.RefObject<HTMLSpanElement | null> }) {
  return (
    <div className="flex justify-end animate-in fade-in duration-500">
      <div className="flex gap-1.5 sm:gap-3 flex-col items-end w-full sm:w-auto">
        <span ref={avatarRef}>
          <AvatarLogo dark={dark} />
        </span>
        <div className={`flex items-center gap-1.5 rounded-[20px] rounded-tl-none border px-5 py-4 shadow-sm ${dark ? 'bg-[#1a0730]/80 border-white/10' : 'bg-white border-primary/10'}`}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 animate-bounce rounded-full bg-primary/60"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function getMadhhabHex(madhhab: string) {
  if (!madhhab) return '#9333EA'
  if (madhhab.includes('مالك')) return '#F59E0B' // Amber
  if (madhhab.includes('حنب')) return '#10B981' // Emerald
  if (madhhab.includes('شافع')) return '#DC143C' // Crimson
  if (madhhab.includes('حنف')) return '#8B5CF6' // Violet
  return '#9333EA' // Default Purple
}

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function CustomChip({ label, icon: Icon, color, dark }: { label: string; icon: any; color: string; dark: boolean }) {
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-[5px] rounded-full border transition-all duration-300 hover:scale-105"
      style={{
        backgroundColor: hexToRgba(color, dark ? 0.08 : 0.05),
        borderColor: hexToRgba(color, dark ? 0.35 : 0.4)
      }}
    >
      <Icon size={13} style={{ color }} strokeWidth={2.5} />
      <span
        className="font-sans text-[12px] font-semibold"
        style={{
          color,
          textShadow: dark ? `0 0 10px ${hexToRgba(color, 0.4)}` : 'none'
        }}
      >
        {label}
      </span>
    </div>
  )
}

function getDomainBadgeInfo(domain?: string) {
  if (!domain) return null
  const lower = domain.toLowerCase()
  if (lower.includes('fiqh') || lower.includes('فقه')) return { label: 'القسم: الفقه', icon: BookOpen, color: '#10B981' }
  if (lower.includes('seerah') || lower.includes('سيرة') || lower.includes('تاريخ')) return { label: 'القسم: السيرة والتاريخ', icon: Book, color: '#F59E0B' }
  if (lower.includes('aqeedah') || lower.includes('عقيدة')) return { label: 'القسم: العقيدة', icon: Feather, color: '#8B5CF6' }
  if (lower.includes('tafsir') || lower.includes('تفسير') || lower.includes('quran') || lower.includes('قرآن')) return { label: 'القسم: التفسير وعلوم القرآن', icon: FileText, color: '#EC4899' }
  if (lower.includes('hadith') || lower.includes('حديث')) return { label: 'القسم: الحديث وعلومه', icon: BookOpen, color: '#3B82F6' }
  if (lower.includes('nahw') || lower.includes('لغة') || lower.includes('نحو')) return { label: 'القسم: اللغة العربية والنحو', icon: FileText, color: '#06B6D4' }
  if (lower.includes('adab') || lower.includes('آداب')) return { label: 'القسم: الآداب والأخلاق', icon: Feather, color: '#10B981' }
  return { label: `القسم: ${domain}`, icon: BookOpen, color: '#A855F7' }
}

function getModeBadgeInfo(mode?: string) {
  if (!mode) return null
  const lower = mode.toLowerCase()
  if (lower.includes('student')) return { label: 'النمط: طالب علم', color: '#10B981' }
  return { label: 'النمط: إجابة ميسّرة', color: '#A855F7' }
}

function ResponseMetadataBadges({ domain, mode, dark }: { domain?: string; mode?: string; dark: boolean }) {
  const domainInfo = getDomainBadgeInfo(domain)
  const modeInfo = getModeBadgeInfo(mode)

  if (!domainInfo && !modeInfo) return null

  return (
    <div className="flex flex-wrap items-center gap-2 pb-2.5 mb-2 border-b w-full" dir="rtl" style={{ borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(124,58,237,0.1)' }}>
      {domainInfo && (
        <CustomChip
          label={domainInfo.label}
          icon={domainInfo.icon}
          color={domainInfo.color}
          dark={dark}
        />
      )}
      {modeInfo && (
        <CustomChip
          label={modeInfo.label}
          icon={Feather}
          color={modeInfo.color}
          dark={dark}
        />
      )}
    </div>
  )
}

function getCitation(citations: CitationDTO[] | Record<string, CitationDTO> | undefined, num: number): CitationDTO | undefined {
  if (!citations) return undefined;
  if (Array.isArray(citations)) {
    return citations[num - 1] || citations.find(c => c.pageId === num || c.page_id === num);
  }
  if (typeof citations === 'object') {
    return citations[`cit_${num}`] || citations[num.toString()] || citations[(num - 1).toString()];
  }
  return undefined;
}

function CitationPill({ ids, citations, dark }: { ids: number[]; citations?: CitationDTO[] | Record<string, CitationDTO>; dark: boolean }) {
  const { accentColor } = useTheme();
  const theme = getChatBubbleThemeClasses(accentColor, dark);
  const [isOpen, setIsOpen] = useState(false);
  const pillRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 300);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pillRef.current && !pillRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const matchingCitations = ids
    .map(num => getCitation(citations, num))
    .filter(Boolean) as CitationDTO[];

  if (matchingCitations.length === 0) {
    return <span className="text-xs opacity-75 font-mono px-1">[{ids.join(', ')}]</span>;
  }

  const primary = matchingCitations[0];
  const rawBookTitle = primary.bookTitle || primary.book_title || 'مصدر شرعي';
  const truncatedTitle = rawBookTitle.length > 15 ? `${rawBookTitle.slice(0, 15)}...` : rawBookTitle;
  const extraCount = matchingCitations.length - 1;

  return (
    <span
      ref={pillRef}
      className="relative inline-block mx-1 my-0.5 align-middle select-none z-10"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(prev => !prev);
        }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-[12px] font-semibold transition-all duration-200 ease-out cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] ${theme.citationBtn}`}
      >
        <BookOpen size={12} className={`shrink-0 ${theme.citationIcon}`} strokeWidth={2.5} />
        <span className="font-sans font-bold">{truncatedTitle}</span>
        {extraCount > 0 && (
          <span className={`px-1.5 py-0.2 rounded text-[10.5px] font-extrabold ${theme.citationBadge}`}>
            +{extraCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.93 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.94 }}
            transition={{
              type: 'spring',
              stiffness: 420,
              damping: 28,
              mass: 0.75,
            }}
            className="absolute bottom-full pb-2.5 right-0 z-[100] w-72 sm:w-80 origin-bottom-right"
            dir="rtl"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className={`p-3.5 rounded-2xl border shadow-2xl backdrop-blur-xl transition-shadow duration-300 ${theme.popoverBox}`}
            >
              <div className="flex flex-col gap-3 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {matchingCitations.map((cit, idx) => {
                  const bTitle = cit.bookTitle || cit.book_title || 'بدون عنوان';
                  const author = cit.author || '';
                  const authorDeath = cit.authorDeath || cit.author_death || '';
                  const part = cit.part && cit.part !== '0' ? `جـ ${cit.part}` : '';
                  const page = (cit.pageId || cit.page_id) ? `ص ${cit.pageId || cit.page_id}` : '';
                  const sUrl = cit.sourceUrl || cit.source_url || 'https://kitabonline.org';
                  const mColor = getMadhhabHex(cit.madhhab || '');

                  return (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border flex flex-col gap-2 ${theme.itemBox}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col min-w-0">
                          <span className={`font-bold text-xs sm:text-sm font-sans leading-snug break-words ${theme.bookTitle}`}>
                            {bTitle}
                          </span>
                          {author && (
                            <span className="text-[11px] opacity-75 font-sans mt-0.5">
                              {author} {authorDeath && !authorDeath.includes('غير معروف') ? `(${authorDeath})` : ''}
                            </span>
                          )}
                        </div>
                        <a
                          href={sUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className={`shrink-0 flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all hover:scale-105 ${theme.sourceBtn}`}
                        >
                          <span>عرض المصدر</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        {cit.madhhab && (
                          <span className="px-1.5 py-0.5 rounded text-[10.5px] font-bold" style={{ backgroundColor: hexToRgba(mColor, 0.15), color: mColor }}>
                            {cit.madhhab}
                          </span>
                        )}
                        {(part || page) && (
                          <span className={`px-1.5 py-0.5 rounded text-[10.5px] font-semibold ${dark ? 'bg-white/10 text-slate-300' : 'bg-slate-200/80 text-slate-700'}`}>
                            {[part, page].filter(Boolean).join(' | ')}
                          </span>
                        )}
                        {cit.hierarchy && (
                          <span
                            title={cit.hierarchy}
                            className={`inline-block px-2.5 py-0.5 rounded-lg text-[10.5px] font-semibold leading-relaxed transition-all duration-300 ease-out cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap max-w-[180px] sm:max-w-[210px] hover:max-w-full hover:whitespace-normal hover:overflow-visible ${theme.hierarchyTag}`}
                          >
                            {cit.hierarchy}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

function HierarchyBreadcrumbs({ hierarchy, dark, color }: { hierarchy: string; dark: boolean; color: string }) {
  if (!hierarchy) return null;

  // Split by common hierarchy separators
  const parts = hierarchy.split(/[/\\>|]| - /).map(p => p.trim()).filter(Boolean);

  if (parts.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-1.5">
      {parts.map((part, idx) => (
        <div key={idx} className="flex items-center gap-1.5">
          <div
            className="px-3 py-[5px] rounded-[10px] text-[12px] font-bold transition-all duration-300 hover:scale-105 flex items-center justify-center"
            style={{
              backgroundColor: hexToRgba(color, dark ? 0.12 : 0.06),
              color: dark ? 'rgba(255,255,255,0.95)' : '#1E293B',
              border: `1px solid ${hexToRgba(color, dark ? 0.3 : 0.25)}`,
              boxShadow: dark ? `0 2px 10px ${hexToRgba(color, 0.15)}` : `0 2px 5px rgba(0,0,0,0.02)`
            }}
          >
            {part}
          </div>
          {idx < parts.length - 1 && (
            <ChevronLeft size={16} style={{ color: hexToRgba(color, dark ? 0.8 : 0.6) }} strokeWidth={2.5} />
          )}
        </div>
      ))}
    </div>
  )
}

function CitationCard({ citation, index, dark }: { citation: CitationDTO; index: number; dark: boolean }) {
  const madhhabColor = getMadhhabHex(citation.madhhab || '')

  const bookTitle = citation.bookTitle || citation.book_title || 'بدون عنوان'
  const author = citation.author || ''
  const authorDeath = citation.authorDeath || citation.author_death || ''
  const totalParts = citation.totalParts || citation.total_parts || 0
  const pageId = citation.pageId || citation.page_id || 0
  const sourceUrl = citation.sourceUrl || citation.source_url || ''

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        show: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { type: "spring", stiffness: 300, damping: 24 }
        }
      }}
      dir="rtl"
      className={`relative rounded-2xl border border-r-[4px] group-hover:border-r-[8px] transition-all duration-500 overflow-hidden group ${dark
        ? 'bg-transparent border-white/10 hover:-translate-y-1.5 hover:border-white/25 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)]'
        : 'bg-white border-primary/10 hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]'
        }`}
      style={{ borderRightColor: madhhabColor }}
    >
      <div className="p-4 pr-5">
        <div className="flex items-start w-full">
          {/* Right side (Index and Open Btn) */}
          <div className="flex items-center gap-2 shrink-0">
            <div
              className="px-2.5 py-1 rounded-[6px] flex items-center justify-center min-w-[32px]"
              style={{ backgroundColor: hexToRgba(madhhabColor, dark ? 0.2 : 0.1) }}
            >
              <span className="text-[12px] font-bold" style={{ color: madhhabColor }}>{index}</span>
            </div>

            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1 rounded-[6px] transition-colors hover:opacity-80 flex items-center justify-center"
                style={{ border: `1px solid ${hexToRgba(madhhabColor, 0.3)}` }}
              >
                <ExternalLink size={16} style={{ color: madhhabColor }} strokeWidth={2} />
              </a>
            )}
          </div>

          <div className="w-3 shrink-0" />

          {/* Left side (Title and Author) */}
          <div className="flex-1 flex flex-col items-start min-w-0 pt-0.5">
            <h4 className={`font-bold text-[16px] md:text-[17px] leading-[1.5] ${dark ? 'text-white/95' : 'text-brand-deep'} font-sans text-right w-full break-words`}>
              {bookTitle}
            </h4>
            {author && (
              <span className={`text-[12px] md:text-[13px] font-medium mt-1.5 ${dark ? 'text-white/60' : 'text-primary/70'} font-sans text-right w-full`}>
                {author}
              </span>
            )}
          </div>
        </div>

        {/* Chips Wrap */}
        <div className="flex flex-wrap gap-2 mt-4">
          {citation.madhhab && (
            <CustomChip
              label={citation.madhhab}
              icon={LayoutGrid}
              color={madhhabColor}
              dark={dark}
            />
          )}
          {citation.part && citation.part !== '0' && (
            <CustomChip
              label={`الجزء ${citation.part} ${totalParts > 0 ? `من ${totalParts}` : ''}`}
              icon={Book}
              color="#3B82F6"
              dark={dark}
            />
          )}
          {pageId > 0 && (
            <CustomChip
              label={`ص ${pageId}`}
              icon={FileText}
              color="#10B981"
              dark={dark}
            />
          )}
          {authorDeath && !authorDeath.includes('غير معروف') && (
            <CustomChip
              label={authorDeath}
              icon={Feather}
              color="#6366F1"
              dark={dark}
            />
          )}
        </div>

        {/* Hierarchy */}
        {citation.hierarchy && (
          <HierarchyBreadcrumbs hierarchy={citation.hierarchy} dark={dark} color={madhhabColor} />
        )}
      </div>
    </motion.div>
  )
}

function CitationsSection({ citations, dark }: { citations: CitationDTO[]; dark: boolean }) {
  const [isOpen, setIsOpen] = useState(false)

  if (!citations || citations.length === 0) return null

  return (
    <div
      className={`w-full rounded-[14px] border overflow-hidden transition-all duration-300 ${isOpen
        ? (dark ? 'bg-black/30 border-emerald-500/30 shadow-[0_4px_20px_rgba(16,185,129,0.15)]' : 'bg-white border-emerald-500/30 shadow-md')
        : (dark ? 'bg-black/20 border-white/10 shadow-inner' : 'bg-[#F8FAFC] border-[#E2E8F0]')
        }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full px-4 py-3.5 group transition-all duration-300 ${isOpen
          ? (dark ? 'bg-gradient-to-l from-emerald-500/10 to-transparent' : 'bg-gradient-to-l from-emerald-50/80 to-transparent')
          : (dark ? 'hover:bg-white/5' : 'hover:bg-black/5')
          }`}
        dir="rtl"
      >
        <div className="flex items-center gap-3 transition-transform group-hover:-translate-x-1 duration-300">
          <div className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-300 ${isOpen ? 'bg-emerald-500/20 text-emerald-400' : (dark ? 'bg-white/5 text-white/60 group-hover:bg-emerald-500/20 group-hover:text-emerald-400' : 'bg-black/5 text-gray-500 group-hover:bg-emerald-100 group-hover:text-emerald-600')
            }`}>
            <BookOpen className="w-[18px] h-[18px]" strokeWidth={2.5} />
          </div>
          <span className={`font-sans text-[15px] font-bold transition-colors duration-300 ${isOpen
            ? (dark ? 'text-emerald-300' : 'text-emerald-700')
            : (dark ? 'text-white/90 group-hover:text-emerald-400' : 'text-[#374151] group-hover:text-emerald-600')
            }`}>
            {citations.length} {citations.length === 1 ? 'مصدر موثوق' : 'مصادر موثوقة'}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${dark ? 'bg-white/5 text-white/50 group-hover:bg-white/10 group-hover:text-white' : 'bg-black/5 text-gray-500 group-hover:bg-black/10 group-hover:text-gray-800'
            }`}
        >
          <ChevronDown className="w-5 h-5" strokeWidth={2.5} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-4 pb-4">
              <div className={`h-px w-full mb-4 ${dark ? 'bg-emerald-500/20' : 'bg-emerald-200/50'}`} />
              <motion.div
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.08 }
                  }
                }}
                initial="hidden"
                animate="show"
                className="flex flex-col gap-3"
              >
                {citations.map((cit, idx) => (
                  <CitationCard key={idx} citation={cit} index={idx + 1} dark={dark} />
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}