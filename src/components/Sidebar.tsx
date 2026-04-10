'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import useFlowStore from '@/store/useFlowStore';

interface RunHistoryItem {
  id: string;
  status: string;
  startedAt: string;
}

export default function Sidebar() {
  const [history, setHistory] = useState<RunHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Destructure store actions to update the canvas when history is clicked
  const { nodes, setNodes, workflowId } = useFlowStore();

  // 1. Fetch History List
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      // Ensure folder is 'runs' (plural)
      const res = await fetch('/api/runs/history', {
        method: 'GET',
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("History fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Initial Mount
  useEffect(() => {
    setMounted(true);
    fetchHistory();
  }, [fetchHistory]);

  // 3. Handle Click - Restore past run data into the UI
  const handleHistoryClick = async (runId: string) => {
    const toastId = toast.loading("Restoring historical data...");
    try {
      // Calls the dynamic route: /api/runs/[runId]/route.ts
      const res = await fetch(`/api/runs/${runId}`);
      if (!res.ok) throw new Error();
      
      const runDetails = await res.json();

      // Find the LLM result within the historical run record
      const llmResult = runDetails.nodeRuns?.find(
        (nr: any) => nr.nodeType === 'llmNode'
      )?.outputs?.response;

      if (llmResult) {
        // Update the nodes in Zustand store to reflect the historical result
        const updatedNodes = nodes.map((node) => {
          if (node.type === 'llmNode') {
            return { 
              ...node, 
              data: { 
                ...node.data, 
                result: llmResult,
                // Ensure we don't lose the connection to current workflow
                workflowId: workflowId 
              } 
            };
          }
          return node;
        });
        
        setNodes(updatedNodes);
        toast.success("Result restored to Gemini node", { id: toastId });
      } else {
        toast.error("No result found in this run", { id: toastId });
      }
    } catch (error) {
      toast.error("Failed to load run details", { id: toastId });
    }
  };

  // Drag and drop logic for React Flow
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  // Hydration fix: Shell must be identical to server-side render
  if (!mounted) {
    return <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full relative z-50" />;
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full relative z-50 shadow-sm">
      {/* NODES SECTION */}
      <div className="p-4 border-b bg-slate-50/50">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
          Available Nodes
        </h3>
        <div className="space-y-2">
          <div 
            className="p-3 bg-white border border-slate-200 rounded-md cursor-grab hover:border-blue-400 transition-all text-sm font-medium flex items-center gap-2 group"
            onDragStart={(e) => onDragStart(e, 'textNode')}
            draggable
          >
            <span className="group-hover:scale-125 transition-transform">📝</span> Text Input
          </div>
          <div 
            className="p-3 bg-white border border-slate-200 rounded-md cursor-grab hover:border-purple-400 transition-all text-sm font-medium flex items-center gap-2 group"
            onDragStart={(e) => onDragStart(e, 'llmNode')}
            draggable
          >
            <span className="group-hover:scale-125 transition-transform">✨</span> Gemini 3 Flash
          </div>
        </div>
      </div>

      {/* HISTORY SECTION */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Execution History
          </h3>
          <button 
            type="button"
            onClick={(e) => { e.preventDefault(); fetchHistory(); }}
            disabled={loading}
            className="text-[10px] font-bold text-blue-600 px-2 py-1 rounded border border-blue-50 hover:bg-blue-100 cursor-pointer active:scale-90 transition-all"
          >
            {loading ? 'SYNCING...' : 'REFRESH'}
          </button>
        </div>

        <div className="space-y-2">
          {history.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-slate-50 rounded-xl bg-slate-50/20">
              <p className="text-[11px] text-slate-400 italic px-4">
                No recent runs found.
              </p>
            </div>
          ) : (
            history.map((run) => (
              <button
                key={run.id} 
                onClick={() => handleHistoryClick(run.id)}
                className="w-full text-left p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-300 hover:shadow-md transition-all border-l-4 border-l-blue-400 group active:scale-[0.98]"
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      run.status === 'SUCCESS' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="text-[10px] font-bold text-slate-700">
                      {run.status}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-medium">
                    {new Date(run.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-[9px] text-slate-500 font-mono truncate uppercase">
                  ID: {run.id.slice(-8)}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="p-3 bg-slate-50 border-t text-center">
        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
          Neon Live Sync Active
        </p>
      </div>
    </aside>
  );
}
