import { useEffect, useState, useCallback } from 'react'

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export type PwaPlatform = 'ios' | 'android' | 'desktop'
export type PwaInstallOutcome = 'accepted' | 'dismissed' | 'already-installed' | 'manual'

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null
let hasAppInstalled = false
let listenersInitialized = false
const subscribers = new Set<() => void>()

function notifySubscribers() {
  subscribers.forEach((cb) => cb())
}

function checkIsStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    (window.navigator as { standalone?: boolean }).standalone === true
  )
}

function detectPlatform(): { platform: PwaPlatform; isInAppBrowser: boolean } {
  if (typeof navigator === 'undefined') {
    return { platform: 'desktop', isInAppBrowser: false }
  }
  const ua = navigator.userAgent || ''
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isAndroid = /Android/i.test(ua)
  const isInAppBrowser =
    /FBAN|FBAV|Instagram|Line\/|Twitter|Snapchat|MicroMessenger|Telegram|TikTok/i.test(ua) ||
    (/\bwv\b/i.test(ua) && isAndroid)

  if (isIOS) return { platform: 'ios', isInAppBrowser }
  if (isAndroid) return { platform: 'android', isInAppBrowser }
  return { platform: 'desktop', isInAppBrowser }
}

function ensureGlobalListeners() {
  if (listenersInitialized || typeof window === 'undefined') return
  listenersInitialized = true

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredInstallPrompt = event as BeforeInstallPromptEvent
    notifySubscribers()
  })

  window.addEventListener('appinstalled', () => {
    hasAppInstalled = true
    deferredInstallPrompt = null
    notifySubscribers()
  })
}

ensureGlobalListeners()

/** Register a minimal Service Worker on secure origins to enable native PWA install prompts. */
export function registerPwaServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
  const isLocalhost =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  if (window.location.protocol !== 'https:' && !isLocalhost) return

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

/** Hook exposing native PWA install prompt state and fallback platform detection. */
export function usePwaInstall() {
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    ensureGlobalListeners()
    const update = () => forceUpdate((n) => n + 1)
    subscribers.add(update)

    const mql = window.matchMedia?.('(display-mode: standalone)')
    mql?.addEventListener?.('change', update)

    return () => {
      subscribers.delete(update)
      mql?.removeEventListener?.('change', update)
    }
  }, [])

  const isInstalled = hasAppInstalled || checkIsStandalone()
  const canPrompt = Boolean(deferredInstallPrompt) && !isInstalled
  const { platform, isInAppBrowser } = detectPlatform()

  const triggerInstall = useCallback(async (): Promise<PwaInstallOutcome> => {
    if (hasAppInstalled || checkIsStandalone()) {
      return 'already-installed'
    }

    if (!deferredInstallPrompt) {
      return 'manual'
    }

    const promptEvent = deferredInstallPrompt
    deferredInstallPrompt = null
    notifySubscribers()

    try {
      await promptEvent.prompt()
      const choice = await promptEvent.userChoice
      if (choice.outcome === 'accepted') {
        hasAppInstalled = true
        notifySubscribers()
        return 'accepted'
      }
      return 'dismissed'
    } catch {
      return 'manual'
    }
  }, [])

  return {
    isInstalled,
    canPrompt,
    platform,
    isInAppBrowser,
    triggerInstall,
  }
}

