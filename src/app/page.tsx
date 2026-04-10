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

const nodeTypes = {
  textNode: TextInputNode,
  llmNode: LlmNode,
  uploadNode: UploadNode,
  processNode: ProcessNode,
};

// --- Canvas Component (Handles Drop & Drag Logic) ---
const FlowCanvas = () => {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setNodes } = useFlowStore();
  const { screenToFlowPosition } = useReactFlow();

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    const label = event.dataTransfer.getData('nodeLabel');
    const specificType = event.dataTransfer.getData('specificType');

    if (!type) return;

    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    
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
  }, [screenToFlowPosition, setNodes]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      onDrop={onDrop}
      onDragOver={onDragOver}
      fitView
      snapToGrid
      snapGrid={[15, 15]}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />
      <Controls className="bg-white border shadow-sm rounded-lg" />
      <MiniMap className="rounded-lg border shadow-sm" />
    </ReactFlow>
  );
};

// --- Main Workflow Page ---
export default function WorkflowPage() {
  const [mounted, setMounted] = useState(false);
  const { isSignedIn, isLoaded } = useUser();
  
  // Directly destructuring from useFlowStore
  const { 
    nodes, 
    edges, 
    setNodes, 
    setEdges, 
    workflowId, 
    setWorkflowId, 
    updateNodeData 
  } = useFlowStore();

  useEffect(() => { 
    setMounted(true); 
  }, []);

  const onDragStart = (event: React.DragEvent, nodeType: string, label: string, specificType?: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('nodeLabel', label);
    if (specificType) event.dataTransfer.setData('specificType', specificType);
    event.dataTransfer.effectAllowed = 'move';
  };

  // PERSISTENCE: Save workflow state to Neon
  const saveWorkflow = async () => {
    const toastId = toast.loading("Saving to Galaxy Cloud...");
    try {
      const response = await fetch("/api/workflows/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges, workflowId }),
      });
      const data = await response.json();
      setWorkflowId(data.id);
      toast.success("State Synced", { id: toastId });
    } catch (e) { 
      toast.error("Database Error", { id: toastId }); 
    }
  };

  // EXECUTION: Run Gemini 3 Pipeline
  const runWorkflow = async () => {
    const toastId = toast.loading("Galaxy AI: Triggering Pipeline...");
    
    // UI FEEDBACK: Start glow on all LLM nodes
    const llmNodes = nodes.filter(n => n.type === 'llmNode');
    llmNodes.forEach(node => updateNodeData(node.id, { isRunning: true }));

    try {
      const response = await fetch('/api/run', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges, workflowId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Execution timeout.");
      }

      if (data.text && data.nodeId) {
        // Stop glow and display final result
        updateNodeData(data.nodeId, { 
          result: data.text, 
          isRunning: false 
        });
        toast.success("Galaxy AI: Success!", { id: toastId });
      }
    } catch (e: any) {
      console.error("Workflow Runtime Error:", e);
      toast.error(e.message, { id: toastId });
      
      // Cleanup: Reset isRunning on all nodes if failure occurs
      setNodes((nds: any) => nds.map((n: any) => ({
        ...n,
        data: { ...n.data, isRunning: false }
      })));
    }
  };

  if (!mounted) return <div className="h-screen w-full bg-white" />;

  return (
    <div className="flex flex-col h-screen w-full bg-[#fcfcfd] overflow-hidden font-sans">
      {/* HEADER */}
      <header className="h-14 border-b bg-white flex items-center justify-between px-6 z-50 flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-purple-600 p-1.5 rounded-lg text-white shadow-lg">✨</div>
          <span className="font-bold text-lg tracking-tight">NextFlow</span>
          <span className="ml-2 text-[9px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-bold border border-purple-100 uppercase tracking-widest">Galaxy AI</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={saveWorkflow} className="text-xs font-semibold px-4 py-2 border rounded-lg hover:bg-slate-50 transition-all active:scale-95">Save State</button>
          <button onClick={runWorkflow} className="text-xs font-semibold px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-md transition-all active:scale-95">Run Workflow</button>
          <div className="ml-2 border-l pl-4">{isLoaded && (isSignedIn ? <UserButton /> : <SignInButton />)}</div>
        </div>
      </header>

      {/* THREE-COLUMN LAYOUT */}
      <main className="flex flex-1 overflow-hidden relative">
        {/* LEFT: Complete Node Library */}
        <aside className="w-64 flex-shrink-0 border-r bg-white flex flex-col z-40 shadow-sm overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* INPUTS */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inputs</h3>
              <div onDragStart={(e) => onDragStart(e, 'textNode', 'Text Input')} draggable className="p-3 border rounded-xl text-xs font-medium cursor-grab hover:bg-slate-50 transition-all flex items-center gap-2 group">
                <span className="bg-slate-100 p-1 rounded group-hover:bg-purple-100 transition-colors">📝</span> Text Input
              </div>
              <div onDragStart={(e) => onDragStart(e, 'uploadNode', 'Image Upload', 'image')} draggable className="p-3 border rounded-xl text-xs font-medium cursor-grab hover:bg-emerald-50 transition-all flex items-center gap-2 group border-emerald-50">
                <span className="bg-emerald-50 p-1 rounded group-hover:bg-emerald-100 transition-colors">🖼️</span> Image Upload
              </div>
              <div onDragStart={(e) => onDragStart(e, 'uploadNode', 'Video Upload', 'video')} draggable className="p-3 border rounded-xl text-xs font-medium cursor-grab hover:bg-emerald-50 transition-all flex items-center gap-2 group border-emerald-50">
                <span className="bg-emerald-50 p-1 rounded group-hover:bg-emerald-100 transition-colors">🎥</span> Video Upload
              </div>
            </div>

            {/* TRANSFORMERS & AI */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transformers</h3>
              <div onDragStart={(e) => onDragStart(e, 'llmNode', 'Gemini 3 AI')} draggable className="p-3 border-2 border-purple-200 bg-purple-50 text-purple-700 rounded-xl text-xs font-bold cursor-grab hover:bg-purple-100 transition-all flex items-center gap-2 shadow-sm">
                <span className="bg-purple-200 p-1 rounded">✨</span> Gemini 3 Flash
              </div>
              <div onDragStart={(e) => onDragStart(e, 'processNode', 'Crop Image', 'crop')} draggable className="p-3 border rounded-xl text-xs font-medium cursor-grab hover:bg-blue-50 transition-all flex items-center gap-2 group border-blue-50">
                <span className="bg-blue-50 p-1 rounded group-hover:bg-blue-100 transition-colors">✂️</span> Crop Image
              </div>
              <div onDragStart={(e) => onDragStart(e, 'processNode', 'Extract Frame', 'extract')} draggable className="p-3 border rounded-xl text-xs font-medium cursor-grab hover:bg-blue-50 transition-all flex items-center gap-2 group border-blue-50">
                <span className="bg-blue-50 p-1 rounded group-hover:bg-blue-100 transition-colors">🎞️</span> Extract Frame
              </div>
            </div>
          </div>
        </aside>

        {/* CENTER: Canvas */}
        <div className="flex-grow bg-[#f8fafc] relative">
          <ReactFlowProvider>
            <FlowCanvas />
          </ReactFlowProvider>
        </div>

        {/* RIGHT: History/Run Sidebar */}
        <aside className="w-80 flex-shrink-0 border-l bg-white flex flex-col z-40">
          <Sidebar />
        </aside>
      </main>
    </div>
  );
}
