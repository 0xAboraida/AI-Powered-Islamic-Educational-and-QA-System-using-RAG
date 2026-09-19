/**
 * Gemini Text-to-Speech (TTS) & Web Speech Fallback Service
 * --------------------------------------------------------
 * High-Quality Single-Payload Processing Engine.
 * Supports Voice Personality Selection (زاد, أحمد, عبد الله, خديجة, فاطمة),
 * In-Memory Audio Caching, Background Caching, Audio Download (WAV/MP3),
 * Dedicated Gemini 60-Second Podcast Presenter Prompting, Pause/Resume controls,
 * Pitch Preservation, and Monotonic Session ID concurrency guards.
 */

let activeAudioElement: HTMLAudioElement | null = null
let currentSpeechUtterance: SpeechSynthesisUtterance | null = null

let isPlaybackCancelled = false
let isAudioMuted = false
let currentPlaybackSpeed = 1.0
let currentVoiceName: VoiceName = 'Charon' // Default: "زاد"
let globalSpeechSessionId = 0 // Session ID guard to prevent overlapping audio playback

export type VoiceName = 'Charon' | 'Puck' | 'Orus' | 'Fenrir' | 'Kore' | 'Aoede'

export interface VoiceOption {
  id: VoiceName
  name: string
  description: string
  gender: 'male' | 'female'
}

export const AVAILABLE_VOICES: VoiceOption[] = [
  {
    id: 'Charon',
    name: 'عبد الله',
    description: 'نبرة حماسية وقوية للمراجعات الملخصة والبودكاست',
    gender: 'male',
  },
  {
    id: 'Puck',
    name: 'أحمد',
    description: 'نبرة صافية ومتوازنة للقراءة الفصيحة',
    gender: 'male',
  },
  {
    id: 'Orus',
    name: 'زاد',
    description: 'نبرة عميقة ووقورة للعلوم والتفسير',
    gender: 'male',
  },
  {
    id: 'Kore',
    name: 'خديجة',
    description: 'نبرة نسائية دافئة ومريحة للشرح والمذاكرة',
    gender: 'female',
  },
  {
    id: 'Aoede',
    name: 'فاطمة',
    description: 'نبرة نسائية مشرقة ومعبرة للدروس التفاعلية',
    gender: 'female',
  },
]

interface AudioPayload {
  base64Data: string
  mimeType: string
}

// In-Memory Audio Cache per (mode + voice name + text) string (0ms instant replay)
const audioCacheMap = new Map<string, AudioPayload>()

const DEFAULT_GEMINI_KEYS: string[] = []

const TTS_MODELS = [
  "gemini-2.5-flash-preview-tts",
  "gemini-3.1-flash-tts-preview"
]

export interface TtsOptions {
  onStart?: () => void
  onEnd?: () => void
  onError?: (err: any) => void
  apiKey?: string
  voiceName?: VoiceName
  playbackRate?: number
  isPodcast?: boolean
}

/**
 * Sets current Gemini voice name and saves preference in localStorage.
 */
export function setVoiceName(voice: VoiceName): void {
  currentVoiceName = voice
  console.log(`🎙️ [TTS Engine] Selected Voice Personality: ${voice}`)
  if (typeof window !== 'undefined') {
    localStorage.setItem('zad_tts_voice_name', voice)
  }
}

export function getVoiceName(): VoiceName {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('zad_tts_voice_name') as VoiceName
    if (saved && AVAILABLE_VOICES.some(v => v.id === saved)) {
      currentVoiceName = saved
    }
  }
  return currentVoiceName
}

/**
 * Strips Markdown formatting, tags, links, and special markers
 * to produce clean Arabic text for natural voice synthesis.
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return ''
  let clean = text

  // 1. Strip special Islamic formatting delimiters: &Ayah&, %Hadith%, @Saying@, $Poetry$, ^Ref^
  clean = clean.replace(/&([^&]+)&/g, '$1')
  clean = clean.replace(/%([^%]+)%/g, '$1')
  clean = clean.replace(/@([^@]+)@/g, '$1')
  clean = clean.replace(/\$([^$]+)\$/g, '$1')
  clean = clean.replace(/\^([^\^]+)\^/g, '$1')

  // 2. Remove custom block tags & markers
  clean = clean.replace(/\[(QURAN|HADITH|SAYING|POETRY|REFERENCE)\]/gi, '')
  clean = clean.replace(/__(TITLE|BADGE|REF)__/g, '')

  // 3. Remove Markdown headings (#, ##, ###, ####)
  clean = clean.replace(/^#{1,6}\s+/gm, '')

  // 4. Remove Markdown formatting (*, **, _, __, ~~, ++, `)
  clean = clean.replace(/\*\*(.*?)\*\*/g, '$1')
  clean = clean.replace(/\*(.*?)\*/g, '$1')
  clean = clean.replace(/~~(.*?)~~/g, '$1')
  clean = clean.replace(/\+\+(.*?)\+\+/g, '$1')
  clean = clean.replace(/`{1,3}.*?`{1,3}/gs, '')

  // 5. Remove links [text](url) -> text
  clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

  // 6. Completely strip any residual non-verbal characters
  clean = clean.replace(/[$%@&^#*_~+=<>{}\\/|[\]]/g, ' ')

  // 7. Strip list bullets, numbers, quotes
  clean = clean.replace(/^[ \t]*[-+*][ \t]+/gm, '')
  clean = clean.replace(/^[ \t]*\d+\.[ \t]+/gm, '')
  clean = clean.replace(/«|»/g, '')

  // 8. Normalize spacing and line breaks
  clean = clean.replace(/\s+/g, ' ').trim()

  return clean
}

/**
 * Converts raw PCM 16-bit 24kHz Base64 audio into a valid WAV Blob Object URL
 * with 44-byte RIFF header for pitch-preserved HTML5 audio playback.
 */
function createWavBlobUrl(base64Pcm: string, sampleRate = 24000): string {
  const binaryString = atob(base64Pcm)
  const len = binaryString.length
  const pcmBytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    pcmBytes[i] = binaryString.charCodeAt(i)
  }

  const wavHeader = new ArrayBuffer(44)
  const view = new DataView(wavHeader)

  // "RIFF"
  view.setUint32(0, 0x52494646, false)
  // File length - 8
  view.setUint32(4, 36 + len, true)
  // "WAVE"
  view.setUint32(8, 0x57415645, false)
  // "fmt "
  view.setUint32(12, 0x666d7420, false)
  // Subchunk1Size (16 for PCM)
  view.setUint32(16, 16, true)
  // AudioFormat (1 for PCM)
  view.setUint16(20, 1, true)
  // NumChannels (1 mono)
  view.setUint16(22, 1, true)
  // SampleRate (24000)
  view.setUint32(24, sampleRate, true)
  // ByteRate (sampleRate * numChannels * 2)
  view.setUint32(28, sampleRate * 2, true)
  // BlockAlign (numChannels * 2)
  view.setUint16(32, 2, true)
  // BitsPerSample (16)
  view.setUint16(34, 16, true)
  // "data"
  view.setUint32(36, 0x64617461, false)
  // Subchunk2Size
  view.setUint32(40, len, true)

  const wavBuffer = new Uint8Array(44 + len)
  wavBuffer.set(new Uint8Array(wavHeader), 0)
  wavBuffer.set(pcmBytes, 44)

  const blob = new Blob([wavBuffer], { type: 'audio/wav' })
  return URL.createObjectURL(blob)
}

/**
 * Updates audio playback speed dynamically in real-time with Pitch Preservation.
 */
export function setPlaybackSpeed(rate: number): void {
  currentPlaybackSpeed = Math.min(Math.max(rate, 0.5), 2.5)
  console.log(`⏩ [TTS Engine] Pitch-Preserved Playback speed updated to: ${currentPlaybackSpeed}x`)

  if (activeAudioElement) {
    try {
      (activeAudioElement as any).preservesPitch = true
      activeAudioElement.playbackRate = currentPlaybackSpeed
    } catch (e) {
      console.warn('⚠️ Could not update audio playbackRate in real time:', e)
    }
  }
}

export function getPlaybackSpeed(): number {
  return currentPlaybackSpeed
}

/**
 * Toggles Mute / Unmute state in real time.
 */
export function setMuteState(muted: boolean): void {
  isAudioMuted = muted
  console.log(`🔇 [TTS Engine] Mute state updated: ${muted ? 'MUTED' : 'UNMUTED'}`)
  if (activeAudioElement) {
    activeAudioElement.muted = muted
  }
}

export function toggleMuteState(): boolean {
  setMuteState(!isAudioMuted)
  return isAudioMuted
}

export function getMuteState(): boolean {
  return isAudioMuted
}

/**
 * Pauses currently active audio playback.
 */
export function pauseSpeech(): boolean {
  console.log('⏸️ [TTS Engine] Pausing speech playback...')
  if (activeAudioElement && !activeAudioElement.paused) {
    activeAudioElement.pause()
    return true
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
    window.speechSynthesis.pause()
    return true
  }
  return false
}

/**
 * Resumes paused audio playback from current position.
 */
export function resumeSpeech(): boolean {
  console.log('▶️ [TTS Engine] Resuming speech playback...')
  if (activeAudioElement && activeAudioElement.paused) {
    activeAudioElement.play()
    return true
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.paused) {
    window.speechSynthesis.resume()
    return true
  }
  return false
}

/**
 * Checks if current speech playback is paused.
 */
export function isPausedSpeech(): boolean {
  if (activeAudioElement) {
    return activeAudioElement.paused
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    return window.speechSynthesis.paused
  }
  return false
}

/**
 * Instantly stops any currently playing audio (Gemini Audio or Web Speech) and resets player.
 */
export function stopAllSpeech(): void {
  console.log('⏹️ [TTS Engine] Instantly stopping all speech...')
  isPlaybackCancelled = true
  globalSpeechSessionId++ // Invalidate any in-flight async speech playback

  // Stop HTML5 Audio Element
  if (activeAudioElement) {
    try {
      activeAudioElement.pause()
      activeAudioElement.currentTime = 0
      activeAudioElement.onended = null
      activeAudioElement.onerror = null
      if (activeAudioElement.src) {
        URL.revokeObjectURL(activeAudioElement.src)
      }
    } catch (_) {}
    activeAudioElement = null
  }

  // Stop Web Speech Synthesis
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    currentSpeechUtterance = null
  }
}

/**
 * Web Speech API Fallback for a single block of text.
 */
function playWebSpeech(cleanedText: string, options?: TtsOptions): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    options?.onError?.(new Error('Web Speech API is not supported in this browser.'))
    return
  }

  stopAllSpeech()
  isPlaybackCancelled = false

  const rate = options?.playbackRate || currentPlaybackSpeed
  const utterance = new SpeechSynthesisUtterance(cleanedText)
  utterance.lang = 'ar-SA'
  utterance.rate = Math.min(Math.max(rate, 0.5), 2.0)
  utterance.pitch = 1.0

  const voices = window.speechSynthesis.getVoices()
  const arVoice = voices.find(v => v.lang.startsWith('ar') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Maged') || v.name.includes('Tarik') || v.name.includes('Naayf')))
    || voices.find(v => v.lang.startsWith('ar'))

  if (arVoice) {
    utterance.voice = arVoice
  }

  utterance.onstart = () => {
    options?.onStart?.()
  }

  utterance.onend = () => {
    currentSpeechUtterance = null
    options?.onEnd?.()
  }

  utterance.onerror = (e) => {
    currentSpeechUtterance = null
    options?.onError?.(e)
  }

  currentSpeechUtterance = utterance
  window.speechSynthesis.speak(utterance)
}

/**
 * Single full-text or podcast summary audio fetch from Gemini REST API across available keys & models with Caching.
 */
async function fetchFullTextAudio(
  cleanedText: string,
  keys: string[],
  voiceName: VoiceName,
  isPodcast = false
): Promise<AudioPayload | null> {
  const modeKey = isPodcast ? 'podcast' : 'full'
  const cacheKey = `${modeKey}:${voiceName}:${cleanedText}`

  // Check in-memory audio cache first (0ms replay)
  if (audioCacheMap.has(cacheKey)) {
    console.log(`⚡ [TTS Cache Hit] Instant 0ms audio retrieved from in-memory cache for ${modeKey} (${voiceName})!`)
    return audioCacheMap.get(cacheKey)!
  }

  const selectedVoiceObj = AVAILABLE_VOICES.find(v => v.id === voiceName)
  const voiceGenderHint = selectedVoiceObj?.gender === 'female' ? 'امرأة' : 'رجل'

  const promptText = isPodcast
    ? `اقرأ اسكريبت البودكاست التعليمي التالي بنبرة إعلامية حماسية وفصيحة وممتعة بصوت (${voiceGenderHint}) وبدون أي مقدمات إضافية:\n\n${cleanedText.slice(0, 4000)}`
    : `اقرأ النص التالي كاملاً بالحرف وباللغة العربية الفصحى بنبرة موحدة وواضحة ومريحة بصوت (${voiceGenderHint}) وبدون أي مقدمات أو زيادات:\n\n${cleanedText.slice(0, 4000)}`

  for (const modelName of TTS_MODELS) {
    for (let i = 0; i < keys.length; i++) {
      const currentKey = keys[i]
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${currentKey}`

      try {
        console.log(`🚀 [TTS Engine] Generating ${modeKey} audio via ${modelName} with Voice (${voiceName}) (Key #${i + 1})...`)
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: promptText
                  }
                ]
              }
            ],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName
                  }
                }
              }
            }
          })
        })

        if (!response.ok) continue

        const data = await response.json()
        const part = data.candidates?.[0]?.content?.parts?.[0]
        const inlineData = part?.inlineData

        if (inlineData && inlineData.data) {
          const payload: AudioPayload = {
            base64Data: inlineData.data,
            mimeType: inlineData.mimeType || 'audio/wav'
          }

          // Store in cache for 0ms instant future replays
          audioCacheMap.set(cacheKey, payload)
          console.log(`💾 [TTS Engine] Audio payload cached successfully for ${modeKey} (${voiceName})!`)

          return payload
        }
      } catch (_) {
        // Continue to next key/model
      }
    }
  }

  return null
}

/**
 * Downloads audio file (WAV) directly to the user's browser using current or specified voice personality.
 * Leverages in-memory audioCacheMap (0ms replay/download if already listened or downloaded).
 */
export async function downloadAudioFile(
  rawText: string,
  customFileName?: string,
  targetVoice?: VoiceName,
  isPodcast = false
): Promise<boolean> {
  const cleanedText = cleanTextForSpeech(rawText)
  if (!cleanedText) return false

  const voiceName = targetVoice || getVoiceName()
  const keysToTry: string[] = []
  if (typeof window !== 'undefined' && (window as any).ZAD_GEMINI_API_KEY) keysToTry.push((window as any).ZAD_GEMINI_API_KEY)
  if (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) keysToTry.push(import.meta.env.VITE_GEMINI_API_KEY)
  DEFAULT_GEMINI_KEYS.forEach(k => {
    if (!keysToTry.includes(k)) keysToTry.push(k)
  })

  // Check or store in unified audioCacheMap (0ms re-download if listened previously)
  let textToFetch = cleanedText
  if (isPodcast) {
    textToFetch = await generatePodcastTextScript(cleanedText, keysToTry, voiceName)
  }

  const payload = await fetchFullTextAudio(textToFetch, keysToTry, voiceName, isPodcast)
  if (!payload) return false

  const wavBlobUrl = createWavBlobUrl(payload.base64Data, 24000)
  const a = document.createElement('a')
  a.href = wavBlobUrl
  const activeVoiceObj = AVAILABLE_VOICES.find(v => v.id === voiceName)
  const voiceLabel = activeVoiceObj ? activeVoiceObj.name : 'زاد'
  const filePrefix = isPodcast ? 'زاد_بودكاست_60ث' : 'زاد_درس_صوتي'
  a.download = customFileName || `${filePrefix}_${voiceLabel}.wav`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(wavBlobUrl), 1000)
  return true
}

const podcastScriptCacheMap = new Map<string, string>()

/**
 * Uses Gemini AI Text Model to summarize raw text into a crisp, engaging 60-second Podcast Script
 * tailored to the selected teacher voice personality and gender.
 */
async function generatePodcastTextScript(rawText: string, keys: string[], voiceName?: VoiceName): Promise<string> {
  const cleaned = cleanTextForSpeech(rawText)
  if (!cleaned) return ''

  const voice = voiceName || getVoiceName()
  const scriptCacheKey = `${voice}:${cleaned}`
  if (podcastScriptCacheMap.has(scriptCacheKey)) {
    console.log(`⚡ [Podcast AI] Loaded cached podcast script for (${voice}) (0ms)`)
    return podcastScriptCacheMap.get(scriptCacheKey)!
  }

  const selectedVoiceObj = AVAILABLE_VOICES.find(v => v.id === voice) || AVAILABLE_VOICES[0]
  const isFemale = selectedVoiceObj.gender === 'female'
  const presenterRole = isFemale ? 'مقدمة بودكاست تعليمية' : 'مقدم بودكاست تعليمي'
  const greeting = isFemale ? 'أهلاً بكِ في بودكاست زاد السريع' : 'أهلاً بك في بودكاست زاد السريع'

  for (let i = 0; i < keys.length; i++) {
    const currentKey = keys[i]
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${currentKey}`
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `أنت ${presenterRole} شائق وفصيح في منصة زاد. قم بإعداد وقراءة حلقة بودكاست تعليمية متميزة وملخصة بشكل كامل ووافي للنص التالي.
احرص على تغطية جميع المحاور الرئيسية، الأقوال والآراء والترجيح، مع ذكر الأدلة باختصار مشوق ودقيق وبدون حذف الأفكار الجوهرية أو الأدلة المذكورة.
ابدأ الحلقة بعبارة "${greeting}...":\n\n${cleaned.slice(0, 4000)}`
                }
              ]
            }
          ]
        })
      })

      if (!response.ok) continue
      const data = await response.json()
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (generatedText && generatedText.trim()) {
        const result = cleanTextForSpeech(generatedText)
        console.log(`✨ [Podcast AI] Generated crisp podcast script for voice (${selectedVoiceObj.name}) (${result.length} chars): "${result}"`)
        podcastScriptCacheMap.set(scriptCacheKey, result)
        return result
      }
    } catch (_) {
      // Try next API key
    }
  }

  // Fallback if API text summary is unreachable
  let fallbackResult = `${greeting}. خلاصة هذا الموضوع: ${cleaned}`
  const sentences = cleaned.split(/(?<=[.!?؟\n])\s+/).filter(s => s.trim().length > 5)
  if (sentences.length > 2) {
    const keyPoints = sentences.slice(0, 3).join('. ')
    fallbackResult = `${greeting}! إليك خلاصة هذا الموضوع في دقيقة واحدة: ${keyPoints}`
  }

  podcastScriptCacheMap.set(scriptCacheKey, fallbackResult)
  return fallbackResult
}

/**
 * Initiates Gemini 60-Second Audio Podcast Summary by first summarizing text via Gemini AI,
 * then synthesizing it into audio using the selected voice personality.
 */
export async function speakPodcastSummary(rawText: string, options?: TtsOptions): Promise<void> {
  const cleanedText = cleanTextForSpeech(rawText)
  if (!cleanedText) {
    options?.onError?.(new Error('Text is empty'))
    return
  }

  // Assign session ID and reset cancelled flag before starting async generation
  stopAllSpeech()
  isPlaybackCancelled = false
  const podcastSessionId = globalSpeechSessionId

  const voiceToUse = options?.voiceName || getVoiceName()

  const keysToTry: string[] = []
  if (options?.apiKey) keysToTry.push(options.apiKey)
  if (typeof window !== 'undefined' && (window as any).ZAD_GEMINI_API_KEY) keysToTry.push((window as any).ZAD_GEMINI_API_KEY)
  if (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) keysToTry.push(import.meta.env.VITE_GEMINI_API_KEY)
  DEFAULT_GEMINI_KEYS.forEach(k => {
    if (!keysToTry.includes(k)) keysToTry.push(k)
  })

  // 1. Generate real Podcast summary script using Gemini Flash Text AI with selected voice gender awareness
  console.log(`🎙️ [TTS Engine] Generating podcast summary script for voice (${voiceToUse})...`)
  const podcastScript = await generatePodcastTextScript(cleanedText, keysToTry, voiceToUse)

  // CANCELLATION GUARD: Discard if user clicked Stop or switched sessions during script generation
  if (podcastSessionId !== globalSpeechSessionId || isPlaybackCancelled) {
    console.log(`🛑 [TTS Engine] Podcast generation cancelled by user (Session #${podcastSessionId}). Skipping playback.`)
    options?.onEnd?.()
    return
  }

  // 2. Synthesize podcast audio script using Gemini Audio TTS with selected voice personality
  return speakText(podcastScript, {
    ...options,
    voiceName: voiceToUse,
    isPodcast: true,
    playbackRate: options?.playbackRate || 1.12,
  })
}

/**
 * Single-Payload Processing TTS Entry Point with Pitch Preservation, Voice Selection, Caching & Concurrency Guards.
 */
export async function speakText(rawText: string, options?: TtsOptions): Promise<void> {
  console.log('====================================================')
  console.log(`🎙️ [TTS Engine] Initiating ${options?.isPodcast ? 'Podcast Summary' : 'Full Text'} audio generation...`)

  const cleanedText = cleanTextForSpeech(rawText)
  if (!cleanedText) {
    options?.onError?.(new Error('Text is empty after cleaning'))
    return
  }

  if (options?.playbackRate) {
    currentPlaybackSpeed = options.playbackRate
  }

  const voiceName = options?.voiceName || getVoiceName()

  // Gather candidate API keys
  const keysToTry: string[] = []
  if (options?.apiKey) keysToTry.push(options.apiKey)
  if (typeof window !== 'undefined' && (window as any).ZAD_GEMINI_API_KEY) keysToTry.push((window as any).ZAD_GEMINI_API_KEY)
  if (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) keysToTry.push(import.meta.env.VITE_GEMINI_API_KEY)
  if (typeof window !== 'undefined') {
    const localK1 = localStorage.getItem('zad_gemini_api_key')
    if (localK1) keysToTry.push(localK1)
    const localK2 = localStorage.getItem('gemini_api_key')
    if (localK2) keysToTry.push(localK2)
  }
  DEFAULT_GEMINI_KEYS.forEach(k => {
    if (!keysToTry.includes(k)) keysToTry.push(k)
  })

  // Cancel any ongoing audio playback and assign a new session ID for this request
  stopAllSpeech()
  isPlaybackCancelled = false
  const currentSessionId = globalSpeechSessionId

  // Fetch or retrieve from cache
  const payload = await fetchFullTextAudio(cleanedText, keysToTry, voiceName, options?.isPodcast)

  // STALE REQUEST GUARD: Discard if user triggered a new speech request while this fetch was in-flight
  if (currentSessionId !== globalSpeechSessionId || isPlaybackCancelled) {
    console.log(`🛑 [TTS Engine] Speech request #${currentSessionId} finished downloading & cached in background, but playback skipped because user switched to session #${globalSpeechSessionId}.`)
    return
  }

  if (!payload) {
    console.warn('⚠️ [TTS Engine] Full text audio generation failed. Falling back to Web Speech...')
    if (currentSessionId === globalSpeechSessionId) {
      playWebSpeech(cleanedText, options)
    }
    return
  }

  console.log(`✅ [TTS Engine] Audio payload ready (${voiceName})! Playing at ${currentPlaybackSpeed}x speed...`)

  try {
    const wavBlobUrl = createWavBlobUrl(payload.base64Data, 24000)
    const audio = new Audio(wavBlobUrl)

    // Final sanity check right before binding active audio element
    if (currentSessionId !== globalSpeechSessionId || isPlaybackCancelled) {
      URL.revokeObjectURL(wavBlobUrl)
      return
    }

    activeAudioElement = audio

    // Enable Pitch Preservation across all browsers
    ;(audio as any).preservesPitch = true
    ;(audio as any).mozPreservesPitch = true
    ;(audio as any).webkitPreservesPitch = true
    audio.playbackRate = currentPlaybackSpeed
    audio.muted = isAudioMuted

    audio.onended = () => {
      URL.revokeObjectURL(wavBlobUrl)
      activeAudioElement = null
      if (!isPlaybackCancelled && currentSessionId === globalSpeechSessionId) {
        console.log('🏁 [TTS Engine] Full audio playback completed.')
        options?.onEnd?.()
      }
    }

    audio.onerror = (e) => {
      console.error('❌ [TTS Engine] Audio element error:', e)
      URL.revokeObjectURL(wavBlobUrl)
      activeAudioElement = null
      if (!isPlaybackCancelled && currentSessionId === globalSpeechSessionId) {
        playWebSpeech(cleanedText, options)
      }
    }

    options?.onStart?.()
    await audio.play()

  } catch (err) {
    console.error('❌ [TTS Engine] Error playing audio element:', err)
    if (!isPlaybackCancelled && currentSessionId === globalSpeechSessionId) {
      playWebSpeech(cleanedText, options)
    }
  }
}
