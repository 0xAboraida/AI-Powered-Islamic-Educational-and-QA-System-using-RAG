import React from 'react'
import type { ReactNode } from 'react'
import { Scale, HeartHandshake, BookOpenText, Sparkles, Moon, Landmark, Languages } from 'lucide-react'

export type Book = {
  title: string
  author: string
}

export type Category = {
  id: string
  name: string
  books: Book[]
}

export type Domain = {
  id: string
  name: string
  icon: ReactNode
  categories: Category[]
}

/**
 * Knowledge-base content model. The UI renders whatever is here, so the design
 * scales to thousands of books without changes — just extend these arrays.
 * A few example books per category are included on purpose.
 */
export function countBooks(list: Domain[]): number {
  return list.reduce(
    (total, d) => total + d.categories.reduce((n, c) => n + c.books.length, 0),
    0,
  )
}

export const domains: Domain[] = [
  {
    id: 'fiqh',
    name: 'الفقه',
    icon: <Scale className="h-6 w-6" />,
    categories: [
      {
        id: 'hanbali',
        name: 'المذهب الحنبلي',
        books: [
          { title: 'المغني', author: 'ابن قدامة المقدسي' },
          { title: 'زاد المستقنع', author: 'الحجاوي' },
          { title: 'عمدة الفقه', author: 'ابن قدامة المقدسي' },
        ],
      },
      {
        id: 'hanafi',
        name: 'المذهب الحنفي',
        books: [{ title: 'بدائع الصنائع', author: 'الكاساني' }],
      },
      {
        id: 'maliki',
        name: 'المذهب المالكي',
        books: [{ title: 'المدوّنة الكبرى', author: 'الإمام مالك' }],
      },
      {
        id: 'shafii',
        name: 'المذهب الشافعي',
        books: [{ title: 'الأم', author: 'الإمام الشافعي' }],
      },
      {
        id: 'general-fiqh',
        name: 'الفقه العام',
        books: [{ title: 'بداية المجتهد', author: 'ابن رشد الحفيد' }],
      },
    ],
  },
  {
    id: 'aqeedah',
    name: 'العقيدة',
    icon: <HeartHandshake className="h-6 w-6" />,
    categories: [
      {
        id: 'tawheed',
        name: 'التوحيد',
        books: [{ title: 'كتاب التوحيد', author: 'محمد بن عبد الوهاب' }],
      },
      {
        id: 'creed-texts',
        name: 'المتون العقدية',
        books: [{ title: 'العقيدة الواسطية', author: 'ابن تيمية' }],
      },
    ],
  },
  {
    id: 'hadith',
    name: 'الحديث',
    icon: <BookOpenText className="h-6 w-6" />,
    categories: [
      {
        id: 'sahih',
        name: 'الصحاح',
        books: [
          { title: 'صحيح البخاري', author: 'الإمام البخاري' },
          { title: 'صحيح مسلم', author: 'الإمام مسلم' },
        ],
      },
      {
        id: 'sunan',
        name: 'السنن',
        books: [{ title: 'سنن أبي داود', author: 'أبو داود السجستاني' }],
      },
    ],
  },
  {
    id: 'tafsir',
    name: 'التفسير',
    icon: <Sparkles className="h-6 w-6" />,
    categories: [
      {
        id: 'athari-tafsir',
        name: 'التفسير بالمأثور',
        books: [{ title: 'تفسير الطبري', author: 'ابن جرير الطبري' }],
      },
      {
        id: 'general-tafsir',
        name: 'التفسير العام',
        books: [{ title: 'تفسير ابن كثير', author: 'ابن كثير' }],
      },
    ],
  },
  {
    id: 'seerah',
    name: 'السيرة النبوية',
    icon: <Moon className="h-6 w-6" />,
    categories: [
      {
        id: 'classic-seerah',
        name: 'كتب السيرة',
        books: [
          { title: 'السيرة النبوية', author: 'ابن هشام' },
          { title: 'الرحيق المختوم', author: 'المباركفوري' },
        ],
      },
    ],
  },
  {
    id: 'history',
    name: 'التاريخ الإسلامي',
    icon: <Landmark className="h-6 w-6" />,
    categories: [
      {
        id: 'general-history',
        name: 'التاريخ العام',
        books: [{ title: 'البداية والنهاية', author: 'ابن كثير' }],
      },
    ],
  },
  {
    id: 'grammar',
    name: 'النحو والصرف',
    icon: <Languages className="h-6 w-6" />,
    categories: [
      {
        id: 'nahw',
        name: 'النحو',
        books: [{ title: 'الأجرومية', author: 'ابن آجروم' }],
      },
      {
        id: 'sarf',
        name: 'الصرف',
        books: [{ title: 'شذا العرف', author: 'أحمد الحملاوي' }],
      },
    ],
  },
]
