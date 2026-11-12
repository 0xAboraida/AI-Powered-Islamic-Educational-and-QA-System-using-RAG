import React, { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';

interface ScholarAvatarProps {
  src?: string;
  name?: string;
  className?: string;
}

function getScholarShortInitials(fullName: string): string {
  if (!fullName) return 'عالم';
  
  if (fullName.includes('العثيمين')) return 'ابن عثيمين';
  if (fullName.includes('ابن باز') || fullName.includes('بن باز')) return 'ابن باز';
  if (fullName.includes('الفوزان')) return 'الفوزان';
  if (fullName.includes('البدر')) return 'البدر';
  if (fullName.includes('المقدم')) return 'المقدم';
  if (fullName.includes('برهامي')) return 'د. ياسر برهامي';
  if (fullName.includes('حطيبة')) return 'د. أحمد حطيبة';
  if (fullName.includes('أحمد فريد')) return 'د. أحمد فريد';
  if (fullName.includes('الحويني')) return 'الحويني';
  if (fullName.includes('العدوي')) return 'العدوي';
  if (fullName.includes('حسان')) return 'محمد حسان';
  if (fullName.includes('يعقوب')) return 'حسين يعقوب';
  if (fullName.includes('الخميس')) return 'عثمان الخميس';
  if (fullName.includes('الكملي')) return 'سعيد الكملي';
  if (fullName.includes('الخضير')) return 'الخضير';
  if (fullName.includes('عامر بهجت')) return 'عامر بهجت';
  if (fullName.includes('الشحات')) return 'الشحات';
  if (fullName.includes('مخيون')) return 'يونس مخيون';
  if (fullName.includes('هيثم طلعت')) return 'هيثم طلعت';
  if (fullName.includes('علاء حامد')) return 'علاء حامد';
  if (fullName.includes('السعيدان')) return 'السعيدان';
  if (fullName.includes('شريف طه')) return 'شريف طه';

  const clean = fullName
    .replace(/^(فضيلة\s+)?(الشيخ\s+)?(د\.\s+|دكتور\s+)?(م\.\s+|مهندس\s+)?/, '')
    .trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'عالم';
  if (parts.length === 1) return parts[0];
  return parts.slice(0, 2).join(' ');
}

export const ScholarAvatar: React.FC<ScholarAvatarProps> = ({
  src,
  name = '',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Filter out stock placeholder photos completely
  const isValidPhoto = Boolean(
    src && 
    src.trim() !== '' && 
    !src.includes('unsplash.com') && 
    !src.includes('ui-avatars.com') &&
    !src.includes('placeholder')
  );

  // Reset state whenever src changes
  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  const hasCustomSize = /\b(w-|h-|size-)/.test(className);
  const sizeClasses = hasCustomSize ? '' : 'w-full h-full';
  const shortTitle = getScholarShortInitials(name);

  // Fallback: Exquisite Islamic Scholarly Medallion
  if (!isValidPhoto || hasError) {
    return (
      <div 
        className={`relative rounded-full overflow-hidden bg-gradient-to-br from-[#241c13] via-[#14100c] to-[#0a0806] border-2 border-[#dfbf83]/40 shrink-0 flex flex-col items-center justify-center text-center p-2 select-none shadow-[inset_0_2px_10px_rgba(0,0,0,0.6)] ${sizeClasses} ${className}`}
        title={name}
      >
        {/* Subtle geometric ring */}
        <div className="absolute inset-1.5 rounded-full border border-dashed border-[#dfbf83]/25 pointer-events-none" />
        
        {/* Decorative Islamic book / knowledge emblem */}
        <BookOpen className="w-1/3 h-1/3 text-[#dfbf83]/70 mb-1 shrink-0 drop-shadow-sm" />
        
        {/* Scholar clean calligraphy label in Bulaq Amiri font */}
        <span className="font-amiri font-bold text-[#dfbf83] text-xs sm:text-sm leading-tight tracking-normal line-clamp-1 px-1 drop-shadow-sm">
          {shortTitle}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative rounded-full overflow-hidden bg-neutral-900 shrink-0 flex items-center justify-center ${sizeClasses} ${className}`}>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#14100c] animate-pulse">
          <BookOpen className="w-1/3 h-1/3 text-[#dfbf83]/40" />
        </div>
      )}

      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        loading="eager"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover block transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};
