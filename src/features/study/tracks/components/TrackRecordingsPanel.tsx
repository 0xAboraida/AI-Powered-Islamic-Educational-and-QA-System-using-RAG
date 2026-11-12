import React, { useMemo, useState } from 'react';
import {
  Headphones,
  Video,
  Play,
  CheckCircle2,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  Clock,
  FileText,
  Folder,
  FolderOpen,
} from 'lucide-react';
import { TreeNode } from '../../../../contexts/StudyContext';
import { BookTrackDefinition, TrackRecordingItem } from '../types';
import {
  findRecordingsForNode,
  nodeOrDescendantHasRecordings,
  normalizeTrackText,
} from '../data/trackStorage';

interface TrackRecordingsPanelProps {
  track: BookTrackDefinition;
  bookChapters: TreeNode[];
  searchQuery?: string;
  currentChunkId?: string | null;
  completedRecordingIds: string[];
  isDark: boolean;
  accentColor: string;
  onSelectChunk: (chunkId: string, title: string, fullPath: string, node?: TreeNode) => void;
  onOpenRecording: (recording: TrackRecordingItem) => void;
}

type FilterMode = 'all' | 'with_recordings';

export const TrackRecordingsPanel: React.FC<TrackRecordingsPanelProps> = ({
  track,
  bookChapters,
  searchQuery = '',
  currentChunkId,
  completedRecordingIds,
  isDark,
  accentColor,
  onSelectChunk,
  onOpenRecording,
}) => {
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    __general: true,
  });

  const normalizedQuery = normalizeTrackText(searchQuery);

  const toggleNode = (key: string) => {
    setExpandedNodes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const accentBadgeClass =
    accentColor === 'emerald'
      ? isDark
        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : accentColor === 'amber'
        ? isDark
          ? 'bg-amber-500/20 text-amber-300 border-amber-500/35'
          : 'bg-amber-50 text-amber-700 border-amber-200'
        : accentColor === 'purple'
          ? isDark
            ? 'bg-purple-500/20 text-purple-300 border-purple-500/35'
            : 'bg-purple-50 text-purple-700 border-purple-200'
          : isDark
            ? 'bg-blue-500/20 text-blue-300 border-blue-500/35'
            : 'bg-blue-50 text-blue-700 border-blue-200';

  const activeNodeClass =
    accentColor === 'emerald'
      ? isDark
        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
        : 'bg-emerald-600/15 border-emerald-600/35 text-emerald-950 font-bold'
      : accentColor === 'amber'
        ? isDark
          ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
          : 'bg-amber-600/15 border-amber-600/35 text-amber-950 font-bold'
        : accentColor === 'purple'
          ? isDark
            ? 'bg-purple-500/20 border-purple-500/40 text-purple-200'
            : 'bg-purple-600/15 border-purple-600/35 text-purple-950 font-bold'
          : isDark
            ? 'bg-blue-500/20 border-blue-500/40 text-blue-200'
            : 'bg-blue-600/15 border-blue-600/35 text-blue-950 font-bold';

  const matchesText = (text?: string) => {
    if (!normalizedQuery) return true;
    return normalizeTrackText(text).includes(normalizedQuery);
  };

  const filteredGeneral = useMemo(
    () =>
      (track.generalRecordings ?? []).filter(
        (r) => matchesText(r.title) || matchesText(r.notes)
      ),
    [track.generalRecordings, normalizedQuery]
  );

  const doesNodeMatchFilterAndSearch = (node: TreeNode): boolean => {
    if (filterMode === 'with_recordings' && !nodeOrDescendantHasRecordings(node, track)) {
      return false;
    }
    if (!normalizedQuery) return true;

    const directRecs = findRecordingsForNode(node, track);
    const selfOrRecMatch =
      matchesText(node.title) ||
      directRecs.some((r) => matchesText(r.title) || matchesText(r.notes));
    if (selfOrRecMatch) return true;

    return Boolean(node.children?.some(doesNodeMatchFilterAndSearch));
  };

  const renderRecordingItem = (rec: TrackRecordingItem, nodeForContext?: TreeNode) => {
    const isCompleted = completedRecordingIds.includes(rec.id);
    const contextualRec: TrackRecordingItem = nodeForContext?.chunk_id
      ? { ...rec, chunkId: rec.chunkId || nodeForContext.chunk_id }
      : rec;

    return (
      <button
        key={rec.id}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenRecording(contextualRec);
        }}
        className={`w-full rounded-xl border px-2.5 py-2 flex items-center justify-between gap-2 text-right transition-all ${
          isDark
            ? 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08] hover:border-white/20 text-stone-100'
            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 shadow-2xs'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${accentBadgeClass}`}
          >
            {rec.type === 'video' ? (
              <Video className="w-3.5 h-3.5" />
            ) : (
              <Headphones className="w-3.5 h-3.5" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[11.5px] font-bold truncate leading-snug">
              {rec.title}
            </div>
            {(rec.duration || rec.lectureNumber !== undefined) && (
              <div
                className={`flex items-center gap-2 text-[10px] ${
                  isDark ? 'text-stone-400' : 'text-slate-500'
                }`}
              >
                {typeof rec.lectureNumber === 'number' && rec.lectureNumber > 0 && (
                  <span>مجلس {rec.lectureNumber}</span>
                )}
                {rec.duration && (
                  <span className="inline-flex items-center gap-0.5" dir="ltr">
                    <Clock className="w-2.5 h-2.5" />
                    {rec.duration}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isCompleted && (
            <span title="تم الاستماع" className="inline-flex shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10.5px] font-bold border ${accentBadgeClass}`}
          >
            <Play className="w-2.5 h-2.5 fill-current" />
            <span>تشغيل</span>
          </span>
        </div>
      </button>
    );
  };

  const renderTreeNode = (
    node: TreeNode,
    depth = 0,
    parentPath: string[] = []
  ): React.ReactNode => {
    if (!doesNodeMatchFilterAndSearch(node)) return null;

    const nodeKey =
      node.chunk_id ||
      (node.toc_id !== undefined ? `toc_${node.toc_id}` : `${parentPath.join('/')}/${node.title}`);
    const attachedRecordings = findRecordingsForNode(node, track);
    const hasAttached = attachedRecordings.length > 0;
    const hasChildChapters = Boolean(node.children && node.children.length > 0);
    const hasExpandableContent = hasChildChapters || hasAttached;

    const isExpanded = Boolean(
      expandedNodes[nodeKey] ||
        normalizedQuery.length > 0 ||
        (filterMode === 'with_recordings' && nodeOrDescendantHasRecordings(node, track))
    );
    const isActive = Boolean(currentChunkId && node.chunk_id === currentChunkId);
    const currentPath = [...parentPath, node.title];
    const fullPathStr = `${track.bookTitle}${
      parentPath.length > 0 ? ` ← ${parentPath.join(' ← ')}` : ''
    }`;

    return (
      <div key={nodeKey} className="select-none">
        <div
          style={{ paddingRight: `${depth * 0.65}rem` }}
          className="my-0.5"
        >
          <div
            onClick={() => {
              if (node.chunk_id) {
                onSelectChunk(node.chunk_id, node.title, fullPathStr, node);
              }
              if (hasExpandableContent && !node.chunk_id) {
                toggleNode(nodeKey);
              }
            }}
            className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-xl border transition-all cursor-pointer ${
              isActive
                ? activeNodeClass
                : isDark
                  ? 'border-transparent hover:bg-white/5 text-white/80'
                  : 'border-transparent hover:bg-slate-100 text-slate-700'
            }`}
          >
            {hasExpandableContent ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(nodeKey);
                }}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md opacity-70 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10"
                title={isExpanded ? 'طي' : 'توسيع'}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronLeft className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center opacity-50">
                <FileText className="w-3.5 h-3.5" />
              </span>
            )}

            {hasChildChapters && (
              isExpanded ? (
                <FolderOpen className="w-3.5 h-3.5 shrink-0 text-amber-500" />
              ) : (
                <Folder className="w-3.5 h-3.5 shrink-0 text-amber-500/80" />
              )
            )}

            <span
              className={`text-[13px] truncate flex-1 ${
                hasChildChapters ? 'font-bold' : 'font-medium'
              }`}
              title={node.title}
            >
              {node.title}
            </span>

            {hasAttached && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (attachedRecordings.length === 1 && !hasChildChapters) {
                    const firstRec = attachedRecordings[0];
                    onOpenRecording(
                      node.chunk_id ? { ...firstRec, chunkId: firstRec.chunkId || node.chunk_id } : firstRec
                    );
                  } else {
                    toggleNode(nodeKey);
                  }
                }}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 transition-transform active:scale-95 ${accentBadgeClass}`}
                title={`${attachedRecordings.length} تسجيل مرتبط بهذا العنوان`}
              >
                <Headphones className="w-3 h-3" />
                <span>{attachedRecordings.length}</span>
              </button>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="space-y-1">
            {/* Attached recordings directly under this heading */}
            {hasAttached && (
              <div
                style={{ paddingRight: `${(depth + 1) * 0.65 + 0.35}rem` }}
                className="space-y-1.5 py-1 pl-1"
              >
                {attachedRecordings.map((rec) => renderRecordingItem(rec, node))}
              </div>
            )}

            {/* All child chapters/lessons of this heading */}
            {hasChildChapters &&
              node.children!.map((child) => renderTreeNode(child, depth + 1, currentPath))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2.5 py-1">
      {/* View Filter: All Chapters vs Chapters With Recordings Only */}
      <div
        className={`flex items-center gap-1 p-1 rounded-xl border ${
          isDark ? 'bg-white/[0.03] border-white/10' : 'bg-slate-100/80 border-slate-200'
        }`}
      >
        <button
          type="button"
          onClick={() => setFilterMode('all')}
          className={`flex-1 py-1 px-2 rounded-lg text-[10.5px] font-bold transition-colors ${
            filterMode === 'all'
              ? isDark
                ? 'bg-white/15 text-white'
                : 'bg-white text-slate-900 shadow-2xs'
              : isDark
                ? 'text-white/55 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          كل عناوين الفهرس
        </button>
        <button
          type="button"
          onClick={() => setFilterMode('with_recordings')}
          className={`flex-1 py-1 px-2 rounded-lg text-[10.5px] font-bold transition-colors ${
            filterMode === 'with_recordings'
              ? isDark
                ? 'bg-white/15 text-white'
                : 'bg-white text-slate-900 shadow-2xs'
              : isDark
                ? 'text-white/55 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          ذات تسجيلات فقط
        </button>
      </div>

      {/* General / Intro Recordings */}
      {filteredGeneral.length > 0 && (
        <div
          className={`rounded-2xl border overflow-hidden ${
            isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-50/70'
          }`}
        >
          <button
            type="button"
            onClick={() => toggleNode('__general')}
            className={`w-full px-3 py-2 flex items-center justify-between gap-2 text-right transition-colors ${
              isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100/80'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Headphones className="w-3.5 h-3.5 shrink-0 text-amber-500" />
              <span className="text-xs font-bold truncate">المقدمات والتسجيلات العامة</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isDark
                    ? 'bg-white/10 text-stone-300'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {filteredGeneral.length}
              </span>
            </div>
            {expandedNodes['__general'] ? (
              <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5 opacity-60 shrink-0" />
            )}
          </button>

          {expandedNodes['__general'] && (
            <div className="px-2 pb-2 space-y-1.5">
              {filteredGeneral.map((rec) => renderRecordingItem(rec))}
            </div>
          )}
        </div>
      )}

      {/* Complete Book Index Tree with Attached Recordings */}
      <div className="space-y-0.5">
        {bookChapters.map((chapter) => renderTreeNode(chapter, 0, []))}
      </div>

      {filterMode === 'with_recordings' &&
        filteredGeneral.length === 0 &&
        !bookChapters.some((ch) => nodeOrDescendantHasRecordings(ch, track)) && (
          <div
            className={`text-center py-6 px-3 text-xs rounded-2xl border ${
              isDark
                ? 'border-white/10 bg-white/[0.02] text-white/55'
                : 'border-slate-200 bg-slate-50 text-slate-500'
            }`}
          >
            <BookOpen className="w-5 h-5 mx-auto mb-2 opacity-50" />
            لا توجد تسجيلات مربوطة بعناوين الفهرس حتى الآن. يمكنك ربطها من لوحة التحكم.
          </div>
        )}
    </div>
  );
};
