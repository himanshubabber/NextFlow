import { create } from 'zustand';
import { 
  Connection, Edge, EdgeChange, Node, NodeChange, 
  addEdge, applyNodeChanges, applyEdgeChanges 
} from 'reactflow';

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

  onNodesChange: (changes) => {
    const nextNodes = applyNodeChanges(changes, get().nodes);
    set({ nodes: nextNodes });
    const selection = changes.find((c) => c.type === 'select' && c.selected);
    if (selection && 'id' in selection) {
      set({ selectedNode: nextNodes.find(n => n.id === selection.id) || null });
    }
  },

  onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),

  // ✅ CORRECTED: Data Transfer Logic added to onConnect
  onConnect: (params) => {
    const { nodes, edges } = get();
    const sourceNode = nodes.find((n) => n.id === params.source);
    
    // Create new edges
    const newEdges = addEdge({ ...params, animated: true }, edges);

    // If source has data, push it to target and refresh the nodes array
    if (sourceNode?.data?.previewUrl) {
      const nextNodes = nodes.map((node) => {
        if (node.id === params.target) {
          return {
            ...node,
            data: { ...node.data, previewUrl: sourceNode.data.previewUrl }
          };
        }
        return node;
      });
      set({ nodes: nextNodes, edges: newEdges });
    } else {
      set({ edges: newEdges });
    }
  },

  setNodes: (update) => set((state) => ({ 
    nodes: typeof update === 'function' ? update(state.nodes) : update 
  })),

  setEdges: (update) => set((state) => ({ 
    edges: typeof update === 'function' ? update(state.edges) : update 
  })),
  
  setWorkflowId: (id) => set({ workflowId: id }),
  setSelectedNode: (node) => set({ selectedNode: node }),

  updateNodeData: (nodeId, newData) => set((state) => {
    const updatedNodes = state.nodes.map((node) => 
      node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node
    );
    const updatedSelectedNode = state.selectedNode?.id === nodeId 
      ? updatedNodes.find(n => n.id === nodeId) || null
      : state.selectedNode;
    return { nodes: updatedNodes, selectedNode: updatedSelectedNode };
  }),
}));

export default useFlowStore;
