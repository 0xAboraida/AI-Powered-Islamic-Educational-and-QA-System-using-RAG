import React, { useState, useEffect, useMemo } from 'react';
import { ExplanationSeries, VideoItem, ChapterItem } from './data/mockData';
import { getScholars, getSeries, addSeriesToStore } from './data/store';
import { getPlaylistItems, getVideosDetails, parseTimestampsFromText } from '../../services/youtube.api';
import { getCompletedLessons, toggleLessonCompleted } from './data/commentsStore';
import { SeriesCommentsTab } from './components/SeriesCommentsTab';
import {
  ArrowRight,
  ArrowLeft,
  Video,
  Headphones,
  BookOpen,
  GraduationCap,
  Play,
  ExternalLink,
  X,
  ListVideo,
  Search,
  Loader2,
  Clock,
  Sparkles,
  MessageSquare,
  Info,
  CheckCircle2,
  Maximize2,
  Minimize2,
  ChevronRight,
  ChevronLeft,
  Send,
  Layers,
  FileText,
  Mic,
  Film,
  Smartphone
} from 'lucide-react';
import IslamicPattern from '../knowledge/components/IslamicPattern';
import { ScholarAvatar } from '../../components/common/ScholarAvatar';
import { TelegramPlayer } from '../../components/common/TelegramPlayer';
import { extractVideoIdFromUrl } from '../../services/youtube.api';

type TabType = 'curated' | 'visual' | 'standalone' | 'shorts' | 'podcast' | 'audio' | 'book' | 'course';
type DrawerTabType = 'episodes' | 'comments' | 'about';

// Helper to format ISO 8601 duration (e.g., PT15M33S -> 15:33)
const formatDuration = (duration?: string) => {
  if (!duration) return '';
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  const hours = match[1] ? `${match[1]}:` : '';
  const minutes = match[2] ? (match[1] ? match[2].padStart(2, '0') : match[2]) : '0';
  const seconds = match[3] ? match[3].padStart(2, '0') : '00';
  return `${hours}${minutes}:${seconds}`;
};

export const ScholarProfilePage = ({ scholarId, onBack }: { scholarId: string, onBack: () => void }) => {
  const scholar = getScholars().find(s => s.id === scholarId);
  const series = getSeries().filter(s => s.scholarId === scholarId);
  const hasCurated = series.some(s => s.type === 'curated' || s.isCurated);

  const [activeTab, setActiveTab] = useState<TabType>(hasCurated ? 'curated' : 'visual');
  const [selectedSeries, setSelectedSeries] = useState<ExplanationSeries | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [activeTimestampSeconds, setActiveTimestampSeconds] = useState<number | null>(null);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [videoSearchQuery, setVideoSearchQuery] = useState('');
  const [drawerTab, setDrawerTab] = useState<DrawerTabType>('episodes');
  const [isExpanded, setIsExpanded] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  useEffect(() => {
    if (selectedSeries) {
      setCompletedLessons(getCompletedLessons(selectedSeries.id));
    }
  }, [selectedSeries?.id]);

  if (!scholar) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <h2 className="text-2xl font-bold mb-4">لم يتم العثور على الشيخ المطلوب</h2>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200 hover:text-white transition-all text-sm font-medium"
        >
          <ArrowRight size={18} />
          <span>العودة لدليل الشيوخ</span>
        </button>
      </div>
    );
  }

  const activeSeries = series.filter(s => {
    if (activeTab === 'curated') {
      return s.type === 'curated' || s.isCurated;
    }
    return s.type === activeTab && !s.isCurated;
  });

  const tabs = [
    { id: 'curated', label: 'سلاسل مجمعة ', icon: Layers },
    { id: 'visual', label: 'شروحات مرئية', icon: Video },
    { id: 'standalone', label: 'محاضرات ومقاطع عامة', icon: Film },
    { id: 'shorts', label: 'المقاطع القصيرة', icon: Smartphone },
    { id: 'podcast', label: 'بودكاست', icon: Mic },
    { id: 'audio', label: 'شروحات صوتية', icon: Headphones },
    { id: 'book', label: 'كتب ومصنفات', icon: BookOpen },
    { id: 'course', label: 'دورات حالية', icon: GraduationCap },
  ] as const;

  // Open series in left slide-over drawer and fetch videos if missing
  const handleOpenSeries = async (item: ExplanationSeries) => {
    setSelectedSeries(item);
    setVideoSearchQuery('');
    setDrawerTab('episodes');

    if (item.videos && item.videos.length > 0) {
      setActiveVideoId(item.videos[0].id);
      return;
    }

    // If it's a Telegram item with a URL, create a synthetic episode item so it can play in-app
    if (item.source === 'telegram' || item.url?.includes('t.me')) {
      const synthVideo: VideoItem = {
        id: item.id,
        title: item.title,
        thumbnail: item.thumbnail,
        url: item.url,
        directUrl: item.url,
        source: 'telegram'
      };
      const updatedSeries: ExplanationSeries = {
        ...item,
        videos: [synthVideo]
      };
      setSelectedSeries(updatedSeries);
      setActiveVideoId(item.id);
      return;
    }

    // If it's a standalone video, shorts, or single video with a YouTube URL, synthesize the single video
    if (item.type === 'standalone' || item.type === 'shorts' || (item.url?.includes('watch?v=') || item.url?.includes('youtu.be/'))) {
      const vidId = extractVideoIdFromUrl(item.url) || item.id.replace('yt_', '');
      const synthVideo: VideoItem = {
        id: vidId,
        title: item.title,
        thumbnail: item.thumbnail,
        url: item.url,
        source: 'youtube'
      };
      const updatedSeries: ExplanationSeries = {
        ...item,
        videos: [synthVideo]
      };
      setSelectedSeries(updatedSeries);
      setActiveVideoId(vidId);
      return;
    }

    setActiveVideoId(null);
    setIsLoadingVideos(true);

    try {
      const playlistItems = await getPlaylistItems(item.id);
      const videoIds = playlistItems
        .map((pi: any) => pi.contentDetails?.videoId)
        .filter(Boolean);

      if (videoIds.length > 0) {
        const details = await getVideosDetails(videoIds);
        const formattedVideos: VideoItem[] = details.map((v: any) => ({
          id: v.id,
          title: v.snippet?.title || '',
          thumbnail: v.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.default?.url || '',
          duration: v.contentDetails?.duration,
          publishedAt: v.snippet?.publishedAt,
        }));

        const updatedSeries: ExplanationSeries = {
          ...item,
          videos: formattedVideos,
        };
        setSelectedSeries(updatedSeries);
        setActiveVideoId(formattedVideos[0]?.id || null);
        addSeriesToStore(updatedSeries);
      }
    } catch (err) {
      console.error('Failed to load playlist videos:', err);
    } finally {
      setIsLoadingVideos(false);
    }
  };

  const handleCloseDrawer = () => {
    setSelectedSeries(null);
    setActiveVideoId(null);
    setActiveTimestampSeconds(null);
    setVideoSearchQuery('');
    setIsExpanded(false);
  };

  const handleSelectVideo = (vidId: string) => {
    setActiveVideoId(vidId);
    setActiveTimestampSeconds(null);
  };

  const handleToggleCompleted = (e: React.MouseEvent, vidId: string) => {
    e.stopPropagation();
    if (!selectedSeries) return;
    const updated = toggleLessonCompleted(selectedSeries.id, vidId);
    setCompletedLessons(updated);
  };

  const filteredVideos = (selectedSeries?.videos || []).filter(v =>
    v.title.toLowerCase().includes(videoSearchQuery.toLowerCase())
  );

  const currentIndex = selectedSeries?.videos?.findIndex(v => v.id === activeVideoId) ?? -1;
  const activeVideo = selectedSeries?.videos?.[currentIndex] || null;

  const activeChapters: ChapterItem[] = useMemo(() => {
    if (!activeVideo) return [];
    if (activeVideo.chapters && activeVideo.chapters.length > 0) {
      return activeVideo.chapters;
    }
    if (activeVideo.description) {
      return parseTimestampsFromText(activeVideo.description);
    }
    return [];
  }, [activeVideo]);

  const handlePrevLesson = () => {
    if (selectedSeries?.videos && currentIndex > 0) {
      handleSelectVideo(selectedSeries.videos[currentIndex - 1].id);
    }
  };

  const handleNextLesson = () => {
    if (selectedSeries?.videos && currentIndex < selectedSeries.videos.length - 1) {
      handleSelectVideo(selectedSeries.videos[currentIndex + 1].id);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col" dir="rtl">
      {/* Authentic Islamic Geometric Pattern in Subtle White */}
      <IslamicPattern className="text-white pointer-events-none" opacity={0.06} />

      {/* Top Navbar / Header with Back Button */}
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-neutral-800/80 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800 transition-all text-neutral-300 hover:text-white text-sm font-medium"
          >
            <ArrowRight size={18} />
            <span>العودة لدليل الشيوخ</span>
          </button>

          <span className="text-xs font-semibold text-neutral-400 bg-neutral-900/90 px-3 py-1.5 rounded-full border border-neutral-800">
            بروفايل الشيخ والشارح
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative pt-12 pb-10 border-b border-neutral-800/80">
        <div className="max-w-6xl mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center gap-8">
          {/* Scholar Avatar Frame (Dark/White Silver Rim) */}
          <div className="w-36 h-36 shrink-0 rounded-full p-1 bg-gradient-to-b from-neutral-500 to-neutral-800 shadow-2xl">
            <div className="w-full h-full rounded-full overflow-hidden bg-black border border-neutral-800">
              <ScholarAvatar src={scholar.avatar} name={scholar.name} />
            </div>
          </div>

          {/* Scholar Info */}
          <div className="text-center md:text-right flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mb-2">
              <h1 className="font-display text-3xl md:text-5xl font-bold text-white tracking-tight">
                {scholar.name}
              </h1>
              {scholar.specialty && (
                <span className="text-xs bg-neutral-900 border border-neutral-800 text-neutral-300 px-3 py-1 rounded-full font-medium">
                  {scholar.specialty}
                </span>
              )}
            </div>

            <p className="text-neutral-400 text-base md:text-lg leading-relaxed max-w-3xl mb-4">
              {scholar.bio || 'لا توجد نبذة تعريفية متاحة حالياً.'}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              {scholar.youtubeUrl && (
                <a
                  href={scholar.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-medium text-neutral-300 hover:text-white hover:border-neutral-700 transition-all"
                >
                  <Play size={12} className="text-red-500" fill="currentColor" />
                  <span>قناة YouTube الرسمية</span>
                  <ExternalLink size={11} />
                </a>
              )}

              {scholar.socialLinks?.telegram && (
                <a
                  href={scholar.socialLinks.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-medium text-sky-400 hover:text-sky-300 hover:border-sky-500/40 transition-all"
                >
                  <Send size={12} />
                  <span>قناة Telegram الرسمية</span>
                  <ExternalLink size={11} />
                </a>
              )}

              {scholar.socialLinks?.website && (
                <a
                  href={scholar.socialLinks.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/40 transition-all"
                >
                  <span>الموقع الرسمي</span>
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <main className="max-w-6xl w-full mx-auto px-6 mt-8 flex-1">
        <div className="flex flex-wrap items-center gap-3 border-b border-neutral-800 pb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const count = tab.id === 'curated'
              ? series.filter(s => s.type === 'curated' || s.isCurated).length
              : series.filter(s => s.type === tab.id && !s.isCurated).length;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2.5 px-6 py-4 border-b-2 transition-all font-semibold text-sm ${isActive
                  ? 'border-white text-white bg-white/[0.06] rounded-t-xl'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.02]'
                  }`}
              >
                <Icon size={17} className={isActive ? 'text-white' : 'text-neutral-400'} />
                <span>{tab.label}</span>
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${isActive ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-400'
                    }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Playlists & Series Content */}
        <div className="py-10">
          {activeSeries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeSeries.map((item) => {
                const isSelected = selectedSeries?.id === item.id;
                const isTelegram = item.source === 'telegram' || item.url?.includes('t.me');
                const isBook = item.type === 'book' || item.source === 'pdf';
                const isAudio = item.type === 'audio';
                const isStandalone = item.type === 'standalone';
                const isShorts = item.type === 'shorts';

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.isCurated || (item.videos && item.videos.length > 0)) {
                        handleOpenSeries(item);
                      } else if (isTelegram) {
                        handleOpenSeries(item);
                      } else if (isBook) {
                        window.open(item.url, '_blank');
                      } else {
                        handleOpenSeries(item);
                      }
                    }}
                    className={`group flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 cursor-pointer ${isSelected
                      ? 'bg-neutral-900/90 border-2 border-white shadow-[0_0_30px_rgba(255,255,255,0.15)]'
                      : 'bg-neutral-950/80 border border-neutral-800/80 hover:bg-neutral-900/80 hover:border-neutral-600 hover:shadow-[0_12px_40px_rgba(0,0,0,0.8)]'
                      }`}
                  >
                    <div className="relative aspect-video bg-neutral-900 overflow-hidden">
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/90 text-black flex items-center justify-center shadow-2xl opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all">
                          {isTelegram ? (
                            <Send size={18} className="text-sky-600 mr-0.5" />
                          ) : isBook ? (
                            <BookOpen size={18} className="text-emerald-700" />
                          ) : (
                            <Play size={20} fill="currentColor" className="mr-0.5" />
                          )}
                        </div>
                      </div>

                      {/* Source and Curated badges (Omitted for standalone & shorts) */}
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 flex-wrap">
                        {item.isCurated && (
                          <span className="bg-amber-500/95 text-black px-2 py-0.5 rounded-md text-[10px] font-extrabold flex items-center gap-1 shadow-sm">
                            <Layers size={10} />
                            <span>سلسلة مجمعة </span>
                          </span>
                        )}
                        {!isStandalone && !isShorts && (
                          item.type === 'podcast' ? (
                            <span className="bg-purple-600/90 backdrop-blur-md px-2.5 py-0.5 rounded-md text-[11px] font-bold text-white flex items-center gap-1 shadow-sm">
                              <Mic size={11} />
                              <span>بودكاست</span>
                            </span>
                          ) : isTelegram ? (
                            <span className="bg-sky-500/90 backdrop-blur-md px-2.5 py-0.5 rounded-md text-[11px] font-bold text-white flex items-center gap-1 shadow-sm">
                              <Send size={11} />
                              <span>تيليجرام</span>
                            </span>
                          ) : isBook ? (
                            <span className="bg-emerald-600/90 backdrop-blur-md px-2.5 py-0.5 rounded-md text-[11px] font-bold text-white flex items-center gap-1 shadow-sm">
                              <BookOpen size={11} />
                              <span>كتاب / PDF</span>
                            </span>
                          ) : isAudio ? (
                            <span className="bg-amber-600/90 backdrop-blur-md px-2.5 py-0.5 rounded-md text-[11px] font-bold text-white flex items-center gap-1 shadow-sm">
                              <Headphones size={11} />
                              <span>صوتي</span>
                            </span>
                          ) : (
                            <span className="bg-red-600/90 backdrop-blur-md px-2.5 py-0.5 rounded-md text-[11px] font-bold text-white flex items-center gap-1 shadow-sm">
                              <Play size={10} fill="currentColor" />
                              <span>يوتيوب</span>
                            </span>
                          )
                        )}
                      </div>

                      {/* Item count or Duration badge (No type tag) */}
                      {!isStandalone && !isShorts ? (
                        <div className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-bold text-white flex items-center gap-1 border border-white/10">
                          {isBook ? <BookOpen size={13} /> : <ListVideo size={13} />}
                          <span>{item.videoCount} {isBook ? 'صفحة' : 'مقطع'}</span>
                        </div>
                      ) : (
                        item.videos?.[0]?.duration ? (
                          <div className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-mono font-bold text-neutral-200 border border-white/10">
                            {formatDuration(item.videos[0].duration)}
                          </div>
                        ) : null
                      )}
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-base md:text-lg text-white mb-2 line-clamp-2 group-hover:text-neutral-100 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-xs md:text-sm text-neutral-400 line-clamp-2 mb-4 leading-relaxed">
                          {item.description || 'لا يوجد وصف متاح لهذا المحتوى.'}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-neutral-800/80 flex items-center justify-between">
                        <span className="text-xs text-neutral-400 group-hover:text-white font-medium flex items-center gap-1.5 transition-colors">
                          {isTelegram ? (
                            <>
                              <span>الانتقال لقناة التيليجرام</span>
                              <ExternalLink size={13} />
                            </>
                          ) : isBook ? (
                            <>
                              <span>قراءة وتحميل الكتاب</span>
                              <ExternalLink size={13} />
                            </>
                          ) : (
                            <>
                              <span>عرض الفيديوهات والقائمة</span>
                              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                            </>
                          )}
                        </span>

                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
                          title="فتح الرابط الخارجي"
                        >
                          <ExternalLink size={15} />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-neutral-950/60 rounded-3xl border border-neutral-800 border-dashed max-w-lg mx-auto p-8">
              <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-5">
                {(() => {
                  const Icon = tabs.find(t => t.id === activeTab)?.icon;
                  return Icon ? <Icon size={26} className="text-neutral-400" /> : null;
                })()}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">لا يوجد محتوى مضاف حالياً</h3>
              <p className="text-neutral-400 text-sm leading-relaxed max-w-sm">
                لم يتم إضافة أي {tabs.find(t => t.id === activeTab)?.label} لهذا الشيخ حتى الآن. سيتم توفيرها قريباً إن شاء الله.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Backdrop overlay for Left-Side Drawer */}
      <div
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${selectedSeries ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={handleCloseDrawer}
      />

      {/* Left-Side Slide-Over Tab/Panel (يفتح من الجانب الأيسر مع أنيميشن سلس) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-neutral-950 border-r border-neutral-800 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col transition-all duration-300 ease-out transform ${isExpanded
          ? 'w-full sm:w-[90vw] md:w-[85vw] lg:w-[80vw] max-w-6xl'
          : 'w-full sm:w-[520px] md:w-[600px] lg:w-[660px]'
          } ${selectedSeries ? 'translate-x-0' : '-translate-x-full'}`}
        dir="rtl"
      >
        {selectedSeries && (
          <>
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-neutral-800 bg-black/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white shrink-0 shadow-inner">
                  <ListVideo size={17} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-white text-base md:text-lg truncate">
                    {selectedSeries.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <span>{scholar.name}</span>
                    <span>•</span>
                    <span className="text-neutral-300 font-semibold">{selectedSeries.videoCount} درس</span>
                    {completedLessons.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-400 font-semibold">
                          أتممت {completedLessons.length} من {selectedSeries.videoCount}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 mr-3 shrink-0">
                {/* Theater / Expand button */}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-all hidden sm:block"
                  title={isExpanded ? 'تصغير الشاشة' : 'تكبير الشاشة للوضع السينمائي'}
                >
                  {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>

                <a
                  href={selectedSeries.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-all"
                  title="فتح في YouTube"
                >
                  <ExternalLink size={16} />
                </a>
                <button
                  onClick={handleCloseDrawer}
                  className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-all"
                  title="إغلاق القائمة"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Drawer Content: Video Player + Sub-Tabs */}
            <div className="flex-1 overflow-y-auto flex flex-col custom-scrollbar">
              {/* Sticky/Top Video Player */}
              <div className="p-4 sm:p-5 pb-3 bg-neutral-950/80 border-b border-neutral-900 shrink-0">
                {(activeVideo?.source === 'telegram' || activeVideo?.url?.includes('t.me') || activeVideo?.directUrl?.includes('t.me') || selectedSeries.source === 'telegram' || selectedSeries.url?.includes('t.me')) ? (
                  <TelegramPlayer
                    url={activeVideo?.directUrl || activeVideo?.url || selectedSeries.url || ''}
                    title={activeVideo?.title || selectedSeries.title}
                    height={380}
                  />
                ) : (activeVideo?.source === 'direct' || selectedSeries.source === 'direct') && (activeVideo?.directUrl?.endsWith('.mp3') || activeVideo?.url?.endsWith('.mp3') || activeVideo?.directUrl?.endsWith('.wav') || activeVideo?.url?.endsWith('.wav')) ? (
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 shadow-2xl flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 shadow-lg">
                      <Headphones size={26} />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white mb-3">{activeVideo?.title || selectedSeries.title}</h3>
                    <audio controls className="w-full max-w-sm" src={activeVideo?.directUrl || activeVideo?.url}>
                      متصفحك لا يدعم مشغل الصوت.
                    </audio>
                  </div>
                ) : (
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-neutral-800 shadow-2xl">
                    <iframe
                      key={`${activeVideoId}-${activeTimestampSeconds}`}
                      src={
                        activeVideoId
                          ? `https://www.youtube-nocookie.com/embed/${activeVideoId}?autoplay=1${activeTimestampSeconds !== null ? `&start=${activeTimestampSeconds}` : ''}`
                          : `https://www.youtube-nocookie.com/embed/videoseries?list=${selectedSeries.id}&autoplay=1`
                      }
                      title={selectedSeries.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}

                {/* Video controls & Previous / Next Lesson */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-semibold text-neutral-400 block mb-0.5">
                      يتم التشغيل الآن:
                    </span>
                    <h4 className="text-sm font-bold text-white line-clamp-1 leading-snug">
                      {activeVideo?.title || selectedSeries.title}
                    </h4>
                  </div>

                  {/* Prev / Next buttons & Mark Completed */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {activeVideoId && (
                      <button
                        onClick={(e) => handleToggleCompleted(e, activeVideoId)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${completedLessons.includes(activeVideoId)
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        title="تحديد الدرس كمكتمل"
                      >
                        <CheckCircle2 size={13} />
                        <span>{completedLessons.includes(activeVideoId) ? 'تمت دراسته' : 'تحديد كمكتمل'}</span>
                      </button>
                    )}

                    <button
                      onClick={handlePrevLesson}
                      disabled={currentIndex <= 0}
                      className="p-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white disabled:opacity-30 transition-all"
                      title="الدرس السابق"
                    >
                      <ChevronRight size={16} />
                    </button>
                    <button
                      onClick={handleNextLesson}
                      disabled={!selectedSeries.videos || currentIndex >= selectedSeries.videos.length - 1}
                      className="p-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white disabled:opacity-30 transition-all"
                      title="الدرس القادم"
                    >
                      <ChevronLeft size={16} />
                    </button>
                  </div>
                </div>

                {/* Interactive Chapters / Timestamps Index */}
                {activeChapters.length > 0 && (
                  <div className="mt-3 p-3 rounded-xl bg-neutral-900/90 border border-neutral-800/90">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                        <Clock size={13} className="text-amber-400" />
                        <span>فهرس فواصل ومواضيع الدرس ({activeChapters.length} فاصل زمني):</span>
                      </span>
                      {activeTimestampSeconds !== null && (
                        <button
                          onClick={() => setActiveTimestampSeconds(null)}
                          className="text-[11px] text-neutral-400 hover:text-white underline transition-colors"
                        >
                          إعادة للبداية
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar pr-1">
                      {activeChapters.map((chapter, chIdx) => {
                        const isCurrent = activeTimestampSeconds === chapter.seconds;
                        return (
                          <button
                            key={chIdx}
                            onClick={() => setActiveTimestampSeconds(chapter.seconds)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all ${isCurrent
                              ? 'bg-white text-black font-bold shadow'
                              : 'bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700/60'
                              }`}
                            title={`الانتقال إلى ${chapter.timestamp}`}
                          >
                            <span className="font-mono text-[10px] text-amber-400 font-semibold">{chapter.timestamp}</span>
                            <span className="truncate max-w-[170px]">{chapter.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Sub-Tabs Selector (قائمة الدروس vs التعليقات vs عن السلسلة) */}
              <div className="px-4 border-b border-neutral-900 bg-neutral-950 flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setDrawerTab('episodes')}
                  className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-all ${drawerTab === 'episodes'
                    ? 'border-white text-white'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                    }`}
                >
                  <ListVideo size={15} />
                  <span>الدروس والحلقات ({selectedSeries.videos?.length || selectedSeries.videoCount})</span>
                </button>

                <button
                  onClick={() => setDrawerTab('comments')}
                  className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-all ${drawerTab === 'comments'
                    ? 'border-white text-white'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                    }`}
                >
                  <MessageSquare size={15} />
                  <span>التعليقات والأسئلة</span>
                </button>

                <button
                  onClick={() => setDrawerTab('about')}
                  className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-all ${drawerTab === 'about'
                    ? 'border-white text-white'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                    }`}
                >
                  <Info size={15} />
                  <span>عن السلسلة</span>
                </button>
              </div>

              {/* TAB 1: Episodes & Search List */}
              {drawerTab === 'episodes' && (
                <div className="flex-1 flex flex-col">
                  {selectedSeries.videos && selectedSeries.videos.length > 5 && (
                    <div className="p-3 border-b border-neutral-900 bg-neutral-950/60">
                      <div className="relative w-full">
                        <input
                          type="text"
                          value={videoSearchQuery}
                          onChange={(e) => setVideoSearchQuery(e.target.value)}
                          placeholder="بحث داخل السلسلة..."
                          className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs px-3 py-2 pr-8 rounded-xl focus:outline-none focus:border-white transition-colors"
                        />
                        <Search className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-neutral-500" />
                      </div>
                    </div>
                  )}

                  <div className="p-4 space-y-2.5 flex-1">
                    {isLoadingVideos ? (
                      <div className="py-16 text-center space-y-4">
                        <Loader2 size={32} className="animate-spin text-white mx-auto" />
                        <p className="text-sm text-neutral-400">جاري جلب حلقات ودروس السلسلة من يوتيوب...</p>
                      </div>
                    ) : filteredVideos.length > 0 ? (
                      filteredVideos.map((vid, idx) => {
                        const isPlaying = activeVideoId === vid.id;
                        const isDone = completedLessons.includes(vid.id);
                        const durationStr = formatDuration(vid.duration);

                        return (
                          <div
                            key={vid.id}
                            onClick={() => handleSelectVideo(vid.id)}
                            className={`group/vid flex items-center gap-3 p-2.5 rounded-2xl border transition-all duration-200 cursor-pointer ${isPlaying
                              ? 'bg-neutral-900 border-white text-white shadow-md'
                              : 'bg-neutral-950/70 border-neutral-800/80 text-neutral-300 hover:bg-neutral-900 hover:border-neutral-700'
                              }`}
                          >
                            {/* Thumbnail with duration badge */}
                            <div className="relative w-24 sm:w-28 aspect-video rounded-xl overflow-hidden bg-neutral-900 shrink-0 border border-neutral-800/80">
                              <img
                                src={vid.thumbnail}
                                alt={vid.title}
                                className="w-full h-full object-cover group-hover/vid:scale-105 transition-transform duration-300"
                              />
                              {isPlaying ? (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                  <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                                    <Play size={12} fill="currentColor" />
                                  </div>
                                </div>
                              ) : (
                                <div className="absolute inset-0 bg-black/30 group-hover/vid:bg-transparent transition-all flex items-center justify-center opacity-0 group-hover/vid:opacity-100">
                                  <div className="w-6 h-6 rounded-full bg-white/90 text-black flex items-center justify-center shadow-md">
                                    <Play size={10} fill="currentColor" />
                                  </div>
                                </div>
                              )}

                              {durationStr && (
                                <div className="absolute bottom-1 right-1 bg-black/85 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-white flex items-center gap-0.5">
                                  <Clock size={9} />
                                  <span>{durationStr}</span>
                                </div>
                              )}
                            </div>

                            {/* Title & Index */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold ${isPlaying
                                    ? 'bg-white text-black'
                                    : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                                    }`}>
                                    درس #{idx + 1}
                                  </span>

                                  {(vid.source === 'telegram' || vid.url?.includes('t.me') || vid.directUrl?.includes('t.me')) && (
                                    <span className="text-[10px] bg-sky-500/15 text-sky-300 border border-sky-500/30 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                      <Send size={9} />
                                      <span>تيليجرام</span>
                                    </span>
                                  )}

                                  {(vid.source === 'direct' || vid.url?.endsWith('.mp3') || vid.directUrl?.endsWith('.mp3')) && (
                                    <span className="text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                      <Headphones size={9} />
                                      <span>صوتيات</span>
                                    </span>
                                  )}

                                  {vid.chapters && vid.chapters.length > 0 && (
                                    <span className="text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                      <Clock size={9} />
                                      <span>{vid.chapters.length} فواصل</span>
                                    </span>
                                  )}

                                  {isDone && (
                                    <span className="text-emerald-400" title="تمت دراسته">
                                      <CheckCircle2 size={12} />
                                    </span>
                                  )}
                                </div>

                                {isPlaying && (
                                  <span className="text-[10px] font-semibold text-neutral-300 animate-pulse">
                                    جاري التشغيل...
                                  </span>
                                )}
                              </div>
                              <div className="flex items-start justify-between gap-2">
                                <h5 className="text-xs sm:text-sm font-semibold line-clamp-2 leading-snug group-hover/vid:text-white transition-colors">
                                  {vid.title}
                                </h5>
                                {(vid.directUrl || vid.url) && (vid.source === 'telegram' || vid.url?.includes('t.me') || vid.directUrl?.includes('t.me')) && (
                                  <a
                                    href={vid.directUrl || vid.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1 rounded-lg text-sky-400 hover:text-white hover:bg-sky-500/20 transition-all shrink-0 mt-0.5"
                                    title="فتح الرابط في تيليجرام مباشرة"
                                  >
                                    <ExternalLink size={13} />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-12 text-center text-neutral-500 text-sm">
                        {videoSearchQuery ? 'لا توجد دروس مطابقة لكلمة البحث.' : 'لا توجد دروس متوفرة حالياً في هذه السلسلة.'}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: Comments and QA */}
              {drawerTab === 'comments' && (
                <SeriesCommentsTab
                  videoId={activeVideoId || selectedSeries.videos?.[0]?.id || null}
                  videoTitle={activeVideo?.title}
                />
              )}

              {/* TAB 3: About Series */}
              {drawerTab === 'about' && (
                <div className="p-5 space-y-4 text-neutral-300 text-sm leading-relaxed">
                  <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800">
                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                      نبذة عن السلسلة
                    </h4>
                    <p className="whitespace-pre-line text-xs sm:text-sm text-neutral-300 leading-relaxed">
                      {selectedSeries.description || 'لا يتوفر وصف مفصل لهذه السلسلة.'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 space-y-2">
                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                      معلومات المحاضر
                    </h4>
                    <p className="text-xs sm:text-sm font-bold text-white">{scholar.name}</p>
                    <p className="text-xs text-neutral-400 leading-relaxed">{scholar.bio}</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
};



