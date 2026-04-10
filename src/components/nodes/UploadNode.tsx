'use client';
import React from 'react';
import { Handle, Position } from 'reactflow';

export default function UploadNode({ data }: { data: any }) {
  return (
    <div className="bg-white border-2 border-emerald-500 rounded-2xl p-4 shadow-xl w-64">
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-black text-emerald-600 uppercase italic">
            {data.type === 'video' ? 'Video Source' : 'Image Source'}
          </label>
          <span className="text-xs">{data.type === 'video' ? '🎥' : '🖼️'}</span>
        </div>
        
        <div className="bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:bg-emerald-100 transition-all">
          <span className="text-[10px] font-bold text-emerald-700">Upload via Transloadit</span>
          <span className="text-[8px] text-emerald-500 uppercase">JPG, PNG, MP4</span>
        </div>

        {data.url && (
           <div className="mt-2 rounded-lg overflow-hidden border">
              <img src={data.url} alt="preview" className="w-full h-24 object-cover" />
           </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-emerald-500 border-2 border-white" />
    </div>
  );
}
