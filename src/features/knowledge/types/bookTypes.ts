export type BookMeta = {
  id: number;
  title: string;
  author: string;
  author_id?: number;
  category?: string;
  info?: string;
  author_bio?: string;
  death_year?: number | null;
  century?: number | string | null;
  century_name?: string;
  has_pdf?: boolean;
  pdf_url?: string;
  pdf_links?: { root?: string; files?: string[] } | null;
  page_count?: number | null;
  size?: number | null;

  // Backward-compatible aliases
  name?: string;
  author_name?: string;
  cat_name?: string;
  infoText?: string;
  book_info_text?: string;
  authorBioText?: string;
  author_bio_text?: string;
  savedPage?: number;
  cover?: string;
  cover_url?: string;
};

export type LibraryAnalytics = {
  total_books: number;
  total_authors: number;
  total_domains: number;
  domains: { name: string; count: number }[];
  centuries: { century: number; name: string; count: number }[];
  timeline?: {
    earliest_death?: number;
    latest_death?: number;
    earliest_century?: number;
    latest_century?: number;
  };
};

export type MainTab = 'home' | 'categories' | 'authors' | 'narrators' | 'downloads' | 'featured' | 'media' | 'favorites' | 'courses';

