'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import ReactCrop, { type Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import useFlowStore from '@/store/useFlowStore';

export default function CropNode({ id, data }: { id: string; data: any }) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  
  // 1. Image Source Sync from Flow Data
  const [imgSrc, setImgSrc] = useState(data?.previewUrl || data?.url || '');
  const incoming = data?.previewUrl || data?.url || data?.fileContent || '';

  useEffect(() => {
    if (incoming && incoming !== imgSrc) {
      setImgSrc(incoming);
    }
  }, [incoming, imgSrc]);
  
  // 2. Initial State: Starting at 100% to show full image initially
  const [crop, setCrop] = useState<Crop>(data.crop || {
    unit: '%',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });

  const imgRef = useRef<HTMLImageElement>(null);

  // Essential for stopping React Flow from intercepting clicks/drags
  const stopPropagation = (e: React.KeyboardEvent | React.MouseEvent) => {
    e.stopPropagation();
    if (e.nativeEvent) e.nativeEvent.stopImmediatePropagation();
  };

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result?.toString() || '';
        setImgSrc(url);
        updateNodeData(id, { previewUrl: url });
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropComplete = (pixelCrop: PixelCrop) => {
    if (imgRef.current && pixelCrop.width && pixelCrop.height) {
      const canvas = document.createElement('canvas');
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
      
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(
          imgRef.current,
          pixelCrop.x * scaleX,
          pixelCrop.y * scaleY,
          pixelCrop.width * scaleX,
          pixelCrop.height * scaleY,
          0, 0, pixelCrop.width, pixelCrop.height
        );
        
        // Quality 0.3 to keep Base64 strings small for storage/API
        const base64 = canvas.toDataURL('image/jpeg', 0.3);
        updateNodeData(id, { 
          fileContent: base64, 
          fileType: 'image/jpeg',
          crop: crop 
        });
      }
    }
  };

  const handleManualInput = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const updatedCrop = { ...crop, [field]: numValue, unit: '%' as const };
    setCrop(updatedCrop);

    if (imgRef.current) {
      const pc: PixelCrop = {
        unit: 'px',
        x: (updatedCrop.x * imgRef.current.width) / 100,
        y: (updatedCrop.y * imgRef.current.height) / 100,
        width: (updatedCrop.width * imgRef.current.width) / 100,
        height: (updatedCrop.height * imgRef.current.height) / 100,
      };
      onCropComplete(pc);
    }
  };

  return (
    <div className="bg-white border-2 border-orange-400 rounded-2xl p-4 shadow-2xl w-80 relative">
      <Handle type="target" position={Position.Left} className="w-4 h-4 bg-orange-500 border-2 border-white -left-2" />

      <div className="flex items-center gap-2 mb-3 text-orange-600">
        <span className="bg-orange-100 p-1.5 rounded-lg font-bold">✂️</span>
        <label className="text-[10px] font-black uppercase tracking-widest">Precision Crop Node</label>
      </div>

      {!imgSrc ? (
        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-orange-100 rounded-lg cursor-pointer hover:bg-orange-50 transition-colors mb-2 text-orange-400">
          <span className="text-[10px] font-bold uppercase tracking-tight">Select Image</span>
          <input type="file" className="hidden" accept="image/*" onChange={onSelectFile} />
        </label>
      ) : (
        <div className="space-y-4">
          {/* 🚀 THE DYNAMIC SIZE FIX:
              - h-auto and max-h-96 keep the node height manageable.
              - inline-flex wraps the image perfectly for 100% mouse range.
              - overflow-hidden on the outer container keeps the node rounded and clean.
          */}
          <div 
            className="w-full h-auto min-h-[200px] max-h-96 rounded-lg border border-orange-100 nodrag nopan nowheel bg-slate-50 flex items-center justify-center p-1 overflow-hidden"
            onMouseDown={stopPropagation}
          >
            <div className="inline-flex relative items-center justify-center">
              <ReactCrop 
                crop={crop} 
                onChange={(c) => setCrop(c)} 
                onComplete={onCropComplete}
                minWidth={10}
                minHeight={10}
              >
                <img 
                  key={imgSrc}
                  ref={imgRef} 
                  src={imgSrc} 
                  alt="Crop" 
                  draggable={false}
                  className="block w-full h-auto max-h-[380px] object-contain shadow-sm rounded-sm" 
                  style={{ pointerEvents: 'none' }} 
                />
              </ReactCrop>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
            {['x', 'y', 'width', 'height'].map((field) => {
              const val = crop[field as keyof Crop];
              return (
                <div key={field} className="flex flex-col gap-1">
                  <label className="text-[8px] font-bold text-slate-400 uppercase text-center">{field}</label>
                  <input 
                    type="number"
                    value={typeof val === 'number' ? Math.round(val) : 0}
                    className="nodrag nopan nowheel w-full text-[10px] font-bold text-orange-600 bg-white border border-slate-200 rounded p-1 text-center outline-none focus:ring-2 focus:ring-orange-400 pointer-events-auto"
                    onKeyDown={stopPropagation}
                    onMouseDown={stopPropagation}
                    onPointerDown={stopPropagation}
                    onChange={(e) => handleManualInput(field, e.target.value)}
                    style={{ cursor: 'text' }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Right} className="w-4 h-4 bg-orange-500 border-2 border-white -right-2" />
    </div>
  );
}
