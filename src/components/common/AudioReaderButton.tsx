import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Volume2, VolumeX, Pause, Play, Square, Loader2, Gauge, UserCheck, Download, Radio, Check, X } from 'lucide-react'
import {
  speakText,
  stopAllSpeech,
  pauseSpeech,
  resumeSpeech,
  setMuteState,
  setPlaybackSpeed,
  setVoiceName,
  getVoiceName,
  downloadAudioFile,
  speakPodcastSummary,
  AVAILABLE_VOICES,
  VoiceName
} from '@/services/geminiTtsService'

interface AudioReaderButtonProps {
  text: string
  label?: string
  dark?: boolean
  className?: string
  showTextLabel?: boolean
  hidePodcast?: boolean
  autoPlay?: boolean
  onStateChange?: (isPlaying: boolean) => void
  colorTheme?: 'emerald' | 'purple' | 'amber' | 'blue'
  orientation?: 'horizontal' | 'vertical'
  menuPlacement?: 'top' | 'left' | 'right'
  variant?: 'default' | 'deck'
  onClose?: () => void
}

const SPEED_OPTIONS = [1.0, 1.25, 1.5, 2.0, 0.8]

export function AudioReaderButton({
  text,
  label,
  dark = true,
  className = '',
  showTextLabel = true,
  hidePodcast = false,
  autoPlay = false,
  onStateChange,
  colorTheme = 'emerald',
  orientation = 'horizontal',
  menuPlacement = 'top',
  variant = 'default',
  onClose,
}: AudioReaderButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isPodcastMode, setIsPodcastMode] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDownloaded, setIsDownloaded] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentSpeed, setCurrentSpeed] = useState(1.0)
  const [currentVoice, setCurrentVoice] = useState<VoiceName>(getVoiceName())
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [showVoiceMenu, setShowVoiceMenu] = useState(false)

  const menuRef = useRef<HTMLDivElement>(null)

  const usePurple = isPodcastMode || colorTheme === 'purple'

  useEffect(() => {
    if (onStateChange) {
      onStateChange(isPlaying || isPaused || isLoading)
    }
  }, [isPlaying, isPaused, isLoading, onStateChange])

  useEffect(() => {
    return () => {
      if (isPlaying) {
        stopAllSpeech()
      }
    }
  }, [isPlaying])

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowSpeedMenu(false)
        setShowVoiceMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (autoPlay && text && text.trim()) {
      handleStartOrToggleSpeech()
    }
  }, [autoPlay])

  const handleStartOrToggleSpeech = async (overrideVoice?: VoiceName) => {
    if (!text || !text.trim()) return

    if (isLoading) {
      handleFullStopSpeech()
      return
    }

    if (isPaused && !overrideVoice) {
      resumeSpeech()
      setIsPaused(false)
      setIsPlaying(true)
      return
    }

    if (isPlaying && !overrideVoice) {
      pauseSpeech()
      setIsPaused(true)
      return
    }

    const voiceToUse = overrideVoice || currentVoice

    setIsPodcastMode(false)
    setIsLoading(true)
    setIsMuted(false)
    setIsPaused(false)
    setMuteState(false)
    setPlaybackSpeed(currentSpeed)

    try {
      await speakText(text, {
        voiceName: voiceToUse,
        playbackRate: currentSpeed,
        onStart: () => {
          setIsLoading(false)
          setIsPlaying(true)
          setIsPaused(false)
        },
        onEnd: () => {
          setIsPlaying(false)
          setIsPaused(false)
          setIsLoading(false)
          setIsMuted(false)
          setIsPodcastMode(false)
        },
        onError: (err) => {
          console.error('Audio engine error:', err)
          setIsPlaying(false)
          setIsPaused(false)
          setIsLoading(false)
          setIsMuted(false)
          setIsPodcastMode(false)
        },
      })
    } catch (err) {
      console.error('Failed to start speech:', err)
      setIsPlaying(false)
      setIsPaused(false)
      setIsLoading(false)
      setIsMuted(false)
      setIsPodcastMode(false)
    }
  }

  const handleStartPodcast = async () => {
    if (!text || !text.trim()) return

    if (isLoading) {
      handleFullStopSpeech()
      return
    }

    if (isPaused && isPodcastMode) {
      resumeSpeech()
      setIsPaused(false)
      setIsPlaying(true)
      return
    }

    if (isPlaying && isPodcastMode) {
      pauseSpeech()
      setIsPaused(true)
      return
    }

    setIsPodcastMode(true)
    setIsLoading(true)
    setIsMuted(false)
    setIsPaused(false)
    setMuteState(false)

    try {
      await speakPodcastSummary(text, {
        voiceName: currentVoice,
        onStart: () => {
          setIsLoading(false)
          setIsPlaying(true)
          setIsPaused(false)
        },
        onEnd: () => {
          setIsPlaying(false)
          setIsPaused(false)
          setIsLoading(false)
          setIsMuted(false)
          setIsPodcastMode(false)
        },
        onError: (err) => {
          console.error('Podcast engine error:', err)
          setIsPlaying(false)
          setIsPaused(false)
          setIsLoading(false)
          setIsMuted(false)
          setIsPodcastMode(false)
        },
      })
    } catch (err) {
      console.error('Failed to start podcast:', err)
      setIsPlaying(false)
      setIsPaused(false)
      setIsLoading(false)
      setIsMuted(false)
      setIsPodcastMode(false)
    }
  }

  const triggerDownloadConfirmation = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowConfirmModal(true)
  }

  const executeConfirmedDownload = async () => {
    setShowConfirmModal(false)
    if (!text || isDownloading) return
    setIsDownloading(true)
    try {
      const ok = await downloadAudioFile(text, undefined, currentVoice, isPodcastMode)
      if (ok) {
        setIsDownloaded(true)
        setTimeout(() => setIsDownloaded(false), 3000)
      }
    } catch (err) {
      console.error('Audio download failed:', err)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleFullStopSpeech = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    stopAllSpeech()
    setIsPlaying(false)
    setIsPaused(false)
    setIsLoading(false)
    setIsMuted(false)
    setIsPodcastMode(false)
    setShowSpeedMenu(false)
    setShowVoiceMenu(false)
  }

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    const nextMuteState = !isMuted
    setIsMuted(nextMuteState)
    setMuteState(nextMuteState)
  }

  const handleSelectSpeed = (speed: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentSpeed(speed)
    setPlaybackSpeed(speed)
    setShowSpeedMenu(false)
  }

  const handleSelectVoice = (voiceId: VoiceName, e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentVoice(voiceId)
    setVoiceName(voiceId)
    setShowVoiceMenu(false)

    if (isPlaying || isPaused) {
      if (isPodcastMode) {
        handleStartPodcast()
      } else {
        handleStartOrToggleSpeech(voiceId)
      }
    }
  }

  const selectedVoiceObj = AVAILABLE_VOICES.find((v) => v.id === currentVoice) || AVAILABLE_VOICES[0]

  // Dynamic Theme Palette matching the active app theme
  const themeClasses = {
    amber: {
      text: 'text-amber-500',
      textDark: 'text-amber-400',
      bg: 'bg-amber-500 hover:bg-amber-600',
      bgRing: 'ring-amber-500/30 shadow-amber-500/20',
      bar: 'bg-amber-500',
      badgeDark: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
      badgeLight: 'bg-amber-50 border-amber-300 text-amber-950',
      descDark: 'text-amber-200/80',
      descLight: 'text-amber-800',
    },
    emerald: {
      text: 'text-teal-600 dark:text-teal-400',
      textDark: 'text-teal-400',
      bg: 'bg-teal-600 hover:bg-teal-700',
      bgRing: 'ring-teal-500/30 shadow-teal-500/20',
      bar: 'bg-teal-500',
      badgeDark: 'bg-teal-500/20 border-teal-500/40 text-teal-300',
      badgeLight: 'bg-teal-50 border-teal-300 text-teal-950',
      descDark: 'text-teal-200/80',
      descLight: 'text-teal-800',
    },
    blue: {
      text: 'text-blue-600 dark:text-blue-400',
      textDark: 'text-blue-400',
      bg: 'bg-blue-600 hover:bg-blue-700',
      bgRing: 'ring-blue-500/30 shadow-blue-500/20',
      bar: 'bg-blue-500',
      badgeDark: 'bg-blue-500/20 border-blue-500/40 text-blue-300',
      badgeLight: 'bg-blue-50 border-blue-300 text-blue-950',
      descDark: 'text-blue-200/80',
      descLight: 'text-blue-800',
    },
    purple: {
      text: 'text-brand-magenta dark:text-purple-400',
      textDark: 'text-purple-400',
      bg: 'bg-brand-magenta hover:bg-brand-magenta/90',
      bgRing: 'ring-brand-magenta/30 shadow-brand-magenta/20',
      bar: 'bg-brand-magenta',
      badgeDark: 'bg-purple-500/20 border-purple-500/40 text-purple-300',
      badgeLight: 'bg-purple-50 border-purple-300 text-purple-950',
      descDark: 'text-purple-200/80',
      descLight: 'text-purple-800',
    },
  }[colorTheme || 'emerald'] || {
    text: 'text-teal-600 dark:text-teal-400',
    textDark: 'text-teal-400',
    bg: 'bg-teal-600 hover:bg-teal-700',
    bgRing: 'ring-teal-500/30 shadow-teal-500/20',
    bar: 'bg-teal-500',
    badgeDark: 'bg-teal-500/20 border-teal-500/40 text-teal-300',
    badgeLight: 'bg-teal-50 border-teal-300 text-teal-950',
    descDark: 'text-teal-200/80',
    descLight: 'text-teal-800',
  };

  return (
    <div ref={menuRef} className={`relative ${variant === 'deck' ? 'w-full' : 'inline-flex items-center gap-2'} select-none`}>
      {variant === 'deck' ? (
        /* Dedicated Full-Width Smart Deck Layout for Reader Shelf */
        <div className="w-full flex items-center justify-between gap-1.5 sm:gap-3 py-1 select-none text-xs">
          {/* Start (Right in RTL): Soundwave + Voice Pill + Speed Pill */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Animated Soundwave Indicator */}
            <div className="flex items-center gap-0.5 h-4 px-1" title={isPlaying ? "جاري الاستماع" : isPaused ? "متوقف مؤقتاً" : "القارئ جاهز"}>
              <span className={`w-0.5 rounded-full transition-all duration-300 ${isPlaying ? `h-3 animate-pulse ${themeClasses.bar}` : 'h-1.5 bg-muted-foreground/30'}`} />
              <span className={`w-0.5 rounded-full transition-all duration-300 ${isPlaying ? `h-4 animate-bounce ${themeClasses.bar}` : 'h-2 bg-muted-foreground/30'}`} style={{ animationDelay: '100ms' }} />
              <span className={`w-0.5 rounded-full transition-all duration-300 ${isPlaying ? `h-2.5 animate-pulse ${themeClasses.bar}` : 'h-1.5 bg-muted-foreground/30'}`} style={{ animationDelay: '200ms' }} />
              <span className={`w-0.5 rounded-full transition-all duration-300 ${isPlaying ? `h-3.5 animate-bounce ${themeClasses.bar}` : 'h-1 bg-muted-foreground/30'}`} style={{ animationDelay: '150ms' }} />
            </div>

            {/* Voice Pill */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowVoiceMenu(!showVoiceMenu)
                setShowSpeedMenu(false)
              }}
              type="button"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                dark
                  ? 'bg-white/5 hover:bg-white/10 text-white/90 border-white/10'
                  : 'bg-black/[0.04] hover:bg-black/[0.08] text-slate-800 border-black/10'
              }`}
              title="تغيير شخصية القارئ الصوتي"
            >
              <UserCheck size={12} className={`${themeClasses.text} shrink-0`} />
              <span className="text-[11px] font-bold">{selectedVoiceObj.name}</span>
              <span className="text-[9px] opacity-60">▾</span>
            </button>

            {/* Speed Pill */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowSpeedMenu(!showSpeedMenu)
                setShowVoiceMenu(false)
              }}
              type="button"
              className={`flex items-center gap-0.5 px-2 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                dark
                  ? 'bg-white/5 hover:bg-white/10 text-white/90 border-white/10'
                  : 'bg-black/[0.04] hover:bg-black/[0.08] text-slate-800 border-black/10'
              }`}
              title="تغيير سرعة القراءة"
            >
              <Gauge size={11} className={`${themeClasses.text} shrink-0`} />
              <span className="text-[11px] font-bold">{currentSpeed}x</span>
              <span className="text-[9px] opacity-60">▾</span>
            </button>
          </div>

          {/* Center: Play / Pause Button + Stop Button */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Stop Button */}
            <button
              onClick={handleFullStopSpeech}
              type="button"
              title="إيقاف وإنهاء القراءة"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                dark ? 'text-rose-400 hover:bg-rose-500/20' : 'text-rose-600 hover:bg-rose-100'
              }`}
            >
              <Square size={13} className="fill-current" />
            </button>

            {/* Main Play / Pause Circle Button */}
            <button
              onClick={() => handleStartOrToggleSpeech()}
              type="button"
              disabled={isLoading}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-md transition-all duration-200 cursor-pointer ${
                isPaused
                  ? `${themeClasses.bg} text-white ring-2 ${themeClasses.bgRing}`
                  : isPlaying
                  ? `${themeClasses.bg} text-white ring-2 ${themeClasses.bgRing}`
                  : `${themeClasses.bg} text-white`
              }`}
              title={isPlaying ? "إيقاف مؤقت" : "تشغيل القراءة"}
            >
              {isLoading ? (
                <Loader2 size={14} className="animate-spin text-white" />
              ) : isPaused ? (
                <Play size={13} className="fill-current text-white ml-0.5" />
              ) : (
                <Pause size={13} className="fill-current text-white" />
              )}
            </button>
          </div>

          {/* End (Left in RTL): Mute + Download + Close */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Mute Button */}
            <button
              onClick={handleToggleMute}
              type="button"
              title={isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isMuted
                  ? `${themeClasses.text} bg-black/5 dark:bg-white/10`
                  : dark
                  ? 'text-white/70 hover:text-white hover:bg-white/10'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-black/5'
              }`}
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>

            {/* Download Button */}
            <button
              onClick={triggerDownloadConfirmation}
              type="button"
              title="تحميل المقطع الصوتي كـ WAV"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDownloaded
                  ? `${themeClasses.text} bg-black/5 dark:bg-white/10`
                  : dark
                  ? 'text-white/70 hover:text-white hover:bg-white/10'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-black/5'
              }`}
            >
              {isDownloading ? (
                <Loader2 size={14} className={`animate-spin ${themeClasses.text}`} />
              ) : isDownloaded ? (
                <Check size={14} className={themeClasses.text} />
              ) : (
                <Download size={14} />
              )}
            </button>

            {/* Close Shelf Button */}
            {onClose && (
              <button
                type="button"
                onClick={() => {
                  handleFullStopSpeech();
                  onClose();
                }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  dark ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-900 hover:bg-black/5'
                }`}
                title="إغلاق فريم الصوت"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      ) : isPlaying || isPaused || isLoading ? (
        /* Full Interactive Audio Controls Bar (Standard / Vertical layout) */
        <div
          className={`flex ${orientation === 'vertical' ? 'flex-col items-center' : 'items-center'} gap-1.5 p-1 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 ${
            dark
              ? 'bg-slate-900/90 border-white/10 text-white shadow-black/30'
              : 'bg-white/95 border-slate-200 text-slate-800 shadow-md'
          }`}
        >
          {/* Main Play / Pause Button */}
          <button
            onClick={() => (isPodcastMode ? handleStartPodcast() : handleStartOrToggleSpeech())}
            type="button"
            className={`flex items-center justify-center gap-1.5 ${orientation === 'vertical' ? 'p-1.5 w-8 h-8' : 'px-2.5 py-1'} rounded-lg text-[12px] font-bold transition-all duration-200 cursor-pointer ${
              isPaused
                ? `${themeClasses.text} bg-black/5 dark:bg-white/10 border border-current/20`
                : `${themeClasses.bg} text-white shadow-sm`
            }`}
          >
            {isPaused ? (
              <Play size={13} className={`fill-current ${themeClasses.text}`} />
            ) : (
              <Pause size={13} className="fill-current text-white" />
            )}
            {showTextLabel && <span>{isPaused ? 'استئناف' : isPodcastMode ? 'البودكاست' : 'مؤقت'}</span>}
          </button>

          {/* Voice Personality Selector */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowVoiceMenu(!showVoiceMenu)
              setShowSpeedMenu(false)
            }}
            type="button"
            title="تغيير شخصية المعلم الصوتي"
            className={`flex items-center justify-center gap-1 ${orientation === 'vertical' ? 'p-1.5 w-8 h-8' : 'px-2 py-1'} rounded-lg text-[12px] font-bold transition-all duration-200 cursor-pointer ${
              dark
                ? 'text-white/80 hover:bg-white/10 border border-white/10'
                : 'text-slate-800 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {orientation === 'vertical' ? <UserCheck size={14} className={themeClasses.text} /> : <span>{selectedVoiceObj.name}</span>}
          </button>

          {/* Mute Button */}
          <button
            onClick={handleToggleMute}
            type="button"
            title={isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
            className={`flex items-center justify-center p-1.5 ${orientation === 'vertical' ? 'w-8 h-8' : ''} rounded-lg text-[12px] font-bold transition-all duration-200 cursor-pointer ${
              isMuted
                ? `${themeClasses.text} bg-black/5 dark:bg-white/10`
                : dark
                ? 'text-white/70 hover:bg-white/10'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>

          {/* Speed Selector Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowSpeedMenu(!showSpeedMenu)
              setShowVoiceMenu(false)
            }}
            type="button"
            title="تغيير سرعة القراءة"
            className={`flex ${orientation === 'vertical' ? 'flex-col justify-center' : 'items-center'} gap-0.5 ${orientation === 'vertical' ? 'p-1.5 w-8 h-8' : 'px-2 py-1'} rounded-lg text-[12px] font-extrabold transition-all duration-200 cursor-pointer ${
              dark
                ? 'text-white/80 hover:bg-white/10 border border-white/10'
                : 'text-slate-800 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {orientation !== 'vertical' && <Gauge size={12} className={themeClasses.text} />}
            <span className={orientation === 'vertical' ? 'text-[9px] leading-none' : ''}>{currentSpeed}x</span>
          </button>

          {/* Download Audio Button with Confirmation Prompt */}
          <button
            onClick={triggerDownloadConfirmation}
            type="button"
            title="تحميل المقطع الصوتي كـ WAV"
            className={`flex items-center justify-center p-1.5 ${orientation === 'vertical' ? 'w-8 h-8' : ''} rounded-lg text-[12px] font-bold transition-all duration-200 cursor-pointer ${
              isDownloaded
                ? `${themeClasses.text} bg-black/5 dark:bg-white/10`
                : dark
                ? 'text-white/70 hover:bg-white/10'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            {isDownloading ? (
              <Loader2 size={13} className={`animate-spin ${themeClasses.text}`} />
            ) : isDownloaded ? (
              <Check size={13} className={themeClasses.text} />
            ) : (
              <Download size={13} />
            )}
          </button>

          {/* Full Stop / Reset Button */}
          <button
            onClick={handleFullStopSpeech}
            type="button"
            title="إنهاء القراءة"
            className={`flex items-center justify-center p-1.5 ${orientation === 'vertical' ? 'w-8 h-8' : ''} rounded-lg text-[12px] font-bold transition-all duration-200 cursor-pointer ${
              dark
                ? 'text-rose-400 hover:bg-rose-500/20'
                : 'text-rose-700 hover:bg-rose-100'
            }`}
          >
            <Square size={12} className="fill-current" />
          </button>
        </div>
      ) : (
        /* Idle State: Clean Action Buttons (Full Read + Podcast Only) */
        <div className={`flex ${orientation === 'vertical' ? 'flex-col' : 'items-center'} gap-1.5`}>
          {/* Main Full Read Button */}
          <button
            onClick={() => handleStartOrToggleSpeech()}
            type="button"
            disabled={isLoading}
            title={label || "قراءة النص كاملاً"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[13px] font-bold transition-all duration-300 hover:scale-105 cursor-pointer ${
              dark
                ? `${themeClasses.text} bg-black/10 hover:bg-black/20 border border-current/20 shadow-sm`
                : `${themeClasses.text} bg-slate-50 hover:bg-slate-100 border border-current/20 shadow-sm`
            } ${isLoading ? 'opacity-70 cursor-wait' : 'cursor-pointer'} ${className}`}
          >
            {isLoading ? (
              <Loader2 size={14} className={`animate-spin ${themeClasses.text}`} />
            ) : (
              <Volume2 size={14} strokeWidth={2.5} />
            )}

            {showTextLabel && (
              <span>{isLoading ? 'تجهيز الصوت...' : (label || 'قراءة النص')}</span>
            )}
          </button>

          {/* Podcast 60s Summary Button */}
          {!hidePodcast && (
            <button
              onClick={handleStartPodcast}
              type="button"
              title="بودكاست سريع (ملخص 60 ثانية)"
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-[10px] text-[12px] font-bold transition-all duration-300 hover:scale-105 cursor-pointer ${
                dark
                  ? `${themeClasses.text} bg-black/10 hover:bg-black/20 border border-current/20`
                  : `${themeClasses.text} bg-slate-50 hover:bg-slate-100 border border-current/20`
              }`}
            >
              <Radio size={13} className={`${themeClasses.text} animate-pulse`} />
              <span>بودكاست سريع</span>
            </button>
          )}
        </div>
      )}

      {/* Speed Selector Dropdown Menu */}
      {showSpeedMenu && (
        <div
          className={`absolute bottom-full mb-2 z-50 p-1.5 rounded-xl shadow-2xl border flex gap-1 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 ${
            variant === 'deck'
              ? 'right-2 sm:right-auto sm:left-1/2 sm:-translate-x-1/2'
              : menuPlacement === 'top'
              ? 'bottom-full mb-1.5 left-0'
              : menuPlacement === 'left'
              ? 'top-0 right-full mr-1.5'
              : 'top-0 left-full ml-1.5'
          } ${
            dark
              ? 'bg-[#0f1422]/98 border-white/10 text-white shadow-black/80'
              : 'bg-white/98 border-slate-200 text-slate-800 shadow-xl'
          }`}
        >
          {SPEED_OPTIONS.map((speed) => (
            <button
              key={speed}
              onClick={(e) => handleSelectSpeed(speed, e)}
              type="button"
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                currentSpeed === speed
                  ? `${themeClasses.bg} text-white shadow-xs`
                  : dark
                  ? 'hover:bg-white/5 text-slate-300 hover:text-white'
                  : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      )}

      {/* Voice Selector Popover Menu */}
      {showVoiceMenu && (
        <div
          className={`absolute bottom-full mb-2 z-50 w-72 max-w-[92vw] p-2.5 rounded-2xl shadow-2xl border flex flex-col gap-1 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 ${
            variant === 'deck'
              ? 'right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2'
              : menuPlacement === 'top'
              ? 'bottom-full mb-1.5 left-0'
              : menuPlacement === 'left'
              ? 'top-0 right-full mr-1.5'
              : 'top-0 left-full ml-1.5'
          } ${
            dark
              ? 'bg-[#0f1422]/98 border-white/10 text-white shadow-black/80'
              : 'bg-white/98 border-slate-200 text-slate-800 shadow-xl'
          }`}
        >
          <div className={`px-2.5 py-1 text-[11px] font-bold mb-1 flex items-center justify-between border-b border-black/5 dark:border-white/10 ${themeClasses.text}`}>
            <span>اختر شخصية المعلم الصوتي:</span>
            <UserCheck size={13} />
          </div>
          {AVAILABLE_VOICES.map((v) => {
            const isSelected = currentVoice === v.id
            return (
              <button
                key={v.id}
                onClick={(e) => handleSelectVoice(v.id, e)}
                type="button"
                className={`flex items-center justify-between gap-2.5 p-2 rounded-xl text-right transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? dark
                      ? `${themeClasses.badgeDark} shadow-xs`
                      : `${themeClasses.badgeLight} font-bold shadow-xs`
                    : dark
                    ? 'hover:bg-white/5 text-slate-300 hover:text-white'
                    : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900'
                }`}
              >
                <div className="flex flex-col text-right">
                  <span className="text-[12px] font-bold leading-tight">{v.name}</span>
                  <span className={`text-[10px] font-medium leading-tight mt-0.5 ${
                    isSelected
                      ? dark
                        ? `${themeClasses.descDark} font-semibold`
                        : `${themeClasses.descLight} font-semibold`
                      : dark
                      ? 'text-slate-400'
                      : 'text-slate-500'
                  }`}>
                    {v.description}
                  </span>
                </div>
                {isSelected && <Check size={14} className={`${themeClasses.text} shrink-0`} />}
              </button>
            )
          })}
        </div>
      )}

      {/* Download Confirmation Modal anchored globally to document.body */}
      {showConfirmModal &&
        createPortal(
          <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div
              className={`w-full max-w-sm rounded-3xl border p-6 shadow-2xl backdrop-blur-xl transform transition-all duration-300 scale-100 text-center ${
                dark ? 'bg-[#18082c]/95 border-purple-500/40 text-white' : 'bg-white border-purple-200 text-slate-900'
              }`}
            >
              <div
                className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border ${
                  usePurple
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}
              >
                <Download size={28} />
              </div>

              <h3 className="mb-2 font-display text-lg font-bold">تأكيد تحميل المقطع الصوتي</h3>

              <p className="mb-6 text-sm leading-relaxed opacity-90">
                هل أنت تأكد من رغبتك في تحميل هذا المقطع الصوتي بصوت <span className={`font-bold ${usePurple ? 'text-purple-400' : 'text-emerald-400'}`}>"{selectedVoiceObj.name}"</span>؟
                <br />
                <span className="text-xs opacity-75 mt-1 block">(سيتم التنزيل كملف WAV نقي عالي الجودة على جهازك)</span>
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  type="button"
                  className={`flex-1 rounded-xl border py-2.5 text-xs font-bold transition-all ${
                    dark
                      ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                      : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  إلغاء
                </button>
                <button
                  onClick={executeConfirmedDownload}
                  type="button"
                  className={`flex-1 rounded-xl py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:scale-[1.02] ${
                    usePurple
                      ? 'bg-purple-600 shadow-purple-600/25 hover:bg-purple-700'
                      : 'bg-emerald-500 shadow-emerald-500/25 hover:bg-emerald-600'
                  }`}
                >
                  نعم، تحميل الآن
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}

export default AudioReaderButton
