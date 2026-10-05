import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';

interface ScholarAvatarProps {
  src?: string;
  name?: string;
  className?: string;
}

export const ScholarAvatar: React.FC<ScholarAvatarProps> = ({
  src,
  name = '',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Reset state whenever src changes
  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  // If className doesn't specify an explicit width/height, default to w-full h-full
  const hasCustomSize = /\b(w-|h-|size-)/.test(className);
  const sizeClasses = hasCustomSize ? '' : 'w-full h-full';

  return (
    <div className={`relative rounded-full overflow-hidden bg-neutral-900 shrink-0 flex items-center justify-center ${sizeClasses} ${className}`}>
      {/* Fallback silhouette icon while loading or if image failed */}
      {(!src || hasError || !isLoaded) && (
        <div className={`absolute inset-0 flex items-center justify-center bg-neutral-900 text-neutral-500 ${!isLoaded && src && !hasError ? 'animate-pulse' : ''}`}>
          <User className="w-1/2 h-1/2 text-neutral-400" />
        </div>
      )}

      {src && !hasError && (
        <img
          src={src}
          alt="" // Intentionally empty to prevent browser from showing broken wrapped text
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
      )}
    </div>
  );
};
