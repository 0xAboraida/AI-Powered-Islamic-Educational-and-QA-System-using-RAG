import React, { useState, useRef } from 'react';
import { ExplanationSeries } from '../../../lessons/data/mockData';
import { X, Plus, Upload, Video, Headphones, BookOpen, GraduationCap, Send, ExternalLink, FileText, Mic, Film, Smartphone } from 'lucide-react';

interface AddManualContentModalProps {
  scholarId: string;
  scholarName: string;
  onSave: (series: ExplanationSeries) => void;
  onClose: () => void;
}

export const AddManualContentModal: React.FC<AddManualContentModalProps> = ({
  scholarId,
  scholarName,
  onSave,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'visual' | 'podcast' | 'audio' | 'book' | 'course' | 'standalone' | 'shorts'>('visual');
  const [source, setSource] = useState<'youtube' | 'telegram' | 'direct' | 'pdf'>('telegram');
  const [url, setUrl] = useState('');
  const [videoCount, setVideoCount] = useState<number>(1);
  const [thumbnail, setThumbnail] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setThumbnail(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    const newSeries: ExplanationSeries = {
      id: `manual_${Date.now()}`,
      scholarId,
      title: title.trim(),
      description: description.trim(),
      type,
      source,
      url: url.trim(),
      videoCount: Number(videoCount) || 1,
      thumbnail: thumbnail.trim() || 'https://images.unsplash.com/photo-1584286595398-a59f21d313f5?w=500&auto=format&fit=crop&q=60',
    };

    onSave(newSeries);
  };

  const typeOptions = [
    { id: 'visual', label: 'شروحات مرئية', icon: Video },
    { id: 'standalone', label: 'محاضرات ومقاطع عامة', icon: Film },
    { id: 'shorts', label: 'المقاطع القصيرة', icon: Smartphone },
    { id: 'podcast', label: 'بودكاست 🎙️', icon: Mic },
    { id: 'audio', label: 'شروحات صوتية', icon: Headphones },
    { id: 'book', label: 'كتب ومصنفات', icon: BookOpen },
    { id: 'course', label: 'دورات حالية', icon: GraduationCap },
  ] as const;

  const sourceOptions = [
    { id: 'telegram', label: 'تيليجرام (Telegram)', hint: 'رابط قناة أو رسالة تيليجرام' },
    { id: 'youtube', label: 'يوتيوب (YouTube)', hint: 'رابط قائمة أو فيديو' },
    { id: 'direct', label: 'ملف مباشر / موقع', hint: 'رابط مباشر أو صفحة ويب' },
    { id: 'pdf', label: 'كتاب PDF / الشاملة', hint: 'رابط تنزيل أو قراءة الكتاب' },
  ] as const;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      dir="rtl"
    >
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-neutral-950 border border-neutral-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 bg-black/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white">
              <Plus size={18} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">إضافة سلسلة أو كتاب يدوياً للشيخ</h3>
              <p className="text-xs text-neutral-400">إضافة شروحات تيليجرام، صوتيات، كتب، أو دورات لـ {scholarName}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar">
          {/* Section Type */}
          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-2">
              القسم المستهدف في بروفايل الشيخ <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {typeOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = type === opt.id;
                return (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => setType(opt.id)}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all text-xs font-bold ${
                      isSelected
                        ? 'bg-white text-black border-white shadow-md'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Source Selector */}
          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-2">
              مصدر المحتوى (المنصة) <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {sourceOptions.map((src) => {
                const isSelected = source === src.id;
                return (
                  <button
                    type="button"
                    key={src.id}
                    onClick={() => setSource(src.id)}
                    className={`p-2.5 rounded-xl border transition-all text-right ${
                      isSelected
                        ? 'bg-neutral-800 border-white text-white'
                        : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <span className="block text-xs font-bold">{src.label}</span>
                    <span className="block text-[10px] text-neutral-500 truncate">{src.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title & URL */}
          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-1.5">
              عنوان السلسلة أو الكتاب أو الدورة <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-white transition-colors"
              placeholder="مثال: شرح كتاب التوحيد عبر تيليجرام"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-neutral-400 mb-1.5">
                الرابط المباشر (تيليجرام / يوتيوب / PDF / موقع) <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-white transition-colors"
                placeholder="https://t.me/channel_name/1234"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-1.5">
                {type === 'book' ? 'عدد الصفحات' : 'عدد الدروس/الحلقات'}
              </label>
              <input
                type="number"
                min="1"
                value={videoCount}
                onChange={(e) => setVideoCount(Number(e.target.value))}
                className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-white transition-colors"
              />
            </div>
          </div>

          {/* Thumbnail / Cover Image */}
          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-1.5">
              صورة الغلاف أو الشعار
            </label>
            <div className="flex items-center gap-3">
              {thumbnail ? (
                <img src={thumbnail} alt="Cover preview" className="w-16 h-12 object-cover rounded-xl border border-neutral-800 shrink-0" />
              ) : (
                <div className="w-16 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-600 text-xs shrink-0">
                  غلاف
                </div>
              )}
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleThumbnailUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white text-xs transition-all"
              >
                <Upload size={13} />
                <span>اختيار صورة من الجهاز</span>
              </button>

              <input
                type="text"
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
                placeholder="أو ضع رابط صورة مباشر..."
                className="flex-1 bg-neutral-900 border border-neutral-800 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-neutral-600 transition-colors"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-1.5">
              نبذة ووصف المحتوى
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs sm:text-sm p-3.5 rounded-xl focus:outline-none focus:border-white transition-colors resize-none leading-relaxed"
              placeholder="وصف مختصر لموضوع السلسلة أو محتويات الكتاب وأهميته لطلبة العلم..."
            />
          </div>

          {/* Footer actions */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white text-xs font-semibold transition-all"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-all shadow-md"
            >
              <Plus size={14} />
              <span>إضافة السلسلة إلى المنصة</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
