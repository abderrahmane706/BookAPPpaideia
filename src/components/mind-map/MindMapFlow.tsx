"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type {
  MindMapEdge,
  MindMapNode,
  MindMapViewport,
} from "@/lib/types/mindmap";
import { MindMapCanvasContext, type MindMapCanvasApi } from "./mindMapContext";
import { nodeTypes } from "./mindMapVisuals";

export interface MindMapSelection {
  nodeId: string | null;
  edgeId: string | null;
}

export interface MindMapFlowProps {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  api: MindMapCanvasApi;
  viewport?: MindMapViewport | null;
  onNodesChange: OnNodesChange<MindMapNode>;
  onEdgesChange: OnEdgesChange<MindMapEdge>;
  onConnect: (connection: { source?: string | null; target?: string | null }) => void;
  onBeforeDelete: () => Promise<boolean>;
  onSelectionChange: (selection: MindMapSelection) => void;
  onMove: (viewport: MindMapViewport) => void;
  readOnly?: boolean;
}

/**
 * The canvas surface: a themed React Flow configured for the mind-map domain.
 * Deliberately presentational — the editor above it owns graph state and
 * history, and hands an imperative API down through context for node-local
 * edits.
 */
export function MindMapFlow({
  nodes,
  edges,
  api,
  viewport,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onBeforeDelete,
  onSelectionChange,
  onMove,
  readOnly = false,
}: MindMapFlowProps) {
  return (
    <MindMapCanvasContext.Provider value={api}>
      <ReactFlow<MindMapNode, MindMapEdge>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={(connection) => onConnect(connection)}
        onBeforeDelete={onBeforeDelete as unknown as import("@xyflow/react").OnBeforeDelete<MindMapNode, MindMapEdge>}
        deleteKeyCode={readOnly ? null : ["Delete", "Backspace"]}
        onMove={(_, next) => onMove(next)}
        onSelectionChange={({ nodes: selectedNodes, edges: selectedEdges }) =>
          onSelectionChange({
            nodeId: selectedNodes[0]?.id ?? null,
            edgeId: selectedEdges[0]?.id ?? null,
          })
        }
        defaultViewport={{
          x: viewport?.x ?? 0,
          y: viewport?.y ?? 0,
          zoom: viewport?.zoom ?? 1,
        }}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable
        minZoom={0.2}
        maxZoom={2.5}
        className="paideia-flow"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1.4}
          color="var(--mm-canvas-dot)"
        />
        <Controls showInteractive={false} position="bottom-right" />
        <MiniMap
          pannable
          zoomable
          nodeStrokeWidth={2}
          nodeColor="var(--mmc-fill-pale)"
          maskColor="var(--mm-canvas-dot)"
        />
      </ReactFlow>
    </MindMapCanvasContext.Provider>
  );
}
