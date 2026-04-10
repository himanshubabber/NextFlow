// src/components/nodes/ImageNode.tsx
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

const ImageNode = ({ id, data }: NodeProps) => {
  return (
    <div className={`p-4 border border-blue-300 rounded-xl bg-white shadow-sm min-w-[250px] ${data.isRunning ? 'ring-4 ring-blue-500 animate-pulse' : ''}`}>
      <div className="flex flex-col gap-2">
        <label className="font-semibold text-sm text-gray-700">Upload Image</label>
        {/* We will add the actual Transloadit uploader here later */}
        <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-xs text-gray-400">
          Click to upload via Transloadit
        </div>
      </div>
      <Handle type="source" position={Position.Right} id="output" className="w-3 h-3 bg-blue-500" />
    </div>
  );
};

export default memo(ImageNode);
