import React, { useState, useRef } from 'react';
import { Scholar } from '../../../lessons/data/mockData';
import { X, Upload, Check, RefreshCw, User, Globe, MessageSquare, Play, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { ScholarAvatar } from '../../../../components/common/ScholarAvatar';
import { extractHandleFromUrl, getChannelInfo } from '../../../../services/youtube.api';

interface ScholarEditModalProps {
  scholar: Scholar;
  originalAvatar?: string;
  onSave: (updated: Scholar) => void;
  onClose: () => void;
}

export const ScholarEditModal: React.FC<ScholarEditModalProps> = ({
  scholar,
  originalAvatar,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(scholar.name || '');
  const [bio, setBio] = useState(scholar.bio || '');
  const [specialty, setSpecialty] = useState(scholar.specialty || 'عالم وداعية إسلامي');
  const [avatar, setAvatar] = useState(scholar.avatar || '');
  const [youtubeUrl, setYoutubeUrl] = useState(scholar.youtubeUrl || '');
  const [telegramUrl, setTelegramUrl] = useState(scholar.socialLinks?.telegram || '');
  const [websiteUrl, setWebsiteUrl] = useState(scholar.socialLinks?.website || '');
  const [isFetchingYoutubeAvatar, setIsFetchingYoutubeAvatar] = useState(false);
  const [youtubeAvatarError, setYoutubeAvatarError] = useState('');
  const [avatarSuccessMessage, setAvatarSuccessMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle local image file upload with client-side canvas compression (max 400x400 ~30KB)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setYoutubeAvatarError('');
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setAvatar(compressedDataUrl);
          setAvatarSuccessMessage('تم تحميل وضغط الصورة من جهازك بنجاح');
          setTimeout(() => setAvatarSuccessMessage(''), 4000);
        } else if (typeof reader.result === 'string') {
          setAvatar(reader.result);
        }
      };
      if (typeof reader.result === 'string') {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  // Fetch official channel avatar directly from YouTube link
  const handleFetchAvatarFromYoutube = async () => {
    if (!youtubeUrl.trim()) {
      setYoutubeAvatarError('يرجى إدخال أو لصق رابط قناة اليوتيوب أولاً بالأسفل.');
      return;
    }
    setIsFetchingYoutubeAvatar(true);
    setYoutubeAvatarError('');
    setAvatarSuccessMessage('');

    try {
      let identifier = youtubeUrl.trim();
      let isHandle = false;

      const extracted = extractHandleFromUrl(identifier);
      if (extracted) {
        identifier = extracted;
        isHandle = true;
      } else if (identifier.includes('youtube.com/channel/')) {
        identifier = identifier.split('youtube.com/channel/')[1].split('/')[0].split('?')[0];
        isHandle = false;
      } else if (identifier.startsWith('@')) {
        isHandle = true;
      }

      const channel = await getChannelInfo(identifier, isHandle);
      if (!channel) {
        throw new Error('لم يتم العثور على القناة. تأكد من صحة الرابط أو المعرف.');
      }

      const channelAvatar =
        channel.snippet?.thumbnails?.high?.url ||
        channel.snippet?.thumbnails?.medium?.url ||
        channel.snippet?.thumbnails?.default?.url ||
        '';

      if (!channelAvatar) {
        throw new Error('لم يتم العثور على صورة شخصية لهذه القناة في YouTube.');
      }

      setAvatar(channelAvatar);
      setAvatarSuccessMessage('تم جلب صورة القناة الرسمية بنجاح من YouTube! ✨');
      setTimeout(() => setAvatarSuccessMessage(''), 5000);
    } catch (err: any) {
      setYoutubeAvatarError(err.message || 'تعذر جلب صورة القناة.');
    } finally {
      setIsFetchingYoutubeAvatar(false);
    }
  };

  const handleResetAvatar = () => {
    if (originalAvatar) {
      setAvatar(originalAvatar);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updated: Scholar = {
      ...scholar,
      name: name.trim(),
      bio: bio.trim(),
      specialty: specialty.trim(),
      avatar: avatar.trim(),
      youtubeUrl: youtubeUrl.trim(),
      socialLinks: {
        ...scholar.socialLinks,
        telegram: telegramUrl.trim(),
        website: websiteUrl.trim(),
      },
    };

    onSave(updated);
  };

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
              <User size={18} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">مراجعة وتعديل بيانات الشيخ</h3>
              <p className="text-xs text-neutral-400">تخصيص الاسم، الصورة الشخصية، التخصص وروابط القنوات</p>
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar">
          {/* Avatar Upload Section */}
          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex flex-col sm:flex-row items-center gap-5">
            <div className="relative w-24 h-24 rounded-full p-1 bg-gradient-to-b from-neutral-600 to-neutral-800 shadow-xl shrink-0">
              <div className="w-full h-full rounded-full overflow-hidden bg-black border border-neutral-800">
                <ScholarAvatar src={avatar} name={name} />
              </div>
            </div>

            <div className="flex-1 text-center sm:text-right space-y-2">
              <span className="text-xs font-bold text-neutral-300 block">الصورة الشخصية للشيخ</span>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                يمكنك استخدام صورة القناة الأصلية أو رفع صورة عالية الجودة من جهازك.
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-all shadow-sm cursor-pointer"
                >
                  <Upload size={13} />
                  <span>رفع صورة مخصصة من الجهاز</span>
                </button>

                <button
                  type="button"
                  onClick={handleFetchAvatarFromYoutube}
                  disabled={isFetchingYoutubeAvatar}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  title="جلب وتعيين الصورة الشخصية من رابط قناة اليوتيوب المكتوب بالأسفل"
                >
                  {isFetchingYoutubeAvatar ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Play size={12} fill="currentColor" />
                  )}
                  <span>جلب صورة قناة YouTube</span>
                </button>

                {avatar && (
                  <button
                    type="button"
                    onClick={() => setAvatar('')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white text-xs transition-all cursor-pointer"
                    title="الرجوع إلى الوسام والطغراء الإسلامية المذهبة بالاسم"
                  >
                    <Sparkles size={12} className="text-amber-400" />
                    <span>الوسام المذهب</span>
                  </button>
                )}

                {originalAvatar && avatar !== originalAvatar && (
                  <button
                    type="button"
                    onClick={handleResetAvatar}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white text-xs transition-all cursor-pointer"
                  >
                    <RefreshCw size={12} />
                    <span>استعادة الصورة السابقة</span>
                  </button>
                )}
              </div>

              {avatarSuccessMessage && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold pt-1">
                  <CheckCircle2 size={13} />
                  <span>{avatarSuccessMessage}</span>
                </div>
              )}
              {youtubeAvatarError && (
                <div className="text-xs text-rose-400 font-medium pt-1">
                  {youtubeAvatarError}
                </div>
              )}
            </div>
          </div>

          {/* Name & Specialty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-1.5">
                اسم الشيخ / المحاضر <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-white transition-colors"
                placeholder="مثال: الشيخ محمد إسماعيل المقدم"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-1.5">
                التخصص أو اللقب العلمي
              </label>
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-white transition-colors"
                placeholder="مثال: عقيدة ومنهج وتزكية"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-1.5">
              نبذة تعريفية عن الشيخ ومؤلفاته
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs sm:text-sm p-3.5 rounded-xl focus:outline-none focus:border-white transition-colors resize-none leading-relaxed"
              placeholder="نبذة عن الشيخ، تخرجه، شيوخه، وأبرز مصنفاته وجهوده العلمية..."
            />
          </div>

          {/* Social Links */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold text-neutral-400 block border-b border-neutral-900 pb-1.5">
              قنوات وروابط الشيخ المعتمدة
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-neutral-500 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Play size={12} className="text-red-500" fill="currentColor" />
                    <span>رابط قناة اليوتيوب</span>
                  </span>
                  {youtubeUrl && (
                    <button
                      type="button"
                      onClick={handleFetchAvatarFromYoutube}
                      disabled={isFetchingYoutubeAvatar}
                      className="text-[10px] text-red-400 hover:text-red-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="استخراج وتعيين صورة القناة"
                    >
                      {isFetchingYoutubeAvatar ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                      <span>جلب صورة البروفايل منها</span>
                    </button>
                  )}
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="flex-1 bg-neutral-900 border border-neutral-800 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-neutral-600 transition-colors"
                    placeholder="https://youtube.com/@channel"
                  />
                  <button
                    type="button"
                    onClick={handleFetchAvatarFromYoutube}
                    disabled={isFetchingYoutubeAvatar || !youtubeUrl.trim()}
                    className="px-2.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 hover:text-white text-[11px] font-bold transition-all disabled:opacity-40 flex items-center gap-1 shrink-0 cursor-pointer"
                    title="جلب الصورة الشخصية للقناة"
                  >
                    {isFetchingYoutubeAvatar ? <Loader2 size={12} className="animate-spin" /> : <Play size={11} fill="currentColor" />}
                    <span>جلب الصورة</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-500 mb-1 flex items-center gap-1.5">
                  <MessageSquare size={13} className="text-sky-400" />
                  <span>قناة التيليجرام الرسمية</span>
                </label>
                <input
                  type="text"
                  value={telegramUrl}
                  onChange={(e) => setTelegramUrl(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-neutral-600 transition-colors"
                  placeholder="https://t.me/channel"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] text-neutral-500 mb-1 flex items-center gap-1.5">
                  <Globe size={13} className="text-emerald-400" />
                  <span>الموقع الرسمي أو رابط آخر</span>
                </label>
                <input
                  type="text"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-neutral-600 transition-colors"
                  placeholder="https://example.com"
                />
              </div>
            </div>
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
              <Check size={14} />
              <span>حفظ واعتماد بيانات الشيخ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
