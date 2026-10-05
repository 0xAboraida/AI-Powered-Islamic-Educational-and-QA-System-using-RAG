import React, { useState, useRef } from 'react';
import { Scholar } from '../../../lessons/data/mockData';
import { X, Upload, Check, RefreshCw, User, Globe, MessageSquare, Play } from 'lucide-react';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
                <img src={avatar} alt={name} className="w-full h-full object-cover" />
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
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-all shadow-sm"
                >
                  <Upload size={13} />
                  <span>رفع صورة مخصصة من الجهاز</span>
                </button>

                {originalAvatar && avatar !== originalAvatar && (
                  <button
                    type="button"
                    onClick={handleResetAvatar}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white text-xs transition-all"
                  >
                    <RefreshCw size={12} />
                    <span>استعادة صورة يوتيوب</span>
                  </button>
                )}
              </div>
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
                <label className="block text-[11px] text-neutral-500 mb-1 flex items-center gap-1.5">
                  <Play size={12} className="text-red-500" fill="currentColor" />
                  <span>رابط قناة اليوتيوب</span>
                </label>
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-neutral-600 transition-colors"
                  placeholder="https://youtube.com/@channel"
                />
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
