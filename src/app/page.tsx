'use client';

import React, { useEffect, useState, useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  ReactFlowProvider, 
  useReactFlow, 
  BackgroundVariant 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { toast } from 'sonner';
import { useUser, UserButton, SignInButton } from '@clerk/nextjs';

import useFlowStore from '@/store/useFlowStore';
import Sidebar from '@/components/Sidebar'; 
import TextInputNode from '@/components/nodes/TextInputNode';
import LlmNode from '@/components/nodes/LlmNode';
import UploadNode from '@/components/nodes/UploadNode';
import ProcessNode from '@/components/nodes/ProcessNode';
import CropNode from '@/components/nodes/CropNode';

// Mapping all multimodal components - DTU Project Standard
const nodeTypes = {
  textNode: TextInputNode,
  llmNode: LlmNode,
  uploadNode: UploadNode,
  processNode: CropNode,
};

// --- FlowCanvas: Core logic for interaction & Drop ---
const FlowCanvas = () => {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setNodes, setSelectedNode } = useFlowStore();
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

    // Fix: Convert screen pixel position to React Flow coordinate system
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

  return (
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
  className="bg-[#f8fafc]"
  
  // 🔥 ADD THESE 4 PROPS TO FIX FOCUS & EDITING:
  nodesFocusable={true}
  elementsSelectable={true}
  selectNodesOnDrag={false} 
  deleteKeyCode={["Backspace", "Delete"]}
>
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />
        <Controls className="z-50" />
        <MiniMap className="rounded-lg border shadow-sm" />
      </ReactFlow>
    </div>
  );
};

// --- Main Workflow Page ---
export default function WorkflowPage() {
  const [mounted, setMounted] = useState(false);
  const { isLoaded, isSignedIn } = useUser();
  
  const { 
    nodes, edges, setNodes, workflowId, setWorkflowId, updateNodeData 
  } = useFlowStore();

  useEffect(() => { 
    setMounted(true); 
  }, []);

  // Drag Start: Sidebar items trigger
  const onDragStart = (e: React.DragEvent, type: string, label: string, specific?: string) => {
    e.dataTransfer.setData('application/reactflow', type);
    e.dataTransfer.setData('nodeLabel', label);
    if (specific) e.dataTransfer.setData('specificType', specific);
    e.dataTransfer.effectAllowed = 'move';
  };

  // PERSISTENCE: Save workflow to Neon DB (RESTORED)
  const saveWorkflow = async () => {
    const toastId = toast.loading("Syncing to Neon Cloud...");
    try {
      const response = await fetch("/api/workflows/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges, workflowId }),
      });
      const data = await response.json();
      if (data.id) setWorkflowId(data.id);
      toast.success("Database Synced Successfully", { id: toastId });
    } catch (e) { 
      toast.error("Neon Connection Failed", { id: toastId }); 
    }
  };

  // EXECUTION: Run Gemini 3 Pipeline
  const runWorkflow = async () => {
    const toastId = toast.loading("Galaxy AI: Triggering Pipeline...");
    nodes.filter(n => n.type === 'llmNode').forEach(n => updateNodeData(n.id, { isRunning: true }));

    try {
      const res = await fetch('/api/run', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges, workflowId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Execution timeout.");

      if (data.text && data.nodeId) {
        updateNodeData(data.nodeId, { result: data.text, isRunning: false });
        toast.success("Galaxy AI: Execution Success", { id: toastId });
      }
    } catch (e: any) {
      toast.error(e.message, { id: toastId });
      setNodes((nds: any) => nds.map((n: any) => ({
        ...n,
        data: { ...n.data, isRunning: false }
      })));
    }
  };

  if (!mounted || !isLoaded) return <div className="h-screen w-full bg-white" />;

  return (
    <div className="flex flex-col h-screen w-full bg-[#fcfcfd] overflow-hidden font-sans">
      {/* HEADER: DTU Standard UI */}
      <header className="h-14 border-b bg-white flex items-center justify-between px-6 z-[60] shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-purple-600 p-1.5 rounded-lg text-white shadow-lg">✨</div>
          <span className="font-bold text-lg tracking-tight">NextFlow</span>
          <span className="ml-2 text-[9px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-bold border border-purple-100 uppercase tracking-widest leading-none">Galaxy AI</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={saveWorkflow} className="text-xs font-bold px-4 py-2 border rounded-xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
            Save to Neon
          </button>
          <button onClick={runWorkflow} className="text-xs font-bold px-6 py-2 bg-purple-600 text-white rounded-xl shadow-md hover:bg-purple-700 transition-all active:scale-95">
            Run Workflow
          </button>
          <div className="ml-2 border-l pl-4 shrink-0">
             {isSignedIn ? <UserButton /> : <SignInButton />}
          </div>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden relative">
        {/* LEFT SIDEBAR: Full Asset List */}
        <aside className="w-64 border-r bg-white p-5 space-y-8 z-40 relative flex-shrink-0 overflow-y-auto shadow-sm">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Input Components</h3>
            <div onDragStart={(e) => onDragStart(e, 'textNode', 'Text Input')} draggable className="p-3 border rounded-xl text-xs font-semibold cursor-grab hover:bg-slate-50 transition-all flex items-center gap-3 group active:cursor-grabbing">
              <span className="bg-slate-100 p-1.5 rounded-lg group-hover:bg-purple-100">📝</span> Text Input
            </div>
            <div onDragStart={(e) => onDragStart(e, 'uploadNode', 'Image Asset', 'image')} draggable className="p-3 border border-emerald-50 rounded-xl text-xs font-semibold cursor-grab hover:bg-emerald-50 transition-all flex items-center gap-3 group active:cursor-grabbing">
              <span className="bg-emerald-50 p-1.5 rounded-lg group-hover:bg-emerald-100">🖼️</span> Image Asset
            </div>
            <div onDragStart={(e) => onDragStart(e, 'uploadNode', 'Video Asset', 'video')} draggable className="p-3 border border-emerald-50 rounded-xl text-xs font-semibold cursor-grab hover:bg-emerald-50 transition-all flex items-center gap-3 group active:cursor-grabbing">
              <span className="bg-emerald-50 p-1.5 rounded-lg group-hover:bg-emerald-100">🎥</span> Video Asset
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Intelligence</h3>
            <div onDragStart={(e) => onDragStart(e, 'llmNode', 'Gemini 3 Flash')} draggable className="p-3 border-2 border-purple-100 bg-purple-50 text-purple-700 rounded-xl text-xs font-black cursor-grab shadow-sm flex items-center gap-3 hover:bg-purple-100 transition-all active:cursor-grabbing">
              <span className="bg-purple-200 p-1.5 rounded-lg font-normal">✨</span> Gemini 3 Flash
            </div>
            <div onDragStart={(e) => onDragStart(e, 'processNode', 'Image Crop', 'crop')} draggable className="p-3 border border-blue-50 rounded-xl text-xs font-semibold cursor-grab hover:bg-blue-50 transition-all flex items-center gap-3 group active:cursor-grabbing">
              <span className="bg-blue-50 p-1.5 rounded-lg group-hover:bg-blue-100">✂️</span> Image Crop
            </div>
            <div onDragStart={(e) => onDragStart(e, 'processNode', 'Frame Extract', 'extract')} draggable className="p-3 border border-blue-50 rounded-xl text-xs font-semibold cursor-grab hover:bg-blue-50 transition-all flex items-center gap-3 group active:cursor-grabbing">
              <span className="bg-blue-50 p-1.5 rounded-lg group-hover:bg-blue-100">🎞️</span> Frame Extract
            </div>
          </div>
        </aside>

        {/* CENTER CANVAS: Fixing Pointer Events & Drop Zone */}
        <div className="flex-grow relative bg-[#f8fafc] z-0 h-full w-full pointer-events-auto min-h-0 min-w-0">
          <ReactFlowProvider>
            <FlowCanvas />
          </ReactFlowProvider>
        </div>

        {/* RIGHT SIDEBAR: History & Properties */}
        <aside className="w-80 border-l bg-white shrink-0 z-40 relative shadow-inner overflow-hidden">
          <Sidebar />
        </aside>
      </main>
    </div>
  );
}
