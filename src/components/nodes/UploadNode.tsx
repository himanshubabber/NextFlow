'use client';
import React, { useState, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import useFlowStore from '@/store/useFlowStore';
import { toast } from 'sonner';

export default function UploadNode({ id, data }: { id: string; data: any }) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const [preview, setPreview] = useState<string | null>(data.previewUrl || null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 🚩 Knight Tip: Video files can be huge. 
    // Limit to 10MB for Demo to prevent Base64 crashes.
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large! Keep it under 10MB for stable AI processing.");
      return;
    }

    const reader = new FileReader();
    reader.onloadstart = () => toast.loading("Processing media...", { id: 'upload' });
    
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPreview(base64String);
      
      updateNodeData(id, { 
        fileContent: base64String, 
        fileName: file.name,
        fileType: file.type,
        previewUrl: base64String,
        fileSize: file.size
      });
      toast.success("Media ready for Gemini", { id: 'upload' });
    };

    reader.onerror = () => toast.error("Upload failed", { id: 'upload' });
    reader.readAsDataURL(file);
  };

  const isVideo = data.type === 'video';

  return (
    <div className="bg-white border-2 border-emerald-400 rounded-2xl p-4 shadow-2xl w-64 ring-1 ring-black/5 transition-all hover:shadow-emerald-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-600 text-sm">
            {isVideo ? '🎥' : '🖼️'}
          </div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {isVideo ? 'Video Analyzer' : 'Image Analyzer'}
          </label>
        </div>
        {preview && (
           <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        )}
      </div>

      <div className="relative group">
        {preview ? (
          <div className="mb-3 rounded-lg overflow-hidden border border-emerald-100 bg-slate-900 aspect-video flex items-center justify-center relative shadow-inner">
            {isVideo ? (
              <video 
                ref={videoRef}
                src={preview} 
                className="w-full h-full object-contain" 
                controls // Video nodes need controls to verify content
                muted
              />
            ) : (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            )}
            
            {/* Remove Overlay */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setPreview(null);
                updateNodeData(id, { fileContent: null, fileName: null, previewUrl: null });
              }}
              className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600 text-white p-1.5 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-emerald-200 rounded-xl cursor-pointer hover:bg-emerald-50 hover:border-emerald-400 transition-all mb-3 group">
            <div className="text-emerald-400 text-2xl mb-1 group-hover:scale-125 transition-transform">
               {isVideo ? '🎞️' : '📁'}
            </div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">
               Click to Upload {data.type}
            </span>
            <input 
              type="file" 
              className="hidden" 
              accept={isVideo ? "video/mp4,video/x-m4v,video/*" : "image/*"} 
              onChange={handleFileChange} 
            />
          </label>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[9px] text-gray-400 font-mono truncate w-40 italic">
          {data.fileName || 'No asset selected'}
        </p>
        {data.fileSize && (
          <span className="text-[8px] font-bold text-slate-300">
            {(data.fileSize / 1024 / 1024).toFixed(1)} MB
          </span>
        )}
      </div>

      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 bg-emerald-500 border-2 border-white shadow-sm" 
      />
    </div>
  );
}
