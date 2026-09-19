import whiteLogo from '@/assets/images/WhiteLogo.png'

const columns = [
  {
    title: 'التطبيق',
    links: ['المميزات', 'كيف يعمل', 'اللقطات', 'التحميل'],
  },
  {
    title: 'الشركة',
    links: ['من نحن', 'المدوّنة', 'الوظائف', 'تواصل معنا'],
  },
  {
    title: 'الدعم',
    links: ['الأسئلة الشائعة', 'سياسة الخصوصية', 'شروط الاستخدام'],
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#1c0b2e] px-5 py-14 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <img src={whiteLogo} alt="شعار زاد" className="h-9 w-9 object-contain" />
            <span className="font-display text-2xl">زاد</span>
          </div>
          <p className="mt-4 max-w-xs leading-relaxed text-white/60">
            رفيقٌ ذكيّ في طلب العلم الشرعي، يجيب أسئلتك بمصادر موثوقة.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="font-display text-lg">{col.title}</h3>
            <ul className="mt-4 space-y-3">
              {col.links.map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-white/60 transition-colors hover:text-white">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-12 max-w-6xl border-t border-white/10 pt-6 text-center text-sm text-white/50">
        © ٢٠٢٦ زاد. جميع الحقوق محفوظة.
      </div>
    </footer>
  )
}
