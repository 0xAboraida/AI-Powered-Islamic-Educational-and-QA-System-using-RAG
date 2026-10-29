import React from 'react';
import { Folder, FileText, ChevronDown } from 'lucide-react';
import { TreeNode } from '../readerUtils';

export interface TocNodeProps {
  node: TreeNode;
  expandedNodes: Set<number>;
  toggleExpand: (idx: number) => void;
  currentPage: number;
  handlePageJump: (page: number, title?: string, index?: number) => void;
  activeHeadingText: string | null;
  activeTocIndex: number;
  activeAncestorIndices?: Set<number>;
  selectedTocIndex?: number | null;
  readerTheme?: 'light' | 'dark' | 'sepia';
}

export const TocNode: React.FC<TocNodeProps> = ({
  node,
  expandedNodes,
  toggleExpand,
  currentPage,
  handlePageJump,
  activeHeadingText,
  activeTocIndex,
  activeAncestorIndices,
  selectedTocIndex,
  readerTheme = 'light'
}) => {
  const isExpanded = expandedNodes.has(node.originalIndex);

  // Highlighting Logic: Exact match with selectedTocIndex or activeTocIndex
  const isExactActive = (selectedTocIndex !== null && selectedTocIndex !== undefined && node.originalIndex === selectedTocIndex && node.page === currentPage) ||
    (activeTocIndex >= 0 && node.originalIndex === activeTocIndex);

  const isAncestorActive = activeAncestorIndices ? activeAncestorIndices.has(node.originalIndex) && !isExactActive : false;

  const hasChildren = node.children.length > 0;

  const getContainerStyles = () => {
    if (isExactActive) {
      if (readerTheme === 'dark') {
        return 'bg-gradient-to-r from-purple-600 via-brand-magenta to-purple-700 text-white font-extrabold border-purple-400/60 shadow-md shadow-purple-950/50 ring-1 ring-purple-400/40';
      } else {
        return 'bg-gradient-to-r from-purple-700 via-purple-600 to-brand-magenta text-white font-extrabold border-purple-700 shadow-md shadow-purple-600/30 ring-1 ring-purple-600/40';
      }
    }
    if (isAncestorActive) {
      if (readerTheme === 'dark') {
        return 'bg-purple-950/70 text-purple-200 font-bold border-purple-600/60 shadow-xs';
      } else {
        return 'bg-purple-100 text-purple-950 font-bold border-purple-300 shadow-xs';
      }
    }
    if (readerTheme === 'dark') {
      return 'text-slate-200 hover:text-white hover:bg-white/10 border-transparent hover:border-white/20';
    } else {
      return 'text-slate-800 hover:bg-purple-50 hover:text-purple-950 border-transparent hover:border-purple-200/50';
    }
  };

  const getIconStyles = () => {
    if (isExactActive) return 'text-white';
    if (isAncestorActive) return readerTheme === 'dark' ? 'text-purple-300' : 'text-purple-700';
    return 'text-brand-magenta/70';
  };

  const getBadgeStyles = () => {
    if (isExactActive) return 'bg-white/20 text-white font-bold backdrop-blur-xs';
    if (isAncestorActive) {
      return readerTheme === 'dark'
        ? 'bg-purple-900/80 text-purple-200 font-bold'
        : 'bg-purple-200 text-purple-900 font-bold';
    }
    return readerTheme === 'dark'
      ? 'bg-white/10 text-white/70'
      : 'bg-slate-200/80 text-slate-700';
  };

  return (
    <div className="flex flex-col">
      <div
        data-toc-active={isExactActive ? "true" : undefined}
        className={`w-full flex items-center justify-between py-2.5 px-3 text-sm rounded-xl transition-all duration-300 group cursor-pointer border ${getContainerStyles()}`}
        onClick={() => handlePageJump(node.page, node.title, node.originalIndex)}
      >
        <div className="flex items-center gap-2 flex-1 overflow-hidden min-w-0">
          {hasChildren ? (
            <Folder className={`h-4 w-4 shrink-0 ${getIconStyles()}`} strokeWidth={2} />
          ) : (
            <FileText className={`h-4 w-4 shrink-0 ${getIconStyles()}`} strokeWidth={2} />
          )}

          <div className="relative group/title flex-1 min-w-0">
            <span className="truncate text-right block leading-relaxed text-[13.5px]">
              {node.title}
            </span>

            {/* Hover Enlarged Title Preview Card */}
            <div className="absolute right-0 top-full mt-1.5 hidden group-hover/title:block z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-200 delay-500">
              <div className={`max-w-md px-3.5 py-2.5 rounded-xl border text-sm font-bold shadow-2xl backdrop-blur-xl ${readerTheme === 'dark' ? 'bg-[#0d071a]/95 border-purple-500/50 text-purple-100 shadow-purple-950/80' : readerTheme === 'sepia' ? 'bg-[#F4ECD8]/95 border-[#D4C4A8] text-[#5c3f22] shadow-amber-950/30' : 'bg-white/95 border-purple-300 text-purple-950 shadow-xl'}`}>
                {node.title}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mr-2 shrink-0">
          {hasChildren && (
            <button
              onClick={(e) => { e.stopPropagation(); toggleExpand(node.originalIndex); }}
              className={`p-1 rounded-md transition-all opacity-80 hover:opacity-100 hover:scale-110 ${isExpanded ? 'rotate-0' : 'rotate-90'} ${isExactActive ? 'bg-white/20 text-white' : isAncestorActive ? 'bg-purple-900/40 text-purple-200' : 'hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400'}`}
            >
              <ChevronDown className="h-3.5 w-3.5 transition-transform duration-300" strokeWidth={2.2} />
            </button>
          )}
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors ${getBadgeStyles()}`}>
            صـ {node.page}
          </span>
        </div>
      </div>

      {hasChildren && (
        <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0 overflow-hidden'}`}>
          <div className={`overflow-hidden pr-2.5 border-r-2 mr-1 space-y-1 transition-colors ${isAncestorActive || isExactActive ? 'border-purple-600' : 'border-border/30'}`}>
            {node.children.map(child => (
              <TocNode
                key={child.originalIndex}
                node={child}
                expandedNodes={expandedNodes}
                toggleExpand={toggleExpand}
                currentPage={currentPage}
                handlePageJump={handlePageJump}
                activeHeadingText={activeHeadingText}
                activeTocIndex={activeTocIndex}
                activeAncestorIndices={activeAncestorIndices}
                selectedTocIndex={selectedTocIndex}
                readerTheme={readerTheme}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
