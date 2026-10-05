/**
 * Utility functions for parsing and embedding Telegram content
 */

export interface TelegramUrlInfo {
  isTelegram: boolean;
  channel?: string;
  postId?: string;
  isPost: boolean;
  embedUrl?: string;
  originalUrl: string;
}

export function parseTelegramUrl(rawUrl?: string): TelegramUrlInfo {
  const fallback: TelegramUrlInfo = {
    isTelegram: false,
    isPost: false,
    originalUrl: rawUrl || ''
  };

  if (!rawUrl) return fallback;

  const url = rawUrl.trim();
  const isTg = url.includes('t.me/') || url.includes('telegram.me/');
  if (!isTg) {
    return fallback;
  }

  try {
    // Check if it's already an embed URL
    if (url.includes('?embed=') || url.includes('&embed=')) {
      return {
        isTelegram: true,
        isPost: true,
        embedUrl: url,
        originalUrl: url
      };
    }

    // Matches: https://t.me/channel_name/123 or https://t.me/c/12345/678
    const postMatch = url.match(/(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]+)\/(\d+)/i);
    if (postMatch) {
      const channel = postMatch[1];
      const postId = postMatch[2];
      return {
        isTelegram: true,
        channel,
        postId,
        isPost: true,
        // Official Telegram post embed with dark mode parameter
        embedUrl: `https://t.me/${channel}/${postId}?embed=1&dark=1`,
        originalUrl: url
      };
    }

    // Matches channel web preview: https://t.me/channel_name or https://t.me/s/channel_name
    const channelMatch = url.match(/(?:t\.me|telegram\.me)\/(?:s\/)?([a-zA-Z0-9_]+)/i);
    if (channelMatch && !['share', 'joinchat', 'addstickers', 'c'].includes(channelMatch[1])) {
      const channel = channelMatch[1];
      return {
        isTelegram: true,
        channel,
        isPost: false,
        // Official Telegram channel web stream preview
        embedUrl: `https://t.me/s/${channel}`,
        originalUrl: url
      };
    }
  } catch (e) {
    console.error('Error parsing telegram URL:', e);
  }

  return {
    isTelegram: true,
    isPost: false,
    originalUrl: url
  };
}

export function getTelegramEmbedUrl(rawUrl?: string): string | null {
  const info = parseTelegramUrl(rawUrl);
  return info.embedUrl || null;
}
