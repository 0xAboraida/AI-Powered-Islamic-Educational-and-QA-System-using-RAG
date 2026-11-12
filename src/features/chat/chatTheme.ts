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
  return `flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl transition-all duration-200 cursor-pointer backdrop-blur-[3px] backdrop-saturate-150 active:scale-95 ${
    dark
      ? `${isActive ? 'bg-gradient-to-br from-white/[0.22] via-white/[0.1] to-white/[0.04] shadow-[0_8px_24px_rgba(0,0,0,0.55),inset_0_1px_1px_rgba(255,255,255,0.3),inset_0_-1px_1px_rgba(0,0,0,0.35)]' : 'bg-gradient-to-br from-white/[0.14] via-white/[0.05] to-white/[0.02] shadow-[0_6px_20px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.22),inset_0_-1px_1px_rgba(0,0,0,0.3)] hover:from-white/[0.2] hover:via-white/[0.08] hover:to-white/[0.04]'} text-white`
      : `${isActive ? 'bg-gradient-to-br from-white/55 via-slate-500/[0.07] to-white/30 shadow-[0_6px_20px_rgba(15,23,42,0.12),inset_0_1.5px_1px_rgba(255,255,255,1),inset_0_-1px_1.5px_rgba(15,23,42,0.09)]' : 'bg-gradient-to-br from-white/30 via-slate-500/[0.04] to-white/10 shadow-[0_5px_16px_-3px_rgba(15,23,42,0.10),0_2px_5px_-1px_rgba(15,23,42,0.05),inset_0_1.5px_1px_rgba(255,255,255,0.95),inset_0_-1px_1.5px_rgba(15,23,42,0.08)] hover:from-white/50 hover:via-slate-500/[0.06] hover:to-white/25 hover:shadow-[0_7px_20px_-3px_rgba(15,23,42,0.13),inset_0_1.5px_1px_rgba(255,255,255,1),inset_0_-1px_1.5px_rgba(15,23,42,0.09)]'} text-stone-800`
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

