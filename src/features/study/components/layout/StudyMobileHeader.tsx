import { motion, AnimatePresence } from "framer-motion"
import { Menu, History, Timer } from "lucide-react"
import NotificationBell from "../../../../components/layout/NotificationBell"
import { StudyTimerWidget } from "../widgets/StudyTimerWidget"
import whiteLogo from "@/assets/images/WhiteLogo.png"
import darkLogo from "@/assets/images/ZadDarkLogo.png"

export interface StudyMobileHeaderProps {
  isDark: boolean
  accentColor: string
  isHistoryModalOpen: boolean
  setIsHistoryModalOpen: (open: boolean) => void
  isTimerNavbarExpanded: boolean
  setIsTimerNavbarExpanded: React.Dispatch<React.SetStateAction<boolean>>
  setIsPlatformSidebarOpen: (open: boolean) => void
  setStudyView: (view: "hero" | "workspace" | "tracks" | "track-admin") => void
  getNavCircleBtnStyle: () => string
  getZadWordClass: () => string
}

export function StudyMobileHeader({
  isDark,
  accentColor,
  isHistoryModalOpen,
  setIsHistoryModalOpen,
  isTimerNavbarExpanded,
  setIsTimerNavbarExpanded,
  setIsPlatformSidebarOpen,
  setStudyView,
  getNavCircleBtnStyle,
  getZadWordClass,
}: StudyMobileHeaderProps) {
  return (
    <header className="md:hidden relative z-30 shrink-0 w-full border-b border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#090b10]/90 backdrop-blur-xl shadow-xs transition-colors">
      <div className="w-full px-3.5 py-2 flex items-center justify-between gap-2 min-h-[58px]">
        {/* RIGHT (RTL): Drawer Menu Toggle + Zad Logo & Word */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsPlatformSidebarOpen(true)}
            className={`h-10 w-10 rounded-full border flex items-center justify-center transition-all backdrop-blur-md active:scale-95 cursor-pointer group ${getNavCircleBtnStyle()}`}
            title="القائمة الرئيسية للمنصة"
            aria-label="فتح القائمة الرئيسية"
          >
            <Menu
              className="h-5 w-5 transition-transform group-hover:scale-110"
              strokeWidth={2.2}
            />
          </button>

          <div
            onClick={() => setStudyView("hero")}
            className="flex items-center gap-2 cursor-pointer group select-none"
            title="الرئيسية للمدارسة"
          >
            {accentColor === "purple" ? (
              <img
                src={darkLogo}
                alt="زاد"
                className="h-8.5 w-auto object-contain drop-shadow-[0_2px_8px_rgba(157,50,236,0.35)]"
              />
            ) : (
              <div
                aria-hidden="true"
                className={`h-8.5 w-8.5 shrink-0 transition-transform group-hover:scale-105 ${
                  accentColor === "blue"
                    ? isDark
                      ? "bg-gradient-to-b from-[#38bdf8] via-[#2563eb] to-[#1e40af]"
                      : "bg-gradient-to-b from-[#0284c7] via-[#1d4ed8] to-[#1e3a8a]"
                    : accentColor === "emerald"
                      ? isDark
                        ? "bg-gradient-to-b from-[#5eead4] via-[#14b8a6] to-[#0f766e]"
                        : "bg-gradient-to-b from-[#14b8a6] via-[#0d9488] to-[#134e4a]"
                      : isDark
                        ? "bg-gradient-to-b from-[#f5ecd5] via-[#dfbf83] to-[#8e682d]"
                        : "bg-gradient-to-b from-[#dfbf83] via-[#b88d46] to-[#5e431a]"
                }`}
                style={{
                  WebkitMaskImage: `url(${whiteLogo})`,
                  maskImage: `url(${whiteLogo})`,
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                }}
              />
            )}

            <span
              className={`font-display text-[21px] font-bold inline-block transition-colors leading-none ${getZadWordClass()}`}
            >
              زاد
            </span>
          </div>
        </div>

        {/* LEFT (RTL): NotificationBell + Timer Toggle Button + History Button */}
        <div className="flex items-center gap-2 shrink-0">
          {/* زر سجل المدارسة والأداء */}
          <button
            id="study-mobile-history-btn"
            type="button"
            onClick={() => setIsHistoryModalOpen(true)}
            className={`h-10 w-10 rounded-full border flex items-center justify-center transition-all backdrop-blur-md active:scale-95 cursor-pointer group ${
              isHistoryModalOpen
                ? isDark
                  ? accentColor === "amber"
                    ? "bg-amber-500/20 text-[#eed8ad] border-[#dfbf83] shadow-sm"
                    : accentColor === "emerald"
                      ? "bg-teal-500/20 text-teal-300 border-teal-400 shadow-sm"
                      : accentColor === "blue"
                        ? "bg-blue-500/20 text-blue-300 border-blue-400 shadow-sm"
                        : "bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-sm"
                  : accentColor === "amber"
                    ? "bg-amber-100 text-[#8a652a] border-amber-300 shadow-sm"
                    : accentColor === "emerald"
                      ? "bg-teal-100 text-teal-800 border-teal-300 shadow-sm"
                      : accentColor === "blue"
                        ? "bg-blue-100 text-blue-800 border-blue-300 shadow-sm"
                        : "bg-purple-100 text-purple-800 border-purple-300 shadow-sm"
                : getNavCircleBtnStyle()
            }`}
            title="سجل المدارسة والجلسات السابقة"
            aria-label="سجل المدارسة"
          >
            <History
              className="h-5 w-5 shrink-0 transition-transform group-hover:scale-110"
              strokeWidth={2.2}
            />
          </button>

          {/* زر المؤقت بجانب الإشعارات يميناً */}
          <button
            id="study-mobile-timer-btn"
            type="button"
            onClick={() => setIsTimerNavbarExpanded((prev) => !prev)}
            className={`h-10 w-10 rounded-full border flex items-center justify-center transition-all backdrop-blur-md active:scale-95 cursor-pointer group ${
              isTimerNavbarExpanded
                ? isDark
                  ? accentColor === "amber"
                    ? "bg-amber-500/20 text-[#eed8ad] border-[#dfbf83] shadow-sm"
                    : accentColor === "emerald"
                      ? "bg-teal-500/20 text-teal-300 border-teal-400 shadow-sm"
                      : accentColor === "blue"
                        ? "bg-blue-500/20 text-blue-300 border-blue-400 shadow-sm"
                        : "bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-sm"
                  : accentColor === "amber"
                    ? "bg-amber-100 text-[#8a652a] border-amber-300 shadow-sm"
                    : accentColor === "emerald"
                      ? "bg-teal-100 text-teal-800 border-teal-300 shadow-sm"
                      : accentColor === "blue"
                        ? "bg-blue-100 text-blue-800 border-blue-300 shadow-sm"
                        : "bg-purple-100 text-purple-800 border-purple-300 shadow-sm"
                : getNavCircleBtnStyle()
            }`}
            title={
              isTimerNavbarExpanded
                ? "إخفاء مؤقت المدارسة"
                : "عرض مؤقت المدارسة"
            }
            aria-label="مؤقت المدارسة"
          >
            <Timer
              className="h-5 w-5 shrink-0 transition-transform group-hover:scale-110"
              strokeWidth={2.2}
            />
          </button>

          <NotificationBell />
        </div>
      </div>

      {/* تمدد المؤقت كطبقة عائمة فوق المحتوى */}
      <AnimatePresence>
        {isTimerNavbarExpanded && (
          <motion.div
            id="study-mobile-timer-container"
            initial={{ opacity: 0, y: -6, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -6, scaleY: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ originY: 0 }}
            className="absolute top-full left-0 right-0 z-50 w-full border-b border-x border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#0e031a]/95 backdrop-blur-2xl px-3.5 py-3 shadow-2xl rounded-b-2xl"
          >
            <div className="w-full max-w-sm mx-auto">
              <StudyTimerWidget
                isDark={isDark}
                isFullWidth={true}
                hideTriggerHeader={true}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

