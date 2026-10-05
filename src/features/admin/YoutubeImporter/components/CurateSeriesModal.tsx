import React, { useState, useEffect, useRef } from 'react';
import { ExplanationSeries, VideoItem, ChapterItem } from '../../../lessons/data/mockData';
import {
  searchChannelVideos,
  getVideoInfo,
  parseTimestampsFromText
} from '../../../../services/youtube.api';
import {
  X,
  Plus,
  Search,
  Loader2,
  Play,
  Clock,
  Check,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  Video,
  Headphones,
  BookOpen,
  GraduationCap,
  Send,
  Layers,
  Sparkles,
  ListOrdered,
  Mic
} from 'lucide-react';

interface CurateSeriesModalProps {
  scholarId: string;
  scholarName: string;
  onSave: (series: ExplanationSeries) => void;
  onClose: () => void;
}

// Format duration helper
const formatDuration = (duration?: string) => {
  if (!duration) return '';
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  const hours = match[1] ? `${match[1]}:` : '';
  const minutes = match[2] ? (match[1] ? match[2].padStart(2, '0') : match[2]) : '0';
  const seconds = match[3] ? match[3].padStart(2, '0') : '00';
  return `${hours}${minutes}:${seconds}`;
};

export const CurateSeriesModal: React.FC<CurateSeriesModalProps> = ({
  scholarId,
  scholarName,
  onSave,
  onClose,
}) => {
  // Step/Mode
  const [activeInputTab, setActiveInputTab] = useState<'channel' | 'direct'>('channel');

  // Series Details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'curated' | 'visual' | 'podcast' | 'audio' | 'book' | 'course'>('curated');
  const [thumbnail, setThumbnail] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Channel Search
  const [channelSearchQuery, setChannelSearchQuery] = useState('');
  const [channelVideos, setChannelVideos] = useState<any[]>([]);
  const [isSearchingChannel, setIsSearchingChannel] = useState(false);

  // Direct Link Add
  const [directUrl, setDirectUrl] = useState('');
  const [directTitle, setDirectTitle] = useState('');
  const [directSource, setDirectSource] = useState<'youtube' | 'telegram' | 'direct'>('youtube');
  const [isFetchingDirect, setIsFetchingDirect] = useState(false);

  // Selected Curated Lessons
  const [selectedLessons, setSelectedLessons] = useState<VideoItem[]>([]);

  // Search channel on mount or query change
  useEffect(() => {
    let isMounted = true;
    const fetchVideos = async () => {
      setIsSearchingChannel(true);
      try {
        const results = await searchChannelVideos(scholarId, channelSearchQuery, 30);
        if (isMounted) {
          setChannelVideos(results);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setIsSearchingChannel(false);
      }
    };

    const timer = setTimeout(() => {
      fetchVideos();
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [scholarId, channelSearchQuery]);

  // Handle Cover Upload
  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setThumbnail(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Toggle Video in Curated List
  const toggleChannelVideo = (vid: any) => {
    const exists = selectedLessons.some(l => l.id === vid.id);
    if (exists) {
      setSelectedLessons(selectedLessons.filter(l => l.id !== vid.id));
    } else {
      // Auto parse chapters if description has timestamps
      const parsedChapters = parseTimestampsFromText(vid.description || '');
      const newLesson: VideoItem = {
        id: vid.id,
        title: vid.title,
        thumbnail: vid.thumbnail,
        duration: vid.duration,
        publishedAt: vid.publishedAt,
        source: 'youtube',
        url: `https://www.youtube.com/watch?v=${vid.id}`,
        chapters: parsedChapters.length > 0 ? parsedChapters : undefined,
      };
      setSelectedLessons([...selectedLessons, newLesson]);

      // Set thumbnail if empty
      if (!thumbnail && vid.thumbnail) {
        setThumbnail(vid.thumbnail);
      }
    }
  };

  // Smart input change with auto-detection for Telegram / YouTube
  const handleDirectUrlChange = (val: string) => {
    setDirectUrl(val);
    const trimmed = val.trim();
    if (trimmed.includes('t.me/')) {
      setDirectSource('telegram');
      const match = trimmed.match(/t\.me\/([^/]+)\/(\d+)/);
      if (match && !directTitle.trim()) {
        const channel = match[1];
        const msgId = match[2];
        setDirectTitle(`صوتية تيليجرام (${channel} #${msgId})`);
      } else if (!directTitle.trim()) {
        setDirectTitle(`تسجيل تيليجرام #${selectedLessons.length + 1}`);
      }
    } else if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
      setDirectSource('youtube');
    } else if (trimmed.endsWith('.mp3') || trimmed.endsWith('.wav') || trimmed.endsWith('.ogg')) {
      setDirectSource('direct');
    }
  };

  // Handle Direct Link Add
  const handleAddDirectLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = directUrl.trim();
    if (!url) return;

    const isTelegram = url.includes('t.me/') || directSource === 'telegram';
    const isYouTube = !isTelegram && (url.includes('youtube.com') || url.includes('youtu.be') || directSource === 'youtube');

    if (isYouTube) {
      setIsFetchingDirect(true);
      try {
        const info = await getVideoInfo(url);
        if (info) {
          const parsedChapters = parseTimestampsFromText(info.description || '');
          const newLesson: VideoItem = {
            id: info.id,
            title: directTitle.trim() || info.title,
            thumbnail: info.thumbnail,
            duration: info.duration,
            publishedAt: info.publishedAt,
            source: 'youtube',
            url: `https://www.youtube.com/watch?v=${info.id}`,
            directUrl: `https://www.youtube.com/watch?v=${info.id}`,
            chapters: parsedChapters.length > 0 ? parsedChapters : undefined,
          };
          setSelectedLessons([...selectedLessons, newLesson]);
          setDirectUrl('');
          setDirectTitle('');
          if (!thumbnail && info.thumbnail) setThumbnail(info.thumbnail);
        } else {
          alert('تعذر جلب بيانات هذا المقطع من يوتيوب. تأكد من صحة الرابط.');
        }
      } finally {
        setIsFetchingDirect(false);
      }
    } else if (isTelegram) {
      // Telegram audio or post
      const match = url.match(/t\.me\/([^/]+)\/(\d+)/);
      const fallbackTitle = match ? `صوتية تيليجرام (${match[1]} #${match[2]})` : `صوتية تيليجرام #${selectedLessons.length + 1}`;
      const newLesson: VideoItem = {
        id: `telegram_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: directTitle.trim() || fallbackTitle,
        thumbnail: thumbnail || 'https://images.unsplash.com/photo-1584286595398-a59f21d313f5?w=500&auto=format&fit=crop&q=60',
        source: 'telegram',
        url: url,
        directUrl: url,
      };
      setSelectedLessons([...selectedLessons, newLesson]);
      setDirectUrl('');
      setDirectTitle('');
    } else {
      // Direct link
      const newLesson: VideoItem = {
        id: `direct_${Date.now()}`,
        title: directTitle.trim() || `درس #${selectedLessons.length + 1}`,
        thumbnail: thumbnail || 'https://images.unsplash.com/photo-1584286595398-a59f21d313f5?w=500&auto=format&fit=crop&q=60',
        source: 'direct',
        url: url,
        directUrl: url,
      };
      setSelectedLessons([...selectedLessons, newLesson]);
      setDirectUrl('');
      setDirectTitle('');
    }
  };

  // Move Lesson Up/Down
  const moveLesson = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const updated = [...selectedLessons];
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
      setSelectedLessons(updated);
    } else if (direction === 'down' && index < selectedLessons.length - 1) {
      const updated = [...selectedLessons];
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
      setSelectedLessons(updated);
    }
  };

  const removeLesson = (index: number) => {
    setSelectedLessons(selectedLessons.filter((_, i) => i !== index));
  };

  // Submit Curated Series
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || selectedLessons.length === 0) {
      alert('يرجى كتابة عنوان السلسلة وإضافة درس واحد على الأقل.');
      return;
    }

    const hasOnlyTelegram = selectedLessons.every(l => l.source === 'telegram');
    const hasOnlyYouTube = selectedLessons.every(l => l.source === 'youtube');
    const computedSource = hasOnlyYouTube ? 'youtube' : hasOnlyTelegram ? 'telegram' : 'mixed';

    const curatedSeries: ExplanationSeries = {
      id: `curated_${Date.now()}`,
      scholarId,
      title: title.trim(),
      description: description.trim(),
      type,
      source: computedSource,
      isCurated: true,
      url: selectedLessons[0]?.directUrl || selectedLessons[0]?.url || `https://youtube.com/channel/${scholarId}`,
      videoCount: selectedLessons.length,
      thumbnail: thumbnail.trim() || selectedLessons[0]?.thumbnail || '',
      videos: selectedLessons,
    };

    onSave(curatedSeries);
  };

  const typeOptions = [
    { id: 'curated', label: 'سلاسل مجمعة (قسم مستقل)', icon: Layers },
    { id: 'podcast', label: 'بودكاست ', icon: Mic },
    { id: 'visual', label: 'شروحات مرئية', icon: Video },
    { id: 'audio', label: 'شروحات صوتية', icon: Headphones },
    { id: 'book', label: 'كتب ومصنفات', icon: BookOpen },
    { id: 'course', label: 'دورات حالية', icon: GraduationCap },
  ] as const;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-neutral-950 border border-neutral-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-neutral-800 bg-black/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white shrink-0 shadow-inner">
              <Layers size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-base md:text-lg truncate">
                تجميع سلسلة دروس مخصصة للشيخ
              </h3>
              <p className="text-xs text-neutral-400 truncate">
                تحديد مقاطع معينة وترتيبها في سلسلة علمية مستقلة لـ {scholarName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar">
          {/* Section 1: Series Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800/80">
            {/* Title & Description */}
            <div className="md:col-span-2 space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1.5">
                  عنوان السلسلة المجمعة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: شرح كتاب التوحيد - المجالس الكاملة"
                  required
                  className="w-full bg-neutral-950 border border-neutral-800 text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-white transition-colors font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1.5">
                  الوصف أو النبذة العلمية
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="نبذة عن السلسلة وموضوعها وما تتناوله من مسائل شرعية..."
                  className="w-full bg-neutral-950 border border-neutral-800 text-white text-xs p-3 rounded-xl focus:outline-none focus:border-white transition-colors resize-none leading-relaxed"
                />
              </div>

              {/* Type Select */}
              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1.5">
                  القسم في بروفايل الشيخ
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {typeOptions.map(t => {
                    const Icon = t.icon;
                    const isSel = type === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setType(t.id)}
                        className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-semibold transition-all ${isSel
                          ? 'bg-white text-black border-white shadow-sm'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                      >
                        <Icon size={14} />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Thumbnail upload */}
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-neutral-950 border border-neutral-800/80 text-center space-y-2.5">
              <span className="text-xs font-bold text-neutral-400">غلاف السلسلة</span>
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                {thumbnail ? (
                  <img src={thumbnail} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-neutral-600">سيتم استخدام غلاف أول درس</span>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleThumbnailUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs transition-all"
              >
                <Upload size={12} />
                <span>رفع غلاف من الجهاز</span>
              </button>
            </div>
          </div>

          {/* Section 2: Choose Lessons (Dual Panel Layout) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Side (7 Cols): Available Videos / Input Source */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveInputTab('channel')}
                    className={`flex items-center gap-1.5 pb-2 text-xs font-bold border-b-2 transition-all ${activeInputTab === 'channel'
                      ? 'border-white text-white'
                      : 'border-transparent text-neutral-500 hover:text-neutral-300'
                      }`}
                  >
                    <Search size={14} />
                    <span>البحث في فيديوهات القناة ({channelVideos.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveInputTab('direct')}
                    className={`flex items-center gap-1.5 pb-2 text-xs font-bold border-b-2 transition-all ${activeInputTab === 'direct'
                      ? 'border-white text-white'
                      : 'border-transparent text-neutral-500 hover:text-neutral-300'
                      }`}
                  >
                    <Plus size={14} />
                    <span>إضافة روابط مباشرة / تيليجرام</span>
                  </button>
                </div>
              </div>

              {/* TAB A: Channel Videos Picker */}
              {activeInputTab === 'channel' && (
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={channelSearchQuery}
                      onChange={(e) => setChannelSearchQuery(e.target.value)}
                      placeholder="ابحث في فيديوهات القناة (مثال: التوحيد، العقيدة، الدرس الأول...)"
                      className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs px-3.5 py-2.5 pr-9 rounded-xl focus:outline-none focus:border-white transition-colors"
                    />
                    <Search className="absolute right-3 top-3 w-4 h-4 text-neutral-500" />
                  </div>

                  <div className="max-h-80 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {isSearchingChannel ? (
                      <div className="py-12 text-center space-y-2">
                        <Loader2 size={24} className="animate-spin text-white mx-auto" />
                        <p className="text-xs text-neutral-400">جاري البحث في مقاطع القناة...</p>
                      </div>
                    ) : channelVideos.length > 0 ? (
                      channelVideos.map((vid) => {
                        const isSelected = selectedLessons.some(l => l.id === vid.id);
                        const dur = formatDuration(vid.duration);

                        return (
                          <div
                            key={vid.id}
                            onClick={() => toggleChannelVideo(vid)}
                            className={`flex items-center gap-3 p-2.5 rounded-2xl border transition-all cursor-pointer ${isSelected
                              ? 'bg-neutral-900 border-white text-white'
                              : 'bg-neutral-950 border-neutral-800/80 text-neutral-300 hover:bg-neutral-900/60 hover:border-neutral-700'
                              }`}
                          >
                            {/* Checkbox indicator */}
                            <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border transition-all ${isSelected ? 'bg-white border-white text-black' : 'border-neutral-700 bg-neutral-900'
                              }`}>
                              {isSelected && <Check size={13} strokeWidth={3} />}
                            </div>

                            {/* Thumbnail */}
                            <div className="relative w-20 aspect-video rounded-lg overflow-hidden bg-neutral-900 shrink-0 border border-neutral-800">
                              <img src={vid.thumbnail} alt={vid.title} className="w-full h-full object-cover" />
                              {dur && (
                                <span className="absolute bottom-0.5 right-0.5 bg-black/80 px-1 py-0.2 rounded text-[9px] font-mono text-white">
                                  {dur}
                                </span>
                              )}
                            </div>

                            {/* Title */}
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold line-clamp-2 leading-snug">
                                {vid.title}
                              </p>
                              <span className="text-[10px] text-neutral-500 font-mono">
                                {vid.publishedAt?.split('T')[0]}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-12 text-center text-neutral-500 text-xs">
                        لا توجد مقاطع مطابقة لكلمة البحث في القناة.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB B: Direct Link Addition */}
              {activeInputTab === 'direct' && (
                <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setDirectSource('youtube')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${directSource === 'youtube' ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-400'
                        }`}
                    >
                      رابط يوتيوب
                    </button>
                    <button
                      type="button"
                      onClick={() => setDirectSource('telegram')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${directSource === 'telegram' ? 'bg-sky-500 text-white' : 'bg-neutral-800 text-neutral-400'
                        }`}
                    >
                      رابط تيليجرام
                    </button>
                    <button
                      type="button"
                      onClick={() => setDirectSource('direct')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${directSource === 'direct' ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-400'
                        }`}
                    >
                      رابط مباشر / صوت
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-1">
                      رابط المقطع / الدرس
                    </label>
                    <input
                      type="url"
                      value={directUrl}
                      onChange={(e) => handleDirectUrlChange(e.target.value)}
                      placeholder={directSource === 'youtube' ? 'https://youtube.com/watch?v=...' : 'https://t.me/channel/...'}
                      className="w-full bg-neutral-950 border border-neutral-800 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-1">
                      عنوان الدرس (اختياري ليوتيوب، إجباري للروابط الأخرى)
                    </label>
                    <input
                      type="text"
                      value={directTitle}
                      onChange={(e) => setDirectTitle(e.target.value)}
                      placeholder="مثال: الدرس الأول - مقدمة وتعريف"
                      className="w-full bg-neutral-950 border border-neutral-800 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-white transition-colors"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddDirectLink}
                    disabled={isFetchingDirect || !directUrl.trim()}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 disabled:opacity-40 transition-all shadow-sm"
                  >
                    {isFetchingDirect ? <Loader2 size={13} className="animate-spin" /> : <Plus size={14} />}
                    <span>إضافة هذا الدرس للقائمة</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right Side (5 Cols): Curated Ordered Lessons */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <div className="flex items-center gap-2">
                  <ListOrdered size={16} className="text-neutral-400" />
                  <span className="text-xs font-bold text-white">
                    الدروس المختارة في السلسلة ({selectedLessons.length})
                  </span>
                </div>
                {selectedLessons.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedLessons([])}
                    className="text-[11px] text-red-400 hover:text-red-300"
                  >
                    تفريغ القائمة
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {selectedLessons.length > 0 ? (
                  selectedLessons.map((lesson, idx) => (
                    <div
                      key={lesson.id}
                      className="p-2.5 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center gap-2.5 text-xs text-neutral-300 hover:border-neutral-700 transition-all"
                    >
                      {/* Index badge */}
                      <span className="w-6 h-6 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[10px] font-mono font-bold text-white shrink-0">
                        {idx + 1}
                      </span>

                      {/* Title & Source */}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold line-clamp-1 text-white leading-snug">
                          {lesson.title}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-neutral-500 mt-0.5">
                          <span>{lesson.source === 'telegram' ? 'تيليجرام' : 'يوتيوب'}</span>
                          {lesson.chapters && (
                            <span className="text-emerald-400 font-semibold">
                              • {lesson.chapters.length} فصول زمنية
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Reorder and Delete Controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveLesson(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-20 transition-all"
                          title="تحريك لأعلى"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveLesson(idx, 'down')}
                          disabled={idx === selectedLessons.length - 1}
                          className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-20 transition-all"
                          title="تحريك لأسفل"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeLesson(idx)}
                          className="p-1 rounded-lg hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-all"
                          title="حذف من السلسلة"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-16 text-center border border-dashed border-neutral-800 rounded-2xl p-6 text-neutral-500 text-xs">
                    لم تقم باختيار أي دروس بعد. ابحث في قائمة الفيديوهات باليسار وحدد الدروس التي تنتمي لهذا الكتاب أو السلسلة.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Save Actions */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
            <span className="text-xs text-neutral-400">
              إجمالي الدروس المحددة في السلسلة: <strong className="text-white">{selectedLessons.length}</strong>
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white text-xs font-semibold transition-all"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={selectedLessons.length === 0 || !title.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 disabled:opacity-40 transition-all shadow-md"
              >
                <Check size={14} />
                <span>حفظ وإنشاء السلسلة المجمعة</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
