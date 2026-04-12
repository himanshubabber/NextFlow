import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import useFlowStore from '@/store/useFlowStore';

const TextNode = ({ id, data }: NodeProps) => {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  return (
    <div className="p-4 border border-purple-300 rounded-xl bg-white shadow-sm min-w-[250px]">
      <Handle type="target" position={Position.Left} id="input" className="w-3 h-3 bg-purple-500" />
      
      <div className="flex flex-col gap-2">
        <label className="font-semibold text-sm text-gray-700">Text Input</label>
        <textarea
          value={data.text || ''}
          onChange={(e) => updateNodeData(id, { text: e.target.value })}
          className="p-2 text-sm border border-gray-200 rounded-lg h-24 w-full resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Enter prompt..."
        />
      </div>

      <Handle type="source" position={Position.Right} id="output" className="w-3 h-3 bg-purple-500" />
    </div>
  );
};

export default memo(TextNode);
