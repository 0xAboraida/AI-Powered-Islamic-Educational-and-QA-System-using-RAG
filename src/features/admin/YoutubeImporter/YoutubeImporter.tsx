import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Loader2,
  PlayCircle,
  Edit3,
  Plus,
  CheckCircle2,
  User,
  BookOpen,
  Headphones,
  Video,
  GraduationCap,
  Layers,
  Trash2,
  ExternalLink,
  ListVideo,
  Play,
  Send,
  GitMerge,
  Mic,
  Download,
  Upload,
  ArrowRight,
  PanelRight,
  X,
  Film,
  Smartphone,
  Sparkles,
  MessageSquare,
  RefreshCw,
  ArrowDown,
  ThumbsUp,
  Image as ImageIcon
} from 'lucide-react';
import {
  extractHandleFromUrl,
  getChannelInfo,
  getChannelPlaylists,
  getChannelPlaylistsPaged,
  getChannelUploads,
  getChannelUploadsPaged,
  extractVideoIdFromUrl,
  extractPlaylistIdFromUrl,
  getVideoInfo,
  getPlaylistInfo,
  detectYouTubeUrlType,
  searchChannels,
  getChannelCommunityPosts,
  getSingleCommunityPost,
  YouTubeCommunityPost
} from '../../../services/youtube.api';

const formatDuration = (duration?: string) => {
  if (!duration) return '';
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  const hours = match[1] ? `${match[1]}:` : '';
  const minutes = match[2] ? (match[1] ? match[2].padStart(2, '0') : match[2]) : '0';
  const seconds = match[3] ? match[3].padStart(2, '0') : '00';
  return `${hours}${minutes}:${seconds}`;
};
import {
  addScholar,
  getScholars,
  addSeriesToStore,
  getSeries,
  deleteSeriesFromStore,
  deleteScholarFromStore,
  mergeScholarsInStore
} from '../../lessons/data/store';
import { Scholar, ExplanationSeries } from '../../lessons/data/mockData';
import { PlaylistCard } from './components/PlaylistCard';
import { ScholarEditModal } from './components/ScholarEditModal';
import { AddManualContentModal } from './components/AddManualContentModal';
import { CurateSeriesModal } from './components/CurateSeriesModal';
import { AddScholarModal } from './components/AddScholarModal';
import { MergeScholarModal } from './components/MergeScholarModal';
import { ScholarAvatar } from '../../../components/common/ScholarAvatar';
import { TelegramEmbedModal } from '../../../components/common/TelegramEmbedModal';

interface YoutubeImporterProps {
  onBack?: () => void;
}

export const YoutubeImporter: React.FC<YoutubeImporterProps> = ({ onBack }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [channelInfo, setChannelInfo] = useState<any>(null);
  const [currentScholar, setCurrentScholar] = useState<Scholar | null>(null);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [existingScholars, setExistingScholars] = useState<Scholar[]>([]);
  const [scholarSavedSeries, setScholarSavedSeries] = useState<ExplanationSeries[]>([]);

  // Scholar view sub-tab
  const [activeScholarTab, setActiveScholarTab] = useState<'approved' | 'youtube' | 'manual'>('approved');
  const [seriesFilter, setSeriesFilter] = useState<'all' | 'curated' | 'youtube' | 'standalone' | 'shorts' | 'telegram' | 'audio' | 'book' | 'course' | 'podcast'>('all');
  
  // YouTube 5-tab import state
  type YoutubeSubTab = 'playlists' | 'videos' | 'shorts' | 'podcasts' | 'posts';
  const [youtubeSubTab, setYoutubeSubTab] = useState<YoutubeSubTab>('playlists');
  const [youtubeSearchInput, setYoutubeSearchInput] = useState('');
  const [isSearchingYoutube, setIsSearchingYoutube] = useState(false);
  const [youtubeSearchError, setYoutubeSearchError] = useState('');
  const [lastDetectedType, setLastDetectedType] = useState<string>('');

  const [channelVideos, setChannelVideos] = useState<any[]>([]);
  const [channelShorts, setChannelShorts] = useState<any[]>([]);
  const [channelPodcasts, setChannelPodcasts] = useState<any[]>([]);
  const [channelPosts, setChannelPosts] = useState<YouTubeCommunityPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [activeImportSourceChannel, setActiveImportSourceChannel] = useState<any>(null);

  const [innerFilterQuery, setInnerFilterQuery] = useState('');
  const [isLoadingChannelVideos, setIsLoadingChannelVideos] = useState(false);
  const [batchPlaylistsTarget, setBatchPlaylistsTarget] = useState<'visual' | 'course' | 'podcast'>('visual');
  const [batchVideosTarget, setBatchVideosTarget] = useState<'standalone' | 'visual' | 'course' | 'podcast'>('standalone');
  const [batchShortsTarget, setBatchShortsTarget] = useState<'shorts' | 'standalone' | 'visual'>('shorts');
  const [batchPodcastsTarget, setBatchPodcastsTarget] = useState<'podcast' | 'visual'>('podcast');
  const [uploadsLimit, setUploadsLimit] = useState(200);
  const [isLoadingMoreUploads, setIsLoadingMoreUploads] = useState(false);

  // Pagination & Infinite Scrolling state
  const [uploadsNextPageToken, setUploadsNextPageToken] = useState<string>('');
  const [hasMoreUploads, setHasMoreUploads] = useState<boolean>(true);
  const [playlistsNextPageToken, setPlaylistsNextPageToken] = useState<string>('');
  const [hasMorePlaylists, setHasMorePlaylists] = useState<boolean>(true);
  const [isLoadingMorePlaylists, setIsLoadingMorePlaylists] = useState(false);
  const infiniteSentinelRef = useRef<HTMLDivElement>(null);

  const [extraChannelUrl, setExtraChannelUrl] = useState('');
  const [isFetchingExtraChannel, setIsFetchingExtraChannel] = useState(false);
  const [extraChannelError, setExtraChannelError] = useState('');

  // Sidebar search & Backup handlers
  const [scholarSearchQuery, setScholarSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddContentModalOpen, setIsAddContentModalOpen] = useState(false);
  const [isCurateModalOpen, setIsCurateModalOpen] = useState(false);
  const [isAddScholarModalOpen, setIsAddScholarModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [notification, setNotification] = useState('');
  const [previewTelegram, setPreviewTelegram] = useState<{ url: string; title: string } | null>(null);

  // Load existing registered scholars and auto-select first one if none selected
  useEffect(() => {
    const list = getScholars();
    setExistingScholars(list);
    if (list.length > 0 && !currentScholar) {
      setCurrentScholar(list[0]);
      refreshScholarSavedSeries(list[0].id);
      getChannelPlaylists(list[0].id).then(pls => setPlaylists(pls)).catch(() => setPlaylists([]));
    }
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const handleExportData = () => {
    const backupData = {
      scholars: getScholars(),
      series: getSeries(),
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zad_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('تم تنزيل النسخة الاحتياطية بملف JSON بنجاح! 💾');
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string);
        if (json.scholars && Array.isArray(json.scholars)) {
          localStorage.setItem('zad_scholars', JSON.stringify(json.scholars));
          const list = getScholars();
          setExistingScholars(list);
          if (list.length > 0) {
            setCurrentScholar(list[0]);
          }
        }
        if (json.series && Array.isArray(json.series)) {
          localStorage.setItem('zad_series', JSON.stringify(json.series));
          refreshScholarSavedSeries(currentScholar?.id);
        }
        showNotification('تمت استعادة البيانات بنجاح! 📥');
      } catch (err) {
        showNotification('تعذر قراءة الملف. تأكد من أنه ملف JSON صالح.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    setIsLoading(true);
    setError('');
    setChannelInfo(null);
    setPlaylists([]);

    try {
      let identifier = inputUrl.trim();
      let isHandle = false;

      if (identifier.includes('youtube.com')) {
        const extracted = extractHandleFromUrl(identifier);
        if (extracted) {
          identifier = extracted;
          isHandle = true;
        } else {
          throw new Error('يرجى إدخال رابط يوتيوب صالح يحتوي على المعرف (مثال: youtube.com/@almukaddem)');
        }
      } else if (identifier.startsWith('@')) {
        isHandle = true;
      }

      // Fetch Channel Info
      const channel = await getChannelInfo(identifier, isHandle);

      if (!channel) {
        throw new Error('لم يتم العثور على القناة. يرجى التحقق من الرابط أو المعرف.');
      }

      setChannelInfo(channel);

      // Fetch Playlists
      const channelPlaylists = await getChannelPlaylists(channel.id);

      const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
      if (uploadsPlaylistId) {
        channelPlaylists.unshift({
          id: uploadsPlaylistId,
          snippet: {
            title: 'كل الفيديوهات (All Uploads)',
            description: 'جميع الفيديوهات المرفوعة على القناة',
            thumbnails: channel.snippet.thumbnails,
          },
          contentDetails: {
            itemCount: channel.statistics?.videoCount || '?'
          }
        });
      }

      setPlaylists(channelPlaylists);

      if (currentScholar) {
        // Active scholar exists: Link playlists to the active scholar WITHOUT creating a duplicate!
        setActiveScholarTab('youtube');
        showNotification(`تم جلب (${channelPlaylists.length}) قائمة من قناة "${channel.snippet.title}" لبروفايل الشيخ "${currentScholar.name}". يمكنك استيراد السلاسل المطلوبة الآن.`);
      } else {
        // No scholar selected yet: create new scholar
        const scholarObj: Scholar = {
          id: channel.id,
          name: channel.snippet.title,
          avatar: channel.snippet.thumbnails.high?.url || channel.snippet.thumbnails.medium?.url || channel.snippet.thumbnails.default?.url || '',
          bio: channel.snippet.description || '',
          specialty: 'عالم وداعية إسلامي',
          youtubeUrl: `https://youtube.com/channel/${channel.id}`
        };

        setCurrentScholar(scholarObj);
        addScholar(scholarObj);
        setExistingScholars(getScholars());
        showNotification(`تم العثور على الشيخ "${scholarObj.name}" وتسجيله بنجاح.`);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ أثناء جلب البيانات. تأكد من الرابط ومن API Key.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshScholarSavedSeries = (scholarId?: string) => {
    const targetId = scholarId || currentScholar?.id;
    if (!targetId) {
      setScholarSavedSeries([]);
      return;
    }
    const all = getSeries();
    setScholarSavedSeries(all.filter(s => s.scholarId === targetId));
  };

  // Sync scholar's saved & curated series whenever the selected scholar changes
  useEffect(() => {
    if (currentScholar?.id) {
      refreshScholarSavedSeries(currentScholar.id);
    } else {
      setScholarSavedSeries([]);
    }
  }, [currentScholar?.id]);

  // Select an already registered scholar to manage
  const handleSelectExistingScholar = async (scholar: Scholar) => {
    setCurrentScholar(scholar);
    refreshScholarSavedSeries(scholar.id);
    setError('');
    setIsLoading(true);
    try {
      const channelPlaylists = await getChannelPlaylists(scholar.id);
      setPlaylists(channelPlaylists);
    } catch {
      setPlaylists([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveScholarEdit = (updated: Scholar) => {
    addScholar(updated);
    setCurrentScholar(updated);
    setExistingScholars(getScholars());
    refreshScholarSavedSeries(updated.id);
    setIsEditModalOpen(false);
    showNotification(`تم تحديث بيانات وصورة الشيخ "${updated.name}" بنجاح.`);
  };

  const handleSaveManualContent = (newSeries: ExplanationSeries) => {
    addSeriesToStore(newSeries);
    setIsAddContentModalOpen(false);
    refreshScholarSavedSeries(currentScholar?.id);
    showNotification(`تمت إضافة "${newSeries.title}" إلى قسم ${newSeries.type === 'visual' ? 'الشروحات المرئية' : newSeries.type === 'audio' ? 'الشروحات الصوتية' : newSeries.type === 'book' ? 'الكتب' : 'الدورات'} بنجاح!`);
  };

  const handleSaveCuratedSeries = (curated: ExplanationSeries) => {
    addSeriesToStore(curated);
    setIsCurateModalOpen(false);
    refreshScholarSavedSeries(currentScholar?.id);
    showNotification(`تم حفظ السلسلة المجمعة "${curated.title}" وترتيب دروسها وتثبيتها للشيخ بنجاح!`);
  };

  const handleDeleteSeries = (seriesId: string, seriesTitle: string) => {
    if (window.confirm(`هل أنت متأكد من حذف سلسلة "${seriesTitle}" من قوائم هذا الشيخ؟`)) {
      deleteSeriesFromStore(seriesId);
      refreshScholarSavedSeries(currentScholar?.id);
      showNotification(`تم حذف سلسلة "${seriesTitle}" بنجاح.`);
    }
  };

  // Save new scholar created via AddScholarModal
  const handleSaveNewScholar = (newScholar: Scholar) => {
    addScholar(newScholar);
    const updated = getScholars();
    setExistingScholars(updated);
    setCurrentScholar(newScholar);
    refreshScholarSavedSeries(newScholar.id);
    setIsAddScholarModalOpen(false);
    showNotification(`تم تسجيل الشيخ "${newScholar.name}" في المنصة بنجاح.`);
  };

  // Delete an entire scholar profile from platform
  const handleDeleteScholar = (scholarId: string, scholarName: string) => {
    if (window.confirm(`هل أنت متأكد من حذف الشيخ "${scholarName}" نهائياً من المنصة؟\n\n(ملاحظة: يمكنك نقل سلاسله لشيخ آخر أولاً عبر زر "دمج في شيخ آخر" لتفادي فقدانها)`)) {
      deleteScholarFromStore(scholarId, false);
      const updated = getScholars();
      setExistingScholars(updated);
      if (currentScholar?.id === scholarId) {
        setCurrentScholar(updated[0] || null);
        if (updated[0]) refreshScholarSavedSeries(updated[0].id);
      }
      showNotification(`تم حذف بروفايل الشيخ "${scholarName}" بنجاح.`);
    }
  };

  // Change series section/type directly from admin panel
  const handleUpdateSeriesType = (seriesId: string, newType: 'visual' | 'course' | 'curated' | 'audio' | 'book' | 'podcast' | 'standalone' | 'shorts') => {
    const target = scholarSavedSeries.find(s => s.id === seriesId);
    if (!target) return;
    const updated = { ...target, type: newType };
    addSeriesToStore(updated);
    refreshScholarSavedSeries(currentScholar?.id);
    const typeLabel = 
      newType === 'course' ? 'الدورات الحالية 🎓' : 
      newType === 'curated' ? 'السلاسل المجمعة' : 
      newType === 'podcast' ? 'بودكاست 🎙️' : 
      newType === 'standalone' ? 'المحاضرات والمقاطع العامة 🎞️' :
      newType === 'shorts' ? 'المقاطع القصيرة 📱' :
      newType === 'visual' ? 'الشروحات المرئية 🎥' : 
      newType === 'audio' ? 'الشروحات الصوتية 🎧' : 'الكتب 📖';
    showNotification(`تم نقل "${target.title}" إلى قسم ${typeLabel} بنجاح!`);
  };

  // Fetch individual uploads & shorts for current scholar or active channel
  const handleLoadChannelVideos = async () => {
    const targetChannelId = activeImportSourceChannel?.id || currentScholar?.id;
    if (!targetChannelId) return;
    setIsLoadingChannelVideos(true);
    try {
      const page = await getChannelUploadsPaged(targetChannelId, undefined, 50);
      const shortsList: any[] = [];
      const videosList: any[] = [];
      page.items.forEach((v: any) => {
        if (v.isShort) shortsList.push(v);
        else videosList.push(v);
      });
      setChannelShorts(shortsList);
      setChannelVideos(videosList);
      setUploadsNextPageToken(page.nextPageToken || '');
      setHasMoreUploads(page.hasMore);
      setUploadsLimit(page.items.length);
      showNotification(`تم جلب (${shortsList.length}) مقطع قصير و (${videosList.length}) فيديو عام بنجاح! 📱`);
    } catch (err) {
      console.error(err);
      showNotification('تعذر جلب فيديوهات القناة.');
    } finally {
      setIsLoadingChannelVideos(false);
    }
  };

  // Load next batch (+50 videos/shorts) automatically on scroll or click
  const handleLoadMoreUploads = async () => {
    const targetChannelId = activeImportSourceChannel?.id || currentScholar?.id;
    if (!targetChannelId || isLoadingMoreUploads || !hasMoreUploads) return;
    setIsLoadingMoreUploads(true);
    try {
      const page = await getChannelUploadsPaged(targetChannelId, uploadsNextPageToken || undefined, 50);
      const newShorts: any[] = [];
      const newVideos: any[] = [];
      page.items.forEach((v: any) => {
        if (v.isShort) newShorts.push(v);
        else newVideos.push(v);
      });

      setChannelShorts(prev => {
        const existingIds = new Set(prev.map(item => item.id));
        const filteredNew = newShorts.filter(item => !existingIds.has(item.id));
        return [...prev, ...filteredNew];
      });

      setChannelVideos(prev => {
        const existingIds = new Set(prev.map(item => item.id));
        const filteredNew = newVideos.filter(item => !existingIds.has(item.id));
        return [...prev, ...filteredNew];
      });

      setUploadsNextPageToken(page.nextPageToken || '');
      setHasMoreUploads(page.hasMore);
      setUploadsLimit(prev => prev + page.items.length);
    } catch (err) {
      console.error(err);
      showNotification('تعذر تحميل مقاطع إضافية.');
    } finally {
      setIsLoadingMoreUploads(false);
    }
  };

  // Load next batch of playlists automatically on scroll or click
  const handleLoadMorePlaylists = async () => {
    const targetChannelId = activeImportSourceChannel?.id || currentScholar?.id;
    if (!targetChannelId || isLoadingMorePlaylists || !hasMorePlaylists) return;
    setIsLoadingMorePlaylists(true);
    try {
      const page = await getChannelPlaylistsPaged(targetChannelId, playlistsNextPageToken || undefined, 50);
      const newPlaylists: any[] = [];
      const newPodcasts: any[] = [];
      page.items.forEach((p: any) => {
        const t = (p.snippet?.title || '').toLowerCase();
        const d = (p.snippet?.description || '').toLowerCase();
        if (t.includes('بودكاست') || t.includes('podcast') || d.includes('بودكاست') || d.includes('podcast') || t.includes('لقاء') || t.includes('حوار')) {
          newPodcasts.push(p);
        } else {
          newPlaylists.push(p);
        }
      });

      setPlaylists(prev => {
        const existingIds = new Set(prev.map(item => item.id));
        const filtered = newPlaylists.filter(item => !existingIds.has(item.id));
        return [...prev, ...filtered];
      });

      setChannelPodcasts(prev => {
        const existingIds = new Set(prev.map(item => item.id));
        const filtered = newPodcasts.filter(item => !existingIds.has(item.id));
        return [...prev, ...filtered];
      });

      setPlaylistsNextPageToken(page.nextPageToken || '');
      setHasMorePlaylists(page.hasMore);
    } catch (err) {
      console.error(err);
      showNotification('تعذر جلب قوائم تشغيل إضافية.');
    } finally {
      setIsLoadingMorePlaylists(false);
    }
  };

  // Setup infinite scroll observer across all tabs
  useEffect(() => {
    const sentinel = infiniteSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          if (youtubeSubTab === 'videos' || youtubeSubTab === 'shorts') {
            if (!isLoadingMoreUploads && !isLoadingChannelVideos && hasMoreUploads) {
              handleLoadMoreUploads();
            }
          } else if (youtubeSubTab === 'playlists' || youtubeSubTab === 'podcasts') {
            if (!isLoadingMorePlaylists && hasMorePlaylists) {
              handleLoadMorePlaylists();
            }
          }
        }
      },
      { threshold: 0.1, rootMargin: '300px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [
    youtubeSubTab,
    isLoadingMoreUploads,
    isLoadingChannelVideos,
    hasMoreUploads,
    isLoadingMorePlaylists,
    hasMorePlaylists,
    uploadsNextPageToken,
    playlistsNextPageToken,
    activeImportSourceChannel?.id,
    currentScholar?.id
  ]);

  // Import single video into scholar profile
  const handleImportSingleVideo = (video: any, targetType: 'standalone' | 'shorts' | 'visual') => {
    if (!currentScholar?.id) return;
    const newSeriesItem: ExplanationSeries = {
      id: `yt_${video.id}`,
      scholarId: currentScholar.id,
      title: video.title,
      thumbnail: video.thumbnail,
      description: video.description || '',
      videoCount: 1,
      type: targetType,
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
    };
    addSeriesToStore(newSeriesItem);
    refreshScholarSavedSeries(currentScholar.id);
    showNotification(`تم استيراد "${video.title.slice(0, 30)}..." في قسم ${targetType === 'shorts' ? 'المقاطع القصيرة' : targetType === 'standalone' ? 'المحاضرات العامة' : 'الشروحات المرئية'}!`);
  };

  // Batch import all detected shorts or standalone
  const handleBatchImportVideos = (filterType: 'shorts' | 'standalone') => {
    if (!currentScholar?.id || channelVideos.length === 0) return;
    const targetVideos = channelVideos.filter(v => filterType === 'shorts' ? v.isShort : !v.isShort);
    let count = 0;
    targetVideos.forEach(v => {
      const already = scholarSavedSeries.some(s => s.id === `yt_${v.id}` || s.url?.includes(v.id));
      if (!already) {
        addSeriesToStore({
          id: `yt_${v.id}`,
          scholarId: currentScholar.id,
          title: v.title,
          thumbnail: v.thumbnail,
          description: v.description || '',
          videoCount: 1,
          type: filterType,
          source: 'youtube',
          url: `https://youtube.com/watch?v=${v.id}`,
          videos: [{
            id: v.id,
            title: v.title,
            thumbnail: v.thumbnail,
            duration: v.duration,
            publishedAt: v.publishedAt,
            source: 'youtube'
          }]
        });
        count++;
      }
    });
    refreshScholarSavedSeries(currentScholar.id);
    showNotification(`تم استيراد (${count}) مقطع بنجاح!`);
  };

  // Merge current duplicate scholar into target master scholar
  const handleMergeScholar = (targetScholarId: string) => {
    if (!currentScholar) return;
    const target = existingScholars.find(s => s.id === targetScholarId);
    mergeScholarsInStore(currentScholar.id, targetScholarId);
    const updated = getScholars();
    setExistingScholars(updated);
    setCurrentScholar(target || updated[0] || null);
    if (target) refreshScholarSavedSeries(target.id);
    setIsMergeModalOpen(false);
    showNotification(`تم دمج كافة محتويات الشيخ بنجاح في بروفايل "${target?.name || ''}" وحذف البروفايل المكرر.`);
  };

  // Helper for section labels
  const getSectionLabel = (type: string) => {
    switch (type) {
      case 'visual': return 'الشروحات المرئية 🎥';
      case 'standalone': return 'المحاضرات والمقاطع العامة 🎞️';
      case 'shorts': return 'المقاطع القصيرة 📱';
      case 'podcast': return 'البودكاست واللقاءات 🎙️';
      case 'course': return 'الدورات الحالية 🎓';
      case 'curated': return 'السلاسل المجمعة 📚';
      case 'audio': return 'الشروحات الصوتية 🎧';
      case 'book': return 'الكتب والمصنفات 📖';
      default: return type;
    }
  };

  // Universal Item Importer into scholar's profile under ANY chosen section
  const handleUniversalImport = (
    item: any,
    itemType: 'playlist' | 'video' | 'short' | 'podcast' | 'post',
    targetSection: 'visual' | 'standalone' | 'shorts' | 'podcast' | 'course'
  ) => {
    if (!currentScholar?.id) {
      showNotification('يرجى تحديد شيخ أولاً لإضافة المحتوى إلى ملفه.');
      return;
    }

    if (itemType === 'playlist' || itemType === 'podcast') {
      const playlistId = item.id;
      const title = item.snippet?.title || item.title || 'بدون عنوان';
      const thumbnail = item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || item.thumbnail || '';
      const description = item.snippet?.description || item.description || '';
      const videoCount = item.contentDetails?.itemCount ? Number(item.contentDetails.itemCount) : (item.videoCount || 0);

      const newSeries: ExplanationSeries = {
        id: playlistId,
        scholarId: currentScholar.id,
        title,
        thumbnail,
        description,
        videoCount,
        type: targetSection,
        source: 'youtube',
        url: `https://www.youtube.com/playlist?list=${playlistId}`
      };
      addSeriesToStore(newSeries);
      refreshScholarSavedSeries(currentScholar.id);
      showNotification(`تمت إضافة "${title.slice(0, 30)}..." إلى قسم ${getSectionLabel(targetSection)} بنجاح!`);
    } else if (itemType === 'video' || itemType === 'short') {
      const newSeriesItem: ExplanationSeries = {
        id: `yt_${item.id}`,
        scholarId: currentScholar.id,
        title: item.title,
        thumbnail: item.thumbnail,
        description: item.description || '',
        videoCount: 1,
        type: targetSection,
        source: 'youtube',
        url: `https://youtube.com/watch?v=${item.id}`,
        videos: [{
          id: item.id,
          title: item.title,
          thumbnail: item.thumbnail,
          duration: item.duration,
          publishedAt: item.publishedAt,
          source: 'youtube'
        }]
      };
      addSeriesToStore(newSeriesItem);
      refreshScholarSavedSeries(currentScholar.id);
      showNotification(`تمت إضافة "${item.title.slice(0, 30)}..." إلى قسم ${getSectionLabel(targetSection)} بنجاح!`);
    } else if (itemType === 'post') {
      const newPostItem: ExplanationSeries = {
        id: `post_${item.id}`,
        scholarId: currentScholar.id,
        title: item.title || (item.content ? item.content.slice(0, 45) + '...' : 'فائدة من منشورات القناة'),
        thumbnail: item.image || item.thumbnail || currentScholar.avatar,
        description: item.content || item.description || '',
        videoCount: 0,
        type: 'standalone',
        source: 'youtube',
        url: item.url || `https://youtube.com/post/${item.id}`
      };
      addSeriesToStore(newPostItem);
      refreshScholarSavedSeries(currentScholar.id);
      showNotification(`تم حفظ المنشور في بروفايل الشيخ بنجاح! 💬`);
    }
  };

  // Batch import for active sub-tab
  const handleBatchImportCurrentTab = (targetSection: 'visual' | 'standalone' | 'shorts' | 'podcast' | 'course') => {
    if (!currentScholar?.id) return;
    let itemsToImport: any[] = [];
    let itemType: 'playlist' | 'video' | 'short' | 'podcast' = 'playlist';

    if (youtubeSubTab === 'playlists') {
      itemsToImport = playlists;
      itemType = 'playlist';
    } else if (youtubeSubTab === 'videos') {
      itemsToImport = channelVideos;
      itemType = 'video';
    } else if (youtubeSubTab === 'shorts') {
      itemsToImport = channelShorts;
      itemType = 'short';
    } else if (youtubeSubTab === 'podcasts') {
      itemsToImport = channelPodcasts;
      itemType = 'podcast';
    }

    let count = 0;
    itemsToImport.forEach(item => {
      const id = (itemType === 'playlist' || itemType === 'podcast') ? item.id : `yt_${item.id}`;
      const already = scholarSavedSeries.some(s => s.id === id || s.url?.includes(item.id));
      if (!already) {
        handleUniversalImport(item, itemType, targetSection);
        count++;
      }
    });

    showNotification(`تم استيراد (${count}) عنصر بنجاح في قسم ${getSectionLabel(targetSection)}!`);
  };

  // Refresh community posts for active channel or scholar
  const handleRefreshCommunityPosts = async () => {
    const channelTarget =
      activeImportSourceChannel?.customUrl ||
      activeImportSourceChannel?.id ||
      currentScholar?.youtubeUrl ||
      currentScholar?.id;

    if (!channelTarget) {
      showNotification('يرجى تحديد قناة أو إدخال رابط للبحث.');
      return;
    }

    setIsLoadingPosts(true);
    try {
      const posts = await getChannelCommunityPosts(channelTarget);
      setChannelPosts(posts);
      showNotification(`تم جلب وتحديث (${posts.length}) منشور من منتدى القناة بنجاح! 💬`);
    } catch (err: any) {
      showNotification(err.message || 'تعذر تحديث المنشورات.');
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // Universal YouTube Search (Supports Channel, Playlist, Video, Shorts, Podcast, Post)
  const handleUniversalYoutubeSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const input = youtubeSearchInput.trim();
    if (!input) return;

    setIsSearchingYoutube(true);
    setYoutubeSearchError('');
    setLastDetectedType('');

    try {
      const detected = detectYouTubeUrlType(input);
      setLastDetectedType(detected.type);

      if (detected.type === 'shorts') {
        const vidInfo = await getVideoInfo(detected.idOrHandle);
        if (vidInfo) {
          setChannelShorts(prev => {
            const exists = prev.some(v => v.id === vidInfo.id);
            return exists ? prev : [vidInfo, ...prev];
          });
          setYoutubeSubTab('shorts');
          showNotification(`تم جلب المقطع القصير: "${vidInfo.title.slice(0, 35)}..." بنجاح! 📱`);
        } else {
          throw new Error('تعذر العثور على معلومات المقطع القصير.');
        }
      } else if (detected.type === 'video') {
        const vidInfo = await getVideoInfo(detected.idOrHandle);
        if (vidInfo) {
          if (vidInfo.isShort) {
            setChannelShorts(prev => {
              const exists = prev.some(v => v.id === vidInfo.id);
              return exists ? prev : [vidInfo, ...prev];
            });
            setYoutubeSubTab('shorts');
            showNotification(`تم التعرف عليه كمقطع قصير ونقله لتبويب المقاطع القصيرة! 📱`);
          } else {
            setChannelVideos(prev => {
              const exists = prev.some(v => v.id === vidInfo.id);
              return exists ? prev : [vidInfo, ...prev];
            });
            setYoutubeSubTab('videos');
            showNotification(`تم جلب الفيديو: "${vidInfo.title.slice(0, 35)}..." بنجاح! 🎞️`);
          }
        } else {
          throw new Error('تعذر العثور على معلومات الفيديو.');
        }
      } else if (detected.type === 'playlist') {
        const plInfo = await getPlaylistInfo(detected.idOrHandle);
        if (plInfo) {
          const titleLower = (plInfo.snippet?.title || '').toLowerCase();
          const descLower = (plInfo.snippet?.description || '').toLowerCase();
          const isPod = titleLower.includes('بودكاست') || titleLower.includes('podcast') || descLower.includes('بودكاست') || descLower.includes('podcast');
          
          if (isPod) {
            setChannelPodcasts(prev => {
              const exists = prev.some(p => p.id === plInfo.id);
              return exists ? prev : [plInfo, ...prev];
            });
            setYoutubeSubTab('podcasts');
            showNotification(`تم التعرف عليه كقائمة بودكاست: "${plInfo.snippet?.title.slice(0, 30)}..." 🎙️`);
          } else {
            setPlaylists(prev => {
              const exists = prev.some(p => p.id === plInfo.id);
              return exists ? prev : [plInfo, ...prev];
            });
            setYoutubeSubTab('playlists');
            showNotification(`تم جلب قائمة التشغيل: "${plInfo.snippet?.title.slice(0, 30)}..." 📋`);
          }
        } else {
          throw new Error('تعذر العثور على قائمة التشغيل. تأكد من صحة الرابط وأن القائمة عامة.');
        }
      } else if (detected.type === 'community') {
        setIsLoadingPosts(true);
        try {
          const raw = detected.idOrHandle;
          const isSinglePost = raw.includes('/post/') || raw.includes('lb=');
          if (isSinglePost) {
            const single = await getSingleCommunityPost(raw);
            if (single) {
              setChannelPosts(prev => {
                const exists = prev.some(p => p.id === single.id);
                return exists ? prev : [single, ...prev];
              });
              setYoutubeSubTab('posts');
              showNotification('تم جلب تفاصيل المنشور من يوتيوب بنجاح! 💬');
            } else {
              throw new Error('تعذر جلب تفاصيل هذا المنشور من يوتيوب. تأكد من صحة الرابط.');
            }
          } else {
            // Channel community feed: e.g. @channel/community
            const posts = await getChannelCommunityPosts(raw);
            if (posts.length > 0) {
              setChannelPosts(posts);
              setYoutubeSubTab('posts');
              showNotification(`تم جلب (${posts.length}) منشور من منتدى القناة بنجاح! 💬`);
            } else {
              setChannelPosts([]);
              setYoutubeSubTab('posts');
              showNotification('لم يتم العثور على منشورات عامة في هذا المنتدى.');
            }
          }
        } catch (err: any) {
          throw err;
        } finally {
          setIsLoadingPosts(false);
        }
      } else if (detected.type === 'channel' || detected.type === 'unknown') {
        let channel = null;
        let handle = detected.idOrHandle;
        if (handle.startsWith('@')) {
          channel = await getChannelInfo(handle, true);
        } else if (handle.startsWith('UC')) {
          channel = await getChannelInfo(handle, false);
        } else {
          const found = await searchChannels(handle);
          if (found && found.length > 0) {
            channel = await getChannelInfo(found[0].id, false);
          }
        }

        if (!channel) {
          throw new Error('لم يتم العثور على قناة مطابقة للرابط أو المعرف المدخل.');
        }

        setActiveImportSourceChannel({
          id: channel.id,
          title: channel.snippet?.title || channel.title,
          thumbnail: channel.snippet?.thumbnails?.high?.url || channel.snippet?.thumbnails?.medium?.url || '',
          customUrl: channel.snippet?.customUrl || `@${channel.snippet?.title}`,
          subscriberCount: channel.statistics?.subscriberCount || ''
        });

        // 1. Fetch playlists (paged)
        const plsPage = await getChannelPlaylistsPaged(channel.id, undefined, 50);
        const podcastsList: any[] = [];
        const regularPlaylists: any[] = [];
        plsPage.items.forEach((p: any) => {
          const t = (p.snippet?.title || '').toLowerCase();
          const d = (p.snippet?.description || '').toLowerCase();
          if (t.includes('بودكاست') || t.includes('podcast') || d.includes('بودكاست') || d.includes('podcast') || t.includes('لقاء') || t.includes('حوار')) {
            podcastsList.push(p);
          } else {
            regularPlaylists.push(p);
          }
        });
        setPlaylists(regularPlaylists);
        setChannelPodcasts(podcastsList);
        setPlaylistsNextPageToken(plsPage.nextPageToken || '');
        setHasMorePlaylists(plsPage.hasMore);

        // 2. Fetch uploads (videos & shorts) (paged)
        try {
          const uploadsPage = await getChannelUploadsPaged(channel.id, undefined, 50);
          const shortsList: any[] = [];
          const videosList: any[] = [];
          uploadsPage.items.forEach((v: any) => {
            if (v.isShort) shortsList.push(v);
            else videosList.push(v);
          });
          setChannelShorts(shortsList);
          setChannelVideos(videosList);
          setUploadsNextPageToken(uploadsPage.nextPageToken || '');
          setHasMoreUploads(uploadsPage.hasMore);
          setUploadsLimit(uploadsPage.items.length);
        } catch (err) {
          console.warn('Failed to load channel uploads:', err);
        }

        // 3. Fetch real community posts for the channel
        try {
          const posts = await getChannelCommunityPosts(channel.snippet?.customUrl || channel.id);
          setChannelPosts(posts);
        } catch (err) {
          console.warn('Failed to load channel community posts:', err);
          setChannelPosts([]);
        }

        if (regularPlaylists.length > 0) {
          setYoutubeSubTab('playlists');
        } else if (podcastsList.length > 0) {
          setYoutubeSubTab('podcasts');
        } else {
          setYoutubeSubTab('videos');
        }

        showNotification(`تم جلب قناة "${channel.snippet?.title}" بنجاح وتوزيع محتوياتها على الأقسام! 🎉`);
      }
    } catch (err: any) {
      console.error(err);
      setYoutubeSearchError(err.message || 'حدث خطأ أثناء جلب المحتوى. يرجى التحقق من الرابط وإعادة المحاولة.');
    } finally {
      setIsSearchingYoutube(false);
    }
  };

  // Load scholar YouTube content initially
  const loadScholarInitialYoutubeContent = async (scholar: Scholar) => {
    if (!scholar?.id) return;
    setActiveImportSourceChannel({
      id: scholar.id,
      title: scholar.name,
      avatar: scholar.avatar,
      customUrl: scholar.youtubeUrl || '',
      subscriberCount: ''
    });
    try {
      const plsPage = await getChannelPlaylistsPaged(scholar.id, undefined, 50);
      const regularPlaylists: any[] = [];
      const podcastsList: any[] = [];
      plsPage.items.forEach((p: any) => {
        const t = (p.snippet?.title || '').toLowerCase();
        const d = (p.snippet?.description || '').toLowerCase();
        if (t.includes('بودكاست') || t.includes('podcast') || d.includes('بودكاست') || d.includes('podcast') || t.includes('لقاء') || t.includes('حوار')) {
          podcastsList.push(p);
        } else {
          regularPlaylists.push(p);
        }
      });
      setPlaylists(regularPlaylists);
      setChannelPodcasts(podcastsList);
      setPlaylistsNextPageToken(plsPage.nextPageToken || '');
      setHasMorePlaylists(plsPage.hasMore);

      const uploadsPage = await getChannelUploadsPaged(scholar.id, undefined, 50);
      const shortsList: any[] = [];
      const videosList: any[] = [];
      uploadsPage.items.forEach((v: any) => {
        if (v.isShort) shortsList.push(v);
        else videosList.push(v);
      });
      setChannelShorts(shortsList);
      setChannelVideos(videosList);
      setUploadsNextPageToken(uploadsPage.nextPageToken || '');
      setHasMoreUploads(uploadsPage.hasMore);
      setUploadsLimit(uploadsPage.items.length);

      // 3. Fetch community posts for scholar channel
      try {
        const posts = await getChannelCommunityPosts(scholar.youtubeUrl || scholar.id);
        setChannelPosts(posts);
      } catch {
        setChannelPosts([]);
      }
    } catch {
      // Channel playlists might not exist if scholar ID is not a channel
    }
  };

  // Fetch and link playlists from an additional YouTube channel for the SAME active scholar
  const handleFetchExtraChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraChannelUrl.trim() || !currentScholar) return;
    setIsFetchingExtraChannel(true);
    setExtraChannelError('');
    try {
      let identifier = extraChannelUrl.trim();
      let isHandle = false;
      if (identifier.includes('youtube.com')) {
        const extracted = extractHandleFromUrl(identifier);
        if (extracted) {
          identifier = extracted;
          isHandle = true;
        }
      } else if (identifier.startsWith('@')) {
        isHandle = true;
      }
      const channel = await getChannelInfo(identifier, isHandle);
      if (!channel) throw new Error('لم يتم العثور على القناة الإضافية. تحقق من صحة الرابط أو المعرف.');
      const channelPlaylists = await getChannelPlaylists(channel.id);
      if (channelPlaylists.length === 0) {
        throw new Error('لم يتم العثور على قوائم تشغيل متاحة في هذه القناة.');
      }
      setPlaylists(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newOnes = channelPlaylists.filter(p => !existingIds.has(p.id));
        return [...newOnes, ...prev];
      });
      setExtraChannelUrl('');
      showNotification(`تم جلب ${channelPlaylists.length} قائمة من قناة "${channel.snippet.title}" بنجاح!`);
    } catch (err: any) {
      setExtraChannelError(err.message || 'تعذر جلب القناة الإضافية.');
    } finally {
      setIsFetchingExtraChannel(false);
    }
  };

  const filteredScholars = existingScholars.filter(s =>
    s.name.toLowerCase().includes(scholarSearchQuery.toLowerCase()) ||
    (s.specialty && s.specialty.toLowerCase().includes(scholarSearchQuery.toLowerCase()))
  );

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-white min-h-screen bg-black" dir="rtl">
      {/* Modern Unified Navbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        {/* Right side (RTL): Back Button on top + Sidebar Button underneath, then Title */}
        <div className="flex items-center gap-4 min-w-0">
          {/* Vertical Stack: Back button on top, Sidebar button underneath */}
          <div className="flex flex-col gap-1.5 shrink-0">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.16] border border-white/15 text-white text-xs font-bold transition-all shadow-sm backdrop-blur-xl hover:scale-[1.02] active:scale-95"
                title="العودة للصفحة الرئيسية"
              >
                <ArrowRight size={14} className="text-amber-400" />
                <span>العودة للرئيسية</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="flex items-center justify-between gap-2.5 px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-amber-500/40 text-neutral-200 hover:text-white text-xs font-bold transition-all shadow-sm backdrop-blur-xl active:scale-95"
              title="فتح قائمة المشايخ"
            >
              <div className="flex items-center gap-1.5">
                <PanelRight size={14} className="text-amber-400" />
                <span>قائمة المشايخ</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold bg-neutral-800 text-neutral-300 border border-neutral-700">
                {existingScholars.length}
              </span>
            </button>
          </div>

          <div className="h-12 w-px bg-neutral-800 shrink-0 hidden sm:block" />

          {/* Page Title & Subtitle */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700/60 flex items-center justify-center text-amber-400 shadow-inner shrink-0">
              <PlayCircle size={22} />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight truncate">
                إدارة منصة الشروحات
              </h1>
              <p className="text-[11px] text-neutral-400 truncate hidden md:block">
                إدارة بروفايل المشايخ، استيراد سلاسل يوتيوب، وإضافة محتوى تيليجرام والكتب
              </p>
            </div>
          </div>
        </div>

        {/* Left side (RTL): Backup, Restore, Notification */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportData}
            accept=".json"
            className="hidden"
          />

          <button
            type="button"
            onClick={handleExportData}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-200 text-xs font-bold transition-all shadow-sm active:scale-95"
            title="تنزيل نسخة احتياطية من جميع بيانات المشايخ والسلاسل كملف JSON"
          >
            <Download size={14} className="text-amber-400" />
            <span className="hidden sm:inline">نسخ احتياطي (JSON)</span>
            <span className="sm:hidden">نسخ</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-200 text-xs font-bold transition-all shadow-sm active:scale-95"
            title="استعادة البيانات من ملف JSON"
          >
            <Upload size={14} className="text-sky-400" />
            <span className="hidden sm:inline">استعادة بيانات</span>
            <span className="sm:hidden">استعادة</span>
          </button>

          {notification && (
            <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3.5 py-2 rounded-xl text-xs font-semibold animate-in fade-in">
              <CheckCircle2 size={15} />
              <span>{notification}</span>
            </div>
          )}
        </div>
      </div>

      {/* SIDEBAR OVERLAY DRAWER: Opens over the page on the right with blur */}
      <AnimatePresence>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden" dir="rtl">
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setIsSidebarOpen(false)}
            />

            {/* Drawer Panel on Right */}
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-80 sm:w-96 bg-neutral-950/95 backdrop-blur-2xl border-l border-neutral-800 p-5 shadow-2xl z-50 flex flex-col space-y-4"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <User size={18} className="text-amber-400" />
                  <span className="font-bold text-sm text-white">قائمة المشايخ</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {existingScholars.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  title="إغلاق القائمة"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Add Scholar Button at the TOP of the sidebar */}
              <button
                type="button"
                onClick={() => {
                  setIsAddScholarModalOpen(true);
                }}
                className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-neutral-200 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
              >
                <Plus size={16} />
                <span>تسجيل شيخ جديد في المنصة</span>
              </button>

              {/* Search in sidebar if multiple scholars */}
              {existingScholars.length > 3 && (
                <div className="relative">
                  <input
                    type="text"
                    value={scholarSearchQuery}
                    onChange={(e) => setScholarSearchQuery(e.target.value)}
                    placeholder="بحث في المشايخ..."
                    className="w-full bg-neutral-900 border border-neutral-800 text-white px-3 py-2 pr-9 rounded-xl text-xs focus:outline-none focus:border-white transition-colors"
                  />
                  <Search className="absolute right-3 top-2.5 w-3.5 h-3.5 text-neutral-500" />
                </div>
              )}

              {/* Scholars List (Scrollable) */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 custom-scrollbar">
                {filteredScholars.length > 0 ? (
                  filteredScholars.map((sch) => {
                    const isSelected = currentScholar?.id === sch.id;
                    const count = getSeries().filter(s => s.scholarId === sch.id).length;

                    return (
                      <motion.button
                        key={sch.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          handleSelectExistingScholar(sch);
                          setIsSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-2xl transition-all text-right border ${isSelected
                          ? 'bg-neutral-900 border-white/40 text-white shadow-md'
                          : 'bg-transparent border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900/50'
                          }`}
                      >
                        <div className="relative w-10 h-10 rounded-full p-0.5 shrink-0 bg-neutral-800 border border-neutral-700">
                          <div className="w-full h-full rounded-full overflow-hidden bg-black">
                            <ScholarAvatar src={sch.avatar} name={sch.name} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs truncate text-white">{sch.name}</div>
                          <div className="text-[11px] text-neutral-500 truncate">{sch.specialty || 'عالم وداعية'}</div>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${isSelected ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-500 border border-neutral-800'
                          }`}>
                          {count}
                        </span>
                      </motion.button>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-neutral-500 text-xs">
                    لم يتم العثور على مشايخ
                  </div>
                )}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT AREA */}
      <main className="w-full space-y-6">
          {currentScholar ? (
            <>
              {/* Scholar Management Card (Active Scholar) */}
              <motion.div
                key={currentScholar.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="bg-neutral-950 p-6 sm:p-7 rounded-3xl border border-neutral-800/90 shadow-xl space-y-6"
              >
                {/* Top Section: Avatar & Full Info */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-right">
                  {/* Beautiful Circular Avatar */}
                  <div className="relative w-24 h-24 rounded-full p-1 bg-gradient-to-b from-amber-500/40 via-neutral-700 to-black shadow-2xl shrink-0">
                    <div className="w-full h-full rounded-full overflow-hidden bg-black border-2 border-neutral-700">
                      <ScholarAvatar src={currentScholar.avatar} name={currentScholar.name} />
                    </div>
                  </div>

                  {/* Text Details with full available width */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-center sm:justify-start gap-3 flex-wrap">
                      <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{currentScholar.name}</h2>
                      <span className="text-xs bg-neutral-900 border border-neutral-800 text-neutral-300 px-3 py-1 rounded-full font-medium">
                        {currentScholar.specialty || 'عالم وداعية'}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-neutral-400 max-w-3xl leading-relaxed">
                      {currentScholar.bio || 'لا توجد نبذة تعريفية.'}
                    </p>

                    {channelInfo && (
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-5 pt-1 text-xs text-neutral-400">
                        <span>المشتركين: <strong className="text-neutral-200">{Number(channelInfo.statistics?.subscriberCount || 0).toLocaleString()}</strong></span>
                        <span>إجمالي الفيديوهات: <strong className="text-neutral-200">{Number(channelInfo.statistics?.videoCount || 0).toLocaleString()}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Section: The 5 Action Buttons in a dedicated, spacious bar */}
                <div className="pt-4 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-3">
                  {/* Primary Content Actions */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* 1. تجميع سلسلة مخصصة (Gold) */}
                    <button
                      onClick={() => setIsCurateModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all shadow-md shadow-amber-500/20 active:scale-[0.98]"
                    >
                      <Layers size={14} />
                      <span>تجميع سلسلة مخصصة </span>
                    </button>

                    {/* 2. إضافة محتوى يدوي (White) */}
                    <button
                      onClick={() => setIsAddContentModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs transition-all shadow-md active:scale-[0.98]"
                    >
                      <Plus size={14} />
                      <span>إضافة محتوى ➕</span>
                    </button>
                  </div>

                  {/* Secondary Management Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* 3. تعديل البيانات */}
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-200 text-xs font-bold transition-all shadow-sm"
                    >
                      <Edit3 size={14} />
                      <span>تعديل البيانات</span>
                    </button>

                    {/* 4. دمج (يظهر فقط إذا كان هناك مشايخ مكررين) */}
                    {existingScholars.length > 1 && (
                      <button
                        onClick={() => setIsMergeModalOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-neutral-900 hover:bg-amber-500/10 border border-neutral-800 hover:border-amber-500/30 text-neutral-300 hover:text-amber-300 text-xs font-bold transition-all shadow-sm"
                        title="دمج هذا البروفايل في شيخ آخر لحل مشكلة التكرار"
                      >
                        <GitMerge size={14} />
                        <span>دمج</span>
                      </button>
                    )}

                    {/* 5. حذف */}
                    <button
                      onClick={() => handleDeleteScholar(currentScholar.id, currentScholar.name)}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-neutral-900 hover:bg-red-500/10 border border-neutral-800 hover:border-red-500/30 text-neutral-400 hover:text-red-400 text-xs font-bold transition-all shadow-sm"
                      title="حذف هذا الشيخ من المنصة"
                    >
                      <Trash2 size={14} />
                      <span>حذف 🗑️</span>
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Scholar Sub-Tabs Navigation & Content */}
              <div className="space-y-6">
                {/* Tabs Bar */}
                <div className="flex flex-wrap items-center gap-2 border-b border-neutral-800 pb-px">
                  <button
                    type="button"
                    onClick={() => setActiveScholarTab('approved')}
                    className={`relative flex items-center gap-2.5 px-5 py-3 rounded-t-2xl font-bold text-xs transition-all overflow-hidden ${activeScholarTab === 'approved'
                      ? 'text-white'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40'
                      }`}
                  >
                    {activeScholarTab === 'approved' && (
                      <motion.div
                        layoutId="activeScholarTabIndicator"
                        className="absolute inset-0 bg-neutral-900 border-b-2 border-amber-400 -z-0"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2.5">
                      <Layers size={15} className={activeScholarTab === 'approved' ? 'text-amber-400' : ''} />
                      <span>السلاسل المعتمدة والمثبتة للشيخ</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${activeScholarTab === 'approved' ? 'bg-amber-400 text-black' : 'bg-neutral-800 text-neutral-400'
                        }`}>
                        {scholarSavedSeries.length}
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveScholarTab('youtube')}
                    className={`relative flex items-center gap-2.5 px-5 py-3 rounded-t-2xl font-bold text-xs transition-all overflow-hidden ${activeScholarTab === 'youtube'
                      ? 'text-white'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40'
                      }`}
                  >
                    {activeScholarTab === 'youtube' && (
                      <motion.div
                        layoutId="activeScholarTabIndicator"
                        className="absolute inset-0 bg-neutral-900 border-b-2 border-amber-400 -z-0"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2.5">
                      <Play size={15} className={activeScholarTab === 'youtube' ? 'text-amber-400' : ''} />
                      <span>استيراد محتوى YouTube</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${activeScholarTab === 'youtube' ? 'bg-amber-400 text-black' : 'bg-neutral-800 text-neutral-400'
                        }`}>
                        {playlists.length + channelVideos.length + channelShorts.length + channelPodcasts.length + channelPosts.length}
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveScholarTab('manual')}
                    className={`relative flex items-center gap-2.5 px-5 py-3 rounded-t-2xl font-bold text-xs transition-all overflow-hidden ${activeScholarTab === 'manual'
                      ? 'text-white'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40'
                      }`}
                  >
                    {activeScholarTab === 'manual' && (
                      <motion.div
                        layoutId="activeScholarTabIndicator"
                        className="absolute inset-0 bg-neutral-900 border-b-2 border-amber-400 -z-0"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2.5">
                      <Send size={15} className={activeScholarTab === 'manual' ? 'text-amber-400' : ''} />
                      <span>محتوى التيليجرام والصوتيات والكتب</span>
                    </span>
                  </button>
                </div>

                {/* Tabs Content with Smooth Transition */}
                <AnimatePresence mode="wait">
                  {/* TAB 1: Approved / Curated Series */}
                  {activeScholarTab === 'approved' && (
                    <motion.div
                      key="approved"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="space-y-5"
                    >
                    {/* Header and Filter Pills */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-neutral-950/80 p-4 rounded-2xl border border-neutral-800/80">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-neutral-400 ml-1">تصفية حسب:</span>

                        <button
                          onClick={() => setSeriesFilter('all')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${seriesFilter === 'all'
                            ? 'bg-white text-black shadow-sm'
                            : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                        >
                          الكل ({scholarSavedSeries.length})
                        </button>

                        <button
                          onClick={() => setSeriesFilter('curated')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${seriesFilter === 'curated'
                            ? 'bg-amber-500 text-black shadow-sm'
                            : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                        >
                          <Layers size={12} />
                          <span>مجمعة({scholarSavedSeries.filter(s => s.isCurated).length})</span>
                        </button>

                        <button
                          onClick={() => setSeriesFilter('youtube')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${seriesFilter === 'youtube'
                            ? 'bg-red-600 text-white shadow-sm'
                            : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                        >
                          <Play size={11} fill="currentColor" />
                          <span>يوتيوب ({scholarSavedSeries.filter(s => !s.isCurated && (s.source === 'youtube' || !s.source)).length})</span>
                        </button>

                        <button
                          onClick={() => setSeriesFilter('standalone')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${seriesFilter === 'standalone'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                        >
                          <Film size={12} />
                          <span>محاضرات عامة ({scholarSavedSeries.filter(s => s.type === 'standalone').length})</span>
                        </button>

                        <button
                          onClick={() => setSeriesFilter('shorts')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${seriesFilter === 'shorts'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                        >
                          <Smartphone size={12} />
                          <span>مقاطع قصيرة ({scholarSavedSeries.filter(s => s.type === 'shorts').length})</span>
                        </button>

                        <button
                          onClick={() => setSeriesFilter('telegram')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${seriesFilter === 'telegram'
                            ? 'bg-sky-500 text-white shadow-sm'
                            : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                        >
                          <Send size={11} />
                          <span>تيليجرام ({scholarSavedSeries.filter(s => s.source === 'telegram' || s.url?.includes('t.me')).length})</span>
                        </button>

                        <button
                          onClick={() => setSeriesFilter('audio')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${seriesFilter === 'audio'
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                        >
                          <Headphones size={12} />
                          <span>صوتيات ({scholarSavedSeries.filter(s => s.type === 'audio').length})</span>
                        </button>

                        <button
                          onClick={() => setSeriesFilter('podcast')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${seriesFilter === 'podcast'
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                        >
                          <Mic size={12} />
                          <span>بودكاست ({scholarSavedSeries.filter(s => s.type === 'podcast').length})</span>
                        </button>

                        <button
                          onClick={() => setSeriesFilter('course')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${seriesFilter === 'course'
                            ? 'bg-amber-500 text-black shadow-sm'
                            : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                        >
                          <GraduationCap size={12} />
                          <span>دورات حالية ({scholarSavedSeries.filter(s => s.type === 'course').length})</span>
                        </button>

                        <button
                          onClick={() => setSeriesFilter('book')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${seriesFilter === 'book'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                        >
                          <BookOpen size={12} />
                          <span>كتب ({scholarSavedSeries.filter(s => s.type === 'book' || s.source === 'pdf').length})</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsCurateModalOpen(true)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all shadow-sm"
                        >
                          <Plus size={14} />
                          <span>تجميع وترتيب سلسلة جديدة</span>
                        </button>
                      </div>
                    </div>

                    {/* Cards Grid */}
                    {scholarSavedSeries.filter(s => {
                      if (seriesFilter === 'curated') return s.isCurated || s.type === 'curated';
                      if (seriesFilter === 'youtube') return !s.isCurated && (s.source === 'youtube' || !s.source);
                      if (seriesFilter === 'standalone') return s.type === 'standalone';
                      if (seriesFilter === 'shorts') return s.type === 'shorts';
                      if (seriesFilter === 'telegram') return s.source === 'telegram' || s.url?.includes('t.me');
                      if (seriesFilter === 'podcast') return s.type === 'podcast';
                      if (seriesFilter === 'course') return s.type === 'course';
                      if (seriesFilter === 'audio') return s.type === 'audio';
                      if (seriesFilter === 'book') return s.type === 'book' || s.source === 'pdf';
                      return true;
                    }).length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
                        {scholarSavedSeries.filter(s => {
                          if (seriesFilter === 'curated') return s.isCurated || s.type === 'curated';
                          if (seriesFilter === 'youtube') return !s.isCurated && (s.source === 'youtube' || !s.source);
                          if (seriesFilter === 'standalone') return s.type === 'standalone';
                          if (seriesFilter === 'shorts') return s.type === 'shorts';
                          if (seriesFilter === 'telegram') return s.source === 'telegram' || s.url?.includes('t.me');
                          if (seriesFilter === 'podcast') return s.type === 'podcast';
                          if (seriesFilter === 'course') return s.type === 'course';
                          if (seriesFilter === 'audio') return s.type === 'audio';
                          if (seriesFilter === 'book') return s.type === 'book' || s.source === 'pdf';
                          return true;
                        }).map((s) => (
                          <div
                            key={s.id}
                            className="group bg-neutral-950/80 rounded-2xl border border-neutral-800/80 hover:border-neutral-700 overflow-hidden flex flex-col justify-between transition-all"
                          >
                            <div>
                              {/* Thumbnail & Badges */}
                              <div className="relative aspect-video bg-neutral-900 overflow-hidden">
                                <img
                                  src={s.thumbnail}
                                  alt={s.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 flex-wrap">
                                  {s.isCurated && (
                                    <span className="bg-amber-500/95 text-black px-2 py-0.5 rounded-md text-[10px] font-extrabold flex items-center gap-1 shadow-sm">
                                      <Layers size={10} />
                                      <span>سلسلة مجمعة </span>
                                    </span>
                                  )}
                                  {s.type === 'standalone' ? (
                                    <span className="bg-emerald-600/90 text-white px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 shadow-sm">
                                      <Film size={10} />
                                      <span>محاضرة عامة</span>
                                    </span>
                                  ) : s.type === 'shorts' ? (
                                    <span className="bg-rose-600/90 text-white px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 shadow-sm">
                                      <Smartphone size={10} />
                                      <span>مقطع قصير</span>
                                    </span>
                                  ) : s.type === 'podcast' ? (
                                    <span className="bg-purple-600/90 text-white px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 shadow-sm">
                                      <Mic size={10} />
                                      <span>بودكاست</span>
                                    </span>
                                  ) : s.source === 'telegram' || s.url?.includes('t.me') ? (
                                    <span className="bg-sky-500/90 text-white px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 shadow-sm">
                                      <Send size={10} />
                                      <span>تيليجرام</span>
                                    </span>
                                  ) : s.type === 'book' || s.source === 'pdf' ? (
                                    <span className="bg-emerald-600/90 text-white px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 shadow-sm">
                                      <BookOpen size={10} />
                                      <span>كتاب</span>
                                    </span>
                                  ) : s.type === 'audio' ? (
                                    <span className="bg-amber-600/90 text-white px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 shadow-sm">
                                      <Headphones size={10} />
                                      <span>صوتي</span>
                                    </span>
                                  ) : (
                                    <span className="bg-red-600/90 text-white px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 shadow-sm">
                                      <Play size={10} fill="currentColor" />
                                      <span>يوتيوب</span>
                                    </span>
                                  )}
                                </div>

                                <div className="absolute bottom-2.5 right-2.5 bg-black/80 px-2 py-0.5 rounded text-[10px] font-bold text-white flex items-center gap-1 border border-white/10">
                                  <ListVideo size={11} />
                                  <span>{s.videos?.length || s.videoCount} دروس</span>
                                </div>
                              </div>

                              {/* Title & Description */}
                              <div className="p-4 space-y-2">
                                <h4 className="font-bold text-sm text-white line-clamp-1 group-hover:text-amber-200 transition-colors">
                                  {s.title}
                                </h4>
                                <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                                  {s.description || 'لا يتوفر وصف.'}
                                </p>
                                {s.videos && s.videos.length > 0 && (
                                  <div className="pt-2 border-t border-neutral-900 text-[11px] text-neutral-400 line-clamp-1">
                                    أول درس: <span className="text-neutral-200 font-medium">{s.videos[0].title}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Footer Actions: Section Selector & Delete & Link */}
                            <div className="p-3 bg-neutral-900/50 border-t border-neutral-800/80 flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-neutral-400 font-bold">القسم:</span>
                                <select
                                  value={s.type}
                                  onChange={(e) => handleUpdateSeriesType(s.id, e.target.value as any)}
                                  className="bg-neutral-900 border border-neutral-800 text-neutral-200 text-[11px] font-bold rounded-lg px-2 py-1 focus:outline-none focus:border-white transition-colors cursor-pointer"
                                  title="تغيير القسم الذي تظهر فيه هذه السلسلة في بروفايل الشيخ"
                                >
                                  <option value="visual">شروحات مرئية</option>
                                  <option value="standalone">محاضرات ومقاطع عامة</option>
                                  <option value="shorts">المقاطع القصيرة (Shorts)</option>
                                  <option value="podcast">بودكاست</option>
                                  <option value="course">دورات حالية</option>
                                  <option value="curated">سلاسل مجمعة</option>
                                  <option value="audio">شروحات صوتية</option>
                                  <option value="book">كتب ومصنفات</option>
                                </select>
                              </div>

                              <div className="flex items-center gap-2">
                                {(s.source === 'telegram' || s.url?.includes('t.me')) && (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewTelegram({ url: s.url || '', title: s.title })}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 hover:text-white border border-sky-500/30 transition-all text-xs font-bold"
                                    title="تشغيل محتوى تيليجرام مدمجاً داخل المنصة"
                                  >
                                    <Send size={11} />
                                    <span>تشغيل مدمج</span>
                                  </button>
                                )}
                                {s.url && (
                                  <a
                                    href={s.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-all text-xs"
                                    title="فتح الرابط"
                                  >
                                    <ExternalLink size={13} />
                                  </a>
                                )}
                                <button
                                  onClick={() => handleDeleteSeries(s.id, s.title)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 transition-all text-xs font-semibold"
                                  title="حذف هذه السلسلة من صفحة الشيخ"
                                >
                                  <Trash2 size={13} />
                                  <span>حذف</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 px-6 rounded-2xl border border-dashed border-neutral-800 bg-neutral-950/40 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500 mx-auto">
                          <Layers size={22} />
                        </div>
                        <h4 className="text-sm font-bold text-neutral-300">لا توجد سلاسل مطابقة لهذا التصنيف</h4>
                        <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
                          يمكنك استخدام زر <strong>"تجميع وترتيب سلسلة جديدة"</strong> بالأعلى أو استيراد قوائم يوتيوب وتيليجرام من التبويبات المجاورة.
                        </p>
                      </div>
                    )}
                    </motion.div>
                  )}

                  {/* TAB 2: YouTube Playlists & Multi-Channel Importer */}
                  {activeScholarTab === 'youtube' && (
                    <motion.div
                      key="youtube"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="space-y-6"
                    >
                      {/* 1. Top Universal Search Bar */}
                      <div className="p-5 sm:p-6 rounded-3xl bg-neutral-950 border border-neutral-800 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-red-600/10 border border-red-600/20 flex items-center justify-center text-red-500 shadow-inner">
                              <Play size={20} />
                            </div>
                            <div>
                              <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <span>مستكشف ومستورد محتوى YouTube الشامل</span>
                                <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-full shadow-sm">Universal Search</span>
                              </h3>
                              <p className="text-xs text-neutral-400">
                                الصق أي رابط من يوتيوب هنا (رابط قناة @handle، قائمة تشغيل Playlist، مقطع قصير Short، فيديو فردي، بودكاست، أو منشور)
                              </p>
                            </div>
                          </div>

                          {activeImportSourceChannel && (
                            <div className="flex items-center gap-3 bg-neutral-900 px-3.5 py-2 rounded-2xl border border-neutral-800">
                              <img
                                src={activeImportSourceChannel.thumbnail || activeImportSourceChannel.avatar || currentScholar?.avatar}
                                alt={activeImportSourceChannel.title}
                                className="w-7 h-7 rounded-full object-cover border border-neutral-700"
                              />
                              <div className="text-right">
                                <div className="text-xs font-bold text-white line-clamp-1">{activeImportSourceChannel.title}</div>
                                <div className="text-[10px] text-neutral-400">المصدر النشط الحالي</div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Search Input Form */}
                        <form onSubmit={handleUniversalYoutubeSearch} className="flex flex-col sm:flex-row gap-2.5 pt-1">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={youtubeSearchInput}
                              onChange={(e) => setYoutubeSearchInput(e.target.value)}
                              placeholder="الصق أي رابط من YouTube هنا (مثال: @handle، رابط قائمة list=، رابط فيديو watch?v=، مقطع shorts/، بودكاست، أو منشور)..."
                              className="w-full bg-neutral-900 border border-neutral-800 text-white px-4 py-3 pr-11 rounded-2xl focus:outline-none focus:border-red-500 text-xs transition-colors shadow-inner"
                            />
                            <Search className="absolute right-4 top-3.5 w-4 h-4 text-neutral-400" />
                            {youtubeSearchInput && (
                              <button
                                type="button"
                                onClick={() => setYoutubeSearchInput('')}
                                className="absolute left-4 top-3 text-neutral-500 hover:text-white transition-colors"
                              >
                                <X size={16} />
                              </button>
                            )}
                          </div>
                          <button
                            type="submit"
                            disabled={isSearchingYoutube || !youtubeSearchInput.trim()}
                            className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs disabled:opacity-40 transition-all flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-red-600/20 active:scale-95"
                          >
                            {isSearchingYoutube ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            <span>فحص واستيراد المحتوى</span>
                          </button>
                        </form>

                        {youtubeSearchError && (
                          <p className="text-xs text-red-400 font-medium bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl">
                            {youtubeSearchError}
                          </p>
                        )}

                        {/* Supported Types Tags */}
                        <div className="flex items-center gap-2 flex-wrap text-[11px] text-neutral-400 pt-0.5">
                          <span className="font-bold text-neutral-500">يدعم النظام:</span>
                          <span className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300">📺 قناة كاملة (@handle)</span>
                          <span className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300">📋 قائمة تشغيل (Playlist)</span>
                          <span className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300">📱 مقاطع قصيرة (Shorts)</span>
                          <span className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300">🎙️ برامج البودكاست</span>
                          <span className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300">🎞️ فيديوهات فردية</span>
                          <span className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300">💬 منشورات القناة (Community)</span>
                        </div>
                      </div>

                      {/* 2. YouTube 5-Sub-Tabs Switcher (مطابق لتصميم تابات قنوات YouTube) */}
                      <div className="flex flex-wrap items-center justify-between gap-4 p-2.5 bg-neutral-950 rounded-2xl border border-neutral-800 shadow-xl">
                        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none w-full sm:w-auto">
                          {/* 1. Playlists */}
                          <button
                            type="button"
                            onClick={() => setYoutubeSubTab('playlists')}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                              youtubeSubTab === 'playlists'
                                ? 'bg-white text-black shadow-lg scale-[1.02]'
                                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                            }`}
                          >
                            <ListVideo size={16} className={youtubeSubTab === 'playlists' ? 'text-black' : 'text-neutral-400'} />
                            <span>قوائم التشغيل (Playlists)</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                              youtubeSubTab === 'playlists' ? 'bg-black text-white' : 'bg-neutral-800 text-neutral-300'
                            }`}>
                              {playlists.length}
                            </span>
                          </button>

                          {/* 2. Videos */}
                          <button
                            type="button"
                            onClick={() => {
                              setYoutubeSubTab('videos');
                              if (channelVideos.length === 0 && currentScholar) handleLoadChannelVideos();
                            }}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                              youtubeSubTab === 'videos'
                                ? 'bg-white text-black shadow-lg scale-[1.02]'
                                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                            }`}
                          >
                            <Film size={16} className={youtubeSubTab === 'videos' ? 'text-black' : 'text-neutral-400'} />
                            <span>الفيديوهات الفردية (Videos)</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                              youtubeSubTab === 'videos' ? 'bg-black text-white' : 'bg-neutral-800 text-neutral-300'
                            }`}>
                              {channelVideos.length}
                            </span>
                          </button>

                          {/* 3. Shorts */}
                          <button
                            type="button"
                            onClick={() => {
                              setYoutubeSubTab('shorts');
                              if (channelShorts.length === 0 && currentScholar) handleLoadChannelVideos();
                            }}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                              youtubeSubTab === 'shorts'
                                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 scale-[1.02]'
                                : 'text-neutral-400 hover:text-rose-400 hover:bg-neutral-900'
                            }`}
                          >
                            <Smartphone size={16} className={youtubeSubTab === 'shorts' ? 'text-white' : 'text-rose-400'} />
                            <span>المقاطع القصيرة (Shorts)</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                              youtubeSubTab === 'shorts' ? 'bg-black/40 text-white' : 'bg-neutral-800 text-neutral-300'
                            }`}>
                              {channelShorts.length}
                            </span>
                          </button>

                          {/* 4. Podcasts */}
                          <button
                            type="button"
                            onClick={() => setYoutubeSubTab('podcasts')}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                              youtubeSubTab === 'podcasts'
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 scale-[1.02]'
                                : 'text-neutral-400 hover:text-purple-400 hover:bg-neutral-900'
                            }`}
                          >
                            <Mic size={16} className={youtubeSubTab === 'podcasts' ? 'text-white' : 'text-purple-400'} />
                            <span>البودكاست (Podcasts)</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                              youtubeSubTab === 'podcasts' ? 'bg-black/40 text-white' : 'bg-neutral-800 text-neutral-300'
                            }`}>
                              {channelPodcasts.length}
                            </span>
                          </button>

                          {/* 5. Community Posts */}
                          <button
                            type="button"
                            onClick={() => setYoutubeSubTab('posts')}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                              youtubeSubTab === 'posts'
                                ? 'bg-amber-500 text-black shadow-lg scale-[1.02]'
                                : 'text-neutral-400 hover:text-amber-400 hover:bg-neutral-900'
                            }`}
                          >
                            <MessageSquare size={16} className={youtubeSubTab === 'posts' ? 'text-black' : 'text-amber-400'} />
                            <span>المنشورات والفوائد (Community)</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                              youtubeSubTab === 'posts' ? 'bg-black text-amber-300' : 'bg-neutral-800 text-neutral-300'
                            }`}>
                              {channelPosts.length}
                            </span>
                          </button>
                        </div>

                        {/* Search Filter inside this sub-tab */}
                        <div className="relative w-full sm:w-64">
                          <input
                            type="text"
                            value={innerFilterQuery}
                            onChange={(e) => setInnerFilterQuery(e.target.value)}
                            placeholder="بحث وتصفية في هذا القسم..."
                            className="w-full bg-neutral-900 border border-neutral-800 text-white px-3.5 py-1.5 pr-8 rounded-xl text-xs focus:outline-none focus:border-white transition-colors"
                          />
                          <Search size={13} className="absolute right-2.5 top-2.5 text-neutral-500" />
                        </div>
                      </div>

                      {/* 3. Sub-Tab Batch Action Toolbar */}
                      {youtubeSubTab === 'playlists' && playlists.length > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-neutral-900/60 rounded-2xl border border-neutral-800/80">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-400">استيراد جماعي لكافة القوائم إلى:</span>
                            <select
                              value={batchPlaylistsTarget}
                              onChange={(e) => setBatchPlaylistsTarget(e.target.value as any)}
                              className="bg-neutral-950 border border-neutral-700 text-white text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-white"
                            >
                              <option value="visual">🎥 الشروحات والسلاسل المرئية (افتراضي)</option>
                              <option value="course">🎓 الدورات الحالية</option>
                              <option value="podcast">🎙️ البودكاست واللقاءات</option>
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleBatchImportCurrentTab(batchPlaylistsTarget)}
                            className="px-4 py-1.5 bg-white text-black hover:bg-neutral-200 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                          >
                            <Download size={13} />
                            <span>استيراد جميع القوائم ({playlists.length}) دفعة واحدة</span>
                          </button>
                        </div>
                      )}

                      {youtubeSubTab === 'videos' && channelVideos.length > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-neutral-900/60 rounded-2xl border border-neutral-800/80">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-400">استيراد جماعي لكافة الفيديوهات إلى:</span>
                            <select
                              value={batchVideosTarget}
                              onChange={(e) => setBatchVideosTarget(e.target.value as any)}
                              className="bg-neutral-950 border border-neutral-700 text-white text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-white"
                            >
                              <option value="standalone">🎞️ المحاضرات والمقاطع العامة (افتراضي)</option>
                              <option value="visual">🎥 الشروحات المرئية</option>
                              <option value="course">🎓 الدورات الحالية</option>
                              <option value="podcast">🎙️ بودكاست ولقاءات</option>
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleBatchImportCurrentTab(batchVideosTarget)}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                          >
                            <Download size={13} />
                            <span>استيراد جميع الفيديوهات ({channelVideos.length}) دفعة واحدة</span>
                          </button>
                        </div>
                      )}

                      {youtubeSubTab === 'shorts' && channelShorts.length > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-neutral-900/60 rounded-2xl border border-neutral-800/80">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-400">استيراد جماعي للمقاطع القصيرة إلى:</span>
                            <select
                              value={batchShortsTarget}
                              onChange={(e) => setBatchShortsTarget(e.target.value as any)}
                              className="bg-neutral-950 border border-neutral-700 text-white text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-white"
                            >
                              <option value="shorts">📱 المقاطع القصيرة Shorts (افتراضي)</option>
                              <option value="standalone">🎞️ محاضرات ومقاطع عامة</option>
                              <option value="visual">🎥 شروحات وسلاسل مرئية</option>
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleBatchImportCurrentTab(batchShortsTarget)}
                            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                          >
                            <Smartphone size={13} />
                            <span>استيراد جميع المقاطع القصيرة ({channelShorts.length}) دفعة واحدة</span>
                          </button>
                        </div>
                      )}

                      {youtubeSubTab === 'podcasts' && channelPodcasts.length > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-neutral-900/60 rounded-2xl border border-neutral-800/80">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-400">استيراد جماعي لبرامج البودكاست إلى:</span>
                            <select
                              value={batchPodcastsTarget}
                              onChange={(e) => setBatchPodcastsTarget(e.target.value as any)}
                              className="bg-neutral-950 border border-neutral-700 text-white text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-white"
                            >
                              <option value="podcast">🎙️ البودكاست واللقاءات (افتراضي)</option>
                              <option value="visual">🎥 شروحات وسلاسل مرئية</option>
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleBatchImportCurrentTab(batchPodcastsTarget)}
                            className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                          >
                            <Mic size={13} />
                            <span>استيراد جميع برامج البودكاست ({channelPodcasts.length}) دفعة واحدة</span>
                          </button>
                        </div>
                      )}

                      {youtubeSubTab === 'posts' && (
                        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-neutral-900/60 rounded-2xl border border-neutral-800/80">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                              <MessageSquare size={14} />
                              <span>منشورات منتدى يوتيوب (Community Posts)</span>
                            </span>
                            <span className="text-[11px] text-neutral-400">
                              (تتضمن الفوائد، الاقتباسات، الصور، والإعلانات المنشورة في منتدى القناة)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleRefreshCommunityPosts}
                              disabled={isLoadingPosts}
                              className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-200 hover:text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 border border-neutral-700"
                            >
                              <RefreshCw size={13} className={isLoadingPosts ? 'animate-spin text-amber-400' : 'text-neutral-400'} />
                              <span>{isLoadingPosts ? 'جاري التحديث...' : 'تحديث منشورات القناة 🔄'}</span>
                            </button>
                            {channelPosts.length > 0 && currentScholar && (
                              <button
                                type="button"
                                onClick={() => {
                                  let count = 0;
                                  channelPosts.forEach(p => {
                                    const isSaved = scholarSavedSeries.find(s => s.id === `post_${p.id}`);
                                    if (!isSaved) {
                                      handleUniversalImport(p, 'post', 'standalone');
                                      count++;
                                    }
                                  });
                                  showNotification(`تم حفظ (${count}) فائدة ومنشور في ملف الشيخ بنجاح!`);
                                }}
                                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                              >
                                <Plus size={13} />
                                <span>حفظ جميع المنشورات كفوائد ({channelPosts.length})</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 4. Sub-Tab Content Views */}

                      {/* Mode 1: Playlists View */}
                      {youtubeSubTab === 'playlists' && (
                        <div className="space-y-4">
                          {playlists.length > 0 ? (
                            <>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                                {playlists
                                  .filter(p => (p.snippet?.title || '').toLowerCase().includes(innerFilterQuery.toLowerCase()))
                                  .map((playlist) => {
                                    const matchedSeries = scholarSavedSeries.find(s =>
                                      s.id === playlist.id ||
                                      s.title.trim().toLowerCase() === playlist.snippet?.title?.trim().toLowerCase()
                                    );
                                    return (
                                      <PlaylistCard
                                        key={playlist.id}
                                        playlist={playlist}
                                        scholarId={currentScholar?.id}
                                        isAlreadyImported={!!matchedSeries}
                                        existingSeries={matchedSeries}
                                        onImportSuccess={() => currentScholar && refreshScholarSavedSeries(currentScholar.id)}
                                        scholarSavedSeries={scholarSavedSeries}
                                        onImportSingleVideo={(video, section) => handleUniversalImport(video, video.isShort ? 'short' : 'video', section)}
                                      />
                                    );
                                  })}
                              </div>

                              {/* Infinite Scroll Sentinel for Playlists */}
                              <div ref={infiniteSentinelRef} className="py-6 flex flex-col items-center justify-center gap-2">
                                {isLoadingMorePlaylists ? (
                                  <div className="flex items-center gap-2.5 px-5 py-2.5 bg-neutral-900/80 border border-neutral-800 rounded-2xl text-xs text-neutral-300 font-bold shadow-lg">
                                    <Loader2 size={16} className="animate-spin text-amber-400" />
                                    <span>جاري جلب قوائم تشغيل إضافية تلقائياً... ⚡</span>
                                  </div>
                                ) : hasMorePlaylists ? (
                                  <div className="text-center space-y-2">
                                    <div className="text-xs text-neutral-500 flex items-center justify-center gap-1.5">
                                      <ArrowDown size={13} className="text-amber-400 animate-bounce" />
                                      <span>مرر لأسفل لتحميل قوائم إضافية تلقائياً</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={handleLoadMorePlaylists}
                                      className="text-[11px] px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-all"
                                    >
                                      أو انقر هنا لتحميل دفعة (+50 قائمة)
                                    </button>
                                  </div>
                                ) : (
                                  <div className="text-xs text-neutral-500 flex items-center gap-1.5 py-2">
                                    <CheckCircle2 size={13} className="text-emerald-500" />
                                    <span>تم استعراض جميع قوائم التشغيل المتوفرة ({playlists.length} قائمة)</span>
                                  </div>
                                )}
                              </div>
                            </>
                          ) : (
                            <div className="py-16 text-center text-neutral-500 text-xs border border-dashed border-neutral-800 rounded-3xl space-y-2">
                              <ListVideo size={28} className="mx-auto text-neutral-600 opacity-60" />
                              <p className="font-bold text-neutral-400">لم يتم العثور على قوائم تشغيل متاحة.</p>
                              <p className="text-[11px] text-neutral-500">يمكنك لصق رابط أي قائمة تشغيل في شريط البحث بالأعلى لجلبها فوراً.</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Mode 2: Standalone Videos View */}
                      {youtubeSubTab === 'videos' && (
                        <div className="space-y-4">
                          {isLoadingChannelVideos ? (
                            <div className="py-16 text-center text-neutral-400 flex flex-col items-center justify-center gap-3">
                              <Loader2 size={24} className="animate-spin text-white" />
                              <span className="text-xs">جاري فحص وجلب فيديوهات ومقاطع القناة...</span>
                            </div>
                          ) : channelVideos.length > 0 ? (
                            <>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
                              {channelVideos
                                .filter(v => (v.title || '').toLowerCase().includes(innerFilterQuery.toLowerCase()))
                                .map(v => {
                                  const isImported = scholarSavedSeries.find(s => s.id === `yt_${v.id}` || s.url?.includes(v.id));
                                  return (
                                    <div key={v.id} className="bg-neutral-950 rounded-2xl border border-neutral-800 hover:border-neutral-700 overflow-hidden flex flex-col justify-between transition-all group">
                                      <div>
                                        <div className="relative aspect-video bg-neutral-900 overflow-hidden">
                                          <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                          <div className="absolute top-2.5 right-2.5 bg-neutral-900/90 text-neutral-300 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 backdrop-blur-sm">
                                            <Film size={10} />
                                            <span>فيديو فردي</span>
                                          </div>
                                          {v.duration && (
                                            <div className="absolute bottom-2.5 right-2.5 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-neutral-300">
                                              {formatDuration(v.duration)}
                                            </div>
                                          )}
                                        </div>
                                        <div className="p-3.5 space-y-1">
                                          <h4 className="text-xs font-bold text-white line-clamp-2 leading-relaxed" title={v.title}>{v.title}</h4>
                                          {v.publishedAt && (
                                            <div className="text-[10px] text-neutral-500">{new Date(v.publishedAt).toLocaleDateString('ar-EG')}</div>
                                          )}
                                        </div>
                                      </div>

                                      <div className="p-3 bg-neutral-900/50 border-t border-neutral-800/80 flex flex-col gap-2">
                                        {isImported ? (
                                          <div className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl">
                                              <span className="flex items-center gap-1.5">
                                                <CheckCircle2 size={13} />
                                                <span>مضاف كـ {getSectionLabel(isImported.type)}</span>
                                              </span>
                                            </div>
                                            <select
                                              value={isImported.type}
                                              onChange={(e) => handleUpdateSeriesType(isImported.id, e.target.value as any)}
                                              className="w-full bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300 rounded-lg px-2 py-1 focus:outline-none"
                                              title="نقل إلى قسم آخر"
                                            >
                                              <option value="standalone">نقل إلى: محاضرات عامة</option>
                                              <option value="visual">نقل إلى: شروحات مرئية</option>
                                              <option value="course">نقل إلى: دورات حالية</option>
                                              <option value="podcast">نقل إلى: بودكاست</option>
                                              <option value="shorts">نقل إلى: مقاطع قصيرة</option>
                                            </select>
                                          </div>
                                        ) : (
                                          <div className="space-y-1.5">
                                            <button
                                              type="button"
                                              onClick={() => handleUniversalImport(v, 'video', 'standalone')}
                                              className="w-full py-1.5 px-3 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                                            >
                                              <Plus size={13} />
                                              <span>إضافة كـ محاضرة عامة</span>
                                            </button>
                                            <div className="flex items-center gap-1">
                                              <span className="text-[10px] text-neutral-500 shrink-0">أو إضافة كـ:</span>
                                              <select
                                                onChange={(e) => {
                                                  if (e.target.value) {
                                                    handleUniversalImport(v, 'video', e.target.value as any);
                                                    e.target.value = '';
                                                  }
                                                }}
                                                defaultValue=""
                                                className="flex-1 bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-300 rounded-lg px-1.5 py-1 focus:outline-none"
                                              >
                                                <option value="" disabled>اختر قسم...</option>
                                                <option value="visual">🎥 شروحات مرئية</option>
                                                <option value="course">🎓 دورات حالية</option>
                                                <option value="podcast">🎙️ بودكاست</option>
                                                <option value="shorts">📱 مقاطع قصيرة</option>
                                              </select>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>

                            {/* Infinite Scroll Sentinel for Videos */}
                            <div ref={infiniteSentinelRef} className="py-6 flex flex-col items-center justify-center gap-2">
                              {isLoadingMoreUploads ? (
                                <div className="flex items-center gap-2.5 px-5 py-2.5 bg-neutral-900/80 border border-neutral-800 rounded-2xl text-xs text-neutral-300 font-bold shadow-lg">
                                  <Loader2 size={16} className="animate-spin text-amber-400" />
                                  <span>جاري جلب دفعات فيديوهات جديدة تلقائياً... ⚡</span>
                                </div>
                              ) : hasMoreUploads ? (
                                <div className="text-center space-y-2">
                                  <div className="text-xs text-neutral-500 flex items-center justify-center gap-1.5">
                                    <ArrowDown size={13} className="text-amber-400 animate-bounce" />
                                    <span>مرر لأسفل لتحميل المزيد تلقائياً من أرشيف الفيديوهات</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={handleLoadMoreUploads}
                                    className="text-[11px] px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-all"
                                  >
                                    أو انقر هنا لتحميل دفعة (+50 فيديو)
                                  </button>
                                </div>
                              ) : (
                                <div className="text-xs text-neutral-500 flex items-center gap-1.5 py-2">
                                  <CheckCircle2 size={13} className="text-emerald-500" />
                                  <span>تم استعراض كامل الفيديوهات المتوفرة في القناة ({channelVideos.length})</span>
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                            <div className="py-16 text-center text-neutral-500 text-xs border border-dashed border-neutral-800 rounded-3xl space-y-3">
                              <Film size={28} className="mx-auto text-neutral-600 opacity-60" />
                              <p className="font-bold text-neutral-400">لم يتم جلب فيديوهات فردية بعد.</p>
                              <button
                                type="button"
                                onClick={() => handleLoadChannelVideos()}
                                className="px-4 py-2 bg-white text-black text-xs font-bold rounded-xl hover:bg-neutral-200"
                              >
                                جلب فيديوهات القناة الآن
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Mode 3: Shorts View */}
                      {youtubeSubTab === 'shorts' && (
                        <div className="space-y-4">
                          {isLoadingChannelVideos ? (
                            <div className="py-16 text-center text-neutral-400 flex flex-col items-center justify-center gap-3">
                              <Loader2 size={24} className="animate-spin text-white" />
                              <span className="text-xs">جاري فحص وجلب مقاطع Shorts...</span>
                            </div>
                          ) : channelShorts.length > 0 ? (
                            <>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
                              {channelShorts
                                .filter(v => (v.title || '').toLowerCase().includes(innerFilterQuery.toLowerCase()))
                                .map(v => {
                                  const isImported = scholarSavedSeries.find(s => s.id === `yt_${v.id}` || s.url?.includes(v.id));
                                  return (
                                    <div key={v.id} className="bg-neutral-950 rounded-2xl border border-neutral-800 hover:border-neutral-700 overflow-hidden flex flex-col justify-between transition-all group">
                                      <div>
                                        <div className="relative aspect-video bg-neutral-900 overflow-hidden">
                                          <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                          <div className="absolute top-2.5 right-2.5 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md">
                                            <Smartphone size={10} />
                                            <span>Shorts</span>
                                          </div>
                                          {v.duration && (
                                            <div className="absolute bottom-2.5 right-2.5 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-neutral-300">
                                              {formatDuration(v.duration)}
                                            </div>
                                          )}
                                        </div>
                                        <div className="p-3.5 space-y-1">
                                          <h4 className="text-xs font-bold text-white line-clamp-2 leading-relaxed" title={v.title}>{v.title}</h4>
                                          {v.publishedAt && (
                                            <div className="text-[10px] text-neutral-500">{new Date(v.publishedAt).toLocaleDateString('ar-EG')}</div>
                                          )}
                                        </div>
                                      </div>

                                      <div className="p-3 bg-neutral-900/50 border-t border-neutral-800/80 flex flex-col gap-2">
                                        {isImported ? (
                                          <div className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl">
                                              <span className="flex items-center gap-1.5">
                                                <CheckCircle2 size={13} />
                                                <span>مضاف كـ {getSectionLabel(isImported.type)}</span>
                                              </span>
                                            </div>
                                            <select
                                              value={isImported.type}
                                              onChange={(e) => handleUpdateSeriesType(isImported.id, e.target.value as any)}
                                              className="w-full bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300 rounded-lg px-2 py-1 focus:outline-none"
                                              title="نقل إلى قسم آخر"
                                            >
                                              <option value="shorts">نقل إلى: مقاطع قصيرة</option>
                                              <option value="standalone">نقل إلى: محاضرات عامة</option>
                                              <option value="visual">نقل إلى: شروحات مرئية</option>
                                              <option value="course">نقل إلى: دورات حالية</option>
                                              <option value="podcast">نقل إلى: بودكاست</option>
                                            </select>
                                          </div>
                                        ) : (
                                          <div className="space-y-1.5">
                                            <button
                                              type="button"
                                              onClick={() => handleUniversalImport(v, 'short', 'shorts')}
                                              className="w-full py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                                            >
                                              <Smartphone size={13} />
                                              <span>إضافة كـ مقطع قصير 📱</span>
                                            </button>
                                            <div className="flex items-center gap-1">
                                              <span className="text-[10px] text-neutral-500 shrink-0">أو إضافة كـ:</span>
                                              <select
                                                onChange={(e) => {
                                                  if (e.target.value) {
                                                    handleUniversalImport(v, 'short', e.target.value as any);
                                                    e.target.value = '';
                                                  }
                                                }}
                                                defaultValue=""
                                                className="flex-1 bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-300 rounded-lg px-1.5 py-1 focus:outline-none"
                                              >
                                                <option value="" disabled>اختر قسم...</option>
                                                <option value="standalone">🎞️ محاضرات عامة</option>
                                                <option value="visual">🎥 شروحات مرئية</option>
                                                <option value="course">🎓 دورات حالية</option>
                                                <option value="podcast">🎙️ بودكاست</option>
                                              </select>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>

                            {/* Infinite Scroll Sentinel for Shorts */}
                            <div ref={infiniteSentinelRef} className="py-6 flex flex-col items-center justify-center gap-2">
                              {isLoadingMoreUploads ? (
                                <div className="flex items-center gap-2.5 px-5 py-2.5 bg-neutral-900/80 border border-neutral-800 rounded-2xl text-xs text-neutral-300 font-bold shadow-lg">
                                  <Loader2 size={16} className="animate-spin text-rose-500" />
                                  <span>جاري جلب مقاطع Shorts إضافية تلقائياً... ⚡</span>
                                </div>
                              ) : hasMoreUploads ? (
                                <div className="text-center space-y-2">
                                  <div className="text-xs text-neutral-500 flex items-center justify-center gap-1.5">
                                    <ArrowDown size={13} className="text-rose-400 animate-bounce" />
                                    <span>مرر لأسفل لتحميل المزيد من مقاطع Shorts تلقائياً</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={handleLoadMoreUploads}
                                    className="text-[11px] px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-all"
                                  >
                                    أو انقر هنا لتحميل دفعة (+50 مقطع قصير)
                                  </button>
                                </div>
                              ) : (
                                <div className="text-xs text-neutral-500 flex items-center gap-1.5 py-2">
                                  <CheckCircle2 size={13} className="text-emerald-500" />
                                  <span>تم استعراض كامل المقاطع القصيرة المتوفرة في القناة ({channelShorts.length})</span>
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                            <div className="py-16 text-center text-neutral-500 text-xs border border-dashed border-neutral-800 rounded-3xl space-y-3">
                              <Smartphone size={28} className="mx-auto text-neutral-600 opacity-60" />
                              <p className="font-bold text-neutral-400">لم يتم العثور على مقاطع قصيرة Shorts بعد.</p>
                              <p className="text-[11px] text-neutral-500">يمكنك لصق رابط مقطع short في شريط البحث بالأعلى لجلبه فوراً.</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Mode 4: Podcasts View */}
                      {youtubeSubTab === 'podcasts' && (
                        <div className="space-y-4">
                          {channelPodcasts.length > 0 ? (
                            <>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                                {channelPodcasts
                                  .filter(p => (p.snippet?.title || p.title || '').toLowerCase().includes(innerFilterQuery.toLowerCase()))
                                  .map((podcast) => {
                                    const matchedSeries = scholarSavedSeries.find(s =>
                                      s.id === podcast.id ||
                                      s.title.trim().toLowerCase() === (podcast.snippet?.title || podcast.title || '').trim().toLowerCase()
                                    );
                                    return (
                                      <PlaylistCard
                                        key={podcast.id}
                                        playlist={podcast}
                                        scholarId={currentScholar?.id}
                                        isAlreadyImported={!!matchedSeries}
                                        existingSeries={matchedSeries}
                                        onImportSuccess={() => currentScholar && refreshScholarSavedSeries(currentScholar.id)}
                                        scholarSavedSeries={scholarSavedSeries}
                                        onImportSingleVideo={(video, section) => handleUniversalImport(video, video.isShort ? 'short' : 'video', section)}
                                      />
                                    );
                                  })}
                              </div>

                              {/* Infinite Scroll Sentinel for Podcasts */}
                              <div ref={infiniteSentinelRef} className="py-6 flex flex-col items-center justify-center gap-2">
                                {isLoadingMorePlaylists ? (
                                  <div className="flex items-center gap-2.5 px-5 py-2.5 bg-neutral-900/80 border border-neutral-800 rounded-2xl text-xs text-neutral-300 font-bold shadow-lg">
                                    <Loader2 size={16} className="animate-spin text-purple-400" />
                                    <span>جاري فحص وجلب برامج بودكاست إضافية تلقائياً... ⚡</span>
                                  </div>
                                ) : hasMorePlaylists ? (
                                  <div className="text-center space-y-2">
                                    <div className="text-xs text-neutral-500 flex items-center justify-center gap-1.5">
                                      <ArrowDown size={13} className="text-purple-400 animate-bounce" />
                                      <span>مرر لأسفل لتحميل المزيد من برامج البودكاست تلقائياً</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={handleLoadMorePlaylists}
                                      className="text-[11px] px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-all"
                                    >
                                      أو انقر هنا لتحميل دفعة
                                    </button>
                                  </div>
                                ) : (
                                  <div className="text-xs text-neutral-500 flex items-center gap-1.5 py-2">
                                    <CheckCircle2 size={13} className="text-emerald-500" />
                                    <span>تم استعراض كامل برامج البودكاست واللقاءات ({channelPodcasts.length})</span>
                                  </div>
                                )}
                              </div>
                            </>
                          ) : (
                            <div className="py-16 text-center text-neutral-500 text-xs border border-dashed border-neutral-800 rounded-3xl space-y-2">
                              <Mic size={28} className="mx-auto text-neutral-600 opacity-60" />
                              <p className="font-bold text-neutral-400">لم يتم العثور على برامج بودكاست أو لقاءات لهذه القناة.</p>
                              <p className="text-[11px] text-neutral-500">يمكنك لصق رابط أي حلقة أو قائمة بودكاست في شريط البحث بالأعلى لجلبه فوراً.</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Mode 5: Community Posts View */}
                      {youtubeSubTab === 'posts' && (
                        <div className="space-y-4">
                          {isLoadingPosts ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-3 border border-neutral-800 bg-neutral-950/60 rounded-3xl text-center">
                              <Loader2 size={36} className="animate-spin text-amber-400" />
                              <p className="text-sm font-bold text-white">جاري جلب المنشورات والفوائد من منتدى يوتيوب... 💬</p>
                              <p className="text-xs text-neutral-400">يتم استخراج النصوص الكاملة، الصور التوضيحية، وتاريخ النشر</p>
                            </div>
                          ) : channelPosts.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {channelPosts
                                .filter(p => (p.title + ' ' + (p.content || '')).toLowerCase().includes(innerFilterQuery.toLowerCase()))
                                .map(p => {
                                  const isSaved = scholarSavedSeries.find(s => s.id === `post_${p.id}`);
                                  const displayDate = p.publishedAt
                                    ? (p.publishedAt.startsWith('قبل') || p.publishedAt.includes('ago')
                                        ? p.publishedAt
                                        : (!isNaN(Date.parse(p.publishedAt)) ? new Date(p.publishedAt).toLocaleDateString('ar-EG') : p.publishedAt))
                                    : '';
                                  const avatarUrl = p.authorAvatar || p.thumbnail || currentScholar?.avatar;

                                  return (
                                    <div key={p.id} className="bg-neutral-950 rounded-2xl border border-neutral-800 hover:border-neutral-700 p-5 space-y-3.5 transition-all flex flex-col justify-between group">
                                      <div className="space-y-3">
                                        {/* Header: Author + Date + Badges */}
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="flex items-center gap-3 min-w-0">
                                            {avatarUrl ? (
                                              <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-neutral-700 shrink-0" />
                                            ) : (
                                              <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0 text-amber-400">
                                                <MessageSquare size={16} />
                                              </div>
                                            )}
                                            <div className="min-w-0">
                                              <h4 className="text-xs font-bold text-white truncate">{p.authorName || p.title || 'منشور القناة'}</h4>
                                              {displayDate && (
                                                <span className="text-[10px] text-neutral-500">{displayDate}</span>
                                              )}
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-1.5 shrink-0">
                                            {p.voteCount && (
                                              <span className="text-[10px] bg-neutral-900 border border-neutral-800 text-neutral-300 font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                                                <ThumbsUp size={10} className="text-amber-400" />
                                                <span>{p.voteCount}</span>
                                              </span>
                                            )}
                                            <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                                              <MessageSquare size={10} />
                                              <span>منشور يوتيوب</span>
                                            </span>
                                          </div>
                                        </div>

                                        {/* Post Content */}
                                        {p.content && (
                                          <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-line bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-800/60 select-text">
                                            {p.content}
                                          </p>
                                        )}

                                        {/* Post Attached Image */}
                                        {p.image && (
                                          <div className="rounded-xl overflow-hidden border border-neutral-800/80 bg-neutral-900/40 relative group/img max-h-80 flex items-center justify-center">
                                            <img
                                              src={p.image}
                                              alt=""
                                              className="w-full h-auto max-h-80 object-contain rounded-xl transition-transform duration-300 group-hover/img:scale-[1.01]"
                                              loading="lazy"
                                            />
                                            <a
                                              href={p.image}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/75 hover:bg-black text-white text-[10px] font-bold backdrop-blur-md opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center gap-1 border border-white/20"
                                              title="عرض الصورة بدقة كاملة"
                                            >
                                              <ImageIcon size={11} />
                                              <span>عرض الصورة بدقة كاملة</span>
                                            </a>
                                          </div>
                                        )}

                                        {/* Attached Video Notice */}
                                        {p.videoTitle && (
                                          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800 text-[11px] text-neutral-300">
                                            <PlayCircle size={14} className="text-amber-400 shrink-0" />
                                            <span className="truncate">فيديو مرفق: {p.videoTitle}</span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Footer: External Link + Save Button */}
                                      <div className="flex items-center justify-between gap-3 pt-3 border-t border-neutral-900">
                                        {p.url && (
                                          <a
                                            href={p.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors"
                                          >
                                            <ExternalLink size={12} />
                                            <span>عرض المنشور على يوتيوب</span>
                                          </a>
                                        )}
                                        {isSaved ? (
                                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                                            <CheckCircle2 size={13} />
                                            <span>محفوظ في ملف الشيخ</span>
                                          </span>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => handleUniversalImport(p, 'post', 'standalone')}
                                            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                                          >
                                            <Plus size={13} />
                                            <span>حفظ الفائدة في ملف الشيخ 💬</span>
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          ) : (
                            <div className="py-16 text-center text-neutral-500 text-xs border border-dashed border-neutral-800 rounded-3xl space-y-3">
                              <MessageSquare size={32} className="mx-auto text-neutral-600 opacity-60" />
                              <div className="space-y-1">
                                <p className="font-bold text-neutral-400">لم يتم العثور على منشورات في منتدى هذه القناة بعد.</p>
                                <p className="text-[11px] text-neutral-500">
                                  يمكنك لصق رابط أي منشور مجتمعي (مثل youtube.com/post/...) أو رابط منتدى القناة في شريط البحث بالأعلى.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={handleRefreshCommunityPosts}
                                disabled={isLoadingPosts}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-bold border border-neutral-800 transition-colors"
                              >
                                <RefreshCw size={13} className={isLoadingPosts ? 'animate-spin text-amber-400' : ''} />
                                <span>محاولة جلب المنشورات الآن 🔄</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* TAB 3: Telegram, Books, and Audio Content */}
                  {activeScholarTab === 'manual' && (
                    <motion.div
                      key="manual"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="space-y-6"
                    >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div
                        onClick={() => setIsAddContentModalOpen(true)}
                        className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 hover:border-sky-500/50 cursor-pointer transition-all space-y-2 text-center group"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mx-auto group-hover:scale-110 transition-transform">
                          <Send size={22} />
                        </div>
                        <h4 className="font-bold text-sm text-white">إضافة محتوى تيليجرام</h4>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          إضافة قنوات أو تسجيلات صوتية مباشرة من تيليجرام وتثبيتها للشيخ.
                        </p>
                      </div>

                      <div
                        onClick={() => setIsAddContentModalOpen(true)}
                        className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 hover:border-emerald-500/50 cursor-pointer transition-all space-y-2 text-center group"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto group-hover:scale-110 transition-transform">
                          <BookOpen size={22} />
                        </div>
                        <h4 className="font-bold text-sm text-white">إضافة كتب ومتون PDF</h4>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          إضافة كتب ومصنفات الشيخ مع رابط مباشر للتحميل أو القراءة.
                        </p>
                      </div>

                      <div
                        onClick={() => setIsAddContentModalOpen(true)}
                        className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 hover:border-amber-500/50 cursor-pointer transition-all space-y-2 text-center group"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto group-hover:scale-110 transition-transform">
                          <Headphones size={22} />
                        </div>
                        <h4 className="font-bold text-sm text-white">إضافة تسجيلات صوتية</h4>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          إضافة ملفات صوتية mp3 وسلاسل دروس مسموعة مباشرة.
                        </p>
                      </div>
                    </div>

                    {/* List of Non-YouTube Series currently saved */}
                    <div className="space-y-3 pt-4 border-t border-neutral-800">
                      <h4 className="text-sm font-bold text-white">
                        المحتوى الخارجي المعتمد للشيخ ({scholarSavedSeries.filter(s => s.source === 'telegram' || s.type === 'book' || s.type === 'audio').length})
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                        {scholarSavedSeries.filter(s => s.source === 'telegram' || s.type === 'book' || s.type === 'audio' || s.url?.includes('t.me')).map(item => (
                          <div key={item.id} className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300">
                                  {item.source === 'telegram' ? 'تيليجرام ✈️' : item.type === 'book' ? 'كتاب 📚' : 'صوتي 🎧'}
                                </span>
                              </div>
                              <h5 className="text-xs font-bold text-white truncate">{item.title}</h5>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {(item.source === 'telegram' || item.url?.includes('t.me')) && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewTelegram({ url: item.url || '', title: item.title })}
                                  className="p-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 hover:text-white transition-all shrink-0"
                                  title="تشغيل في مشغل تيليجرام المدمج"
                                >
                                  <Send size={14} />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteSeries(item.id, item.title)}
                                className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all shrink-0"
                                title="حذف"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="py-20 px-6 rounded-3xl border border-dashed border-neutral-800 bg-neutral-950/40 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 mx-auto">
                <User size={24} />
              </div>
              <h3 className="text-base font-bold text-white">اختر شيخاً من القائمة الجانبية للإدارة</h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                أو اضغط على زر "تسجيل شيخ جديد" في أعلى القائمة لإضافة شيخ جديد إلى المنصة.
              </p>
            </div>
          )}
        </main>

      {/* Curate Custom Series Modal */}
      {isCurateModalOpen && currentScholar && (
        <CurateSeriesModal
          scholarId={currentScholar.id}
          scholarName={currentScholar.name}
          onSave={handleSaveCuratedSeries}
          onClose={() => setIsCurateModalOpen(false)}
        />
      )}

      {/* Edit Scholar Modal */}
      {isEditModalOpen && currentScholar && (
        <ScholarEditModal
          scholar={currentScholar}
          originalAvatar={channelInfo?.snippet?.thumbnails?.high?.url || channelInfo?.snippet?.thumbnails?.medium?.url}
          onSave={handleSaveScholarEdit}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}

      {/* Add Manual Content Modal (Telegram / Books / Audio / Courses) */}
      {isAddContentModalOpen && currentScholar && (
        <AddManualContentModal
          scholarId={currentScholar.id}
          scholarName={currentScholar.name}
          onSave={handleSaveManualContent}
          onClose={() => setIsAddContentModalOpen(false)}
        />
      )}
      {/* Add Scholar Modal */}
      {isAddScholarModalOpen && (
        <AddScholarModal
          onSave={handleSaveNewScholar}
          onClose={() => setIsAddScholarModalOpen(false)}
        />
      )}

      {/* Merge Scholar Modal */}
      {isMergeModalOpen && currentScholar && (
        <MergeScholarModal
          sourceScholar={currentScholar}
          availableScholars={existingScholars}
          onMerge={handleMergeScholar}
          onClose={() => setIsMergeModalOpen(false)}
        />
      )}

      {/* Telegram In-App Preview Modal */}
      {previewTelegram && (
        <TelegramEmbedModal
          isOpen={!!previewTelegram}
          url={previewTelegram.url}
          title={previewTelegram.title}
          onClose={() => setPreviewTelegram(null)}
        />
      )}
    </div>
  );
};

