import React from 'react';
import {
  X,
  Headphones,
  Video,
  ExternalLink,
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { TrackRecordingItem } from '../types';
import { getTelegramEmbedUrl } from '../../../../utils/telegram';

function getYoutubeEmbedUrl(rawUrl?: string): string | null {
  if (!rawUrl) return null;
  try {
    const u = new URL(rawUrl.trim());
    let videoId: string | null = null;
    if (u.hostname.includes('youtu.be')) {
      videoId = u.pathname.replace(/^\//, '').split('/')[0] || null;
    } else if (u.hostname.includes('youtube.com')) {
      if (u.pathname.startsWith('/embed/')) {
        videoId = u.pathname.split('/embed/')[1]?.split('/')[0] || null;
      } else if (u.pathname.startsWith('/shorts/')) {
        videoId = u.pathname.split('/shorts/')[1]?.split('/')[0] || null;
      } else {
        videoId = u.searchParams.get('v');
      }
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : null;
  } catch {
    return null;
  }
}

interface TrackRecordingModalProps {
  recording: TrackRecordingItem | null;
  trackTitle?: string;
  isDark: boolean;
  accentColor: string;
  isCompleted?: boolean;
  hasPrev?: boolean;
  hasNext?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  onToggleComplete?: (recordingId: string) => void;
  onJumpToChapter?: (recording: TrackRecordingItem) => void;
  onClose: () => void;
}

export const TrackRecordingModal: React.FC<TrackRecordingModalProps> = ({
  recording,
  trackTitle,
  isDark,
  accentColor,
  isCompleted = false,
  hasPrev = false,
  hasNext = false,
  onPrev,
  onNext,
  onToggleComplete,
  onJumpToChapter,
  onClose,
}) => {
  if (!recording) return null;

  const youtubeEmbed =
    getYoutubeEmbedUrl(recording.youtubeUrl) || getYoutubeEmbedUrl(recording.videoUrl);
  const directVideoUrl =
    recording.videoUrl && !getYoutubeEmbedUrl(recording.videoUrl)
      ? recording.videoUrl
      : undefined;

  const baseEmbed = getTelegramEmbedUrl(recording.telegramUrl);
  const telegramEmbedUrl = baseEmbed
    ? `${baseEmbed}${baseEmbed.includes('?') ? '&' : '?'}dark=${isDark ? '1' : '0'}`
    : null;

  const hasDirectStream = Boolean(recording.audioUrl || directVideoUrl || youtubeEmbed);

  const isEmerald = accentColor === 'emerald';
  const isAmber = accentColor === 'amber';
  const isPurple = accentColor === 'purple';

  const accentBadgeClass = isEmerald
    ? isDark
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : isAmber
      ? isDark
        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
        : 'bg-amber-50 text-amber-700 border-amber-200'
      : isPurple
        ? isDark
          ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
          : 'bg-purple-50 text-purple-700 border-purple-200'
        : isDark
          ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
          : 'bg-blue-50 text-blue-700 border-blue-200';

  const accentButtonClass = isEmerald
    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
    : isAmber
      ? 'bg-amber-600 hover:bg-amber-700 text-white'
      : isPurple
        ? 'bg-purple-600 hover:bg-purple-700 text-white'
        : 'bg-blue-600 hover:bg-blue-700 text-white';

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isDark
            ? 'bg-stone-900 border-stone-700/80 text-stone-100'
            : 'bg-white border-stone-200 text-stone-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`px-4 sm:px-5 py-3.5 border-b flex items-start justify-between gap-3 ${
            isDark ? 'border-stone-800 bg-stone-950/60' : 'border-stone-200 bg-stone-50/80'
          }`}
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${accentBadgeClass}`}
              >
                {recording.type === 'video' ? (
                  <Video className="w-3.5 h-3.5" />
                ) : (
                  <Headphones className="w-3.5 h-3.5" />
                )}
                <span>{recording.type === 'video' ? 'شرح مرئي' : 'تسجيل صوتي'}</span>
              </span>

              {typeof recording.lectureNumber === 'number' && recording.lectureNumber > 0 && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full border ${
                    isDark
                      ? 'bg-stone-800 text-stone-300 border-stone-700'
                      : 'bg-white text-stone-600 border-stone-200'
                  }`}
                >
                  المحاضرة {recording.lectureNumber}
                </span>
              )}

              {recording.duration && (
                <span
                  className={`inline-flex items-center gap-1 text-[11px] ${
                    isDark ? 'text-stone-400' : 'text-stone-500'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span dir="ltr">{recording.duration}</span>
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-bold leading-snug">{recording.title}</h3>
            {trackTitle && (
              <p className={`text-xs mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                {trackTitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl border transition-colors shrink-0 ${
              isDark
                ? 'border-stone-700 text-stone-400 hover:text-white hover:bg-stone-800'
                : 'border-stone-200 text-stone-500 hover:text-stone-900 hover:bg-stone-100'
            }`}
            aria-label="إغلاق المشغل"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Player Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {recording.notes && (
            <p
              className={`text-xs sm:text-sm leading-relaxed rounded-xl px-3.5 py-2.5 border ${
                isDark
                  ? 'bg-stone-800/60 border-stone-700/70 text-stone-300'
                  : 'bg-stone-50 border-stone-200 text-stone-700'
              }`}
            >
              {recording.notes}
            </p>
          )}

          {/* YouTube Embed */}
          {youtubeEmbed && (
            <div className="rounded-xl overflow-hidden border border-stone-700/30 bg-black aspect-video">
              <iframe
                key={youtubeEmbed}
                src={youtubeEmbed}
                title={recording.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {/* Direct native video player */}
          {directVideoUrl && (
            <div className="rounded-xl overflow-hidden border border-stone-700/30 bg-black">
              <video
                key={directVideoUrl}
                controls
                className="w-full max-h-[340px]"
                src={directVideoUrl}
              />
            </div>
          )}

          {/* Direct native audio player */}
          {recording.audioUrl && (
            <div
              className={`p-3 rounded-xl border ${
                isDark ? 'bg-stone-800/80 border-stone-700' : 'bg-stone-50 border-stone-200'
              }`}
            >
              <audio key={recording.audioUrl} controls className="w-full" src={recording.audioUrl} />
            </div>
          )}

          {/* Telegram post embed (if no direct stream or alongside it) */}
          {telegramEmbedUrl && !youtubeEmbed && !directVideoUrl && (
            <div
              className={`rounded-xl overflow-hidden border ${
                isDark ? 'border-stone-700/80 bg-stone-950' : 'border-stone-200 bg-stone-50'
              }`}
            >
              <div
                className={`px-3.5 py-2 border-b text-[11px] flex items-center justify-between gap-2 ${
                  isDark
                    ? 'border-stone-800 text-stone-400 bg-stone-900/70'
                    : 'border-stone-200 text-stone-600 bg-white'
                }`}
              >
                <span>منشور تيليجرام المضمن</span>
                {recording.telegramUrl && (
                  <a
                    href={recording.telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 underline hover:opacity-80"
                  >
                    <span>فتح المنشور</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {!recording.audioUrl && (
                <div
                  className={`px-3.5 py-2 border-b text-[11px] flex items-start gap-2 ${
                    isDark
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-200/90'
                      : 'bg-amber-50 border-amber-200/70 text-amber-900'
                  }`}
                >
                  <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>
                    تضمين تيليجرام قد يطلب الفتح في التطبيق لملفات الصوت المرفقة (.m4a)؛ ولتشغيلها
                    بالمشغل الداخلي مباشرة دون مغادرة الموقع سنربط وسيط البث في الخطوة القادمة.
                  </span>
                </div>
              )}

              <iframe
                key={telegramEmbedUrl}
                src={telegramEmbedUrl}
                title={recording.title}
                className="w-full min-h-[260px] sm:min-h-[300px] border-0"
                loading="lazy"
              />
            </div>
          )}

          {!hasDirectStream && !telegramEmbedUrl && (
            <div
              className={`p-6 rounded-xl border text-center text-sm ${
                isDark
                  ? 'bg-stone-800/50 border-stone-700 text-stone-400'
                  : 'bg-stone-50 border-stone-200 text-stone-600'
              }`}
            >
              لا يتوفر رابط تشغيل مباشر لهذا التسجيل بعد.
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div
          className={`px-4 sm:px-5 py-3 border-t flex flex-wrap items-center justify-between gap-2 ${
            isDark ? 'border-stone-800 bg-stone-950/60' : 'border-stone-200 bg-stone-50/80'
          }`}
        >
          <div className="flex items-center gap-2">
            {onPrev && (
              <button
                type="button"
                disabled={!hasPrev}
                onClick={onPrev}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors disabled:opacity-40 ${
                  isDark
                    ? 'border-stone-700 bg-stone-800 text-stone-200 hover:bg-stone-700'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                }`}
              >
                <ChevronRight className="w-3.5 h-3.5" />
                <span>السابق</span>
              </button>
            )}
            {onNext && (
              <button
                type="button"
                disabled={!hasNext}
                onClick={onNext}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors disabled:opacity-40 ${
                  isDark
                    ? 'border-stone-700 bg-stone-800 text-stone-200 hover:bg-stone-700'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                }`}
              >
                <span>التالي</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(recording.chunkId || recording.chapterTitleMatch) && onJumpToChapter && (
              <button
                type="button"
                onClick={() => onJumpToChapter(recording)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                  isDark
                    ? 'border-stone-700 bg-stone-800 text-stone-100 hover:bg-stone-700'
                    : 'border-stone-200 bg-white text-stone-800 hover:bg-stone-100'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>الانتقال لموضع الدرس</span>
              </button>
            )}

            {onToggleComplete && (
              <button
                type="button"
                onClick={() => onToggleComplete(recording.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  isCompleted
                    ? isDark
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : accentButtonClass
                }`}
              >
                {isCompleted ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>تم الاستماع</span>
                  </>
                ) : (
                  <>
                    <Circle className="w-3.5 h-3.5" />
                    <span>تحديد كمكتمل</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
