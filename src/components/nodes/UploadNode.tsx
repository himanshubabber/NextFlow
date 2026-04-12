'use client';
import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import useFlowStore from '@/store/useFlowStore';
import { toast } from 'sonner';

export default function UploadNode({ id, data }: { id: string; data: any }) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const [preview, setPreview] = useState<string | null>(data.previewUrl || null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error("File too heavy! Max 20MB allowed.");
      return;
    }

    const reader = new FileReader();
    const toastId = toast.loading("Galaxy AI: Buffering Asset...");
    
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPreview(base64String);
      
      updateNodeData(id, { 
        fileContent: base64String, 
        fileName: file.name,
        fileType: file.type,
        previewUrl: base64String,
      });
      toast.success("Asset Ready", { id: toastId });
    };

    reader.onerror = () => toast.error("Upload failed", { id: toastId });
    reader.readAsDataURL(file);
  };

  const isVideo = data.type === 'video';

  return (
    /* 🚀 FIX 1: Removed 'nodrag' and 'nopan' from the main wrapper.
       This allows you to grab the node from its edges/header to move it.
    */
    <div className="bg-white border-2 border-emerald-400 rounded-2xl p-4 shadow-2xl w-64 relative group transition-all hover:shadow-emerald-100">
      
      <div className="flex items-center justify-between mb-3 pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-600 text-sm">
            {isVideo ? '🎥' : '🖼️'}
          </div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {isVideo ? 'Video Analyzer' : 'Image Analyzer'}
          </label>
        </div>
      </div>

      <div className="relative">
        {preview ? (
          /* 🚀 FIX 2: Added 'nodrag' ONLY to interactive areas like preview and buttons */
          <div className="nodrag mb-3 rounded-lg overflow-hidden border border-emerald-100 bg-slate-900 aspect-video flex items-center justify-center relative shadow-inner">
            {isVideo ? (
              <video src={preview} className="w-full h-full object-contain" controls muted />
            ) : (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            )}
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setPreview(null);
                updateNodeData(id, { fileContent: null, fileName: null, previewUrl: null });
              }}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full z-20 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        ) : (
          /* 🚀 FIX 3: Added 'nodrag' to the label so clicking doesn't start a drag */
          <label 
            className="nodrag flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-emerald-200 rounded-xl cursor-pointer hover:bg-emerald-50 transition-all mb-3 relative"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="text-emerald-400 text-2xl mb-1">📁</div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase">
               Click to Upload
            </span>
            <input 
              type="file" 
              className="hidden" 
              accept={isVideo ? "video/*" : "image/*"} 
              onChange={handleFileChange} 
            />
          </label>
        )}
      </div>

      <div className="flex items-center justify-between pointer-events-none">
        <p className="text-[9px] text-gray-400 font-mono truncate w-full italic">
          {data.fileName || 'Wait for asset...'}
        </p>
      </div>

      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 bg-emerald-500 border-2 border-white" 
      />
    </div>
  );
}
