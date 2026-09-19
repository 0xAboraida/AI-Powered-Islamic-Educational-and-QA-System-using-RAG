import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Video, 
  Mic, 
  ListMusic, 
  Layers, 
  Play, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  Share2,
  FileText
} from 'lucide-react';
import { Sheikh, MediaPlaylist, MediaStandalone } from '../types/mediaTypes';

interface SheikhProfileModalProps {
  sheikh: Sheikh;
  playlists: MediaPlaylist[];
  standaloneItems: MediaStandalone[];
  onClose: () => void;
  onOpenLinkedBook?: (bookTitle: string) => void;
}

export default function SheikhProfileModal({
  sheikh,
  playlists,
  standaloneItems,
  onClose,
  onOpenLinkedBook
}: SheikhProfileModalProps) {
  // Main Section: 'video' | 'audio'
  const [activeMediaSection, setActiveMediaSection] = useState<'audio' | 'video'>('video');
  // Sub-Tab: 'playlists' | 'standalone'
  const [activeSubTab, setActiveSubTab] = useState<'playlists' | 'standalone'>('playlists');

  // Active playing item modal or embed
  const [selectedEmbedUrl, setSelectedEmbedUrl] = useState<string | null>(null);

  // Filter items for this sheikh
  const sheikhPlaylists = playlists.filter(
    p => p.sheikhId === sheikh.id && p.mediaType === activeMediaSection
  );
  const sheikhStandalone = standaloneItems.filter(
    s => s.sheikhId === sheikh.id && s.mediaType === activeMediaSection
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-[#150628] border border-purple-200/80 dark:border-purple-500/30 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Sheikh Info */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-br from-brand-magenta/15 via-purple-500/5 to-brand-blue/15 border-b border-slate-200/80 dark:border-white/10 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 left-5 p-2 rounded-xl bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 text-muted-foreground hover:text-foreground transition-all"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-brand-magenta/40 shadow-lg shrink-0">
              <img 
                src={sheikh.avatar} 
                alt={sheikh.name} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback avatar
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-1">
                <span className="text-[10px] text-white/90 font-bold">{sheikh.specialty.split('،')[0]}</span>
              </div>
            </div>

            {/* Sheikh Bio & Info */}
            <div className="flex-1 text-center sm:text-right min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-magenta/10 dark:bg-brand-magenta/20 text-brand-magenta border border-brand-magenta/20 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>بروفايل الشيخ والشارح</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {sheikh.name}
              </h2>
              <p className="text-xs sm:text-sm text-brand-magenta font-semibold mt-0.5">
                {sheikh.title}
              </p>
              <p className="text-xs text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                {sheikh.bio}
              </p>

              {/* Sheikh Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3 border-t border-slate-200/60 dark:border-white/10">
                {/* 1. Authored Books Count (عدد الكتب المؤلفة) */}
                <div className="p-2.5 rounded-xl bg-white/70 dark:bg-black/30 border border-slate-200/60 dark:border-white/5 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-brand-magenta font-bold">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>الكتب المؤلفة</span>
                  </div>
                  <div className="text-lg font-black font-mono text-foreground mt-0.5">
                    {sheikh.stats.authored_books_count} <span className="text-[11px] font-normal text-muted-foreground">كتاب</span>
                  </div>
                </div>

                {/* 2. Video Playlists */}
                <div className="p-2.5 rounded-xl bg-white/70 dark:bg-black/30 border border-slate-200/60 dark:border-white/5 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-brand-blue font-bold">
                    <Video className="w-3.5 h-3.5" />
                    <span>سلاسل مرئية</span>
                  </div>
                  <div className="text-lg font-black font-mono text-foreground mt-0.5">
                    {sheikh.stats.total_video_playlists} <span className="text-[11px] font-normal text-muted-foreground">سلسلة</span>
                  </div>
                </div>

                {/* 3. Audio Playlists */}
                <div className="p-2.5 rounded-xl bg-white/70 dark:bg-black/30 border border-slate-200/60 dark:border-white/5 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-500 font-bold">
                    <Mic className="w-3.5 h-3.5" />
                    <span>سلاسل صوتية</span>
                  </div>
                  <div className="text-lg font-black font-mono text-foreground mt-0.5">
                    {sheikh.stats.total_audio_playlists} <span className="text-[11px] font-normal text-muted-foreground">سلسلة</span>
                  </div>
                </div>

                {/* 4. Standalone Lessons */}
                <div className="p-2.5 rounded-xl bg-white/70 dark:bg-black/30 border border-slate-200/60 dark:border-white/5 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-amber-500 font-bold">
                    <ListMusic className="w-3.5 h-3.5" />
                    <span>مواد متفرقة</span>
                  </div>
                  <div className="text-lg font-black font-mono text-foreground mt-0.5">
                    {sheikh.stats.total_audio_standalone + sheikh.stats.total_video_standalone} <span className="text-[11px] font-normal text-muted-foreground">درس</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Tabs Selector (قسم الشروحات الصوتية وقسم الشروحات المرئية) */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-black/20 shrink-0 flex flex-wrap items-center justify-between gap-3">
          {/* Main Media Section Tabs */}
          <div className="flex items-center gap-2 bg-slate-200/70 dark:bg-white/10 p-1 rounded-2xl">
            <button
              onClick={() => {
                setActiveMediaSection('video');
                setActiveSubTab('playlists');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeMediaSection === 'video'
                  ? 'bg-brand-magenta text-white shadow-md shadow-brand-magenta/25'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>قسم الشروحات المرئية</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                {playlists.filter(p => p.sheikhId === sheikh.id && p.mediaType === 'video').length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveMediaSection('audio');
                setActiveSubTab('playlists');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeMediaSection === 'audio'
                  ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/25'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>قسم الشروحات الصوتية</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                {playlists.filter(p => p.sheikhId === sheikh.id && p.mediaType === 'audio').length}
              </span>
            </button>
          </div>

          {/* Sub Tabs: قوائم تشغيل vs متفرقة */}
          <div className="flex items-center gap-1.5 bg-slate-200/50 dark:bg-black/40 p-1 rounded-xl border border-slate-200/60 dark:border-white/5">
            <button
              onClick={() => setActiveSubTab('playlists')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'playlists'
                  ? 'bg-white dark:bg-[#1a0836] text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-brand-magenta" />
              <span>قوائم التشغيل (السلاسل)</span>
            </button>
            <button
              onClick={() => setActiveSubTab('standalone')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'standalone'
                  ? 'bg-white dark:bg-[#1a0836] text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ListMusic className="w-3.5 h-3.5 text-brand-blue" />
              <span>شروحات متفرقة</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar space-y-4">
          {/* Sub-tab 1: قوائم التشغيل */}
          {activeSubTab === 'playlists' && (
            <div>
              {sheikhPlaylists.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-sm">لا توجد سلاسل {activeMediaSection === 'video' ? 'مرئية' : 'صوتية'} مسجلة لهذا الشيخ حالياً.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sheikhPlaylists.map((pl) => (
                    <div 
                      key={pl.id}
                      className="group rounded-2xl border border-slate-200/80 dark:border-purple-500/20 bg-white dark:bg-[#180730] p-4 shadow-sm hover:shadow-lg hover:border-brand-magenta/40 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Tag & Category */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-brand-magenta/10 text-brand-magenta border border-brand-magenta/20">
                            {pl.category}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                            <Layers className="w-3 h-3 text-brand-blue" />
                            {pl.totalEpisodes} درس مسجل
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="font-black text-base text-slate-900 dark:text-white group-hover:text-brand-magenta transition-colors line-clamp-2 mb-2">
                          {pl.title}
                        </h4>

                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                          {pl.description}
                        </p>

                        {/* Linked Book Badge (إن وجد) */}
                        {pl.linkedBook && (
                          <div className="p-2.5 rounded-xl bg-brand-magenta/5 border border-brand-magenta/15 flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <BookOpen className="w-4 h-4 text-brand-magenta shrink-0" />
                              <div className="min-w-0">
                                <span className="text-[10px] text-muted-foreground block">متن الكتاب المشروح:</span>
                                <span className="text-xs font-bold text-foreground truncate block">
                                  {pl.linkedBook.bookTitle}
                                </span>
                              </div>
                            </div>

                            {onOpenLinkedBook && (
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  onOpenLinkedBook(pl.linkedBook!.bookTitle);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-brand-magenta text-white text-[11px] font-bold hover:bg-brand-deep transition-all shrink-0 flex items-center gap-1 shadow-sm"
                                title="فتح متن الكتاب في مكتبة زاد للقراءة والمطالعة"
                              >
                                <FileText className="w-3 h-3" />
                                <span>تصفح المتن 📖</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center gap-2">
                        <a
                          href={pl.playlistUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 px-3 rounded-xl bg-brand-magenta text-white text-xs font-bold hover:bg-brand-deep transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-brand-magenta/20"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>مشاهدة قائمة التشغيل</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sub-tab 2: متفرقة */}
          {activeSubTab === 'standalone' && (
            <div>
              {sheikhStandalone.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-sm">لا توجد شروحات أو محاضرات متفرقة مسجلة لهذا الشيخ في هذا القسم.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sheikhStandalone.map((st) => (
                    <div 
                      key={st.id}
                      className="group rounded-2xl border border-slate-200/80 dark:border-purple-500/20 bg-white dark:bg-[#180730] p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[11px] font-bold text-brand-blue bg-brand-blue/10 px-2 py-0.5 rounded-md">
                            {st.category}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {st.duration}
                          </span>
                        </div>

                        <h4 className="font-bold text-sm sm:text-base text-foreground group-hover:text-brand-magenta transition-colors line-clamp-2 mb-2">
                          {st.title}
                        </h4>

                        {st.linkedBook && onOpenLinkedBook && (
                          <div className="text-xs text-muted-foreground mb-2 flex items-center justify-between">
                            <span className="truncate">مرتبط بكتاب: {st.linkedBook.bookTitle}</span>
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onOpenLinkedBook(st.linkedBook!.bookTitle);
                              }}
                              className="text-brand-magenta font-bold hover:underline shrink-0"
                            >
                              قراءة المتن 📖
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-white/5">
                        <a
                          href={st.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-brand-magenta hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>{activeMediaSection === 'video' ? 'مشاهدة المقطع' : 'استماع صوتي'}</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3.5 bg-slate-100/80 dark:bg-black/40 border-t border-slate-200/80 dark:border-white/10 text-center shrink-0">
          <p className="text-[11px] text-muted-foreground">
            تخضع جميع الشروح والدروس للمنهجية العلمية والتحقيق الشرعي المعتمد في منصة زاد الرقمية.
          </p>
        </div>
      </div>
    </div>
  );
}
