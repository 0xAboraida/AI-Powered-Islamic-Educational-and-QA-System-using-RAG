import { Square } from 'lucide-react'

interface VoiceChatButtonProps {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  className?: string
  iconClassName?: string
}

export default function VoiceChatButton({
  onClick,
  isActive = false,
  disabled = false,
  className = 'h-14 w-14',
  iconClassName = 'h-8 w-8',
}: VoiceChatButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={isActive ? 'إنهاء المكالمة' : 'المحادثة الصوتية'}
      title={isActive ? 'إنهاء المكالمة' : 'المحادثة الصوتية'}
      className={`gradient-border flex shrink-0 items-center justify-center rounded-full text-white shadow-xl shadow-primary/30 transition-transform hover:-translate-y-0.5 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-40 disabled:hover:scale-100 disabled:hover:translate-y-0 group ${className}`}
    >
      {isActive ? (
        <Square size={24} className="fill-white" />
      ) : (
        <svg viewBox="0 0 24 24" fill="none" className={iconClassName}>
          <path d="M5 10v4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M9.5 7v10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M14.5 4.5v15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M19 8v8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      )}
    </button>
  )
}
