'use client';
import React, { memo, useRef } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import useFlowStore from '@/store/useFlowStore';
import { toast } from 'sonner';

const ImageNode = ({ id, data }: NodeProps) => {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🚀 Manual Trigger to bypass ReactFlow event hijacking
  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Safety check for size
    if (file.size > 10 * 1024 * 1024) {
      return toast.error("Image too large (Max 10MB)");
    }

    const reader = new FileReader();
    reader.onloadstart = () => toast.loading("Processing image...", { id: 'img-up' });
    
    reader.onloadend = () => {
      const base64 = reader.result as string;
      updateNodeData(id, { 
        fileContent: base64, 
        fileName: file.name,
        fileType: file.type,
        previewUrl: base64 
      });
      toast.success("Image updated", { id: 'img-up' });
    };
    reader.readAsDataURL(file);
  };

  return (
    // 🚩 'nodrag' wrapper hatana mat, lekin internal input trigger manually handle karna
    <div className={`p-4 border-2 border-blue-400 rounded-2xl bg-white shadow-2xl min-w-[200px] transition-all ${data.isRunning ? 'ring-4 ring-blue-500 animate-pulse' : ''}`}>
      <div className="flex flex-col gap-2 pointer-events-none">
        <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">🖼️ Image Asset</label>
        
        {/* Clickable Area */}
        <div 
          onClick={handleContainerClick}
          onPointerDown={(e) => e.stopPropagation()}
          className={`flex items-center justify-center h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors pointer-events-auto overflow-hidden ${
            data.fileContent ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-slate-50'
          }`}
        >
          {data.fileContent ? (
            <img src={data.fileContent} className="w-full h-full object-cover" alt="Preview" />
          ) : (
            <div className="text-center">
              <span className="text-xl mb-1">📂</span>
              <p className="text-[9px] font-bold text-gray-400 uppercase">Click to upload</p>
            </div>
          )}

          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileChange}
          />
        </div>

        <p className="text-[8px] text-gray-400 font-mono truncate italic">
          {data.fileName || 'No image selected'}
        </p>
      </div>

      <Handle type="source" position={Position.Right} id="output" className="w-3 h-3 bg-blue-500 border-white shadow-sm" />
    </div>
  );
};

export default memo(ImageNode);
