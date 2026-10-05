/**
 * turathRagApi.ts
 * ---------------
 * API service for communicating with the Turath Stateless RAG endpoints.
 */

import {
  ClusterStatusResponse,
  ClusterInfo,
  IngestedBookRecord,
  IngestJobState,
  KaggleScriptResponse,
  QueryBenchmarkResponse,
  BookInspectionResponse,
  ChunkPreviewResponse,
  KaggleLaunchResponse,
  KaggleJobStatusResponse,
  CollectionMetaItem,
  QueryBenchmarkRequest,
  RetrievedChild,
  RetrievedParent,
  BookMetadataOverride
} from './types';

const STORAGE_KEY_BACKEND = 'zad_turath_rag_backend_url';

export const getTurathRagBaseUrl = (): string => {
  const stored = localStorage.getItem(STORAGE_KEY_BACKEND);
  if (stored) return stored.replace(/\/+$/, '');
  
  // Default: check env or local dashboard port (8550 / 8000)
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && !envUrl.includes('hf.space')) {
    return envUrl.replace(/\/+$/, '');
  }
  return 'http://127.0.0.1:8550';
};

export const setTurathRagBaseUrl = (url: string) => {
  localStorage.setItem(STORAGE_KEY_BACKEND, url.trim().replace(/\/+$/, ''));
};

/**
 * Fetch health, capacity, and assigned collections for both Qdrant clusters.
 */
export async function fetchClusterStatus(): Promise<ClusterStatusResponse> {
  const base = getTurathRagBaseUrl();
  const res = await fetch(`${base}/api/v1/turath-rag/cluster-status`);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch cluster status (${res.status}): ${errorText}`);
  }
  return res.json();
}

/**
 * Fetch all collections metadata.
 */
export async function fetchCollections(): Promise<{ collections: string[]; mappings: Record<string, string> }> {
  const base = getTurathRagBaseUrl();
  const res = await fetch(`${base}/api/v1/turath-rag/collections`);
  if (!res.ok) {
    throw new Error(`Failed to fetch collections (${res.status})`);
  }
  return res.json();
}

/**
 * Fetch all dynamic collection metadata (Arabic display names, icons, cluster mappings).
 */
export async function fetchCollectionsMeta(): Promise<Record<string, CollectionMetaItem>> {
  const base = getTurathRagBaseUrl();
  try {
    const res = await fetch(`${base}/api/v1/turath-rag/collections-meta`);
    if (!res.ok) return {};
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch collections meta:', err);
    return {};
  }
}

/**
 * Fetch current collection-to-cluster routing assignments.
 */
export async function fetchClusterAssignments(): Promise<Record<string, string>> {
  const base = getTurathRagBaseUrl();
  const res = await fetch(`${base}/api/v1/turath-rag/cluster-assignments`);
  if (!res.ok) {
    throw new Error(`Failed to fetch cluster assignments (${res.status})`);
  }
  const data = await res.json();
  return data.assignments || {};
}

/**
 * Assign a collection to a specific Qdrant cluster.
 */
export async function assignCollectionToCluster(
  collectionName: string,
  clusterId: string
): Promise<{ status: string; collection: string; assigned_to: string; all_assignments: Record<string, string> }> {
  const base = getTurathRagBaseUrl();
  const res = await fetch(`${base}/api/v1/turath-rag/assign-collection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      collection_name: collectionName,
      cluster_id: clusterId
    })
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to assign collection (${res.status}): ${errorText}`);
  }
  return res.json();
}

/**
 * Generate 1-click tailored Kaggle GPU execution code for selected books.
 */
export async function generateKaggleScript(
  bookIds: number[],
  targetCollection?: string,
  targetCluster?: string
): Promise<KaggleScriptResponse> {
  const base = getTurathRagBaseUrl();
  const res = await fetch(`${base}/api/v1/turath-rag/generate-kaggle-script`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      book_ids: bookIds,
      target_collection: targetCollection || null,
      target_cluster: targetCluster || null
    })
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to generate Kaggle script: ${errorText}`);
  }
  return res.json();
}

/**
 * Trigger background ingestion for a book via the server.
 */
export async function triggerIngestion(
  bookId: number,
  targetCollection?: string,
  targetCluster?: string
): Promise<{ status: string; book_id: number }> {
  const base = getTurathRagBaseUrl();
  const res = await fetch(`${base}/api/v1/turath-rag/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      book_id: bookId,
      target_collection: targetCollection || null,
      target_cluster: targetCluster || null
    })
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to trigger ingestion: ${errorText}`);
  }
  return res.json();
}

/**
 * Poll live progress for a book currently being ingested.
 */
export async function getIngestionStatus(bookId: number): Promise<IngestJobState> {
  const base = getTurathRagBaseUrl();
  const res = await fetch(`${base}/api/v1/turath-rag/ingest-status/${bookId}`);
  if (!res.ok) {
    throw new Error(`Failed to get ingest status for book ${bookId}`);
  }
  return res.json();
}

/**
 * Test multi-collection fan-out query and live parent retrieval.
 * Supports filtering by target cluster, collection, book ID, and author,
 * and returns live step-by-step logs.
 */
export async function testTurathQuery(
  req: QueryBenchmarkRequest | string,
  domain?: string,
  madhhab?: string,
  topK: number = 5
): Promise<QueryBenchmarkResponse> {
  const base = getTurathRagBaseUrl();
  const start = performance.now();

  let payload: Record<string, any>;
  if (typeof req === 'string') {
    payload = {
      query: req,
      domain: domain || null,
      madhhab: madhhab || null,
      top_k: topK
    };
  } else {
    payload = {
      query: req.query,
      domain: req.domain || null,
      madhhab: req.madhhab || null,
      target_cluster: req.target_cluster || null,
      target_collection: req.target_collection || null,
      book_id: req.book_id || null,
      author: req.author || null,
      top_k: req.top_k || 5
    };
  }

  const res = await fetch(`${base}/api/v1/turath-rag/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const latency = Math.round(performance.now() - start);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Query failed (${res.status}): ${errorText}`);
  }
  const data = await res.json();
  return { ...data, latency_ms: latency };
}

export interface QueryStreamCallbacks {
  onLog?: (log: string) => void;
  onChildren?: (children: RetrievedChild[]) => void;
  onParent?: (parent: RetrievedParent) => void;
  onComplete?: (meta: { status: string; latency_ms: number; parents_count: number; children_count: number }) => void;
  onError?: (err: string) => void;
}

/**
 * Stream multi-stage RAG retrieval progressive events in real time.
 * Emits logs, child chunks, and parent chapters as soon as each step completes.
 */
export async function testTurathQueryStream(
  req: QueryBenchmarkRequest,
  callbacks: QueryStreamCallbacks
): Promise<void> {
  const base = getTurathRagBaseUrl();
  const res = await fetch(`${base}/api/v1/turath-rag/query-stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: req.query,
      domain: req.domain || null,
      madhhab: req.madhhab || null,
      target_cluster: req.target_cluster || null,
      target_collection: req.target_collection || null,
      book_id: req.book_id || null,
      author: req.author || null,
      top_k: req.top_k || 5
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`فشل بث الاستعلام (${res.status}): ${errorText}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('ReadableStream غير مدعوم في هذا المتصفح.');

  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const jsonStr = trimmed.slice(5).trim();
      if (!jsonStr) continue;

      try {
        const payload = JSON.parse(jsonStr);
        const { event, data } = payload;

        if (event === 'log' && callbacks.onLog) {
          callbacks.onLog(data);
        } else if (event === 'children' && callbacks.onChildren) {
          callbacks.onChildren(data);
        } else if (event === 'parent' && callbacks.onParent) {
          callbacks.onParent(data);
        } else if (event === 'complete' && callbacks.onComplete) {
          callbacks.onComplete(data);
        } else if (event === 'error' && callbacks.onError) {
          callbacks.onError(data);
        }
      } catch (err) {
        console.warn('Failed to parse SSE chunk:', jsonStr, err);
      }
    }
  }
}

/**
 * Add / connect a new Qdrant Cloud cluster / account dynamically.
 */
export async function addCluster(
  name: string,
  url: string,
  apiKey: string
): Promise<{ status: string; cluster: ClusterInfo }> {
  const base = getTurathRagBaseUrl();
  const res = await fetch(`${base}/api/v1/turath-rag/clusters/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, url, api_key: apiKey })
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`فشل إضافة الكلاستر (${res.status}): ${errorText}`);
  }
  return res.json();
}

/**
 * Remove a Qdrant cluster account from the registry.
 */
export async function removeCluster(clusterId: string): Promise<{ status: string; removed: string }> {
  const base = getTurathRagBaseUrl();
  const res = await fetch(`${base}/api/v1/turath-rag/clusters/${clusterId}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`فشل حذف الكلاستر (${res.status}): ${errorText}`);
  }
  return res.json();
}

/**
 * Create a new collection on a specific cluster with int8 Scalar Quantization and Arabic metadata.
 */
export async function createCollectionOnCluster(
  clusterId: string,
  collectionName: string,
  arabicName?: string,
  icon?: string,
  description?: string
): Promise<{ status: string; cluster_id: string; collection: string; arabic_name?: string }> {
  const base = getTurathRagBaseUrl();
  const res = await fetch(`${base}/api/v1/turath-rag/clusters/${clusterId}/collections/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      collection_name: collectionName,
      arabic_name: arabicName || collectionName,
      icon: icon || 'BookOpen',
      description: description || ''
    })
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`فشل إنشاء المجموعة (${res.status}): ${errorText}`);
  }
  return res.json();
}

/**
 * Delete a collection from a specific cluster.
 */
export async function deleteCollectionOnCluster(
  clusterId: string,
  collectionName: string
): Promise<{ status: string; deleted: string; from_cluster: string }> {
  const base = getTurathRagBaseUrl();
  const res = await fetch(
    `${base}/api/v1/turath-rag/clusters/${clusterId}/collections/${encodeURIComponent(collectionName)}`,
    {
      method: 'DELETE'
    }
  );
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`فشل حذف المجموعة (${res.status}): ${errorText}`);
  }
  return res.json();
}

/**
 * Fetch list of ingested books with timestamps for a given cluster & collection.
 */
export async function fetchCollectionBooks(
  clusterId: string,
  collectionName: string
): Promise<IngestedBookRecord[]> {
  const base = getTurathRagBaseUrl();
  const res = await fetch(
    `${base}/api/v1/turath-rag/clusters/${clusterId}/collections/${encodeURIComponent(collectionName)}/books`
  );
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`فشل جلب الكتب المضافة (${res.status}): ${errorText}`);
  }
  const data = await res.json();
  return data.books || [];
}

/**
 * Global lookup map of all ingested books across all clusters and collections.
 */
export async function fetchAllIngestedBooks(): Promise<Record<number, {
  cluster_id: string;
  cluster_name: string;
  collection: string;
  title: string;
  author: string;
  chunks_count: number;
  pages_count: number;
  ingested_at: string;
}>> {
  const base = getTurathRagBaseUrl();
  const res = await fetch(`${base}/api/v1/turath-rag/all-ingested-books`);
  if (!res.ok) {
    return {};
  }
  return res.json();
}

/**
 * Fetch all active Kaggle GPU ingestion jobs and in-progress book IDs.
 */
export async function fetchActiveJobs(): Promise<{
  active_book_ids: number[];
  jobs: Array<{
    kernel_slug: string;
    book_ids: number[];
    target_collection: string;
    started_at: string;
    status: string;
    url: string;
  }>;
}> {
  const base = getTurathRagBaseUrl();
  try {
    const res = await fetch(`${base}/api/v1/turath-rag/active-jobs`);
    if (!res.ok) return { active_book_ids: [], jobs: [] };
    return await res.json();
  } catch (err) {
    console.warn('Failed to fetch active jobs:', err);
    return { active_book_ids: [], jobs: [] };
  }
}

/**
 * Cancel or clear an active job from the local registry for a book.
 */
export async function cancelActiveJob(bookId: number): Promise<{ status: string }> {
  const base = getTurathRagBaseUrl();
  const res = await fetch(`${base}/api/v1/turath-rag/active-jobs/${bookId}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    throw new Error('فشل إلغاء المهمة النشطة');
  }
  return res.json();
}



/**
 * Atomically delete a book's vectors from a collection in Qdrant Cloud.
 */
export async function deleteBookFromCollection(
  clusterId: string,
  collectionName: string,
  bookId: number
): Promise<{ status: string; message: string }> {
  const base = getTurathRagBaseUrl();
  const res = await fetch(
    `${base}/api/v1/turath-rag/clusters/${clusterId}/collections/${encodeURIComponent(collectionName)}/books/${bookId}`,
    { method: 'DELETE' }
  );
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`فشل مسح الكتاب (${res.status}): ${errorText}`);
  }
  return res.json();
}

/**
 * Step 1: Inspect book hierarchy, chapters, and direct Turath.io links.
 */
export async function inspectBook(bookId: number): Promise<BookInspectionResponse> {
  const base = getTurathRagBaseUrl();
  const res = await fetch(`${base}/api/v1/turath-rag/inspect-book/${bookId}`);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`فشل فحص بنية الكتاب (${res.status}): ${errorText}`);
  }
  return res.json();
}

/**
 * Step 2: Preview chunks with original chapter texts and character highlights.
 */
export async function previewChunks(
  bookId: number,
  maxChunks: number = 80
): Promise<ChunkPreviewResponse> {
  const base = getTurathRagBaseUrl();
  const res = await fetch(`${base}/api/v1/turath-rag/preview-chunks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ book_id: bookId, max_chunks: maxChunks })
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`فشل استعراض القطع الفقهية (${res.status}): ${errorText}`);
  }
  return res.json();
}

/**
 * Step 3: Trigger headless automated ingestion job on Kaggle Cloud GPU.
 */
export async function launchKaggleJob(
  bookId?: number,
  targetCollection?: string,
  targetCluster?: string,
  bookIds?: number[],
  booksMetadata?: Record<number, BookMetadataOverride> | Record<string, any>
): Promise<KaggleLaunchResponse> {
  const base = getTurathRagBaseUrl();
  const res = await fetch(`${base}/api/v1/turath-rag/kaggle/launch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      book_id: bookId || null,
      book_ids: bookIds || null,
      target_collection: targetCollection || null,
      target_cluster: targetCluster || null,
      books_metadata: booksMetadata || null
    })
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`فشل تشغيل المهمة على Kaggle (${res.status}): ${errorText}`);
  }
  return res.json();
}

/**
 * Step 3 Poll: Check live status of Kaggle Cloud job.
 */
export async function getKaggleJobStatus(kernelSlug: string): Promise<KaggleJobStatusResponse> {
  const base = getTurathRagBaseUrl();
  const res = await fetch(`${base}/api/v1/turath-rag/kaggle/status/${encodeURIComponent(kernelSlug)}`);
  if (!res.ok) {
    throw new Error(`فشل جلب حالة مهمة Kaggle (${res.status})`);
  }
  return res.json();
}

/**
 * Verify configured Kaggle credentials health.
 */
export async function getKaggleCredentialsStatus(): Promise<{ valid: boolean; username: string; message: string }> {
  const base = getTurathRagBaseUrl();
  const res = await fetch(`${base}/api/v1/turath-rag/kaggle/credentials/status`);
  if (!res.ok) throw new Error('فشل جلب حالة حساب Kaggle');
  return res.json();
}

/**
 * Dynamically update Kaggle API credentials.
 */
export async function updateKaggleCredentials(
  username: string,
  key: string
): Promise<{ valid: boolean; username: string; message: string }> {
  const base = getTurathRagBaseUrl();
  const res = await fetch(`${base}/api/v1/turath-rag/kaggle/credentials/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, key })
  });
  if (!res.ok) throw new Error('فشل تحديث بيانات Kaggle');
  return res.json();
}

