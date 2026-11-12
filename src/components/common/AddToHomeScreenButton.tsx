import { useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Check,
  ChevronLeft,
  CircleCheck,
  Copy,
  EllipsisVertical,
  Share,
  Smartphone,
  SquarePlus,
  X,
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { usePwaInstall } from '../../hooks/usePwaInstall'

interface AddToHomeScreenButtonProps {
  isDarkOverride?: boolean
  onInstalled?: () => void
}

/** Sidebar button that triggers native "Add to Home Screen" or shows browser-specific fallback instructions. */
export default function AddToHomeScreenButton({
  isDarkOverride,
  onInstalled,
}: AddToHomeScreenButtonProps) {
  const { isDark: themeIsDark, accentColor } = useTheme()
  const isDark = isDarkOverride ?? themeIsDark
  const { isInstalled, platform, isInAppBrowser, triggerInstall } = usePwaInstall()
  const [showGuideModal, setShowGuideModal] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)

  const getCardClass = () =>
    isDark
      ? 'border-white/[0.07] bg-white/[0.03] text-white/90 hover:bg-white/[0.08] hover:border-white/15'
      : 'border-stone-200/70 bg-white/80 text-stone-800 hover:bg-white hover:border-stone-300 shadow-2xs'

  const getIconBoxClass = () => {
    switch (accentColor) {
      case 'emerald':
        return isDark
          ? 'bg-teal-500/10 border-teal-500/25 text-teal-300'
          : 'bg-teal-50 border-teal-200/80 text-teal-700'
      case 'amber':
        return isDark
          ? 'bg-[#dfbf83]/10 border-[#dfbf83]/25 text-[#eed8ad]'
          : 'bg-[#fbf8f0] border-[#ebd9b5] text-[#8a652a]'
      case 'blue':
        return isDark
          ? 'bg-blue-500/10 border-blue-500/25 text-blue-300'
          : 'bg-blue-50 border-blue-200/80 text-blue-700'
      case 'purple':
      default:
        return isDark
          ? 'bg-purple-500/10 border-purple-500/25 text-purple-300'
          : 'bg-purple-50 border-purple-200/80 text-purple-700'
    }
  }

  const getBadgeClass = () => {
    switch (accentColor) {
      case 'emerald':
        return isDark
          ? 'bg-teal-500/15 text-teal-300 border-teal-500/30'
          : 'bg-teal-50 text-teal-800 border-teal-200'
      case 'amber':
        return isDark
          ? 'bg-[#dfbf83]/15 text-[#eed9b0] border-[#dfbf83]/30'
          : 'bg-[#fbf8f0] text-[#8a652a] border-[#ebd9b5]'
      case 'blue':
        return isDark
          ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
          : 'bg-blue-50 text-blue-800 border-blue-200'
      case 'purple':
      default:
        return isDark
          ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
          : 'bg-purple-50 text-purple-800 border-purple-200'
    }
  }

  const handleClick = async () => {
    const outcome = await triggerInstall()
    if (outcome === 'accepted') {
      onInstalled?.()
    } else if (outcome === 'manual' || outcome === 'already-installed') {
      setShowGuideModal(true)
    }
  }

  const handleCopyUrl = async () => {
    const url = typeof window !== 'undefined' ? window.location.origin : 'https://zad-islamic-ai.vercel.app/'
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = url
        textArea.style.position = 'fixed'
        textArea.style.opacity = '0'
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2500)
    } catch {
      // Ignore clipboard failures
    }
  }

  const renderGuideContent = () => {
    if (isInstalled) {
      return (
        <div className={`rounded-2xl border p-4 text-center space-y-2 ${isDark ? 'border-emerald-500/25 bg-emerald-500/10' : 'border-emerald-200 bg-emerald-50/80'}`}>
          <CircleCheck size={32} className="mx-auto text-emerald-500" />
          <p className="text-sm font-bold">تمت إضافة «زاد» بالفعل!</p>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-white/70' : 'text-stone-600'}`}>
            التطبيق مثبّت حالياً على جهازك ويمكنك فتحه مباشرة من الشاشة الرئيسية.
          </p>
        </div>
      )
    }

    if (isInAppBrowser) {
      return (
        <div className="space-y-3">
          <div className={`rounded-xl border p-3 text-xs leading-relaxed ${isDark ? 'border-amber-500/25 bg-amber-500/10 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
            أنت تتصفح الآن من متصفح داخلي (مثل واتساب أو تيليجرام أو فيسبوك)، وهذه المتصفحات لا تسمح بإضافة اختصار للشاشة الرئيسية مباشرة.
          </div>
          <ol className="space-y-2 text-xs leading-relaxed">
            <li className={`flex items-start gap-2.5 rounded-xl border p-3 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-stone-200 bg-stone-50/80'}`}>
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold border ${getBadgeClass()}`}>1</span>
              <span>افتح قائمة المتصفح <EllipsisVertical size={14} className="inline mx-0.5 opacity-80" /> واختر <strong>«الفتح في المتصفح»</strong> (Chrome أو Safari).</span>
            </li>
            <li className={`flex items-start gap-2.5 rounded-xl border p-3 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-stone-200 bg-stone-50/80'}`}>
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold border ${getBadgeClass()}`}>2</span>
              <span>من هناك اضغط مرة أخرى على <strong>«إضافة زاد إلى شاشة الهاتف»</strong>.</span>
            </li>
          </ol>
          <button
            type="button"
            onClick={handleCopyUrl}
            className="flex w-full items-center justify-center gap-2 rounded-xl brand-gradient text-white py-2.5 px-4 text-xs font-bold active:scale-[0.98] transition-all cursor-pointer"
          >
            {copiedUrl ? <Check size={15} /> : <Copy size={15} />}
            <span>{copiedUrl ? 'تم نسخ رابط زاد!' : 'نسخ رابط الموقع لفتحه في المتصفح'}</span>
          </button>
        </div>
      )
    }

    if (platform === 'ios') {
      return (
        <ol className="space-y-2.5 text-xs leading-relaxed">
          <li className={`flex items-start gap-2.5 rounded-xl border p-3 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-stone-200 bg-stone-50/80'}`}>
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold border ${getBadgeClass()}`}>1</span>
            <span>
              اضغط على أيقونة <strong>المشاركة</strong> <Share size={14} className="inline mx-1 text-sky-400" /> في شريط متصفح Safari.
            </span>
          </li>
          <li className={`flex items-start gap-2.5 rounded-xl border p-3 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-stone-200 bg-stone-50/80'}`}>
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold border ${getBadgeClass()}`}>2</span>
            <span>
              اختر <strong>«إضافة إلى الصفحة الرئيسية»</strong> (Add to Home Screen) ثم اضغط <strong>إضافة</strong>.
            </span>
          </li>
        </ol>
      )
    }

    if (platform === 'android') {
      return (
        <ol className="space-y-2.5 text-xs leading-relaxed">
          <li className={`flex items-start gap-2.5 rounded-xl border p-3 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-stone-200 bg-stone-50/80'}`}>
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold border ${getBadgeClass()}`}>1</span>
            <span>
              اضغط على قائمة المتصفح <EllipsisVertical size={14} className="inline mx-0.5 opacity-80" /> في الزاوية العلوية من Chrome.
            </span>
          </li>
          <li className={`flex items-start gap-2.5 rounded-xl border p-3 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-stone-200 bg-stone-50/80'}`}>
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold border ${getBadgeClass()}`}>2</span>
            <span>
              اختر <strong>«الإضافة إلى الشاشة الرئيسية»</strong> أو <strong>«تثبيت التطبيق»</strong> ثم أكّد الإضافة.
            </span>
          </li>
        </ol>
      )
    }

    return (
      <ol className="space-y-2.5 text-xs leading-relaxed">
        <li className={`flex items-start gap-2.5 rounded-xl border p-3 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-stone-200 bg-stone-50/80'}`}>
          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold border ${getBadgeClass()}`}>1</span>
          <span>
            اضغط على أيقونة التثبيت في شريط العنوان، أو افتح قائمة المتصفح <EllipsisVertical size={14} className="inline mx-0.5 opacity-80" />.
          </span>
        </li>
        <li className={`flex items-start gap-2.5 rounded-xl border p-3 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-stone-200 bg-stone-50/80'}`}>
          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold border ${getBadgeClass()}`}>2</span>
          <span>
            اختر <strong>«تثبيت زاد...»</strong> (أو <strong>حفظ ومشاركة ← تثبيت الصفحة كتطبيق</strong>).
          </span>
        </li>
      </ol>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm font-semibold active:scale-[0.99] transition-all cursor-pointer ${getCardClass()}`}
      >
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${getIconBoxClass()}`}>
            <SquarePlus size={16} />
          </div>
          <div className="text-right">
            <span className="block text-sm font-bold">إضافة زاد إلى شاشة الهاتف</span>
            <span className={`text-[11px] font-normal ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
              {isInstalled ? 'مضاف بالفعل على شاشة جهازك' : 'تشغيل سريع كتطبيق مباشرة من المتصفح'}
            </span>
          </div>
        </div>
        {isInstalled ? (
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${getBadgeClass()}`}>
            مثبّت
          </span>
        ) : (
          <ChevronLeft size={16} className={isDark ? 'text-white/55 shrink-0' : 'text-stone-400 shrink-0'} />
        )}
      </button>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {showGuideModal && (
              <div className="fixed inset-0 z-[130] flex items-center justify-center p-4" dir="rtl">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowGuideModal(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 12 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 12 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className={`relative z-10 w-full max-w-sm rounded-2xl border p-5 shadow-2xl backdrop-blur-xl ${
                    isDark
                      ? 'border-white/10 bg-[#090b10]/98 text-white shadow-[0_20px_50px_rgba(0,0,0,0.85)]'
                      : 'border-stone-200/90 bg-white/98 text-stone-900 shadow-stone-400/20'
                  }`}
                >
                  <div className={`flex items-center justify-between pb-3 border-b mb-4 ${isDark ? 'border-white/10' : 'border-stone-200/80'}`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${getIconBoxClass()}`}>
                        <Smartphone size={18} strokeWidth={2.2} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold">إضافة زاد إلى شاشة الهاتف</h3>
                        <p className={`text-[11px] ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                          وصول فوري كأنه تطبيق مستقل
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowGuideModal(false)}
                      aria-label="إغلاق"
                      className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all active:scale-90 cursor-pointer ${
                        isDark
                          ? 'border-white/10 hover:bg-white/10 text-white/70'
                          : 'border-stone-200 hover:bg-stone-100 text-stone-600'
                      }`}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {renderGuideContent()}

                  <button
                    type="button"
                    onClick={() => setShowGuideModal(false)}
                    className={`mt-4 w-full py-2 px-4 rounded-xl border text-xs font-bold transition-all active:scale-[0.98] cursor-pointer ${
                      isDark
                        ? 'border-white/10 bg-white/5 hover:bg-white/10 text-white/90'
                        : 'border-stone-200 bg-stone-100 hover:bg-stone-200/80 text-stone-800'
                    }`}
                  >
                    حسناً
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  )
}
