'use client';
import React, { useState, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import useFlowStore from '@/store/useFlowStore';
import { toast } from 'sonner';

export default function VideoAssetNode({ id, data }: { id: string; data: any }) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const tempUrl = URL.createObjectURL(file);
    const toastId = toast.loading("Galaxy AI: Sampling Video...");
    
    try {
      const frameBase64 = await new Promise<string>((resolve, reject) => {
        const video = document.createElement('video');
        video.src = tempUrl;
        video.muted = true; video.playsInline = true; video.crossOrigin = "anonymous";
        
        video.onloadedmetadata = () => { video.currentTime = 0.5; };
        video.onseeked = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth * 0.5;
          canvas.height = video.videoHeight * 0.5;
          canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
          video.remove();
        };
        video.onerror = () => reject("Load Error");
        video.load();
      });

      updateNodeData(id, { 
        fileContent: frameBase64, 
        fileName: file.name,
        videoUrl: tempUrl,
        fileType: 'image/jpeg'
      });
      toast.success("Video Frame Ready", { id: toastId });
    } catch (err) {
      toast.error("Video processing failed", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    /* 🚀 FIX 1: Removed 'nodrag' and 'nopan' from the main wrapper.
       Ab aap isse header ya border se pakad kar move kar sakte hain.
    */
    <div className="bg-white border-2 border-emerald-500 rounded-2xl p-4 shadow-2xl w-64 relative group transition-all hover:shadow-emerald-100">
      
      <div className="flex items-center justify-between mb-3 pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-600 text-sm">🎥</div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Video Ingestor
          </label>
        </div>
      </div>

      <div className="relative">
        {/* 🚀 FIX 2: Added 'nodrag' ONLY to the clickable area */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          onPointerDown={(e) => e.stopPropagation()}
          className="nodrag relative w-full h-32 border-2 border-dashed border-emerald-200 rounded-xl cursor-pointer bg-slate-50 flex items-center justify-center transition-all hover:bg-emerald-50 overflow-hidden"
        >
          {loading ? (
            <span className="text-[8px] font-bold text-emerald-600 animate-pulse">SAMPLING...</span>
          ) : data.fileContent ? (
            <img src={data.fileContent} className="w-full h-full object-cover pointer-events-none" />
          ) : (
            <div className="text-center pointer-events-none">
              <span className="text-2xl mb-1">📁</span>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Upload Video</p>
            </div>
          )}

          <input 
            ref={fileInputRef}
            type="file" 
            accept="video/*" 
            onChange={onVideoUpload}
            className="hidden" 
          />
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between pointer-events-none">
        <p className="text-[9px] text-gray-400 font-mono truncate w-full italic text-center">
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
