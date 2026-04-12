import { create } from 'zustand';
import { 
  Connection, Edge, EdgeChange, Node, NodeChange, 
  addEdge, applyNodeChanges, applyEdgeChanges 
} from 'reactflow';

// --- TS Interface for Galaxy AI Flow ---
interface FlowState {
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  workflowId: string | null;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  setNodes: (update: Node[] | ((nds: Node[]) => Node[])) => void;
  setEdges: (update: Edge[] | ((eds: Edge[]) => Edge[])) => void;
  setWorkflowId: (id: string | null) => void;
  setSelectedNode: (node: Node | null) => void;
  updateNodeData: (nodeId: string, newData: any) => void;
}

const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  workflowId: null,

  // Handles basic node movements and selections
  onNodesChange: (changes) => {
    const nextNodes = applyNodeChanges(changes, get().nodes);
    set({ nodes: nextNodes });
    
    const selection = changes.find((c) => c.type === 'select' && c.selected);
    if (selection && 'id' in selection) {
      set({ selectedNode: nextNodes.find(n => n.id === selection.id) || null });
    }
  },

  // Handles edge (wire) removals or changes
  onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),

  // REACTIVE CONNECTION: Automatically pushes source data to target when connected
  onConnect: (params) => {
    const { nodes, edges } = get();
    const sourceNode = nodes.find((n) => n.id === params.source);
    
    // Auto-link media data if source already has it
    if (sourceNode?.data?.fileContent || sourceNode?.data?.videoUrl) {
      get().updateNodeData(params.target!, {
        fileContent: sourceNode.data.fileContent || null,
        videoUrl: sourceNode.data.videoUrl || null,
        fileType: sourceNode.data.fileType || 'image/jpeg'
      });
    }

    set({ 
      edges: addEdge({ 
        ...params, 
        animated: true, 
        style: { stroke: '#8b5cf6', strokeWidth: 2 } 
      }, edges) 
    });
  },

  //DYNAMIC PROPAGATION: When data changes in one node, it flows to all connected nodes
  updateNodeData: (nodeId, newData) => set((state) => {
    // 1. Update the immediate node data
    const updatedNodes = state.nodes.map((node) => 
      node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node
    );

    // 2. Optimized Propagation: Sync to downstream targets
    const connectedEdges = state.edges.filter(e => e.source === nodeId);
    const targetIds = new Set(connectedEdges.map(e => e.target));

    const finalNodes = updatedNodes.map(node => {
      if (targetIds.has(node.id)) {
        return {
          ...node,
          data: {
            ...node.data,
            // Sync media keys only
            fileContent: newData.fileContent ?? node.data.fileContent,
            videoUrl: newData.videoUrl ?? node.data.videoUrl,
            fileType: newData.fileType ?? node.data.fileType
          }
        };
      }
      return node;
    });

    return {
      nodes: finalNodes,
      selectedNode: state.selectedNode?.id === nodeId 
        ? { ...state.selectedNode, data: { ...state.selectedNode.data, ...newData } }
        : state.selectedNode
    };
  }),

  //  Standard Setters
  setNodes: (update) => set((state) => ({ 
    nodes: typeof update === 'function' ? update(state.nodes) : update 
  })),

  setEdges: (update) => set((state) => ({ 
    edges: typeof update === 'function' ? update(state.edges) : update 
  })),
  
  setWorkflowId: (id) => set({ workflowId: id }),
  setSelectedNode: (node) => set({ selectedNode: node }),
}));

export default useFlowStore;
