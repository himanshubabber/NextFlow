'use client';
import React, { useState, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import useFlowStore from '@/store/useFlowStore';

export default function FrameExtractNode({ id, data }: { id: string; data: any }) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const [videoSrc, setVideoSrc] = useState(data.previewUrl || '');
  const [framePreview, setFramePreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
    }
  };

  const captureFrame = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const frameBase64 = canvas.toDataURL('image/jpeg');
        setFramePreview(frameBase64);
        
        // Gemini ko ye frame bhejne ke liye data update karo
        updateNodeData(id, { 
          fileContent: frameBase64, 
          fileType: 'image/jpeg',
          isFrame: true 
        });
      }
    }
  };

  return (
    <div className="bg-white border-2 border-blue-400 rounded-2xl p-4 shadow-2xl w-72">
      <div className="flex items-center gap-2 mb-3">
        <span className="bg-blue-100 p-1.5 rounded-lg text-blue-600">📸</span>
        <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Frame Extractor</label>
      </div>

      {!videoSrc ? (
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-blue-100 rounded-lg cursor-pointer hover:bg-blue-50">
          <span className="text-[10px] font-bold text-blue-600 uppercase text-center px-2">Upload Video to Extract Frame</span>
          <input type="file" className="hidden" accept="video/*" onChange={handleVideoUpload} />
        </label>
      ) : (
        <div className="space-y-3">
          <video ref={videoRef} src={videoSrc} className="w-full rounded-lg border border-slate-200" controls />
          <button 
            onClick={captureFrame}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-xs font-bold transition-all"
          >
            Capture Current Frame
          </button>
        </div>
      )}

      {framePreview && (
        <div className="mt-3 p-2 border-2 border-emerald-400 rounded-lg bg-emerald-50">
          <p className="text-[8px] font-bold text-emerald-600 mb-1 uppercase text-center">Captured Frame Preview</p>
          <img src={framePreview} className="w-full rounded shadow-sm" alt="Extracted" />
        </div>
      )}

      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500 border-2 border-white" />
    </div>
  );
}
