import { motion } from "framer-motion"
import { Target, FileText, MessageSquare, Sparkles } from "lucide-react"
import { useTheme } from "../../../../contexts/ThemeContext"

interface StudyWelcomeActionCardsProps {
  chunkTitle?: string
  isDark?: boolean
  onSelectOption: (optionKey: "plan" | "summary" | "chat") => void
}

export function StudyWelcomeActionCards({
  chunkTitle,
  isDark = true,
  onSelectOption,
}: StudyWelcomeActionCardsProps) {
  const { accentColor } = useTheme()

  // Container styling matching the active theme
  const getContainerStyle = () => {
    if (isDark) {
      return "bg-[#090b10]/95 border-white/10 text-white shadow-2xl shadow-black/50"
    } else {
      switch (accentColor) {
        case "emerald":
          return "bg-white/95 border-teal-200/80 text-teal-950 shadow-xl shadow-teal-500/10"
        case "amber":
          return "bg-white/95 border-[#ebd9b5] text-[#2d2215] shadow-xl shadow-amber-500/10"
        case "blue":
          return "bg-white/95 border-blue-200/80 text-blue-950 shadow-xl shadow-blue-500/10"
        case "purple":
        default:
          return "bg-white/95 border-purple-200/80 text-purple-950 shadow-xl shadow-purple-500/10"
      }
    }
  }

  // Header Sparkle Icon Style
  const getSparkleBoxStyle = () => {
    switch (accentColor) {
      case "emerald":
        return "bg-gradient-to-tr from-teal-700 via-teal-500 to-emerald-400 text-white shadow-teal-500/30"
      case "amber":
        return "bg-gradient-to-tr from-[#78350f] via-[#b88d46] to-[#dfbf83] text-stone-950 font-black shadow-amber-500/30"
      case "blue":
        return "bg-gradient-to-tr from-blue-700 via-blue-500 to-sky-400 text-white shadow-blue-500/30"
      case "purple":
      default:
        return "bg-gradient-to-tr from-purple-700 via-fuchsia-500 to-purple-400 text-white shadow-purple-500/30"
    }
  }

  // Highlight Text Style
  const getHighlightTextStyle = () => {
    if (isDark) {
      switch (accentColor) {
        case "emerald":
          return "text-teal-300"
        case "amber":
          return "text-[#edd8ae]"
        case "blue":
          return "text-sky-300"
        default:
          return "text-[#e080e0]"
      }
    } else {
      switch (accentColor) {
        case "emerald":
          return "text-teal-800 font-extrabold"
        case "amber":
          return "text-[#8a652a] font-extrabold"
        case "blue":
          return "text-blue-800 font-extrabold"
        default:
          return "text-[#800080] font-extrabold"
      }
    }
  }

  // Card 1 (Plan) Styling
  const getCard1Style = () => {
    if (isDark) {
      return "bg-[#090b10] hover:bg-[#272830] border-white/10 hover:border-white/20 text-white shadow-md"
    } else {
      switch (accentColor) {
        case "emerald":
          return "bg-gradient-to-b from-teal-50/90 to-emerald-50/40 border-teal-200 hover:border-teal-400 hover:shadow-teal-100"
        case "amber":
          return "bg-gradient-to-b from-[#fbf8f0] to-[#f4ecdc]/50 border-[#ebd9b5] hover:border-[#dfbf83] hover:shadow-amber-100"
        case "blue":
          return "bg-gradient-to-b from-blue-50/90 to-sky-50/40 border-blue-200 hover:border-blue-400 hover:shadow-blue-100"
        default:
          return "bg-gradient-to-b from-purple-50/90 to-fuchsia-50/40 border-purple-200 hover:border-purple-400 hover:shadow-purple-100"
      }
    }
  }

  // Card 2 (Summary) Styling
  const getCard2Style = () => {
    if (isDark) {
      return "bg-[#090b10] hover:bg-[#272830] border-white/10 hover:border-white/20 text-white shadow-md"
    } else {
      switch (accentColor) {
        case "emerald":
          return "bg-gradient-to-b from-emerald-50/90 to-teal-50/40 border-emerald-200 hover:border-emerald-400 hover:shadow-emerald-100"
        case "amber":
          return "bg-gradient-to-b from-[#fbf6ee] to-[#f5ebd7]/50 border-[#dfbf83]/50 hover:border-[#b88d46] hover:shadow-amber-100"
        case "blue":
          return "bg-gradient-to-b from-sky-50/90 to-indigo-50/40 border-sky-200 hover:border-sky-400 hover:shadow-sky-100"
        default:
          return "bg-gradient-to-b from-fuchsia-50/90 to-purple-50/40 border-fuchsia-200 hover:border-fuchsia-400 hover:shadow-fuchsia-100"
      }
    }
  }

  // Card 3 (Chat) Styling
  const getCard3Style = () => {
    if (isDark) {
      return "bg-[#090b10] hover:bg-[#272830] border-white/10 hover:border-white/20 text-white shadow-md"
    } else {
      switch (accentColor) {
        case "emerald":
          return "bg-gradient-to-b from-teal-50/80 to-cyan-50/40 border-teal-200 hover:border-teal-400 hover:shadow-teal-100"
        case "amber":
          return "bg-gradient-to-b from-[#f8f5ee] to-[#ece3d2]/50 border-stone-300 hover:border-[#dfbf83] hover:shadow-amber-100"
        case "blue":
          return "bg-gradient-to-b from-indigo-50/90 to-blue-50/40 border-indigo-200 hover:border-indigo-400 hover:shadow-indigo-100"
        default:
          return "bg-gradient-to-b from-purple-50/90 to-indigo-50/40 border-purple-200 hover:border-purple-400 hover:shadow-purple-100"
      }
    }
  }

  const getIconBadgeClass = (cardIdx: 1 | 2 | 3) => {
    if (isDark) {
      switch (accentColor) {
        case "emerald":
          return "bg-teal-500/25 text-teal-300 border border-teal-500/40"
        case "amber":
          return "bg-[#dfbf83]/25 text-[#edd8ae] border border-[#dfbf83]/40"
        case "blue":
          return "bg-blue-500/25 text-blue-300 border border-blue-500/40"
        default:
          return "bg-[#800080] text-white border border-[#660066]"
      }
    } else {
      switch (accentColor) {
        case "emerald":
          return "bg-teal-600 text-white shadow-md shadow-teal-600/30"
        case "amber":
          return "bg-[#8a652a] text-white shadow-md shadow-[#8a652a]/30"
        case "blue":
          return "bg-blue-600 text-white shadow-md shadow-blue-600/30"
        default:
          return "bg-[#800080] text-white shadow-md shadow-[#800080]/30"
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`rounded-3xl border p-5 mb-5 shadow-2xl backdrop-blur-2xl ${getContainerStyle()}`}
    >
      {/* Header Greeting */}
      <div className="mb-4 text-right">
        <div>
          <h3
            className={`text-sm font-black leading-snug ${
              isDark ? "text-white" : "text-foreground"
            }`}
          >
            أهلاً بك! كيف نصل إلى أفضل استفادة من درس{" "}
            <span className={getHighlightTextStyle()}>
              "{chunkTitle || "الدرس المختار"}"
            </span>
            ؟
          </h3>
          <p
            className={`text-xs mt-0.5 ${
              isDark ? "text-white/60" : "text-muted-foreground"
            }`}
          >
            اختر المسار الأنسب لمذاكرتك الآن بنقرة واحدة:
          </p>
        </div>
      </div>

      {/* 3 Interactive Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Option 1: Study Plan */}
        <button
          type="button"
          onClick={() => onSelectOption("plan")}
          className={`flex flex-col justify-between rounded-2xl border p-4 text-right transition-all duration-300 hover:-translate-y-1 active:scale-95 cursor-pointer shadow-md ${getCard1Style()}`}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-transform duration-300 ${getIconBadgeClass(1)}`}
            >
              <Target size={17} />
            </div>
            <span
              className={`text-xs font-black ${
                isDark ? "text-white" : "text-foreground"
              }`}
            >
              إنشاء خطة دراسية
            </span>
          </div>
          <p
            className={`text-[11px] leading-relaxed ${
              isDark ? "text-white/70" : "text-muted-foreground"
            }`}
          >
            تقسيم الدرس إلى محاور تفاعلية مع شريط تقدم يتابع مدى استيعابك خطوة
            بخطوة.
          </p>
        </button>

        {/* Option 2: Balanced Summary */}
        <button
          type="button"
          onClick={() => onSelectOption("summary")}
          className={`flex flex-col justify-between rounded-2xl border p-4 text-right transition-all duration-300 hover:-translate-y-1 active:scale-95 cursor-pointer shadow-md ${getCard2Style()}`}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-transform duration-300 ${getIconBadgeClass(2)}`}
            >
              <FileText size={17} />
            </div>
            <span
              className={`text-xs font-black ${
                isDark ? "text-white" : "text-foreground"
              }`}
            >
              إنشاء تلخيص
            </span>
          </div>
          <p
            className={`text-[11px] leading-relaxed ${
              isDark ? "text-white/70" : "text-muted-foreground"
            }`}
          >
            تلخيص مركز وشامل لأهم القواعد والفوائد والأدلة الشرعية.
          </p>
        </button>

        {/* Option 3: Direct Discussion */}
        <button
          type="button"
          onClick={() => onSelectOption("chat")}
          className={`flex flex-col justify-between rounded-2xl border p-4 text-right transition-all duration-300 hover:-translate-y-1 active:scale-95 cursor-pointer shadow-md ${getCard3Style()}`}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-transform duration-300 ${getIconBadgeClass(3)}`}
            >
              <MessageSquare size={17} />
            </div>
            <span
              className={`text-xs font-black ${
                isDark ? "text-white" : "text-foreground"
              }`}
            >
              تحاور واستفسارات
            </span>
          </div>
          <p
            className={`text-[11px] leading-relaxed ${
              isDark ? "text-white/70" : "text-muted-foreground"
            }`}
          >
            افتح باب النقاش المباشر واسأل زاد عن أي مسألة تشغل بالك في النص.
          </p>
        </button>
      </div>
    </motion.div>
  )
}
