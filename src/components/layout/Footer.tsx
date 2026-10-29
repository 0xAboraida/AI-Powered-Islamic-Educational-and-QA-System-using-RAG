import { useTheme } from '../../contexts/ThemeContext'
import whiteLogo from '@/assets/images/WhiteLogo.webp'
import darkLogo from '@/assets/images/ZadDarkLogo.webp'

const columns = [
  {
    title: 'التطبيق',
    links: [
      { label: 'المميزات', href: '#features' },
      { label: 'اللقطات', href: '#features' },
      { label: 'التحميل', href: '#download' },
    ],
  },
  {
    title: 'الشركة',
    links: [
      { label: 'من نحن', href: '#' },
      { label: 'المدوّنة', href: '#' },
      { label: 'الوظائف', href: '#' },
      { label: 'تواصل معنا', href: '#' },
    ],
  },
  {
    title: 'الدعم',
    links: [
      { label: 'الأسئلة الشائعة', href: '#' },
      { label: 'سياسة الخصوصية', href: '#' },
      { label: 'شروط الاستخدام', href: '#' },
    ],
  },
]

export default function Footer() {
  const { accentColor, isDark } = useTheme()

  const getThemeStyles = () => {
    if (isDark) {
      switch (accentColor) {
        case 'emerald':
          return {
            footerBg: 'bg-[#041614]',
            border: 'border-teal-500/20',
            topLine: 'from-transparent via-teal-400/50 to-transparent',
            topGlow: 'rgba(20, 184, 166, 0.12)',
            zadWord: 'bg-gradient-to-l from-[#5eead4] via-[#14b8a6] to-[#0f766e] bg-clip-text text-transparent font-black drop-shadow-[0_2px_10px_rgba(20,184,166,0.35)]',
            heading: 'text-teal-200',
            desc: 'text-teal-100/70',
            link: 'text-teal-200/60 hover:text-teal-300',
            divider: 'border-teal-500/15',
            copyright: 'text-teal-200/40',
          }
        case 'amber':
          return {
            footerBg: 'bg-[#140e06]',
            border: 'border-[#dfbf83]/20',
            topLine: 'from-transparent via-[#dfbf83]/50 to-transparent',
            topGlow: 'rgba(223, 191, 131, 0.12)',
            zadWord: 'bg-gradient-to-l from-[#f5ecd5] via-[#dfbf83] to-[#8e682d] bg-clip-text text-transparent font-black drop-shadow-[0_2px_10px_rgba(223,191,131,0.35)]',
            heading: 'text-[#edd8ae]',
            desc: 'text-[#f5ecd5]/70',
            link: 'text-[#edd8ae]/60 hover:text-[#dfbf83]',
            divider: 'border-[#dfbf83]/15',
            copyright: 'text-[#edd8ae]/40',
          }
        case 'blue':
          return {
            footerBg: 'bg-[#050f1f]',
            border: 'border-blue-500/20',
            topLine: 'from-transparent via-blue-400/50 to-transparent',
            topGlow: 'rgba(59, 130, 246, 0.12)',
            zadWord: 'bg-gradient-to-l from-[#93c5fd] via-[#3b82f6] to-[#1d4ed8] bg-clip-text text-transparent font-black drop-shadow-[0_2px_10px_rgba(59,130,246,0.35)]',
            heading: 'text-blue-200',
            desc: 'text-blue-100/70',
            link: 'text-blue-200/60 hover:text-blue-300',
            divider: 'border-blue-500/15',
            copyright: 'text-blue-200/40',
          }
        case 'purple':
        default:
          return {
            footerBg: 'bg-[#130722]',
            border: 'border-purple-500/20',
            topLine: 'from-transparent via-purple-400/50 to-transparent',
            topGlow: 'rgba(168, 85, 247, 0.12)',
            zadWord: 'bg-gradient-to-l from-[#c084fc] via-[#9d32ec] to-[#801bcc] bg-clip-text text-transparent font-black drop-shadow-[0_2px_10px_rgba(157,50,236,0.4)]',
            heading: 'text-purple-200',
            desc: 'text-purple-100/70',
            link: 'text-purple-200/60 hover:text-purple-300',
            divider: 'border-purple-500/15',
            copyright: 'text-purple-200/40',
          }
      }
    } else {
      // Light mode
      switch (accentColor) {
        case 'emerald':
          return {
            footerBg: 'bg-[#eefaf7]',
            border: 'border-teal-200/80',
            topLine: 'from-transparent via-teal-500/40 to-transparent',
            topGlow: 'rgba(13, 148, 136, 0.08)',
            zadWord: 'bg-gradient-to-l from-[#0f766e] via-[#0d9488] to-[#134e4a] bg-clip-text text-transparent font-black',
            heading: 'text-teal-950',
            desc: 'text-teal-900/70',
            link: 'text-teal-900/65 hover:text-teal-700',
            divider: 'border-teal-200/80',
            copyright: 'text-teal-900/50',
          }
        case 'amber':
          return {
            footerBg: 'bg-[#faf5eb]',
            border: 'border-[#ebd9b5]',
            topLine: 'from-transparent via-[#b88d46]/40 to-transparent',
            topGlow: 'rgba(184, 141, 70, 0.08)',
            zadWord: 'bg-gradient-to-l from-[#8a652a] via-[#b88d46] to-[#5e431a] bg-clip-text text-transparent font-black',
            heading: 'text-[#38260f]',
            desc: 'text-[#5e431a]/75',
            link: 'text-[#5e431a]/70 hover:text-[#8a652a]',
            divider: 'border-[#ebd9b5]',
            copyright: 'text-[#5e431a]/50',
          }
        case 'blue':
          return {
            footerBg: 'bg-[#f0f6ff]',
            border: 'border-blue-200/80',
            topLine: 'from-transparent via-blue-500/40 to-transparent',
            topGlow: 'rgba(37, 99, 235, 0.08)',
            zadWord: 'bg-gradient-to-l from-[#1d4ed8] via-[#2563eb] to-[#1e3a8a] bg-clip-text text-transparent font-black',
            heading: 'text-blue-950',
            desc: 'text-blue-900/70',
            link: 'text-blue-900/65 hover:text-blue-700',
            divider: 'border-blue-200/80',
            copyright: 'text-blue-900/50',
          }
        case 'purple':
        default:
          return {
            footerBg: 'bg-[#faf6fd]',
            border: 'border-purple-200/80',
            topLine: 'from-transparent via-purple-500/40 to-transparent',
            topGlow: 'rgba(147, 51, 234, 0.08)',
            zadWord: 'bg-gradient-to-l from-[#7b1fa2] via-[#8e24aa] to-[#5e1482] bg-clip-text text-transparent font-black',
            heading: 'text-purple-950',
            desc: 'text-purple-900/70',
            link: 'text-purple-900/65 hover:text-purple-700',
            divider: 'border-purple-200/80',
            copyright: 'text-purple-900/50',
          }
      }
    }
  }

  const s = getThemeStyles()

  const renderBrandLogo = () => {
    if (accentColor === 'purple') {
      return (
        <img
          src={isDark ? whiteLogo : darkLogo}
          alt="شعار زاد"
          className="h-9 w-9 shrink-0 object-contain drop-shadow-[0_2px_10px_rgba(157,50,236,0.35)]"
        />
      )
    }

    const shadowClass = isDark
      ? accentColor === 'blue'
        ? 'drop-shadow-[0_2px_10px_rgba(37,99,235,0.4)]'
        : accentColor === 'emerald'
        ? 'drop-shadow-[0_2px_10px_rgba(20,184,166,0.4)]'
        : 'drop-shadow-[0_2px_10px_rgba(223,191,131,0.4)]'
      : accentColor === 'blue'
      ? 'drop-shadow-[0_2px_8px_rgba(2,132,199,0.3)]'
      : accentColor === 'emerald'
      ? 'drop-shadow-[0_2px_8px_rgba(13,148,136,0.3)]'
      : 'drop-shadow-[0_2px_8px_rgba(184,141,70,0.3)]'

    const gradientClass = isDark
      ? accentColor === 'emerald'
        ? 'bg-gradient-to-b from-[#5eead4] via-[#14b8a6] to-[#0f766e]'
        : accentColor === 'amber'
        ? 'bg-gradient-to-b from-[#f5ecd5] via-[#dfbf83] to-[#8e682d]'
        : 'bg-gradient-to-b from-[#38bdf8] via-[#2563eb] to-[#1e40af]'
      : accentColor === 'emerald'
      ? 'bg-gradient-to-b from-[#14b8a6] via-[#0d9488] to-[#134e4a]'
      : accentColor === 'amber'
      ? 'bg-gradient-to-b from-[#dfbf83] via-[#b88d46] to-[#5e431a]'
      : 'bg-gradient-to-b from-[#0284c7] via-[#1d4ed8] to-[#1e3a8a]'

    return (
      <div
        aria-hidden="true"
        className={`h-9 w-9 shrink-0 transition-all duration-300 ${shadowClass} ${gradientClass}`}
        style={{
          WebkitMaskImage: `url(${whiteLogo})`,
          maskImage: `url(${whiteLogo})`,
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
        }}
      />
    )
  }

  return (
    <footer className={`relative z-20 overflow-hidden border-t px-5 py-14 transition-colors duration-300 ${s.footerBg} ${s.border}`}>
      {/* Top subtle highlight gradient line */}
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r ${s.topLine}`} />

      {/* Top ambient radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-3/4 max-w-3xl rounded-full blur-3xl"
        style={{ background: s.topGlow }}
      />

      <div className="relative z-10 mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            {renderBrandLogo()}
            <span className={`font-display text-2xl ${s.zadWord}`}>زاد</span>
          </div>
          <p className={`mt-4 max-w-xs leading-relaxed text-sm ${s.desc}`}>
            رفيقٌ ذكيّ في طلب العلم الشرعي، يجيب أسئلتك بمصادر موثوقة.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h3 className={`font-display text-lg font-bold ${s.heading}`}>{col.title}</h3>
            <ul className="mt-4 space-y-3">
              {col.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className={`inline-block text-sm transition-colors duration-200 ${s.link}`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className={`relative z-10 mx-auto mt-12 max-w-6xl border-t pt-6 text-center text-sm transition-colors duration-300 ${s.divider} ${s.copyright}`}>
        © ٢٠٢٦ زاد. جميع الحقوق محفوظة.
      </div>
    </footer>
  )
}
