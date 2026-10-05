import React, { useState } from 'react';
import { Send, ExternalLink, Loader2, AlertCircle, RefreshCw, Maximize2 } from 'lucide-react';
import { parseTelegramUrl } from '../../utils/telegram';

interface TelegramPlayerProps {
  url: string;
  title?: string;
  className?: string;
  height?: string | number;
  autoPlay?: boolean;
}

export const TelegramPlayer: React.FC<TelegramPlayerProps> = ({
  url,
  title,
  className = '',
  height = 360,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [key, setKey] = useState(0);

  const tgInfo = parseTelegramUrl(url);
  const embedUrl = tgInfo.embedUrl;

  const handleRefresh = () => {
    setIsLoading(true);
    setHasError(false);
    setKey(prev => prev + 1);
  };

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 shadow-2xl flex flex-col ${className}`}
      dir="rtl"
    >
      {/* Top Header Bar */}
      <div className="px-4 py-3 bg-gradient-to-r from-neutral-900/90 via-neutral-900 to-neutral-950 border-b border-neutral-800/80 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 shadow-sm">
            <Send size={15} />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-white truncate">
              {title || (tgInfo.channel ? `قناة @${tgInfo.channel}` : 'محتوى تيليجرام المباشر')}
            </h4>
            <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              <span>مشغل تيليجرام المدمج</span>
              {tgInfo.channel && (
                <span className="text-neutral-500 font-mono">(@{tgInfo.channel})</span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            className="p-1.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-all text-xs"
            title="إعادة تحميل المحتوى"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          </button>

          <a
            href={tgInfo.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 hover:text-white text-xs font-bold transition-all shadow-sm active:scale-95"
            title="فتح في تطبيق تيليجرام"
          >
            <ExternalLink size={12} />
            <span className="hidden sm:inline">فتح في التطبيق</span>
          </a>
        </div>
      </div>

      {/* Main Embed Content Container */}
      <div
        className="relative w-full flex-1 bg-black/60 overflow-hidden flex items-center justify-center"
        style={{ minHeight: typeof height === 'number' ? `${height}px` : height }}
      >
        {embedUrl ? (
          <>
            {/* Loading Spinner */}
            {isLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-neutral-950/90 gap-2.5 text-neutral-400">
                <Loader2 size={24} className="animate-spin text-sky-400" />
                <span className="text-xs font-medium">جاري تحميل محتوى وتفريغ تيليجرام...</span>
              </div>
            )}

            {/* Telegram Official Embed Iframe */}
            <iframe
              key={key}
              src={embedUrl}
              title={title || 'محتوى تيليجرام'}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
              className="w-full h-full border-0 rounded-b-2xl bg-neutral-950"
              style={{ minHeight: typeof height === 'number' ? `${height}px` : height }}
              allow="autoplay; encrypted-media; fullscreen"
            />
          </>
        ) : (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
              <AlertCircle size={22} />
            </div>
            <h5 className="text-sm font-bold text-white">رابط تيليجرام غير قابل للتضمين المباشر</h5>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
              قد يكون هذا الرابط خاصاً بقناة مغلقة أو يحتاج إذناً من تيليجرام. يمكنك فتحه مباشرة في تطبيق تيليجرام.
            </p>
            <a
              href={tgInfo.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg transition-all"
            >
              <Send size={13} />
              <span>فتح في تطبيق تيليجرام ↗</span>
            </a>
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-neutral-950/95 p-6 text-center space-y-3">
            <AlertCircle size={24} className="text-red-400" />
            <p className="text-xs text-neutral-300">تعذر تحميل التضمين من خوادم تيليجرام.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-white text-xs font-bold hover:bg-neutral-700"
              >
                إعادة المحاولة
              </button>
              <a
                href={tgInfo.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-500"
              >
                فتح الرابط مباشرة
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
