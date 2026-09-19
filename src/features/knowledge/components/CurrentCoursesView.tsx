import React, { useState } from 'react';
import { 
  GraduationCap, 
  Play, 
  ExternalLink, 
  BookOpen, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  UserCheck, 
  Layers, 
  ArrowLeft,
  Calendar
} from 'lucide-react';
import { Course } from '../types/mediaTypes';

interface CurrentCoursesViewProps {
  courses: Course[];
  onOpenLinkedBook?: (bookTitle: string) => void;
  onStartStudy?: (course: Course) => void;
}

export default function CurrentCoursesView({
  courses,
  onOpenLinkedBook,
  onStartStudy
}: CurrentCoursesViewProps) {
  // Current active highlighted course (الدورة الحالية التي حددها المستخدم)
  const activeCourse = courses.find(c => c.playlistId === 'PLRG850GgVGNY') || courses[0];
  const otherCourses = courses.filter(c => c.id !== activeCourse?.id);

  const [filterLevel, setFilterLevel] = useState<'all' | 'مبتدئ' | 'متوسط' | 'متقدم'>('all');

  return (
    <div className="animate-in fade-in duration-300 space-y-8">
      {/* Hero Banner for Current Courses */}
      <div className="relative rounded-3xl overflow-hidden p-6 sm:p-10 bg-gradient-to-r from-[#120526] via-[#240842] to-[#120526] text-white border border-purple-500/30 shadow-2xl">
        <div className="pointer-events-none absolute -left-20 -top-20 w-80 h-80 rounded-full bg-brand-magenta/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-emerald-500/20 blur-3xl" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-emerald-300 mb-4 shadow-sm">
            <GraduationCap className="w-4 h-4 text-emerald-300" />
            <span>المسارات والدورات العلمية الحالية</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight mb-3">
            دورات منهجية متكاملة لمدارسة كتب التراث
          </h2>
          <p className="text-sm sm:text-base text-purple-200/90 leading-relaxed max-w-2xl">
            دورات شرعية حية ومنهجية تتيح لك دراسة الكتب المقررة فصلاً بفصل، مع متابعة مرئية مستمرة ونظام مدارسة تفاعلي واختبارات لتقييم استيعابك.
          </p>
        </div>
      </div>

      {/* Featured Current Active Course (الدورة الحالية الرئيسية المطلوبة) */}
      {activeCourse && (
        <div className="relative rounded-3xl border-2 border-brand-magenta/50 bg-white dark:bg-[#150628] p-6 sm:p-8 shadow-2xl overflow-hidden">
          <div className="pointer-events-none absolute -left-10 -bottom-10 w-60 h-60 rounded-full bg-brand-magenta/10 blur-3xl" />

          <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-8">
            {/* Thumbnail / Cover */}
            <div className="relative w-full lg:w-96 h-56 sm:h-64 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-purple-500/30 shadow-lg shrink-0">
              <img 
                src={activeCourse.thumbnail} 
                alt={activeCourse.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-4">
                <span className="self-start px-3 py-1 rounded-full bg-rose-600/90 text-white text-xs font-bold shadow-md animate-pulse">
                  {activeCourse.badgeLabel}
                </span>

                <div className="flex items-center gap-2 text-white/90 text-xs">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    {activeCourse.totalLessons} درس
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" />
                    {activeCourse.enrolledCount} دارس مسجل
                  </span>
                </div>
              </div>
            </div>

            {/* Course Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-brand-magenta/10 text-brand-magenta border border-brand-magenta/20">
                  المستوى: {activeCourse.level}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-brand-blue/10 text-brand-blue border border-brand-blue/20">
                  {activeCourse.instructorName}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug mb-3">
                {activeCourse.title}
              </h3>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-5">
                {activeCourse.description}
              </p>

              {/* Linked Book */}
              {activeCourse.targetBook && (
                <div className="p-3 rounded-2xl bg-brand-magenta/5 border border-brand-magenta/20 flex items-center justify-between gap-3 mb-6">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-brand-magenta/15 text-brand-magenta flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-muted-foreground block">المتن المعتمد للدراسة:</span>
                      <span className="text-xs sm:text-sm font-bold text-foreground truncate block">
                        {activeCourse.targetBook.bookTitle}
                      </span>
                    </div>
                  </div>

                  {onOpenLinkedBook && (
                    <button
                      type="button"
                      onClick={() => onOpenLinkedBook(activeCourse.targetBook!.bookTitle)}
                      className="px-3 py-1.5 rounded-xl bg-brand-magenta text-white text-xs font-bold hover:bg-brand-deep transition-all shrink-0 flex items-center gap-1.5 shadow-sm"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>تصفح متن الكتاب 📖</span>
                    </button>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 flex-wrap">
                <a
                  href={activeCourse.playlistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-6 rounded-2xl bg-gradient-to-r from-brand-magenta to-brand-deep text-white text-xs sm:text-sm font-bold hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-magenta/25"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>مشاهدة دروس الدورة على يوتيوب</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>

                {activeCourse.lessons && (
                  <div className="text-xs text-muted-foreground font-semibold px-2">
                    يتم تحديث الدروس أسبوعياً
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Courses Catalog */}
      {otherCourses.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              بقية المسارات والدورات العلمية
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {otherCourses.map((course) => (
              <div
                key={course.id}
                className="rounded-2xl border border-slate-200/80 dark:border-purple-500/20 bg-white dark:bg-[#14062b] p-5 shadow-sm hover:shadow-lg hover:border-brand-magenta/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {course.badgeLabel}
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold">
                      {course.totalLessons} درس
                    </span>
                  </div>

                  <h4 className="font-extrabold text-base sm:text-lg text-foreground mb-1">
                    {course.title}
                  </h4>
                  <p className="text-xs text-brand-blue font-bold mb-2">
                    المحاضر: {course.instructorName}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                    {course.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
                  <a
                    href={course.playlistUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-4 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-brand-magenta hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>متابعة الدورة</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>

                  {course.targetBook && onOpenLinkedBook && (
                    <button
                      type="button"
                      onClick={() => onOpenLinkedBook(course.targetBook!.bookTitle)}
                      className="text-xs font-bold text-brand-magenta hover:underline"
                    >
                      متن {course.targetBook.bookTitle.split(' ')[0]} 📖
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
