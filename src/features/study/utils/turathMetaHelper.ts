import type { TreeNode, ChunkMetadata } from '../../../contexts/StudyContext'

/**
 * Convert Arabic/Indic digits (٠-٩) to standard ASCII digits (0-9)
 */
export function normalizeDigits(str: string): string {
  if (!str) return ''
  const indicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
  return str.replace(/[٠-٩]/g, (d) => {
    const idx = indicDigits.indexOf(d)
    return idx !== -1 ? String(idx) : d
  })
}

/**
 * Calculate the Hijri Century string from death year (e.g. 620 -> 'القرن 7 الهجري')
 */
export function calculateHijriCentury(yearNum: number): string {
  if (!yearNum || isNaN(yearNum) || yearNum <= 0) return ''
  const century = Math.ceil(yearNum / 100)
  return `القرن ${century} الهجري`
}

/**
 * Parse Turath's rich `meta.info` field to extract author, death year, total parts, and madhhab
 */
export function parseTurathInfoField(info?: string): {
  author?: string
  authorDeath?: string
  deathYear?: number
  totalParts?: number
  madhhabHint?: string
} {
  if (!info) return {}

  const result: {
    author?: string
    authorDeath?: string
    deathYear?: number
    totalParts?: number
    madhhabHint?: string
  } = {}

  // 1. Author line extraction
  const authorMatch = info.match(/المؤلف:\s*([^\n\r]+)/)
  if (authorMatch) {
    let authorRaw = authorMatch[1].trim()
    // Extract death year if inside parentheses in the author line
    // Cases: (ت ١٢٢٥ هـ), (ت. ٦٢٠ هـ), (ت ٦٢٠هـ), (٥٤١ - ٦٢٠ هـ)
    const deathParenMatch = authorRaw.match(/\((?:ت\.?\s*)?([٠-٩0-9]+)\s*[-–]?\s*([٠-٩0-9]+)?\s*هـ?\)/)
    if (deathParenMatch) {
      const yrStr = deathParenMatch[2] || deathParenMatch[1]
      const normalizedYr = parseInt(normalizeDigits(yrStr), 10)
      if (!isNaN(normalizedYr) && normalizedYr > 0 && normalizedYr < 1500) {
        result.deathYear = normalizedYr
        result.authorDeath = `${normalizedYr}هـ`
      }
    }

    // Clean author name from bracketed death date for cleaner badge display
    const cleanAuthor = authorRaw
      .replace(/\s*\([^)]*هـ[^)]*\)\s*/g, '')
      .replace(/\s*\[[^\]]*هـ[^\]]*\]\s*/g, '')
      .trim()
    if (cleanAuthor) {
      result.author = cleanAuthor
    }
  }

  // 2. Fallback search for death year in the entire info text if not found yet
  if (!result.deathYear) {
    const generalDeathMatch = info.match(/(?:ت|توفي|وفاة|المتوفى)[\s:.]*([٠-٩0-9]+)\s*[-–]?\s*([٠-٩0-9]+)?\s*هـ/)
    if (generalDeathMatch) {
      const yrStr = generalDeathMatch[2] || generalDeathMatch[1]
      const normalizedYr = parseInt(normalizeDigits(yrStr), 10)
      if (!isNaN(normalizedYr) && normalizedYr > 0 && normalizedYr < 1500) {
        result.deathYear = normalizedYr
        result.authorDeath = `${normalizedYr}هـ`
      }
    }
  }

  // 3. Total parts extraction (e.g. عدد الأجزاء: ٢, عدد الأجزاء: 8)
  const partsMatch = info.match(/عدد الأجزاء:\s*([٠-٩0-9]+)/)
  if (partsMatch) {
    const num = parseInt(normalizeDigits(partsMatch[1]), 10)
    if (!isNaN(num) && num > 0) {
      result.totalParts = num
    }
  }

  // 4. Madhhab hints in info
  if (info.includes('حنبلي') || info.includes('الحنبلي') || info.includes('أحمد بن حنبل')) {
    result.madhhabHint = 'حنبلي'
  } else if (info.includes('شافعي') || info.includes('الشافعي')) {
    result.madhhabHint = 'شافعي'
  } else if (info.includes('مالكي') || info.includes('المالكي') || info.includes('مالك بن أنس')) {
    result.madhhabHint = 'مالكي'
  } else if (info.includes('حنفي') || info.includes('الحنفي') || info.includes('أبي حنيفة') || info.includes('أبو حنيفة')) {
    result.madhhabHint = 'حنفي'
  } else if (info.includes('ظاهري') || info.includes('الظاهري') || info.includes('ابن حزم')) {
    result.madhhabHint = 'ظاهري'
  }

  return result
}

/**
 * Resolve Islamic school of thought (Madhhab)
 */
export function resolveMadhhab(
  categoryTitle?: string,
  authorName?: string,
  bookTitle?: string,
  infoHint?: string
): string | undefined {
  if (infoHint) return infoHint

  const textToCheck = `${categoryTitle || ''} ${authorName || ''} ${bookTitle || ''}`

  if (textToCheck.includes('حنبلي') || textToCheck.includes('الحنبلي') || textToCheck.includes('ابن قدامة') || textToCheck.includes('أحمد بن حنبل')) {
    return 'حنبلي'
  }
  if (textToCheck.includes('شافعي') || textToCheck.includes('الشافعي') || textToCheck.includes('النووي') || textToCheck.includes('الشربيني')) {
    return 'شافعي'
  }
  if (textToCheck.includes('مالكي') || textToCheck.includes('المالكي') || textToCheck.includes('ابن عبد البر') || textToCheck.includes('خليل بن إسحاق')) {
    return 'مالكي'
  }
  if (textToCheck.includes('حنفي') || textToCheck.includes('الحنفي') || textToCheck.includes('الكاساني') || textToCheck.includes('السرخسي') || textToCheck.includes('أبو حنيفة')) {
    return 'حنفي'
  }
  if (textToCheck.includes('ظاهري') || textToCheck.includes('الظاهري') || textToCheck.includes('ابن حزم')) {
    return 'ظاهري'
  }

  return undefined
}

/**
 * Resolve high-level Islamic domain (e.g. فقه, أصول الفقه, عقيدة, حديث, تفسير)
 */
export function resolveDomain(categoryTitle?: string, bookTitle?: string): string {
  const cat = (categoryTitle || '').trim()
  const bTitle = (bookTitle || '').trim()

  if (cat.includes('أصول الفقه') || bTitle.includes('أصول الفقه')) return 'أصول الفقه'
  if (cat.includes('فقه') || cat.includes('الفقه')) return 'فقه'
  if (cat.includes('عقيدة') || cat.includes('العقيدة') || cat.includes('توحيد') || cat.includes('التوحيد')) return 'عقيدة'
  if (cat.includes('تفسير') || cat.includes('التفسير') || cat.includes('علوم القرآن')) return 'تفسير'
  if (cat.includes('حديث') || cat.includes('الحديث') || cat.includes('شروح الحديث') || cat.includes('متون الحديث')) return 'حديث'
  if (cat.includes('سيرة') || cat.includes('السيرة') || cat.includes('تاريخ') || cat.includes('التاريخ')) return 'سيرة وتاريخ'
  if (cat.includes('لغة') || cat.includes('نحو') || cat.includes('النحو') || cat.includes('صرف') || cat.includes('بلاغة')) return 'لغة عربية'
  if (cat.includes('تزكية') || cat.includes('رقائق') || cat.includes('الآداب') || cat.includes('الأخلاق')) return 'تزكية وآداب'

  return cat || 'علوم شرعية'
}

/**
 * Locate a book node and its parent category in the treeData
 */
export function findTurathBookInTree(
  treeData: TreeNode[],
  turathId: number
): { bookNode?: TreeNode; categoryTitle?: string } {
  for (const cat of treeData) {
    if (cat.children && cat.children.length > 0) {
      for (const book of cat.children) {
        if (book.turath_id === turathId || (book as any).id === turathId) {
          return { bookNode: book, categoryTitle: cat.title }
        }
      }
    } else if (cat.turath_id === turathId) {
      return { bookNode: cat }
    }
  }
  return {}
}

/**
 * Construct accurate hierarchy matching Mongo RAG layout:
 * - Parents: Intermediate sections (e.g. 'كتاب الطهارة') -> rendered in gray pills
 * - Current: The lesson/chapter clicked (e.g. 'باب أحكام المياه') -> rendered in blue pill with chevron
 * - Avoid repeating the lesson title twice.
 */
export function buildTurathHierarchy(
  fullPath: string,
  resolvedBookTitle: string,
  chapterTitle: string
): { kitab?: string; sections: string[] } {
  if (!fullPath) {
    return {
      sections: [chapterTitle]
    }
  }

  // Path segments are joined by ' ← ' in TreeView
  const rawSegments = fullPath
    .split('←')
    .map(s => s.trim())
    .filter(Boolean)

  // Filter out the category and book title if they exist in the path
  const bookIndex = rawSegments.findIndex(
    seg => seg === resolvedBookTitle || resolvedBookTitle.includes(seg) || seg.includes(resolvedBookTitle)
  )

  let intermediateSections: string[] = []
  if (bookIndex !== -1 && bookIndex < rawSegments.length - 1) {
    intermediateSections = rawSegments.slice(bookIndex + 1)
  } else if (rawSegments.length > 2) {
    // If exact book match failed, assume index 0 is category, index 1 is book
    intermediateSections = rawSegments.slice(2)
  }

  // Remove the current chapter title if it was somehow included in parent segments
  intermediateSections = intermediateSections.filter(s => s !== chapterTitle)

  if (intermediateSections.length > 0) {
    return {
      kitab: intermediateSections[0],
      sections: [...intermediateSections.slice(1), chapterTitle]
    }
  }

  // Single lesson directly under book
  return {
    sections: [chapterTitle]
  }
}
