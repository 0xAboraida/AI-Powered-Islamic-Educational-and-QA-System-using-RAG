import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { TreeNode } from '../../../../contexts/StudyContext';
import {
  fetchTurathBookIndexes,
  convertTurathHeadingsToTree,
} from '../../../../api/turathApi';
import {
  idbGetTurathBookTree,
  idbSetTurathBookTree,
  idbDeleteTurathBookTree,
} from '../../../../utils/indexedDbStorage';
import {
  BookTrackDefinition,
  BookTrackProgress,
  TrackRecordingItem,
  TrackSidebarDisplayMode,
} from '../types';
import { getBookTrackById, getAllTrackRecordings } from '../data/bookTracks';
import {
  BOOK_TRACKS_UPDATED_EVENT,
  getStoredBookTracks,
  normalizeTrackText,
} from '../data/trackStorage';

const TRACK_PROGRESS_STORAGE_KEY = 'zad_study_track_progress_v1';

function loadTrackProgressMap(): Record<string, BookTrackProgress> {
  try {
    const raw = localStorage.getItem(TRACK_PROGRESS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveTrackProgressMap(map: Record<string, BookTrackProgress>): void {
  try {
    localStorage.setItem(TRACK_PROGRESS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota errors
  }
}

export const normalizeTrackArabic = normalizeTrackText;

/**
 * Shared loader for a single book's Turath TOC tree (used by both Track Workspace and Admin Panel).
 */
export async function loadBookTocTreeByTurathId(
  turathId: number,
  bookTitle: string
): Promise<TreeNode[]> {
  try {
    const cached = await idbGetTurathBookTree(turathId);
    if (cached && Array.isArray(cached.children) && cached.children.length > 0) {
      const isFallback =
        cached.children.length === 1 &&
        cached.children[0].title === 'قراءة الكتاب (من البداية)';
      const isOldFormat = Boolean(
        !cached.children[0].toc_id || !cached.children[0].chunk_id?.includes('_v5')
      );
      if (!isFallback && !isOldFormat) {
        return cached.children as TreeNode[];
      }
      await idbDeleteTurathBookTree(turathId);
    }
  } catch (err) {
    console.warn('Track IndexedDB read notice:', err);
  }

  const data = await fetchTurathBookIndexes(turathId);
  const headings = data?.indexes?.headings || [];
  const chapters = convertTurathHeadingsToTree(headings, turathId, bookTitle);

  if (headings.length > 0 && chapters.length > 0) {
    try {
      await idbSetTurathBookTree(turathId, {
        children: chapters,
        meta: data?.meta,
        indexes: data?.indexes,
      });
    } catch (err) {
      console.warn('Track IndexedDB write notice:', err);
    }
  }

  return chapters;
}

export function findFirstLeafChapter(
  nodes: TreeNode[],
  bookTitle: string,
  parentPath: string[] = []
): { node: TreeNode; fullPath: string } | null {
  for (const node of nodes) {
    const currentPath = [...parentPath, node.title];
    if (node.children && node.children.length > 0) {
      const childMatch = findFirstLeafChapter(node.children, bookTitle, currentPath);
      if (childMatch) return childMatch;
    }
    if (node.chunk_id && !node.is_book && !(node as any).is_category) {
      const pathString =
        parentPath.length > 0 ? `${bookTitle} ← ${parentPath.join(' ← ')}` : bookTitle;
      return { node, fullPath: pathString };
    }
  }
  return null;
}

export function findChapterByChunkId(
  nodes: TreeNode[],
  chunkId: string,
  bookTitle: string,
  parentPath: string[] = []
): { node: TreeNode; fullPath: string } | null {
  for (const node of nodes) {
    if (node.chunk_id === chunkId) {
      const pathString =
        parentPath.length > 0 ? `${bookTitle} ← ${parentPath.join(' ← ')}` : bookTitle;
      return { node, fullPath: pathString };
    }
    if (node.children && node.children.length > 0) {
      const found = findChapterByChunkId(node.children, chunkId, bookTitle, [
        ...parentPath,
        node.title,
      ]);
      if (found) return found;
    }
  }
  return null;
}

export function findChapterByTitleMatch(
  nodes: TreeNode[],
  keyword: string,
  bookTitle: string,
  parentPath: string[] = []
): { node: TreeNode; fullPath: string } | null {
  const normKey = normalizeTrackArabic(keyword);
  if (!normKey) return null;

  for (const node of nodes) {
    const normTitle = normalizeTrackArabic(node.title);
    if (normTitle.includes(normKey) && node.chunk_id) {
      const pathString =
        parentPath.length > 0 ? `${bookTitle} ← ${parentPath.join(' ← ')}` : bookTitle;
      return { node, fullPath: pathString };
    }
    if (node.children && node.children.length > 0) {
      const found = findChapterByTitleMatch(node.children, keyword, bookTitle, [
        ...parentPath,
        node.title,
      ]);
      if (found) return found;
    }
  }
  return null;
}

export interface UseBookTrackOptions {
  onOpenLesson: (
    chunkId: string,
    title: string,
    fullPath: string,
    node?: TreeNode
  ) => Promise<void> | void;
  onEnterWorkspace: () => void;
}

export function useBookTrack({ onOpenLesson, onEnterWorkspace }: UseBookTrackOptions) {
  const [tracksList, setTracksList] = useState<BookTrackDefinition[]>(() =>
    getStoredBookTracks()
  );
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [trackTreeNodes, setTrackTreeNodes] = useState<TreeNode[]>([]);
  const [trackTreeLoading, setTrackTreeLoading] = useState(false);
  const [sidebarDisplayMode, setSidebarDisplayMode] =
    useState<TrackSidebarDisplayMode>('index');
  const [activeRecording, setActiveRecording] = useState<TrackRecordingItem | null>(null);
  const [trackProgressMap, setTrackProgressMap] = useState<Record<string, BookTrackProgress>>(
    () => loadTrackProgressMap()
  );

  const loadTokenRef = useRef(0);

  useEffect(() => {
    const syncTracks = () => {
      setTracksList(getStoredBookTracks());
    };
    window.addEventListener(BOOK_TRACKS_UPDATED_EVENT, syncTracks);
    return () => window.removeEventListener(BOOK_TRACKS_UPDATED_EVENT, syncTracks);
  }, []);

  const activeTrack: BookTrackDefinition | null = useMemo(
    () => getBookTrackById(activeTrackId, tracksList),
    [activeTrackId, tracksList]
  );

  const updateTrackProgress = useCallback(
    (trackId: string, patch: Partial<BookTrackProgress>) => {
      setTrackProgressMap((prev) => {
        const existing: BookTrackProgress = prev[trackId] ?? {
          trackId,
          completedRecordingIds: [],
          updatedAt: Date.now(),
        };
        const next: Record<string, BookTrackProgress> = {
          ...prev,
          [trackId]: {
            ...existing,
            ...patch,
            trackId,
            updatedAt: Date.now(),
          },
        };
        saveTrackProgressMap(next);
        return next;
      });
    },
    []
  );

  const enterTrack = useCallback(
    async (trackId: string) => {
      const latestTracks = getStoredBookTracks();
      const track = getBookTrackById(trackId, latestTracks);
      if (!track) return;

      const token = ++loadTokenRef.current;
      setTracksList(latestTracks);
      setActiveTrackId(track.id);
      setSidebarDisplayMode('index');
      setTrackTreeLoading(true);
      onEnterWorkspace();

      try {
        const chapters = await loadBookTocTreeByTurathId(track.turathId, track.bookTitle);
        if (token !== loadTokenRef.current) return;

        setTrackTreeNodes(chapters);

        // Open last saved lesson in this track OR auto-open the very first lesson
        const savedProgress = loadTrackProgressMap()[track.id];
        let targetLesson: { node: TreeNode; fullPath: string } | null = null;

        if (savedProgress?.lastChunkId) {
          targetLesson = findChapterByChunkId(
            chapters,
            savedProgress.lastChunkId,
            track.bookTitle
          );
        }

        if (!targetLesson) {
          targetLesson = findFirstLeafChapter(chapters, track.bookTitle);
        }

        if (targetLesson && targetLesson.node.chunk_id) {
          updateTrackProgress(track.id, {
            lastChunkId: targetLesson.node.chunk_id,
            lastChapterTitle: targetLesson.node.title,
          });
          await onOpenLesson(
            targetLesson.node.chunk_id,
            targetLesson.node.title,
            targetLesson.fullPath,
            targetLesson.node
          );
        }
      } catch (err) {
        console.error('Failed to enter book track:', err);
      } finally {
        if (token === loadTokenRef.current) {
          setTrackTreeLoading(false);
        }
      }
    },
    [onEnterWorkspace, onOpenLesson, updateTrackProgress]
  );

  const exitTrack = useCallback(() => {
    loadTokenRef.current++;
    setActiveTrackId(null);
    setTrackTreeNodes([]);
    setTrackTreeLoading(false);
    setActiveRecording(null);
    setSidebarDisplayMode('index');
  }, []);

  const recordTrackLessonOpen = useCallback(
    (chunkId: string, title: string) => {
      if (!activeTrackId) return;
      updateTrackProgress(activeTrackId, {
        lastChunkId: chunkId,
        lastChapterTitle: title,
      });
    },
    [activeTrackId, updateTrackProgress]
  );

  const openRecording = useCallback(
    (recording: TrackRecordingItem) => {
      setActiveRecording(recording);
      if (activeTrackId) {
        updateTrackProgress(activeTrackId, { lastRecordingId: recording.id });
      }
    },
    [activeTrackId, updateTrackProgress]
  );

  const toggleRecordingCompleted = useCallback(
    (recordingId: string) => {
      if (!activeTrackId) return;
      const current = trackProgressMap[activeTrackId]?.completedRecordingIds ?? [];
      const exists = current.includes(recordingId);
      const updated = exists
        ? current.filter((id) => id !== recordingId)
        : [...current, recordingId];
      updateTrackProgress(activeTrackId, { completedRecordingIds: updated });
    },
    [activeTrackId, trackProgressMap, updateTrackProgress]
  );

  const jumpToRecordingChapter = useCallback(
    async (recording: TrackRecordingItem) => {
      if (!activeTrack) return;

      let match: { node: TreeNode; fullPath: string } | null = null;
      if (recording.chunkId) {
        match = findChapterByChunkId(
          trackTreeNodes,
          recording.chunkId,
          activeTrack.bookTitle
        );
      }
      if (!match && recording.chapterTitleMatch) {
        match = findChapterByTitleMatch(
          trackTreeNodes,
          recording.chapterTitleMatch,
          activeTrack.bookTitle
        );
      }
      if (match && match.node.chunk_id) {
        setActiveRecording(null);
        updateTrackProgress(activeTrack.id, {
          lastChunkId: match.node.chunk_id,
          lastChapterTitle: match.node.title,
        });
        await onOpenLesson(
          match.node.chunk_id,
          match.node.title,
          match.fullPath,
          match.node
        );
      }
    },
    [activeTrack, trackTreeNodes, onOpenLesson, updateTrackProgress]
  );

  const activeTrackAllRecordings = useMemo(
    () => (activeTrack ? getAllTrackRecordings(activeTrack) : []),
    [activeTrack]
  );

  const activeRecordingIndex = useMemo(() => {
    if (!activeRecording) return -1;
    return activeTrackAllRecordings.findIndex((r) => r.id === activeRecording.id);
  }, [activeRecording, activeTrackAllRecordings]);

  const openPrevRecording = useCallback(() => {
    if (activeRecordingIndex > 0) {
      openRecording(activeTrackAllRecordings[activeRecordingIndex - 1]);
    }
  }, [activeRecordingIndex, activeTrackAllRecordings, openRecording]);

  const openNextRecording = useCallback(() => {
    if (
      activeRecordingIndex >= 0 &&
      activeRecordingIndex < activeTrackAllRecordings.length - 1
    ) {
      openRecording(activeTrackAllRecordings[activeRecordingIndex + 1]);
    }
  }, [activeRecordingIndex, activeTrackAllRecordings, openRecording]);

  return {
    tracksList,
    activeTrackId,
    activeTrack,
    trackTreeNodes,
    trackTreeLoading,
    sidebarDisplayMode,
    setSidebarDisplayMode,
    activeRecording,
    setActiveRecording,
    trackProgressMap,
    enterTrack,
    exitTrack,
    recordTrackLessonOpen,
    openRecording,
    toggleRecordingCompleted,
    jumpToRecordingChapter,
    activeRecordingIndex,
    activeTrackAllRecordings,
    openPrevRecording,
    openNextRecording,
  };
}
