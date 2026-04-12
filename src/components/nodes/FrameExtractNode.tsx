'use client';
import React, { useState, useEffect } from 'react';
import { Handle, Position, useEdges, useNodes } from 'reactflow';
import useFlowStore from '@/store/useFlowStore';

// 🚀 Step 1: Define an Interface to tell TypeScript what "data" looks like
interface VideoNodeData {
  videoUrl?: string;
  fileContent?: string;
  label?: string;
}

export default function FrameExtractNode({ id, data }: { id: string; data: any }) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const nodes = useNodes();
  const edges = useEdges();
  
  const [timestamp, setTimestamp] = useState<number>(data.timestamp || 0.5);
  const [preview, setPreview] = useState<string | null>(data.fileContent || null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // 🚀 Step 2: Extract Video URL with proper Type Casting
  const edge = edges.find((e) => e.target === id);
  const sourceNode = edge ? nodes.find((n) => n.id === edge.source) : null;
  
  // Yahan hum (sourceNode?.data as VideoNodeData) use kar rahe hain
  const videoUrl = sourceNode?.type === 'videoNode' 
    ? (sourceNode.data as VideoNodeData)?.videoUrl 
    : null;

  const handleExtraction = async (url: string, time: number) => {
    if (!url) return;
    setIsProcessing(true);
    
    const video = document.createElement('video');
    video.src = url;
    video.crossOrigin = "anonymous";
    video.currentTime = time;
    video.muted = true;

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(video, 0, 0);
      }
      
      const base64 = canvas.toDataURL('image/jpeg', 0.8);
      setPreview(base64);
      updateNodeData(id, { 
        fileContent: base64, 
        timestamp: time,
        fileType: 'image/jpeg' 
      });
      setIsProcessing(false);
      video.remove();
    };

    video.onerror = () => {
      setIsProcessing(false);
      video.remove();
    };
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (videoUrl) {
        handleExtraction(videoUrl, timestamp);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [timestamp, videoUrl]);

  return (
    <div className="bg-white border-2 border-orange-500 rounded-2xl p-4 shadow-2xl w-64">
      <div className="flex items-center justify-between mb-3 text-orange-600 font-black text-[10px] uppercase tracking-widest">
        <span>✂️ Frame Extractor</span>
        <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-orange-500 animate-pulse' : 'bg-slate-200'}`} />
      </div>

      <div className="space-y-4">
        <div className="w-full h-32 bg-slate-50 rounded-xl overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center">
          {preview ? (
            <img src={preview} alt="Frame" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center p-4">
              <span className="text-[9px] text-slate-400 font-bold block leading-tight">
                {videoUrl ? "SYNCING SOURCE..." : "CONNECT VIDEO NODE"}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-bold text-slate-500">
            {/* <span>Time Position</span>
            <span className="text-orange-600 font-black">{timestamp.toFixed(1)}s</span> */}
          </div>
          <input 
            type="range" min="0" max="60" step="0.1"
            value={timestamp}
            onChange={(e) => setTimestamp(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>
      </div>

      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-orange-500 border-2 border-white" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-orange-500 border-2 border-white" />
    </div>
  );
}
