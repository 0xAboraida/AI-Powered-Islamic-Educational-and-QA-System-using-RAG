import StoreBadges from '../ui/StoreBadges'
import whiteLogo from '@/assets/images/WhiteLogo.png'

export default function CTA({ onTryChat }: { onTryChat: () => void }) {
  return (
    <section id="download" className="px-5 pb-24">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] brand-gradient px-6 py-16 text-center md:px-16 md:py-20">
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-64 w-64 rounded-full bg-brand-blue/40 blur-[110px]" />

        <div className="relative">
          <img src={whiteLogo} alt="شعار زاد" className="mx-auto h-16 w-16 object-contain" />
          <h2 className="mt-6 font-display text-4xl text-white md:text-5xl">
            ابدأ رحلتك مع زاد اليوم
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/85">
            استخدم المنصّة مجانًا واجعل طلب العلم الشرعي في متناول يدك أينما كنت.
          </p>
          <div className="mt-8 flex flex-col items-center gap-5">
            <button
              type="button"
              onClick={onTryChat}
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-bold text-brand-deep shadow-xl shadow-black/25 transition-transform hover:-translate-y-0.5"
            >
              ✦ جرّب المساعد على الويب
            </button>
            <StoreBadges variant="light" />
          </div>
        </div>
      </div>
    </section>
  )
}
