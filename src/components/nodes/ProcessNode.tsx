'use client';
import React from 'react';
import { Handle, Position } from 'reactflow';

export default function ProcessNode({ data }: { data: any }) {
  return (
    <div className="bg-white border-2 border-blue-500 rounded-2xl p-4 shadow-xl w-56">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-500" />
      
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-black text-blue-600 uppercase">FFmpeg Processor</label>
          <span className="text-[10px]">⚙️</span>
        </div>
        
        <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
          <span className="text-[11px] font-bold text-blue-700">{data.label}</span>
          <p className="text-[9px] text-blue-500 leading-tight mt-1">{data.description}</p>
        </div>

        {/* Param Input for Step 3.5 (x%, y%, width%, height%) */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="bg-slate-50 p-1 rounded border text-[8px] text-slate-400 font-mono">X: 0%</div>
          <div className="bg-slate-50 p-1 rounded border text-[8px] text-slate-400 font-mono">Y: 0%</div>
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500 border-2 border-white" />
    </div>
  );
}
