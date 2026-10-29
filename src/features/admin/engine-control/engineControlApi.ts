/**
 * engineControlApi.ts
 * --------------------
 * Client service to communicate with the Zad-AI Admin Engine Control API:
 * 1. GET  /api/v1/admin/engine/status   -> Active mode, Mongo health, and Turath clusters stats
 * 2. POST /api/v1/admin/engine/mode     -> Switch mode ('auto', 'turath', 'mongo')
 * 3. POST /api/v1/admin/engine/test     -> Run single test query on chosen engine
 * 4. POST /api/v1/admin/engine/compare  -> Run query concurrently on BOTH engines (asyncio.gather)
 */

import { BASE_URL } from '@/api/client';

export type EngineMode = 'auto' | 'turath' | 'mongo';

export interface TurathClusterSummary {
  id: string;
  name: string;
  full_url: string;
  is_healthy: boolean;
  collections_count: number;
  points_count: number;
  collections: string[];
}

export interface EngineStatusResponse {
  status: string;
  engine_mode: EngineMode;
  description: string;
  valid_modes: string[];
  use_reranker?: boolean;
  turath: {
    healthy: boolean;
    clusters_count: number;
    total_points: number;
    clusters: TurathClusterSummary[];
  };
  mongo: {
    is_active_in_current_mode: boolean;
    warmed_up: boolean;
    active_clients: number;
  };
}

export interface ContextChunk {
  parent_id?: string;
  book_title?: string;
  author?: string;
  chapter_title?: string;
  hierarchy?: string[] | string;
  start_page?: number;
  end_page?: number;
  source_url?: string;
  score?: number;
  engine?: string;
  content: string;
}

export interface TestQueryResponse {
  status: 'success' | 'error';
  engine: string;
  latency_ms: number;
  query?: string;
  domain?: string;
  answer?: string;
  citations?: Record<string, any>;
  engine_used?: string;
  context?: ContextChunk[];
  error?: string;
}

export interface CompareEngineResult {
  status: 'success' | 'error';
  engine: string;
  latency_ms: number;
  answer?: string;
  citations?: Record<string, any>;
  engine_used?: string;
  context?: ContextChunk[];
  error?: string;
}

export interface CompareQueryResponse {
  query: string;
  domain: string;
  total_wall_time_ms: number;
  winner_speed: 'turath' | 'mongo' | 'tie';
  speedup_percentage: number;
  turath: CompareEngineResult;
  mongo: CompareEngineResult;
}

const STORAGE_KEY_BACKEND = 'zad_turath_rag_backend_url';

export const getAdminEngineBaseUrl = (): string => {
  const stored = localStorage.getItem(STORAGE_KEY_BACKEND);
  if (stored) return stored.replace(/\/+$/, '');

  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && !envUrl.includes('hf.space')) {
    return envUrl.replace(/\/+$/, '');
  }

  // If running locally in browser (localhost / 127.0.0.1), default to local backend
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://127.0.0.1:8550';
  }

  return BASE_URL ? BASE_URL.replace(/\/+$/, '') : 'http://127.0.0.1:8550';
};

export const setAdminEngineBaseUrl = (url: string) => {
  localStorage.setItem(STORAGE_KEY_BACKEND, url.trim().replace(/\/+$/, ''));
};

export const fetchEngineStatus = async (): Promise<EngineStatusResponse> => {
  const base = getAdminEngineBaseUrl();
  const res = await fetch(`${base}/api/v1/admin/engine/status`, {
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    throw new Error(`فشل جلب حالة المحركات: ${res.status} ${res.statusText}`);
  }
  return res.json();
};

export const setEngineMode = async (mode: EngineMode): Promise<{ status: string; active_mode: EngineMode; description: string }> => {
  const base = getAdminEngineBaseUrl();
  const res = await fetch(`${base}/api/v1/admin/engine/mode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `فشل تبديل الوضع: ${res.status}`);
  }
  return res.json();
};

export const setRerankerStatus = async (enabled: boolean): Promise<{ status: string; use_reranker: boolean; message: string }> => {
  const base = getAdminEngineBaseUrl();
  const res = await fetch(`${base}/api/v1/admin/engine/reranker`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `فشل تعديل حالة نموذج إعادة الترتيب: ${res.status}`);
  }
  return res.json();
};

export const runTestQuery = async (
  query: string,
  engine: 'turath' | 'mongo',
  domain: string = 'فقه',
  response_mode: string = 'student'
): Promise<TestQueryResponse> => {
  const base = getAdminEngineBaseUrl();
  const res = await fetch(`${base}/api/v1/admin/engine/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, engine, domain, response_mode })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `فشل تنفيذ الاختبار: ${res.status}`);
  }
  return res.json();
};

export const runCompareQuery = async (
  query: string,
  domain: string = 'فقه',
  response_mode: string = 'student'
): Promise<CompareQueryResponse> => {
  const base = getAdminEngineBaseUrl();
  const res = await fetch(`${base}/api/v1/admin/engine/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, domain, response_mode })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `فشل تنفيذ المقارنة: ${res.status}`);
  }
  return res.json();
};

export interface TurathCatalogBook {
  title: string;
  author: string;
  madhhab?: string;
  domain?: string;
  aliases?: string[];
  engine?: string;
}

export interface TurathCatalogResponse {
  status: string;
  count: number;
  books: TurathCatalogBook[];
}

export interface SyncCatalogResponse {
  status: string;
  count: number;
  added: number;
  books: TurathCatalogBook[];
}

export const fetchTurathCatalog = async (): Promise<TurathCatalogResponse> => {
  const base = getAdminEngineBaseUrl();
  const res = await fetch(`${base}/api/v1/admin/engine/catalog`, {
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    throw new Error(`فشل جلب فهرس كتب تراث: ${res.status} ${res.statusText}`);
  }
  return res.json();
};

export const syncTurathCatalog = async (): Promise<SyncCatalogResponse> => {
  const base = getAdminEngineBaseUrl();
  const res = await fetch(`${base}/api/v1/admin/engine/catalog/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    throw new Error(`فشل مزامنة الفهرس من كلاسترات Qdrant: ${res.status}`);
  }
  return res.json();
};

export const addTurathCatalogBook = async (
  book: Partial<TurathCatalogBook> & { title: string; author: string }
): Promise<{ status: string; book: TurathCatalogBook }> => {
  const base = getAdminEngineBaseUrl();
  const res = await fetch(`${base}/api/v1/admin/engine/catalog/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(book)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `فشل إضافة الكتاب إلى الفهرس: ${res.status}`);
  }
  return res.json();
};

export const deleteTurathCatalogBook = async (title: string): Promise<{ status: string; message: string }> => {
  const base = getAdminEngineBaseUrl();
  const res = await fetch(`${base}/api/v1/admin/engine/catalog?title=${encodeURIComponent(title)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    throw new Error(`فشل حذف الكتاب من الفهرس: ${res.status}`);
  }
  return res.json();
};
