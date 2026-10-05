import React from 'react';
import { getScholars } from './data/store';
import { BookOpen, Video, Headphones, ArrowRight, Sparkles, Settings } from 'lucide-react';
import IslamicPattern from '../knowledge/components/IslamicPattern';
import { ScholarAvatar } from '../../components/common/ScholarAvatar';

interface LessonsPageProps {
  onNavigateToScholar: (id: string) => void;
  onNavigateToImporter?: () => void;
  onBack?: () => void;
}

export const LessonsPage: React.FC<LessonsPageProps> = ({ 
  onNavigateToScholar, 
  onNavigateToImporter, 
  onBack 
}) => {
  const scholars = getScholars();

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col" dir="rtl">
      {/* Authentic Islamic Geometric Pattern in Subtle White */}
      <IslamicPattern className="text-white pointer-events-none" opacity={0.06} />

      {/* Top Navigation Bar */}
      <header className="relative z-20 border-b border-neutral-800/80 bg-black/60 backdrop-blur-xl px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 hover:bg-neutral-800 transition-all text-sm font-medium"
              >
                <ArrowRight size={18} />
                <span>العودة للرئيسية</span>
              </button>
            )}

            {onNavigateToImporter && (
              <button
                onClick={onNavigateToImporter}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition-all text-xs font-semibold shadow-sm"
              >
                <Settings size={14} />
                <span>إدارة واستيراد الشيوخ</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 bg-neutral-900/90 px-3 py-1.5 rounded-full border border-neutral-800">
            <Sparkles size={14} className="text-neutral-300" />
            <span>زاد • دليل الشروحات المعتمدة</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 py-16 md:py-24">
        {/* Title and Intro */}
        <div className="mx-auto max-w-3xl text-center mb-20">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-neutral-900 border border-neutral-800 text-neutral-300 mb-4 tracking-wide">
            دليل الشيوخ والشارحين
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white tracking-tight">
            الشروحات والدروس العلمية
          </h1>
          <p className="mt-4 text-neutral-400 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            تصفح شروحات ودروس نخبة من علماء ودعاة الأمة، مرتبة ومنظمة لتسهيل طلب العلم والوصول السريع للمتون.
          </p>
        </div>

        {/* Scholars Grid */}
        {scholars.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {scholars.map((scholar) => (
              <div
                key={scholar.id}
                onClick={() => onNavigateToScholar(scholar.id)}
                className="group relative cursor-pointer rounded-3xl border border-neutral-800 bg-neutral-950/70 p-6 pt-14 backdrop-blur-md transition-all duration-300 hover:border-neutral-600 hover:bg-neutral-900/80 hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(0,0,0,0.8)] flex flex-col justify-between"
              >
                {/* Scholar Avatar Frame */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                  <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-b from-neutral-500 to-neutral-800 shadow-2xl transition-transform duration-300 group-hover:scale-105">
                    <div className="w-full h-full rounded-full overflow-hidden bg-black border border-neutral-800">
                      <ScholarAvatar src={scholar.avatar} name={scholar.name} />
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="text-center mt-4">
                  <h2 className="font-display text-2xl font-bold text-white mb-2 group-hover:text-neutral-100 transition-colors">
                    {scholar.name}
                  </h2>
                  <p className="text-neutral-400 text-sm leading-relaxed line-clamp-3 mb-6">
                    {scholar.bio || 'لا توجد نبذة تعريفية متاحة حالياً.'}
                  </p>
                </div>

                {/* Footer categories / stats */}
                <div className="flex items-center justify-center gap-6 text-neutral-400 text-xs font-medium border-t border-neutral-800/80 pt-4 mt-auto">
                  <div className="flex items-center gap-1.5 transition-colors group-hover:text-white">
                    <Video size={15} />
                    <span>مرئية</span>
                  </div>
                  <div className="flex items-center gap-1.5 transition-colors group-hover:text-white">
                    <Headphones size={15} />
                    <span>صوتية</span>
                  </div>
                  <div className="flex items-center gap-1.5 transition-colors group-hover:text-white">
                    <BookOpen size={15} />
                    <span>كتب</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-md mx-auto text-center py-20 px-6 rounded-3xl border border-neutral-800/80 bg-neutral-950/60 backdrop-blur-md">
            <h3 className="text-xl font-bold text-white mb-2">لا يوجد شيوخ حالياً</h3>
            <p className="text-neutral-400 text-sm leading-relaxed mb-6">
              لم يتم استيراد أي شيوخ بعد. يمكنك التوجه إلى صفحة استيراد يوتيوب لإضافة الشيوخ وسلاسلهم التعليمية المخصصة.
            </p>
            {onNavigateToImporter && (
              <button
                onClick={onNavigateToImporter}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-all shadow-md"
              >
                <Settings size={15} />
                <span>الذهاب لصفحة إدارة واستيراد الشيوخ</span>
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

