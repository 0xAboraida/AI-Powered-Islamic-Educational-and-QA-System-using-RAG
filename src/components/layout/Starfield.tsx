import { useMemo, type CSSProperties } from 'react'

type StarStyle = CSSProperties & Record<string, string | number>

/**
 * A decorative twinkling starfield for the night sky. Stars sit in the upper
 * portion of the section; a couple of shooting stars streak across occasionally.
 * Purely visual — hidden from assistive tech and paused via reduced-motion.
 */
export default function Starfield({ count = 70 }: { count?: number }) {
  const stars = useMemo(() => {
    return Array.from({ length: count }, () => {
      const size = Math.random() * 2 + 1
      return {
        top: Math.random() * 60, // keep them in the sky area
        left: Math.random() * 92 + 8,
        size,
        style: {
          '--star-dur': `${(Math.random() * 3 + 2).toFixed(2)}s`,
          '--star-delay': `${(Math.random() * 4).toFixed(2)}s`,
          '--star-min': (Math.random() * 0.2 + 0.1).toFixed(2),
          '--star-max': (Math.random() * 0.3 + 0.7).toFixed(2),
          // gentle random drift direction + speed
          '--drift-x': `${(Math.random() * 10 - 5).toFixed(1)}px`,
          '--drift-y': `${(Math.random() * 10 - 5).toFixed(1)}px`,
          '--drift-dur': `${(Math.random() * 5 + 6).toFixed(2)}s`,
        } as StarStyle,
      }
    })
  }, [count])

  const shooters = [
    { top: 0, left: 20, style: { '--shoot-dur': '25s', '--shoot-delay': '12s' } as StarStyle },
    { top: 0, left: 45, style: { '--shoot-dur': '15s', '--shoot-delay': '6s' } as StarStyle },
  ]

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {stars.map((s, i) => (
        <span
          key={i}
          className="star"
          style={{ top: `${s.top}%`, left: `${s.left}%`, width: s.size, height: s.size, ...s.style }}
        />
      ))}
      {shooters.map((s, i) => (
        <span key={`sh-${i}`} className="shooting-star" style={{ top: `${s.top}%`, left: `${s.left}%`, ...s.style }} />
      ))}
    </div>
  )
}
