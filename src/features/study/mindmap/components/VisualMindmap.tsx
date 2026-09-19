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
        themeColors?.panelBg || 'bg-white/90 dark:bg-[#1a0730]/90 text-slate-800 dark:text-white border-purple-200/80 dark:border-white/20'
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
      fitView({ duration: 450, padding: 0.2 });
    }, 180);
    return () => clearTimeout(timer);
  }, [nodes.length, fitView]);

  return null;
}

function LayoutCameraController({ layoutDir }: { layoutDir: 'RL' | 'TB' }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ duration: 500, padding: 0.2 });
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
  
  const isHorizontal = direction === 'RL';
  dagreGraph.setGraph({ 
    rankdir: direction,
    nodesep: 40,
    ranksep: isHorizontal ? 130 : 90,
  });

  nodes.filter(n => !n.hidden).forEach((node) => {
    const labelText = node.data?.label || '';
    const h = getNodeHeight(labelText);
    dagreGraph.setNode(node.id, { width: 310, height: h });
  });

  edges.filter(e => !e.hidden).forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

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
          x: (sumX - nodeWithPosition.x) - 155,
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
          x: nodeWithPosition.x - 155,
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
}

function VisualMindmapContent({ data, mindmapViewMode = 'visual', setMindmapViewMode }: VisualMindmapContentProps) {
  const { getNodes, getNodesBounds, fitView } = useReactFlow();
  const { isDark } = useTheme();

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

  const flowRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);
  const lastRightClickRef = useRef<{ id: string; time: number } | null>(null);

  const themeColors = useMemo(() => {
    if (!isDark) {
      return {
        bg: 'bg-[#f5f3ff]',
        canvasBg: '#f5f3ff',
        edgeColor: '#8a17c9',
        border: 'border-purple-200/80',
        text: 'text-slate-900',
        panelBg: 'bg-white/90 backdrop-blur-xl border-purple-200/80 text-slate-800 shadow-[0_8px_30px_rgba(122,23,201,0.08)]',
      };
    }
    return {
      bg: 'bg-[#0f041c]/95',
      canvasBg: '#0f041c',
      edgeColor: '#38bdf8',
      border: 'border-white/10',
      text: 'text-white',
      panelBg: 'bg-[#1a0730]/90 border-white/20 text-white',
    };
  }, [isDark]);

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
            box-shadow: 0 0 70px rgba(122, 23, 201, 0.75), 0 10px 40px rgba(0, 0, 0, 0.9) !important;
            border-color: #a855f7 !important;
            cursor: pointer;
          }
        ` : ''}
      `}</style>

      {/* Main Mindmap Canvas / List Box */}
      <div className={`relative flex-1 h-full rounded-3xl overflow-hidden shadow-2xl border flex flex-col transition-colors duration-300 ${themeColors.bg} ${themeColors.border} ${isMagnifyMode && mindmapViewMode === 'visual' ? 'mindmap-magnify-active' : ''}`}>
        
        {/* UNIFIED TOP CONTROL BAR FOR BOTH MODES */}
        <div className="p-3.5 flex items-center justify-between border-b border-current/10 backdrop-blur-md z-30 shrink-0 gap-2 flex-wrap sm:flex-nowrap" dir="rtl">
          {/* RIGHT SIDE (RTL): Fullscreen Toggle + Segmented View Switcher ("تفاعلي | هرمي") */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shadow-sm border backdrop-blur-md transition-all active:scale-95 ${
                isFullscreen
                  ? 'bg-purple-600 text-white border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                  : `${themeColors.panelBg}`
              }`}
              title={isFullscreen ? "إغلاق ملء الشاشة" : "ملء الشاشة"}
            >
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
              <span className="hidden sm:inline">{isFullscreen ? 'تصغير' : 'ملء الشاشة'}</span>
            </button>

            {/* Segmented View Mode Switcher ("تفاعلي | هرمي") */}
            <div className={`flex items-center p-1 rounded-xl border shadow-sm backdrop-blur-md ${themeColors.panelBg}`}>
              <button
                onClick={() => setMindmapViewMode?.('visual')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mindmapViewMode === 'visual'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'opacity-70 hover:opacity-100 hover:bg-current/10'
                }`}
                title="عرض تفاعلي"
              >
                <Network size={14} />
                <span>تفاعلي</span>
              </button>
              <button
                onClick={() => setMindmapViewMode?.('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mindmapViewMode === 'list'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'opacity-70 hover:opacity-100 hover:bg-current/10'
                }`}
                title="عرض هرمي"
              >
                <ListTree size={14} />
                <span>هرمي</span>
              </button>
            </div>
          </div>

          {/* LEFT SIDE (RTL): Visual Mode Search & Tools Menu */}
          {mindmapViewMode === 'visual' && (
            <div className="flex items-center gap-2 shrink-0">
              {/* Search Input Box */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs shadow-sm border backdrop-blur-md ${themeColors.panelBg}`}>
                <Search size={15} className="text-amber-500 dark:text-amber-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="بحث في الخريطة..."
                  className="bg-transparent text-current placeholder-current/50 text-xs focus:outline-none w-24 sm:w-36"
                  dir="rtl"
                />
                {searchQuery && (
                  <button onClick={() => handleSearch('')} className="opacity-60 hover:opacity-100">
                    <X size={14} />
                  </button>
                )}
                {matchedNodeIds.length > 0 && (
                  <div className="flex items-center gap-1 border-r border-current/20 pr-1 shrink-0">
                    <span className="text-[11px] font-bold text-amber-500">
                      {currentMatchIndex + 1}/{matchedNodeIds.length}
                    </span>
                    <button onClick={handlePrevMatch} className="p-0.5"><ChevronRight size={13} /></button>
                    <button onClick={handleNextMatch} className="p-0.5"><ChevronLeft size={13} /></button>
                  </div>
                )}
              </div>

              {/* Floating Tools Dropdown Button */}
              <div className="relative">
                <button
                  onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shadow-sm border backdrop-blur-md transition-all active:scale-95 ${
                    isToolsMenuOpen
                      ? 'bg-purple-600 text-white border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                      : `${themeColors.panelBg} hover:bg-current/10`
                  }`}
                  title="أدوات الخريطة الإضافية"
                >
                  <SlidersHorizontal size={15} />
                  <span>أدوات الخريطة</span>
                  <ChevronDown size={14} className={`transition-transform duration-200 ${isToolsMenuOpen ? 'rotate-180' : ''}`} />
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
                          ? 'bg-[#150524]/95 border-purple-500/30 text-white'
                          : 'bg-white/95 border-purple-200 text-slate-900'
                      }`}
                    >
                      {/* Fit View / Center Button ("توسيط") */}
                      <button
                        onClick={() => {
                          setIsToolsMenuOpen(false);
                          fitView({ duration: 400, padding: 0.2 });
                        }}
                        className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all border ${themeColors.panelBg} hover:bg-current/10 w-full`}
                        title="توسيط الخريطة في الشاشة"
                      >
                        <Maximize2 size={16} className="text-amber-500 dark:text-amber-400 shrink-0" />
                        <span>توسيط الخريطة</span>
                      </button>

                      {/* Direction Switcher ("أفقي | رأسي") */}
                      <div className={`flex items-center p-1 rounded-xl border shadow-sm ${themeColors.panelBg}`}>
                        <button
                          onClick={() => setLayoutDir('RL')}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            layoutDir === 'RL' 
                              ? 'bg-purple-600 text-white shadow-md' 
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
                              ? 'bg-purple-600 text-white shadow-md' 
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
                            ? 'bg-purple-500/20 border-purple-500/40 text-purple-700 dark:text-[#38bdf8]'
                            : `${themeColors.panelBg} hover:bg-current/10`
                        } w-full`}
                        title="فتح جميع الفروع"
                      >
                        <UnfoldVertical size={16} className="text-purple-600 dark:text-purple-400 shrink-0" />
                        <span>فتح جميع الفروع</span>
                      </button>

                      {/* Collapse All Button */}
                      <button
                        onClick={collapseAll}
                        className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all border ${
                          isAllCollapsed
                            ? 'bg-purple-500/20 border-purple-500/40 text-purple-700 dark:text-[#38bdf8]'
                            : `${themeColors.panelBg} hover:bg-current/10`
                        } w-full`}
                        title="طي جميع الفروع"
                      >
                        <FoldVertical size={16} className="text-purple-600 dark:text-purple-400 shrink-0" />
                        <span>طي جميع الفروع</span>
                      </button>

                      {/* Smart Magnify Controls */}
                      <div className={`flex flex-col gap-1.5 rounded-xl p-2 shadow-sm border ${themeColors.panelBg}`}>
                        <button
                          onClick={() => setIsMagnifyMode(!isMagnifyMode)}
                          className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all w-full ${
                            isMagnifyMode 
                              ? 'bg-[#12041f] text-[#38bdf8] border border-[#38bdf8]/40 shadow-sm' 
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
                                    ? 'bg-purple-600 text-white shadow-md scale-105'
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
          )}
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
                  fitViewOptions={{ padding: 0.2, minZoom: 0.7 }}
                  minZoom={0.2}
                  maxZoom={1.5}
                  className={themeColors.bg}
                  proOptions={{ hideAttribution: true }}
                >
                  <MountAutoFitViewController nodes={nodes} />
                  <SearchCameraController targetNodeId={currentFocusedNodeId} nodes={nodes} />
                  <LayoutCameraController layoutDir={layoutDir} />
                  <NodeFocusController focusTarget={focusTarget} nodes={nodes} />
                  <Background color={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(122,23,201,0.06)'} gap={16} />
                  <Controls position="bottom-left" className={`${themeColors.panelBg} rounded-xl overflow-hidden p-1 shadow-lg border m-3 z-10`} />
                </ReactFlow>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Personal Note Editor Modal */}
      {activeNoteModal && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4" dir="rtl">
          <div className={`border rounded-3xl p-6 w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-200 ${
            isDark 
              ? 'bg-[#1a0730] border-amber-500/40 text-white' 
              : 'bg-white border-purple-300 text-slate-900 shadow-[0_20px_50px_rgba(122,23,201,0.15)]'
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
              الفرع: <span className="text-purple-600 dark:text-[#38bdf8] font-bold">{activeNoteModal.label}</span>
            </p>

            <textarea
              value={activeNoteModal.text}
              onChange={(e) => setActiveNoteModal({ ...activeNoteModal, text: e.target.value })}
              placeholder="اكتب ملاحظتك الشخصية أو التلخيص الخاص بهذا الفرع هنا..."
              className={`w-full h-36 border rounded-xl p-3.5 text-sm focus:outline-none focus:border-amber-400 leading-relaxed resize-none ${
                isDark 
                  ? 'bg-[#12041f] border-white/20 text-white placeholder-white/40' 
                  : 'bg-slate-50 border-purple-200 text-slate-900 placeholder-slate-400'
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

export function VisualMindmap({ data, mindmapViewMode = 'visual', setMindmapViewMode }: { data: MindmapNode[]; mindmapViewMode?: 'list' | 'visual'; setMindmapViewMode?: (v: 'list' | 'visual') => void; isDark?: boolean; }) {
  return (
    <ReactFlowProvider>
      <VisualMindmapContent data={data} mindmapViewMode={mindmapViewMode} setMindmapViewMode={setMindmapViewMode} />
    </ReactFlowProvider>
  );
}
