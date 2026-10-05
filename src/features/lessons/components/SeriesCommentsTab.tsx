import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, ThumbsUp, Loader2, Sparkles, User, Play } from 'lucide-react';
import { getVideoComments } from '../../../services/youtube.api';
import { LessonComment, getLocalComments, addLocalComment } from '../data/commentsStore';

interface SeriesCommentsTabProps {
  videoId: string | null;
  videoTitle?: string;
}

export const SeriesCommentsTab: React.FC<SeriesCommentsTabProps> = ({ videoId, videoTitle }) => {
  const [comments, setComments] = useState<LessonComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!videoId) {
      setComments([]);
      return;
    }

    let isMounted = true;
    const fetchComments = async () => {
      setIsLoading(true);

      // 1. Get local comments from students on Zad
      const local = getLocalComments(videoId);

      // 2. Fetch comments from YouTube API
      const ytComments = await getVideoComments(videoId);

      if (isMounted) {
        // Merge: Local Zad comments at the top, then YouTube comments
        setComments([...local, ...ytComments]);
        setIsLoading(false);
      }
    };

    fetchComments();

    return () => {
      isMounted = false;
    };
  }, [videoId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoId || !newCommentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const added = addLocalComment(videoId, newCommentText, authorName);
      setComments([added, ...comments]);
      setNewCommentText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'الآن';
      if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
      if (diffHours < 24) return `منذ ${diffHours} ساعة`;
      if (diffDays < 30) return `منذ ${diffDays} يوم`;
      return date.toLocaleDateString('ar-EG');
    } catch {
      return '';
    }
  };

  if (!videoId) {
    return (
      <div className="p-8 text-center text-neutral-500 text-sm">
        يرجى اختيار درس لعرض وإضافة التعليقات عليه.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-5 p-4" dir="rtl">
      {/* Comment Input Box */}
      <form onSubmit={handleSubmit} className="bg-neutral-900/80 border border-neutral-800 p-4 rounded-2xl space-y-3 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300 shrink-0">
            <User size={15} />
          </div>
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="اسمك (اختياري، الافتراضي: طالب علم)"
            className="flex-1 bg-neutral-950 border border-neutral-800 text-white text-xs px-3 py-1.5 rounded-xl focus:outline-none focus:border-neutral-500 transition-colors"
          />
        </div>

        <div className="relative">
          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="أضف تعليقاً أو استفساراً أو فائدة حول هذا الدرس..."
            rows={3}
            className="w-full bg-neutral-950 border border-neutral-800 text-white text-xs p-3 rounded-xl focus:outline-none focus:border-white transition-colors resize-none placeholder:text-neutral-500"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-neutral-500">
            يظهر تعليقك فوراً لجميع طلاب المنصة في هذا الدرس.
          </span>
          <button
            type="submit"
            disabled={!newCommentText.trim() || isSubmitting}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 disabled:opacity-40 transition-all shadow-sm"
          >
            {isSubmitting ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Send size={13} />
            )}
            <span>نشر التعليق</span>
          </button>
        </div>
      </form>

      {/* Header with stats */}
      <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <MessageSquare size={16} className="text-neutral-400" />
          <span>التعليقات والمناقشات ({comments.length})</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-neutral-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            منصة زاد ({comments.filter(c => c.source === 'local').length})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            يوتيوب ({comments.filter(c => c.source === 'youtube').length})
          </span>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 size={26} className="animate-spin text-white mx-auto" />
            <p className="text-xs text-neutral-400">جاري جلب التعليقات والمشاركات...</p>
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => {
            const isLocal = comment.source === 'local';

            return (
              <div
                key={comment.id}
                className={`p-3.5 rounded-2xl border transition-all ${isLocal
                    ? 'bg-neutral-900/90 border-neutral-700/80 shadow-sm'
                    : 'bg-neutral-950/60 border-neutral-800/80'
                  }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-800 shrink-0 border border-neutral-700">
                    {comment.authorAvatar ? (
                      <img
                        src={comment.authorAvatar}
                        alt={comment.authorName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-neutral-300 font-bold">
                        {comment.authorName[0]}
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {comment.authorName}
                        </span>
                        {isLocal ? (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded font-medium">
                            طالب في زاد
                          </span>
                        ) : (
                          <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.2 rounded font-medium flex items-center gap-0.5">
                            <Play size={9} fill="currentColor" />
                            يوتيوب
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-neutral-500 font-mono">
                        {formatRelativeTime(comment.publishedAt)}
                      </span>
                    </div>

                    <div
                      className="text-xs text-neutral-300 leading-relaxed break-words whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: comment.text }}
                    />

                    {comment.likeCount > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 text-[11px] text-neutral-400">
                        <ThumbsUp size={11} className="text-neutral-500" />
                        <span>{comment.likeCount} إعجاب</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center text-neutral-500 text-xs">
            لا توجد تعليقات على هذا الدرس بعد. كن أول من يشارك بفائدة أو سؤال!
          </div>
        )}
      </div>
    </div>
  );
};
