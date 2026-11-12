import { Scholar, ExplanationSeries, VideoItem } from './mockData';
import { supabase } from '../../../services/supabaseClient';

// Built-in initial curated seed for 35 scholars (Clean respectful metadata with no stock photos)
const INITIAL_SCHOLARS_SEED: Scholar[] = [
  {
    id: 'scholar_yasser_borhamy',
    name: 'د. ياسر برهامي',
    bio: 'طبيب واستشاري أطفال، نائب رئيس مجلس إدارة الدعوة السلفية، فقيه وأصولي ومدرس للعقيدة والتفسير والحديث.',
    specialty: 'عقيدة وأصول فقه وحديث',
    avatar: '',
    youtubeUrl: 'https://www.youtube.com/@د.ياسر.برهامي',
    socialLinks: { telegram: 'https://t.me/anasalafyborhamy' }
  },
  {
    id: 'scholar_almoqaddem',
    name: 'د. محمد إسماعيل المقدم',
    bio: 'طبيب وداعية ومؤسس المدرسة السلفية بالإسكندرية، باحث موسوعي في الفكر والتربية وتاريخ الأمة.',
    specialty: 'فكر وتربية وعلوم القرآن',
    avatar: '',
    youtubeUrl: 'https://www.youtube.com/@almoqaddem',
  },
  {
    id: 'scholar_ahmed_hoteiba',
    name: 'د. أحمد حطيبة',
    bio: 'طبيب جراح ومحدث وفقيه، شارح الكتب الستة ورياض الصالحين ومفردات القرآن.',
    specialty: 'فقه وحديث وتفسير',
    avatar: '',
    youtubeUrl: 'https://www.youtube.com/@AhmedHoteiba',
  },
  {
    id: 'scholar_ahmed_farid',
    name: 'د. أحمد فريد',
    bio: 'طبيب وباحث شرعي ومؤلف بارز في التزكية والرقائق وسير السلف وأعلام النبلاء.',
    specialty: 'تزكية وسير وتاريخ إسلامي',
    avatar: '',
    youtubeUrl: 'https://www.youtube.com/@ahmedfarid',
  },
  {
    id: 'scholar_othaymeen',
    name: 'الشيخ محمد بن صالح العثيمين',
    bio: 'فقيه العصر، وعضو هيئة كبار العلماء، وأحد أبرز علماء المسلمين ومحققي الفقه والأصول في القرن الماضي.',
    specialty: 'فقه وأصول وتفسير وعقيدة',
    avatar: '',
    youtubeUrl: 'https://www.youtube.com/@binothaimeen',
  },
  {
    id: 'scholar_binbaz',
    name: 'الشيخ عبد العزيز بن باز',
    bio: 'مفتي عام المملكة العربية السعودية ورئيس هيئة كبار العلماء الأسبق، إمام أهل السنة في عصره.',
    specialty: 'عقيدة وحديث وفقه معاصر',
    avatar: '',
    youtubeUrl: 'https://www.youtube.com/@binbaz',
  },
  {
    id: 'scholar_fawzan',
    name: 'الشيخ صالح بن فوزان الفوزان',
    bio: 'عضو هيئة كبار العلماء وعضو اللجنة الدائمة للإفتاء، فقيه ومحقق كبير.',
    specialty: 'فقه وعقيدة وأصول',
    avatar: '',
    youtubeUrl: 'https://www.youtube.com/@alfawzannet',
  },
  {
    id: 'scholar_albadr',
    name: 'الشيخ عبد الرزاق بن عبد المحسن البدر',
    bio: 'أستاذ العقيدة بالجامعة الإسلامية والمدرس بالمسجد النبوي الشريف، صاحب الشروحات الإيمانية الرصينة.',
    specialty: 'عقيدة وآداب شرعية وأذكار',
    avatar: '',
    youtubeUrl: 'https://www.youtube.com/@al-badr',
  },
  {
    id: 'scholar_othmankhamees',
    name: 'الشيخ عثمان بن محمد الخميس',
    bio: 'عالم وداعية ومحقق شرعي معاصر، اشتهر ببحوثه في العقيدة والتاريخ ومقارنة المذاهب.',
    specialty: 'عقيدة وتاريخ ومناظرات',
    avatar: '',
    youtubeUrl: 'https://www.youtube.com/@othmanalkhamees',
  },
  {
    id: 'scholar_saidkamali',
    name: 'الشيخ سعيد بن محمد الكملي',
    bio: 'فقيه ومحدث مغربي، مدرس كرسي الإمام مالك بجامع السنة بالرباط وأستاذ الفقه والحديث.',
    specialty: 'فقه مالكي وحديث ولغة عربية',
    avatar: '',
    youtubeUrl: 'https://www.youtube.com/@saidkamali',
  },
  {
    id: 'scholar_khodair',
    name: 'الشيخ عبد الكريم بن عبد الله الخضير',
    bio: 'عضو هيئة كبار العلماء سابقاً، محدث وفقيه ومحقق للمتون وشروح الحديث الكبرى.',
    specialty: 'مصطلح حديث وتفسير وكتب السنة',
    avatar: '',
    youtubeUrl: 'https://www.youtube.com/@shkhudheir',
  },
  {
    id: 'scholar_amerbahgat',
    name: 'الشيخ عامر بن محمد بهجت',
    bio: 'أستاذ الفقه المشارك بجامعة طيبة، متخصص في التسهيل الفقهي وخرائط وبناء العلوم الشرعية.',
    specialty: 'فقه شافعي وخرائط ذهنية شرعية',
    avatar: '',
    youtubeUrl: 'https://www.youtube.com/@amerbahgat',
  },
  {
    id: 'scholar_abdelmoneim_shahat',
    name: 'م. عبد المنعم الشحات',
    bio: 'داعية وكاتب وباحث ومحاضر إسلامي معاصر، مهتم بالقضايا الفكرية ومناهج الدعوة.',
    specialty: 'فكر إسلامي ومناهج دعوة وعقيدة',
    avatar: '',
    youtubeUrl: 'https://www.youtube.com/@amshahat',
  },
  {
    id: 'scholar_alaa_bakr',
    name: 'د. علاء بكر',
    bio: 'طبيب وباحث وداعية إسلامي ومؤلف العديد من الكتب والرسائل في العقيدة والفرق المعاصرة.',
    specialty: 'عقيدة وفرق وأديان',
    avatar: '',
    youtubeUrl: '',
  },
  {
    id: 'scholar_abo_edrees',
    name: 'الشيخ محمد عبد الفتاح (أبو إدريس)',
    bio: 'من الرعيل الأول لدعاة الإسكندرية والعمل الإسلامي المعاصر، مربّ وخطيب معروف.',
    specialty: 'تربية ودعوة وسلوك',
    avatar: '',
    youtubeUrl: '',
  },
  {
    id: 'scholar_asqalany',
    name: 'د. محمود عبد الحميد العسقلاني',
    bio: 'طبيب وداعية ومحاضر إسلامي معروف بشروحاته العلمية والتربوية.',
    specialty: 'شريعة وتربية وأسرة مسلمة',
    avatar: '',
    youtubeUrl: '',
  },
  {
    id: 'scholar_younes_makhyoun',
    name: 'د. يونس مخيون',
    bio: 'طبيب وداعية إسلامي وخطيب وباحث في الشأن الشرعي والفكري.',
    specialty: 'دعوة وفكر إسلامي',
    avatar: '',
    youtubeUrl: '',
  },
  {
    id: 'scholar_adel_nasr',
    name: 'الشيخ عادل نصر',
    bio: 'داعية إسلامي وخطيب وباحث شرعي ومحاضر في العلوم الشرعية والتزكية.',
    specialty: 'فقه ودعوة وتزكية',
    avatar: '',
    youtubeUrl: '',
  },
  {
    id: 'scholar_ahmed_hamdy',
    name: 'الشيخ أحمد حمدي',
    bio: 'داعية إسلامي وباحث شرعي ومحاضر في الفقه والتزكية والتربية الإيمانية.',
    specialty: 'فقه وسلوك وتربية',
    avatar: '',
    youtubeUrl: '',
  },
  {
    id: 'scholar_alaa_hamed',
    name: 'الشيخ علاء حامد',
    bio: 'داعية إسلامي معاصر، اشتهر ببرامجه التربوية والمشروع الديني المبسط لملايين الشباب.',
    specialty: 'تربية وبناء إيماني ودعوة معاصرة',
    avatar: '',
    youtubeUrl: 'https://www.youtube.com/@alaa_hamed',
  },
  {
    id: 'scholar_alheweny',
    name: 'الشيخ أبو إسحاق الحويني',
    bio: 'محدث العصر وإمام علم الحديث والجرح والتعديل في العالم الإسلامي المعاصر.',
    specialty: 'علم الحديث ومصطلح وعلل الحديث',
    avatar: '',
    youtubeUrl: 'https://www.youtube.com/@alheweny',
  },
  {
    id: 'scholar_aladawy',
    name: 'الشيخ مصطفى العدوي',
    bio: 'فقيه ومحدث مصري، له مؤلفات وتحقيقات حديثية وفقهية وتفسيرية واسعة.',
    specialty: 'فقه وتفسير وحديث وأحكام',
    avatar: '',
    youtubeUrl: 'https://www.youtube.com/@aladawyofficial',
  },
  {
    id: 'scholar_mohamed_hassan',
    name: 'الشيخ محمد حسان',
    bio: 'داعية إسلامي مصري وخطيب مفوه، له حضور واسع في البرامج الدعوية والخطب الجماهيرية.',
    specialty: 'خطابة وسيرة ودعوة عامة',
    avatar: '',
    youtubeUrl: 'https://www.youtube.com/@mohamedhassan',
  },
  {
    id: 'scholar_yaqoub',
    name: 'الشيخ محمد حسين يعقوب',
    bio: 'داعية إسلامي مصري بارز في مجال التربية الإيمانية والرقائق والسلوك والقلبيات.',
    specialty: 'رقائق وأعمال قلوب وتزكية',
    avatar: '',
    youtubeUrl: 'https://www.youtube.com/@yaqoubofficial',
  },
  {
    id: 'scholar_haitham_talaat',
    name: 'د. هيثم طلعت',
    bio: 'طبيب وباحث متخصص في مقارنة الأديان والرد على الشبهات الفكرية والإلحاد المعاصر.',
    specialty: 'رد الشبهات ومقارنة أديان وفكر نقدي',
    avatar: '',
    youtubeUrl: 'https://www.youtube.com/@haithamtalaat',
  },
  {
    id: 'scholar_ahmed_alaraby',
    name: 'الشيخ أحمد العربي',
    bio: 'داعية إسلامي ومحاضر شرعي في العلوم الإسلامية والقرآنية والتربوية.',
    specialty: 'علوم شرعية وتربية إسلامية',
    avatar: '',
    youtubeUrl: 'https://www.youtube.com/@ahmedalaraby',
  },
  {
    id: 'scholar_ahmed_amer',
    name: 'الشيخ أحمد عامر',
    bio: 'داعية ومحاضر شرعي وقارئ للقرآن ومختص في علوم التجويد وأحكام التلاوة.',
    specialty: 'تجويد وقراءات وعلوم القرآن',
    avatar: '',
    youtubeUrl: 'https://www.youtube.com/@AhmedAmer',
  },
  {
    id: 'scholar_walid_alsaeedan',
    name: 'الشيخ وليد السعيدان',
    bio: 'فقيه وباحث ومحقق شرعي سعودي، اشتهر بتقرير القواعد الفقهية والأصولية والضوابط الشرعية.',
    specialty: 'قواعد فقهية وأصول فقه',
    avatar: '',
    youtubeUrl: '',
  },
  {
    id: 'scholar_sherif_elhawary',
    name: 'الشيخ شريف الهواري',
    bio: 'داعية إسلامي ومحاضر في الدعوة والتربية والسلوك وبناء الشخصية المسلمة.',
    specialty: 'دعوة وتربية وسلوك',
    avatar: '',
    youtubeUrl: 'https://www.youtube.com/@sherifelhawary',
  },
  {
    id: 'scholar_saeed_abdelazeem',
    name: 'د. سعيد عبد العظيم',
    bio: 'طبيب وداعية وخطيب ومؤلف في العقيدة وتزكية النفوس وقضايا الأمة المعاصرة.',
    specialty: 'عقيدة وتزكية وفقه دعوة',
    avatar: '',
    youtubeUrl: '',
  },
  {
    id: 'scholar_reda_thabet',
    name: 'الشيخ رضا ثابت',
    bio: 'داعية إسلامي وباحث شرعي ومحاضر في العلوم الإسلامية والفقه والتزكية.',
    specialty: 'علوم شرعية وفقه ودعوة',
    avatar: '',
    youtubeUrl: '',
  },
  {
    id: 'scholar_ragab_abo_bseisa',
    name: 'الشيخ رجب أبو بسيسة',
    bio: 'داعية إسلامي وخطيب وباحث شرعي في الفقه والدعوة والأخلاق الإسلامية.',
    specialty: 'فقه وأخلاق إسلامية',
    avatar: '',
    youtubeUrl: '',
  },
  {
    id: 'scholar_mohamed_saad_azhary',
    name: 'د. محمد سعد الأزهري',
    bio: 'باحث وداعية إسلامي أزهري، كاتب في التربية والفكر الإسلامي وقضايا الأسرة المسلمة.',
    specialty: 'فكر وتربية وأسرة مسلمة',
    avatar: '',
    youtubeUrl: '',
  },
  {
    id: 'scholar_sherif_taha',
    name: 'د. شريف طه',
    bio: 'طبيب وباحث شرعي وداعية ومؤلف، مدرس للفقه والعقيدة ومصمم مناهج تعليمية للأطفال والناشئة.',
    specialty: 'مناهج تعليمية وتربية وفقه',
    avatar: '',
    youtubeUrl: 'https://www.youtube.com/@sheriftaha',
  },
  {
    id: 'scholar_ahmed_elshareef',
    name: 'الشيخ أحمد الشريف',
    bio: 'داعية وباحث إسلامي وخطيب ومحاضر في العلوم الشرعية والقرآنية.',
    specialty: 'علوم شرعية ودعوة',
    avatar: '',
    youtubeUrl: '',
  },
];

// Conversions
export const scholarToDb = (s: Scholar) => ({
  id: s.id,
  name: s.name,
  avatar: s.avatar || '',
  bio: s.bio || '',
  specialty: s.specialty || 'عالم وداعية إسلامي',
  youtube_url: s.youtubeUrl || '',
  social_links: {
    ...(s.socialLinks || {}),
    orderIndex: typeof s.orderIndex === 'number' ? s.orderIndex : 0,
  },
});

export const dbToScholar = (row: any): Scholar => ({
  id: row.id,
  name: row.name,
  avatar: row.avatar || '',
  bio: row.bio || '',
  specialty: row.specialty || 'عالم وداعية إسلامي',
  youtubeUrl: row.youtube_url || undefined,
  orderIndex: typeof row.social_links?.orderIndex === 'number' ? row.social_links.orderIndex : undefined,
  socialLinks: row.social_links || undefined,
});

export const seriesToDb = (s: ExplanationSeries) => ({
  id: s.id,
  scholar_id: s.scholarId,
  title: s.title,
  description: s.description || '',
  thumbnail: s.thumbnail || '',
  type: s.type || 'visual',
  source: s.source || 'youtube',
  url: s.url || '',
  video_count: s.videoCount || (s.videos ? s.videos.length : 0),
  is_curated: !!s.isCurated,
  book_details: s.bookDetails || {},
});

export const dbToSeries = (row: any, videos: VideoItem[] = []): ExplanationSeries => ({
  id: row.id,
  scholarId: row.scholar_id,
  title: row.title,
  description: row.description || '',
  thumbnail: row.thumbnail || '',
  type: (row.type as any) || 'visual',
  source: (row.source as any) || 'youtube',
  url: row.url || '',
  videoCount: row.video_count || videos.length || 0,
  isCurated: !!row.is_curated,
  bookDetails: row.book_details || undefined,
  videos: videos,
});

// Seed helper
export const seedInitialScholarsToSupabase = async (): Promise<Scholar[]> => {
  try {
    const rows = INITIAL_SCHOLARS_SEED.map(scholarToDb);
    const { error } = await supabase.from('scholars').upsert(rows);
    if (error) {
      console.error('Failed to seed scholars to Supabase:', error);
      return INITIAL_SCHOLARS_SEED;
    }
    localStorage.setItem('zad_scholars', JSON.stringify(INITIAL_SCHOLARS_SEED));
    window.dispatchEvent(new CustomEvent('zad_scholars_synced', { detail: INITIAL_SCHOLARS_SEED }));
    return INITIAL_SCHOLARS_SEED;
  } catch (err) {
    console.error('Error during initial scholars seeding:', err);
    return INITIAL_SCHOLARS_SEED;
  }
};

// Synchronous fast getters from localStorage
export const getScholars = (): Scholar[] => {
  const data = localStorage.getItem('zad_scholars');
  let scholars: Scholar[] = [];
  if (data) {
    try {
      scholars = JSON.parse(data);
    } catch {
      scholars = [];
    }
  }

  // Filter out any mock dummy scholars and strip any stock photos
  let needsSave = false;
  const cleanScholars = scholars.filter(
    s => s.id && !s.id.startsWith('sch_') && !s.avatar?.includes('ui-avatars.com')
  ).map(s => {
    if (s.avatar?.includes('unsplash.com')) {
      needsSave = true;
      return { ...s, avatar: '' };
    }
    return s;
  });

  // If local storage is empty, initialize with built-in 35 scholars
  if (cleanScholars.length === 0) {
    localStorage.setItem('zad_scholars', JSON.stringify(INITIAL_SCHOLARS_SEED));
    return INITIAL_SCHOLARS_SEED;
  }

  if (needsSave || cleanScholars.length !== scholars.length) {
    localStorage.setItem('zad_scholars', JSON.stringify(cleanScholars));
  }

  // Sort by orderIndex
  cleanScholars.sort((a, b) => {
    const idxA = typeof a.orderIndex === 'number' ? a.orderIndex : 9999;
    const idxB = typeof b.orderIndex === 'number' ? b.orderIndex : 9999;
    return idxA - idxB;
  });

  return cleanScholars;
};

export const getSeries = (): ExplanationSeries[] => {
  const data = localStorage.getItem('zad_series');
  let seriesList: ExplanationSeries[] = [];
  if (data) {
    try {
      seriesList = JSON.parse(data);
    } catch {
      seriesList = [];
    }
  }

  // Filter out any mock dummy series and strip unsplash thumbnails
  let seriesModified = false;
  const cleanSeries = seriesList.filter(
    s => s.id && !s.id.startsWith('pl_') && !s.thumbnail?.includes('placeholder')
  ).map(s => {
    if (s.thumbnail?.includes('unsplash.com')) {
      seriesModified = true;
      return { ...s, thumbnail: '' };
    }
    return s;
  });

  if (seriesModified || cleanSeries.length !== seriesList.length) {
    localStorage.setItem('zad_series', JSON.stringify(cleanSeries));
  }

  return cleanSeries;
};

// Async Supabase Fetchers (Stale-While-Revalidate)
export const fetchScholarsFromSupabase = async (): Promise<Scholar[]> => {
  try {
    const { data, error } = await supabase
      .from('scholars')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Supabase fetch scholars warning:', error.message);
      return getScholars();
    }

    if (data && data.length > 0) {
      const scholars = data.map(dbToScholar).map(s => {
        if (s.avatar?.includes('unsplash.com')) return { ...s, avatar: '' };
        return s;
      });
      scholars.sort((a, b) => {
        const idxA = typeof a.orderIndex === 'number' ? a.orderIndex : 9999;
        const idxB = typeof b.orderIndex === 'number' ? b.orderIndex : 9999;
        return idxA - idxB;
      });
      localStorage.setItem('zad_scholars', JSON.stringify(scholars));
      window.dispatchEvent(new CustomEvent('zad_scholars_synced', { detail: scholars }));
      return scholars;
    }

    // If Supabase table is empty, auto-seed the 35 scholars
    return await seedInitialScholarsToSupabase();
  } catch (err) {
    console.error('fetchScholarsFromSupabase exception:', err);
    return getScholars();
  }
};

export const fetchSeriesFromSupabase = async (scholarId?: string): Promise<ExplanationSeries[]> => {
  try {
    let query = supabase.from('series').select('*').order('created_at', { ascending: true });
    if (scholarId) {
      query = query.eq('scholar_id', scholarId);
    }
    const { data: seriesRows, error } = await query;
    if (error) {
      console.warn('Supabase fetch series warning:', error.message);
      return scholarId ? getSeries().filter(s => s.scholarId === scholarId) : getSeries();
    }

    if (!seriesRows || seriesRows.length === 0) {
      const current = getSeries();
      const updated = scholarId ? current.filter(s => s.scholarId !== scholarId) : [];
      localStorage.setItem('zad_series', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('zad_series_synced', { detail: updated }));
      return [];
    }

    // Fetch videos for these series
    const seriesIds = seriesRows.map(r => r.id);
    const { data: videoRows } = await supabase
      .from('videos')
      .select('*')
      .in('series_id', seriesIds)
      .order('order_index', { ascending: true });

    const videosBySeries: Record<string, VideoItem[]> = {};
    if (videoRows) {
      for (const v of videoRows) {
        if (!videosBySeries[v.series_id]) videosBySeries[v.series_id] = [];
        videosBySeries[v.series_id].push({
          id: v.id,
          title: v.title,
          thumbnail: v.thumbnail || '',
          duration: v.duration || undefined,
          publishedAt: v.published_at || undefined,
          url: v.url || undefined,
          directUrl: v.direct_url || undefined,
          source: v.source || 'youtube',
          description: v.description || undefined,
          chapters: v.chapters || undefined,
        });
      }
    }

    const seriesList: ExplanationSeries[] = seriesRows.map(r => dbToSeries(r, videosBySeries[r.id] || []));

    // Update local cache
    const currentLocal = getSeries();
    const otherSeries = scholarId ? currentLocal.filter(s => s.scholarId !== scholarId) : [];
    const merged = [...otherSeries, ...seriesList];
    localStorage.setItem('zad_series', JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('zad_series_synced', { detail: merged }));
    return seriesList;
  } catch (err) {
    console.error('fetchSeriesFromSupabase exception:', err);
    return scholarId ? getSeries().filter(s => s.scholarId === scholarId) : getSeries();
  }
};

// Mutators with immediate local persistence + Supabase cloud sync
export const saveScholarsOrder = (orderedScholars: Scholar[]): Scholar[] => {
  const updated = orderedScholars.map((s, idx) => ({
    ...s,
    orderIndex: idx,
  }));

  localStorage.setItem('zad_scholars', JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('zad_scholars_synced', { detail: updated }));

  // Asynchronously upsert to Supabase
  const rows = updated.map(scholarToDb);
  supabase.from('scholars').upsert(rows).then(({ error }) => {
    if (error) console.error('Failed to update scholars order in Supabase:', error.message);
  });

  return updated;
};

export const addScholar = (scholar: Scholar) => {
  const scholars = getScholars();
  const existingIndex = scholars.findIndex(s => s.id === scholar.id);
  if (existingIndex >= 0) {
    scholars[existingIndex] = { ...scholars[existingIndex], ...scholar };
  } else {
    scholars.push(scholar);
  }
  localStorage.setItem('zad_scholars', JSON.stringify(scholars));
  window.dispatchEvent(new CustomEvent('zad_scholars_synced', { detail: scholars }));

  // Asynchronously upsert to Supabase
  supabase
    .from('scholars')
    .upsert(scholarToDb(scholar))
    .then(({ error }) => {
      if (error) console.error('Error saving scholar to Supabase:', error.message);
    });
};

export const addSeriesToStore = (newSeries: ExplanationSeries) => {
  const current = getSeries();
  const existingIndex = current.findIndex(x => x.id === newSeries.id);
  if (existingIndex >= 0) {
    current[existingIndex] = { ...current[existingIndex], ...newSeries };
  } else {
    current.push(newSeries);
  }
  localStorage.setItem('zad_series', JSON.stringify(current));
  window.dispatchEvent(new CustomEvent('zad_series_synced', { detail: current }));

  // Asynchronously upsert series to Supabase
  supabase
    .from('series')
    .upsert(seriesToDb(newSeries))
    .then(({ error }) => {
      if (error) console.error('Error saving series to Supabase:', error.message);
    });

  // If series contains videos, upsert them too
  if (newSeries.videos && newSeries.videos.length > 0) {
    const videoRows = newSeries.videos.map((v, idx) => ({
      id: v.id,
      series_id: newSeries.id,
      title: v.title,
      thumbnail: v.thumbnail || '',
      duration: v.duration || '',
      published_at: v.publishedAt || '',
      url: v.url || '',
      direct_url: v.directUrl || '',
      source: v.source || newSeries.source || 'youtube',
      description: v.description || '',
      chapters: v.chapters || [],
      order_index: idx,
    }));

    supabase
      .from('videos')
      .upsert(videoRows)
      .then(({ error }) => {
        if (error) console.error('Error saving videos to Supabase:', error.message);
      });
  }
};

export const deleteSeriesFromStore = (seriesId: string) => {
  const current = getSeries();
  const filtered = current.filter(x => x.id !== seriesId);
  localStorage.setItem('zad_series', JSON.stringify(filtered));
  window.dispatchEvent(new CustomEvent('zad_series_synced', { detail: filtered }));

  // Asynchronously delete from Supabase
  supabase
    .from('series')
    .delete()
    .eq('id', seriesId)
    .then(({ error }) => {
      if (error) console.error('Error deleting series from Supabase:', error.message);
    });

  return filtered;
};

export const deleteScholarFromStore = (scholarId: string, deleteItsSeries: boolean = false) => {
  const scholars = getScholars().filter(s => s.id !== scholarId);
  localStorage.setItem('zad_scholars', JSON.stringify(scholars));

  if (deleteItsSeries) {
    const series = getSeries().filter(s => s.scholarId !== scholarId);
    localStorage.setItem('zad_series', JSON.stringify(series));
  }
  window.dispatchEvent(new CustomEvent('zad_scholars_synced', { detail: scholars }));

  // Delete from Supabase
  supabase
    .from('scholars')
    .delete()
    .eq('id', scholarId)
    .then(({ error }) => {
      if (error) console.error('Error deleting scholar from Supabase:', error.message);
    });

  return scholars;
};

export const mergeScholarsInStore = (sourceScholarId: string, targetScholarId: string) => {
  // 1. Move all series from source to target
  const series = getSeries().map(s => {
    if (s.scholarId === sourceScholarId) {
      return { ...s, scholarId: targetScholarId };
    }
    return s;
  });
  localStorage.setItem('zad_series', JSON.stringify(series));

  // 2. Remove source scholar
  const scholars = getScholars().filter(s => s.id !== sourceScholarId);
  localStorage.setItem('zad_scholars', JSON.stringify(scholars));

  window.dispatchEvent(new CustomEvent('zad_scholars_synced', { detail: scholars }));
  window.dispatchEvent(new CustomEvent('zad_series_synced', { detail: series }));

  // Supabase update
  supabase
    .from('series')
    .update({ scholar_id: targetScholarId })
    .eq('scholar_id', sourceScholarId)
    .then(() => {
      supabase.from('scholars').delete().eq('id', sourceScholarId);
    });

  return scholars;
};
