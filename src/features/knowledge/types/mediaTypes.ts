export interface SheikhStats {
  authored_books_count: number; // عدد الكتب التي ألفها الشيخ / العالم في المكتبة
  total_audio_playlists: number;
  total_video_playlists: number;
  total_audio_standalone: number;
  total_video_standalone: number;
}

export interface Sheikh {
  id: string;
  name: string;
  title: string;
  avatar: string;
  bio: string;
  specialty: string;
  stats: SheikhStats;
  socialLinks?: {
    youtube?: string;
    telegram?: string;
    website?: string;
  };
}

export interface LinkedBook {
  bookId?: string | number;
  bookTitle: string;
  author?: string;
}

export interface MediaEpisode {
  number: number;
  title: string;
  duration?: string;
  url?: string;
}

export interface MediaPlaylist {
  id: string;
  sheikhId: string;
  sheikhName: string;
  title: string;
  mediaType: 'audio' | 'video';
  category: string;
  coverImage?: string;
  playlistUrl: string;
  playlistId: string;
  totalEpisodes: number;
  isCompleted: boolean;
  description: string;
  linkedBook?: LinkedBook;
  episodes?: MediaEpisode[];
}

export interface MediaStandalone {
  id: string;
  sheikhId: string;
  sheikhName: string;
  title: string;
  mediaType: 'audio' | 'video';
  category: string;
  mediaUrl: string;
  duration: string;
  thumbnail?: string;
  linkedBook?: LinkedBook;
  publishedDate?: string;
}

export interface Course {
  id: string;
  title: string;
  playlistUrl: string;
  playlistId: string;
  instructorName: string;
  instructorId?: string;
  description: string;
  thumbnail: string;
  status: 'active' | 'upcoming' | 'completed';
  badgeLabel: string;
  targetBook?: LinkedBook;
  totalLessons: number;
  enrolledCount: number;
  isFeatured?: boolean;
  level: 'مبتدئ' | 'متوسط' | 'متقدم';
  lessons?: {
    number: number;
    title: string;
    duration: string;
  }[];
}
