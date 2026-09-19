import SpeechRecognition from 'react-speech-recognition'

interface VoiceRecordButtonProps {
  listening: boolean
  dark?: boolean
  browserSupportsSpeechRecognition: boolean
  onClick: () => void
}

export default function VoiceRecordButton({
  listening,
  dark = false,
  browserSupportsSpeechRecognition,
  onClick,
}: VoiceRecordButtonProps) {
  return (
    <button
      type="button"
      aria-label={listening ? 'إيقاف التسجيل' : 'إدخال صوتي'}
      onClick={() => {
        if (!browserSupportsSpeechRecognition) {
          alert('متصفحك لا يدعم خاصية التسجيل الصوتي.')
          return
        }
        onClick()
      }}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
        listening
          ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse'
          : dark
          ? 'text-white/60 hover:text-white hover:bg-white/10'
          : 'text-brand-deep/50 hover:text-brand-magenta hover:bg-brand-magenta/5'
      }`}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
        <path
          d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M19 11a7 7 0 0 1-14 0M12 18v3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
