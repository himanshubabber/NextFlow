'use client';
import React from 'react';
import { Handle, Position } from 'reactflow';
import useFlowStore from '@/store/useFlowStore';

export default function LlmNode({ id, data }: { id: string; data: any }) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  // Requirement: Pulse animation when running
  const isRunning = data.isRunning;

  // Logic for Exporting the AI response
  const downloadResult = () => {
    if (!data.result) return;
    const element = document.createElement("a");
    const file = new Blob([data.result], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `galaxy-ai-result-${id.substring(0, 5)}.txt`;
    document.body.appendChild(element);
    element.click();
  };

  return (
    /* Reverted to White Background with Dynamic Thinking Glow */
    <div className={`bg-white border-2 rounded-2xl p-5 shadow-2xl w-80 transition-all duration-500 relative ${
      isRunning ? 'node-running-glow scale-[1.03]' : 'border-slate-200'
    }`}>
      
      {/* Target Handles (Left Side - Inputs) */}
      <div className="flex flex-col gap-6 absolute -left-3 top-1/2 -translate-y-1/2">
        <div className="relative group">
          <Handle type="target" position={Position.Left} id="system" className="w-4 h-4 bg-blue-500 border-2 border-white shadow-sm" />
          <span className="absolute left-6 -top-1 text-[8px] font-bold text-blue-500 opacity-0 group-hover:opacity-100 uppercase bg-white px-1">System</span>
        </div>
        <div className="relative group">
          <Handle type="target" position={Position.Left} id="user" className="w-4 h-4 bg-purple-500 border-2 border-white shadow-sm" />
          <span className="absolute left-6 -top-1 text-[8px] font-bold text-purple-500 opacity-0 group-hover:opacity-100 uppercase bg-white px-1">User</span>
        </div>
        <div className="relative group">
          <Handle type="target" position={Position.Left} id="image" className="w-4 h-4 bg-emerald-500 border-2 border-white shadow-sm" />
          <span className="absolute left-6 -top-1 text-[8px] font-bold text-emerald-500 opacity-0 group-hover:opacity-100 uppercase bg-white px-1">Image</span>
        </div>
        <div className="relative group">
          <Handle type="target" position={Position.Left} id="video" className="w-4 h-4 bg-emerald-600 border-2 border-white shadow-sm" />
          <span className="absolute left-6 -top-1 text-[8px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 uppercase bg-white px-1">Video</span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">✨</span>
            <label className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Gemini 3 Flash</label>
          </div>
          {isRunning && (
             <div className="flex gap-1">
               <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
               <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
               <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"></span>
             </div>
          )}
        </div>

        {/* Input Field */}
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Input Prompt</label>
            <span className="text-[9px] font-medium text-purple-400">Contextual</span>
          </div>
          <textarea
            className="nodrag w-full p-3 text-sm border border-slate-100 rounded-xl bg-slate-50/50 focus:ring-2 focus:ring-purple-400 focus:bg-white outline-none transition-all resize-none"
            rows={3}
            placeholder="Type instructions or link a Text Node..."
            value={data.userMessage || ''}
            onChange={(e) => updateNodeData(id, { userMessage: e.target.value })}
          />
        </div>

        {/* AI Result Section */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Generated Output</label>
          <div className={`p-4 rounded-xl text-[12px] leading-relaxed font-medium min-h-[80px] transition-all duration-300 shadow-inner ${
            isRunning ? 'bg-purple-50 text-purple-700 italic' : 'bg-slate-900 text-slate-100'
          }`}>
            {isRunning ? (
              "AI is thinking..."
            ) : (
              data.result || "// Run workflow to see output"
            )}
          </div>
        </div>

        {data.result && !isRunning && (
          <button 
            onClick={downloadResult}
            className="mt-1 w-full py-2 bg-slate-100 hover:bg-purple-600 hover:text-white text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 border border-slate-200"
          >
             Export Analysis
          </button>
        )}
      </div>

      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-5 h-5 bg-purple-600 border-4 border-white shadow-lg -mr-2" 
      />
    </div>
  );
}
