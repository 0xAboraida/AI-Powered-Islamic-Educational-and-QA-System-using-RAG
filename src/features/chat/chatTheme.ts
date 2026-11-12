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
  _currentAccent?: (typeof ACCENT_STYLES)[string],
  isActive = false,
): string {
  return `flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl transition-all duration-200 cursor-pointer backdrop-blur-xl backdrop-saturate-150 active:scale-95 ${
    dark
      ? `${isActive ? 'bg-white/[0.16] shadow-[0_6px_24px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.22)]' : 'bg-white/[0.08] shadow-[0_6px_20px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.14)] hover:bg-white/[0.14]'} text-white`
      : `${isActive ? 'bg-white/85 shadow-[0_6px_22px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,1)]' : 'bg-white/60 shadow-[0_4px_18px_rgba(15,23,42,0.08),0_1px_3px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.95)] hover:bg-white/80 hover:shadow-[0_6px_22px_rgba(15,23,42,0.11),inset_0_1px_0_rgba(255,255,255,1)]'} text-stone-800`
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

