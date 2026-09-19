import PhoneFrame from '../ui/PhoneFrame'
import lightVoice from '@/assets/images/photo_9_2026-08-02_07-43-16.jpg'
import login from '@/assets/images/photo_1_2026-08-02_08-57-37.jpg'
import categories from '@/assets/images/photo_13_2026-08-02_07-43-16.jpg'
import darkVoice from '@/assets/images/photo_8_2026-08-02_07-43-16.jpg'

const shots = [
  {
    src: lightVoice,
    alt: 'الشاشة الرئيسية لتطبيق زاد بالوضع النهاري',
    title: 'واجهة صافية',
    body: 'وضعٌ نهاري وليلي بتصميمٍ هادئ يريح العين أثناء طلب العلم.',
    offset: 'md:translate-y-8',
  },
  {
    src: categories,
    alt: 'اختيار مجال السؤال في تطبيق زاد',
    title: 'مجالات متخصّصة',
    body: 'اختر بين الفقه والعقيدة والسيرة وعلوم القرآن لإجابةٍ أدقّ.',
    offset: '',
  },
  {
    src: darkVoice,
    alt: 'الشاشة الرئيسية لتطبيق زاد بالوضع الليلي',
    title: 'وضعٌ ليلي أنيق',
    body: 'ألوانٌ داكنة هادئة للمذاكرة الليلية دون إجهادٍ للنظر.',
    offset: '',
  },
  {
    src: login,
    alt: 'شاشة تسجيل الدخول في تطبيق زاد',
    title: 'دخولٌ سهل',
    body: 'سجّل عبر البريد أو حسابك في آبل وجوجل في خطوةٍ واحدة.',
    offset: 'md:translate-y-8',
  },
]

export default function Showcase() {
  return (
    <section id="showcase" className="mx-auto max-w-6xl px-5 py-24 md:py-32">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-sm font-semibold uppercase tracking-wider text-accent">لقطات من المنصّة</span>
        <h2 className="mt-3 font-display text-4xl text-foreground md:text-5xl">
          تصميمٌ يليق <span className="brand-text-gradient">بالعلم</span>
        </h2>
      </div>

      <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {shots.map((s) => (
          <figure key={s.title} className={`flex flex-col items-center text-center ${s.offset}`}>
            <PhoneFrame src={s.src} alt={s.alt} className="w-56" />
            <figcaption className="mt-6">
              <h3 className="font-display text-2xl text-foreground">{s.title}</h3>
              <p className="mt-2 max-w-xs text-muted-foreground">{s.body}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
