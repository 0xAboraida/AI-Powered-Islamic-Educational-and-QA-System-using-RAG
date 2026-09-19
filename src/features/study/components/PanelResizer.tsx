import React from 'react'
import { GripVertical } from 'lucide-react'

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
  return (
    <div
      onMouseDown={onMouseDown}
      className="group relative hidden md:flex h-full w-3.5 cursor-col-resize items-center justify-center shrink-0 z-30 select-none touch-none transition-all duration-200"
      title={label}
    >
      {/* Glow highlight line on hover/drag */}
      <div
        className={`h-full w-[2px] transition-all duration-200 group-hover:w-[4px] group-active:w-[4px] ${
          isDark
            ? 'bg-white/15 group-hover:bg-[#a855f7] group-active:bg-[#a855f7] group-hover:shadow-[0_0_14px_rgba(168,85,247,0.8)]'
            : 'bg-slate-300 group-hover:bg-[#a855f7] group-active:bg-[#a855f7] group-hover:shadow-[0_0_14px_rgba(168,85,247,0.5)]'
        }`}
      />

      {/* Floating Grip Handle Knob */}
      <div
        className={`absolute flex h-10 w-4.5 items-center justify-center rounded-full border shadow-lg transition-all duration-200 group-hover:scale-110 group-active:scale-125 ${
          isDark
            ? 'bg-[#180629] border-white/20 text-white/70 group-hover:border-[#a855f7] group-hover:text-white group-hover:bg-[#280b47] shadow-purple-950/80'
            : 'bg-white border-slate-300 text-slate-500 group-hover:border-[#a855f7] group-hover:text-[#a855f7] shadow-slate-300'
        }`}
      >
        <GripVertical size={13} strokeWidth={2.5} />
      </div>
    </div>
  )
}
