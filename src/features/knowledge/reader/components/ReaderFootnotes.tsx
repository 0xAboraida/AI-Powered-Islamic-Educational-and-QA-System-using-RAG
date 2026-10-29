import React, { useMemo } from 'react';
import { parseFootnoteItems, replaceIslamicLigatures, parseIslamicTypography } from '../readerUtils';

export interface RenderSharhDividerProps {
  readerTheme: 'light' | 'dark' | 'sepia';
}

export const RenderSharhDivider: React.FC<RenderSharhDividerProps> = ({ readerTheme }) => (
  <div className="relative my-10 flex items-center justify-center">
    <div className="absolute inset-0 flex items-center">
      <div
        className={`w-full border-t-2 border-dashed ${readerTheme === 'dark'
          ? 'border-amber-500/35'
          : readerTheme === 'sepia'
            ? 'border-[#B89F7D]'
            : 'border-amber-400/60'
          }`}
      />
    </div>
    <div
      className={`relative px-4 py-1 text-xs font-extrabold rounded-full border backdrop-blur-md transition-all ${readerTheme === 'dark'
        ? 'bg-[#181825] border-amber-500/40 text-amber-300 shadow-sm'
        : readerTheme === 'sepia'
          ? 'bg-[#F4ECD8] border-[#C8B89E] text-[#7A401A] shadow-2xs'
          : 'bg-white border-amber-300 text-amber-900 shadow-xs'
        }`}
    >
      الشرح
    </div>
  </div>
);

export interface RenderFootnotesProps {
  footnoteText: string;
  readerTheme: 'light' | 'dark' | 'sepia';
  fontFamily: string;
  fontSize: number;
}

export const RenderFootnotes: React.FC<RenderFootnotesProps> = ({
  footnoteText,
  readerTheme,
  fontFamily,
  fontSize
}) => {
  const items = useMemo(() => parseFootnoteItems(footnoteText), [footnoteText]);

  if (!footnoteText || !footnoteText.trim()) return null;

  const cardBg =
    readerTheme === 'dark'
      ? 'bg-purple-950/40 border-purple-500/30 hover:border-purple-400/50 text-purple-100 shadow-sm'
      : readerTheme === 'sepia'
        ? 'bg-[#F4ECD8]/80 border-[#D4C4A8] hover:border-[#B89F7D] text-[#4A3523] shadow-2xs'
        : 'bg-white/90 border-purple-200/80 hover:border-purple-300 text-slate-800 shadow-sm';

  const badgeStyle =
    readerTheme === 'dark'
      ? 'bg-gradient-to-r from-purple-600 to-brand-magenta text-white border-purple-400/40 shadow-xs'
      : readerTheme === 'sepia'
        ? 'bg-[#E5D7BF] text-[#5C3F22] border-[#C8B89E] font-bold'
        : 'bg-gradient-to-r from-purple-600 to-brand-magenta text-white border-purple-300 shadow-xs';

  return (
    <div className="mt-14 pt-2">
      {/* Footnote Section Header Divider */}
      <div className="relative my-8 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div
            className={`w-full border-t-2 border-dashed ${readerTheme === 'dark'
              ? 'border-purple-500/30'
              : readerTheme === 'sepia'
                ? 'border-[#C8B89E]'
                : 'border-purple-200/80'
              }`}
          />
        </div>
        <div
          className={`relative px-4 py-1 text-xs font-extrabold rounded-full border backdrop-blur-md transition-all ${readerTheme === 'dark'
            ? 'bg-[#181825] border-purple-500/40 text-purple-300 shadow-sm'
            : readerTheme === 'sepia'
              ? 'bg-[#F4ECD8] border-[#C8B89E] text-[#5C3F22] shadow-2xs'
              : 'bg-white border-purple-200 text-purple-800 shadow-xs'
            }`}
        >
          الحواشي والتعليقات
        </div>
      </div>

      {/* Footnote List */}
      {items.length > 0 ? (
        <div className="grid gap-3.5">
          {items.map((item, idx) => (
            <div
              key={idx}
              id={`fn-${item.num}`}
              className={`group flex items-start gap-3.5 p-4 rounded-2xl border transition-all duration-300 ${cardBg}`}
            >
              {/* Stylized Circular Number Badge */}
              <span className={`shrink-0 font-sans font-extrabold text-xs rounded-full border flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 transition-transform group-hover:scale-105 ${badgeStyle}`}>
                {item.num}
              </span>

              {/* Text */}
              <div
                className={`turath-content flex-1 leading-relaxed ${fontFamily}`}
                style={{ fontSize: `${Math.max(13, fontSize - 3)}px` }}
                dangerouslySetInnerHTML={{ __html: parseIslamicTypography(replaceIslamicLigatures(item.text)) }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div
          className={`turath-content prose max-w-none leading-loose opacity-80 ${fontFamily}`}
          style={{ fontSize: `${Math.max(12, fontSize - 4)}px` }}
          dangerouslySetInnerHTML={{ __html: parseIslamicTypography(footnoteText) }}
        />
      )}
    </div>
  );
};
