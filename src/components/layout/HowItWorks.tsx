const steps = [
  {
    n: '١',
    title: 'اختر المجال',
    body: 'حدّد مجال سؤالك — فقه، عقيدة، تفسير أو غيرها — أو دع زاد يكتشفه تلقائيًا.',
  },
  {
    n: '٢',
    title: 'اطرح سؤالك',
    body: 'اكتب سؤالك أو اضغط على زرّ الميكروفون وتحدّث بصوتك مباشرةً.',
  },
  {
    n: '٣',
    title: 'استلم إجابةً موثّقة',
    body: 'يجيبك زاد بإجابةٍ محكمة مع ذكر المصادر والأدلة في ثوانٍ معدودة.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how" className="relative overflow-hidden bg-[#2b0a4a] py-24 md:py-32">
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-brand-magenta">كيف يعمل</span>
          <h2 className="mt-3 font-display text-4xl text-white md:text-5xl">ثلاث خطوات فقط</h2>
        </div>

        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <li
              key={s.n}
              className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-sm"
            >
              <span className="brand-gradient-blue flex h-14 w-14 items-center justify-center rounded-2xl font-display text-2xl text-white">
                {s.n}
              </span>
              <h3 className="mt-6 font-display text-2xl text-white">{s.title}</h3>
              <p className="mt-3 leading-relaxed text-white/70">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
