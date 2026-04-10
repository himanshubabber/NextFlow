// src/components/nodes/TextInputNode.tsx
'use client';
import React from 'react';
import { Handle, Position } from 'reactflow';
import useFlowStore from '@/store/useFlowStore';

export default function TextInputNode({ id, data }: { id: string; data: any }) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  return (
    <div className="bg-white border-2 border-blue-400 rounded-xl p-4 shadow-xl w-64 ring-1 ring-black/5">
      <div className="flex items-center gap-2 mb-3">
        <div className="bg-blue-100 p-1.5 rounded-lg">
          <span className="text-blue-600">📝</span>
        </div>
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          Input Source
        </label>
      </div>

      <textarea
        className="nodrag w-full p-2 text-sm border-none bg-gray-50 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none resize-none font-medium text-gray-700"
        placeholder="Type your initial idea here..."
        rows={4}
        value={data.userMessage || ''}
        onChange={(e) => updateNodeData(id, { userMessage: e.target.value })}
      />

      {/* Only a Source handle because data only flows OUT of this node */}
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 bg-blue-500 border-2 border-white" 
      />
    </div>
  );
}
