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

import { 
  Type, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Scissors, 
  Crop, 
  Sparkles,
  Save,
  Play,
  Layers,
  Upload,    // 🚀 Added for Import
  Download   // 🚀 Added for Export
} from 'lucide-react';

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
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        panOnDrag={true} 
        className="bg-white"
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={28} 
          size={2} 
          color="#333333" 
          style={{ opacity: 0.25 }} 
        />
        
        {/* Controls remain at Bottom Left */}
        <Controls className="z-50 bg-white border-slate-200 fill-slate-600 rounded-md shadow-sm" />
        
        {/* 🚀 Custom Attribution Label - Positioned at BOTTOM RIGHT */}
        <div className="absolute bottom-5 right-5 z-50 pointer-events-none">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">
            React Flow
          </span>
        </div>

        <MiniMap 
          className="bg-white border-slate-200 rounded-xl shadow-lg" 
          maskColor="rgba(241, 245, 249, 0.6)" 
        />
      </ReactFlow>
    </div>
  );
};

export default function WorkflowPage() {
  const [mounted, setMounted] = useState(false);
  const { isLoaded, isSignedIn } = useUser();
  const { nodes, edges, setNodes, setEdges, workflowId, setWorkflowId, updateNodeData } = useFlowStore();

  useEffect(() => { setMounted(true); }, []);

  // 🚀 Added Export Logic
  const exportWorkflow = () => {
    const data = { nodes, edges };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `workflow-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Workflow exported as JSON");
  };

  // 🚀 Added Import Logic
  const importWorkflow = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (f) => {
      try {
        const json = JSON.parse(f.target?.result as string);
        if (json.nodes && json.edges) {
          setNodes(json.nodes);
          setEdges(json.edges);
          toast.success("Workflow imported successfully");
        }
      } catch (err) {
        toast.error("Invalid workflow file");
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // Reset input
  };

  const onDragStart = (e: React.DragEvent, type: string, label: string, specific?: string) => {
    e.dataTransfer.setData('application/reactflow', type);
    e.dataTransfer.setData('nodeLabel', label);
    if (specific) e.dataTransfer.setData('specificType', specific);
    e.dataTransfer.effectAllowed = 'move';
  };

  const saveWorkflow = async () => {
    const toastId = toast.loading("Syncing to Neon Cloud...");
    try {
      const sanitizedNodes = nodes.map(node => {
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
    
    // 🚀 Start Glow: isRunning = true
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
        // 🚀 Stop Glow: isRunning = false
        updateNodeData(data.nodeId, { result: data.text, isRunning: false });
        toast.success("Execution Success", { id: toastId });
      } else {
        throw new Error(data.error || "Empty response");
      }
    } catch (e: any) {
      toast.error(e.message || "Execution Failed", { id: toastId });
      // Stop Glow on Error
      llmNodes.forEach(n => updateNodeData(n.id, { isRunning: false }));
    }
  };

  if (!mounted || !isLoaded) return <div className="h-screen w-full bg-[#050505]" />;

  return (
    <div className="flex flex-col h-screen w-full bg-[#050505] overflow-hidden text-white font-sans">
      <header className="h-14 border-b border-white/5 bg-[#0A0A0A] flex items-center justify-between px-6 z-[60] shrink-0 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="bg-white p-1.5 rounded-lg text-black shadow-lg flex items-center justify-center w-8 h-8">
             <Layers size={18} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-lg tracking-tight text-white text-glow-white">NextFlow</span>
        </div>
        <div className="flex items-center gap-3">
          {/* 🚀 New Import Button */}
          <label className="flex items-center gap-2 text-[10px] font-bold px-3 py-2 border border-white/10 rounded-xl hover:bg-white/5 cursor-pointer uppercase transition-all active:scale-95">
            <Upload size={14} /> IMPORT
            <input type="file" accept=".json" className="hidden" onChange={importWorkflow} />
          </label>
          
          {/* 🚀 New Export Button */}
          <button onClick={exportWorkflow} className="flex items-center gap-2 text-[10px] font-bold px-3 py-2 border border-white/10 rounded-xl hover:bg-white/5 uppercase transition-all active:scale-95">
            <Download size={14} /> EXPORT
          </button>

          <button onClick={saveWorkflow} className="flex items-center gap-2 text-[10px] font-bold px-4 py-2 border border-white/10 rounded-xl hover:bg-white/5 uppercase transition-all active:scale-95">
            <Save size={14} /> SAVE
          </button>
          <button onClick={runWorkflow} className="flex items-center gap-2 text-[10px] font-bold px-6 py-2 bg-blue-600 text-white rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:bg-blue-700 uppercase ml-1 transition-all active:scale-95">
            <Play size={14} fill="currentColor" /> RUN
          </button>
          <div className="ml-2 border-l border-white/10 pl-4 shrink-0 flex items-center h-full">
  {isSignedIn ? (
    <UserButton 
      /* 🚀 Removed afterSignOutUrl to fix TS error */
      appearance={{
        elements: {
          userButtonAvatarBox: "w-8 h-8 border border-white/20"
        }
      }}
    />
  ) : (
    <div className="text-[10px] font-black uppercase tracking-widest text-white hover:text-purple-400 transition-colors cursor-pointer px-2">
      <SignInButton mode="modal">
        <span>SIGN IN</span>
      </SignInButton>
    </div>
  )}
</div>
</div>

      </header>

      <main className="flex flex-1 overflow-hidden relative">
        <aside className="w-64 border-r border-white/5 bg-[#0A0A0A] p-5 space-y-8 z-40 flex-shrink-0 overflow-y-auto scrollbar-hide">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] pl-1">Input Components</h3>
            <div 
              onDragStart={(e) => onDragStart(e, 'textNode', 'Text Input')} 
              draggable 
              className="p-3 bg-[#141414] border border-white/5 rounded-xl text-xs font-semibold cursor-grab hover:border-white/20 hover:bg-[#1A1A1A] transition-all flex items-center gap-3 active:bg-blue-600 active:text-white group"
            >
               <Type size={16} className="text-blue-400 group-active:text-white" /> Text Input
            </div>
            <div 
              onDragStart={(e) => onDragStart(e, 'uploadNode', 'Image Asset', 'image')} 
              draggable 
              className="p-3 bg-[#141414] border border-white/5 rounded-xl text-xs font-semibold cursor-grab hover:border-white/20 transition-all flex items-center gap-3 active:bg-emerald-600 active:text-white group"
            >
              <ImageIcon size={16} className="text-emerald-400 group-active:text-white" /> Image Asset
            </div>
            <div 
              onDragStart={(e) => onDragStart(e, 'videoNode', 'Video Asset', 'video')} 
              draggable 
              className="p-3 bg-[#141414] border border-white/5 rounded-xl text-xs font-semibold cursor-grab hover:border-white/20 transition-all flex items-center gap-3 active:bg-emerald-600 active:text-white group"
            >
              <VideoIcon size={16} className="text-emerald-400 group-active:text-white" /> Video Asset
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] pl-1">Processors</h3>
            <div 
              onDragStart={(e) => onDragStart(e, 'frameExtractNode', 'Frame Extractor')} 
              draggable 
              className="p-3 bg-[#141414] border border-white/5 rounded-xl text-xs font-semibold cursor-grab hover:border-white/20 transition-all flex items-center gap-3 active:bg-orange-600 active:text-white group"
            >
              <Scissors size={16} className="text-orange-400 group-active:text-white" /> Frame Extractor
            </div>
            <div 
              onDragStart={(e) => onDragStart(e, 'processNode', 'Image Crop', 'crop')} 
              draggable 
              className="p-3 bg-[#141414] border border-white/5 rounded-xl text-xs font-semibold cursor-grab hover:border-white/20 transition-all flex items-center gap-3 active:bg-blue-600 active:text-white group"
            >
              <Crop size={16} className="text-blue-400 group-active:text-white" /> Image Crop
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] pl-1">Intelligence</h3>
            <div 
              onDragStart={(e) => onDragStart(e, 'llmNode', 'Gemini 3 Flash')} 
              draggable 
              className="p-3 bg-[#141414] border border-purple-500/30 text-purple-400 rounded-xl text-xs font-bold cursor-grab shadow-[0_0_15px_rgba(168,85,247,0.1)] hover:bg-purple-900/20 transition-all flex items-center gap-3 active:bg-purple-600 active:text-white group"
            >
              <Sparkles size={16} className="text-purple-400 group-active:text-white" /> Gemini 3 Flash
            </div>
          </div>
        </aside>

        <div className="flex-grow relative bg-[#050505] z-0 pointer-events-auto">
          <ReactFlowProvider><FlowCanvas /></ReactFlowProvider>
        </div>
       
        <aside className="w-80 border-l border-white/5 bg-[#0A0A0A] shrink-0 z-40 relative shadow-2xl overflow-hidden">
          <Sidebar />
        </aside>
      </main>
    </div>
  );
}
