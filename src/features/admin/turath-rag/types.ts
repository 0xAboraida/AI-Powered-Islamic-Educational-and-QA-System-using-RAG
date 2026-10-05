/**
 * types.ts
 * --------
 * TypeScript interfaces and types for the Turath Stateless RAG Multi-Cluster Hub.
 */

export interface CollectionSummary {
  name: string;
  points_count: number;
}

export interface ClusterInfo {
  id: string;
  name: string;
  url: string;
  full_url?: string;
  is_healthy: boolean;
  collections_count: number;
  points_count: number;
  collections: CollectionSummary[];
  assigned_collections?: string[];
  created_at?: string;
  message?: string;
}

export interface ClusterStatusResponse {
  is_healthy: boolean;
  clusters: ClusterInfo[];
  total_collections: number;
  total_points: number;
}

export interface IngestedBookRecord {
  book_id: number;
  title: string;
  author: string;
  chunks_count: number;
  pages_count: number;
  ingested_at: string;
}

export interface CollectionItem {
  id: string;
  name: string;
  arabicName: string;
  clusterId: string;
  icon: string;
  pointsCount?: number;
  description: string;
}

export interface TurathBookItem {
  turath_id: number | string;
  title: string;
  author: string;
  category?: string;
  madhhab?: string;
  is_book?: boolean;
}

export interface IngestJobState {
  book_id: number;
  book_title?: string;
  target_collection?: string;
  target_cluster?: string;
  stage: 'idle' | 'started' | 'downloading' | 'parsing' | 'embedding' | 'completed' | 'failed';
  percentage: number;
  message: string;
  is_running: boolean;
  error?: string;
}

export interface KaggleScriptResponse {
  target_cluster: string;
  books_count: number;
  script: string;
}

export interface RetrievedParent {
  book_id: number;
  book_title: string;
  author: string;
  chapter_title: string;
  hierarchy: string[];
  start_page: number;
  end_page: number;
  content_preview: string;
  full_content: string;
  score: number;
  source_url: string;
}

export interface RetrievedChild {
  chunk_id: string;
  parent_id: string;
  score: number;
  rrf_score?: number;
  book_id: number;
  book_title: string;
  author: string;
  chapter_title: string;
  hierarchy: string[];
  start_page: number;
  end_page: number;
  content: string;
  collection: string;
  source_url: string;
}

export interface QueryBenchmarkResponse {
  query: string;
  target_collections: string[];
  results_count: number;
  children_count?: number;
  parents: RetrievedParent[];
  children?: RetrievedChild[];
  latency_ms?: number;
  logs?: string[];
}

export interface CollectionMetaItem {
  id: string;
  arabic_name: string;
  icon: string;
  description: string;
  cluster_id: string;
}

export interface QueryBenchmarkRequest {
  query: string;
  domain?: string;
  madhhab?: string;
  target_cluster?: string;
  target_collection?: string;
  book_id?: number;
  author?: string;
  top_k?: number;
}

export interface BookHeadingItem {
  index: number;
  node_id: string;
  title: string;
  hierarchy: string[];
  start_page: number;
  end_page: number;
  pages_count: number;
  turath_url: string;
}

export interface BookInspectionResponse {
  book_id: number;
  title: string;
  author: string;
  author_death?: string;
  category?: string;
  madhhab?: string;
  domain?: string;
  total_pages: number;
  headings_count: number;
  turath_book_url: string;
  headings: BookHeadingItem[];
}

export interface ChunkPreviewItem {
  chunk_id: string;
  parent_id: string;
  child_index: number;
  total_children: number;
  chapter_title: string;
  hierarchy: string[];
  start_page: number;
  end_page: number;
  words_count: number;
  context_header: string;
  child_content: string;
  enriched_content: string;
  original_chapter_text: string;
  highlight_start: number;
  highlight_length: number;
  turath_url: string;
}

export interface ChunkPreviewResponse {
  book_id: number;
  book_title: string;
  author: string;
  total_chapters: number;
  total_chunks_previewed: number;
  estimated_total_chunks: number;
  chunks: ChunkPreviewItem[];
}

export interface KaggleLaunchResponse {
  status: string;
  kernel_slug: string;
  url: string;
  message: string;
  script_preview?: string;
}

export interface KaggleJobStatusResponse {
  status: 'queued' | 'running' | 'completed' | 'failed' | 'unknown';
  raw_status?: string;
  failure_message?: string;
  kernel_slug: string;
  url: string;
  logs?: string;
}

export interface BookMetadataOverride {
  title?: string;
  category?: string;
  collection?: string;
  clusterId?: string;
  shamela_category?: string;
}


