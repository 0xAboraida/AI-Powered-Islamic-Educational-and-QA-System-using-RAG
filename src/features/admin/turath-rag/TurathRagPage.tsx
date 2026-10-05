import React from 'react';
import { ArrowRight, Server, Zap } from 'lucide-react';
import bgDark from '@/assets/images/image.webp';
import { TurathRagHub } from './TurathRagHub';

interface TurathRagPageProps {
  onExit: () => void;
}

export const TurathRagPage: React.FC<TurathRagPageProps> = ({ onExit }) => {
  return (
    <div dir="rtl" className="relative flex h-screen w-full flex-col overflow-hidden text-foreground">
      {/* Background Image with Dark Blur Overlay */}
      <img
        src={bgDark}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-[#0f031b]/92 backdrop-blur-md" />

      {/* Standalone Header */}
      <header className="relative z-10 flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-[#160628]/80 px-6 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
            title="العودة للصفحة الرئيسية"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-base font-bold text-white tracking-wide">
                إدارة استخراج الكتب وتخزينها
              </h1>
              <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold text-sky-300 border border-sky-500/30 font-mono">
                Qdrant & Kaggle GPU
              </span>
            </div>
            <p className="text-xs text-white/60">
              إدارة الكلاسترات السحابية الموزعة، استدخال الكتب بدون استهلاك ديسك، وتوليد كود التضمين بنقرة واحدة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-all"
          >
            <span>العودة للمنصة</span>
          </button>
        </div>
      </header>

      {/* Main Scrollable View */}
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col overflow-y-auto p-6 md:p-8 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        <TurathRagHub />
      </main>
    </div>
  );
};
