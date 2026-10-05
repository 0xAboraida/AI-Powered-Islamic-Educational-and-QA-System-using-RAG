export interface LessonComment {
  id: string;
  videoId: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  likeCount: number;
  publishedAt: string;
  source: 'local' | 'youtube';
}

export const getLocalComments = (videoId: string): LessonComment[] => {
  try {
    const data = localStorage.getItem(`zad_comments_${videoId}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const addLocalComment = (
  videoId: string, 
  text: string, 
  authorName = 'طالب علم'
): LessonComment => {
  const existing = getLocalComments(videoId);
  const cleanAuthor = authorName.trim() || 'طالب علم';
  
  const newComment: LessonComment = {
    id: `local_comment_${Date.now()}`,
    videoId,
    authorName: cleanAuthor,
    authorAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanAuthor)}&background=262626&color=ffffff`,
    text: text.trim(),
    likeCount: 0,
    publishedAt: new Date().toISOString(),
    source: 'local',
  };

  const updated = [newComment, ...existing];
  localStorage.setItem(`zad_comments_${videoId}`, JSON.stringify(updated));
  return newComment;
};

export const getCompletedLessons = (seriesId: string): string[] => {
  try {
    const data = localStorage.getItem(`zad_completed_lessons_${seriesId}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const toggleLessonCompleted = (seriesId: string, videoId: string): string[] => {
  const completed = getCompletedLessons(seriesId);
  const isCompleted = completed.includes(videoId);
  const updated = isCompleted 
    ? completed.filter(id => id !== videoId)
    : [...completed, videoId];
    
  localStorage.setItem(`zad_completed_lessons_${seriesId}`, JSON.stringify(updated));
  return updated;
};
