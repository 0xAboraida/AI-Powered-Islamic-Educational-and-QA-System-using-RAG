import type { CSSProperties } from 'react'
import type { ACCENT_STYLES } from '../../contexts/ThemeContext'

export const LIGHT_RESPONSIVE_PAGE_BG: Record<string, string> = {
  amber: 'bg-white sm:bg-[#fbf8f0]',
  emerald: 'bg-white sm:bg-[#f0fdfa]',
  blue: 'bg-white sm:bg-[#eff6ff]',
  purple: 'bg-white sm:bg-[#faf7ff]',
}

export function getGlassHeaderButtonClass(
  dark: boolean,
  currentAccent: (typeof ACCENT_STYLES)[string],
  isActive = false,
): string {
  return `flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl transition-all duration-200 cursor-pointer backdrop-blur-xl border ${
    dark
      ? `bg-gradient-to-b from-white/[0.14] to-white/[0.05] border-white/15 text-white shadow-[0_6px_20px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.18)] hover:from-white/[0.2] hover:to-white/[0.08] ${currentAccent.darkBorderHover} ${isActive ? 'from-white/[0.22] to-white/[0.1] ring-2 ring-white/25' : ''}`
      : `bg-gradient-to-b from-white/75 to-white/40 ${currentAccent.lightBorder} text-stone-800 shadow-[0_6px_20px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] hover:from-white/85 hover:to-white/55 ${currentAccent.lightBorderHover} ${isActive ? 'from-white/90 to-white/65 ring-2 ring-current/20' : ''}`
  }`
}

export function getZadMaskStyle(logoUrl: string, color: string): CSSProperties {
  return {
    backgroundColor: color,
    WebkitMaskImage: `url(${logoUrl})`,
    maskImage: `url(${logoUrl})`,
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
  }
}

