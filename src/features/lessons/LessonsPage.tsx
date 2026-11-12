import React, { useState, useEffect } from 'react';
import { getScholars, fetchScholarsFromSupabase, Scholar } from './data/store';
import { BookOpen, Video, Headphones, ArrowRight } from 'lucide-react';
import IslamicPattern from '../knowledge/components/IslamicPattern';
import { ScholarAvatar } from '../../components/common/ScholarAvatar';
import { useTheme, ACCENT_STYLES } from '../../contexts/ThemeContext';

interface LessonsPageProps {
  onNavigateToScholar: (id: string) => void;
  onBack?: () => void;
  hideHeader?: boolean;
}

export const LessonsPage: React.FC<LessonsPageProps> = ({
  onNavigateToScholar,
  onBack,
  hideHeader = false,
}) => {
  const { isDark: dark, accentColor = 'amber' } = useTheme();
  const currentAccent = ACCENT_STYLES[accentColor] || ACCENT_STYLES.amber;
  const [scholars, setScholars] = useState<Scholar[]>(() => getScholars());

  useEffect(() => {
    // 1. Initial fast load from local cache
    setScholars(getScholars());

    // 2. Background fetch from Supabase
    fetchScholarsFromSupabase().then((data) => {
      if (data && data.length > 0) {
        setScholars(data);
      }
    });

    // 3. Listen to any store sync events
    const handleSync = (e: any) => {
      if (e.detail) {
        setScholars(e.detail);
      } else {
        setScholars(getScholars());
      }
    };

    window.addEventListener('zad_scholars_synced', handleSync);
    return () => window.removeEventListener('zad_scholars_synced', handleSync);
  }, []);

  return (
    <div
      dir="rtl"
      className={`min-h-screen relative overflow-hidden flex flex-col transition-colors duration-500 ${dark ? 'text-white bg-[#0c0e14]' : `text-stone-900 ${currentAccent.pageBgLight}`
        }`}
    >
      {/* 1. Authentic Islamic Geometric Pattern matching ChatScreen */}
      <IslamicPattern
        isFixed={true}
        opacity={dark ? 0.07 : 0.12}
        strokeColor={dark ? currentAccent.strokeDark : currentAccent.strokeLight}
        className="pointer-events-none transition-colors duration-300"
      />

      {/* Top Bar / Navigation if standalone with onBack */}
      {!hideHeader && onBack ? (
        <header
          className={`relative z-20 border-b px-6 py-4 backdrop-blur-xl transition-colors duration-300 ${dark ? 'border-white/10 bg-[#0c0e14]/80' : 'border-stone-200/80 bg-white/80'
            }`}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-start">
            <button
              type="button"
              onClick={onBack}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border transition-all text-sm font-medium ${dark
                  ? 'bg-[#121622]/90 border-white/10 text-white hover:bg-[#181d2c] hover:border-white/20'
                  : `bg-white/95 border ${currentAccent.lightBorder} text-stone-800 ${currentAccent.lightBgHover} ${currentAccent.lightBorderHover}`
                }`}
            >
              <ArrowRight size={18} />
              <span>العودة للرئيسية</span>
            </button>
          </div>
        </header>
      ) : null}

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 pt-36 md:pt-44 pb-24">
        {/* Scholars Grid */}
        {scholars.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 md:gap-y-20">
            {scholars.map((scholar) => (
              <div
                key={scholar.id}
                onClick={() => onNavigateToScholar(scholar.id)}
                className={`group relative cursor-pointer rounded-3xl border p-6 pt-14 backdrop-blur-md transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between ${dark
                    ? `border-white/10 ${currentAccent.darkBorderHover} bg-[#121622]/80 hover:bg-[#181d2c]/95 hover:shadow-[0_12px_40px_rgba(0,0,0,0.8)]`
                    : `border ${currentAccent.lightBorder} ${currentAccent.lightBorderHover} bg-white/90 hover:bg-white hover:shadow-xl`
                  }`}
              >
                {/* Scholar Avatar Frame */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                  <div
                    className={`w-24 h-24 rounded-full p-1 shadow-2xl transition-transform duration-300 group-hover:scale-105 ${dark
                        ? 'bg-gradient-to-b from-stone-600 to-stone-900'
                        : 'bg-gradient-to-b from-amber-200 to-stone-200 shadow-md'
                      }`}
                  >
                    <div
                      className={`w-full h-full rounded-full overflow-hidden border ${dark ? 'bg-black border-white/10' : 'bg-white border-amber-300/40'
                        }`}
                    >
                      <ScholarAvatar src={scholar.avatar} name={scholar.name} />
                    </div>
                  </div>
                </div>

                {/* Scholar Name */}
                <div className="text-center my-auto py-2">
                  <h2
                    className={`font-amiri text-2xl sm:text-3xl font-bold tracking-normal transition-colors ${dark ? 'text-white group-hover:text-[#dfbf83]' : 'text-stone-900 group-hover:text-amber-800'
                      }`}
                  >
                    {scholar.name}
                  </h2>
                </div>

                {/* Footer categories / stats */}
                <div
                  className={`flex items-center justify-center gap-6 text-xs font-medium border-t pt-4 mt-auto transition-colors ${dark
                      ? 'border-white/10 text-stone-400 group-hover:text-stone-200'
                      : 'border-stone-200/80 text-stone-600 group-hover:text-stone-900'
                    }`}
                >
                  <div className="flex items-center gap-1.5 transition-colors">
                    <Video size={15} />
                    <span>مرئية</span>
                  </div>
                  <div className="flex items-center gap-1.5 transition-colors">
                    <Headphones size={15} />
                    <span>صوتية</span>
                  </div>
                  <div className="flex items-center gap-1.5 transition-colors">
                    <BookOpen size={15} />
                    <span>كتب</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className={`max-w-md mx-auto text-center py-20 px-6 rounded-3xl border backdrop-blur-md ${dark
                ? 'border-white/10 bg-[#121622]/80 text-white'
                : `border ${currentAccent.lightBorder} bg-white/90 text-stone-900`
              }`}
          >
            <h3 className="text-xl font-bold mb-2">لا يوجد شيوخ حالياً</h3>
            <p className={`text-sm leading-relaxed ${dark ? 'text-stone-400' : 'text-stone-600'}`}>
              لم يتم استيراد أي شيوخ بعد.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};
