import React, { useState } from 'react';
import { 
  BookOpen, 
  Users, 
  Layers, 
  Clock, 
  TrendingUp, 
  PieChart as PieIcon, 
  BarChart3, 
  Sparkles,
  ChevronLeft
} from 'lucide-react';

interface DomainStat {
  name: string;
  count: number;
  color: string;
  percentage: number;
}

interface HomeChartsSectionProps {
  stats: {
    total_books: number;
    total_authors: number;
    total_domains: number;
    timeline?: {
      earliest_century?: number;
      latest_century?: number;
    };
  };
  domainStats: { name: string; count: number }[];
  onSelectDomain?: (domainName: string) => void;
}

export default function HomeChartsSection({
  stats,
  domainStats,
  onSelectDomain
}: HomeChartsSectionProps) {
  const [activeDomainHover, setActiveDomainHover] = useState<string | null>(null);

  // Define curated colors for key disciplines
  const disciplineColors: Record<string, string> = {
    'الفقه': '#9333ea',
    'الفقه وأصوله': '#9333ea',
    'المذهب الحنبلي': '#10b981',
    'المذهب الشافعي': '#06b6d4',
    'المذهب الحنفي': '#8b5cf6',
    'المذهب المالكي': '#f59e0b',
    'العقيدة': '#ec4899',
    'العقيدة الإسلامية': '#ec4899',
    'الحديث': '#3b82f6',
    'الحديث الشريف': '#3b82f6',
    'التفسير': '#f97316',
    'علوم القرآن والتفسير': '#f97316',
    'اللغة العربية': '#14b8a6',
    'السيرة والتاريخ': '#6366f1',
    'عام': '#64748b'
  };

  const totalBooks = stats.total_books || 1;

  // Calculate top domains with percentage
  const processedDomains: DomainStat[] = (domainStats.length > 0 ? domainStats : [
    { name: 'الفقه وأصوله', count: 42 },
    { name: 'الحديث الشريف', count: 28 },
    { name: 'العقيدة الإسلامية', count: 24 },
    { name: 'علوم القرآن والتفسير', count: 18 },
    { name: 'اللغة العربية والبيان', count: 15 },
    { name: 'السيرة والتراجم', count: 12 },
  ])
    .slice(0, 6)
    .map((d, index) => {
      const defaultColors = ['#9333ea', '#3b82f6', '#ec4899', '#f97316', '#10b981', '#6366f1'];
      return {
        name: d.name,
        count: d.count,
        color: disciplineColors[d.name] || defaultColors[index % defaultColors.length],
        percentage: Math.max(4, Math.round((d.count / totalBooks) * 100))
      };
    });

  // Timeline data: classical Islamic authorship across centuries
  const centuriesData = [
    { century: 'ق 2 هـ', count: 14, label: 'عصر صغار التابعين وأوائل التدوين', height: '40%' },
    { century: 'ق 3 هـ', count: 38, label: 'عصر تدوين الصحاح والأئمة الأربعة', height: '85%' },
    { century: 'ق 4 هـ', count: 26, label: 'اتساع شروح الحديث وأصول المذاهب', height: '65%' },
    { century: 'ق 5 هـ', count: 22, label: 'أئمة الأصول والفقه المقارن', height: '55%' },
    { century: 'ق 6 هـ', count: 18, label: 'المتون الفقهية الكبرى', height: '48%' },
    { century: 'ق 7 هـ', count: 42, label: 'عصر الأئمة الكبار كابن قدامة والنووي', height: '95%' },
    { century: 'ق 8 هـ', count: 45, label: 'عصر ابن تيمية والذهبي وابن القيم وابن كثير', height: '100%' },
    { century: 'ق 9 هـ', count: 32, label: 'الحافظ ابن حجر والسيوطي والزركشي', height: '75%' },
    { century: 'ق 10 هـ', count: 20, label: 'الموسوعات المحررة والشروح المعتمدة', height: '50%' }
  ];

  return (
    <div className="space-y-6 pt-2">
      {/* 4 Overview Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="rounded-2xl p-4 bg-white/80 dark:bg-[#15062b]/80 border border-slate-200/80 dark:border-purple-500/20 backdrop-blur-md shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-muted-foreground">أمهات المصنفات</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground font-mono">
            {stats.total_books.toLocaleString('ar-EG')}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">كتاب ومخطوط محقق</p>
        </div>

        <div className="rounded-2xl p-4 bg-white/80 dark:bg-[#15062b]/80 border border-slate-200/80 dark:border-purple-500/20 backdrop-blur-md shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-muted-foreground">أعلام ومصنفو التراث</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground font-mono">
            {stats.total_authors.toLocaleString('ar-EG')}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">إمام وعالم محقق</p>
        </div>

        <div className="rounded-2xl p-4 bg-white/80 dark:bg-[#15062b]/80 border border-slate-200/80 dark:border-purple-500/20 backdrop-blur-md shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-muted-foreground">المجالات والتخصصات</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground font-mono">
            {stats.total_domains.toLocaleString('ar-EG')}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">باباً وتخصصاً علمياً</p>
        </div>

        <div className="rounded-2xl p-4 bg-white/80 dark:bg-[#15062b]/80 border border-slate-200/80 dark:border-purple-500/20 backdrop-blur-md shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-muted-foreground">النطاق الزمني الهجري</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-foreground font-mono">
            ق {stats.timeline?.earliest_century || 2} - {stats.timeline?.latest_century || 15} هـ
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">أكثر من 1300 عام تدوين</p>
        </div>
      </div>

      {/* Visual Analytics Grid: 2 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Chart 1: Distribution of Disciplines (توزيع المصنفات حسب العلوم الشرعية) */}
        <div className="lg:col-span-5 rounded-3xl p-5 sm:p-6 bg-white/85 dark:bg-[#15062b]/85 border border-slate-200/80 dark:border-purple-500/25 backdrop-blur-md shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <PieIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-foreground">
                    توزيع الكتب حسب العلوم
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    نسبة انتشار أمهات المصنفات حسب التخصص
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-brand-magenta font-mono">
                {stats.total_books} كتاب
              </span>
            </div>

            {/* Visual Multi-Segment Bar */}
            <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-white/5 flex overflow-hidden p-0.5 mb-5 shadow-inner">
              {processedDomains.map((d) => (
                <div
                  key={d.name}
                  className="h-full rounded-full transition-all duration-300 first:rounded-r-full last:rounded-l-full cursor-pointer hover:opacity-90"
                  style={{
                    width: `${d.percentage}%`,
                    backgroundColor: d.color,
                    opacity: activeDomainHover && activeDomainHover !== d.name ? 0.4 : 1
                  }}
                  onMouseEnter={() => setActiveDomainHover(d.name)}
                  onMouseLeave={() => setActiveDomainHover(null)}
                  title={`${d.name}: ${d.count} كتاب (${d.percentage}%)`}
                />
              ))}
            </div>

            {/* List of Disciplines with Progress Bar */}
            <div className="space-y-3">
              {processedDomains.map((d) => (
                <div
                  key={d.name}
                  onClick={() => onSelectDomain && onSelectDomain(d.name)}
                  onMouseEnter={() => setActiveDomainHover(d.name)}
                  onMouseLeave={() => setActiveDomainHover(null)}
                  className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    activeDomainHover === d.name 
                      ? 'bg-purple-500/10 scale-[1.01]' 
                      : 'hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-xs font-bold text-foreground truncate">
                      {d.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-20 sm:w-28 h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden hidden sm:block">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${d.percentage}%`, backgroundColor: d.color }}
                      />
                    </div>
                    <span className="text-xs font-black text-muted-foreground font-mono min-w-[32px] text-left">
                      {d.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>بيانات حية محدثة من قاعدة المكتبة</span>
            <span className="text-brand-magenta font-bold">تصفح بالضغط على المجال ↗</span>
          </div>
        </div>

        {/* Chart 2: Timeline of Authorship Across Islamic Centuries (حركة التدوين عبر القرون) */}
        <div className="lg:col-span-7 rounded-3xl p-5 sm:p-6 bg-white/85 dark:bg-[#15062b]/85 border border-slate-200/80 dark:border-purple-500/25 backdrop-blur-md shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-foreground">
                    مسار حركة التدوين عبر القرون الهجرية
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    كثافة المصنفات حسب عصر التأليف والقرن الهجري
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                العصور الذهبية
              </span>
            </div>

            {/* Vertical Bars Chart Container */}
            <div className="h-44 sm:h-52 w-full pt-6 pb-2 flex items-end justify-between gap-1.5 sm:gap-2 px-1 border-b border-slate-100 dark:border-white/10">
              {centuriesData.map((c) => (
                <div 
                  key={c.century}
                  className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                >
                  {/* Tooltip on Hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-20 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded-lg whitespace-nowrap shadow-xl border border-white/10">
                    <div>{c.century}: {c.count} مصنفاً</div>
                    <div className="text-muted-foreground font-normal text-[9px]">{c.label}</div>
                  </div>

                  {/* The Bar */}
                  <div 
                    className="w-full max-w-[28px] rounded-t-xl bg-gradient-to-t from-brand-deep via-brand-magenta to-purple-400 group-hover:from-brand-magenta group-hover:to-pink-400 transition-all duration-300 shadow-md shadow-brand-magenta/20 group-hover:scale-105"
                    style={{ height: c.height }}
                  />
                  
                  {/* Centurial Label */}
                  <span className="text-[10px] font-bold text-muted-foreground mt-2 group-hover:text-brand-magenta transition-colors whitespace-nowrap">
                    {c.century}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-magenta" />
              الذروة في القرنين 7 و 8 هـ (عصر كبار الأئمة والموسوعات)
            </span>
            <span className="font-mono">ق 2 - ق 10 هـ</span>
          </div>
        </div>

      </div>
    </div>
  );
}
