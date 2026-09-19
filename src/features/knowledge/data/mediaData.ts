import { Sheikh, MediaPlaylist, MediaStandalone, Course } from '../types/mediaTypes';

export const INITIAL_SHEIKHS: Sheikh[] = [
  {
    id: 'sheikh-alaa-hamed',
    name: 'الشيخ علاء حامد',
    title: 'داعية ومحاضر شرعي',
    avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
    specialty: 'الفقه الميسر، التزكية، والتأصيل الشرعي للمبتدئين',
    bio: 'مهتم بتبسيط المعارف والعلوم الشرعية وتيسير الفقه وتزكية النفوس بلغة سهلة ومباشرة توافق مختلف فئات الدارسين.',
    stats: {
      authored_books_count: 3, // عدد الكتب التي ألفها الشيخ في المكتبة
      total_audio_playlists: 2,
      total_video_playlists: 4,
      total_audio_standalone: 8,
      total_video_standalone: 15,
    },
    socialLinks: {
      youtube: 'https://www.youtube.com/@alaa_hamed',
      telegram: 'https://t.me/alaahamed'
    }
  },
  {
    id: 'sheikh-othaymeen',
    name: 'الشيخ محمد بن صالح العثيمين',
    title: 'عالم وفقيه ومفسر (رحمه الله)',
    avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80',
    specialty: 'الفقه المقارن، العقيدة، أصول الفقه، والتفسير',
    bio: 'من كبار فقهاء العصر الحديث، تميز بأسلوبه التربوي الدقيق في تقريب القواعد الفقهية وشرح أمهات المتون.',
    stats: {
      authored_books_count: 52,
      total_audio_playlists: 18,
      total_video_playlists: 6,
      total_audio_standalone: 34,
      total_video_standalone: 12,
    }
  },
  {
    id: 'sheikh-fawzan',
    name: 'الشيخ د. صالح بن فوزان الفوزان',
    title: 'عضو هيئة كبار العلماء (حفظه الله)',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    specialty: 'العقيدة السلفية، الفقه الحنبلي، والفرائض',
    bio: 'عالم محقق صاحب التصانيف الشهيرة في الفقه والعقيدة كالملخص الفقهي وعقيدة التوحيد.',
    stats: {
      authored_books_count: 38,
      total_audio_playlists: 12,
      total_video_playlists: 8,
      total_audio_standalone: 20,
      total_video_standalone: 14,
    }
  },
  {
    id: 'sheikh-othman-khamis',
    name: 'الشيخ د. عثمان الخميس',
    title: 'عالم ومحاضر شرعي (حفظه الله)',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
    specialty: 'الحديث وعلومه، الفقه، والتاريخ الإسلامي',
    bio: 'محدث وفقيه له دروس واسعة في شرح عمدة الأحكام وصحيح مسلم ومسائل الاعتقاد والفقه الميسر.',
    stats: {
      authored_books_count: 14,
      total_audio_playlists: 9,
      total_video_playlists: 15,
      total_audio_standalone: 18,
      total_video_standalone: 26,
    }
  },
  {
    id: 'sheikh-said-kamali',
    name: 'الشيخ د. سعيد الكملي',
    title: 'فقيه ومحدث وأستاذ كرسي الإمام مالك',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    specialty: 'المذهب المالكي، الحديث، الأدب العربي واللغة',
    bio: 'اشتهر بمجالسه الحديثية والفقهية الرائعة وشرحه المستفيض لموطأ الإمام مالك ومقامات الحريري.',
    stats: {
      authored_books_count: 6,
      total_audio_playlists: 4,
      total_video_playlists: 11,
      total_audio_standalone: 15,
      total_video_standalone: 32,
    }
  }
];

export const INITIAL_PLAYLISTS: MediaPlaylist[] = [
  // 1. الشيخ علاء حامد - دورة الفقه الميسر
  {
    id: 'pl-alaa-fiqh-muyassar',
    sheikhId: 'sheikh-alaa-hamed',
    sheikhName: 'الشيخ علاء حامد',
    title: 'شرح كتاب الفقه الميسر في ضوء الكتاب والسنة',
    mediaType: 'video',
    category: 'فقه',
    coverImage: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
    playlistUrl: 'https://youtube.com/playlist?list=PL1i_D1Vw3d5P5Q6IHHW22JHrnLCwm60Bn&si=BTL06ewMiQm_nZUT',
    playlistId: 'PL1i_D1Vw3d5P5Q6IHHW22JHrnLCwm60Bn',
    totalEpisodes: 45,
    isCompleted: true,
    description: 'شرح منهجي مرئي متكامل وشامل لأبواب الطهارة والصلاة والزكاة والصوم والمعاملات بلغة واضحة وواقعية مع ربط المسائل بالأدلة وتطبيقاتها المعاصرة.',
    linkedBook: {
      bookTitle: 'الفقه الميسر في ضوء الكتاب والسنة',
      author: 'نخبة من العلماء'
    },
    episodes: [
      { number: 1, title: 'المقدمة: فضل طلب الفقه وكيفية دراسته', duration: '32:15' },
      { number: 2, title: 'كتاب الطهارة: أحكام المياه والنجاسات', duration: '41:10' },
      { number: 3, title: 'صفة الوضوء ونواقضه ومبطلاته', duration: '38:45' },
      { number: 4, title: 'أحكام التيمم والمسح على الخفين', duration: '29:50' },
      { number: 5, title: 'كتاب الصلاة: شروطها وأركانها وواجباتها', duration: '45:12' },
      { number: 6, title: 'صفة صلاة النبي ﷺ خطوة بخطوة', duration: '50:30' },
    ]
  },
  {
    id: 'pl-alaa-tazkiyah-audio',
    sheikhId: 'sheikh-alaa-hamed',
    sheikhName: 'الشيخ علاء حامد',
    title: 'سلسلة إصلاح القلوب وتزكية النفس',
    mediaType: 'audio',
    category: 'تزكية وآداب',
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    playlistUrl: 'https://youtube.com/playlist?list=PL1i_D1Vw3d5P5Q6IHHW22JHrnLCwm60Bn',
    playlistId: 'PL1i_D1Vw3d5P5Q6IHHW22JHrnLCwm60Bn',
    totalEpisodes: 16,
    isCompleted: true,
    description: 'سلسلة صوتية في مداواة أمراض القلوب من الرياء والكبر والغل، وكيف ينمي المسلم إخلاصه وخشوعه.',
    linkedBook: {
      bookTitle: 'مختصر منهاج القاصدين',
      author: 'ابن قدامة المقدسي'
    }
  },
  // ابن عثيمين
  {
    id: 'pl-othaymeen-wasitiyya-audio',
    sheikhId: 'sheikh-othaymeen',
    sheikhName: 'الشيخ محمد بن صالح العثيمين',
    title: 'شرح العقيدة الواسطية لشيخ الإسلام ابن تيمية',
    mediaType: 'audio',
    category: 'عقيدة',
    coverImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
    playlistUrl: 'https://youtube.com/playlist?list=PLB5F522F55702F93C',
    playlistId: 'PLB5F522F55702F93C',
    totalEpisodes: 28,
    isCompleted: true,
    description: 'من أجمع وأقوى الشروح على الواسطية في تقرير منهج أهل السنة والجماعة في أسماء الله وصفاته.',
    linkedBook: {
      bookTitle: 'العقيدة الواسطية',
      author: 'ابن تيمية'
    }
  },
  {
    id: 'pl-othaymeen-zad-mustaqna-video',
    sheikhId: 'sheikh-othaymeen',
    sheikhName: 'الشيخ محمد بن صالح العثيمين',
    title: 'الشرح الممتع على زاد المستقنع',
    mediaType: 'video',
    category: 'فقه',
    coverImage: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80',
    playlistUrl: 'https://youtube.com/playlist?list=PLB5F522F55702F93C',
    playlistId: 'PLB5F522F55702F93C',
    totalEpisodes: 60,
    isCompleted: true,
    description: 'الموسوعة الفقهية الكبرى للشيخ العثيمين التي تجمع بين تحرير المذهب ومقارنة الأدلة.',
    linkedBook: {
      bookTitle: 'زاد المستقنع في اختصار المقنع',
      author: 'الحجاوي'
    }
  },
  // عثمان الخميس
  {
    id: 'pl-khamis-umdat-ahkam',
    sheikhId: 'sheikh-othman-khamis',
    sheikhName: 'الشيخ د. عثمان الخميس',
    title: 'شرح عمدة الأحكام من كلام خير الأنام',
    mediaType: 'video',
    category: 'حديث وفقه',
    coverImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80',
    playlistUrl: 'https://youtube.com/playlist?list=PL7fQp4P902wB9d6u0r6b_8vF9A8A1S2D3',
    playlistId: 'PL7fQp4P902wB9d6u0r6b_8vF9A8A1S2D3',
    totalEpisodes: 35,
    isCompleted: true,
    description: 'شرح فقهي حديثي ممتع لأحاديث الأحكام المتفق عليها بين البخاري ومسلم.',
    linkedBook: {
      bookTitle: 'عمدة الأحكام',
      author: 'عبد الغني المقدسي'
    }
  },
  // سعيد الكملي
  {
    id: 'pl-kamali-muwatta',
    sheikhId: 'sheikh-said-kamali',
    sheikhName: 'الشيخ د. سعيد الكملي',
    title: 'شرح موطأ الإمام مالك (رواية يحيى بن يحيى الليثي)',
    mediaType: 'video',
    category: 'حديث وفقه',
    coverImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    playlistUrl: 'https://youtube.com/playlist?list=PL7fQp4P902wB9d6u0r6b_8vF9A8A1S2D4',
    playlistId: 'PL7fQp4P902wB9d6u0r6b_8vF9A8A1S2D4',
    totalEpisodes: 120,
    isCompleted: false,
    description: 'مجالس علمية حديثية ثرية بالفوائد اللغوية والفقهية وإسناد الأئمة في موطأ دار الهجرة.',
    linkedBook: {
      bookTitle: 'الموطأ',
      author: 'الإمام مالك بن أنس'
    }
  }
];

export const INITIAL_STANDALONE: MediaStandalone[] = [
  {
    id: 'st-alaa-1',
    sheikhId: 'sheikh-alaa-hamed',
    sheikhName: 'الشيخ علاء حامد',
    title: 'كيف تبدأ دراسة الفقه الشرعي دون تشتت؟',
    mediaType: 'video',
    category: 'تأصيل ومنهجية',
    mediaUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    duration: '22:15',
    thumbnail: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
    linkedBook: { bookTitle: 'الفقه الميسر في ضوء الكتاب والسنة' }
  },
  {
    id: 'st-alaa-2',
    sheikhId: 'sheikh-alaa-hamed',
    sheikhName: 'الشيخ علاء حامد',
    title: 'أهم 10 قواعد في فقه المعاملات المالية المعاصرة',
    mediaType: 'audio',
    category: 'فقه المعاملات',
    mediaUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3',
    duration: '18:40',
    thumbnail: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'st-othaymeen-1',
    sheikhId: 'sheikh-othaymeen',
    sheikhName: 'الشيخ محمد بن صالح العثيمين',
    title: 'قواعد التفرقة بين الفرض والواجب والسنة',
    mediaType: 'audio',
    category: 'أصول فقه',
    mediaUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3',
    duration: '14:20'
  },
  {
    id: 'st-khamis-1',
    sheikhId: 'sheikh-othman-khamis',
    sheikhName: 'الشيخ د. عثمان الخميس',
    title: 'شرح حديث: (إنما الأعمال بالنيات) وفقه مقاصد المكلف',
    mediaType: 'video',
    category: 'شروح الحديث',
    mediaUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    duration: '27:50',
    linkedBook: { bookTitle: 'صحيح البخاري' }
  }
];

export const INITIAL_COURSES: Course[] = [
  {
    id: 'current-active-course-01',
    title: 'الدورة العلمية المنهجية الحالية',
    playlistUrl: 'https://youtube.com/playlist?list=PLRG850GgVGNY&si=x3SQe_20O7FPzX8j',
    playlistId: 'PLRG850GgVGNY',
    instructorName: 'نخبة من كبار العلماء والمشايخ',
    description: 'دورة علمية تفاعلية جارية تركز على التأصيل المتين والمدارسة الحية لأصول العلوم الإسلامية وفهم المتون المعتمدة مع اختبارات وتقييمات دورية.',
    thumbnail: 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    badgeLabel: 'دورة جارية الآن 🔴',
    level: 'متوسط',
    totalLessons: 24,
    enrolledCount: 385,
    isFeatured: true,
    targetBook: {
      bookTitle: 'جامع المتون والعلوم الشرعية',
      author: 'نخبة من أئمة التراث'
    },
    lessons: [
      { number: 1, title: 'الدرس الافتتاحي: معالم المنهجية وطريق التحصيل', duration: '45:00' },
      { number: 2, title: 'مدخل إلى علوم الشريعة ومصطلحات الفقهاء', duration: '52:10' },
      { number: 3, title: 'التطبيق العملي في استنباط الأحكام من نصوص الكتاب', duration: '48:30' },
      { number: 4, title: 'أصول فهم السنة النبوية وضوابط الرواية والدراية', duration: '55:15' },
      { number: 5, title: 'مذاهب الفقهاء: أسباب الاختلاف وثمرة الخلاف', duration: '50:00' },
    ]
  },
  {
    id: 'course-usul-tafseer',
    title: 'دورة مقدمة في أصول التفسير وقواعد التدبر',
    playlistUrl: 'https://youtube.com/playlist?list=PLRG850GgVGNY',
    playlistId: 'PLRG850GgVGNY',
    instructorName: 'الشيخ د. عبد الرحمن بن صالح المحمود',
    description: 'دراسة منهجية مركزة لكتاب مقدمة في أصول التفسير لشيخ الإسلام، مع ضبط قواعد التفسير بالمأثور وبالرأي المحمود.',
    thumbnail: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    badgeLabel: 'دورة فصلية نشطة 🟢',
    level: 'مبتدئ',
    totalLessons: 14,
    enrolledCount: 290,
    targetBook: {
      bookTitle: 'مقدمة في أصول التفسير',
      author: 'ابن تيمية'
    }
  },
  {
    id: 'course-mustalah-hadith',
    title: 'دورة علوم الحديث الشريف وضبط النخبة',
    playlistUrl: 'https://youtube.com/playlist?list=PLRG850GgVGNY',
    playlistId: 'PLRG850GgVGNY',
    instructorName: 'الشيخ عبد الله السعد',
    description: 'مسار دراسي متقدم في علل الحديث وتطبيق قواعد ابن حجر في نخبة الفكر مع تطبيقات تدريبية من مرويات الصحيحين.',
    thumbnail: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80',
    status: 'upcoming',
    badgeLabel: 'يبدأ التسجيل قريباً ⏳',
    level: 'متقدم',
    totalLessons: 18,
    enrolledCount: 150,
    targetBook: {
      bookTitle: 'نزهة النظر في توضيح نخبة الفكر',
      author: 'ابن حجر العسقلاني'
    }
  }
];
