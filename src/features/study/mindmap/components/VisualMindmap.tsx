import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  Panel,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { CustomMindmapNode } from './CustomMindmapNode';
import { MindmapNode } from '../../../../contexts/StudyContext';
import { useTheme } from '../../../../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  FolderOpen, 
  FolderClosed, 
  UnfoldVertical,
  FoldVertical,
  Search, 
  Maximize2,
  Maximize,
  Minimize,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  CheckCircle2,
  StickyNote,
  Save,
  Trash2,
  ArrowRightLeft,
  ArrowUpDown,
  Network,
  ListTree,
  SlidersHorizontal
} from 'lucide-react';

const nodeTypes = { custom: CustomMindmapNode };

const renderMindmapTreeNodes = (nodes: MindmapNode[], isDark: boolean = true) => {
  return (
    <div className="flex flex-col gap-2.5">
      {nodes.map((n, i) => {
        const hasChildren = n.children && n.children.length > 0;

        if (hasChildren) {
          return (
            <details key={i} className="mindmap-details group" open>
              <summary className="list-none cursor-pointer select-none [&::-webkit-details-marker]:hidden mb-2 w-fit">
                {n.type === 'label' || n.label ? (
                  <div className={`font-bold text-sm sm:text-base px-4 py-3 rounded-2xl border inline-flex items-center gap-2.5 shadow-md transition-all hover:scale-[1.01] ${
                    isDark 
                      ? 'bg-purple-900/40 border-purple-500/40 text-[#38bdf8] hover:bg-purple-900/60' 
                      : 'bg-white border-purple-200 text-purple-900 hover:bg-purple-50 shadow-purple-900/5'
                  }`}>
                    <ChevronLeft size={16} className="mindmap-arrow text-current/60 transition-transform duration-300 group-open:-rotate-90" />
                    {n.label || n.content}
                  </div>
                ) : (
                  <div className={`text-sm sm:text-base px-4 py-3 rounded-2xl border inline-flex items-center gap-2.5 shadow-sm transition-all hover:scale-[1.01] ${
                    isDark 
                      ? 'bg-white/5 border-white/10 text-white/90 hover:bg-white/10' 
                      : 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200/70'
                  }`}>
                    <ChevronLeft size={16} className="mindmap-arrow text-current/60 transition-transform duration-300 group-open:-rotate-90" />
                    {n.content || n.label}
                  </div>
                )}
              </summary>
              <div className={`mr-6 border-r-2 pr-4 pt-1 mb-3 ${isDark ? 'border-purple-500/20' : 'border-purple-300/50'}`}>
                {renderMindmapTreeNodes(n.children!, isDark)}
              </div>
            </details>
          );
        }

        return (
          <div key={i} className="mb-2 transition-transform hover:-translate-x-1">
            {n.type === 'label' ? (
              <div className={`font-bold text-sm px-4 py-2.5 rounded-xl border w-fit shadow-sm ${
                isDark 
                  ? 'bg-purple-500/10 border-purple-500/20 text-[#38bdf8]' 
                  : 'bg-purple-50 border-purple-200 text-purple-800'
              }`}>
                {n.label}
              </div>
            ) : (
              <div className={`text-sm sm:text-base px-4 py-3.5 rounded-2xl border w-fit shadow-sm max-w-3xl leading-relaxed ${
                isDark 
                  ? 'bg-white/5 border-white/10 text-white/90 hover:border-white/20' 
                  : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
              }`}>
                {n.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

function FitViewButton({ themeColors }: { themeColors?: any }) {
  const { fitView } = useReactFlow();

  return (
    <button
      onClick={() => fitView({ duration: 400, padding: 0.2 })}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shadow-xl border backdrop-blur-md hover:bg-current/10 transition-all active:scale-95 shrink-0 ${
        themeColors?.panelBg || 'bg-white/90 dark:bg-[#090b10]/90 text-slate-800 dark:text-white border-purple-200/80 dark:border-white/20'
      }`}
      title="توسيع ومحاذاة الخريطة داخل الإطار"
    >
      <Maximize2 size={15} className="text-amber-500 dark:text-amber-400 shrink-0" />
      <span className="hidden sm:inline">توسيع</span>
    </button>
  );
}

function SearchCameraController({ targetNodeId, nodes }: { targetNodeId: string | null; nodes: any[] }) {
  const { setCenter } = useReactFlow();

  useEffect(() => {
    if (!targetNodeId) return;
    const targetNode = nodes.find((n) => n.id === targetNodeId);
    if (targetNode && targetNode.position) {
      const centerX = targetNode.position.x + 140;
      const centerY = targetNode.position.y + 40;
      setCenter(centerX, centerY, { zoom: 1.1, duration: 500 });
    }
  }, [targetNodeId, nodes, setCenter]);

  return null;
}

function MountAutoFitViewController({ nodes }: { nodes: any[] }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (!nodes || nodes.length === 0) return;
    const timer = setTimeout(() => {
      fitView({ duration: 450, padding: 0.12 });
    }, 180);
    return () => clearTimeout(timer);
  }, [nodes.length, fitView]);

  return null;
}

function LayoutCameraController({ layoutDir }: { layoutDir: 'RL' | 'TB' }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ duration: 500, padding: 0.12 });
    }, 60);
    return () => clearTimeout(timer);
  }, [layoutDir, fitView]);

  return null;
}

function NodeFocusController({ focusTarget, nodes }: { focusTarget: { id: string; ts: number } | null; nodes: any[] }) {
  const { setCenter, fitBounds } = useReactFlow();

  useEffect(() => {
    if (!focusTarget) return;
    const timer = setTimeout(() => {
      const targetNode = nodes.find((n) => n.id === focusTarget.id);
      if (!targetNode || !targetNode.position) return;

      const visibleSubtreeNodes = nodes.filter(
        (n) => !n.hidden && (n.id === focusTarget.id || n.id.startsWith(`${focusTarget.id}_`))
      );

      if (visibleSubtreeNodes.length > 1) {
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        visibleSubtreeNodes.forEach((n) => {
          const x = n.position.x;
          const y = n.position.y;
          const labelText = n.data?.label || '';
          const h = getNodeHeight(labelText);

          if (x < minX) minX = x;
          if (x + 310 > maxX) maxX = x + 310;
          if (y < minY) minY = y;
          if (y + h > maxY) maxY = y + h;
        });

        const padding = 70;
        const bounds = {
          x: minX - padding,
          y: minY - padding,
          width: Math.max(400, maxX - minX + padding * 2),
          height: Math.max(300, maxY - minY + padding * 2),
        };

        if (typeof fitBounds === 'function') {
          fitBounds(bounds, { duration: 550, padding: 0.25 });
        } else {
          const centerX = (minX + maxX) / 2;
          const centerY = (minY + maxY) / 2;
          setCenter(centerX, centerY, { zoom: 0.9, duration: 500 });
        }
      } else {
        const labelText = targetNode.data?.label || '';
        const h = getNodeHeight(labelText);
        const centerX = targetNode.position.x + 155;
        const centerY = targetNode.position.y + (h / 2);
        setCenter(centerX, centerY, { zoom: 1.0, duration: 450 });
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [focusTarget, nodes, setCenter, fitBounds]);

  return null;
}

const getNodeHeight = (label: string) => {
  const len = label ? label.length : 0;
  if (len < 25) return 92;
  if (len < 60) return 118;
  if (len < 120) return 152;
  if (len < 200) return 195;
  return 245;
};

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'RL') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const nodeW = isMobile ? 255 : 310;
  const isHorizontal = direction === 'RL';

  dagreGraph.setGraph({ 
    rankdir: direction,
    nodesep: isMobile ? 24 : 40,
    ranksep: isHorizontal ? (isMobile ? 75 : 130) : (isMobile ? 65 : 90),
  });

  nodes.filter(n => !n.hidden).forEach((node) => {
    const labelText = node.data?.label || '';
    const h = getNodeHeight(labelText);
    dagreGraph.setNode(node.id, { width: nodeW, height: h });
  });

  edges.filter(e => !e.hidden).forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const halfW = nodeW / 2;

  if (direction === 'TB') {
    let minX = Infinity;
    let maxX = -Infinity;
    nodes.filter(n => !n.hidden).forEach((node) => {
      const pos = dagreGraph.node(node.id);
      if (pos) {
        if (pos.x < minX) minX = pos.x;
        if (pos.x > maxX) maxX = pos.x;
      }
    });

    const sumX = (minX !== Infinity && maxX !== -Infinity) ? minX + maxX : 0;

    nodes.forEach((node) => {
      if (!node.hidden) {
        const nodeWithPosition = dagreGraph.node(node.id);
        const labelText = node.data?.label || '';
        const h = getNodeHeight(labelText);
        node.targetPosition = 'top';
        node.sourcePosition = 'bottom';
    
        node.position = {
          x: (sumX - nodeWithPosition.x) - halfW,
          y: nodeWithPosition.y - (h / 2),
        };
      }
      return node;
    });
  } else {
    nodes.forEach((node) => {
      if (!node.hidden) {
        const nodeWithPosition = dagreGraph.node(node.id);
        const labelText = node.data?.label || '';
        const h = getNodeHeight(labelText);
        node.targetPosition = 'right';
        node.sourcePosition = 'left';
    
        node.position = {
          x: nodeWithPosition.x - halfW,
          y: nodeWithPosition.y - (h / 2),
        };
      }
      return node;
    });
  }

  return { nodes, edges };
};

interface VisualMindmapContentProps {
  data: MindmapNode[];
  mindmapViewMode?: 'list' | 'visual';
  setMindmapViewMode?: (v: 'list' | 'visual') => void;
  onBack?: () => void;
}

function VisualMindmapContent({ data, mindmapViewMode = 'visual', setMindmapViewMode, onBack }: VisualMindmapContentProps) {
  const { getNodes, getNodesBounds, fitView } = useReactFlow();
  const { isDark, accentColor } = useTheme();

  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [layoutDir, setLayoutDir] = useState<'RL' | 'TB'>('RL');
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [isMagnifyMode, setIsMagnifyMode] = useState(false);
  const [magnifyScale, setMagnifyScale] = useState<number>(2.5);
  const [disabledMagnifyNodeIds, setDisabledMagnifyNodeIds] = useState<Set<string>>(new Set());
  
  // Progress & Notes state
  const [completedNodeIds, setCompletedNodeIds] = useState<Set<string>>(new Set());
  const [nodeNotes, setNodeNotes] = useState<Record<string, string>>({});
  const [activeNoteModal, setActiveNoteModal] = useState<{ id: string; label: string; text: string } | null>(null);

  // Search, Fullscreen & Focus state
  const [searchQuery, setSearchQuery] = useState('');
  const [matchedNodeIds, setMatchedNodeIds] = useState<string[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [focusTarget, setFocusTarget] = useState<{ id: string; ts: number } | null>(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const flowRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);
  const lastRightClickRef = useRef<{ id: string; time: number } | null>(null);

  const themeColors = useMemo(() => {
    const getEdgeColor = () => {
      if (isDark) {
        switch (accentColor) {
          case 'emerald': return '#2dd4bf';
          case 'amber': return '#dfbf83';
          case 'purple': return '#800080';
          case 'blue':
          default:
            return '#38bdf8';
        }
      } else {
        switch (accentColor) {
          case 'emerald': return '#0d9488';
          case 'amber': return '#b88d46';
          case 'blue': return '#0284c7';
          case 'purple':
          default:
            return '#800080';
        }
      }
    };

    if (!isDark) {
      switch (accentColor) {
        case 'blue':
          return {
            bg: 'bg-slate-50',
            canvasBg: '#f8fafc',
            edgeColor: getEdgeColor(),
            border: 'border-slate-200',
            text: 'text-slate-900',
            panelBg: 'bg-white/95 backdrop-blur-xl border-slate-200 text-slate-800 shadow-sm',
            activeBtn: 'bg-sky-500 text-white shadow-md shadow-sky-500/25',
            activeRing: 'border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.35)]',
            textAccent: 'text-sky-600',
            badgeBg: 'bg-sky-500/15 border-sky-500/30 text-sky-700',
          };
        case 'emerald':
          return {
            bg: 'bg-slate-50',
            canvasBg: '#f8fafc',
            edgeColor: getEdgeColor(),
            border: 'border-slate-200',
            text: 'text-slate-900',
            panelBg: 'bg-white/95 backdrop-blur-xl border-slate-200 text-slate-800 shadow-sm',
            activeBtn: 'bg-teal-500 text-white shadow-md shadow-teal-500/25',
            activeRing: 'border-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.35)]',
            textAccent: 'text-teal-600',
            badgeBg: 'bg-teal-500/15 border-teal-500/30 text-teal-700',
          };
        case 'amber':
          return {
            bg: 'bg-slate-50',
            canvasBg: '#f8fafc',
            edgeColor: getEdgeColor(),
            border: 'border-slate-200',
            text: 'text-slate-900',
            panelBg: 'bg-white/95 backdrop-blur-xl border-slate-200 text-slate-800 shadow-sm',
            activeBtn: 'bg-[#7a5720] text-white font-bold shadow-md shadow-amber-500/25',
            activeRing: 'border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.35)]',
            textAccent: 'text-amber-700',
            badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-800',
          };
        case 'purple':
        default:
          return {
            bg: 'bg-slate-50',
            canvasBg: '#f8fafc',
            edgeColor: getEdgeColor(),
            border: 'border-slate-200',
            text: 'text-slate-900',
            panelBg: 'bg-white/95 backdrop-blur-xl border-slate-200 text-slate-800 shadow-sm',
            activeBtn: 'bg-[#800080] text-white shadow-md shadow-[#800080]/25',
            activeRing: 'border-[#800080] shadow-[0_0_20px_rgba(77,0,77,0.4)]',
            textAccent: 'text-[#800080]',
            badgeBg: 'bg-[#800080] text-white',
          };
      }
    }

    // Dark Mode
    switch (accentColor) {
      case 'blue':
        return {
          bg: 'bg-[#0b0f17]',
          canvasBg: '#0b0f17',
          edgeColor: getEdgeColor(),
          border: 'border-slate-800',
          text: 'text-white',
          panelBg: 'bg-slate-900/95 border-slate-800 text-white shadow-sm',
          activeBtn: 'bg-sky-500 text-white shadow-md shadow-sky-500/30',
          activeRing: 'border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.4)]',
          textAccent: 'text-sky-400',
          badgeBg: 'bg-sky-500/20 border-sky-500/40 text-sky-300',
        };
      case 'emerald':
        return {
          bg: 'bg-[#0b0f17]',
          canvasBg: '#0b0f17',
          edgeColor: getEdgeColor(),
          border: 'border-slate-800',
          text: 'text-white',
          panelBg: 'bg-slate-900/95 border-slate-800 text-white shadow-sm',
          activeBtn: 'bg-teal-500 text-white shadow-md shadow-teal-500/30',
          activeRing: 'border-teal-400 shadow-[0_0_20px_rgba(20,184,166,0.4)]',
          textAccent: 'text-teal-400',
          badgeBg: 'bg-teal-500/20 border-teal-500/40 text-teal-300',
        };
      case 'amber':
        return {
          bg: 'bg-[#0b0f17]',
          canvasBg: '#0b0f17',
          edgeColor: getEdgeColor(),
          border: 'border-slate-800',
          text: 'text-white',
          panelBg: 'bg-slate-900/95 border-slate-800 text-white shadow-sm',
          activeBtn: 'bg-[#dfbf83] text-stone-950 font-bold shadow-md shadow-amber-500/30',
          activeRing: 'border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]',
          textAccent: 'text-[#dfbf83]',
          badgeBg: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
        };
      case 'purple':
      default:
        return {
          bg: 'bg-[#0b0f17]',
          canvasBg: '#0b0f17',
          edgeColor: getEdgeColor(),
          border: 'border-slate-800',
          text: 'text-white',
          panelBg: 'bg-slate-900/95 border-slate-800 text-white shadow-sm',
          activeBtn: 'bg-[#800080] text-white shadow-md shadow-[#800080]/40',
          activeRing: 'border-[#800080] shadow-[0_0_20px_rgba(77,0,77,0.4)]',
          textAccent: 'text-white font-bold',
          badgeBg: 'bg-[#800080] border border-[#660066] text-white',
        };
    }
  }, [isDark, accentColor]);

  // Calculate total nodes for study progress tracker
  const totalNodesCount = useMemo(() => {
    let count = 0;
    const traverse = (nodeList: MindmapNode[], parentId: string | null) => {
      nodeList.forEach((node, idx) => {
        count++;
        const nodeId = parentId ? `${parentId}_${idx}` : `root_${idx}`;
        if (node.children && node.children.length > 0) {
          traverse(node.children, nodeId);
        }
      });
    };
    traverse(data || [], null);
    return Math.max(count, 1);
  }, [data]);

  // Calculate total collapsible nodes (nodes with children) to track exact active states for Expand/Collapse buttons
  const totalCollapsibleNodesCount = useMemo(() => {
    let count = 0;
    const traverse = (nodeList: MindmapNode[], parentId: string | null) => {
      nodeList.forEach((node, idx) => {
        const nodeId = parentId ? `${parentId}_${idx}` : `root_${idx}`;
        if (node.children && node.children.length > 0) {
          count++;
          traverse(node.children, nodeId);
        }
      });
    };
    traverse(data || [], null);
    return count;
  }, [data]);

  const isAllExpanded = collapsedNodes.size === 0;
  const isAllCollapsed = totalCollapsibleNodesCount > 0 && collapsedNodes.size >= totalCollapsibleNodesCount;

  const completedCount = completedNodeIds.size;
  const progressPercentage = Math.min(100, Math.round((completedCount / totalNodesCount) * 100));

  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);

  const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: any) => {
    event.preventDefault();
    const now = Date.now();
    if (
      lastRightClickRef.current &&
      lastRightClickRef.current.id === node.id &&
      now - lastRightClickRef.current.time < 500
    ) {
      // Double right-click toggles magnification for THIS specific node only!
      setDisabledMagnifyNodeIds((prev) => {
        const next = new Set(prev);
        if (next.has(node.id)) {
          next.delete(node.id);
        } else {
          next.add(node.id);
        }
        return next;
      });
      lastRightClickRef.current = null;
    } else {
      lastRightClickRef.current = { id: node.id, time: now };
    }
  }, []);

  const [recentlyRevealedNodeIds, setRecentlyRevealedNodeIds] = useState<Set<string>>(new Set());

  const handleToggleCollapse = useCallback((nodeId: string) => {
    const isExpanding = collapsedNodes.has(nodeId);

    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });

    if (isExpanding) {
      const revealed = new Set<string>();
      revealed.add(nodeId);

      const collectChildren = (list: MindmapNode[], parentId: string) => {
        list.forEach((node, idx) => {
          const currentId = `${parentId}_${idx}`;
          revealed.add(currentId);
          if (node.children) collectChildren(node.children, currentId);
        });
      };

      const findAndCollect = (list: MindmapNode[], parentId: string | null) => {
        list.forEach((node, idx) => {
          const currentId = parentId ? `${parentId}_${idx}` : `root_${idx}`;
          if (currentId === nodeId && node.children) {
            collectChildren(node.children, currentId);
          } else if (node.children) {
            findAndCollect(node.children, currentId);
          }
        });
      };
      findAndCollect(data || [], null);

      setRecentlyRevealedNodeIds(revealed);
      setTimeout(() => {
        setRecentlyRevealedNodeIds(new Set());
      }, 2000);
    }

    setFocusTarget({ id: nodeId, ts: Date.now() });
  }, [collapsedNodes, data]);

  const handleToggleCompleted = useCallback((nodeId: string) => {
    setCompletedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleOpenNoteModal = useCallback((id: string, label: string) => {
    setActiveNoteModal({
      id,
      label,
      text: nodeNotes[id] || '',
    });
  }, [nodeNotes]);

  const handleSaveNote = () => {
    if (!activeNoteModal) return;
    setNodeNotes((prev) => ({
      ...prev,
      [activeNoteModal.id]: activeNoteModal.text.trim(),
    }));
    setActiveNoteModal(null);
  };

  const collapseAll = useCallback(() => {
    const newCollapsed = new Set<string>();
    const traverse = (nodeList: MindmapNode[], parentId: string | null) => {
      nodeList.forEach((node, idx) => {
        const nodeId = parentId ? `${parentId}_${idx}` : `root_${idx}`;
        if (node.children && node.children.length > 0) {
          newCollapsed.add(nodeId);
          traverse(node.children, nodeId);
        }
      });
    };
    traverse(data, null);
    setCollapsedNodes(newCollapsed);
    setTimeout(() => {
      fitView({ duration: 400, padding: 0.2 });
    }, 80);
  }, [data, fitView]);

  const expandAll = useCallback(() => {
    setCollapsedNodes(new Set());
    setTimeout(() => {
      fitView({ duration: 400, padding: 0.2 });
    }, 80);
  }, [fitView]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setMatchedNodeIds([]);
      setCurrentMatchIndex(0);
      return;
    }

    const q = query.trim().toLowerCase();
    const matches: string[] = [];
    const parentMap = new Map<string, string>();

    const traverse = (nodeList: MindmapNode[], parentId: string | null) => {
      nodeList.forEach((node, idx) => {
        const nodeId = parentId ? `${parentId}_${idx}` : `root_${idx}`;
        if (parentId) parentMap.set(nodeId, parentId);
        
        const label = (node.type === 'label' ? node.label : node.content) || node.label || node.content || '';
        if (label.toLowerCase().includes(q)) {
          matches.push(nodeId);
        }
        if (node.children) {
          traverse(node.children, nodeId);
        }
      });
    };

    traverse(data || [], null);
    setMatchedNodeIds(matches);
    setCurrentMatchIndex(0);

    if (matches.length > 0) {
      setCollapsedNodes((prev) => {
        const next = new Set(prev);
        matches.forEach((matchedId) => {
          let curr = parentMap.get(matchedId);
          while (curr) {
            next.delete(curr);
            curr = parentMap.get(curr);
          }
        });
        return next;
      });
    }
  }, [data]);

  const handleNextMatch = () => {
    if (matchedNodeIds.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matchedNodeIds.length);
  };

  const handlePrevMatch = () => {
    if (matchedNodeIds.length === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + matchedNodeIds.length) % matchedNodeIds.length);
  };

  const toggleFullscreen = () => {
    if (!flowRef.current) return;
    if (!document.fullscreenElement) {
      flowRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
    setTimeout(() => {
      fitView({ duration: 400, padding: 0.2 });
    }, 150);
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(() => {
        fitView({ duration: 400, padding: 0.2 });
      }, 150);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, [fitView]);

  const processData = useCallback((mindmapData: MindmapNode[]) => {
    const initialNodes: any[] = [];
    const initialEdges: any[] = [];

    const traverse = (nodeList: MindmapNode[], parentId: string | null, isAncestorCollapsed: boolean) => {
      nodeList.forEach((node, idx) => {
        const nodeId = parentId ? `${parentId}_${idx}` : `root_${idx}`;
        const hasChildren = node.children && node.children.length > 0;
        const isCollapsed = collapsedNodes.has(nodeId);
        const isHidden = isAncestorCollapsed;

        const isSearchMatched = matchedNodeIds.includes(nodeId);
        const isSearchFocused = matchedNodeIds.length > 0 && matchedNodeIds[currentMatchIndex] === nodeId;

        initialNodes.push({
          id: nodeId,
          type: 'custom',
          hidden: isHidden,
          data: { 
            id: nodeId,
            label: (node.type === 'label' ? node.label : node.content) || node.label || node.content || '',
            type: node.type || (node.label ? 'label' : 'content'),
            hasChildren,
            isCollapsed,
            isMagnifyMode,
            isMagnifyDisabled: disabledMagnifyNodeIds.has(nodeId),
            magnifyScale,
            isSearchMatched,
            isSearchFocused,
            isCompleted: completedNodeIds.has(nodeId),
            isNewlyRevealed: recentlyRevealedNodeIds.has(nodeId),
            note: nodeNotes[nodeId],
            isDark: isDark,
            onToggleCollapse: handleToggleCollapse,
            onToggleCompleted: handleToggleCompleted,
            onOpenNoteModal: handleOpenNoteModal,
          },
          position: { x: 0, y: 0 },
        });

        if (parentId) {
          initialEdges.push({
            id: `e_${parentId}_${nodeId}`,
            source: parentId,
            target: nodeId,
            type: 'bezier',
            animated: true,
            hidden: isHidden,
            style: { 
              stroke: themeColors.edgeColor, 
              strokeWidth: 2.5,
              opacity: 0.85,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: themeColors.edgeColor,
              width: 18,
              height: 18,
            },
          });
        }

        if (hasChildren) {
          traverse(node.children!, nodeId, isAncestorCollapsed || isCollapsed);
        }
      });
    };

    traverse(mindmapData, null, false);
    
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges,
      layoutDir
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutDir, setNodes, setEdges, collapsedNodes, handleToggleCollapse, handleToggleCompleted, handleOpenNoteModal, isMagnifyMode, magnifyScale, disabledMagnifyNodeIds, completedNodeIds, nodeNotes, isDark, themeColors, matchedNodeIds, currentMatchIndex, recentlyRevealedNodeIds]);

  useEffect(() => {
    if (data && data.length > 0) {
      if (!hasInitialized.current) {
        hasInitialized.current = true;
        
        // Keep root and level-1 branches expanded on initial load so main mindmap branches stay open
        const newCollapsed = new Set<string>();
        const traverseCollapse = (nodeList: MindmapNode[], parentId: string | null, depth: number = 0) => {
          nodeList.forEach((node, idx) => {
            const nodeId = parentId ? `${parentId}_${idx}` : `root_${idx}`;
            if (node.children && node.children.length > 0) {
              if (depth >= 1) {
                newCollapsed.add(nodeId);
              }
              traverseCollapse(node.children, nodeId, depth + 1);
            }
          });
        };
        traverseCollapse(data, null, 0);
        setCollapsedNodes(newCollapsed);
      }
      processData(data);
    }
  }, [data, processData]);

  const currentFocusedNodeId = matchedNodeIds.length > 0 ? matchedNodeIds[currentMatchIndex] : null;

  const handleDownloadPdf = async () => {
    const flowElement = flowRef.current;
    if (!flowElement) return;

    try {
      const currentCollapsed = new Set(collapsedNodes);
      setCollapsedNodes(new Set());
      await new Promise((resolve) => setTimeout(resolve, 350));

      const allNodes = getNodes();
      if (allNodes.length === 0) {
        setCollapsedNodes(currentCollapsed);
        return;
      }

      const bounds = getNodesBounds(allNodes);
      const padding = 120;
      const width = Math.ceil(bounds.width + padding * 2);
      const height = Math.ceil(bounds.height + padding * 2);

      const viewportEl = flowElement.querySelector('.react-flow__viewport') as HTMLElement;
      if (!viewportEl) {
        setCollapsedNodes(currentCollapsed);
        return;
      }

      const originalTransform = viewportEl.style.transform;
      const targetX = -bounds.x + padding;
      const targetY = -bounds.y + padding;
      viewportEl.style.transform = `translate(${targetX}px, ${targetY}px) scale(1)`;

      const dataUrl = await toPng(viewportEl, {
        width,
        height,
        backgroundColor: themeColors.canvasBg,
        pixelRatio: 2,
        style: {
          width: `${width}px`,
          height: `${height}px`,
        },
      });

      viewportEl.style.transform = originalTransform;
      setCollapsedNodes(currentCollapsed);

      const pdf = new jsPDF({
        orientation: width > height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [width, height],
      });

      pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
      pdf.save(`Zad-AI-Mindmap-${Date.now()}.pdf`);
    } catch (err) {
      console.error('PDF Export Error:', err);
    }
  };

  return (
    <div 
      ref={flowRef} 
      className={`relative w-full h-full flex gap-3 transition-colors duration-300 ${
        isFullscreen ? 'bg-[#0f041c] p-3' : ''
      }`}
      style={{
        '--magnify-scale': magnifyScale,
      } as React.CSSProperties}
    >
      <style>{`
        .react-flow__controls {
          background: ${isDark ? 'rgba(21, 5, 36, 0.95)' : 'rgba(255, 255, 255, 0.95)'} !important;
          border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'} !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4) !important;
          border-radius: 0.85rem !important;
          overflow: hidden !important;
        }
        .react-flow__controls-button {
          background: transparent !important;
          border-bottom: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'} !important;
          color: ${isDark ? '#e2e8f0' : '#1e293b'} !important;
          fill: currentColor !important;
        }
        .react-flow__controls-button:last-child {
          border-bottom: none !important;
        }
        .react-flow__controls-button:hover {
          background: ${isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.06)'} !important;
        }
        .react-flow__controls-button svg {
          fill: currentColor !important;
        }
        @keyframes mindmapNodePop {
          0% {
            opacity: 0;
            transform: scale(0.85);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .mindmap-node-appear {
          animation: mindmapNodePop 380ms cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
        }
        ${isMagnifyMode ? `
          .mindmap-magnify-active .react-flow__node {
            transition: z-index 0s !important;
          }
          .mindmap-magnify-active .react-flow__node:hover {
            z-index: 999999 !important;
          }
          .mindmap-magnify-active .react-flow__node:hover .mindmap-node-appear:not([data-magnify-disabled="true"]) {
            transform: scale(var(--magnify-scale, 2.5)) !important;
            transform-origin: center center !important;
            box-shadow: ${isDark ? '0 12px 30px rgba(0, 0, 0, 0.7), 0 0 8px rgba(168, 85, 247, 0.2)' : '0 10px 24px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.05)'} !important;
            ${isDark ? 'border-color: rgba(255, 255, 255, 0.3) !important;' : 'border-color: rgba(0, 0, 0, 0.15) !important;'}
            cursor: pointer;
          }
        ` : ''}
      `}</style>

      {/* Main Mindmap Canvas / List Box */}
      <div className={`relative flex-1 h-full rounded-2xl overflow-hidden shadow-2xl border flex flex-col transition-colors duration-300 ${themeColors.bg} ${themeColors.border} ${isMagnifyMode && mindmapViewMode === 'visual' ? 'mindmap-magnify-active' : ''}`}>
        
        {/* UNIFIED TOP CONTROL BAR FOR BOTH MODES */}
        <div className="p-2 sm:p-2.5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 backdrop-blur-md z-30 shrink-0 gap-2" dir="rtl">
          {/* RIGHT SIDE (RTL): Back Button + Expandable Search Button / Bar */}
          <div className="flex items-center gap-2 flex-1">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className={`flex items-center justify-center gap-1 px-2.5 sm:px-3 h-8 sm:h-9 rounded-xl text-xs font-bold shadow-sm border backdrop-blur-md transition-all active:scale-95 ${themeColors.panelBg} hover:bg-current/10 shrink-0 cursor-pointer`}
                title="رجوع لقائمة الخرائط"
              >
                <ChevronRight size={17} className="shrink-0" />
                <span className="hidden sm:inline">رجوع</span>
              </button>
            )}
            {mindmapViewMode === 'visual' && (
              <div className="relative flex items-center">
                {!isSearchExpanded && !searchQuery ? (
                  <button
                    onClick={() => {
                      setIsSearchExpanded(true);
                      setTimeout(() => searchInputRef.current?.focus(), 50);
                    }}
                    className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs font-bold shadow-sm border backdrop-blur-md transition-all active:scale-95 ${themeColors.panelBg} hover:bg-current/10`}
                    title="بحث في الخريطة"
                  >
                    <Search size={16} className={themeColors.textAccent} />
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:py-2 rounded-xl text-xs shadow-sm border backdrop-blur-md ${themeColors.panelBg}`}
                  >
                    <Search size={15} className={`${themeColors.textAccent} shrink-0`} />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="بحث في الخريطة..."
                      className="bg-transparent text-current placeholder-current/50 text-xs focus:outline-none w-28 sm:w-44"
                      dir="rtl"
                    />
                    {matchedNodeIds.length > 0 && (
                      <div className="flex items-center gap-1 border-r border-current/20 pr-1 shrink-0">
                        <span className={`text-[11px] font-bold ${themeColors.textAccent}`}>
                          {currentMatchIndex + 1}/{matchedNodeIds.length}
                        </span>
                        <button onClick={handlePrevMatch} className="p-0.5 hover:bg-current/10 rounded"><ChevronRight size={13} /></button>
                        <button onClick={handleNextMatch} className="p-0.5 hover:bg-current/10 rounded"><ChevronLeft size={13} /></button>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        handleSearch('');
                        setIsSearchExpanded(false);
                      }}
                      className="opacity-60 hover:opacity-100 p-0.5 rounded hover:bg-current/10"
                      title="إغلاق البحث"
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* LEFT SIDE (RTL): Tools Icon-Only Button */}
          <div className="relative">
            <button
              onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
              className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs font-bold shadow-sm border backdrop-blur-md transition-all active:scale-95 ${
                isToolsMenuOpen
                  ? `${themeColors.activeBtn} ${themeColors.activeRing}`
                  : `${themeColors.panelBg} hover:bg-current/10`
              }`}
              title="أدوات الخريطة"
            >
              <SlidersHorizontal size={16} />
            </button>

            {/* Floating Popover Menu */}
            <AnimatePresence>
              {isToolsMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute left-0 mt-2 w-64 p-3 rounded-2xl border shadow-2xl backdrop-blur-xl z-50 flex flex-col gap-2.5 max-h-[80vh] overflow-y-auto ${
                    isDark
                      ? 'bg-[#0f172a]/95 border-slate-700 text-white'
                      : 'bg-white/95 border-slate-200 text-slate-900'
                  }`}
                >
                  {/* Segmented View Mode Switcher ("تفاعلي | هرمي") inside Tools Menu */}
                  <div className="flex flex-col gap-1 w-full">
                    <span className="text-[11px] font-bold opacity-60 text-right px-1">طريقة العرض:</span>
                    <div className={`flex items-center p-1 rounded-xl border shadow-sm ${themeColors.panelBg}`}>
                      <button
                        onClick={() => {
                          setMindmapViewMode?.('visual');
                          setIsToolsMenuOpen(false);
                        }}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          mindmapViewMode === 'visual'
                            ? `${themeColors.activeBtn}`
                            : 'opacity-70 hover:opacity-100 hover:bg-current/10'
                        }`}
                        title="عرض تفاعلي"
                      >
                        <Network size={14} />
                        <span>تفاعلي</span>
                      </button>
                      <button
                        onClick={() => {
                          setMindmapViewMode?.('list');
                          setIsToolsMenuOpen(false);
                        }}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          mindmapViewMode === 'list'
                            ? `${themeColors.activeBtn}`
                            : 'opacity-70 hover:opacity-100 hover:bg-current/10'
                        }`}
                        title="عرض هرمي"
                      >
                        <ListTree size={14} />
                        <span>هرمي</span>
                      </button>
                    </div>
                  </div>

                  {/* Fullscreen Button inside Tools Menu */}
                  <button
                    onClick={() => {
                      toggleFullscreen();
                      setIsToolsMenuOpen(false);
                    }}
                    className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all border ${
                      isFullscreen ? themeColors.activeBtn : `${themeColors.panelBg} hover:bg-current/10`
                    } w-full`}
                    title={isFullscreen ? "الخروج من ملء الشاشة" : "ملء الشاشة"}
                  >
                    {isFullscreen ? <Minimize size={15} className="shrink-0" /> : <Maximize size={15} className="shrink-0" />}
                    <span>{isFullscreen ? 'الخروج من ملء الشاشة' : 'ملء الشاشة'}</span>
                  </button>

                  {/* Fit View / Center Button ("توسيط الخريطة") */}
                  {mindmapViewMode === 'visual' && (
                    <button
                      onClick={() => {
                        setIsToolsMenuOpen(false);
                        fitView({ duration: 400, padding: 0.12 });
                      }}
                      className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all border ${themeColors.panelBg} hover:bg-current/10 w-full`}
                      title="توسيط الخريطة في الشاشة"
                    >
                      <Maximize2 size={16} className={`${themeColors.textAccent} shrink-0`} />
                      <span>توسيط الخريطة</span>
                    </button>
                  )}

                      {/* Direction Switcher ("أفقي | رأسي") */}
                      <div className={`flex items-center p-1 rounded-xl border shadow-sm ${themeColors.panelBg}`}>
                        <button
                          onClick={() => setLayoutDir('RL')}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            layoutDir === 'RL' 
                              ? `${themeColors.activeBtn}` 
                              : 'opacity-70 hover:opacity-100 hover:bg-current/10'
                          }`}
                          title="تخطيط أفقي"
                        >
                          <ArrowRightLeft size={15} />
                          <span>أفقي</span>
                        </button>
                        <button
                          onClick={() => setLayoutDir('TB')}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            layoutDir === 'TB' 
                              ? `${themeColors.activeBtn}` 
                              : 'opacity-70 hover:opacity-100 hover:bg-current/10'
                          }`}
                          title="تخطيط رأسي"
                        >
                          <ArrowUpDown size={15} />
                          <span>رأسي</span>
                        </button>
                      </div>

                      {/* Expand All Button */}
                      <button
                        onClick={expandAll}
                        className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all border ${
                          isAllExpanded
                            ? `${themeColors.badgeBg}`
                            : `${themeColors.panelBg} hover:bg-current/10`
                        } w-full`}
                        title="فتح جميع الفروع"
                      >
                        <UnfoldVertical size={16} className={`${themeColors.textAccent} shrink-0`} />
                        <span>فتح جميع الفروع</span>
                      </button>

                      {/* Collapse All Button */}
                      <button
                        onClick={collapseAll}
                        className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all border ${
                          isAllCollapsed
                            ? `${themeColors.badgeBg}`
                            : `${themeColors.panelBg} hover:bg-current/10`
                        } w-full`}
                        title="طي جميع الفروع"
                      >
                        <FoldVertical size={16} className={`${themeColors.textAccent} shrink-0`} />
                        <span>طي جميع الفروع</span>
                      </button>

                      {/* Smart Magnify Controls */}
                      <div className={`flex flex-col gap-1.5 rounded-xl p-2 shadow-sm border ${themeColors.panelBg}`}>
                        <button
                          onClick={() => setIsMagnifyMode(!isMagnifyMode)}
                          className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all w-full ${
                            isMagnifyMode 
                              ? `${themeColors.activeBtn}` 
                              : 'hover:bg-current/10'
                          }`}
                          title="التكبير الذكي عند مرور الماوس"
                        >
                          <Search size={15} />
                          <span>التكبير الذكي</span>
                        </button>

                        {isMagnifyMode && (
                          <div className="flex items-center justify-center gap-1 pt-1.5 border-t border-current/10">
                            {[1.5, 2.5, 3.5, 4.5, 6.0].map((scale) => (
                              <button
                                key={scale}
                                onClick={() => setMagnifyScale(scale)}
                                className={`px-1.5 py-0.5 text-[11px] font-extrabold rounded-md transition-all ${
                                  magnifyScale === scale
                                    ? `${themeColors.activeBtn} scale-105`
                                    : 'opacity-70 hover:opacity-100 hover:bg-current/10'
                                }`}
                                title={`نسبة التكبير ${scale}x`}
                              >
                                {scale}x
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Progress Tracker Widget */}
                      <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold shadow-sm border ${themeColors.panelBg}`}>
                        <CheckCircle2 size={17} className="text-emerald-500 dark:text-emerald-400 shrink-0" />
                        <div className="flex flex-col gap-1 w-full">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span>الإنجاز:</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{completedCount}/{totalNodesCount} ({progressPercentage}%)</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* PDF Export Button */}
                      <button
                        onClick={() => {
                          setIsToolsMenuOpen(false);
                          handleDownloadPdf();
                        }}
                        className="flex items-center justify-center gap-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-emerald-500/30 transition-all active:scale-95 w-full"
                        title="تصدير الخريطة بصيغة PDF"
                      >
                        <Download size={16} />
                        <span>تصدير PDF</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

        {/* VIEW MODE CONTENT AREA */}
        <div className="flex-1 w-full h-full relative overflow-hidden">
          <AnimatePresence mode="wait">
            {mindmapViewMode === 'list' ? (
              <motion.div
                key="list-view-mode"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="relative w-full h-full flex flex-col overflow-hidden"
              >
                {/* List Tree Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin" dir="rtl">
                  <div className="max-w-4xl mx-auto py-2">
                    {renderMindmapTreeNodes(data, isDark)}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="visual-view-mode"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full"
              >
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onNodeContextMenu={handleNodeContextMenu}
                  nodeTypes={nodeTypes}
                  connectionLineType={ConnectionLineType.Bezier}
                  fitView
                  fitViewOptions={{ padding: 0.12, minZoom: 0.25 }}
                  minZoom={0.2}
                  maxZoom={1.5}
                  className={themeColors.bg}
                  proOptions={{ hideAttribution: true }}
                >
                  <MountAutoFitViewController nodes={nodes} />
                  <SearchCameraController targetNodeId={currentFocusedNodeId} nodes={nodes} />
                  <LayoutCameraController layoutDir={layoutDir} />
                  <NodeFocusController focusTarget={focusTarget} nodes={nodes} />
                  <Background color={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'} gap={16} />
                  <Controls position="bottom-right" showFitView={false} showInteractive={false} className={`${themeColors.panelBg} rounded-xl overflow-hidden p-1 shadow-lg border m-3 z-10`} />
                </ReactFlow>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Personal Note Editor Modal */}
      {activeNoteModal && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4" dir="rtl">
          <div className={`border rounded-2xl p-6 w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-200 ${
            isDark 
              ? 'bg-[#0f172a] border-amber-500/40 text-white' 
              : 'bg-white border-slate-300 text-slate-900 shadow-2xl'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-current/10 mb-4">
              <div className="flex items-center gap-2 text-amber-500 font-bold text-lg">
                <StickyNote size={22} />
                <span>هامش / ملاحظة شخصية</span>
              </div>
              <button 
                onClick={() => setActiveNoteModal(null)}
                className="opacity-50 hover:opacity-100 transition-opacity"
              >
                <X size={20} />
              </button>
            </div>

            <p className="opacity-80 text-sm mb-3 font-semibold line-clamp-2">
              الفرع: <span className={`${themeColors.textAccent} font-bold`}>{activeNoteModal.label}</span>
            </p>

            <textarea
              value={activeNoteModal.text}
              onChange={(e) => setActiveNoteModal({ ...activeNoteModal, text: e.target.value })}
              placeholder="اكتب ملاحظتك الشخصية أو التلخيص الخاص بهذا الفرع هنا..."
              className={`w-full h-36 border rounded-xl p-3.5 text-sm focus:outline-none focus:border-amber-400 leading-relaxed resize-none ${
                isDark 
                  ? 'bg-black/30 border-white/20 text-white placeholder-white/40' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />

            <div className="flex items-center justify-between gap-3 mt-5 pt-3 border-t border-current/10">
              {activeNoteModal.text ? (
                <button
                  onClick={() => {
                    setNodeNotes((prev) => {
                      const next = { ...prev };
                      delete next[activeNoteModal.id];
                      return next;
                    });
                    setActiveNoteModal(null);
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-rose-500 bg-rose-500/10 border border-rose-500/30 text-sm font-bold hover:bg-rose-500/20 transition-all"
                >
                  <Trash2 size={16} />
                  حذف الملاحظة
                </button>
              ) : <div />}
              
              <div className="flex items-center gap-2 mr-auto">
                <button
                  onClick={() => setActiveNoteModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white/80 text-sm font-bold hover:bg-slate-300 dark:hover:bg-white/20 transition-all"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveNote}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 text-slate-950 text-sm font-bold hover:bg-amber-400 shadow-lg shadow-amber-500/20 transition-all"
                >
                  <Save size={16} />
                  حفظ الملاحظة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function VisualMindmap({
  data,
  mindmapViewMode = 'visual',
  setMindmapViewMode,
  onBack,
}: {
  data: MindmapNode[];
  mindmapViewMode?: 'list' | 'visual';
  setMindmapViewMode?: (v: 'list' | 'visual') => void;
  isDark?: boolean;
  onBack?: () => void;
}) {
  return (
    <ReactFlowProvider>
      <VisualMindmapContent
        data={data}
        mindmapViewMode={mindmapViewMode}
        setMindmapViewMode={setMindmapViewMode}
        onBack={onBack}
      />
    </ReactFlowProvider>
  );
}
