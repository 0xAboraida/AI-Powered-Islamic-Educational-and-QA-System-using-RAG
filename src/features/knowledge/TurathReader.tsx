import React, { useState, useEffect, useMemo, useRef, useCallback, useDeferredValue } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, FileText, BookText, Folder, Menu, Loader2, Search, ChevronDown, ChevronUp, Settings2, Maximize, Minimize, Sun, Moon, Type, Sparkles, X, Send, Bookmark, Copy, Volume2, VolumeX, BookmarkCheck, AlignJustify, MoreVertical, MoreHorizontal, Hash, Download, CheckCircle2, FileDown, Layers, Check, HardDriveDownload, BookCheck, RotateCcw, Highlighter, Trash2, Share2, Palette, Quote, ExternalLink } from 'lucide-react'
import { useTheme, type AccentColor } from '../../contexts/ThemeContext'

const THEME_ACCENTS: { id: AccentColor; name: string; gradient: string; ring: string }[] = [
  { id: 'purple', name: 'أرجواني', gradient: 'from-purple-700 to-fuchsia-500', ring: 'ring-purple-400' },
  { id: 'emerald', name: 'فيروزي', gradient: 'from-teal-700 via-teal-500 to-cyan-400', ring: 'ring-teal-400' },
  { id: 'amber', name: 'عاجي', gradient: 'from-[#8e682d] via-[#c59b58] to-[#eedbb2]', ring: 'ring-[#dfbf83]' },
  { id: 'blue', name: 'ياقوتي', gradient: 'from-blue-700 to-indigo-500', ring: 'ring-blue-400' },
];

const FONT_OPTIONS = [
  { id: 'font-amiri', name: 'الخط الأميري', class: 'font-amiri' },
  { id: 'font-scheherazade', name: 'خط شهرزاد', class: 'font-scheherazade' },
  { id: 'font-noto-naskh', name: 'خط النسخ', class: 'font-noto-naskh' },
  { id: 'font-cairo', name: 'خط القاهرة', class: 'font-cairo' },
];
import { Bubble, TypingBubble } from '../chat/components/ChatBubble'
import type { Message } from '../chat/data'
import { speakText, stopAllSpeech, getVoiceName } from '@/services/geminiTtsService'
import whiteLogo from '@/assets/images/WhiteLogo.png'
import zadDarkLogo from '@/assets/images/ZadDarkLogo.png'
import { PanelResizer } from '../study/components/PanelResizer'
import { AudioReaderButton } from '@/components/common/AudioReaderButton'
import { fetchTurathBookIndexes, fetchTurathPage, searchTurathCorpus, fetchTurathBookPdfUrl, type TurathSearchHit } from '../../api/turathApi'
import { idbGetTurathBookTree, idbSetTurathBookTree, idbDeleteTurathBookTree, idbSaveBookOffline, idbGetOfflineBook, idbIsBookSavedOffline, idbRemoveOfflineBook } from '../../utils/indexedDbStorage'
import { downloadBookFile } from './utils/bookExport'
import { hasBookPdf, getBookPdfUrl, parsePdfFilesList, type VolumePdfItem } from './utils/turathMeta'
import IslamicPattern from './components/IslamicPattern'

import type { BookMeta } from './types/bookTypes'

type Heading = {
  id: number
  title: string
  level: number
  page: number
}

interface TreeNode extends Heading {
  children: TreeNode[];
  originalIndex: number;
  isVolumeFolder?: boolean;
  volName?: string;
  totalChapters?: number;
}

export interface BookHighlight {
  id: string;
  bookId: string | number;
  page: number;
  text: string;
  color: string;
  createdAt: number;
}

function normalizeArabicForSearch(str: string): string {
  if (!str) return '';
  return str
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // remove tashkeel & tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .trim()
    .toLowerCase();
}

const toEasternArabicNumerals = (num: number | string): string => {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num).replace(/[0-9]/g, (d) => arabicDigits[Number(d)]);
};

const formatVolumeTitle = (vol: string): string => {
  const isNum = /^\d+$/.test(vol.trim());
  if (isNum) {
    return `المجلد (${toEasternArabicNumerals(vol)})`;
  }
  return `المجلد: ${vol}`;
};

const buildTree = (headings: (Heading & { originalIndex?: number })[]): TreeNode[] => {
  const root: TreeNode[] = [];
  const stack: TreeNode[] = [];

  headings.forEach((h, i) => {
    const origIdx = h.originalIndex !== undefined ? h.originalIndex : i;
    const node: TreeNode = { ...h, originalIndex: origIdx, children: [] };
    while (stack.length > 0 && stack[stack.length - 1].level >= node.level) {
      stack.pop();
    }
    if (stack.length === 0) root.push(node);
    else stack[stack.length - 1].children.push(node);
    stack.push(node);
  });
  return root;
}

/**
 * Strips all HTML/XML tags (including malformed, broken, or clipped tags like `span data-type="title" >`
 * and `< span/>`) and decodes HTML entities, while optionally preserving `<em>` highlight tokens.
 */
function cleanTurathSnippet(rawText: string, preserveHighlights: boolean = true): string {
  if (!rawText) return '';

  let text = rawText;

  // 1. If preserving highlights, replace <em> and </em> with safe internal tokens
  if (preserveHighlights) {
    text = text
      .replace(/<em\b[^>]*>/gi, '___EM_START___')
      .replace(/<\/em>/gi, '___EM_END___');
  } else {
    text = text.replace(/<\/?em\b[^>]*>/gi, '');
  }

  // 2. Remove malformed tags with spaces (e.g. `< span/>`, `</ span>`, `< / span >`)
  text = text.replace(/<\s*\/?\s*[a-zA-Z0-9_\-]+[^>]*>/gi, ' ');

  // 3. Remove standard complete HTML/XML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // 4. Remove clipped tag fragments without opening `<` (e.g. `span data-type="title" id="toc-524" >`)
  text = text.replace(/\b(?:span|div|p|br|hr)\b[^>]*>/gi, ' ');

  // 5. Remove standalone attribute fragments (e.g. `data-level="3 >`, `data-type="title"`)
  text = text.replace(/\b(?:data-[a-zA-Z0-9_\-]+|id|class|style|level)\s*=\s*["'][^"']*["']\s*>?/gi, ' ');
  text = text.replace(/\b(?:data-[a-zA-Z0-9_\-]+|id|class|style|level)\s*=\s*[^>\s]+\s*>?/gi, ' ');

  // 6. Any remaining `<` or `>` is broken markup residue, strip it
  text = text.replace(/[<>]/g, ' ');

  // 7. Remove any dangling HTML tag names or attributes left as standalone English words
  text = text.replace(/\b(?:span|div|toc|data-type|data-level|data-id)\b/gi, ' ');

  // 8. Decode HTML entities
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#\d+;/g, (match) => {
      const code = parseInt(match.slice(2, -1), 10);
      return !isNaN(code) ? String.fromCharCode(code) : '';
    });

  // 9. Clean up multiple spaces and stray dots/punctuation
  text = text
    .replace(/\s{2,}/g, ' ')
    .replace(/^\s*[.,;:]\s*/, '')
    .trim();

  return text;
}

const renderSearchSnippet = (rawText: string, isDark: boolean, accentColor: string = 'amber') => {
  if (!rawText) return null;

  // Clean all HTML codes, broken tags and entities while preserving highlights
  const cleaned = cleanTurathSnippet(rawText, true);

  if (!cleaned.includes('___EM_START___')) {
    return cleaned;
  }

  const parts = cleaned.split(/(___EM_START___.*?___EM_END___)/g);
  return parts.map((part, i) => {
    if (part.startsWith('___EM_START___') && part.endsWith('___EM_END___')) {
      const keyword = part.slice(14, -12);
      return (
        <span
          key={i}
          className="text-[#dc2626] dark:text-rose-400 font-bold not-italic"
        >
          {keyword}
        </span>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
};

function buildArabicRegex(query: string): RegExp | null {
  const clean = query.trim();
  if (!clean) return null;

  const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tashkeel = '[\\u064B-\\u065F\\u0670\\u06D6-\\u06ED]*';

  let pattern = '';
  for (let i = 0; i < escaped.length; i++) {
    const ch = escaped[i];
    if (/[\u064B-\u065F\u0670\u06D6-\u06ED]/.test(ch)) continue;

    if (/[اأإآٱ]/.test(ch)) {
      pattern += `[اأإآٱ]${tashkeel}`;
    } else if (/[يى]/.test(ch)) {
      pattern += `[ييى]${tashkeel}`;
    } else if (/[هة]/.test(ch)) {
      pattern += `[هة]${tashkeel}`;
    } else if (/[وؤ]/.test(ch)) {
      pattern += `[وؤ]${tashkeel}`;
    } else if (/\s+/.test(ch)) {
      pattern += `\\s+`;
    } else {
      pattern += `${ch}${tashkeel}`;
    }
  }

  try {
    return new RegExp(pattern, 'gi');
  } catch {
    return null;
  }
}

function buildArabicRegexFromTerms(terms: string[]): RegExp | null {
  const validTerms = terms.map(t => t.trim()).filter(Boolean);
  if (validTerms.length === 0) return null;

  const patterns = validTerms.map(term => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const tashkeel = '[\\u064B-\\u065F\\u0670\\u06D6-\\u06ED]*';
    let pattern = '';
    for (let i = 0; i < escaped.length; i++) {
      const ch = escaped[i];
      if (/[\u064B-\u065F\u0670\u06D6-\u06ED]/.test(ch)) continue;
      if (/[اأإآٱ]/.test(ch)) {
        pattern += `[اأإآٱ]${tashkeel}`;
      } else if (/[يى]/.test(ch)) {
        pattern += `[يى]${tashkeel}`;
      } else if (/[هة]/.test(ch)) {
        pattern += `[هة]${tashkeel}`;
      } else if (/[وؤ]/.test(ch)) {
        pattern += `[وؤ]${tashkeel}`;
      } else if (/\s+/.test(ch)) {
        pattern += `\\s+`;
      } else {
        pattern += `${ch}${tashkeel}`;
      }
    }
    return pattern;
  }).filter(Boolean);

  if (patterns.length === 0) return null;
  try {
    return new RegExp(`(?:${patterns.join('|')})`, 'gi');
  } catch {
    return null;
  }
}

function removeHighlightFromDOM(container: HTMLElement, highlightId: string) {
  const marks = container.querySelectorAll(`mark[data-highlight-id="${highlightId}"]`);
  marks.forEach(mark => {
    const parent = mark.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
      parent.normalize();
    }
  });
}

function applyUserHighlightToElement(container: HTMLElement, highlight: BookHighlight) {
  if (!container || !highlight.text) return;
  const target = highlight.text.trim();
  if (target.length === 0) return;

  // Determine the target scope (specific page element if highlight.page is provided)
  const targetScope = highlight.page
    ? (container.querySelector(`[data-page="${highlight.page}"]`) as HTMLElement) || container
    : container;

  if (targetScope.querySelector(`mark[data-highlight-id="${highlight.id}"]`)) return;

  const walker = document.createTreeWalker(targetScope, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName.toLowerCase();
      if (['script', 'style', 'button', 'input', 'textarea'].includes(tag)) {
        return NodeFilter.FILTER_REJECT;
      }
      if (parent.closest(`mark[data-highlight-id="${highlight.id}"]`)) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  interface NodeMap {
    node: Text;
    start: number;
    end: number;
  }

  const nodes: NodeMap[] = [];
  let concatenated = '';

  let currNode: Text | null;
  while ((currNode = walker.nextNode() as Text | null)) {
    const val = currNode.nodeValue || '';
    if (val.length === 0) continue;
    const start = concatenated.length;
    concatenated += val;
    nodes.push({
      node: currNode,
      start,
      end: start + val.length
    });
  }

  if (nodes.length === 0) return;

  // 1. Direct exact match attempt
  let origMatchStart = -1;
  let origMatchEnd = -1;

  const directIdx = concatenated.indexOf(target);
  if (directIdx !== -1) {
    origMatchStart = directIdx;
    origMatchEnd = directIdx + target.length;
  } else {
    // 2. Arabic flexible regex match (handles tashkeel, hamzat, spacing variations)
    const regex = buildArabicRegex(target);
    if (regex) {
      const match = regex.exec(concatenated);
      if (match) {
        origMatchStart = match.index;
        origMatchEnd = match.index + match[0].length;
      }
    }

    // 3. Fallback: match prefix if long selection
    if (origMatchStart === -1 && target.length > 25) {
      const prefixRegex = buildArabicRegex(target.slice(0, 25));
      if (prefixRegex) {
        const match = prefixRegex.exec(concatenated);
        if (match) {
          origMatchStart = match.index;
          origMatchEnd = Math.min(concatenated.length, match.index + target.length);
        }
      }
    }
  }

  if (origMatchStart === -1 || origMatchEnd <= origMatchStart) return;

  for (let i = nodes.length - 1; i >= 0; i--) {
    const item = nodes[i];
    const segStart = Math.max(item.start, origMatchStart);
    const segEnd = Math.min(item.end, origMatchEnd);

    if (segStart < segEnd) {
      const localStart = segStart - item.start;
      const localEnd = segEnd - item.start;

      const nodeText = item.node.nodeValue || '';
      const beforeText = nodeText.slice(0, localStart);
      const highlightText = nodeText.slice(localStart, localEnd);
      const afterText = nodeText.slice(localEnd);

      const frag = document.createDocumentFragment();
      if (beforeText) {
        frag.appendChild(document.createTextNode(beforeText));
      }

      const mark = document.createElement('mark');
      mark.setAttribute('data-user-highlight', 'true');
      mark.setAttribute('data-highlight-id', highlight.id);
      mark.setAttribute('data-highlight-color', highlight.color);
      mark.setAttribute('title', 'انقر مرتين لإزالة التظليل');
      mark.style.cssText = `background-color: ${highlight.color} !important; color: #0e0e0e !important; border-radius: 4px; padding: 1px 3px; cursor: pointer; display: inline; text-decoration: none; -webkit-text-fill-color: #0e0e0e !important;`;
      mark.textContent = highlightText;
      frag.appendChild(mark);

      if (afterText) {
        frag.appendChild(document.createTextNode(afterText));
      }

      item.node.parentNode?.replaceChild(frag, item.node);
    }
  }
}

function clearPageHighlights(container: HTMLElement) {
  const marks = container.querySelectorAll('mark.page-search-match');
  marks.forEach(mark => {
    const parent = mark.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
      parent.normalize();
    }
  });
}

function applyPageHighlights(container: HTMLElement, regex: RegExp): HTMLElement[] {
  clearPageHighlights(container);
  const matchedElements: HTMLElement[] = [];

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName.toLowerCase();
      if (['script', 'style', 'input', 'textarea', 'button', 'mark'].includes(tag)) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const textNodes: Text[] = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text);
  }

  for (const textNode of textNodes) {
    const text = textNode.nodeValue;
    if (!text) continue;

    regex.lastIndex = 0;
    const matches: { start: number; end: number; text: string }[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match[0].length === 0) {
        regex.lastIndex++;
        continue;
      }
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0]
      });
    }

    if (matches.length === 0) continue;

    const frag = document.createDocumentFragment();
    let lastIndex = 0;

    matches.forEach(m => {
      if (m.start > lastIndex) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex, m.start)));
      }
      const mark = document.createElement('mark');
      mark.className = 'page-search-match';
      mark.textContent = m.text;
      frag.appendChild(mark);
      matchedElements.push(mark);
      lastIndex = m.end;
    });

    if (lastIndex < text.length) {
      frag.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    textNode.parentNode?.replaceChild(frag, textNode);
  }

  return matchedElements;
}

function clearBookSearchHighlights(container: HTMLElement) {
  const marks = container.querySelectorAll('mark.book-search-match');
  marks.forEach(mark => {
    const parent = mark.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
      parent.normalize();
    }
  });
}

function applyBookSearchHighlights(container: HTMLElement, regex: RegExp, forceClear: boolean = false): HTMLElement[] {
  const existingMarks = container.querySelectorAll('mark.book-search-match');
  if (!forceClear && existingMarks.length > 0) {
    return Array.from(existingMarks) as HTMLElement[];
  }
  clearBookSearchHighlights(container);
  const matchedElements: HTMLElement[] = [];

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName.toLowerCase();
      if (['script', 'style', 'input', 'textarea', 'button', 'mark'].includes(tag)) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const textNodes: Text[] = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text);
  }

  for (const textNode of textNodes) {
    const text = textNode.nodeValue;
    if (!text) continue;

    regex.lastIndex = 0;
    const matches: { start: number; end: number; text: string }[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match[0].length === 0) {
        regex.lastIndex++;
        continue;
      }
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0]
      });
    }

    if (matches.length === 0) continue;

    const frag = document.createDocumentFragment();
    let lastIndex = 0;

    matches.forEach(m => {
      if (m.start > lastIndex) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex, m.start)));
      }
      const mark = document.createElement('mark');
      mark.className = 'book-search-match';
      mark.textContent = m.text;
      frag.appendChild(mark);
      matchedElements.push(mark);
      lastIndex = m.end;
    });

    if (lastIndex < text.length) {
      frag.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    textNode.parentNode?.replaceChild(frag, textNode);
  }

  return matchedElements;
}



const VolumeCard = ({
  volumeNode,
  isActive,
  onSelect,
  readerTheme = 'light',
  accentColor = 'amber',
  index = 0
}: {
  volumeNode: TreeNode;
  isActive: boolean;
  onSelect: (vol: string) => void;
  readerTheme?: 'light' | 'dark' | 'sepia';
  accentColor?: string;
  index?: number;
}) => {
  const getContainerStyle = () => {
    if (isActive) {
      if (readerTheme === 'dark') {
        switch (accentColor) {
          case 'amber':
            return 'bg-amber-500/15 text-amber-200';
          case 'emerald':
            return 'bg-teal-500/15 text-teal-200';
          case 'blue':
            return 'bg-blue-500/15 text-blue-200';
          case 'purple':
          default:
            return 'bg-brand-magenta/15 text-purple-200';
        }
      }
      if (readerTheme === 'sepia') {
        return 'bg-[#eedbb2]/60 text-[#4a3319]';
      }
      switch (accentColor) {
        case 'amber':
          return 'bg-[#dfbf83]/30 text-stone-950';
        case 'emerald':
          return 'bg-teal-500/15 text-teal-950';
        case 'blue':
          return 'bg-blue-500/15 text-blue-950';
        case 'purple':
        default:
          return 'bg-brand-magenta/15 text-purple-950';
      }
    }
    if (readerTheme === 'dark') {
      return 'hover:bg-white/[0.06] text-slate-200 hover:text-white';
    }
    if (readerTheme === 'sepia') {
      return 'hover:bg-[#ede3ce]/80 text-[#543b20]';
    }
    return 'hover:bg-black/[0.04] text-slate-800 hover:text-slate-950';
  };

  const getIconColor = () => {
    if (isActive) {
      switch (accentColor) {
        case 'amber': return 'text-[#b88d46]';
        case 'emerald': return 'text-teal-600 dark:text-teal-400';
        case 'blue': return 'text-blue-600 dark:text-blue-400';
        case 'purple':
        default: return 'text-brand-magenta';
      }
    }
    return 'text-muted-foreground/60 group-hover/vol:text-foreground';
  };

  return (
    <div
      onClick={() => onSelect(volumeNode.volName || '1')}
      style={{ animationDelay: `${Math.min(index, 20) * 30}ms` }}
      className={`w-full flex items-center justify-between py-2.5 px-3 rounded-xl transition-all duration-150 cursor-pointer select-none group/vol animate-toc-entrance ${getContainerStyle()}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`p-1 rounded-lg transition-transform duration-200 group-hover/vol:scale-110 shrink-0 ${getIconColor()}`}>
          <BookOpen className="h-4.5 w-4.5" strokeWidth={2.2} />
        </div>
        <span className={`text-[14.5px] truncate leading-relaxed ${isActive ? 'font-bold' : 'font-medium'}`}>
          {volumeNode.title}
        </span>
      </div>

      <div className="flex items-center gap-2 mr-2 shrink-0">
        <span className="text-[12px] opacity-65 font-medium">
          {volumeNode.totalChapters !== undefined && volumeNode.totalChapters > 0
            ? `${toEasternArabicNumerals(volumeNode.totalChapters)} باب • `
            : ''}
          صـ {toEasternArabicNumerals(volumeNode.page)}
        </span>
        <ChevronLeft className="h-4 w-4 text-muted-foreground/40 group-hover/vol:text-foreground group-hover/vol:-translate-x-0.5 transition-all" strokeWidth={2.2} />
      </div>
    </div>
  );
};

const TocNode = ({
  node,
  expandedNodes,
  toggleExpand,
  currentPage,
  handlePageJump,
  activeHeadingText,
  activeTocIndex,
  activeAncestorIndices,
  selectedTocIndex,
  readerTheme = 'light',
  index = 0
}: {
  node: TreeNode,
  expandedNodes: Set<number>,
  toggleExpand: (idx: number) => void,
  currentPage: number,
  handlePageJump: (page: number, title?: string, index?: number) => void,
  activeHeadingText: string | null,
  activeTocIndex: number,
  activeAncestorIndices?: Set<number>,
  selectedTocIndex?: number | null,
  readerTheme?: 'light' | 'dark' | 'sepia',
  index?: number
}) => {
  const { accentColor } = useTheme();
  const isExpanded = expandedNodes.has(node.originalIndex);
  // Highlighting Logic: Exact match with selectedTocIndex or activeTocIndex
  const isExactActive = (selectedTocIndex !== null && selectedTocIndex !== undefined && node.originalIndex === selectedTocIndex && node.page === currentPage) ||
    (activeTocIndex >= 0 && node.originalIndex === activeTocIndex);

  const isAncestorActive = activeAncestorIndices ? activeAncestorIndices.has(node.originalIndex) && !isExactActive : false;

  const hasChildren = node.children.length > 0;

  const getTreeLineBorderClass = () => {
    if (isAncestorActive || isExactActive) {
      switch (accentColor) {
        case 'amber': return 'border-[#b88d46]';
        case 'emerald': return 'border-teal-500';
        case 'blue': return 'border-blue-500';
        case 'purple':
        default: return 'border-purple-500';
      }
    }
    return 'border-border/30';
  };

  const getContainerStyles = () => {
    if (isExactActive) {
      if (readerTheme === 'dark') {
        switch (accentColor) {
          case 'amber':
            return 'bg-[#dfbf83] text-stone-950 font-bold border-[#cba35d] shadow-md shadow-amber-950/50 ring-1 ring-[#dfbf83]/50';
          case 'emerald':
            return 'bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-500 text-white font-extrabold border-teal-400/60 shadow-md shadow-teal-950/50 ring-1 ring-teal-400/40';
          case 'blue':
            return 'bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 text-white font-extrabold border-blue-400/60 shadow-md shadow-blue-950/50 ring-1 ring-blue-400/40';
          case 'purple':
          default:
            return 'bg-gradient-to-r from-purple-600 via-brand-magenta to-purple-700 text-white font-extrabold border-purple-400/60 shadow-md shadow-purple-950/50 ring-1 ring-purple-400/40';
        }
      } else {
        switch (accentColor) {
          case 'amber':
            return 'bg-[#dfbf83] text-stone-950 font-bold border-[#cba35d] shadow-md shadow-amber-600/20 ring-1 ring-[#cba35d]/40';
          case 'emerald':
            return 'bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-500 text-white font-extrabold border-teal-700 shadow-md shadow-teal-600/30 ring-1 ring-teal-600/40';
          case 'blue':
            return 'bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 text-white font-extrabold border-blue-700 shadow-md shadow-blue-600/30 ring-1 ring-blue-600/40';
          case 'purple':
          default:
            return 'bg-gradient-to-r from-purple-700 via-purple-600 to-brand-magenta text-white font-extrabold border-purple-700 shadow-md shadow-purple-600/30 ring-1 ring-purple-600/40';
        }
      }
    }
    if (isAncestorActive) {
      if (readerTheme === 'dark') {
        switch (accentColor) {
          case 'amber': return 'bg-amber-950/35 text-amber-200/90 font-semibold border-amber-600/30 shadow-none';
          case 'emerald': return 'bg-teal-950/35 text-teal-200/90 font-semibold border-teal-600/30 shadow-none';
          case 'blue': return 'bg-blue-950/35 text-blue-200/90 font-semibold border-blue-600/30 shadow-none';
          case 'purple':
          default: return 'bg-purple-950/35 text-purple-200/90 font-semibold border-purple-600/30 shadow-none';
        }
      } else {
        switch (accentColor) {
          case 'amber': return 'bg-[#dfbf83]/15 text-[#78531b] font-bold border border-[#dfbf83]/40 shadow-none';
          case 'emerald': return 'bg-teal-500/10 text-teal-800 font-bold border border-teal-500/30 shadow-none';
          case 'blue': return 'bg-blue-500/10 text-blue-800 font-bold border border-blue-500/30 shadow-none';
          case 'purple':
          default: return 'bg-purple-500/10 text-purple-900 font-bold border border-purple-500/30 shadow-none';
        }
      }
    }
    if (readerTheme === 'dark') {
      return 'text-slate-200 hover:text-white hover:bg-white/10 border-transparent hover:border-white/20';
    } else {
      switch (accentColor) {
        case 'amber': return 'text-slate-800 hover:bg-amber-50 hover:text-amber-950 border-transparent hover:border-amber-200/50';
        case 'emerald': return 'text-slate-800 hover:bg-teal-50 hover:text-teal-950 border-transparent hover:border-teal-200/50';
        case 'blue': return 'text-slate-800 hover:bg-blue-50 hover:text-blue-950 border-transparent hover:border-blue-200/50';
        case 'purple':
        default: return 'text-slate-800 hover:bg-purple-50 hover:text-purple-950 border-transparent hover:border-purple-200/50';
      }
    }
  };

  const getIconStyles = () => {
    if (isExactActive) return accentColor === 'amber' ? 'text-stone-950' : 'text-white';
    if (isAncestorActive) {
      if (readerTheme === 'dark') {
        switch (accentColor) {
          case 'amber': return 'text-amber-300';
          case 'emerald': return 'text-teal-300';
          case 'blue': return 'text-blue-300';
          case 'purple':
          default: return 'text-purple-300';
        }
      }
      switch (accentColor) {
        case 'amber': return 'text-amber-700';
        case 'emerald': return 'text-teal-700';
        case 'blue': return 'text-blue-700';
        case 'purple':
        default: return 'text-purple-700';
      }
    }
    switch (accentColor) {
      case 'amber': return 'text-[#b88d46]/80';
      case 'emerald': return 'text-teal-600/80';
      case 'blue': return 'text-blue-600/80';
      case 'purple':
      default: return 'text-brand-magenta/70';
    }
  };

  const getBadgeStyles = () => {
    if (isExactActive) {
      return accentColor === 'amber'
        ? 'bg-black/10 text-stone-950 font-bold border border-black/5'
        : 'bg-white/20 text-white font-bold backdrop-blur-xs';
    }
    if (isAncestorActive) {
      if (readerTheme === 'dark') {
        switch (accentColor) {
          case 'amber': return 'bg-amber-900/80 text-amber-200 font-bold';
          case 'emerald': return 'bg-teal-900/80 text-teal-200 font-bold';
          case 'blue': return 'bg-blue-900/80 text-blue-200 font-bold';
          case 'purple':
          default: return 'bg-purple-900/80 text-purple-200 font-bold';
        }
      }
      switch (accentColor) {
        case 'amber': return 'bg-amber-200 text-amber-900 font-bold';
        case 'emerald': return 'bg-teal-200 text-teal-900 font-bold';
        case 'blue': return 'bg-blue-200 text-blue-900 font-bold';
        case 'purple':
        default: return 'bg-purple-200 text-purple-900 font-bold';
      }
    }
    return readerTheme === 'dark'
      ? 'bg-white/10 text-white/70'
      : 'bg-slate-200/80 text-slate-700';
  };

  const getHoverPreviewCardStyle = () => {
    if (readerTheme === 'dark') {
      switch (accentColor) {
        case 'amber': return 'bg-[#10131a]/95 border-[#dfbf83]/40 text-amber-100 shadow-black/80';
        case 'emerald': return 'bg-[#081514]/95 border-teal-500/40 text-teal-100 shadow-teal-950/80';
        case 'blue': return 'bg-[#091322]/95 border-blue-500/40 text-blue-100 shadow-blue-950/80';
        case 'purple':
        default: return 'bg-[#0d071a]/95 border-purple-500/50 text-purple-100 shadow-purple-950/80';
      }
    }
    if (readerTheme === 'sepia') {
      return 'bg-[#F4ECD8]/95 border-[#D4C4A8] text-[#5c3f22] shadow-amber-950/30';
    }
    switch (accentColor) {
      case 'amber': return 'bg-white/95 border-amber-300 text-amber-950 shadow-xl';
      case 'emerald': return 'bg-white/95 border-teal-300 text-teal-950 shadow-xl';
      case 'blue': return 'bg-white/95 border-blue-300 text-blue-950 shadow-xl';
      case 'purple':
      default: return 'bg-white/95 border-purple-300 text-purple-950 shadow-xl';
    }
  };

  return (
    <div
      className="flex flex-col animate-toc-entrance"
      style={{ animationDelay: `${Math.min(index, 25) * 35}ms` }}
    >
      <div
        data-toc-active={isExactActive ? "true" : undefined}
        className={`w-full flex items-center justify-between py-2.5 px-3 text-sm rounded-xl transition-all duration-300 group cursor-pointer border ${getContainerStyles()}`}
        onClick={() => handlePageJump(node.page, node.title, node.originalIndex)}
      >
        <div className="flex items-center gap-2 flex-1 overflow-hidden min-w-0">
          {hasChildren ? (
            <Folder className={`h-4 w-4 shrink-0 ${getIconStyles()}`} strokeWidth={2} />
          ) : (
            <FileText className={`h-4 w-4 shrink-0 ${getIconStyles()}`} strokeWidth={2} />
          )}

          <div className="relative group/title flex-1 min-w-0">
            <span className="truncate text-right block leading-relaxed text-[13.5px]">
              {node.title}
            </span>

            {/* Hover Enlarged Title Preview Card */}
            <div className="absolute right-0 top-full mt-1.5 hidden group-hover/title:block z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-200 delay-500">
              <div className={`max-w-md px-3.5 py-2.5 rounded-xl border text-sm font-bold shadow-2xl backdrop-blur-xl ${getHoverPreviewCardStyle()}`}>
                {node.title}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mr-2 shrink-0">
          {hasChildren && (
            <button
              onClick={(e) => { e.stopPropagation(); toggleExpand(node.originalIndex); }}
              className={`p-1 rounded-md transition-all opacity-80 hover:opacity-100 hover:scale-110 ${isExpanded ? 'rotate-0' : 'rotate-90'} ${isExactActive ? (accentColor === 'amber' ? 'bg-black/10 text-stone-950 hover:bg-black/15' : 'bg-white/20 text-white') : isAncestorActive ? 'bg-black/10 dark:bg-white/15 text-foreground' : 'hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400'}`}
            >
              <ChevronDown className="h-3.5 w-3.5 transition-transform duration-300" strokeWidth={2.2} />
            </button>
          )}
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors ${getBadgeStyles()}`}>
            صـ {toEasternArabicNumerals(node.page)}
          </span>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-1 transition-all duration-200">
          <div className={`overflow-hidden pr-2.5 border-r-2 mr-1 space-y-1 transition-colors ${getTreeLineBorderClass()}`}>
            {node.children.map((child, childIdx) => (
              <TocNode
                key={child.originalIndex}
                node={child}
                index={childIdx}
                expandedNodes={expandedNodes}
                toggleExpand={toggleExpand}
                currentPage={currentPage}
                handlePageJump={handlePageJump}
                activeHeadingText={activeHeadingText}
                activeTocIndex={activeTocIndex}
                activeAncestorIndices={activeAncestorIndices}
                selectedTocIndex={selectedTocIndex}
                readerTheme={readerTheme}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
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
  '\ufdfc': 'عز وجل',
  '\ufdfe': 'سبحانه وتعالى',
  '\ufdff': 'عز وجل',
};

const honorificPhrases = [
  'صلى الله عليه وآله وسلم',
  'صلى الله عليه وسلم',
  'صلى الله عليه وآله',
  'صلّى الله عليه وسلّم',
  'صلّى الله عليه وسلم',
  'رضي الله عنهما',
  'رضي الله عنهن',
  'رضي الله عنهم',
  'رضي الله عنها',
  'رضي الله عنه',
  'رضى الله عنهما',
  'رضى الله عنهن',
  'رضى الله عنهم',
  'رضى الله عنها',
  'رضى الله عنه',
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
  'قدس سره',
  'سبحانه وتعالى',
  'تبارك وتعالى',
  'عز وجل',
  'عزّ وجلّ',
  'جل جلاله',
  'جلّ جلاله'
];

export const replaceIslamicLigatures = (text: string): string => {
  if (!text) return text;
  let newText = text;
  const honorificTokens: string[] = [];

  const createBadge = (content: string) => {
    return `<span data-type="honorific" class="islamic-honorific">- ${content} -</span>`;
  };

  // 1. Unicode characters (absorbing surrounding parentheses, spaces, and dashes)
  for (const [key, value] of Object.entries(unicodeHonorificsMap)) {
    const pattern = new RegExp(`[\\s\\(]*[-–—]?\\s*${key}\\s*[-–—]?[\\s\\)]*`, 'g');
    newText = newText.replace(pattern, () => {
      honorificTokens.push(createBadge(value));
      return ` __TURATH_HON_${honorificTokens.length - 1}__ `;
    });
  }

  // 2. Common phrases (sorted by length descending, absorbing surrounding parentheses, spaces, and dashes)
  honorificPhrases.forEach(phrase => {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(?<!<[^>]*)[\\s\\(]*[-–—]?\\s*${escaped}\\s*[-–—]?[\\s\\)]*(?![^<]*>)`, 'g');
    newText = newText.replace(pattern, (match) => {
      if (match.includes('__TURATH_HON_')) return match;
      honorificTokens.push(createBadge(phrase));
      return ` __TURATH_HON_${honorificTokens.length - 1}__ `;
    });
  });

  // 3. Standalone ﷺ (if not already styled)
  newText = newText.replace(
    /(?<![-–—]\s*)ﷺ(?!\s*[-–—])/g,
    () => {
      honorificTokens.push(createBadge('ﷺ'));
      return ` __TURATH_HON_${honorificTokens.length - 1}__ `;
    }
  );

  // Restore honorific tokens
  honorificTokens.forEach((tokenHtml, i) => {
    newText = newText.replace(`__TURATH_HON_${i}__`, tokenHtml);
  });

  return newText.replace(/ {2,}/g, ' ');
};

function makeTashkeelPattern(word: string): string {
  const tashkeel = '[\\u064B-\\u065F\\u0670\\u06D6-\\u06ED]*';
  let pattern = '';
  for (const ch of word) {
    if (ch === 'ا' || ch === 'أ' || ch === 'إ' || ch === 'آ') {
      pattern += '[اأإآ]' + tashkeel;
    } else if (ch === 'ي' || ch === 'ى') {
      pattern += '[ييى]' + tashkeel;
    } else {
      pattern += ch + tashkeel;
    }
  }
  return pattern;
}

const NARRATOR_WORDS = [
  'وكقوله', 'كقوله', 'فكقوله',
  'ولقوله', 'لقوله', 'فلقوله',
  'وبقوله', 'بقوله',
  'وقوله', 'قوله', 'فقوله',
  'وقولهم', 'قولهم', 'فقولهم',
  'وقال', 'قال', 'فقال',
  'وقالت', 'قالت', 'فقالت',
  'وقالوا', 'قالوا', 'فقالوا',
  'ويقول', 'يقول', 'فيقول',
  'وتقول', 'تقول', 'فتقول',
  'ويقولون', 'يقولون', 'فيقولون',
  'وقلت', 'قلت', 'فقلت',
  'وقلنا', 'قلنا', 'فقلنا',
  'وقيل', 'قيل', 'فقيل',
  'ويقال', 'يقال', 'فيقال',
  'وحدثنا', 'حدثنا', 'فحدثنا',
  'وحدثني', 'حدثني', 'فحدثني',
  'وأخبرنا', 'أخبرنا', 'فأخبرنا',
  'وأخبرني', 'أخبرني', 'فأخبرني',
  'وأنبأنا', 'أنبأنا', 'فأنبأنا',
  'وأنبأني', 'أنبأني',
  'وسمعت', 'سمعت',
  'وروى', 'روى',
  'وروي', 'روي',
  'وروينا', 'روينا'
];

const SPEECH_PATTERNS_STR = NARRATOR_WORDS.map(w => makeTashkeelPattern(w)).join('|');
const SPEECH_REGEX = new RegExp(`(?<!<[^>]*)(?<![\\p{L}\\p{M}])(${SPEECH_PATTERNS_STR})((?:[:：]|[-–—]|،)*(?=[\\s،:：-]|$))(?![^<]*>)`, 'gu');

export function parseIslamicTypography(text: string): string {
  if (!text) return '';

  // 1. Protect titles
  const titles: string[] = [];
  let parsed = text.replace(/<span\s+data-type="title"[^>]*>[\s\S]*?<\/span>/gi, (match) => {
    const idx = titles.length;
    titles.push(match);
    return `__TITLE_TOKEN_${idx}__`;
  });

  // 2. Protect existing HTML footnote badges
  const footnoteTokens: string[] = [];
  parsed = parsed.replace(/<span\s+class="[^"]*islamic-footnote-sup[^"]*"[^>]*>[\s\S]*?<\/span>/gi, (match) => {
    const idx = footnoteTokens.length;
    footnoteTokens.push(match);
    return `__FN_TOKEN_${idx}__`;
  });

  // 3. Protect honorific spans
  const honorificTokens: string[] = [];
  parsed = parsed.replace(/<span\s+data-type="honorific"[^>]*>[\s\S]*?<\/span>/gi, (match) => {
    const idx = honorificTokens.length;
    honorificTokens.push(match);
    return `__HONOR_TOKEN_${idx}__`;
  });

  // 4. Protect existing poetry spans
  const existingPoetryTokens: string[] = [];
  parsed = parsed.replace(/<(?:span|div)\s+data-type="poetry"[^>]*>[\s\S]*?<\/(?:span|div)>/gi, (match) => {
    const idx = existingPoetryTokens.length;
    existingPoetryTokens.push(match);
    return `__EXISTING_POETRY_${idx}__`;
  });

  // 5. Parse Poetry lines (صدر وعجز مفصولان بنقاط ... أو … أو شرطات أو نجوم أو ···)
  // Group consecutive verses into a single unified block to keep stanzas together without huge gaps
  const poetryTokens: string[] = [];
  const lines = parsed.split(/\r?\n/);
  const newLines: string[] = [];
  let currentPoetryGroup: string[] = [];

  const singleVerseRegex = /^\s*([^\r\n<>]{4,100}?)\s*(?:(\.{2,}|…|[-–—]{2,}|(?:\*\s*){2,}|\u00b7{2,}))\s*([^\r\n<>]{4,100}?)\s*$/u;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const match = trimmed.match(singleVerseRegex);
    if (match) {
      const sadr = match[1].trim();
      const ajuz = match[3].trim();
      currentPoetryGroup.push(`<div class="islamic-poetry-verse"><span class="poetry-sadr">${sadr}</span><span class="poetry-sep">···</span><span class="poetry-ajuz">${ajuz}</span></div>`);
    } else if (trimmed === '' && currentPoetryGroup.length > 0) {
      // Check if another poetry verse exists ahead across empty lines
      let nextVerseIdx = i + 1;
      while (nextVerseIdx < lines.length && lines[nextVerseIdx].trim() === '') {
        nextVerseIdx++;
      }
      if (nextVerseIdx < lines.length && lines[nextVerseIdx].trim().match(singleVerseRegex)) {
        // Skip empty line(s) between consecutive poetry verses so the poem stays coherent
        continue;
      } else {
        // End of poem stanza
        poetryTokens.push(`<div data-type="poetry" class="islamic-poetry-block">${currentPoetryGroup.join('')}</div>`);
        newLines.push(`__POETRY_TOKEN_${poetryTokens.length - 1}__`);
        currentPoetryGroup = [];
        newLines.push(line);
      }
    } else {
      if (currentPoetryGroup.length > 0) {
        poetryTokens.push(`<div data-type="poetry" class="islamic-poetry-block">${currentPoetryGroup.join('')}</div>`);
        newLines.push(`__POETRY_TOKEN_${poetryTokens.length - 1}__`);
        currentPoetryGroup = [];
      }
      newLines.push(line);
    }
  }

  if (currentPoetryGroup.length > 0) {
    poetryTokens.push(`<div data-type="poetry" class="islamic-poetry-block">${currentPoetryGroup.join('')}</div>`);
    newLines.push(`__POETRY_TOKEN_${poetryTokens.length - 1}__`);
  }

  parsed = newLines.join('\n');

  // 5.5. Paragraph Lead / Mas'alah Headings (رؤوس المسائل والفصول مثل: (٥١٣) فَصْلٌ: أو (٥١٤) مَسْأَلَةٌ: أو فَصْلٌ:)
  const sectionLeadTokens: string[] = [];
  const leadKeywords = 'فصل|فَصْلٌ?|مسألة|مَسْأَلَةٌ?|فرع|فَرْعٌ?|تنبيه|تَنْبِيهٌ?|فائدة|فَائِدَةٌ?|تتمة|تَتِمَّةٌ?|أصل|أَصْلٌ?|قاعدة|قَاعِدَةٌ?|ضابط|ضَابِطٌ?|مسائل|مَسَائِلُ?|فروع|فُرُوعٌ?|خاتمة|خَاتِمَةٌ?';
  const sectionLeadRegex = new RegExp(
    `(^|\\r?\\n)([ \\t]*)((?:[\\(\\[]\\s*[\\d\\u0660-\\u0669]+\\s*[\\)\\]]\\s*[^\\r\\n<>:：]{0,45}[:：])|(?:(?:${leadKeywords})(?:\\s+[^\\r\\n<>:：]{1,35})?[:：]))`,
    'gu'
  );
  parsed = parsed.replace(sectionLeadRegex, (_match, nl, indent, leadText) => {
    const idx = sectionLeadTokens.length;
    sectionLeadTokens.push(`<span data-type="section-lead" class="islamic-section-lead font-bold">${leadText.trim()}</span>`);
    return `${nl}${indent}__SECTION_LEAD_${idx}__`;
  });

  // 6. Extract and wrap Quran verses in green styling (including ornate brackets ﴿ ﴾ or { })
  const quranTokens: string[] = [];
  const quranRegex = /([﴿﴾][^﴿﴾\r\n]+[﴿﴾]|\{[\u0600-\u06FF\s،.:!؟-]{3,}\})/gu;
  parsed = parsed.replace(quranRegex, (match) => {
    const idx = quranTokens.length;
    // Format ayah numbers inside Quran verses and prevent any footnote badges from ever existing inside Quran text
    const formattedInner = match.replace(
      /(?:<span\s+class="[^"]*islamic-footnote-sup[^"]*"[^>]*>[\s\S]*?<a[^>]*>([\d\u0660-\u0669]+)<\/a>[\s\S]*?<\/span>|(?:\(([١٢٣٤٥٦٧٨٩٠\d]+)\)|\[([١٢٣٤٥٦٧٨٩٠\d]+)\]|\{([١٢٣٤٥٦٧٨٩٠\d]+)\}|۝\s*([١٢٣٤٥٦٧٨٩٠\d]+))|(?<=[^\d\w\u0660-\u0669]|^)([١٢٣٤٥٦٧٨٩٠\d]{1,3})(?=[^\d\w\u0660-\u0669]|$))/gu,
      (_subMatch, p1, p2, p3, p4, p5, p6) => {
        const ayahNum = (p1 || p2 || p3 || p4 || p5 || p6 || '').trim();
        return `<span class="turath-ayah-num" style="display:inline; font-family:'Amiri', serif; font-variant-numeric:tabular-nums; font-weight:normal; margin:0 4px;">(${ayahNum})</span>`;
      }
    );
    quranTokens.push(`<span data-type="quran" class="islamic-quran-verse font-scheherazade">${formattedInner}</span>`);
    return `__QURAN_TOKEN_${idx}__`;
  });

  // 6.5. Quran Surah citations e.g. [الأنفال: ١١] or [النساء: ٤٣]
  parsed = parsed.replace(
    /\[\s*([\u0621-\u064A\u0671-\u06D3\s]+?)\s*[:،]\s*([١٢٣٤٥٦٧٨٩٠\d]+(?:\s*[-–—]\s*[١٢٣٤٥٦٧٨٩٠\d]+)?)\s*\]/gu,
    (_match, surah, ayah) => {
      const cleanSurah = surah.trim();
      const cleanAyah = ayah.trim();
      return `<span data-type="surah-ref" class="turath-surah-ref">[${cleanSurah}: ${cleanAyah}]</span>`;
    }
  );

  // 7. Quotes / Hadith text: «...»
  const quoteRegex = /(?<!<[^>]*)(«[^»\r\n]+»)(?![^<]*>)/gu;
  parsed = parsed.replace(quoteRegex, '<span data-type="hadith-quote" class="islamic-hadith-quote">$1</span>');

  // 8. Parentheses (...) and Brackets [...] (avoiding empty or single footnote numbers)
  const parenRegex = /(?<!<[^>]*)\(([^()<>\r\n]+)\)(?![^<]*>)/gu;
  parsed = parsed.replace(parenRegex, '<span data-type="parenthetical" class="islamic-parenthetical">($1)</span>');

  const bracketRegex = /(?<!<[^>]*)(?<!\[)\[([^\[\]<>\r\n]+)\](?![^<]*>)/gu;
  parsed = parsed.replace(bracketRegex, '<span data-type="bracketed-note" class="islamic-bracketed-note">[$1]</span>');

  // 9. Restore tokens in proper order
  parsed = parsed.replace(/__QURAN_TOKEN_(\d+)__/g, (_, idx) => quranTokens[Number(idx)] || '');
  parsed = parsed.replace(/__SECTION_LEAD_(\d+)__/g, (_, idx) => sectionLeadTokens[Number(idx)] || '');
  parsed = parsed.replace(/__POETRY_TOKEN_(\d+)__/g, (_, idx) => poetryTokens[Number(idx)] || '');
  parsed = parsed.replace(/__EXISTING_POETRY_(\d+)__/g, (_, idx) => existingPoetryTokens[Number(idx)] || '');
  parsed = parsed.replace(/__HONOR_TOKEN_(\d+)__/g, (_, idx) => honorificTokens[Number(idx)] || '');
  parsed = parsed.replace(/__FN_TOKEN_(\d+)__/g, (_, idx) => footnoteTokens[Number(idx)] || '');
  parsed = parsed.replace(/__TITLE_TOKEN_(\d+)__/g, (_, idx) => titles[Number(idx)] || '');

  return parsed;
}

/**
 * إزالة التشكيل وحركات الإعراب مع الحفاظ التام على وسوم HTML وعناصر الصفحة
 */
export function stripArabicDiacritics(html: string): string {
  if (!html) return '';
  return html.replace(/(<[^>]+>)|([\u064B-\u065F\u0670\u06D6-\u06ED])/gu, (match, tag) => {
    if (tag) return tag;
    return '';
  });
}

export interface ProcessedContent {
  main: string;
  matn: string;
  sharh?: string;
  footnote: string;
}

const processTextContent = (rawText: string): ProcessedContent => {
  if (!rawText) return { main: '', matn: '', footnote: '' };

  const cleanRaw = replaceIslamicLigatures(rawText);

  // Match <hr><s0>, <hr>, <s0>, or lines of 3+ underscores/hyphens separating main text, Sharh, and footnotes
  const footnoteSeparatorRegex = /(?:<hr\s*\/?>\s*(?:<s\d+>)?|<s\d+>|(?:\r?\n|^)\s*(?:_{3,}|[-–—]{3,})\s*(?:\r?\n|$))/gi;

  const rawParts = cleanRaw.split(footnoteSeparatorRegex).filter(p => p && p.trim());

  let matnPart = '';
  let sharhPart = '';
  let footnotePart = '';

  if (rawParts.length >= 3) {
    matnPart = rawParts[0];
    sharhPart = rawParts.slice(1, rawParts.length - 1).join('\n\n');
    footnotePart = rawParts[rawParts.length - 1];
  } else if (rawParts.length === 2) {
    matnPart = rawParts[0];
    footnotePart = rawParts[1];
  } else if (rawParts.length === 1) {
    matnPart = rawParts[0];
  }

  const formatMainText = (text: string) => {
    if (!text) return '';

    // Preserve natural paragraph break before titles, but eliminate trailing blank lines after titles
    // so titles never stick to the previous paragraph, and stay closely connected to their own text below
    let processedText = text
      .replace(/\n{3,}/g, '\n\n')
      .replace(/(<\/span>|<\/h[1-6]>)\s*[\r\n]+/gi, '$1\n');

    // Tag title elements with data-level="1" or data-level="2" dynamically & balance cut-off brackets
    processedText = processedText.replace(/<span\s+data-type="title"([^>]*)>([\s\S]*?)<\/span>/gi, (match, attrs, titleText) => {
      let balanced = titleText.trim();

      // Clean orphan trailing opening bracket (e.g. "[كِتَابُ الصَّلَاةِ] [")
      balanced = balanced.replace(/\s*[\[\(]\s*$/, '').trim();
      // Clean orphan leading closing bracket
      balanced = balanced.replace(/^\s*[\]\)]\s*/, '').trim();

      // If it ends with ']' but lacks '['
      if (balanced.endsWith(']') && !balanced.includes('[')) {
        balanced = `[${balanced}`;
      } else if (balanced.startsWith('[') && !balanced.includes(']')) {
        balanced = `${balanced}]`;
      }

      // Accurately detect level by stripping leading brackets/whitespace
      const cleanTitle = balanced.replace(/<[^>]+>/g, '').replace(/^[\s\[\(\-–—]+/, '').trim();
      const isLevel1 = /^(?:كتاب|كِتَابُ?|باب|بَابُ?)(?:\s+|$)/i.test(cleanTitle);

      let finalAttrs = attrs.trim();
      if (!/data-level=/i.test(finalAttrs)) {
        const levelAttr = isLevel1 ? 'data-level="1"' : 'data-level="2"';
        finalAttrs = finalAttrs ? `${levelAttr} ${finalAttrs}` : levelAttr;
      }

      return `<span data-type="title" ${finalAttrs}>${balanced}</span>`;
    });

    // Protect Quran verses so that numbers (ayah numbers) inside them are NOT converted into footnotes
    const quranPreserveTokens: string[] = [];
    const quranPreserveRegex = /([﴿﴾][^﴿﴾\r\n]+[﴿﴾]|\{[\u0600-\u06FF\s،.:!؟-]{3,}\})/gu;
    const safeProcessedText = processedText.replace(quranPreserveRegex, (match) => {
      const idx = quranPreserveTokens.length;
      quranPreserveTokens.push(match);
      return `__QURAN_PRESERVE_${idx}__`;
    });

    const fnBadge = (_: string, num: string) =>
      `<span class="islamic-footnote-sup inline-flex items-center justify-center mx-1 align-baseline"><a href="#fn-${num}" data-type="footnote-ref" class="islamic-footnote-ref font-scheherazade font-bold text-[13px] shadow-2xs no-underline transition-all hover:scale-110 border-b-0 cursor-pointer">${num}</a></span>`;

    let rawFormatted = safeProcessedText
      // 1. Wrapped markers: (^1), ^(1), ^1, (1), [1], (1^)
      .replace(/\s*[-–—]?\s*\(\^\s*([\d\u0660-\u0669]+)\)\s*[-–—]?/g, fnBadge)
      .replace(/\s*[-–—]?\s*\^\(([\d\u0660-\u0669]+)\)\s*[-–—]?/g, fnBadge)
      .replace(/\s*[-–—]?\s*\^([\d\u0660-\u0669]+)\s*[-–—]?/g, fnBadge)
      .replace(/\s*\(([\d\u0660-\u0669]+)\^\)\s*/g, fnBadge)
      .replace(/\s*[-–—]+\s*\(([\d\u0660-\u0669]+)\)\s*[-–—]+/g, fnBadge)
      .replace(/\s*\(([\d\u0660-\u0669]{1,2})\)\s*/g, fnBadge)
      .replace(/\s*\[([\d\u0660-\u0669]{1,2})\]\s*/g, fnBadge)

      // 2. Digits attached directly to the end of words (e.g., بالدمشقي١., النضح٣،)
      .replace(/(?<=[\p{L}])([\d\u0660-\u0669]{1,2})(?=[.,،:;"'«»)\s]|$)/gu, fnBadge)

      // 3. Digits immediately following quotes/punctuation before a period/comma (e.g., "من ماء" ٢.)
      .replace(/(?<=["'»])\s*([\d\u0660-\u0669]{1,2})(?=[.,،:;]|\s*[.,،:;])/gu, fnBadge);

    // Restore protected Quran verses before passing to typography parser
    rawFormatted = rawFormatted.replace(/__QURAN_PRESERVE_(\d+)__/g, (_, idx) => quranPreserveTokens[Number(idx)] || '');

    const parsed = parseIslamicTypography(rawFormatted);

    // Structure prose paragraphs cleanly into <p class="turath-p">
    // while keeping titles, poetry stanzas, and dividers intact
    const segments = parsed.split(/\r?\n/);
    const wrapped: string[] = [];
    for (const seg of segments) {
      const trimmed = seg.trim();
      if (!trimmed) continue;
      if (
        trimmed.startsWith('<span data-type="title"') ||
        trimmed.startsWith('<h') ||
        trimmed.startsWith('<div data-type="poetry"') ||
        trimmed.startsWith('<div class="islamic-poetry-block"') ||
        trimmed.startsWith('<hr')
      ) {
        wrapped.push(trimmed);
      } else {
        wrapped.push(`<p class="turath-p">${trimmed}</p>`);
      }
    }
    return wrapped.join('');
  };

  const formattedMatn = formatMainText(matnPart);
  const formattedSharh = formatMainText(sharhPart);
  const mainCombined = formattedSharh ? `${formattedMatn}\n\n${formattedSharh}` : formattedMatn;

  return {
    main: mainCombined,
    matn: formattedMatn,
    sharh: formattedSharh || undefined,
    footnote: footnotePart || ''
  };
};

export type FootnoteItem = {
  num: string;
  text: string;
};

const parseFootnoteItems = (rawFootnoteText: string): FootnoteItem[] => {
  if (!rawFootnoteText || !rawFootnoteText.trim()) return [];

  // Pre-process: insert a newline before footnote badges or explicit item numbers
  const normalizedText = rawFootnoteText
    // 1. HTML footnote badges/links from API: <span class="..."><a href="#fn-1">1</a></span> or <a href="#fn-1">
    .replace(/(<span\s+class="[^"]*islamic-footnote-sup[^"]*"[^>]*>[\s\S]*?<\/span>)/gi, '\n$1')
    .replace(/(?<!<span[^>]*>)(<a\s+[^>]*href="#fn-[^"]*"[^>]*>[\s\S]*?<\/a>)/gi, '\n$1')

    // 2. Explicit wrapped or prefixed footnote text markers: (1), (١), [1], 1., ١., 1-, ١-
    .replace(/(?:^|\r?\n|\s{2,})(?:[-–—]?\s*[\(\[]\s*\^?\s*([\d\u0660-\u0669]{1,2})\s*[\)\]]\s*[-–—]?)/g, '\n($1)')
    .replace(/(?:^|\r?\n|\s{2,})([\d\u0660-\u0669]{1,2}\s*[\.\-–—]\s+)/g, '\n$1')

    // 3. Inline bare footnote numbers (like ١ القلتان... . ٢ أخرجه... . ٣ النضح:...)
    // Exclude Hadith/reference numbers preceded by "برقم", "رقم", "صـ", "صفحة", "سنة", "عام"
    .replace(/(?<!برقم\s*|رقم\s*|صـ\s*|صفحة\s*|عام\s*|سنة\s*)(?<=\.|;|:|\r?\n|^|\s{2,})\s*([\d\u0660-\u0669]{1,2})\s+(?=[\p{L}"'«\(\[])/gu, '\n$1 ');

  const lines = normalizedText.split(/\n+/);
  const items: FootnoteItem[] = [];
  let currentItem: FootnoteItem | null = null;

  const htmlBadgeRegex = /^<span\s+class="[^"]*islamic-footnote-sup[^"]*"[^>]*>[\s\S]*?<a[^>]*>([\d\u0660-\u0669]+)<\/a>[\s\S]*?<\/span>\s*(.*)/i;
  const htmlAnchorRegex = /^<a\s+[^>]*href="#fn-([\d\u0660-\u0669]+)"[^>]*>([\d\u0660-\u0669]+)<\/a>\s*(.*)/i;
  const textMarkerRegex = /^\s*[-–—]?\s*[\(\[]?\s*\^?\s*([\d\u0660-\u0669]{1,2})\s*[\)\]\.\-–—]?\s*(.*)/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const htmlMatch = trimmed.match(htmlBadgeRegex) || trimmed.match(htmlAnchorRegex);
    const textMatch = trimmed.match(textMarkerRegex);

    if (htmlMatch) {
      if (currentItem) items.push(currentItem);
      currentItem = {
        num: htmlMatch[1],
        text: htmlMatch[2] ? htmlMatch[2].trim() : ''
      };
    } else if (textMatch) {
      if (currentItem) items.push(currentItem);
      currentItem = {
        num: textMatch[1],
        text: textMatch[2] ? textMatch[2].trim() : ''
      };
    } else if (currentItem) {
      currentItem.text += ' ' + trimmed;
    } else {
      currentItem = {
        num: (items.length + 1).toString(),
        text: trimmed
      };
    }
  }

  if (currentItem) {
    items.push(currentItem);
  }

  return items;
};

const formatPageCopyText = (
  matn: string,
  sharh?: string,
  footnote?: string,
  bookTitle?: string,
  author?: string,
  pageNum?: number
): string => {
  const stripHtmlTags = (html: string) => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || doc.body.innerText || '';
  };

  const matnClean = stripHtmlTags(matn).trim();
  const sharhClean = sharh ? stripHtmlTags(sharh).trim() : '';

  let footnoteFormatted = '';
  if (footnote) {
    const footnoteItems = parseFootnoteItems(footnote);
    if (footnoteItems.length > 0) {
      footnoteFormatted = footnoteItems
        .map(item => `[${item.num}] ${stripHtmlTags(item.text).trim()}`)
        .join('\n');
    } else {
      footnoteFormatted = stripHtmlTags(footnote).trim();
    }
  }

  let fullText = matnClean;

  if (sharhClean) {
    fullText += `\n\n--- [ الشرح ] ---\n${sharhClean}`;
  }

  if (footnoteFormatted) {
    fullText += `\n\n--- [ الحواشي والتعليقات ] ---\n${footnoteFormatted}`;
  }

  if (bookTitle) {
    fullText += `\n\n[${bookTitle}${author ? ' - ' + author : ''}${pageNum ? ' - صـ ' + pageNum : ''}]`;
  }

  return fullText;
};

const RenderSharhDivider = ({ readerTheme }: { readerTheme: 'light' | 'dark' | 'sepia' }) => (
  <div className="relative my-10 flex items-center justify-center">
    <div className="absolute inset-0 flex items-center">
      <div
        className={`w-full border-t-2 border-dashed ${readerTheme === 'dark'
          ? 'border-amber-500/35'
          : readerTheme === 'sepia'
            ? 'border-[#B89F7D]'
            : 'border-amber-400/60'
          }`}
      />
    </div>
    <div
      className={`relative px-4 py-1 text-xs font-extrabold rounded-full border backdrop-blur-md transition-all ${readerTheme === 'dark'
        ? 'bg-[#181825] border-amber-500/40 text-amber-300 shadow-sm'
        : readerTheme === 'sepia'
          ? 'bg-[#F4ECD8] border-[#C8B89E] text-[#7A401A] shadow-2xs'
          : 'bg-white border-amber-300 text-amber-900 shadow-xs'
        }`}
    >
      الشرح
    </div>
  </div>
);

const RenderFootnotes = ({
  footnoteText,
  readerTheme,
  fontFamily,
  fontSize,
  showTashkeel = true
}: {
  footnoteText: string;
  readerTheme: 'light' | 'dark' | 'sepia';
  fontFamily: string;
  fontSize: number;
  showTashkeel?: boolean;
}) => {
  const { accentColor } = useTheme();
  const items = useMemo(() => parseFootnoteItems(footnoteText), [footnoteText]);

  if (!footnoteText || !footnoteText.trim()) return null;

  const getCardBg = () => {
    if (readerTheme === 'dark') {
      switch (accentColor) {
        case 'amber': return 'bg-[#10131a]/70 border-[#dfbf83]/25 hover:border-[#dfbf83]/40 text-amber-100 shadow-sm';
        case 'emerald': return 'bg-[#061413]/70 border-teal-500/25 hover:border-teal-400/40 text-teal-100 shadow-sm';
        case 'blue': return 'bg-[#061020]/70 border-blue-500/25 hover:border-blue-400/40 text-blue-100 shadow-sm';
        case 'purple':
        default: return 'bg-purple-950/30 border-purple-500/25 hover:border-purple-400/40 text-purple-100 shadow-sm';
      }
    }
    if (readerTheme === 'sepia') {
      return 'bg-[#F4ECD8]/80 border-[#D4C4A8] hover:border-[#B89F7D] text-[#4A3523] shadow-2xs';
    }
    switch (accentColor) {
      case 'amber': return 'bg-white/95 border-amber-200/90 hover:border-[#dfbf83] text-stone-900 shadow-xs';
      case 'emerald': return 'bg-white/95 border-teal-200/90 hover:border-teal-400 text-slate-900 shadow-xs';
      case 'blue': return 'bg-white/95 border-blue-200/90 hover:border-blue-400 text-slate-900 shadow-xs';
      case 'purple':
      default: return 'bg-white/95 border-purple-200/90 hover:border-purple-300 text-slate-800 shadow-xs';
    }
  };

  const getBadgeStyle = () => {
    if (readerTheme === 'dark') {
      switch (accentColor) {
        case 'amber': return 'bg-gradient-to-br from-[#8e682d] via-[#b88d46] to-[#dfbf83] text-stone-950 font-black border-[#dfbf83]/50 shadow-xs';
        case 'emerald': return 'bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-500 text-white font-bold border-teal-400/50 shadow-xs';
        case 'blue': return 'bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-600 text-white font-bold border-blue-400/50 shadow-xs';
        case 'purple':
        default: return 'bg-gradient-to-r from-purple-600 to-brand-magenta text-white font-bold border-purple-400/40 shadow-xs';
      }
    }
    if (readerTheme === 'sepia') {
      return 'bg-[#E5D7BF] text-[#5C3F22] border-[#C8B89E] font-bold';
    }
    switch (accentColor) {
      case 'amber': return 'bg-gradient-to-br from-[#8e682d] via-[#b88d46] to-[#dfbf83] text-stone-950 font-black border-[#b88d46]/60 shadow-xs';
      case 'emerald': return 'bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-500 text-white font-bold border-teal-500/60 shadow-xs';
      case 'blue': return 'bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-600 text-white font-bold border-blue-500/60 shadow-xs';
      case 'purple':
      default: return 'bg-gradient-to-r from-purple-600 to-brand-magenta text-white font-bold border-purple-300 shadow-xs';
    }
  };

  const getDividerLineClass = () => {
    if (readerTheme === 'dark') {
      switch (accentColor) {
        case 'amber': return 'border-amber-500/35';
        case 'emerald': return 'border-teal-500/35';
        case 'blue': return 'border-blue-500/35';
        case 'purple':
        default: return 'border-purple-500/30';
      }
    }
    if (readerTheme === 'sepia') return 'border-[#C8B89E]';
    switch (accentColor) {
      case 'amber': return 'border-amber-300/80';
      case 'emerald': return 'border-teal-300/80';
      case 'blue': return 'border-blue-300/80';
      case 'purple':
      default: return 'border-purple-200/80';
    }
  };

  const getHeaderBadgeClass = () => {
    if (readerTheme === 'dark') {
      switch (accentColor) {
        case 'amber': return 'bg-[#10131a] border-[#dfbf83]/40 text-[#eed9b0] shadow-sm';
        case 'emerald': return 'bg-[#061413] border-teal-500/40 text-teal-300 shadow-sm';
        case 'blue': return 'bg-[#061020] border-blue-500/40 text-blue-300 shadow-sm';
        case 'purple':
        default: return 'bg-[#181825] border-purple-500/40 text-purple-300 shadow-sm';
      }
    }
    if (readerTheme === 'sepia') return 'bg-[#F4ECD8] border-[#C8B89E] text-[#5C3F22] shadow-2xs';
    switch (accentColor) {
      case 'amber': return 'bg-[#fdfaf3] border-[#dfbf83] text-[#78531b] shadow-xs';
      case 'emerald': return 'bg-teal-50 border-teal-300 text-teal-900 shadow-xs';
      case 'blue': return 'bg-blue-50 border-blue-300 text-blue-900 shadow-xs';
      case 'purple':
      default: return 'bg-white border-purple-200 text-purple-800 shadow-xs';
    }
  };

  return (
    <div className="mt-8 pt-2">
      {/* Footnote Section Header Divider */}
      <div className="relative my-6 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div
            className={`w-full border-t-2 border-dashed ${getDividerLineClass()}`}
          />
        </div>
        <div
          className={`relative px-4 py-1 text-xs font-bold font-scheherazade rounded-full border backdrop-blur-md transition-all ${getHeaderBadgeClass()}`}
        >
          الحواشي والتعليقات
        </div>
      </div>

      {/* Footnote List */}
      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div
              key={idx}
              id={`fn-${item.num}`}
              className="group flex items-start gap-3 py-1 px-1.5 rounded-xl transition-all duration-300 hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
            >
              {/* Stylized Circular Number Badge (lowered slightly to align with first text line) */}
              <span className={`shrink-0 font-scheherazade font-bold text-xs rounded-full border flex items-center justify-center w-6 h-6 sm:w-6.5 sm:h-6.5 mt-1 sm:mt-1.5 shadow-2xs transition-transform group-hover:scale-105 ${getBadgeStyle()}`}>
                {item.num}
              </span>

              {/* Text (refined size and natural reading line-height) */}
              <div
                className={`turath-content flex-1 leading-[1.85] opacity-90 ${fontFamily}`}
                style={{ fontSize: `${Math.max(12, fontSize - 5)}px` }}
                dangerouslySetInnerHTML={{
                  __html: showTashkeel
                    ? parseIslamicTypography(replaceIslamicLigatures(item.text))
                    : stripArabicDiacritics(parseIslamicTypography(replaceIslamicLigatures(item.text)))
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div
          className={`turath-content prose max-w-none leading-relaxed opacity-85 px-1 ${fontFamily}`}
          style={{ fontSize: `${Math.max(12, fontSize - 5)}px` }}
          dangerouslySetInnerHTML={{
            __html: showTashkeel
              ? parseIslamicTypography(footnoteText)
              : stripArabicDiacritics(parseIslamicTypography(footnoteText))
          }}
        />
      )}
    </div>
  );
};

interface PageQuickSearchBarProps {
  isOpen: boolean;
  readerTheme: 'light' | 'dark' | 'sepia';
  accentColor: AccentColor;
  onSearchQueryChange: (query: string) => void;
  onClose: () => void;
  pageMatchesCount: number;
  activeMatchIndex: number;
  onPrevMatch: () => void;
  onNextMatch: () => void;
  onSearchInBook: (query: string) => void;
}

const PageQuickSearchBar: React.FC<PageQuickSearchBarProps> = React.memo(({
  isOpen,
  readerTheme,
  accentColor,
  onSearchQueryChange,
  onClose,
  pageMatchesCount,
  activeMatchIndex,
  onPrevMatch,
  onNextMatch,
  onSearchInBook,
}) => {
  const [localQuery, setLocalQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
      return () => clearTimeout(t);
    } else {
      setLocalQuery('');
      if (debounceRef.current) clearTimeout(debounceRef.current);
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearchQueryChange(val);
    }, 180);
  };

  const handleClear = () => {
    setLocalQuery('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onSearchQueryChange('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        onSearchQueryChange(localQuery);
      }
      if (e.shiftKey) onPrevMatch();
      else onNextMatch();
    } else if (e.key === 'Escape') {
      onClose();
      handleClear();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0, y: -8 }}
          animate={{ height: 'auto', opacity: 1, y: 0 }}
          exit={{ height: 0, opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full overflow-hidden flex flex-col border-t select-none ${
            readerTheme === 'dark'
              ? 'border-white/10 bg-black/30 text-white'
              : 'border-slate-200/80 bg-black/[0.03] text-slate-900'
          }`}
        >
          {/* Main Search Input Row */}
          <div className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2">
            {/* Search Icon with current accent color */}
            <Search
              className={`w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 ${
                accentColor === 'amber'
                  ? 'text-amber-500'
                  : accentColor === 'emerald'
                    ? 'text-teal-600 dark:text-teal-400'
                    : accentColor === 'blue'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-brand-magenta'
              }`}
              strokeWidth={2.3}
            />

            {/* Seamless Instant Input */}
            <input
              ref={inputRef}
              type="text"
              value={localQuery}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="بحث في الصفحة الحالية..."
              className="flex-1 bg-transparent border-0 outline-none text-xs sm:text-sm font-semibold placeholder:text-muted-foreground/60 p-0 m-0 focus:ring-0 leading-normal"
            />

            {/* Match Counter (Only when matches are found on this page) */}
            {localQuery.trim() && pageMatchesCount > 0 && (
              <span
                className={`text-[11px] font-black px-2 py-0.5 rounded-md shrink-0 ${
                  accentColor === 'amber'
                    ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                    : accentColor === 'emerald'
                      ? 'bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30'
                      : accentColor === 'blue'
                        ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                        : 'bg-brand-magenta/20 text-brand-magenta border border-brand-magenta/30'
                }`}
              >
                {activeMatchIndex + 1} / {pageMatchesCount}
              </span>
            )}

            {/* Close Button Only */}
            <button
              type="button"
              onClick={() => {
                onClose();
                handleClear();
              }}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
              title="إغلاق البحث (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Underneath Suggestion Banner when 0 matches on current page */}
          {localQuery.trim() && pageMatchesCount === 0 && (
            <div
              className={`w-full flex items-center justify-between gap-3 px-3 sm:px-6 py-2 border-t text-xs transition-colors ${
                readerTheme === 'dark'
                  ? 'bg-white/[0.04] border-white/10'
                  : 'bg-black/[0.02] border-slate-200/70'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500/80 shrink-0" />
                <span className="text-muted-foreground text-xs truncate">
                  لا توجد نتائج في هذه الصفحة
                </span>
              </div>

              <button
                type="button"
                onClick={() => onSearchInBook(localQuery)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  accentColor === 'amber'
                    ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-500/20'
                    : accentColor === 'emerald'
                      ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm shadow-teal-600/20'
                      : accentColor === 'blue'
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20'
                        : 'bg-brand-magenta text-white hover:bg-brand-magenta/90 shadow-sm'
                }`}
                title="البحث عن هذه الكلمة في كامل صفحات وأجزاء الكتاب"
              >
                <Search className="w-3.5 h-3.5" />
                <span>بحث في كامل الكتاب</span>
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default function TurathReader({
  book,
  onClose,
  onAskBook,
  globalFontSize,
  onSelectAuthor,
  onOpenSidebar,
  onReaderThemeChange,
}: {
  book: BookMeta
  onClose: () => void
  onAskBook: (b: BookMeta) => void
  globalFontSize?: 'small' | 'medium' | 'large'
  onSelectAuthor?: (authorName: string) => void
  onOpenSidebar?: () => void
  onReaderThemeChange?: (theme: 'light' | 'dark' | 'sepia') => void
}) {
  const { theme, toggleTheme, accentColor, setAccentColor, isDark } = useTheme()
  const [loadingBook, setLoadingBook] = useState(true)
  const [toc, setToc] = useState<Heading[]>([])
  const [authorName, setAuthorName] = useState<string>(book.author === "بحث في الفهرس" ? "" : book.author)
  const [authorId, setAuthorId] = useState<number | null>(null)

  const initialPageNum = book.savedPage && book.savedPage > 0 ? book.savedPage : 1;
  const [currentPage, setCurrentPage] = useState<number>(initialPageNum);
  const [loadingPage, setLoadingPage] = useState(false);
  const [pageText, setPageText] = useState<{ main: string; matn?: string; sharh?: string; footnote: string } | null>(null);

  const [tocSearch, setTocSearch] = useState('');
  const [pageInput, setPageInput] = useState<string>(String(initialPageNum));

  // If book.savedPage changes dynamically on opened book
  useEffect(() => {
    if (book.savedPage && book.savedPage > 0) {
      setCurrentPage(book.savedPage);
      setPageInput(String(book.savedPage));
    }
  }, [book.id, book.savedPage]);

  // Synchronize current reading progress with recent book storage
  useEffect(() => {
    if (currentPage > 0 && book?.id) {
      try {
        const recent = { ...book, savedPage: currentPage };
        localStorage.setItem('zad_recent_read_book', JSON.stringify(recent));
      } catch (e) { }
    }
  }, [book, currentPage]);

  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set())

  // Reader font size state - Default is strictly 22px
  const [fontSize, setFontSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('turath_reader_font_size');
      if (saved) {
        const parsed = Number(saved);
        // If it was saved as 28 from the previous default, reset to 22
        if (parsed === 28) {
          localStorage.setItem('turath_reader_font_size', '22');
          return 22;
        }
        if (parsed >= 14 && parsed <= 40) return parsed;
      }
    } catch { }
    return 22;
  });
  const [fontFamily, setFontFamily] = useState<string>('font-amiri');

  useEffect(() => {
    try {
      localStorage.setItem('turath_reader_font_size', String(fontSize));
    } catch { }
  }, [fontSize]);

  // Tashkeel state: Show or hide Arabic diacritics
  const [showTashkeel, setShowTashkeel] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('turath_show_tashkeel');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('turath_show_tashkeel', String(showTashkeel));
    } catch { }
  }, [showTashkeel]);

  const renderContentHtml = useCallback((html: string | undefined) => {
    if (!html) return '';
    return showTashkeel ? html : stripArabicDiacritics(html);
  }, [showTashkeel]);

  useEffect(() => {
    if (globalFontSize) {
      if (globalFontSize === 'small') setFontSize(18);
      else if (globalFontSize === 'medium') setFontSize(22);
      else if (globalFontSize === 'large') setFontSize(22);
    }
  }, [globalFontSize]);
  const [readerTheme, setReaderTheme] = useState<'light' | 'dark' | 'sepia'>(() => theme === 'dark' ? 'dark' : 'light')

  useEffect(() => {
    const newMode = theme === 'dark' ? 'dark' : 'light';
    setReaderTheme(newMode);
    onReaderThemeChange?.(newMode);
  }, [theme, onReaderThemeChange]);

  // -------------------------------------------------------------------------
  // Dynamic 4-Theme Styling Helpers for Reader
  // -------------------------------------------------------------------------
  const getReaderRootBg = () => {
    if (readerTheme === 'dark') {
      switch (accentColor) {
        case 'amber': return 'bg-[#090b10] text-slate-100';
        case 'emerald': return 'bg-[#061110] text-slate-100';
        case 'blue': return 'bg-[#060e1a] text-slate-100';
        case 'purple':
        default: return 'bg-[#0d071a] text-slate-100';
      }
    }
    if (readerTheme === 'sepia') {
      return 'bg-[#fcf8f0] text-[#3d2c1d] sepia-reader';
    }
    switch (accentColor) {
      case 'amber': return 'bg-[#faf7f0] text-stone-900';
      case 'emerald': return 'bg-[#f0fdfa] text-slate-900';
      case 'blue': return 'bg-[#f0f7ff] text-slate-900';
      case 'purple':
      default: return 'bg-[#faf8fd] text-slate-900';
    }
  };

  const getReaderPatternColor = () => {
    if (readerTheme === 'dark') {
      switch (accentColor) {
        case 'amber': return 'text-[#dfbf83]';
        case 'emerald': return 'text-teal-400';
        case 'blue': return 'text-blue-400';
        case 'purple':
        default: return 'text-purple-400';
      }
    }
    if (readerTheme === 'sepia') {
      return 'text-[#b45309]';
    }
    switch (accentColor) {
      case 'amber': return 'text-[#b88d46]';
      case 'emerald': return 'text-teal-600';
      case 'blue': return 'text-blue-600';
      case 'purple':
      default: return 'text-purple-600';
    }
  };

  const getReaderFrameBgColor = (opacity: number) => {
    switch (accentColor) {
      case 'amber': return `rgba(13, 16, 22, ${opacity / 100})`;
      case 'emerald': return `rgba(8, 20, 19, ${opacity / 100})`;
      case 'blue': return `rgba(8, 16, 28, ${opacity / 100})`;
      case 'purple':
      default: return `rgba(13, 7, 26, ${opacity / 100})`;
    }
  };

  const getReaderBackButtonClass = () => {
    if (readerTheme === 'dark') {
      switch (accentColor) {
        case 'amber':
          return 'bg-white/5 border border-white/10 text-[#eed9b0] hover:bg-gradient-to-r hover:from-[#8e682d] hover:to-[#dfbf83] hover:text-stone-950 font-bold';
        case 'emerald':
          return 'bg-white/5 border border-white/10 text-teal-300 hover:bg-teal-600 hover:text-white font-bold';
        case 'blue':
          return 'bg-white/5 border border-white/10 text-blue-300 hover:bg-blue-600 hover:text-white font-bold';
        case 'purple':
        default:
          return 'bg-white/5 border border-white/10 text-purple-300 hover:bg-brand-magenta hover:text-white font-bold';
      }
    }
    switch (accentColor) {
      case 'amber':
        return 'border border-[#dfbf83]/80 bg-gradient-to-br from-[#dfbf83]/20 via-[#dfbf83]/35 to-[#b88d46]/25 text-[#78531b] hover:from-[#8e682d] hover:to-[#dfbf83] hover:text-stone-950 shadow-sm font-bold';
      case 'emerald':
        return 'border border-teal-300/80 bg-teal-50 text-teal-800 hover:bg-teal-600 hover:text-white shadow-sm font-bold';
      case 'blue':
        return 'border border-blue-300/80 bg-blue-50 text-blue-800 hover:bg-blue-600 hover:text-white shadow-sm font-bold';
      case 'purple':
      default:
        return 'border border-purple-200/80 bg-purple-50 text-brand-magenta hover:bg-brand-magenta hover:text-white shadow-sm font-bold';
    }
  };

  const getNavCircleBtnStyle = () => {
    if (readerTheme === 'dark') {
      switch (accentColor) {
        case 'amber':
          return 'bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-[#dfbf83]/50 text-slate-300 hover:text-[#eed8ad] shadow-xs hover:shadow-[#dfbf83]/20 transition-all';
        case 'emerald':
          return 'bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-teal-400/50 text-slate-300 hover:text-teal-200 shadow-xs hover:shadow-teal-500/20 transition-all';
        case 'blue':
          return 'bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-blue-400/50 text-slate-300 hover:text-blue-200 shadow-xs hover:shadow-blue-500/20 transition-all';
        case 'purple':
        default:
          return 'bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-purple-400/50 text-slate-300 hover:text-purple-200 shadow-xs hover:shadow-purple-500/20 transition-all';
      }
    }
    switch (accentColor) {
      case 'amber':
        return 'bg-white/80 hover:bg-white border border-[#ebd9b5] hover:border-[#dfbf83] text-[#8a652a] shadow-xs';
      case 'emerald':
        return 'bg-white/80 hover:bg-white border border-teal-200 hover:border-teal-300 text-teal-800 shadow-xs';
      case 'blue':
        return 'bg-white/80 hover:bg-white border border-blue-200 hover:border-blue-300 text-blue-800 shadow-xs';
      case 'purple':
      default:
        return 'bg-white/80 hover:bg-white border border-purple-200 hover:border-purple-300 text-purple-800 shadow-xs';
    }
  };

  const getHeaderTabActiveStyle = (tab: 'toc' | 'search' | 'hadiths' | 'chat') => {
    if (tab === 'hadiths') {
      if (readerTheme === 'dark') {
        return 'bg-amber-500/25 border border-amber-500/50 text-white shadow-lg shadow-amber-500/25 font-extrabold scale-[1.02] ring-1 ring-amber-500/30';
      }
      return 'bg-gradient-to-b from-white/90 via-amber-50/60 to-amber-100/70 backdrop-blur-xl border border-amber-300/80 text-amber-950 shadow-md shadow-amber-500/10 font-extrabold scale-[1.02]';
    }
    if (readerTheme === 'dark') {
      switch (accentColor) {
        case 'amber':
          return 'bg-[#b88d46]/25 border border-[#dfbf83]/50 text-[#eed9b0] shadow-lg shadow-amber-950/30 font-extrabold scale-[1.02] ring-1 ring-[#dfbf83]/30';
        case 'emerald':
          return 'bg-teal-500/25 border border-teal-400/50 text-teal-200 shadow-lg shadow-teal-950/30 font-extrabold scale-[1.02] ring-1 ring-teal-400/30';
        case 'blue':
          return 'bg-blue-500/25 border border-blue-400/50 text-blue-200 shadow-lg shadow-blue-950/30 font-extrabold scale-[1.02] ring-1 ring-blue-400/30';
        case 'purple':
        default:
          return 'bg-purple-500/25 border border-purple-400/50 text-purple-200 shadow-lg shadow-purple-950/30 font-extrabold scale-[1.02] ring-1 ring-purple-400/30';
      }
    } else {
      switch (accentColor) {
        case 'amber':
          return 'bg-gradient-to-b from-white/90 via-amber-50/70 to-amber-100/80 backdrop-blur-xl border border-[#b88d46]/60 text-stone-950 shadow-md shadow-amber-600/10 font-extrabold scale-[1.02]';
        case 'emerald':
          return 'bg-gradient-to-b from-white/90 via-teal-50/60 to-teal-100/70 backdrop-blur-xl border border-teal-300/80 text-teal-950 shadow-md shadow-teal-500/10 font-extrabold scale-[1.02]';
        case 'blue':
          return 'bg-gradient-to-b from-white/90 via-blue-50/60 to-blue-100/70 backdrop-blur-xl border border-blue-300/80 text-blue-950 shadow-md shadow-blue-500/10 font-extrabold scale-[1.02]';
        case 'purple':
        default:
          return 'bg-gradient-to-b from-white/90 via-purple-50/60 to-purple-100/70 backdrop-blur-xl border border-purple-300/80 text-purple-950 shadow-md shadow-purple-500/10 font-extrabold scale-[1.02]';
      }
    }
  };

  const getHeaderTitleColor = () => {
    switch (accentColor) {
      case 'amber':
        return readerTheme === 'dark' ? 'text-[#dfbf83]' : 'text-[#8e682d]';
      case 'emerald':
        return readerTheme === 'dark' ? 'text-teal-300' : 'text-teal-800';
      case 'blue':
        return readerTheme === 'dark' ? 'text-sky-300' : 'text-blue-800';
      case 'purple':
      default:
        return readerTheme === 'dark' ? 'text-purple-300' : 'text-[#7e1891]';
    }
  };

  const getActiveAccentClass = () => {
    switch (accentColor) {
      case 'amber':
        return 'border-amber-500/70 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold shadow-xs';
      case 'emerald':
        return 'border-teal-500/70 bg-teal-500/15 text-teal-700 dark:text-teal-300 font-bold shadow-xs';
      case 'blue':
        return 'border-blue-500/70 bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold shadow-xs';
      case 'purple':
      default:
        return 'border-purple-500/70 bg-purple-500/15 text-purple-600 dark:text-purple-300 font-bold shadow-xs';
    }
  };

  const getAccentTextClass = () => {
    switch (accentColor) {
      case 'amber': return 'text-amber-600 dark:text-[#dfbf83]';
      case 'emerald': return 'text-teal-600 dark:text-teal-400';
      case 'blue': return 'text-blue-600 dark:text-blue-400';
      case 'purple':
      default: return 'text-brand-magenta dark:text-purple-300';
    }
  };

  const getAccentIconBgClass = () => {
    switch (accentColor) {
      case 'amber': return 'bg-amber-500/15 text-amber-600 dark:text-[#dfbf83]';
      case 'emerald': return 'bg-teal-500/15 text-teal-600 dark:text-teal-300';
      case 'blue': return 'bg-blue-500/15 text-blue-600 dark:text-blue-300';
      case 'purple':
      default: return 'bg-purple-500/15 text-brand-magenta dark:text-purple-300';
    }
  };

  const getAccentSliderClass = () => {
    switch (accentColor) {
      case 'amber': return 'accent-[#b88d46]';
      case 'emerald': return 'accent-teal-500';
      case 'blue': return 'accent-blue-600';
      case 'purple':
      default: return 'accent-purple-600';
    }
  };

  const getBottomNavTabClass = (isActive: boolean) => {
    const base = 'flex-1 h-full flex flex-col items-center justify-center py-1.5 px-0.5 gap-1 transition-colors duration-200 relative cursor-pointer min-w-0 select-none border-0 outline-none';
    if (!isActive) {
      return `${base} text-muted-foreground hover:text-foreground opacity-70 hover:bg-black/[0.03] dark:hover:bg-white/[0.03]`;
    }
    switch (accentColor) {
      case 'amber':
        return `${base} text-[#8e682d] dark:text-[#dfbf83] font-bold bg-[#c59b58]/18 dark:bg-[#c59b58]/25`;
      case 'emerald':
        return `${base} text-teal-700 dark:text-teal-300 font-bold bg-teal-500/18 dark:bg-teal-500/25`;
      case 'blue':
        return `${base} text-blue-600 dark:text-blue-300 font-bold bg-blue-500/18 dark:bg-blue-500/25`;
      case 'purple':
      default:
        return `${base} text-brand-magenta dark:text-purple-300 font-bold bg-purple-500/18 dark:bg-purple-500/25`;
    }
  };

  const getBottomNavIndicatorClass = () => {
    switch (accentColor) {
      case 'amber': return 'bg-gradient-to-r from-[#8e682d] to-[#c59b58] text-white';
      case 'emerald': return 'bg-teal-500 text-white';
      case 'blue': return 'bg-blue-500 text-white';
      case 'purple': default: return 'bg-brand-magenta text-white';
    }
  };

  const getBottomNavZadLogoColor = (isActive: boolean) => {
    if (!isActive) {
      return 'currentColor';
    }
    switch (accentColor) {
      case 'amber': return readerTheme === 'dark' ? '#fcd34d' : '#8e682d';
      case 'emerald': return readerTheme === 'dark' ? '#5eead4' : '#0f766e';
      case 'blue': return readerTheme === 'dark' ? '#93c5fd' : '#1d4ed8';
      case 'purple':
      default: return readerTheme === 'dark' ? '#e9d5ff' : '#7e1891';
    }
  };

  const renderZadLogo = (sizeClass: string = 'h-4 w-4', dropShadow: boolean = false) => {
    const color = (() => {
      switch (accentColor) {
        case 'amber': return readerTheme === 'dark' ? '#dfbf83' : '#b88d46';
        case 'emerald': return readerTheme === 'dark' ? '#2dd4bf' : '#0d9488';
        case 'blue': return readerTheme === 'dark' ? '#60a5fa' : '#2563eb';
        case 'purple':
        default: return readerTheme === 'dark' ? '#c084fc' : '#950bc4';
      }
    })();

    const shadow = dropShadow
      ? accentColor === 'amber'
        ? 'drop-shadow(0 0 8px rgba(223, 191, 131, 0.6))'
        : accentColor === 'emerald'
          ? 'drop-shadow(0 0 8px rgba(45, 212, 191, 0.6))'
          : accentColor === 'blue'
            ? 'drop-shadow(0 0 8px rgba(96, 165, 250, 0.6))'
            : 'drop-shadow(0 0 8px rgba(192, 132, 252, 0.6))'
      : undefined;

    return (
      <div
        className={`${sizeClass} inline-block shrink-0 transition-colors duration-200`}
        style={{
          backgroundColor: color,
          WebkitMaskImage: `url(${whiteLogo})`,
          maskImage: `url(${whiteLogo})`,
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
          filter: shadow
        }}
        aria-hidden="true"
      />
    );
  };

  const getHeaderAuthorBadgeClass = () => {
    return readerTheme === 'dark'
      ? 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
      : 'bg-black/5 border-black/10 text-slate-800 hover:bg-black/10';
  };

  const getAccentDotColor = () => {
    switch (accentColor) {
      case 'amber': return 'bg-[#b88d46] shadow-[0_0_6px_#b88d46]';
      case 'emerald': return 'bg-teal-500 shadow-[0_0_6px_#14b8a6]';
      case 'blue': return 'bg-blue-500 shadow-[0_0_6px_#3b82f6]';
      case 'purple':
      default: return 'bg-brand-magenta shadow-[0_0_6px_#950bc4]';
    }
  };

  const getAuthorBioTagStyle = () => {
    switch (accentColor) {
      case 'amber': return 'bg-[#b88d46]/20 text-stone-900 dark:text-[#eed9b0]';
      case 'emerald': return 'bg-teal-500/20 text-teal-800 dark:text-teal-200';
      case 'blue': return 'bg-blue-500/20 text-blue-800 dark:text-blue-200';
      case 'purple':
      default: return 'bg-brand-magenta/20 text-brand-magenta';
    }
  };

  const getBreadcrumbChapterColor = () => {
    if (readerTheme === 'dark') {
      switch (accentColor) {
        case 'amber': return 'text-[#eed9b0]';
        case 'emerald': return 'text-teal-300';
        case 'blue': return 'text-blue-300';
        case 'purple':
        default: return 'text-purple-300';
      }
    }
    switch (accentColor) {
      case 'amber': return 'text-[#76541f]';
      case 'emerald': return 'text-teal-800';
      case 'blue': return 'text-blue-800';
      case 'purple':
      default: return 'text-brand-magenta';
    }
  };

  const getPaginationBtnHoverClass = () => {
    switch (accentColor) {
      case 'amber': return 'hover:bg-gradient-to-r hover:from-[#8e682d] hover:to-[#dfbf83] hover:text-stone-950';
      case 'emerald': return 'hover:bg-teal-600 hover:text-white';
      case 'blue': return 'hover:bg-blue-600 hover:text-white';
      case 'purple':
      default: return 'hover:bg-brand-magenta hover:text-white';
    }
  };

  const getPaginationInputContainerClass = () => {
    if (readerTheme === 'dark') {
      switch (accentColor) {
        case 'amber': return 'bg-amber-500/10 border-amber-500/30 text-amber-200';
        case 'emerald': return 'bg-teal-500/10 border-teal-500/30 text-teal-200';
        case 'blue': return 'bg-blue-500/10 border-blue-500/30 text-blue-200';
        case 'purple':
        default: return 'bg-purple-500/10 border-purple-500/30 text-purple-200';
      }
    }
    if (readerTheme === 'sepia') {
      return 'bg-[#EBDBC0] border-[#D4C4A8] text-[#5C3A1E]';
    }
    switch (accentColor) {
      case 'amber': return 'bg-amber-50 border-amber-200 text-stone-900';
      case 'emerald': return 'bg-teal-50 border-teal-200 text-teal-950';
      case 'blue': return 'bg-blue-50 border-blue-200 text-blue-950';
      case 'purple':
      default: return 'bg-purple-50 border-purple-200 text-purple-950';
    }
  };

  const getPaginationLayersIconClass = () => {
    switch (accentColor) {
      case 'amber': return 'text-[#b88d46]';
      case 'emerald': return 'text-teal-600 dark:text-teal-400';
      case 'blue': return 'text-blue-600 dark:text-blue-400';
      case 'purple':
      default: return 'text-purple-600 dark:text-purple-400';
    }
  };

  const lightTitleColor = accentColor === 'amber' ? '#8e682d' : accentColor === 'emerald' ? '#0d9488' : accentColor === 'blue' ? '#2563eb' : '#950bc4';
  const lightTitleBorder = accentColor === 'amber' ? 'rgba(142, 104, 45, 0.4)' : accentColor === 'emerald' ? 'rgba(13, 148, 136, 0.4)' : accentColor === 'blue' ? 'rgba(37, 99, 235, 0.4)' : 'rgba(149, 11, 196, 0.4)';

  const darkTitleColor = accentColor === 'amber' ? '#dfbf83' : accentColor === 'emerald' ? '#2dd4bf' : accentColor === 'blue' ? '#60a5fa' : '#c084fc';
  const darkTitleBorder = accentColor === 'amber' ? 'rgba(223, 191, 131, 0.4)' : accentColor === 'emerald' ? 'rgba(45, 212, 191, 0.4)' : accentColor === 'blue' ? 'rgba(96, 165, 250, 0.4)' : 'rgba(192, 132, 252, 0.4)';

  const inputFocusBorderClass = accentColor === 'amber'
    ? 'focus:border-[#b88d46]'
    : accentColor === 'emerald'
      ? 'focus:border-teal-500'
      : accentColor === 'blue'
        ? 'focus:border-blue-500'
        : 'focus:border-purple-500';

  const selectionClass = accentColor === 'amber'
    ? 'selection:bg-amber-400/30 selection:text-stone-950 dark:selection:text-amber-100'
    : accentColor === 'emerald'
      ? 'selection:bg-teal-400/30 selection:text-teal-950 dark:selection:text-teal-100'
      : accentColor === 'blue'
        ? 'selection:bg-blue-400/30 selection:text-blue-950 dark:selection:text-blue-100'
        : 'selection:bg-brand-magenta/30 selection:text-brand-deep dark:selection:text-white';

  const getHighlightHeaderIconClass = () => {
    switch (accentColor) {
      case 'amber':
        return readerTheme === 'dark' ? 'text-[#dfbf83]' : 'text-[#b88d46]';
      case 'emerald':
        return readerTheme === 'dark' ? 'text-teal-400' : 'text-teal-600';
      case 'blue':
        return readerTheme === 'dark' ? 'text-blue-400' : 'text-blue-600';
      case 'purple':
      default:
        return readerTheme === 'dark' ? 'text-purple-400' : 'text-brand-magenta';
    }
  };

  const getHighlightsCountBadgeStyle = () => {
    if (readerTheme === 'dark') {
      switch (accentColor) {
        case 'amber':
          return 'bg-[#dfbf83]/15 border-[#dfbf83]/30 text-[#dfbf83]';
        case 'emerald':
          return 'bg-teal-500/15 border-teal-500/30 text-teal-300';
        case 'blue':
          return 'bg-blue-500/15 border-blue-500/30 text-blue-300';
        case 'purple':
        default:
          return 'bg-brand-magenta/15 border-brand-magenta/30 text-purple-300';
      }
    }
    if (readerTheme === 'sepia') {
      switch (accentColor) {
        case 'amber':
          return 'bg-[#eedbb2]/70 border-[#dfbf83] text-[#78531b]';
        case 'emerald':
          return 'bg-teal-100/70 border-teal-300 text-teal-800';
        case 'blue':
          return 'bg-blue-100/70 border-blue-300 text-blue-800';
        case 'purple':
        default:
          return 'bg-purple-100/70 border-purple-300 text-purple-900';
      }
    }
    // Light
    switch (accentColor) {
      case 'amber':
        return 'bg-[#dfbf83]/20 border-[#dfbf83]/70 text-[#8e682d]';
      case 'emerald':
        return 'bg-teal-50 border-teal-200 text-teal-700';
      case 'blue':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'purple':
      default:
        return 'bg-purple-50 border-purple-200 text-brand-magenta';
    }
  };

  const getHighlightEmptyIconStyle = () => {
    if (readerTheme === 'dark') {
      switch (accentColor) {
        case 'amber':
          return 'bg-[#dfbf83]/15 text-[#dfbf83] border border-[#dfbf83]/30 shadow-[0_0_15px_rgba(223,191,131,0.2)]';
        case 'emerald':
          return 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-[0_0_15px_rgba(45,212,191,0.2)]';
        case 'blue':
          return 'bg-blue-500/15 text-blue-300 border border-blue-500/30 shadow-[0_0_15px_rgba(96,165,250,0.2)]';
        case 'purple':
        default:
          return 'bg-brand-magenta/15 text-purple-300 border border-brand-magenta/30 shadow-[0_0_15px_rgba(192,132,252,0.2)]';
      }
    }
    if (readerTheme === 'sepia') {
      switch (accentColor) {
        case 'amber':
          return 'bg-[#eedbb2]/60 text-[#8e682d] border border-[#dfbf83] shadow-xs';
        case 'emerald':
          return 'bg-teal-100/60 text-teal-800 border border-teal-300 shadow-xs';
        case 'blue':
          return 'bg-blue-100/60 text-blue-800 border border-blue-300 shadow-xs';
        case 'purple':
        default:
          return 'bg-purple-100/60 text-purple-900 border border-purple-300 shadow-xs';
      }
    }
    // Light
    switch (accentColor) {
      case 'amber':
        return 'bg-gradient-to-br from-[#dfbf83]/25 via-amber-50 to-[#faf0de] text-[#8e682d] border border-[#dfbf83]/70 shadow-sm';
      case 'emerald':
        return 'bg-gradient-to-br from-teal-50 to-emerald-100/60 text-teal-700 border border-teal-200 shadow-sm';
      case 'blue':
        return 'bg-gradient-to-br from-blue-50 to-indigo-100/60 text-blue-700 border border-blue-200 shadow-sm';
      case 'purple':
      default:
        return 'bg-gradient-to-br from-purple-50 to-fuchsia-100/60 text-brand-magenta border border-purple-200 shadow-sm';
    }
  };

  const getHighlightActiveCardStyle = (isCurrentPage: boolean) => {
    if (!isCurrentPage) {
      return readerTheme === 'dark'
        ? 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/15'
        : readerTheme === 'sepia'
          ? 'bg-[#f7efe1]/70 border-[#e4d5be] hover:bg-[#f7efe1] hover:border-[#d4c1a5]'
          : 'bg-slate-50/80 border-slate-200/80 hover:bg-white hover:border-slate-300 hover:shadow-xs';
    }
    if (readerTheme === 'dark') {
      switch (accentColor) {
        case 'amber':
          return 'bg-[#dfbf83]/12 border-[#dfbf83]/50 text-[#eed9b0] shadow-md shadow-amber-950/40 ring-1 ring-[#dfbf83]/30';
        case 'emerald':
          return 'bg-teal-500/15 border-teal-500/50 text-teal-200 shadow-md shadow-teal-950/40 ring-1 ring-teal-500/30';
        case 'blue':
          return 'bg-blue-500/15 border-blue-500/50 text-blue-200 shadow-md shadow-blue-950/40 ring-1 ring-blue-500/30';
        case 'purple':
        default:
          return 'bg-brand-magenta/15 border-brand-magenta/50 text-purple-200 shadow-md shadow-purple-950/40 ring-1 ring-brand-magenta/30';
      }
    }
    if (readerTheme === 'sepia') {
      switch (accentColor) {
        case 'amber':
          return 'bg-[#eedbb2]/40 border-[#c59b58] text-[#543b20] shadow-sm';
        case 'emerald':
          return 'bg-teal-50/60 border-teal-400 text-teal-950 shadow-sm';
        case 'blue':
          return 'bg-blue-50/60 border-blue-400 text-blue-950 shadow-sm';
        case 'purple':
        default:
          return 'bg-purple-50/60 border-purple-400 text-purple-950 shadow-sm';
      }
    }
    // Light
    switch (accentColor) {
      case 'amber':
        return 'bg-gradient-to-br from-amber-50/90 via-[#fcf8f0] to-[#f6ecdb]/80 border-[#dfbf83] text-stone-950 shadow-sm';
      case 'emerald':
        return 'bg-gradient-to-br from-teal-50/90 via-[#f0fdf4] to-teal-100/50 border-teal-300 text-teal-950 shadow-sm';
      case 'blue':
        return 'bg-gradient-to-br from-blue-50/90 via-[#f0f7ff] to-blue-100/50 border-blue-300 text-blue-950 shadow-sm';
      case 'purple':
      default:
        return 'bg-gradient-to-br from-purple-50/90 via-[#faf5ff] to-purple-100/50 border-purple-300 text-purple-950 shadow-sm';
    }
  };

  const getHighlightBadgeStyle = (isCurrentPage: boolean) => {
    if (!isCurrentPage) {
      return readerTheme === 'dark'
        ? 'bg-white/10 text-white/80'
        : 'bg-slate-200/80 text-slate-700';
    }
    if (readerTheme === 'dark') {
      switch (accentColor) {
        case 'amber':
          return 'bg-[#dfbf83] text-stone-950 font-black shadow-xs';
        case 'emerald':
          return 'bg-teal-400 text-teal-950 font-black shadow-xs';
        case 'blue':
          return 'bg-blue-400 text-blue-950 font-black shadow-xs';
        case 'purple':
        default:
          return 'bg-brand-magenta text-white font-black shadow-xs';
      }
    }
    switch (accentColor) {
      case 'amber':
        return 'bg-gradient-to-r from-[#8e682d] to-[#c59b58] text-white font-black shadow-xs';
      case 'emerald':
        return 'bg-teal-600 text-white font-black shadow-xs';
      case 'blue':
        return 'bg-blue-600 text-white font-black shadow-xs';
      case 'purple':
      default:
        return 'bg-brand-magenta text-white font-black shadow-xs';
    }
  };

  const getHighlightsBtnActiveStyle = () => {
    switch (accentColor) {
      case 'amber':
        return 'bg-[#dfbf83]/25 border-[#dfbf83] text-[#8e682d] dark:text-[#dfbf83] shadow-[0_0_15px_rgba(223,191,131,0.35)] scale-105';
      case 'emerald':
        return 'bg-teal-500/20 border-teal-500 text-teal-600 dark:text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.35)] scale-105';
      case 'blue':
        return 'bg-blue-500/20 border-blue-500 text-blue-600 dark:text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.35)] scale-105';
      case 'purple':
      default:
        return 'bg-brand-magenta/20 border-brand-magenta text-brand-magenta shadow-[0_0_15px_rgba(149,11,196,0.35)] scale-105';
    }
  };

  const getHighlightsDropdownBorder = () => {
    if (readerTheme === 'dark') return 'border-white/10 shadow-black/80';
    if (readerTheme === 'sepia') return 'border-[#E2D6C0]';
    switch (accentColor) {
      case 'amber': return 'border-[#dfbf83]/60 shadow-amber-950/10 ring-1 ring-[#dfbf83]/30';
      case 'emerald': return 'border-teal-200 shadow-teal-950/10 ring-1 ring-teal-400/20';
      case 'blue': return 'border-blue-200 shadow-blue-950/10 ring-1 ring-blue-400/20';
      case 'purple': default: return 'border-purple-200 shadow-purple-950/10 ring-1 ring-purple-400/20';
    }
  };

  const [distractionFree, setDistractionFree] = useState(false)
  const [readingMode, setReadingMode] = useState<'paged' | 'continuous'>('paged')
  const [continuousPages, setContinuousPages] = useState<{ page: number; text: string; matn?: string; sharh?: string; footnote?: string }[]>([])
  const [loadingNext, setLoadingNext] = useState(false)
  const [hasReachedEnd, setHasReachedEnd] = useState(false)
  const [loadNextError, setLoadNextError] = useState(false)
  const [loadingPrev, setLoadingPrev] = useState(false)
  const [hasReachedStart, setHasReachedStart] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [targetHeading, setTargetHeading] = useState<string | null>(null)
  const pageSessionRef = useRef(0)
  const isJumpingRef = useRef(false)
  const [activeHeadingText, setActiveHeadingText] = useState<string | null>(null)
  const [selectedTocIndex, setSelectedTocIndex] = useState<number | null>(null)

  // Mobile Pagination visibility state and rapid scrub bar
  const [isMobilePaginationVisible, setIsMobilePaginationVisible] = useState(true);
  const [scrubPage, setScrubPage] = useState<number>(currentPage);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const isSwipeGestureRef = useRef(false);
  const activeFootnoteHighlightRef = useRef<{ el: HTMLElement; classes: string[]; timer: number } | null>(null);

  // Keep pagination visible on interaction
  const showMobilePagination = useCallback(() => {
    setIsMobilePaginationVisible(true);
  }, []);

  // Tap-to-toggle handler: toggles pagination & audio bar visibility on clean screen tap
  const handleReaderAreaClick = useCallback((e: React.MouseEvent) => {
    // If a horizontal swipe page flip gesture just occurred, don't toggle
    if (isSwipeGestureRef.current) {
      isSwipeGestureRef.current = false;
      return;
    }

    // If user is selecting text (for highlight / copy / dictionary), don't toggle
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) return;

    // If clicked an interactive element (button, link, footnote, input, popup, etc.), don't toggle
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea, [role="button"], .footnote-pill, .interactive, .popover, .dialog, [data-interactive="true"]')) {
      return;
    }

    // Toggle pagination & audio frame visibility on tap
    setIsMobilePaginationVisible(prev => !prev);
  }, []);

  useEffect(() => {
    if (!isScrubbing) {
      setScrubPage(currentPage);
    }
  }, [currentPage, isScrubbing]);

  // -------------------------------------------------------------------------
  // Feature 2: Hadiths & Numbered Texts Mapping
  // -------------------------------------------------------------------------
  const [hadithsMap, setHadithsMap] = useState<Record<string, number>>({})
  const [hadithSearchInput, setHadithSearchInput] = useState('')

  // -------------------------------------------------------------------------
  // Feature 3: Printed Page Mapping, Volumes & Bounds
  // -------------------------------------------------------------------------
  const [pageMap, setPageMap] = useState<(string | null)[]>([])
  const [volumeBounds, setVolumeBounds] = useState<Record<string, [number, number]>>({})
  const [printPgToPg, setPrintPgToPg] = useState<Record<string, number>>({})
  const [volumesList, setVolumesList] = useState<string[]>([])
  const [printVolInput, setPrintVolInput] = useState('')
  const [printPageInput, setPrintPageInput] = useState('')
  const [isVolumePickerOpen, setIsVolumePickerOpen] = useState(false)
  const volumePickerRef = useRef<HTMLDivElement>(null)

  // -------------------------------------------------------------------------
  // Feature 4: Full-Text In-Book Search
  // -------------------------------------------------------------------------
  const [bookSearchQuery, setBookSearchQuery] = useState('')
  const [bookSearchMode, setBookSearchMode] = useState<'flexible' | 'exact'>('flexible')
  const [bookSearchResults, setBookSearchResults] = useState<TurathSearchHit[]>([])
  const [isSearchingBook, setIsSearchingBook] = useState(false)
  const [hasSearchedBook, setHasSearchedBook] = useState(false)
  const [highlightedKeyword, setHighlightedKeyword] = useState<string | null>(null)
  const [expandedHitIndices, setExpandedHitIndices] = useState<Set<number>>(new Set())
  const [copiedHitIndex, setCopiedHitIndex] = useState<number | null>(null)
  const [bookSearchHighlightTerms, setBookSearchHighlightTerms] = useState<string[]>([])
  const shouldScrollToSearchHitRef = useRef<boolean>(false)

  const toggleExpandHit = (index: number) => {
    setExpandedHitIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleCopyHitText = (text: string, index: number) => {
    const clean = cleanTurathSnippet(text, false);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(clean);
      setCopiedHitIndex(index);
      setTimeout(() => setCopiedHitIndex(null), 1800);
    }
  };

  // -------------------------------------------------------------------------
  // Feature 5: Multi-Volume PDF Mapping
  // -------------------------------------------------------------------------
  const [pdfBase, setPdfBase] = useState<string | null>(null)
  const [pdfsMap, setPdfsMap] = useState<Record<string, string>>({})
  const [pdfLinks, setPdfLinks] = useState<{ root?: string; files?: string[] } | null>(book.pdf_links || null)
  const [showPdfModal, setShowPdfModal] = useState(false)

  // -------------------------------------------------------------------------
  // Feature 6: Offline Book Storage
  // -------------------------------------------------------------------------
  const [isSavedOffline, setIsSavedOffline] = useState(false)
  const [isSavingOffline, setIsSavingOffline] = useState(false)
  const [offlineSaveProgress, setOfflineSaveProgress] = useState(0)

  // Unified Download / Export Dropdown Menu State
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false)
  const downloadMenuRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgressText, setExportProgressText] = useState('')
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null)
  const [isMobileDownloadExpanded, setIsMobileDownloadExpanded] = useState(false)
  const [isMobileFontExpanded, setIsMobileFontExpanded] = useState(false)

  // In-Page Quick Search State (بحث فوري في الصفحة المفتوحة)
  const [isPageSearchOpen, setIsPageSearchOpen] = useState(false)
  const [pageSearchQuery, setPageSearchQuery] = useState('')
  const [pageMatchesCount, setPageMatchesCount] = useState(0)
  const [activeMatchIndex, setActiveMatchIndex] = useState(0)
  const pageSearchContainerRef = useRef<HTMLDivElement>(null)
  const pageSearchInputRef = useRef<HTMLInputElement>(null)
  const pageMatchElementsRef = useRef<HTMLElement[]>([])

  // -------------------------------------------------------------------------
  // Feature: Persistent Book Highlights (التظليلات والنصوص الملونة)
  // -------------------------------------------------------------------------
  const [highlights, setHighlights] = useState<BookHighlight[]>([])
  const [showHighlightsMenu, setShowHighlightsMenu] = useState(false)
  const highlightsMenuRef = useRef<HTMLDivElement>(null)

  // Load highlights for current book from localStorage
  useEffect(() => {
    if (!book) return;
    try {
      const key = `turath_highlights_${book.id || book.title}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        setHighlights(JSON.parse(saved));
      } else {
        setHighlights([]);
      }
    } catch (e) {
      console.error("Failed to load highlights from localStorage", e);
    }
  }, [book.id, book.title]);

  // Listen to highlight creation & deletion events from TextSelectionToolbar
  useEffect(() => {
    const handleHighlightCreated = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { text, color, page, id } = customEvent.detail || {};
      if (!text || !text.trim()) return;
      const targetPage = page || currentPage;
      const highlightId = id || `hl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const newHighlight: BookHighlight = {
        id: highlightId,
        bookId: book.id,
        page: targetPage,
        text: text.trim(),
        color: color || '#ffdc50',
        createdAt: Date.now()
      };

      // 1. Immediately apply to the DOM with zero delay!
      if (scrollContainerRef.current) {
        applyUserHighlightToElement(scrollContainerRef.current, newHighlight);
      }

      // 2. Persist in state and localStorage
      setHighlights(prev => {
        const exists = prev.some(h => h.id === newHighlight.id || (h.page === targetPage && h.text.trim() === text.trim() && h.color === color));
        if (exists) return prev;
        const updated = [newHighlight, ...prev];
        try {
          localStorage.setItem(`turath_highlights_${book.id || book.title}`, JSON.stringify(updated));
        } catch (err) { }
        return updated;
      });
    };

    const handleHighlightRemoved = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { text } = customEvent.detail || {};
      if (!text || !text.trim()) return;
      setHighlights(prev => {
        const updated = prev.filter(h => h.text.trim() !== text.trim());
        try {
          localStorage.setItem(`turath_highlights_${book.id || book.title}`, JSON.stringify(updated));
        } catch (err) { }
        return updated;
      });
    };

    window.addEventListener('textHighlightCreated', handleHighlightCreated);
    window.addEventListener('textHighlightRemoved', handleHighlightRemoved);

    return () => {
      window.removeEventListener('textHighlightCreated', handleHighlightCreated);
      window.removeEventListener('textHighlightRemoved', handleHighlightRemoved);
    };
  }, [book.id, book.title, currentPage]);

  // Dynamically re-apply saved highlights for active pages immediately
  useEffect(() => {
    if (!scrollContainerRef.current || loadingPage) return;

    const activePageNumbers = readingMode === 'continuous'
      ? continuousPages.map(p => p.page)
      : [currentPage];

    const relevantHighlights = highlights.filter(h => activePageNumbers.includes(h.page));
    if (relevantHighlights.length === 0) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    // 1. Immediate pass (zero delay)
    relevantHighlights.forEach(hl => {
      applyUserHighlightToElement(container, hl);
    });

    // 2. Secondary micro-pass to catch any late DOM paint/reflow
    const timer = setTimeout(() => {
      if (scrollContainerRef.current) {
        relevantHighlights.forEach(hl => {
          applyUserHighlightToElement(scrollContainerRef.current!, hl);
        });
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [currentPage, pageText, continuousPages, readingMode, highlights, loadingPage]);

  // Global double-click on page text to remove a highlight
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleDblClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const mark = target?.closest('mark[data-user-highlight="true"]') as HTMLElement | null;
      if (mark) {
        e.stopPropagation();
        const hlId = mark.getAttribute('data-highlight-id');
        if (hlId) {
          removeHighlightFromDOM(container, hlId);
          setHighlights(prev => {
            const updated = prev.filter(h => h.id !== hlId);
            try {
              localStorage.setItem(`turath_highlights_${book.id || book.title}`, JSON.stringify(updated));
            } catch (err) {}
            return updated;
          });
        }
      }
    };

    container.addEventListener('dblclick', handleDblClick);
    return () => container.removeEventListener('dblclick', handleDblClick);
  }, [book.id, book.title]);

  const handleDeleteHighlight = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (scrollContainerRef.current) {
      removeHighlightFromDOM(scrollContainerRef.current, id);
    }
    setHighlights(prev => {
      const updated = prev.filter(h => h.id !== id);
      try {
        localStorage.setItem(`turath_highlights_${book.id || book.title}`, JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });
  };

  const handleClearAllHighlights = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('هل أنت متأكد من رغبتك في حذف جميع التظليلات لهذا الكتاب؟')) {
      if (scrollContainerRef.current) {
        const marks = scrollContainerRef.current.querySelectorAll('mark[data-user-highlight="true"]');
        marks.forEach(mark => {
          const parent = mark.parentNode;
          if (parent) {
            parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
            parent.normalize();
          }
        });
      }
      setHighlights([]);
      try {
        localStorage.removeItem(`turath_highlights_${book.id || book.title}`);
      } catch (err) {}
    }
  };

  const handleJumpToHighlight = (h: BookHighlight) => {
    setShowHighlightsMenu(false);
    if (h.page !== currentPage) {
      setCurrentPage(h.page);
    }
    setTimeout(() => {
      if (!scrollContainerRef.current) return;
      const targetMark = scrollContainerRef.current.querySelector(`mark[data-highlight-id="${h.id}"]`);
      if (targetMark) {
        targetMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetMark.classList.add('ring-4', 'ring-amber-400', 'ring-offset-2');
        setTimeout(() => targetMark.classList.remove('ring-4', 'ring-amber-400', 'ring-offset-2'), 2500);
        return;
      }
      const marks = scrollContainerRef.current.querySelectorAll('mark[data-user-highlight="true"]');
      for (const m of Array.from(marks)) {
        if (m.textContent?.trim().includes(h.text.slice(0, 30)) || h.text.trim().includes(m.textContent?.trim() || '___')) {
          m.scrollIntoView({ behavior: 'smooth', block: 'center' });
          m.classList.add('ring-4', 'ring-amber-400', 'ring-offset-2');
          setTimeout(() => m.classList.remove('ring-4', 'ring-amber-400', 'ring-offset-2'), 2500);
          return;
        }
      }
    }, 350);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) {
        setIsDownloadMenuOpen(false);
      }
      if (highlightsMenuRef.current && !highlightsMenuRef.current.contains(e.target as Node)) {
        setShowHighlightsMenu(false);
      }
    };
    if (isDownloadMenuOpen || showHighlightsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDownloadMenuOpen, showHighlightsMenu]);

  // Focus input and select text when in-page search opens
  useEffect(() => {
    if (isPageSearchOpen) {
      setTimeout(() => {
        pageSearchInputRef.current?.focus();
        pageSearchInputRef.current?.select();
      }, 60);
    } else {
      if (scrollContainerRef.current) {
        clearPageHighlights(scrollContainerRef.current);
      }
      setPageMatchesCount(0);
      setActiveMatchIndex(0);
      pageMatchElementsRef.current = [];
    }
  }, [isPageSearchOpen]);

  // Keyboard shortcut Ctrl+F / Cmd+F to open in-page search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsPageSearchOpen(true);
        setTimeout(() => {
          pageSearchInputRef.current?.focus();
          pageSearchInputRef.current?.select();
        }, 60);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // In-Page Search match navigation
  const handleNextPageMatch = useCallback(() => {
    const elements = pageMatchElementsRef.current;
    if (!elements || elements.length === 0) return;
    const nextIdx = (activeMatchIndex + 1) % elements.length;
    setActiveMatchIndex(nextIdx);
    elements.forEach((el, idx) => {
      if (idx === nextIdx) {
        el.classList.add('page-search-active-match');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        el.classList.remove('page-search-active-match');
      }
    });
  }, [activeMatchIndex]);

  const handlePrevPageMatch = useCallback(() => {
    const elements = pageMatchElementsRef.current;
    if (!elements || elements.length === 0) return;
    const prevIdx = (activeMatchIndex - 1 + elements.length) % elements.length;
    setActiveMatchIndex(prevIdx);
    elements.forEach((el, idx) => {
      if (idx === prevIdx) {
        el.classList.add('page-search-active-match');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        el.classList.remove('page-search-active-match');
      }
    });
  }, [activeMatchIndex]);

  // Execute in-page search and highlight matches dynamically (only in the current active page)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (!isPageSearchOpen || !pageSearchQuery.trim()) {
      clearPageHighlights(container);
      setPageMatchesCount(0);
      setActiveMatchIndex(0);
      pageMatchElementsRef.current = [];
      return;
    }

    const regex = buildArabicRegex(pageSearchQuery);
    if (!regex) {
      clearPageHighlights(container);
      setPageMatchesCount(0);
      setActiveMatchIndex(0);
      pageMatchElementsRef.current = [];
      return;
    }

    const timer = setTimeout(() => {
      if (!scrollContainerRef.current) return;
      // In continuous mode, search ONLY in the current active page element
      const targetElement = readingMode === 'continuous'
        ? (scrollContainerRef.current.querySelector(`[data-page="${currentPage}"]`) as HTMLElement || scrollContainerRef.current)
        : scrollContainerRef.current;

      clearPageHighlights(scrollContainerRef.current);
      const matched = applyPageHighlights(targetElement, regex);
      pageMatchElementsRef.current = matched;
      setPageMatchesCount(matched.length);
      setActiveMatchIndex(0);

      if (matched.length > 0) {
        matched.forEach((el, idx) => {
          if (idx === 0) {
            el.classList.add('page-search-active-match');
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            el.classList.remove('page-search-active-match');
          }
        });
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [pageSearchQuery, isPageSearchOpen, currentPage, pageText, continuousPages, readingMode]);

  // Execute book-level search result highlighting on reading page
  useEffect(() => {
    if (loadingPage) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    if (!bookSearchHighlightTerms || bookSearchHighlightTerms.length === 0) {
      clearBookSearchHighlights(container);
      return;
    }

    const regex = buildArabicRegexFromTerms(bookSearchHighlightTerms);
    if (!regex) {
      clearBookSearchHighlights(container);
      return;
    }

    const timer = setTimeout(() => {
      if (!scrollContainerRef.current) return;
      const matched = applyBookSearchHighlights(scrollContainerRef.current, regex, false);
      if (matched.length > 0 && shouldScrollToSearchHitRef.current) {
        shouldScrollToSearchHitRef.current = false;
        matched[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 80);

    return () => clearTimeout(timer);
  }, [bookSearchHighlightTerms, currentPage, pageText, loadingPage]);


  // In-memory page cache per book session (0ms instant page loads)
  const pageCacheRef = useRef<Map<number, ProcessedContent>>(new Map())

  // Reset page cache when opening a different book
  useEffect(() => {
    pageCacheRef.current.clear()
  }, [book.id])

  // High-performance single page fetcher with in-memory caching and fallback
  const fetchPageData = useCallback(async (pageNum: number): Promise<ProcessedContent | null> => {
    // 1. In-memory cache hit (0ms instant)
    if (pageCacheRef.current.has(pageNum)) {
      return pageCacheRef.current.get(pageNum)!;
    }

    const bookNumId = Number(book.id);

    // 1.5. Offline IndexedDB storage check (works 100% without internet)
    try {
      const offlinePkg = await idbGetOfflineBook(book.id);
      if (offlinePkg && offlinePkg.cachedPages && offlinePkg.cachedPages[pageNum]) {
        const cached = offlinePkg.cachedPages[pageNum];
        const processed = processTextContent(cached.text || cached.main || '');
        pageCacheRef.current.set(pageNum, processed);
        return processed;
      }
    } catch (e) { }

    // 2. Fetch single page via fast lightweight Turath API (Vite proxy / Turath proxy)
    try {
      const turathRes = await fetchTurathPage(bookNumId, pageNum);
      if (turathRes && typeof turathRes.text === 'string') {
        const processed = processTextContent(turathRes.text);
        pageCacheRef.current.set(pageNum, processed);
        return processed;
      }
    } catch (err) {
      console.warn('Fast Turath page fetch failed, falling back:', err);
    }

    // 3. Fallback to HF Space preview endpoint
    try {
      const baseUrl = import.meta.env.VITE_DATA_INGESTION_URL || 'https://abourida-zad-tutor-engine-space.hf.space';
      const res = await fetch(`${baseUrl}/api/v1/data-ingestion/turath-page-preview/${book.id}/${pageNum}`);
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.text === 'string') {
          const processed = processTextContent(data.text);
          pageCacheRef.current.set(pageNum, processed);
          return processed;
        }
      }
    } catch (err) {
      console.error('Fallback preview page fetch failed:', err);
    }

    return null;
  }, [book.id]);

  const handleSetReadingMode = (mode: 'paged' | 'continuous') => {
    if (mode === readingMode) return;

    isJumpingRef.current = true;
    setReadingMode(mode);

    if (mode === 'continuous') {
      if (pageText) {
        setContinuousPages([{
          page: currentPage,
          text: pageText.main,
          matn: pageText.matn,
          sharh: pageText.sharh,
          footnote: pageText.footnote
        }]);
      }
      setHasReachedStart(currentPage <= 1);
      setHasReachedEnd(false);
      setLoadNextError(false);

      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0 });
      }
    }

    setTimeout(() => {
      isJumpingRef.current = false;
    }, 600);
  };

  // Track active heading and active page dynamically based on scroll position
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;

    let syncRaf: number | null = null;
    const handleScrollSync = () => {
      if (isJumpingRef.current) return;
      if (syncRaf) return;

      syncRaf = window.requestAnimationFrame(() => {
        syncRaf = null;
        if (!container) return;

        // 1. Detect active page based on scroll position in continuous mode
        if (readingMode === 'continuous') {
          const pageElements = container.querySelectorAll('[data-page]');
          if (pageElements.length > 0) {
            const containerRect = container.getBoundingClientRect();
            let bestPage: number | null = null;
            let minDelta = Infinity;

            pageElements.forEach(el => {
              const rect = el.getBoundingClientRect();
              const delta = Math.abs(rect.top - containerRect.top - 100);
              if (rect.bottom > containerRect.top + 60 && rect.top < containerRect.bottom - 60) {
                if (delta < minDelta) {
                  minDelta = delta;
                  bestPage = Number(el.getAttribute('data-page'));
                }
              }
            });

            if (bestPage !== null && bestPage > 0) {
              setCurrentPage(prev => (prev !== bestPage ? bestPage! : prev));
            }
          }
        }

        // 2. Detect active heading text based on visible headings
        const headings = container.querySelectorAll('h1, h2, h3, h4, span[data-type="title"]');
        if (headings.length > 0) {
          const containerRect = container.getBoundingClientRect();
          let currentHeading: string | null = null;
          let minHeadingDist = Infinity;

          headings.forEach(h => {
            const rect = h.getBoundingClientRect();
            const distFromTop = rect.top - containerRect.top;
            if (distFromTop <= containerRect.height * 0.5 && rect.bottom >= containerRect.top - 50) {
              const distAbs = Math.abs(distFromTop - 80);
              if (distAbs < minHeadingDist) {
                minHeadingDist = distAbs;
                currentHeading = h.textContent?.trim() || null;
              }
            }
          });

          if (currentHeading) {
            setActiveHeadingText(prev => (prev !== currentHeading ? currentHeading : prev));
          }
        }
      });
    };

    container.addEventListener('scroll', handleScrollSync, { passive: true });

    return () => {
      if (syncRaf) window.cancelAnimationFrame(syncRaf);
      container.removeEventListener('scroll', handleScrollSync);
    };
  }, [readingMode]);

  const [showSettings, setShowSettings] = useState(false)
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [sidebarTab, setSidebarTab] = useState<'toc' | 'chat' | 'search' | 'hadiths' | 'highlights' | 'none'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'none';
    }
    return 'toc';
  })

  // Auto-close in-page search when switching to other sidebar tabs (Assistant, TOC, Search, etc.)
  useEffect(() => {
    if (sidebarTab !== 'none') {
      setIsPageSearchOpen(false);
    }
  }, [sidebarTab]);

  const [chatHistory, setChatHistory] = useState<Message[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [sidebarWidth, setSidebarWidth] = useState(360)
  const [isResizing, setIsResizing] = useState(false)

  // Page Actions State
  const [bookmarks, setBookmarks] = useState<number[]>([])
  const [isReadingPage, setIsReadingPage] = useState(false)
  const [isAudioBarOpen, setIsAudioBarOpen] = useState(false)
  const [pageCopied, setPageCopied] = useState(false)
  const [isPageActionsOpen, setIsPageActionsOpen] = useState(false)
  const pageActionsRef = useRef<HTMLDivElement>(null)
  const [activeContinuousMenuPage, setActiveContinuousMenuPage] = useState<number | null>(null)
  const [copiedContinuousPage, setCopiedContinuousPage] = useState<number | null>(null)

  // Touch Swipe Gesture Refs & Handlers (تقليب الصفحات باللمس)
  const touchStartXRef = useRef<number | null>(null)
  const touchStartYRef = useRef<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    isSwipeGestureRef.current = false;
    if (readingMode !== 'paged') return;
    if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (readingMode !== 'paged' || touchStartXRef.current === null || touchStartYRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartXRef.current;
    const deltaY = touchEndY - touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;

    // Minimum swipe threshold and mostly horizontal movement
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      isSwipeGestureRef.current = true;
      const sel = window.getSelection()?.toString();
      if (sel && sel.trim().length > 0) return;

      if (deltaX > 0) {
        // Swiping right in RTL Arabic = Previous Page
        goPrev();
      } else {
        // Swiping left in RTL Arabic = Next Page
        goNext();
      }
    }
  }

  // Customization State
  const [darkFrameOpacity, setDarkFrameOpacity] = useState(60)

  const toggleBookmark = () => {
    setBookmarks(prev =>
      prev.includes(currentPage) ? prev.filter(p => p !== currentPage) : [...prev, currentPage]
    )
  }

  const handleCopyPage = () => {
    if (pageText) {
      const fullText = formatPageCopyText(
        pageText.matn || pageText.main,
        pageText.sharh,
        pageText.footnote,
        book.title,
        book.author,
        currentPage
      );

      navigator.clipboard.writeText(fullText);
      setPageCopied(true);
      setTimeout(() => setPageCopied(false), 2000);
    }
  }

  // Stop reading if page changes or unmounts
  useEffect(() => {
    return () => {
      stopAllSpeech()
      setIsReadingPage(false)
    }
  }, [currentPage])

  const startResizing = React.useCallback((e: React.MouseEvent) => {
    setIsResizing(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none' // Prevent text selection
    e.preventDefault()
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const railWidth = window.innerWidth >= 768 ? 80 : 64 // md:w-20 or w-16
      const newWidth = document.body.clientWidth - e.clientX - railWidth
      if (newWidth > 280 && newWidth < 800) {
        setSidebarWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false)
        document.body.style.cursor = 'default'
        document.body.style.userSelect = 'auto'
      }
    }

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])


  const settingsRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const mobileSettingsSheetRef = useRef<HTMLDivElement | null>(null)
  const readerAreaRef = useRef<HTMLDivElement>(null)

  const toggleExpand = (idx: number) => {
    const newSet = new Set(expandedNodes);
    if (newSet.has(idx)) newSet.delete(idx);
    else newSet.add(idx);
    setExpandedNodes(newSet);
  }

  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  // Close settings and mobile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (settingsRef.current && !settingsRef.current.contains(target)) {
        setShowSettings(false)
      }
      const clickedInMobileSheet = mobileSettingsSheetRef.current?.contains(target) ?? false;
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target) && !clickedInMobileSheet) {
        setIsMobileMenuOpen(false)
      }
      if (pageActionsRef.current && !pageActionsRef.current.contains(target)) {
        setIsPageActionsOpen(false)
      }
      if (volumePickerRef.current && !volumePickerRef.current.contains(target)) {
        setIsVolumePickerOpen(false)
      }
      const clickedInContinuousActions = (target as Element)?.closest?.('.continuous-page-actions');
      if (!clickedInContinuousActions) {
        setActiveContinuousMenuPage(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [settingsRef, mobileMenuRef, pageActionsRef, volumePickerRef]);

  const handleAskExplain = async (textToExplain: string) => {
    window.getSelection()?.removeAllRanges();
    setSidebarTab('chat');
    setChatLoading(true);

    const newUserMsg: Message = { id: Date.now().toString(), role: 'user' as const, text: `اشرح لي هذا النص:\n"${textToExplain}"` };
    const newHistory = [...chatHistory, newUserMsg];
    setChatHistory(newHistory);

    const activeChapter = activeHierarchy.length > 0 ? activeHierarchy.join(" • ") : "بدون عنوان";

    try {
      const baseUrl = import.meta.env.VITE_READING_ASSISTANT_URL || 'https://abourida-zad-tutor-engine-space.hf.space';
      const res = await fetch(`${baseUrl}/api/v1/reading-assistant/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_title: book.title,
          author: book.author,
          chapter: activeChapter,
          selected_text: textToExplain,
          page_context: pageText?.main || "",
          history: chatHistory.map(msg => ({ role: msg.role === 'assistant' ? 'model' : 'user', content: msg.text }))
        })
      });
      if (!res.ok) throw new Error("فشل الاتصال بالخادم");
      const data = await res.json();
      setChatHistory([...newHistory, { id: Date.now().toString(), role: 'assistant', text: data.explanation }]);
    } catch (err: any) {
      setChatHistory([...newHistory, { id: Date.now().toString(), role: 'assistant', text: 'عذراً، حدث خطأ أثناء محاولة شرح النص. يرجى المحاولة مرة أخرى.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const msg = chatInput.trim();
    setChatInput("");
    setChatLoading(true);

    const newUserMsg: Message = { id: Date.now().toString(), role: 'user' as const, text: msg };
    const newHistory = [...chatHistory, newUserMsg];
    setChatHistory(newHistory);

    const activeChapter = activeHierarchy.length > 0 ? activeHierarchy.join(" • ") : "بدون عنوان";

    try {
      const baseUrl = import.meta.env.VITE_READING_ASSISTANT_URL || 'https://abourida-zad-tutor-engine-space.hf.space';
      const res = await fetch(`${baseUrl}/api/v1/reading-assistant/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_title: book.title,
          author: book.author,
          chapter: activeChapter,
          user_message: msg,
          page_context: pageText?.main || "",
          history: chatHistory.map(msg => ({ role: msg.role === 'assistant' ? 'model' : 'user', content: msg.text }))
        })
      });
      if (!res.ok) throw new Error("فشل الاتصال بالخادم");
      const data = await res.json();
      setChatHistory([...newHistory, { id: Date.now().toString(), role: 'assistant', text: data.explanation }]);
    } catch (err: any) {
      setChatHistory([...newHistory, { id: Date.now().toString(), role: 'assistant', text: 'عذراً، حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Set initial theme based on app theme
  useEffect(() => {
    if (theme === 'dark') {
      setReaderTheme('dark')
    }
  }, [theme])

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const p = parseInt(pageInput)
    if (!isNaN(p) && p > 0) {
      setSelectedTocIndex(null)
      setActiveHeadingText(null)
      setCurrentPage(p)
    } else {
      setPageInput(currentPage.toString())
    }
  }

  // -------------------------------------------------------------------------
  // Feature 3: Printed Page & Volume Mapping Helper
  // -------------------------------------------------------------------------
  const currentPrintCitation = useMemo(() => {
    if (pageMap && pageMap.length >= currentPage && pageMap[currentPage - 1]) {
      const entry = pageMap[currentPage - 1];
      if (entry) {
        const parts = entry.split(',');
        if (parts.length >= 2) {
          return { vol: parts[0], page: parts[1] };
        }
      }
    }
    return null;
  }, [pageMap, currentPage]);

  const getPagePrintCitation = useCallback((digitalPage: number) => {
    if (pageMap && pageMap.length >= digitalPage && digitalPage > 0 && pageMap[digitalPage - 1]) {
      const entry = pageMap[digitalPage - 1];
      if (entry) {
        const parts = entry.split(',');
        if (parts.length >= 2) {
          return { vol: parts[0].trim(), page: parts[1].trim() };
        }
      }
    }
    return null;
  }, [pageMap]);

  useEffect(() => {
    if (currentPrintCitation) {
      setPrintVolInput(currentPrintCitation.vol || '1');
      setPrintPageInput(currentPrintCitation.page);
    } else {
      setPrintVolInput('1');
      setPrintPageInput(currentPage.toString());
    }
  }, [currentPage, currentPrintCitation]);

  const normalizeArabicDigits = (str: string): string => {
    return str
      .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
      .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
      .trim();
  };

  const availableVolumes = useMemo(() => {
    let list: string[] = [];
    if (volumesList && volumesList.length > 0) list = volumesList;
    else if (volumeBounds && Object.keys(volumeBounds).length > 0) {
      list = Object.keys(volumeBounds);
    } else if (pageMap && pageMap.length > 0) {
      const vols = new Set<string>();
      pageMap.forEach(p => {
        if (p) {
          const parts = p.split(',');
          if (parts.length > 1 && parts[0]) vols.add(parts[0]);
        }
      });
      list = Array.from(vols);
    }

    if (list.length === 0) {
      const cur = (currentPrintCitation?.vol || printVolInput || '1').trim();
      list = [cur || '1'];
    }

    return list.sort((a, b) => {
      const na = parseInt(a, 10);
      const nb = parseInt(b, 10);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.localeCompare(b, 'ar');
    });
  }, [volumesList, volumeBounds, pageMap, currentPrintCitation?.vol, printVolInput]);

  const currentVolumeInfo = useMemo(() => {
    if (!pageMap || pageMap.length === 0 || availableVolumes.length <= 1) {
      return null;
    }

    const curVol = (currentPrintCitation?.vol || printVolInput || '1').trim();

    let startIdx = -1;
    let endIdx = -1;

    for (let i = 0; i < pageMap.length; i++) {
      const entry = pageMap[i];
      if (entry) {
        const v = entry.split(',')[0].trim();
        if (v === curVol) {
          if (startIdx === -1) startIdx = i;
          endIdx = i;
        }
      }
    }

    if (startIdx === -1) {
      return null;
    }

    const startDigitalPage = startIdx + 1;
    const endDigitalPage = endIdx + 1;
    const totalPages = endDigitalPage - startDigitalPage + 1;

    let startPrintPage: number | undefined;
    let endPrintPage: number | undefined;

    if (pageMap[startIdx]) {
      const p = pageMap[startIdx]!.split(',')[1];
      if (p) startPrintPage = parseInt(p, 10);
    }
    if (pageMap[endIdx]) {
      const p = pageMap[endIdx]!.split(',')[1];
      if (p) endPrintPage = parseInt(p, 10);
    }

    return {
      vol: curVol,
      startDigitalPage,
      endDigitalPage,
      totalPages,
      startPrintPage,
      endPrintPage
    };
  }, [pageMap, availableVolumes, currentPrintCitation?.vol, printVolInput]);

  const getHeadingVolume = useCallback((digitalPage: number): string => {
    if (pageMap && pageMap.length >= digitalPage && digitalPage > 0 && pageMap[digitalPage - 1]) {
      const entry = pageMap[digitalPage - 1];
      if (entry) {
        const parts = entry.split(',');
        if (parts.length > 0 && parts[0].trim()) {
          return parts[0].trim();
        }
      }
    }
    if (volumeBounds && Object.keys(volumeBounds).length > 0) {
      for (const [v, bounds] of Object.entries(volumeBounds)) {
        if (digitalPage >= bounds[0] && digitalPage <= bounds[1]) {
          return v;
        }
      }
    }
    return availableVolumes[0] || '1';
  }, [pageMap, volumeBounds, availableVolumes]);

  const deferredTocSearch = useDeferredValue(tocSearch);
  const [visibleTocLimit, setVisibleTocLimit] = useState(80);

  // Pre-normalize headings once per book TOC for lightning fast O(1) search
  const normalizedToc = useMemo(() => {
    return toc.map((h, i) => ({
      ...h,
      originalIndex: i,
      normalizedTitle: normalizeArabicForSearch(h.title)
    }));
  }, [toc]);

  // Reset pagination limit when search query changes
  useEffect(() => {
    setVisibleTocLimit(80);
  }, [tocSearch]);

  const filteredToc = useMemo(() => {
    const q = normalizeArabicForSearch(deferredTocSearch);
    if (!q) return [];
    return normalizedToc.filter(h => h.normalizedTitle.includes(q));
  }, [normalizedToc, deferredTocSearch]);

  const activeReadingVolume = useMemo(() => {
    return (currentPrintCitation?.vol || printVolInput || getHeadingVolume(currentPage) || '1').trim();
  }, [currentPrintCitation?.vol, printVolInput, currentPage, getHeadingVolume]);

  const [selectedVolumeForToc, setSelectedVolumeForToc] = useState<string | null>(null);
  const [hasUserNavigatedToAllVolumes, setHasUserNavigatedToAllVolumes] = useState(false);

  // Default to the volume currently being read
  useEffect(() => {
    if (!hasUserNavigatedToAllVolumes && availableVolumes.length > 1) {
      setSelectedVolumeForToc(activeReadingVolume);
    }
  }, [activeReadingVolume, availableVolumes.length, hasUserNavigatedToAllVolumes]);

  const volumeNodes: TreeNode[] = useMemo(() => {
    if (availableVolumes.length <= 1 || !pageMap || pageMap.length === 0) {
      return [];
    }

    const indexedToc = toc.map((h, i) => ({ ...h, originalIndex: i }));
    const volumeHeadingsMap = new Map<string, typeof indexedToc>();
    availableVolumes.forEach(vol => {
      volumeHeadingsMap.set(vol, []);
    });

    indexedToc.forEach(h => {
      const vol = getHeadingVolume(h.page);
      if (!volumeHeadingsMap.has(vol)) {
        volumeHeadingsMap.set(vol, []);
      }
      volumeHeadingsMap.get(vol)!.push(h);
    });

    return availableVolumes.map((vol, volIdx) => {
      const headingsInVol = volumeHeadingsMap.get(vol) || [];

      // Determine accurate digital start page from pageMap
      let volDigitalStartPage = 1;
      let volPrintStartPage: string | null = null;

      if (pageMap && pageMap.length > 0) {
        const firstIdx = pageMap.findIndex(p => p && p.split(',')[0].trim() === vol);
        if (firstIdx !== -1) {
          volDigitalStartPage = firstIdx + 1;
          const parts = pageMap[firstIdx]!.split(',');
          if (parts.length > 1 && parts[1]) {
            volPrintStartPage = parts[1].trim();
          }
        }
      }

      if (volDigitalStartPage === 1 && headingsInVol.length > 0) {
        volDigitalStartPage = headingsInVol[0].page;
      }

      const children = buildTree(headingsInVol);

      return {
        id: -1000 - volIdx,
        originalIndex: -1000 - volIdx,
        title: formatVolumeTitle(vol),
        level: 0,
        page: volDigitalStartPage,
        children,
        isVolumeFolder: true,
        volName: vol,
        totalChapters: headingsInVol.length,
        printStartPage: volPrintStartPage
      };
    });
  }, [toc, availableVolumes, pageMap, getHeadingVolume]);

  const tocTree = useMemo(() => {
    if (availableVolumes.length <= 1 || !pageMap || pageMap.length === 0) {
      return buildTree(toc);
    }

    if (selectedVolumeForToc) {
      const targetVol = volumeNodes.find(v => v.volName === selectedVolumeForToc);
      if (targetVol) return targetVol.children;
    }

    return buildTree(toc);
  }, [availableVolumes.length, pageMap, toc, selectedVolumeForToc, volumeNodes]);

  const currentSelectedVolNode = useMemo(() => {
    if (!selectedVolumeForToc) return null;
    return volumeNodes.find(v => v.volName === selectedVolumeForToc) || null;
  }, [selectedVolumeForToc, volumeNodes]);

  const activeTocIndex = useMemo(() => {
    if (toc.length === 0) return -1;

    // 1. Explicit TOC click priority while jumping
    if (isJumpingRef.current && selectedTocIndex !== null && selectedTocIndex >= 0 && selectedTocIndex < toc.length) {
      return selectedTocIndex;
    }

    // 2. Strict Local Match: Match activeHeadingText strictly within +/- 2 pages around currentPage
    if (activeHeadingText) {
      const trimmedActive = activeHeadingText.trim();
      const nearbyIdx = toc.findIndex(h =>
        Math.abs(h.page - currentPage) <= 2 &&
        (h.title.trim() === trimmedActive || h.title.includes(trimmedActive) || trimmedActive.includes(h.title.trim()))
      );
      if (nearbyIdx >= 0) return nearbyIdx;
    }

    // 3. Priority: If selectedTocIndex page matches currentPage
    if (selectedTocIndex !== null && selectedTocIndex >= 0 && selectedTocIndex < toc.length) {
      if (toc[selectedTocIndex].page === currentPage) {
        return selectedTocIndex;
      }
    }

    // 4. Deterministic Fallback: Closest heading on or before currentPage
    let activeIndex = 0;
    for (let i = 0; i < toc.length; i++) {
      if (toc[i].page <= currentPage) {
        activeIndex = i;
      } else {
        break;
      }
    }
    return activeIndex;
  }, [toc, currentPage, selectedTocIndex, activeHeadingText]);

  const activeAncestorIndices = useMemo(() => {
    const ancestorSet = new Set<number>();
    if (toc.length === 0 || activeTocIndex < 0) return ancestorSet;

    let currentLevel = toc[activeTocIndex].level;
    for (let i = activeTocIndex - 1; i >= 0; i--) {
      if (toc[i].level < currentLevel) {
        ancestorSet.add(i);
        currentLevel = toc[i].level;
      }
    }
    return ancestorSet;
  }, [toc, activeTocIndex]);

  const activeHierarchy = useMemo(() => {
    if (toc.length === 0 || activeTocIndex < 0) return [];

    const hierarchy = [toc[activeTocIndex].title];
    let currentLevel = toc[activeTocIndex].level;

    for (let i = activeTocIndex - 1; i >= 0; i--) {
      if (toc[i].level < currentLevel) {
        hierarchy.unshift(toc[i].title);
        currentLevel = toc[i].level;
      }
    }

    return hierarchy;
  }, [toc, activeTocIndex]);

  // Auto-expand TOC tree folders leading to active section
  useEffect(() => {
    if (activeTocIndex < 0 || toc.length === 0) return;

    setExpandedNodes(prev => {
      const nextSet = new Set(prev);
      nextSet.add(activeTocIndex);
      activeAncestorIndices.forEach(idx => nextSet.add(idx));
      return nextSet;
    });
  }, [activeTocIndex, activeAncestorIndices, toc]);

  // Auto-scroll TOC sidebar to keep active item in viewport
  useEffect(() => {
    if (sidebarTab !== 'toc' || activeTocIndex < 0) return;
    const timeout = setTimeout(() => {
      const activeEl = document.querySelector('[data-toc-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 200);
    return () => clearTimeout(timeout);
  }, [activeTocIndex, sidebarTab]);

  const [reloadTocCounter, setReloadTocCounter] = useState(0);

  // Fetch book TOC & metadata with IndexedDB cache priority (0ms instant)
  useEffect(() => {
    let isMounted = true;
    const fetchBookInfo = async () => {
      setLoadingBook(true);
      const bookNumId = Number(book.id);

      // Check offline saved status
      idbIsBookSavedOffline(book.id).then((saved: boolean) => {
        if (isMounted) setIsSavedOffline(saved);
      }).catch(() => { });

      const applyIndexes = (dataObj: any): boolean => {
        if (!dataObj) return false;
        if (dataObj.meta) {
          if (dataObj.meta.info) {
            const match = dataObj.meta.info.match(/المؤلف:\s*([^\n]+)/);
            if (match && match[1]) setAuthorName(match[1].trim());
          }
          if (dataObj.meta.author_id) setAuthorId(dataObj.meta.author_id);
        }

        // Support various heading representations:
        // 1. dataObj.indexes.headings (standard Turath API)
        // 2. dataObj.headings (flat list or fallback API)
        // 3. dataObj.children (StudyMode hierarchical tree)
        let headingsFound: any[] = [];
        if (dataObj.indexes && Array.isArray(dataObj.indexes.headings) && dataObj.indexes.headings.length > 0) {
          headingsFound = dataObj.indexes.headings;
        } else if (Array.isArray(dataObj.headings) && dataObj.headings.length > 0) {
          headingsFound = dataObj.headings;
        } else if (Array.isArray(dataObj.children) && dataObj.children.length > 0) {
          const flatten = (list: any[], level = 1): any[] => {
            const acc: any[] = [];
            for (const item of list) {
              acc.push({
                id: item.id || acc.length + 1,
                title: item.title || item.name || '',
                level: item.level || level,
                page: item.page || 1
              });
              if (Array.isArray(item.children) && item.children.length > 0) {
                acc.push(...flatten(item.children, level + 1));
              }
            }
            return acc;
          };
          headingsFound = flatten(dataObj.children);
        }

        if (headingsFound.length > 0) {
          const mappedHeadings: Heading[] = headingsFound.map((h: any, i: number) => ({
            id: h.id ?? (i + 1),
            title: h.title,
            level: h.level ?? 1,
            page: h.page ?? 1
          }));
          setToc(mappedHeadings);
          setExpandedNodes(new Set<number>());
          if (mappedHeadings.length > 0) {
            setCurrentPage(prev => (prev <= 1 ? mappedHeadings[0].page : prev));
          }
        }

        const idx = dataObj.indexes;
        if (idx) {
          // Feature 2: Hadiths & Numbers Map
          const hMap = idx.hadiths || idx.numbers || {};
          setHadithsMap(hMap);

          // Feature 3: Printed Page & Volume Bounds
          let pToP: Record<string, number> = idx.print_pg_to_pg || {};
          if (Array.isArray(idx.page_map)) {
            setPageMap(idx.page_map);
            if (Object.keys(pToP).length === 0) {
              const derived: Record<string, number> = {};
              idx.page_map.forEach((entry: string | null, i: number) => {
                if (entry) {
                  derived[entry.trim()] = i + 1;
                }
              });
              pToP = derived;
            }
          }
          setPrintPgToPg(pToP);
          if (idx.volume_bounds) setVolumeBounds(idx.volume_bounds);
          if (Array.isArray(idx.volumes)) setVolumesList(idx.volumes);

          // Feature 5: Multi-volume PDFs
          if (idx.pdf_base) setPdfBase(idx.pdf_base);
          if (idx.pdfs) setPdfsMap(idx.pdfs);
          if (dataObj.meta?.pdf_links) {
            setPdfLinks(dataObj.meta.pdf_links);
          } else if (dataObj.pdf_links) {
            setPdfLinks(dataObj.pdf_links);
          }
        }

        return headingsFound.length > 0;
      };

      // 1. IndexedDB Cache Strategy
      // If manual reload triggered by user (reloadTocCounter > 0), bypass and purge cache!
      if (reloadTocCounter > 0) {
        try {
          await idbDeleteTurathBookTree(bookNumId);
        } catch { }
      } else {
        try {
          const cachedTree = await idbGetTurathBookTree(bookNumId);
          if (cachedTree && isMounted) {
            const hasHeadings = applyIndexes(cachedTree);
            if (hasHeadings) {
              setLoadingBook(false);
              return;
            } else {
              // Stale or corrupted cache without headings, purge it!
              await idbDeleteTurathBookTree(bookNumId);
            }
          }
        } catch (e) {
          console.warn('IndexedDB read error for book TOC:', e);
        }
      }

      // 2. Fetch using high-speed Turath Book Indexes API
      try {
        const turathData = await fetchTurathBookIndexes(bookNumId);
        if (turathData && isMounted) {
          const hasHeadings = applyIndexes(turathData);
          if (hasHeadings) {
            // Cache valid indexes in IndexedDB for subsequent 0ms loads
            await idbSetTurathBookTree(bookNumId, turathData);
            setLoadingBook(false);
            return;
          }
        }
      } catch (err) {
        console.warn('fetchTurathBookIndexes failed, trying fallback:', err);
      }

      // 3. Fallback to HF Space zad-book-info
      try {
        const baseUrl = import.meta.env.VITE_DATA_INGESTION_URL || 'https://abourida-zad-tutor-engine-space.hf.space';
        const res = await fetch(`${baseUrl}/api/v1/data-ingestion/zad-book-info/${book.id}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          const hasHeadings = applyIndexes(data);
          if (hasHeadings) {
            await idbSetTurathBookTree(bookNumId, data);
          }
        }
      } catch (err) {
        console.error("Failed to load book info", err);
      } finally {
        if (isMounted) setLoadingBook(false);
      }
    };

    fetchBookInfo();
    return () => { isMounted = false; };
  }, [book.id, reloadTocCounter]);

  // -------------------------------------------------------------------------
  // Feature 2: Hadith & Numbered Item Navigation Helper
  // -------------------------------------------------------------------------
  const hadithsCount = useMemo(() => Object.keys(hadithsMap).length, [hadithsMap]);

  const numberedItemsLabel = useMemo(() => {
    const textToMatch = `${book.title || ''} ${book.name || ''} ${book.category || ''} ${book.cat_name || ''}`;

    // Check if Hadith / Sunnah book
    if (/(حديث|سنة|سنن|صحيح|مسند|معجم|أثر|آثار|أجزاء حديثية)/i.test(textToMatch)) {
      return { short: 'الأحاديث', full: 'الأحاديث النبوية', single: 'الحديث', plural: 'أحاديث' };
    }
    // Check if Fiqh / Usul / Fatawa / Masa'il
    if (/(فقه|أصول|مسائل|فتاوى|أحكام|قواعد)/i.test(textToMatch)) {
      return { short: 'المسائل', full: 'المسائل والأحكام', single: 'المسألة', plural: 'مسائل' };
    }
    // Check if Tarajim / Rijal / Tabaqat
    if (/(رجال|تراجم|طبقات|سير|تاريخ|أعلام|وفيات)/i.test(textToMatch)) {
      return { short: 'التراجم', full: 'تراجم الأعلام', single: 'الترجمة', plural: 'تراجم' };
    }
    // Comprehensive fallback
    return { short: 'الأحاديث والمسائل', full: 'الأحاديث والمسائل المرقّمة', single: 'الموضع', plural: 'مواضع' };
  }, [book.title, book.name, book.category, book.cat_name]);

  const handleJumpToHadith = (hadithNum: string) => {
    const clean = hadithNum.trim();
    if (!clean || !hadithsMap) return;
    const target = hadithsMap[clean];
    if (target && target > 0) {
      setCurrentPage(target);
      setHadithSearchInput('');
      setSelectedTocIndex(null);
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setSidebarTab('none');
      }
    }
  };

  const handleSelectVolume = (vol: string) => {
    const cleanVol = normalizeArabicDigits(vol || '').trim();
    if (!cleanVol) return;

    let targetPage: number | null = null;

    // 1. First priority: find first entry of this volume in pageMap
    if (pageMap && pageMap.length > 0) {
      const idx = pageMap.findIndex(entry => {
        if (!entry) return false;
        const entryVol = entry.split(',')[0].trim();
        return entryVol === cleanVol;
      });
      if (idx >= 0) {
        targetPage = idx + 1;
      }
    }

    // 2. Second priority: find first key in printPgToPg for this volume
    if (!targetPage && printPgToPg && Object.keys(printPgToPg).length > 0) {
      const matchingKey = Object.keys(printPgToPg).find(k => {
        const kVol = k.split(',')[0].trim();
        return kVol === cleanVol;
      });
      if (matchingKey) {
        targetPage = printPgToPg[matchingKey];
      }
    }

    // 3. Third priority: volumeBounds printed start page (e.g. [2, 594] -> search "5,2")
    if (!targetPage && volumeBounds && volumeBounds[cleanVol]) {
      const firstPrintPg = volumeBounds[cleanVol][0];
      const key = `${cleanVol},${firstPrintPg}`;
      if (printPgToPg && printPgToPg[key]) {
        targetPage = printPgToPg[key];
      } else if (pageMap && pageMap.length > 0) {
        const idx = pageMap.findIndex(entry => entry === key);
        if (idx >= 0) targetPage = idx + 1;
      }
    }

    if (targetPage && targetPage > 0) {
      setSelectedVolumeForToc(cleanVol);
      setHasUserNavigatedToAllVolumes(false);
      const effectiveMax = maxPage || (pageMap && pageMap.length > 0 ? pageMap.length : 99999);
      const finalPage = Math.max(1, Math.min(targetPage, effectiveMax));

      isJumpingRef.current = true;
      setSelectedTocIndex(null);
      setActiveHeadingText(null);
      setCurrentPage(finalPage);

      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0 });
      }

      setTimeout(() => {
        isJumpingRef.current = false;
      }, 800);
    }
  };

  const handleJumpToPrintPage = (vol: string, pg: string) => {
    const cleanVol = normalizeArabicDigits(vol || '');
    const cleanPg = normalizeArabicDigits(pg || '');

    if (!cleanPg) {
      if (currentPrintCitation) {
        setPrintPageInput(currentPrintCitation.page);
        setPrintVolInput(currentPrintCitation.vol || '1');
      } else {
        setPrintPageInput(currentPage.toString());
      }
      return;
    }

    const parsedPg = parseInt(cleanPg, 10);
    if (isNaN(parsedPg) || parsedPg <= 0) {
      if (currentPrintCitation) {
        setPrintPageInput(currentPrintCitation.page);
      } else {
        setPrintPageInput(currentPage.toString());
      }
      return;
    }

    const effectiveMax = maxPage || (pageMap && pageMap.length > 0 ? pageMap.length : 99999);
    let targetPage: number | null = null;

    // 1. Exact match with given volume and page (e.g. "1,5" or "2,10")
    if (cleanVol) {
      const key = `${cleanVol},${cleanPg}`;
      if (printPgToPg && printPgToPg[key]) {
        targetPage = printPgToPg[key];
      } else if (pageMap && pageMap.length > 0) {
        const idx = pageMap.findIndex(entry => entry === key);
        if (idx >= 0) targetPage = idx + 1;
      }
    }

    // 2. Exact match with default volume 1 if volume was not specified or not matched
    if (!targetPage) {
      const key1 = `1,${cleanPg}`;
      if (printPgToPg && printPgToPg[key1]) {
        targetPage = printPgToPg[key1];
      } else if (pageMap && pageMap.length > 0) {
        const idx = pageMap.findIndex(entry => entry === key1);
        if (idx >= 0) targetPage = idx + 1;
      }
    }

    // 3. Match printed page in ANY volume if the user entered page without matching in current volume
    if (!targetPage && pageMap && pageMap.length > 0) {
      // Check current volume first
      const currentVol = currentPrintCitation?.vol || cleanVol || '1';
      const curKey = `${currentVol},${cleanPg}`;
      const curIdx = pageMap.findIndex(entry => entry === curKey);
      if (curIdx >= 0) {
        targetPage = curIdx + 1;
      } else {
        // Search in any volume that has this printed page
        const anyIdx = pageMap.findIndex(entry => entry && entry.endsWith(`,${cleanPg}`));
        if (anyIdx >= 0) targetPage = anyIdx + 1;
      }
    }

    // 4. If volume is specified and user changed volume, jump to that volume's beginning
    if (!targetPage && cleanVol && pageMap && pageMap.length > 0) {
      const volStartIdx = pageMap.findIndex(entry => entry && (entry.startsWith(`${cleanVol},`) || entry.split(',')[0] === cleanVol));
      if (volStartIdx >= 0) {
        targetPage = volStartIdx + 1;
      }
    }

    // 5. Direct digital page number (if parsedPg is within total pages of the book)
    if (!targetPage && parsedPg >= 1 && parsedPg <= effectiveMax) {
      targetPage = parsedPg;
    }

    // 6. Absolute clamp fallback
    if (!targetPage) {
      targetPage = Math.max(1, Math.min(parsedPg, effectiveMax));
    }

    if (targetPage && targetPage > 0) {
      const finalPage = Math.max(1, Math.min(targetPage, effectiveMax));
      if (finalPage === currentPage) return;

      isJumpingRef.current = true;
      setSelectedTocIndex(null);
      setActiveHeadingText(null);
      setCurrentPage(finalPage);

      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0 });
      }

      setTimeout(() => {
        isJumpingRef.current = false;
      }, 800);
    }
  };

  // -------------------------------------------------------------------------
  // Feature 4: Full-Text In-Book Search Helper
  // -------------------------------------------------------------------------
  const handleSearchInBook = async (e?: React.FormEvent, overrideMode?: 'flexible' | 'exact') => {
    if (e) e.preventDefault();
    if (!bookSearchQuery.trim()) return;

    setIsSearchingBook(true);
    setHasSearchedBook(true);
    setExpandedHitIndices(new Set());
    try {
      const mode = overrideMode ?? bookSearchMode;
      const clean = bookSearchQuery.trim().replace(/^["״'«](.*)["״'»]$/, '$1').trim();
      const finalQuery = mode === 'exact' ? `"${clean}"` : clean;

      const res = await searchTurathCorpus(finalQuery, { book: Number(book.id) });
      if (res && Array.isArray(res.data)) {
        setBookSearchResults(res.data);
      } else {
        setBookSearchResults([]);
      }
    } catch (err) {
      console.error('In-book search error:', err);
      setBookSearchResults([]);
    } finally {
      setIsSearchingBook(false);
    }
  };

  const handleToggleSearchMode = (mode: 'flexible' | 'exact') => {
    if (mode === bookSearchMode) return;
    setBookSearchMode(mode);
    if (bookSearchQuery.trim()) {
      handleSearchInBook(undefined, mode);
    }
  };

  const handleSelectSearchResult = (hit: TurathSearchHit) => {
    const targetPage = Number(hit.page_id || hit.page);
    if (!targetPage || isNaN(targetPage)) return;

    isJumpingRef.current = true;
    setSelectedTocIndex(null);
    setActiveHeadingText(null);

    // 1. If heading metadata is attached to hit, synchronize TOC heading
    if (hit.headings && hit.headings.length > 0) {
      const topHeading = hit.headings[hit.headings.length - 1];
      setActiveHeadingText(topHeading);
      const tocMatchIdx = toc.findIndex(h => h.title.trim() === topHeading.trim() || h.title.includes(topHeading.trim()));
      if (tocMatchIdx >= 0) {
        setSelectedTocIndex(tocMatchIdx);
      }
    }

    // 2. Extract matching terms to highlight on destination page (without opening in-page search toolbar!)
    const cleanQuery = bookSearchQuery.trim().replace(/^["״'«](.*)["״'»]$/, '$1').trim();
    const emMatches = (hit.snip || hit.snippet || '').match(/<em>(.*?)<\/em>/gi);
    let termsToHighlight: string[] = [];

    if (bookSearchMode === 'exact' && cleanQuery) {
      termsToHighlight = [cleanQuery];
    } else if (emMatches && emMatches.length > 0) {
      termsToHighlight = Array.from(new Set(emMatches.map(m => cleanTurathSnippet(m, false).trim()).filter(Boolean)));
    } else if (cleanQuery) {
      termsToHighlight = cleanQuery.split(/\s+/).filter(w => w.length > 1);
    }

    setBookSearchHighlightTerms(termsToHighlight);
    shouldScrollToSearchHitRef.current = true;
    setIsPageSearchOpen(false); // DO NOT open in-page search bar

    // 3. Jump to target page
    if (targetPage !== currentPage) {
      if (scrollContainerRef.current) {
        clearBookSearchHighlights(scrollContainerRef.current);
      }
      setCurrentPage(targetPage);
    } else {
      // If already on this page: re-highlight and scroll to first match immediately
      if (termsToHighlight.length > 0 && scrollContainerRef.current) {
        const regex = buildArabicRegexFromTerms(termsToHighlight);
        if (regex) {
          const matched = applyBookSearchHighlights(scrollContainerRef.current, regex, true);
          if (matched.length > 0) {
            matched[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }
    }

    // 4. In continuous reading mode, scroll precisely to the target page block
    if (readingMode === 'continuous') {
      setTimeout(() => {
        if (!scrollContainerRef.current) return;
        const pageEl = scrollContainerRef.current.querySelector(`[data-page="${targetPage}"]`);
        if (pageEl) {
          pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }

    // 5. Switch to reader tab (نص الباب) so reader content is immediately visible
    setSidebarTab('none');

    setTimeout(() => {
      isJumpingRef.current = false;
    }, 1000);
  };

  // -------------------------------------------------------------------------
  // Feature 5: Multi-Volume PDF Links List
  // -------------------------------------------------------------------------
  const volumePdfList = useMemo(() => {
    return parsePdfFilesList(pdfLinks || book.pdf_links, pdfsMap, pdfBase || undefined, volumeBounds);
  }, [pdfLinks, book.pdf_links, pdfsMap, pdfBase, volumeBounds]);

  // -------------------------------------------------------------------------
  // Feature 6: Offline Book Storage Action
  // -------------------------------------------------------------------------
  const handleToggleOfflineSave = async () => {
    if (isSavedOffline) {
      await idbRemoveOfflineBook(book.id);
      setIsSavedOffline(false);
      return;
    }

    setIsSavingOffline(true);
    setOfflineSaveProgress(15);
    try {
      const cachedPages: Record<number, any> = {};
      const bookNumId = Number(book.id);
      const totalToFetch = Math.min(25, maxPage || 25);

      for (let p = 1; p <= totalToFetch; p++) {
        try {
          const res = await fetchTurathPage(bookNumId, p);
          if (res && res.text) {
            cachedPages[p] = { text: res.text, main: res.text };
          }
        } catch (e) { }
        setOfflineSaveProgress(Math.round(15 + (p / totalToFetch) * 80));
      }

      await idbSaveBookOffline({
        bookId: book.id,
        title: book.title,
        author: authorName || book.author,
        indexes: {
          headings: toc,
          hadiths: hadithsMap,
          page_map: pageMap,
          volume_bounds: volumeBounds,
          print_pg_to_pg: printPgToPg,
          volumes: volumesList,
          pdfs: pdfsMap,
          pdf_base: pdfBase
        },
        cachedPages,
        savedAt: Date.now()
      });

      setIsSavedOffline(true);
      setOfflineSaveProgress(100);
    } catch (err) {
      console.error('Failed to save book offline:', err);
    } finally {
      setIsSavingOffline(false);
    }
  };

  const handleExport = async (format: 'txt' | 'json') => {
    setIsExporting(true);
    setExportProgressText('جاري التحضير...');
    try {
      await downloadBookFile(book, format, (p) => {
        setExportProgressText(p.status);
      });
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
      setExportProgressText('');
      setIsDownloadMenuOpen(false);
    }
  };

  const handleDirectFileDownload = async (url: string, fileName: string) => {
    setDownloadingFile(fileName);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 15000);
    } catch (err) {
      console.warn('Direct blob download failed, falling back:', err);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setDownloadingFile(null);
    }
  };

  const handleOpenOrDownloadPdf = async (targetVolItem?: VolumePdfItem | React.MouseEvent) => {
    const item = (targetVolItem && 'url' in targetVolItem) ? (targetVolItem as VolumePdfItem) : undefined;
    if (item) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
      setShowPdfModal(false);
      setIsDownloadMenuOpen(false);
      return;
    }

    if (volumePdfList.length > 1) {
      setShowPdfModal(true);
      setIsDownloadMenuOpen(false);
      return;
    }

    if (volumePdfList.length === 1) {
      window.open(volumePdfList[0].url, '_blank', 'noopener,noreferrer');
      setIsDownloadMenuOpen(false);
      return;
    }

    const currentVolNum = parseInt(currentVolumeInfo?.vol || currentPrintCitation?.vol || '', 10) || undefined;
    const immediateUrl = getBookPdfUrl(book, currentVolNum);
    if (immediateUrl) {
      window.open(immediateUrl, '_blank', 'noopener,noreferrer');
      setIsDownloadMenuOpen(false);
      return;
    }

    setLoadingPdf(true);
    try {
      const resolvedUrl = await fetchTurathBookPdfUrl(Number(book.id), currentVolNum);
      if (resolvedUrl) {
        window.open(resolvedUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.open(`https://files.turath.io/pdf/${book.id}.pdf`, '_blank', 'noopener,noreferrer');
      }
    } catch {
      window.open(`https://files.turath.io/pdf/${book.id}.pdf`, '_blank', 'noopener,noreferrer');
    } finally {
      setLoadingPdf(false);
      setIsDownloadMenuOpen(false);
    }
  };

  // Fetch page content
  useEffect(() => {
    const fetchPage = async () => {
      // 1. If we are user-scrolling continuously and page is in buffer, just update text state
      const cachedPage = continuousPages.find(p => p.page === currentPage);
      if (cachedPage) {
        setPageText({
          main: cachedPage.text,
          matn: cachedPage.matn || cachedPage.text,
          sharh: cachedPage.sharh,
          footnote: cachedPage.footnote || ''
        });
        if (isJumpingRef.current && readingMode === 'continuous' && scrollContainerRef.current) {
          const pageEl = scrollContainerRef.current.querySelector(`[data-page="${currentPage}"]`);
          if (pageEl) {
            pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
        return;
      }

      // 2. Fetch page using fast fetchPageData
      pageSessionRef.current += 1;
      const currentSession = pageSessionRef.current;
      setLoadingPage(true);
      setLoadingNext(false);
      setLoadNextError(false);
      try {
        const processed = await fetchPageData(currentPage);
        if (currentSession !== pageSessionRef.current) return;

        if (processed && processed.main && processed.main !== 'هذه الصفحة فارغة.') {
          setPageText({
            main: processed.main,
            matn: processed.matn,
            sharh: processed.sharh,
            footnote: processed.footnote
          });
          setContinuousPages([{
            page: currentPage,
            text: processed.main,
            matn: processed.matn,
            sharh: processed.sharh,
            footnote: processed.footnote
          }]);
          setHasReachedEnd(false);
          setHasReachedStart(currentPage <= 1);
          setLoadNextError(false);

          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({ top: 0 });
          }
        } else {
          setPageText({ main: 'هذه الصفحة فارغة.', footnote: '' });
          setContinuousPages([{
            page: currentPage,
            text: 'هذه الصفحة فارغة.',
            footnote: ''
          }]);
          setHasReachedEnd(true);
          setHasReachedStart(true);
        }
      } catch (err) {
        if (currentSession !== pageSessionRef.current) return;
        console.error("Failed to load page", err);
        setPageText({ main: 'حدث خطأ أثناء تحميل الصفحة. يرجى التحقق من اتصالك بالإنترنت.', footnote: '' });
        setContinuousPages([{
          page: currentPage,
          text: '<div class="p-8 text-center text-red-500 bg-red-500/10 rounded-2xl">حدث خطأ أثناء تحميل الصفحة. يرجى التحقق من اتصالك بالإنترنت.</div>'
        }]);
      } finally {
        if (currentSession === pageSessionRef.current) {
          setLoadingPage(false);
        }
      }
    };
    fetchPage();
  }, [book.id, currentPage, fetchPageData]);

  const handlePageJump = (page: number, title?: string, index?: number) => {
    isJumpingRef.current = true;
    const targetPage = Number(page);
    setCurrentPage(targetPage);

    let targetIndex = index;
    if (targetIndex === undefined && title) {
      const idx = toc.findIndex(h => h.title.trim() === title.trim() || h.title.includes(title.trim()));
      if (idx >= 0) targetIndex = idx;
    }

    if (targetIndex !== undefined) {
      setSelectedTocIndex(targetIndex);
    }
    if (title) {
      setActiveHeadingText(title);
    }

    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0 });
    }

    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarTab('none');
    }

    setTimeout(() => {
      isJumpingRef.current = false;
    }, 800);
  };

  useEffect(() => {
    if (targetHeading && scrollContainerRef.current && !loadingPage) {
      // Small timeout to ensure DOM is updated
      setTimeout(() => {
        if (!scrollContainerRef.current) return
        const elements = scrollContainerRef.current.querySelectorAll('span[data-type="title"], h1, h2, h3, h4, p, span')
        for (const el of Array.from(elements)) {
          if (el.textContent?.trim() === targetHeading.trim() || el.textContent?.includes(targetHeading.trim())) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            setTargetHeading(null)
            break
          }
        }
      }, 100)
    }
  }, [pageText, continuousPages, targetHeading, loadingPage])

  const loadNextPage = async () => {
    if (loadingNext || hasReachedEnd || !continuousPages.length) return;
    const lastPage = continuousPages[continuousPages.length - 1].page;
    const currentSession = pageSessionRef.current;

    setLoadingNext(true);
    setLoadNextError(false);
    try {
      // Progressive batching with fast single page fetch
      const BATCH_SIZE = 2;
      const pagesToFetch = Array.from({ length: BATCH_SIZE }, (_, i) => lastPage + i + 1);

      let reachedEnd = false;
      let loadedAtLeastOne = false;

      for (let i = 0; i < pagesToFetch.length; i++) {
        if (currentSession !== pageSessionRef.current) return;

        const processed = await fetchPageData(pagesToFetch[i]);
        if (processed && processed.main && processed.main !== 'هذه الصفحة فارغة.') {
          const newPage = {
            page: pagesToFetch[i],
            text: processed.main,
            matn: processed.matn,
            sharh: processed.sharh,
            footnote: processed.footnote || undefined
          };

          setContinuousPages(prev => {
            if (prev.length === 0 || prev[prev.length - 1].page !== pagesToFetch[i] - 1) {
              return prev;
            }
            return [...prev, newPage];
          });
          loadedAtLeastOne = true;
        } else {
          reachedEnd = true;
          break;
        }
      }

      if (reachedEnd) {
        setHasReachedEnd(true);
      } else if (!loadedAtLeastOne) {
        setLoadNextError(true);
      }
    } catch (err) {
      if (currentSession !== pageSessionRef.current) return;
      console.error("Error loading next page:", err);
      setLoadNextError(true);
    } finally {
      if (currentSession === pageSessionRef.current) {
        setLoadingNext(false);
      }
    }
  };

  const loadPrevPage = async () => {
    if (loadingPrev || hasReachedStart || !continuousPages.length) return;
    const firstPage = continuousPages[0].page;
    if (firstPage <= 1) {
      setHasReachedStart(true);
      return;
    }

    const currentSession = pageSessionRef.current;
    setLoadingPrev(true);

    try {
      const BATCH_SIZE = Math.min(2, firstPage - 1);
      const pagesToFetch = Array.from({ length: BATCH_SIZE }, (_, i) => firstPage - BATCH_SIZE + i);
      const newPages: any[] = [];

      for (let i = pagesToFetch.length - 1; i >= 0; i--) {
        if (currentSession !== pageSessionRef.current) break;
        const processed = await fetchPageData(pagesToFetch[i]);
        if (processed && processed.main && processed.main !== 'هذه الصفحة فارغة.') {
          newPages.unshift({
            page: pagesToFetch[i],
            text: processed.main,
            matn: processed.matn,
            sharh: processed.sharh,
            footnote: processed.footnote || undefined
          });
        } else {
          break;
        }
      }

      if (newPages.length > 0) {
        const container = scrollContainerRef.current;
        const oldScrollHeight = container ? container.scrollHeight : 0;
        const oldScrollTop = container ? container.scrollTop : 0;

        isJumpingRef.current = true;
        setContinuousPages(prev => {
          if (prev.length === 0 || prev[0].page !== firstPage) {
            return prev;
          }
          return [...newPages, ...prev];
        });

        requestAnimationFrame(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = oldScrollTop + (newScrollHeight - oldScrollHeight);
          }
          setTimeout(() => {
            isJumpingRef.current = false;
          }, 400);
        });
      }

      if (pagesToFetch[0] <= 1) {
        setHasReachedStart(true);
      }
    } catch (err) {
      if (currentSession !== pageSessionRef.current) return;
      console.error("Error loading previous page:", err);
    } finally {
      if (currentSession === pageSessionRef.current) {
        setLoadingPrev(false);
      }
    }
  };

  const handleScroll = useCallback(() => {
    if (readingMode !== 'continuous' || !scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;

    // Load more when user is within 5000px of the bottom
    if (scrollHeight - scrollTop - clientHeight < 5000) {
      if (!loadingNext && !hasReachedEnd && !loadNextError) {
        loadNextPage();
      }
    }

    // Load previous when user is within 5000px of the top
    if (scrollTop < 5000) {
      if (!loadingPrev && !hasReachedStart) {
        loadPrevPage();
      }
    }
  }, [readingMode, loadingNext, hasReachedEnd, loadNextError, continuousPages, loadingPrev, hasReachedStart]);

  // Background Prefetcher: Silently keep a buffer of 15 pages ahead of the current viewed page
  useEffect(() => {
    if (!continuousPages.length || hasReachedEnd || loadingNext || loadNextError) return;
    const lastPageLoaded = continuousPages[continuousPages.length - 1].page;
    if (lastPageLoaded - currentPage < 15) {
      loadNextPage();
    }
  }, [continuousPages, currentPage, readingMode, hasReachedEnd, loadingNext, loadNextError]);

  const goNext = () => {
    setSelectedTocIndex(null);
    setActiveHeadingText(null);
    if (readingMode === 'continuous') {
      const nextPage = currentPage + 1;
      const targetEl = scrollContainerRef.current?.querySelector(`[data-page="${nextPage}"]`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setCurrentPage(nextPage);
        return;
      }
    }
    setCurrentPage(p => p + 1);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0 });
    }
  };

  const goPrev = () => {
    setSelectedTocIndex(null);
    setActiveHeadingText(null);
    if (readingMode === 'continuous') {
      const prevPage = currentPage - 1;
      if (prevPage >= 1) {
        const targetEl = scrollContainerRef.current?.querySelector(`[data-page="${prevPage}"]`);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setCurrentPage(prevPage);
          return;
        }
      }
    }
    setCurrentPage(p => Math.max(1, p - 1));
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0 });
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowLeft') {
        goNext();
      } else if (e.key === 'ArrowRight') {
        goPrev();
      } else if (e.key === 'Escape') {
        setShowPdfModal(false);
        setShowSettings(false);
        setShowBookmarks(false);
        setIsDownloadMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readingMode, continuousPages]);

  const readerThemeClasses = {
    light: 'bg-white text-gray-900 border-gray-200/60 shadow-[0_8px_32px_rgba(0,0,0,0.06)]',
    dark: 'bg-[#181825] text-gray-200 border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
    sepia: 'bg-[#f4ecd8] text-[#5b4636] border-[#d3c6a6]/50 shadow-[0_8px_32px_rgba(91,70,54,0.1)]'
  }

  const readerTextClasses = {
    light: 'prose-headings:text-gray-900',
    dark: 'prose-invert prose-headings:text-white',
    sepia: 'prose-headings:text-[#4a382b]'
  }

  const maxPage = (pageMap && pageMap.length > 0)
    ? pageMap.length
    : (toc.length > 0
      ? Math.max(...toc.map(h => h.page))
      : (book.page_count && book.page_count > 0 ? book.page_count : currentPage));
  const progressPercent = Math.min(100, Math.max(0, (currentPage / (maxPage || 1)) * 100));

  // Smooth scrolling and theme-aware highlighting when clicking footnote references in text
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const getFootnoteHighlightClasses = (): string[] => {
      const base = ['ring-2', 'scale-[1.02]', 'shadow-md'];
      if (readerTheme === 'sepia') {
        return [...base, 'ring-[#b45309]', 'bg-[#b45309]/10'];
      }
      switch (accentColor) {
        case 'amber':
          return [...base, 'ring-amber-500', 'dark:ring-[#dfbf83]', 'bg-amber-500/10', 'dark:bg-amber-500/20'];
        case 'emerald':
          return [...base, 'ring-teal-500', 'dark:ring-teal-400', 'bg-teal-500/10', 'dark:bg-teal-500/20'];
        case 'blue':
          return [...base, 'ring-blue-500', 'dark:ring-blue-400', 'bg-blue-500/10', 'dark:bg-blue-500/20'];
        case 'purple':
        default:
          return [...base, 'ring-purple-500', 'dark:ring-purple-400', 'bg-purple-500/10', 'dark:bg-purple-500/20'];
      }
    };

    const handleFootnoteClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-type="footnote-ref"]');
      if (target) {
        e.preventDefault();
        const href = target.getAttribute('href');
        if (href) {
          const targetEl = container.querySelector(href) as HTMLElement | null;
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Clear any previously active footnote highlight immediately
            if (activeFootnoteHighlightRef.current) {
              window.clearTimeout(activeFootnoteHighlightRef.current.timer);
              activeFootnoteHighlightRef.current.el.classList.remove(
                ...activeFootnoteHighlightRef.current.classes
              );
              activeFootnoteHighlightRef.current = null;
            }

            const highlightClasses = getFootnoteHighlightClasses();
            targetEl.classList.add(...highlightClasses);

            const timer = window.setTimeout(() => {
              targetEl.classList.remove(...highlightClasses);
              if (activeFootnoteHighlightRef.current?.el === targetEl) {
                activeFootnoteHighlightRef.current = null;
              }
            }, 2500);

            activeFootnoteHighlightRef.current = { el: targetEl, classes: highlightClasses, timer };
          }
        }
      }
    };

    container.addEventListener('click', handleFootnoteClick);
    return () => {
      container.removeEventListener('click', handleFootnoteClick);
      if (activeFootnoteHighlightRef.current) {
        window.clearTimeout(activeFootnoteHighlightRef.current.timer);
        activeFootnoteHighlightRef.current.el.classList.remove(
          ...activeFootnoteHighlightRef.current.classes
        );
        activeFootnoteHighlightRef.current = null;
      }
    };
  }, [pageText, continuousPages, accentColor, readerTheme]);

  useEffect(() => {
    const handleExplainRequest = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        handleAskExplain(customEvent.detail);
      }
    };
    window.addEventListener('explainSelectedText', handleExplainRequest);
    return () => window.removeEventListener('explainSelectedText', handleExplainRequest);
  }, [currentPage, toc, book, pageText]);

  return (
    <div
      dir="rtl"
      className={`fixed inset-0 z-50 flex flex-col transition-colors duration-500 overflow-hidden ${getReaderRootBg()} animate-in fade-in zoom-in-95 duration-300`}
    >
      {/* Islamic Geometric Wallpaper Pattern (ثابتة في خلفية القراءة متناسقة مع السمة) */}
      <IslamicPattern
        isFixed={true}
        opacity={readerTheme === 'dark' ? 0.08 : readerTheme === 'sepia' ? 0.13 : 0.16}
        className={`${getReaderPatternColor()} pointer-events-none transition-colors duration-300`}
      />

      {/* Top Navigation Bar (Study Mode Style) */}
      <header
        className={`shrink-0 flex flex-col w-full z-40 transition-transform duration-500 border-b ${distractionFree ? '-translate-y-full opacity-0 absolute' : 'translate-y-0 opacity-100'} ${readerTheme === 'dark' ? 'bg-[#090b10]/85 backdrop-blur-md border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.5)] text-white' : 'bg-white/80 backdrop-blur-md border-gray-200/80 text-slate-900'}`}
      >
        <div className="min-h-[3rem] sm:min-h-[3.5rem] md:min-h-[4rem] py-1 md:py-1.5 w-full flex items-center justify-between px-3 md:px-4">
        <div className="flex items-center gap-2 h-full flex-1 min-w-0">
          {/* Back to Library Button (Circular design matching sidebar button) */}
          <button
            type="button"
            onClick={onClose}
            className={`h-9 w-9 md:h-10 md:w-10 rounded-full border flex items-center justify-center transition-all backdrop-blur-md active:scale-95 cursor-pointer group shrink-0 ${getNavCircleBtnStyle()}`}
            title="العودة للمكتبة"
            aria-label="العودة للمكتبة"
          >
            <ArrowRight className="h-4.5 w-4.5 md:h-5 md:w-5 transition-transform group-hover:-translate-x-1" strokeWidth={2.2} />
          </button>

          {/* Library Sidebar Menu Button (Only on desktop to avoid duplicate menu button on mobile) */}
          {onOpenSidebar && (
            <button
              type="button"
              onClick={onOpenSidebar}
              className={`hidden md:flex h-10 w-10 rounded-full border items-center justify-center transition-all backdrop-blur-md active:scale-95 cursor-pointer group shrink-0 ${getNavCircleBtnStyle()}`}
              title="فهرس وتصنيفات المكتبة العامة"
              aria-label="فتح فهرس وتصنيفات المكتبة العامة"
            >
              <Menu className="h-5 w-5 transition-transform group-hover:scale-110" strokeWidth={2.2} />
            </button>
          )}

          <div className="hidden md:block h-8 w-px bg-border/50 mx-1 shrink-0" />

          {/* Tools Toggles (Desktop only) */}
          <div className="hidden md:flex items-center gap-1.5 h-full py-2 shrink-0">
            <button
              onClick={() => setSidebarTab(sidebarTab === 'toc' ? 'none' : 'toc')}
              className={`flex h-9 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold transition-all backdrop-blur-xl ${sidebarTab === 'toc'
                ? getHeaderTabActiveStyle('toc')
                : readerTheme === 'dark'
                  ? 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                  : 'bg-white/50 border border-slate-200/90 text-slate-600 hover:bg-white/80 hover:text-slate-900 hover:border-slate-300'
                }`}
            >
              <Menu size={15} className="shrink-0 stroke-[2.2]" />
              <span>الفهرس</span>
            </button>

            <button
              onClick={() => setSidebarTab(sidebarTab === 'search' ? 'none' : 'search')}
              className={`flex h-9 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold transition-all backdrop-blur-xl ${sidebarTab === 'search'
                ? getHeaderTabActiveStyle('search')
                : readerTheme === 'dark'
                  ? 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                  : 'bg-white/50 border border-slate-200/90 text-slate-600 hover:bg-white/80 hover:text-slate-900 hover:border-slate-300'
                }`}
              title="بحث شامل في نصوص ومتون صفحات هذا الكتاب"
            >
              <Search size={15} className={`${sidebarTab === 'search' ? (accentColor === 'amber' ? 'text-stone-950 dark:text-[#eed9b0]' : 'text-current') : (accentColor === 'amber' ? 'text-[#b88d46]' : accentColor === 'emerald' ? 'text-teal-600' : accentColor === 'blue' ? 'text-blue-600' : 'text-brand-magenta')} shrink-0`} />
              <span>بحث بالمتن</span>
            </button>

            {hadithsCount > 0 && (
              <button
                onClick={() => setSidebarTab(sidebarTab === 'hadiths' ? 'none' : 'hadiths')}
                className={`flex h-9 items-center justify-center gap-1.5 rounded-xl px-2.5 text-xs font-bold transition-all backdrop-blur-xl ${sidebarTab === 'hadiths'
                  ? getHeaderTabActiveStyle('hadiths')
                  : readerTheme === 'dark'
                    ? 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                    : 'bg-white/50 border border-slate-200/90 text-slate-600 hover:bg-white/80 hover:text-slate-900 hover:border-slate-300'
                  }`}
                title={`انتقال برقم ${numberedItemsLabel.single} (${hadithsCount} ${numberedItemsLabel.plural})`}
              >
                <Hash size={14} className="text-amber-500 shrink-0" />
                <span>{numberedItemsLabel.short}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-500 font-extrabold">{hadithsCount}</span>
              </button>
            )}

            <button
              onClick={() => setSidebarTab(sidebarTab === 'chat' ? 'none' : 'chat')}
              className={`flex h-9 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold transition-all backdrop-blur-xl ${sidebarTab === 'chat'
                ? getHeaderTabActiveStyle('chat')
                : readerTheme === 'dark'
                  ? 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                  : 'bg-white/50 border border-slate-200/90 text-slate-600 hover:bg-white/80 hover:text-slate-900 hover:border-slate-300'
                }`}
            >
              {renderZadLogo('h-[15px] w-[15px]')}
              <span>مساعد القراءة</span>
            </button>
          </div>

          <div className="hidden md:block h-8 w-px bg-border/50 mx-3 shrink-0" />

          {/* Book Title & Hierarchy */}
          <div className="flex items-center gap-1.5 md:gap-3 min-w-0 pointer-events-none text-muted-foreground flex-1 justify-center md:justify-start">
            <h1 className={`font-scheherazade text-xl sm:text-2xl md:text-2xl font-bold ${getHeaderTitleColor()} min-w-0 leading-tight py-0.5 md:py-1 px-1.5 text-center md:text-right truncate`}>
              {book.title}
            </h1>

            {/* Author & Hierarchy on Desktop */}
            <div className="hidden md:flex flex-col gap-1 items-start justify-center min-w-0 border-r border-border/50 pr-3">
              {authorName && (
                <div className="relative group/author pointer-events-auto">
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectAuthor) {
                        onSelectAuthor(book.author || authorName);
                      }
                    }}
                    className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold border backdrop-blur-md shadow-sm transition-all shrink-0 hover:scale-105 cursor-pointer ${getHeaderAuthorBadgeClass()}`}
                    title={authorName}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${getAccentDotColor()} animate-pulse shrink-0`} />
                    <span className="truncate max-w-[160px] sm:max-w-[220px] md:max-w-[300px]">{authorName}</span>
                  </button>

                  {/* Full Author Name Tooltip on Hover */}
                  <div className="absolute right-0 top-full mt-1.5 hidden group-hover/author:block z-50 pointer-events-none animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold shadow-xl backdrop-blur-xl whitespace-nowrap ${readerTheme === 'dark'
                      ? 'bg-[#0d071a]/95 border-purple-500/40 text-purple-100 shadow-black/80'
                      : 'bg-white/95 border-slate-200 text-slate-800 shadow-lg'
                      }`}>
                      {authorName}
                    </div>
                  </div>
                </div>
              )}

              {activeHierarchy.length > 0 && (
                <div className="relative group/breadcrumb pointer-events-auto">
                  <span className={`flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] md:text-[11px] font-bold border backdrop-blur-md shadow-sm transition-all cursor-pointer ${readerTheme === 'dark' ? 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10' : 'bg-black/5 border-black/10 text-slate-800 hover:bg-black/10'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${getAccentDotColor()} animate-pulse shrink-0`} />
                    <span className="flex items-center gap-1.5 min-w-0">
                      {/* Level 1 Chapter Title */}
                      <span className={`font-extrabold shrink-0 ${getBreadcrumbChapterColor()}`}>
                        {activeHierarchy[0]}
                      </span>

                      {activeHierarchy.length > 1 && (
                        <>
                          <ChevronLeft className="h-3 w-3 text-brand-blue shrink-0 animate-pulse" />
                          {/* Active Sub-Heading */}
                          <span className="truncate max-w-[200px] sm:max-w-[320px] md:max-w-[450px]">
                            {activeHierarchy[activeHierarchy.length - 1]}
                          </span>
                        </>
                      )}
                    </span>
                  </span>

                  {/* Full Hierarchy Floating Tooltip Box on Hover */}
                  <div className="absolute right-0 top-full mt-2 hidden group-hover/breadcrumb:block z-50 pointer-events-none animate-in fade-in slide-in-from-top-1 duration-200 delay-300">
                    <div className={`px-4 py-2.5 rounded-2xl border text-xs font-bold shadow-2xl backdrop-blur-xl flex items-center gap-2 whitespace-nowrap ${readerTheme === 'dark' ? 'bg-[#0d071a]/95 border-purple-500/40 text-purple-100 shadow-black/80' : 'bg-white/95 border-purple-200 text-purple-950 shadow-xl'}`}>
                      <span className="text-brand-magenta font-extrabold shrink-0">المسار الكامل:</span>
                      {activeHierarchy.map((item, idx) => (
                        <React.Fragment key={idx}>
                          <span>{item}</span>
                          {idx < activeHierarchy.length - 1 && <ChevronLeft className="h-3 w-3 text-brand-blue shrink-0" />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2 relative h-full py-0.5 md:py-2" ref={settingsRef}>

          {/* Feature: Book Highlights Dropdown (قائمة النصوص الملونة والتظليلات في الكتاب) */}
          <div className="relative" ref={highlightsMenuRef}>
            <button
              type="button"
              onClick={() => {
                setShowHighlightsMenu(!showHighlightsMenu);
                setIsPageSearchOpen(false);
                setIsDownloadMenuOpen(false);
                setShowBookmarks(false);
                setShowSettings(false);
              }}
              className={`hidden md:flex w-10 h-10 rounded-xl justify-center items-center transition-all duration-300 backdrop-blur-md border shadow-sm relative ${showHighlightsMenu
                ? getHighlightsBtnActiveStyle()
                : readerTheme === 'dark'
                  ? 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white hover:shadow-md hover:scale-105'
                  : 'bg-white/50 border-gray-200/60 text-slate-500 hover:bg-white/80 hover:text-slate-900 hover:shadow-md hover:scale-105'
                }`}
              title={`النصوص المظللة (${toEasternArabicNumerals(highlights.length)})`}
              aria-label="قائمة النصوص المظللة"
            >
              <Highlighter className="h-5 w-5" />
              {highlights.length > 0 && (
                <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 font-black text-[10px] rounded-full flex items-center justify-center shadow-md border border-white/20 ${getBottomNavIndicatorClass()}`}>
                  {highlights.length > 99 ? '+99' : toEasternArabicNumerals(highlights.length)}
                </span>
              )}
            </button>

            {/* Highlights Dropdown Modal */}
            {showHighlightsMenu && (
              <div
                onClick={(e) => e.stopPropagation()}
                className={`fixed inset-x-3 top-16 md:absolute md:top-full md:left-0 md:inset-x-auto mt-2 w-auto md:w-80 backdrop-blur-2xl border rounded-3xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200 ${
                  readerTheme === 'dark'
                    ? 'bg-[#0d071a]/98 text-white'
                    : readerTheme === 'sepia'
                      ? 'bg-[#FAF5ED]/98 text-[#3D2C1D]'
                      : 'bg-white/98 text-slate-900'
                } ${getHighlightsDropdownBorder()}`}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/50 px-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${getHighlightEmptyIconStyle()}`}>
                      <Highlighter className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-xs">النصوص المظللة</h3>
                        {highlights.length > 0 && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${getHighlightsCountBadgeStyle()}`}>
                            {toEasternArabicNumerals(highlights.length)}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {highlights.length > 0 ? 'في كامل الكتاب' : 'لا توجد تظليلات حالياً'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {highlights.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllHighlights}
                        className="px-2 py-1 text-[10px] font-bold text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="حذف جميع التظليلات"
                      >
                        مسح الكل
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowHighlightsMenu(false)}
                      className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground cursor-pointer"
                      title="إغلاق"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Highlights List */}
                <div className="max-h-80 overflow-y-auto custom-scrollbar flex flex-col gap-2 p-1">
                  {highlights.length === 0 ? (
                    <div className="py-8 px-4 text-center flex flex-col items-center justify-center gap-2 opacity-70">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getHighlightEmptyIconStyle()}`}>
                        <Highlighter className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold">لا توجد نصوص ملونة بعد</p>
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        حدد أي نص في صفحات الكتاب واختر لوناً من شريط الأدوات لحفظه هنا.
                      </p>
                    </div>
                  ) : (
                    highlights.map((h) => {
                      const isCurrentPage = h.page === currentPage;
                      return (
                        <div
                          key={h.id}
                          onClick={() => handleJumpToHighlight(h)}
                          className={`group relative p-3 rounded-2xl border transition-all duration-200 cursor-pointer text-right flex flex-col gap-1.5 ${getHighlightActiveCardStyle(isCurrentPage)}`}
                        >
                          {/* Card Header: Page Badge + Color Dot + Delete Button */}
                          <div className="flex items-center justify-between">
                            <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 ${getHighlightBadgeStyle(isCurrentPage)}`}>
                              <span>صفحة {toEasternArabicNumerals(h.page)}</span>
                              {isCurrentPage && <span className="text-[9px] font-bold opacity-80">(الحالية)</span>}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {/* Color Badge */}
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs inline-block"
                                style={{ backgroundColor: h.color }}
                                title="لون التحديد"
                              />

                              {/* Delete button */}
                              <button
                                type="button"
                                onClick={(e) => handleDeleteHighlight(h.id, e)}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors opacity-70 group-hover:opacity-100"
                                title="حذف هذا التظليل"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Highlight Text Quote */}
                          <p
                            className="text-xs leading-relaxed line-clamp-3 font-medium rounded-lg p-1.5 transition-colors"
                            style={{
                              borderRight: `3px solid ${h.color}`,
                              backgroundColor: readerTheme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
                            }}
                          >
                            "{h.text}"
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* In-Page Quick Search Button & Floating Search Bar (البحث في الصفحة المفتوحة) */}
          {/* In-Page Quick Search Button (Desktop) */}
          <button
            type="button"
            onClick={() => {
              setIsPageSearchOpen(prev => !prev);
              setIsDownloadMenuOpen(false);
              setShowBookmarks(false);
              setShowSettings(false);
            }}
            className={`hidden md:flex w-10 h-10 rounded-xl justify-center items-center transition-all duration-300 backdrop-blur-md border shadow-sm ${
              isPageSearchOpen
                ? accentColor === 'amber'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-500 shadow-sm scale-105'
                  : accentColor === 'emerald'
                    ? 'bg-teal-500/20 border-teal-500 text-teal-600 dark:text-teal-400 shadow-sm scale-105'
                    : accentColor === 'blue'
                      ? 'bg-blue-500/20 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm scale-105'
                      : 'bg-brand-magenta/20 border-brand-magenta text-brand-magenta shadow-sm scale-105'
                : readerTheme === 'dark'
                  ? 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white hover:shadow-md hover:scale-105'
                  : 'bg-white/50 border-gray-200/60 text-slate-500 hover:bg-white/80 hover:text-slate-900 hover:shadow-md hover:scale-105'
            }`}
            title="بحث في هذه الصفحة (Ctrl+F)"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Feature 5 & 6: Unified Download & Export Dropdown (مطابق تماماً لخارج الكتاب) */}
          <div className="relative" ref={downloadMenuRef}>
            <button
              type="button"
              onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)}
              className={`hidden md:flex w-10 h-10 rounded-xl justify-center items-center transition-all duration-300 backdrop-blur-md border shadow-sm ${isDownloadMenuOpen
                ? 'bg-brand-magenta/20 border-brand-magenta/40 text-brand-magenta shadow-[0_0_15px_rgba(149,11,196,0.3)] scale-105'
                : isSavedOffline
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500'
                  : readerTheme === 'dark'
                    ? 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white hover:shadow-md hover:scale-105'
                    : 'bg-white/50 border-gray-200/60 text-slate-500 hover:bg-white/80 hover:text-slate-900 hover:shadow-md hover:scale-105'
                }`}
              title="خيارات تحميل وتصدير الكتاب"
            >
              {isSavingOffline || isExporting || loadingPdf ? (
                <Loader2 className="h-5 w-5 animate-spin text-brand-magenta" />
              ) : isSavedOffline ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <Download className="h-5 w-5" />
              )}
            </button>

            {isDownloadMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className={`fixed inset-x-3 top-16 md:absolute md:top-full md:left-0 md:inset-x-auto mt-2 w-auto md:w-64 backdrop-blur-2xl border rounded-2xl shadow-2xl p-2 z-50 text-right animate-in fade-in slide-in-from-top-2 duration-150 ${readerTheme === 'dark'
                  ? 'bg-[#121826]/95 border-white/10 shadow-black/80 text-white'
                  : readerTheme === 'sepia'
                    ? 'bg-[#FAF5ED]/95 border-[#E2D6C0] shadow-xl text-[#3D2C1D]'
                    : 'bg-white/95 border-gray-200 shadow-xl text-slate-900'
                  }`}
              >
                <div className="flex items-center justify-between px-2 py-1 border-b border-inherit/40 mb-1">
                  <span className="text-[10px] font-bold opacity-70">
                    خيارات تحميل وتصدير الكتاب:
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDownloadMenuOpen(false);
                    }}
                    className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="إغلاق"
                    aria-label="إغلاق قائمة التحميل"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 1. Offline Storage */}
                <button
                  type="button"
                  onClick={handleToggleOfflineSave}
                  disabled={isSavingOffline}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-right cursor-pointer ${isSavedOffline ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <HardDriveDownload className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>
                      {isSavingOffline
                        ? `جاري الحفظ (${offlineSaveProgress}%)...`
                        : isSavedOffline
                          ? 'محفوظ أوفلاين (إزالة)'
                          : 'حفظ للقراءة دون إنترنت (Offline)'}
                    </span>
                  </div>
                  {isSavingOffline ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                  ) : isSavedOffline ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : null}
                </button>

                {/* 2. Full TXT download */}
                <button
                  type="button"
                  onClick={() => handleExport('txt')}
                  disabled={isExporting}
                  className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-right cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FileDown className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>تحميل متن الكتاب (TXT)</span>
                  </div>
                  {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" /> : null}
                </button>

                {/* 3. JSON download */}
                <button
                  type="button"
                  onClick={() => handleExport('json')}
                  disabled={isExporting}
                  className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-right cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <BookCheck className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>بيانات وفهرس (JSON)</span>
                  </div>
                </button>

                {/* 4. PDF download */}
                {(volumePdfList.length > 0 || hasBookPdf(book)) && (
                  <button
                    type="button"
                    onClick={() => handleOpenOrDownloadPdf()}
                    disabled={loadingPdf}
                    className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-right cursor-pointer text-rose-600 dark:text-rose-400"
                  >
                    <div className="flex items-center gap-2">
                      <FileDown className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>
                        {volumePdfList.length > 1
                          ? `تحميل الـ PDF (${volumePdfList.length} مجلدات)`
                          : 'تحميل النسخة المصورة (PDF)'}
                      </span>
                    </div>
                    {loadingPdf ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                    ) : (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 font-mono">
                        PDF
                      </span>
                    )}
                  </button>
                )}

                {isExporting && exportProgressText && (
                  <p className="text-[10px] text-muted-foreground px-2 py-1 mt-1 border-t border-inherit animate-pulse">
                    {exportProgressText}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Bookmarks Dropdown Toggle */}
          <div className="relative">
            <button
              onClick={() => { setShowBookmarks(!showBookmarks); setShowSettings(false); }}
              className={`hidden md:flex w-10 h-10 rounded-xl justify-center items-center transition-all duration-300 backdrop-blur-md border shadow-sm ${showBookmarks ? 'bg-brand-magenta/20 border-brand-magenta/40 text-brand-magenta shadow-[0_0_15px_rgba(149,11,196,0.3)] scale-105' : readerTheme === 'dark' ? 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-brand-magenta hover:shadow-md hover:scale-105' : 'bg-white/50 border-gray-200/60 text-slate-500 hover:bg-white/80 hover:text-brand-magenta hover:shadow-md hover:scale-105'}`}
              title="العلامات المرجعية"
            >
              <Bookmark className="h-5 w-5" />
            </button>

            {showBookmarks && (
              <div className={`fixed inset-x-3 top-16 md:absolute md:top-full md:left-0 md:inset-x-auto mt-2 w-auto md:w-64 backdrop-blur-2xl border rounded-3xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 ${readerTheme === 'dark' ? 'bg-[#0d071a]/95 border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.7)]' : 'bg-white/95 border-gray-200 shadow-xl text-slate-900'}`}>
                <div className="p-3 border-b border-border/50 mb-2">
                  <h3 className="font-bold text-sm">العلامات المرجعية</h3>
                </div>
                <div className="max-h-60 overflow-y-auto custom-scrollbar flex flex-col gap-1 p-1">
                  {bookmarks.length === 0 ? (
                    <div className="py-6 text-center opacity-60 text-xs font-semibold">
                      لا يوجد صفحات محفوظة حالياً.
                    </div>
                  ) : (
                    bookmarks.map(page => (
                      <button
                        key={page}
                        onClick={() => { setCurrentPage(page); setShowBookmarks(false); }}
                        className={`group flex items-center justify-between p-2.5 rounded-xl transition-all duration-300 ${currentPage === page ? 'bg-brand-magenta/10 text-brand-magenta' : 'hover:bg-brand-magenta/5 dark:hover:bg-brand-magenta/10 hover:pr-3 hover:text-brand-magenta'}`}
                      >
                        <span className="text-xs font-bold truncate flex-1 text-right">صفحة {page}</span>
                        <BookmarkCheck className={`h-4 w-4 transition-all duration-300 ${currentPage === page ? 'opacity-100' : 'opacity-50 group-hover:opacity-100 group-hover:scale-110'}`} />
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>


          <button
            onClick={() => { setShowSettings(!showSettings); setShowBookmarks(false); }}
            className={`hidden md:flex w-10 h-10 rounded-xl justify-center items-center transition-all duration-300 backdrop-blur-md border shadow-sm ${showSettings ? 'bg-brand-blue/20 border-brand-blue/40 text-brand-blue shadow-[0_0_15px_rgba(43,127,255,0.3)] scale-105' : readerTheme === 'dark' ? 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-brand-blue hover:shadow-md hover:scale-105' : 'bg-white/50 border-gray-200/60 text-slate-500 hover:bg-white/80 hover:text-brand-blue hover:shadow-md hover:scale-105'}`}
            title="إعدادات القراءة"
          >
            <Settings2 className="h-5 w-5" />
          </button>

          {/* Settings Dropdown (Pops out below) */}
          {showSettings && (
            <div className={`fixed inset-x-3 top-16 md:absolute md:top-full md:left-0 md:inset-x-auto mt-2 w-auto md:w-[300px] max-h-[85vh] overflow-y-auto backdrop-blur-2xl border rounded-2xl shadow-2xl p-5 z-50 animate-in fade-in slide-in-from-top-4 duration-300 origin-top-left ${readerTheme === 'dark' ? 'bg-[#0d071a]/95 border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.7)] text-white' : 'bg-white/95 border-gray-200 shadow-xl text-slate-800'}`}>

              {/* Reading Mode */}
              <div className="mb-6">
                <label className={`text-[11px] font-bold mb-3 block uppercase tracking-wider ${readerTheme === 'dark' ? 'text-white/50' : 'text-slate-400'}`}>نمط القراءة</label>
                <div className="flex gap-2">
                  <button onClick={() => handleSetReadingMode('paged')} className={`flex-1 py-2.5 rounded-2xl border transition-all duration-300 ${readingMode === 'paged' ? 'border-brand-blue bg-brand-blue/10 text-brand-blue shadow-sm scale-105' : readerTheme === 'dark' ? 'border-white/10 hover:bg-white/10 text-white/60 hover:text-white hover:border-white/20' : 'border-black/10 hover:bg-black/5 text-slate-600 hover:text-slate-900'} flex flex-col items-center justify-center gap-1.5`}>
                    <BookText className="h-5 w-5" />
                    <span className="text-[10px] font-bold">صفحة بصفحة</span>
                  </button>
                  <button onClick={() => handleSetReadingMode('continuous')} className={`flex-1 py-2.5 rounded-2xl border transition-all duration-300 ${readingMode === 'continuous' ? 'border-brand-blue bg-brand-blue/10 text-brand-blue shadow-sm scale-105' : readerTheme === 'dark' ? 'border-white/10 hover:bg-white/10 text-white/60 hover:text-white hover:border-white/20' : 'border-black/10 hover:bg-black/5 text-slate-600 hover:text-slate-900'} flex flex-col items-center justify-center gap-1.5`}>
                    <AlignJustify className="h-5 w-5" />
                    <span className="text-[10px] font-bold">تصفح متصل</span>
                  </button>
                </div>
              </div>

              {/* Tashkeel Toggle */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className={`text-[11px] font-bold block uppercase tracking-wider ${readerTheme === 'dark' ? 'text-white/50' : 'text-slate-400'}`}>
                    علامات التشكيل
                  </label>
                  <span className={`text-[10px] font-bold ${getAccentTextClass()}`}>
                    {showTashkeel ? 'مُشَكَّل' : 'بدون تشكيل'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTashkeel(true);
                      setShowSettings(false);
                    }}
                    className={`flex-1 py-2 rounded-xl border transition-all text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      showTashkeel
                        ? getActiveAccentClass()
                        : 'border-border/50 hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground'
                    }`}
                  >
                    <span className="font-amiri text-base font-black leading-none">عَـ</span>
                    <span>إظهار التشكيل</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTashkeel(false);
                      setShowSettings(false);
                    }}
                    className={`flex-1 py-2 rounded-xl border transition-all text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      !showTashkeel
                        ? getActiveAccentClass()
                        : 'border-border/50 hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground'
                    }`}
                  >
                    <span className="font-amiri text-base font-black leading-none">عـ</span>
                    <span>إخفاء التشكيل</span>
                  </button>
                </div>
              </div>

              {/* Theme Lighting & Accent Colors */}
              <div className="mb-6">
                <label className={`text-[11px] font-bold mb-3 block uppercase tracking-wider ${isDark ? 'text-white/50' : 'text-slate-400'}`}>نمط الإضاءة</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (theme === 'dark') toggleTheme();
                      setReaderTheme('light');
                    }}
                    className={`flex-1 py-2.5 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                      theme === 'light'
                        ? `${getActiveAccentClass()} scale-105`
                        : isDark
                          ? 'border-white/10 hover:bg-white/10 text-white/60 hover:text-white hover:border-white/20'
                          : 'border-black/10 hover:bg-black/5 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sun className="h-5 w-5 text-amber-500" />
                    <span className="text-[10px] font-bold">نهاري (فاتح)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (theme === 'light') toggleTheme();
                      setReaderTheme('dark');
                    }}
                    className={`flex-1 py-2.5 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                      theme === 'dark'
                        ? `${getActiveAccentClass()} scale-105`
                        : isDark
                          ? 'border-white/10 hover:bg-white/10 text-white/60 hover:text-white hover:border-white/20'
                          : 'border-black/10 hover:bg-black/5 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Moon className="h-5 w-5 text-indigo-400" />
                    <span className="text-[10px] font-bold">ليلي (داكن)</span>
                  </button>
                </div>
              </div>

              {/* Theme Accent Color */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className={`text-[11px] font-bold block uppercase tracking-wider ${isDark ? 'text-white/50' : 'text-slate-400'}`}>
                    لون السمة
                  </label>
                  <span className={`text-[10px] font-bold ${
                    accentColor === 'emerald' ? 'text-teal-400' :
                    accentColor === 'amber' ? 'text-[#dfbf83]' :
                    accentColor === 'blue' ? 'text-blue-400' :
                    'text-purple-400'
                  }`}>
                    {accentColor === 'purple' && 'أرجواني ملكي'}
                    {accentColor === 'emerald' && 'فيروزي إسلامي'}
                    {accentColor === 'amber' && 'عاجي إسلامي'}
                    {accentColor === 'blue' && 'أزرق ياقوتي'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {THEME_ACCENTS.map((item) => {
                    const isSelected = accentColor === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setAccentColor(item.id)}
                        className={`group flex flex-col items-center gap-1.5 py-2 px-1 rounded-2xl border transition-all active:scale-95 cursor-pointer ${
                          isSelected
                            ? isDark
                              ? 'border-white/25 bg-white/10 shadow-xs scale-102'
                              : 'border-black/15 bg-black/5 shadow-xs scale-102'
                            : isDark
                              ? 'border-white/5 hover:border-white/15 hover:bg-white/5'
                              : 'border-black/5 hover:border-black/15 hover:bg-black/5'
                        }`}
                      >
                        <span
                          className={`h-6 w-6 rounded-full bg-gradient-to-tr ${item.gradient} transition-all duration-300 ${
                            isSelected
                              ? `ring-2 ${item.ring} ring-offset-2 ${isDark ? 'ring-offset-[#0d071a]' : 'ring-offset-white'} scale-110 shadow-md`
                              : 'scale-90 opacity-70 group-hover:opacity-100 group-hover:scale-95'
                          }`}
                        />
                        <span
                          className={`text-[10px] leading-tight transition-colors ${
                            isSelected
                              ? (isDark ? 'font-bold text-white' : 'font-bold text-stone-900')
                              : (isDark ? 'font-medium text-white/60' : 'font-medium text-stone-600')
                          }`}
                        >
                          {item.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>


              {/* Font Size */}
              <div className="mb-6">
                <label className={`text-[11px] font-bold mb-3 flex justify-between uppercase tracking-wider ${readerTheme === 'dark' ? 'text-white/50' : 'text-slate-400'}`}>
                  <span>حجم الخط</span>
                  <span className="text-brand-blue">{fontSize}px</span>
                </label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setFontSize(s => Math.max(14, s - 2))} className={`p-2 rounded-xl transition-all duration-200 active:scale-90 ${readerTheme === 'dark' ? 'bg-white/10 hover:bg-white/20 text-white/80' : 'bg-black/5 hover:bg-black/10 text-slate-700'}`}>
                    <Type className="h-4 w-4" />
                  </button>
                  <input type="range" min="14" max="40" step="2" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className={`flex-1 accent-brand-blue h-2 rounded-full appearance-none outline-none transition-colors ${readerTheme === 'dark' ? 'bg-white/20 hover:bg-white/30' : 'bg-black/10 hover:bg-black/20'}`} />
                  <button onClick={() => setFontSize(s => Math.min(40, s + 2))} className={`p-2 rounded-xl transition-all duration-200 active:scale-90 ${readerTheme === 'dark' ? 'bg-white/10 hover:bg-white/20 text-white/80' : 'bg-black/5 hover:bg-black/10 text-slate-700'}`}>
                    <Type className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Font Family Dropdown */}
              <div>
                <label className={`text-[11px] font-bold mb-2 block uppercase tracking-wider ${readerTheme === 'dark' ? 'text-white/50' : 'text-slate-400'}`}>خط القراءة</label>
                <div className="relative">
                  <select
                    value={fontFamily === 'font-read' ? 'font-amiri' : fontFamily === 'font-sans' ? 'font-cairo' : fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className={`w-full appearance-none px-4 py-2.5 pl-10 rounded-2xl text-sm font-semibold transition-all cursor-pointer outline-none border ${readerTheme === 'dark'
                      ? 'bg-white/10 text-white border-white/15 focus:border-brand-blue hover:bg-white/15'
                      : 'bg-slate-100 text-slate-800 border-slate-200 focus:border-brand-blue hover:bg-slate-200/70'
                      }`}
                  >
                    <option value="font-amiri" className="font-amiri text-slate-900 bg-white dark:bg-slate-900 dark:text-white py-1">الخط الأميري</option>
                    <option value="font-scheherazade" className="font-scheherazade text-slate-900 bg-white dark:bg-slate-900 dark:text-white py-1">خط شهرزاد</option>
                    <option value="font-noto-naskh" className="font-noto-naskh text-slate-900 bg-white dark:bg-slate-900 dark:text-white py-1">خط النسخ</option>
                    <option value="font-cairo" className="font-cairo text-slate-900 bg-white dark:bg-slate-900 dark:text-white py-1">خط القاهرة</option>
                  </select>
                  <ChevronDown className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${readerTheme === 'dark' ? 'text-white/60' : 'text-slate-500'
                    }`} />
                </div>
              </div>
            </div>
          )}

          {/* Mobile Fast Action Buttons (Unified Settings Button) */}
          <div className="flex md:hidden items-center gap-1.5 shrink-0" ref={mobileMenuRef}>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`h-9 w-9 rounded-full flex items-center justify-center border transition-all active:scale-95 cursor-pointer shrink-0 ${
                isMobileMenuOpen
                  ? 'bg-brand-blue/20 border-brand-blue/40 text-brand-blue ring-2 ring-brand-blue/30'
                  : getNavCircleBtnStyle()
              }`}
              title="إعدادات وخيارات القراءة"
              aria-label="إعدادات وخيارات القراءة"
            >
              <Settings2 className="h-4.5 w-4.5" strokeWidth={2.2} />
            </button>

            {typeof document !== 'undefined' && createPortal(
              <AnimatePresence>
                {isMobileMenuOpen && (
                  <div dir="rtl" ref={mobileSettingsSheetRef}>
                    {/* غطاء خلفي زجاجي شفاف ومضبب يغطي الصفحة بالكامل ويغلق القائمة عند النقر عليه */}
                    <motion.div
                      key="mobile-settings-backdrop"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="fixed inset-0 z-[90] bg-black/40 dark:bg-black/60 backdrop-blur-md cursor-pointer"
                    />

                    {/* درج سفلي زجاجي (Bottom Sheet) يرتفع بنعومة وانسيابية هادئة */}
                    <motion.div
                      key="mobile-settings-sheet"
                      initial={{ y: '100%', opacity: 0.7 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: '100%', opacity: 0.7 }}
                      transition={{
                        duration: 0.42,
                        ease: [0.16, 1, 0.3, 1]
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={`fixed inset-x-0 bottom-0 z-[100] h-[88vh] max-h-[92vh] flex flex-col rounded-t-xl border-t shadow-2xl backdrop-blur-2xl overflow-hidden ${
                        readerTheme === 'dark'
                          ? 'bg-[#0f1422]/95 border-white/15 text-white shadow-black/80'
                          : readerTheme === 'sepia'
                            ? 'bg-[#FAF5ED]/95 border-[#E2D6C0] text-[#3D2C1D] shadow-xl'
                            : 'bg-white/95 border-slate-200/90 text-slate-900 shadow-2xl'
                      }`}
                    >
                    {/* رأس الدرج: مقبض السحب + العنوان وزر الإغلاق الثابت */}
                    <div className="shrink-0 px-4 pt-2.5 pb-3 border-b border-border/40">
                      <div className="w-10 h-1 rounded-full bg-black/15 dark:bg-white/20 mx-auto mb-2.5" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold flex items-center gap-2">
                          <Settings2 className={`w-4 h-4 ${getAccentTextClass()}`} />
                          <span>إعدادات وخيارات القراءة</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`w-7.5 h-7.5 rounded-full border flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs ${
                            readerTheme === 'dark'
                              ? 'border-white/15 bg-white/5 text-white/70 hover:bg-white/15 hover:text-white hover:border-white/25'
                              : readerTheme === 'sepia'
                                ? 'border-[#E2D6C0] bg-[#FAF5ED] text-[#7A401A] hover:bg-[#F2E5D0] hover:text-[#5C3012] hover:border-[#D4C0A2]'
                                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300'
                          }`}
                          aria-label="إغلاق الإعدادات"
                          title="إغلاق"
                        >
                          <X className="w-4 h-4" strokeWidth={2.2} />
                        </button>
                      </div>
                    </div>

                    {/* جسم المحتوى الداخلي القابل للتمرير: السكرول بار يظل محصوراً بالداخل بنظافة */}
                    <div
                      className="flex-1 overflow-y-auto px-4 py-3 no-scrollbar flex flex-col gap-3.5"
                      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1.5rem)' }}
                    >
                      {/* 1. تكبير الشاشة */}
                      <button
                        type="button"
                        onClick={() => {
                          setDistractionFree(true);
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex items-center justify-between p-2.5 rounded-2xl border border-border/40 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-xs font-bold cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${getAccentIconBgClass()}`}>
                            <Maximize className="w-4 h-4" />
                          </div>
                          <span>تكبير الشاشة</span>
                        </div>
                      </button>

                      {/* 2. تحميل الكتاب (قائمة منسدلة داخلية) */}
                      <div className="shrink-0 grow-0 basis-auto flex flex-col rounded-2xl border border-border/40 overflow-hidden transition-all">
                        <button
                          type="button"
                          onClick={() => setIsMobileDownloadExpanded(!isMobileDownloadExpanded)}
                          className="flex items-center justify-between p-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-xs font-bold cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${getAccentIconBgClass()}`}>
                              <Download className="w-4 h-4" />
                            </div>
                            <span>تحميل الكتاب</span>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isMobileDownloadExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        {isMobileDownloadExpanded && (
                          <div className="p-2 border-t border-border/30 bg-black/[0.02] dark:bg-white/[0.02] flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                            {/* حفظ أوفلاين */}
                            <button
                              type="button"
                              onClick={handleToggleOfflineSave}
                              disabled={isSavingOffline}
                              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-right cursor-pointer ${
                                isSavedOffline ? getAccentTextClass() + ' font-bold' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <HardDriveDownload className={`w-4 h-4 ${getAccentTextClass()}`} />
                                <span>
                                  {isSavingOffline
                                    ? `جاري الحفظ (${offlineSaveProgress}%)...`
                                    : isSavedOffline
                                      ? 'محفوظ أوفلاين (إزالة)'
                                      : 'حفظ للقراءة دون إنترنت (Offline)'}
                                </span>
                              </div>
                              {isSavingOffline ? (
                                <Loader2 className={`w-3.5 h-3.5 animate-spin ${getAccentTextClass()}`} />
                              ) : isSavedOffline ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : null}
                            </button>

                            {/* تحميل TXT */}
                            <button
                              type="button"
                              onClick={() => handleExport('txt')}
                              disabled={isExporting}
                              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-right cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <FileDown className={`w-4 h-4 ${getAccentTextClass()}`} />
                                <span>تحميل متن الكتاب (TXT)</span>
                              </div>
                              {isExporting ? <Loader2 className={`w-3.5 h-3.5 animate-spin ${getAccentTextClass()}`} /> : null}
                            </button>

                            {/* تحميل JSON */}
                            <button
                              type="button"
                              onClick={() => handleExport('json')}
                              disabled={isExporting}
                              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-right cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <BookCheck className={`w-4 h-4 ${getAccentTextClass()}`} />
                                <span>بيانات وفهرس (JSON)</span>
                              </div>
                            </button>

                            {/* تحميل PDF إذا متوفر */}
                            {(volumePdfList.length > 0 || hasBookPdf(book)) && (
                              <button
                                type="button"
                                onClick={() => handleOpenOrDownloadPdf()}
                                disabled={loadingPdf}
                                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-right cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <FileDown className={`w-4 h-4 ${getAccentTextClass()}`} />
                                  <span>
                                    {volumePdfList.length > 1
                                      ? `تحميل الـ PDF (${volumePdfList.length} مجلدات)`
                                      : 'تحميل النسخة المصورة (PDF)'}
                                  </span>
                                </div>
                                {loadingPdf ? (
                                  <Loader2 className={`w-3.5 h-3.5 animate-spin ${getAccentTextClass()}`} />
                                ) : (
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${getAccentIconBgClass()}`}>
                                    PDF
                                  </span>
                                )}
                              </button>
                            )}

                            {isExporting && exportProgressText && (
                              <p className="text-[10px] text-muted-foreground px-3 py-1 animate-pulse">
                                {exportProgressText}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 3. العلامات المرجعية */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowBookmarks(true);
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex items-center justify-between p-2.5 rounded-2xl border border-border/40 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-xs font-bold cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${getAccentIconBgClass()}`}>
                            <Bookmark className="w-4 h-4" />
                          </div>
                          <span>العلامات المرجعية</span>
                        </div>
                        <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${getAccentIconBgClass()}`}>
                          {bookmarks.length}
                        </span>
                      </button>

                      {/* فاصل */}
                      <div className="w-full h-px bg-border/40 my-0.5" />

                      {/* 4. طريقة عرض الصفحة (نمط القراءة) */}
                      <div>
                        <label className={`text-[11px] font-bold mb-2 block uppercase tracking-wider ${readerTheme === 'dark' ? 'text-white/50' : 'text-slate-400'}`}>
                          طريقة عرض الصفحة
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              handleSetReadingMode('paged');
                              setIsMobileMenuOpen(false);
                            }}
                            className={`flex-1 py-2.5 rounded-xl border transition-all text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                              readingMode === 'paged'
                                ? getActiveAccentClass()
                                : 'border-border/50 hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground'
                            }`}
                          >
                            <BookText className="h-4 w-4" />
                            <span>صفحة بصفحة</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleSetReadingMode('continuous');
                              setIsMobileMenuOpen(false);
                            }}
                            className={`flex-1 py-2.5 rounded-xl border transition-all text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                              readingMode === 'continuous'
                                ? getActiveAccentClass()
                                : 'border-border/50 hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground'
                            }`}
                          >
                            <AlignJustify className="h-4 w-4" />
                            <span>تصفح متصل</span>
                          </button>
                        </div>
                      </div>

                      {/* 5. علامات التشكيل */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className={`text-[11px] font-bold block uppercase tracking-wider ${readerTheme === 'dark' ? 'text-white/50' : 'text-slate-400'}`}>
                            علامات التشكيل
                          </label>
                          <span className={`text-[10px] font-bold ${getAccentTextClass()}`}>
                            {showTashkeel ? 'مُشَكَّل' : 'بدون تشكيل'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowTashkeel(true);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`flex-1 py-2.5 rounded-xl border transition-all text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                              showTashkeel
                                ? getActiveAccentClass()
                                : 'border-border/50 hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground'
                            }`}
                          >
                            <span className="font-amiri text-base font-black leading-none">عَـ</span>
                            <span>إظهار التشكيل</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowTashkeel(false);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`flex-1 py-2.5 rounded-xl border transition-all text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                              !showTashkeel
                                ? getActiveAccentClass()
                                : 'border-border/50 hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground'
                            }`}
                          >
                            <span className="font-amiri text-base font-black leading-none">عـ</span>
                            <span>إخفاء التشكيل</span>
                          </button>
                        </div>
                      </div>

                      {/* 6. نمط الإضاءة */}
                      <div>
                        <label className={`text-[11px] font-bold mb-2 block uppercase tracking-wider ${isDark ? 'text-white/50' : 'text-slate-400'}`}>
                          نمط الإضاءة
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (theme === 'dark') toggleTheme();
                              setReaderTheme('light');
                            }}
                            className={`flex-1 py-2 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                              theme === 'light'
                                ? getActiveAccentClass()
                                : 'border-border/50 hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground'
                            }`}
                          >
                            <Sun className="h-4 w-4 text-amber-500" />
                            <span className="text-[10px] font-bold">نهاري (فاتح)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (theme === 'light') toggleTheme();
                              setReaderTheme('dark');
                            }}
                            className={`flex-1 py-2 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                              theme === 'dark'
                                ? getActiveAccentClass()
                                : 'border-border/50 hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground'
                            }`}
                          >
                            <Moon className="h-4 w-4 text-indigo-400" />
                            <span className="text-[10px] font-bold">ليلي (داكن)</span>
                          </button>
                        </div>

                        {/* لون السمة */}
                        <div className="mt-3.5">
                          <div className="flex items-center justify-between mb-2">
                            <label className={`text-[11px] font-bold block uppercase tracking-wider ${isDark ? 'text-white/50' : 'text-slate-400'}`}>
                              لون السمة
                            </label>
                            <span className={`text-[10px] font-bold ${getAccentTextClass()}`}>
                              {accentColor === 'purple' && 'أرجواني'}
                              {accentColor === 'emerald' && 'فيروزي'}
                              {accentColor === 'amber' && 'عاجي'}
                              {accentColor === 'blue' && 'ياقوتي'}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {THEME_ACCENTS.map((item) => {
                              const isSelected = accentColor === item.id;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => setAccentColor(item.id)}
                                  className={`group flex flex-col items-center gap-1.5 py-2 px-1 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                                    isSelected
                                      ? isDark
                                        ? 'border-white/25 bg-white/10 shadow-xs'
                                        : 'border-black/15 bg-black/5 shadow-xs'
                                      : isDark
                                        ? 'border-white/5 hover:border-white/15 hover:bg-white/5'
                                        : 'border-black/5 hover:border-black/15 hover:bg-black/5'
                                  }`}
                                >
                                  <span
                                    className={`h-6 w-6 rounded-full bg-gradient-to-tr ${item.gradient} transition-all duration-300 ${
                                      isSelected
                                        ? `ring-2 ${item.ring} ring-offset-2 ${isDark ? 'ring-offset-[#120324]' : 'ring-offset-white'} scale-110 shadow-md`
                                        : 'scale-90 opacity-70 group-hover:opacity-100 group-hover:scale-95'
                                    }`}
                                  />
                                  <span
                                    className={`text-[10px] leading-tight transition-colors ${
                                      isSelected
                                        ? (isDark ? 'font-bold text-white' : 'font-bold text-stone-900')
                                        : (isDark ? 'font-medium text-white/60' : 'font-medium text-stone-600')
                                    }`}
                                  >
                                    {item.name}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* 6. حجم الخط */}
                      <div>
                        <label className={`text-[11px] font-bold mb-2 flex justify-between uppercase tracking-wider ${readerTheme === 'dark' ? 'text-white/50' : 'text-slate-400'}`}>
                          <span>حجم الخط</span>
                          <span className={`font-mono font-bold ${getAccentTextClass()}`}>{fontSize}px</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setFontSize((s) => Math.max(14, s - 2))}
                            className={`p-2 rounded-xl transition-all cursor-pointer ${readerTheme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'}`}
                            title="تصغير الخط"
                          >
                            <Type className="h-3.5 w-3.5" />
                          </button>
                          <input
                            type="range"
                            min="14"
                            max="40"
                            step="2"
                            value={fontSize}
                            onChange={(e) => setFontSize(Number(e.target.value))}
                            className={`flex-1 ${getAccentSliderClass()} h-2 rounded-full appearance-none outline-none cursor-pointer ${
                              readerTheme === 'dark' ? 'bg-white/20' : 'bg-black/10'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setFontSize((s) => Math.min(40, s + 2))}
                            className={`p-2 rounded-xl transition-all cursor-pointer ${readerTheme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'}`}
                            title="تكبير الخط"
                          >
                            <Type className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </div>

                      {/* 7. خط القراءة (قائمة بطاقة منسدلة مطابقة لتصميم خيارات التحميل) */}
                      <div className="shrink-0 grow-0 basis-auto flex flex-col rounded-2xl border border-border/40 overflow-hidden transition-all">
                        <button
                          type="button"
                          onClick={() => setIsMobileFontExpanded(!isMobileFontExpanded)}
                          className="flex items-center justify-between p-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-xs font-bold cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${getAccentIconBgClass()}`}>
                              <Type className="w-4 h-4" />
                            </div>
                            <div className="flex items-center gap-1.5 text-right">
                              <span className="text-xs font-semibold text-muted-foreground shrink-0">خط القراءة:</span>
                              <span className={`text-xs font-bold text-foreground translate-y-[2.5px] leading-none ${(FONT_OPTIONS.find(f => f.id === (fontFamily === 'font-read' ? 'font-amiri' : fontFamily === 'font-sans' ? 'font-cairo' : fontFamily)) || FONT_OPTIONS[0]).class}`}>
                                {(FONT_OPTIONS.find(f => f.id === (fontFamily === 'font-read' ? 'font-amiri' : fontFamily === 'font-sans' ? 'font-cairo' : fontFamily)) || FONT_OPTIONS[0]).name}
                              </span>
                            </div>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isMobileFontExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        {isMobileFontExpanded && (
                          <div className="p-2 border-t border-border/30 bg-black/[0.02] dark:bg-white/[0.02] flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                            {FONT_OPTIONS.map((f) => {
                              const isSelected = (fontFamily === 'font-read' ? 'font-amiri' : fontFamily === 'font-sans' ? 'font-cairo' : fontFamily) === f.id;
                              return (
                                <button
                                  key={f.id}
                                  type="button"
                                  onClick={() => {
                                    setFontFamily(f.id);
                                    setIsMobileFontExpanded(false);
                                  }}
                                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    isSelected
                                      ? getActiveAccentClass()
                                      : 'hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground'
                                  }`}
                                >
                                  <span className={`${f.class} text-sm`}>{f.name}</span>
                                  {isSelected && <Check className="w-3.5 h-3.5" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>,
            document.body
          )}
          </div>
        </div>
      </div>

        {/* Horizontal Scrollable Heading Hierarchy Strip (شريط تسلسل العناوين القابل للتمرير باللمس) */}
        {activeHierarchy.length > 0 && (
          <div
            className={`w-full flex items-center px-3 sm:px-4 py-1 md:py-1.5 border-t overflow-x-auto no-scrollbar scroll-smooth transition-colors duration-200 select-none ${
              readerTheme === 'dark'
                ? 'border-white/5 bg-black/25 text-white/80'
                : 'border-black/5 bg-black/[0.02] text-slate-700'
            }`}
          >
            <div className="flex items-center gap-1.5 whitespace-nowrap text-[10px] sm:text-[11px] leading-tight min-w-max">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getAccentDotColor()} animate-pulse`} />
              {activeHierarchy.map((item, idx) => {
                const isCurrent = idx === activeHierarchy.length - 1;
                return (
                  <React.Fragment key={idx}>
                    <span
                      className={`transition-colors truncate max-w-[200px] sm:max-w-[340px] ${
                        isCurrent
                          ? `font-bold ${
                              accentColor === 'amber'
                                ? 'text-amber-600 dark:text-[#dfbf83]'
                                : accentColor === 'emerald'
                                  ? 'text-teal-700 dark:text-teal-300'
                                  : accentColor === 'blue'
                                    ? 'text-blue-600 dark:text-blue-300'
                                    : 'text-brand-magenta dark:text-purple-300'
                            }`
                          : 'opacity-65 hover:opacity-100 font-medium'
                      }`}
                      title={item}
                    >
                      {item}
                    </span>
                    {!isCurrent && (
                      <ChevronLeft className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* In-Page Quick Search Sub-Bar (Isolated 60fps component with 0ms typing latency) */}
        <PageQuickSearchBar
          isOpen={isPageSearchOpen}
          readerTheme={readerTheme}
          accentColor={accentColor}
          onSearchQueryChange={(q) => setPageSearchQuery(q)}
          onClose={() => {
            setIsPageSearchOpen(false);
            setPageSearchQuery('');
          }}
          pageMatchesCount={pageMatchesCount}
          activeMatchIndex={activeMatchIndex}
          onPrevMatch={handlePrevPageMatch}
          onNextMatch={handleNextPageMatch}
          onSearchInBook={(q) => {
            setBookSearchQuery(q);
            setSidebarTab('search');
            setIsPageSearchOpen(false);
          }}
        />
      </header>

      {/* Main Workspace Container */}
      <div className="flex-1 flex overflow-hidden w-full relative p-0 sm:p-2 md:p-4 gap-0 md:gap-4">


        {/* Sliding Panel Area (TOC / Chat / Search / Hadiths) */}
        <aside
          className={`shrink-0 md:h-full max-md:h-auto relative rounded-3xl overflow-hidden ${isResizing ? '' : 'transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]'} z-30 ${distractionFree || sidebarTab === 'none' ? 'opacity-0 border-none pointer-events-none' : 'opacity-100 border'
            } ${readerTheme === 'dark' ? 'border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]' : 'border-gray-200/80 bg-white/90 shadow-xl text-slate-900'} backdrop-blur-xl max-md:fixed max-md:inset-x-0 max-md:top-0 max-md:bottom-[calc(3.75rem+env(safe-area-inset-bottom,0px))] sm:max-md:bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] max-md:z-40 max-md:w-full max-md:rounded-none max-md:border-none md:relative md:rounded-3xl`}
          style={{
            width: typeof window !== 'undefined' && window.innerWidth < 768
              ? (distractionFree || sidebarTab === 'none' ? 0 : '100%')
              : (distractionFree || sidebarTab === 'none' ? 0 : sidebarWidth),
            backgroundColor: readerTheme === 'dark' ? getReaderFrameBgColor(darkFrameOpacity) : undefined
          }}
        >


          <div className="w-full h-full flex flex-col relative">
            {readerTheme === 'dark' && (
              <>
                <div className={`absolute -top-32 -right-32 w-64 h-64 ${accentColor === 'amber' ? 'bg-amber-500/5' : 'bg-brand-magenta/15'} rounded-full blur-[80px] pointer-events-none`}></div>
                <div className={`absolute -bottom-32 -left-32 w-64 h-64 ${accentColor === 'amber' ? 'bg-[#dfbf83]/5' : 'bg-brand-blue/15'} rounded-full blur-[80px] pointer-events-none`}></div>
              </>
            )}

            {/* Header of the sliding panel */}
            <div className={`flex items-center justify-between p-4 border-b ${readerTheme === 'dark' ? 'border-white/5 bg-white/[0.02] text-white' : 'border-gray-200/60 bg-white/50 text-slate-900'}`}>
              <div className="flex items-center gap-2 min-w-0">
                {sidebarTab === 'toc' && (
                  availableVolumes.length > 1 && selectedVolumeForToc ? (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          setHasUserNavigatedToAllVolumes(true);
                          setSelectedVolumeForToc(null);
                        }}
                        className="flex items-center gap-1.5 font-bold text-sm sm:text-base text-inherit hover:opacity-75 transition-opacity cursor-pointer p-0 bg-transparent border-0 shrink-0"
                        title="الرجوع إلى فهرس المحتوى"
                      >
                        <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                        <span>فهرس المحتوى</span>
                      </button>
                      <span className="text-muted-foreground/40 font-normal text-sm sm:text-base shrink-0">/</span>
                      <h3 className="font-bold text-sm sm:text-base truncate">
                        {formatVolumeTitle(selectedVolumeForToc)}
                      </h3>
                      {currentSelectedVolNode?.totalChapters !== undefined && currentSelectedVolNode.totalChapters > 0 && (
                        <span className="text-[11px] font-semibold opacity-60 shrink-0">
                          ({toEasternArabicNumerals(currentSelectedVolNode.totalChapters)} باب)
                        </span>
                      )}
                    </div>
                  ) : (
                    <h3 className="font-bold text-base flex items-center gap-2">
                      <Menu className={`h-4 w-4 ${accentColor === 'amber' ? 'text-[#b88d46]' : accentColor === 'emerald' ? 'text-teal-600' : accentColor === 'blue' ? 'text-blue-600' : 'text-brand-magenta'}`} />
                      <span>فهرس المحتويات</span>
                      {availableVolumes.length > 1 && (
                        <span className="text-xs font-normal opacity-60">
                          ({toEasternArabicNumerals(availableVolumes.length)} مجلدات)
                        </span>
                      )}
                    </h3>
                  )
                )}
                {sidebarTab === 'search' && <h3 className="font-bold text-base flex items-center gap-2"><Search className={`h-4 w-4 ${accentColor === 'amber' ? 'text-[#b88d46]' : accentColor === 'emerald' ? 'text-teal-600' : accentColor === 'blue' ? 'text-blue-600' : 'text-brand-magenta'}`} /> البحث في نصوص الكتاب</h3>}
                {sidebarTab === 'hadiths' && <h3 className="font-bold text-base flex items-center gap-2"><Hash className="h-4 w-4 text-amber-500" /> {numberedItemsLabel.full}</h3>}
                {sidebarTab === 'highlights' && (
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <Highlighter className={`h-4 w-4 ${getHighlightHeaderIconClass()}`} />
                    <span>النصوص المظللة</span>
                    {highlights.length > 0 && (
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getHighlightsCountBadgeStyle()}`}>
                        {toEasternArabicNumerals(highlights.length)}
                      </span>
                    )}
                  </h3>
                )}
              </div>
              <div className="flex items-center gap-2">
                {sidebarTab === 'highlights' && highlights.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllHighlights}
                    className="text-[10px] font-bold text-rose-500 hover:bg-rose-500/10 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                    title="حذف جميع التظليلات"
                  >
                    مسح الكل
                  </button>
                )}
                <button
                  onClick={() => setSidebarTab('none')}
                  className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all duration-200 active:scale-95 shadow-sm hover:scale-105 ${readerTheme === 'dark'
                    ? 'bg-white/10 border-white/20 text-white/90 hover:bg-white/20 hover:text-white shadow-black/40'
                    : 'bg-white/80 border-slate-300/80 text-slate-700 hover:bg-white hover:text-slate-900 hover:border-slate-400 shadow-slate-900/5'
                    }`}
                  title="إغلاق اللوحة"
                >
                  <X className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
              {/* TOC Panel */}
              <div className={`absolute inset-0 flex flex-col transition-all duration-300 ${sidebarTab === 'toc' ? 'opacity-100 translate-x-0 z-10' : 'opacity-0 translate-x-4 pointer-events-none -z-10'}`}>
                <div className="p-4">
                  <div className="relative group">
                    <Search className={`absolute right-3 top-3 h-4 w-4 text-muted-foreground transition-colors ${accentColor === 'amber' ? 'group-focus-within:text-[#b88d46]' : accentColor === 'emerald' ? 'group-focus-within:text-teal-600' : accentColor === 'blue' ? 'group-focus-within:text-blue-600' : 'group-focus-within:text-brand-magenta'}`} />
                    <input
                      type="text"
                      placeholder="ابحث في العناوين..."
                      value={tocSearch}
                      onChange={(e) => setTocSearch(e.target.value)}
                      className={`w-full rounded-2xl pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 ${accentColor === 'amber' ? 'focus:ring-amber-500' : accentColor === 'emerald' ? 'focus:ring-teal-500' : accentColor === 'blue' ? 'focus:ring-blue-500' : 'focus:ring-brand-magenta'} transition-all shadow-inner ${readerTheme === 'dark' ? 'bg-white/5 border border-white/10 text-white placeholder-white/40 focus:bg-white/10' : 'bg-slate-100 text-slate-900 placeholder-slate-400 border border-slate-200'}`}
                    />
                    {tocSearch && (
                      <button
                        type="button"
                        onClick={() => setTocSearch('')}
                        className="absolute left-3 top-3 text-muted-foreground hover:text-foreground p-0.5 rounded-full transition-colors cursor-pointer"
                        title="مسح البحث"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
                  {loadingBook ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
                      <Loader2 className={`h-9 w-9 animate-spin ${getPaginationLayersIconClass()}`} />
                      <div className="text-center space-y-1.5">
                        <p className={`text-sm font-bold ${readerTheme === 'dark' ? 'text-slate-100' : readerTheme === 'sepia' ? 'text-[#422d19]' : 'text-slate-800'}`}>
                          جاري تحميل الفهرس...
                        </p>
                        <p className={`text-xs font-medium ${readerTheme === 'dark' ? 'text-slate-400' : readerTheme === 'sepia' ? 'text-[#705232]' : 'text-slate-500'}`}>
                          قد يستغرق بضع ثوانٍ في الكتب والموسوعات الكبرى
                        </p>
                      </div>
                    </div>
                  ) : toc.length === 0 ? (
                    <div className={`p-6 text-center text-xs rounded-2xl mt-4 flex flex-col items-center gap-3 ${readerTheme === 'dark' ? 'bg-white/5 text-white/70' : 'bg-black/5 text-black/70'}`}>
                      <p className="font-bold text-sm">تعذر تحميل الفهرس الكامل</p>
                      <p className="opacity-75 leading-relaxed">نظراً لضخامة حجم فهرس الكتاب، يمكنك المحاولة مجدداً للتحميل.</p>
                      <button
                        type="button"
                        disabled={loadingBook}
                        onClick={() => {
                          setLoadingBook(true);
                          setReloadTocCounter(c => c + 1);
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        {loadingBook ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>جاري التحميل...</span>
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-4 h-4" />
                            <span>إعادة محاولة التحميل</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : tocSearch.trim() ? (
                    filteredToc.length === 0 ? (
                      <div className={`p-8 text-center text-sm rounded-2xl mt-4 ${readerTheme === 'dark' ? 'bg-white/5 text-white/60' : 'bg-black/5 text-black/60'}`}>لا توجد نتائج مطابقة للبحث</div>
                    ) : (
                      <div className="space-y-1">
                      <div className={`flex items-center justify-between text-[11.5px] font-bold px-2 py-1.5 mb-1.5 rounded-xl border ${
                        readerTheme === 'dark'
                          ? 'text-white/75 bg-white/[0.04] border-white/10'
                          : 'text-slate-700 bg-slate-100/80 border-slate-200'
                      }`}>
                        <span>نتائج العناوين:</span>
                        <span className={accentColor === 'amber' ? 'text-amber-500 font-black' : accentColor === 'emerald' ? 'text-teal-600 dark:text-teal-400 font-black' : accentColor === 'blue' ? 'text-blue-600 dark:text-blue-400 font-black' : 'text-brand-magenta font-black'}>
                          {filteredToc.length} نتيجة
                        </span>
                      </div>
                      {filteredToc.slice(0, visibleTocLimit).map((heading) => {
                        const isExactActive = (activeTocIndex >= 0 && toc[activeTocIndex]?.title === heading.title) ||
                          (heading.page === currentPage) ||
                          (activeHeadingText ? (activeHeadingText.includes(heading.title.trim()) || heading.title.trim().includes(activeHeadingText)) : false);
                        return (
                          <button
                            key={heading.originalIndex}
                            data-toc-active={isExactActive ? "true" : undefined}
                            onClick={() => {
                              if (availableVolumes.length > 1) {
                                const resultVol = getHeadingVolume(heading.page);
                                if (resultVol) {
                                  setSelectedVolumeForToc(resultVol);
                                  setHasUserNavigatedToAllVolumes(false);
                                }
                              }
                              handlePageJump(heading.page, heading.title, heading.originalIndex);
                            }}
                            className={`w-full flex items-center justify-between py-2.5 px-3 text-sm rounded-xl transition-all duration-200 group cursor-pointer border ${isExactActive
                              ? accentColor === 'amber'
                                ? 'bg-[#dfbf83] text-stone-950 font-bold border-[#cba35d] shadow-sm ring-1 ring-[#cba35d]/40'
                                : accentColor === 'emerald'
                                  ? 'bg-teal-500/15 text-teal-900 dark:text-teal-200 font-bold border-teal-500/30 shadow-sm ring-1 ring-teal-500/30'
                                  : accentColor === 'blue'
                                    ? 'bg-blue-500/15 text-blue-900 dark:text-blue-200 font-bold border-blue-500/30 shadow-sm ring-1 ring-blue-500/30'
                                    : 'bg-brand-magenta/15 text-brand-magenta font-bold border-brand-magenta/30 shadow-sm ring-1 ring-brand-magenta/30'
                              : readerTheme === 'dark'
                                ? 'text-slate-200 hover:text-white hover:bg-white/10 border-transparent'
                                : accentColor === 'amber'
                                  ? 'text-slate-800 hover:bg-amber-50/70 hover:text-stone-900 border-transparent'
                                  : accentColor === 'emerald'
                                    ? 'text-slate-800 hover:bg-teal-50/70 hover:text-teal-950 border-transparent'
                                    : accentColor === 'blue'
                                      ? 'text-slate-800 hover:bg-blue-50/70 hover:text-blue-950 border-transparent'
                                      : 'text-slate-800 hover:bg-purple-50/70 hover:text-purple-950 border-transparent'
                              }`}
                          >
                            <span className={`truncate text-right max-w-[70%] leading-relaxed transition-colors ${accentColor === 'amber' ? 'group-hover:text-[#b88d46]' : accentColor === 'emerald' ? 'group-hover:text-teal-600' : accentColor === 'blue' ? 'group-hover:text-blue-600' : 'group-hover:text-brand-magenta'}`}>{heading.title}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {availableVolumes.length > 1 && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${
                                  isExactActive
                                    ? accentColor === 'amber'
                                      ? 'bg-black/10 text-stone-950 border border-black/5'
                                      : 'bg-white/20 text-white'
                                    : readerTheme === 'dark'
                                      ? 'bg-white/10 text-white/80'
                                      : 'bg-slate-200/90 text-slate-700'
                                }`}>
                                  مج ({toEasternArabicNumerals(getHeadingVolume(heading.page))})
                                </span>
                              )}
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors ${isExactActive
                                ? accentColor === 'amber'
                                  ? 'bg-black/10 text-stone-950 font-bold border border-black/5'
                                  : accentColor === 'emerald'
                                    ? 'bg-teal-500/20 text-teal-900 dark:text-teal-200'
                                    : accentColor === 'blue'
                                      ? 'bg-blue-500/20 text-blue-900 dark:text-blue-200'
                                      : 'bg-brand-magenta/20 text-brand-magenta'
                                : readerTheme === 'dark'
                                  ? 'bg-white/10 text-white/70'
                                  : 'bg-slate-200/80 text-slate-700'
                                }`}>
                                صـ {toEasternArabicNumerals(heading.page)}
                              </span>
                            </div>
                          </button>
                        )
                      })}
                      {filteredToc.length > visibleTocLimit && (
                        <div className="pt-2 pb-1 text-center">
                          <button
                            type="button"
                            onClick={() => setVisibleTocLimit(prev => prev + 80)}
                            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                              readerTheme === 'dark'
                                ? 'bg-white/10 hover:bg-white/15 text-white border border-white/15'
                                : 'bg-slate-200/80 hover:bg-slate-300/80 text-slate-800 border border-slate-300/70'
                            }`}
                          >
                            عرض المزيد (+80 من أصل {filteredToc.length})
                          </button>
                        </div>
                      )}
                    </div>
                  )) : (
                    <div className="space-y-1">
                      {/* Content: List of Volumes (Master View) OR Selected Volume Chapters (Detail View) */}
                      {availableVolumes.length > 1 && !selectedVolumeForToc ? (
                        <div key="all-volumes" className="space-y-1">
                          {volumeNodes.map((volNode, idx) => (
                            <VolumeCard
                              key={volNode.volName}
                              volumeNode={volNode}
                              isActive={volNode.volName === activeReadingVolume}
                              onSelect={(vol) => {
                                setHasUserNavigatedToAllVolumes(false);
                                setSelectedVolumeForToc(vol);
                              }}
                              readerTheme={readerTheme}
                              accentColor={accentColor}
                              index={idx}
                            />
                          ))}
                        </div>
                      ) : (
                        <div key={selectedVolumeForToc || 'chapters'} className="space-y-1">
                          {tocTree.length === 0 ? (
                            <div className={`p-6 text-center text-xs rounded-xl ${
                              readerTheme === 'dark' ? 'bg-white/[0.02] text-white/50' : 'bg-slate-50 text-slate-500'
                            }`}>
                              لا توجد أبواب مفهرسة في هذا المجلد
                            </div>
                          ) : (
                            tocTree.map((node, idx) => (
                              <TocNode
                                key={`${selectedVolumeForToc}-${node.originalIndex}`}
                                node={node}
                                index={idx}
                                expandedNodes={expandedNodes}
                                toggleExpand={toggleExpand}
                                currentPage={currentPage}
                                handlePageJump={handlePageJump}
                                activeHeadingText={activeHeadingText}
                                activeTocIndex={activeTocIndex}
                                activeAncestorIndices={activeAncestorIndices}
                                selectedTocIndex={selectedTocIndex}
                                readerTheme={readerTheme}
                              />
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Panel */}
              <div className={`absolute inset-0 flex flex-col transition-all duration-300 ${sidebarTab === 'chat' ? 'opacity-100 translate-x-0 z-10' : 'opacity-0 -translate-x-4 pointer-events-none -z-10'}`}>
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar relative">
                  {chatHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-70">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${
                        readerTheme === 'dark'
                          ? accentColor === 'amber'
                            ? 'bg-amber-500/15 border border-[#dfbf83]/30 shadow-[0_0_20px_rgba(223,191,131,0.25)]'
                            : accentColor === 'emerald'
                              ? 'bg-teal-500/15 border border-teal-500/30 shadow-[0_0_20px_rgba(45,212,191,0.25)]'
                              : accentColor === 'blue'
                                ? 'bg-blue-500/15 border border-blue-500/30 shadow-[0_0_20px_rgba(96,165,250,0.25)]'
                                : 'bg-brand-magenta/15 border border-brand-magenta/30 shadow-[0_0_20px_rgba(168,85,247,0.25)]'
                          : accentColor === 'amber'
                            ? 'bg-amber-50/80 border border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                            : accentColor === 'emerald'
                              ? 'bg-teal-50/80 border border-teal-300 shadow-[0_0_15px_rgba(13,148,136,0.25)]'
                              : accentColor === 'blue'
                                ? 'bg-blue-50/80 border border-blue-300 shadow-[0_0_15px_rgba(37,99,235,0.25)]'
                                : 'bg-purple-50/80 border border-purple-300 shadow-[0_0_15px_rgba(149,11,196,0.25)]'
                      }`}>
                        {renderZadLogo('h-9 w-9', true)}
                      </div>
                      <p className="font-bold mb-2">كيف يمكنني مساعدتك؟</p>
                      <p className="text-sm opacity-80 leading-relaxed">حدد أي نص من الكتاب واضغط "اشرح" أو اسألني مباشرة وسأقوم بتوضيحه لك.</p>
                    </div>
                  ) : (
                    chatHistory.map((msg) => (
                      <Bubble key={msg.id} message={msg} dark={readerTheme === 'dark'} />
                    ))
                  )}
                  {chatLoading && (
                    <TypingBubble dark={readerTheme === 'dark'} />
                  )}
                </div>

                <div className={`p-3 sm:p-4 border-t shrink-0 z-20 ${readerTheme === 'dark' ? 'border-white/10 bg-[#0f1422]' : 'border-gray-200/60 bg-white'}`}>
                  <form onSubmit={handleSendChatMessage} className="flex flex-col w-full gap-2 relative">
                    <div className="gradient-border min-w-0 flex-1 rounded-[22px] p-[2px] shadow-lg shadow-primary/20 transition-all duration-300">
                      <div className={`flex items-end gap-2 rounded-[20px] py-1.5 pr-4 pl-2 transition-all duration-300 ${readerTheme === 'dark' ? 'bg-[#0f1422]' : 'bg-white'}`}>
                        <textarea
                          rows={1}
                          className="font-sans min-w-0 flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:opacity-50 [&::-webkit-scrollbar]:hidden"
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendChatMessage(e as any);
                            }
                          }}
                          placeholder="اكتب سؤالك هنا..."
                          disabled={chatLoading}
                        />
                        <button
                          type="submit"
                          disabled={!chatInput.trim() || chatLoading}
                          className="brand-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-lg shadow-primary/30 transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 cursor-pointer"
                        >
                          <Send className="h-4 w-4 rtl:-scale-x-100" />
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              {/* Feature 4: Full-Text In-Book Search Panel */}
              <div className={`absolute inset-0 flex flex-col transition-all duration-300 ${sidebarTab === 'search' ? 'opacity-100 translate-x-0 z-10' : 'opacity-0 translate-x-4 pointer-events-none -z-10'}`}>
                {/* Search Mode Full-Width Tabs (الشاشة مقسومة نصفين من اليمين للشمال بدون فريم وبدون أيقونات) */}
                <div className={`grid grid-cols-2 w-full border-b shrink-0 ${
                  readerTheme === 'dark' ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200/90 bg-slate-50/70'
                }`}>
                  {/* القسم الأيمن: بحث مرن */}
                  <button
                    type="button"
                    onClick={() => handleToggleSearchMode('flexible')}
                    className={`py-3 px-2 text-center text-xs transition-all duration-200 cursor-pointer flex items-center justify-center border-b-2 font-bold ${
                      bookSearchMode === 'flexible'
                        ? readerTheme === 'dark'
                          ? accentColor === 'amber'
                            ? 'text-[#eedbb2] bg-amber-500/10 border-amber-400 font-black'
                            : accentColor === 'emerald'
                              ? 'text-teal-300 bg-teal-500/10 border-teal-400 font-black'
                              : accentColor === 'blue'
                                ? 'text-blue-300 bg-blue-500/10 border-blue-400 font-black'
                                : 'text-purple-300 bg-purple-500/10 border-brand-magenta font-black'
                          : accentColor === 'amber'
                            ? 'text-[#7e4f13] bg-amber-500/15 border-[#b88d46] font-black'
                            : accentColor === 'emerald'
                              ? 'text-teal-900 bg-teal-500/15 border-teal-600 font-black'
                              : accentColor === 'blue'
                                ? 'text-blue-900 bg-blue-500/15 border-blue-600 font-black'
                                : 'text-purple-950 bg-purple-500/15 border-purple-600 font-black'
                        : readerTheme === 'dark'
                          ? 'text-white/50 hover:text-white hover:bg-white/[0.03] border-transparent'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60 border-transparent'
                    }`}
                  >
                    <span>بحث مرن</span>
                  </button>

                  {/* القسم الأيسر: مطابقة تامة */}
                  <button
                    type="button"
                    onClick={() => handleToggleSearchMode('exact')}
                    className={`py-3 px-2 text-center text-xs transition-all duration-200 cursor-pointer flex items-center justify-center border-b-2 border-r font-bold ${
                      readerTheme === 'dark' ? 'border-r-white/10' : 'border-r-slate-200/90'
                    } ${
                      bookSearchMode === 'exact'
                        ? readerTheme === 'dark'
                          ? accentColor === 'amber'
                            ? 'text-[#eedbb2] bg-amber-500/10 border-b-amber-400 font-black'
                            : accentColor === 'emerald'
                              ? 'text-teal-300 bg-teal-500/10 border-b-teal-400 font-black'
                              : accentColor === 'blue'
                                ? 'text-blue-300 bg-blue-500/10 border-b-blue-400 font-black'
                                : 'text-purple-300 bg-purple-500/10 border-b-brand-magenta font-black'
                          : accentColor === 'amber'
                            ? 'text-[#7e4f13] bg-amber-500/15 border-b-[#b88d46] font-black'
                            : accentColor === 'emerald'
                              ? 'text-teal-900 bg-teal-500/15 border-b-teal-600 font-black'
                              : accentColor === 'blue'
                                ? 'text-blue-900 bg-blue-500/15 border-b-blue-600 font-black'
                                : 'text-purple-950 bg-purple-500/15 border-b-purple-600 font-black'
                        : readerTheme === 'dark'
                          ? 'text-white/50 hover:text-white hover:bg-white/[0.03] border-b-transparent'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60 border-b-transparent'
                    }`}
                  >
                    <span>مطابقة تامة</span>
                  </button>
                </div>

                <div className={`p-4 border-b ${readerTheme === 'dark' ? 'border-white/10' : 'border-slate-200/80'}`}>

                  <form onSubmit={handleSearchInBook} className="relative group">
                    <button
                      type="submit"
                      disabled={!bookSearchQuery.trim() || isSearchingBook}
                      className={`absolute right-3 top-2.5 p-1 rounded-lg transition-all cursor-pointer ${accentColor === 'amber'
                        ? readerTheme === 'dark' ? 'text-amber-400 hover:text-amber-300' : 'text-[#8a5d1b] hover:text-[#6a4411]'
                        : accentColor === 'emerald'
                          ? readerTheme === 'dark' ? 'text-teal-400 hover:text-teal-300' : 'text-teal-700 hover:text-teal-800'
                          : accentColor === 'blue'
                            ? readerTheme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-700 hover:text-blue-800'
                            : readerTheme === 'dark' ? 'text-purple-400 hover:text-purple-300' : 'text-purple-700 hover:text-purple-800'
                        } disabled:opacity-40`}
                      title="بدء البحث"
                    >
                      {isSearchingBook ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 stroke-[2.4]" />}
                    </button>
                    <input
                      type="text"
                      placeholder={bookSearchMode === 'exact' ? "ابحث بالعبارة الحرفية تماماً..." : "ابحث في نصوص الكتاب..."}
                      value={bookSearchQuery}
                      onChange={(e) => setBookSearchQuery(e.target.value)}
                      className={`w-full rounded-2xl pr-10 pl-9 py-2.5 text-sm focus:outline-none focus:ring-2 ${accentColor === 'amber'
                        ? 'focus:ring-amber-500'
                        : accentColor === 'emerald'
                          ? 'focus:ring-teal-500'
                          : accentColor === 'blue'
                            ? 'focus:ring-blue-500'
                            : 'focus:ring-brand-magenta'
                        } transition-all shadow-inner ${readerTheme === 'dark'
                          ? 'bg-white/5 border border-white/10 text-white placeholder-white/40 focus:bg-white/10'
                          : 'bg-slate-100/90 text-slate-900 placeholder-slate-400 border border-slate-300/80 focus:bg-white'
                        }`}
                    />
                    {bookSearchQuery && (
                      <button
                        type="button"
                        onClick={() => { setBookSearchQuery(''); setBookSearchResults([]); setHasSearchedBook(false); setBookSearchHighlightTerms([]); }}
                        className={`absolute left-3 top-3 transition-colors ${readerTheme === 'dark'
                          ? 'text-white/40 hover:text-white'
                          : 'text-slate-400 hover:text-slate-800'
                          }`}
                        title="مسح البحث"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </form>
                  {hasSearchedBook && !isSearchingBook && (
                    <div className={`mt-2.5 text-xs px-1 font-bold ${readerTheme === 'dark' ? 'text-white/80' : 'text-slate-700'}`}>
                      <span>
                        عدد النتائج:{' '}
                        <strong className={
                          readerTheme === 'dark'
                            ? (accentColor === 'amber' ? 'text-amber-400 font-black' : accentColor === 'emerald' ? 'text-teal-400 font-black' : accentColor === 'blue' ? 'text-blue-400 font-black' : 'text-purple-400 font-black')
                            : (accentColor === 'amber' ? 'text-[#855314] font-black' : accentColor === 'emerald' ? 'text-teal-700 font-black' : accentColor === 'blue' ? 'text-blue-700 font-black' : 'text-purple-700 font-black')
                        }>
                          {bookSearchResults.length}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto px-2 sm:px-3 py-2 custom-scrollbar">
                  {isSearchingBook ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-3">
                      <Loader2 className={`h-7 w-7 animate-spin ${accentColor === 'amber' ? 'text-amber-500' : accentColor === 'emerald' ? 'text-teal-600' : accentColor === 'blue' ? 'text-blue-600' : 'text-purple-600'
                        }`} />
                      <p className={`text-xs font-semibold ${readerTheme === 'dark' ? 'text-white/70' : 'text-slate-600'}`}>
                        جاري البحث في بطون صفحات الكتاب...
                      </p>
                    </div>
                  ) : !hasSearchedBook ? (
                    <div className="flex flex-col items-center justify-center h-56 text-center gap-3 p-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm ${accentColor === 'amber'
                        ? readerTheme === 'dark' ? 'bg-amber-500/10 border-amber-500/25 text-amber-400' : 'bg-amber-100/70 border-amber-300 text-[#855314]'
                        : accentColor === 'emerald'
                          ? readerTheme === 'dark' ? 'bg-teal-500/10 border-teal-500/25 text-teal-400' : 'bg-teal-100/70 border-teal-300 text-teal-800'
                          : accentColor === 'blue'
                            ? readerTheme === 'dark' ? 'bg-blue-500/10 border-blue-500/25 text-blue-400' : 'bg-blue-100/70 border-blue-300 text-blue-800'
                            : readerTheme === 'dark' ? 'bg-purple-500/10 border-purple-500/25 text-purple-400' : 'bg-purple-100/70 border-purple-300 text-purple-800'
                        }`}>
                        <Search className="w-7 h-7 stroke-[2.3]" />
                      </div>
                      <div className="space-y-1">
                        <p className={`text-sm font-bold ${readerTheme === 'dark' ? 'text-white/90' : 'text-slate-800'}`}>
                          ابحث عن أي لفظ أو مسألة في صفحات الكتاب
                        </p>
                        <p className={`text-xs ${readerTheme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>
                          سيتم استعراض كل المواضع مع مقتطفات السياق
                        </p>
                      </div>
                    </div>
                  ) : bookSearchResults.length === 0 ? (
                    <div className={`p-8 text-center text-xs font-bold rounded-2xl border ${readerTheme === 'dark' ? 'bg-white/5 border-white/10 text-white/70' : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                      {bookSearchMode === 'exact' ? (
                        <div className="space-y-2">
                          <p>لم يُعثر على نتائج مطابقة تماماً للعبارة الحرفية "{bookSearchQuery}" في هذا الكتاب.</p>
                          <button
                            type="button"
                            onClick={() => handleToggleSearchMode('flexible')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-all cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>جرّب البحث المرن بالكلمات</span>
                          </button>
                        </div>
                      ) : (
                        <p>لم يُعثر على أي نتائج مطابقة لـ "{bookSearchQuery}" في هذا الكتاب.</p>
                      )}
                    </div>
                  ) : (
                    bookSearchResults.map((hit, idx) => {
                      const isCurrent = (hit.page_id || hit.page) === currentPage;
                      const isExpanded = expandedHitIndices.has(idx);
                      const displaySnippet = isExpanded
                        ? (hit.text || hit.snip || hit.snippet || '')
                        : (hit.snip || hit.snippet || hit.text || '');
                      const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
                      const arabicIndex = (idx + 1).toString().replace(/\d/g, d => arabicDigits[Number(d)] || d);
                      const arabicVol = hit.vol ? hit.vol.toString().replace(/\d/g, d => arabicDigits[Number(d)] || d) : '';
                      const arabicPage = hit.page ? hit.page.toString().replace(/\d/g, d => arabicDigits[Number(d)] || d) : '';
                      const locationLabel = arabicVol ? `${arabicVol} / ${arabicPage}` : `صـ ${arabicPage}`;

                      return (
                        <div
                          key={idx}
                          className={`text-right px-2 sm:px-3 py-3.5 transition-colors border-b last:border-b-0 ${
                            isCurrent
                              ? readerTheme === 'dark'
                                ? 'bg-white/[0.04] border-white/15'
                                : 'bg-amber-500/[0.05] border-slate-200'
                              : readerTheme === 'dark'
                                ? 'border-white/10 hover:bg-white/[0.02]'
                                : 'border-slate-200/80 hover:bg-slate-50/60'
                          }`}
                        >
                          {/* Top Row: Arabic numeral on Right, Controls (المزيد + نسخ) on Left */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            {/* Right: Arabic Index Number (١, ٢, ٣...) in authentic Kitab font */}
                            <span className="font-kitab text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 select-none">
                              {arabicIndex}
                            </span>

                            {/* Left: Controls (المزيد / الأقل + أيقونة النسخ) */}
                            <div className="flex items-center gap-3">
                              {/* Toggle Expand / Collapse */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpandHit(idx);
                                }}
                                className={`flex items-center gap-1.5 text-sm sm:text-[15px] font-bold transition-colors cursor-pointer ${
                                  readerTheme === 'dark'
                                    ? 'text-white/80 hover:text-white'
                                    : 'text-slate-700 hover:text-slate-950'
                                }`}
                              >
                                <span>{isExpanded ? 'الأقل' : 'المزيد'}</span>
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 opacity-80" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 opacity-80" />
                                )}
                              </button>

                              {/* Copy Text Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyHitText(displaySnippet, idx);
                                }}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  readerTheme === 'dark'
                                    ? 'text-white/70 hover:text-white hover:bg-white/10'
                                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/60'
                                }`}
                                title="نسخ المقتطف"
                              >
                                {copiedHitIndex === idx ? (
                                  <Check className="w-4 h-4 text-emerald-500" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Snippet / Text Body (Clickable to jump) */}
                          <div
                            onClick={() => handleSelectSearchResult(hit)}
                            className="cursor-pointer transition-opacity my-2.5"
                          >
                            <p className={`font-kitab text-[20px] sm:text-[21px] leading-[2.3] text-right ${
                              isExpanded ? 'whitespace-pre-line' : 'line-clamp-4'
                            } ${readerTheme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                              {renderSearchSnippet(displaySnippet, readerTheme === 'dark', accentColor)}
                            </p>
                          </div>

                          {/* Bottom Row: Location link (الموضع: ١ / ٦) */}
                          <div className="flex items-center justify-between gap-2 mt-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleSelectSearchResult(hit)}
                              className="font-kitab text-[17px] sm:text-[18px] text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <span className="font-bold">الموضع:</span>
                              <span className="font-bold">{locationLabel}</span>
                            </button>

                            {hit.headings && hit.headings.length > 0 && (
                              <span className={`truncate text-xs font-semibold max-w-[170px] ${
                                readerTheme === 'dark' ? 'text-white/40' : 'text-slate-400'
                              }`}>
                                {hit.headings[hit.headings.length - 1]}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Feature 2: Hadiths & Numbered Items Panel */}
              <div className={`absolute inset-0 flex flex-col transition-all duration-300 ${sidebarTab === 'hadiths' ? 'opacity-100 translate-x-0 z-10' : 'opacity-0 translate-x-4 pointer-events-none -z-10'}`}>
                <div className="p-4 border-b border-border/40">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="number"
                      placeholder={`أدخل رقم ${numberedItemsLabel.single}...`}
                      value={hadithSearchInput}
                      onChange={(e) => setHadithSearchInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleJumpToHadith(hadithSearchInput);
                      }}
                      className={`flex-1 rounded-2xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all ${readerTheme === 'dark' ? 'bg-white/5 border border-white/10 text-white placeholder-white/40' : 'bg-slate-100 text-slate-900 placeholder-slate-400 border border-slate-200'}`}
                    />
                    <button
                      type="button"
                      onClick={() => handleJumpToHadith(hadithSearchInput)}
                      className="px-3.5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all shrink-0 active:scale-95 cursor-pointer"
                    >
                      انتقال
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-semibold">
                    يتوفر في هذا الكتاب <strong className="text-amber-500">{hadithsCount}</strong> موضعاً مرقماً ({numberedItemsLabel.plural}).
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {Object.entries(hadithsMap).slice(0, 150).map(([hNum, pageTarget]) => (
                      <button
                        key={hNum}
                        onClick={() => {
                          setCurrentPage(pageTarget);
                          if (typeof window !== 'undefined' && window.innerWidth < 768) {
                            setSidebarTab('none');
                          }
                        }}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${pageTarget === currentPage
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-500 shadow-sm'
                          : readerTheme === 'dark'
                            ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-amber-500/40 text-slate-200'
                            : 'bg-white border-slate-200/80 hover:bg-amber-50 hover:border-amber-300 text-slate-800'
                          }`}
                      >
                        <span className="text-[10px] text-amber-500 font-extrabold">#{hNum}</span>
                        <span className="text-[9px] opacity-60">صـ {pageTarget}</span>
                      </button>
                    ))}
                  </div>
                  {hadithsCount > 150 && (
                    <p className="text-center text-[11px] text-muted-foreground mt-3 font-semibold">
                      استخدم حقل البحث بالأعلى للوصول الفوري لأي رقم حتى {hadithsCount}.
                    </p>
                  )}
                </div>
              </div>

              {/* Feature: Highlights Panel (لوحة النصوص المظللة) */}
              <div className={`absolute inset-0 flex flex-col transition-all duration-300 ${sidebarTab === 'highlights' ? 'opacity-100 translate-x-0 z-10' : 'opacity-0 translate-x-4 pointer-events-none -z-10'}`}>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-2">
                  {highlights.length === 0 ? (
                    <div className="py-16 px-4 text-center flex flex-col items-center justify-center gap-3 opacity-70">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${getHighlightEmptyIconStyle()}`}>
                        <Highlighter className="w-7 h-7" />
                      </div>
                      <p className="text-sm font-bold">لا توجد نصوص ملونة بعد</p>
                      <p className="text-xs leading-relaxed text-muted-foreground max-w-xs">
                        حدد أي نص تريده في صفحات الكتاب واختر لوناً من شريط الأدوات لحفظه هنا والوصول إليه بسرعة.
                      </p>
                    </div>
                  ) : (
                    highlights.map((h) => {
                      const isCurrentPage = h.page === currentPage;
                      return (
                        <div
                          key={h.id}
                          onClick={() => {
                            handleJumpToHighlight(h);
                            if (typeof window !== 'undefined' && window.innerWidth < 768) {
                              setSidebarTab('none');
                            }
                          }}
                          className={`group relative p-3 rounded-2xl border transition-all duration-200 cursor-pointer text-right flex flex-col gap-1.5 ${getHighlightActiveCardStyle(isCurrentPage)}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 ${getHighlightBadgeStyle(isCurrentPage)}`}>
                              <span>صفحة {toEasternArabicNumerals(h.page)}</span>
                              {isCurrentPage && <span className="text-[9px] font-bold opacity-80">(الحالية)</span>}
                            </span>

                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs inline-block"
                                style={{ backgroundColor: h.color }}
                                title="لون التحديد"
                              />
                              <button
                                type="button"
                                onClick={(e) => handleDeleteHighlight(h.id, e)}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors opacity-70 group-hover:opacity-100"
                                title="حذف هذا التظليل"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-xs leading-relaxed font-semibold opacity-90 line-clamp-3">
                            "{h.text}"
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Resize Handle BETWEEN aside and main */}
        {(sidebarTab !== 'none' && !distractionFree) && (
          <div className="hidden md:flex items-center justify-center shrink-0 z-40 relative">
            <PanelResizer onMouseDown={startResizing} isDark={readerTheme === 'dark'} label="اسحب لتغيير العرض" />
          </div>
        )}

        {/* Main Reading Area */}
        <main
          className={`flex-1 relative h-full flex flex-col overflow-hidden rounded-none sm:rounded-2xl md:rounded-3xl border-0 sm:border ${readerTheme === 'dark'
            ? 'border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-xl'
            : readerTheme === 'sepia'
              ? 'border-[#E2D6C0] bg-[#FAF5ED] shadow-[0_8px_30px_rgba(120,90,50,0.08)]'
              : readingMode === 'paged'
                ? 'border-gray-200/90 bg-white shadow-lg'
                : 'border-gray-200/80 bg-white/70 backdrop-blur-xl shadow-lg'
            }`}
          style={{
            backgroundColor: readerTheme === 'dark'
              ? getReaderFrameBgColor(darkFrameOpacity)
              : (readerTheme === 'light' && readingMode === 'paged')
                ? '#ffffff'
                : undefined
          }}
        >

          {/* Page Actions Floating Toolbar (Desktop only - mobile actions accessible via header/footer) */}
          {readingMode === 'paged' && (
            <div className={`hidden md:flex absolute top-4 md:top-6 left-3 md:left-6 z-40 flex-col items-center rounded-xl transition-all duration-300 group/toolbar overflow-hidden hover:border hover:backdrop-blur-md hover:shadow-lg hover:bg-white/70 hover:border-gray-200/80 dark:hover:bg-[#0d071a]/95 dark:hover:border-white/10 sepia:hover:bg-[#EAE0C8]/95 sepia:hover:border-[#D4C4A8]`}>

              {/* Compact Trigger Icon */}
              <div className={`p-2 cursor-pointer flex group-hover/toolbar:hidden transition-colors ${isReadingPage ? 'opacity-100 animate-pulse' : 'opacity-80 hover:opacity-100'} ${accentColor === 'amber' ? 'text-[#b88d46]' : accentColor === 'emerald' ? 'text-teal-600' : accentColor === 'blue' ? 'text-blue-600' : 'text-brand-magenta'}`}>
                <MoreVertical className="h-7 w-7 drop-shadow-md" />
              </div>

              {/* Expanded Actions */}
              <div className="hidden group-hover/toolbar:flex flex-col items-center gap-1.5 px-1 py-2 w-full animate-in fade-in zoom-in-95 duration-200">
                <button
                  onClick={toggleBookmark}
                  className={`p-2 rounded-xl transition-all ${bookmarks.includes(currentPage)
                    ? accentColor === 'amber'
                      ? 'bg-amber-500/15 text-[#b88d46] shadow-sm'
                      : accentColor === 'emerald'
                        ? 'bg-teal-500/15 text-teal-600 shadow-sm'
                        : accentColor === 'blue'
                          ? 'bg-blue-500/15 text-blue-600 shadow-sm'
                          : 'bg-brand-magenta/15 text-brand-magenta shadow-sm'
                    : `text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 ${accentColor === 'amber' ? 'hover:text-[#b88d46]' : accentColor === 'emerald' ? 'hover:text-teal-600' : accentColor === 'blue' ? 'hover:text-blue-600' : 'hover:text-brand-magenta'}`
                    }`}
                  title={bookmarks.includes(currentPage) ? "إزالة العلامة" : "حفظ كعلامة مرجعية"}
                >
                  {bookmarks.includes(currentPage) ? (
                    <BookmarkCheck className={`h-5 w-5 ${accentColor === 'amber' ? 'fill-amber-500/20' : accentColor === 'emerald' ? 'fill-teal-500/20' : accentColor === 'blue' ? 'fill-blue-500/20' : 'fill-brand-magenta/20'}`} />
                  ) : (
                    <Bookmark className="h-5 w-5" />
                  )}
                </button>
                <div className="w-4 h-px bg-border/50 my-0.5 shrink-0" />
                <button
                  onClick={handleCopyPage}
                  className={`p-2 rounded-xl transition-all ${pageCopied ? 'text-emerald-500 bg-emerald-500/10' : `text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 ${accentColor === 'amber' ? 'hover:text-[#b88d46]' : accentColor === 'emerald' ? 'hover:text-teal-600' : accentColor === 'blue' ? 'hover:text-blue-600' : 'hover:text-brand-magenta'}`}`}
                  title="نسخ محتوى الصفحة"
                >
                  <Copy className="h-5 w-5" />
                </button>
                <div className="w-4 h-px bg-border/50 my-0.5 shrink-0" />

                <button
                  onClick={() => { setDistractionFree(!distractionFree); setShowSettings(false); setShowBookmarks(false); }}
                  className={`p-2 rounded-xl transition-all text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 ${accentColor === 'amber' ? 'hover:text-[#b88d46]' : accentColor === 'emerald' ? 'hover:text-teal-600' : accentColor === 'blue' ? 'hover:text-blue-600' : 'hover:text-brand-magenta'}`}
                  title={distractionFree ? "إنهاء تكبير الشاشة" : "تكبير الشاشة"}
                >
                  {distractionFree ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                </button>

                <div className="w-4 h-px bg-border/50 my-0.5 shrink-0" />
                <AudioReaderButton
                  text={pageText?.matn ? `${pageText.matn} ${pageText.sharh || ''}` : (pageText?.main || '')}
                  dark={readerTheme === 'dark' || readerTheme === 'sepia'}
                  showTextLabel={false}
                  hidePodcast={true}
                  onStateChange={(playing) => setIsReadingPage(playing)}
                  orientation="vertical"
                  colorTheme={accentColor}
                  menuPlacement="left"
                  className={`!bg-transparent !border-transparent !shadow-none !p-2 !rounded-xl !text-muted-foreground hover:!bg-black/5 dark:hover:!bg-white/5 ${accentColor === 'amber' ? 'hover:!text-[#b88d46]' : accentColor === 'emerald' ? 'hover:!text-teal-600' : accentColor === 'blue' ? 'hover:!text-blue-600' : 'hover:!text-brand-magenta'} [&_svg]:!h-5 [&_svg]:!w-5`}
                />
              </div>
            </div>
          )}



          {/* Floating Exit Zen Mode Button (زر أيقونة للتصغير والخروج من ملء الشاشة في الجانب العلوي الأيسر) */}
          {distractionFree && (() => {
            const getZenButtonStyles = () => {
              if (readerTheme === 'dark') {
                switch (accentColor) {
                  case 'amber':
                    return 'bg-stone-900/90 hover:bg-stone-800 border-[#dfbf83]/30 hover:border-[#dfbf83]/60 text-amber-400 shadow-xl shadow-black/50';
                  case 'emerald':
                    return 'bg-slate-900/90 hover:bg-slate-800 border-teal-500/30 hover:border-teal-500/60 text-teal-400 shadow-xl shadow-black/50';
                  case 'blue':
                    return 'bg-slate-900/90 hover:bg-slate-850 border-blue-500/30 hover:border-blue-500/60 text-blue-400 shadow-xl shadow-black/50';
                  case 'purple':
                  default:
                    return 'bg-stone-900/90 hover:bg-stone-800 border-purple-500/30 hover:border-purple-500/60 text-brand-magenta shadow-xl shadow-black/50';
                }
              }
              if (readerTheme === 'sepia') {
                switch (accentColor) {
                  case 'amber':
                    return 'bg-[#F4ECD8]/95 hover:bg-[#ebdcc0] border-[#C8B89E] hover:border-[#b88d46]/60 text-[#78531b] shadow-lg shadow-amber-950/15';
                  case 'emerald':
                    return 'bg-[#F4ECD8]/95 hover:bg-[#ebdcc0] border-[#C8B89E] hover:border-teal-600/60 text-teal-800 shadow-lg shadow-teal-950/15';
                  case 'blue':
                    return 'bg-[#F4ECD8]/95 hover:bg-[#ebdcc0] border-[#C8B89E] hover:border-blue-600/60 text-blue-800 shadow-lg shadow-blue-950/15';
                  case 'purple':
                  default:
                    return 'bg-[#F4ECD8]/95 hover:bg-[#ebdcc0] border-[#C8B89E] hover:border-purple-600/60 text-purple-900 shadow-lg shadow-purple-950/15';
                }
              }
              // Light Mode
              switch (accentColor) {
                case 'amber':
                  return 'bg-white/95 hover:bg-amber-50/80 border-[#dfbf83]/40 hover:border-[#dfbf83] text-[#8e682d] hover:text-[#78531b] shadow-lg shadow-amber-950/10';
                case 'emerald':
                  return 'bg-white/95 hover:bg-teal-50/80 border-teal-200 hover:border-teal-400 text-teal-600 hover:text-teal-700 shadow-lg shadow-teal-950/10';
                case 'blue':
                  return 'bg-white/95 hover:bg-blue-50/80 border-blue-200 hover:border-blue-400 text-blue-600 hover:text-blue-700 shadow-lg shadow-blue-950/10';
                case 'purple':
                default:
                  return 'bg-white/95 hover:bg-purple-50/80 border-purple-200 hover:border-purple-400 text-brand-magenta hover:text-purple-700 shadow-lg shadow-purple-950/10';
              }
            };

            return (
              <button
                type="button"
                onClick={() => setDistractionFree(false)}
                className={`fixed top-3.5 left-3.5 z-50 h-10 w-10 rounded-full backdrop-blur-xl border transition-all duration-200 flex items-center justify-center cursor-pointer group animate-in fade-in zoom-in-95 active:scale-95 hover:scale-110 ${getZenButtonStyles()}`}
                title="إنهاء وضع ملء الشاشة (تصغير)"
                aria-label="إنهاء وضع ملء الشاشة"
              >
                <Minimize className="w-5 h-5 transition-transform duration-200 group-hover:scale-90" strokeWidth={2.2} />
              </button>
            );
          })()}

          {/* Reading Progress Line */}
          {!distractionFree && (
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-black/5 dark:bg-white/5 z-20">
              <div className="h-full brand-gradient transition-all duration-300" style={{ width: `${progressPercent}%` }} />
            </div>
          )}

          <div
            ref={scrollContainerRef}
            onScroll={() => {
              handleScroll();
            }}
            onClick={handleReaderAreaClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            data-selectable="true"
            data-library-content="true"
            className={`library-reader-content selectable-content flex-1 overflow-y-auto ${readingMode === 'continuous' ? 'px-2.5 sm:px-6 md:px-8 lg:px-12 max-sm:no-scrollbar' : 'px-3.5 sm:px-6 md:px-12 lg:px-24'} pb-6 md:pb-32 pt-3 sm:pt-4 md:pt-8 custom-scrollbar relative flex justify-center transition-all duration-500`}
          >
            <div className={`w-full ${readingMode === 'continuous' ? 'max-w-7xl' : 'max-w-4xl'} min-h-full transition-all duration-500 mx-auto`}>
              {loadingPage ? (
                <div className="h-[60vh] flex flex-col items-center justify-center opacity-70 gap-5">
                  <div className="relative">
                    <div className="absolute inset-0 brand-gradient rounded-full blur-xl opacity-40 animate-pulse" />
                    <Loader2 className="h-12 w-12 animate-spin text-brand-magenta relative z-10" />
                  </div>
                  <p className="font-bold text-lg animate-pulse tracking-wide">جاري إعداد الصفحة...</p>
                </div>
              ) : pageText ? (
                <div className="animate-in fade-in duration-700">
                  <style>{`
                  /* Base Text Font Size - dynamically driven by fontSize state (default 22px, responsive on mobile) */
                  .turath-content,
                  .turath-content p,
                  .turath-content div,
                  .turath-content span:not([data-type="title"]):not([data-type="poetry"]):not([data-type="page"]):not([data-type="honorific"]):not(.islamic-honorific) {
                    font-size: ${fontSize}px !important;
                    line-height: 2.3 !important;
                  }

                  @media (max-width: 768px) {
                    .turath-content,
                    .turath-content p,
                    .turath-content div,
                    .turath-content span:not([data-type="title"]):not([data-type="poetry"]):not([data-type="page"]):not([data-type="honorific"]):not(.islamic-honorific) {
                      font-size: ${Math.max(16, Math.round(fontSize * 0.82))}px !important;
                      line-height: 2.05 !important;
                    }

                    .turath-content p,
                    .turath-content .turath-p {
                      margin-bottom: 0.45rem !important;
                      line-height: 2.05 !important;
                    }

                    .turath-content h1,
                    .turath-content h2,
                    .turath-content .main-title,
                    .turath-content span[data-type="title"][data-level="1"],
                    .turath-content span[data-type="title"].main-title {
                      font-size: 1.15em !important;
                      margin: 0.8rem auto 0.35rem !important;
                      padding: 0 0.5rem 0.25rem !important;
                    }

                    .turath-content span[data-type="title"]:not([data-level="1"]),
                    .turath-content span[data-type="title"][data-level="2"],
                    .turath-content span[data-type="title"][data-level="3"],
                    .turath-content h3,
                    .turath-content h4 {
                      font-size: 1.02em !important;
                      margin: 0.5rem 0 0.25rem 0 !important;
                    }
                  }

                  /* Primary Main Chapter Headings (Level 1: "كتاب الصلاة", "باب المواقيت") */
                  .turath-content h1,
                  .turath-content h2,
                  .turath-content .main-title,
                  .turath-content span[data-type="title"][data-level="1"],
                  .turath-content span[data-type="title"].main-title {
                    display: block !important;
                    text-align: center !important;
                    font-family: 'Scheherazade New', 'Amiri', serif !important;
                    font-weight: 700;
                    font-size: 1.25em !important;
                    line-height: 1.4 !important;
                    margin: 1.25rem auto 0.4rem !important;
                    position: relative;
                    width: fit-content;
                    max-width: 90%;
                    padding: 0 1rem 0.35rem;
                    background: transparent !important;
                    border-radius: 0 !important;
                    border-bottom: 2px solid ${readerTheme === 'dark' ? darkTitleBorder : lightTitleBorder};
                  }

                  /* Secondary Sub-Titles & Mas'alahs (Level 2+: "فصل", "مسألة", etc.) */
                  .turath-content span[data-type="title"]:not([data-level="1"]),
                  .turath-content span[data-type="title"][data-level="2"],
                  .turath-content span[data-type="title"][data-level="3"],
                  .turath-content span[data-type="title"][data-level="4"],
                  .turath-content span[data-type="title"][data-level="5"],
                  .turath-content h3,
                  .turath-content h4 {
                    display: block !important;
                    text-align: right !important;
                    font-family: 'Scheherazade New', 'Amiri', serif !important;
                    font-weight: 700 !important;
                    font-size: 1.05em !important;
                    line-height: 1.4 !important;
                    margin: 0.65rem 0 0.35rem 0 !important;
                    position: relative;
                    width: 100% !important;
                    max-width: 100% !important;
                    padding: 0 !important;
                    background: transparent !important;
                    border-radius: 0 !important;
                    border: none !important;
                  }

                  .turath-content > span[data-type="title"]:first-child,
                  .turath-content > h1:first-child,
                  .turath-content > h2:first-child,
                  .turath-content > h3:first-child,
                  .turath-content > h4:first-child {
                    margin-top: 0.25rem !important;
                  }

                  .turath-content span[data-type="title"] + p {
                    margin-top: 0.2rem !important;
                  }

                  .turath-content span[data-type="title"]::before,
                  .turath-content span[data-type="title"]::after {
                    content: none;
                  }

                  /* Honorifics & Ligatures Base Styling */
                  .turath-content span[data-type="honorific"],
                  .turath-content .islamic-honorific {
                    display: inline !important;
                    font-weight: normal !important;
                    font-size: 0.9em !important;
                    font-family: var(--font-scheherazade, 'Amiri', 'Traditional Arabic', serif) !important;
                    white-space: nowrap !important;
                    margin: 0 0.2rem !important;
                    padding: 0 !important;
                    background: none !important;
                    border: none !important;
                  }

                  /* Quranic Verses Base Typography (الآيات القرآنية) */
                  .turath-content span[data-type="quran"],
                  .turath-content .islamic-quran-verse {
                    display: inline !important;
                    font-family: var(--font-scheherazade, 'Scheherazade New', 'Amiri', 'Traditional Arabic', serif) !important;
                    font-weight: normal !important;
                    margin: 0 0.15rem !important;
                    padding: 0 !important;
                    background: none !important;
                    border: none !important;
                  }

                  /* Parenthetical text & square brackets (الكلام بين أقواس) */
                  .turath-content span[data-type="parenthetical"],
                  .turath-content .islamic-parenthetical,
                  .turath-content span[data-type="bracketed-note"],
                  .turath-content .islamic-bracketed-note {
                    display: inline !important;
                    font-weight: normal !important;
                  }

                  /* Hadith & Quotes «...» */
                  .turath-content span[data-type="hadith-quote"],
                  .turath-content .islamic-hadith-quote {
                    display: inline !important;
                    font-weight: normal !important;
                  }

                  /* Section Lead / Mas'alah Headings (رؤوس المسائل والفصول مثل: (٥١٣) فَصْلٌ:) */
                  .turath-content span[data-type="section-lead"],
                  .turath-content .islamic-section-lead {
                    display: inline !important;
                    font-weight: 700 !important;
                    font-family: inherit !important;
                  }

                  /* Poetry Verses Base Typography (أبيات الشعر - كتلة شعرية متماسكة ومتناسقة) */
                  .turath-content .islamic-poetry-block,
                  .turath-content div[data-type="poetry"] {
                    display: block !important;
                    margin: 1.15rem auto !important;
                    max-width: 580px !important;
                    width: 100% !important;
                    text-align: center !important;
                    white-space: normal !important;
                  }

                  .turath-content .islamic-poetry-verse {
                    display: flex !important;
                    align-items: baseline !important;
                    justify-content: center !important;
                    gap: 0.85rem !important;
                    margin: 0.25rem auto !important;
                    width: 100% !important;
                    max-width: 580px !important;
                    font-family: var(--font-scheherazade, 'Amiri', 'Traditional Arabic', serif) !important;
                    font-size: 1.05em !important;
                    font-weight: normal !important;
                    font-style: normal !important;
                    line-height: 1.85 !important;
                    direction: rtl !important;
                    white-space: normal !important;
                  }
                  .turath-content .islamic-poetry-verse .poetry-sadr {
                    flex: 1 1 0% !important;
                    text-align: left !important;
                    min-width: 0 !important;
                    font-weight: normal !important;
                    white-space: nowrap !important;
                  }
                  .turath-content .islamic-poetry-verse .poetry-sep {
                    opacity: 0.45 !important;
                    font-size: 0.85em !important;
                    flex-shrink: 0 !important;
                    user-select: none !important;
                    letter-spacing: 2px !important;
                    font-family: 'Amiri', serif !important;
                    padding: 0 0.2rem !important;
                  }
                  .turath-content .islamic-poetry-verse .poetry-ajuz {
                    flex: 1 1 0% !important;
                    text-align: right !important;
                    min-width: 0 !important;
                    font-weight: normal !important;
                    white-space: nowrap !important;
                  }
                  @media (max-width: 640px) {
                    .turath-content .islamic-poetry-block,
                    .turath-content div[data-type="poetry"] {
                      margin: 0.9rem auto !important;
                      padding: 0.65rem 0.85rem !important;
                      border-radius: 1rem !important;
                      background: rgba(0, 0, 0, 0.02) !important;
                      border: 1px dashed rgba(0, 0, 0, 0.09) !important;
                    }
                    .dark-reader .turath-content .islamic-poetry-block,
                    .dark-reader .turath-content div[data-type="poetry"] {
                      background: rgba(255, 255, 255, 0.02) !important;
                      border-color: rgba(255, 255, 255, 0.09) !important;
                    }
                    .sepia-reader .turath-content .islamic-poetry-block,
                    .sepia-reader .turath-content div[data-type="poetry"] {
                      background: rgba(180, 83, 9, 0.03) !important;
                      border-color: rgba(180, 83, 9, 0.12) !important;
                    }

                    .turath-content .islamic-poetry-verse {
                      display: flex !important;
                      flex-direction: column !important;
                      align-items: stretch !important;
                      justify-content: flex-start !important;
                      gap: 0.2rem !important;
                      margin: 0.65rem 0 !important;
                      padding-bottom: 0.55rem !important;
                      border-bottom: 1px dotted rgba(0, 0, 0, 0.08) !important;
                      text-align: right !important;
                      width: 100% !important;
                      max-width: 100% !important;
                      line-height: 1.8 !important;
                    }
                    .dark-reader .turath-content .islamic-poetry-verse {
                      border-bottom-color: rgba(255, 255, 255, 0.08) !important;
                    }
                    .sepia-reader .turath-content .islamic-poetry-verse {
                      border-bottom-color: rgba(180, 83, 9, 0.12) !important;
                    }
                    .turath-content .islamic-poetry-verse:last-child {
                      border-bottom: none !important;
                      padding-bottom: 0 !important;
                      margin-bottom: 0 !important;
                    }

                    .turath-content .islamic-poetry-verse .poetry-sadr,
                    .turath-content .islamic-poetry-verse .poetry-ajuz {
                      display: block !important;
                      width: 100% !important;
                      white-space: normal !important;
                      font-weight: inherit !important;
                      opacity: 1 !important;
                    }

                    .turath-content .islamic-poetry-verse .poetry-sadr {
                      text-align: right !important;
                      padding-right: 0.35rem !important;
                    }

                    .turath-content .islamic-poetry-verse .poetry-sep {
                      display: none !important;
                    }

                    .turath-content .islamic-poetry-verse .poetry-ajuz {
                      text-align: left !important;
                      padding-left: 0.35rem !important;
                      margin-top: 0.25rem !important;
                    }
                  }

                  /* Light Reader Theme Colors */
                  .light-reader .turath-content,
                  .light-reader .turath-content p,
                  .light-reader .turath-content span:not([data-type="title"]):not([data-type="poetry"]):not(.islamic-poetry-verse):not(.turath-poetry-verse):not(.poetry-sadr):not(.poetry-sep):not(.poetry-ajuz):not([data-type="page"]):not([data-type="honorific"]):not(.islamic-honorific):not([data-type="quran"]):not(.islamic-quran-verse):not([data-type="parenthetical"]):not(.islamic-parenthetical):not([data-type="hadith-quote"]):not(.islamic-hadith-quote):not([data-type="bracketed-note"]):not(.islamic-bracketed-note):not([data-type="footnote-ref"]):not(.islamic-footnote-ref):not([data-type="surah-ref"]):not(.turath-surah-ref):not([data-type="section-lead"]):not(.islamic-section-lead) {
                      color: #0f172a !important;
                  }
                  .light-reader .turath-content h1,
                  .light-reader .turath-content h2,
                  .light-reader .turath-content .main-title {
                      color: ${lightTitleColor} !important;
                      -webkit-text-fill-color: ${lightTitleColor} !important;
                      background: none !important;
                      border-bottom-color: ${lightTitleBorder} !important;
                  }
                  .light-reader .turath-content span[data-type="title"],
                  .light-reader .turath-content h3,
                  .light-reader .turath-content h4 {
                      color: ${lightTitleColor} !important;
                      -webkit-text-fill-color: ${lightTitleColor} !important;
                      background: none !important;
                      font-weight: 800 !important;
                  }
                  .light-reader .turath-content span[data-type="honorific"],
                  .light-reader .turath-content .islamic-honorific {
                      color: #64748b !important;
                      -webkit-text-fill-color: #64748b !important;
                  }
                  /* Light Reader Islamic Typography Colors (Study Mode Palette) */
                  .light-reader .turath-content span[data-type="quran"],
                  .light-reader .turath-content .islamic-quran-verse {
                      color: #059669 !important;
                      -webkit-text-fill-color: #059669 !important;
                      background: none !important;
                      border: none !important;
                  }
                  .light-reader .turath-content .turath-ayah-num {
                      color: #059669 !important;
                      -webkit-text-fill-color: #059669 !important;
                  }
                  .light-reader .turath-content span[data-type="parenthetical"],
                  .light-reader .turath-content .islamic-parenthetical,
                  .light-reader .turath-content span[data-type="bracketed-note"],
                  .light-reader .turath-content .islamic-bracketed-note {
                      color: #64748b !important;
                      -webkit-text-fill-color: #64748b !important;
                  }
                  .light-reader .turath-content span[data-type="surah-ref"],
                  .light-reader .turath-content .turath-surah-ref {
                      color: #64748b !important;
                      -webkit-text-fill-color: #64748b !important;
                  }
                  .light-reader .turath-content span[data-type="hadith-quote"],
                  .light-reader .turath-content .islamic-hadith-quote {
                      color: #0284c7 !important;
                      -webkit-text-fill-color: #0284c7 !important;
                  }
                  .light-reader .turath-content span[data-type="poetry"],
                  .light-reader .turath-content div[data-type="poetry"],
                  .light-reader .turath-content .islamic-poetry-block,
                  .light-reader .turath-content .islamic-poetry-verse,
                  .light-reader .turath-content .turath-poetry-verse,
                  .light-reader .turath-content .islamic-poetry-verse .poetry-sadr,
                  .light-reader .turath-content .islamic-poetry-verse .poetry-ajuz {
                      color: #b45309 !important;
                      -webkit-text-fill-color: #b45309 !important;
                  }
                  .light-reader .turath-content .islamic-poetry-verse .poetry-sep,
                  .light-reader .turath-content .turath-poetry-verse .poetry-sep {
                      color: rgba(180, 83, 9, 0.5) !important;
                      -webkit-text-fill-color: rgba(180, 83, 9, 0.5) !important;
                  }
                  .light-reader .turath-content span[data-type="section-lead"],
                  .light-reader .turath-content .islamic-section-lead {
                      color: ${lightTitleColor} !important;
                      -webkit-text-fill-color: ${lightTitleColor} !important;
                      font-weight: 700 !important;
                  }

                  /* Sepia Reader Theme Colors */
                  .sepia-reader .turath-content,
                  .sepia-reader .turath-content p,
                  .sepia-reader .turath-content span:not([data-type="title"]):not([data-type="poetry"]):not(.islamic-poetry-verse):not(.turath-poetry-verse):not(.poetry-sadr):not(.poetry-sep):not(.poetry-ajuz):not([data-type="page"]):not([data-type="honorific"]):not(.islamic-honorific):not([data-type="quran"]):not(.islamic-quran-verse):not([data-type="parenthetical"]):not(.islamic-parenthetical):not([data-type="hadith-quote"]):not(.islamic-hadith-quote):not([data-type="bracketed-note"]):not(.islamic-bracketed-note):not([data-type="footnote-ref"]):not(.islamic-footnote-ref):not([data-type="surah-ref"]):not(.turath-surah-ref):not([data-type="section-lead"]):not(.islamic-section-lead) {
                      color: #3b2a1a !important;
                  }
                  .sepia-reader .turath-content h1,
                  .sepia-reader .turath-content h2,
                  .sepia-reader .turath-content .main-title {
                      color: #92400e !important;
                      -webkit-text-fill-color: #92400e !important;
                      background: none !important;
                      border-bottom-color: rgba(180, 83, 9, 0.4) !important;
                  }
                  .sepia-reader .turath-content span[data-type="title"],
                  .sepia-reader .turath-content h3,
                  .sepia-reader .turath-content h4 {
                      color: #92400e !important;
                      -webkit-text-fill-color: #92400e !important;
                      background: none !important;
                      font-weight: 800 !important;
                  }
                  .sepia-reader .turath-content span[data-type="honorific"],
                  .sepia-reader .turath-content .islamic-honorific {
                      color: #78716c !important;
                      -webkit-text-fill-color: #78716c !important;
                  }
                  /* Sepia Reader Islamic Typography Colors (Study Mode Palette) */
                  .sepia-reader .turath-content span[data-type="quran"],
                  .sepia-reader .turath-content .islamic-quran-verse {
                      color: #065f46 !important;
                      -webkit-text-fill-color: #065f46 !important;
                      background: none !important;
                      border: none !important;
                  }
                  .sepia-reader .turath-content .turath-ayah-num {
                      color: #065f46 !important;
                      -webkit-text-fill-color: #065f46 !important;
                  }
                  .sepia-reader .turath-content span[data-type="parenthetical"],
                  .sepia-reader .turath-content .islamic-parenthetical,
                  .sepia-reader .turath-content span[data-type="bracketed-note"],
                  .sepia-reader .turath-content .islamic-bracketed-note {
                      color: #78716c !important;
                      -webkit-text-fill-color: #78716c !important;
                  }
                  .sepia-reader .turath-content span[data-type="surah-ref"],
                  .sepia-reader .turath-content .turath-surah-ref {
                      color: #78716c !important;
                      -webkit-text-fill-color: #78716c !important;
                  }
                  .sepia-reader .turath-content span[data-type="hadith-quote"],
                  .sepia-reader .turath-content .islamic-hadith-quote {
                      color: #0f766e !important;
                      -webkit-text-fill-color: #0f766e !important;
                  }
                  .sepia-reader .turath-content span[data-type="poetry"],
                  .sepia-reader .turath-content div[data-type="poetry"],
                  .sepia-reader .turath-content .islamic-poetry-block,
                  .sepia-reader .turath-content .islamic-poetry-verse,
                  .sepia-reader .turath-content .turath-poetry-verse,
                  .sepia-reader .turath-content .islamic-poetry-verse .poetry-sadr,
                  .sepia-reader .turath-content .islamic-poetry-verse .poetry-ajuz {
                      color: #92400e !important;
                      -webkit-text-fill-color: #92400e !important;
                  }
                  .sepia-reader .turath-content .islamic-poetry-verse .poetry-sep,
                  .sepia-reader .turath-content .turath-poetry-verse .poetry-sep {
                      color: rgba(146, 64, 14, 0.5) !important;
                      -webkit-text-fill-color: rgba(146, 64, 14, 0.5) !important;
                  }
                  .sepia-reader .turath-content span[data-type="section-lead"],
                  .sepia-reader .turath-content .islamic-section-lead {
                      color: #92400e !important;
                      -webkit-text-fill-color: #92400e !important;
                      font-weight: 700 !important;
                  }

                  /* Dark Reader Theme Colors */
                  .dark-reader .turath-content,
                  .dark-reader .turath-content p,
                  .dark-reader .turath-content span:not([data-type="title"]):not([data-type="poetry"]):not(.islamic-poetry-verse):not(.turath-poetry-verse):not(.poetry-sadr):not(.poetry-sep):not(.poetry-ajuz):not([data-type="page"]):not([data-type="honorific"]):not(.islamic-honorific):not([data-type="quran"]):not(.islamic-quran-verse):not([data-type="parenthetical"]):not(.islamic-parenthetical):not([data-type="hadith-quote"]):not(.islamic-hadith-quote):not([data-type="bracketed-note"]):not(.islamic-bracketed-note):not([data-type="footnote-ref"]):not(.islamic-footnote-ref):not([data-type="surah-ref"]):not(.turath-surah-ref):not([data-type="section-lead"]):not(.islamic-section-lead) {
                      color: #ffffff !important;
                  }
                  .dark-reader .turath-content h1,
                  .dark-reader .turath-content h2,
                  .dark-reader .turath-content .main-title {
                      color: ${darkTitleColor} !important;
                      -webkit-text-fill-color: ${darkTitleColor} !important;
                      background: transparent !important;
                      border-bottom-color: ${darkTitleBorder} !important;
                      filter: none !important;
                      text-shadow: none !important;
                      font-weight: 800 !important;
                  }
                  .dark-reader .turath-content span[data-type="title"],
                  .dark-reader .turath-content h3,
                  .dark-reader .turath-content h4 {
                      color: ${darkTitleColor} !important;
                      -webkit-text-fill-color: ${darkTitleColor} !important;
                      background: transparent !important;
                      filter: none !important;
                      text-shadow: none !important;
                      font-weight: 800 !important;
                  }
                  .dark-reader .turath-content span[data-type="honorific"],
                  .dark-reader .turath-content .islamic-honorific {
                      color: #94a3b8 !important;
                      -webkit-text-fill-color: #94a3b8 !important;
                  }
                  /* Dark Reader Islamic Typography Colors (Study Mode Palette) */
                  .dark-reader .turath-content span[data-type="quran"],
                  .dark-reader .turath-content .islamic-quran-verse {
                      color: #34d399 !important;
                      -webkit-text-fill-color: #34d399 !important;
                      background: none !important;
                      border: none !important;
                      text-shadow: none !important;
                  }
                  .dark-reader .turath-content .turath-ayah-num {
                      color: #34d399 !important;
                      -webkit-text-fill-color: #34d399 !important;
                  }
                  .dark-reader .turath-content span[data-type="parenthetical"],
                  .dark-reader .turath-content .islamic-parenthetical,
                  .dark-reader .turath-content span[data-type="bracketed-note"],
                  .dark-reader .turath-content .islamic-bracketed-note {
                      color: #94a3b8 !important;
                      -webkit-text-fill-color: #94a3b8 !important;
                  }
                  .dark-reader .turath-content span[data-type="surah-ref"],
                  .dark-reader .turath-content .turath-surah-ref {
                      color: #94a3b8 !important;
                      -webkit-text-fill-color: #94a3b8 !important;
                  }
                  .dark-reader .turath-content span[data-type="hadith-quote"],
                  .dark-reader .turath-content .islamic-hadith-quote {
                      color: #38bdf8 !important;
                      -webkit-text-fill-color: #38bdf8 !important;
                  }
                  .dark-reader .turath-content span[data-type="poetry"],
                  .dark-reader .turath-content div[data-type="poetry"],
                  .dark-reader .turath-content .islamic-poetry-block,
                  .dark-reader .turath-content .islamic-poetry-verse,
                  .dark-reader .turath-content .turath-poetry-verse,
                  .dark-reader .turath-content .islamic-poetry-verse .poetry-sadr,
                  .dark-reader .turath-content .islamic-poetry-verse .poetry-ajuz {
                      color: #fbbf24 !important;
                      -webkit-text-fill-color: #fbbf24 !important;
                  }
                  .dark-reader .turath-content .islamic-poetry-verse .poetry-sep,
                  .dark-reader .turath-content .turath-poetry-verse .poetry-sep {
                      color: rgba(251, 191, 36, 0.5) !important;
                      -webkit-text-fill-color: rgba(251, 191, 36, 0.5) !important;
                  }
                  .dark-reader .turath-content span[data-type="section-lead"],
                  .dark-reader .turath-content .islamic-section-lead {
                      color: ${darkTitleColor} !important;
                      -webkit-text-fill-color: ${darkTitleColor} !important;
                      font-weight: 700 !important;
                  }
                  .turath-content span[data-type="page"] {
                    display: inline-flex;
                    align-items: center;
                    font-size: 0.72em;
                    font-family: var(--font-sans, 'Cairo', sans-serif);
                    font-weight: 700;
                    color: ${lightTitleColor};
                    background: ${accentColor === 'amber' ? 'rgba(184, 141, 70, 0.1)' : accentColor === 'emerald' ? 'rgba(13, 148, 136, 0.1)' : accentColor === 'blue' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(149, 11, 196, 0.1)'};
                    border: 1px solid ${lightTitleBorder};
                    padding: 0.1rem 0.55rem;
                    border-radius: 6px;
                    margin: 1rem 0 0.5rem;
                    user-select: none;
                    line-height: 1.3;
                    direction: rtl;
                  }
                  .dark-reader .turath-content span[data-type="page"] {
                    color: ${darkTitleColor} !important;
                    background: ${accentColor === 'amber' ? 'rgba(223, 191, 131, 0.15)' : accentColor === 'emerald' ? 'rgba(45, 212, 191, 0.15)' : accentColor === 'blue' ? 'rgba(96, 165, 250, 0.15)' : 'rgba(168, 85, 247, 0.15)'} !important;
                    border-color: ${darkTitleBorder} !important;
                  }
                  .turath-content {
                      white-space: pre-wrap;
                      word-wrap: break-word;
                      text-align: justify;
                  }
                  .turath-content p,
                  .turath-content .turath-p {
                    display: block !important;
                    margin-top: 0 !important;
                    margin-bottom: 0.65rem !important;
                    line-height: 2.3 !important;
                    text-align: justify !important;
                    white-space: normal !important;
                  }
                  .turath-content p:last-child,
                  .turath-content .turath-p:last-child {
                    margin-bottom: 0 !important;
                  }
                  .turath-content span[data-type="title"] + p,
                  .turath-content span[data-type="title"] + .turath-p {
                    margin-top: 0.35rem !important;
                  }
                  /* Modern Glassmorphic Footnote Reference Badge Styling */
                  .turath-content .islamic-footnote-sup {
                    display: inline-flex !important;
                    vertical-align: baseline !important;
                    position: relative !important;
                    top: -0.22em !important;
                    margin: 0 0.2rem !important;
                    line-height: 1 !important;
                  }
                  .turath-content .islamic-footnote-ref {
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    text-decoration: none !important;
                    border-bottom: none !important;
                    line-height: 1 !important;
                    user-select: none !important;
                    backdrop-filter: blur(8px) !important;
                    -webkit-backdrop-filter: blur(8px) !important;
                    transition: all 0.2s ease-in-out !important;
                    min-width: 22px !important;
                    height: 22px !important;
                    padding: 0 5px !important;
                    border-radius: 9999px !important;
                    font-family: 'Amiri', 'Scheherazade New', 'Cairo', serif !important;
                    font-weight: 700 !important;
                    font-size: 13px !important;
                  }
                  .light-reader .turath-content .islamic-footnote-ref {
                    background: ${accentColor === 'amber' ? 'rgba(184, 141, 70, 0.12)' : accentColor === 'emerald' ? 'rgba(13, 148, 136, 0.12)' : accentColor === 'blue' ? 'rgba(37, 99, 235, 0.12)' : 'rgba(149, 11, 196, 0.12)'} !important;
                    border: 1.5px solid ${accentColor === 'amber' ? '#b88d46' : accentColor === 'emerald' ? '#0d9488' : accentColor === 'blue' ? '#2563eb' : '#950bc4'} !important;
                    color: ${accentColor === 'amber' ? '#78531b' : accentColor === 'emerald' ? '#0f766e' : accentColor === 'blue' ? '#1d4ed8' : '#7e22ce'} !important;
                    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08) !important;
                  }
                  .light-reader .turath-content .islamic-footnote-ref:hover {
                    background: ${accentColor === 'amber' ? 'rgba(184, 141, 70, 0.25)' : accentColor === 'emerald' ? 'rgba(13, 148, 136, 0.25)' : accentColor === 'blue' ? 'rgba(37, 99, 235, 0.25)' : 'rgba(149, 11, 196, 0.25)'} !important;
                    border-color: ${accentColor === 'amber' ? '#8e682d' : accentColor === 'emerald' ? '#0f766e' : accentColor === 'blue' ? '#1e40af' : '#6b21a8'} !important;
                    transform: scale(1.1) !important;
                  }
                  .sepia-reader .turath-content .islamic-footnote-ref {
                    background: rgba(180, 83, 9, 0.1) !important;
                    border: 1px solid rgba(180, 83, 9, 0.3) !important;
                    color: #92400e !important;
                    box-shadow: 0 2px 6px rgba(180, 83, 9, 0.08) !important;
                  }
                  .sepia-reader .turath-content .islamic-footnote-ref:hover {
                    background: rgba(180, 83, 9, 0.2) !important;
                    border-color: rgba(180, 83, 9, 0.5) !important;
                    transform: scale(1.1) !important;
                  }
                  .dark-reader .turath-content .islamic-footnote-ref {
                    background: ${accentColor === 'amber' ? 'rgba(223, 191, 131, 0.15)' : accentColor === 'emerald' ? 'rgba(45, 212, 191, 0.15)' : accentColor === 'blue' ? 'rgba(96, 165, 250, 0.15)' : 'rgba(168, 85, 247, 0.18)'} !important;
                    border: 1px solid ${darkTitleBorder} !important;
                    color: ${darkTitleColor} !important;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
                  }
                  .dark-reader .turath-content .islamic-footnote-ref:hover {
                    background: ${accentColor === 'amber' ? 'rgba(223, 191, 131, 0.3)' : accentColor === 'emerald' ? 'rgba(45, 212, 191, 0.3)' : accentColor === 'blue' ? 'rgba(96, 165, 250, 0.3)' : 'rgba(168, 85, 247, 0.35)'} !important;
                    border-color: ${darkTitleColor} !important;
                    transform: scale(1.1) !important;
                  }

                  /* In-Page Quick Search Highlight Markers */
                  .turath-content mark.page-search-match {
                    background-color: #fef08a !important;
                    color: #713f12 !important;
                    border-radius: 4px;
                    padding: 1px 3px;
                    font-weight: 700;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.06);
                    transition: all 0.2s ease;
                  }
                  .light-reader .turath-content mark.page-search-match {
                    background-color: #fde047 !important;
                    color: #582900 !important;
                    border-bottom: 2px solid #ca8a04;
                  }
                  .dark-reader .turath-content mark.page-search-match {
                    background-color: rgba(234, 179, 8, 0.35) !important;
                    color: #fef08a !important;
                    border: 1px solid rgba(234, 179, 8, 0.4);
                  }
                  .sepia-reader .turath-content mark.page-search-match {
                    background-color: #fde047 !important;
                    color: #451a03 !important;
                  }

                  .turath-content mark.page-search-match.page-search-active-match {
                    background-color: #f97316 !important;
                    color: #ffffff !important;
                    border-radius: 5px;
                    padding: 2px 5px;
                    font-weight: 900;
                    box-shadow: 0 0 12px rgba(249, 115, 22, 0.7);
                    outline: 2px solid #ea580c;
                  }
                  .dark-reader .turath-content mark.page-search-match.page-search-active-match {
                    background-color: #f59e0b !important;
                    color: #000000 !important;
                    box-shadow: 0 0 16px rgba(245, 158, 11, 0.85);
                    outline: 2px solid #fde68a;
                  }

                  /* Book Full-Text Search Result Match (matches search result snippet) */
                  .turath-content mark.book-search-match {
                    color: #dc2626 !important;
                    background-color: rgba(220, 38, 38, 0.12) !important;
                    font-weight: 700 !important;
                    border-radius: 4px;
                    padding: 1px 4px;
                    box-shadow: 0 0 0 1.5px rgba(220, 38, 38, 0.35);
                    transition: all 0.25s ease;
                  }
                  .dark-reader .turath-content mark.book-search-match {
                    color: #fb7185 !important;
                    background-color: rgba(251, 113, 133, 0.22) !important;
                    box-shadow: 0 0 0 1.5px rgba(251, 113, 133, 0.45);
                  }
                  .sepia-reader .turath-content mark.book-search-match {
                    color: #b91c1c !important;
                    background-color: rgba(185, 28, 28, 0.15) !important;
                    box-shadow: 0 0 0 1.5px rgba(185, 28, 28, 0.35);
                  }

                  /* User Persistent Highlights */
                  .turath-content mark[data-user-highlight="true"],
                  mark[data-user-highlight="true"] {
                    border-radius: 4px !important;
                    padding: 1px 3px !important;
                    color: #0e0e0e !important;
                    -webkit-text-fill-color: #0e0e0e !important;
                    cursor: pointer !important;
                    display: inline !important;
                    text-decoration: none !important;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
                    transition: all 0.2s ease !important;
                  }
                  .turath-content mark[data-user-highlight="true"]:hover,
                  mark[data-user-highlight="true"]:hover {
                    filter: brightness(0.92);
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18) !important;
                  }
                `}</style>
                  <div className={`${readerTheme === 'dark' ? 'dark-reader' : readerTheme === 'sepia' ? 'sepia-reader' : 'light-reader'}`}>
                    {readingMode === 'paged' ? (
                      <>
                        {/* Matn Section */}
                        <div
                          data-page={currentPage}
                          data-selectable="true"
                          data-library-content="true"
                          className={`turath-content library-reader-content selectable-content prose prose-lg max-w-none leading-[2.4] ${selectionClass} ${fontFamily} prose-headings:m-0 prose-headings:leading-tight prose-p:my-1`}
                          style={{ fontSize: `${fontSize}px` }}
                          dangerouslySetInnerHTML={{ __html: renderContentHtml(pageText?.matn || pageText?.main || '') }}
                        />

                        {/* Sharh Section with Divider */}
                        {pageText?.sharh && (
                          <div className="mt-6">
                            <RenderSharhDivider readerTheme={readerTheme} />
                            <div
                              data-page={currentPage}
                              data-selectable="true"
                              data-library-content="true"
                              className={`turath-content library-reader-content selectable-content prose prose-lg max-w-none leading-[2.4] ${selectionClass} ${fontFamily} prose-headings:m-0 prose-headings:leading-tight prose-p:my-1`}
                              style={{ fontSize: `${fontSize}px` }}
                              dangerouslySetInnerHTML={{ __html: renderContentHtml(pageText.sharh) }}
                            />
                          </div>
                        )}

                        {/* Footnote Section with Divider */}
                        {pageText?.footnote && (
                          <RenderFootnotes
                            footnoteText={pageText.footnote}
                            readerTheme={readerTheme}
                            fontFamily={fontFamily}
                            fontSize={fontSize}
                            showTashkeel={showTashkeel}
                          />
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col gap-12 pt-6">
                        {/* Status for previous page */}
                        {loadingPrev && (
                          <div className="flex flex-col items-center justify-center py-6 gap-3 min-h-[100px] opacity-60">
                            <Loader2 className="h-6 w-6 animate-spin text-brand-magenta" />
                            <span className="text-sm font-semibold">جاري جلب الصفحات السابقة...</span>
                          </div>
                        )}

                        {continuousPages.map((p, idx) => {
                          const printCit = getPagePrintCitation(p.page);
                          const displayPage = printCit ? printCit.page : p.page;
                          const displayVol = printCit ? printCit.vol : null;

                          return (
                            <div key={p.page} data-page={p.page} className={`w-full relative px-3.5 py-5 pb-11 sm:px-8 sm:py-8 sm:pb-12 md:py-9 md:px-10 md:pb-14 rounded-xl sm:rounded-2xl border ${readerTheme === 'dark' ? 'border-white/10 bg-[#181825]/40' : readerTheme === 'sepia' ? 'border-[#E2D6C0] bg-[#FFFDF9]' : 'border-gray-200 bg-white/40'} shadow-sm transition-all duration-300 hover:shadow-md group`}>
                              <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rounded-full px-5 py-1 text-sm font-bold shadow-sm border backdrop-blur-md flex items-center gap-1.5 ${readerTheme === 'dark' ? 'bg-[#0d071a] border-white/10 text-white/70' : readerTheme === 'sepia' ? 'bg-[#FAF5ED] border-[#E2D6C0] text-[#7A401A]' : 'bg-white border-gray-200 text-gray-500'}`}>
                                <span>صفحة {displayPage}</span>
                                {displayVol && availableVolumes.length > 1 && (
                                  <span className="text-[11px] opacity-60 font-normal">
                                    (جـ {toEasternArabicNumerals(displayVol)})
                                  </span>
                                )}
                              </div>

                            {/* Continuous Page Actions Toolbar (Bottom-Left Corner) */}
                            <div className="continuous-page-actions absolute bottom-2.5 left-3 sm:bottom-3 sm:left-4 z-20">
                              {/* 3-Dots Trigger Button (Fixed position, NEVER shifts or moves) */}
                              <button
                                type="button"
                                onClick={() => setActiveContinuousMenuPage(prev => prev === p.page ? null : p.page)}
                                className={`p-1.5 sm:p-2 rounded-xl transition-all flex items-center justify-center cursor-pointer border backdrop-blur-md shadow-xs ${
                                  activeContinuousMenuPage === p.page
                                    ? accentColor === 'amber'
                                      ? 'text-[#b88d46] bg-amber-500/20 border-amber-500/40 ring-1 ring-amber-500/30'
                                      : accentColor === 'emerald'
                                        ? 'text-teal-600 bg-teal-500/20 border-teal-500/40 ring-1 ring-teal-500/30'
                                        : accentColor === 'blue'
                                          ? 'text-blue-600 bg-blue-500/20 border-blue-500/40 ring-1 ring-blue-500/30'
                                          : 'text-brand-magenta bg-brand-magenta/20 border-brand-magenta/40 ring-1 ring-brand-magenta/30'
                                    : readerTheme === 'dark'
                                      ? 'bg-[#181825]/95 border-white/10 text-white/70 hover:text-white hover:bg-white/10'
                                      : readerTheme === 'sepia'
                                        ? 'bg-[#FAF5ED]/95 border-[#E2D6C0] text-[#4A3523]/70 hover:text-[#4A3523] hover:bg-[#E2D6C0]/50'
                                        : 'bg-white/95 border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                                }`}
                                title="خيارات ومشاركة الصفحة"
                                aria-label="خيارات ومشاركة الصفحة"
                              >
                                <MoreHorizontal className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                              </button>

                              {/* Floating Horizontal Actions Menu (Opens ABOVE the button, completely clear of the page badge) */}
                              {activeContinuousMenuPage === p.page && (
                                <div
                                  dir="ltr"
                                  className={`absolute bottom-full mb-2 left-0 flex flex-row items-center gap-1 sm:gap-1.5 p-1 rounded-xl border backdrop-blur-xl shadow-xl z-30 animate-in fade-in slide-in-from-bottom-2 duration-150 ${
                                    readerTheme === 'dark'
                                      ? 'bg-[#0f1422]/98 border-white/15 text-white shadow-black/80'
                                      : readerTheme === 'sepia'
                                        ? 'bg-[#FAF5ED]/98 border-[#E2D6C0] text-[#3D2C1D]'
                                        : 'bg-white/98 border-gray-200 text-slate-800 shadow-lg'
                                  }`}
                                >
                                  {/* Bookmark */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setBookmarks(prev => prev.includes(p.page) ? prev.filter(b => b !== p.page) : [...prev, p.page]);
                                    }}
                                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                      bookmarks.includes(p.page)
                                        ? accentColor === 'amber'
                                          ? 'bg-amber-500/15 text-[#b88d46]'
                                          : accentColor === 'emerald'
                                            ? 'bg-teal-500/15 text-teal-600'
                                            : accentColor === 'blue'
                                              ? 'bg-blue-500/15 text-blue-600'
                                              : 'bg-brand-magenta/15 text-brand-magenta'
                                        : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5'
                                    }`}
                                    title={bookmarks.includes(p.page) ? "إزالة العلامة" : "حفظ كعلامة مرجعية"}
                                  >
                                    {bookmarks.includes(p.page) ? (
                                      <BookmarkCheck className={`h-4 w-4 ${accentColor === 'amber' ? 'fill-amber-500/20' : accentColor === 'emerald' ? 'fill-teal-500/20' : accentColor === 'blue' ? 'fill-blue-500/20' : 'fill-brand-magenta/20'}`} />
                                    ) : (
                                      <Bookmark className="h-4 w-4" />
                                    )}
                                  </button>

                                  <div className="w-px h-3.5 bg-border/50 shrink-0" />

                                  {/* Copy Page Text */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const textToCopy = formatPageCopyText(
                                        p.matn || p.text,
                                        p.sharh,
                                        p.footnote,
                                        book.title,
                                        book.author,
                                        printCit?.page ? Number(printCit.page) : p.page
                                      );
                                      navigator.clipboard.writeText(textToCopy);
                                      setCopiedContinuousPage(p.page);
                                      setTimeout(() => setCopiedContinuousPage(null), 2000);
                                    }}
                                    className="p-1.5 rounded-lg transition-all text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                                    title="نسخ محتوى الصفحة"
                                  >
                                    {copiedContinuousPage === p.page ? (
                                      <Check className="h-4 w-4 text-emerald-500" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </button>

                                  <div className="w-px h-3.5 bg-border/50 shrink-0" />

                                  {/* Audio Reader */}
                                  <AudioReaderButton
                                    text={p.matn ? `${p.matn} ${p.sharh || ''}` : p.text}
                                    dark={readerTheme === 'dark'}
                                    showTextLabel={false}
                                    hidePodcast={true}
                                    onStateChange={(playing) => setIsReadingPage(playing)}
                                    orientation="horizontal"
                                    colorTheme={accentColor}
                                    menuPlacement="top"
                                    className="!bg-transparent !border-transparent !shadow-none !p-1.5 !rounded-lg !text-muted-foreground hover:!bg-black/5 dark:hover:!bg-white/5 cursor-pointer"
                                  />

                                  <div className="w-px h-3.5 bg-border/50 shrink-0" />

                                  {/* Share Page */}
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const shareText = formatPageCopyText(
                                        p.matn || p.text,
                                        p.sharh,
                                        p.footnote,
                                        book.title,
                                        book.author,
                                        printCit?.page ? Number(printCit.page) : p.page
                                      );
                                      if (navigator.share) {
                                        try {
                                          await navigator.share({
                                            title: `${book.title} - صـ ${displayPage}`,
                                            text: shareText.slice(0, 300) + '...',
                                            url: window.location.href,
                                          });
                                        } catch { }
                                      } else {
                                        navigator.clipboard.writeText(`${window.location.href}\n\n${book.title} - صـ ${displayPage}\n${shareText.slice(0, 300)}...`);
                                        setCopiedContinuousPage(p.page);
                                        setTimeout(() => setCopiedContinuousPage(null), 2000);
                                      }
                                    }}
                                    className="p-1.5 rounded-lg transition-all text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                                    title="مشاركة الصفحة"
                                  >
                                    <Share2 className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Matn Section */}
                            <div
                              data-page={p.page}
                              data-selectable="true"
                              data-library-content="true"
                              className={`turath-content library-reader-content selectable-content prose prose-lg max-w-none leading-[2.4] ${selectionClass} ${fontFamily} prose-headings:m-0 prose-headings:leading-tight prose-p:my-1`}
                              style={{ fontSize: `${fontSize}px` }}
                              dangerouslySetInnerHTML={{ __html: renderContentHtml(p.matn || p.text) }}
                            />

                            {/* Sharh Section with Divider */}
                            {p.sharh && (
                              <div className="mt-6">
                                <RenderSharhDivider readerTheme={readerTheme} />
                                <div
                                  data-page={p.page}
                                  data-selectable="true"
                                  data-library-content="true"
                                  className={`turath-content library-reader-content selectable-content prose prose-lg max-w-none leading-[2.4] ${selectionClass} ${fontFamily} prose-headings:m-0 prose-headings:leading-tight prose-p:my-1`}
                                  style={{ fontSize: `${fontSize}px` }}
                                  dangerouslySetInnerHTML={{ __html: renderContentHtml(p.sharh) }}
                                />
                              </div>
                            )}

                            {/* Footnote Section with Divider */}
                            {p.footnote && (
                              <RenderFootnotes
                                footnoteText={p.footnote}
                                readerTheme={readerTheme}
                                fontFamily={fontFamily}
                                fontSize={fontSize}
                                showTashkeel={showTashkeel}
                              />
                            )}
                          </div>
                          );
                        })}

                        {/* Status for next page */}
                        <div className="flex flex-col items-center justify-center p-8 gap-4 min-h-[150px]">
                          {loadingNext ? (
                            <div className="flex flex-col items-center gap-3 opacity-60">
                              <Loader2 className={`h-8 w-8 animate-spin ${getPaginationLayersIconClass()}`} />
                              <span className="text-sm font-semibold">جاري سحب الصفحة التالية...</span>
                            </div>
                          ) : loadNextError ? (
                            <div className="flex flex-col items-center gap-4 text-center">
                              <span className="text-sm text-red-500 font-semibold bg-red-500/10 px-6 py-3 rounded-xl border border-red-500/20">حدث خطأ في تحميل الصفحة التالية. يرجى التحقق من اتصالك بالإنترنت.</span>
                              <button
                                onClick={loadNextPage}
                                className={`px-6 py-2 rounded-xl font-bold shadow-md transition-all hover:scale-105 active:scale-95 ${accentColor === 'amber'
                                  ? 'bg-gradient-to-r from-[#8e682d] via-[#b88d46] to-[#dfbf83] text-stone-950 hover:brightness-110'
                                  : accentColor === 'emerald'
                                    ? 'bg-teal-600 text-white hover:bg-teal-500'
                                    : accentColor === 'blue'
                                      ? 'bg-blue-600 text-white hover:bg-blue-500'
                                      : 'bg-brand-magenta text-white hover:bg-brand-magenta/90'
                                  }`}
                              >
                                إعادة المحاولة
                              </button>
                            </div>
                          ) : hasReachedEnd ? (
                            <span className="text-sm text-muted-foreground opacity-60 font-semibold bg-black/5 dark:bg-white/5 px-6 py-2 rounded-full border border-black/10 dark:border-white/10">نهاية الكتاب</span>
                          ) : null}
                        </div>
                      </div>
                    )}

                    {/* Spacer to allow scrolling footnotes past the floating footer */}
                    <div className="h-32 md:h-48 shrink-0 w-full" />
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Pagination Footer with Scrub Bar & Auto-Hide on Mobile */}
          {!distractionFree && (
            <div
              className={`shrink-0 w-full md:w-auto md:absolute md:bottom-2 md:left-1/2 md:-translate-x-1/2 z-20 transition-all duration-300 ${
                sidebarTab !== 'none'
                  ? 'max-md:hidden md:opacity-100 md:translate-y-0'
                  : isMobilePaginationVisible
                    ? `opacity-100 translate-y-0 ${isAudioBarOpen ? 'max-h-72' : 'max-h-28'} pointer-events-auto`
                    : 'max-md:opacity-0 max-md:translate-y-6 max-md:max-h-0 max-md:pointer-events-none md:opacity-100 md:translate-y-0'
              }`}
            >
              <footer
                onClick={(e) => e.stopPropagation()}
                className={`flex flex-col items-center gap-1.5 md:gap-2 px-3 py-1.5 md:py-2 md:rounded-2xl border-t md:border backdrop-blur-xl shadow-md md:shadow-2xl transition-colors ${
                  readerTheme === 'dark'
                    ? 'bg-[#0f1422]/95 border-white/10 text-white'
                    : readerTheme === 'sepia'
                      ? 'bg-[#FAF5ED]/95 border-[#E2D6C0] text-[#3D2C1D]'
                      : 'bg-white/95 border-gray-200 text-slate-800'
                }`}
              >
                {/* 0. Dedicated Active Audio Player Shelf (يتمدد لأعلى كجزء متكامل مع فريم التقليب) */}
                {isAudioBarOpen && (
                  <div
                    className={`w-full px-2.5 py-1 rounded-xl border-b mb-1 select-none transition-all ${
                      readerTheme === 'dark'
                        ? 'bg-white/[0.03] border-white/10 text-white'
                        : readerTheme === 'sepia'
                          ? 'bg-[#EAE0CF]/70 border-[#DFCDB7] text-[#3D2C1D]'
                          : 'bg-slate-50/80 border-slate-200/80 text-slate-800'
                    }`}
                  >
                    <AudioReaderButton
                      text={pageText?.matn ? `${pageText.matn} ${pageText.sharh || ''}` : (pageText?.main || '')}
                      dark={readerTheme === 'dark'}
                      showTextLabel={false}
                      hidePodcast={true}
                      autoPlay={true}
                      variant="deck"
                      onClose={() => {
                        stopAllSpeech();
                        setIsReadingPage(false);
                        setIsAudioBarOpen(false);
                      }}
                      onStateChange={(playing) => setIsReadingPage(playing)}
                      colorTheme={accentColor}
                    />
                  </div>
                )}

                {/* 1. Scrub / Slider Bar for Rapid Page Skimming (شريط التقليب السريع على الحافة العلوية) */}
                {(() => {
                  const scrubMax = currentVolumeInfo ? currentVolumeInfo.totalPages : (maxPage || 1);
                  const effectiveCurrent = isScrubbing ? scrubPage : currentPage;
                  const scrubCurrentVal = currentVolumeInfo
                    ? Math.max(1, Math.min(currentVolumeInfo.totalPages, effectiveCurrent - currentVolumeInfo.startDigitalPage + 1))
                    : effectiveCurrent;
                  const scrubStartLabel = currentVolumeInfo?.startPrintPage ?? 1;
                  const scrubEndLabel = currentVolumeInfo?.endPrintPage ?? currentVolumeInfo?.totalPages ?? maxPage;

                  // Get printed page label for tooltip
                  let tooltipLabel = `صفحة ${scrubPage}`;
                  if (currentVolumeInfo) {
                    const scrubEntry = pageMap && pageMap[scrubPage - 1];
                    const printP = scrubEntry ? scrubEntry.split(',')[1] : null;
                    tooltipLabel = printP
                      ? `صـ ${printP} (جـ ${currentVolumeInfo.vol})`
                      : `صـ ${scrubCurrentVal} (جـ ${currentVolumeInfo.vol})`;
                  }

                  return (
                    <div className="w-full flex items-center gap-2 px-1 relative group/scrubber">
                      <span className="text-[9px] font-mono opacity-50 shrink-0">{scrubStartLabel}</span>
                      <div className="relative flex-1 flex items-center h-4 cursor-pointer">
                        {/* Background Track */}
                        <div className="absolute inset-x-0 h-1 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                          {/* Active Progress Fill */}
                          <div
                            className={`h-full transition-all ${
                              accentColor === 'amber'
                                ? 'bg-amber-500'
                                : accentColor === 'emerald'
                                  ? 'bg-teal-600'
                                  : accentColor === 'blue'
                                    ? 'bg-blue-600'
                                    : 'bg-brand-magenta'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, ((scrubCurrentVal / (scrubMax || 1)) * 100)))}%` }}
                          />
                        </div>

                        {/* Scrub Range Slider */}
                        <input
                          type="range"
                          min={1}
                          max={scrubMax}
                          value={scrubCurrentVal}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const targetDigital = currentVolumeInfo
                              ? currentVolumeInfo.startDigitalPage + val - 1
                              : val;
                            setScrubPage(targetDigital);
                            setIsScrubbing(true);
                            setIsMobilePaginationVisible(true);
                          }}
                          onMouseDown={() => setIsScrubbing(true)}
                          onTouchStart={() => setIsScrubbing(true)}
                          onMouseUp={() => {
                            setCurrentPage(scrubPage);
                            setIsScrubbing(false);
                            showMobilePagination();
                          }}
                          onTouchEnd={() => {
                            setCurrentPage(scrubPage);
                            setIsScrubbing(false);
                            showMobilePagination();
                          }}
                          className="absolute inset-x-0 w-full h-4 opacity-0 cursor-pointer z-10"
                          title="اسحب للتقليب السريع بين صفحات الجزء"
                        />

                        {/* Floating Tooltip while scrubbing */}
                        {isScrubbing && (
                          <div
                            className={`absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded-lg text-[10px] font-black shadow-lg pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 ${
                              readerTheme === 'dark'
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-900 text-white'
                            }`}
                            style={{
                              left: `${Math.min(95, Math.max(5, ((scrubCurrentVal / (scrubMax || 1)) * 100)))}%`
                            }}
                          >
                            {tooltipLabel}
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] font-mono opacity-50 shrink-0">{scrubEndLabel}</span>
                    </div>
                  );
                })()}

                {/* 2. Controls Row: In-page Search, Prev, Page Info, Next, Page Actions */}
                <div className="w-full flex items-center justify-between md:justify-center gap-1.5 sm:gap-2">
                    {/* In-Page Search Button (البحث في الصفحة الحالية) - Mobile only */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsPageSearchOpen(true);
                        showMobilePagination();
                      }}
                      className={`flex items-center justify-center p-1.5 md:p-2 rounded-xl transition-all font-bold shadow-xs cursor-pointer shrink-0 md:hidden ${
                      isPageSearchOpen
                        ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40'
                        : readerTheme === 'dark'
                          ? 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                          : readerTheme === 'sepia'
                            ? 'bg-[#F0E5D4] hover:bg-[#8B5226] text-[#4A3523] hover:text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                    title="البحث داخل الصفحة الحالية"
                    aria-label="البحث داخل الصفحة الحالية"
                  >
                    <Search className="h-4 w-4 md:h-4.5 md:w-4.5" />
                  </button>

                  {/* Previous Page (RTL: Right Arrow) */}
                  <button
                    type="button"
                    onClick={() => {
                      goPrev();
                      showMobilePagination();
                    }}
                    disabled={currentPage <= 1}
                    className={`flex items-center justify-center p-1.5 md:p-2 rounded-xl transition-all font-bold shadow-xs disabled:opacity-30 disabled:pointer-events-none group cursor-pointer shrink-0 ${
                      readerTheme === 'dark'
                        ? 'bg-white/5 hover:bg-white/10 text-white'
                        : readerTheme === 'sepia'
                          ? 'bg-[#F0E5D4] hover:bg-[#8B5226] text-[#4A3523] hover:text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                    title="الصفحة السابقة"
                  >
                    <ChevronRight className="h-4 w-4 md:h-5 md:w-5 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* Inline Volume & Page Info / Direct Jump */}
                  <div
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 rounded-xl transition-all border min-w-0 ${
                      readerTheme === 'dark'
                        ? 'border-white/10 bg-white/5'
                        : readerTheme === 'sepia'
                          ? 'border-[#E2D6C0] bg-black/[0.02]'
                          : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    {/* Volume Bottom Sheet Selector Button */}
                    <div className="relative shrink-0" ref={volumePickerRef}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsVolumePickerOpen(prev => !prev);
                          showMobilePagination();
                        }}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-lg transition-all font-bold text-xs sm:text-sm cursor-pointer select-none active:scale-95 ${
                          isVolumePickerOpen
                            ? accentColor === 'amber'
                              ? 'bg-amber-500/20 text-amber-600 dark:text-[#dfbf83] ring-1 ring-amber-500/40'
                              : accentColor === 'emerald'
                                ? 'bg-teal-500/20 text-teal-600 dark:text-teal-300 ring-1 ring-teal-500/40'
                                : accentColor === 'blue'
                                  ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300 ring-1 ring-blue-500/40'
                                  : 'bg-purple-500/20 text-brand-magenta dark:text-purple-300 ring-1 ring-purple-500/40'
                            : 'hover:bg-black/5 dark:hover:bg-white/10'
                        }`}
                        title="اضغط لاختيار المجلد"
                      >
                        <span className="text-[10px] sm:text-xs font-bold opacity-75">المجلد</span>
                        <span className="font-black">
                          {toEasternArabicNumerals(currentPrintCitation?.vol || printVolInput || '1')}
                        </span>
                        <ChevronUp className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ${isVolumePickerOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Volume Picker Bottom Sheet Drawer (درج سفلي لعرض المجلدات مطابق للتصميم) */}
                      {typeof document !== 'undefined' && createPortal(
                        <AnimatePresence>
                          {isVolumePickerOpen && (
                              <div dir="rtl" className="fixed inset-0 z-[120] flex flex-col justify-end">
                                {/* Backdrop */}
                                <motion.div
                                  key="volume-picker-backdrop"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.25 }}
                                  onClick={() => setIsVolumePickerOpen(false)}
                                  className="fixed inset-0 bg-black/50 backdrop-blur-xs cursor-pointer"
                                />

                                {/* Bottom Sheet */}
                                <motion.div
                                  key="volume-picker-sheet"
                                  initial={{ y: '100%' }}
                                  animate={{ y: 0 }}
                                  exit={{ y: '100%' }}
                                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                  onClick={(e) => e.stopPropagation()}
                                  className={`relative w-full max-w-lg mx-auto max-h-[75vh] flex flex-col rounded-t-3xl border-t shadow-2xl overflow-hidden z-10 ${
                                    readerTheme === 'dark'
                                      ? 'bg-[#0f1422]/98 border-white/15 text-white shadow-black/80'
                                      : readerTheme === 'sepia'
                                        ? 'bg-[#FAF5ED]/98 border-[#E2D6C0] text-[#3D2C1D] shadow-2xl'
                                        : 'bg-white/98 border-slate-200 text-slate-900 shadow-2xl'
                                  }`}
                                >
                                  {/* Drag Handle & Header */}
                                  <div className="shrink-0 px-5 pt-3 pb-3 border-b border-inherit/15">
                                    <div className="w-10 h-1 rounded-full bg-black/15 dark:bg-white/20 mx-auto mb-3" />
                                    <div className="flex items-center justify-between">
                                      <h3 className="font-bold text-base sm:text-lg">كل المجلدات</h3>
                                      <button
                                        type="button"
                                        onClick={() => setIsVolumePickerOpen(false)}
                                        className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                        title="إغلاق"
                                      >
                                        <X className="w-5 h-5" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Volume List */}
                                  <div
                                    className="flex-1 overflow-y-auto px-4 py-2.5 custom-scrollbar flex flex-col divide-y divide-inherit/10"
                                    style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1.5rem)' }}
                                  >
                                    {availableVolumes.map((vol) => {
                                      const isCurrent = String(vol) === String(currentPrintCitation?.vol || printVolInput || '1');
                                      return (
                                        <button
                                          key={vol}
                                          type="button"
                                          onClick={() => {
                                            handleSelectVolume(vol);
                                            setIsVolumePickerOpen(false);
                                            showMobilePagination();
                                          }}
                                          className={`w-full flex items-center justify-between px-4 py-3.5 text-right text-sm sm:text-base font-bold transition-all cursor-pointer ${
                                            isCurrent
                                              ? accentColor === 'amber'
                                                ? 'bg-amber-500/15 text-amber-600 dark:text-[#dfbf83] font-black rounded-xl'
                                                : accentColor === 'emerald'
                                                  ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300 font-black rounded-xl'
                                                  : accentColor === 'blue'
                                                    ? 'bg-blue-500/15 text-blue-600 dark:text-blue-300 font-black rounded-xl'
                                                    : 'bg-purple-500/15 text-brand-magenta dark:text-purple-300 font-black rounded-xl'
                                              : 'hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200'
                                          }`}
                                        >
                                          <span className="font-scheherazade text-base sm:text-lg">
                                            المجلد ({toEasternArabicNumerals(vol)})
                                          </span>
                                          {isCurrent && (
                                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-current/10 shrink-0">
                                              الحالي
                                            </span>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              </div>
                            )}
                          </AnimatePresence>,
                          document.body
                        )}
                      </div>

                    {/* Page Input */}
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      <span className="text-[10px] sm:text-xs font-bold opacity-75">صـ</span>
                      <input
                        type="text"
                        value={printPageInput}
                        onChange={(e) => {
                          setPrintPageInput(e.target.value);
                          showMobilePagination();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleJumpToPrintPage(printVolInput, printPageInput);
                            (e.target as HTMLInputElement).blur();
                            showMobilePagination();
                          }
                        }}
                        onBlur={() => handleJumpToPrintPage(printVolInput, printPageInput)}
                        placeholder={String(currentPage)}
                        className="w-9 sm:w-14 text-center font-bold text-xs sm:text-sm bg-transparent border-b border-inherit focus:outline-none"
                        title="رقم الصفحة"
                      />
                    </div>

                    {/* Total pages (Volume total if available, otherwise Book total) */}
                    {(currentVolumeInfo ? (currentVolumeInfo.endPrintPage || currentVolumeInfo.totalPages) : maxPage) && (
                      <span
                        className={`shrink-0 text-[10px] sm:text-xs md:text-sm font-sans font-bold tabular-nums rounded-full border transition-colors px-1.5 py-0.5 sm:px-2 md:px-2.5 md:py-1 ${
                          readerTheme === 'dark'
                            ? 'bg-white/5 border-white/15 text-white/70 hover:bg-white/10 hover:text-white'
                            : readerTheme === 'sepia'
                              ? 'bg-black/[0.03] border-[#E2D6C0] text-[#4A3523]/70 hover:bg-[#E2D6C0]/60 hover:text-[#4A3523]'
                              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                        }`}
                        title={
                          currentVolumeInfo
                            ? `إجمالي صفحات الجزء ${currentVolumeInfo.vol}: ${currentVolumeInfo.endPrintPage || currentVolumeInfo.totalPages} صـ (الكتاب كاملاً: ${maxPage} صـ)`
                            : `إجمالي صفحات الكتاب: ${maxPage} صـ`
                        }
                      >
                        <span className="md:hidden">/</span>
                        <span className="hidden md:inline">من</span>{' '}
                        {currentVolumeInfo ? (currentVolumeInfo.endPrintPage || currentVolumeInfo.totalPages) : maxPage}
                        <span className="hidden md:inline"> صـ</span>
                      </span>
                    )}
                  </div>

                  {/* Next Page (RTL: Left Arrow) */}
                  <button
                    type="button"
                    onClick={() => {
                      goNext();
                      showMobilePagination();
                    }}
                    disabled={currentPage >= (maxPage || 1)}
                    className={`flex items-center justify-center p-1.5 md:p-2 rounded-xl transition-all font-bold shadow-xs disabled:opacity-30 disabled:pointer-events-none group cursor-pointer shrink-0 ${
                      readerTheme === 'dark'
                        ? 'bg-white/5 hover:bg-white/10 text-white'
                        : readerTheme === 'sepia'
                          ? 'bg-[#F0E5D4] hover:bg-[#8B5226] text-[#4A3523] hover:text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                    title="الصفحة التالية"
                  >
                    <ChevronLeft className="h-4 w-4 md:h-5 md:w-5 group-hover:-translate-x-0.5 transition-transform" />
                  </button>

                  {/* Audio Reader Toggle Icon Button - Paged mode */}
                  {readingMode === 'paged' && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAudioBarOpen(prev => !prev);
                        showMobilePagination();
                      }}
                      className={`flex items-center justify-center p-1.5 md:p-2 rounded-xl transition-all font-bold shadow-xs cursor-pointer shrink-0 ${
                        isAudioBarOpen || isReadingPage
                          ? accentColor === 'amber'
                            ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40'
                            : accentColor === 'emerald'
                              ? 'bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/40'
                              : accentColor === 'blue'
                                ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/40'
                                : 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/40'
                          : readerTheme === 'dark'
                            ? 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                            : readerTheme === 'sepia'
                              ? 'bg-[#F0E5D4] hover:bg-[#8B5226] text-[#4A3523] hover:text-white'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title={isAudioBarOpen ? "إغلاق فريم الصوت" : "قراءة الصفحة صوتياً"}
                      aria-label="قراءة الصفحة صوتياً"
                    >
                      <Volume2 className="h-4 w-4 md:h-4.5 md:w-4.5" />
                    </button>
                  )}

                  {/* Page Actions 3-dots Menu (نسخ ومشاركة وقراءة الصفحة) - Paged mode */}
                  {readingMode === 'paged' && (
                    <div className="relative shrink-0 flex" ref={pageActionsRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPageActionsOpen(!isPageActionsOpen);
                        showMobilePagination();
                      }}
                      className={`flex items-center justify-center p-1.5 md:p-2 rounded-xl transition-all font-bold shadow-xs cursor-pointer ${
                        isPageActionsOpen
                          ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40'
                          : readerTheme === 'dark'
                            ? 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                            : readerTheme === 'sepia'
                              ? 'bg-[#F0E5D4] hover:bg-[#8B5226] text-[#4A3523] hover:text-white'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title="خيارات ومشاركة الصفحة"
                      aria-label="خيارات ومشاركة الصفحة"
                    >
                      <MoreVertical className="h-4 w-4 md:h-4.5 md:w-4.5" />
                    </button>

                    {isPageActionsOpen && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className={`absolute bottom-full left-0 mb-2 w-52 rounded-2xl border p-1.5 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 ${
                          readerTheme === 'dark'
                            ? 'bg-[#0f1422]/98 border-white/10 text-white shadow-black/80'
                            : readerTheme === 'sepia'
                              ? 'bg-[#FAF5ED]/98 border-[#E2D6C0] text-[#3D2C1D]'
                              : 'bg-white/98 border-gray-200 text-slate-900 shadow-xl'
                        }`}
                      >
                        {/* Audio Reader Menu Item */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsAudioBarOpen(true);
                            setIsPageActionsOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-xs font-bold text-right transition-colors cursor-pointer"
                        >
                          <Volume2 className={`w-4 h-4 shrink-0 ${
                            accentColor === 'amber'
                              ? 'text-amber-500'
                              : accentColor === 'emerald'
                                ? 'text-teal-600 dark:text-teal-400'
                                : accentColor === 'blue'
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : 'text-purple-600 dark:text-purple-400'
                          }`} />
                          <span className="truncate">قراءة الصفحة صوتياً</span>
                        </button>

                        {/* إضافة / إزالة من العلامات المرجعية */}
                        <button
                          type="button"
                          onClick={() => {
                            toggleBookmark();
                            setIsPageActionsOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-xs font-bold text-right transition-colors cursor-pointer"
                        >
                          <Bookmark className={`w-4 h-4 text-amber-500 shrink-0 ${bookmarks.includes(currentPage) ? 'fill-amber-500' : ''}`} />
                          <span className="truncate">
                            {bookmarks.includes(currentPage) ? 'إزالة من العلامات المرجعية' : 'إضافة إلى العلامات المرجعية'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            handleCopyPage();
                            setIsPageActionsOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-xs font-bold text-right transition-colors cursor-pointer"
                        >
                          <Copy className="w-4 h-4 text-purple-500 shrink-0" />
                          <span className="truncate">{pageCopied ? 'تم النسخ بنجاح!' : 'نسخ نص الصفحة'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            setIsPageActionsOpen(false);
                            const shareText = formatPageCopyText(
                              pageText?.matn || pageText?.main || '',
                              pageText?.sharh,
                              pageText?.footnote,
                              book.title,
                              book.author,
                              currentPage
                            );
                            if (navigator.share) {
                              try {
                                await navigator.share({
                                  title: `${book.title} - صـ ${currentPage}`,
                                  text: shareText.slice(0, 300) + '...',
                                  url: window.location.href,
                                });
                              } catch {
                                // canceled
                              }
                            } else {
                              navigator.clipboard.writeText(`${window.location.href}\n\n${book.title} - صـ ${currentPage}\n${shareText.slice(0, 300)}...`);
                              alert('تم نسخ رابط وبيانات الصفحة لمشاركتها!');
                            }
                          }}
                          className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-xs font-bold text-right transition-colors cursor-pointer"
                        >
                          <Share2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="truncate">مشاركة الصفحة</span>
                        </button>
                      </div>
                    )}
                  </div>
                  )}
                </div>
              </footer>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Docked at the bottom of the screen with core tabs) */}
      {!distractionFree && (
        <nav
          className={`md:hidden shrink-0 w-full border-t z-50 backdrop-blur-2xl transition-colors duration-300 ${
            readerTheme === 'dark'
              ? 'bg-[#0a0d14]/98 border-white/10 shadow-[0_-8px_25px_rgba(0,0,0,0.7)] text-white'
              : readerTheme === 'sepia'
                ? 'bg-[#FAF5ED]/98 border-[#E2D6C0] shadow-[0_-6px_20px_rgba(80,50,20,0.08)] text-[#3D2C1D]'
                : 'bg-white/98 border-gray-200/90 shadow-[0_-6px_20px_rgba(0,0,0,0.06)] text-slate-800'
          }`}
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 4px)' }}
          aria-label="شريط التبويبات السفلي"
        >
          <div className="flex items-stretch justify-around h-14 sm:h-16 w-full max-w-lg mx-auto px-0">
            {/* Tab 1: الفهرس (أول تاب على اليمين) */}
            <button
              type="button"
              onClick={() => setSidebarTab(sidebarTab === 'toc' ? 'none' : 'toc')}
              className={getBottomNavTabClass(sidebarTab === 'toc')}
              title="فهرس موضوعات الكتاب"
            >
              <Menu className={`h-5 w-5 sm:h-5.5 sm:w-5.5 transition-transform ${sidebarTab === 'toc' ? 'scale-110' : ''}`} strokeWidth={2.2} />
              <span className="text-[11px] sm:text-xs font-bold tracking-tight whitespace-nowrap">الفهرس</span>
            </button>

            {/* Tab 2: نص الباب (ثاني تاب) */}
            <button
              type="button"
              onClick={() => setSidebarTab('none')}
              className={getBottomNavTabClass(sidebarTab === 'none')}
              title="متن وقراءة الكتاب"
            >
              <BookOpen className={`h-5 w-5 sm:h-5.5 sm:w-5.5 transition-transform ${sidebarTab === 'none' ? 'scale-110' : ''}`} strokeWidth={2.2} />
              <span className="text-[11px] sm:text-xs font-bold tracking-tight whitespace-nowrap">نص الباب</span>
            </button>

            {/* Tab 3: مساعد زاد (في المنتصف) */}
            <button
              type="button"
              onClick={() => setSidebarTab(sidebarTab === 'chat' ? 'none' : 'chat')}
              className={getBottomNavTabClass(sidebarTab === 'chat')}
              title="مساعد زاد الذكي"
            >
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 transition-transform duration-200 ${
                  sidebarTab === 'chat' ? 'scale-110' : ''
                }`}
                style={{
                  backgroundColor: getBottomNavZadLogoColor(sidebarTab === 'chat'),
                  WebkitMaskImage: `url(${whiteLogo})`,
                  maskImage: `url(${whiteLogo})`,
                  WebkitMaskSize: 'contain',
                  maskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  maskPosition: 'center',
                  filter: sidebarTab === 'chat'
                    ? accentColor === 'amber'
                      ? 'drop-shadow(0 0 6px rgba(223, 191, 131, 0.7))'
                      : accentColor === 'emerald'
                        ? 'drop-shadow(0 0 6px rgba(45, 212, 191, 0.7))'
                        : accentColor === 'blue'
                          ? 'drop-shadow(0 0 6px rgba(96, 165, 250, 0.7))'
                          : 'drop-shadow(0 0 6px rgba(192, 132, 252, 0.7))'
                    : undefined
                }}
                aria-hidden="true"
              />
              <span className="text-[11px] sm:text-xs font-bold tracking-tight whitespace-nowrap">مساعد زاد</span>
            </button>

            {/* Tab (اختياري عند التوفر): الأحاديث أو الآيات */}
            {hadithsCount > 0 && (
              <button
                type="button"
                onClick={() => setSidebarTab(sidebarTab === 'hadiths' ? 'none' : 'hadiths')}
                className={getBottomNavTabClass(sidebarTab === 'hadiths')}
                title={numberedItemsLabel.full}
              >
                <div className="relative">
                  <Hash className={`h-5 w-5 sm:h-5.5 sm:w-5.5 transition-transform ${sidebarTab === 'hadiths' ? 'scale-110' : ''}`} strokeWidth={2.2} />
                  <span className={`absolute -top-1 -right-2 px-1 min-w-[14px] h-[14px] rounded-full text-slate-950 text-[9px] font-black flex items-center justify-center ${getBottomNavIndicatorClass()}`}>
                    {hadithsCount > 99 ? '99+' : hadithsCount}
                  </span>
                </div>
                <span className="text-[11px] sm:text-xs font-bold tracking-tight whitespace-nowrap">{numberedItemsLabel.short}</span>
              </button>
            )}

            {/* Tab 4: البحث (بعد المساعد) */}
            <button
              type="button"
              onClick={() => setSidebarTab(sidebarTab === 'search' ? 'none' : 'search')}
              className={getBottomNavTabClass(sidebarTab === 'search')}
              title="بحث في نصوص الكتاب"
            >
              <Search className={`h-5 w-5 sm:h-5.5 sm:w-5.5 transition-transform ${sidebarTab === 'search' ? 'scale-110' : ''}`} strokeWidth={2.2} />
              <span className="text-[11px] sm:text-xs font-bold tracking-tight whitespace-nowrap">البحث</span>
            </button>

            {/* Tab 5: التظليلات (في الآخر على اليسار) */}
            <button
              type="button"
              onClick={() => setSidebarTab(sidebarTab === 'highlights' ? 'none' : 'highlights')}
              className={getBottomNavTabClass(sidebarTab === 'highlights')}
              title="التظليلات والنصوص الملونة"
            >
              <div className="relative">
                <Highlighter className={`h-5 w-5 sm:h-5.5 sm:w-5.5 transition-transform ${sidebarTab === 'highlights' ? 'scale-110' : ''}`} strokeWidth={2.2} />
                {highlights.length > 0 && (
                  <span className={`absolute -top-1 -right-2 min-w-[14px] h-[14px] px-0.5 text-slate-950 font-black text-[9px] rounded-full flex items-center justify-center shadow-xs ${getBottomNavIndicatorClass()}`}>
                    {highlights.length > 99 ? '99+' : highlights.length}
                  </span>
                )}
              </div>
              <span className="text-[11px] sm:text-xs font-bold tracking-tight whitespace-nowrap">التظليلات</span>
            </button>
          </div>
        </nav>
      )}

      {/* Feature 5: Multi-Volume PDF Selector Modal / Bottom Sheet */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showPdfModal && (() => {
            // Compute modal styling dynamically based on readerTheme (light, dark, sepia) and accentColor (amber, emerald, blue, purple)
            let containerBg = 'bg-[#0f1422]/98 border-white/10 text-white shadow-2xl';
            let cardBg = 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06] text-white';
            let closeBtn = 'hover:bg-white/10 text-white/70 hover:text-white';

            if (readerTheme === 'light') {
              containerBg = 'bg-white/98 border-slate-200 text-slate-900 shadow-2xl';
              cardBg = 'bg-slate-50/80 border-slate-200/90 hover:border-slate-300 hover:bg-white text-slate-900';
              closeBtn = 'hover:bg-black/5 text-slate-500 hover:text-slate-900';
            } else if (readerTheme === 'sepia') {
              containerBg = 'bg-[#FAF5ED]/98 border-[#E2D6C0] text-[#3D2C1D] shadow-2xl';
              cardBg = 'bg-[#F4ECE1]/70 border-[#E5DAC6] hover:border-[#D5C6AC] hover:bg-[#FAF5ED] text-[#3D2C1D]';
              closeBtn = 'hover:bg-black/5 text-[#7D6B58] hover:text-[#3D2C1D]';
            }

            let primaryBtn = 'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-sm shadow-purple-600/20';
            let activeBorder = 'border-purple-500/50 bg-purple-500/5 ring-1 ring-purple-500/25';
            let activeBadge = 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30';
            let headerBadge = 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20';
            let iconBox = 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-300';

            switch (accentColor) {
              case 'amber':
                primaryBtn = 'bg-gradient-to-r from-[#8e682d] to-[#c59b58] hover:from-[#7a5825] hover:to-[#b38944] text-white shadow-sm shadow-[#8e682d]/25';
                activeBorder = 'border-[#c59b58]/50 bg-[#8e682d]/5 ring-1 ring-[#c59b58]/30';
                activeBadge = 'bg-[#8e682d]/15 text-[#8e682d] dark:text-[#eedbb2] border border-[#c59b58]/30';
                headerBadge = 'bg-[#8e682d]/10 text-[#8e682d] dark:text-[#dfbf83] border border-[#8e682d]/20';
                iconBox = 'bg-[#8e682d]/10 border-[#8e682d]/20 text-[#8e682d] dark:text-[#dfbf83]';
                break;
              case 'emerald':
                primaryBtn = 'bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-600 text-white shadow-sm shadow-teal-600/25';
                activeBorder = 'border-teal-500/50 bg-teal-500/5 ring-1 ring-teal-500/30';
                activeBadge = 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30';
                headerBadge = 'bg-teal-500/10 text-teal-600 dark:text-teal-300 border border-teal-500/20';
                iconBox = 'bg-teal-500/10 border-teal-500/20 text-teal-600 dark:text-teal-300';
                break;
              case 'blue':
                primaryBtn = 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm shadow-blue-600/25';
                activeBorder = 'border-blue-500/50 bg-blue-500/5 ring-1 ring-blue-500/30';
                activeBadge = 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30';
                headerBadge = 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20';
                iconBox = 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-300';
                break;
              case 'purple':
              default:
                break;
            }

            return (
              <div dir="rtl" className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4">
                {/* Backdrop */}
                <motion.div
                  key="pdf-modal-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setShowPdfModal(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
                />

                {/* Modal Card with subtle, modern rounded corners (not overly rounded) */}
                <motion.div
                  key="pdf-modal-card"
                  initial={{ y: '100%', opacity: 0.5, scale: 0.98 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: '100%', opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  onClick={(e) => e.stopPropagation()}
                  className={`relative w-full max-w-xl mx-auto max-h-[88vh] flex flex-col rounded-t-2xl sm:rounded-2xl border shadow-2xl overflow-hidden z-10 ${containerBg}`}
                >
                  {/* Drag handle for mobile */}
                  <div className="w-10 h-1 rounded-full bg-black/15 dark:bg-white/20 mx-auto mt-2 mb-1 sm:hidden" />

                  {/* Header */}
                  <div className="shrink-0 px-5 sm:px-6 pt-2 pb-3.5 border-b border-inherit/15 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBox}`}>
                        <FileDown className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-base sm:text-lg text-foreground truncate">
                          تحميل أجزاء الكتاب (PDF)
                        </h3>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-md">
                          {book.title} • {authorName || book.author}
                        </p>
                      </div>
                    </div>

                    {/* Badges & Close Button */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-sans ${headerBadge}`}>
                        {toEasternArabicNumerals(volumePdfList.length)} ملفات
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPdfModal(false)}
                        className={`p-1.5 sm:p-2 rounded-xl transition-colors cursor-pointer ${closeBtn}`}
                        title="إغلاق النافذة"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Body: Current Volume banner + List of Volumes */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 custom-scrollbar">
                    {/* Current Reading Volume Highlight if identified */}
                    {(() => {
                      const curVolNum = parseInt(currentVolumeInfo?.vol || currentPrintCitation?.vol || '', 10);
                      const currentVolItem = (!isNaN(curVolNum) && curVolNum > 0)
                        ? volumePdfList.find(it => !it.isCover && it.volNum === curVolNum)
                        : null;
                      if (!currentVolItem) return null;
                      return (
                        <div className={`p-3.5 sm:p-4 rounded-xl border flex flex-col gap-2.5 shadow-xs mb-1 ${activeBorder}`}>
                          {/* Top Row: Title on right, English filename on left */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <Sparkles className="w-4 h-4 shrink-0 opacity-80" />
                              <span className="text-xs opacity-75 shrink-0">
                                أنت تقرأ حالياً:
                              </span>
                              <span className="text-xs sm:text-sm font-black text-foreground shrink-0">
                                {currentVolItem.vol}
                              </span>
                            </div>
                            <span className="text-[11px] opacity-60 font-mono shrink-0" dir="ltr">
                              {currentVolItem.fileName}
                            </span>
                          </div>

                          {/* Bottom Row: Page range on right, Download button on left */}
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              {currentVolItem.pageRange ? (
                                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold font-sans ${activeBadge}`}>
                                  {currentVolItem.pageRange}
                                </span>
                              ) : <span />}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDirectFileDownload(currentVolItem.url, currentVolItem.fileName)}
                              disabled={downloadingFile === currentVolItem.fileName}
                              className={`px-4 py-1.5 rounded-xl ${primaryBtn} active:scale-95 text-xs font-bold transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50`}
                            >
                              {downloadingFile === currentVolItem.fileName ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>جاري التحميل...</span>
                                </>
                              ) : (
                                <>
                                  <Download className="w-4 h-4" />
                                  <span>تحميل هذا المجلد</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="flex items-center justify-between px-1 pt-1">
                      <span className="text-xs font-bold text-foreground/80">
                        قائمة المجلدات والملفات المتاحة:
                      </span>
                      <span className="text-[11px] text-muted-foreground font-sans">
                        مرتبة وفق الطبعة
                      </span>
                    </div>

                    {volumePdfList.map((item, idx) => {
                      const curVolNum = parseInt(currentVolumeInfo?.vol || currentPrintCitation?.vol || '', 10);
                      const isCurrent = !isNaN(curVolNum) && curVolNum > 0 && !item.isCover && item.volNum === curVolNum;

                      return (
                        <div
                          key={item.url || idx}
                          className={`p-3 sm:p-3.5 rounded-xl border transition-all duration-200 flex flex-col gap-2.5 ${
                            isCurrent
                              ? activeBorder
                              : cardBg
                          }`}
                        >
                          {/* Top Row: Volume title on the right, English filename on the left */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-bold text-xs sm:text-sm text-foreground shrink-0">
                                {item.vol}
                              </span>
                              {isCurrent && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeBadge} shrink-0`}>
                                  المجلد الحالي
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] opacity-60 font-mono shrink-0" dir="ltr">
                              {item.fileName}
                            </span>
                          </div>

                          {/* Bottom Row: Page range on the right, Action buttons on the left */}
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              {item.pageRange ? (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-muted-foreground font-semibold font-sans border border-inherit/15 inline-block">
                                  {item.pageRange}
                                </span>
                              ) : <span />}
                            </div>

                            {/* Left: Action buttons */}
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
                                className="px-3 py-1.5 rounded-xl border border-inherit/25 hover:bg-black/5 dark:hover:bg-white/10 text-xs font-semibold text-foreground transition-colors flex items-center gap-1.5 cursor-pointer"
                                title="فتح للمطالعة في نافذة جديدة"
                              >
                                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                                <span>قراءة</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDirectFileDownload(item.url, item.fileName)}
                                disabled={downloadingFile === item.fileName}
                                className={`px-3.5 py-1.5 rounded-xl ${primaryBtn} active:scale-95 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50`}
                                title="تحميل الملف مباشرة إلى جهازك"
                              >
                                {downloadingFile === item.fileName ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span className="text-[11px]">جاري التحميل...</span>
                                  </>
                                ) : (
                                  <>
                                    <Download className="w-3.5 h-3.5" />
                                    <span>تحميل</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </div>
            );
          })()}
        </AnimatePresence>,
        document.body
      )}

    </div>
  )
}
