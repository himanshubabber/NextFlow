'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import useFlowStore from '@/store/useFlowStore';


import { Settings2, History, Database, RefreshCw } from 'lucide-react';

interface RunHistoryItem {
  id: string;
  status: string;
  startedAt: string;
}

export default function Sidebar() {
  const [history, setHistory] = useState<RunHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { nodes, setNodes, workflowId, selectedNode, updateNodeData } = useFlowStore();

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

  useEffect(() => {
    setMounted(true);
    fetchHistory();
  }, [fetchHistory]);

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

  if (!mounted) {
    return <aside className="bg-[#0A0A0A] border-l border-white/5 flex flex-col h-full relative z-50" />;
  }

  return (
    <aside className="bg-[#0A0A0A] border-white/5 flex flex-col h-full relative z-50 shadow-2xl overflow-hidden text-white">
      
      {/* SECTION 1: NODE PROPERTIES */}
      <div className="p-4 border-b border-white/5 bg-[#0f0f0f] min-h-[280px]">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 size={14} className="text-purple-400" />
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
            Node Properties
          </h3>
        </div>
        
        {selectedNode ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-1 duration-200">
            <div>
              <label className="text-[9px] font-bold text-gray-500 uppercase">Node Identity</label>
              <p className="text-[10px] font-mono text-purple-300/60 truncate bg-white/5 p-2 rounded-lg mt-1 border border-white/5">
                {selectedNode.id}
              </p>
            </div>

            {selectedNode.type === 'textNode' && (
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-purple-400 uppercase">System Prompt / Input</label>
                <textarea
                  /* 🚀 FIXED: resize-none ensures height cannot be adjusted by user */
                  className="w-full p-3 text-xs bg-[#141414] border border-white/10 rounded-xl h-40 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none shadow-inner text-white"
                  value={selectedNode.data.userMessage || ''}
                  onChange={(e) => updateNodeData(selectedNode.id, { userMessage: e.target.value })}
                  placeholder="Enter system instructions here..."
                />
              </div>
            )}

            {selectedNode.type === 'llmNode' && (
              <div className="space-y-2 flex flex-col">
                <label className="text-[9px] font-bold text-purple-500 uppercase">Gemini Output</label>
               
                <div className="p-3 bg-[#050505] text-gray-200 text-[11px] leading-relaxed rounded-xl shadow-lg font-medium border border-white/5 overflow-y-auto max-h-[50vh] scrollbar-hide">
                  {selectedNode.data.result || "// Run the workflow to see AI response"}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-40 flex flex-col items-center justify-center text-center opacity-40">
            <p className="text-[11px] text-gray-500 italic px-6">
              Select a node on the canvas to view or edit its properties.
            </p>
          </div>
        )}
      </div>

      {/* SECTION 2: EXECUTION HISTORY */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col scrollbar-hide">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <History size={14} className="text-purple-400" />
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              Run History
            </h3>
          </div>
          <button
            type="button"
            onClick={fetchHistory}
            disabled={loading}
            className="text-[9px] font-bold text-purple-400 px-2 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 transition-all active:scale-90 flex items-center gap-1"
          >
            <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
            {loading ? 'SYNCING...' : 'REFRESH'}
          </button>
        </div>

        <div className="space-y-2">
          {history.length === 0 ? (
            <div className="py-10 text-center border-2 border-dashed border-white/5 rounded-xl">
              <p className="text-[10px] text-gray-600 italic">No past runs found.</p>
            </div>
          ) : (
            history.map((run) => (
              <button
                key={run.id}
                onClick={() => handleHistoryClick(run.id)}
                className="w-full text-left p-3 rounded-xl border border-white/5 bg-[#141414] hover:bg-[#1A1A1A] hover:border-purple-500/30 transition-all border-l-4 border-l-purple-500 group shadow-sm active:scale-[0.98]"
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${run.status === 'SUCCESS' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                    <span className="text-[10px] font-bold text-gray-300 uppercase">{run.status}</span>
                  </div>
                  <span className="text-[9px] text-gray-500 font-medium">
                    {new Date(run.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-[9px] text-gray-600 font-mono truncate">ID: {run.id.slice(-12)}</div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="p-3 bg-[#0f0f0f] border-t border-white/5 text-center flex items-center justify-center gap-2">
        <Database size={10} className="text-purple-500" />
        <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">
          Neon Cloud DB Connected
        </p>
      </div>
    </aside>
  );
}
