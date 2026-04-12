'use client';

import React, { useEffect, useState, useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  ReactFlowProvider, 
  useReactFlow, 
  BackgroundVariant,
  Connection
} from 'reactflow';
import 'reactflow/dist/style.css';
import { toast } from 'sonner';
import { useUser, UserButton, SignInButton } from '@clerk/nextjs';

import useFlowStore from '@/store/useFlowStore';
import Sidebar from '@/components/Sidebar'; 
import TextInputNode from '@/components/nodes/TextInputNode';
import LlmNode from '@/components/nodes/LlmNode';
import UploadNode from '@/components/nodes/UploadNode';
import CropNode from '@/components/nodes/CropNode';
import VideoAssetNode from '@/components/nodes/VideoAssetNode'; 
import FrameExtractNode from '@/components/nodes/FrameExtractNode';

const nodeTypes = {
  textNode: TextInputNode,
  llmNode: LlmNode,
  uploadNode: UploadNode,
  videoNode: VideoAssetNode, 
  processNode: CropNode,
  frameExtractNode: FrameExtractNode,
};

// --- FlowCanvas: Core logic for interaction ---
const FlowCanvas = () => {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect: onConnectStore, setNodes, setSelectedNode } = useFlowStore();
  const { screenToFlowPosition } = useReactFlow();

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/reactflow');
    const label = e.dataTransfer.getData('nodeLabel');
    const specificType = e.dataTransfer.getData('specificType');

    if (!type) return;

    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    
    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: { 
        label, 
        type: specificType || '', 
        isRunning: false, 
        userMessage: '', 
        result: '' 
      },
    };
    
    setNodes((nds: any) => [...nds, newNode]);
    toast.success(`${label} added to canvas`);
  }, [screenToFlowPosition, setNodes]);

  const onConnect = useCallback((params: Connection) => {
    if (params.source === params.target) {
      return toast.error("Circular loops are not permitted!");
    }
    onConnectStore(params);
  }, [onConnectStore]);

  return (
    // 🚀 FIX 1: Removed 'overflow-hidden' from wrapper to prevent event clipping
    <div className="absolute inset-0 w-full h-full pointer-events-auto">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_: any, node: any) => setSelectedNode(node)}
        onPaneClick={() => setSelectedNode(null)}
        nodeTypes={nodeTypes}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
        // 🚀 FIX 2: Explicitly enabling drag and selectable props
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        panOnDrag={true} 
        className="bg-[#f8fafc]"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />
        <Controls className="z-50" />
        <MiniMap className="rounded-lg border shadow-sm" />
      </ReactFlow>
    </div>
  );
};

export default function WorkflowPage() {
  const [mounted, setMounted] = useState(false);
  const { isLoaded, isSignedIn } = useUser();
  
  const { 
    nodes, edges, setNodes, setEdges, workflowId, setWorkflowId, updateNodeData 
  } = useFlowStore();

  useEffect(() => { setMounted(true); }, []);

  const onDragStart = (e: React.DragEvent, type: string, label: string, specific?: string) => {
    e.dataTransfer.setData('application/reactflow', type);
    e.dataTransfer.setData('nodeLabel', label);
    if (specific) e.dataTransfer.setData('specificType', specific);
    e.dataTransfer.effectAllowed = 'move';
  };

  const exportWorkflow = () => {
    const workflow = { nodes, edges };
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `galaxy-ai-workflow-${Date.now()}.json`;
    link.click();
    toast.success("Workflow Exported");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (f) => {
      try {
        const json = JSON.parse(f.target?.result as string);
        if (json.nodes && json.edges) {
          setNodes(json.nodes);
          setEdges(json.edges);
          toast.success("Workflow Restored");
        }
      } catch (err) { toast.error("Invalid JSON"); }
    };
    reader.readAsText(file);
  };

  const saveWorkflow = async () => {
    const toastId = toast.loading("Syncing to Neon Cloud...");
    try {
      const sanitizedNodes = nodes.map(node => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { fileContent, previewUrl, videoUrl, ...safeData } = node.data;
        return { ...node, data: safeData };
      });

      const response = await fetch("/api/workflows/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes: sanitizedNodes, edges, workflowId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Save failed");
      if (data.id) setWorkflowId(data.id);
      toast.success("Database Synced", { id: toastId });
    } catch (e: any) { toast.error(e.message, { id: toastId }); }
  };

  const runWorkflow = async () => {
    const toastId = toast.loading("Galaxy AI: Triggering Pipeline...");
    const currentNodes = useFlowStore.getState().nodes;
    const llmNodes = currentNodes.filter(n => n.type === 'llmNode');
    
    llmNodes.forEach(n => updateNodeData(n.id, { isRunning: true }));

    try {
      const nodesWithMedia = currentNodes.filter(n => n.data?.fileContent);
      const activeMedia = nodesWithMedia.find(n => n.type === 'frameExtractNode') || 
                          nodesWithMedia.find(n => n.type === 'processNode') || 
                          nodesWithMedia.find(n => n.type === 'uploadNode');

      const payload = {
        nodes: currentNodes.map(n => ({
          id: n.id,
          type: n.type,
          data: { 
            userMessage: n.data?.userMessage,
            systemPrompt: n.data?.systemPrompt,
            fileContent: n.id === activeMedia?.id ? n.data.fileContent : null,
            fileType: n.id === activeMedia?.id ? (n.data.fileType || 'image/jpeg') : null
          }
        })),
        edges: useFlowStore.getState().edges, 
        workflowId: useFlowStore.getState().workflowId
      };

      const res = await fetch('/api/run', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.text && data.nodeId) {
        updateNodeData(data.nodeId, { result: data.text, isRunning: false });
        toast.success("Execution Success", { id: toastId });
      } else {
        throw new Error(data.error || "Empty response");
      }
    } catch (e: any) {
      toast.error(e.message || "Execution Failed", { id: toastId });
      llmNodes.forEach(n => updateNodeData(n.id, { isRunning: false }));
    }
  };

  if (!mounted || !isLoaded) return <div className="h-screen w-full bg-white" />;

  return (
    <div className="flex flex-col h-screen w-full bg-[#fcfcfd] overflow-hidden">
      <header className="h-14 border-b bg-white flex items-center justify-between px-6 z-[60] shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-purple-600 p-1.5 rounded-lg text-white shadow-lg font-bold">✨</div>
          <span className="font-bold text-lg tracking-tight">NextFlow</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportWorkflow} className="text-[10px] font-black px-3 py-2 border rounded-xl hover:bg-slate-50 uppercase">Export</button>
          <label className="text-[10px] font-black px-3 py-2 border rounded-xl hover:bg-slate-50 uppercase cursor-pointer">
            Import
            <input type="file" className="hidden" accept=".json" onChange={handleImport} />
          </label>
          <button onClick={saveWorkflow} className="text-[10px] font-black px-3 py-2 border rounded-xl hover:bg-slate-50 uppercase">Save</button>
          <button onClick={runWorkflow} className="text-[10px] font-black px-5 py-2 bg-purple-600 text-white rounded-xl shadow-md hover:bg-purple-700 uppercase ml-1">Run</button>
          <div className="ml-2 border-l pl-4 shrink-0">{isSignedIn ? <UserButton /> : <SignInButton />}</div>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden relative">
        <aside className="w-64 border-r bg-white p-5 space-y-8 z-40 flex-shrink-0 overflow-y-auto">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Input Components</h3>
            <div onDragStart={(e) => onDragStart(e, 'textNode', 'Text Input')} draggable className="p-3 border rounded-xl text-xs font-semibold cursor-grab hover:bg-slate-50 transition-all flex items-center gap-3">
              📝 Text Input
            </div>
            <div onDragStart={(e) => onDragStart(e, 'uploadNode', 'Image Asset', 'image')} draggable className="p-3 border border-emerald-50 rounded-xl text-xs font-semibold cursor-grab hover:bg-emerald-50 transition-all flex items-center gap-3">
              🖼️ Image Asset
            </div>
            <div onDragStart={(e) => onDragStart(e, 'videoNode', 'Video Asset', 'video')} draggable className="p-3 border border-emerald-50 rounded-xl text-xs font-semibold cursor-grab hover:bg-emerald-50 transition-all flex items-center gap-3">
              🎥 Video Asset
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Processors</h3>
            <div onDragStart={(e) => onDragStart(e, 'frameExtractNode', 'Frame Extractor')} draggable className="p-3 border border-orange-200 bg-orange-50/50 rounded-xl text-xs font-semibold cursor-grab hover:bg-orange-100 transition-all flex items-center gap-3">
              ✂️ Frame Extractor
            </div>
            <div onDragStart={(e) => onDragStart(e, 'processNode', 'Image Crop', 'crop')} draggable className="p-3 border border-blue-50 rounded-xl text-xs font-semibold cursor-grab hover:bg-blue-50 transition-all flex items-center gap-3">
              ✂️ Image Crop
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Intelligence</h3>
            <div onDragStart={(e) => onDragStart(e, 'llmNode', 'Gemini 3 Flash')} draggable className="p-3 border-2 border-purple-100 bg-purple-50 text-purple-700 rounded-xl text-xs font-black cursor-grab shadow-sm flex items-center gap-3 hover:bg-purple-100">
              ✨ Gemini 3 Flash
            </div>
          </div>
        </aside>

        {/* 🚀 FIX 3: Added 'pointer-events-auto' to ensure pane interaction is allowed */}
        <div className="flex-grow relative bg-[#f8fafc] z-0 pointer-events-auto">
          <ReactFlowProvider><FlowCanvas /></ReactFlowProvider>
        </div>

        <aside className="w-80 border-l bg-white shrink-0 z-40 relative shadow-inner overflow-hidden">
          <Sidebar />
        </aside>
      </main>
    </div>
  );
}
