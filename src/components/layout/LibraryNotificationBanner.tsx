import { useState, useEffect } from 'react'

const TUTOR_ENGINE_URL = import.meta.env.VITE_TUTOR_ENGINE_URL || 'https://abourida-zad-tutor-engine-space.hf.space'
const API_BASE = TUTOR_ENGINE_URL

export default function LibraryNotificationBanner() {
  const [hasUpdate, setHasUpdate] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [latestVersion, setLatestVersion] = useState<string | null>(null)

  const checkVersion = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/library/version`)
      const data = await res.json()
      if (data.success && data.version) {
        const localVersion = localStorage.getItem('zad_library_version')
        
        // If local version exists and differs from server version
        if (localVersion && localVersion !== data.version) {
          setHasUpdate(true)
          setLatestVersion(data.version)
        } else if (!localVersion) {
          // Initialize local version
          localStorage.setItem('zad_library_version', data.version)
        }
      }
    } catch (err) {
      // Quiet failure for network/polling errors
    }
  }

  useEffect(() => {
    checkVersion()
    const interval = setInterval(checkVersion, 15000) // Poll every 15 seconds
    return () => clearInterval(interval)
  }, [])

  const handleApplyUpdate = async () => {
    setUpdating(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/library/trees?force_refresh=true`)
      const data = await res.json()
      if (data.success && data.tree) {
        localStorage.setItem('zad_library_tree', JSON.stringify(data.tree))
        if (latestVersion) {
          localStorage.setItem('zad_library_version', latestVersion)
        }
        // Notify other components (like StudyMode) to refresh tree in memory
        window.dispatchEvent(new Event('zad_library_updated'))
        setHasUpdate(false)
      }
    } catch (err) {
      console.error('Failed to update library cache:', err)
    } finally {
      setUpdating(false)
    }
  }

  if (!hasUpdate) return null

  return (
    <div
      dir="rtl"
      className="relative z-50 flex items-center justify-between gap-4 border-b border-emerald-500/30 bg-gradient-to-r from-[#064e3b]/95 via-[#047857]/95 to-[#065f46]/95 px-6 py-3 text-white shadow-xl backdrop-blur-md transition-all duration-500 animate-in fade-in slide-in-from-top-4"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300 ring-2 ring-emerald-400/30 animate-pulse">
          🔔
        </div>
        <p className="text-sm font-semibold text-emerald-50">
          تم إضافة كتب ومحتوى دراسي جديد إلى المكتبة!
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleApplyUpdate}
          disabled={updating}
          className="flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-1.5 text-xs font-bold text-emerald-950 shadow-md transition-all hover:bg-emerald-300 hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {updating ? (
            <>
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-emerald-950 border-t-transparent" />
              جاري التحديث...
            </>
          ) : (
            'انقر للتحديث 🚀'
          )}
        </button>
        <button
          onClick={() => setHasUpdate(false)}
          className="rounded-lg p-1 text-emerald-200/70 hover:bg-white/10 hover:text-white transition-colors"
          title="إغلاق"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
