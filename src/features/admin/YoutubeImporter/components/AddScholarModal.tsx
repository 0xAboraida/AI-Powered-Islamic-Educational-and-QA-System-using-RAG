import React, { useState, useRef } from 'react';
import { Scholar } from '../../../lessons/data/mockData';
import { extractHandleFromUrl, getChannelInfo } from '../../../../services/youtube.api';
import { X, Upload, Plus, Play, User, Loader2, Sparkles } from 'lucide-react';
import { ScholarAvatar } from '../../../../components/common/ScholarAvatar';

interface AddScholarModalProps {
  onSave: (newScholar: Scholar) => void;
  onClose: () => void;
}

export const AddScholarModal: React.FC<AddScholarModalProps> = ({ onSave, onClose }) => {
  const [mode, setMode] = useState<'youtube' | 'manual'>('youtube');
  
  // YouTube fetch state
  const [youtubeChannelUrl, setYoutubeChannelUrl] = useState('');
  const [isFetchingChannel, setIsFetchingChannel] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // Scholar profile form fields
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [specialty, setSpecialty] = useState('عالم وداعية إسلامي');
  const [avatar, setAvatar] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [telegramUrl, setTelegramUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [customId, setCustomId] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch YouTube Channel Info to Pre-fill form
  const handleFetchChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeChannelUrl.trim()) return;

    setIsFetchingChannel(true);
    setFetchError('');

    try {
      let identifier = youtubeChannelUrl.trim();
      let isHandle = false;

      if (identifier.includes('youtube.com')) {
        const extracted = extractHandleFromUrl(identifier);
        if (extracted) {
          identifier = extracted;
          isHandle = true;
        }
      } else if (identifier.startsWith('@')) {
        isHandle = true;
      }

      const channel = await getChannelInfo(identifier, isHandle);
      if (!channel) {
        throw new Error('لم يتم العثور على القناة. تحقق من صحة الرابط أو المعرف.');
      }

      // Pre-fill form with clean values
      setName(channel.snippet.title || '');
      setBio(channel.snippet.description || '');
      setAvatar(
        channel.snippet.thumbnails.high?.url || 
        channel.snippet.thumbnails.medium?.url || 
        channel.snippet.thumbnails.default?.url || 
        ''
      );
      setYoutubeUrl(`https://youtube.com/channel/${channel.id}`);
      setCustomId(channel.id);

    } catch (err: any) {
      setFetchError(err.message || 'حدث خطأ أثناء جلب القناة.');
    } finally {
      setIsFetchingChannel(false);
    }
  };

  // Handle local image file upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit and Create Scholar
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('يرجى كتابة اسم الشيخ.');
      return;
    }

    const scholarId = customId.trim() || `scholar_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const newScholar: Scholar = {
      id: scholarId,
      name: name.trim(),
      bio: bio.trim(),
      specialty: specialty.trim() || 'عالم وداعية إسلامي',
      avatar: avatar.trim() || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
      youtubeUrl: youtubeUrl.trim(),
      socialLinks: {
        telegram: telegramUrl.trim(),
        website: websiteUrl.trim(),
      },
    };

    onSave(newScholar);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      dir="rtl"
    >
      <div 
        className="relative w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800 bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <Plus size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">تسجيل شيخ جديد في المنصة</h3>
              <p className="text-xs text-neutral-400">
                أنشئ بروفايلاً مستقلاً للشيخ ليحتوي على جميع سلاسله وقنواته المتعددة
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-6 pt-4 border-b border-neutral-900 flex gap-4">
          <button
            type="button"
            onClick={() => setMode('youtube')}
            className={`flex items-center gap-2 pb-3 font-bold text-xs border-b-2 transition-all ${
              mode === 'youtube'
                ? 'border-white text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Play size={15} className="text-red-500" fill="currentColor" />
            <span>جلب سريع من قناة YouTube أولى</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`flex items-center gap-2 pb-3 font-bold text-xs border-b-2 transition-all ${
              mode === 'manual'
                ? 'border-white text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <User size={15} />
            <span>تسجيل يدوي كامل</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {/* Quick YouTube Fetch Box */}
          {mode === 'youtube' && (
            <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800 space-y-3">
              <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-400" />
                <span>جلب الاسم والنبذة والصورة تلقائياً من يوتيوب:</span>
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={youtubeChannelUrl}
                  onChange={(e) => setYoutubeChannelUrl(e.target.value)}
                  placeholder="رابط أو معرف القناة (مثال: @almukaddem أو رابط القناة)..."
                  className="flex-1 bg-neutral-950 border border-neutral-800 text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-white transition-colors"
                />
                <button
                  type="button"
                  onClick={handleFetchChannel}
                  disabled={isFetchingChannel || !youtubeChannelUrl.trim()}
                  className="px-4 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 disabled:opacity-40 transition-all flex items-center gap-1.5 shrink-0"
                >
                  {isFetchingChannel ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} className="text-red-600" fill="currentColor" />}
                  <span>جلب البيانات</span>
                </button>
              </div>
              {fetchError && <p className="text-red-400 text-xs">{fetchError}</p>}
            </div>
          )}

          {/* Avatar Preview & Upload */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800/80">
            <div className="relative w-20 h-20 rounded-full p-0.5 bg-gradient-to-b from-neutral-600 to-neutral-800 shadow-xl shrink-0">
              <div className="w-full h-full rounded-full overflow-hidden bg-neutral-900 border border-neutral-800">
                <ScholarAvatar src={avatar} name={name} />
              </div>
            </div>

            <div className="space-y-2 text-center sm:text-right flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs border border-neutral-700 transition-all flex items-center gap-1.5"
                >
                  <Upload size={13} />
                  <span>رفع صورة مخصصة</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <input
                type="text"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="أو الصق رابط صورة مباشرة..."
                className="w-full bg-neutral-950 border border-neutral-800 text-white px-3 py-1.5 rounded-xl text-xs focus:outline-none focus:border-white transition-colors"
              />
            </div>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-xs font-bold text-neutral-300 mb-1.5">
              اسم الشيخ النظيف (الذي سيظهر للمستخدم في المنصة) *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: د. ياسر برهامي (بدون عبارات القناة الرسمية)..."
              className="w-full bg-neutral-900 border border-neutral-800 text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-white transition-colors"
            />
          </div>

          {/* Specialty */}
          <div>
            <label className="block text-xs font-bold text-neutral-300 mb-1.5">
              التخصص أو الوصف المختصر
            </label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="مثال: عالم فقيه وداعية إسلامي"
              className="w-full bg-neutral-900 border border-neutral-800 text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-white transition-colors"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-bold text-neutral-300 mb-1.5">
              النبذة التعريفية عن الشيخ
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="اكتب نبذة تعريفية موجزة عن الشيخ ودروسه..."
              className="w-full bg-neutral-900 border border-neutral-800 text-white px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-white transition-colors leading-relaxed resize-none"
            />
          </div>

          {/* Official YouTube Channel */}
          <div>
            <label className="block text-xs font-bold text-neutral-300 mb-1.5">
              رابط قناة YouTube الرئيسية للشيخ (اختياري)
            </label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtube.com/@channel"
              className="w-full bg-neutral-900 border border-neutral-800 text-white px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-white transition-colors"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-semibold text-xs transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-6 py-2.5 rounded-xl bg-white hover:bg-neutral-200 disabled:opacity-40 text-black font-bold text-xs transition-all shadow-sm flex items-center gap-2"
            >
              <Plus size={15} />
              <span>تسجيل الشيخ في المنصة</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
