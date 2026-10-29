import { BookMeta } from '../types/bookTypes';

export type Heading = {
  id: number;
  title: string;
  level: number;
  page: number;
};

export interface TreeNode extends Heading {
  children: TreeNode[];
  originalIndex: number;
}

export const buildTree = (headings: Heading[]): TreeNode[] => {
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
};

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

export function replaceIslamicLigatures(text: string): string {
  if (!text) return '';
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
}

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

  // 8. Parentheses (...) and Brackets [...]
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

export interface ProcessedContent {
  main: string;
  matn: string;
  sharh?: string;
  footnote: string;
}

export const processTextContent = (rawText: string): ProcessedContent => {
  if (!rawText) return { main: '', matn: '', footnote: '' };

  let matnPart = '';
  let sharhPart = '';
  let footnotePart = '';

  const footnoteRegex = /<span\s+data-type="footnote"[^>]*>([\s\S]*?)<\/span>/i;
  const footnoteMatch = rawText.match(footnoteRegex);

  let textWithoutFootnotes = rawText;
  if (footnoteMatch) {
    footnotePart = footnoteMatch[1].trim();
    textWithoutFootnotes = rawText.replace(footnoteRegex, '').trim();
  } else {
    const dividerPatterns = [
      /\n\s*(?:_{3,}|-{3,}|—{3,}|={3,})\s*\n/g,
      /\n\s*\[\s*الحاشية\s*\]\s*\n/gi,
      /\n\s*\[\s*الهامش\s*\]\s*\n/gi,
      /\n\s*الحواشي\s*:\s*\n/gi
    ];

    let splitIndex = -1;
    for (const pattern of dividerPatterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(rawText);
      if (match && match.index > rawText.length * 0.15) {
        splitIndex = match.index;
        break;
      }
    }

    if (splitIndex !== -1) {
      textWithoutFootnotes = rawText.slice(0, splitIndex).trim();
      footnotePart = rawText.slice(splitIndex).replace(/^[\s\S]*?\n/, '').trim();
    }
  }

  const sharhDividerRegex = /<span\s+data-type="sharh-divider"[^>]*>[\s\S]*?<\/span>|\n\s*[-–—=]{4,}\s*الشرح\s*[-–—=]{4,}\s*\n/i;
  const sharhMatch = textWithoutFootnotes.match(sharhDividerRegex);

  if (sharhMatch && sharhMatch.index !== undefined) {
    matnPart = textWithoutFootnotes.slice(0, sharhMatch.index).trim();
    sharhPart = textWithoutFootnotes.slice(sharhMatch.index + sharhMatch[0].length).trim();
  } else {
    matnPart = textWithoutFootnotes;
  }

  const formatMainText = (textToFormat: string): string => {
    if (!textToFormat) return '';
    let processedText = replaceIslamicLigatures(textToFormat);

    processedText = processedText.replace(/<span\s+([^>]*?)data-type="title"([^>]*?)>([\s\S]*?)<\/span>/gi, (match, before, after, titleText) => {
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

      const attrs = `${before} ${after}`.trim();
      let finalAttrs = attrs;
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
      `<span class="islamic-footnote-sup inline-flex items-center justify-center mx-1 align-baseline"><a href="#fn-${num}" data-type="footnote-ref" class="islamic-footnote-ref font-sans font-extrabold text-[12px] shadow-2xs no-underline transition-all hover:scale-110 border-b-0 cursor-pointer">${num}</a></span>`;

    let rawFormatted = safeProcessedText
      .replace(/\s*[-–—]?\s*\(\^\s*([\d\u0660-\u0669]+)\)\s*[-–—]?/g, fnBadge)
      .replace(/\s*[-–—]?\s*\^\(([\d\u0660-\u0669]+)\)\s*[-–—]?/g, fnBadge)
      .replace(/\s*[-–—]?\s*\^([\d\u0660-\u0669]+)\s*[-–—]?/g, fnBadge)
      .replace(/\s*\(([\d\u0660-\u0669]+)\^\)\s*/g, fnBadge)
      .replace(/\s*[-–—]+\s*\(([\d\u0660-\u0669]+)\)\s*[-–—]+/g, fnBadge)
      .replace(/\s*\(([\d\u0660-\u0669]{1,2})\)\s*/g, fnBadge)
      .replace(/\s*\[([\d\u0660-\u0669]{1,2})\]\s*/g, fnBadge)
      .replace(/(?<=[\p{L}])([\d\u0660-\u0669]{1,2})(?=[.,،:;"'«»)\s]|$)/gu, fnBadge)
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

export const parseFootnoteItems = (rawFootnoteText: string): FootnoteItem[] => {
  if (!rawFootnoteText || !rawFootnoteText.trim()) return [];

  const normalizedText = rawFootnoteText
    .replace(/(<span\s+data-type="footnote-ref"[^>]*>.*?<\/span>)/gi, '\n$1')
    .replace(/(<a\s+[^>]*href="#fn-[^"]*"[^>]*>.*?<\/a>)/gi, '\n$1')
    .replace(/(?:^|\n|\s+)\((\d{1,2}|[\u0660-\u0669]{1,2})\)/g, '\n($1)')
    .replace(/(?:^|\n|\s+)\[(\d{1,2}|[\u0660-\u0669]{1,2})\]/g, '\n[$1]')
    .replace(/(?:^|\n|\s+)(\d{1,2}|[\u0660-\u0669]{1,2})[\s\-–—:=]/g, '\n$1 - ');

  const lines = normalizedText.split('\n');
  const items: FootnoteItem[] = [];
  let currentItem: FootnoteItem | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const htmlMatch = trimmed.match(/^(?:<span[^>]*>)?<a[^>]*href="#fn-([^"]+)"[^>]*>.*?<\/a>(?:<\/span>)?[:\s\-–—]?(.*)$/i);
    const textMatch = trimmed.match(/^[\(\[]?(\d{1,2}|[\u0660-\u0669]{1,2})[\)\]]?[\s\-–—:=]+(.*)$/);

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

export const formatPageCopyText = (
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
    fullText += `\n\n--- [ الشرح والبيان ] ---\n${sharhClean}`;
  }

  if (footnoteFormatted) {
    fullText += `\n\n--- [ الحواشي والتعليقات ] ---\n${footnoteFormatted}`;
  }

  if (bookTitle) {
    fullText += `\n\n[${bookTitle}${author ? ' - ' + author : ''}${pageNum ? ' - صـ ' + pageNum : ''}]`;
  }

  return fullText;
};
