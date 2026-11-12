import React from 'react';

const MOBILE_PATTERN_MEDIA_QUERY = '(max-width: 639.98px)';

interface IslamicPatternProps {
  className?: string;
  opacity?: number;
  mobileOpacity?: number;
  strokeColor?: string;
  fillColor?: string;
  scale?: number;
  mobileScale?: number;
  strokeWidth?: number;
  mobileStrokeWidth?: number;
  isFixed?: boolean;
}

/**
 * Authentic 8-pointed Star (Rub el-Hizb / Girih) Islamic Geometric Tessellation
 * A seamless mathematical SVG pattern based on classical Islamic geometric design.
 */
export default function IslamicPattern({
  className = '',
  opacity = 0.08,
  mobileOpacity,
  strokeColor = 'currentColor',
  fillColor = 'none',
  scale = 1,
  mobileScale,
  strokeWidth = 1.2,
  mobileStrokeWidth,
  isFixed = false
}: IslamicPatternProps) {
  const rawId = React.useId();
  const patternId = `islamic-girih-${rawId.replace(/[^a-zA-Z0-9-_]/g, '')}`;
  const hasMobileOverrides =
    mobileOpacity !== undefined || mobileScale !== undefined || mobileStrokeWidth !== undefined;

  const [isMobile, setIsMobile] = React.useState(() =>
    hasMobileOverrides && typeof window !== 'undefined'
      ? window.matchMedia(MOBILE_PATTERN_MEDIA_QUERY).matches
      : false,
  );

  React.useEffect(() => {
    if (!hasMobileOverrides || typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia(MOBILE_PATTERN_MEDIA_QUERY);
    setIsMobile(mediaQuery.matches);
    const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, [hasMobileOverrides]);

  const effectiveOpacity = isMobile && mobileOpacity !== undefined ? mobileOpacity : opacity;
  const effectiveScale = isMobile && mobileScale !== undefined ? mobileScale : scale;
  const effectiveStrokeWidth = isMobile && mobileStrokeWidth !== undefined ? mobileStrokeWidth : strokeWidth;

  // Divide by scale so the pattern's rendered visual stroke stays true even when scaled up on mobile.
  const primaryStroke = Number((effectiveStrokeWidth / effectiveScale).toFixed(3));
  const secondaryStroke = Number(((effectiveStrokeWidth * (1 / 1.2)) / effectiveScale).toFixed(3));

  return (
    <div 
      className={`${isFixed ? 'fixed' : 'absolute'} inset-0 pointer-events-none overflow-hidden transition-opacity duration-300 ${className}`} 
      style={{ opacity: effectiveOpacity }}
      aria-hidden="true"
    >
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id={patternId}
            width={120 * effectiveScale}
            height={120 * effectiveScale}
            patternUnits="userSpaceOnUse"
          >
            <g transform={`scale(${effectiveScale})`}>
              {/* Center 8-pointed star: Center (60, 60), Outer R=28, Inner R=14 */}
            <polygon
              points="
                88,60 72.9,65.4 79.8,79.8 65.4,72.9 
                60,88 54.6,72.9 40.2,79.8 47.1,65.4 
                32,60 47.1,54.6 40.2,40.2 54.6,47.1 
                60,32 65.4,47.1 79.8,40.2 72.9,54.6
              "
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={primaryStroke}
              strokeLinejoin="round"
            />

            {/* Corner 1: Top-Left (0, 0) */}
            <polygon
              points="
                28,0 12.9,5.4 19.8,19.8 5.4,12.9 
                0,28 -5.4,12.9 -19.8,19.8 -12.9,5.4 
                -28,0 -12.9,-5.4 -19.8,-19.8 -5.4,-12.9 
                0,-28 5.4,-12.9 19.8,-19.8 12.9,-5.4
              "
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={primaryStroke}
              strokeLinejoin="round"
            />

            {/* Corner 2: Top-Right (120, 0) */}
            <polygon
              points="
                148,0 132.9,5.4 139.8,19.8 125.4,12.9 
                120,28 114.6,12.9 100.2,19.8 107.1,5.4 
                92,0 107.1,-5.4 100.2,-19.8 114.6,-12.9 
                120,-28 125.4,-12.9 139.8,-19.8 132.9,-5.4
              "
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={primaryStroke}
              strokeLinejoin="round"
            />

            {/* Corner 3: Bottom-Left (0, 120) */}
            <polygon
              points="
                28,120 12.9,125.4 19.8,139.8 5.4,132.9 
                0,148 -5.4,132.9 -19.8,139.8 -12.9,125.4 
                -28,120 -12.9,114.6 -19.8,100.2 -5.4,107.1 
                0,92 5.4,107.1 19.8,100.2 12.9,114.6
              "
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={primaryStroke}
              strokeLinejoin="round"
            />

            {/* Corner 4: Bottom-Right (120, 120) */}
            <polygon
              points="
                148,120 132.9,125.4 139.8,139.8 125.4,132.9 
                120,148 114.6,132.9 100.2,139.8 107.1,125.4 
                92,120 107.1,114.6 100.2,100.2 114.6,107.1 
                120,92 125.4,107.1 139.8,100.2 132.9,114.6
              "
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={primaryStroke}
              strokeLinejoin="round"
            />

            {/* Interlacing Geometric Straps & Connectors */}
            {/* Horizontal & Vertical grid connectors connecting tips */}
            <line x1="88" y1="60" x2="92" y2="60" stroke={strokeColor} strokeWidth={primaryStroke} />
            <line x1="32" y1="60" x2="28" y2="60" stroke={strokeColor} strokeWidth={primaryStroke} />
            <line x1="60" y1="88" x2="60" y2="92" stroke={strokeColor} strokeWidth={primaryStroke} />
            <line x1="60" y1="32" x2="60" y2="28" stroke={strokeColor} strokeWidth={primaryStroke} />

            {/* Diagonal interconnects forming Islamic octagonal cartouches */}
            <line x1="79.8" y1="79.8" x2="100.2" y2="100.2" stroke={strokeColor} strokeWidth={secondaryStroke} />
            <line x1="40.2" y1="40.2" x2="19.8" y2="19.8" stroke={strokeColor} strokeWidth={secondaryStroke} />
            <line x1="79.8" y1="40.2" x2="100.2" y2="19.8" stroke={strokeColor} strokeWidth={secondaryStroke} />
            <line x1="40.2" y1="79.8" x2="19.8" y2="100.2" stroke={strokeColor} strokeWidth={secondaryStroke} />

            {/* Surrounding diamond straps */}
            <path
              d="
                M 60,18 L 78,0 L 60,-18 L 42,0 Z
                M 60,138 L 78,120 L 60,102 L 42,120 Z
                M 18,60 L 0,78 L -18,60 L 0,42 Z
                M 138,60 L 120,78 L 102,60 L 120,42 Z
              "
              fill="none"
              stroke={strokeColor}
              strokeWidth={secondaryStroke}
            />

            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
}
