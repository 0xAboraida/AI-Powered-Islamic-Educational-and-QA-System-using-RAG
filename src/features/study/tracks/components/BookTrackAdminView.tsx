import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus,
  Download,
  Upload,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  BookOpen,
  Headphones,
  Video,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronLeft,
  Search,
  Layers,
  ArrowRight,
  Folder,
  FolderOpen,
  FileText,
  Sparkles,
  RefreshCw,
  Edit3,
  Save,
  X,
} from 'lucide-react';
import Navbar from '../../../../components/layout/Navbar';
import IslamicPattern from '../../../knowledge/components/IslamicPattern';
import { TreeNode } from '../../../../contexts/StudyContext';
import {
  BookTrackDefinition,
  TrackMediaType,
  TrackNodeRecordingBinding,
  TrackRecordingItem,
} from '../types';
import { getAllTrackRecordings } from '../data/bookTracks';
import {
  deleteStoredBookTrack,
  exportTracksAsJson,
  findRecordingsForNode,
  getStoredBookTracks,
  normalizeTrackText,
  parseImportedTracksJson,
  resetBookTracksToDefault,
  saveStoredBookTracks,
  triggerTracksJsonDownload,
  upsertStoredBookTrack,
} from '../data/trackStorage';
import { loadBookTocTreeByTurathId } from '../hooks/useBookTrack';

interface CatalogBookOption {
  turathId: number;
  title: string;
  author: string;
  domain: string;
}

type AdminSectionTab = 'recordings' | 'transcripts' | 'ai_plan';

interface SelectedTocTarget {
  kind: 'general' | 'node';
  node?: TreeNode;
  pathLabel: string;
}

export interface BookTrackAdminViewProps {
  accentColor: 'purple' | 'emerald' | 'amber' | 'blue';
  isDark: boolean;
  onOpenTracksGallery: () => void;
  onExit: () => void;
  onNavigateHome?: () => void;
  onTryChat?: () => void;
  onLogin?: () => void;
  onOpenKnowledge?: (tab?: any) => void;
  onOpenVoiceChat?: () => void;
  onOpenLessons?: () => void;
  onOpenAdmin?: () => void;
  onOpenTurathRag?: () => void;
  onOpenEngineControl?: () => void;
  onOpenDataIngestion?: () => void;
  onOpenV2PipelineAdmin?: () => void;
  onOpenAdminLibrary?: () => void;
  onOpenYoutubeImporter?: () => void;
  onOpenSystemObservability?: () => void;
}

export const BookTrackAdminView: React.FC<BookTrackAdminViewProps> = ({
  accentColor,
  isDark,
  onOpenTracksGallery,
  onExit,
  onNavigateHome,
  onTryChat,
  onLogin,
  onOpenKnowledge,
  onOpenVoiceChat,
  onOpenLessons,
  onOpenAdmin,
  onOpenTurathRag,
  onOpenEngineControl,
  onOpenDataIngestion,
  onOpenV2PipelineAdmin,
  onOpenAdminLibrary,
  onOpenYoutubeImporter,
  onOpenSystemObservability,
}) => {
  const [tracks, setTracks] = useState<BookTrackDefinition[]>(() => getStoredBookTracks());
  const [selectedTrackId, setSelectedTrackId] = useState<string>(
    () => getStoredBookTracks()[0]?.id ?? ''
  );
  const [adminTab, setAdminTab] = useState<AdminSectionTab>('recordings');

  // Turath catalog book search
  const [catalogBooks, setCatalogBooks] = useState<CatalogBookOption[]>([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [showCatalogPicker, setShowCatalogPicker] = useState(false);

  // Loaded TOC tree for selected track's book
  const [tocNodes, setTocNodes] = useState<TreeNode[]>([]);
  const [tocLoading, setTocLoading] = useState(false);
  const [tocError, setTocError] = useState<string | null>(null);
  const [tocSearch, setTocSearch] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  // Target node selected in tree (or 'general')
  const [selectedTarget, setSelectedTarget] = useState<SelectedTocTarget>({
    kind: 'general',
    pathLabel: 'المقدمات والتسجيلات العامة',
  });

  // Single recording form state
  const [recTitle, setRecTitle] = useState('');
  const [recType, setRecType] = useState<TrackMediaType>('audio');
  const [recLectureNum, setRecLectureNum] = useState<string>('');
  const [recDuration, setRecDuration] = useState('');
  const [recAudioUrl, setRecAudioUrl] = useState('');
  const [recVideoUrl, setRecVideoUrl] = useState('');
  const [recYoutubeUrl, setRecYoutubeUrl] = useState('');
  const [recTelegramUrl, setRecTelegramUrl] = useState('');
  const [recNotes, setRecNotes] = useState('');
  const [editingRecId, setEditingRecId] = useState<string | null>(null);

  // Bulk sequential add state
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkBaseChannelUrl, setBulkBaseChannelUrl] = useState('https://t.me/sh_redaa_thabet');
  const [bulkStartPost, setBulkStartPost] = useState('410');
  const [bulkEndPost, setBulkEndPost] = useState('415');
  const [bulkTitlePrefix, setBulkTitlePrefix] = useState('الدرس');
  const [bulkStartLecture, setBulkStartLecture] = useState('3');
  const [bulkType, setBulkType] = useState<TrackMediaType>('audio');

  // Toolbar status feedback
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const selectedTrack = useMemo(
    () => tracks.find((t) => t.id === selectedTrackId) ?? tracks[0] ?? null,
    [tracks, selectedTrackId]
  );

  const notify = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage((curr) => (curr === msg ? null : curr));
    }, 3200);
  };

  // Load Turath catalog once for book picker
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/data/turath_catalog.json');
        if (!res.ok) return;
        const raw: TreeNode[] = await res.json();
        const flattened: CatalogBookOption[] = [];
        const walk = (nodes: TreeNode[], domainName: string) => {
          for (const n of nodes) {
            if (n.is_book && n.turath_id) {
              flattened.push({
                turathId: Number(n.turath_id),
                title: n.title,
                author: n.author || '',
                domain: domainName,
              });
            }
            if (n.children && n.children.length > 0) {
              walk(n.children, n.is_book ? domainName : n.title || domainName);
            }
          }
        };
        walk(raw, 'التراث الإسلامي');
        if (!cancelled) setCatalogBooks(flattened);
      } catch {
        // Non-blocking
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load TOC tree whenever selectedTrack.turathId changes
  const handleLoadBookToc = async (turathId: number, bookTitle: string) => {
    if (!turathId || Number.isNaN(turathId)) return;
    setTocLoading(true);
    setTocError(null);
    try {
      const chapters = await loadBookTocTreeByTurathId(turathId, bookTitle || 'الكتاب');
      setTocNodes(chapters);
    } catch (err: any) {
      setTocNodes([]);
      setTocError(err?.message || 'تعذر تحميل فهرس الكتاب من التراث');
    } finally {
      setTocLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTrack?.turathId) {
      handleLoadBookToc(selectedTrack.turathId, selectedTrack.bookTitle);
    }
  }, [selectedTrack?.id, selectedTrack?.turathId]);

  const matchingCatalogBooks = useMemo(() => {
    const q = normalizeTrackText(catalogSearch);
    if (!q) return catalogBooks.slice(0, 30);
    return catalogBooks
      .filter(
        (b) =>
          normalizeTrackText(b.title).includes(q) ||
          normalizeTrackText(b.author).includes(q) ||
          String(b.turathId).includes(q)
      )
      .slice(0, 30);
  }, [catalogBooks, catalogSearch]);

  const commitTrackUpdate = (updated: BookTrackDefinition, toast?: string) => {
    const nextList = upsertStoredBookTrack(updated);
    setTracks(nextList);
    if (toast) notify(toast);
  };

  const handleCreateNewTrack = () => {
    const id = `custom-track-${Date.now()}`;
    const newTrack: BookTrackDefinition = {
      id,
      title: 'مسار كتاب جديد',
      subtitle: 'خطة مدارسة منهجية مخصصة',
      bookTitle: 'عمدة الفقه',
      author: '',
      commentator: 'الشيخ ...',
      domain: 'الفقه',
      madhhab: '',
      turathId: 11315,
      description: '',
      telegramChannelUrl: '',
      recordingsMappingStrategy: 'hybrid',
      sections: [],
      bindings: [],
      generalRecordings: [],
      isCustom: true,
    };
    const next = upsertStoredBookTrack(newTrack);
    setTracks(next);
    setSelectedTrackId(id);
    setSelectedTarget({ kind: 'general', pathLabel: 'المقدمات والتسجيلات العامة' });
    notify('تم إنشاء مسار جديد بنجاح');
  };

  const handleDeleteTrack = (trackId: string) => {
    if (tracks.length <= 1) {
      notify('يجب الإبقاء على مسار واحد على الأقل');
      return;
    }
    const next = deleteStoredBookTrack(trackId);
    setTracks(next);
    if (selectedTrackId === trackId) {
      setSelectedTrackId(next[0]?.id ?? '');
    }
    notify('تم حذف المسار');
  };

  const handleSelectTargetNode = (node: TreeNode, pathSegments: string[]) => {
    resetRecForm();
    setSelectedTarget({
      kind: 'node',
      node,
      pathLabel: pathSegments.join(' ← '),
    });
  };

  const resetRecForm = () => {
    setEditingRecId(null);
    setRecTitle('');
    setRecType('audio');
    setRecLectureNum('');
    setRecDuration('');
    setRecAudioUrl('');
    setRecVideoUrl('');
    setRecYoutubeUrl('');
    setRecTelegramUrl('');
    setRecNotes('');
  };

  // Recordings belonging to currently selected target ('general' or specific TreeNode)
  const currentTargetRecordings: TrackRecordingItem[] = useMemo(() => {
    if (!selectedTrack) return [];
    if (selectedTarget.kind === 'general') {
      return selectedTrack.generalRecordings ?? [];
    }
    if (!selectedTarget.node) return [];
    return findRecordingsForNode(selectedTarget.node, selectedTrack);
  }, [selectedTrack, selectedTarget]);

  const updateCurrentTargetRecordings = (
    updater: (prev: TrackRecordingItem[]) => TrackRecordingItem[],
    toast?: string
  ) => {
    if (!selectedTrack) return;

    if (selectedTarget.kind === 'general') {
      const nextGeneral = updater(selectedTrack.generalRecordings ?? []);
      commitTrackUpdate({ ...selectedTrack, generalRecordings: nextGeneral }, toast);
      return;
    }

    const node = selectedTarget.node;
    if (!node) return;

    const existingBindings = selectedTrack.bindings ?? [];
    const existingIdx = existingBindings.findIndex(
      (b) =>
        (b.targetChunkId && node.chunk_id && b.targetChunkId === node.chunk_id) ||
        (b.targetTocId !== undefined &&
          node.toc_id !== undefined &&
          String(b.targetTocId) === String(node.toc_id)) ||
        (b.targetTitleMatch &&
          normalizeTrackText(b.targetTitleMatch) === normalizeTrackText(node.title))
    );

    const prevList =
      existingIdx >= 0 ? existingBindings[existingIdx].recordings : currentTargetRecordings;
    const nextList = updater(prevList);

    let nextBindings: TrackNodeRecordingBinding[];
    if (existingIdx >= 0) {
      if (nextList.length === 0) {
        nextBindings = existingBindings.filter((_, i) => i !== existingIdx);
      } else {
        nextBindings = existingBindings.map((b, i) =>
          i === existingIdx ? { ...b, recordings: nextList } : b
        );
      }
    } else {
      if (nextList.length === 0) return;
      const newBinding: TrackNodeRecordingBinding = {
        id: `bind-${Date.now()}`,
        targetChunkId: node.chunk_id || undefined,
        targetTocId: node.toc_id,
        targetTitleMatch: node.title,
        targetPathLabel: selectedTarget.pathLabel,
        recordings: nextList,
      };
      nextBindings = [...existingBindings, newBinding];
    }

    commitTrackUpdate({ ...selectedTrack, bindings: nextBindings }, toast);
  };

  const handleSaveRecording = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recTitle.trim()) {
      notify('أدخل عنوان التسجيل أولًا');
      return;
    }

    const parsedNum = recLectureNum.trim() ? Number(recLectureNum.trim()) : undefined;
    const item: TrackRecordingItem = {
      id: editingRecId || `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: recTitle.trim(),
      type: recType,
      lectureNumber: Number.isFinite(parsedNum) ? parsedNum : undefined,
      duration: recDuration.trim() || undefined,
      audioUrl: recAudioUrl.trim() || undefined,
      videoUrl: recVideoUrl.trim() || undefined,
      youtubeUrl: recYoutubeUrl.trim() || undefined,
      telegramUrl: recTelegramUrl.trim() || undefined,
      chapterTitleMatch: selectedTarget.node?.title,
      chunkId: selectedTarget.node?.chunk_id,
      notes: recNotes.trim() || undefined,
    };

    updateCurrentTargetRecordings((prev) => {
      if (editingRecId) {
        return prev.map((r) => (r.id === editingRecId ? item : r));
      }
      return [...prev, item];
    }, editingRecId ? 'تم تحديث التسجيل' : 'تمت إضافة التسجيل للعنوان المختار');

    resetRecForm();
  };

  const handleBulkAddTelegramRange = () => {
    const start = parseInt(bulkStartPost, 10);
    const end = parseInt(bulkEndPost, 10);
    if (!bulkBaseChannelUrl.trim() || Number.isNaN(start) || Number.isNaN(end) || end < start) {
      notify('تحقق من رابط القناة ونطاق أرقام المنشورات');
      return;
    }
    if (end - start > 150) {
      notify('الحد الأقصى للإضافة الدفعية الواحدة 150 تسجيلًا');
      return;
    }

    const cleanBase = bulkBaseChannelUrl.trim().replace(/\/+$/, '');
    const startLec = parseInt(bulkStartLecture, 10);
    const created: TrackRecordingItem[] = [];

    for (let postId = start; postId <= end; postId++) {
      const offset = postId - start;
      const lecNum = Number.isNaN(startLec) ? undefined : startLec + offset;
      created.push({
        id: `rec-bulk-${postId}-${Date.now()}-${offset}`,
        title: `${bulkTitlePrefix.trim() || 'الدرس'} ${lecNum ?? postId}`,
        type: bulkType,
        lectureNumber: lecNum,
        telegramUrl: `${cleanBase}/${postId}`,
        chapterTitleMatch: selectedTarget.node?.title,
        chunkId: selectedTarget.node?.chunk_id,
      });
    }

    updateCurrentTargetRecordings(
      (prev) => [...prev, ...created],
      `تمت إضافة ${created.length} تسجيلًا دفعة واحدة`
    );
    setShowBulkAdd(false);
  };

  const handleMoveRecording = (index: number, direction: -1 | 1) => {
    updateCurrentTargetRecordings((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.splice(target, 0, moved);
      return copy;
    });
  };

  const handleDeleteRecording = (recId: string) => {
    updateCurrentTargetRecordings(
      (prev) => prev.filter((r) => r.id !== recId),
      'تم حذف التسجيل'
    );
    if (editingRecId === recId) resetRecForm();
  };

  const handleEditRecording = (rec: TrackRecordingItem) => {
    setEditingRecId(rec.id);
    setRecTitle(rec.title);
    setRecType(rec.type);
    setRecLectureNum(rec.lectureNumber !== undefined ? String(rec.lectureNumber) : '');
    setRecDuration(rec.duration || '');
    setRecAudioUrl(rec.audioUrl || '');
    setRecVideoUrl(rec.videoUrl || '');
    setRecYoutubeUrl(rec.youtubeUrl || '');
    setRecTelegramUrl(rec.telegramUrl || '');
    setRecNotes(rec.notes || '');
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(exportTracksAsJson(tracks));
      setCopiedJson(true);
      notify('تم نسخ JSON إلى الحافظة');
      setTimeout(() => setCopiedJson(false), 2000);
    } catch {
      notify('تعذر النسخ التلقائي — استخدم زر تصدير JSON');
    }
  };

  const handleImportJsonFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const imported = parseImportedTracksJson(text);
      saveStoredBookTracks(imported);
      setTracks(imported);
      setSelectedTrackId(imported[0]?.id ?? '');
      notify(`تم استيراد ${imported.length} مسارًا بنجاح`);
    } catch (err: any) {
      notify(err?.message || 'فشل استيراد ملف JSON');
    } finally {
      e.target.value = '';
    }
  };

  const handleResetAll = () => {
    if (!window.confirm('هل تريد استعادة المسارات الافتراضية ومسح التعديلات المحلية؟')) {
      return;
    }
    const defaults = resetBookTracksToDefault();
    setTracks(defaults);
    setSelectedTrackId(defaults[0]?.id ?? '');
    notify('تمت استعادة البيانات الافتراضية');
  };

  const isEmerald = accentColor === 'emerald';
  const isAmber = accentColor === 'amber';
  const isPurple = accentColor === 'purple';

  const primaryBtn = isEmerald
    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
    : isAmber
      ? 'bg-amber-600 hover:bg-amber-700 text-white'
      : isPurple
        ? 'bg-purple-600 hover:bg-purple-700 text-white'
        : 'bg-blue-600 hover:bg-blue-700 text-white';

  const activePill = isEmerald
    ? isDark
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
      : 'bg-emerald-50 text-emerald-800 border-emerald-300'
    : isAmber
      ? isDark
        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
        : 'bg-amber-50 text-amber-800 border-amber-300'
      : isPurple
        ? isDark
          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
          : 'bg-purple-50 text-purple-800 border-purple-300'
        : isDark
          ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
          : 'bg-blue-50 text-blue-800 border-blue-300';

  const cardSurface = isDark
    ? 'bg-stone-900/80 border-stone-800 text-stone-100'
    : 'bg-white/95 border-stone-200 text-stone-900 shadow-sm';

  const inputClass = `w-full rounded-xl border px-3 py-2 text-xs sm:text-sm outline-none transition-colors ${
    isDark
      ? 'bg-stone-950/70 border-stone-700 text-stone-100 placeholder:text-stone-500 focus:border-stone-500'
      : 'bg-white border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-stone-400'
  }`;

  const tocSearchNorm = normalizeTrackText(tocSearch);

  const doesAdminNodeMatch = (node: TreeNode): boolean => {
    if (!tocSearchNorm) return true;
    if (normalizeTrackText(node.title).includes(tocSearchNorm)) return true;
    return Boolean(node.children?.some(doesAdminNodeMatch));
  };

  const renderAdminTocNode = (
    node: TreeNode,
    depth = 0,
    parentPath: string[] = []
  ): React.ReactNode => {
    if (!doesAdminNodeMatch(node) || !selectedTrack) return null;

    const nodeKey =
      node.chunk_id ||
      (node.toc_id !== undefined ? `toc_${node.toc_id}` : `${parentPath.join('/')}/${node.title}`);
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const isExpanded = Boolean(expandedKeys[nodeKey] || tocSearchNorm.length > 0);
    const currentPath = [...parentPath, node.title];
    const attached = findRecordingsForNode(node, selectedTrack);

    const isSelected =
      selectedTarget.kind === 'node' &&
      ((selectedTarget.node?.chunk_id && selectedTarget.node.chunk_id === node.chunk_id) ||
        (selectedTarget.node?.toc_id !== undefined &&
          selectedTarget.node.toc_id === node.toc_id) ||
        selectedTarget.pathLabel === currentPath.join(' ← '));

    return (
      <div key={nodeKey}>
        <div style={{ paddingRight: `${depth * 0.65}rem` }} className="my-0.5">
          <div
            onClick={() => handleSelectTargetNode(node, currentPath)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs cursor-pointer transition-all ${
              isSelected
                ? activePill + ' font-bold'
                : isDark
                  ? 'border-transparent hover:bg-white/5 text-stone-200'
                  : 'border-transparent hover:bg-stone-100 text-stone-700'
            }`}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedKeys((p) => ({ ...p, [nodeKey]: !p[nodeKey] }));
                }}
                className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 shrink-0"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronLeft className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <FileText className="w-3.5 h-3.5 opacity-50 shrink-0" />
            )}

            {hasChildren &&
              (isExpanded ? (
                <FolderOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-amber-500/80 shrink-0" />
              ))}

            <span className="truncate flex-1">{node.title}</span>

            {attached.length > 0 && (
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${activePill}`}
              >
                <Headphones className="w-2.5 h-2.5" />
                <span>{attached.length}</span>
              </span>
            )}
          </div>
        </div>

        {hasChildren &&
          isExpanded &&
          node.children!.map((child) => renderAdminTocNode(child, depth + 1, currentPath))}
      </div>
    );
  };

  return (
    <div
      dir="rtl"
      className="relative min-h-screen w-full bg-background text-foreground transition-colors duration-300 overflow-x-hidden"
    >
      <div className="fixed inset-0 pointer-events-none z-0">
        <IslamicPattern
          className={isDark ? 'text-white/5' : 'text-stone-900/5'}
          opacity={isDark ? 0.08 : 0.05}
          scale={0.85}
        />
      </div>

      <Navbar
        headerClassName="absolute inset-x-0 top-4 sm:top-6 z-50 px-3 sm:px-4"
        activeTab="study"
        onNavigateHome={onNavigateHome || onExit}
        onTryChat={onTryChat || (() => {})}
        onLogin={onLogin}
        onOpenKnowledge={onOpenKnowledge || (() => {})}
        onOpenStudy={onOpenTracksGallery}
        onOpenLessons={onOpenLessons || (() => {})}
        onOpenVoiceChat={onOpenVoiceChat || (() => {})}
        onOpenAdmin={onOpenAdmin}
        onOpenTurathRag={onOpenTurathRag}
        onOpenEngineControl={onOpenEngineControl}
        onOpenDataIngestion={onOpenDataIngestion}
        onOpenV2PipelineAdmin={onOpenV2PipelineAdmin}
        onOpenAdminLibrary={onOpenAdminLibrary}
        onOpenYoutubeImporter={onOpenYoutubeImporter}
        onOpenSystemObservability={onOpenSystemObservability}
      />

      <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 pt-28 sm:pt-32 pb-16 space-y-5">
        {/* Top Admin Header & Export Bar */}
        <div className={`rounded-3xl border p-4 sm:p-6 backdrop-blur-xl ${cardSurface}`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${activePill}`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>لوحة إدارة مسارات المدارسة</span>
                </span>
                {statusMessage && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                    <Check className="w-3 h-3" />
                    <span>{statusMessage}</span>
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold">
                إدارة مسارات الكتب وربط الشروح بالفهرس
              </h1>
              <p
                className={`text-xs sm:text-sm mt-1 ${
                  isDark ? 'text-stone-400' : 'text-stone-600'
                }`}
              >
                أنشئ خطط الكتب واختر أي عنوان أو درس في الفهرس لتربط به تسجيلاً واحدًا أو عدة
                تسجيلات، ثم صدّر الملف كـ JSON.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onOpenTracksGallery}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  isDark
                    ? 'border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-100'
                    : 'border-stone-200 bg-white hover:bg-stone-100 text-stone-800'
                }`}
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>معاينة صفحة المسارات</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerTracksJsonDownload(tracks);
                  notify('تم تنزيل ملف JSON بنجاح');
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${primaryBtn}`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير JSON</span>
              </button>

              <button
                type="button"
                onClick={handleCopyJson}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  isDark
                    ? 'border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-200'
                    : 'border-stone-200 bg-white hover:bg-stone-100 text-stone-700'
                }`}
              >
                {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>نسخ JSON</span>
              </button>

              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  isDark
                    ? 'border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-200'
                    : 'border-stone-200 bg-white hover:bg-stone-100 text-stone-700'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>استيراد JSON</span>
              </button>
              <input
                ref={importInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleImportJsonFile}
                className="hidden"
              />

              <button
                type="button"
                onClick={handleResetAll}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  isDark
                    ? 'border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300'
                    : 'border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>الافتراضي</span>
              </button>
            </div>
          </div>

          {/* Modular Future-Ready Admin Sub-tabs */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-stone-200/70 dark:border-stone-800">
            <button
              type="button"
              onClick={() => setAdminTab('recordings')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                adminTab === 'recordings'
                  ? activePill
                  : isDark
                    ? 'border-stone-800 text-stone-400 hover:text-white'
                    : 'border-stone-200 text-stone-600 hover:text-stone-900'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>1. ربط التسجيلات بالفهرس</span>
            </button>

            <button
              type="button"
              onClick={() => setAdminTab('transcripts')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                adminTab === 'transcripts'
                  ? activePill
                  : isDark
                    ? 'border-stone-800 text-stone-400 hover:text-white'
                    : 'border-stone-200 text-stone-600 hover:text-stone-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>2. تقسيم التفريغات (المرحلة 2)</span>
            </button>

            <button
              type="button"
              onClick={() => setAdminTab('ai_plan')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                adminTab === 'ai_plan'
                  ? activePill
                  : isDark
                    ? 'border-stone-800 text-stone-400 hover:text-white'
                    : 'border-stone-200 text-stone-600 hover:text-stone-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>3. بنك الأسئلة وخطة AI (المرحلة 2-3)</span>
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Column 1: Tracks Selector & Track Metadata */}
          <div className="lg:col-span-4 space-y-4">
            {/* Tracks List */}
            <div className={`rounded-3xl border p-4 backdrop-blur-xl space-y-3 ${cardSurface}`}>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-extrabold">المسارات الحالية ({tracks.length})</h2>
                <button
                  type="button"
                  onClick={handleCreateNewTrack}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold ${primaryBtn}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>مسار جديد</span>
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {tracks.map((trk) => {
                  const isActive = selectedTrack?.id === trk.id;
                  const count = getAllTrackRecordings(trk).length;
                  return (
                    <div
                      key={trk.id}
                      onClick={() => {
                        setSelectedTrackId(trk.id);
                        setSelectedTarget({
                          kind: 'general',
                          pathLabel: 'المقدمات والتسجيلات العامة',
                        });
                      }}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-2 ${
                        isActive
                          ? activePill
                          : isDark
                            ? 'border-stone-800 bg-stone-950/40 hover:border-stone-700'
                            : 'border-stone-200 bg-stone-50/70 hover:border-stone-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate">{trk.title}</div>
                        <div className="text-[11px] opacity-75 truncate">
                          {trk.bookTitle} • {trk.commentator} ({count} تسجيل)
                        </div>
                      </div>
                      {tracks.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTrack(trk.id);
                          }}
                          className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:text-rose-500 transition-colors shrink-0"
                          title="حذف المسار"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Track Basic Metadata Editor */}
            {selectedTrack && (
              <div className={`rounded-3xl border p-4 backdrop-blur-xl space-y-3 ${cardSurface}`}>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-extrabold">بيانات المسار والكتاب</h2>
                  <button
                    type="button"
                    onClick={() => setShowCatalogPicker((p) => !p)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${activePill}`}
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>{showCatalogPicker ? 'إغلاق البحث' : 'اختيار من المكتبة'}</span>
                  </button>
                </div>

                {showCatalogPicker && (
                  <div
                    className={`p-3 rounded-2xl border space-y-2 ${
                      isDark ? 'bg-stone-950/80 border-stone-700' : 'bg-stone-50 border-stone-200'
                    }`}
                  >
                    <input
                      type="text"
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      placeholder="ابحث باسم الكتاب أو المؤلف أو رقم التراث..."
                      className={inputClass}
                    />
                    <div className="max-h-44 overflow-y-auto space-y-1">
                      {matchingCatalogBooks.map((bk) => (
                        <button
                          key={bk.turathId}
                          type="button"
                          onClick={() => {
                            commitTrackUpdate(
                              {
                                ...selectedTrack,
                                turathId: bk.turathId,
                                bookTitle: bk.title,
                                author: bk.author || selectedTrack.author,
                                domain: bk.domain || selectedTrack.domain,
                                title: `مسار مدارسة كتاب ${bk.title}`,
                                bindings: [],
                              },
                              `تم اختيار كتاب: ${bk.title}`
                            );
                            setShowCatalogPicker(false);
                          }}
                          className={`w-full text-right px-2.5 py-1.5 rounded-xl text-xs transition-colors ${
                            isDark ? 'hover:bg-white/10' : 'hover:bg-white'
                          }`}
                        >
                          <div className="font-bold truncate">{bk.title}</div>
                          <div className="text-[10.5px] opacity-70 truncate">
                            {bk.author} • رقم التراث: {bk.turathId}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold mb-1 opacity-80">عنوان المسار</label>
                    <input
                      type="text"
                      value={selectedTrack.title}
                      onChange={(e) =>
                        commitTrackUpdate({ ...selectedTrack, title: e.target.value })
                      }
                      className={inputClass}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold mb-1 opacity-80">اسم الكتاب</label>
                      <input
                        type="text"
                        value={selectedTrack.bookTitle}
                        onChange={(e) =>
                          commitTrackUpdate({ ...selectedTrack, bookTitle: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold mb-1 opacity-80">رقم التراث (ID)</label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          value={selectedTrack.turathId}
                          onChange={(e) =>
                            commitTrackUpdate({
                              ...selectedTrack,
                              turathId: Number(e.target.value) || 0,
                            })
                          }
                          className={inputClass}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleLoadBookToc(selectedTrack.turathId, selectedTrack.bookTitle)
                          }
                          className={`px-2.5 rounded-xl border shrink-0 ${
                            isDark
                              ? 'border-stone-700 hover:bg-stone-800'
                              : 'border-stone-200 hover:bg-stone-100'
                          }`}
                          title="إعادة تحميل فهرس الكتاب"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${tocLoading ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold mb-1 opacity-80">الشارح</label>
                      <input
                        type="text"
                        value={selectedTrack.commentator}
                        onChange={(e) =>
                          commitTrackUpdate({ ...selectedTrack, commentator: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold mb-1 opacity-80">المؤلف</label>
                      <input
                        type="text"
                        value={selectedTrack.author}
                        onChange={(e) =>
                          commitTrackUpdate({ ...selectedTrack, author: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold mb-1 opacity-80">التخصص</label>
                      <input
                        type="text"
                        value={selectedTrack.domain}
                        onChange={(e) =>
                          commitTrackUpdate({ ...selectedTrack, domain: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold mb-1 opacity-80">المذهب (اختياري)</label>
                      <input
                        type="text"
                        value={selectedTrack.madhhab || ''}
                        onChange={(e) =>
                          commitTrackUpdate({ ...selectedTrack, madhhab: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold mb-1 opacity-80">
                      رابط بداية السلسلة (اختياري)
                    </label>
                    <input
                      type="url"
                      dir="ltr"
                      value={selectedTrack.telegramStartUrl || ''}
                      onChange={(e) =>
                        commitTrackUpdate({ ...selectedTrack, telegramStartUrl: e.target.value })
                      }
                      placeholder="https://t.me/..."
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold mb-1 opacity-80">وصف مختصر</label>
                    <textarea
                      rows={2}
                      value={selectedTrack.description}
                      onChange={(e) =>
                        commitTrackUpdate({ ...selectedTrack, description: e.target.value })
                      }
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Selected Tab Content */}
          <div className="lg:col-span-8">
            {adminTab === 'recordings' && selectedTrack && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                {/* Interactive Book Index Tree Selector */}
                <div
                  className={`xl:col-span-6 rounded-3xl border p-4 backdrop-blur-xl space-y-3 ${cardSurface}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-extrabold">
                      فهرس الكتاب ({selectedTrack.bookTitle})
                    </h2>
                    <span className="text-[11px] opacity-70">
                      اضغط على أي عنوان لربط تسجيلاته
                    </span>
                  </div>

                  {/* General / Intro Recordings Target */}
                  <button
                    type="button"
                    onClick={() => {
                      resetRecForm();
                      setSelectedTarget({
                        kind: 'general',
                        pathLabel: 'المقدمات والتسجيلات العامة',
                      });
                    }}
                    className={`w-full px-3 py-2.5 rounded-2xl border flex items-center justify-between gap-2 text-right transition-all ${
                      selectedTarget.kind === 'general'
                        ? activePill + ' font-bold'
                        : isDark
                          ? 'border-stone-800 bg-stone-950/50 hover:border-stone-700'
                          : 'border-stone-200 bg-stone-50 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Headphones className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="text-xs font-bold">المقدمات والتسجيلات العامة</span>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 font-bold">
                      {selectedTrack.generalRecordings?.length ?? 0}
                    </span>
                  </button>

                  {/* Search inside TOC */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 opacity-50" />
                    <input
                      type="text"
                      value={tocSearch}
                      onChange={(e) => setTocSearch(e.target.value)}
                      placeholder="ابحث داخل عناوين الفهرس..."
                      className={`${inputClass} pr-8`}
                    />
                  </div>

                  {/* Full Book TOC */}
                  <div className="max-h-[520px] overflow-y-auto space-y-0.5 pr-0.5">
                    {tocLoading ? (
                      <div className="py-12 text-center text-xs opacity-70">
                        جاري تحميل فهرس الكتاب...
                      </div>
                    ) : tocError ? (
                      <div className="py-8 text-center text-xs text-rose-400">{tocError}</div>
                    ) : tocNodes.length === 0 ? (
                      <div className="py-8 text-center text-xs opacity-60">
                        لا توجد عناوين بعد لهذا الكتاب.
                      </div>
                    ) : (
                      tocNodes.map((n) => renderAdminTocNode(n, 0, []))
                    )}
                  </div>
                </div>

                {/* Right Editor: Bindings for Selected Heading */}
                <div
                  className={`xl:col-span-6 rounded-3xl border p-4 backdrop-blur-xl space-y-4 ${cardSurface}`}
                >
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-stone-200/70 dark:border-stone-800">
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold opacity-70">العنوان المحدد حاليًا:</div>
                      <h3 className="text-sm font-extrabold leading-snug mt-0.5">
                        {selectedTarget.pathLabel}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowBulkAdd((p) => !p)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border shrink-0 ${
                        showBulkAdd ? activePill : isDark ? 'border-stone-700 hover:bg-stone-800' : 'border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                      <span>إضافة مجموعة متسلسلة</span>
                    </button>
                  </div>

                  {/* Bulk Quick-Add Box */}
                  {showBulkAdd && (
                    <div
                      className={`p-3.5 rounded-2xl border space-y-2.5 ${
                        isDark ? 'bg-stone-950/70 border-stone-700' : 'bg-stone-50 border-stone-200'
                      }`}
                    >
                      <div className="text-xs font-extrabold">
                        إضافة سلسلة منشورات تيليجرام لهذا العنوان دفعة واحدة
                      </div>
                      <input
                        type="url"
                        dir="ltr"
                        value={bulkBaseChannelUrl}
                        onChange={(e) => setBulkBaseChannelUrl(e.target.value)}
                        placeholder="https://t.me/sh_redaa_thabet"
                        className={inputClass}
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold mb-1 opacity-75">من منشور</label>
                          <input
                            type="number"
                            value={bulkStartPost}
                            onChange={(e) => setBulkStartPost(e.target.value)}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold mb-1 opacity-75">إلى منشور</label>
                          <input
                            type="number"
                            value={bulkEndPost}
                            onChange={(e) => setBulkEndPost(e.target.value)}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold mb-1 opacity-75">بداية الترقيم</label>
                          <input
                            type="number"
                            value={bulkStartLecture}
                            onChange={(e) => setBulkStartLecture(e.target.value)}
                            className={inputClass}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={bulkTitlePrefix}
                          onChange={(e) => setBulkTitlePrefix(e.target.value)}
                          placeholder="بادئة العنوان (مثل: الدرس)"
                          className={inputClass}
                        />
                        <select
                          value={bulkType}
                          onChange={(e) => setBulkType(e.target.value as TrackMediaType)}
                          className={inputClass}
                        >
                          <option value="audio">صوتي</option>
                          <option value="video">مرئي</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={handleBulkAddTelegramRange}
                        className={`w-full py-2 rounded-xl text-xs font-bold ${primaryBtn}`}
                      >
                        توليد وإضافة المجموعة
                      </button>
                    </div>
                  )}

                  {/* Add / Edit Single Recording Form */}
                  <form onSubmit={handleSaveRecording} className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold">
                        {editingRecId ? 'تعديل تسجيل' : 'إضافة تسجيل جديد'}
                      </span>
                      {editingRecId && (
                        <button
                          type="button"
                          onClick={resetRecForm}
                          className="inline-flex items-center gap-1 text-[11px] opacity-70 hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                          <span>إلغاء التعديل</span>
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={recTitle}
                      onChange={(e) => setRecTitle(e.target.value)}
                      placeholder="عنوان التسجيل (مثلاً: شرح باب المياه)"
                      className={inputClass}
                    />

                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={recType}
                        onChange={(e) => setRecType(e.target.value as TrackMediaType)}
                        className={inputClass}
                      >
                        <option value="audio">تسجيل صوتي</option>
                        <option value="video">شرح مرئي</option>
                      </select>
                      <input
                        type="number"
                        value={recLectureNum}
                        onChange={(e) => setRecLectureNum(e.target.value)}
                        placeholder="رقم المجلس"
                        className={inputClass}
                      />
                      <input
                        type="text"
                        dir="ltr"
                        value={recDuration}
                        onChange={(e) => setRecDuration(e.target.value)}
                        placeholder="32:09"
                        className={inputClass}
                      />
                    </div>

                    <input
                      type="url"
                      dir="ltr"
                      value={recTelegramUrl}
                      onChange={(e) => setRecTelegramUrl(e.target.value)}
                      placeholder="رابط تيليجرام (اختياري): https://t.me/..."
                      className={inputClass}
                    />

                    <input
                      type="url"
                      dir="ltr"
                      value={recAudioUrl}
                      onChange={(e) => setRecAudioUrl(e.target.value)}
                      placeholder="رابط صوت مباشر MP3/M4A (لتشغيل فوري بالمتصفح)"
                      className={inputClass}
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="url"
                        dir="ltr"
                        value={recYoutubeUrl}
                        onChange={(e) => setRecYoutubeUrl(e.target.value)}
                        placeholder="رابط يوتيوب (اختياري)"
                        className={inputClass}
                      />
                      <input
                        type="url"
                        dir="ltr"
                        value={recVideoUrl}
                        onChange={(e) => setRecVideoUrl(e.target.value)}
                        placeholder="رابط فيديو مباشر (اختياري)"
                        className={inputClass}
                      />
                    </div>

                    <input
                      type="text"
                      value={recNotes}
                      onChange={(e) => setRecNotes(e.target.value)}
                      placeholder="ملاحظة مختصرة للدرس (اختياري)"
                      className={inputClass}
                    />

                    <button
                      type="submit"
                      className={`w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${primaryBtn}`}
                    >
                      {editingRecId ? <Save className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      <span>{editingRecId ? 'حفظ تعديل التسجيل' : 'إضافة للعنوان المحدد'}</span>
                    </button>
                  </form>

                  {/* Current Recordings List on Selected Node */}
                  <div className="pt-2 border-t border-stone-200/70 dark:border-stone-800 space-y-2">
                    <div className="text-xs font-extrabold">
                      التسجيلات المربوطة بهذا العنوان ({currentTargetRecordings.length})
                    </div>

                    {currentTargetRecordings.length === 0 ? (
                      <div className="py-4 text-center text-xs opacity-60">
                        لا توجد تسجيلات مربوطة بهذا العنوان بعد.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto">
                        {currentTargetRecordings.map((rec, idx) => (
                          <div
                            key={rec.id}
                            className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2 ${
                              isDark
                                ? 'bg-stone-950/60 border-stone-800'
                                : 'bg-stone-50 border-stone-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {rec.type === 'video' ? (
                                <Video className="w-4 h-4 text-sky-500 shrink-0" />
                              ) : (
                                <Headphones className="w-4 h-4 text-amber-500 shrink-0" />
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold truncate">{rec.title}</div>
                                <div className="text-[10.5px] opacity-70 truncate" dir="ltr">
                                  {rec.audioUrl || rec.youtubeUrl || rec.videoUrl || rec.telegramUrl || 'بدون رابط'}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveRecording(idx, -1)}
                                className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30"
                                title="تحريك لأعلى"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === currentTargetRecordings.length - 1}
                                onClick={() => handleMoveRecording(idx, 1)}
                                className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30"
                                title="تحريك لأسفل"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEditRecording(rec)}
                                className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
                                title="تعديل"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRecording(rec.id)}
                                className="p-1 rounded text-rose-500 hover:bg-rose-500/10"
                                title="حذف"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {adminTab === 'transcripts' && (
              <div className={`rounded-3xl border p-8 text-center space-y-3 ${cardSurface}`}>
                <FileText className="w-10 h-10 mx-auto text-amber-500" />
                <h2 className="text-lg font-extrabold">محرر تقسيم التفريغات بالفواصل</h2>
                <p className="text-sm opacity-75 max-w-xl mx-auto leading-relaxed">
                  هذا التبويب جاهز للمرحلة الثانية: ستضع هنا نصي ملفّي التفريغ مع علامات الفواصل
                  الخاصة بك، فتُقسّم تلقائيًا وترتبط بعناوين الكتاب ليعمل منها تبويب «التفريغ» والذكاء
                  الاصطناعي (التشجير والاختبارات).
                </p>
              </div>
            )}

            {adminTab === 'ai_plan' && (
              <div className={`rounded-3xl border p-8 text-center space-y-3 ${cardSurface}`}>
                <Sparkles className="w-10 h-10 mx-auto text-emerald-500" />
                <h2 className="text-lg font-extrabold">بنك أسئلة الكتاب وإعدادات خطة المدارسة بالـ AI</h2>
                <p className="text-sm opacity-75 max-w-xl mx-auto leading-relaxed">
                  جاهز للمرحلة الثانية والثالثة لإدارة أسئلة الكتاب (العامة والمخصصة للدروس) وقواعد
                  إنشاء الجدول الزمني المخصص بالذكاء الاصطناعي.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

