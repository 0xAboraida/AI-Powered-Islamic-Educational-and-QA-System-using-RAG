import bgDarkPurple from '@/assets/images/pc view main page background dark purple.png'
import bgDarkAmber from '@/assets/images/pc view main page background dark agee.webp'
import bgDarkTeal from '@/assets/images/pc view main page background dark teal.webp'
import bgDarkBlue from '@/assets/images/pc view main page background dark blue.webp'

export function getWorkspaceDarkBg(accentColor: string): string {
  switch (accentColor) {
    case 'amber':
      return bgDarkAmber
    case 'emerald':
      return bgDarkTeal
    case 'blue':
      return bgDarkBlue
    case 'purple':
    default:
      return bgDarkPurple
  }
}

export function getWorkspacePatternColor(accentColor: string, isDark: boolean): string {
  switch (accentColor) {
    case 'amber':
      return isDark ? 'text-[#dfbf83]' : 'text-[#b88d46]'
    case 'emerald':
      return isDark ? 'text-teal-400' : 'text-teal-600'
    case 'blue':
      return isDark ? 'text-blue-400' : 'text-blue-600'
    case 'purple':
    default:
      return isDark ? 'text-[#d884d8]' : 'text-[#800080]'
  }
}

export function getPanelToggleClass(isOpen: boolean, accentColor: string, isDark: boolean): string {
  if (isOpen) {
    if (isDark) {
      switch (accentColor) {
        case 'emerald':
          return 'bg-teal-500/25 border-teal-400/50 text-teal-100 shadow-lg shadow-teal-500/20 font-extrabold scale-[1.02] ring-1 ring-teal-400/30'
        case 'amber':
          return 'bg-[#dfbf83]/25 border-[#dfbf83]/50 text-[#f5ebd7] shadow-lg shadow-amber-500/20 font-extrabold scale-[1.02] ring-1 ring-[#dfbf83]/30'
        case 'blue':
          return 'bg-blue-500/25 border-blue-400/50 text-blue-100 shadow-lg shadow-blue-500/20 font-extrabold scale-[1.02] ring-1 ring-blue-400/30'
        case 'purple':
        default:
          return 'bg-[#800080] border-[#990099] text-white shadow-lg shadow-[#800080]/40 font-extrabold scale-[1.02] ring-1 ring-[#990099]'
      }
    } else {
      switch (accentColor) {
        case 'emerald':
          return 'bg-gradient-to-b from-white via-teal-50/70 to-teal-100/80 border-teal-300 text-teal-950 shadow-md font-extrabold scale-[1.02]'
        case 'amber':
          return 'bg-gradient-to-b from-white via-[#fbf8f0] to-[#f4ecdc] border-[#dfbf83] text-[#5e431a] shadow-md font-extrabold scale-[1.02]'
        case 'blue':
          return 'bg-gradient-to-b from-white via-blue-50/70 to-blue-100/80 border-blue-300 text-blue-950 shadow-md font-extrabold scale-[1.02]'
        case 'purple':
        default:
          return 'bg-gradient-to-b from-white via-purple-50/70 to-purple-100/80 border-[#800080]/40 text-[#800080] shadow-md font-extrabold scale-[1.02]'
      }
    }
  }

  return isDark
    ? 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
    : 'bg-white/50 border border-slate-200/90 text-slate-600 hover:bg-white/80 hover:text-slate-900 hover:border-slate-300'
}

export function getToolbarCircleBtnClass(accentColor: string, isDark: boolean): string {
  if (isDark) {
    switch (accentColor) {
      case 'emerald':
        return 'bg-teal-500/15 backdrop-blur-md border border-teal-500/30 hover:bg-teal-500/25 text-teal-100'
      case 'amber':
        return 'bg-[#dfbf83]/15 backdrop-blur-md border border-[#dfbf83]/30 hover:bg-[#dfbf83]/25 text-[#f5ebd7]'
      case 'blue':
        return 'bg-blue-500/15 backdrop-blur-md border border-blue-500/30 hover:bg-blue-500/25 text-blue-100'
      case 'purple':
      default:
        return 'bg-[#800080]/35 backdrop-blur-md border border-[#800080]/60 hover:bg-[#800080]/60 text-white'
    }
  } else {
    switch (accentColor) {
      case 'emerald':
        return 'bg-white border border-teal-200 hover:bg-teal-50 text-teal-700 shadow-md'
      case 'amber':
        return 'bg-white border border-[#dfbf83]/60 hover:bg-[#fbf8f0] text-[#78350f] shadow-md'
      case 'blue':
        return 'bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 shadow-md'
      case 'purple':
      default:
        return 'bg-white border border-[#800080]/30 hover:bg-purple-50 text-[#800080] shadow-md'
    }
  }
}

export function getZadWordClass(accentColor: string, isDark: boolean): string {
  switch (accentColor) {
    case 'amber':
      return isDark ? 'text-[#e8cda2]' : 'text-[#855e24]'
    case 'emerald':
      return isDark ? 'text-teal-300' : 'text-teal-800'
    case 'blue':
      return isDark ? 'text-blue-300' : 'text-blue-800'
    case 'purple':
    default:
      return isDark ? 'text-[#d884d8]' : 'text-[#800080]'
  }
}

export function getNavCircleBtnStyle(accentColor: string, isDark: boolean): string {
  if (isDark) {
    switch (accentColor) {
      case 'amber':
        return 'bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-[#dfbf83]/50 text-slate-300 hover:text-[#eed8ad] shadow-xs'
      case 'emerald':
        return 'bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-teal-400/50 text-slate-300 hover:text-teal-200 shadow-xs'
      case 'blue':
        return 'bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-blue-400/50 text-slate-300 hover:text-blue-200 shadow-xs'
      case 'purple':
      default:
        return 'bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-[#800080] text-slate-300 hover:text-white shadow-xs'
    }
  } else {
    switch (accentColor) {
      case 'amber':
        return 'bg-white/80 hover:bg-white border border-[#ebd9b5] hover:border-[#dfbf83] text-[#8a652a] shadow-xs'
      case 'emerald':
        return 'bg-white/80 hover:bg-white border border-teal-200 hover:border-teal-300 text-teal-800 shadow-xs'
      case 'blue':
        return 'bg-white/80 hover:bg-white border border-blue-200 hover:border-blue-300 text-blue-800 shadow-xs'
      case 'purple':
      default:
        return 'bg-white/80 hover:bg-white border border-[#800080]/30 hover:border-[#800080] text-[#800080] shadow-xs'
    }
  }
}
