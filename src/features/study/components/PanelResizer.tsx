import React from 'react'
import { GripVertical } from 'lucide-react'
import { useTheme } from '../../../contexts/ThemeContext'

interface PanelResizerProps {
  onMouseDown: (e: React.MouseEvent) => void
  isDark?: boolean
  label?: string
}

export function PanelResizer({
  onMouseDown,
  isDark = true,
  label = 'سحب لتغيير الحجم'
}: PanelResizerProps) {
  const { accentColor } = useTheme()

  const getLineActiveColor = () => {
    switch (accentColor) {
      case 'amber':
        return isDark
          ? 'group-hover:bg-[#dfbf83] group-active:bg-[#dfbf83] group-hover:shadow-[0_0_14px_rgba(223,191,131,0.8)]'
          : 'group-hover:bg-[#b88d46] group-active:bg-[#b88d46] group-hover:shadow-[0_0_14px_rgba(184,141,70,0.6)]'
      case 'emerald':
        return isDark
          ? 'group-hover:bg-teal-400 group-active:bg-teal-400 group-hover:shadow-[0_0_14px_rgba(45,212,191,0.8)]'
          : 'group-hover:bg-teal-600 group-active:bg-teal-600 group-hover:shadow-[0_0_14px_rgba(13,148,136,0.6)]'
      case 'blue':
        return isDark
          ? 'group-hover:bg-blue-400 group-active:bg-blue-400 group-hover:shadow-[0_0_14px_rgba(96,165,250,0.8)]'
          : 'group-hover:bg-blue-600 group-active:bg-blue-600 group-hover:shadow-[0_0_14px_rgba(37,99,235,0.6)]'
      case 'purple':
      default:
        return isDark
          ? 'group-hover:bg-[#a855f7] group-active:bg-[#a855f7] group-hover:shadow-[0_0_14px_rgba(168,85,247,0.8)]'
          : 'group-hover:bg-[#a855f7] group-active:bg-[#a855f7] group-hover:shadow-[0_0_14px_rgba(168,85,247,0.5)]'
    }
  }

  const getKnobActiveStyle = () => {
    switch (accentColor) {
      case 'amber':
        return isDark
          ? 'bg-[#18120a] border-white/20 text-white/70 group-hover:border-[#dfbf83] group-hover:text-[#eed9b0] group-hover:bg-[#281c0e] shadow-amber-950/80'
          : 'bg-white border-slate-300 text-slate-500 group-hover:border-[#b88d46] group-hover:text-[#b88d46] shadow-slate-300'
      case 'emerald':
        return isDark
          ? 'bg-[#081816] border-white/20 text-white/70 group-hover:border-teal-400 group-hover:text-teal-200 group-hover:bg-[#0c2420] shadow-teal-950/80'
          : 'bg-white border-slate-300 text-slate-500 group-hover:border-teal-600 group-hover:text-teal-600 shadow-slate-300'
      case 'blue':
        return isDark
          ? 'bg-[#0a1224] border-white/20 text-white/70 group-hover:border-blue-400 group-hover:text-blue-200 group-hover:bg-[#0f1c38] shadow-blue-950/80'
          : 'bg-white border-slate-300 text-slate-500 group-hover:border-blue-600 group-hover:text-blue-600 shadow-slate-300'
      case 'purple':
      default:
        return isDark
          ? 'bg-[#180629] border-white/20 text-white/70 group-hover:border-[#a855f7] group-hover:text-white group-hover:bg-[#280b47] shadow-purple-950/80'
          : 'bg-white border-slate-300 text-slate-500 group-hover:border-[#a855f7] group-hover:text-[#a855f7] shadow-slate-300'
    }
  }

  return (
    <div
      onMouseDown={onMouseDown}
      className="group relative hidden md:flex h-full w-3.5 cursor-col-resize items-center justify-center shrink-0 z-30 select-none touch-none transition-all duration-200"
      title={label}
    >
      {/* Glow highlight line on hover/drag */}
      <div
        className={`h-full w-[2px] transition-all duration-200 group-hover:w-[4px] group-active:w-[4px] ${
          isDark ? 'bg-white/15' : 'bg-slate-300'
        } ${getLineActiveColor()}`}
      />

      {/* Floating Grip Handle Knob */}
      <div
        className={`absolute flex h-10 w-4.5 items-center justify-center rounded-full border shadow-lg transition-all duration-200 group-hover:scale-110 group-active:scale-125 ${getKnobActiveStyle()}`}
      >
        <GripVertical size={13} strokeWidth={2.5} />
      </div>
    </div>
  )
}
