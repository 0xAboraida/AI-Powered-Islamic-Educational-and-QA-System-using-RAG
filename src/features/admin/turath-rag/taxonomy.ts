/**
 * taxonomy.ts
 * -----------
 * Unified Category & Sub-Category taxonomy for Turath RAG.
 * Single Source of Truth for the 8 primary domains and their approved sub-categories.
 */

export const MAIN_CATEGORIES = [
  'الفقه',
  'الحديث وعلومه',
  'العقيدة',
  'القرآن وعلومه',
  'السيرة والشمائل',
  'التاريخ والتراجم',
  'اللغة العربية',
  'الرقائق والآداب',
] as const;

export type MainCategory = (typeof MAIN_CATEGORIES)[number];

/**
 * Authoritative taxonomy map: Each primary category maps directly
 * to its approved Turath sub-categories without duplication.
 */
export const TAXONOMY: Record<MainCategory, readonly string[]> = {
  'الفقه': [
    'الفقه الحنبلي',
    'الفقه الشافعي',
    'الفقه المالكي',
    'الفقه الحنفي',
    'الفقه العام',
    'مسائل فقهية',
    'الفتاوى',
    'أصول الفقه',
    'علوم الفقه والقواعد الفقهية',
    'الفرائض والوصايا',
    'السياسة الشرعية والقضاء',
  ],
  'الحديث وعلومه': [
    'كتب السنة',
    'شروح الحديث',
    'علوم الحديث ومصطلح الحديث',
    'التخريج والأطراف',
    'العلل والسؤالات الحديثية',
  ],
  'العقيدة': [
    'العقيدة',
    'الفرق والردود',
  ],
  'القرآن وعلومه': [
    'التفسير',
    'علوم القرآن وأصول التفسير',
    'التجويد والقراءات',
  ],
  'السيرة والشمائل': [
    'السيرة النبوية',
  ],
  'التاريخ والتراجم': [
    'التاريخ',
    'التراجم والطبقات',
    'الأنساب',
    'البلدان والرحلات',
  ],
  'اللغة العربية': [
    'النحو والصرف',
    'الغريب والمعاجم',
    'كتب اللغة',
    'البلاغة',
    'الأدب',
    'الشعر ودواوينه',
    'العروض والقوافي',
  ],
  'الرقائق والآداب': [
    'الرقائق والآداب والأذكار',
  ],
};

// Flattened list of all approved sub-categories
export const ALL_SUB_CATEGORIES = Object.values(TAXONOMY).flat();

// Dynamically generate descriptive text by joining official sub-categories
export const CATEGORY_DESCRIPTIONS: Record<MainCategory, string> = Object.fromEntries(
  MAIN_CATEGORIES.map((cat) => [cat, TAXONOMY[cat].join('، ')])
) as Record<MainCategory, string>;

// Reverse lookup index built dynamically from TAXONOMY
const SUB_TO_MAIN_MAP: Record<string, MainCategory> = {};
for (const [cat, subs] of Object.entries(TAXONOMY) as [MainCategory, readonly string[]][]) {
  for (const sub of subs) {
    SUB_TO_MAIN_MAP[sub] = cat;
  }
}

/**
 * Infers the primary category from any given sub-category string.
 */
export function resolveMainCategory(subCategory: string = ''): MainCategory {
  const clean = subCategory.trim();
  if (!clean) return 'الفقه';

  // 1. Exact match lookup
  if (SUB_TO_MAIN_MAP[clean]) {
    return SUB_TO_MAIN_MAP[clean];
  }

  // 2. Flexible match stripping the Arabic definite article 'ال'
  const cleanBare = clean.replace(/^ال/, '');
  for (const [sub, main] of Object.entries(SUB_TO_MAIN_MAP)) {
    if (sub.replace(/^ال/, '') === cleanBare) {
      return main;
    }
  }

  // 3. Substring containment check against approved entries only
  for (const [main, subs] of Object.entries(TAXONOMY) as [MainCategory, readonly string[]][]) {
    if (subs.some((s) => clean.includes(s) || s.includes(clean))) {
      return main;
    }
  }

  return 'الفقه';
}
