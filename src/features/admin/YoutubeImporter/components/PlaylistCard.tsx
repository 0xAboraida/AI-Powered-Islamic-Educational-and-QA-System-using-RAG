import React, { useState } from 'react';
import { ListVideo, DownloadCloud, Loader2, CheckCircle2, GraduationCap, Play, Mic, Eye } from 'lucide-react';
import { getPlaylistItems, getVideosDetails } from '../../../../services/youtube.api';
import { addSeriesToStore } from '../../../lessons/data/store';
import { ExplanationSeries } from '../../../lessons/data/mockData';
import { PlaylistDetailsModal } from './PlaylistDetailsModal';

interface PlaylistCardProps {
  playlist: any;
  scholarId?: string;
  isAlreadyImported?: boolean;
  existingSeries?: ExplanationSeries;
  onImportSuccess?: () => void;
  scholarSavedSeries?: ExplanationSeries[];
  onImportSingleVideo?: (video: any, targetSection: 'visual' | 'standalone' | 'shorts' | 'podcast' | 'course') => void;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({ 
  playlist, 
  scholarId, 
  isAlreadyImported = false,
  existingSeries,
  onImportSuccess,
  scholarSavedSeries = [],
  onImportSingleVideo
}) => {
  const [isImporting, setIsImporting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [targetType, setTargetType] = useState<'visual' | 'course' | 'podcast' | 'standalone' | 'shorts'>('visual');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const title = playlist.snippet?.title || 'بدون عنوان';
  const itemCount = playlist.contentDetails?.itemCount || 0;
  
  // Use medium thumbnail if available, else default, else standard
  const thumbnail = 
    playlist.snippet?.thumbnails?.medium?.url || 
    playlist.snippet?.thumbnails?.default?.url || 
    '';

  const handleUpdateExistingType = (newType: 'visual' | 'course' | 'podcast' | 'standalone' | 'shorts') => {
    if (!existingSeries) return;
    addSeriesToStore({
      ...existingSeries,
      type: newType,
    });
    onImportSuccess?.();
  };

  const handleImport = async (chosenType: 'visual' | 'course' | 'podcast' | 'standalone' | 'shorts' = targetType) => {
    if (isImporting || isSuccess) return;
    
    setIsImporting(true);
    setError('');

    try {
      // 1. Fetch all items in this playlist
      console.log(`[1] Fetching items for playlist: ${title}`);
      const playlistItems = await getPlaylistItems(playlist.id);
      
      const videoIds = playlistItems
        .map((item: any) => item.contentDetails?.videoId)
        .filter(Boolean);
        
      console.log(`[2] Found ${videoIds.length} videos. Fetching detailed stats...`);

      // 2. Fetch comprehensive details for all videos
      const videosDetails = await getVideosDetails(videoIds);

      // 3. Save locally to display it in the User UI
      addSeriesToStore({
        id: playlist.id,
        scholarId: scholarId || 'unknown',
        title: title,
        thumbnail: thumbnail,
        description: playlist.snippet?.description || '',
        videoCount: itemCount,
        type: chosenType,
        url: `https://youtube.com/playlist?list=${playlist.id}`,
        videos: videosDetails.map((video: any) => ({
          id: video.id,
          title: video.snippet?.title || '',
          thumbnail: video.snippet?.thumbnails?.medium?.url || video.snippet?.thumbnails?.default?.url || '',
          duration: video.contentDetails?.duration,
          publishedAt: video.snippet?.publishedAt,
        }))
      });

      onImportSuccess?.();
      setIsSuccess(true);
      
      // Reset success state after a few seconds
      setTimeout(() => setIsSuccess(false), 3000);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'فشل الاستيراد');
    } finally {
      setIsImporting(false);
    }
  };

  const isCompleted = isAlreadyImported || isSuccess;

  return (
    <div className={`rounded-2xl overflow-hidden border transition-all group flex flex-col justify-between ${
      isCompleted
        ? 'bg-neutral-950/90 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.08)]'
        : 'bg-neutral-950/80 border-neutral-800/80 hover:border-neutral-700'
    }`}>
      <div>
        <div 
          onClick={() => setIsDetailsOpen(true)}
          className="relative aspect-video bg-neutral-900 overflow-hidden cursor-pointer group/thumb"
          title="انقر لاستعراض فيديوهات القائمة وإضافة أي مقطع"
        >
          <img 
            src={thumbnail} 
            alt={title}
            className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300" 
          />
          <div className="absolute inset-0 bg-black/20 group-hover/thumb:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover/thumb:opacity-100">
            <span className="bg-black/90 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/20 flex items-center gap-1.5 shadow-xl backdrop-blur-sm scale-95 group-hover/thumb:scale-100 transition-transform">
              <Eye size={14} className="text-amber-400" />
              <span>استعراض الفيديوهات ({itemCount})</span>
            </span>
          </div>
          
          {/* Imported Badge with Current Type */}
          {isCompleted && (
            <div className="absolute top-2.5 right-2.5 bg-emerald-500 text-black px-2.5 py-1 rounded-md text-[11px] font-extrabold flex items-center gap-1 shadow-lg">
              <CheckCircle2 size={13} />
              <span>
                {existingSeries?.type === 'course' 
                  ? 'دورة حالية 🎓' 
                  : existingSeries?.type === 'podcast' 
                  ? 'بودكاست 🎙️' 
                  : 'مستوردة بالفعل'}
              </span>
            </div>
          )}

          <div className="absolute bottom-2.5 right-2.5 bg-black/85 px-2 py-0.5 rounded text-[10px] font-bold text-white flex items-center gap-1 border border-white/10">
            <ListVideo className="w-3 h-3" />
            <span>{itemCount} مقطع</span>
          </div>
        </div>
        
        <div className="p-4">
          <h4 
            onClick={() => setIsDetailsOpen(true)}
            className="font-bold text-sm text-white mb-1.5 line-clamp-2 leading-snug cursor-pointer hover:text-amber-400 transition-colors" 
            title="انقر لاستعراض فيديوهات القائمة وإضافة مقاطع فردية"
          >
            {title}
          </h4>
          <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
            {playlist.snippet?.description || 'قائمة تشغيل من يوتيوب.'}
          </p>
          {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        </div>
      </div>
      
      {/* Actions */}
      {existingSeries ? (
        <div className="p-4 pt-0 space-y-2.5">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-emerald-400 font-bold flex items-center gap-1.5 text-xs">
              <CheckCircle2 size={14} />
              <span>
                مضافة في: {existingSeries.type === 'course' 
                  ? 'الدورات الحالية 🎓' 
                  : existingSeries.type === 'podcast' 
                  ? 'بودكاست 🎙️' 
                  : 'شروحات مرئية 🎥'}
              </span>
            </span>
          </div>

          {/* Quick Transfer Selector */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="text-[10px] text-neutral-400 font-bold shrink-0">نقل إلى:</span>
            <select
              value={existingSeries.type || 'visual'}
              onChange={(e) => handleUpdateExistingType(e.target.value as any)}
              className="flex-1 bg-neutral-900 border border-neutral-800 text-white text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-white transition-colors cursor-pointer"
            >
              <option value="visual">🎥 شروحات مرئية</option>
              <option value="standalone">🎞️ محاضرات ومقاطع عامة</option>
              <option value="shorts">📱 مقاطع قصيرة</option>
              <option value="podcast">🎙️ بودكاست</option>
              <option value="course">🎓 دورات حالية</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsDetailsOpen(true)}
            className="w-full py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Eye size={13} className="text-amber-400" />
            <span>استعراض فيديوهات القائمة ({itemCount})</span>
          </button>
        </div>
      ) : (
        <div className="p-4 pt-0 space-y-2.5">
          {/* Browse Videos Button */}
          <button
            type="button"
            onClick={() => setIsDetailsOpen(true)}
            className="w-full py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Eye size={13} className="text-amber-400" />
            <span>استعراض وفحص الفيديوهات ({itemCount})</span>
          </button>

          {/* Section Target Selector */}
          <div className="flex items-center gap-1 bg-neutral-900/90 p-1 rounded-xl border border-neutral-800 flex-wrap">
            <button
              type="button"
              onClick={() => setTargetType('visual')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                targetType === 'visual' ? 'bg-white text-black shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Play size={10} fill="currentColor" />
              <span>مرئية</span>
            </button>
            <button
              type="button"
              onClick={() => setTargetType('standalone')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                targetType === 'standalone' ? 'bg-emerald-500 text-black shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>عامة</span>
            </button>
            <button
              type="button"
              onClick={() => setTargetType('shorts')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                targetType === 'shorts' ? 'bg-rose-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>قصيرة</span>
            </button>
            <button
              type="button"
              onClick={() => setTargetType('podcast')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                targetType === 'podcast' ? 'bg-purple-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Mic size={10} />
              <span>بودكاست</span>
            </button>
            <button
              type="button"
              onClick={() => setTargetType('course')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                targetType === 'course' ? 'bg-amber-500 text-black shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <GraduationCap size={11} />
              <span>دورات</span>
            </button>
          </div>

          <button
            onClick={() => handleImport(targetType)}
            disabled={isImporting}
            className={`w-full py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-all shadow-sm ${
              targetType === 'course'
                ? 'bg-amber-500 hover:bg-amber-400 text-black'
                : targetType === 'podcast'
                ? 'bg-purple-600 hover:bg-purple-500 text-white'
                : targetType === 'standalone'
                ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                : targetType === 'shorts'
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-white hover:bg-neutral-200 text-black'
            }`}
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري استيراد الفيديوهات...</span>
              </>
            ) : (
              <>
                <DownloadCloud className="w-4 h-4" />
                <span>
                  استيراد كـ {
                    targetType === 'course' ? 'دورة حالية 🎓' :
                    targetType === 'podcast' ? 'بودكاست 🎙️' :
                    targetType === 'standalone' ? 'محاضرات عامة 🎞️' :
                    targetType === 'shorts' ? 'مقاطع قصيرة 📱' :
                    'شرح مرئي 🎥'
                  }
                </span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Playlist Videos & Individual Importer Modal */}
      <PlaylistDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        playlist={playlist}
        scholarId={scholarId || ''}
        scholarSavedSeries={scholarSavedSeries}
        onImportSingleVideo={(video, section) => {
          if (onImportSingleVideo) {
            onImportSingleVideo(video, section);
          } else if (scholarId) {
            addSeriesToStore({
              id: `yt_${video.id}`,
              scholarId,
              title: video.title,
              thumbnail: video.thumbnail,
              description: video.description || '',
              videoCount: 1,
              type: section,
              source: 'youtube',
              url: `https://youtube.com/watch?v=${video.id}`,
              videos: [{
                id: video.id,
                title: video.title,
                thumbnail: video.thumbnail,
                duration: video.duration,
                publishedAt: video.publishedAt,
                source: 'youtube'
              }]
            });
            onImportSuccess?.();
          }
        }}
        onImportEntirePlaylist={(pl, chosenType) => {
          handleImport(chosenType);
        }}
      />
    </div>
  );
};
