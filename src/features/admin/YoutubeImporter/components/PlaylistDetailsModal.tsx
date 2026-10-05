import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Loader2, 
  ListVideo, 
  Plus, 
  CheckCircle2, 
  Film, 
  Smartphone, 
  Mic, 
  Video, 
  GraduationCap, 
  Search, 
  ExternalLink,
  Download,
  CheckSquare,
  Square,
  ArrowDown
} from 'lucide-react';
import { getPlaylistVideosDetailedPaged } from '../../../../services/youtube.api';
import { ExplanationSeries } from '../../../lessons/data/mockData';

interface PlaylistDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: any;
  scholarId: string;
  scholarSavedSeries: ExplanationSeries[];
  onImportSingleVideo: (video: any, targetSection: 'visual' | 'standalone' | 'shorts' | 'podcast' | 'course') => void;
  onImportEntirePlaylist?: (playlist: any, targetSection: 'visual' | 'course' | 'podcast' | 'standalone' | 'shorts') => void;
}

const formatDuration = (duration?: string) => {
  if (!duration) return '';
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  const hours = match[1] ? `${match[1]}:` : '';
  const minutes = match[2] ? (match[1] ? match[2].padStart(2, '0') : match[2]) : '0';
  const seconds = match[3] ? match[3].padStart(2, '0') : '00';
  return `${hours}${minutes}:${seconds}`;
};

export const PlaylistDetailsModal: React.FC<PlaylistDetailsModalProps> = ({
  isOpen,
  onClose,
  playlist,
  scholarId,
  scholarSavedSeries,
  onImportSingleVideo,
  onImportEntirePlaylist
}) => {
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(new Set());
  const [batchTargetSection, setBatchTargetSection] = useState<'standalone' | 'shorts' | 'visual' | 'podcast' | 'course'>('standalone');
  const [entirePlaylistTarget, setEntirePlaylistTarget] = useState<'visual' | 'course' | 'podcast'>('visual');

  const [nextPageToken, setNextPageToken] = useState<string>('');
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const modalSentinelRef = useRef<HTMLDivElement>(null);

  const playlistTitle = playlist?.snippet?.title || playlist?.title || 'قائمة التشغيل';
  const playlistThumbnail = 
    playlist?.snippet?.thumbnails?.high?.url || 
    playlist?.snippet?.thumbnails?.medium?.url || 
    playlist?.thumbnail || 
    '';
  const itemCount = playlist?.contentDetails?.itemCount || playlist?.videoCount || 0;

  useEffect(() => {
    if (!isOpen || !playlist?.id) return;
    setIsLoading(true);
    setError('');
    setSelectedVideoIds(new Set());
    setNextPageToken('');
    setHasMore(false);
    
    getPlaylistVideosDetailedPaged(playlist.id, undefined, 50)
      .then(page => {
        setVideos(page.items);
        setNextPageToken(page.nextPageToken || '');
        setHasMore(page.hasMore);
      })
      .catch(err => {
        console.error(err);
        setError('تعذر تحميل فيديوهات هذه القائمة. تأكد من أن القائمة عامة على YouTube.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen, playlist?.id]);

  const loadMoreVideos = async () => {
    if (!playlist?.id || isLoadingMore || !hasMore || !nextPageToken) return;
    setIsLoadingMore(true);
    try {
      const page = await getPlaylistVideosDetailedPaged(playlist.id, nextPageToken, 50);
      setVideos(prev => {
        const existingIds = new Set(prev.map(v => v.id));
        const filteredNew = page.items.filter((v: any) => !existingIds.has(v.id));
        return [...prev, ...filteredNew];
      });
      setNextPageToken(page.nextPageToken || '');
      setHasMore(page.hasMore);
    } catch (err) {
      console.error('Failed to load more playlist videos:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    const sentinel = modalSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && hasMore) {
          loadMoreVideos();
        }
      },
      { threshold: 0.1, rootMargin: '250px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, nextPageToken, playlist?.id]);

  if (!isOpen || !playlist) return null;

  const filteredVideos = videos.filter(v => 
    v.title.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const toggleSelectVideo = (id: string) => {
    setSelectedVideoIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedVideoIds.size === filteredVideos.length) {
      setSelectedVideoIds(new Set());
    } else {
      setSelectedVideoIds(new Set(filteredVideos.map(v => v.id)));
    }
  };

  const handleBatchImportSelected = () => {
    const selected = videos.filter(v => selectedVideoIds.has(v.id));
    selected.forEach(v => {
      onImportSingleVideo(v, batchTargetSection);
    });
    setSelectedVideoIds(new Set());
  };

  const getSectionLabel = (type: string) => {
    switch (type) {
      case 'visual': return 'الشروحات المرئية';
      case 'standalone': return 'المحاضرات العامة';
      case 'shorts': return 'المقاطع القصيرة';
      case 'podcast': return 'البودكاست';
      case 'course': return 'الدورات الحالية';
      default: return type;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6" dir="rtl">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative w-full max-w-5xl bg-neutral-950 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10 text-white"
        >
          {/* Header Banner */}
          <div className="p-5 sm:p-6 border-b border-neutral-800 bg-neutral-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-4 min-w-0">
              {playlistThumbnail && (
                <img
                  src={playlistThumbnail}
                  alt={playlistTitle}
                  className="w-16 h-12 sm:w-20 sm:h-14 rounded-xl object-cover border border-neutral-700 shrink-0 shadow-md"
                />
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] bg-red-600/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <ListVideo size={11} />
                    <span>محتويات القائمة</span>
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">
                    ({videos.length} مقطع متوفر)
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white line-clamp-1" title={playlistTitle}>
                  {playlistTitle}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              {onImportEntirePlaylist && (
                <div className="flex items-center gap-1.5 bg-neutral-950 p-1.5 rounded-2xl border border-neutral-800 text-xs">
                  <select
                    value={entirePlaylistTarget}
                    onChange={(e) => setEntirePlaylistTarget(e.target.value as any)}
                    className="bg-transparent text-white text-xs px-2 py-1 rounded-xl focus:outline-none"
                  >
                    <option value="visual">🎥 كسلسلة مرئية</option>
                    <option value="course">🎓 كدورة حالية</option>
                    <option value="podcast">🎙️ كبودكاست</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => onImportEntirePlaylist(playlist, entirePlaylistTarget)}
                    className="px-3.5 py-1.5 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Download size={13} />
                    <span>استيراد القائمة بالكامل</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors border border-neutral-800 shrink-0"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Sub Toolbar: Search inside playlist + Batch select actions */}
          <div className="p-3 sm:px-6 bg-neutral-950 border-b border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="بحث عن درس أو مقطع داخل هذه القائمة..."
                className="w-full bg-neutral-900 border border-neutral-800 text-white px-3.5 py-2 pr-9 rounded-xl text-xs focus:outline-none focus:border-white transition-colors"
              />
              <Search size={14} className="absolute right-3 top-2.5 text-neutral-500" />
            </div>

            {/* Batch Import Bar for Selected Videos */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={selectAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-bold transition-all border border-neutral-800"
              >
                {selectedVideoIds.size === filteredVideos.length && filteredVideos.length > 0 ? (
                  <CheckSquare size={14} className="text-amber-400" />
                ) : (
                  <Square size={14} />
                )}
                <span>تحديد الكل ({filteredVideos.length})</span>
              </button>

              {selectedVideoIds.size > 0 && (
                <div className="flex items-center gap-2 bg-neutral-900/90 p-1 rounded-xl border border-neutral-700">
                  <span className="text-xs text-amber-400 font-bold px-2">
                    {selectedVideoIds.size} محدد
                  </span>
                  <select
                    value={batchTargetSection}
                    onChange={(e) => setBatchTargetSection(e.target.value as any)}
                    className="bg-neutral-950 border border-neutral-800 text-white text-xs font-bold rounded-lg px-2 py-1 focus:outline-none"
                  >
                    <option value="standalone">🎞️ إلى: محاضرات عامة</option>
                    <option value="shorts">📱 إلى: مقاطع قصيرة</option>
                    <option value="podcast">🎙️ إلى: بودكاست</option>
                    <option value="visual">🎥 إلى: شروحات مرئية</option>
                    <option value="course">🎓 إلى: دورات حالية</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleBatchImportSelected}
                    className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold rounded-lg transition-all shadow-sm flex items-center gap-1"
                  >
                    <Plus size={13} />
                    <span>إضافة المحددة</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Videos Grid / List Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 scrollbar-thin scrollbar-thumb-neutral-800">
            {isLoading ? (
              <div className="py-24 text-center text-neutral-400 flex flex-col items-center justify-center gap-3">
                <Loader2 size={32} className="animate-spin text-red-500" />
                <span className="text-xs font-bold text-neutral-300">جاري فحص وجلب فيديوهات القائمة بالكامل...</span>
              </div>
            ) : error ? (
              <div className="py-16 text-center text-red-400 text-xs border border-dashed border-red-500/20 rounded-2xl p-6 bg-red-500/5">
                <p className="font-bold mb-2">{error}</p>
                <button
                  type="button"
                  onClick={() => {
                    setIsLoading(true);
                    getPlaylistVideosDetailedPaged(playlist.id, undefined, 50)
                      .then(page => {
                        setVideos(page.items);
                        setNextPageToken(page.nextPageToken || '');
                        setHasMore(page.hasMore);
                      })
                      .finally(() => setIsLoading(false));
                  }}
                  className="px-4 py-1.5 bg-neutral-900 border border-neutral-700 text-white text-xs rounded-xl hover:bg-neutral-800 font-bold"
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : filteredVideos.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredVideos.map((video, idx) => {
                  const isImported = scholarSavedSeries.find(s => 
                    s.id === `yt_${video.id}` || 
                    s.id === video.id || 
                    s.url?.includes(video.id)
                  );
                  const isSelected = selectedVideoIds.has(video.id);

                  return (
                    <div
                      key={video.id}
                      className={`p-3 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'bg-neutral-900/90 border-amber-500/50 shadow-md'
                          : isImported
                          ? 'bg-neutral-950/70 border-emerald-500/30'
                          : 'bg-neutral-950/90 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox for batch */}
                        <button
                          type="button"
                          onClick={() => toggleSelectVideo(video.id)}
                          className="mt-1 text-neutral-400 hover:text-white shrink-0"
                        >
                          {isSelected ? (
                            <CheckSquare size={16} className="text-amber-400" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>

                        {/* Thumbnail with duration */}
                        <div className="relative w-28 sm:w-32 aspect-video bg-neutral-900 rounded-xl overflow-hidden shrink-0">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                          {video.isShort ? (
                            <span className="absolute top-1 right-1 bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                              Shorts
                            </span>
                          ) : null}
                          {video.duration && (
                            <span className="absolute bottom-1 right-1 bg-black/85 text-[9px] font-mono text-neutral-300 px-1.5 py-0.5 rounded">
                              {formatDuration(video.duration)}
                            </span>
                          )}
                        </div>

                        {/* Title and metadata */}
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] text-neutral-500 font-mono mb-0.5 block">
                            #{idx + 1}
                          </span>
                          <h4 className="text-xs font-bold text-white line-clamp-2 leading-relaxed" title={video.title}>
                            {video.title}
                          </h4>
                          {video.publishedAt && (
                            <span className="text-[10px] text-neutral-500 mt-1 block">
                              {new Date(video.publishedAt).toLocaleDateString('ar-EG')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Bar for this video */}
                      <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                        {isImported ? (
                          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
                            <CheckCircle2 size={13} />
                            <span>مضاف كـ {getSectionLabel(isImported.type)}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 w-full">
                            {/* Primary quick add button */}
                            <button
                              type="button"
                              onClick={() => onImportSingleVideo(video, video.isShort ? 'shorts' : 'standalone')}
                              className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                                video.isShort 
                                  ? 'bg-rose-600 hover:bg-rose-500 text-white' 
                                  : 'bg-white hover:bg-neutral-200 text-black'
                              }`}
                            >
                              <Plus size={13} />
                              <span>{video.isShort ? 'إضافة كمقطع قصير 📱' : 'إضافة كمحاضرة عامة 🎞️'}</span>
                            </button>

                            {/* Flexible dropdown selector for ANY other section */}
                            <div className="relative shrink-0">
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    onImportSingleVideo(video, e.target.value as any);
                                    e.target.value = '';
                                  }
                                }}
                                defaultValue=""
                                className="bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300 rounded-xl px-2 py-1.5 focus:outline-none focus:border-white font-bold cursor-pointer"
                                title="إضافة إلى قسم مخصص"
                              >
                                <option value="" disabled>إضافة كـ...</option>
                                <option value="standalone">🎞️ محاضرات عامة</option>
                                <option value="shorts">📱 مقاطع قصيرة</option>
                                <option value="podcast">🎙️ بودكاست</option>
                                <option value="visual">🎥 شروحات مرئية</option>
                                <option value="course">🎓 دورات حالية</option>
                              </select>
                            </div>
                          </div>
                        )}

                        <a
                          href={`https://youtube.com/watch?v=${video.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-neutral-500 hover:text-white transition-colors shrink-0"
                          title="مشاهدة على يوتيوب"
                        >
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sentinel for Infinite Scroll */}
              {filteredVideos.length > 0 && !searchFilter && (
                <div ref={modalSentinelRef} className="py-4 flex flex-col items-center justify-center">
                  {isLoadingMore ? (
                    <div className="flex items-center gap-2 text-xs text-neutral-400 bg-neutral-900/80 px-4 py-2 rounded-xl border border-neutral-800">
                      <Loader2 size={14} className="animate-spin text-amber-400" />
                      <span>جاري جلب المزيد من فيديوهات القائمة تلقائياً... ⚡</span>
                    </div>
                  ) : hasMore ? (
                    <button
                      type="button"
                      onClick={loadMoreVideos}
                      className="text-xs text-neutral-400 hover:text-white px-3.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all flex items-center gap-1.5"
                    >
                      <ArrowDown size={13} className="text-amber-400 animate-bounce" />
                      <span>مرر لأسفل للتحميل التلقائي (أو اضغط هنا)</span>
                    </button>
                  ) : (
                    <div className="text-[11px] text-neutral-500 flex items-center gap-1">
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      <span>تم استعراض جميع فيديوهات هذه القائمة ({videos.length} مقطع)</span>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
              <div className="py-16 text-center text-neutral-500 text-xs border border-dashed border-neutral-800 rounded-3xl">
                لم يتم العثور على فيديوهات مطابقة للبحث داخل هذه القائمة.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between text-xs text-neutral-400">
            <div>
              يمكنك اختيار أي فيديو وإضافته فوراً لأي قسم في بروفايل الشيخ.
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold transition-colors"
            >
              إغلاق
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
