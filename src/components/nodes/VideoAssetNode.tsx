'use client';
import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import useFlowStore from '@/store/useFlowStore';

export default function VideoAssetNode({ id, data }: { id: string; data: any }) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const [status, setStatus] = useState<'idle' | 'processing' | 'error'>('idle');

  const onVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Galaxy AI Check: Limit input size to 50MB for browser stability
    if (file.size > 50 * 1024 * 1024) {
      alert("File is too heavy for client-side processing. Please use a smaller clip.");
      return;
    }

    setStatus('processing');
    const tempUrl = URL.createObjectURL(file);
    
    try {
      const compressedFrame = await extractFrameWithTimeout(tempUrl);
      
      updateNodeData(id, { 
        fileContent: compressedFrame, 
        fileType: 'image/jpeg',
        fileName: file.name,
      });
      setStatus('idle');
    } catch (err) {
      console.error("Extraction failed:", err);
      setStatus('error');
      alert("Processing failed. Try a different video format (mp4 recommended).");
    } finally {
      URL.revokeObjectURL(tempUrl);
    }
  };

  // 🚀 ENGINEERING FIX: Added a timeout to prevent infinite loading
  const extractFrameWithTimeout = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = url;
      video.crossOrigin = "anonymous";
      video.muted = true;
      video.playsInline = true;

      const timeout = setTimeout(() => {
        video.remove();
        reject(new Error("Video processing timed out"));
      }, 10000); // 10 second timeout

      video.onloadedmetadata = () => {
        // Seek to 10% of video or 1s, whichever is better
        video.currentTime = Math.min(video.duration * 0.1, 1);
      };

      video.onseeked = () => {
        clearTimeout(timeout);
        const canvas = document.createElement('canvas');
        const scale = Math.min(800 / video.videoWidth, 1); // Max width 800px
        canvas.width = video.videoWidth * scale;
        canvas.height = video.videoHeight * scale;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        video.remove();
        resolve(dataUrl);
      };

      video.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("Video load error"));
      };

      video.load();
    });
  };

  return (
    <div className="bg-white border-2 border-emerald-500 rounded-2xl p-4 shadow-2xl w-72">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase">
          <span>🎥</span> AI Video Ingestor
        </div>
        {status === 'processing' && (
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping" />
        )}
      </div>

      <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
        status === 'error' ? 'border-red-300 bg-red-50' : 'border-emerald-100 hover:bg-emerald-50'
      }`}>
        <div className="text-center p-2">
          <p className="text-[10px] font-bold text-emerald-600">
            {status === 'processing' ? 'EXTRACTING AI FRAME...' : 'DROP VIDEO HERE'}
          </p>
          <p className="text-[8px] text-slate-400 mt-1">MP4, MOV up to 50MB</p>
        </div>
        <input type="file" className="hidden" accept="video/*" onChange={onVideoUpload} />
      </label>

      {data.fileName && status === 'idle' && (
        <div className="mt-3 p-2 bg-emerald-50 rounded-lg border border-emerald-100">
          <p className="text-[9px] text-emerald-700 font-bold truncate">✅ {data.fileName}</p>
          <p className="text-[8px] text-emerald-500">Frame extracted for Galaxy AI analysis</p>
        </div>
      )}

      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-emerald-500 border-white" />
    </div>
  );
}
