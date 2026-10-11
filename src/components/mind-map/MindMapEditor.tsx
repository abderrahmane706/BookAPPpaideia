"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type NodeChange,
} from "@xyflow/react";
import { Button, ConfirmDialog, notify } from "@/components/ui";
import {
  arrangeNodes,
  createEdge,
  createNode,
  mindMapService,
  mindMapUid,
  parseMindMapJson,
  type SanitizedGraph,
} from "@/lib/services/mindmap";
import type {
  MindMap,
  MindMapEdge,
  MindMapEdgeData,
  MindMapEdgeType,
  MindMapNode,
  MindMapNodeData,
  MindMapNodeKind,
  MindMapNodeStyle,
  MindMapViewport,
} from "@/lib/types/mindmap";
import { MindMapToolbar } from "./MindMapToolbar";
import { MindMapNodePalette } from "./MindMapNodePalette";
import { MindMapInspector } from "./MindMapInspector";
import { MindMapExportDialog } from "./MindMapExportDialog";
import { MindMapFlow, type MindMapSelection } from "./MindMapFlow";
import {
  decorateEdge,
  edgeData,
  persistableEdge,
  persistableNode,
} from "./mindMapVisuals";
import type { MindMapSaveStatus } from "./MindMapSaveIndicator";

const MAX_HISTORY = 60;
const GRAPH_DEBOUNCE = 600;
const TITLE_DEBOUNCE = 500;
const VIEWPORT_DEBOUNCE = 700;

interface Graph {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
}

type MobilePanel = "none" | "nodes" | "inspector";

export interface MindMapEditorProps {
  map: MindMap;
  bookTitle: string;
  backHref: string;
  maps: { id: string; title: string }[];
  onSelectMap: (id: string) => void;
  onNewMap: () => void;
  onDuplicateMap: () => void;
  onDeleteMap: () => void;
}

function EditorBody({
  map,
  bookTitle,
  backHref,
  maps,
  onSelectMap,
  onNewMap,
  onDuplicateMap,
  onDeleteMap,
}: MindMapEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<MindMapNode>(map.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<MindMapEdge>(
    map.edges.map(decorateEdge),
  );

  const { screenToFlowPosition, fitView: rfFitView, zoomIn: rfZoomIn, zoomOut: rfZoomOut } =
    useReactFlow();

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const past = useRef<Graph[]>([]);
  const future = useRef<Graph[]>([]);
  const gesture = useRef<Graph | null>(null);

  const [selection, setSelection] = useState<MindMapSelection>({
    nodeId: null,
    edgeId: null,
  });
  const [history, setHistory] = useState({ canUndo: false, canRedo: false });
  const [saveStatus, setSaveStatus] = useState<MindMapSaveStatus>("idle");
  const [title, setTitle] = useState(map.title);
  const [panel, setPanel] = useState<MobilePanel>("none");
  const [exportOpen, setExportOpen] = useState(false);
  const [exportMap, setExportMap] = useState<MindMap | null>(null);
  const [pendingImport, setPendingImport] = useState<SanitizedGraph | null>(null);

  const viewportRef = useRef<MindMapViewport>(map.viewport);

  /* ---------------------------- history helpers ---------------------------- */

  const snapshot = (): Graph => ({
    nodes: nodes.map(persistableNode),
    edges: edges.map(persistableEdge),
  });

  const emitHistory = (nextPast: Graph[], nextFuture: Graph[]) =>
    setHistory({ canUndo: nextPast.length > 0, canRedo: nextFuture.length > 0 });

  const record = () => {
    past.current.push(snapshot());
    if (past.current.length > MAX_HISTORY) past.current.shift();
    future.current = [];
    emitHistory(past.current, future.current);
  };

  const applyGraph = (nextNodes: MindMapNode[], nextEdges: MindMapEdge[]) => {
    record();
    setNodes(nextNodes);
    setEdges(nextEdges);
  };

  /* ------------------------------ persistence ------------------------------ */

  const firstGraph = useRef(true);
  const lastGraph = useRef("");
  const graphTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingGraph = useRef<{ nodes: MindMapNode[]; edges: MindMapEdge[] } | null>(
    null,
  );
  useEffect(() => {
    const nextNodes = nodes.map(persistableNode);
    const nextEdges = edges.map(persistableEdge);
    const serialized = JSON.stringify({ nextNodes, nextEdges });
    if (firstGraph.current) {
      firstGraph.current = false;
      lastGraph.current = serialized;
      return;
    }
    if (serialized === lastGraph.current) return;
    lastGraph.current = serialized;
    pendingGraph.current = { nodes: nextNodes, edges: nextEdges };
    setSaveStatus("saving");
    if (graphTimer.current) clearTimeout(graphTimer.current);
    graphTimer.current = setTimeout(() => {
      mindMapService.update(map.id, { nodes: nextNodes, edges: nextEdges });
      setSaveStatus("saved");
    }, GRAPH_DEBOUNCE);
  }, [nodes, edges, map.id]);

  const firstTitle = useRef(true);
  const titleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTitle = useRef<string | null>(null);
  useEffect(() => {
    if (firstTitle.current) {
      firstTitle.current = false;
      return;
    }
    pendingTitle.current = title;
    setSaveStatus("saving");
    if (titleTimer.current) clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(() => {
      mindMapService.update(map.id, { title });
      setSaveStatus("saved");
    }, TITLE_DEBOUNCE);
  }, [title, map.id]);

  const viewportTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleMove = (viewport: MindMapViewport) => {
    viewportRef.current = viewport;
    if (viewportTimer.current) clearTimeout(viewportTimer.current);
    viewportTimer.current = setTimeout(() => {
      mindMapService.update(map.id, { viewport });
    }, VIEWPORT_DEBOUNCE);
  };

  /** Commit any pending debounced graph/title work immediately (Ctrl/Cmd+S). */
  const flushSave = () => {
    if (graphTimer.current) clearTimeout(graphTimer.current);
    if (titleTimer.current) clearTimeout(titleTimer.current);
    if (viewportTimer.current) clearTimeout(viewportTimer.current);
    mindMapService.update(map.id, {
      nodes: nodes.map(persistableNode),
      edges: edges.map(persistableEdge),
      title,
      viewport: viewportRef.current,
    });
    setSaveStatus("saved");
  };

  /** Flush any in-flight debounces when the editor unmounts or the map changes. */
  useEffect(() => {
    return () => {
      if (graphTimer.current) {
        clearTimeout(graphTimer.current);
        if (pendingGraph.current) mindMapService.update(map.id, pendingGraph.current);
      }
      if (titleTimer.current) {
        clearTimeout(titleTimer.current);
        if (pendingTitle.current !== null) {
          mindMapService.update(map.id, { title: pendingTitle.current });
        }
      }
      if (viewportTimer.current) {
        clearTimeout(viewportTimer.current);
        mindMapService.update(map.id, { viewport: viewportRef.current });
      }
    };
  }, [map.id]);

  /* -------------------------------- mutations ------------------------------ */

  const handleNodesChange = (changes: NodeChange<MindMapNode>[]) => {
    const active = changes.some(
      (change) =>
        (change.type === "position" && change.dragging) ||
        (change.type === "dimensions" && change.resizing),
    );
    if (active && !gesture.current) gesture.current = snapshot();
    onNodesChange(changes);
    if (!active && gesture.current) {
      past.current.push(gesture.current);
      if (past.current.length > MAX_HISTORY) past.current.shift();
      future.current = [];
      gesture.current = null;
      emitHistory(past.current, future.current);
    }
  };

  const addNode = (kind: MindMapNodeKind) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const point = screenToFlowPosition({
      x: rect ? rect.left + rect.width / 2 : window.innerWidth / 2,
      y: rect ? rect.top + rect.height / 2 : window.innerHeight / 2,
    });
    const offset = (nodes.length % 5) * 26;
    const node = createNode(kind, {
      x: point.x - 92 + offset,
      y: point.y - 28 + offset,
    });
    node.selected = true;
    applyGraph(
      [...nodes.map((existing) => ({ ...existing, selected: false })), node],
      edges,
    );
    setPanel("none");
  };

  const addConnectedNode = (sourceId: string, kind: MindMapNodeKind = "concept") => {
    const source = nodes.find((node) => node.id === sourceId);
    if (!source) return;
    const siblings = edges.filter((edge) => edge.source === sourceId).length;
    const node = createNode(kind, {
      x: source.position.x + 300,
      y: source.position.y + (siblings - 1) * 92,
    });
    node.selected = true;
    applyGraph(
      [...nodes.map((existing) => ({ ...existing, selected: false })), node],
      [...edges, decorateEdge(createEdge(sourceId, node.id))],
    );
  };

  const updateNodeData = (id: string, patch: Partial<MindMapNodeData>) => {
    applyGraph(
      nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...patch } } : node,
      ),
      edges,
    );
  };

  const updateNodeStyle = (id: string, patch: Partial<MindMapNodeStyle>) => {
    applyGraph(
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, style: { ...node.data.style, ...patch } } }
          : node,
      ),
      edges,
    );
  };

  const updateEdgeData = (id: string, patch: Partial<MindMapEdgeData>) => {
    applyGraph(
      nodes,
      edges.map((edge) =>
        edge.id === id ? decorateEdge({ ...edge, data: { ...edgeData(edge), ...patch } }) : edge,
      ),
    );
  };

  const updateEdgeType = (id: string, type: MindMapEdgeType) => {
    applyGraph(
      nodes,
      edges.map((edge) => (edge.id === id ? decorateEdge({ ...edge, type }) : edge)),
    );
  };

  const deleteSelection = () => {
    const removedNodes = new Set(
      nodes.filter((node) => node.selected).map((node) => node.id),
    );
    const removedEdges = new Set(
      edges.filter((edge) => edge.selected).map((edge) => edge.id),
    );
    if (removedNodes.size === 0 && removedEdges.size === 0) return;
    applyGraph(
      nodes.filter((node) => !removedNodes.has(node.id)),
      edges.filter(
        (edge) =>
          !removedEdges.has(edge.id) &&
          !removedNodes.has(edge.source) &&
          !removedNodes.has(edge.target),
      ),
    );
    setSelection({ nodeId: null, edgeId: null });
  };

  const deleteNode = (id: string) => {
    applyGraph(
      nodes.filter((node) => node.id !== id),
      edges.filter((edge) => edge.source !== id && edge.target !== id),
    );
    setSelection({ nodeId: null, edgeId: null });
  };

  const duplicateSelection = () => {
    const selected = nodes.filter((node) => node.selected);
    if (selected.length === 0) return;
    const idMap = new Map<string, string>();
    const clones = selected.map((node) => {
      const id = mindMapUid("mn");
      idMap.set(node.id, id);
      return {
        ...node,
        id,
        selected: true,
        position: { x: node.position.x + 40, y: node.position.y + 40 },
        data: { ...node.data, style: { ...node.data.style } },
      };
    });
    applyGraph(
      [...nodes.map((node) => ({ ...node, selected: false })), ...clones],
      [
        ...edges,
        ...edges
          .filter((edge) => idMap.has(edge.source) && idMap.has(edge.target))
          .map((edge) =>
            decorateEdge({
              ...edge,
              id: mindMapUid("me"),
              source: idMap.get(edge.source) as string,
              target: idMap.get(edge.target) as string,
              data: edgeData(edge),
            }),
          ),
      ],
    );
  };

  const organize = () => applyGraph(arrangeNodes(nodes, edges), edges);

  const selectAll = () => {
    setNodes(nodes.map((node) => ({ ...node, selected: true })));
    setEdges(edges.map((edge) => ({ ...edge, selected: true })));
  };

  const connect = (connection: { source?: string | null; target?: string | null }) => {
    if (!connection.source || !connection.target) return;
    if (connection.source === connection.target) return;
    const duplicate = edges.some(
      (edge) =>
        edge.source === connection.source && edge.target === connection.target,
    );
    if (duplicate) return;
    applyGraph(
      nodes,
      [...edges, decorateEdge(createEdge(connection.source, connection.target))],
    );
  };

  const undo = () => {
    const previous = past.current.pop();
    if (!previous) return;
    future.current.push(snapshot());
    setNodes(previous.nodes);
    setEdges(previous.edges);
    emitHistory(past.current, future.current);
  };

  const redo = () => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(snapshot());
    setNodes(next.nodes);
    setEdges(next.edges);
    emitHistory(past.current, future.current);
  };

  /* --------------------------------- import -------------------------------- */

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const text = await file.text();
    const result = parseMindMapJson(text);
    if (!result.ok) {
      notify(result.error, "error");
      return;
    }
    setPendingImport(result.graph);
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    applyGraph(
      pendingImport.nodes,
      pendingImport.edges.map(decorateEdge),
    );
    setTitle(pendingImport.title);
    viewportRef.current = pendingImport.viewport;
    mindMapService.update(map.id, { viewport: pendingImport.viewport });
    setPendingImport(null);
    setSelection({ nodeId: null, edgeId: null });
    notify("Map imported.");
    requestAnimationFrame(() => rfFitView({ padding: 0.2, duration: 200 }));
  };

  /* -------------------------------- derived -------------------------------- */

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selection.nodeId) ?? null,
    [nodes, selection.nodeId],
  );
  const selectedEdge = useMemo(
    () => edges.find((edge) => edge.id === selection.edgeId) ?? null,
    [edges, selection.edgeId],
  );

  const openExport = () => {
    setExportMap({
      ...map,
      title,
      nodes: nodes.map(persistableNode),
      edges: edges.map(persistableEdge),
      viewport: viewportRef.current,
    });
    setExportOpen(true);
  };

  const api = useMemo(
    () => ({ updateNodeData, updateNodeStyle, addConnectedNode, deleteNode }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodes, edges],
  );

  const handleSelectionChange = (next: MindMapSelection) => {
    setSelection((prev) =>
      prev.nodeId === next.nodeId && prev.edgeId === next.edgeId ? prev : next,
    );
  };

  /** Shortcuts are read through a ref so the listener binds once. */
  const shortcuts = useRef({ undo, redo, selectAll, deleteSelection, flushSave });
  useEffect(() => {
    shortcuts.current = { undo, redo, selectAll, deleteSelection, flushSave };
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (event.key === "Escape") {
        setNodes((current) => current.map((node) => ({ ...node, selected: false })));
        setEdges((current) => current.map((edge) => ({ ...edge, selected: false })));
        setSelection({ nodeId: null, edgeId: null });
        setPanel("none");
        return;
      }
      const mod = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();
      const actions = shortcuts.current;

      if (mod && key === "s") {
        event.preventDefault();
        actions.flushSave();
        return;
      }
      if (typing) return;
      if (mod && key === "z" && !event.shiftKey) {
        event.preventDefault();
        actions.undo();
      } else if (mod && (key === "y" || (key === "z" && event.shiftKey))) {
        event.preventDefault();
        actions.redo();
      } else if (mod && key === "a") {
        const canvasFocused =
          canvasRef.current?.contains(document.activeElement) ||
          document.activeElement === document.body;
        if (canvasFocused) {
          event.preventDefault();
          actions.selectAll();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setNodes, setEdges]);

  return (
    <div className="flex h-[calc(100dvh-6.5rem)] min-h-[34rem] flex-col overflow-hidden rounded-radius-lg border border-line bg-surface shadow-card">
      <MindMapToolbar
        bookTitle={bookTitle}
        backHref={backHref}
        title={title}
        onTitleChange={setTitle}
        maps={maps}
        activeMapId={map.id}
        onSelectMap={onSelectMap}
        onNewMap={onNewMap}
        onDuplicateMap={onDuplicateMap}
        onDeleteMap={onDeleteMap}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        onUndo={undo}
        onRedo={redo}
        onAddNode={addNode}
        onOrganize={organize}
        onFitView={() => rfFitView({ padding: 0.2, duration: 220 })}
        onZoomIn={() => rfZoomIn({ duration: 160 })}
        onZoomOut={() => rfZoomOut({ duration: 160 })}
        onSelectAll={selectAll}
        onDeleteSelection={deleteSelection}
        onExport={openExport}
        onImport={() => fileRef.current?.click()}
        saveStatus={saveStatus}
        onToggleNodes={() => setPanel((p) => (p === "nodes" ? "none" : "nodes"))}
        onToggleInspector={() =>
          setPanel((p) => (p === "inspector" ? "none" : "inspector"))
        }
      />

      <div className="relative flex min-h-0 flex-1">
        <aside className="hidden w-48 shrink-0 overflow-y-auto border-r border-line p-3 lg:block">
          <p className="mb-2 font-utility text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            Add a node
          </p>
          <MindMapNodePalette onAdd={addNode} />
        </aside>

        <div ref={canvasRef} className="relative min-h-0 min-w-0 flex-1">
          <MindMapFlow
            nodes={nodes}
            edges={edges}
            api={api}
            viewport={map.viewport}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={connect}
            onBeforeDelete={async () => {
              record();
              return true;
            }}
            onSelectionChange={handleSelectionChange}
            onMove={handleMove}
          />
        </div>

        <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-line p-4 lg:block">
          <MindMapInspector
            node={selectedNode}
            edge={selectedEdge}
            onNodeData={(patch) => selection.nodeId && updateNodeData(selection.nodeId, patch)}
            onNodeStyle={(patch) => selection.nodeId && updateNodeStyle(selection.nodeId, patch)}
            onEdgeData={(patch) => selection.edgeId && updateEdgeData(selection.edgeId, patch)}
            onEdgeType={(type) => selection.edgeId && updateEdgeType(selection.edgeId, type)}
            onDuplicate={duplicateSelection}
            onDelete={() => (selection.nodeId ? deleteNode(selection.nodeId) : deleteSelection())}
          />
        </aside>

        {panel !== "none" ? (
          <div className="absolute inset-0 z-20 flex flex-col bg-parchment/97 backdrop-blur-sm lg:hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-2">
              <span className="font-utility text-xs uppercase tracking-wider text-ink-soft">
                {panel === "nodes" ? "Add a node" : "Appearance"}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setPanel("none")}>
                Close
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {panel === "nodes" ? (
                <MindMapNodePalette onAdd={addNode} />
              ) : (
                <MindMapInspector
                  node={selectedNode}
                  edge={selectedEdge}
                  onNodeData={(patch) =>
                    selectedNode && updateNodeData(selectedNode.id, patch)
                  }
                  onNodeStyle={(patch) =>
                    selectedNode && updateNodeStyle(selectedNode.id, patch)
                  }
                  onEdgeData={(patch) =>
                    selectedEdge && updateEdgeData(selectedEdge.id, patch)
                  }
                  onEdgeType={(type) =>
                    selectedEdge && updateEdgeType(selectedEdge.id, type)
                  }
                  onDuplicate={duplicateSelection}
                  onDelete={deleteSelection}
                />
              )}
            </div>
          </div>
        ) : null}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={onFileChange}
      />

      {exportMap ? (
        <MindMapExportDialog
          open={exportOpen}
          onClose={() => setExportOpen(false)}
          map={exportMap}
        />
      ) : null}

      <ConfirmDialog
        open={pendingImport !== null}
        title="Replace this map?"
        description="Importing replaces the current nodes and connections — and the title — with the file's contents. This can be undone with Ctrl/Cmd+Z."
        confirmLabel="Import and replace"
        destructive
        onClose={() => setPendingImport(null)}
        onConfirm={confirmImport}
      />
    </div>
  );
}

/** Full-screen mind-map editor (owns graph state, history and autosave). */
export function MindMapEditor(props: MindMapEditorProps) {
  return (
    <ReactFlowProvider>
      <EditorBody {...props} />
    </ReactFlowProvider>
  );
}
