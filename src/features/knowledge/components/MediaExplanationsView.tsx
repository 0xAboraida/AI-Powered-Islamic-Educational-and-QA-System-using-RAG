import React, { useState } from 'react';
import { 
  Video, 
  Mic, 
  Search, 
  BookOpen, 
  Sparkles, 
  User, 
  Play, 
  ExternalLink, 
  Layers, 
  Filter,
  CheckCircle2,
  ListMusic,
  ArrowLeft
} from 'lucide-react';
import { Sheikh, MediaPlaylist, MediaStandalone } from '../types/mediaTypes';
import SheikhProfileModal from './SheikhProfileModal';

interface MediaExplanationsViewProps {
  sheikhs: Sheikh[];
  playlists: MediaPlaylist[];
  standaloneItems: MediaStandalone[];
  onOpenLinkedBook?: (bookTitle: string) => void;
}

export default function MediaExplanationsView({
  sheikhs,
  playlists,
  standaloneItems,
  onOpenLinkedBook
}: MediaExplanationsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [selectedSheikhForModal, setSelectedSheikhForModal] = useState<Sheikh | null>(null);

  // Filtered Sheikhs
  const filteredSheikhs = sheikhs.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Featured Playlists for quick showcase (مثل شرح الفقه الميسر للشيخ علاء حامد)
  const featuredPlaylists = playlists.slice(0, 4);

  return (
    <div className="animate-in fade-in duration-300 space-y-8">
      {/* Hero Header for Media */}
      <div className="relative rounded-3xl overflow-hidden p-6 sm:p-10 bg-gradient-to-r from-[#1c0836] via-[#2a0d4f] to-[#120526] text-white border border-purple-500/30 shadow-2xl">
        <div className="pointer-events-none absolute -left-20 -top-20 w-80 h-80 rounded-full bg-brand-magenta/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-brand-blue/20 blur-3xl" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-amber-300 mb-4 shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>المكتبة الصوتية والمرئية التفاعلية</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight mb-3">
            الشروح المرئية والصوتية لأمهات كتب التراث
          </h2>
          <p className="text-sm sm:text-base text-purple-200/90 leading-relaxed max-w-2xl mb-6">
            استمع وشاهد شروح كبار العلماء والدعاة لمتون وكتب المكتبة، تصفح بروفايل كل شيخ، وادرس سلاسل الفقه والعقيدة والحديث مع إمكانية تصفح متن الكتاب المشروح بنقرة زر.
          </p>

          {/* Quick Search */}
          <div className="relative max-w-xl">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم الشيخ، الشرح، أو التخصص الشرعي..."
              className="w-full py-3.5 pr-11 pl-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm font-bold backdrop-blur-md outline-none focus:border-brand-magenta focus:bg-white/15 transition-all shadow-inner"
            />
            <Search className="w-5 h-5 text-white/60 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Featured Playlist Spotlight (إبراز شرح الفقه الميسر للشيخ علاء حامد وسلاسل كبرى) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-magenta/10 dark:bg-brand-magenta/20 text-brand-magenta flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                أبرز السلاسل والشروح المرئية المختارة
              </h3>
              <p className="text-xs text-muted-foreground">شروح معتمدة مرتبطة بمتون مكتبة زاد</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {featuredPlaylists.map((pl) => (
            <div 
              key={pl.id}
              className="rounded-2xl border border-slate-200/80 dark:border-purple-500/20 bg-white dark:bg-[#14062b] p-5 shadow-sm hover:shadow-xl hover:border-brand-magenta/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-brand-magenta/10 text-brand-magenta border border-brand-magenta/20">
                    {pl.category}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                    <Layers className="w-3.5 h-3.5 text-brand-blue" />
                    {pl.totalEpisodes} درس
                  </span>
                </div>

                <h4 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white line-clamp-2 mb-1">
                  {pl.title}
                </h4>
                <p className="text-xs text-brand-blue font-bold mb-2">
                  الشارح: {pl.sheikhName}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                  {pl.description}
                </p>

                {pl.linkedBook && (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <BookOpen className="w-4 h-4 text-brand-magenta shrink-0" />
                      <span className="text-xs font-bold text-foreground truncate">
                        {pl.linkedBook.bookTitle}
                      </span>
                    </div>
                    {onOpenLinkedBook && (
                      <button
                        type="button"
                        onClick={() => onOpenLinkedBook(pl.linkedBook!.bookTitle)}
                        className="text-xs font-bold text-brand-magenta hover:underline shrink-0"
                      >
                        مطالعة المتن 📖
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center gap-2">
                <a
                  href={pl.playlistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 rounded-xl bg-brand-magenta text-white text-xs font-bold hover:bg-brand-deep transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-brand-magenta/20"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>فتح السلسلة</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>

                <button
                  type="button"
                  onClick={() => {
                    const sh = sheikhs.find(s => s.id === pl.sheikhId);
                    if (sh) setSelectedSheikhForModal(sh);
                  }}
                  className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-white/10 text-xs font-bold hover:bg-slate-200 dark:hover:bg-white/20 transition-all flex items-center gap-1"
                  title="فتح بروفايل الشيخ"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>بروفايل الشيخ</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Directory of Scholars & Sheikhs (دليل الشيوخ والعلماء والشارحين) */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-blue/10 dark:bg-brand-blue/20 text-brand-blue flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                دليل الشيوخ والشارحين ({filteredSheikhs.length})
              </h3>
              <p className="text-xs text-muted-foreground">اضغط على أي شيخ للدخول إلى بروفايله الخاص وقسم الشروحات الصوتية والمرئية</p>
            </div>
          </div>
        </div>

        {/* Scholars Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSheikhs.map((sheikh) => (
            <div
              key={sheikh.id}
              onClick={() => setSelectedSheikhForModal(sheikh)}
              className="group cursor-pointer rounded-3xl border border-slate-200/80 dark:border-purple-500/20 bg-white dark:bg-[#14062b] p-5 shadow-sm hover:shadow-xl hover:border-brand-magenta/50 transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 w-28 h-28 rounded-full bg-brand-magenta/5 group-hover:bg-brand-magenta/15 blur-xl transition-all" />

              <div>
                {/* Top Sheikh Row */}
                <div className="flex items-start gap-3.5 mb-3">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-brand-magenta/30 group-hover:border-brand-magenta transition-all shrink-0 shadow-sm">
                    <img 
                      src={sheikh.avatar} 
                      alt={sheikh.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-brand-magenta transition-colors truncate">
                      {sheikh.name}
                    </h4>
                    <p className="text-xs text-muted-foreground font-semibold truncate mt-0.5">
                      {sheikh.title}
                    </p>
                    <span className="inline-block px-2 py-0.5 mt-1.5 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                      {sheikh.specialty.split('،')[0]}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                  {sheikh.bio}
                </p>

                {/* Stats Bar including Authored Books Count */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-slate-50 dark:bg-black/30 border border-slate-200/60 dark:border-white/5 text-center mb-4">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">الكتب المؤلفة</span>
                    <span className="text-xs font-black text-brand-magenta font-mono">
                      {sheikh.stats.authored_books_count} كتب
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">سلاسل مرئية</span>
                    <span className="text-xs font-black text-brand-blue font-mono">
                      {sheikh.stats.total_video_playlists}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">سلاسل صوتية</span>
                    <span className="text-xs font-black text-emerald-500 font-mono">
                      {sheikh.stats.total_audio_playlists}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-white/10 group-hover:bg-brand-magenta group-hover:text-white text-xs font-extrabold transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <span>دخول بروفايل الشيخ والشروح</span>
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Sheikh Profile Modal */}
      {selectedSheikhForModal && (
        <SheikhProfileModal
          sheikh={selectedSheikhForModal}
          playlists={playlists}
          standaloneItems={standaloneItems}
          onClose={() => setSelectedSheikhForModal(null)}
          onOpenLinkedBook={onOpenLinkedBook}
        />
      )}
    </div>
  );
}
