import React from 'react';
import { X, Send } from 'lucide-react';
import { TelegramPlayer } from './TelegramPlayer';

interface TelegramEmbedModalProps {
  url: string;
  title?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const TelegramEmbedModal: React.FC<TelegramEmbedModalProps> = ({
  url,
  title,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Send size={15} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">{title || 'معاينة وتشغيل محتوى تيليجرام'}</h3>
              <p className="text-[11px] text-neutral-400">تشغيل الصوت والتفريغ المباشر من تيليجرام</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
          <TelegramPlayer url={url} title={title} height={460} />
        </div>
      </div>
    </div>
  );
};
