import { Handle, Position } from '@xyflow/react';
import { ChevronDown, ChevronLeft, CheckCircle2, StickyNote } from 'lucide-react';

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
  const isLabel = data.type === 'label' || Boolean(data.hasChildren);
  const isHorizontal = sourcePosition === Position.Left || sourcePosition === Position.Right;
  const isDark = data.isDark ?? true;

  const getNodeStyle = () => {
    if (!isDark) {
      // Signature Zad brand-gradient matching the Chat input send button exactly
      return isLabel 
        ? 'brand-gradient border-2 border-[#c020f0]/40 text-white shadow-lg shadow-[#8a17c9]/30 font-bold' 
        : 'bg-white border-2 border-[#8a17c9]/40 text-slate-900 shadow-md shadow-[#8a17c9]/10 hover:border-[#c020f0] hover:shadow-[#c020f0]/15';
    }
    // Premium Dark Mode Node styling with explicit border-2 and neon glow
    return isLabel 
      ? 'bg-[#12041f] border-2 border-[#38bdf8]/60 text-[#38bdf8] shadow-lg shadow-[#38bdf8]/15 hover:border-[#38bdf8]' 
      : 'bg-[#1a0730] border-2 border-[#10b981]/50 text-white shadow-md shadow-[#10b981]/10 hover:border-[#10b981]';
  };

  const getLabelTextColor = () => {
    if (!isDark) return isLabel ? 'text-white font-bold' : 'text-slate-900 font-semibold';
    return isLabel ? 'text-[#38bdf8] font-bold' : 'text-white';
  };

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      data-magnify-disabled={data.isMagnifyDisabled ? "true" : undefined}
      className={`group relative px-4 py-3.5 rounded-2xl transition-all duration-300 w-[290px] min-h-[88px] flex flex-col justify-center whitespace-pre-wrap mindmap-node-appear ${isLabel ? 'text-center' : 'text-right'}
        ${getNodeStyle()}
        ${data.isCompleted ? 'ring-2 ring-emerald-500 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : ''}
        ${data.isNewlyRevealed ? 'ring-4 ring-purple-500 border-purple-400 shadow-[0_0_35px_rgba(168,85,247,0.85)] animate-pulse' : ''}
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
      <div className="absolute top-2.5 left-2.5 flex flex-col items-center gap-1 z-20">
        {/* Completion Checkmark Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onToggleCompleted?.(data.id);
          }}
          className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all shadow-sm ${
            data.isCompleted
              ? 'bg-emerald-500 text-white border border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)] scale-105'
              : isDark
              ? 'bg-black/40 border border-white/20 text-white/50 hover:text-white hover:bg-white/20'
              : 'bg-white/20 border border-white/40 text-white hover:bg-white/40'
          }`}
          title={data.isCompleted ? "مكتمل (اضغط للإلغاء)" : "تحديد كمكتمل"}
        >
          <CheckCircle2 size={17} strokeWidth={2.5} />
        </button>

        {/* Note Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onOpenNoteModal?.(data.id, data.label);
          }}
          className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all shadow-sm ${
            data.note
              ? 'bg-amber-500 text-slate-950 border border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)] scale-105'
              : isDark
              ? 'bg-black/40 border border-white/20 text-white/50 hover:text-white hover:bg-white/20'
              : 'bg-white/20 border border-white/40 text-white hover:bg-white/40'
          }`}
          title={data.note ? "تعديل الملاحظة" : "إضافة ملاحظة شخصية"}
        >
          <StickyNote size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* Target Handle */}
      <Handle
        type="target"
        position={targetPosition}
        isConnectable={isConnectable}
        className="!bg-white/60 !border-white !w-3 !h-3 transition-colors hover:!bg-[#c020f0]"
      />

      {/* Main Node Label Content */}
      <div className={`font-sans transition-all duration-300 px-8 ${
        isLabel ? 'font-bold text-[17px] leading-snug' : 'text-[15.5px] font-medium leading-relaxed'
      } ${getLabelTextColor()}`}>
        {data.label}
      </div>

      {/* Personal Note Snippet Preview */}
      {data.note && (
        <div className={`mt-2.5 p-2 rounded-xl text-xs leading-normal text-right shadow-inner ${
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
        className="!bg-white/60 !border-white !w-3 !h-3 transition-colors hover:!bg-[#c020f0]"
      />
      
      {/* Collapse/Expand Toggle Button */}
      {data.hasChildren && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            data.onToggleCollapse?.(data.id);
          }}
          className={`absolute flex items-center justify-center w-7 h-7 rounded-full shadow-md hover:scale-110 transition-all z-20 ${
            isDark 
              ? 'bg-[#1a0730] border-2 border-[#38bdf8]/60 text-[#38bdf8] shadow-[0_0_10px_rgba(56,189,248,0.25)] hover:bg-[#38bdf8]/20' 
              : 'bg-white border-2 border-[#8a17c9] text-[#8a17c9] shadow-[#8a17c9]/20 hover:bg-purple-50'
          } ${isHorizontal ? '-left-4 top-1/2 -translate-y-1/2' : '-bottom-4 left-1/2 -translate-x-1/2'}`}
          title={data.isCollapsed ? "توسيط" : "طي"}
        >
          {data.isCollapsed 
            ? (isHorizontal ? <ChevronLeft size={17} /> : <ChevronDown size={17} />) 
            : (isHorizontal ? <ChevronDown size={17} /> : <ChevronLeft size={17} className="rotate-90" />)
          }
        </button>
      )}
    </div>
  );
}
