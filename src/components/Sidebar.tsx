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

  // Destructure everything needed from the store
  const { nodes, setNodes, workflowId, selectedNode, updateNodeData } = useFlowStore();

  // 1. Fetch History List from API
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/runs/history', {
        method: 'GET',
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('History fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Initial Mount logic
  useEffect(() => {
    setMounted(true);
    fetchHistory();
  }, [fetchHistory]);

  // 3. Handle History Click - Restore AI result to node
  const handleHistoryClick = async (runId: string) => {
    const toastId = toast.loading('Restoring historical data...');
    try {
      const res = await fetch(`/api/runs/${runId}`);
      if (!res.ok) throw new Error();

      const runDetails = await res.json();
      const llmResult = runDetails.nodeRuns?.find(
        (nr: any) => nr.nodeType === 'llmNode'
      )?.outputs?.response;

      if (llmResult) {
        const updatedNodes = nodes.map((node) => {
          if (node.type === 'llmNode') {
            return {
              ...node,
              data: { ...node.data, result: llmResult },
            };
          }
          return node;
        });

        setNodes(updatedNodes);
        toast.success('Result restored to Gemini node', { id: toastId });
      } else {
        toast.error('No result found in this run', { id: toastId });
      }
    } catch (error) {
      toast.error('Failed to load run details', { id: toastId });
    }
  };

  // Hydration fix
  if (!mounted) {
    return <aside className="bg-white border-l border-slate-200 flex flex-col h-full relative z-50" />;
  }

  return (
    <aside className="bg-white border-slate-200 flex flex-col h-full relative z-50 shadow-sm overflow-hidden">
      
      {/* SECTION 1: NODE PROPERTIES (Update node data on the fly) */}
      <div className="p-4 border-b bg-slate-50/50 min-h-[280px]">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
          Node Properties
        </h3>
        
        {selectedNode ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-1 duration-200">
            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase">Node Identity</label>
              <p className="text-[10px] font-mono text-slate-400 truncate bg-slate-100 p-1 rounded mt-1">
                {selectedNode.id}
              </p>
            </div>

            {selectedNode.type === 'textNode' && (
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-blue-500 uppercase">System Prompt / Input</label>
                <textarea
                  className="w-full p-3 text-xs border border-slate-200 rounded-xl h-32 outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all resize-none shadow-inner"
                  value={selectedNode.data.userMessage || ''}
                  onChange={(e) => updateNodeData(selectedNode.id, { userMessage: e.target.value })}
                  placeholder="Enter system instructions here..."
                />
              </div>
            )}

            {selectedNode.type === 'llmNode' && (
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-purple-500 uppercase">Gemini Output</label>
                <div className="p-3 bg-slate-900 text-white text-[11px] leading-relaxed rounded-xl min-h-[120px] shadow-lg font-medium border border-slate-800">
                  {selectedNode.data.result || "// Run the workflow to see AI response"}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-40 flex flex-col items-center justify-center text-center opacity-50">
            <span className="text-2xl mb-2">🖱️</span>
            <p className="text-[11px] text-slate-400 italic px-6">
              Select a node on the canvas to view or edit its properties.
            </p>
          </div>
        )}
      </div>

      {/* SECTION 2: EXECUTION HISTORY */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Run History
          </h3>
          <button
            type="button"
            onClick={fetchHistory}
            disabled={loading}
            className="text-[10px] font-bold text-blue-600 px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-all active:scale-90"
          >
            {loading ? 'SYNCING...' : 'REFRESH'}
          </button>
        </div>

        <div className="space-y-2">
          {history.length === 0 ? (
            <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-xl">
              <p className="text-[10px] text-slate-400 italic">No past runs found.</p>
            </div>
          ) : (
            history.map((run) => (
              <button
                key={run.id}
                onClick={() => handleHistoryClick(run.id)}
                className="w-full text-left p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-300 transition-all border-l-4 border-l-blue-400 group shadow-sm active:scale-[0.98]"
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${run.status === 'SUCCESS' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-[10px] font-bold text-slate-700 uppercase">{run.status}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-medium">
                    {new Date(run.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-[9px] text-slate-500 font-mono truncate">ID: {run.id.slice(-12)}</div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="p-3 bg-slate-50 border-t text-center">
        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
          Neon Cloud DB Connected
        </p>
      </div>
    </aside>
  );
}
