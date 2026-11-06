import { Handle, Position } from '@xyflow/react';
import { ChevronDown, ChevronLeft, CheckCircle2, StickyNote } from 'lucide-react';
import { useTheme, type AccentColor } from '../../../../contexts/ThemeContext';

interface CustomNodeData {
  id: string;
  label: string;
  type: 'label' | 'content';
  hasChildren?: boolean;
  isCollapsed?: boolean;
  isMagnifyMode?: boolean;
  isMagnifyDisabled?: boolean;
  magnifyScale?: number;
  isSearchMatched?: boolean;
  isSearchFocused?: boolean;
  isCompleted?: boolean;
  note?: string;
  isDark?: boolean;
  isNewlyRevealed?: boolean;
  onToggleCollapse?: (id: string) => void;
  onToggleCompleted?: (id: string) => void;
  onOpenNoteModal?: (id: string, label: string) => void;
}

export function CustomMindmapNode({ 
  data, 
  isConnectable, 
  targetPosition = Position.Right, 
  sourcePosition = Position.Left 
}: { 
  data: CustomNodeData; 
  isConnectable: boolean;
  targetPosition?: Position;
  sourcePosition?: Position;
}) {
  const { isDark: themeIsDark, accentColor } = useTheme();
  const isLabel = data.type === 'label' || Boolean(data.hasChildren);
  const isHorizontal = sourcePosition === Position.Left || sourcePosition === Position.Right;
  const isDark = data.isDark ?? themeIsDark ?? true;

  const getNodeStyle = () => {
    if (!isDark) {
      switch (accentColor) {
        case 'blue':
          return isLabel 
            ? 'brand-gradient border-2 border-sky-400/60 text-white shadow-lg shadow-sky-500/25 font-bold' 
            : 'bg-white border-2 border-sky-200 text-slate-900 shadow-md shadow-sky-500/10 hover:border-sky-400 hover:shadow-sky-500/20';
        case 'emerald':
          return isLabel 
            ? 'brand-gradient border-2 border-teal-400/60 text-white shadow-lg shadow-teal-500/25 font-bold' 
            : 'bg-white border-2 border-emerald-200 text-slate-900 shadow-md shadow-emerald-500/10 hover:border-emerald-400 hover:shadow-emerald-500/20';
        case 'amber':
          return isLabel 
            ? 'brand-gradient border-2 border-amber-400/60 text-white shadow-lg shadow-amber-500/25 font-bold' 
            : 'bg-white border-2 border-amber-200 text-slate-900 shadow-md shadow-amber-500/10 hover:border-amber-400 hover:shadow-amber-500/20';
        case 'purple':
        default:
          return isLabel 
            ? 'brand-gradient border-2 border-[#800080] text-white shadow-lg shadow-[#800080]/30 font-bold' 
            : 'bg-white border-2 border-[#800080]/40 text-slate-900 shadow-md shadow-[#800080]/10 hover:border-[#800080] hover:shadow-[#800080]/15';
      }
    }

    // Dark Mode Styling
    switch (accentColor) {
      case 'blue':
        return isLabel 
          ? 'bg-[#090b10] border-2 border-sky-400/70 text-white shadow-lg shadow-sky-400/20 hover:border-sky-300' 
          : 'bg-[#090b10] border-2 border-blue-400/40 text-white shadow-md shadow-blue-500/15 hover:border-blue-400';
      case 'emerald':
        return isLabel 
          ? 'bg-[#090b10] border-2 border-teal-400/70 text-white shadow-lg shadow-teal-400/20 hover:border-teal-300' 
          : 'bg-[#090b10] border-2 border-emerald-400/40 text-white shadow-md shadow-emerald-500/15 hover:border-emerald-400';
      case 'amber':
        return isLabel 
          ? 'bg-[#090b10] border-2 border-amber-400/70 text-white shadow-lg shadow-amber-400/20 hover:border-amber-300' 
          : 'bg-[#090b10] border-2 border-amber-400/40 text-white shadow-md shadow-amber-500/15 hover:border-amber-400';
      case 'purple':
      default:
        return isLabel 
          ? 'bg-[#090b10] border-2 border-[#800080] text-white shadow-lg shadow-[#800080]/40 hover:border-[#a020f0]' 
          : 'bg-[#090b10] border-2 border-[#800080]/70 text-white shadow-md shadow-black/30 hover:border-[#800080]';
    }
  };

  const getLabelTextColor = () => {
    if (!isDark) return isLabel ? 'text-white font-bold' : 'text-slate-900 font-semibold';
    return isLabel ? 'text-white font-bold' : 'text-white';
  };

  const getNewlyRevealedClass = () => {
    if (!data.isNewlyRevealed) return '';
    switch (accentColor) {
      case 'blue': return 'ring-4 ring-sky-400 border-sky-300 shadow-[0_0_35px_rgba(56,189,248,0.85)] animate-pulse';
      case 'emerald': return 'ring-4 ring-teal-400 border-teal-300 shadow-[0_0_35px_rgba(45,212,191,0.85)] animate-pulse';
      case 'amber': return 'ring-4 ring-amber-400 border-amber-300 shadow-[0_0_35px_rgba(245,158,11,0.85)] animate-pulse';
      case 'purple':
      default:
        return 'ring-4 ring-[#800080] border-[#660066] shadow-[0_0_35px_rgba(77,0,77,0.85)] animate-pulse';
    }
  };

  const getCollapseBtnStyle = () => {
    if (isDark) {
      switch (accentColor) {
        case 'blue':
          return 'bg-[#090b10] border-2 border-sky-400/70 text-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.3)] hover:bg-sky-500/20';
        case 'emerald':
          return 'bg-[#090b10] border-2 border-teal-400/70 text-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.3)] hover:bg-teal-500/20';
        case 'amber':
          return 'bg-[#090b10] border-2 border-amber-400/70 text-[#dfbf83] shadow-[0_0_10px_rgba(223,191,131,0.3)] hover:bg-amber-500/20';
        case 'purple':
        default:
          return 'bg-[#090b10] border-2 border-[#800080] text-white shadow-[0_0_10px_rgba(0,0,0,0.4)] hover:bg-[#800080]/30';
      }
    } else {
      switch (accentColor) {
        case 'blue':
          return 'bg-white border-2 border-sky-500 text-sky-600 shadow-sky-500/20 hover:bg-sky-50';
        case 'emerald':
          return 'bg-white border-2 border-teal-500 text-teal-600 shadow-teal-500/20 hover:bg-teal-50';
        case 'amber':
          return 'bg-white border-2 border-amber-500 text-amber-700 shadow-amber-500/20 hover:bg-amber-50';
        case 'purple':
        default:
          return 'bg-white border-2 border-[#800080] text-[#800080] shadow-[#800080]/20 hover:bg-purple-50';
      }
    }
  };

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      data-magnify-disabled={data.isMagnifyDisabled ? "true" : undefined}
      className={`group relative px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-2xl transition-all duration-300 w-[245px] sm:w-[290px] min-h-[76px] sm:min-h-[88px] flex flex-col justify-center whitespace-pre-wrap mindmap-node-appear ${isLabel ? 'text-center' : 'text-right'}
        ${getNodeStyle()}
        ${data.isCompleted ? 'ring-2 ring-emerald-500 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : ''}
        ${getNewlyRevealedClass()}
        ${data.isSearchFocused
          ? 'ring-4 ring-amber-400 border-amber-300 shadow-[0_0_50px_rgba(251,191,36,0.9)]'
          : data.isSearchMatched
          ? 'ring-2 ring-amber-400/80 border-amber-400/80 shadow-[0_0_30px_rgba(251,191,36,0.6)]'
          : ''
        }
        ${!data.isMagnifyMode ? 'hover:-translate-y-1 shadow-lg' : ''}
      `}
      dir="rtl"
    >
      {/* Vertical Action Buttons Stack */}
      <div className="absolute top-2 sm:top-2.5 left-2 sm:left-2.5 flex flex-col items-center gap-1 z-20">
        {/* Completion Checkmark Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onToggleCompleted?.(data.id);
          }}
          className={`flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg transition-all shadow-sm ${
            data.isCompleted
              ? 'bg-emerald-500 text-white border border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)] scale-105'
              : !isDark
              ? isLabel
                ? 'bg-white/25 border border-white/50 text-white hover:bg-white/40 hover:text-white'
                : 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-500 hover:text-slate-800'
              : 'bg-black/40 border border-white/20 text-white/50 hover:text-white hover:bg-white/20'
          }`}
          title={data.isCompleted ? "مكتمل (اضغط للإلغاء)" : "تحديد كمكتمل"}
        >
          <CheckCircle2 size={15} strokeWidth={2.5} className="sm:w-[17px] sm:h-[17px]" />
        </button>

        {/* Note Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onOpenNoteModal?.(data.id, data.label);
          }}
          className={`flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg transition-all shadow-sm ${
            data.note
              ? 'bg-amber-500 text-slate-950 border border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)] scale-105'
              : !isDark
              ? isLabel
                ? 'bg-white/25 border border-white/50 text-white hover:bg-white/40 hover:text-white'
                : 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-500 hover:text-slate-800'
              : 'bg-black/40 border border-white/20 text-white/50 hover:text-white hover:bg-white/20'
          }`}
          title={data.note ? "تعديل الملاحظة" : "إضافة ملاحظة شخصية"}
        >
          <StickyNote size={14} strokeWidth={2.5} className="sm:w-[16px] sm:h-[16px]" />
        </button>
      </div>

      {/* Target Handle */}
      <Handle
        type="target"
        position={targetPosition}
        isConnectable={isConnectable}
        className="!bg-white/70 !border-white !w-3 !h-3 transition-colors hover:!bg-current"
      />

      {/* Main Node Label Content */}
      <div className={`font-sans transition-all duration-300 px-6 sm:px-8 ${
        isLabel ? 'font-bold text-[15px] sm:text-[17px] leading-snug' : 'text-[14px] sm:text-[15.5px] font-medium leading-relaxed'
      } ${getLabelTextColor()}`}>
        {data.label}
      </div>

      {/* Personal Note Snippet Preview */}
      {data.note && (
        <div className={`mt-2 p-2 rounded-xl text-xs leading-normal text-right shadow-inner ${
          isDark 
            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-200' 
            : 'bg-amber-50 border border-amber-300 text-amber-900'
        }`}>
          <div className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-300 mb-0.5">
            <StickyNote size={12} />
            <span>ملاحظتك:</span>
          </div>
          <p className="whitespace-pre-wrap italic">{data.note}</p>
        </div>
      )}

      {/* Source Handle */}
      <Handle
        type="source"
        position={sourcePosition}
        isConnectable={isConnectable}
        className="!bg-white/70 !border-white !w-3 !h-3 transition-colors hover:!bg-current"
      />
      
      {/* Collapse/Expand Toggle Button */}
      {data.hasChildren && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            data.onToggleCollapse?.(data.id);
          }}
          className={`absolute flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full shadow-md hover:scale-110 transition-all z-20 ${getCollapseBtnStyle()} ${
            isHorizontal ? '-left-3.5 sm:-left-4 top-1/2 -translate-y-1/2' : '-bottom-3.5 sm:-bottom-4 left-1/2 -translate-x-1/2'
          }`}
          title={data.isCollapsed ? "توسيط" : "طي"}
        >
          {data.isCollapsed 
            ? (isHorizontal ? <ChevronLeft size={16} /> : <ChevronDown size={16} />) 
            : (isHorizontal ? <ChevronDown size={16} /> : <ChevronLeft size={16} className="rotate-90" />)
          }
        </button>
      )}
    </div>
  );
}
