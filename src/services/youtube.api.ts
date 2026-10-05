const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

if (!API_KEY) {
  console.warn('VITE_YOUTUBE_API_KEY is missing from environment variables.');
}

/**
 * Extracts a YouTube handle (e.g., @3laaHamed) from a full URL.
 */
export const extractHandleFromUrl = (url: string): string | null => {
  const match = url.match(/youtube\.com\/(@[^/?]+)/);
  return match ? match[1] : null;
};

/**
 * Fetches Channel info by Handle or ID.
 * Gets comprehensive data including snippet, statistics, and branding.
 */
export const getChannelInfo = async (handleOrId: string, isHandle = true) => {
  const params = new URLSearchParams({
    part: 'id,snippet,contentDetails,statistics,brandingSettings,topicDetails',
    key: API_KEY,
  });

  if (isHandle) {
    params.append('forHandle', handleOrId);
  } else {
    params.append('id', handleOrId);
  }

  const response = await fetch(`${BASE_URL}/channels?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch channel');
  const data = await response.json();
  
  return data.items?.[0] || null;
};

/**
 * Fetches all Playlists for a specific Channel ID.
 */
export const getChannelPlaylists = async (channelId: string) => {
  let playlists: any[] = [];
  let nextPageToken = '';

  do {
    const params = new URLSearchParams({
      part: 'snippet,contentDetails',
      channelId: channelId,
      maxResults: '50',
      key: API_KEY,
    });
    
    if (nextPageToken) params.append('pageToken', nextPageToken);

    const response = await fetch(`${BASE_URL}/playlists?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch playlists');
    
    const data = await response.json();
    playlists = [...playlists, ...(data.items || [])];
    nextPageToken = data.nextPageToken || '';
  } while (nextPageToken);

  return playlists;
};

/**
 * Fetches Playlists for a Channel ID with pagination support.
 */
export const getChannelPlaylistsPaged = async (channelId: string, pageToken?: string, maxResults = 50) => {
  const params = new URLSearchParams({
    part: 'snippet,contentDetails',
    channelId: channelId,
    maxResults: String(Math.min(maxResults, 50)),
    key: API_KEY,
  });
  if (pageToken) params.append('pageToken', pageToken);

  const response = await fetch(`${BASE_URL}/playlists?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch playlists');

  const data = await response.json();
  return {
    items: data.items || [],
    nextPageToken: data.nextPageToken || '',
    hasMore: !!data.nextPageToken,
    totalResults: data.pageInfo?.totalResults || 0,
  };
};

/**
 * Fetches all items (videos) within a specific Playlist.
 */
export const getPlaylistItems = async (playlistId: string, maxResults = 250) => {
  let items: any[] = [];
  let nextPageToken = '';

  do {
    const params = new URLSearchParams({
      part: 'snippet,contentDetails',
      playlistId: playlistId,
      maxResults: '50',
      key: API_KEY,
    });
    
    if (nextPageToken) params.append('pageToken', nextPageToken);

    const response = await fetch(`${BASE_URL}/playlistItems?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch playlist items');
    
    const data = await response.json();
    items = [...items, ...(data.items || [])];
    nextPageToken = data.nextPageToken || '';
    if (items.length >= maxResults) break;
  } while (nextPageToken);

  return items.slice(0, maxResults);
};

/**
 * Fetches detailed videos list for a playlist (including duration, thumbnails, isShort).
 */
export const getPlaylistVideosDetailed = async (playlistId: string, maxResults = 100) => {
  const items = await getPlaylistItems(playlistId, maxResults);
  const videoIds = items
    .map((item: any) => item.contentDetails?.videoId)
    .filter(Boolean);

  if (videoIds.length === 0) return [];
  const details = await getVideosDetails(videoIds);
  return details.map((v: any) => ({
    id: v.id,
    title: v.snippet?.title || '',
    thumbnail: v.snippet?.thumbnails?.high?.url || v.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.default?.url || '',
    duration: v.contentDetails?.duration,
    publishedAt: v.snippet?.publishedAt,
    description: v.snippet?.description || '',
    channelTitle: v.snippet?.channelTitle || '',
    channelId: v.snippet?.channelId || '',
    isShort: isShortVideo(v.contentDetails?.duration, v.snippet?.title, v.snippet?.description),
  }));
};

/**
 * Fetches items for a specific playlist with pagination support.
 */
export const getPlaylistItemsPaged = async (playlistId: string, pageToken?: string, maxResults = 50) => {
  const params = new URLSearchParams({
    part: 'snippet,contentDetails',
    playlistId: playlistId,
    maxResults: String(Math.min(maxResults, 50)),
    key: API_KEY,
  });
  if (pageToken) params.append('pageToken', pageToken);

  const response = await fetch(`${BASE_URL}/playlistItems?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch playlist items');

  const data = await response.json();
  return {
    items: data.items || [],
    nextPageToken: data.nextPageToken || '',
    hasMore: !!data.nextPageToken,
    totalResults: data.pageInfo?.totalResults || 0,
  };
};

/**
 * Fetches detailed videos list for a playlist with pagination support.
 */
export const getPlaylistVideosDetailedPaged = async (playlistId: string, pageToken?: string, maxResults = 50) => {
  const page = await getPlaylistItemsPaged(playlistId, pageToken, maxResults);
  const videoIds = page.items
    .map((item: any) => item.contentDetails?.videoId)
    .filter(Boolean);

  if (videoIds.length === 0) {
    return {
      items: [],
      nextPageToken: '',
      hasMore: false,
      totalResults: page.totalResults,
    };
  }

  const details = await getVideosDetails(videoIds);
  const items = details.map((v: any) => ({
    id: v.id,
    title: v.snippet?.title || '',
    thumbnail: v.snippet?.thumbnails?.high?.url || v.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.default?.url || '',
    duration: v.contentDetails?.duration,
    publishedAt: v.snippet?.publishedAt,
    description: v.snippet?.description || '',
    channelTitle: v.snippet?.channelTitle || '',
    channelId: v.snippet?.channelId || '',
    isShort: isShortVideo(v.contentDetails?.duration, v.snippet?.title, v.snippet?.description),
  }));

  return {
    items,
    nextPageToken: page.nextPageToken,
    hasMore: page.hasMore,
    totalResults: page.totalResults,
  };
};

/**
 * Fetches detailed statistics and information for an array of Video IDs.
 */
export const getVideosDetails = async (videoIds: string[]) => {
  let videos: any[] = [];
  
  // YouTube API allows a maximum of 50 IDs per request
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const params = new URLSearchParams({
      part: 'snippet,contentDetails,statistics,liveStreamingDetails,topicDetails,status',
      id: batch.join(','),
      key: API_KEY,
    });

    const response = await fetch(`${BASE_URL}/videos?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch video details');
    
    const data = await response.json();
    videos = [...videos, ...(data.items || [])];
  }

  return videos;
};

/**
 * Fetches top comments for a specific YouTube Video.
 */
export const getVideoComments = async (videoId: string, maxResults = 25) => {
  try {
    const params = new URLSearchParams({
      part: 'snippet',
      videoId: videoId,
      maxResults: String(maxResults),
      order: 'relevance',
      key: API_KEY,
    });

    const response = await fetch(`${BASE_URL}/commentThreads?${params.toString()}`);
    if (!response.ok) {
      // Comments might be disabled for this video
      console.warn('Comments fetch returned status:', response.status);
      return [];
    }

    const data = await response.json();
    return (data.items || []).map((item: any) => {
      const topComment = item.snippet?.topLevelComment?.snippet;
      return {
        id: item.id,
        authorName: topComment?.authorDisplayName || 'مستخدم',
        authorAvatar: topComment?.authorProfileImageUrl || '',
        text: topComment?.textDisplay || topComment?.textOriginal || '',
        likeCount: topComment?.likeCount || 0,
        publishedAt: topComment?.publishedAt || '',
        source: 'youtube' as const,
      };
    });
  } catch (err) {
    console.error('Failed to fetch video comments:', err);
    return [];
  }
};

/**
 * Searches for videos within a specific YouTube Channel (or queries channel uploads).
 */
export const searchChannelVideos = async (channelId: string, query = '', maxResults = 30) => {
  try {
    const params = new URLSearchParams({
      part: 'snippet',
      channelId: channelId,
      type: 'video',
      maxResults: String(maxResults),
      key: API_KEY,
    });

    if (query.trim()) {
      params.append('q', query.trim());
    } else {
      params.append('order', 'date');
    }

    const response = await fetch(`${BASE_URL}/search?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to search channel videos');
    const data = await response.json();

    const videoIds = (data.items || []).map((item: any) => item.id?.videoId).filter(Boolean);
    if (videoIds.length === 0) return [];

    const details = await getVideosDetails(videoIds);
    return details.map((v: any) => ({
      id: v.id,
      title: v.snippet?.title || '',
      thumbnail: v.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.default?.url || '',
      duration: v.contentDetails?.duration,
      publishedAt: v.snippet?.publishedAt,
      description: v.snippet?.description || '',
    }));
  } catch (err) {
    console.error('Failed to search channel videos:', err);
    return [];
  }
};

/**
 * Extracts Video ID from a standard YouTube URL, short link, or /shorts/ link.
 */
export const extractVideoIdFromUrl = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

/**
 * Extracts Playlist ID from a YouTube URL.
 */
export const extractPlaylistIdFromUrl = (url: string): string | null => {
  const match = url.match(/[?&]list=([^#&]+)/);
  return match ? match[1] : null;
};

/**
 * Fetches information for a single Playlist from its ID or URL.
 */
export const getPlaylistInfo = async (playlistIdOrUrl: string) => {
  let playlistId = playlistIdOrUrl.trim();
  if (playlistId.includes('list=')) {
    const extracted = extractPlaylistIdFromUrl(playlistId);
    if (extracted) playlistId = extracted;
  }
  const params = new URLSearchParams({
    part: 'snippet,contentDetails',
    id: playlistId,
    key: API_KEY,
  });
  const response = await fetch(`${BASE_URL}/playlists?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch playlist');
  const data = await response.json();
  return data.items?.[0] || null;
};

/**
 * Fetches information for a single video from its ID or URL.
 */
export const getVideoInfo = async (videoIdOrUrl: string) => {
  let videoId = videoIdOrUrl.trim();
  if (videoId.includes('youtube.com') || videoId.includes('youtu.be')) {
    const extracted = extractVideoIdFromUrl(videoId);
    if (extracted) videoId = extracted;
  }
  const details = await getVideosDetails([videoId]);
  if (!details || details.length === 0) return null;
  const v = details[0];
  const isShort = isShortVideo(v.contentDetails?.duration, v.snippet?.title, v.snippet?.description);
  return {
    id: v.id,
    title: v.snippet?.title || '',
    thumbnail: v.snippet?.thumbnails?.high?.url || v.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.default?.url || '',
    duration: v.contentDetails?.duration,
    publishedAt: v.snippet?.publishedAt,
    description: v.snippet?.description || '',
    channelId: v.snippet?.channelId,
    channelTitle: v.snippet?.channelTitle,
    isShort,
  };
};

export type YouTubeUrlType = 'channel' | 'playlist' | 'video' | 'shorts' | 'community' | 'unknown';

export const detectYouTubeUrlType = (input: string): { type: YouTubeUrlType; idOrHandle: string } => {
  const trimmed = input.trim();
  if (trimmed.includes('/shorts/')) {
    const match = trimmed.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (match) return { type: 'shorts', idOrHandle: match[1] };
  }
  if (trimmed.includes('list=')) {
    const listId = extractPlaylistIdFromUrl(trimmed);
    if (listId) return { type: 'playlist', idOrHandle: listId };
  }
  const videoId = extractVideoIdFromUrl(trimmed);
  if (videoId && (trimmed.includes('watch?v=') || trimmed.includes('youtu.be/') || trimmed.length === 11)) {
    return { type: 'video', idOrHandle: videoId };
  }
  if (trimmed.includes('/post/') || trimmed.includes('/community')) {
    return { type: 'community', idOrHandle: trimmed };
  }
  if (trimmed.startsWith('@')) {
    return { type: 'channel', idOrHandle: trimmed };
  }
  const handle = extractHandleFromUrl(trimmed);
  if (handle) {
    return { type: 'channel', idOrHandle: handle };
  }
  if (trimmed.includes('/channel/')) {
    const match = trimmed.match(/\/channel\/([a-zA-Z0-9_-]+)/);
    if (match) return { type: 'channel', idOrHandle: match[1] };
  }
  if (trimmed.startsWith('UC') && trimmed.length > 15) {
    return { type: 'channel', idOrHandle: trimmed };
  }
  return { type: 'unknown', idOrHandle: trimmed };
};

export interface ParsedChapter {
  title: string;
  timestamp: string;
  seconds: number;
}

/**
 * Extracts timestamp chapters from video descriptions (e.g., "14:20 الباب الأول").
 */
export const parseTimestampsFromText = (text: string): ParsedChapter[] => {
  if (!text) return [];
  const lines = text.split('\n');
  const chapters: ParsedChapter[] = [];
  const regex = /(?:(\d{1,2}):)?(\d{1,2}):(\d{2})/;

  for (const line of lines) {
    const match = line.match(regex);
    if (match) {
      const fullTime = match[0];
      const parts = fullTime.split(':').map(Number);
      let seconds = 0;
      if (parts.length === 3) {
        seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      } else if (parts.length === 2) {
        seconds = parts[0] * 60 + parts[1];
      }
      
      const title = line.replace(fullTime, '').replace(/^[\s\-–—:]+/, '').trim();
      if (title) {
        chapters.push({
          title,
          timestamp: fullTime,
          seconds,
        });
      }
    }
  }
  return chapters;
};

/**
 * Determines whether a video is a YouTube Short (<= 61 seconds or includes #shorts tag).
 */
export const isShortVideo = (duration?: string, title?: string, description?: string): boolean => {
  if (title?.toLowerCase().includes('#shorts') || description?.toLowerCase().includes('#shorts')) {
    return true;
  }
  if (!duration) return false;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return false;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  return totalSeconds > 0 && totalSeconds <= 61;
};

/**
 * Fetches all uploads for a channel using the uploads playlist (UU...).
 */
export const getChannelUploads = async (channelId: string, maxResults = 200) => {
  const uploadsPlaylistId = channelId.startsWith('UC')
    ? 'UU' + channelId.slice(2)
    : channelId;

  const playlistItems = await getPlaylistItems(uploadsPlaylistId, maxResults);
  const itemsSlice = playlistItems.slice(0, maxResults);
  const videoIds = itemsSlice
    .map((pi: any) => pi.contentDetails?.videoId)
    .filter(Boolean);

  if (videoIds.length === 0) return [];
  const details = await getVideosDetails(videoIds);
  return details.map((v: any) => ({
    id: v.id,
    title: v.snippet?.title || '',
    thumbnail: v.snippet?.thumbnails?.high?.url || v.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.default?.url || '',
    duration: v.contentDetails?.duration,
    publishedAt: v.snippet?.publishedAt,
    description: v.snippet?.description || '',
    isShort: isShortVideo(v.contentDetails?.duration, v.snippet?.title, v.snippet?.description),
  }));
};

/**
 * Fetches uploads for a channel with pagination support (for infinite scrolling).
 */
export const getChannelUploadsPaged = async (channelId: string, pageToken?: string, maxResults = 50) => {
  const uploadsPlaylistId = channelId.startsWith('UC')
    ? 'UU' + channelId.slice(2)
    : channelId;

  const page = await getPlaylistItemsPaged(uploadsPlaylistId, pageToken, maxResults);
  const videoIds = page.items
    .map((pi: any) => pi.contentDetails?.videoId)
    .filter(Boolean);

  if (videoIds.length === 0) {
    return {
      items: [],
      nextPageToken: '',
      hasMore: false,
      totalResults: page.totalResults
    };
  }

  const details = await getVideosDetails(videoIds);
  const items = details.map((v: any) => ({
    id: v.id,
    title: v.snippet?.title || '',
    thumbnail: v.snippet?.thumbnails?.high?.url || v.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.default?.url || '',
    duration: v.contentDetails?.duration,
    publishedAt: v.snippet?.publishedAt,
    description: v.snippet?.description || '',
    isShort: isShortVideo(v.contentDetails?.duration, v.snippet?.title, v.snippet?.description),
  }));

  return {
    items,
    nextPageToken: page.nextPageToken,
    hasMore: page.hasMore,
    totalResults: page.totalResults
  };
};

/**
 * Searches for channels matching a keyword or name.
 */
export const searchChannels = async (query: string, maxResults = 5) => {
  try {
    const params = new URLSearchParams({
      part: 'snippet',
      type: 'channel',
      q: query.trim(),
      maxResults: String(maxResults),
      key: API_KEY,
    });
    const response = await fetch(`${BASE_URL}/search?${params.toString()}`);
    if (!response.ok) return [];
    const data = await response.json();
    return (data.items || []).map((item: any) => ({
      id: item.snippet?.channelId || item.id?.channelId,
      title: item.snippet?.title || '',
      description: item.snippet?.description || '',
      thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || '',
      customUrl: item.snippet?.channelTitle || '',
    }));
  } catch (err) {
    console.error('Failed to search channels:', err);
    return [];
  }
};

export interface YouTubeCommunityPost {
  id: string;
  title: string;
  content: string;
  publishedAt: string;
  url: string;
  thumbnail?: string;
  image?: string;
  images?: string[];
  voteCount?: string;
  authorName?: string;
  authorAvatar?: string;
  videoTitle?: string;
  videoId?: string;
}

/**
 * Parses community posts from YouTube's ytInitialData
 */
export const parseCommunityPostsFromHtml = (html: string): YouTubeCommunityPost[] => {
  const match = html.match(/var ytInitialData\s*=\s*({.+?});<\/script>/s) || 
                html.match(/window\["ytInitialData"\]\s*=\s*({.+?});<\/script>/s);
  if (!match) return [];
  try {
    const json = JSON.parse(match[1]);
    const posts: YouTubeCommunityPost[] = [];

    const traverse = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;

      if (obj.backstagePostRenderer) {
        const p = obj.backstagePostRenderer;
        const postId = p.postId || '';
        const content = (p.contentText?.runs || []).map((r: any) => r.text).join('') || p.contentText?.simpleText || '';
        const publishedTime = (p.publishedTimeText?.runs || []).map((r: any) => r.text).join('') || p.publishedTimeText?.simpleText || '';

        // Extract images
        let imgUrl = '';
        const multiImgs: string[] = [];
        const singleImg = p.backstageAttachment?.backstageImageRenderer?.image?.thumbnails;
        if (singleImg && singleImg.length > 0) {
          imgUrl = singleImg[singleImg.length - 1]?.url || '';
          multiImgs.push(imgUrl);
        } else if (p.backstageAttachment?.postMultiImageRenderer?.images) {
          p.backstageAttachment.postMultiImageRenderer.images.forEach((imgObj: any) => {
            const thumbs = imgObj?.backstageImageRenderer?.image?.thumbnails;
            if (thumbs && thumbs.length > 0) {
              const u = thumbs[thumbs.length - 1]?.url;
              if (u) multiImgs.push(u);
            }
          });
          if (multiImgs.length > 0) imgUrl = multiImgs[0];
        }

        // Extract attached video
        const videoRenderer = p.backstageAttachment?.videoRenderer;
        let attachedVideoTitle = '';
        let attachedVideoId = '';
        if (videoRenderer) {
          attachedVideoId = videoRenderer.videoId || '';
          attachedVideoTitle = (videoRenderer.title?.runs || []).map((r: any) => r.text).join('') || videoRenderer.title?.simpleText || '';
        }

        // Extract vote / like count
        let voteCount = (p.voteCount?.runs || []).map((r: any) => r.text).join('') || p.voteCount?.simpleText || '';
        if (!voteCount && p.actionButtons?.commentActionButtonsRenderer?.likeButton?.toggleButtonRenderer?.defaultText?.simpleText) {
          voteCount = p.actionButtons.commentActionButtonsRenderer.likeButton.toggleButtonRenderer.defaultText.simpleText;
        }

        // Author details
        const authorName = (p.authorText?.runs || []).map((r: any) => r.text).join('') || p.authorText?.simpleText || '';
        const authorAvatar = p.authorThumbnail?.thumbnails?.slice(-1)[0]?.url || '';

        posts.push({
          id: postId || `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          title: authorName ? `منشور من ${authorName}` : (attachedVideoTitle ? `منشور: ${attachedVideoTitle}` : 'منشور مجتمعي'),
          content: content || (attachedVideoTitle ? `فيديو مرفق: ${attachedVideoTitle}` : ''),
          publishedAt: publishedTime || '',
          url: postId ? `https://www.youtube.com/post/${postId}` : '',
          thumbnail: authorAvatar,
          image: imgUrl,
          images: multiImgs,
          voteCount,
          authorName,
          authorAvatar,
          videoTitle: attachedVideoTitle,
          videoId: attachedVideoId,
        });
      }

      if (obj.sharedPostRenderer) {
        const p = obj.sharedPostRenderer;
        const postId = p.postId || '';
        const content = (p.contentText?.runs || []).map((r: any) => r.text).join('') || '';
        const publishedTime = (p.publishedTimeText?.runs || []).map((r: any) => r.text).join('') || '';
        const authorName = (p.authorText?.runs || []).map((r: any) => r.text).join('') || '';
        const authorAvatar = p.authorThumbnail?.thumbnails?.slice(-1)[0]?.url || '';

        posts.push({
          id: postId || `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          title: authorName ? `مشاركة من ${authorName}` : 'منشور مُعاد مشاركته',
          content,
          publishedAt: publishedTime || '',
          url: postId ? `https://www.youtube.com/post/${postId}` : '',
          thumbnail: authorAvatar,
          authorName,
          authorAvatar,
        });
      }

      for (const key of Object.keys(obj)) {
        traverse(obj[key]);
      }
    };

    traverse(json);

    // Filter out duplicates by postId
    const seen = new Set<string>();
    const uniquePosts: YouTubeCommunityPost[] = [];
    for (const post of posts) {
      if (post.id && !seen.has(post.id)) {
        seen.add(post.id);
        uniquePosts.push(post);
      }
    }
    return uniquePosts;
  } catch (err) {
    console.error('Error parsing ytInitialData:', err);
    return [];
  }
};

/**
 * Fetches YouTube HTML page via Vite proxy or fallback CORS proxies
 */
export const fetchYoutubePageHtml = async (targetPathOrUrl: string): Promise<string> => {
  let relativePath = '';
  let fullUrl = '';

  if (targetPathOrUrl.startsWith('http://') || targetPathOrUrl.startsWith('https://')) {
    fullUrl = targetPathOrUrl;
    try {
      const parsed = new URL(targetPathOrUrl);
      relativePath = parsed.pathname + parsed.search;
    } catch {
      relativePath = targetPathOrUrl;
    }
  } else {
    relativePath = targetPathOrUrl.startsWith('/') ? targetPathOrUrl : `/${targetPathOrUrl}`;
    fullUrl = `https://www.youtube.com${relativePath}`;
  }

  // 1. Vite dev proxy attempt
  try {
    const proxyUrl = `/yt-community-proxy${relativePath}`;
    const res = await fetch(proxyUrl, {
      headers: {
        'Accept-Language': 'ar,en;q=0.9',
      }
    });
    if (res.ok) {
      const html = await res.text();
      if (html.includes('ytInitialData')) {
        return html;
      }
    }
  } catch (err) {
    console.warn('Vite proxy fetch attempt failed:', err);
  }

  // 2. AllOrigins CORS proxy fallback
  try {
    const allOriginsUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(fullUrl)}`;
    const res = await fetch(allOriginsUrl);
    if (res.ok) {
      const html = await res.text();
      if (html.includes('ytInitialData')) {
        return html;
      }
    }
  } catch (err) {
    console.warn('AllOrigins proxy attempt failed:', err);
  }

  // 3. CorsProxy.io fallback
  try {
    const corsProxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(fullUrl)}`;
    const res = await fetch(corsProxyUrl);
    if (res.ok) {
      const html = await res.text();
      if (html.includes('ytInitialData')) {
        return html;
      }
    }
  } catch (err) {
    console.warn('CorsProxy attempt failed:', err);
  }

  throw new Error('تعذر جلب منشورات يوتيوب. يرجى التحقق من اتصال الإنترنت.');
};

/**
 * Fetches all community posts for a specific channel (by handle, customUrl, or channelId)
 */
export const getChannelCommunityPosts = async (channelHandleOrId: string): Promise<YouTubeCommunityPost[]> => {
  let path = '';
  const clean = channelHandleOrId.trim();

  if (clean.includes('youtube.com/')) {
    if (clean.includes('/community')) {
      path = clean.replace(/https?:\/\/(www\.)?youtube\.com/, '');
    } else {
      const base = clean.replace(/\/videos.*|\/shorts.*|\/playlists.*|\/featured.*|\/about.*/, '').replace(/\/$/, '');
      path = base.replace(/https?:\/\/(www\.)?youtube\.com/, '') + '/community';
    }
  } else if (clean.startsWith('@')) {
    path = `/${clean}/community`;
  } else if (clean.startsWith('UC')) {
    path = `/channel/${clean}/community`;
  } else {
    path = `/@${clean}/community`;
  }

  try {
    const html = await fetchYoutubePageHtml(path);
    return parseCommunityPostsFromHtml(html);
  } catch (err) {
    console.warn('getChannelCommunityPosts failed:', err);
    return [];
  }
};

/**
 * Fetches a single community post by URL or postId
 */
export const getSingleCommunityPost = async (postIdOrUrl: string): Promise<YouTubeCommunityPost | null> => {
  let target = postIdOrUrl.trim();
  let postId = '';

  const postMatch = target.match(/\/post\/([a-zA-Z0-9_-]+)/);
  const lbMatch = target.match(/[?&]lb=([a-zA-Z0-9_-]+)/);

  if (postMatch) {
    postId = postMatch[1];
    target = `/post/${postId}`;
  } else if (lbMatch) {
    postId = lbMatch[1];
    target = `/post/${postId}`;
  } else if (!target.startsWith('http') && !target.startsWith('/')) {
    postId = target;
    target = `/post/${target}`;
  }

  try {
    const html = await fetchYoutubePageHtml(target);
    const posts = parseCommunityPostsFromHtml(html);
    if (posts.length === 0) return null;
    if (postId) {
      const found = posts.find(p => p.id === postId);
      if (found) return found;
    }
    return posts[0];
  } catch (err) {
    console.error('getSingleCommunityPost error:', err);
    return null;
  }
};

