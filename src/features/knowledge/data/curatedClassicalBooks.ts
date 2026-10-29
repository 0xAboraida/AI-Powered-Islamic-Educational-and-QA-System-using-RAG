export interface FeaturedClassicalBook {
  id: number;
  title: string;
  author: string;
  authorDeath: string;
  category: 'الحديث' | 'التفسير' | 'العقيدة' | 'الفقه' | 'السيرة' | 'الرقائق' | 'اللغة';
  categoryLabel: string;
  coverUrl: string;
  description: string;
  turathQuery?: string;
  colorScheme: {
    badgeBg: string;
    badgeText: string;
    border: string;
  };
}

export const FEATURED_CLASSICAL_BOOKS: FeaturedClassicalBook[] = [
  // 1. الحديث النبوي وعلومه
  {
    id: 735,
    title: 'صحيح البخاري',
    author: 'الإمام البخاري',
    authorDeath: 'ت 256 هـ',
    category: 'الحديث',
    categoryLabel: 'الحديث الشريف',
    coverUrl: '/covers/bukhari.jpg',
    description: 'أصح كتاب بعد كتاب الله، الجامع المسند الصحيح المختصر من أمور رسول الله ﷺ وسننه وأيامه.',
    turathQuery: 'صحيح البخاري',
    colorScheme: {
      badgeBg: 'bg-blue-500/10 dark:bg-blue-500/20',
      badgeText: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-500/30'
    }
  },
  {
    id: 1727,
    title: 'صحيح مسلم',
    author: 'الإمام مسلم بن الحجاج',
    authorDeath: 'ت 261 هـ',
    category: 'الحديث',
    categoryLabel: 'الحديث الشريف',
    coverUrl: '/covers/muslim.jpg',
    description: 'المسند الصحيح المختصر بنقل العدل عن العدل إلى رسول الله ﷺ.',
    turathQuery: 'صحيح مسلم',
    colorScheme: {
      badgeBg: 'bg-blue-500/10 dark:bg-blue-500/20',
      badgeText: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-500/30'
    }
  },
  {
    id: 1673,
    title: 'فتح الباري شرح صحيح البخاري',
    author: 'ابن حجر العسقلاني',
    authorDeath: 'ت 852 هـ',
    category: 'الحديث',
    categoryLabel: 'شروح الحديث',
    coverUrl: '/covers/fath_bari.jpg',
    description: 'أعظم شروح صحيح البخاري وأجمعها، عمدة المحدثين والفقهاء.',
    turathQuery: 'فتح الباري',
    colorScheme: {
      badgeBg: 'bg-blue-500/10 dark:bg-blue-500/20',
      badgeText: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-500/30'
    }
  },
  {
    id: 22870,
    title: 'مقدمة ابن الصلاح',
    author: 'ابن الصلاح الشهرزوري',
    authorDeath: 'ت 643 هـ',
    category: 'الحديث',
    categoryLabel: 'علوم الحديث',
    coverUrl: '/covers/muqaddimah_ibnsalah.jpg',
    description: 'معرفة أنواع علم الحديث، الأصل والمرجع الأهم في مصطلح وقواعد المحدثين.',
    turathQuery: 'ابن الصلاح',
    colorScheme: {
      badgeBg: 'bg-blue-500/10 dark:bg-blue-500/20',
      badgeText: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-500/30'
    }
  },

  // 2. علوم القرآن والتفسير
  {
    id: 8473,
    title: 'تفسير القرآن العظيم',
    author: 'الحافظ ابن كثير',
    authorDeath: 'ت 774 هـ',
    category: 'التفسير',
    categoryLabel: 'التفسير بالمأثور',
    coverUrl: '/covers/tafsir_ibnkathir.jpg',
    description: 'أشهر تفاسير القرآن بالمأثور، جمع بين الآثار النبوية وأقوال الصحابة والتابعين واللغة.',
    turathQuery: 'تفسير ابن كثير',
    colorScheme: {
      badgeBg: 'bg-amber-500/10 dark:bg-amber-500/20',
      badgeText: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-500/30'
    }
  },
  {
    id: 42,
    title: 'تيسير الكريم الرحمن (تفسير السعدي)',
    author: 'عبد الرحمن السعدي',
    authorDeath: 'ت 1376 هـ',
    category: 'التفسير',
    categoryLabel: 'التفسير المعاصر',
    coverUrl: '/covers/tafsir_saadi.jpg',
    description: 'تفسير ميسر وسهل العبارة، اعتنى ببيان المعنى الإجمالي والمقاصد والأحكام.',
    turathQuery: 'تفسير السعدي',
    colorScheme: {
      badgeBg: 'bg-amber-500/10 dark:bg-amber-500/20',
      badgeText: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-500/30'
    }
  },
  {
    id: 11728,
    title: 'الإتقان في علوم القرآن',
    author: 'جلال الدين السيوطي',
    authorDeath: 'ت 911 هـ',
    category: 'التفسير',
    categoryLabel: 'علوم القرآن',
    coverUrl: '/covers/itqan.jpg',
    description: 'الموسوعة الكبرى لعلوم التنزيل، أسباب النزول، القراءات، الناسخ والمنسوخ، والإعجاز.',
    turathQuery: 'الإتقان في علوم القرآن',
    colorScheme: {
      badgeBg: 'bg-amber-500/10 dark:bg-amber-500/20',
      badgeText: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-500/30'
    }
  },

  // 3. العقيدة والتوحيد
  {
    id: 18098,
    title: 'العقيدة الواسطية',
    author: 'شيخ الإسلام ابن تيمية',
    authorDeath: 'ت 728 هـ',
    category: 'العقيدة',
    categoryLabel: 'العقيدة والتوحيد',
    coverUrl: '/covers/wasitiya.jpg',
    description: 'خلاصة عقيدة أهل السنة والجماعة في أسماء الله وصفاته واليوم الآخر والإيمان.',
    turathQuery: 'العقيدة الواسطية',
    colorScheme: {
      badgeBg: 'bg-rose-500/10 dark:bg-rose-500/20',
      badgeText: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-500/30'
    }
  },
  {
    id: 8352,
    title: 'شرح العقيدة الطحاوية',
    author: 'ابن أبي العز الحنفي',
    authorDeath: 'ت 792 هـ',
    category: 'العقيدة',
    categoryLabel: 'العقيدة والتوحيد',
    coverUrl: '/covers/tahawiya.jpg',
    description: 'الشرح المعتمد الأوسع لمتن الطحاوي، مقرر دراسي موثق لأصول الاعتقاد السلفي.',
    turathQuery: 'العقيدة الطحاوية',
    colorScheme: {
      badgeBg: 'bg-rose-500/10 dark:bg-rose-500/20',
      badgeText: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-500/30'
    }
  },
  {
    id: 11318,
    title: 'كتاب التوحيد',
    author: 'محمد بن عبد الوهاب',
    authorDeath: 'ت 1206 هـ',
    category: 'العقيدة',
    categoryLabel: 'العقيدة والتوحيد',
    coverUrl: '/covers/tawhid.jpg',
    description: 'كتاب التوحيد الذي هو حق الله على العبيد، بيان أدلة إفراد الله بالعبادة والتحذير من الشرك.',
    turathQuery: 'كتاب التوحيد',
    colorScheme: {
      badgeBg: 'bg-rose-500/10 dark:bg-rose-500/20',
      badgeText: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-500/30'
    }
  },

  // 4. الفقه العام والمقارن وأصول الفقه
  {
    id: 7289,
    title: 'مجموع الفتاوى',
    author: 'شيخ الإسلام ابن تيمية',
    authorDeath: 'ت 728 هـ',
    category: 'الفقه',
    categoryLabel: 'الفتاوى والأحكام',
    coverUrl: '/covers/fatawa.jpg',
    description: 'الموسوعة الكبرى الشاملة للفقه، العقيدة، الحديث، التفسير، والسلوك في 37 مجلداً.',
    turathQuery: 'مجموع الفتاوى',
    colorScheme: {
      badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      badgeText: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-500/30'
    }
  },
  {
    id: 1699,
    title: 'الموطأ',
    author: 'الإمام مالك بن أنس',
    authorDeath: 'ت 179 هـ',
    category: 'الفقه',
    categoryLabel: 'الحديث والفقه',
    coverUrl: '/covers/muwatta.jpg',
    description: 'أقدم مدونة فقهية حديثية وصلتنا، أثنى عليه الشافعي فقال: ما على ظهر الأرض كتاب بعد كتاب الله أصح منه.',
    turathQuery: 'الموطأ',
    colorScheme: {
      badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      badgeText: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-500/30'
    }
  },
  {
    id: 1655,
    title: 'الأم',
    author: 'الإمام الشافعي',
    authorDeath: 'ت 204 هـ',
    category: 'الفقه',
    categoryLabel: 'الفقه المقارن',
    coverUrl: '/covers/umm.jpg',
    description: 'عمدة المذهب الشافعي في الفقه والأدلة، تحرير وتأصيل لقواعد الفقه المقارن ومناظرات الأئمة.',
    turathQuery: 'الأم للشافعي',
    colorScheme: {
      badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      badgeText: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-500/30'
    }
  },
  {
    id: 6910,
    title: 'المغني في الفقه',
    author: 'موفق الدين ابن قدامة',
    authorDeath: 'ت 620 هـ',
    category: 'الفقه',
    categoryLabel: 'الفقه المقارن',
    coverUrl: '/covers/mughni.jpg',
    description: 'درة الفقه الإسلامي المقارن، جمع فيه أدلة المذاهب الأربعة مع الترجيح الرصين.',
    turathQuery: 'المغني',
    colorScheme: {
      badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      badgeText: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-500/30'
    }
  },
  {
    id: 11315,
    title: 'عمدة الفقه',
    author: 'موفق الدين ابن قدامة',
    authorDeath: 'ت 620 هـ',
    category: 'الفقه',
    categoryLabel: 'المتون الفقهية',
    coverUrl: '/covers/umdat_fiqh.jpg',
    description: 'متن تأسيسي جامع لأبواب الفقه، مبني على قول واحد راجح للمبتدئين وطلاب العلم.',
    turathQuery: 'عمدة الفقه',
    colorScheme: {
      badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      badgeText: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-500/30'
    }
  },
  {
    id: 8180,
    title: 'الرسالة',
    author: 'الإمام الشافعي',
    authorDeath: 'ت 204 هـ',
    category: 'الفقه',
    categoryLabel: 'أصول الفقه',
    coverUrl: '/covers/risalah.jpg',
    description: 'أول كتاب صُنّف في أصول الفقه وقواعد الاستنباط وحجية الإجماع والقياس وخبر الآحاد.',
    turathQuery: 'الرسالة الشافعي',
    colorScheme: {
      badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      badgeText: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-500/30'
    }
  },

  // 5. السيرة النبوية والتاريخ والتراجم
  {
    id: 197,
    title: 'زاد المعاد في هدي خير العباد',
    author: 'ابن قيم الجوزية',
    authorDeath: 'ت 751 هـ',
    category: 'السيرة',
    categoryLabel: 'السيرة والفقه',
    coverUrl: '/covers/zad_maad.jpg',
    description: 'فريد دهره في الجمع بين وقائع السيرة النبوية والفقه المستنبط منها في العبادات والمعاملات والطب.',
    turathQuery: 'زاد المعاد',
    colorScheme: {
      badgeBg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
      badgeText: 'text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-500/30'
    }
  },
  {
    id: 23833,
    title: 'السيرة النبوية لابن هشام',
    author: 'ابن هشام الحميري',
    authorDeath: 'ت 218 هـ',
    category: 'السيرة',
    categoryLabel: 'السيرة النبوية',
    coverUrl: '/covers/seerah_ibnhisham.jpg',
    description: 'أوثق وأشهر كتب السيرة نقلاً عن ابن إسحاق، سجل كامل لمغازي النبي ﷺ وبعثته الشريفة.',
    turathQuery: 'السيرة النبوية',
    colorScheme: {
      badgeBg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
      badgeText: 'text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-500/30'
    }
  },
  {
    id: 4445,
    title: 'البداية والنهاية',
    author: 'الحافظ ابن كثير',
    authorDeath: 'ت 774 هـ',
    category: 'السيرة',
    categoryLabel: 'التاريخ الإسلامي',
    coverUrl: '/covers/bidayah_nihayah.jpg',
    description: 'موسوعة التاريخ الكبرى من بدء الخلق وقصص الأنبياء إلى أحداث التاريخ الإسلامي وأشراط الساعة.',
    turathQuery: 'البداية والنهاية',
    colorScheme: {
      badgeBg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
      badgeText: 'text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-500/30'
    }
  },
  {
    id: 10906,
    title: 'سير أعلام النبلاء',
    author: 'الحافظ شمس الدين الذهبي',
    authorDeath: 'ت 748 هـ',
    category: 'السيرة',
    categoryLabel: 'التراجم والطبقات',
    coverUrl: '/covers/siyar_nobala.jpg',
    description: 'المرجع الأكبر في تراجم الصحابة والتابعين والعلماء والأمراء والقراء عبر القرون الإسلامية.',
    turathQuery: 'سير أعلام النبلاء',
    colorScheme: {
      badgeBg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
      badgeText: 'text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-500/30'
    }
  },

  // 6. الرقائق وتزكية النفس والآداب
  {
    id: 2348,
    title: 'رياض الصالحين',
    author: 'الإمام يحيى بن شرف النووي',
    authorDeath: 'ت 676 هـ',
    category: 'الرقائق',
    categoryLabel: 'الرقائق والآداب',
    coverUrl: '/covers/riyad_salihin.jpg',
    description: 'من أوسع كتب الحديث انتشاراً في العالم الإسلامي، جمع أحاديث الأخلاق والآداب والعبادات.',
    turathQuery: 'رياض الصالحين',
    colorScheme: {
      badgeBg: 'bg-teal-500/10 dark:bg-teal-500/20',
      badgeText: 'text-teal-700 dark:text-teal-300',
      border: 'border-teal-500/30'
    }
  },
  {
    id: 199,
    title: 'مدارج السالكين',
    author: 'ابن قيم الجوزية',
    authorDeath: 'ت 751 هـ',
    category: 'الرقائق',
    categoryLabel: 'تزكية النفس والسلوك',
    coverUrl: '/covers/madarij_salikin.jpg',
    description: 'بين منازل إياك نعبد وإياك نستعين، شرح منازل السائرين وتفصيل منازل الإخلاص واليقين والمحبة.',
    turathQuery: 'مدارج السالكين',
    colorScheme: {
      badgeBg: 'bg-teal-500/10 dark:bg-teal-500/20',
      badgeText: 'text-teal-700 dark:text-teal-300',
      border: 'border-teal-500/30'
    }
  },
  {
    id: 949,
    title: 'جامع العلوم والحكم',
    author: 'ابن رجب الحنبلي',
    authorDeath: 'ت 795 هـ',
    category: 'الرقائق',
    categoryLabel: 'شروح الحديث والآداب',
    coverUrl: '/covers/jami_ulum_hikam.jpg',
    description: 'شرح خمسين حديثاً من جوامع كلم النبي ﷺ، من أنفس وأعمق كتب شروح الحديث حكماً وفقهاً.',
    turathQuery: 'جامع العلوم والحكم',
    colorScheme: {
      badgeBg: 'bg-teal-500/10 dark:bg-teal-500/20',
      badgeText: 'text-teal-700 dark:text-teal-300',
      border: 'border-teal-500/30'
    }
  },

  // 7. اللغة العربية والمعاجم والنحو
  {
    id: 1687,
    title: 'لسان العرب',
    author: 'ابن منظور الإفريقي',
    authorDeath: 'ت 711 هـ',
    category: 'اللغة',
    categoryLabel: 'المعاجم واللغة',
    coverUrl: '/covers/lisan_arab.jpg',
    description: 'أشمل وأضخم معجم لغوي في تاريخ العربية، استقصى مفردات لغة الضاد وشواهدها القرآنية والشعرية.',
    turathQuery: 'لسان العرب',
    colorScheme: {
      badgeBg: 'bg-violet-500/10 dark:bg-violet-500/20',
      badgeText: 'text-violet-700 dark:text-violet-300',
      border: 'border-violet-500/30'
    }
  },
  {
    id: 6970,
    title: 'قطر الندى وبل الصدى',
    author: 'ابن هشام الأنصاري',
    authorDeath: 'ت 761 هـ',
    category: 'اللغة',
    categoryLabel: 'النحو وقواعد الإعراب',
    coverUrl: '/covers/qatr_nada.jpg',
    description: 'المتن والمدخل الأساسي لضبط قواعد الإعراب والنحو العربي بدقة وإيجاز.',
    turathQuery: 'قطر الندى',
    colorScheme: {
      badgeBg: 'bg-violet-500/10 dark:bg-violet-500/20',
      badgeText: 'text-violet-700 dark:text-violet-300',
      border: 'border-violet-500/30'
    }
  }
];

export const CLASSICAL_CATEGORIES_TABS = [
  { key: 'all', label: 'الكل' },
  { key: 'الحديث', label: 'الحديث' },
  { key: 'التفسير', label: 'التفسير' },
  { key: 'العقيدة', label: 'العقيدة' },
  { key: 'الفقه', label: 'الفقه والأصول' },
  { key: 'السيرة', label: 'السيرة والتاريخ' },
  { key: 'الرقائق', label: 'الرقائق والآداب' },
  { key: 'اللغة', label: 'المعاجم واللغة' },
] as const;
