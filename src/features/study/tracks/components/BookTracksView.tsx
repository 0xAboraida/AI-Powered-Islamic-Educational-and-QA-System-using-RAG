import React from 'react';
import {
  BookOpen,
  Headphones,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  UserCheck,
  Layers,
  ExternalLink,
  Settings2,
} from 'lucide-react';
import Navbar from '../../../../components/layout/Navbar';
import IslamicPattern from '../../../knowledge/components/IslamicPattern';
import { useAuth } from '../../../../contexts/AuthContext';
import { getAllTrackRecordings } from '../data/bookTracks';
import { BookTrackDefinition, BookTrackProgress } from '../types';

export interface BookTracksViewProps {
  accentColor: 'purple' | 'emerald' | 'amber' | 'blue';
  isDark: boolean;
  tracks: BookTrackDefinition[];
  trackProgressMap: Record<string, BookTrackProgress>;
  onSelectTrack: (trackId: string) => void;
  onOpenTrackAdmin?: () => void;
  onBackToHero: () => void;
  onExit: () => void;
  onNavigateHome?: () => void;
  onTryChat?: () => void;
  onLogin?: () => void;
  onOpenKnowledge?: (tab?: any) => void;
  onOpenVoiceChat?: () => void;
  onOpenLessons?: () => void;
  onOpenAdmin?: () => void;
  onOpenTurathRag?: () => void;
  onOpenEngineControl?: () => void;
  onOpenDataIngestion?: () => void;
  onOpenV2PipelineAdmin?: () => void;
  onOpenAdminLibrary?: () => void;
  onOpenYoutubeImporter?: () => void;
  onOpenSystemObservability?: () => void;
}

export const BookTracksView: React.FC<BookTracksViewProps> = ({
  accentColor,
  isDark,
  tracks,
  trackProgressMap,
  onSelectTrack,
  onOpenTrackAdmin,
  onBackToHero,
  onExit,
  onNavigateHome,
  onTryChat,
  onLogin,
  onOpenKnowledge,
  onOpenVoiceChat,
  onOpenLessons,
  onOpenAdmin,
  onOpenTurathRag,
  onOpenEngineControl,
  onOpenDataIngestion,
  onOpenV2PipelineAdmin,
  onOpenAdminLibrary,
  onOpenYoutubeImporter,
  onOpenSystemObservability,
}) => {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = Boolean(isAuthenticated && user?.role === 'admin');

  const isEmerald = accentColor === 'emerald';
  const isAmber = accentColor === 'amber';
  const isPurple = accentColor === 'purple';

  const primaryBtnClass = isEmerald
    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
    : isAmber
      ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
      : isPurple
        ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20'
        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20';

  const badgeAccentClass = isEmerald
    ? isDark
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : isAmber
      ? isDark
        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
        : 'bg-amber-50 text-amber-700 border-amber-200'
      : isPurple
        ? isDark
          ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
          : 'bg-purple-50 text-purple-700 border-purple-200'
        : isDark
          ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
          : 'bg-blue-50 text-blue-700 border-blue-200';

  return (
    <div
      dir="rtl"
      className="relative min-h-screen w-full bg-background text-foreground transition-colors duration-300 overflow-x-hidden"
    >
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <IslamicPattern
          className={isDark ? 'text-white/5' : 'text-stone-900/5'}
          opacity={isDark ? 0.08 : 0.05}
          scale={0.85}
        />
      </div>

      {/* Floating Top Navbar */}
      <Navbar
        headerClassName="absolute inset-x-0 top-4 sm:top-6 z-50 px-3 sm:px-4"
        activeTab="study"
        onNavigateHome={onNavigateHome || onExit}
        onTryChat={onTryChat || (() => {})}
        onLogin={onLogin}
        onOpenKnowledge={onOpenKnowledge || (() => {})}
        onOpenStudy={onBackToHero}
        onOpenLessons={onOpenLessons || (() => {})}
        onOpenVoiceChat={onOpenVoiceChat || (() => {})}
        onOpenAdmin={onOpenAdmin}
        onOpenTurathRag={onOpenTurathRag}
        onOpenEngineControl={onOpenEngineControl}
        onOpenDataIngestion={onOpenDataIngestion}
        onOpenV2PipelineAdmin={onOpenV2PipelineAdmin}
        onOpenAdminLibrary={onOpenAdminLibrary}
        onOpenYoutubeImporter={onOpenYoutubeImporter}
        onOpenSystemObservability={onOpenSystemObservability}
      />

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-16">
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full border text-xs font-bold ${badgeAccentClass}`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>مسارات المدارسة المنهجية</span>
            </div>

            {isAdmin && onOpenTrackAdmin && (
              <button
                type="button"
                onClick={onOpenTrackAdmin}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border text-xs font-bold transition-colors ${
                  isDark
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/35 hover:bg-amber-500/25'
                    : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                }`}
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>إدارة المسارات (أدمن)</span>
              </button>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
            مسارات دراسة المتون والكتب
          </h1>
          <p
            className={`text-sm sm:text-base leading-relaxed ${
              isDark ? 'text-stone-300' : 'text-stone-600'
            }`}
          >
            خطط مخصّصة لكل كتاب تفتح لك فهرس الكتاب فقط مع أول درس تلقائيًا، وتجمع المتن
            والتسجيلات الصوتية والمرئية في مكان واحد.
          </p>
        </div>

        {/* Tracks Cards */}
        <div className="grid grid-cols-1 gap-6">
          {tracks.map((track) => {
            const allRecordings = getAllTrackRecordings(track);
            const progress = trackProgressMap[track.id];
            const completedCount = progress?.completedRecordingIds?.length ?? 0;
            const hasStarted = Boolean(progress?.lastChunkId || completedCount > 0);

            return (
              <div
                key={track.id}
                className={`rounded-3xl border p-5 sm:p-7 backdrop-blur-xl transition-all shadow-lg ${
                  isDark
                    ? 'bg-stone-900/75 border-stone-800 hover:border-stone-700'
                    : 'bg-white/90 border-stone-200/90 hover:border-stone-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-3 flex-1 min-w-0">
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${badgeAccentClass}`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>
                          {track.domain}
                          {track.madhhab ? ` • ${track.madhhab}` : ''}
                        </span>
                      </span>

                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                          isDark
                            ? 'bg-stone-800 text-stone-300 border-stone-700'
                            : 'bg-stone-100 text-stone-700 border-stone-200'
                        }`}
                      >
                        <Headphones className="w-3.5 h-3.5" />
                        <span>{allRecordings.length} تسجيل</span>
                      </span>

                      {completedCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            أُنجز {completedCount} من {allRecordings.length}
                          </span>
                        </span>
                      )}
                    </div>

                    <div>
                      <h2 className="text-xl sm:text-2xl font-extrabold leading-snug">
                        {track.title}
                      </h2>
                      <p
                        className={`text-xs sm:text-sm mt-1 font-medium ${
                          isDark ? 'text-stone-400' : 'text-stone-600'
                        }`}
                      >
                        {track.subtitle}
                      </p>
                    </div>

                    <p
                      className={`text-sm leading-relaxed ${
                        isDark ? 'text-stone-300' : 'text-stone-700'
                      }`}
                    >
                      {track.description}
                    </p>

                    {/* Author & Commentator Info */}
                    <div
                      className={`flex flex-wrap items-center gap-4 pt-1 text-xs ${
                        isDark ? 'text-stone-400' : 'text-stone-600'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 opacity-80" />
                        <span>المؤلف: {track.author}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 opacity-80" />
                        <span>الشارح: {track.commentator}</span>
                      </span>
                      {progress?.lastChapterTitle && (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-amber-500">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>آخر درس: {progress.lastChapterTitle}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CTA Column */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onSelectTrack(track.id)}
                      className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold shadow-lg transition-all active:scale-[0.98] ${primaryBtnClass}`}
                    >
                      <span>{hasStarted ? 'متابعة المسار الآن' : 'ابدأ المسار الآن'}</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>

                    {track.telegramStartUrl && (
                      <a
                        href={track.telegramStartUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium border transition-colors ${
                          isDark
                            ? 'border-stone-700 text-stone-300 hover:bg-stone-800'
                            : 'border-stone-200 text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        <span>مصدر السلسلة على تيليجرام</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Note */}
        <div className="mt-8 flex items-center justify-center">
          <button
            type="button"
            onClick={onBackToHero}
            className={`text-xs sm:text-sm font-semibold underline underline-offset-4 transition-opacity hover:opacity-80 ${
              isDark ? 'text-stone-400' : 'text-stone-600'
            }`}
          >
            العودة إلى الرئيسية للمدارسة الذكية
          </button>
        </div>
      </main>
    </div>
  );
};
