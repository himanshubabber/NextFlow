'use client';
import React from 'react';
import { Handle, Position } from 'reactflow';

export default function ProcessNode({ id, data }: { id: string; data: any }) {
 
  
  return (
    <div className="bg-white border-2 border-blue-500 rounded-2xl p-4 shadow-xl w-56 relative transition-all hover:shadow-blue-100">
      {/* Target Handle: Incoming from Assets */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 bg-blue-500 border-2 border-white z-10" 
      />
      
      <div className="flex flex-col gap-2 pointer-events-none">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
            FFmpeg Processor
          </label>
          <span className="text-[10px]">⚙️</span>
        </div>
        
        <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
          <span className="text-[11px] font-bold text-blue-700">{data.label || 'Crop Processor'}</span>
          <p className="text-[9px] text-blue-500 leading-tight mt-1">
            {data.description || 'Configures spatial parameters for extraction.'}
          </p>
        </div>

        {/* Param Inputs: Using 'nodrag' so interacting with inputs doesn't move the node */}
        <div className="grid grid-cols-2 gap-2 mt-1 nodrag pointer-events-auto">
          <div className="bg-slate-50 p-1.5 rounded border text-[8px] text-slate-500 font-mono flex flex-col">
            <span className="text-[7px] text-blue-400 font-bold">X-COORD</span>
            {data.x || '0%'}
          </div>
          <div className="bg-slate-50 p-1.5 rounded border text-[8px] text-slate-500 font-mono flex flex-col">
            <span className="text-[7px] text-blue-400 font-bold">Y-COORD</span>
            {data.y || '0%'}
          </div>
        </div>
      </div>

      {/* Source Handle: Outgoing to LLM */}
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 bg-blue-500 border-2 border-white z-10" 
      />
    </div>
  );
}
