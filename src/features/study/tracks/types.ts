export type TrackMediaType = 'audio' | 'video';

export type TrackSidebarDisplayMode = 'index' | 'recordings';

export interface TrackRecordingItem {
  id: string;
  title: string;
  type: TrackMediaType;
  lectureNumber?: number;
  duration?: string;
  /** Direct audio stream/file URL if available (plays natively inside the site) */
  audioUrl?: string;
  /** Direct video stream/file URL if available (plays natively inside the site) */
  videoUrl?: string;
  /** YouTube lecture URL if available (embedded natively inside the site) */
  youtubeUrl?: string;
  /** Telegram post URL (e.g. https://t.me/sh_redaa_thabet/408) */
  telegramUrl?: string;
  /** Optional Arabic title/keyword of a chapter or section in the book TOC */
  chapterTitleMatch?: string;
  /** Optional Turath chunkId/page identifier if mapped directly to a specific lesson chunk */
  chunkId?: string;
  pageRange?: string;
  notes?: string;
}

export interface TrackSectionRecordings {
  id: string;
  sectionTitle: string;
  chapterTitleMatch?: string;
  description?: string;
  recordings: TrackRecordingItem[];
}

/**
 * مرونة كاملة لربط تسجيل واحد أو عدة تسجيلات بأي عنوان في فهرس الكتاب
 * (سواء كان كتابًا رئيسيًا أو فصلًا فرعيًا أو درسًا مفردًا).
 */
export interface TrackNodeRecordingBinding {
  id: string;
  /** Exact chunk_id of the TreeNode in Turath TOC */
  targetChunkId?: string;
  /** Exact toc_id of the TreeNode if present */
  targetTocId?: string | number;
  /** Arabic chapter/lesson title fallback for matching across cache updates */
  targetTitleMatch?: string;
  /** Display path saved from the Admin tree selector */
  targetPathLabel?: string;
  recordings: TrackRecordingItem[];
}

/** Reserved for Phase 2 (Transcript divider + AI context) */
export interface TrackTranscriptUnit {
  id: string;
  title: string;
  lectureNumber?: number;
  content: string;
  chapterTitleMatch?: string;
  chunkId?: string;
}

/** Reserved for Phase 2 (Stored book/lesson question bank) */
export interface TrackQuestionItem {
  id: string;
  question: string;
  options?: string[];
  correctAnswerIndex?: number;
  explanation?: string;
  chapterTitleMatch?: string;
  chunkId?: string;
}

export interface BookTrackProgress {
  trackId: string;
  lastChunkId?: string;
  lastChapterTitle?: string;
  lastRecordingId?: string;
  completedRecordingIds: string[];
  updatedAt: number;
}

export interface BookTrackDefinition {
  id: string;
  title: string;
  subtitle: string;
  bookTitle: string;
  author: string;
  commentator: string;
  domain: string;
  madhhab?: string;
  turathId: number;
  description: string;
  telegramChannelUrl?: string;
  telegramStartUrl?: string;
  bookPdfTelegramUrl?: string;
  /** Custom fallback / mapping hint per book */
  recordingsMappingStrategy: 'section' | 'playlist' | 'hybrid';
  /** Sections/chapters with nested recordings (backward-compatible) */
  sections: TrackSectionRecordings[];
  /** Node-level flexible bindings created from the Admin panel */
  bindings?: TrackNodeRecordingBinding[];
  /** Standalone / intro / general recordings not bound to a single sub-chapter */
  generalRecordings?: TrackRecordingItem[];
  /** Reserved for Phase 2 */
  transcripts?: TrackTranscriptUnit[];
  /** Reserved for Phase 2 */
  questions?: TrackQuestionItem[];
  updatedAt?: number;
  isCustom?: boolean;
}
