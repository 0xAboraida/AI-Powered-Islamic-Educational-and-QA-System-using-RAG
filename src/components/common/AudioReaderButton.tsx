import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Volume2, VolumeX, Pause, Play, Square, Loader2, Gauge, UserCheck, Download, Radio, Check } from 'lucide-react'
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
  dark?: boolean
  className?: string
  showTextLabel?: boolean
  hidePodcast?: boolean
  onStateChange?: (isPlaying: boolean) => void
  colorTheme?: 'emerald' | 'purple'
  orientation?: 'horizontal' | 'vertical'
  menuPlacement?: 'top' | 'left' | 'right'
}

const SPEED_OPTIONS = [1.0, 1.25, 1.5, 2.0, 0.8]

export function AudioReaderButton({
  text,
  dark = true,
  className = '',
  showTextLabel = true,
  hidePodcast = false,
  onStateChange,
  colorTheme = 'emerald',
  orientation = 'horizontal',
  menuPlacement = 'top',
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

  return (
    <div ref={menuRef} className="relative inline-flex items-center gap-2 select-none">
      {isPlaying || isPaused || isLoading ? (
        /* Full Interactive Audio Controls Bar (Dynamically Styled for Podcast Mode vs Standard Speech) */
        <div
          className={`flex ${orientation === 'vertical' ? 'flex-col items-center' : 'items-center'} gap-1.5 p-1 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 ${
            usePurple
              ? dark
                ? 'bg-slate-900/90 border-purple-500/40 text-purple-100 shadow-purple-950/30'
                : 'bg-white/95 border-purple-300 text-purple-900 shadow-md'
              : dark
              ? 'bg-slate-900/90 border-emerald-500/30 text-emerald-100 shadow-emerald-950/20'
              : 'bg-white/95 border-emerald-300 text-emerald-900 shadow-md'
          }`}
        >
          {/* Main Play / Pause Button */}
          <button
            onClick={() => (isPodcastMode ? handleStartPodcast() : handleStartOrToggleSpeech())}
            type="button"
            className={`flex items-center justify-center gap-1.5 ${orientation === 'vertical' ? 'p-1.5 w-8 h-8' : 'px-2.5 py-1'} rounded-lg text-[12px] font-bold transition-all duration-200 ${
              isPaused
                ? 'text-amber-400 bg-amber-500/20 border border-amber-500/30'
                : usePurple
                ? 'text-purple-300 bg-purple-500/20 border border-purple-500/30 shadow-sm'
                : 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 shadow-sm'
            }`}
          >
            {isPaused ? (
              <Play size={13} className="fill-current text-amber-400" />
            ) : (
              <Pause size={13} className={`fill-current ${usePurple ? 'text-purple-400' : 'text-emerald-400'}`} />
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
            className={`flex items-center justify-center gap-1 ${orientation === 'vertical' ? 'p-1.5 w-8 h-8' : 'px-2 py-1'} rounded-lg text-[12px] font-bold transition-all duration-200 ${
              usePurple
                ? dark
                  ? 'text-purple-300 hover:bg-purple-500/20 border border-purple-500/20'
                  : 'text-purple-800 hover:bg-purple-100 border border-purple-200'
                : dark
                ? 'text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/20'
                : 'text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            {orientation === 'vertical' ? <UserCheck size={14} /> : <span>{selectedVoiceObj.name}</span>}
          </button>

          {/* Mute Button */}
          <button
            onClick={handleToggleMute}
            type="button"
            title={isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
            className={`flex items-center justify-center p-1.5 ${orientation === 'vertical' ? 'w-8 h-8' : ''} rounded-lg text-[12px] font-bold transition-all duration-200 ${
              isMuted
                ? 'text-amber-400 bg-amber-500/20'
                : usePurple
                ? dark
                  ? 'text-purple-400 hover:bg-purple-500/20'
                  : 'text-purple-700 hover:bg-purple-100'
                : dark
                ? 'text-emerald-400 hover:bg-emerald-500/20'
                : 'text-emerald-700 hover:bg-emerald-100'
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
            className={`flex ${orientation === 'vertical' ? 'flex-col justify-center' : 'items-center'} gap-0.5 ${orientation === 'vertical' ? 'p-1.5 w-8 h-8' : 'px-2 py-1'} rounded-lg text-[12px] font-extrabold transition-all duration-200 ${
              usePurple
                ? dark
                  ? 'text-purple-300 hover:bg-purple-500/20 border border-purple-500/20'
                  : 'text-purple-800 hover:bg-purple-100 border border-purple-200'
                : dark
                ? 'text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/20'
                : 'text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            {orientation !== 'vertical' && <Gauge size={12} className={usePurple ? 'text-purple-400' : 'text-emerald-400'} />}
            <span className={orientation === 'vertical' ? 'text-[9px] leading-none' : ''}>{currentSpeed}x</span>
          </button>

          {/* Download Audio Button with Confirmation Prompt */}
          <button
            onClick={triggerDownloadConfirmation}
            type="button"
            title="تحميل المقطع الصوتي كـ WAV"
            className={`flex items-center justify-center p-1.5 ${orientation === 'vertical' ? 'w-8 h-8' : ''} rounded-lg text-[12px] font-bold transition-all duration-200 ${
              isDownloaded
                ? usePurple
                  ? 'text-purple-400 bg-purple-500/20'
                  : 'text-emerald-400 bg-emerald-500/20'
                : usePurple
                ? dark
                  ? 'text-purple-400 hover:bg-purple-500/20'
                  : 'text-purple-700 hover:bg-purple-100'
                : dark
                ? 'text-emerald-400 hover:bg-emerald-500/20'
                : 'text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            {isDownloading ? (
              <Loader2 size={13} className={`animate-spin ${usePurple ? 'text-purple-400' : 'text-emerald-400'}`} />
            ) : isDownloaded ? (
              <Check size={13} className={usePurple ? 'text-purple-400' : 'text-emerald-400'} />
            ) : (
              <Download size={13} />
            )}
          </button>

          {/* Full Stop / Reset Button */}
          <button
            onClick={handleFullStopSpeech}
            type="button"
            title="إنهاء القراءة"
            className={`flex items-center justify-center p-1.5 ${orientation === 'vertical' ? 'w-8 h-8' : ''} rounded-lg text-[12px] font-bold transition-all duration-200 ${
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
            title="قراءة الإجابة كاملاً"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[13px] font-bold transition-all duration-300 hover:scale-105 ${
              dark
                ? 'text-emerald-400 hover:text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 shadow-sm'
                : 'text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 shadow-sm'
            } ${isLoading ? 'opacity-70 cursor-wait' : 'cursor-pointer'} ${className}`}
          >
            {isLoading ? (
              <Loader2 size={14} className="animate-spin text-emerald-400" />
            ) : (
              <Volume2 size={14} strokeWidth={2.5} />
            )}

            {showTextLabel && (
              <span>{isLoading ? 'تجهيز الصوت...' : 'قراءة الإجابة'}</span>
            )}
          </button>

          {/* Podcast 60s Summary Button */}
          {!hidePodcast && (
            <button
              onClick={handleStartPodcast}
              type="button"
              title="بودكاست سريع (ملخص 60 ثانية)"
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-[10px] text-[12px] font-bold transition-all duration-300 hover:scale-105 ${
                dark
                  ? 'text-emerald-300 hover:text-emerald-100 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20'
                  : 'text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <Radio size={13} className="text-emerald-400 animate-pulse" />
              <span>بودكاست سريع</span>
            </button>
          )}
        </div>
      )}

      {/* Speed Selector Dropdown Menu */}
      {showSpeedMenu && (
        <div
          className={`absolute ${menuPlacement === 'top' ? 'bottom-full mb-1.5 left-0' : menuPlacement === 'left' ? 'top-0 right-full mr-1.5' : 'top-0 left-full ml-1.5'} z-50 p-1.5 rounded-xl shadow-xl border flex gap-1 animate-in fade-in zoom-in-95 duration-150 ${
            usePurple
              ? dark
                ? 'bg-slate-900/95 border-purple-500/40 text-slate-200 backdrop-blur-md'
                : 'bg-white border-purple-200 text-slate-800'
              : dark
              ? 'bg-slate-900/95 border-emerald-500/30 text-slate-200 backdrop-blur-md'
              : 'bg-white border-emerald-200 text-slate-800 shadow-emerald-950/10'
          }`}
        >
          {SPEED_OPTIONS.map((speed) => (
            <button
              key={speed}
              onClick={(e) => handleSelectSpeed(speed, e)}
              type="button"
              className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
                currentSpeed === speed
                  ? usePurple
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-emerald-500 text-white shadow-sm'
                  : dark
                  ? 'hover:bg-slate-800 text-slate-300'
                  : usePurple
                  ? 'hover:bg-purple-50 text-purple-900'
                  : 'hover:bg-emerald-50 text-emerald-900'
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
          className={`absolute ${menuPlacement === 'top' ? 'bottom-full mb-1.5 left-0' : menuPlacement === 'left' ? 'top-0 right-full mr-1.5' : 'top-0 left-full ml-1.5'} z-50 w-64 p-2 rounded-2xl shadow-2xl border flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150 ${
            usePurple
              ? dark
                ? 'bg-slate-900/95 border-purple-500/40 text-slate-100 backdrop-blur-md'
                : 'bg-white border-purple-200 text-slate-800'
              : dark
              ? 'bg-slate-900/95 border-emerald-500/30 text-slate-100 backdrop-blur-md'
              : 'bg-white border-emerald-200 text-slate-800 shadow-emerald-950/10'
          }`}
        >
          <div
            className={`px-2.5 py-1 text-[11px] font-bold mb-1 flex items-center justify-between border-b ${
              usePurple
                ? 'text-purple-400 border-purple-500/20'
                : 'text-emerald-400 border-emerald-500/20'
            }`}
          >
            <span>اختر شخصية المعلم الصوتي:</span>
            <UserCheck size={13} />
          </div>
          {AVAILABLE_VOICES.map((v) => (
            <button
              key={v.id}
              onClick={(e) => handleSelectVoice(v.id, e)}
              type="button"
              className={`flex items-start gap-2.5 p-2 rounded-xl text-right transition-all duration-200 ${
                currentVoice === v.id
                  ? usePurple
                    ? 'bg-purple-500/25 border border-purple-500/40 text-purple-200 shadow-sm'
                    : 'bg-emerald-500/25 border border-emerald-500/40 text-emerald-200 shadow-sm'
                  : dark
                  ? 'hover:bg-slate-800/80 text-slate-300'
                  : usePurple
                  ? 'hover:bg-purple-50 text-slate-700'
                  : 'hover:bg-emerald-50 text-slate-700'
              }`}
            >
              <div className="flex flex-col text-right">
                <span className="text-[12px] font-bold leading-tight">{v.name}</span>
                <span className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">{v.description}</span>
              </div>
            </button>
          ))}
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
