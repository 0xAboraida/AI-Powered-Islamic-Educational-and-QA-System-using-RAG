import type { ReactNode } from 'react'
import ImageWithFallback from './ImageWithFallback'

type Props = {
  src: string
  alt: string
  className?: string
  children?: ReactNode
}

/**
 * A lightweight device bezel used only in the marketing site to present the
 * app screenshots — the app screens themselves carry no chrome.
 */
export default function PhoneFrame({ src, alt, className }: Props) {
  return (
    <div
      className={`relative rounded-[2.5rem] border-[6px] border-[#1c0b2e] bg-[#1c0b2e] p-1.5 shadow-[0_30px_80px_-30px_rgba(91,14,156,0.65)] ${className ?? ''}`}
    >
      {/* speaker notch */}
      <div className="absolute left-1/2 top-2 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-white/20" />
      <div className="overflow-hidden rounded-[2rem] bg-secondary">
        <ImageWithFallback
          src={src}
          alt={alt}
          className="block h-full w-full object-cover"
        />
      </div>
    </div>
  )
}
