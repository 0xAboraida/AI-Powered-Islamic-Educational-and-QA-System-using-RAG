import React, { useState, useEffect, useRef } from 'react'
import { Timer, Play, Pause, RotateCcw, Coffee, Sparkles, Bell, BellOff, ChevronDown, Plus, Minus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../../contexts/ThemeContext'

interface StudyTimerWidgetProps {
  isDark?: boolean
  isFullWidth?: boolean
  initialOpen?: boolean
  hideTriggerHeader?: boolean
  onRequestExpand?: () => void
}

export function StudyTimerWidget({
  isDark = true,
  isFullWidth = false,
  initialOpen = false,
  hideTriggerHeader = false,
  onRequestExpand
}: StudyTimerWidgetProps) {
  const { accentColor } = useTheme()
  const [mode, setMode] = useState<'stopwatch' | 'pomodoro'>('stopwatch')
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [hasStarted, setHasStarted] = useState<boolean>(false)
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0)
  
  // Custom Pomodoro config (minutes)
  const [pomoWorkDuration, setPomoWorkDuration] = useState<number>(25)
  const [pomoBreakDuration, setPomoBreakDuration] = useState<number>(5)
  const [isBreakPhase, setIsBreakPhase] = useState<boolean>(false)
  const [pomoSecondsLeft, setPomoSecondsLeft] = useState<number>(25 * 60)
  
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true)
  const [isOpen, setIsOpen] = useState<boolean>(initialOpen)
  const popoverRef = useRef<HTMLDivElement>(null)
  const prevIsFullWidthRef = useRef(isFullWidth)

  // When sidebar collapses, automatically close the timer menu so it doesn't float or remain open
  useEffect(() => {
    if (prevIsFullWidthRef.current && !isFullWidth) {
      setIsOpen(false)
    }
    prevIsFullWidthRef.current = isFullWidth
  }, [isFullWidth])

  // Handler to expand sidebar and open the timer menu when clicked in collapsed mode
  const handleOpenFromCollapsed = () => {
    if (onRequestExpand) {
      onRequestExpand()
    }
    setIsOpen(true)
    setTimeout(() => {
      popoverRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 150)
  }

  // Close popover when clicking outside (only in collapsed sidebar mode if floating)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!isFullWidth && popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen && !isFullWidth) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, isFullWidth])

  // Timer Tick Effect
  useEffect(() => {
    let interval: any = null
    if (isRunning) {
      interval = setInterval(() => {
        if (mode === 'stopwatch') {
          setStopwatchSeconds((prev) => prev + 1)
        } else {
          setPomoSecondsLeft((prev) => {
            if (prev <= 1) {
              // Sound alert
              if (isSoundEnabled) {
                try {
                  const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
                  audio.volume = 0.5
                  audio.play().catch(() => {})
                } catch (e) {}
              }
              // Switch phase
              if (!isBreakPhase) {
                setIsBreakPhase(true)
                return pomoBreakDuration * 60
              } else {
                setIsBreakPhase(false)
                return pomoWorkDuration * 60
              }
            }
            return prev - 1
          })
        }
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, mode, isBreakPhase, pomoWorkDuration, pomoBreakDuration, isSoundEnabled])

  // Reset function (only way to return to icon state)
  const handleReset = () => {
    setIsRunning(false)
    setHasStarted(false)
    if (mode === 'stopwatch') {
      setStopwatchSeconds(0)
    } else {
      setIsBreakPhase(false)
      setPomoSecondsLeft(pomoWorkDuration * 60)
    }
  }

  // Toggle Running
  const togglePlayPause = () => {
    if (!isRunning) {
      setIsRunning(true)
      setHasStarted(true)
    } else {
      setIsRunning(false)
    }
  }

  // Format Helper
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600)
    const mins = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const displayTimeStr = mode === 'stopwatch' 
    ? formatTime(stopwatchSeconds) 
    : formatTime(pomoSecondsLeft)

  const getTimerBtnClass = () => {
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
          return 'bg-[#a855f7]/15 backdrop-blur-md border border-[#a855f7]/30 hover:bg-[#a855f7]/25 text-purple-100'
      }
    }
    switch (accentColor) {
      case 'emerald':
        return 'bg-white border border-teal-200 hover:bg-teal-50 text-teal-700 shadow-md'
      case 'amber':
        return 'bg-white border border-[#dfbf83]/60 hover:bg-[#fbf8f0] text-[#78350f] shadow-md'
      case 'blue':
        return 'bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 shadow-md'
      case 'purple':
      default:
        return 'bg-white border border-purple-200 hover:bg-purple-50 text-purple-700 shadow-md'
    }
  }

  const getTimerIconClass = () => {
    if (isDark) {
      switch (accentColor) {
        case 'emerald': return 'text-teal-200'
        case 'amber': return 'text-[#dfbf83]'
        case 'blue': return 'text-blue-200'
        default: return 'text-purple-100'
      }
    }
    switch (accentColor) {
      case 'emerald': return 'text-teal-700'
      case 'amber': return 'text-[#8a652a]'
      case 'blue': return 'text-blue-700'
      default: return 'text-purple-700'
    }
  }

  const getActiveBadgeClass = () => {
    if (isDark) {
      switch (accentColor) {
        case 'emerald':
          return 'bg-teal-950/80 border-teal-500/40 text-teal-100 backdrop-blur-xl shadow-teal-950/40'
        case 'amber':
          return 'bg-[#1e1509]/80 border-[#dfbf83]/40 text-[#f5ebd7] backdrop-blur-xl shadow-amber-950/40'
        case 'blue':
          return 'bg-blue-950/80 border-blue-500/40 text-blue-100 backdrop-blur-xl shadow-blue-950/40'
        case 'purple':
        default:
          return 'bg-[#1e0a38]/90 border-[#a855f7]/40 text-purple-100 backdrop-blur-xl shadow-purple-950/40'
      }
    }
    switch (accentColor) {
      case 'emerald':
        return 'bg-white border-teal-300 text-teal-950 shadow-md'
      case 'amber':
        return 'bg-white border-[#dfbf83] text-[#5e431a] shadow-md'
      case 'blue':
        return 'bg-white border-blue-300 text-blue-950 shadow-md'
      case 'purple':
      default:
        return 'bg-white border-purple-300 text-purple-950 shadow-md'
    }
  }

  const getPrimaryAccentClass = () => {
    switch (accentColor) {
      case 'emerald': return 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-600/30'
      case 'amber': return 'bg-[#b88d46] hover:bg-[#a67c3b] text-white shadow-amber-600/30'
      case 'blue': return 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
      case 'purple':
      default: return 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
    }
  }

  const getAccentTextClass = () => {
    switch (accentColor) {
      case 'emerald': return isDark ? 'text-teal-300' : 'text-teal-700'
      case 'amber': return isDark ? 'text-[#dfbf83]' : 'text-[#8a652a]'
      case 'blue': return isDark ? 'text-blue-300' : 'text-blue-700'
      case 'purple':
      default: return isDark ? 'text-purple-300' : 'text-purple-700'
    }
  }

  const getModeTabClass = (isSelected: boolean) => {
    if (!isSelected) {
      return isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
    }
    switch (accentColor) {
      case 'emerald': return 'bg-teal-600 text-white font-extrabold shadow-sm'
      case 'amber': return 'bg-[#b88d46] text-white font-extrabold shadow-sm'
      case 'blue': return 'bg-blue-600 text-white font-extrabold shadow-sm'
      case 'purple':
      default: return 'bg-purple-600 text-white font-extrabold shadow-sm'
    }
  }

  const renderControlsContent = () => (
    <>
      {/* Title & Sound toggle */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60 dark:border-white/10">
        <div className={`flex items-center gap-1.5 font-bold font-sans text-xs ${getAccentTextClass()}`}>
          <Sparkles size={14} />
          <span>مؤقت الدراسة والتركيز</span>
        </div>
        <button
          type="button"
          onClick={() => setIsSoundEnabled(!isSoundEnabled)}
          className={`p-1 rounded-md transition-colors cursor-pointer ${
            isSoundEnabled
              ? isDark ? 'text-primary bg-primary/15 hover:bg-primary/25' : 'text-primary bg-primary/10 hover:bg-primary/20'
              : isDark ? 'text-slate-400 bg-white/5 hover:bg-white/10' : 'text-slate-500 bg-slate-100 hover:bg-slate-200'
          }`}
          title={isSoundEnabled ? 'التنبيه الصوتي مفعل' : 'التنبيه الصوتي مكتوم'}
        >
          {isSoundEnabled ? <Bell size={13} /> : <BellOff size={13} />}
        </button>
      </div>

      {/* Mode Segmented Selector */}
      <div className={`grid grid-cols-2 p-0.5 rounded-lg border ${
        isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
      }`}>
        <button
          type="button"
          onClick={() => {
            setMode('stopwatch')
            handleReset()
          }}
          className={`py-1 px-2 rounded-md text-xs font-sans font-medium transition-all cursor-pointer ${getModeTabClass(mode === 'stopwatch')}`}
        >
          عداد الجلسة
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('pomodoro')
            handleReset()
          }}
          className={`py-1 px-2 rounded-md text-xs font-sans font-medium transition-all cursor-pointer ${getModeTabClass(mode === 'pomodoro')}`}
        >
          فترات التركيز
        </button>
      </div>

      {/* Big Digital Display */}
      <div className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg border ${
        isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50/80 border-slate-200'
      }`}>
        {mode === 'pomodoro' && (
          <span className={`text-[10px] font-bold font-sans mb-1 px-2 py-0.5 rounded-full ${
            isBreakPhase
              ? isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-amber-100 text-amber-800 border border-amber-300'
              : isDark ? 'bg-primary/20 text-primary-foreground border border-primary/30' : 'bg-primary/10 text-primary border border-primary/20'
          }`}>
            {isBreakPhase ? '☕ فترة استراحة' : '🎯 فترة تركيز ونشاط'}
          </span>
        )}
        <div className={`font-mono text-2xl font-black tracking-widest dir-ltr ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}>
          {displayTimeStr}
        </div>
      </div>

      {/* CUSTOM POMODORO TIME INPUTS */}
      {mode === 'pomodoro' && (
        <div className="grid grid-cols-2 gap-1.5">
          {/* Work Duration Custom Input */}
          <div className={`flex flex-col gap-0.5 p-1.5 rounded-lg border ${
            isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50/80 border-slate-200'
          }`}>
            <span className="text-[10px] font-bold font-sans text-slate-500 dark:text-white/60">التركيز (د)</span>
            <div className="flex items-center justify-between gap-1 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  const val = Math.max(1, pomoWorkDuration - 5)
                  setPomoWorkDuration(val)
                  if (!isBreakPhase) setPomoSecondsLeft(val * 60)
                  handleReset()
                }}
                className={`w-6 h-6 rounded font-extrabold flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                  isDark ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300'
                }`}
              >
                <Minus size={11} />
              </button>
              <input
                type="number"
                min={1}
                max={180}
                value={pomoWorkDuration}
                onChange={(e) => {
                  const val = Math.max(1, parseInt(e.target.value) || 1)
                  setPomoWorkDuration(val)
                  if (!isBreakPhase) setPomoSecondsLeft(val * 60)
                  handleReset()
                }}
                className={`w-10 text-center bg-transparent font-mono text-xs font-black focus:outline-none border-b ${
                  isDark ? 'text-white border-white/30' : 'text-slate-900 border-slate-300'
                }`}
              />
              <button
                type="button"
                onClick={() => {
                  const val = Math.min(180, pomoWorkDuration + 5)
                  setPomoWorkDuration(val)
                  if (!isBreakPhase) setPomoSecondsLeft(val * 60)
                  handleReset()
                }}
                className={`w-6 h-6 rounded font-extrabold flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                  isDark ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300'
                }`}
              >
                <Plus size={11} />
              </button>
            </div>
          </div>

          {/* Break Duration Custom Input */}
          <div className={`flex flex-col gap-0.5 p-1.5 rounded-lg border ${
            isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50/80 border-slate-200'
          }`}>
            <span className="text-[10px] font-bold font-sans text-slate-500 dark:text-white/60">الاستراحة (د)</span>
            <div className="flex items-center justify-between gap-1 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  const val = Math.max(1, pomoBreakDuration - 1)
                  setPomoBreakDuration(val)
                  if (isBreakPhase) setPomoSecondsLeft(val * 60)
                  handleReset()
                }}
                className={`w-6 h-6 rounded font-extrabold flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                  isDark ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300'
                }`}
              >
                <Minus size={11} />
              </button>
              <input
                type="number"
                min={1}
                max={60}
                value={pomoBreakDuration}
                onChange={(e) => {
                  const val = Math.max(1, parseInt(e.target.value) || 1)
                  setPomoBreakDuration(val)
                  if (isBreakPhase) setPomoSecondsLeft(val * 60)
                  handleReset()
                }}
                className={`w-10 text-center bg-transparent font-mono text-xs font-black focus:outline-none border-b ${
                  isDark ? 'text-white border-white/30' : 'text-slate-900 border-slate-300'
                }`}
              />
              <button
                type="button"
                onClick={() => {
                  const val = Math.min(60, pomoBreakDuration + 1)
                  setPomoBreakDuration(val)
                  if (isBreakPhase) setPomoSecondsLeft(val * 60)
                  handleReset()
                }}
                className={`w-6 h-6 rounded font-extrabold flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                  isDark ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300'
                }`}
              >
                <Plus size={11} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons: Play/Pause/Reset */}
      <div className="flex items-center gap-1.5 pt-0.5">
        <button
          type="button"
          onClick={togglePlayPause}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
              : getPrimaryAccentClass()
          }`}
        >
          {isRunning ? (
            <>
              <Pause size={14} fill="currentColor" />
              <span>إيقاف مؤقت</span>
            </>
          ) : (
            <>
              <Play size={14} fill="currentColor" />
              <span>{hasStarted ? 'استئناف' : 'بدء التركيز'}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleReset}
          className={`p-1.5 rounded-lg border transition-all active:scale-95 cursor-pointer ${
            isDark ? 'border-white/10 hover:bg-white/10 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
          }`}
          title="إعادة ضبط العداد"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </>
  )

  return (
    <div className={`relative ${isFullWidth ? 'w-full' : ''}`} ref={popoverRef} dir="rtl">
      {/* 1. TRIGGER HEADER (HIDDEN WHEN STANDALONE) */}
      {!hideTriggerHeader && (
        isFullWidth ? (
          !hasStarted ? (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={`w-full flex items-center justify-between rounded-lg border border-transparent transition-all duration-150 cursor-pointer px-3 py-1.5 text-sm font-medium font-sans ${
                isOpen
                  ? 'bg-slate-100/80 dark:bg-white/10 text-slate-900 dark:text-white'
                  : 'hover:bg-slate-100/70 dark:hover:bg-white/5 text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="مؤقت الدراسة والتركيز"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Timer size={19} className="shrink-0 text-slate-500 dark:text-white/50" />
                <span className="truncate">مؤقت المدارسة</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>
          ) : (
            <div
              className={`w-full flex items-center justify-between rounded-lg border px-3 py-1.5 transition-all ${
                isDark
                  ? 'bg-white/[0.04] border-white/10 text-white'
                  : 'bg-slate-50/90 border-slate-200 text-slate-800'
              }`}
            >
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                title="خيارات المؤقت"
              >
                {mode === 'pomodoro' && isBreakPhase ? (
                  <Coffee size={18} className="text-amber-500 shrink-0" />
                ) : (
                  <Timer size={18} className={`shrink-0 ${isRunning ? 'text-primary animate-pulse' : 'text-slate-500'}`} />
                )}
                <span className="font-mono text-sm font-bold tracking-wider dir-ltr">
                  {displayTimeStr}
                </span>
                <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={togglePlayPause}
                  className={`h-7 w-7 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                    isRunning
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                  }`}
                  title={isRunning ? 'إيقاف مؤقت' : 'استئناف'}
                >
                  {isRunning ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" className="ml-0.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="h-7 w-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer"
                  title="إعادة ضبط"
                >
                  <RotateCcw size={13} />
                </button>
              </div>
            </div>
          )
        ) : (
          /* 2. WHEN isFullWidth IS FALSE (COLLAPSED SIDEBAR) */
          !hasStarted ? (
            <button
              type="button"
              onClick={handleOpenFromCollapsed}
              aria-label="مؤقت الدراسة والتركيز"
              className="w-full flex items-center justify-center h-10 w-10 mx-auto rounded-lg border border-transparent hover:bg-slate-100/70 dark:hover:bg-white/5 text-slate-700 dark:text-white/70 transition-all cursor-pointer"
              title="مؤقت الدراسة والتركيز"
            >
              <Timer size={20} className="text-slate-500 dark:text-white/50" />
            </button>
          ) : (
            /* Vertical compact layout: Counter on top + Play/Pause button underneath */
            <div className={`w-12 mx-auto flex flex-col items-center justify-center gap-1.5 py-1.5 px-1 rounded-xl border transition-all duration-200 select-none ${
              isDark
                ? 'bg-white/[0.04] border-white/10 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
            }`}>
              {/* Digital Time Counter */}
              <button
                type="button"
                onClick={handleOpenFromCollapsed}
                className="w-full flex items-center justify-center font-mono text-[11px] font-bold tracking-tight dir-ltr hover:opacity-80 transition-opacity cursor-pointer"
                title="خيارات المؤقت"
              >
                {displayTimeStr}
              </button>

              {/* Quick Play/Pause Button */}
              <button
                type="button"
                onClick={togglePlayPause}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer active:scale-90 ${
                  isRunning 
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25' 
                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                }`}
                title={isRunning ? 'إيقاف مؤقت' : 'استئناف'}
              >
                {isRunning ? (
                  <Pause size={12} fill="currentColor" />
                ) : (
                  <Play size={12} fill="currentColor" className="ml-0.5" />
                )}
              </button>
            </div>
          )
        )
      )}

      {/* 3. INLINE DOWNWARD EXPANSION WHEN SIDEBAR IS EXPANDED OR STANDALONE */}
      {(isFullWidth || hideTriggerHeader) && (
        <AnimatePresence>
          {(isOpen || hideTriggerHeader) && (
            <motion.div
              initial={hideTriggerHeader ? false : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="overflow-hidden w-full"
            >
              <div className={`p-2.5 rounded-lg border flex flex-col gap-2.5 ${hideTriggerHeader ? '' : 'mt-2'} ${
                isDark
                  ? 'bg-white/[0.03] border-white/10 text-white'
                  : 'bg-slate-50/80 border-slate-200/80 text-slate-900'
              }`}>
                {renderControlsContent()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* 4. FLOATING POPOVER ONLY WHEN SIDEBAR IS COLLAPSED (FALLBACK WHEN onRequestExpand IS NOT PROVIDED) */}
      {!isFullWidth && !onRequestExpand && (
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: 8 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: 8 }}
              transition={{ duration: 0.18 }}
              className={`absolute right-full bottom-0 mr-2 w-72 p-3.5 rounded-xl border shadow-2xl backdrop-blur-2xl z-50 flex flex-col gap-3 ${
                isDark 
                  ? 'bg-[#150524]/98 border-white/15 text-white shadow-[0_15px_50px_rgba(0,0,0,0.6)]' 
                  : 'bg-white/98 border-slate-200 text-slate-900 shadow-2xl'
              }`}
            >
              {renderControlsContent()}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
