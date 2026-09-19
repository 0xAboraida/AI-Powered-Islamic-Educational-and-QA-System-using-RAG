import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, FileText, BookText, Folder, Menu, Loader2, Search, ChevronDown, Settings2, Maximize, Minimize, Sun, Moon, Type, Sparkles, X, Send, Bookmark, Copy, Volume2, VolumeX, BookmarkCheck, AlignJustify, MoreVertical } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { Bubble, TypingBubble } from '../chat/components/ChatBubble'
import type { Message } from '../chat/data'
import { speakText, stopAllSpeech } from '@/services/geminiTtsService'
import bgDark from '@/assets/images/image.webp'
import bgLight from '@/assets/images/bg-islamic-light.webp'
import whiteLogo from '@/assets/images/WhiteLogo.png'
import zadDarkLogo from '@/assets/images/ZadDarkLogo.png'
import { PanelResizer } from '../study/components/PanelResizer'
import { AudioReaderButton } from '@/components/common/AudioReaderButton'
import { AuthorBiographyModal } from '@/components/common/AuthorBiographyModal'

type BookMeta = {
  id: number
  title: string
  author: string
  domain?: string
  madhhab?: string
  century?: string
}

type Heading = {
  id: number
  title: string
  level: number
  page: number
}

interface TreeNode extends Heading {
  children: TreeNode[];
  originalIndex: number;
}

const buildTree = (headings: Heading[]): TreeNode[] => {
  const root: TreeNode[] = [];
  const stack: TreeNode[] = [];

  headings.forEach((h, i) => {
    const node: TreeNode = { ...h, originalIndex: i, children: [] };
    while (stack.length > 0 && stack[stack.length - 1].level >= node.level) {
      stack.pop();
    }
    if (stack.length === 0) root.push(node);
    else stack[stack.length - 1].children.push(node);
    stack.push(node);
  });
  return root;
}

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
  readerTheme = 'light'
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
  readerTheme?: 'light' | 'dark' | 'sepia'
}) => {
  const isExpanded = expandedNodes.has(node.originalIndex);

  // Highlighting Logic: Exact match with selectedTocIndex or activeTocIndex
  const isExactActive = (selectedTocIndex !== null && selectedTocIndex !== undefined && node.originalIndex === selectedTocIndex && node.page === currentPage) ||
    (activeTocIndex >= 0 && node.originalIndex === activeTocIndex);

  const isAncestorActive = activeAncestorIndices ? activeAncestorIndices.has(node.originalIndex) && !isExactActive : false;

  const hasChildren = node.children.length > 0;

  const getContainerStyles = () => {
    if (isExactActive) {
      if (readerTheme === 'dark') {
        return 'bg-gradient-to-r from-purple-600 via-brand-magenta to-purple-700 text-white font-extrabold border-purple-400/60 shadow-md shadow-purple-950/50 ring-1 ring-purple-400/40';
      } else {
        return 'bg-gradient-to-r from-purple-700 via-purple-600 to-brand-magenta text-white font-extrabold border-purple-700 shadow-md shadow-purple-600/30 ring-1 ring-purple-600/40';
      }
    }
    if (isAncestorActive) {
      if (readerTheme === 'dark') {
        return 'bg-purple-950/70 text-purple-200 font-bold border-purple-600/60 shadow-xs';
      } else {
        return 'bg-purple-100 text-purple-950 font-bold border-purple-300 shadow-xs';
      }
    }
    if (readerTheme === 'dark') {
      return 'text-slate-200 hover:text-white hover:bg-white/10 border-transparent hover:border-white/20';
    } else {
      return 'text-slate-800 hover:bg-purple-50 hover:text-purple-950 border-transparent hover:border-purple-200/50';
    }
  };

  const getIconStyles = () => {
    if (isExactActive) return 'text-white';
    if (isAncestorActive) return readerTheme === 'dark' ? 'text-purple-300' : 'text-purple-700';
    return 'text-brand-magenta/70';
  };

  const getBadgeStyles = () => {
    if (isExactActive) return 'bg-white/20 text-white font-bold backdrop-blur-xs';
    if (isAncestorActive) {
      return readerTheme === 'dark'
        ? 'bg-purple-900/80 text-purple-200 font-bold'
        : 'bg-purple-200 text-purple-900 font-bold';
    }
    return readerTheme === 'dark'
      ? 'bg-white/10 text-white/70'
      : 'bg-slate-200/80 text-slate-700';
  };

  return (
    <div className="flex flex-col">
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
              <div className={`max-w-md px-3.5 py-2.5 rounded-xl border text-sm font-bold shadow-2xl backdrop-blur-xl ${readerTheme === 'dark' ? 'bg-[#0d071a]/95 border-purple-500/50 text-purple-100 shadow-purple-950/80' : readerTheme === 'sepia' ? 'bg-[#F4ECD8]/95 border-[#D4C4A8] text-[#5c3f22] shadow-amber-950/30' : 'bg-white/95 border-purple-300 text-purple-950 shadow-xl'}`}>
                {node.title}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mr-2 shrink-0">
          {hasChildren && (
            <button
              onClick={(e) => { e.stopPropagation(); toggleExpand(node.originalIndex); }}
              className={`p-1 rounded-md transition-all opacity-80 hover:opacity-100 hover:scale-110 ${isExpanded ? 'rotate-0' : 'rotate-90'} ${isExactActive ? 'bg-white/20 text-white' : isAncestorActive ? 'bg-purple-900/40 text-purple-200' : 'hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400'}`}
            >
              <ChevronDown className="h-3.5 w-3.5 transition-transform duration-300" strokeWidth={2.2} />
            </button>
          )}
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors ${getBadgeStyles()}`}>
            صـ {node.page}
          </span>
        </div>
      </div>

      {hasChildren && (
        <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0 overflow-hidden'}`}>
          <div className={`overflow-hidden pr-2.5 border-r-2 mr-1 space-y-1 transition-colors ${isAncestorActive || isExactActive ? 'border-purple-600' : 'border-border/30'}`}>
            {node.children.map(child => (
              <TocNode
                key={child.originalIndex}
                node={child}
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

const replaceIslamicLigatures = (text: string) => {
  if (!text) return text;

  const unicodeMap: Record<string, string> = {
    '\ufdfa': 'صلى الله عليه وسلم',
    '\ufd40': 'رحمه الله',
    '\ufd41': 'رحمها الله',
    '\ufd42': 'رحمهم الله',
    '\ufd43': 'رضي الله عنه',
    '\ufd44': 'رضي الله عنها',
    '\ufd45': 'رضي الله عنهم',
    '\ufd46': 'رضي الله عنهن',
    '\ufd49': 'عليهما السلام',
    '\ufd4a': 'عليهم السلام',
    '\ufd4b': 'عليه السلام',
    '\ufd4c': 'رضي الله عنهما',
    '\ufd4d': 'عليهن السلام',
    '\ufdfb': 'جل جلاله',
    '\ufdfc': 'عز وجل',
    '\ufd4e': 'سبحانه وتعالى',
  };

  let newText = text;

  // Replace unicode characters first
  for (const [key, value] of Object.entries(unicodeMap)) {
    const styledValue = `<span data-type="honorific" class="islamic-honorific font-bold mx-0.5">- ${value} -</span>`;
    newText = newText.split(`-${key}-`).join(styledValue);
    newText = newText.split(key).join(styledValue);
  }

  // Common phrases
  const phrases = [
    'صلى الله عليه وسلم',
    'صلى الله عليه وآله وسلم',
    'رضي الله عنهما',
    'رضي الله عنهم',
    'رضي الله عنها',
    'رضي الله عنه',
    'رضي الله عنهن',
    'رحمه الله تعالى',
    'رحمهم الله تعالى',
    'رحمه الله',
    'رحمها الله',
    'رحمهم الله',
    'عليهما السلام',
    'عليهم السلام',
    'عليه السلام',
    'سبحانه وتعالى',
    'عز وجل',
    'جل جلاله'
  ];

  phrases.forEach(phrase => {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(?<!<[^>]*)${escaped}(?![^<]*>)`, 'g');

    newText = newText.replace(pattern, (match, offset, fullStr) => {
      const prev = fullStr.slice(Math.max(0, offset - 40), offset);
      if (prev.includes('data-type="honorific"') || prev.includes('islamic-honorific')) return match;
      return `<span data-type="honorific" class="islamic-honorific font-bold mx-0.5">- ${match} -</span>`;
    });
  });

  return newText;
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

    // Tag title elements with data-level="1" or data-level="2" dynamically if missing
    let processedText = text.replace(/<span\s+data-type="title"([^>]*)>([\s\S]*?)<\/span>/gi, (match, attrs, titleText) => {
      if (attrs.includes('data-level=')) {
        return match;
      }
      const cleanTitle = titleText.replace(/<[^>]+>/g, '').trim();
      const isLevel1 = /^(?:كتاب|كِتَابُ?|باب|بَابُ?)\s+/i.test(cleanTitle);
      const levelAttr = isLevel1 ? 'data-level="1"' : 'data-level="2"';
      return `<span data-type="title" ${levelAttr} ${attrs}>${titleText}</span>`;
    });

    const fnBadge = (_: string, num: string) =>
      `<span class="islamic-footnote-sup inline-flex items-center justify-center mx-1 align-baseline"><a href="#fn-${num}" data-type="footnote-ref" class="islamic-footnote-ref font-sans font-extrabold text-[12px] shadow-2xs no-underline transition-all hover:scale-110 border-b-0 cursor-pointer">${num}</a></span>`;

    return processedText
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
  fontSize
}: {
  footnoteText: string;
  readerTheme: 'light' | 'dark' | 'sepia';
  fontFamily: string;
  fontSize: number;
}) => {
  const items = useMemo(() => parseFootnoteItems(footnoteText), [footnoteText]);

  if (!footnoteText || !footnoteText.trim()) return null;

  const cardBg =
    readerTheme === 'dark'
      ? 'bg-purple-950/40 border-purple-500/30 hover:border-purple-400/50 text-purple-100 shadow-sm'
      : readerTheme === 'sepia'
        ? 'bg-[#F4ECD8]/80 border-[#D4C4A8] hover:border-[#B89F7D] text-[#4A3523] shadow-2xs'
        : 'bg-white/90 border-purple-200/80 hover:border-purple-300 text-slate-800 shadow-sm';

  const badgeStyle =
    readerTheme === 'dark'
      ? 'bg-gradient-to-r from-purple-600 to-brand-magenta text-white border-purple-400/40 shadow-xs'
      : readerTheme === 'sepia'
        ? 'bg-[#E5D7BF] text-[#5C3F22] border-[#C8B89E] font-bold'
        : 'bg-gradient-to-r from-purple-600 to-brand-magenta text-white border-purple-300 shadow-xs';

  return (
    <div className="mt-14 pt-2">
      {/* Footnote Section Header Divider */}
      <div className="relative my-8 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div
            className={`w-full border-t-2 border-dashed ${readerTheme === 'dark'
                ? 'border-purple-500/30'
                : readerTheme === 'sepia'
                  ? 'border-[#C8B89E]'
                  : 'border-purple-200/80'
              }`}
          />
        </div>
        <div
          className={`relative px-4 py-1 text-xs font-extrabold rounded-full border backdrop-blur-md transition-all ${readerTheme === 'dark'
              ? 'bg-[#181825] border-purple-500/40 text-purple-300 shadow-sm'
              : readerTheme === 'sepia'
                ? 'bg-[#F4ECD8] border-[#C8B89E] text-[#5C3F22] shadow-2xs'
                : 'bg-white border-purple-200 text-purple-800 shadow-xs'
            }`}
        >
          الحواشي والتعليقات
        </div>
      </div>

      {/* Footnote List */}
      {items.length > 0 ? (
        <div className="grid gap-3.5">
          {items.map((item, idx) => (
            <div
              key={idx}
              id={`fn-${item.num}`}
              className={`group flex items-start gap-3.5 p-4 rounded-2xl border transition-all duration-300 ${cardBg}`}
            >
              {/* Stylized Circular Number Badge */}
              <span className={`shrink-0 font-sans font-extrabold text-xs rounded-full border flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 transition-transform group-hover:scale-105 ${badgeStyle}`}>
                {item.num}
              </span>

              {/* Text */}
              <div
                className={`turath-content flex-1 leading-relaxed ${fontFamily}`}
                style={{ fontSize: `${Math.max(13, fontSize - 3)}px` }}
                dangerouslySetInnerHTML={{ __html: replaceIslamicLigatures(item.text) }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div
          className={`turath-content prose max-w-none leading-loose opacity-80 ${fontFamily}`}
          style={{ fontSize: `${Math.max(12, fontSize - 4)}px` }}
          dangerouslySetInnerHTML={{ __html: footnoteText }}
        />
      )}
    </div>
  );
};

export default function TurathReader({
  book,
  onClose,
  onAskBook,
  globalFontSize
}: {
  book: BookMeta
  onClose: () => void
  onAskBook: (b: BookMeta) => void
  globalFontSize?: 'small' | 'medium' | 'large'
}) {
  const { theme } = useTheme()
  const [loadingBook, setLoadingBook] = useState(true)
  const [toc, setToc] = useState<Heading[]>([])
  const [authorName, setAuthorName] = useState<string>(book.author === "بحث في الفهرس" ? "" : book.author)
  const [authorId, setAuthorId] = useState<number | null>(null)
  const [showAuthorModal, setShowAuthorModal] = useState(false)

  const [currentPage, setCurrentPage] = useState<number>(1)
  const [loadingPage, setLoadingPage] = useState(false)
  const [pageText, setPageText] = useState<{ main: string; matn?: string; sharh?: string; footnote: string } | null>(null)

  const [tocSearch, setTocSearch] = useState('')
  const [pageInput, setPageInput] = useState<string>('1')

  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set())

  // New features state
  const [fontSize, setFontSize] = useState<number>(20)
  const [fontFamily, setFontFamily] = useState<string>('font-read')

  useEffect(() => {
    if (globalFontSize) {
      if (globalFontSize === 'small') setFontSize(16);
      if (globalFontSize === 'medium') setFontSize(20);
      if (globalFontSize === 'large') setFontSize(26);
    }
  }, [globalFontSize]);
  const [readerTheme, setReaderTheme] = useState<'light' | 'dark' | 'sepia'>('light')
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

    const handleScrollSync = () => {
      if (isJumpingRef.current) return;

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
          setActiveHeadingText(currentHeading);
        }
      }
    };

    container.addEventListener('scroll', handleScrollSync, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScrollSync);
    };
  }, [readingMode]);

  const [showSettings, setShowSettings] = useState(false)
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [sidebarTab, setSidebarTab] = useState<'toc' | 'chat' | 'none'>('toc')

  const [chatHistory, setChatHistory] = useState<Message[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [sidebarWidth, setSidebarWidth] = useState(360)
  const [isResizing, setIsResizing] = useState(false)

  // Page Actions State
  const [bookmarks, setBookmarks] = useState<number[]>([])
  const [isReadingPage, setIsReadingPage] = useState(false)
  const [pageCopied, setPageCopied] = useState(false)

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
  const readerAreaRef = useRef<HTMLDivElement>(null)

  const toggleExpand = (idx: number) => {
    const newSet = new Set(expandedNodes);
    if (newSet.has(idx)) newSet.delete(idx);
    else newSet.add(idx);
    setExpandedNodes(newSet);
  }

  useEffect(() => {
    setPageInput(currentPage.toString())
  }, [currentPage])

  // Close settings when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [settingsRef]);

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

  const filteredToc = useMemo(() => toc.filter(h => h.title.includes(tocSearch)), [toc, tocSearch]);
  const tocTree = useMemo(() => buildTree(toc), [toc]);

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

  // Fetch book TOC
  useEffect(() => {
    const fetchBookInfo = async () => {
      try {
        const baseUrl = import.meta.env.VITE_DATA_INGESTION_URL || 'https://abourida-zad-tutor-engine-space.hf.space';
        const res = await fetch(`${baseUrl}/api/v1/data-ingestion/zad-book-info/${book.id}`)
        if (res.ok) {
          const data = await res.json()

          if (data.meta && data.meta.info) {
            const match = data.meta.info.match(/المؤلف:\s*([^\n]+)/);
            if (match && match[1]) {
              setAuthorName(match[1].trim());
            }
          }

          if (data.meta && data.meta.author_id) {
            setAuthorId(data.meta.author_id);
          }

          if (data.indexes && data.indexes.headings) {
            setToc(data.indexes.headings)

            // By default keep TOC collapsed
            setExpandedNodes(new Set<number>())
          }
          if (data.indexes?.headings?.length > 0) {
            setCurrentPage(prev => (prev <= 1 ? data.indexes.headings[0].page : prev))
          }
        }
      } catch (err) {
        console.error("Failed to load book info", err)
      } finally {
        setLoadingBook(false)
      }
    }
    fetchBookInfo()
  }, [book.id])

  // Fetch page content
  useEffect(() => {
    const fetchPage = async () => {
      // 1. If we are user-scrolling continuously and page is in buffer, just update text state
      const cachedPage = continuousPages.find(p => p.page === currentPage);
      if (cachedPage && !isJumpingRef.current) {
        setPageText({
          main: cachedPage.text,
          matn: cachedPage.matn || cachedPage.text,
          sharh: cachedPage.sharh,
          footnote: cachedPage.footnote || ''
        });
        return;
      }

      // 2. If jumping or page not cached, fetch page and reset buffer starting at target page
      pageSessionRef.current += 1;
      const currentSession = pageSessionRef.current;
      setLoadingPage(true);
      setLoadingNext(false);
      setLoadNextError(false);
      try {
        const baseUrl = import.meta.env.VITE_DATA_INGESTION_URL || 'https://abourida-zad-tutor-engine-space.hf.space';
        const res = await fetch(`${baseUrl}/api/v1/data-ingestion/turath-page-preview/${book.id}/${currentPage}`);
        if (currentSession !== pageSessionRef.current) return;

        if (res.ok) {
          const data = await res.json();
          if (currentSession !== pageSessionRef.current) return;

          if (data.text) {
            const { main, matn, sharh, footnote } = processTextContent(data.text);
            setPageText({
              main,
              matn,
              sharh,
              footnote
            });
            setContinuousPages([{
              page: currentPage,
              text: main,
              matn,
              sharh,
              footnote
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
  }, [book.id, currentPage]);

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
    if (loadingNext || hasReachedEnd || !continuousPages.length) return
    const lastPage = continuousPages[continuousPages.length - 1].page
    const currentSession = pageSessionRef.current;

    setLoadingNext(true)
    setLoadNextError(false)
    try {
      // Progressive Batching: Fetch 2 pages sequentially so the UI updates instantly and we don't spam the API
      const BATCH_SIZE = 2;
      const pagesToFetch = Array.from({ length: BATCH_SIZE }, (_, i) => lastPage + i + 1);

      let reachedEnd = false;
      let loadedAtLeastOne = false;

      for (let i = 0; i < pagesToFetch.length; i++) {
        if (currentSession !== pageSessionRef.current) return;
        
        try {
          const baseUrl = import.meta.env.VITE_DATA_INGESTION_URL || 'https://abourida-zad-tutor-engine-space.hf.space';
          const res = await fetch(`${baseUrl}/api/v1/data-ingestion/turath-page-preview/${book.id}/${pagesToFetch[i]}`);
          if (!res.ok) {
            reachedEnd = true;
            break;
          }
          const data = await res.json();
          
          if (data && data.text) {
            const { main, matn, sharh, footnote } = processTextContent(data.text);
            const newPage = {
              page: pagesToFetch[i],
              text: main,
              matn,
              sharh,
              footnote: footnote || undefined
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
        } catch {
          break;
        }
      }

      if (reachedEnd) {
        setHasReachedEnd(true)
      } else if (!loadedAtLeastOne) {
        setLoadNextError(true)
      }
    } catch (err) {
      if (currentSession !== pageSessionRef.current) return;
      console.error("Error loading next page:", err)
      setLoadNextError(true)
    } finally {
      if (currentSession === pageSessionRef.current) {
        setLoadingNext(false)
      }
    }
  }

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
        try {
          const baseUrl = import.meta.env.VITE_DATA_INGESTION_URL || 'https://abourida-zad-tutor-engine-space.hf.space';
          const res = await fetch(`${baseUrl}/api/v1/data-ingestion/turath-page-preview/${book.id}/${pagesToFetch[i]}`);
          if (!res.ok) break;
          const data = await res.json();
          if (data && data.text) {
            const { main, matn, sharh, footnote } = processTextContent(data.text);
            // Prepend sequentially
            newPages.unshift({
              page: pagesToFetch[i],
              text: main,
              matn,
              sharh,
              footnote: footnote || undefined
            });
          }
        } catch {
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
      } else {
        // If we failed to get pages but we aren't at page 1, maybe an error occurred
        if (firstPage > 1) {
          console.error("Failed to load previous pages");
        }
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
    setCurrentPage(p => {
      if (readingMode === 'continuous' && continuousPages.length > 0) {
        return continuousPages[continuousPages.length - 1].page + 1;
      }
      return p + 1;
    });
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0 });
    }
  };

  const goPrev = () => {
    setSelectedTocIndex(null);
    setActiveHeadingText(null);
    setCurrentPage(p => {
      if (readingMode === 'continuous' && continuousPages.length > 0) {
        return Math.max(1, continuousPages[0].page - 1);
      }
      return Math.max(1, p - 1);
    });
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

  const maxPage = toc.length > 0 ? Math.max(...toc.map(h => h.page)) : currentPage;
  const progressPercent = Math.min(100, Math.max(0, (currentPage / (maxPage || 1)) * 100));

  // Smooth scrolling and highlighting when clicking footnote references in text
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleFootnoteClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-type="footnote-ref"]');
      if (target) {
        e.preventDefault();
        const href = target.getAttribute('href');
        if (href) {
          const targetEl = container.querySelector(href);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            targetEl.classList.add('ring-2', 'ring-purple-500', 'scale-[1.02]');
            setTimeout(() => {
              targetEl.classList.remove('ring-2', 'ring-purple-500', 'scale-[1.02]');
            }, 2500);
          }
        }
      }
    };

    container.addEventListener('click', handleFootnoteClick);
    return () => {
      container.removeEventListener('click', handleFootnoteClick);
    };
  }, [pageText, continuousPages]);

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
      className={`fixed inset-0 z-50 flex flex-col transition-colors duration-500 overflow-hidden ${readerTheme === 'dark' ? 'text-slate-100 selection:bg-brand-magenta/30' : 'bg-[#f8fafc] text-slate-900 selection:bg-brand-magenta/20'} ${readerTheme === 'sepia' ? 'sepia-reader' : ''} animate-in fade-in zoom-in-95 duration-300`}
      style={{
        backgroundImage: readerTheme === 'dark' ? `url(${bgDark})` : `url(${bgLight})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >

      {/* Top Navigation Bar (Study Mode Style) */}
      <header
        className={`shrink-0 min-h-[4rem] py-1.5 w-full flex items-center justify-between px-4 z-40 transition-transform duration-500 border-b ${distractionFree ? '-translate-y-full opacity-0 absolute' : 'translate-y-0 opacity-100'} ${readerTheme === 'dark' ? 'bg-[#0a0514]/80 backdrop-blur-md border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.5)]' : 'bg-white/80 backdrop-blur-md border-gray-200/80 text-slate-900'}`}
      >
        <div className="flex items-center gap-2 h-full flex-1 min-w-0">
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center shrink-0 rounded-xl bg-brand-magenta/10 text-brand-magenta hover:bg-brand-magenta hover:text-white transition-all shadow-sm group"
            title="العودة"
          >
            <ArrowRight className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          </button>

          <div className="h-8 w-px bg-border/50 mx-1 shrink-0" />

          {/* Tools Toggles */}
          <div className="flex items-center gap-1.5 h-full py-2 shrink-0">
            <button
              onClick={() => setSidebarTab(sidebarTab === 'toc' ? 'none' : 'toc')}
              className={`flex h-9 items-center justify-center gap-2 rounded-xl px-3.5 text-xs font-bold transition-all backdrop-blur-xl ${sidebarTab === 'toc'
                ? readerTheme === 'dark'
                  ? 'bg-[#a855f7]/25 border border-[#a855f7]/50 text-white shadow-lg shadow-[#a855f7]/25 font-extrabold scale-[1.02] ring-1 ring-[#a855f7]/30'
                  : 'bg-gradient-to-b from-white/90 via-purple-50/60 to-purple-100/70 backdrop-blur-xl border border-purple-300/80 text-purple-950 shadow-md shadow-purple-500/10 font-extrabold scale-[1.02]'
                : readerTheme === 'dark'
                  ? 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                  : 'bg-white/50 border border-slate-200/90 text-slate-600 hover:bg-white/80 hover:text-slate-900 hover:border-slate-300'
                }`}
            >
              <Menu size={16} className={`${sidebarTab === 'toc' ? 'text-purple-600 dark:text-purple-400' : 'text-purple-500/70 dark:text-purple-400/70'} shrink-0 stroke-[2.2]`} />
              <span>الفهرس</span>
            </button>
            <button
              onClick={() => setSidebarTab(sidebarTab === 'chat' ? 'none' : 'chat')}
              className={`flex h-9 items-center justify-center gap-2 rounded-xl px-3.5 text-xs font-bold transition-all backdrop-blur-xl ${sidebarTab === 'chat'
                ? readerTheme === 'dark'
                  ? 'bg-[#a855f7]/25 border border-[#a855f7]/50 text-white shadow-lg shadow-[#a855f7]/25 font-extrabold scale-[1.02] ring-1 ring-[#a855f7]/30'
                  : 'bg-gradient-to-b from-white/90 via-purple-50/60 to-purple-100/70 backdrop-blur-xl border border-purple-300/80 text-purple-950 shadow-md shadow-purple-500/10 font-extrabold scale-[1.02]'
                : readerTheme === 'dark'
                  ? 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                  : 'bg-white/50 border border-slate-200/90 text-slate-600 hover:bg-white/80 hover:text-slate-900 hover:border-slate-300'
                }`}
            >
              <img src={readerTheme === 'dark' ? whiteLogo : zadDarkLogo} alt="Zad" className={`h-[16px] object-contain transition-opacity ${sidebarTab === 'chat' ? 'opacity-100 drop-shadow-sm' : 'opacity-70 grayscale'}`} />
              <span>مساعد القراءة</span>
            </button>
          </div>

          <div className="h-8 w-px bg-border/50 mx-3 shrink-0" />

          {/* Book Title & Hierarchy */}
          <div className="flex items-center gap-3 min-w-0 pointer-events-none text-muted-foreground">
            <h1 className="font-display text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-magenta to-brand-blue shrink-0 drop-shadow-sm leading-normal">
              {book.title}
            </h1>

            <div className="flex flex-col gap-1 items-start justify-center min-w-0 border-r border-border/50 pr-3">
              {authorName && (
                <button
                  type="button"
                  onClick={() => setShowAuthorModal(true)}
                  className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold border backdrop-blur-md shadow-sm pointer-events-auto transition-all shrink-0 hover:scale-105 ${readerTheme === 'dark' ? 'bg-purple-950/40 border-purple-500/40 text-purple-200 hover:bg-purple-900/60' : 'bg-purple-50 border-purple-200 text-purple-900 hover:bg-purple-100'}`}
                  title="عرض سيرة وترجمة المؤلف الكاملة"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-magenta animate-pulse" />
                  <span>المؤلف: {authorName}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-brand-magenta/20 text-brand-magenta font-extrabold">[ترجمة]</span>
                </button>
              )}

              {activeHierarchy.length > 0 && (
                <div className="relative group/breadcrumb pointer-events-auto">
                  <span className={`flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] md:text-[11px] font-bold border backdrop-blur-md shadow-sm transition-all cursor-pointer ${readerTheme === 'dark' ? 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-purple-500/40' : 'bg-black/5 border-black/10 text-slate-800 hover:bg-purple-50 hover:border-purple-300'}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-blue animate-pulse shrink-0" />
                    <span className="flex items-center gap-1.5 min-w-0">
                      {/* Level 1 Chapter Title */}
                      <span className="font-extrabold shrink-0 text-brand-magenta">
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

        <div className="flex items-center gap-2 relative h-full py-2" ref={settingsRef}>
          {/* Bookmarks Dropdown Toggle */}
          <div className="relative">
            <button
              onClick={() => { setShowBookmarks(!showBookmarks); setShowSettings(false); }}
              className={`w-10 h-10 rounded-xl flex justify-center items-center transition-all duration-300 backdrop-blur-md border shadow-sm ${showBookmarks ? 'bg-brand-magenta/20 border-brand-magenta/40 text-brand-magenta shadow-[0_0_15px_rgba(149,11,196,0.3)] scale-105' : readerTheme === 'dark' ? 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-brand-magenta hover:shadow-md hover:scale-105' : 'bg-white/50 border-gray-200/60 text-slate-500 hover:bg-white/80 hover:text-brand-magenta hover:shadow-md hover:scale-105'}`}
              title="العلامات المرجعية"
            >
              <Bookmark className="h-5 w-5" />
            </button>

            {showBookmarks && (
              <div className={`absolute top-full left-0 mt-2 w-64 backdrop-blur-2xl border rounded-3xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 ${readerTheme === 'dark' ? 'bg-[#0d071a]/95 border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.7)]' : 'bg-white/95 border-gray-200 shadow-xl text-slate-900'}`}>
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
            className={`w-10 h-10 rounded-xl flex justify-center items-center transition-all duration-300 backdrop-blur-md border shadow-sm ${showSettings ? 'bg-brand-blue/20 border-brand-blue/40 text-brand-blue shadow-[0_0_15px_rgba(43,127,255,0.3)] scale-105' : readerTheme === 'dark' ? 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-brand-blue hover:shadow-md hover:scale-105' : 'bg-white/50 border-gray-200/60 text-slate-500 hover:bg-white/80 hover:text-brand-blue hover:shadow-md hover:scale-105'}`}
            title="إعدادات القراءة"
          >
            <Settings2 className="h-5 w-5" />
          </button>

          {/* Settings Dropdown (Pops out below) */}
          {showSettings && (
            <div className={`absolute top-full left-0 mt-2 w-[300px] backdrop-blur-2xl border rounded-3xl shadow-2xl p-5 z-50 animate-in fade-in slide-in-from-top-4 duration-300 origin-top-left ${readerTheme === 'dark' ? 'bg-[#0d071a]/95 border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.7)] text-white' : 'bg-white/95 border-gray-200 shadow-xl text-slate-800'}`}>

              {/* Reading Mode */}
              <div className="mb-6">
                <label className={`text-[11px] font-bold mb-3 block uppercase tracking-wider ${readerTheme === 'dark' ? 'text-white/50' : 'text-slate-400'}`}>نمط العرض</label>
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

              {/* Theme */}
              <div className="mb-6">
                <label className={`text-[11px] font-bold mb-3 block uppercase tracking-wider ${readerTheme === 'dark' ? 'text-white/50' : 'text-slate-400'}`}>مظهر القراءة</label>
                <div className="flex gap-2">
                  <button onClick={() => setReaderTheme('light')} className={`flex-1 py-2.5 rounded-2xl border transition-all duration-300 ${readerTheme === 'light' ? 'border-brand-blue bg-brand-blue/10 text-brand-blue shadow-sm scale-105' : readerTheme === 'dark' ? 'border-white/10 hover:bg-white/10 text-white/60 hover:text-white hover:border-white/20' : 'border-black/10 hover:bg-black/5 text-slate-600 hover:text-slate-900'} flex flex-col items-center justify-center gap-1.5`}>
                    <Sun className="h-5 w-5" />
                    <span className="text-[10px] font-bold">فاتح</span>
                  </button>
                  <button onClick={() => setReaderTheme('sepia')} className={`flex-1 py-2.5 rounded-2xl border transition-all duration-300 ${readerTheme === 'sepia' ? 'border-amber-700/60 bg-amber-700/10 text-amber-800 shadow-sm scale-105 font-bold' : readerTheme === 'dark' ? 'border-white/10 hover:bg-white/10 text-white/60 hover:text-white hover:border-white/20' : 'border-black/10 hover:bg-black/5 text-slate-600 hover:text-slate-900'} flex flex-col items-center justify-center gap-1.5`}>
                    <BookOpen className="h-5 w-5" />
                    <span className="text-[10px] font-bold">ورقي</span>
                  </button>
                  <button onClick={() => setReaderTheme('dark')} className={`flex-1 py-2.5 rounded-2xl border transition-all duration-300 ${readerTheme === 'dark' ? 'border-brand-blue bg-brand-blue/10 text-brand-blue shadow-sm scale-105' : 'border-black/10 hover:bg-black/5 text-slate-600 hover:text-slate-900'} flex flex-col items-center justify-center gap-1.5`}>
                    <Moon className="h-5 w-5" />
                    <span className="text-[10px] font-bold">داكن</span>
                  </button>
                </div>
              </div>

              {/* Dark Frame Opacity */}
              {readerTheme === 'dark' && (
                <div className="mb-6 animate-in fade-in zoom-in-95 duration-300">
                  <label className="text-[11px] font-bold text-white/50 mb-3 flex justify-between uppercase tracking-wider">
                    <span>شفافية الإطار (الداكن)</span>
                    <span className="text-brand-blue">{darkFrameOpacity}%</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={darkFrameOpacity}
                      onChange={(e) => setDarkFrameOpacity(Number(e.target.value))}
                      className="flex-1 accent-brand-blue h-2 bg-white/20 rounded-full appearance-none outline-none hover:bg-white/30 transition-colors"
                    />
                  </div>
                </div>
              )}

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
                <label className={`text-[11px] font-bold mb-2 block uppercase tracking-wider ${readerTheme === 'dark' ? 'text-white/50' : 'text-slate-400'}`}>خط القراءة التراثي</label>
                <div className="relative">
                  <select
                    value={fontFamily === 'font-read' ? 'font-amiri' : fontFamily === 'font-sans' ? 'font-cairo' : fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className={`w-full appearance-none px-4 py-2.5 pl-10 rounded-2xl text-sm font-semibold transition-all cursor-pointer outline-none border ${readerTheme === 'dark'
                      ? 'bg-white/10 text-white border-white/15 focus:border-brand-blue hover:bg-white/15'
                      : 'bg-slate-100 text-slate-800 border-slate-200 focus:border-brand-blue hover:bg-slate-200/70'
                      }`}
                  >
                    <option value="font-amiri" className="font-amiri text-slate-900 bg-white dark:bg-slate-900 dark:text-white py-1">خط الأميري (نسخ تراثي)</option>
                    <option value="font-scheherazade" className="font-scheherazade text-slate-900 bg-white dark:bg-slate-900 dark:text-white py-1">خط شهرزاد (مخطوطات)</option>
                    <option value="font-noto-naskh" className="font-noto-naskh text-slate-900 bg-white dark:bg-slate-900 dark:text-white py-1">خط نوتو نسخ (واضح)</option>
                    <option value="font-cairo" className="font-cairo text-slate-900 bg-white dark:bg-slate-900 dark:text-white py-1">خط القاهرة (حديث Cairo)</option>
                  </select>
                  <ChevronDown className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${readerTheme === 'dark' ? 'text-white/60' : 'text-slate-500'
                    }`} />
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Workspace Container */}
      <div className="flex-1 flex overflow-hidden w-full relative p-2 md:p-4 gap-4">


        {/* Sliding Panel Area (TOC / Chat) */}
        <aside
          className={`shrink-0 h-full relative rounded-3xl overflow-hidden ${isResizing ? '' : 'transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]'} z-30 ${distractionFree || sidebarTab === 'none' ? 'opacity-0 border-none' : 'opacity-100 border'
            } ${readerTheme === 'dark' ? 'border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]' : 'border-gray-200/80 bg-white/90 shadow-xl text-slate-900'} backdrop-blur-xl`}
          style={{
            width: distractionFree || sidebarTab === 'none' ? 0 : sidebarWidth,
            backgroundColor: readerTheme === 'dark' ? `rgba(13, 7, 26, ${darkFrameOpacity / 100})` : undefined
          }}
        >


          <div className="w-full h-full flex flex-col relative">
            {readerTheme === 'dark' && (
              <>
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-brand-magenta/15 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-brand-blue/15 rounded-full blur-[80px] pointer-events-none"></div>
              </>
            )}

            {/* Header of the sliding panel */}
            <div className={`flex items-center justify-between p-5 border-b ${readerTheme === 'dark' ? 'border-white/5 bg-white/[0.02] text-white' : 'border-gray-200/60 bg-white/50 text-slate-900'}`}>
              <h3 className="font-bold font-display text-lg flex items-center gap-2">
                {sidebarTab === 'toc' ? <><Menu className="h-5 w-5 text-brand-magenta" /> الفهرس</> : <><img src={readerTheme === 'dark' ? whiteLogo : zadDarkLogo} alt="Zad" className="h-5 w-5 object-contain" /> المساعد</>}
              </h3>
              <button
                onClick={() => setSidebarTab('none')}
                className="p-2 rounded-full backdrop-blur-md bg-black/5 border border-black/5 dark:bg-white/10 dark:border-white/10 hover:bg-brand-magenta hover:text-white hover:border-transparent transition-all text-muted-foreground shadow-sm"
              >
                <X className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex-1 overflow-hidden relative">
              {/* TOC Panel */}
              <div className={`absolute inset-0 flex flex-col transition-all duration-300 ${sidebarTab === 'toc' ? 'opacity-100 translate-x-0 z-10' : 'opacity-0 translate-x-4 pointer-events-none -z-10'}`}>
                <div className="p-4">
                  <div className="relative group">
                    <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-brand-magenta transition-colors" />
                    <input
                      type="text"
                      placeholder="ابحث في العناوين..."
                      value={tocSearch}
                      onChange={(e) => setTocSearch(e.target.value)}
                      className={`w-full rounded-2xl pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-magenta transition-all shadow-inner ${readerTheme === 'dark' ? 'bg-white/5 border border-white/10 text-white placeholder-white/40 focus:bg-white/10' : 'bg-slate-100 text-slate-900 placeholder-slate-400 border border-slate-200'}`}
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
                  {loadingBook ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
                      <Loader2 className="h-8 w-8 animate-spin text-brand-magenta" />
                      <p className="text-sm font-semibold">جاري تحميل الفهرس...</p>
                    </div>
                  ) : filteredToc.length === 0 ? (
                    <div className={`p-8 text-center text-sm rounded-2xl mt-4 ${readerTheme === 'dark' ? 'bg-white/5 text-white/60' : 'bg-black/5 text-black/60'}`}>لا توجد نتائج مطابقة للبحث</div>
                  ) : tocSearch ? (
                    <div className="space-y-1">
                      {filteredToc.map((heading, idx) => {
                        const isExactActive = (activeTocIndex >= 0 && toc[activeTocIndex]?.title === heading.title) ||
                          (heading.page === currentPage) ||
                          (activeHeadingText ? (activeHeadingText.includes(heading.title.trim()) || heading.title.trim().includes(activeHeadingText)) : false);
                        return (
                          <button
                            key={idx}
                            data-toc-active={isExactActive ? "true" : undefined}
                            onClick={() => {
                              const fullIndex = toc.findIndex(h => h.title === heading.title && h.page === heading.page);
                              handlePageJump(heading.page, heading.title, fullIndex >= 0 ? fullIndex : undefined);
                            }}
                            className={`w-full flex items-center justify-between py-3 px-3 text-sm rounded-xl transition-all duration-300 group cursor-pointer border ${isExactActive
                              ? 'bg-brand-magenta/15 text-brand-magenta font-bold border-brand-magenta/30 shadow-sm ring-1 ring-brand-magenta/30'
                              : readerTheme === 'dark'
                                ? 'text-slate-200 hover:text-white hover:bg-white/10 border-transparent'
                                : 'text-slate-800 hover:bg-purple-50/70 hover:text-purple-950 border-transparent'
                              }`}
                          >
                            <span className="truncate text-right max-w-[80%] leading-relaxed group-hover:text-brand-magenta transition-colors">{heading.title}</span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors ${isExactActive ? 'bg-brand-magenta/20 text-brand-magenta' : readerTheme === 'dark' ? 'bg-white/10 text-white/70' : 'bg-slate-200/80 text-slate-700'}`}>
                              صـ {heading.page}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {tocTree.map(node => (
                        <TocNode
                          key={node.originalIndex}
                          node={node}
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
                  )}
                </div>
              </div>

              {/* Chat Panel */}
              <div className={`absolute inset-0 flex flex-col transition-all duration-300 ${sidebarTab === 'chat' ? 'opacity-100 translate-x-0 z-10' : 'opacity-0 -translate-x-4 pointer-events-none -z-10'}`}>
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar relative">
                  {chatHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-70">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${readerTheme === 'dark' ? 'bg-gradient-to-br from-brand-magenta/20 to-brand-blue/20 border border-brand-magenta/30 shadow-[0_0_20px_rgba(168,85,247,0.25)]' : 'bg-white border border-primary/20 shadow-[0_0_12px_rgba(168,85,247,0.2)]'}`}>
                        <img src={readerTheme === 'dark' ? whiteLogo : zadDarkLogo} alt="Zad" className="h-8 w-8 object-contain drop-shadow-md" />
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

                <div className={`p-4 border-t ${readerTheme === 'dark' ? 'border-white/10 bg-[#1A2235]' : 'border-gray-200/60 bg-white'}`}>
                  <form onSubmit={handleSendChatMessage} className="flex flex-col w-full gap-2 relative">
                    <div className="gradient-border min-w-0 flex-1 rounded-[22px] p-[2px] shadow-lg shadow-primary/20 transition-all duration-300">
                      <div className={`flex items-end gap-2 rounded-[20px] py-1.5 pr-4 pl-2 transition-all duration-300 ${readerTheme === 'dark' ? 'bg-[#1A2235]' : 'bg-white'}`}>
                        <textarea
                          rows={1}
                          className={`font-sans min-w-0 flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:opacity-50 [&::-webkit-scrollbar]:hidden`}
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
                          className="brand-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-lg shadow-primary/30 transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                        >
                          <Send className="h-4 w-4 rtl:-scale-x-100" />
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Resize Handle BETWEEN aside and main */}
        {(sidebarTab !== 'none' && !distractionFree) && (
          <div className="flex items-center justify-center shrink-0 z-40 relative">
            <PanelResizer onMouseDown={startResizing} isDark={readerTheme === 'dark'} label="اسحب لتغيير العرض" />
          </div>
        )}

        {/* Main Reading Area */}
        <main
          className={`flex-1 relative h-full flex flex-col overflow-hidden rounded-3xl border backdrop-blur-xl ${readerTheme === 'dark' ? 'border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]' : readerTheme === 'sepia' ? 'border-[#E2D6C0] bg-[#FAF5ED] shadow-[0_8px_30px_rgba(120,90,50,0.08)]' : 'border-gray-200/80 bg-white/70 shadow-lg'}`}
          style={{
            backgroundColor: readerTheme === 'dark' ? `rgba(13, 7, 26, ${darkFrameOpacity / 100})` : undefined
          }}
        >

          {/* Page Actions Floating Toolbar */}
          {readingMode === 'paged' && (
            <div className={`absolute top-6 left-6 z-40 flex flex-col items-center rounded-xl transition-all duration-300 group/toolbar overflow-hidden hover:border hover:backdrop-blur-md hover:shadow-lg hover:bg-white/70 hover:border-gray-200/80 dark:hover:bg-[#0d071a]/95 dark:hover:border-white/10 sepia:hover:bg-[#EAE0C8]/95 sepia:hover:border-[#D4C4A8]`}>

              {/* Compact Trigger Icon */}
              <div className={`p-2 cursor-pointer text-brand-magenta flex group-hover/toolbar:hidden transition-colors ${isReadingPage ? 'opacity-100 animate-pulse' : 'opacity-80 hover:opacity-100'}`}>
                <MoreVertical className="h-7 w-7 drop-shadow-md" />
              </div>

              {/* Expanded Actions */}
              <div className="hidden group-hover/toolbar:flex flex-col items-center gap-1.5 px-1 py-2 w-full animate-in fade-in zoom-in-95 duration-200">
                <button onClick={toggleBookmark} className={`p-2 rounded-xl transition-all ${bookmarks.includes(currentPage) ? 'bg-brand-magenta/15 text-brand-magenta shadow-sm' : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-brand-magenta'}`} title={bookmarks.includes(currentPage) ? "إزالة العلامة" : "حفظ كعلامة مرجعية"}>
                  {bookmarks.includes(currentPage) ? <BookmarkCheck className="h-5 w-5 fill-brand-magenta/20" /> : <Bookmark className="h-5 w-5" />}
                </button>
                <div className="w-4 h-px bg-border/50 my-0.5 shrink-0" />
                <button onClick={handleCopyPage} className={`p-2 rounded-xl transition-all ${pageCopied ? 'text-emerald-500 bg-emerald-500/10' : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-brand-magenta'}`} title="نسخ محتوى الصفحة">
                  <Copy className="h-5 w-5" />
                </button>
                <div className="w-4 h-px bg-border/50 my-0.5 shrink-0" />

                <button onClick={() => { setDistractionFree(!distractionFree); setShowSettings(false); setShowBookmarks(false); }} className="p-2 rounded-xl transition-all text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-brand-magenta" title={distractionFree ? "إنهاء وضع ملء الشاشة" : "وضع ملء الشاشة"}>
                  {distractionFree ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                </button>

                <div className="w-4 h-px bg-border/50 my-0.5 shrink-0" />
                <AudioReaderButton
                  text={pageText?.main || ''}
                  dark={readerTheme === 'dark' || readerTheme === 'sepia'}
                  showTextLabel={false}
                  hidePodcast={true}
                  onStateChange={(playing) => setIsReadingPage(playing)}
                  orientation="vertical"
                  colorTheme="purple"
                  menuPlacement="left"
                  className="!bg-transparent !border-transparent !shadow-none !p-2 !rounded-xl !text-muted-foreground hover:!bg-black/5 dark:hover:!bg-white/5 hover:!text-brand-magenta [&_svg]:!h-5 [&_svg]:!w-5"
                />
              </div>
            </div>
          )}



          {/* Reading Progress Line */}
          {!distractionFree && (
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-black/5 dark:bg-white/5 z-20">
              <div className="h-full brand-gradient transition-all duration-300" style={{ width: `${progressPercent}%` }} />
            </div>
          )}

          <div ref={scrollContainerRef} onScroll={handleScroll} className={`flex-1 overflow-y-auto ${readingMode === 'continuous' ? 'px-4 md:px-8 lg:px-12' : 'px-6 md:px-12 lg:px-24'} pb-32 pt-8 custom-scrollbar relative flex justify-center transition-all duration-500`}>
            <div className={`w-full ${readingMode === 'continuous' ? 'max-w-7xl' : 'max-w-4xl'} min-h-full transition-all duration-500`}>
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
                  /* Primary Main Chapter Headings (Level 1: "كتاب الصلاة", "باب المواقيت") */
                  .turath-content h1,
                  .turath-content h2,
                  .turath-content .main-title,
                  .turath-content span[data-type="title"][data-level="1"],
                  .turath-content span[data-type="title"].main-title {
                    display: block !important;
                    text-align: center !important;
                    font-family: var(--font-sans, 'Cairo', sans-serif);
                    font-weight: 800;
                    font-size: 1.45em !important;
                    line-height: 1.5;
                    margin: 2rem auto 0.75rem !important;
                    position: relative;
                    width: fit-content;
                    max-width: 90%;
                    padding: 0 1rem 0.6rem;
                    background: transparent !important;
                    border-radius: 0 !important;
                    border-bottom: 2px solid rgba(149, 11, 196, 0.4);
                  }

                  /* Secondary Sub-Titles & Mas'alahs (Level 2+: "فصل", "والثلثان فرض أربعة") */
                  .turath-content span[data-type="title"]:not([data-level="1"]),
                  .turath-content span[data-type="title"][data-level="2"],
                  .turath-content span[data-type="title"][data-level="3"],
                  .turath-content h3,
                  .turath-content h4 {
                    display: block !important;
                    text-align: right !important;
                    font-family: var(--font-sans, 'Cairo', sans-serif);
                    font-weight: 800 !important;
                    font-size: 1.15em !important;
                    line-height: 1.6;
                    margin: 1.25rem 0 0.4rem 0 !important;
                    position: relative;
                    width: 100% !important;
                    max-width: 100% !important;
                    padding: 0 !important;
                    background: transparent !important;
                    border-radius: 0 !important;
                    border: none !important;
                  }

                  .turath-content span[data-type="title"] + p {
                    margin-top: 0.25rem !important;
                  }

                  .turath-content span[data-type="title"]::before,
                  .turath-content span[data-type="title"]::after {
                    content: none;
                  }

                  /* Honorifics & Ligatures Base Styling */
                  .turath-content span[data-type="honorific"],
                  .turath-content .islamic-honorific {
                    display: inline !important;
                    font-weight: 700 !important;
                    margin: 0 0.15rem !important;
                    padding: 0 !important;
                    background: none !important;
                    border: none !important;
                  }

                  /* Light Reader Theme Colors */
                  .light-reader .turath-content,
                  .light-reader .turath-content p,
                  .light-reader .turath-content span:not([data-type="title"]):not([data-type="poetry"]):not([data-type="page"]):not([data-type="honorific"]):not(.islamic-honorific) {
                      color: #0f172a !important;
                  }
                  .light-reader .turath-content h1,
                  .light-reader .turath-content h2,
                  .light-reader .turath-content .main-title {
                      color: #950bc4 !important;
                      -webkit-text-fill-color: #950bc4 !important;
                      background: none !important;
                      border-bottom-color: rgba(149, 11, 196, 0.4) !important;
                  }
                  .light-reader .turath-content span[data-type="title"],
                  .light-reader .turath-content h3,
                  .light-reader .turath-content h4 {
                      color: #950bc4 !important;
                      -webkit-text-fill-color: #950bc4 !important;
                      background: none !important;
                      font-weight: 800 !important;
                  }
                  .light-reader .turath-content span[data-type="honorific"],
                  .light-reader .turath-content .islamic-honorific {
                      color: #950bc4 !important;
                  }

                  /* Sepia Reader Theme Colors */
                  .sepia-reader .turath-content,
                  .sepia-reader .turath-content p,
                  .sepia-reader .turath-content span:not([data-type="title"]):not([data-type="poetry"]):not([data-type="page"]):not([data-type="honorific"]):not(.islamic-honorific) {
                      color: #3b2a1a !important;
                  }
                  .sepia-reader .turath-content h1,
                  .sepia-reader .turath-content h2,
                  .sepia-reader .turath-content .main-title {
                      color: #950bc4 !important;
                      -webkit-text-fill-color: #950bc4 !important;
                      background: none !important;
                      border-bottom-color: rgba(149, 11, 196, 0.4) !important;
                  }
                  .sepia-reader .turath-content span[data-type="title"],
                  .sepia-reader .turath-content h3,
                  .sepia-reader .turath-content h4 {
                      color: #950bc4 !important;
                      -webkit-text-fill-color: #950bc4 !important;
                      background: none !important;
                      font-weight: 800 !important;
                  }
                  .sepia-reader .turath-content span[data-type="honorific"],
                  .sepia-reader .turath-content .islamic-honorific {
                      color: #b45309 !important;
                  }

                  /* Dark Reader Theme Colors */
                  .dark-reader .turath-content,
                  .dark-reader .turath-content p,
                  .dark-reader .turath-content span:not([data-type="title"]):not([data-type="poetry"]):not([data-type="page"]):not([data-type="honorific"]):not(.islamic-honorific) {
                      color: #ffffff !important;
                  }
                  .dark-reader .turath-content h1,
                  .dark-reader .turath-content h2,
                  .dark-reader .turath-content .main-title {
                      color: #950bc4 !important;
                      -webkit-text-fill-color: #950bc4 !important;
                      background: transparent !important;
                      border-bottom-color: rgba(149, 11, 196, 0.4) !important;
                      filter: none !important;
                      text-shadow: none !important;
                      font-weight: 800 !important;
                  }
                  .dark-reader .turath-content span[data-type="title"],
                  .dark-reader .turath-content h3,
                  .dark-reader .turath-content h4 {
                      color: #950bc4 !important;
                      -webkit-text-fill-color: #950bc4 !important;
                      background: transparent !important;
                      filter: none !important;
                      text-shadow: none !important;
                      font-weight: 800 !important;
                  }
                  .dark-reader .turath-content span[data-type="honorific"],
                  .dark-reader .turath-content .islamic-honorific {
                      color: #950bc4 !important;
                  }
                  .turath-content span[data-type="poetry"] {
                    display: block;
                    text-align: center;
                    color: var(--color-primary);
                    font-style: italic;
                    margin: 1.5rem 0;
                    font-size: 1.1em;
                  }
                  .turath-content span[data-type="page"] {
                    display: inline-flex;
                    align-items: center;
                    font-size: 0.72em;
                    font-family: var(--font-sans, 'Cairo', sans-serif);
                    font-weight: 700;
                    color: #950bc4;
                    background: rgba(149, 11, 196, 0.1);
                    border: 1px solid rgba(149, 11, 196, 0.25);
                    padding: 0.1rem 0.55rem;
                    border-radius: 6px;
                    margin: 1rem 0 0.5rem;
                    user-select: none;
                    line-height: 1.3;
                    direction: rtl;
                  }
                  .dark-reader .turath-content span[data-type="page"] {
                    color: #c084fc !important;
                    background: rgba(168, 85, 247, 0.15) !important;
                    border-color: rgba(168, 85, 247, 0.3) !important;
                  }
                  .turath-content {
                      white-space: pre-wrap;
                      word-wrap: break-word;
                      text-align: justify;
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
                    padding: 0 6px !important;
                    border-radius: 9999px !important;
                  }
                  .light-reader .turath-content .islamic-footnote-ref {
                    background: rgba(149, 11, 196, 0.08) !important;
                    border: 1px solid rgba(149, 11, 196, 0.25) !important;
                    color: #7e22ce !important;
                    box-shadow: 0 2px 6px rgba(149, 11, 196, 0.08) !important;
                  }
                  .light-reader .turath-content .islamic-footnote-ref:hover {
                    background: rgba(149, 11, 196, 0.18) !important;
                    border-color: rgba(149, 11, 196, 0.45) !important;
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
                    background: rgba(168, 85, 247, 0.18) !important;
                    border: 1px solid rgba(168, 85, 247, 0.35) !important;
                    color: #e9d5ff !important;
                    box-shadow: 0 2px 8px rgba(168, 85, 247, 0.15) !important;
                  }
                  .dark-reader .turath-content .islamic-footnote-ref:hover {
                    background: rgba(168, 85, 247, 0.32) !important;
                    border-color: rgba(168, 85, 247, 0.6) !important;
                    transform: scale(1.1) !important;
                  }
                `}</style>
                  <div className={`${readerTheme === 'dark' ? 'dark-reader' : readerTheme === 'sepia' ? 'sepia-reader' : 'light-reader'}`}>
                    {readingMode === 'paged' ? (
                      <>
                        {/* Matn Section */}
                        <div
                          data-page={currentPage}
                          className={`turath-content prose prose-lg max-w-none leading-[2.4] selection:bg-brand-magenta/30 selection:text-brand-deep dark:selection:text-white ${fontFamily} prose-headings:m-0 prose-headings:leading-tight prose-p:my-1`}
                          style={{ fontSize: `${fontSize}px` }}
                          dangerouslySetInnerHTML={{ __html: pageText?.matn || pageText?.main || '' }}
                        />

                        {/* Sharh Section with Divider */}
                        {pageText?.sharh && (
                          <div className="mt-6">
                            <RenderSharhDivider readerTheme={readerTheme} />
                            <div
                              className={`turath-content prose prose-lg max-w-none leading-[2.4] selection:bg-brand-magenta/30 selection:text-brand-deep dark:selection:text-white ${fontFamily} prose-headings:m-0 prose-headings:leading-tight prose-p:my-1`}
                              style={{ fontSize: `${fontSize}px` }}
                              dangerouslySetInnerHTML={{ __html: pageText.sharh }}
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

                        {continuousPages.map((p, idx) => (
                          <div key={p.page} data-page={p.page} className={`relative p-6 md:p-10 pl-16 rounded-[2rem] border ${readerTheme === 'dark' ? 'border-white/10 bg-[#181825]/40' : readerTheme === 'sepia' ? 'border-[#E2D6C0] bg-[#FFFDF9]' : 'border-gray-200 bg-white/40'} shadow-sm transition-all duration-300 hover:shadow-md group`}>
                            <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rounded-full px-6 py-1.5 text-sm font-bold shadow-sm border backdrop-blur-md ${readerTheme === 'dark' ? 'bg-[#0d071a] border-white/10 text-white/70' : readerTheme === 'sepia' ? 'bg-[#FAF5ED] border-[#E2D6C0] text-[#7A401A]' : 'bg-white border-gray-200 text-gray-500'}`}>
                              صفحة {p.page}
                            </div>

                            {/* Inner Page Actions Toolbar */}
                            <div className={`absolute top-4 md:top-5 left-3 md:left-5 z-10 flex flex-col items-center rounded-xl transition-all duration-300 group/toolbar overflow-hidden hover:border hover:backdrop-blur-md hover:shadow-sm hover:bg-white/70 hover:border-gray-200/80 dark:hover:bg-[#0d071a]/95 dark:hover:border-white/10 sepia:hover:bg-[#FAF5ED]/95 sepia:hover:border-[#E2D6C0]`}>

                              {/* Compact Trigger Icon */}
                              <div className="p-2 cursor-pointer text-brand-magenta flex group-hover/toolbar:hidden transition-colors hover:scale-110">
                                <MoreVertical className="h-6 w-6 opacity-90 drop-shadow-md" />
                              </div>

                              {/* Expanded Actions */}
                              <div className="hidden group-hover/toolbar:flex flex-col items-center gap-1.5 px-1 py-2 w-full animate-in fade-in zoom-in-95 duration-200">
                                <button
                                  onClick={() => {
                                    setBookmarks(prev => prev.includes(p.page) ? prev.filter(b => b !== p.page) : [...prev, p.page])
                                  }}
                                  className={`p-1.5 rounded-lg transition-all ${bookmarks.includes(p.page) ? 'bg-brand-magenta/15 text-brand-magenta shadow-sm' : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-brand-magenta'}`}
                                  title={bookmarks.includes(p.page) ? "إزالة العلامة" : "حفظ كعلامة مرجعية"}
                                >
                                  {bookmarks.includes(p.page) ? <BookmarkCheck className="h-4 w-4 fill-brand-magenta/20" /> : <Bookmark className="h-4 w-4" />}
                                </button>
                                <div className="w-3 h-px bg-border/50 my-0.5 shrink-0" />
                                <button
                                  onClick={() => {
                                    const textToCopy = formatPageCopyText(
                                      p.matn || p.text,
                                      p.sharh,
                                      p.footnote,
                                      book.title,
                                      book.author,
                                      p.page
                                    );
                                    navigator.clipboard.writeText(textToCopy);
                                  }}
                                  className={`p-1.5 rounded-lg transition-all text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-brand-magenta`}
                                  title="نسخ محتوى الصفحة"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                                <div className="w-3 h-px bg-border/50 my-0.5 shrink-0" />
                                <button
                                  onClick={() => { setDistractionFree(!distractionFree); setShowSettings(false); setShowBookmarks(false); }}
                                  className={`p-1.5 rounded-lg transition-all text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-brand-magenta`}
                                  title={distractionFree ? "إنهاء وضع ملء الشاشة" : "وضع ملء الشاشة"}
                                >
                                  {distractionFree ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                                </button>
                                <div className="w-3 h-px bg-border/50 my-0.5 shrink-0" />
                                <AudioReaderButton
                                  text={p.matn ? `${p.matn} ${p.sharh || ''}` : p.text}
                                  dark={readerTheme === 'dark'}
                                  showTextLabel={false}
                                  hidePodcast={true}
                                  onStateChange={(playing) => setIsReadingPage(playing)}
                                  orientation="vertical"
                                  colorTheme="purple"
                                  menuPlacement="left"
                                  className="!bg-transparent !border-transparent !shadow-none !p-1.5 !rounded-lg !text-muted-foreground hover:!bg-black/5 dark:hover:!bg-white/5 hover:!text-brand-magenta"
                                />
                              </div>
                            </div>

                            {/* Matn Section */}
                            <div
                              className={`turath-content prose prose-lg max-w-none leading-[2.4] selection:bg-brand-magenta/30 selection:text-brand-deep dark:selection:text-white ${fontFamily} prose-headings:m-0 prose-headings:leading-tight prose-p:my-1`}
                              style={{ fontSize: `${fontSize}px` }}
                              dangerouslySetInnerHTML={{ __html: p.matn || p.text }}
                            />

                            {/* Sharh Section with Divider */}
                            {p.sharh && (
                              <div className="mt-6">
                                <RenderSharhDivider readerTheme={readerTheme} />
                                <div
                                  className={`turath-content prose prose-lg max-w-none leading-[2.4] selection:bg-brand-magenta/30 selection:text-brand-deep dark:selection:text-white ${fontFamily} prose-headings:m-0 prose-headings:leading-tight prose-p:my-1`}
                                  style={{ fontSize: `${fontSize}px` }}
                                  dangerouslySetInnerHTML={{ __html: p.sharh }}
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
                              />
                            )}
                          </div>
                        ))}

                        {/* Status for next page */}
                        <div className="flex flex-col items-center justify-center p-8 gap-4 min-h-[150px]">
                          {loadingNext ? (
                            <div className="flex flex-col items-center gap-3 opacity-60">
                              <Loader2 className="h-8 w-8 animate-spin text-brand-magenta" />
                              <span className="text-sm font-semibold">جاري سحب الصفحة التالية...</span>
                            </div>
                          ) : loadNextError ? (
                            <div className="flex flex-col items-center gap-4 text-center">
                              <span className="text-sm text-red-500 font-semibold bg-red-500/10 px-6 py-3 rounded-xl border border-red-500/20">حدث خطأ في تحميل الصفحة التالية. يرجى التحقق من اتصالك بالإنترنت.</span>
                              <button onClick={loadNextPage} className="px-6 py-2 bg-brand-magenta text-white rounded-xl font-bold shadow-md hover:bg-brand-magenta/90 transition-all hover:scale-105 active:scale-95">
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

          {/* Floating Pagination Footer */}
          {readingMode === 'paged' && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 transition-all duration-500 opacity-100 translate-y-0 hover:scale-105">
              <footer className={`flex items-center gap-2 px-3 py-2 rounded-2xl border backdrop-blur-xl shadow-2xl ${readerTheme === 'dark' ? 'bg-[#121826]/90 border-white/10 shadow-black/50 text-white' : readerTheme === 'sepia' ? 'bg-[#FAF5ED]/95 border-[#E2D6C0] shadow-[0_10px_30px_rgba(80,50,20,0.1)] text-[#3D2C1D]' : 'bg-white/95 border-gray-200/90 shadow-xl text-slate-900'}`}>
                <button
                  onClick={goPrev}
                  disabled={currentPage <= 1}
                  className={`flex items-center justify-center p-2 rounded-xl transition-all duration-300 font-bold shadow-sm disabled:opacity-40 disabled:pointer-events-none group ${readerTheme === 'dark' ? 'bg-white/5 hover:bg-brand-magenta hover:text-white' : readerTheme === 'sepia' ? 'bg-[#F0E5D4] hover:bg-[#8B5226] hover:text-white text-[#4A3523]' : 'bg-slate-100 hover:bg-brand-magenta hover:text-white text-slate-700'}`}
                >
                  <ChevronRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <div className={`flex items-center gap-2 text-sm font-bold px-4 ${readerTheme === 'dark' ? 'text-slate-200' : readerTheme === 'sepia' ? 'text-[#3D2C1D]' : 'text-slate-800'}`}>
                  <form onSubmit={handlePageSubmit} className="flex items-center">
                    <input
                      type="number"
                      value={pageInput}
                      onChange={(e) => setPageInput(e.target.value)}
                      onBlur={handlePageSubmit}
                      className={`w-14 text-center rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-brand-magenta transition-colors font-sans ${readerTheme === 'dark' ? 'bg-black/20 text-white' : readerTheme === 'sepia' ? 'bg-[#F0E5D4] text-[#3D2C1D] border border-[#E0D2BD]' : 'bg-slate-100 text-slate-900 border border-slate-200'}`}
                      min="1"
                    />
                  </form>
                  <span>/</span>
                  <span>{maxPage}</span>
                </div>

                <button
                  onClick={goNext}
                  disabled={currentPage >= (maxPage || 1)}
                  className={`flex items-center justify-center p-2 rounded-xl transition-all duration-300 font-bold shadow-sm disabled:opacity-40 disabled:pointer-events-none group ${readerTheme === 'dark' ? 'bg-white/5 hover:bg-brand-magenta hover:text-white' : readerTheme === 'sepia' ? 'bg-[#F0E5D4] hover:bg-[#8B5226] hover:text-white text-[#4A3523]' : 'bg-slate-100 hover:bg-brand-magenta hover:text-white text-slate-700'}`}
                >
                  <ChevronLeft className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" />
                </button>
              </footer>
            </div>
          )}
        </main>
      </div>

      <AuthorBiographyModal
        isOpen={showAuthorModal}
        onClose={() => setShowAuthorModal(false)}
        bookId={book.id}
        authorId={authorId || undefined}
        authorName={authorName || book.author}
        bookTitle={book.title}
        onAskZadAboutAuthor={(name) => {
          setShowAuthorModal(false);
          onAskBook({
            ...book,
            author: name
          });
        }}
      />
    </div>
  )
}
