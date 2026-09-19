import { useState, type ImgHTMLAttributes } from 'react'

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  fallbackClassName?: string
}

export default function ImageWithFallback({ fallbackClassName, alt, className, ...rest }: Props) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={fallbackClassName ?? `bg-secondary ${className ?? ''}`}
      />
    )
  }

  return (
    <img
      {...rest}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      loading="lazy"
      decoding="async"
    />
  )
}
