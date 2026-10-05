export interface ChapterItem {
  title: string;
  timestamp: string; // e.g. "15:30"
  seconds: number;   // e.g. 930
}

export interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  duration?: string;
  publishedAt?: string;
  url?: string;
  directUrl?: string;
  source?: 'youtube' | 'telegram' | 'direct' | 'pdf';
  description?: string;
  chapters?: ChapterItem[];
}

export interface Scholar {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  specialty?: string;
  youtubeUrl?: string;
  socialLinks?: {
    telegram?: string;
    facebook?: string;
    twitter?: string;
    website?: string;
  };
}

export interface ExplanationSeries {
  id: string;
  scholarId: string;
  title: string;
  thumbnail: string;
  description: string;
  videoCount: number;
  type: 'curated' | 'visual' | 'audio' | 'book' | 'course' | 'podcast' | 'standalone' | 'shorts' | 'post';
  source?: 'youtube' | 'telegram' | 'direct' | 'pdf' | 'mixed';
  isCurated?: boolean;
  url: string;
  videos?: VideoItem[];
  bookDetails?: {
    pdfUrl?: string;
    pagesCount?: number;
    fileSize?: string;
  };
}

export const MOCK_SCHOLARS: Scholar[] = [];

export const MOCK_SERIES: ExplanationSeries[] = [];



