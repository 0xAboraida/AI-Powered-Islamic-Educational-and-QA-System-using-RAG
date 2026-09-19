import React from 'react';
import { X, Settings, Sun, Moon, Layers as LayersIcon, Type } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: string;
  toggleTheme: () => void;
  overlayOpacity: number;
  onOverlayOpacityChange: (val: number) => void;
  fontSize: 'small' | 'medium' | 'large';
  onFontSizeChange: (size: 'small' | 'medium' | 'large') => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  theme,
  toggleTheme,
  overlayOpacity,
  onOverlayOpacityChange,
  fontSize,
  onFontSizeChange
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-white dark:bg-[#121624] rounded-3xl border border-slate-200 dark:border-white/10 p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute left-5 top-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-white/5 pb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-magenta to-brand-deep text-white flex items-center justify-center shrink-0 shadow-md">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">الإعدادات والمظهر</h3>
            <p className="text-xs text-muted-foreground mt-0.5">خصص تجربة القراءة والشكل حسب رغبتك</p>
          </div>
        </div>

        {/* Settings Content */}
        <div className="space-y-6">
          
          {/* 1. Theme Toggle */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200/60 dark:border-white/5 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">مظهر المنصة (إضاءة)</h4>
              <p className="text-xs text-muted-foreground mt-1">التبديل بين الوضع الليلي والنهاري</p>
            </div>
            
            <button
              onClick={toggleTheme}
              className="relative w-16 h-8 rounded-full bg-slate-200 dark:bg-[#1a0836] border border-slate-300 dark:border-purple-500/30 transition-colors flex items-center shadow-inner overflow-hidden shrink-0"
              title="تبديل المظهر"
            >
              {/* Slider thumb */}
              <div 
                className={`absolute w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center transition-all duration-300 ${
                  theme === 'dark' ? 'translate-x-1' : '-translate-x-[34px]'
                }`}
              >
                {theme === 'dark' ? (
                  <Moon className="w-3.5 h-3.5 text-brand-magenta fill-current" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-500 fill-current" />
                )}
              </div>
            </button>
          </div>

          {/* 2. Overlay Opacity Slider */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200/60 dark:border-white/5 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <LayersIcon className="w-4 h-4 text-brand-magenta" />
                  كثافة الظل
                </h4>
                <p className="text-xs text-muted-foreground mt-1">التحكم في تعتيم الخلفية للمساعدة على القراءة</p>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-brand-magenta/10 text-brand-magenta text-xs font-bold font-mono">
                {overlayOpacity}%
              </div>
            </div>
            
            <div className="pt-2">
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={overlayOpacity}
                onChange={(e) => onOverlayOpacityChange(parseInt(e.target.value, 10))}
                className="w-full h-2.5 bg-slate-200 dark:bg-white/10 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-brand-magenta [&::-webkit-slider-thumb]:rounded-full cursor-pointer [&::-webkit-slider-thumb]:shadow-md hover:[&::-webkit-slider-thumb]:scale-110 transition-all"
                style={{
                  background: `linear-gradient(to left, var(--tw-gradient-stops))`,
                  // Fake gradient track fill logic can be added, but native tailwind is simple enough
                }}
              />
            </div>
          </div>

          {/* 3. Font Size Control */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200/60 dark:border-white/5 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Type className="w-4 h-4 text-brand-blue" />
                حجم خط القراءة
              </h4>
              <p className="text-xs text-muted-foreground mt-1">تكبير أو تصغير الخطوط في صفحات الكتب</p>
            </div>
            
            <div className="flex items-center gap-2 p-1 bg-slate-200/50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
              <button
                onClick={() => onFontSizeChange('small')}
                className={`flex-1 py-2 text-center text-sm transition-all rounded-lg ${
                  fontSize === 'small' 
                    ? 'bg-white dark:bg-[#1a0836] text-brand-blue font-bold shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Aa (صغير)
              </button>
              
              <button
                onClick={() => onFontSizeChange('medium')}
                className={`flex-1 py-2 text-center text-base transition-all rounded-lg ${
                  fontSize === 'medium' 
                    ? 'bg-white dark:bg-[#1a0836] text-brand-blue font-bold shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Aa (متوسط)
              </button>
              
              <button
                onClick={() => onFontSizeChange('large')}
                className={`flex-1 py-2 text-center text-lg transition-all rounded-lg ${
                  fontSize === 'large' 
                    ? 'bg-white dark:bg-[#1a0836] text-brand-blue font-bold shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Aa (كبير)
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
