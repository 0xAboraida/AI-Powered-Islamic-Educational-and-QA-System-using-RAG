export type Role = 'user' | 'assistant'

export type Message = {
  id: string
  role: Role
  text: string
  citations?: CitationDTO[]
  domain?: string
  responseMode?: string
  response_mode?: string
  stream?: boolean
}

export type Conversation = {
  id: string
  title: string
  group: string
  messages: Message[]
}

export interface ChatSessionDTO {
  id: number
  name: string
  createdAt: string
  messageCount: number
}

export interface CitationDTO {
  bookTitle?: string;
  book_title?: string;
  sectionTitle?: string;
  section_title?: string;
  madhhab?: string;
  author?: string;
  authorDeath?: string;
  author_death?: string;
  totalParts?: number;
  total_parts?: number;
  part?: string;
  pageId?: number;
  page_id?: number;
  hierarchy?: string;
  sourceUrl?: string;
  source_url?: string;
}

export interface HistoryMessageDTO {
  id: number
  question: string
  answer: string
  citations: CitationDTO[] | Record<string, CitationDTO>
  createdAt: string
}

export interface ChatHistoryResponseDTO {
  session: ChatSessionDTO
  messages: HistoryMessageDTO[]
}

export const DOMAINS = [
  { id: 'auto', label: 'تحديد تلقائي' },
  { id: 'fiqh', label: 'الفقه' },
  { id: 'aqeedah', label: 'العقيدة' },
  { id: 'tafsir', label: 'التفسير' },
  { id: 'hadith', label: 'الحديث' },
  { id: 'seerah', label: 'السيرة' },
  { id: 'quran', label: 'علوم القرآن' },
] as const

export type DomainId = (typeof DOMAINS)[number]['id']

let counter = 0
export const uid = (prefix = 'id') => `${prefix}-${Date.now()}-${counter++}`

// Seed list mirroring the app's conversation history (grouped by recency).
export const seedConversations: Conversation[] = [
  {
    id: 'c1',
    title: 'حكم تارك الصلاة تكاسلًا',
    group: 'اليوم',
    messages: [
      { id: 'm1', role: 'user', text: 'ما حكم تارك الصلاة تكاسلًا؟' },
      {
        id: 'm2',
        role: 'assistant',
        text: 'تارك الصلاة تكاسلًا مع إقراره بوجوبها آثمٌ إثمًا عظيمًا، وقد اختلف العلماء في تكفيره؛ فذهب جمعٌ من أهل العلم إلى أنه لا يكفر كفرًا مخرجًا من الملّة ما دام مُقرًّا بوجوبها، وذهب آخرون إلى كفره لقوله ﷺ: «العهد الذي بيننا وبينهم الصلاة فمن تركها فقد كفر». والأحوط المبادرة إلى التوبة والمحافظة عليها في أوقاتها.',
      },
    ],
  },
  {
    id: 'c2',
    title: 'صحة حديث إنما الأعمال بالنيات',
    group: 'اليوم',
    messages: [],
  },
  {
    id: 'c3',
    title: 'الفرق بين الفرض والواجب',
    group: 'أمس',
    messages: [],
  },
  {
    id: 'c4',
    title: 'التصريف اللغوي لكلمة كتب',
    group: 'أمس',
    messages: [],
  },
  {
    id: 'c5',
    title: 'سيرة عبد الملك بن مروان',
    group: 'منذ يومين',
    messages: [],
  },
  {
    id: 'c6',
    title: 'تفسير سورة الفاتحة',
    group: 'منذ يومين',
    messages: [],
  },
  {
    id: 'c7',
    title: 'أركان الإسلام الخمسة',
    group: 'منذ ٣ أيام',
    messages: [],
  },
]

export const GROUP_ORDER = ['الآن', 'اليوم', 'أمس', 'منذ يومين', 'منذ ٣ أيام', 'المحادثات السابقة']

const domainLabel: Record<DomainId, string> = {
  auto: 'العلوم الشرعية',
  fiqh: 'الفقه',
  aqeedah: 'العقيدة',
  tafsir: 'التفسير',
  hadith: 'الحديث',
  seerah: 'السيرة والتاريخ',
  quran: 'علوم القرآن',
}

/**
 * A local placeholder responder used for the website demo. It composes a
 * contextual Arabic reply so the chat feels alive without a backend. Swap the
 * body of `getAssistantReply` for a real API call to connect Claude.
 */
export function demoReply(question: string, domain: DomainId): string {
  const trimmed = question.trim()
  const field = domainLabel[domain]
  return (
    `سؤالك في ${field} سؤالٌ طيّب. باختصار: «${trimmed}» — ` +
    'الإجابة المُحكمة تعتمد على الأدلة من الكتاب والسنّة وأقوال أهل العلم المعتبرين. ' +
    'أنصحك بالرجوع إلى المصادر الموثوقة، ويسعدني أن أفصّل لك المسألة بأدلّتها إن أردت.\n\n' +
    'ملاحظة: هذه نسخة تجريبية على الموقع — يمكن ربطها بنموذج زاد الكامل لإجاباتٍ مصدَّقة.'
  )
}
