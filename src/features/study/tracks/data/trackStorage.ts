import { TreeNode } from '../../../../contexts/StudyContext';
import {
  BookTrackDefinition,
  TrackNodeRecordingBinding,
  TrackRecordingItem,
} from '../types';
import { DEFAULT_BOOK_TRACKS } from './bookTracks';

export const BOOK_TRACKS_STORAGE_KEY = 'zad_book_tracks_store_v1';
export const BOOK_TRACKS_UPDATED_EVENT = 'zad_book_tracks_updated';

export function normalizeTrackText(text?: string | number | null): string {
  if (text === undefined || text === null) return '';
  return String(text)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Reads tracks saved by the Admin UI and merges them with built-in DEFAULT_BOOK_TRACKS.
 * Admin edits override matching built-in IDs and add new custom tracks seamlessly.
 */
export function getStoredBookTracks(): BookTrackDefinition[] {
  try {
    const raw = localStorage.getItem(BOOK_TRACKS_STORAGE_KEY);
    if (!raw) return DEFAULT_BOOK_TRACKS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_BOOK_TRACKS;
    }

    const byId = new Map<string, BookTrackDefinition>();
    for (const def of DEFAULT_BOOK_TRACKS) {
      byId.set(def.id, def);
    }
    for (const custom of parsed) {
      if (custom && typeof custom.id === 'string' && typeof custom.turathId === 'number') {
        byId.set(custom.id, custom);
      }
    }
    return Array.from(byId.values());
  } catch {
    return DEFAULT_BOOK_TRACKS;
  }
}

export function saveStoredBookTracks(tracks: BookTrackDefinition[]): void {
  try {
    localStorage.setItem(BOOK_TRACKS_STORAGE_KEY, JSON.stringify(tracks));
    window.dispatchEvent(new Event(BOOK_TRACKS_UPDATED_EVENT));
  } catch (err) {
    console.error('Failed to save book tracks to localStorage:', err);
  }
}

export function upsertStoredBookTrack(track: BookTrackDefinition): BookTrackDefinition[] {
  const current = getStoredBookTracks();
  const nextTrack: BookTrackDefinition = {
    ...track,
    updatedAt: Date.now(),
  };
  const idx = current.findIndex((t) => t.id === track.id);
  const next =
    idx >= 0
      ? current.map((t, i) => (i === idx ? nextTrack : t))
      : [...current, nextTrack];

  saveStoredBookTracks(next);
  return next;
}

export function deleteStoredBookTrack(trackId: string): BookTrackDefinition[] {
  const current = getStoredBookTracks();
  const next = current.filter((t) => t.id !== trackId);
  // If user deletes a built-in track from custom override, preserve deletion in store
  saveStoredBookTracks(next);
  return next;
}

export function resetBookTracksToDefault(): BookTrackDefinition[] {
  try {
    localStorage.removeItem(BOOK_TRACKS_STORAGE_KEY);
    window.dispatchEvent(new Event(BOOK_TRACKS_UPDATED_EVENT));
  } catch {}
  return DEFAULT_BOOK_TRACKS;
}

export function exportTracksAsJson(tracks?: BookTrackDefinition[]): string {
  const data = tracks ?? getStoredBookTracks();
  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      tracks: data,
    },
    null,
    2
  );
}

export function triggerTracksJsonDownload(
  tracks?: BookTrackDefinition[],
  filename = `zad-book-tracks-${new Date().toISOString().slice(0, 10)}.json`
): void {
  const json = exportTracksAsJson(tracks);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseImportedTracksJson(jsonText: string): BookTrackDefinition[] {
  const parsed = JSON.parse(jsonText);
  const list: unknown = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as any).tracks)
      ? (parsed as any).tracks
      : null;

  if (!Array.isArray(list)) {
    throw new Error('صيغة ملف JSON غير صالحة: لم يتم العثور على مصفوفة tracks.');
  }

  const valid = list.filter(
    (item): item is BookTrackDefinition =>
      Boolean(
        item &&
          typeof item === 'object' &&
          typeof (item as any).id === 'string' &&
          typeof (item as any).title === 'string' &&
          typeof (item as any).turathId === 'number'
      )
  );

  if (valid.length === 0) {
    throw new Error('لم يتم العثور على مسارات صالحة داخل الملف.');
  }

  return valid;
}

/** Checks if a TreeNode matches a specific binding */
export function doesBindingMatchNode(
  binding: TrackNodeRecordingBinding,
  node: TreeNode
): boolean {
  if (binding.targetChunkId && node.chunk_id && binding.targetChunkId === node.chunk_id) {
    return true;
  }
  if (
    binding.targetTocId !== undefined &&
    node.toc_id !== undefined &&
    String(binding.targetTocId) === String(node.toc_id)
  ) {
    return true;
  }
  if (binding.targetTitleMatch) {
    const targetNorm = normalizeTrackText(binding.targetTitleMatch);
    const nodeNorm = normalizeTrackText(node.title);
    if (targetNorm && nodeNorm && nodeNorm === targetNorm) {
      return true;
    }
  }
  return false;
}

/** Returns all recordings attached directly to a specific TOC node */
export function findRecordingsForNode(
  node: TreeNode,
  track: BookTrackDefinition
): TrackRecordingItem[] {
  const results: TrackRecordingItem[] = [];
  const seenIds = new Set<string>();

  // 1. Flexible admin bindings (primary)
  for (const binding of track.bindings ?? []) {
    if (doesBindingMatchNode(binding, node)) {
      for (const rec of binding.recordings) {
        if (!seenIds.has(rec.id)) {
          seenIds.add(rec.id);
          results.push(rec);
        }
      }
    }
  }

  // 2. Legacy sections compatibility
  const nodeNorm = normalizeTrackText(node.title);
  for (const sec of track.sections ?? []) {
    const secKey = normalizeTrackText(sec.chapterTitleMatch || sec.sectionTitle);
    if (secKey && nodeNorm && nodeNorm === secKey) {
      for (const rec of sec.recordings) {
        if (!seenIds.has(rec.id)) {
          seenIds.add(rec.id);
          results.push(rec);
        }
      }
    }
  }

  return results;
}

export function nodeOrDescendantHasRecordings(
  node: TreeNode,
  track: BookTrackDefinition
): boolean {
  if (findRecordingsForNode(node, track).length > 0) return true;
  if (node.children && node.children.length > 0) {
    return node.children.some((child) => nodeOrDescendantHasRecordings(child, track));
  }
  return false;
}

